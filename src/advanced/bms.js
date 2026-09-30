// Module 3 — BMS & building integration: SCADA-style BMS graphics fed by the FACP gateway,
// BACnet objects / Modbus registers with live traffic, lift firefighter operation (Phase I / II),
// voice evacuation console and the monitoring-centre (ARC / Civil Defense) Contact-ID receiver.
import { FLOORS } from './building.js';
import { CID } from './system.js';
import { sectionSvg, updateSection, restoreAll } from './cause.js';
import { header, L, esc, tr, store, markDone, tabBar, scoreBanner, mmss, pad3 } from './ui.js';

const T = (en, ar) => ({ en, ar });
const m = {
  id: 'bms', icon: '🏢',
  title: T('BMS & Building Integration', 'التكامل مع نظام إدارة المبنى'),
  short: T('BACnet/Modbus, lift, voice evac, ARC', 'BACnet/Modbus، المصعد، الإخلاء، المراقبة'),
  sub: T('A smart fire system talks to the rest of the building: the BMS reads every panel point over BACnet/IP or Modbus, lifts go into firefighter service, the voice evacuation system broadcasts phased messages and the monitoring centre receives Contact-ID reports. Operate each interface as the engineer, operator and firefighter.',
    'نظام الحريق الذكي يتواصل مع باقي المبنى: يقرأ نظام إدارة المبنى كل نقاط اللوحة عبر BACnet/IP أو Modbus، وتدخل المصاعد في خدمة رجال الإطفاء، ويبث نظام الإخلاء الصوتي رسائل مرحلية، ويستقبل مركز المراقبة تقارير Contact-ID. شغّل كل واجهة كمهندس ومشغّل ورجل إطفاء.'),
  refs: ['NFPA 72 §21.3 Elevators', '§24 Voice EVAC', '§26 Supervising stations', 'ASME A17.1 §2.27', 'ASHRAE 135 (BACnet)'],
};

const CID_NAMES = {
  [CID.fire]: T('Fire alarm', 'إنذار حريق'), [CID.mcp]: T('Fire – manual call point', 'حريق – زر يدوي'), [CID.flow]: T('Fire – waterflow', 'حريق – تدفق مياه'),
  [CID.super]: T('Fire supervisory', 'إشرافي حريق'), [CID.tamperSprinkler]: T('Sprinkler supervisory (valve)', 'إشرافي رشاشات (صمام)'), [CID.trouble]: T('System trouble', 'عطل في النظام'),
  [CID.ac]: T('AC power loss', 'فقدان التيار الرئيسي'), [CID.lowBatt]: T('Low system battery', 'بطارية النظام منخفضة'), [CID.loop]: T('Fire loop trouble', 'عطل حلقة الحريق'),
  [CID.sensor]: T('Sensor trouble (dirty / drift)', 'عطل حساس (اتساخ / انجراف)'), [CID.ground]: T('Ground fault', 'تسرّب أرضي'), [CID.nac]: T('Bell / NAC trouble', 'عطل دائرة الإنذار'),
  [CID.disable]: T('Zone / point bypass (disable)', 'تجاوز نقطة (تعطيل)'), [CID.drill]: T('Manual test / drill', 'اختبار يدوي / تمرين'),
};

const QUIZ = [
  { raw: '4721 18 1110 01 036', a: 0, opts: [T('New fire alarm, zone/point 036', 'إنذار حريق جديد، النقطة 036'), T('Fire alarm restored, point 036', 'عودة إنذار الحريق، النقطة 036'), T('Trouble on point 036', 'عطل في النقطة 036')] },
  { raw: '4721 18 3301 01 000', a: 1, opts: [T('AC power lost', 'فقدان التيار الرئيسي'), T('AC power restored', 'عودة التيار الرئيسي'), T('Low battery', 'بطارية منخفضة')] },
  { raw: '4721 18 1203 01 020', a: 2, opts: [T('Fire alarm point 020', 'إنذار حريق النقطة 020'), T('Waterflow point 020', 'تدفق مياه النقطة 020'), T('Sprinkler valve supervisory, point 020', 'إشرافي صمام الرشاشات، النقطة 020')] },
  { raw: '4721 18 1113 01 041', a: 1, opts: [T('Manual call point 041', 'زر يدوي 041'), T('Waterflow alarm point 041', 'إنذار تدفق مياه النقطة 041'), T('Duct detector 041', 'كاشف مجرى 041')] },
  { raw: '4721 18 1380 01 050', a: 0, opts: [T('Sensor trouble (dirty detector) 050', 'عطل حساس (كاشف متّسخ) 050'), T('Fire alarm 050', 'إنذار حريق 050'), T('Point 050 disabled', 'تعطيل النقطة 050')] },
];

