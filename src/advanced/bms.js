import { header } from './ui.js';

const m = {
  id: 'bms', icon: '🏢',
  title: { en: 'BMS & Building Integration', ar: 'التكامل مع نظام إدارة المبنى' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
