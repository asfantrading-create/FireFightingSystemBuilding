// Surroundings for the training scenes: the equipment room sits inside a realistic industrial
// compound (paved yard, plant buildings, water tanks, perimeter fence, road, parking, trees and
// distant sheds) instead of floating on an empty plane. Built around the scene's bounding box.
import * as THREE from 'three';
import { M, box, cyl, scaleUV, ribbedTexture, facadeTexture, storageTank, palm, tree, car, fireTruck, road, parking, label3D } from '../scene/kit.js';
import { curtainWall, stoneWall, tower } from '../scene/dubai.js';
import { instancedBlocks, cityMats } from '../scene/context.js';
import { pbr } from '../scene/world.js';

const std = (color, rough = 0.7, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

// deterministic pseudo-random so every visit looks the same
function rng(seed = 7) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function plane(w, d, mat, x, y, z, tile = 8) {
  const m = new THREE.Mesh(scaleUV(new THREE.PlaneGeometry(w, d), w / tile, d / tile), mat);
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true;
  return m;
}

/** Industrial shed with ribbed metal cladding, roof, roller doors and a high window band. */
function shed(w, h, d, { color = '#d5d9dc', rib = '#a9b0b6', doors = 2, name = '', flat = false } = {}) {
  const g = new THREE.Group();
  const t = ribbedTexture(color, rib, 48); t.repeat.set(w / 6, 1);
  const td = t.clone(); td.repeat.set(d / 6, 1); td.needsUpdate = true;
  const clad = std(0xffffff, 0.55, 0.35, { map: t });
  const cladS = std(0xffffff, 0.55, 0.35, { map: td });
  const mats = [cladS, cladS, M.roofGrey, M.roofGrey, clad, clad];
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  // low pitched roof (triangular prism along x)
  const tri = new THREE.Shape([new THREE.Vector2(-d / 2 - 0.3, 0), new THREE.Vector2(d / 2 + 0.3, 0), new THREE.Vector2(0, d * 0.12)]);
  const rg = new THREE.ExtrudeGeometry(tri, { depth: w + 0.6, bevelEnabled: false });
  const roof = new THREE.Mesh(rg, M.roofGrey);
  roof.rotation.y = Math.PI / 2; roof.position.set(-w / 2 - 0.3, h, 0); roof.castShadow = true;
  if (flat) g.add(box(w + 0.3, 0.8, d + 0.3, M.white, 0, h - 0.4, 0)); else g.add(roof);
  const doorM = std(0xb7bec4, 0.5, 0.5, { map: ribbedTexture('#b9c0c6', '#8d959c', 20) });
  for (let i = 0; i < doors; i++) {
    const x = -w / 2 + (w / (doors + 1)) * (i + 1);
    g.add(box(4.2, 4.6, 0.12, doorM, x, 0, d / 2 + 0.05));
    g.add(box(4.6, 0.3, 0.5, M.darkSteel, x, 4.6, d / 2 + 0.2));
    g.add(box(4.2, 0.02, 0.12, M.lineY, x, 0.01, d / 2 + 1.2));
  }
  // window band
  g.add(box(w * 0.8, 0.9, 0.06, M.glassDark, 0, h - 1.8, d / 2 + 0.03, { cast: false }));
  if (name) { const l = label3D(name, { size: 0.9, bg: 'rgba(30,41,59,0.92)' }); l.position.set(w / 2 - 4, h - 0.7, d / 2 + 0.08); g.add(l); }
  return g;
}

/** Two-to-four storey office / admin block with a curtain-wall façade. */
function office(w, h, d) {
  const g = new THREE.Group();
  const f = facadeTexture({ cols: Math.round(w / 3), rows: Math.round(h / 3.5), bg: '#3a4852', win: '#7d9db3', frame: '#e3e1db', lit: 0.1, band: true });
  const fs = facadeTexture({ cols: Math.round(d / 3), rows: Math.round(h / 3.5), bg: '#3a4852', win: '#7d9db3', frame: '#e3e1db', lit: 0.1, band: true });
  const a = std(0xffffff, 0.35, 0.2, { map: f }), s = std(0xffffff, 0.35, 0.2, { map: fs });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [s, s, std(0x9aa0a6, 0.8), M.concreteDark, a, a]);
  body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  g.add(box(w + 0.4, 0.5, d + 0.4, M.white, 0, h, 0));                 // parapet
  g.add(box(3, 1.2, 2, M.galv, w / 4, h + 0.5, 0));                    // roof AHU
  g.add(box(4, 0.25, 3, M.white, 0, 3, d / 2 + 1.5));                  // entrance canopy
  return g;
}

function lightPole(h = 9) {
  const g = new THREE.Group();
  g.add(cyl(0.09, h, M.galv, 0, 0, 0, 10, 0.06));
  g.add(box(1.4, 0.08, 0.08, M.galv, 0.6, h - 0.1, 0));
  g.add(box(0.6, 0.12, 0.3, std(0xfff6dd, 0.3, 0, { emissive: 0xfff2c8, emissiveIntensity: 0.6 }), 1.2, h - 0.25, 0));
  return g;
}

