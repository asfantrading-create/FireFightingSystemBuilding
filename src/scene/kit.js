// Reusable procedural models & effects for the fire-protection digital twin.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ───────────── materials
const std = (color, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
export const M = {
  concrete: std(0xcfcac0, 0.9), concreteDark: std(0x9d978c, 0.95), asphalt: std(0x3b3d40, 0.95),
  fireRed: std(0xc4161c, 0.38, 0.35), darkRed: std(0x8a1014, 0.5, 0.3), white: std(0xf1f1ee, 0.5, 0.05),
  steel: std(0xb9bec4, 0.35, 0.8), darkSteel: std(0x5a6068, 0.45, 0.7), galv: std(0xa8adb2, 0.4, 0.75),
  yellow: std(0xf2b705, 0.5, 0.2), green: std(0x2f8f46, 0.6), black: std(0x1b1d20, 0.6, 0.2),
  glass: std(0x9fc3d6, 0.06, 0.9, { transparent: true, opacity: 0.35, envMapIntensity: 1.5 }),
  glassDark: std(0x3f5b6b, 0.08, 0.95, { envMapIntensity: 1.6 }),
  sand: std(0xd8c39b, 1), grass: std(0x6f8f45, 1), water: std(0x3b7ea1, 0.1, 0.5, { transparent: true, opacity: 0.85 }),
  foliage: std(0x4d7a33, 0.9), palm: std(0x5a8a36, 0.85), trunk: std(0x7a5b3c, 0.95),
  blue: std(0x2563eb, 0.5, 0.3), cream: std(0xe9e2d0, 0.8), roofGrey: std(0x8f969c, 0.5, 0.6),
  line: new THREE.MeshBasicMaterial({ color: 0xf5f5f0 }),
  lineY: new THREE.MeshBasicMaterial({ color: 0xf2c200 }),
};

export function cloneMat(m, props = {}) {
  const c = m.clone();
  for (const [k, v] of Object.entries(props)) {
    if (c[k] && c[k].isColor) c[k].set(v); else c[k] = v;
  }
  return c;
}

// ───────────── canvas textures
export function facadeTexture({ cols = 8, rows = 8, bg = '#2d3b46', win = '#87a9bf', frame = '#d9dde0', lit = 0.12, band = false } = {}) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = frame; g.fillRect(0, 0, 256, 256);
  const cw = 256 / cols, rh = 256 / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const r = Math.random();
      g.fillStyle = r < lit ? '#e9dcb4' : (r < 0.8 ? win : bg);
      const pad = band ? 1 : 2.5;
      g.fillRect(i * cw + pad, j * rh + (band ? rh * 0.18 : pad), cw - pad * 2, band ? rh * 0.64 : rh - pad * 2);
      const grd = g.createLinearGradient(0, j * rh, 0, (j + 1) * rh);
      grd.addColorStop(0, 'rgba(255,255,255,0.18)'); grd.addColorStop(1, 'rgba(0,0,0,0.12)');
      g.fillStyle = grd; g.fillRect(i * cw + pad, j * rh + pad, cw - pad * 2, rh - pad * 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export function ribbedTexture(color = '#c9ced3', rib = '#9aa2aa', n = 32) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < n; i++) { g.fillStyle = rib; g.fillRect((i * 256) / n, 0, 2.5, 64); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [o, col] of stops) grd.addColorStop(o, col);
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let _tex;
function tex() {
  if (!_tex) {
    _tex = {
      flame: radialTexture([[0, 'rgba(255,250,210,1)'], [0.25, 'rgba(255,190,60,0.95)'], [0.55, 'rgba(240,90,20,0.55)'], [1, 'rgba(120,20,0,0)']]),
      smoke: radialTexture([[0, 'rgba(70,70,72,0.85)'], [0.5, 'rgba(60,60,62,0.45)'], [1, 'rgba(50,50,52,0)']]),
      steam: radialTexture([[0, 'rgba(255,255,255,0.9)'], [0.5, 'rgba(245,247,250,0.45)'], [1, 'rgba(240,242,245,0)']]),
      drop: radialTexture([[0, 'rgba(200,230,255,1)'], [0.4, 'rgba(140,195,240,0.8)'], [1, 'rgba(120,180,230,0)']]),
    };
  }
  return _tex;
}

// ───────────── primitives
export function box(w, h, d, mat, x = 0, y = 0, z = 0, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
export function cyl(r, h, mat, x = 0, y = 0, z = 0, seg = 32, rTop = r) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/** Pipe along a polyline with elbow spheres. */
export function pipe(points, r, mat = M.fireRed) {
  const g = new THREE.Group();
  const up = V(0, 1, 0);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const len = a.distanceTo(b);
    if (len < 1e-3) continue;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
    m.castShadow = true;
    g.add(m);
    if (i > 0) { const e = new THREE.Mesh(new THREE.SphereGeometry(r * 1.15, 12, 8), mat); e.position.copy(a); g.add(e); }
  }
  return g;
}

export function label3D(text, { size = 3, color = '#ffffff', bg = 'rgba(180,20,28,0.92)' } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = 'bold 48px Segoe UI, Arial';
  const w = g.measureText(text).width + 40;
  c.width = w; c.height = 72;
  g.fillStyle = bg; g.fillRect(0, 0, w, 72);
  g.font = 'bold 48px Segoe UI, Arial'; g.fillStyle = color; g.textBaseline = 'middle';
  g.fillText(text, 20, 38);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size * w / 72, size), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
  return m;
}

