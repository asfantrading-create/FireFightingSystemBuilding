// Module 8 — Modern Detection & Suppression Technologies.
// Six live simulators (ASD/VESDA, optical beam, UV/IR flame, linear heat, water mist, pre-action)
// plus a graded technology-selection challenge.
import Chart from 'chart.js/auto';
import { header, L, store, markDone, tabBar, stat, scoreBanner, clamp, css } from './ui.js';

/* ───────────────────────── shared helpers ───────────────────────── */
const fx = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '∞');
const n = (v, d = 0, u = '') => `<span class="tech-n">${fx(v, d)}${u ? ' ' + u : ''}</span>`;
const pill = (cls, txt) => `<span class="adv-pill ${cls}">${txt}</span>`;
const card = (title, inner, cls = '', right = '') => `<div class="card ${cls}"><h3>${title}${right ? `<span class="r">${right}</span>` : ''}</h3>${inner}</div>`;
const rng = (id, label, min, max, step, val, unit = '') => `<label class="adv-range"><span class="lbl"><span>${label}</span><b><span id="${id}V">${val}</span>${unit ? ' ' + unit : ''}</b></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
const chk = (id, label, on = false) => `<label class="tech-chk"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
const seg = (id, opts, val) => `<div class="tech-seg" id="${id}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
const sstat = (id, label, unit = '') => stat(label, `<span id="${id}" dir="auto">—</span>`, unit).replace('class="adv-stat ', `id="${id}S" class="adv-stat `);
const ul = (items) => `<ul class="tech-ul">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const explain = (how, keys) => `<div class="adv-grid c2 tech-explain">${card('⚙️ ' + L('How it works', 'مبدأ العمل'), ul(how))}${card('🛠️ ' + L('Installation & commissioning — key points', 'التركيب والاختبار والاستلام — نقاط أساسية'), ul(keys))}</div>`;
const lay = (scene, side) => `<div class="tech-lay"><div class="tech-main">${scene}</div><aside class="tech-side">${side}</aside></div>`;
const mmssT = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const TICK = '#8b97a5';
const GRID = 'rgba(139,151,165,.18)';

function kit(root) {
  const $ = (id) => root.querySelector('#' + id);
  const onRange = (id, fn, f = (v) => v) => {
    const i = $(id);
    const upd = () => { const v = +i.value; $(id + 'V').textContent = f(v); fn(v); };
    i.addEventListener('input', upd);
    return upd;
  };
  const onSeg = (id, fn) => $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    $(id).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    fn(b.dataset.v);
  });
  const onChk = (id, fn) => $(id).addEventListener('change', (e) => fn(e.target.checked));
  const txt = (id, t) => { const e = $(id); if (e && e.textContent !== String(t)) e.textContent = t; };
  const html = (id, h) => { const e = $(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } };
  const st = (id, v, cls = '') => { txt(id, v); const s = $(id + 'S'); if (s) s.className = `adv-stat ${cls}`; };
  const attr = (id, a, v) => { const e = $(id); if (e) e.setAttribute(a, v); };
  const log = (id, t, msg, cls = 'info') => {
    const e = $(id); if (!e) return;
    e.insertAdjacentHTML('afterbegin', `<div class="${cls}" dir="auto"><span class="t">${mmssT(t)}</span>${msg}</div>`);
    while (e.children.length > 40) e.lastElementChild.remove();
  };
  return { $, onRange, onSeg, onChk, txt, html, st, attr, log };
}

/* ═════════════════════════ 1. ASPIRATING SMOKE DETECTION ═════════════════════════ */
const PIPE_A = Math.PI * 0.0105 ** 2; // 25 mm OD / 21 mm ID ABS sampling pipe
const NH = 8;
function vesdaNet(P) {
  const lead = 4, sp = (P.len - lead) / (NH - 1);
  const inlets = [];
  for (let k = 0; k < NH; k++) {
    let w = 1;
    if (P.blocked && k >= 2 && k <= 4) w = 0;
    if (P.brk && k >= 5) w = 0;
    inlets.push({ k, d: lead + k * sp, w, hole: true });
  }
  const brkD = lead + 4.5 * sp;
  if (P.brk) inlets.push({ k: 'B', d: brkD, w: 10, hole: false });
  const sumW = inlets.reduce((a, b) => a + b.w, 0);
  const Q = P.flow * Math.sqrt(sumW / NH) * (P.filter ? 0.72 : 1); // L/min
  inlets.forEach((i) => { i.q = sumW ? (Q * i.w) / sumW : 0; });
  const sorted = [...inlets].sort((a, b) => a.d - b.d);
  let tAcc = 0, prev = 0;
  sorted.forEach((s, j) => {
    const fl = sorted.slice(j).reduce((a, b) => a + b.q, 0);
    const v = fl / 60000 / PIPE_A;
    tAcc += fl > 0 ? (s.d - prev) / v : Infinity;
    prev = s.d; s.T = s.w > 0 ? tAcc : Infinity; s.v = v;
  });
  const holes = inlets.filter((i) => i.hole);
  const maxT = Math.max(...holes.filter((h) => h.w > 0).map((h) => h.T));
  return { inlets, holes, Q, flowPct: (Q / P.flow) * 100, maxT, brkD, vLead: Q / 60000 / PIPE_A, active: holes.filter((h) => h.w > 0).length };
}

function vesdaSvg() {
  let racks = '';
  for (let i = 0; i < 7; i++) {
    const x = 214 + i * 92;
    let u = '';
    for (let j = 0; j < 9; j++) {
      u += `<rect x="${x + 6}" y="${214 + j * 15}" width="48" height="11" rx="1.5" fill="#1a2430" stroke="#2c3a4a" stroke-width=".8"/>`
        + `<circle cx="${x + 12}" cy="${219.5 + j * 15}" r="1.6" fill="${(i + j) % 3 ? '#22c55e' : '#38bdf8'}" class="tech-blink" style="animation-delay:${((i * 7 + j * 3) % 10) / 10}s"/>`
        + `<rect x="${x + 20}" y="${217 + j * 15}" width="${18 + ((i * 5 + j * 7) % 14)}" height="2" fill="#334155"/>`;
    }
    racks += `<g><rect x="${x}" y="206" width="60" height="146" rx="3" fill="url(#vRack)" stroke="#070a0e"/><rect x="${x}" y="206" width="60" height="5" fill="#2b3a4c"/>${u}</g>`;
  }
  let segs = '';
  for (let i = 0; i < 20; i++) segs += `<rect id="vSeg${i}" x="34" y="${275.4 - i * 5.4}" width="26" height="4.2" rx="1" fill="#1e293b"/>`;
  const leds = [['FIRE 2', '#dc2626'], ['FIRE 1', '#ef4444'], ['ACTION', '#f97316'], ['ALERT', '#eab308'], ['FAULT', '#f59e0b']]
    .map(([t, c], i) => `<circle id="vL${i}" cx="92" cy="${184 + i * 20}" r="5" fill="#2a3440" data-c="${c}" stroke="#0b0f14"/><text x="102" y="${188 + i * 20}" font-size="9.5" fill="#cbd5e1" font-weight="700">${t}</text>`).join('');
  let hangers = '';
  for (let x = 150; x < 880; x += 120) hangers += `<line x1="${x}" y1="48" x2="${x}" y2="73" stroke="#94a3b8" stroke-width="1.5"/><rect x="${x - 6}" y="72" width="12" height="4" rx="1" fill="#94a3b8"/>`;
  return `<svg viewBox="0 0 900 410" class="adv-svg tech-svg" id="vSvg">
  <defs>
    <linearGradient id="vRoom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1621"/><stop offset="1" stop-color="#1b2938"/></linearGradient>
    <linearGradient id="vSlab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b8591"/><stop offset="1" stop-color="#4b545f"/></linearGradient>
    <linearGradient id="vRack" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#121922"/><stop offset=".5" stop-color="#232f3d"/><stop offset="1" stop-color="#121922"/></linearGradient>
    <linearGradient id="vPipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fca5a5"/><stop offset=".35" stop-color="#dc2626"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient>
    <linearGradient id="vPipeV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fca5a5"/><stop offset=".35" stop-color="#dc2626"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient>
    <linearGradient id="vUnit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f9"/><stop offset="1" stop-color="#b3bdc8"/></linearGradient>
    <linearGradient id="vFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4654"/><stop offset="1" stop-color="#1f2731"/></linearGradient>
    <radialGradient id="vSmoke"><stop offset="0" stop-color="#d7dbe0" stop-opacity=".95"/><stop offset=".6" stop-color="#aab1ba" stop-opacity=".45"/><stop offset="1" stop-color="#8b939c" stop-opacity="0"/></radialGradient>
    <radialGradient id="vGlow"><stop offset="0" stop-color="#fdba74" stop-opacity="1"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient>
    <radialGradient id="vEmber"><stop offset="0" stop-color="#fff7ed"/><stop offset=".4" stop-color="#fb923c"/><stop offset="1" stop-color="#ea580c" stop-opacity="0"/></radialGradient>
    <filter id="vBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="vSh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <rect width="900" height="410" fill="url(#vRoom)"/>
  <rect width="900" height="48" fill="url(#vSlab)"/>
  <rect y="46" width="900" height="3" fill="#2f363f"/>
  <text x="520" y="30" text-anchor="middle" font-size="12.5" fill="#f1f5f9" opacity=".9" font-weight="600">${L('DATA HALL — ceiling soffit / sampling pipe at 300 mm below', 'قاعة البيانات — سقف خرساني / أنبوب أخذ العينات على عمق 300 مم')}</text>
  ${hangers}
  <rect y="352" width="900" height="58" fill="url(#vFloor)"/>
  ${Array.from({ length: 23 }, (_, i) => `<line x1="${i * 40}" y1="352" x2="${i * 40}" y2="410" stroke="#11171e" stroke-width="1"/>`).join('')}
  <line x1="0" y1="381" x2="900" y2="381" stroke="#11171e"/>
  ${racks}
  <text x="520" y="200" text-anchor="middle" font-size="10.5" fill="#64748b">${L('server racks — cold aisle', 'خزائن الخوادم — الممر البارد')}</text>
  <g id="vSmk" opacity="0">
    <circle id="vEmb" cx="0" cy="336" r="14" fill="url(#vEmber)" class="tech-flick"/>
    <g filter="url(#vBlur)">
      <circle class="tech-rise" cx="0" cy="310" r="20" fill="url(#vSmoke)"/>
      <circle class="tech-rise" style="animation-delay:-1s" cx="6" cy="250" r="26" fill="url(#vSmoke)"/>
      <circle class="tech-rise" style="animation-delay:-2s" cx="-6" cy="190" r="30" fill="url(#vSmoke)"/>
      <circle class="tech-rise" style="animation-delay:-3s" cx="4" cy="135" r="34" fill="url(#vSmoke)"/>
    </g>
  </g>
  <ellipse id="vLayer" cx="0" cy="98" rx="10" ry="20" fill="url(#vSmoke)" filter="url(#vBlur)" opacity="0"/>
  <path d="M852 78 H92 V150" fill="none" stroke="#5b0f0f" stroke-width="13" stroke-linejoin="round"/>
  <path d="M852 78 H92" fill="none" stroke="url(#vPipe)" stroke-width="10"/>
  <path d="M92 78 V150" fill="none" stroke="url(#vPipeV)" stroke-width="10"/>
  <path id="vFlow" d="M852 78 H92 V148" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-dasharray="5 15" class="tech-flow"/>
  <rect x="850" y="71" width="10" height="14" rx="2" fill="#7f1d1d" stroke="#450a0a"/>
  <text x="855" y="64" text-anchor="middle" font-size="9.5" fill="#fca5a5">${L('end cap', 'غطاء نهاية')}</text>
  <g id="vRuler"></g>
  <g id="vHoles"></g>
  <g id="vBrk"></g>
  <g filter="url(#vSh)">
    <rect x="14" y="150" width="158" height="194" rx="10" fill="url(#vUnit)" stroke="#7b8794"/>
    <rect x="24" y="162" width="138" height="146" rx="6" fill="#0a0f16" stroke="#374151"/>
    ${segs}
    <line x1="64" y1="170" x2="64" y2="282" stroke="#334155"/>
    <g id="vThMk"></g>
    ${leds}
    <rect x="30" y="286" width="126" height="18" rx="3" fill="#051018" stroke="#1e3a4a"/>
    <text id="vRd" x="93" y="299" text-anchor="middle" font-size="11.5" font-family="Consolas, monospace" fill="#67e8f9">0.000 %obs/m</text>
    <rect x="172" y="200" width="6" height="60" rx="2" fill="#8792a0"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="173" y1="${206 + i * 9}" x2="177" y2="${206 + i * 9}" stroke="#4b5563"/>`).join('')}
    <text x="93" y="322" text-anchor="middle" font-size="10" font-weight="800" fill="#1f2937" letter-spacing="1.5">ASD · 8-HOLE</text>
    <text x="93" y="335" text-anchor="middle" font-size="8.5" fill="#475569">${L('aspirator · filter · laser chamber', 'مروحة شفط · مرشح · حجرة ليزر')}</text>
    ${[[20, 156], [166, 156], [20, 338], [166, 338]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#94a3b8"/>`).join('')}
  </g>
  <g id="vExh" class="tech-exh"><path d="M182 212 q10 -4 20 0 M182 230 q10 -4 20 0 M182 248 q10 -4 20 0" stroke="#7dd3fc" stroke-width="1.6" fill="none" opacity=".7"/></g>
  <text x="204" y="236" font-size="9" fill="#7dd3fc">${L('exhaust', 'عادم')}</text>
