import { header } from './ui.js';

const m = {
  id: 'incident', icon: '🚨',
  title: { en: 'Incident Commander', ar: 'قائد الحادثة' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