// ───────────── fire-protection equipment
export function storageTank({ r = 8, h = 10, shell = M.white, band = M.fireRed, roof = 'cone', text = 'FIRE WATER' } = {}) {
  const g = new THREE.Group();
  const s = cyl(r, h, shell, 0, 0, 0, 48); g.add(s);
  const b1 = cyl(r * 1.005, h * 0.08, band, 0, h * 0.8, 0, 48); g.add(b1);
  if (roof === 'cone') { const c = new THREE.Mesh(new THREE.ConeGeometry(r * 1.02, r * 0.18, 48), shell); c.position.y = h + r * 0.09; c.castShadow = true; g.add(c); }
  if (roof === 'dome') { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 16, 0, Math.PI * 2, 0, Math.PI / 5), shell); d.position.y = h - r * Math.cos(Math.PI / 5); d.castShadow = true; g.add(d); }
  // ladder & handrail
  const lad = box(0.6, h, 0.1, M.darkSteel, r + 0.1, 0, 0); g.add(lad);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 6, 64), M.galv); rail.rotation.x = Math.PI / 2; rail.position.y = h + 1.0; g.add(rail);
  if (text) { const l = label3D(text, { size: Math.min(2.2, h * 0.14) }); l.position.set(0, h * 0.55, r + 0.05); g.add(l); }
  return g;
}

function pumpUnit(kind) {
  const g = new THREE.Group();
  const big = kind !== 'jockey';
  const L = big ? 3.4 : 1.4;
  g.add(box(L, 0.25, big ? 1.1 : 0.6, M.darkSteel, 0, 0, 0));
  // split-case / end-suction casing
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(big ? 0.55 : 0.25, big ? 0.55 : 0.25, big ? 0.7 : 0.35, 24), M.fireRed);
  casing.rotation.z = Math.PI / 2; casing.position.set(-L * 0.28, big ? 0.85 : 0.5, 0); casing.castShadow = true; g.add(casing);
  if (kind === 'diesel') {
    g.add(box(1.7, 1.1, 0.95, M.yellow, L * 0.18, 0.25, 0));
    g.add(box(0.3, 1.2, 1.0, M.darkSteel, L * 0.46, 0.25, 0));  // radiator
    g.add(cyl(0.09, 2.4, M.darkSteel, L * 0.1, 1.35, 0.3, 12));  // exhaust
  } else {
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(big ? 0.45 : 0.2, big ? 0.45 : 0.2, big ? 1.4 : 0.6, 24), big ? M.fireRed : M.blue);
    motor.rotation.z = Math.PI / 2; motor.position.set(L * 0.2, big ? 0.8 : 0.45, 0); motor.castShadow = true; g.add(motor);
  }
  return g;
}