</svg>`;
}

function tabVesda(root) {
  const K = kit(root);
  const P = { len: 60, flow: 60, xs: 38, grow: 0.3, blocked: false, brk: false, filter: false, th: [0.05, 0.1, 0.2, 2.0] };
  const S = { t: 0, on: false, run: false, speed: 5, first: [null, null, null, null], lastLvl: -1, fault: false, sample: 0 };
  let NET = vesdaNet(P);
  const LV = [L('Alert', 'تنبيه'), L('Action', 'إجراء'), L('Fire 1', 'حريق 1'), L('Fire 2', 'حريق 2')];

  root.innerHTML = lay(
    card('🌫️ ' + L('Aspirating smoke detection — live pipe network', 'كشف الدخان بالشفط (ASD) — شبكة أنابيب حية'), vesdaSvg()
      + `<div class="adv-legend"><span><i style="background:#dc2626"></i>${L('ABS sampling pipe (red, per listing)', 'أنبوب عينات ABS (أحمر حسب الاعتماد)')}</span><span><i style="background:#fdba74"></i>${L('hole currently sampling smoke', 'فتحة تسحب دخاناً الآن')}</span><span><i style="background:#e2e8f0"></i>${L('air flow toward detector', 'اتجاه الهواء نحو الكاشف')}</span><span>${L('Numbers above holes = transport time', 'الأرقام فوق الفتحات = زمن النقل')}</span></div>`, 'tech-scene')
    + `<div class="adv-stats tech-stats">${sstat('vsR', L('Detector reading', 'قراءة الكاشف'), '%obs/m')}${sstat('vsL', L('Alarm level', 'مستوى الإنذار'))}${sstat('vsF', L('Flow (vs. commissioned)', 'التدفق (مقارنة بالاستلام)'), '%')}${sstat('vsT', L('Max transport time', 'أقصى زمن نقل'), 's')}${sstat('vsH', L('Hole sensitivity (Fire 1)', 'حساسية الفتحة (حريق 1)'), '%obs/m')}${sstat('vsC', L('Time since ignition', 'الزمن منذ الاشتعال'))}</div>`,
    card('🧪 ' + L('Fire scenario', 'سيناريو الحريق'),
      rng('vXs', L('Smoke source position (from detector)', 'موقع مصدر الدخان (من الكاشف)'), 0, P.len, 1, P.xs, 'm')
      + rng('vGr', L('Smoke growth (t² fire, at 60 s)', 'نمو الدخان (حريق t²، عند 60 ث)'), 0.05, 1.5, 0.05, P.grow, '%/m')
      + `<div class="adv-btns tech-mt"><button class="btn primary sm" id="vGo">🔥 ${L('Start smouldering fire', 'بدء حريق كامن')}</button><button class="btn sm" id="vPause">⏸ ${L('Pause', 'إيقاف مؤقت')}</button><button class="btn sm" id="vReset">↺ ${L('Reset', 'إعادة')}</button></div>`
      + `<div class="tech-row tech-mt"><span class="tech-lbl">${L('Speed', 'السرعة')}</span>${seg('vSpd', [[1, '×1'], [5, '×5'], [20, '×20']], 5)}</div>`)
    + card('🧵 ' + L('Pipe network & aspirator', 'شبكة الأنابيب ومروحة الشفط'),
      rng('vLen', L('Pipe length (8 holes, end-cap hole)', 'طول الأنبوب (8 فتحات، فتحة نهاية)'), 20, 120, 2, P.len, 'm')
      + rng('vFl', L('Aspirator flow (commissioned)', 'تدفق المروحة (عند الاستلام)'), 30, 120, 5, P.flow, 'L/min'))
    + card('📶 ' + L('Alarm thresholds', 'عتبات الإنذار'), `<div class="tech-th">${LV.map((l, i) => `<label class="adv-field"><span>${l}</span><input type="number" id="vTh${i}" min="0.005" max="20" step="${i === 3 ? 0.1 : 0.005}" value="${P.th[i]}"></label>`).join('')}</div><div class="adv-note tech-mt">%obs/m · ${L('Class A (very early warning) ≤ 0.2 %/m per hole in many listings', 'الفئة A (إنذار مبكر جداً) ≤ 0.2 %/م لكل فتحة في كثير من الاعتمادات')}</div>`)
    + card('⚠️ ' + L('Inject faults', 'حقن أعطال'), chk('vB', L('3 holes blocked (dust / paint)', 'انسداد 3 فتحات (غبار/طلاء)')) + chk('vK', L('Pipe break after hole 5', 'كسر في الأنبوب بعد الفتحة 5')) + chk('vFi', L('Filter clogged', 'انسداد المرشح')) + `<div class="adv-note tech-mt">${L('Airflow is supervised: a change beyond ±20 % of the commissioned flow gives a FLOW FAULT (trouble).', 'التدفق مراقَب: أي تغيّر يتجاوز ±20٪ من تدفق الاستلام يعطي عطل تدفق (Trouble).')}</div>`),
  ) + `<div class="adv-grid c2">${card('📈 ' + L('Obscuration at the detector vs time', 'التعتيم عند الكاشف مقابل الزمن'), '<div class="tech-chart"><canvas id="vChart"></canvas></div>')}${card('🕳️ ' + L('Sampling holes — transport time & flow balance', 'فتحات العينات — زمن النقل وتوازن التدفق'), '<div class="adv-scroll tech-tbl" id="vTbl"></div><div id="vCmp" class="tech-mt"></div>')}</div>`
    + card('📝 ' + L('Event log', 'سجل الأحداث'), '<div class="adv-log" id="vLog"></div>')
    + explain([
      L('An aspirator (fan) continuously draws air through a network of sampling pipes with calibrated holes. The sample passes a dust filter to a laser/LED light-scattering chamber that measures obscuration down to ~0.005 %obs/m — roughly 100–1000× more sensitive than a spot detector.', 'تسحب مروحة الهواء باستمرار عبر شبكة أنابيب ذات فتحات معايرة، ويمر الهواء عبر مرشح غبار إلى حجرة تشتت ضوئي بالليزر تقيس التعتيم حتى ~0.005 %/م — أي أكثر حساسية من الكاشف النقطي بـ 100–1000 مرة.'),
      L('The detector sees the <b>average</b> of all holes: smoke entering one hole of eight is diluted ~8×. That is why the hole sensitivity = detector threshold × number of active holes, and why smoke spreading over several holes (cumulative sampling) is detected earlier.', 'يرى الكاشف <b>متوسط</b> جميع الفتحات: الدخان الداخل من فتحة واحدة من ثمانٍ يُخفَّف ~8 مرات. لذلك حساسية الفتحة = عتبة الكاشف × عدد الفتحات الفعالة، والدخان المنتشر على عدة فتحات (أخذ عينات تراكمي) يُكشف مبكراً.'),
      L('Four adjustable thresholds (Alert → Action → Fire 1 → Fire 2) allow staged response: investigate, shut down equipment / HVAC, evacuate, release suppression.', 'أربع عتبات قابلة للضبط (تنبيه ← إجراء ← حريق 1 ← حريق 2) تتيح استجابة مرحلية: تحقق، إيقاف المعدات/التكييف، إخلاء، إطلاق الإطفاء.'),
      L('Transport time is the time for air to travel from a hole to the detector. Air velocity drops toward the far end because each hole adds flow nearer the detector — the end-cap hole is always the slowest.', 'زمن النقل هو زمن انتقال الهواء من الفتحة إلى الكاشف. تنخفض سرعة الهواء نحو نهاية الأنبوب لأن كل فتحة تضيف تدفقاً أقرب للكاشف — فتحة النهاية هي الأبطأ دائماً.'),
    ], [
      L('NFPA 72 §17.7.3.6: sampling ports are treated as spot detectors for spacing; maximum transport time from the most remote port shall not exceed <b>120 s</b> (use ≤ 90 s for very-early-warning / Class A designs).', 'NFPA 72 §17.7.3.6: تُعامل فتحات أخذ العينات كالكواشف النقطية في التباعد؛ يجب ألا يتجاوز زمن النقل من أبعد فتحة <b>120 ث</b> (استخدم ≤ 90 ث لتصاميم الإنذار المبكر جداً / الفئة A).'),
      L('Design with the manufacturer’s listed pipe-modelling software (hole sizes, balance, transport time); install exactly as calculated — record the design file in the O&M manual.', 'صمّم باستخدام برنامج نمذجة الأنابيب المعتمد من المصنّع (أقطار الفتحات، التوازن، زمن النقل)؛ ركّب تماماً كما حُسب واحفظ ملف التصميم في دليل التشغيل والصيانة.'),
      L('Pipe: listed ABS/PVC, solvent-cemented joints (not end-cap — keep it removable for cleaning), labelled "Aspirating smoke detector pipe – do not paint or disturb" at intervals; supports ≤ 1.5 m.', 'الأنبوب: ABS/PVC معتمد، وصلات لاصقة (عدا غطاء النهاية ليبقى قابلاً للفك للتنظيف)، يوضع عليه ملصق "أنبوب كاشف دخان بالشفط – لا تطلِ ولا تعبث" على فترات؛ المساند ≤ 1.5 م.'),
      L('Commissioning: record baseline flow per pipe, set flow-fault limits (±20 %), perform a transport-time test with smoke at the end-cap hole (≤ calculated +/− tolerance), verify every threshold and output (cause & effect).', 'الاستلام: سجّل التدفق المرجعي لكل أنبوب، واضبط حدود عطل التدفق (±20٪)، ونفّذ اختبار زمن النقل بالدخان عند فتحة النهاية، وتحقق من كل عتبة ومخرج (السبب والنتيجة).'),
      L('Maintenance (NFPA 72 Table 14.4.3.2): check flow readings, replace filter, blow-back / clean the pipes, repeat the end-cap transport-time test annually.', 'الصيانة (NFPA 72 الجدول 14.4.3.2): افحص قراءات التدفق، استبدل المرشح، نظّف الأنابيب بالنفخ العكسي، وكرر اختبار زمن النقل من فتحة النهاية سنوياً.'),
    ]);

  const xpx = (d) => 92 + (d / P.len) * 760;
  const conc = (d, t) => {
    if (t <= 0) return 0;
    const Sx = Math.min(25, P.grow * (t / 60) ** 2);
    const sg = Math.min(22, 1.5 + 0.06 * t);
    return Sx * Math.exp(-(((d - P.xs) / sg) ** 2));
  };
  const reading = (t) => (NET.Q > 0 ? NET.inlets.reduce((a, i) => a + (i.hole && i.q > 0 && Number.isFinite(i.T) ? i.q * conc(i.d, t - i.T) : 0), 0) / NET.Q : 0);
  const valY = (v) => 280 - clamp(Math.log10(v / 0.005) / 3, 0, 1) * 108;

  function buildNet() {
    NET = vesdaNet(P);
    // ruler
    let r = `<line x1="92" y1="132" x2="852" y2="132" stroke="#475569"/>`;
    const step = P.len > 70 ? 20 : 10;
    for (let d = 0; d <= P.len + 0.01; d += step) r += `<line x1="${xpx(d)}" y1="128" x2="${xpx(d)}" y2="136" stroke="#64748b"/><text x="${xpx(d)}" y="148" text-anchor="middle" font-size="9.5" fill="#94a3b8">${d} m</text>`;
    K.$('vRuler').innerHTML = r;
    K.$('vHoles').innerHTML = NET.holes.map((h) => {
      const x = xpx(h.d);
      const T = Number.isFinite(h.T) ? `${h.T.toFixed(0)} s` : '—';
      const col = !Number.isFinite(h.T) ? '#94a3b8' : h.T > 120 ? '#f87171' : h.T > 90 ? '#fbbf24' : '#86efac';
      const plug = h.w === 0 && P.blocked && h.k >= 2 && h.k <= 4
        ? `<circle cx="${x}" cy="85" r="5.5" fill="#1f1f1f" stroke="#f59e0b" stroke-width="1.5"/><path d="M${x - 3} ${82} l6 6 M${x + 3} 82 l-6 6" stroke="#f59e0b" stroke-width="1.5"/>`
        : `<circle cx="${x}" cy="84.5" r="3.2" fill="#1b0606" stroke="#fecaca" stroke-width=".9"/>`;
      return `<g><circle id="vg${h.k}" cx="${x}" cy="90" r="13" fill="url(#vGlow)" opacity="0"/>${plug}
        <rect x="${x - 19}" y="53" width="38" height="15" rx="7.5" fill="#0b1220" stroke="${col}" stroke-opacity=".7"/>
        <text x="${x}" y="64" text-anchor="middle" font-size="10" font-weight="700" fill="${col}" font-family="Consolas, monospace">${T}</text>
        <text x="${x}" y="106" text-anchor="middle" font-size="9.5" fill="#cbd5e1">H${h.k + 1}</text></g>`;
    }).join('');
    const bx = xpx(NET.brkD);
    K.$('vBrk').innerHTML = P.brk ? `<rect x="${bx - 6}" y="70" width="12" height="17" fill="#0d1621"/><path d="M${bx - 6} 72 l3 3 -3 3 3 3 -3 3 M${bx + 6} 72 l-3 3 3 3 -3 3 3 3" stroke="#fecaca" stroke-width="1.4" fill="none"/>
      <g class="tech-exh"><path d="M${bx - 16} 104 q16 -12 16 -22 M${bx + 16} 104 q-16 -12 -16 -22" stroke="#e2e8f0" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/></g>
      <text x="${bx}" y="120" text-anchor="middle" font-size="10" font-weight="800" fill="#f87171">${L('BREAK — room air in', 'كسر — دخول هواء الغرفة')}</text>` : '';
    // thresholds on bar graph
    K.$('vThMk').innerHTML = P.th.map((v, i) => `<path d="M64 ${valY(v)} l6 -3.5 v7 z" fill="${['#eab308', '#f97316', '#ef4444', '#dc2626'][i]}"/><text x="72" y="${valY(v) + 3}" font-size="7" fill="#94a3b8">${['AL', 'AC', 'F1', 'F2'][i]}</text>`).join('');
    // flow animation speed ∝ velocity at detector
    K.$('vFlow').style.animationDuration = `${clamp(3 / Math.max(0.2, NET.vLead), 0.25, 8).toFixed(2)}s`;
    // table
    K.$('vTbl').innerHTML = `<table class="adv-table"><thead><tr><th>${L('Hole', 'الفتحة')}</th><th class="num">${L('Distance', 'المسافة')}</th><th class="num">${L('Flow share', 'حصة التدفق')}</th><th class="num">${L('Transport', 'زمن النقل')}</th><th>${L('Status', 'الحالة')}</th></tr></thead><tbody>${NET.holes.map((h) => {
      const st = h.w === 0 ? pill('bad', L('no sample', 'لا عينة')) : h.T > 120 ? pill('bad', `<span class="tech-n">&gt; 120 s</span>`) : h.T > 90 ? pill('warn', `<span class="tech-n">≤ 120 s</span>`) : pill('ok', `<span class="tech-n">≤ 90 s</span>`);
      return `<tr><td>H${h.k + 1}${h.k === NH - 1 ? ` <small class="tech-mut">(${L('end cap', 'النهاية')})</small>` : ''}</td><td class="num">${h.d.toFixed(1)} m</td><td class="num">${NET.Q ? ((h.q / NET.Q) * 100).toFixed(1) : 0} %</td><td class="num">${fx(h.T, 1)} s</td><td>${st}</td></tr>`;
    }).join('')}</tbody></table>`;
    const mt = NET.maxT;
    K.$('vCmp').innerHTML = mt > 120
      ? `<div class="adv-callout bad">❌ ${L(`Remote-port transport time ${n(mt, 0, 's')} exceeds the NFPA 72 maximum of 120 s — shorten the pipe, split into more pipes or raise the aspirator speed.`, `زمن النقل من أبعد فتحة ${n(mt, 0, 'ث')} يتجاوز الحد الأقصى 120 ث في NFPA 72 — قصّر الأنبوب أو قسّمه لعدة أنابيب أو ارفع سرعة المروحة.`)}</div>`
      : mt > 90 ? `<div class="adv-callout warn">⚠️ ${L(`Complies with NFPA 72 (${n(mt, 0, 's')} ≤ 120 s) but exceeds the 90 s target for very-early-warning (Class A) applications.`, `مطابق لـ NFPA 72 (${n(mt, 0, 'ث')} ≤ 120 ث) لكنه يتجاوز هدف 90 ث لتطبيقات الإنذار المبكر جداً (الفئة A).`)}</div>`
        : `<div class="adv-callout">✅ ${L(`Remote-port transport time ${n(mt, 0, 's')} — meets ≤ 90 s very-early-warning target and the NFPA 72 120 s limit.`, `زمن النقل من أبعد فتحة ${n(mt, 0, 'ث')} — يحقق هدف ≤ 90 ث وحد 120 ث في NFPA 72.`)}</div>`;
    K.$('vXs').max = P.len;
    if (P.xs > P.len) { P.xs = P.len; K.$('vXs').value = P.len; K.txt('vXsV', P.len); }
    const flt = Math.abs(NET.flowPct - 100) > 20;
    if (flt !== S.fault) {
      S.fault = flt;
      K.log('vLog', S.t, flt ? `FLOW FAULT — ${NET.flowPct.toFixed(0)} % ${L('of commissioned flow', 'من تدفق الاستلام')}` : L('Flow normal — fault restored', 'التدفق طبيعي — زال العطل'), flt ? 'trouble' : 'ok');
    }
    draw();
  }

  const chart = new Chart(K.$('vChart'), {
    type: 'line',
    data: {
      datasets: [
        { label: L('Detector reading', 'قراءة الكاشف'), data: [], borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,.12)', fill: true, borderWidth: 2.5, pointRadius: 0, tension: 0.25 },
        ...['#eab308', '#f97316', '#ef4444', '#991b1b'].map((c, i) => ({ label: LV[i], data: [], borderColor: c, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 })),
      ],
    },
    options: {
      animation: false, responsive: true, maintainAspectRatio: false,
      scales: {
        x: { type: 'linear', min: 0, max: 240, title: { display: true, text: L('Time since ignition (s)', 'الزمن منذ الاشتعال (ث)'), color: TICK }, ticks: { color: TICK }, grid: { color: GRID } },
        y: { type: 'logarithmic', min: 0.001, max: 20, title: { display: true, text: '%obs/m', color: TICK }, ticks: { color: TICK, callback: (v) => ([0.001, 0.01, 0.1, 1, 10].includes(+v) ? v : '') }, grid: { color: GRID } },
      },
      plugins: { legend: { labels: { color: TICK, boxWidth: 14, font: { size: 11 } } } },
    },
  });
  const chartTh = () => {
    const xm = chart.options.scales.x.max;
    P.th.forEach((v, i) => { chart.data.datasets[i + 1].data = [{ x: 0, y: v }, { x: xm, y: v }]; });
  };
  chartTh(); chart.update('none');

  const LEDS = ['vL0', 'vL1', 'vL2', 'vL3', 'vL4'];
  function draw() {
    const r = S.on ? reading(S.t) : 0;
    let lvl = -1;
    P.th.forEach((v, i) => { if (r >= v) lvl = i; });
    // bar graph
    for (let i = 0; i < 20; i++) {
      const v = 0.005 * 10 ** ((3 * (i + 1)) / 20);
      const on = r >= v * 0.999;
      const c = v >= P.th[2] ? '#ef4444' : v >= P.th[1] ? '#f97316' : v >= P.th[0] ? '#eab308' : '#22c55e';
      K.attr(`vSeg${i}`, 'fill', on ? c : '#1e293b');
    }
    // LEDs: index 0 = Fire2 … 3 = Alert, 4 = Fault
    [3, 2, 1, 0].forEach((lv, j) => { const e = K.$(LEDS[j]); const on = lvl >= lv; e.setAttribute('fill', on ? e.dataset.c : '#2a3440'); e.classList.toggle('tech-ledon', on); });
    const fe = K.$('vL4'); fe.setAttribute('fill', S.fault ? fe.dataset.c : '#2a3440'); fe.classList.toggle('tech-ledon', S.fault);
    K.txt('vRd', `${r < 10 ? r.toFixed(3) : r.toFixed(1)} %obs/m`);
    // holes glow
    NET.holes.forEach((h) => { const c = S.on && h.w > 0 ? conc(h.d, S.t) : 0; K.attr(`vg${h.k}`, 'opacity', clamp(c / 0.6, 0, 1).toFixed(2)); });
    // smoke visual
    const sx = xpx(P.xs);
    const Sx = S.on ? Math.min(25, P.grow * (S.t / 60) ** 2) : 0;
    K.attr('vSmk', 'transform', `translate(${sx},0)`);
    K.attr('vSmk', 'opacity', S.on ? clamp(0.25 + Sx / 2, 0, 0.95).toFixed(2) : 0);
    K.attr('vLayer', 'cx', sx);
    K.attr('vLayer', 'rx', ((Math.min(22, 1.5 + 0.06 * S.t) / P.len) * 760 * 1.4).toFixed(0));
    K.attr('vLayer', 'opacity', S.on ? clamp(Sx / 3, 0, 0.85).toFixed(2) : 0);
    // stats
    K.st('vsR', r < 10 ? r.toFixed(3) : r.toFixed(1), lvl >= 2 ? 'alarm' : lvl >= 0 ? 'warn' : 'ok');
    K.st('vsL', lvl < 0 ? L('Normal', 'طبيعي') : LV[lvl], lvl >= 2 ? 'alarm' : lvl >= 0 ? 'warn' : 'ok');
    K.st('vsF', NET.flowPct.toFixed(0), S.fault ? 'alarm' : 'ok');
    K.st('vsT', fx(NET.maxT, 0), NET.maxT > 120 ? 'alarm' : NET.maxT > 90 ? 'warn' : 'ok');
    K.st('vsH', (P.th[2] * NET.active).toFixed(2), '');
    K.st('vsC', mmssT(S.t), '');
    if (S.on && lvl > S.lastLvl) {
      for (let i = S.lastLvl + 1; i <= lvl; i++) {
        S.first[i] = S.t;
        K.log('vLog', S.t, `${LV[i].toUpperCase()} — ${r.toFixed(3)} %obs/m ${['', L('→ shut down CRAC / notify', '← إيقاف التكييف / إبلاغ'), L('→ evacuate, alarm to FACP', '← إخلاء، إنذار للوحة'), L('→ release clean agent', '← إطلاق غاز الإطفاء النظيف')][i]}`, i >= 2 ? 'fire' : 'pre');
      }
      S.lastLvl = lvl;
    }
  }

  const timer = setInterval(() => {
    if (!S.run) return;
    S.t += 0.1 * S.speed;
    if (S.t >= 900) { S.run = false; K.log('vLog', S.t, L('Simulation end (15 min)', 'نهاية المحاكاة (15 دقيقة)')); }
    S.sample += 0.1 * S.speed;
    if (S.sample >= 2) {
      S.sample = 0;
      const r = reading(S.t);
      chart.data.datasets[0].data.push({ x: +S.t.toFixed(1), y: Math.max(0.001, r) });
      const xm = Math.max(240, Math.ceil((S.t + 30) / 60) * 60);
      if (xm !== chart.options.scales.x.max) { chart.options.scales.x.max = xm; chartTh(); }
      chart.update('none');
    }
    draw();
  }, 100);

  const reset = () => {
    S.t = 0; S.on = false; S.run = false; S.first = [null, null, null, null]; S.lastLvl = -1; S.sample = 0;
    chart.data.datasets[0].data = []; chart.options.scales.x.max = 240; chartTh(); chart.update('none');
    draw();
  };
  K.$('vGo').onclick = () => { if (!S.on) { reset(); S.on = true; K.log('vLog', 0, L(`Smouldering cable fire started at ${P.xs} m`, `بدأ حريق كابلات كامن عند ${P.xs} م`), 'info'); } S.run = true; };
  K.$('vPause').onclick = () => { S.run = !S.run && S.on; };
  K.$('vReset').onclick = () => { reset(); K.log('vLog', 0, L('Reset', 'إعادة ضبط'), 'ok'); };
  K.onSeg('vSpd', (v) => { S.speed = +v; });
  K.onRange('vXs', (v) => { P.xs = v; draw(); });
  K.onRange('vGr', (v) => { P.grow = v; draw(); }, (v) => v.toFixed(2));
  K.onRange('vLen', (v) => { P.len = v; buildNet(); });
  K.onRange('vFl', (v) => { P.flow = v; buildNet(); });
  K.onChk('vB', (v) => { P.blocked = v; buildNet(); });
  K.onChk('vK', (v) => { P.brk = v; buildNet(); });
  K.onChk('vFi', (v) => { P.filter = v; buildNet(); });
  P.th.forEach((_, i) => K.$(`vTh${i}`).addEventListener('change', (e) => {
    const v = clamp(+e.target.value || P.th[i], 0.005, 20); P.th[i] = v;
    for (let j = 1; j < 4; j++) if (P.th[j] < P.th[j - 1]) { P.th[j] = P.th[j - 1]; K.$(`vTh${j}`).value = P.th[j]; }
    S.lastLvl = -1; chartTh(); chart.update('none'); buildNet();
  }));
  buildNet();
  K.log('vLog', 0, L('ASD commissioned — baseline flow recorded, all thresholds set', 'تم استلام نظام ASD — سُجّل التدفق المرجعي وضُبطت العتبات'), 'ok');
  return () => { clearInterval(timer); chart.destroy(); };
}

/* ═════════════════════════ 2. OPTICAL BEAM DETECTOR ═════════════════════════ */
function beamSvg() {
  let truss = '';
  for (let x = 46; x < 854; x += 34) truss += `<path d="M${x} 46 L${x + 17} 70 L${x + 34} 46" stroke="#64748b" stroke-width="1.6" fill="none"/>`;
  let racks = '';
  [[150, 0], [360, 1], [600, 2]].forEach(([x, r]) => {
    let b = '';
    for (let lv = 0; lv < 5; lv++) {
      for (let c = 0; c < 4; c++) {
        const col = ['#b45309', '#92400e', '#1d4ed8', '#a16207', '#57534e'][(lv * 3 + c + r) % 5];
        b += `<rect x="${x + 6 + c * 34}" y="${318 - lv * 44 - 30}" width="28" height="${24 + ((c + lv) % 2) * 4}" rx="2" fill="${col}" opacity=".9"/><rect x="${x + 6 + c * 34}" y="${318 - lv * 44 - 6}" width="28" height="4" fill="#7c5a3a"/>`;
      }
      b += `<rect x="${x}" y="${318 - lv * 44}" width="146" height="4" fill="#f97316"/>`;
    }
    racks += `<g><rect x="${x}" y="100" width="5" height="240" fill="#1e40af"/><rect x="${x + 141}" y="100" width="5" height="240" fill="#1e40af"/>${b}</g>`;
  });
  return `<svg viewBox="0 0 900 390" class="adv-svg tech-svg">
  <defs>
    <linearGradient id="bIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#111a25"/><stop offset="1" stop-color="#26313e"/></linearGradient>
    <linearGradient id="bWall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b7280"/><stop offset="1" stop-color="#9ca3af"/></linearGradient>
    <linearGradient id="bWallR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#6b7280"/><stop offset="1" stop-color="#9ca3af"/></linearGradient>
    <linearGradient id="bDeck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa4af"/><stop offset="1" stop-color="#5c6671"/></linearGradient>
    <linearGradient id="bBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#94a3b8"/></linearGradient>
    <linearGradient id="bBeam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff4d4d"/><stop offset="1" stop-color="#ff8080"/></linearGradient>
    <radialGradient id="bSmoke"><stop offset="0" stop-color="#d5dbe2" stop-opacity="1"/><stop offset=".65" stop-color="#a3acb6" stop-opacity=".7"/><stop offset="1" stop-color="#6b7280" stop-opacity="0"/></radialGradient>
    <radialGradient id="bFire"><stop offset="0" stop-color="#fff7ed"/><stop offset=".35" stop-color="#fbbf24"/><stop offset=".7" stop-color="#ea580c"/><stop offset="1" stop-color="#ea580c" stop-opacity="0"/></radialGradient>
    <pattern id="bPrism" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#cbd5e1"/><path d="M0 0 L6 6 M6 0 L0 6" stroke="#64748b" stroke-width=".7"/></pattern>
    <filter id="bGlow" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bBl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="900" height="390" fill="url(#bIn)"/>
  <rect x="0" y="30" width="900" height="16" fill="url(#bDeck)"/>
  ${Array.from({ length: 45 }, (_, i) => `<line x1="${i * 20}" y1="30" x2="${i * 20}" y2="46" stroke="#4b5563" stroke-width=".8"/>`).join('')}
  <rect x="46" y="68" width="808" height="4" fill="#64748b"/>
  ${truss}
  <rect x="0" y="0" width="900" height="30" fill="#0b1118"/>
  <text x="450" y="20" text-anchor="middle" font-size="12" fill="#e2e8f0" font-weight="600">${L('HIGH-BAY WAREHOUSE — elevation (not to scale)', 'مستودع عالي الارتفاع — مقطع رأسي (بدون مقياس)')}</text>
  <rect x="30" y="30" width="16" height="316" fill="url(#bWall)"/><rect x="854" y="30" width="16" height="316" fill="url(#bWallR)"/>
  ${racks}
  <g id="bPlume" opacity="0">
    <ellipse cx="490" cy="330" rx="26" ry="12" fill="url(#bFire)" class="tech-flick"/>
    <g filter="url(#bBl)"><circle class="tech-rise" cx="490" cy="290" r="26" fill="url(#bSmoke)"/><circle class="tech-rise" style="animation-delay:-1.2s" cx="498" cy="220" r="34" fill="url(#bSmoke)"/><circle class="tech-rise" style="animation-delay:-2.4s" cx="482" cy="150" r="42" fill="url(#bSmoke)"/></g>
    <ellipse cx="490" cy="92" rx="330" ry="34" fill="url(#bSmoke)" filter="url(#bBl)"/>
  </g>
  <rect x="0" y="346" width="900" height="44" fill="#2b333d"/><line x1="0" y1="346" x2="900" y2="346" stroke="#475569" stroke-width="2"/>
  <g id="bDim"></g>
  <path id="bOut" d="" stroke="url(#bBeam)" stroke-width="2.4" filter="url(#bGlow)" class="tech-beam"/>
  <path id="bRet" d="" stroke="#ff6b6b" stroke-width="1.6" filter="url(#bGlow)" class="tech-beam" style="animation-direction:reverse"/>
  <circle id="bMiss" r="10" fill="none" stroke="#ff4d4d" stroke-width="1.5" stroke-dasharray="3 2" opacity="0"/>
  <g id="bTx">
    <rect x="46" y="-13" width="38" height="26" rx="4" fill="url(#bBox)" stroke="#475569"/>
    <circle cx="80" cy="-5" r="4.5" fill="#1e293b" stroke="#ef4444"/><circle cx="80" cy="6" r="4.5" fill="#1e293b" stroke="#22c55e"/>
    <rect id="bDirt" x="75" y="-11" width="10" height="22" rx="2" fill="#78350f" opacity="0"/>
    <circle id="bLed" cx="54" cy="7" r="2.6" fill="#22c55e"/>
  </g>
  <g id="bRef"><rect x="838" y="-16" width="14" height="32" rx="2" fill="url(#bPrism)" stroke="#334155"/><rect x="849" y="-18" width="5" height="36" fill="#475569"/></g>
  <text id="bTxL" x="92" y="0" font-size="10" fill="#e2e8f0">${L('Transmitter / receiver', 'مرسل / مستقبل')}</text>
  <text id="bRfL" x="832" y="0" font-size="10" fill="#e2e8f0" text-anchor="end">${L('Prism reflector', 'عاكس منشوري')}</text>
