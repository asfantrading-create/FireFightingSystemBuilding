import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Deterministic value noise for terrain
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct = 5) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return v;
}

const BIOMES = {
  desert: { low: 0xc9a979, mid: 0xa9805a, high: 0x7d5a40, peak: 0x5e4332, fog: 0xd9cdb8, sky: 2.2 },
  coast: { low: 0xc7aa80, mid: 0x9a6f4f, high: 0x734f38, peak: 0x553a2a, fog: 0xd6d0c4, sky: 2.0 },
  hills: { low: 0xb7a67c, mid: 0x7f8a55, high: 0x6c6448, peak: 0x55503f, fog: 0xd3dade, sky: 1.8 },
  city: { low: 0xcdb592, mid: 0xb39570, high: 0x8f7356, peak: 0x6f5842, fog: 0xd8d2c6, sky: 2.4 },
};

export class World {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.62;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'label-layer';
    container.appendChild(this.labelRenderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.5, 30000);
    this.camera.position.set(300, 200, 300);
    this.controls = new OrbitControls(this.camera, this.labelRenderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.autoRotateSpeed = 0.35;

    this.sky = new Sky();
    this.sky.scale.setScalar(20000);
    this.scene.add(this.sky);
    this.sun = new THREE.Vector3();
    this.hemi = new THREE.HemisphereLight(0xcfe0f2, 0x6d5f4a, 0.75);
    this.scene.add(this.hemi);
    this.dir = new THREE.DirectionalLight(0xfff0d8, 3.2);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(4096, 4096);
    this.dir.shadow.bias = -0.0004;
    this.dir.shadow.normalBias = 0.6;
    this.scene.add(this.dir, this.dir.target);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);

    this.site = null;
    this.labels = [];
    this.labelsVisible = true;
    this.quality = 'high';
    this.clock = new THREE.Clock();
    this.anim = null;
    this.onPick = null;
    this.frameHooks = [];

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this.resize();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setEnvironment({ biome = 'desert', sunElevation = 45, sunAzimuth = 200, radius = 600, shadowSize = 400 }) {
    const b = BIOMES[biome] ?? BIOMES.desert;
    const u = this.sky.material.uniforms;
    u.turbidity.value = b.sky; u.rayleigh.value = 0.9; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.82;
    const phi = THREE.MathUtils.degToRad(90 - sunElevation), theta = THREE.MathUtils.degToRad(sunAzimuth);
    this.sun.setFromSphericalCoords(1, phi, theta);
    u.sunPosition.value.copy(this.sun);
    this.dir.position.copy(this.sun).multiplyScalar(shadowSize * 2);
    this.dir.target.position.set(0, 0, 0);
    const sc = this.dir.shadow.camera;
    sc.left = -shadowSize; sc.right = shadowSize; sc.top = shadowSize; sc.bottom = -shadowSize;
    sc.near = 1; sc.far = shadowSize * 5;
    sc.updateProjectionMatrix();
    this.scene.fog = new THREE.Fog(b.fog, radius * 3, radius * 22);
    // environment map from the sky for realistic reflections on glass & steel
    const envScene = new THREE.Scene();
    const sky2 = new Sky(); sky2.scale.setScalar(1000);
    Object.assign(sky2.material.uniforms.sunPosition.value, this.sun);
    for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sky2.material.uniforms[k].value = u[k].value;
    envScene.add(sky2);
    if (this.envRT) this.envRT.dispose();
    this.envRT = this.pmrem.fromScene(envScene, 0.02);
    this.scene.environment = this.envRT.texture;
    this.biome = b;
  }

  /** Terrain: flat pad around the site, fbm mountains beyond. */
  makeTerrain({ size = 9000, flat = 500, mountain = 350, seed = 1, sea = null, biome = 'desert' }) {
    const b = BIOMES[biome] ?? BIOMES.desert;
    const seg = this.quality === 'high' ? 360 : 180;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cl = [new THREE.Color(b.low), new THREE.Color(b.mid), new THREE.Color(b.high), new THREE.Color(b.peak)];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      let h = 0;
      const ridge = Math.max(0, (r - flat) / (flat * 1.5));
      const mask = Math.min(1, ridge * ridge);
      let n = fbm(x / 900 + seed * 13.1, z / 900 + seed * 7.7, 6);
      n = Math.pow(Math.max(0, n - 0.25) * 1.6, 1.6);
      h = mask * n * mountain + fbm(x / 60, z / 60, 3) * 1.2 * (1 - mask * 0.5);
      if (sea && sea(x, z)) h = Math.min(h, -2 - fbm(x / 200, z / 200) * 4);
      pos.setY(i, h);
      const t = Math.min(1, Math.max(0, h / (mountain * 0.8)));
      const k = t * 3, idx = Math.min(2, Math.floor(k));
      c.copy(cl[idx]).lerp(cl[idx + 1], k - idx);
      const jitter = (fbm(x / 25, z / 25, 2) - 0.5) * 0.12;
      c.offsetHSL(0, 0, jitter);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
    const mesh = new THREE.Mesh(g, m);
    mesh.receiveShadow = true;
    return mesh;
  }