m.render = (el, ctx) => {
  const sys = ctx.sys;
  const ui = { tab: store.get('bmsTab', 'hmi'), ackBms: new Set(), pa: { zones: new Set(), msg: null, mic: false }, arcAck: new Set(), dispatched: new Set(), tasks: store.get('bmsTasks', {}), doorHold: null, modbusT: 0 };
  let raf = 0;
  const tabs = [
    { id: 'hmi', label: `🖥️ ${L('BMS graphics', 'رسومات BMS')}` },
    { id: 'points', label: `🔌 ${L('BACnet / Modbus', 'BACnet / Modbus')}` },
    { id: 'lift', label: `🛗 ${L('Firefighter lift', 'مصعد رجال الإطفاء')}` },
    { id: 'pa', label: `📢 ${L('Voice evacuation', 'الإخلاء الصوتي')}` },
    { id: 'arc', label: `🚒 ${L('Monitoring centre', 'مركز المراقبة')}` },
  ];
  const task = (id) => { if (!ui.tasks[id]) { ui.tasks[id] = true; store.set('bmsTasks', ui.tasks); const n = Object.keys(ui.tasks).length; markDone('bms', Math.round((100 * n) / 5)); ctx.helpers.recordResult?.({ type: 'lab', topic: `bms/${id}`, score: 1, total: 1 }); } };

  function frame() {
    el.innerHTML = header(m) + tabBar(tabs, ui.tab) + '<div id="bmsBody"></div>';
    el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { ui.tab = b.dataset.tab; store.set('bmsTab', ui.tab); frame(); }; });
    const body = el.querySelector('#bmsBody');
    ({ hmi: renderHmi, points: renderPoints, lift: renderLift, pa: renderPa, arc: renderArc })[ui.tab](body);
  }

  const taskList = () => {
    const list = [
      ['alarm', L('Receive a fire alarm on the BMS and acknowledge it', 'استقبل إنذار حريق على BMS وأقِر به')],
      ['decode', L('Decode the Contact-ID messages (Monitoring centre tab)', 'فكّ رسائل Contact-ID (تبويب مركز المراقبة)')],
      ['phase2', L('Firefighter service: take the car to 2F with Phase II and open the doors', 'خدمة رجال الإطفاء: خذ المصعد إلى 2F بالمرحلة الثانية وافتح الأبواب')],
      ['allcall', L('Make a live all-call announcement on the voice evacuation console', 'أذِع إعلاناً حياً لكل المناطق من لوحة الإخلاء الصوتي')],
      ['modbus', L('Read the Modbus register map and find the fire bit', 'اقرأ خريطة سجلات Modbus وجد بت الحريق')],
    ];
    const n = list.filter(([id]) => ui.tasks[id]).length;
    return scoreBanner(Math.round((100 * n) / list.length), `<b>${L('Integration tasks', 'مهام التكامل')}</b><div class="bms-tasks">${list.map(([id, t]) => `<span class="${ui.tasks[id] ? 'ok' : ''}">${ui.tasks[id] ? '✓' : '○'} ${t}</span>`).join('')}</div>`);
  };

  // ── HMI
  function renderHmi(body) {
    body.innerHTML = `${taskList()}<div class="hmi bms-hmi">
      <div class="hmi-bar"><span class="dot" style="background:#22c55e"></span> ASFAN-BMS · Site: ASFAN Business Center · BACnet/IP 192.168.10.20:47808 · Device 4721 (FACP gateway)<span style="margin-inline-start:auto" id="hmiClock"></span></div>
      <div class="bms-grid">
        <div class="bms-sec">${sectionSvg(true)}</div>
        <div class="bms-side">
          <h3>🔔 ${L('ALARM SUMMARY', 'ملخص الإنذارات')}</h3><div id="hmiAl" class="bms-al"></div>
          <h3 style="margin-top:12px">⚙ ${L('EQUIPMENT', 'المعدات')}</h3><div id="hmiEq" class="bms-eq"></div>
          <p class="bms-note">${L('The BMS only MONITORS the fire system here. Life-safety commands (AHU shutdown, dampers, lift recall) come from the listed FACP relays — the BMS must never be the only path (NFPA 72 §21.2.4, UL 864).', 'نظام إدارة المبنى هنا يراقب نظام الحريق فقط. أوامر السلامة (إيقاف المكيفات، الخوانق، استدعاء المصعد) تأتي من ريليهات لوحة الحريق المعتمدة — ولا يجوز أن يكون BMS المسار الوحيد.')}</p>
        </div></div></div>
      <div class="adv-btns" style="margin-top:10px"><span class="muted">${L('Trigger a fire from the Cause & Effect or Panel lab, or:', 'أطلق حريقاً من مختبر السبب والنتيجة أو اللوحة، أو:')}</span>
        <button class="btn sm primary" id="hmiFire">🔥 ${L('Smoke test 2F corridor', 'اختبار دخان في ممر 2F')}</button><button class="btn sm" id="hmiRst">⟲ ${L('Restore & reset', 'استعادة وإعادة ضبط')}</button></div>`;
    body.querySelector('#hmiFire').onclick = () => { const d = sys.devices.find((x) => x.floor === '2' && x.room === 'cor'); sys.test(d.id, 'smoke'); };
    body.querySelector('#hmiRst').onclick = () => { restoreAll(sys); ui.ackBms.clear(); };
    body.querySelector('#hmiAl').addEventListener('click', (e) => { const b = e.target.closest('[data-ack]'); if (b) { ui.ackBms.add(b.dataset.ack); if (b.dataset.kind === 'fire') task('alarm'); updateHmi(body); } });
    updateHmi(body);
  }
  function updateHmi(body) {
    updateSection(body.querySelector('.ce-sec'), sys);
    const clk = body.querySelector('#hmiClock'); if (clk) clk.textContent = new Date().toLocaleTimeString('en-GB');
    const al = body.querySelector('#hmiAl');
    if (al) {
      const ev = sys.sortedEvents().filter((e) => e.kind !== 'pre');
      const html = ev.length ? ev.slice(0, 8).map((e) => { const k = e.key; const acked = ui.ackBms.has(k); return `<div class="bms-a ${e.kind} ${acked ? 'acked' : ''}"><span class="t">${mmss(e.t)}</span><span class="x">${esc(tr(e.text))}</span>${acked ? '<span class="ak">ACK</span>' : `<button data-ack="${esc(k)}" data-kind="${e.kind}">ACK</button>`}</div>`; }).join('') : `<div class="bms-a ok">${L('No active alarms', 'لا توجد إنذارات نشطة')}</div>`;
      if (al.dataset.h !== html) { al.dataset.h = html; al.innerHTML = html; }
    }
    const eq = body.querySelector('#hmiEq');
    if (eq) {
      const o = sys.outputs();
      const tile = (n, v, st) => `<div class="bms-t ${st}"><span>${n}</span><b>${v}</b></div>`;
      eq.innerHTML = FLOORS.map((f) => tile(`AHU-${f.id}`, o.ahuFailed[f.id] ? 'FAIL' : o.ahu[f.id] ? 'RUN' : 'STOP', o.ahuFailed[f.id] ? 'bad' : o.ahu[f.id] ? 'ok' : 'alm')).join('')
        + tile(L('Stair fan', 'مروحة الدرج'), o.stairFans ? 'RUN' : 'OFF', o.stairFans ? 'alm' : '') + tile(L('Dampers', 'الخوانق'), o.dampers.toUpperCase(), o.dampers === 'closed' ? 'alm' : 'ok')
        + tile(L('Lift', 'المصعد'), o.lift.mode.toUpperCase(), o.lift.mode === 'normal' ? 'ok' : 'alm') + tile(L('Doors', 'الأبواب'), o.doors.toUpperCase(), o.doors === 'held' ? 'ok' : 'alm')
        + tile(L('Access', 'الدخول'), o.access.toUpperCase(), o.access === 'locked' ? 'ok' : 'alm') + tile('FM-200', o.fm.toUpperCase(), o.fm === 'idle' ? 'ok' : 'alm')
        + tile(L('FACP battery', 'بطارية اللوحة'), `${sys.battV.toFixed(1)} V`, sys.battV < 22.5 ? 'bad' : 'ok') + tile(L('Mains', 'التيار'), sys.ac ? 'ON' : 'OFF', sys.ac ? 'ok' : 'bad');
    }
  }

  // ── points
  function renderPoints(body) {
    body.innerHTML = `<div class="adv-grid c2">
      <div class="hmi"><h3>🔌 BACnet/IP ${L('OBJECTS (FACP GATEWAY, DEVICE 4721)', 'الكائنات (بوابة اللوحة، الجهاز 4721)')}</h3><div class="bms-scroll"><table id="bacTbl"></table></div></div>
      <div class="hmi"><h3>🧮 MODBUS TCP ${L('HOLDING REGISTERS (UNIT 1)', 'سجلات الاحتفاظ (الوحدة 1)')}</h3><table id="mbTbl"></table>
        <div class="bms-bits" id="mbBits"></div>
        <div class="adv-btns" style="margin-top:10px"><span style="font-size:.85em;color:#9fb7cc">${L('Which bit of register 40001 is FIRE?', 'أي بت في السجل 40001 يمثل الحريق؟')}</span>${[0, 1, 2, 3].map((b) => `<button class="btn sm" data-bit="${b}">bit ${b}</button>`).join('')}<span id="mbAns"></span></div></div>
    </div>
    <div class="adv-grid c2" style="margin-top:12px">
      <div class="hmi"><h3>📡 ${L('NETWORK TRAFFIC', 'حركة الشبكة')}</h3><div class="adv-log" id="bacLog" style="max-height:220px"></div></div>
      <div class="card"><h3>📘 ${L('INTEGRATION NOTES', 'ملاحظات التكامل')}</h3><ul class="bms-notes">
        <li>${L('BACnet object types: BI = binary input (fire, trouble), AI = analog input (battery V), BO/AO = commands. The BMS subscribes with SubscribeCOV and receives UnconfirmedCOVNotification when a value changes.', 'أنواع كائنات BACnet: BI مدخل ثنائي (حريق، عطل)، AI مدخل تناظري (جهد البطارية)، BO/AO أوامر. يشترك BMS عبر SubscribeCOV ويستقبل إشعار تغيّر القيمة عند أي تغيير.')}</li>
        <li>${L('Modbus is polled: the BMS reads holding registers (function code 03) every few seconds; status is packed as bits.', 'Modbus يعمل بالاستعلام: يقرأ BMS سجلات الاحتفاظ (رمز الوظيفة 03) كل بضع ثوانٍ؛ والحالات مجمّعة كبتات.')}</li>
        <li>${L('Gateway points list is part of the approved submittal: object name, instance, type, meaning, update method. Test every point end-to-end during commissioning.', 'قائمة نقاط البوابة جزء من الوثائق المعتمدة: اسم الكائن والرقم والنوع والمعنى وطريقة التحديث. اختبر كل نقطة من البداية للنهاية أثناء الاستلام.')}</li>
        <li>${L('Security: put the gateway on a separate VLAN, read-only towards the fire panel (NFPA 72 §10.4 / cybersecurity annex).', 'الأمان: ضع البوابة على شبكة VLAN منفصلة وبصلاحية قراءة فقط نحو لوحة الحريق.')}</li></ul></div></div>`;
    body.querySelectorAll('[data-bit]').forEach((b) => { b.onclick = () => { const ok = b.dataset.bit === '0'; body.querySelector('#mbAns').innerHTML = ok ? `<span class="adv-pill ok">✓ bit 0 = FIRE</span>` : `<span class="adv-pill bad">✗</span>`; if (ok) task('modbus'); }; });
    updatePoints(body);
  }
  function updatePoints(body) {
    const { pts, reg } = sys.points();
    const tb = body.querySelector('#bacTbl');
    if (tb) tb.innerHTML = `<tr><th>Object</th><th>Object_Name</th><th>Present_Value</th></tr>${pts.map((p) => `<tr class="${p.raw && p.type === 'binary-input' && /Fire|Trouble|Recall|Discharged|Closed|Pressurization/.test(p.name) ? 'act' : ''}"><td>${p.obj}</td><td>${esc(p.name)}</td><td>${esc(p.value)}</td></tr>`).join('')}`;
    const names = ['Status bits (fire, pre, sup, trb, silenced, AC, earth, drill)', 'Fire by floor (bit0 G, bit1 1F, bit2 2F)', 'Battery voltage ×10', 'Active fire events', 'Active trouble events', 'Outputs (fans, dampers, doors, access, lift, FM-200)'];
    const mb = body.querySelector('#mbTbl');
    if (mb) mb.innerHTML = `<tr><th>Register</th><th>Dec</th><th>Hex</th><th>Binary</th><th>Meaning</th></tr>${reg.map((v, i) => `<tr><td>4000${i + 1}</td><td>${v}</td><td>0x${v.toString(16).toUpperCase().padStart(4, '0')}</td><td>${v.toString(2).padStart(8, '0')}</td><td>${names[i]}</td></tr>`).join('')}`;
    const bits = body.querySelector('#mbBits');
    if (bits) bits.innerHTML = ['FIRE', 'PRE', 'SUP', 'TRB', 'SIL', 'AC', 'EARTH', 'DRILL'].map((n, i) => `<span class="${(reg[0] >> i) & 1 ? 'on' : ''}"><i>bit ${i}</i>${n}</span>`).join('');
    const log = body.querySelector('#bacLog');
    if (log) {
      if (sys.time - ui.modbusT > 5) { ui.modbusT = sys.time; sys.bacnet.push({ t: sys.time, kind: 'MB', text: `Modbus TCP FC03 Read 40001..40006 → [${reg.join(', ')}]` }); }
      const n = sys.bacnet.length;
      if (log.dataset.n !== String(n)) { log.dataset.n = n; log.innerHTML = sys.bacnet.slice(-60).reverse().map((x) => `<div class="${x.kind === 'COV' ? 'pre' : 'info'}"><span class="t">${mmss(x.t)}</span>${esc(x.text)}</div>`).join(''); }
    }
  }

  // ── lift
  function renderLift(body) {
    body.innerHTML = `<div class="bms-lift">
      <div class="card"><h3>🛗 ${L('HOISTWAY', 'بئر المصعد')}</h3><svg viewBox="0 0 220 420" class="adv-svg bms-shaft" id="liftSvg">
        <rect x="60" y="20" width="100" height="380" class="sh"/>${FLOORS.map((f, i) => `<line x1="40" y1="${400 - i * 125}" x2="180" y2="${400 - i * 125}" class="fl"/><text x="30" y="${385 - i * 125}" class="ft">${f.id}</text>`).join('')}
        <g id="lCar"><rect x="68" y="-110" width="84" height="106" rx="4" class="car"/><rect x="78" y="-98" width="64" height="88" class="door"/><text x="110" y="-44" text-anchor="middle" class="hat">⛑</text></g>
        <line x1="110" y1="20" x2="110" y2="400" class="rope"/></svg></div>
      <div class="card"><h3>🔑 ${L('LOBBY – PHASE I (RECALL)', 'الردهة – المرحلة الأولى (الاستدعاء)')}</h3>
        <div class="bms-key"><span>${L('FIRE RECALL key switch', 'مفتاح استدعاء الحريق')}</span><div class="seg">${['off', 'on'].map((k) => `<button data-p1="${k}">${k.toUpperCase()}</button>`).join('')}</div></div>
        <p class="adv-note">${L('Phase I brings the car non-stop to the recall floor, opens the doors and takes it out of normal service — automatically from lobby / hoistway / machine-room detectors or manually with this key.', 'تُحضر المرحلة الأولى المصعد دون توقف إلى طابق الاستدعاء وتفتح الأبواب وتخرجه من الخدمة العادية — تلقائياً من كواشف الردهة/البئر/غرفة المحركات أو يدوياً بهذا المفتاح.')}</p>
        <h3 style="margin-top:14px">🧑‍🚒 ${L('IN-CAR – PHASE II (FIREFIGHTER)', 'داخل المصعد – المرحلة الثانية (رجال الإطفاء)')}</h3>
        <div class="bms-key"><span>${L('FIRE OPERATION key', 'مفتاح تشغيل الحريق')}</span><div class="seg">${['off', 'hold', 'on'].map((k) => `<button data-p2="${k}">${k.toUpperCase()}</button>`).join('')}</div></div>
        <div class="bms-cop"><div class="disp" id="lDisp"></div>
          <div class="btns">${[...FLOORS].reverse().map((f) => `<button data-call="${FLOORS.indexOf(f)}">${f.id}</button>`).join('')}</div>
          <div class="btns2"><button id="lOpen">◀▶ ${L('DOOR OPEN', 'فتح الباب')}</button><button id="lClose">▶◀ ${L('DOOR CLOSE', 'إغلاق')}</button><button id="lCancel">${L('CALL CANCEL', 'إلغاء الطلبات')}</button></div></div>
        <p class="adv-note">${L('Phase II: the car only answers car calls; doors open ONLY with constant pressure on DOOR OPEN (release early and they close again). HOLD keeps the car at a floor with doors open.', 'المرحلة الثانية: يستجيب المصعد لطلبات داخل المقصورة فقط؛ تُفتح الأبواب فقط بالضغط المستمر على زر الفتح (إذا تركته مبكراً تُغلق مجدداً). وضع HOLD يُبقي المصعد في الطابق والأبواب مفتوحة.')}</p>
      </div>
      <div class="card"><h3>📋 ${L('STATUS', 'الحالة')}</h3><div id="lStat" class="ce-out"></div>
        <div class="adv-callout" style="margin-top:12px">${L('Firefighter\'s hat symbol: steady = Phase I recall active; flashing = a hoistway or machine-room detector operated (fire may be in the shaft — don\'t use the lift) — ASME A17.1 §2.27.3.1.6.', 'رمز خوذة الإطفاء: ثابت = الاستدعاء نشط؛ وامض = عمل كاشف البئر أو غرفة المحركات (قد يكون الحريق في البئر — لا تستخدم المصعد).')}</div></div></div>`;
    body.querySelectorAll('[data-p1]').forEach((b) => { b.onclick = () => { sys.lift.key = b.dataset.p1 === 'on' ? 'on' : 'off'; }; });
    body.querySelectorAll('[data-p2]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.p2, Lf = sys.lift;
        if (k === 'on') { if (Lf.mode === 'recalled' || Lf.mode === 'phase2') { Lf.mode = 'phase2'; Lf.p2 = 'on'; sys.log('info', T('Lift Phase II firefighter operation ON', 'المصعد – تشغيل رجال الإطفاء المرحلة الثانية')); } else alert(L('Phase II can only be switched on after Phase I recall has brought the car to the recall floor.', 'لا يمكن تشغيل المرحلة الثانية إلا بعد أن يُحضر الاستدعاء المصعد إلى طابق الاستدعاء.')); }
        if (k === 'hold' && Lf.mode === 'phase2') Lf.p2 = 'hold';
        if (k === 'off' && Lf.mode === 'phase2') { if (Math.abs(Lf.pos - Math.round(Lf.pos)) < 0.01 && Math.round(Lf.pos) === 0) { Lf.mode = 'recalled'; Lf.p2 = 'off'; Lf.doors = 'open'; } else { Lf.carCalls = [0]; Lf.p2 = 'off-return'; } }
      };
    });
    body.querySelectorAll('[data-call]').forEach((b) => { b.onclick = () => { const Lf = sys.lift; if (Lf.mode === 'phase2' && Lf.p2 === 'on' && Lf.doors === 'closed') { const f = +b.dataset.call; if (!Lf.carCalls.includes(f)) Lf.carCalls.push(f); } }; });
    const open = body.querySelector('#lOpen');
    const startOpen = () => { const Lf = sys.lift; if (Lf.mode !== 'phase2' || Lf.pos !== Math.round(Lf.pos) || Lf.carCalls.length) return; ui.doorHold = performance.now(); Lf.doors = 'opening'; };
    const stopOpen = () => { const Lf = sys.lift; if (Lf.doors === 'opening') Lf.doors = 'closed'; ui.doorHold = null; };
    open.addEventListener('pointerdown', startOpen); open.addEventListener('pointerup', stopOpen); open.addEventListener('pointerleave', stopOpen);
    body.querySelector('#lClose').onclick = () => { const Lf = sys.lift; if (Lf.mode === 'phase2' && Lf.p2 !== 'hold') Lf.doors = 'closed'; if (Lf.mode === 'recalled') Lf.doors = 'open'; };
    body.querySelector('#lCancel').onclick = () => { sys.lift.carCalls = []; };
  }
  function updateLift(body) {
    const Lf = sys.lift;
    if (ui.doorHold && Lf.doors === 'opening' && performance.now() - ui.doorHold > 1500) { Lf.doors = 'open'; ui.doorHold = null; if (Math.round(Lf.pos) === 2 && Lf.mode === 'phase2') task('phase2'); }
    if (Lf.p2 === 'off-return' && !Lf.carCalls.length && Math.round(Lf.pos) === 0) { Lf.mode = 'recalled'; Lf.p2 = 'off'; Lf.doors = 'open'; }
    const car = body.querySelector('#lCar');
    if (car) { car.setAttribute('transform', `translate(0 ${400 - Lf.pos * 125})`); car.setAttribute('class', `${Lf.mode} ${Lf.doors}`); }
    const hat = body.querySelector('#liftSvg .hat');
    const shaftDet = false;
    if (hat) hat.setAttribute('class', `hat ${Lf.mode === 'normal' ? '' : shaftDet ? 'flash' : 'on'}`);
    const disp = body.querySelector('#lDisp');
    if (disp) disp.innerHTML = `<span class="fl">${FLOORS[Math.round(Lf.pos)].id}</span><span class="dir">${Lf.target > Lf.pos + 0.01 ? '▲' : Lf.target < Lf.pos - 0.01 ? '▼' : ''}</span><span class="hat ${Lf.mode !== 'normal' ? 'on' : ''}">⛑</span>`;
    body.querySelectorAll('[data-p1]').forEach((b) => b.classList.toggle('active', b.dataset.p1 === (Lf.key === 'on' ? 'on' : 'off')));
    body.querySelectorAll('[data-p2]').forEach((b) => b.classList.toggle('active', b.dataset.p2 === (Lf.mode === 'phase2' ? Lf.p2 : 'off')));
    body.querySelectorAll('[data-call]').forEach((b) => b.classList.toggle('lit', Lf.carCalls.includes(+b.dataset.call)));
    const st = body.querySelector('#lStat');
    if (st) st.innerHTML = [[L('Mode', 'الوضع'), Lf.mode], [L('Position', 'الموقع'), `${FLOORS[Math.round(Lf.pos)].id} (${Lf.pos.toFixed(2)})`], [L('Doors', 'الأبواب'), Lf.doors], [L('Car calls', 'الطلبات'), Lf.carCalls.map((i) => FLOORS[i].id).join(', ') || '—'], [L('Phase I key', 'مفتاح المرحلة 1'), Lf.key], [L('Phase II', 'المرحلة 2'), Lf.p2 || 'off']]
      .map(([k, v]) => `<div class="ce-o ${v !== 'normal' && v !== 'closed' && v !== 'off' && v !== '—' ? 'on' : ''}"><span>${k}</span><b>${esc(v)}</b></div>`).join('');
  }

  // ── voice evacuation console
  function renderPa(body) {
    body.innerHTML = `<div class="bms-pa">
      <div class="hmi bms-console"><div class="hmi-bar">📢 ASFAN VEC-8 · ${L('Emergency Voice/Alarm Communications', 'اتصالات الإنذار والصوت الطارئة')} · NFPA 72 §24</div>
        <div class="bms-zones">${[...FLOORS.map((f) => [f.id, `${f.id === 'G' ? 'G' : f.id + 'F'}`]), ['stair', L('Stairs', 'الأدراج')]].map(([id, n]) => `<button class="bms-z" data-z="${id}"><span class="n">${n}</span><span class="st" id="pz_${id}"></span><span class="vu"><i></i><i></i><i></i><i></i><i></i></span></button>`).join('')}</div>
        <div class="adv-btns" style="margin-top:12px"><button class="btn sm" id="paAll">${L('Select ALL (all-call)', 'تحديد الكل (نداء عام)')}</button>
          <button class="btn sm warn" data-msg="alert">🔔 ${L('Alert message', 'رسالة تنبيه')}</button><button class="btn sm danger" data-msg="evac">🚨 ${L('Evacuate message', 'رسالة إخلاء')}</button>
          <button class="btn sm" id="paMic">🎙 ${L('PUSH-TO-TALK', 'اضغط للتحدث')}</button><button class="btn sm ghost" id="paCancel">✕ ${L('Cancel manual', 'إلغاء اليدوي')}</button></div>
        <div class="bms-msg" id="paMsg"></div></div>
      <div class="card"><h3>📘 ${L('HOW PHASED EVACUATION WORKS', 'كيف يعمل الإخلاء المرحلي')}</h3><ul class="bms-notes">
        <li>${L('Automatic: the fire floor and the floor above get the EVACUATE message (temporal-3 tone + voice); other floors get ALERT ("stand by") — see the Cause & Effect matrix.', 'تلقائياً: طابق الحريق والطابق الذي فوقه يتلقيان رسالة الإخلاء (نغمة temporal-3 + صوت)؛ والطوابق الأخرى تتلقى التنبيه ("استعدوا").')}</li>
        <li>${L('Manual control at the fire command centre has priority over automatic messages; live voice has the highest priority (NFPA 72 §24.4.4).', 'التحكم اليدوي في مركز قيادة الحريق له أولوية على الرسائل التلقائية؛ والصوت الحي له أعلى أولوية.')}</li>
        <li>${L('Intelligibility: measured STI ≥ 0.50 (average) in each acoustically distinguishable space (NFPA 72 §18.4.11 / Annex D).', 'الوضوح: مؤشر STI ≥ 0.50 (متوسط) في كل مساحة مميزة صوتياً.')}</li>
        <li>${L('Survivability: circuits to evacuation zones use level 2/3 pathway survivability (2-h rated cable or protected route) in high-rise buildings (NFPA 72 §24.3.14).', 'قابلية البقاء: الدوائر إلى مناطق الإخلاء بمستوى 2/3 (كابل مقاوم ساعتين أو مسار محمي) في المباني العالية.')}</li></ul></div></div>`;
    body.querySelectorAll('[data-z]').forEach((b) => { b.onclick = () => { const z = b.dataset.z; if (ui.pa.zones.has(z)) ui.pa.zones.delete(z); else ui.pa.zones.add(z); }; });
    body.querySelector('#paAll').onclick = () => { ui.pa.zones = new Set([...FLOORS.map((f) => f.id), 'stair']); };
    body.querySelectorAll('[data-msg]').forEach((b) => { b.onclick = () => { ui.pa.msg = b.dataset.msg; }; });
    const mic = body.querySelector('#paMic');
    mic.addEventListener('pointerdown', () => { ui.pa.mic = true; if (ui.pa.zones.size === FLOORS.length + 1) task('allcall'); });
    mic.addEventListener('pointerup', () => { ui.pa.mic = false; }); mic.addEventListener('pointerleave', () => { ui.pa.mic = false; });
    body.querySelector('#paCancel').onclick = () => { ui.pa.msg = null; ui.pa.zones.clear(); };
  }
  function updatePa(body) {
    const o = sys.outputs();
    for (const id of [...FLOORS.map((f) => f.id), 'stair']) {
      const auto = id === 'stair' ? (Object.values(o.voice).includes('evac') ? 'evac' : 'off') : o.voice[id];
      const man = ui.pa.zones.has(id) ? (ui.pa.mic ? 'live' : ui.pa.msg) : null;
      const st = man || auto;
      const el2 = body.querySelector(`#pz_${id}`);
      if (!el2) continue;
      el2.textContent = { evac: L('EVACUATE', 'إخلاء'), alert: L('ALERT', 'تنبيه'), live: L('LIVE MIC', 'صوت حي'), silenced: L('SILENCED', 'مُسكت'), off: L('standby', 'استعداد') }[st] || L('standby', 'استعداد');
      const btn = el2.closest('.bms-z');
      btn.className = `bms-z ${st} ${ui.pa.zones.has(id) ? 'sel' : ''} ${man ? 'man' : ''}`;
    }
    const msg = body.querySelector('#paMsg');
    if (msg) {
      const anyEvac = Object.values(o.voice).includes('evac') || ui.pa.msg === 'evac';
      const txt = ui.pa.mic ? L('🎙 LIVE: "Attention please, this is the fire command centre…"', '🎙 مباشر: "انتباه من فضلكم، هنا مركز قيادة الحريق…"')
        : anyEvac ? L('🔊 "Attention please. A fire emergency has been reported in the building. Leave now by the nearest exit or stairway. Do not use the lifts."', '🔊 "انتباه من فضلكم. تم الإبلاغ عن حالة حريق في المبنى. غادروا الآن من أقرب مخرج أو درج. لا تستخدموا المصاعد."')
          : Object.values(o.voice).includes('alert') || ui.pa.msg === 'alert' ? L('🔔 "Attention please. An incident is being investigated. Please stand by for further instructions."', '🔔 "انتباه من فضلكم. يجري التحقق من حادث. يرجى الاستعداد لتعليمات أخرى."') : L('System in standby — no messages.', 'النظام في وضع الاستعداد — لا رسائل.');
      msg.textContent = txt;
    }
  }

  // ── monitoring centre
  function renderArc(body) {
    body.innerHTML = `<div class="adv-grid c2">
      <div class="hmi"><div class="hmi-bar">🚒 ${L('ALARM RECEIVING CENTRE · Receiver RX-1 · line 1 · account 4721 (ASFAN Business Center)', 'مركز استقبال الإنذارات · المستقبل RX-1 · الحساب 4721 (مركز أصفان للأعمال)')}</div>
        <table><thead><tr><th>${L('Time', 'الوقت')}</th><th>Raw (Contact ID)</th><th>${L('Event', 'الحدث')}</th><th>Zone</th><th></th></tr></thead><tbody id="arcBody"></tbody></table></div>
      <div class="card"><h3>🔎 ${L('CONTACT-ID FORMAT', 'صيغة Contact-ID')}</h3>
        <div class="bms-cid"><span>ACCT<b>4721</b></span><span>MT<b>18</b></span><span>Q<b>1</b></span><span>EEE<b>110</b></span><span>GG<b>01</b></span><span>ZZZ<b>036</b></span></div>
        <p class="adv-note">${L('Q: 1 = new event / opening, 3 = restore / closing, 6 = previous event. EEE: 1xx alarms (110 fire, 113 waterflow, 115 call point), 2xx supervisory, 3xx troubles (301 AC loss, 302 low battery, 373 fire loop trouble, 380 sensor), 5xx bypass/disable, 6xx tests. GG = partition, ZZZ = zone / device.', 'Q: 1 = حدث جديد، 3 = عودة، 6 = حدث سابق. EEE: 1xx إنذارات (110 حريق، 113 تدفق، 115 زر يدوي)، 2xx إشرافي، 3xx أعطال (301 فقدان التيار، 302 بطارية منخفضة، 373 عطل حلقة، 380 حساس)، 5xx تجاوز/تعطيل، 6xx اختبارات. GG = القسم، ZZZ = المنطقة/الجهاز.')}</p>
        <h3 style="margin-top:12px">🎯 ${L('DECODE CHALLENGE', 'تحدي فك الرسائل')}</h3><div id="arcQuiz"></div></div></div>`;
    body.querySelector('#arcBody').addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (b) { ui.dispatched.add(+b.dataset.d); updateArc(body, true); } });
    renderQuiz(body);
    updateArc(body, true);
  }
  function updateArc(body, force) {
    const tb = body.querySelector('#arcBody');
    if (!tb) return;
    if (!force && tb.dataset.n === String(sys.cid.length)) return;
    tb.dataset.n = sys.cid.length;
    tb.innerHTML = sys.cid.slice(-40).map((c, i) => ({ c, i: sys.cid.length - Math.min(40, sys.cid.length) + i })).reverse().map(({ c, i }) => {
      const isFire = c.q === 1 && [CID.fire, CID.mcp, CID.flow].includes(c.code);
      return `<tr class="${c.q === 3 ? 'rst' : isFire ? 'fire' : c.code >= 300 ? 'trb' : 'sup'}"><td>${mmss(c.t)}</td><td>${c.raw}</td><td>${c.q === 3 ? L('RESTORE: ', 'عودة: ') : ''}${esc(tr(CID_NAMES[c.code] || T(String(c.code), String(c.code))))}</td><td>${pad3(c.zone)}</td>
        <td>${isFire ? (ui.dispatched.has(i) ? `<span class="adv-pill ok">🚒 ${L('dispatched', 'تم الإرسال')}</span>` : `<button class="btn sm danger" data-d="${i}">🚒 ${L('Dispatch', 'إرسال فرق')}</button>`) : ''}</td></tr>`;
    }).join('') || `<tr><td colspan="5" style="color:#6b8aa6">${L('Waiting for signals… trigger a fire, trouble or supervisory in another module.', 'بانتظار الإشارات… أطلق حريقاً أو عطلاً أو إشارة إشرافية من وحدة أخرى.')}</td></tr>`;
  }
  function renderQuiz(body) {
    const box = body.querySelector('#arcQuiz');
    const ans = {};
    box.innerHTML = QUIZ.map((q, i) => `<div class="bms-q"><code>${q.raw}</code><div class="adv-btns">${q.opts.map((o, k) => `<button class="btn sm" data-q="${i}" data-k="${k}">${esc(tr(o))}</button>`).join('')}</div></div>`).join('') + '<div id="arcQres"></div>';
    box.querySelectorAll('[data-q]').forEach((b) => {
      b.onclick = () => {
        const i = +b.dataset.q, k = +b.dataset.k;
        if (ans[i] != null) return;
        ans[i] = k;
        b.classList.add(k === QUIZ[i].a ? 'primary' : 'danger');
        if (k !== QUIZ[i].a) box.querySelector(`[data-q="${i}"][data-k="${QUIZ[i].a}"]`).classList.add('primary');
        if (Object.keys(ans).length === QUIZ.length) {
          const ok = QUIZ.filter((q, j) => ans[j] === q.a).length;
          box.querySelector('#arcQres').innerHTML = scoreBanner(Math.round((100 * ok) / QUIZ.length), `${ok} / ${QUIZ.length} ${L('decoded correctly', 'تم فكها بشكل صحيح')}`);
          if (ok >= 4) task('decode');
        }
      };
    });
  }

  frame();
  let last = 0;
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (t - last < 200) return; last = t;
    const body = el.querySelector('#bmsBody'); if (!body) return;
    if (ui.tab === 'hmi') updateHmi(body);
    if (ui.tab === 'points') updatePoints(body);
    if (ui.tab === 'lift') updateLift(body);
    if (ui.tab === 'pa') updatePa(body);
    if (ui.tab === 'arc') updateArc(body);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
};

export default m;
