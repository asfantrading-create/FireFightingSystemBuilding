// "New version available" banner + details dialog (the check itself runs in the main process).
import { getLang } from '../i18n.js';

const L = (en, ar) => (getLang() === 'ar' ? ar : en);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
let info = null;
let dismissed = false;
let modal = {};

function notes() {
  const n = info?.notes?.[getLang()] || info?.notes?.en || [];
  return (Array.isArray(n) ? n : [n]).filter(Boolean);
}

function download() {
  const url = info.url || info.page;
  if (window.api?.openDownload) window.api.openDownload(url); else window.open(url, '_blank');
}

function showDetails() {
  const { openModal, closeModal } = modal;
  openModal(`<h2>🚀 ${L('New version available', 'يتوفر إصدار جديد')} <span class="upd-v">${esc(info.version)}</span></h2>
    <p class="muted">${L('Installed version', 'الإصدار المثبّت')}: <b class="upd-v">${esc(info.current)}</b>${info.date ? ` · ${L('released', 'تاريخ الإصدار')} <span class="upd-v">${esc(info.date)}</span>` : ''}</p>
    ${info.mandatory ? `<p class="err">${L('This update is required — please install it to continue using the program.', 'هذا التحديث إلزامي — يرجى تثبيته لمتابعة استخدام البرنامج.')}</p>` : ''}
    ${notes().length ? `<h3 style="margin:12px 0 6px">${L("What's new", 'ما الجديد')}</h3><ul class="upd-notes">${notes().map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <div class="upd-how">${L('Download the new installer and run it — it installs over the old version. Your license, settings and results are kept.', 'نزّل ملف التثبيت الجديد وشغّله — يُثبَّت فوق النسخة القديمة، ويبقى ترخيصك وإعداداتك ونتائجك كما هي.')}</div>
    <div style="margin-top:14px"><button class="btn primary" id="updDl">⬇ ${L('Download update', 'تنزيل التحديث')}</button>${info.mandatory ? '' : `<button class="btn" id="updLater">${L('Later', 'لاحقاً')}</button>`}</div>`);
  document.getElementById('updDl').onclick = download;
  const later = document.getElementById('updLater');
  if (later) later.onclick = () => { closeModal(); };
}

function renderBanner() {
  let b = document.getElementById('updBanner');
  if (!info || (dismissed && !info.mandatory)) { b?.remove(); return; }
  if (!b) {
    b = document.createElement('div');
    b.id = 'updBanner';
    b.className = 'upd-banner';
    document.querySelector('.topbar').insertAdjacentElement('afterend', b);
  }
  b.innerHTML = `<span class="ic">🚀</span><span><b>${L('A new version is available', 'يتوفر إصدار جديد من البرنامج')}: <span class="upd-v">${esc(info.version)}</span></b>
    <span class="muted"> · ${L('you have', 'لديك')} <span class="upd-v">${esc(info.current)}</span></span>${notes()[0] ? `<span class="muted"> — ${esc(notes()[0])}</span>` : ''}</span>
    <span class="sp"></span><button class="btn sm" id="updMore">${L("What's new", 'ما الجديد')}</button><button class="btn sm primary" id="updGo">⬇ ${L('Download', 'تنزيل')}</button>
    ${info.mandatory ? '' : `<button class="upd-x" id="updX" title="${L('Later', 'لاحقاً')}">✕</button>`}`;
  b.querySelector('#updMore').onclick = showDetails;
  b.querySelector('#updGo').onclick = download;
  b.querySelector('#updX')?.addEventListener('click', () => { dismissed = true; renderBanner(); });
}

/** Wire the update notifications (Electron only). Call again after a language change to re-render. */
export function initUpdates(openModal, closeModal) {
  modal = { openModal, closeModal };
  if (!initUpdates.wired && window.api?.onUpdate) {
    initUpdates.wired = true;
    window.api.onUpdate((u) => {
      info = u; dismissed = false; renderBanner();
      if (u.mandatory) showDetails();
    });
  }
  renderBanner();
}
export const updateInfo = () => info;
