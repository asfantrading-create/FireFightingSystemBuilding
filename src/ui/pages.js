import Chart from 'chart.js/auto';
import { t, tr, getLang } from '../i18n.js';
import { LESSONS } from '../data/lessons.js';
import { QUIZ } from '../data/quiz.js';
import { CITIES, OCCUPANCIES, FAULTS } from '../data/facilities.js';
import { HAZARDS, toUS } from '../engine/design.js';
import { FIELDS, SAMPLE_DT } from '../engine/sim.js';
import { fmt, mmss, hrrStr } from './metrics.js';
import { licenseStatus, isSupervisor } from './license.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const ar = () => getLang() === 'ar';
const L = (en, a) => (ar() ? a : en);
let helpers = {};
let current = 'twin';
let charts = [];
let lastChart = 0;

export const getHelpers = () => helpers_;
let helpers_ = {};
export function show(page, c, h) {
  helpers_ = h;
  helpers = h;
  current = page;
  if (page === 'dash') renderDashboard(c);
  if (page === 'data') renderData(c);
  if (page === 'learn') renderLearn();
  if (page === 'quiz') renderQuizStart();
  if (page === 'class') renderClassroom();
  if (page === 'reports') renderReports(c);
}
export function onTick(c) {
  if (current === 'dash' && performance.now() - lastChart > 500) { lastChart = performance.now(); updateCharts(c); }
}
export function onFacilityChanged(c) {
  if (current === 'dash') renderDashboard(c);
  if (current === 'data') renderData(c);
}
export function onThemeChanged(c) { if (current === 'dash') renderDashboard(c); }

// ───────────────────────── dashboard
function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function series(tl, field, tNow, scale = 1) {
  const out = [];
  const step = Math.max(1, Math.round(5 / SAMPLE_DT));
  const n = Math.min(tl.n, Math.floor(tNow / SAMPLE_DT) + 1);
  for (let i = 0; i < n; i += step) out.push({ x: (i * SAMPLE_DT) / 60, y: tl.data[field][i] * scale });
  if (n > 0) out.push({ x: ((n - 1) * SAMPLE_DT) / 60, y: tl.data[field][n - 1] * scale });
  return out;
}

const PALETTE = { red: '#e0452b', orange: '#e38a14', blue: '#2a78d6', teal: '#119c8d', violet: '#7a5cd6', grey: '#7b8794' };

function chartDefs(c) {
  const kind = c.fac.system.kind;
  const defs = [{
    id: 'fire', title: t('chFire'), y: [{ id: 'y', title: 'kW' }, { id: 'y1', title: '°C', right: true }],
    ds: [{ label: t('kHrr') + ' (kW)', f: 'hrr', color: PALETTE.red, fill: true }, { label: t('kGasT') + ' (°C)', f: 'gasT', color: PALETTE.orange, axis: 'y1' }],
  }];
  if (kind === 'cleanAgent') {
    defs.push({ id: 'agent', title: t('chAgent'), y: [{ id: 'y', title: '%' }], ds: [{ label: t('kAgent') + ' (%)', f: 'agent', color: PALETTE.violet, fill: true }, { label: t('kO2') + ' (%)', f: 'o2', color: PALETTE.blue }] });
    defs.push({ id: 'cyl', title: t('kAgentMass'), y: [{ id: 'y', title: 'kg' }, { id: 'y1', title: 'bar', right: true }], ds: [{ label: t('kAgentMass') + ' (kg)', f: 'concentrate', color: PALETTE.red }, { label: 'bar', f: 'P', color: PALETTE.grey, axis: 'y1' }] });
  } else {
    defs.push({ id: 'hyd', title: t('chHyd'), y: [{ id: 'y', title: 'bar' }, { id: 'y1', title: 'L/min', right: true }],
      ds: [{ label: t('kP') + ' (bar)', f: 'P', color: PALETTE.blue }, { label: L('Outlet pressure (bar)', 'ضغط المخرج (بار)'), f: 'Pfloor', color: PALETTE.teal }, { label: t('kQ') + ' (L/min)', f: 'Q', color: PALETTE.orange, axis: 'y1' }] });
    defs.push({ id: 'pump', title: t('chPump'), pump: true });
    defs.push({ id: 'supply', title: t('chSupply'), y: [{ id: 'y', title: 'm³' }],
      ds: kind === 'foam'
        ? [{ label: t('kTank') + ' (m³)', f: 'tank', color: PALETTE.blue, fill: true }, { label: t('kCoverage') + ' (%)', f: 'coverage', color: PALETTE.teal, scale: 100 }, { label: t('kConc') + ' (m³)', f: 'concentrate', color: PALETTE.violet }]
        : [{ label: t('kTank') + ' (m³)', f: 'tank', color: PALETTE.blue, fill: true }, { label: t('kWater') + ' (m³)', f: 'water', color: PALETTE.teal }] });
  }
  return defs;
}

