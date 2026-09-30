// Module 7 — Incident Commander: timed multi-failure fire scenarios. Injects drive the shared
// FireSystem (so the building section shows the real consequences), the learner makes decisions under
// a countdown, and a full timeline replay/debrief explains every decision with its code basis.
import { sectionSvg, updateSection, restoreAll } from './cause.js';
import { header, L, esc, tr, store, markDone, tabBar, scoreBanner, mmss } from './ui.js';

const T = (en, ar) => ({ en, ar });
const m = {
  id: 'incident', icon: '🚨',
  title: T('Incident Commander', 'قائد الحادثة'),
  short: T('Decisions under pressure, cascading failures', 'قرارات تحت الضغط وأعطال متتالية'),
  sub: T('You are the fire safety manager on duty. A real fire develops while equipment fails around you: every inject changes the live building, every decision has a countdown. Afterwards the replay shows your timeline next to the correct actions and the code basis.',
    'أنت مدير السلامة المناوب. يتطور حريق حقيقي بينما تتعطل المعدات من حولك: كل حدث يغيّر المبنى الحي، وكل قرار له عدّ تنازلي. بعد ذلك تعرض الإعادة خطك الزمني مقارنة بالإجراءات الصحيحة وأساسها في الكود.'),
  refs: ['NFPA 1600', 'NFPA 25 Ch.15 Impairments', 'NFPA 72 §21.3', 'NFPA 2001 §4.3.5', 'NFPA 101 §7.2.12 Areas of refuge'],
};

const dev = (s, fn) => s.devices.find(fn);
const opt = (en, ar, pts, why, effect) => ({ t: T(en, ar), pts, why, effect });

