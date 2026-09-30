// Module 2 — Cause & Effect matrix: program the fire-alarm logic (inputs × outputs, with delays),
// grade it against NFPA 72 / 90A / 92 / 101 / 2001, and run fire scenarios on a live building section
// that shows every output (sounders, voice evac, AHU, dampers, stair fans, lift recall, door holders,
// access control, FM-200, Civil Defense signal, BMS alert).
import { CAUSES, EFFECTS, typicalMatrix, emptyMatrix, gradeMatrix, DELAY_S } from './system.js';
import { FLOORS } from './building.js';
import { header, L, esc, tr, store, markDone, tabBar, scoreBanner, mmss } from './ui.js';

const T = (en, ar) => ({ en, ar });
const m = {
  id: 'cause', icon: '🧩',
  title: T('Cause & Effect Matrix', 'مصفوفة السبب والنتيجة'),
  short: T('Program the smart logic & run fires', 'برمج المنطق الذكي وشغّل الحرائق'),
  sub: T('The "intelligence" of a smart fire system is its cause-and-effect programming: which inputs (detectors, call points, waterflow, cross-zoned server-room detection) drive which outputs (evacuation, HVAC shutdown, dampers, stair pressurization, lift recall, door release, access control, FM-200 release, off-site signalling). Build the matrix, check it against the codes and watch it run.',
    'ذكاء نظام الحريق الذكي هو برمجة السبب والنتيجة: أي المدخلات (الكواشف، الأزرار اليدوية، تدفق المياه، الكشف المتقاطع لغرفة الخوادم) تشغّل أي المخرجات (الإخلاء، إيقاف التكييف، الخوانق، ضغط الدرج، استدعاء المصعد، تحرير الأبواب، التحكم بالدخول، تفريغ FM-200، الإبلاغ الخارجي). ابنِ المصفوفة وافحصها وفق الأكواد وشاهدها تعمل.'),
  refs: ['NFPA 72 §21 Emergency control functions', 'NFPA 72 §23.8.5.4.3', 'NFPA 90A', 'NFPA 2001 §4.3', 'NFPA 101 §7.2.1.6'],
};

