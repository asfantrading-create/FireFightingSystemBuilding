// Module 6 — Predictive Maintenance (CMMS).
// Deterministic 24-month condition history for every smoke detector (drift / dirt compensation, driven by the live
// FireSystem dirt value), fire pumps and batteries; linear-regression forecasts to the maintenance threshold,
// an NFPA 72 / NFPA 25 ITM calendar, auto-generated work orders that act on the live panel, and a graded
// "16 technician-hours" planning challenge (knapsack optimum).
import Chart from 'chart.js/auto';
import { header, L, esc, tr, store, markDone, tabBar, stat, scoreBanner, clamp, css, pad3 } from './ui.js';

const KEY = 'mt.state';
const DAY = 86400000;
const blank = () => ({ tab: 'fleet', sel: null, cls: 'all', risk: false, sort: { k: 'days', d: 1 }, done: {}, serviced: {}, woDone: {}, pick: {}, result: null, imported: false });
let S = blank();
const save = () => store.set(KEY, S);
const T = (en, ar) => ({ en, ar });
const N = (v) => `<span class="mt-n">${v}</span>`;
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const iso = (d) => new Date(d).toISOString().slice(0, 10);

// ───────────────────────── deterministic RNG
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = hash(seed); return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ───────────────────────── regression
function linreg(pts) {
  const n = pts.length; if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const den = n * sxx - sx * sx; if (!den) return null;
  const b = (n * sxy - sx * sy) / den, a = (sy - b * sx) / n;
  const my = sy / n; let ssT = 0, ssR = 0;
  for (const [x, y] of pts) { ssT += (y - my) ** 2; ssR += (y - (a + b * x)) ** 2; }
  return { a, b, r2: ssT ? 1 - ssR / ssT : 1 };
}

// ───────────────────────── asset models
const ROOM_RATE = { cor: 3.2, lobby: 3.6, off6: 2.2, off4: 1.0, riser: 2.5 };
function detAged(d) {
  const r = rng('det:' + d.id);
  const rate = (ROOM_RATE[d.room] ?? 1.8) * (0.45 + 1.25 * r());
  const since = 6 + Math.floor(r() * 19);        // months since last cleaning
  const start = 3 + r() * 5;
  const prev = 18 + r() * 30;                      // level before that cleaning
  return { rate, since, start, prev, aged: clamp(start + rate * since + (r() - 0.5) * 3, 2, 104) };
}
/** Builds every monitored asset with its 24-month series (index 0 = 23 months ago, 23 = now). */
function buildAssets(sys) {
  const out = [];
  for (const d of sys.devices) {
    if (d.type !== 'smoke' && d.type !== 'multi') continue;
    const m = detAged(d); const r = rng('dn:' + d.id);
    const series = [];
    for (let i = 0; i < 24; i++) {
      const mAgo = 23 - i;
      const v = mAgo > m.since ? m.prev - m.rate * (mAgo - m.since) * 0.9 : m.start + m.rate * (m.since - mAgo);
      series.push(clamp(v + (r() - 0.5) * 2.2, 1, 105));
    }
    const live = d.dirt * 100;
    let cleanIdx = 23 - m.since;
    if (live < series[23] - 12) cleanIdx = 23;          // cleaned now (work order) or project reset
    series[23] = live;
    out.push({
      id: d.id, cls: 'det', dev: d, name: T(`${pad3(d.addr)} ${d.type === 'multi' ? 'Multi-criteria' : 'Smoke'} detector`, `${pad3(d.addr)} كاشف ${d.type === 'multi' ? 'متعدد المعايير' : 'دخان'}`),
      loc: T(`${d.floor}F · ${d.label.en}`, `${d.floor}F · ${d.label.ar}`), metric: T('Drift compensation (dirt)', 'تعويض الانجراف (الاتساخ)'), unit: '%',
      base: 0, thr: 80, series, segStart: cleanIdx, prior: m.rate, fault: d.fault, alert: d.dirt >= 0.8,
    });
  }
  const mk = (id, cls, name, loc, metric, unit, base, thr, fn, extra = {}) => {
    const r = rng('as:' + id); const series = [];
    const sv = S.serviced[id];
    for (let i = 0; i < 24; i++) series.push(fn(i, r));
    if (sv) series[23] = extra.after ?? base;
    out.push({ id, cls, name, loc, metric, unit, base, thr, series, segStart: sv ? 23 : (extra.seg ?? 0), prior: extra.prior ?? 0.05, info: extra.info, serviced: !!sv });
  };
  mk('FP-1', 'pump', T('FP-1 Electric fire pump 750 gpm', 'FP-1 مضخة حريق كهربائية 750 gpm'), T('Pump room · NFPA 20', 'غرفة المضخات · NFPA 20'), T('Vibration (overall, mm/s RMS)', 'الاهتزاز (الإجمالي، مم/ث RMS)'), 'mm/s', 1.4, 4.5,
    (i, r) => 1.7 + i * 0.012 + (r() - 0.5) * 0.25, { prior: 0.012, after: 1.5, info: T('Run hours 212 h · bearing 54 °C', 'ساعات التشغيل 212 س · المحمل 54 °م') });
  mk('FP-2', 'pump', T('FP-2 Diesel fire pump 750 gpm', 'FP-2 مضخة حريق ديزل 750 gpm'), T('Pump room · NFPA 20', 'غرفة المضخات · NFPA 20'), T('Vibration (overall, mm/s RMS)', 'الاهتزاز (الإجمالي، مم/ث RMS)'), 'mm/s', 1.4, 4.5,
    (i, r) => 2.0 + 0.0035 * i * i + i * 0.03 + (r() - 0.5) * 0.22, { prior: 0.15, seg: 10, after: 1.8, info: T('Run hours 486 h · bearing 71 °C ↑', 'ساعات التشغيل 486 س · المحمل 71 °م ↑') });
  mk('FP-2B', 'pump', T('FP-2 Diesel pump – drive-end bearing', 'FP-2 مضخة الديزل – محمل جهة الإدارة'), T('Pump room', 'غرفة المضخات'), T('Bearing temperature', 'حرارة المحمل'), '°C', 45, 82,
    (i, r) => 58 + i * 0.55 + (r() - 0.5) * 2, { prior: 0.55, after: 50, info: T('Alarm at 82 °C (manufacturer)', 'إنذار عند 82 °م (المصنع)') });
  mk('JP-1', 'pump', T('JP-1 Jockey pump', 'JP-1 مضخة التعويض (Jockey)'), T('Pump room', 'غرفة المضخات'), T('Starts per day', 'مرات التشغيل يومياً'), '/day', 4, 20,
    (i, r) => 5 + (i > 14 ? (i - 14) * 1.25 : 0) + (r() - 0.5) * 1.5, { prior: 1.2, seg: 15, after: 5, info: T('Short-cycling → hidden system leak', 'تشغيل متكرر قصير → تسرب مخفي في الشبكة') });
  mk('BAT-FACP', 'batt', T('FACP battery 2 × 12 V 18 Ah', 'بطارية اللوحة 2 × 12 فولت 18 أمبير·س'), T('Electrical room · age 30 mo', 'غرفة الكهرباء · العمر 30 شهراً'), T('Internal resistance', 'المقاومة الداخلية'), 'mΩ', 18, 27,
    (i, r) => 18.5 + i * 0.14 + (r() - 0.5) * 0.35, { prior: 0.14, after: 18, info: T('Replace at +50 % of baseline (IEEE 1188 practice)', 'الاستبدال عند +50% من خط الأساس (ممارسة IEEE 1188)') });
  mk('BAT-NAC', 'batt', T('NAC power extender battery 2 × 12 V 7 Ah', 'بطارية مُمدِّد دوائر الإنذار 2 × 12 فولت 7 أمبير·س'), T('Riser cupboard 2F · age 50 mo', 'خزانة الرايزر 2F · العمر 50 شهراً'), T('Internal resistance', 'المقاومة الداخلية'), 'mΩ', 22, 33,
    (i, r) => 25 + i * 0.3 + (r() - 0.5) * 0.5, { prior: 0.3, after: 22, info: T('Age 50 months – end of design life', 'العمر 50 شهراً – نهاية العمر التصميمي') });
  mk('BAT-DA', 'batt', T('Diesel starting battery – set A', 'بطارية تشغيل الديزل – المجموعة A'), T('Pump room · NFPA 20 §11.2.7', 'غرفة المضخات · NFPA 20 §11.2.7'), T('Internal resistance', 'المقاومة الداخلية'), 'mΩ', 4, 6,
    (i, r) => 4.1 + i * 0.07 + (r() - 0.5) * 0.12, { prior: 0.07, after: 4, info: T('Cranking voltage dip 9.6 V', 'هبوط جهد الإقلاع 9.6 فولت') });
  mk('BAT-DB', 'batt', T('Diesel starting battery – set B', 'بطارية تشغيل الديزل – المجموعة B'), T('Pump room · NFPA 20 §11.2.7', 'غرفة المضخات · NFPA 20 §11.2.7'), T('Internal resistance', 'المقاومة الداخلية'), 'mΩ', 4, 6,
    (i, r) => 4.1 + i * 0.012 + (r() - 0.5) * 0.12, { prior: 0.012, after: 4, info: T('Cranking voltage dip 10.8 V', 'هبوط جهد الإقلاع 10.8 فولت') });
  for (const a of out) analyse(a);
  return out;
}
function analyse(a) {
  const seg = a.series.map((y, i) => [i, y]).slice(a.segStart);
  const fit = seg.length >= 3 ? linreg(seg) : null;
  const cur = a.series[23];
  const slope = fit && fit.b > 0 ? fit.b : fit ? Math.max(fit.b, 0) : a.prior;
  a.fit = fit || { a: cur - a.prior * 23, b: a.prior, r2: null };
  if (!fit) a.fit = { a: cur - a.prior * 23, b: a.prior, r2: null };
  a.cur = cur; a.slope = slope;
  a.days = cur >= a.thr ? 0 : slope > 1e-6 ? (a.thr - cur) / slope * 30.44 : Infinity;
  const margin = clamp((a.thr - cur) / (a.thr - a.base), 0, 1);
  a.health = Math.round(100 * (0.6 * margin + 0.4 * clamp(a.days / 365, 0, 1)));
  a.risk = a.days <= 30 ? 'crit' : a.days <= 90 ? 'high' : a.days <= 180 ? 'med' : 'low';
  if (a.fault === 'dead') { a.health = 0; a.risk = 'crit'; }
}
const RISK = { crit: ['bad', T('Critical', 'حرج')], high: ['warn', T('High', 'مرتفع')], med: ['info', T('Medium', 'متوسط')], low: ['ok', T('Low', 'منخفض')] };
const CLS = { det: T('Detectors', 'الكواشف'), pump: T('Pumps', 'المضخات'), batt: T('Batteries', 'البطاريات') };
const fmtDays = (d) => (d === 0 ? L('now', 'الآن') : Number.isFinite(d) ? L(`${Math.round(d)} d`, `${Math.round(d)} يوم`) : L('> 5 y', '> 5 سنوات'));
const fmtV = (a, v = a.cur) => (a.unit === '%' ? v.toFixed(0) : a.unit === '/day' ? v.toFixed(0) : v.toFixed(a.unit === '°C' ? 0 : 2));

