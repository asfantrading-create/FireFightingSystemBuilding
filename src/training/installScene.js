// Scene 10 — Installation mode: lay out smoke detectors (NFPA 72) and pendent sprinklers (NFPA 13)
// on the suspended ceiling of an open-plan office, with live coverage, obstruction rules (supply
// diffusers, downstand beam pockets, the sprinkler "beam rule", an exposed duct, a column) and
// a "fix the installer's mistakes" exercise.
import * as THREE from 'three';
import { MAT, tag, V, box, cyl, pipe, label3D } from './parts.js';
import { pbr } from '../scene/world.js';
import { tr, getLang } from '../i18n.js';

const T = (en, ar) => ({ en, ar });
const L = (en, ar) => (getLang() === 'ar' ? ar : en);

// ───────────────────────── geometry of the office floor (metres; x → east, z → south)
const W = 20, D = 14, H = 3.0;
const X0 = -W / 2, X1 = W / 2, Z0 = -D / 2, Z1 = D / 2;
const TILE = 0.6;
const BEAM = { x0: 1.825, x1: 2.175, z0: Z0, z1: Z1, bottom: H - 0.5 };          // 350 × 500 mm downstand beam
const COLUMN = { x0: 1.75, x1: 2.25, z0: -0.25, z1: 0.25 };                         // 500 × 500 mm column under the beam
const DUCT = { x0: X0, x1: 1.6, z0: 4.2 - 0.225, z1: 4.2 + 0.225, bottom: H - 0.05 - 0.45 }; // Ø450 exposed spiral duct
const DIFFS = [[-5.5, -3.7], [4.7, -4.3], [4.7, 1.1]];                               // 600 × 600 four-way supply diffusers
const LIGHTS = [];                                                                   // 600 × 1200 LED troffers
for (const x of [-9.1, -5.5, -1.9, 3.5, 7.1]) for (const z of [-4.6, -1.0, 2.0, 5.6]) LIGHTS.push([x, z]);

const S_LISTED = 9.1, R_DET = 0.7 * S_LISTED;                                       // NFPA 72 §17.7.4.2.3.1 / A.17.7.4.2.3
const SPK_AREA = 20.9, SPK_MAX_S = 4.6, SPK_MIN_S = 1.8, SPK_WALL_MAX = 2.3, WALL_MIN = 0.1;
const SPK_HALF = Math.sqrt(SPK_AREA) / 2;                                            // 4.57 m square → 20.9 m²
const DIFF_CLEAR = 0.9;
// NFPA 13 (2022) Table 10.2.7.2.1.3 — standard-spray pendent/upright: [A upper bound (m), max B (m)]
const BEAM_RULE = [[0.305, 0], [0.457, 0.064], [0.610, 0.089], [0.762, 0.140], [0.914, 0.191], [1.067, 0.241], [1.219, 0.305], [1.372, 0.356], [1.524, 0.419], [Infinity, 0.457]];
const beamAllowedB = (A) => BEAM_RULE.find(([a]) => A < a)[1];
const beamRequiredA = (B) => { if (B <= 0) return 0; let lo = 0; for (const [a, b] of BEAM_RULE) { if (b >= B) return lo; lo = a; } return Infinity; };

const rectDist = (x, z, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
const inRect = (x, z, r, m = 0) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;
const diffRect = ([x, z]) => ({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3 });
const lightRect = ([x, z]) => ({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.6, z1: z + 0.6 });
const pocketOf = (x) => (x < BEAM.x0 ? 0 : x > BEAM.x1 ? 1 : -1);
const wallDist = (x, z) => Math.min(x - X0, X1 - x, z - Z0, Z1 - z);
const f2 = (v) => v.toFixed(2);

// theoretical minimum device counts (used for the efficiency bonus)
function minDetectors() {
  let n = 0;
  for (const w of [BEAM.x0 - X0, X1 - BEAM.x1]) {
    let best = Infinity;
    for (let nx = 1; nx <= 6; nx++) {
      const cw = w / nx; if (cw >= 2 * R_DET) continue;
      best = Math.min(best, nx * Math.ceil(D / Math.sqrt((2 * R_DET) ** 2 - cw * cw)));
    }
    n += best;
  }
  return n;
}
const MIN_DET = minDetectors();
const MIN_SPK = Math.ceil(W / (2 * SPK_HALF)) * Math.ceil(D / (2 * SPK_HALF));

// ───────────────────────── rule evaluation
const CELL = 0.2, NX = Math.round(W / CELL), NZ = Math.round(D / CELL);

/** Evaluate every device and the coverage of both systems. Returns a result object stored in st.ev. */
function evaluate(st) {
  const defl = st.defl;
  const dets = st.dets.map((d) => ({ d, reasons: [] }));
  const spks = st.spks.map((d) => ({ d, reasons: [] }));
  // ── smoke detectors (NFPA 72)
  for (const r of dets) {
    const { x, z } = r.d;
    const wd = wallDist(x, z);
    if (wd < WALL_MIN) r.reasons.push({ k: 'wall', t: T(`${f2(wd)} m from the wall — ceiling detectors must be ≥ 0.1 m (4 in) from a sidewall (NFPA 72 §17.7.3.2.1)`, `${f2(wd)} م من الجدار — يجب أن يبعد كاشف السقف ≥ 0.1 م (4 بوصات) عن الجدار (NFPA 72 §17.7.3.2.1)`) });
    for (const df of DIFFS) {
      const dd = rectDist(x, z, diffRect(df));
      if (dd < DIFF_CLEAR - 1e-6) r.reasons.push({ k: 'diff', t: T(`${f2(dd)} m from a supply-air diffuser — keep ≥ 0.9 m (3 ft) (NFPA 72 §17.7.4.3)`, `${f2(dd)} م من ناشر هواء الإمداد — يجب ألا تقل المسافة عن 0.9 م (3 أقدام) (NFPA 72 §17.7.4.3)`) });
    }
  }
  // ── sprinklers (NFPA 13, light hazard, standard-spray pendent)
  const deflBad = defl < 0.025 - 1e-6 || defl > 0.305 + 1e-6;
  for (const r of spks) {
    const { x, z } = r.d;
    if (deflBad) r.reasons.push({ k: 'defl', t: T(`Deflector ${Math.round(defl * 1000)} mm below the ceiling — must be 25–305 mm (1–12 in) (NFPA 13 §10.2.6.1.1)`, `العاكس على بُعد ${Math.round(defl * 1000)} مم تحت السقف — يجب أن يكون 25–305 مم (NFPA 13 §10.2.6.1.1)`) });
    const wd = wallDist(x, z);
    if (wd < WALL_MIN) r.reasons.push({ k: 'wallmin', t: T(`${f2(wd)} m from the wall — minimum 0.1 m (4 in) (NFPA 13 §10.2.5.3)`, `${f2(wd)} م من الجدار — الحد الأدنى 0.1 م (4 بوصات) (NFPA 13 §10.2.5.3)`) });
    // outermost head toward each wall must be ≤ 2.3 m (½ of 4.6 m) from it
    const sides = [
      [x - X0, (o) => Math.abs(o.z - z) < SPK_WALL_MAX && o.x < x - 0.05, T('west', 'الغربي')],
      [X1 - x, (o) => Math.abs(o.z - z) < SPK_WALL_MAX && o.x > x + 0.05, T('east', 'الشرقي')],
      [z - Z0, (o) => Math.abs(o.x - x) < SPK_WALL_MAX && o.z < z - 0.05, T('north', 'الشمالي')],
      [Z1 - z, (o) => Math.abs(o.x - x) < SPK_WALL_MAX && o.z > z + 0.05, T('south', 'الجنوبي')],
    ];
    const far = sides.filter(([dist, between]) => dist > SPK_WALL_MAX + 1e-6 && !st.spks.some((o) => o !== r.d && between(o)));
    if (far.length) {
      r.reasons.push({ k: 'wallmax', t: T(`outermost head ${far.map(([dd, , nm]) => `${f2(dd)} m from the ${nm.en} wall`).join(', ')} — max. 2.3 m (½ × 4.6 m spacing) (NFPA 13 §10.2.5.2)`,
        `رشاش طرفي ${far.map(([dd, , nm]) => `${f2(dd)} م من الجدار ${nm.ar}`).join('، ')} — الحد الأقصى 2.3 م (نصف التباعد 4.6 م) (NFPA 13 §10.2.5.2)`) });
    }
    for (const o of st.spks) {
      if (o === r.d) continue;
      const dd = Math.hypot(o.x - x, o.z - z);
      if (dd < SPK_MIN_S - 1e-6) { r.reasons.push({ k: 'min', t: T(`only ${f2(dd)} m from ${o.id} — heads must be ≥ 1.8 m (6 ft) apart to avoid cold-soldering (NFPA 13 §10.2.5.4)`, `${f2(dd)} م فقط من ${o.id} — يجب ألا يقل التباعد عن 1.8 م (6 أقدام) لتجنب التبريد المتبادل (NFPA 13 §10.2.5.4)`) }); break; }
    }
    // beam rule for the downstand beam and the exposed duct
    for (const [ob, nm] of [[BEAM, T('beam', 'العارضة')], [DUCT, T('duct', 'مجرى الهواء')]]) {
      const B = (H - defl) - ob.bottom;
      if (B <= 0) continue;
      const A = rectDist(x, z, ob);
      const allowed = beamAllowedB(A);
      if (B > allowed + 1e-6) {
        const need = beamRequiredA(B);
        r.reasons.push({ k: ob === BEAM ? 'beam' : 'duct', t: T(`obstructed by the ${nm.en}: ${f2(A)} m from its side with the deflector ${Math.round(B * 1000)} mm above its bottom (max ${Math.round(allowed * 1000)} mm) — move ≥ ${f2(need)} m away (NFPA 13 beam rule, Table 10.2.7.2.1.3)`, `معاق بـ${nm.ar}: ${f2(A)} م من جانبها والعاكس أعلى من أسفلها بـ ${Math.round(B * 1000)} مم (الحد ${Math.round(allowed * 1000)} مم) — ابتعد ≥ ${f2(need)} م (قاعدة العارضة NFPA 13، الجدول 10.2.7.2.1.3)`) });
      }
    }
    const ac = rectDist(x, z, COLUMN);
    if (ac < 0.6) r.reasons.push({ k: 'col', t: T(`${f2(ac)} m from the column — keep ≥ 3 × its width, max. 0.6 m (24 in) (NFPA 13 §10.2.7.3)`, `${f2(ac)} م من العمود — يلزم ≥ 3 أضعاف عرضه وبحد أقصى 0.6 م (NFPA 13 §10.2.7.3)`) });
  }
  // ── coverage (0.2 m grid over the ceiling)
  const vd = dets.filter((r) => !r.reasons.length).map((r) => r.d);
  const vs = spks.filter((r) => !r.reasons.length).map((r) => r.d);
  let dTot = [0, 0], dCov = [0, 0], sTot = 0, sCov = 0;
  for (let j = 0; j < NZ; j++) {
    const z = Z0 + (j + 0.5) * CELL;
    for (let i = 0; i < NX; i++) {
      const x = X0 + (i + 0.5) * CELL;
      if (inRect(x, z, COLUMN)) continue;
      sTot++;
      if (vs.some((s) => Math.abs(s.x - x) <= SPK_HALF && Math.abs(s.z - z) <= SPK_HALF)) sCov++;
      const p = pocketOf(x);
      if (p < 0) continue;
      dTot[p]++;
      if (vd.some((d) => pocketOf(d.x) === p && (d.x - x) ** 2 + (d.z - z) ** 2 <= R_DET * R_DET)) dCov[p]++;
    }
  }
  const pk = [0, 1].map((p) => (100 * dCov[p]) / dTot[p]);
  const ev = {
    dets, spks,
    detCov: (100 * (dCov[0] + dCov[1])) / (dTot[0] + dTot[1]), pocket: pk,
    spkCov: (100 * sCov) / sTot,
    detViol: dets.filter((r) => r.reasons.length).length,
    spkViol: spks.filter((r) => r.reasons.length).length,
    has: (list, k) => list.some((r) => r.reasons.some((q) => q.k === k)),
  };
  ev.detOk = ev.detCov >= 98 && ev.detViol === 0 && st.dets.length > 0;
  ev.spkOk = ev.spkCov >= 98 && ev.spkViol === 0 && st.spks.length > 0;
  return ev;
}

// ───────────────────────── reference & "installer's mistakes" layouts
const REF_DET = [[-7.3, -3.1], [-1.3, -3.1], [-7.3, 3.5], [-1.3, 3.5], [6.5, -3.7], [6.5, 3.5]];
const REF_SPK = [];
for (const x of [-7.9, -3.7, -0.1, 4.1, 8.3]) for (const z of [-5.5, -1.9, 2.3, 5.9]) REF_SPK.push([x, z]);
const FIX_DET = [[-4.9, -3.7], [-1.3, -3.1], [-7.3, 3.5], [-1.3, 3.5], [1.1, 0.5]];
const FIX_SPK = REF_SPK.filter(([x, z]) => !(x === -0.1 && z === -1.9) && !(x === 8.3 && z === -5.5) && !(x === -3.7 && z === 2.3))
  .concat([[-2.5, -1.9], [8.3, -4.3], [-3.7, 3.5]]);

// ───────────────────────── textures
function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  return t;
}
function noiseRand(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

/** Mineral-fibre 600 × 600 ceiling tile with the white T-bar grid on its edges. */
const tileTexture = () => canvasTex(256, 256, (g, w, h) => {
  const R = noiseRand(5);
  g.fillStyle = '#f1f0ec'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 200 + R() * 40; g.fillStyle = `rgba(${v - 40},${v - 42},${v - 50},${0.10 + R() * 0.18})`; g.fillRect(R() * w, R() * h, 1 + R() * 2.2, 1 + R() * 2.2); }
  for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(120,118,110,0.25)'; g.beginPath(); g.arc(R() * w, R() * h, 0.8 + R() * 1.2, 0, 7); g.fill(); }
  g.fillStyle = '#fbfbf9'; g.fillRect(0, 0, w, 7); g.fillRect(0, 0, 7, h);
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(7, 7, w - 7, 3); g.fillRect(7, 7, 3, h - 7);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, h - 3, w, 3); g.fillRect(w - 3, 0, 3, h);
}, { repeat: true });

