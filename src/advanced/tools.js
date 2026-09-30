// Module 9 — Engineering Tools: professional design calculators linked to the live project.
//  1. Sprinkler hydraulic calculation (NFPA 13 §28) with isometric drawing, supply/demand graph and report
//  2. Fire-alarm battery calculation (NFPA 72 §10.6.7) from the live device list
//  3. NAC voltage drop (lumped vs distributed, UL 1971 16–33 V)
//  4. SLC loop loading (addresses, current, resistance, capacitance, isolators)
//  5. Auto-generated fire-alarm riser diagram (NFPA 170 symbols) with title block, SVG / PDF export
import Chart from 'chart.js/auto';
import { header, L, esc, tr, store, markDone, tabBar, stat, scoreBanner, printDoc, download, css, pad3, ar } from './ui.js';
import { DEVICE_TYPES, NAC_TYPE, FLOORS, PANEL_POS, RISER_POS } from './building.js';
import { systemLoads, batteryCalc } from './system.js';
import * as K from './toolsCalc.js';

// ───────────────────────── small helpers
const fx = (v, d = 2) => (Number.isFinite(+v) ? (+v).toFixed(d) : '—');
const n = (v) => `<span class="tl-n">${v}</span>`;
const num = (v, d = 2, u = '') => `<span class="tl-n">${fx(v, d)}${u ? ' ' + u : ''}</span>`;
const pill = (ok, a = L('PASS', 'مقبول'), b = L('FAIL', 'مرفوض')) => `<span class="adv-pill ${ok ? 'ok' : 'bad'}">${ok ? '✔ ' + a : '✖ ' + b}</span>`;
const theme = () => ({
  text: css('--muted') || '#6b7684', grid: css('--line') || '#e3e7ec', fg: css('--text') || '#17202b',
  accent: css('--accent') || '#0f9d8f', alarm: css('--alarm') || '#dc2626', ok: css('--ok') || '#16a34a', warn: css('--warn') || '#d97706',
});
const student = () => { try { return localStorage.getItem('ftw.student') || '—'; } catch { return '—'; } };
const today = () => new Date().toISOString().slice(0, 10);
const fld = (id, label, value, unit = '', step = 'any', extra = '') => `<label class="adv-field">${label}
  <span class="tl-in"><input type="number" id="${id}" value="${esc(value)}" step="${step}" ${extra}/>${unit ? `<em>${unit}</em>` : ''}</span></label>`;
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const within = (a, b, tol) => Number.isFinite(a) && Math.abs(a - b) <= Math.abs(b) * tol + 1e-9;
function niceStep(max, parts = 6) {
  const raw = max / parts; const p = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const k of [1, 2, 2.5, 5, 10]) if (raw <= k * p) return k * p;
  return 10 * p;
}
function baseChartOpts(t) {
  return {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { labels: { color: t.text, boxWidth: 14, usePointStyle: true, font: { size: 11 } } }, tooltip: { intersect: false } },
    scales: {},
  };
}
const axis = (t, title, extra = {}) => ({ type: 'linear', title: { display: true, text: title, color: t.text, font: { size: 11, weight: '600' } }, ticks: { color: t.text, font: { size: 10.5 } }, grid: { color: t.grid }, ...extra });

// ───────────────────────── module
const TABS = () => [
  { id: 'hyd', label: L('💧 Sprinkler hydraulics', '💧 الحساب الهيدروليكي للرشاشات') },
  { id: 'bat', label: L('🔋 Battery calculation', '🔋 حساب البطاريات') },
  { id: 'nac', label: L('📉 NAC voltage drop', '📉 هبوط الجهد لدوائر التنبيه') },
  { id: 'slc', label: L('🔁 SLC loop loading', '🔁 تحميل حلقة الإشارات') },
  { id: 'riser', label: L('🗺️ Riser diagram', '🗺️ المخطط الرأسي') },
];

const signature = (sys) => sys.devices.map((d) => `${d.type}${d.floor}${d.addr}.${d.order}`).join(',') + `|${sys.nacDevices.length}|${sys.loopClass}|${!!voiceOn(sys)}`;
const voiceOn = (sys) => { const mx = sys.matrix || {}; return Object.values(mx).some((row) => row && row.voice); };

const m = {
  id: 'tools', icon: '📐',
  title: { en: 'Engineering Tools', ar: 'الأدوات الهندسية' },
  sub: {
    en: 'Report-grade design calculators linked to the live project: NFPA 13 sprinkler hydraulic calculation with supply/demand graph, NFPA 72 battery sizing, NAC voltage drop, SLC loop loading and an auto-generated fire-alarm riser diagram.',
    ar: 'حاسبات تصميم بمستوى التقارير الهندسية مرتبطة بالمشروع الحي: الحساب الهيدروليكي للرشاشات وفق NFPA 13 مع منحنى المصدر/الطلب، وتحديد سعة البطاريات وفق NFPA 72، وهبوط الجهد في دوائر التنبيه، وتحميل حلقة الإشارات، ومخطط رأسي (Riser) يُولَّد تلقائياً.',
  },
  short: { en: 'Hydraulics, batteries, voltage drop, riser', ar: 'هيدروليك، بطاريات، هبوط جهد، مخطط رأسي' },
  refs: ['NFPA 13 §28', 'NFPA 13 Table 28.2.3.1.1', 'NFPA 72 §10.6.7', 'NFPA 72 §12.3', 'NFPA 72 §18.3', 'UL 1971', 'NFPA 170'],
  render(el, ctx) {
    const sys = ctx.sys;
    let tab = store.get('tools.tab', 'hyd');
    if (!TABS().some((t) => t.id === tab)) tab = 'hyd';
    let tabCleanup = null;
    el.innerHTML = header(m) + '<div id="tlTabs"></div><div id="tlBody" class="tl"></div>';
    const body = el.querySelector('#tlBody');
    const RENDER = { hyd: renderHyd, bat: renderBat, nac: renderNac, slc: renderSlc, riser: renderRiser };
    function show(id) {
      tab = id; store.set('tools.tab', id);
      if (tabCleanup) { try { tabCleanup(); } catch { /* ignore */ } tabCleanup = null; }
      el.querySelector('#tlTabs').innerHTML = tabBar(TABS(), tab);
      el.querySelectorAll('#tlTabs [data-tab]').forEach((b) => { b.onclick = () => show(b.dataset.tab); });
      tabCleanup = RENDER[id](body, ctx) || null;
    }
    show(tab);
    let sig = signature(sys);
    const off = sys.on((type) => {
      if (type !== 'change' && type !== 'reset') return;
      const s = signature(sys);
      if (s === sig) return;
      sig = s;
      if (tab === 'bat' || tab === 'slc' || tab === 'riser') show(tab);
    });
    return () => { off(); if (tabCleanup) try { tabCleanup(); } catch { /* ignore */ } };
  },
};
export default m;

function award(ctx, topic, score, total = 100) {
  markDone('tools', score);
  try { ctx.helpers?.recordResult?.({ type: 'lab', topic: `tools/${topic}`, score, total }); } catch { /* ignore */ }
}

// ═════════════════════════════════════════ 1. HYDRAULICS
const SIZE_W = { 1: 3, 1.25: 3.6, 1.5: 4.2, 2: 5, 2.5: 5.8, 3: 6.6, 4: 7.6, 6: 9.5, 8: 11 };
const FIT_ABBR = { e90: 'E', e45: '45', tee: 'T', gate: 'GV', check: 'CV' };
const fitText = (f) => Object.keys(FIT_ABBR).filter((k) => f[k] > 0).map((k) => `${f[k]}${FIT_ABBR[k]}`).join(' ') || '—';

function hydErrText(e) {
  if (e.code === 'dupNode') return L(`Node "${e.node}" appears twice — every node must have one row.`, `العقدة "${e.node}" مكررة — لكل عقدة صف واحد فقط.`);
  if (e.code === 'roots') return L(`The network must drain to exactly ONE source node (found: ${e.roots.join(', ') || 'none'}).`, `يجب أن تنتهي الشبكة إلى عقدة مصدر واحدة فقط (الموجود: ${e.roots.join('، ') || 'لا شيء'}).`);
  if (e.code === 'cycle') return L(`Closed loop at ${e.node} — this tool calculates tree systems only.`, `حلقة مغلقة عند ${e.node} — هذه الأداة تحسب الشبكات الشجرية فقط.`);
  if (e.code === 'noHeads') return L('No sprinkler in the network — give at least one node a K-factor.', 'لا يوجد رشاش في الشبكة — أدخل معامل K لعقدة واحدة على الأقل.');
  return L('Empty node name.', 'اسم عقدة فارغ.');
}

function renderHyd(body, ctx) {
  let net = store.get('tools.net', null);
  if (!net || !Array.isArray(net.rows)) net = K.defaultNetwork();
  const save = () => store.set('tools.net', net);
  let chart = null;
  let res = null;
  const hz = () => K.HAZARDS.find((h) => h.id === net.hazard);

  body.innerHTML = `
  <div class="card tl-basis">
    <h3>${L('DESIGN BASIS — NFPA 13 DENSITY / AREA METHOD', 'أساس التصميم — طريقة الكثافة / المساحة وفق NFPA 13')}
      <span class="r adv-btns">
        <button class="btn sm" id="hyEx">↺ ${L('Load example (OH-1, 12 heads)', 'تحميل المثال (خطر عادي 1، 12 رشاش)')}</button>
        <button class="btn sm primary" id="hyPrint">🖨 ${L('Print calculation report', 'طباعة تقرير الحساب')}</button>
      </span></h3>
    <div class="adv-form">
      <label class="adv-field">${L('Occupancy hazard', 'تصنيف الخطورة')}
        <select id="hyHaz">${K.HAZARDS.map((h) => `<option value="${h.id}" ${h.id === net.hazard ? 'selected' : ''}>${L(h.en, h.ar)}</option>`).join('')}<option value="custom" ${!hz() ? 'selected' : ''}>${L('Custom', 'مخصص')}</option></select></label>
      ${fld('hyD', L('Design density', 'كثافة التصميم'), net.density, 'mm/min', '0.1')}
      ${fld('hyA', L('Design (remote) area', 'مساحة التصميم (الأبعد)'), net.area, 'm²', '1')}
      ${fld('hyPm', L('Min. sprinkler pressure', 'أقل ضغط للرشاش'), net.pmin, 'bar', '0.05')}
      ${fld('hyHose', L('Hose allowance (in + out)', 'بدل الخراطيم (داخلي + خارجي)'), net.hose, 'L/min', '10')}
      ${fld('hySe', L('Source elevation', 'منسوب المصدر'), net.source.elev, 'm', '0.1')}
      ${fld('hyPs', L('Flow test — static', 'اختبار التدفق — الضغط الساكن'), net.supply.static, 'bar', '0.05')}
      ${fld('hyPr', L('Flow test — residual', 'اختبار التدفق — الضغط المتبقي'), net.supply.residual, 'bar', '0.05')}
      ${fld('hyQr', L('Flow test — flow', 'اختبار التدفق — التدفق'), net.supply.flow, 'L/min', '10')}
      ${fld('hyMg', L('Required safety margin', 'هامش الأمان المطلوب'), net.margin, 'bar', '0.05')}
    </div>
  </div>
  <div id="hyVerdict"></div>
  <div class="adv-stats" id="hyStats"></div>
  <div class="card"><h3>${L('ISOMETRIC PIPING — NODE PRESSURES & FLOWS', 'مخطط أيزومتري للأنابيب — ضغوط وتدفقات العقد')}</h3>
    <div id="hyDraw"></div>
    <div class="adv-legend" id="hyLegend"></div></div>
  <div class="adv-grid c2 tl-hy-grid">
    <div class="card"><h3>${L('WATER SUPPLY vs SYSTEM DEMAND (N^1.85 GRAPH)', 'المصدر المائي مقابل طلب النظام (مقياس N^1.85)')}</h3>
      <div class="tl-chart tall"><canvas id="hyChart"></canvas></div>
      <div class="adv-note" style="margin-top:8px">${L('Supply curve from the flow test: P = Ps − (Ps − Pr)·(Q/Qr)^1.85 — a straight line on N^1.85 paper. The hose allowance is added at the source pressure (NFPA 13 Table 19.3.3.1.2).', 'منحنى المصدر من اختبار التدفق: P = Ps − (Ps − Pr)·(Q/Qr)^1.85 — خط مستقيم على ورق N^1.85. يُضاف بدل الخراطيم عند ضغط نقطة المصدر (NFPA 13 Table 19.3.3.1.2).')}</div></div>
    <div class="card"><h3>${L('NODE RESULTS', 'نتائج العقد')}</h3><div class="adv-scroll" style="max-height:520px" id="hyNodes"></div></div>
  </div>
  <div class="card"><h3>${L('PIPE NETWORK — EDIT THE TREE (each row = node + pipe towards the source)', 'شبكة الأنابيب — عدّل الشجرة (كل صف = عقدة + الأنبوب باتجاه المصدر)')}
    <span class="r adv-btns"><button class="btn sm" id="hyAdd">＋ ${L('Add node', 'إضافة عقدة')}</button></span></h3>
    <div class="adv-scroll tl-edit-wrap"><table class="adv-table tl-edit" id="hyTable"></table></div>
    <div class="adv-note" style="margin-top:8px">${L('K = sprinkler K-factor in L/min/bar½ (K80 = K5.6, 0 = no sprinkler). Fittings are converted with NFPA 13 Table 28.2.3.1.1 (Sch 40, C = 120; other C values use the table multipliers). Pipe internal diameters are ASME B36.10 Schedule 40. Elevation is the node level above datum.', 'K = معامل الرشاش بوحدة L/min/bar½ (K80 = K5.6، و0 = بدون رشاش). تُحوَّل القطع باستخدام جدول NFPA 13 رقم 28.2.3.1.1 (جدول 40، C = 120؛ ولقيم C الأخرى تُستخدم معاملات الجدول). الأقطار الداخلية حسب ASME B36.10 جدول 40. المنسوب هو ارتفاع العقدة فوق المرجع.')}</div>
  </div>
  <div class="card"><h3>${L('HYDRAULIC CALCULATION SHEET', 'ورقة الحساب الهيدروليكي')}<span class="r tl-formula">p = 6.05×10⁵ · Q^1.85 / (C^1.85 · d^4.87) &nbsp; [bar/m, L/min, mm]</span></h3>
    <div class="adv-scroll tl-sheet" id="hySheet"></div></div>`;

  const $ = (id) => body.querySelector('#' + id);

  function tableHtml() {
    const fits = Object.keys(K.FITTINGS);
    return `<thead><tr><th>#</th><th>${L('Node', 'العقدة')}</th><th>K</th><th>${L('Elev. m', 'المنسوب م')}</th><th>${L('→ To (upstream)', '← إلى (باتجاه المصدر)')}</th><th>${L('Pipe', 'الأنبوب')}</th><th>${L('L m', 'الطول م')}</th>
      ${fits.map((k) => `<th title="${esc(L(K.FITTINGS[k].en, K.FITTINGS[k].ar))}">${FIT_ABBR[k]}</th>`).join('')}<th>C</th><th class="num">${L('Eq. L m', 'الطول المكافئ م')}</th><th></th></tr></thead>
      <tbody>${net.rows.map((r, i) => `<tr data-r="${i}">
        <td class="tl-idx">${i + 1}</td>
        <td><input type="text" class="tl-t" data-k="node" value="${esc(r.node)}"/></td>
        <td><input type="number" class="tl-s" data-k="k" value="${r.k}" step="1" min="0"/></td>
        <td><input type="number" class="tl-s" data-k="elev" value="${r.elev}" step="0.1"/></td>
        <td><input type="text" class="tl-t" data-k="to" value="${esc(r.to)}"/></td>
        <td><select data-k="size">${K.PIPES.map((p) => `<option value="${p.key}" ${p.key === String(r.size) ? 'selected' : ''}>${p.nps} (${p.id})</option>`).join('')}</select></td>
        <td><input type="number" class="tl-s" data-k="len" value="${r.len}" step="0.1" min="0"/></td>
        ${fits.map((k) => `<td><input type="number" class="tl-xs" data-k="${k}" value="${r[k] || 0}" step="1" min="0"/></td>`).join('')}
        <td><input type="number" class="tl-s" data-k="C" value="${r.C || 120}" step="5" min="80" max="150"/></td>
        <td class="num" id="hyEq${i}">${fx(K.fittingLength(r), 2)}</td>
        <td><button class="btn sm ghost tl-del" data-del="${i}" title="${esc(L('Delete row', 'حذف الصف'))}">✕</button></td></tr>`).join('')}</tbody>`;
  }
  function drawTable() {
    $('hyTable').innerHTML = tableHtml();
  }

  function recompute() {
    res = K.solveNetwork(net);
    net.rows.forEach((r, i) => { const c = $('hyEq' + i); if (c) c.textContent = fx(K.fittingLength(r), 2); });
    if (!res.ok) {
      $('hyVerdict').innerHTML = `<div class="adv-callout bad">⚠ ${res.errors.map(hydErrText).map(esc).join('<br>')}</div>`;
      $('hyStats').innerHTML = ''; $('hyDraw').innerHTML = ''; $('hySheet').innerHTML = ''; $('hyNodes').innerHTML = '';
      if (chart) { chart.destroy(); chart = null; }
      return;
    }
    const h = hz();
    const warns = [];
    if (h && res.As > h.maxAs + 1e-6) warns.push(L(`Area per sprinkler ${fx(res.As, 1)} m² exceeds the ${h.maxAs} m² maximum for standard-spray sprinklers in ${h.en} (NFPA 13 §10.2.4.2).`, `مساحة الرشاش ${fx(res.As, 1)} م² تتجاوز الحد الأقصى ${h.maxAs} م² للرشاشات القياسية في ${h.ar} (NFPA 13 §10.2.4.2).`));
    if (res.maxV > 6) warns.push(L(`Max. velocity ${fx(res.maxV, 1)} m/s — NFPA 13 sets no limit, but many specifications cap it at about 6 m/s (noise, water hammer).`, `أقصى سرعة ${fx(res.maxV, 1)} م/ث — لا يحدد NFPA 13 حداً، لكن كثيراً من المواصفات تحدها بنحو 6 م/ث (الضجيج والطرق المائي).`));
    for (const w of res.warnings) warns.push(L(`Node ${w.node} is a dead end without a sprinkler.`, `العقدة ${w.node} نهاية مسدودة بلا رشاش.`));
    const ok = res.pass;
    $('hyVerdict').innerHTML = `<div class="adv-callout ${ok ? '' : 'bad'} tl-verdict">
      <div class="tl-vbig">${pill(ok, L('SUPPLY ADEQUATE', 'المصدر كافٍ'), L('SUPPLY INADEQUATE', 'المصدر غير كافٍ'))}</div>
      <div>${L('At the total demand', 'عند الطلب الكلي')} ${num(res.Qtot, 0, 'L/min')} ${L('the supply provides', 'يوفّر المصدر')} ${num(res.Pavail, 2, 'bar')} ${L('against a required', 'مقابل مطلوب')} ${num(res.Pdem, 2, 'bar')} — ${L('margin', 'الهامش')} <b>${num(res.margin, 2, 'bar')}</b> (${L('required', 'المطلوب')} ${num(res.need, 2, 'bar')}).
      ${warns.length ? `<div class="tl-warns">${warns.map((w) => `⚠ ${esc(w)}`).join('<br>')}</div>` : ''}</div></div>`;
    $('hyStats').innerHTML = [
      stat(L('Sprinklers in design area', 'الرشاشات في مساحة التصميم'), res.n),
      stat(L('Area per sprinkler', 'مساحة كل رشاش'), fx(res.As, 2), 'm²'),
      stat(L('Min. flow per head q = D·A', 'أقل تدفق للرشاش q = D·A'), fx(res.qmin, 1), 'L/min'),
      stat(L(`Remote head ${res.remote} pressure`, `ضغط الرشاش الأبعد ${res.remote}`), fx(res.nodes[res.remote].P, 2), 'bar'),
      stat(L('Sprinkler demand', 'طلب الرشاشات'), fx(res.Qspr, 0), 'L/min'),
      stat(L('Pressure at source', 'الضغط عند المصدر'), fx(res.Pdem, 2), 'bar'),
      stat(L('Total incl. hose', 'الإجمالي مع الخراطيم'), fx(res.Qtot, 0), 'L/min'),
      stat(L('Safety margin', 'هامش الأمان'), fx(res.margin, 2), 'bar', ok ? 'ok' : 'alarm'),
    ].join('');
    $('hyDraw').innerHTML = drawNetwork(net, res);
    const sizes = [...new Set(net.rows.map((r) => String(r.size)))].sort((a, b) => a - b);
    $('hyLegend').innerHTML = `${sizes.map((s) => `<span><i style="background:#c62828;height:${Math.max(3, SIZE_W[s] || 4)}px;width:18px;border-radius:2px"></i>${K.pipe(s).nps}</span>`).join('')}
      <span><i style="background:#fff;border:2px solid #b91c1c;border-radius:50%"></i>${L('Pendent sprinkler', 'رشاش متدلٍ')}</span>
      <span><i style="background:#f59e0b;border-radius:50%"></i>${L('Most remote (hydraulically)', 'الأبعد هيدروليكياً')}</span>
      <span><i style="background:rgba(220,38,38,.12);border:1px dashed #ef4444"></i>${L('Design area', 'مساحة التصميم')}</span>
      <span>${L('Drawing not to scale', 'الرسم بدون مقياس')}</span>`;
    $('hySheet').innerHTML = sheetHtml(net, res);
    $('hyNodes').innerHTML = nodeTable(net, res);
    drawChart();
  }

  function drawChart() {
    if (chart) { chart.destroy(); chart = null; }
    const cv = $('hyChart'); if (!cv || !res?.ok) return;
    const t = theme();
    const d = supplyData(net, res);
    const X = (q) => Math.pow(q, 1.85);
    const P = (arr) => arr.map(([q, p]) => ({ x: X(q), y: p }));
    const o = baseChartOpts(t);
    o.scales.x = axis(t, L('Flow Q (L/min) — N^1.85 scale', 'التدفق Q (لتر/دقيقة) — مقياس N^1.85'), {
      min: 0, max: X(d.Qmax),
      afterBuildTicks: (sc) => { const st = niceStep(d.Qmax); const tk = []; for (let q = 0; q <= d.Qmax + 1e-6; q += st) tk.push({ value: X(q) }); sc.ticks = tk; },
      ticks: { color: t.text, font: { size: 10.5 }, callback: (v) => Math.round(Math.pow(v, 1 / 1.85)) },
    });
    o.scales.y = axis(t, L('Pressure (bar)', 'الضغط (بار)'), { min: 0, suggestedMax: d.Pmax });
    o.plugins.tooltip.callbacks = { label: (c) => `${c.dataset.label}: ${Math.round(Math.pow(c.parsed.x, 1 / 1.85))} L/min · ${c.parsed.y.toFixed(2)} bar` };
    const okc = res.pass ? t.ok : t.alarm;
    chart = new Chart(cv, {
      type: 'scatter',
      data: {
        datasets: [
          { label: L('Water supply', 'المصدر المائي'), data: P(d.supply), showLine: true, borderColor: '#2563eb', backgroundColor: '#2563eb', borderWidth: 2.5, pointRadius: 0, tension: 0 },
          { label: L('Flow test points', 'نقاط اختبار التدفق'), data: P([[0, net.supply.static], [net.supply.flow, net.supply.residual]]), borderColor: '#2563eb', backgroundColor: '#fff', pointRadius: 5, pointBorderWidth: 2, pointStyle: 'rectRot' },
          { label: L('Sprinkler demand', 'طلب الرشاشات'), data: P(d.demand), showLine: true, borderColor: t.alarm, backgroundColor: t.alarm, borderWidth: 2.2, pointRadius: [0, 5], tension: 0 },
          { label: L('+ Hose allowance', '+ بدل الخراطيم'), data: P(d.hose), showLine: true, borderColor: t.warn, backgroundColor: t.warn, borderWidth: 2.2, borderDash: [6, 4], pointRadius: [0, 6], pointStyle: 'triangle' },
          { label: L('Safety margin', 'هامش الأمان'), data: P(d.margin), showLine: true, borderColor: okc, backgroundColor: okc, borderWidth: 3, pointRadius: [0, 5], pointStyle: 'circle' },
        ],
      },
      options: o,
    });
  }

  // events
  const upd = (fn) => (e) => { fn(e); save(); recompute(); };
  $('hyHaz').onchange = (e) => {
    const h = K.HAZARDS.find((x) => x.id === e.target.value);
    net.hazard = e.target.value;
    if (h) { net.density = h.density; net.area = h.area; net.hose = h.hose; $('hyD').value = h.density; $('hyA').value = h.area; $('hyHose').value = h.hose; }
    save(); recompute();
  };
  const bindNum = (id, set) => { $(id).oninput = upd((e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) set(v); }); };
  bindNum('hyD', (v) => { net.density = v; net.hazard = 'custom'; $('hyHaz').value = 'custom'; });
  bindNum('hyA', (v) => { net.area = v; });
  bindNum('hyPm', (v) => { net.pmin = v; });
  bindNum('hyHose', (v) => { net.hose = v; });
  bindNum('hySe', (v) => { net.source.elev = v; });
  bindNum('hyPs', (v) => { net.supply.static = v; });
  bindNum('hyPr', (v) => { net.supply.residual = v; });
  bindNum('hyQr', (v) => { net.supply.flow = Math.max(1, v); });
  bindNum('hyMg', (v) => { net.margin = v; });
  const tbl = $('hyTable');
  const onCell = (e) => {
    const k = e.target.dataset.k; const tr0 = e.target.closest('tr[data-r]');
    if (!k || !tr0) return;
    const r = net.rows[+tr0.dataset.r];
    if (k === 'node' || k === 'to' || k === 'size') r[k] = e.target.value.trim();
    else { const v = parseFloat(e.target.value); r[k] = Number.isFinite(v) ? v : 0; }
    if (k === 'node' || k === 'to') { delete r.x; delete r.y; }
    save(); recompute();
  };
  tbl.addEventListener('input', onCell);
  tbl.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') onCell(e); });
  tbl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    net.rows.splice(+b.dataset.del, 1); save(); drawTable(); recompute();
  });
  $('hyAdd').onclick = () => {
    let i = net.rows.length + 1; while (net.rows.some((r) => r.node === `N${i}`)) i++;
    const last = net.rows.find((r) => /^CM/i.test(r.node)) || net.rows[net.rows.length - 1];
    net.rows.push({ node: `N${i}`, k: 80, elev: last?.elev ?? 4, to: last?.node ?? 'SRC', size: '1', len: 3, e90: 0, e45: 0, tee: 0, gate: 0, check: 0, C: 120 });
    save(); drawTable(); recompute();
    const wrap = body.querySelector('.tl-edit-wrap'); if (wrap) wrap.scrollTop = wrap.scrollHeight;
  };
  $('hyEx').onclick = () => {
    net = K.defaultNetwork(); save();
    $('hyHaz').value = net.hazard; $('hyD').value = net.density; $('hyA').value = net.area; $('hyPm').value = net.pmin; $('hyHose').value = net.hose;
    $('hySe').value = net.source.elev; $('hyPs').value = net.supply.static; $('hyPr').value = net.supply.residual; $('hyQr').value = net.supply.flow; $('hyMg').value = net.margin;
    drawTable(); recompute();
  };
  $('hyPrint').onclick = () => { if (res?.ok) printDoc(hydReport(net, res), 'hydraulic-calculation.pdf'); };

  drawTable();
  recompute();
  return () => { if (chart) chart.destroy(); chart = null; };
}

