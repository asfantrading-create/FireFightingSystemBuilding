// Module 5 — Commissioning & Acceptance Testing.
// Pre-functional installation checks, device-by-device functional test (NFPA 72 Table 14.4.3.2) driven by the
// shared FireSystem engine, audibility/visibility survey, battery & power tests, sprinkler hydrostatic test
// (NFPA 13 §29.2.1) and a printable NFPA 72 System Record of Completion.
import Chart from 'chart.js/auto';
import { header, L, esc, tr, store, markDone, tabBar, stat, scoreBanner, printDoc, download, pad3, clamp, css } from './ui.js';
import { FLOORS, roomsFor, DEVICE_TYPES, PLAN } from './building.js';
import { systemLoads, batteryCalc, FAULT_KINDS } from './system.js';

const KEY = 'cm.state';
const blank = () => ({
  tab: 'pre', pre: {}, session: null, tests: {}, methods: {}, speed: 4, floor: 'all', filter: 'all', submitted: null,
  aud: { floor: 'G', room: null, meas: {}, verdict: {}, extra: {}, cd: {} },
  batt: { acOffT: null, acTroubleT: null, acRestoredT: null, vLoad: '', ah: '', size: '', done: false },
  hydro: { scen: 'tight', results: {} }, roc: {},
});
let S = blank();
const save = () => store.set(KEY, S);
const N = (v) => `<span class="cm-n">${v}</span>`;
const T = (en, ar) => ({ en, ar });
const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : 'OL');
const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

// ───────────────────────────────────────── 1. pre-functional checklist
const PRE = [
  { id: 'discon', kind: 'check', name: T('Addressable devices, panel and surge protectors disconnected before insulation test', 'فصل الأجهزة المعنونة واللوحة وحماية الصواعق قبل اختبار العزل'), ref: 'Mfr. / NFPA 72 §14.2.10' },
  { id: 'irSlc', unit: 'MΩ', inst: 'v500', need: 'discon', defect: 'ground', name: T('SLC loop cable insulation resistance (conductors → earth)', 'مقاومة عزل كابل حلقة SLC (الموصلات ← الأرضي)'), crit: '≥ 1 MΩ @ 500 V DC', ok: (v) => v >= 1, read: (s) => (s.ground ? 0.18 : 212), ref: 'NFPA 72 T.14.4.3.2 (21)' },
  { id: 'irNac1', unit: 'MΩ', inst: 'v500', need: 'discon', name: T('NAC1 cable insulation resistance', 'مقاومة عزل كابل دائرة الإنذار NAC1'), crit: '≥ 1 MΩ @ 500 V DC', ok: (v) => v >= 1, read: () => 185, ref: 'NFPA 72 T.14.4.3.2 (21)' },
  { id: 'irNac2', unit: 'MΩ', inst: 'v500', need: 'discon', name: T('NAC2 cable insulation resistance', 'مقاومة عزل كابل دائرة الإنذار NAC2'), crit: '≥ 1 MΩ @ 500 V DC', ok: (v) => v >= 1, read: () => 240, ref: 'NFPA 72 T.14.4.3.2 (21)' },
  { id: 'loopR', unit: 'Ω', inst: 'ohm', defect: 'open', name: T('SLC loop resistance, panel OUT → IN (continuity)', 'مقاومة الحلقة من مخرج اللوحة إلى مدخلها (الاستمرارية)'), crit: '≤ 40 Ω', ok: (v) => v <= 40, read: (s) => (s.opens.size ? Infinity : 16.8), ref: 'NFPA 72 T.14.4.3.2 (21)' },
  { id: 'earth', unit: 'kΩ', inst: 'kohm', defect: 'ground', name: T('Earth-fault monitor: loop resistance to earth (panel reading)', 'مراقب التسرّب الأرضي: مقاومة الحلقة للأرضي (قراءة اللوحة)'), crit: '≥ 50 kΩ', ok: (v) => v >= 50, read: (s) => (s.ground ? 3.9 : Infinity), ref: 'NFPA 72 §12.6' },
  { id: 'eol1', unit: 'kΩ', inst: 'kohm', defect: 'nac', name: T('NAC1 end-of-line resistor', 'مقاومة نهاية الخط NAC1'), crit: '4.7 kΩ ± 5 %', ok: (v) => v >= 4.46 && v <= 4.94, read: (s) => nacR(s.nacFaults.NAC1), ref: 'NFPA 72 §12.6' },
  { id: 'eol2', unit: 'kΩ', inst: 'kohm', defect: 'nac', name: T('NAC2 end-of-line resistor', 'مقاومة نهاية الخط NAC2'), crit: '4.7 kΩ ± 5 %', ok: (v) => v >= 4.46 && v <= 4.94, read: (s) => nacR(s.nacFaults.NAC2), ref: 'NFPA 72 §12.6' },
  { id: 'scan', unit: 'dev', inst: 'scan', name: T('Loop scan: devices answering = devices programmed, no double address', 'مسح الحلقة: الأجهزة المستجيبة = الأجهزة المبرمجة، دون عناوين مكررة'), crit: '= programmed', ok: (v, s) => v === Object.keys(s.config).length && !s.devices.some((d) => d.dup), read: (s) => s.devices.filter((d) => d.comm && !d.dup && d.fault !== 'dead').length, ref: 'NFPA 72 §14.4.1' },
  { id: 'spacing', unit: 'm', inst: 'tape', name: T('Max. smoke-detector spacing, smooth ceiling (corridor)', 'أقصى تباعد لكواشف الدخان – سقف أملس (الممر)'), crit: '≤ 9.1 m', ok: (v) => v <= 9.1, read: (s) => maxSpacing(s), ref: 'NFPA 72 §17.7.4.2.3' },
  { id: 'labels', kind: 'check', name: T('Device labels & addresses match the as-built drawings', 'ملصقات الأجهزة وعناوينها مطابقة لمخططات التنفيذ'), ref: 'NFPA 72 §7.5.5' },
  { id: 'caps', kind: 'check', name: T('Detector dust covers removed after construction clean-up', 'إزالة أغطية الغبار عن الكواشف بعد تنظيف الموقع'), ref: 'NFPA 72 §17.7.1.11' },
  { id: 'backup', kind: 'check', name: T('Site-specific software (panel program) backed up, copy stored at the panel', 'حفظ نسخة احتياطية من برنامج اللوحة وتخزينها بجانب اللوحة'), ref: 'NFPA 72 §14.6.1.2' },
  { id: 'battDate', unit: 'mo', inst: 'label', name: T('Battery date code – age at acceptance', 'رمز تاريخ البطارية – العمر عند الاستلام'), crit: '≤ 6 months', ok: (v) => v <= 6, read: () => 3, ref: 'NFPA 72 §10.6.10.1.1' },
];
function nacR(f) { return f === 'eol' || f === 'open' ? Infinity : f === 'short' ? 0.02 : 4.7; }
function maxSpacing(s) {
  const c = s.devices.filter((d) => d.floor === 'G' && d.room === 'cor' && d.type === 'smoke').map((d) => d.x).sort((a, b) => a - b);
  let m = 0; for (let i = 1; i < c.length; i++) m = Math.max(m, c[i] - c[i - 1]);
  return m;
}
const parseVal = (v) => { const t = String(v ?? '').trim().toUpperCase(); if (!t) return null; if (t === 'OL' || t === '∞' || t === 'INF') return Infinity; const n = parseFloat(t.replace(',', '.')); return Number.isFinite(n) ? n : NaN; };

// ───────────────────────────────────────── 2. functional test definitions
const METHODS = {
  aerosol: { name: T('Listed aerosol smoke', 'دخان اختبار مُعتمد (بخاخ)'), kind: 'smoke' },
  heatgun: { name: T('Heat gun (restorable element)', 'مسدس حراري (عنصر قابل للاستعادة)'), kind: 'heat' },
  combo: { name: T('Aerosol + heat (each sensor)', 'بخاخ + حرارة (كل حسّاس)'), kind: 'fire' },
  key: { name: T('Test key / actuate call point', 'مفتاح الاختبار / تشغيل الزر'), kind: 'mcp' },
  itv: { name: T("Inspector's test valve (flow)", 'صمام اختبار المفتش (تدفق)'), kind: 'flow' },
  valve: { name: T('Close control valve ≤ 2 turns', 'إغلاق صمام التحكم ≤ لفتين'), kind: 'tamper' },
  relay: { name: T('Force output, verify load', 'تشغيل المخرج والتحقق من الحمل'), kind: null },
  iso: { name: T('Apply loop short, verify isolation', 'تطبيق قصر والتحقق من العزل'), kind: null },
  magnet: { name: T('Magnet test only', 'اختبار المغناطيس فقط'), kind: null, bad: T('A magnet only closes a reed switch — it does not prove smoke can enter the chamber. Not an acceptable functional test.', 'المغناطيس يغلق مفتاحاً فقط ولا يثبت دخول الدخان إلى الحجرة — ليس اختباراً وظيفياً مقبولاً.') },
  flame: { name: T('Open flame / lighter', 'لهب مكشوف / ولاعة'), kind: null, bad: T('Open flames are prohibited for detector testing — they damage the detector and are a fire hazard.', 'يُمنع استخدام اللهب المكشوف لاختبار الكواشف — يتلف الكاشف ويشكّل خطر حريق.') },
};
const CORRECT = { smoke: 'aerosol', heat: 'heatgun', multi: 'combo', mcp: 'key', flow: 'itv', tamper: 'valve', relay: 'relay', iso: 'iso' };
const LIMIT = { smoke: 30, heat: 60, multi: 45, mcp: 10, flow: 90, tamper: 15, relay: 8, iso: 8 };
const EXPECT = { smoke: 'fire', heat: 'fire', multi: 'fire', mcp: 'fire', flow: 'fire', tamper: 'super' };
const DIAGS = ['none', 'dead', 'dup', 'type', 'dirty', 'disabled', 'tamper', 'other'];
const diagName = (k) => (k === 'none' ? L('No defect', 'لا يوجد عيب') : k === 'other' ? L('Other – replace device', 'أخرى – استبدال الجهاز') : tr(FAULT_KINDS[k]));
const typeName = (t) => tr(DEVICE_TYPES[t]?.name) || t;
const SHORT = { smoke: T('Smoke (photo)', 'دخان (كهروضوئي)'), heat: T('Heat 58 °C/ROR', 'حرارة 58 °م/معدل'), multi: T('Multi-criteria', 'متعدد المعايير'), mcp: T('Call point', 'زر يدوي'), flow: T('Waterflow (MM)', 'تدفق مياه (MM)'), tamper: T('Valve tamper (MM)', 'عبث صمام (MM)'), relay: T('Control relay', 'ريليه تحكم'), iso: T('Isolator', 'عازل') };
const shortName = (t) => tr(SHORT[t]) || t;
const progType = (sys, d) => sys.config[d.addr]?.type || d.type;

// ───────────────────────────────────────── 3. audibility
const AMB = { office: 55, corridor: 50, stair: 45, lobby: 55, shaft: null, kitchen: 65, server: 78, tech: 72 };
const WALL = { office: 12, corridor: 0, stair: 18, lobby: 6, kitchen: 12, server: 20, tech: 15, shaft: 25 };
const CD_TABLE = [[6.1, 15], [8.53, 30], [12.19, 60], [13.72, 75], [16.46, 95], [16.76, 110], [19.2, 135], [20.73, 185]];
const reqCd = (w, h) => { const s = Math.max(w, h); const r = CD_TABLE.find(([m]) => s <= m); return r ? r[1] : null; };

// ───────────────────────────────────────── 5. hydrostatic
const HYDRO = {
  tight: { name: T('Riser A – zone 1 (as installed)', 'الرايزر A – المنطقة 1 (كما رُكّب)'), ans: 'accept' },
  leak: { name: T('Riser B – zone 2 (as installed)', 'الرايزر B – المنطقة 2 (كما رُكّب)'), ans: 'leak' },
  thermal: { name: T('Roof loop – filled in afternoon sun', 'حلقة السطح – مُلئت تحت شمس الظهيرة'), ans: 'thermal' },
};
const HYDRO_ANS = {
  accept: T('Accept – no pressure loss, no leakage', 'قبول – لا فقدان ضغط ولا تسرب'),
  leak: T('Reject – leaking joint: locate, repair, retest', 'رفض – وصلة مسرّبة: حدّدها وأصلحها وأعد الاختبار'),
  thermal: T('Inconclusive – trapped air / temperature: vent, stabilise, retest', 'غير حاسم – هواء محبوس / حرارة: نفّس الهواء واترك الحرارة تستقر وأعد الاختبار'),
};

// ═════════════════════════════════════════ module
const m = {
  id: 'commission', icon: '✅',
  title: { en: 'Commissioning & Acceptance Testing', ar: 'الاستلام والتشغيل (Commissioning)' },
  short: { en: 'Acceptance tests & record of completion', ar: 'اختبارات الاستلام وسجل الإنجاز' },
  sub: {
    en: 'Take the installed system through acceptance exactly as a commissioning engineer does: pre-functional inspection and cable tests, a device-by-device functional test on the live panel, audibility and visibility survey, battery and power tests, the sprinkler hydrostatic test — and issue the NFPA 72 Record of Completion.',
    ar: 'مرّر النظام المركّب عبر الاستلام تماماً كما يفعل مهندس التشغيل: فحص ما قبل التشغيل واختبارات الكابلات، واختبار وظيفي لكل جهاز على اللوحة الحية، ومسح مستوى الصوت والرؤية، واختبارات البطارية والطاقة، واختبار الضغط الهيدروستاتيكي للرشاشات — ثم أصدر سجل الإنجاز وفق NFPA 72.',
  },
  refs: ['NFPA 72 §14.4 · T.14.4.3.2', 'NFPA 72 §7.5.6', 'NFPA 72 §18.4 · §18.5', 'NFPA 72 §10.6', 'NFPA 13 §29.2.1'],
  render(el, ctx) {
    S = { ...blank(), ...store.get(KEY, {}) };
    S.aud = { ...blank().aud, ...(S.aud || {}) }; S.batt = { ...blank().batt, ...(S.batt || {}) }; S.hydro = { ...blank().hydro, ...(S.hydro || {}) };
    const sys = ctx.sys;
    const TABS = [
      { id: 'pre', label: L('1 · Pre-functional', '1 · ما قبل التشغيل') },
      { id: 'dev', label: L('2 · Device functional test', '2 · الاختبار الوظيفي للأجهزة') },
      { id: 'aud', label: L('3 · Audibility & visibility', '3 · مستوى الصوت والرؤية') },
      { id: 'batt', label: L('4 · Battery & power', '4 · البطارية والطاقة') },
      { id: 'hydro', label: L('5 · Hydrostatic test', '5 · الاختبار الهيدروستاتيكي') },
      { id: 'roc', label: L('6 · Record of Completion', '6 · سجل الإنجاز') },
    ];
    el.innerHTML = header(m) + '<div id="cmTabs"></div><div id="cmBody" class="cm"></div>';
    const tabsEl = el.querySelector('#cmTabs'), body = el.querySelector('#cmBody');
    let tabClean = null;
    const runner = makeRunner(sys, () => { if (S.tab === 'dev' && devApi) devApi.onRunnerChange(); });
    let devApi = null;
    function show(id) {
      if (tabClean) { try { tabClean(); } catch { /* ignore */ } tabClean = null; }
      devApi = null;
      S.tab = id; save();
      tabsEl.innerHTML = tabBar(TABS, id);
      tabsEl.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => show(b.dataset.tab); });
      const f = { pre: tabPre, dev: tabDev, aud: tabAud, batt: tabBatt, hydro: tabHydro, roc: tabRoc }[id] || tabPre;
      const r = f(body, ctx, runner);
      if (r && r.cleanup) { tabClean = r.cleanup; devApi = r; } else tabClean = r || null;
    }
    show(S.tab);
    return () => { if (tabClean) tabClean(); runner.abort(); };
  },
};
export default m;

