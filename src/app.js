import { World } from './scene/world.js';
import { buildSite } from './scene/sites.js';
import { FACILITIES, FAULTS, customFacility } from './data/facilities.js';
import { applyEdits, designWithEdits } from './engine/edits.js';
import { runScenario, sampleAt, scenarioSystem } from './engine/sim.js';
import { t, tr, setLang, getLang } from './i18n.js';
import { kpis, metricValue, componentDetails, mmss, fmt } from './ui/metrics.js';
import * as Pages from './ui/pages.js';
import { SCENES, Trainer } from './training/index.js';
import { renderAdvanced, leaveAdvanced } from './advanced/index.js';
import { initLicense, licenseAllowsUse, openLicenseModal, facilityAllowed, trainingAllowed, onLicenseChange } from './ui/license.js';

const $ = (id) => document.getElementById(id);
const api = window.api ?? null;
const SPEEDS = [1, 5, 10, 30, 60];

const state = {
  fac: null, scIdx: 0, sc: null, design: null, tl: null, time: 0, playing: false, speed: 10,
  faults: {}, edits: {}, refFac: null, selected: null, page: 'twin', challenge: null, customFac: null, labelRecs: {},
};

let world;
let lastUi = 0;

function ctx() {
  return { fac: state.fac, sc: state.sc, design: state.design, tl: state.tl, time: state.time, sample: sampleAt(state.tl, state.time), state };
}

// ───────────────────────── i18n & chrome
function applyI18n() {
  document.documentElement.lang = getLang();
  document.documentElement.dir = getLang() === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('active', b.dataset.lang === getLang()));
  $('refBadge').title = t('refDesignTip');
}

function buildFacMenu() {
  const m = $('facMenu');
  m.innerHTML = '';
  const mk = (cls, dot, name, sub, onClick) => {
    const d = document.createElement('div');
    d.className = `fac-item ${cls}`;
    d.innerHTML = `<span class="dot" style="background:${dot}"></span><span class="nm"></span><span class="sub"></span>`;
    d.querySelector('.nm').textContent = name; d.querySelector('.sub').textContent = sub;
    d.onclick = () => { m.classList.add('hidden'); onClick(); };
    m.appendChild(d);
  };
  mk('create', '#a855f7', `🛠 ${t('createManual')}`, t('yourDesign'), () => Pages.customFacilityForm(openModal, closeModal, (form) => {
    state.customFac = customFacility(form);
    loadFacility(state.customFac, 0);
  }));
  for (const f of FACILITIES) {
    const ok = facilityAllowed(f.id);
    mk(`${state.refFac?.id === f.id ? 'active' : ''} ${ok ? '' : 'locked'}`, f.color, `${ok ? '' : '🔒 '}${f.id}`, tr(f.type), () => (ok ? loadFacility(f, 0) : openLicenseModal(openModal, closeModal)));
  }
  if (!facilityAllowed('CUSTOM')) { const c = m.querySelector('.fac-item.create'); c.classList.add('locked'); c.onclick = () => { m.classList.add('hidden'); openLicenseModal(openModal, closeModal); }; }
}

/** After (re)activation: make sure the loaded facility is covered by the license. */
function enforceLicense() {
  const firstOk = FACILITIES.find((f) => facilityAllowed(f.id));
  if (state.refFac && !facilityAllowed(state.refFac.id) && firstOk) loadFacility(firstOk, 0);
  else buildFacMenu();
  if (state.page === 'train') renderTrainingPage();
}

// ───────────────────────── facility / scenario
const editKey = () => `${state.refFac.id}/${state.refFac.scenarios[state.scIdx].id}`;
function currentEdits() { return state.edits[editKey()] || {}; }
function saveEdits() { try { localStorage.setItem('ftw.edits', JSON.stringify(state.edits)); } catch { /* ignore */ } }

