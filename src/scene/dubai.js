// Burj Khalifa (Y-plan "Hymenocallis" tower, 27 spiralling setbacks, spire to 828 m)
// and the Downtown Dubai context placed from real coordinates
// (x = east, z = south, metres from the tower: x = Δlon·100 720, z = −Δlat·110 800).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { pbr } from './world.js';
import { M, V, box, cyl, palm } from './kit.js';

export const BURJ = { lat: 25.1972, lon: 55.2744 };
export const geo2xz = (lat, lon) => [(lon - BURJ.lon) * 100720, -(lat - BURJ.lat) * 110800];

function rnd(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ───────────── facade textures (1 texture repeat = 1 panel in metres, set via repeat)
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

/** Burj facade: reflective blue-silver glazing, vertical stainless fins, floor spandrels. */
function burjFacade() {
  const map = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#a9bccb'); gr.addColorStop(0.55, '#c3d2dd'); gr.addColorStop(1, '#9bb0bf');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9d1d7'; g.fillRect(0, h * 0.86, w, h * 0.14);           // spandrel
    for (const x of [0, w / 2]) {                                              // tubular fins
      const fg = g.createLinearGradient(x, 0, x + 18, 0);
      fg.addColorStop(0, '#e9eef1'); fg.addColorStop(0.5, '#fbfdff'); fg.addColorStop(1, '#a9b3ba');
      g.fillStyle = fg; g.fillRect(x, 0, 18, h);
    }
  });
  const rough = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h);                            // glass: glossy
    g.fillStyle = '#707070'; g.fillRect(0, h * 0.86, w, h * 0.14);
    g.fillStyle = '#4a4a4a'; for (const x of [0, w / 2]) g.fillRect(x, 0, 18, h);
  }, false);
  for (const t of [map, rough]) t.repeat.set(1 / 3.0, 1 / 3.9);                // 3.0 m bay × 3.9 m floor
  return new THREE.MeshStandardMaterial({ map, roughnessMap: rough, roughness: 1, metalness: 0.7, envMapIntensity: 1.6 });
}

export function curtainWall(seed, tone) {
  const r = rnd(seed);
  const tones = [['#6f8aa0', '#8fa9bd'], ['#4f6f86', '#7394ab'], ['#8a9aa8', '#aab8c3'], ['#5e8193', '#86a7b8'], ['#9aa3a8', '#bcc4c8']];
  const [a, b] = tones[tone % tones.length];
  const mullion = ['#c7ccd0', '#9aa3aa', '#d9d4c8'][Math.floor(r() * 3)];
  const band = r() < 0.5;
  const map = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, a); gr.addColorStop(1, b);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = mullion;
    g.fillRect(0, h * (band ? 0.72 : 0.9), w, h * (band ? 0.28 : 0.1));
    if (!band) g.fillRect(0, 0, 5, h);
  });
  map.repeat.set(1 / (band ? 6 : 1.8), 1 / 3.6);
  return new THREE.MeshStandardMaterial({ map, metalness: 0.55, roughness: 0.14, envMapIntensity: 1.4 });
}

export function stoneWall(seed) {
  const r = rnd(seed);
  const base = ['#e3d5bb', '#d8c7a6', '#eadfcb', '#cdb892', '#f0e8da'][Math.floor(r() * 5)];
  const map = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,55,70,0.85)';
    g.fillRect(w * 0.2, h * 0.25, w * 0.22, h * 0.45); g.fillRect(w * 0.58, h * 0.25, w * 0.22, h * 0.45);
    g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, h * 0.9, w, h * 0.1);
  });
  map.repeat.set(1 / 7, 1 / 3.5);
  return new THREE.MeshStandardMaterial({ map, roughness: 0.85 });
}

// World-space UVs for boxes so facade textures tile per metre
export function boxWorldUV(g, w, h, d) {
  const uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const u = uv.getX(i), v = uv.getY(i);
    if (ay > 0.5) uv.setXY(i, u * w, v * d);
    else if (ax > 0.5) uv.setXY(i, u * d, v * h);
    else uv.setXY(i, u * w, v * h);
  }
  return g;
}
export function tower(w, h, d, mat, x, z, rotY = 0) {
  const g = boxWorldUV(new THREE.BoxGeometry(w, h, d), w, h, d);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, h / 2, z); m.rotation.y = rotY; m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ───────────── Burj Khalifa