// ═════════════════════════════════════════ shared: session evaluation
function preFound(sys, kind) {
  return PRE.some((p) => p.defect === kind && S.pre[p.id]?.verdict === 'fail' && !p.ok(p.read(sys), sys));
}
function evalSession(sys) {
  const devs = sys.devices;
  const tested = devs.filter((d) => S.tests[d.id]);
  const coverage = devs.length ? tested.length / devs.length : 0;
  const methodOk = tested.length ? tested.filter((d) => S.tests[d.id].methodOk).length / tested.length : 0;
  const pass = tested.filter((d) => S.tests[d.id].result === 'pass').length;
  const fail = tested.filter((d) => S.tests[d.id].result === 'fail').length;
  const warn = tested.filter((d) => S.tests[d.id].result === 'warn').length;
  const planted = S.session?.planted || [];
  const devKinds = ['dead', 'dup', 'type', 'dirty', 'disabled', 'tamper'];
  const found = planted.map((p) => ({
    p,
    ok: devKinds.includes(p.kind)
      ? devs.some((d) => S.tests[d.id]?.diag === p.kind && d.addr === p.addr)
      : preFound(sys, p.kind),
  }));
  const falseDiag = devs.filter((d) => {
    const g = S.tests[d.id]?.diag; if (!g || g === 'none' || g === 'other') return false;
    return !planted.some((p) => p.kind === g && p.addr === d.addr);
  }).length;
  const nFound = found.filter((f) => f.ok).length;
  const defRatio = planted.length ? nFound / planted.length : 1;
  const score = clamp(Math.round(55 * coverage + 30 * defRatio + 15 * methodOk - 5 * falseDiag), 0, 100);
  return { total: devs.length, tested: tested.length, coverage, methodOk, pass, fail, warn, planted, found, nFound, falseDiag, score, complete: coverage >= 0.9 && nFound === planted.length };
}

// ═════════════════════════════════════════ TAB 1 — pre-functional
function tabPre(body, ctx) {
  const sys = ctx.sys;
  let inst = { mode: 'off', reading: '----', unit: '', sub: '', warn: false };
  const rowState = (p) => {
    const st = S.pre[p.id] || {};
    if (p.kind === 'check') return st.checked ? 'ok' : 'pend';
    const v = parseVal(st.v);
    if (v == null || !st.verdict) return 'pend';
    if (Number.isNaN(v)) return 'flag';
    const good = p.ok(v, sys);
    const trueGood = p.ok(p.read(sys), sys);
    if (st.verdict === 'pass' && !good) return 'flag';
    if (st.verdict === 'fail' && good) return 'flag';
    if (Math.abs((Number.isFinite(v) ? v : 1e9) - (Number.isFinite(p.read(sys)) ? p.read(sys) : 1e9)) > Math.max(0.5, 0.15 * Math.abs(Number.isFinite(p.read(sys)) ? p.read(sys) : 1)) && good !== trueGood) return 'flag';
    return good ? 'ok' : 'defect';
  };
  const flagText = (p) => {
    const st = S.pre[p.id] || {}; const v = parseVal(st.v);
    if (Number.isNaN(v)) return L('Not a number – enter the reading (use OL for over-range)', 'ليست قيمة رقمية – أدخل القراءة (OL لتجاوز المدى)');
    const good = p.ok(v, sys);
    if (st.verdict === 'pass' && !good) return L(`Reading ${fmt(v, 2)} ${p.unit} does NOT meet ${p.crit} — cannot be passed`, `القراءة ${fmt(v, 2)} ${p.unit} لا تحقق ${p.crit} — لا يمكن قبولها`);
    if (st.verdict === 'fail' && good) return L(`Reading meets ${p.crit} — why fail it?`, `القراءة تحقق ${p.crit} — لماذا الرفض؟`);
    return L('Entered value does not match the instrument reading — re-measure', 'القيمة المدخلة لا تطابق قراءة الجهاز — أعد القياس');
  };
  const draw = () => {
    const states = PRE.map((p) => rowState(p));
    const done = states.filter((s) => s !== 'pend').length, flags = states.filter((s) => s === 'flag').length, defects = states.filter((s) => s === 'defect').length;
    body.innerHTML = `
    <div class="adv-stats">
      ${stat(L('Checklist items', 'بنود القائمة'), `${done}/${PRE.length}`)}
      ${stat(L('Flagged entries', 'إدخالات مُعلَّمة'), flags, '', flags ? 'alarm' : 'ok')}
      ${stat(L('Installation defects recorded', 'عيوب تركيب مسجّلة'), defects, '', defects ? 'warn' : '')}
      ${stat(L('Loop class', 'فئة الحلقة'), sys.loopClass)}
      ${stat(L('Programmed devices', 'أجهزة مبرمجة'), Object.keys(sys.config).length)}
    </div>
    <div class="adv-row cm-prewrap">
      <div class="grow card">
        <h3>${L('PRE-FUNCTIONAL INSPECTION & CABLE TESTS', 'فحص ما قبل التشغيل واختبارات الكابلات')}<span class="r adv-pill info">NFPA 72 §14.4 · T.14.4.3.2</span></h3>
        <div class="adv-scroll cm-prescroll"><table class="adv-table cm-pre">
          <thead><tr><th></th><th>${L('Item / acceptance criterion', 'البند / معيار القبول')}</th><th>${L('Measured', 'المقاس')}</th><th></th><th>${L('Verdict', 'الحكم')}</th></tr></thead>
          <tbody>${PRE.map((p, i) => {
            const st = S.pre[p.id] || {}; const s = states[i];
            const ic = { ok: '<span class="cm-st ok">✓</span>', pend: '<span class="cm-st pend">○</span>', flag: '<span class="cm-st bad">!</span>', defect: '<span class="cm-st warn">✕</span>' }[s];
            if (p.kind === 'check') {
              return `<tr class="cm-${s}"><td>${ic}</td><td><b>${esc(tr(p.name))}</b><div class="cm-ref">${esc(p.ref)}</div></td>
                <td colspan="3"><label class="cm-chk"><input type="checkbox" data-chk="${p.id}" ${st.checked ? 'checked' : ''}> ${L('Verified on site', 'تم التحقق في الموقع')}</label></td></tr>`;
            }
            return `<tr class="cm-${s}"><td>${ic}</td>
              <td><b>${esc(tr(p.name))}</b><div class="cm-ref"><span class="cm-crit">${esc(p.crit)}</span> · ${esc(p.ref)}</div>
                ${s === 'flag' ? `<div class="cm-flag">⚠ ${esc(flagText(p))}</div>` : ''}${s === 'defect' ? `<div class="cm-defect">✕ ${L('Defect recorded – rectify before functional testing', 'تم تسجيل عيب – يُصلح قبل الاختبار الوظيفي')}</div>` : ''}</td>
              <td><div class="cm-valin"><input data-val="${p.id}" value="${esc(st.v ?? '')}" placeholder="—"><span>${esc(p.unit === 'dev' ? L('dev.', 'جهاز') : p.unit === 'mo' ? L('months', 'شهر') : p.unit)}</span></div></td>
              <td><button class="btn sm" data-meas="${p.id}">📏 ${L('Measure', 'قياس')}</button></td>
              <td><div class="cm-verd"><button data-vd="${p.id}:pass" class="${st.verdict === 'pass' ? 'on ok' : ''}">${L('Pass', 'مقبول')}</button><button data-vd="${p.id}:fail" class="${st.verdict === 'fail' ? 'on bad' : ''}">${L('Fail', 'مرفوض')}</button></div></td></tr>`;
          }).join('')}</tbody></table></div>
        <div class="adv-btns" style="margin-top:10px">
          <button class="btn sm ghost" id="cmPreClear">↺ ${L('Clear checklist', 'مسح القائمة')}</button>
          <span class="adv-note" style="flex:1">${L('Measured values are typed in by you (or filled from the instrument). Every reading is checked against its acceptance criterion; inconsistent entries are flagged. A failed item is a recorded installation defect.', 'تُدخل القيم المقاسة بنفسك (أو تُملأ من جهاز القياس). تُقارن كل قراءة بمعيار القبول، وتُعلَّم الإدخالات غير المتسقة. البند المرفوض يُسجَّل عيبَ تركيب.')}</span>
        </div>
      </div>
      <div class="cm-side">
        <div class="card"><h3>${L('TEST INSTRUMENT', 'جهاز القياس')}</h3>
          ${meterSvg(inst)}
          ${inst.warn ? `<div class="adv-callout bad" style="margin-top:8px">⛔ ${esc(inst.warn)}</div>` : ''}
        </div>
        <div class="adv-callout"><b>${L('Why disconnect first?', 'لماذا الفصل أولاً؟')}</b><br>${L('A 500 V DC insulation test destroys the electronics of addressable detectors, modules and the panel. Megger the cables with devices removed from their bases and conductors lifted at the panel.', 'اختبار العزل بجهد 500 فولت مستمر يتلف إلكترونيات الكواشف والوحدات المعنونة واللوحة. اختبر الكابلات بعد فك الأجهزة من قواعدها وفصل الموصلات عن اللوحة.')}</div>
      </div>
    </div>`;
    body.querySelectorAll('[data-chk]').forEach((c) => { c.onchange = () => { (S.pre[c.dataset.chk] ||= {}).checked = c.checked; save(); draw(); }; });
    body.querySelectorAll('[data-val]').forEach((i) => { i.onchange = () => { (S.pre[i.dataset.val] ||= {}).v = i.value; save(); draw(); }; });
    body.querySelectorAll('[data-vd]').forEach((b) => { b.onclick = () => { const [id, v] = b.dataset.vd.split(':'); (S.pre[id] ||= {}).verdict = v; save(); draw(); }; });
    body.querySelectorAll('[data-meas]').forEach((b) => {
      b.onclick = () => {
        const p = PRE.find((x) => x.id === b.dataset.meas);
        if (p.need && !S.pre[p.need]?.checked) {
          inst = { mode: p.inst, reading: 'Err', unit: '', sub: '500V', warn: L('STOP — devices are still connected. A 500 V insulation test now would destroy the addressable devices. Tick the disconnection item first.', 'توقف — الأجهزة ما زالت موصولة. اختبار العزل بجهد 500 فولت الآن سيتلف الأجهزة المعنونة. أكّد بند الفصل أولاً.') };
          draw(); return;
        }
        const v = p.read(sys);
        const txt = p.unit === 'dev' || p.unit === 'mo' ? String(v) : Number.isFinite(v) ? (v >= 100 ? v.toFixed(0) : v.toFixed(2)) : 'OL';
        (S.pre[p.id] ||= {}).v = txt; save();
        inst = { mode: p.inst, reading: txt, unit: p.unit === 'dev' ? 'DEV' : p.unit === 'mo' ? 'MONTHS' : p.unit, sub: { v500: '500V DC', ohm: 'Ω CONT', kohm: 'kΩ', scan: 'LOOP SCAN', tape: 'LASER', label: 'DATE CODE' }[p.inst] || '' };
        draw();
      };
    });
    body.querySelector('#cmPreClear').onclick = () => { S.pre = {}; save(); inst = { mode: 'off', reading: '----', unit: '', sub: '' }; draw(); };
  };
  draw();
  return null;
}

function meterSvg(i) {
  const ang = { off: -75, ohm: -40, kohm: -10, v500: 25, scan: 55, tape: 55, label: 55 }[i.mode] ?? -75;
  const labels = [['OFF', -75], ['Ω', -40], ['kΩ', -10], ['500V', 25], ['AUX', 55]];
  return `<svg viewBox="0 0 240 300" class="adv-svg cm-meter" role="img">
    <defs>
      <linearGradient id="cmMb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fcd34d"/><stop offset="1" stop-color="#d97706"/></linearGradient>
      <linearGradient id="cmLcd" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d4e2c4"/><stop offset="1" stop-color="#a7bd94"/></linearGradient>
      <radialGradient id="cmKnob" cx=".4" cy=".35"><stop offset="0" stop-color="#4b5563"/><stop offset="1" stop-color="#111827"/></radialGradient>
      <filter id="cmSh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".3"/></filter>
    </defs>
    <path d="M60 272 C 40 290, 20 280, 14 296" stroke="#b91c1c" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M180 272 C 200 290, 220 280, 226 296" stroke="#111827" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="22" y="8" width="196" height="272" rx="26" fill="#1f2937" filter="url(#cmSh)"/>
    <rect x="32" y="18" width="176" height="252" rx="18" fill="url(#cmMb)"/>
    <text x="120" y="38" text-anchor="middle" font-size="9" font-weight="700" fill="#422006" letter-spacing="1.5">INSULATION · CONTINUITY</text>
    <rect x="46" y="46" width="148" height="72" rx="8" fill="#1c1917"/>
    <rect x="52" y="52" width="136" height="60" rx="4" fill="url(#cmLcd)"/>
    <text x="58" y="64" font-size="8" font-family="monospace" fill="#374151">${esc(i.sub || '')}</text>
    <text x="182" y="96" text-anchor="end" font-size="28" font-family="monospace" font-weight="700" fill="#1c2a14">${esc(i.reading)}</text>
    <text x="182" y="108" text-anchor="end" font-size="9" font-family="monospace" fill="#1c2a14">${esc(i.unit || '')}</text>
    ${i.mode === 'v500' && i.reading !== 'Err' ? '<text x="58" y="106" font-size="11" fill="#b91c1c">⚡</text>' : ''}
    <circle cx="120" cy="186" r="40" fill="#292524"/>
    ${labels.map(([t, a]) => { const r = (a - 90) * Math.PI / 180; return `<text x="${120 + 54 * Math.cos(r)}" y="${186 + 54 * Math.sin(r) + 3}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#422006">${t}</text>`; }).join('')}
    <g transform="rotate(${ang} 120 186)" style="transition:transform .5s"><circle cx="120" cy="186" r="30" fill="url(#cmKnob)"/><rect x="116" y="158" width="8" height="24" rx="4" fill="#e5e7eb"/></g>
    <rect x="44" y="236" width="44" height="22" rx="6" fill="#b91c1c"/><text x="66" y="251" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">TEST</text>
    <circle cx="150" cy="247" r="9" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/><circle cx="182" cy="247" r="9" fill="#111827" stroke="#000" stroke-width="2"/>
  </svg>`;
}