function nodeTable(net, res) {
  const ids = [...net.rows.map((r) => r.node), res.root];
  return `<table class="adv-table"><thead><tr><th>${L('Node', 'العقدة')}</th><th class="num">${L('Elev. m', 'المنسوب م')}</th><th class="num">K</th><th class="num">P bar</th><th class="num">q L/min</th><th class="num">Q ${L('upstream', 'باتجاه المصدر')} L/min</th><th class="num">${L('Velocity', 'السرعة')} m/s</th></tr></thead><tbody>
  ${ids.map((id) => { const r = net.rows.find((x) => x.node === id); const nd = res.nodes[id]; const sg = res.segs[id]; if (!nd) return '';
    const low = r && +r.k > 0 && nd.P < res.pmin - 1e-9;
    return `<tr class="${id === res.remote ? 'tl-best' : ''}"><td><b>${esc(id)}</b>${id === res.remote ? ` <span class="adv-pill warn">${L('remote', 'الأبعد')}</span>` : id === res.root ? ` <span class="adv-pill info">${L('source', 'المصدر')}</span>` : ''}</td><td class="num">${fx(nd.elev, 1)}</td><td class="num">${r && +r.k > 0 ? r.k : '—'}</td><td class="num ${low ? 'tl-bad' : ''}">${fx(nd.P, 3)}</td><td class="num">${nd.qHead ? fx(nd.qHead, 1) : '—'}</td><td class="num">${fx(sg ? sg.Q : nd.Q, 1)}</td><td class="num">${sg ? fx(sg.v, 2) : '—'}</td></tr>`; }).join('')}</tbody></table>`;
}

function supplyData(net, res) {
  const s = net.supply;
  const Qmax = Math.max(s.flow * 1.2, res.Qtot * 1.25);
  const supply = [];
  for (let i = 0; i <= 60; i++) { const q = (Qmax * i) / 60; supply.push([q, Math.max(0, K.supplyPressure(s, q))]); }
  const zHead = Math.max(...net.rows.filter((r) => +r.k > 0).map((r) => +r.elev || 0));
  const Pe = Math.max(0, K.BAR_PER_M * (zHead - (+net.source.elev || 0)));
  return {
    Qmax, supply,
    demand: [[0, Pe], [res.Qspr, res.Pdem]],
    hose: [[res.Qspr, res.Pdem], [res.Qtot, res.Pdem]],
    margin: [[res.Qtot, res.Pdem], [res.Qtot, res.Pavail]],
    Pmax: Math.max(s.static, res.Pdem) * 1.15,
    Pe,
  };
}

/** Node positions for the drawing (plan metres + elevation). */
function layout(net, res) {
  const pos = {};
  pos[res.root] = { x: +(net.source.x ?? 0), y: +(net.source.y ?? 0), z: +net.source.elev || 0 };
  const rows = net.rows;
  const autoCount = {};
  for (let pass = 0; pass < rows.length + 2; pass++) {
    let changed = false;
    for (const r of rows) {
      if (pos[r.node]) continue;
      if (Number.isFinite(+r.x) && Number.isFinite(+r.y) && r.x !== undefined && r.y !== undefined) { pos[r.node] = { x: +r.x, y: +r.y, z: +r.elev || 0 }; changed = true; continue; }
      const p = pos[r.to]; if (!p) continue;
      const k = (autoCount[r.to] = (autoCount[r.to] || 0) + 1);
      pos[r.node] = { x: p.x + 2.4 + (k - 1) * 0.6, y: p.y + 2.2 * k, z: +r.elev || 0 }; changed = true;
    }
    if (!changed) break;
  }
  return pos;
}

function drawNetwork(net, res) {
  const pos = layout(net, res);
  const W = 1240, H = 600, pad = 40;
  const iso = (p) => [(p.x - p.y) * 0.866, (p.x + p.y) * 0.5 - p.z * 0.95];
  const ids = Object.keys(pos);
  const pts = ids.map((id) => iso(pos[id]));
  const heads = net.rows.filter((r) => +r.k > 0 && pos[r.node]);
  // design area polygon
  let area = '';
  if (heads.length) {
    const xs = heads.map((h) => pos[h.node].x), ys = heads.map((h) => pos[h.node].y);
    const z = heads.reduce((s, h) => s + pos[h.node].z, 0) / heads.length;
    const x0 = Math.min(...xs) - 1.6, x1 = Math.max(...xs) + 1.6, y0 = Math.min(...ys) - 1.8, y1 = Math.max(...ys) + 1.8;
    area = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => iso({ x, y, z }));
    pts.push(...area);
  }
  const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0]));
  const minY = Math.min(...pts.map((p) => p[1])), maxY = Math.max(...pts.map((p) => p[1]));
  const s = Math.min((W - 2 * pad - 160) / Math.max(1, maxX - minX), (H - 2 * pad - 20) / Math.max(1, maxY - minY));
  const ox = pad + 40 - minX * s + ((W - 2 * pad - 160) - (maxX - minX) * s) / 2, oy = pad - minY * s + ((H - 2 * pad) - (maxY - minY) * s) / 2;
  const P = (p) => { const [a, b] = iso(p); return [ox + a * s, oy + b * s]; };
  const pp = (arr) => arr.map(([a, b]) => `${(ox + a * s).toFixed(1)},${(oy + b * s).toFixed(1)}`).join(' ');

  let g = '';
  // ceiling grid (isometric) under the design area
  if (area) {
    g += `<polygon points="${pp(area)}" fill="url(#tlHatch)" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="6 4"/>`;
    const [lx, ly] = [ox + area[3][0] * s, oy + area[3][1] * s];
    g += `<text x="${lx - 4}" y="${ly + 18}" font-size="11" fill="#b91c1c" font-weight="700" text-anchor="middle">${esc(L('Design area', 'مساحة التصميم'))} ${fx(net.area, 0)} m²</text>`;
    g += `<text x="${lx - 4}" y="${ly + 32}" font-size="10" fill="#b91c1c" text-anchor="middle">${fx(net.density, 1)} mm/min · ${res.n} × ${fx(res.As, 1)} m²</text>`;
  }
  // pipes (upstream → downstream so the flow animation runs toward the heads)
  const sorted = [...net.rows].sort((a, b) => (+b.size) - (+a.size));
  for (const r of sorted) {
    if (!pos[r.node] || !pos[r.to]) continue;
    const [x1, y1] = P(pos[r.to]); const [x2, y2] = P(pos[r.node]);
    const w = SIZE_W[r.size] || 4;
    g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7f1d1d" stroke-width="${w + 1.6}" stroke-linecap="round"/>`;
    g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c62828" stroke-width="${w}" stroke-linecap="round"/>`;
    g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fca5a5" stroke-width="${Math.max(1, w * 0.28)}" stroke-linecap="round" transform="translate(-${w * 0.18},-${w * 0.18})" opacity=".85"/>`;
    g += `<line class="tl-flow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="1.3" stroke-dasharray="3 11" opacity=".75"/>`;
    // valves
    if ((+r.gate || 0) + (+r.check || 0) > 0) {
      const vx = x1 + (x2 - x1) * 0.45, vy = y1 + (y2 - y1) * 0.45; const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      g += `<g transform="translate(${vx},${vy}) rotate(${ang})"><polygon points="-8,-6 8,6 8,-6 -8,6" fill="#1f2937" stroke="#fff" stroke-width="1"/><line x1="0" y1="0" x2="0" y2="-10" stroke="#1f2937" stroke-width="1.6"/><line x1="-5" y1="-10" x2="5" y2="-10" stroke="#1f2937" stroke-width="2"/></g>`;
    }
    // size / length tag
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    if (len < 85) continue;
    let nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    if (ny < 0 || (Math.abs(ny) < 0.05 && nx > 0)) { nx = -nx; ny = -ny; }
    const label = `${K.pipe(r.size).nps} · ${fx(r.len, 1)} m`;
    const tx = mx + nx * 11, ty = my + ny * 11 + 4;
    const anchorTag = Math.abs(nx) < 0.2 ? 'middle' : nx < 0 ? 'end' : 'start';
    g += `<text x="${tx}" y="${ty}" font-size="10.5" fill="#475569" text-anchor="${anchorTag}" class="tl-halo">${esc(label)}</text>`;
  }
  // nodes
  for (const id of ids) {
    const [x, y] = P(pos[id]);
    const r = net.rows.find((q) => q.node === id);
    const nd = res.nodes[id]; if (!nd) continue;
    const isHead = r && +r.k > 0;
    if (isHead) {
      const remote = id === res.remote;
      if (remote) g += `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#f59e0b" stroke-width="2.5"><animate attributeName="r" values="9;15;9" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.35;1" dur="2.2s" repeatCount="indefinite"/></circle>`;
      g += `<g transform="translate(${x},${y})"><line x1="0" y1="0" x2="0" y2="7" stroke="#7f1d1d" stroke-width="2"/><circle r="5.8" fill="${remote ? '#fde68a' : '#fff'}" stroke="#b91c1c" stroke-width="1.8"/><path d="M-3.6 0H3.6M0 -3.6V3.6" stroke="#b91c1c" stroke-width="1.3"/><path d="M-5 9.5 Q0 6 5 9.5" fill="none" stroke="#7f1d1d" stroke-width="1.4"/></g>`;
      g += `<g font-size="11.5" class="tl-halo" text-anchor="end"><text x="${x - 9}" y="${y - 30}" font-weight="700" fill="#0f172a">${remote ? '★ ' : ''}${esc(id)}</text>
        <text x="${x - 9}" y="${y - 17}" fill="#1d4ed8">${fx(nd.P, 2)} bar</text><text x="${x - 9}" y="${y - 4}" fill="#047857">${fx(nd.qHead, 1)} L/min</text></g>`;
    } else {
      const isRoot = id === res.root;
      g += `<circle cx="${x}" cy="${y}" r="${isRoot ? 7 : 4.2}" fill="${isRoot ? '#1d4ed8' : '#0f172a'}" stroke="#fff" stroke-width="1.5"/>`;
      const lx = isRoot ? x + 12 : x + 9, anchor = 'start';
      g += `<g font-size="11.5" class="tl-halo"><text x="${lx}" y="${y - 20}" text-anchor="${anchor}" font-weight="700" fill="#0f172a">${esc(id)}${isRoot ? ' · ' + esc(L('SOURCE', 'المصدر')) : ''}</text>
        <text x="${lx}" y="${y - 9}" text-anchor="${anchor}" fill="#1d4ed8">${fx(nd.P, 2)} bar · <tspan fill="#047857">${fx(nd.Q, 0)} L/min</tspan></text></g>`;
    }
  }
  // riser hint & axis gizmo
  const gz = `<g transform="translate(${W - 70},${H - 40})" font-size="9" fill="#64748b"><line x1="0" y1="0" x2="26" y2="15" stroke="#64748b"/><line x1="0" y1="0" x2="-26" y2="15" stroke="#64748b"/><line x1="0" y1="0" x2="0" y2="-26" stroke="#64748b"/><text x="28" y="22">x</text><text x="-34" y="22">y</text><text x="3" y="-28">z</text></g>`;
  return `<svg class="adv-svg tl-draw" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="direction:ltr">
    <defs><pattern id="tlHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(239,68,68,.06)"/><line x1="0" y1="0" x2="0" y2="8" stroke="rgba(239,68,68,.22)" stroke-width="1.2"/></pattern>
    <pattern id="tlGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#e8edf3" stroke-width="1"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="#fbfcfe"/><rect width="${W}" height="${H}" fill="url(#tlGrid)"/>
    ${g}${gz}
    <text x="14" y="${H - 12}" font-size="10" fill="#64748b">${esc(L('Isometric · pipe sizes nominal (Sch 40) · lengths are actual, drawing not to scale', 'أيزومتري · الأقطار اسمية (جدول 40) · الأطوال فعلية والرسم بدون مقياس'))}</text>
  </svg>`;
}