/** Loop-pile carpet tiles (500 mm) in charcoal / slate with quarter-turn texture. */
const carpetTexture = () => canvasTex(512, 512, (g, w, h) => {
  const R = noiseRand(9);
  const n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const base = (i + j) % 2 ? [74, 80, 88] : [66, 72, 81];
    g.fillStyle = `rgb(${base})`; g.fillRect(i * s, j * s, s, s);
    const horiz = (i + j) % 2 === 0;
    for (let k = 0; k < 380; k++) {
      const v = (R() - 0.5) * 34;
      g.fillStyle = `rgba(${base[0] + v},${base[1] + v},${base[2] + v + 4},0.55)`;
      const x = i * s + R() * s, y = j * s + R() * s;
      if (horiz) g.fillRect(x, y, 3 + R() * 9, 1.2); else g.fillRect(x, y, 1.2, 3 + R() * 9);
    }
    g.strokeStyle = 'rgba(20,22,26,0.35)'; g.lineWidth = 1.2; g.strokeRect(i * s + 0.5, j * s + 0.5, s - 1, s - 1);
  }
}, { repeat: true });

/** Four-way square ceiling diffuser face (concentric louvres). */
const diffuserTexture = () => canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#e9ebec'; g.fillRect(0, 0, w, w);
  for (let i = 0; i < 6; i++) {
    const m = 18 + i * 17;
    g.strokeStyle = i % 2 ? '#b5babf' : '#8d949a'; g.lineWidth = 7; g.strokeRect(m, m, w - 2 * m, w - 2 * m);
    g.strokeStyle = '#fafbfb'; g.lineWidth = 2; g.strokeRect(m - 4, m - 4, w - 2 * m + 8, w - 2 * m + 8);
  }
  g.fillStyle = '#51585e'; g.fillRect(w / 2 - 22, w / 2 - 22, 44, 44);
  g.strokeStyle = '#c9ced2'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, w); g.moveTo(w, 0); g.lineTo(0, w); g.stroke();
});

/** LED troffer face: opal diffuser with a slim frame. */
const troferTexture = () => canvasTex(128, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#f6f6f2'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#f6f6f2');
  g.fillStyle = '#d8dadc'; g.fillRect(0, 0, w, h);
  g.fillStyle = gr; g.fillRect(8, 8, w - 16, h - 16);
});

