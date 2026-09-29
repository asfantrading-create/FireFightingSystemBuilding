// Detailed fire-protection equipment models for the training scenes.
// Every interactive part is a Group with userData.pick = '<component id>'.
import * as THREE from 'three';
import { M, V, box, cyl, pipe, cloneMat, label3D } from '../scene/kit.js';
import { pbr } from '../scene/world.js';
import { roomFitOut } from './env.js';

export const MAT = {
  red: M.fireRed, steel: M.steel, dark: M.darkSteel, galv: M.galv, yellow: M.yellow, white: M.white,
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a23b, metalness: 0.9, roughness: 0.3 }),
  green: new THREE.MeshStandardMaterial({ color: 0x2e7d4f, metalness: 0.3, roughness: 0.5 }),
  blueMotor: new THREE.MeshStandardMaterial({ color: 0x2f5d8c, metalness: 0.4, roughness: 0.45 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xbfe3f5, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  water: new THREE.MeshStandardMaterial({ color: 0x3aa0d8, transparent: true, opacity: 0.75, roughness: 0.1 }),
};

export function tag(obj, id) { obj.userData.pick = id; return obj; }

/** Room shell: textured floor, two full back walls (cut-away view) and a realistic fit-out. */
export function room(w, d, h = 5, { walls = 'back' } = {}) {
  const g = new THREE.Group();
  const floor = box(w, 0.3, d, pbr('Concrete034', 1, { color: 0xc9c6bf }), 0, -0.3, 0);
  g.add(floor);
  const wm = pbr('Concrete034', 1, { color: 0xf3f0ea });
  g.add(box(w, h, 0.25, wm, 0, 0, -d / 2));
  g.add(box(0.25, h, d, wm, -w / 2, 0, 0));
  // low cut-away walls on the viewer's sides so the room reads as a building section
  const low = walls === 'all' ? 1.0 : 0.45;
  g.add(box(w, low, 0.25, wm, 0, 0, d / 2)); g.add(box(0.25, low, d, wm, w / 2, 0, 0));
  roomFitOut(g, w, d, h);
  return g;
}

/** Pressure gauge with a live dial (CanvasTexture). gauge.set(value) redraws. */
export function gauge(max = 16, unit = 'bar', label = '') {
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), new THREE.MeshBasicMaterial({ map: tex }));
  face.position.z = 0.031;
  g.add(face);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 32), MAT.steel);
  body.rotation.x = Math.PI / 2; g.add(body);
  g.add(cyl(0.015, 0.14, MAT.brass, 0, -0.26, 0, 8));
  let last = null;
  g.set = (v) => {
    const vv = Math.round(v * 20) / 20;
    if (vv === last) return; last = vv;
    const c = cv.getContext('2d');
    c.fillStyle = '#fbfbf8'; c.beginPath(); c.arc(128, 128, 126, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#222'; c.lineWidth = 3;
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      c.beginPath(); c.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); c.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118); c.stroke();
      c.fillStyle = '#222'; c.font = 'bold 18px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(Math.round((max * i) / 10)), 128 + Math.cos(a) * 82, 128 + Math.sin(a) * 82);
    }
    c.font = 'bold 20px Arial'; c.fillText(unit, 128, 170);
    if (label) { c.font = '15px Arial'; c.fillText(label, 128, 196); }
    const a = Math.PI * 0.75 + Math.min(1.02, Math.max(0, v / max)) * Math.PI * 1.5;
    c.strokeStyle = '#c00'; c.lineWidth = 6; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(a) * 105, 128 + Math.sin(a) * 105); c.stroke();
    c.fillStyle = '#333'; c.beginPath(); c.arc(128, 128, 10, 0, Math.PI * 2); c.fill();
    tex.needsUpdate = true;
  };
  g.set(0);
  return g;
}

