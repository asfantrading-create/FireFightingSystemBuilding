// Scenes 1 & 2 — Fire pump room (NFPA 20): walk-through & pressure sequence, and annual flow test (NFPA 25).
import * as THREE from 'three';
import { MAT, tag, room, gauge, osyValve, butterflyValve, checkValve, controller, firePump, flowMeter, Stream, V, box, cyl, pipe, label3D } from './parts.js';
import { designPumps, GPM, PSI } from '../engine/design.js';
import { PumpSet } from '../engine/sim.js';
import { t as tt, tr } from '../i18n.js';

const T = (en, ar) => ({ en, ar });
const BASE = designPumps(1000 * GPM, 7.3, 0.3, 200);   // 1000 gpm, 7.5 bar rated fire pump

function buildRoom() {
  const root = new THREE.Group();
  const parts = {};
  const P = (id, obj, name, info, extra = {}) => { tag(obj, id); parts[id] = { obj, name, info, ...extra }; root.add(obj); return obj; };
  root.add(room(18, 13, 5));

  // ── suction tank (cut-away shell) with float valve, overflow, anti-vortex plate
  const tank = new THREE.Group(); tank.position.set(-4, -0.3, -12.5);
  tank.add(new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 7, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2f2f0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })).translateY(3.5));
  const water = cyl(4.4, 5.6, MAT.water, 0, 0, 0, 40); tank.add(water);
  tank.add(label3D('FIRE WATER TANK', { size: 0.35 }).translateY(6.2).translateZ(4.55));
  P('tank', tank, T('Fire water tank', 'خزان مياه الحريق'), T('Dedicated fire water storage sized for the design flow × duration (NFPA 22). It must never be used for domestic water. Level is supervised by a low-level alarm.', 'تخزين مخصص لمياه الحريق يُصمم بحاصل ضرب التدفق التصميمي × المدة (NFPA 22). لا يُستخدم للمياه المنزلية أبداً، ومستواه مراقب بإنذار انخفاض المستوى.'));
  const fl = new THREE.Group(); fl.position.set(-6.2, 5.4, -12.5);
  fl.add(pipe([V(0, 1.2, 0), V(0, 0.3, 0), V(0.8, 0.3, 0)], 0.05, MAT.galv));
  fl.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), MAT.brass).translateX(1.1).translateY(0.1));
  P('float', fl, T('Float (make-up) valve', 'صمام العوامة (التعويض)'), T('Automatic refill valve: keeps the tank full after tests or fires. Refill capacity must restore the full volume within 8 hours (NFPA 22).', 'صمام تعبئة تلقائي يحافظ على امتلاء الخزان بعد الاختبارات أو الحرائق، ويجب أن يعيد الحجم الكامل خلال 8 ساعات (NFPA 22).'));
  const ov = pipe([V(-8.4, 5.9, -12.5), V(-9, 5.9, -12.5), V(-9, 0.2, -12.5)], 0.08, MAT.galv);
  P('overflow', ov, T('Overflow pipe', 'أنبوب الفائض'), T('Discharges excess water if the float valve fails, protecting the tank roof; outlet is screened against insects.', 'يصرّف الماء الزائد عند تعطل صمام العوامة لحماية سقف الخزان، ومخرجه محمي بشبك ضد الحشرات.'));
  const av = box(1.2, 0.05, 1.2, MAT.dark, -4, 0.35, -9.2);
  P('antivortex', av, T('Anti-vortex plate', 'لوح منع الدوامة'), T('Plate over the suction outlet (≥ 2 × pipe diameter) prevents vortices that would draw air into the pump when the level is low (NFPA 22/20).', 'لوح فوق فتحة السحب (≥ ضعفي قطر الأنبوب) يمنع تكوّن الدوامات التي تسحب الهواء إلى المضخة عند انخفاض المستوى.'));

  // ── suction header & supervised OS&Y valve
  root.add(pipe([V(-4, 0.6, -9.2), V(-4, 0.6, -4), V(-6.2, 0.6, -4), V(4.8, 0.6, -4)], 0.2, MAT.red));
  const sv = osyValve(0.2); sv.position.set(-4, 0.6, -6.5); P('suction', sv, T('Suction OS&Y valve (supervised)', 'صمام السحب OS&Y (مراقَب)'), T('Outside-screw-and-yoke gate valve: the rising stem shows it is open at a glance. A tamper switch sends a supervisory signal to the fire alarm panel if it is closed. Butterfly valves are not allowed within 15 m of the pump suction (NFPA 20).', 'صمام بوابي بساق صاعدة يُظهر حالة الفتح بنظرة. مفتاح العبث يرسل إشارة إشراف للوحة الإنذار عند إغلاقه. لا يُسمح بصمامات الفراشة ضمن 15 م من سحب المضخة (NFPA 20).'));

  // ── pumps
  const pumps = {};
  const mkPump = (id, kind, x, name, info) => {
    const pu = firePump(kind); pu.position.set(x, 0, -1.2);
    P(id, pu, name, info);
    pumps[id] = pu;
    const sx = kind === 'jockey' ? x : x - 0.8;
    root.add(pipe([V(sx, 0.6, -4), V(sx, 0.6, kind === 'jockey' ? -1.2 : -0.65)], kind === 'jockey' ? 0.06 : 0.16, MAT.red));
    return pu;
  };
  mkPump('jockey', 'jockey', -6.2, T('Jockey (pressure maintenance) pump', 'مضخة الجوكي (حفظ الضغط)'), T('Small pump that makes up leakage and keeps the system pressurised so the main fire pump does not start for small pressure drops. It is not a fire pump; set to start ~0.7 bar (10 psi) below its stop point.', 'مضخة صغيرة تعوّض التسربات وتحافظ على ضغط المنظومة حتى لا تعمل مضخة الحريق الرئيسية عند انخفاضات بسيطة. ليست مضخة حريق، وتُضبط لتعمل بفارق ~0.7 بار عن ضغط الإيقاف.'));
  mkPump('electric', 'split', -1.5, T('Electric fire pump (horizontal split-case)', 'مضخة الحريق الكهربائية (مشقوقة أفقياً)'), T(`Main fire pump, UL/FM listed, rated ${BASE.ratedGpm} gpm at ${BASE.ratedP} bar. Churn ≤ 140 % of rated pressure and ≥ 65 % at 150 % flow. Split-case pumps allow service without disturbing the pipework.`, `مضخة الحريق الرئيسية المعتمدة UL/FM بتصنيف ${BASE.ratedGpm} جالون/دقيقة عند ${BASE.ratedP} بار. ضغط الإغلاق ≤ 140% من الضغط المقنن و≥ 65% عند 150% من التدفق. تسمح المضخة المشقوقة بالصيانة دون فك الأنابيب.`));
  mkPump('diesel', 'diesel', 3.8, T('Diesel fire pump', 'مضخة الحريق بمحرك ديزل'), T('Standby fire pump independent of mains power. Needs a fuel tank for ≥ 8 h (1 gal/hp + 5 %), two battery sets, a heated room (≥ 21 °C) and an exhaust to outside. Run weekly for 30 minutes (NFPA 25).', 'مضخة احتياطية مستقلة عن الكهرباء. تحتاج خزان وقود لـ 8 ساعات على الأقل، ومجموعتي بطاريات، وغرفة مُدفأة (≥ 21 °م)، وعادماً للخارج. تُشغَّل أسبوعياً 30 دقيقة (NFPA 25).'));
  root.add(box(1.4, 1.0, 0.8, MAT.red, 7.2, 0.9, -4));
  root.add(label3D('DIESEL FUEL', { size: 0.14 }).translateX(7.2).translateY(1.6).translateZ(-3.59));
  const bat = new THREE.Group(); for (let i = 0; i < 2; i++) bat.add(box(0.5, 0.3, 0.3, MAT.dark, i * 0.6, 0, 0)); bat.position.set(5.6, 0, 0.6);
  P('batteries', bat, T('Diesel starting batteries (2 sets)', 'بطاريات تشغيل الديزل (مجموعتان)'), T('Two independent battery sets; the controller alternates between them, 6 crank attempts of 15 s each.', 'مجموعتا بطاريات مستقلتان يتناوب عليهما المتحكم، 6 محاولات إدارة مدة كل منها 15 ثانية.'));

  // ── discharge side: check + isolation valve per pump, header, gauges
  const disGauges = {};
  const mkDischarge = (id, x, r) => {
    root.add(pipe([V(x, 1.2, -1.2), V(x, 2.6, -1.2), V(x, 2.6, 1.3)], r, MAT.red));
    const cv = checkValve(r * 0.9); cv.position.set(x, 2.6, -0.4); cv.rotation.y = Math.PI / 2; root.add(cv);
    const bv = butterflyValve(r * 0.9); bv.position.set(x, 2.6, 0.5); bv.rotation.y = Math.PI / 2; root.add(bv);
    const gg = gauge(16, 'bar', 'DISCH.'); gg.position.set(x + 0.35, 2.3, -1.2); gg.rotation.y = 0; root.add(gg); disGauges[id] = gg;
    return cv;
  };
  const cvE = mkDischarge('electric', -0.8, 0.14); mkDischarge('diesel', 3.0, 0.14); mkDischarge('jockey', -6.2, 0.05);
  tag(cvE, 'check'); parts.check = { obj: cvE, name: T('Discharge check valve', 'صمام عدم الرجوع على الطرد'), info: T('Prevents back-flow through an idle pump when another pump is running. Followed by an isolation valve for maintenance.', 'يمنع رجوع الماء عبر مضخة متوقفة عند تشغيل مضخة أخرى، ويليه صمام عزل للصيانة.') };
  root.add(pipe([V(-6.5, 2.6, 1.3), V(8.4, 2.6, 1.3)], 0.2, MAT.red));
  const riser = pipe([V(8.4, 2.6, 1.3), V(8.4, 5.2, 1.3)], 0.2, MAT.red);
  P('riser', riser, T('System riser (to sprinklers & standpipes)', 'الرايزر الرئيسي (إلى الرشاشات والأنابيب القائمة)'), T('The discharge header feeds the building fire main. A fire department connection (FDC) can also boost this main from a fire engine.', 'يغذي مجمع الطرد الخط الرئيسي للمبنى، ويمكن للدفاع المدني تعزيزه من سيارة الإطفاء عبر وصلة FDC.'));
  const sysG = gauge(16, 'bar', 'SYSTEM'); sysG.position.set(8.0, 3.2, 1.55); root.add(sysG);
  tag(sysG, 'sysgauge'); parts.sysgauge = { obj: sysG, name: T('System pressure gauge', 'مقياس ضغط المنظومة'), info: T('Shows the header pressure watched by the pressure switches in each controller (sensing lines in brass).', 'يعرض ضغط المجمع الذي تراقبه مفاتيح الضغط في كل متحكم عبر خطوط استشعار نحاسية.') };
  const sucG = gauge(4, 'bar', 'SUCTION'); sucG.position.set(-2.1, 1.3, -3.7); root.add(sucG);
  tag(sucG, 'sucgauge'); parts.sucgauge = { obj: sucG, name: T('Suction (compound) gauge', 'مقياس السحب (مركب)'), info: T('Compound gauge (vacuum/pressure) on the suction side; used to calculate net pump pressure = discharge − suction during flow tests.', 'مقياس مركب (تفريغ/ضغط) على جهة السحب؛ يُستخدم لحساب الضغط الصافي للمضخة = الطرد − السحب أثناء اختبارات التدفق.') };

  // ── relief valves
  const rv = new THREE.Group(); rv.position.set(4.6, 2.6, 1.3);
  rv.add(cyl(0.12, 0.4, MAT.red, 0, 0, 0, 14)); rv.add(cyl(0.05, 0.3, MAT.brass, 0, 0.4, 0, 8));
  rv.add(pipe([V(0, 0, 0), V(0, 0, 1.2), V(0, -2.5, 1.2)], 0.07, MAT.red));
  rv.add(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.35, 16, 1, true), MAT.galv).translateZ(1.2).translateY(-2.7));
  P('relief', rv, T('Main pressure relief valve', 'صمام تنفيس الضغط الرئيسي'), T('Required where a diesel engine overspeed or churn could exceed system pressure ratings (NFPA 20 §4.20). Discharges to a visible open cone. It is not a pressure-reducing valve.', 'مطلوب عندما يمكن أن يتجاوز الضغط عند الإغلاق أو زيادة سرعة الديزل حدود المنظومة (NFPA 20). يصرّف إلى مخروط مفتوح مرئي، وهو ليس صمام خفض ضغط.'));

  // ── controllers
  const ctl = {};
  const mkCtl = (id, title, x, name, info) => { const c = controller(title); c.position.set(x, 0, 4.4); c.rotation.y = 0; P(id, c, name, info); ctl[id] = c; };
  mkCtl('ctlJockey', 'JOCKEY', -6.2, T('Jockey pump controller', 'متحكم مضخة الجوكي'), T('Starts/stops the jockey automatically between its set points.', 'يشغّل ويوقف مضخة الجوكي آلياً بين نقطتي الضبط.'));
  mkCtl('ctlElectric', 'ELECTRIC FIRE PUMP', -1.5, T('Electric fire pump controller', 'متحكم مضخة الحريق الكهربائية'), T(`Listed controller with pressure switch: starts automatically at ${BASE.mainStart} bar. Must be stopped manually (or by a minimum-run timer) — never automatically on pressure recovery. Has a transfer switch for the emergency supply.`, `متحكم معتمد بمفتاح ضغط يعمل آلياً عند ${BASE.mainStart} بار، ويجب إيقافه يدوياً (أو بمؤقت أدنى تشغيل) وليس آلياً عند عودة الضغط. يحتوي مفتاح تحويل للمصدر الاحتياطي.`));
  mkCtl('ctlDiesel', 'DIESEL FIRE PUMP', 3.8, T('Diesel fire pump controller', 'متحكم مضخة الديزل'), T(`Starts at ${BASE.dieselStart} bar (sequential delay after the electric pump) or immediately on electric pump failure. Alarms: fail to start, low oil, high temperature, battery failure.`, `يعمل عند ${BASE.dieselStart} بار (بتأخير تتابعي بعد الكهربائية) أو فوراً عند فشلها. الإنذارات: فشل التشغيل، انخفاض الزيت، ارتفاع الحرارة، عطل البطاريات.`));
  for (const x of [-6.2, -1.5, 3.8]) root.add(pipe([V(x + 0.2, 2.6, 1.3), V(x + 0.2, 2.0, 3.0), V(x + 0.2, 1.4, 4.2)], 0.015, MAT.brass));

  // ── test header, flow meter loop back to the tank
  root.add(pipe([V(6.2, 2.6, 1.3), V(6.2, 1.4, 1.3), V(6.2, 1.4, 5.5)], 0.14, MAT.red));
  const fm = flowMeter(); fm.position.set(6.2, 1.4, 4.2); fm.rotation.y = Math.PI / 2;
  P('flowmeter', fm, T('Flow meter (test loop)', 'عداد التدفق (دائرة الاختبار)'), T('Measures pump flow during the annual test; the loop returns water to the tank so no water is wasted. Accuracy is verified against a hose-stream test every 3 years.', 'يقيس تدفق المضخة في الاختبار السنوي، وتعيد الدائرة المياه إلى الخزان دون هدر. تُتحقق دقته مقارنةً باختبار خراطيم كل 3 سنوات.'));
  const tv = butterflyValve(0.13); tv.position.set(6.2, 1.4, 5.3); tv.rotation.y = Math.PI / 2;
  P('testvalve', tv, T('Flow-test control valve', 'صمام التحكم باختبار التدفق'), T('Throttled to set 0 %, 100 % and 150 % of rated flow during the performance test.', 'يُضبط للحصول على 0% و100% و150% من التدفق المقنن أثناء اختبار الأداء.'));
  root.add(pipe([V(6.2, 1.4, 5.5), V(9.5, 1.4, 5.5), V(9.5, 1.4, -12.5), V(0.5, 1.4, -12.5)], 0.12, MAT.red));
  const th = new THREE.Group(); th.position.set(9.2, 0, 1.3);
  th.add(pipe([V(-0.8, 2.6, 0), V(0, 2.6, 0), V(0, 1.1, 0)], 0.12, MAT.red));
  th.add(box(0.2, 0.2, 1.6, MAT.red, 0, 1.0, 0));
  for (let i = 0; i < 3; i++) th.add(cyl(0.07, 0.3, MAT.brass, 0.2, 1.05, -0.5 + i * 0.5, 12).rotateZ(Math.PI / 2));
  P('testheader', th, T('Hose test header', 'مجمع اختبار الخراطيم'), T('Outside hose valves (65 mm) for flow testing with hoses and Pitot tubes; the number of valves depends on pump size (NFPA 20 Table 4.28(a)).', 'صمامات خراطيم خارجية (65 مم) لاختبار التدفق بالخراطيم وأنابيب بيتو، ويعتمد عددها على حجم المضخة.'));
  // louvre, drain
  root.add(box(2, 1, 0.1, MAT.dark, 2, 3.2, -6.35));
  const s = { root, parts, pumps, ctl, disGauges, sysG, sucG, fm, tv, sv, water };
  return s;
}

