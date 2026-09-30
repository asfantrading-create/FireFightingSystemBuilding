import { header } from './ui.js';

const m = {
  id: 'commission', icon: '✅',
  title: { en: 'Commissioning & Acceptance', ar: 'الاستلام والتشغيل' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