/** Chain-link perimeter fence around a rectangle (instanced posts + see-through mesh). */
function fence(x0, z0, x1, z1, y, gateSide = 'front') {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const cx = c.getContext('2d');
  cx.strokeStyle = 'rgba(150,158,165,0.95)'; cx.lineWidth = 3;
  cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(64, 64); cx.moveTo(64, 0); cx.lineTo(0, 64); cx.stroke();
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const mesh = std(0xffffff, 0.6, 0.5, { map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  const H = 2.4;
  const runs = [[x0, z0, x1, z0], [x1, z0, x1, z1], [x0, z1, x0, z0]];
  // front run with a gate gap in the middle
  const mid = (x0 + x1) / 2;
  runs.push([x0, z1, mid - 6, z1], [mid + 6, z1, x1, z1]);
  const posts = [];
  for (const [a, b, c2, d] of runs) {
    const len = Math.hypot(c2 - a, d - b);
    const pm = t.clone(); pm.repeat.set(len / 0.25, H / 0.25); pm.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, H), mesh.clone()); m.material.map = pm;
    m.position.set((a + c2) / 2, y + H / 2, (b + d) / 2); m.rotation.y = -Math.atan2(d - b, c2 - a);
    g.add(m);
    const n = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= n; i++) posts.push([a + ((c2 - a) * i) / n, b + ((d - b) * i) / n]);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 6), M.galv);
    rail.rotation.z = Math.PI / 2; rail.rotation.y = -Math.atan2(d - b, c2 - a); rail.position.set((a + c2) / 2, y + H, (b + d) / 2); g.add(rail);
  }
  const pg = new THREE.CylinderGeometry(0.045, 0.045, H + 0.3, 8);
  const inst = new THREE.InstancedMesh(pg, M.galv, posts.length);
  const mx = new THREE.Matrix4();
  posts.forEach(([x, z], i) => { mx.makeTranslation(x, y + (H + 0.3) / 2, z); inst.setMatrixAt(i, mx); });
  inst.castShadow = true; g.add(inst);
  // sliding gate + guard booth
  g.add(box(12, 0.12, 0.08, M.yellow, mid, y + 1.1, z1 + 0.6));
  g.add(box(2.4, 2.6, 2.4, M.white, mid + 8, y, z1 + 1.6));
  g.add(box(2.8, 0.2, 2.8, M.darkSteel, mid + 8, y + 2.6, z1 + 1.6));
  g.add(box(2.42, 1, 1.6, M.glassDark, mid + 8, y + 1.2, z1 + 1.6, { cast: false }));
  return g;
}

/** Distant plant / warehouse silhouettes on the horizon (two instanced sets). */
function horizon(R, y, rand) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const sets = [std(0xd8d6cf, 0.85), std(0xb9bdc1, 0.7, 0.3)];
  const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (const mat of sets) {
    const n = 40;
    const inst = new THREE.InstancedMesh(geo, mat, n);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2, r = R + 60 + rand() * 520;
      p.set(Math.cos(a) * r, y, Math.sin(a) * r);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * Math.PI);
      s.set(20 + rand() * 60, 6 + rand() * 14, 15 + rand() * 40);
      inst.setMatrixAt(i, mx.compose(p, q, s));
    }
    inst.receiveShadow = true;
    g.add(inst);
  }
  // a couple of chimneys / tanks to break the skyline
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2, r = R + 150 + rand() * 350;
    const tk = i % 2 ? cyl(1.4, 30 + rand() * 20, std(0xd0d0cc, 0.6), 0, 0, 0, 12) : cyl(10, 12, M.white, 0, 0, 0, 32);
    tk.position.set(Math.cos(a) * r, y + tk.position.y, Math.sin(a) * r); g.add(tk);
  }
  return g;
}

/** Which kind of surroundings each training scene sits in. */
export const SCENE_SITE = {
  pumproom: 'industrial', flowtest: 'industrial', drypipe: 'industrial',
  floorvalve: 'tower', hosedrill: 'tower', stairpress: 'tower',
  extinguishers: 'office', sprinklertypes: 'office',
  fm200room: 'datacenter',
};

/**
 * Build the surroundings around a scene whose bounding box is `bb`.
 * kind: 'industrial' | 'tower' | 'office' | 'datacenter'.
 * Returns a Group that is added next to (not inside) the pickable scene root.
 */
export function surroundings(bb, kind = 'industrial') {
  const g = new THREE.Group();
  const c = {
    bb, g, rand: rng(11),
    y: Math.min(bb.min.y, 0) - 0.03,
    cx: (bb.min.x + bb.max.x) / 2, cz: (bb.min.z + bb.max.z) / 2,
    hw: (bb.max.x - bb.min.x) / 2, hd: (bb.max.z - bb.min.z) / 2,
  };
  c.R = Math.max(c.hw, c.hd);
  ({ tower: towerSite, office: officeSite, datacenter: dataCenterSite }[kind] ?? industrialSite)(c);
  return g;
}

