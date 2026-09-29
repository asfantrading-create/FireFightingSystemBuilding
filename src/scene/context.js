// Real-world context shared by the Jordan sites: instanced city blocks, port cranes & ships,
// runways and airport apron elements. Positions are site-relative metres (x = east, z = south).
import * as THREE from 'three';
import { pbr } from './world.js';
import { M, V, box, cyl } from './kit.js';
import { stoneWall, curtainWall, boxWorldUV } from './dubai.js';

function rnd(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Instanced low-rise city with per-instance world-scaled façade UVs. */
export function instancedBlocks(root, { count = 1500, seed = 1, place, mats, height = () => 12, footprint = () => [20, 20], ground = null }) {
  const R = rnd(seed);
  const geo = boxWorldUV(new THREE.BoxGeometry(1, 1, 1), 1, 1, 1);
  const buckets = mats.map((m) => ({ m, list: [] }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < count; i++) {
    const p = place(R);
    if (!p) continue;
    const [w, d] = footprint(R);
    const h = height(R, p);
    const y = ground ? ground(p[0], p[1]) : 0;
    q.setFromAxisAngle(V(0, 1, 0), p[2] ?? (R() - 0.5) * 0.4);
    m4.compose(V(p[0], y + h / 2 - 1, p[1]), q, V(w, h + 2, d));
    buckets[Math.floor(R() * buckets.length)].list.push(m4.clone());
  }
  for (const { m, list } of buckets) {
    if (!list.length) continue;
    const mat = m.clone();
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
        #ifdef USE_INSTANCING
          vec3 isc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vec3 an = abs(normal);
          vec2 s2 = an.y > 0.5 ? isc.xz : (an.x > 0.5 ? isc.zy : isc.xy);
          vMapUv = ( mapTransform * vec3( uv * s2, 1 ) ).xy;
        #endif`);
    };
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((mm, i) => im.setMatrixAt(i, mm));
    im.castShadow = true; im.receiveShadow = true;
    root.add(im);
  }
}

export const cityMats = (seed) => [stoneWall(seed), stoneWall(seed + 1), stoneWall(seed + 2), curtainWall(seed + 3, 2)];

/** Ship-to-shore container gantry crane (red/white, as at Aqaba Container Terminal). */
export function stsCrane(color = 0xc62828) {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.4 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f1ef, roughness: 0.5, metalness: 0.3 });
  for (const x of [-9, 9]) for (const z of [-8, 8]) g.add(box(1.4, 48, 1.4, (x + z) % 2 ? red : white, x, 0, z));
  g.add(box(20, 2, 18, red, 0, 30, 0));
  g.add(box(3, 3, 120, white, 0, 48, -30));               // boom over the water (−z) and backreach
  g.add(box(4, 4, 4, red, 0, 44, -40));                    // trolley
  g.add(box(3, 12, 3, red, 0, 50, 6));
  for (const x of [-9, 9]) g.add(box(1, 1, 18, M.darkSteel, x, 0.5, 0));
  return g;
}

/** Container ship: hull + deck containers + bridge superstructure. */
export function containerShip(len = 220, seed = 3) {
  const R = rnd(seed);
  const g = new THREE.Group();
  const w = len * 0.14;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(len, 14, w), new THREE.MeshStandardMaterial({ color: 0x1f2c3a, roughness: 0.6, metalness: 0.2 }));
  hull.position.y = 3; hull.castShadow = true; g.add(hull);
  g.add(box(len, 3, w + 0.2, new THREE.MeshStandardMaterial({ color: 0x8a1c1c, roughness: 0.7 }), 0, -4, 0));
  const cols = [0x1f4e8c, 0xb3261e, 0x2f7d3a, 0xd98e04, 0x6b7280, 0x0f766e, 0xe5e7eb];
  for (let x = -len / 2 + 12; x < len / 2 - 40; x += 13) {
    const h = 2 + Math.floor(R() * 4);
    for (let l = 0; l < h; l++) {
      g.add(box(12.2, 2.6, w * 0.9, new THREE.MeshStandardMaterial({ color: cols[Math.floor(R() * cols.length)], roughness: 0.7 }), x, 10 + l * 2.6, 0));
    }
  }
  g.add(box(16, 18, w * 0.9, M.white, len / 2 - 30, 10, 0));
  g.add(box(4, 8, 4, M.darkSteel, len / 2 - 26, 28, 0));
  return g;
}

export function tanker(len = 250) {
  const g = new THREE.Group();
  const w = len * 0.17;
  g.add(box(len, 16, w, new THREE.MeshStandardMaterial({ color: 0x2b3440, roughness: 0.6 }), 0, -6, 0));
  g.add(box(len, 1, w, new THREE.MeshStandardMaterial({ color: 0x7a2b22, roughness: 0.8 }), 0, 10, 0));
  for (let x = -len / 2 + 20; x < len / 2 - 50; x += 12) g.add(cyl(0.6, 2, M.darkSteel, x, 10.5, 0, 8).rotateZ(Math.PI / 2));
  g.add(box(18, 20, w * 0.85, M.white, len / 2 - 25, 10, 0));
  return g;
}

/** Runway with threshold bars, centreline and designators. */
export function runway(len, w, x, z, rotY = 0, label = '') {
  const g = new THREE.Group();
  const asph = pbr('Asphalt026A', 1, { color: 0x9a9a9a });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(len, w), asph);
  pl.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 === 0 ? v * len / 12 : v * w / 12; });
  pl.rotation.x = -Math.PI / 2; pl.position.y = 0.2; pl.receiveShadow = true; g.add(pl);
  const white = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
  for (let s = -len / 2 + 60; s < len / 2 - 60; s += 60) { const d = new THREE.Mesh(new THREE.PlaneGeometry(30, 0.9), white); d.rotation.x = -Math.PI / 2; d.position.set(s, 0.25, 0); g.add(d); }
  for (const e of [-1, 1]) for (let k = -6; k <= 6; k++) {
    if (k === 0) continue;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(45, 1.8), white); b.rotation.x = -Math.PI / 2; b.position.set(e * (len / 2 - 40), 0.25, k * (w / 14)); g.add(b);
  }
  g.position.set(x, 0, z); g.rotation.y = rotY;
  return g;
}

export function apron(w, d, x, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pbr('Concrete034', 1, { color: 0xd4d2cc }));
  m.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 === 0 ? w : d) / 10; });
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.12, z); m.receiveShadow = true;
  return m;
}
