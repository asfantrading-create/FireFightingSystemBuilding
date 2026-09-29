import { t, tr, getLang } from '../i18n.js';
import { toUS } from '../engine/design.js';

export const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
export const mmss = (s) => {
  if (s === null || s === undefined || !Number.isFinite(s)) return '—';
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
export const hrrStr = (q) => (q >= 1000 ? [fmt(q / 1000, q >= 100000 ? 0 : 1), 'MW'] : [fmt(q, 0), 'kW']);

function pumpState(s, d) {
  const on = [];
  if (s.main > 0.05) on.push(`${t('electric')}${d.pumps?.count > 1 ? ` ×${d.pumps.count}` : ''}`);
  if (s.diesel > 0.05) on.push(`${t('diesel')}${d.pumps?.count > 1 ? ` ×${d.pumps.count}` : ''}`);
  if (s.jockey > 0) on.push(t('jockey'));
  return on;
}

const firstEvent = (tl, keys, tNow) => tl.events.find((e) => keys.includes(e.key) && e.t <= tNow);

/** Label value + severity for a component metric. */
export function metricValue(key, s, ctx) {
  const { design: d, tl, time, fac } = ctx;
  switch (key) {
    case 'tank': {
      const cap = d.tank ?? d.water;
      return { v: `${fmt(s.tank, 0)} m³`, level: s.tank < 0.25 * cap ? 'alarm' : s.tank < 0.98 * cap ? 'warn' : 'ok' };
    }
    case 'pump': {
      const on = pumpState(s, d);
      return on.length ? { v: `${on.join(' + ')} · ${fmt(s.Q, 0)} L/min`, level: s.main > 0.05 || s.diesel > 0.05 ? 'warn' : 'ok' } : { v: `${t('sStandby')} · ${fmt(s.P, 1)} bar`, level: 'ok' };
    }
    case 'flow': return { v: `${fmt(s.Qspr + s.Qhose, 0)} L/min`, level: s.Qspr > 5 ? 'warn' : 'ok' };
    case 'zones': return { v: `${d.standpipe?.zones ?? 1} ${t('zones')}`, level: 'ok' };
    case 'heads': return { v: `${fmt(s.heads, 0)} open · ${fmt(s.Pfloor, 1)} bar`, level: s.heads > 0 ? 'alarm' : 'ok' };
    case 'fdc': return firstEvent(tl, ['brigadeArrived'], time) ? { v: t('sBrigade'), level: 'warn' } : { v: t('sStandby'), level: 'ok' };
    case 'hose': return { v: `${fmt(s.Qhose, 0)} L/min`, level: s.Qhose > 5 ? 'warn' : 'ok' };
    case 'alarm': {
      const a = tl.events.filter((e) => e.t <= time && e.level === 'alarm');
      return a.length ? { v: t('sAlarm'), level: 'alarm' } : { v: t('sNormal'), level: 'ok' };
    }
    case 'agentMass': return { v: `${fmt(s.concentrate, 0)} kg`, level: s.concentrate < d.W * 0.99 ? 'warn' : 'ok' };
    case 'agent': return { v: `${fmt(s.agent, 2)} %`, level: s.agent > 0.1 ? 'warn' : 'ok' };
    case 'o2': return { v: `O₂ ${fmt(s.o2, 1)} %`, level: s.o2 < 20 ? 'warn' : 'ok' };
    case 'release': {
      const pre = firstEvent(tl, ['preDischarge'], time), dis = firstEvent(tl, ['discharge'], time);
      if (dis) return { v: t('sDischarged'), level: 'alarm' };
      if (pre) {
        const abortE = tl.events.find((e) => e.key === 'discharge');
        const left = abortE ? Math.max(0, abortE.t - time) : 0;
        return { v: `${t('sCountdown')} ${fmt(left, 0)} s`, level: 'alarm' };
      }
      return { v: t('sStandby'), level: 'ok' };
    }
    case 'hrr': { const [v, u] = hrrStr(s.hrr); return { v: `${v} ${u}`, level: s.hrr > 2 ? 'alarm' : 'ok' }; }
    case 'foam': return { v: `${fmt(s.foam, 0)} L/min`, level: s.foam > 5 ? 'warn' : 'ok' };
    case 'cooling': return { v: `${fmt(s.Qhose, 0)} L/min`, level: s.Qhose > 5 ? 'warn' : 'ok' };
    case 'valve': return firstEvent(tl, ['delugeOpen'], time) && !firstEvent(tl, ['delugeClosed'], time) ? { v: t('sOpen'), level: 'alarm' } : { v: t('sClosed'), level: 'ok' };
    case 'static':
    default:
      return { v: fac.system.kind === 'foam' ? '110 %' : 'N+1', level: 'ok' };
  }
}

/** KPI tiles per system kind. */
export function kpis(s, ctx) {
  const { design: d, tl } = ctx;
  const kind = ctx.fac.system.kind;
  const [hv, hu] = hrrStr(s.hrr);
  const sum = tl.summary;
  const lvl = (c) => (c ? 'alarm' : '');
  if (kind === 'cleanAgent') {
    return [
      { k: t('kHrr'), v: hv, u: hu, c: lvl(s.hrr > 2) },
      { k: t('kAgent'), v: fmt(s.agent, 2), u: '%', c: s.agent >= d.extinguishing ? '' : s.agent > 0 ? 'warn' : '' },
      { k: t('kO2'), v: fmt(s.o2, 1), u: '%' },
      { k: t('kAgentMass'), v: fmt(s.concentrate, 0), u: 'kg' },
      { k: t('kGasT'), v: fmt(s.gasT, 0), u: '°C', c: s.gasT > 60 ? 'warn' : '' },
      { k: t('kDetect'), v: mmss(sum.tDetect !== null && ctx.time >= sum.tDetect ? sum.tDetect : null), u: 'min:s' },
    ];
  }
  if (kind === 'foam') {
    return [
      { k: t('kHrr'), v: hv, u: hu, c: lvl(s.hrr > 2) },
      { k: t('kFoam'), v: fmt(s.foam, 0), u: 'L/min' },
      { k: t('kCoverage'), v: fmt(s.coverage * 100, 0), u: '%' },
      { k: t('kConc'), v: fmt(s.concentrate, 2), u: 'm³', c: s.concentrate < 0.5 ? 'warn' : '' },
      { k: t('kP'), v: fmt(s.P, 2), u: 'bar' },
      { k: t('kTank'), v: fmt(s.tank, 0), u: 'm³' },
    ];
  }
  return [
    { k: t('kHrr'), v: hv, u: hu, c: lvl(s.hrr > 2) },
    { k: t('kGasT'), v: fmt(s.gasT, 0), u: '°C', c: s.gasT > 60 ? 'warn' : '' },
    { k: t('kP'), v: fmt(s.P, 2), u: 'bar' },
    { k: t('kQ'), v: fmt(s.Q, 0), u: 'L/min' },
    { k: t('kHeads'), v: fmt(s.heads, 0), u: `/${d.heads}`, c: s.heads > 0 ? 'warn' : '' },
    { k: t('kTank'), v: fmt(s.tank, 0), u: 'm³' },
  ];
}

/** Detailed rows for the "Selected component" card. */
export function componentDetails(id, key, s, ctx) {
  const { design: d, fac, sc } = ctx;
  const sys = { ...fac.system, ...(sc.override || {}) };
  const rows = [];
  const add = (k, v) => rows.push([k, v]);
  const ar = getLang() === 'ar';
  const L = (en, a) => (ar ? a : en);
  const p = d.pumps;
  switch (key) {
    case 'pump':
      add(L('Rated duty', 'نقطة التصميم'), `${p.count > 1 ? p.count + ' × ' : ''}${fmt(p.rated, 0)} L/min @ ${p.ratedP} bar`);
      add(L('US rating', 'التصنيف الأمريكي'), `${p.count > 1 ? p.count + ' × ' : ''}${p.ratedGpm} gpm @ ${toUS(p.ratedP, 'bar')}`);
      add(L('Churn / 150 % point', 'نقطة الإغلاق / 150%'), `${p.churnP} bar / ${p.at150Pct} bar (${Math.round(p.at150PctRatio * 100)} %)`);
      add(L('Jockey start / stop', 'تشغيل / إيقاف الجوكي'), `${p.jockeyStart} / ${p.jockeyStop} bar`);
      add(L('Electric start', 'تشغيل الكهربائية'), `${p.mainStart} bar`);
      add(L('Diesel start', 'تشغيل الديزل'), `${p.dieselStart} bar`);
      add(L('Motor rating (approx.)', 'قدرة المحرك (تقريبية)'), `${p.motorKw} kW`);
      add(L('Electric pump', 'المضخة الكهربائية'), s.main > 0.05 ? `${t('sRunning')} ${fmt(s.main * 100, 0)} %` : t('sStandby'));
      add(L('Diesel pump', 'مضخة الديزل'), s.diesel > 0.05 ? `${t('sRunning')} ${fmt(s.diesel * 100, 0)} %` : t('sStandby'));
      add(L('Jockey pump', 'مضخة الجوكي'), s.jockey ? t('sRunning') : t('sOff'));
      add(L('Discharge pressure', 'ضغط الطرد'), `${fmt(s.P, 2)} bar`);
      add(L('Flow', 'التدفق'), `${fmt(s.Q, 0)} L/min`);
      break;
    case 'tank':
      add(L('Required storage', 'السعة المطلوبة'), `${d.tank ?? d.water} m³`);
      add(L('Current volume', 'الحجم الحالي'), `${fmt(s.tank, 1)} m³`);
      add(L('Duration basis', 'أساس المدة'), `${d.duration ?? sys.waterDuration} min`);
      add(L('Water discharged', 'المياه المصروفة'), `${fmt(s.water, 1)} m³`);
      break;
    case 'heads':
      add(L('Hazard', 'التصنيف'), sys.esfr ? 'ESFR' : sys.hazard);
      add(L('Sprinkler', 'الرشاش'), `K${sys.K} (${sys.response}) · ${sys.Tact} °C · RTI ${sys.RTI}`);
      add(L('Spacing', 'التباعد'), `${sys.spacing} × ${sys.spacing} m`);
      add(L('Design', 'التصميم'), `${d.density} mm/min / ${d.area} m²`);
      add(L('Design heads', 'رشاشات التصميم'), `${d.heads} × ${d.qHead} L/min @ ${d.pHead} bar`);
      add(L('Open heads', 'الرشاشات المفتوحة'), fmt(s.heads, 0));
      add(L('Floor pressure', 'ضغط الطابق'), `${fmt(s.Pfloor, 2)} bar${sys.prv ? ` (PRV ${sys.prv} bar)` : ''}`);
      add(L('Sprinkler flow', 'تدفق الرشاشات'), `${fmt(s.Qspr, 0)} L/min`);
      add(L('Ceiling gas', 'غاز السقف'), `${fmt(s.gasT, 0)} °C`);
      break;
    case 'flow':
      add(L('Main size', 'قطر الخط الرئيسي'), `DN${sys.mainDia} · C = 120`);
      add(L('Friction at design', 'الاحتكاك عند التصميم'), `${d.mainLoss} bar`);
      add(L('Static head', 'الضغط الاستاتيكي'), `${d.elevLoss} bar (${sys.elevation} m)`);
      if (d.standpipe) add(L('Standpipe demand', 'طلب الأنابيب القائمة'), `${d.standpipe.flow} L/min @ ${d.standpipe.topP} bar`);
      add(L('Current flow', 'التدفق الحالي'), `${fmt(s.Qspr + s.Qhose, 0)} L/min`);
      break;
    case 'zones':
      add(L('Pressure zones', 'مناطق الضغط'), `${d.standpipe?.zones ?? 1}`);
      add(L('Zone height', 'ارتفاع المنطقة'), `${d.standpipe?.zoneHeight ?? '—'} m`);
      add(L('Max static at outlet', 'أقصى ضغط ساكن'), '12.1 bar (175 psi)');
      add(L('Arrangement', 'الترتيب'), L('Transfer tank + booster pumps per mechanical floor', 'خزان نقل ومضخات تعزيز في كل طابق ميكانيكي'));
      break;
    case 'agentMass': case 'agent': case 'o2': case 'release':
      add(L('Protected volume', 'الحجم المحمي'), `${d.volume} m³`);
      add(L('Specific volume S', 'الحجم النوعي S'), `${d.S} m³/kg`);
      add(L('Design concentration', 'تركيز التصميم'), `${d.concentration} % (NOAEL ${d.noael} %)`);
      add(L('Agent quantity', 'كمية المادة'), `${d.W} kg`);
      add(L('Cylinders', 'الأسطوانات'), `${d.cylinders} × ${d.cylSize} L`);
      add(L('Nozzles', 'الفوهات'), `${d.nozzles}`);
      add(L('Concentration now', 'التركيز الآن'), `${fmt(s.agent, 2)} %`);
      add(L('Oxygen now', 'الأكسجين الآن'), `${fmt(s.o2, 1)} %`);
      add(L('Cylinder pressure', 'ضغط الأسطوانة'), `${fmt(s.P, 1)} bar`);
      break;
    case 'foam': case 'cooling': case 'valve':
      add(L('Application rate', 'معدل الاستخدام'), `${d.rate} L/min·m²`);
      add(L('Protected area', 'المساحة المحمية'), `${d.area} m²`);
      add(L('Solution demand', 'طلب المحلول'), `${fmt(d.solution, 0)} L/min`);
      add(L('Outlets', 'المخارج'), `${d.nozzles} × K${d.nozzleK} @ ${d.nozzleP} bar`);
      add(L('Concentrate', 'المركّز'), `${d.pct} % · ${d.concentrate} m³`);
      add(L('Foam solution now', 'محلول الرغوة الآن'), `${fmt(s.foam, 0)} L/min`);
      add(L('Cooling / monitors', 'التبريد / المدافع'), `${fmt(s.Qhose, 0)} L/min`);
      add(L('Coverage', 'التغطية'), `${fmt(s.coverage * 100, 0)} %`);
      break;
    case 'hrr':
      add(L('Heat release', 'انطلاق الحرارة'), hrrStr(s.hrr).join(' '));
      add(L('Growth', 'النمو'), sc.fire.growth);
      add(L('Peak (fuel-limited)', 'الذروة (محدودة بالوقود)'), hrrStr(sc.fire.qMax).join(' '));
      break;
    default: {
      const v = metricValue(key, s, ctx);
      add(L('Status', 'الحالة'), v.v);
    }
  }
  return rows;
}