function sheetHtml(net, res, printMode = false) {
  let i = 0;
  const rows = [];
  const remoteReq = Math.pow(res.qmin / (+net.rows.find((r) => r.node === res.remote).k), 2);
  rows.push(`<tr class="tl-sh-info"><td colspan="11">${L('Remote-area requirement', 'متطلب المساحة الأبعد')}: q<sub>min</sub> = D × A<sub>s</sub> = ${n(fx(net.density, 1))} × ${n(fx(res.As, 2))} = <b>${n(fx(res.qmin, 1) + ' L/min')}</b>; A<sub>s</sub> = ${n(fx(net.area, 0))} / ${n(res.n)}. P<sub>min</sub> = max(${n(fx(res.pmin, 2))}, (q<sub>min</sub>/K)²) = ${n(fx(Math.max(res.pmin, remoteReq), 3) + ' bar')}.</td></tr>`);
  for (const s of res.steps) {
    if (s.kind === 'head') {
      const gov = s.governing === 'path' ? L('pressure set by downstream path', 'الضغط محدد بالمسار السفلي') : s.governing === 'pmin' ? L('minimum pressure governs', 'الضغط الأدنى هو الحاكم') : L('density governs', 'الكثافة هي الحاكمة');
      rows.push(`<tr class="tl-sh-head"><td class="num">${++i}</td><td><b>${esc(s.at)}</b> <small>K${s.k}</small></td><td class="num">${fx(s.q, 1)}</td><td class="num">—</td><td colspan="6">q = K√P = ${n(s.k)} × √${n(fx(s.P, 3))} = <b>${n(fx(s.q, 1))}</b> L/min</td><td class="tl-note">${esc(gov)}</td></tr>`);
    } else if (s.kind === 'seg') {
      rows.push(`<tr><td class="num">${++i}</td><td><b>${esc(s.from)}</b> → ${esc(s.to)}</td><td class="num">${s.q ? fx(s.q, 1) : '—'}</td><td class="num"><b>${fx(s.Q, 1)}</b></td>
        <td class="num">${K.pipe(s.size).nps}<br><small>${fx(s.d, 2)} mm</small></td><td>${fitText(s.fit)}</td>
        <td class="num tl-stack">L ${fx(s.L, 2)}<br>F ${fx(s.F, 2)}<br><b>T ${fx(s.T, 2)}</b></td><td class="num">${s.C}</td><td class="num">${fx(s.pf, 4)}</td>
        <td class="num tl-stack">Pt ${fx(s.Pstart, 3)}<br>Pf ${fx(s.Pf, 3)}<br>Pe ${fx(s.Pe, 3)}<br><b>→ ${fx(s.Pend, 3)}</b></td><td class="tl-note">v = ${fx(s.v, 2)} m/s</td></tr>`);
    } else if (s.kind === 'bal') {
      rows.push(`<tr class="tl-sh-bal"><td class="num">${++i}</td><td colspan="10">⚖ ${L('Balance at', 'موازنة عند')} <b>${esc(s.at)}</b>: ${L('path from', 'المسار من')} ${esc(s.from)} ${L('needs', 'يحتاج')} ${n(fx(s.P, 3))} bar ${L('but the junction is at', 'لكن ضغط الوصلة')} ${n(fx(s.Pgov, 3))} bar → K<sub>eq</sub> = Q/√P = ${n(fx(s.Q, 1))}/√${n(fx(s.P, 3))} = ${n(fx(s.Keq, 2))}; Q′ = K<sub>eq</sub>·√P = <b>${n(fx(s.Qa, 1))} L/min</b></td></tr>`);
    }
  }
  rows.push(`<tr class="tl-sh-tot"><td></td><td colspan="2"><b>${esc(res.root)}</b> ${L('(source)', '(المصدر)')}</td><td class="num"><b>${fx(res.Qspr, 1)}</b></td><td colspan="5">${L('Sprinkler demand at source', 'طلب الرشاشات عند المصدر')}</td><td class="num"><b>${fx(res.Pdem, 3)}</b></td><td class="tl-note">${L('avg density', 'متوسط الكثافة')} ${fx(res.avgDensity, 2)} mm/min</td></tr>`);
  rows.push(`<tr class="tl-sh-tot"><td></td><td colspan="2">${L('Hose allowance', 'بدل الخراطيم')}</td><td class="num">+${fx(res.hose, 0)}</td><td colspan="7">NFPA 13 Table 19.3.3.1.2</td></tr>`);
  rows.push(`<tr class="tl-sh-tot"><td></td><td colspan="2"><b>${L('TOTAL DEMAND', 'الطلب الكلي')}</b></td><td class="num"><b>${fx(res.Qtot, 0)}</b></td><td colspan="5">${L('Supply available at this flow', 'المتاح من المصدر عند هذا التدفق')}: ${n(fx(net.supply.static, 2))} − (${n(fx(net.supply.static, 2))} − ${n(fx(net.supply.residual, 2))})·(${n(fx(res.Qtot, 0))}/${n(fx(net.supply.flow, 0))})^1.85</td><td class="num"><b>${fx(res.Pavail, 3)}</b></td><td class="tl-note">${pill(res.pass)} ${L('margin', 'الهامش')} ${fx(res.margin, 2)} bar</td></tr>`);
  return `<table class="adv-table tl-sheet-t ${printMode ? 'print' : ''}"><thead><tr><th>#</th><th>${L('Node / path', 'العقدة / المسار')}</th><th class="num">q<br><small>L/min</small></th><th class="num">Q<br><small>L/min</small></th><th class="num">${L('Pipe', 'الأنبوب')}<br><small>ID</small></th><th>${L('Fittings', 'القطع')}</th><th class="num">${L('Length', 'الطول')}<br><small>m</small></th><th class="num">C</th><th class="num">pf<br><small>bar/m</small></th><th class="num">${L('Pressure', 'الضغط')}<br><small>bar</small></th><th>${L('Notes', 'ملاحظات')}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

/** Plain SVG graph (for print: white paper, fixed colours). */
function svgSupplyGraph(net, res) {
  const d = supplyData(net, res);
  const W = 680, H = 340, l = 58, r = 18, t = 16, b = 46;
  const X = (q) => l + (Math.pow(q, 1.85) / Math.pow(d.Qmax, 1.85)) * (W - l - r);
  const Pm = Math.ceil(d.Pmax);
  const Y = (p) => H - b - (p / Pm) * (H - t - b);
  let g = '';
  const st = niceStep(d.Qmax);
  for (let q = 0; q <= d.Qmax + 1e-6; q += st) g += `<line x1="${X(q)}" y1="${t}" x2="${X(q)}" y2="${H - b}" stroke="#e5e7eb"/><text x="${X(q)}" y="${H - b + 14}" font-size="10" text-anchor="middle" fill="#374151">${Math.round(q)}</text>`;
  for (let p = 0; p <= Pm; p += Pm > 8 ? 2 : 1) g += `<line x1="${l}" y1="${Y(p)}" x2="${W - r}" y2="${Y(p)}" stroke="#e5e7eb"/><text x="${l - 6}" y="${Y(p) + 3}" font-size="10" text-anchor="end" fill="#374151">${p}</text>`;
  const line = (arr, c, w, dash = '') => `<polyline points="${arr.map(([q, p]) => `${X(q).toFixed(1)},${Y(p).toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  g += line(d.supply, '#2563eb', 2.2) + line(d.demand, '#dc2626', 2) + line(d.hose, '#d97706', 2, '6 4') + line(d.margin, res.pass ? '#16a34a' : '#dc2626', 3);
  g += `<circle cx="${X(res.Qspr)}" cy="${Y(res.Pdem)}" r="4" fill="#dc2626"/><circle cx="${X(res.Qtot)}" cy="${Y(res.Pdem)}" r="4" fill="#d97706"/><circle cx="${X(res.Qtot)}" cy="${Y(res.Pavail)}" r="4" fill="#2563eb"/>`;
  g += `<text x="${X(res.Qtot) + 6}" y="${(Y(res.Pdem) + Y(res.Pavail)) / 2}" font-size="10" fill="#111">Δ ${fx(res.margin, 2)} bar</text>`;
  g += `<text x="${(W + l) / 2}" y="${H - 8}" font-size="11" text-anchor="middle" fill="#111">Q (L/min) — N^1.85</text><text x="14" y="${H / 2}" font-size="11" text-anchor="middle" transform="rotate(-90 14 ${H / 2})" fill="#111">P (bar)</text>`;
  g += `<g font-size="10"><rect x="${W - 190}" y="${t + 4}" width="170" height="54" fill="#fff" stroke="#d1d5db"/><line x1="${W - 182}" y1="${t + 16}" x2="${W - 160}" y2="${t + 16}" stroke="#2563eb" stroke-width="2"/><text x="${W - 154}" y="${t + 19}">Water supply</text><line x1="${W - 182}" y1="${t + 31}" x2="${W - 160}" y2="${t + 31}" stroke="#dc2626" stroke-width="2"/><text x="${W - 154}" y="${t + 34}">Sprinkler demand</text><line x1="${W - 182}" y1="${t + 46}" x2="${W - 160}" y2="${t + 46}" stroke="#d97706" stroke-width="2" stroke-dasharray="6 4"/><text x="${W - 154}" y="${t + 49}">+ Hose allowance</text></g>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" style="direction:ltr;font-family:Segoe UI,Arial,sans-serif">${g}</svg>`;
}

const PRINT_CSS = `<style>
.tlp{font-family:"Segoe UI",Tahoma,Arial,sans-serif;color:#111;padding:14mm 12mm;font-size:11px;background:#fff}
.tlp h1{font-size:18px;margin:0 0 2px}.tlp h2{font-size:13px;margin:16px 0 6px;border-bottom:2px solid #b91c1c;padding-bottom:3px;color:#7f1d1d}
.tlp table{width:100%;border-collapse:collapse;font-size:10px}.tlp td,.tlp th{border:1px solid #cbd5e1;padding:3px 5px;text-align:start;vertical-align:top}
.tlp th{background:#f1f5f9}.tlp .num{text-align:right;font-family:Consolas,monospace;direction:ltr}.tlp .tl-n{direction:ltr;unicode-bidi:isolate;font-family:Consolas,monospace}
.tlp .hdr{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #111;padding-bottom:6px}
.tlp .kv{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 16px}.tlp .kv div{display:flex;justify-content:space-between;border-bottom:1px dotted #cbd5e1;padding:2px 0}
.tlp .ok{color:#166534;font-weight:700}.tlp .bad{color:#991b1b;font-weight:700}.tlp .adv-pill{font-weight:700}
.tlp .tl-sh-head td{background:#f8fafc;color:#334155}.tlp .tl-sh-bal td{background:#fffbeb}.tlp .tl-sh-tot td{background:#f1f5f9}.tlp .tl-sh-info td{background:#eff6ff}
.tlp svg{max-width:100%}.tlp .sig{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:22px}.tlp .sig div{border-top:1px solid #111;padding-top:4px}
.tlp .pb{page-break-before:always}
</style>`;

function hydReport(net, res) {
  const h = K.HAZARDS.find((x) => x.id === net.hazard);
  const kv = (k, v) => `<div><span>${k}</span><b class="tl-n">${v}</b></div>`;
  return `${PRINT_CSS}<div class="tlp" dir="${ar() ? 'rtl' : 'ltr'}">
  <div class="hdr"><div><h1>${L('Sprinkler Hydraulic Calculation Report', 'تقرير الحساب الهيدروليكي لنظام الرشاشات')}</h1>
  <div>${L('ASFAN Business Center — wet-pipe sprinkler system, remote area', 'مركز أسفان للأعمال — نظام رشاشات أنابيب رطبة، المساحة الأبعد')}</div></div>
  <div style="text-align:end">${L('Date', 'التاريخ')}: <b>${today()}</b><br>${L('Prepared by', 'أعدّه')}: <b>${esc(student())}</b><br>NFPA 13 (2022) §28</div></div>
  <h2>1. ${L('Design basis', 'أساس التصميم')}</h2>
  <div class="kv">${kv(L('Hazard classification', 'تصنيف الخطورة'), esc(h ? L(h.en, h.ar) : L('Custom', 'مخصص')))}${kv(L('Design density', 'كثافة التصميم'), fx(net.density, 1) + ' mm/min')}${kv(L('Design area', 'مساحة التصميم'), fx(net.area, 0) + ' m²')}
  ${kv(L('Sprinklers in area', 'عدد الرشاشات'), res.n)}${kv(L('Area per sprinkler', 'مساحة الرشاش'), fx(res.As, 2) + ' m²')}${kv(L('Min. end-head pressure', 'أقل ضغط للرشاش'), fx(res.pmin, 2) + ' bar')}
  ${kv(L('Hose allowance', 'بدل الخراطيم'), fx(net.hose, 0) + ' L/min')}${kv(L('Pipe / C-factor', 'الأنابيب / معامل C'), 'Sch 40 steel / C 120')}${kv(L('Method', 'الطريقة'), 'Hazen–Williams, K-eq. balancing')}
  ${kv(L('Static pressure', 'الضغط الساكن'), fx(net.supply.static, 2) + ' bar')}${kv(L('Residual pressure', 'الضغط المتبقي'), fx(net.supply.residual, 2) + ' bar')}${kv(L('at flow', 'عند تدفق'), fx(net.supply.flow, 0) + ' L/min')}</div>
  <h2>2. ${L('Results summary', 'ملخص النتائج')}</h2>
  <div class="kv">${kv(L('Sprinkler demand', 'طلب الرشاشات'), fx(res.Qspr, 0) + ' L/min')}${kv(L('Pressure at source', 'الضغط عند المصدر'), fx(res.Pdem, 2) + ' bar')}${kv(L('Total demand incl. hose', 'الطلب الكلي مع الخراطيم'), fx(res.Qtot, 0) + ' L/min')}
  ${kv(L('Supply available', 'المتاح من المصدر'), fx(res.Pavail, 2) + ' bar')}${kv(L('Safety margin', 'هامش الأمان'), fx(res.margin, 2) + ' bar')}${kv(L('Result', 'النتيجة'), `<span class="${res.pass ? 'ok' : 'bad'}">${res.pass ? L('PASS — supply adequate', 'مقبول — المصدر كافٍ') : L('FAIL — supply inadequate', 'مرفوض — المصدر غير كافٍ')}</span>`)}</div>
  <h2>3. ${L('Supply / demand graph', 'منحنى المصدر / الطلب')}</h2>${svgSupplyGraph(net, res)}
  <h2 class="pb">4. ${L('Isometric node diagram', 'المخطط الأيزومتري للعقد')}</h2>${drawNetwork(net, res)}
  <h2 class="pb">5. ${L('Calculation sheet', 'ورقة الحساب')}</h2>${sheetHtml(net, res, true)}
  <p style="font-size:9.5px;color:#475569">${L('Friction loss: p = 6.05×10⁵·Q^1.85/(C^1.85·d^4.87) bar/m (NFPA 13 §28.2.2.1, SI). Elevation: 0.0981 bar/m. Fittings: NFPA 13 Table 28.2.3.1.1. Balancing: K-equivalent method at junctions (Q′ = Q·√(P_high/P_low)).', 'فاقد الاحتكاك: p = 6.05×10⁵·Q^1.85/(C^1.85·d^4.87) بار/م (NFPA 13 §28.2.2.1، النظام الدولي). المنسوب: 0.0981 بار/م. القطع: جدول NFPA 13 رقم 28.2.3.1.1. الموازنة: طريقة K المكافئ عند الوصلات.')}</p>
  <div class="sig"><div>${L('Prepared by', 'أعدّه')}: ${esc(student())}</div><div>${L('Checked by', 'دقّقه')}:</div><div>${L('Approved by', 'اعتمده')}:</div></div></div>`;
}