// ═════════════════════════════════════════ TAB 2 — device functional test
function makeRunner(sys, onChange) {
  const r = { job: null, queue: [], timer: null, log: [] };
  const findEv = (d, kind, t0, pre) => [...sys.events.values()].find((e) => e.devId === d.id && e.kind === kind && (pre ? true : e.t >= t0 - 0.01));
  const obsFor = (d) => [...sys.events.values()].filter((e) => (e.addr === d.addr || e.devId === d.id) && (e.kind === 'trouble' || e.kind === 'disable')).map((e) => e.text);
  const finish = (res) => {
    const j = r.job; const d = sys.dev(j.id);
    const prev = S.tests[j.id] || {};
    S.tests[j.id] = { method: j.method, methodOk: j.methodOk, result: res.result, rt: res.rt, time: now(), obs: res.obs, diag: prev.diag || '' };
    save();
    r.log.unshift({ addr: d?.addr, result: res.result, text: res.note });
    r.log = r.log.slice(0, 40);
    r.job = null;
    onChange();
    if (r.queue.length) setTimeout(() => r.next(), 150);
  };
  r.start = (id, method) => {
    const d = sys.dev(id); if (!d || r.job) return;
    const ptype = progType(sys, d);
    const M = METHODS[method];
    if (M?.bad) {
      S.tests[id] = { method, methodOk: false, result: 'fail', rt: null, time: now(), obs: [M.bad], diag: S.tests[id]?.diag || '' }; save();
      r.log.unshift({ addr: d.addr, result: 'fail', text: tr(M.bad) }); onChange();
      if (r.queue.length) setTimeout(() => r.next(), 150);
      return;
    }
    const preEv = EXPECT[ptype] ? findEv(d, EXPECT[ptype], 0, true) : null;
    r.job = { id, method, kind: M?.kind, ptype, methodOk: CORRECT[ptype] === method, t0: sys.time, phase: 'apply', limit: LIMIT[ptype] || 20, found: null, preEv: !!preEv, obs: obsFor(d), clearT: null };
    if (r.job.kind) sys.test(id, r.job.kind);
    r.job.phase = 'wait';
    onChange();
  };
  r.next = () => { while (r.queue.length) { const [id, meth] = r.queue.shift(); if (sys.dev(id)) { r.start(id, meth); return; } } onChange(); };
  r.tick = () => {
    const j = r.job; if (!j) return;
    for (let i = 1; i < (S.speed || 1); i++) sys.step(0.2);
    const d = sys.dev(j.id); if (!d) { r.job = null; onChange(); return; }
    const el = sys.time - j.t0;
    if (j.phase === 'wait') {
      const exp = EXPECT[j.ptype];
      if (!j.kind) {
        if (el >= 2) {
          const ok = d.comm && !d.dup && !d.disabled && d.fault !== 'dead' && sys.config[d.addr]?.type === d.type && j.methodOk;
          j.found = ok ? el : null; j.obs = obsFor(d);
          j.phase = 'reset';
        }
      } else {
        const e = findEv(d, exp, j.t0, false) || (j.preEv ? findEv(d, exp, 0, true) : null);
        if (e) { j.found = j.preEv ? 0 : el; j.obs = obsFor(d); endDev(d); j.phase = 'clear'; j.clearT = sys.time; }
        else if (el > j.limit) { j.obs = obsFor(d); endDev(d); j.phase = 'clear'; j.clearT = sys.time; }
      }
    } else if (j.phase === 'clear') {
      const cleared = (d.val ?? 0) < 0.6 && (d.temp ?? 24) < 45;
      if (cleared || sys.time - j.clearT > 40) j.phase = 'reset';
    } else if (j.phase === 'reset') {
      const lvl = sys.accessLevel; sys.accessLevel = 2; sys.reset(); sys.accessLevel = lvl;
      const obs = j.obs.map((o) => o);
      let result, note;
      if (j.preEv) { result = 'warn'; obs.unshift(T('Signal was ALREADY active before the test was applied', 'كانت الإشارة نشطة قبل تطبيق الاختبار')); note = L('Signal already active before test', 'الإشارة نشطة قبل الاختبار'); }
      else if (j.found == null) { result = 'fail'; note = j.methodOk ? L('No response within time limit', 'لا استجابة ضمن المهلة') : L('No response – check test method', 'لا استجابة – راجع طريقة الاختبار'); }
      else if (obs.length) { result = 'warn'; note = L('Alarm OK, trouble present', 'الإنذار سليم مع وجود عطل'); }
      else { result = 'pass'; note = L('Correct signal at correct address', 'إشارة صحيحة على العنوان الصحيح'); }
      if (!j.methodOk && result === 'pass') note += ' · ' + L('wrong method', 'طريقة خاطئة');
      finish({ result, rt: j.found, obs, note });
    }
    onChange(true);
  };
  function endDev(d) { if (d.type === 'mcp') sys.resetMcp(d.id); else sys.endTest(d.id); }
  r.timer = setInterval(r.tick, 200);
  r.abort = () => {
    clearInterval(r.timer); r.queue = [];
    if (r.job) { const d = sys.dev(r.job.id); if (d) endDev(d); const l = sys.accessLevel; sys.accessLevel = 2; sys.reset(); sys.accessLevel = l; r.job = null; }
  };
  return r;
}