</svg>`;
}

function beamPlan(P) {
  const W = 54, x0 = 24, y0 = 20, w = 270, h = 150, sy = h / W;
  let bands = '', lines = '', cnt = 0;
  for (let y = P.sp / 2; y < W; y += P.sp) {
    cnt++;
    const yy = y0 + y * sy;
    bands += `<rect x="${x0}" y="${Math.max(y0, yy - (P.sp / 2) * sy)}" width="${w}" height="${Math.min(y0 + h, yy + (P.sp / 2) * sy) - Math.max(y0, yy - (P.sp / 2) * sy)}" fill="${cnt % 2 ? '#ef4444' : '#f97316'}" opacity=".10"/>`;
    lines += `<line x1="${x0 + 4}" y1="${yy}" x2="${x0 + w - 4}" y2="${yy}" stroke="#ef4444" stroke-width="2" class="tech-beam"/><rect x="${x0 + 2}" y="${yy - 4}" width="7" height="8" fill="#e2e8f0" stroke="#475569"/><rect x="${x0 + w - 8}" y="${yy - 4}" width="6" height="8" fill="url(#bPrismP)"/>`;
  }
  const lastEdge = W - (P.sp / 2 + (cnt - 1) * P.sp);
  const bad = P.sp > 18 || lastEdge > P.sp / 2 + 0.01;
  return {
    cnt, lastEdge, bad,
    svg: `<svg viewBox="0 0 320 212" class="adv-svg tech-svg tech-plan">
    <defs><pattern id="bPrismP" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#cbd5e1"/><path d="M0 0 L3 3" stroke="#475569" stroke-width=".6"/></pattern></defs>
    <rect width="320" height="212" rx="8" fill="#0f1720"/>
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#1a2430" stroke="#94a3b8" stroke-width="2"/>
    ${bands}${lines}
    <line x1="${x0 + w + 10}" y1="${y0}" x2="${x0 + w + 10}" y2="${y0 + (P.sp / 2) * sy}" stroke="#fbbf24"/><text x="${x0 + w + 13}" y="${y0 + (P.sp / 4) * sy + 3}" font-size="8.5" fill="#fbbf24">${(P.sp / 2).toFixed(1)}</text>
    ${cnt > 1 ? `<line x1="${x0 + w / 2}" y1="${y0 + (P.sp / 2) * sy}" x2="${x0 + w / 2}" y2="${y0 + (P.sp * 1.5) * sy}" stroke="#fbbf24" stroke-dasharray="2 2"/><text x="${x0 + w / 2 + 4}" y="${y0 + P.sp * sy + 3}" font-size="9" fill="#fbbf24">S = ${P.sp} m</text>` : ''}
    <text x="${x0 + w / 2}" y="${y0 + h + 16}" text-anchor="middle" font-size="9.5" fill="#94a3b8">${L(`Roof plan — ${cnt} beams`, `مخطط السقف — ${cnt} أشعة`)}</text><text x="${x0 + w / 2}" y="${y0 + h + 30}" text-anchor="middle" font-size="9.5" fill="#94a3b8">${P.dist} m × ${W} m</text>
    <text x="${x0 + w / 2}" y="13" text-anchor="middle" font-size="9.5" fill="${bad ? '#f87171' : '#86efac'}">${bad ? L('spacing / wall distance exceeded', 'تجاوز التباعد / المسافة من الجدار') : L('coverage OK', 'التغطية سليمة')}</text>
  </svg>`,
  };
}

function tabBeam(root) {
  const K = kit(root);
  const P = { dist: 60, H: 12, depth: 0.45, sp: 15, obsc: 0, dirt: 0, drift: 0, auto: false, th: 35, delay: 10 };
  const S = { t: 0, corr: 0, comp: 0, buf: [], fireT: 0, latched: null, fault: null, block: 0, rapid: false, prevStatus: '' };
  root.innerHTML = lay(
    card('📡 ' + L('Projected-beam smoke detector — reflective type', 'كاشف الدخان بالشعاع الضوئي المسقط — النوع العاكس'), beamSvg()
      + `<div class="adv-legend"><span><i style="background:#ff4d4d"></i>${L('IR beam (drawn visible) — out & return', 'شعاع تحت أحمر (مرئي للتوضيح) — ذهاب وعودة')}</span><span><i style="background:#9aa3ad"></i>${L('smoke layer under roof', 'طبقة الدخان تحت السقف')}</span><span>${L('Alignment error exaggerated for visibility', 'خطأ المحاذاة مُضخَّم للتوضيح')}</span></div>`, 'tech-scene')
    + `<div class="adv-stats tech-stats">${sstat('bsS', L('Received signal', 'الإشارة المستقبلة'), '%')}${sstat('bsO', L('Measured obscuration', 'التعتيم المقاس'), '%')}${sstat('bsM', L('Equivalent', 'ما يعادل'), '%/m')}${sstat('bsC', L('Drift compensation', 'تعويض الانحراف'), '%')}${sstat('bsF', L('Alarm delay timer', 'مؤقت تأخير الإنذار'), 's')}${sstat('bsZ', L('Detector status', 'حالة الكاشف'))}</div>`,
    card('🌫️ ' + L('Conditions', 'الظروف'),
      rng('bOb', L('Smoke obscuration across beam', 'تعتيم الدخان على الشعاع'), 0, 100, 1, 0, '%')
      + rng('bDi', L('Lens / reflector contamination (slow)', 'اتساخ العدسة/العاكس (بطيء)'), 0, 80, 1, 0, '%')
      + rng('bDr', L('Building movement (steel expansion, wind)', 'حركة المبنى (تمدد الفولاذ، الرياح)'), 0, 1.5, 0.05, 0, '°')
      + chk('bAu', L('Motorised auto-alignment (auto-aligning head)', 'محاذاة آلية بمحرك (رأس ذاتي المحاذاة)'))
      + `<div class="adv-btns tech-mt"><button class="btn sm warn" id="bBlk">🚜 ${L('Forklift mast blocks beam (3 s)', 'صاري رافعة يحجب الشعاع (3 ث)')}</button><button class="btn sm" id="bRst">↺ ${L('Reset panel', 'إعادة ضبط اللوحة')}</button></div>`)
    + card('🎛️ ' + L('Detector settings', 'إعدادات الكاشف'),
      `<div class="tech-row"><span class="tech-lbl">${L('Fire threshold', 'عتبة الحريق')}</span>${seg('bTh', [[25, '25 %'], [35, '35 %'], [50, '50 %']], 35)}</div>`
      + `<div class="tech-row tech-mt"><span class="tech-lbl">${L('Alarm delay', 'تأخير الإنذار')}</span>${seg('bDl', [[5, '5 s'], [10, '10 s'], [20, '20 s']], 10)}</div>`
      + `<div class="adv-note tech-mt">${L('A rapid loss of > 90 % signal (solid object) is reported as a FAULT, not a fire. Slow signal loss (dirt) is compensated automatically.', 'فقدان سريع لأكثر من 90٪ من الإشارة (جسم صلب) يُبلَّغ كعطل وليس حريقاً. أما الفقدان البطيء (الاتساخ) فيُعوَّض آلياً.')}</div>`)
    + card('📐 ' + L('Geometry', 'الأبعاد'),
      rng('bDs', L('Beam length (detector → reflector)', 'طول الشعاع (الكاشف ← العاكس)'), 5, 120, 1, P.dist, 'm')
      + rng('bH', L('Ceiling height', 'ارتفاع السقف'), 4, 30, 0.5, P.H, 'm')
      + rng('bDp', L('Beam depth below ceiling', 'عمق الشعاع تحت السقف'), 0.1, 1.5, 0.05, P.depth, 'm')
      + rng('bSp', L('Spacing between beams', 'التباعد بين الأشعة'), 6, 25, 0.5, P.sp, 'm')),
  ) + `<div class="adv-grid c2">${card('🗺️ ' + L('Plan — beam spacing', 'مخطط — تباعد الأشعة'), '<div id="bPlan"></div>')}${card('✅ ' + L('Design check', 'تدقيق التصميم'), '<div class="adv-findings" id="bChk"></div>')}</div>`
    + card('📝 ' + L('Event log', 'سجل الأحداث'), '<div class="adv-log" id="bLog"></div>')
    + explain([
      L('The transmitter sends a modulated infra-red beam to a prism reflector (or a separate receiver). Smoke crossing the beam attenuates the returned signal; the detector alarms when the <b>total obscuration along the path</b> exceeds the threshold (typically 25–50 %) for the alarm delay.', 'يرسل المرسل شعاعاً تحت أحمر مُعدَّلاً إلى عاكس منشوري (أو مستقبل منفصل). يُضعف الدخان العابر الإشارة المرتدة، ويصدر الكاشف إنذاراً عندما يتجاوز <b>التعتيم الكلي على طول المسار</b> العتبة (عادة 25–50٪) لمدة تأخير الإنذار.'),
      L('Because it integrates over the whole length, a 35 % threshold over 60 m equals only ~0.7 %/m — ideal for large, high spaces where smoke dilutes and stratifies.', 'لأنه يجمع على كامل الطول، فإن عتبة 35٪ على 60 م تعادل ~0.7 %/م فقط — مثالي للمساحات الكبيرة والعالية حيث يتخفف الدخان ويتطبّق.'),
      L('Drift compensation slowly tracks dirt on the optics; a sudden total loss (object, ladder, forklift) is a fault. Building movement can misalign the beam and imitate smoke — use rigid mounting or auto-aligning heads.', 'يتتبع تعويض الانحراف الاتساخ ببطء؛ أما الفقدان المفاجئ الكامل (جسم، سلم، رافعة) فهو عطل. قد تسبب حركة المبنى انحراف الشعاع ومحاكاة الدخان — استخدم تثبيتاً صلباً أو رؤوساً ذاتية المحاذاة.'),
    ], [
      L('NFPA 72 §17.7.3.7: install per the manufacturer’s published instructions; beam length within the listed range (typically 5–100 m); mirrors, if permitted, reduce the range.', 'NFPA 72 §17.7.3.7: التركيب حسب تعليمات المصنّع المنشورة؛ طول الشعاع ضمن المدى المعتمد (عادة 5–100 م)؛ المرايا إن سُمح بها تقلل المدى.'),
      L('Typical listing: beam 0.3–0.6 m below the ceiling, max 18 m between beams and 9 m to a side wall (smooth ceiling); reduce spacing for beams/pitched roofs per NFPA 72 §17.7.3.2.', 'الاعتماد النموذجي: الشعاع على عمق 0.3–0.6 م تحت السقف، بحد أقصى 18 م بين الأشعة و9 م من الجدار الجانبي (سقف أملس)؛ قلّل التباعد في الأسقف ذات الجسور أو المائلة وفق NFPA 72 §17.7.3.2.'),
      L('Mount on solid structure (masonry, main columns) — never on cladding or purlins that move with temperature; keep the beam path clear of cranes, racking and doors.', 'ثبّت على هيكل صلب (بناء، أعمدة رئيسية) — وليس على الألواح أو المدادات التي تتحرك مع الحرارة؛ حافظ على مسار الشعاع خالياً من الرافعات والرفوف والأبواب.'),
      L('Very high ceilings (> ~25 m) or stratification: add a second level of beams lower down or use ASD.', 'الأسقف العالية جداً (> ~25 م) أو التطبّق الحراري: أضف مستوى ثانياً من الأشعة أدنى أو استخدم ASD.'),
      L('Commissioning & annual test: alignment signal within manufacturer window, test filters (calibrated obscuration) for alarm, full block for fault; clean optics.', 'الاستلام والاختبار السنوي: إشارة المحاذاة ضمن نافذة المصنّع، مرشحات اختبار (تعتيم معايَر) للإنذار، وحجب كامل للعطل؛ تنظيف البصريات.'),
    ]);

  const logS = (m, c) => K.log('bLog', S.t, m, c);
  function geom() {
    const py = 296 / P.H, by = 46 + clamp(P.depth * py * 4, 6, 150);
    const res = Math.abs(P.drift - S.corr);
    const hits = res < 0.45;
    const off = (res / 0.45) * 14;
    const ang = Math.atan2(off, 760) * 180 / Math.PI;
    const endY = by + off;
    K.attr('bTx', 'transform', `translate(0 ${by}) rotate(${ang.toFixed(2)} 64 0)`);
    K.attr('bRef', 'transform', `translate(0 ${by})`);
    K.attr('bTxL', 'y', by + 26); K.attr('bRfL', 'y', by + 30);
    K.attr('bOut', 'd', `M84 ${by} L${hits ? 838 : 900} ${hits ? endY : by + off * 816 / 760}`);
    K.attr('bRet', 'd', hits ? `M838 ${by + 4} L84 ${by + 4}` : '');
    K.attr('bMiss', 'cx', 845); K.attr('bMiss', 'cy', endY); K.attr('bMiss', 'opacity', hits ? 0 : 1);
    K.$('bDim').innerHTML = `<line x1="20" y1="46" x2="20" y2="346" stroke="#fbbf24" stroke-width="1"/><path d="M16 50 l4 -6 4 6 M16 342 l4 6 4 -6" stroke="#fbbf24" fill="none"/>
      <text x="16" y="200" font-size="10.5" fill="#fbbf24" text-anchor="middle" transform="rotate(-90 16 200)">H = ${P.H} m</text>
      <line x1="100" y1="46" x2="100" y2="${by}" stroke="#86efac"/><text x="104" y="${46 + (by - 46) / 2 + 12}" font-size="9.5" fill="#86efac">${P.depth.toFixed(2)} m</text>
      <line x1="46" y1="366" x2="854" y2="366" stroke="#cbd5e1"/><path d="M52 362 l-6 4 6 4 M848 362 l6 4 -6 4" stroke="#cbd5e1" fill="none"/>
      <rect x="400" y="357" width="100" height="18" rx="9" fill="#0f172a"/><text x="450" y="370" text-anchor="middle" font-size="11" fill="#e2e8f0" font-weight="700">${P.dist} m</text>`;
    return hits ? Math.exp(-((res / 0.25) ** 2)) : 0;
  }
  function checks() {
    const pl = beamPlan(P);
    K.$('bPlan').innerHTML = pl.svg;
    const f = [];
    const add = (cls, ic, msg, ref) => f.push(`<div class="adv-finding ${cls}"><span class="ic">${ic}</span><span>${msg}</span><span class="ref">${ref}</span></div>`);
    if (P.dist > 100) add('error', '❌', L(`Beam length ${n(P.dist, 0, 'm')} exceeds the typical listed maximum of 100 m.`, `طول الشعاع ${n(P.dist, 0, 'م')} يتجاوز الحد الأقصى المعتمد النموذجي 100 م.`), '§17.7.3.7');
    else if (P.dist < 8) add('warn', '⚠️', L(`Beam length ${n(P.dist, 0, 'm')} is below most listings’ minimum (5–10 m) — use a short-range kit or spot detectors.`, `طول الشعاع ${n(P.dist, 0, 'م')} أقل من الحد الأدنى في أغلب الاعتمادات (5–10 م) — استخدم طقماً قصير المدى أو كواشف نقطية.`), 'MI');
    else add('ok', '✅', L(`Beam length ${n(P.dist, 0, 'm')} within listed range.`, `طول الشعاع ${n(P.dist, 0, 'م')} ضمن المدى المعتمد.`), '§17.7.3.7');
    if (P.depth < 0.3) add('warn', '⚠️', L('Beam closer than 0.3 m to the ceiling — may sit in the dead-air / hot layer and miss cool early smoke.', 'الشعاع أقرب من 0.3 م للسقف — قد يقع في طبقة الهواء الميت/الساخن ويفوت الدخان المبكر البارد.'), 'MI');
    else if (P.depth > 0.6) add('warn', '⚠️', L('Beam more than 0.6 m below ceiling — outside typical listing; justify for stratification only.', 'الشعاع أعمق من 0.6 م تحت السقف — خارج الاعتماد النموذجي؛ يُبرَّر فقط لمعالجة التطبّق.'), 'MI');
    else add('ok', '✅', L('Beam depth 0.3–0.6 m below ceiling.', 'عمق الشعاع 0.3–0.6 م تحت السقف.'), 'MI');
    if (P.sp > 18) add('error', '❌', L(`Spacing ${n(P.sp, 1, 'm')} > 18 m maximum between beams.`, `التباعد ${n(P.sp, 1, 'م')} > 18 م الحد الأقصى بين الأشعة.`), 'MI / §17.7.3.7');
    else add('ok', '✅', L(`Spacing ${n(P.sp, 1, 'm')} ≤ 18 m; first beam ${n(P.sp / 2, 1, 'm')} from wall (≤ 9 m).`, `التباعد ${n(P.sp, 1, 'م')} ≤ 18 م؛ أول شعاع على ${n(P.sp / 2, 1, 'م')} من الجدار (≤ 9 م).`), 'MI');
    if (pl.lastEdge > P.sp / 2 + 0.01) add('error', '❌', L(`Last beam leaves ${n(pl.lastEdge, 1, 'm')} to the far wall (> S/2) — add a beam.`, `آخر شعاع يترك ${n(pl.lastEdge, 1, 'م')} حتى الجدار البعيد (> S/2) — أضف شعاعاً.`), 'MI');
    if (P.H > 25) add('error', '❌', L('Ceiling > 25 m: stratification likely — add a lower level of beams or use ASD.', 'السقف > 25 م: التطبّق محتمل — أضف مستوى أدنى من الأشعة أو استخدم ASD.'), 'A.17.7.1.10');
    else if (P.H > 15) add('warn', '⚠️', L('High ceiling: assess stratification (NFPA 72 Annex A) — consider a second level of beams.', 'سقف عالٍ: قيّم التطبّق (ملحق NFPA 72 A) — فكّر بمستوى ثانٍ من الأشعة.'), 'A.17.7.1.10');
    if (P.drift > 0.1 && !P.auto) add('warn', '⚠️', L('Building movement detected at the mounting: fix to rigid structure or use auto-aligning detectors.', 'رُصدت حركة المبنى عند التثبيت: ثبّت على هيكل صلب أو استخدم كواشف ذاتية المحاذاة.'), '§17.7.3.7');
    K.$('bChk').innerHTML = f.join('');
  }
  const STATUS = {
    normal: [L('Normal', 'طبيعي'), 'ok'], fire: [L('FIRE', 'حريق'), 'alarm'], false: [L('FALSE FIRE', 'حريق كاذب'), 'alarm'],
    block: [L('FAULT – beam blocked', 'عطل – الشعاع محجوب'), 'warn'], comp: [L('FAULT – clean optics', 'عطل – نظّف البصريات'), 'warn'], align: [L('FAULT – alignment lost', 'عطل – فقدان المحاذاة'), 'warn'],
  };
  function tick() {
    const dt = 0.2; S.t += dt;
    if (P.auto) { const d = P.drift - S.corr; S.corr += clamp(d, -0.15 * dt, 0.15 * dt); } else S.corr = 0;
    S.comp += clamp(Math.min(P.dirt / 100, 0.6) - S.comp, -0.03 * dt, 0.03 * dt);
    if (S.block > 0) S.block -= dt;
    const align = geom();
    const signal = (1 - P.obsc / 100) * (1 - P.dirt / 100) * align * (S.block > 0 ? 0.02 : 1);
    const eff = clamp(1 - signal / (1 - S.comp), 0, 1);
    S.buf.push(eff); if (S.buf.length > 10) S.buf.shift();
    const old = S.buf[0];
    if (eff >= 0.9 && old < 0.5) S.rapid = true;
    if (eff < 0.5) S.rapid = false;
    let status = 'normal';
    if (S.latched) status = S.latched;
    else if (align === 0) status = 'align';
    else if (eff >= 0.9 && S.rapid) status = 'block';
    else if (P.dirt / 100 > 0.6) status = 'comp';
    if (!S.latched && status === 'normal' && eff * 100 >= P.th) {
      S.fireT += dt;
      if (S.fireT >= P.delay) {
        const smokeOnly = P.obsc >= P.th;
        S.latched = smokeOnly ? 'fire' : 'false'; status = S.latched;
        logS(smokeOnly ? L(`FIRE ALARM — obscuration ${(eff * 100).toFixed(0)} % ≥ ${P.th} % for ${P.delay} s`, `إنذار حريق — تعتيم ${(eff * 100).toFixed(0)}٪ ≥ ${P.th}٪ لمدة ${P.delay} ث`)
          : L(`UNWANTED ALARM — signal loss caused by misalignment/dirt, not smoke (${P.obsc} % smoke)`, `إنذار غير مرغوب — فقدان إشارة بسبب انحراف/اتساخ وليس دخان (${P.obsc}٪ دخان)`), 'fire');
      }
    } else if (!S.latched) S.fireT = 0;
    if (status !== S.prevStatus) {
      if (['block', 'comp', 'align'].includes(status)) logS(STATUS[status][0], 'trouble');
      if (status === 'normal' && S.prevStatus) logS(L('Normal', 'طبيعي'), 'ok');
      S.prevStatus = status;
    }
    const eqm = eff > 0 && eff < 1 ? (1 - (1 - eff) ** (1 / P.dist)) * 100 : eff >= 1 ? 100 : 0;
    K.st('bsS', (signal * 100).toFixed(0), signal < 0.5 ? 'warn' : 'ok');
    K.st('bsO', (eff * 100).toFixed(1), eff * 100 >= P.th ? 'alarm' : eff > 0.1 ? 'warn' : 'ok');
    K.st('bsM', eqm.toFixed(2), '');
    K.st('bsC', (S.comp * 100).toFixed(0), S.comp >= 0.6 ? 'warn' : '');
    K.st('bsF', `${S.fireT.toFixed(1)} / ${P.delay}`, S.fireT > 0 ? 'warn' : '');
    K.st('bsZ', STATUS[status][0], STATUS[status][1]);
    K.attr('bLed', 'fill', status === 'fire' || status === 'false' ? '#ef4444' : status === 'normal' ? '#22c55e' : '#f59e0b');
    K.attr('bOut', 'opacity', (0.5 + 0.5 * (1 - P.dirt / 100)).toFixed(2));
    K.attr('bRet', 'opacity', clamp(signal * 1.2, 0.08, 1).toFixed(2));
    K.attr('bPlume', 'opacity', clamp(P.obsc / 60, 0, 1).toFixed(2));
    K.attr('bDirt', 'opacity', (P.dirt / 100 * 0.9).toFixed(2));
  }
  const timer = setInterval(tick, 200);
  K.onRange('bOb', (v) => { P.obsc = v; });
  K.onRange('bDi', (v) => { P.dirt = v; });
  K.onRange('bDr', (v) => { P.drift = v; checks(); }, (v) => v.toFixed(2));
  K.onChk('bAu', (v) => { P.auto = v; checks(); });
  K.onSeg('bTh', (v) => { P.th = +v; });
  K.onSeg('bDl', (v) => { P.delay = +v; });
  K.onRange('bDs', (v) => { P.dist = v; checks(); });
  K.onRange('bH', (v) => { P.H = v; checks(); });
  K.onRange('bDp', (v) => { P.depth = v; checks(); }, (v) => v.toFixed(2));
  K.onRange('bSp', (v) => { P.sp = v; checks(); });
  K.$('bBlk').onclick = () => { S.block = 3; logS(L('Object in beam path', 'جسم في مسار الشعاع'), 'info'); };
  K.$('bRst').onclick = () => { S.latched = null; S.fireT = 0; logS(L('Panel reset', 'إعادة ضبط اللوحة'), 'ok'); };
  checks(); tick();
  logS(L('Beam aligned — signal 100 %, reference stored', 'تمت محاذاة الشعاع — الإشارة 100٪، حُفظت القيمة المرجعية'), 'ok');
  return () => clearInterval(timer);
}

/* ═════════════════════════ 3. FLAME DETECTORS ═════════════════════════ */
const FT = {
  uv: { name: 'UV', R0: 15, t0: 0.5, uv: true, ir: false },
  ir: { name: 'IR (4.4 µm)', R0: 15, t0: 2.5, uv: false, ir: true },
  uvir: { name: 'UV/IR', R0: 15, t0: 2.5, uv: true, ir: true },
  ir3: { name: 'IR3', R0: 65, t0: 3, uv: false, ir: true, ir3: true },
};
const TANKS = [[17, 16, 7, 'T-101'], [40, 16, 7, 'T-102'], [17, 36, 7, 'T-103'], [40, 36, 7, 'T-104']];
const FX0 = 30, FY0 = 20, FS = 10; // plan origin & px per m (80 × 50 m)
const fpx = (x, y) => [FX0 + x * FS, FY0 + y * FS];
function losBlocked(ax, ay, bx, by) {
  return TANKS.some(([cx, cy, r]) => {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const t = clamp(((cx - ax) * dx + (cy - ay) * dy) / (l2 || 1), 0, 1);
    const px = ax + t * dx - cx, py = ay + t * dy - cy;
    const inside = (bx - cx) ** 2 + (by - cy) ** 2 < r * r;
    return !inside && px * px + py * py < r * r;
  });
}
function flameSvg() {
  const tanks = TANKS.map(([x, y, r, id]) => {
    const [cx, cy] = fpx(x, y);
    const R = r * FS;
    let ribs = '';
    for (let a = 0; a < 360; a += 30) ribs += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos((a * Math.PI) / 180) * (R - 4)}" y2="${cy + Math.sin((a * Math.PI) / 180) * (R - 4)}" stroke="#9ca3af" stroke-width=".8"/>`;
    return `<g filter="url(#fSh)"><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#fTank)" stroke="#6b7280" stroke-width="2"/></g>${ribs}<circle cx="${cx}" cy="${cy}" r="${R - 4}" fill="none" stroke="#d1d5db" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="6" fill="#e5e7eb" stroke="#6b7280"/>
      <rect x="${cx - 26}" y="${cy + 10}" width="52" height="16" rx="8" fill="#0f172a" opacity=".8"/><text x="${cx}" y="${cy + 22}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#f8fafc">${id}</text>`;
  }).join('');
  const [bx, by] = fpx(6, 5);
  const [px, py] = fpx(58, 7);
  const [lx, ly] = fpx(57, 30);
  return `<svg viewBox="0 0 860 540" class="adv-svg tech-svg" id="fSvg" style="cursor:crosshair">
  <defs>
    <linearGradient id="fGnd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b5445"/><stop offset="1" stop-color="#3a4138"/></linearGradient>
    <pattern id="fGrav" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="url(#fGnd)"/><circle cx="3" cy="4" r=".9" fill="#6b7563"/><circle cx="10" cy="9" r=".8" fill="#2f352c"/><circle cx="7" cy="12" r=".6" fill="#737d6a"/></pattern>
    <radialGradient id="fTank" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#f8fafc"/><stop offset=".6" stop-color="#cbd5e1"/><stop offset="1" stop-color="#8b95a3"/></radialGradient>
    <radialGradient id="fCone"><stop offset="0" stop-color="#38bdf8" stop-opacity=".45"/><stop offset="1" stop-color="#38bdf8" stop-opacity=".06"/></radialGradient>
    <radialGradient id="fCone2"><stop offset="0" stop-color="#a78bfa" stop-opacity=".45"/><stop offset="1" stop-color="#a78bfa" stop-opacity=".06"/></radialGradient>
    <radialGradient id="fFire"><stop offset="0" stop-color="#fff7ed"/><stop offset=".3" stop-color="#fde047"/><stop offset=".65" stop-color="#f97316"/><stop offset="1" stop-color="#dc2626" stop-opacity="0"/></radialGradient>
    <filter id="fSh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="3" dy="4" stdDeviation="3" flood-opacity=".5"/></filter>
    <clipPath id="fClip"><rect x="${FX0}" y="${FY0}" width="800" height="500"/></clipPath>
  </defs>
  <rect width="860" height="540" rx="10" fill="#1b2027"/>
  <rect x="${FX0}" y="${FY0}" width="800" height="500" fill="url(#fGrav)"/>
  <rect x="${bx}" y="${by}" width="${46 * FS}" height="${42 * FS}" fill="#5a5a50" fill-opacity=".35" stroke="#a8a29e" stroke-width="5" rx="2"/>
  <text x="${bx + 8}" y="${by + 16}" font-size="10" fill="#e7e5e4">${L('Bund wall (secondary containment)', 'جدار الحوض (احتواء ثانوي)')}</text>
  <path d="M${fpx(52, 26)[0]} ${fpx(52, 26)[1]} H${fpx(58, 26)[0]} M${fpx(46, 16)[0]} ${fpx(46, 16)[1]} H${fpx(52, 16)[0]} V${fpx(52, 26)[1]} M${fpx(46, 36)[0]} ${fpx(46, 36)[1]} H${fpx(52, 36)[0]} V${fpx(52, 26)[1]} M${fpx(58, 12)[0]} ${fpx(58, 12)[1]} H${fpx(55, 12)[0]} V${fpx(55, 26)[1]} M${fpx(55, 26)[0]} ${fpx(55, 26)[1]} V${fpx(55, 36)[1]} H${fpx(58, 36)[0]}" stroke="#94a3b8" stroke-width="4" fill="none"/>
  <rect x="${px}" y="${py}" width="${18 * FS}" height="${11 * FS}" fill="#374151" stroke="#9ca3af" stroke-width="1.5" rx="3"/>
  ${[0, 1, 2].map((i) => `<g><rect x="${px + 16 + i * 52}" y="${py + 34}" width="34" height="18" rx="4" fill="#1d4ed8" stroke="#93c5fd"/><circle cx="${px + 33 + i * 52}" cy="${py + 64}" r="9" fill="#475569" stroke="#cbd5e1"/></g>`).join('')}
  <text x="${px + 90}" y="${py + 20}" text-anchor="middle" font-size="10.5" fill="#f1f5f9" font-weight="600">${L('Transfer pumps', 'مضخات النقل')}</text>
  <rect x="${lx}" y="${ly}" width="${20 * FS}" height="${15 * FS}" fill="#2d3340" stroke="#fbbf24" stroke-dasharray="6 4" stroke-width="1.5" rx="3"/>
  <g transform="translate(${lx + 28} ${ly + 52})"><rect width="122" height="40" rx="18" fill="url(#fTank)" stroke="#6b7280"/><rect x="122" y="4" width="30" height="32" rx="5" fill="#b91c1c" stroke="#7f1d1d"/><rect x="140" y="8" width="9" height="24" rx="2" fill="#93c5fd" opacity=".8"/></g>
  <text x="${lx + 100}" y="${ly + 20}" text-anchor="middle" font-size="10.5" fill="#fde68a" font-weight="600">${L('Road tanker loading bay', 'منصة تعبئة الصهاريج')}</text>
  <g id="fCov" clip-path="url(#fClip)"></g>
  <g id="fLobes" clip-path="url(#fClip)"></g>
  ${tanks}
  <g id="fLos"></g>
  <g id="fFireG" class="tech-fire-pulse"><circle r="26" fill="url(#fFire)" opacity=".55"/><path d="M-9 8 C-12 -4 -4 -8 -3 -18 C2 -10 10 -6 9 8 Z" fill="#f97316" class="tech-flick"/><path d="M-5 8 C-6 0 -1 -3 0 -10 C3 -4 6 0 5 8 Z" fill="#fde047" class="tech-flick" style="animation-delay:-.2s"/></g>
  <g id="fDets"></g>
  <g id="fFalse"></g>
  <line x1="${FX0 + 20}" y1="${FY0 + 486}" x2="${FX0 + 120}" y2="${FY0 + 486}" stroke="#f8fafc" stroke-width="2"/><text x="${FX0 + 70}" y="${FY0 + 480}" text-anchor="middle" font-size="10" fill="#f8fafc">10 m</text>
  <g transform="translate(${FX0 + 780} ${FY0 + 26})"><path d="M0 -16 L6 2 L0 -3 L-6 2 Z" fill="#f8fafc"/><text y="16" text-anchor="middle" font-size="10" fill="#f8fafc">N</text></g>
</svg>`;
}

