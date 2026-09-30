// Module 1 — Addressable fire alarm control panel lab: realistic FACP faceplate (LCD, LEDs, keys,
// access-level key switch, buzzer), live floor plans with the SLC loop / NAC wiring, field testing of
// every device, fault injection (open / short / earth, Class A vs B, isolators, NAC EOL, AC fail),
// programming (auto-learn, addresses, zones, verification) and an inspector challenge with hidden faults.
import { FLOORS, PLAN, DEVICE_TYPES, roomsFor, PANEL_POS, RISER_POS } from './building.js';
import { FAULT_KINDS, batteryCalc, systemLoads } from './system.js';
import { header, L, esc, tr, store, markDone, tabBar, stat, scoreBanner, mmss, pad3 } from './ui.js';

const S = 20;                       // px per metre in the plan
const PX = (m) => m * S + 30;       // plan margin
const W = PLAN.w * S + 60, H = PLAN.h * S + 60;
const T = (en, ar) => ({ en, ar });

const m = {
  id: 'facp', icon: '🎛️',
  title: T('Addressable Fire Alarm Panel Lab', 'مختبر لوحة الإنذار المعنونة'),
  short: T('SLC loop, isolators, faults, programming', 'الحلقة والعوازل والأعطال والبرمجة'),
  sub: T('Operate a real-style addressable FACP connected to a 3-storey building: test every device in the field, cut and short the SLC loop to see Class A and isolators at work, program addresses with auto-learn, and diagnose hidden faults like a service engineer.',
    'شغّل لوحة إنذار معنونة واقعية متصلة بمبنى من 3 طوابق: اختبر كل جهاز في الموقع، واقطع حلقة SLC واعمل قصراً لترى الفئة A والعوازل، وبرمج العناوين بالتعلّم التلقائي، وشخّص الأعطال المخفية كمهندس صيانة.'),
  refs: ['NFPA 72 §10', '§12 Circuits & pathways', '§14 ITM', '§23 Protected premises'],
};

// ───────────────────────── device symbols (NFPA 170 style)
function symbol(d, cls = '') {
  const x = PX(d.x), y = PX(d.y), ty = DEVICE_TYPES[d.type];
  const t = `<text x="${x}" y="${y + 4}" text-anchor="middle" class="sym-t">${ty.sym}</text>`;
  let shape;
  if (d.type === 'mcp') shape = `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="2" class="sym sym-mcp"/>`;
  else if (d.type === 'iso') shape = `<path d="M${x} ${y - 10} L${x + 10} ${y} L${x} ${y + 10} L${x - 10} ${y} Z" class="sym sym-iso"/>`;
  else if (d.type === 'flow' || d.type === 'tamper' || d.type === 'relay') shape = `<rect x="${x - 10}" y="${y - 8}" width="20" height="16" rx="4" class="sym sym-mod"/>`;
  else shape = `<circle cx="${x}" cy="${y}" r="9.5" class="sym sym-det"/>`;
  return `<g class="dev ${cls}" data-dev="${d.id}" transform="translate(0 0)">
    <circle cx="${x}" cy="${y}" r="17" class="halo"/>${shape}${t}
    <text x="${x}" y="${y + 21}" text-anchor="middle" class="addr">${pad3(d.addr)}</text></g>`;
}

/** Cable route: drop from the device to the corridor ceiling lane, run along it, drop to the next device. */
function route(a, b, lane) {
  if (Math.abs(a.x - b.x) < 0.5) return `M${PX(a.x)} ${PX(a.y)} L${PX(b.x)} ${PX(b.y)}`;
  return `M${PX(a.x)} ${PX(a.y)} L${PX(a.x)} ${PX(lane)} L${PX(b.x)} ${PX(lane)} L${PX(b.x)} ${PX(b.y)}`;
}

const ROOM_FILL = { office: '#f5f2eb', corridor: '#e8edf2', stair: '#dfe6ee', shaft: '#cdd5dd', lobby: '#eaf1e2', server: '#e9e4f5', tech: '#f4e7d6', kitchen: '#f3eee0' };

function planSvg(sys, floor, ui) {
  const rooms = roomsFor(floor);
  const nodes = sys.loopNodes();
  const n = nodes.length;
  const pos = (i) => {                          // node index → {x,y,floor}
    if (i === 0 || i === n + 1) return { x: PANEL_POS.x, y: PANEL_POS.y, floor: 'G', panel: true };
    const d = nodes[i - 1];
    return { x: d.x, y: d.y, floor: d.floor };
  };
  let wires = '', hits = '';
  const seg = (i, a, b) => {
    const cls = sys.opens.has(i) ? 'open' : sys.shorts.has(i) ? 'short' : '';
    const ret = i === n ? ' ret' : '';
    const path = route(a, b, 10.1);
    wires += `<path d="${path}" class="wire ${cls}${ret}"/>`;
    hits += `<path d="${path}" class="wire-hit" data-seg="${i}"/>`;
    if (cls) {
      const mx = PX((a.x + b.x) / 2), my = PX(Math.abs(a.x - b.x) < 0.5 ? (a.y + b.y) / 2 : 10.1);
      wires += `<g class="mark ${cls}" transform="translate(${mx} ${my})"><circle r="11"/><text y="5" text-anchor="middle">${cls === 'open' ? '✂' : '⚡'}</text></g>`;
    }
  };
  const lastSeg = sys.loopClass === 'A' ? n : n - 1;
  for (let i = 0; i <= lastSeg; i++) {
    const a = pos(i), b = pos(i + 1);
    if (a.floor === floor && b.floor === floor) seg(i, a, b);
    else if (a.floor === floor) seg(i, a, { ...RISER_POS, floor });
    else if (b.floor === floor) seg(i, { ...RISER_POS, floor }, b);
    else if (FLOORS.findIndex((f) => f.id === floor) > Math.min(FLOORS.findIndex((f) => f.id === a.floor), FLOORS.findIndex((f) => f.id === b.floor))
      && FLOORS.findIndex((f) => f.id === floor) < Math.max(FLOORS.findIndex((f) => f.id === a.floor), FLOORS.findIndex((f) => f.id === b.floor))) {
      wires += `<circle cx="${PX(RISER_POS.x)}" cy="${PX(RISER_POS.y)}" r="4" class="wire-pass"/>`;
    }
  }
  // NAC circuits
  let nac = '';
  for (const circ of ['NAC1', 'NAC2']) {
    const list = sys.nacDevices.filter((a) => a.nac === circ && a.floor === floor);
    if (!list.length) continue;
    const pts = [{ x: RISER_POS.x + 0.8, y: RISER_POS.y + 1.2 }, ...list];
    if (floor === 'G') pts.unshift({ x: PANEL_POS.x + 0.6, y: PANEL_POS.y });
    const f = sys.nacFaults[circ];
    nac += `<path d="${pts.slice(1).map((p, i) => route(pts[i], p, 12.2)).join(' ')}" class="nac-wire ${f || ''}"/>`;
    const out = sys.outputs();
    list.forEach((a, k) => {
      const on = out.nac[circ] && !(out.nacPartial[circ] && k === list.length - 1);
      nac += `<g class="hs ${on ? 'on' : ''}" transform="translate(${PX(a.x)} ${PX(a.y)})"><path d="M-8 -7 L8 -7 L8 7 L-8 7 Z" /><path d="M-4 -3 L2 -6 L2 6 L-4 3 Z" class="horn"/><circle cx="5" cy="0" r="2" class="strobe"/>${on ? '<circle r="15" class="wave"/>' : ''}</g>`;
    });
    const last = list[list.length - 1];
    if (circ === 'NAC2' || floor === '1') nac += `<g transform="translate(${PX(last.x) + 13} ${PX(last.y) - 12})"><rect x="-9" y="-5" width="18" height="10" rx="2" class="eol ${f === 'eol' ? 'missing' : ''}"/><text y="3" text-anchor="middle" class="eol-t">EOL</text></g>`;
  }
  const devs = sys.devices.filter((d) => d.floor === floor).map((d) => symbol(d, stateClass(sys, d, ui))).join('');
  const panel = floor === 'G' ? `<g class="facp-ico" transform="translate(${PX(PANEL_POS.x)} ${PX(PANEL_POS.y)})"><rect x="-22" y="-13" width="44" height="26" rx="4"/><rect x="-16" y="-8" width="20" height="9" rx="1" class="scr"/><circle cx="11" cy="-4" r="2.5" class="${sys.count('fire') ? 'l-fire' : 'l-ok'}"/><text y="23" text-anchor="middle">FACP</text></g>` : '';
  const riser = `<g class="riser-ico" transform="translate(${PX(RISER_POS.x)} ${PX(RISER_POS.y)})"><rect x="-9" y="-9" width="18" height="18" rx="3"/><text y="4" text-anchor="middle">⇅</text></g>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="adv-svg facp-plan ${ui.mode}">
    <defs><pattern id="stairHatch" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8 L8 0" stroke="#b8c3cf" stroke-width="1"/></pattern></defs>
    <rect x="0" y="0" width="${W}" height="${H}" class="plan-bg"/>
    ${rooms.map((r) => `<g class="room ${r.kind}"><rect x="${PX(r.x)}" y="${PX(r.y)}" width="${r.w * S}" height="${r.h * S}" fill="${ROOM_FILL[r.kind] || '#f5f2eb'}"/>${r.kind === 'stair' ? `<rect x="${PX(r.x)}" y="${PX(r.y)}" width="${r.w * S}" height="${r.h * S}" fill="url(#stairHatch)"/>` : ''}
      ${r.w * r.h >= 12 ? `<text x="${PX(r.x) + 6}" y="${PX(r.y) + (r.kind === 'corridor' ? 14 : 15)}" class="room-t">${esc(tr(r.name))}</text>` : ''}</g>`).join('')}
    <rect x="${PX(0)}" y="${PX(0)}" width="${PLAN.w * S}" height="${PLAN.h * S}" class="outer"/>
    ${nac}${wires}${riser}${panel}${devs}${hits}
    <text x="${W - 34}" y="22" text-anchor="end" class="flr-t">${esc(tr(FLOORS.find((f) => f.id === floor).name))}</text>
  </svg>`;
}