function yOutline(L, w) {
  // CCW outline of three wings (lengths L[k], half-width w) around the core
  const s = new THREE.Shape();
  const pts = [];
  for (let k = 0; k < 3; k++) {
    const th = (k * 2 * Math.PI) / 3;
    const d = [Math.cos(th), Math.sin(th)], n = [-Math.sin(th), Math.cos(th)];
    const inner = w / Math.tan(Math.PI / 3);
    const P = (sAlong, off) => [sAlong * d[0] + off * n[0], sAlong * d[1] + off * n[1]];
    pts.push(P(inner, -w));
    const tip = Math.max(inner + 1, L[k] - w);
    // notched step on the tip side, then a round cap
    pts.push(P(tip, -w));
    for (let a = -90; a <= 90; a += 15) {
      const r = (a * Math.PI) / 180;
      pts.push(P(tip + Math.cos(r) * w, Math.sin(r) * w));
    }
    pts.push(P(inner, w));
  }
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}

export function buildBurjKhalifa(opts = {}) {
  const g = new THREE.Group();
  const skin = burjFacade();
  const capMat = new THREE.MeshStandardMaterial({ color: 0xd4d9dd, metalness: 0.6, roughness: 0.35 });
  const tiers = 27, H0 = 21.7;
  const Lmax = 60, Lmin = 13;
  const cuts = [0, 0, 0];
  const segs = [];
  const fireY = opts.fireY;
  let y = 0;
  const addTier = (L, w, y0, h, mat = [capMat, skin]) => {
    const geo = new THREE.ExtrudeGeometry(yOutline(L, w), { depth: h, bevelEnabled: false, curveSegments: 6 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y0, 0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m); segs.push(m);
    return m;
  };
  for (let t = 0; t < tiers; t++) {
    if (t > 0) cuts[t % 3] += 1;
    const L = cuts.map((c) => Lmax - ((Lmax - Lmin) * c) / 9);
    const w = 14 - t * 0.2;
    const h = H0;
    if (fireY !== undefined && y <= fireY && y + h > fireY + 4.2) {
      if (fireY - y > 0.1) addTier(L, w, y, fireY - y);
      // fire floor: glazed band so the compartment inside is visible
      const band = addTier(L, w, fireY, 4.2, [capMat, new THREE.MeshStandardMaterial({ color: 0x9fc0d4, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false })]);
      band.castShadow = false;
      addTier(L, w, fireY + 4.2, y + h - fireY - 4.2);
    } else addTier(L, w, y, h);
    y += h;
  }
  // central core above the last wing setback, then the spire
  const top = y;
  const core1 = cyl(11, 45, skin, 0, top, 0, 24, 9.5); g.add(core1);
  const core2 = cyl(9.5, 40, skin, 0, top + 45, 0, 24, 7.5); g.add(core2);
  const spireMat = new THREE.MeshStandardMaterial({ color: 0xdfe5ea, metalness: 0.9, roughness: 0.18 });
  let sy = top + 85, r = 7.2;
  while (sy < 820) {
    const h = 14;
    g.add(cyl(r, h, spireMat, 0, sy, 0, 16, r * 0.93));
    g.add(cyl(r * 1.08, 0.8, spireMat, 0, sy + h - 0.8, 0, 16));
    sy += h; r *= 0.93;
  }
  g.add(cyl(0.4, 828 - sy + 2, spireMat, 0, sy, 0, 8, 0.12));
  // mechanical floors (dark louvre bands) every ~100 m — transfer tanks / booster pumps
  const louvre = new THREE.MeshStandardMaterial({ color: 0xaab4bc, metalness: 0.75, roughness: 0.3 });
  for (let z = 1; z <= 5; z++) {
    const yb = z * 108.5;
    const tIdx = Math.floor(yb / H0);
    const c = [0, 0, 0];
    for (let t = 1; t <= tIdx; t++) c[t % 3]++;
    const L = c.map((k) => Lmax - ((Lmax - Lmin) * k) / 9 + 0.3);
    const geo = new THREE.ExtrudeGeometry(yOutline(L, 14.3 - tIdx * 0.2), { depth: 4, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2); geo.translate(0, yb, 0);
    g.add(new THREE.Mesh(geo, louvre));
  }
  // podium & entrance canopy
  const pod = new THREE.Mesh(new THREE.CylinderGeometry(75, 78, 6, 6), pbr('Concrete034', 6, { color: 0xe6e2da }));
  pod.position.y = 3; pod.receiveShadow = true; g.add(pod);
  return { group: g, skin, capMat, top };
}

// ───────────── Downtown context
export function buildDowntown(root, world, reserved = []) {
  const R = rnd(2026);
  const avoid = [];
  const free = (x, z, r) => !avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < r + ar);
  const reserve = (x, z, r) => avoid.push([x, z, r]);
  reserve(0, 0, 130);
  for (const r of reserved) reserve(...r);

  // Burj Lake (Dubai Fountain) — shape traced from the real lake around the tower's south & east
  const lakePts = [[-330, 150], [-200, 112], [-70, 100], [50, 118], [170, 80], [300, 28], [410, 40], [455, 112], [420, 200], [310, 245], [215, 300], [130, 362], [40, 335], [-20, 262], [-120, 232], [-255, 242], [-345, 212]];
  const lake = new THREE.Shape();
  lakePts.forEach(([x, z], i) => (i ? lake.lineTo(x, -z) : lake.moveTo(x, -z)));
  const lakeGeo = new THREE.ShapeGeometry(lake, 24);
  const water = world.makeWater(null, [0, 0.45, 0], 0x2bb8c8, lakeGeo);
  root.add(water);
  // promenade edge
  const edge = new THREE.Mesh(new THREE.ShapeGeometry(lake, 24), pbr('PavingStones130', 0.05, { color: 0xe9e1d1 }));
  edge.rotation.x = -Math.PI / 2; edge.position.y = 0.12; edge.scale.set(1.04, 1.04, 1); edge.position.x = -5;
  root.add(edge);
  for (const [x, z] of lakePts) reserve(x, z, 60);
  reserve(60, 200, 170); reserve(300, 140, 150);
  // Dubai Fountain rings (as seen from above)
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x2a8f9c, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.55 });
  for (const [x, z, r] of [[95, 185, 26], [150, 175, 30], [205, 160, 24], [250, 140, 18]]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.35, 4, 48), ringMat); t.rotation.x = Math.PI / 2; t.position.set(x, 0.42, z); root.add(t);
  }
  root.add(new THREE.Mesh(new THREE.BoxGeometry(260, 0.2, 0.8), ringMat).translateX(170).translateY(0.42).translateZ(172).rotateY(0.25));

  // Burj Park lawn (west) and plaza around the tower
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(160, 48), pbr('Grass004', 30));
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(-360, 0.1, 40); lawn.scale.set(1.4, 0.8, 1); root.add(lawn); reserve(-360, 40, 170);
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(125, 64), pbr('PavingStones130', 22, { color: 0xf1ebe0 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.08; root.add(plaza);

  // The Dubai Mall (east of the lake) — long mass + rotundas facing the water
  const mallStone = new THREE.MeshStandardMaterial({ color: 0xe8dcc3, roughness: 0.7 });
  const mallRoof = new THREE.MeshStandardMaterial({ color: 0xd2d6d8, roughness: 0.45, metalness: 0.4 });
  const mall = new THREE.Group();
  mall.add(tower(360, 30, 260, stoneWall(4), 690, 10, 0.08));
  mall.add(box(360, 1, 260, mallRoof, 690, 30, 10));
  for (const [x, z, r, h] of [[520, 110, 62, 34], [610, 245, 50, 30], [470, -40, 45, 28]]) {
    mall.add(cyl(r, h, mallStone, x, 0, z, 64));
    mall.add(cyl(r * 0.96, 3, new THREE.MeshStandardMaterial({ color: 0xc8a35a, roughness: 0.5, metalness: 0.3 }), x, h - 6, z, 64));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 0.95, 48, 12, 0, Math.PI * 2, 0, Math.PI / 6), mallRoof);
    dome.position.set(x, h - r * 0.95 * Math.cos(Math.PI / 6), z); mall.add(dome);
  }
  root.add(mall); reserve(640, 60, 260);

  // Emaar towers around the Boulevard (approximate real positions/heights)
  const named = [
    // [x, z, w, d, h, tone]   Address Downtown (306 m), Address Boulevard (370 m), Address Sky View (237 m), Vida, Burj Vista…
    [470, 330, 38, 30, 306, 0], [860, -250, 40, 34, 370, 1], [760, 470, 34, 34, 237, 2], [250, -360, 30, 30, 180, 3],
    [-120, -330, 28, 40, 245, 4], [-300, -250, 26, 26, 205, 0], [120, -520, 30, 30, 230, 1], [380, -560, 26, 34, 190, 2],
    [-520, -80, 28, 28, 170, 3], [-560, 180, 26, 26, 150, 4], [940, 150, 30, 30, 260, 0], [1020, 420, 30, 30, 210, 1],
  ];
  named.forEach(([x, z, w, d, h, tone], i) => {
    const mat = curtainWall(100 + i, tone);
    const t = tower(w, h, d, mat, x, z, R() * 0.6);
    root.add(t);
    const crown = tower(w * 0.6, h * 0.06, d * 0.6, mat, x, z); crown.position.y = h + h * 0.03; root.add(crown);
    reserve(x, z, Math.max(w, d));
  });

  // Souk Al Bahar & Palace Downtown on the island (Arabian style, sand stone)
  const sand = stoneWall(9);
  for (const [x, z, w, d, h] of [[-110, 300, 90, 40, 16], [-40, 390, 70, 60, 22], [-200, 330, 60, 50, 26], [-150, 420, 50, 40, 18]]) {
    root.add(tower(w, h, d, sand, x, z, 0.2));
    for (let k = 0; k < 3; k++) root.add(box(4, 7, 4, sand, x - w / 3 + k * (w / 3), h, z));
    reserve(x, z, Math.max(w, d) * 0.7);
  }

  // Old Town & wider city: instanced low-rise blocks in cream stone and glass
  const lowGeo = boxWorldUV(new THREE.BoxGeometry(1, 1, 1), 1, 1, 1);
  const lowMats = [stoneWall(1), stoneWall(2), stoneWall(3), curtainWall(7, 2)];
  const inst = lowMats.map((m) => ({ m, list: [] }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  const coastD = 3600;
  for (let i = 0; i < 5200; i++) {
    const a = R() * Math.PI * 2, r = 280 + Math.pow(R(), 0.8) * 3200;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if ((-x - z) / Math.SQRT2 > coastD - 150) continue;
    // keep Sheikh Zayed Road & canal corridors clear
    const dSZR = Math.abs(((x + 700) + (z + 600)) / Math.SQRT2);
    if (dSZR < 45) continue;
    const w = 18 + R() * 30, d = 18 + R() * 30;
    if (!free(x, z, Math.max(w, d) * 0.7)) continue;
    const oldTown = x < 50 && z > 380 && z < 1100 && x > -900;
    const h = oldTown ? 9 + R() * 14 : (r < 1400 ? 12 + R() * R() * 60 : 7 + R() * 18);
    const k = oldTown ? Math.floor(R() * 3) : Math.floor(R() * 4);
    q.setFromAxisAngle(V(0, 1, 0), (R() - 0.5) * 0.3 + (oldTown ? 0 : Math.PI / 4));
    m4.compose(V(x, h / 2, z), q, V(w, h, d));
    inst[k].list.push(m4.clone());
    reserve(x, z, Math.max(w, d) * 0.55);
  }
  for (const { m, list } of inst) {
    const im = new THREE.InstancedMesh(lowGeo, m.clone(), list.length);
    // per-instance scale breaks world UVs → use a coarser map for the sprawl
    im.material.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
        #ifdef USE_INSTANCING
          vec3 isc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vec3 an = abs(normal);
          vec2 s2 = an.y > 0.5 ? isc.xz : (an.x > 0.5 ? isc.zy : isc.xy);
          vMapUv = ( mapTransform * vec3( uv * s2, 1 ) ).xy;
        #endif`);
    };
    list.forEach((mm, i) => im.setMatrixAt(i, mm));
    im.castShadow = true; im.receiveShadow = true;
    root.add(im);
  }

  // Sheikh Zayed Road with its tower wall (runs NE–SW ~1 km north-west of the tower)
  const szrDir = V(Math.SQRT1_2, 0, -Math.SQRT1_2);
  const szrC = V(-700, 0, -600);
  const szr = new THREE.Mesh(new THREE.PlaneGeometry(9000, 70), pbr('Asphalt026A', 1));
  szr.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 === 0 ? v * 400 : v * 3; });
  szr.rotation.x = -Math.PI / 2; szr.rotation.z = Math.PI / 4; szr.position.set(szrC.x, 0.15, szrC.z); root.add(szr);
  for (let s = -2400; s <= 2400; s += 55) {
    for (const side of [-1, 1]) {
      if (R() < 0.25) continue;
      const off = side * (75 + R() * 40);
      const p = szrC.clone().addScaledVector(szrDir, s).add(V(-szrDir.z * off, 0, szrDir.x * off));
      const h = 60 + Math.pow(R(), 1.6) * 300;
      const w = 24 + R() * 20;
      if (!free(p.x, p.z, w * 0.7)) continue;
      root.add(tower(w, h, w * (0.8 + R() * 0.5), curtainWall(Math.floor(s + side * 7) + 5000, Math.floor(R() * 5)), p.x, p.z, -Math.PI / 4));
      reserve(p.x, p.z, w * 0.7);
    }
  }
  // Business Bay towers (north-east)
  for (let i = 0; i < 60; i++) {
    const x = 350 + R() * 1400, z = -700 - R() * 900;
    const h = 70 + Math.pow(R(), 1.4) * 260, w = 25 + R() * 18;
    if (!free(x, z, w * 0.8)) continue;
    root.add(tower(w, h, w * (0.8 + R() * 0.4), curtainWall(900 + i, i % 5), x, z, R()));
    reserve(x, z, w * 0.8);
  }
  // Dubai Water Canal / Business Bay creek (north)
  const canal = new THREE.Shape();
  const cp = [[-2600, -1500], [-800, -1320], [300, -1650], [1400, -1450], [2600, -1700]];
  cp.forEach(([x, z], i) => (i ? canal.lineTo(x, -z - 0) : canal.moveTo(x, -z)));
  [...cp].reverse().forEach(([x, z]) => canal.lineTo(x, -(z - 90)));
  root.add(world.makeWater(null, [0, 0.3, 0], 0x1d6f86, new THREE.ShapeGeometry(canal)));
  // Persian Gulf on the north-west horizon
  const sea = world.makeWater([30000, 9000], [0, -0.4, 0], 0x14607a);
  sea.rotation.z = Math.PI / 4;
  sea.position.set(-(coastD + 4500) / Math.SQRT2, -0.4, -(coastD + 4500) / Math.SQRT2);
  root.add(sea);

  // Boulevard loop, palms
  const blvd = new THREE.Mesh(new THREE.RingGeometry(660, 690, 128), pbr('Asphalt026A', 1));
  blvd.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * 40; });
  blvd.rotation.x = -Math.PI / 2; blvd.scale.set(1, 0.8, 1); blvd.position.set(150, 0.14, 60); root.add(blvd);
  for (let a = 0; a < Math.PI * 2; a += 0.045) {
    const x = 150 + Math.cos(a) * 700, z = 60 + Math.sin(a) * 700 * 0.8;
    if (free(x, z, 3)) { const p = palm(9 + R() * 3); p.position.set(x, 0, z); root.add(p); }
  }
  for (let i = 0; i < 90; i++) {
    const a = R() * Math.PI * 2, r = 100 + R() * 40;
    const p = palm(8 + R() * 3); p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); root.add(p);
  }
  return { coastD };
}