// ═════════════════════════════════════════ 2. BATTERY
const BAT_DEF = { standbyH: 24, alarmMin: null, margin: 20, charger: 2.0, ov: {} };
function batRows(sys, st) {
  const cnt = {}; for (const d of sys.devices) cnt[d.type] = (cnt[d.type] || 0) + 1;
  const voice = voiceOn(sys);
  const rows = [
    { key: 'panel', name: L('FACP main board, display & 1 loop card', 'اللوحة الرئيسية والشاشة وبطاقة حلقة واحدة'), qty: 1, standby: 150, alarm: 400 },
    ...Object.keys(DEVICE_TYPES).filter((t) => cnt[t]).map((t) => ({ key: t, name: tr(DEVICE_TYPES[t].name), qty: cnt[t], standby: DEVICE_TYPES[t].iq, alarm: DEVICE_TYPES[t].ia, live: true, sym: DEVICE_TYPES[t].sym })),
    { key: 'led', name: L('Device LEDs lit in alarm (panel limits to 10)', 'مصابيح الأجهزة المضاءة عند الإنذار (اللوحة تحدها بـ 10)'), qty: 10, standby: 0, alarm: 5 },
    { key: 'nac', name: tr(NAC_TYPE.name), qty: sys.nacDevices.length, standby: 0, alarm: NAC_TYPE.ia, live: true },
    { key: 'dact', name: L('Dual-path communicator (DACT + IP/cellular)', 'جهاز اتصال مزدوج المسار (DACT + IP/خلوي)'), qty: 1, standby: 35, alarm: 70 },
    { key: 'ann', name: L('Remote annunciator (fire-service entrance)', 'لوحة بيان عن بُعد (مدخل الدفاع المدني)'), qty: 1, standby: 30, alarm: 60 },
    { key: 'bms', name: L('BMS gateway (BACnet/IP)', 'بوابة نظام إدارة المبنى (BACnet/IP)'), qty: 1, standby: 60, alarm: 60 },
    { key: 'amp', name: L('Voice evacuation amplifier 60 W', 'مضخم الإخلاء الصوتي 60 واط'), qty: voice ? 1 : 0, standby: 90, alarm: 3200 },
  ];
  for (const r of rows) Object.assign(r, st.ov?.[r.key] || {}, r.live ? { qty: r.qty } : {});
  return { rows, voice };
}
function batCalc(sys, st) {
  const { rows, voice } = batRows(sys, st);
  const alarmMin = st.alarmMin ?? (voice ? 15 : 5);
  const r = K.batterySizing(rows, { standbyH: st.standbyH, alarmMin, margin: st.margin / 100, charger: st.charger });
  return { rows, voice, alarmMin, ...r };
}

function renderBat(body, ctx) {
  const sys = ctx.sys;
  const st = { ...BAT_DEF, ...store.get('tools.bat', {}) };
  st.ov = st.ov || {};
  const save = () => store.set('tools.bat', st);
  let chart = null;
  const quick = batteryCalc(systemLoads(sys));

  body.innerHTML = `
  <div class="adv-grid tl-bat-top">
    <div class="card"><h3>${L('SECONDARY SUPPLY PARAMETERS', 'معطيات مصدر الطاقة الاحتياطي')}</h3>
      <div class="adv-form">
        ${fld('btH', L('Standby duration', 'مدة الاستعداد'), st.standbyH, 'h', '1', 'min="4"')}
        <label class="adv-field">${L('Alarm duration', 'مدة الإنذار')}<select id="btA">
          <option value="" ${st.alarmMin == null ? 'selected' : ''}>${L('Auto (5 min, 15 min with voice EVAC)', 'تلقائي (5 دقائق، 15 مع الإخلاء الصوتي)')}</option>
          <option value="5" ${st.alarmMin === 5 ? 'selected' : ''}>5 min — ${L('general alarm', 'إنذار عام')}</option>
          <option value="15" ${st.alarmMin === 15 ? 'selected' : ''}>15 min — ${L('in-building EVACS', 'نظام الإخلاء الصوتي')}</option></select></label>
        ${fld('btM', L('Safety margin', 'هامش الأمان'), st.margin, '%', '1', 'min="0"')}
        ${fld('btC', L('Charger output', 'تيار الشاحن'), st.charger, 'A', '0.1', 'min="0"')}
      </div>
      <div class="adv-note" style="margin-top:10px">${L('NFPA 72 §10.6.7.2: quiescent (standby) load for 24 h, then 5 min in alarm — 15 min at maximum connected load for an emergency voice/alarm communication system (§10.6.7.2). A 20 % safety margin covers ageing and temperature. The charger must recharge the battery within 48 h (§10.6.10).', 'NFPA 72 §10.6.7.2: حمل الاستعداد لمدة 24 ساعة ثم 5 دقائق إنذار — و15 دقيقة بأقصى حمل لنظام الاتصال الصوتي للطوارئ (§10.6.7.2). هامش أمان 20% لتغطية التقادم ودرجة الحرارة. ويجب أن يعيد الشاحن شحن البطارية خلال 48 ساعة (§10.6.10).')}</div>
    </div>
    <div class="card tl-batvis"><h3>${L('SELECTED BATTERY', 'البطارية المختارة')}</h3><div id="btVis"></div></div>
  </div>
  <div class="adv-stats" id="btStats"></div>
  <div class="card"><h3>${L('LOAD SCHEDULE (LIVE FROM THE PROJECT)', 'جدول الأحمال (مباشر من المشروع)')}<span class="r"><button class="btn sm" id="btReset">↺ ${L('Reset currents', 'استعادة التيارات')}</button></span></h3>
    <div class="adv-scroll"><table class="adv-table tl-edit" id="btTable"></table></div>
    <div class="adv-note" style="margin-top:8px">${L('Quantities marked LIVE come from the devices installed in the Smart Lab project and update when you add or remove devices. Currents are editable — always use the listed data-sheet values.', 'الكميات المعلّمة «مباشر» تأتي من الأجهزة المركبة في مشروع المختبر وتتحدث عند الإضافة أو الحذف. التيارات قابلة للتعديل — استخدم دائماً قيم النشرات الفنية المعتمدة.')}</div></div>
  <div class="adv-grid c2">
    <div class="card"><h3>${L('CALCULATION', 'الحساب')}</h3><div id="btFormula" class="tl-formulas"></div></div>
    <div class="card"><h3>${L('BATTERY DISCHARGE PROFILE', 'منحنى تفريغ البطارية')}</h3><div class="tl-chart"><canvas id="btChart"></canvas></div></div>
  </div>
  <div class="card tl-task" id="btTask"></div>`;
  const $ = (id) => body.querySelector('#' + id);

  function draw() {
    const c = batCalc(sys, st);
    $('btTable').innerHTML = `<thead><tr><th>${L('Item', 'البند')}</th><th class="num">${L('Qty', 'العدد')}</th><th class="num">${L('Standby mA (each)', 'استعداد mA (للوحدة)')}</th><th class="num">${L('Alarm mA (each)', 'إنذار mA (للوحدة)')}</th><th class="num">${L('Standby total mA', 'إجمالي الاستعداد mA')}</th><th class="num">${L('Alarm total mA', 'إجمالي الإنذار mA')}</th></tr></thead>
      <tbody>${c.rows.map((r) => `<tr data-key="${r.key}"><td>${esc(r.name)}</td>
        <td class="num">${r.live ? `<b>${r.qty}</b> <span class="adv-pill info tl-live">${L('LIVE', 'مباشر')}</span>` : `<input type="number" class="tl-s" data-f="qty" value="${r.qty}" min="0" step="1"/>`}</td>
        <td class="num"><input type="number" class="tl-s" data-f="standby" value="${r.standby}" min="0" step="0.05"/></td>
        <td class="num"><input type="number" class="tl-s" data-f="alarm" value="${r.alarm}" min="0" step="0.05"/></td>
        <td class="num" data-tq>${fx(r.qty * r.standby, 1)}</td><td class="num" data-ta>${fx(r.qty * r.alarm, 1)}</td></tr>`).join('')}
      <tr class="tl-sh-tot"><td><b>${L('TOTAL', 'الإجمالي')}</b></td><td></td><td></td><td></td><td class="num"><b id="btTq">${fx(c.standbyA * 1000, 1)}</b></td><td class="num"><b id="btTa">${fx(c.alarmA * 1000, 1)}</b></td></tr></tbody>`;
    results(c);
  }
  function results(c) {
    c = c || batCalc(sys, st);
    $('btTq') && ($('btTq').textContent = fx(c.standbyA * 1000, 1));
    $('btTa') && ($('btTa').textContent = fx(c.alarmA * 1000, 1));
    body.querySelectorAll('#btTable tr[data-key]').forEach((tr0) => {
      const r = c.rows.find((x) => x.key === tr0.dataset.key); if (!r) return;
      tr0.querySelector('[data-tq]').textContent = fx(r.qty * r.standby, 1); tr0.querySelector('[data-ta]').textContent = fx(r.qty * r.alarm, 1);
    });
    $('btStats').innerHTML = [
      stat(L('Standby current', 'تيار الاستعداد'), fx(c.standbyA, 3), 'A'),
      stat(L('Alarm current', 'تيار الإنذار'), fx(c.alarmA, 3), 'A'),
      stat(L(`Standby ${st.standbyH} h`, `استعداد ${st.standbyH} س`), fx(c.standbyAh, 2), 'Ah'),
      stat(L(`Alarm ${c.alarmMin} min`, `إنذار ${c.alarmMin} د`), fx(c.alarmAh, 2), 'Ah'),
      stat(L(`Required (+${st.margin} %)`, `المطلوب (+${st.margin}%)`), fx(c.required, 2), 'Ah', 'warn'),
      stat(L('Selected battery', 'البطارية المختارة'), c.pick, 'Ah', 'ok'),
      stat(L('Charger required', 'الشاحن المطلوب'), fx(c.chargerReq, 2), 'A', c.chargerOk ? 'ok' : 'alarm'),
    ].join('');
    $('btFormula').innerHTML = `
      <div class="tl-f"><span>${L('Standby capacity', 'سعة الاستعداد')}</span><code>C<sub>s</sub> = I<sub>q</sub> × t<sub>s</sub> = ${fx(c.standbyA, 3)} A × ${st.standbyH} h = <b>${fx(c.standbyAh, 2)} Ah</b></code></div>
      <div class="tl-f"><span>${L('Alarm capacity', 'سعة الإنذار')}</span><code>C<sub>a</sub> = I<sub>a</sub> × t<sub>a</sub> = ${fx(c.alarmA, 3)} A × ${c.alarmMin}/60 h = <b>${fx(c.alarmAh, 2)} Ah</b></code></div>
      <div class="tl-f"><span>${L('With safety margin', 'مع هامش الأمان')}</span><code>C = (C<sub>s</sub> + C<sub>a</sub>) × ${fx(1 + st.margin / 100, 2)} = ${fx(c.base, 2)} × ${fx(1 + st.margin / 100, 2)} = <b>${fx(c.required, 2)} Ah</b></code></div>
      <div class="tl-f"><span>${L('Battery selected', 'البطارية المختارة')}</span><code>${L('next standard size ≥', 'أقرب مقاس قياسي ≥')} ${fx(c.required, 2)} Ah → <b>2 × 12 V ${c.pick} Ah</b> ${L('in series (24 V)', 'على التوالي (24 فولت)')}</code></div>
      <div class="tl-f"><span>${L('Charger check (48 h)', 'فحص الشاحن (48 ساعة)')}</span><code>I<sub>ch</sub> ≥ I<sub>q</sub> + 1.2·(C<sub>s</sub>+C<sub>a</sub>)/48 = ${fx(c.standbyA, 3)} + 1.2×${fx(c.base, 2)}/48 = <b>${fx(c.chargerReq, 2)} A</b> ${c.chargerOk ? '≤' : '>'} ${fx(st.charger, 1)} A ${pill(c.chargerOk)}</code></div>
      <div class="adv-note" style="margin-top:8px">${L('Cross-check with the panel quick estimate (loop devices + NAC only, 5 min):', 'مقارنة مع التقدير السريع للوحة (أجهزة الحلقة ودوائر التنبيه فقط، 5 دقائق):')} ${num(quick.ah, 2, 'Ah')} → ${n(quick.pick + ' Ah')}. ${c.voice ? L('The cause & effect matrix drives VOICE EVACUATION, so the alarm period is 15 min.', 'مصفوفة السبب والنتيجة تشغّل الإخلاء الصوتي، لذلك فترة الإنذار 15 دقيقة.') : ''}</div>`;
    $('btVis').innerHTML = batterySvg(c);
    drawChart(c);
  }
  function drawChart(c) {
    if (chart) { chart.destroy(); chart = null; }
    const t = theme();
    const pts = [];
    for (let h = 0; h <= st.standbyH; h += st.standbyH / 24) pts.push({ x: h, y: c.pick - c.standbyA * h });
    const endS = c.pick - c.standbyAh;
    pts.push({ x: st.standbyH + c.alarmMin / 60, y: endS - c.alarmAh });
    const need = [{ x: 0, y: c.required }, { x: st.standbyH, y: c.required - c.standbyAh * (1 + st.margin / 100) }, { x: st.standbyH + c.alarmMin / 60, y: c.required - c.base * (1 + st.margin / 100) }];
    const o = baseChartOpts(t);
    o.scales.x = axis(t, L('Time on battery (h)', 'زمن التشغيل على البطارية (ساعة)'), { min: 0, max: st.standbyH + 1 });
    o.scales.y = axis(t, L('Remaining capacity (Ah)', 'السعة المتبقية (أمبير ساعة)'), { min: 0 });
    chart = new Chart($('btChart'), {
      type: 'scatter',
      data: { datasets: [
        { label: L(`Selected ${c.pick} Ah`, `المختارة ${c.pick} Ah`), data: pts, showLine: true, borderColor: t.accent, backgroundColor: t.accent, pointRadius: 0, borderWidth: 2.5, fill: { target: 'origin' }, tension: 0 },
        { label: L('Calculated requirement', 'المتطلب المحسوب'), data: need, showLine: true, borderColor: t.warn, backgroundColor: t.warn, borderDash: [6, 4], pointRadius: 0, borderWidth: 2 },
      ] },
      options: o,
    });
    chart.data.datasets[0].backgroundColor = t.accent + '22';
    chart.update();
  }
  function onEdit(e) {
    const f = e.target.dataset.f; const tr0 = e.target.closest('tr[data-key]'); if (!f || !tr0) return;
    const v = parseFloat(e.target.value); if (!Number.isFinite(v)) return;
    (st.ov[tr0.dataset.key] ||= {})[f] = v; save(); results();
  }
  $('btTable').addEventListener('input', onEdit);
  $('btH').oninput = (e) => { const v = parseFloat(e.target.value); if (v > 0) { st.standbyH = v; save(); results(); } };
  $('btA').onchange = (e) => { st.alarmMin = e.target.value ? +e.target.value : null; save(); results(); };
  $('btM').oninput = (e) => { const v = parseFloat(e.target.value); if (v >= 0) { st.margin = v; save(); results(); } };
  $('btC').oninput = (e) => { const v = parseFloat(e.target.value); if (v >= 0) { st.charger = v; save(); results(); } };
  $('btReset').onclick = () => { st.ov = {}; save(); draw(); };
  draw();
  batTask($('btTask'), ctx);
  return () => { if (chart) chart.destroy(); chart = null; };
}

function batterySvg(c) {
  const frac = Math.min(1, c.required / c.pick);
  const bat = (x) => `<g transform="translate(${x},30)">
    <rect x="0" y="10" width="150" height="96" rx="7" fill="url(#tlBatG)" stroke="#0f172a" stroke-width="1.5"/>
    <rect x="18" y="0" width="22" height="12" rx="2" fill="#dc2626" stroke="#0f172a"/><rect x="110" y="0" width="22" height="12" rx="2" fill="#1f2937" stroke="#0f172a"/>
    <text x="29" y="-4" text-anchor="middle" font-size="13" font-weight="700" fill="#dc2626">+</text><text x="121" y="-4" text-anchor="middle" font-size="13" font-weight="700" fill="#111">−</text>
    <rect x="12" y="28" width="126" height="34" rx="3" fill="#f8fafc" opacity=".92"/>
    <text x="75" y="44" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">12 V ${c.pick} Ah</text>
    <text x="75" y="57" text-anchor="middle" font-size="8.5" fill="#475569">VRLA · SLA</text>
    <rect x="12" y="74" width="126" height="10" rx="5" fill="#334155"/><rect x="12" y="74" width="${126 * frac}" height="10" rx="5" fill="${frac > 0.95 ? '#f59e0b' : '#22c55e'}"/>
    <text x="75" y="99" text-anchor="middle" font-size="9" fill="#e2e8f0">${fx(frac * 100, 0)} % ${esc(L('of capacity needed', 'من السعة مطلوبة'))}</text></g>`;
  return `<svg class="adv-svg" viewBox="0 0 400 170" style="direction:ltr;max-width:460px;margin:auto"><defs><linearGradient id="tlBatG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#475569"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs>
    ${bat(24)}${bat(226)}
    <path d="M165 36 H 198 Q205 36 205 30 V 22 H 247" fill="none" stroke="#0f172a" stroke-width="3"/>
    <text x="200" y="160" text-anchor="middle" font-size="12" font-weight="700" fill="#0f766e">2 × 12 V ${c.pick} Ah = 24 V · ${esc(L('required', 'المطلوب'))} ${fx(c.required, 1)} Ah</text></svg>`;
}

