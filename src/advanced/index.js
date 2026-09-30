// Smart Systems Lab — advanced training for smart (addressable) fire-alarm & life-safety systems.
// One shared FireSystem engine drives every module so a fault planted in the panel lab shows up in
// the cause & effect run, the BMS graphics, the monitoring centre and the commissioning records.
import { FireSystem } from './system.js';
import { L, esc, tr, store, progress, header } from './ui.js';
import { labAllowed } from '../ui/license.js';
import facp from './facp.js';
import cause from './cause.js';
import bms from './bms.js';
import install from './install.js';
import commission from './commission.js';
import maint from './maint.js';
import incident from './incident.js';
import tech from './tech.js';
import tools from './tools.js';
import paths from './paths.js';

export const MODULES = [facp, cause, bms, install, commission, maint, incident, tech, tools, paths];

let sys = null;
let timer = null;
let cleanup = null;
let current = store.get('module', 'facp');
let host = null;
let appHelpers = {};

export function getSystem() {
  if (!sys) {
    sys = new FireSystem(store.get('project', null) || undefined);
    let saveT = null;
    sys.on((type) => {
      if (type !== 'change' && type !== 'reset') return;
      clearTimeout(saveT);
      saveT = setTimeout(() => store.set('project', sys.serialize()), 800);
    });
  }
  if (!timer) timer = setInterval(() => sys.step(0.2), 200);
  return sys;
}

export function resetProject() {
  store.set('project', null);
  sys.load(undefined);
  sys.emit('change');
}

const ctx = () => ({
  sys: getSystem(), helpers: appHelpers, go: (id) => open(id), resetProject,
  rerender: () => open(current),
});

function nav() {
  const p = progress();
  return `<nav class="adv-nav">
    <div class="adv-nav-head"><div class="adv-badge">ADVANCED</div><h2>${L('Smart Systems Lab', 'المختبر المتقدم للأنظمة الذكية')}</h2>
    <p>${L('Install, program, integrate, commission and maintain an addressable fire-alarm system.', 'ركّب وبرمج واربط واستلم وصِن نظام إنذار حريق معنون ذكي.')}</p></div>
    ${MODULES.map((m, i) => {
      const sc = p[m.id];
      return `<button class="adv-nav-item ${m.id === current ? 'active' : ''} ${labAllowed(m.id) ? '' : 'locked'}" data-mod="${m.id}">
        <span class="num">${i + 1}</span><span class="ic">${m.icon}</span>
        <span class="tx"><b>${esc(tr(m.title))}</b><small>${esc(tr(m.short || m.sub))}</small></span>
        ${!labAllowed(m.id) ? '<span class="lock">🔒</span>' : ''}${sc != null ? `<span class="done ${sc >= 80 ? 'ok' : ''}" title="${sc}%">${sc >= 80 ? '✓' : sc + '%'}</span>` : ''}
      </button>`;
    }).join('')}
  </nav>`;
}

function open(id) {
  if (!host) return;
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const m = MODULES.find((x) => x.id === id) || MODULES[0];
  current = m.id; store.set('module', m.id);
  host.innerHTML = `<div class="adv">${nav()}<section class="adv-main" id="advMain"></section></div>`;
  host.querySelectorAll('[data-mod]').forEach((b) => { b.onclick = () => open(b.dataset.mod); });
  const main = host.querySelector('#advMain');
  if (!labAllowed(m.id)) {
    main.innerHTML = header(m) + `<div class="locked-page"><div class="ic">🔒</div><h1>${esc(tr(m.title))}</h1>
      <p>${L('This Smart Lab module is not included in your current license package. Contact us to add it.', 'هذه الوحدة من المختبر الذكي غير مشمولة في باقة ترخيصك الحالية. تواصل معنا لإضافتها.')}</p>
      <p class="muted">info@asfanco.com · WhatsApp +962 77 614 0404</p><button class="btn primary" id="lockLic">🔑 ${L('View license / activate', 'عرض الترخيص / التفعيل')}</button></div>`;
    main.querySelector('#lockLic').onclick = () => appHelpers.openLicense?.();
    return;
  }
  try {
    cleanup = m.render(main, ctx()) || null;
  } catch (e) {
    console.error(e);
    main.innerHTML = header(m) + `<div class="card err">${esc(e.message)}</div>`;
  }
}

/** Entry point from the app shell. */
export function renderAdvanced(el, helpers) {
  host = el; appHelpers = helpers || {};
  getSystem();
  if (!labAllowed(current)) current = (MODULES.find((x) => labAllowed(x.id)) || MODULES[0]).id;
  open(current);
}
export function leaveAdvanced() {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
}