function makeState(wear = 1) {
  const pumps = { ...BASE, churnP: BASE.churnP * wear * wear, ratedP: BASE.ratedP * wear * wear };
  const st = { demand: 0, testValve: 0, power: true, leak: false, wear, points: [], events: [], suction: 0.3, Q: 0, Qtest: 0 };
  st.faults = { powerFail: false };
  st.ps = new PumpSet(pumps, st.faults, 400, (t, level, key, params) => st.events.push({ t, level, key, params }));
  st.ps.p = pumps;
  return st;
}

function tickPumps(s, st, dt, api) {
  const ps = st.ps;
  st.faults.powerFail = !st.power;
  if (!st.power && ps.main > 0) { ps.main = 0; ps.mainState = 'failed'; api.msg('Mains lost — electric pump stopped', 'انقطعت الكهرباء — توقفت المضخة الكهربائية', 'bad'); }
  if (st.power && ps.mainState === 'failed') ps.mainState = 'standby';
  const Kd = (1.7 * BASE.rated) / Math.sqrt(BASE.ratedP);
  const Kt = (2.2 * BASE.rated) / Math.sqrt(BASE.ratedP);
  const out = (P) => Math.sqrt(Math.max(0, P)) * (st.demand * Kd + st.testValve * Kt + (st.leak ? 1.5 : 0));
  const n = Math.max(1, Math.round(dt / 0.05));
  for (let i = 0; i < n; i++) { st.simT = (st.simT || 0) + dt / n; ps.step(st.simT, dt / n, out); }
  ps.tank = Math.min(ps.tank0, ps.tank + st.testValve * Kt * Math.sqrt(Math.max(0, ps.P)) * dt / 60000);
  st.Q = out(ps.P);
  st.Qtest = st.testValve * Kt * Math.sqrt(Math.max(0, ps.P));
  st.suction = 0.3 - 2e-9 * ps.Qin * ps.Qin;
  if (ps.jockey) st.jockeyStarted = true;
  // events → messages
  while (st.events.length) { const e = st.events.shift(); api.msg(tt('e_' + e.key, e.params), tt('e_' + e.key, e.params), e.level === 'alarm' ? 'bad' : 'info'); }
  // visuals
  s.sysG.set(ps.P); s.sucG.set(Math.max(0, st.suction));
  s.disGauges.electric.set(ps.main > 0.05 ? ps.P : st.suction);
  s.disGauges.diesel.set(ps.diesel > 0.05 ? ps.P : st.suction);
  s.disGauges.jockey.set(ps.jockey ? ps.P : st.suction);
  s.fm.set(`${Math.round(st.Qtest / GPM)} gpm`);
  s.tv.setOpen(st.testValve);
  const shake = (o, on) => { o.position.y = on ? Math.sin(st.time * 90) * 0.004 : 0; };
  shake(s.pumps.jockey, ps.jockey); shake(s.pumps.electric, ps.main > 0.05); shake(s.pumps.diesel, ps.diesel > 0.05);
  s.ctl.ctlJockey.lamp('power', true); s.ctl.ctlJockey.lamp('run', ps.jockey);
  s.ctl.ctlElectric.lamp('power', st.power); s.ctl.ctlElectric.lamp('run', ps.main > 0.05); s.ctl.ctlElectric.lamp('alarm', ps.mainState === 'failed');
  s.ctl.ctlDiesel.lamp('power', true); s.ctl.ctlDiesel.lamp('run', ps.diesel > 0.05);
  s.water.scale.y = Math.max(0.02, ps.tank / ps.tank0);
}