/** OS&Y gate valve: handwheel on a rising stem. valve.setOpen(0..1) moves the stem. */
export function osyValve(r = 0.12) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(r * 1.6, 20, 14), MAT.red); body.scale.set(1, 1.1, 0.8); g.add(body);
  g.add(cyl(r * 1.9, 0.05, MAT.red, 0, -r * 1.2, 0, 20).rotateX(Math.PI / 2));
  const bonnet = cyl(r * 0.5, r * 3.2, MAT.red, 0, r * 1.2, 0, 12); g.add(bonnet);
  const yoke = box(r * 1.6, 0.04, 0.04, MAT.red, 0, r * 4.4, 0); g.add(yoke);
  for (const x of [-r * 0.8, r * 0.8]) g.add(box(0.035, r * 2, 0.035, MAT.red, x, r * 2.4, 0));
  const stem = cyl(0.018, r * 5, MAT.brass, 0, r * 2.2, 0, 8); g.add(stem);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(r * 1.9, 0.02, 8, 32), MAT.red); wheel.rotation.x = Math.PI / 2; wheel.position.y = r * 4.6; g.add(wheel);
  for (let i = 0; i < 4; i++) { const s = box(r * 3.8, 0.02, 0.02, MAT.red, 0, r * 4.6 - 0.01, 0); s.rotation.y = (i * Math.PI) / 4; g.add(s); }
  // tamper switch (supervisory)
  const tamper = box(0.07, 0.09, 0.06, MAT.yellow, r * 1.1, r * 3.9, 0.04); g.add(tamper);
  g.userData.parts = { stem, wheel, tamper };
  g.setOpen = (f) => { stem.position.y = r * 2.2 + f * r * 2.2; wheel.rotation.z = f * 12; };
  g.setOpen(1);
  return g;
}

export function butterflyValve(r = 0.1) {
  const g = new THREE.Group();
  g.add(cyl(r * 1.4, 0.08, MAT.red, 0, 0, 0, 20).rotateX(Math.PI / 2));
  g.add(box(0.12, 0.16, 0.1, MAT.red, 0, r * 1.4, 0));
  const handle = box(0.28, 0.02, 0.04, MAT.dark, 0.1, r * 1.4 + 0.16, 0); g.add(handle);
  g.add(box(0.06, 0.07, 0.05, MAT.yellow, -0.08, r * 1.4 + 0.08, 0.06));
  g.setOpen = (f) => { handle.rotation.y = (1 - f) * Math.PI / 2; };
  return g;
}

export function checkValve(r = 0.1) {
  const g = new THREE.Group();
  const b = cyl(r * 1.3, r * 3.2, MAT.red, 0, 0, 0, 16); b.rotation.z = Math.PI / 2; b.position.set(0, 0, 0); g.add(b);
  g.add(box(r * 1.6, r * 0.9, r * 1.4, MAT.red, 0, r * 0.9, 0));
  g.add(label3D('CHECK →', { size: 0.05, bg: 'rgba(255,255,255,0.9)', color: '#b00' }).translateY(r * 1.4 + 0.02).translateZ(r * 0.72));
  return g;
}

/** Controller cabinet with RUN / POWER lamps and START/STOP buttons. ctl.lamp(name, on). */
export function controller(title, color = MAT.red) {
  const g = new THREE.Group();
  g.add(box(0.8, 1.7, 0.4, color, 0, 0.25, 0));
  g.add(box(0.8, 0.25, 0.4, MAT.dark, 0, 0, 0));
  const lamps = {};
  const mk = (name, col, x) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.05 }));
    m.position.set(x, 1.55, 0.21); g.add(m); lamps[name] = m;
  };
  mk('power', 0x22c55e, -0.22); mk('run', 0xf59e0b, 0); mk('alarm', 0xef4444, 0.22);
  const start = cyl(0.04, 0.03, new THREE.MeshStandardMaterial({ color: 0x16a34a }), -0.12, 1.25, 0.21, 16); start.rotation.x = Math.PI / 2; g.add(start);
  const stop = cyl(0.04, 0.03, new THREE.MeshStandardMaterial({ color: 0xdc2626 }), 0.12, 1.25, 0.21, 16); stop.rotation.x = Math.PI / 2; g.add(stop);
  g.add(label3D(title, { size: 0.08, bg: 'rgba(20,20,20,0.9)' }).translateY(1.85).translateZ(0.205));
  g.lamp = (name, on) => { lamps[name].material.emissiveIntensity = on ? 3 : 0.05; };
  return g;
}

