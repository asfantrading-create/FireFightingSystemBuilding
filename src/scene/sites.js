// Facility scene builders. Each returns
//   { root, anchors: {id: Vector3}, focus: {id: {pos, target}}, overview, env, terrain, update(sample, tl, t), animate(dt) }
import * as THREE from 'three';
import { buildBurjKhalifa, buildDowntown } from './dubai.js';
import {
  M, V, box, cyl, pipe, cloneMat, facadeTexture, ribbedTexture, storageTank, pumpHouse, hydrant, fdc, valveStation,
  palm, tree, car, truck, fireTruck, road, parking, sprinklerArray, FireFX, SprayFX, FogFX, scatter, label3D,
} from './kit.js';

const focusOf = (anchor, dist, dir = V(1, 0.7, 1.1)) => {
  const d = dir.clone().normalize().multiplyScalar(dist);
  return { pos: [anchor.x + d.x, anchor.y + d.y, anchor.z + d.z], target: [anchor.x, anchor.y, anchor.z] };
};

// ───────────────────────── compartment with sprinklers & fire
function furnish(g, kind, w, d, h) {
  if (kind === 'office') {
    const desk = cloneMat(M.white, {}), chair = cloneMat(M.black, {});
    for (let x = 2; x < w - 2; x += 3.2) {
      for (let z = 2; z < d - 2; z += 2.8) {
        g.add(box(1.6, 0.05, 0.8, desk, x, 0.72, z)); g.add(box(0.05, 0.72, 0.7, M.darkSteel, x - 0.75, 0, z));
        g.add(box(1.6, 0.45, 0.04, cloneMat(M.blue, { color: new THREE.Color(0x6b7f99) }), x, 0.77, z - 0.42));
        g.add(box(0.5, 0.45, 0.5, chair, x, 0, z + 0.7));
        g.add(box(0.5, 0.32, 0.04, M.black, x + 0.2, 0.8, z - 0.2));
      }
    }
  } else if (kind === 'carpark') {
    for (let x = 3; x < w - 2; x += 2.8) for (const z of [3, d - 3]) { if (Math.random() < 0.85) { const c = car(); c.rotation.y = Math.PI / 2; c.position.set(x, 0, z); g.add(c); } }
    for (let x = 0; x <= w; x += 8.4) for (const z of [0.5, d - 0.5]) g.add(box(0.6, h, 0.6, M.concrete, x, 0, z));
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.15), M.lineY); lane.rotation.x = -Math.PI / 2; lane.position.set(w / 2, 0.02, d / 2); g.add(lane);
  } else if (kind === 'racks') {
    const up = cloneMat(M.blue, { color: new THREE.Color(0x1e4fa0) }), beam = cloneMat(M.yellow, { color: new THREE.Color(0xe8740c) });
    const palletCols = [0xb89b72, 0xc9b28a, 0x8a6e4b, 0xd4d4d4, 0x5b7fa6].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
    const levels = 5, lh = h * 0.88 / levels;
    for (let z = 2.2; z < d - 1; z += 4.2) {
      for (let x = 1; x < w - 1; x += 2.8) {
        for (const dz of [-0.55, 0.55]) g.add(box(0.1, h * 0.88, 0.1, up, x, 0, z + dz));
        for (let l = 1; l < levels; l++) g.add(box(2.8, 0.12, 0.1, beam, x + 1.4, l * lh, z + 0.55));
        for (let l = 0; l < levels; l++) {
          const m = palletCols[Math.floor(Math.random() * palletCols.length)];
          g.add(box(1.2, lh * 0.8, 1.0, m, x + 0.75, l * lh + 0.15, z)); g.add(box(1.2, lh * 0.8, 1.0, m, x + 2.05, l * lh + 0.15, z));
        }
      }
    }
  } else if (kind === 'server') {
    const led = document.createElement('canvas'); led.width = 64; led.height = 128;
    const lg = led.getContext('2d'); lg.fillStyle = '#111316'; lg.fillRect(0, 0, 64, 128);
    for (let i = 0; i < 40; i++) { lg.fillStyle = ['#22c55e', '#38bdf8', '#f59e0b'][i % 3]; lg.fillRect(6 + (i % 5) * 11, 4 + Math.floor(i / 5) * 15, 3, 2); }
    lg.strokeStyle = '#2a2e33'; for (let y = 0; y < 128; y += 6) { lg.beginPath(); lg.moveTo(0, y); lg.lineTo(64, y); lg.stroke(); }
    const lt = new THREE.CanvasTexture(led); lt.colorSpace = THREE.SRGBColorSpace;
    const front = new THREE.MeshStandardMaterial({ map: lt, emissive: 0xffffff, emissiveMap: lt, emissiveIntensity: 0.6, roughness: 0.4 });
    const side = new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.5, metalness: 0.4 });
    const mats = [side, side, side, side, front, front];
    for (let z = 2; z < d - 1.5; z += 2.4) {
      for (let x = 1.5; x < w - 1.5; x += 0.62) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.1, 1.1), mats); r.position.set(x, 1.05 + 0.4, z); r.castShadow = true; g.add(r); }
    }
    g.add(box(w, 0.4, d, cloneMat(M.white, { color: new THREE.Color(0xd9dde2) }), w / 2, 0, d / 2)); // raised floor
  }
}

function compartment(parent, { w, d, h, origin, rotY = 0, sys, kind, walls = 'glass', floorMat = M.concrete, openAir = false }) {
  const g = new THREE.Group();
  g.position.copy(origin); g.rotation.y = rotY;
  parent.add(g);
  g.updateMatrixWorld(true);
  g.add(box(w, 0.25, d, floorMat, w / 2, -0.25, d / 2));
  const wallMat = walls === 'glass' ? cloneMat(M.glass, { opacity: 0.18 }) : cloneMat(M.concrete, { transparent: true, opacity: 0.25 });
  g.add(box(w, h, 0.08, wallMat, w / 2, 0, 0, { cast: false }));
  g.add(box(0.08, h, d, wallMat, 0, 0, d / 2, { cast: false }));
  g.add(box(0.08, h, d, wallMat, w, 0, d / 2, { cast: false }));
  // ceiling as thin translucent grid so the sprinkler system is visible
  const ceil = box(w, 0.05, d, cloneMat(M.white, { transparent: true, opacity: 0.12 }), w / 2, h, d / 2, { cast: false });
  g.add(ceil);
  furnish(g, kind, w, d, h);
  // sprinkler grid identical to the simulator's grid
  const s = sys.spacing ?? 3;
  const pos = [], idx = new Map();
  const xs = [], zs = [];
  for (let x = s / 2; x < w; x += s) xs.push(x);
  for (let z = s / 2; z < d; z += s) zs.push(z);
  for (const x of xs) for (const z of zs) { idx.set(`${x.toFixed(2)}|${z.toFixed(2)}`, pos.length); pos.push(V(x, h - 0.08, z)); }
  // branch lines & cross main (red), riser nipple
  for (const x of xs) g.add(pipe([V(x, h - 0.02, zs[0]), V(x, h - 0.02, zs[zs.length - 1])], 0.035));
  g.add(pipe([V(xs[0], h - 0.02, 0.4), V(xs[xs.length - 1], h - 0.02, 0.4)], 0.07));
  for (const x of xs) g.add(pipe([V(x, h - 0.02, 0.4), V(x, h - 0.02, zs[0])], 0.035));
  const heads = sprinklerArray(pos, { scale: kind === 'racks' ? 5 : 3, bulb: sys.Tact >= 74 ? 0xe8c200 : 0xdd2222 });
  g.add(heads);
  const fire = new FireFX(g, { base: V(0, 0, 0), smokeCeiling: openAir ? null : h, n: 60 });
  const spray = new SprayFX(g, { drop: h - 0.2, radius: kind === 'racks' ? 2.4 : 1.8, maxHeads: 40, perHead: 70 });
  return { g, w, d, h, heads, headPos: pos, idx, fire, spray, s };
}