const SCENARIOS = [
  {
    id: 'night', icon: '🌙', title: T('Night: server-room fire + power & pump failures', 'ليلاً: حريق غرفة الخوادم مع انقطاع الكهرباء وتعطل المضخة'),
    brief: T('02:14 at night — 12 people in the building (cleaners, IT on-call). You are at the fire command centre next to the FACP.', 'الساعة 02:14 ليلاً — 12 شخصاً في المبنى (عمال نظافة ومناوب تقنية المعلومات). أنت في مركز قيادة الحريق بجانب اللوحة.'),
    steps: [
      { t: 2, inject: T('Server room detector A reports rising smoke (pre-alarm).', 'كاشف غرفة الخوادم A يبلّغ عن ارتفاع الدخان (إنذار مبكر).'), fx: (s) => s.test(dev(s, (d) => d.zone === 'SR-A').id, 'smoke') },
      { t: 8, q: T('PRE-ALARM, then FIRE from ONE server-room detector. What do you do?', 'إنذار مبكر ثم حريق من كاشف واحد في غرفة الخوادم. ماذا تفعل؟'), limit: 25, options: [
        opt('Send the on-call technician to verify, alert the FM-200 area, prepare to call Civil Defense', 'أرسل المناوب للتحقق، ونبّه منطقة FM-200، واستعد للاتصال بالدفاع المدني', 10, T('One detector = alarm + pre-discharge warning (cross-zoned release not yet). Verify quickly and prepare.', 'كاشف واحد = إنذار وتحذير ما قبل التفريغ (لم يتحقق الإطلاق المتقاطع بعد). تحقّق بسرعة واستعد.')),
        opt('Reset the panel – it is probably dust in the detector', 'أعد ضبط اللوحة – غالباً غبار في الكاشف', 0, T('Never reset an unverified alarm; you destroy the event information and delay the response.', 'لا تُعِد ضبط إنذار غير متحقق منه أبداً؛ فأنت تمحو المعلومات وتؤخر الاستجابة.'), (st) => { st.fire += 15; }),
        opt('Silence the alarm and wait for a second detector', 'أسكت الإنذار وانتظر كاشفاً ثانياً', 2, T('Silencing without investigating is not a response.', 'الإسكات دون تحقق ليس استجابة.'), (st) => { st.fire += 10; })] },
      { t: 12, inject: T('Detector B also in alarm → cross-zone confirmed, FM-200 30 s countdown started. The technician radios: "I\'m INSIDE the server room!"', 'الكاشف B أيضاً في حالة إنذار ← تأكيد متقاطع، بدأ العد التنازلي 30 ث لـ FM-200. المناوب يتصل: "أنا داخل غرفة الخوادم!"'), fx: (s) => s.test(dev(s, (d) => d.zone === 'SR-B').id, 'smoke') },
      { t: 14, q: T('Someone is inside the protected room during the countdown. Your action?', 'شخص داخل الغرفة المحمية أثناء العد التنازلي. ما إجراؤك؟'), limit: 15, options: [
        opt('Tell him to leave now; hold the ABORT switch until he confirms he is out, then release it', 'اطلب منه المغادرة فوراً؛ اضغط زر الإيقاف حتى يؤكد خروجه ثم أفلته', 10, T('Abort switch (dead-man type) suspends the countdown only while held — exactly for this (NFPA 2001 §4.3.5.3).', 'زر الإيقاف (من نوع الرجل الميت) يوقف العد التنازلي فقط أثناء الضغط — لهذا الغرض بالضبط.'), (st, s) => { s.fm.abort = true; setTimeout(() => { s.fm.abort = false; }, 8000); }),
        opt('Let the countdown continue – the concentration (7 %) is below NOAEL', 'دع العد يستمر – التركيز (7%) أقل من NOAEL', 3, T('Design concentration is below NOAEL, but discharge noise, cold, turbulence and decomposition products still endanger him — get him out first.', 'التركيز أقل من NOAEL، لكن الضجيج والبرودة والاضطراب ونواتج التحلل تبقى خطراً — أخرجه أولاً.'), (st) => { st.life -= 15; }),
        opt('Disable the FM-200 release circuit at the panel', 'عطّل دائرة إطلاق FM-200 من اللوحة', 1, T('Disabling leaves a real fire unsuppressed; the abort switch is the correct device.', 'التعطيل يترك حريقاً حقيقياً دون إطفاء؛ زر الإيقاف هو الجهاز الصحيح.'), (st, s) => { s.fm.abort = true; st.fire += 25; })] },
      { t: 40, inject: T('Storm: utility power lost. The fire spread through an unsealed cable penetration into the 1F corridor — a sprinkler operates.', 'عاصفة: انقطعت الكهرباء. انتقل الحريق عبر فتحة كابلات غير مغلقة إلى ممر الطابق الأول — رشاش يعمل.'), fx: (s) => { s.setAC(false); s.test(dev(s, (d) => d.floor === '1' && d.room === 'cor').id, 'fire'); s.test(dev(s, (d) => d.floor === '1' && d.type === 'flow').id, 'flow'); } },
      { t: 44, q: T('Mains power is down and the sprinklers are flowing. Your priority?', 'الكهرباء مقطوعة والرشاشات تعمل. ما أولويتك؟'), limit: 20, options: [
        opt('Confirm the diesel fire pump started automatically; monitor pressure and fuel', 'تأكد أن مضخة الديزل عملت تلقائياً؛ راقب الضغط والوقود', 10, T('Diesel driver is the power-independent source; confirm it runs (NFPA 20).', 'محرك الديزل هو المصدر المستقل عن الكهرباء؛ تأكد أنه يعمل (NFPA 20).')),
        opt('Close the sprinkler control valve to save tank water', 'أغلق صمام التحكم للرشاشات لتوفير مياه الخزان', 0, T('Never close a control valve on a working fire — sprinklers are controlling it.', 'لا تُغلق صمام التحكم أبداً أثناء حريق نشط — الرشاشات تسيطر عليه.'), (st) => { st.fire += 35; st.system -= 20; }),
        opt('Reset the panel to clear the power-fail trouble', 'أعد ضبط اللوحة لمسح عطل الكهرباء', 1, T('Troubles clear only when the cause is fixed; resetting during a fire loses information.', 'لا تزول الأعطال إلا بإصلاح السبب؛ وإعادة الضبط أثناء الحريق تفقد المعلومات.'), (st) => { st.fire += 5; })] },
      { t: 58, inject: T('Diesel pump controller: "FAILED TO START" (cranking battery A weak). Sprinkler pressure falling.', 'متحكم الديزل: "فشل التشغيل" (بطارية التدوير A ضعيفة). ضغط الرشاشات ينخفض.') },
      { t: 60, q: T('The diesel failed to crank. What now?', 'فشل تدوير الديزل. ماذا الآن؟'), limit: 20, options: [
        opt('Crank manually on battery set B at the controller and ask the fire brigade to pump into the FDC', 'دوّر يدوياً على مجموعة البطاريات B من المتحكم واطلب من الدفاع المدني الضخ عبر وصلة الإطفاء', 10, T('NFPA 20 requires two battery sets and manual crank; the FDC lets the brigade supplement the system.', 'يتطلب NFPA 20 مجموعتي بطاريات وتدويراً يدوياً؛ ووصلة الإطفاء تسمح للفرق بدعم النظام.')),
        opt('Wait for mains power to return', 'انتظر عودة الكهرباء', 0, T('Waiting lets the fire outgrow the sprinklers.', 'الانتظار يجعل الحريق أكبر من قدرة الرشاشات.'), (st) => { st.fire += 30; }),
        opt('Open the pump test header to relieve pressure', 'افتح مجمّع اختبار المضخة لتخفيف الضغط', 0, T('That dumps the little pressure left.', 'هذا يهدر ما تبقى من ضغط.'), (st) => { st.fire += 20; st.system -= 10; })] },
      { t: 75, inject: T('Civil Defense arrives. The officer asks for a briefing and the lift.', 'وصل الدفاع المدني. الضابط يطلب إحاطة والمصعد.') },
      { t: 77, q: T('What do you give the fire officer?', 'ماذا تقدّم لضابط الإطفاء؟'), limit: 20, options: [
        opt('Brief: fire origin server room 1F spread to corridor, FM-200 discharged, diesel manual, 12 people accounted; give the Phase II key', 'إحاطة: منشأ الحريق غرفة الخوادم 1F وانتشر للممر، تم تفريغ FM-200، الديزل يدوي، 12 شخصاً تم حصرهم؛ وسلّم مفتاح المرحلة الثانية', 10, T('Structured handover + firefighter key (NFPA 72 §21.3; NFPA 1600).', 'تسليم منظم + مفتاح رجال الإطفاء.')),
        opt('Tell them to use the lift normally to reach 1F', 'اطلب منهم استخدام المصعد بشكل عادي للوصول إلى 1F', 0, T('The recalled lift is only operated under Phase II by firefighters.', 'المصعد المستدعى يُشغَّل فقط بالمرحلة الثانية من قبل رجال الإطفاء.'), (st) => { st.life -= 10; }),
        opt('Say you are not sure what the system did', 'قل إنك لست متأكداً مما فعله النظام', 2, T('The FACP history and C&E log give an exact picture — use them.', 'سجل اللوحة وسجل السبب والنتيجة يعطيان صورة دقيقة — استخدمهما.'))] },
      { t: 92, inject: T('Fire is out. 4 sprinklers operated, FM-200 cylinders empty, a detector section is damaged.', 'تم إخماد الحريق. عملت 4 رشاشات، أسطوانات FM-200 فارغة، وقسم من الكواشف متضرر.') },
      { t: 94, q: T('Before leaving the site tonight, what must happen?', 'قبل مغادرة الموقع الليلة، ما الذي يجب أن يحدث؟'), limit: 25, options: [
        opt('Start the impairment procedure: notify AHJ/insurer, fire watch, restore heads & recharge agent ASAP', 'ابدأ إجراء التعطيل: أبلغ الجهة المختصة/التأمين، ضع مراقبة حريق، استبدل الرشاشات واشحن المادة بأسرع وقت', 10, T('NFPA 25 Chapter 15: impairment coordinator, notifications, fire watch, restoration.', 'NFPA 25 الفصل 15: منسق التعطيل، الإشعارات، مراقبة الحريق، الاستعادة.')),
        opt('Reset the panel and go home – the fire is out', 'أعد ضبط اللوحة واذهب للمنزل – الحريق انطفأ', 0, T('The building is unprotected; it needs a fire watch.', 'المبنى بلا حماية؛ يحتاج مراقبة حريق.'), (st) => { st.system -= 20; }),
        opt('Leave the sprinkler valve closed until Monday', 'اترك صمام الرشاشات مغلقاً حتى يوم الاثنين', 0, T('Unacceptable impairment without mitigation.', 'تعطيل غير مقبول دون إجراءات بديلة.'), (st) => { st.system -= 30; })] },
    ],
  },
  {
    id: 'day', icon: '☀️', title: T('Office hours: kitchen fire 2F, lift & refuge decisions', 'ساعات الدوام: حريق مطبخ 2F وقرارات المصعد والملاذ'),
    brief: T('11:05 — 180 occupants, one wheelchair user on 2F. You manage the building from the fire command centre.', 'الساعة 11:05 — 180 شاغلاً، ومستخدم كرسي متحرك في 2F. أنت تدير المبنى من مركز قيادة الحريق.'),
    steps: [
      { t: 2, inject: T('Heat detector in the 2F kitchen in alarm; smoke reported in the corridor.', 'كاشف الحرارة في مطبخ 2F في حالة إنذار؛ وتم الإبلاغ عن دخان في الممر.'), fx: (s) => { s.test(dev(s, (d) => d.floor === '2' && d.room === 'kit').id, 'heat'); s.test(dev(s, (d) => d.floor === '2' && d.room === 'cor').id, 'smoke'); } },
      { t: 6, q: T('How do you manage the voice evacuation?', 'كيف تدير الإخلاء الصوتي؟'), limit: 20, options: [
        opt('Keep automatic phasing: 2F (fire floor, top floor) EVACUATE, 1F and G ALERT; escalate if it spreads', 'أبقِ المرحلية التلقائية: 2F (طابق الحريق والأعلى) إخلاء، 1F وG تنبيه؛ وصعّد إذا انتشر', 10, T('Phased evacuation limits stair congestion (NFPA 72 §24.4.8; NFPA 101).', 'الإخلاء المرحلي يحد من ازدحام الدرج.')),
        opt('Tell everyone to evacuate with the lifts – faster', 'اطلب من الجميع الإخلاء بالمصاعد – أسرع', 0, T('Lifts are recalled; using them in fire is dangerous unless designed as evacuation lifts.', 'المصاعد مستدعاة؛ واستخدامها في الحريق خطر ما لم تصمم كمصاعد إخلاء.'), (st) => { st.life -= 25; }),
        opt('Silence — kitchen fires are usually small', 'أسكت الإنذار — حرائق المطابخ عادة صغيرة', 0, T('Never silence an unconfirmed fire.', 'لا تُسكت حريقاً غير مؤكد أبداً.'), (st) => { st.life -= 15; st.fire += 15; })] },
      { t: 14, inject: T('Smoke reaches the 2F lift lobby → lift recalled to G. A manager wants to bring the wheelchair user down in the lift.', 'وصل الدخان إلى ردهة مصعد 2F ← استدعاء المصعد إلى G. مدير يريد إنزال مستخدم الكرسي المتحرك بالمصعد.'), fx: (s) => s.test(dev(s, (d) => d.floor === '2' && d.room === 'lobby').id, 'smoke') },
      { t: 16, q: T('Wheelchair user on 2F, lift recalled. Decision?', 'مستخدم كرسي متحرك في 2F والمصعد مستدعى. القرار؟'), limit: 20, options: [
        opt('Move them to the area of refuge in pressurized Stair A, use the two-way communication and tell the fire brigade', 'انقله إلى الملاذ الآمن في الدرج A المضغوط، واستخدم الاتصال ثنائي الاتجاه وأبلغ الدفاع المدني', 10, T('Areas of refuge + stair pressurization protect people awaiting assisted evacuation (NFPA 101 §7.2.12).', 'مناطق الملاذ وضغط الدرج تحمي من ينتظر الإخلاء بالمساعدة.')),
        opt('Turn the Phase I key OFF so the lift works normally', 'أدِر مفتاح المرحلة الأولى إلى إيقاف ليعمل المصعد بشكل عادي', 0, T('Recall is automatic from the lobby detector; overriding sends the car into smoke.', 'الاستدعاء تلقائي من كاشف الردهة؛ وتجاوزه يرسل المقصورة إلى الدخان.'), (st) => { st.life -= 25; }),
        opt('Carry the person down the stairs with untrained staff immediately', 'احمل الشخص عبر الدرج مع موظفين غير مدربين فوراً', 4, T('Possible but risky; refuge + trained responders is the planned method.', 'ممكن لكنه خطر؛ الملاذ مع مستجيبين مدربين هو الأسلوب المخطط.'), (st) => { st.life -= 5; })] },
      { t: 28, inject: T('Sprinkler operating on 2F (waterflow). Staff ask to close the valve to limit water damage to the IT floor below.', 'رشاش يعمل في 2F (تدفق مياه). الموظفون يطلبون إغلاق الصمام للحد من أضرار المياه في طابق تقنية المعلومات بالأسفل.'), fx: (s) => s.test(dev(s, (d) => d.floor === '2' && d.type === 'flow').id, 'flow') },
      { t: 30, q: T('Close the floor control valve?', 'هل تُغلق صمام التحكم في الطابق؟'), limit: 15, options: [
        opt('No. Only the fire brigade decides when the fire is out; then close, drain and restore quickly', 'لا. الدفاع المدني وحده يقرر انطفاء الحريق؛ بعدها يُغلق ويُصرف ويُعاد بسرعة', 10, T('Sprinklers control the fire; premature shut-off is a classic cause of fire losses.', 'الرشاشات تسيطر على الحريق؛ الإغلاق المبكر سبب شائع للخسائر.')),
        opt('Yes, close it now', 'نعم، أغلقه الآن', 0, T('Fire regrows immediately.', 'يعود الحريق للنمو فوراً.'), (st) => { st.fire += 40; }),
        opt('Close it half way', 'أغلقه جزئياً', 1, T('Partial closing starves the sprinklers — same problem.', 'الإغلاق الجزئي يحرم الرشاشات من المياه — نفس المشكلة.'), (st) => { st.fire += 25; })] },
      { t: 44, inject: T('The panel shows many "NO ANSWER" troubles on 2F: heat damaged the loop cable in the kitchen.', 'تُظهر اللوحة أعطال "لا استجابة" كثيرة في 2F: الحرارة أتلفت كابل الحلقة في المطبخ.'), fx: (s) => { const n = s.loopNodes(); const i = n.findIndex((d) => d.floor === '2' && d.room === 'kit'); if (i > 0) s.shortSeg(i); } },
      { t: 46, q: T('How do you interpret the loop troubles?', 'كيف تفسّر أعطال الحلقة؟'), limit: 20, options: [
        opt('Isolators contained the short; Class A keeps the other floors working. Log it and repair after the fire', 'العوازل حصرت القصر؛ والفئة A تُبقي الطوابق الأخرى تعمل. سجّله وأصلحه بعد الحريق', 10, T('This is why NFPA 72 §12/§23.6 requires isolators and pathway classes.', 'لهذا يتطلب NFPA 72 العوازل وفئات المسارات.')),
        opt('Reset the panel repeatedly to clear them', 'أعد ضبط اللوحة مراراً لمسحها', 0, T('Resetting doesn\'t fix a damaged cable and hides new alarms.', 'إعادة الضبط لا تصلح كابلاً تالفاً وتخفي إنذارات جديدة.'), (st) => { st.system -= 15; }),
        opt('Disable the whole loop to stop the beeping', 'عطّل الحلقة كلها لإيقاف الصفير', 0, T('That removes detection from the entire building.', 'هذا يلغي الكشف من المبنى كله.'), (st) => { st.system -= 40; st.life -= 10; })] },
      { t: 60, inject: T('Fire brigade confirms the fire is out.', 'الدفاع المدني يؤكد إخماد الحريق.') },
      { t: 62, q: T('The fire investigator asks what happened and when.', 'محقق الحريق يسأل عما حدث ومتى.'), limit: 20, options: [
        opt('Export the FACP event history and the C&E action log with times, plus the Contact-ID reports', 'صدّر سجل أحداث اللوحة وسجل إجراءات السبب والنتيجة بالأوقات، وتقارير Contact-ID', 10, T('Addressable panels keep time-stamped history — the best evidence.', 'اللوحات المعنونة تحتفظ بسجل مؤرخ — أفضل دليل.')),
        opt('Write it from memory', 'اكتبه من الذاكرة', 3, T('Memory is unreliable; the system log is exact.', 'الذاكرة غير موثوقة؛ سجل النظام دقيق.')),
        opt('Clear the history to start clean', 'امسح السجل لتبدأ من جديد', 0, T('Destroying evidence.', 'إتلاف للأدلة.'), (st) => { st.system -= 10; })] },
    ],
  },
];