/** Horizontal split-case pump + electric motor, end-suction option, jockey (vertical multistage). */
export function firePump(kind = 'split') {
  const g = new THREE.Group();
  g.add(box(3.2, 0.25, 1.1, MAT.dark, 0, 0, 0));
  if (kind === 'jockey') {
    g.children[0].scale.set(0.3, 1, 0.6);
    g.add(cyl(0.17, 0.9, MAT.red, 0, 0.25, 0, 20));
    g.add(cyl(0.2, 0.55, MAT.blueMotor, 0, 1.15, 0, 20));
    g.add(cyl(0.06, 0.3, MAT.red, 0, 0.35, 0.25, 12).rotateX(Math.PI / 2));
    return g;
  }
  // split-case volute
  const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.7, 28), MAT.red);
  volute.rotation.x = Math.PI / 2; volute.position.set(-0.8, 0.85, 0); g.add(volute);
  g.add(box(1.2, 0.08, 0.9, MAT.red, -0.8, 0.85, 0));
  g.add(cyl(0.2, 0.6, MAT.red, -0.8, 0.2, 0.55, 16).rotateX(Math.PI / 2));
  const coupling = cyl(0.14, 0.3, MAT.yellow, 0, 0, 0, 16); coupling.rotation.z = Math.PI / 2; coupling.position.set(-0.1, 0.85, 0); g.add(coupling);
  if (kind === 'diesel') {
    g.add(box(1.6, 1.1, 0.95, MAT.yellow, 0.9, 0.25, 0));
    g.add(box(0.5, 0.35, 0.9, MAT.dark, 0.9, 1.35, 0));
    g.add(box(0.25, 1.1, 1.0, MAT.dark, 1.85, 0.25, 0));
    g.add(cyl(0.09, 2.8, MAT.dark, 1.2, 1.35, -0.3, 12));
  } else {
    const motor = cyl(0.48, 1.4, MAT.blueMotor, 0, 0, 0, 24); motor.rotation.z = Math.PI / 2; motor.position.set(0.85, 0.85, 0); g.add(motor);
    for (let i = 0; i < 8; i++) g.add(box(1.3, 0.02, 0.04, MAT.dark, 0.85, 0.85 + Math.sin((i / 8) * Math.PI * 2) * 0.49, Math.cos((i / 8) * Math.PI * 2) * 0.49));
  }
  return g;
}

export function flowMeter() {
  const g = new THREE.Group();
  const b = cyl(0.16, 0.5, MAT.dark, 0, 0, 0, 16); b.rotation.z = Math.PI / 2; g.add(b);
  g.add(box(0.28, 0.2, 0.14, MAT.blueMotor, 0, 0.22, 0));
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.09), new THREE.MeshBasicMaterial({ map: tex }));
  disp.position.set(0, 0.22, 0.071); g.add(disp);
  let last = null;
  g.set = (txt) => {
    if (txt === last) return; last = txt;
    const c = cv.getContext('2d'); c.fillStyle = '#0b2e13'; c.fillRect(0, 0, 256, 96);
    c.fillStyle = '#7CFF8F'; c.font = 'bold 44px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 128, 50);
    tex.needsUpdate = true;
  };
  g.set('0');
  return g;
}

/** Simple particle stream (water / agent) from p0 along direction with gravity. */
export class Stream {
  constructor(parent, { n = 300, color = 0x9fd0ff, size = 0.08 } = {}) {
    this.n = n; this.pos = new Float32Array(n * 3); this.seed = Float32Array.from({ length: n * 3 }, Math.random);
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.pts = new THREE.Points(this.geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85, depthWrite: false }));
    this.pts.frustumCulled = false; parent.add(this.pts);
    this.t = 0; this.on = 0; this.o = V(0, 0, 0); this.dir = V(1, 0, 0); this.speed = 10; this.spread = 0.08;
  }
  set(on, o, dir, speed = 10, spread = 0.08) { this.on = on; if (o) this.o.copy(o); if (dir) this.dir.copy(dir).normalize(); this.speed = speed; this.spread = spread; }
  update(dt) {
    this.t += dt;
    for (let i = 0; i < this.n; i++) {
      if (this.on <= 0.01) { this.pos[i * 3 + 1] = -999; continue; }
      const k = (this.t * 0.9 + this.seed[i * 3]) % 1;
      const tt = k * 1.2;
      const sx = (this.seed[i * 3 + 1] - 0.5) * this.spread * this.speed, sz = (this.seed[i * 3 + 2] - 0.5) * this.spread * this.speed;
      this.pos[i * 3] = this.o.x + (this.dir.x * this.speed + sx) * tt;
      this.pos[i * 3 + 1] = this.o.y + (this.dir.y * this.speed) * tt - 4.9 * tt * tt;
      this.pos[i * 3 + 2] = this.o.z + (this.dir.z * this.speed + sz) * tt;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}

export { M, V, box, cyl, pipe, cloneMat, label3D };
