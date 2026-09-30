// Smart fire-alarm system engine (pure logic, no DOM): an addressable FACP with one SLC loop
// (Class A/B, isolators, open/short/earth faults, addressing and programming), two NAC circuits,
// power supply & batteries, event handling (FIRE / PRE-ALARM / SUPERVISORY / TROUBLE / DISABLE,
// ACK / SILENCE / RESET / DRILL), a programmable cause-and-effect matrix and the building outputs
// it drives (AHU, dampers, stair fans, lift recall, door holders, access control, FM-200, voice
// evacuation, remote monitoring with Contact-ID reports and BACnet/Modbus points for the BMS).
import { FLOORS, DEVICE_TYPES, defaultDevices, defaultNac } from './building.js';

const T = (en, ar) => ({ en, ar });
const pad3 = (n) => String(n).padStart(3, '0');

// ───────────────────────── cause & effect definitions
export const CAUSES = [
  { id: 'anyFire', name: T('Any fire alarm (detector, call point or waterflow)', 'أي إنذار حريق (كاشف أو زر يدوي أو تدفق مياه)') },
  { id: 'fireG', name: T('Fire alarm – ground floor', 'إنذار حريق – الطابق الأرضي') },
  { id: 'fire1', name: T('Fire alarm – first floor', 'إنذار حريق – الطابق الأول') },
  { id: 'fire2', name: T('Fire alarm – second floor', 'إنذار حريق – الطابق الثاني') },
  { id: 'lobbyG', name: T('Lift-lobby detector – ground (recall floor)', 'كاشف ردهة المصعد – الأرضي (طابق الاستدعاء)') },
  { id: 'lobbyUp', name: T('Lift-lobby detector – upper floors', 'كاشف ردهة المصعد – الطوابق العليا') },
  { id: 'srOne', name: T('Server room – ONE detector zone', 'غرفة الخوادم – منطقة كشف واحدة') },
  { id: 'srBoth', name: T('Server room – BOTH zones (cross-zoned)', 'غرفة الخوادم – المنطقتان معاً (كشف متقاطع)') },
  { id: 'flow', name: T('Sprinkler waterflow', 'تدفق مياه الرشاشات') },
  { id: 'super', name: T('Supervisory (valve tamper)', 'إشرافي (عبث صمام)') },
  { id: 'trouble', name: T('System trouble', 'عطل في النظام') },
];

export const EFFECTS = [
  { id: 'sounders', short: T('Sounders', 'الأبواق'), name: T('Horn/strobes – general alarm', 'الأبواق والوميض – إنذار عام') },
  { id: 'voice', short: T('Voice evac', 'إخلاء صوتي'), name: T('Voice evacuation – phased (fire floor + above: EVAC, others: ALERT)', 'إخلاء صوتي مرحلي (طابق الحريق والذي فوقه: إخلاء، الباقي: تنبيه)') },
  { id: 'ahu', short: T('AHU off', 'إيقاف المكيفات'), name: T('AHU shutdown (NFPA 90A)', 'إيقاف وحدات مناولة الهواء (NFPA 90A)') },
  { id: 'dampers', short: T('Dampers', 'الخوانق'), name: T('Smoke / fire dampers close', 'إغلاق خوانق الدخان والحريق') },
  { id: 'stairFans', short: T('Stair fans', 'مراوح الدرج'), name: T('Stair pressurization fans start', 'تشغيل مراوح ضغط الدرج') },
  { id: 'liftPrimary', short: T('Lift → G', 'المصعد ← G'), name: T('Lift Phase I recall to primary floor (G)', 'استدعاء المصعد المرحلة الأولى إلى الطابق الرئيسي (G)') },
  { id: 'liftAlt', short: T('Lift → 1', 'المصعد ← 1'), name: T('Lift Phase I recall to alternate floor (1)', 'استدعاء المصعد إلى الطابق البديل (1)') },
  { id: 'doors', short: T('Door holders', 'ماسكات الأبواب'), name: T('Release magnetic door holders (fire doors close)', 'تحرير ماسكات الأبواب المغناطيسية (إغلاق أبواب الحريق)') },
  { id: 'access', short: T('Access unlock', 'فتح الأبواب'), name: T('Access control – unlock egress doors (fail-safe)', 'التحكم بالدخول – فتح أبواب الخروج') },
  { id: 'fmPre', short: T('FM-200 pre-alarm', 'إنذار FM-200'), name: T('FM-200 pre-discharge alarm (server room)', 'إنذار ما قبل تفريغ FM-200 (غرفة الخوادم)') },
  { id: 'fmRelease', short: T('FM-200 release', 'تفريغ FM-200'), name: T('FM-200 release (solenoid)', 'تفريغ FM-200 (الملف اللولبي)') },
  { id: 'remote', short: T('Civil Defense', 'الدفاع المدني'), name: T('Signal to Civil Defense / monitoring centre', 'إرسال إشارة للدفاع المدني / مركز المراقبة') },
  { id: 'bms', short: T('BMS alert', 'تنبيه BMS'), name: T('Alert on the BMS workstation', 'تنبيه على محطة نظام إدارة المبنى') },
];

/** Cell values: 0 = none, 1 = activate, 2 = activate after a 30 s delay. */
export const DELAY_S = 30;

export function typicalMatrix() {
  const m = {};
  for (const c of CAUSES) m[c.id] = {};
  const set = (c, list, v = 1) => list.forEach((e) => { m[c][e] = v; });
  set('anyFire', ['voice', 'ahu', 'dampers', 'stairFans', 'doors', 'access', 'remote', 'bms']);
  set('lobbyUp', ['liftPrimary']);
  set('lobbyG', ['liftAlt']);
  set('srOne', ['fmPre']);
  set('srBoth', ['fmPre', 'ahu', 'dampers']);
  set('srBoth', ['fmRelease'], 2);
  set('flow', ['sounders', 'remote', 'bms']);
  set('super', ['remote', 'bms']);
  set('trouble', ['remote', 'bms']);
  return m;
}
export function emptyMatrix() { const m = {}; for (const c of CAUSES) m[c.id] = {}; return m; }

/**
 * Check a C&E matrix against code requirements and good practice.
 * Returns { score (0-100), findings: [{level:'error'|'warn'|'ok', text:{en,ar}, ref}] }.
 */
