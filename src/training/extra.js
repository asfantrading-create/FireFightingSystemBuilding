// Scenes 7–9 — Sprinkler types & response (RTI), stair pressurization (NFPA 92), FM-200 room with live calculator (NFPA 2001).
import * as THREE from 'three';
import { MAT, tag, room, gauge, Stream, V, box, cyl, pipe, label3D } from './parts.js';
import { FireFX, FogFX } from '../scene/kit.js';
import { ALPHA, fm200SpecificVolume, fm200Quantity } from '../engine/design.js';
import { tr } from '../i18n.js';

const T = (en, ar) => ({ en, ar });
const BULB = { 57: 0xff8a00, 68: 0xe11d1d, 79: 0xf2c200, 93: 0x16a34a, 141: 0x2563eb };
const GROWTHS = ['slow', 'medium', 'fast', 'ultrafast'];

function alpert(Q, H, r) {
  if (Q <= 0) return [0, 0];
  if (r / H <= 0.18) return [16.9 * Math.pow(Q, 2 / 3) / Math.pow(H, 5 / 3), 0.947 * Math.pow(Q / H, 1 / 3)];
  return [5.38 * Math.pow(Q / r, 2 / 3) / H, 0.197 * Math.pow(Q, 1 / 3) * Math.sqrt(H) / Math.pow(r, 5 / 6)];
}

/** Sprinkler model (1 unit ≈ real size ×1; scale the group for display). */
function sprinklerModel(type, temp = 68, { bulbMm = 3 } = {}) {
  const g = new THREE.Group();
  const brass = MAT.brass, chrome = MAT.steel;
  const col = BULB[temp] ?? 0xe11d1d;
  const bulbMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
  const up = type === 'upright' ? -1 : 1;                         // pendent points down, upright points up
  const body = new THREE.Group();
  body.add(cyl(0.011, 0.018, brass, 0, 0, 0, 12));                   // threads
  body.add(cyl(0.013, 0.008, brass, 0, -0.008, 0, 6));               // hex
  if (type !== 'sidewall') {
    for (const x of [-0.011, 0.011]) body.add(box(0.004, 0.04, 0.006, brass, x, -0.048, 0));
    const defl = new THREE.Mesh(new THREE.CylinderGeometry(type === 'esfr' ? 0.034 : 0.022, type === 'esfr' ? 0.034 : 0.022, 0.002, 18), brass);
    defl.position.y = -0.05; body.add(defl);
    for (let i = 0; i < 12; i++) { const t = box(0.002, 0.003, 0.006, brass, Math.cos((i / 12) * 6.28) * 0.02, -0.05, Math.sin((i / 12) * 6.28) * 0.02); body.add(t); }
    if (type !== 'open') {
      const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(bulbMm / 1000 * 1.2, 0.02, 4, 10), bulbMat);
      bulb.position.y = -0.03; body.add(bulb); g.userData.bulb = bulb;
    }
  } else {
    body.add(box(0.004, 0.006, 0.04, brass, 0, -0.012, 0.018));
    const defl = box(0.04, 0.03, 0.002, brass, 0, -0.02, 0.04); body.add(defl);
    const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0036, 0.02, 4, 10), bulbMat); bulb.rotation.x = Math.PI / 2; bulb.position.set(0, -0.012, 0.02); body.add(bulb); g.userData.bulb = bulb;
  }
  body.scale.y = up;
  g.add(body);
  if (type === 'concealed') { const plate = cyl(0.04, 0.003, MAT.white, 0, -0.056, 0, 24); g.add(plate); g.userData.plate = plate; }
  if (type === 'recessed') g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.015, 24, 1, true), chrome).translateY(-0.004));
  return g;
}

// ───────────────────────── Scene 7: sprinkler types & response
const HEADS = [
  { id: 'h57', temp: 57, rti: 50, name: T('57 °C orange, quick response (3 mm)', '57 °م برتقالي، سريع الاستجابة (3 مم)') },
  { id: 'h68', temp: 68, rti: 50, name: T('68 °C red, quick response (3 mm)', '68 °م أحمر، سريع الاستجابة (3 مم)') },
  { id: 'h68s', temp: 68, rti: 200, bulbMm: 5, name: T('68 °C red, standard response (5 mm)', '68 °م أحمر، استجابة قياسية (5 مم)') },
  { id: 'h79', temp: 79, rti: 50, name: T('79 °C yellow, quick response', '79 °م أصفر، سريع الاستجابة') },
  { id: 'h93', temp: 93, rti: 50, name: T('93 °C green, quick response', '93 °م أخضر، سريع الاستجابة') },
  { id: 'hconc', temp: 68, rti: 50, concealed: true, name: T('Concealed 68 °C (cover plate drops at 57 °C)', 'مخفي 68 °م (يسقط الغطاء عند 57 °م)') },
];