function batScenario(seed) {
  const R = rng(seed);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const voice = R() < 0.4;
  const cd = K.CANDELA[ri(0, 3)];
  const items = [
    { name: L('FACP (main board, display, loop card)', 'لوحة الإنذار (اللوحة الرئيسية والشاشة وبطاقة الحلقة)'), qty: 1, standby: 180, alarm: 450 },
    { name: L('Smoke detectors', 'كواشف دخان'), qty: ri(40, 140), standby: 0.3, alarm: 0.3 },
    { name: L('Heat detectors', 'كواشف حرارة'), qty: ri(4, 20), standby: 0.3, alarm: 0.3 },
    { name: L('Manual call points', 'أزرار إنذار يدوية'), qty: ri(6, 16), standby: 0.25, alarm: 0.25 },
    { name: L('Monitor / control modules', 'وحدات مراقبة / تحكم'), qty: ri(6, 18), standby: 0.4, alarm: 6 },
    { name: L(`Horn/strobes ${cd.cd} cd`, `أبواق/ومّاضات ${cd.cd} cd`), qty: ri(10, 30), standby: 0, alarm: cd.mA },
    { name: L('Communicator (DACT)', 'جهاز الاتصال (DACT)'), qty: 1, standby: 35, alarm: 70 },
  ];
  if (voice) items.push({ name: L('Voice evacuation amplifier', 'مضخم الإخلاء الصوتي'), qty: 1, standby: 90, alarm: 3200 });
  const alarmMin = voice ? 15 : 5;
  const c = K.batterySizing(items, { alarmMin, margin: 0.2 });
  return { items, voice, alarmMin, c };
}

function batTask(el, ctx) {
  let seed = store.get('tools.batSeed', 7);
  function draw(result) {
    const sc = batScenario(seed);
    el.innerHTML = `<h3>🎯 ${L('GRADED TASK — SIZE THE BATTERY FOR THIS BUILDING', 'مهمة مُقيَّمة — حدّد سعة البطارية لهذا المبنى')}<span class="r"><button class="btn sm" id="btNew">🎲 ${L('New building', 'مبنى جديد')}</button></span></h3>
      <p class="muted">${L(`Standby 24 h, alarm ${sc.alarmMin} min${sc.voice ? ' (voice EVAC)' : ''}, 20 % margin. Calculate and pick the battery.`, `استعداد 24 ساعة، إنذار ${sc.alarmMin} دقيقة${sc.voice ? ' (إخلاء صوتي)' : ''}، هامش 20%. احسب واختر البطارية.`)}</p>
      <div class="adv-grid c2"><div class="adv-scroll" style="max-height:none"><table class="adv-table"><thead><tr><th>${L('Item', 'البند')}</th><th class="num">${L('Qty', 'العدد')}</th><th class="num">${L('Standby mA', 'استعداد mA')}</th><th class="num">${L('Alarm mA', 'إنذار mA')}</th></tr></thead>
      <tbody>${sc.items.map((i) => `<tr><td>${esc(i.name)}</td><td class="num">${i.qty}</td><td class="num">${i.standby}</td><td class="num">${i.alarm}</td></tr>`).join('')}</tbody></table></div>
      <div><div class="adv-form">
        ${fld('bqS', L('Total standby current', 'إجمالي تيار الاستعداد'), '', 'A', '0.001')}
        ${fld('bqA', L('Total alarm current', 'إجمالي تيار الإنذار'), '', 'A', '0.001')}
        ${fld('bqR', L('Required capacity (+20 %)', 'السعة المطلوبة (+20%)'), '', 'Ah', '0.01')}
        <label class="adv-field">${L('Battery to install', 'البطارية المركّبة')}<select id="bqP"><option value="">—</option>${K.BATTERY_SIZES.map((s) => `<option value="${s}">2 × 12 V ${s} Ah</option>`).join('')}</select></label>
      </div><div class="adv-btns" style="margin-top:10px"><button class="btn primary" id="bqGo">✔ ${L('Check my answer', 'تحقق من إجابتي')}</button></div>
      <div id="bqRes">${result || ''}</div></div></div>`;
    el.querySelector('#btNew').onclick = () => { seed = (seed * 7 + 13) % 100000; store.set('tools.batSeed', seed); draw(); };
    el.querySelector('#bqGo').onclick = () => {
      const v = (id) => parseFloat(el.querySelector('#' + id).value);
      const c = sc.c;
      const parts = [
        [within(v('bqS'), c.standbyA, 0.03), L('Standby current', 'تيار الاستعداد'), `${fx(c.standbyA, 3)} A`],
        [within(v('bqA'), c.alarmA, 0.03), L('Alarm current', 'تيار الإنذار'), `${fx(c.alarmA, 3)} A`],
        [within(v('bqR'), c.required, 0.03), L('Required capacity', 'السعة المطلوبة'), `${fx(c.required, 2)} Ah`],
        [+el.querySelector('#bqP').value === c.pick, L('Battery selected', 'البطارية المختارة'), `${c.pick} Ah`],
      ];
      const score = parts.filter((p) => p[0]).length * 25;
      award(ctx, 'battery', score);
      el.querySelector('#bqRes').innerHTML = scoreBanner(score, `<b>${L('Battery sizing', 'تحديد سعة البطارية')}</b> — ${score >= 80 ? L('well done, ready for the plan review.', 'أحسنت، جاهز لمراجعة المخططات.') : L('check the worked solution below.', 'راجع الحل أدناه.')}`) +
        `<div class="adv-findings">${parts.map(([ok, k, sol]) => `<div class="adv-finding ${ok ? 'ok' : 'error'}"><span class="ic">${ok ? '✅' : '❌'}</span><div>${esc(k)} — ${L('correct value', 'القيمة الصحيحة')}: ${n(sol)}</div></div>`).join('')}
        <div class="adv-note">(${fx(c.standbyA, 3)} × 24 + ${fx(c.alarmA, 3)} × ${sc.alarmMin}/60) × 1.2 = ${n(fx(c.required, 2) + ' Ah')} → ${n(c.pick + ' Ah')}</div></div>`;
    };
  }
  draw();
}

// ═════════════════════════════════════════ 3. NAC VOLTAGE DROP
const NAC_DEF = { wire: 'awg16', length: 110, n: 12, cd: 75, mA: 197, vs: 20.4, vmin: 16, eol: 4700, maxA: 3, method: 'dist' };
function renderNac(body, ctx) {
  const st = { ...NAC_DEF, ...store.get('tools.nac', {}) };
  const save = () => store.set('tools.nac', st);
  let chart = null;
  body.innerHTML = `
  <div class="adv-grid tl-nac-top">
    <div class="card"><h3>${L('CIRCUIT DATA — CLASS B NAC', 'بيانات الدائرة — دائرة تنبيه من الفئة B')}</h3>
      <div class="adv-form">
        <label class="adv-field">${L('Conductor size', 'مقطع الموصل')}<select id="ncW">${K.WIRES.map((w) => `<option value="${w.key}" ${w.key === st.wire ? 'selected' : ''}>${w.en} — ${w.r} Ω/km</option>`).join('')}</select></label>
        <label class="adv-field">${L('Strobe setting', 'شدة الوميض')}<select id="ncCd">${K.CANDELA.map((c) => `<option value="${c.cd}" ${c.cd === st.cd ? 'selected' : ''}>${c.cd} cd — ${c.mA} mA</option>`).join('')}</select></label>
        ${fld('ncMa', L('Current per appliance', 'تيار الجهاز الواحد'), st.mA, 'mA', '1')}
        <label class="adv-field">${L('Voltage at panel terminals', 'الجهد عند أطراف اللوحة')}<select id="ncVs">
          <option value="20.4" ${st.vs === 20.4 ? 'selected' : ''}>20.4 V — ${L('battery end-of-discharge (85 %)', 'نهاية تفريغ البطارية (85%)')}</option>
          <option value="24" ${st.vs === 24 ? 'selected' : ''}>24.0 V — ${L('nominal', 'اسمي')}</option>
          <option value="27.3" ${st.vs === 27.3 ? 'selected' : ''}>27.3 V — ${L('float charge', 'شحن عائم')}</option></select></label>
        ${fld('ncVm', L('Min. appliance voltage', 'أقل جهد للجهاز'), st.vmin, 'V', '0.1')}
        ${fld('ncMax', L('NAC circuit rating', 'تحمل دائرة التنبيه'), st.maxA, 'A', '0.1')}
      </div>
      <div class="adv-grid c2" style="margin-top:12px;gap:12px">
        <div class="adv-range"><div class="lbl"><span>${L('One-way circuit length', 'طول الدائرة (اتجاه واحد)')}</span><b id="ncLv">${st.length} m</b></div><input type="range" id="ncL" min="10" max="400" step="5" value="${st.length}"/></div>
        <div class="adv-range"><div class="lbl"><span>${L('Horn/strobes on the circuit', 'عدد الأبواق/الومّاضات')}</span><b id="ncNv">${st.n}</b></div><input type="range" id="ncN" min="1" max="30" step="1" value="${st.n}"/></div>
      </div>
      <div class="adv-btns" style="margin-top:10px"><span class="muted" style="font-size:.86em">${L('Method', 'الطريقة')}:</span>
        <button class="btn sm ${st.method === 'lumped' ? 'primary' : ''}" data-meth="lumped">${L('Lumped (all load at end)', 'مُجمّع (كل الحمل في النهاية)')}</button>
        <button class="btn sm ${st.method === 'dist' ? 'primary' : ''}" data-meth="dist">${L('Distributed (evenly spaced)', 'موزّع (تباعد متساوٍ)')}</button></div>
    </div>
    <div class="card"><h3>${L('RESULT', 'النتيجة')}</h3><div id="ncVerdict"></div><div class="adv-stats" id="ncStats" style="margin-top:10px"></div></div>
  </div>
  <div class="card"><h3>${L('CIRCUIT SCHEMATIC — VOLTAGE AT EACH APPLIANCE', 'مخطط الدائرة — الجهد عند كل جهاز')}</h3><div id="ncSch"></div></div>
  <div class="adv-grid c2">
    <div class="card"><h3>${L('VOLTAGE PROFILE ALONG THE CIRCUIT', 'منحنى الجهد على طول الدائرة')}</h3><div class="tl-chart"><canvas id="ncChart"></canvas></div></div>
    <div class="card"><h3>${L('CONDUCTOR COMPARISON', 'مقارنة مقاطع الموصلات')}</h3><div id="ncCmp"></div></div>
  </div>
  <div class="card tl-task" id="ncTask"></div>`;
  const $ = (id) => body.querySelector('#' + id);
  const params = () => ({ wireKey: st.wire, length: st.length, n: st.n, mA: st.mA, vs: st.vs, vmin: st.vmin, eol: st.eol, maxA: st.maxA });

  function update() {
    const r = K.nacDrop(params());
    const vEnd = st.method === 'lumped' ? r.vLumped : r.vDist;
    const pass = (st.method === 'lumped' ? r.passLumped : r.passDist) && r.currentOk;
    const mw = K.minWire(params(), st.method);
    const mwName = mw ? K.wire(mw).en : L('none — split the circuit', 'لا يوجد — قسّم الدائرة');
    $('ncVerdict').innerHTML = `<div class="adv-callout ${pass ? '' : 'bad'}"><div class="tl-vbig">${pill(pass)}</div>
      ${L('End-of-line voltage', 'الجهد في نهاية الخط')} <b>${num(vEnd, 2, 'V')}</b> ${vEnd >= st.vmin ? '≥' : '<'} ${num(st.vmin, 1, 'V')} (${L('UL 1971 regulated 24 V appliances operate 16–33 V', 'أجهزة UL 1971 المنظّمة 24 فولت تعمل بين 16 و33 فولت')}).
      ${!r.currentOk ? `<br>⚠ ${L('Circuit current exceeds the NAC rating — split the load over two circuits.', 'تيار الدائرة يتجاوز تحمّل دائرة التنبيه — وزّع الحمل على دائرتين.')}` : ''}
      <br>💡 ${L('Smallest conductor that passes', 'أصغر مقطع يحقق الشرط')}: <b>${esc(mwName)}</b></div>`;
    $('ncStats').innerHTML = [
      stat(L('Circuit current', 'تيار الدائرة'), fx(r.I, 3), 'A', r.currentOk ? '' : 'alarm'),
      stat(L('Loop resistance 2·L·r', 'مقاومة الحلقة 2·L·r'), fx(r.Rloop, 2), 'Ω'),
      stat(L('V end — lumped', 'الجهد النهائي — مُجمّع'), fx(r.vLumped, 2), 'V', r.passLumped ? 'ok' : 'alarm'),
      stat(L('V end — distributed', 'الجهد النهائي — موزّع'), fx(r.vDist, 2), 'V', r.passDist ? 'ok' : 'alarm'),
      stat(L('Voltage drop', 'هبوط الجهد'), fx(((st.vs - vEnd) / st.vs) * 100, 1), '%'),
      stat(L('EOL supervisory current', 'تيار مقاومة نهاية الخط'), fx(r.iEol * 1000, 1), 'mA'),
    ].join('');
    $('ncSch').innerHTML = nacSchematic(st, r);
    $('ncCmp').innerHTML = `<table class="adv-table"><thead><tr><th>${L('Conductor', 'الموصل')}</th><th class="num">Ω/km</th><th class="num">R<sub>loop</sub> Ω</th><th class="num">V ${L('lumped', 'مُجمّع')}</th><th class="num">V ${L('distrib.', 'موزّع')}</th><th></th></tr></thead><tbody>
      ${K.WIRES.map((w) => { const x = K.nacDrop({ ...params(), wireKey: w.key }); const ok = st.method === 'lumped' ? x.passLumped : x.passDist; return `<tr class="${w.key === mw ? 'tl-best' : ''} ${w.key === st.wire ? 'tl-cur' : ''}"><td>${w.en}${w.key === mw ? ` <span class="adv-pill info">${L('min.', 'الأدنى')}</span>` : ''}</td><td class="num">${w.r}</td><td class="num">${fx(x.Rloop, 2)}</td><td class="num">${fx(x.vLumped, 2)}</td><td class="num">${fx(x.vDist, 2)}</td><td>${pill(ok)}</td></tr>`; }).join('')}</tbody></table>
      <div class="adv-note" style="margin-top:8px">V<sub>end,lumped</sub> = V<sub>s</sub> − I·R<sub>loop</sub> &nbsp;·&nbsp; V<sub>end,dist</sub> = V<sub>s</sub> − I·R<sub>loop</sub>·(n+1)/(2n). ${L('Design with the panel at battery end-voltage (20.4 V) and the appliance UL maximum current.', 'صمّم على جهد نهاية تفريغ البطارية (20.4 فولت) وأقصى تيار مدرج للجهاز.')}</div>`;
    drawChart(r);
  }
  function drawChart(r) {
    if (chart) { chart.destroy(); chart = null; }
    const t = theme();
    const o = baseChartOpts(t);
    o.scales.x = axis(t, L('Distance from panel (m)', 'المسافة من اللوحة (م)'), { min: 0, max: st.length });
    o.scales.y = axis(t, L('Voltage (V)', 'الجهد (فولت)'), { suggestedMin: Math.min(st.vmin - 1, r.vLumped - 0.5), suggestedMax: st.vs + 0.5 });
    chart = new Chart($('ncChart'), {
      type: 'scatter',
      data: { datasets: [
        { label: L('Distributed (appliances)', 'موزّع (الأجهزة)'), data: r.profile.map((p) => ({ x: p.x, y: p.v })), showLine: true, borderColor: t.accent, backgroundColor: t.accent, pointRadius: 3.5, borderWidth: 2.2, tension: 0 },
        { label: L('Lumped (worst case)', 'مُجمّع (أسوأ حالة)'), data: [{ x: 0, y: st.vs }, { x: st.length, y: r.vLumped }], showLine: true, borderColor: t.warn, backgroundColor: t.warn, borderDash: [6, 4], pointRadius: 0, borderWidth: 2 },
        { label: L(`Minimum ${st.vmin} V`, `الحد الأدنى ${st.vmin} فولت`), data: [{ x: 0, y: st.vmin }, { x: st.length, y: st.vmin }], showLine: true, borderColor: t.alarm, backgroundColor: t.alarm, pointRadius: 0, borderWidth: 1.8 },
      ] },
      options: o,
    });
  }
  const set = (k, v) => { st[k] = v; save(); update(); };
  $('ncW').onchange = (e) => set('wire', e.target.value);
  $('ncCd').onchange = (e) => { const c = K.CANDELA.find((x) => x.cd === +e.target.value); st.cd = c.cd; $('ncMa').value = c.mA; set('mA', c.mA); };
  $('ncMa').oninput = (e) => { const v = parseFloat(e.target.value); if (v > 0) set('mA', v); };
  $('ncVs').onchange = (e) => set('vs', +e.target.value);
  $('ncVm').oninput = (e) => { const v = parseFloat(e.target.value); if (v > 0) set('vmin', v); };
  $('ncMax').oninput = (e) => { const v = parseFloat(e.target.value); if (v > 0) set('maxA', v); };
  $('ncL').oninput = (e) => { $('ncLv').textContent = `${e.target.value} m`; set('length', +e.target.value); };
  $('ncN').oninput = (e) => { $('ncNv').textContent = e.target.value; set('n', +e.target.value); };
  body.querySelectorAll('[data-meth]').forEach((b) => { b.onclick = () => { body.querySelectorAll('[data-meth]').forEach((x) => x.classList.toggle('primary', x === b)); set('method', b.dataset.meth); }; });
  update();
  nacTask($('ncTask'), ctx);
  return () => { if (chart) chart.destroy(); chart = null; };
}