function renderDashboard(c) {
  charts.forEach((ch) => ch.destroy()); charts = [];
  const defs = chartDefs(c);
  $('dashInner').innerHTML = `<h1>${t('dashTitle')}</h1><p class="lead">${esc(tr(c.fac.name))} — ${esc(tr(c.sc.name))}</p>
    <div class="grid2">${defs.map((d) => `<div class="card"><h3>${esc(d.title)}</h3><div class="chart-box"><canvas id="ch_${d.id}"></canvas></div></div>`).join('')}</div>
    <div class="card" style="margin-top:14px"><h3>${t('summary')}</h3><div class="grid3" id="dashSummary"></div></div>`;
  const grid = css('--line'), text = css('--muted');
  Chart.defaults.color = text; Chart.defaults.font.family = 'Segoe UI, Tahoma, sans-serif';
  for (const d of defs) {
    const ctx = $(`ch_${d.id}`);
    if (d.pump) {
      const p = c.design.pumps;
      const a = (p.churnP - p.ratedP) / p.rated ** 2;
      const curve = [];
      for (let q = 0; q <= 1.6 * p.rated * p.count; q += (p.rated * p.count) / 20) curve.push({ x: q, y: p.churnP + p.suctionP - a * (q / p.count) ** 2 });
      charts.push(new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [
          { label: L('Pump curve', 'منحنى المضخة'), data: curve, showLine: true, borderColor: PALETTE.blue, pointRadius: 0, borderWidth: 2 },
          { label: L('Rated / 150 % points', 'النقطة المقننة / 150%'), data: [{ x: p.rated * p.count, y: p.ratedP + p.suctionP }, { x: 1.5 * p.rated * p.count, y: p.at150Pct + p.suctionP }], borderColor: PALETTE.grey, backgroundColor: PALETTE.grey, pointRadius: 4 },
          { label: L('Operating point', 'نقطة التشغيل'), data: [], borderColor: PALETTE.red, backgroundColor: PALETTE.red, pointRadius: 7 },
        ] },
        options: { animation: false, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'L/min' }, grid: { color: grid } }, y: { title: { display: true, text: 'bar' }, grid: { color: grid }, min: 0 } } },
      }));
      charts[charts.length - 1].$pump = true;
      continue;
    }
    const scales = { x: { type: 'linear', min: 0, max: c.tl.duration / 60, title: { display: true, text: 'min' }, grid: { color: grid } } };
    for (const y of d.y) scales[y.id] = { position: y.right ? 'right' : 'left', title: { display: true, text: y.title }, grid: { color: y.right ? 'transparent' : grid }, beginAtZero: true };
    charts.push(new Chart(ctx, {
      type: 'line',
      data: { datasets: d.ds.map((s) => ({ label: s.label, data: [], borderColor: s.color, backgroundColor: s.color + '22', fill: !!s.fill, yAxisID: s.axis || 'y', pointRadius: 0, borderWidth: 2, tension: 0.2, $f: s.f, $scale: s.scale || 1 })) },
      options: { animation: false, maintainAspectRatio: false, parsing: false, scales, plugins: { legend: { labels: { boxWidth: 12 } } } },
    }));
  }
  updateCharts(c);
}