function updateCompartment(c, sc, sample, tl, t) {
  if (!c) return;
  c.fire.group.position.set(sc.fire.x, sc.fire.baseH ?? 0, sc.fire.z);
  c.fire.set(sample.hrr, sample.smoke);
  const open = [];
  for (const h of tl.headTimes) {
    if (h.t > t) continue;
    const i = c.idx.get(`${h.x.toFixed(2)}|${h.z.toFixed(2)}`);
    if (i !== undefined) open.push(i);
  }
  c.heads.setOpen(open);
  const flowing = sample.Qspr > 5;
  c.spray.setHeads(open.map((i) => c.headPos[i]), flowing ? Math.min(1.2, 0.5 + sample.Pfloor / 6) : 0);
}

function sprinklerSite(compDef, sc, fac) {
  return { compDef, sc, fac };
}

function standardEnv(biome, sun = 48) { return { biome, sunElevation: sun, sunAzimuth: 215 }; }

// ───────────────────────── Burj Khalifa (Downtown Dubai)
function buildHighRise(fac, sc, design, world) {
  const root = new THREE.Group();
  const anchors = {}, focus = {};
  const sys = { ...fac.system, ...(sc.override || {}) };
  const fireY = sc.id === 'carpark' ? undefined : 86.8;
  const burj = buildBurjKhalifa({ fireY });
  root.add(burj.group);
  anchors.transfer = V(0, 112, 0);
  focus.transfer = focusOf(V(0, 110, 0), 190, V(0.3, 0.35, 1));
  let comp;
  if (sc.id === 'carpark') {
    // multi-storey podium car park north-east of the tower
    const pod = new THREE.Group(); pod.position.set(95, 0, -175);
    for (const y of [0, 4, 12]) pod.add(box(60, 0.4, 40, M.concrete, 30, y, 20));
    for (let x = 0; x <= 60; x += 10) for (const z of [0, 40]) pod.add(box(0.7, 12, 0.7, M.concrete, x, 0, z));
    root.add(pod);
    comp = compartment(root, { ...sc.compartment, origin: V(113, 8.2, -163), sys, kind: 'carpark', walls: 'concrete' });
  } else {
    comp = compartment(root, { ...sc.compartment, origin: V(20, fireY + 0.3, -8), sys, kind: 'office' });
  }
  const fc = comp.g.localToWorld(V(sc.fire.x, 1.5, sc.fire.z));
  anchors.floor = fc.clone().add(V(0, 4, 0));
  focus.floor = { pos: [fc.x + 30, fc.y + 16, fc.z + 34], target: [fc.x, fc.y, fc.z] };
  const riserX = 21, riserZ = -8.6;
  root.add(pipe([V(riserX, 0, riserZ), V(riserX, 108, riserZ)], 0.35, cloneMat(M.fireRed, { emissive: 0x440000 })));
  anchors.riser = V(riserX, 60, riserZ); focus.riser = focusOf(V(riserX, 60, riserZ), 120);
  anchors.facp = V(0, 10, 78); focus.facp = focusOf(V(0, 5, 78), 70, V(0.2, 0.5, 1));
  // fire-protection service yard (reference design) west of the tower
  const tank1 = storageTank({ r: 7, h: 9, text: 'FIRE WATER' }); tank1.position.set(-165, 0, -95); root.add(tank1);
  const tank2 = storageTank({ r: 7, h: 9, text: 'FIRE WATER' }); tank2.position.set(-147, 0, -95); root.add(tank2);
  anchors.tank = V(-156, 14, -95); focus.tank = focusOf(V(-156, 5, -95), 60);
  const ph = pumpHouse({ w: 16, d: 10, h: 5, count: design.pumps?.count ?? 1 }); ph.position.set(-125, 0, -72); root.add(ph);
  anchors.pumps = V(-125, 7, -72); focus.pumps = { pos: [-111, 20, -50], target: [-125, 1, -72] };
  const ring = [V(-117, 0.3, -66), V(-100, 0.3, -66), V(-100, 0.3, -100), V(100, 0.3, -100), V(100, 0.3, 70), V(-100, 0.3, 70), V(-100, 0.3, -66)];
  root.add(pipe(ring, 0.25));
  for (const p of [V(-104, 0, -30), V(0, 0, -104), V(104, 0, -20), V(40, 0, 74), V(-60, 0, 74)]) { const hh = hydrant(); hh.position.copy(p); root.add(hh); }
  anchors.hydrants = V(0, 5, -104); focus.hydrants = focusOf(V(0, 1, -104), 45);
  const fd = fdc(); fd.position.set(-78, 0, 8); fd.rotation.y = Math.PI / 2; root.add(fd);
  anchors.fdc = V(-78, 5, 8); focus.fdc = focusOf(V(-78, 1.5, 8), 22);
  root.add(parking(20, 3, -40, -140, 0, 0.8));
  buildDowntown(root, world, [[-150, -85, 75], [-40, -140, 60], [120, -155, 60], [0, -100, 30]]);
  const trucks = [fireTruck(), fireTruck()];
  trucks[0].position.set(-70, 0, -40); trucks[1].position.set(-70, 0, -25);
  trucks.forEach((tt) => { tt.visible = false; root.add(tt); });
  return {
    root, anchors, focus, comp, trucks, ph, xrayMats: [burj.skin, burj.capMat], xrayFor: ['floor', 'riser', 'transfer'],
    overview: { pos: [150, 210, 1320], target: [40, 340, 0] },
    env: { ...standardEnv('city', 55), radius: 900, shadowSize: 700 },
    terrain: { flat: 6000, mountain: 25, biome: 'city', size: 20000, sea: (x, z) => (-x - z) / Math.SQRT2 > 3650 },
  };
}