function tabFlame(root) {
  const K = kit(root);
  const P = { type: 'ir3', cone: 90, area: 0.1, b1: 35, b2: 215, fire: [48, 26], vote: '2', cov: true, weld: false, sun: false, hot: false, xray: false, smoke: false };
  const DET = [{ id: 'D1', x: 2, y: 2 }, { id: 'D2', x: 78, y: 48 }];
  root.innerHTML = lay(
    card('🔥 ' + L('Flame detection — tank farm plan (click to place the fire)', 'كشف اللهب — مخطط مزرعة الخزانات (انقر لوضع الحريق)'), flameSvg()
      + `<div class="adv-legend"><span><i style="background:#38bdf8"></i>D1 ${L('field of view / sensitivity lobe', 'مجال الرؤية / فص الحساسية')}</span><span><i style="background:#a78bfa"></i>D2</span><span><i style="background:rgba(34,197,94,.55)"></i>${L('seen by 2 detectors', 'مرئي لكاشفين')}</span><span><i style="background:rgba(234,179,8,.5)"></i>${L('seen by 1', 'مرئي لكاشف واحد')}</span><span>${L('tanks shadow the view (line of sight)', 'الخزانات تحجب الرؤية (خط النظر)')}</span></div>`, 'tech-scene')
    + `<div class="adv-stats tech-stats">${sstat('fsR', L('Rated range for this fire', 'المدى المقنن لهذا الحريق'), 'm')}${sstat('fsV', L('Detectors in alarm', 'كواشف في إنذار'))}${sstat('fsA', L('Output: Fire alarm', 'مخرج: إنذار حريق'))}${sstat('fsX', L('Output: Release (deluge/foam)', 'مخرج: إطلاق (غمر/رغوة)'))}${sstat('fsC', L('Area covered ×2 (voting)', 'المساحة المغطاة ×2 (تصويت)'), '%')}</div>`
    + card('📋 ' + L('Detector readouts', 'قراءات الكواشف'), '<div class="adv-scroll tech-tbl" id="fTbl"></div>'),
    card('🔬 ' + L('Detector technology', 'تقنية الكاشف'),
      seg('fTy', [['uv', 'UV'], ['ir', 'IR'], ['uvir', 'UV/IR'], ['ir3', 'IR3']], P.type)
      + `<div class="tech-row tech-mt"><span class="tech-lbl">${L('Cone of vision', 'مخروط الرؤية')}</span>${seg('fCo', [[90, '90°'], [120, '120°']], 90)}</div>`
      + `<div class="adv-note tech-mt" id="fTyN"></div>`)
    + card('🎯 ' + L('Fire & aiming', 'الحريق والتوجيه'),
      rng('fAr', L('n-heptane pan fire size', 'حجم حريق حوض n-heptane'), 0.05, 2, 0.05, P.area, 'm²')
      + rng('fB1', L('D1 bearing', 'اتجاه D1'), 0, 359, 1, P.b1, '°')
      + rng('fB2', L('D2 bearing', 'اتجاه D2'), 0, 359, 1, P.b2, '°')
      + chk('fCv', L('Show coverage map (2.5 m grid)', 'إظهار خريطة التغطية (شبكة 2.5 م)'), true)
      + `<div class="tech-row tech-mt"><span class="tech-lbl">${L('Release voting', 'تصويت الإطلاق')}</span>${seg('fVo', [['1', '1ooN'], ['2', '2ooN']], '2')}</div>`)
    + card('⚡ ' + L('Nuisance sources in view', 'مصادر إزعاج في مجال الرؤية'),
      chk('fW', L('Arc welding (strong UV)', 'لحام قوسي (أشعة UV قوية)')) + chk('fS', L('Sunlight reflection off water (modulated IR)', 'انعكاس الشمس على الماء (IR مُعدَّل)'))
      + chk('fH', L('Hot body: vibrating hot exhaust ~400 °C (IR)', 'جسم ساخن: عادم مهتز ~400°م (IR)')) + chk('fX', L('Lightning / X-ray NDT (UV)', 'برق / تصوير إشعاعي (UV)'))
      + chk('fM', L('Dense smoke / oil film on window', 'دخان كثيف / طبقة زيت على النافذة'))),
  ) + card('🧠 ' + L('Spectral voting — which channels respond?', 'التصويت الطيفي — أي القنوات تستجيب؟'), '<div class="adv-scroll tech-tbl" id="fMat"></div>')
    + explain([
      L('Flames emit UV (185–260 nm, solar-blind band) and a strong CO₂ emission peak at 4.3–4.4 µm that flickers at 1–15 Hz. UV detectors are very fast; IR detectors look for the flickering 4.4 µm peak.', 'تُصدر اللهب أشعة UV (185–260 نانومتر، نطاق لا يتأثر بالشمس) وذروة انبعاث CO₂ قوية عند 4.3–4.4 ميكرومتر تتذبذب بين 1–15 هرتز. كواشف UV سريعة جداً؛ وكواشف IR تبحث عن ذروة 4.4 ميكرومتر المتذبذبة.'),
      L('Combined UV/IR requires <b>both</b> channels (AND voting) — rejecting welding (UV only) and hot bodies/sunlight (IR only). IR3 compares three IR bands (flame peak + two reference bands) and gives the longest range with the best false-alarm immunity.', 'يتطلب UV/IR المدمج <b>كلا</b> القناتين (تصويت AND) — فيرفض اللحام (UV فقط) والأجسام الساخنة/الشمس (IR فقط). يقارن IR3 ثلاث نطاقات IR (ذروة اللهب + نطاقين مرجعيين) ويعطي أطول مدى وأفضل مناعة ضد الإنذار الكاذب.'),
      L('Radiant flux falls with the square of distance (inverse-square law): to see a fire twice as far away it must be four times bigger. Range = R₀·√(A/0.1 m²), and it reduces toward the edge of the cone (~50 % at the edge).', 'يتناقص الإشعاع مع مربع المسافة (قانون التربيع العكسي): لرؤية حريق على ضعف المسافة يجب أن يكون أكبر أربع مرات. المدى = R₀·√(A/0.1 م²)، وينخفض نحو حافة المخروط (~50٪ عند الحافة).'),
      L('For automatic release (deluge, foam) use 2ooN voting — two detectors must see the fire — to avoid a spurious discharge; one detector alone gives the alarm.', 'للإطلاق الآلي (غمر، رغوة) استخدم تصويت 2ooN — يجب أن يرى كاشفان الحريق — لتجنب التفريغ الخاطئ؛ ويكفي كاشف واحد لإعطاء الإنذار.'),
    ], [
      L('NFPA 72 §17.8: spacing and location are based on the listed field of view and the distance at which the <b>design fire</b> (e.g. 0.1 m² n-heptane) is detected; every point of the hazard must be seen by the required number of detectors.', 'NFPA 72 §17.8: يعتمد التباعد والموقع على مجال الرؤية المعتمد والمسافة التي يُكشف عندها <b>حريق التصميم</b> (مثل 0.1 م² n-heptane)؛ يجب أن يُرى كل جزء من الخطر بالعدد المطلوب من الكواشف.'),
      L('Produce a 3-D coverage map (mapping study): tanks, vessels and pipe racks cast shadows; mount high, tilted down 10–45°, looking away from the sun horizon.', 'أعدّ خريطة تغطية ثلاثية الأبعاد: الخزانات والأوعية وحوامل الأنابيب تُلقي ظلالاً؛ ركّب عالياً مائلاً للأسفل 10–45° بعيداً عن أفق الشمس.'),
      L('Hazardous areas: use certified Ex d / Ex e housings; stainless swivel mounts; keep the window clean (self-test / "through-the-lens" BIT).', 'المناطق الخطرة: استخدم أغلفة معتمدة Ex d / Ex e؛ حوامل دوارة من الفولاذ المقاوم للصدأ؛ حافظ على نظافة النافذة (اختبار ذاتي عبر العدسة BIT).'),
      L('Commissioning: test each detector with the manufacturer’s flame simulator at the rated distance, verify response time, voting and cause & effect; record the aiming angles.', 'الاستلام: اختبر كل كاشف بمحاكي اللهب من المصنّع على المسافة المقننة، وتحقق من زمن الاستجابة والتصويت والسبب والنتيجة؛ سجّل زوايا التوجيه.'),
    ]);

  const svg = K.$('fSvg');
  const range = () => FT[P.type].R0 * Math.sqrt(P.area / 0.1) * (P.smoke && FT[P.type].uv ? 0.35 : 1);
  const bearing = (i) => (i === 0 ? P.b1 : P.b2);
  function sees(d, i, x, y) {
    const dx = x - d.x, dy = y - d.y, dist = Math.hypot(dx, dy);
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI - bearing(i);
    ang = ((ang + 540) % 360) - 180;
    const h = P.cone / 2;
    const inCone = Math.abs(ang) <= h;
    const f = inCone ? 1 - 0.75 * (ang / h) ** 2 : 0;
    const blocked = losBlocked(d.x, d.y, x, y);
    const Sr = dist > 0.1 ? (range() ** 2 * f) / dist ** 2 : 99;
    return { dist, ang, inCone, blocked, S: Sr, ok: inCone && !blocked && Sr >= 1 };
  }
  function channels() {
    const t = FT[P.type];
    const uvN = P.weld || P.xray, irN = P.sun || P.hot;
    if (t.ir3) return false;
    if (t.uv && t.ir) return uvN && irN;
    return t.uv ? uvN : irN;
  }
  function drawStatic() {
    const R = range();
    // lobes
    K.$('fLobes').innerHTML = DET.map((d, i) => {
      const h = P.cone / 2, b = bearing(i);
      const [x0, y0] = fpx(d.x, d.y);
      let pts = `${x0},${y0} `;
      for (let a = -h; a <= h + 0.01; a += 3) {
        const r = R * Math.sqrt(1 - 0.75 * (a / h) ** 2) * FS;
        const rad = ((b + a) * Math.PI) / 180;
        pts += `${(x0 + Math.cos(rad) * r).toFixed(1)},${(y0 + Math.sin(rad) * r).toFixed(1)} `;
      }
      const col = i ? '#a78bfa' : '#38bdf8';
      const ax = x0 + Math.cos((b * Math.PI) / 180) * Math.min(R * FS, 900), ay = y0 + Math.sin((b * Math.PI) / 180) * Math.min(R * FS, 900);
      return `<polygon points="${pts}" fill="url(#${i ? 'fCone2' : 'fCone'})" stroke="${col}" stroke-width="1.5" stroke-dasharray="6 4"/><line x1="${x0}" y1="${y0}" x2="${ax}" y2="${ay}" stroke="${col}" stroke-width=".8" stroke-dasharray="2 5" opacity=".8"/>`;
    }).join('');
    // coverage grid
    let g = '', c2 = 0, tot = 0;
    if (P.cov) {
      for (let x = 1.25; x < 80; x += 2.5) for (let y = 1.25; y < 50; y += 2.5) {
        if (TANKS.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < r * r)) continue;
        tot++;
        const c = DET.filter((d, i) => sees(d, i, x, y).ok).length;
        if (c >= 2) c2++;
        if (c) { const [px, py] = fpx(x - 1.25, y - 1.25); g += `<rect x="${px}" y="${py}" width="25" height="25" fill="${c >= 2 ? 'rgba(34,197,94,.33)' : 'rgba(234,179,8,.26)'}"/>`; }
      }
    } else {
      for (let x = 1.25; x < 80; x += 2.5) for (let y = 1.25; y < 50; y += 2.5) {
        if (TANKS.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < r * r)) continue;
        tot++; if (DET.filter((d, i) => sees(d, i, x, y).ok).length >= 2) c2++;
      }
    }
    K.$('fCov').innerHTML = g;
    K.st('fsC', ((c2 / tot) * 100).toFixed(0), c2 / tot > 0.5 ? 'ok' : 'warn');
    // detectors
    K.$('fDets').innerHTML = DET.map((d, i) => {
      const [x, y] = fpx(d.x, d.y);
      const col = i ? '#a78bfa' : '#38bdf8';
      return `<g transform="translate(${x} ${y})"><circle r="11" fill="#0f172a" stroke="${col}" stroke-width="2"/><g transform="rotate(${bearing(i)})"><rect x="-2" y="-6" width="16" height="12" rx="3" fill="#dc2626" stroke="#fecaca"/><rect x="11" y="-4" width="4" height="8" rx="1" fill="#93c5fd"/></g>
        <circle id="fLed${i}" cx="-7" cy="-7" r="3" fill="#22c55e"/><text x="${i ? -16 : 16}" y="${i ? -14 : 24}" text-anchor="${i ? 'end' : 'start'}" font-size="11" font-weight="800" fill="${col}">${d.id}</text></g>`;
    }).join('');
    const t = FT[P.type];
    K.$('fTyN').innerHTML = `<b>${t.name}</b> · ${L('rated', 'مقنن')} ${n(t.R0, 0, 'm')} ${L('for 0.1 m² n-heptane', 'لحريق 0.1 م² n-heptane')} · ${L('response', 'استجابة')} ≈ ${n(t.t0, 1, 's')}` + (P.smoke && t.uv ? `<br>⚠️ ${L('UV is absorbed by smoke and oil films — range reduced ~65 %.', 'تمتص الدخان وطبقات الزيت أشعة UV — ينخفض المدى ~65٪.')}` : '');
    drawFalse(); drawFire();
  }
  function drawFalse() {
    const items = [];
    if (P.weld) items.push([22, 26, '#a5f3fc', L('welding', 'لحام'), '✦']);
    if (P.sun) items.push([62, 46, '#fde047', L('sun glint', 'وهج شمسي'), '☀']);
    if (P.hot) items.push([66, 20, '#fb923c', L('hot exhaust', 'عادم ساخن'), '♨']);
    if (P.xray) items.push([48, 6, '#c4b5fd', L('X-ray / lightning', 'أشعة X / برق'), '⚡']);
    K.$('fFalse').innerHTML = items.map(([x, y, c, l, ic]) => { const [px, py] = fpx(x, y); return `<g transform="translate(${px} ${py})"><circle r="14" fill="${c}" opacity=".25" class="tech-blink"/><text y="5" text-anchor="middle" font-size="15" fill="${c}">${ic}</text><text y="26" text-anchor="middle" font-size="9.5" fill="${c}" font-weight="700">${l}</text></g>`; }).join('');
  }
  function drawFire() {
    const [fx0, fy0] = fpx(P.fire[0], P.fire[1]);
    const sc = clamp(0.6 + Math.sqrt(P.area) * 0.9, 0.6, 2);
    K.attr('fFireG', 'transform', `translate(${fx0} ${fy0}) scale(${sc.toFixed(2)})`);
    const nuis = channels();
    const rs = DET.map((d, i) => ({ d, i, ...sees(d, i, P.fire[0], P.fire[1]) }));
    K.$('fLos').innerHTML = rs.map((r) => {
      const [x, y] = fpx(r.d.x, r.d.y);
      const c = r.ok ? '#22c55e' : r.blocked ? '#ef4444' : '#94a3b8';
      return `<line x1="${x}" y1="${y}" x2="${fx0}" y2="${fy0}" stroke="${c}" stroke-width="${r.ok ? 2.4 : 1.6}" stroke-dasharray="${r.ok ? '' : '5 5'}" opacity=".95"/>`
        + `<rect x="${(x + fx0) / 2 - 24}" y="${(y + fy0) / 2 - 9}" width="48" height="17" rx="8.5" fill="#0f172a" stroke="${c}"/><text x="${(x + fx0) / 2}" y="${(y + fy0) / 2 + 3.5}" text-anchor="middle" font-size="10" fill="#f8fafc" font-family="Consolas, monospace">${r.dist.toFixed(1)} m</text>`;
    }).join('');
    let nAl = 0, nFire = 0;
    const rows = rs.map((r) => {
      const fire = r.ok, al = fire || nuis;
      if (al) nAl++; if (fire) nFire++;
      K.attr(`fLed${r.i}`, 'fill', al ? '#ef4444' : '#22c55e');
      const tA = fire ? FT[P.type].t0 * (1 + 1 / r.S) : null;
      const why = r.blocked ? pill('bad', L('line of sight blocked', 'خط النظر محجوب')) : !r.inCone ? pill('warn', L('outside cone', 'خارج المخروط')) : r.S < 1 ? pill('warn', L('beyond range', 'خارج المدى')) : pill('ok', L('sees fire', 'يرى الحريق'));
      const st = fire ? pill('bad', L('FIRE', 'حريق')) : nuis ? pill('bad', L('FALSE ALARM', 'إنذار كاذب')) : pill('ok', L('normal', 'طبيعي'));
      return `<tr><td><b>${r.d.id}</b></td><td class="num">${r.dist.toFixed(1)} m</td><td class="num">${r.ang.toFixed(0)}°</td><td class="num">${r.inCone && !r.blocked ? r.S.toFixed(2) : '—'}</td><td>${why}</td><td>${st}</td><td class="num">${tA ? tA.toFixed(1) + ' s' : '—'}</td></tr>`;
    }).join('');
    K.$('fTbl').innerHTML = `<table class="adv-table"><thead><tr><th>${L('Det.', 'الكاشف')}</th><th class="num">${L('Distance', 'المسافة')}</th><th class="num">${L('Off-axis', 'الانحراف عن المحور')}</th><th class="num">${L('Signal / threshold', 'الإشارة / العتبة')}</th><th>${L('View', 'الرؤية')}</th><th>${L('Status', 'الحالة')}</th><th class="num">${L('Time to alarm', 'زمن الإنذار')}</th></tr></thead><tbody>${rows}</tbody></table>`;
    const need = +P.vote;
    K.st('fsR', range().toFixed(1), '');
    K.st('fsV', `${nAl} / 2`, nAl ? 'alarm' : 'ok');
    K.st('fsA', nAl ? L('ACTIVE', 'فعّال') : L('off', 'متوقف'), nAl ? (nFire ? 'alarm' : 'warn') : 'ok');
    const rel = nAl >= need;
    K.st('fsX', rel ? (nFire >= need ? L('RELEASED', 'تم الإطلاق') : L('SPURIOUS RELEASE!', 'إطلاق خاطئ!')) : L('inhibited', 'محجوب'), rel ? 'alarm' : 'ok');
    // spectral matrix
    const srcs = [[L('Real hydrocarbon fire', 'حريق هيدروكربوني حقيقي'), 1, 1, 1], [L('Arc welding', 'لحام قوسي'), 1, 0, 0], [L('Sunlight / reflections', 'الشمس / الانعكاسات'), 0, 1, 0], [L('Hot vibrating body', 'جسم ساخن مهتز'), 0, 1, 0], [L('Lightning / X-ray', 'برق / أشعة X'), 1, 0, 0]];
    const resp = (k, u, i, f3) => (k === 'uv' ? u : k === 'ir' ? i : k === 'uvir' ? u && i : f3);
    K.$('fMat').innerHTML = `<table class="adv-table tech-mat"><thead><tr><th>${L('Source', 'المصدر')}</th><th>${L('UV channel', 'قناة UV')}</th><th>${L('IR 4.4 µm', 'IR 4.4 ميكرومتر')}</th>${Object.entries(FT).map(([k, t]) => `<th class="${k === P.type ? 'on' : ''}">${t.name}</th>`).join('')}</tr></thead><tbody>${srcs.map(([s, u, i, f3]) => `<tr><td>${s}</td><td>${u ? '●' : '○'}</td><td>${i ? '●' : '○'}</td>${Object.keys(FT).map((k) => { const a = resp(k, u, i, f3); return `<td class="${k === P.type ? 'on' : ''}">${a ? (f3 ? '🔥 ' + L('alarm', 'إنذار') : '⚠️ ' + L('false alarm', 'إنذار كاذب')) : '✔ ' + L('rejects', 'يرفض')}</td>`; }).join('')}</tr>`).join('')}</tbody></table>
      <div class="adv-note tech-mt">${L('Note: UV/IR can still false-alarm when a UV source and an IR source are present together (e.g. welding next to a hot exhaust) — try it above.', 'ملاحظة: قد يعطي UV/IR إنذاراً كاذباً عند وجود مصدر UV ومصدر IR معاً (مثل لحام بجوار عادم ساخن) — جرّب ذلك أعلاه.')}</div>`;
  }
  svg.addEventListener('click', (e) => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = (p.x - FX0) / FS, y = (p.y - FY0) / FS;
    if (x < 0 || y < 0 || x > 80 || y > 50) return;
    P.fire = [x, y]; drawFire();
  });
  K.onSeg('fTy', (v) => { P.type = v; drawStatic(); });
  K.onSeg('fCo', (v) => { P.cone = +v; drawStatic(); });
  K.onSeg('fVo', (v) => { P.vote = v; drawFire(); });
  K.onRange('fAr', (v) => { P.area = v; drawStatic(); }, (v) => v.toFixed(2));
  K.onRange('fB1', (v) => { P.b1 = v; drawStatic(); });
  K.onRange('fB2', (v) => { P.b2 = v; drawStatic(); });
  K.onChk('fCv', (v) => { P.cov = v; drawStatic(); });
  [['fW', 'weld'], ['fS', 'sun'], ['fH', 'hot'], ['fX', 'xray'], ['fM', 'smoke']].forEach(([id, k]) => K.onChk(id, (v) => { P[k] = v; drawStatic(); }));
  drawStatic();
  return null;
}

/* ═════════════════════════ 4. LINEAR HEAT DETECTION ═════════════════════════ */
const LHD_R = 0.2;       // Ω per metre per conductor
const LHD_LEAD = 1.5;    // Ω lead-in / interface offset
const LHD_EOL = 3300;    // Ω end-of-line resistor
const AN_B = 0.08, AN_D = 536; // analog cable model: conductance ∝ e^(β(T−20)); alarm when ΔG ≥ D
function lhdSvg() {
  let rollers = '', legs = '', clips = '';
  for (let x = 160; x <= 870; x += 36) {
    rollers += `<g><circle cx="${x}" cy="186" r="8" fill="url(#lRoll)" stroke="#1f2937"/><circle cx="${x}" cy="186" r="2" fill="#111827"/></g>`;
    if ((x - 160) % 72 === 0) legs += `<path d="M${x - 10} 196 L${x - 16} 268 M${x + 10} 196 L${x + 16} 268 M${x - 13} 232 H${x + 13}" stroke="#475569" stroke-width="3" fill="none"/>`;
  }
  for (let x = 150; x <= 860; x += 40) clips += `<rect x="${x - 2}" y="86" width="4" height="12" rx="1" fill="#94a3b8"/>`;
  let coal = 'M150 172';
  for (let x = 150; x <= 880; x += 20) coal += ` Q${x + 10} ${160 - ((x * 7) % 9)} ${x + 20} 172`;
  return `<svg viewBox="0 0 900 330" class="adv-svg tech-svg">
  <defs>
    <linearGradient id="lBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171d24"/><stop offset="1" stop-color="#2a323c"/></linearGradient>
    <radialGradient id="lRoll" cx=".35" cy=".35"><stop offset="0" stop-color="#e5e7eb"/><stop offset="1" stop-color="#6b7280"/></radialGradient>
    <radialGradient id="lHotR" cx=".4" cy=".4"><stop offset="0" stop-color="#fff7ed"/><stop offset=".4" stop-color="#fb923c"/><stop offset="1" stop-color="#b91c1c"/></radialGradient>
    <radialGradient id="lGlow"><stop offset="0" stop-color="#f97316" stop-opacity=".9"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient>
    <linearGradient id="lUnit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1f5f9"/><stop offset="1" stop-color="#94a3b8"/></linearGradient>
    <filter id="lSh"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".45"/></filter>
    <filter id="lBl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <rect width="900" height="330" fill="url(#lBg)"/>
  <path d="M0 40 Q450 -10 900 40 V52 Q450 2 0 52 Z" fill="#4b5563"/>
  ${Array.from({ length: 12 }, (_, i) => `<line x1="${40 + i * 76}" y1="${40 - Math.sin(((40 + i * 76) / 900) * Math.PI) * 25}" x2="${40 + i * 76}" y2="56" stroke="#64748b" stroke-width="1.5"/>`).join('')}
  <rect y="268" width="900" height="62" fill="#374151"/><line x1="0" y1="268" x2="900" y2="268" stroke="#6b7280" stroke-width="2"/>
  ${legs}
  <rect x="146" y="226" width="736" height="6" rx="3" fill="#111827"/>
  <path d="${coal} L880 178 L150 178 Z" fill="#0b0b0c"/>
  <rect x="146" y="176" width="736" height="6" rx="3" fill="#1f2937" stroke="#030712"/>
  <path d="M146 179 H882" stroke="#6b7280" stroke-width="1.2" stroke-dasharray="10 16" class="tech-belt"/>
  ${rollers}
  <g id="lHot"><ellipse id="lHotG" cx="0" cy="170" rx="40" ry="60" fill="url(#lGlow)" filter="url(#lBl)" opacity="0"/><circle id="lHotRol" cx="0" cy="186" r="9" fill="url(#lHotR)" opacity="0"/>
    <g id="lShim" opacity="0" class="tech-shim"><path d="M-10 170 q6 -12 0 -24 q-6 -12 0 -24 q6 -12 0 -24" stroke="#fdba74" stroke-width="1.6" fill="none"/><path d="M8 172 q6 -12 0 -24 q-6 -12 0 -24 q6 -12 0 -24" stroke="#fdba74" stroke-width="1.6" fill="none"/></g>
    <g id="lFl" opacity="0"><path d="M-14 176 C-18 158 -6 150 -4 132 C4 146 18 152 14 176 Z" fill="#f97316" class="tech-flick"/><path d="M-6 176 C-8 166 -2 160 0 148 C4 158 9 164 6 176 Z" fill="#fde047" class="tech-flick" style="animation-delay:-.15s"/></g></g>
  <path d="M120 92 H862" stroke="#7f1d1d" stroke-width="7" stroke-linecap="round"/>
  <path d="M120 92 H862" stroke="#dc2626" stroke-width="4.4" stroke-linecap="round"/>
  <path d="M120 90.8 H862" stroke="#fca5a5" stroke-width="1" opacity=".7"/>
  <rect id="lDead" x="0" y="87" width="0" height="10" fill="#0b1118" opacity=".65"/>
  <rect id="lHotC" x="0" y="86" width="10" height="12" rx="3" fill="#fde047" opacity="0"/>
  ${clips}
  <g id="lShort" opacity="0"><circle r="10" fill="#fde047" opacity=".35" class="tech-blink"/><path d="M-5 -10 L2 -1 L-3 1 L4 10" stroke="#fff" stroke-width="2" fill="none"/><rect x="-38" y="-32" width="76" height="17" rx="8.5" fill="#7f1d1d"/><text y="-20" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">SHORT</text></g>
  <g id="lCut" opacity="0"><rect x="-6" y="-8" width="12" height="16" fill="#171d24"/><path d="M-6 -6 l4 4 -4 4 4 4 M6 -6 l-4 4 4 4 -4 4" stroke="#fca5a5" stroke-width="1.5" fill="none"/></g>
  <g filter="url(#lSh)"><rect x="862" y="80" width="30" height="24" rx="3" fill="url(#lUnit)" stroke="#475569"/><text x="877" y="95" text-anchor="middle" font-size="8.5" font-weight="700" fill="#1f2937">EOL</text></g>
  <g filter="url(#lSh)"><rect x="12" y="62" width="108" height="140" rx="8" fill="url(#lUnit)" stroke="#475569"/>
    <rect x="20" y="72" width="92" height="62" rx="4" fill="#0b2a1a" stroke="#14532d"/>
    <text id="lLcd1" x="26" y="88" font-size="10" font-family="Consolas, monospace" fill="#86efac">LHD-01 NORMAL</text>
    <text id="lLcd2" x="26" y="104" font-size="10" font-family="Consolas, monospace" fill="#86efac">R= —</text>
    <text id="lLcd3" x="26" y="120" font-size="10" font-family="Consolas, monospace" fill="#86efac">LOC: —</text>
    ${[['PWR', '#22c55e'], ['FIRE', '#ef4444'], ['FAULT', '#f59e0b']].map(([t, c], i) => `<circle id="lLed${i}" cx="${30 + i * 34}" cy="152" r="5" fill="${i ? '#334155' : c}" data-c="${c}"/><text x="${30 + i * 34}" y="170" text-anchor="middle" font-size="8.5" font-weight="700" fill="#1f2937">${t}</text>`).join('')}
    <text x="66" y="192" text-anchor="middle" font-size="8.5" fill="#334155">${L('interface / locator', 'وحدة الربط / التحديد')}</text></g>
  <text x="500" y="285" text-anchor="middle" font-size="11.5" fill="#e2e8f0" font-weight="600">${L('COAL CONVEYOR GALLERY / CABLE TUNNEL — sensor cable clipped above the belt', 'رواق ناقل الفحم / نفق الكابلات — كابل الحساس مثبت فوق الحزام')}</text>
  <g id="lRuler"></g>
  <g id="lBr"></g>
</svg>`;
}