function tabDev(body, ctx, runner) {
  const sys = ctx.sys;
  const floors = [['all', L('All floors', 'كل الطوابق')], ...FLOORS.map((f) => [f.id, tr(f.name)])];
  const filters = [['all', L('All', 'الكل')], ['todo', L('Untested', 'غير مختبر')], ['pass', L('Pass', 'ناجح')], ['bad', L('Fail / defect', 'فشل / عيب')]];
  const visible = () => sys.loopNodes().filter((d) => (S.floor === 'all' || d.floor === S.floor) && (S.filter === 'all'
    || (S.filter === 'todo' && !S.tests[d.id]) || (S.filter === 'pass' && S.tests[d.id]?.result === 'pass') || (S.filter === 'bad' && ['fail', 'warn'].includes(S.tests[d.id]?.result))));
  const resultPill = (t) => !t ? `<span class="adv-pill">${L('Not tested', 'لم يُختبر')}</span>`
    : t.result === 'pass' ? `<span class="adv-pill ok">PASS</span>` : t.result === 'warn' ? `<span class="adv-pill warn">${L('PASS · defect', 'ناجح · عيب')}</span>` : `<span class="adv-pill bad">FAIL</span>`;
  const methodOpts = (sel) => `<option value="">${L('— select method —', '— اختر الطريقة —')}</option>` + Object.entries(METHODS).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(tr(v.name))}</option>`).join('');

  const shell = () => {
    body.innerHTML = `
    <div class="card cm-toolbar">
      <div class="adv-btns">
        <button class="btn danger" id="cmStart">🧪 ${L('Start commissioning session with hidden installation defects', 'بدء جلسة استلام مع عيوب تركيب مخفية')}</button>
        <button class="btn" id="cmClean">🧹 ${L('Clean project', 'مشروع نظيف')}</button>
        <span class="cm-sess" id="cmSess"></span>
        <span style="margin-inline-start:auto" class="cm-speed">${L('Test speed', 'سرعة الاختبار')}
          ${[1, 4, 10].map((s) => `<button data-speed="${s}" class="${S.speed === s ? 'on' : ''}">×${s}</button>`).join('')}</span>
      </div>
      <div class="cm-progress"><div class="bar" id="cmBar"></div><span id="cmBarTx"></span></div>
      <div class="adv-stats" id="cmStats" style="margin:10px 0 0"></div>
    </div>
    <div class="cm-devgrid">
      <div class="card cm-devtable">
        <div class="cm-filters">
          <div class="cm-chips">${floors.map(([k, v]) => `<button data-fl="${k}" class="${S.floor === k ? 'on' : ''}">${esc(v)}</button>`).join('')}</div>
          <div class="cm-chips">${filters.map(([k, v]) => `<button data-ft="${k}" class="${S.filter === k ? 'on' : ''}">${esc(v)}</button>`).join('')}</div>
          <button class="btn sm primary" id="cmRunAll" style="margin-inline-start:auto">▶ ${L('Run all visible with chosen methods', 'تشغيل كل الظاهر بالطرق المختارة')}</button>
        </div>
        <details class="cm-bytype"><summary>${L('Set method by device type (applies to untested devices)', 'تحديد الطريقة حسب نوع الجهاز (للأجهزة غير المختبرة)')}</summary>
          <div class="cm-bytype-g">${Object.keys(CORRECT).map((t) => `<label class="adv-field">${esc(typeName(t))}<select data-bytype="${t}">${methodOpts('')}</select></label>`).join('')}</div>
        </details>
        <div class="adv-scroll cm-scroll"><table class="adv-table cm-dt">
          <thead><tr><th class="num">${L('Addr', 'العنوان')}</th><th>${L('Floor', 'الطابق')}</th><th>${L('Location', 'الموقع')}</th><th>${L('Programmed type', 'النوع المبرمج')}</th><th>${L('Test method', 'طريقة الاختبار')}</th><th></th><th>${L('Result', 'النتيجة')}</th><th class="num">${L('Resp. s', 'الاستجابة ث')}</th><th>${L('Diagnosis', 'التشخيص')}</th></tr></thead>
          <tbody id="cmRows"></tbody></table></div>
      </div>
      <div class="cm-side">
        <div class="hmi cm-live" id="cmLive"></div>
        <div class="card"><h3>${L('FACP EVENT DISPLAY', 'شاشة أحداث اللوحة')}<span class="r" id="cmEvCount"></span></h3><div class="adv-log cm-lcd" id="cmLcd"></div></div>
        <div class="card" id="cmSummary"></div>
      </div>
    </div>`;
    body.querySelector('#cmStart').onclick = () => {
      if (runner.job) return;
      ctx.resetProject();
      const planted = sys.plantFaults(3);
      S.session = { id: 'CX-' + Date.now().toString(36).toUpperCase().slice(-6), started: now(), planted, clean: false };
      S.tests = {}; S.pre = {}; S.submitted = null; save(); shell(); rows(); live();
    };
    body.querySelector('#cmClean').onclick = () => {
      if (runner.job) return;
      ctx.resetProject();
      S.session = { id: 'CX-' + Date.now().toString(36).toUpperCase().slice(-6), started: now(), planted: [], clean: true };
      S.tests = {}; S.pre = {}; S.submitted = null; save(); shell(); rows(); live();
    };
    body.querySelectorAll('[data-speed]').forEach((b) => { b.onclick = () => { S.speed = +b.dataset.speed; save(); body.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('on', x === b)); }; });
    body.querySelectorAll('[data-fl]').forEach((b) => { b.onclick = () => { S.floor = b.dataset.fl; save(); body.querySelectorAll('[data-fl]').forEach((x) => x.classList.toggle('on', x === b)); rows(); }; });
    body.querySelectorAll('[data-ft]').forEach((b) => { b.onclick = () => { S.filter = b.dataset.ft; save(); body.querySelectorAll('[data-ft]').forEach((x) => x.classList.toggle('on', x === b)); rows(); }; });
    body.querySelectorAll('[data-bytype]').forEach((s) => {
      s.onchange = () => { for (const d of sys.devices) if (progType(sys, d) === s.dataset.bytype && !S.tests[d.id]) S.methods[d.id] = s.value; save(); rows(); };
    });
    body.querySelector('#cmRunAll').onclick = () => {
      if (runner.job) return;
      runner.queue = visible().filter((d) => !S.tests[d.id] && S.methods[d.id]).map((d) => [d.id, S.methods[d.id]]);
      if (!runner.queue.length) { flash(L('Choose a test method for the untested devices first.', 'اختر طريقة الاختبار للأجهزة غير المختبرة أولاً.')); return; }
      runner.next();
    };
  };
  let flashMsg = null; let liveKey = '';
  const flash = (t) => { flashMsg = t; live(); setTimeout(() => { flashMsg = null; live(); }, 3500); };

  const rows = () => {
    const tb = body.querySelector('#cmRows'); if (!tb) return;
    const list = visible();
    tb.innerHTML = list.map((d) => {
      const t = S.tests[d.id]; const busy = runner.job?.id === d.id;
      const pt = progType(sys, d);
      return `<tr class="${busy ? 'cm-busy' : ''} ${t ? 'cm-r-' + t.result : ''}" data-row="${d.id}">
        <td class="num"><b>${pad3(d.addr)}</b></td><td>${esc(d.floor)}</td>
        <td><div class="cm-loc">${esc(tr(d.label))}</div></td>
        <td><span class="cm-typ"><span class="cm-sym cm-sym-${pt}">${DEVICE_TYPES[pt]?.sym || '?'}</span>${esc(shortName(pt))}</span></td>
        <td><select class="cm-msel" data-meth="${d.id}">${methodOpts(S.methods[d.id] || t?.method || '')}</select>
          ${t && !t.methodOk ? `<div class="cm-merr">⚠ ${L('Wrong method', 'طريقة خاطئة')}</div>` : ''}</td>
        <td><button class="btn sm ${t ? '' : 'primary'}" data-test="${d.id}" ${runner.job ? 'disabled' : ''}>${busy ? '⏳' : t ? '↻' : '▶'} ${L('Test', 'اختبار')}</button></td>
        <td>${resultPill(t)}${t?.obs?.length ? `<div class="cm-obs" title="${esc(t.obs.map(tr).join(' | '))}">${esc(tr(t.obs[0]))}</div>` : ''}</td>
        <td class="num">${t?.rt != null ? t.rt.toFixed(1) : '—'}</td>
        <td>${t ? `<select class="cm-dsel ${t.diag && t.diag !== 'none' ? 'set' : ''}" data-diag="${d.id}">${DIAGS.map((k) => `<option value="${k === 'none' ? '' : k}" ${(t.diag || '') === (k === 'none' ? '' : k) ? 'selected' : ''}>${esc(diagName(k))}</option>`).join('')}</select>` : ''}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="9" class="adv-note">${L('No devices match the filter.', 'لا توجد أجهزة مطابقة للتصفية.')}</td></tr>`;
    tb.querySelectorAll('[data-meth]').forEach((s) => { s.onchange = () => { S.methods[s.dataset.meth] = s.value; save(); }; });
    tb.querySelectorAll('[data-test]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.test; const meth = S.methods[id] || S.tests[id]?.method;
        if (!meth) { flash(L('Select the test method for this device first.', 'اختر طريقة اختبار هذا الجهاز أولاً.')); return; }
        runner.start(id, meth); rows();
      };
    });
    tb.querySelectorAll('[data-diag]').forEach((s) => { s.onchange = () => { S.tests[s.dataset.diag].diag = s.value; save(); summary(); s.classList.toggle('set', !!s.value); }; });
    summary();
  };

  const summary = () => {
    const ev = evalSession(sys);
    const bar = body.querySelector('#cmBar');
    if (bar) { bar.style.width = `${ev.coverage * 100}%`; body.querySelector('#cmBarTx').innerHTML = `${L('Coverage', 'التغطية')} ${N(Math.round(ev.coverage * 100) + ' %')} · ${N(ev.tested + '/' + ev.total)}`; }
    const se = body.querySelector('#cmSess');
    if (se) se.innerHTML = S.session ? `<span class="adv-pill ${S.session.clean ? 'ok' : 'warn'}">${S.session.clean ? L('Clean project', 'مشروع نظيف') : L('Hidden defects', 'عيوب مخفية')}</span> <span class="cm-n">${esc(S.session.id)}</span>` : `<span class="adv-pill">${L('No session — using the current project', 'لا جلسة — يُستخدم المشروع الحالي')}</span>`;
    const st = body.querySelector('#cmStats');
    if (st) st.innerHTML = stat(L('Devices tested', 'أجهزة مختبرة'), `${ev.tested}/${ev.total}`) + stat('PASS', ev.pass, '', 'ok') + stat(L('Pass · defect', 'ناجح · عيب'), ev.warn, '', ev.warn ? 'warn' : '') + stat('FAIL', ev.fail, '', ev.fail ? 'alarm' : '') + stat(L('Correct method', 'طريقة صحيحة'), Math.round(ev.methodOk * 100), '%') + stat(L('Defects diagnosed', 'عيوب مشخّصة'), S.session && !S.session.clean ? `${ev.nFound}/${ev.planted.length}` : '—');
    const sm = body.querySelector('#cmSummary'); if (!sm) return;
    const sub = S.submitted;
    sm.innerHTML = `<h3>${L('ACCEPTANCE RESULT', 'نتيجة الاستلام')}</h3>
      <div class="adv-note" style="margin-bottom:8px">${L('Target: test ≥ 90 % of devices with the correct methods and diagnose every hidden defect (device defects here, cable / NAC / earth defects in the pre-functional checklist).', 'الهدف: اختبار ≥ 90% من الأجهزة بالطرق الصحيحة وتشخيص كل العيوب المخفية (عيوب الأجهزة هنا، وعيوب الكابلات والإنذار والتسرب الأرضي في قائمة ما قبل التشغيل).')}</div>
      ${sub ? scoreBanner(sub.score, sub.complete ? L('Acceptance test complete — module recorded.', 'اكتمل اختبار الاستلام — تم تسجيل الوحدة.') : L('Not complete yet: need ≥ 90 % coverage and all defects diagnosed.', 'غير مكتمل: يلزم تغطية ≥ 90% وتشخيص كل العيوب.')) : ''}
      ${sub && S.session && !S.session.clean ? `<div class="adv-findings">${ev.found.map((f) => `<div class="adv-finding ${f.ok ? 'ok' : 'error'}"><span class="ic">${f.ok ? '✅' : '❌'}</span><span>${esc(tr(FAULT_KINDS[f.p.kind]))}${f.p.addr ? ` – ${L('address', 'العنوان')} ${N(pad3(f.p.addr))}` : ''}</span></div>`).join('')}
        ${ev.falseDiag ? `<div class="adv-finding warn"><span class="ic">⚠</span><span>${L(`${ev.falseDiag} diagnosis(es) on healthy devices (−5 each)`, `${ev.falseDiag} تشخيص على أجهزة سليمة (−5 لكل منها)`)}</span></div>` : ''}</div>` : ''}
      <div class="adv-btns" style="margin-top:10px"><button class="btn primary" id="cmSubmit">📋 ${L('Submit test report', 'تسليم تقرير الاختبار')}</button>
      <button class="btn" id="cmCsv">⬇ CSV</button></div>`;
    sm.querySelector('#cmSubmit').onclick = () => {
      const e = evalSession(sys);
      S.submitted = { score: e.score, complete: e.complete, at: now() }; save();
      if (e.complete) { markDone('commission', e.score); ctx.helpers?.recordResult?.({ type: 'lab', topic: 'commission/functional-test', score: e.score, total: 100 }); }
      summary();
    };
    sm.querySelector('#cmCsv').onclick = () => exportCsv(sys);
  };

  const live = (fast) => {
    const lv = body.querySelector('#cmLive'); if (!lv) return;
    const j = runner.job; const d = j && sys.dev(j.id);
    const el = j ? sys.time - j.t0 : 0;
    const steps = j ? [
      [L('Notify monitoring station & occupants – test in progress', 'إبلاغ مركز المراقبة والشاغلين – اختبار جارٍ'), true],
      [`${L('Apply', 'تطبيق')}: ${tr(METHODS[j.method].name)}`, true],
      [`${L('Wait for', 'انتظار')} ${EXPECT[j.ptype] === 'super' ? 'SUPERVISORY' : EXPECT[j.ptype] ? 'FIRE' : L('output confirmation', 'تأكيد المخرج')} @ ${pad3(d?.addr ?? 0)} (≤ ${j.limit} s)`, j.phase !== 'wait'],
      [L('End test / restore device, clear smoke', 'إنهاء الاختبار / إعادة الجهاز، تصريف الدخان'), j.phase === 'reset'],
      [L('Reset panel (access level 2)', 'إعادة ضبط اللوحة (مستوى الوصول 2)'), false],
    ] : [];
    const key = j ? `${j.id}:${j.phase}:${runner.log.length}` : `idle:${flashMsg}:${runner.log.length}:${runner.log[0]?.addr}`;
    if (key === liveKey && j) {
      const tm = lv.querySelector('.cm-timer span'); if (tm) tm.textContent = el.toFixed(1);
      const tb = lv.querySelector('.cm-tbar i'); if (tb) tb.style.width = `${clamp(el / j.limit * 100, 0, 100)}%`;
      const st = lv.querySelector('.cm-simt'); if (st) st.textContent = `SIM t=${sys.time.toFixed(0)} s · ×${S.speed}`;
      const tx = lv.querySelector('.cm-val'); if (tx && d) tx.textContent = liveVal(d);
    } else {
      liveKey = key;
    lv.innerHTML = `<div class="hmi-bar"><span class="dot" style="background:${j ? '#f59e0b' : '#22c55e'};border-radius:50%;display:inline-block"></span> TEST SET · ${j ? 'RUNNING' : 'IDLE'}<span style="margin-left:auto" class="cm-simt">SIM t=${sys.time.toFixed(0)} s · ×${S.speed}</span></div>
      ${j && d ? `<div class="cm-live-g">
          <div>${testSvg(j.ptype, j.method, j.phase, d)}</div>
          <div><div class="cm-live-addr">${pad3(d.addr)} · ${esc(d.floor)}F</div><div class="cm-live-loc">${esc(tr(d.label))}</div>
          <div class="cm-timer"><span>${el.toFixed(1)}</span> s <small>/ ${j.limit} s</small></div>
          <div class="cm-tbar"><i style="width:${clamp(el / j.limit * 100, 0, 100)}%"></i></div></div></div>
          <ol class="cm-steps">${steps.map(([t, ok], i) => `<li class="${ok ? 'ok' : i === steps.findIndex((s) => !s[1]) ? 'cur' : ''}">${esc(t)}</li>`).join('')}</ol>`
        : `<div class="cm-idle">${flashMsg ? `<div class="cm-flash">${esc(flashMsg)}</div>` : ''}${L('Select a method for a device and press Test. The panel event log is watched for the correct signal at the correct address within the time limit.', 'اختر طريقة لجهاز واضغط اختبار. تتم مراقبة سجل أحداث اللوحة لالتقاط الإشارة الصحيحة على العنوان الصحيح ضمن المهلة.')}
          <div class="cm-lim">${Object.entries(LIMIT).filter(([k]) => EXPECT[k]).map(([k, v]) => `<span>${DEVICE_TYPES[k].sym} ≤ ${v}s</span>`).join('')}</div></div>`}
      <div class="cm-rlog">${runner.log.slice(0, 6).map((l) => `<div class="${l.result}"><b>${pad3(l.addr ?? 0)}</b> ${l.result.toUpperCase()} – ${esc(l.text)}</div>`).join('')}</div>`;
    }
    const lcd = body.querySelector('#cmLcd');
    if (lcd) {
      const evs = sys.sortedEvents();
      body.querySelector('#cmEvCount').innerHTML = `<span class="adv-pill ${sys.count('fire') ? 'bad' : evs.length ? 'warn' : 'ok'}">${evs.length} ${L('active', 'نشط')}</span>`;
      lcd.innerHTML = evs.length ? evs.slice(0, 9).map((e) => `<div class="${e.kind}"><span class="t">${e.kind.toUpperCase().padEnd(7)}</span>${esc(tr(e.text))}</div>`).join('') : `<div class="ok">SYSTEM NORMAL · ${new Date().toLocaleDateString()}</div>`;
    }
  };
  shell(); rows(); live();
  let lastJob = null;
  const api = {
    onRunnerChange() {
      const cur = runner.job?.id || null;
      if (cur !== lastJob) { lastJob = cur; rows(); }
      live(true);
    },
    cleanup() { /* runner persists across tabs; aborted when leaving the module */ },
  };
  const iv = setInterval(() => { if (!runner.job) live(true); }, 1000);
  api.cleanup = () => clearInterval(iv);
  return api;
}

function liveVal(d) { return `${d.type === 'heat' || d.type === 'multi' ? Math.round(d.temp) + ' °C · ' : ''}${L('analog', 'تناظري')} ${Math.round((d.val || 0) * 100)} %`; }
function testSvg(type, method, phase, d) {
  const alarm = phase !== 'wait';
  const led = `<circle cx="100" cy="46" r="4" fill="${alarm ? '#ef4444' : '#22c55e'}">${alarm ? '<animate attributeName="opacity" values="1;.2;1" dur=".6s" repeatCount="indefinite"/>' : ''}</circle>`;
  const ceiling = '<rect x="0" y="0" width="200" height="22" fill="#1e293b"/><line x1="0" y1="22" x2="200" y2="22" stroke="#334155" stroke-width="2"/>';
  const det = `<g><ellipse cx="100" cy="34" rx="34" ry="8" fill="#e2e8f0"/><rect x="70" y="22" width="60" height="14" rx="5" fill="#f1f5f9"/><ellipse cx="100" cy="36" rx="30" ry="6" fill="#cbd5e1"/>${led}</g>`;
  let tool = '';
  if (method === 'aerosol' || method === 'combo') tool = `<g transform="translate(118 70) rotate(-25)"><rect x="0" y="0" width="16" height="44" rx="4" fill="#dc2626"/><rect x="3" y="-7" width="10" height="8" rx="2" fill="#94a3b8"/><rect x="-2" y="44" width="20" height="36" rx="3" fill="#64748b"/></g>
    ${phase === 'wait' ? [0, 1, 2].map((i) => `<circle cx="112" cy="58" r="5" fill="#cbd5e1" opacity=".8"><animate attributeName="cy" values="60;40" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/><animate attributeName="r" values="4;14" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/></circle>`).join('') : ''}`;
  if (method === 'heatgun' || method === 'combo') tool += `<g transform="translate(40 70)"><rect x="0" y="10" width="46" height="18" rx="6" fill="#f97316"/><rect x="40" y="13" width="18" height="12" rx="2" fill="#475569"/><rect x="8" y="26" width="12" height="28" rx="3" fill="#ea580c"/></g>
    ${phase === 'wait' ? [0, 1].map((i) => `<path d="M98 80 q6 -8 0 -16 q-6 -8 0 -16" stroke="#fb923c" stroke-width="2" fill="none" opacity=".8"><animate attributeName="opacity" values="0;.9;0" dur="1s" begin="${i * 0.5}s" repeatCount="indefinite"/></path>`).join('') : ''}`;
  if (type === 'mcp') return `<svg viewBox="0 0 200 130" class="adv-svg"><rect width="200" height="130" fill="#0f172a"/><rect x="60" y="15" width="80" height="90" rx="8" fill="#dc2626"/><rect x="72" y="30" width="56" height="48" rx="3" fill="${alarm ? '#fecaca' : '#fef2f2'}"/><text x="100" y="58" text-anchor="middle" font-size="11" font-weight="700" fill="#991b1b">FIRE</text><circle cx="100" cy="92" r="4" fill="${alarm ? '#fbbf24' : '#7f1d1d'}"/><rect x="138" y="${alarm ? 88 : 80}" width="34" height="8" rx="3" fill="#94a3b8"/></svg>`;
  if (type === 'flow') return `<svg viewBox="0 0 200 130" class="adv-svg"><rect width="200" height="130" fill="#0f172a"/><rect x="0" y="55" width="200" height="22" fill="#64748b"/><rect x="0" y="59" width="200" height="14" fill="#1d4ed8"/>${phase === 'wait' ? '<line x1="0" y1="66" x2="200" y2="66" stroke="#93c5fd" stroke-width="3" stroke-dasharray="10 12"><animate attributeName="stroke-dashoffset" values="44;0" dur=".6s" repeatCount="indefinite"/></line>' : ''}<rect x="84" y="28" width="32" height="28" rx="4" fill="#e11d48"/><text x="100" y="46" text-anchor="middle" font-size="9" fill="#fff">VSR</text><rect x="150" y="77" width="10" height="30" fill="#64748b"/><circle cx="155" cy="112" r="10" fill="#b91c1c"/><text x="100" y="120" text-anchor="middle" font-size="9" fill="#94a3b8">${phase === 'wait' ? 'ITV OPEN · retard 20 s' : 'ITV CLOSED'}</text></svg>`;
  if (type === 'tamper') return `<svg viewBox="0 0 200 130" class="adv-svg"><rect width="200" height="130" fill="#0f172a"/><rect x="0" y="80" width="200" height="22" fill="#b91c1c"/><rect x="80" y="70" width="40" height="42" rx="4" fill="#991b1b"/><rect x="97" y="40" width="6" height="32" fill="#94a3b8"/><g transform="rotate(${phase === 'wait' ? 0 : 0} 100 40)"><circle cx="100" cy="40" r="22" fill="none" stroke="#dc2626" stroke-width="5">${phase === 'wait' ? '<animateTransform attributeName="transform" type="rotate" from="0 100 40" to="720 100 40" dur="3s" fill="freeze"/>' : ''}</circle><line x1="78" y1="40" x2="122" y2="40" stroke="#dc2626" stroke-width="4"/></g><rect x="126" y="64" width="26" height="18" rx="3" fill="#facc15"/><text x="139" y="76" text-anchor="middle" font-size="8" fill="#422006">TS</text></svg>`;
  if (type === 'relay' || type === 'iso') return `<svg viewBox="0 0 200 130" class="adv-svg"><rect width="200" height="130" fill="#0f172a"/><rect x="60" y="30" width="80" height="60" rx="6" fill="#e2e8f0"/><text x="100" y="58" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">${type === 'relay' ? 'CM' : 'ISO'}</text><circle cx="100" cy="76" r="4" fill="${alarm ? '#f59e0b' : '#22c55e'}"/><text x="100" y="116" text-anchor="middle" font-size="9" fill="#94a3b8">${type === 'relay' ? 'OUTPUT → AHU / DAMPER' : 'LOOP SHORT → ISOLATE'}</text></svg>`;
  return `<svg viewBox="0 0 200 130" class="adv-svg"><rect width="200" height="130" fill="#0f172a"/>${ceiling}${det}${tool}<text x="8" y="122" font-size="10" fill="#94a3b8" class="cm-val">${d ? liveVal(d) : ''}</text></svg>`;
}

function exportCsv(sys) {
  const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const lines = [['Address', 'Floor', 'Location', 'Programmed type', 'Test method', 'Method correct', 'Result', 'Response (s)', 'Tested at', 'Observation', 'Diagnosis'].join(',')];
  for (const d of sys.loopNodes()) {
    const t = S.tests[d.id];
    lines.push([pad3(d.addr), d.floor, q(d.label.en), progType(sys, d), t ? q(METHODS[t.method]?.name.en) : '', t ? (t.methodOk ? 'yes' : 'no') : '', t ? t.result.toUpperCase() : 'NOT TESTED', t?.rt != null ? t.rt.toFixed(1) : '', t?.time || '', q((t?.obs || []).map((o) => o.en || o).join(' | ')), t?.diag || ''].join(','));
  }
  download(`device-test-log-${S.session?.id || 'project'}.csv`, '﻿' + lines.join('\r\n'), 'text/csv');
}

