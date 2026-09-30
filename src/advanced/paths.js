// Module 10 — Learning paths, final practical exam, printable certificates with an offline
// verification code, and the instructor dashboard (per-student progress heat-map, weak areas, CSV).
import { QUIZ } from '../data/quiz.js';
import { ADV_QUIZ } from './advQuiz.js';
import { isSupervisor } from '../ui/license.js';
import { header, L, esc, tr, store, progress, markDone, tabBar, scoreBanner, printDoc, download, mmss } from './ui.js';

const T = (en, ar) => ({ en, ar });
const MODS = {
  facp: T('Panel lab', 'مختبر اللوحة'), cause: T('Cause & effect', 'السبب والنتيجة'), bms: T('BMS integration', 'التكامل مع BMS'), install: T('Installation', 'التركيب'),
  commission: T('Commissioning', 'الاستلام'), maint: T('Predictive maintenance', 'الصيانة التنبؤية'), incident: T('Incident commander', 'قائد الحادثة'),
  tech: T('Modern technologies', 'التقنيات الحديثة'), tools: T('Engineering tools', 'الأدوات الهندسية'),
};
export const PATHS = [
  { id: 'tech', icon: '🔧', color: '#0ea5e9', name: T('Fire Alarm Technician', 'فني أنظمة إنذار الحريق'), desc: T('Install, test and maintain addressable systems.', 'تركيب واختبار وصيانة الأنظمة المعنونة.'),
    req: { facp: 60, install: 60, commission: 60, maint: 60 }, topics: ['slc', 'install', 'itm', 'commission', 'detection'] },
  { id: 'eng', icon: '🧑‍💻', color: '#0f9d8f', name: T('Smart Systems Engineer', 'مهندس الأنظمة الذكية'), desc: T('Program, integrate and commission complete smart fire systems.', 'برمجة وربط واستلام أنظمة الحريق الذكية الكاملة.'),
    req: { facp: 80, cause: 80, bms: 60, install: 80, commission: 70, tools: 60 }, topics: ['slc', 'ce', 'integration', 'detection', 'voice', 'commission'] },
  { id: 'sup', icon: '🧑‍✈️', color: '#f59e0b', name: T('Fire Safety Supervisor', 'مشرف السلامة من الحريق'), desc: T('Operate the building in emergencies and manage ITM & impairments.', 'تشغيل المبنى في الطوارئ وإدارة الفحص والصيانة والتعطيلات.'),
    req: { cause: 70, bms: 80, maint: 80, incident: 80 }, topics: ['ce', 'integration', 'voice', 'itm'] },
  { id: 'des', icon: '📐', color: '#8b5cf6', name: T('Fire Protection Designer', 'مصمم أنظمة الحماية من الحريق'), desc: T('Design layouts, hydraulics, power and logic to code.', 'تصميم التوزيع والهيدروليك والطاقة والمنطق وفق الأكواد.'),
    req: { cause: 90, install: 90, tools: 80, tech: 80 }, topics: ['ce', 'detection', 'tech', 'install', 'itm'] },
];

// deterministic 64-bit style hash → 16 hex (cyrb53 ×2) used for the offline verification code
function hash(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}
export const certCode = (c) => (hash(`FTW-CERT|${c.name.trim().toLowerCase()}|${c.level}|${c.date}|${c.score}|${c.no}`, 7) + hash(`${c.no}|${c.score}`, 91)).slice(0, 16).toUpperCase().replace(/(.{4})/g, '$1-').slice(0, 19);

const me = () => { try { return localStorage.getItem('ftw.student') || ''; } catch { return ''; } };
const setMe = (n, g) => { try { localStorage.setItem('ftw.student', n); if (g != null) localStorage.setItem('ftw.group', g); } catch { /* ignore */ } };

const m = {
  id: 'paths', icon: '🎓',
  title: T('Learning Paths & Certificates', 'المسارات التعليمية والشهادات'),
  short: T('Levels, final exam, certificates', 'المستويات والاختبار النهائي والشهادات'),
  sub: T('Four professional paths — Technician, Engineer, Supervisor, Designer. Complete the required labs, pass the final exam (≥ 80 %) and print a certificate with a verification code that any employer can check offline in this program.',
    'أربعة مسارات مهنية — فني، مهندس، مشرف، مصمم. أكمل المختبرات المطلوبة، واجتز الاختبار النهائي (≥ 80%)، واطبع شهادة برمز تحقق يمكن لأي جهة عمل التحقق منه دون إنترنت في هذا البرنامج.'),
  refs: ['NFPA 72 §10.5 Personnel qualifications', 'NFPA 25 §4.4', 'NICET Level I–IV (reference)'],
};

