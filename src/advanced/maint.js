import { header } from './ui.js';

const m = {
  id: 'maint', icon: '📊',
  title: { en: 'Predictive Maintenance', ar: 'الصيانة التنبؤية' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