function nacSchematic(st, r) {
  const W = 1100, H = 190, x0 = 150, x1 = W - 90;
  const nDev = st.n;
  const step = (x1 - x0) / nDev;
  const col = (v) => (v >= st.vmin + 1.5 ? '#16a34a' : v >= st.vmin ? '#d97706' : '#dc2626');
  const every = nDev <= 12 ? 1 : Math.ceil(nDev / 10);
  let g = `<rect x="16" y="40" width="104" height="112" rx="8" fill="#e5e7eb" stroke="#475569" stroke-width="1.5"/><rect x="26" y="50" width="84" height="26" rx="3" fill="#0f172a"/><text x="68" y="67" text-anchor="middle" font-size="11" fill="#86efac" font-family="Consolas,monospace">${fx(st.vs, 1)} V</text>
    <text x="68" y="96" text-anchor="middle" font-size="12" font-weight="800" fill="#0f172a">FACP</text><text x="68" y="112" text-anchor="middle" font-size="10" fill="#475569">NAC1</text>
    <circle cx="120" cy="80" r="4" fill="#dc2626"/><circle cx="120" cy="120" r="4" fill="#111"/><text x="126" y="72" font-size="10" fill="#dc2626">+</text><text x="126" y="136" font-size="10">−</text>`;
  g += `<line x1="120" y1="80" x2="${x1 + 20}" y2="80" stroke="#dc2626" stroke-width="2.4"/><line x1="120" y1="120" x2="${x1 + 20}" y2="120" stroke="#111" stroke-width="2.4"/>`;
  g += `<line class="tl-flow" x1="120" y1="80" x2="${x1 + 20}" y2="80" stroke="#fff" stroke-width="1" stroke-dasharray="3 12" opacity=".8"/>`;
  for (let j = 1; j <= nDev; j++) {
    const x = x0 + (j - 0.5) * step;
    const v = r.profile[j].v;
    const w = Math.min(34, step * 0.8);
    g += `<line x1="${x}" y1="80" x2="${x}" y2="90" stroke="#dc2626" stroke-width="1.5"/><line x1="${x}" y1="110" x2="${x}" y2="120" stroke="#111" stroke-width="1.5"/>
      <rect x="${x - w / 2}" y="88" width="${w}" height="24" rx="3" fill="#fff" stroke="${col(v)}" stroke-width="2"/>
      <path d="M${x - w / 2 + 4} 96 l5 -3 v12 l-5 -3z" fill="#dc2626"/>${w > 20 ? `<text x="${x + 4}" y="104" font-size="8.5" text-anchor="middle" font-weight="700" fill="#0f172a">HS</text>` : ''}
      <circle cx="${x + w / 2 - 4}" cy="92" r="2.3" fill="#fde047"><animate attributeName="opacity" values="1;0;1" dur="1s" begin="${(j % 5) * 0.1}s" repeatCount="indefinite"/></circle>`;
    if (j % every === 0 || j === nDev) g += `<text x="${x}" y="146" text-anchor="middle" font-size="10.5" font-weight="700" fill="${col(v)}" font-family="Consolas,monospace">${fx(v, 2)}</text>`;
  }
  const xe = x1 + 20;
  g += `<path d="M${xe} 80 v8 l6 3 -12 5 12 5 -12 5 12 5 -6 3 v6" fill="none" stroke="#0f172a" stroke-width="1.8"/><line x1="${xe}" y1="120" x2="${xe}" y2="120" stroke="#111"/>
    <text x="${xe + 12}" y="98" font-size="10" font-weight="700" fill="#0f172a">EOL</text><text x="${xe + 12}" y="111" font-size="9.5" fill="#475569">${fx(st.eol / 1000, 1)} kΩ</text>`;
  g += `<text x="${(x0 + x1) / 2}" y="30" text-anchor="middle" font-size="11" fill="#334155">${esc(K.wire(st.wire).en)} · ${st.length} m ${esc(L('one way', 'اتجاه واحد'))} · ${st.n} × ${st.mA} mA · I = ${fx(r.I, 3)} A</text>
    <text x="${(x0 + x1) / 2}" y="172" text-anchor="middle" font-size="10" fill="#64748b">${esc(L('Appliance terminal voltage (distributed model), V', 'جهد أطراف الجهاز (النموذج الموزّع)، فولت'))}</text>`;
  return `<svg class="adv-svg" viewBox="0 0 ${W} ${H}" style="direction:ltr;background:#fbfcfe">${g}</svg>`;
}

function nacScenario(seed) {
  const R = rng(seed);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const cd = K.CANDELA[ri(1, 3)];
  const p = { length: ri(8, 44) * 5, n: ri(6, 18), mA: cd.mA, vs: 20.4, vmin: 16, eol: 4700 };
  return { ...p, cd: cd.cd, ans: K.minWire(p, 'lumped') };
}
function nacTask(el, ctx) {
  let seed = store.get('tools.nacSeed', 11);
  function draw() {
    let sc = nacScenario(seed); let guard = 0;
    while (!sc.ans && guard++ < 20) { seed += 1; sc = nacScenario(seed); }
    el.innerHTML = `<h3>🎯 ${L('GRADED TASK — FIND THE SMALLEST CONDUCTOR THAT PASSES', 'مهمة مُقيَّمة — أوجد أصغر مقطع موصل يحقق الشرط')}<span class="r"><button class="btn sm" id="nqNew">🎲 ${L('New circuit', 'دائرة جديدة')}</button></span></h3>
      <p class="muted">${L(`Class B NAC, ${sc.n} horn/strobes at ${sc.cd} cd (${sc.mA} mA each), ${sc.length} m one-way, panel at 20.4 V (battery end-voltage), EOL 4.7 kΩ. Use the LUMPED method and a 16 V minimum. Use the resistance table above.`, `دائرة تنبيه فئة B، ${sc.n} بوق/ومّاض بشدة ${sc.cd} cd (${sc.mA} mA لكل منها)، الطول ${sc.length} م باتجاه واحد، اللوحة عند 20.4 فولت (جهد نهاية التفريغ)، مقاومة نهاية الخط 4.7 كيلو أوم. استخدم الطريقة المُجمّعة وحد أدنى 16 فولت، ومقاومات الجدول أعلاه.`)}</p>
      <div class="adv-form">
        <label class="adv-field">${L('Smallest conductor that passes', 'أصغر موصل يحقق الشرط')}<select id="nqW"><option value="">—</option>${K.WIRES.map((w) => `<option value="${w.key}">${w.en}</option>`).join('')}</select></label>
        ${fld('nqV', L('End-of-line voltage with it', 'الجهد في نهاية الخط معه'), '', 'V', '0.01')}
      </div>
      <div class="adv-btns" style="margin-top:10px"><button class="btn primary" id="nqGo">✔ ${L('Check my answer', 'تحقق من إجابتي')}</button></div><div id="nqRes"></div>`;
    el.querySelector('#nqNew').onclick = () => { seed = (seed * 5 + 17) % 100000; store.set('tools.nacSeed', seed); draw(); };
    el.querySelector('#nqGo').onclick = () => {
      const w = el.querySelector('#nqW').value; const v = parseFloat(el.querySelector('#nqV').value);
      const ref = K.nacDrop({ ...sc, wireKey: sc.ans });
      const okW = w === sc.ans; const okV = Number.isFinite(v) && Math.abs(v - ref.vLumped) <= 0.15;
      const score = (okW ? 60 : 0) + (okV ? 40 : 0);
      award(ctx, 'nac-voltage-drop', score);
      el.querySelector('#nqRes').innerHTML = scoreBanner(score, `<b>${L('NAC voltage drop', 'هبوط جهد دائرة التنبيه')}</b>`) + `<div class="adv-findings">
        <div class="adv-finding ${okW ? 'ok' : 'error'}"><span class="ic">${okW ? '✅' : '❌'}</span><div>${L('Smallest passing conductor', 'أصغر موصل مقبول')}: <b>${K.wire(sc.ans).en}</b></div></div>
        <div class="adv-finding ${okV ? 'ok' : 'error'}"><span class="ic">${okV ? '✅' : '❌'}</span><div>V<sub>end</sub> = 20.4 − (${sc.n}×${fx(sc.mA / 1000, 3)} + ${fx(ref.iEol, 4)}) × 2 × ${fx(K.wire(sc.ans).r / 1000, 4)} × ${sc.length} = <b>${num(ref.vLumped, 2, 'V')}</b></div></div></div>`;
    };
  }
  draw();
}

// ═════════════════════════════════════════ 4. SLC
const SLC_DEF = { cable: 'mm1.5', auto: true, length: 600, pf: 150, loopV: 24, vmin: 17, maxR: 40, maxC: 0.5, maxA: 0.5, maxBetween: 32 };
const TYPE_COL = { smoke: '#2563eb', heat: '#ea580c', multi: '#7c3aed', mcp: '#dc2626', flow: '#0891b2', tamper: '#ca8a04', relay: '#16a34a', iso: '#0f172a' };
function renderSlc(body, ctx) {
  const sys = ctx.sys;
  const st = { ...SLC_DEF, ...store.get('tools.slc', {}) };
  const save = () => store.set('tools.slc', st);
  body.innerHTML = `
  <div class="adv-stats" id="slStats"></div>
  <div class="tl-cols">
    <div class="tl-col">
    <div class="card"><h3>${L('ADDRESS MAP — LOOP 1 (001–159)', 'خريطة العناوين — الحلقة 1 (001–159)')}</h3><div id="slMap"></div>
      <div class="adv-legend">${Object.keys(TYPE_COL).map((t) => `<span><i style="background:${TYPE_COL[t]}"></i>${esc(tr(DEVICE_TYPES[t].name))}</span>`).join('')}<span><i style="background:repeating-linear-gradient(45deg,#dc2626 0 3px,#fff 3px 6px)"></i>${L('Duplicate', 'مكرر')}</span></div></div>
    <div class="card"><h3>${L('CABLE & PANEL LIMITS', 'الكابل وحدود اللوحة')}</h3>
      <div class="adv-form">
        <label class="adv-field">${L('Loop cable', 'كابل الحلقة')}<select id="slCab">${K.WIRES.map((w) => `<option value="${w.key}" ${w.key === st.cable ? 'selected' : ''}>${w.en} — ${w.r} Ω/km</option>`).join('')}</select></label>
        <label class="adv-field">${L('Loop length source', 'مصدر طول الحلقة')}<select id="slAuto"><option value="1" ${st.auto ? 'selected' : ''}>${L('Auto — from the floor plans', 'تلقائي — من مخططات الطوابق')}</option><option value="0" ${!st.auto ? 'selected' : ''}>${L('Manual', 'يدوي')}</option></select></label>
        ${fld('slLen', L('Loop length (out + return)', 'طول الحلقة (ذهاب + عودة)'), st.length, 'm', '10')}
        ${fld('slPf', L('Cable capacitance', 'سعة الكابل'), st.pf, 'pF/m', '5')}
        ${fld('slV', L('Loop voltage', 'جهد الحلقة'), st.loopV, 'V', '0.5')}
        ${fld('slVm', L('Min. device voltage', 'أقل جهد للجهاز'), st.vmin, 'V', '0.5')}
        ${fld('slR', L('Max. loop resistance', 'أقصى مقاومة للحلقة'), st.maxR, 'Ω', '1')}
        ${fld('slC', L('Max. loop capacitance', 'أقصى سعة للحلقة'), st.maxC, 'µF', '0.05')}
        ${fld('slA', L('Max. loop current', 'أقصى تيار للحلقة'), st.maxA, 'A', '0.05')}
        ${fld('slB', L('Max. devices between isolators', 'أقصى عدد أجهزة بين عازلين'), st.maxBetween, '', '1')}
      </div>
      <div class="adv-note" style="margin-top:10px">${L('Limits are typical addressable-panel data-sheet values — use the listed values for the actual panel. Resistance is for both conductors of the whole loop; in Class A the far end is fed from one side when the loop is open, so the full-length drop is checked.', 'الحدود قيم نموذجية من نشرات اللوحات المعنونة — استخدم القيم المدرجة للوحة الفعلية. المقاومة لموصلَي الحلقة كاملة؛ في الفئة A تُغذّى النهاية البعيدة من جهة واحدة عند انقطاع الحلقة، لذلك يُفحص الهبوط على كامل الطول.')}</div></div>
    </div>
    <div class="tl-col">
    <div class="card"><h3>${L('ISOLATOR SEGMENTS (devices lost by one short circuit)', 'مقاطع العوازل (الأجهزة المفقودة عند قصر واحد)')}</h3><div id="slIso"></div></div>
    <div class="card"><h3>${L('COMPLIANCE CHECK', 'فحص المطابقة')}</h3><div id="slFind" class="adv-findings"></div></div>
    </div>
  </div>`;
  const $ = (id) => body.querySelector('#' + id);

  function update() {
    const ordered = sys.loopNodes();
    const devs = ordered.map((d) => ({ ...DEVICE_TYPES[d.type], type: d.type }));
    const auto = K.loopRouteLength(ordered, { panel: PANEL_POS, riser: RISER_POS });
    if (st.auto) { st.length = Math.round(auto); $('slLen').value = st.length; }
    $('slLen').disabled = st.auto;
    const c = K.slcCheck({ devices: devs, length: st.length, rPerKm: K.wire(st.cable).r, pfPerM: st.pf, loopV: st.loopV, vMinDev: st.vmin, maxR: st.maxR, maxC: st.maxC, maxA: st.maxA, maxBetween: st.maxBetween });
    const addrCount = {}; for (const d of ordered) addrCount[d.addr] = (addrCount[d.addr] || 0) + 1;
    const dups = Object.keys(addrCount).filter((a) => addrCount[a] > 1);
    const over = ordered.filter((d) => d.addr > 159);
    const segs = K.isolatorSegments(ordered);
    const worst = Math.max(...segs.map((s) => s.length));
    const floorsNoIso = FLOORS.filter((f) => !ordered.some((d) => d.floor === f.id && d.type === 'iso'));
    const cls = sys.loopClass;
    $('slStats').innerHTML = [
      stat(L('Devices on loop', 'الأجهزة على الحلقة'), ordered.length),
      stat(L('Addresses used', 'العناوين المستخدمة'), `${Object.keys(addrCount).length}/159`, '', dups.length ? 'alarm' : ''),
      stat(L('Pathway class', 'فئة المسار'), cls, '', cls === 'A' ? 'ok' : 'warn'),
      stat(L('Loop standby', 'تيار الاستعداد'), fx(c.iq * 1000, 1), 'mA'),
      stat(L('Loop alarm', 'تيار الإنذار'), fx(c.ia * 1000, 1), 'mA', c.aOk ? '' : 'alarm'),
      stat(L('Loop length', 'طول الحلقة'), fx(st.length, 0), 'm'),
      stat(L('Loop resistance', 'مقاومة الحلقة'), fx(c.R, 1), 'Ω', c.rOk ? 'ok' : 'alarm'),
      stat(L('Capacitance', 'السعة'), fx(c.Cuf, 3), 'µF', c.cOk ? 'ok' : 'alarm'),
      stat(L('Far-end voltage', 'جهد النهاية البعيدة'), fx(c.vFar, 1), 'V', c.vOk ? 'ok' : 'alarm'),
    ].join('');
    // address map
    const byAddr = {}; for (const d of ordered) (byAddr[d.addr] ||= []).push(d);
    let cells = '';
    for (let a = 1; a <= 159; a++) {
      const ds = byAddr[a];
      const tip = ds ? ds.map((d) => `${pad3(d.addr)} ${tr(d.label)} (${d.floor})`).join(' / ') : pad3(a);
      const style = !ds ? '' : ds.length > 1 ? 'background:repeating-linear-gradient(45deg,#dc2626 0 3px,#fff 3px 6px);color:#111' : `background:${TYPE_COL[ds[0].type]};color:#fff`;
      cells += `<span class="tl-cell ${ds ? 'on' : ''}" style="${style}" title="${esc(tip)}">${a}</span>`;
    }
    $('slMap').innerHTML = `<div class="tl-amap">${cells}</div>`;
    // isolator segments
    const labels = segs.map((s, i) => (i === 0 ? L('Panel OUT → ISO 1', 'مخرج اللوحة ← عازل 1') : i === segs.length - 1 ? L(`ISO ${i} → Panel IN`, `عازل ${i} ← مدخل اللوحة`) : L(`ISO ${i} → ISO ${i + 1}`, `عازل ${i} ← عازل ${i + 1}`)));
    const floorsOf = (s) => [...new Set(s.map((d) => d.floor))].join('/') || '—';
    const mx = Math.max(st.maxBetween * 1.15, worst + 2);
    const rowH = 30, W = 560, lx = 150;
    let g = '';
    segs.forEach((s, i) => {
      const y = 10 + i * rowH; const w = (s.length / mx) * (W - lx - 60); const ok = s.length <= st.maxBetween;
      g += `<text x="${lx - 8}" y="${y + 15}" text-anchor="end" font-size="11" class="tl-svgt">${esc(labels[i])}</text>
        <rect x="${lx}" y="${y + 3}" width="${Math.max(2, w)}" height="18" rx="4" fill="${ok ? '#0f9d8f' : '#dc2626'}" opacity=".9"/>
        <text x="${lx + w + 6}" y="${y + 16}" font-size="11" font-weight="700" class="tl-svgt">${s.length} <tspan font-weight="400" opacity=".7">· ${esc(L('floor', 'طابق'))} ${floorsOf(s)}</tspan></text>`;
    });
    const lim = lx + (st.maxBetween / mx) * (W - lx - 60);
    const Hh = 20 + segs.length * rowH;
    g += `<line x1="${lim}" y1="4" x2="${lim}" y2="${Hh - 4}" stroke="#dc2626" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${lim + 4}" y="${Hh + 8}" font-size="10" fill="#dc2626">${esc(L('limit', 'الحد'))} ${st.maxBetween}</text>`;
    $('slIso').innerHTML = `<svg class="adv-svg" viewBox="0 0 ${W} ${Hh + 14}" style="direction:ltr">${g}</svg>`;
    // findings
    const F = [];
    const add = (lvl, text, ref) => F.push(`<div class="adv-finding ${lvl}"><span class="ic">${lvl === 'ok' ? '✅' : lvl === 'warn' ? '⚠️' : '❌'}</span><div>${text}</div><span class="ref">${ref}</span></div>`);
    add(ordered.length <= 159 && !over.length ? 'ok' : 'error', L(`${ordered.length} devices / 159 addresses (${fx(ordered.length / 1.59, 0)} % used — keep ≈ 20 % spare for future changes).`, `${ordered.length} جهاز / 159 عنواناً (${fx(ordered.length / 1.59, 0)}% مستخدم — احتفظ بنحو 20% احتياطي للتعديلات المستقبلية).`), L('Panel listing', 'اعتماد اللوحة'));
    add(dups.length ? 'error' : 'ok', dups.length ? L(`Duplicate addresses: ${dups.map((a) => pad3(a)).join(', ')} — both devices answer on the same address.`, `عناوين مكررة: ${dups.map((a) => pad3(a)).join('، ')} — جهازان يردان على العنوان نفسه.`) : L('No duplicate addresses.', 'لا توجد عناوين مكررة.'), L('Panel programming', 'برمجة اللوحة'));
    add(c.rOk ? 'ok' : 'error', L(`Loop resistance ${fx(c.R, 1)} Ω ≤ ${st.maxR} Ω (2 × ${fx(st.length, 0)} m × ${K.wire(st.cable).r} Ω/km).`, `مقاومة الحلقة ${fx(c.R, 1)} Ω ≤ ${st.maxR} Ω (2 × ${fx(st.length, 0)} م × ${K.wire(st.cable).r} Ω/كم).`).replace('≤', c.rOk ? '≤' : '>'), L('Panel data sheet', 'نشرة اللوحة'));
    add(c.cOk ? 'ok' : 'error', L(`Loop capacitance ${fx(c.Cuf, 3)} µF vs ${st.maxC} µF max.`, `سعة الحلقة ${fx(c.Cuf, 3)} µF مقابل حد أقصى ${st.maxC} µF.`), L('Panel data sheet', 'نشرة اللوحة'));
    add(c.aOk ? 'ok' : 'error', L(`Alarm loop current ${fx(c.ia * 1000, 0)} mA vs ${fx(st.maxA * 1000, 0)} mA max.`, `تيار الحلقة عند الإنذار ${fx(c.ia * 1000, 0)} mA مقابل حد أقصى ${fx(st.maxA * 1000, 0)} mA.`), L('Panel data sheet', 'نشرة اللوحة'));
    add(c.vOk ? 'ok' : 'error', L(`Worst-case far-end voltage ${fx(c.vFar, 1)} V (min. ${st.vmin} V) with the loop fed from one end.`, `أسوأ جهد في النهاية البعيدة ${fx(c.vFar, 1)} فولت (الحد الأدنى ${st.vmin}) مع تغذية الحلقة من طرف واحد.`), L('Panel data sheet', 'نشرة اللوحة'));
    add(worst <= st.maxBetween ? 'ok' : 'error', L(`Largest isolator segment: ${worst} devices (limit ${st.maxBetween}) — a single short circuit cannot disable more.`, `أكبر مقطع بين العوازل: ${worst} جهاز (الحد ${st.maxBetween}) — قصر واحد لا يعطّل أكثر من ذلك.`), 'EN 54-2 §12.5.2 / mfr.');
    add(floorsNoIso.length ? 'warn' : 'ok', floorsNoIso.length ? L(`No isolator on floor(s) ${floorsNoIso.map((f) => f.id).join(', ')} — a short there disables devices on other floors.`, `لا يوجد عازل في الطابق ${floorsNoIso.map((f) => f.id).join('، ')} — القصر هناك يعطّل أجهزة طوابق أخرى.`) : L('An isolator is installed at every floor entry — a wiring short is confined to one floor.', 'يوجد عازل عند مدخل كل طابق — القصر يبقى محصوراً في طابق واحد.'), 'NFPA 72 §12.3');
    add(cls === 'A' ? 'ok' : 'warn', cls === 'A' ? L('Class A loop: devices keep working through a single open; route the return path separately from the outgoing path.', 'حلقة فئة A: تستمر الأجهزة بالعمل مع انقطاع واحد؛ مدّد مسار العودة منفصلاً عن مسار الذهاب.') : L('Class B: a single open loses every device beyond the break — Class A is recommended for this building.', 'الفئة B: انقطاع واحد يفقد كل الأجهزة بعد نقطة القطع — يوصى بالفئة A لهذا المبنى.'), 'NFPA 72 §12.3.1');
    add('ok', L('Pathway survivability: the loop riser runs in a 2-h rated shaft (Level 2) — required for relocation / partial-evacuation voice systems.', 'قابلية بقاء المسار: يمر رايزر الحلقة في شافت مقاوم للحريق لساعتين (المستوى 2) — مطلوب لأنظمة الإخلاء الصوتي الجزئي.'), 'NFPA 72 §12.4');
    $('slFind').innerHTML = F.join('');
  }
  const bind = (id, key, parse = parseFloat) => { $(id).oninput = (e) => { const v = parse(e.target.value); if (Number.isFinite(v)) { st[key] = v; save(); update(); } }; };
  $('slCab').onchange = (e) => { st.cable = e.target.value; save(); update(); };
  $('slAuto').onchange = (e) => { st.auto = e.target.value === '1'; save(); update(); };
  bind('slLen', 'length'); bind('slPf', 'pf'); bind('slV', 'loopV'); bind('slVm', 'vmin'); bind('slR', 'maxR'); bind('slC', 'maxC'); bind('slA', 'maxA'); bind('slB', 'maxBetween');
  update();
  return null;
}