let trainer;
function startTraining(i) {
  if (!trainingAllowed()) { openLicenseModal(openModal, closeModal); return; }
  state.playing = false;
  setPage('twin');
  document.getElementById('page-twin').classList.add('training');
  state.training = true;
  trainer.start(SCENES[i]);
}
function startTrainingById(id) { const i = SCENES.findIndex((s) => s.id === id); if (i >= 0) startTraining(i); }
function exitTraining(reload = true) {
  if (!state.training) return;
  trainer.stop();
  state.training = false;
  document.getElementById('page-twin').classList.remove('training');
  if (reload) loadFacility(state.refFac, state.scIdx, true);
}

function renderTrainingPage() {
  const L = (en, ar) => (getLang() === 'ar' ? ar : en);
  const esc = (x) => String(x).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  $('trainInner').innerHTML = `<h1>${t('tabTrain')}</h1><p class="lead">${L('Interactive 3D training scenes based on the course videos: explore every component, then perform the procedure step by step on live physics. Results are saved to the Classroom.',
    'مشاهد تدريبية تفاعلية ثلاثية الأبعاد مبنية على فيديوهات الدورة: استكشف كل مكوّن ثم نفّذ الإجراء خطوة بخطوة على فيزياء حية. تُحفظ النتائج في الصف الدراسي.')}</p>
    <div class="train-grid">${SCENES.map((sc, i) => `<div class="card train-card"><div class="ic">${sc.icon}</div><h4>${esc(tr(sc.title))}</h4>
      <p class="muted" style="font-size:.9em">${esc(tr(sc.summary))}</p>
      <button class="btn primary" data-scene="${i}">${trainingAllowed() ? `▶ ${L('Start', 'ابدأ')}` : `🔒 ${L('Not included in your license', 'غير مشمول في ترخيصك')}`}</button>
      ${sc.video ? `<a class="vid" href="https://www.youtube.com/watch?v=${sc.video}" target="_blank" rel="noopener" style="margin-inline-start:8px">▶ ${L('Source video', 'الفيديو المصدر')}</a>` : ''}</div>`).join('')}</div>`;
  document.querySelectorAll('[data-scene]').forEach((b) => { b.onclick = () => startTraining(+b.dataset.scene); });
}

function loadFacility(fac, scIdx = 0, keepFaults = false) {
  if (state.training) exitTraining(false);
  state.refFac = fac; state.scIdx = scIdx;
  const eff = applyEdits(fac, fac.scenarios[scIdx], currentEdits());
  state.fac = eff.fac; state.sc = eff.sc;
  if (!keepFaults) state.faults = {};
  state.selected = null;
  $('facId').textContent = fac.id;
  $('facDot').style.background = fac.color;
  buildFacMenu();
  // scenario select
  const sel = $('scenSel');
  sel.innerHTML = '';
  fac.scenarios.forEach((s, i) => { const o = document.createElement('option'); o.value = i; o.textContent = tr(s.name); sel.appendChild(o); });
  sel.value = scIdx;
  renderFaults();
  simulate();
  const site = buildSite(fac, state.sc, state.design, world);
  world.setSite(site);
  // labels & chips
  state.labelRecs = {};
  for (const [id, name, key] of fac.components) {
    const a = site.anchors[id];
    if (!a) continue;
    state.labelRecs[id] = { ...world.addLabel(id, tr(name), a, (cid) => selectComponent(cid)), key };
  }
  renderChips();
  renderInfo();
  updateUi(true);
  Pages.onFacilityChanged(ctx());
}

function simulate() {
  state.design = designWithEdits(scenarioSystem(state.fac, state.sc), currentEdits());
  state.tl = runScenario(state.fac, state.sc, state.design, { ambient: state.fac.ambient, faults: state.faults });
  state.time = 0;
  state.playing = false;
  $('scrub').max = state.tl.duration;
  $('tStart').textContent = '00:00';
}

function rerun() {
  const tNow = state.time;
  simulate();
  state.time = Math.min(tNow, state.tl.duration);
  Pages.onFacilityChanged(ctx());
  updateUi(true);
}