// ───────────────────────── Aqaba ESFR warehouse
function buildWarehouse(fac, sc, design) {
  const root = new THREE.Group();
  const anchors = {}, focus = {};
  const sys = { ...fac.system, ...(sc.override || {}) };
  const W = 120, D = 80, H = 13.5;
  const clad = new THREE.MeshStandardMaterial({ map: ribbedTexture('#d7dbde', '#aeb5bb', 48), roughness: 0.55, metalness: 0.4 });
  clad.map.repeat.set(8, 1);
  const x0 = -W / 2, z0 = -D / 2;
  // walls; front (z = +D/2) has docks; cut-away corner at compartment (x0..x0+30, z0..z0+21)
  root.add(box(W, 0.3, D, M.concrete, 0, 0, 0));
  root.add(box(W - 30, H, 0.3, clad, 15, 0, z0));
  root.add(box(W, H, 0.3, clad, 0, 0, D / 2));
  root.add(box(0.3, H, D - 21, clad, x0, 0, z0 + 21 + (D - 21) / 2));
  root.add(box(0.3, H, D, clad, -x0, 0, 0));
  const roofMat = new THREE.MeshStandardMaterial({ map: ribbedTexture('#b8bec4', '#8e969d', 64), roughness: 0.5, metalness: 0.6 });
  roofMat.map.repeat.set(6, 1);
  // roof with a hole over the compartment
  root.add(box(W - 30, 0.3, D, roofMat, 15, H, 0));
  root.add(box(30, 0.3, D - 21, roofMat, x0 + 15, H, z0 + 21 + (D - 21) / 2));
  // skylights
  for (let x = -40; x <= 50; x += 18) root.add(box(4, 0.35, D - 6, cloneMat(M.glass, { opacity: 0.6 }), x, H + 0.05, 0));
  const comp = compartment(root, { ...sc.compartment, origin: V(x0 + 0.2, 0.3, z0 + 0.2), sys, kind: 'racks', walls: 'none' });
  // interior racks beyond the cut-away (visual only)
  const fireC = comp.g.localToWorld(V(sc.fire.x, 3, sc.fire.z));
  anchors.floor = fireC.clone().add(V(0, 12, 0));
  focus.floor = { pos: [fireC.x - 28, fireC.y + 26, fireC.z - 30], target: [fireC.x, 4, fireC.z] };
  // docks & trucks
  for (let i = 0; i < 10; i++) {
    const x = -50 + i * 11;
    root.add(box(3.5, 4.2, 0.2, cloneMat(M.steel, { color: new THREE.Color(0x6e7780) }), x, 0.3, D / 2 + 0.2));
    if (i % 2 === 0) { const tr = truck(0xf5f5f5); tr.rotation.y = Math.PI / 2; tr.position.set(x, 0, D / 2 + 12); root.add(tr); }
  }
  root.add(label3D('AQABA LOGISTICS', { size: 3.2, bg: 'rgba(30,64,120,0.95)' }).translateY(H - 3).translateZ(D / 2 + 0.3));
  // yard: tank, pump house, riser room, hydrants, containers, sea
  const tank = storageTank({ r: 9, h: 10, text: 'FIRE WATER 515 m³' }); tank.position.set(-100, 0, -60); root.add(tank);
  anchors.tank = V(-100, 15, -60); focus.tank = focusOf(V(-100, 5, -60), 55);
  const ph = pumpHouse({ w: 14, d: 10, h: 5, count: design.pumps.count }); ph.position.set(-100, 0, -30); ph.rotation.y = Math.PI / 2; root.add(ph);
  anchors.pumps = V(-100, 7, -30); focus.pumps = { pos: [-80, 18, -16], target: [-100, 1, -30] };
  root.add(pipe([V(-95, 0.4, -30), V(-80, 0.4, -30), V(-80, 0.4, -55), V(80, 0.4, -55), V(80, 0.4, 60), V(-80, 0.4, 60), V(-80, 0.4, -30)], 0.25));
  root.add(pipe([V(-80, 0.4, -30), V(-61, 0.4, -30), V(-61, 12, -30)], 0.2));
  const vs = valveStation(2); vs.position.set(-62, 0.3, -24); root.add(vs);
  anchors.riser = V(-61, 8, -26); focus.riser = focusOf(V(-61, 3, -26), 26, V(-1, 0.6, 0.8));
  for (const p of [V(-84, 0, 0), V(0, 0, -59), V(84, 0, 0), V(40, 0, 64), V(-40, 0, 64)]) { const h = hydrant(); h.position.copy(p); root.add(h); }
  anchors.hydrants = V(0, 5, -59); focus.hydrants = focusOf(V(0, 1, -59), 30);
  const f = fdc(); f.position.set(-61, 0, 41); root.add(f); anchors.fdc = V(-61, 5, 41); focus.fdc = focusOf(V(-61, 1, 41), 22);
  root.add(box(3, 2.5, 2, M.white, -66, 0, -12)); anchors.facp = V(-66, 5, -12); focus.facp = focusOf(V(-66, 1.5, -12), 20);
  const cc = [0x1f4e8c, 0xb3261e, 0x2f7d3a, 0xd98e04, 0x6b7280, 0x0f766e];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) for (let l = 0; l < 1 + ((r + c) % 3); l++) {
    root.add(box(12.2, 2.6, 2.44, new THREE.MeshStandardMaterial({ map: ribbedTexture('#' + cc[(r * 3 + c + l) % 6].toString(16).padStart(6, '0'), '#00000033', 24), roughness: 0.7 }), 110 + r * 14, l * 2.6, -60 + c * 4));
  }
  root.add(road(700, 14, 0, 110, 0)); root.add(road(500, 12, -140, 0, Math.PI / 2));
  root.add(parking(16, 2, 70, -85, 0, 0.6));
  scatter(root, 30, () => palm(6 + Math.random() * 3), { x0: -200, x1: 200, z0: 80, z1: 140 }, (x, z) => Math.abs(z - 110) < 10);
  const trucks = [fireTruck(), fireTruck()]; trucks[0].position.set(-70, 0, 70); trucks[1].position.set(-55, 0, 72);
  trucks.forEach((tt) => { tt.visible = false; root.add(tt); });
  return {
    root, anchors, focus, comp, trucks, ph,
    overview: { pos: [-190, 120, -170], target: [-10, 0, 0] },
    env: { ...standardEnv('desert', 62), radius: 350, shadowSize: 260 },
    terrain: { flat: 650, mountain: 520, biome: 'desert', seed: 3, sea: (x, z) => x < -1100 + z * 0.15 },
    sea: { size: [5000, 9000], pos: [-3600, -0.5, 0] },
  };
}