function tabLhd(root) {
  const K = kit(root);
  const P = { mode: 'digital', rating: 68, len: 400, pos: 237, Th: 40, lh: 4, Ta: 30, cut: false };
  const S = { t: 0, Tc: 30, shorted: false, alarm: false, fault: false, speed: 1, prev: '' };
  root.innerHTML = lay(
    card('🌡️ ' + L('Linear heat detection cable — conveyor fire (seized idler)', 'كابل الكشف الحراري الخطي — حريق ناقل (بكرة عالقة)'), lhdSvg(), 'tech-scene')
    + `<div class="adv-stats tech-stats">${sstat('lsT', L('Cable temp. at hot spot', 'حرارة الكابل عند النقطة الساخنة'), '°C')}${sstat('lsR', L('Measured loop resistance', 'مقاومة الحلقة المقاسة'), 'Ω')}${sstat('lsX', L('Calculated alarm location', 'موقع الإنذار المحسوب'), 'm')}${sstat('lsE', L('Location error', 'خطأ الموقع'), 'm')}${sstat('lsZ', L('Status', 'الحالة'))}</div>`,
    card('🧬 ' + L('Cable type', 'نوع الكابل'),
      seg('lMo', [['digital', L('Digital (fixed temp.)', 'رقمي (حرارة ثابتة)')], ['analog', L('Analog (integrating)', 'تناظري (تكاملي)')]], 'digital')
      + `<div class="tech-row tech-mt" id="lRtW"><span class="tech-lbl">${L('Rating', 'درجة التشغيل')}</span>${seg('lRt', [[68, '68 °C'], [88, '88 °C'], [105, '105 °C']], 68)}</div>`
      + rng('lLen', L('Cable length', 'طول الكابل'), 100, 1000, 10, P.len, 'm'))
    + card('🔥 ' + L('Hot spot', 'النقطة الساخنة'),
      rng('lPos', L('Position along cable', 'الموقع على طول الكابل'), 0, P.len, 1, P.pos, 'm')
      + rng('lTh', L('Hot-spot temperature', 'حرارة النقطة الساخنة'), 20, 300, 1, P.Th, '°C')
      + rng('lLh', L('Heated length', 'الطول المسخّن'), 0.5, 20, 0.5, P.lh, 'm')
      + rng('lTa', L('Max. ambient in gallery', 'أقصى حرارة محيطة في الرواق'), 0, 60, 1, P.Ta, '°C')
      + `<div class="tech-row tech-mt"><span class="tech-lbl">${L('Speed', 'السرعة')}</span>${seg('lSp', [[1, '×1'], [5, '×5']], 1)}</div>`
      + `<div class="adv-btns tech-mt"><button class="btn sm warn" id="lCutB">✂️ ${L('Cut cable (open circuit)', 'قطع الكابل (دائرة مفتوحة)')}</button><button class="btn sm" id="lRst">↺ ${L('Reset / splice', 'إعادة / وصل')}</button></div>`),
  ) + `<div class="adv-grid c2">${card('🧮 ' + L('Alarm location from loop resistance', 'تحديد موقع الإنذار من مقاومة الحلقة'), '<div id="lCalc"></div>')}${card('📉 ' + L('Alarm temperature vs heated length', 'حرارة الإنذار مقابل الطول المسخّن'), '<div id="lCurve"></div>')}</div>`
    + card('📝 ' + L('Event log', 'سجل الأحداث'), '<div class="adv-log" id="lLog"></div>')
    + explain([
      L('<b>Digital</b> LHD: two twisted spring-steel conductors, each insulated with a heat-sensitive polymer. At the rated temperature the polymer melts and the conductors short together — a fixed-temperature alarm at any point along the length. The shorted section is destroyed and must be cut out and spliced.', 'الكابل <b>الرقمي</b>: موصلان من فولاذ نابضي ملتويان، كل منهما معزول ببوليمر حساس للحرارة. عند درجة التشغيل يذوب البوليمر ويتلامس الموصلان — إنذار حرارة ثابتة عند أي نقطة. يتلف الجزء المقصور ويجب قطعه ووصله.'),
      L('Location: the interface measures the loop resistance up to the short, R = R<sub>lead</sub> + 2·r·x, so x = (R − R<sub>lead</sub>) / (2·r). With r ≈ 0.2 Ω/m per conductor the resolution is typically ±1 m.', 'تحديد الموقع: تقيس الوحدة مقاومة الحلقة حتى نقطة القصر، R = R<sub>lead</sub> + 2·r·x، إذن x = (R − R<sub>lead</sub>) / (2·r). مع r ≈ 0.2 Ω/م لكل موصل تكون الدقة عادة ±1 م.'),
      L('<b>Analog</b> (integrating) cable: the insulation resistance falls with temperature along the whole length, so the alarm depends on temperature × heated length — a short very hot spot or a long warm section. It is restorable, but the location is not exact.', 'الكابل <b>التناظري</b> (التكاملي): تنخفض مقاومة العزل مع الحرارة على كامل الطول، فيعتمد الإنذار على الحرارة × الطول المسخّن — نقطة قصيرة شديدة الحرارة أو قسم طويل دافئ. قابل للاستعادة لكن الموقع غير دقيق.'),
      L('For long tunnels, fibre-optic DTS (Raman) gives a temperature profile every ~1 m over up to 10 km with rate-of-rise and zone programming.', 'للأنفاق الطويلة، يعطي الكشف الحراري بالألياف البصرية DTS (رامان) منحنى الحرارة كل ~1 م على مسافة تصل إلى 10 كم مع برمجة معدل الارتفاع والمناطق.'),
    ], [
      L('NFPA 72 §17.6.2: choose a rating at least 11 °C (20 °F) above the maximum expected ambient; §17.6.3 — spacing per listing (typically ≤ 6–9 m between runs on ceilings; directly above hazards on conveyors).', 'NFPA 72 §17.6.2: اختر درجة تشغيل أعلى بـ 11°م (20°ف) على الأقل من أقصى حرارة محيطة متوقعة؛ §17.6.3 — التباعد حسب الاعتماد (عادة ≤ 6–9 م بين المسارات على الأسقف؛ مباشرة فوق الخطر في النواقل).'),
      L('Conveyors: run the cable above the belt near idlers/bearings (typically 0.5–1 m), or on both sides for wide belts; use listed clips every 0.75–1.5 m; avoid sharp bends (> 75 mm radius).', 'النواقل: مدّ الكابل فوق الحزام قرب البكرات/المحامل (عادة 0.5–1 م)، أو على الجانبين للأحزمة العريضة؛ استخدم مشابك معتمدة كل 0.75–1.5 م؛ تجنب الانحناءات الحادة (نصف قطر > 75 مم).'),
      L('Terminate with the EOL device for supervision; record the loop resistance per metre and the "cable map" (distance → physical landmark) at commissioning.', 'أنهِ الدائرة بعنصر نهاية الخط للإشراف؛ سجّل مقاومة الحلقة لكل متر و"خريطة الكابل" (المسافة ← معلم فعلي) عند الاستلام.'),
      L('Test: digital — short the conductors at the far end with the test switch (never heat the cable); analog — use the calibrated test box; verify location readout at known points.', 'الاختبار: الرقمي — اقصر الموصلات عند الطرف البعيد بمفتاح الاختبار (لا تسخّن الكابل أبداً)؛ التناظري — استخدم صندوق الاختبار المعاير؛ تحقق من قراءة الموقع عند نقاط معروفة.'),
    ]);

  const xpx = (m) => 120 + (m / P.len) * 742;
  const logS = (m, c) => K.log('lLog', S.t, m, c);
  function ruler() {
    let r = `<line x1="120" y1="298" x2="862" y2="298" stroke="#94a3b8"/>`;
    const step = P.len > 500 ? 100 : 50;
    for (let d = 0; d <= P.len; d += step) r += `<line x1="${xpx(d)}" y1="293" x2="${xpx(d)}" y2="303" stroke="#94a3b8"/><text x="${xpx(d)}" y="318" text-anchor="middle" font-size="10" fill="#cbd5e1">${d} m</text>`;
    K.$('lRuler').innerHTML = r;
    K.$('lPos').max = P.len;
    if (P.pos > P.len) { P.pos = P.len; K.$('lPos').value = P.len; K.txt('lPosV', P.len); }
  }
  function curve() {
    const W = 600, H = 230, x0 = 48, y0 = 14, w = 530, h = 180;
    const tx = (l) => x0 + (l / 20) * w, ty = (T) => y0 + h - ((T - 20) / 180) * h;
    const gA = Math.exp(AN_B * (P.Ta - 20));
    let pa = '';
    for (let l = 0.5; l <= 20; l += 0.25) { const T = 20 + Math.log(AN_D / l + gA) / AN_B; pa += `${pa ? 'L' : 'M'}${tx(l).toFixed(1)} ${ty(clamp(T, 20, 200)).toFixed(1)} `; }
    let grid = '';
    for (let T = 20; T <= 200; T += 30) grid += `<line x1="${x0}" y1="${ty(T)}" x2="${x0 + w}" y2="${ty(T)}" stroke="${GRID}"/><text x="${x0 - 5}" y="${ty(T) + 3}" text-anchor="end" font-size="11" fill="${TICK}">${T}</text>`;
    for (let l = 0; l <= 20; l += 5) grid += `<text x="${tx(l)}" y="${y0 + h + 13}" text-anchor="middle" font-size="11" fill="${TICK}">${l}</text>`;
    const cx = tx(clamp(P.lh, 0, 20)), cy = ty(clamp(S.Tc, 20, 200));
    K.html('lCurve', `<svg viewBox="0 0 ${W} ${H}" class="adv-svg tech-svg">${grid}
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="${TICK}" stroke-opacity=".5"/>
      <path d="${pa}" fill="none" stroke="#a855f7" stroke-width="2.4"/>
      <line x1="${x0}" y1="${ty(P.rating)}" x2="${x0 + w}" y2="${ty(P.rating)}" stroke="#ef4444" stroke-width="2.2" stroke-dasharray="7 4"/>
      <line x1="${x0}" y1="${ty(P.Ta)}" x2="${x0 + w}" y2="${ty(P.Ta)}" stroke="#0ea5e9" stroke-width="1.2" stroke-dasharray="2 3"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="${S.alarm ? '#ef4444' : '#22c55e'}" stroke="#fff" stroke-width="1.5"/>
      <text x="${x0 + w - 4}" y="${ty(P.rating) - 5}" text-anchor="end" font-size="11.5" fill="#ef4444" font-weight="700">${L('digital', 'رقمي')} ${P.rating} °C</text>
      <text x="${tx(2.2)}" y="${ty(clamp(20 + Math.log(AN_D / 2 + gA) / AN_B, 20, 200)) - 6}" font-size="11.5" fill="#a855f7" font-weight="700">${L('analog alarm curve', 'منحنى إنذار تناظري')}</text>
      <text x="${x0 + w - 4}" y="${ty(P.Ta) - 4}" text-anchor="end" font-size="11" fill="#0ea5e9">${L('ambient', 'المحيط')}</text>
      <text x="${x0 + w / 2}" y="${H - 2}" text-anchor="middle" font-size="11.5" fill="${TICK}">${L('heated length (m)', 'الطول المسخّن (م)')}</text>
      <text x="10" y="${y0 + h / 2}" font-size="11.5" fill="${TICK}" transform="rotate(-90 10 ${y0 + h / 2})" text-anchor="middle">°C</text></svg>
      <div class="adv-note">${L('Digital cable alarms at its rating regardless of length. Analog cable alarms on temperature × length: ~99 °C over 1 m, ~70 °C over 10 m — the dot is the current hot spot.', 'يعطي الكابل الرقمي إنذاراً عند درجته بغض النظر عن الطول. أما التناظري فيعتمد على الحرارة × الطول: ~99°م على 1 م، ~70°م على 10 م — النقطة تمثل النقطة الساخنة الحالية.')}</div>`);
  }
  function calc() {
    const dig = P.mode === 'digital';
    const Rnorm = LHD_LEAD + 2 * LHD_R * P.len + LHD_EOL;
    let h = '';
    if (P.cut) {
      h = `<div class="adv-callout warn">⚠️ ${L('Open circuit: the EOL is no longer seen → FAULT (trouble) at the panel. The cable is not monitored beyond the break until it is repaired.', 'دائرة مفتوحة: لم يعد عنصر نهاية الخط مرئياً ← عطل في اللوحة. الكابل غير مراقَب بعد نقطة القطع حتى الإصلاح.')}</div>`;
    } else if (dig) {
      const x = P.pos;
      const R = LHD_LEAD + 2 * LHD_R * x;
      h = `<div class="tech-calc">
        <div>${L('Normal (supervised) loop', 'الحلقة الطبيعية (مراقبة)')}: <span class="tech-f">R = R<sub>lead</sub> + 2·r·L + R<sub>EOL</sub> = ${fx(LHD_LEAD, 1)} + 2×${fx(LHD_R, 2)}×${fx(P.len)} + ${fx(LHD_EOL)} = <b>${fx(Rnorm, 1)} Ω</b></span></div>
        <div>${L('After the short at the hot spot', 'بعد القصر عند النقطة الساخنة')}: <span class="tech-f">R = R<sub>lead</sub> + 2·r·x${S.shorted ? ` = <b>${fx(R, 1)} Ω</b>` : ''}</span> ${S.shorted ? '' : `(${L('no short yet', 'لا يوجد قصر بعد')})`}</div>
        <div class="tech-big"><span class="tech-f">x = (R − R<sub>lead</sub>) / (2·r)${S.shorted ? ` = (${fx(R, 1)} − ${fx(LHD_LEAD, 1)}) / (2×${fx(LHD_R, 2)}) = <b>${fx((R - LHD_LEAD) / (2 * LHD_R), 1)} m</b>` : ''}</span></div>
        <div class="adv-note"><span class="tech-f">r = ${fx(LHD_R, 2)} Ω/m</span> ${L('per conductor (from cable data sheet, verified at commissioning)', 'لكل موصل (من بيانات الكابل، يُتحقق منه عند الاستلام)')} · <span class="tech-f">R<sub>lead</sub> = ${fx(LHD_LEAD, 1)} Ω</span></div></div>`;
    } else {
      const gA = Math.exp(AN_B * (P.Ta - 20)), gH = Math.exp(AN_B * (S.Tc - 20));
      const dG = P.lh * (gH - gA);
      h = `<div class="tech-calc"><div>${L('Analog cable: conductance change', 'الكابل التناظري: تغير الموصلية')} <span class="tech-f">ΔG ∝ ℓ·(e<sup>β(T−20)</sup> − e<sup>β(Ta−20)</sup>) = ${fx(P.lh, 1)} × (${fx(gH, 1)} − ${fx(gA, 2)}) = <b>${fx(dG, 0)}</b></span></div>
        <div class="tech-big">${L('Alarm when', 'إنذار عندما')} <span class="tech-f">ΔG ≥ ${AN_D}</span> → ${dG >= AN_D ? pill('bad', L('ALARM', 'إنذار')) : pill('ok', `${n((dG / AN_D) * 100, 0, '%')} ${L('of threshold', 'من العتبة')}`)}</div>
        <div class="adv-note">${L('The hot spot position cannot be derived from resistance alone — analog LHD gives a zone alarm (use digital with locator, or fibre DTS, when location matters).', 'لا يمكن استنتاج موقع النقطة الساخنة من المقاومة وحدها — الكابل التناظري يعطي إنذار منطقة (استخدم الرقمي مع محدد الموقع أو الألياف DTS عند أهمية الموقع).')}</div></div>`;
    }
    const margin = P.rating - P.Ta;
    if (dig) h += margin < 11 ? `<div class="adv-callout bad tech-mt">❌ ${L(`Rating ${P.rating} °C is only ${margin} °C above the max. ambient ${P.Ta} °C — NFPA 72 §17.6.2 requires ≥ 11 °C. Select a higher rating.`, `الدرجة ${P.rating}°م أعلى بـ ${margin}°م فقط من أقصى حرارة محيطة ${P.Ta}°م — يتطلب NFPA 72 §17.6.2 فرقاً ≥ 11°م. اختر درجة أعلى.`)}</div>`
      : `<div class="adv-callout tech-mt">✅ ${L(`Rating margin ${margin} °C above max. ambient (≥ 11 °C, NFPA 72 §17.6.2).`, `هامش الدرجة ${margin}°م فوق أقصى حرارة محيطة (≥ 11°م، NFPA 72 §17.6.2).`)}</div>`;
    K.html('lCalc', h);
  }
  function tick() {
    const dt = 0.2 * S.speed; S.t += dt;
    const target = Math.max(P.Th, P.Ta);
    S.Tc += (target - S.Tc) * (1 - Math.exp(-dt / 20));
    const dig = P.mode === 'digital';
    if (dig && !S.shorted && !P.cut && (S.Tc >= P.rating || P.Ta >= P.rating)) {
      S.shorted = true; S.alarm = true;
      logS(L(`FIRE — conductors shorted at ${P.pos} m (cable ${S.Tc.toFixed(0)} °C ≥ ${P.rating} °C). Section destroyed — splice required.`, `حريق — قصر الموصلات عند ${P.pos} م (الكابل ${S.Tc.toFixed(0)}°م ≥ ${P.rating}°م). تلف الجزء — يلزم الوصل.`), 'fire');
    }
    if (!dig && !P.cut) {
      const gA = Math.exp(AN_B * (P.Ta - 20)), gH = Math.exp(AN_B * (S.Tc - 20));
      const al = P.lh * (gH - gA) >= AN_D;
      if (al && !S.alarm) { S.alarm = true; logS(L(`FIRE — analog threshold reached (${S.Tc.toFixed(0)} °C over ${P.lh} m). Location: zone only.`, `حريق — بلوغ العتبة التناظرية (${S.Tc.toFixed(0)}°م على ${P.lh} م). الموقع: منطقة فقط.`), 'fire'); }
    }
    // visuals
    const hx = xpx(P.pos), hw = Math.max(6, (P.lh / P.len) * 742);
    const heat = clamp((S.Tc - P.Ta) / 150, 0, 1);
    K.attr('lHot', 'transform', `translate(${hx} 0)`);
    K.attr('lHotG', 'opacity', clamp((P.Th - 40) / 120, 0, 1).toFixed(2));
    K.attr('lHotRol', 'opacity', clamp((P.Th - 40) / 80, 0, 1).toFixed(2));
    K.attr('lShim', 'opacity', clamp((P.Th - 50) / 60, 0, 0.9).toFixed(2));
    K.attr('lFl', 'opacity', P.Th > 180 ? clamp((P.Th - 180) / 60, 0, 1).toFixed(2) : 0);
    K.attr('lHotC', 'x', hx - hw / 2); K.attr('lHotC', 'width', hw); K.attr('lHotC', 'opacity', heat.toFixed(2));
    K.attr('lHotC', 'fill', heat > 0.6 ? '#fef08a' : heat > 0.3 ? '#fb923c' : '#f97316');
    const sh = K.$('lShort'); sh.setAttribute('transform', `translate(${hx} 92)`); sh.setAttribute('opacity', S.shorted && dig ? 1 : 0);
    const cutX = xpx(P.len * 0.8);
    K.attr('lCut', 'transform', `translate(${cutX} 92)`); K.attr('lCut', 'opacity', P.cut ? 1 : 0);
    const deadFrom = P.cut ? cutX : S.shorted && dig ? hx : 0;
    K.attr('lDead', 'x', deadFrom); K.attr('lDead', 'width', deadFrom ? 862 - deadFrom : 0);
    K.$('lBr').innerHTML = `<path d="M${hx - hw / 2} 112 v6 h${hw} v-6" stroke="#fbbf24" fill="none"/><text x="${hx}" y="131" text-anchor="middle" font-size="9.5" fill="#fbbf24">${P.lh} m @ ${P.Th} °C</text>`;
    // readouts
    const R = P.cut ? Infinity : S.shorted && dig ? LHD_LEAD + 2 * LHD_R * P.pos : LHD_LEAD + 2 * LHD_R * P.len + LHD_EOL;
    const loc = S.shorted && dig && !P.cut ? (R - LHD_LEAD) / (2 * LHD_R) : null;
    const status = P.cut ? 'fault' : S.alarm ? 'fire' : 'normal';
    K.st('lsT', S.Tc.toFixed(1), S.Tc >= (dig ? P.rating : 90) ? 'alarm' : S.Tc > P.Ta + 15 ? 'warn' : 'ok');
    K.st('lsR', Number.isFinite(R) ? R.toFixed(1) : 'OPEN', P.cut ? 'warn' : '');
    K.st('lsX', loc != null ? loc.toFixed(1) : dig ? '—' : L('zone', 'منطقة'), loc != null ? 'alarm' : '');
    K.st('lsE', loc != null ? `±${(0.5 + P.lh / 2).toFixed(1)}` : '—', '');
    K.st('lsZ', status === 'fire' ? L('FIRE', 'حريق') : status === 'fault' ? L('FAULT – open', 'عطل – مفتوح') : L('Normal', 'طبيعي'), status === 'fire' ? 'alarm' : status === 'fault' ? 'warn' : 'ok');
    K.txt('lLcd1', status === 'fire' ? 'LHD-01 FIRE' : status === 'fault' ? 'LHD-01 FAULT' : 'LHD-01 NORMAL');
    K.txt('lLcd2', `R=${Number.isFinite(R) ? R.toFixed(1) : '∞'} Ω`);
    K.txt('lLcd3', loc != null ? `LOC: ${loc.toFixed(1)} m` : dig ? 'LOC: ---' : 'LOC: ZONE');
    ['lLcd1', 'lLcd2', 'lLcd3'].forEach((id) => K.attr(id, 'fill', status === 'fire' ? '#fca5a5' : status === 'fault' ? '#fcd34d' : '#86efac'));
    K.attr('lLed1', 'fill', status === 'fire' ? '#ef4444' : '#334155');
    K.attr('lLed2', 'fill', status === 'fault' ? '#f59e0b' : '#334155');
    if (status !== S.prev) { if (status === 'fault') logS(L('OPEN-CIRCUIT FAULT — EOL lost', 'عطل دائرة مفتوحة — فُقد عنصر نهاية الخط'), 'trouble'); S.prev = status; }
    calc(); curve();
  }
  const timer = setInterval(tick, 200);
  K.onSeg('lMo', (v) => { P.mode = v; S.alarm = false; S.shorted = false; K.$('lRtW').style.opacity = v === 'digital' ? 1 : 0.45; });
  K.onSeg('lRt', (v) => { P.rating = +v; });
  K.onSeg('lSp', (v) => { S.speed = +v; });
  K.onRange('lLen', (v) => { P.len = v; ruler(); });
  K.onRange('lPos', (v) => { if (!S.shorted) P.pos = v; else K.$('lPos').value = P.pos, K.txt('lPosV', P.pos); });
  K.onRange('lTh', (v) => { P.Th = v; });
  K.onRange('lLh', (v) => { P.lh = v; });
  K.onRange('lTa', (v) => { P.Ta = v; });
  K.$('lCutB').onclick = () => { P.cut = true; };
  K.$('lRst').onclick = () => { P.cut = false; S.shorted = false; S.alarm = false; S.Tc = Math.max(P.Ta, Math.min(S.Tc, 40)); logS(L('Panel reset — cable section replaced & spliced', 'إعادة ضبط اللوحة — استُبدل جزء الكابل ووُصل'), 'ok'); };
  ruler(); tick();
  logS(L('LHD commissioned — loop resistance recorded, cable map stored', 'تم استلام LHD — سُجلت مقاومة الحلقة وخريطة الكابل'), 'ok');
  return () => clearInterval(timer);
}

