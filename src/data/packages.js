// Sellable content catalogue: what a license can include. The license generator
// (tools/license-generator.html) carries the same ids; a license lists the ids it covers
// per group, or leaves a group out to include all of it.
const T = (en, ar) => ({ en, ar });

export const CATALOG = {
  facilities: [
    ['HIGH_RISE', T('High-rise – Burj Khalifa', 'برج شاهق – برج خليفة')],
    ['WAREHOUSE', T('ESFR warehouse – Aqaba', 'مستودع ESFR – العقبة')],
    ['DATA_CENTER', T('FM-200 data centre – Amman', 'مركز بيانات FM-200 – عمّان')],
    ['TANK_FARM', T('Foam tank farm – Aqaba', 'خزانات نفط بالرغوة – العقبة')],
    ['HANGAR', T('Aircraft hangar – QAIA', 'حظيرة طائرات – مطار الملكة علياء')],
    ['CUSTOM', T('Create facility manually', 'إنشاء منشأة يدوياً')],
  ],
  scenes: [
    ['pumproom', T('Fire pump room & start sequence', 'غرفة المضخات وتسلسل التشغيل')],
    ['flowtest', T('Annual pump flow test', 'اختبار التدفق السنوي للمضخة')],
    ['drypipe', T('Dry-pipe valve trip & reset', 'صمام الأنابيب الجافة')],
    ['floorvalve', T('Floor control valve tests', 'صمام التحكم بالطابق')],
    ['extinguishers', T('Portable extinguishers & PASS', 'طفايات الحريق وطريقة PASS')],
    ['hosedrill', T('Landing valve hose drill', 'تدريب صمام الهبوط والخرطوم')],
    ['sprinklertypes', T('Sprinkler types & response race', 'أنواع الرشاشات وسباق الاستجابة')],
    ['stairpress', T('Stair pressurization (NFPA 92)', 'ضغط بيت الدرج (NFPA 92)')],
    ['fm200room', T('FM-200 room calculator & discharge', 'غرفة FM-200 والتفريغ')],
    ['install', T('3D installation mode (detectors & sprinklers)', 'وضع التركيب ثلاثي الأبعاد')],
  ],
  lab: [
    ['facp', T('Addressable panel lab', 'مختبر لوحة الإنذار المعنونة')],
    ['cause', T('Cause & effect matrix', 'مصفوفة السبب والنتيجة')],
    ['bms', T('BMS & building integration', 'التكامل مع نظام إدارة المبنى')],
    ['install', T('Installation rules', 'قواعد التركيب')],
    ['commission', T('Commissioning & acceptance', 'الاستلام والتشغيل')],
    ['maint', T('Predictive maintenance', 'الصيانة التنبؤية')],
    ['incident', T('Incident commander', 'قائد الحادثة')],
    ['tech', T('Modern detection & suppression', 'تقنيات الكشف والإطفاء الحديثة')],
    ['tools', T('Engineering tools', 'الأدوات الهندسية')],
    ['paths', T('Learning paths & certificates', 'المسارات والشهادات')],
  ],
  features: [
    ['dash', T('Dashboard (live charts)', 'لوحة المؤشرات')],
    ['data', T('Design Data editor', 'محرر بيانات التصميم')],
    ['learn', T('Lessons (Learn)', 'الدروس (تعلّم)')],
    ['quiz', T('Quiz', 'الاختبارات')],
    ['class', T('Classroom', 'الصف الدراسي')],
    ['reports', T('PDF reports', 'التقارير PDF')],
  ],
};

export const PACKAGE_NAMES = {
  full: T('Full program', 'البرنامج كاملاً'),
  sprinkler: T('Sprinklers, pumps & water-based systems', 'الرشاشات والمضخات والأنظمة المائية'),
  alarm: T('Smart fire alarm & life safety', 'إنذار الحريق الذكي والسلامة'),
  special: T('Special hazards (FM-200 & foam)', 'المخاطر الخاصة (FM-200 والرغوة)'),
  basic: T('Basic fire-safety awareness', 'التوعية الأساسية بالسلامة من الحريق'),
  custom: T('Custom package', 'باقة مخصصة'),
};