/** Oil / process plant: yard, process hall, admin block, store, fire-water tanks, fence. */
function industrialSite({ bb, g, rand, y, cx, cz, hw, R }) {
  // ground: natural soil far away, paved yard around the building
  const soil = pbr('Ground054', 1, { color: 0xd9c7a4 });
  g.add(plane(2600, 2600, soil, cx, y - 0.02, cz, 10));
  const m = 16;
  const yard = pbr('Concrete034', 1, { color: 0xc4c0b8 });
  const yx0 = bb.min.x - m, yx1 = bb.max.x + m + 22, yz0 = bb.min.z - m - 20, yz1 = bb.max.z + m;
  g.add(plane(yx1 - yx0, yz1 - yz0, yard, (yx0 + yx1) / 2, y, (yz0 + yz1) / 2, 6));
  // yard markings: walkway & fire lane
  const lane = new THREE.MeshBasicMaterial({ color: 0xd8b21a });
  for (const [w, d, x, z] of [[yx1 - yx0 - 4, 0.15, (yx0 + yx1) / 2, bb.max.z + 3], [yx1 - yx0 - 4, 0.15, (yx0 + yx1) / 2, bb.max.z + 9], [0.15, yz1 - yz0 - 4, bb.max.x + 4, (yz0 + yz1) / 2]]) {
    g.add(plane(w, d, lane, x, y + 0.012, z));
  }
  const red = new THREE.MeshBasicMaterial({ color: 0xb4161c });
  g.add(plane(18, 0.2, red, cx, y + 0.013, bb.max.z + 6));
  const flTxt = label3D('FIRE LANE – NO PARKING', { size: 0.7, color: '#ffffff', bg: 'rgba(180,20,28,0.95)' });
  flTxt.rotation.x = -Math.PI / 2; flTxt.position.set(cx, y + 0.015, bb.max.z + 7.2); g.add(flTxt);

  // main plant building behind the room and admin block on the left
  const plant = shed(Math.max(40, hw * 2 + 30), 11, 22, { doors: 3, name: 'PROCESS HALL' });
  plant.position.set(cx + 6, y, bb.min.z - 8 - 11); g.add(plant);
  const adm = office(26, 11, 14); adm.rotation.y = Math.PI / 2; adm.position.set(bb.min.x - 14, y, cz - 2); g.add(adm);
  const store = shed(22, 8, 16, { color: '#e3dccd', rib: '#bdb29c', doors: 2, name: 'STORE' });
  store.rotation.y = -Math.PI / 2; store.position.set(bb.max.x + 38, y, cz - 8); g.add(store);

  // fire water tanks & pump house connection (NFPA 22)
  for (const [i, dx] of [[0, 0], [1, 18]]) {
    const t = storageTank({ r: 7, h: 11, text: i ? '' : 'FIRE WATER' });
    t.position.set(bb.max.x + 16 + dx, y, bb.min.z - 40); g.add(t);
  }
  g.add(cyl(0.35, 1.1, M.fireRed, bb.max.x + 20, y, bb.max.z + 12, 16));   // hydrant
  g.add(cyl(0.22, 0.25, M.fireRed, bb.max.x + 20, y + 1.1, bb.max.z + 12, 16));

  // road, parking, vehicles
  const roadZ = yz1 + 9;
  g.add(road(900, 11, cx, roadZ).translateY(y));
  const kerb = std(0xe6e3dd, 0.8);
  g.add(box(900, 0.15, 0.3, kerb, cx, y, roadZ - 5.7)); g.add(box(900, 0.15, 0.3, kerb, cx, y, roadZ + 5.7));
  const pk = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const x = bb.min.x - 8 + i * 2.8;
    pk.add(box(0.1, 0.01, 5, M.line, x - 1.4, y + 0.01, yz1 - 4));
    if (rand() < 0.75) { const c = car(); c.rotation.y = Math.PI / 2; c.position.set(x, y, yz1 - 4); pk.add(c); }
  }
  g.add(pk);
  const ft = fireTruck(); ft.position.set(bb.max.x + 11, y, bb.max.z + 6); ft.rotation.y = -Math.PI / 2; g.add(ft);

  // perimeter fence with gate, light poles, trees
  const fx0 = yx0 - 30, fx1 = yx1 + 40, fz0 = yz0 - 45, fz1 = yz1 + 2.5;
  g.add(fence(fx0, fz0, fx1, fz1, y));
  for (let x = fx0 + 8; x < fx1; x += 22) { const p = lightPole(); p.position.set(x, y, fz1 - 1.2); p.rotation.y = Math.PI / 2; g.add(p); }
  for (let x = fx0 + 4; x < fx1; x += 9) {
    const t = rand() < 0.6 ? palm(6 + rand() * 3) : tree(5 + rand() * 2);
    t.position.set(x + rand() * 2, y, roadZ + 9 + rand() * 2); g.add(t);
  }
  for (let z = fz0 + 6; z < fz1 - 6; z += 10) {
    const t = tree(5 + rand() * 3); t.position.set(fx0 + 2.5, y, z); g.add(t);
  }
  // landscaped strip with shrubs along the admin block
  const grass = pbr('Grass004', 1, { color: 0x9fb07a });
  g.add(plane(4, 24, grass, bb.min.x - 23.5, y + 0.01, cz - 2, 4));

  g.add(horizon(Math.max(R, 60) + 80, y - 0.02, rand));
}