/* ═════════════════════════ 5. WATER MIST ═════════════════════════ */
const MS = {
  lp: { name: L => L('Low pressure', 'ضغط منخفض'), min: 5, max: 12, def: 10, K: 6, cov: 9, cone: 55 },
  ip: { name: L => L('Intermediate', 'ضغط متوسط'), min: 12.5, max: 34, def: 25, K: 3.2, cov: 9, cone: 60 },
  hp: { name: L => L('High pressure', 'ضغط عالٍ'), min: 35, max: 200, def: 100, K: 1.2, cov: 9, cone: 70 },
  spr: { name: L => L('Sprinkler (reference)', 'مرش (مرجعي)'), min: 0.5, max: 5, def: 1, K: 80, cov: 12, cone: 50 },
};
const NOZ = [390, 560, 730];
function mistSvg() {
  return `<svg viewBox="0 0 900 400" class="adv-svg tech-svg">
  <defs>
    <linearGradient id="mRoom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a23"/><stop offset="1" stop-color="#1f2a36"/></linearGradient>
    <linearGradient id="mOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c232c"/><stop offset="1" stop-color="#2b343f"/></linearGradient>
    <linearGradient id="mEng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#94a3b8"/><stop offset=".5" stop-color="#64748b"/><stop offset="1" stop-color="#334155"/></linearGradient>
    <linearGradient id="mSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset=".5" stop-color="#94a3b8"/><stop offset="1" stop-color="#64748b"/></linearGradient>
    <linearGradient id="mMotor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset=".5" stop-color="#1d4ed8"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>
    <linearGradient id="mTank" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cbd5e1"/><stop offset=".5" stop-color="#f1f5f9"/><stop offset="1" stop-color="#94a3b8"/></linearGradient>
    <linearGradient id="mExh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b45309"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
    <radialGradient id="mFireG"><stop offset="0" stop-color="#fde047" stop-opacity=".9"/><stop offset=".5" stop-color="#f97316" stop-opacity=".5"/><stop offset="1" stop-color="#dc2626" stop-opacity="0"/></radialGradient>
    <radialGradient id="mSteam"><stop offset="0" stop-color="#f8fafc" stop-opacity=".7"/><stop offset="1" stop-color="#f8fafc" stop-opacity="0"/></radialGradient>
    <filter id="mBl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="mSh"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".5"/></filter>
  </defs>
  <rect width="900" height="400" fill="url(#mOut)"/>
  <rect x="226" y="36" width="660" height="330" fill="url(#mRoom)"/>
  <rect id="mFog" x="226" y="36" width="660" height="330" fill="#e2e8f0" opacity="0"/>
  <path d="M226 36 H886 V366 H226 Z" fill="none" stroke="#64748b" stroke-width="7"/>
  ${Array.from({ length: 10 }, (_, i) => `<line x1="${258 + i * 64}" y1="40" x2="${258 + i * 64}" y2="362" stroke="#243140" stroke-width="2"/>`).join('')}
  <text x="556" y="28" text-anchor="middle" font-size="12" fill="#e2e8f0" font-weight="600">${L('MACHINERY SPACE — diesel generator enclosure (Class B fuel-spray / pool fire)', 'غرفة الآلات — حاوية مولد ديزل (حريق رذاذ وقود / حوض فئة B)')}</text>
  <rect x="226" y="332" width="660" height="34" fill="#2d3743"/>
  <g filter="url(#mSh)">
    <rect x="410" y="232" width="300" height="100" rx="6" fill="url(#mEng)" stroke="#1e293b"/>
    <rect x="430" y="206" width="240" height="30" rx="4" fill="url(#mEng)" stroke="#1e293b"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${440 + i * 38}" y="196" width="28" height="14" rx="2" fill="#475569" stroke="#1e293b"/>`).join('')}
    <path d="M440 222 H660" stroke="url(#mExh)" stroke-width="8" stroke-linecap="round"/>
    <circle cx="742" cy="282" r="40" fill="url(#mSteel)" stroke="#1e293b"/><circle cx="742" cy="282" r="12" fill="#334155"/>
    <rect x="690" y="262" width="30" height="40" fill="#475569"/>
    <rect x="400" y="326" width="360" height="10" rx="2" fill="#1f2937"/>
  </g>
  <g id="mFire" transform="translate(470 330)">
    <ellipse cx="0" cy="-8" rx="70" ry="44" fill="url(#mFireG)" filter="url(#mBl)"/>
    <path d="M-40 0 C-50 -30 -20 -50 -22 -90 C0 -60 30 -60 20 -110 C50 -70 60 -30 44 0 Z" fill="#ea580c" class="tech-flick"/>
    <path d="M-26 0 C-30 -20 -10 -34 -8 -64 C8 -40 26 -40 20 -76 C40 -44 38 -18 30 0 Z" fill="#f59e0b" class="tech-flick" style="animation-delay:-.2s"/>
    <path d="M-12 0 C-14 -12 -4 -20 -2 -38 C8 -24 16 -18 12 0 Z" fill="#fef08a" class="tech-flick" style="animation-delay:-.1s"/>
  </g>
  <g id="mSteamG" opacity="0" filter="url(#mBl)"><circle class="tech-rise" cx="470" cy="250" r="30" fill="url(#mSteam)"/><circle class="tech-rise" style="animation-delay:-1.5s" cx="500" cy="200" r="38" fill="url(#mSteam)"/><circle class="tech-rise" style="animation-delay:-.7s" cx="440" cy="210" r="30" fill="url(#mSteam)"/></g>
  <g id="mDrops"></g>
  <path d="M175 256 V70 H860" stroke="#475569" stroke-width="9" fill="none" stroke-linejoin="round"/>
  <path d="M175 256 V70 H860" stroke="url(#mSteel)" stroke-width="6" fill="none" stroke-linejoin="round"/>
  <path id="mFlow" d="M175 256 V70 H860" stroke="#38bdf8" stroke-width="2" fill="none" stroke-dasharray="6 12" class="tech-flow2" opacity="0"/>
  ${NOZ.map((x) => `<g filter="url(#mSh)"><rect x="${x - 5}" y="72" width="10" height="10" fill="#cbd5e1" stroke="#475569"/><path d="M${x - 9} 82 H${x + 9} L${x + 6} 94 H${x - 6} Z" fill="url(#mSteel)" stroke="#334155"/>${[-4, 0, 4].map((d) => `<circle cx="${x + d}" cy="93" r="1.3" fill="#1e293b"/>`).join('')}</g>`).join('')}
  <g filter="url(#mSh)"><rect x="196" y="56" width="24" height="28" rx="3" fill="#b91c1c" stroke="#7f1d1d"/><text x="208" y="100" text-anchor="middle" font-size="8.5" fill="#fca5a5">${L('section valve', 'صمام القسم')}</text><circle id="mSv" cx="208" cy="70" r="5" fill="#334155"/></g>
  <g filter="url(#mSh)">
    <rect x="20" y="120" width="70" height="186" rx="8" fill="url(#mTank)" stroke="#475569"/><rect id="mLvl" x="26" y="150" width="8" height="150" fill="#38bdf8" opacity=".75"/>
    <text x="55" y="140" text-anchor="middle" font-size="9" font-weight="700" fill="#1f2937">${L('WATER', 'ماء')}</text><text x="55" y="152" text-anchor="middle" font-size="8" fill="#334155">${L('filtered', 'مُرشَّح')}</text>
    <rect x="16" y="306" width="196" height="16" rx="3" fill="#334155"/>
    <rect x="98" y="248" width="60" height="50" rx="8" fill="url(#mMotor)" stroke="#1e3a8a"/>${[0, 1, 2, 3, 4].map((i) => `<line x1="${104 + i * 11}" y1="252" x2="${104 + i * 11}" y2="294" stroke="#1e3a8a" stroke-width="2"/>`).join('')}
    <rect x="158" y="256" width="34" height="36" rx="4" fill="url(#mSteel)" stroke="#334155"/>
    <text x="128" y="240" text-anchor="middle" font-size="9" font-weight="700" fill="#e2e8f0">${L('PD pump unit', 'وحدة مضخة إزاحة')}</text>
    <path d="M146 190 H175" stroke="#64748b" stroke-width="4"/><circle cx="130" cy="190" r="24" fill="#f8fafc" stroke="#334155" stroke-width="3"/>
    ${Array.from({ length: 11 }, (_, i) => { const a = (-210 + i * 24) * Math.PI / 180; return `<line x1="${130 + Math.cos(a) * 18}" y1="${190 + Math.sin(a) * 18}" x2="${130 + Math.cos(a) * 22}" y2="${190 + Math.sin(a) * 22}" stroke="#334155" stroke-width="1.4"/>`; }).join('')}
    <line id="mNeedle" x1="130" y1="190" x2="130" y2="172" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/><circle cx="130" cy="190" r="3" fill="#334155"/>
    <text id="mGauge" x="130" y="205" text-anchor="middle" font-size="8.5" font-family="Consolas, monospace" fill="#0f172a">0 bar</text>
  </g>
  <g transform="translate(238 118)"><rect width="136" height="54" rx="6" fill="#020617" opacity=".75" stroke="#334155"/>
    <text x="10" y="18" font-size="10.5" font-family="Consolas, monospace" fill="#67e8f9" id="mHud1">O₂ 20.9 %</text>
    <text x="10" y="32" font-size="10.5" font-family="Consolas, monospace" fill="#fdba74" id="mHud2">T 450 °C</text>
    <text x="10" y="46" font-size="10.5" font-family="Consolas, monospace" fill="#fca5a5" id="mHud3">HRR 1000 kW</text></g>
