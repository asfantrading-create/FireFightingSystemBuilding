import { header } from './ui.js';

const m = {
  id: 'tools', icon: '📐',
  title: { en: 'Engineering Tools', ar: 'الأدوات الهندسية' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