function updateCharts(c) {
  for (const ch of charts) {
    if (ch.$pump) {
      ch.data.datasets[2].data = [{ x: c.sample.Q, y: c.sample.P }];
    } else {
      for (const ds of ch.data.datasets) ds.data = series(c.tl, ds.$f, c.time, ds.$scale);
    }
    ch.update('none');
  }
  const s = c.tl.summary;
  const el = $('dashSummary');
  if (el) {
    const items = [
      [t('kDetect'), mmss(s.tDetect)], [t('kAct'), mmss(s.tAct)],
      [L('Fire controlled', 'السيطرة على الحريق'), mmss(s.controlledT)],
      [L('Peak HRR', 'ذروة معدل الحرارة'), hrrStr(Math.max(...c.tl.data.hrr)).join(' ')],
      [L('Water / agent used', 'المياه / المادة المستخدمة'), c.fac.system.kind === 'cleanAgent' ? `${c.design.W} kg` : `${fmt(Math.max(...c.tl.data.water), 1)} m³`],
      [L('Events', 'الأحداث'), String(c.tl.events.length)],
    ];
    el.innerHTML = items.map(([k, v]) => `<div class="kpi"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('');
  }
}


// ───────────────────────── design-data editor
const PUMP_GPM = [250, 300, 400, 450, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
const F = (key, en, ar, unit, min, max, step, opts) => ({ key, en, ar, unit, min, max, step, opts });
function editorFields(c) {
  const kind = c.fac.system.kind, sys = c.fac.system;
  const fire = [
    F('fire.growth', 'Fire growth rate (t²)', 'معدل نمو الحريق', '', 0, 0, 0, ['slow', 'medium', 'fast', 'ultrafast']),
    F('fire.qMax', 'Peak heat release rate', 'ذروة معدل انطلاق الحرارة', 'kW', 20, 1000000, 10),
    F('ambient', 'Ambient temperature', 'درجة حرارة المحيط', '°C', -10, 55, 1),
  ];
  const equip = [
    F('pump.gpm', 'Fire pump rating (0 = auto)', 'تصنيف مضخة الحريق (0 = تلقائي)', 'gpm', 0, 5000, 0, [0, ...PUMP_GPM]),
    F('pump.P', 'Pump rated pressure (0 = auto)', 'الضغط المقنن للمضخة (0 = تلقائي)', 'bar', 0, 24, 0.5),
    F('pump.count', 'Number of duty pumps (0 = auto)', 'عدد المضخات العاملة (0 = تلقائي)', '', 0, 4, 1),
    F('tank', 'Water storage (0 = auto)', 'سعة خزان المياه (0 = تلقائي)', 'm³', 0, 20000, 5),
  ];
  if (kind === 'cleanAgent') {
    return [
      [L('Protected room', 'الغرفة المحمية'), [
        F('sys.room.l', 'Room length', 'طول الغرفة', 'm', 2, 100, 0.5), F('sys.room.w', 'Room width', 'عرض الغرفة', 'm', 2, 100, 0.5),
        F('sys.room.h', 'Room height', 'ارتفاع الغرفة', 'm', 2, 10, 0.1), F('sys.designTemp', 'Minimum design temperature', 'أدنى درجة حرارة تصميمية', '°C', 0, 50, 1),
        F('sys.concentration', 'Design concentration', 'تركيز التصميم', '%', 5, 10.5, 0.1), F('sys.preDischarge', 'Pre-discharge delay', 'تأخير ما قبل التفريغ', 's', 0, 120, 5)]],
      [L('Fire scenario', 'سيناريو الحريق'), fire],
    ];
  }
  if (kind === 'foam') {
    const geom = sys.mode === 'deluge'
      ? [F('sys.area', 'Protected area', 'المساحة المحمية', 'm²', 100, 20000, 10)]
      : [F('sys.tankD', 'Tank diameter', 'قطر الخزان', 'm', 5, 120, 0.5)];
    return [
      [L('Foam system', 'منظومة الرغوة'), [...geom,
        F('sys.rate', 'Application rate', 'معدل الاستخدام', 'L/min·m²', 1, 30, 0.1), F('sys.duration', 'Discharge time', 'زمن التفريغ', 'min', 5, 120, 1),
        F('sys.pct', 'Foam concentrate', 'نسبة المركّز', '%', 1, 6, 0, [1, 3, 6]), F('sys.cooling', 'Cooling water', 'مياه التبريد', 'L/min', 0, 30000, 10),
        F('sys.supplementary', 'Supplementary streams / monitors', 'الخطوط والمدافع الإضافية', 'L/min', 0, 20000, 10),
        F('sys.nozzleK', 'Outlet K-factor', 'معامل K للمخرج', 'L/min/√bar', 10, 2000, 1), F('sys.nozzleP', 'Outlet pressure', 'ضغط المخرج', 'bar', 0.5, 10, 0.1),
        F('sys.mainDia', 'Main pipe size', 'قطر الخط الرئيسي', 'mm', 0, 0, 0, [100, 150, 200, 250, 300, 350, 400]), F('sys.mainLength', 'Main pipe length', 'طول الخط الرئيسي', 'm', 10, 5000, 10),
        F('sys.elevation', 'Outlet elevation', 'ارتفاع المخرج', 'm', 0, 100, 0.5)]],
      [L('Fire scenario', 'سيناريو الحريق'), fire], [L('Pumps & water', 'المضخات والمياه'), equip],
    ];
  }
  const spr = [];
  if (sys.esfr) spr.push(F('sys.esfr.heads', 'ESFR design sprinklers', 'رشاشات تصميم ESFR', '', 4, 20, 1), F('sys.esfr.minP', 'ESFR minimum pressure', 'أدنى ضغط ESFR', 'bar', 0.5, 7, 0.1));
  else spr.push(F('sys.hazard', 'Occupancy hazard', 'تصنيف الخطورة', '', 0, 0, 0, ['LH', 'OH1', 'OH2', 'EH1', 'EH2']));
  spr.push(
    F('sys.K', 'Sprinkler K-factor', 'معامل K للرشاش', 'L/min/√bar', 40, 400, 0.1), F('sys.spacing', 'Sprinkler spacing (square)', 'التباعد بين الرشاشات', 'm', 1.8, 5, 0.1),
    F('sys.RTI', 'Response time index RTI', 'مؤشر زمن الاستجابة RTI', '(m·s)^½', 20, 400, 1), F('sys.Tact', 'Temperature rating', 'درجة التفعيل', '°C', 0, 0, 0, [57, 68, 74, 79, 93, 141]),
    F('sys.hose', 'Hose allowance', 'بدل الخراطيم', 'L/min', 0, 5000, 10), F('sys.duration', 'Water supply duration', 'مدة الإمداد', 'min', 10, 240, 5),
  );
  return [
    [L('Sprinkler system (NFPA 13)', 'منظومة الرشاشات (NFPA 13)'), spr],
    [L('Piping & building', 'الأنابيب والمبنى'), [
      F('sys.mainDia', 'Main pipe size', 'قطر الخط الرئيسي', 'mm', 0, 0, 0, [50, 65, 80, 100, 150, 200, 250, 300]), F('sys.mainLength', 'Main pipe length', 'طول الخط الرئيسي', 'm', 5, 3000, 5),
      F('sys.elevation', 'Fire floor elevation above pump', 'ارتفاع طابق الحريق عن المضخة', 'm', -30, 600, 0.5), F('sys.prv', 'Floor PRV setting (0 = none)', 'ضبط صمام خفض الضغط (0 = بدون)', 'bar', 0, 12, 0.5),
      F('comp.h', 'Ceiling height', 'ارتفاع السقف', 'm', 2.4, 20, 0.1), F('comp.w', 'Room length', 'طول الغرفة', 'm', 6, 60, 1), F('comp.d', 'Room width', 'عرض الغرفة', 'm', 6, 40, 1),
      F('fire.x', 'Fire position x', 'موقع الحريق x', 'm', 0.5, 60, 0.1), F('fire.z', 'Fire position y', 'موقع الحريق y', 'm', 0.5, 40, 0.1)]],
    [L('Fire scenario', 'سيناريو الحريق'), fire], [L('Pumps & water', 'المضخات والمياه'), equip],
  ];
}

function getPath(c, key) {
  const [root, ...rest] = key.split('.');
  let o = root === 'sys' ? c.fac.system : root === 'fire' ? c.sc.fire : root === 'comp' ? c.sc.compartment : null;
  if (key === 'ambient') return c.fac.ambient;
  if (key === 'tank') return 0;
  if (root === 'pump') return 0;
  for (const p of rest) o = o?.[p];
  if (o === undefined || o === null) {
    // values not stored on the system come from the design calculation (e.g. hose / duration by hazard)
    const d = c.design, last = rest[rest.length - 1];
    if (key === 'sys.prv') return 0;
    if (d && d[last] !== undefined) return d[last];
  }
  return o ?? '';
}

function renderEditor(c) {
  const edits = helpers_.getEdits?.() || {};
  const groups = editorFields(c);
  const input = (f) => {
    const cur = edits[f.key] ?? getPath(c, f.key);
    const changed = f.key in edits;
    const ctl = f.opts
      ? `<select data-k="${f.key}">${f.opts.map((o) => `<option value="${o}" ${String(o) === String(cur) ? 'selected' : ''}>${o === 0 ? 'auto' : o}</option>`).join('')}</select>`
      : `<input type="number" data-k="${f.key}" value="${cur === null ? 0 : cur}" min="${f.min}" max="${f.max}" step="${f.step}" />`;
    return `<label class="${changed ? 'changed' : ''}">${esc(L(f.en, f.ar))}${f.unit ? ` <span class="muted">(${esc(f.unit)})</span>` : ''}${ctl}</label>`;
  };
  return `<div class="card editor"><h3>✏️ ${L('Edit design data – your own values', 'تعديل بيانات التصميم – قيمك الخاصة')}</h3>
    <p class="muted" style="margin:0 0 10px">${L('Change any value, then run the simulation on your data. Changed fields are highlighted; values are saved per facility and scenario.',
      'غيّر أي قيمة ثم شغّل المحاكاة على بياناتك. الحقول المعدلة مميزة، وتُحفظ القيم لكل منشأة وسيناريو.')}</p>
    ${groups.map(([title, fields]) => `<h4>${esc(title)}</h4><div class="form-grid g3">${fields.map(input).join('')}</div>`).join('')}
    <div class="ed-actions no-print">
      <button class="btn primary" id="edRun">▶ ${L('Run simulation with my data', 'تشغيل المحاكاة ببياناتي')}</button>
      <button class="btn" id="edApply">✓ ${L('Recalculate', 'إعادة الحساب')}</button>
      <button class="btn" id="edReset">↺ ${L('Reset to reference design', 'استعادة التصميم المرجعي')}</button>
      <button class="btn" id="edExport">⬇ ${L('Export JSON', 'تصدير JSON')}</button>
      <label class="btn" style="display:inline-block">⬆ ${L('Import JSON', 'استيراد JSON')}<input type="file" id="edImport" accept=".json" hidden /></label>
    </div>
    <div id="edMsg"></div></div>`;
}

function collectEdits(c) {
  const out = {};
  const ref = {};
  document.querySelectorAll('.editor [data-k]').forEach((el) => {
    const k = el.dataset.k;
    const raw = el.value;
    const num = Number(raw);
    const v = raw !== '' && !Number.isNaN(num) ? num : raw;
    const base = getPath(c, k);
    ref[k] = base;
    // keep only values that differ from the reference or were already edited
    const prev = helpers_.getEdits?.() || {};
    if (String(v) !== String(base) || k in prev) out[k] = v;
  });
  // validate against ranges
  const errs = [];
  for (const [, fields] of editorFields(c)) {
    for (const f of fields) {
      if (!(f.key in out) || f.opts) continue;
      if (out[f.key] < f.min || out[f.key] > f.max) errs.push(`${L(f.en, f.ar)}: ${f.min} – ${f.max}`);
    }
  }
  if (out['fire.x'] !== undefined && c.sc.compartment && out['fire.x'] > (out['comp.w'] ?? c.sc.compartment.w)) errs.push(L('Fire must be inside the room', 'يجب أن يكون الحريق داخل الغرفة'));
  if (out['fire.z'] !== undefined && c.sc.compartment && out['fire.z'] > (out['comp.d'] ?? c.sc.compartment.d)) errs.push(L('Fire must be inside the room', 'يجب أن يكون الحريق داخل الغرفة'));
  for (const k of ['pump.gpm', 'pump.P', 'pump.count', 'tank']) if (out[k] === 0) delete out[k];
  return { out, errs };
}

function wireEditor(c) {
  const act = (run) => {
    const { out, errs } = collectEdits(c);
    if (errs.length) { $('edMsg').innerHTML = `<p class="err">✗ ${errs.map(esc).join('<br>')}</p>`; return; }
    helpers_.setEdits(out, run);
  };
  $('edRun').onclick = () => act(true);
  $('edApply').onclick = () => act(false);
  $('edReset').onclick = () => helpers_.setEdits({}, false);
  $('edExport').onclick = () => download(`${c.fac.id}_${c.sc.id}_design.json`, JSON.stringify({ facility: c.fac.id, scenario: c.sc.id, edits: helpers_.getEdits() }, null, 2), 'application/json');
  $('edImport').onchange = async (e) => {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      helpers_.setEdits(j.edits || j, false);
    } catch { $('edMsg').innerHTML = `<p class="err">✗ ${L('Invalid JSON file', 'ملف JSON غير صالح')}</p>`; }
  };
}

// ───────────────────────── design data
function renderData(c) {
  const d = c.design, f = c.fac, sys = { ...f.system, ...(c.sc.override || {}) };
  const row = (k, v, unit, us = true) => `<tr><td>${esc(k)}</td><td class="num">${esc(fmt(+v, Number.isInteger(+v) ? 0 : 2))} ${esc(unit)}</td><td class="us">${us && unit ? esc(toUS(+v, unit)) : ''}</td></tr>`;
  let basis = '';
  if (d.type === 'sprinkler') {
    basis = [
      [L('Occupancy hazard', 'تصنيف الخطورة'), sys.esfr ? 'ESFR (storage)' : `${sys.hazard} – ${tr(HAZARDS[sys.hazard].name)}`],
    ].map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${esc(v)}</td><td></td></tr>`).join('') +
      row(L('Design density', 'كثافة التصميم'), d.density, 'mm/min') + row(L('Design area', 'مساحة التصميم'), d.area, 'm²') +
      row(L('Sprinkler spacing', 'تباعد الرشاشات'), sys.spacing, 'm') + row(L('K-factor (metric)', 'معامل K'), sys.K, '', false) +
      row(L('Heads in design area', 'رشاشات منطقة التصميم'), d.heads, '', false) + row(L('Flow per head', 'التدفق لكل رشاش'), d.qHead, 'L/min') +
      row(L('Pressure at remote head', 'الضغط عند أبعد رشاش'), d.pHead, 'bar') + row(L('Sprinkler demand', 'طلب الرشاشات'), d.sprFlow, 'L/min') +
      row(L('Hose allowance', 'بدل الخراطيم'), d.hose, 'L/min') + row(L('Duration', 'المدة'), d.duration, 'min', false) +
      row(L('Demand at pump', 'الطلب عند المضخة'), d.demandP, 'bar') + row(L('Water storage', 'تخزين المياه'), d.tank, 'm³') +
      (d.standpipe ? row(L('Standpipe demand', 'طلب الأنابيب القائمة'), d.standpipe.flow, 'L/min') + row(L('Standpipe pressure', 'ضغط الأنابيب القائمة'), d.standpipe.topP, 'bar') : '');
  } else if (d.type === 'cleanAgent') {
    basis = row(L('Room volume', 'حجم الغرفة'), d.volume, 'm³') + row(L('Design temperature', 'درجة حرارة التصميم'), sys.designTemp, '°C', false) +
      row('S', d.S, 'm³/kg', false) + row(L('Design concentration', 'تركيز التصميم'), d.concentration, '%', false) +
      row(L('Agent quantity', 'كمية المادة'), d.W, 'kg', false) + row(L('Cylinders (180 L)', 'الأسطوانات (180 ل)'), d.cylinders, '', false) +
      row(L('Nozzles', 'الفوهات'), d.nozzles, '', false) + row(L('Discharge time', 'زمن التفريغ'), 10, 's', false) +
      row(L('Hold time', 'زمن الاحتفاظ'), d.holdTime, 'min', false) + row(L('Pre-discharge delay', 'تأخير ما قبل التفريغ'), d.preDischarge, 's', false);
  } else {
    basis = row(L('Protected area', 'المساحة المحمية'), d.area, 'm²') + row(L('Application rate', 'معدل الاستخدام'), d.rate, 'L/min·m²', false) +
      row(L('Discharge time', 'زمن التفريغ'), d.duration, 'min', false) + row(L('Foam solution', 'محلول الرغوة'), d.solution, 'L/min') +
      row(L('Cooling water', 'مياه التبريد'), d.cooling, 'L/min') + row(L('Supplementary streams', 'الخطوط الإضافية'), d.supplementary, 'L/min') +
      row(L('Total demand', 'الطلب الكلي'), d.totalFlow, 'L/min') + row(L('Concentrate', 'المركّز'), d.concentrate, 'm³') +
      row(L('Outlets', 'المخارج'), d.nozzles, '', false) + row(L('Demand pressure', 'ضغط الطلب'), d.demandP, 'bar') + row(L('Water storage', 'تخزين المياه'), d.water, 'm³');
  }
  const p = d.pumps;
  const pumps = p ? `<div class="card"><h3>${t('pumpSet')}</h3><table class="data">
      ${row(L('Rated flow (each)', 'التدفق المقنن (لكل مضخة)'), p.rated, 'L/min')}${row(L('Number of duty pumps', 'عدد المضخات العاملة'), p.count, '', false)}
      ${row(L('Rated pressure', 'الضغط المقنن'), p.ratedP, 'bar')}${row(L('Churn pressure (≤140 %)', 'ضغط الإغلاق (≤140%)'), p.churnP, 'bar')}
      ${row(L('Pressure at 150 % flow (≥65 %)', 'الضغط عند 150% (≥65%)'), p.at150Pct, 'bar')}${row(L('Jockey stop', 'إيقاف الجوكي'), p.jockeyStop, 'bar')}
      ${row(L('Jockey start', 'تشغيل الجوكي'), p.jockeyStart, 'bar')}${row(L('Electric pump start', 'تشغيل الكهربائية'), p.mainStart, 'bar')}
      ${row(L('Diesel pump start', 'تشغيل الديزل'), p.dieselStart, 'bar')}${row(L('Jockey flow', 'تدفق الجوكي'), p.jockeyFlow, 'L/min')}
      ${row(L('Motor rating (approx.)', 'قدرة المحرك'), p.motorKw, 'kW', false)}</table></div>` : '';
  const checks = (d.checks || []).map((k) => `<div class="chk ${k.ok ? 'ok' : 'bad'}">${k.ok ? '✅' : '⚠️'} ${esc(ar() ? k.ar : k.en)}</div>`).join('');
  const nEd = Object.keys(helpers_.getEdits?.() || {}).length;
  $('dataInner').innerHTML = `<h1>${t('dataTitle')}</h1><p class="lead">${esc(tr(f.name))} — ${esc(tr(c.sc.name))}${nEd ? ` · <b style="color:var(--warn)">${L('USER DESIGN', 'تصميم المستخدم')} (${nEd})</b>` : ''}</p>
    ${renderEditor(c)}
    <div class="card" style="margin:14px 0"><h3>🧾 ${L('NFPA compliance checks', 'فحوصات المطابقة لـ NFPA')}</h3><div class="checks">${checks}</div></div>
    <div class="grid2">
      <div class="card"><h3>${t('siteFacts')}</h3><table class="data">
        <tr><td>${L('Location', 'الموقع')}</td><td class="num">${esc(tr(f.site))}</td></tr>
        <tr><td>${L('Coordinates', 'الإحداثيات')}</td><td class="num">${f.lat.toFixed(4)}°, ${f.lon.toFixed(4)}°</td></tr>
        ${f.facts.map(([k, v]) => `<tr><td>${esc(tr(k))}</td><td class="num">${esc(tr(v))}</td></tr>`).join('')}
        <tr><td>${L('Design ambient', 'الظروف المحيطة')}</td><td class="num">${f.ambient} °C · RH ${f.humidity} %</td></tr>
      </table><p class="muted" style="font-size:.85em">${esc(t('refDesignTip'))}</p></div>
      <div class="card"><h3>${t('designBasis')}</h3><table class="data"><tr><th></th><th style="text-align:end">SI</th><th style="text-align:end">US</th></tr>${basis}</table></div>
      <div class="card"><h3>${t('calcSteps')}</h3>${d.steps.map((s) => `<div class="formula">${esc(s.v)}</div>`).join('')}</div>
      ${pumps}
    </div>
    <div style="margin-top:14px" class="no-print"><button class="btn" id="csvBtn">⬇ ${L('Export simulation timeline (CSV)', 'تصدير الخط الزمني للمحاكاة (CSV)')}</button></div>`;
  wireEditor(c);
  $('csvBtn').onclick = () => {
    const lines = [FIELDS.join(',')];
    for (let i = 0; i < c.tl.n; i += 2) lines.push(FIELDS.map((k) => (+c.tl.data[k][i]).toFixed(3)).join(','));
    download(`${f.id}_${c.sc.id}_timeline.csv`, lines.join('\n'), 'text/csv');
  };
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + text], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ───────────────────────── learn
const LESSON_LINK = {
  'fire-basics': ['HIGH_RISE', 'floor'], 'systems-overview': ['HIGH_RISE', 'riser'], sprinklers: ['HIGH_RISE', 'floor'],
  'hazard-classification': ['WAREHOUSE', 'floor'], 'pipe-schedule': ['HIGH_RISE', 'floor'], 'hydraulic-calcs': ['WAREHOUSE', 'riser'],
  'fire-pumps': ['HIGH_RISE', 'pumps'], standpipes: ['HIGH_RISE', 'riser'], 'detection-alarm': ['DATA_CENTER', 'vesda'],
  'clean-agent': ['DATA_CENTER', 'cylinders'], 'foam-and-special': ['TANK_FARM', 'pourers'],
};