function stateClass(sys, d, ui) {
  const c = [];
  const ev = (k) => sys.events.has(k);
  if (!d.comm) c.push('nocomm');
  if (ev(`fire:${d.id}`)) c.push('fire');
  else if (ev(`pre:${d.id}`)) c.push('pre');
  if (ev(`sup:${d.id}`)) c.push('super');
  if (d.disabled) c.push('disabled');
  if ([...sys.events.values()].some((e) => e.kind === 'trouble' && (e.devId === d.id || (e.addr === d.addr && e.key.includes(':' + d.addr))))) c.push('trouble');
  if (d.test) c.push('testing');
  if (ui.sel === d.id) c.push('sel');
  if (d.type === 'relay' && d.relayOn) c.push('relay-on');
  return c.join(' ');
}

// ───────────────────────── faceplate
function lcdLines(sys, ui) {
  const now = new Date();
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  if (ui.lamp) return ['████████████████████████████████████████', '████████████████████████████████████████', '████████████████████████████████████████', '████████████████████████████████████████'];
  if (ui.denied) return ['ACCESS DENIED', 'Turn the key switch to ACCESS LEVEL 2', 'to silence, reset, drill or disable.', `                              ${clock}`];
  const ev = sys.sortedEvents();
  const cnt = `FIRE ${pad3(sys.count('fire'))} PRE ${pad3(sys.count('pre'))} SUP ${pad3(sys.count('super'))} TRB ${pad3(sys.count('trouble'))}`;
  if (!ev.length) return ['ASFAN FX-3000   SYSTEM NORMAL', `Loop 1: ${sys.devices.filter((d) => d.comm).length} devices OK   Class ${sys.loopClass}`, `AC ${sys.ac ? 'ON ' : 'OFF'}  BATT ${sys.battV.toFixed(1)}V  ${sys.drill ? 'DRILL ACTIVE' : ''}`, `ACCESS LEVEL ${sys.accessLevel}              ${clock}`];
  const i = ((sys.lcdIdx % ev.length) + ev.length) % ev.length;
  const e = ev[i];
  const kind = { fire: 'FIRE ALARM', pre: 'PRE-ALARM', super: 'SUPERVISORY', trouble: 'TROUBLE', disable: 'DISABLED' }[e.kind];
  const dev = e.devId ? sys.dev(e.devId) : null;
  const addr = dev ? `L1D${pad3(dev.addr)} ${dev.floor}F ZONE ${dev.zone}` : 'SYSTEM';
  const txt = e.text.en.replace(/^(FIRE( – [A-Z ]+)?|PRE-ALARM|SUPERVISORY –|Disabled:)\s*/i, '').replace(/^\d{3} \w+F /, '');
  return [cnt, `${kind.padEnd(12)} ${addr}`.slice(0, 40), txt.slice(0, 40), `${e.acked ? 'ACKED' : 'NOT ACK'} ${String(i + 1).padStart(2)}/${ev.length} ▲▼   ${clock}`];
}

function faceplate() {
  return `<div class="facp">
    <div class="facp-top"><div class="facp-brand"><span class="logo">▲</span> ASFAN <b>FX-3000</b></div><div class="facp-model">ADDRESSABLE FIRE ALARM CONTROL PANEL · 1 LOOP · 159 ADDR</div></div>
    <div class="facp-mid">
      <div class="facp-leds" id="fpLeds"></div>
      <div class="facp-lcd-wrap"><div class="facp-lcd" id="fpLcd"></div>
        <div class="facp-nav"><button data-k="up">▲</button><button data-k="down">▼</button></div></div>
    </div>
    <div class="facp-keys">
      <button data-k="ack" class="k-ack"><span>ACKNOWLEDGE</span><small>${L('Silence buzzer', 'إسكات الصفارة')}</small></button>
      <button data-k="silence" class="k-sil"><span>ALARM SILENCE</span><small>${L('Level 2', 'المستوى 2')}</small></button>
      <button data-k="resound" class="k-res"><span>RESOUND</span><small>${L('Re-activate', 'إعادة التشغيل')}</small></button>
      <button data-k="reset" class="k-rst"><span>SYSTEM RESET</span><small>${L('Level 2', 'المستوى 2')}</small></button>
      <button data-k="drill" class="k-drl"><span>DRILL</span><small>${L('Evacuate', 'إخلاء')}</small></button>
      <button data-k="lamp" class="k-lmp"><span>LAMP TEST</span><small>LED / LCD</small></button>
      <div class="facp-key" id="fpKey" title="${L('Access level key switch', 'مفتاح مستوى الوصول')}"><div class="barrel"><div class="slot"></div></div><div class="kl"><span>1</span><span>2</span></div></div>
    </div>
    <div class="facp-foot"><span id="fpBuzz" class="buzz">🔔 ${L('BUZZER', 'الصفارة')}</span><span class="mono" id="fpPsu"></span></div>
  </div>`;
}

const LEDS = [
  ['ac', 'AC POWER', 'g'], ['fire', 'FIRE ALARM', 'r'], ['pre', 'PRE-ALARM', 'r'], ['super', 'SUPERVISORY', 'y'], ['trouble', 'SYSTEM TROUBLE', 'y'],
  ['disable', 'DISABLED', 'y'], ['silenced', 'ALARM SILENCED', 'y'], ['ground', 'EARTH FAULT', 'y'], ['batt', 'BATTERY FAULT', 'y'], ['cpu', 'CPU FAIL', 'y'],
];

function updateFaceplate(el, sys, ui) {
  const blink = Math.floor(performance.now() / 450) % 2 === 0;
  const unacked = (k) => [...sys.events.values()].some((e) => e.kind === k && !e.acked);
  const st = {
    ac: sys.ac, fire: sys.count('fire') > 0, pre: sys.count('pre') > 0, super: sys.count('super') > 0, trouble: sys.count('trouble') > 0,
    disable: sys.count('disable') > 0, silenced: sys.silenced, ground: sys.ground, batt: sys.battV < 22.5, cpu: false,
  };
  const leds = el.querySelector('#fpLeds');
  leds.innerHTML = LEDS.map(([k, lbl, col]) => {
    const on = ui.lamp || (st[k] && (!unacked(k) || blink || k === 'ac'));
    return `<div class="led-row"><span class="led ${col} ${on ? 'on' : ''}"></span><span>${lbl}</span></div>`;
  }).join('');
  el.querySelector('#fpLcd').innerHTML = lcdLines(sys, ui).map((l) => `<div>${esc(l).padEnd(40, ' ')}</div>`).join('');
  el.querySelector('#fpLcd').classList.toggle('alarm', st.fire);
  const bz = el.querySelector('#fpBuzz');
  bz.classList.toggle('on', sys.buzzer && blink);
  el.querySelector('#fpPsu').textContent = `PSU ${sys.ac ? '230 VAC' : 'BATTERY'} · ${sys.battV.toFixed(1)} V`;
  el.querySelector('#fpKey').classList.toggle('l2', sys.accessLevel >= 2);
}

