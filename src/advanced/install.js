// Module 4 — Installation mode: device layout rules for smoke detectors (NFPA 72) and sprinklers
// (NFPA 13) with engineering diagrams, live calculators, a launcher for the 3D installation scene
// and a graded "is this placement compliant?" quiz.
import { header, L, esc, store, markDone, tabBar, stat, scoreBanner } from './ui.js';

const n = (v, u = '') => `<span class="inst-num">${v}${u ? `&nbsp;${u}` : ''}</span>`;
const BEAM_RULE = [[0.305, 0], [0.457, 64], [0.610, 89], [0.762, 140], [0.914, 191], [1.067, 241], [1.219, 305], [1.372, 356], [1.524, 419], [Infinity, 457]];
const allowedB = (A) => BEAM_RULE.find(([a]) => A < a)[1];

// ───────────────────────── SVG building blocks
const defs = (id) => `<defs>
  <pattern id="${id}h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#94a3b8" stroke-width="2"/></pattern>
  <pattern id="${id}c" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d6d3cc"/><circle cx="3" cy="4" r="1" fill="#b3aea4"/><circle cx="8" cy="8" r="0.8" fill="#bdb8ae"/></pattern>
  <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9dde1"/></linearGradient>
  <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b98b26"/><stop offset=".5" stop-color="#f1cf6b"/><stop offset="1" stop-color="#a87a1c"/></linearGradient>
  <radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#22c55e" stop-opacity=".30"/><stop offset="1" stop-color="#22c55e" stop-opacity=".10"/></radialGradient>
  <filter id="${id}f" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity=".25"/></filter>
  <marker id="${id}a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="currentColor"/></marker>
</defs>`;
/** Dimension line with arrows and a label. */
const dim = (id, x1, y1, x2, y2, label, { color = '#2563eb', off = -8, size = 12 } = {}) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  return `<g style="color:${color}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.4" marker-start="url(#${id}a)" marker-end="url(#${id}a)"/>
    <text x="${vert ? mx + off : mx}" y="${vert ? my + 4 : my + off}" text-anchor="${vert ? (off < 0 ? 'end' : 'start') : 'middle'}" font-size="${size}" font-weight="700" fill="${color}" paint-order="stroke" stroke="var(--panel)" stroke-width="3">${label}</text></g>`;
};
/** Plan symbol of a smoke detector. */
const detSym = (x, y, ok = true, r = 9) => `<g filter="url(#F)"><circle cx="${x}" cy="${y}" r="${r}" fill="${ok ? '#16a34a' : '#dc2626'}" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="${r + 2}" font-weight="800" fill="#fff">S</text></g>`;
/** Plan symbol of a sprinkler. */
const spkSym = (x, y, ok = true) => { const c = ok ? '#16a34a' : '#dc2626'; return `<g><line x1="${x - 11}" y1="${y}" x2="${x + 11}" y2="${y}" stroke="${c}" stroke-width="2.2"/><line x1="${x}" y1="${y - 11}" x2="${x}" y2="${y + 11}" stroke="${c}" stroke-width="2.2"/><circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="#fff" stroke-width="2"/></g>`; };
/** Section view of a ceiling-mounted smoke detector (base + head). */
const detSide = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-17" y="0" width="34" height="5" rx="2" fill="#f4f4f1" stroke="#9ca3af"/><path d="M-14 5 h28 l-3 11 h-22 z" fill="#f8f8f6" stroke="#9ca3af"/><rect x="-11" y="8" width="22" height="3" fill="#6b7280" opacity=".5"/><circle cx="7" cy="14" r="1.6" fill="#ef4444"/></g>`;
/** Section view of a pendent sprinkler whose deflector is at local y = 0 (drawn upward to the pipe). */
const spkSide = (id, x, yCeil, yDefl) => `<g><rect x="${x - 3}" y="${yCeil - 30}" width="6" height="${yDefl - yCeil + 16}" fill="#c4161c"/><rect x="${x - 9}" y="${yCeil - 2}" width="18" height="3" rx="1" fill="#e5e7eb" stroke="#9ca3af"/>
  <rect x="${x - 4}" y="${yDefl - 14}" width="8" height="6" fill="url(#${id}s)"/><line x1="${x - 4}" y1="${yDefl - 8}" x2="${x - 5}" y2="${yDefl}" stroke="#b98b26" stroke-width="1.6"/><line x1="${x + 4}" y1="${yDefl - 8}" x2="${x + 5}" y2="${yDefl}" stroke="#b98b26" stroke-width="1.6"/>
  <rect x="${x - 1.6}" y="${yDefl - 9}" width="3.2" height="8" rx="1.5" fill="#ef4444"/><rect x="${x - 10}" y="${yDefl}" width="20" height="2.2" rx="1" fill="url(#${id}s)"/></g>`;