/** Downtown high-rise district: street grid, the host tower behind the scene, city beyond. */
function towerSite({ bb, g, rand, y, cx, cz, hw, hd }) {
  const S = 92, RD = 16, B = S - RD, N = 4;
  g.add(plane(2800, 2800, pbr('Asphalt026A', 1, { color: 0x8f8f8f }), cx, y - 0.02, cz, 10));
  const walk = pbr('PavingStones130', 1, { color: 0xbdbab4 });
  const mats = [curtainWall(1, 0), curtainWall(2, 1), curtainWall(3, 3), stoneWall(4), curtainWall(5, 4), stoneWall(6), curtainWall(7, 2)];
  const podium = std(0xe4ddd0, 0.8);
  // roads (x and z) with dashed lanes, and traffic
  for (let k = -N; k < N; k++) {
    const off = (k + 0.5) * S;
    g.add(road(2 * N * S, RD, cx, cz + off).translateY(y));
    g.add(road(2 * N * S, RD, cx + off, cz, Math.PI / 2).translateY(y + 0.006));
    for (let i = 0; i < 10; i++) {
      const t = (rand() - 0.5) * 2 * N * S, lane = rand() < 0.5 ? -3 : 3;
      const a = car(); a.position.set(cx + t, y, cz + off + lane); a.rotation.y = lane > 0 ? 0 : Math.PI; g.add(a);
      const b2 = car(); b2.position.set(cx + off + lane, y, cz + t); b2.rotation.y = lane > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(b2);
    }
  }
  for (let i = -N + 1; i < N; i++) for (let j = -N + 1; j < N; j++) {
    const bx = cx + i * S, bz = cz + j * S;
    const home = i === 0 && j === 0, top = home ? y + 0.01 : y + 0.18;
    if (home) g.add(plane(B, B, walk, bx, top, bz, 5)); else g.add(box(B, 0.18, B, walk, bx, y, bz, { cast: false }));
    // street trees & lamps along the kerbs
    for (let t = -B / 2 + 6; t < B / 2 - 2; t += 12) {
      const tr1 = tree(6 + rand() * 2); tr1.position.set(bx + t, top, bz + B / 2 - 2); g.add(tr1);
      if ((t | 0) % 24 < 12) { const lp = lightPole(8); lp.position.set(bx + B / 2 - 1.5, top, bz + t); lp.rotation.y = Math.PI; g.add(lp); }
    }
    if (i === 0 && j === 0) continue;
    const m = mats[Math.floor(rand() * mats.length)];
    if (i === 0 && j === -1) {                              // the high-rise the scene belongs to, right behind it
      const w = 44, d = 30, h = 150;
      g.add(tower(w, h, d, mats[0], bx, bz + 4).translateY(y + 0.18));
      g.add(box(w - 6, 6, d - 6, M.galv, bx, y + h, bz + 4));
      g.add(box(w + 10, 7, d + 14, podium, bx, y + 0.18, bz + 8));
      continue;
    }
    if (rand() < 0.55) g.add(box(B - 10, 5 + rand() * 4, B - 10, podium, bx, y + 0.18, bz));
    const n = rand() < 0.5 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const w = 22 + rand() * 16, d = 22 + rand() * 16, h = 30 + rand() ** 2 * 170;
      const ox = n === 1 ? 0 : (k ? 1 : -1) * (B / 2 - w / 2 - 4);
      g.add(tower(w, h, d, m, bx + ox, bz + (rand() - 0.5) * 8).translateY(y + 0.18));
      g.add(box(w * 0.6, 3, d * 0.6, M.galv, bx + ox, y + 0.18 + h, bz));
    }
  }
  // home plaza: planters, benches, bollards, hydrant & FDC by the entrance
  const px = bb.max.x + 6, pz = bb.max.z + 7;
  for (let k = 0; k < 4; k++) {
    g.add(box(3, 0.6, 3, std(0x9c968b, 0.8), px - 14 + k * 9, y, pz));
    const t = tree(4.5); t.position.set(px - 14 + k * 9, y + 0.6, pz); g.add(t);
    g.add(box(2, 0.45, 0.6, std(0x6b4f35, 0.7), px - 9.5 + k * 9, y, pz + 1.5));
  }
  for (let k = 0; k < 8; k++) g.add(cyl(0.12, 0.9, M.darkSteel, bx0(bb) + k * 1.8, y, bb.max.z + 12.5, 10));
  g.add(cyl(0.3, 0.9, M.fireRed, bb.max.x + 3, y, bb.max.z + 4, 16));
  g.add(box(0.8, 0.6, 0.3, M.fireRed, bb.min.x + 2, y + 0.9, bb.max.z + 1));
  instancedBlocks(g, {
    count: 1300, seed: 5, mats: cityMats(9),
    place: (R) => { const x = (R() - 0.5) * 2600, z = (R() - 0.5) * 2600; return Math.max(Math.abs(x), Math.abs(z)) < N * S + 20 ? null : [cx + x, cz + z, 0]; },
    height: (R) => 12 + R() ** 3 * 90, footprint: (R) => [18 + R() * 26, 18 + R() * 26],
  });
}
const bx0 = (bb) => (bb.min.x + bb.max.x) / 2 - 6.3;