// ───────────────────────── Amman data centre (FM-200)
function buildDataCenter(fac, sc, design) {
  const root = new THREE.Group();
  const anchors = {}, focus = {};
  const room = sc.override?.room ?? fac.system.room;
  const BW = 64, BD = 44, BH = 9;
  const louvre = new THREE.MeshStandardMaterial({ map: ribbedTexture('#e7e9eb', '#c2c7cc', 80), roughness: 0.6, metalness: 0.2 });
  louvre.map.repeat.set(6, 1);
  const bx0 = -BW / 2, bz0 = -BD / 2;
  root.add(box(BW, 0.3, BD, M.concrete, 0, 0, 0));
  // building with the protected room cut open (top-left corner)
  root.add(box(BW, BH, 0.3, louvre, 0, 0, BD / 2));
  root.add(box(0.3, BH, BD, louvre, -bx0, 0, 0));
  root.add(box(BW - 24, BH, 0.3, louvre, 12, 0, bz0));
  root.add(box(0.3, BH, BD - 18, louvre, bx0, 0, 9));
  root.add(box(BW - 24, 0.3, BD, M.roofGrey, 12, BH, 0));
  root.add(box(24, 0.3, BD - 18, M.roofGrey, bx0 + 12, BH, 9));
  // roof chillers
  for (let i = 0; i < 6; i++) { root.add(box(8, 2.2, 2.6, M.galv, -2 + i * 5 + 4, BH + 0.3, -8)); for (let f = 0; f < 3; f++) root.add(cyl(0.9, 0.2, M.black, -2 + i * 5 + 1.5 + f * 2.6, BH + 2.5, -8, 16)); }
  const comp = compartment(root, { w: room.l, d: room.w, h: room.h, origin: V(bx0 + 1, 0.3, bz0 + 1), sys: { spacing: 99, Tact: 68 }, kind: 'server', walls: 'glass', floorMat: M.concreteDark });
  comp.heads.visible = false;
  // FM-200 nozzles & piping
  const nPos = [];
  const nn = design.nozzles;
  for (let i = 0; i < nn; i++) nPos.push(V(room.l * (i + 0.5) / nn, room.h - 0.25, room.w / 2));
  comp.g.add(pipe([V(-3, room.h - 0.1, room.w / 2), ...nPos.map((p) => V(p.x, room.h - 0.1, p.z))], 0.05, M.darkSteel));
  for (const p of nPos) { comp.g.add(cyl(0.06, 0.2, M.galv, p.x, p.y - 0.05, p.z, 12)); }
  // VESDA sampling pipes (red ABS)
  for (let z = 3; z < room.w; z += 4.5) comp.g.add(pipe([V(0.4, room.h - 0.05, z), V(room.l - 0.4, room.h - 0.05, z)], 0.02));
  // cylinder bank in the adjacent agent room
  const bank = new THREE.Group(); bank.position.set(bx0 - 5.5, 0.3, bz0 + 3);
  const n = design.cylinders;
  for (let i = 0; i < n; i++) {
    bank.add(cyl(0.32, 1.7, M.fireRed, 0, 0, i * 0.8, 24));
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.fireRed); top.position.set(0, 1.7, i * 0.8); bank.add(top);
    bank.add(cyl(0.07, 0.25, M.galv, 0, 1.95, i * 0.8, 10));
  }
  bank.add(pipe([V(0, 2.3, 0), V(0, 2.3, (n - 1) * 0.8), V(0, 3.2, (n - 1) * 0.8), V(4.6, 3.2, (n - 1) * 0.8)], 0.07, M.darkSteel));
  bank.add(box(3, 0.2, n * 0.8 + 1.2, M.concreteDark, 0.6, -0.2, (n - 1) * 0.4));
  root.add(bank);
  root.add(box(0.2, 3.2, n * 0.8 + 2, cloneMat(M.glass, { opacity: 0.2 }), bx0 - 3.4, 0.3, bz0 + 2.6 + (n - 1) * 0.4));
  anchors.cylinders = V(bx0 - 5.5, 4, bz0 + 3 + n * 0.4); focus.cylinders = focusOf(V(bx0 - 5.5, 1, bz0 + 3 + n * 0.4), 14, V(-1, 0.6, 0.6));
  const hallC = comp.g.localToWorld(V(room.l / 2, 2, room.w / 2));
  anchors.hall = hallC.clone().add(V(0, 5, 0)); focus.hall = { pos: [hallC.x - 18, hallC.y + 17, hallC.z - 22], target: [hallC.x, 0.5, hallC.z] };
  anchors.nozzles = comp.g.localToWorld(nPos[0].clone().add(V(0, 1.5, 0))); focus.nozzles = focusOf(anchors.nozzles.clone(), 12);
  anchors.vesda = comp.g.localToWorld(V(room.l - 1, room.h + 1.2, 3)); focus.vesda = focusOf(anchors.vesda.clone(), 12);
  const panel = box(0.8, 1.4, 0.3, M.fireRed, bx0 + room.l + 2, 0.8, bz0 + 0.5); root.add(panel);
  const strobe = cyl(0.12, 0.15, new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0 }), bx0 + room.l + 2, 2.4, bz0 + 0.5, 12); root.add(strobe);
  anchors.panel = V(bx0 + room.l + 2, 3.5, bz0 + 0.5); focus.panel = focusOf(V(bx0 + room.l + 2, 1.5, bz0 + 0.5), 10, V(0.4, 0.5, -1));
  const fog = new FogFX(comp.g, { w: room.l, h: room.h, d: room.w, center: V(room.l / 2, 0.3, room.w / 2), n: 110 });
  // generator yard
  for (let i = 0; i < 4; i++) {
    const gx = 44, gz = -18 + i * 11;
    root.add(box(12.2, 2.9, 2.44, cloneMat(M.green, { color: new THREE.Color(0x3f6b4f) }), gx, 0, gz));
    root.add(cyl(0.25, 3.5, M.darkSteel, gx + 4, 2.9, gz, 12));
  }
  root.add(storageTank({ r: 2.5, h: 3, text: null, shell: M.white }).translateX(58).translateZ(-26));
  anchors.generators = V(44, 6, -1); focus.generators = focusOf(V(44, 1, -1), 40);
  // Amman: white limestone buildings on hills, olive trees
  const stone = new THREE.MeshStandardMaterial({ map: facadeTexture({ cols: 6, rows: 4, bg: '#6c7880', win: '#8fa0ab', frame: '#ece6d8', lit: 0.02 }), roughness: 0.85 });
  const rnd = mulberry(11);
  for (let i = 0; i < 140; i++) {
    const a = rnd() * Math.PI * 2, r = 120 + rnd() * 520;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = 8 + Math.floor(rnd() * 4) * 3.3;
    root.add(box(12 + rnd() * 14, h, 12 + rnd() * 12, stone, x, 0, z));
  }
  scatter(root, 90, () => tree(4 + Math.random() * 2, cloneMat(M.foliage, { color: new THREE.Color(0x6f7d4a) })), { x0: -110, x1: 110, z0: -90, z1: 90 }, (x, z) => Math.abs(x) < 72 && Math.abs(z) < 52);
  root.add(road(600, 12, 0, 60, 0)); root.add(parking(12, 2, -10, 40, 0, 0.7));
  return {
    root, anchors, focus, comp, fog, strobe, bank,
    overview: { pos: [-70, 55, -75], target: [-8, 2, -2] },
    env: { ...standardEnv('hills', 44), radius: 180, shadowSize: 130 },
    terrain: { flat: 150, mountain: 140, biome: 'hills', seed: 5 },
  };
}