/** Galvanised spiral duct. */
const spiralTexture = () => canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#b6bcc1'; g.fillRect(0, 0, w, h);
  const R = noiseRand(3);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${R() > 0.5 ? '255,255,255' : '70,75,80'},0.08)`; g.fillRect(R() * w, R() * h, 6 + R() * 16, 2); }
  g.strokeStyle = 'rgba(60,65,70,0.55)'; g.lineWidth = 3;
  for (let x = -h; x < w + h; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h * 0.35, h); g.stroke(); }
}, { repeat: true });

const exitTexture = () => canvasTex(320, 128, (g, w, h) => {
  g.fillStyle = '#128a3b'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = 'bold 66px Arial'; g.textBaseline = 'middle'; g.fillText('EXIT', 100, h / 2 + 4);
  g.fillRect(28, 34, 24, 64); g.beginPath(); g.arc(40, 22, 12, 0, 7); g.fill();
  g.beginPath(); g.moveTo(296, h / 2); g.lineTo(266, h / 2 - 26); g.lineTo(266, h / 2 + 26); g.fill(); g.fillRect(232, h / 2 - 9, 40, 18);
});

/** A plane in the XZ plane with UVs derived from world coordinates. */
function flatPlane(x0, z0, x1, z1, y, mat, { down = false, uv = 'tile' } = {}) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  g.rotateX(down ? Math.PI / 2 : -Math.PI / 2);
  g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const p = g.attributes.position, a = g.attributes.uv;
  for (let i = 0; i < a.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    if (uv === 'tile') a.setXY(i, (x - X0) / TILE, -(z - Z0) / TILE);
    else if (uv === 'room') a.setXY(i, (x - X0) / W, 1 - (z - Z0) / D);
    else a.setXY(i, x / uv, z / uv);
  }
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  return m;
}

// ───────────────────────── device models (drawn ×2 / ×3 real size so they read at room scale)
const DET_SCALE = 2.2, SPK_SCALE = 3.2;
function detectorModel(ledMat) {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f1, roughness: 0.45 });
  g.add(cyl(0.062, 0.012, white, 0, -0.012, 0, 32));                                         // mounting base
  const head = cyl(0.05, 0.034, white, 0, -0.046, 0, 32, 0.056); g.add(head);                 // optical chamber housing
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.add(box(0.006, 0.014, 0.004, MAT.dark, Math.cos(a) * 0.052, -0.036, Math.sin(a) * 0.052, { cast: false })); }
  g.add(cyl(0.04, 0.006, white, 0, -0.052, 0, 28));
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 8, 6), ledMat); led.position.set(0.03, -0.05, 0.03); g.add(led);
  g.scale.setScalar(DET_SCALE);
  return g;
}
function sprinklerModel() {
  const g = new THREE.Group();
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe9ecef, metalness: 0.9, roughness: 0.18 });
  const brass = MAT.brass;
  g.add(cyl(0.036, 0.004, chrome, 0, -0.004, 0, 28));                     // escutcheon plate
  g.add(cyl(0.012, 0.018, brass, 0, -0.022, 0, 12));                       // body / threads
  g.add(cyl(0.014, 0.007, brass, 0, -0.03, 0, 6));                         // hex
  for (const x of [-0.011, 0.011]) g.add(box(0.004, 0.034, 0.006, brass, x, -0.066, 0, { cast: false }));
  const defl = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.002, 20), brass); defl.position.y = -0.068; g.add(defl);
  const bulb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0034, 0.018, 4, 10), new THREE.MeshStandardMaterial({ color: 0xe11d1d, emissive: 0xe11d1d, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 }));
  bulb.position.y = -0.05; g.add(bulb);
  g.scale.setScalar(SPK_SCALE);
  return g;
}

// ───────────────────────── orbit helper: allow looking up from below while this scene is shown
let activeRoot = null;
function attached(o) { while (o?.parent) o = o.parent; return !!o?.isScene; }
function relaxOrbit(on) {
  const w = window.__ftw?.world;
  if (!w?.controls) return;
  w.controls.maxPolarAngle = on ? Math.PI * 0.8 : Math.PI * 0.495;
  if (!w.__installHook) {
    w.__installHook = true;
    w.frameHooks.push(() => { if (w.controls.maxPolarAngle > Math.PI * 0.5 && !(activeRoot && attached(activeRoot))) w.controls.maxPolarAngle = Math.PI * 0.495; });
  }
}

// ───────────────────────── the scene
export const installScene = {
  id: 'install', icon: '🔧', site: 'office',
  title: T('Installation mode: detectors & sprinklers', 'وضع التركيب: الكواشف والرشاشات'),
  summary: T('Lay out smoke detectors (0.7 × S rule) and light-hazard pendent sprinklers on a real office ceiling with a deep beam, supply diffusers, an exposed duct and a column — live coverage, NFPA 72 / NFPA 13 obstruction rules, and an installer\'s layout to correct.',
    'وزّع كواشف الدخان (قاعدة 0.7 × S) ورشاشات متدلية لخطورة خفيفة على سقف مكتب حقيقي به عارضة عميقة وناشرات هواء ومجرى مكشوف وعمود — تغطية حية وقواعد العوائق وفق NFPA 72 وNFPA 13، ومخطط مقاول يحتاج إلى تصحيح.'),
  build() {
    const root = new THREE.Group();
    activeRoot = root;
    const parts = {};
    const P = (id, obj, name, info) => { tag(obj, id); parts[id] = { obj, name, info, free: true }; root.add(obj); return obj; };
    const std = (color, rough = 0.7, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

    // ── floor slab, carpet, walls
    const slab = pbr('Concrete034', 1, { color: 0xbdb9b1 });
    root.add(box(W + 0.6, 0.3, D + 0.6, slab, 0, -0.3, 0));
    const ct = carpetTexture(); ct.repeat.set(1, 1);
    const carpet = flatPlane(X0, Z0, X1, Z1, 0.004, std(0xffffff, 0.96, 0, { map: ct }), { uv: 2.0 });
    root.add(carpet);
    const wallM = std(0xeeebe4, 0.85), skirt = std(0x3b3f44, 0.6);
    // west wall (full height, exit door) and north façade (curtain wall)
    root.add(box(0.2, H + 0.25, D + 0.2, wallM, X0 - 0.1, 0, 0));
    root.add(box(0.02, 0.1, D, skirt, X0 + 0.01, 0, 0, { cast: false }));
    const mull = std(0x2d3238, 0.4, 0.7), glass = std(0x9fc3d6, 0.05, 0.9, { transparent: true, opacity: 0.28, envMapIntensity: 1.6, depthWrite: false });
    root.add(box(W + 0.2, 0.75, 0.25, pbr('Concrete034', 1, { color: 0xd9d5cc }), 0, 0, Z0 - 0.125));
    root.add(box(W + 0.2, 0.25, 0.25, pbr('Concrete034', 1, { color: 0xd9d5cc }), 0, H, Z0 - 0.125));
    root.add(box(W, H - 0.75, 0.02, glass, 0, 0.75, Z0 - 0.12, { cast: false }));
    for (let x = X0; x <= X1 + 0.01; x += 2.5) root.add(box(0.07, H - 0.75, 0.14, mull, x, 0.75, Z0 - 0.12));
    root.add(box(W, 0.06, 0.16, mull, 0, 0.75, Z0 - 0.12)); root.add(box(W, 0.05, 0.14, mull, 0, 2.2, Z0 - 0.12));
    root.add(box(W, 0.02, 0.26, std(0xd6d3cc, 0.5), 0, 0.73, Z0 + 0.02));             // window sill
    // cut-away slab edges on the south and east (so you can see in and look up)
    root.add(box(W + 0.6, 0.06, 0.12, std(0xb0aca4, 0.8), 0, 0, Z1 + 0.24));
    // exit door + sign + call point + extinguisher on the west wall
    const door = new THREE.Group(); door.position.set(X0 + 0.02, 0, 5.2); door.rotation.y = Math.PI / 2;
    door.add(box(1.1, 2.2, 0.06, std(0x6b4a2f, 0.55), 0, 0, 0.02));
    door.add(box(1.22, 0.06, 0.08, std(0x9aa0a6, 0.4, 0.7), 0, 2.2, 0.02));
    door.add(box(0.6, 0.04, 0.06, MAT.steel, 0.1, 1.0, 0.08));
    door.add(box(0.28, 0.28, 0.01, std(0xbfe3f5, 0.1, 0.2), -0.25, 1.5, 0.06, { cast: false }));
    const exitM = new THREE.MeshBasicMaterial({ map: exitTexture() });
    const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.22), exitM); exitSign.position.set(0, 2.5, 0.06); door.add(exitSign);
    P('exit', door, T('Exit door & illuminated EXIT sign', 'باب الخروج ولافتة EXIT المضيئة'),
      T('Final exit from the open-plan floor. Keep sprinklers and detectors away from the door head so they do not obstruct the exit sign, and remember the manual call point beside the exit (NFPA 72 §17.15.9: ≤ 1.5 m from each exit door).',
        'المخرج النهائي من الطابق المفتوح. أبقِ الرشاشات والكواشف بعيداً عن أعلى الباب كي لا تحجب لافتة المخرج، وتذكر نقطة الإنذار اليدوية بجانب المخرج (NFPA 72 §17.15.9: ≤ 1.5 م من كل باب خروج).'));
    root.add(box(0.03, 0.12, 0.12, MAT.red, X0 + 0.015, 1.25, 4.1, { cast: false }));
    root.add(box(0.035, 0.07, 0.07, MAT.white, X0 + 0.02, 1.275, 4.1, { cast: false }));
    const ext = cyl(0.085, 0.5, MAT.red, X0 + 0.14, 0.12, 3.5, 16); root.add(ext);

    // ── suspended ceiling: opaque tiles seen from below, translucent "cut-away" skin seen from above
    const tt = tileTexture();
    const ceilDown = flatPlane(X0, Z0, X1, Z1, H, std(0xffffff, 0.92, 0, { map: tt, emissive: 0xffffff, emissiveMap: tt, emissiveIntensity: 0.42 }), { down: true });
    const ceilUpMat = std(0xffffff, 0.9, 0, { map: tt, transparent: true, opacity: 0.32, depthWrite: false });
    const ceilUp = flatPlane(X0, Z0, X1, Z1, H + 0.002, ceilUpMat);
    ceilDown.userData.ground = true; ceilUp.userData.ground = true;
    ceilUp.renderOrder = 2;
    root.add(ceilDown, ceilUp);
    // perimeter angle trim
    const trim = std(0xf7f7f5, 0.4);
    root.add(box(W, 0.025, 0.03, trim, 0, H - 0.025, Z0 + 0.015, { cast: false }));
    root.add(box(0.03, 0.025, D, trim, X0 + 0.015, H - 0.025, 0, { cast: false }));

    // ── downstand beam + column
    const plaster = std(0xf3f1ec, 0.8);
    const beam = new THREE.Group();
    beam.add(box(BEAM.x1 - BEAM.x0, H - BEAM.bottom - 0.01, D, plaster, (BEAM.x0 + BEAM.x1) / 2, BEAM.bottom, 0));
    beam.add(box(0.012, 0.012, D, trim, BEAM.x0 - 0.006, H - 0.012, 0, { cast: false })); beam.add(box(0.012, 0.012, D, trim, BEAM.x1 + 0.006, H - 0.012, 0, { cast: false }));
    P('beam', beam, T('Downstand beam 350 × 500 mm', 'عارضة ساقطة 350 × 500 مم'),
      T('The beam is 0.5 m deep on a 3.0 m ceiling — more than 10 % of the ceiling height, so each side is a separate beam pocket for smoke detection (NFPA 72 §17.7.3.2.4): smoke pools in the pocket and a detector on the other side will not see it. For sprinklers it is an obstruction: apply the beam rule (NFPA 13 Table 10.2.7.2.1.3).',
        'العارضة بعمق 0.5 م في سقف ارتفاعه 3.0 م — أكثر من 10% من ارتفاع السقف، لذا يُعامل كل جانب كجيب مستقل لكشف الدخان (NFPA 72 §17.7.3.2.4): يتجمع الدخان في الجيب ولن يراه كاشف في الجهة الأخرى. وهي عائق للرشاشات: طبّق قاعدة العارضة (NFPA 13 الجدول 10.2.7.2.1.3).'));
    const colM = pbr('Concrete034', 1, { color: 0xe7e3db });
    const column = box(COLUMN.x1 - COLUMN.x0, BEAM.bottom, COLUMN.z1 - COLUMN.z0, colM, 2, 0, 0);
    P('column', column, T('Structural column 500 × 500 mm', 'عمود إنشائي 500 × 500 مم'),
      T('Floor-to-beam obstruction. Pendent sprinklers must be at least 3 × the column width away, but never more than 0.6 m (24 in) is required (NFPA 13 §10.2.7.3 "three-times rule").',
        'عائق من الأرض حتى العارضة. يجب أن يبعد الرشاش المتدلي 3 أضعاف عرض العمود على الأقل، ولا يُشترط أكثر من 0.6 م (24 بوصة) (NFPA 13 §10.2.7.3 "قاعدة الأضعاف الثلاثة").'));

    // ── supply diffusers (flush) with flexible ducts above the ceiling
    const dfTex = diffuserTexture();
    const dfMat = std(0xffffff, 0.45, 0.3, { map: dfTex });
    const diffs = new THREE.Group();
    const flex = std(0xc8ccd0, 0.55, 0.6), plenum = new THREE.Group();
    for (const [x, z] of DIFFS) {
      diffs.add(box(0.6, 0.035, 0.6, dfMat, x, H - 0.035, z));
      plenum.add(box(0.4, 0.25, 0.4, MAT.galv, x, H + 0.005, z));                      // plenum box
      plenum.add(pipe([V(x, H + 0.26, z), V(x, H + 0.45, z), V(x + (x < 0 ? 1.2 : -1.0), H + 0.5, z)], 0.11, flex));
    }
    // above-ceiling services are seen through the cut-away but never intercept clicks on the tiles
    plenum.traverse((o) => { o.raycast = () => {}; });
    root.add(plenum);
    P('diffusers', diffs, T('Supply-air diffusers (4-way, 600 × 600)', 'ناشرات هواء الإمداد (رباعية الاتجاه 600 × 600)'),
      T('High-velocity supply air dilutes smoke and blows it away from a nearby detector. Smoke detectors must be ≥ 0.9 m (3 ft) from supply-air diffusers (NFPA 72 §17.7.4.3). Devices cannot be installed in the diffuser itself.',
        'هواء الإمداد عالي السرعة يخفف الدخان ويبعده عن الكاشف القريب. يجب أن تبعد كواشف الدخان ≥ 0.9 م (3 أقدام) عن ناشرات هواء الإمداد (NFPA 72 §17.7.4.3). ولا يجوز تركيب الأجهزة في الناشر نفسه.'));

    // ── exposed spiral supply duct below the ceiling
    const sp = spiralTexture(); sp.repeat.set(20, 1);
    const ductM = std(0xffffff, 0.35, 0.75, { map: sp });
    const duct = new THREE.Group();
    const dy = H - 0.05 - 0.225, dz = (DUCT.z0 + DUCT.z1) / 2, dlen = DUCT.x1 - DUCT.x0;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, dlen, 28, 1, true), ductM);
    tube.rotation.z = Math.PI / 2; tube.position.set((DUCT.x0 + DUCT.x1) / 2, dy, dz); tube.castShadow = true; duct.add(tube);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.225, 28), MAT.galv); cap.rotation.y = Math.PI / 2; cap.position.set(DUCT.x1, dy, dz); duct.add(cap);
    for (let x = DUCT.x0 + 1.2; x < DUCT.x1; x += 2.4) {
      duct.add(box(0.02, 0.05, 0.5, MAT.dark, x, H - 0.05, dz, { cast: false }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.232, 0.012, 6, 28), MAT.dark); ring.rotation.y = Math.PI / 2; ring.position.set(x, dy, dz); duct.add(ring);
    }
    for (const x of [-7.2, -2.4]) {
      const grille = box(0.34, 0.14, 0.03, std(0xdfe2e4, 0.4, 0.4), x, dy - 0.07, DUCT.z0 + 0.02); duct.add(grille);
      for (let k = 0; k < 5; k++) duct.add(box(0.32, 0.008, 0.012, MAT.dark, x, dy - 0.055 + k * 0.025, DUCT.z0 + 0.0, { cast: false }));
    }
    P('duct', duct, T('Exposed spiral supply duct Ø450', 'مجرى إمداد حلزوني مكشوف Ø450'),
      T('Hung 50 mm below the ceiling, bottom 500 mm below it. It blocks the spray of any pendent head nearby: with the deflector 100 mm below the ceiling (400 mm above the duct bottom) a head must be ≥ 1.37 m from the duct side. Wider than 1.2 m would need heads underneath (NFPA 13 §10.2.7.3.3).',
        'معلق على بُعد 50 مم تحت السقف وأسفله على بُعد 500 مم تحته. يحجب رش أي رشاش متدلٍّ قريب: مع العاكس على بُعد 100 مم تحت السقف (400 مم فوق أسفل المجرى) يجب أن يبعد الرشاش ≥ 1.37 م عن جانب المجرى. وإذا زاد العرض عن 1.2 م يلزم رشاشات أسفله (NFPA 13 §10.2.7.3.3).'));

    // ── LED troffers (600 × 1200)
    const lamp = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8ea, emissiveIntensity: 1.25, map: troferTexture(), emissiveMap: null });
    const lights = new THREE.Group();
    for (const [x, z] of LIGHTS) lights.add(box(0.6, 0.02, 1.2, lamp, x, H - 0.02, z, { cast: false, receive: false }));
    root.add(lights);

    // ── furniture: workstations, chairs, screens, meeting table, plants
    const deskM = std(0xd9cdb8, 0.55), legM = std(0x2d3136, 0.4, 0.6), screenM = std(0x7c8b99, 0.9), monM = std(0x15181b, 0.3, 0.3);
    const chairM = std(0x23272c, 0.7), fabric = std(0x3f5a78, 0.85);
    const furn = new THREE.Group();
    const desk = (x, z, rot) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot;
      g.add(box(1.6, 0.03, 0.8, deskM, 0, 0.72, 0));
      for (const sx of [-0.76, 0.76]) g.add(box(0.05, 0.72, 0.7, legM, sx, 0, 0));
      g.add(box(1.6, 0.45, 0.03, screenM, 0, 0.75, -0.41));
      g.add(box(0.55, 0.32, 0.03, monM, 0.1, 0.92, -0.25)); g.add(box(0.05, 0.18, 0.05, monM, 0.1, 0.75, -0.27));
      g.add(box(0.42, 0.015, 0.14, std(0xe6e6e6, 0.6), 0.1, 0.75, 0.05, { cast: false }));
      const ch = new THREE.Group(); ch.position.set(0.05, 0, 0.62);
      ch.add(box(0.48, 0.07, 0.46, fabric, 0, 0.45, 0)); ch.add(box(0.46, 0.55, 0.06, fabric, 0, 0.55, 0.22));
      ch.add(cyl(0.025, 0.42, chairM, 0, 0.04, 0, 8)); ch.add(box(0.55, 0.03, 0.06, chairM, 0, 0.04, 0)); ch.add(box(0.06, 0.03, 0.55, chairM, 0, 0.04, 0));
      g.add(ch);
      furn.add(g);
    };
    for (const x of [-8.2, -6.6, -4.2, -2.6]) for (const z of [-4.8, -1.4, 2.0]) { desk(x, z, 0); desk(x, z - 1.62, Math.PI); }
    for (const x of [5.2, 6.8]) for (const z of [-3.4, 3.4]) { desk(x, z, 0); desk(x, z - 1.62, Math.PI); }
    furn.add(box(3.0, 0.04, 1.2, std(0x8a6a4a, 0.45), -5.4, 0.72, 5.5));                     // meeting table
    for (const sx of [-1.3, 1.3]) furn.add(box(0.08, 0.72, 0.9, legM, -5.4 + sx, 0, 5.5));
    for (let k = 0; k < 6; k++) { const ch = box(0.48, 0.45, 0.48, fabric, -6.6 + (k % 3) * 1.2, 0, 5.5 + (k < 3 ? -0.95 : 0.95)); furn.add(ch); }
    const pot = std(0xf2f0ea, 0.6), leaf = std(0x3f7a35, 0.85);
    for (const [x, z] of [[-9.5, -6.4], [1.2, -6.4], [9.4, -6.4], [9.3, 6.3]]) {
      furn.add(cyl(0.2, 0.45, pot, x, 0, z, 16));
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), leaf); b.position.set(x, 0.95, z); b.scale.y = 1.4; b.castShadow = true; furn.add(b);
    }
    furn.add(box(1.8, 1.1, 0.45, std(0x9aa3ab, 0.5, 0.4), 8.6, 0, 1.0));                   // storage cabinets
    furn.add(box(1.8, 1.1, 0.45, std(0x9aa3ab, 0.5, 0.4), 8.6, 0, -0.9));
    root.add(furn);

    // ── coverage overlay (drawn on a canvas, shown under and above the ceiling)
    const PX = 36;
    const ovc = document.createElement('canvas'); ovc.width = W * PX; ovc.height = D * PX;
    const ovTex = new THREE.CanvasTexture(ovc); ovTex.colorSpace = THREE.SRGBColorSpace; ovTex.anisotropy = 8;
    const ovc2 = document.createElement('canvas'); ovc2.width = ovc.width; ovc2.height = ovc.height;
    const ovTex2 = new THREE.CanvasTexture(ovc2); ovTex2.colorSpace = THREE.SRGBColorSpace; ovTex2.anisotropy = 8;
    const ovMatDown = new THREE.MeshBasicMaterial({ map: ovTex2, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false });
    const ovMatUp = new THREE.MeshBasicMaterial({ map: ovTex, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
    const ovDown = flatPlane(X0, Z0, X1, Z1, H - 0.004, ovMatDown, { down: true, uv: 'room' });
    const ovUp = flatPlane(X0, Z0, X1, Z1, H + 0.006, ovMatUp, { uv: 'room' });
    ovDown.receiveShadow = ovUp.receiveShadow = false; ovUp.renderOrder = 3; ovDown.renderOrder = 3;
    root.add(ovDown, ovUp);

    const devGroup = new THREE.Group(); root.add(devGroup);
    const ledMat = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 0.2 });
    const dropM = std(0xc4161c, 0.4, 0.35), nipM = new THREE.MeshStandardMaterial({ color: 0xe9ecef, metalness: 0.9, roughness: 0.2 });

    // ── state
    const st = {};
    let seq = { d: 0, s: 0 };
    const mkId = (type) => (type === 'det' ? `SD-${String(++seq.d).padStart(2, '0')}` : `SP-${String(++seq.s).padStart(2, '0')}`);
    const addDevice = (type, x, z) => {
      const d = { id: mkId(type), type, x, z };
      (type === 'det' ? st.dets : st.spks).push(d);
      const g = new THREE.Group(); g.position.set(x, H, z);
      const m = type === 'det' ? detectorModel(ledMat) : sprinklerModel();
      if (type === 'spk') {
        g.add(cyl(0.022, 0.4, dropM, 0, 0.0, 0, 10));                                          // drop / arm-over above the tiles
        const nip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 10).translate(0, -0.5, 0), nipM);
        g.add(nip); g.userData.nip = nip;
      }
      g.add(m);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 40), ringMat);
      ring.rotation.x = Math.PI / 2; ring.position.y = -0.008; g.add(ring);
      g.userData = { ...g.userData, dev: d, ring, model: m };
      d.obj = g; devGroup.add(g);
      return d;
    };
    const clearDevices = () => { st.dets = []; st.spks = []; seq = { d: 0, s: 0 }; devGroup.clear(); };
    const load = (dl, sl) => { clearDevices(); dl.forEach(([x, z]) => addDevice('det', x, z)); sl.forEach(([x, z]) => addDevice('spk', x, z)); };

    const update = () => {
      st.ev = evaluate(st);
      for (const r of [...st.ev.dets, ...st.ev.spks]) {
        const bad = r.reasons.length > 0;
        r.d.bad = bad; r.d.reasons = r.reasons;
        r.d.obj.userData.ring.material.color.set(bad ? 0xef4444 : 0x22c55e);
      }
      // the model is drawn enlarged, so show the deflector drop as a drop nipple below the tile
      const drop = Math.max(0.001, st.defl - 0.1);
      for (const s of st.spks) { s.obj.userData.model.position.y = -drop; s.obj.userData.nip.scale.y = drop; }
      drawOverlay();
    };

    // ── overlay drawing
    const cx = (x) => (x - X0) * PX, cz = (z) => (z - Z0) * PX;
    const off = document.createElement('canvas'); off.width = ovc.width; off.height = ovc.height;
    function hatch(g, x0, z0, x1, z1, color) {
      g.save(); g.beginPath(); g.rect(cx(x0), cz(z0), (x1 - x0) * PX, (z1 - z0) * PX); g.clip();
      g.strokeStyle = color; g.lineWidth = 2;
      for (let k = -ovc.height; k < ovc.width; k += 10) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + ovc.height, ovc.height); g.stroke(); }
      g.restore();
    }
    function roundRect(g, r, m) {
      const x0 = cx(r.x0 - m), z0 = cz(r.z0 - m), w = (r.x1 - r.x0 + 2 * m) * PX, h = (r.z1 - r.z0 + 2 * m) * PX, rr = m * PX;
      g.beginPath(); g.moveTo(x0 + rr, z0); g.arcTo(x0 + w, z0, x0 + w, z0 + h, rr); g.arcTo(x0 + w, z0 + h, x0, z0 + h, rr); g.arcTo(x0, z0 + h, x0, z0, rr); g.arcTo(x0, z0, x0 + w, z0, rr); g.closePath();
    }
    // text is mirrored for the underside copy so labels read correctly when looking up from below
    const txt = (g, flip, fn, x, y) => { if (!flip) return fn(x, y); g.save(); g.translate(x, y); g.scale(1, -1); fn(0, 0); g.restore(); };
    function drawOverlay() { paint(ovc, false); paint(ovc2, true); ovTex.needsUpdate = true; ovTex2.needsUpdate = true; }
    function paint(ovc, flip) {
      const g = ovc.getContext('2d'), o = off.getContext('2d');
      g.clearRect(0, 0, ovc.width, ovc.height);
      const ev = st.ev, layer = st.layer;
      if (st.overlay) {
        // coverage: red base, opaque green coverage shapes on an off-screen layer, composited translucent
        o.clearRect(0, 0, off.width, off.height);
        o.fillStyle = '#ef4444'; o.fillRect(0, 0, off.width, off.height);
        o.fillStyle = '#22c55e';
        if (layer === 'det') {
          for (const p of [0, 1]) {
            o.save(); o.beginPath();
            if (p === 0) o.rect(0, 0, cx(BEAM.x0), off.height); else o.rect(cx(BEAM.x1), 0, off.width - cx(BEAM.x1), off.height);
            o.clip();
            for (const r of ev.dets) if (!r.reasons.length && pocketOf(r.d.x) === p) { o.beginPath(); o.arc(cx(r.d.x), cz(r.d.z), R_DET * PX, 0, 7); o.fill(); }
            o.restore();
          }
        } else {
          for (const r of ev.spks) if (!r.reasons.length) o.fillRect(cx(r.d.x - SPK_HALF), cz(r.d.z - SPK_HALF), 2 * SPK_HALF * PX, 2 * SPK_HALF * PX);
        }
        g.globalAlpha = 0.24; g.drawImage(off, 0, 0); g.globalAlpha = 1;
        // rule zones
        g.setLineDash([8, 6]); g.lineWidth = 2.5;
        if (layer === 'det') {
          g.strokeStyle = '#f59e0b';
          for (const df of DIFFS) { roundRect(g, diffRect(df), DIFF_CLEAR); g.stroke(); }
          g.setLineDash([]); g.strokeStyle = 'rgba(21,128,61,0.9)'; g.lineWidth = 2;
          for (const r of ev.dets) if (!r.reasons.length) {
            g.save(); g.beginPath();
            if (pocketOf(r.d.x) === 0) g.rect(0, 0, cx(BEAM.x0), ovc.height); else g.rect(cx(BEAM.x1), 0, ovc.width, ovc.height);
            g.clip(); g.beginPath(); g.arc(cx(r.d.x), cz(r.d.z), R_DET * PX, 0, 7); g.stroke(); g.restore();
          }
        } else {
          const B = (H - st.defl) - BEAM.bottom, need = beamRequiredA(B);
          g.fillStyle = 'rgba(245,158,11,0.18)'; g.strokeStyle = '#d97706';
          for (const ob of [BEAM, DUCT]) {
            if (!Number.isFinite(need) || need <= 0) continue;
            roundRect(g, ob, need); g.fill(); g.stroke();
          }
          roundRect(g, COLUMN, 0.6); g.fill(); g.stroke();
          g.strokeStyle = 'rgba(30,64,175,0.6)'; g.setLineDash([4, 6]); g.lineWidth = 1.5;
          g.strokeRect(cx(X0 + SPK_WALL_MAX), cz(Z0 + SPK_WALL_MAX), (W - 2 * SPK_WALL_MAX) * PX, (D - 2 * SPK_WALL_MAX) * PX);
          g.setLineDash([]); g.strokeStyle = 'rgba(21,128,61,0.85)'; g.lineWidth = 1.5;
          for (const r of ev.spks) if (!r.reasons.length) g.strokeRect(cx(r.d.x - SPK_HALF), cz(r.d.z - SPK_HALF), 2 * SPK_HALF * PX, 2 * SPK_HALF * PX);
        }
        g.setLineDash([]);
      }
      // beam footprint + label
      hatch(g, BEAM.x0, Z0, BEAM.x1, Z1, 'rgba(71,85,105,0.55)');
      g.fillStyle = 'rgba(15,23,42,0.75)'; g.font = `bold ${Math.round(PX * 0.34)}px Arial`; g.textAlign = 'center';
      g.save(); g.translate(cx(2), cz(-4.5)); g.rotate(-Math.PI / 2); if (flip) g.scale(-1, 1); g.fillText('BEAM 500 mm', 0, 5); g.restore();
      // device symbols (CAD style)
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const r of [...ev.dets, ...ev.spks]) {
        const d = r.d, bad = r.reasons.length > 0, x = cx(d.x), y = cz(d.z);
        const dim = st.layer !== d.type ? 0.55 : 1;
        g.globalAlpha = dim;
        g.fillStyle = bad ? '#dc2626' : '#16a34a'; g.strokeStyle = '#fff'; g.lineWidth = 3;
        if (d.type === 'det') {
          g.beginPath(); g.arc(x, y, PX * 0.3, 0, 7); g.fill(); g.stroke();
          g.fillStyle = '#fff'; g.font = `bold ${Math.round(PX * 0.34)}px Arial`; txt(g, flip, (a, b) => g.fillText('S', a, b + (flip ? -1 : 1)), x, y);
        } else {
          g.beginPath(); g.arc(x, y, PX * 0.2, 0, 7); g.fill(); g.stroke();
          g.strokeStyle = bad ? '#dc2626' : '#16a34a'; g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(x - PX * 0.36, y); g.lineTo(x + PX * 0.36, y); g.moveTo(x, y - PX * 0.36); g.lineTo(x, y + PX * 0.36); g.stroke();
        }
        g.font = `bold ${Math.round(PX * 0.26)}px Arial`; g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.9)';
        g.fillStyle = bad ? '#b91c1c' : '#14532d';
        txt(g, flip, (a, b) => { g.strokeText(d.id, a, b); g.fillText(d.id, a, b); }, x, y - PX * 0.52);
        g.globalAlpha = 1;
      }
    }

    // ── hover tooltip (own pointer listener; camera captured from the renderer)
    let cam = null, canvasEl = null, tipEl = null;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -H), ray = new THREE.Raycaster(), hitP = new THREE.Vector3();
    const onMove = (e) => {
      if (!attached(root)) { detachTip(); return; }
      if (!cam) return;
      const r = canvasEl.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam);
      let best = null;
      if (ray.ray.intersectPlane(plane, hitP)) {
        let bd = 0.45;
        for (const d of [...st.dets, ...st.spks]) { const dd = Math.hypot(d.x - hitP.x, d.z - hitP.z); if (dd < bd) { bd = dd; best = d; } }
      }
      if (!best) { if (tipEl) tipEl.style.display = 'none'; return; }
      if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'install-tip'; document.body.appendChild(tipEl); }
      const name = best.type === 'det' ? L('Smoke detector (photoelectric)', 'كاشف دخان (كهروضوئي)') : L('Pendent sprinkler K80, 68 °C QR', 'رشاش متدلٍّ K80، 68 °م سريع الاستجابة');
      const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
      tipEl.innerHTML = `<b>${esc(best.id)}</b> · ${esc(name)}<div class="${best.bad ? 'bad' : 'ok'}">${best.bad
        ? best.reasons.map((q) => `✗ ${esc(tr(q.t))}`).join('<br>')
        : `✓ ${best.type === 'det' ? L(`Compliant — covers a ${R_DET.toFixed(2)} m radius in its beam pocket`, `مطابق — يغطي نصف قطر ${R_DET.toFixed(2)} م داخل جيب العارضة`) : L('Compliant — protects up to 20.9 m² (4.57 × 4.57 m)', 'مطابق — يحمي حتى 20.9 م² (4.57 × 4.57 م)')}`}</div>`;
      tipEl.style.display = 'block';
      tipEl.style.left = `${Math.min(window.innerWidth - 340, e.clientX + 16)}px`; tipEl.style.top = `${e.clientY + 14}px`;
    };
    const onLeave = () => { if (tipEl) tipEl.style.display = 'none'; };
    function detachTip() { canvasEl?.removeEventListener('pointermove', onMove); canvasEl?.removeEventListener('pointerleave', onLeave); tipEl?.remove(); tipEl = null; canvasEl = null; }
    ovDown.onBeforeRender = ovUp.onBeforeRender = (renderer, scene, camera) => {
      cam = camera;
      if (!canvasEl) { canvasEl = renderer.domElement; canvasEl.addEventListener('pointermove', onMove); canvasEl.addEventListener('pointerleave', onLeave); }
    };

    // ── reset per procedure
    const reset = (x, id) => {
      Object.assign(x, { tool: id === 'spk' ? 'spk' : 'det', layer: id === 'spk' ? 'spk' : 'det', snap: x.snap ?? true, overlay: x.overlay ?? true, defl: 0.1, proc: id || null });
      if (id === 'fix') load(FIX_DET, FIX_SPK); else clearDevices();
      update();
    };
    reset(st, null);

    const placeAt = (p, x, api) => {
      if (Math.abs(p.y - H) > 0.08 || p.x < X0 || p.x > X1 || p.z < Z0 || p.z > Z1) return;
      let px = p.x, pz = p.z;
      if (x.snap) { px = X0 + TILE / 2 + Math.round((px - X0 - TILE / 2) / TILE) * TILE; pz = Z0 + TILE / 2 + Math.round((pz - Z0 - TILE / 2) / TILE) * TILE; }
      px = Math.min(X1 - 0.05, Math.max(X0 + 0.05, +px.toFixed(2))); pz = Math.min(Z1 - 0.05, Math.max(Z0 + 0.05, +pz.toFixed(2)));
      if (x.tool === 'del') {
        let best = null, bd = 0.7;
        for (const d of [...x.dets, ...x.spks]) { const dd = Math.hypot(d.x - p.x, d.z - p.z); if (dd < bd) { bd = dd; best = d; } }
        if (!best) return api.msg('Nothing to remove here', 'لا يوجد جهاز لإزالته هنا');
        x.dets = x.dets.filter((d) => d !== best); x.spks = x.spks.filter((d) => d !== best);
        devGroup.remove(best.obj); update();
        api.msg(`${best.id} removed`, `تمت إزالة ${best.id}`); api.rerender();
        return;
      }
      if (inRect(px, pz, BEAM, 0.02)) return api.msg('That is the beam soffit — mount devices on the ceiling in a beam pocket', 'هذا أسفل العارضة — ركّب الأجهزة على السقف داخل جيب العارضة', 'bad');
      if (inRect(px, pz, DUCT, 0.02)) return api.msg('The duct runs directly below this tile — a device cannot be installed here', 'المجرى يمر أسفل هذه البلاطة مباشرة — لا يمكن تركيب جهاز هنا', 'bad');
      if (DIFFS.some((d) => inRect(px, pz, diffRect(d), 0.02))) return api.msg('That tile is a supply diffuser — choose a ceiling tile', 'هذه البلاطة ناشر هواء — اختر بلاطة سقف', 'bad');
      if (LIGHTS.some((l) => inRect(px, pz, lightRect(l), 0.02))) return api.msg('That tile is a light fitting — choose a ceiling tile', 'هذه البلاطة وحدة إنارة — اختر بلاطة سقف', 'bad');
      const list = x.tool === 'det' ? x.dets : x.spks;
      if (list.some((d) => Math.hypot(d.x - px, d.z - pz) < 0.25)) return api.msg('There is already a device on this tile', 'يوجد جهاز على هذه البلاطة بالفعل');
      const d = addDevice(x.tool, px, pz);
      update();
      if (d.bad) api.msg(`${d.id}: ${d.reasons.map((q) => tr(q.t)).join(' · ')}`, `${d.id}: ${d.reasons.map((q) => tr(q.t)).join(' · ')}`, 'bad');
      else api.msg(`${d.id} placed ✓ — ${x.tool === 'det' ? `detector coverage ${x.ev.detCov.toFixed(1)} %` : `sprinkler coverage ${x.ev.spkCov.toFixed(1)} %`}`,
        `تم تركيب ${d.id} ✓ — ${x.tool === 'det' ? `تغطية الكواشف ${x.ev.detCov.toFixed(1)}%` : `تغطية الرشاشات ${x.ev.spkCov.toFixed(1)}%`}`, 'good');
    };

    const toolBtn = (id, en, ar) => ({
      type: 'button',
      get label() { const on = st.tool === id; return T(`${on ? '◉' : '○'} ${en}${on ? '  (active)' : ''}`, `${on ? '◉' : '○'} ${ar}${on ? '  (مفعّل)' : ''}`); },
      run: (x, api) => { x.tool = id; if (id !== 'del') x.layer = id; drawOverlay(); api.rerender(); },
    });
    const efficiency = (x, type) => {
      const n = type === 'det' ? x.dets.length : x.spks.length, min = type === 'det' ? MIN_DET : MIN_SPK;
      const limit = type === 'det' ? min + 1 : min + 2;
      return { n, min, limit, ok: n <= limit };
    };
    const judge = (type) => (x, api) => {
      const e = efficiency(x, type);
      x.eff = e;
      if (e.ok) api.msg(`Design compliant ✓ — efficiency bonus: ${e.n} devices vs. theoretical minimum ${e.min}`, `التصميم مطابق ✓ — مكافأة الكفاءة: ${e.n} جهاز مقابل الحد الأدنى النظري ${e.min}`, 'good');
      else api.mistake(`Over-designed: ${e.n} devices where about ${e.min} would do (≤ ${e.limit} earns the efficiency bonus)`, `تصميم مبالغ فيه: ${e.n} جهاز بينما يكفي نحو ${e.min} (≤ ${e.limit} يمنح مكافأة الكفاءة)`);
    };

    return {
      root, parts, state: st, reset,
      overview: { pos: [4, 16.5, 18.5], target: [0, 1.6, -0.5] },
      focus: {
        below: { pos: [-3.2, 0.9, 10.2], target: [-1.2, 3.05, -1.5] },
        plan: { pos: [0, 24, 0.6], target: [0, 0, 0] },
      },
      env: { biome: 'desert', sunElevation: 62, sunAzimuth: 205, radius: 40, shadowSize: 22 },
      onGround: (p, x, api) => placeAt(p, x, api),
      controls: [
        toolBtn('det', 'Smoke detector', 'كاشف دخان'),
        toolBtn('spk', 'Pendent sprinkler', 'رشاش متدلٍّ'),
        toolBtn('del', 'Remove device', 'إزالة جهاز'),
        { type: 'toggle', label: T('Snap to ceiling-tile centres', 'المحاذاة إلى مراكز بلاطات السقف'), get: (x) => x.snap, set: (x, v) => { x.snap = v; } },
        { type: 'toggle', label: T('Show coverage & rule zones', 'إظهار التغطية ومناطق القواعد'), get: (x) => x.overlay, set: (x, v) => { x.overlay = v; drawOverlay(); } },
        { type: 'slider', label: T('Sprinkler deflector below ceiling', 'بُعد عاكس الرشاش تحت السقف'), min: 0, max: 400, step: 5, get: (x) => Math.round(x.defl * 1000), set: (x, v) => { x.defl = v / 1000; update(); }, fmt: (v) => `${v} mm` },
        { type: 'button', label: T('👁 Look up from below', '👁 انظر للأعلى من الأسفل'), run: (x, api) => { relaxOrbit(true); api.focus('below'); } },
        { type: 'button', label: T('🗺 Reflected ceiling plan (top view)', '🗺 مخطط السقف المنعكس (منظر علوي)'), run: (x, api) => { api.focus('plan'); } },
        { type: 'button', label: T('🧹 Clear all devices', '🧹 إزالة جميع الأجهزة'), run: (x, api) => { clearDevices(); update(); api.msg('All devices removed', 'تمت إزالة جميع الأجهزة'); api.rerender(); } },
      ],
      tick(dt, x) {
        x.blink = ((x.blink || 0) + dt) % 5;
        ledMat.emissiveIntensity = x.blink < 0.12 ? 6 : 0.15;
      },
      readouts: (x) => {
        const ev = x.ev;
        const B = (H - x.defl) - BEAM.bottom, need = beamRequiredA(B);
        return [
          [T('Active tool', 'الأداة الحالية'), tr({ det: T('Smoke detector', 'كاشف دخان'), spk: T('Pendent sprinkler', 'رشاش متدلٍّ'), del: T('Remove', 'إزالة') }[x.tool])],
          [T('Smoke detectors (valid / placed)', 'كواشف الدخان (صالحة / مركبة)'), `${x.dets.length - ev.detViol} / ${x.dets.length} · min ≈ ${MIN_DET}`, ev.detViol ? 'alarm' : ''],
          [T('Detector coverage', 'تغطية الكواشف'), `${ev.detCov.toFixed(1)} %`, ev.detCov >= 98 ? '' : 'warn'],
          [T('  West / east beam pocket', '  جيب العارضة الغربي / الشرقي'), `${ev.pocket[0].toFixed(0)} % / ${ev.pocket[1].toFixed(0)} %`, Math.min(...ev.pocket) >= 98 ? '' : 'warn'],
          [T('Sprinklers (valid / placed)', 'الرشاشات (صالحة / مركبة)'), `${x.spks.length - ev.spkViol} / ${x.spks.length} · min ≈ ${MIN_SPK}`, ev.spkViol ? 'alarm' : ''],
          [T('Sprinkler coverage', 'تغطية الرشاشات'), `${ev.spkCov.toFixed(1)} %`, ev.spkCov >= 98 ? '' : 'warn'],
          [T('Rule violations', 'مخالفات القواعد'), String(ev.detViol + ev.spkViol), ev.detViol + ev.spkViol ? 'alarm' : ''],
          [T('Detector spacing S → radius 0.7 S', 'تباعد الكاشف S ← نصف القطر 0.7 S'), `${S_LISTED} m → ${R_DET.toFixed(2)} m`],
          [T('Beam rule: min. distance from beam/duct', 'قاعدة العارضة: أقل مسافة من العارضة/المجرى'), Number.isFinite(need) ? `${need.toFixed(2)} m (B = ${Math.round(B * 1000)} mm)` : '—', Number.isFinite(need) ? '' : 'alarm'],
        ];
      },
      chart(panel, x) {
        let box = panel.querySelector('#instViol');
        if (!box) {
          const t = panel.querySelector('#trRead'); if (!t) return;
          box = document.createElement('div'); box.id = 'instViol'; box.className = 'install-viol'; t.after(box);
        }
        const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
        const bad = [...x.ev.dets, ...x.ev.spks].filter((r) => r.reasons.length);
        const html = bad.length
          ? `<div class="hd">⚠ ${esc(L('Non-compliant devices', 'أجهزة غير مطابقة'))} (${bad.length})</div>${bad.slice(0, 8).map((r) => `<div class="it"><b>${esc(r.d.id)}</b> ${r.reasons.map((q) => esc(tr(q.t))).join('<br>')}</div>`).join('')}${bad.length > 8 ? `<div class="it">…</div>` : ''}`
          : (x.dets.length + x.spks.length ? `<div class="hd ok">✓ ${esc(L('All placed devices comply', 'جميع الأجهزة المركبة مطابقة'))}</div>` : `<div class="hd">${esc(L('Choose a tool, then click ceiling tiles to install devices. Hover a device to see why it is green or red.', 'اختر أداة ثم انقر على بلاطات السقف لتركيب الأجهزة. مرّر المؤشر فوق الجهاز لمعرفة سبب لونه الأخضر أو الأحمر.'))}</div>`);
        if (box._h !== html) { box._h = html; box.innerHTML = html; }
      },
      procedures: [
        {
          id: 'det', title: T('Design the detector layout', 'صمّم توزيع الكواشف'),
          setup: (x, api) => { api.focus('plan'); },
          steps: [
            { text: T(`Smoke-detector tool: click ceiling tiles until ≥ 98 % of the ceiling is covered (radius 0.7 × 9.1 m = ${R_DET.toFixed(2)} m, each beam pocket separately) with zero violations. Theoretical minimum ≈ ${MIN_DET}; ≤ ${MIN_DET + 1} earns the efficiency bonus.`,
              `أداة كاشف الدخان: انقر على بلاطات السقف حتى تغطي ≥ 98% من السقف (نصف القطر 0.7 × 9.1 م = ${R_DET.toFixed(2)} م، وكل جيب عارضة على حدة) دون أي مخالفة. الحد الأدنى النظري ≈ ${MIN_DET}؛ و≤ ${MIN_DET + 1} يمنح مكافأة الكفاءة.`),
              button: T('Check my layout', 'افحص تصميمي'), done: (x) => x.ev.detOk, onDo: judge('det'),
              notYet: T('Not yet: coverage below 98 % or a detector breaks a rule (red).', 'ليس بعد: التغطية أقل من 98% أو يوجد كاشف مخالف (أحمر).') },
            { text: T('The beam is 500 mm deep on a 3.0 m ceiling. Why does each side need its own detectors?', 'العارضة بعمق 500 مم في سقف ارتفاعه 3.0 م. لماذا يحتاج كل جانب إلى كواشف خاصة به؟'), button: T('', ''), choices: [
              { text: T('Beams deeper than 10 % of the ceiling height trap smoke — each pocket is treated as a separate area', 'العارضة الأعمق من 10% من ارتفاع السقف تحبس الدخان — يُعامل كل جيب كمنطقة مستقلة'), correct: true },
              { text: T('Because the beam is structural steel', 'لأن العارضة من الفولاذ الإنشائي'), correct: false },
              { text: T('It does not — the 6.4 m radius crosses the beam', 'لا يحتاج — نصف قطر 6.4 م يعبر العارضة'), correct: false }],
              explain: T('NFPA 72 §17.7.3.2.4: beam depth > 10 % of ceiling height → smoke fills the pocket first, so a detector across the beam responds late.', 'NFPA 72 §17.7.3.2.4: عمق العارضة > 10% من ارتفاع السقف ← يملأ الدخان الجيب أولاً فيتأخر الكاشف في الجهة الأخرى.') },
            { text: T('Minimum distance between a smoke detector and a supply-air diffuser?', 'أقل مسافة بين كاشف الدخان وناشر هواء الإمداد؟'), button: T('', ''), choices: [
              { text: T('0.3 m (1 ft)', '0.3 م (1 قدم)'), correct: false }, { text: T('0.9 m (3 ft)', '0.9 م (3 أقدام)'), correct: true }, { text: T('No requirement', 'لا يوجد متطلب'), correct: false }],
              explain: T('NFPA 72 §17.7.4.3: ≥ 3 ft (0.9 m) from supply-air diffusers — the jet dilutes and deflects smoke.', 'NFPA 72 §17.7.4.3: ≥ 3 أقدام (0.9 م) من ناشرات الإمداد — التيار يخفف الدخان ويحرفه.') },
          ],
          result: (x) => `${x.dets.length} detectors · coverage ${x.ev.detCov.toFixed(1)} % · ${x.eff?.ok ? 'efficiency bonus ✓' : 'no efficiency bonus'} (min ≈ ${MIN_DET})`,
        },
        {
          id: 'spk', title: T('Design the sprinkler layout (light hazard)', 'صمّم توزيع الرشاشات (خطورة خفيفة)'),
          setup: (x, api) => { api.focus('plan'); },
          steps: [
            { text: T(`Sprinkler tool: cover ≥ 98 % of the ceiling with standard-spray pendents — ≤ 20.9 m² and ≤ 4.6 m spacing per head, ≥ 1.8 m between heads, 0.1–2.3 m from walls, beam rule at the beam and the duct (orange zones). Minimum ≈ ${MIN_SPK}; ≤ ${MIN_SPK + 2} earns the efficiency bonus.`,
              `أداة الرشاش: غطِّ ≥ 98% من السقف برشاشات متدلية قياسية — ≤ 20.9 م² و≤ 4.6 م تباعد لكل رشاش، و≥ 1.8 م بين الرشاشات، و0.1–2.3 م من الجدران، وقاعدة العارضة عند العارضة والمجرى (المناطق البرتقالية). الحد الأدنى ≈ ${MIN_SPK}؛ و≤ ${MIN_SPK + 2} يمنح مكافأة الكفاءة.`),
              button: T('Check my layout', 'افحص تصميمي'), done: (x) => x.ev.spkOk, onDo: judge('spk'),
              notYet: T('Not yet: coverage below 98 % or a sprinkler breaks a rule (red).', 'ليس بعد: التغطية أقل من 98% أو يوجد رشاش مخالف (أحمر).') },
            { text: T('Deflector 100 mm below the ceiling, beam 500 mm deep. How far from the beam side must a pendent head be?', 'العاكس على بُعد 100 مم تحت السقف والعارضة بعمق 500 مم. كم يجب أن يبعد الرشاش المتدلي عن جانب العارضة؟'), button: T('', ''), choices: [
              { text: T('≥ 0.3 m', '≥ 0.3 م'), correct: false }, { text: T('≥ 1.37 m (4 ft 6 in)', '≥ 1.37 م (4 أقدام و6 بوصات)'), correct: true }, { text: T('≥ 2.3 m', '≥ 2.3 م'), correct: false }],
              explain: T('Deflector 400 mm above the beam bottom → the table allows 419 mm only from 1.37 m (4½ ft) away.', 'العاكس أعلى من أسفل العارضة بـ 400 مم ← يسمح الجدول بـ 419 مم فقط عند 1.37 م (4.5 قدم) فأكثر.') },
            { text: T('Maximum protection area per standard-spray sprinkler, light hazard?', 'أقصى مساحة حماية لكل رشاش قياسي في الخطورة الخفيفة؟'), button: T('', ''), choices: [
              { text: T('12.1 m² (130 ft²)', '12.1 م² (130 قدم²)'), correct: false }, { text: T('20.9 m² (225 ft²)', '20.9 م² (225 قدم²)'), correct: true }, { text: T('37.2 m² (400 ft²)', '37.2 م² (400 قدم²)'), correct: false }],
              explain: T('NFPA 13 Table 10.2.4.2.1(a): light hazard 225 ft² (20.9 m²), max spacing 15 ft (4.6 m).', 'NFPA 13 الجدول 10.2.4.2.1(a): الخطورة الخفيفة 225 قدم² (20.9 م²) وأقصى تباعد 15 قدماً (4.6 م).') },
          ],
          result: (x) => `${x.spks.length} sprinklers · coverage ${x.ev.spkCov.toFixed(1)} % · ${x.eff?.ok ? 'efficiency bonus ✓' : 'no efficiency bonus'} (min ≈ ${MIN_SPK})`,
        },
        {
          id: 'fix', title: T('Fix the installer\'s mistakes', 'صحّح أخطاء المقاول'),
          setup: (x, api) => { api.focus('plan'); api.msg('The installer\'s layout has 5 errors. Hover the red devices, then remove / relocate them (Remove tool + place again).', 'مخطط المقاول يحتوي على 5 أخطاء. مرّر المؤشر فوق الأجهزة الحمراء ثم أزلها أو انقلها (أداة الإزالة ثم التركيب من جديد).'); },
          steps: [
            { text: T('A smoke detector sits too close to a supply-air diffuser. Relocate it (≥ 0.9 m) and keep the west pocket covered.', 'كاشف دخان قريب جداً من ناشر هواء. انقله (≥ 0.9 م) وحافظ على تغطية الجيب الغربي.'), done: (x) => !x.ev.has(x.ev.dets, 'diff') && x.ev.pocket[0] >= 98 },
            { text: T('Two sprinklers are closer than 1.8 m — move the misplaced one back to the gap it left.', 'رشاشان متقاربان أقل من 1.8 م — أعد الرشاش الخاطئ إلى الفراغ الذي تركه.'), done: (x) => !x.ev.has(x.ev.spks, 'min') },
            { text: T('A sprinkler is more than 2.3 m from a wall — relocate it.', 'رشاش يبعد أكثر من 2.3 م عن الجدار — انقله.'), done: (x) => !x.ev.has(x.ev.spks, 'wallmax') },
            { text: T('The east beam pocket has no detector — the installer relied on a detector on the other side of the beam. Cover the east pocket.', 'جيب العارضة الشرقي بلا كاشف — اعتمد المقاول على كاشف في الجهة الأخرى من العارضة. غطِّ الجيب الشرقي.'), done: (x) => x.ev.pocket[1] >= 98 },
            { text: T('A sprinkler is obstructed by the exposed duct (beam rule) — relocate it.', 'رشاش معاق بالمجرى المكشوف (قاعدة العارضة) — انقله.'), done: (x) => !x.ev.has(x.ev.spks, 'duct') },
            { text: T('Final review: both systems ≥ 98 % coverage with zero violations.', 'المراجعة النهائية: تغطية النظامين ≥ 98% دون أي مخالفة.'), button: T('Submit corrected layout', 'سلّم المخطط المصحح'), done: (x) => x.ev.detOk && x.ev.spkOk,
              notYet: T('Some areas are still uncovered or a device is still red.', 'ما زالت هناك مناطق غير مغطاة أو جهاز أحمر.'),
              onDo: (x, api) => {
                const extra = Math.max(0, x.dets.length - REF_DET.length - 1) + Math.max(0, x.spks.length - REF_SPK.length - 2);
                if (extra > 0) api.mistake(`Corrected, but ${extra} more device(s) than needed — no efficiency bonus`, `تم التصحيح لكن بعدد ${extra} جهاز زائد عن الحاجة — لا مكافأة كفاءة`);
                else api.msg('All five errors corrected with a lean layout — efficiency bonus ✓', 'تم تصحيح الأخطاء الخمسة بمخطط اقتصادي — مكافأة الكفاءة ✓', 'good');
              } },
          ],
          result: (x) => `${x.dets.length} detectors (${x.ev.detCov.toFixed(1)} %) · ${x.spks.length} sprinklers (${x.ev.spkCov.toFixed(1)} %)`,
        },
      ],
    };
  },
};