// ───────────────────────── building section (shared with the BMS module)
export function sectionSvg(dark = false) {
  const fy = { 2: 110, 1: 230, G: 350 };             // floor top (ceiling line) — each storey 120 px
  const floorRow = (f) => {
    const y = fy[f.id];
    return `<g class="fl" data-fl="${f.id}">
      <rect x="140" y="${y}" width="620" height="120" class="fl-bg"/>
      <text x="150" y="${y + 18}" class="fl-t">${f.id === 'G' ? 'G' : f.id + 'F'} · ${esc(tr(f.name))}</text>
      <g class="fire-ico" transform="translate(${f.id === '1' ? 540 : 470} ${y + 116})"><path d="M0 0 C-14 -10 -8 -26 0 -38 C2 -26 12 -24 12 -12 C16 -18 16 -24 14 -28 C24 -18 22 -2 10 0 Z" class="flame"/><path d="M2 0 C-6 -6 -2 -16 3 -22 C5 -14 10 -12 8 -4 Z" class="flame2"/></g>
      <g class="smoke-ico" transform="translate(${f.id === '1' ? 540 : 470} ${y + 30})"><circle r="16" /><circle cx="18" cy="4" r="12"/><circle cx="-16" cy="6" r="11"/></g>
      <g class="spk" transform="translate(260 ${y + 12})"><rect x="-10" y="-4" width="20" height="8" rx="2"/><path d="M-6 4 L6 4 L10 12 L-10 12 Z"/><path d="M-16 20 Q0 32 16 20" class="w1"/><path d="M-24 28 Q0 46 24 28" class="w2"/><text y="50" text-anchor="middle" class="spk-t"></text></g>
      <g class="hs" transform="translate(330 ${y + 60})"><rect x="-9" y="-12" width="18" height="24" rx="3"/><rect x="-5" y="-8" width="10" height="7" rx="1" class="st"/><circle cy="6" r="3" class="hn"/></g>
      <g class="door" transform="translate(142 ${y + 120})"><rect x="0" y="-70" width="6" height="70" class="frame"/><rect x="6" y="-68" width="38" height="68" class="leaf"/><circle cx="4" cy="-58" r="4" class="holder"/></g>
      <g class="damper" transform="translate(716 ${y + 14})"><rect x="-10" y="-8" width="20" height="16" class="dbox"/><line x1="-7" y1="0" x2="7" y2="0" class="blade"/></g>
      <path d="M716 ${y + 8} L716 ${y} " class="duct-v"/><rect x="560" y="${y + 6}" width="146" height="10" class="duct-h"/>
      ${[400, 470, 540, 620].map((x) => `<circle cx="${x}" cy="${y + 4}" r="4" class="det"/>`).join('')}
      <g class="people">${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${420 + i * 55} ${y + 118})"><g class="p" style="--i:${i};--dx:${150 - (420 + i * 55)}px"><circle cy="-26" r="4.5"/><path d="M0 -21 L0 -8 M-6 -16 L6 -16 M0 -8 L-5 0 M0 -8 L5 0"/></g></g>`).join('')}</g>
    </g>`;
  };
  return `<svg viewBox="0 0 900 520" class="adv-svg ce-sec ${dark ? 'dark' : ''}">
    <defs>
      <linearGradient id="ceSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dark ? '#0b1320' : '#dbeafe'}"/><stop offset="1" stop-color="${dark ? '#101c2c' : '#f1f5f9'}"/></linearGradient>
      <pattern id="ceHatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7 L7 0" stroke="${dark ? '#27384b' : '#c7d0da'}" stroke-width="1"/></pattern>
      <radialGradient id="ceFog"><stop offset="0" stop-color="#e0f2fe" stop-opacity=".95"/><stop offset="1" stop-color="#e0f2fe" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="900" height="520" fill="url(#ceSky)"/>
    <rect x="0" y="470" width="900" height="50" class="ground"/>
    ${FLOORS.map(floorRow).join('')}
    <!-- slabs & walls -->
    ${[110, 230, 350, 470].map((y) => `<rect x="54" y="${y - 4}" width="712" height="8" class="slab"/>`).join('')}
    <rect x="54" y="106" width="8" height="368" class="wall"/><rect x="758" y="106" width="8" height="368" class="wall"/>
    <!-- stair A -->
    <rect x="62" y="110" width="78" height="360" class="stair"/><rect x="62" y="110" width="78" height="360" fill="url(#ceHatch)"/>
    ${[0, 1, 2].map((k) => `<path d="M70 ${462 - k * 120} L132 ${402 - k * 120} M70 ${402 - k * 120} L132 ${346 - k * 120}" class="flight"/>`).join('')}
    <text x="101" y="100" text-anchor="middle" class="lbl">${L('Stair A', 'الدرج A')}</text>
    <g class="press-air"><path d="M80 130 L80 440" /><path d="M120 130 L120 440"/></g>
    <!-- lift -->
    <rect x="380" y="110" width="54" height="360" class="shaft"/><line x1="407" y1="110" x2="407" y2="470" class="rope"/>
    <g id="ceCar" class="car"><rect x="384" y="-100" width="46" height="96" rx="3"/><rect x="392" y="-88" width="30" height="72" class="cardoor"/><text x="407" y="-40" text-anchor="middle" class="carT">🛗</text></g>
    <text x="407" y="100" text-anchor="middle" class="lbl">${L('Lift', 'المصعد')}</text>
    <!-- server room with FM-200 on 1F -->
    <rect x="590" y="236" width="120" height="112" class="srv"/><text x="650" y="252" text-anchor="middle" class="srv-t">${L('Server room', 'غرفة الخوادم')}</text>
    ${[0, 1, 2].map((i) => `<rect x="${612 + i * 26}" y="290" width="18" height="56" rx="2" class="rack"/>`).join('')}
    <g id="ceFm" class="fm"><rect x="688" y="286" width="16" height="58" rx="7" class="cyl"/><rect x="690" y="280" width="12" height="8" class="valve"/><path d="M696 280 L696 240 L650 240 L650 246" class="fmpipe"/><circle cx="650" cy="249" r="3.5" class="nozzle"/>
      <circle cx="650" cy="300" r="70" fill="url(#ceFog)" class="fog"/><circle cx="600" cy="268" r="5" class="fmstrobe"/></g>
    <text x="650" y="364" text-anchor="middle" class="fm-t" id="ceFmT"></text>
    <!-- roof -->
    <g id="ceAhu" class="ahu"><rect x="560" y="52" width="120" height="50" rx="4" class="box"/><circle cx="600" cy="77" r="17" class="fan-ring"/><g transform="translate(600 77)"><g class="fan"><path d="M0 0 L0 -14 A14 14 0 0 1 10 -10 Z M0 0 L14 0 A14 14 0 0 1 10 10 Z M0 0 L0 14 A14 14 0 0 1 -10 10 Z M0 0 L-14 0 A14 14 0 0 1 -10 -10 Z"/></g></g>
      <text x="650" y="72" class="lbl2">AHU</text><text x="650" y="88" class="lbl3" id="ceAhuT"></text></g>
    <rect x="706" y="102" width="20" height="8" class="duct-h"/><path d="M716 102 L716 470" class="duct-v"/>
    <g id="ceSf" class="sfan"><rect x="70" y="60" width="62" height="42" rx="4" class="box"/><circle cx="101" cy="81" r="15" class="fan-ring"/><g transform="translate(101 81)"><g class="fan"><path d="M0 0 L0 -12 A12 12 0 0 1 9 -8 Z M0 0 L12 0 A12 12 0 0 1 9 8 Z M0 0 L0 12 A12 12 0 0 1 -9 8 Z M0 0 L-12 0 A12 12 0 0 1 -9 -8 Z"/></g></g></g>
    <text x="101" y="52" text-anchor="middle" class="lbl">${L('Stair press. fan', 'مروحة ضغط الدرج')}</text>
    <g id="ceAnt" class="ant"><path d="M470 102 L470 40" class="mast"/><circle cx="470" cy="38" r="4" class="tip"/><path d="M482 30 Q492 38 482 46" class="w1"/><path d="M492 22 Q508 38 492 54" class="w2"/><path d="M502 14 Q524 38 502 62" class="w3"/></g>
    <text x="470" y="118" text-anchor="middle" class="lbl3">DACT</text>
    <!-- civil defense -->
    <g id="ceCd" class="cd" transform="translate(830 330)"><rect x="-56" y="0" width="112" height="140" class="cd-b"/><path d="M-62 0 L0 -26 L62 0 Z" class="cd-r"/><text y="36" text-anchor="middle" class="cd-t">🚒</text><text y="62" text-anchor="middle" class="lbl3">${L('Civil Defense', 'الدفاع المدني')}</text><text y="80" text-anchor="middle" class="lbl3" id="ceCdT"></text></g>
    <path d="M510 38 Q720 60 812 318" class="sig" id="ceSig"/>
    <!-- entrance & access control -->
    <g id="ceAcc" class="acc" transform="translate(760 470)"><rect x="-2" y="-78" width="6" height="78" class="frame"/><rect x="-12" y="-86" width="14" height="8" rx="2" class="mag"/><text x="-8" y="-92" text-anchor="middle" class="lbl3" id="ceAccT"></text></g>
    <!-- BMS -->
    <g id="ceBms" class="bms" transform="translate(640 436)"><rect x="-26" y="-18" width="52" height="34" rx="3" class="mon"/><rect x="-22" y="-14" width="44" height="26" class="scr"/><rect x="-5" y="16" width="10" height="8" class="mon"/><text y="3" text-anchor="middle" class="bms-t">BMS</text></g>
    <g class="facp-s" transform="translate(596 436)"><rect x="-14" y="-18" width="28" height="36" rx="3"/><rect x="-10" y="-13" width="20" height="9" class="scr"/><circle cx="0" cy="8" r="3" id="ceFacpLed"/></g>
  </svg>`;
}

/** Apply the current system outputs to a section SVG created by sectionSvg(). */
export function updateSection(svg, sys) {
  if (!svg) return;
  const o = sys.outputs();
  const set = (sel, cls, on) => svg.querySelectorAll(sel).forEach((e) => e.classList.toggle(cls, !!on));
  const fires = sys.fireFloors || new Set();
  for (const f of FLOORS) {
    const g = svg.querySelector(`[data-fl="${f.id}"]`);
    if (!g) continue;
    g.classList.toggle('fire', fires.has(f.id));
    const v = o.voice[f.id];
    g.querySelector('.spk').setAttribute('class', `spk ${v}`);
    g.querySelector('.spk-t').textContent = v === 'evac' ? L('EVACUATE', 'إخلاء') : v === 'alert' ? L('ALERT', 'تنبيه') : v === 'silenced' ? L('silenced', 'مُسكت') : '';
    const nacOn = f.id === '2' ? o.nac.NAC2 : o.nac.NAC1;
    g.querySelector('.hs').classList.toggle('on', !!nacOn);
    g.classList.toggle('evac', v === 'evac' || (nacOn && !o.voice[f.id]?.startsWith('a')));
    g.querySelector('.door').classList.toggle('released', o.doors === 'released');
    g.querySelector('.damper').classList.toggle('closed', o.dampers === 'closed' || (!o.ahu[f.id]));
    g.classList.toggle('ahufail', !!o.ahuFailed[f.id]);
  }
  const running = FLOORS.some((f) => o.ahu[f.id]);
  set('#ceAhu', 'on', running);
  const ahuT = svg.querySelector('#ceAhuT'); if (ahuT) ahuT.textContent = running ? L('RUNNING', 'يعمل') : L('STOPPED', 'متوقف');
  set('#ceSf', 'on', o.stairFans); set('.press-air', 'on', o.stairFans);
  const car = svg.querySelector('#ceCar');
  if (car) {
    const y = 470 - o.lift.pos * 120;
    car.setAttribute('transform', `translate(0 ${y})`);
    car.setAttribute('class', `car ${o.lift.mode} ${o.lift.doors}`);
  }
  set('#ceFm', 'pre', o.fmPre || o.fm === 'pre'); set('#ceFm', 'dis', o.fm === 'discharging'); set('#ceFm', 'done', o.fm === 'discharged');
  const fmT = svg.querySelector('#ceFmT');
  if (fmT) fmT.textContent = o.fm === 'discharging' ? L('FM-200 DISCHARGING', 'جاري تفريغ FM-200') : o.fm === 'discharged' ? L('FM-200 discharged · hold 10 min', 'تم التفريغ · احتفاظ 10 دقائق') : o.fmDelay != null ? `${L('Release in', 'التفريغ خلال')} ${Math.ceil(o.fmDelay)} s${sys.fm.abort ? ' · ABORT' : ''}` : o.fmPre ? L('Pre-discharge alarm', 'إنذار ما قبل التفريغ') : '';
  set('#ceAnt', 'on', o.remote); set('#ceSig', 'on', o.remote); set('#ceCd', 'on', o.remote);
  const cdT = svg.querySelector('#ceCdT'); if (cdT) cdT.textContent = o.remote ? L('ALARM RECEIVED', 'تم استلام الإنذار') : '';
  set('#ceAcc', 'unlocked', o.access === 'unlocked');
  const accT = svg.querySelector('#ceAccT'); if (accT) accT.textContent = o.access === 'unlocked' ? '🔓' : '🔒';
  set('#ceBms', 'on', o.bms);
  const led = svg.querySelector('#ceFacpLed'); if (led) led.setAttribute('class', sys.count('fire') ? 'fire' : sys.count('trouble') ? 'trb' : 'ok');
}

// ───────────────────────── scenarios
const SCEN = [
  { id: 'off3', icon: '🔥', t: T('Smoke in 1F Office 3', 'دخان في مكتب 3 بالطابق الأول'), run: (s) => s.test(find(s, (d) => d.floor === '1' && d.room === 'off3').id, 'smoke') },
  { id: 'server', icon: '🖥️', t: T('Server room fire: detector A, then B (cross-zone)', 'حريق غرفة الخوادم: كاشف A ثم B (متقاطع)'), run: (s, later) => { s.test(find(s, (d) => d.zone === 'SR-A').id, 'smoke'); later(9, () => s.test(find(s, (d) => d.zone === 'SR-B').id, 'smoke')); } },
  { id: 'lobbyG', icon: '🛗', t: T('Smoke in the GROUND-floor lift lobby', 'دخان في ردهة مصعد الطابق الأرضي'), run: (s) => s.test(find(s, (d) => d.floor === 'G' && d.room === 'lobby').id, 'smoke') },
  { id: 'lobby2', icon: '🛗', t: T('Smoke in the 2F lift lobby', 'دخان في ردهة مصعد الطابق الثاني'), run: (s) => s.test(find(s, (d) => d.floor === '2' && d.room === 'lobby').id, 'smoke') },
  { id: 'mcpG', icon: '🖐', t: T('Call point operated at Stair A (G)', 'تشغيل زر يدوي عند الدرج A (الأرضي)'), run: (s) => s.test(find(s, (d) => d.floor === 'G' && d.type === 'mcp').id, 'mcp') },
  { id: 'flow2', icon: '🚿', t: T('Sprinkler waterflow on 2F', 'تدفق مياه الرشاشات في الطابق الثاني'), run: (s) => s.test(find(s, (d) => d.floor === '2' && d.type === 'flow').id, 'flow') },
  { id: 'tamper1', icon: '🔧', t: T('Sprinkler valve closed on 1F (supervisory)', 'إغلاق صمام الرشاشات في الطابق الأول (إشرافي)'), run: (s) => s.test(find(s, (d) => d.floor === '1' && d.type === 'tamper').id, 'tamper') },
];
const find = (s, fn) => s.devices.find(fn) || s.devices[0];

export function restoreAll(sys) {
  for (const d of sys.devices) { if (d.test) sys.endTest(d.id); if (d.latched) sys.resetMcp(d.id); d.val = d.dirt * 0.15; d.temp = 24; d.flowT = 0; }
  const lvl = sys.accessLevel; sys.accessLevel = 2; sys.fm = { state: 'idle', t: 0, abort: false }; sys.reset(); sys.accessLevel = lvl;
  sys.lift.pos = 0; sys.lift.target = 0; sys.lift.mode = 'normal'; sys.lift.doors = 'closed'; sys.lift.carCalls = [];
}

// ───────────────────────── render
m.render = (el, ctx) => {
  const sys = ctx.sys;
  const ui = { tab: store.get('ceTab', 'matrix'), t0: null, timers: [] };
  let raf = 0;
  const tabs = [
    { id: 'matrix', label: `🧩 ${L('Matrix editor', 'محرر المصفوفة')}` },
    { id: 'run', label: `▶ ${L('Run scenarios', 'تشغيل السيناريوهات')}` },
    { id: 'grade', label: `✔ ${L('Code check & score', 'فحص الكود والنتيجة')}` },
    { id: 'learn', label: `📘 ${L('How it works', 'كيف يعمل')}` },
  ];
  const later = (s, fn) => ui.timers.push(setTimeout(fn, s * 1000));

  function frame() {
    el.innerHTML = header(m) + tabBar(tabs, ui.tab) + '<div id="ceBody"></div>';
    el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { ui.tab = b.dataset.tab; store.set('ceTab', ui.tab); frame(); }; });
    const body = el.querySelector('#ceBody');
    ({ matrix: renderMatrix, run: renderRun, grade: renderGrade, learn: renderLearn })[ui.tab](body);
  }

  function renderMatrix(body) {
    const cell = (c, e) => { const v = sys.matrix[c]?.[e] || 0; return `<td class="ce-c v${v}" data-c="${c}" data-e="${e}">${v === 1 ? '●' : v === 2 ? `<span>⏱${DELAY_S}s</span>` : ''}</td>`; };
    body.innerHTML = `<div class="adv-btns" style="margin-bottom:12px">
        <button class="btn" id="ceTyp">📋 ${L('Load typical matrix', 'تحميل مصفوفة نموذجية')}</button>
        <button class="btn" id="ceClr">🧹 ${L('Start from blank (design challenge)', 'البدء من الصفر (تحدي التصميم)')}</button>
        <button class="btn primary" id="ceGrade">✔ ${L('Check against the codes', 'الفحص وفق الأكواد')}</button>
        <span class="adv-note" style="padding:5px 10px">${L('Click a cell: empty → ● activate → ⏱ activate after 30 s → empty', 'انقر على الخلية: فارغة ← ● تفعيل ← ⏱ تفعيل بعد 30 ث ← فارغة')}</span></div>
      <div class="ce-wrap card"><table class="ce-m">
        <tr><th class="ce-corner"><div>${L('CAUSE (input) ↓ · EFFECT (output) →', 'السبب (المدخل) ↓ · النتيجة (المخرج) ←')}</div></th>${EFFECTS.map((e) => `<th class="ce-h" title="${esc(tr(e.name))}"><div><span>${esc(tr(e.short))}</span></div></th>`).join('')}</tr>
        ${CAUSES.map((c) => `<tr><th class="ce-r">${esc(tr(c.name))}</th>${EFFECTS.map((e) => cell(c.id, e.id)).join('')}</tr>`).join('')}
      </table></div>
      <div class="adv-grid c2" style="margin-top:12px">
        <div class="card"><h3>🧾 ${L('EFFECT LEGEND', 'دليل النتائج')}</h3><div class="ce-leg">${EFFECTS.map((e) => `<div><b>${esc(tr(e.short))}</b><span>${esc(tr(e.name))}</span></div>`).join('')}</div></div>
        <div class="card"><h3>💡 ${L('DESIGN BRIEF — ASFAN BUSINESS CENTER', 'متطلبات التصميم — مركز أصفان للأعمال')}</h3><ul class="ce-brief">
          <li>${L('3 storeys, phased voice evacuation (fire floor + floor above), horn/strobes for sprinkler waterflow.', '3 طوابق، إخلاء صوتي مرحلي (طابق الحريق والذي فوقه)، أبواق ووميض لتدفق الرشاشات.')}</li>
          <li>${L('One lift: primary recall floor G, alternate floor 1. Lobby detectors on every floor.', 'مصعد واحد: طابق الاستدعاء الرئيسي G والبديل 1. كواشف في ردهة المصعد بكل طابق.')}</li>
          <li>${L('Stair A pressurization, smoke dampers on each floor supply duct, 3 AHUs on the roof.', 'ضغط الدرج A، خوانق دخان في مجرى كل طابق، 3 وحدات مناولة هواء على السطح.')}</li>
          <li>${L('Fire doors on magnetic holders, maglocked entrance with access control.', 'أبواب حريق على ماسكات مغناطيسية، ومدخل بأقفال مغناطيسية وتحكم بالدخول.')}</li>
          <li>${L('Server room on 1F with FM-200, cross-zoned detectors SR-A and SR-B, 30 s pre-discharge delay.', 'غرفة خوادم في الطابق الأول مع FM-200، كواشف متقاطعة SR-A وSR-B، وتأخير 30 ث قبل التفريغ.')}</li>
          <li>${L('Monitoring by Civil Defense (fire, supervisory, trouble) and BMS alerts.', 'مراقبة من الدفاع المدني (حريق، إشرافي، أعطال) وتنبيهات لنظام إدارة المبنى.')}</li></ul></div>
      </div>`;
    body.querySelectorAll('.ce-c').forEach((td) => {
      td.onclick = () => {
        const { c, e } = td.dataset;
        const v = ((sys.matrix[c]?.[e] || 0) + 1) % 3;
        (sys.matrix[c] ||= {})[e] = v;
        sys.emit('change');
        td.className = `ce-c v${v}`; td.innerHTML = v === 1 ? '●' : v === 2 ? `<span>⏱${DELAY_S}s</span>` : '';
      };
    });
    body.querySelector('#ceTyp').onclick = () => { sys.matrix = typicalMatrix(); sys.emit('change'); renderMatrix(body); };
    body.querySelector('#ceClr').onclick = () => { sys.matrix = emptyMatrix(); sys.emit('change'); renderMatrix(body); };
    body.querySelector('#ceGrade').onclick = () => { ui.tab = 'grade'; store.set('ceTab', 'grade'); frame(); };
  }

  function renderGrade(body) {
    const g = gradeMatrix(sys.matrix);
    markDone('cause', g.score);
    ctx.helpers.recordResult?.({ type: 'lab', topic: 'cause/matrix', score: g.score, total: 100 });
    body.innerHTML = scoreBanner(g.score, `<b>${g.errors}</b> ${L('code violations', 'مخالفات للكود')} · <b>${g.warns}</b> ${L('warnings', 'تحذيرات')} · ${L('your matrix is checked against NFPA 72, 90A, 92, 101 and 2001.', 'تم فحص مصفوفتك وفق NFPA 72 و90A و92 و101 و2001.')}`)
      + `<div class="adv-findings">${g.findings.map((f) => `<div class="adv-finding ${f.level}"><span class="ic">${f.level === 'error' ? '❌' : f.level === 'warn' ? '⚠️' : '✅'}</span><span>${esc(tr(f.text))}</span><span class="ref">${esc(f.ref)}</span></div>`).join('')}</div>
      <div class="adv-btns" style="margin-top:12px"><button class="btn primary" id="gEdit">🧩 ${L('Edit matrix', 'تعديل المصفوفة')}</button><button class="btn" id="gRun">▶ ${L('Test it on the building', 'اختبرها على المبنى')}</button></div>`;
    body.querySelector('#gEdit').onclick = () => { ui.tab = 'matrix'; store.set('ceTab', 'matrix'); frame(); };
    body.querySelector('#gRun').onclick = () => { ui.tab = 'run'; store.set('ceTab', 'run'); frame(); };
  }

  function renderRun(body) {
    body.innerHTML = `<div class="ce-run">
      <div class="card ce-scen"><h3>🎬 ${L('FIRE SCENARIOS', 'سيناريوهات الحريق')}</h3>
        ${SCEN.map((s) => `<button class="ce-sbtn" data-sc="${s.id}"><span>${s.icon}</span><span>${esc(tr(s.t))}</span></button>`).join('')}
        <div class="adv-btns" style="margin-top:10px">
          <button class="btn sm" id="ceSil">🔕 ${L('Silence', 'إسكات')}</button>
          <button class="btn sm" id="ceAbort">✋ ${L('Hold FM-200 abort', 'الضغط على إيقاف FM-200')}</button>
          <button class="btn sm danger" id="ceRst">⟲ ${L('Restore & reset', 'استعادة وإعادة ضبط')}</button></div>
        <h3 style="margin-top:14px">📋 ${L('OUTPUT STATUS', 'حالة المخرجات')}</h3><div id="ceOut" class="ce-out"></div>
      </div>
      <div class="grow">
        <div class="card" style="padding:8px">${sectionSvg(false)}</div>
        <div class="card" style="margin-top:12px"><h3>⏱ ${L('SEQUENCE OF OPERATIONS', 'تسلسل العمليات')}<span class="r adv-pill info" id="ceClock">00:00</span></h3><div class="adv-log" id="ceLog"></div></div>
      </div></div>`;
    body.querySelectorAll('[data-sc]').forEach((b) => {
      b.onclick = () => {
        ui.timers.forEach(clearTimeout); ui.timers = [];
        restoreAll(sys);
        ui.t0 = sys.time;
        SCEN.find((s) => s.id === b.dataset.sc).run(sys, later);
        body.querySelectorAll('[data-sc]').forEach((x) => x.classList.toggle('active', x === b));
      };
    });
    body.querySelector('#ceSil').onclick = () => { const l = sys.accessLevel; sys.accessLevel = 2; sys.silence(); sys.accessLevel = l; };
    const ab = body.querySelector('#ceAbort');
    ab.onclick = () => { sys.fm.abort = !sys.fm.abort; ab.classList.toggle('warn', sys.fm.abort); };
    body.querySelector('#ceRst').onclick = () => { ui.timers.forEach(clearTimeout); ui.timers = []; restoreAll(sys); ui.t0 = null; body.querySelectorAll('[data-sc]').forEach((x) => x.classList.remove('active')); };
  }

  function updateRun() {
    const body = el.querySelector('#ceBody');
    const svg = body?.querySelector('.ce-sec');
    if (!svg) return;
    updateSection(svg, sys);
    const o = sys.outputs();
    const rows = [
      [L('Horn/strobes', 'الأبواق والوميض'), o.sounders ? ['on', L('SOUNDING', 'تعمل')] : ['off', L('off', 'متوقفة')]],
      [L('Voice evacuation', 'الإخلاء الصوتي'), Object.values(o.voice).some((v) => v !== 'off') ? ['on', FLOORS.map((f) => `${f.id}:${o.voice[f.id]}`).join(' ')] : ['off', L('off', 'متوقف')]],
      [L('AHUs', 'المكيفات'), FLOORS.every((f) => o.ahu[f.id]) ? ['off', L('running', 'تعمل')] : ['on', FLOORS.map((f) => `${f.id}:${o.ahuFailed[f.id] ? 'FAIL' : o.ahu[f.id] ? 'run' : 'stop'}`).join(' ')]],
      [L('Smoke dampers', 'خوانق الدخان'), o.dampers === 'closed' ? ['on', L('closed', 'مغلقة')] : ['off', L('open', 'مفتوحة')]],
      [L('Stair pressurization', 'ضغط الدرج'), o.stairFans ? ['on', L('running', 'تعمل')] : ['off', L('off', 'متوقفة')]],
      [L('Lift', 'المصعد'), o.lift.mode === 'normal' ? ['off', L('normal service', 'خدمة عادية')] : ['on', `${o.lift.mode} → ${FLOORS[o.lift.target].id}`]],
      [L('Door holders', 'ماسكات الأبواب'), o.doors === 'released' ? ['on', L('released', 'محررة')] : ['off', L('holding', 'ممسكة')]],
      [L('Access control', 'التحكم بالدخول'), o.access === 'unlocked' ? ['on', L('unlocked', 'مفتوحة')] : ['off', L('locked', 'مقفلة')]],
      ['FM-200', o.fm !== 'idle' || o.fmDelay != null ? ['on', o.fmDelay != null ? `${o.fm} · ${Math.ceil(o.fmDelay)} s` : o.fm] : ['off', L('armed', 'جاهزة')]],
      [L('Civil Defense', 'الدفاع المدني'), o.remote ? ['on', L('signalled', 'تم الإبلاغ')] : ['off', '—']],
    ];
    const out = body.querySelector('#ceOut');
    if (out) out.innerHTML = rows.map(([k, [c, v]]) => `<div class="ce-o ${c}"><span>${k}</span><b>${esc(v)}</b></div>`).join('');
    const log = body.querySelector('#ceLog');
    if (log && ui.t0 != null) {
      const h = sys.history.filter((x) => x.t >= ui.t0 && (x.kind !== 'info' || /C&E|Lift|FM-200|silenced|reset/.test(x.text.en)));
      if (log.dataset.n !== String(h.length)) { log.dataset.n = h.length; log.innerHTML = h.map((x) => `<div class="${x.restore ? 'ok' : x.kind}"><span class="t">+${mmss(x.t - ui.t0)}</span>${esc(tr(x.text))}</div>`).join(''); log.scrollTop = log.scrollHeight; }
      body.querySelector('#ceClock').textContent = mmss(sys.time - ui.t0);
    } else if (log && !log.dataset.n) log.innerHTML = `<div class="info">${L('Choose a scenario on the left. The event and every cause-and-effect action appear here with their timing.', 'اختر سيناريو من اليسار. سيظهر هنا الحدث وكل إجراء للسبب والنتيجة مع توقيته.')}</div>`;
  }

  function renderLearn(body) {
    body.innerHTML = `<div class="adv-grid c2">
      <div class="card"><h3>🧠 ${L('WHAT MAKES THE SYSTEM "SMART"', 'ما الذي يجعل النظام "ذكياً"')}</h3><ol class="ce-learn">
        <li>${L('Every device has an address, so the panel knows exactly WHICH detector is in alarm (not just a zone).', 'لكل جهاز عنوان، فتعرف اللوحة بالضبط أي كاشف في حالة إنذار (وليس المنطقة فقط).')}</li>
        <li>${L('Detectors send analog values; the panel applies thresholds, pre-alarm, drift compensation and day/night sensitivity.', 'ترسل الكواشف قيماً تناظرية؛ وتطبق اللوحة الحدود والإنذار المبكر وتعويض الانجراف وحساسية النهار/الليل.')}</li>
        <li>${L('Software logic (cause & effect) decides what happens: by device, zone, floor, AND/OR, cross-zoning, counting and time delays.', 'المنطق البرمجي (السبب والنتيجة) يقرر ما يحدث: حسب الجهاز والمنطقة والطابق، و/أو، الكشف المتقاطع، العد، والتأخير الزمني.')}</li>
        <li>${L('Outputs are control modules and NACs on the loop plus network interfaces (BACnet/Modbus to the BMS, DACT/IP to the monitoring centre).', 'المخرجات هي وحدات تحكم ودوائر إنذار على الحلقة، إضافة إلى واجهات الشبكة (BACnet/Modbus لنظام إدارة المبنى، وDACT/IP لمركز المراقبة).')}</li></ol></div>
      <div class="card"><h3>⚖️ ${L('KEY CODE RULES', 'أهم قواعد الكود')}</h3><ul class="ce-learn">
        <li>${L('Lift recall only from lobby, hoistway and machine-room detectors; recall to the alternate floor if the primary-floor lobby is in alarm (NFPA 72 §21.3).', 'استدعاء المصعد فقط من كواشف الردهة والبئر وغرفة المحركات؛ والاستدعاء للطابق البديل إذا كان الإنذار في ردهة الطابق الرئيسي.')}</li>
        <li>${L('Clean-agent release needs two detectors (cross-zone), a pre-discharge alarm and time delay, abort switch, and HVAC shutdown (NFPA 2001, NFPA 72 §23.8.5.4.3).', 'تفريغ المادة النظيفة يحتاج كاشفين (متقاطع) وإنذار ما قبل التفريغ وتأخيراً زمنياً وزر إيقاف وإيقاف التكييف.')}</li>
        <li>${L('Supervisory and trouble signals are reported but never evacuate the building (NFPA 72 §10.14–10.15).', 'تُبلَّغ الإشارات الإشرافية وإشارات الأعطال لكنها لا تُخلي المبنى أبداً.')}</li>
        <li>${L('Emergency control function interface devices within 0.9 m of the controlled component; failure of the interface must not prevent the fire alarm (NFPA 72 §21.2).', 'أجهزة واجهة وظائف التحكم الطارئ ضمن 0.9 م من المكوّن المتحكم به؛ وتعطل الواجهة لا يجب أن يمنع إنذار الحريق.')}</li></ul></div></div>`;
  }

  frame();
  let last = 0;
  const loop = (t) => { raf = requestAnimationFrame(loop); if (t - last < 200) return; last = t; if (ui.tab === 'run') updateRun(); };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); ui.timers.forEach(clearTimeout); };
};

export default m;