// ───────────────────────── Aqaba tank farm (foam)
function buildTankFarm(fac, sc, design) {
  const root = new THREE.Group();
  const anchors = {}, focus = {};
  const tanks = {};
  const fr = [['T-101', -80, -60], ['T-102', 20, -60], ['T-103', -80, 40], ['T-104', 20, 40]];
  for (const [id, x, z] of fr) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    g.add(cyl(30, 20, M.white, 0, 0, 0, 72));
    g.add(cyl(30.05, 1.2, M.fireRed, 0, 17.5, 0, 72));
    const deck = cyl(29.2, 0.6, M.galv, 0, 17.8, 0, 72); g.add(deck);
    const inner = cyl(29.6, 2, cloneMat(M.white, { side: THREE.BackSide }), 0, 18, 0, 72); g.add(inner);
    // foam dam & pourers around the rim
    const dam = new THREE.Mesh(new THREE.TorusGeometry(29.4, 0.12, 6, 96), M.galv); dam.rotation.x = Math.PI / 2; dam.position.y = 18.6; g.add(dam);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.add(box(0.6, 0.8, 0.6, M.fireRed, Math.cos(a) * 30.3, 19.6, Math.sin(a) * 30.3)); }
    // cooling ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(30.5, 0.15, 8, 96), M.fireRed); ring.rotation.x = Math.PI / 2; ring.position.y = 20.4; g.add(ring);
    g.add(label3D(id, { size: 2.4, bg: 'rgba(30,41,59,0.9)' }).translateY(12).translateZ(30.1));
    // stairway
    g.add(box(1.2, 20, 1.2, M.darkSteel, 30.6, 0, 0));
    root.add(g);
    tanks[id] = g;
  }
  const fxr = [['T-201', 110, -60], ['T-202', 110, 20]];
  for (const [id, x, z] of fxr) {
    const g = storageTank({ r: 15, h: 16, text: id, shell: M.white, roof: 'cone' }); g.position.set(x, 0, z); root.add(g); tanks[id] = g;
    for (const a of [0, Math.PI]) g.add(box(0.9, 1.2, 0.9, M.fireRed, Math.cos(a) * 15.3, 14.5, Math.sin(a) * 15.3));
  }
  // bund walls
  const bund = (x, z, w, d) => {
    const m = M.concreteDark, h = 1.8;
    root.add(box(w, h, 0.5, m, x, 0, z - d / 2)); root.add(box(w, h, 0.5, m, x, 0, z + d / 2));
    root.add(box(0.5, h, d, m, x - w / 2, 0, z)); root.add(box(0.5, h, d, m, x + w / 2, 0, z));
  };
  bund(-30, -60, 190, 88); bund(-30, 40, 190, 88); bund(110, -20, 60, 150);
  anchors.bund = V(-30, 4, -104); focus.bund = focusOf(V(-30, 1, -104), 60);
  const target = sc.id === 'full' ? tanks['T-201'] : tanks['T-101'];
  const tp = target.position;
  const R = sc.id === 'full' ? 15 : 30, topY = sc.id === 'full' ? 17.5 : 18.6;
  // fires: ring of flames on the rim seal, or one pool fire on the full surface
  const fires = [];
  if (sc.id === 'full') {
    const f = new FireFX(root, { base: V(tp.x, topY, tp.z), openAir: true, n: 110, spread: 0.25 }); fires.push(f);
  } else {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 1.3 + 0.4;
      fires.push(new FireFX(root, { base: V(tp.x + Math.cos(a) * 29.4, topY, tp.z + Math.sin(a) * 29.4), openAir: true, n: 30, spread: 0.35 }));
    }
  }
  anchors.tankFire = V(tp.x, topY + 12, tp.z); focus.tankFire = focusOf(V(tp.x, topY, tp.z), 120);
  // foam discharge (pourers) and cooling spray on neighbouring tanks
  const foamSpray = new SprayFX(root, { drop: 1.6, radius: 1.0, perHead: 40, maxHeads: 12, color: 0xffffff, size: 0.35 });
  const pourers = [];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pourers.push(V(tp.x + Math.cos(a) * (R - 0.4), topY + 1.2, tp.z + Math.sin(a) * (R - 0.4))); }
  const foamDisc = new THREE.Mesh(sc.id === 'full' ? new THREE.CircleGeometry(R - 0.2, 64) : new THREE.RingGeometry(R - 1.2, R - 0.1, 96),
    new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9, transparent: true, opacity: 0 }));
  foamDisc.rotation.x = -Math.PI / 2; foamDisc.position.set(tp.x, topY + 0.25, tp.z); root.add(foamDisc);
  anchors.pourers = V(tp.x + R, topY + 4, tp.z); focus.pourers = focusOf(V(tp.x + R, topY, tp.z), 35);
  const neighbours = sc.id === 'full' ? [tanks['T-202']] : [tanks['T-102'], tanks['T-103']];
  const coolSpray = new SprayFX(root, { drop: 18, radius: 0.6, perHead: 18, maxHeads: 48, size: 0.3 });
  const coolHeads = [];
  for (const nb of neighbours) {
    const r = sc.id === 'full' ? 15.4 : 30.6, y = sc.id === 'full' ? 16 : 20.3;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; coolHeads.push(V(nb.position.x + Math.cos(a) * r, y, nb.position.z + Math.sin(a) * r)); }
  }
  const nb0 = neighbours[0].position;
  anchors.cooling = V(nb0.x, 26, nb0.z); focus.cooling = focusOf(V(nb0.x, 12, nb0.z), 110);
  // foam house, bladder tank, fire water reservoir, pipe racks, monitors
  const fh = pumpHouse({ w: 18, d: 12, h: 5.5, count: design.pumps.count }); fh.position.set(-170, 0, -10); fh.rotation.y = Math.PI / 2; root.add(fh);
  const bladder = new THREE.Group(); bladder.position.set(-170, 0, 20);
  const bl = cyl(1.6, 7, M.fireRed, 0, 0, 0, 24); bl.rotation.z = Math.PI / 2; bl.position.set(0, 2.2, 0); bladder.add(bl);
  bladder.add(box(0.4, 1.2, 2.4, M.darkSteel, -2.4, 0, 0)); bladder.add(box(0.4, 1.2, 2.4, M.darkSteel, 2.4, 0, 0));
  bladder.add(label3D('AFFF 3%', { size: 0.9 }).translateY(2.2).translateZ(1.62));
  root.add(bladder);
  anchors.foamHouse = V(-170, 9, 0); focus.foamHouse = { pos: [-145, 22, 22], target: [-170, 1, 0] };
  const res = storageTank({ r: 20, h: 13, text: 'FIRE WATER', roof: 'cone' }); res.position.set(-230, 0, -60); root.add(res);
  anchors.waterTank = V(-230, 20, -60); focus.waterTank = focusOf(V(-230, 6, -60), 80);
  root.add(pipe([V(-210, 0.6, -60), V(-170, 0.6, -60), V(-170, 0.6, -18)], 0.35));
  root.add(pipe([V(-162, 0.6, -10), V(-130, 0.6, -10), V(-130, 0.6, -110), V(150, 0.6, -110), V(150, 0.6, 90), V(-130, 0.6, 90), V(-130, 0.6, -10)], 0.3));
  for (const [x, z] of fr.map((f) => [f[1], f[2]])) root.add(pipe([V(-130, 0.6, z), V(x - 31, 0.6, z), V(x - 31, 20.4, z)], 0.18));
  // pipe rack (product lines)
  for (let x = -120; x < 150; x += 12) { root.add(box(0.4, 5, 0.4, M.darkSteel, x, 0, -8)); root.add(box(0.4, 5, 0.4, M.darkSteel, x, 0, -2)); root.add(box(0.4, 0.4, 6.4, M.darkSteel, x, 5, -5)); }
  for (let k = 0; k < 4; k++) root.add(pipe([V(-120, 5.5, -7 + k * 1.3), V(150, 5.5, -7 + k * 1.3)], 0.3, [M.galv, M.yellow, M.galv, M.darkSteel][k]));
  const monitors = [];
  for (const [x, z] of [[tp.x - 42, tp.z - 42], [tp.x + 42, tp.z - 42]]) {
    const m = new THREE.Group(); m.position.set(x, 0, z);
    m.add(pipe([V(0, 0, 0), V(0, 2.5, 0)], 0.15)); m.add(cyl(0.18, 0.9, M.fireRed, 0, 2.5, 0, 12).rotateZ(-0.6));
    root.add(m); monitors.push(m);
  }
  anchors.monitors = V(tp.x - 42, 6, tp.z - 42); focus.monitors = focusOf(V(tp.x - 42, 2, tp.z - 42), 45);
  const monitorSpray = new SprayFX(root, { drop: -14, radius: 26, perHead: 90, maxHeads: 2, color: 0xffffff, size: 0.5 });
  // sea & jetty
  root.add(box(12, 1.5, 240, M.concreteDark, -330, -0.5, 0));
  root.add(road(700, 12, 0, 150, 0));
  const trucks = [fireTruck(), fireTruck(), fireTruck()];
  trucks.forEach((tt, i) => { tt.position.set(tp.x - 60 + i * 12, 0, tp.z - 52); tt.visible = false; root.add(tt); });
  return {
    root, anchors, focus, fires, foamSpray, pourers, foamDisc, coolSpray, coolHeads, monitorSpray, monitors, trucks, fh,
    overview: { pos: [-260, 190, -300], target: [0, 0, -10] },
    env: { ...standardEnv('coast', 50), radius: 420, shadowSize: 300 },
    terrain: { flat: 480, mountain: 600, biome: 'coast', seed: 9, sea: (x, z) => x < -320 },
    sea: { size: [4000, 9000], pos: [-2330, -0.4, 0] },
  };
}

