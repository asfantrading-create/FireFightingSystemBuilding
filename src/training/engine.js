// Training-scene engine: loads a scene into the 3D world, handles picking (click a component),
// explore mode (component encyclopedia), step-by-step procedures with scoring, live readouts
// and interactive controls. Scenes are plain objects (see ./scenes.js).
import * as THREE from 'three';
import { tr, getLang } from '../i18n.js';

const L = (en, ar) => (getLang() === 'ar' ? ar : en);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

export class Trainer {
  constructor(world, { panel, onExit, record }) {
    this.world = world; this.panel = panel; this.onExit = onExit; this.record = record;
    this.active = false;
    this.ray = new THREE.Raycaster();
    const el = world.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY, e.button]; });
    el.addEventListener('pointerup', (e) => {
      if (!this.active || !down) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
      if (moved < 5 && down[2] === 0) {
        const hit = this.pickAt(e);
        if (hit?.part) this.pick(hit.part, hit.point);
        else if (hit?.point && this.s?.onGround) this.s.onGround(hit.point, this.st, this.api);
      }
      down = null;
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.active) return;
      const now = performance.now();
      if (now - (this._mv || 0) < 60) return;
      this._mv = now;
      const hit = this.pickAt(e);
      this.hover(hit?.part || null);
      el.style.cursor = hit?.part ? 'pointer' : '';
    });
    world.frameHooks.push((dt) => this.frame(dt));
  }

  pickAt(e) {
    const r = this.world.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(p, this.world.camera);
    const hits = this.ray.intersectObject(this.s.root, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.pick && o !== this.s.root) o = o.parent;
      if (o?.userData.pick) return { part: o.userData.pick, point: h.point };
      if (h.object.userData.ground) return { part: null, point: h.point };
    }
    return hits.length ? { part: null, point: hits[0].point } : null;
  }

  hover(id) {
    if (id === this.hovered) return;
    this.hovered = id;
    if (this.box) { this.s.root.remove(this.box); this.box.geometry.dispose(); this.box = null; }
    const part = id && this.s.parts[id];
    if (part?.obj) { this.box = new THREE.BoxHelper(part.obj, 0xffd400); this.s.root.add(this.box); }
  }

  start(def) {
    this.def = def;
    const s = def.build();
    this.s = s;
    this.st = s.state || {};
    this.mode = 'explore';
    this.proc = null; this.step = 0; this.mistakes = 0; this.t0 = 0; this.log = [];
    this.selected = null;
    this.api = this.makeApi();
    this.world.setEnvironment(s.env || { biome: 'desert', sunElevation: 55, sunAzimuth: 210, radius: 40, shadowSize: 30 });
    const site = { root: s.root, overview: s.overview, focus: s.focus || {}, animate: (dt) => s.animate?.(dt), update() {} };
    this.world.setSite(site);
    for (const [id, p] of Object.entries(s.parts)) {
      if (!p.obj) continue;
      const bb = new THREE.Box3().setFromObject(p.obj);
      const a = p.anchor || new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.max.y + 0.25, (bb.min.z + bb.max.z) / 2);
      if (!site.focus[id]) {
        const size = bb.getSize(new THREE.Vector3()).length();
        const c = bb.getCenter(new THREE.Vector3());
        site.focus[id] = { pos: [c.x + size * 0.9 + 1.2, c.y + size * 0.6 + 0.8, c.z + size * 1.1 + 1.6], target: [c.x, c.y, c.z] };
      }
      this.world.addLabel(id, tr(p.name), a, (cid) => this.pick(cid));
    }
    this.active = true;
    this.render();
  }

  stop() {
    this.active = false;
    if (this.box) { this.s.root.remove(this.box); this.box = null; }
    this.world.renderer.domElement.style.cursor = '';
  }

  makeApi() {
    return {
      msg: (en, ar, level = 'info') => this.message(L(en, ar), level),
      focus: (id) => this.world.focus(id),
      mistake: (en, ar) => { this.mistakes++; this.message(`✗ ${L(en, ar)}`, 'bad'); },
      rerender: () => this.render(),
      lang: getLang,
    };
  }

  message(text, level = 'info') {
    this.log.unshift({ text, level, t: this.st.time ?? 0 });
    this.log = this.log.slice(0, 6);
    this.renderLog();
  }

  pick(id) {
    const part = this.s.parts[id];
    if (!part) return;
    this.selected = id;
    this.world.focus(id);
    // interactive behaviour (open a valve, press a button…) runs in both modes
    const stepObj = this.proc && this.proc.steps[this.step];
    if (this.mode === 'procedure' && stepObj) {
      if (stepObj.target === id) {
        part.onPick?.(this.st, this.api);
        stepObj.onDo?.(this.st, this.api);
        if (!stepObj.done) this.advance();
      } else if (stepObj.target || stepObj.strict) {
        if (!part.free) this.api.mistake(`Not now: ${tr(part.name)}. ${tr(stepObj.text)}`, `ليس الآن: ${tr(part.name)}. ${tr(stepObj.text)}`);
        part.onPick?.(this.st, this.api);
      } else part.onPick?.(this.st, this.api);
    } else part.onPick?.(this.st, this.api);
    this.renderInfo();
  }

  advance() {
    this.step++;
    if (this.step >= this.proc.steps.length) this.finish();
    this.render();
  }

  finish() {
    const n = this.proc.steps.length;
    const score = Math.max(0, Math.round(100 * (n / (n + this.mistakes))));
    const extra = this.proc.result?.(this.st) || null;
    this.done = { score, mistakes: this.mistakes, time: (this.st.time ?? 0) - this.t0, extra };
    this.record?.({ type: 'training', topic: `${this.def.id}/${this.proc.id}`, score: n, total: n + this.mistakes });
  }

  startProc(i) {
    this.mode = 'procedure';
    this.proc = this.s.procedures[i];
    this.step = 0; this.mistakes = 0; this.done = null; this.t0 = this.st.time ?? 0;
    this.s.reset?.(this.st, this.proc.id);
    this.proc.setup?.(this.st, this.api);
    this.log = [];
    this.render();
  }

  frame(dt) {
    if (!this.active) return;
    dt *= this.speed || 1;
    this.st.time = (this.st.time ?? 0) + dt;
    this.s.tick?.(dt, this.st, this.api);
    if (this.mode === 'procedure' && this.proc && !this.done) {
      const st = this.proc.steps[this.step];
      if (st?.done && st.done(this.st)) { st.onDo?.(this.st, this.api); this.advance(); }
    }
    this._ui = (this._ui || 0) + dt;
    if (this._ui > 0.2) { this._ui = 0; this.renderReadouts(); }
  }

  // ───────────────────────── panel UI
  render() {
    const d = this.def, s = this.s;
    const P = this.panel;
    const procs = s.procedures.map((p, i) => `<button class="btn ${this.proc === p && this.mode === 'procedure' ? 'primary' : ''}" data-proc="${i}">${esc(tr(p.title))}</button>`).join('');
    let body = '';
    if (this.mode === 'procedure' && this.proc) {
      if (this.done) {
        body = `<div class="tr-done"><div style="font-size:2.2em">${this.done.score >= 80 ? '🏆' : this.done.score >= 60 ? '👍' : '📘'}</div>
          <div class="stat">${this.done.score} %</div><div class="muted">${L('Mistakes', 'الأخطاء')}: ${this.done.mistakes} · ${L('Time', 'الوقت')}: ${Math.round(this.done.time)} s</div>
          ${this.done.extra ? `<div class="explain">${esc(this.done.extra)}</div>` : ''}
          <button class="btn" data-proc="${s.procedures.indexOf(this.proc)}">↺ ${L('Try again', 'حاول مرة أخرى')}</button></div>`;
      } else {
        body = `<ol class="tr-steps">${this.proc.steps.map((st, i) => `<li class="${i < this.step ? 'ok' : i === this.step ? 'cur' : ''}">${esc(tr(st.text))}
          ${i === this.step && st.button ? `<div class="tr-btns">${st.choices
            ? st.choices.map((c, k) => `<button class="btn" data-choice="${k}">${esc(tr(c.text))}</button>`).join('')
            : `<button class="btn primary" data-stepbtn="1">${esc(tr(st.button))}</button>`}</div>` : ''}</li>`).join('')}</ol>`;
      }
    } else {
      body = `<p class="muted">${L('Explore mode: click any component in the 3D view (or its label) to see what it is and how it works. Choose a procedure above to be tested step by step.',
        'وضع الاستكشاف: انقر على أي مكوّن في العرض ثلاثي الأبعاد (أو تسميته) لمعرفة وظيفته. اختر إجراءً من الأعلى ليتم اختبارك خطوة بخطوة.')}</p>`;
    }
    P.innerHTML = `<div class="tr-head"><div><div class="tr-title">${d.icon} ${esc(tr(d.title))}</div>
        <div class="muted" style="font-size:.85em">${esc(tr(d.summary))}</div></div>
        <button class="btn" id="trExit">✕ ${L('Exit', 'خروج')}</button></div>
      <div class="tr-speed">⏱ ${[1, 5, 10].map((v) => `<button class="btn ${((this.speed || 1) === v) ? 'primary' : ''}" data-speed="${v}">×${v}</button>`).join('')}</div>
      <div class="tr-modes"><button class="btn ${this.mode === 'explore' ? 'primary' : ''}" id="trExplore">🔍 ${L('Explore', 'استكشاف')}</button>${procs}</div>
      <div class="tr-body">${body}</div>
      <div id="trControls" class="tr-controls"></div>
      <h3>${L('LIVE VALUES', 'القيم الحية')}</h3><table class="tr-read" id="trRead"></table>
      <div id="trInfo" class="tr-info"></div>
      <div id="trLog" class="tr-log"></div>`;
    P.querySelector('#trExit').onclick = () => this.onExit();
    P.querySelectorAll('[data-speed]').forEach((b) => { b.onclick = () => { this.speed = +b.dataset.speed; this.render(); }; });
    P.querySelector('#trExplore').onclick = () => { this.mode = 'explore'; this.proc = null; this.done = null; this.render(); };
    P.querySelectorAll('[data-proc]').forEach((b) => { b.onclick = () => this.startProc(+b.dataset.proc); });
    P.querySelectorAll('[data-stepbtn]').forEach((b) => {
      b.onclick = () => {
        const st = this.proc.steps[this.step];
        if (st.done && !st.done(this.st)) { this.api.mistake(st.notYet?.en || 'Condition not met yet', st.notYet?.ar || 'الشرط لم يتحقق بعد'); return; }
        st.onDo?.(this.st, this.api); this.advance();
      };
    });
    P.querySelectorAll('[data-choice]').forEach((b) => {
      b.onclick = () => {
        const st = this.proc.steps[this.step];
        const c = st.choices[+b.dataset.choice];
        const ok = typeof c.correct === 'function' ? c.correct(this.st) : c.correct;
        const ex = st.explain || { en: 'Wrong answer', ar: 'إجابة خاطئة' };
        if (ok) { this.message(`✓ ${tr(ex)}`, 'good'); this.advance(); } else this.api.mistake(`Wrong answer. ${ex.en}`, `إجابة خاطئة. ${ex.ar}`);
      };
    });
    this.renderControls(); this.renderReadouts(); this.renderInfo(); this.renderLog();
  }

  renderControls() {
    const box = this.panel.querySelector('#trControls');
    if (!box) return;
    box.innerHTML = '';
    for (const c of this.s.controls || []) {
      const row = document.createElement('div');
      row.className = 'tr-ctl';
      if (c.type === 'slider') {
        row.innerHTML = `<label>${esc(tr(c.label))} <b class="mono"></b></label><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" />`;
        const inp = row.querySelector('input'), val = row.querySelector('b');
        inp.value = c.get(this.st); val.textContent = c.fmt ? c.fmt(+inp.value) : inp.value;
        inp.oninput = () => { c.set(this.st, +inp.value, this.api); val.textContent = c.fmt ? c.fmt(+inp.value) : inp.value; };
      } else if (c.type === 'toggle') {
        row.innerHTML = `<label class="tgl"><input type="checkbox" /> ${esc(tr(c.label))}</label>`;
        const inp = row.querySelector('input');
        inp.checked = !!c.get(this.st);
        inp.onchange = () => c.set(this.st, inp.checked, this.api);
      } else if (c.type === 'button') {
        row.innerHTML = `<button class="btn">${esc(tr(c.label))}</button>`;
        row.querySelector('button').onclick = () => c.run(this.st, this.api);
      }
      box.appendChild(row);
    }
  }

  renderReadouts() {
    const t = this.panel.querySelector('#trRead');
    if (!t || !this.s.readouts) return;
    t.innerHTML = this.s.readouts(this.st).map(([k, v, lvl]) => `<tr class="${lvl || ''}"><td>${esc(tr(k))}</td><td>${esc(v)}</td></tr>`).join('');
    if (this.s.chart) this.s.chart(this.panel, this.st);
  }

  renderInfo() {
    const box = this.panel.querySelector('#trInfo');
    if (!box) return;
    const p = this.selected && this.s.parts[this.selected];
    box.innerHTML = p ? `<h3>${L('COMPONENT', 'المكوّن')}</h3><div class="nm">${esc(tr(p.name))}</div><p>${esc(tr(p.info))}</p>` : '';
  }

  renderLog() {
    const box = this.panel.querySelector('#trLog');
    if (!box) return;
    box.innerHTML = this.log.map((l) => `<div class="al ${l.level === 'bad' ? 'alarm' : l.level === 'good' ? 'ok' : 'info'}">${esc(l.text)}</div>`).join('');
  }
}