// ───────────────────────── buzzer sound (optional)
let audio = null;
function beep(on) {
  if (!store.get('facpSound', false)) on = false;
  try {
    if (on && !audio) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 2900; g.gain.value = 0.025; o.connect(g); g.connect(ctx.destination); o.start();
      audio = { ctx, g };
    }
    if (audio) audio.g.gain.value = on && Math.floor(performance.now() / 450) % 2 === 0 ? 0.025 : 0;
    if (!on && audio && !store.get('facpSound', false)) { audio.ctx.close(); audio = null; }
  } catch { /* ignore */ }
}

// ───────────────────────── device inspector
function inspector(sys, d) {
  if (!d) return `<div class="facp-empty">${L('Click a device on the plan to inspect and test it in the field.', 'انقر على جهاز في المخطط لفحصه واختباره في الموقع.')}</div>`;
  const ty = DEVICE_TYPES[d.type];
  const cfg = sys.config[d.addr];
  const pct = Math.round(Math.min(1.5, d.val || 0) * 100);
  const analog = ty.analog ? `<div class="an"><div class="an-lbl"><span>${L('Analog value (% of alarm threshold)', 'القيمة التناظرية (% من حد الإنذار)')}</span><b>${pct}%</b></div>
    <div class="an-bar"><div style="width:${Math.min(100, pct / 1.5)}%" class="${pct >= 100 ? 'f' : pct >= sys.settings.preAlarm * 100 ? 'p' : ''}"></div><i style="inset-inline-start:${(sys.settings.preAlarm * 100) / 1.5}%"></i><i class="al" style="inset-inline-start:${100 / 1.5}%"></i></div>
    ${d.type !== 'heat' ? `<div class="an-lbl"><span>${L('Chamber contamination (drift)', 'اتساخ الحجرة (الانجراف)')}</span><b>${Math.round(d.dirt * 100)}%</b></div><div class="an-bar dirt"><div style="width:${Math.min(100, d.dirt * 100)}%"></div></div>` : `<div class="an-lbl"><span>${L('Temperature', 'درجة الحرارة')}</span><b>${d.temp.toFixed(1)} °C</b></div>`}</div>` : '';
  const act = [];
  if (d.type === 'smoke' || d.type === 'multi') act.push(['smoke', `💨 ${L('Smoke test (aerosol)', 'اختبار دخان (بخاخ)')}`]);
  if (d.type === 'heat' || d.type === 'multi') act.push(['heat', `🔥 ${L('Heat gun test', 'اختبار بمسدس حرارة')}`]);
  if (d.type === 'mcp') act.push(['mcp', `🖐 ${L('Operate call point', 'تشغيل الزر اليدوي')}`], ['mcpReset', `🔑 ${L('Reset call point (key)', 'إعادة ضبط الزر (بالمفتاح)')}`]);
  if (d.type === 'flow') act.push(['flow', `🚿 ${L("Open inspector's test valve", 'فتح صمام اختبار المفتش')}`]);
  if (d.type === 'tamper') act.push(['tamper', `🔧 ${L('Close the control valve (2 turns)', 'إغلاق صمام التحكم (لفتان)')}`]);
  if (d.test) act.push(['end', `⏹ ${L('End test / restore', 'إنهاء الاختبار / الاستعادة')}`]);
  return `<div class="insp">
    <div class="insp-h"><div class="insp-sym">${ty.sym}</div><div><b>${esc(tr(d.label))}</b><div class="muted">${esc(tr(ty.name))}</div></div></div>
    <div class="insp-kv">
      <span>${L('Address', 'العنوان')}</span><b class="mono">L1D${pad3(d.addr)}</b>
      <span>${L('Floor / zone', 'الطابق / المنطقة')}</span><b>${d.floor} · ${esc(d.zone)}</b>
      <span>${L('Communication', 'الاتصال')}</span><b class="${d.comm ? 'ok' : 'bad'}">${d.comm ? L('OK – polling', 'سليم – يستجيب') : L('NO ANSWER', 'لا استجابة')}</b>
      <span>${L('Programmed as', 'مبرمج كـ')}</span><b class="${cfg && cfg.type === d.type ? '' : 'bad'}">${cfg ? esc(cfg.type) : L('not programmed', 'غير مبرمج')}</b>
      <span>${L('Loop position', 'موقعه على الحلقة')}</span><b class="mono">#${d.order + 1}</b>
    </div>
    ${analog}
    <div class="adv-btns">${act.map(([k, lbl]) => `<button class="btn sm ${k === 'end' || k === 'mcpReset' ? '' : 'primary'}" data-act="${k}">${lbl}</button>`).join('')}</div>
    <details class="insp-more"><summary>${L('Engineer actions', 'إجراءات المهندس')}</summary>
      <div class="adv-btns" style="margin-top:8px">
        <label class="adv-field" style="flex-direction:row;align-items:center;gap:6px">${L('Address', 'العنوان')} <input type="number" id="inAddr" min="1" max="159" value="${d.addr}" style="width:74px"/></label>
        <button class="btn sm" data-act="addr">${L('Set address', 'ضبط العنوان')}</button>
        <button class="btn sm" data-act="disable">${d.disabled ? L('Enable', 'تمكين') : L('Disable', 'تعطيل')}</button>
        ${ty.analog && d.type !== 'heat' ? `<button class="btn sm" data-act="dirty">${L('Make dirty', 'اجعله متّسخاً')}</button><button class="btn sm" data-act="clean">${L('Clean / replace head', 'تنظيف / تبديل الرأس')}</button>` : ''}
        <button class="btn sm" data-act="kill">${d.fault === 'dead' ? L('Repair device', 'إصلاح الجهاز') : L('Device failure', 'تعطّل الجهاز')}</button>
        <button class="btn sm danger" data-act="remove">${L('Remove from loop', 'إزالة من الحلقة')}</button>
      </div></details>
  </div>`;
}

// ───────────────────────── guided exercises
const EXERCISES = [
  { id: 'mcp', t: T('Operate a call point, acknowledge, silence and reset correctly (the call point must be reset with its key first).', 'شغّل زر إنذار يدوي ثم أقِر وأسكت الإنذار وأعد الضبط بشكل صحيح (يجب إعادة ضبط الزر بمفتاحه أولاً).'),
    check: (h) => has(h, /FIRE – call point/) && has(h, /Events acknowledged/) && has(h, /Alarm silenced/) && has(h, /System reset/) },
  { id: 'classA', t: T('Show Class A survivability: cut the loop once and prove no device is lost.', 'أثبت ميزة الفئة A: اقطع الحلقة مرة واحدة وأثبت عدم فقدان أي جهاز.'),
    check: (h, s) => s.loopClass === 'A' && has(h, /open circuit – Class A/) },
  { id: 'classB', t: T('Switch to Class B and cut the loop: note how many devices report NO ANSWER.', 'حوّل إلى الفئة B واقطع الحلقة: لاحظ عدد الأجهزة التي لا تستجيب.'),
    check: (h) => has(h, /devices beyond the break lost/) && has(h, /No answer/) },
  { id: 'iso', t: T('Short-circuit the loop and identify which isolators operated.', 'اعمل قصراً في الحلقة وحدد العوازل التي عملت.'), check: (h) => has(h, /isolators .* operated/) },
  { id: 'dup', t: T('Create a double address, observe the trouble, then fix it.', 'أنشئ عنواناً مكرراً وراقب العطل ثم أصلحه.'), check: (h) => has(h, /Double address/) && has(h, /RESTORED: Double address/) },
  { id: 'learn', t: T('Add a new detector (it shows "Unprogrammed"), then run Auto-learn to program it.', 'أضف كاشفاً جديداً (سيظهر "غير مبرمج") ثم شغّل التعلّم التلقائي لبرمجته.'), check: (h) => has(h, /Unprogrammed device/) && has(h, /Auto-learn complete/) },
  { id: 'ac', t: T('Simulate an AC power failure and restore it.', 'حاكِ انقطاع الكهرباء الرئيسية ثم أعدها.'), check: (h) => has(h, /RESTORED: AC power failure/) },
  { id: 'super', t: T('Close a sprinkler control valve: a SUPERVISORY signal (not a fire alarm) must appear.', 'أغلق صمام تحكم الرشاشات: يجب أن تظهر إشارة إشرافية (وليس إنذار حريق).'), check: (h) => has(h, /SUPERVISORY – valve/) },
  { id: 'flow', t: T('Open an inspector\'s test valve: waterflow alarm after the retard time.', 'افتح صمام اختبار المفتش: إنذار تدفق المياه بعد زمن التأخير.'), check: (h) => has(h, /WATERFLOW/) },
];
const has = (h, re) => h.some((x) => re.test(x.text.en));