m.render = (el, ctx) => {
  const sys = ctx.sys;
  const ui = { tab: 'play', scen: null, st: null, run: null, raf: 0, replayT: null };
  const tabs = [{ id: 'play', label: `🚨 ${L('Command', 'القيادة')}` }, { id: 'replay', label: `⏮ ${L('Replay & debrief', 'الإعادة والاستخلاص')}` }];

  function frame() {
    el.innerHTML = header(m) + tabBar(tabs, ui.tab) + '<div id="icBody"></div>';
    el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { ui.tab = b.dataset.tab; frame(); }; });
    const body = el.querySelector('#icBody');
    if (ui.tab === 'replay') return renderReplay(body);
    if (!ui.run) return renderPick(body);
    renderPlay(body);
  }

  function renderPick(body) {
    const best = store.get('icBest', {});
    body.innerHTML = `<div class="ic-pick">${SCENARIOS.map((s) => `<div class="card ic-sc"><div class="ic-sc-ic">${s.icon}</div><h3>${esc(tr(s.title))}</h3><p>${esc(tr(s.brief))}</p>
      <div class="adv-btns"><button class="btn primary" data-go="${s.id}">▶ ${L('Take command', 'تولَّ القيادة')}</button>${best[s.id] != null ? `<span class="adv-pill ${best[s.id] >= 80 ? 'ok' : 'warn'}">${L('best', 'الأفضل')} ${best[s.id]}%</span>` : ''}</div></div>`).join('')}
      <div class="card"><h3>🧭 ${L('RULES OF THE EXERCISE', 'قواعد التمرين')}</h3><ul class="ic-rules">
        <li>${L('The clock runs. Each decision has a countdown — no decision is the worst decision.', 'الساعة تعمل. لكل قرار عدّ تنازلي — وعدم اتخاذ القرار هو أسوأ قرار.')}</li>
        <li>${L('Injects really happen in the shared system: watch the building section, the panel and the outputs.', 'الأحداث تحدث فعلاً في النظام المشترك: راقب مقطع المبنى واللوحة والمخرجات.')}</li>
        <li>${L('Three indicators: occupant safety, fire size and system integrity.', 'ثلاثة مؤشرات: سلامة الشاغلين، حجم الحريق، سلامة النظام.')}</li></ul></div></div>`;
    body.querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => start(SCENARIOS.find((s) => s.id === b.dataset.go)); });
  }

  function start(scen) {
    restoreAll(sys);
    ui.scen = scen;
    ui.run = { t: 0, i: 0, q: null, qT: 0, answers: [], feed: [], snaps: [], done: false, last: performance.now() };
    ui.st = { life: 100, fire: 10, system: 100 };
    ui.tab = 'play';
    frame();
  }

  function renderPlay(body) {
    body.innerHTML = `<div class="ic-play">
      <div class="ic-left">
        <div class="ic-meters" id="icMeters"></div>
        <div class="card" style="padding:8px">${sectionSvg(false)}</div>
      </div>
      <div class="ic-right">
        <div class="card ic-clock"><div><small>${esc(tr(ui.scen.title))}</small><b id="icClock">00:00</b></div><button class="btn sm ghost" id="icQuit">✕ ${L('Abandon', 'إنهاء')}</button></div>
        <div id="icQ"></div>
        <div class="card"><h3>📻 ${L('INCIDENT FEED', 'موجز الحادثة')}</h3><div class="ic-feed" id="icFeed"></div></div>
      </div></div>`;
    body.querySelector('#icQuit').onclick = () => { ui.run = null; restoreAll(sys); frame(); };
    body.querySelector('#icQ').addEventListener('click', (e) => { const b = e.target.closest('[data-opt]'); if (b) answer(+b.dataset.opt); });
    renderFeed(body); renderQ(body);
  }

  function push(kind, text, extra = {}) { ui.run.feed.push({ t: ui.run.t, kind, text, ...extra }); }

  function tick(dt) {
    const R = ui.run; if (!R || R.done) return;
    if (R.q) {
      R.qT -= dt;
      if (R.qT <= 0) { push('timeout', T('No decision taken in time!', 'لم يُتخذ قرار في الوقت المحدد!')); record(R.q, -1); }
      return;
    }
    R.t += dt;
    ui.st.fire = Math.min(100, ui.st.fire + dt * (sys.outputs().fm === 'discharged' ? 0.05 : 0.35));
    const steps = ui.scen.steps;
    while (R.i < steps.length && steps[R.i].t <= R.t) {
      const s = steps[R.i++];
      if (s.inject) { push('inject', s.inject); s.fx?.(sys); }
      if (s.q) { R.q = s; R.qT = s.limit; break; }
    }
    if (Math.floor(R.t) !== R.lastSnap) { R.lastSnap = Math.floor(R.t); R.snaps.push({ t: R.t, ...ui.st }); }
    if (R.i >= steps.length && !R.q) finish();
  }

  function answer(k) { const R = ui.run; if (R?.q) record(R.q, k); }
  function record(q, k) {
    const R = ui.run;
    const o = q.options[k];
    const best = q.options.reduce((a, b) => (b.pts > a.pts ? b : a));
    if (o) { o.effect?.(ui.st, sys); push('decision', o.t, { pts: o.pts, why: o.why }); } else { ui.st.fire += 20; ui.st.life -= 10; }
    R.answers.push({ q: q.q, k, pts: o ? o.pts : 0, best: best.t, why: (o || best).why, bestWhy: best.why, t: R.t, time: q.limit - R.qT });
    R.q = null;
    ui.st.life = Math.max(0, ui.st.life); ui.st.system = Math.max(0, ui.st.system);
    const body = el.querySelector('#icBody'); if (body) { renderQ(body); renderFeed(body); }
  }
  function finish() {
    const R = ui.run; R.done = true;
    const max = R.answers.length * 10;
    const pts = R.answers.reduce((a, b) => a + b.pts, 0);
    const score = Math.max(0, Math.round((100 * pts) / Math.max(1, max) - (ui.st.life < 80 ? 5 : 0)));
    R.score = score;
    const best = store.get('icBest', {}); best[ui.scen.id] = Math.max(best[ui.scen.id] ?? 0, score); store.set('icBest', best);
    store.set('icLast', { scen: ui.scen.id, answers: R.answers.map((a) => ({ ...a })), feed: R.feed, snaps: R.snaps, score, st: ui.st });
    markDone('incident', score);
    ctx.helpers.recordResult?.({ type: 'lab', topic: `incident/${ui.scen.id}`, score: pts, total: max });
    const body = el.querySelector('#icBody'); if (body) renderQ(body);
  }

  function renderQ(body) {
    const box = body.querySelector('#icQ'); if (!box) return;
    const R = ui.run;
    if (R.done) {
      box.innerHTML = `<div class="card">${scoreBanner(R.score, `<b>${L('Incident closed', 'تم إغلاق الحادثة')}</b> — ${L('see the replay for the full debrief.', 'راجع الإعادة للاستخلاص الكامل.')}`)}<div class="adv-btns"><button class="btn primary" id="icRep">⏮ ${L('Replay & debrief', 'الإعادة والاستخلاص')}</button><button class="btn" id="icAgain">↺ ${L('New incident', 'حادثة جديدة')}</button></div></div>`;
      box.querySelector('#icRep').onclick = () => { ui.tab = 'replay'; frame(); };
      box.querySelector('#icAgain').onclick = () => { ui.run = null; restoreAll(sys); frame(); };
      return;
    }
    if (!R.q) { box.innerHTML = `<div class="card ic-wait">⏳ ${L('Monitoring the incident…', 'متابعة الحادثة…')}</div>`; return; }
    box.innerHTML = `<div class="card ic-q"><div class="ic-q-h"><div class="ic-ring" id="icRing"><span id="icRingT"></span></div><b>${esc(tr(R.q.q))}</b></div>
      ${R.q.options.map((o, k) => `<button class="ic-opt" data-opt="${k}"><span class="k">${String.fromCharCode(65 + k)}</span><span>${esc(tr(o.t))}</span></button>`).join('')}</div>`;
  }

  function renderFeed(body) {
    const f = body.querySelector('#icFeed'); if (!f) return;
    f.innerHTML = ui.run.feed.slice().reverse().map((x) => `<div class="ic-f ${x.kind} ${x.pts != null ? (x.pts >= 8 ? 'good' : x.pts >= 4 ? 'mid' : 'bad') : ''}"><span class="t">${mmss(x.t)}</span><span>${x.kind === 'decision' ? '🧑‍✈️ ' : x.kind === 'timeout' ? '⌛ ' : '📻 '}${esc(tr(x.text))}</span></div>`).join('');
  }

  function update() {
    const body = el.querySelector('#icBody'); if (!body || !ui.run) return;
    updateSection(body.querySelector('.ce-sec'), sys);
    const clk = body.querySelector('#icClock'); if (clk) clk.textContent = mmss(ui.run.t);
    const met = body.querySelector('#icMeters');
    if (met) {
      const bar = (lbl, v, good) => `<div class="ic-m"><div class="lbl"><span>${lbl}</span><b>${Math.round(v)}%</b></div><div class="bar"><div style="width:${Math.max(0, Math.min(100, v))}%" class="${(good ? v >= 70 : v <= 35) ? 'ok' : (good ? v >= 40 : v <= 65) ? 'mid' : 'bad'}"></div></div></div>`;
      met.innerHTML = bar(`👥 ${L('Occupant safety', 'سلامة الشاغلين')}`, ui.st.life, true) + bar(`🔥 ${L('Fire size', 'حجم الحريق')}`, ui.st.fire, false) + bar(`🛡️ ${L('System integrity', 'سلامة النظام')}`, ui.st.system, true);
    }
    const ring = body.querySelector('#icRing');
    if (ring && ui.run.q) { const p = Math.max(0, ui.run.qT / ui.run.q.limit); ring.style.setProperty('--p', p * 100); body.querySelector('#icRingT').textContent = Math.ceil(ui.run.qT); ring.classList.toggle('late', p < 0.35); }
    if (body.querySelector('#icFeed') && body.querySelector('#icFeed').childElementCount !== ui.run.feed.length) renderFeed(body);
    if (!ui.run.q && !ui.run.done && body.querySelector('.ic-q')) renderQ(body);
    if (ui.run.q && !body.querySelector('.ic-q')) renderQ(body);
  }

  function renderReplay(body) {
    const last = store.get('icLast', null);
    if (!last) { body.innerHTML = `<div class="card">${L('Complete an incident first.', 'أكمل حادثة أولاً.')}</div>`; return; }
    const scen = SCENARIOS.find((s) => s.id === last.scen);
    const end = Math.max(1, ...last.feed.map((f) => f.t), ...last.snaps.map((s) => s.t));
    body.innerHTML = `${scoreBanner(last.score, `<b>${esc(tr(scen.title))}</b>`)}
      <div class="card"><h3>⏮ ${L('TIMELINE REPLAY', 'إعادة الخط الزمني')}<span class="r adv-pill info" id="rpT">00:00</span></h3>
        <input type="range" id="rpS" min="0" max="${end}" step="0.5" value="${end}" style="width:100%;accent-color:var(--accent)"/>
        <div class="ic-chart"><canvas id="rpC" height="120"></canvas></div>
        <div class="ic-feed" id="rpFeed" style="max-height:220px"></div></div>
      <div class="card" style="margin-top:12px"><h3>🎓 ${L('DEBRIEF — YOUR DECISIONS VS. BEST PRACTICE', 'الاستخلاص — قراراتك مقابل أفضل الممارسات')}</h3>
        <div class="adv-findings">${last.answers.map((a) => `<div class="adv-finding ${a.pts >= 8 ? 'ok' : a.pts >= 4 ? 'warn' : 'error'}"><span class="ic">${a.pts >= 8 ? '✅' : a.pts >= 4 ? '🟠' : '❌'}</span>
          <div><b>${esc(tr(a.q))}</b><div class="muted" style="margin-top:3px">${a.k < 0 ? L('No decision (timeout).', 'لم يُتخذ قرار (انتهى الوقت).') : ''} ${L('Best action', 'الإجراء الأفضل')}: ${esc(tr(a.best))}</div><div style="margin-top:3px">💡 ${esc(tr(a.bestWhy))}</div></div>
          <span class="ref">${a.pts}/10 · ${a.time.toFixed(0)} s</span></div>`).join('')}</div></div>`;
    const draw = (t) => {
      body.querySelector('#rpT').textContent = mmss(t);
      body.querySelector('#rpFeed').innerHTML = last.feed.filter((f) => f.t <= t).reverse().map((x) => `<div class="ic-f ${x.kind} ${x.pts != null ? (x.pts >= 8 ? 'good' : x.pts >= 4 ? 'mid' : 'bad') : ''}"><span class="t">${mmss(x.t)}</span><span>${esc(tr(x.text))}</span></div>`).join('');
      const c = body.querySelector('#rpC'); const g = c.getContext('2d'); const W = c.width = c.clientWidth * 2, H = c.height = 240;
      g.clearRect(0, 0, W, H);
      const line = (key, col) => { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); last.snaps.forEach((s, i) => { const x = (s.t / end) * W, y = H - (s[key] / 100) * (H - 20) - 10; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); };
      line('life', '#16a34a'); line('fire', '#dc2626'); line('system', '#2563eb');
      g.strokeStyle = '#94a3b8'; g.lineWidth = 2; g.setLineDash([8, 6]); g.beginPath(); g.moveTo((t / end) * W, 0); g.lineTo((t / end) * W, H); g.stroke(); g.setLineDash([]);
      for (const a of last.answers) { g.fillStyle = a.pts >= 8 ? '#16a34a' : a.pts >= 4 ? '#f59e0b' : '#dc2626'; g.beginPath(); g.arc((a.t / end) * W, 14, 8, 0, 7); g.fill(); }
    };
    body.querySelector('#rpS').oninput = (e) => draw(+e.target.value);
    requestAnimationFrame(() => draw(end));
  }

  frame();
  let prev = performance.now(), last = 0;
  const loop = (t) => {
    ui.raf = requestAnimationFrame(loop);
    const dt = Math.min(1, (t - prev) / 1000); prev = t;
    if (ui.tab === 'play' && ui.run) tick(dt);
    if (t - last > 200) { last = t; if (ui.tab === 'play') update(); }
  };
  ui.raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(ui.raf);
};

export default m;
