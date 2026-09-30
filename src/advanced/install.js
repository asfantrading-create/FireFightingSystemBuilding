import { header } from './ui.js';

const m = {
  id: 'install', icon: '🔧',
  title: { en: 'Installation Mode (3D)', ar: 'وضع التركيب ثلاثي الأبعاد' },
  sub: { en: '', ar: '' },
  refs: [],
  render(el) { el.innerHTML = header(m) + '<div class="card">…</div>'; },
};
export default m;