// ═════════════════════════════════════════ 5. RISER DIAGRAM
function renderRiser(body, ctx) {
  const sys = ctx.sys;
  const svg = riserSvg(sys);
  const cnt = {};
  for (const d of sys.devices) { (cnt[d.floor] ||= {})[d.type] = (cnt[d.floor][d.type] || 0) + 1; }
  const types = Object.keys(DEVICE_TYPES);
  body.innerHTML = `
  <div class="card"><h3>${L('FIRE ALARM RISER DIAGRAM — AUTO-GENERATED FROM THE PROJECT', 'مخطط رأسي لنظام الإنذار — يُولَّد تلقائياً من المشروع')}
    <span class="r adv-btns"><button class="btn sm" id="rsSvg">⬇ ${L('Download SVG', 'تنزيل SVG')}</button><button class="btn sm primary" id="rsPrint">🖨 ${L('Print / PDF (A3)', 'طباعة / PDF')}</button></span></h3>
    <div class="tl-riser">${svg}</div>
    <div class="adv-note" style="margin-top:8px">${L('The diagram redraws itself whenever devices are added, removed or re-addressed in any Smart Lab module (e.g. the installation lab), and when the loop class changes. "Drawn by" uses the student name entered on the Reports page.', 'يُعاد رسم المخطط تلقائياً عند إضافة الأجهزة أو حذفها أو تغيير عناوينها في أي وحدة من وحدات المختبر، وعند تغيير فئة الحلقة. خانة «رسم» تستخدم اسم الطالب المُدخل في صفحة التقارير.')}</div></div>
  <div class="card"><h3>${L('DEVICE SCHEDULE PER FLOOR', 'جدول الأجهزة لكل طابق')}</h3>
    <div class="adv-scroll" style="max-height:none"><table class="adv-table"><thead><tr><th>${L('Floor', 'الطابق')}</th>${types.map((t) => `<th class="num" title="${esc(tr(DEVICE_TYPES[t].name))}">${esc(tr(DEVICE_TYPES[t].name)).split(' ')[0]} <small>(${DEVICE_TYPES[t].sym})</small></th>`).join('')}<th class="num">${L('Horn/strobe', 'بوق/ومّاض')}</th><th class="num">${L('Total', 'الإجمالي')}</th></tr></thead>
    <tbody>${[...FLOORS].reverse().map((f) => `<tr><td><b>${esc(tr(f.name))}</b></td>${types.map((t) => `<td class="num">${cnt[f.id]?.[t] || '—'}</td>`).join('')}<td class="num">${sys.nacDevices.filter((x) => x.floor === f.id).length}</td><td class="num"><b>${Object.values(cnt[f.id] || {}).reduce((a, b) => a + b, 0) + sys.nacDevices.filter((x) => x.floor === f.id).length}</b></td></tr>`).join('')}</tbody></table></div></div>`;
  body.querySelector('#rsSvg').onclick = () => download('FA-RD-001-riser-diagram.svg', `<?xml version="1.0" encoding="UTF-8"?>\n${riserSvg(sys)}`, 'image/svg+xml');
  body.querySelector('#rsPrint').onclick = () => printDoc(`<style>@page{size:A3 landscape;margin:8mm}</style><div style="background:#fff;padding:6mm">${riserSvg(sys)}</div>`, 'FA-RD-001-riser-diagram.pdf');
  return null;
}

/** NFPA 170-style symbol for a device type, centred on (x, y). */
function sym(type, x, y, s = 30) {
  const h = s / 2;
  const txt = (t, fs = 12) => `<text x="${x}" y="${y + fs * 0.36}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#0f172a">${t}</text>`;
  const circ = (t) => `<circle cx="${x}" cy="${y}" r="${h}" fill="#fff" stroke="#0f172a" stroke-width="1.6"/>${txt(t, t.length > 1 ? 10 : 13)}`;
  const sq = (t, fill = '#fff') => `<rect x="${x - h}" y="${y - h}" width="${s}" height="${s}" fill="${fill}" stroke="#0f172a" stroke-width="1.6"/>${txt(t, t.length > 2 ? 9 : t.length > 1 ? 10.5 : 13)}`;
  switch (type) {
    case 'smoke': return circ('S');
    case 'heat': return circ('H');
    case 'multi': return circ('SH');
    case 'mcp': return `<rect x="${x - h}" y="${y - h}" width="${s}" height="${s}" fill="#fee2e2" stroke="#b91c1c" stroke-width="1.8"/>${txt('F', 13)}`;
    case 'flow': return sq('WF');
    case 'tamper': return sq('TS');
    case 'relay': return sq('CR');
    case 'iso': return `<rect x="${x - h}" y="${y - h}" width="${s}" height="${s}" fill="#fff" stroke="#0f172a" stroke-width="1.6"/><path d="M${x - h + 5} ${y + h - 5} L${x + h - 5} ${y - h + 5}" stroke="#0f172a" stroke-width="1.4"/>${`<text x="${x - 5}" y="${y - 3}" font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle">I</text>`}`;
    case 'hs': return `<rect x="${x - h}" y="${y - h}" width="${s}" height="${s}" fill="#fff" stroke="#b91c1c" stroke-width="1.6"/><path d="M${x - h + 4} ${y - 4} h5 l7 -6 v20 l-7 -6 h-5z" fill="#b91c1c"/><path d="M${x + 5} ${y - 8} l5 -3 M${x + 6} ${y} h6 M${x + 5} ${y + 8} l5 3" stroke="#f59e0b" stroke-width="1.8"/>`;
    case 'eol': return `<path d="M${x - 16} ${y} h6 l3 -6 4 12 4 -12 4 12 4 -12 3 6 h6" fill="none" stroke="#0f172a" stroke-width="1.6"/><text x="${x}" y="${y + 18}" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">EOL</text>`;
    default: return sq('?');
  }
}