/** Business park: lawns, office blocks, parking, entrance road, flags and trees. */
function officeSite({ bb, g, rand, y, cx, cz }) {
  g.add(plane(2800, 2800, pbr('Grass004', 1, { color: 0xa9b886 }), cx, y - 0.02, cz, 6));
  const pave = pbr('PavingStones130', 1, { color: 0xd9d3c8 });
  const x0 = bb.min.x - 10, x1 = bb.max.x + 10, z0 = bb.min.z - 10, z1 = bb.max.z + 12;
  g.add(plane(x1 - x0, z1 - z0, pave, (x0 + x1) / 2, y, (z0 + z1) / 2, 5));
  const roadZ = z1 + 26;
  g.add(road(1200, 12, cx, roadZ).translateY(y));
  g.add(road(roadZ - z1, 8, cx, (z1 + roadZ) / 2, Math.PI / 2, false).translateY(y + 0.006));
  g.add(parking(14, 2, bb.min.x - 12, z1 + 12).translateY(y));
  g.add(parking(10, 2, bb.max.x + 30, z1 + 12).translateY(y));
  // flags at the entrance
  for (const [k, col] of [[0, 0x1f7a3a], [1, 0xffffff], [2, 0xb4161c]]) {
    const x = cx + 8 + k * 2.5;
    g.add(cyl(0.06, 10, M.steel, x, y, z1 + 3, 8));
    g.add(box(1.8, 1.1, 0.02, std(col, 0.8, 0, { side: THREE.DoubleSide }), x + 0.95, y + 8.5, z1 + 3, { cast: false }));
  }
  // surrounding office buildings
  const blocks = [
    [bb.min.x - 40, bb.min.z - 30, 34, 14, 18, 0.3], [cx + 10, bb.min.z - 50, 60, 18, 20, 0], [bb.max.x + 50, cz - 30, 40, 11, 22, -0.4],
    [bb.min.x - 90, cz + 10, 44, 22, 18, 1.2], [bb.max.x + 110, cz + 40, 50, 14, 20, -1.3], [cx - 20, bb.min.z - 130, 70, 26, 24, 0.1],
    [bb.max.x + 90, bb.min.z - 110, 46, 18, 18, 0.5],
  ];
  const rects = [];
  for (const [x, z, w, h, d, r] of blocks) {
    const o = office(w, h, d); o.position.set(x, y, z); o.rotation.y = r; g.add(o);
    g.add(plane(w + 10, d + 10, pave, x, y + 0.004, z, 5).rotateZ(r));
    rects.push([x, z, Math.max(w, d) / 2 + 8]);
  }
  // footpaths & trees on the lawns
  g.add(plane(3, 90, pave, bb.min.x - 22, y + 0.006, cz - 30, 5));
  for (let i = 0; i < 160; i++) {
    const a = rand() * Math.PI * 2, r = 30 + rand() * 260;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (Math.abs(z - roadZ) < 9 || rects.some(([rx, rz, rr]) => Math.hypot(x - rx, z - rz) < rr)) continue;
    if (x > x0 - 30 && x < x1 + 60 && z > z0 - 4 && z < roadZ + 4) continue;
    const t = rand() < 0.25 ? palm(6 + rand() * 3) : tree(5 + rand() * 4); t.position.set(x, y, z); g.add(t);
  }
  for (let x = cx - 200; x < cx + 200; x += 25) { const p = lightPole(); p.position.set(x, y, roadZ - 7); p.rotation.y = Math.PI / 2; g.add(p); }
  instancedBlocks(g, {
    count: 700, seed: 3, mats: cityMats(4),
    place: (R) => { const a = R() * Math.PI * 2, r = 380 + R() * 1000; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; },
    height: (R) => 8 + R() ** 3 * 40, footprint: (R) => [20 + R() * 30, 20 + R() * 30],
  });
}

