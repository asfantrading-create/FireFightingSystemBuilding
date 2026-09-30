import { header } from './ui.js';

const m = {
  id: 'facp', icon: '🎛️',
  title: { en: 'Addressable Fire Alarm Panel Lab', ar: 'مختبر لوحة الإنذار المعنونة' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