// ═════════════════════════════════════════ TAB 3 — audibility & visibility
function roomAt(rooms, x, y) { return rooms.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); }
function sources(sys, floor) {
  return [...sys.nacDevices.filter((n) => n.floor === floor).map((n) => ({ x: n.x, y: n.y, extra: false })), ...(S.aud.extra[floor] || []).map((e) => ({ ...e, extra: true }))];
}
function levelAt(src, rooms, x, y) {
  const r = roomAt(rooms, x, y); const k = r?.kind || 'corridor';
  let e = 0;
  for (const s of src) {
    const d = Math.max(0.5, Math.hypot(s.x - x, s.y - y));
    const sr = roomAt(rooms, s.x, s.y);
    const loss = sr?.id === r?.id ? 0 : WALL[k] ?? 10;
    e += 10 ** ((88 - 20 * Math.log10(d / 3) - loss) / 10);
  }
  return e ? 10 * Math.log10(e) : 0;
}
function roomMeasure(src, rooms, r) {
  let min = 999, max = 0;
  for (let x = r.x + 0.6; x <= r.x + r.w - 0.6; x += 0.8) for (let y = r.y + 0.6; y <= r.y + r.h - 0.6; y += 0.8) {
    const v = levelAt(src, rooms, x, y); min = Math.min(min, v); max = Math.max(max, v);
  }
  const jitter = (((r.x * 7 + r.y * 13 + r.w) % 10) - 5) / 10;
  return { min: min + jitter, max: max + jitter };
}
function tabAud(body, ctx) {
  const sys = ctx.sys;
  const W = 960, H = 440, sc = 20;
  const draw = () => {
    const fl = S.aud.floor; const rooms = roomsFor(fl); const src = sources(sys, fl);
    const meas = S.aud.meas[fl] || {}; const ver = S.aud.verdict[fl] || {};
    const occ = rooms.filter((r) => AMB[r.kind] != null);
    const sel = rooms.find((r) => r.id === S.aud.room) || null;
    const rows = occ.map((r) => {
      const amb = AMB[r.kind]; const req = amb + 15; const mm = meas[r.id];
      const truth = mm ? (mm.min >= req && mm.max + 0 <= 110) : null; const v = ver[r.id];
      return { r, amb, req, mm, truth, v, right: v && mm ? (v === 'pass') === truth : null };
    });
    const nMeas = rows.filter((x) => x.mm).length, nRight = rows.filter((x) => x.right).length, nWrong = rows.filter((x) => x.right === false).length;
    body.innerHTML = `
    <div class="adv-stats">
      ${stat(L('Rooms surveyed', 'غرف تم مسحها'), `${nMeas}/${occ.length}`)}
      ${stat(L('Correct verdicts', 'أحكام صحيحة'), nRight, '', 'ok')}
      ${stat(L('Wrong verdicts', 'أحكام خاطئة'), nWrong, '', nWrong ? 'alarm' : '')}
      ${stat(L('Appliances on floor', 'أجهزة التنبيه في الطابق'), src.length)}
      ${stat(L('Output @ 3 m', 'الخرج على 3 م'), 88, 'dBA')}
    </div>
    <div class="cm-audgrid">
      <div class="card">
        <h3>${L('SOUND PRESSURE MAP – ALL NACs OPERATING', 'خريطة ضغط الصوت – كل دوائر الإنذار تعمل')}
          <span class="r cm-chips">${FLOORS.map((f) => `<button data-afl="${f.id}" class="${fl === f.id ? 'on' : ''}">${esc(tr(f.name))}</button>`).join('')}</span></h3>
        <svg viewBox="0 0 ${W} ${H}" class="adv-svg cm-plan" id="cmPlan">
          <rect width="${W}" height="${H}" fill="#0b1220"/>
          <image id="cmHeat" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>
          ${rooms.map((r) => {
            const rw = rows.find((x) => x.r.id === r.id);
            const cls = !rw ? 'na' : rw.v ? (rw.right ? 'ok' : 'bad') : rw.mm ? 'meas' : '';
            return `<g class="cm-room ${cls} ${sel?.id === r.id ? 'sel' : ''}" data-room="${r.id}"><rect x="${r.x * sc}" y="${r.y * sc}" width="${r.w * sc}" height="${r.h * sc}"/>
              <text x="${(r.x + r.w / 2) * sc}" y="${(r.y + r.h / 2) * sc - (rw?.mm ? 6 : 0)}" text-anchor="middle" class="nm">${esc(tr(r.name))}</text>
              ${rw?.mm ? `<text x="${(r.x + r.w / 2) * sc}" y="${(r.y + r.h / 2) * sc + 12}" text-anchor="middle" class="db">${rw.mm.min.toFixed(1)} dBA</text>` : ''}</g>`;
          }).join('')}
          ${src.map((s) => `<g transform="translate(${s.x * sc} ${s.y * sc})"><circle r="11" fill="${s.extra ? '#7c3aed' : '#dc2626'}" stroke="#fff" stroke-width="2"/><path d="M-4 -4 h3 l4 -3 v14 l-4 -3 h-3z" fill="#fff"/><circle r="11" fill="none" stroke="#fca5a5" stroke-width="2"><animate attributeName="r" values="11;26" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0" dur="1.4s" repeatCount="indefinite"/></circle></g>`).join('')}
        </svg>
        <div class="adv-legend"><span class="cm-scale"><i></i>${N('40')} … ${N('100 dBA')}</span><span><i style="background:#dc2626"></i>${L('Horn/strobe (NAC)', 'بوق/وميض (NAC)')}</span><span><i style="background:#7c3aed"></i>${L('Added appliance (remedial)', 'جهاز مضاف (تصحيحي)')}</span><span>${L('Model: 88 dBA @ 3 m, −6 dB per doubling of distance, walls/doors −6…−25 dB', 'النموذج: 88 dBA على 3 م، −6 dB لكل تضاعف للمسافة، الجدران والأبواب −6…−25 dB')}</span></div>
      </div>
      <div class="cm-side">
        <div class="card" id="cmRoomCard">${sel ? roomCard(sel, rows.find((x) => x.r.id === sel.id)) : `<h3>${L('SOUND LEVEL METER', 'مقياس مستوى الصوت')}</h3><div class="adv-note">${L('Click a room on the plan to take a measurement (A-weighted, slow, at 1.5 m above floor, at the quietest point of the room).', 'انقر على غرفة في المخطط لأخذ قياس (وزن A، بطيء، على ارتفاع 1.5 م، في أهدأ نقطة بالغرفة).')}</div>${slmSvg(null)}`}</div>
        <div class="adv-callout"><b>NFPA 72 §18.4.4.1</b> — ${L('public mode: ≥ 15 dB above the average ambient sound level, measured throughout the occupiable area.', 'الوضع العام: ≥ 15 dB فوق متوسط مستوى الضجيج المحيط، في كامل المساحة المشغولة.')}<br><b>§18.4.1.2</b> — ${L('total SPL ≤ 110 dBA at the minimum hearing distance.', 'إجمالي مستوى الصوت ≤ 110 dBA عند أدنى مسافة سمع.')}</div>
      </div>
    </div>
    <div class="adv-grid c2">
      <div class="card"><h3>${L('AUDIBILITY SURVEY SHEET', 'ورقة مسح مستوى الصوت')} – ${esc(tr(FLOORS.find((f) => f.id === fl).name))}</h3>
        <div class="adv-scroll" style="max-height:340px"><table class="adv-table">
          <thead><tr><th>${L('Room', 'الغرفة')}</th><th class="num">${L('Ambient', 'المحيط')}</th><th class="num">${L('Required', 'المطلوب')}</th><th class="num">${L('Measured min', 'أدنى مقاس')}</th><th class="num">${L('Margin', 'الهامش')}</th><th>${L('Verdict', 'الحكم')}</th></tr></thead>
          <tbody>${rows.map((x) => `<tr data-room="${x.r.id}" class="cm-clk"><td>${esc(tr(x.r.name))}</td><td class="num">${x.amb}</td><td class="num">${x.req}</td><td class="num">${x.mm ? x.mm.min.toFixed(1) : '—'}</td>
            <td class="num" style="color:${x.mm ? (x.mm.min - x.req >= 0 ? 'var(--ok)' : 'var(--alarm)') : ''}">${x.mm ? (x.mm.min - x.req >= 0 ? '+' : '') + (x.mm.min - x.req).toFixed(1) : '—'}</td>
            <td>${x.v ? `<span class="adv-pill ${x.v === 'pass' ? 'ok' : 'bad'}">${x.v === 'pass' ? 'PASS' : 'FAIL'}</span> ${x.right ? '✓' : '<span class="cm-wrong">✗</span>'}` : '—'}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="card">${strobeCard(sys, fl)}</div>
    </div>`;
    // heat map
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 110;
    const g = cv.getContext('2d'); const img = g.createImageData(cv.width, cv.height);
    for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++) {
      const x = (px + 0.5) / cv.width * PLAN.w, y = (py + 0.5) / cv.height * PLAN.h;
      const r = roomAt(rooms, x, y);
      const v = levelAt(src, rooms, x, y);
      const [cr, cg, cb] = heatColor(clamp((v - 40) / 60, 0, 1));
      const i = (py * cv.width + px) * 4; img.data[i] = cr; img.data[i + 1] = cg; img.data[i + 2] = cb; img.data[i + 3] = r?.kind === 'shaft' ? 60 : 200;
    }
    g.putImageData(img, 0, 0);
    body.querySelector('#cmHeat').setAttribute('href', cv.toDataURL());
    body.querySelectorAll('[data-afl]').forEach((b) => { b.onclick = () => { S.aud.floor = b.dataset.afl; S.aud.room = null; save(); draw(); }; });
    body.querySelectorAll('[data-room]').forEach((gel) => { gel.onclick = () => { const r = rooms.find((x) => x.id === gel.dataset.room); if (AMB[r.kind] == null) return; S.aud.room = r.id; save(); draw(); }; });
    const rc = body.querySelector('#cmRoomCard');
    rc.querySelector('[data-measure]')?.addEventListener('click', () => { (S.aud.meas[fl] ||= {})[sel.id] = roomMeasure(src, rooms, sel); save(); draw(); });
    rc.querySelectorAll('[data-av]').forEach((b) => { b.onclick = () => { (S.aud.verdict[fl] ||= {})[sel.id] = b.dataset.av; save(); draw(); }; });
    rc.querySelector('[data-add]')?.addEventListener('click', () => {
      (S.aud.extra[fl] ||= []).push({ x: sel.x + sel.w / 2, y: sel.y + sel.h / 2 });
      if (S.aud.meas[fl]) delete S.aud.meas[fl][sel.id]; if (S.aud.verdict[fl]) delete S.aud.verdict[fl][sel.id]; save(); draw();
    });
    body.querySelector('#cmAudReset')?.addEventListener('click', () => { S.aud.extra[fl] = []; S.aud.meas[fl] = {}; S.aud.verdict[fl] = {}; save(); draw(); });
    body.querySelectorAll('[data-cd]').forEach((s) => { s.onchange = () => { S.aud.cd[s.dataset.cd] = +s.value; save(); draw(); }; });
  };
  const roomCard = (r, x) => {
    const mm = x?.mm;
    return `<h3>${L('SOUND LEVEL METER', 'مقياس مستوى الصوت')} · ${esc(tr(r.name))}</h3>
      ${slmSvg(mm ? mm.min : null)}
      <div class="cm-kv"><span>${L('Average ambient', 'متوسط الضجيج المحيط')}</span><b>${N(x.amb + ' dBA')}</b><span>${L('Required (ambient + 15)', 'المطلوب (المحيط + 15)')}</span><b>${N(x.req + ' dBA')}</b>
      ${mm ? `<span>${L('Highest point', 'أعلى نقطة')}</span><b>${N(mm.max.toFixed(1) + ' dBA')}</b>` : ''}</div>
      <div class="adv-btns" style="margin-top:8px"><button class="btn primary sm" data-measure>🎚 ${L('Measure', 'قياس')}</button>
        <button class="btn sm ${x.v === 'pass' ? 'primary' : ''}" data-av="pass" ${mm ? '' : 'disabled'}>${L('Pass', 'مقبول')}</button>
        <button class="btn sm ${x.v === 'fail' ? 'danger' : ''}" data-av="fail" ${mm ? '' : 'disabled'}>${L('Fail', 'مرفوض')}</button>
        <button class="btn sm ghost" data-add title="${esc(L('Remedial design: add a horn/strobe in this room', 'تصميم تصحيحي: إضافة بوق/وميض في هذه الغرفة'))}">＋ ${L('Add appliance', 'إضافة جهاز')}</button></div>
      ${x.right === false ? `<div class="adv-callout bad" style="margin-top:8px">${L('Wrong verdict — compare the quietest reading with ambient + 15 dB and the 110 dBA ceiling.', 'حكم خاطئ — قارن أهدأ قراءة بالمحيط + 15 dB وبالحد الأعلى 110 dBA.')}</div>` : ''}
      ${x.right ? `<div class="adv-callout" style="margin-top:8px">✓ ${L('Verdict recorded correctly.', 'تم تسجيل الحكم بشكل صحيح.')}</div>` : ''}
      <button class="btn sm ghost" id="cmAudReset" style="margin-top:8px">↺ ${L('Reset floor survey & remedial appliances', 'إعادة ضبط مسح الطابق والأجهزة المضافة')}</button>`;
  };
  draw();
  return null;
}
function heatColor(t) {
  const stops = [[0, [30, 64, 175]], [0.3, [6, 182, 212]], [0.5, [34, 197, 94]], [0.7, [250, 204, 21]], [0.85, [249, 115, 22]], [1, [220, 38, 38]]];
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i]; const k = (t - a) / (b - a);
    return ca.map((c, j) => Math.round(c + (cb[j] - c) * k));
  }
  return stops[stops.length - 1][1];
}
function slmSvg(v) {
  return `<svg viewBox="0 0 260 110" class="adv-svg cm-slm"><defs><linearGradient id="cmSlm" x1="0" x2="1"><stop offset="0" stop-color="#334155"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs>
    <rect x="4" y="20" width="200" height="70" rx="14" fill="url(#cmSlm)"/><circle cx="226" cy="55" r="22" fill="#111827"/><circle cx="226" cy="55" r="16" fill="#374151" stroke="#4b5563" stroke-dasharray="2 2"/>
    <rect x="20" y="32" width="150" height="46" rx="5" fill="#0b1f14"/>
    <text x="160" y="66" text-anchor="end" font-family="monospace" font-size="28" font-weight="700" fill="#4ade80">${v == null ? '--.-' : v.toFixed(1)}</text>
    <text x="26" y="46" font-family="monospace" font-size="9" fill="#86efac">dB(A) SLOW</text><text x="26" y="72" font-family="monospace" font-size="8" fill="#86efac">Lmin</text></svg>`;
}
function strobeCard(sys, fl) {
  const s = sys.nacDevices.filter((n) => n.floor === fl).map((n) => n.x).sort((a, b) => a - b);
  const cor = { x0: 0, x1: 48 };
  const endW = s[0] - cor.x0, endE = cor.x1 - s[s.length - 1];
  let gap = 0; for (let i = 1; i < s.length; i++) gap = Math.max(gap, s[i] - s[i - 1]);
  const ok1 = endW <= 4.57 && endE <= 4.57, ok2 = gap <= 30.5;
  const quiz = [
    { id: 'off6', name: T('Open office 13 × 9 m', 'المكتب المفتوح 13 × 9 م'), w: 13, h: 9 },
    { id: 'lobby', name: T('Lift lobby 6 × 5 m', 'ردهة المصعد 6 × 5 م'), w: 6, h: 5 },
    { id: 'off5', name: T('Office 5 – 12 × 9 m', 'مكتب 5 – 12 × 9 م'), w: 12, h: 9 },
  ];
  const cds = [15, 30, 60, 75, 95, 110, 135, 185];
  return `<h3>${L('VISIBLE NOTIFICATION (STROBES)', 'التنبيه المرئي (الوميض)')}</h3>
    <table class="adv-table"><tbody>
      <tr><td>${L('Corridor: strobe within 4.57 m (15 ft) of each end', 'الممر: وميض ضمن 4.57 م (15 قدم) من كل طرف')} <span class="cm-ref">§18.5.5.5</span></td><td class="num">${endW.toFixed(1)} / ${endE.toFixed(1)} m</td><td><span class="adv-pill ${ok1 ? 'ok' : 'bad'}">${ok1 ? 'PASS' : 'FAIL'}</span></td></tr>
      <tr><td>${L('Corridor: max. 30.5 m (100 ft) between strobes', 'الممر: 30.5 م (100 قدم) كحد أقصى بين أجهزة الوميض')} <span class="cm-ref">§18.5.5.5</span></td><td class="num">${gap.toFixed(1)} m</td><td><span class="adv-pill ${ok2 ? 'ok' : 'bad'}">${ok2 ? 'PASS' : 'FAIL'}</span></td></tr>
      <tr><td>${L('Corridor strobe rating (width ≤ 6.1 m)', 'شدة وميض الممر (عرض ≤ 6.1 م)')}</td><td class="num">15 cd</td><td><span class="adv-pill ok">PASS</span></td></tr>
    </tbody></table>
    ${!ok1 ? `<div class="adv-callout warn" style="margin:8px 0">${L('Corridor ends are not covered — add a strobe near each stair door.', 'طرفا الممر غير مغطيين — أضف جهاز وميض قرب باب كل درج.')}</div>` : ''}
    <div style="margin-top:10px;font-weight:600">${L('Select the minimum candela for one wall-mounted strobe (NFPA 72 Table 18.5.5.4.1(a)):', 'اختر أدنى شدة (كانديلا) لجهاز وميض جداري واحد (جدول NFPA 72 18.5.5.4.1(a)):')}</div>
    <div class="cm-cdq">${quiz.map((q) => {
      const need = reqCd(q.w, q.h); const a = S.aud.cd[q.id];
      return `<label class="adv-field">${esc(tr(q.name))}<select data-cd="${q.id}"><option value="">—</option>${cds.map((c) => `<option value="${c}" ${a === c ? 'selected' : ''}>${c} cd</option>`).join('')}</select>
        ${a ? `<span class="adv-pill ${a === need ? 'ok' : 'bad'}">${a === need ? '✓' : L(`✗ need ${need} cd`, `✗ المطلوب ${need} cd`)}</span>` : ''}</label>`;
    }).join('')}</div>`;
}