/** Data-centre campus: data halls with rooftop chillers, generator yard, substation, fence. */
function dataCenterSite({ bb, g, rand, y, cx, cz, R }) {
  g.add(plane(2800, 2800, pbr('Ground054', 1, { color: 0xd9c7a4 }), cx, y - 0.02, cz, 10));
  const yard = pbr('Concrete034', 1, { color: 0xc9c6bf });
  const x0 = bb.min.x - 70, x1 = bb.max.x + 70, z0 = bb.min.z - 90, z1 = bb.max.z + 22;
  g.add(plane(x1 - x0, z1 - z0, yard, (x0 + x1) / 2, y, (z0 + z1) / 2, 6));
  const chiller = (x, z) => {
    const c2 = new THREE.Group(); c2.position.set(x, 0, z);
    c2.add(box(6, 1.8, 2.4, M.white)); c2.add(box(6, 0.05, 2.4, M.galv, 0, 1.8, 0));
    for (const k of [-1.5, 1.5]) c2.add(cyl(0.9, 0.12, M.black, k, 1.8, 0, 20));
    return c2;
  };
  const hall = (w, d, h, x, z, name) => {
    const s2 = shed(w, h, d, { color: '#eef0f1', rib: '#c9ced3', doors: 1, name, flat: true }); s2.position.set(x, y, z); g.add(s2);
    for (let i = -w / 2 + 6; i < w / 2 - 4; i += 8) for (const k of [-d / 4, d / 4]) g.add(chiller(x + i, z + k).translateY(y + h));
  };
  hall(90, 34, 10, cx + 10, bb.min.z - 30, 'DATA HALL A');
  hall(60, 30, 10, bb.max.x + 60, cz - 20, 'DATA HALL B');
  // generator yard: containerised diesel gensets with stacks & belly tanks
  for (let i = 0; i < 7; i++) {
    const x = bb.min.x - 12, z = bb.min.z - 20 + i * 5;
    g.add(box(12, 3, 2.8, std(0xe6e5de, 0.6, 0.2), x - 8, y, z));
    g.add(box(12, 0.6, 3, M.darkSteel, x - 8, y, z));
    g.add(cyl(0.25, 3, M.darkSteel, x - 12, y + 3, z, 10));
  }
  g.add(label3D('GENERATOR YARD', { size: 0.8, bg: 'rgba(30,41,59,0.92)' }).translateX(bb.min.x - 20).translateY(y + 4.5).translateZ(bb.min.z - 23));
  // substation
  const sx = bb.max.x + 30, sz = bb.max.z - 4;
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Group(); t.position.set(sx + i * 7, y, sz);
    t.add(box(3.2, 2.6, 2.4, std(0x7d8c80, 0.6, 0.3)));
    for (let f = -1.2; f <= 1.2; f += 0.3) t.add(box(0.05, 2, 0.5, std(0x6b786e, 0.6, 0.3), f, 0.3, 1.45));
    for (const k of [-0.8, 0, 0.8]) t.add(cyl(0.08, 1.2, M.white, k, 2.6, -0.5, 8));
    g.add(t);
  }
  g.add(box(22, 0.3, 10, M.concreteDark, sx + 7, y, sz));
  for (const [i, dx] of [[0, 0], [1, 16]]) {
    const t = storageTank({ r: 6, h: 9, text: i ? '' : 'FIRE WATER' }); t.position.set(bb.max.x + 20 + dx, y, bb.min.z - 70); g.add(t);
  }
  const roadZ = z1 + 12;
  g.add(road(900, 11, cx, roadZ).translateY(y));
  g.add(parking(16, 2, bb.min.x - 20, z1 - 6).translateY(y));
  g.add(fence(x0 - 6, z0 - 6, x1 + 6, z1 + 2.5, y));
  for (let x = x0; x < x1; x += 22) { const p = lightPole(); p.position.set(x, y, z1 + 1); p.rotation.y = Math.PI / 2; g.add(p); }
  for (let x = x0 - 20; x < x1 + 20; x += 9) { const t = palm(6 + rand() * 3); t.position.set(x, y, roadZ + 9); g.add(t); }
  g.add(horizon(Math.max(R, 60) + 110, y - 0.02, rand));
}

/** Light office floor tiles (60 cm grid) for indoor scenes without room(). */
export function tileFloorMaterial(w, d) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#dcd8cf'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(120,110,95,${0.03 + Math.random() * 0.04})`; x.fillRect(Math.random() * 128, Math.random() * 128, 6, 6); }
  x.strokeStyle = '#b9b3a7'; x.lineWidth = 2; x.strokeRect(1, 1, 126, 126);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w / 0.6, d / 0.6); t.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.02 });
}

// ─────────────────────────────── interior fit-out for room()
const signCache = new Map();
function signTex(key, draw, w = 256, h = 256) {
  if (signCache.has(key)) return signCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  signCache.set(key, t);
  return t;
}
function sign(key, draw, w, h, sw, sh, emissive = false) {
  const t = signTex(key, draw, w, h);
  const mat = emissive ? new THREE.MeshBasicMaterial({ map: t }) : new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 });
  return new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), mat);
}
const noSmoking = (g, w, h) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.lineWidth = 22; g.strokeStyle = '#d0141b'; g.beginPath(); g.arc(w / 2, h / 2 - 20, 88, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#222'; g.fillRect(w / 2 - 60, h / 2 - 32, 100, 24); g.fillStyle = '#e57b22'; g.fillRect(w / 2 + 40, h / 2 - 32, 20, 24);
  g.beginPath(); g.moveTo(w / 2 - 62, h / 2 - 82); g.lineTo(w / 2 + 62, h / 2 + 42); g.stroke();
  g.fillStyle = '#d0141b'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.fillText('NO SMOKING', w / 2, h - 14);
};
const exitSign = (g, w, h) => {
  g.fillStyle = '#128a3b'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = 'bold 70px Arial'; g.textBaseline = 'middle'; g.fillText('EXIT', 110, h / 2 + 4);
  g.fillRect(24, 30, 26, 70); g.beginPath(); g.arc(37, 20, 13, 0, 7); g.fill();
  g.beginPath(); g.moveTo(290, h / 2); g.lineTo(260, h / 2 - 26); g.lineTo(260, h / 2 + 26); g.fill(); g.fillRect(225, h / 2 - 9, 40, 18);
};
const ppeSign = (g, w, h) => {
  g.fillStyle = '#1d4ed8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = 'bold 30px Arial'; g.textAlign = 'center';
  g.fillText('AUTHORISED', w / 2, h / 2 - 20); g.fillText('PERSONNEL ONLY', w / 2, h / 2 + 22);
  g.font = '22px Arial'; g.fillText('PPE REQUIRED', w / 2, h - 22);
};
const fireSign = (g, w, h) => {
  g.fillStyle = '#c4161c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.font = 'bold 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('FIRE PROTECTION', w / 2, h / 2 - 22); g.font = 'bold 34px Arial'; g.fillText('EQUIPMENT ROOM', w / 2, h / 2 + 24);
};

