// Shared helpers for the Smart Systems Lab modules.
import { getLang, tr } from '../i18n.js';

export const $ = (id) => document.getElementById(id);
export const ar = () => getLang() === 'ar';
export const L = (en, a) => (ar() ? a : en);
export { tr };
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
export const mmss = (s) => { s = Math.max(0, Math.floor(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
export const pad3 = (n) => String(n).padStart(3, '0');
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Small persistent key/value store (localStorage, fails silently). */
export const store = {
  get(k, def = null) { try { const v = localStorage.getItem(`ftw.adv.${k}`); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem(`ftw.adv.${k}`, JSON.stringify(v)); } catch { /* ignore */ } },
};

/** Module progress (0-100 best score per module), shown in the navigation and used by the learning paths. */
export function progress() { return store.get('progress', {}); }
export function markDone(moduleId, score = 100) {
  const p = progress();
  p[moduleId] = Math.max(p[moduleId] ?? 0, Math.round(score));
  store.set('progress', p);
  const studentProgress = store.get('studentProgress', {});
  const me = (() => { try { return localStorage.getItem('ftw.student') || '—'; } catch { return '—'; } })();
  (studentProgress[me] ||= {})[moduleId] = Math.max(studentProgress[me][moduleId] ?? 0, Math.round(score));
  store.set('studentProgress', studentProgress);
}

export function download(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Print / save-as-PDF only the given HTML (certificates, commissioning records, riser diagrams). */
export async function printDoc(html, filename = 'document.pdf') {
  let area = document.getElementById('printArea');
  if (!area) { area = document.createElement('div'); area.id = 'printArea'; document.body.appendChild(area); }
  area.innerHTML = html;
  document.body.classList.add('printing');
  await new Promise((r) => setTimeout(r, 120));
  try {
    if (window.api?.savePdf) await window.api.savePdf(filename);
    else window.print();
  } finally {
    document.body.classList.remove('printing');
    area.innerHTML = '';
  }
}

/** Tabs inside a module. tabs = [{id, label}] ; returns the tab bar HTML. */
export const tabBar = (tabs, active, attr = 'data-tab') =>
  `<div class="adv-tabs">${tabs.map((t) => `<button ${attr}="${t.id}" class="${t.id === active ? 'active' : ''}">${t.label}</button>`).join('')}</div>`;

/** Standard module header. */
export const header = (m, extra = '') => `<div class="adv-head">
  <div class="adv-head-ic">${m.icon}</div>
  <div class="adv-head-tx"><h1>${esc(tr(m.title))}</h1><p>${esc(tr(m.sub))}</p>
  <div class="adv-refs">${(m.refs || []).map((r) => `<span>${esc(r)}</span>`).join('')}</div></div>${extra}</div>`;

/** Key-value / stat tile. */
export const stat = (label, value, unit = '', cls = '') => `<div class="adv-stat ${cls}"><div class="k">${label}</div><div class="v">${value}<small>${unit}</small></div></div>`;

/** Result banner with score. */
export const scoreBanner = (score, text) => `<div class="adv-score ${score >= 80 ? 'good' : score >= 50 ? 'mid' : 'bad'}"><div class="ring" style="--p:${score}"><span>${score}</span></div><div>${text}</div></div>`;

export const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
