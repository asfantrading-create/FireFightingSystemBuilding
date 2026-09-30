// Scenes 5 & 6 — Portable extinguisher placement + PASS, and the landing-valve hose drill.
import * as THREE from 'three';
import { tileFloorMaterial } from './env.js';
import { MAT, tag, room, osyValve, Stream, V, box, cyl, pipe, label3D } from './parts.js';
import { FireFX } from '../scene/kit.js';
import { tr } from '../i18n.js';

const T = (en, ar) => ({ en, ar });

function extinguisher(kind = 'abc') {
  const g = new THREE.Group();
  const body = cyl(0.09, 0.5, kind === 'co2' ? MAT.dark : MAT.red, 0, 0.02, 0, 16); g.add(body);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), kind === 'co2' ? MAT.dark : MAT.red).translateY(0.52));
  g.add(box(0.14, 0.03, 0.04, MAT.dark, 0.03, 0.62, 0));
  const pin = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 12), MAT.yellow); pin.position.set(-0.04, 0.6, 0.03); g.add(pin);
  if (kind === 'co2') g.add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 12, 1, true), MAT.dark).translateX(0.14).translateY(0.3));
  else g.add(pipe([V(0.05, 0.58, 0), V(0.12, 0.45, 0), V(0.12, 0.2, 0.02)], 0.01, MAT.dark));
  g.add(label3D(kind === 'co2' ? 'CO₂' : 'ABC', { size: 0.05, bg: 'rgba(255,255,255,0.95)', color: '#111' }).translateY(0.3).translateZ(0.092));
  g.userData.pin = pin;
  return g;
}

// ───────────────────────── Scene 5: extinguishers
const W = 40, D = 26;                                   // office floor, metres
const WALLS = [                                         // [x0, z0, x1, z1] partitions (with door gaps)
  [-20, -3, -6, -3], [-3, -3, 8, -3], [11, -3, 20, -3],
  [0, -13, 0, -8], [0, -5, 0, -3],
  [-8, 3, -8, 13], [8, 3, 8, 7], [8, 10, 8, 13],
];
const EXIT = V(20, 0, 9);

function cellBlocked(x, z) {
  for (const [x0, z0, x1, z1] of WALLS) {
    const minx = Math.min(x0, x1) - 0.3, maxx = Math.max(x0, x1) + 0.3, minz = Math.min(z0, z1) - 0.3, maxz = Math.max(z0, z1) + 0.3;
    if (x >= minx && x <= maxx && z >= minz && z <= maxz) return true;
  }
  return false;
}

/** Travel-distance coverage on a 0.5 m grid (BFS with diagonal moves) from all extinguishers. */
function coverage(exts, maxTravel = 22.9) {
  const S = 0.5, nx = Math.round(W / S), nz = Math.round(D / S);
  const dist = new Float32Array(nx * nz).fill(Infinity);
  const idx = (i, j) => j * nx + i;
  const q = [];
  for (const e of exts) {
    const i = Math.round((e.x + W / 2) / S), j = Math.round((e.z + D / 2) / S);
    if (i >= 0 && j >= 0 && i < nx && j < nz) { dist[idx(i, j)] = 0; q.push([i, j]); }
  }
  // Dijkstra-lite (uniform grid, small): repeated relaxation queue
  const nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let head = 0;
  while (head < q.length) {
    const [i, j] = q[head++];
    const d0 = dist[idx(i, j)];
    for (const [di, dj, c] of nb) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const x = a * S - W / 2, z = b * S - D / 2;
      if (cellBlocked(x, z)) continue;
      const nd = d0 + c * S;
      if (nd < dist[idx(a, b)] && nd <= maxTravel + 1) { dist[idx(a, b)] = nd; q.push([a, b]); }
    }
  }
  let tot = 0, cov = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (cellBlocked(i * S - W / 2, j * S - D / 2)) continue;
    tot++; if (dist[idx(i, j)] <= maxTravel) cov++;
  }
  return { dist, nx, nz, S, pct: (100 * cov) / tot };
}

