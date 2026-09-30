// Scenes 3 & 4 — Dry-pipe valve trip test & reset, and floor control riser assembly (alarm & tamper tests).
import * as THREE from 'three';
import { MAT, tag, room, gauge, osyValve, butterflyValve, Stream, V, box, cyl, pipe, label3D } from './parts.js';
import { tr } from '../i18n.js';

const T = (en, ar) => ({ en, ar });
const AIR = new THREE.MeshStandardMaterial({ color: 0xe8c547, roughness: 0.45, metalness: 0.3 });
const WET = new THREE.MeshStandardMaterial({ color: 0x2f7fd6, roughness: 0.35, metalness: 0.3 });

function lampMat(col) { return new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.05 }); }

/** Small fire alarm control panel with FIRE / SUPERVISORY / TROUBLE lamps. */
function facp() {
  const g = new THREE.Group();
  g.add(box(0.7, 0.9, 0.15, new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 }), 0, 0, 0));
  g.add(box(0.5, 0.18, 0.02, new THREE.MeshStandardMaterial({ color: 0x0b2e13 }), 0, 0.6, 0.08));
  const lamps = {};
  [['fire', 0xff2222, -0.2], ['sup', 0xffc400, 0], ['trouble', 0xffa600, 0.2]].forEach(([k, c, x]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), lampMat(c)); m.position.set(x, 0.42, 0.09); g.add(m); lamps[k] = m;
  });
  g.add(label3D('FIRE ALARM PANEL', { size: 0.06, bg: 'rgba(0,0,0,0.85)' }).translateY(0.8).translateZ(0.08));
  g.lamp = (k, on, blink = 0) => { lamps[k].material.emissiveIntensity = on ? (blink && Math.sin(blink * 8) < 0 ? 0.3 : 3) : 0.05; };
  return g;
}