</svg>`;
}

function tabMist(root) {
  const K = kit(root);
  const P = { sys: 'hp', p: 100, fire: 1, area: 120, encl: true };
  const S = { on: false, t: 0, Q: 1000, O2: 20.9, T: 450, out: false, drops: [], raf: 0, logged: false };
  root.innerHTML = lay(
    card('💧 ' + L('Water mist system — live discharge', 'نظام الرذاذ المائي — تفريغ حي'), mistSvg(), 'tech-scene')
    + `<div class="adv-stats tech-stats">${sstat('msD', 'Dv0.99', 'µm')}${sstat('msA', L('Surface area per litre', 'المساحة السطحية لكل لتر'), 'm²/L')}${sstat('msQ', L('Flow per nozzle', 'التدفق لكل فوهة'), 'L/min')}${sstat('msF', L('Discharge density', 'كثافة التفريغ'), 'mm/min')}${sstat('msO', L('O₂ in enclosure', 'الأكسجين في الحيّز'), '%')}${sstat('msZ', L('Fire status', 'حالة الحريق'))}</div>`
    + `<div class="adv-grid c2">${card('🧪 ' + L('Extinguishing mechanisms (relative)', 'آليات الإطفاء (نسبية)'), '<div id="mMech"></div>')}${card('🚰 ' + L('Water use — 10 min discharge', 'استهلاك المياه — تفريغ 10 دقائق'), '<div id="mCmp"></div>')}</div>`,
    card('⚙️ ' + L('System', 'النظام'),
      seg('mSy', Object.entries(MS).map(([k, v]) => [k, v.name(L)]), 'hp')
      + `<div class="tech-mt">${rng('mP', L('Nozzle pressure', 'ضغط الفوهة'), 35, 200, 1, 100, 'bar')}</div>`
      + `<div id="mCls" class="tech-mt"></div>`)
    + card('🔥 ' + L('Fire & compartment', 'الحريق والحيّز'),
      rng('mFi', L('Fire size (HRR)', 'حجم الحريق (معدل إطلاق الحرارة)'), 0.25, 4, 0.25, 1, 'MW')
      + rng('mAr', L('Protected floor area', 'مساحة الأرضية المحمية'), 20, 400, 10, 120, 'm²')
      + chk('mEn', L('Enclosed (doors closed, ventilation shut down)', 'مغلق (الأبواب مغلقة، التهوية متوقفة)'), true)
      + `<div class="adv-btns tech-mt"><button class="btn primary sm" id="mGo">💧 ${L('Discharge', 'تفريغ')}</button><button class="btn sm" id="mRst">↺ ${L('Re-ignite / reset', 'إعادة إشعال / ضبط')}</button></div>`
      + `<div class="adv-note tech-mt">${L('Illustrative engineering model — real performance is proven only by full-scale fire tests for the listed hazard.', 'نموذج هندسي توضيحي — الأداء الحقيقي يُثبت فقط باختبارات حريق كاملة الحجم للخطر المعتمد.')}</div>`),
  ) + explain([
    L('NFPA 750 defines water mist as a spray in which Dv0.99 (99 % of the water volume) is in droplets smaller than 1000 µm at the minimum design pressure. Smaller droplets give enormous surface area per litre and evaporate quickly.', 'يعرّف NFPA 750 الرذاذ المائي بأنه رش يكون فيه Dv0.99 (99٪ من حجم الماء) في قطرات أصغر من 1000 ميكرومتر عند الحد الأدنى لضغط التصميم. القطرات الأصغر تعطي مساحة سطحية هائلة لكل لتر وتتبخر بسرعة.'),
    L('Mechanisms: (1) gas-phase cooling of the flame and hot gases (latent heat 2.26 MJ/kg); (2) oxygen displacement — water expands ~1700× into steam, locally diluting O₂, most effective in enclosed spaces and, paradoxically, for larger fires; (3) attenuation of radiant heat protecting adjacent fuel and people; plus wetting and kinetic effects.', 'الآليات: (1) تبريد الطور الغازي للهب والغازات الساخنة (حرارة كامنة 2.26 ميغاجول/كغ)؛ (2) إزاحة الأكسجين — يتمدد الماء ~1700 مرة إلى بخار فيخفف O₂ موضعياً، وهو الأكثر فعالية في الحيّزات المغلقة، ومن المفارقة أنه أفعل مع الحرائق الأكبر؛ (3) توهين الحرارة الإشعاعية لحماية الوقود المجاور والأشخاص؛ إضافة إلى التبليل والتأثيرات الحركية.'),
    L('Pressure classes (NFPA 750): low ≤ 12.1 bar (175 psi); intermediate 12.1–34.5 bar; high ≥ 34.5 bar (500 psi). High pressure uses positive-displacement pumps or gas-driven cylinders and stainless tubing.', 'فئات الضغط (NFPA 750): منخفض ≤ 12.1 بار (175 psi)؛ متوسط 12.1–34.5 بار؛ عالٍ ≥ 34.5 بار (500 psi). يستخدم الضغط العالي مضخات إزاحة موجبة أو أسطوانات مدفوعة بالغاز وأنابيب من الفولاذ المقاوم للصدأ.'),
  ], [
    L('There is no generic density method: design must follow the manufacturer’s listing for the specific hazard tested (e.g. FM 5560 / IMO / UL 2167) — nozzle type, spacing, height, pressure, duration.', 'لا توجد طريقة كثافة عامة: يجب أن يتبع التصميم اعتماد المصنّع للخطر المحدد المختبر (مثل FM 5560 / IMO / UL 2167) — نوع الفوهة والتباعد والارتفاع والضغط ومدة التفريغ.'),
    L('Water quality is critical: stainless-steel or copper piping, flushed clean, strainers/filters before every nozzle or section valve (NFPA 750); orifices are very small (≈ 0.5–1.5 mm).', 'جودة المياه حاسمة: أنابيب من الفولاذ المقاوم للصدأ أو النحاس، مغسولة جيداً، ومصافٍ/مرشحات قبل كل فوهة أو صمام قسم (NFPA 750)؛ الفتحات صغيرة جداً (≈ 0.5–1.5 مم).'),
    L('Hydraulic calculation uses the Darcy-Weisbach method for intermediate/high pressure systems (Hazen-Williams is only permitted for low-pressure).', 'يستخدم الحساب الهيدروليكي طريقة دارسي-وايسباخ لأنظمة الضغط المتوسط/العالي (تُسمح طريقة هازن-ويليامز فقط للضغط المنخفض).'),
    L('Machinery spaces: interlock to shut down ventilation and fuel pumps; keep doors closed; enclosures must match the tested volume and ventilation limits.', 'غرف الآلات: اربط لإيقاف التهوية ومضخات الوقود؛ أبقِ الأبواب مغلقة؛ يجب أن يطابق الحيّز الحجم وحدود التهوية المختبرة.'),
    L('Acceptance: flush and pressure-test piping (1.5× working pressure), verify pump performance, discharge test with nozzle-pattern check, confirm water supply duration.', 'الاستلام: غسل واختبار ضغط الأنابيب (1.5× ضغط التشغيل)، التحقق من أداء المضخة، اختبار تفريغ مع فحص نمط الفوهات، والتأكد من مدة إمداد المياه.'),
  ]);

  const drops = K.$('mDrops');
  const pool = [];
  for (let i = 0; i < 260; i++) { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', 0); drops.appendChild(c); pool.push({ el: c, live: false }); }
  function props() {
    const s = MS[P.sys];
    const dv99 = P.sys === 'spr' ? 2000 * P.p ** -0.33 : 1050 * P.p ** -0.4;
    const dv50 = 0.42 * dv99;
    const areaL = 6000 / dv50;
    const q = s.K * Math.sqrt(P.p);
    const dens = q / s.cov;
    const cool = clamp(areaL / 60, 0, 1) * clamp(dens / 1.0, 0.3, 1) * (P.encl ? 1 : 0.7);
    const evap = clamp(1.25 - dv50 / 250, 0.05, 1);
    const inert = P.encl ? evap * clamp(0.35 + P.fire * 0.25, 0, 1) : 0.08 * evap;
    const rad = clamp(1.15 - dv50 / 200, 0.05, 1);
    const E = 0.45 * cool + 0.35 * inert + 0.2 * rad;
    const cls = P.p <= 12.1 ? 'lp' : P.p < 34.5 ? 'ip' : 'hp';
    return { dv99, dv50, areaL, q, dens, cool, inert, rad, E, cls, mist: dv99 < 1000 };
  }
  function panel() {
    const X = props();
    const clsN = { lp: L('LOW pressure (≤ 12.1 bar)', 'ضغط منخفض (≤ 12.1 بار)'), ip: L('INTERMEDIATE (12.1–34.5 bar)', 'متوسط (12.1–34.5 بار)'), hp: L('HIGH pressure (≥ 34.5 bar)', 'ضغط عالٍ (≥ 34.5 بار)') }[X.cls];
    K.html('mCls', `${X.mist ? pill('ok', `✓ ${L('Water mist per NFPA 750', 'رذاذ مائي حسب NFPA 750')}`) : pill('bad', `✗ ${L('Not water mist — Dv0.99 ≥ 1000 µm', 'ليس رذاذاً مائياً — Dv0.99 ≥ 1000 ميكرومتر')}`)} ${P.sys !== 'spr' ? pill('info', clsN) : ''}`);
    const bar = (lbl, v, c, sub) => `<div class="tech-bar"><div class="tech-bar-l"><span>${lbl}</span><b class="tech-n">${Math.round(v * 100)} %</b></div><div class="tech-bar-t"><i style="width:${(v * 100).toFixed(0)}%;background:${c}"></i></div><small>${sub}</small></div>`;
    K.html('mMech', bar(L('Gas-phase cooling', 'تبريد الطور الغازي'), X.cool, 'linear-gradient(90deg,#0ea5e9,#38bdf8)', L(`${X.areaL.toFixed(0)} m² of droplet surface per litre (Dv0.5 ≈ ${X.dv50.toFixed(0)} µm)`, `${X.areaL.toFixed(0)} م² من سطح القطرات لكل لتر (Dv0.5 ≈ ${X.dv50.toFixed(0)} ميكرومتر)`))
      + bar(L('Oxygen displacement (steam)', 'إزاحة الأكسجين (البخار)'), X.inert, 'linear-gradient(90deg,#8b5cf6,#a78bfa)', P.encl ? L('1 L water → ~1.7 m³ steam; bigger fire → more steam', '1 لتر ماء ← ~1.7 م³ بخار؛ حريق أكبر ← بخار أكثر') : L('open / ventilated — steam is lost', 'مفتوح / مُهوّى — يضيع البخار'))
      + bar(L('Radiant heat attenuation', 'توهين الحرارة الإشعاعية'), X.rad, 'linear-gradient(90deg,#f59e0b,#fbbf24)', L('fine droplets absorb & scatter IR', 'القطرات الدقيقة تمتص وتشتت الأشعة تحت الحمراء'))
      + `<div class="tech-mt">${X.E >= 0.5 ? pill('ok', L('Expected: EXTINGUISHMENT', 'المتوقع: إطفاء')) : X.E >= 0.3 ? pill('warn', L('Expected: SUPPRESSION', 'المتوقع: إخماد جزئي')) : pill('bad', L('Expected: CONTROL only', 'المتوقع: سيطرة فقط'))} <span class="tech-mut">E = ${n(X.E, 2)}</span></div>`);
    // water comparison
    const sprQ = P.area * 6.1, mQ = (P.area / MS[P.sys].cov) * X.q;
    const mx = Math.max(sprQ, mQ) * 10;
    const row = (lbl, v, c) => `<div class="tech-bar"><div class="tech-bar-l"><span>${lbl}</span><b class="tech-n">${(v * 10 / 1000).toFixed(1)} m³</b></div><div class="tech-bar-t tall"><i style="width:${((v * 10) / mx * 100).toFixed(1)}%;background:${c}"></i></div><small class="tech-n">${v.toFixed(0)} L/min</small></div>`;
    K.html('mCmp', row(L('Sprinklers (OH1, 6.1 mm/min over the area)', 'مرشات (OH1، 6.1 مم/دقيقة على المساحة)'), sprQ, 'linear-gradient(90deg,#1d4ed8,#3b82f6)')
      + row(`${MS[P.sys].name(L)} — ${Math.ceil(P.area / MS[P.sys].cov)} ${L('nozzles', 'فوهات')}`, mQ, 'linear-gradient(90deg,#0891b2,#22d3ee)')
      + `<div class="adv-callout tech-mt">${mQ < sprQ ? L(`Water mist uses <b>${((1 - mQ / sprQ) * 100).toFixed(0)} % less water</b> — less run-off, less damage, smaller tanks & pumps.`, `يستخدم الرذاذ المائي <b>ماءً أقل بنسبة ${((1 - mQ / sprQ) * 100).toFixed(0)}٪</b> — جريان أقل، أضرار أقل، خزانات ومضخات أصغر.`) : L('Same water demand as sprinklers (reference).', 'نفس الطلب على المياه كالمرشات (مرجعي).')}</div>`);
    K.st('msD', X.dv99.toFixed(0), X.mist ? 'ok' : 'alarm');
    K.st('msA', X.areaL.toFixed(0), '');
    K.st('msQ', X.q.toFixed(1), '');
    K.st('msF', X.dens.toFixed(2), '');
    // gauge
    const pr = clamp(P.p / (P.sys === 'hp' ? 200 : P.sys === 'ip' ? 40 : P.sys === 'lp' ? 16 : 6), 0, 1);
    const a = (-210 + pr * 240) * Math.PI / 180;
    K.attr('mNeedle', 'x2', (130 + Math.cos(a) * 17).toFixed(1)); K.attr('mNeedle', 'y2', (190 + Math.sin(a) * 17).toFixed(1));
    return X;
  }
  let X = panel();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    // fire model
    if (S.on) {
      S.t += dt;
      if (!S.out) {
        const E = X.E;
        if (E >= 0.5) S.Q *= Math.exp(-0.18 * E * dt * 2);
        else { const floor = P.fire * 1000 * (1 - E * 1.4); S.Q += (floor - S.Q) * (1 - Math.exp(-dt / 6)); }
        if (S.Q < 25) { S.out = true; S.Q = 0; }
      }
      const O2min = 20.9 - (P.encl ? 7 * X.inert : 0.4);
      S.O2 += (O2min - S.O2) * (1 - Math.exp(-dt / 12));
      if (S.out) S.O2 += (20.9 - S.O2) * (1 - Math.exp(-dt / 40)) * (P.encl ? 0.1 : 1);
    }
    const Tt = 25 + 430 * (S.Q / 1000) ** 0.6 * (S.on ? 1 - 0.55 * X.cool : 1);
    S.T += (Tt - S.T) * (1 - Math.exp(-dt / 3));
    // particles
    if (S.on) {
      const big = X.dv99 / 1000;
      const rate = Math.round(clamp(6 / Math.max(0.25, big), 3, 14));
      for (let k = 0; k < rate; k++) {
        const pd = pool.find((d) => !d.live); if (!pd) break;
        const ni = Math.floor(Math.random() * NOZ.length);
        const ang = ((Math.random() - 0.5) * MS[P.sys].cone * 2 * Math.PI) / 180;
        const sp = 140 + Math.sqrt(P.p) * 22;
        Object.assign(pd, { live: true, x: NOZ[ni] + Math.sin(ang) * 6, y: 96, vx: Math.sin(ang) * sp, vy: Math.cos(ang) * sp, life: 0, r: 0.7 + big * 2.1 });
        pd.el.setAttribute('r', pd.r.toFixed(2)); pd.el.setAttribute('fill', big > 1 ? '#60a5fa' : '#bae6fd');
      }
    }
    const drag = X.dv99 > 900 ? 0.6 : X.dv99 > 400 ? 2.2 : 4.5;
    for (const d of pool) {
      if (!d.live) continue;
      d.life += dt;
      d.vx *= Math.exp(-drag * dt); d.vy = d.vy * Math.exp(-drag * dt) + 260 * (X.dv99 > 900 ? 1 : 0.18) * dt;
      d.vx += (Math.random() - 0.5) * 60 * dt * (X.dv99 < 400 ? 1 : 0);
      d.x += d.vx * dt; d.y += d.vy * dt;
      const inFire = S.Q > 0 && Math.abs(d.x - 470) < 60 && d.y > 230;
      if (d.y > 330 || d.x < 232 || d.x > 880 || d.life > 4 || (inFire && Math.random() < 0.4 * (X.dv99 < 600 ? 1 : 0.2))) { d.live = false; d.el.setAttribute('r', 0); continue; }
      d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', d.y.toFixed(1));
      d.el.setAttribute('opacity', (0.85 - d.life / 5).toFixed(2));
    }
    const qf = S.Q / Math.max(250, P.fire * 1000);
    K.attr('mFire', 'transform', `translate(470 330) scale(${(clamp(qf, 0, 1.2) * (0.6 + P.fire * 0.2)).toFixed(3)})`);
    K.attr('mFire', 'opacity', S.Q > 0 ? 1 : 0);
    K.attr('mSteamG', 'opacity', S.on && S.Q > 0 ? clamp(X.inert + 0.2, 0, 0.9).toFixed(2) : S.on ? 0.15 : 0);
    K.attr('mFog', 'opacity', S.on ? (clamp(0.18 - X.dv99 / 8000, 0, 0.18) * Math.min(1, S.t / 4)).toFixed(3) : 0);
    K.attr('mFlow', 'opacity', S.on ? 0.9 : 0);
    K.attr('mSv', 'fill', S.on ? '#22c55e' : '#334155');
    K.txt('mGauge', `${S.on ? P.p.toFixed(0) : P.p.toFixed(0)} bar`);
    K.txt('mHud1', `O₂ ${S.O2.toFixed(1)} %`);
    K.txt('mHud2', `T  ${S.T.toFixed(0)} °C`);
    K.txt('mHud3', `HRR ${S.Q.toFixed(0)} kW`);
    K.st('msO', S.O2.toFixed(1), S.O2 < 18 ? 'warn' : 'ok');
    const st = S.out ? [L('Extinguished', 'تم الإطفاء'), 'ok'] : S.on ? (X.E >= 0.5 ? [L('Being extinguished', 'قيد الإطفاء'), 'warn'] : X.E >= 0.3 ? [L('Suppressed', 'مُخمَد جزئياً'), 'warn'] : [L('Controlled only', 'تحت السيطرة فقط'), 'alarm']) : [L('Burning', 'مشتعل'), 'alarm'];
    K.st('msZ', st[0] + (S.out ? ` · ${S.t.toFixed(0)} s` : ''), st[1]);
    S.raf = requestAnimationFrame(frame);
  }
  S.raf = requestAnimationFrame(frame);
  const reset = () => { S.on = false; S.out = false; S.t = 0; S.Q = P.fire * 1000; S.O2 = 20.9; pool.forEach((d) => { d.live = false; d.el.setAttribute('r', 0); }); };
  reset(); S.T = 25 + 430 * P.fire ** 0.6;
  K.onSeg('mSy', (v) => {
    P.sys = v; const s = MS[v]; const i = K.$('mP');
    i.min = s.min; i.max = s.max; i.step = v === 'hp' ? 1 : 0.5; i.value = s.def; P.p = s.def; K.txt('mPV', s.def);
    X = panel();
  });
  K.onRange('mP', (v) => { P.p = v; X = panel(); });
  K.onRange('mFi', (v) => { P.fire = v; if (!S.on) S.Q = v * 1000; X = panel(); }, (v) => v.toFixed(2));
  K.onRange('mAr', (v) => { P.area = v; X = panel(); });
  K.onChk('mEn', (v) => { P.encl = v; X = panel(); });
  K.$('mGo').onclick = () => { if (!S.on) { S.on = true; S.t = 0; } };
  K.$('mRst').onclick = reset;
  return () => cancelAnimationFrame(S.raf);
}

/* ═════════════════════════ 6. PRE-ACTION SYSTEMS ═════════════════════════ */
const PA_T = {
  non: { en: 'Non-interlock', ar: 'بدون تعشيق', open: (d, a) => d || a },
  single: { en: 'Single-interlock', ar: 'تعشيق مفرد', open: (d) => d },
  double: { en: 'Double-interlock', ar: 'تعشيق مزدوج', open: (d, a) => d && a },
};
const PIPE_LEN = 738;
function preSvg() {
  const heads = [420, 520, 620, 720, 820].map((x, i) => `<g id="pHd${i}"><path d="M${x} 74 V84" stroke="#94a3b8" stroke-width="5"/><path d="M${x - 5} 84 H${x + 5} L${x + 3} 92 H${x - 3} Z" fill="#cbd5e1" stroke="#475569"/><path d="M${x - 4} 92 L${x - 4} 100 M${x + 4} 92 L${x + 4} 100" stroke="#cbd5e1" stroke-width="1.4"/><rect ${i === 2 ? 'id="pBulb"' : ''} x="${x - 1.8}" y="92" width="3.6" height="8" rx="1.8" fill="#ef4444"/><path d="M${x - 9} 101 H${x + 9}" stroke="#cbd5e1" stroke-width="2"/></g>`).join('');
  return `<svg viewBox="0 0 900 470" class="adv-svg tech-svg">
  <defs>
    <pattern id="pGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0 H0 V20" fill="none" stroke="#1d3350" stroke-width=".6"/></pattern>
    <linearGradient id="pValve" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7f1d1d"/><stop offset=".45" stop-color="#ef4444"/><stop offset="1" stop-color="#991b1b"/></linearGradient>
    <linearGradient id="pTank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f5f9"/><stop offset=".5" stop-color="#94a3b8"/><stop offset="1" stop-color="#475569"/></linearGradient>
    <linearGradient id="pPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dc2626"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient>
    <filter id="pSh"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity=".5"/></filter>
  </defs>
  <rect width="900" height="470" fill="#0c1826"/><rect width="900" height="470" fill="url(#pGrid)"/>
  <rect x="230" y="30" width="660" height="10" fill="#334155"/>
  <text x="560" y="24" text-anchor="middle" font-size="11.5" fill="#cbd5e1" font-weight="600">${L('PROTECTED AREA — ceiling', 'المنطقة المحمية — السقف')}</text>
  <g filter="url(#pSh)"><path d="M232 40 h36 v6 a18 8 0 0 1 -36 0 z" fill="#f8fafc" stroke="#94a3b8"/><circle id="pDetLed" cx="250" cy="48" r="2.6" fill="#22c55e"/></g>
  <text x="250" y="68" text-anchor="middle" font-size="9.5" fill="#93c5fd">${L('smoke detector', 'كاشف دخان')}</text>
  <!-- piping (dry) -->
  <path d="M330 268 V70 H870" stroke="#64748b" stroke-width="12" fill="none" stroke-linejoin="round"/>
  <path d="M330 268 V70 H870" stroke="#dde5ee" stroke-width="7" fill="none" stroke-linejoin="round"/>
  <path id="pWater" d="M330 268 V70 H870" stroke="#2563eb" stroke-width="7" fill="none" stroke-linejoin="round" stroke-dasharray="0 ${PIPE_LEN}"/>
  <path id="pWFlow" d="M330 268 V70 H870" stroke="#93c5fd" stroke-width="2" fill="none" stroke-dasharray="6 12" class="tech-flow2" opacity="0"/>
  ${heads}
  <g id="pSpray" opacity="0">${Array.from({ length: 9 }, (_, i) => `<line x1="620" y1="102" x2="${620 + (i - 4) * 16}" y2="${170 + Math.abs(i - 4) * -6}" stroke="#60a5fa" stroke-width="2" stroke-dasharray="4 6" class="tech-spray"/>`).join('')}<ellipse cx="620" cy="178" rx="70" ry="10" fill="#3b82f6" opacity=".25"/></g>
  <g id="pAirOut" opacity="0"><g class="tech-exh">${[0, 1, 2].map((i) => `<circle cx="${612 + i * 8}" cy="${112 + i * 6}" r="${3 + i}" fill="none" stroke="#e2e8f0" stroke-width="1.2"/>`).join('')}<text x="640" y="134" font-size="9.5" fill="#e2e8f0">${L('air escaping', 'تسرب الهواء')}</text></g></g>
  <text x="620" y="198" text-anchor="middle" font-size="9.5" fill="#fca5a5" id="pFuseT" opacity="0">${L('fused head (68 °C bulb)', 'رأس منصهر (أمبولة 68°م)')}</text>
  <!-- supply below valve -->
  <path d="M40 440 H330 V300" stroke="#1e3a8a" stroke-width="12" fill="none" stroke-linejoin="round"/>
  <path d="M40 440 H330 V300" stroke="#2563eb" stroke-width="7" fill="none" stroke-linejoin="round"/>
  <text x="60" y="462" font-size="10" fill="#93c5fd">${L('from fire water main / pump', 'من شبكة مياه الحريق / المضخة')}</text>
  <g filter="url(#pSh)"><rect x="318" y="382" width="24" height="30" rx="3" fill="url(#pValve)"/><path d="M330 382 V352" stroke="#cbd5e1" stroke-width="3"/><ellipse cx="330" cy="352" rx="16" ry="4" fill="none" stroke="#ef4444" stroke-width="3"/><text x="352" y="402" font-size="9.5" fill="#cbd5e1">OS&amp;Y</text></g>
  <circle cx="376" cy="428" r="12" fill="#f8fafc" stroke="#334155" stroke-width="2"/><line x1="376" y1="428" x2="384" y2="420" stroke="#dc2626" stroke-width="2"/><path d="M364 436 H342" stroke="#64748b" stroke-width="3"/><text x="394" y="432" font-size="9" fill="#cbd5e1">${L('supply 7 bar', 'التغذية 7 بار')}</text>
  <!-- pre-action / deluge valve -->
  <g filter="url(#pSh)">
    <rect x="304" y="266" width="52" height="40" rx="10" fill="url(#pValve)" stroke="#450a0a"/>
    <rect x="356" y="274" width="28" height="24" rx="5" fill="#b91c1c" stroke="#450a0a"/>
    <line id="pClap" x1="312" y1="294" x2="348" y2="294" stroke="#fef2f2" stroke-width="3" stroke-linecap="round"/>
    <text x="330" y="322" text-anchor="middle" font-size="9.5" fill="#fecaca" font-weight="700">${L('DELUGE / PRE-ACTION VALVE', 'صمام الغمر / سابق التفعيل')}</text>
  </g>
  <path d="M384 286 H430" stroke="#94a3b8" stroke-width="3"/><path d="M450 286 H470 V350" stroke="#94a3b8" stroke-width="3" fill="none"/>
  <g filter="url(#pSh)"><rect x="428" y="274" width="24" height="24" rx="3" fill="#1f2937" stroke="#f87171"/><rect id="pSol" x="432" y="262" width="16" height="14" rx="2" fill="#475569" stroke="#f87171"/><text x="456" y="273" font-size="9" fill="#fca5a5" font-weight="700">SV</text></g>
  <path d="M458 350 H482 L476 366 H464 Z" fill="#334155" stroke="#94a3b8"/><text x="470" y="382" text-anchor="middle" font-size="9" fill="#94a3b8">${L('open drain', 'تصريف مفتوح')}</text>
  <path id="pDrain" d="M470 300 V352" stroke="#60a5fa" stroke-width="2" stroke-dasharray="3 4" class="tech-flow2" opacity="0"/>
  <text x="478" y="318" font-size="8.5" fill="#cbd5e1">${L('priming chamber vent', 'تنفيس حجرة التحضير')}</text>
  <!-- air -->
  <g filter="url(#pSh)">
    <rect x="60" y="340" width="150" height="46" rx="23" fill="url(#pTank)" stroke="#334155"/>
    <rect x="86" y="312" width="44" height="30" rx="5" fill="#1d4ed8" stroke="#1e3a8a"/><circle cx="160" cy="324" r="15" fill="#e2e8f0" stroke="#334155"/>
    <g id="pFan" class="tech-spin-off" style="transform-origin:160px 324px"><path d="M160 312 L163 324 L160 336 L157 324 Z M148 324 L160 321 L172 324 L160 327 Z" fill="#475569"/></g>
    <rect x="70" y="386" width="10" height="10" fill="#334155"/><rect x="190" y="386" width="10" height="10" fill="#334155"/>
    <text x="135" y="368" text-anchor="middle" font-size="9.5" font-weight="700" fill="#1f2937">${L('AIR COMPRESSOR', 'ضاغط الهواء')}</text>
  </g>
  <path d="M210 356 H249 V240 M266 230 H330" stroke="#e2e8f0" stroke-width="3" fill="none"/>
  <g filter="url(#pSh)"><rect x="232" y="220" width="34" height="20" rx="3" fill="#0f766e" stroke="#5eead4"/><text x="249" y="234" text-anchor="middle" font-size="8.5" font-weight="700" fill="#ecfeff">AMD</text></g>
  <text x="249" y="214" text-anchor="middle" font-size="8.5" fill="#99f6e4">${L('air maint. device', 'جهاز تنظيم الهواء')}</text>
  <path d="M290 230 l8 -5 v10 z" fill="#e2e8f0"/>
  <g filter="url(#pSh)"><rect x="344" y="180" width="44" height="24" rx="3" fill="#a16207" stroke="#fde047"/><text x="366" y="196" text-anchor="middle" font-size="8.5" font-weight="700" fill="#fefce8">PS-L</text></g>
  <path d="M336 192 H344" stroke="#94a3b8" stroke-width="3"/>
  <text x="396" y="190" font-size="9" fill="#fde68a">${L('low-air supervisory', 'إشراف انخفاض الهواء')}</text>
  <text x="396" y="202" font-size="9" fill="#fde68a">${L('switch (25 psi)', 'مفتاح (25 psi)')}</text>
  <g filter="url(#pSh)"><rect x="344" y="226" width="44" height="22" rx="3" fill="#1e40af" stroke="#93c5fd"/><text x="366" y="241" text-anchor="middle" font-size="8.5" font-weight="700" fill="#eff6ff">PS-A</text></g>
  <path d="M336 237 H344" stroke="#94a3b8" stroke-width="3"/><text x="396" y="241" font-size="9" fill="#bfdbfe">${L('water-flow alarm switch', 'مفتاح إنذار تدفق المياه')}</text>
  <g><circle cx="292" cy="160" r="20" fill="#f8fafc" stroke="#334155" stroke-width="2.5"/>
    ${Array.from({ length: 9 }, (_, i) => { const a = (-225 + i * 33.75) * Math.PI / 180; return `<line x1="${292 + Math.cos(a) * 14}" y1="${160 + Math.sin(a) * 14}" x2="${292 + Math.cos(a) * 18}" y2="${160 + Math.sin(a) * 18}" stroke="#334155"/>`; }).join('')}
    <line id="pNeedle" x1="292" y1="160" x2="292" y2="146" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round"/><circle cx="292" cy="160" r="2.5" fill="#334155"/>
    <path d="M312 160 H324" stroke="#64748b" stroke-width="3"/>
    <text id="pPsi" x="292" y="192" text-anchor="middle" font-size="9.5" font-family="Consolas, monospace" fill="#e2e8f0">40 psi</text></g>
  <!-- releasing panel -->
  <g filter="url(#pSh)">
    <rect x="20" y="70" width="176" height="200" rx="8" fill="url(#pPanel)" stroke="#450a0a"/>
    <rect x="30" y="80" width="156" height="30" rx="3" fill="#0b1118"/>
    <text id="pLcd" x="38" y="99" font-size="10" font-family="Consolas, monospace" fill="#86efac">SYSTEM NORMAL</text>
    ${[['POWER', '#22c55e'], ['ALARM (DET)', '#ef4444'], ['SUPV LOW AIR', '#facc15'], ['RELEASE (SV)', '#f97316'], ['WATER FLOW', '#ef4444'], ['TROUBLE', '#f59e0b']].map(([t, c], i) => `<circle id="pLed${i}" cx="42" cy="${128 + i * 22}" r="5.5" fill="${i ? '#3f1d1d' : c}" data-c="${c}" stroke="#1f0a0a"/><text x="56" y="${132 + i * 22}" font-size="9.5" font-weight="700" fill="#fef2f2">${t}</text>`).join('')}
  </g>
  <text x="108" y="262" text-anchor="middle" font-size="9" fill="#fecaca" opacity=".85">${L('releasing control panel', 'لوحة تحكم الإطلاق')}</text>
  <path d="M196 90 H222 V47 H232" stroke="#60a5fa" stroke-width="1.6" fill="none" stroke-dasharray="5 3"/>
  <path d="M196 132 H366 V180" stroke="#facc15" stroke-width="1.6" fill="none" stroke-dasharray="5 3"/>
  <path d="M196 250 H220 V258 H440 V262" stroke="#f87171" stroke-width="1.6" fill="none" stroke-dasharray="5 3"/>