export const extinguisherScene = {
  id: 'extinguishers', icon: '🧯',
  title: T('Portable extinguishers: placement & PASS', 'طفايات الحريق المحمولة: التوزيع وطريقة PASS'),
  summary: T('Place 2-A:10-B:C extinguishers on a light-hazard office floor so every point is within 22.9 m (75 ft) travel distance (NFPA 10), then fight a fire using P-A-S-S.', 'وزّع طفايات 2-A:10-B:C في طابق مكاتب خفيف الخطورة بحيث لا تزيد مسافة الوصول عن 22.9 م (75 قدماً) وفق NFPA 10، ثم أطفئ حريقاً بطريقة PASS.'),
  build() {
    const root = new THREE.Group();
    const parts = {};
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), tileFloorMaterial(W, D));
    floor.rotation.x = -Math.PI / 2; floor.userData.ground = true; floor.receiveShadow = true; root.add(floor);
    const wallM = new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.8 });
    root.add(box(W, 2.8, 0.2, wallM, 0, 0, -D / 2)); root.add(box(0.2, 2.8, D, wallM, -W / 2, 0, 0)); root.add(box(W, 0.6, 0.2, wallM, 0, 0, D / 2));
    root.add(box(0.2, 2.8, 10, wallM, W / 2, 0, -8)); root.add(box(0.2, 2.8, 8, wallM, W / 2, 0, 9 + 5));
    for (const [x0, z0, x1, z1] of WALLS) { const len = Math.hypot(x1 - x0, z1 - z0); const b = box(x0 === x1 ? 0.15 : len, 2.6, x0 === x1 ? len : 0.15, wallM, (x0 + x1) / 2, 0, (z0 + z1) / 2); root.add(b); }
    for (let i = 0; i < 26; i++) { const x = -18 + (i % 13) * 3, z = i < 13 ? -10 : 6; root.add(box(1.4, 0.75, 0.7, MAT.white, x, 0, z)); }
    const exitSign = label3D('EXIT ➜', { size: 0.5, bg: 'rgba(22,163,74,0.95)' }); exitSign.position.set(W / 2 - 0.15, 2.4, 9); exitSign.rotation.y = -Math.PI / 2; root.add(exitSign);
    const door = box(0.1, 2.1, 2, new THREE.MeshStandardMaterial({ color: 0x16a34a }), W / 2 - 0.05, 0, 9); root.add(door);
    tag(door, 'exit'); parts.exit = { obj: door, name: T('Exit door', 'باب الخروج'), info: T('Keep the exit behind you when fighting a fire so you can always escape.', 'اجعل باب الخروج خلفك عند مكافحة الحريق لتتمكن دائماً من الهروب.'), free: true };
    // coverage overlay
    const cv = document.createElement('canvas'); cv.width = 80; cv.height = 52;
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter;
    const ov = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.45, depthWrite: false }));
    ov.rotation.x = -Math.PI / 2; ov.position.y = 0.03; ov.visible = false; root.add(ov);
    const extGroup = new THREE.Group(); root.add(extGroup);
    const cab = extinguisher('abc'); cab.position.set(15, 0, 11); cab.scale.setScalar(1.6);
    tag(cab, 'ext'); root.add(cab);
    parts.ext = { obj: cab, name: T('Portable extinguisher 2-A:10-B:C (dry chemical, 6 kg)', 'طفاية محمولة 2-A:10-B:C (بودرة، 6 كغ)'), info: T('Mounted with the top ≤ 1.53 m above the floor (≤ 18 kg units). Inspect monthly: in place, pin & seal intact, gauge in green, no damage.', 'تُثبّت بحيث لا يزيد ارتفاع قمتها عن 1.53 م (للطفايات ≤ 18 كغ). تُفحص شهرياً: في مكانها، المسمار والختم سليمان، المؤشر في الأخضر، دون تلف.'), free: true };
    const co2 = extinguisher('co2'); co2.position.set(-17, 0, -11); co2.scale.setScalar(1.6); tag(co2, 'co2'); root.add(co2);
    parts.co2 = { obj: co2, name: T('CO₂ extinguisher (server / electrical room)', 'طفاية ثاني أكسيد الكربون (غرفة الخوادم/الكهرباء)'), info: T('For Class B and energised electrical (C) fires; leaves no residue. Checked by weight — recharge if it has lost > 10 %.', 'للفئة B والحرائق الكهربائية؛ لا تترك بقايا. تُفحص بالوزن — يُعاد شحنها إذا فقدت أكثر من 10%.'), free: true };
    const fire = new FireFX(root, { base: V(12, 0, 4), openAir: false, smokeCeiling: 2.8, n: 60 });
    const stream = new Stream(root, { n: 260, color: 0xf5f5f5, size: 0.09 });
    const person = new THREE.Group(); person.add(cyl(0.22, 1.1, new THREE.MeshStandardMaterial({ color: 0x1f3a60 }), 0, 0, 0, 12)); person.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd9a77f })).translateY(1.3)); person.visible = false; root.add(person);
    const st = {};
    const reset = (x, mode) => {
      Object.assign(x, { exts: [], placing: mode === 'place', result: null, fireQ: mode === 'pass' ? 60 : 0, standing: null, pass: [], spraying: false, co2Choice: null });
      extGroup.clear(); ov.visible = mode === 'place';
      person.visible = false; draw(x);
    };
    const draw = (x) => {
      const c = coverage(x.exts);
      const g = cv.getContext('2d'); const img = g.createImageData(80, 52);
      for (let j = 0; j < 52; j++) for (let i = 0; i < 80; i++) {
        const d = c.dist[j * c.nx + i]; const k = (j * 80 + i) * 4;
        const blocked = cellBlocked(i * c.S - W / 2, j * c.S - D / 2);
        const ok = d <= 22.9;
        img.data[k] = blocked ? 90 : ok ? 40 : 230; img.data[k + 1] = blocked ? 90 : ok ? 190 : 60; img.data[k + 2] = blocked ? 90 : ok ? 90 : 60; img.data[k + 3] = 255;
      }
      g.putImageData(img, 0, 0); tex.needsUpdate = true;
      x.cov = c.pct;
    };
    reset(st);
    const minUnits = Math.ceil((W * D) / 557);             // 2-A in light hazard: 3000 ft²/A → 6000 ft² = 557 m² per unit
    return {
      root, parts, state: st, reset: (x, id) => reset(x, id === 'place' ? 'place' : id === 'pass' ? 'pass' : null),
      overview: { pos: [0, 38, 20], target: [0, 0, 1] },
      env: { biome: 'desert', sunElevation: 65, sunAzimuth: 200, radius: 40, shadowSize: 30 },
      onGround(p, x, api) {
        if (x.placing) {
          if (cellBlocked(p.x, p.z)) return;
          const e = extinguisher('abc'); e.scale.setScalar(2.2); e.position.set(p.x, 0, p.z); extGroup.add(e);
          x.exts.push({ x: p.x, z: p.z }); draw(x);
          api.msg(`Extinguisher #${x.exts.length} placed — coverage ${x.cov.toFixed(0)} %`, `تم وضع الطفاية رقم ${x.exts.length} — التغطية ${x.cov.toFixed(0)}%`);
          api.rerender();
        } else if (x.fireQ > 0 && (!x.standing || !x.posOk)) {
          x.standing = V(p.x, 0, p.z); person.position.copy(x.standing); person.visible = true;
          const f = V(12, 0, 4);
          const dist = x.standing.distanceTo(f);
          const toMe = x.standing.clone().sub(f).normalize(), toExit = EXIT.clone().sub(f).normalize();
          x.posOk = dist >= 2 && dist <= 4.5 && toMe.dot(toExit) > 0.5;
          api.msg(x.posOk ? `Good position: ${dist.toFixed(1)} m from the fire, exit behind you` : `Poor position (${dist.toFixed(1)} m) — stand 2–4 m away with the exit behind you`, x.posOk ? `موقع جيد: ${dist.toFixed(1)} م من الحريق والمخرج خلفك` : `موقع غير مناسب (${dist.toFixed(1)} م) — قف على بُعد 2–4 م والمخرج خلفك`, x.posOk ? 'good' : 'bad');
          api.rerender();
        }
      },
      tick(dt, x) {
        if (x.spraying && x.fireQ > 0) x.fireQ = Math.max(0, x.fireQ - dt * 12);
        else if (x.fireQ > 0 && x.fireQ < 400 && !x.spraying) x.fireQ += dt * 0.6;
        fire.set(x.fireQ, x.fireQ > 0 ? 0.4 : 0); fire.update(dt);
        if (x.standing) stream.set(x.spraying && x.fireQ > 0 ? 1 : 0, x.standing.clone().add(V(0, 0.9, 0)), V(12, 0.1, 4).sub(x.standing).setY(-0.2).normalize(), 5, 0.15);
        stream.update(dt);
      },
      readouts: (x) => x.placing || x.exts.length ? [
        [T('Extinguishers placed', 'الطفايات الموزعة'), `${x.exts.length} (min. ${minUnits} by area)`],
        [T('Floor within 22.9 m travel', 'المساحة ضمن مسافة 22.9 م'), `${(x.cov ?? 0).toFixed(1)} %`, x.cov >= 99.5 ? '' : 'warn'],
        [T('Rule (light hazard, 2-A)', 'القاعدة (خطورة خفيفة، 2-A)'), '557 m²/unit · 75 ft travel'],
      ] : [
        [T('Fire size', 'حجم الحريق'), `${Math.round(x.fireQ)} kW`, x.fireQ > 0 ? 'alarm' : ''],
        [T('Your position', 'موقعك'), x.standing ? (x.posOk ? tr(T('correct', 'صحيح')) : tr(T('unsafe', 'غير آمن'))) : '—'],
      ],
      procedures: [
        {
          id: 'place', title: T('Placement design (NFPA 10)', 'تصميم التوزيع (NFPA 10)'),
          steps: [
            { text: T(`Click on the floor to place extinguishers until every point is green (≤ 22.9 m walking distance). Minimum by area: ${minUnits}.`, `انقر على الأرضية لوضع الطفايات حتى تصبح كل النقاط خضراء (≤ 22.9 م مسافة سير). الحد الأدنى حسب المساحة: ${minUnits}.`), button: T('Check my design', 'افحص تصميمي'), done: (x) => x.cov >= 99.5 && x.exts.length >= minUnits, notYet: T('Some areas are beyond 22.9 m, or too few units for the area', 'بعض المناطق أبعد من 22.9 م أو عدد الطفايات أقل من المطلوب للمساحة') },
            { text: T('Which extinguisher should protect the server / electrical room?', 'أي طفاية يجب أن تحمي غرفة الخوادم/الكهرباء؟'), button: T('', ''), choices: [
              { text: T('Water (APW)', 'ماء مضغوط'), correct: false }, { text: T('CO₂ (clean, non-conductive)', 'ثاني أكسيد الكربون (نظيف وغير موصل)'), correct: true }, { text: T('Foam', 'رغوة'), correct: false }],
              explain: T('Energised electrical equipment needs a non-conductive agent; CO₂ leaves no residue on electronics.', 'المعدات الكهربائية المكهربة تحتاج مادة غير موصلة؛ وثاني أكسيد الكربون لا يترك بقايا على الإلكترونيات.') },
            { text: T('Maximum mounting height for extinguishers ≤ 18 kg (top of unit)?', 'أقصى ارتفاع تثبيت للطفايات ≤ 18 كغ (قمة الطفاية)؟'), button: T('', ''), choices: [
              { text: T('1.53 m (5 ft)', '1.53 م (5 أقدام)'), correct: true }, { text: T('2.0 m', '2.0 م'), correct: false }, { text: T('1.07 m', '1.07 م'), correct: false }],
              explain: T('≤ 18 kg: top ≤ 1.53 m; heavier units: top ≤ 1.07 m; bottom ≥ 0.1 m above floor.', '≤ 18 كغ: القمة ≤ 1.53 م؛ الأثقل: ≤ 1.07 م؛ والقاعدة ≥ 0.1 م فوق الأرض.') },
          ],
        },
        {
          id: 'pass', title: T('Fight the fire: P-A-S-S', 'أطفئ الحريق: P-A-S-S'),
          steps: [
            { text: T('A waste-bin fire is growing. Raise the alarm first (manual call point).', 'حريق في سلة مهملات يتزايد. أطلق الإنذار أولاً (نقطة الإنذار اليدوية).'), button: T('Alarm raised ✓', 'تم إطلاق الإنذار ✓') },
            { text: T('Take the ABC extinguisher from its bracket.', 'خذ طفاية ABC من حاملها.'), target: 'ext' },
            { text: T('Click on the floor where you will stand: 2–4 m from the fire with the EXIT behind you.', 'انقر على الأرضية حيث ستقف: على بُعد 2–4 م من الحريق والمخرج خلفك.'), done: (x) => x.standing && x.posOk, notYet: T('Choose a safe position', 'اختر موقعاً آمناً'), onDo: () => {} },
            { text: T('Step 1 of PASS?', 'الخطوة الأولى من PASS؟'), button: T('', ''), choices: [
              { text: T('Pull the pin', 'اسحب المسمار'), correct: true }, { text: T('Squeeze the lever', 'اضغط المقبض'), correct: false }, { text: T('Sweep side to side', 'حرّك يميناً ويساراً'), correct: false }],
              explain: T('Pull the pin — breaks the tamper seal.', 'اسحب مسمار الأمان — يكسر ختم العبث.') },
            { text: T('Step 2?', 'الخطوة الثانية؟'), button: T('', ''), choices: [
              { text: T('Aim at the flames', 'صوّب على اللهب'), correct: false }, { text: T('Aim low at the base of the fire', 'صوّب منخفضاً على قاعدة الحريق'), correct: true }, { text: T('Aim at the smoke', 'صوّب على الدخان'), correct: false }],
              explain: T('Aim at the base — the fuel, not the flames.', 'صوّب على القاعدة — الوقود وليس اللهب.') },
            { text: T('Step 3?', 'الخطوة الثالثة؟'), button: T('', ''), choices: [
              { text: T('Squeeze the lever slowly and evenly', 'اضغط المقبض ببطء وبانتظام'), correct: true }, { text: T('Shake the extinguisher', 'هز الطفاية'), correct: false }],
              explain: T('Squeeze — discharge starts.', 'اضغط — يبدأ التفريغ.'), },
            { text: T('Step 4: sweep from side to side at the base until the fire is out.', 'الخطوة الرابعة: حرّك من جانب لآخر على القاعدة حتى ينطفئ الحريق.'), button: T('Sweep', 'حرّك'), onDo: (x) => { x.spraying = true; } },
            { text: T('Keep sweeping until the fire is out, then watch for re-ignition and back away toward the exit.', 'استمر حتى ينطفئ الحريق ثم راقب إعادة الاشتعال وتراجع نحو المخرج.'), done: (x) => x.fireQ <= 0.5 },
          ],
        },
      ],
    };
  },
};