export const sprinklerTypesScene = {
  id: 'sprinklertypes', icon: '💧', video: '-c13S__OfMM',
  title: T('Sprinkler types & response race', 'أنواع الرشاشات وسباق الاستجابة'),
  summary: T('Compare pendent, upright, sidewall, concealed, recessed, ESFR and open heads, then light a t² fire under six bulbs of different temperature rating and RTI and watch which operates first.', 'قارن الرشاشات المتدلية والقائمة والجانبية والمخفية والغائرة وESFR والمفتوحة، ثم أشعل حريقاً t² تحت ستة رشاشات بدرجات حرارة ومؤشرات RTI مختلفة وشاهد أيها يعمل أولاً.'),
  build() {
    const root = new THREE.Group();
    const parts = {};
    const P = (id, obj, name, info) => { tag(obj, id); parts[id] = { obj, name, info }; root.add(obj); return obj; };
    const H = 3.4;
    root.add(room(14, 10, H + 0.4));
    // translucent suspended ceiling with grid
    root.add(box(8, 0.03, 8, new THREE.MeshStandardMaterial({ color: 0xf5f5f2, transparent: true, opacity: 0.35, depthWrite: false }), 0, H, 0, { cast: false }));
    root.add(pipe([V(-3, H + 0.25, 0), V(3, H + 0.25, 0)], 0.04));
    // display bench with large-scale models
    const bench = box(9, 0.9, 1.0, MAT.dark, 0, 0, -3.8); root.add(bench);
    const types = [
      ['pendent', T('Pendent', 'متدلٍّ (Pendent)'), T('Hangs below the pipe; deflector sheds water down in a hemispherical pattern. Most common below ceilings.', 'يتدلى تحت الأنبوب ويوزع الماء لأسفل بنمط نصف كروي. الأكثر شيوعاً تحت الأسقف.')],
      ['upright', T('Upright', 'قائم (Upright)'), T('Installed above the pipe (exposed pipework, above ceilings); deflector sprays upward then down. Never install upside down.', 'يُركب فوق الأنبوب (أنابيب مكشوفة، فوق الأسقف)؛ يرش لأعلى ثم لأسفل. لا يُركب مقلوباً أبداً.')],
      ['sidewall', T('Horizontal sidewall', 'جانبي أفقي (Sidewall)'), T('Mounted on a wall, throws water across the room — hotel rooms, corridors, where ceiling pipes are unwanted.', 'يُركب على الجدار ويقذف الماء عبر الغرفة — غرف الفنادق والممرات حيث لا يُرغب بأنابيب السقف.')],
      ['concealed', T('Concealed', 'مخفي (Concealed)'), T('Hidden behind a cover plate soldered to melt ≈ 11 °C below the bulb rating (57 °C for a 68 °C head). The plate falls, then the head drops and operates.', 'مخفي خلف غطاء ملحوم يذوب عند ≈ 11 °م أقل من درجة الأمبولة (57 °م لرشاش 68 °م). يسقط الغطاء ثم ينزل الرشاش ويعمل.')],
      ['recessed', T('Recessed pendent', 'متدلٍّ غائر (Recessed)'), T('Partly recessed in an escutcheon cup for a neat ceiling finish; listed escutcheon only.', 'غائر جزئياً داخل كأس زخرفي لتشطيب أنيق للسقف؛ بكأس معتمد فقط.')],
      ['esfr', T('ESFR (K-360)', 'ESFR (K-360)'), T('Early Suppression Fast Response for high-piled storage: large K-factor, big droplets that penetrate the fire plume, RTI ≤ 28.', 'إخماد مبكر واستجابة سريعة للتخزين المرتفع: معامل K كبير وقطرات كبيرة تخترق عمود اللهب، RTI ≤ 28.')],
      ['open', T('Open (deluge) nozzle', 'فوهة مفتوحة (غمر)'), T('No bulb — all nozzles discharge together when the deluge valve opens (transformers, hangars, conveyors).', 'بدون أمبولة — تعمل جميع الفوهات معاً عند فتح صمام الغمر (المحولات، الحظائر، السيور).')],
    ];
    types.forEach(([tp, name, info], i) => {
      const m = sprinklerModel(tp, 68); m.scale.setScalar(7); m.position.set(-3.9 + i * 1.3, tp === 'upright' ? 1.05 : 1.55, -3.8);
      if (tp === 'sidewall') m.position.y = 1.35;
      P(`t_${tp}`, m, name, info);
    });
    root.add(label3D('SPRINKLER TYPES (×7 scale)', { size: 0.18, bg: 'rgba(30,41,59,0.9)' }).translateY(2.1).translateZ(-3.25));
    // bulb colour chart
    const chart = new THREE.Group(); chart.position.set(5.4, 1.2, -4.9);
    Object.entries(BULB).forEach(([tc, c], i) => { chart.add(box(0.5, 0.12, 0.02, new THREE.MeshStandardMaterial({ color: c }), 0, i * 0.16, 0)); chart.add(label3D(`${tc} °C`, { size: 0.08, bg: 'rgba(255,255,255,0.95)', color: '#111' }).translateX(0.5).translateY(i * 0.16 + 0.06)); });
    P('chart', chart, T('Bulb colour code (NFPA 13)', 'رمز ألوان الأمبولة (NFPA 13)'), T('Orange 57 °C, red 68 °C, yellow 79 °C, green 93 °C, blue 141 °C. Choose ≥ 11 °C above the maximum expected ceiling temperature.', 'برتقالي 57، أحمر 68، أصفر 79، أخضر 93، أزرق 141 °م. اختر درجة أعلى بـ 11 °م على الأقل من أقصى حرارة متوقعة للسقف.'));
    // race: six heads on a 2.5 m circle around the fire
    const heads = HEADS.map((h, i) => {
      const a = (i / HEADS.length) * Math.PI * 2;
      const m = sprinklerModel(h.concealed ? 'concealed' : 'pendent', h.temp, { bulbMm: h.bulbMm || 3 }); m.scale.setScalar(3.5);
      m.position.set(Math.cos(a) * 2.5, H - 0.02, Math.sin(a) * 2.5);
      P(h.id, m, h.name, T(`Rating ${h.temp} °C · RTI ${h.rti} (m·s)^½${h.concealed ? ' · cover plate 57 °C' : ''}. Link heats as dTd/dt = √u·(Tg − Td)/RTI.`, `درجة ${h.temp} °م · RTI ${h.rti}${h.concealed ? ' · غطاء 57 °م' : ''}. يسخن العنصر وفق dTd/dt = √u·(Tg − Td)/RTI.`));
      root.add(pipe([V(m.position.x, H + 0.25, m.position.z), V(m.position.x * 0.2, H + 0.25, m.position.z * 0.2)], 0.015));
      return { ...h, m };
    });
    const fire = new FireFX(root, { base: V(0, 0.5, 0), smokeCeiling: H - 0.5, n: 60 });
    root.add(box(0.8, 0.5, 0.8, new THREE.MeshStandardMaterial({ color: 0x5b4636 }), 0, 0, 0));
    const sprays = heads.map(() => new Stream(root, { n: 80, size: 0.05 }));
    const st = {};
    const reset = (x) => {
      Object.assign(x, { lit: false, t: 0, Q: 0, growth: x.growth ?? 2, T0: 25, Tg: 25, heads: HEADS.map(() => ({ Td: 25, plate: 25, plateOff: false, t: null })), order: [] });
      heads.forEach((h) => { if (h.m.userData.bulb) h.m.userData.bulb.visible = true; if (h.m.userData.plate) h.m.userData.plate.visible = true; });
    };
    reset(st);
    return {
      root, parts, state: st, reset,
      overview: { pos: [0, 4.2, 8.5], target: [0, 2, -1] },
      env: { biome: 'desert', sunElevation: 60, sunAzimuth: 200, radius: 30, shadowSize: 14 },
      controls: [
        { type: 'slider', label: T('Fire growth (t²)', 'نمو الحريق (t²)'), min: 0, max: 3, step: 1, get: (x) => x.growth, set: (x, v) => { x.growth = v; }, fmt: (v) => GROWTHS[v] },
        { type: 'button', label: T('🔥 Ignite / restart the test fire', '🔥 أشعل / أعد الحريق التجريبي'), run: (x, api) => { reset(x); x.lit = true; api.msg('Test fire ignited', 'تم إشعال الحريق التجريبي'); } },
      ],
      tick(dt, x, api) {
        if (x.lit) { x.t += dt; x.Q = Math.min(2500, ALPHA[GROWTHS[x.growth]] * x.t * x.t); }
        const Hf = H - 0.5;
        heads.forEach((h, i) => {
          const s = x.heads[i];
          const [dT, u] = alpert(x.Q, Hf, 2.5);
          const Tg = x.T0 + dT; x.Tg = Tg;
          if (h.concealed && !s.plateOff) {
            s.plate += dt * Math.sqrt(u) / 60 * (Tg - s.plate);
            if (s.plate >= 57) { s.plateOff = true; h.m.userData.plate.visible = false; api.msg('Concealed cover plate dropped', 'سقط غطاء الرشاش المخفي'); }
          } else if (s.t === null) {
            s.Td += dt * Math.sqrt(u) / h.rti * (Tg - s.Td);
            if (s.Td >= h.temp) { s.t = x.t; x.order.push(h.id); h.m.userData.bulb.visible = false; api.msg(`${tr(h.name)} operated at ${x.t.toFixed(0)} s`, `${tr(h.name)} عمل عند ${x.t.toFixed(0)} ث`, 'good'); }
          }
          sprays[i].set(s.t !== null ? 1 : 0, h.m.position.clone().add(V(0, -0.2, 0)), V(0, -1, 0), 1.2, 0.9); sprays[i].update(dt);
        });
        fire.set(x.Q, Math.min(1, x.Q / 800)); fire.update(dt);
      },
      readouts: (x) => [
        [T('Heat release rate', 'معدل انطلاق الحرارة'), `${Math.round(x.Q)} kW`, x.Q > 0 ? 'alarm' : ''],
        [T('Ceiling jet at 2.5 m', 'تيار السقف عند 2.5 م'), `${x.Tg.toFixed(0)} °C`],
        [T('Time', 'الوقت'), `${x.t.toFixed(0)} s`],
        ...HEADS.map((h, i) => [h.name, x.heads[i].t !== null ? `✓ ${x.heads[i].t.toFixed(0)} s` : `${x.heads[i].Td.toFixed(0)} °C`, x.heads[i].t !== null ? 'warn' : '']),
      ],
      procedures: [{
        id: 'race', title: T('Response race', 'سباق الاستجابة'), setup: (x) => { reset(x); x.growth = 2; },
        steps: [
          { text: T('Predict: which sprinkler will operate FIRST?', 'توقّع: أي رشاش سيعمل أولاً؟'), button: T('', ''), choices: [
            { text: T('57 °C quick response', '57 °م سريع الاستجابة'), correct: true },
            { text: T('68 °C standard response (5 mm bulb)', '68 °م قياسي (أمبولة 5 مم)'), correct: false },
            { text: T('93 °C green', '93 °م أخضر'), correct: false }],
            explain: T('Lowest rating AND lowest RTI heats and bursts first.', 'أقل درجة وأقل RTI يسخن وينفجر أولاً.') },
          { text: T('Ignite the test fire (button above) and watch the six bulbs.', 'أشعل الحريق التجريبي (الزر بالأعلى) وراقب الأمبولات الست.'), done: (x) => x.lit },
          { text: T('Wait until the 68 °C quick and standard-response heads have both operated.', 'انتظر حتى يعمل رشاشا 68 °م السريع والقياسي.'), done: (x) => x.heads[1].t !== null && x.heads[2].t !== null },
          { text: T('Both are 68 °C. Why did the quick-response head operate earlier?', 'كلاهما 68 °م. لماذا عمل الرشاش السريع أولاً؟'), button: T('', ''), choices: [
            { text: T('Its lower RTI (thinner 3 mm bulb) absorbs heat faster', 'مؤشر RTI أقل (أمبولة 3 مم أنحف) يمتص الحرارة أسرع'), correct: true },
            { text: T('It has a bigger K-factor', 'معامل K أكبر'), correct: false },
            { text: T('It is closer to the fire', 'أقرب إلى الحريق'), correct: false }],
            explain: T('Same distance, same rating — only the thermal sensitivity (RTI) differs: QR ≤ 50, SR ≥ 80 (m·s)^½.', 'نفس المسافة ونفس الدرجة — الفرق فقط في الحساسية الحرارية RTI: السريع ≤ 50 والقياسي ≥ 80.') },
          { text: T('Which bulb colour is 93 °C?', 'ما لون الأمبولة لدرجة 93 °م؟'), button: T('', ''), choices: [
            { text: T('Yellow', 'أصفر'), correct: false }, { text: T('Green', 'أخضر'), correct: true }, { text: T('Blue', 'أزرق'), correct: false }],
            explain: T('Orange 57, red 68, yellow 79, green 93, blue 141 °C.', 'برتقالي 57، أحمر 68، أصفر 79، أخضر 93، أزرق 141 °م.') },
          { text: T('A deep beam blocks a pendent sprinkler’s spray. What does NFPA 13 require?', 'عارضة عميقة تحجب رش رشاش متدلٍّ. ماذا تتطلب NFPA 13؟'), button: T('', ''), choices: [
            { text: T('Keep the minimum horizontal distance from the beam for the deflector height above its bottom (beam rule), or add heads', 'الحفاظ على الحد الأدنى للمسافة الأفقية من العارضة حسب ارتفاع العاكس فوق أسفلها (قاعدة العارضة) أو إضافة رشاشات'), correct: true },
            { text: T('Nothing — water will flow around the beam', 'لا شيء — سيلتف الماء حول العارضة'), correct: false }],
            explain: T('Obstruction rules (the "beam rule") tie the allowable distance to how far the deflector is above the beam bottom.', 'قواعد العوائق (قاعدة العارضة) تربط المسافة المسموحة بارتفاع العاكس فوق أسفل العارضة.') },
        ],
        result: (x) => `Operating order: ${x.order.map((id) => HEADS.find((h) => h.id === id).temp + '°C' + (HEADS.find((h) => h.id === id).rti > 50 ? ' SR' : '') + (id === 'hconc' ? ' concealed' : '')).join(' → ')}`,
      }],
    };
  },
};