function riserSvg(sys) {
  const W = 1500, H = 1000;
  const bands = { 2: 40, 1: 290, G: 540 }; const BH = 250;
  const X = { ret: 548, out: 566, n1: 590, n2: 610 };
  const shaft = [532, 626];
  const order = ['iso', 'flow', 'tamper', 'smoke', 'heat', 'multi', 'mcp', 'relay'];
  const col = { slc: '#1d4ed8', nac: '#dc2626', ac: '#0f172a', com: '#7c3aed', ctl: '#16a34a' };
  const nacCfg = { ...NAC_DEF, ...store.get('tools.nac', {}) };
  const bat = batCalc(sys, { ...BAT_DEF, ...store.get('tools.bat', {}) });
  const cls = sys.loopClass;
  const T = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 12}" ${o.anchor ? `text-anchor="${o.anchor}"` : ''} ${o.bold ? 'font-weight="700"' : ''} fill="${o.fill || '#0f172a'}" ${o.extra || ''}>${esc(t)}</text>`;
  const halo = (d, c, w, extra = '') => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w + 5}"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" ${extra}/>`;
  let g = '';
  // sheet frame
  g += `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="#fff" stroke="#0f172a" stroke-width="2.5"/><rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="#0f172a" stroke-width="0.8"/>`;
  // floor bands
  for (const f of FLOORS) {
    const y0 = bands[f.id];
    const devs = sys.devices.filter((d) => d.floor === f.id);
    const addrs = devs.map((d) => d.addr);
    g += `<rect x="20" y="${y0}" width="${W - 40}" height="${BH}" fill="${f.id === '1' ? '#f8fafc' : '#fff'}"/>`;
    g += `<line x1="20" y1="${y0 + BH}" x2="${W - 20}" y2="${y0 + BH}" stroke="#94a3b8" stroke-width="5"/><line x1="20" y1="${y0 + BH}" x2="${W - 20}" y2="${y0 + BH}" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="2 6"/>`;
    const lx = 262;
    g += T(lx, y0 + 26, tr(f.name).toUpperCase(), { fs: 15, bold: true });
    g += T(lx, y0 + 44, `FFL ${f.level ? '+' + (f.level * 4).toFixed(2) : '±0.00'} m · ${L('Zone', 'المنطقة')} Z${f.id}`, { fs: 11, fill: '#475569' });
    if (addrs.length) g += T(lx, y0 + 60, `${L('SLC addresses', 'عناوين الحلقة')} ${pad3(Math.min(...addrs))}–${pad3(Math.max(...addrs))} · ${devs.length} ${L('devices', 'جهاز')}`, { fs: 11, fill: '#475569' });
    // level marker triangle
    g += `<path d="M${lx - 16} ${y0 + 20} l7 -10 h-14z" fill="#0f172a"/>`;
  }
  // riser shaft
  g += `<rect x="${shaft[0]}" y="30" width="${shaft[1] - shaft[0]}" height="${bands.G + BH - 30}" fill="#fef9c3" opacity=".45" stroke="#a16207" stroke-dasharray="8 5" stroke-width="1.2"/>`;
  g += `<text x="${(shaft[0] + shaft[1]) / 2}" y="26" text-anchor="middle" font-size="10.5" font-weight="700" fill="#a16207">${esc(L('FIRE ALARM RISER (2-h SHAFT)', 'رايزر الإنذار (شافت ساعتين)'))}</text>`;

  // ─ per floor: SLC floor loop, NAC run
  const nacFloors = {}; for (const d of sys.nacDevices) (nacFloors[d.nac] ||= new Set()).add(d.floor);
  const lastFloorOf = (nac) => { const fl = [...(nacFloors[nac] || [])]; return fl.sort((a, b) => (a === 'G' ? 0 : +a) - (b === 'G' ? 0 : +b)).pop(); };
  const floorLoops = [];
  for (const f of FLOORS) {
    const y0 = bands[f.id];
    const ya = y0 + 52, yb = y0 + 96;
    const devs = sys.devices.filter((d) => d.floor === f.id);
    if (!devs.length) continue;
    const types = order.filter((t) => devs.some((d) => d.type === t));
    const x0 = 680, dx = Math.min(96, 620 / Math.max(1, types.length));
    let xe = x0;
    let row = '';
    types.forEach((t, i) => {
      const x = x0 + i * dx; xe = x;
      const c = devs.filter((d) => d.type === t).length;
      row += sym(t, x, yb, 28);
      row += T(x, yb + 32, `× ${c}`, { fs: 12, bold: true, anchor: 'middle' });
      if (t === 'relay') row += `<path d="M${x} ${yb - 14} V ${ya - 22} H ${x + 70}" fill="none" stroke="${col.ctl}" stroke-width="1.6" stroke-dasharray="5 3"/>`;
      if (t === 'flow' || t === 'tamper') row += `<line x1="${x}" y1="${yb + 40}" x2="${x}" y2="${yb + 52}" stroke="#0891b2" stroke-width="1.2"/>`;
    });
    // floor control valve feeding flow & tamper
    if (types.includes('flow')) {
      const xf = x0 + types.indexOf('flow') * dx, xt = types.includes('tamper') ? x0 + types.indexOf('tamper') * dx : xf;
      row += `<line x1="${xf - 24}" y1="${yb + 58}" x2="${xt + 30}" y2="${yb + 58}" stroke="#0891b2" stroke-width="4"/><polygon points="${(xf + xt) / 2 - 8},${yb + 52} ${(xf + xt) / 2 + 8},${yb + 64} ${(xf + xt) / 2 + 8},${yb + 52} ${(xf + xt) / 2 - 8},${yb + 64}" fill="#0891b2"/>`;
      row += T(xt + 36, yb + 62, L('Sprinkler floor control valve', 'صمام التحكم الطابقي للرشاشات'), { fs: 9.5, fill: '#0e7490' });
    }
    const turn = xe + 26;
    // AHU box
    if (types.includes('relay')) {
      const xr = x0 + types.indexOf('relay') * dx;
      row += `<rect x="${xr + 70}" y="${ya - 40}" width="150" height="34" rx="3" fill="#f0fdf4" stroke="${col.ctl}" stroke-width="1.4"/>` + T(xr + 145, ya - 26, `AHU-${f.id} / ${L('SMOKE DAMPER', 'خانق الدخان')}`, { fs: 10, bold: true, anchor: 'middle', fill: '#166534' }) + T(xr + 145, ya - 13, L('shutdown on alarm (NFPA 90A)', 'إيقاف عند الإنذار (NFPA 90A)'), { fs: 9, anchor: 'middle', fill: '#166534' });
    }
    // loop path: in from riser (out line) at yb, through devices, turn, back at ya
    const d = `M${X.out} ${yb} H ${turn} V ${ya} H ${X.out}`;
    g += halo(d, col.slc, 2.2);
    g += `<text x="${turn + 6}" y="${(ya + yb) / 2 + 4}" font-size="9.5" fill="${col.slc}" font-weight="700">SLC</text>`;
    g += row;
    floorLoops.push({ f, ya, yb });
    // NAC run
    const hs = sys.nacDevices.filter((x) => x.floor === f.id);
    if (hs.length) {
      const nac = hs[0].nac; const xr = nac === 'NAC2' ? X.n2 : X.n1;
      const yn = y0 + 190;
      const last = lastFloorOf(nac) === f.id;
      const xs = hs.map((_, i) => 700 + i * 120);
      const xEnd = xs[xs.length - 1] + 40;
      g += halo(`M${xr} ${yn} H ${xEnd}`, col.nac, 2);
      if (!last) g += halo(`M${xEnd} ${yn} V ${yn + 16} H ${xr}`, col.nac, 1.4, 'stroke-dasharray="6 4"');
      hs.forEach((_, i) => { g += sym('hs', xs[i], yn, 28) + T(xs[i], yn + 30, `${nacCfg.cd} cd`, { fs: 10, anchor: 'middle', fill: '#991b1b' }); });
      if (last) g += sym('eol', xEnd + 26, yn) + T(xEnd + 26, yn + 30, '4.7 kΩ', { fs: 9, anchor: 'middle', fill: '#475569' });
      g += `<rect x="${xr + 16}" y="${yn - 23}" width="44" height="16" rx="3" fill="#fee2e2"/>` + T(xr + 38, yn - 11, nac, { fs: 10, bold: true, anchor: 'middle', fill: '#991b1b' });
      g += T(xEnd + (last ? 50 : 10), yn + 4, last ? L(`Class B · end of ${nac}`, `فئة B · نهاية ${nac}`) : L(`${nac} continues to next floor`, `${nac} يستمر إلى الطابق التالي`), { fs: 9.5, fill: '#991b1b' });
    }
  }
  // riser verticals: SLC out between floors
  const gY = bands.G;
  const panelY = { in: gY + 160, out: gY + 180, n1: gY + 200, n2: gY + 220 };
  let segs = '';
  const loopsUp = [...floorLoops].sort((a, b) => b.yb - a.yb); // G first (largest y)
  let yFrom = panelY.out;
  for (const lp of loopsUp) { segs += `M${X.out} ${yFrom} V ${lp.yb} `; yFrom = lp.ya; }
  const topY = 36;
  // SLC return (Class A) or end (Class B)
  let ret = '';
  if (cls === 'A') { ret = `M${X.out} ${yFrom} V ${topY} H ${X.ret} V ${panelY.in}`; }
  g += `<path d="${segs}" fill="none" stroke="${col.slc}" stroke-width="2.6"/>`;
  if (ret) g += `<path d="${ret}" fill="none" stroke="${col.slc}" stroke-width="2.2" stroke-dasharray="10 5"/>`;
  g += `<text transform="translate(${X.out + 12},${bands[1] + 160}) rotate(-90)" font-size="10" font-weight="700" fill="${col.slc}">SLC OUT</text>`;
  if (cls === 'A') g += `<text transform="translate(${X.ret - 5},${bands[1] + 200}) rotate(-90)" font-size="10" font-weight="700" fill="${col.slc}">${esc(L('SLC RETURN (Class A)', 'عودة الحلقة (فئة A)'))}</text>`;
  // NAC risers
  for (const [nac, x, py] of [['NAC1', X.n1, panelY.n1], ['NAC2', X.n2, panelY.n2]]) {
    const fl = [...(nacFloors[nac] || [])]; if (!fl.length) continue;
    const top = Math.min(...fl.map((f) => bands[f] + 190));
    g += `<path d="M${x} ${py} V ${top}" fill="none" stroke="${col.nac}" stroke-width="2.2"/>`;
    g += `<text transform="translate(${x + 11},${top + 70}) rotate(-90)" font-size="9.5" font-weight="700" fill="${col.nac}">${nac}</text>`;
  }
  // panel connection stubs (drawn with halo so they read over the risers)
  const px1 = 470;
  g += halo(`M${px1} ${panelY.out} H ${X.out}`, col.slc, 2.4);
  if (cls === 'A') g += halo(`M${px1} ${panelY.in} H ${X.ret}`, col.slc, 2.2, 'stroke-dasharray="10 5"');
  if (nacFloors.NAC1) g += halo(`M${px1} ${panelY.n1} H ${X.n1}`, col.nac, 2.2);
  if (nacFloors.NAC2) g += halo(`M${px1} ${panelY.n2} H ${X.n2}`, col.nac, 2.2);
  g += T(px1 + 6, panelY.in - 4, 'SLC IN', { fs: 9, fill: col.slc }) + T(px1 + 6, panelY.out - 4, 'SLC OUT', { fs: 9, fill: col.slc }) + T(px1 + 6, panelY.n1 - 4, 'NAC1', { fs: 9, fill: col.nac }) + T(px1 + 6, panelY.n2 - 4, 'NAC2', { fs: 9, fill: col.nac });

  // FACP (ground floor, electrical room)
  const fx0 = 300, fy0 = gY + 76, fw = 170, fh = 152;
  g += `<rect x="${fx0 + 4}" y="${fy0 + 4}" width="${fw}" height="${fh}" rx="6" fill="#0f172a" opacity=".15"/>
    <rect x="${fx0}" y="${fy0}" width="${fw}" height="${fh}" rx="6" fill="url(#rsPanel)" stroke="#7f1d1d" stroke-width="2"/>
    <rect x="${fx0 + 14}" y="${fy0 + 14}" width="${fw - 28}" height="34" rx="3" fill="#0b1f14" stroke="#14532d"/>
    <text x="${fx0 + fw / 2}" y="${fy0 + 30}" text-anchor="middle" font-size="9" fill="#86efac" font-family="Consolas,monospace">SYSTEM NORMAL</text>
    <text x="${fx0 + fw / 2}" y="${fy0 + 42}" text-anchor="middle" font-size="8" fill="#4ade80" font-family="Consolas,monospace">${sys.devices.length} PTS · LOOP 1</text>
    ${['#dc2626', '#f59e0b', '#fde047', '#22c55e'].map((c, i) => `<circle cx="${fx0 + 26 + i * 20}" cy="${fy0 + 62}" r="4.5" fill="${c}" stroke="#0f172a" stroke-width=".8"/>`).join('')}
    <text x="${fx0 + fw / 2}" y="${fy0 + 90}" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">FACP</text>
    <text x="${fx0 + fw / 2}" y="${fy0 + 104}" text-anchor="middle" font-size="9" fill="#fecaca">${esc(L('Addressable · 1 loop · 2 NAC', 'معنونة · حلقة واحدة · دائرتا تنبيه'))}</text>
    <rect x="${fx0 + 14}" y="${fy0 + 110}" width="${fw - 28}" height="36" rx="3" fill="#1e293b" stroke="#334155"/>
    <rect x="${fx0 + 22}" y="${fy0 + 115}" width="56" height="26" rx="2" fill="#334155" stroke="#94a3b8"/><rect x="${fx0 + 92}" y="${fy0 + 115}" width="56" height="26" rx="2" fill="#334155" stroke="#94a3b8"/>
    <text x="${fx0 + 50}" y="${fy0 + 132}" text-anchor="middle" font-size="8.5" fill="#e2e8f0">12V ${bat.pick}Ah</text><text x="${fx0 + 120}" y="${fy0 + 132}" text-anchor="middle" font-size="8.5" fill="#e2e8f0">12V ${bat.pick}Ah</text>`;
  g += T(fx0 + fw / 2, fy0 + fh + 13, L(`FACP · electrical room · batt. 2×12 V ${bat.pick} Ah (24 h + ${bat.alarmMin} min)`, `اللوحة · غرفة الكهرباء · بطاريات 2×12 فولت ${bat.pick} Ah (24 س + ${bat.alarmMin} د)`), { fs: 9, anchor: 'middle', fill: '#475569' });
  // 230 V supply, DACT, BMS gateway
  const bx = 40, bw = 200;
  const box = (y, h, title, sub, c) => `<rect x="${bx}" y="${y}" width="${bw}" height="${h}" rx="4" fill="#fff" stroke="${c}" stroke-width="1.5"/>` + T(bx + 10, y + 16, title, { fs: 10.5, bold: true, fill: c }) + T(bx + 10, y + 30, sub, { fs: 9, fill: '#475569' });
  const yDb = gY + 190, yDa = gY + 78, yBm = gY + 134;
  g += box(yDb, 38, L('230 V AC DEDICATED CIRCUIT', 'دائرة 230 فولت مخصصة'), L('red, lockable breaker "FIRE ALARM"', 'قاطع أحمر قابل للقفل «إنذار حريق»'), col.ac);
  g += `<path d="M${bx + bw} ${yDb + 19} H ${fx0}" stroke="${col.ac}" stroke-width="2.4"/><path d="M${bx + bw + 44} ${yDb + 12} l6 7 -6 7" fill="none" stroke="${col.ac}" stroke-width="1.5"/>` + T(bx + bw + 4, yDb + 12, '230 V~', { fs: 9 });
  g += box(yDa, 38, L('DACT / DUAL-PATH COMM.', 'جهاز الاتصال مزدوج المسار'), L('IP + cellular → monitoring', 'IP + خلوي ← مركز المراقبة'), col.com);
  g += `<path d="M${bx + bw} ${yDa + 19} H ${fx0}" stroke="${col.com}" stroke-width="1.8"/>`;
  g += box(yBm, 38, L('BMS GATEWAY', 'بوابة إدارة المبنى'), 'BACnet/IP · Modbus TCP', col.com);
  g += `<path d="M${bx + bw} ${yBm + 19} H ${fx0}" stroke="${col.com}" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  // off-site monitoring & BMS head-end at left of floors 1/2
  const ms = bands[2] + 100, bm = bands[1] + 110;
  g += `<rect x="${bx}" y="${ms}" width="${bw}" height="52" rx="6" fill="#f5f3ff" stroke="${col.com}" stroke-width="1.5" stroke-dasharray="6 3"/>` + T(bx + bw / 2, ms + 20, L('SUPERVISING STATION', 'مركز المراقبة المعتمد'), { fs: 10.5, bold: true, anchor: 'middle', fill: col.com }) + T(bx + bw / 2, ms + 36, L('off-site · NFPA 72 §26.6', 'خارج الموقع · NFPA 72 §26.6'), { fs: 9, anchor: 'middle', fill: '#475569' });
  g += `<rect x="${bx}" y="${bm}" width="${bw}" height="52" rx="6" fill="#f5f3ff" stroke="${col.com}" stroke-width="1.5" stroke-dasharray="6 3"/>` + T(bx + bw / 2, bm + 20, L('BMS HEAD-END', 'الخادم الرئيسي لإدارة المبنى'), { fs: 10.5, bold: true, anchor: 'middle', fill: col.com }) + T(bx + bw / 2, bm + 36, L('monitoring only (no control)', 'مراقبة فقط (بدون تحكم)'), { fs: 9, anchor: 'middle', fill: '#475569' });
  g += `<path d="M${bx + 16} ${yDa} V ${ms + 52}" stroke="${col.com}" stroke-width="1.6"/><path d="M${bx + 26} ${yDa} V ${ms + 52}" stroke="${col.com}" stroke-width="1.6" stroke-dasharray="7 4"/>`;
  g += `<path d="M${bx + bw - 20} ${yBm} V ${bm + 52}" stroke="${col.com}" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  g += `<text transform="translate(${bx + 48},${bands[1] + 60}) rotate(-90)" font-size="9" fill="${col.com}">${esc(L('path 1 IP / path 2 cellular', 'مسار 1 IP / مسار 2 خلوي'))}</text>`;

  // legend
  const ly = 812;
  g += `<rect x="20" y="${ly}" width="600" height="172" fill="#fff" stroke="#0f172a" stroke-width="1"/>` + T(30, ly + 18, L('LEGEND (NFPA 170)', 'مفتاح الرموز (NFPA 170)'), { fs: 12, bold: true });
  const leg = [['smoke', L('Smoke detector', 'كاشف دخان')], ['heat', L('Heat detector', 'كاشف حرارة')], ['multi', L('Multi-sensor det.', 'كاشف متعدد')], ['mcp', L('Manual pull station', 'زر إنذار يدوي')], ['flow', L('Waterflow switch', 'مفتاح تدفق المياه')], ['tamper', L('Valve tamper switch', 'مفتاح عبث الصمام')], ['relay', L('Control module', 'وحدة تحكم')], ['iso', L('Short-circuit isolator', 'عازل دائرة القصر')], ['hs', L('Horn / strobe', 'بوق / ومّاض')], ['eol', L('End-of-line resistor', 'مقاومة نهاية الخط')]];
  leg.forEach(([t, name], i) => { const cx = 42 + (i % 4) * 148, cy = ly + 46 + Math.floor(i / 4) * 34; g += sym(t, cx, cy, 22) + T(cx + 18, cy + 4, name, { fs: 10 }); });
  const lines = [[col.slc, '', 'SLC'], [col.slc, '10 5', L('SLC return', 'عودة الحلقة')], [col.nac, '', 'NAC'], [col.com, '', L('Comms', 'اتصالات')], [col.ctl, '5 3', L('Control', 'تحكم')]];
  lines.forEach(([c, dash, name], i) => { const xx = 30 + i * 118, cy = ly + 156; g += `<line x1="${xx}" y1="${cy}" x2="${xx + 30}" y2="${cy}" stroke="${c}" stroke-width="2.4" ${dash ? `stroke-dasharray="${dash}"` : ''}/>` + T(xx + 36, cy + 4, name, { fs: 10 }); });
  // notes
  const nx = 630;
  g += `<rect x="${nx}" y="${ly}" width="400" height="172" fill="#fff" stroke="#0f172a" stroke-width="1"/>` + T(nx + 10, ly + 18, L('NOTES', 'ملاحظات'), { fs: 12, bold: true });
  const notes = [
    L(`SLC: Class ${cls}, 2c 1.5 mm² shielded FPLR; ${cls === 'A' ? 'return routed separately.' : 'single run.'}`, `الحلقة: فئة ${cls}، كابل 2×1.5 مم² مدرّع FPLR؛ ${cls === 'A' ? 'مسار العودة منفصل.' : 'مسار واحد.'}`),
    L(`NAC: Class B, 2c 2.5 mm² FPL, EOL 4.7 kΩ; strobes ${nacCfg.cd} cd.`, `دوائر التنبيه: فئة B، كابل 2×2.5 مم² FPL، نهاية خط 4.7 ك أوم؛ ومّاضات ${nacCfg.cd} cd.`),
    L('Isolator at every floor entry (short confined to one floor).', 'عازل عند مدخل كل طابق (القصر محصور في طابق).'),
    L(`Secondary supply: 24 h standby + ${bat.alarmMin} min alarm, +20 % (NFPA 72 §10.6.7).`, `المصدر الاحتياطي: 24 س استعداد + ${bat.alarmMin} د إنذار +20% (NFPA 72 §10.6.7).`),
    L('Riser cables in 2-h rated shaft — survivability Level 2 (§12.4).', 'كابلات الرايزر في شافت مقاوم لساعتين — المستوى 2 (§12.4).'),
    L('Addresses and quantities generated from the live project.', 'العناوين والكميات مولّدة من المشروع الحي.'),
  ];
  notes.forEach((t, i) => { g += T(nx + 12, ly + 40 + i * 21, `${i + 1}. ${t}`, { fs: 10 }); });
  // title block
  const tx = 1040, tw = W - 20 - tx;
  const row = (y, h, k, v, fs = 11) => `<line x1="${tx}" y1="${y}" x2="${tx + tw}" y2="${y}" stroke="#0f172a" stroke-width=".8"/>` + T(tx + 8, y + 13, k, { fs: 8.5, fill: '#64748b' }) + T(tx + 8, y + h - 6, v, { fs, bold: true });
  g += `<rect x="${tx}" y="${ly}" width="${tw}" height="172" fill="#fff" stroke="#0f172a" stroke-width="1.6"/>`;
  g += `<rect x="${tx}" y="${ly}" width="${tw}" height="30" fill="#7f1d1d"/>` + T(tx + 10, ly + 20, 'ASFAN Business Center', { fs: 14, bold: true, fill: '#fff' }) + T(tx + tw - 10, ly + 20, 'SMART SYSTEMS LAB', { fs: 9, fill: '#fecaca', anchor: 'end' });
  g += row(ly + 30, 36, L('DRAWING TITLE', 'عنوان المخطط'), L('FIRE ALARM SYSTEM — RISER DIAGRAM', 'نظام إنذار الحريق — المخطط الرأسي'), 12.5);
  const cols = [[L('DRAWING NO.', 'رقم المخطط'), 'FA-RD-001'], [L('REV.', 'المراجعة'), '0'], [L('SCALE', 'المقياس'), 'NTS'], [L('DATE', 'التاريخ'), today()]];
  const cw = tw / 4;
  g += `<line x1="${tx}" y1="${ly + 66}" x2="${tx + tw}" y2="${ly + 66}" stroke="#0f172a" stroke-width=".8"/>`;
  cols.forEach(([k, v], i) => { const x = tx + i * cw; if (i) g += `<line x1="${x}" y1="${ly + 66}" x2="${x}" y2="${ly + 102}" stroke="#0f172a" stroke-width=".8"/>`; g += T(x + 8, ly + 79, k, { fs: 8.5, fill: '#64748b' }) + T(x + 8, ly + 96, v, { fs: 11, bold: true }); });
  g += `<line x1="${tx}" y1="${ly + 102}" x2="${tx + tw}" y2="${ly + 102}" stroke="#0f172a" stroke-width=".8"/><line x1="${tx + tw / 2}" y1="${ly + 102}" x2="${tx + tw / 2}" y2="${ly + 138}" stroke="#0f172a" stroke-width=".8"/>`;
  g += T(tx + 8, ly + 115, L('DRAWN BY', 'رسم'), { fs: 8.5, fill: '#64748b' }) + T(tx + 8, ly + 132, student(), { fs: 11, bold: true });
  g += T(tx + tw / 2 + 8, ly + 115, L('CHECKED / APPROVED', 'تدقيق / اعتماد'), { fs: 8.5, fill: '#64748b' }) + T(tx + tw / 2 + 8, ly + 132, '—', { fs: 11, bold: true });
  g += `<line x1="${tx}" y1="${ly + 138}" x2="${tx + tw}" y2="${ly + 138}" stroke="#0f172a" stroke-width=".8"/>` + T(tx + 8, ly + 158, 'NFPA 72 (2022) · NFPA 170 · NFPA 13 · NFPA 90A', { fs: 10, fill: '#334155' });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="adv-svg tl-riser-svg" style="direction:ltr;font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#fff">
    <defs><linearGradient id="rsPanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dc2626"/><stop offset="1" stop-color="#991b1b"/></linearGradient></defs>${g}</svg>`;
}