// ───────────────────────── QAIA MRO hangar (foam-water deluge)
function aircraft(scale = 1) {
  const g = new THREE.Group();
  const white = cloneMat(M.white, { roughness: 0.3, metalness: 0.2 });
  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(2.8, 50, 8, 24), white); fus.rotation.z = Math.PI / 2; fus.position.y = 5.5; fus.castShadow = true; g.add(fus);
  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(2.82, 46, 4, 24), cloneMat(M.steel, { color: new THREE.Color(0x9aa3ad) })); belly.rotation.z = Math.PI / 2; belly.position.y = 5.2; belly.scale.set(1, 1, 0.6); g.add(belly);
  const wingGeo = new THREE.BoxGeometry(12, 0.6, 58); const wing = new THREE.Mesh(wingGeo, white); wing.position.set(-2, 4.2, 0); wing.castShadow = true; g.add(wing);
  wing.geometry.attributes.position.array.forEach((v, i, a) => { if (i % 3 === 0) { const z = a[i + 2]; a[i] = v - Math.abs(z) * 0.35; } });
  wing.geometry.attributes.position.needsUpdate = true; wing.geometry.computeVertexNormals();
  for (const z of [-10, 10]) { const e = cyl(1.4, 5, cloneMat(M.steel, { color: new THREE.Color(0xd8dde2) }), 0, 0, 0, 24); e.rotation.z = Math.PI / 2; e.position.set(2, 2.8, z); g.add(e); }
  const fin = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 0.5), cloneMat(M.fireRed, { color: new THREE.Color(0x7a1f2b) })); fin.position.set(-24, 11, 0); g.add(fin);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 18), white); tail.position.set(-24, 6.5, 0); g.add(tail);
  for (const [x, z] of [[18, 0], [-2, -3], [-2, 3]]) g.add(cyl(0.5, 3, M.black, x, 0, z, 12));
  g.scale.setScalar(scale);
  return g;
}