// ───────────────────────── Scene 8: stair pressurization
const FLOORS = 6, FH = 3.5, DOOR_A = 0.9 * 2.1, LEAK_A = 0.02;
export const stairScene = {
  id: 'stairpress', icon: '🌬️', video: 'Y7iMQxipEAs',
  title: T('Stairwell pressurization (NFPA 92)', 'ضغط بيت الدرج (NFPA 92)'),
  summary: T('Keep smoke out of the escape stair: set the supply fan so ΔP ≥ 12.5 Pa, keep door-opening force ≤ 133 N, and see what happens when doors are opened. Q = 0.839·A·√ΔP.', 'امنع الدخان من دخول درج الهروب: اضبط مروحة الإمداد ليكون ΔP ≥ 12.5 باسكال، مع قوة فتح باب ≤ 133 نيوتن، وشاهد ما يحدث عند فتح الأبواب. Q = 0.839·A·√ΔP.'),
  build() {
    const root = new THREE.Group();
    const parts = {};
    const P = (id, obj, name, info) => { tag(obj, id); parts[id] = { obj, name, info }; root.add(obj); return obj; };
    const concrete = new THREE.MeshStandardMaterial({ color: 0xd9d5cc, roughness: 0.9 });
    const glassM = new THREE.MeshStandardMaterial({ color: 0xbcd7e6, transparent: true, opacity: 0.18, depthWrite: false });
    const Htot = FLOORS * FH;
    // stair shaft (cut-away front) and corridor slabs
    root.add(box(4, Htot, 0.25, concrete, 0, 0, -3)); root.add(box(0.25, Htot, 6, concrete, -2, 0, 0)); root.add(box(0.25, Htot, 6, glassM, 2, 0, 0, { cast: false }));
    const doors = [];
    for (let f = 0; f < FLOORS; f++) {
      const y = f * FH;
      root.add(box(4, 0.25, 2.2, concrete, 0, y + FH / 2, -1.9));
      root.add(box(4, 0.25, 2.2, concrete, 0, y, 1.9));
      for (let k = 0; k < 8; k++) { root.add(box(1.8, 0.18, 0.28, concrete, -0.9, y + k * (FH / 2 / 8), -0.8 + k * 0.28)); root.add(box(1.8, 0.18, 0.28, concrete, 0.9, y + FH / 2 + k * (FH / 2 / 8), 1.2 - k * 0.28)); }
      root.add(box(8, 0.25, 6, concrete, 6.1, y, 0));                         // corridor floor slab
      const door = new THREE.Group(); door.position.set(2, y + 0.05, 1.8);
      door.add(box(0.06, 2.1, 0.9, new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 }), 0, 0, 0.45));
      root.add(door); doors.push(door);
      root.add(label3D(`L${f + 1}`, { size: 0.25, bg: 'rgba(30,41,59,0.9)' }).translateX(2.1).translateY(y + 2.6).translateZ(2.8).rotateY(Math.PI / 2));
    }
    tag(doors[2], 'firedoor'); parts.firedoor = { obj: doors[2], name: T('Stair door – fire floor (L3)', 'باب الدرج – طابق الحريق (L3)'), info: T('Self-closing fire door. When open, the stair must push air out through it fast enough (≈ 1 m/s) to keep smoke back.', 'باب حريق ذاتي الإغلاق. عند فتحه يجب أن يدفع الدرج الهواء عبره بسرعة كافية (≈ 1 م/ث) لصد الدخان.') };
    const fan = new THREE.Group(); fan.position.set(0, Htot + 0.2, -1.5);
    fan.add(box(1.6, 1.0, 1.2, MAT.galv, 0, 0, 0)); const blades = new THREE.Group(); for (let i = 0; i < 4; i++) blades.add(box(0.7, 0.02, 0.15, MAT.dark, 0.35, 0, 0).rotateY((i * Math.PI) / 2)); blades.position.set(0, 1.05, 0); fan.add(blades);
    fan.add(pipe([V(0, 0, 0), V(0, -Htot + 1, 0)], 0.3, MAT.galv));
    P('fan', fan, T('Stair pressurization fan & supply duct', 'مروحة ضغط الدرج ومجرى الإمداد'), T('Supplies outdoor air into the stair (multiple injection points for tall stairs). Starts on fire alarm; often variable speed to hold ΔP.', 'تضخ هواءً خارجياً إلى الدرج (نقاط حقن متعددة للأدراج العالية). تعمل عند إنذار الحريق وغالباً بسرعة متغيرة للحفاظ على ΔP.'));
    const relief = box(0.8, 0.8, 0.1, MAT.dark, 1, Htot - 1.2, -2.9);
    P('relief', relief, T('Barometric relief damper', 'مخمد التنفيس البارومتري'), T('Opens above ≈ 50 Pa to limit stair pressure so doors can still be opened (≤ 133 N / 30 lbf).', 'ينفتح فوق ≈ 50 باسكال للحد من ضغط الدرج كي تبقى الأبواب قابلة للفتح (≤ 133 نيوتن).'));
    const dpg = gauge(80, 'Pa', 'ΔP'); dpg.position.set(1.85, 2 * FH + 1.6, 1.0); dpg.rotation.y = Math.PI / 2; root.add(dpg);
    tag(dpg, 'dp'); parts.dp = { obj: dpg, name: T('Differential pressure sensor', 'حساس فرق الضغط'), info: T('Measures stair-to-corridor pressure difference; NFPA 92 minimum 12.5 Pa (sprinklered building), 25–45 Pa unsprinklered.', 'يقيس فرق الضغط بين الدرج والممر؛ الحد الأدنى وفق NFPA 92 هو 12.5 باسكال (مبنى مرشوش) و25–45 باسكال لغير المرشوش.') };
    const smokeStair = new FogFX(root, { w: 3.6, h: Htot, d: 5.5, center: V(0, 0, 0), n: 90, texName: 'smoke', color: 0x777777 });
    const smokeCorr = new FogFX(root, { w: 7, h: 3, d: 5.5, center: V(6.1, 2 * FH + 0.2, 0), n: 50, texName: 'smoke', color: 0x666666 });
    const fire = new FireFX(root, { base: V(8.5, 2 * FH + 0.25, 1), smokeCeiling: 3, n: 40 });
    const st = {};
    const reset = (x) => Object.assign(x, { fan: 0, fireDoor: false, openOthers: 0, relief: true, dp: 0, force: 0, v: 0, smoke: 0, sprinklered: true });
    reset(st);
    parts.firedoor.onPick = (x, api) => { x.fireDoor = !x.fireDoor; api.msg(x.fireDoor ? 'Fire-floor stair door OPEN' : 'Fire-floor stair door closed', x.fireDoor ? 'باب الدرج في طابق الحريق مفتوح' : 'باب الدرج في طابق الحريق مغلق'); };
    parts.relief.onPick = (x, api) => { x.relief = !x.relief; api.msg(x.relief ? 'Relief damper enabled' : 'Relief damper disabled', x.relief ? 'تم تفعيل مخمد التنفيس' : 'تم تعطيل مخمد التنفيس'); };
    const calc = (x) => {
      const nOpen = (x.fireDoor ? 1 : 0) + x.openOthers;
      const A = (FLOORS - nOpen) * LEAK_A + nOpen * DOOR_A + 0.05;         // + walls/shaft leakage
      const Q = x.fan;                                                       // m³/s
      let dp = (Q / (0.839 * A)) ** 2;
      let reliefQ = 0;
      if (x.relief && dp > 50) { const Arel = 0.6; dp = (Q / (0.839 * (A + Arel))) ** 2; dp = Math.max(dp, 50 * 0.98); reliefQ = Q - 0.839 * A * Math.sqrt(dp); }
      x.dp = dp; x.reliefQ = Math.max(0, reliefQ);
      const W = 0.9, d = 0.08, Fdc = 40;
      x.force = Fdc + (W * DOOR_A * dp) / (2 * (W - d));
      x.v = x.fireDoor ? (0.839 * DOOR_A * Math.sqrt(dp)) / DOOR_A : 0;
    };
    return {
      root, parts, state: st, reset,
      overview: { pos: [14, 13, 17], target: [3, 8, 0] },
      env: { biome: 'desert', sunElevation: 55, sunAzimuth: 200, radius: 40, shadowSize: 25 },
      controls: [
        { type: 'slider', label: T('Supply fan airflow', 'تدفق مروحة الإمداد'), min: 0, max: 6, step: 0.05, get: (x) => x.fan, set: (x, v) => { x.fan = v; }, fmt: (v) => `${v.toFixed(2)} m³/s` },
        { type: 'slider', label: T('Other stair doors open (evacuees)', 'أبواب درج أخرى مفتوحة (المُخلَون)'), min: 0, max: 3, step: 1, get: (x) => x.openOthers, set: (x, v) => { x.openOthers = v; }, fmt: (v) => String(v) },
      ],
      tick(dt, x) {
        calc(x);
        blades.rotation.y += dt * x.fan * 6;
        doors.forEach((d, i) => { const open = (i === 2 && x.fireDoor) || (i !== 2 && i >= FLOORS - x.openOthers); d.rotation.y = open ? -1.3 : 0; });
        dpg.set(x.dp);
        const leaking = x.fireDoor ? x.v < 1.0 : x.dp < 12.5;
        x.smoke = Math.max(0, Math.min(1, x.smoke + (leaking ? 0.08 : -0.15) * dt));
        smokeStair.set(x.smoke * 0.9); smokeStair.update(dt);
        smokeCorr.set(0.7); smokeCorr.update(dt);
        fire.set(400, 0.6); fire.update(dt);
      },
      readouts: (x) => [
        [T('Stair ΔP', 'فرق ضغط الدرج'), `${x.dp.toFixed(1)} Pa`, x.dp < 12.5 ? 'alarm' : x.dp > 50 ? 'warn' : ''],
        [T('Door-opening force', 'قوة فتح الباب'), `${Math.round(x.force)} N`, x.force > 133 ? 'alarm' : ''],
        [T('Velocity through open fire-floor door', 'السرعة عبر باب طابق الحريق'), x.fireDoor ? `${x.v.toFixed(2)} m/s` : '—', x.fireDoor && x.v < 1 ? 'alarm' : ''],
        [T('Relief damper flow', 'تدفق مخمد التنفيس'), `${(x.reliefQ || 0).toFixed(2)} m³/s`],
        [T('Smoke in stair', 'الدخان في الدرج'), `${Math.round(x.smoke * 100)} %`, x.smoke > 0.05 ? 'alarm' : ''],
        [T('Limits', 'الحدود'), 'ΔP ≥ 12.5 Pa · F ≤ 133 N'],
      ],
      procedures: [{
        id: 'commission', title: T('Commissioning test', 'اختبار التشغيل والاستلام'), setup: (x) => reset(x),
        steps: [
          { text: T('All doors closed: raise the supply fan until ΔP ≥ 12.5 Pa.', 'جميع الأبواب مغلقة: ارفع مروحة الإمداد حتى ΔP ≥ 12.5 باسكال.'), done: (x) => x.dp >= 12.5 && x.fan > 0 && !x.fireDoor && x.openOthers === 0 },
          { text: T('Disable the relief damper (click it) and push the fan to maximum. Check the door-opening force.', 'عطّل مخمد التنفيس (انقر عليه) وارفع المروحة للحد الأقصى. افحص قوة فتح الباب.'), done: (x) => !x.relief && x.force > 133 },
          { text: T('The force exceeds 133 N — occupants may be unable to open the door. Fix it:', 'القوة تتجاوز 133 نيوتن — قد لا يستطيع الشاغلون فتح الباب. الحل:'), button: T('', ''), choices: [
            { text: T('Enable the barometric relief damper / variable-speed fan', 'تفعيل مخمد التنفيس البارومتري / مروحة متغيرة السرعة'), correct: true },
            { text: T('Add a stronger door closer', 'تركيب ذراع إغلاق أقوى'), correct: false }],
            explain: T('Pressure must be limited; a stronger closer makes the opening force even higher.', 'يجب الحد من الضغط؛ ذراع الإغلاق الأقوى يزيد قوة الفتح أكثر.') },
          { text: T('Re-enable the relief damper (click it) and confirm force ≤ 133 N.', 'أعد تفعيل مخمد التنفيس (انقر عليه) وتأكد أن القوة ≤ 133 نيوتن.'), target: 'relief', done: (x) => x.relief && x.force <= 133 },
          { text: T('Open the fire-floor stair door (click it) and 2 other doors. Watch ΔP collapse and smoke enter.', 'افتح باب الدرج في طابق الحريق (انقر عليه) وبابين آخرين. راقب انهيار الضغط ودخول الدخان.'), done: (x) => x.fireDoor && x.openOthers >= 2 },
          { text: T('Increase the fan until the velocity through the open fire-floor door is ≥ 1.0 m/s.', 'ارفع المروحة حتى تصبح السرعة عبر باب طابق الحريق ≥ 1.0 م/ث.'), done: (x) => x.fireDoor && x.v >= 1.0 },
          { text: T('Which relation gives the leakage flow through a gap?', 'ما العلاقة التي تعطي تدفق التسرب عبر فتحة؟'), button: T('', ''), choices: [
            { text: T('Q = 0.839 · A · √ΔP (SI)', 'Q = 0.839 · A · √ΔP (نظام SI)'), correct: true },
            { text: T('Q = K · ΔP²', 'Q = K · ΔP²'), correct: false }],
            explain: T('Orifice flow: Q (m³/s) = 0.839 A (m²) √ΔP (Pa); in IP units Q = 2610 A √ΔP (cfm, ft², in. w.g.).', 'تدفق الفتحة: Q (م³/ث) = 0.839 A (م²) √ΔP (باسكال)؛ وبالوحدات الإنجليزية Q = 2610 A √ΔP.') },
        ],
      }],
    };
  },
};