export function gradeMatrix(m) {
  const f = [];
  const v = (c, e) => m[c]?.[e] || 0;
  const need = (c, e, text, ref, allowDelay = true) => {
    const x = v(c, e);
    if (!x || (!allowDelay && x === 2)) f.push({ level: 'error', text, ref }); else f.push({ level: 'ok', text, ref });
  };
  const never = (c, e, text, ref) => { if (v(c, e)) f.push({ level: 'error', text, ref }); };
  const warn = (cond, text, ref) => { if (cond) f.push({ level: 'warn', text, ref }); };
  const anyFireRow = (e) => v('anyFire', e) || (v('fireG', e) && v('fire1', e) && v('fire2', e));
  // occupant notification
  if (!(anyFireRow('sounders') || anyFireRow('voice'))) f.push({ level: 'error', text: T('A fire alarm must notify occupants (sounders or voice evacuation).', 'يجب أن ينبّه إنذار الحريق الشاغلين (أبواق أو إخلاء صوتي).'), ref: 'NFPA 72 §18.1' });
  else f.push({ level: 'ok', text: T('Occupant notification on fire alarm.', 'تنبيه الشاغلين عند إنذار الحريق.'), ref: 'NFPA 72 §18.1' });
  if (!anyFireRow('remote')) f.push({ level: 'error', text: T('Fire alarms must be transmitted to the monitoring station / Civil Defense.', 'يجب إرسال إنذارات الحريق إلى مركز المراقبة / الدفاع المدني.'), ref: 'NFPA 72 §26.1' });
  else f.push({ level: 'ok', text: T('Fire alarm transmitted off-site.', 'إرسال إنذار الحريق خارج الموقع.'), ref: 'NFPA 72 §26.1' });
  if (!anyFireRow('ahu')) f.push({ level: 'error', text: T('Air-handling units must shut down on fire alarm to stop smoke spreading.', 'يجب إيقاف وحدات مناولة الهواء عند إنذار الحريق لمنع انتشار الدخان.'), ref: 'NFPA 90A §6.4' });
  else f.push({ level: 'ok', text: T('AHU shutdown on fire alarm.', 'إيقاف المكيفات عند الإنذار.'), ref: 'NFPA 90A §6.4' });
  if (!anyFireRow('doors')) f.push({ level: 'error', text: T('Door holders must release so fire/smoke doors close.', 'يجب تحرير ماسكات الأبواب لتُغلق أبواب الحريق.'), ref: 'NFPA 72 §21.8' });
  else f.push({ level: 'ok', text: T('Door holders release.', 'تحرير ماسكات الأبواب.'), ref: 'NFPA 72 §21.8' });
  if (!anyFireRow('access')) f.push({ level: 'error', text: T('Electrically locked egress doors must unlock on fire alarm.', 'يجب فتح أبواب الخروج المقفلة كهربائياً عند الإنذار.'), ref: 'NFPA 101 §7.2.1.6' });
  else f.push({ level: 'ok', text: T('Egress doors unlock.', 'فتح أبواب الخروج.'), ref: 'NFPA 101 §7.2.1.6' });
  if (!anyFireRow('stairFans')) f.push({ level: 'warn', text: T('Stair pressurization should start on fire alarm (NFPA 92 system in this building).', 'يجب تشغيل ضغط الدرج عند الإنذار (المبنى مزوّد بنظام NFPA 92).'), ref: 'NFPA 92 §4.4' });
  if (!anyFireRow('dampers')) f.push({ level: 'warn', text: T('Smoke dampers should close with the AHU shutdown.', 'يجب إغلاق خوانق الدخان مع إيقاف المكيفات.'), ref: 'NFPA 90A §6.4' });
  // lift recall
  need('lobbyUp', 'liftPrimary', T('Lift-lobby detector on an upper floor → recall to the primary floor.', 'كاشف ردهة المصعد في طابق علوي ← استدعاء إلى الطابق الرئيسي.'), 'NFPA 72 §21.3.14 / ASME A17.1', false);
  need('lobbyG', 'liftAlt', T('Detector in the primary-floor lobby → recall to the ALTERNATE floor.', 'كاشف ردهة الطابق الرئيسي ← الاستدعاء إلى الطابق البديل.'), 'NFPA 72 §21.3.14.2', false);
  never('lobbyG', 'liftPrimary', T('Never recall the lift to the floor where the lobby detector is in alarm.', 'لا تستدعِ المصعد أبداً إلى الطابق الذي فيه كاشف الردهة في حالة إنذار.'), 'NFPA 72 §21.3.14.2');
  warn(v('anyFire', 'liftPrimary') || v('anyFire', 'liftAlt'), T('Recall is initiated only by lift lobby, shaft and machine-room detectors — not by every building alarm.', 'يُفعَّل الاستدعاء بكواشف ردهة المصعد والبئر وغرفة المحركات فقط، وليس بكل إنذار في المبنى.'), 'NFPA 72 §21.3.3');
  // clean agent
  never('srOne', 'fmRelease', T('CRITICAL: FM-200 must NOT be released by a single detector — use cross-zoning.', 'خطأ حرج: لا يُطلق FM-200 بكاشف واحد، استخدم الكشف المتقاطع.'), 'NFPA 2001 §4.3.4 / NFPA 72 §23.8.5.4.3');
  never('anyFire', 'fmRelease', T('CRITICAL: a general building alarm must not release the server-room agent.', 'خطأ حرج: إنذار المبنى العام لا يجب أن يُطلق مادة غرفة الخوادم.'), 'NFPA 2001 §4.3.4');
  need('srOne', 'fmPre', T('First server-room zone → pre-discharge alarm (warn occupants).', 'المنطقة الأولى في غرفة الخوادم ← إنذار ما قبل التفريغ.'), 'NFPA 2001 §4.3.5');
  need('srBoth', 'fmRelease', T('Both server-room zones → release FM-200.', 'المنطقتان معاً ← تفريغ FM-200.'), 'NFPA 2001 §4.3.4');
  warn(v('srBoth', 'fmRelease') === 1, T('Add a time delay (≈ 30 s) before discharge so people can leave and the abort switch can be used.', 'أضف تأخيراً (≈ 30 ثانية) قبل التفريغ ليتمكن الأشخاص من المغادرة واستخدام زر الإيقاف.'), 'NFPA 2001 §4.3.5.1');
  if (!(v('srBoth', 'ahu') || anyFireRow('ahu')) || !(v('srBoth', 'dampers') || anyFireRow('dampers'))) f.push({ level: 'error', text: T('HVAC must shut down and dampers close before the agent discharges (keep the concentration).', 'يجب إيقاف التكييف وإغلاق الخوانق قبل تفريغ المادة للحفاظ على التركيز.'), ref: 'NFPA 2001 §5.3.5' });
  // waterflow & supervisory
  if (!(v('flow', 'sounders') || v('flow', 'voice') || anyFireRow('sounders') || anyFireRow('voice'))) f.push({ level: 'error', text: T('Waterflow must sound the alarm.', 'يجب أن يُطلق تدفق المياه الإنذار.'), ref: 'NFPA 72 §17.13 / NFPA 13 §16.11' });
  if (!(v('flow', 'remote') || anyFireRow('remote'))) f.push({ level: 'error', text: T('Waterflow must be transmitted to the monitoring station.', 'يجب إرسال إشارة تدفق المياه لمركز المراقبة.'), ref: 'NFPA 72 §26.2' });
  never('super', 'sounders', T('Supervisory signals must NOT evacuate the building.', 'الإشارات الإشرافية لا يجب أن تُخلي المبنى.'), 'NFPA 72 §10.14');
  never('super', 'voice', T('Supervisory signals must NOT start voice evacuation.', 'الإشارات الإشرافية لا يجب أن تبدأ الإخلاء الصوتي.'), 'NFPA 72 §10.14');
  need('super', 'remote', T('Supervisory (closed valve) must be reported to the monitoring station.', 'يجب إبلاغ مركز المراقبة بالإشارة الإشرافية (صمام مغلق).'), 'NFPA 72 §26.2');
  never('trouble', 'sounders', T('Trouble signals must not sound the evacuation alarm.', 'إشارات الأعطال لا يجب أن تُطلق إنذار الإخلاء.'), 'NFPA 72 §10.15');
  never('trouble', 'voice', T('Trouble signals must not start voice evacuation.', 'إشارات الأعطال لا يجب أن تبدأ الإخلاء الصوتي.'), 'NFPA 72 §10.15');
  if (!v('trouble', 'remote')) f.push({ level: 'warn', text: T('Trouble signals should also be transmitted to the supervising station.', 'يجب إرسال إشارات الأعطال أيضاً إلى مركز المراقبة.'), ref: 'NFPA 72 §26.6' });
  never('trouble', 'fmRelease', T('CRITICAL: a trouble must never release the agent.', 'خطأ حرج: العطل لا يجب أن يُطلق المادة أبداً.'), 'NFPA 2001');
  const errors = f.filter((x) => x.level === 'error').length, warns = f.filter((x) => x.level === 'warn').length, ok = f.filter((x) => x.level === 'ok').length;
  const score = Math.max(0, Math.round((100 * ok) / Math.max(1, ok + errors) - warns * 4));
  return { score, errors, warns, findings: f.sort((a, b) => ({ error: 0, warn: 1, ok: 2 }[a.level] - { error: 0, warn: 1, ok: 2 }[b.level])) };
}