function readouts(st) {
  const ps = st.ps;
  const state = (on) => (on ? T('RUNNING', 'يعمل') : T('standby', 'جاهز'));
  return [
    [T('System pressure', 'ضغط المنظومة'), `${ps.P.toFixed(2)} bar · ${Math.round(ps.P / PSI)} psi`],
    [T('Suction pressure', 'ضغط السحب'), `${st.suction.toFixed(2)} bar`],
    [T('Net pump pressure', 'الضغط الصافي للمضخة'), `${(ps.P - st.suction).toFixed(2)} bar`],
    [T('Flow', 'التدفق'), `${Math.round(st.Q || 0)} L/min · ${Math.round((st.Q || 0) / GPM)} gpm`],
    [T('Jockey pump', 'مضخة الجوكي'), tr(state(ps.jockey)), ps.jockey ? 'warn' : ''],
    [T('Electric fire pump', 'المضخة الكهربائية'), ps.mainState === 'failed' ? tr(T('NO POWER', 'لا كهرباء')) : tr(state(ps.main > 0.05)), ps.main > 0.05 ? 'warn' : ps.mainState === 'failed' ? 'alarm' : ''],
    [T('Diesel fire pump', 'مضخة الديزل'), tr(state(ps.diesel > 0.05)), ps.diesel > 0.05 ? 'warn' : ''],
    [T('Set points (bar)', 'نقاط الضبط (بار)'), `J ${ps.p.jockeyStart}/${ps.p.jockeyStop} · E ${ps.p.mainStart} · D ${ps.p.dieselStart}`],
    [T('Tank level', 'مستوى الخزان'), `${Math.round((ps.tank / ps.tank0) * 100)} %`],
  ];
}