  makeWater(size, pos, color = 0x2f6f8f) {
    const g = new THREE.PlaneGeometry(size[0], size[1]);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.93 });
    const w = new THREE.Mesh(g, m);
    w.position.set(pos[0], pos[1] ?? -0.6, pos[2]);
    w.receiveShadow = true;
    return w;
  }

  setSite(site) {
    if (this.site) {
      this.scene.remove(this.site.root);
      this.site.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); });
      });
      for (const l of this.labels) l.obj.removeFromParent();
    }
    this.labels = [];
    this.site = site;
    this.scene.add(site.root);
    this.goOverview(true);
  }

  addLabel(id, title, anchor, onClick) {
    const wrap = document.createElement('div');
    wrap.className = 'tw-anchor';
    const el = document.createElement('div');
    el.className = 'tw-label';
    el.innerHTML = `<span class="dot"></span><div><div class="lt"></div><div class="lv"></div></div>`;
    el.querySelector('.lt').textContent = title;
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); onClick?.(id); });
    wrap.appendChild(el);
    const obj = new CSS2DObject(wrap);
    obj.position.copy(anchor);
    this.scene.add(obj);
    obj.visible = this.labelsVisible;
    const rec = { id, el, obj };
    this.labels.push(rec);
    return rec;
  }

  setLabelsVisible(v) {
    this.labelsVisible = v;
    for (const l of this.labels) l.obj.visible = v;
  }

  flyTo(pos, target, dur = 1.6) {
    this.anim = {
      t: 0, dur,
      p0: this.camera.position.clone(), p1: new THREE.Vector3(...pos),
      q0: this.controls.target.clone(), q1: new THREE.Vector3(...target),
    };
  }

  goOverview(instant = false) {
    const ov = this.site?.overview;
    if (!ov) return;
    this.site.setXray?.(false);
    if (instant) {
      this.camera.position.set(...ov.pos); this.controls.target.set(...ov.target); this.anim = null;
    } else this.flyTo(ov.pos, ov.target);
  }

  focus(id) {
    const f = this.site?.focus?.[id];
    // "X-ray" the building skin when looking at components inside it
    this.site?.setXray?.(!!this.site.xrayFor?.includes(id));
    if (f) this.flyTo(f.pos, f.target);
  }

  setQuality(q) {
    this.quality = q;
    this.renderer.setPixelRatio(q === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    this.renderer.shadowMap.enabled = q === 'high';
    this.dir.castShadow = q === 'high';
    this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    this.resize();
  }

  screenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  frame() {
    const dt = Math.min(0.1, this.clock.getDelta());
    if (this.anim) {
      const a = this.anim;
      a.t += dt / a.dur;
      const k = a.t >= 1 ? 1 : 1 - Math.pow(1 - a.t, 3);
      this.camera.position.lerpVectors(a.p0, a.p1, k);
      this.controls.target.lerpVectors(a.q0, a.q1, k);
      if (a.t >= 1) this.anim = null;
    }
    this.controls.update();
    for (const h of this.frameHooks) h(dt);
    this.site?.animate?.(dt, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    this._declutterT = (this._declutterT || 0) + dt;
    if (this._declutterT > 0.25) { this._declutterT = 0; this.declutter(); }
  }

  /** Greedy vertical de-overlap of the component labels (keeps them readable when anchors cluster). */
  declutter() {
    const items = this.labels.filter((l) => l.obj.visible && l.obj.element.style.display !== 'none').map((l) => {
      const r = l.el.getBoundingClientRect();
      const off = l.off || 0;
      return { l, x: r.left, y: r.top - off, w: r.width, h: r.height };
    }).sort((a, b) => b.y - a.y);
    const placed = [];
    for (const it of items) {
      let y = it.y;
      let moved = true, guard = 0;
      while (moved && guard++ < 20) {
        moved = false;
        for (const p of placed) {
          if (it.x < p.x + p.w + 4 && it.x + it.w + 4 > p.x && y < p.y + p.h + 3 && y + it.h + 3 > p.y) { y = p.y - it.h - 4; moved = true; }
        }
      }
      placed.push({ x: it.x, y, w: it.w, h: it.h });
      const off = y - it.y;
      if (Math.abs(off - (it.l.off || 0)) > 0.5) { it.l.off = off; it.l.el.style.marginTop = `${off}px`; }
    }
  }
}