// ───────────────────────── Contact-ID codes (SIA DC-05) used by the monitoring-centre receiver
export const CID = {
  fire: 110, mcp: 115, flow: 113, super: 200, tamperSprinkler: 203, trouble: 300, ac: 301, lowBatt: 302,
  loop: 373, sensor: 380, ground: 310, nac: 321, disable: 570, drill: 601,
};

// ───────────────────────── the engine
export class FireSystem {
  constructor(saved) { this.listeners = new Set(); this.load(saved); }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(type, data) { for (const fn of this.listeners) fn(type, data); }

  load(saved) {
    const s = saved || {};
    this.devices = (s.devices || defaultDevices()).map((d) => ({ ...d }));
    this.nacDevices = s.nacDevices || defaultNac();
    this.config = s.config || this.learnConfig();
    this.loopClass = s.loopClass || 'A';
    this.matrix = s.matrix || typicalMatrix();
    this.settings = { verification: false, preAlarm: 0.7, flowRetard: 20, ...(s.settings || {}) };
    this.opens = new Set(s.opens || []);
    this.shorts = new Set(s.shorts || []);
    this.ground = !!s.ground;
    this.nacFaults = { NAC1: null, NAC2: null, ...(s.nacFaults || {}) };
    this.resetRuntime();
  }

  serialize() {
    const devices = this.devices.map(({ id, addr, order, type, floor, x, y, room, label, zone, dirt, disabled, fault }) => ({ id, addr, order, type, floor, x, y, room, label, zone, dirt, disabled, fault }));
    return {
      devices, nacDevices: this.nacDevices, config: this.config, loopClass: this.loopClass, matrix: this.matrix, settings: this.settings,
      opens: [...this.opens], shorts: [...this.shorts], ground: this.ground, nacFaults: this.nacFaults,
    };
  }

  resetRuntime() {
    this.time = 0;
    this.ac = true; this.battV = 27.3;
    this.events = new Map();         // active events (key → event)
    this.history = [];               // every transition, for logs / replay / reports
    this.silenced = false; this.drill = false; this.accessLevel = 1;
    this.causeT = {};                // cause id → time it became active
    this.fx = {};                    // latched effects: id → time activated
    this.cid = []; this.bacnet = [];
    this.lift = { pos: 0, target: 0, mode: 'normal', doors: 'closed', key: 'off', carCalls: [] };
    this.fm = { state: 'idle', t: 0, abort: false };
    this.lcdIdx = 0;
    this.lastPoints = {};
    for (const d of this.devices) Object.assign(d, { val: d.dirt * 0.15, temp: 24, test: null, latched: false, flowT: 0, verifyT: null, comm: true, dup: false, relayOn: false });
    this.evaluate();
  }

  // ── programming
  learnConfig() {
    const cfg = {};
    for (const d of this.devices) if (d.fault !== 'dead') cfg[d.addr] = { type: d.type, id: d.id };
    return cfg;
  }
  /** "Auto-learn": read the loop and store what answers as the programmed configuration. */
  autolearn() {
    const cfg = {};
    for (const d of this.devices) if (d.comm && d.fault !== 'dead' && !d.dup) cfg[d.addr] = { type: d.type, id: d.id };
    this.config = cfg;
    this.log('info', T('Auto-learn complete: ' + Object.keys(cfg).length + ' devices programmed', 'اكتمل التعلّم التلقائي: تمت برمجة ' + Object.keys(cfg).length + ' جهاز'));
    this.evaluate();
  }

  /** Loop topology: nodes 0 = panel OUT, 1..n = devices in cable order, n+1 = panel IN. */
  loopNodes() { return [...this.devices].sort((a, b) => a.order - b.order); }