function buildHangar(fac, sc, design) {
  const root = new THREE.Group();
  const anchors = {}, focus = {};
  const W = 90, D = 70, H = 25;
  const x0 = -W / 2, z0 = -D / 2;
  const clad = new THREE.MeshStandardMaterial({ map: ribbedTexture('#dfe3e6', '#b3bac0', 60), roughness: 0.5, metalness: 0.35 });
  clad.map.repeat.set(5, 1);
  root.add(box(W, 0.3, D, cloneMat(M.concrete, { color: new THREE.Color(0xd9d9d4) }), 0, 0, 0));
  root.add(box(W, H, 0.4, clad, 0, 0, z0));
  root.add(box(0.4, H, D, clad, x0, 0, 0));
  root.add(box(0.4, H, D, clad, -x0, 0, 0));
  root.add(box(W, 5, 0.6, clad, 0, H - 5, D / 2));   // door header (doors fully open)
  for (const s of [-1, 1]) root.add(box(4, H - 5, 3, clad, s * (W / 2 + 2), 0, D / 2 - 1));
  // roof trusses (visible — roof sheeting cut away over the aircraft)
  for (let x = x0 + 5; x < -x0; x += 10) root.add(box(0.5, 2.5, D, M.galv, x, H - 2.5, 0));
  root.add(box(W, 0.3, D / 2, cloneMat(M.roofGrey, {}), 0, H, -D / 4));
  root.add(label3D('MRO HANGAR 1', { size: 2.6, bg: 'rgba(30,41,59,0.92)' }).translateY(H - 2.5).translateZ(D / 2 + 0.4));
  const ac = aircraft(1); ac.position.set(0, 0, 0); ac.rotation.y = Math.PI / 2; root.add(ac);
  anchors.aircraft = V(8, 14, 0); focus.aircraft = { pos: [48, 22, 58], target: [4, 3, 6] };
  // deluge heads grid (two zones) + distribution
  const heads = [];
  for (let x = x0 + 4; x < -x0 - 3; x += 5.5) for (let z = z0 + 4; z < D / 2 - 3; z += 5.5) heads.push(V(x, H - 3, z));
  const sprk = sprinklerArray(heads, { scale: 8, bulb: 0x777777 }); root.add(sprk);
  for (let x = x0 + 4; x < -x0 - 3; x += 5.5) root.add(pipe([V(x, H - 2.8, z0 + 4), V(x, H - 2.8, D / 2 - 4)], 0.09));
  root.add(pipe([V(x0 + 4, H - 2.8, z0 + 2), V(-x0 - 4, H - 2.8, z0 + 2)], 0.2));
  anchors.deluge = V(-20, H + 2, -10); focus.deluge = { pos: [-30, H + 12, 40], target: [-10, H - 5, 0] };
  const spray = new SprayFX(root, { drop: H - 3.2, radius: 3.2, perHead: 26, maxHeads: heads.length, size: 0.3 });
  // valve station & flame detectors & monitors
  const vs = valveStation(3); vs.position.set(x0 + 2, 0.3, z0 + 3); root.add(vs);
  anchors.valves = V(x0 + 4, 4.5, z0 + 3); focus.valves = focusOf(V(x0 + 4, 1.5, z0 + 3), 16, V(1, 0.6, 1));
  const det = [];
  for (const [x, z] of [[x0 + 1, -15], [x0 + 1, 15], [-x0 - 1, -15], [-x0 - 1, 15]]) {
    const d = box(0.5, 0.4, 0.4, new THREE.MeshStandardMaterial({ color: 0xf2b705, emissive: 0xff0000, emissiveIntensity: 0 }), x, 9, z); root.add(d); det.push(d);
  }
  anchors.flame = V(x0 + 1, 12, -15); focus.flame = focusOf(V(x0 + 1, 9, -15), 18, V(1, 0.4, 0.6));
  const monitors = [];
  for (const [x, z] of [[x0 + 3, D / 2 - 6], [-x0 - 3, D / 2 - 6]]) {
    const m = new THREE.Group(); m.position.set(x, 0.3, z); m.add(box(1, 1.2, 1, M.fireRed, 0, 0, 0)); m.add(cyl(0.12, 1, M.galv, 0, 1.2, 0, 10).rotateZ(x < 0 ? -1 : 1));
    root.add(m); monitors.push(m);
  }
  anchors.monitors = V(x0 + 3, 4, D / 2 - 6); focus.monitors = focusOf(V(x0 + 3, 1, D / 2 - 6), 18);
  const monitorSpray = new SprayFX(root, { drop: -0.2, radius: 30, perHead: 120, maxHeads: 2, color: 0xffffff, size: 0.35 });
  const fire = new FireFX(root, { base: V(8, 0.1, 10), openAir: false, smokeCeiling: H - 1, n: 90, spread: 0.6 });
  const foamDisc = new THREE.Mesh(new THREE.CircleGeometry(22, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0 }));
  foamDisc.rotation.x = -Math.PI / 2; foamDisc.position.set(4, 0.2, 6); root.add(foamDisc);
  // pump house & tanks
  const ph = pumpHouse({ w: 18, d: 12, h: 5.5, count: design.pumps.count }); ph.position.set(-85, 0, -40); root.add(ph);
  anchors.pumps = V(-85, 8, -40); focus.pumps = { pos: [-64, 22, -18], target: [-85, 1, -40] };
  const t1 = storageTank({ r: 11, h: 12, text: 'FIRE WATER' }); t1.position.set(-120, 0, -45); root.add(t1);
  const t2 = storageTank({ r: 11, h: 12, text: 'FIRE WATER' }); t2.position.set(-120, 0, -15); root.add(t2);
  anchors.tank = V(-120, 18, -30); focus.tank = focusOf(V(-120, 6, -30), 70);
  root.add(pipe([V(-109, 0.4, -40), V(-94, 0.4, -40)], 0.3));
  root.add(pipe([V(-76, 0.4, -40), V(-50, 0.4, -40), V(-50, 0.4, z0 + 3), V(x0 + 2, 0.4, z0 + 3)], 0.3));
  // apron, second aircraft, terminal with QAIA-style shallow domes, control tower
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(700, 300), cloneMat(M.concrete, { color: new THREE.Color(0xc9c9c3) }));
  apron.rotation.x = -Math.PI / 2; apron.position.set(0, 0.03, 190); apron.receiveShadow = true; root.add(apron);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 120), M.lineY); l.rotation.x = -Math.PI / 2; l.position.set(-150 + i * 60, 0.06, 170); root.add(l); }
  const ac2 = aircraft(0.9); ac2.position.set(-120, 0, 150); ac2.rotation.y = 0.3; root.add(ac2);
  const term = new THREE.Group(); term.position.set(260, 0, 330);
  term.add(box(360, 14, 70, new THREE.MeshStandardMaterial({ map: facadeTexture({ cols: 20, rows: 2, bg: '#50606b', win: '#90a8b6', frame: '#e3ddcf', band: true }), roughness: 0.4, metalness: 0.3 }), 0, 0, 0));
  for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) {
    const dm = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 8, 0, Math.PI * 2, 0, Math.PI / 5.5), M.cream);
    dm.position.set(-165 + i * 30, 14 - 16 * Math.cos(Math.PI / 5.5), -17 + j * 34); dm.castShadow = true; term.add(dm);
  }
  root.add(term);
  const tower = new THREE.Group(); tower.position.set(150, 0, 420);
  tower.add(cyl(4, 60, M.cream, 0, 0, 0, 16)); tower.add(cyl(9, 6, M.glassDark, 0, 60, 0, 16, 10)); tower.add(cyl(10, 1.2, M.white, 0, 66, 0, 16));
  root.add(tower);
  root.add(road(900, 16, 0, -140, 0));
  scatter(root, 25, () => tree(5, cloneMat(M.foliage, { color: new THREE.Color(0x6f7d4a) })), { x0: -250, x1: 250, z0: -250, z1: -150 });
  const trucks = [fireTruck(), fireTruck()];
  trucks[0].position.set(30, 0, 70); trucks[1].position.set(46, 0, 72); trucks.forEach((tt) => { tt.visible = false; root.add(tt); });
  return {
    root, anchors, focus, fire, spray, sprkHeads: heads, det, monitors, monitorSpray, foamDisc, trucks, ph,
    overview: { pos: [120, 80, 160], target: [0, 8, 0] },
    env: { ...standardEnv('hills', 34), radius: 300, shadowSize: 220 },
    terrain: { flat: 900, mountain: 160, biome: 'hills', seed: 13 },
  };
}