// ───────────────────────── Scene 3: dry-pipe valve
export const dryPipeScene = {
  id: 'drypipe', icon: '🧊',
  title: T('Dry-pipe valve: trip test & reset', 'صمام الأنابيب الجافة: اختبار الفصل وإعادة الضبط'),
  summary: T('Air holds the clapper closed; opening the inspector’s test lets air escape, the valve trips and water must reach the test outlet within the NFPA 13 limit. Then restore the system step by step.', 'يحفظ الهواء المصراع مغلقاً؛ فتح وصلة المفتش يسرّب الهواء فيفصل الصمام ويجب أن يصل الماء إلى المخرج ضمن حد NFPA 13. ثم أعد المنظومة للخدمة خطوة بخطوة.'),
  build() {
    const root = new THREE.Group();
    const parts = {};
    const P = (id, obj, name, info, extra = {}) => { tag(obj, id); parts[id] = { obj, name, info, ...extra }; root.add(obj); return obj; };
    root.add(room(20, 10, 6));
    // supply & control valve
    root.add(pipe([V(-7, -0.3, 0), V(-7, 1.0, 0)], 0.16, WET));
    const ctl = osyValve(0.2); ctl.position.set(-7, 1.0, 0);
    P('control', ctl, T('Control valve (OS&Y, supervised)', 'صمام التحكم OS&Y (مراقَب)'), T('Shuts off the water supply to the dry-pipe valve. Must be closed first when resetting and opened slowly last.', 'يقطع إمداد المياه عن صمام الأنابيب الجافة. يُغلق أولاً عند إعادة الضبط ويُفتح ببطء في النهاية.'));
    root.add(pipe([V(-7, 1.3, 0), V(-7, 1.9, 0)], 0.16, WET));
    // dry pipe valve body with see-through window & clapper
    const dpv = new THREE.Group(); dpv.position.set(-7, 2.5, 0);
    dpv.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshStandardMaterial({ color: 0xc4161c, roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.55 })));
    dpv.add(cyl(0.3, 0.06, MAT.red, 0, -0.45, 0, 20)); dpv.add(cyl(0.3, 0.06, MAT.red, 0, 0.42, 0, 20));
    const cover = box(0.36, 0.36, 0.06, MAT.red, 0, -0.18, 0.42); dpv.add(cover);
    const clapper = new THREE.Group(); clapper.position.set(-0.22, 0, 0);
    clapper.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20), MAT.brass).translateX(0.22));
    dpv.add(clapper);
    dpv.add(label3D('DRY PIPE VALVE', { size: 0.08 }).translateY(0.62).translateZ(0.3));
    P('dpv', dpv, T('Dry-pipe valve (differential clapper)', 'صمام الأنابيب الجافة (مصراع تفاضلي)'), T('A large air-side clapper area lets low air pressure (≈ 2.8 bar / 40 psi) hold back higher water pressure (ratio ≈ 5.5 : 1). When air is lost the clapper trips open and latches; it must be reset by hand.', 'مساحة المصراع الكبيرة من جهة الهواء تسمح لضغط هواء منخفض (≈ 2.8 بار) بحجز ضغط ماء أعلى (نسبة ≈ 5.5:1). عند فقدان الهواء ينفتح المصراع وينغلق على وضع الفتح ويجب إعادته يدوياً.'));
    const wg = gauge(16, 'bar', 'WATER'); wg.position.set(-6.45, 2.2, 0.25); root.add(wg);
    const ag = gauge(6, 'bar', 'AIR'); ag.position.set(-6.45, 2.85, 0.25); root.add(ag);
    tag(ag, 'airgauge'); parts.airgauge = { obj: ag, name: T('Air & water pressure gauges', 'مقياسا ضغط الهواء والماء'), info: T('Water gauge below the clapper (supply), air gauge above (system). Record both before every test.', 'مقياس الماء تحت المصراع (الإمداد) ومقياس الهواء فوقه (المنظومة). سجّل القراءتين قبل كل اختبار.') };
    // accelerator
    const acc = new THREE.Group(); acc.position.set(-7.6, 3.1, 0.1); acc.add(cyl(0.12, 0.4, MAT.galv, 0, 0, 0, 16)); acc.add(pipe([V(0.1, 0.2, 0), V(0.5, 0.2, 0)], 0.02, MAT.brass));
    P('accel', acc, T('Accelerator (quick-opening device)', 'المسرّع (جهاز الفتح السريع)'), T('Senses the rapid air-pressure drop and trips the valve early; required on systems > 500 gal with low-pressure trip or when water delivery time would be too long.', 'يستشعر هبوط ضغط الهواء السريع ويفصل الصمام مبكراً؛ مطلوب عندما يطول زمن وصول الماء.'));
    // compressor
    const comp = new THREE.Group(); comp.position.set(-4.8, 0, -3);
    comp.add(cyl(0.3, 1.1, MAT.galv, 0, 0.2, 0, 16).rotateZ(Math.PI / 2)); comp.add(box(0.5, 0.4, 0.4, MAT.blueMotor, 0, 0.75, 0));
    comp.add(pipe([V(0, 0.9, 0), V(0, 3.2, 0), V(-2.0, 3.2, 0), V(-2.0, 3.2, 3)], 0.02, MAT.brass));
    P('compressor', comp, T('Air compressor & air maintenance device', 'ضاغط الهواء وجهاز حفظ الهواء'), T('Restores system air after reset; must refill the system to normal pressure within 30 minutes (NFPA 13).', 'يعيد ضغط الهواء بعد الضبط، ويجب أن يملأ المنظومة خلال 30 دقيقة (NFPA 13).'));
    // main drain & aux drain & ball drip
    const md = new THREE.Group(); md.position.set(-6.5, 1.65, 0);
    md.add(pipe([V(0, 0, 0), V(0.8, 0, 0), V(0.8, 0, -4.8), V(0.8, 1.5, -4.8)], 0.06, MAT.galv));
    md.add(cyl(0.08, 0.2, MAT.brass, 0.4, -0.1, 0, 12));
    P('maindrain', md, T('Main drain valve (2")', 'صمام التصريف الرئيسي (2 بوصة)'), T('Drains the riser after a trip and is used for the 2-inch main-drain test of the water supply (compare static & residual pressure).', 'يصرف الرايزر بعد الفصل ويُستخدم لاختبار التصريف الرئيسي لمصدر المياه (مقارنة الضغط الساكن والمتبقي).'));
    const bd = new THREE.Group(); bd.position.set(-7.35, 2.0, 0.2); bd.add(cyl(0.05, 0.25, MAT.brass, 0, 0, 0, 10)); bd.add(box(0.06, 0.06, 0.06, MAT.dark, 0, 0.28, 0));
    P('balldrip', bd, T('Ball drip / velocity drip', 'صمام التنقيط الكروي'), T('Drains the intermediate chamber; after a trip push the plunger to confirm no water leaks past the clapper seat.', 'يصرف الحجرة الوسيطة؛ بعد الفصل اضغط المكبس للتأكد من عدم تسرب الماء من مقعد المصراع.'));
    // overhead system piping (colour shows air → water)
    const path = [V(-7, 2.9, 0), V(-7, 5.2, 0), V(8, 5.2, 0), V(8, 5.2, 3.5), V(8, 1.4, 3.5)];
    const segs = [];
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1], len = a.distanceTo(b), n = Math.ceil(len / 1.0);
      for (let k = 0; k < n; k++) {
        const p0 = a.clone().lerp(b, k / n), p1 = a.clone().lerp(b, (k + 1) / n);
        const m = pipe([p0, p1], i === 0 ? 0.13 : 0.08, AIR); root.add(m);
        segs.push({ m, d: dist + (len * k) / n });
      }
      dist += len;
    }
    for (let x = -4; x <= 6; x += 3) {
      root.add(pipe([V(x, 5.2, 0), V(x, 5.2, -3.5)], 0.035, AIR));
      for (const z of [-1, -2.5]) { root.add(cyl(0.03, 0.18, MAT.brass, x, 5.24, z, 8)); root.add(cyl(0.07, 0.01, MAT.brass, x, 5.42, z, 12)); }
    }
    const pathLen = dist;
    // inspector's test connection
    const itc = new THREE.Group(); itc.position.set(8, 1.4, 3.5);
    itc.add(cyl(0.07, 0.22, MAT.brass, 0, -0.15, 0, 12)); itc.add(box(0.14, 0.14, 0.14, MAT.glass, 0, -0.4, 0));
    itc.add(label3D("INSPECTOR'S TEST", { size: 0.08 }).translateY(0.3).translateZ(0.12));
    P('itc', itc, T("Inspector's test connection (ITC)", 'وصلة اختبار المفتش (ITC)'), T('At the most remote point; has an orifice equal to the smallest sprinkler. Opening it simulates one sprinkler operating and measures the water delivery time.', 'في أبعد نقطة، بفتحة تعادل أصغر رشاش. فتحها يحاكي تشغيل رشاش واحد ويقيس زمن وصول الماء.'));
    const aux = new THREE.Group(); aux.position.set(8, 5.2, 0); aux.add(box(0.18, 0.4, 0.18, MAT.galv, 0, -0.5, 0)); aux.add(cyl(0.05, 0.15, MAT.brass, 0, -0.75, 0, 10));
    P('auxdrain', aux, T('Auxiliary drain / drum drip (low point)', 'التصريف المساعد / مصيدة التكثف (نقطة منخفضة)'), T('Collects condensate at low points; must be drained after a trip and regularly in cold weather to avoid freezing.', 'تجمع التكثف في النقاط المنخفضة، ويجب تصريفها بعد الفصل وبانتظام في الطقس البارد لتجنب التجمد.'));
    // alarm: water motor gong
    const gong = new THREE.Group(); gong.position.set(-9.8, 3.5, 1.5); gong.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.red).rotateX(-Math.PI / 2));
    root.add(pipe([V(-7.3, 2.3, 0), V(-9.7, 2.3, 0), V(-9.7, 3.5, 1.3)], 0.025, MAT.galv));
    P('gong', gong, T('Water motor gong & pressure alarm switch', 'جرس المحرك المائي ومفتاح إنذار الضغط'), T('Water entering the alarm line after a trip drives the gong outside the building and operates the pressure switch that signals the fire alarm panel.', 'الماء الداخل لخط الإنذار بعد الفصل يدير الجرس خارج المبنى ويشغّل مفتاح الضغط الذي يرسل إشارة للوحة الإنذار.'));
    const stream = new Stream(root, { n: 220, size: 0.05 });
    const st = {};
    const reset = (x, mode) => {
      Object.assign(x, { Pa: 2.8, Pw: 6.5, set: 2.8, tripped: false, front: 0, itcOpen: false, tTest: null, tTrip: null, tWater: null, ctlOpen: 1, mainDrain: false, auxDrain: false, ballDrip: false, clapperSet: true, compOn: false, accel: x.accel ?? false, hazardLimit: 50, drained: false, notified: false });
      if (mode === 'reset') { Object.assign(x, { Pa: 0, tripped: true, front: pathLen, clapperSet: false }); }
    };
    reset(st);
    const tripPoint = (x) => (x.accel ? x.set - 0.35 : x.Pw / 5.5);
    parts.itc.onPick = (x, api) => { x.itcOpen = !x.itcOpen; if (x.itcOpen) { x.tTest = x.time; api.msg("Inspector's test OPEN — stopwatch started", 'تم فتح وصلة المفتش — بدأ التوقيت'); } else api.msg("Inspector's test closed", 'تم إغلاق وصلة المفتش'); };
    parts.control.onPick = (x, api) => { x.ctlTarget = x.ctlOpen > 0.5 ? 0 : 1; api.msg(x.ctlTarget ? 'Opening control valve slowly…' : 'Closing control valve…', x.ctlTarget ? 'جارٍ فتح صمام التحكم ببطء…' : 'جارٍ إغلاق صمام التحكم…'); };
    parts.maindrain.onPick = (x, api) => { x.mainDrain = !x.mainDrain; api.msg(x.mainDrain ? 'Main drain OPEN' : 'Main drain closed', x.mainDrain ? 'التصريف الرئيسي مفتوح' : 'التصريف الرئيسي مغلق'); };
    parts.auxdrain.onPick = (x, api) => { x.auxDrain = !x.auxDrain; api.msg(x.auxDrain ? 'Auxiliary drains open' : 'Auxiliary drains closed', x.auxDrain ? 'التصريفات المساعدة مفتوحة' : 'التصريفات المساعدة مغلقة'); };
    parts.balldrip.onPick = (x, api) => { x.ballDrip = true; api.msg('Ball-drip plunger pushed: no leakage past the seat', 'تم ضغط مكبس التنقيط: لا تسرب من المقعد'); };
    parts.compressor.onPick = (x, api) => { x.compOn = !x.compOn; api.msg(x.compOn ? 'Air compressor running' : 'Air compressor off', x.compOn ? 'ضاغط الهواء يعمل' : 'ضاغط الهواء متوقف'); };
    parts.dpv.onPick = (x, api) => {
      if (!x.tripped) return api.msg('Valve is set (clapper closed).', 'الصمام مضبوط (المصراع مغلق).');
      if (x.ctlOpen > 0.05) return api.mistake('Close the control valve before opening the valve cover!', 'أغلق صمام التحكم قبل فتح غطاء الصمام!');
      if (x.front > 0.5) return api.mistake('Drain the system first.', 'صرّف المنظومة أولاً.');
      x.clapperSet = true; x.tripped = false; api.msg('Clapper reseated and latch reset', 'تمت إعادة المصراع ومزلاجه', 'good');
    };
    return {
      root, parts, state: st,
      overview: { pos: [-1.5, 5.2, 9.5], target: [-3, 2.6, 0] },
      env: { biome: 'desert', sunElevation: 60, sunAzimuth: 200, radius: 40, shadowSize: 22 },
      reset,
      controls: [{ type: 'toggle', label: T('Accelerator installed', 'المسرّع مركّب'), get: (x) => x.accel, set: (x, v) => { x.accel = v; } }],
      tick(dt, x, api) {
        // air
        let leak = x.itcOpen && x.front < pathLen ? 1 / 40 : 0;
        if (x.tripped) leak += 1 / 3;
        if (x.mainDrain || x.auxDrain) leak += x.tripped ? 0 : 0;
        x.Pa = Math.max(0, x.Pa - x.Pa * leak * dt);
        if (x.compOn && !x.tripped && x.clapperSet) x.Pa = Math.min(x.set, x.Pa + 0.05 * dt * 10);
        // trip
        if (!x.tripped && x.clapperSet && x.ctlOpen > 0.5 && x.Pa < tripPoint(x)) { x.tripped = true; x.clapperSet = false; x.tTrip = x.time; api.msg(`Dry-pipe valve TRIPPED at ${x.Pa.toFixed(2)} bar air`, `فصل صمام الأنابيب الجافة عند ${x.Pa.toFixed(2)} بار هواء`, 'bad'); }
        // control valve travel
        if (x.ctlTarget !== undefined) { const d = x.ctlTarget - x.ctlOpen; x.ctlOpen += Math.sign(d) * Math.min(Math.abs(d), dt * 0.25); }
        ctl.setOpen(x.ctlOpen);
        // water front
        const supply = x.tripped && x.ctlOpen > 0.1;
        if (supply && x.front < pathLen) x.front = Math.min(pathLen, x.front + dt * 1.15 * x.ctlOpen);
        if (!supply && (x.mainDrain || x.auxDrain) && x.front > 0) x.front = Math.max(0, x.front - dt * (x.mainDrain ? 2.5 : 0.8));
        if (x.front >= pathLen && x.itcOpen && x.tWater === null && x.tTest !== null) { x.tWater = x.time; api.msg(`Water at inspector's test: ${(x.tWater - x.tTest).toFixed(0)} s`, `وصل الماء إلى وصلة المفتش: ${(x.tWater - x.tTest).toFixed(0)} ث`, 'bad'); }
        for (const sgm of segs) { const w = sgm.d < x.front; for (const c of sgm.m.children) c.material = w ? WET : AIR; }
        clapper.rotation.z = x.clapperSet ? 0 : -1.2;
        ag.set(x.Pa); wg.set(x.ctlOpen > 0.1 ? x.Pw * (supply ? 0.8 : 1) : 0);
        stream.set(x.itcOpen ? (x.front >= pathLen ? 1 : 0.25) : 0, V(8, 0.9, 3.5), V(0, -1, 0.25), x.front >= pathLen ? 2 : 0.6, 0.2);
        stream.update(dt);
        gong.rotation.y = x.tripped && supply ? x.time * 20 : 0;
      },
      readouts: (x) => [
        [T('Air pressure (system)', 'ضغط الهواء (المنظومة)'), `${x.Pa.toFixed(2)} bar`],
        [T('Water pressure (supply)', 'ضغط الماء (الإمداد)'), `${x.ctlOpen > 0.1 ? x.Pw.toFixed(1) : '0.0'} bar`],
        [T('Trip point', 'نقطة الفصل'), `${tripPoint(x).toFixed(2)} bar${x.accel ? ' (accelerator)' : ''}`],
        [T('Valve', 'الصمام'), x.tripped ? tr(T('TRIPPED', 'مفصول')) : tr(T('set', 'مضبوط')), x.tripped ? 'alarm' : ''],
        [T('Water front', 'مقدمة الماء'), `${x.front.toFixed(1)} / ${pathLen.toFixed(0)} m`],
        [T('Stopwatch', 'المؤقت'), x.tTest !== null ? `${((x.tWater ?? x.time) - x.tTest).toFixed(0)} s` : '—'],
        [T('Delivery limit (OH, > 750 gal)', 'حد الوصول (خطورة عادية)'), '50 s'],
        [T('Control valve', 'صمام التحكم'), `${Math.round(x.ctlOpen * 100)} %`],
      ],
      animate: () => {},
      procedures: [
        {
          id: 'trip', title: T('Full trip test', 'اختبار الفصل الكامل'),
          setup: (x) => reset(x),
          steps: [
            { text: T('Notify the monitoring company, owner and fire department that the system will be tested.', 'أبلغ شركة المراقبة والمالك والدفاع المدني بأن المنظومة ستُختبر.'), button: T('Notified ✓', 'تم الإبلاغ ✓') },
            { text: T('Record air and water pressures before the test (click the gauges).', 'سجّل ضغطي الهواء والماء قبل الاختبار (انقر على المقياسين).'), target: 'airgauge', onDo: (x, api) => api.msg(`Air ${x.Pa.toFixed(2)} bar · water ${x.Pw} bar`, `هواء ${x.Pa.toFixed(2)} بار · ماء ${x.Pw} بار`, 'good') },
            { text: T("Open the inspector's test connection — the stopwatch starts.", 'افتح وصلة اختبار المفتش — يبدأ المؤقت.'), target: 'itc' },
            { text: T('Watch the air pressure fall until the dry-pipe valve trips.', 'راقب هبوط ضغط الهواء حتى يفصل الصمام.'), done: (x) => x.tripped },
            { text: T("Wait for water to flow at the inspector's test outlet.", 'انتظر تدفق الماء من مخرج وصلة المفتش.'), done: (x) => x.tWater !== null },
            { text: T('Compare the water delivery time with the 50 s limit (ordinary hazard). Result?', 'قارن زمن وصول الماء بحد 50 ثانية (خطورة عادية). النتيجة؟'), button: T('', ''), choices: [
              { text: T('PASS (≤ 50 s)', 'ناجح (≤ 50 ث)'), correct: (x) => x.tWater - x.tTest <= 50 },
              { text: T('FAIL — add an accelerator / reduce system volume', 'راسب — أضف مسرّعاً أو قلّل حجم المنظومة'), correct: (x) => x.tWater - x.tTest > 50 }],
              explain: T('NFPA 13: systems > 750 gal must deliver water in 60 s (LH), 50 s (OH), 45 s (EH).', 'NFPA 13: المنظومات > 750 جالون يجب أن توصل الماء خلال 60 ث (خفيفة) و50 ث (عادية) و45 ث (عالية).') },
            { text: T("Close the inspector's test connection.", 'أغلق وصلة اختبار المفتش.'), target: 'itc' },
          ],
          result: (x) => `Trip at ${x.tTrip !== null ? (x.tTrip - x.tTest).toFixed(0) : '?'} s, water at ${x.tWater !== null ? (x.tWater - x.tTest).toFixed(0) : '?'} s (accelerator: ${x.accel ? 'yes' : 'no'}). Try again with the accelerator switched ${x.accel ? 'off' : 'on'}.`,
        },
        {
          id: 'reset', title: T('Reset after a trip', 'إعادة الضبط بعد الفصل'),
          setup: (x) => reset(x, 'reset'),
          steps: [
            { text: T('Close the control valve (OS&Y) to stop the water supply.', 'أغلق صمام التحكم (OS&Y) لإيقاف إمداد المياه.'), target: 'control', done: (x) => x.ctlOpen < 0.02 },
            { text: T('Open the main drain to drain the riser.', 'افتح التصريف الرئيسي لتصريف الرايزر.'), target: 'maindrain' },
            { text: T('Open the auxiliary drains / drum drips at the low points.', 'افتح التصريفات المساعدة ومصائد التكثف في النقاط المنخفضة.'), target: 'auxdrain', done: (x) => x.front <= 0.01 },
            { text: T('Push the ball-drip plunger to check the intermediate chamber.', 'اضغط مكبس التنقيط الكروي لفحص الحجرة الوسيطة.'), target: 'balldrip' },
            { text: T('Replace any operated sprinklers with the same type, K-factor and temperature rating.', 'استبدل أي رشاشات عملت بنفس النوع ومعامل K ودرجة الحرارة.'), button: T('Done ✓', 'تم ✓') },
            { text: T('Open the valve cover and reseat the clapper (reset the latch).', 'افتح غطاء الصمام وأعد المصراع إلى مقعده (أعد المزلاج).'), target: 'dpv', done: (x) => x.clapperSet },
            { text: T('Close the main and auxiliary drains.', 'أغلق التصريف الرئيسي والتصريفات المساعدة.'), target: 'maindrain', onDo: (x) => { x.mainDrain = false; x.auxDrain = false; } },
            { text: T('Start the air compressor and restore air to the set pressure (≈ 2.8 bar).', 'شغّل ضاغط الهواء وأعد ضغط الهواء إلى قيمة الضبط (≈ 2.8 بار).'), target: 'compressor', done: (x) => x.Pa >= 2.7 },
            { text: T('Slowly open the control valve fully (water must stay below the clapper).', 'افتح صمام التحكم ببطء بالكامل (يجب أن يبقى الماء تحت المصراع).'), target: 'control', done: (x) => x.ctlOpen > 0.98 && !x.tripped },
          ],
        },
      ],
    };
  },
};

