import { header } from './ui.js';

const m = {
  id: 'paths', icon: '🎓',
  title: { en: 'Learning Paths & Certificates', ar: 'المسارات التعليمية والشهادات' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