const svg = (id, w, h, body, cls = '') => `<svg class="adv-svg inst-svg ${cls}" viewBox="0 0 ${w} ${h}" role="img">${defs(id).replace(/url\(#F\)/g, `url(#${id}f)`)}<rect class="bg" x="0" y="0" width="${w}" height="${h}" rx="10"/>${body.replace(/url\(#F\)/g, `url(#${id}f)`)}</svg>`;

// ───────────────────────── diagrams
function svgDetSpacing(S) {
  const id = 'ids', sc = 20, R = 0.7 * S, ox = 250, oy = 150;
  const half = (S / 2) * sc;
  const pts = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [ox + a * half, oy + b * half]);
  return svg(id, 500, 300, `
    <rect x="${ox - 2 * half}" y="${oy - 2 * half}" width="${4 * half}" height="${4 * half}" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>
    ${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${R * sc}" fill="url(#${id}g)" stroke="#16a34a" stroke-width="1.2" stroke-dasharray="5 4"/>`).join('')}
    <rect x="${ox - half}" y="${oy - half}" width="${2 * half}" height="${2 * half}" fill="none" stroke="#2563eb" stroke-width="1.6"/>
    ${pts.map(([x, y]) => detSym(x, y)).join('')}
    <line x1="${pts[0][0]}" y1="${pts[0][1]}" x2="${pts[0][0] + R * sc * 0.7071}" y2="${pts[0][1] + R * sc * 0.7071}" stroke="#dc2626" stroke-width="1.8"/>
    <text x="${pts[0][0] + R * sc * 0.36 + 8}" y="${pts[0][1] + R * sc * 0.36 - 4}" font-size="12.5" font-weight="700" fill="#dc2626" paint-order="stroke" stroke="var(--panel)" stroke-width="3">R = 0.7 S = ${R.toFixed(2)} m</text>
    ${dim(id, pts[2][0], pts[2][1] + 22, pts[3][0], pts[3][1] + 22, `S = ${S.toFixed(1)} m`, { off: 16 })}
    <text class="mut" x="14" y="22" font-size="12">${esc(L('Plan: square spacing S → every point within 0.7 S of a detector', 'مسقط: تباعد مربع S ← كل نقطة ضمن 0.7 S من كاشف'))}</text>
    <text class="mut" x="14" y="288" font-size="11">${esc(L('0.7 S ≈ S/√2: the circle just reaches the far corner of the S × S square', '0.7 S ≈ S/√2: الدائرة تصل بالكاد إلى الزاوية البعيدة للمربع S × S'))}</text>`);
}
function svgWalls() {
  const id = 'iwl';
  return svg(id, 500, 250, `
    <rect x="30" y="40" width="440" height="16" fill="url(#${id}c)"/><rect x="30" y="56" width="18" height="170" fill="url(#${id}c)"/>
    <text class="tx" x="250" y="34" text-anchor="middle" font-size="12" font-weight="700">${esc(L('Ceiling', 'السقف'))}</text>
    <text class="tx" x="26" y="150" font-size="12" font-weight="700" transform="rotate(-90 26 150)" text-anchor="middle">${esc(L('Wall', 'الجدار'))}</text>
    <rect x="48" y="56" width="${0.3 * 280}" height="${0.3 * 280 * 0.5}" fill="#fecaca" opacity=".55"/>
    <text x="70" y="88" font-size="11" fill="#b91c1c" font-weight="700">✗</text>
    ${detSide(165, 56, 1.3)}
    ${dim(id, 48, 110, 165, 110, '≥ 0.1 m (4 in)', { color: '#16a34a', off: 16 })}
    ${detSide(62, 125, 0.9).replace('translate(62 125)', 'translate(62 132) rotate(-90)')}
    ${dim(id, 96, 56, 96, 128, '0.1–0.3 m', { color: '#16a34a', off: 8 })}
    <text class="mut" x="104" y="160" font-size="11">${esc(L('Sidewall mounting: top of detector 0.1–0.3 m below the ceiling', 'التركيب على الجدار: أعلى الكاشف 0.1–0.3 م تحت السقف'))}</text>
    <line x1="330" y1="56" x2="330" y2="200" stroke="#2563eb" stroke-dasharray="4 4"/>
    ${spkSide(id, 330, 56, 72)}
    ${dim(id, 48, 200, 330, 200, L('sprinkler: 0.1 – 2.3 m (½ S)', 'رشاش: 0.1 – 2.3 م (½ S)'), { color: '#2563eb', off: 16 })}
    <text class="mut" x="250" y="240" text-anchor="middle" font-size="11">NFPA 72 §17.7.3.2.1 · NFPA 13 §10.2.5.2–10.2.5.3</text>`);
}
function svgBeamPocket() {
  const id = 'ibp';
  return svg(id, 500, 260, `
    <rect x="20" y="40" width="460" height="18" fill="url(#${id}c)"/><rect x="232" y="58" width="36" height="72" fill="url(#${id}c)"/>
    <rect x="20" y="220" width="460" height="8" fill="#94a3b8"/>
    <path d="M40 58 h192 v40 q-96 30 -192 0 z" fill="#64748b" opacity=".18"/>
    ${[0, 1, 2, 3, 4, 5].map((k) => `<circle cx="${70 + k * 26}" cy="${72 + (k % 2) * 8}" r="${12 + (k % 3) * 3}" fill="#6b7280" opacity=".22"/>`).join('')}
    <path d="M120 215 C 110 170 140 140 120 100" stroke="#6b7280" stroke-width="6" fill="none" opacity=".25" stroke-linecap="round"/>
    <path d="M114 214 q6 -18 12 -4 q4 -14 10 2" fill="#f97316"/>
    ${detSide(120, 58, 1.1)}${detSide(370, 58, 1.1)}
    <text x="120" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#16a34a">✓ ${esc(L('alarm', 'إنذار'))}</text>
    <text x="370" y="102" text-anchor="middle" font-size="11" font-weight="700" fill="#dc2626">✗ ${esc(L('smoke never arrives', 'لا يصل الدخان'))}</text>
    ${dim(id, 285, 58, 285, 130, 'd = 0.5 m', { color: '#dc2626', off: 8 })}
    ${dim(id, 460, 58, 460, 220, 'H = 3.0 m', { color: '#2563eb', off: -8 })}
    <text class="tx" x="250" y="160" text-anchor="middle" font-size="12.5" font-weight="700">d / H = 17 % &gt; 10 % → ${esc(L('each pocket = separate area', 'كل جيب = منطقة مستقلة'))}</text>
    <text class="mut" x="250" y="250" text-anchor="middle" font-size="11">NFPA 72 §17.7.3.2.4 — ${esc(L('smoke fills the pocket where it starts before spilling under the beam', 'يملأ الدخان الجيب الذي يبدأ فيه قبل أن يتسرب تحت العارضة'))}</text>`);
}
function svgDiffuser() {
  const id = 'idf', cx = 250, cy = 130;
  return svg(id, 500, 260, `
    <rect x="30" y="30" width="440" height="200" fill="none" stroke="var(--line)"/>
    <rect x="${cx - 110}" y="${cy - 110}" width="220" height="220" rx="80" fill="#f59e0b" opacity=".10" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="6 4"/>
    <g filter="url(#F)"><rect x="${cx - 26}" y="${cy - 26}" width="52" height="52" fill="url(#${id}d)" stroke="#6b7280"/>${[0, 1, 2, 3].map((k) => `<rect x="${cx - 22 + k * 5}" y="${cy - 22 + k * 5}" width="${44 - k * 10}" height="${44 - k * 10}" fill="none" stroke="#8d949a" stroke-width="1.4"/>`).join('')}</g>
    ${[[0, -1], [1, 0], [0, 1], [-1, 0]].map(([a, b]) => `<path d="M${cx + a * 32} ${cy + b * 32} l${a * 44} ${b * 44}" stroke="#38bdf8" stroke-width="3" marker-end="url(#${id}a)" style="color:#38bdf8" opacity=".85"/>`).join('')}
    ${detSym(cx + 150, cy - 50, true)}${detSym(cx + 70, cy + 40, false)}
    ${dim(id, cx + 26, cy + 95, cx + 110, cy + 95, '0.9 m (3 ft)', { color: '#d97706', off: 16 })}
    <text class="mut" x="${cx}" y="${cy - 36}" text-anchor="middle" font-size="11" font-weight="700">${esc(L('SUPPLY', 'إمداد'))}</text>
    <text x="${cx + 164}" y="${cy - 64}" font-size="11" font-weight="700" fill="#16a34a">✓</text>
    <text x="${cx + 84}" y="${cy + 56}" font-size="11" font-weight="700" fill="#dc2626">✗ 0.45 m</text>
    <text class="mut" x="250" y="250" text-anchor="middle" font-size="11">NFPA 72 §17.7.4.3 — ${esc(L('measured from the diffuser edge; the jet dilutes and deflects smoke', 'تُقاس من حافة الناشر؛ التيار يخفف الدخان ويحرفه'))}</text>`);
}
function svgSpkSpacing(S, Lm) {
  const id = 'isp', sc = 26, ox = 70, oy = 50;
  const cols = 3, rows = 2;
  let body = `<rect x="${ox - 20}" y="${oy - 20}" width="${cols * S * sc + 40}" height="${rows * Lm * sc + 40}" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>`;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = ox + i * S * sc, y = oy + j * Lm * sc;
    body += `<rect x="${x}" y="${y}" width="${S * sc}" height="${Lm * sc}" fill="${S * Lm <= 20.9 && S <= 4.6 && Lm <= 4.6 ? '#22c55e' : '#ef4444'}" opacity="${(i + j) % 2 ? 0.14 : 0.22}" stroke="#94a3b8" stroke-width=".8"/>`;
  }
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) body += spkSym(ox + (i + 0.5) * S * sc, oy + (j + 0.5) * Lm * sc, S * Lm <= 20.9 && S <= 4.6 && Lm <= 4.6);
  const W = cols * S * sc, Hh = rows * Lm * sc;
  body += dim(id, ox + 0.5 * S * sc, oy + Hh + 16, ox + 1.5 * S * sc, oy + Hh + 16, `S = ${S.toFixed(1)} m`, { off: 16 });
  body += dim(id, ox + W + 16, oy + 0.5 * Lm * sc, ox + W + 16, oy + 1.5 * Lm * sc, `L = ${Lm.toFixed(1)} m`, { off: 8 });
  body += dim(id, ox, oy - 10, ox + 0.5 * S * sc, oy - 10, `${(S / 2).toFixed(2)} m`, { color: '#7c3aed', off: -6, size: 11 });
  return svg(id, 520, Math.max(200, oy + Hh + 50), body);
}
function svgDeflector(mm) {
  const id = 'idl', y0 = 60, sc = 0.28, yd = y0 + mm * sc, ok = mm >= 25 && mm <= 305;
  return svg(id, 500, 200, `
    <rect x="20" y="${y0 - 20}" width="460" height="20" fill="url(#${id}c)"/>
    <rect x="20" y="${y0 + 25 * sc}" width="460" height="${280 * sc}" fill="#22c55e" opacity=".12"/>
    <text x="470" y="${y0 + 25 * sc + 14}" text-anchor="end" font-size="11" font-weight="700" fill="#15803d">${esc(L('permitted zone 25–305 mm', 'المنطقة المسموحة 25–305 مم'))}</text>
    ${spkSide(id, 200, y0, yd)}
    ${dim(id, 240, y0, 240, yd, `${mm} mm`, { color: ok ? '#16a34a' : '#dc2626', off: 8 })}
    <path d="M190 ${yd + 4} q-40 50 -110 70 M210 ${yd + 4} q40 50 110 70 M200 ${yd + 4} v70" stroke="#38bdf8" stroke-width="2" fill="none" stroke-dasharray="3 5" opacity=".8"/>
    <text x="380" y="${y0 + 60}" font-size="13" font-weight="800" fill="${ok ? '#16a34a' : '#dc2626'}">${ok ? '✓ ' + esc(L('compliant', 'مطابق')) : '✗ ' + esc(L('not permitted', 'غير مسموح'))}</text>
    <text class="mut" x="250" y="190" text-anchor="middle" font-size="11">NFPA 13 §10.2.6.1.1 — ${esc(L('deflector 1–12 in below a smooth unobstructed ceiling', 'العاكس 1–12 بوصة تحت سقف أملس غير معاق'))}</text>`);
}
function svgBeamRule(A, B) {
  const id = 'ibr', y0 = 50, sc = 120, bx = 300, bw = 42, bd = 0.5 * sc;
  const allowed = allowedB(A), ok = B <= allowed;
  const sx = bx - A * sc, yd = y0 + bd - (B / 1000) * sc;
  return svg(id, 500, 230, `
    <rect x="20" y="${y0 - 18}" width="460" height="18" fill="url(#${id}c)"/>
    <rect x="${bx}" y="${y0}" width="${bw}" height="${bd}" fill="url(#${id}c)" stroke="#9ca3af"/>
    <line x1="20" y1="${y0 + bd}" x2="480" y2="${y0 + bd}" stroke="#94a3b8" stroke-dasharray="3 4"/>
    <path d="M${sx} ${yd + 3} L${bx + bw + 150} ${y0 + bd + 110} L${sx - 150} ${y0 + bd + 110} Z" fill="#38bdf8" opacity=".12"/>
    <path d="M${sx} ${yd + 3} L${bx} ${y0 + bd}" stroke="${ok ? '#16a34a' : '#dc2626'}" stroke-width="1.6" stroke-dasharray="5 4"/>
    ${!ok ? `<path d="M${bx} ${y0 + bd} L${bx + bw + 140} ${y0 + bd + 110 * 0.9} L${bx + bw} ${y0 + bd} Z" fill="#475569" opacity=".25"/><text x="${bx + bw + 20}" y="${y0 + bd + 50}" font-size="11.5" font-weight="700" fill="#dc2626">${esc(L('shadow', 'منطقة ظل'))}</text>` : ''}
    ${spkSide(id, sx, y0, yd)}
    ${dim(id, sx, y0 + bd + 24, bx, y0 + bd + 24, `A = ${A.toFixed(2)} m`, { color: '#2563eb', off: 16 })}
    ${dim(id, sx - 22, yd, sx - 22, y0 + bd, `B = ${B} mm`, { color: ok ? '#16a34a' : '#dc2626', off: -8 })}
    <text x="480" y="${y0 + bd + 70}" text-anchor="end" font-size="12.5" font-weight="800" fill="${ok ? '#16a34a' : '#dc2626'}">${ok ? '✓' : '✗'} B ${ok ? '≤' : '&gt;'} ${allowed} mm ${esc(L('allowed at this A', 'المسموح عند هذه المسافة'))}</text>
    <text class="mut" x="250" y="222" text-anchor="middle" font-size="11">NFPA 13 Table 10.2.7.2.1.3 — ${esc(L('standard-spray pendent / upright', 'رشاش قياسي متدلٍّ / قائم'))}</text>`);
}

// ───────────────────────── quiz situations
const QUIZ = [
  { ok: false, q: ['Smoke detector 0.6 m from a supply-air diffuser.', 'كاشف دخان على بُعد 0.6 م من ناشر هواء إمداد.'],
    why: ['Minimum 0.9 m (3 ft) from supply diffusers — NFPA 72 §17.7.4.3.', 'الحد الأدنى 0.9 م (3 أقدام) من ناشرات الإمداد — NFPA 72 §17.7.4.3.'],
    draw: (id) => svg(id, 300, 170, `<rect x="20" y="20" width="260" height="130" fill="none" stroke="var(--line)"/><g filter="url(#F)"><rect x="80" y="60" width="44" height="44" fill="url(#${id}d)" stroke="#6b7280"/><rect x="88" y="68" width="28" height="28" fill="none" stroke="#8d949a"/></g>${detSym(172, 82, true)}${dim(id, 124, 118, 172, 118, '0.6 m', { color: '#d97706', off: 14 })}<text class="mut" x="102" y="54" text-anchor="middle" font-size="10">${esc(L('SUPPLY', 'إمداد'))}</text>`) },
  { ok: true, q: ['Light hazard: pendents on a 3.6 × 3.6 m grid, outer heads 1.8 m from the walls.', 'خطورة خفيفة: رشاشات متدلية على شبكة 3.6 × 3.6 م، والرشاشات الطرفية على بُعد 1.8 م من الجدران.'],
    why: ['3.6 × 3.6 = 13 m² ≤ 20.9 m², spacing ≤ 4.6 m, ≥ 1.8 m apart, 1.8 m ≤ 2.3 m from walls — compliant.', '3.6 × 3.6 = 13 م² ≤ 20.9 م²، التباعد ≤ 4.6 م، ≥ 1.8 م بينها، و1.8 م ≤ 2.3 م من الجدران — مطابق.'],
    draw: (id) => svg(id, 300, 170, `<rect x="30" y="20" width="240" height="130" fill="none" stroke="#475569" stroke-width="3"/>${[0, 1, 2].map((i) => [0, 1].map((j) => spkSym(70 + i * 80, 55 + j * 60)).join('')).join('')}${dim(id, 70, 138, 150, 138, '3.6 m', { off: -6 })}${dim(id, 30, 40, 70, 40, '1.8', { color: '#7c3aed', off: -6, size: 11 })}`) },
  { ok: false, q: ['The last sprinkler in a row is 2.8 m from the end wall.', 'آخر رشاش في الصف على بُعد 2.8 م من الجدار الطرفي.'],
    why: ['Maximum distance to a wall is ½ the allowable spacing: 2.3 m (7.5 ft) — NFPA 13 §10.2.5.2.', 'أقصى مسافة للجدار نصف التباعد المسموح: 2.3 م (7.5 أقدام) — NFPA 13 §10.2.5.2.'],
    draw: (id) => svg(id, 300, 170, `<rect x="20" y="20" width="260" height="130" fill="none" stroke="#475569" stroke-width="3"/><rect x="200" y="22" width="78" height="126" fill="#ef4444" opacity=".15"/>${spkSym(80, 85)}${spkSym(170, 85, false)}${dim(id, 170, 120, 278, 120, '2.8 m', { color: '#dc2626', off: 16 })}`) },
  { ok: false, q: ['Beam 600 mm deep on a 3.0 m ceiling; one detector near the beam is meant to cover both sides.', 'عارضة بعمق 600 مم في سقف 3.0 م؛ كاشف واحد قرب العارضة يُفترض أن يغطي الجانبين.'],
    why: ['0.6 / 3.0 = 20 % > 10 % → each beam pocket is a separate area and needs its own detector(s) — NFPA 72 §17.7.3.2.4.', '0.6 / 3.0 = 20% > 10% ← كل جيب منطقة مستقلة ويحتاج كاشفاً خاصاً به — NFPA 72 §17.7.3.2.4.'],
    draw: (id) => svg(id, 300, 170, `<rect x="10" y="26" width="280" height="14" fill="url(#${id}c)"/><rect x="140" y="40" width="22" height="60" fill="url(#${id}c)"/>${detSide(110, 40, 1)}<text x="110" y="78" text-anchor="middle" font-size="11" fill="#16a34a" font-weight="700">?</text><text x="225" y="78" text-anchor="middle" font-size="18" fill="#dc2626" font-weight="800">∅</text>${dim(id, 172, 40, 172, 100, '0.6 m', { color: '#dc2626', off: 6, size: 11 })}<rect x="10" y="150" width="280" height="6" fill="#94a3b8"/>`) },
  { ok: true, q: ['Pendent 1.5 m from a beam side; its deflector is 350 mm above the beam bottom.', 'رشاش متدلٍّ على بُعد 1.5 م من جانب عارضة؛ وعاكسه أعلى من أسفل العارضة بـ 350 مم.'],
    why: ['At 1.37–1.52 m (4½–5 ft) the table allows up to 419 mm (16½ in); 350 mm ≤ 419 mm — compliant.', 'عند 1.37–1.52 م يسمح الجدول بحتى 419 مم؛ و350 ≤ 419 — مطابق.'],
    draw: (id) => svg(id, 300, 170, `<rect x="10" y="26" width="280" height="14" fill="url(#${id}c)"/><rect x="220" y="40" width="26" height="60" fill="url(#${id}c)"/>${spkSide(id, 70, 40, 58)}${dim(id, 70, 120, 220, 120, '1.5 m', { off: 16 })}${dim(id, 40, 58, 40, 100, '350', { color: '#16a34a', off: -6, size: 11 })}<line x1="30" y1="100" x2="250" y2="100" stroke="#94a3b8" stroke-dasharray="3 4"/>`) },
  { ok: false, q: ['Pendent sprinkler deflector installed 350 mm below a smooth ceiling.', 'عاكس رشاش متدلٍّ مركب على بُعد 350 مم تحت سقف أملس.'],
    why: ['Deflector must be 25–305 mm (1–12 in) below the ceiling so it operates in the hot ceiling jet — NFPA 13 §10.2.6.1.1.', 'يجب أن يكون العاكس 25–305 مم تحت السقف ليعمل ضمن تيار السقف الساخن — NFPA 13 §10.2.6.1.1.'],
    draw: (id) => svg(id, 300, 170, `<rect x="10" y="26" width="280" height="16" fill="url(#${id}c)"/><rect x="10" y="${42 + 25 * 0.28}" width="280" height="${280 * 0.28}" fill="#22c55e" opacity=".12"/>${spkSide(id, 150, 42, 42 + 350 * 0.28)}${dim(id, 190, 42, 190, 42 + 350 * 0.28, '350 mm', { color: '#dc2626', off: 8 })}`) },
];

// ───────────────────────── module
const m = {
  id: 'install', icon: '🔧',
  title: { en: 'Installation Mode (3D)', ar: 'وضع التركيب ثلاثي الأبعاد' },
  short: { en: 'Detector & sprinkler layout rules', ar: 'قواعد توزيع الكواشف والرشاشات' },
  sub: {
    en: 'Where exactly do detectors and sprinklers go? Learn the spacing geometry, wall distances, beam pockets, diffuser clearance and the sprinkler beam rule, then install devices yourself on a realistic 3D office ceiling with live coverage and code checking.',
    ar: 'أين تُركّب الكواشف والرشاشات بالضبط؟ تعلّم هندسة التباعد والمسافات من الجدران وجيوب العوارض وخلوص ناشرات الهواء وقاعدة العارضة للرشاشات، ثم ركّب الأجهزة بنفسك على سقف مكتب واقعي ثلاثي الأبعاد مع تغطية حية وتدقيق للكود.',
  },
  refs: ['NFPA 72 §17.7.3', 'NFPA 72 §17.7.4', 'NFPA 13 §10.2.4–10.2.7', 'NFPA 13 Table 10.2.7.2.1.3'],
  render(el, ctx) {
    let tab = store.get('install.tab', 'det');
    const ui = { S: 9.1, sS: 4.0, sL: 4.5, defl: 100, A: 1.0, B: 400 };
    const quiz = { ans: {}, best: store.get('install.quizBest', null) };

    const launch = () => `<div class="card inst-hero">
      <div class="inst-hero-art">${svg('ihero', 360, 180, `
        <polygon points="20,40 340,40 300,80 60,80" fill="#e5e7eb" stroke="#9ca3af"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<line x1="${60 + k * 30}" y1="80" x2="${20 + k * 40}" y2="40" stroke="#cbd5e1"/>`).join('')}
        <rect x="170" y="40" width="14" height="40" fill="#cbd5e1" stroke="#94a3b8"/>
        <ellipse cx="110" cy="62" rx="62" ry="14" fill="#22c55e" opacity=".22"/><ellipse cx="250" cy="62" rx="52" ry="12" fill="#ef4444" opacity=".18"/>
        ${detSide(110, 60, 0.9)}${detSide(245, 60, 0.9)}
        <circle cx="245" cy="60" r="14" fill="none" stroke="#dc2626" stroke-width="2"/>
        <rect x="20" y="150" width="320" height="8" fill="#475569"/>
        ${[50, 110, 170, 230, 290].map((x) => `<rect x="${x}" y="120" width="40" height="4" fill="#a8a29e"/><rect x="${x + 4}" y="124" width="3" height="26" fill="#57534e"/><rect x="${x + 33}" y="124" width="3" height="26" fill="#57534e"/>`).join('')}
        <path d="M180 100 l10 -14 l10 14" stroke="#2563eb" stroke-width="2.5" fill="none"/><text x="190" y="116" text-anchor="middle" font-size="11" font-weight="700" fill="#2563eb">${esc(L('click to install', 'انقر للتركيب'))}</text>`)}</div>
      <div class="inst-hero-tx">
        <h3>🏗️ ${esc(L('3D installation mode — open-plan office, 20 × 14 m, 3.0 m ceiling', 'وضع التركيب ثلاثي الأبعاد — مكتب مفتوح 20 × 14 م، سقف 3.0 م'))}</h3>
        <p>${esc(L('Pick a tool, click ceiling tiles to install smoke detectors or pendent sprinklers, and watch coverage and code compliance update live. A 500 mm downstand beam, three supply diffusers, an exposed Ø450 duct and a column make it a real design problem.', 'اختر أداة وانقر على بلاطات السقف لتركيب كواشف الدخان أو الرشاشات المتدلية، وشاهد التغطية والمطابقة للكود تتحدث مباشرة. عارضة ساقطة 500 مم وثلاثة ناشرات إمداد ومجرى مكشوف Ø450 وعمود تجعلها مسألة تصميم حقيقية.'))}</p>
        <div class="inst-steps">
          <div><span>1</span>${esc(L('Design the detector layout (≥ 98 % coverage, 0 violations)', 'صمّم توزيع الكواشف (تغطية ≥ 98%، دون مخالفات)'))}</div>
          <div><span>2</span>${esc(L('Design the sprinkler layout — light hazard', 'صمّم توزيع الرشاشات — خطورة خفيفة'))}</div>
          <div><span>3</span>${esc(L('Fix the installer\'s 5 mistakes', 'صحّح أخطاء المقاول الخمسة'))}</div>
        </div>
        <div class="adv-btns"><button class="btn primary inst-launch" id="instLaunch">▶ ${esc(L('Launch 3D installation mode', 'تشغيل وضع التركيب ثلاثي الأبعاد'))}</button>
        <span class="adv-pill info">${esc(L('Efficiency bonus for near-minimum device counts', 'مكافأة كفاءة لعدد أجهزة قريب من الحد الأدنى'))}</span></div>
      </div></div>`;

    const keyStats = () => `<div class="adv-stats">
      ${stat(L('Detector listed spacing S', 'تباعد الكاشف المعتمد S'), '9.1', 'm')}
      ${stat(L('Coverage radius 0.7 S', 'نصف قطر التغطية 0.7 S'), '6.4', 'm')}
      ${stat(L('Detector ↔ supply diffuser', 'الكاشف ↔ ناشر الإمداد'), '≥ 0.9', 'm')}
      ${stat(L('Sprinkler area (light hazard)', 'مساحة الرشاش (خفيفة)'), '≤ 20.9', 'm²')}
      ${stat(L('Sprinkler spacing', 'تباعد الرشاشات'), '1.8–4.6', 'm')}
      ${stat(L('Sprinkler to wall', 'الرشاش إلى الجدار'), '0.1–2.3', 'm')}
    </div>`;

    const detTab = () => `<div class="adv-grid c2">
      <div class="card"><h3>📐 ${esc(L('Spacing geometry & the 0.7 S rule', 'هندسة التباعد وقاعدة 0.7 S'))}</h3>
        <div id="instDetSp">${svgDetSpacing(ui.S)}</div>
        <div class="adv-range"><div class="lbl">${esc(L('Listed spacing S', 'التباعد المعتمد S'))} <b id="instSv">${ui.S.toFixed(1)} m</b></div><input type="range" id="instS" min="4.6" max="9.1" step="0.1" value="${ui.S}"></div>
        <p class="adv-note">${esc(L('Smooth ceilings: every point on the ceiling must be within 0.7 × the listed spacing of a detector (NFPA 72 §17.7.4.2.3.1). With the common 9.1 m (30 ft) listing, R ≈ 6.4 m, so a detector can serve an irregular area as long as no point is farther than that. Spacing is reduced for high ceilings and for beams.', 'الأسقف الملساء: يجب أن تقع كل نقطة من السقف ضمن 0.7 × التباعد المعتمد من كاشف (NFPA 72 §17.7.4.2.3.1). مع التباعد الشائع 9.1 م (30 قدماً) يكون R ≈ 6.4 م، فيمكن للكاشف خدمة منطقة غير منتظمة ما دامت لا توجد نقطة أبعد من ذلك. ويُخفَّض التباعد للأسقف العالية وعند وجود العوارض.'))}</p></div>
      <div class="card"><h3>🧱 ${esc(L('Distances from walls', 'المسافات من الجدران'))}</h3>${svgWalls()}
        <p class="adv-note">${esc(L('Ceiling-mounted detectors: ≥ 0.1 m (4 in) from the wall — the dead-air corner is avoided. Wall-mounted: top of the detector 0.1–0.3 m (4–12 in) below the ceiling. Distance to a wall counts as ½ S (i.e. ≤ 4.55 m for S = 9.1 m).', 'الكواشف على السقف: ≥ 0.1 م (4 بوصات) من الجدار لتجنب زاوية الهواء الراكد. على الجدار: أعلى الكاشف 0.1–0.3 م تحت السقف. وتُحسب المسافة إلى الجدار ½ S (أي ≤ 4.55 م عند S = 9.1 م).'))}</p></div>
      <div class="card"><h3>🏛️ ${esc(L('Beam pockets', 'جيوب العوارض'))}</h3>${svgBeamPocket()}
        <table class="adv-table"><tr><th>${esc(L('Beam depth', 'عمق العارضة'))}</th><th>${esc(L('Detector layout', 'توزيع الكواشف'))}</th></tr>
        <tr><td>≤ ${n('10 %')} H</td><td>${esc(L('Treat as smooth ceiling; spacing ⊥ beams may be reduced to ⅔ S if beams ≥ 0.3 m deep', 'يُعامل كسقف أملس؛ ويُخفَّض التباعد العمودي على العوارض إلى ⅔ S إذا كان عمقها ≥ 0.3 م'))}</td></tr>
        <tr><td>&gt; ${n('10 %')} H</td><td>${esc(L('Each beam pocket is a separate area — detectors in every pocket (beam spacing ≥ 40 % H)', 'كل جيب منطقة مستقلة — كواشف في كل جيب (تباعد العوارض ≥ 40% H)'))}</td></tr></table></div>
      <div class="card"><h3>🌬️ ${esc(L('Supply-air diffuser clearance', 'خلوص ناشر هواء الإمداد'))}</h3>${svgDiffuser()}
        <div class="adv-callout warn">${esc(L('Also keep detectors out of the direct airstream of return grilles and not in dead-air spaces; verify velocities > 1.5 m/s against the detector listing.', 'أبقِ الكواشف أيضاً خارج تيار فتحات الراجع المباشر وبعيداً عن مناطق الهواء الراكد؛ وتحقق من السرعات > 1.5 م/ث مقابل اعتماد الكاشف.'))}</div></div>
    </div>`;

    const spkState = () => {
      const area = ui.sS * ui.sL, ok = area <= 20.9 && ui.sS <= 4.6 && ui.sL <= 4.6 && ui.sS >= 1.8 && ui.sL >= 1.8;
      return `<div class="adv-stats">${stat(L('Area per head S × L', 'المساحة لكل رشاش S × L'), area.toFixed(1), 'm²', area <= 20.9 ? 'ok' : 'alarm')}${stat(L('Max. to wall (½ S / ½ L)', 'أقصى مسافة للجدار'), `${(ui.sS / 2).toFixed(2)} / ${(ui.sL / 2).toFixed(2)}`, 'm')}${stat(L('Verdict', 'الحكم'), ok ? '✓' : '✗', ok ? L('compliant', 'مطابق') : L('not compliant', 'غير مطابق'), ok ? 'ok' : 'alarm')}</div>`;
    };
    const spkTab = () => `<div class="adv-grid c2">
      <div class="card"><h3>📐 ${esc(L('Sprinkler spacing & protection area (light hazard)', 'تباعد الرشاشات ومساحة الحماية (خطورة خفيفة)'))}</h3>
        <div id="instSpkSp">${svgSpkSpacing(ui.sS, ui.sL)}</div><div id="instSpkSt">${spkState()}</div>
        <div class="adv-form"><div class="adv-range"><div class="lbl">S (${esc(L('along branch', 'على طول الفرع'))}) <b id="instSSv">${ui.sS.toFixed(1)} m</b></div><input type="range" id="instSS" min="1.5" max="5.5" step="0.1" value="${ui.sS}"></div>
        <div class="adv-range"><div class="lbl">L (${esc(L('between branches', 'بين الفروع'))}) <b id="instSLv">${ui.sL.toFixed(1)} m</b></div><input type="range" id="instSL" min="1.5" max="5.5" step="0.1" value="${ui.sL}"></div></div>
        <p class="adv-note">${esc(L('NFPA 13 Table 10.2.4.2.1(a): light hazard, standard-spray: ≤ 20.9 m² (225 ft²) per head, S and L ≤ 4.6 m (15 ft); heads ≥ 1.8 m (6 ft) apart so one does not cold-solder its neighbour; ≤ ½ S from walls and ≥ 0.1 m (4 in).', 'NFPA 13 الجدول 10.2.4.2.1(a): خطورة خفيفة، رش قياسي: ≤ 20.9 م² (225 قدم²) لكل رشاش، وS وL ≤ 4.6 م (15 قدماً)؛ والرشاشات ≥ 1.8 م (6 أقدام) كي لا يبرد أحدها جاره؛ و≤ ½ S من الجدران و≥ 0.1 م.'))}</p></div>
      <div class="card"><h3>📏 ${esc(L('Deflector distance below the ceiling', 'بُعد العاكس تحت السقف'))}</h3>
        <div id="instDefl">${svgDeflector(ui.defl)}</div>
        <div class="adv-range"><div class="lbl">${esc(L('Deflector below ceiling', 'العاكس تحت السقف'))} <b id="instDv">${ui.defl} mm</b></div><input type="range" id="instD" min="0" max="450" step="5" value="${ui.defl}"></div></div>
      <div class="card" style="grid-column:1/-1"><h3>🚧 ${esc(L('Obstructions: the beam rule', 'العوائق: قاعدة العارضة'))}</h3>
        <div class="adv-row"><div class="grow"><div id="instBR">${svgBeamRule(ui.A, ui.B)}</div>
          <div class="adv-form"><div class="adv-range"><div class="lbl">A — ${esc(L('distance to beam side', 'المسافة إلى جانب العارضة'))} <b id="instAv">${ui.A.toFixed(2)} m</b></div><input type="range" id="instA" min="0.1" max="1.8" step="0.05" value="${ui.A}"></div>
          <div class="adv-range"><div class="lbl">B — ${esc(L('deflector above beam bottom', 'العاكس فوق أسفل العارضة'))} <b id="instBv">${ui.B} mm</b></div><input type="range" id="instB" min="0" max="480" step="5" value="${ui.B}"></div></div></div>
          <div class="inst-table"><div class="adv-scroll"><table class="adv-table" id="instBRT"></table></div></div></div>
        <p class="adv-note">${esc(L('Applies to beams, ducts, lights and any continuous obstruction near the ceiling. For isolated obstructions (columns, pipes) use the "three-times rule": ≥ 3 × the obstruction width, max. 0.6 m (24 in). Obstructions wider than 1.2 m (4 ft) need sprinklers below them.', 'تنطبق على العوارض والمجاري والإنارة وأي عائق مستمر قرب السقف. وللعوائق المنفردة (أعمدة، أنابيب) تُطبق "قاعدة الأضعاف الثلاثة": ≥ 3 × عرض العائق وبحد أقصى 0.6 م (24 بوصة). والعوائق الأعرض من 1.2 م (4 أقدام) تحتاج رشاشات أسفلها.'))}</p></div>
    </div>`;

    const quizTab = () => {
      const answered = Object.keys(quiz.ans).length, correct = QUIZ.filter((q, i) => quiz.ans[i] === q.ok).length;
      const score = Math.round((100 * correct) / QUIZ.length);
      return `<div class="card"><h3>✅ ${esc(L('Is this placement compliant?', 'هل هذا التركيب مطابق؟'))}<span class="r adv-pill ${answered === QUIZ.length ? (score >= 80 ? 'ok' : 'warn') : 'info'}">${answered} / ${QUIZ.length}</span></h3>
        <p class="muted" style="margin-top:0">${esc(L('Six situations from real site inspections. Decide, then read the clause behind it.', 'ست حالات من فحوصات مواقع حقيقية. قرّر ثم اقرأ البند الذي يستند إليه الحكم.'))}${quiz.best != null ? ` · ${esc(L('Best score', 'أفضل نتيجة'))}: ${n(quiz.best, '%')}` : ''}</p>
        ${answered === QUIZ.length ? scoreBanner(score, esc(L(`${correct} of ${QUIZ.length} correct. ${score >= 80 ? 'You can read a layout like an inspector.' : 'Review the rules tabs and try again.'}`, `${correct} من ${QUIZ.length} صحيحة. ${score >= 80 ? 'أصبحت تقرأ المخطط كمفتش.' : 'راجع تبويبات القواعد وحاول مجدداً.'}`))) : ''}
        <div class="inst-quiz">${QUIZ.map((q, i) => {
          const a = quiz.ans[i], done = a !== undefined, right = done && a === q.ok;
          return `<div class="inst-q ${done ? (right ? 'right' : 'wrong') : ''}"><div class="inst-qn">${i + 1}</div>${q.draw(`iq${i}`)}
            <p>${esc(L(...q.q))}</p>
            ${done ? `<div class="inst-exp"><b>${right ? '✓ ' + esc(L('Correct', 'صحيح')) : '✗ ' + esc(L('Not quite', 'ليس تماماً'))}</b> — ${esc(q.ok ? L('Compliant.', 'مطابق.') : L('Not compliant.', 'غير مطابق.'))} ${esc(L(...q.why))}</div>`
              : `<div class="adv-btns"><button class="btn sm" data-qa="${i}" data-v="1">✓ ${esc(L('Compliant', 'مطابق'))}</button><button class="btn sm" data-qa="${i}" data-v="0">✗ ${esc(L('Not compliant', 'غير مطابق'))}</button></div>`}</div>`;
        }).join('')}</div>
        ${answered ? `<div class="adv-btns" style="margin-top:12px"><button class="btn" id="instQR">↺ ${esc(L('Restart quiz', 'أعد الاختبار'))}</button></div>` : ''}</div>`;
    };

    const draw = () => {
      el.innerHTML = header(m) + launch() + keyStats()
        + tabBar([{ id: 'det', label: `🔎 ${esc(L('Smoke detectors — NFPA 72', 'كواشف الدخان — NFPA 72'))}` }, { id: 'spk', label: `💧 ${esc(L('Sprinklers — NFPA 13', 'الرشاشات — NFPA 13'))}` }, { id: 'quiz', label: `✅ ${esc(L('Quiz: compliant or not?', 'اختبار: مطابق أم لا؟'))}` }], tab)
        + `<div id="instBody">${tab === 'det' ? detTab() : tab === 'spk' ? spkTab() : quizTab()}</div>`;
      el.querySelector('#instLaunch').onclick = () => ctx.helpers.startTrainingById?.('install');
      el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; store.set('install.tab', tab); draw(); }; });
      wire();
    };
    const brTable = () => {
      const t = el.querySelector('#instBRT'); if (!t) return;
      let lo = 0;
      t.innerHTML = `<tr><th>A (${esc(L('distance', 'المسافة'))})</th><th class="num">B max</th></tr>` + BEAM_RULE.map(([a, b]) => {
        const row = `<tr class="${ui.A >= lo && ui.A < a ? 'inst-hl' : ''}"><td class="num">${a === Infinity ? `≥ ${lo.toFixed(2)} m` : `${lo.toFixed(2)} – &lt;${a.toFixed(2)} m`}</td><td class="num">${b} mm</td></tr>`;
        lo = a; return row;
      }).join('');
    };
    const wire = () => {
      const on = (id, fn) => { const i = el.querySelector(id); if (i) i.oninput = () => fn(+i.value); };
      on('#instS', (v) => { ui.S = v; el.querySelector('#instSv').textContent = `${v.toFixed(1)} m`; el.querySelector('#instDetSp').innerHTML = svgDetSpacing(v); });
      const sp = () => { el.querySelector('#instSpkSp').innerHTML = svgSpkSpacing(ui.sS, ui.sL); el.querySelector('#instSpkSt').innerHTML = spkState(); };
      on('#instSS', (v) => { ui.sS = v; el.querySelector('#instSSv').textContent = `${v.toFixed(1)} m`; sp(); });
      on('#instSL', (v) => { ui.sL = v; el.querySelector('#instSLv').textContent = `${v.toFixed(1)} m`; sp(); });
      on('#instD', (v) => { ui.defl = v; el.querySelector('#instDv').textContent = `${v} mm`; el.querySelector('#instDefl').innerHTML = svgDeflector(v); });
      const br = () => { el.querySelector('#instBR').innerHTML = svgBeamRule(ui.A, ui.B); brTable(); };
      on('#instA', (v) => { ui.A = v; el.querySelector('#instAv').textContent = `${v.toFixed(2)} m`; br(); });
      on('#instB', (v) => { ui.B = v; el.querySelector('#instBv').textContent = `${v} mm`; br(); });
      brTable();
      el.querySelectorAll('[data-qa]').forEach((b) => {
        b.onclick = () => {
          quiz.ans[+b.dataset.qa] = b.dataset.v === '1';
          if (Object.keys(quiz.ans).length === QUIZ.length) {
            const correct = QUIZ.filter((q, i) => quiz.ans[i] === q.ok).length, score = Math.round((100 * correct) / QUIZ.length);
            quiz.best = Math.max(quiz.best ?? 0, score); store.set('install.quizBest', quiz.best);
            markDone('install', score);
            ctx.helpers.recordResult?.({ type: 'lab', topic: 'install/quiz', score: correct, total: QUIZ.length });
          }
          const y = el.closest('.adv-main')?.scrollTop;
          draw();
          if (y != null) el.closest('.adv-main').scrollTop = y;
        };
      });
      const r = el.querySelector('#instQR'); if (r) r.onclick = () => { quiz.ans = {}; draw(); };
    };
    draw();
    return () => {};
  },
};
export default m;