/** Pump house with a cut-away roof showing electric, diesel & jockey pumps (NFPA 20 arrangement). */
export function pumpHouse({ w = 16, d = 10, h = 5, count = 1, withTestHeader = true } = {}) {
  const g = new THREE.Group();
  const wallT = 0.25;
  const wallMat = M.cream;
  g.add(box(w, 0.3, d, M.concreteDark, 0, 0, 0));
  g.add(box(w, h, wallT, wallMat, 0, 0, -d / 2));
  g.add(box(wallT, h, d, wallMat, -w / 2, 0, 0));
  g.add(box(wallT, h, d, wallMat, w / 2, 0, 0));
  g.add(box(w, h * 0.35, wallT, wallMat, 0, 0, d / 2));             // low front wall = cut-away
  const roof = box(w + 0.6, 0.2, d + 0.6, cloneMat(M.roofGrey, { transparent: true, opacity: 0.18 }), 0, h, 0, { cast: false });
  g.add(roof);
  g.add(label3D('FIRE PUMP ROOM', { size: 0.9 }).translateX(-w / 4).translateY(h * 0.62).translateZ(-d / 2 + 0.2));
  const pumps = {};
  const n = Math.max(1, count);
  const layout = [];
  for (let i = 0; i < n; i++) layout.push('main');
  for (let i = 0; i < n; i++) layout.push('diesel');
  layout.push('jockey');
  const pitch = (d - 2) / layout.length;
  layout.forEach((k, i) => {
    const u = pumpUnit(k);
    u.position.set(-1, 0.3, -d / 2 + 1.2 + pitch * i + pitch / 2 - 0.4);
    g.add(u);
    (pumps[k] ||= []).push(u);
    // controller cabinet
    const ctl = box(0.8, 1.9, 0.45, k === 'diesel' ? M.fireRed : M.fireRed, w / 2 - 0.8, 0.3, u.position.z);
    g.add(ctl);
  });
  // suction & discharge headers
  g.add(pipe([V(-w / 2 + 0.4, 1.1, -d / 2 + 0.8), V(-w / 2 + 0.4, 1.1, d / 2 - 0.8)], 0.22));
  g.add(pipe([V(2.8, 2.4, -d / 2 + 0.8), V(2.8, 2.4, d / 2 - 0.8), V(2.8, 2.4, d / 2 + 1.2)], 0.2));
  if (withTestHeader) {
    const th = new THREE.Group();
    th.add(pipe([V(0, 0, 0), V(0, 1.1, 0)], 0.12));
    for (let i = 0; i < 4; i++) th.add(cyl(0.07, 0.35, M.yellow, -0.6 + i * 0.4, 1.0, 0.15, 10).rotateX(Math.PI / 2));
    th.add(box(1.8, 0.25, 0.3, M.fireRed, 0, 0.9, 0));
    th.position.set(w / 2 + 1.2, 0, d / 4);
    g.add(th);
  }
  g.userData.pumps = pumps;
  return g;
}

export function hydrant() {
  const g = new THREE.Group();
  g.add(cyl(0.16, 0.9, M.fireRed, 0, 0, 0, 16));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.fireRed); cap.position.y = 0.9; g.add(cap);
  const o1 = cyl(0.07, 0.35, M.galv, 0, 0.55, 0, 12); o1.rotation.z = Math.PI / 2; o1.position.set(0, 0.6, 0); g.add(o1);
  g.scale.setScalar(1.6);
  return g;
}

export function fdc() {
  const g = new THREE.Group();
  g.add(box(1.2, 0.8, 0.25, M.fireRed, 0, 0.6, 0));
  for (const x of [-0.3, 0.3]) { const c = cyl(0.09, 0.35, M.galv, x, 0, 0, 12); c.rotation.x = Math.PI / 2; c.position.set(x, 1.0, 0.3); g.add(c); }
  g.add(label3D('FDC', { size: 0.3 }).translateY(1.5).translateZ(0.14));
  g.scale.setScalar(1.8);
  return g;
}

export function valveStation(n = 2) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const x = i * 1.4;
    g.add(pipe([V(x, 0, 0), V(x, 2.2, 0)], 0.14));
    g.add(cyl(0.28, 0.6, M.fireRed, x, 0.7, 0, 20));
    g.add(box(0.35, 0.35, 0.35, M.yellow, x + 0.3, 1.1, 0));
    g.add(cyl(0.16, 0.05, M.galv, x, 1.6, 0.25, 16).rotateX(Math.PI / 2));
  }
  return g;
}

// ───────────── landscape & props
export function palm(h = 8) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, h, 8), M.trunk);
  trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 4), M.palm);
    leaf.position.set(0, h, 0);
    leaf.rotation.set(Math.PI / 2.6, (i / 8) * Math.PI * 2, 0, 'YXZ');
    leaf.translateY(1.8);
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}
export function tree(h = 6, mat = M.foliage) {
  const g = new THREE.Group();
  g.add(cyl(0.2, h * 0.45, M.trunk, 0, 0, 0, 6));
  const c = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.33, 1), mat);
  c.position.y = h * 0.62; c.castShadow = true; g.add(c);
  return g;
}