function manualStart(st) { const ps = st.ps; if (!st.power) return false; if (ps.mainState === 'standby') { ps.mainState = 'starting'; ps.mainT = st.simT; } return true; }

const common = (s) => ({
  root: s.root, parts: s.parts,
  overview: { pos: [4, 9, 17], target: [0, 1.2, -1] },
  env: { biome: 'desert', sunElevation: 60, sunAzimuth: 200, radius: 40, shadowSize: 22 },
  readouts,
});

// ───────────────────────── Scene 1: walk-through & pressure sequence
export const pumpRoomScene = {
  id: 'pumproom', icon: '🛠️',
  title: T('Fire pump room walk-through & start sequence', 'جولة في غرفة مضخات الحريق وتسلسل التشغيل'),
  summary: T('NFPA 20 pump room: tank, suction, jockey / electric / diesel pumps, controllers, relief valve, test loop. Operate the demand and watch the pressure-switch sequence.', 'غرفة مضخات وفق NFPA 20: الخزان والسحب ومضخات الجوكي والكهربائية والديزل والمتحكمات وصمام التنفيس ودائرة الاختبار. تحكّم بالطلب وراقب تسلسل مفاتيح الضغط.'),
  build() {
    const s = buildRoom();
    const st = makeState(1);
    s.parts.ctlElectric.onPick = (state, api) => {
      if (state.ps.main > 0.05 || state.ps.mainState === 'starting') { state.ps.manualStop(state.simT); api.msg('Electric pump stopped manually (STOP pressed)', 'تم إيقاف المضخة الكهربائية يدوياً'); }
      else if (manualStart(state)) api.msg('Electric pump started manually (START pressed)', 'تم تشغيل المضخة الكهربائية يدوياً');
    };
    s.parts.ctlDiesel.onPick = (state, api) => { if (state.ps.diesel > 0.05) { state.ps.diesel = 0; state.ps.dieselState = 'standby'; api.msg('Diesel pump stopped manually', 'تم إيقاف مضخة الديزل يدوياً'); } };
    return {
      ...common(s), state: st,
      reset(state) { Object.assign(state, makeState(1), { time: state.time }); },
      tick: (dt, state, api) => tickPumps(s, state, dt, api),
      controls: [
        { type: 'slider', label: T('System demand (sprinklers / hoses open)', 'طلب المنظومة (رشاشات/خراطيم مفتوحة)'), min: 0, max: 1, step: 0.01, get: (x) => x.demand, set: (x, v) => { x.demand = v; }, fmt: (v) => `${Math.round(v * 100)} %` },
        { type: 'toggle', label: T('Mains power available', 'الكهرباء الرئيسية متوفرة'), get: (x) => x.power, set: (x, v) => { x.power = v; } },
        { type: 'toggle', label: T('Small leak in the system', 'تسريب صغير في المنظومة'), get: (x) => x.leak, set: (x, v) => { x.leak = v; } },
      ],
      procedures: [{
        id: 'sequence', title: T('Start sequence (NFPA 20)', 'تسلسل التشغيل (NFPA 20)'),
        steps: [
          { text: T('Check that the suction supply is open: click the supervised suction OS&Y valve.', 'تأكد أن خط السحب مفتوح: انقر على صمام السحب OS&Y المراقَب.'), target: 'suction' },
          { text: T('Identify the jockey (pressure-maintenance) pump.', 'حدد مضخة الجوكي (حفظ الضغط).'), target: 'jockey' },
          { text: T(`Open a small demand (≈ 2 %). The jockey must start at ${BASE.jockeyStart} bar.`, `افتح طلباً صغيراً (≈ 2%). يجب أن تعمل مضخة الجوكي عند ${BASE.jockeyStart} بار.`), done: (x) => x.jockeyStarted },
          { text: T(`Increase the demand to ≈ 60 % (sprinklers operating). The electric fire pump starts at ${BASE.mainStart} bar.`, `ارفع الطلب إلى ≈ 60% (تشغيل الرشاشات). تعمل المضخة الكهربائية عند ${BASE.mainStart} بار.`), done: (x) => x.ps.mainState === 'running' },
          { text: T('Close the demand to 0 %. Does the electric fire pump stop by itself?', 'أغلق الطلب إلى 0%. هل تتوقف المضخة الكهربائية تلقائياً؟'), button: T('', ''), choices: [
            { text: T('Yes, when pressure recovers', 'نعم، عند عودة الضغط'), correct: false },
            { text: T('No — it must be stopped manually at the controller (NFPA 20)', 'لا — يجب إيقافها يدوياً من المتحكم (NFPA 20)'), correct: true }],
            explain: T('Fire pumps are never stopped automatically by pressure recovery; stop manually (or by a minimum-run timer on automatic start).', 'لا تتوقف مضخات الحريق آلياً بعودة الضغط؛ تُوقف يدوياً (أو بمؤقت أدنى تشغيل).') },
          { text: T('With the demand closed, stop the electric pump: click its controller (STOP).', 'مع إغلاق الطلب، أوقف المضخة الكهربائية: انقر على متحكمها (إيقاف).'), target: 'ctlElectric', onDo: (x, api) => { if (x.demand > 0.05) api.mistake('The system was still flowing — close the demand first!', 'المنظومة ما زالت تتدفق — أغلق الطلب أولاً!'); } },
          { text: T('Simulate a mains power failure: switch off "Mains power available".', 'حاكِ انقطاع الكهرباء: أطفئ "الكهرباء الرئيسية متوفرة".'), done: (x) => !x.power },
          { text: T(`Open the demand again (≈ 60 %). The electric pump cannot start; the diesel cranks at ${BASE.dieselStart} bar.`, `افتح الطلب مجدداً (≈ 60%). لا تعمل الكهربائية؛ ويبدأ الديزل عند ${BASE.dieselStart} بار.`), done: (x) => x.ps.dieselState === 'running' },
          { text: T('Close the demand, restore mains power, then stop the diesel pump at its controller.', 'أغلق الطلب وأعد الكهرباء ثم أوقف مضخة الديزل من متحكمها.'), target: 'ctlDiesel', onDo: (x, api) => { if (x.demand > 0.05 || !x.power) api.mistake('Close the demand and restore power before stopping.', 'أغلق الطلب وأعد الكهرباء قبل الإيقاف.'); } },
        ],
        result: () => `Set points: jockey ${BASE.jockeyStart}/${BASE.jockeyStop} bar · electric start ${BASE.mainStart} bar · diesel start ${BASE.dieselStart} bar (each step ≈ 0.35–0.7 bar lower, NFPA 20 A.14.2.6).`,
      }],
    };
  },
};