  addDevice(d) {
    const order = Math.max(-1, ...this.devices.map((x) => x.order)) + 1;
    const addr = d.addr ?? (Math.max(0, ...this.devices.map((x) => x.addr)) + 1);
    const dev = { id: `d${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, addr, order, dirt: 0.05, disabled: false, fault: null, zone: `Z${d.floor}`, ...d };
    Object.assign(dev, { val: 0, temp: 24, test: null, latched: false, flowT: 0, verifyT: null, comm: true, dup: false, relayOn: false });
    this.devices.push(dev);
    this.evaluate();
    return dev;
  }
  removeDevice(id) {
    this.devices = this.devices.filter((d) => d.id !== id);
    this.loopNodes().forEach((d, i) => { d.order = i; });
    this.opens.clear(); this.shorts.clear();
    this.evaluate();
  }
  setAddr(id, addr) { const d = this.dev(id); if (d) { d.addr = Math.max(1, Math.min(159, Math.round(addr))); this.evaluate(); } }
  dev(id) { return this.devices.find((d) => d.id === id); }
  byAddr(a) { return this.devices.find((d) => d.addr === a); }

  // ── field actions
  test(id, kind) {
    const d = this.dev(id); if (!d) return;
    d.test = kind;
    if (d.type === 'mcp' && kind === 'mcp') d.latched = true;
    this.log('info', T(`Field test at ${pad3(d.addr)}: ${kind}`, `اختبار ميداني عند ${pad3(d.addr)}: ${kind}`), d);
  }
  endTest(id) { const d = this.dev(id); if (d) d.test = null; }
  resetMcp(id) { const d = this.dev(id); if (d) { d.latched = false; d.test = null; } }
  setDirt(id, v) { const d = this.dev(id); if (d) d.dirt = Math.max(0, Math.min(1.05, v)); }
  setFault(id, f) { const d = this.dev(id); if (d) { d.fault = f; this.evaluate(); } }
  setDisabled(id, b) { const d = this.dev(id); if (d && this.requireLevel2()) { d.disabled = b; this.log('info', T(`${b ? 'Disabled' : 'Enabled'} ${pad3(d.addr)}`, `${b ? 'تعطيل' : 'تمكين'} ${pad3(d.addr)}`), d); this.evaluate(); } }
  cut(seg) { this.opens.add(seg); this.evaluate(); }
  shortSeg(seg) { this.shorts.add(seg); this.evaluate(); }
  repair(seg) { this.opens.delete(seg); this.shorts.delete(seg); this.evaluate(); }
  repairAll() { this.opens.clear(); this.shorts.clear(); this.ground = false; this.nacFaults = { NAC1: null, NAC2: null }; for (const d of this.devices) { if (d.fault) d.fault = null; } this.evaluate(); }
  setGround(b) { this.ground = b; this.evaluate(); }
  setClass(c) { this.loopClass = c; this.evaluate(); }
  setNacFault(n, f) { this.nacFaults[n] = f; this.evaluate(); }
  setAC(b) { this.ac = b; this.evaluate(); }

  // ── panel keys
  requireLevel2() {
    if (this.accessLevel >= 2) return true;
    this.emit('denied');
    return false;
  }
  ack() { for (const e of this.events.values()) e.acked = true; this.log('info', T('Events acknowledged', 'تم الإقرار بالأحداث')); this.emit('change'); }
  silence() {
    if (!this.requireLevel2()) return;
    if (!this.count('fire') && !this.drill) return;
    this.silenced = true; this.drill = false;
    this.log('info', T('Alarm silenced', 'تم إسكات الإنذار')); this.emit('change');
  }
  resound() { this.silenced = false; this.emit('change'); }
  reset() {
    if (!this.requireLevel2()) return;
    for (const [k, e] of this.events) if (['fire', 'pre', 'super'].includes(e.kind)) this.events.delete(k);
    this.fx = {}; this.causeT = {}; this.silenced = false; this.drill = false;
    if (this.fm.state !== 'discharged') this.fm = { state: 'idle', t: 0, abort: false };
    if (this.lift.mode === 'recalled' || this.lift.mode === 'recalling') this.lift.mode = 'normal';
    for (const d of this.devices) { d.verifyT = null; d.flowT = 0; }
    this.log('info', T('System reset', 'إعادة ضبط النظام'));
    this.evaluate();
    this.emit('reset');
  }
  startDrill() { if (!this.requireLevel2()) return; this.drill = true; this.silenced = false; this.log('info', T('Evacuation drill started', 'بدء تمرين الإخلاء')); this.sendCid(1, CID.drill, 0); this.emit('change'); }

  // ── counts & views
  count(kind) { let n = 0; for (const e of this.events.values()) if (e.kind === kind) n++; return n; }
  sortedEvents() {
    const pr = { fire: 0, pre: 1, super: 2, trouble: 3, disable: 4 };
    return [...this.events.values()].sort((a, b) => pr[a.kind] - pr[b.kind] || a.t - b.t);
  }
  get buzzer() { for (const e of this.events.values()) if (!e.acked) return true; return false; }

  log(kind, text, dev, restore = false) {
    this.history.push({ t: this.time, kind, text, addr: dev?.addr ?? null, floor: dev?.floor ?? null, restore });
    if (this.history.length > 800) this.history.splice(0, this.history.length - 800);
  }

  // ── simulation
  step(dt) {
    this.time += dt;
    // field device physics
    for (const d of this.devices) {
      const base = d.dirt * 0.15;
      if (d.type === 'smoke' || d.type === 'multi') {
        const target = d.test === 'smoke' ? 1.35 : d.test === 'fire' ? 1.6 : base;
        d.val += (target - d.val) * Math.min(1, dt * (d.test ? 0.35 : 0.25));
      }
      if (d.type === 'heat' || d.type === 'multi') {
        const tt = d.test === 'heat' || d.test === 'fire' ? 75 : 24;
        d.temp += (tt - d.temp) * Math.min(1, dt * 0.12);
        if (d.type === 'heat') d.val = Math.max(0, (d.temp - 24) / (58 - 24));
        else d.val = Math.max(d.val, (d.temp - 24) / (58 - 24));
      }
      if (d.type === 'flow') d.flowT = d.test === 'flow' ? d.flowT + dt : 0;
    }
    // power
    if (!this.ac) this.battV = Math.max(19, this.battV - dt * (this.count('fire') ? 0.03 : 0.008));
    else this.battV = Math.min(27.3, this.battV + dt * 0.02);
    this.evaluate();
    this.runEffects(dt);
    this.bacnetScan();
  }

  /** Recompute loop communication and all active conditions, then diff against the event list. */
  evaluate() {
    const nodes = this.loopNodes();
    const n = nodes.length;
    // lost nodes due to shorts (isolators contain the fault)
    const lost = new Set();
    const isIso = (j) => j >= 1 && j <= n && nodes[j - 1].type === 'iso' && nodes[j - 1].fault !== 'dead';
    const isolated = [];
    for (const k of this.shorts) {
      let a = 0; for (let j = Math.min(k, n); j >= 1; j--) if (isIso(j)) { a = j; break; }
      let b = n + 1; for (let j = k + 1; j <= n; j++) if (isIso(j)) { b = j; break; }
      if (a === 0 && b === n + 1) { for (let j = 1; j <= n; j++) lost.add(j); }
      else for (let j = a + 1; j < b; j++) lost.add(j);
      if (a) isolated.push(nodes[a - 1]); if (b <= n) isolated.push(nodes[b - 1]);
      if (this.loopClass === 'B') for (let j = a + 1; j <= n; j++) lost.add(j);
    }
    // reachability through open segments
    const reach = new Set();
    const blocked = (seg) => this.opens.has(seg) || this.shorts.has(seg);
    for (let j = 1; j <= n; j++) { if (blocked(j - 1) || lost.has(j)) break; reach.add(j); }
    if (this.loopClass === 'A') for (let j = n; j >= 1; j--) { if (blocked(j) || lost.has(j)) break; reach.add(j); }
    nodes.forEach((d, i) => { d.comm = reach.has(i + 1) && d.fault !== 'dead'; });
    // duplicate addresses
    const byA = {};
    for (const d of this.devices) (byA[d.addr] ||= []).push(d);
    for (const d of this.devices) d.dup = byA[d.addr].length > 1;

    const cond = new Map();
    const add = (key, kind, text, dev) => cond.set(key, { key, kind, text, dev });
    const nm = (d) => `${pad3(d.addr)} ${d.floor}F ${d.label.en}`, nmA = (d) => `${pad3(d.addr)} ${d.floor}F ${d.label.ar}`;
    // loop troubles
    if (this.opens.size) add('trb:open', 'trouble', this.loopClass === 'A'
      ? T('SLC loop 1 open circuit – Class A: operating from both ends', 'دائرة الحلقة 1 مفتوحة – الفئة A: تعمل من الطرفين')
      : T('SLC loop 1 open circuit – devices beyond the break lost', 'دائرة الحلقة 1 مفتوحة – فُقدت الأجهزة بعد القطع'));
    if (this.shorts.size) add('trb:short', 'trouble', isolated.length
      ? T(`SLC loop 1 short circuit – isolators ${isolated.map((d) => pad3(d.addr)).join(', ')} operated`, `قصر في الحلقة 1 – عملت العوازل ${isolated.map((d) => pad3(d.addr)).join('، ')}`)
      : T('SLC loop 1 short circuit – NO isolators: whole loop lost!', 'قصر في الحلقة 1 – لا توجد عوازل: فُقدت الحلقة كاملة!'));
    if (this.ground) add('trb:gnd', 'trouble', T('Earth (ground) fault – loop 1', 'عطل تسرّب أرضي – الحلقة 1'));
    for (const [nac, f] of Object.entries(this.nacFaults)) {
      if (f === 'eol') add(`trb:${nac}`, 'trouble', T(`${nac} open circuit – end-of-line resistor missing`, `${nac} دائرة مفتوحة – مقاومة نهاية الخط مفقودة`));
      if (f === 'open') add(`trb:${nac}`, 'trouble', T(`${nac} open circuit – cable break`, `${nac} دائرة مفتوحة – قطع في الكابل`));
      if (f === 'short') add(`trb:${nac}`, 'trouble', T(`${nac} short circuit – circuit disabled`, `${nac} قصر – تم فصل الدائرة`));
    }
    if (!this.ac) add('trb:ac', 'trouble', T('AC power failure – running on batteries', 'انقطاع التيار الرئيسي – يعمل على البطاريات'));
    if (this.battV < 22.5) add('trb:batt', 'trouble', T(`Low battery ${this.battV.toFixed(1)} V`, `بطارية منخفضة ${this.battV.toFixed(1)} فولت`));
    // programming checks
    const answered = new Set();
    for (const d of this.devices) {
      if (!d.comm) continue;
      answered.add(d.addr);
      if (d.dup) { add(`trb:dup:${d.addr}`, 'trouble', T(`Double address ${pad3(d.addr)} – two devices answer`, `عنوان مكرر ${pad3(d.addr)} – جهازان يستجيبان`), d); continue; }
      const c = this.config[d.addr];
      if (!c) add(`trb:unprog:${d.id}`, 'trouble', T(`Unprogrammed device at ${pad3(d.addr)} (${d.type})`, `جهاز غير مبرمج على العنوان ${pad3(d.addr)} (${d.type})`), d);
      else if (c.type !== d.type) add(`trb:type:${d.addr}`, 'trouble', T(`Wrong device type at ${pad3(d.addr)}: programmed ${c.type}, found ${d.type}`, `نوع جهاز خاطئ على ${pad3(d.addr)}: مبرمج ${c.type} وموجود ${d.type}`), d);
    }
    for (const a of Object.keys(this.config).map(Number)) {
      if (!answered.has(a)) { const d = this.devices.find((x) => x.addr === a && x.id === this.config[a].id) || this.byAddr(a); add(`trb:nr:${a}`, 'trouble', T(`No answer – device ${pad3(a)}${d ? ' ' + d.floor + 'F ' + d.label.en : ''}`, `لا استجابة – الجهاز ${pad3(a)}${d ? ' ' + d.floor + 'F ' + d.label.ar : ''}`), d); }
    }
    // device conditions
    for (const d of this.devices) {
      if (!d.comm || d.dup) continue;
      if (d.disabled) { add(`dis:${d.id}`, 'disable', T(`Disabled: ${nm(d)}`, `معطّل: ${nmA(d)}`), d); continue; }
      const prog = this.config[d.addr];
      if (!prog || prog.type !== d.type) continue;
      const ty = DEVICE_TYPES[d.type];
      if (ty.analog) {
        if (d.type !== 'heat' && d.dirt >= 1) add(`trb:dirt:${d.id}`, 'trouble', T(`Detector fault – drift compensation limit: ${nm(d)}`, `عطل كاشف – تجاوز حد تعويض الانجراف: ${nmA(d)}`), d);
        else if (d.type !== 'heat' && d.dirt >= 0.8) add(`trb:maint:${d.id}`, 'trouble', T(`Maintenance alert – dirty detector ${Math.round(d.dirt * 100)} %: ${nm(d)}`, `تنبيه صيانة – كاشف متّسخ ${Math.round(d.dirt * 100)}%: ${nmA(d)}`), d);
        if (d.val >= 1) {
          if (this.settings.verification && d.type !== 'heat' && d.test !== 'fire') {
            if (d.verifyT == null) { d.verifyT = this.time; this.log('info', T(`Alarm verification started ${pad3(d.addr)}`, `بدء التحقق من الإنذار ${pad3(d.addr)}`), d); }
            if (this.time - d.verifyT >= 12) add(`fire:${d.id}`, 'fire', T(`FIRE ${nm(d)}`, `حريق ${nmA(d)}`), d);
          } else add(`fire:${d.id}`, 'fire', T(`FIRE ${nm(d)}`, `حريق ${nmA(d)}`), d);
        } else {
          if (d.verifyT != null && this.time - d.verifyT > 60) d.verifyT = null;
          if (d.val >= this.settings.preAlarm) add(`pre:${d.id}`, 'pre', T(`PRE-ALARM ${nm(d)} (${Math.round(d.val * 100)} %)`, `إنذار مبكر ${nmA(d)} (${Math.round(d.val * 100)}%)`), d);
        }
      }
      if (d.type === 'mcp' && d.latched) add(`fire:${d.id}`, 'fire', T(`FIRE – call point ${nm(d)}`, `حريق – زر يدوي ${nmA(d)}`), d);
      if (d.type === 'flow' && d.flowT >= this.settings.flowRetard) add(`fire:${d.id}`, 'fire', T(`FIRE – WATERFLOW ${nm(d)}`, `حريق – تدفق مياه ${nmA(d)}`), d);
      if (d.type === 'tamper' && d.test === 'tamper') add(`sup:${d.id}`, 'super', T(`SUPERVISORY – valve not fully open ${nm(d)}`, `إشرافي – الصمام غير مفتوح بالكامل ${nmA(d)}`), d);
    }
    // diff against active events
    const latching = (k) => k === 'fire';
    for (const [k, c] of cond) {
      if (!this.events.has(k)) {
        const e = { key: k, kind: c.kind, t: this.time, text: c.text, addr: c.dev?.addr ?? null, floor: c.dev?.floor ?? null, devId: c.dev?.id ?? null, acked: false };
        this.events.set(k, e);
        this.log(c.kind, c.text, c.dev);
        if (c.kind === 'fire') { this.silenced = false; this.lcdIdx = 0; }
        this.onNewEvent(e, c.dev);
      } else this.events.get(k).text = c.text;
    }
    for (const [k, e] of [...this.events]) {
      if (!cond.has(k) && !latching(e.kind)) {
        this.events.delete(k);
        this.log(e.kind, T(`RESTORED: ${e.text.en}`, `عودة للوضع الطبيعي: ${e.text.ar}`), null, true);
        this.onRestore(e);
      }
    }
    this.evalCauses();
    this.emit('change');
  }

  // ── cause & effect
  evalCauses() {
    const fires = [...this.events.values()].filter((e) => e.kind === 'fire').map((e) => this.dev(e.devId)).filter(Boolean);
    const zones = new Set(fires.map((d) => d.zone));
    const active = {
      anyFire: fires.length > 0,
      fireG: fires.some((d) => d.floor === 'G'), fire1: fires.some((d) => d.floor === '1'), fire2: fires.some((d) => d.floor === '2'),
      lobbyG: fires.some((d) => d.room === 'lobby' && d.floor === 'G'), lobbyUp: fires.some((d) => d.room === 'lobby' && d.floor !== 'G'),
      srOne: zones.has('SR-A') || zones.has('SR-B'), srBoth: zones.has('SR-A') && zones.has('SR-B'),
      flow: fires.some((d) => d.type === 'flow'), super: this.count('super') > 0, trouble: this.count('trouble') > 0,
    };
    this.causes = active;
    this.fireFloors = new Set(fires.map((d) => d.floor));
    for (const c of CAUSES) {
      if (active[c.id] && this.causeT[c.id] == null) this.causeT[c.id] = this.time;
      if (!active[c.id]) delete this.causeT[c.id];
    }
    for (const e of EFFECTS) {
      if (this.fx[e.id] != null) continue;
      for (const c of CAUSES) {
        const v = this.matrix[c.id]?.[e.id];
        if (!v || this.causeT[c.id] == null) continue;
        if (v === 1 || this.time - this.causeT[c.id] >= DELAY_S) {
          // non-latching effects driven only by supervisory/trouble rows restore with the cause
          this.fx[e.id] = this.time; this.fxCause = { ...(this.fxCause || {}), [e.id]: c.id };
          this.log('info', T(`C&E: ${c.name.en} → ${e.name.en}`, `السبب والنتيجة: ${c.name.ar} ← ${e.name.ar}`));
          this.onEffect(e.id);
          break;
        }
      }
    }
    // effects latched from non-fire causes clear when the cause restores
    for (const [eid, cid] of Object.entries(this.fxCause || {})) {
      if ((cid === 'super' || cid === 'trouble') && this.fx[eid] != null && !this.causes[cid]) { delete this.fx[eid]; delete this.fxCause[eid]; }
    }
  }
  /** Seconds until a delayed effect fires (for countdown displays), or null. */
  pendingDelay(eid) {
    if (this.fx[eid] != null) return null;
    let best = null;
    for (const c of CAUSES) if (this.matrix[c.id]?.[eid] === 2 && this.causeT[c.id] != null) { const r = DELAY_S - (this.time - this.causeT[c.id]); best = best == null ? r : Math.min(best, r); }
    return best;
  }
  on_(eid) { return this.fx[eid] != null; }

  onEffect(eid) {
    if (eid === 'fmRelease' && this.fm.state !== 'discharged') this.fm.state = 'releasing';
    if (eid === 'fmPre' && this.fm.state === 'idle') this.fm.state = 'pre';
  }

  runEffects(dt) {
    // relays: floor control modules follow AHU / damper effects
    for (const d of this.devices) if (d.type === 'relay') d.relayOn = d.comm && !d.disabled && (this.on_('ahu') || this.on_('dampers'));
    // lift
    const L = this.lift;
    if (L.mode !== 'phase2' && (this.on_('liftPrimary') || this.on_('liftAlt'))) {
      const alt = this.on_('liftAlt') && (this.causes.lobbyG || !this.on_('liftPrimary'));
      L.target = alt ? 1 : 0;
      if (L.mode === 'normal') { L.mode = 'recalling'; L.doors = 'closed'; }
    }
    if (L.key === 'on' && L.mode === 'normal') { L.target = 0; L.mode = 'recalling'; L.doors = 'closed'; this.log('info', T('Lift Phase I key switch ON – manual recall', 'مفتاح المرحلة الأولى للمصعد – استدعاء يدوي')); }
    if (L.mode === 'phase2' && L.carCalls.length) L.target = L.carCalls[0];
    const dir = Math.sign(L.target - L.pos);
    if (dir && (L.mode !== 'recalled') && L.doors === 'closed') {
      L.pos += dir * Math.min(Math.abs(L.target - L.pos), dt / 3);
      if (Math.abs(L.target - L.pos) < 1e-3) {
        L.pos = L.target;
        if (L.mode === 'recalling') { L.mode = 'recalled'; L.doors = 'open'; this.log('info', T(`Lift recalled to floor ${FLOORS[L.target].id} – doors open, out of service`, `المصعد في الطابق ${FLOORS[L.target].id} – الأبواب مفتوحة وخارج الخدمة`)); }
        if (L.mode === 'phase2') L.carCalls.shift();
      }
    }
    // FM-200
    const F = this.fm;
    if (F.state === 'releasing' && !F.abort) { F.state = 'discharging'; F.t = 0; this.log('fire', T('FM-200 RELEASED – agent discharging (≤ 10 s)', 'تم تفريغ FM-200 – المادة تتدفق (≤ 10 ث)')); }
    if (F.state === 'discharging') { F.t += dt; if (F.t >= 10) { F.state = 'discharged'; this.log('info', T('FM-200 discharge complete – hold time 10 min', 'اكتمل تفريغ FM-200 – زمن الاحتفاظ 10 دقائق')); } }
  }

  /** Output states for displays (BMS, building section, C&E run). */
  outputs() {
    const fireFloors = this.fireFloors || new Set();
    const voice = {};
    for (const f of FLOORS) {
      let st = 'off';
      if (this.on_('voice')) {
        const evac = [...fireFloors].some((ff) => { const lv = FLOORS.find((x) => x.id === ff).level; return f.level === lv || f.level === lv + 1; });
        st = evac ? 'evac' : 'alert';
      }
      if (this.drill) st = 'evac';
      if (this.silenced && st !== 'off') st = 'silenced';
      voice[f.id] = st;
    }
    const nacOk = (n) => this.nacFaults[n] !== 'short';
    const sounders = (this.on_('sounders') || this.drill) && !this.silenced;
    const relayFloors = {};
    for (const d of this.devices) if (d.type === 'relay') relayFloors[d.floor] = d.relayOn || (!d.comm && (this.on_('ahu') || this.on_('dampers')) ? 'failed' : false);
    return {
      sounders, nac: { NAC1: sounders && nacOk('NAC1'), NAC2: sounders && nacOk('NAC2') }, nacPartial: { NAC1: this.nacFaults.NAC1 === 'open', NAC2: this.nacFaults.NAC2 === 'open' },
      voice, ahu: Object.fromEntries(FLOORS.map((f) => [f.id, !(this.on_('ahu') && relayFloors[f.id] === true)])),
      ahuFailed: Object.fromEntries(FLOORS.map((f) => [f.id, relayFloors[f.id] === 'failed'])),
      dampers: this.on_('dampers') ? 'closed' : 'open', stairFans: this.on_('stairFans'), doors: this.on_('doors') ? 'released' : 'held',
      access: this.on_('access') ? 'unlocked' : 'locked', fm: this.fm.state, fmPre: this.on_('fmPre'), fmDelay: this.pendingDelay('fmRelease'),
      remote: this.on_('remote'), bms: this.on_('bms'), lift: { ...this.lift },
    };
  }

  // ── remote monitoring: Contact-ID
  sendCid(q, code, zone) {
    const msg = { t: this.time, acct: '4721', mt: 18, q, code, part: 1, zone, raw: `4721 18 ${q}${String(code).padStart(3, '0')} 01 ${pad3(zone)}` };
    this.cid.push(msg); if (this.cid.length > 200) this.cid.shift();
    this.emit('cid', msg);
  }
  remoteFor(kind) {
    const m = this.matrix;
    if (kind === 'fire') return !!(m.anyFire?.remote || m.flow?.remote || m.fireG?.remote || m.fire1?.remote || m.fire2?.remote);
    if (kind === 'super') return !!m.super?.remote;
    return !!m.trouble?.remote;
  }
  cidCode(e, d) {
    if (e.kind === 'fire') return d?.type === 'mcp' ? CID.mcp : d?.type === 'flow' ? CID.flow : CID.fire;
    if (e.kind === 'super') return CID.tamperSprinkler;
    if (e.kind === 'disable') return CID.disable;
    if (e.key === 'trb:ac') return CID.ac;
    if (e.key === 'trb:batt') return CID.lowBatt;
    if (e.key === 'trb:gnd') return CID.ground;
    if (e.key.startsWith('trb:NAC')) return CID.nac;
    if (e.key.startsWith('trb:maint') || e.key.startsWith('trb:dirt')) return CID.sensor;
    if (e.key.startsWith('trb:')) return CID.loop;
    return null;
  }
  onNewEvent(e, d) {
    const code = this.cidCode(e, d);
    if (code && e.kind !== 'pre' && this.remoteFor(e.kind)) this.sendCid(1, code, e.addr ?? 0);
  }
  onRestore(e) {
    const code = this.cidCode(e, this.dev(e.devId));
    if (code && this.remoteFor(e.kind)) this.sendCid(3, code, e.addr ?? 0);
  }

  // ── BACnet / Modbus points exposed to the BMS gateway
  points() {
    const o = this.outputs();
    const pts = [];
    const bi = (inst, name, v) => pts.push({ obj: `BI-${inst}`, type: 'binary-input', name, value: v ? 'ACTIVE' : 'INACTIVE', raw: v ? 1 : 0 });
    const ai = (inst, name, v, u) => pts.push({ obj: `AI-${inst}`, type: 'analog-input', name, value: `${v} ${u}`, raw: v });
    bi(1, 'FACP Common Fire', this.count('fire') > 0);
    bi(2, 'FACP Common Pre-alarm', this.count('pre') > 0);
    bi(3, 'FACP Common Supervisory', this.count('super') > 0);
    bi(4, 'FACP Common Trouble', this.count('trouble') > 0);
    bi(5, 'FACP Alarm Silenced', this.silenced);
    bi(6, 'FACP AC Power OK', this.ac);
    FLOORS.forEach((f, i) => bi(10 + i, `Fire Floor ${f.id}`, (this.fireFloors || new Set()).has(f.id)));
    bi(20, 'Lift Phase I Recall', o.lift.mode === 'recalling' || o.lift.mode === 'recalled');
    bi(21, 'Stair Pressurization Fans', o.stairFans);
    bi(22, 'Smoke Dampers Closed', o.dampers === 'closed');
    bi(23, 'FM-200 Discharged', o.fm === 'discharging' || o.fm === 'discharged');
    FLOORS.forEach((f, i) => bi(30 + i, `AHU-${f.id} Running`, o.ahu[f.id]));
    ai(1, 'FACP Battery Voltage', +this.battV.toFixed(1), 'V');
    ai(2, 'Active Fire Events', this.count('fire'), '');
    ai(3, 'Active Trouble Events', this.count('trouble'), '');
    ai(4, 'Lift Car Position', +o.lift.pos.toFixed(2), 'floor');
    // Modbus holding registers (gateway map)
    const bits = (arr) => arr.reduce((acc, b, i) => acc | ((b ? 1 : 0) << i), 0);
    const reg = [
      bits([this.count('fire'), this.count('pre'), this.count('super'), this.count('trouble'), this.silenced, this.ac, this.ground, this.drill]),
      bits(FLOORS.map((f) => (this.fireFloors || new Set()).has(f.id))),
      Math.round(this.battV * 10), this.count('fire'), this.count('trouble'),
      bits([o.stairFans, o.dampers === 'closed', o.doors === 'released', o.access === 'unlocked', o.lift.mode !== 'normal', o.fm === 'discharged']),
    ];
    return { pts, reg };
  }
  bacnetScan() {
    const { pts } = this.points();
    for (const p of pts) {
      const prev = this.lastPoints[p.obj];
      if (prev !== undefined && prev !== p.value) {
        this.bacnet.push({ t: this.time, kind: 'COV', text: `UnconfirmedCOVNotification ${p.obj} "${p.name}" Present_Value = ${p.value}` });
        if (this.bacnet.length > 200) this.bacnet.shift();
      }
      this.lastPoints[p.obj] = p.value;
    }
  }

  // ── inspector challenge: plant hidden faults
  plantFaults(n = 4, rand = Math.random) {
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const dets = this.devices.filter((d) => d.type === 'smoke' || d.type === 'multi');
    const pool = [
      () => { const d = pick(dets); d.dirt = 0.97; return { kind: 'dirty', addr: d.addr }; },
      () => { const d = pick(this.devices.filter((x) => x.type !== 'iso')); d.fault = 'dead'; return { kind: 'dead', addr: d.addr }; },
      () => { const a = pick(dets), b = pick(dets.filter((x) => x !== a)); b.addr = a.addr; return { kind: 'dup', addr: a.addr }; },
      () => { const d = pick(this.devices.filter((x) => x.type === 'smoke')); d.type = 'heat'; return { kind: 'type', addr: d.addr }; },
      () => { const d = pick(dets); d.disabled = true; return { kind: 'disabled', addr: d.addr }; },
      () => { this.nacFaults[pick(['NAC1', 'NAC2'])] = 'eol'; return { kind: 'nac', addr: null }; },
      () => { const seg = 1 + Math.floor(rand() * (this.devices.length - 1)); this.opens.add(seg); return { kind: 'open', addr: null, seg }; },
      () => { this.ground = true; return { kind: 'ground', addr: null }; },
      () => { const d = pick(this.devices.filter((x) => x.type === 'tamper')); d.test = 'tamper'; return { kind: 'tamper', addr: d.addr }; },
    ];
    const used = new Set(), planted = [];
    while (planted.length < n && used.size < pool.length) {
      const i = Math.floor(rand() * pool.length);
      if (used.has(i)) continue;
      used.add(i); planted.push(pool[i]());
    }
    this.evaluate();
    return planted;
  }
}

export const FAULT_KINDS = {
  dirty: T('Dirty detector (maintenance alert)', 'كاشف متّسخ (تنبيه صيانة)'),
  dead: T('Dead / missing device (no answer)', 'جهاز معطّل أو مفقود (لا استجابة)'),
  dup: T('Double address', 'عنوان مكرر'),
  type: T('Wrong device type installed', 'تركيب نوع جهاز خاطئ'),
  disabled: T('Device left disabled', 'جهاز تُرك معطّلاً'),
  nac: T('NAC end-of-line resistor missing', 'مقاومة نهاية خط دائرة الإنذار مفقودة'),
  open: T('Loop open circuit (Class A still working)', 'دائرة الحلقة مفتوحة (الفئة A ما زالت تعمل)'),
  ground: T('Earth / ground fault', 'عطل تسرّب أرضي'),
  tamper: T('Sprinkler valve left closed (supervisory)', 'صمام رشاشات تُرك مغلقاً (إشرافي)'),
};

/** Battery sizing (NFPA 72 §10.6.7): 24 h standby + 5 min alarm, 20 % margin (×1.2). */
export function batteryCalc({ standbyA, alarmA, standbyH = 24, alarmMin = 5, margin = 1.2 }) {
  const ah = (standbyA * standbyH + alarmA * (alarmMin / 60)) * margin;
  const sizes = [7, 12, 17, 18, 26, 33, 40, 55, 65, 100];
  return { ah, pick: sizes.find((s) => s >= ah) ?? Math.ceil(ah) };
}

/** System loads from the device list (panel 150 mA standby / 400 mA alarm). */
export function systemLoads(sys) {
  let q = 0.15, a = 0.4;
  for (const d of sys.devices) { const ty = DEVICE_TYPES[d.type]; q += ty.iq / 1000; a += ty.ia / 1000; }
  a += sys.nacDevices.length * 0.11;
  return { standbyA: q, alarmA: a };
}