const CAR_COLORS = [0xf2f2f2, 0x222428, 0xb0b5ba, 0x7d1d1d, 0x1f3f73, 0xd9d4c7, 0x4a4f55];
export function car(color) {
  const g = new THREE.Group();
  const mat = std(color ?? CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)], 0.3, 0.6);
  g.add(box(4.4, 0.8, 1.8, mat, 0, 0.3, 0));
  g.add(box(2.3, 0.6, 1.6, M.glassDark, -0.2, 1.1, 0));
  for (const [x, z] of [[1.4, 0.85], [-1.4, 0.85], [1.4, -0.85], [-1.4, -0.85]]) {
    const w = cyl(0.33, 0.25, M.black, x, 0, z, 12); w.rotation.x = Math.PI / 2; w.position.set(x, 0.33, z); g.add(w);
  }
  return g;
}
export function truck(color = 0xf0f0f0, trailer = true) {
  const g = new THREE.Group();
  g.add(box(2.6, 2.8, 2.5, std(color, 0.4, 0.4), 0, 0.5, 0));
  if (trailer) g.add(box(13, 3.2, 2.5, std(0xe7e9ea, 0.6, 0.2), -8, 0.9, 0));
  return g;
}
export function fireTruck() {
  const g = new THREE.Group();
  g.add(box(9, 2.6, 2.5, M.fireRed, 0, 0.6, 0));
  g.add(box(2.2, 1.2, 2.4, M.glassDark, 3.6, 2.0, 0));
  g.add(box(8, 0.2, 0.9, M.steel, -0.4, 3.3, 0));
  g.add(box(0.4, 0.2, 2.5, std(0x2563eb, 0.2, 0, { emissive: 0x2563eb, emissiveIntensity: 2 }), 3.4, 3.2, 0));
  return g;
}

export function road(len, w, x, z, rotY = 0, dashed = true) {
  const g = new THREE.Group();
  const r = new THREE.Mesh(new THREE.PlaneGeometry(len, w), M.asphalt);
  r.rotation.x = -Math.PI / 2; r.position.y = 0.05; r.receiveShadow = true; g.add(r);
  if (dashed) {
    const n = Math.floor(len / 8);
    const geos = [];
    for (let i = 0; i < n; i++) { const p = new THREE.PlaneGeometry(3, 0.18); p.rotateX(-Math.PI / 2); p.translate(-len / 2 + i * 8 + 2, 0.08, 0); geos.push(p); }
    if (geos.length) g.add(new THREE.Mesh(mergeGeometries(geos), M.line));
  }
  g.position.set(x, 0, z); g.rotation.y = rotY;
  return g;
}

export function parking(cols, rows, x, z, rotY = 0, fill = 0.7) {
  const g = new THREE.Group();
  const w = cols * 2.7, d = rows * 11;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w + 4, d + 2), M.asphalt);
  p.rotation.x = -Math.PI / 2; p.position.y = 0.04; p.receiveShadow = true; g.add(p);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > fill) continue;
      const cr = car(); cr.rotation.y = Math.PI / 2; cr.position.set(-w / 2 + c * 2.7 + 1.35, 0, -d / 2 + r * 11 + (r % 2 ? 2.8 : 8.2) - 2.7);
      g.add(cr);
    }
  }
  g.position.set(x, 0, z); g.rotation.y = rotY;
  return g;
}

// ───────────── sprinklers
export function sprinklerArray(positions, { scale = 3, bulb = 0xd22 } = {}) {
  // pendent sprinkler: frame + deflector + coloured glass bulb (enlarged for visibility)
  const frame = new THREE.CylinderGeometry(0.012, 0.018, 0.07, 8);
  const defl = new THREE.CylinderGeometry(0.035, 0.035, 0.004, 12); defl.translate(0, -0.05, 0);
  const geo = mergeGeometries([frame, defl]);
  geo.scale(scale, scale, scale);
  const heads = new THREE.InstancedMesh(geo, M.galv, positions.length);
  const bulbGeo = new THREE.SphereGeometry(0.009 * scale, 8, 6);
  const bulbs = new THREE.InstancedMesh(bulbGeo, new THREE.MeshStandardMaterial({ color: bulb, emissive: bulb, emissiveIntensity: 0.4 }), positions.length);
  const m4 = new THREE.Matrix4();
  positions.forEach((p, i) => {
    m4.makeTranslation(p.x, p.y, p.z); heads.setMatrixAt(i, m4);
    m4.makeTranslation(p.x, p.y - 0.03 * scale, p.z); bulbs.setMatrixAt(i, m4);
  });
  const g = new THREE.Group(); g.add(heads, bulbs);
  g.userData = { positions, bulbs, openSet: new Set() };
  g.setOpen = (idxs) => {
    const set = new Set(idxs);
    positions.forEach((p, i) => {
      const open = set.has(i);
      if (open === g.userData.openSet.has(i)) return;
      m4.makeTranslation(p.x, p.y - 0.03 * scale, p.z);
      if (open) m4.scale(V(0.001, 0.001, 0.001));
      bulbs.setMatrixAt(i, m4);
    });
    g.userData.openSet = set;
    bulbs.instanceMatrix.needsUpdate = true;
  };
  return g;
}