// ═════════════════════════════════════════ TAB 4 — battery & power
function tabBatt(body, ctx) {
  const sys = ctx.sys;
  const loads = systemLoads(sys); const calc = batteryCalc(loads);
  const hist = [];
  let chart = null;
  const R_INT = 0.042; // Ω, 2 × 12 V 18 Ah VRLA in series
  const vLoad = () => Math.max(19, sys.battV - loads.alarmA * R_INT - (sys.ac ? 0 : 0.35));
  body.innerHTML = `
  <div class="adv-stats" id="cmBStats"></div>
  <div class="adv-grid c2">
    <div class="card"><h3>${L('POWER SUPPLY SCHEMATIC', 'مخطط مصدر التغذية')}<span class="r" id="cmAcPill"></span></h3>
      <div id="cmPsu"></div>
      <div class="adv-btns" style="margin-top:10px">
        <button class="btn danger" id="cmAcOff">⏻ ${L('Open mains breaker (AC fail test)', 'فتح قاطع التغذية (اختبار انقطاع التيار)')}</button>
        <button class="btn primary" id="cmAcOn">⚡ ${L('Restore AC', 'إعادة التيار')}</button>
        <button class="btn" id="cmVL">🔋 ${L('Measure battery voltage under alarm load', 'قياس جهد البطارية تحت حمل الإنذار')}</button>
      </div>
    </div>
    <div class="card"><h3>${L('BATTERY VOLTAGE TREND', 'منحنى جهد البطارية')}</h3><div style="height:250px"><canvas id="cmBChart"></canvas></div></div>
  </div>
  <div class="adv-grid c2">
    <div class="card"><h3>${L('AC POWER FAILURE TEST', 'اختبار انقطاع التيار الرئيسي')}<span class="r adv-pill info">NFPA 72 T.14.4.3.2 (4)</span></h3><div class="adv-findings" id="cmAcSteps"></div></div>
    <div class="card"><h3>${L('STANDBY CAPACITY CHECK (24 h + 5 min)', 'التحقق من السعة الاحتياطية (24 ساعة + 5 دقائق)')}<span class="r adv-pill info">NFPA 72 §10.6.7.2</span></h3>
      <table class="adv-table"><tbody>
        <tr><td>${L('Measured standby current', 'تيار الاستعداد المقاس')}</td><td class="num">${loads.standbyA.toFixed(3)} A</td></tr>
        <tr><td>${L('Measured alarm current (all NACs)', 'تيار الإنذار المقاس (كل دوائر الإنذار)')}</td><td class="num">${loads.alarmA.toFixed(3)} A</td></tr>
        <tr><td>${L('Installed batteries', 'البطاريات المركّبة')}</td><td class="num">2 × 12 V 18 Ah</td></tr>
      </tbody></table>
      <div class="adv-form" style="margin-top:10px">
        <label class="adv-field">${L('Required capacity incl. 20 % margin (Ah)', 'السعة المطلوبة مع هامش 20% (أمبير·ساعة)')}<input id="cmAh" value="${esc(S.batt.ah)}" placeholder="Ah"></label>
        <label class="adv-field">${L('Battery under load (V)', 'البطارية تحت الحمل (فولت)')}<input id="cmVLin" value="${esc(S.batt.vLoad)}" placeholder="V"></label>
        <label class="adv-field">${L('Installed 18 Ah adequate?', 'هل 18 أمبير·ساعة كافية؟')}<select id="cmSize"><option value="">—</option><option value="yes" ${S.batt.size === 'yes' ? 'selected' : ''}>${L('Yes', 'نعم')}</option><option value="no" ${S.batt.size === 'no' ? 'selected' : ''}>${L('No', 'لا')}</option></select></label>
      </div>
      <div class="adv-note" style="margin-top:8px">Ah = (I<sub>standby</sub> × 24 h + I<sub>alarm</sub> × 5/60 h) × 1.2</div>
      <div id="cmBattRes" style="margin-top:8px"></div>
    </div>
  </div>`;
  const stepsEl = body.querySelector('#cmAcSteps');
  const drawStatic = () => {
    const ah = parseFloat(S.batt.ah), vl = parseFloat(S.batt.vLoad);
    const okAh = Number.isFinite(ah) && Math.abs(ah - calc.ah) / calc.ah <= 0.05;
    const okSize = S.batt.size && (S.batt.size === 'yes') === (18 >= calc.ah);
    const okV = Number.isFinite(vl) && vl >= 24;
    const f = [];
    if (S.batt.ah) f.push(`<div class="adv-finding ${okAh ? 'ok' : 'error'}"><span class="ic">${okAh ? '✅' : '❌'}</span><span>${okAh ? L('Capacity calculation correct', 'حساب السعة صحيح') : L('Check the calculation — standby × 24 h + alarm × 5 min, then × 1.2', 'راجع الحساب — الاستعداد × 24 ساعة + الإنذار × 5 دقائق ثم × 1.2')}</span><span class="ref">${okAh ? calc.ah.toFixed(2) + ' Ah' : ''}</span></div>`);
    if (S.batt.size) f.push(`<div class="adv-finding ${okSize ? 'ok' : 'error'}"><span class="ic">${okSize ? '✅' : '❌'}</span><span>${okSize ? L('Battery size verdict correct', 'الحكم على حجم البطارية صحيح') : L('Compare the required Ah with the installed 18 Ah', 'قارن السعة المطلوبة مع 18 أمبير·ساعة المركّبة')}</span></div>`);
    if (S.batt.vLoad) f.push(`<div class="adv-finding ${okV ? 'ok' : 'warn'}"><span class="ic">${okV ? '✅' : '⚠'}</span><span>${okV ? L('Load voltage within manufacturer limit (≥ 24.0 V)', 'جهد الحمل ضمن حد المصنع (≥ 24.0 فولت)') : L('Load voltage below 24.0 V — battery not fully charged or weak', 'جهد الحمل أقل من 24.0 فولت — البطارية غير مشحونة أو ضعيفة')}</span></div>`);
    body.querySelector('#cmBattRes').innerHTML = `<div class="adv-findings">${f.join('')}</div>`;
    S.batt.done = okAh && okSize && !!S.batt.acRestoredT && !!S.batt.acTroubleT; save();
  };
  const tick = () => {
    const tr0 = sys.events.has('trb:ac');
    if (!sys.ac && S.batt.acOffT != null && S.batt.acTroubleT == null && tr0) { S.batt.acTroubleT = +(sys.time - S.batt.acOffT).toFixed(1); save(); }
    if (sys.ac && S.batt.acOffT != null && S.batt.acTroubleT != null && !tr0 && S.batt.acRestoredT == null) { S.batt.acRestoredT = now(); save(); drawStatic(); }
    const cid = S.batt.acOffT != null && sys.cid.some((c) => c.code === 301 && c.q === 1 && c.t >= S.batt.acOffT - 0.5);
    body.querySelector('#cmBStats').innerHTML = stat(L('Mains (AC)', 'التغذية الرئيسية'), sys.ac ? 'ON' : 'OFF', '', sys.ac ? 'ok' : 'alarm')
      + stat(L('Battery terminal', 'طرف البطارية'), sys.battV.toFixed(2), 'V', sys.battV < 22.5 ? 'alarm' : '')
      + stat(L('Charger', 'الشاحن'), sys.ac ? (sys.battV < 27.25 ? 'BOOST' : 'FLOAT') : '—', sys.ac ? '27.3 V' : '')
      + stat(L('Standby load', 'حمل الاستعداد'), (loads.standbyA * 1000).toFixed(0), 'mA')
      + stat(L('Alarm load', 'حمل الإنذار'), loads.alarmA.toFixed(2), 'A')
      + stat(L('Required capacity', 'السعة المطلوبة'), S.batt.done || (Number.isFinite(parseFloat(S.batt.ah)) && Math.abs(parseFloat(S.batt.ah) - calc.ah) / calc.ah <= 0.05) ? calc.ah.toFixed(2) : L('calc →', 'احسب ←'), 'Ah');
    body.querySelector('#cmAcPill').innerHTML = `<span class="adv-pill ${sys.ac ? 'ok' : 'bad'}">${sys.ac ? L('AC normal', 'التيار طبيعي') : L('ON BATTERY', 'على البطارية')}</span>`;
    body.querySelector('#cmPsu').innerHTML = psuSvg(sys.ac, sys.battV);
    const st = [
      [S.batt.acOffT != null, L('Mains breaker opened (AC removed)', 'فتح قاطع التغذية (فصل التيار)')],
      [S.batt.acTroubleT != null, L(`Panel annunciates AC FAIL trouble${S.batt.acTroubleT != null ? ` (${S.batt.acTroubleT} s)` : ''}`, `اللوحة تُظهر عطل انقطاع التيار${S.batt.acTroubleT != null ? ` (${S.batt.acTroubleT} ث)` : ''}`)],
      [S.batt.acOffT != null && S.batt.acTroubleT != null, L('Seamless transfer to batteries — no loss of function', 'انتقال سلس إلى البطاريات — دون فقدان أي وظيفة')],
      [cid, L('Trouble transmitted to the supervising station (Contact-ID 301)', 'إرسال العطل إلى مركز المراقبة (Contact-ID 301)')],
      [S.batt.acRestoredT != null, L('AC restored, trouble clears, charger recharges', 'عودة التيار، زوال العطل، الشاحن يعيد الشحن')],
    ];
    stepsEl.innerHTML = st.map(([ok, t]) => `<div class="adv-finding ${ok ? 'ok' : ''}"><span class="ic">${ok ? '✅' : '⬜'}</span><span>${esc(t)}</span></div>`).join('');
    hist.push({ t: sys.time, v: sys.battV }); if (hist.length > 180) hist.shift();
    if (chart) { chart.data.datasets[0].data = hist.map((h) => ({ x: h.t, y: h.v })); chart.update('none'); }
  };
  body.querySelector('#cmAcOff').onclick = () => { sys.setAC(false); S.batt.acOffT = sys.time; S.batt.acTroubleT = null; S.batt.acRestoredT = null; save(); tick(); };
  body.querySelector('#cmAcOn').onclick = () => { sys.setAC(true); tick(); };
  body.querySelector('#cmVL').onclick = () => { const v = vLoad().toFixed(2); S.batt.vLoad = v; body.querySelector('#cmVLin').value = v; save(); drawStatic(); };
  body.querySelector('#cmAh').onchange = (e) => { S.batt.ah = e.target.value; save(); drawStatic(); };
  body.querySelector('#cmVLin').onchange = (e) => { S.batt.vLoad = e.target.value; save(); drawStatic(); };
  body.querySelector('#cmSize').onchange = (e) => { S.batt.size = e.target.value; save(); drawStatic(); };
  const mu = css('--muted') || '#888', ln = css('--line') || '#ddd';
  chart = new Chart(body.querySelector('#cmBChart'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'V', data: [], borderColor: css('--accent') || '#0f9d8f', backgroundColor: 'transparent', pointRadius: 0, borderWidth: 2, tension: 0.2 },
] },
    options: {
      animation: false, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { type: 'linear', ticks: { color: mu, maxTicksLimit: 8, callback: (v) => Math.round(v) }, grid: { color: ln }, title: { display: true, text: L('simulation time (s)', 'زمن المحاكاة (ث)'), color: mu } }, y: { min: 20, max: 28, ticks: { color: mu }, grid: { color: ln }, title: { display: true, text: 'V DC', color: mu } } },
    },
    plugins: [{ id: 'lim', afterDraw(c) { const y = c.scales.y.getPixelForValue(22.5); const g = c.ctx; g.save(); g.strokeStyle = '#dc2626'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(c.chartArea.left, y); g.lineTo(c.chartArea.right, y); g.stroke(); g.fillStyle = '#dc2626'; g.font = '11px sans-serif'; g.fillText('LOW BATT 22.5 V', c.chartArea.left + 6, y - 4); g.restore(); } }],
  });
  drawStatic(); tick();
  const iv = setInterval(tick, 1000);
  return () => { clearInterval(iv); chart?.destroy(); };
}
function psuSvg(ac, v) {
  const flow = (on, d, col) => `<path d="${d}" stroke="${on ? col : '#64748b'}" stroke-width="4" fill="none" ${on ? 'stroke-dasharray="8 8"' : ''}>${on ? '<animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/>' : ''}</path>`;
  return `<svg viewBox="0 0 560 230" class="adv-svg cm-psu"><defs><linearGradient id="cmBat" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#374151"/><stop offset="1" stop-color="#111827"/></linearGradient>
    <linearGradient id="cmCab" x1="0" x2="1"><stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient></defs>
    <rect width="560" height="230" rx="10" fill="#0f172a"/>
    <text x="20" y="30" fill="#94a3b8" font-size="11">230 V AC · 50 Hz</text>
    <rect x="20" y="60" width="70" height="90" rx="6" fill="#1e293b" stroke="#475569"/><text x="55" y="80" text-anchor="middle" fill="#cbd5e1" font-size="10">DB-FA</text>
    <rect x="42" y="92" width="26" height="40" rx="3" fill="#e5e7eb"/><rect x="47" y="${ac ? 96 : 112}" width="16" height="16" rx="2" fill="${ac ? '#16a34a' : '#dc2626'}"/>
    <text x="55" y="165" text-anchor="middle" fill="${ac ? '#86efac' : '#fca5a5'}" font-size="10" font-weight="700">${ac ? 'ON' : 'OFF · LOCKED'}</text>
    ${flow(ac, 'M90 105 H190', '#fbbf24')}
    <rect x="190" y="50" width="150" height="110" rx="8" fill="url(#cmCab)"/><text x="265" y="72" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">PSU / CHARGER</text>
    <text x="265" y="92" text-anchor="middle" font-size="10" fill="#475569">27.3 V float · 2.275 V/cell</text>
    <circle cx="215" cy="140" r="5" fill="${ac ? '#22c55e' : '#334155'}"/><text x="225" y="144" font-size="9" fill="#334155">AC</text>
    <circle cx="265" cy="140" r="5" fill="${ac ? '#334155' : '#f59e0b'}">${ac ? '' : '<animate attributeName="opacity" values="1;.2;1" dur="1s" repeatCount="indefinite"/>'}</circle><text x="275" y="144" font-size="9" fill="#334155">TRBL</text>
    ${flow(true, 'M340 105 H420', '#22d3ee')}
    <rect x="420" y="40" width="120" height="130" rx="8" fill="#1e293b" stroke="#475569"/><text x="480" y="64" text-anchor="middle" fill="#e2e8f0" font-size="11" font-weight="700">FACP</text>
    <rect x="436" y="76" width="88" height="34" rx="3" fill="#0b1f14"/><text x="480" y="98" text-anchor="middle" font-family="monospace" font-size="11" fill="#4ade80">${ac ? 'NORMAL' : 'AC FAIL'}</text>
    ${flow(!ac, 'M265 205 V160', '#f59e0b')}${flow(ac, 'M300 160 V205', '#22c55e')}
    <g transform="translate(200 190)"><rect x="0" y="0" width="70" height="34" rx="4" fill="url(#cmBat)"/><rect x="80" y="0" width="70" height="34" rx="4" fill="url(#cmBat)"/>
      <text x="35" y="21" text-anchor="middle" fill="#e5e7eb" font-size="10">12 V 18 Ah</text><text x="115" y="21" text-anchor="middle" fill="#e5e7eb" font-size="10">12 V 18 Ah</text></g>
    <text x="370" y="214" fill="#e2e8f0" font-family="monospace" font-size="14">${v.toFixed(2)} V</text>
    <text x="370" y="196" fill="${ac ? '#86efac' : '#fcd34d'}" font-size="10">${ac ? 'CHARGING' : 'DISCHARGING'}</text>
  </svg>`;
}

