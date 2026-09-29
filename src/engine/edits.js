// User edits to a facility's design data. Stored as a flat map of paths → values, e.g.
//   { 'sys.K': 115, 'sys.room.l': 25, 'fire.qMax': 2000, 'pump.gpm': 1500, 'tank': 300 }
// 'sys.*' → fire-protection system, 'fire.*' → fire scenario, 'comp.*' → compartment,
// 'pump.*' / 'tank' → equipment overrides applied after the design calculation, 'ambient' → °C.
import { designSystem, designPumps, BAR_PER_M } from './design.js';

function setPath(obj, path, value) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) { o[parts[i]] = { ...(o[parts[i]] || {}) }; o = o[parts[i]]; }
  o[parts[parts.length - 1]] = value;
}

export function applyEdits(fac, sc, edits = {}) {
  const sys = { ...fac.system, ...(sc.override || {}) };
  const fire = { ...sc.fire };
  const comp = sc.compartment ? { ...sc.compartment } : undefined;
  const tgt = { sys, fire, comp };
  for (const [k, v] of Object.entries(edits)) {
    if (v === '' || v === null || v === undefined || Number.isNaN(v)) continue;
    const [root, ...rest] = k.split('.');
    if (tgt[root] && rest.length) setPath(tgt[root], rest.join('.'), v);
  }
  if (sys.prv === 0) sys.prv = null;
  if (sys.standpipe && edits['sys.elevation'] !== undefined) sys.standpipe = { ...sys.standpipe };
  const effFac = { ...fac, system: sys, ambient: edits.ambient ?? fac.ambient };
  const effSc = { ...sc, override: undefined, fire, compartment: comp };
  return { fac: effFac, sc: effSc };
}

/** Design calculation + optional pump / tank overrides chosen by the user. */
export function designWithEdits(sys, edits = {}) {
  const d = designSystem(sys);
  if (d.pumps && (edits['pump.gpm'] || edits['pump.P'])) {
    const base = d.pumps;
    d.pumps = designPumps(base.rated * base.count, base.ratedP + base.suctionP, base.suctionP, base.jockeyFlow / 0.8, {
      ratedGpm: edits['pump.gpm'] || undefined, ratedP: edits['pump.P'] || undefined, count: edits['pump.count'] || undefined,
    });
  }
  if (edits.tank) { if (d.type === 'foam') d.water = +edits.tank; else if (d.type === 'sprinkler') d.tank = +edits.tank; }
  d.checks = complianceChecks(sys, d);
  return d;
}

/** NFPA compliance checks shown on the Design Data page. */
export function complianceChecks(sys, d) {
  const c = [];
  const add = (ok, en, ar) => c.push({ ok, en, ar });
  if (d.type === 'sprinkler') {
    const cov = sys.spacing * sys.spacing;
    const maxCov = sys.esfr ? 9.3 : ({ LH: 20.9, OH1: 12.1, OH2: 12.1, EH1: 9.3, EH2: 9.3 })[sys.hazard];
    const maxS = sys.esfr ? 3.7 : (sys.hazard === 'LH' || sys.hazard.startsWith('OH') ? 4.6 : 3.7);
    add(cov <= maxCov + 1e-6, `Coverage per sprinkler ${cov.toFixed(1)} m² ≤ ${maxCov} m² (NFPA 13)`, `مساحة تغطية الرشاش ${cov.toFixed(1)} م² ≤ ${maxCov} م² (NFPA 13)`);
    add(sys.spacing <= maxS + 1e-6, `Spacing ${sys.spacing} m ≤ ${maxS} m`, `التباعد ${sys.spacing} م ≤ ${maxS} م`);
    add(sys.spacing >= 1.8, `Spacing ${sys.spacing} m ≥ 1.8 m (avoid cold soldering)`, `التباعد ${sys.spacing} م ≥ 1.8 م (تجنب تبريد الرشاش المجاور)`);
    add(d.pHead >= 0.5, `Remote sprinkler pressure ${d.pHead} bar ≥ 0.5 bar (7 psi)`, `ضغط أبعد رشاش ${d.pHead} بار ≥ 0.5 بار`);
    const pumpP = d.pumps.churnP + d.pumps.suctionP;
    const floorStatic = pumpP - sys.elevation * BAR_PER_M;
    add(!!sys.prv || floorStatic <= 12.1, `Static pressure at fire floor ${floorStatic.toFixed(1)} bar ≤ 12.1 bar (175 psi)${sys.prv ? ' – PRV fitted' : ''}`,
      `الضغط الساكن في طابق الحريق ${floorStatic.toFixed(1)} بار ≤ 12.1 بار${sys.prv ? ' – يوجد صمام خفض ضغط' : ''}`);
    add(d.pumps.rated * d.pumps.count * 1.5 >= d.sprFlow, `Pump 150 % capacity ≥ sprinkler demand ${d.sprFlow} L/min`, `سعة المضخة عند 150% ≥ طلب الرشاشات ${d.sprFlow} ل/د`);
    add(d.pumps.ratedP + d.pumps.suctionP >= d.demandP * 0.98, `Pump rated pressure ${d.pumps.ratedP} bar ≥ demand ${d.demandP} bar`, `الضغط المقنن للمضخة ${d.pumps.ratedP} بار ≥ الطلب ${d.demandP} بار`);
    const need = Math.ceil(((d.sprFlow + d.hose) * d.duration) / 1000);
    add(d.tank >= need, `Water storage ${d.tank} m³ ≥ ${need} m³ required`, `تخزين المياه ${d.tank} م³ ≥ ${need} م³ مطلوبة`);
    add(sys.response !== 'SR' || sys.hazard !== 'LH', 'Quick-response sprinklers in light hazard (NFPA 13)', 'رشاشات سريعة الاستجابة في الخطورة الخفيفة');
  } else if (d.type === 'cleanAgent') {
    add(d.concentration <= d.noael, `Design concentration ${d.concentration} % ≤ NOAEL 9 % (occupied space)`, `تركيز التصميم ${d.concentration}% ≤ 9% (NOAEL)`);
    add(d.concentration >= 6.25, `Concentration ${d.concentration} % ≥ Class A minimum ≈ 6.25–7 %`, `التركيز ${d.concentration}% ≥ الحد الأدنى للفئة A`);
    add(d.preDischarge >= 10, `Pre-discharge delay ${d.preDischarge} s allows evacuation`, `تأخير ما قبل التفريغ ${d.preDischarge} ث يسمح بالإخلاء`);
  } else if (d.type === 'foam') {
    const min = d.mode === 'rimSeal' ? 12.2 : d.mode === 'fullSurface' ? 4.1 : 6.5;
    add(d.rate >= min, `Application rate ${d.rate} ≥ ${min} L/min·m² (NFPA 11/409)`, `معدل الاستخدام ${d.rate} ≥ ${min} ل/د·م²`);
    const minT = d.mode === 'rimSeal' ? 20 : d.mode === 'fullSurface' ? 55 : 10;
    add(d.duration >= minT, `Discharge time ${d.duration} min ≥ ${minT} min`, `زمن التفريغ ${d.duration} د ≥ ${minT} د`);
    add(d.pumps.rated * d.pumps.count * 1.5 >= d.totalFlow, `Pump 150 % capacity ≥ demand ${d.totalFlow} L/min`, `سعة المضخة عند 150% ≥ الطلب ${d.totalFlow} ل/د`);
  }
  return c;
}