function pathStatus(p) {
  const pr = progress();
  const items = Object.entries(p.req).map(([k, v]) => ({ k, need: v, got: pr[k] ?? 0, ok: (pr[k] ?? 0) >= v }));
  const pct = Math.round((100 * items.reduce((a, x) => a + Math.min(1, x.got / x.need), 0)) / items.length);
  return { items, pct, ready: items.every((x) => x.ok) };
}

function certHtml(c) {
  const p = PATHS.find((x) => x.id === c.level);
  const code = certCode(c);
  const bits = hash(code, 3) + hash(code, 5) + hash(code, 11);
  const N = 17;
  const cells = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const finder = (x < 5 && y < 5) || (x > N - 6 && y < 5) || (x < 5 && y > N - 6);
    const on = finder ? (x % (N - 5) === 0 || y % (N - 5) === 0 || x % (N - 5) === 4 || y % (N - 5) === 4 || ((x % (N - 5)) >= 1.5 && (x % (N - 5)) <= 2.5 && (y % (N - 5)) >= 1.5 && (y % (N - 5)) <= 2.5)) : parseInt(bits[(x * 7 + y * 3) % bits.length], 16) % 2 === 1;
    if (on) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  }
  const rows = Object.entries(p.req).map(([k]) => `<tr><td>${esc(MODS[k].en)}</td><td style="text-align:right;direction:rtl">${esc(MODS[k].ar)}</td><td style="text-align:center;font-weight:700">${c.mods?.[k] ?? '—'}%</td></tr>`).join('');
  return `<div style="width:190mm;min-height:270mm;margin:0 auto;padding:10mm;box-sizing:border-box;font-family:'Segoe UI',Tahoma,sans-serif;color:#1f2937;position:relative;border:3mm solid ${p.color};outline:1mm solid #1f2937;outline-offset:-6mm;background:linear-gradient(180deg,#fff,#fbfaf6)">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><img src="assets/asfan-logo.png" alt="ASFAN" style="height:11mm;display:block"/><div style="font-size:8pt;color:#6b7280;margin-top:1.5mm">Fire Protection Digital Twin · Smart Systems Lab</div></div>
      <div style="text-align:right;font-size:8.5pt;color:#6b7280">No. <b style="color:#111">${esc(c.no)}</b><br>${esc(c.date)}</div></div>
    <div style="text-align:center;margin-top:14mm">
      <div style="font-size:11pt;letter-spacing:.35em;color:${p.color};font-weight:800">CERTIFICATE OF COMPETENCE</div>
      <div style="font-size:15pt;font-weight:800;margin-top:2mm;direction:rtl">شهادة كفاءة</div>
      <div style="margin-top:10mm;font-size:10pt;color:#6b7280">This is to certify that · نشهد بأن</div>
      <div style="font-size:26pt;font-weight:800;margin:4mm 0;font-family:Georgia,'Times New Roman',serif;color:#0f172a">${esc(c.name)}</div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,${p.color},transparent);margin:0 20mm"></div>
      <div style="margin-top:6mm;font-size:10.5pt;line-height:1.6">has successfully completed the practical path<br><b style="font-size:14pt;color:${p.color}">${p.icon} ${esc(p.name.en)}</b><br>of smart (addressable) fire-alarm & life-safety systems.</div>
      <div style="margin-top:3mm;font-size:11pt;line-height:1.7;direction:rtl">قد أتمّ بنجاح المسار العملي <b style="color:${p.color}">${esc(p.name.ar)}</b><br>لأنظمة إنذار الحريق والسلامة الذكية (المعنونة).</div>
    </div>
    <table style="width:100%;margin-top:9mm;border-collapse:collapse;font-size:9.5pt">
      <tr style="background:#f1f5f9"><th style="text-align:left;padding:5px">Practical module</th><th style="text-align:right;padding:5px;direction:rtl">الوحدة العملية</th><th style="padding:5px">Score</th></tr>${rows}
      <tr style="border-top:2px solid #1f2937"><td style="padding:6px;font-weight:700">Final examination</td><td style="text-align:right;font-weight:700;direction:rtl">الاختبار النهائي</td><td style="text-align:center;font-weight:800;color:${p.color}">${c.score}%</td></tr></table>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14mm;gap:8mm">
      <div style="text-align:center;flex:1"><div style="height:14mm"></div><div style="border-top:1px solid #1f2937;padding-top:2mm;font-size:8.5pt">${esc(c.instructor || '')}<br><span style="color:#6b7280">Instructor · المدرّب</span></div></div>
      <svg viewBox="0 0 120 120" width="30mm" height="30mm"><defs><path id="sealP" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs><circle cx="60" cy="60" r="56" fill="${p.color}" opacity=".12"/><circle cx="60" cy="60" r="54" fill="none" stroke="${p.color}" stroke-width="2.5"/><circle cx="60" cy="60" r="34" fill="none" stroke="${p.color}" stroke-width="1.5"/>
        <text font-size="9" font-weight="700" fill="${p.color}" letter-spacing="2"><textPath href="#sealP">ASFAN · FIRE PROTECTION TRAINING · SMART LAB ·</textPath></text><text x="60" y="58" text-anchor="middle" font-size="22">${p.icon}</text><text x="60" y="76" text-anchor="middle" font-size="9" font-weight="800" fill="${p.color}">CERTIFIED</text></svg>
      <div style="text-align:center;flex:1"><div style="height:14mm"></div><div style="border-top:1px solid #1f2937;padding-top:2mm;font-size:8.5pt">ASFAN Trading<br><span style="color:#6b7280">Training Director · مدير التدريب</span></div></div></div>
    <div style="display:flex;gap:6mm;align-items:center;margin-top:10mm;padding:4mm;border:1px dashed #94a3b8;border-radius:3mm">
      <svg viewBox="-1 -1 ${N + 2} ${N + 2}" width="24mm" height="24mm" style="background:#fff" shape-rendering="crispEdges"><g fill="#0f172a">${cells.join('')}</g></svg>
      <div style="font-size:8.5pt;line-height:1.6">Verification code · رمز التحقق<br><b style="font-family:Consolas,monospace;font-size:13pt;letter-spacing:.08em">${code}</b><br><span style="color:#6b7280">Verify in: Fire Protection Digital Twin → Smart Lab → Learning Paths → Verify a certificate (name, path, date, score, No.).<br>للتحقق: البرنامج ← المختبر الذكي ← المسارات ← التحقق من شهادة.</span></div></div>
  </div>`;
}