// ───────────────────────── render
m.render = (el, ctx) => {
  const sys = ctx.sys;
  const ui = { tab: store.get('facpTab', 'live'), floor: store.get('facpFloor', 'G'), sel: null, mode: 'select', addType: 'smoke', lamp: false, denied: 0 };
  let sig = '';
  let unsub = null, raf = 0;

  const tabs = [
    { id: 'live', label: `🎛️ ${L('Live panel & building', 'اللوحة والمبنى مباشرة')}` },
    { id: 'program', label: `🧮 ${L('Programming', 'البرمجة')}` },
    { id: 'ex', label: `🧪 ${L('Guided exercises', 'تمارين موجهة')}` },
    { id: 'insp', label: `🕵️ ${L('Inspector challenge', 'تحدي المفتش')}` },
    { id: 'dev', label: `📚 ${L('Devices: install & wiring', 'الأجهزة: التركيب والتوصيل')}` },
  ];

  function frame() {
    el.innerHTML = header(m, `<label class="facp-snd"><input type="checkbox" id="sndT" ${store.get('facpSound', false) ? 'checked' : ''}/> 🔊 ${L('Buzzer sound', 'صوت الصفارة')}</label>`) + tabBar(tabs, ui.tab) + '<div id="facpBody"></div>';
    el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { ui.tab = b.dataset.tab; store.set('facpTab', ui.tab); frame(); }; });
    el.querySelector('#sndT').onchange = (e) => { store.set('facpSound', e.target.checked); if (!e.target.checked) beep(false); };
    const body = el.querySelector('#facpBody');
    ({ live: renderLive, program: renderProgram, ex: renderEx, insp: renderInsp, dev: renderDevices })[ui.tab](body);
  }

  // ── live tab
  function renderLive(body) {
    sig = '';
    body.innerHTML = `<div class="facp-live">
      <div class="facp-left">${faceplate()}
        <div class="card facp-events"><h3>📜 ${L('EVENT HISTORY', 'سجل الأحداث')}<span class="r"><button class="btn sm" id="evCsv">⬇ CSV</button></span></h3><div class="adv-log" id="evLog"></div></div>
      </div>
      <div class="facp-right">
        <div class="card">
          <div class="facp-toolbar">
            <div class="seg">${FLOORS.map((f) => `<button data-floor="${f.id}" class="${ui.floor === f.id ? 'active' : ''}">${f.id === 'G' ? 'G' : f.id + 'F'}</button>`).join('')}</div>
            <div class="seg">${[['select', `🖱 ${L('Select / test', 'تحديد / اختبار')}`], ['cut', `✂ ${L('Cut cable', 'قطع الكابل')}`], ['short', `⚡ ${L('Short', 'قصر')}`], ['repair', `🔧 ${L('Repair', 'إصلاح')}`], ['add', `➕ ${L('Add device', 'إضافة جهاز')}`]].map(([k, l]) => `<button data-mode="${k}" class="${ui.mode === k ? 'active' : ''}">${l}</button>`).join('')}</div>
            ${ui.mode === 'add' ? `<select id="addType">${Object.entries(DEVICE_TYPES).map(([k, v]) => `<option value="${k}" ${k === ui.addType ? 'selected' : ''}>${esc(tr(v.name))}</option>`).join('')}</select>` : ''}
          </div>
          <div id="planBox" class="facp-planbox"></div>
          <div class="adv-legend">
            <span><i style="background:#d7263d"></i>${L('SLC loop (Class A out / return)', 'حلقة SLC (الفئة A ذهاب / عودة)')}</span>
            <span><i style="background:#f08c00"></i>${L('NAC circuit (horn/strobes)', 'دائرة الإنذار (أبواق/وميض)')}</span>
            <span>◆ ${L('Isolator', 'عازل')}</span><span>■ ${L('Call point', 'زر يدوي')}</span><span>▭ ${L('Module', 'وحدة')}</span><span>● ${L('Detector', 'كاشف')}</span>
          </div>
        </div>
        <div class="adv-grid c2" style="margin-top:12px">
          <div class="card"><h3>🔍 ${L('FIELD DEVICE', 'الجهاز الميداني')}</h3><div id="insp"></div></div>
          <div class="card"><h3>⚙️ ${L('SYSTEM & FAULT INJECTION', 'النظام وحقن الأعطال')}</h3>
            <div class="facp-sysrow"><span>${L('Loop wiring class', 'فئة توصيل الحلقة')}</span><div class="seg sm"><button data-cls="A" class="${sys.loopClass === 'A' ? 'active' : ''}">Class A</button><button data-cls="B" class="${sys.loopClass === 'B' ? 'active' : ''}">Class B</button></div></div>
            <label class="facp-sysrow"><span>${L('Mains (AC) power', 'التيار الرئيسي')}</span><input type="checkbox" id="acT" ${sys.ac ? 'checked' : ''}/></label>
            <label class="facp-sysrow"><span>${L('Earth fault on loop', 'تسرّب أرضي على الحلقة')}</span><input type="checkbox" id="gndT" ${sys.ground ? 'checked' : ''}/></label>
            ${['NAC1', 'NAC2'].map((n) => `<label class="facp-sysrow"><span>${n} ${n === 'NAC1' ? '(G + 1F)' : '(2F)'}</span><select data-nac="${n}">${[['', L('Normal', 'طبيعي')], ['eol', L('EOL missing', 'مقاومة EOL مفقودة')], ['open', L('Cable break', 'قطع كابل')], ['short', L('Short circuit', 'قصر')]].map(([v, l]) => `<option value="${v}" ${(sys.nacFaults[n] || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`).join('')}
            <div class="adv-btns" style="margin-top:10px"><button class="btn sm" id="repAll">🔧 ${L('Repair all faults', 'إصلاح كل الأعطال')}</button><button class="btn sm" id="rstProj">↺ ${L('Factory reset project', 'استعادة المشروع الافتراضي')}</button></div>
            <p class="adv-note" style="margin-top:10px">${L('Tip: in Class A the loop returns to the panel, so one open circuit loses nothing. Isolators on each floor limit a short circuit to one section (NFPA 72 §12.3 / §23.6).', 'نصيحة: في الفئة A تعود الحلقة إلى اللوحة، لذا لا يُفقد أي جهاز عند قطع واحد. العوازل في كل طابق تحصر القصر في قسم واحد (NFPA 72 §12.3 / §23.6).')}</p>
          </div>
        </div>
      </div></div>`;
    body.querySelector('.facp').addEventListener('click', onKey);
    body.querySelectorAll('[data-floor]').forEach((b) => { b.onclick = () => { ui.floor = b.dataset.floor; store.set('facpFloor', ui.floor); renderLive(body); }; });
    body.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { ui.mode = b.dataset.mode; renderLive(body); }; });
    body.querySelector('#addType')?.addEventListener('change', (e) => { ui.addType = e.target.value; });
    body.querySelectorAll('[data-cls]').forEach((b) => { b.onclick = () => { sys.setClass(b.dataset.cls); renderLive(body); }; });
    body.querySelector('#acT').onchange = (e) => sys.setAC(e.target.checked);
    body.querySelector('#gndT').onchange = (e) => sys.setGround(e.target.checked);
    body.querySelectorAll('[data-nac]').forEach((s) => { s.onchange = () => sys.setNacFault(s.dataset.nac, s.value || null); });
    body.querySelector('#repAll').onclick = () => { sys.repairAll(); renderLive(body); };
    body.querySelector('#rstProj').onclick = () => { if (confirm(L('Restore the original building, devices and programming?', 'استعادة المبنى والأجهزة والبرمجة الأصلية؟'))) { ctx.resetProject(); ui.sel = null; renderLive(body); } };
    body.querySelector('#evCsv').onclick = () => {
      const rows = ['time,kind,address,floor,text', ...sys.history.map((h) => [mmss(h.t), h.kind, h.addr ?? '', h.floor ?? '', `"${h.text.en.replace(/"/g, '""')}"`].join(','))];
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'facp_event_log.csv'; a.click();
    };
    const plan = body.querySelector('#planBox');
    plan.addEventListener('click', (e) => onPlanClick(e, body));
    body.querySelector('#insp').addEventListener('click', (e) => onInspector(e, body));
    update(body, true);
  }

  function update(body, force = false) {
    const fp = body.querySelector('.facp');
    if (fp) updateFaceplate(fp, sys, ui);
    const plan = body.querySelector('#planBox');
    if (plan) {
      const s = JSON.stringify([ui.floor, ui.mode, ui.sel, sys.loopClass, [...sys.opens], [...sys.shorts], sys.nacFaults, sys.devices.map((d) => [d.id, d.addr, d.x, d.order, d.type]), sys.outputs().sounders]);
      if (force || s !== sig) { sig = s; plan.innerHTML = planSvg(sys, ui.floor, ui); }
      else plan.querySelectorAll('[data-dev]').forEach((g) => { const d = sys.dev(g.dataset.dev); if (d) g.setAttribute('class', `dev ${stateClass(sys, d, ui)}`); });
    }
    const insp = body.querySelector('#insp');
    if (insp && !insp.contains(document.activeElement)) insp.innerHTML = inspector(sys, ui.sel && sys.dev(ui.sel));
    const log = body.querySelector('#evLog');
    if (log) {
      const n = sys.history.length;
      if (log.dataset.n !== String(n)) {
        log.dataset.n = n;
        log.innerHTML = sys.history.slice(-80).reverse().map((h) => `<div class="${h.restore ? 'ok' : h.kind}"><span class="t">${mmss(h.t)}</span>${esc(tr(h.text))}</div>`).join('') || `<div class="ok">${L('System normal – no events.', 'النظام طبيعي – لا أحداث.')}</div>`;
      }
    }
  }

  function onKey(e) {
    const b = e.target.closest('[data-k]'); const key = e.target.closest('#fpKey');
    if (key) { sys.accessLevel = sys.accessLevel >= 2 ? 1 : 2; sys.log('info', T(`Access level ${sys.accessLevel}`, `مستوى الوصول ${sys.accessLevel}`)); return; }
    if (!b) return;
    const k = b.dataset.k;
    if (k === 'up') sys.lcdIdx--;
    if (k === 'down') sys.lcdIdx++;
    if (k === 'ack') sys.ack();
    if (k === 'silence') sys.silence();
    if (k === 'resound') sys.resound();
    if (k === 'reset') sys.reset();
    if (k === 'drill') sys.startDrill();
    if (k === 'lamp') { ui.lamp = true; setTimeout(() => { ui.lamp = false; }, 2500); }
  }

  function onPlanClick(e, body) {
    const svg = e.currentTarget.querySelector('svg');
    const devEl = e.target.closest('[data-dev]');
    const segEl = e.target.closest('[data-seg]');
    if (ui.mode === 'select' && devEl) { ui.sel = devEl.dataset.dev; update(body, true); return; }
    if (['cut', 'short', 'repair'].includes(ui.mode) && segEl) {
      const i = +segEl.dataset.seg;
      if (ui.mode === 'cut') sys.cut(i); else if (ui.mode === 'short') sys.shortSeg(i); else sys.repair(i);
      update(body, true); return;
    }
    if (ui.mode === 'add' && svg) {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const x = (p.x - 30) / S, y = (p.y - 30) / S;
      if (x < 0 || y < 0 || x > PLAN.w || y > PLAN.h) return;
      const room = roomsFor(ui.floor).find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
      const d = sys.addDevice({ type: ui.addType, floor: ui.floor, x: +x.toFixed(1), y: +y.toFixed(1), room: room?.id || 'cor', label: T(`New ${ui.addType} – ${room ? room.name.en : 'area'}`, `${tr(DEVICE_TYPES[ui.addType].name)} جديد – ${room ? room.name.ar : 'منطقة'}`) });
      // splice it into the cable route next to the nearest device on the same floor
      const near = sys.devices.filter((o) => o.floor === ui.floor && o !== d).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      if (near) { d.order = near.order + 0.5; sys.loopNodes().forEach((o, i) => { o.order = i; }); }
      sys.opens.clear(); sys.shorts.clear();
      sys.evaluate();
      ui.sel = d.id; ui.mode = 'select';
      renderLive(body);
    }
  }

  function onInspector(e, body) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const d = sys.dev(ui.sel); if (!d) return;
    const a = b.dataset.act;
    if (['smoke', 'heat', 'mcp', 'flow', 'tamper'].includes(a)) sys.test(d.id, a);
    if (a === 'end') { sys.endTest(d.id); }
    if (a === 'mcpReset') sys.resetMcp(d.id);
    if (a === 'addr') sys.setAddr(d.id, +body.querySelector('#inAddr').value);
    if (a === 'disable') sys.setDisabled(d.id, !d.disabled);
    if (a === 'dirty') { sys.setDirt(d.id, 0.9); sys.evaluate(); }
    if (a === 'clean') { sys.setDirt(d.id, 0.03); sys.evaluate(); }
    if (a === 'kill') sys.setFault(d.id, d.fault === 'dead' ? null : 'dead');
    if (a === 'remove') { sys.removeDevice(d.id); ui.sel = null; }
    document.activeElement?.blur?.();
    update(body, true);
  }

  // ── programming tab
  function renderProgram(body) {
    const rows = [...sys.devices].sort((a, b) => a.addr - b.addr);
    const { standbyA, alarmA } = systemLoads(sys); const bc = batteryCalc({ standbyA, alarmA });
    body.innerHTML = `<div class="adv-stats">
        ${stat(L('Devices on loop', 'أجهزة على الحلقة'), sys.devices.length, '/ 159')}
        ${stat(L('Programmed addresses', 'عناوين مبرمجة'), Object.keys(sys.config).length)}
        ${stat(L('Standby current', 'تيار الاستعداد'), (standbyA * 1000).toFixed(0), 'mA')}
        ${stat(L('Alarm current', 'تيار الإنذار'), alarmA.toFixed(2), 'A')}
        ${stat(L('Battery (24 h + 5 min)', 'البطارية (24 س + 5 د)'), bc.ah.toFixed(1), `Ah → 2×12V ${bc.pick}Ah`)}
      </div>
      <div class="adv-grid c2">
        <div class="card"><h3>🧮 ${L('PANEL SETTINGS', 'إعدادات اللوحة')}</h3>
          <label class="facp-sysrow"><span>${L('Alarm verification (smoke detectors)', 'التحقق من الإنذار (كواشف الدخان)')}</span><input type="checkbox" id="pVer" ${sys.settings.verification ? 'checked' : ''}/></label>
          <div class="adv-range"><div class="lbl">${L('Pre-alarm threshold', 'حد الإنذار المبكر')} <b id="pPreV">${Math.round(sys.settings.preAlarm * 100)} %</b></div><input type="range" id="pPre" min="0.4" max="0.95" step="0.05" value="${sys.settings.preAlarm}"/></div>
          <div class="adv-range" style="margin-top:8px"><div class="lbl">${L('Waterflow retard (s)', 'تأخير تدفق المياه (ث)')} <b id="pFlowV">${sys.settings.flowRetard} s</b></div><input type="range" id="pFlow" min="0" max="90" step="5" value="${sys.settings.flowRetard}"/></div>
          <p class="adv-note" style="margin-top:10px">${L('Alarm verification: the panel resets a smoke detector on its first alarm and confirms the fire only if it is still in alarm within the confirmation period (NFPA 72 §23.8.5.4.1, max 60 s). Waterflow retard prevents alarms from pressure surges (max 90 s, NFPA 72 §17.13.2).', 'التحقق من الإنذار: تعيد اللوحة ضبط كاشف الدخان عند أول إنذار ولا تؤكد الحريق إلا إذا بقي في حالة إنذار خلال فترة التأكيد (NFPA 72 §23.8.5.4.1، بحد أقصى 60 ثانية). تأخير التدفق يمنع الإنذارات الكاذبة من تذبذب الضغط (بحد أقصى 90 ثانية).')}</p>
        </div>
        <div class="card"><h3>📥 ${L('AUTO-LEARN & CONFIGURATION', 'التعلّم التلقائي والتهيئة')}</h3>
          <p class="adv-note">${L('After installing or replacing devices the panel must learn the loop: it polls every address, records the device type and compares it with the drawings. Devices found but not programmed show "Unprogrammed"; programmed but silent addresses show "No answer".', 'بعد تركيب الأجهزة أو استبدالها يجب أن تتعلّم اللوحة الحلقة: تستعلم عن كل عنوان وتسجل نوع الجهاز وتقارنه بالمخططات. الأجهزة الموجودة غير المبرمجة تظهر "غير مبرمج"، والعناوين المبرمجة التي لا ترد تظهر "لا استجابة".')}</p>
          <div class="adv-btns"><button class="btn primary" id="pLearn">📥 ${L('Run auto-learn', 'تشغيل التعلّم التلقائي')}</button><span class="adv-pill ${sys.count('trouble') ? 'warn' : 'ok'}">${sys.count('trouble')} ${L('troubles', 'أعطال')}</span></div>
        </div>
      </div>
      <div class="card" style="margin-top:12px"><h3>📋 ${L('DEVICE PROGRAMMING TABLE', 'جدول برمجة الأجهزة')}</h3>
        <div class="adv-scroll"><table class="adv-table">
          <tr><th class="num">${L('Address', 'العنوان')}</th><th>${L('Installed type', 'النوع المركّب')}</th><th>${L('Programmed type', 'النوع المبرمج')}</th><th>${L('Location label', 'وصف الموقع')}</th><th>${L('Floor', 'الطابق')}</th><th>${L('Zone', 'المنطقة')}</th><th>${L('Status', 'الحالة')}</th></tr>
          ${rows.map((d) => {
            const cfg = sys.config[d.addr];
            const st = !d.comm ? ['bad', L('No answer', 'لا استجابة')] : d.dup ? ['bad', L('Double address', 'عنوان مكرر')] : !cfg ? ['warn', L('Unprogrammed', 'غير مبرمج')] : cfg.type !== d.type ? ['bad', L('Type mismatch', 'نوع غير مطابق')] : d.disabled ? ['info', L('Disabled', 'معطّل')] : ['ok', L('OK', 'سليم')];
            return `<tr><td class="num">L1D${pad3(d.addr)}</td><td>${esc(tr(DEVICE_TYPES[d.type].name))}</td><td>${cfg ? esc(tr(DEVICE_TYPES[cfg.type]?.name || cfg.type)) : '—'}</td>
              <td><input type="text" data-lbl="${d.id}" value="${esc(tr(d.label))}" style="width:100%"/></td><td>${d.floor}</td>
              <td><input type="text" data-zone="${d.id}" value="${esc(d.zone)}" style="width:80px"/></td><td><span class="adv-pill ${st[0]}">${st[1]}</span></td></tr>`;
          }).join('')}
        </table></div></div>`;
    body.querySelector('#pVer').onchange = (e) => { sys.settings.verification = e.target.checked; sys.evaluate(); };
    body.querySelector('#pPre').oninput = (e) => { sys.settings.preAlarm = +e.target.value; body.querySelector('#pPreV').textContent = `${Math.round(sys.settings.preAlarm * 100)} %`; };
    body.querySelector('#pFlow').oninput = (e) => { sys.settings.flowRetard = +e.target.value; body.querySelector('#pFlowV').textContent = `${sys.settings.flowRetard} s`; };
    body.querySelector('#pLearn').onclick = () => { sys.autolearn(); renderProgram(body); };
    body.querySelectorAll('[data-lbl]').forEach((i) => { i.onchange = () => { const d = sys.dev(i.dataset.lbl); d.label = { en: i.value, ar: i.value }; sys.evaluate(); }; });
    body.querySelectorAll('[data-zone]').forEach((i) => { i.onchange = () => { sys.dev(i.dataset.zone).zone = i.value.trim() || 'Z'; sys.evaluate(); }; });
  }

  // ── guided exercises
  function renderEx(body) {
    const since = store.get('facpExSince', 0);
    const h = sys.history.filter((x) => x.t >= since);
    const done = store.get('facpExDone', {});
    for (const x of EXERCISES) if (!done[x.id] && x.check(h, sys)) done[x.id] = true;
    store.set('facpExDone', done);
    const n = EXERCISES.filter((x) => done[x.id]).length;
    const score = Math.round((100 * n) / EXERCISES.length);
    if (n) markDone('facp', score);
    body.innerHTML = `${scoreBanner(score, `<b>${n} / ${EXERCISES.length}</b> ${L('exercises completed. Do them on the Live panel tab — completion is detected automatically from the panel event history.', 'تمارين مكتملة. نفّذها في تبويب اللوحة المباشرة — يتم اكتشاف الإكمال تلقائياً من سجل أحداث اللوحة.')}`)}
      <div class="facp-ex">${EXERCISES.map((x, i) => `<div class="facp-ex-i ${done[x.id] ? 'done' : ''}"><span class="n">${done[x.id] ? '✓' : i + 1}</span><span>${esc(tr(x.t))}</span></div>`).join('')}</div>
      <div class="adv-btns" style="margin-top:12px"><button class="btn primary" id="exGo">🎛️ ${L('Go to the live panel', 'الذهاب إلى اللوحة المباشرة')}</button><button class="btn" id="exReset">↺ ${L('Restart exercises', 'إعادة التمارين')}</button></div>`;
    body.querySelector('#exGo').onclick = () => { ui.tab = 'live'; store.set('facpTab', 'live'); frame(); };
    body.querySelector('#exReset').onclick = () => { store.set('facpExDone', {}); store.set('facpExSince', sys.time); renderEx(body); };
  }

  // ── inspector challenge
  function renderInsp(body) {
    const ch = store.get('facpChallenge', null);
    if (!ch) {
      body.innerHTML = `<div class="adv-grid c2"><div class="card"><h3>🕵️ ${L('HIDDEN-FAULT INSPECTION', 'تفتيش الأعطال المخفية')}</h3>
        <p>${L('The system will be restored to the original project, then an "installer" leaves several hidden faults. Use the panel LCD, the event history, the loop wiring view and the device inspector to find them all. Then come back and report your findings.', 'سيتم استعادة المشروع الأصلي ثم يترك "المركّب" عدة أعطال مخفية. استخدم شاشة اللوحة وسجل الأحداث ومخطط التوصيل وفاحص الأجهزة لاكتشافها جميعاً، ثم عد وسجّل ما وجدته.')}</p>
        <div class="adv-form"><label class="adv-field">${L('Number of hidden faults', 'عدد الأعطال المخفية')}<select id="chN"><option>3</option><option selected>4</option><option>5</option><option>6</option></select></label></div>
        <div class="adv-btns" style="margin-top:12px"><button class="btn primary" id="chGo">▶ ${L('Start inspection', 'ابدأ التفتيش')}</button></div></div>
        <div class="card"><h3>🧭 ${L('HOW ENGINEERS DIAGNOSE', 'كيف يشخّص المهندسون')}</h3><ol class="facp-howto">
          <li>${L('Read every event on the LCD with ▲▼ — note the address (L1Dxxx) and the event type.', 'اقرأ كل حدث على الشاشة بالأزرار ▲▼ — دوّن العنوان (L1Dxxx) ونوع الحدث.')}</li>
          <li>${L('Troubles tell you WHAT: no answer, double address, wrong type, maintenance alert, earth fault, NAC open.', 'الأعطال تخبرك ما المشكلة: لا استجابة، عنوان مكرر، نوع خاطئ، تنبيه صيانة، تسرّب أرضي، دائرة إنذار مفتوحة.')}</li>
          <li>${L('The plan tells you WHERE: find the device, check its analog value, programmed type and loop position.', 'المخطط يخبرك أين: جد الجهاز وافحص قيمته التناظرية ونوعه المبرمج وموقعه على الحلقة.')}</li>
          <li>${L('Don\'t forget the disabled list and supervisory signals — a closed valve is not a trouble!', 'لا تنسَ قائمة الأجهزة المعطّلة والإشارات الإشرافية — الصمام المغلق ليس عطلاً!')}</li></ol></div></div>`;
      body.querySelector('#chGo').onclick = () => {
        ctx.resetProject();
        const planted = sys.plantFaults(+body.querySelector('#chN').value);
        store.set('facpChallenge', { planted, t0: Date.now() });
        ui.tab = 'live'; store.set('facpTab', 'live'); frame();
      };
      return;
    }
    const kinds = Object.keys(FAULT_KINDS);
    body.innerHTML = `<div class="card"><h3>📝 ${L('REPORT YOUR FINDINGS', 'سجّل ما وجدته')}<span class="r adv-pill info">⏱ ${Math.round((Date.now() - ch.t0) / 60000)} min</span></h3>
      <p class="muted">${L(`${ch.planted.length} faults were planted. Tick every fault you found and give the device address where it applies.`, `تم زرع ${ch.planted.length} أعطال. حدد كل عطل وجدته واكتب عنوان الجهاز حيث ينطبق.`)}</p>
      <div class="facp-find">${kinds.map((k) => `<label class="facp-find-i"><input type="checkbox" data-k="${k}"/> <span>${esc(tr(FAULT_KINDS[k]))}</span>
        ${['dirty', 'dead', 'dup', 'type', 'disabled', 'tamper'].includes(k) ? `<input type="number" min="1" max="159" placeholder="${L('address', 'العنوان')}" data-a="${k}"/>` : ''}</label>`).join('')}</div>
      <div class="adv-btns" style="margin-top:12px"><button class="btn primary" id="chSubmit">✔ ${L('Submit report', 'إرسال التقرير')}</button><button class="btn" id="chLive">🎛️ ${L('Back to the panel', 'العودة إلى اللوحة')}</button><button class="btn ghost" id="chQuit">✕ ${L('Abandon', 'إلغاء')}</button></div>
      <div id="chRes"></div></div>`;
    body.querySelector('#chLive').onclick = () => { ui.tab = 'live'; store.set('facpTab', 'live'); frame(); };
    body.querySelector('#chQuit').onclick = () => { store.set('facpChallenge', null); ctx.resetProject(); renderInsp(body); };
    body.querySelector('#chSubmit').onclick = () => {
      const got = {};
      body.querySelectorAll('[data-k]').forEach((c) => { if (c.checked) got[c.dataset.k] = +(body.querySelector(`[data-a="${c.dataset.k}"]`)?.value || 0) || null; });
      let pts = 0, max = 0;
      const lines = ch.planted.map((p) => {
        max += p.addr ? 2 : 1;
        const found = p.kind in got;
        const addrOk = !p.addr || got[p.kind] === p.addr;
        pts += found ? 1 : 0; pts += found && p.addr && addrOk ? 1 : 0;
        return `<div class="adv-finding ${found && addrOk ? 'ok' : found ? 'warn' : 'error'}"><span class="ic">${found && addrOk ? '✅' : found ? '🟠' : '❌'}</span><span>${esc(tr(FAULT_KINDS[p.kind]))}${p.addr ? ` — L1D${pad3(p.addr)}` : ''}${found && !addrOk ? ` (${L('wrong address', 'عنوان خاطئ')}: ${got[p.kind] ?? '—'})` : ''}</span></div>`;
      });
      const falsePos = Object.keys(got).filter((k) => !ch.planted.some((p) => p.kind === k));
      pts = Math.max(0, pts - falsePos.length);
      const score = Math.round((100 * pts) / max);
      markDone('facp', score);
      ctx.helpers.recordResult?.({ type: 'lab', topic: 'facp/inspector', score: pts, total: max });
      body.querySelector('#chRes').innerHTML = scoreBanner(score, L('Inspection result', 'نتيجة التفتيش')) + `<div class="adv-findings">${lines.join('')}${falsePos.map((k) => `<div class="adv-finding warn"><span class="ic">⚠️</span><span>${L('Reported but not present', 'تم الإبلاغ عنه لكنه غير موجود')}: ${esc(tr(FAULT_KINDS[k]))}</span></div>`).join('')}</div>
        <div class="adv-btns" style="margin-top:10px"><button class="btn primary" id="chNew">↺ ${L('New inspection', 'تفتيش جديد')}</button></div>`;
      store.set('facpChallenge', null);
      body.querySelector('#chNew').onclick = () => { ctx.resetProject(); renderInsp(body); };
    };
  }

  // ── device encyclopedia with installation & wiring drawings
  function renderDevices(body) {
    body.innerHTML = `<div class="facp-devs">${DEVICE_CARDS.map((c) => `<div class="card facp-dev">
      <div class="facp-dev-art">${c.svg}</div>
      <div class="facp-dev-tx"><h3>${esc(tr(c.title))}</h3>
        <p>${esc(tr(c.how))}</p>
        <h4>🔧 ${L('Installation', 'التركيب')}</h4><ul>${c.install.map((x) => `<li>${esc(tr(x))}</li>`).join('')}</ul>
        <h4>🧪 ${L('Testing', 'الاختبار')}</h4><p>${esc(tr(c.test))}</p></div></div>`).join('')}</div>`;
  }

  frame();
  unsub = sys.on((type) => { if (type === 'denied') { ui.denied = Date.now(); setTimeout(() => { ui.denied = 0; }, 2500); } });
  let last = 0;
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (t - last < 220) return;
    last = t;
    const body = el.querySelector('#facpBody');
    if (body && ui.tab === 'live') update(body);
    beep(sys.buzzer && ui.tab === 'live');
  };
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); unsub?.(); beep(false); if (audio) { try { audio.ctx.close(); } catch { /* ignore */ } audio = null; } };
};