// ───────────────────────── Scene 4: floor control riser assembly
export const floorValveScene = {
  id: 'floorvalve', icon: '🚿',
  title: T('Floor control valve assembly: alarm & tamper tests', 'مجموعة صمام التحكم بالطابق: اختبار الإنذار ومفتاح العبث'),
  summary: T('Zone control valve with tamper switch, waterflow switch with retard, gauge, test-and-drain with sight glass and PRV. Run the waterflow alarm test and the valve supervisory test.', 'صمام تحكم المنطقة بمفتاح عبث، ومفتاح تدفق بمؤخّر، ومقياس، وصمام اختبار وتصريف بزجاج رؤية، وصمام خفض ضغط. نفّذ اختبار إنذار التدفق واختبار الإشراف على الصمام.'),
  build() {
    const root = new THREE.Group();
    const parts = {};
    const P = (id, obj, name, info) => { tag(obj, id); parts[id] = { obj, name, info }; root.add(obj); return obj; };
    root.add(room(10, 7, 4.2));
    root.add(pipe([V(-3.5, -0.3, -2.8), V(-3.5, 4.2, -2.8)], 0.16, MAT.red));
    root.add(label3D('WET RISER', { size: 0.15 }).translateX(-3.2).translateY(3.4).translateZ(-2.6));
    root.add(pipe([V(-3.5, 1.6, -2.8), V(-2.8, 1.6, -2.8)], 0.1, MAT.red));
    const cv = osyValve(0.12); cv.position.set(-2.6, 1.6, -2.8); cv.rotation.z = -Math.PI / 2;
    P('control', cv, T('Floor control valve with tamper switch', 'صمام التحكم بالطابق مع مفتاح العبث'), T('Isolates this floor for maintenance. Its tamper (supervisory) switch must signal the panel within two revolutions of the handwheel or 1/5 of travel (NFPA 72).', 'يعزل هذا الطابق للصيانة. يجب أن يرسل مفتاح العبث إشارة للوحة خلال دورتين من العجلة أو خُمس المشوار (NFPA 72).'));
    root.add(pipe([V(-2.3, 1.6, -2.8), V(-1.4, 1.6, -2.8)], 0.1, MAT.red));
    const fs = new THREE.Group(); fs.position.set(-1.1, 1.6, -2.8); fs.add(cyl(0.11, 0.3, MAT.red, 0, -0.15, 0, 16).rotateZ(Math.PI / 2)); fs.add(box(0.18, 0.2, 0.14, MAT.white, 0, 0.18, 0));
    const paddle = box(0.02, 0.16, 0.12, MAT.brass, 0, -0.05, 0); fs.add(paddle);
    P('flowswitch', fs, T('Waterflow switch (paddle type) with retard', 'مفتاح تدفق الماء (بالريشة) مع مؤخّر'), T('A paddle in the pipe deflects when water flows; a pneumatic retard (≈ 30–90 s) filters pressure surges. The alarm must be received within 90 s of flow (NFPA 72).', 'ريشة داخل الأنبوب تنحرف عند التدفق، ومؤخّر (≈ 30–90 ث) يمنع الإنذارات الكاذبة من تموجات الضغط. يجب استلام الإنذار خلال 90 ث من التدفق (NFPA 72).'));
    root.add(pipe([V(-0.9, 1.6, -2.8), V(0.4, 1.6, -2.8)], 0.1, MAT.red));
    const gg = gauge(16, 'bar', ''); gg.position.set(-0.3, 1.95, -2.62); root.add(gg);
    tag(gg, 'gauge'); parts.gauge = { obj: gg, name: T('Pressure gauge', 'مقياس الضغط'), info: T('Shows floor pressure; after the PRV it must stay within the sprinkler rating (≤ 12.1 bar).', 'يعرض ضغط الطابق؛ وبعد صمام خفض الضغط يجب ألا يتجاوز تصنيف الرشاشات (≤ 12.1 بار).') };
    const prv = new THREE.Group(); prv.position.set(0.7, 1.6, -2.8); prv.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), MAT.red)); prv.add(cyl(0.08, 0.3, MAT.red, 0, 0.16, 0, 12)); prv.add(cyl(0.05, 0.1, MAT.brass, 0, 0.46, 0, 10));
    P('prv', prv, T('Pressure-reducing valve (PRV)', 'صمام خفض الضغط (PRV)'), T('Used on lower floors of high-rise zones so sprinkler pressure does not exceed 12.1 bar (175 psi). Must be flow-tested every 5 years (NFPA 25).', 'يُستخدم في الطوابق السفلى من مناطق الأبراج كي لا يتجاوز ضغط الرشاشات 12.1 بار. يُختبر بالتدفق كل 5 سنوات (NFPA 25).'));
    root.add(pipe([V(0.9, 1.6, -2.8), V(1.6, 1.6, -2.8), V(1.6, 3.9, -2.8), V(1.6, 3.9, 2.5)], 0.08, MAT.red));
    for (let x = 1.6; x <= 4.6; x += 3) for (const z of [-1.5, 1.2]) { root.add(pipe([V(1.6, 3.9, z), V(4.6, 3.9, z)], 0.03, MAT.red)); root.add(cyl(0.03, 0.12, MAT.brass, x + 1.5, 3.72, z, 8)); }
    const td = new THREE.Group(); td.position.set(-0.3, 1.1, -2.8);
    td.add(pipe([V(0, 0.5, 0), V(0, -0.2, 0), V(0, -0.2, 0.35), V(-3.1, -0.2, 0.35), V(-3.1, -1.4, 0.35)], 0.04, MAT.galv));
    td.add(box(0.12, 0.12, 0.12, MAT.glass, 0, -0.2, 0.18)); td.add(box(0.14, 0.1, 0.1, MAT.brass, 0, 0.05, 0.05));
    td.add(label3D('TEST & DRAIN', { size: 0.07 }).translateY(0.2).translateZ(0.12));
    P('testdrain', td, T('Test-and-drain valve with sight glass', 'صمام الاختبار والتصريف بزجاج الرؤية'), T('Three-position valve (off / test / drain). "Test" flows through an orifice equal to the smallest sprinkler to prove the flow switch; the sight glass shows water flowing.', 'صمام بثلاثة أوضاع (إغلاق/اختبار/تصريف). وضع الاختبار يمرر الماء عبر فتحة تعادل أصغر رشاش لإثبات عمل مفتاح التدفق، وزجاج الرؤية يُظهر التدفق.'));
    const panel = facp(); panel.position.set(3.5, 1.4, -3.3);
    P('facp', panel, T('Fire alarm control panel (FACP)', 'لوحة التحكم بإنذار الحريق'), T('Receives the waterflow (alarm) and tamper (supervisory) signals; press RESET after the condition clears.', 'تستقبل إشارات تدفق الماء (إنذار) والعبث (إشراف)؛ اضغط إعادة الضبط بعد زوال الحالة.'));
    const stream = new Stream(root, { n: 120, size: 0.04 });
    const st = {};
    const reset = (x) => Object.assign(x, { open: 1, target: 1, td: false, flowT: null, alarm: false, sup: false, latchedAlarm: false, latchedSup: false, tAlarm: null, retard: 30 });
    reset(st);
    parts.testdrain.onPick = (x, api) => { x.td = !x.td; if (x.td) x.tOpen = x.time; api.msg(x.td ? 'Test valve OPEN (test position)' : 'Test valve closed', x.td ? 'صمام الاختبار مفتوح' : 'صمام الاختبار مغلق'); };
    parts.control.onPick = (x, api) => { x.target = x.target < 1 ? 1 : 0.6; api.msg(x.target < 1 ? 'Closing the control valve (turning handwheel)…' : 'Re-opening the control valve fully…', x.target < 1 ? 'جارٍ إغلاق صمام التحكم (تدوير العجلة)…' : 'جارٍ إعادة فتح الصمام بالكامل…'); };
    parts.facp.onPick = (x, api) => {
      if ((x.latchedAlarm && !x.alarm) || (x.latchedSup && !x.sup)) { x.latchedAlarm = x.alarm; x.latchedSup = x.sup; api.msg('Panel RESET — normal', 'تمت إعادة ضبط اللوحة — طبيعي', 'good'); }
      else if (x.alarm || x.sup) api.mistake('Condition still present — cannot reset yet.', 'الحالة ما زالت قائمة — لا يمكن إعادة الضبط.');
      else api.msg('Panel normal', 'اللوحة طبيعية');
    };
    return {
      root, parts, state: st, reset,
      overview: { pos: [1.5, 3.5, 5.5], target: [-0.8, 1.6, -2.6] },
      env: { biome: 'desert', sunElevation: 60, sunAzimuth: 200, radius: 30, shadowSize: 14 },
      tick(dt, x, api) {
        const d = x.target - x.open; x.open += Math.sign(d) * Math.min(Math.abs(d), dt * 0.12);
        cv.setOpen(x.open);
        const flowing = x.td && x.open > 0.2;
        const q = flowing ? 80.6 * Math.sqrt(5) : 0;
        x.Q = q;
        paddle.rotation.z = flowing ? 0.6 : 0;
        if (flowing) { if (x.flowT === null) x.flowT = x.time; } else x.flowT = null;
        const wasA = x.alarm, wasS = x.sup;
        x.alarm = x.flowT !== null && x.time - x.flowT >= x.retard;
        x.sup = x.open < 0.9;
        if (x.alarm && !wasA) { x.latchedAlarm = true; x.tAlarm = x.time - x.tOpen; api.msg(`WATERFLOW ALARM at FACP after ${x.tAlarm.toFixed(0)} s`, `إنذار تدفق الماء في اللوحة بعد ${x.tAlarm.toFixed(0)} ث`, 'bad'); }
        if (x.sup && !wasS) { x.latchedSup = true; api.msg('SUPERVISORY: floor control valve not fully open', 'إشراف: صمام التحكم بالطابق غير مفتوح بالكامل', 'bad'); }
        panel.lamp('fire', x.latchedAlarm, x.alarm ? x.time : 0); panel.lamp('sup', x.latchedSup, x.sup ? x.time : 0);
        gg.set(x.open > 0.2 ? (flowing ? 4.6 : 5.0) : 0);
        stream.set(flowing ? 1 : 0, V(-3.4, -0.25, -2.45), V(0, -1, 0), 1.5, 0.15); stream.update(dt);
      },
      readouts: (x) => [
        [T('Test valve', 'صمام الاختبار'), x.td ? tr(T('OPEN', 'مفتوح')) : tr(T('closed', 'مغلق')), x.td ? 'warn' : ''],
        [T('Flow through test orifice', 'التدفق عبر فتحة الاختبار'), `${Math.round(x.Q || 0)} L/min`],
        [T('Retard timer', 'مؤقت التأخير'), x.flowT !== null ? `${Math.min(x.retard, x.time - x.flowT).toFixed(0)} / ${x.retard} s` : '—'],
        [T('Control valve open', 'فتح صمام التحكم'), `${Math.round(x.open * 100)} %`],
        [T('FACP', 'اللوحة'), x.latchedAlarm ? tr(T('FIRE ALARM', 'إنذار حريق')) : x.latchedSup ? tr(T('SUPERVISORY', 'إشراف')) : tr(T('Normal', 'طبيعي')), x.latchedAlarm ? 'alarm' : x.latchedSup ? 'warn' : ''],
      ],
      controls: [],
      procedures: [
        {
          id: 'flow', title: T('Waterflow alarm test', 'اختبار إنذار تدفق الماء'), setup: (x) => reset(x),
          steps: [
            { text: T('Notify the monitoring company that an alarm test will be performed.', 'أبلغ شركة المراقبة بإجراء اختبار الإنذار.'), button: T('Notified ✓', 'تم الإبلاغ ✓') },
            { text: T('Open the test-and-drain valve to the TEST position.', 'افتح صمام الاختبار والتصريف على وضع الاختبار.'), target: 'testdrain' },
            { text: T('Watch the sight glass and wait for the FACP waterflow alarm (retard delay).', 'راقب زجاج الرؤية وانتظر إنذار التدفق في اللوحة (تأخير المؤخّر).'), done: (x) => x.alarm },
            { text: T('The alarm arrived after the retard delay. What is the maximum allowed by NFPA 72?', 'وصل الإنذار بعد زمن التأخير. ما الحد الأقصى المسموح وفق NFPA 72؟'), button: T('', ''), choices: [
              { text: T('10 s', '10 ث'), correct: false }, { text: T('90 s', '90 ث'), correct: true }, { text: T('5 min', '5 دقائق'), correct: false }],
              explain: T('Waterflow alarm must be indicated within 90 s of flow equal to one sprinkler.', 'يجب أن يظهر إنذار التدفق خلال 90 ث من تدفق يعادل رشاشاً واحداً.') },
            { text: T('Close the test valve.', 'أغلق صمام الاختبار.'), target: 'testdrain' },
            { text: T('Reset the fire alarm panel.', 'أعد ضبط لوحة الإنذار.'), target: 'facp', done: (x) => !x.latchedAlarm },
          ],
        },
        {
          id: 'tamper', title: T('Valve supervisory (tamper) test', 'اختبار الإشراف على الصمام (العبث)'), setup: (x) => reset(x),
          steps: [
            { text: T('Start closing the floor control valve (turn the handwheel).', 'ابدأ بإغلاق صمام التحكم بالطابق (أدر العجلة).'), target: 'control' },
            { text: T('The tamper switch must signal SUPERVISORY within 2 turns. Wait for it at the panel.', 'يجب أن يرسل مفتاح العبث إشارة إشراف خلال دورتين. انتظرها في اللوحة.'), done: (x) => x.latchedSup },
            { text: T('Re-open the control valve fully.', 'أعد فتح صمام التحكم بالكامل.'), target: 'control', done: (x) => x.open > 0.99 },
            { text: T('Reset the panel.', 'أعد ضبط اللوحة.'), target: 'facp', done: (x) => !x.latchedSup },
            { text: T('Why must control valves be supervised?', 'لماذا يجب الإشراف على صمامات التحكم؟'), button: T('', ''), choices: [
              { text: T('To measure the water flow', 'لقياس تدفق الماء'), correct: false },
              { text: T('A closed valve is a leading cause of sprinkler system failure', 'الصمام المغلق من أهم أسباب فشل منظومات الرشاشات'), correct: true },
              { text: T('To reduce the pressure', 'لخفض الضغط'), correct: false }],
              explain: T('Closed valves are the most common reason sprinkler systems fail to control fires (NFPA statistics).', 'الصمامات المغلقة أكثر أسباب فشل الرشاشات في السيطرة على الحرائق شيوعاً (إحصاءات NFPA).') },
          ],
        },
      ],
    };
  },
};