</svg>`;
}

function tabPre(root, ctx) {
  const K = kit(root);
  const P = { type: 'single', det: false, fused: false };
  const S = { air: 40, open: false, fill: 0, comp: false, t: 0, prevKey: '' };
  const tName = (k) => L(PA_T[k].en, PA_T[k].ar);
  const SCN = [
    { id: 'freezer', q: L('Frozen-food warehouse at −25 °C — water in the piping would freeze and block it; accidental filling must be avoided.', 'مستودع أغذية مجمدة عند −25°م — الماء في الأنابيب سيتجمد ويسدها؛ يجب تجنب الملء العرضي.'), a: 'double', why: L('Double-interlock: the valve opens only when BOTH detection and a sprinkler operation occur, so a detector fault or a knocked head alone never floods frozen piping. Design as dry-pipe (+30 % area).', 'التعشيق المزدوج: يفتح الصمام فقط عند حدوث الكشف وتشغيل المرش معاً، فلا يغمر عطل الكاشف أو كسر الرأس وحده الأنابيب المجمدة. يُصمم كنظام جاف (+30٪ مساحة).') },
    { id: 'dc', q: L('Data centre / server room — want water only where a head operates, but early detection should pre-fill piping to avoid dry-pipe delay.', 'مركز بيانات / غرفة خوادم — المطلوب ماء فقط حيث يعمل المرش، مع كشف مبكر لملء الأنابيب مسبقاً وتجنب تأخير النظام الجاف.'), a: 'single', why: L('Single-interlock: detection opens the valve and fills the pipes (supervisory warning), but no water discharges unless a head fuses. Mechanical damage to a head only gives a low-air supervisory signal.', 'التعشيق المفرد: يفتح الكشف الصمام ويملأ الأنابيب (تحذير إشرافي)، لكن لا يُفرَّغ ماء ما لم ينصهر رأس. الضرر الميكانيكي للرأس يعطي فقط إشارة إشرافية لانخفاض الهواء.') },
    { id: 'archive', q: L('Archive / museum store with irreplaceable paper — accidental discharge from a damaged head must be avoided; fast response wanted.', 'أرشيف / مخزن متحف بوثائق لا تُعوَّض — يجب تجنب التفريغ العرضي من رأس متضرر؛ مع استجابة سريعة.'), a: 'single', why: L('Single-interlock (often with very early warning ASD): a broken head alone cannot discharge water; detection pre-fills the system so response is as fast as wet-pipe.', 'التعشيق المفرد (غالباً مع ASD للإنذار المبكر جداً): لا يمكن لرأس مكسور وحده تفريغ الماء؛ ويملأ الكشف النظام مسبقاً فتكون الاستجابة بسرعة النظام الرطب.') },
    { id: 'dock', q: L('Unheated loading dock — water must flow even if the detection system fails; detection is only used to speed up valve opening.', 'رصيف تحميل غير مُدفأ — يجب أن يتدفق الماء حتى لو فشل نظام الكشف؛ ويُستخدم الكشف فقط لتسريع فتح الصمام.'), a: 'non', why: L('Non-interlock: the valve opens on detection OR on loss of air from a fused head — it behaves like a dry-pipe system that detection can trip early.', 'بدون تعشيق: يفتح الصمام عند الكشف أو عند فقدان الهواء من رأس منصهر — يتصرف كنظام جاف يمكن للكشف تشغيله مبكراً.') },
  ];
  root.innerHTML = lay(
    card('🚿 ' + L('Pre-action system — valve trim & logic trainer', 'نظام سابق التفعيل — تجهيزات الصمام ومدرّب المنطق'), preSvg()
      + `<div class="adv-legend"><span><i style="background:#dde5ee"></i>${L('pipe with supervisory air', 'أنبوب بهواء إشرافي')}</span><span><i style="background:#2563eb"></i>${L('water', 'ماء')}</span><span><i style="background:#60a5fa"></i>${L('detection circuit', 'دائرة الكشف')}</span><span><i style="background:#facc15"></i>${L('supervisory circuit', 'دائرة الإشراف')}</span><span><i style="background:#f87171"></i>${L('releasing circuit', 'دائرة الإطلاق')}</span></div>`, 'tech-scene')
    + `<div class="adv-stats tech-stats">${sstat('psA', L('Supervisory air', 'الهواء الإشرافي'), 'psi')}${sstat('psV', L('Valve', 'الصمام'))}${sstat('psP', L('Water in piping', 'الماء في الأنابيب'), '%')}${sstat('psD', L('Water from heads', 'الماء من الرؤوس'))}</div>`
    + card('📊 ' + L('Truth table', 'جدول الحقيقة') + ' — ' + `<span id="pTtl"></span>`, '<div id="pTT"></div>'),
    card('🎚️ ' + L('System type', 'نوع النظام'), seg('pTy', Object.keys(PA_T).map((k) => [k, tName(k)]), 'single') + `<div class="adv-note tech-mt" id="pTyN"></div>`)
    + card('🔌 ' + L('Inputs', 'المدخلات'),
      `<div class="tech-inputs"><button class="tech-tog" id="pDet"><span class="dot"></span><b>${L('Detection zone alarm', 'إنذار منطقة الكشف')}</b><small>${L('smoke / heat detector', 'كاشف دخان / حرارة')}</small></button>
       <button class="tech-tog" id="pFus"><span class="dot"></span><b>${L('Sprinkler head fused', 'انصهار رأس مرش')}</b><small>${L('→ air pressure loss', '← فقدان ضغط الهواء')}</small></button></div>
       <div class="adv-btns tech-mt"><button class="btn sm" id="pRst">↺ ${L('Restore system (reset valve, replace head)', 'استعادة النظام (إعادة ضبط الصمام، استبدال الرأس)')}</button></div>`)
    + card('📝 ' + L('Sequence log', 'سجل التسلسل'), '<div class="adv-log" id="pLog" style="max-height:200px"></div>'),
  ) + card('🎯 ' + L('Mini challenge — which pre-action type fits?', 'تحدٍّ مصغّر — أي نوع يناسب؟'), `<div class="tech-mini">${SCN.map((s, i) => `<div class="tech-mq"><div class="tech-mq-q"><span class="tech-badge">${i + 1}</span>${s.q}</div><select id="pQ${i}"><option value="">${L('— choose —', '— اختر —')}</option>${Object.keys(PA_T).map((k) => `<option value="${k}">${tName(k)}</option>`).join('')}</select><div class="tech-mq-a" id="pA${i}"></div></div>`).join('')}</div><div class="adv-btns tech-mt"><button class="btn primary" id="pChk">✔ ${L('Check answers', 'تحقق من الإجابات')}</button></div><div id="pRes"></div>`)
    + explain([
      L('A pre-action system is a dry system with a deluge-type valve held closed and piping filled with low-pressure supervisory air. A separate detection system, through a releasing panel and solenoid valve, controls when water may enter the piping.', 'نظام سابق التفعيل هو نظام جاف بصمام من نوع الغمر مغلق وأنابيب مملوءة بهواء إشرافي منخفض الضغط. يتحكم نظام كشف منفصل، عبر لوحة إطلاق وصمام ملفي، في متى يُسمح للماء بدخول الأنابيب.'),
      L('The solenoid vents the priming (diaphragm) chamber; supply pressure then lifts the clapper and water fills the piping. The sprinklers are still closed heads — water discharges only from heads that have fused.', 'يفرّغ الصمام الملفي حجرة التحضير (الغشاء)؛ فيرفع ضغط التغذية البوابة ويملأ الماء الأنابيب. تبقى المرشات رؤوساً مغلقة — لا يُفرَّغ الماء إلا من الرؤوس التي انصهرت.'),
      L('Supervisory air (≥ 7 psi / 0.5 bar) monitors pipe integrity: a broken head or leak gives a low-air supervisory signal. In double-interlock systems the low-air switch is also one of the two release conditions.', 'يراقب الهواء الإشرافي (≥ 7 psi / 0.5 بار) سلامة الأنابيب: الرأس المكسور أو التسرب يعطي إشارة إشرافية لانخفاض الهواء. في أنظمة التعشيق المزدوج يُعد مفتاح انخفاض الهواء أيضاً أحد شرطي الإطلاق.'),
    ], [
      L('NFPA 13 §8.3: piping and detection shall be automatically supervised when there are more than 20 sprinklers; max. 1000 sprinklers per pre-action valve (single/non-interlock).', 'NFPA 13 §8.3: يجب الإشراف الآلي على الأنابيب والكشف عند وجود أكثر من 20 مرشاً؛ بحد أقصى 1000 مرش لكل صمام سابق التفعيل (مفرد/بدون تعشيق).'),
      L('Double-interlock systems are designed like dry-pipe systems: +30 % design area and a calculated/tested water-delivery time (NFPA 13 §8.2 / §8.3).', 'تُصمم أنظمة التعشيق المزدوج كالأنظمة الجافة: +30٪ من مساحة التصميم وزمن توصيل ماء محسوب/مختبر (NFPA 13 §8.2 / §8.3).'),
      L('Releasing circuits: use listed releasing panel and solenoid compatible with each other; NFPA 72 §23.13 — supervise the solenoid circuit, add abort/disable switches only as permitted.', 'دوائر الإطلاق: استخدم لوحة إطلاق وصماماً ملفياً معتمدين ومتوافقين؛ NFPA 72 §23.13 — أشرف على دائرة الصمام الملفي، وأضف مفاتيح الإلغاء/التعطيل فقط حيث يُسمح.'),
      L('Pitch the piping to drain; provide auxiliary drains and low-point drum drips; use dry-type or listed air, or nitrogen, to limit corrosion.', 'أمِل الأنابيب للتصريف؛ وفّر مصارف مساعدة وتجميع نقاط منخفضة؛ استخدم هواءً جافاً أو نيتروجيناً للحد من التآكل.'),
      L('NFPA 25: annual trip test (with control valve partially open), quarterly low-air alarm test, check compressor restores pressure within 30 min.', 'NFPA 25: اختبار تشغيل سنوي (مع صمام التحكم مفتوح جزئياً)، واختبار إنذار انخفاض الهواء كل ربع سنة، والتحقق من أن الضاغط يستعيد الضغط خلال 30 دقيقة.'),
    ]);

  const logS = (m, c) => K.log('pLog', S.t, m, c);
  const TYN = {
    non: L('Valve opens on detection <b>OR</b> air loss. Water flows even if detection fails.', 'يفتح الصمام عند الكشف <b>أو</b> فقدان الهواء. يتدفق الماء حتى لو فشل الكشف.'),
    single: L('Valve opens on detection only. A fused head without detection → low-air supervisory, no water.', 'يفتح الصمام عند الكشف فقط. رأس منصهر بدون كشف ← إشراف انخفاض الهواء، بدون ماء.'),
    double: L('Valve opens only on detection <b>AND</b> air loss (head fused). Slowest, but most protected against accidental water.', 'يفتح الصمام فقط عند الكشف <b>و</b> فقدان الهواء (انصهار رأس). الأبطأ، لكنه الأكثر حماية من الماء العرضي.'),
  };
  function truth() {
    const f = PA_T[P.type].open;
    const rows = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const cur = `${+P.det}${+P.fused}`;
    const yes = (b, c = 'ok') => (b ? `<span class="adv-pill ${c}">●</span>` : '<span class="tech-mut">○</span>');
    K.txt('pTtl', tName(P.type));
    K.html('pTT', `<table class="adv-table tech-tt"><thead><tr><th>${L('Detection', 'الكشف')}</th><th>${L('Head fused / air loss', 'انصهار رأس / فقدان هواء')}</th><th>${L('Valve opens', 'فتح الصمام')}</th><th>${L('Pipe fills', 'امتلاء الأنبوب')}</th><th>${L('Water discharges', 'تفريغ الماء')}</th><th>${L('Panel signal', 'إشارة اللوحة')}</th></tr></thead><tbody>${rows.map(([d, a]) => {
      const o = f(!!d, !!a);
      const sig = [d ? L('Alarm', 'إنذار') : '', a && !o ? L('Supervisory (low air)', 'إشرافي (انخفاض هواء)') : '', o && a ? L('Water-flow alarm', 'إنذار تدفق') : ''].filter(Boolean).join(' + ') || '—';
      return `<tr class="${`${d}${a}` === cur ? 'on' : ''}"><td>${yes(d, 'info')}</td><td>${yes(a, 'warn')}</td><td>${yes(o)}</td><td>${yes(o)}</td><td>${yes(o && a, 'bad')}</td><td>${sig}</td></tr>`;
    }).join('')}</tbody></table>`);
    K.html('pTyN', TYN[P.type]);
  }
  function tick() {
    const dt = 0.2; S.t += dt;
    const leaking = P.fused && S.fill < 1;
    if (leaking) S.air = Math.max(0, S.air - 3.2 * dt + (S.comp ? 0.5 * dt : 0));
    else if (!S.open && S.air < 40) S.air = Math.min(40, S.air + 1.5 * dt);
    S.comp = !S.open && S.air < 36;
    const lowAir = S.air < 25;
    if (!S.open && PA_T[P.type].open(P.det, lowAir)) { S.open = true; logS(L('Releasing panel energises solenoid → priming chamber vented → VALVE TRIPS', 'لوحة الإطلاق تُفعِّل الصمام الملفي ← تفريغ حجرة التحضير ← انفتاح الصمام'), 'fire'); }
    if (S.open && S.fill < 1) { S.fill = Math.min(1, S.fill + dt / 8); if (S.fill >= 1) logS(L('Piping filled with water', 'امتلأت الأنابيب بالماء'), 'info'); }
    if (S.open) S.air = S.fill >= 1 ? 100 : S.air;
    const discharge = S.open && S.fill >= 1 && P.fused;
    const key = `${+P.det}${+lowAir}${+S.open}${+discharge}`;
    if (key !== S.prevKey) {
      if (lowAir && !S.open && S.prevKey[1] !== '1') logS(L('SUPERVISORY — low air pressure', 'إشرافي — انخفاض ضغط الهواء'), 'super');
      if (discharge && S.prevKey[3] !== '1') logS(L('WATER FLOW — water discharging from fused head', 'تدفق ماء — الماء يتدفق من الرأس المنصهر'), 'fire');
      S.prevKey = key;
    }
    // visuals
    K.attr('pWater', 'stroke-dasharray', `${(S.fill * PIPE_LEN).toFixed(1)} ${PIPE_LEN}`);
    K.attr('pWFlow', 'opacity', discharge || (S.open && S.fill < 1) ? 0.9 : 0);
    K.attr('pSpray', 'opacity', discharge ? 1 : 0);
    K.attr('pAirOut', 'opacity', leaking && S.air > 1 ? 1 : 0);
    K.attr('pFuseT', 'opacity', P.fused ? 1 : 0);
    K.attr('pBulb', 'opacity', P.fused ? 0 : 1);
    K.attr('pClap', 'transform', S.open ? 'rotate(-70 312 294)' : '');
    K.attr('pSol', 'fill', S.open ? '#f97316' : '#475569');
    K.attr('pDrain', 'opacity', S.open ? 0.9 : 0);
    K.attr('pDetLed', 'fill', P.det ? '#ef4444' : '#22c55e');
    K.$('pFan').setAttribute('class', S.comp ? 'tech-spin' : '');
    const psi = S.open && S.fill >= 1 ? 100 : S.air;
    const a = (-225 + clamp(psi / 120, 0, 1) * 270) * Math.PI / 180;
    K.attr('pNeedle', 'x2', (292 + Math.cos(a) * 14).toFixed(1)); K.attr('pNeedle', 'y2', (160 + Math.sin(a) * 14).toFixed(1));
    K.txt('pPsi', `${psi.toFixed(0)} psi`);
    const leds = [true, P.det, lowAir && !S.open, S.open, discharge, false];
    leds.forEach((on, i) => { const e = K.$(`pLed${i}`); e.setAttribute('fill', on ? e.dataset.c : '#3f1d1d'); e.classList.toggle('tech-ledon', on && i > 0); });
    const lcd = discharge ? 'WATER FLOW ALARM' : S.open ? 'RELEASED - FILLING' : P.det ? 'FIRE ALARM ZONE 1' : lowAir ? 'SUPV: LOW AIR' : 'SYSTEM NORMAL';
    K.txt('pLcd', lcd); K.attr('pLcd', 'fill', discharge || P.det ? '#fca5a5' : lowAir ? '#fde047' : '#86efac');
    K.st('psA', S.open && S.fill >= 1 ? L('water', 'ماء') : S.air.toFixed(0), lowAir && !S.open ? 'warn' : 'ok');
    K.st('psV', S.open ? L('OPEN (tripped)', 'مفتوح (تم التشغيل)') : L('closed', 'مغلق'), S.open ? 'alarm' : 'ok');
    K.st('psP', (S.fill * 100).toFixed(0), S.fill > 0 ? 'warn' : 'ok');
    K.st('psD', discharge ? L('YES', 'نعم') : L('no', 'لا'), discharge ? 'alarm' : 'ok');
  }
  const timer = setInterval(tick, 200);
  const tog = (id, k) => K.$(id).addEventListener('click', () => {
    if (k === 'fused' && P.fused) return; // a fused head stays fused until replaced
    P[k] = !P[k]; K.$(id).classList.toggle('on', P[k]);
    logS(k === 'det' ? (P.det ? L('Detection zone in ALARM', 'منطقة الكشف في إنذار') : L('Detection restored', 'استعادة الكشف')) : L('Sprinkler head fused — air escaping', 'انصهار رأس المرش — تسرب الهواء'), k === 'det' && P.det ? 'fire' : 'info');
    truth();
  });
  tog('pDet', 'det'); tog('pFus', 'fused');
  K.onSeg('pTy', (v) => { P.type = v; truth(); logS(L(`Configured as ${tName(v)}`, `تمت التهيئة كنظام ${tName(v)}`), 'info'); });
  K.$('pRst').onclick = () => { Object.assign(S, { air: 40, open: false, fill: 0, prevKey: '' }); P.det = false; P.fused = false; K.$('pDet').classList.remove('on'); K.$('pFus').classList.remove('on'); truth(); logS(L('System restored — valve reset, head replaced, air re-established', 'استعادة النظام — إعادة ضبط الصمام، استبدال الرأس، استعادة الهواء'), 'ok'); };
  K.$('pChk').onclick = () => {
    let ok = 0;
    SCN.forEach((s, i) => {
      const v = K.$(`pQ${i}`).value, r = v === s.a;
      if (r) ok++;
      K.$(`pA${i}`).innerHTML = `${r ? pill('ok', '✓ ' + L('Correct', 'صحيح')) : pill('bad', `✗ ${L('Answer', 'الإجابة')}: ${tName(s.a)}`)} <span>${s.why}</span>`;
    });
    const sc = Math.round((ok / SCN.length) * 100);
    K.$('pRes').innerHTML = scoreBanner(sc, L(`${ok} / ${SCN.length} correct — pre-action selection`, `${ok} / ${SCN.length} صحيحة — اختيار نظام سابق التفعيل`));
    ctx.helpers?.recordResult?.({ type: 'lab', topic: 'tech/preaction', score: ok, total: SCN.length });
  };
  truth(); tick();
  logS(L('System normal — supervisory air 40 psi', 'النظام طبيعي — الهواء الإشرافي 40 psi'), 'ok');
  return () => clearInterval(timer);
}

/* ═════════════════════════ 7. TECHNOLOGY SELECTION CHALLENGE ═════════════════════════ */
function quizItems() {
  return [
    { q: L('Tier III data hall, 4 m ceiling, CRAC units giving very high air-change rates; the owner wants warning long before visible smoke.', 'قاعة بيانات Tier III، سقف 4 م، وحدات تكييف تعطي معدلات تغيير هواء عالية جداً؛ المالك يريد إنذاراً قبل ظهور الدخان المرئي بكثير.'),
      o: [L('Spot photoelectric detectors', 'كواشف كهروضوئية نقطية'), L('Aspirating smoke detection (ASD), Class A', 'كشف الدخان بالشفط (ASD)، الفئة A'), L('Linear heat cable', 'كابل حراري خطي'), L('UV flame detectors', 'كواشف لهب UV')], a: 1,
      w: L('High airflow dilutes smoke; ASD samples actively, reaches 0.005 %/m and can sample at CRAC returns (NFPA 75/76).', 'التدفق العالي يخفف الدخان؛ ASD يسحب العينات بنشاط ويصل إلى 0.005 %/م ويمكنه أخذ العينات عند مرتدات التكييف (NFPA 75/76).') },
    { q: L('High-bay distribution warehouse, 16 m flat roof, 90 m long, forklift traffic; spot detectors would need a 16 m lift to maintain.', 'مستودع توزيع عالي، سقف مستوٍ 16 م، طول 90 م، حركة رافعات؛ الكواشف النقطية تحتاج رافعة 16 م لصيانتها.'),
      o: [L('Optical beam smoke detectors', 'كواشف دخان بالشعاع الضوئي'), L('Spot heat detectors', 'كواشف حرارة نقطية'), L('Water mist', 'رذاذ مائي'), L('UV/IR flame detectors', 'كواشف لهب UV/IR')], a: 0,
      w: L('Beams cover ~100 m × 18 m each, are maintained from floor level and integrate diluted smoke over the path.', 'يغطي كل شعاع ~100 م × 18 م، ويُصان من مستوى الأرض، ويجمع الدخان المخفف على طول المسار.') },
    { q: L('Outdoor LPG road-tanker loading gantry in direct sunlight with hot truck exhausts; 40–50 m detection distance needed.', 'منصة تعبئة صهاريج LPG خارجية تحت أشعة الشمس المباشرة مع عوادم شاحنات ساخنة؛ مطلوب مسافة كشف 40–50 م.'),
      o: [L('Single UV flame detector', 'كاشف لهب UV مفرد'), L('Multi-spectrum IR3 flame detectors', 'كواشف لهب IR3 متعددة الأطياف'), L('Spot smoke detectors', 'كواشف دخان نقطية'), L('Optical beam', 'شعاع ضوئي')], a: 1,
      w: L('IR3 gives ~65 m for 0.1 m² n-heptane and rejects sunlight and hot bodies; smoke detectors don’t work outdoors.', 'يعطي IR3 ~65 م لحريق 0.1 م² n-heptane ويرفض الشمس والأجسام الساخنة؛ كواشف الدخان لا تعمل في الخارج.') },
    { q: L('2 km road tunnel; the ventilation control needs the fire location to within a few metres.', 'نفق طرق بطول 2 كم؛ يحتاج التحكم بالتهوية إلى موقع الحريق بدقة بضعة أمتار.'),
      o: [L('Linear heat detection with location (fibre DTS / locating LHD)', 'كشف حراري خطي مع تحديد الموقع (ألياف DTS / LHD بمحدد موقع)'), L('Optical beams', 'أشعة ضوئية'), L('ASD', 'ASD'), L('Spot heat detectors', 'كواشف حرارة نقطية')], a: 0,
      w: L('Linear heat with location (NFPA 502) survives dirt, exhaust fumes and washing, and reports position for zoned ventilation.', 'الكشف الحراري الخطي مع الموقع (NFPA 502) يتحمل الأوساخ وعوادم السيارات والغسيل، ويبلغ الموقع للتهوية المقسمة.') },
    { q: L('Occupied diesel-generator room; minimise water damage and thermal shock to the engine; people may be inside at discharge.', 'غرفة مولد ديزل مأهولة؛ المطلوب تقليل أضرار المياه والصدمة الحرارية للمحرك؛ قد يوجد أشخاص عند التفريغ.'),
      o: [L('Standard wet sprinklers', 'مرشات رطبة قياسية'), L('Water mist (NFPA 750), listed for machinery spaces', 'رذاذ مائي (NFPA 750) معتمد لغرف الآلات'), L('CO₂ total flooding', 'غمر كلي بثاني أكسيد الكربون'), L('Foam deluge', 'غمر بالرغوة')], a: 1,
      w: L('Water mist is safe for occupants (unlike CO₂), uses ~70–90 % less water than sprinklers and is listed for Class B machinery-space fires.', 'الرذاذ المائي آمن للأشخاص (بخلاف CO₂)، ويستخدم ماءً أقل بنحو 70–90٪ من المرشات، ومعتمد لحرائق فئة B في غرف الآلات.') },
    { q: L('Cold store at −25 °C; the insurer insists that neither a detector fault nor a damaged head alone may put water into the piping.', 'مخزن تبريد عند −25°م؛ يشترط المؤمِّن ألا يُدخل عطل كاشف أو رأس متضرر وحده الماء إلى الأنابيب.'),
      o: [L('Wet-pipe with antifreeze', 'نظام رطب بمانع تجمد'), L('Single-interlock pre-action', 'سابق التفعيل بتعشيق مفرد'), L('Double-interlock pre-action', 'سابق التفعيل بتعشيق مزدوج'), L('Deluge', 'نظام غمر')], a: 2,
      w: L('Double-interlock requires detection AND loss of air before the valve opens (NFPA 13 §8.3).', 'التعشيق المزدوج يتطلب الكشف وفقدان الهواء معاً قبل فتح الصمام (NFPA 13 §8.3).') },
    { q: L('Heritage building with a painted, ornate ceiling; detectors must be almost invisible and maintained without scaffolding.', 'مبنى تراثي بسقف مزخرف مطلي؛ يجب أن تكون الكواشف شبه غير مرئية وأن تُصان دون سقالات.'),
      o: [L('Optical beam', 'شعاع ضوئي'), L('ASD with capillary sampling points', 'ASD بنقاط أخذ عينات شعرية'), L('Wireless spot detectors', 'كواشف نقطية لاسلكية'), L('Linear heat cable', 'كابل حراري خطي')], a: 1,
      w: L('Pipes run in the roof void; only ~3 mm capillary points show on the ceiling. All maintenance is at the detector unit.', 'تمر الأنابيب في فراغ السقف؛ لا يظهر على السقف سوى نقاط شعرية ~3 مم. وتتم كل الصيانة عند وحدة الكاشف.') },
    { q: L('Aircraft hangar (NFPA 409) — a fuel spill fire under the wing must trigger the foam system quickly, but a spurious release is very costly.', 'حظيرة طائرات (NFPA 409) — يجب أن يُشغِّل حريق انسكاب وقود تحت الجناح نظام الرغوة بسرعة، لكن الإطلاق الخاطئ مكلف جداً.'),
      o: [L('IR3 flame detectors with 2ooN voting for release', 'كواشف لهب IR3 مع تصويت 2ooN للإطلاق'), L('One UV detector, 1ooN release', 'كاشف UV واحد، إطلاق 1ooN'), L('Spot heat detectors at the roof', 'كواشف حرارة نقطية في السقف'), L('ASD at the roof', 'ASD في السقف')], a: 0,
      w: L('Flame detectors see the floor-level fire in seconds; two-detector voting prevents a single spurious signal from releasing foam.', 'ترى كواشف اللهب الحريق على مستوى الأرض خلال ثوانٍ؛ ويمنع تصويت كاشفين إطلاق الرغوة بإشارة خاطئة واحدة.') },
  ];
}
function tabQuiz(root, ctx) {
  const Q = quizItems();
  const best = store.get('tech.best', null);
  root.innerHTML = `<div class="adv-callout">${L('For each scenario choose the most appropriate technology. Your score is recorded in your progress (module 8).', 'لكل سيناريو اختر التقنية الأنسب. تُسجل نتيجتك في تقدمك (الوحدة 8).')} ${best != null ? pill('info', `${L('Best', 'الأفضل')}: ${best} %`) : ''}</div>
    <div class="tech-quiz">${Q.map((it, i) => `<div class="card tech-qc" id="qc${i}"><div class="tech-qh"><span class="tech-badge">${i + 1}</span><span>${it.q}</span></div><div class="tech-opts">${it.o.map((o, j) => `<label class="tech-opt"><input type="radio" name="q${i}" value="${j}"><span>${o}</span></label>`).join('')}</div><div class="tech-why" id="qw${i}"></div></div>`).join('')}</div>
    <div class="adv-btns"><button class="btn primary" id="qGo">✔ ${L('Submit answers', 'إرسال الإجابات')}</button><button class="btn" id="qRe">↺ ${L('Try again', 'حاول مجدداً')}</button></div><div id="qRes"></div>`;
  root.querySelector('#qGo').onclick = () => {
    let ok = 0, answered = 0;
    Q.forEach((it, i) => {
      const sel = root.querySelector(`input[name=q${i}]:checked`);
      if (sel) answered++;
      const r = sel && +sel.value === it.a;
      if (r) ok++;
      const c = root.querySelector(`#qc${i}`);
      c.classList.toggle('ok', !!r); c.classList.toggle('bad', !r);
      c.querySelectorAll('.tech-opt').forEach((l, j) => { l.classList.toggle('right', j === it.a); l.classList.toggle('wrong', !!sel && +sel.value === j && j !== it.a); });
      root.querySelector(`#qw${i}`).innerHTML = `${r ? '✅' : '❌'} ${it.w}`;
    });
    const sc = Math.round((ok / Q.length) * 100);
    root.querySelector('#qRes').innerHTML = scoreBanner(sc, `<b>${ok} / ${Q.length}</b> ${L('correct', 'صحيحة')}${answered < Q.length ? ` · ${Q.length - answered} ${L('unanswered', 'بلا إجابة')}` : ''}<br><span class="tech-mut">${sc >= 80 ? L('Excellent — module 8 completed.', 'ممتاز — اكتملت الوحدة 8.') : L('Review the simulators and try again (80 % to complete).', 'راجع المحاكيات وحاول مجدداً (80٪ للإكمال).')}</span>`);
    markDone('tech', sc);
    store.set('tech.best', Math.max(best ?? 0, sc));
    ctx.helpers?.recordResult?.({ type: 'lab', topic: 'tech/selection', score: ok, total: Q.length });
    root.querySelector('#qRes').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  root.querySelector('#qRe').onclick = () => tabQuiz(root, ctx);
  return null;
}

/* ═════════════════════════ module ═════════════════════════ */
const TABS = () => [
  { id: 'vesda', label: '🌫️ ' + L('Aspirating (ASD)', 'الشفط (ASD)'), fn: tabVesda },
  { id: 'beam', label: '📡 ' + L('Beam detector', 'كاشف الشعاع'), fn: tabBeam },
  { id: 'flame', label: '🔥 ' + L('Flame UV/IR', 'كاشف اللهب UV/IR'), fn: tabFlame },
  { id: 'lhd', label: '🌡️ ' + L('Linear heat', 'الحراري الخطي'), fn: tabLhd },
  { id: 'mist', label: '💧 ' + L('Water mist', 'الرذاذ المائي'), fn: tabMist },
  { id: 'pre', label: '🚿 ' + L('Pre-action', 'سابق التفعيل'), fn: tabPre },
  { id: 'quiz', label: '🏆 ' + L('Selection challenge', 'تحدي الاختيار'), fn: tabQuiz },
];

const m = {
  id: 'tech', icon: '🔬',
  title: { en: 'Modern Detection & Suppression Technologies', ar: 'تقنيات الكشف والإطفاء الحديثة' },
  short: { en: 'ASD, beam, flame, LHD, mist, pre-action', ar: 'الشفط، الشعاع، اللهب، الخطي، الرذاذ، سابق التفعيل' },
  sub: {
    en: 'Hands-on simulators for special-hazard technologies: aspirating smoke detection, projected-beam and flame detectors, linear heat cable, water mist and pre-action sprinkler logic — with the design rules, commissioning checks and a technology-selection challenge.',
    ar: 'محاكيات تفاعلية لتقنيات المخاطر الخاصة: كشف الدخان بالشفط، كواشف الشعاع الضوئي واللهب، كابل الكشف الحراري الخطي، الرذاذ المائي ومنطق أنظمة الرش سابقة التفعيل — مع قواعد التصميم وفحوصات الاستلام وتحدي اختيار التقنية.',
  },
  refs: ['NFPA 72 §17.6', 'NFPA 72 §17.7.3.6', 'NFPA 72 §17.7.3.7', 'NFPA 72 §17.8', 'NFPA 750', 'NFPA 13 §8.3', 'NFPA 25'],
  render(el, ctx) {
    const tabs = TABS();
    let cur = store.get('tech.tab', 'vesda');
    if (!tabs.some((t) => t.id === cur)) cur = 'vesda';
    let clean = null;
    el.innerHTML = header(m) + tabBar(tabs, cur) + '<div id="techBody" class="tech"></div>';
    const body = el.querySelector('#techBody');
    const show = (id) => {
      if (clean) { try { clean(); } catch { /* ignore */ } clean = null; }
      cur = id; store.set('tech.tab', id);
      el.querySelectorAll('.adv-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
      body.innerHTML = '';
      try { clean = tabs.find((t) => t.id === id).fn(body, ctx) || null; } catch (e) { console.error(e); body.innerHTML = `<div class="card err">${e.message}</div>`; }
    };
    el.querySelectorAll('.adv-tabs button').forEach((b) => { b.onclick = () => show(b.dataset.tab); });
    show(cur);
    return () => { if (clean) { try { clean(); } catch { /* ignore */ } } clean = null; };
  },
};
export default m;