// ═════════════════════════════════════════ TAB 5 — hydrostatic test
function tabHydro(body, ctx) {
  let run = null, chart = null, raf = null;
  const model = (scen, tmin) => {
    // returns {p psi, temp °C}
    const fill = 10;
    if (tmin < fill) return { p: 200 * tmin / fill, temp: scen === 'thermal' ? 31 : 24 };
    const t = tmin - fill;
    const n = Math.sin(t * 1.7) * 0.25 + Math.sin(t * 0.37) * 0.2;
    if (scen === 'leak') return { p: 200 - 0.19 * t + n, temp: 24 + n * 0.1 };
    if (scen === 'thermal') { const temp = 24 + 7 * Math.exp(-t / 28); return { p: 200 - 2.4 * (31 - temp) + n, temp }; }
    return { p: 200 + n, temp: 24 + n * 0.1 };
  };
  const draw = () => {
    const sc = S.hydro.scen; const res = S.hydro.results[sc];
    body.innerHTML = `
    <div class="adv-row cm-hyd">
      <div class="grow">
        <div class="card"><h3>${L('HYDROSTATIC TEST RIG', 'منصة الاختبار الهيدروستاتيكي')}<span class="r adv-pill info">NFPA 13 §29.2.1</span></h3>
          <div class="adv-btns" style="margin-bottom:10px">${Object.entries(HYDRO).map(([k, v]) => `<button class="btn sm ${sc === k ? 'primary' : ''}" data-sc="${k}">${esc(tr(v.name))}${S.hydro.results[k] ? (S.hydro.results[k].ok ? ' ✓' : ' ✗') : ''}</button>`).join('')}</div>
          <div class="cm-hydgrid"><div id="cmGauge"></div><div id="cmRig"></div></div>
          <div class="adv-btns" style="margin-top:10px">
            <button class="btn primary" id="cmHStart">▶ ${L('Pressurise to 200 psi & hold 2 h', 'رفع الضغط إلى 200 psi والتثبيت ساعتين')}</button>
            <span class="adv-note" style="flex:1">${L('Time-lapse: 2 h hold ≈ 30 s. Test pressure 200 psi (13.8 bar) — or 50 psi above max. working pressure when that exceeds 150 psi — held 2 h without loss of pressure or visible leakage.', 'تسريع زمني: ساعتا التثبيت ≈ 30 ثانية. ضغط الاختبار 200 psi (13.8 بار) — أو 50 psi فوق أقصى ضغط تشغيل إذا تجاوز 150 psi — يُثبَّت ساعتين دون فقدان ضغط أو تسرب ظاهر.')}</span>
          </div>
        </div>
        <div class="card"><h3>${L('PRESSURE & WATER TEMPERATURE vs TIME', 'الضغط وحرارة المياه مقابل الزمن')}</h3><div style="height:260px"><canvas id="cmHChart"></canvas></div></div>
      </div>
      <div class="cm-side">
        <div class="card"><h3>${L('TEST LOG', 'سجل الاختبار')}</h3><div class="cm-kv" id="cmHKv"></div></div>
        <div class="card" id="cmHDiag"><h3>${L('YOUR DIAGNOSIS', 'تشخيصك')}</h3>
          <div class="adv-findings">${Object.entries(HYDRO_ANS).map(([k, v]) => `<button class="cm-ans ${res?.ans === k ? (res.ok ? 'ok' : 'bad') : ''}" data-ans="${k}" ${run?.done || res ? '' : 'disabled'}>${esc(tr(v))}</button>`).join('')}</div>
          ${res ? `<div class="adv-callout ${res.ok ? '' : 'bad'}" style="margin-top:8px">${res.ok ? '✓ ' : '✗ '}${esc(explain(sc))}</div>` : `<div class="adv-note" style="margin-top:8px">${L('Run the 2 h hold, then judge the curve. Compare pressure with water temperature.', 'نفّذ فترة التثبيت ثم احكم على المنحنى. قارن الضغط بحرارة المياه.')}</div>`}
        </div>
        <div class="adv-callout warn"><b>${L('Tip', 'تلميح')}</b> — ${L('A steady, linear decay that does not follow temperature points to a leak. A decay that tracks the water cooling and then levels off is thermal (worse with trapped air): vent at the high points and retest once temperatures are stable.', 'الانخفاض الخطي الثابت الذي لا يتبع الحرارة يدل على تسرب. أما الانخفاض الذي يتبع تبرد المياه ثم يستقر فهو حراري (يزداد مع الهواء المحبوس): نفّس الهواء من النقاط العليا وأعد الاختبار بعد استقرار الحرارة.')}</div>
      </div>
    </div>`;
    const mu = css('--muted') || '#888', ln = css('--line') || '#ddd';
    chart = new Chart(body.querySelector('#cmHChart'), {
      type: 'line',
      data: { labels: [], datasets: [
        { label: 'psi', data: [], borderColor: css('--accent') || '#0f9d8f', pointRadius: 0, borderWidth: 2, yAxisID: 'y' },
        { label: '°C', data: [], borderColor: '#f97316', borderDash: [4, 3], pointRadius: 0, borderWidth: 1.5, yAxisID: 'y2' }] },
      options: {
        animation: false, maintainAspectRatio: false, plugins: { legend: { labels: { color: mu } } },
        scales: {
          x: { type: 'linear', min: 0, max: 130, ticks: { color: mu }, grid: { color: ln }, title: { display: true, text: 'min', color: mu } },
          y: { min: 150, max: 210, ticks: { color: mu }, grid: { color: ln }, title: { display: true, text: 'psi', color: mu } },
          y2: { position: 'right', min: 15, max: 35, ticks: { color: '#f97316' }, grid: { display: false }, title: { display: true, text: '°C', color: '#f97316' } },
        },
      },
    });
    const upd = () => {
      const t = run ? run.t : 0; const v = model(sc, t);
      body.querySelector('#cmGauge').innerHTML = gaugeSvg(run ? v.p : 0);
      body.querySelector('#cmRig').innerHTML = rigSvg(sc, run && !run.done && t > 10, run ? v.temp : 24);
      const hold = Math.max(0, t - 10);
      const p0 = run ? model(sc, 10).p : null;
      body.querySelector('#cmHKv').innerHTML = `<span>${L('Scenario', 'السيناريو')}</span><b>${esc(tr(HYDRO[sc].name))}</b>
        <span>${L('Hold time', 'زمن التثبيت')}</span><b>${N(`${Math.floor(hold / 60)} h ${String(Math.floor(hold % 60)).padStart(2, '0')} min`)}</b>
        <span>${L('Start pressure', 'ضغط البداية')}</span><b>${N(p0 ? p0.toFixed(1) + ' psi' : '—')}</b>
        <span>${L('Current', 'الحالي')}</span><b>${N(run ? v.p.toFixed(1) + ' psi · ' + (v.p / 14.504).toFixed(2) + ' bar' : '—')}</b>
        <span>${L('Change', 'التغيّر')}</span><b style="color:${run && t > 10 && v.p - p0 < -1 ? 'var(--alarm)' : ''}">${N(run && t > 10 ? (v.p - p0).toFixed(1) + ' psi' : '—')}</b>
        <span>${L('Water temperature', 'حرارة المياه')}</span><b>${N(v.temp.toFixed(1) + ' °C')}</b>`;
    };
    upd();
    const pts = run?.pts || [];
    chart.data.datasets[0].data = pts.map((p) => ({ x: p.t, y: p.p })); chart.data.datasets[1].data = pts.map((p) => ({ x: p.t, y: p.temp })); chart.update('none');
    body.querySelectorAll('[data-sc]').forEach((b) => { b.onclick = () => { if (run && !run.done) return; S.hydro.scen = b.dataset.sc; save(); run = null; chart.destroy(); draw(); }; });
    body.querySelector('#cmHStart').onclick = () => {
      if (run && !run.done) return;
      run = { t: 0, pts: [], done: false, last: performance.now() };
      delete S.hydro.results[sc]; save(); chart.destroy(); draw();
      const loop = (ts) => {
        const dt = (ts - run.last) / 1000; run.last = ts;
        run.t = Math.min(130, run.t + dt * 4.4);
        const v = model(sc, run.t);
        if (!run.pts.length || run.t - run.pts[run.pts.length - 1].t >= 1) {
          run.pts.push({ t: run.t, p: v.p, temp: v.temp });
          chart.data.datasets[0].data = run.pts.map((p) => ({ x: p.t, y: p.p })); chart.data.datasets[1].data = run.pts.map((p) => ({ x: p.t, y: p.temp })); chart.update('none');
        }
        upd();
        if (run.t >= 130) { run.done = true; chart.destroy(); draw(); return; }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };
    body.querySelectorAll('[data-ans]').forEach((b) => {
      b.onclick = () => {
        const ok = HYDRO[sc].ans === b.dataset.ans;
        S.hydro.results[sc] = { ans: b.dataset.ans, ok, at: now() }; save();
        const r = S.hydro.results; const n = Object.keys(HYDRO).filter((k) => r[k]?.ok).length;
        if (Object.keys(HYDRO).every((k) => r[k])) ctx?.helpers?.recordResult?.({ type: 'lab', topic: 'commission/hydrostatic', score: n, total: 3 });
        chart.destroy(); draw();
      };
    });
  };
  const explain = (sc) => ({
    tight: L('Pressure held at 200 psi for 2 h with stable temperature — test passed, record it.', 'ثبت الضغط عند 200 psi لمدة ساعتين مع حرارة مستقرة — الاختبار ناجح، سجّله.'),
    leak: L('Linear loss of ~23 psi over 2 h while the temperature is flat — a leaking joint. Walk the pipe, repair and retest.', 'فقدان خطي نحو 23 psi خلال ساعتين والحرارة ثابتة — وصلة مسرّبة. افحص الأنابيب وأصلح وأعد الاختبار.'),
    thermal: L('Pressure fell only while the sun-warmed water cooled, then levelled off — thermal contraction (with trapped air). Vent air, stabilise temperature and repeat the test.', 'انخفض الضغط فقط أثناء تبرد المياه المسخنة بالشمس ثم استقر — انكماش حراري (مع هواء محبوس). نفّس الهواء وانتظر استقرار الحرارة وأعد الاختبار.'),
  }[sc]);
  draw();
  return () => { cancelAnimationFrame(raf); chart?.destroy(); };
}
function gaugeSvg(p) {
  const a = -225 + clamp(p, 0, 300) / 300 * 270;
  const ticks = [];
  for (let v = 0; v <= 300; v += 10) {
    const r = (-225 + v / 300 * 270) * Math.PI / 180; const big = v % 50 === 0;
    ticks.push(`<line x1="${100 + 78 * Math.cos(r)}" y1="${100 + 78 * Math.sin(r)}" x2="${100 + (big ? 66 : 72) * Math.cos(r)}" y2="${100 + (big ? 66 : 72) * Math.sin(r)}" stroke="#111" stroke-width="${big ? 2 : 1}"/>`);
    if (big) ticks.push(`<text x="${100 + 54 * Math.cos(r)}" y="${100 + 54 * Math.sin(r) + 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#111">${v}</text>`);
  }
  const arc = (v0, v1, col) => { const r0 = (-225 + v0 / 300 * 270) * Math.PI / 180, r1 = (-225 + v1 / 300 * 270) * Math.PI / 180; return `<path d="M${100 + 82 * Math.cos(r0)} ${100 + 82 * Math.sin(r0)} A82 82 0 0 1 ${100 + 82 * Math.cos(r1)} ${100 + 82 * Math.sin(r1)}" stroke="${col}" stroke-width="5" fill="none"/>`; };
  return `<svg viewBox="0 0 200 210" class="adv-svg cm-gauge"><defs><radialGradient id="cmG1" cx=".5" cy=".4"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e5e7eb"/></radialGradient><linearGradient id="cmG2" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#6b7280"/></linearGradient></defs>
    <circle cx="100" cy="100" r="96" fill="url(#cmG2)"/><circle cx="100" cy="100" r="88" fill="url(#cmG1)"/>
    ${arc(195, 205, '#16a34a')}${arc(205, 300, '#dc2626')}${ticks.join('')}
    <text x="100" y="140" text-anchor="middle" font-size="10" fill="#374151">psi</text>
    <text x="100" y="156" text-anchor="middle" font-family="monospace" font-size="15" font-weight="700" fill="#111">${p.toFixed(1)}</text>
    <g transform="rotate(${a} 100 100)" style="transition:transform .15s linear"><path d="M100 97 L172 100 L100 103 Z" fill="#b91c1c"/></g>
    <circle cx="100" cy="100" r="7" fill="#1f2937"/><rect x="88" y="190" width="24" height="18" fill="#9ca3af"/></svg>`;
}
function rigSvg(sc, running, temp) {
  const hot = clamp((temp - 24) / 7, 0, 1);
  return `<svg viewBox="0 0 420 210" class="adv-svg"><rect width="420" height="210" rx="10" fill="#0f172a"/>
    ${sc === 'thermal' ? `<circle cx="380" cy="34" r="${16 + hot * 4}" fill="#fbbf24" opacity="${0.4 + hot * 0.6}"/>` : ''}
    <rect x="20" y="150" width="380" height="16" rx="3" fill="#b91c1c"/><rect x="200" y="50" width="16" height="100" fill="#b91c1c"/><rect x="60" y="50" width="300" height="14" rx="3" fill="${sc === 'thermal' ? `rgb(${185 + hot * 60},${28 + hot * 60},28)` : '#b91c1c'}"/>
    ${[90, 150, 270, 330].map((x) => `<g transform="translate(${x} 64)"><rect x="-2" y="0" width="4" height="10" fill="#94a3b8"/><path d="M-7 10 h14 l-3 6 h-8z" fill="#cbd5e1"/></g>`).join('')}
    <rect x="236" y="46" width="10" height="22" rx="2" fill="#64748b"/>
    ${sc === 'leak' ? `<circle cx="241" cy="72" r="3" fill="#60a5fa">${running ? '<animate attributeName="cy" values="72;140" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite"/>' : ''}</circle>` : ''}
    ${sc === 'thermal' ? '<circle cx="330" cy="57" r="4" fill="#e2e8f0" opacity=".8"/><circle cx="339" cy="56" r="3" fill="#e2e8f0" opacity=".8"/>' : ''}
    <g transform="translate(40 150)"><rect x="-16" y="-44" width="44" height="30" rx="4" fill="#475569"/><text x="6" y="-25" text-anchor="middle" font-size="8" fill="#e2e8f0">TEST PUMP</text><rect x="2" y="-14" width="6" height="14" fill="#64748b"/></g>
    <g transform="translate(120 158)"><circle r="9" fill="#1e293b" stroke="#94a3b8"/><line x1="-9" y1="0" x2="9" y2="0" stroke="#94a3b8" stroke-width="2"/></g>
    <text x="20" y="196" font-size="10" fill="#94a3b8">${L('Water temp', 'حرارة المياه')}: ${temp.toFixed(1)} °C</text>
    <text x="400" y="196" text-anchor="end" font-size="10" fill="${running ? '#fbbf24' : '#94a3b8'}">${running ? L('HOLDING – pump isolated', 'تثبيت – المضخة معزولة') : L('Idle', 'متوقف')}</text></svg>`;
}

// ═════════════════════════════════════════ TAB 6 — record of completion
function tabRoc(body, ctx) {
  const sys = ctx.sys;
  const def = {
    property: 'ASFAN Business Center', address: 'Plot 14, King Fahd Road', owner: 'ASFAN Real Estate Co.', contractor: 'ASFAN Fire & Safety Contracting',
    engineer: '', technician: '', ahj: 'Civil Defense – Fire Prevention Dept.', witness: '', date: new Date().toISOString().slice(0, 10),
    cert: S.roc.cert || `ROC-${new Date().getFullYear()}-${String(Math.floor(1000 + (sys.devices.length * 97) % 9000))}`,
  };
  const F = { ...def, ...S.roc };
  const fields = [
    ['property', L('Property name', 'اسم المنشأة')], ['address', L('Address', 'العنوان')], ['owner', L('Owner', 'المالك')], ['contractor', L('Installing contractor', 'مقاول التركيب')],
    ['engineer', L('Commissioning engineer', 'مهندس التشغيل')], ['technician', L('Test technician (NICET / certified)', 'فني الاختبار (معتمد)')], ['ahj', L('Authority having jurisdiction', 'السلطة المختصة')], ['witness', L('AHJ witness', 'شاهد السلطة المختصة')], ['date', L('Acceptance date', 'تاريخ الاستلام')], ['cert', L('Certificate no.', 'رقم الشهادة')],
  ];
  const draw = () => {
    body.innerHTML = `<div class="adv-row cm-rocwrap">
      <div class="cm-side cm-rocform"><div class="card"><h3>${L('RECORD DATA', 'بيانات السجل')}</h3>
        <div class="adv-form" style="grid-template-columns:1fr">${fields.map(([k, lab]) => `<label class="adv-field">${esc(lab)}<input data-f="${k}" value="${esc(F[k])}" ${k === 'date' ? 'type="date"' : ''}></label>`).join('')}</div>
        <div class="adv-btns" style="margin-top:12px"><button class="btn primary" id="cmPrint">🖨 ${L('Print / save PDF', 'طباعة / حفظ PDF')}</button><button class="btn" id="cmCsv2">⬇ ${L('Device test log (CSV)', 'سجل اختبار الأجهزة (CSV)')}</button></div>
        <div class="adv-note" style="margin-top:10px">${L('The record is always issued in English (the NFPA 72 form language) and is populated live from your test results.', 'يصدر السجل دائماً بالإنجليزية (لغة نموذج NFPA 72) ويُملأ مباشرة من نتائج اختباراتك.')}</div></div></div>
      <div class="grow cm-paperwrap"><div class="cm-paper">${rocHtml(sys, F)}</div></div></div>`;
    body.querySelectorAll('[data-f]').forEach((i) => { i.oninput = () => { S.roc[i.dataset.f] = i.value; F[i.dataset.f] = i.value; save(); body.querySelector('.cm-paper').innerHTML = rocHtml(sys, F); }; });
    body.querySelector('#cmPrint').onclick = () => printDoc(rocHtml(sys, F), `${F.cert}.pdf`);
    body.querySelector('#cmCsv2').onclick = () => exportCsv(sys);
  };
  draw();
  return null;
}
function rocHtml(sys, F) {
  const e = (s) => esc(s || '');
  const ev = evalSession(sys);
  const counts = {}; for (const d of sys.devices) counts[d.type] = (counts[d.type] || 0) + 1;
  const loads = systemLoads(sys); const calc = batteryCalc(loads);
  const box = (on) => `<span style="display:inline-block;width:11px;height:11px;border:1.3px solid #111;margin-right:5px;vertical-align:-1px;text-align:center;line-height:10px;font-size:10px">${on ? '✓' : ''}</span>`;
  const sec = (n, t) => `<div style="background:#1f2937;color:#fff;font-weight:700;font-size:11px;letter-spacing:.06em;padding:5px 8px;margin:14px 0 6px">${n}. ${t}</div>`;
  const td = 'style="border:1px solid #9ca3af;padding:4px 6px;font-size:11px"';
  const kv = (k, v) => `<td ${td}><div style="font-size:9px;color:#6b7280;text-transform:uppercase">${k}</div><div style="font-weight:600;min-height:14px">${v}</div></td>`;
  const defects = sys.devices.filter((d) => S.tests[d.id] && (S.tests[d.id].result !== 'pass' || (S.tests[d.id].diag && S.tests[d.id].diag !== 'none')));
  const hy = S.hydro.results; const preDone = PRE.filter((p) => S.pre[p.id]?.checked || S.pre[p.id]?.verdict).length;
  const typeRows = Object.entries(DEVICE_TYPES).filter(([k]) => counts[k]).map(([k, v]) => `<tr><td ${td}>${e(v.name.en)}</td><td ${td} align="right">${counts[k]}</td><td ${td} align="right">${sys.devices.filter((d) => d.type === k && S.tests[d.id]).length}</td><td ${td} align="right">${sys.devices.filter((d) => d.type === k && S.tests[d.id]?.result === 'pass').length}</td></tr>`).join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;width:190mm;margin:0 auto;padding:10mm 0;direction:ltr;text-align:left">
    <div style="display:flex;align-items:center;border-bottom:3px solid #b91c1c;padding-bottom:8px">
      <div style="width:46px;height:46px;border-radius:8px;background:#b91c1c;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px">FA</div>
      <div style="margin-left:12px;flex:1"><div style="font-size:18px;font-weight:800">SYSTEM RECORD OF COMPLETION</div><div style="font-size:11px;color:#374151">Fire Alarm and Emergency Communications Systems · in accordance with NFPA 72 (2022) §7.5.6</div></div>
      <div style="text-align:right;font-size:11px"><div style="color:#6b7280">Certificate No.</div><div style="font-weight:800;font-size:14px;font-family:monospace">${e(F.cert)}</div><div>Session ${e(S.session?.id || '—')}</div></div>
    </div>
    ${sec(1, 'PROPERTY INFORMATION')}
    <table style="width:100%;border-collapse:collapse"><tr>${kv('Name of property', e(F.property))}${kv('Address', e(F.address))}</tr><tr>${kv('Owner', e(F.owner))}${kv('Authority having jurisdiction', e(F.ahj))}</tr></table>
    ${sec(2, 'SYSTEM TYPE & DESCRIPTION')}
    <table style="width:100%;border-collapse:collapse"><tr><td ${td}>${box(true)}Protected premises (local) fire alarm system &nbsp; ${box(true)}Supervising station: central station (Contact-ID) &nbsp; ${box(false)}In-building ECS / voice</td></tr>
      <tr><td ${td}>Control unit: addressable FACP, 1 SLC loop — Class ${e(sys.loopClass)} &nbsp;·&nbsp; NACs: 2 (Class B, 4.7 kΩ EOL) &nbsp;·&nbsp; ${sys.nacDevices.length} horn/strobes &nbsp;·&nbsp; Programmed addresses: ${Object.keys(sys.config).length}</td></tr></table>
    ${sec(3, 'DEVICES – QUANTITIES AND FUNCTIONAL TEST (NFPA 72 Table 14.4.3.2)')}
    <table style="width:100%;border-collapse:collapse"><tr style="background:#f3f4f6"><th ${td} align="left">Device type</th><th ${td} align="right">Installed</th><th ${td} align="right">Tested</th><th ${td} align="right">Passed</th></tr>${typeRows}
      <tr style="font-weight:700"><td ${td}>TOTAL</td><td ${td} align="right">${ev.total}</td><td ${td} align="right">${ev.tested}</td><td ${td} align="right">${ev.pass}</td></tr></table>
    <table style="width:100%;border-collapse:collapse;margin-top:6px"><tr>${kv('Test coverage', Math.round(ev.coverage * 100) + ' %')}${kv('Pass / Pass with defect / Fail', `${ev.pass} / ${ev.warn} / ${ev.fail}`)}${kv('Correct test methods', Math.round(ev.methodOk * 100) + ' %')}${kv('Pre-functional items', `${preDone} / ${PRE.length}`)}</tr></table>
    ${sec(4, 'DEFICIENCIES FOUND & DIAGNOSIS')}
    ${defects.length ? `<table style="width:100%;border-collapse:collapse"><tr style="background:#f3f4f6"><th ${td} align="left">Addr</th><th ${td} align="left">Location</th><th ${td} align="left">Result</th><th ${td} align="left">Diagnosis / action</th></tr>
      ${defects.map((d) => { const t = S.tests[d.id]; return `<tr><td ${td}>${pad3(d.addr)}</td><td ${td}>${d.floor}F ${e(d.label.en)}</td><td ${td}>${t.result.toUpperCase()}</td><td ${td}>${t.diag ? e(t.diag === 'other' ? 'Replace device' : FAULT_KINDS[t.diag]?.en) : '<i>not diagnosed</i>'}</td></tr>`; }).join('')}</table>` : '<div style="font-size:11px;padding:4px 0">No deficiencies recorded.</div>'}
    ${sec(5, 'POWER SUPPLIES (NFPA 72 §10.6)')}
    <table style="width:100%;border-collapse:collapse"><tr>${kv('Secondary supply', '2 × 12 V 18 Ah VRLA')}${kv('Calculated requirement (24 h + 5 min, ×1.2)', calc.ah.toFixed(2) + ' Ah')}${kv('Load voltage', S.batt.vLoad ? e(S.batt.vLoad) + ' V' : '—')}</tr>
      <tr>${kv('AC fail trouble', S.batt.acTroubleT != null ? `annunciated in ${S.batt.acTroubleT} s` : 'not tested')}${kv('AC restore', S.batt.acRestoredT ? 'restored & cleared' : 'not tested')}${kv('Capacity check', S.batt.done ? 'PASS' : 'incomplete')}</tr></table>
    ${sec(6, 'NOTIFICATION & SPRINKLER INTERFACE')}
    <table style="width:100%;border-collapse:collapse"><tr>${kv('Audibility survey (rooms measured)', Object.values(S.aud.meas).reduce((a, o) => a + Object.keys(o).length, 0))}${kv('Hydrostatic test 200 psi / 2 h (NFPA 13 §29.2.1)', Object.keys(HYDRO).map((k) => `${k}: ${hy[k] ? HYDRO_ANS[hy[k].ans].en.split(' – ')[0] : '—'}`).join(' · '))}</tr></table>
    ${sec(7, 'CERTIFICATION & SIGN-OFF')}
    <div style="font-size:10.5px;line-height:1.5;margin-bottom:6px">This system as specified herein has been installed and tested according to all NFPA standards cited herein. Deficiencies listed in Section 4 shall be corrected and retested before final acceptance.</div>
    <table style="width:100%;border-collapse:collapse"><tr><th ${td} align="left" style="width:30%">Role</th><th ${td} align="left">Name</th><th ${td} align="left">Signature</th><th ${td} align="left" style="width:18%">Date</th></tr>
      ${[['Installing contractor', F.contractor], ['Commissioning engineer', F.engineer], ['Test technician', F.technician], ['AHJ witness', F.witness]].map(([r, n]) => `<tr><td ${td}>${r}</td><td ${td}>${e(n)}</td><td ${td} style="height:26px;border:1px solid #9ca3af"></td><td ${td}>${e(F.date)}</td></tr>`).join('')}</table>
    <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-top:10px;border-top:1px solid #d1d5db;padding-top:4px"><span>Generated by Smart Systems Lab · ${now()}</span><span>Result: ${ev.complete ? 'ACCEPTANCE TEST COMPLETE' : 'ACCEPTANCE TEST INCOMPLETE'}</span></div>
  </div>`;
}