// ───────────────────────── Scene 2: annual flow test
export const flowTestScene = {
  id: 'flowtest', icon: '📈',
  title: T('Annual fire pump flow test (NFPA 25)', 'اختبار التدفق السنوي لمضخة الحريق (NFPA 25)'),
  summary: T('Run the pump at churn, 100 % and 150 % of rated flow through the flow-meter loop, record net pressure and compare with the acceptance curve.', 'شغّل المضخة عند الإغلاق و100% و150% من التدفق المقنن عبر دائرة العداد، وسجّل الضغط الصافي وقارنه بمنحنى القبول.'),
  build() {
    const s = buildRoom();
    const wear = 0.95 + Math.random() * 0.05;
    const st = makeState(wear);
    s.parts.ctlElectric.onPick = (state, api) => {
      if (state.ps.main > 0.05) { state.ps.manualStop(state.simT); api.msg('Electric pump stopped', 'تم إيقاف المضخة الكهربائية'); } else if (manualStart(state)) api.msg('Electric pump started manually', 'تم تشغيل المضخة يدوياً');
    };
    const record = (x, api) => {
      const net = x.ps.P - x.suction, q = x.Qtest;
      x.points.push({ q, net });
      api.msg(`Recorded: ${Math.round(q / GPM)} gpm @ ${net.toFixed(2)} bar net`, `تم التسجيل: ${Math.round(q / GPM)} جالون/د عند ${net.toFixed(2)} بار صافٍ`, 'good');
    };
    const passes = (x) => {
      const pts = x.points; if (pts.length < 3) return false;
      const a = (BASE.churnP - BASE.ratedP) / BASE.rated ** 2;
      const orig = (q) => BASE.churnP - a * q * q;
      return pts.every((p) => p.net >= 0.95 * orig(p.q)) && pts[0].net <= 1.4 * BASE.ratedP && pts[2].net >= 0.65 * BASE.ratedP;
    };
    const near = (x, f) => x.ps.main > 0.9 && Math.abs(x.Qtest - f * BASE.rated) < 0.05 * BASE.rated;
    return {
      ...common(s), state: st,
      overview: { pos: [12, 7, 12], target: [5, 1.3, 2] },
      reset(state) { Object.assign(state, makeState(0.95 + Math.random() * 0.05), { time: state.time }); },
      tick: (dt, state, api) => tickPumps(s, state, dt, api),
      controls: [
        { type: 'slider', label: T('Flow-test control valve opening', 'فتحة صمام اختبار التدفق'), min: 0, max: 1, step: 0.005, get: (x) => x.testValve, set: (x, v) => { x.testValve = v; }, fmt: (v) => `${Math.round(v * 100)} %` },
      ],
      chart(panel, x) {
        let cv = panel.querySelector('#trChart');
        if (!cv) { cv = document.createElement('canvas'); cv.id = 'trChart'; cv.width = 340; cv.height = 200; cv.className = 'tr-chart'; panel.querySelector('#trRead').after(cv); }
        const c = cv.getContext('2d'); c.clearRect(0, 0, 340, 200);
        const qmax = 1.7 * BASE.rated, pmax = BASE.churnP * 1.5;
        const X = (q) => 30 + (q / qmax) * 300, Y = (p) => 185 - (p / pmax) * 175;
        const a = (BASE.churnP - BASE.ratedP) / BASE.rated ** 2;
        const line = (f, col, dash = []) => { c.setLineDash(dash); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); for (let q = 0; q <= 1.55 * BASE.rated; q += BASE.rated / 30) { const p = f(q); q ? c.lineTo(X(q), Y(p)) : c.moveTo(X(q), Y(p)); } c.stroke(); c.setLineDash([]); };
        c.strokeStyle = '#999'; c.lineWidth = 1; c.strokeRect(30, 10, 300, 175);
        line((q) => BASE.churnP - a * q * q, '#2a78d6');
        line((q) => 0.95 * (BASE.churnP - a * q * q), '#e38a14', [5, 4]);
        c.fillStyle = '#dc2626';
        for (const p of x.points) { c.beginPath(); c.arc(X(p.q), Y(p.net), 5, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#666'; c.font = '11px sans-serif';
        c.fillText('bar (net)', 34, 22); c.fillText('flow →', 290, 180);
        c.fillStyle = '#2a78d6'; c.fillText('original curve', 200, 30); c.fillStyle = '#e38a14'; c.fillText('95 % limit', 200, 44);
      },
      procedures: [{
        id: 'flow', title: T('Performance test', 'اختبار الأداء'),
        steps: [
          { text: T('Notify the monitoring company / owner that the pump will be tested.', 'أبلغ شركة المراقبة والمالك بأن المضخة ستُختبر.'), button: T('Notified ✓', 'تم الإبلاغ ✓') },
          { text: T('Check the suction valve is open (click it).', 'تحقق من فتح صمام السحب (انقر عليه).'), target: 'suction' },
          { text: T('Start the electric fire pump manually at its controller.', 'شغّل المضخة الكهربائية يدوياً من متحكمها.'), target: 'ctlElectric', onDo: (x) => manualStart(x) },
          { text: T('Churn (no flow): keep the test valve closed, wait for full speed, then record.', 'الإغلاق (بدون تدفق): أبقِ صمام الاختبار مغلقاً وانتظر السرعة الكاملة ثم سجّل.'), button: T('Record reading', 'سجّل القراءة'), done: (x) => x.ps.main > 0.9 && x.testValve < 0.01, notYet: T('Pump not at full speed or valve open', 'المضخة ليست بالسرعة الكاملة أو الصمام مفتوح'), onDo: record },
          { text: T(`Open the test valve until the flow meter reads 100 % (${BASE.ratedGpm} gpm), then record.`, `افتح صمام الاختبار حتى يقرأ العداد 100% (${BASE.ratedGpm} جالون/د) ثم سجّل.`), button: T('Record reading', 'سجّل القراءة'), done: (x) => near(x, 1), notYet: T('Flow is not within ±5 % of rated', 'التدفق ليس ضمن ±5% من المقنن'), onDo: record },
          { text: T(`Open further to 150 % (${Math.round(BASE.ratedGpm * 1.5)} gpm), then record.`, `افتح أكثر حتى 150% (${Math.round(BASE.ratedGpm * 1.5)} جالون/د) ثم سجّل.`), button: T('Record reading', 'سجّل القراءة'), done: (x) => near(x, 1.5), notYet: T('Flow is not within ±5 % of 150 %', 'التدفق ليس ضمن ±5% من 150%'), onDo: record },
          { text: T('Compare the three points with the original curve (≥ 95 %), churn ≤ 140 % and ≥ 65 % at 150 %. Result?', 'قارن النقاط الثلاث بالمنحنى الأصلي (≥ 95%) والإغلاق ≤ 140% و≥ 65% عند 150%. النتيجة؟'), button: T('', ''), choices: [
            { text: T('PASS', 'ناجح'), correct: (x) => passes(x) }, { text: T('FAIL – pump needs repair', 'راسب – المضخة تحتاج إصلاح'), correct: (x) => !passes(x) }],
            explain: T('Acceptance: every point within 95 % of the original (or last accepted) curve.', 'القبول: كل نقطة ضمن 95% من المنحنى الأصلي (أو آخر منحنى مقبول).') },
          { text: T('Close the test valve and stop the pump at the controller.', 'أغلق صمام الاختبار وأوقف المضخة من المتحكم.'), target: 'ctlElectric', onDo: (x, api) => { if (x.testValve > 0.02) api.mistake('Close the test valve before stopping.', 'أغلق صمام الاختبار قبل الإيقاف.'); x.ps.manualStop(x.simT); } },
        ],
        result: (x) => `Pump condition factor in this run: ${(x.wear * x.wear * 100).toFixed(0)} % of original pressure → ${passes(x) ? 'PASS' : 'FAIL'}.`,
      }],
    };
  },
};
