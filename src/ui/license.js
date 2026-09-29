// License UI. Verification happens in the Electron main process (electron/license.js);
// the renderer only displays the status and forwards activation keys.
import { t, getLang } from '../i18n.js';

let status = { state: 'trial', daysLeft: 14, plan: 'trial' };
const api = window.api ?? null;
const $ = (id) => document.getElementById(id);

export function licenseAllowsUse() { return status.state === 'licensed' || status.state === 'trial'; }
export const licenseStatus = () => status;

function renderBadge() {
  const b = $('licBadge');
  b.classList.remove('trial', 'expired');
  if (status.state === 'licensed') $('licText').textContent = `${t('licensed')} · ${planName(status.plan)}`;
  else if (status.state === 'trial') { b.classList.add('trial'); $('licText').textContent = `${t('trial')} · ${status.daysLeft} ${t('daysLeft')}`; }
  else { b.classList.add('expired'); $('licText').textContent = t('expired'); }
}

const planName = (p) => (p === 'annual' ? t('annual') : p === 'monthly' ? t('monthly') : t('trialPlan'));

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
      <div>${t('machineId')}</div><div class="mono">${esc(status.machineId ?? '—')} <button class="btn" id="cpMid" style="padding:2px 8px">⧉</button></div>
    </div>
    <p class="muted" style="font-size:.9em">${ar
      ? 'للحصول على اشتراك شهري أو سنوي أرسل معرّف الجهاز إلى info@asfanco.com أو واتساب ‎+962 77 614 0404 ثم الصق مفتاح الترخيص هنا.'
      : 'To buy a monthly or annual subscription, send your Machine ID to info@asfanco.com or WhatsApp +962 77 614 0404, then paste the license key below.'}</p>
    <label class="muted">${t('licKey')}</label>
    <textarea class="lic" id="licKey" placeholder="FTW1.xxxxx.yyyyy"></textarea>
    <div id="licMsg" style="margin:8px 0"></div>
    <div><button class="btn primary" id="licAct">${t('activate')}</button>${blocked ? '' : `<button class="btn" id="licClose">${t('close')}</button>`}</div>`);
  $('cpMid').onclick = () => navigator.clipboard?.writeText(status.machineId ?? '');
  if (!blocked) $('licClose').onclick = closeModal;
  $('licAct').onclick = async () => {
    const key = $('licKey').value.trim();
    if (!api?.activateLicense) { $('licMsg').innerHTML = `<span class="err">Activation is available in the desktop app.</span>`; return; }
    const r = await api.activateLicense(key);
    if (r.ok) {
      status = r.status; renderBadge();
      $('licMsg').innerHTML = `<b style="color:var(--ok)">✓ ${t('licensed')} – ${planName(status.plan)}</b>`;
      setTimeout(closeModal, 900);
    } else $('licMsg').innerHTML = `<span class="err">✗ ${esc(r.error)}</span>`;
  };
}

function esc(s) { return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
