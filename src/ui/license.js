// License UI. Verification happens in the Electron main process (electron/license.js);
// the renderer only displays the status and forwards activation keys.
import { t, tr, getLang } from '../i18n.js';
import { CATALOG, PACKAGE_NAMES } from '../data/packages.js';

let status = { state: 'trial', daysLeft: 14, plan: 'trial' };
const api = window.api ?? null;
const $ = (id) => document.getElementById(id);

export function licenseAllowsUse() { return status.state === 'licensed' || status.state === 'trial'; }
/** Facility included in the license (null list = all facilities). */
export const facilityAllowed = (id) => !Array.isArray(status.facilities) || status.facilities.includes(id);
const inList = (list, id) => !Array.isArray(list) || list.includes(id);
/** Hands-on 3D training scene included? (training:false = none). */
export const sceneAllowed = (id) => status.training !== false && inList(status.scenes, id);
export const trainingAllowed = () => status.training !== false && (!Array.isArray(status.scenes) || status.scenes.length > 0);
/** Smart Lab module included? */
export const labAllowed = (id) => inList(status.lab, id);
export const labAny = () => !Array.isArray(status.lab) || status.lab.length > 0;
/** Program page (dash, data, learn, quiz, class, reports) included? The 3D twin is always available. */
export const featureAllowed = (page) => !['dash', 'data', 'learn', 'quiz', 'class', 'reports'].includes(page) || inList(status.features, page);
export const isSupervisor = () => status.state === 'trial' || status.role === 'supervisor';
export const licenseStatus = () => status;

function renderBadge() {
  const b = $('licBadge');
  b.classList.remove('trial', 'expired');
  if (status.state === 'licensed') $('licText').textContent = `${t('licensed')} · ${planName(status.plan)}`;
  else if (status.state === 'trial') { b.classList.add('trial'); $('licText').textContent = `${t('trial')} · ${status.daysLeft} ${t('daysLeft')}`; }
  else { b.classList.add('expired'); $('licText').textContent = t('expired'); }
}

const planName = (p) => {
  const ar = getLang() === 'ar';
  if (p === 'annual' || p === 'yearly') return t('annual');
  if (p === 'monthly') return t('monthly');
  if (p === 'staff') return ar ? 'ترخيص موظفي الشركة' : 'Staff license';
  if (p === 'custom') return ar ? 'اشتراك' : 'Subscription';
  return t('trialPlan');
};

let onChange = null;
export function onLicenseChange(fn) { onChange = fn; }
export async function initLicense(cb) {
  if (api?.licenseStatus) status = await api.licenseStatus();
  renderBadge();
  cb?.(status);
  return status;
}

export function openLicenseModal(openModal, closeModal) {
  const ar = getLang() === 'ar';
  const exp = status.expires ? new Date(status.expires).toLocaleDateString(ar ? 'ar-JO' : 'en-GB') : '—';
  const blocked = !licenseAllowsUse();
  openModal(`
    <h2>🔑 ${t('license')}</h2>
    ${blocked ? `<p class="err">${status.reason === 'clock' ? (ar ? 'تم اكتشاف تغيير في ساعة النظام.' : 'System clock rollback detected.') : ''} ${t('licExpiredMsg')}</p>` : ''}
    <div class="kv">
      <div>${t('plan')}</div><div><b>${planName(status.plan)}</b></div>
      <div>${t('licensedTo')}</div><div>${status.name ? `${esc(status.name)}${status.org ? ' — ' + esc(status.org) : ''}` : '—'}</div>
      <div>${t('expires')}</div><div>${exp}${status.daysLeft !== undefined ? ` (${status.daysLeft} ${t('daysLeft')})` : ''}</div>
      <div>${ar ? 'المقاعد' : 'Seats'}</div><div>${status.seats ?? 1}</div>
      <div>${ar ? 'الباقة' : 'Package'}</div><div><b>${esc(tr(PACKAGE_NAMES[status.package || 'full'] || PACKAGE_NAMES.custom))}</b></div>
      ${contentRows(ar)}
      <div>${ar ? 'الدور' : 'Role'}</div><div>${status.role === 'supervisor' ? (ar ? 'مشرف (مدرّس)' : 'Supervisor (teacher)') : status.state === 'trial' ? '—' : (ar ? 'مستخدم' : 'User')}${status.training === false ? (ar ? ' · بدون المشاهد التدريبية' : ' · no training scenes') : ''}</div>
      <div>${t('machineId')}</div><div class="mono">${esc(status.machineId ?? '—')} <button class="btn" id="cpMid" style="padding:2px 8px">⧉</button></div>
    </div>
    <p class="muted" style="font-size:.9em">${ar
      ? 'للحصول على اشتراك شهري أو سنوي أرسل معرّف الجهاز إلى info@asfanco.com أو واتساب ‎+962 77 614 0404 ثم الصق مفتاح الترخيص هنا.'
      : 'To buy a monthly or annual subscription, send your Machine ID to info@asfanco.com or WhatsApp +962 77 614 0404, then paste the license key below.'}</p>
    <label class="muted">${t('licKey')}</label>
    <textarea class="lic" id="licKey" placeholder="FTW1-xxxxx.yyyyy"></textarea>
    <label class="btn" style="display:inline-block;margin:6px 0">📄 ${ar ? 'تحميل ملف ترخيص .lic' : 'Load a .lic license file'}<input type="file" id="licFile" accept=".lic,.txt" hidden /></label>
    <div id="licMsg" style="margin:8px 0"></div>
    <div><button class="btn primary" id="licAct">${t('activate')}</button>${blocked ? '' : `<button class="btn" id="licClose">${t('close')}</button>`}</div>`);
  $('cpMid').onclick = () => navigator.clipboard?.writeText(status.machineId ?? '');
  $('licFile').onchange = async (e) => { const f = e.target.files[0]; if (f) $('licKey').value = (await f.text()).trim(); };
  if (!blocked) $('licClose').onclick = closeModal;
  $('licAct').onclick = async () => {
    const key = $('licKey').value.trim();
    if (!api?.activateLicense) { $('licMsg').innerHTML = `<span class="err">Activation is available in the desktop app.</span>`; return; }
    const r = await api.activateLicense(key);
    if (r.ok) {
      status = r.status; renderBadge(); onChange?.(status);
      $('licMsg').innerHTML = `<b style="color:var(--ok)">✓ ${t('licensed')} – ${planName(status.plan)}</b>`;
      setTimeout(closeModal, 900);
    } else $('licMsg').innerHTML = `<span class="err">✗ ${esc(r.error)}</span>`;
  };
}

function contentRows(ar) {
  const groups = [['facilities', ar ? 'المنشآت' : 'Facilities', status.facilities], ['scenes', ar ? 'المشاهد التدريبية' : 'Training scenes', status.training === false ? [] : status.scenes],
    ['lab', ar ? 'المختبر الذكي' : 'Smart Lab', status.lab], ['features', ar ? 'الصفحات' : 'Pages', status.features]];
  return groups.map(([g, label, list]) => {
    const all = CATALOG[g];
    const v = !Array.isArray(list) ? `${ar ? 'الكل' : 'All'} (${all.length})`
      : list.length ? `${list.length}/${all.length}: ${all.filter(([id]) => list.includes(id)).map(([, n]) => esc(tr(n))).join('، ')}` : (ar ? 'غير مشمول' : 'Not included');
    return `<div>${label}</div><div style="font-size:.9em">${v}</div>`;
  }).join('');
}

function esc(s) { return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