function spark(a) {
  const w = 96, h = 26; const ys = a.series; const lo = Math.min(a.base, ...ys), hi = Math.max(a.thr, ...ys) * 1.02;
  const Y = (v) => h - 2 - (v - lo) / (hi - lo) * (h - 4);
  const pts = ys.map((v, i) => `${(i / 23 * (w - 4) + 2).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const col = { crit: '#dc2626', high: '#d97706', med: '#2563eb', low: '#16a34a' }[a.risk];
  return `<svg class="mt-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><line x1="0" x2="${w}" y1="${Y(a.thr)}" y2="${Y(a.thr)}" stroke="#dc2626" stroke-width=".8" stroke-dasharray="3 2" opacity=".7"/>
    <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="${w - 2}" cy="${Y(ys[23])}" r="2.4" fill="${col}"/></svg>`;
}

// ───────────────────────── ITM tasks (NFPA 72 2022 Tables 14.3.1 / 14.4.3.2, NFPA 25 2023)
const FREQ = { W: [7, T('Weekly', 'أسبوعي')], M: [30, T('Monthly', 'شهري')], Q: [91, T('Quarterly', 'ربع سنوي')], SA: [182, T('Semi-annual', 'نصف سنوي')], A: [365, T('Annual', 'سنوي')], B: [730, T('2-yearly', 'كل سنتين')] };
const TASKS = [
  { id: 't1', f: 'W', last: -4, hrs: 0.75, cat: 'pump', name: T('Diesel fire pump no-flow (churn) test – 30 min', 'اختبار مضخة الديزل بدون تدفق (Churn) – 30 دقيقة'), ref: 'NFPA 25 §8.3.1.1' },
  { id: 't2', f: 'M', last: -36, hrs: 0.5, cat: 'pump', name: T('Electric fire pump no-flow (churn) test – 10 min', 'اختبار المضخة الكهربائية بدون تدفق – 10 دقائق'), ref: 'NFPA 25 §8.3.1.2' },
  { id: 't3', f: 'W', last: -9, hrs: 0.5, cat: 'batt', name: T('Diesel engine batteries – inspect terminals & electrolyte', 'بطاريات محرك الديزل – فحص الأطراف والإلكتروليت'), ref: 'NFPA 25 §8.2.2' },
  { id: 't4', f: 'M', last: -19, hrs: 0.5, cat: 'spk', name: T('Control valves (electrically supervised) – inspection', 'صمامات التحكم (المراقبة كهربائياً) – فحص'), ref: 'NFPA 25 §13.4.1.1' },
  { id: 't5', f: 'Q', last: -84, hrs: 1, cat: 'spk', name: T('Waterflow & supervisory alarm devices, FDC – inspection', 'أجهزة إنذار التدفق والإشراف ووصلة الدفاع المدني – فحص'), ref: 'NFPA 25 §5.2.5 · §13.7.1' },
  { id: 't6', f: 'SA', last: -171, hrs: 1.5, cat: 'fa', name: T("Waterflow switches – test via inspector's test valve (≤ 90 s)", 'مفاتيح التدفق – اختبار عبر صمام المفتش (≤ 90 ث)'), ref: 'NFPA 72 T.14.4.3.2 · NFPA 25 §5.3.3' },
  { id: 't7', f: 'SA', last: -64, hrs: 1, cat: 'fa', name: T('Valve tamper switches – test (≤ 2 turns)', 'مفاتيح عبث الصمامات – اختبار (≤ لفتين)'), ref: 'NFPA 72 T.14.4.3.2' },
  { id: 't8', f: 'SA', last: -193, hrs: 1, cat: 'batt', name: T('FACP VRLA battery – load voltage test', 'بطارية اللوحة VRLA – اختبار الجهد تحت الحمل'), ref: 'NFPA 72 T.14.4.3.2' },
  { id: 't9', f: 'A', last: -205, hrs: 2, cat: 'batt', name: T('FACP battery – charger & discharge test', 'بطارية اللوحة – اختبار الشاحن والتفريغ'), ref: 'NFPA 72 T.14.4.3.2' },
  { id: 't10', f: 'A', last: -298, hrs: 8, cat: 'fa', name: T('Initiating devices – annual functional test (100 %)', 'أجهزة الاستهلال – الاختبار الوظيفي السنوي (100%)'), ref: 'NFPA 72 T.14.4.3.2' },
  { id: 't11', f: 'B', last: -712, hrs: 6, cat: 'fa', name: T('Smoke detector sensitivity test (1 y after install, then every 2 y)', 'اختبار حساسية كواشف الدخان (بعد سنة من التركيب ثم كل سنتين)'), ref: 'NFPA 72 §14.4.4.3' },
  { id: 't12', f: 'A', last: -122, hrs: 3, cat: 'fa', name: T('Notification appliances – audibility & visibility test', 'أجهزة التنبيه – اختبار السمع والرؤية'), ref: 'NFPA 72 T.14.4.3.2' },
  { id: 't13', f: 'A', last: -377, hrs: 1.5, cat: 'spk', name: T('Main drain test (compare with baseline)', 'اختبار التصريف الرئيسي (مقارنة بخط الأساس)'), ref: 'NFPA 25 §13.2.5' },
  { id: 't14', f: 'A', last: -251, hrs: 4, cat: 'pump', name: T('Fire pump annual flow test (churn, 100 %, 150 %)', 'اختبار التدفق السنوي للمضخة (0، 100، 150%)'), ref: 'NFPA 25 §8.3.3' },
  { id: 't15', f: 'A', last: -33, hrs: 2, cat: 'spk', name: T('Sprinklers – visual inspection from floor level', 'الرشاشات – فحص بصري من مستوى الأرض'), ref: 'NFPA 25 §5.2.1' },
  { id: 't16', f: 'A', last: -150, hrs: 1, cat: 'fa', name: T('FACP, annunciators & off-premises transmission – test', 'اللوحة والمبينات والإرسال خارج الموقع – اختبار'), ref: 'NFPA 72 T.14.4.3.2' },
];
const CAT = { fa: ['#dc2626', T('Fire alarm', 'إنذار الحريق')], spk: ['#2563eb', T('Sprinkler', 'الرشاشات')], pump: ['#7c3aed', T('Fire pump', 'مضخة الحريق')], batt: ['#0d9488', T('Batteries', 'البطاريات')] };
function taskStatus(t) {
  const now = today0().getTime();
  const last = S.done[t.id] ? new Date(S.done[t.id]).getTime() : now + t.last * DAY;
  const iv = FREQ[t.f][0];
  const due = last + iv * DAY;
  const win = { W: 2, M: 7, Q: 14, SA: 30, A: 30, B: 45 }[t.f];
  const st = S.done[t.id] && now - last < DAY * 1 ? 'done' : due < now ? 'overdue' : due - now <= win * DAY ? 'due' : 'ok';
  return { last, due, st, late: Math.max(0, Math.round((now - due) / DAY)) };
}
const ST = { done: ['ok', T('Done', 'منجز')], ok: ['info', T('Scheduled', 'مجدول')], due: ['warn', T('Due', 'مستحق')], overdue: ['bad', T('Overdue', 'متأخر')] };

// ───────────────────────── work orders
function workOrders(sys, assets) {
  const wos = [];
  const seq = (k) => `WO-${new Date().getFullYear()}-${String(100 + (hash(k) % 900)).padStart(3, '0')}`;
  for (const a of assets.filter((x) => x.risk === 'crit' || x.risk === 'high')) {
    const prio = a.risk === 'crit' ? 'P1' : 'P2';
    let action, hrs;
    if (a.cls === 'det') {
      if (a.dev.fault === 'dead') { action = T('Replace detector – no answer from device', 'استبدال الكاشف – لا استجابة من الجهاز'); hrs = 0.75; }
      else if (a.cur >= 100) { action = T('Replace detector head – drift compensation limit reached', 'استبدال رأس الكاشف – بلوغ حد تعويض الانجراف'); hrs = 0.75; }
      else { action = T('Clean detector (vacuum / manufacturer kit), re-check sensitivity', 'تنظيف الكاشف (شفط / عدة المصنع) وإعادة فحص الحساسية'); hrs = 0.5; }
    } else if (a.id === 'FP-2' || a.id === 'FP-2B') { action = T('Vibration analysis, check alignment & re-grease/replace bearing', 'تحليل الاهتزاز وفحص المحاذاة وتشحيم/استبدال المحمل'); hrs = 4; }
    else if (a.id === 'JP-1') { action = T('Investigate jockey-pump short-cycling: leak survey, check valves', 'تحقيق في تشغيل مضخة التعويض المتكرر: مسح التسرب وفحص صمامات عدم الرجوع'); hrs = 3; }
    else if (a.cls === 'batt') { action = T('Replace battery set, record date code, re-measure', 'استبدال مجموعة البطاريات وتسجيل رمز التاريخ وإعادة القياس'); hrs = a.id === 'BAT-DA' ? 1.5 : 1; }
    else { action = T('Inspect & service', 'فحص وصيانة'); hrs = 1; }
    wos.push({ id: seq(a.id), key: 'a:' + a.id, prio, src: 'pred', asset: a, name: a.name, loc: a.loc, action, hrs, due: Date.now() + Math.max(0, a.days - 7) * DAY });
  }
  for (const t of TASKS) {
    const s = taskStatus(t);
    if (s.st === 'overdue' || s.st === 'due') wos.push({ id: seq(t.id), key: 't:' + t.id, prio: s.st === 'overdue' ? (t.cat === 'pump' || t.cat === 'batt' ? 'P1' : 'P2') : 'P3', src: 'itm', task: t, name: t.name, loc: T(t.ref, t.ref), action: T(`${FREQ[t.f][1].en} ITM – ${t.ref}`, `${FREQ[t.f][1].ar} – ${t.ref}`), hrs: t.hrs, due: s.due });
  }
  const po = { P1: 0, P2: 1, P3: 2 };
  return wos.sort((a, b) => po[a.prio] - po[b.prio] || a.due - b.due);
}

// ───────────────────────── challenge
function challengeSet(sys) {
  const dets = sys.devices.filter((d) => d.type === 'smoke' || d.type === 'multi').map((d) => ({ d, v: detAged(d).aged })).sort((a, b) => b.v - a.v).slice(0, 6);
  const c = dets.map(({ d, v }) => ({ id: 'c-' + d.id, name: v >= 100 ? T(`Replace detector ${pad3(d.addr)} (${d.floor}F ${d.label.en}) – drift ${v.toFixed(0)} %, FAULT`, `استبدال الكاشف ${pad3(d.addr)} (${d.floor}F ${d.label.ar}) – انجراف ${v.toFixed(0)}%، عطل`) : T(`Clean detector ${pad3(d.addr)} (${d.floor}F ${d.label.en}) – ${v.toFixed(0)} %`, `تنظيف الكاشف ${pad3(d.addr)} (${d.floor}F ${d.label.ar}) – ${v.toFixed(0)}%`), hrs: v >= 100 ? 1 : 0.5, val: Math.round(v >= 100 ? 10 : v >= 80 ? 7 : v >= 65 ? 3 : 1) }));
  return [
    { id: 'c-fp2', name: T('FP-2 diesel pump: vibration analysis & bearing service (4.9 mm/s, 71 °C)', 'FP-2 مضخة الديزل: تحليل الاهتزاز وصيانة المحمل (4.9 مم/ث، 71 °م)'), hrs: 4, val: 26 },
    { id: 'c-jp', name: T('JP-1 short-cycling (17 starts/day): leak survey', 'JP-1 تشغيل متكرر (17 مرة/يوم): مسح التسرب'), hrs: 3, val: 12 },
    { id: 'c-t2', name: T('Overdue: electric fire pump monthly churn test', 'متأخر: اختبار التشغيل الشهري للمضخة الكهربائية'), hrs: 0.5, val: 9 },
    { id: 'c-t3', name: T('Overdue: diesel engine battery weekly inspection', 'متأخر: الفحص الأسبوعي لبطاريات الديزل'), hrs: 0.5, val: 6 },
    { id: 'c-t13', name: T('Overdue: annual main drain test', 'متأخر: اختبار التصريف الرئيسي السنوي'), hrs: 1.5, val: 7 },
    { id: 'c-t8', name: T('Overdue: FACP battery load voltage test', 'متأخر: اختبار جهد بطارية اللوحة تحت الحمل'), hrs: 1, val: 5 },
    { id: 'c-bnac', name: T('Replace NAC extender batteries (50 months, 31.9 mΩ)', 'استبدال بطاريات مُمدِّد الإنذار (50 شهراً، 31.9 مΩ)'), hrs: 1, val: 8 },
    { id: 'c-bda', name: T('Replace diesel starting battery set A (5.7 mΩ)', 'استبدال بطارية تشغيل الديزل A (5.7 مΩ)'), hrs: 1.5, val: 9 },
    { id: 'c-t11', name: T('Detector sensitivity test – whole building', 'اختبار حساسية الكواشف – كامل المبنى'), hrs: 6, val: 11 },
    { id: 'c-t10', name: T('Annual functional test of all initiating devices (not due for 67 days)', 'الاختبار الوظيفي السنوي لكل الأجهزة (غير مستحق قبل 67 يوماً)'), hrs: 8, val: 4 },
    ...c,
  ];
}
function optimum(items, budget = 16) {
  const W = budget * 2; const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const w = Math.round(items[i - 1].hrs * 2), v = items[i - 1].val;
    for (let c = 0; c <= W; c++) dp[i][c] = Math.max(dp[i - 1][c], c >= w ? dp[i - 1][c - w] + v : 0);
  }
  const set = new Set(); let c = W;
  for (let i = n; i >= 1; i--) if (dp[i][c] !== dp[i - 1][c]) { set.add(items[i - 1].id); c -= Math.round(items[i - 1].hrs * 2); }
  return { val: dp[n][W], set };
}

// ═════════════════════════════════════════ module
const m = {
  id: 'maint', icon: '📊',
  title: { en: 'Predictive Maintenance', ar: 'الصيانة التنبؤية' },
  short: { en: 'Condition monitoring, ITM & work orders', ar: 'مراقبة الحالة والفحص والاختبار وأوامر العمل' },
  sub: {
    en: 'Run the building like a CMMS: 24 months of analog condition data from every detector, the fire pumps and the batteries, regression forecasts to the maintenance threshold, the NFPA 72 / NFPA 25 inspection-testing-maintenance calendar, work orders that act on the live panel — and plan a month of maintenance with limited technician hours.',
    ar: 'أدر المبنى كنظام إدارة صيانة (CMMS): بيانات حالة تناظرية لمدة 24 شهراً من كل كاشف ومضخات الحريق والبطاريات، وتنبؤات انحدار حتى حد الصيانة، وتقويم الفحص والاختبار والصيانة وفق NFPA 72 وNFPA 25، وأوامر عمل تؤثر على اللوحة الحية — ثم خطط لصيانة شهر بساعات فنيين محدودة.',
  },
  refs: ['NFPA 72 §14.3 · T.14.4.3.2', 'NFPA 72 §14.4.4.3', 'NFPA 25 (2023) §8.3', 'NFPA 25 §13.2.5', 'NFPA 20'],
  render(el, ctx) {
    S = { ...blank(), ...store.get(KEY, {}) };
    const sys = ctx.sys;
    if (!S.imported) importHistory(sys);
    const TABS = [
      { id: 'fleet', label: L('1 · Fleet health', '1 · صحة الأصول') },
      { id: 'itm', label: L('2 · ITM schedule', '2 · جدول الفحص والاختبار') },
      { id: 'wo', label: L('3 · Work orders', '3 · أوامر العمل') },
      { id: 'plan', label: L('4 · Challenge: plan the month', '4 · التحدي: خطّط للشهر') },
    ];
    el.innerHTML = header(m) + '<div id="mtTabs"></div><div id="mtBody" class="mt"></div>';
    const tabsEl = el.querySelector('#mtTabs'), body = el.querySelector('#mtBody');
    let clean = null;
    const show = (id) => {
      if (clean) { try { clean(); } catch { /* ignore */ } clean = null; }
      S.tab = id; save();
      tabsEl.innerHTML = tabBar(TABS, id);
      tabsEl.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => show(b.dataset.tab); });
      clean = ({ fleet: tabFleet, itm: tabItm, wo: tabWo, plan: tabPlan }[id] || tabFleet)(body, ctx, show) || null;
    };
    show(S.tab);
    return () => { if (clean) clean(); };
  },
};
export default m;

function importHistory(sys) {
  for (const d of sys.devices) if (d.type === 'smoke' || d.type === 'multi') sys.setDirt(d.id, detAged(d).aged / 100);
  S.imported = true; S.serviced = {}; S.woDone = {}; save();
  sys.evaluate();
}
function maintAlerts(sys) { return [...sys.events.values()].filter((e) => e.key.startsWith('trb:maint:') || e.key.startsWith('trb:dirt:')); }

// ═════════════════════════════════════════ TAB 1 — fleet
function tabFleet(body, ctx) {
  const sys = ctx.sys;
  let chart = null;
  const draw = () => {
    const assets = buildAssets(sys);
    if (!S.sel || !assets.find((a) => a.id === S.sel)) S.sel = [...assets].sort((a, b) => a.days - b.days)[0].id;
    const sel = assets.find((a) => a.id === S.sel);
    const k = S.sort.k, dir = S.sort.d;
    const key = { name: (a) => tr(a.name), cls: (a) => a.cls, cur: (a) => a.cur / a.thr, health: (a) => a.health, days: (a) => (Number.isFinite(a.days) ? a.days : 1e9) }[k];
    const list = assets.filter((a) => (S.cls === 'all' || a.cls === S.cls) && (!S.risk || a.risk === 'crit' || a.risk === 'high'))
      .sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * dir; });
    const avg = Math.round(assets.reduce((s, a) => s + a.health, 0) / assets.length);
    const crit = assets.filter((a) => a.risk === 'crit').length, high = assets.filter((a) => a.risk === 'high').length;
    const overdue = TASKS.filter((t) => taskStatus(t).st === 'overdue').length;
    const alerts = maintAlerts(sys).length;
    const th = (id, lab, cls = '') => `<th class="mt-sort ${cls} ${k === id ? 'on' : ''}" data-sort="${id}">${lab}${k === id ? (dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
    body.innerHTML = `
    ${S.imported ? `<div class="adv-callout mt-imp"><span>📥 ${L('24 months of analog-value history imported from the panel (detector drift compensation), pump monitors and battery testers. The live panel now reflects the aged fleet.', 'تم استيراد 24 شهراً من سجل القيم التناظرية من اللوحة (تعويض انجراف الكواشف) ومراقبات المضخات وأجهزة فحص البطاريات. اللوحة الحية تعكس الآن حالة الأصول المتقادمة.')}</span>
      <button class="btn sm" id="mtReimp">↺ ${L('Re-import field history', 'إعادة استيراد السجل')}</button></div>` : ''}
    <div class="adv-stats mt-kpis">
      ${stat(L('Assets monitored', 'الأصول المراقَبة'), assets.length)}
      ${stat(L('Fleet health index', 'مؤشر صحة الأصول'), avg, '/100', avg >= 70 ? 'ok' : avg >= 50 ? 'warn' : 'alarm')}
      ${stat(L('Critical (≤ 30 days)', 'حرج (≤ 30 يوماً)'), crit, '', crit ? 'alarm' : 'ok')}
      ${stat(L('High (≤ 90 days)', 'مرتفع (≤ 90 يوماً)'), high, '', high ? 'warn' : '')}
      ${stat(L('FACP maintenance alerts', 'تنبيهات صيانة اللوحة'), alerts, '', alerts ? 'alarm' : 'ok')}
      ${stat(L('Overdue ITM tasks', 'مهام فحص متأخرة'), overdue, '', overdue ? 'alarm' : 'ok')}
    </div>
    <div class="mt-grid">
      <div class="card mt-risk">
        <h3>${L('RISK REGISTER', 'سجل المخاطر')}<span class="r mt-chips">
          ${[['all', L('All', 'الكل')], ...Object.entries(CLS).map(([k2, v]) => [k2, tr(v)])].map(([k2, v]) => `<button data-cls="${k2}" class="${S.cls === k2 ? 'on' : ''}">${esc(v)}</button>`).join('')}
          <button data-risk class="${S.risk ? 'on' : ''}">⚠ ${L('At risk', 'معرّض للخطر')}</button></span></h3>
        <div class="adv-scroll mt-scroll"><table class="adv-table mt-tbl">
          <thead><tr>${th('name', L('Asset', 'الأصل'))}${th('cur', L('Condition', 'الحالة'), 'num')}<th>${L('24-month trend', 'اتجاه 24 شهراً')}</th>${th('health', L('Health', 'الصحة'), 'num')}${th('days', L('To threshold', 'حتى الحد'), 'num')}<th>${L('Risk', 'الخطورة')}</th></tr></thead>
          <tbody>${list.map((a) => `<tr data-a="${a.id}" class="${a.id === S.sel ? 'sel' : ''}">
            <td><div class="mt-an">${esc(tr(a.name))}</div><div class="mt-al">${esc(tr(a.loc))}</div></td>
            <td class="num">${fmtV(a)} <small>${esc(a.unit)}</small><div class="mt-al">${L('limit', 'الحد')} ${a.thr}</div></td>
            <td>${spark(a)}</td>
            <td class="num"><div class="mt-hb"><i style="width:${a.health}%;background:${a.health >= 70 ? 'var(--ok)' : a.health >= 40 ? 'var(--warn)' : 'var(--alarm)'}"></i></div>${a.health}</td>
            <td class="num">${fmtDays(a.days)}</td>
            <td><span class="adv-pill ${RISK[a.risk][0]}">${esc(tr(RISK[a.risk][1]))}</span></td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="card mt-detail">
        <h3>${esc(tr(sel.name))}<span class="r adv-pill ${RISK[sel.risk][0]}">${esc(tr(RISK[sel.risk][1]))}</span></h3>
        <div class="mt-sub">${esc(tr(sel.loc))} · ${esc(tr(sel.metric))}</div>
        <div style="height:280px"><canvas id="mtChart"></canvas></div>
        <div class="mt-kv">
          <div><span>${L('Current', 'الحالي')}</span><b>${N(fmtV(sel) + ' ' + sel.unit)}</b></div>
          <div><span>${L('Trend (regression)', 'الاتجاه (انحدار)')}</span><b>${N((sel.slope >= 0 ? '+' : '') + sel.slope.toFixed(sel.unit === '%' ? 2 : 3) + ' ' + sel.unit + '/mo')}</b></div>
          <div><span>R²</span><b>${N(sel.fit.r2 == null ? L('prior', 'مسبق') : sel.fit.r2.toFixed(2))}</b></div>
          <div><span>${L('Threshold', 'الحد')}</span><b>${N(sel.thr + ' ' + sel.unit)}</b></div>
          <div><span>${L('Predicted crossing', 'موعد بلوغ الحد المتوقع')}</span><b>${N(Number.isFinite(sel.days) ? iso(Date.now() + sel.days * DAY) : '—')}</b></div>
          <div><span>${L('Health score', 'درجة الصحة')}</span><b>${N(sel.health + '/100')}</b></div>
        </div>
        ${sel.info ? `<div class="adv-note" style="margin-top:8px">${esc(tr(sel.info))}</div>` : ''}
        ${sel.cls === 'det' ? `<div class="adv-note" style="margin-top:8px">${L('The panel compensates for chamber contamination by raising the clean-air reference. At 80 % of the compensation range it raises a MAINTENANCE ALERT; at 100 % a detector FAULT — the detector can no longer be relied on.', 'تعوّض اللوحة اتساخ الحجرة برفع مرجع الهواء النظيف. عند 80% من مدى التعويض تُصدر تنبيه صيانة، وعند 100% عطل كاشف — لا يمكن الاعتماد على الكاشف.')}</div>` : ''}
      </div>
    </div>`;
    body.querySelectorAll('[data-a]').forEach((r) => { r.onclick = () => { S.sel = r.dataset.a; save(); draw(); }; });
    body.querySelectorAll('[data-sort]').forEach((h) => { h.onclick = () => { const id = h.dataset.sort; S.sort = { k: id, d: S.sort.k === id ? -S.sort.d : 1 }; save(); draw(); }; });
    body.querySelectorAll('[data-cls]').forEach((b) => { b.onclick = () => { S.cls = b.dataset.cls; save(); draw(); }; });
    body.querySelector('[data-risk]').onclick = () => { S.risk = !S.risk; save(); draw(); };
    body.querySelector('#mtReimp')?.addEventListener('click', () => { importHistory(sys); draw(); });
    drawChart(sel);
  };
  const drawChart = (a) => {
    chart?.destroy();
    const labels = []; const base = new Date(); base.setDate(1);
    for (let i = -23; i <= 12; i++) { const d = new Date(base); d.setMonth(d.getMonth() + i); labels.push(d.toLocaleDateString(L('en-GB', 'ar-EG-u-nu-latn'), { month: 'short', year: '2-digit' })); }
    const hist = [...a.series, ...new Array(12).fill(null)];
    const fitL = labels.map((_, i) => (i >= a.segStart && i <= 23 && a.fit.r2 != null ? a.fit.a + a.fit.b * i : null));
    const fc = labels.map((_, i) => (i >= 23 ? a.cur + a.slope * (i - 23) : null));
    const mu = css('--muted') || '#888', ln = css('--line') || '#ddd', ac = css('--accent') || '#0f9d8f';
    const cross = Number.isFinite(a.days) ? 23 + a.days / 30.44 : null;
    chart = new Chart(body.querySelector('#mtChart'), {
      type: 'line',
      data: { labels, datasets: [
        { label: L('History', 'السجل'), data: hist, borderColor: ac, backgroundColor: ac + '22', fill: true, pointRadius: 2, borderWidth: 2, tension: 0.15 },
        { label: L('Regression fit', 'خط الانحدار'), data: fitL, borderColor: '#64748b', borderWidth: 1.5, pointRadius: 0 },
        { label: L('Forecast', 'التنبؤ'), data: fc, borderColor: '#f59e0b', borderDash: [6, 4], borderWidth: 2, pointRadius: 0 },
        { label: L('Threshold', 'الحد'), data: labels.map(() => a.thr), borderColor: '#dc2626', borderDash: [3, 3], borderWidth: 1.5, pointRadius: 0 },
      ] },
      options: {
        animation: false, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: mu, boxWidth: 14, font: { size: 11 } } }, tooltip: { callbacks: { label: (c) => c.raw == null ? '' : `${c.dataset.label}: ${(+c.raw).toFixed(2)} ${a.unit}` } } },
        scales: { x: { ticks: { color: mu, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { color: ln } }, y: { ticks: { color: mu }, grid: { color: ln }, suggestedMin: a.base, suggestedMax: a.thr * 1.12, title: { display: true, text: a.unit, color: mu } } },
      },
      plugins: [{ id: 'mtNow', afterDraw(c) {
        const g = c.ctx, xs = c.scales.x, ys = c.scales.y; g.save();
        const x = xs.getPixelForValue(23); g.strokeStyle = mu; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x, c.chartArea.top); g.lineTo(x, c.chartArea.bottom); g.stroke();
        g.fillStyle = mu; g.font = '10px sans-serif'; g.fillText(L('today', 'اليوم'), x + 4, c.chartArea.top + 10);
        if (cross != null && cross <= 35) { const cx = xs.getPixelForValue(23) + (cross - 23) * (xs.getPixelForValue(24) - xs.getPixelForValue(23)); const cy = ys.getPixelForValue(a.thr);
          g.setLineDash([]); g.fillStyle = '#dc2626'; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill(); g.font = 'bold 11px sans-serif'; g.fillText(fmtDays(a.days), cx + 7, cy - 7); }
        g.restore();
      } }],
    });
  };
  draw();
  const iv = setInterval(() => { const tile = body.querySelectorAll('.mt-kpis .adv-stat .v')[4]; if (tile) tile.textContent = maintAlerts(sys).length; }, 1500);
  return () => { clearInterval(iv); chart?.destroy(); };
}

// ═════════════════════════════════════════ TAB 2 — ITM schedule
function tabItm(body) {
  const draw = () => {
    const now = today0(); const start = now.getTime() - 10 * DAY;
    const end = start + 365 * DAY;
    const span = end - start; const X = (t) => clamp((t - start) / span * 100, 0, 100);
    const months = [];
    for (let i = 0; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1); const e2 = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const x0 = X(Math.max(start, d.getTime())), x1 = X(Math.min(end, e2.getTime()));
      if (x1 - x0 < 0.5) continue;
      months.push({ x: x0, w: x1 - x0, lab: x1 - x0 > 5 ? d.toLocaleDateString(L('en-GB', 'ar-EG-u-nu-latn'), { month: 'short' }) : '', y: x1 - x0 > 5 && (d.getMonth() === 0 || !months.length) ? String(d.getFullYear()).slice(2) : '' });
    }
    const rows = TASKS.map((t) => ({ t, s: taskStatus(t) }));
    const over = rows.filter((r) => r.s.st === 'overdue'), due = rows.filter((r) => r.s.st === 'due');
    const eom = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const hrsMonth = rows.reduce((h, r) => {
      if (r.s.st === 'done') return h;
      const iv = FREQ[r.t.f][0] * DAY; let c = 0;
      for (let d = r.s.st === 'overdue' ? now.getTime() : r.s.due; d < eom; d += iv) c++;
      return h + c * r.t.hrs;
    }, 0);
    body.innerHTML = `
    <div class="adv-stats">
      ${stat(L('ITM tasks', 'مهام الفحص والاختبار'), TASKS.length)}
      ${stat(L('Overdue', 'متأخرة'), over.length, '', over.length ? 'alarm' : 'ok')}
      ${stat(L('Due soon', 'مستحقة قريباً'), due.length, '', due.length ? 'warn' : '')}
      ${stat(L('Completed today', 'أنجزت اليوم'), rows.filter((r) => r.s.st === 'done').length, '', 'ok')}
      ${stat(L('Planned hours this month', 'الساعات المخططة هذا الشهر'), hrsMonth.toFixed(1), 'h')}
    </div>
    ${over.length ? `<div class="adv-callout bad" style="margin-bottom:12px"><b>⚠ ${L(`${over.length} overdue task(s)`, `${over.length} مهمة متأخرة`)}</b> — ${over.map((r) => `${esc(tr(r.t.name))} <b>(${L(`${r.s.late} d late`, `متأخرة ${r.s.late} يوم`)})</b>`).join(' · ')}</div>` : `<div class="adv-callout" style="margin-bottom:12px">✓ ${L('No overdue inspection, testing or maintenance tasks.', 'لا توجد مهام فحص أو اختبار أو صيانة متأخرة.')}</div>`}
    <div class="card mt-gantt">
      <h3>${L('INSPECTION · TESTING · MAINTENANCE CALENDAR – NEXT 12 MONTHS', 'تقويم الفحص والاختبار والصيانة – الأشهر الـ12 القادمة')}<span class="r adv-legend" style="margin:0">${Object.values(CAT).map(([c, n]) => `<span><i style="background:${c}"></i>${esc(tr(n))}</span>`).join('')}</span></h3>
      <div class="mt-g">
        <div class="mt-g-head"><div class="mt-g-l">${L('Task', 'المهمة')}</div><div class="mt-g-f">${L('Frequency', 'التكرار')}</div><div class="mt-g-s">${L('Status', 'الحالة')}</div>
          <div class="mt-g-tl">${months.map((mo) => `<span style="inset-inline-start:${mo.x}%;width:${mo.w}%">${esc(mo.lab)}${mo.y ? ` <small>${mo.y}</small>` : ''}</span>`).join('')}</div><div class="mt-g-a"></div></div>
        ${rows.map(({ t, s }) => {
          const marks = []; const iv = FREQ[t.f][0] * DAY;
          if (s.st === 'overdue') marks.push(`<i class="mk over" style="inset-inline-start:${X(now.getTime())}%" title="${esc(L('Overdue', 'متأخر'))}"></i>`);
          for (let d = Math.max(s.due, s.st === 'overdue' ? now.getTime() + iv : s.due); d < end; d += iv) marks.push(`<i class="mk ${t.f === 'W' ? 'thin' : ''}" style="inset-inline-start:${X(d)}%;background:${CAT[t.cat][0]}" title="${iso(d)}"></i>`);
          return `<div class="mt-g-row ${s.st}"><div class="mt-g-l"><b>${esc(tr(t.name))}</b><small>${esc(t.ref)} · ${N(t.hrs + ' h')}</small></div>
            <div class="mt-g-f"><span class="mt-freq">${esc(tr(FREQ[t.f][1]))}</span></div>
            <div class="mt-g-s"><span class="adv-pill ${ST[s.st][0]}">${esc(tr(ST[s.st][1]))}</span><small>${s.st === 'overdue' ? L(`${s.late} days late`, `متأخرة ${s.late} يوم`) : N(iso(s.due))}</small></div>
            <div class="mt-g-tl">${months.map((mo, i) => `<span class="grid ${i % 2 ? 'alt' : ''}" style="inset-inline-start:${mo.x}%;width:${mo.w}%"></span>`).join('')}<span class="today" style="inset-inline-start:${X(now.getTime())}%"></span>${marks.join('')}</div>
            <div class="mt-g-a"><button class="btn sm ${s.st === 'overdue' ? 'danger' : s.st === 'due' ? 'primary' : ''}" data-done="${t.id}" ${s.st === 'done' ? 'disabled' : ''}>✓ ${L('Done', 'تم')}</button></div></div>`;
        }).join('')}
      </div>
      <div class="adv-btns" style="margin-top:10px"><button class="btn sm ghost" id="mtItmReset">↺ ${L('Reset schedule to the imported state', 'إعادة الجدول إلى الحالة المستوردة')}</button>
      <span class="adv-note" style="flex:1">${L('Frequencies: NFPA 72 (2022) Tables 14.3.1 & 14.4.3.2, NFPA 25 (2023): diesel pumps weekly and electric pumps monthly no-flow tests; detector sensitivity 1 year after installation then every alternate year (up to 5 years when results stay within the listed range).', 'التكرارات: جداول NFPA 72 (2022) 14.3.1 و14.4.3.2 وNFPA 25 (2023): اختبار بدون تدفق أسبوعي لمضخات الديزل وشهري للكهربائية؛ حساسية الكواشف بعد سنة من التركيب ثم كل سنتين (حتى 5 سنوات إذا بقيت النتائج ضمن المدى).')}</span></div>
    </div>`;
    body.querySelectorAll('[data-done]').forEach((b) => { b.onclick = () => { S.done[b.dataset.done] = iso(Date.now()); save(); draw(); }; });
    body.querySelector('#mtItmReset').onclick = () => { S.done = {}; save(); draw(); };
  };
  draw();
  return null;
}

// ═════════════════════════════════════════ TAB 3 — work orders
function tabWo(body, ctx) {
  const sys = ctx.sys;
  const draw = () => {
    const assets = buildAssets(sys);
    const wos = workOrders(sys, assets);
    const done = Object.values(S.woDone).sort((a, b) => b.at.localeCompare(a.at));
    const hrs = wos.reduce((s, w) => s + w.hrs, 0);
    body.innerHTML = `
    <div class="adv-stats">
      ${stat(L('Open work orders', 'أوامر عمل مفتوحة'), wos.length)}
      ${stat('P1', wos.filter((w) => w.prio === 'P1').length, '', 'alarm')}
      ${stat('P2', wos.filter((w) => w.prio === 'P2').length, '', 'warn')}
      ${stat(L('Estimated labour', 'العمالة المقدّرة'), hrs.toFixed(1), 'h')}
      ${stat(L('Completed', 'مكتملة'), done.length, '', 'ok')}
    </div>
    <div class="mt-grid">
      <div class="card"><h3>${L('WORK ORDER QUEUE – AUTO-GENERATED', 'قائمة أوامر العمل – مولّدة تلقائياً')}<span class="r adv-pill info">${L('from predictions + ITM', 'من التنبؤات + جدول الفحص')}</span></h3>
        <div class="adv-scroll" style="max-height:600px"><table class="adv-table mt-wo">
          <thead><tr><th>${L('WO #', 'رقم الأمر')}</th><th>${L('Prio', 'الأولوية')}</th><th>${L('Asset / task', 'الأصل / المهمة')}</th><th>${L('Action', 'الإجراء')}</th><th class="num">${L('Est.', 'تقدير')}</th><th class="num">${L('Due', 'الاستحقاق')}</th><th></th></tr></thead>
          <tbody>${wos.map((w) => `<tr><td class="mt-won">${w.id}<div class="mt-al">${w.src === 'pred' ? '📈 ' + L('predictive', 'تنبؤي') : '🗓 ITM'}</div></td>
            <td><span class="mt-prio ${w.prio}">${w.prio}</span></td>
            <td><div class="mt-an">${esc(tr(w.name))}</div><div class="mt-al">${esc(tr(w.loc))}</div></td>
            <td class="mt-act">${esc(tr(w.action))}</td><td class="num">${w.hrs} h</td><td class="num">${w.due < Date.now() ? `<span style="color:var(--alarm)">${iso(w.due)}</span>` : iso(w.due)}</td>
            <td><button class="btn sm primary" data-wo="${w.key}">${w.asset?.cls === 'det' ? (w.asset.cur >= 100 || w.asset.dev.fault === 'dead' ? '🔁 ' + L('Replace', 'استبدال') : '🧽 ' + L('Clean detector', 'تنظيف الكاشف')) : '✓ ' + L('Complete', 'إنجاز')}</button></td></tr>`).join('') || `<tr><td colspan="7"><div class="adv-callout">✓ ${L('No open work orders — every asset is within limits and every ITM task is current.', 'لا توجد أوامر عمل مفتوحة — كل الأصول ضمن الحدود وكل المهام محدثة.')}</div></td></tr>`}</tbody></table></div>
        ${wos.some((w) => w.asset?.cls === 'det') ? `<div class="adv-btns" style="margin-top:10px"><button class="btn" id="mtCleanAll">🧽 ${L('Complete all detector cleaning work orders', 'إنجاز كل أوامر تنظيف الكواشف')}</button></div>` : ''}
      </div>
      <div class="mt-side">
        <div class="hmi"><div class="hmi-bar"><span class="dot" id="mtDot" style="border-radius:50%;display:inline-block"></span> FACP · LOOP 1 · MAINTENANCE VIEW<span style="margin-left:auto" id="mtClock"></span></div><div id="mtLcd"></div></div>
        <div class="card"><h3>${L('COMPLETED WORK ORDERS', 'أوامر العمل المكتملة')}</h3>
          <div class="adv-log" style="max-height:260px">${done.length ? done.map((d) => `<div class="ok"><span class="t">${d.at.slice(5, 16).replace('T', ' ')}</span>${esc(d.id)} – ${esc(tr(d.name))}</div>`).join('') : `<div class="t">${L('Nothing completed yet.', 'لم يُنجز شيء بعد.')}</div>`}</div></div>
        <div class="adv-callout">${L('Cleaning a detector resets its drift-compensation value on the live panel (sys.setDirt → 5 %). Watch the maintenance alert clear on the FACP display.', 'تنظيف الكاشف يعيد قيمة تعويض الانجراف على اللوحة الحية (5%). راقب زوال تنبيه الصيانة على شاشة اللوحة.')}</div>
      </div>
    </div>`;
    const complete = (w) => {
      if (w.asset?.cls === 'det') { sys.setDirt(w.asset.id, 0.05); if (w.asset.dev.fault === 'dead') sys.setFault(w.asset.id, null); }
      else if (w.asset) S.serviced[w.asset.id] = iso(Date.now());
      if (w.task) S.done[w.task.id] = iso(Date.now());
      S.woDone[w.key + ':' + Date.now()] = { id: w.id, name: w.name, at: new Date().toISOString() };
    };
    body.querySelectorAll('[data-wo]').forEach((b) => { b.onclick = () => { const w = wos.find((x) => x.key === b.dataset.wo); if (!w) return; complete(w); save(); sys.evaluate(); draw(); }; });
    body.querySelector('#mtCleanAll')?.addEventListener('click', () => { for (const w of wos.filter((x) => x.asset?.cls === 'det')) complete(w); save(); sys.evaluate(); draw(); });
    lcd();
  };
  const lcd = () => {
    const el = body.querySelector('#mtLcd'); if (!el) return;
    const al = maintAlerts(sys);
    const dets = sys.devices.filter((d) => d.type === 'smoke' || d.type === 'multi').sort((a, b) => b.dirt - a.dirt).slice(0, 6);
    body.querySelector('#mtDot').style.background = al.length ? '#f59e0b' : '#22c55e';
    body.querySelector('#mtClock').textContent = new Date().toLocaleTimeString('en-GB');
    el.innerHTML = `<div class="mt-lcd">${al.length ? al.slice(0, 7).map((e) => `<div class="trb">TRBL  ${esc(tr(e.text))}</div>`).join('') : '<div class="okk">SYSTEM NORMAL – NO MAINTENANCE ALERTS</div>'}</div>
      <table><thead><tr><th>ADDR</th><th>DEVICE</th><th style="text-align:right">DRIFT</th><th></th></tr></thead><tbody>
      ${dets.map((d) => `<tr><td>${pad3(d.addr)}</td><td>${esc(d.floor + 'F ' + d.label.en)}</td><td style="text-align:right;color:${d.dirt >= 1 ? '#f87171' : d.dirt >= 0.8 ? '#fbbf24' : '#86efac'}">${Math.round(d.dirt * 100)}%</td>
        <td style="width:70px"><div class="mt-mini"><i style="width:${Math.min(100, d.dirt * 100)}%;background:${d.dirt >= 1 ? '#ef4444' : d.dirt >= 0.8 ? '#f59e0b' : '#22c55e'}"></i></div></td></tr>`).join('')}</tbody></table>`;
  };
  draw();
  const iv = setInterval(lcd, 1000);
  return () => clearInterval(iv);
}

// ═════════════════════════════════════════ TAB 4 — planning challenge
function tabPlan(body, ctx) {
  const sys = ctx.sys; const BUDGET = 16;
  const items = challengeSet(sys); const opt = optimum(items, BUDGET);
  const draw = () => {
    const chosen = items.filter((i) => S.pick[i.id]);
    const hrs = chosen.reduce((s, i) => s + i.hrs, 0), val = chosen.reduce((s, i) => s + i.val, 0);
    const over = hrs > BUDGET; const res = S.result;
    body.innerHTML = `
    <div class="adv-callout" style="margin-bottom:12px"><b>${L('Challenge', 'التحدي')}:</b> ${L(`You have ${BUDGET} technician-hours this month. Select the work orders that remove the most risk. Each item shows its risk-reduction points (likelihood × consequence from the predictive model). Code-required overdue tests and life-safety pumps usually outrank routine work.`, `لديك ${BUDGET} ساعة فنّي هذا الشهر. اختر أوامر العمل التي تزيل أكبر قدر من المخاطر. يظهر لكل بند نقاط خفض المخاطر (الاحتمال × العاقبة من النموذج التنبؤي). الاختبارات المتأخرة المطلوبة بالكود ومضخات السلامة تتقدم عادةً على الأعمال الروتينية.`)}</div>
    <div class="mt-grid">
      <div class="card"><h3>${L('CANDIDATE WORK ORDERS', 'أوامر العمل المرشحة')}</h3>
        <table class="adv-table mt-plan"><thead><tr><th></th><th>${L('Work order', 'أمر العمل')}</th><th class="num">${L('Hours', 'الساعات')}</th><th class="num">${L('Risk ↓ pts', 'خفض المخاطر')}</th>${res ? `<th class="num">${L('pts / h', 'نقاط/ساعة')}</th>` : ''}</tr></thead>
        <tbody>${items.map((i) => `<tr class="${S.pick[i.id] ? 'on' : ''} ${res && opt.set.has(i.id) ? 'opt' : ''}"><td><input type="checkbox" data-pk="${i.id}" ${S.pick[i.id] ? 'checked' : ''}></td>
          <td>${esc(tr(i.name))}${res && opt.set.has(i.id) ? ` <span class="adv-pill ok">${L('optimal', 'أمثل')}</span>` : ''}</td><td class="num">${i.hrs}</td><td class="num"><b>${i.val}</b></td>${res ? `<td class="num">${(i.val / i.hrs).toFixed(1)}</td>` : ''}</tr>`).join('')}</tbody></table>
      </div>
      <div class="mt-side">
        <div class="card"><h3>${L('MONTHLY PLAN', 'الخطة الشهرية')}</h3>
          <div class="mt-budget"><div class="mt-bb"><i style="width:${Math.min(100, hrs / BUDGET * 100)}%;background:${over ? 'var(--alarm)' : 'var(--accent)'}"></i></div>
            <div class="mt-bl">${N(hrs.toFixed(1) + ' / ' + BUDGET + ' h')}</div></div>
          <div class="adv-stats" style="margin-top:10px">${stat(L('Risk removed', 'المخاطر المزالة'), val, 'pts')}${stat(L('Work orders', 'أوامر العمل'), chosen.length)}</div>
          ${over ? `<div class="adv-callout bad">${L('Over budget — remove some work orders.', 'تجاوزت الميزانية — أزل بعض أوامر العمل.')}</div>` : ''}
          <div class="adv-btns" style="margin-top:10px"><button class="btn primary" id="mtSubmit" ${over || !chosen.length ? 'disabled' : ''}>📋 ${L('Submit plan', 'تسليم الخطة')}</button><button class="btn ghost" id="mtClear">↺ ${L('Clear', 'مسح')}</button></div>
          ${res ? scoreBanner(res.score, L(`Your plan removes ${res.val} of the ${opt.val} risk points achievable in ${BUDGET} h.`, `خطتك تزيل ${res.val} من أصل ${opt.val} نقطة مخاطر ممكنة في ${BUDGET} ساعة.`)) : ''}
          ${res ? `<div class="adv-note">${L('The optimum (0/1 knapsack on half-hour slots) is highlighted in the table. Notice how the overdue code-required tests and the failing diesel pump bearing dominate, while the 8-hour annual test that is not yet due gives little risk reduction per hour.', 'الحل الأمثل (مسألة حقيبة الظهر 0/1 على فترات نصف ساعة) مظلّل في الجدول. لاحظ كيف تتصدر الاختبارات المتأخرة المطلوبة بالكود ومحمل مضخة الديزل المتدهور، بينما يعطي الاختبار السنوي ذو الثماني ساعات غير المستحق بعد خفضاً قليلاً للمخاطر لكل ساعة.')}</div>` : ''}
        </div>
      </div>
    </div>`;
    body.querySelectorAll('[data-pk]').forEach((c) => { c.onchange = () => { S.pick[c.dataset.pk] = c.checked; save(); draw(); }; });
    body.querySelector('#mtClear').onclick = () => { S.pick = {}; S.result = null; save(); draw(); };
    body.querySelector('#mtSubmit').onclick = () => {
      const score = Math.round(100 * val / opt.val);
      S.result = { score, val, at: iso(Date.now()) }; save();
      markDone('maint', score);
      ctx.helpers?.recordResult?.({ type: 'lab', topic: 'maint/monthly-plan', score, total: 100 });
      draw();
    };
  };
  draw();
  return null;
}