/** Steel I-beam along x of given length (web + two flanges). */
function iBeam(len, depth = 0.35) {
  const g = new THREE.Group();
  const m = M.darkSteel;
  g.add(box(len, 0.03, 0.18, m, 0, 0, 0, { receive: false }));
  g.add(box(len, depth, 0.02, m, 0, 0, 0, { receive: false }));
  g.add(box(len, 0.03, 0.18, m, 0, depth - 0.03, 0, { receive: false }));
  return g;
}

/**
 * Details for the cut-away equipment room: epoxy floor with safety lines, painted dado, steel roof
 * frame with LED lights, cable tray, door, louvre, signs, extinguisher, call point & alarm bell.
 */
export function roomFitOut(g, w, d, h) {
  const bw = -d / 2 + 0.13, lw = -w / 2 + 0.13;           // inside faces of back & left walls
  // epoxy floor coat + yellow safety border & walkway
  g.add(plane(w - 0.3, d - 0.3, std(0x8c9a91, 0.45, 0.05), 0, 0.004, 0));
  const yl = new THREE.MeshBasicMaterial({ color: 0xe0b412 });
  g.add(plane(w - 1.4, 0.1, yl, 0, 0.008, -d / 2 + 0.7)); g.add(plane(0.1, d - 1.4, yl, -w / 2 + 0.7, 0.008, 0));
  g.add(plane(w - 1.4, 0.1, yl, 0, 0.008, d / 2 - 0.7)); g.add(plane(0.1, d - 1.4, yl, w / 2 - 0.7, 0.008, 0));
  g.add(plane(w - 2.4, 0.08, yl, 0, 0.008, d / 2 - 1.8)); g.add(plane(w - 2.4, 0.08, yl, 0, 0.008, d / 2 - 1.3));
  // painted dado band + skirting on the two full walls
  const dado = std(0xa7b1b7, 0.6), skirt = std(0x3a3f45, 0.6);
  g.add(box(w - 0.3, 1.2, 0.02, dado, 0, 0, bw + 0.01, { cast: false })); g.add(box(0.02, 1.2, d - 0.3, dado, lw + 0.01, 0, 0, { cast: false }));
  g.add(box(w - 0.3, 0.12, 0.04, skirt, 0, 0, bw + 0.02, { cast: false })); g.add(box(0.04, 0.12, d - 0.3, skirt, lw + 0.02, 0, 0, { cast: false }));
  g.add(box(w - 0.3, 0.05, 0.03, M.yellow, 0, 1.2, bw + 0.02, { cast: false })); g.add(box(0.03, 0.05, d - 0.3, M.yellow, lw + 0.02, 1.2, 0, { cast: false }));
  // corner columns + ring beam frame the cut-away so it reads as a building section
  const col = pbr('Concrete034', 1, { color: 0xd8d4cb });
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) g.add(box(0.45, h + 0.3, 0.45, col, x, 0, z));
  g.add(box(w + 0.45, 0.4, 0.3, col, 0, h, -d / 2)); g.add(box(0.3, 0.4, d + 0.45, col, -w / 2, h, 0));
  g.add(box(w + 0.45, 0.4, 0.3, col, 0, h, d / 2)); g.add(box(0.3, 0.4, d + 0.45, col, w / 2, h, 0));
  // steel roof beams with suspended LED battens
  const lamp = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e0, emissiveIntensity: 1.4 });
  const n = Math.max(2, Math.round(w / 4));
  for (let i = 1; i < n; i++) {
    const x = -w / 2 + (w / n) * i;
    const b = iBeam(d); b.rotation.y = Math.PI / 2; b.position.set(x, h + 0.02, 0); g.add(b);
    for (const z of [-d / 4, d / 4]) {
      g.add(box(0.012, 0.35, 0.012, M.darkSteel, x - 0.5, h - 0.33, z, { cast: false })); g.add(box(0.012, 0.35, 0.012, M.darkSteel, x + 0.5, h - 0.33, z, { cast: false }));
      g.add(box(1.25, 0.06, 0.16, M.white, x, h - 0.4, z, { cast: false }));
      g.add(box(1.2, 0.012, 0.12, lamp, x, h - 0.412, z, { cast: false, receive: false }));
    }
  }
  // cable tray along the back wall top
  const trayY = h - 0.55;
  g.add(box(w - 1, 0.02, 0.3, M.galv, 0.2, trayY, bw + 0.25, { cast: false }));
  g.add(box(w - 1, 0.08, 0.02, M.galv, 0.2, trayY, bw + 0.4, { cast: false }));
  for (let x = -w / 2 + 1.5; x < w / 2 - 0.5; x += 1.5) g.add(box(0.04, 0.04, 0.32, M.darkSteel, x, trayY - 0.04, bw + 0.25, { cast: false }));
  const cab = std(0x2b2f35, 0.5), cable = std(0x111316, 0.7);
  g.add(box(w - 1.1, 0.04, 0.2, cable, 0.2, trayY + 0.02, bw + 0.24, { cast: false }));
  // louvre (ventilation / combustion air) high on the back wall right side
  const lv = new THREE.Group();
  lv.add(box(1.4, 1.0, 0.06, M.galv, 0, 0, 0));
  for (let i = 0; i < 7; i++) { const s = box(1.3, 0.02, 0.12, M.darkSteel, 0, 0.08 + i * 0.13, 0.05, { cast: false }); s.rotation.x = -0.6; lv.add(s); }
  lv.position.set(lw + 0.03, Math.max(1.6, h - 1.9), -d / 2 + Math.min(d * 0.45, 3.2)); lv.rotation.y = Math.PI / 2; g.add(lv);
  // signs on the back wall
  const signY = Math.max(1.5, Math.min(h - 1.35, 2.6));
  const fs = sign('fire', fireSign, 512, 160, 1.6, 0.5); fs.position.set(-w / 2 + 2.2, signY + 0.2, bw + 0.03); g.add(fs);
  const ns = sign('nosmoke', noSmoking, 256, 256, 0.45, 0.45); ns.position.set(-w / 2 + 3.6, signY + 0.2, bw + 0.03); g.add(ns);
  const pp = sign('ppe', ppeSign, 256, 256, 0.45, 0.45); pp.position.set(-w / 2 + 4.2, signY + 0.2, bw + 0.03); g.add(pp);
  // steel door on the left wall near the front with a lit EXIT sign
  const dz = d / 2 - 1.9;
  const dg = new THREE.Group(); dg.position.set(lw, 0, dz); dg.rotation.y = Math.PI / 2;
  dg.add(box(1.5, 2.25, 0.08, M.darkSteel, 0, 0, 0.02));
  dg.add(box(1.36, 2.12, 0.05, std(0x8f989f, 0.45, 0.6), 0, 0.02, 0.06));
  dg.add(box(0.02, 2.12, 0.06, M.black, 0, 0.02, 0.07, { cast: false }));
  dg.add(box(0.9, 0.05, 0.06, M.steel, 0, 1.0, 0.12));
  const ex = sign('exit', exitSign, 320, 128, 0.55, 0.22, true); ex.position.set(0, 2.45, 0.05); dg.add(ex);
  g.add(dg);
  // wall extinguisher, call point, alarm bell, emergency light beside the door
  const ext = new THREE.Group(); ext.position.set(lw + 0.14, 0, dz - 1.35);
  ext.add(box(0.28, 0.02, 0.1, M.darkSteel, 0, 0.95, 0));
  ext.add(cyl(0.085, 0.5, M.fireRed, 0, 0.55, 0, 16)); ext.add(cyl(0.03, 0.08, M.black, 0, 1.05, 0, 8));
  ext.add(box(0.14, 0.04, 0.04, M.black, 0.03, 1.12, 0));
  const tag = sign('ext', (x, W, H) => { x.fillStyle = '#c4161c'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.font = 'bold 22px Arial'; x.textAlign = 'center'; x.fillText('FIRE', W / 2, 40); x.fillText('EXTINGUISHER', W / 2, 72); }, 192, 96, 0.3, 0.15);
  tag.rotation.y = Math.PI / 2; tag.position.set(-0.12, 1.45, 0); ext.add(tag);
  g.add(ext);
  const mcp = box(0.02, 0.1, 0.1, M.fireRed, lw + 0.01, 1.35, dz + 1.05, { cast: false }); g.add(mcp);
  g.add(box(0.03, 0.07, 0.07, M.white, lw + 0.02, 1.365, dz + 1.05, { cast: false }));
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.fireRed);
  bell.rotation.z = -Math.PI / 2; bell.position.set(lw + 0.02, Math.min(2.6, h - 0.8), dz + 1.05); g.add(bell);
  g.add(box(0.06, 0.1, 0.35, M.white, lw + 0.03, Math.min(2.75, h - 0.65), dz - 0.6, { cast: false }));   // emergency light
  // electrical distribution board on the left wall towards the back
  const db = box(0.18, 0.9, 0.6, cab, lw + 0.09, 1.3, -d / 2 + 1.4); g.add(db);
  g.add(box(0.01, 0.1, 0.1, M.yellow, lw + 0.185, 1.95, -d / 2 + 1.4, { cast: false }));
  g.add(box(0.04, h - 2.2 - 0.55, 0.04, M.galv, lw + 0.05, 2.2, -d / 2 + 1.25, { cast: false }));
}