function renderFaults() {
  const box = $('faultList');
  box.innerHTML = '';
  const kind = state.fac.system.kind;
  for (const f of FAULTS.filter((x) => x.kinds.includes(kind))) {
    const l = document.createElement('label');
    l.innerHTML = '<input type="checkbox" /> <span></span>';
    l.querySelector('span').textContent = tr(f.name);
    const cb = l.querySelector('input');
    cb.checked = !!state.faults[f.id];
    cb.onchange = () => { state.faults[f.id] = cb.checked; rerun(); };
    box.appendChild(l);
  }
  document.querySelector('.faults').classList.toggle('hidden', !!state.challenge);
  renderChallengeBox();
}

function renderChallengeBox() {
  let el = $('challengeBox');
  if (!state.challenge) { el?.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'challengeBox'; el.className = 'faults'; $('infoCard').appendChild(el); }
  const opts = FAULTS.filter((x) => x.kinds.includes(state.fac.system.kind));
  el.innerHTML = `<div style="margin-top:8px;font-weight:600">🕵️ ${getLang() === 'ar' ? 'تحدي التشخيص: ما العطل المخفي؟' : 'Troubleshooting challenge: which hidden fault?'}</div>
    <div style="display:flex;gap:6px;margin-top:6px"><select id="chSel" style="flex:1"></select><button class="btn primary" id="chGo">${t('submit')}</button></div>`;
  const s = el.querySelector('#chSel');
  for (const f of [{ id: 'none', name: { en: 'No fault – system healthy', ar: 'لا يوجد عطل – المنظومة سليمة' } }, ...opts]) {
    const o = document.createElement('option'); o.value = f.id; o.textContent = tr(f.name); s.appendChild(o);
  }
  el.querySelector('#chGo').onclick = () => {
    const ok = s.value === state.challenge.answer;
    const right = [{ id: 'none', name: { en: 'No fault', ar: 'لا يوجد عطل' } }, ...FAULTS].find((f) => f.id === state.challenge.answer);
    Pages.recordResult({ type: 'challenge', topic: `${state.fac.id}/${state.sc.id}`, score: ok ? 1 : 0, total: 1, detail: right.id });
    openModal(`<h2>${ok ? '✅' : '❌'} ${t('result')}</h2><p>${getLang() === 'ar' ? 'العطل الصحيح' : 'Correct answer'}: <b>${tr(right.name)}</b></p><button class="btn primary" id="mClose">${t('close')}</button>`);
    $('mClose').onclick = closeModal;
    state.challenge = null;
    renderFaults();
  };
}

function renderChips() {
  const chips = $('chips'), list = $('compList');
  chips.innerHTML = ''; list.innerHTML = '';
  const mk = (parent, id, name) => {
    const b = document.createElement('button');
    b.textContent = name; b.dataset.id = id;
    b.onclick = () => (id === '__overview' ? (world.goOverview(), selectComponent(null)) : selectComponent(id));
    parent.appendChild(b);
  };
  mk(chips, '__overview', t('overview'));
  for (const [id, name] of state.fac.components) {
    if (!world.site.anchors[id]) continue;
    mk(chips, id, tr(name)); mk(list, id, tr(name));
  }
}

function selectComponent(id) {
  state.selected = id;
  document.querySelectorAll('#chips button, #compList button').forEach((b) => b.classList.toggle('active', b.dataset.id === id));
  Object.entries(state.labelRecs).forEach(([k, r]) => r.el.classList.toggle('sel', k === id));
  if (id) world.focus(id);
  updateUi(true);
}

function renderInfo() {
  const f = state.fac;
  $('facName').textContent = tr(f.name);
  $('facSite').textContent = `${tr(f.site)} · ${f.lat.toFixed(3)}°, ${f.lon.toFixed(3)}° · ${tr(f.blurb)}`;
}