// ───────────────────────── device cards (drawings)
const term = (x, y, lbl) => `<g><rect x="${x - 7}" y="${y - 6}" width="14" height="12" rx="2" fill="#c9a23b" stroke="#8a6d1f"/><circle cx="${x}" cy="${y}" r="2.6" fill="#6b5313"/><text x="${x}" y="${y + 19}" font-size="9" text-anchor="middle" fill="#475569">${lbl}</text></g>`;
const DEVICE_CARDS = [
  {
    title: T('Addressable photoelectric smoke detector', 'كاشف دخان كهروضوئي معنون'),
    svg: `<svg viewBox="0 0 260 200"><defs><radialGradient id="dg1" cx=".4" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9dde2"/></radialGradient></defs>
      <rect x="10" y="10" width="240" height="18" fill="#e2e8f0"/><text x="130" y="23" font-size="10" text-anchor="middle" fill="#64748b">CEILING</text>
      <ellipse cx="130" cy="38" rx="70" ry="10" fill="#cbd5e1"/><rect x="60" y="28" width="140" height="18" rx="4" fill="#e5e7eb" stroke="#94a3b8"/>
      <path d="M68 46 Q130 118 192 46 Z" fill="url(#dg1)" stroke="#94a3b8"/><circle cx="130" cy="72" r="18" fill="#f8fafc" stroke="#cbd5e1"/>
      <g stroke="#94a3b8">${Array.from({ length: 10 }, (_, i) => `<line x1="${86 + i * 10}" y1="60" x2="${86 + i * 10}" y2="66"/>`).join('')}</g>
      <circle cx="165" cy="60" r="4" fill="#ef4444"><animate attributeName="opacity" values="1;.2;1" dur="1.5s" repeatCount="indefinite"/></circle>
      <g transform="translate(40 130)"><rect width="180" height="56" rx="8" fill="#0f172a"/><text x="90" y="16" font-size="10" fill="#93c5fd" text-anchor="middle">optical chamber</text>
      <rect x="18" y="26" width="20" height="10" rx="2" fill="#f59e0b"/><text x="28" y="50" font-size="8" fill="#cbd5e1" text-anchor="middle">IR LED</text>
      <rect x="140" y="30" width="20" height="10" rx="2" fill="#22c55e"/><text x="150" y="52" font-size="8" fill="#cbd5e1" text-anchor="middle">photodiode</text>
      <path d="M38 31 L100 31" stroke="#f59e0b" stroke-dasharray="4 3"/><circle cx="104" cy="31" r="5" fill="#9ca3af" opacity=".8"/><path d="M104 31 L140 35" stroke="#f59e0b" stroke-dasharray="4 3"/></g></svg>`,
    how: T('An IR LED and a photodiode sit at an angle in a dark labyrinth chamber. Clean air → no light reaches the photodiode. Smoke particles scatter the light onto it; the detector digitises the signal and reports an analog value to the panel every poll (the panel, not the head, decides pre-alarm / alarm and applies drift compensation).',
      'يوجد في حجرة مظلمة متاهية صمام ضوئي بالأشعة تحت الحمراء وثنائي ضوئي بزاوية. في الهواء النظيف لا يصل الضوء إلى الثنائي. جزيئات الدخان تشتت الضوء نحوه؛ فيحوّل الكاشف الإشارة رقمياً ويرسل قيمة تناظرية للوحة في كل استعلام (اللوحة هي التي تقرر الإنذار المبكر والإنذار وتعوّض الانجراف).'),
    install: [T('Mount the base on the ceiling, ≥ 0.9 m from supply-air diffusers and ≥ 0.1 m from walls (NFPA 72 §17.7.4.3).', 'ركّب القاعدة على السقف بعيداً ≥ 0.9 م عن فتحات التكييف و≥ 0.1 م عن الجدران.'),
      T('Spacing: 9.1 m nominal on smooth ceilings; every point within 0.7 × S (6.4 m) of a detector.', 'التباعد: 9.1 م اسمياً على الأسقف الملساء؛ كل نقطة ضمن 0.7 × S (6.4 م) من كاشف.'),
      T('Wire SLC IN (+/−) and OUT (+/−) to the base — never loop the conductor under one screw (T-tap free for Class A).', 'وصّل SLC دخول (+/−) وخروج (+/−) بالقاعدة — لا تجمع السلكين تحت برغي واحد (بدون تفرعات في الفئة A).'),
      T('Set the address with the rotary decade switches (e.g. 0-3-6 = 036) before fitting the head; keep the dust cover until commissioning.', 'اضبط العنوان بالمفاتيح الدوارة (مثلاً 0-3-6 = 036) قبل تركيب الرأس؛ اترك الغطاء الواقي حتى الاستلام.')],
    test: T('Functional test with listed aerosol smoke at the head; sensitivity measured by the panel within 1 year of installation, then every 2 years (NFPA 72 §14.4.4.3).', 'اختبار وظيفي ببخاخ دخان معتمد عند الرأس؛ تقيس اللوحة الحساسية خلال سنة من التركيب ثم كل سنتين.'),
  },
  {
    title: T('Short-circuit isolator', 'عازل دائرة القصر'),
    svg: `<svg viewBox="0 0 260 200"><rect x="70" y="40" width="120" height="90" rx="10" fill="#f1f5f9" stroke="#64748b"/><text x="130" y="62" font-size="12" text-anchor="middle" font-weight="700" fill="#0f172a">ISOLATOR</text>
      <path d="M20 100 L90 100" stroke="#d7263d" stroke-width="4"/><path d="M170 100 L240 100" stroke="#d7263d" stroke-width="4"/>
      <g transform="translate(130 100)"><rect x="-26" y="-12" width="52" height="24" rx="4" fill="#fff" stroke="#94a3b8"/><path d="M-20 0 L-6 0 L8 -9" stroke="#0f172a" stroke-width="2.5" fill="none"><animate attributeName="d" values="M-20 0 L-6 0 L8 -9;M-20 0 L-6 0 L8 -9;M-20 0 L-6 0 L20 0;M-20 0 L-6 0 L20 0" dur="3s" repeatCount="indefinite"/></path><circle cx="20" cy="0" r="2.5" fill="#0f172a"/></g>
      <circle cx="165" cy="118" r="4" fill="#f59e0b"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></circle>
      ${term(95, 150, 'IN +/−')}${term(165, 150, 'OUT +/−')}<text x="130" y="30" font-size="10" text-anchor="middle" fill="#64748b">opens when it sees a short, re-closes when cleared</text></svg>`,
    how: T('Monitors the loop voltage. When a short pulls the line down, the isolators on both sides of the fault open within milliseconds; the panel then feeds the healthy parts from both ends (Class A), losing only the section between the two isolators.', 'يراقب جهد الحلقة. عندما يخفض القصر الجهد يفتح العازلان على جانبي العطل خلال أجزاء من الثانية؛ ثم تغذي اللوحة الأجزاء السليمة من الطرفين (الفئة A) فلا يُفقد إلا القسم بين العازلين.'),
    install: [T('One isolator at every floor / zone boundary and at most every 32 devices (typical manufacturer limit; NFPA 72 §12.3.6 for Class X/A pathways).', 'عازل عند حدود كل طابق/منطقة وبحد أقصى كل 32 جهازاً (الحد الشائع للمصنّعين).'),
      T('Many detector bases now contain a built-in isolator — count them in the loop calculation.', 'كثير من قواعد الكواشف فيها عازل مدمج — احسبه في حساب الحلقة.')],
    test: T('Apply a deliberate short between two isolators during commissioning and verify only that section reports "no answer".', 'اعمل قصراً متعمداً بين عازلين أثناء الاستلام وتأكد أن ذلك القسم فقط يظهر "لا استجابة".'),
  },
  {
    title: T('Monitor module (waterflow / tamper) with EOL', 'وحدة مراقبة (تدفق / عبث) مع مقاومة نهاية الخط'),
    svg: `<svg viewBox="0 0 260 200"><rect x="30" y="30" width="110" height="90" rx="8" fill="#eef2ff" stroke="#6366f1"/><text x="85" y="52" font-size="11" text-anchor="middle" font-weight="700" fill="#312e81">MONITOR</text><text x="85" y="66" font-size="9" text-anchor="middle" fill="#4338ca">MODULE · L1D020</text>
      ${term(55, 100, 'SLC')}${term(115, 100, 'IDC')}
      <path d="M122 100 L200 100 L200 60" stroke="#1d4ed8" stroke-width="2.5" fill="none"/><path d="M122 110 L220 110 L220 60" stroke="#1d4ed8" stroke-width="2.5" fill="none"/>
      <rect x="190" y="40" width="40" height="22" rx="4" fill="#fff" stroke="#1d4ed8"/><text x="210" y="55" font-size="9" text-anchor="middle">FLOW SW</text>
      <g transform="translate(210 150)"><rect x="-22" y="-7" width="44" height="14" rx="3" fill="#fde68a" stroke="#b45309"/><text y="4" font-size="8" text-anchor="middle">EOL 47 kΩ</text></g>
      <path d="M200 100 L200 150 L188 150" stroke="#1d4ed8" stroke-width="2" fill="none"/><path d="M220 110 L240 110 L240 150 L232 150" stroke="#1d4ed8" stroke-width="2" fill="none"/></svg>`,
    how: T('Gives an address to a dry contact (waterflow paddle switch, valve tamper, pressure switch). The initiating circuit (IDC) is supervised by an end-of-line resistor: normal = EOL current, contact closed = alarm/supervisory, open cable = trouble.', 'تعطي عنواناً لتلامس جاف (مفتاح تدفق، عبث صمام، مفتاح ضغط). دائرة الإدخال مراقبة بمقاومة نهاية الخط: طبيعي = تيار المقاومة، تلامس مغلق = إنذار/إشرافي، كابل مقطوع = عطل.'),
    install: [T('EOL resistor at the LAST device on the IDC — never inside the module, otherwise the cable is not supervised.', 'مقاومة نهاية الخط عند آخر جهاز على الدائرة — وليس داخل الوحدة، وإلا فلن يكون الكابل مراقباً.'),
      T('Program waterflow as FIRE with a retard ≤ 90 s; program tamper as SUPERVISORY (non-latching).', 'برمج التدفق كحريق مع تأخير ≤ 90 ث؛ وبرمج العبث كإشرافي (غير ثابت).')],
    test: T("Waterflow: open the inspector's test valve — alarm within 90 s (NFPA 72 Table 14.4.3.2). Tamper: signal within 2 turns of the valve handwheel or 1/5 of travel.", 'التدفق: افتح صمام اختبار المفتش — إنذار خلال 90 ث. العبث: إشارة خلال لفتين من عجلة الصمام أو 1/5 المشوار.'),
  },
  {
    title: T('Control module (relay) & horn/strobe NAC', 'وحدة التحكم (ريليه) ودائرة الأبواق والوميض'),
    svg: `<svg viewBox="0 0 260 200"><rect x="20" y="30" width="100" height="80" rx="8" fill="#ecfdf5" stroke="#059669"/><text x="70" y="52" font-size="11" text-anchor="middle" font-weight="700" fill="#064e3b">CONTROL</text><text x="70" y="66" font-size="9" text-anchor="middle" fill="#047857">RELAY · C / NO / NC</text>
      ${term(45, 92, 'SLC')}${term(95, 92, 'C NO NC')}<path d="M102 92 L170 92" stroke="#059669" stroke-width="2.5"/><rect x="170" y="78" width="70" height="28" rx="4" fill="#fff" stroke="#059669"/><text x="205" y="96" font-size="9" text-anchor="middle">AHU STOP</text>
      <g transform="translate(70 160)"><rect x="-26" y="-20" width="52" height="40" rx="6" fill="#dc2626"/><path d="M-14 -8 L2 -14 L2 14 L-14 8 Z" fill="#fff"/><rect x="8" y="-10" width="12" height="20" rx="3" fill="#fef3c7"><animate attributeName="fill" values="#fef3c7;#fff;#fef3c7" dur=".6s" repeatCount="indefinite"/></rect></g>
      <text x="170" y="150" font-size="10" fill="#475569">NAC 24 V DC · polarity</text><text x="170" y="166" font-size="10" fill="#475569">reversal supervision</text></svg>`,
    how: T('Control modules switch building equipment through dry relay contacts (AHU stop, damper, door holder, lift recall). NAC circuits power horn/strobes; in standby the panel supervises them with reverse polarity through an EOL resistor, in alarm it reverses polarity and powers the appliances.', 'وحدات التحكم تشغّل معدات المبنى عبر تلامسات ريليه جافة (إيقاف المكيف، الخانق، ماسك الباب، استدعاء المصعد). دوائر الإنذار تغذي الأبواق والوميض؛ في الاستعداد تراقبها اللوحة بقطبية معكوسة عبر مقاومة نهاية الخط، وعند الإنذار تعكس القطبية فتعمل الأجهزة.'),
    install: [T('Mount the relay within 0.9 m (3 ft) of the controlled equipment and supervise the wiring between them (NFPA 72 §21.2.4).', 'ركّب وحدة الريليه ضمن 0.9 م من المعدات المتحكم بها وراقب التوصيلات بينهما.'),
      T('Horn/strobes: wall-mounted 2.03–2.44 m AFF; synchronised strobes when more than 2 are in view (NFPA 72 §18.5.5).', 'الأبواق/الوميض: على الجدار بارتفاع 2.03–2.44 م؛ وميض متزامن إذا ظهر أكثر من اثنين في مجال الرؤية.')],
    test: T('Verify each controlled function operates (AHU actually stops, dampers close, lift recalls); measure sound level ≥ 15 dB above ambient.', 'تحقق من عمل كل وظيفة متحكم بها (توقف المكيف فعلاً، إغلاق الخوانق، استدعاء المصعد)؛ وقس مستوى الصوت ≥ 15 ديسيبل فوق المحيط.'),
  },
];

export default m;