m.render = (el, ctx) => {
  const ui = { tab: store.get('pathTab', 'paths'), exam: null, timer: 0 };
  const sup = isSupervisor();
  const tabs = [
    { id: 'paths', label: `🧭 ${L('Learning paths', 'المسارات')}` },
    { id: 'exam', label: `📝 ${L('Final exam', 'الاختبار النهائي')}` },
    { id: 'certs', label: `🏅 ${L('Certificates & verification', 'الشهادات والتحقق')}` },
    { id: 'dash', label: `${sup ? '👩‍🏫' : '🔒'} ${L('Instructor dashboard', 'لوحة المدرّب')}` },
  ];
  function frame() {
    el.innerHTML = header(m) + tabBar(tabs, ui.tab) + '<div id="pBody"></div>';
    el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { ui.tab = b.dataset.tab; store.set('pathTab', ui.tab); clearInterval(ui.timer); frame(); }; });
    const body = el.querySelector('#pBody');
    ({ paths: renderPaths, exam: renderExam, certs: renderCerts, dash: renderDash })[ui.tab](body);
  }

  const who = () => `<div class="card p-who"><label class="adv-field">${L('Trainee name (printed on the certificate)', 'اسم المتدرب (يُطبع على الشهادة)')}<input type="text" id="pName" value="${esc(me())}" placeholder="${L('Full name', 'الاسم الكامل')}"/></label>
    <label class="adv-field">${L('Group / company', 'المجموعة / الشركة')}<input type="text" id="pGroup" value="${esc((() => { try { return localStorage.getItem('ftw.group') || ''; } catch { return ''; } })())}"/></label>
    <button class="btn" id="pSave">💾 ${L('Save', 'حفظ')}</button></div>`;
  const wireWho = (body) => { body.querySelector('#pSave').onclick = () => { setMe(body.querySelector('#pName').value.trim(), body.querySelector('#pGroup').value.trim()); frame(); }; };

  function renderPaths(body) {
    const pr = progress();
    body.innerHTML = who() + `<div class="p-grid">${PATHS.map((p) => {
      const s = pathStatus(p);
      return `<div class="card p-card" style="--pc:${p.color}"><div class="p-top"><span class="p-ic">${p.icon}</span><div><h3>${esc(tr(p.name))}</h3><p>${esc(tr(p.desc))}</p></div>
        <div class="p-ring" style="--p:${s.pct}"><span>${s.pct}%</span></div></div>
        <div class="p-req">${s.items.map((x) => `<button class="p-r ${x.ok ? 'ok' : ''}" data-go="${x.k}"><span>${x.ok ? '✓' : '○'} ${esc(tr(MODS[x.k]))}</span><b>${x.got}% / ${x.need}%</b></button>`).join('')}</div>
        <div class="adv-btns"><button class="btn ${s.ready ? 'primary' : ''}" data-exam="${p.id}">📝 ${L('Final exam', 'الاختبار النهائي')}</button>${s.ready ? `<span class="adv-pill ok">${L('Requirements met', 'المتطلبات مكتملة')}</span>` : `<span class="adv-pill warn">${L('Complete the labs first', 'أكمل المختبرات أولاً')}</span>`}</div></div>`;
    }).join('')}</div>
    <div class="card" style="margin-top:12px"><h3>📊 ${L('YOUR LAB PROGRESS', 'تقدمك في المختبرات')}</h3><div class="p-bars">${Object.entries(MODS).map(([k, n]) => `<div class="p-bar"><span>${esc(tr(n))}</span><div><i style="width:${pr[k] ?? 0}%"></i></div><b>${pr[k] ?? 0}%</b></div>`).join('')}</div></div>`;
    wireWho(body);
    body.querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => ctx.go(b.dataset.go); });
    body.querySelectorAll('[data-exam]').forEach((b) => { b.onclick = () => { ui.tab = 'exam'; ui.pick = b.dataset.exam; store.set('pathTab', 'exam'); frame(); }; });
  }

  function renderExam(body) {
    if (!ui.exam) {
      const exams = store.get('exams', []);
      body.innerHTML = who() + `<div class="card"><h3>📝 ${L('FINAL EXAMINATION', 'الاختبار النهائي')}</h3>
        <p>${L('20 questions (14 on smart systems + 6 on fire-protection fundamentals), 25 minutes, pass mark 80 %. The certificate is issued when the path requirements are also met.', '20 سؤالاً (14 عن الأنظمة الذكية + 6 عن أساسيات الحماية من الحريق)، 25 دقيقة، درجة النجاح 80%. تصدر الشهادة عند اكتمال متطلبات المسار أيضاً.')}</p>
        <div class="adv-form"><label class="adv-field">${L('Path', 'المسار')}<select id="exP">${PATHS.map((p) => `<option value="${p.id}" ${ui.pick === p.id ? 'selected' : ''}>${p.icon} ${esc(tr(p.name))}</option>`).join('')}</select></label></div>
        <div class="adv-btns" style="margin-top:12px"><button class="btn primary" id="exGo">▶ ${L('Start exam', 'ابدأ الاختبار')}</button></div></div>
        ${exams.length ? `<div class="card" style="margin-top:12px"><h3>🗂 ${L('PREVIOUS ATTEMPTS', 'المحاولات السابقة')}</h3><table class="adv-table"><tr><th>${L('Date', 'التاريخ')}</th><th>${L('Name', 'الاسم')}</th><th>${L('Path', 'المسار')}</th><th class="num">${L('Score', 'الدرجة')}</th></tr>${exams.slice(-10).reverse().map((e) => `<tr><td>${esc(e.date)}</td><td>${esc(e.name)}</td><td>${esc(tr(PATHS.find((p) => p.id === e.level).name))}</td><td class="num">${e.score}%</td></tr>`).join('')}</table></div>` : ''}`;
      wireWho(body);
      body.querySelector('#exGo').onclick = () => {
        const name = body.querySelector('#pName').value.trim();
        if (!name) { body.querySelector('#pName').focus(); body.querySelector('#pName').style.borderColor = 'var(--alarm)'; return; }
        setMe(name, body.querySelector('#pGroup').value.trim());
        const p = PATHS.find((x) => x.id === body.querySelector('#exP').value);
        const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((u, v) => u[0] - v[0]).map((x) => x[1]);
        const adv = shuffle(ADV_QUIZ.filter((q) => p.topics.includes(q.topic))).concat(shuffle(ADV_QUIZ.filter((q) => !p.topics.includes(q.topic))));
        const qs = [...adv.slice(0, 14), ...shuffle(QUIZ).slice(0, 6)];
        ui.exam = { p, qs: shuffle(qs), i: 0, ans: [], t0: Date.now(), limit: 25 * 60 };
        renderExam(body);
      };
      return;
    }
    const E = ui.exam;
    if (E.i >= E.qs.length) return finishExam(body);
    const q = E.qs[E.i];
    body.innerHTML = `<div class="card p-exam"><div class="p-exam-h"><span class="adv-pill info">${E.p.icon} ${esc(tr(E.p.name))}</span><span>${L('Question', 'السؤال')} ${E.i + 1} / ${E.qs.length}</span><span class="adv-pill" id="exClock"></span></div>
      <div class="progress"><div style="width:${(100 * E.i) / E.qs.length}%"></div></div>
      <div class="quiz-q">${esc(tr(q.q))}</div>${q.options.map((o, k) => `<button class="quiz-opt" data-k="${k}">${esc(tr(o))}</button>`).join('')}<div id="exEx"></div></div>`;
    const tickClock = () => { const left = E.limit - (Date.now() - E.t0) / 1000; const c = body.querySelector('#exClock'); if (c) c.textContent = `⏱ ${mmss(left)}`; if (left <= 0) { clearInterval(ui.timer); E.i = E.qs.length; renderExam(body); } };
    clearInterval(ui.timer); ui.timer = setInterval(tickClock, 500); tickClock();
    body.querySelectorAll('[data-k]').forEach((b) => {
      b.onclick = () => {
        if (E.ans[E.i] != null) return;
        const k = +b.dataset.k; E.ans[E.i] = k;
        body.querySelectorAll('[data-k]').forEach((x) => { const kk = +x.dataset.k; if (kk === q.answer) x.classList.add('right'); else if (kk === k) x.classList.add('wrong'); });
        body.querySelector('#exEx').innerHTML = `<div class="explain">${esc(tr(q.explain))}</div><button class="btn primary" id="exNext">${E.i + 1 < E.qs.length ? L('Next', 'التالي') : L('Finish', 'إنهاء')} →</button>`;
        body.querySelector('#exNext').onclick = () => { E.i++; renderExam(body); };
      };
    });
  }

  function finishExam(body) {
    clearInterval(ui.timer);
    const E = ui.exam; ui.exam = null;
    const ok = E.qs.filter((q, i) => E.ans[i] === q.answer).length;
    const score = Math.round((100 * ok) / E.qs.length);
    const date = new Date().toISOString().slice(0, 10);
    const exams = store.get('exams', []); exams.push({ date, name: me(), level: E.p.id, score }); store.set('exams', exams);
    ctx.helpers.recordResult?.({ type: 'quiz', topic: `exam/${E.p.id}`, score: ok, total: E.qs.length });
    const s = pathStatus(E.p);
    let cert = null;
    if (score >= 80 && s.ready) {
      const certs = store.get('certs', []);
      const no = `FTW-${date.slice(0, 4)}-${String(certs.length + 1).padStart(4, '0')}-${E.p.id.toUpperCase()}`;
      cert = { no, name: me(), level: E.p.id, date, score, mods: Object.fromEntries(Object.keys(E.p.req).map((k) => [k, progress()[k] ?? 0])), group: (() => { try { return localStorage.getItem('ftw.group') || ''; } catch { return ''; } })() };
      certs.push(cert); store.set('certs', certs);
      markDone('paths', 100);
    } else markDone('paths', Math.min(79, score));
    body.innerHTML = `<div class="card">${scoreBanner(score, `<b>${ok} / ${E.qs.length}</b> ${L('correct', 'صحيحة')} — ${score >= 80 ? L('PASS', 'ناجح') : L('below the 80 % pass mark', 'أقل من درجة النجاح 80%')}`)}
      ${cert ? `<div class="adv-callout">🏅 ${L('Certificate issued', 'تم إصدار الشهادة')}: <b>${esc(cert.no)}</b> — ${L('verification code', 'رمز التحقق')} <b class="mono">${certCode(cert)}</b></div><div class="adv-btns" style="margin-top:10px"><button class="btn primary" id="exPrint">🖨 ${L('Print / save certificate (PDF)', 'طباعة / حفظ الشهادة PDF')}</button></div>`
        : score >= 80 ? `<div class="adv-callout warn">${L('You passed the exam, but the path requirements are not complete yet. Finish the labs and retake the exam to receive the certificate.', 'نجحت في الاختبار لكن متطلبات المسار لم تكتمل بعد. أكمل المختبرات وأعد الاختبار لتحصل على الشهادة.')}</div>` : ''}
      <div class="adv-btns" style="margin-top:10px"><button class="btn" id="exBack">↺ ${L('Back', 'رجوع')}</button></div></div>`;
    body.querySelector('#exBack').onclick = () => renderExam(body);
    body.querySelector('#exPrint')?.addEventListener('click', () => printDoc(certHtml(cert), `${cert.no}.pdf`));
  }

  function renderCerts(body) {
    const certs = store.get('certs', []);
    const mine = sup ? certs : certs.filter((c) => c.name === me());
    body.innerHTML = `<div class="adv-grid c2">
      <div class="card"><h3>🏅 ${L('ISSUED CERTIFICATES', 'الشهادات الصادرة')}${sup ? `<span class="r"><button class="btn sm" id="cCsv">⬇ CSV</button></span>` : ''}</h3>
        ${mine.length ? `<div class="adv-scroll"><table class="adv-table"><tr><th>No.</th><th>${L('Name', 'الاسم')}</th><th>${L('Path', 'المسار')}</th><th>${L('Date', 'التاريخ')}</th><th class="num">%</th><th></th></tr>
          ${mine.slice().reverse().map((c) => `<tr><td class="mono" style="font-size:.85em">${esc(c.no)}</td><td>${esc(c.name)}</td><td>${PATHS.find((p) => p.id === c.level).icon} ${esc(tr(PATHS.find((p) => p.id === c.level).name))}</td><td>${esc(c.date)}</td><td class="num">${c.score}</td><td><button class="btn sm" data-print="${esc(c.no)}">🖨</button></td></tr>`).join('')}</table></div>`
          : `<p class="muted">${L('No certificates yet. Complete a path and pass its final exam.', 'لا توجد شهادات بعد. أكمل مساراً واجتز اختباره النهائي.')}</p>`}</div>
      <div class="card"><h3>🔎 ${L('VERIFY A CERTIFICATE', 'التحقق من شهادة')}</h3>
        <p class="muted" style="font-size:.9em">${L('Enter the details printed on the certificate. The code is recomputed offline — any change in name, score or date makes it invalid.', 'أدخل البيانات المطبوعة على الشهادة. يُعاد حساب الرمز دون إنترنت — أي تغيير في الاسم أو الدرجة أو التاريخ يجعلها غير صالحة.')}</p>
        <div class="adv-form">
          <label class="adv-field">${L('Name', 'الاسم')}<input type="text" id="vN"/></label>
          <label class="adv-field">${L('Path', 'المسار')}<select id="vL">${PATHS.map((p) => `<option value="${p.id}">${esc(tr(p.name))}</option>`).join('')}</select></label>
          <label class="adv-field">${L('Date', 'التاريخ')}<input type="text" id="vD" placeholder="2026-09-30"/></label>
          <label class="adv-field">${L('Score %', 'الدرجة %')}<input type="number" id="vS"/></label>
          <label class="adv-field">No.<input type="text" id="vNo" placeholder="FTW-2026-0001-ENG"/></label>
          <label class="adv-field">${L('Verification code', 'رمز التحقق')}<input type="text" id="vC" placeholder="XXXX-XXXX-XXXX-XXXX"/></label></div>
        <div class="adv-btns" style="margin-top:12px"><button class="btn primary" id="vGo">🔎 ${L('Verify', 'تحقق')}</button><span id="vRes"></span></div></div></div>`;
    body.querySelectorAll('[data-print]').forEach((b) => { b.onclick = () => { const c = certs.find((x) => x.no === b.dataset.print); printDoc(certHtml(c), `${c.no}.pdf`); }; });
    body.querySelector('#cCsv')?.addEventListener('click', () => download('certificates.csv', ['no,name,group,path,date,score,code', ...certs.map((c) => [c.no, c.name, c.group, c.level, c.date, c.score, certCode(c)].map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(','))].join('\n'), 'text/csv'));
    body.querySelector('#vGo').onclick = () => {
      const c = { name: body.querySelector('#vN').value, level: body.querySelector('#vL').value, date: body.querySelector('#vD').value.trim(), score: +body.querySelector('#vS').value, no: body.querySelector('#vNo').value.trim() };
      const ok = certCode(c) === body.querySelector('#vC').value.trim().toUpperCase();
      body.querySelector('#vRes').innerHTML = ok ? `<span class="adv-pill ok">✅ ${L('VALID certificate', 'شهادة صالحة')}</span>` : `<span class="adv-pill bad">❌ ${L('NOT valid', 'غير صالحة')}</span>`;
    };
  }

  function renderDash(body) {
    if (!sup) { body.innerHTML = `<div class="card">🔒 ${L('The instructor dashboard needs a supervisor (teacher) license.', 'لوحة المدرّب تحتاج ترخيص مشرف (مدرّس).')}</div>`; return; }
    const sp = store.get('studentProgress', {});
    const students = Object.keys(sp).sort();
    const keys = Object.keys(MODS);
    const avg = (k) => { const v = students.map((s) => sp[s][k]).filter((x) => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
    const col = (v) => v == null ? 'var(--panel2)' : `hsl(${Math.round(v * 1.2)} 70% ${ar_dark() ? 28 : 82}%)`;
    const certs = store.get('certs', []);
    const weak = keys.map((k) => ({ k, v: avg(k) })).filter((x) => x.v != null).sort((a, b) => a.v - b.v).slice(0, 4);
    body.innerHTML = `<div class="adv-stats">${[[L('Trainees', 'المتدربون'), students.length], [L('Certificates', 'الشهادات'), certs.length], [L('Exams taken', 'الاختبارات'), store.get('exams', []).length], [L('Class average', 'متوسط الصف'), `${Math.round(keys.map(avg).filter((x) => x != null).reduce((a, b, _, arr) => a + b / arr.length, 0) || 0)}%`]].map(([k, v]) => `<div class="adv-stat"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>
      <div class="card"><h3>🗺 ${L('PROGRESS HEAT-MAP (best score per lab)', 'خريطة التقدم (أفضل درجة لكل مختبر)')}<span class="r"><button class="btn sm" id="dCsv">⬇ CSV</button></span></h3>
        ${students.length ? `<div class="adv-scroll"><table class="adv-table p-heat"><tr><th>${L('Trainee', 'المتدرب')}</th>${keys.map((k) => `<th class="num">${esc(tr(MODS[k]))}</th>`).join('')}</tr>
        ${students.map((s) => `<tr><td>${esc(s)}</td>${keys.map((k) => `<td class="num" style="background:${col(sp[s][k])}">${sp[s][k] ?? '—'}</td>`).join('')}</tr>`).join('')}
        <tr class="avg"><td><b>${L('Average', 'المتوسط')}</b></td>${keys.map((k) => `<td class="num"><b>${avg(k) ?? '—'}</b></td>`).join('')}</tr></table></div>` : `<p class="muted">${L('No trainee data yet. Each trainee enters their name (Learning paths tab) on this PC before working in the labs.', 'لا توجد بيانات بعد. يُدخل كل متدرب اسمه (تبويب المسارات) على هذا الجهاز قبل العمل في المختبرات.')}</p>`}</div>
      <div class="card" style="margin-top:12px"><h3>📉 ${L('WEAKEST AREAS — FOCUS YOUR NEXT SESSION', 'أضعف المجالات — ركّز عليها في الجلسة القادمة')}</h3>
        ${weak.map((w) => `<div class="p-bar"><span>${esc(tr(MODS[w.k]))}</span><div><i style="width:${w.v}%;background:${w.v < 60 ? 'var(--alarm)' : 'var(--warn)'}"></i></div><b>${w.v}%</b></div>`).join('') || '—'}</div>`;
    body.querySelector('#dCsv')?.addEventListener('click', () => download('lab_progress.csv', [['trainee', ...keys].join(','), ...students.map((s) => [s, ...keys.map((k) => sp[s][k] ?? '')].join(','))].join('\n'), 'text/csv'));
  }
  const ar_dark = () => document.documentElement.dataset.theme === 'dark';

  frame();
  return () => clearInterval(ui.timer);
};

export default m;
