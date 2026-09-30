import { header } from './ui.js';

const m = {
  id: 'cause', icon: '🧩',
  title: { en: 'Cause & Effect Matrix', ar: 'مصفوفة السبب والنتيجة' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