// ───────────── effects
export class FireFX {
  constructor(parent, { n = 70, base = V(0, 0, 0), smokeCeiling = null, openAir = false, spread = 1 } = {}) {
    this.group = new THREE.Group();
    this.group.position.copy(base);
    parent.add(this.group);
    this.base = base; this.ceiling = smokeCeiling; this.openAir = openAir; this.spread = spread;
    this.flames = []; this.smokes = [];
    const T = tex();
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.flame, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color: 0xffffff }));
      s.userData = { life: Math.random(), seed: Math.random() };
      this.group.add(s); this.flames.push(s);
    }
    for (let i = 0; i < n * 1.3; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.smoke, depthWrite: false, transparent: true, opacity: 0.5 }));
      s.userData = { life: Math.random(), seed: Math.random(), a: Math.random() * Math.PI * 2 };
      this.group.add(s); this.smokes.push(s);
    }
    this.light = new THREE.PointLight(0xff7a2a, 0, 40, 1.6);
    this.light.position.y = 1;
    this.group.add(this.light);
    this.q = 0; this.smokeAmt = 0; this.wind = V(1, 0, 0.3).normalize();
  }
  set(hrrKw, smoke = 0) { this.q = hrrKw; this.smokeAmt = smoke; }
  update(dt) {
    const Q = this.q;
    const on = Q > 2;
    // Heskestad flame height L = 0.235 Q^0.4 − 1.02 D  with D from ~500 kW/m² fuel
    const D = Math.max(0.3, Math.sqrt((4 * Q) / (Math.PI * 500)) * this.spread);
    const L = Math.max(0.2, 0.235 * Math.pow(Q, 0.4) - 1.02 * D * 0.5);
    const flameH = this.ceiling ? Math.min(L, this.ceiling) : Math.max(L, this.openAir && on ? 2.5 : 0);
    for (const s of this.flames) {
      const u = s.userData;
      u.life += dt * (1.2 + u.seed);
      if (u.life > 1) { u.life -= 1; u.a = Math.random() * Math.PI * 2; u.r = Math.sqrt(Math.random()) * D * 0.5; }
      s.visible = on;
      if (!on) continue;
      const k = u.life;
      s.position.set(Math.cos(u.a ?? 0) * (u.r ?? 0) * (1 - k * 0.6), k * flameH, Math.sin(u.a ?? 0) * (u.r ?? 0) * (1 - k * 0.6));
      const sz = Math.max(this.openAir ? 1.2 : 0.3, (D * 0.6 + flameH * 0.35)) * (1 - k * 0.7) * (0.7 + u.seed * 0.6);
      s.scale.set(sz, sz * 1.3, sz);
      s.material.opacity = Math.min(1, (1 - k) * 1.2);
      s.material.color.setHSL(0.07 - k * 0.05, 1, 0.55 + (1 - k) * 0.1);
    }
    const sAmt = Math.max(this.smokeAmt, on ? 0.3 : 0);
    for (const s of this.smokes) {
      const u = s.userData;
      u.life += dt * (this.openAir ? 0.12 : 0.18) * (0.6 + u.seed);
      if (u.life > 1) { u.life -= 1; u.a = Math.random() * Math.PI * 2; }
      const k = u.life;
      s.visible = sAmt > 0.02;
      if (!s.visible) continue;
      let x, y, z;
      if (this.ceiling) {
        const rise = Math.min(1, k * 3);
        const rad = Math.max(0, k * 3 - 1) * (4 + 10 * sAmt);
        y = rise * (this.ceiling - 0.3);
        x = Math.cos(u.a) * rad; z = Math.sin(u.a) * rad;
      } else {
        const H = (40 + Math.pow(Math.max(Q, 1), 0.4) * 3) * k;
        y = flameH * 0.7 + H;
        x = this.wind.x * H * 0.6 + Math.cos(u.a) * H * 0.15; z = this.wind.z * H * 0.6 + Math.sin(u.a) * H * 0.15;
      }
      s.position.set(x, y, z);
      const sz = (this.ceiling ? 2.5 + k * 3 : 3 + k * (10 + Math.pow(Math.max(Q, 1), 0.33))) * (0.7 + u.seed * 0.6);
      s.scale.set(sz, sz, sz);
      s.material.opacity = Math.min(0.75, sAmt) * (1 - k) * (on ? 1 : 0.6);
    }
    this.light.intensity = on ? Math.min(60, Math.pow(Q, 0.5) * 2) * (0.85 + Math.random() * 0.3) : 0;
    this.light.distance = 10 + Math.pow(Q, 0.4) * 2;
  }
}