// ───────────────────────── live UI
function clockStr() {
  const [hh, mm] = state.fac.time.split(':').map(Number);
  const secs = hh * 3600 + mm * 60 + state.time;
  const h = Math.floor(secs / 3600) % 24, m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateUi(force = false) {
  const now = performance.now();
  if (!force && now - lastUi < 120) return;
  lastUi = now;
  const c = ctx();
  const s = c.sample;
  const f = state.fac;
  // info conditions
  $('facCond').innerHTML = `<span>📅 ${f.date} · ${clockStr()}</span><span>🌡 ${fmt(f.ambient, 1)} °C</span><span>💧 ${t('wetbulb')} ${f.humidity} %</span>
    <span>☀ ${f.sun}°</span><span>💨 ${fmt(f.wind, 1)} m/s</span><span class="st ${state.playing ? 'run' : ''}">${state.playing ? t('running') : t('paused')}</span>`;
  $('tNow').textContent = mmss(state.time);
  $('scrub').value = state.time;
  $('btnPlay').textContent = state.playing ? '❚❚' : '▶';
  // KPIs
  $('kpis').innerHTML = kpis(s, c).map((k) => `<div class="kpi ${k.c || ''}"><div class="k">${k.k}</div><div class="v">${k.v}<small>${k.u}</small></div></div>`).join('');
  // alarms & events
  const evs = state.tl.events.filter((e) => e.t <= state.time).slice(-40).reverse();
  const hasAlarm = evs.some((e) => e.level !== 'info');
  $('alarms').innerHTML = (hasAlarm ? '' : `<div class="al ok">✓ ${t('allNormal')}</div>`) +
    evs.map((e) => `<div class="al ${e.level}"><span class="b"></span><span class="tm">${mmss(e.t)}</span><span>${escapeHtml(t('e_' + e.key, e.params))}</span></div>`).join('');
  // banner
  const fireOn = s.hrr > 2;
  const alarmOn = evs.some((e) => e.level === 'alarm');
  const banner = $('alarmBanner');
  banner.classList.toggle('hidden', !(fireOn && alarmOn));
  if (fireOn && alarmOn) banner.textContent = `🔥 ${t('sFire')} · ${tr(state.sc.name)}`;
  // labels
  for (const [id, rec] of Object.entries(state.labelRecs)) {
    const v = metricValue(rec.key, s, c);
    rec.el.querySelector('.lv').textContent = v.v;
    rec.el.classList.toggle('warn', v.level === 'warn');
    rec.el.classList.toggle('alarm', v.level === 'alarm');
  }
  // selected component
  const sel = $('selComp');
  if (state.selected) {
    const comp = f.components.find((x) => x[0] === state.selected);
    const rows = componentDetails(state.selected, comp[2], s, c);
    sel.innerHTML = `<div class="nm">${escapeHtml(tr(comp[1]))}</div><table>${rows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`).join('')}</table>`;
  } else sel.innerHTML = `<span class="muted">${t('selectedHint')}</span>`;
  if (state.page !== 'twin') Pages.onTick(c);
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }

// ───────────────────────── modal
function openModal(html) { $('modalBox').innerHTML = html; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }

// ───────────────────────── wiring
function setPage(p) {
  if (!licenseAllowsUse() && p !== 'twin') { openLicenseModal(openModal, closeModal); return; }
  if (state.page === 'adv' && p !== 'adv') leaveAdvanced();
  state.page = p;
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.page === p));
  document.querySelectorAll('.page').forEach((s) => s.classList.toggle('active', s.id === `page-${p}`));
  if (p === 'train') renderTrainingPage();
  if (p === 'adv') {
    if (!trainingAllowed()) { $('advInner').innerHTML = `<div style="padding:40px"><h1>🔒 ${t('tabAdv')}</h1><p>${getLang() === 'ar' ? 'المختبر الذكي غير مشمول في ترخيصك.' : 'The Smart Lab is not included in your license.'}</p></div>`; }
    else renderAdvanced($('advInner'), { openModal, closeModal, startTraining, startTrainingById, recordResult: (r) => Pages.recordResult(r), setPage });
  }
  Pages.show(p, ctx(), { openModal, closeModal, goTwin, startChallenge, screenshot: () => world.screenshot(), getEdits: currentEdits, setEdits });
}

/** Replace the user's design edits for the current facility/scenario, rebuild and (optionally) run. */
function setEdits(edits, run = false) {
  const k = editKey();
  if (edits && Object.keys(edits).length) state.edits[k] = edits; else delete state.edits[k];
  saveEdits();
  loadFacility(state.refFac, state.scIdx, true);
  if (run) { setPage('twin'); world.site && selectComponent(state.fac.system.kind === 'sprinkler' ? 'floor' : null); state.time = 0; state.playing = true; }
  else Pages.show(state.page, ctx(), Pages.getHelpers());
}

function goTwin(facId, compId) {
  const f = FACILITIES.find((x) => x.id === facId);
  if (f && f !== state.refFac) loadFacility(f, 0);
  setPage('twin');
  if (compId) setTimeout(() => selectComponent(compId), 300);
}

function startChallenge(student) {
  const f = FACILITIES[Math.floor(Math.random() * FACILITIES.length)];
  const opts = ['none', ...FAULTS.filter((x) => x.kinds.includes(f.system.kind)).map((x) => x.id)];
  const answer = opts[Math.floor(Math.random() * opts.length)];
  state.challenge = { answer, student };
  const scIdx = Math.floor(Math.random() * f.scenarios.length);
  loadFacility(f, scIdx);
  state.faults = answer === 'none' ? {} : { [answer]: true };
  rerun();
  renderFaults();
  setPage('twin');
}

function wire() {
  $('facBtn').onclick = (e) => { e.stopPropagation(); $('facMenu').classList.toggle('hidden'); };
  document.addEventListener('click', (e) => { if (!$('facMenu').contains(e.target)) $('facMenu').classList.add('hidden'); });
  $('scenSel').onchange = () => loadFacility(state.refFac, +$('scenSel').value, true);
  document.querySelectorAll('.tabs button').forEach((b) => { b.onclick = () => setPage(b.dataset.page); });
  document.querySelectorAll('.lang button').forEach((b) => {
    b.onclick = () => {
      setLang(b.dataset.lang);
      try { localStorage.setItem('ftw.lang', b.dataset.lang); } catch { /* ignore */ }
      applyI18n(); loadFacility(state.refFac, state.scIdx, true); setPage(state.page); refreshToggles(); initLicense(() => {});
    };
  });
  let fs = 14;
  try { fs = +(localStorage.getItem('ftw.fs') || 14); } catch { /* ignore */ }
  const setFs = (v) => { fs = Math.max(11, Math.min(20, v)); document.documentElement.style.setProperty('--fs', fs + 'px'); try { localStorage.setItem('ftw.fs', fs); } catch { /* ignore */ } };
  setFs(fs);
  $('fontUp').onclick = () => setFs(fs + 1);
  $('fontDown').onclick = () => setFs(fs - 1);
  $('themeBtn').onclick = () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('themeBtn').textContent = dark ? '☀️' : '🌙';
    try { localStorage.setItem('ftw.theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
    Pages.onThemeChanged?.(ctx());
  };
  $('btnLabels').onclick = () => { world.setLabelsVisible(!world.labelsVisible); refreshToggles(); };
  $('btnQuality').onclick = () => { world.setQuality(world.quality === 'high' ? 'low' : 'high'); refreshToggles(); };
  $('btnOrbit').onclick = () => { world.controls.autoRotate = !world.controls.autoRotate; refreshToggles(); };
  $('btnShot').onclick = () => saveScreenshot();
  $('btnPlay').onclick = () => togglePlay();
  $('btnReset').onclick = () => { state.time = 0; state.playing = false; updateUi(true); };
  $('scrub').oninput = () => { state.time = +$('scrub').value; updateUi(true); };
  const sp = $('speeds');
  for (const v of SPEEDS) {
    const b = document.createElement('button');
    b.textContent = `${v}×`; b.dataset.v = v;
    b.onclick = () => { state.speed = v; sp.querySelectorAll('button').forEach((x) => x.classList.toggle('active', +x.dataset.v === v)); };
    if (v === state.speed) b.classList.add('active');
    sp.appendChild(b);
  }
  $('licBadge').onclick = () => openLicenseModal(openModal, closeModal);
  $('modal').addEventListener('pointerdown', (e) => { if (e.target === $('modal') && licenseAllowsUse()) closeModal(); });
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  });
  api?.onMenu?.((cmd) => {
    if (cmd === 'play') togglePlay();
    else if (cmd === 'reset') { state.time = 0; state.playing = false; updateUi(true); }
    else if (cmd === 'screenshot') saveScreenshot();
    else if (cmd === 'report') setPage('reports');
    else if (cmd === 'license') openLicenseModal(openModal, closeModal);
    else if (cmd === 'about') {
      openModal(`<h2>${t('appName')}</h2><p>v${api.version ?? '1.0.0'} · © 2026 ASFAN Trading</p><p class="muted">${t('refDesignTip')}</p><p>NFPA 13 · 14 · 20 · 25 · 72 · 2001 · 11 · 409</p><button class="btn primary" id="mClose">${t('close')}</button>`);
      $('mClose').onclick = closeModal;
    }
    else if (cmd.startsWith('page:')) setPage(cmd.slice(5));
  });
}

function togglePlay() {
  if (!licenseAllowsUse()) { openLicenseModal(openModal, closeModal); return; }
  if (state.time >= state.tl.duration - 0.5) state.time = 0;
  state.playing = !state.playing;
  updateUi(true);
}

async function saveScreenshot() {
  const url = world.screenshot();
  if (api?.saveImage) await api.saveImage(url, `${state.fac.id}_${mmss(state.time).replace(':', '-')}.png`);
  else { const a = document.createElement('a'); a.href = url; a.download = 'screenshot.png'; a.click(); }
}

function refreshToggles() {
  $('lblState').textContent = world.labelsVisible ? t('on') : t('off');
  $('qState').textContent = world.quality === 'high' ? t('high') : t('low');
  $('oState').textContent = world.controls.autoRotate ? t('on') : t('off');
}

async function main() {
  try {
    const l = localStorage.getItem('ftw.lang'); if (l) setLang(l);
    state.edits = JSON.parse(localStorage.getItem('ftw.edits') || '{}');
    const th = localStorage.getItem('ftw.theme'); if (th === 'dark') { document.documentElement.dataset.theme = 'dark'; $('themeBtn').textContent = '☀️'; }
  } catch { /* ignore */ }
  applyI18n();
  world = new World($('viewport'));
  world.frameHooks.push((dt) => {
    if (state.playing) {
      state.time = Math.min(state.tl.duration, state.time + dt * state.speed);
      if (state.time >= state.tl.duration) state.playing = false;
    }
    if (world.site) world.site.update(sampleAt(state.tl, state.time), state.tl, state.time);
    updateUi();
  });
  trainer = new Trainer(world, { panel: $('trainCard'), onExit: () => exitTraining(true), record: (r) => Pages.recordResult(r) });
  wire();
  refreshToggles();
  loadFacility(FACILITIES[0], 0);
  onLicenseChange(() => enforceLicense());
  await initLicense((st) => {
    if (!licenseAllowsUse()) openLicenseModal(openModal, closeModal);
    return st;
  });
  enforceLicense();
  window.__ftw = { state, world, startTraining, trainer: () => trainer, setPage, loadFacility: (i, s = 0) => loadFacility(FACILITIES[i], s), selectComponent, togglePlay, rerun };
}

main();