// ───────────────────────── Scene 9: FM-200 room + live calculator
export const fm200Scene = {
  id: 'fm200room', icon: '🧪', video: 'mbIollEju5w',
  title: T('FM-200 room: design calculator & discharge sequence', 'غرفة FM-200: حاسبة التصميم وتسلسل التفريغ'),
  summary: T('Size the agent live (W = V/S × C/(100−C)) with NOAEL/LOAEL warnings, then run the release sequence: cross-zoned detection, 30 s pre-discharge, HVAC shutdown, 10 s discharge and hold.', 'احسب كمية المادة مباشرة (W = V/S × C/(100−C)) مع تحذيرات NOAEL/LOAEL، ثم نفّذ تسلسل الإطلاق: كشف متقاطع، و30 ث قبل التفريغ، وإيقاف التكييف، وتفريغ خلال 10 ث، والاحتفاظ.'),
  build() {
    const root = new THREE.Group();
    const parts = {};
    const P = (id, obj, name, info) => { tag(obj, id); parts[id] = { obj, name, info }; root.add(obj); return obj; };
    root.add(room(14, 10, 3.6));
    const L = 10, Wd = 8, Hh = 3;
    const ox = -5, oz = -4.5;
    root.add(box(L, 0.3, Wd, new THREE.MeshStandardMaterial({ color: 0xdfe3e8 }), ox + L / 2, 0, oz + Wd / 2));   // raised floor
    const glassM = new THREE.MeshStandardMaterial({ color: 0xbcd7e6, transparent: true, opacity: 0.15, depthWrite: false });
    root.add(box(0.1, Hh, Wd, glassM, ox + L, 0.3, oz + Wd / 2, { cast: false })); root.add(box(L, Hh, 0.1, glassM, ox + L / 2, 0.3, oz + Wd, { cast: false }));
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.5, metalness: 0.4 });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 12; k++) root.add(box(0.6, 2.0, 1.0, rackMat, ox + 1.4 + k * 0.62, 0.3, oz + 1.8 + r * 2.3));
    // nozzles & piping
    const noz = [];
    for (const [x, z] of [[2.5, 2], [7.5, 2], [2.5, 6], [7.5, 6]]) { const n = new THREE.Group(); n.add(cyl(0.05, 0.15, MAT.galv, 0, 0, 0, 12)); for (let i = 0; i < 6; i++) n.add(box(0.02, 0.02, 0.05, MAT.dark, Math.cos(i) * 0.05, 0.02, Math.sin(i) * 0.05)); n.position.set(ox + x, Hh + 0.1, oz + z); root.add(n); noz.push(n); }
    root.add(pipe([V(ox - 1.6, 1.9, oz + 1), V(ox - 1.6, Hh + 0.3, oz + 1), V(ox + 2.5, Hh + 0.3, oz + 1), V(ox + 2.5, Hh + 0.3, oz + 6), V(ox + 7.5, Hh + 0.3, oz + 6), V(ox + 7.5, Hh + 0.3, oz + 2), V(ox + 2.5, Hh + 0.3, oz + 2)], 0.05, MAT.dark));
    tag(noz[0], 'nozzle'); parts.nozzle = { obj: noz[0], name: T('360° discharge nozzle', 'فوهة تفريغ 360°'), info: T('Each 360° nozzle covers ≈ 9.8 m radius, 180° nozzles are wall-mounted; max 3.66–4.9 m height per tier. Discharge must complete within 10 s.', 'تغطي كل فوهة 360° نصف قطر ≈ 9.8 م، وتُثبّت فوهات 180° على الجدار؛ ارتفاع كل طبقة حتى 3.66–4.9 م. يجب أن يكتمل التفريغ خلال 10 ث.') };
    // cylinder with valve & actuator
    const cylG = new THREE.Group(); cylG.position.set(ox - 1.6, 0, oz + 1);
    cylG.add(cyl(0.32, 1.5, MAT.red, 0, 0, 0, 24)); cylG.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.red).translateY(1.5));
    cylG.add(box(0.2, 0.18, 0.2, MAT.brass, 0, 1.78, 0)); const sol = box(0.1, 0.14, 0.1, MAT.blueMotor, 0.14, 1.8, 0); cylG.add(sol);
    const cg = gauge(60, 'bar', 'FM-200'); cg.position.set(0, 1.9, 0.18); cg.scale.setScalar(0.7); cylG.add(cg);
    P('cylinder', cylG, T('FM-200 cylinder, valve & solenoid actuator', 'أسطوانة FM-200 والصمام والمشغّل الكهربائي'), T('HFC-227ea super-pressurised with nitrogen to 25 or 42 bar; fill density ≤ 1.15 kg/L. The release panel fires the solenoid; a manual lever is also provided. Check weight/pressure every 6 months (loss > 5 % weight or > 10 % pressure → refill).', 'مادة HFC-227ea مضغوطة بالنيتروجين إلى 25 أو 42 بار؛ كثافة التعبئة ≤ 1.15 كغ/ل. تُشغّل لوحة الإطلاق المشغّل الكهربائي، مع ذراع يدوي. يُفحص الوزن والضغط كل 6 أشهر (فقد > 5% وزن أو > 10% ضغط → إعادة تعبئة).'));
    // panel, abort/manual station, sounder, discharged lamp, dampers, detectors
    const panelM = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
    const panel = new THREE.Group(); panel.position.set(ox + L + 1.4, 1.3, oz + 2); panel.add(box(0.6, 0.8, 0.15, panelM, 0, 0, 0));
    const lamp = (c, y) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.05 })); m.position.set(-0.15, y, 0.09); panel.add(m); return m; };
    const lz1 = lamp(0xffa600, 0.62), lz2 = lamp(0xff2222, 0.5), lpre = lamp(0xff2222, 0.38);
    P('panel', panel, T('Release control panel', 'لوحة التحكم بالإطلاق'), T('Cross-zoned logic: 1st detector = alarm; 2nd zone = pre-discharge (sounder/strobe, HVAC off, dampers close, doors release) then release after the time delay.', 'منطق الكشف المتقاطع: الكاشف الأول = إنذار؛ المنطقة الثانية = ما قبل التفريغ (صفارة/وميض، إيقاف التكييف، إغلاق المخمدات، تحرير الأبواب) ثم الإطلاق بعد التأخير.'));
    const station = new THREE.Group(); station.position.set(ox + L + 0.25, 1.2, oz + 5.5);
    station.add(box(0.1, 0.25, 0.2, new THREE.MeshStandardMaterial({ color: 0x16a34a }), 0, 0.2, 0)); station.add(box(0.1, 0.25, 0.2, new THREE.MeshStandardMaterial({ color: 0xf2c200 }), 0, -0.15, 0));
    P('abort', station, T('Manual release (green) & abort (yellow) stations', 'محطتا الإطلاق اليدوي (أخضر) والإلغاء (أصفر)'), T('Located at the exit. Abort is a "dead-man" switch: it only holds the countdown while pressed and never stops a manual release.', 'عند المخرج. مفتاح الإلغاء يعمل بالضغط المستمر فقط ويوقف العد التنازلي أثناء الضغط ولا يلغي الإطلاق اليدوي.'));
    const strobe = cyl(0.08, 0.1, new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0 }), ox + L + 0.2, 2.6, oz + 4, 12); root.add(strobe);
    const dampers = [box(0.8, 0.05, 0.8, MAT.dark, ox + 5, Hh + 0.32, oz + 4)]; dampers.forEach((d) => root.add(d));
    tag(dampers[0], 'damper'); parts.damper = { obj: dampers[0], name: T('HVAC motorised damper', 'مخمد التكييف الآلي'), info: T('Closes on pre-discharge so the agent is not blown out of the room; room integrity is verified by a door-fan test.', 'يُغلق قبل التفريغ لكي لا تُطرد المادة من الغرفة؛ ويُتحقق من إحكام الغرفة باختبار مروحة الباب.') };
    const detMats = [0, 1].map(() => new THREE.MeshStandardMaterial({ color: 0xf5f5f5, emissive: 0xff0000, emissiveIntensity: 0 }));
    [[2.5, 4, 0], [7.5, 4, 1]].forEach(([x, z, k]) => { const d = cyl(0.08, 0.05, detMats[k], ox + x, Hh + 0.25, oz + z, 16); root.add(d); if (!k) { tag(d, 'detector'); parts.detector = { obj: d, name: T('Smoke detectors – zone 1 & zone 2', 'كواشف الدخان – المنطقة 1 والمنطقة 2'), info: T('Detectors are alternated between two zones; release needs both (cross-zoning) to avoid a false discharge.', 'تُوزّع الكواشف بالتناوب على منطقتين، ويتطلب الإطلاق كلتيهما (كشف متقاطع) لتجنب تفريغ كاذب.') }; } });
    const fog = new FogFX(root, { w: L, h: Hh, d: Wd, center: V(ox + L / 2, 0.3, oz + Wd / 2), n: 120 });
    const fire = new FireFX(root, { base: V(ox + 4.5, 1.3, oz + 4.1), smokeCeiling: Hh - 1.0, n: 30 });
    const st = {};
    const reset = (x) => Object.assign(x, { L: x.L ?? 10, W: x.W ?? 8, H: x.H ?? 3, T: x.T ?? 20, C: x.C ?? 7, seq: 'idle', tSeq: 0, conc: 0, fireQ: 0, abortHeld: false, z1: false, z2: false, agentLeft: 1 });
    reset(st);
    const design = (x) => {
      const V0 = x.L * x.W * x.H, S = fm200SpecificVolume(x.T), Wkg = fm200Quantity(V0, x.T, x.C);
      return { V0, S, Wkg, cyl: Math.ceil(Wkg / 180), lb: Wkg * 2.2046, ft3: V0 * 35.315 };
    };
    parts.abort.onPick = (x, api) => { if (x.seq === 'countdown') { x.abortHeld = !x.abortHeld; api.msg(x.abortHeld ? 'ABORT held — countdown paused' : 'Abort released — countdown resumes', x.abortHeld ? 'مفتاح الإلغاء مضغوط — توقف العد' : 'تم ترك الإلغاء — استئناف العد', 'bad'); } };
    return {
      root, parts, state: st, reset,
      overview: { pos: [9, 7.5, 10], target: [0, 1.2, 0] },
      env: { biome: 'desert', sunElevation: 60, sunAzimuth: 200, radius: 30, shadowSize: 16 },
      controls: [
        { type: 'slider', label: T('Room length', 'طول الغرفة'), min: 2, max: 40, step: 0.5, get: (x) => x.L, set: (x, v) => { x.L = v; }, fmt: (v) => `${v} m` },
        { type: 'slider', label: T('Room width', 'عرض الغرفة'), min: 2, max: 30, step: 0.5, get: (x) => x.W, set: (x, v) => { x.W = v; }, fmt: (v) => `${v} m` },
        { type: 'slider', label: T('Room height (incl. raised floor & ceiling void)', 'ارتفاع الغرفة (مع الأرضية المرتفعة وفراغ السقف)'), min: 2, max: 6, step: 0.1, get: (x) => x.H, set: (x, v) => { x.H = v; }, fmt: (v) => `${v} m` },
        { type: 'slider', label: T('Minimum design temperature', 'أدنى درجة حرارة تصميمية'), min: 0, max: 40, step: 1, get: (x) => x.T, set: (x, v) => { x.T = v; }, fmt: (v) => `${v} °C` },
        { type: 'slider', label: T('Design concentration', 'تركيز التصميم'), min: 5, max: 12, step: 0.1, get: (x) => x.C, set: (x, v) => { x.C = v; }, fmt: (v) => `${v.toFixed(1)} %` },
        { type: 'button', label: T('💨 Smoke in a rack (start the fire)', '💨 دخان في خزانة (ابدأ الحريق)'), run: (x, api) => { x.fireQ = 5; api.msg('Overheating rack — smoke developing', 'خزانة ترتفع حرارتها — يتكوّن دخان'); } },
      ],
      tick(dt, x, api) {
        if (x.fireQ > 0 && x.conc < 5.8) x.fireQ = Math.min(250, x.fireQ + dt * (1 + x.fireQ * 0.03));
        if (x.conc >= 5.8) x.fireQ = Math.max(0, x.fireQ - dt * 40);
        if (!x.z1 && x.fireQ > 15) { x.z1 = true; x.seq = 'alarm'; api.msg('Zone 1 detector — ALARM (no release yet)', 'كاشف المنطقة 1 — إنذار (لا إطلاق بعد)', 'bad'); }
        if (!x.z2 && x.fireQ > 45) { x.z2 = true; x.seq = 'countdown'; x.tSeq = 30; api.msg('Zone 2 confirmed — PRE-DISCHARGE 30 s, HVAC off, dampers closing', 'تأكيد المنطقة 2 — ما قبل التفريغ 30 ث، إيقاف التكييف وإغلاق المخمدات', 'bad'); }
        if (x.seq === 'countdown' && !x.abortHeld) { x.tSeq -= dt; if (x.tSeq <= 0) { x.seq = 'discharge'; x.tSeq = 10; api.msg('AGENT RELEASE', 'إطلاق المادة', 'bad'); } }
        if (x.seq === 'discharge') { x.tSeq -= dt; x.conc = Math.min(x.C, x.conc + (x.C / 10) * dt); x.agentLeft = Math.max(0, x.tSeq / 10); if (x.tSeq <= 0) { x.seq = 'hold'; x.tSeq = 600; api.msg('Discharge complete — hold 10 min', 'اكتمل التفريغ — احتفاظ 10 دقائق', 'good'); } }
        if (x.seq === 'hold') { x.tSeq -= dt; x.conc = x.C * Math.exp(-(600 - x.tSeq) / 5400); if (x.tSeq <= 0) x.seq = 'held'; }
        const blink = Math.sin(x.time * 10) > 0;
        lz1.material.emissiveIntensity = x.z1 ? 3 : 0.05; lz2.material.emissiveIntensity = x.z2 ? 3 : 0.05;
        lpre.material.emissiveIntensity = x.seq === 'countdown' && blink ? 3 : x.seq === 'hold' || x.seq === 'discharge' || x.seq === 'held' ? 3 : 0.05;
        strobe.material.emissiveIntensity = x.seq !== 'idle' && x.seq !== 'alarm' && blink ? 4 : 0;
        detMats[0].emissiveIntensity = x.z1 ? 2 : 0; detMats[1].emissiveIntensity = x.z2 ? 2 : 0;
        dampers[0].rotation.x = x.z2 ? 0 : 0.8;
        sol.material = x.seq === 'discharge' || x.seq === 'hold' || x.seq === 'held' ? MAT.red : MAT.blueMotor;
        cg.set(42 * (x.agentLeft ** 0.8));
        fog.set(x.conc / 7); fog.update(dt);
        fire.set(x.fireQ, x.fireQ > 0 ? 0.3 : 0); fire.update(dt);
      },
      readouts: (x) => {
        const d = design(x);
        const safe = x.C <= 9 ? '' : x.C <= 10.5 ? 'warn' : 'alarm';
        return [
          [T('Volume V', 'الحجم V'), `${d.V0.toFixed(1)} m³ · ${Math.round(d.ft3)} ft³`],
          [T('Specific volume S', 'الحجم النوعي S'), `${d.S.toFixed(5)} m³/kg`],
          [T('Agent W = V/S·C/(100−C)', 'كمية المادة W'), `${d.Wkg.toFixed(1)} kg · ${Math.round(d.lb)} lb`],
          [T('Cylinders (180 L, ≤ 180 kg)', 'الأسطوانات (180 ل)'), String(d.cyl)],
          [T('Design concentration', 'تركيز التصميم'), `${x.C.toFixed(1)} % ${x.C > 10.5 ? '> LOAEL!' : x.C > 9 ? '> NOAEL' : '≤ NOAEL 9 %'}`, safe],
          [T('Sequence', 'التسلسل'), x.seq === 'countdown' ? `${tr(T('Pre-discharge', 'ما قبل التفريغ'))} ${Math.max(0, x.tSeq).toFixed(0)} s${x.abortHeld ? ' (ABORT)' : ''}` : x.seq, x.seq === 'idle' ? '' : 'alarm'],
          [T('Room concentration', 'التركيز في الغرفة'), `${x.conc.toFixed(2)} %`],
          [T('Fire', 'الحريق'), `${Math.round(x.fireQ)} kW`, x.fireQ > 0 ? 'alarm' : ''],
        ];
      },
      procedures: [
        {
          id: 'design', title: T('Design calculation', 'حساب التصميم'), setup: (x) => { x.L = 12; x.W = 9; x.H = 3.5; x.T = 25; x.C = 9.5; },
          steps: [
            { text: T('Set the room to 10 × 8 × 3 m at 20 °C and 7 % concentration (sliders). The quantity must read ≈ 131.7 kg.', 'اضبط الغرفة على 10 × 8 × 3 م عند 20 °م وتركيز 7% (المنزلقات). يجب أن تظهر الكمية ≈ 131.7 كغ.'), done: (x) => Math.abs(design(x).Wkg - 131.7) < 1.5 },
            { text: T('If the minimum room temperature were 10 °C instead of 20 °C, the agent quantity would…', 'لو كانت أدنى حرارة 10 °م بدلاً من 20 °م فإن كمية المادة…'), button: T('', ''), choices: [
              { text: T('increase (S gets smaller)', 'تزداد (يصغر S)'), correct: true }, { text: T('decrease', 'تنقص'), correct: false }],
              explain: T('S = 0.1269 + 0.0005131·T: colder → smaller S → more kg for the same concentration. Always use the lowest expected temperature.', 'S = 0.1269 + 0.0005131·T: أبرد ← S أصغر ← كيلوغرامات أكثر لنفس التركيز. استخدم دائماً أدنى حرارة متوقعة.') },
            { text: T('Raise the concentration above 10.5 %. What is the problem for an occupied room?', 'ارفع التركيز فوق 10.5%. ما المشكلة في غرفة مشغولة؟'), button: T('', ''), choices: [
              { text: T('It exceeds the LOAEL (10.5 %) — not allowed in normally occupied spaces', 'يتجاوز LOAEL (10.5%) — غير مسموح في الأماكن المشغولة عادةً'), correct: (x) => x.C > 10.5 },
              { text: T('No problem, more agent is always safer', 'لا مشكلة، المادة الأكثر أكثر أماناً دائماً'), correct: false }],
              explain: T('NOAEL 9 %, LOAEL 10.5 % for HFC-227ea — the video example (10.8 %) exceeded this by applying the safety factor twice.', 'NOAEL 9% وLOAEL 10.5% لمادة HFC-227ea — مثال الفيديو (10.8%) تجاوزها بسبب تطبيق معامل الأمان مرتين.') },
          ],
        },
        {
          id: 'sequence', title: T('Discharge sequence', 'تسلسل التفريغ'), setup: (x) => { reset(x); x.L = 10; x.W = 8; x.H = 3; x.T = 20; x.C = 7; },
          steps: [
            { text: T('Start the rack fire (button "Smoke in a rack").', 'ابدأ حريق الخزانة (زر "دخان في خزانة").'), done: (x) => x.fireQ > 0 },
            { text: T('Wait for the zone 1 detector. Is the agent released now?', 'انتظر كاشف المنطقة 1. هل تُطلق المادة الآن؟'), done: (x) => x.z1 },
            { text: T('With only one zone in alarm, what happens?', 'مع إنذار منطقة واحدة فقط، ماذا يحدث؟'), button: T('', ''), choices: [
              { text: T('Alarm only — release needs the second zone (cross-zoning)', 'إنذار فقط — يتطلب الإطلاق المنطقة الثانية (كشف متقاطع)'), correct: true },
              { text: T('Immediate discharge', 'تفريغ فوري'), correct: false }],
              explain: T('Cross-zoning prevents a single faulty detector from dumping the agent.', 'يمنع الكشف المتقاطع كاشفاً معطلاً واحداً من تفريغ المادة.') },
            { text: T('Zone 2 confirms: pre-discharge countdown, HVAC off, dampers closing. Someone is still inside — hold the ABORT switch (click it).', 'تأكيد المنطقة 2: عد تنازلي، إيقاف التكييف وإغلاق المخمدات. ما زال شخص في الداخل — اضغط مفتاح الإلغاء (انقر عليه).'), target: 'abort', done: (x) => x.abortHeld },
            { text: T('The person has left — release the abort switch (click again) and let the countdown finish.', 'غادر الشخص — اترك مفتاح الإلغاء (انقر مرة أخرى) ودع العد التنازلي ينتهي.'), target: 'abort', done: (x) => !x.abortHeld && (x.seq === 'discharge' || x.seq === 'hold') },
            { text: T('Discharge within 10 s — watch the concentration reach 7 % and the fire go out.', 'تفريغ خلال 10 ث — راقب وصول التركيز إلى 7% وانطفاء الحريق.'), done: (x) => x.seq === 'hold' && x.fireQ <= 0.5 },
            { text: T('How long must the concentration be held?', 'كم يجب الاحتفاظ بالتركيز؟'), button: T('', ''), choices: [
              { text: T('10 minutes (or until the fire service arrives)', '10 دقائق (أو حتى وصول الدفاع المدني)'), correct: true }, { text: T('30 seconds', '30 ثانية'), correct: false }],
              explain: T('NFPA 2001: at least 10 min hold (≥ 85 % of design concentration at the top of the protected equipment).', 'NFPA 2001: احتفاظ لا يقل عن 10 دقائق (≥ 85% من تركيز التصميم عند أعلى المعدات المحمية).') },
          ],
        },
      ],
    };
  },
};