/** Water spray cones below open sprinklers / deluge heads (one Points draw call). */
export class SprayFX {
  constructor(parent, { perHead = 60, maxHeads = 64, drop = 3.0, radius = 1.8, color = 0x9fd0ff, size = 0.12 } = {}) {
    this.max = maxHeads * perHead; this.perHead = perHead; this.drop = drop; this.radius = radius;
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.max * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.seed = new Float32Array(this.max * 3).map(() => Math.random());
    this.mat = new THREE.PointsMaterial({ map: tex().drop, color, size, transparent: true, depthWrite: false, opacity: 0.85, blending: THREE.NormalBlending });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    parent.add(this.points);
    this.heads = []; this.t = 0; this.intensity = 1;
  }
  setHeads(list, intensity = 1) { this.heads = list.slice(0, this.max / this.perHead); this.intensity = intensity; }
  update(dt) {
    this.t += dt;
    const n = this.heads.length * this.perHead;
    for (let i = 0; i < this.max; i++) {
      if (i >= n || this.intensity <= 0.01) { this.pos[i * 3 + 1] = -9999; continue; }
      const h = this.heads[Math.floor(i / this.perHead)];
      const s0 = this.seed[i * 3], s1 = this.seed[i * 3 + 1], s2 = this.seed[i * 3 + 2];
      const k = (this.t * (0.9 + s2) + s0) % 1;
      const a = s1 * Math.PI * 2;
      const r = k * this.radius * (0.4 + s2 * 0.6) * this.intensity;
      this.pos[i * 3] = h.x + Math.cos(a) * r;
      this.pos[i * 3 + 1] = h.y - k * this.drop;
      this.pos[i * 3 + 2] = h.z + Math.sin(a) * r;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}

/** Gas / foam fog filling a volume (clean-agent discharge, foam blanket steam). */
export class FogFX {
  constructor(parent, { w, h, d, center, n = 90, texName = 'steam', color = 0xffffff } = {}) {
    this.group = new THREE.Group(); this.group.position.copy(center); parent.add(this.group);
    this.sprites = [];
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex()[texName], transparent: true, depthWrite: false, opacity: 0, color }));
      s.position.set((Math.random() - 0.5) * w, Math.random() * h, (Math.random() - 0.5) * d);
      const sz = 2 + Math.random() * 3; s.scale.set(sz, sz, sz);
      s.userData = { v: V((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.4), w, h, d };
      this.group.add(s); this.sprites.push(s);
    }
    this.level = 0;
  }
  set(level) { this.level = level; }
  update(dt) {
    for (const s of this.sprites) {
      const u = s.userData;
      s.position.addScaledVector(u.v, dt);
      if (Math.abs(s.position.x) > u.w / 2) u.v.x *= -1;
      if (Math.abs(s.position.z) > u.d / 2) u.v.z *= -1;
      s.material.opacity = Math.min(0.55, this.level) * 0.8;
      s.visible = this.level > 0.01;
    }
  }
}

export function scatter(parent, count, makeFn, area, avoid) {
  for (let i = 0; i < count; i++) {
    let x, z, tries = 0;
    do { x = area.x0 + Math.random() * (area.x1 - area.x0); z = area.z0 + Math.random() * (area.z1 - area.z0); tries++; } while (avoid?.(x, z) && tries < 20);
    if (tries >= 20) continue;
    const o = makeFn(); o.position.set(x, 0, z); o.rotation.y = Math.random() * Math.PI * 2; parent.add(o);
  }
}