// ───────────────────────── custom building
function buildCustom(fac, sc, design) {
  const root = new THREE.Group();
  const anchors = {}, focus = {};
  const c = fac.custom;
  const sys = fac.system;
  const H = c.floors * c.fh;
  const facade = facadeTexture({ cols: 10, rows: 6, bg: '#4f6272', win: '#98b3c4', frame: '#e2dfd8', lit: 0.06 });
  facade.repeat.set(c.w / 12, c.floors / 6);
  const skin = new THREE.MeshStandardMaterial({ map: facade, roughness: 0.35, metalness: 0.45 });
  const ffY = (c.fireFloor - 1) * c.fh;
  const x0 = -c.w / 2, z0 = -c.d / 2;
  if (ffY > 0) root.add(box(c.w, ffY, c.d, skin, 0, 0, 0));
  if (H - ffY - c.fh > 0) root.add(box(c.w, H - ffY - c.fh, c.d, skin, 0, ffY + c.fh, 0));
  root.add(box(c.w, 0.3, c.d, M.concrete, 0, ffY, 0));
  root.add(box(c.w, 0.4, c.d, M.roofGrey, 0, H, 0));
  const comp = compartment(root, { ...sc.compartment, origin: V(x0 + 0.5, ffY + 0.3, z0 + 0.5), sys, kind: fac.custom.kind ?? (sys.hazard === 'OH1' ? 'carpark' : sys.hazard.startsWith('EH') ? 'racks' : 'office') });
  const fc = comp.g.localToWorld(V(sc.fire.x, 1.5, sc.fire.z));
  anchors.floor = fc.clone().add(V(0, 4, 0));
  focus.floor = { pos: [fc.x - 20, fc.y + 12, fc.z - 24], target: [fc.x, fc.y, fc.z] };
  root.add(pipe([V(x0 + 0.6, 0, z0 + 0.6), V(x0 + 0.6, H, z0 + 0.6)], 0.2, cloneMat(M.fireRed, { emissive: 0x330000 })));
  anchors.riser = V(x0 + 0.6, Math.min(H, ffY + 6), z0 + 0.6); focus.riser = focusOf(V(x0, ffY, z0), 40, V(-1, 0.5, -1));
  const tank = storageTank({ r: 6, h: 7, text: `FIRE WATER ${design.tank} m³` }); tank.position.set(x0 - 30, 0, z0 - 10); root.add(tank);
  anchors.tank = V(x0 - 30, 11, z0 - 10); focus.tank = focusOf(V(x0 - 30, 3, z0 - 10), 35);
  const ph = pumpHouse({ w: 12, d: 9, h: 4.5, count: design.pumps.count }); ph.position.set(x0 - 30, 0, z0 + 14); root.add(ph);
  anchors.pumps = V(x0 - 30, 6, z0 + 14); focus.pumps = { pos: [x0 - 14, 14, z0 + 30], target: [x0 - 30, 1, z0 + 14] };
  root.add(pipe([V(x0 - 24, 0.4, z0 + 14), V(x0 + 0.6, 0.4, z0 + 14), V(x0 + 0.6, 0.4, z0 + 0.6)], 0.2));
  const f = fdc(); f.position.set(0, 0, c.d / 2 + 0.3); root.add(f); anchors.fdc = V(0, 5, c.d / 2); focus.fdc = focusOf(V(0, 1, c.d / 2), 20, V(0.3, 0.5, 1));
  anchors.facp = V(c.w / 2 - 4, 4, c.d / 2); focus.facp = focusOf(V(c.w / 2 - 4, 1.5, c.d / 2), 16, V(0.3, 0.5, 1));
  root.add(road(600, 14, 0, c.d / 2 + 25, 0));
  root.add(parking(12, 2, c.w / 2 + 30, 0, Math.PI / 2, 0.6));
  const isPalm = c.biome !== 'hills';
  scatter(root, 40, () => (isPalm ? palm(6 + Math.random() * 3) : tree(5)), { x0: -140, x1: 140, z0: -120, z1: 120 }, (x, z) => (Math.abs(x) < c.w / 2 + 40 && Math.abs(z) < c.d / 2 + 30));
  const trucks = [fireTruck()]; trucks[0].position.set(10, 0, c.d / 2 + 14); trucks[0].visible = false; root.add(trucks[0]);
  const R = Math.max(c.w, H) * 1.8 + 60;
  return {
    root, anchors, focus, comp, trucks, ph, xrayMats: [skin], xrayFor: ['floor', 'riser'],
    overview: { pos: [R * 0.8, R * 0.55 + H * 0.3, R * 0.9], target: [0, H * 0.35, 0] },
    env: { ...standardEnv(c.biome, 50), radius: R, shadowSize: Math.max(120, R) },
    terrain: { flat: 400, mountain: c.biome === 'hills' ? 180 : 90, biome: c.biome === 'city' ? 'city' : c.biome },
  };
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ───────────────────────── update logic shared by builders
function setPumpVisual(site, s) {
  const pumps = site.ph?.userData?.pumps;
  if (!pumps) return;
  const tint = (units, on) => units?.forEach((u) => u.traverse((o) => {
    if (o.isMesh && o.material === M.fireRed) { o.material = cloneMat(M.fireRed, {}); }
    if (o.isMesh && o.material.emissive && o.material.color.r > 0.6 && o.material.color.g < 0.2) o.material.emissive.setHex(on ? 0x551100 : 0x000000);
  }));
  tint(pumps.main, s.main > 0.05); tint(pumps.diesel, s.diesel > 0.05); tint(pumps.jockey, s.jockey > 0);
}

export const BUILDERS = { highrise: buildHighRise, warehouse: buildWarehouse, datacenter: buildDataCenter, tankfarm: buildTankFarm, hangar: buildHangar, custom: buildCustom };

export function buildSite(fac, sc, design, world) {
  const b = BUILDERS[fac.scene](fac, sc, design, world);
  const root = b.root;
  // terrain & water
  world.setEnvironment(b.env);
  const terr = world.makeTerrain(b.terrain);
  terr.position.y = -0.05;
  root.add(terr);
  if (b.sea) root.add(world.makeWater(b.sea.size, b.sea.pos, 0x1f6f8b));
  root.traverse((o) => { if (o.isMesh && o !== terr) { o.castShadow = o.castShadow ?? true; } });

  let brigadeT = Infinity;
  let pumpState = '';
  const site = {
    ...b,
    setXray(on) {
      for (const m of b.xrayMats || []) {
        m.transparent = on; m.opacity = on ? 0.14 : 1; m.depthWrite = !on; m.needsUpdate = true;
      }
    },
    update(sample, tl, t) {
      if (b.comp && b.comp.fire && fac.system.kind === 'sprinkler') updateCompartment(b.comp, sc, sample, tl, t);
      if (fac.system.kind === 'cleanAgent') {
        b.comp.fire.group.position.set(sc.fire.x, 1.2, sc.fire.z);
        b.comp.fire.set(sample.hrr, sample.smoke);
        b.fog.set(sample.agent / 7);
        const ev = tl.events.find((e) => e.key === 'preDischarge');
        const alarm = ev && t >= ev.t;
        b.strobe.material.emissiveIntensity = alarm ? (Math.sin(t * 12) > 0 ? 4 : 0) : 0;
      }
      if (b.fires) {
        const per = sample.hrr / b.fires.length;
        b.fires.forEach((f) => f.set(per, Math.min(1, sample.hrr / 20000)));
        const foamOn = sample.foam > 10;
        b.foamSpray.setHeads(foamOn ? b.pourers : [], foamOn ? 1 : 0);
        b.foamDisc.material.opacity = sample.coverage * 0.95;
        b.coolSpray.setHeads(sample.Qhose > 10 ? b.coolHeads : [], 1);
        const mon = tl.events.find((e) => e.key === 'monitorsOpen');
        const mOn = mon && t >= mon.t && sample.Qhose > 10;
        b.monitorSpray.setHeads(mOn ? b.monitors.map((m) => m.position.clone().add(V(0, 3.3, 0))) : [], mOn ? 1 : 0);
      }
      if (fac.scene === 'hangar') {
        b.fire.set(sample.hrr, Math.min(1, sample.hrr / 8000));
        const on = sample.foam > 10;
        b.spray.setHeads(on ? b.sprkHeads : [], on ? 1 : 0);
        b.foamDisc.material.opacity = sample.coverage * 0.9;
        const det = tl.events.find((e) => e.key === 'flameDetected');
        b.det.forEach((d) => { d.material.emissiveIntensity = det && t >= det.t ? (Math.sin(t * 10) > 0 ? 3 : 0.3) : 0; });
        const mon = tl.events.find((e) => e.key === 'monitorsOpen');
        const mOn = mon && t >= mon.t && sample.foam > 10;
        b.monitorSpray.setHeads(mOn ? b.monitors.map((m) => m.position.clone().add(V(0, 1.6, 0))) : [], mOn ? 1 : 0);
      }
      const br = tl.events.find((e) => e.key === 'brigadeArrived' || e.key === 'monitorsOpen');
      brigadeT = br ? br.t : Infinity;
      b.trucks?.forEach((tt) => { tt.visible = t >= brigadeT; });
      const ps = `${sample.main > 0.05}|${sample.diesel > 0.05}|${sample.jockey > 0}`;
      if (ps !== pumpState) { pumpState = ps; setPumpVisual(b, sample); }
    },
    animate(dt) {
      b.comp?.fire?.update(dt); b.comp?.spray?.update(dt);
      b.fog?.update(dt); b.fire?.update(dt); b.spray?.update(dt);
      b.fires?.forEach((f) => f.update(dt));
      b.foamSpray?.update(dt); b.coolSpray?.update(dt); b.monitorSpray?.update(dt);
    },
  };
  return site;
}
