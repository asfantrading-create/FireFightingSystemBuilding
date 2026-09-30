import { header } from './ui.js';

const m = {
  id: 'tech', icon: '🔬',
  title: { en: 'Modern Detection & Suppression', ar: 'تقنيات الكشف والإطفاء الحديثة' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
