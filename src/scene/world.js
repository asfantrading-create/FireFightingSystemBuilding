import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';

const texLoader = new THREE.TextureLoader();
const texCache = new Map();
/** Cached tiling texture from app/assets/tex (CC0 ambientCG). */
export function tileTex(name, repeat = 1, color = false) {
  const key = `${name}|${repeat}`;
  if (texCache.has(key)) return texCache.get(key);
  const t = texLoader.load(`assets/tex/${name}.jpg`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}
/** PBR material from an ambientCG set (Color / NormalGL / Roughness). */
export function pbr(set, repeat = 1, extra = {}) {
  const m = new THREE.MeshStandardMaterial({
    map: tileTex(`${set}_Color`, repeat, true), normalMap: tileTex(`${set}_NormalGL`, repeat),
    roughnessMap: tileTex(`${set}_Roughness`, repeat), roughness: 1, metalness: 0, ...extra,
  });
  m.userData.worldUV = true;
  return m;
}

/** Tileable procedural water normal map (for three's Water shader). */
function waterNormals() {
  const N = 256, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N);
  const h = (x, y) => {
    let v = 0;
    for (const [a, b, amp, ph] of [[1, 2, 1, 0.3], [3, 1, 0.6, 1.7], [2, 5, 0.35, 2.2], [7, 3, 0.2, 0.9], [5, 8, 0.12, 4.1], [11, 6, 0.08, 1.3]]) {
      v += amp * Math.sin(((a * x + b * y) / N) * Math.PI * 2 + ph);
    }
    return v;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
    const n = new THREE.Vector3(-dx * 2, -dy * 2, 1).normalize();
    const i = (y * N + x) * 4;
    img.data[i] = (n.x * 0.5 + 0.5) * 255; img.data[i + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
let _wn;

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
/** Terrain height function shared by the mesh and by object placement (buildings on hills). */
export function terrainHeight({ flat = 500, mountain = 350, seed = 1, sea = null } = {}) {
  return (x, z) => {
    const r = Math.hypot(x, z);
    const ridge = Math.max(0, (r - flat) / (flat * 1.5));
    const mask = Math.min(1, ridge * ridge);
    let n = fbm(x / 900 + seed * 13.1, z / 900 + seed * 7.7, 6);
    n = Math.pow(Math.max(0, n - 0.25) * 1.6, 1.6);
    let h = mask * n * mountain + (fbm(x / 60, z / 60, 3) - 0.5) * 0.5 * (1 - mask * 0.5);
    if (sea && sea(x, z)) h = Math.min(h, -2 - fbm(x / 200, z / 200) * 4);
    return h;
  };
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
    // Mouse: LEFT = move around the site (pan on the ground plane), RIGHT = rotate/orbit, WHEEL = zoom.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    this.controls.screenSpacePanning = false;
    this.controls.zoomToCursor = true;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 6000;
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    this.renderer.domElement.tabIndex = 0;
    this.keys = new Set();
    window.addEventListener('keydown', (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'r', 'f'].includes(k)) { this.keys.add(k); if (k.startsWith('arrow')) e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
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
    this.loadSky();

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

  /** Real photographed sky (CC0 HDRI): background + image-based lighting & reflections. */
  loadSky() {
    new RGBELoader().load('assets/sky_2k.hdr', (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      this.hdrEnv = this.pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      this.scene.environment = this.hdrEnv;
      this.scene.environmentIntensity = 0.85;
    }, undefined, () => { /* keep procedural sky */ });
    texLoader.load('assets/sky_8k.jpg', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.generateMipmaps = true;
      this.skyTex = t;
      // Sky dome: photographed sky above, fading into atmospheric haze at the horizon
      const mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: t }, haze: { value: new THREE.Color(0xc9d6e2) }, exposure: { value: 1.0 } },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
        fragmentShader: `uniform sampler2D map; uniform vec3 haze; uniform float exposure; varying vec3 vDir;
          #include <common>
          void main(){
            vec3 d = normalize(vDir);
            vec2 uv = vec2(atan(d.z, d.x) * RECIPROCAL_PI2 + 0.5, asin(clamp(d.y,-1.0,1.0)) * RECIPROCAL_PI + 0.5);
            vec3 c = texture2D(map, vec2(uv.x, max(uv.y, 0.505))).rgb * exposure;
            float h = smoothstep(0.0, 0.09, d.y);
            gl_FragColor = vec4(mix(haze, c, h), 1.0);
            #include <colorspace_fragment>
          }`,
        side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false,
      });
      this.skyDome?.removeFromParent();
      this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), mat);
      this.skyDome.frustumCulled = false;
      this.skyDome.renderOrder = -1;
      this.scene.add(this.skyDome);
      this.scene.background = new THREE.Color(0xc9d6e2);
      this.sky.visible = false;
    });
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
    this.scene.fog = new THREE.Fog(0xc9d6e2, radius * 2.5, 7800);
    // environment map from the sky for realistic reflections on glass & steel
    const envScene = new THREE.Scene();
    const sky2 = new Sky(); sky2.scale.setScalar(1000);
    Object.assign(sky2.material.uniforms.sunPosition.value, this.sun);
    for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sky2.material.uniforms[k].value = u[k].value;
    envScene.add(sky2);
    if (!this.hdrEnv) {
      if (this.envRT) this.envRT.dispose();
      this.envRT = this.pmrem.fromScene(envScene, 0.02);
      this.scene.environment = this.envRT.texture;
    }
    this.biome = b;
  }

  /** Terrain: flat pad around the site, fbm mountains beyond. */
  makeTerrain({ size = 16000, flat = 500, mountain = 350, seed = 1, sea = null, biome = 'desert' }) {
    const b = BIOMES[biome] ?? BIOMES.desert;
    size = Math.max(size, 16000);
    const seg = this.quality === 'high' ? 420 : 220;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const rock = new Float32Array(pos.count);
    const cl = [new THREE.Color(b.low), new THREE.Color(b.mid), new THREE.Color(b.high), new THREE.Color(b.peak)];
    const c = new THREE.Color();
    const hf = terrainHeight({ flat, mountain, seed, sea });
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = hf(x, z);
      pos.setY(i, h);
      const t = Math.min(1, Math.max(0, h / (mountain * 0.8)));
      const k = t * 3, idx = Math.min(2, Math.floor(k));
      c.copy(cl[idx]).lerp(cl[idx + 1], k - idx);
      const jitter = (fbm(x / 25, z / 25, 2) - 0.5) * 0.12;
      c.offsetHSL(0, 0, jitter);
      // vertex colour tints the photographic ground texture (kept near 1 so the texture shows)
      c.lerp(new THREE.Color(1, 1, 1), 0.55);
      colors.set([c.r * 1.08, c.g * 1.08, c.b * 1.08], i * 3);
      rock[i] = Math.min(1, Math.max(0, (h - mountain * 0.08) / (mountain * 0.25)));
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('rock', new THREE.BufferAttribute(rock, 1));
    g.computeVertexNormals();
    const rep = size / 14;
    const m = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 1, metalness: 0,
      map: tileTex('Ground054_Color', rep, true), normalMap: tileTex('Ground054_NormalGL', rep),
    });
    const rockMap = tileTex('Rock030_Color', size / 40, true);
    m.onBeforeCompile = (sh) => {
      sh.uniforms.rockMap = { value: rockMap };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float rock;\nvarying float vRock;\nvarying vec2 vWorldUv;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\nvRock = rock;\nvWorldUv = uv * ' + (size / 40).toFixed(1) + ';');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D rockMap;\nvarying float vRock;\nvarying vec2 vWorldUv;')
        .replace('#include <map_fragment>', `
          vec4 g0 = texture2D( map, vMapUv );
          vec4 g1 = texture2D( map, vMapUv * 0.137 );
          vec4 gr = mix( g0, g1, 0.45 );
          vec4 rk = texture2D( rockMap, vWorldUv );
          diffuseColor *= mix( gr, rk, vRock );`);
    };
    const mesh = new THREE.Mesh(g, m);
    mesh.receiveShadow = true;
    return mesh;
  }

  /** Water: PBR surface reflecting the real sky (HDRI), animated ripples. geometry: optional ShapeGeometry. */
  makeWater(size, pos, color = 0x1f6f8b, geometry = null) {
    _wn ||= waterNormals();
    const g = geometry ?? new THREE.PlaneGeometry(size[0], size[1]);
    // world-scaled UVs so ripples have the same size everywhere
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 22, p.getY(i) / 22);
    const nm = _wn.clone(); nm.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({
      color, roughness: 0.06, metalness: 0.05, normalMap: nm, normalScale: new THREE.Vector2(0.35, 0.35),
      envMapIntensity: 1.35, transparent: true, opacity: 0.94,
    });
    const w = new THREE.Mesh(g, m);
    w.rotation.x = -Math.PI / 2;
    w.position.set(pos[0], pos[1] ?? -0.6, pos[2]);
    w.receiveShadow = true;
    w.userData.isWater = true;
    this.waters = this.waters || [];
    this.waters.push(w);
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
    this.waters = (this.waters || []).filter((w) => { let o = w; while (o.parent) o = o.parent; return o === site.root; });
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
    if (this.keys.size) this.walk(dt);
    this.controls.update();
    for (const h of this.frameHooks) h(dt);
    for (const w of this.waters || []) { const o = w.material.normalMap.offset; o.x += dt * 0.004; o.y += dt * 0.0025; }
    this.site?.animate?.(dt, this.camera);
    if (this.skyDome) { this.skyDome.position.copy(this.camera.position); this.skyDome.updateMatrixWorld(); }
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    this._declutterT = (this._declutterT || 0) + dt;
    if (this._declutterT > 0.1) { this._declutterT = 0; this.declutter(); }
  }

  /** Keyboard navigation: W/S forward-back, A/D strafe, Q/E turn, R/F up-down (speed scales with distance). */
  walk(dt) {
    const c = this.controls, cam = this.camera, k = this.keys;
    const dist = cam.position.distanceTo(c.target);
    const sp = Math.max(8, dist * 0.8) * dt;
    const fwd = new THREE.Vector3().subVectors(c.target, cam.position).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    const mv = new THREE.Vector3();
    if (k.has('w') || k.has('arrowup')) mv.add(fwd);
    if (k.has('s') || k.has('arrowdown')) mv.sub(fwd);
    if (k.has('d')) mv.add(right);
    if (k.has('a')) mv.sub(right);
    if (k.has('r')) mv.y += 1;
    if (k.has('f')) mv.y -= 1;
    if (mv.lengthSq()) { mv.normalize().multiplyScalar(sp); cam.position.add(mv); c.target.add(mv); this.anim = null; }
    const turn = (k.has('q') || k.has('arrowleft') ? 1 : 0) - (k.has('e') || k.has('arrowright') ? 1 : 0);
    if (turn) {
      const off = new THREE.Vector3().subVectors(cam.position, c.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn * dt * 0.9);
      cam.position.copy(c.target).add(off); this.anim = null;
    }
  }

  /**
   * Stable label de-overlap: labels keep a fixed priority order, positions come from projecting the
   * 3D anchors (not from the DOM, so offsets never feed back), and offsets are applied with a
   * transform on the inner element. Recomputed only when the camera moves.
   */
  declutter() {
    const cam = this.camera;
    const key = cam.matrixWorld.elements.map((v) => v.toFixed(2)).join(',') + this.labels.length + this.container.clientWidth;
    if (key === this._dcKey) return;
    this._dcKey = key;
    const W = this.container.clientWidth, H = this.container.clientHeight;
    const v = new THREE.Vector3();
    const placed = [];
    for (const l of this.labels) {
      if (!l.obj.visible) continue;
      v.copy(l.obj.position).project(cam);
      if (v.z > 1) continue;
      l.w ||= l.el.offsetWidth; l.h ||= l.el.offsetHeight;
      const x = (v.x * 0.5 + 0.5) * W - l.w / 2, y0 = (-v.y * 0.5 + 0.5) * H - l.h / 2;
      let y = y0, guard = 0, moved = true;
      while (moved && guard++ < 25) {
        moved = false;
        for (const p of placed) {
          if (x < p.x + p.w + 4 && x + l.w + 4 > p.x && y < p.y + p.h + 3 && y + l.h + 3 > p.y) { y = p.y - l.h - 4; moved = true; }
        }
      }
      placed.push({ x, y, w: l.w, h: l.h });
      const off = Math.round(y - y0);
      if (off !== (l.off || 0)) { l.off = off; l.el.style.transform = off ? `translateY(${off}px)` : ''; }
    }
  }
}