function renderLearn() {
  $('learnInner').innerHTML = `<h1>${t('learnTitle')}</h1><p class="lead">${L('Structured lessons based on NFPA 13, 14, 20, 25, 72, 2001, 11 and 409 — each one opens the matching system in the 3D twin.',
    'دروس منظمة وفق NFPA 13 و14 و20 و25 و72 و2001 و11 و409 — كل درس يفتح المنظومة المطابقة في التوأم الرقمي.')}</p>
    <div class="lesson-list">${LESSONS.map((l, i) => `<div class="card lesson-card" data-i="${i}"><div class="ic">${l.icon}</div><h4>${esc(tr(l.title))}</h4><div class="muted" style="font-size:.9em">${esc(tr(l.summary))}</div></div>`).join('')}</div>`;
  document.querySelectorAll('.lesson-card').forEach((el) => { el.onclick = () => renderLesson(LESSONS[+el.dataset.i]); });
}


function renderLesson(l) {
  const link = LESSON_LINK[l.id];
  $('learnInner').innerHTML = `<div class="lesson-body">
    <button class="btn" id="backL">← ${L('All lessons', 'كل الدروس')}</button>
    ${link ? `<button class="btn primary" id="tryL">🏙️ ${L('Explore in the 3D twin', 'استكشف في التوأم الرقمي')}</button>` : ''}
    <button class="btn" id="quizL">🎓 ${L('Quiz on this lesson', 'اختبار هذا الدرس')}</button>
    <h1 style="margin-top:18px">${l.icon} ${esc(tr(l.title))}</h1><p class="lead">${esc(tr(l.summary))}</p>
    ${l.sections.map((s) => `<h2>${esc(tr(s.h))}</h2><p>${esc(tr(s.p))}</p>
      ${s.formula ? `<div class="formula">${esc(s.formula)}</div>` : ''}
      ${s.bullets ? `<ul>${s.bullets.map((b) => `<li>${esc(tr(b))}</li>`).join('')}</ul>` : ''}`).join('')}
    <h2>${L('References', 'المراجع')}</h2><ul class="refs">${(l.refs || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
  $('backL').onclick = renderLearn;
  if (link) $('tryL').onclick = () => helpers.goTwin(link[0], link[1]);
  $('quizL').onclick = () => { renderQuizStart(l.id); document.querySelector('.tabs button[data-page="quiz"]').click(); setTimeout(() => startQuiz(l.id, 5), 0); };
}

// ───────────────────────── quiz
let quiz = null;
function renderQuizStart(topic = '') {
  const topics = LESSONS.map((l) => `<option value="${l.id}" ${l.id === topic ? 'selected' : ''}>${esc(tr(l.title))}</option>`).join('');
  $('quizInner').innerHTML = `<h1>${t('quizTitle')}</h1><p class="lead">${QUIZ.length} ${t('questions')} · ${LESSONS.length} ${L('topics', 'مواضيع')}</p>
    <div class="card" style="max-width:640px"><div class="form-grid">
      <label>${t('studentName')}<input type="text" id="qName" value="${esc(localGet('ftw.student') ?? '')}" /></label>
      <label>${t('group')}<input type="text" id="qGroup" value="${esc(localGet('ftw.group') ?? '')}" /></label>
      <label>${L('Topic', 'الموضوع')}<select id="qTopic"><option value="">${t('allTopics')}</option>${topics}</select></label>
      <label>${L('Number of questions', 'عدد الأسئلة')}<select id="qCount"><option>5</option><option selected>10</option><option>20</option><option>45</option></select></label>
    </div><div style="margin-top:14px"><button class="btn primary" id="qStart">${t('start')}</button></div></div>`;
  $('qStart').onclick = () => startQuiz($('qTopic').value, +$('qCount').value);
}

function startQuiz(topic, count) {
  const name = $('qName')?.value?.trim(), group = $('qGroup')?.value?.trim();
  if (name !== undefined) { localSet('ftw.student', name); localSet('ftw.group', group); }
  let pool = QUIZ.filter((q) => !topic || q.topic === topic);
  pool = pool.map((q) => [Math.random(), q]).sort((a, b) => a[0] - b[0]).map((x) => x[1]).slice(0, count);
  quiz = { pool, i: 0, score: 0, topic, answered: false };
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.pool[quiz.i];
  if (!q) {
    const pct = Math.round((quiz.score / quiz.pool.length) * 100);
    recordResult({ type: 'quiz', topic: quiz.topic || 'all', score: quiz.score, total: quiz.pool.length });
    $('quizInner').innerHTML = `<h1>${t('quizTitle')}</h1><div class="card" style="max-width:640px;text-align:center">
      <div style="font-size:3em">${pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📘'}</div><div class="stat">${quiz.score} / ${quiz.pool.length} (${pct} %)</div>
      <p class="muted">${pct >= 60 ? L('Passed', 'ناجح') : L('Review the lessons and try again', 'راجع الدروس وحاول مرة أخرى')}</p>
      <button class="btn primary" id="qAgain">${t('restart')}</button></div>`;
    $('qAgain').onclick = () => renderQuizStart(quiz.topic);
    return;
  }
  quiz.answered = false;
  $('quizInner').innerHTML = `<h1>${t('quizTitle')}</h1><div class="card" style="max-width:760px">
    <div class="muted">${quiz.i + 1} / ${quiz.pool.length} · ${t('score')}: ${quiz.score}</div>
    <div class="progress"><div style="width:${(quiz.i / quiz.pool.length) * 100}%"></div></div>
    <div class="quiz-q">${esc(tr(q.q))}</div>
    ${q.options.map((o, i) => `<button class="quiz-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(tr(o))}</button>`).join('')}
    <div id="qExplain"></div></div>`;
  document.querySelectorAll('.quiz-opt').forEach((b) => {
    b.onclick = () => {
      if (quiz.answered) return;
      quiz.answered = true;
      const i = +b.dataset.i;
      if (i === q.answer) quiz.score++;
      document.querySelectorAll('.quiz-opt').forEach((x) => { const j = +x.dataset.i; if (j === q.answer) x.classList.add('right'); else if (j === i) x.classList.add('wrong'); });
      $('qExplain').innerHTML = `<div class="explain">${esc(tr(q.explain))}</div><button class="btn primary" id="qNext">${t('next')} →</button>`;
      $('qNext').onclick = () => { quiz.i++; renderQuestion(); };
    };
  });
}

// ───────────────────────── classroom
function localGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
function results() { try { return JSON.parse(localGet('ftw.results') || '[]'); } catch { return []; } }

export function recordResult(r) {
  const all = results();
  all.push({ date: new Date().toISOString(), student: localGet('ftw.student') || '—', group: localGet('ftw.group') || '', ...r });
  localSet('ftw.results', JSON.stringify(all.slice(-2000)));
}

function renderClassroom() {
  // Supervisor (teacher) licenses see everyone's results; other licenses only their own.
  const sup = isSupervisor();
  const me = localGet('ftw.student') || '—';
  const res = sup ? results() : results().filter((r) => r.student === me);
  const byStudent = {};
  for (const r of res) { const s = (byStudent[r.student] ||= { n: 0, score: 0, total: 0, ch: 0, chOk: 0 }); s.n++; if (r.type === 'quiz') { s.score += r.score; s.total += r.total; } else { s.ch++; s.chOk += r.score; } }
  $('classInner').innerHTML = `<h1>${t('classTitle')}</h1><p class="lead">${L('Instructor tools: troubleshooting challenges with hidden faults, student results and exports.', 'أدوات المدرّب: تحديات تشخيص بأعطال مخفية، ونتائج الطلاب، والتصدير.')}</p>
    <div class="grid2">
      <div class="card"><h3>🕵️ ${L('Troubleshooting challenge', 'تحدي التشخيص')}</h3>
        <p>${L('A random facility and scenario is loaded with a hidden fault (or none). The student runs the simulation, reads the alarms, pressures and pump behaviour, then diagnoses the fault.',
          'يتم تحميل منشأة وسيناريو عشوائيين مع عطل مخفي (أو بدون عطل). يشغّل الطالب المحاكاة ويقرأ الإنذارات والضغوط وسلوك المضخات ثم يشخّص العطل.')}</p>
        <div class="form-grid"><label>${t('studentName')}<input type="text" id="cName" value="${esc(localGet('ftw.student') ?? '')}" /></label>
        <label>${t('group')}<input type="text" id="cGroup" value="${esc(localGet('ftw.group') ?? '')}" /></label></div>
        <div style="margin-top:12px"><button class="btn primary" id="cStart">${t('start')}</button></div></div>
      <div class="card"><h3>👥 ${L('Students', 'الطلاب')}</h3><table class="data"><tr><th>${t('studentName')}</th><th>${L('Quiz', 'الاختبارات')}</th><th>${L('Challenges', 'التحديات')}</th></tr>
        ${Object.entries(byStudent).map(([n, s]) => `<tr><td>${esc(n)}</td><td class="num">${s.total ? Math.round((100 * s.score) / s.total) + ' %' : '—'}</td><td class="num">${s.chOk}/${s.ch}</td></tr>`).join('') || `<tr><td colspan="3" class="muted">—</td></tr>`}</table></div>
    </div>
    <div class="card" style="margin-top:14px"><h3>📋 ${L('All results', 'كل النتائج')}</h3>
      ${sup ? `<div style="margin-bottom:10px"><button class="btn" id="cCsv">⬇ ${t('exportCsv')}</button><button class="btn" id="cClear">🗑 ${t('clear')}</button></div>`
        : `<p class="muted">🔒 ${L('Your license is a student/user license: you see only your own results. A supervisor (teacher) license shows, exports and clears the results of all students.', 'ترخيصك ترخيص طالب/مستخدم: ترى نتائجك فقط. ترخيص المشرف (المدرّس) يعرض نتائج جميع الطلاب ويصدّرها ويمسحها.')}</p>`}
      <table class="data"><tr><th>${t('time')}</th><th>${t('studentName')}</th><th>${t('group')}</th><th>${L('Type', 'النوع')}</th><th>${L('Topic', 'الموضوع')}</th><th>${t('score')}</th></tr>
      ${res.slice(-200).reverse().map((r) => `<tr><td>${new Date(r.date).toLocaleString()}</td><td>${esc(r.student)}</td><td>${esc(r.group)}</td><td>${esc(r.type)}</td><td>${esc(r.topic)}</td><td class="num">${r.score}/${r.total}</td></tr>`).join('')}</table></div>`;
  $('cStart').onclick = () => { localSet('ftw.student', $('cName').value.trim()); localSet('ftw.group', $('cGroup').value.trim()); helpers.startChallenge($('cName').value.trim()); };
  if (sup) $('cCsv').onclick = () => download('class_results.csv', ['date,student,group,type,topic,score,total', ...results().map((r) => [r.date, r.student, r.group, r.type, r.topic, r.score, r.total].map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(','))].join('\n'), 'text/csv');
  if (sup) $('cClear').onclick = () => { if (confirm(L('Delete all stored results?', 'حذف كل النتائج المخزنة؟'))) { localSet('ftw.results', '[]'); renderClassroom(); } };
}

// ───────────────────────── reports
function renderReports(c) {
  const img = helpers.screenshot?.();
  const s = c.tl.summary;
  const d = c.design;
  const lic = licenseStatus();
  const faults = Object.entries(c.state.faults).filter(([, v]) => v).map(([k]) => tr(FAULTS.find((f) => f.id === k)?.name));
  const evs = c.tl.events;
  $('reportsInner').innerHTML = `<div class="no-print" style="margin-bottom:14px"><button class="btn primary" id="rPdf">💾 ${t('savePdf')}</button><button class="btn" id="rPrint">🖨 ${t('print')}</button></div>
  <div class="card" id="report" style="max-width:1000px">
    <h1>${L('Fire Protection Simulation Report', 'تقرير محاكاة منظومة الحماية من الحريق')}</h1>
    <p class="muted">${new Date().toLocaleString()} · ${esc(localGet('ftw.student') || '')} · ${lic.name ? esc(lic.name) : ''}</p>
    <table class="data">
      <tr><td>${L('Facility', 'المنشأة')}</td><td>${esc(tr(c.fac.name))}</td></tr>
      <tr><td>${L('Location', 'الموقع')}</td><td>${esc(tr(c.fac.site))} (${c.fac.lat.toFixed(3)}°, ${c.fac.lon.toFixed(3)}°)</td></tr>
      <tr><td>${t('scenario')}</td><td>${esc(tr(c.sc.name))}</td></tr>
      <tr><td>${t('faults')}</td><td>${faults.length ? faults.map(esc).join(', ') : '—'}</td></tr>
    </table>
    ${img ? `<img src="${img}" style="width:100%;border-radius:8px;margin:14px 0" />` : ''}
    <h2>${t('summary')}</h2>
    <table class="data">
      <tr><td>${t('kDetect')}</td><td class="num">${mmss(s.tDetect)}</td></tr>
      <tr><td>${t('kAct')}</td><td class="num">${mmss(s.tAct)}</td></tr>
      <tr><td>${L('Fire controlled', 'السيطرة على الحريق')}</td><td class="num">${mmss(s.controlledT)}</td></tr>
      <tr><td>${L('Peak heat release rate', 'ذروة معدل انطلاق الحرارة')}</td><td class="num">${hrrStr(Math.max(...c.tl.data.hrr)).join(' ')}</td></tr>
      <tr><td>${L('Peak ceiling gas temperature', 'ذروة حرارة الغاز')}</td><td class="num">${fmt(Math.max(...c.tl.data.gasT), 0)} °C</td></tr>
      ${d.type === 'sprinkler' ? `<tr><td>${t('kHeads')}</td><td class="num">${fmt(Math.max(...c.tl.data.heads), 0)} / ${d.heads} ${L('design', 'تصميم')}</td></tr>` : ''}
      ${d.type !== 'cleanAgent' ? `<tr><td>${t('kWater')}</td><td class="num">${fmt(Math.max(...c.tl.data.water), 1)} m³</td></tr>` : `<tr><td>${L('Agent discharged', 'المادة المفرغة')}</td><td class="num">${d.W} kg</td></tr>`}
    </table>
    <h2>${t('calcSteps')}</h2>${d.steps.map((x) => `<div class="formula">${esc(x.v)}</div>`).join('')}
    <h2>${t('events')}</h2>
    <table class="data">${evs.map((e) => `<tr><td class="num" style="width:80px">${mmss(e.t)}</td><td>${e.level === 'alarm' ? '🔴' : e.level === 'warn' ? '🟠' : '🔵'}</td><td>${esc(t('e_' + e.key, e.params))}</td></tr>`).join('')}</table>
    <p class="muted" style="margin-top:16px;font-size:.85em">${esc(t('refDesignTip'))} — ${L('Generated by Fire Protection Digital Twin · ASFAN Trading', 'تم الإنشاء بواسطة التوأم الرقمي لأنظمة مكافحة الحريق · أصفان للتجارة')}</p>
  </div>`;
  $('rPrint').onclick = () => window.print();
  $('rPdf').onclick = async () => {
    if (window.api?.savePdf) await window.api.savePdf(`${c.fac.id}_${c.sc.id}_report.pdf`);
    else window.print();
  };
}

// ───────────────────────── custom facility form
export function customFacilityForm(openModal, closeModal, onCreate) {
  const cities = CITIES.map((c) => `<option value="${c.id}">${esc(tr(c.name))}</option>`).join('');
  const occ = Object.entries(OCCUPANCIES).map(([k, o]) => `<option value="${k}">${esc(tr(o.name))} (${o.hazard})</option>`).join('');
  openModal(`<h2>🛠 ${t('createManual')}</h2>
    <div class="form-grid">
      <label>${t('fName')}<input type="text" id="cf_name" value="${L('My building', 'مبناي')}" /></label>
      <label>${t('fCity')}<select id="cf_city">${cities}</select></label>
      <label>${t('fOcc')}<select id="cf_occ">${occ}</select></label>
      <label>${t('fFloors')}<input type="number" id="cf_floors" value="8" min="1" max="60" /></label>
      <label>${t('fFH')}<input type="number" id="cf_fh" value="3.6" min="3" max="6" step="0.1" /></label>
      <label>${t('fFire')}<input type="number" id="cf_ff" value="5" min="1" max="60" /></label>
      <label>${t('fW')}<input type="number" id="cf_w" value="45" min="20" max="150" /></label>
      <label>${t('fD')}<input type="number" id="cf_d" value="28" min="15" max="100" /></label>
      <label>${t('fK')}<select id="cf_k"><option value="80.6">K5.6 (K80)</option><option value="115">K8.0 (K115)</option><option value="161">K11.2 (K160)</option></select></label>
      <label>${t('fT')}<select id="cf_t"><option value="57">57 °C (orange)</option><option value="68" selected>68 °C (red)</option><option value="79">79 °C (yellow)</option><option value="93">93 °C (green)</option></select></label>
      <label>${t('fResp')}<select id="cf_r"><option value="QR">Quick response (RTI 50)</option><option value="SR">Standard response (RTI 200)</option></select></label>
    </div>
    <div style="margin-top:16px"><button class="btn primary" id="cf_go">${t('create')}</button><button class="btn" id="cf_x">${t('cancel')}</button></div>`);
  $('cf_x').onclick = closeModal;
  $('cf_go').onclick = () => {
    const v = (id) => $(id).value;
    closeModal();
    onCreate({ name: v('cf_name'), city: v('cf_city'), occupancy: v('cf_occ'), floors: v('cf_floors'), floorHeight: v('cf_fh'), fireFloor: v('cf_ff'), width: v('cf_w'), depth: v('cf_d'), K: v('cf_k'), Tact: v('cf_t'), response: v('cf_r') });
  };
}