// ───────────────────────── Scene 6: hose drill
export const hoseDrillScene = {
  id: 'hosedrill', icon: '🧑‍🚒',
  title: T('Hose drill: landing valve & fire hose cabinet', 'تدريب الخرطوم: صمام الهبوط وخزانة الحريق'),
  summary: T('Two-person team: open the cabinet, run out the 65 mm hose without kinks, couple and tug-test, fit the branch nozzle, open the landing valve slowly and attack the fire at its base.', 'فريق من شخصين: افتح الخزانة، ومد خرطوم 65 مم دون التواء، واربط الوصلة واختبرها بالشد، وركّب القاذف، وافتح صمام الهبوط ببطء وهاجم قاعدة الحريق.'),
  build() {
    const root = new THREE.Group();
    const parts = {};
    const P = (id, obj, name, info, extra = {}) => { tag(obj, id); parts[id] = { obj, name, info, ...extra }; root.add(obj); return obj; };
    root.add(room(30, 8, 3.2));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), new THREE.MeshStandardMaterial({ color: 0xb9b3a8 })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.01; fl.userData.ground = true; root.add(fl);
    // fire hose cabinet on the back wall
    const cab = new THREE.Group(); cab.position.set(-11, 0.5, -3.8);
    cab.add(box(1.4, 1.6, 0.35, MAT.red, 0, 0, 0));
    const door = new THREE.Group(); door.position.set(-0.7, 0, 0.18);
    door.add(box(1.4, 1.6, 0.03, MAT.glass, 0.7, 0, 0)); door.add(box(1.4, 0.06, 0.04, MAT.red, 0.7, 0, 0)); door.add(box(1.4, 0.06, 0.04, MAT.red, 0.7, 1.55, 0));
    cab.add(door);
    const reel = new THREE.Group(); reel.position.set(0.3, 1.0, 0.05);
    reel.add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 10, 24), MAT.red)); cab.add(reel);
    cab.add(label3D('FIRE HOSE', { size: 0.12 }).translateY(1.7).translateZ(0.2));
    P('door', cab, T('Fire hose cabinet (FHC)', 'خزانة خرطوم الحريق'), T('Contains a 25 mm hose reel for occupants, a 40/65 mm landing valve with rack-stored hose for trained staff / fire brigade, a branch nozzle and a portable extinguisher. Break the glass or open the door.', 'تحتوي بكرة خرطوم 25 مم للشاغلين، وصمام هبوط 40/65 مم مع خرطوم مطوي للمدربين والدفاع المدني، وقاذفاً وطفاية. اكسر الزجاج أو افتح الباب.'));
    const lv = osyValve(0.09); lv.position.set(-9.9, 1.0, -3.7); lv.rotation.z = Math.PI / 2;
    P('valve', lv, T('Landing valve 65 mm (2½")', 'صمام الهبوط 65 مم (2½ بوصة)'), T('Class I/III standpipe outlet, 6.9 bar (100 psi) residual at the most remote outlet (NFPA 14). Open slowly to avoid water hammer and hose whip.', 'مخرج الأنبوب القائم Class I/III بضغط متبقٍ 6.9 بار في أبعد مخرج (NFPA 14). يُفتح ببطء لتجنب المطرقة المائية وانفلات الخرطوم.'));
    root.add(pipe([V(-9.9, -0.3, -3.9), V(-9.9, 3.2, -3.9)], 0.1, MAT.red));
    const coup = new THREE.Group(); coup.position.set(-9.6, 1.0, -3.55); coup.add(cyl(0.06, 0.12, MAT.brass, 0, 0, 0, 12).rotateX(Math.PI / 2));
    P('coupling', coup, T('Instantaneous coupling (valve outlet)', 'وصلة لحظية (مخرج الصمام)'), T('Push-in coupling: after connecting, give a sharp tug to prove it is locked.', 'وصلة بالدفع: بعد الربط اسحبها بقوة للتأكد من إقفالها.'));
    // hose (grows along the floor)
    const hoseMat = new THREE.MeshStandardMaterial({ color: 0xe9e4d4, roughness: 0.8 });
    const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 10), hoseMat); hose.rotation.z = Math.PI / 2; hose.position.y = 0.05; hose.visible = false; root.add(hose);
    const rack = box(0.6, 0.5, 0.25, hoseMat, -11, 0.25, -3.5); P('hose', rack, T('Rack / flaked 65 mm hose (30 m)', 'خرطوم 65 مم مطوي (30 م)'), T('Run it out in a straight line toward the fire — no kinks or twists, which cut the flow.', 'مدّه في خط مستقيم نحو الحريق — دون التواء أو انثناء لأنه يقلل التدفق.'));
    const nozzle = new THREE.Group(); nozzle.add(cyl(0.05, 0.4, MAT.brass, 0, 0, 0, 12, 0.025).rotateZ(-Math.PI / 2)); nozzle.position.set(-10.6, 1.3, -3.4);
    P('nozzle', nozzle, T('Branch pipe / adjustable nozzle', 'القاذف / الفوهة القابلة للضبط'), T('Jet for reach, spray for cooling and protection. Two people: the nozzle operator and a back-up holding the hose ~1 m behind.', 'نفث مستقيم للمدى ورذاذ للتبريد والحماية. شخصان: مشغّل الفوهة ومساند يمسك الخرطوم على بُعد ~1 م خلفه.'));
    const mcp = box(0.15, 0.15, 0.05, new THREE.MeshStandardMaterial({ color: 0xdc2626 }), -8, 1.35, -3.95);
    P('mcp', mcp, T('Manual call point', 'نقطة الإنذار اليدوية'), T('Raise the alarm before fighting any fire.', 'أطلق الإنذار قبل مكافحة أي حريق.'));
    const fire = new FireFX(root, { base: V(10, 0, 0), smokeCeiling: 3.2, n: 70 });
    const stream = new Stream(root, { n: 320, size: 0.07 });
    const people = [0, 1].map(() => { const g = new THREE.Group(); g.add(cyl(0.22, 1.1, new THREE.MeshStandardMaterial({ color: 0x2b2b2b }), 0, 0, 0, 12)); g.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), MAT.yellow).translateY(1.35)); g.visible = false; root.add(g); return g; });
    const st = {};
    const reset = (x) => Object.assign(x, { door: false, alarm: false, hoseOut: 0, coupled: false, tug: false, nozzle: false, team: false, valve: 0, maxRate: 0, fireQ: 300, aimed: false, closed: false });
    reset(st);
    parts.door.onPick = (x, api) => { x.door = true; api.msg('Cabinet open', 'تم فتح الخزانة'); };
    parts.mcp.onPick = (x, api) => { x.alarm = true; api.msg('Fire alarm activated', 'تم تفعيل إنذار الحريق', 'good'); };
    parts.hose.onPick = (x, api) => { if (!x.door) return api.mistake('Open the cabinet first', 'افتح الخزانة أولاً'); x.runOut = true; };
    parts.coupling.onPick = (x, api) => { if (x.hoseOut < 1) return api.mistake('Run out the hose first', 'مد الخرطوم أولاً'); x.coupled = true; api.msg('Coupling connected', 'تم ربط الوصلة'); };
    parts.nozzle.onPick = (x, api) => { if (!x.coupled) return api.mistake('Couple the hose to the valve first', 'اربط الخرطوم بالصمام أولاً'); x.nozzle = true; api.msg('Branch nozzle fitted at the hose end', 'تم تركيب القاذف في نهاية الخرطوم'); };
    parts.valve.onPick = (x, api) => { if (x.fireQ <= 1) { x.valve = 0; x.closed = true; api.msg('Landing valve closed', 'تم إغلاق صمام الهبوط'); } };
    return {
      root, parts, state: st, reset,
      overview: { pos: [-3, 6.5, 13], target: [-2, 0.8, -1.5] },
      env: { biome: 'desert', sunElevation: 60, sunAzimuth: 200, radius: 30, shadowSize: 20 },
      controls: [{ type: 'slider', label: T('Landing valve opening (open SLOWLY)', 'فتحة صمام الهبوط (افتح ببطء)'), min: 0, max: 1, step: 0.01, get: (x) => x.valve,
        set: (x, v, api) => {
          const now = x.time;
          if (!x.nozzle || !x.team) { api.mistake('Fit the nozzle and get your back-up in position before opening the valve!', 'ركّب القاذف وتأكد من وجود المساند قبل فتح الصمام!'); }
          if (x.lastT !== undefined && now > x.lastT) x.maxRate = Math.max(x.maxRate, Math.abs(v - x.valve) / (now - x.lastT));
          if (v - x.valve > 0.35) { api.mistake('Opened too fast — water hammer / hose whip!', 'فتح سريع جداً — مطرقة مائية وانفلات الخرطوم!'); }
          x.valve = v; x.lastT = now;
        }, fmt: (v) => `${Math.round(v * 100)} %` }],
      tick(dt, x) {
        door.children.forEach(() => {}); door.rotation.y = x.door ? -1.6 : 0;
        if (x.runOut && x.hoseOut < 1) x.hoseOut = Math.min(1, x.hoseOut + dt * 0.5);
        const len = 1 + x.hoseOut * 16;
        hose.visible = x.hoseOut > 0; hose.scale.y = len; hose.position.set(-9.6 + len / 2, 0.05, -3.2 + x.hoseOut * 3);
        hose.rotation.set(0, Math.atan2(-(x.hoseOut * 3), len) * 0, Math.PI / 2);
        const tip = V(-9.6 + len, 1.1, -3.2 + x.hoseOut * 3);
        if (x.nozzle) nozzle.position.copy(tip);
        people.forEach((p, i) => { p.visible = x.team; p.position.set(tip.x - 0.4 - i * 1.1, 0, tip.z + 0.3); });
        const q = x.valve * (x.nozzle ? 1 : 0);
        stream.set(q > 0.05 ? 1 : 0, tip.clone().add(V(0.2, 0, 0)), V(10, 0.2, 0).sub(tip).setY(0.25).normalize(), 6 + q * 9, 0.05); stream.update(dt);
        if (q > 0.5 && x.aimed) x.fireQ = Math.max(0, x.fireQ - dt * 90 * q);
        else if (x.fireQ > 0) x.fireQ = Math.min(1500, x.fireQ + dt * 4);
        fire.set(x.fireQ, x.fireQ > 0 ? 0.6 : 0.2); fire.update(dt);
      },
      readouts: (x) => [
        [T('Hose run out', 'طول الخرطوم الممدود'), `${Math.round(x.hoseOut * 30)} m`],
        [T('Coupling', 'الوصلة'), x.coupled ? (x.tug ? tr(T('locked (tug-tested)', 'مقفلة (مختبرة)')) : tr(T('connected', 'مربوطة'))) : '—'],
        [T('Landing valve', 'صمام الهبوط'), `${Math.round(x.valve * 100)} %`],
        [T('Nozzle flow', 'تدفق الفوهة'), `${Math.round(x.valve * (x.nozzle ? 473 : 0))} L/min`],
        [T('Fire', 'الحريق'), `${Math.round(x.fireQ)} kW`, x.fireQ > 0 ? 'alarm' : ''],
      ],
      procedures: [{
        id: 'drill', title: T('Landing-valve hose drill', 'تدريب صمام الهبوط'),
        steps: [
          { text: T('Raise the alarm: operate the manual call point.', 'أطلق الإنذار: شغّل نقطة الإنذار اليدوية.'), target: 'mcp' },
          { text: T('Open the fire hose cabinet (break the glass).', 'افتح خزانة الحريق (اكسر الزجاج).'), target: 'door' },
          { text: T('Take the hose and run it out toward the fire — straight, no kinks.', 'خذ الخرطوم ومدّه نحو الحريق — مستقيماً ودون التواء.'), target: 'hose', done: (x) => x.hoseOut >= 1 },
          { text: T('Connect the hose coupling to the landing valve outlet.', 'اربط وصلة الخرطوم بمخرج صمام الهبوط.'), target: 'coupling' },
          { text: T('Give the coupling a sharp tug to prove it is locked.', 'اسحب الوصلة بقوة للتأكد من إقفالها.'), button: T('Tug test ✓', 'اختبار الشد ✓'), onDo: (x) => { x.tug = true; } },
          { text: T('Fit the branch nozzle at the hose end (nozzle closed).', 'ركّب القاذف في نهاية الخرطوم (الفوهة مغلقة).'), target: 'nozzle' },
          { text: T('Back-up person takes position ~1 m behind the nozzle operator.', 'يتخذ المساند موقعه على بُعد ~1 م خلف مشغّل الفوهة.'), button: T('Team in position ✓', 'الفريق في موقعه ✓'), onDo: (x) => { x.team = true; } },
          { text: T('Open the landing valve SLOWLY to full (use the slider in small steps).', 'افتح صمام الهبوط ببطء حتى النهاية (استخدم المنزلق بخطوات صغيرة).'), done: (x) => x.valve >= 0.95 },
          { text: T('Aim at the base of the fire and sweep until it is out.', 'صوّب على قاعدة الحريق وحرّك حتى ينطفئ.'), button: T('Aim at base', 'صوّب على القاعدة'), onDo: (x) => { x.aimed = true; } },
          { text: T('Wait until the fire is out.', 'انتظر حتى ينطفئ الحريق.'), done: (x) => x.fireQ <= 1 },
          { text: T('Close the landing valve.', 'أغلق صمام الهبوط.'), target: 'valve' },
        ],
      }],
    };
  },
};
