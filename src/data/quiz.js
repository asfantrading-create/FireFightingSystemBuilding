// Quiz bank (English + Arabic). `topic` matches a lesson id in lessons.js; `answer` is the
// zero-based index of the correct option.

export const QUIZ = [
  // ---------------- fire-basics
  {
    id: 'q1', topic: 'fire-basics',
    q: { en: 'The fire tetrahedron adds which fourth element to the fire triangle?', ar: 'ما العنصر الرابع الذي يضيفه رباعي الحريق إلى مثلث الحريق؟' },
    options: [
      { en: 'Smoke', ar: 'الدخان' },
      { en: 'Uninhibited chemical chain reaction', ar: 'التفاعل الكيميائي المتسلسل غير المثبَّط' },
      { en: 'Nitrogen', ar: 'النيتروجين' },
      { en: 'Carbon monoxide', ar: 'أول أكسيد الكربون' }
    ],
    answer: 1,
    explain: { en: 'Flaming combustion is sustained by free-radical chain reactions; dry chemicals and halocarbon agents interrupt it.', ar: 'يستمر الاحتراق اللهبي بتفاعلات متسلسلة للجذور الحرة، وتقطعها المساحيق الكيميائية الجافة وعوامل الهالوكربون.' }
  },
  {
    id: 'q2', topic: 'fire-basics',
    q: { en: 'Under the US (NFPA 10) classification, a deep-fat fryer fire in a commercial kitchen is Class:', ar: 'وفق التصنيف الأمريكي (NFPA 10)، يُصنَّف حريق مقلاة زيت عميقة في مطبخ تجاري ضمن الفئة:' },
    options: [
      { en: 'B', ar: 'B' },
      { en: 'D', ar: 'D' },
      { en: 'C', ar: 'C' },
      { en: 'K', ar: 'K' }
    ],
    answer: 3,
    explain: { en: 'Cooking oils and fats are Class K in the US (Class F under EN 2); wet chemical agents are used.', ar: 'زيوت ودهون الطبخ من الفئة K في التصنيف الأمريكي (الفئة F في EN 2)، ويُستخدم لها العامل الكيميائي الرطب.' }
  },
  {
    id: 'q3', topic: 'fire-basics',
    q: { en: 'A medium t-squared fire (α = 0.01172 kW/s²) has what heat release rate after 300 s?', ar: 'ما معدل انطلاق الحرارة لحريق متوسط وفق مربع الزمن (α = 0.01172 كيلوواط/ث²) بعد 300 ثانية؟' },
    options: [
      { en: '≈ 1055 kW', ar: '≈ 1055 كيلوواط' },
      { en: '≈ 352 kW', ar: '≈ 352 كيلوواط' },
      { en: '≈ 3516 kW', ar: '≈ 3516 كيلوواط' },
      { en: '≈ 527 kW', ar: '≈ 527 كيلوواط' }
    ],
    answer: 0,
    explain: { en: 'Q = α·t² = 0.01172 × 300² = 0.01172 × 90,000 = 1054.8 kW ≈ 1055 kW (1000 Btu/s).', ar: 'Q = α·t² = 0.01172 × 300² = 0.01172 × 90,000 = 1054.8 كيلوواط ≈ 1055 كيلوواط (1000 وحدة حرارية بريطانية/ث).' }
  },
  {
    id: 'q4', topic: 'fire-basics',
    q: { en: 'Water from sprinklers extinguishes Class A fires mainly by:', ar: 'تطفئ مياه الرشاشات حرائق الفئة A أساساً عن طريق:' },
    options: [
      { en: 'Chemical inhibition of free radicals', ar: 'التثبيط الكيميائي للجذور الحرة' },
      { en: 'Removing the fuel', ar: 'إزالة الوقود' },
      { en: 'Cooling, thanks to its high latent heat of vaporisation', ar: 'التبريد، بفضل حرارته الكامنة العالية للتبخر' },
      { en: 'Raising the oxygen concentration', ar: 'رفع تركيز الأكسجين' }
    ],
    answer: 2,
    explain: { en: 'Water absorbs about 2260 kJ/kg when it evaporates, cooling the fuel below the point where it produces flammable vapour.', ar: 'يمتص الماء نحو 2260 كيلوجول/كجم عند تبخره، فيبرّد الوقود إلى ما دون النقطة التي يولّد عندها أبخرة قابلة للاشتعال.' }
  },

  // ---------------- systems-overview
  {
    id: 'q5', topic: 'systems-overview',
    q: { en: 'A double-interlock pre-action system admits water into the piping only when:', ar: 'لا يسمح النظام سابق التشغيل مزدوج التشابك بدخول المياه إلى الأنابيب إلا عندما:' },
    options: [
      { en: 'A detector operates', ar: 'يعمل كاشف' },
      { en: 'A sprinkler opens', ar: 'يفتح رشاش' },
      { en: 'A detector operates AND a sprinkler opens (loss of supervisory air)', ar: 'يعمل كاشف ويفتح رشاش معاً (فقدان هواء الإشراف)' },
      { en: 'The jockey pump starts', ar: 'تبدأ مضخة الاستعاضة (جوكي) بالعمل' }
    ],
    answer: 2,
    explain: { en: 'Double interlock needs both events, which protects sensitive rooms against accidental discharge from either a false alarm or a damaged pipe.', ar: 'يتطلب التشابك المزدوج الحدثين معاً، مما يحمي الغرف الحساسة من التصريف العرضي الناتج عن إنذار كاذب أو أنبوب تالف.' }
  },
  {
    id: 'q6', topic: 'systems-overview',
    q: { en: 'Which system is the simplest and most reliable and is used wherever the space stays above 4 °C?', ar: 'أي نظام هو الأبسط والأكثر اعتمادية ويُستخدم حيثما تبقى الحرارة فوق 4 °م؟' },
    options: [
      { en: 'Wet pipe system', ar: 'نظام الأنابيب الرطبة' },
      { en: 'Dry pipe system', ar: 'نظام الأنابيب الجافة' },
      { en: 'Deluge system', ar: 'نظام الغمر' },
      { en: 'Pre-action system', ar: 'النظام سابق التشغيل' }
    ],
    answer: 0,
    explain: { en: 'Wet pipe systems have water at every sprinkler, so they discharge immediately and have no trip valve to fail.', ar: 'في الأنظمة الرطبة تكون المياه عند كل رشاش، فتتدفق فوراً ولا يوجد صمام فتح قد يتعطل.' }
  },
  {
    id: 'q7', topic: 'systems-overview',
    q: { en: 'What is the purpose of the fire department connection (Siamese inlet)?', ar: 'ما الغرض من وصلة الدفاع المدني (المدخل الثنائي)؟' },
    options: [
      { en: 'To drain the system after testing', ar: 'تصريف النظام بعد الاختبار' },
      { en: 'To connect the jockey pump', ar: 'توصيل مضخة الجوكي' },
      { en: 'To fill the fire water tank from the municipal main', ar: 'ملء خزان مياه الحريق من الشبكة العامة' },
      { en: 'To let fire engines pump water into the sprinkler/standpipe system', ar: 'تمكين سيارات الإطفاء من ضخ المياه إلى نظام الرشاشات / الأنابيب القائمة' }
    ],
    answer: 3,
    explain: { en: 'The FDC allows the fire brigade to supplement flow and pressure, e.g. if the pumps fail or demand exceeds supply.', ar: 'تتيح وصلة الدفاع المدني لفرق الإطفاء دعم التدفق والضغط، مثلاً عند تعطل المضخات أو تجاوز الطلب للإمداد.' }
  },
  {
    id: 'q8', topic: 'systems-overview',
    q: { en: 'Which of the following is PASSIVE fire protection?', ar: 'أيٌّ مما يلي يُعد حماية سلبية (إنشائية) من الحريق؟' },
    options: [
      { en: 'Hose reel', ar: 'بكرة الخرطوم' },
      { en: 'Two-hour fire-rated compartment wall', ar: 'جدار تقسيم مقاوم للحريق لمدة ساعتين' },
      { en: 'Smoke detector', ar: 'كاشف الدخان' },
      { en: 'Deluge valve', ar: 'صمام الغمر' }
    ],
    answer: 1,
    explain: { en: 'Passive protection is built into the structure and works without activation, such as rated walls, floors and fire stopping.', ar: 'الحماية السلبية مدمجة في المبنى وتعمل دون تشغيل، مثل الجدران والأرضيات المقاومة للحريق وسدّ الفتحات.' }
  },

  // ---------------- sprinklers
  {
    id: 'q9', topic: 'sprinklers',
    q: { en: 'A red glass bulb sprinkler operates at:', ar: 'يعمل الرشاش ذو الأمبولة الزجاجية الحمراء عند:' },
    options: [
      { en: '57 °C', ar: '57 °م' },
      { en: '68 °C', ar: '68 °م' },
      { en: '79 °C', ar: '79 °م' },
      { en: '93 °C', ar: '93 °م' }
    ],
    answer: 1,
    explain: { en: 'Orange 57 °C, red 68 °C, yellow 79 °C, green 93 °C, blue 141 °C.', ar: 'البرتقالي 57 °م، والأحمر 68 °م، والأصفر 79 °م، والأخضر 93 °م، والأزرق 141 °م.' }
  },
  {
    id: 'q10', topic: 'sprinklers',
    q: { en: 'A K5.6 sprinkler operates at 16 psi. What is its discharge?', ar: 'رشاش بمعامل K5.6 يعمل عند 16 رطل/بوصة². ما تدفقه؟' },
    options: [
      { en: '11.2 gpm', ar: '11.2 جالون/دقيقة' },
      { en: '89.6 gpm', ar: '89.6 جالون/دقيقة' },
      { en: '22.4 gpm', ar: '22.4 جالون/دقيقة' },
      { en: '31.4 gpm', ar: '31.4 جالون/دقيقة' }
    ],
    answer: 2,
    explain: { en: 'Q = K√P = 5.6 × √16 = 5.6 × 4 = 22.4 gpm.', ar: 'Q = K√P = 5.6 × √16 = 5.6 × 4 = 22.4 جالون/دقيقة.' }
  },
  {
    id: 'q11', topic: 'sprinklers',
    q: { en: 'A K115 (metric, ≡ K8.0) sprinkler at the minimum pressure of 0.5 bar discharges approximately:', ar: 'رشاش بمعامل K115 (متري، يعادل K8.0) عند الضغط الأدنى 0.5 بار يصرّف تقريباً:' },
    options: [
      { en: '57.5 L/min', ar: '57.5 لتر/دقيقة' },
      { en: '115 L/min', ar: '115 لتر/دقيقة' },
      { en: '230 L/min', ar: '230 لتر/دقيقة' },
      { en: '81.3 L/min', ar: '81.3 لتر/دقيقة' }
    ],
    answer: 3,
    explain: { en: 'Q = 115 × √0.5 = 115 × 0.7071 = 81.3 L/min.', ar: 'Q = 115 × √0.5 = 115 × 0.7071 = 81.3 لتر/دقيقة.' }
  },
  {
    id: 'q12', topic: 'sprinklers',
    q: { en: 'What pressure is needed at a K5.6 sprinkler to discharge 30 gpm?', ar: 'ما الضغط اللازم عند رشاش بمعامل K5.6 ليصرّف 30 جالون/دقيقة؟' },
    options: [
      { en: '5.4 psi', ar: '5.4 رطل/بوصة²' },
      { en: '28.7 psi', ar: '28.7 رطل/بوصة²' },
      { en: '168 psi', ar: '168 رطل/بوصة²' },
      { en: '16.0 psi', ar: '16.0 رطل/بوصة²' }
    ],
    answer: 1,
    explain: { en: 'P = (Q/K)² = (30/5.6)² = 5.357² ≈ 28.7 psi (≈ 1.98 bar).', ar: 'P = (Q/K)² = (30/5.6)² = 5.357² ≈ 28.7 رطل/بوصة² (≈ 1.98 بار).' }
  },

  // ---------------- hazard-classification
  {
    id: 'q13', topic: 'hazard-classification',
    q: { en: 'An office building is normally classified under NFPA 13 as:', ar: 'يُصنَّف مبنى المكاتب عادةً وفق NFPA 13 على أنه:' },
    options: [
      { en: 'Light Hazard', ar: 'خطورة خفيفة' },
      { en: 'Ordinary Hazard Group 1', ar: 'خطورة عادية مجموعة 1' },
      { en: 'Ordinary Hazard Group 2', ar: 'خطورة عادية مجموعة 2' },
      { en: 'Extra Hazard Group 1', ar: 'خطورة عالية مجموعة 1' }
    ],
    answer: 0,
    explain: { en: 'Offices, schools, hospitals and hotels have low quantity/combustibility of contents: Light Hazard.', ar: 'المكاتب والمدارس والمستشفيات والفنادق ذات كمية وقابلية احتراق منخفضة للمحتويات: خطورة خفيفة.' }
  },
  {
    id: 'q14', topic: 'hazard-classification',
    q: { en: 'The combined inside + outside hose stream allowance for an Ordinary Hazard occupancy is:', ar: 'بدل الخراطيم المجمّع (الداخلي + الخارجي) لإشغال خطورة عادية هو:' },
    options: [
      { en: '100 gpm', ar: '100 جالون/دقيقة' },
      { en: '500 gpm', ar: '500 جالون/دقيقة' },
      { en: '250 gpm', ar: '250 جالون/دقيقة' },
      { en: '750 gpm', ar: '750 جالون/دقيقة' }
    ],
    answer: 2,
    explain: { en: 'NFPA 13: LH 100 gpm/30 min; OH 250 gpm/60–90 min; EH 500 gpm/90–120 min.', ar: 'حسب NFPA 13: الخفيفة 100 جالون/دقيقة لمدة 30 دقيقة؛ والعادية 250 جالون/دقيقة لمدة 60–90 دقيقة؛ والعالية 500 جالون/دقيقة لمدة 90–120 دقيقة.' }
  },
  {
    id: 'q15', topic: 'hazard-classification',
    q: { en: 'OH2 design: 0.20 gpm/ft² over 1500 ft², hose allowance 250 gpm, duration 60 min. Minimum dedicated fire water storage?', ar: 'تصميم خطورة عادية مجموعة 2: 0.20 جالون/دقيقة/قدم² على 1500 قدم²، وبدل خراطيم 250 جالون/دقيقة، ومدة 60 دقيقة. ما أدنى سعة تخزين مخصصة لمياه الحريق؟' },
    options: [
      { en: '18,000 gal', ar: '18,000 جالون' },
      { en: '15,000 gal', ar: '15,000 جالون' },
      { en: '48,000 gal', ar: '48,000 جالون' },
      { en: '33,000 gal', ar: '33,000 جالون' }
    ],
    answer: 3,
    explain: { en: 'Sprinklers 0.20 × 1500 = 300 gpm; + hose 250 = 550 gpm; × 60 min = 33,000 gal (≈ 125 m³). A real design uses the calculated (higher) sprinkler flow.', ar: 'الرشاشات 0.20 × 1500 = 300 جالون/دقيقة؛ + الخراطيم 250 = 550 جالون/دقيقة؛ × 60 دقيقة = 33,000 جالون (≈ 125 م³). ويستخدم التصميم الفعلي تدفق الرشاشات المحسوب (الأعلى).' }
  },
  {
    id: 'q16', topic: 'hazard-classification',
    q: { en: 'Calculated sprinkler demand is 1500 L/min, hose allowance 950 L/min, duration 60 min. Required tank volume?', ar: 'طلب الرشاشات المحسوب 1500 لتر/دقيقة، وبدل الخراطيم 950 لتر/دقيقة، والمدة 60 دقيقة. ما حجم الخزان المطلوب؟' },
    options: [
      { en: '147 m³', ar: '147 م³' },
      { en: '90 m³', ar: '90 م³' },
      { en: '57 m³', ar: '57 م³' },
      { en: '245 m³', ar: '245 م³' }
    ],
    answer: 0,
    explain: { en: '(1500 + 950) × 60 = 147,000 L = 147 m³ (effective volume, excluding dead water below the suction).', ar: '(1500 + 950) × 60 = 147,000 لتر = 147 م³ (الحجم الفعّال، دون المياه الميتة أسفل فتحة السحب).' }
  },

  // ---------------- pipe-schedule
  {
    id: 'q17', topic: 'pipe-schedule',
    q: { en: 'Under the light hazard steel pipe schedule, a 2½" pipe may supply up to:', ar: 'وفق جدول الأنابيب الفولاذية للخطورة الخفيفة، يمكن لأنبوب 2½ بوصة تغذية حتى:' },
    options: [
      { en: '10 sprinklers', ar: '10 رشاشات' },
      { en: '20 sprinklers', ar: '20 رشاشاً' },
      { en: '30 sprinklers', ar: '30 رشاشاً' },
      { en: '60 sprinklers', ar: '60 رشاشاً' }
    ],
    answer: 2,
    explain: { en: 'LH: 1"=2, 1¼"=3, 1½"=5, 2"=10, 2½"=30, 3"=60.', ar: 'الخطورة الخفيفة: 1 بوصة=2، 1¼=3، 1½=5، 2=10، 2½=30، 3=60.' }
  },
  {
    id: 'q18', topic: 'pipe-schedule',
    q: { en: 'Under the ordinary hazard steel pipe schedule, a 3" pipe may supply up to:', ar: 'وفق جدول الأنابيب الفولاذية للخطورة العادية، يمكن لأنبوب 3 بوصات تغذية حتى:' },
    options: [
      { en: '60 sprinklers', ar: '60 رشاشاً' },
      { en: '40 sprinklers', ar: '40 رشاشاً' },
      { en: '65 sprinklers', ar: '65 رشاشاً' },
      { en: '20 sprinklers', ar: '20 رشاشاً' }
    ],
    answer: 1,
    explain: { en: 'OH: 2½"=20, 3"=40, 3½"=65, 4"=100, 5"=160, 6"=275.', ar: 'الخطورة العادية: 2½ بوصة=20، 3=40، 3½=65، 4=100، 5=160، 6=275.' }
  },
  {
    id: 'q19', topic: 'pipe-schedule',
    q: { en: 'An ordinary hazard pipe schedule main must feed 120 sprinklers. The smallest permitted steel size is:', ar: 'خط رئيسي بطريقة جدول الأنابيب للخطورة العادية يجب أن يغذي 120 رشاشاً. ما أصغر قطر فولاذي مسموح؟' },
    options: [
      { en: '3½"', ar: '3½ بوصة' },
      { en: '4"', ar: '4 بوصات' },
      { en: '5"', ar: '5 بوصات' },
      { en: '6"', ar: '6 بوصات' }
    ],
    answer: 2,
    explain: { en: '4" is limited to 100 sprinklers, so 120 requires 5" (up to 160).', ar: 'الأنبوب 4 بوصات محدود بـ 100 رشاش، لذا يتطلب 120 رشاشاً أنبوب 5 بوصات (حتى 160).' }
  },
  {
    id: 'q20', topic: 'pipe-schedule',
    q: { en: 'For an ordinary hazard pipe schedule system, the minimum residual pressure required at the highest sprinkler is:', ar: 'في نظام جدول الأنابيب للخطورة العادية، ما أدنى ضغط متبقٍّ مطلوب عند أعلى رشاش؟' },
    options: [
      { en: '7 psi', ar: '7 رطل/بوصة²' },
      { en: '15 psi', ar: '15 رطل/بوصة²' },
      { en: '50 psi', ar: '50 رطل/بوصة²' },
      { en: '20 psi', ar: '20 رطل/بوصة²' }
    ],
    answer: 3,
    explain: { en: 'Light hazard 15 psi (1.0 bar); ordinary hazard 20 psi (1.4 bar). 50 psi applies to large new pipe schedule systems over 5000 ft².', ar: 'الخطورة الخفيفة 15 رطل/بوصة² (1.0 بار)؛ والعادية 20 رطل/بوصة² (1.4 بار). ويُطبَّق 50 رطل/بوصة² على أنظمة جدول الأنابيب الجديدة الكبيرة التي تزيد على 5000 قدم².' }
  },

  // ---------------- hydraulic-calcs
  {
    id: 'q21', topic: 'hydraulic-calcs',
    q: { en: 'Per Hazen–Williams, if the flow in a pipe doubles, the friction loss becomes approximately:', ar: 'وفق هازن–ويليامز، إذا تضاعف التدفق في أنبوب، يصبح فقد الاحتكاك تقريباً:' },
    options: [
      { en: '2 times', ar: 'ضعفين' },
      { en: '3.6 times', ar: '3.6 أضعاف' },
      { en: '4 times', ar: '4 أضعاف' },
      { en: '29 times', ar: '29 ضعفاً' }
    ],
    answer: 1,
    explain: { en: 'Loss ∝ Q^1.85, so 2^1.85 ≈ 3.6.', ar: 'الفقد ∝ Q^1.85، إذن 2^1.85 ≈ 3.6.' }
  },
  {
    id: 'q22', topic: 'hydraulic-calcs',
    q: { en: 'The highest sprinkler is 20 m above the pump discharge. The static elevation loss is about:', ar: 'أعلى رشاش يقع على ارتفاع 20 م فوق طرد المضخة. كم يبلغ فقد الضغط بسبب الارتفاع تقريباً؟' },
    options: [
      { en: '0.43 bar', ar: '0.43 بار' },
      { en: '8.7 bar', ar: '8.7 بار' },
      { en: '0.98 bar', ar: '0.98 بار' },
      { en: '1.96 bar', ar: '1.96 بار' }
    ],
    answer: 3,
    explain: { en: '0.098 bar/m × 20 m = 1.96 bar (≈ 0.433 psi/ft × 65.6 ft ≈ 28.4 psi).', ar: '0.098 بار/م × 20 م = 1.96 بار (≈ 0.433 رطل/بوصة²/قدم × 65.6 قدم ≈ 28.4 رطل/بوصة²).' }
  },
  {
    id: 'q23', topic: 'hydraulic-calcs',
    q: { en: 'OH2 remote area 1500 ft² with 130 ft² per sprinkler. How many sprinklers are in the design area?', ar: 'المنطقة البعيدة لخطورة عادية مجموعة 2 مساحتها 1500 قدم² بتغطية 130 قدم² لكل رشاش. كم عدد الرشاشات في مساحة التصميم؟' },
    options: [
      { en: '12', ar: '12' },
      { en: '11', ar: '11' },
      { en: '15', ar: '15' },
      { en: '10', ar: '10' }
    ],
    answer: 0,
    explain: { en: '1500 / 130 = 11.5, always rounded up → 12 sprinklers.', ar: '1500 ÷ 130 = 11.5، ويُقرَّب دائماً لأعلى ← 12 رشاشاً.' }
  },
  {
    id: 'q24', topic: 'hydraulic-calcs',
    q: { en: 'OH1 (0.15 gpm/ft²), 130 ft² per sprinkler, K5.6. Required pressure at the most demanding sprinkler?', ar: 'خطورة عادية مجموعة 1 (0.15 جالون/دقيقة/قدم²)، و130 قدم² لكل رشاش، ومعامل K5.6. ما الضغط المطلوب عند الرشاش الأكثر طلباً؟' },
    options: [
      { en: '7.0 psi', ar: '7.0 رطل/بوصة²' },
      { en: '12.1 psi', ar: '12.1 رطل/بوصة²' },
      { en: '19.5 psi', ar: '19.5 رطل/بوصة²' },
      { en: '3.5 psi', ar: '3.5 رطل/بوصة²' }
    ],
    answer: 1,
    explain: { en: 'Q = 0.15 × 130 = 19.5 gpm; P = (19.5/5.6)² = 3.482² ≈ 12.1 psi (above the 7 psi minimum).', ar: 'Q = 0.15 × 130 = 19.5 جالون/دقيقة؛ P = (19.5/5.6)² = 3.482² ≈ 12.1 رطل/بوصة² (أعلى من الحد الأدنى 7 رطل/بوصة²).' }
  },

  // ---------------- fire-pumps
  {
    id: 'q25', topic: 'fire-pumps',
    q: { en: 'A fire pump is rated 500 gpm at 100 psi. At 750 gpm it must still deliver at least:', ar: 'مضخة حريق مقنّنة عند 500 جالون/دقيقة و100 رطل/بوصة². عند 750 جالون/دقيقة يجب أن توفّر على الأقل:' },
    options: [
      { en: '50 psi', ar: '50 رطل/بوصة²' },
      { en: '100 psi', ar: '100 رطل/بوصة²' },
      { en: '65 psi', ar: '65 رطل/بوصة²' },
      { en: '140 psi', ar: '140 رطل/بوصة²' }
    ],
    answer: 2,
    explain: { en: '750 gpm = 150% of rated flow, where NFPA 20 requires ≥ 65% of rated pressure: 0.65 × 100 = 65 psi.', ar: '750 جالون/دقيقة = 150% من التدفق المقنّن، ويشترط NFPA 20 عندها ≥ 65% من الضغط المقنّن: 0.65 × 100 = 65 رطل/بوصة².' }
  },
  {
    id: 'q26', topic: 'fire-pumps',
    q: { en: 'A pump rated 750 gpm at 8 bar. The maximum permitted churn (shut-off) pressure is:', ar: 'مضخة مقنّنة عند 750 جالون/دقيقة و8 بار. ما أقصى ضغط إغلاق (عند تدفق صفري) مسموح؟' },
    options: [
      { en: '8.8 bar', ar: '8.8 بار' },
      { en: '10.4 bar', ar: '10.4 بار' },
      { en: '12.0 bar', ar: '12.0 بار' },
      { en: '11.2 bar', ar: '11.2 بار' }
    ],
    answer: 3,
    explain: { en: 'Churn ≤ 140% of rated pressure: 1.4 × 8 = 11.2 bar.', ar: 'ضغط الإغلاق ≤ 140% من الضغط المقنّن: 1.4 × 8 = 11.2 بار.' }
  },
  {
    id: 'q27', topic: 'fire-pumps',
    q: { en: 'Pump churn pressure is 120 psi and minimum static suction pressure is 15 psi. Using NFPA 20 Annex A, the main (electric) pump start setpoint is:', ar: 'ضغط الإغلاق للمضخة 120 رطل/بوصة² وأدنى ضغط سحب ساكن 15 رطل/بوصة². وفق الملحق A من NFPA 20، ما نقطة بدء تشغيل المضخة الرئيسية (الكهربائية)؟' },
    options: [
      { en: '125 psi', ar: '125 رطل/بوصة²' },
      { en: '120 psi', ar: '120 رطل/بوصة²' },
      { en: '115 psi', ar: '115 رطل/بوصة²' },
      { en: '135 psi', ar: '135 رطل/بوصة²' }
    ],
    answer: 1,
    explain: { en: 'Jockey stop = 120 + 15 = 135; jockey start = 135 − 10 = 125; main pump start = 125 − 5 = 120 psi (diesel would start at 110).', ar: 'إيقاف الجوكي = 120 + 15 = 135؛ بدء الجوكي = 135 − 10 = 125؛ بدء المضخة الرئيسية = 125 − 5 = 120 رطل/بوصة² (وتبدأ مضخة الديزل عند 110).' }
  },
  {
    id: 'q28', topic: 'fire-pumps',
    q: { en: 'NFPA 25 requires a diesel fire pump to be run without flow:', ar: 'يشترط NFPA 25 تشغيل مضخة الحريق العاملة بالديزل دون تدفق:' },
    options: [
      { en: 'Monthly for 10 minutes', ar: 'شهرياً لمدة 10 دقائق' },
      { en: 'Annually for 1 hour', ar: 'سنوياً لمدة ساعة' },
      { en: 'Daily for 5 minutes', ar: 'يومياً لمدة 5 دقائق' },
      { en: 'Weekly for at least 30 minutes', ar: 'أسبوعياً لمدة 30 دقيقة على الأقل' }
    ],
    answer: 3,
    explain: { en: 'Diesel engines are run weekly for 30 min to reach operating temperature; electric pumps run 10 min (monthly for most, weekly in some cases).', ar: 'تُشغَّل محركات الديزل أسبوعياً لمدة 30 دقيقة لتبلغ حرارة التشغيل؛ وتُشغَّل المضخات الكهربائية 10 دقائق (شهرياً لمعظمها، وأسبوعياً في بعض الحالات).' }
  },

  // ---------------- standpipes
  {
    id: 'q29', topic: 'standpipes',
    q: { en: 'Minimum residual pressure at the most remote 2½" (65 mm) hose connection of a Class I standpipe:', ar: 'أدنى ضغط متبقٍّ عند أبعد وصلة خرطوم 2½ بوصة (65 مم) في أنبوب قائم من الفئة I:' },
    options: [
      { en: '65 psi (4.5 bar)', ar: '65 رطل/بوصة² (4.5 بار)' },
      { en: '175 psi (12.1 bar)', ar: '175 رطل/بوصة² (12.1 بار)' },
      { en: '100 psi (6.9 bar)', ar: '100 رطل/بوصة² (6.9 بار)' },
      { en: '50 psi (3.4 bar)', ar: '50 رطل/بوصة² (3.4 بار)' }
    ],
    answer: 2,
    explain: { en: 'NFPA 14: 100 psi at the most remote 2½" outlet; 65 psi applies to 1½" Class II hose stations.', ar: 'حسب NFPA 14: 100 رطل/بوصة² عند أبعد مخرج 2½ بوصة؛ و65 رطل/بوصة² لمحطات خراطيم 1½ بوصة من الفئة II.' }
  },
  {
    id: 'q30', topic: 'standpipes',
    q: { en: 'A fully sprinklered building has 3 Class I standpipes. The required standpipe system flow is:', ar: 'مبنى مرشوش بالكامل به 3 أنابيب قائمة من الفئة I. ما التدفق المطلوب لنظام الأنابيب القائمة؟' },
    options: [
      { en: '750 gpm', ar: '750 جالون/دقيقة' },
      { en: '1000 gpm', ar: '1000 جالون/دقيقة' },
      { en: '1250 gpm', ar: '1250 جالون/دقيقة' },
      { en: '1500 gpm', ar: '1500 جالون/دقيقة' }
    ],
    answer: 1,
    explain: { en: '500 (first) + 250 + 250 = 1000 gpm, which is also the maximum for sprinklered buildings.', ar: '500 (الأول) + 250 + 250 = 1000 جالون/دقيقة، وهو أيضاً الحد الأقصى للمباني المرشوشة.' }
  },
  {
    id: 'q31', topic: 'standpipes',
    q: { en: 'A NON-sprinklered building has 5 Class I standpipes. The required flow is:', ar: 'مبنى غير مرشوش به 5 أنابيب قائمة من الفئة I. ما التدفق المطلوب؟' },
    options: [
      { en: '1000 gpm', ar: '1000 جالون/دقيقة' },
      { en: '1500 gpm', ar: '1500 جالون/دقيقة' },
      { en: '1750 gpm', ar: '1750 جالون/دقيقة' },
      { en: '1250 gpm', ar: '1250 جالون/دقيقة' }
    ],
    answer: 3,
    explain: { en: '500 + 4 × 250 = 1500 gpm, but the total is capped at 1250 gpm for non-sprinklered buildings.', ar: '500 + 4 × 250 = 1500 جالون/دقيقة، لكن الإجمالي محدود بـ 1250 جالون/دقيقة للمباني غير المرشوشة.' }
  },
  {
    id: 'q32', topic: 'standpipes',
    q: { en: 'A pressure-regulating device is required at a 2½" hose connection when the pressure exceeds:', ar: 'يلزم جهاز تنظيم ضغط عند وصلة خرطوم 2½ بوصة عندما يتجاوز الضغط:' },
    options: [
      { en: '175 psi (12.1 bar)', ar: '175 رطل/بوصة² (12.1 بار)' },
      { en: '100 psi (6.9 bar)', ar: '100 رطل/بوصة² (6.9 بار)' },
      { en: '350 psi (24.1 bar)', ar: '350 رطل/بوصة² (24.1 بار)' },
      { en: '65 psi (4.5 bar)', ar: '65 رطل/بوصة² (4.5 بار)' }
    ],
    answer: 0,
    explain: { en: 'Above 175 psi, fire fighters cannot safely handle the hose; PRVs limit static and residual pressure to 175 psi. 350 psi is the maximum system pressure.', ar: 'فوق 175 رطل/بوصة² لا يستطيع رجال الإطفاء التعامل مع الخرطوم بأمان؛ لذا تحدّ صمامات تخفيض الضغط الضغطين الساكن والمتبقي عند 175. أما 350 رطل/بوصة² فهو أقصى ضغط للنظام.' }
  },

  // ---------------- detection-alarm
  {
    id: 'q33', topic: 'detection-alarm',
    q: { en: 'Which smoke detector type responds best to slow, smouldering fires with large particles?', ar: 'أي نوع من كواشف الدخان يستجيب بشكل أفضل للحرائق الخامدة البطيئة ذات الجسيمات الكبيرة؟' },
    options: [
      { en: 'Ionisation', ar: 'التأيّني' },
      { en: 'Photoelectric (optical)', ar: 'الكهروضوئي (البصري)' },
      { en: 'Fixed-temperature heat', ar: 'الحراري ثابت الحرارة' },
      { en: 'UV flame', ar: 'كاشف اللهب فوق البنفسجي' }
    ],
    answer: 1,
    explain: { en: 'Large smoke particles scatter light efficiently in the optical chamber; ionisation favours small particles from flaming fires.', ar: 'تشتت جسيمات الدخان الكبيرة الضوء بكفاءة في الحجرة البصرية؛ بينما يناسب التأيّني الجسيمات الصغيرة من الحرائق اللهبية.' }
  },
  {
    id: 'q34', topic: 'detection-alarm',
    q: { en: 'Closing a sprinkler control valve fitted with a tamper switch produces which signal at the FACP?', ar: 'إغلاق صمام تحكم للرشاشات مزوّد بمفتاح عبث يولّد أي إشارة في لوحة إنذار الحريق؟' },
    options: [
      { en: 'Fire alarm', ar: 'إنذار حريق' },
      { en: 'Trouble', ar: 'عطل' },
      { en: 'Pre-discharge', ar: 'ما قبل الإطلاق' },
      { en: 'Supervisory', ar: 'إشرافية' }
    ],
    answer: 3,
    explain: { en: 'Valve tamper switches are supervisory devices; a water flow switch produces the alarm signal.', ar: 'مفاتيح العبث بالصمامات أجهزة إشرافية؛ أما مفتاح تدفق المياه فيولّد إشارة الإنذار.' }
  },
  {
    id: 'q35', topic: 'detection-alarm',
    q: { en: 'Why is cross-zoning used to release clean-agent and pre-action systems?', ar: 'لماذا يُستخدم التقاطع بين المناطق لإطلاق أنظمة الغاز النظيف والأنظمة سابقة التشغيل؟' },
    options: [
      { en: 'To reduce the risk of discharge from a single false alarm', ar: 'للحد من خطر الإطلاق بسبب إنذار كاذب واحد' },
      { en: 'To reduce the number of detectors', ar: 'لتقليل عدد الكواشف' },
      { en: 'To increase the discharge time', ar: 'لزيادة زمن التصريف' },
      { en: 'To avoid the need for manual release', ar: 'للاستغناء عن الإطلاق اليدوي' }
    ],
    answer: 0,
    explain: { en: 'Two independent detectors/zones must confirm the fire before release.', ar: 'يجب أن يؤكد كاشفان أو منطقتان مستقلتان وجود الحريق قبل الإطلاق.' }
  },
  {
    id: 'q36', topic: 'detection-alarm',
    q: { en: 'A rate-of-rise heat detector typically alarms when temperature rises faster than about:', ar: 'يعطي كاشف الحرارة بمعدل الارتفاع إنذاراً عادةً عندما ترتفع الحرارة أسرع من نحو:' },
    options: [
      { en: '1 °C/min', ar: '1 °م/دقيقة' },
      { en: '3 °C/min', ar: '3 °م/دقيقة' },
      { en: '8.3 °C/min (15 °F/min)', ar: '8.3 °م/دقيقة (15 °ف/دقيقة)' },
      { en: '30 °C/min', ar: '30 °م/دقيقة' }
    ],
    answer: 2,
    explain: { en: 'Rate-of-rise elements typically respond at about 8.3 °C/min (15 °F/min), usually combined with a fixed-temperature element.', ar: 'تستجيب عناصر معدل الارتفاع عادةً عند نحو 8.3 °م/دقيقة (15 °ف/دقيقة)، وغالباً تُدمج مع عنصر ثابت الحرارة.' }
  },

  // ---------------- clean-agent
  {
    id: 'q37', topic: 'clean-agent',
    q: { en: 'FM-200 for a server room 10 m × 8 m × 3 m at 20 °C, design concentration 7% (S = 0.1269 + 0.0005131·T). Agent quantity?', ar: 'غاز FM-200 لغرفة خوادم 10 م × 8 م × 3 م عند 20 °م، بتركيز تصميمي 7% (S = 0.1269 + 0.0005131·T). ما كمية الغاز؟' },
    options: [
      { en: '122.5 kg', ar: '122.5 كجم' },
      { en: '16.8 kg', ar: '16.8 كجم' },
      { en: '131.7 kg', ar: '131.7 كجم' },
      { en: '141.7 kg', ar: '141.7 كجم' }
    ],
    answer: 2,
    explain: { en: 'V = 240 m³; S = 0.13716 m³/kg; W = (240/0.13716) × (7/93) = 1749.8 × 0.07527 ≈ 131.7 kg.', ar: 'V = 240 م³؛ S = 0.13716 م³/كجم؛ W = (240/0.13716) × (7/93) = 1749.8 × 0.07527 ≈ 131.7 كجم.' }
  },
  {
    id: 'q38', topic: 'clean-agent',
    q: { en: 'A 200 m³ room at a minimum of 30 °C needs 8% FM-200. The agent mass is approximately:', ar: 'غرفة حجمها 200 م³ عند حرارة دنيا 30 °م تحتاج إلى FM-200 بتركيز 8%. كتلة الغاز تقريباً:' },
    options: [
      { en: '122.2 kg', ar: '122.2 كجم' },
      { en: '112.4 kg', ar: '112.4 كجم' },
      { en: '139.1 kg', ar: '139.1 كجم' },
      { en: '106.3 kg', ar: '106.3 كجم' }
    ],
    answer: 0,
    explain: { en: 'S = 0.1269 + 0.0005131 × 30 = 0.14229; W = (200/0.14229) × (8/92) = 1405.6 × 0.08696 ≈ 122.2 kg. (112.4 kg wrongly uses C/100.)', ar: 'S = 0.1269 + 0.0005131 × 30 = 0.14229؛ W = (200/0.14229) × (8/92) = 1405.6 × 0.08696 ≈ 122.2 كجم. (القيمة 112.4 كجم ناتجة عن استخدام C/100 خطأً.)' }
  },
  {
    id: 'q39', topic: 'clean-agent',
    q: { en: 'The NOAEL (no observed adverse effect level) of HFC-227ea is:', ar: 'مستوى NOAEL (عدم ملاحظة أي تأثير ضار) لغاز HFC-227ea هو:' },
    options: [
      { en: '7%', ar: '7%' },
      { en: '9%', ar: '9%' },
      { en: '10.5%', ar: '10.5%' },
      { en: '12%', ar: '12%' }
    ],
    answer: 1,
    explain: { en: 'NOAEL 9%, LOAEL 10.5%. Occupied spaces are normally designed at or below the NOAEL.', ar: 'مستوى NOAEL هو 9% ومستوى LOAEL هو 10.5%. وتُصمَّم الأماكن المشغولة عادةً عند مستوى NOAEL أو أقل.' }
  },
  {
    id: 'q40', topic: 'clean-agent',
    q: { en: 'NFPA 2001 requires halocarbon agents such as FM-200 to discharge (95% of design quantity) within:', ar: 'يشترط NFPA 2001 أن تُصرِّف عوامل الهالوكربون مثل FM-200 (95% من الكمية التصميمية) خلال:' },
    options: [
      { en: '60 s', ar: '60 ثانية' },
      { en: '30 s', ar: '30 ثانية' },
      { en: '120 s', ar: '120 ثانية' },
      { en: '10 s', ar: '10 ثوانٍ' }
    ],
    answer: 3,
    explain: { en: 'A 10 s discharge limits thermal decomposition products (HF). Inert gases are allowed 60 s (120 s for Class A/C).', ar: 'التصريف خلال 10 ثوانٍ يحدّ من نواتج التحلل الحراري (فلوريد الهيدروجين). ويُسمح للغازات الخاملة بـ 60 ثانية (120 ثانية للفئتين A وC).' }
  },

  // ---------------- foam-and-special
  {
    id: 'q41', topic: 'foam-and-special',
    q: { en: 'Minimum foam solution application rate for a fixed-roof hydrocarbon tank with Type II discharge outlets (NFPA 11):', ar: 'أدنى معدل تطبيق لمحلول الرغوة لخزان هيدروكربوني ذي سقف ثابت بمخارج تصريف من النوع II (NFPA 11):' },
    options: [
      { en: '2.0 L/min·m²', ar: '2.0 لتر/دقيقة·م²' },
      { en: '4.1 L/min·m² (0.10 gpm/ft²)', ar: '4.1 لتر/دقيقة·م² (0.10 جالون/دقيقة/قدم²)' },
      { en: '6.5 L/min·m² (0.16 gpm/ft²)', ar: '6.5 لتر/دقيقة·م² (0.16 جالون/دقيقة/قدم²)' },
      { en: '12.2 L/min·m² (0.30 gpm/ft²)', ar: '12.2 لتر/دقيقة·م² (0.30 جالون/دقيقة/قدم²)' }
    ],
    answer: 1,
    explain: { en: '4.1 L/min·m² over the liquid surface; 12.2 L/min·m² is the floating-roof rim seal rate.', ar: '4.1 لتر/دقيقة·م² على سطح السائل؛ أما 12.2 لتر/دقيقة·م² فهو معدل منطقة الإحكام الحلقي للسقف العائم.' }
  },
  {
    id: 'q42', topic: 'foam-and-special',
    q: { en: 'A 20 m diameter fixed-roof diesel tank is protected at 4.1 L/min·m². Required foam solution flow?', ar: 'خزان ديزل ذو سقف ثابت قطره 20 م يُحمى بمعدل 4.1 لتر/دقيقة·م². ما تدفق محلول الرغوة المطلوب؟' },
    options: [
      { en: '322 L/min', ar: '322 لتر/دقيقة' },
      { en: '644 L/min', ar: '644 لتر/دقيقة' },
      { en: '1288 L/min', ar: '1288 لتر/دقيقة' },
      { en: '5153 L/min', ar: '5153 لتر/دقيقة' }
    ],
    answer: 2,
    explain: { en: 'A = π × 10² = 314.2 m²; 314.2 × 4.1 ≈ 1288 L/min (diesel, flash point > 37.8 °C → 30 min).', ar: 'A = π × 10² = 314.2 م²؛ 314.2 × 4.1 ≈ 1288 لتر/دقيقة (الديزل نقطة وميضه > 37.8 °م ← 30 دقيقة).' }
  },
  {
    id: 'q43', topic: 'foam-and-special',
    q: { en: 'Which foam concentrate must be used on polar solvents such as ethanol or acetone?', ar: 'أي مركّز رغوة يجب استخدامه للمذيبات القطبية مثل الإيثانول أو الأسيتون؟' },
    options: [
      { en: 'Standard AFFF', ar: 'رغوة AFFF القياسية' },
      { en: 'Protein foam', ar: 'الرغوة البروتينية' },
      { en: 'High-expansion foam', ar: 'الرغوة عالية التمدد' },
      { en: 'Alcohol-resistant AFFF (AR-AFFF)', ar: 'رغوة AFFF المقاومة للكحول (AR-AFFF)' }
    ],
    answer: 3,
    explain: { en: 'Polar solvents dissolve ordinary foam; AR concentrates form a polymeric membrane that protects the blanket.', ar: 'تذيب المذيبات القطبية الرغوة العادية؛ أما المركزات المقاومة للكحول فتكوّن غشاءً بوليمرياً يحمي غطاء الرغوة.' }
  },
  {
    id: 'q44', topic: 'foam-and-special',
    q: { en: 'Floating-roof tank rim seal foam protection (foam dam) is designed at:', ar: 'تُصمَّم حماية منطقة الإحكام الحلقي بالرغوة (حاجز الرغوة) في الخزانات ذات السقف العائم عند:' },
    options: [
      { en: '4.1 L/min·m² for 55 min', ar: '4.1 لتر/دقيقة·م² لمدة 55 دقيقة' },
      { en: '6.5 L/min·m² for 10 min', ar: '6.5 لتر/دقيقة·م² لمدة 10 دقائق' },
      { en: '12.2 L/min·m² for 20 min', ar: '12.2 لتر/دقيقة·م² لمدة 20 دقيقة' },
      { en: '10.2 L/min·m² for 60 min', ar: '10.2 لتر/دقيقة·م² لمدة 60 دقيقة' }
    ],
    answer: 2,
    explain: { en: 'NFPA 11: 12.2 L/min·m² (0.30 gpm/ft²) over the annular seal area for 20 min.', ar: 'حسب NFPA 11: 12.2 لتر/دقيقة·م² (0.30 جالون/دقيقة/قدم²) على مساحة الإحكام الحلقي لمدة 20 دقيقة.' }
  },
  {
    id: 'q45', topic: 'foam-and-special',
    q: { en: 'Per NFPA 25, how often must a full-flow performance test (churn, 100%, 150%) be performed on a fire pump?', ar: 'وفق NFPA 25، كم مرة يجب إجراء اختبار أداء التدفق الكامل (الإغلاق و100% و150%) لمضخة الحريق؟' },
    options: [
      { en: 'Weekly', ar: 'أسبوعياً' },
      { en: 'Annually', ar: 'سنوياً' },
      { en: 'Every 5 years', ar: 'كل 5 سنوات' },
      { en: 'Quarterly', ar: 'ربع سنوي' }
    ],
    answer: 1,
    explain: { en: 'The annual flow test compares results with the original acceptance curve (must be within 95%).', ar: 'يقارن اختبار التدفق السنوي النتائج بمنحنى القبول الأصلي (ويجب أن تكون ضمن 95%).' }
  },

  // ================= Additional questions

  // ---------------- fire-extinguishers
  {
    id: 'q46', topic: 'fire-extinguishers',
    q: { en: 'In NFPA 10, a rating of 1-A is equivalent to the extinguishing capability of:', ar: 'في NFPA 10، يعادل التصنيف 1-A قدرة الإطفاء لـ:' },
    options: [
      { en: '1 US gal (3.8 L) of water', ar: 'جالون أمريكي واحد (3.8 لتر) من الماء' },
      { en: '2.5 US gal (9.5 L) of water', ar: '2.5 جالون أمريكي (9.5 لتر) من الماء' },
      { en: '1.25 US gal (4.7 L) of water', ar: '1.25 جالون أمريكي (4.7 لتر) من الماء' },
      { en: '5 US gal (18.9 L) of water', ar: '5 جالونات أمريكية (18.9 لتر) من الماء' }
    ],
    answer: 2,
    explain: { en: '1-A = 1.25 gal of water, so the common 2.5 gal pressurized-water extinguisher is rated 2-A.', ar: '1-A = ‏1.25 جالون من الماء، لذا فطفاية الماء المضغوط الشائعة سعة 2.5 جالون تصنيفها 2-A.' }
  },
  {
    id: 'q47', topic: 'fire-extinguishers',
    q: { en: 'Why does a CO₂ extinguisher have no pressure gauge?', ar: 'لماذا لا يوجد مقياس ضغط على طفاية ثاني أكسيد الكربون؟' },
    options: [
      { en: 'The liquefied CO₂ keeps almost the same pressure until nearly empty, so a gauge would mislead; it is checked by weighing', ar: 'يحافظ CO₂ المسال على الضغط نفسه تقريباً حتى يكاد يفرغ، فيضلّل المقياس؛ لذا تُفحص بالوزن' },
      { en: 'CO₂ is stored at atmospheric pressure', ar: 'يُخزَّن CO₂ عند الضغط الجوي' },
      { en: 'Gauges are forbidden on red cylinders', ar: 'المقاييس ممنوعة على الأسطوانات الحمراء' },
      { en: 'CO₂ extinguishers are single-use and thrown away', ar: 'طفايات CO₂ تُستخدم مرة واحدة ثم تُرمى' }
    ],
    answer: 0,
    explain: { en: 'Vapour pressure depends on temperature, not on how much liquid is left, so the net weight is compared with the full weight stamped on the cylinder.', ar: 'يعتمد ضغط البخار على الحرارة لا على كمية السائل المتبقية، لذا يُقارن الوزن الصافي بالوزن الممتلئ المختوم على الأسطوانة.' }
  },
  {
    id: 'q48', topic: 'fire-extinguishers',
    q: { en: 'Maximum travel distance to a Class A extinguisher (all hazard levels):', ar: 'أقصى مسافة انتقال إلى طفاية الفئة A (لجميع مستويات الخطورة):' },
    options: [
      { en: '50 ft (15.2 m)', ar: '50 قدماً (15.2 م)' },
      { en: '75 ft (22.9 m)', ar: '75 قدماً (22.9 م)' },
      { en: '100 ft (30.5 m)', ar: '100 قدم (30.5 م)' },
      { en: '30 ft (9.1 m)', ar: '30 قدماً (9.1 م)' }
    ],
    answer: 1,
    explain: { en: 'NFPA 10 Table 6.2.1.1: 75 ft of actual walking path; 30/50 ft apply to Class B.', ar: 'جدول NFPA 10 رقم 6.2.1.1: ‏75 قدماً من مسار المشي الفعلي، أما 30/50 قدماً فللفئة B.' }
  },
  {
    id: 'q49', topic: 'fire-extinguishers',
    q: { en: 'For an ORDINARY hazard occupancy, the maximum floor area per unit of A is:', ar: 'في إشغال خطورة عادية، أقصى مساحة أرضية لكل وحدة A هي:' },
    options: [
      { en: '3000 ft² (279 m²)', ar: '3000 قدم² (279 م²)' },
      { en: '1000 ft² (93 m²)', ar: '1000 قدم² (93 م²)' },
      { en: '11,250 ft² (1045 m²)', ar: '11,250 قدم² (1045 م²)' },
      { en: '1500 ft² (139 m²)', ar: '1500 قدم² (139 م²)' }
    ],
    answer: 3,
    explain: { en: 'Light 3000, ordinary 1500, extra 1000 ft² per A; 11,250 ft² is the cap per extinguisher.', ar: 'الخفيفة 3000، والعادية 1500، والعالية 1000 قدم² لكل A؛ و11,250 قدم² هو الحد الأقصى لكل طفاية.' }
  },
  {
    id: 'q50', topic: 'fire-extinguishers',
    q: { en: 'A 450 ft × 150 ft light hazard building is re-planned with 2-A extinguishers (6000 ft² each). How many are required by area?', ar: 'مبنى خطورة خفيفة 450 × 150 قدماً يُعاد توزيعه بطفايات 2-A ‏(6000 قدم² لكل منها). كم طفاية مطلوبة وفق المساحة؟' },
    options: [
      { en: '6', ar: '6' },
      { en: '11', ar: '11' },
      { en: '12', ar: '12' },
      { en: '23', ar: '23' }
    ],
    answer: 2,
    explain: { en: '67,500 / 6000 = 11.25 → round up to 12; then check the 75 ft travel distance on the drawing.', ar: '67,500 ÷ 6000 = 11.25 ← تُقرَّب لأعلى إلى 12؛ ثم تحقّق من مسافة الانتقال 75 قدماً على المخطط.' }
  },
  {
    id: 'q51', topic: 'fire-extinguishers',
    q: { en: 'Why is an ABC dry chemical extinguisher pressurized with nitrogen rather than air?', ar: 'لماذا تُضغط طفاية المسحوق الكيميائي الجاف ABC بالنيتروجين لا بالهواء؟' },
    options: [
      { en: 'Nitrogen is cheaper than air', ar: 'النيتروجين أرخص من الهواء' },
      { en: 'Nitrogen extinguishes Class D fires', ar: 'النيتروجين يطفئ حرائق الفئة D' },
      { en: 'Nitrogen raises the discharge temperature', ar: 'النيتروجين يرفع حرارة التصريف' },
      { en: 'Nitrogen is dry and inert; moisture in air would cake the powder', ar: 'النيتروجين جاف وخامل؛ ورطوبة الهواء تُكتّل المسحوق' }
    ],
    answer: 3,
    explain: { en: 'The powder (mainly monoammonium phosphate) must stay free-flowing; dry nitrogen does not react with it.', ar: 'يجب أن يبقى المسحوق (أساسه فوسفات أحادي الأمونيوم) سهل الانسياب، والنيتروجين الجاف لا يتفاعل معه.' }
  },
  {
    id: 'q52', topic: 'fire-extinguishers',
    q: { en: 'When using an extinguisher (PASS), where should you position yourself?', ar: 'عند استخدام الطفاية (PASS)، أين يجب أن تقف؟' },
    options: [
      { en: 'On the far side of the fire from the door', ar: 'في الجهة المقابلة للباب خلف الحريق' },
      { en: 'Between the fire and your escape route', ar: 'بين الحريق ومسار هروبك' },
      { en: 'Directly above the fire', ar: 'فوق الحريق مباشرة' },
      { en: 'Anywhere, as long as the pin is still in', ar: 'في أي مكان ما دام المسمار في موضعه' }
    ],
    answer: 1,
    explain: { en: 'If the fire is not controlled you can back out and close the door. Pull the pin, aim at the base, squeeze, sweep, and watch for re-ignition.', ar: 'إن لم تتم السيطرة على الحريق يمكنك التراجع وإغلاق الباب. اسحب المسمار، ووجّه نحو القاعدة، واضغط، وحرّك يميناً ويساراً، وراقب إعادة الاشتعال.' }
  },
  {
    id: 'q53', topic: 'fire-extinguishers',
    q: { en: 'A 15 kg (33 lb) extinguisher is wall-mounted. The top of the unit may be at most:', ar: 'طفاية وزنها 15 كجم (33 رطلاً) مثبتة على الجدار. لا يجوز أن يزيد ارتفاع قمتها على:' },
    options: [
      { en: '2.0 m (6.6 ft) above the floor', ar: '2.0 م (6.6 قدم) فوق الأرض' },
      { en: '1.07 m (3.5 ft) above the floor', ar: '1.07 م (3.5 قدم) فوق الأرض' },
      { en: '0.10 m (4 in) above the floor', ar: '0.10 م (4 بوصات) فوق الأرض' },
      { en: '1.53 m (5 ft) above the floor', ar: '1.53 م (5 أقدام) فوق الأرض' }
    ],
    answer: 3,
    explain: { en: 'Units up to 40 lb (18 kg): top ≤ 5 ft; heavier units: top ≤ 3.5 ft; bottom always ≥ 4 in above the floor.', ar: 'الطفايات حتى 40 رطلاً (18 كجم): القمة ≤ 5 أقدام؛ والأثقل: القمة ≤ 3.5 قدم؛ والقاعدة دائماً ≥ 4 بوصات فوق الأرض.' }
  },
  {
    id: 'q54', topic: 'fire-extinguishers',
    q: { en: 'The correct extinguisher for a commercial deep-fat fryer (Class K) contains:', ar: 'الطفاية الصحيحة لمقلاة زيت عميقة تجارية (الفئة K) تحتوي على:' },
    options: [
      { en: 'Plain water under air pressure', ar: 'ماء عادي مضغوط بالهواء' },
      { en: 'CO₂ only', ar: 'ثاني أكسيد الكربون فقط' },
      { en: 'A wet chemical (potassium acetate/citrate solution)', ar: 'مادة كيميائية رطبة (محلول أسيتات/سترات البوتاسيوم)' },
      { en: 'Sand', ar: 'رمل' }
    ],
    answer: 2,
    explain: { en: 'Wet chemical saponifies the hot oil into a soapy foam that seals and cools it. (The course calls it a "potassium powder", but Class K units are wet chemical.)', ar: 'يحوّل الكيميائي الرطب الزيت الساخن إلى رغوة صابونية تعزله وتبرّده. (تسميه الدورة «مسحوق بوتاسيوم»، لكن طفايات الفئة K كيميائية رطبة.)' }
  },

  // ---------------- clean-agent
  {
    id: 'q55', topic: 'clean-agent',
    q: { en: 'FM-200, IP units: server room 35 × 28 × 13 ft, minimum 70 °F (S = 1.885 + 0.0046·T ft³/lb), design concentration 7%. Agent weight?', ar: 'FM-200 بالوحدات الإمبراطورية: غرفة خوادم 35 × 28 × 13 قدماً، وأدنى حرارة 70 °ف (S = 1.885 + 0.0046·T قدم³/رطل)، وتركيز تصميمي 7%. ما وزن الغاز؟' },
    options: [
      { en: '546 lb', ar: '546 رطلاً' },
      { en: '434 lb', ar: '434 رطلاً' },
      { en: '699 lb', ar: '699 رطلاً' },
      { en: '197 lb', ar: '197 رطلاً' }
    ],
    answer: 1,
    explain: { en: 'V = 12,740 ft³; S = 2.207; V/S = 5772.5; W = 5772.5 × 7/93 ≈ 434 lb (≈ 197 kg). 546 lb and 699 lb correspond to 8.64% and 10.8%.', ar: 'V = 12,740 قدم³؛ S = 2.207؛ V/S = 5772.5؛ W = 5772.5 × 7/93 ≈ 434 رطلاً (≈ 197 كجم). أما 546 و699 رطلاً فتقابلان 8.64% و10.8%.' }
  },
  {
    id: 'q56', topic: 'clean-agent',
    q: { en: 'Specific vapour volume of HFC-227ea at a minimum room temperature of 70 °F (S = 1.885 + 0.0046·T):', ar: 'الحجم النوعي لبخار HFC-227ea عند أدنى حرارة للغرفة 70 °ف (S = 1.885 + 0.0046·T):' },
    options: [
      { en: '0.1377 ft³/lb', ar: '0.1377 قدم³/رطل' },
      { en: '1.885 ft³/lb', ar: '1.885 قدم³/رطل' },
      { en: '2.529 ft³/lb', ar: '2.529 قدم³/رطل' },
      { en: '2.207 ft³/lb', ar: '2.207 قدم³/رطل' }
    ],
    answer: 3,
    explain: { en: '1.885 + 0.0046 × 70 = 1.885 + 0.322 = 2.207 ft³/lb. (0.1377 is the SI value in m³/kg at 21 °C.)', ar: '1.885 + 0.0046 × 70 = 1.885 + 0.322 = 2.207 قدم³/رطل. (أما 0.1377 فهي القيمة بالنظام الدولي م³/كجم عند 21 °م.)' }
  },
  {
    id: 'q57', topic: 'clean-agent',
    q: { en: 'A design software used 9% × 1.2 = 10.8% FM-200. Why is this unacceptable in a normally occupied server room?', ar: 'استخدم أحد برامج التصميم تركيز FM-200 ‏9% × 1.2 = 10.8%. لماذا لا يُقبل ذلك في غرفة خوادم مشغولة عادةً؟' },
    options: [
      { en: 'It is below the extinguishing concentration', ar: 'لأنه أقل من تركيز الإطفاء' },
      { en: 'It would take more than 10 s to discharge', ar: 'لأن تصريفه يستغرق أكثر من 10 ثوانٍ' },
      { en: 'It exceeds the LOAEL of 10.5% (NOAEL 9%)', ar: 'لأنه يتجاوز مستوى LOAEL البالغ 10.5% (وNOAEL ‏9%)' },
      { en: 'FM-200 cannot be used on Class C hazards', ar: 'لأن FM-200 لا يُستخدم لمخاطر الفئة C' }
    ],
    answer: 2,
    explain: { en: 'Occupied spaces are designed at or below the NOAEL (9%). The safety factor must multiply the extinguishing concentration, not an already-factored design value.', ar: 'تُصمَّم الأماكن المشغولة عند NOAEL ‏(9%) أو أقل. ويجب ضرب معامل الأمان في تركيز الإطفاء لا في قيمة تصميمية مضروبة مسبقاً.' }
  },
  {
    id: 'q58', topic: 'clean-agent',
    q: { en: 'A 40 ft × 30 ft clean-agent room uses nozzles listed for a maximum of 1024 ft² each. Minimum number of nozzles?', ar: 'غرفة غاز نظيف 40 × 30 قدماً تستخدم فوهات معتمدة لتغطية 1024 قدم² كحد أقصى لكل منها. ما أقل عدد من الفوهات؟' },
    options: [
      { en: '1', ar: '1' },
      { en: '2', ar: '2' },
      { en: '3', ar: '3' },
      { en: '4', ar: '4' }
    ],
    answer: 1,
    explain: { en: 'Area 1200 ft² / 1024 = 1.17 → round up to 2 nozzles (also respect listed height and wall distances).', ar: 'المساحة 1200 قدم² ÷ 1024 = 1.17 ← تُقرَّب لأعلى إلى فوهتين (مع مراعاة الارتفاع والأبعاد عن الجدران المعتمدة).' }
  },
  {
    id: 'q59', topic: 'clean-agent',
    q: { en: 'In the FM-200 sequence, what must happen before the actuator discharges the agent?', ar: 'في تسلسل FM-200، ما الذي يجب أن يحدث قبل أن يطلق المشغّل الغاز؟' },
    options: [
      { en: 'Ventilation (HVAC) is shut down and dampers close', ar: 'إيقاف التهوية (التكييف) وإغلاق المخمدات' },
      { en: 'The sprinkler system is drained', ar: 'تصريف نظام الرشاشات' },
      { en: 'The room door is opened to vent pressure', ar: 'فتح باب الغرفة لتنفيس الضغط' },
      { en: 'The jockey pump starts', ar: 'بدء تشغيل مضخة الجوكي' }
    ],
    answer: 0,
    explain: { en: 'The HVAC is interlocked with the extinguishing panel; running fans would blow the agent out and the design concentration would not be held.', ar: 'التكييف مرتبط بلوحة الإطفاء؛ فتشغيل المراوح يطرد الغاز ولا يُحتفظ بالتركيز التصميمي.' }
  },
  {
    id: 'q60', topic: 'clean-agent',
    q: { en: 'Under recent editions of NFPA 2001, the minimum design concentration for a Class C (energized electrical) hazard is:', ar: 'وفق الإصدارات الحديثة من NFPA 2001، التركيز التصميمي الأدنى لخطر الفئة C (المعدات الكهربائية المكهربة) هو:' },
    options: [
      { en: '1.2 × the Class B extinguishing concentration', ar: '1.2 × تركيز الإطفاء للفئة B' },
      { en: 'Exactly the extinguishing concentration (no safety factor)', ar: 'تركيز الإطفاء نفسه تماماً (دون معامل أمان)' },
      { en: '1.35 × the Class A extinguishing concentration', ar: '1.35 × تركيز الإطفاء للفئة A' },
      { en: '1.3 × the Class A design concentration', ar: '1.3 × التركيز التصميمي للفئة A' }
    ],
    answer: 2,
    explain: { en: 'Class A: 1.2 × extinguishing; Class B: 1.3 × extinguishing; Class C: at least 1.35 × the Class A extinguishing concentration.', ar: 'الفئة A: ‏1.2 × تركيز الإطفاء؛ والفئة B: ‏1.3 × تركيز الإطفاء؛ والفئة C: لا يقل عن 1.35 × تركيز الإطفاء للفئة A.' }
  },

  // ---------------- fire-pumps
  {
    id: 'q61', topic: 'fire-pumps',
    q: { en: 'What is the job of the jockey pump?', ar: 'ما وظيفة مضخة الجوكي؟' },
    options: [
      { en: 'Supply the full sprinkler demand during a fire', ar: 'توفير كامل طلب الرشاشات أثناء الحريق' },
      { en: 'Drive the diesel engine cooling water', ar: 'تدوير مياه تبريد محرك الديزل' },
      { en: 'Fill the fire tank from the municipal main', ar: 'ملء خزان الحريق من الشبكة العامة' },
      { en: 'Keep the network pressurized against small leaks so the main pump does not start unnecessarily', ar: 'المحافظة على ضغط الشبكة في مواجهة التسربات البسيطة كي لا تبدأ المضخة الرئيسية دون داعٍ' }
    ],
    answer: 3,
    explain: { en: 'The jockey makes up leakage and temperature-related pressure drops; it is not counted as fire-fighting capacity.', ar: 'تعوّض مضخة الجوكي التسرب وانخفاضات الضغط الناتجة عن الحرارة، ولا تُحتسب ضمن سعة مكافحة الحريق.' }
  },
  {
    id: 'q62', topic: 'fire-pumps',
    q: { en: 'A sprinkler opens during a mains power failure. Which pump should supply the system?', ar: 'يفتح رشاش أثناء انقطاع الكهرباء العامة. أي مضخة يجب أن تغذي النظام؟' },
    options: [
      { en: 'The diesel fire pump, starting automatically', ar: 'مضخة الحريق بالديزل، بالبدء التلقائي' },
      { en: 'The jockey pump', ar: 'مضخة الجوكي' },
      { en: 'The domestic booster pump', ar: 'مضخة تعزيز المياه المنزلية' },
      { en: 'No pump — only the FDC can be used', ar: 'لا مضخة — لا يمكن استخدام سوى وصلة الدفاع المدني' }
    ],
    answer: 0,
    explain: { en: 'The diesel pump is independent of mains power and starts on falling pressure (or on electric pump failure).', ar: 'مضخة الديزل مستقلة عن الكهرباء العامة وتبدأ عند انخفاض الضغط (أو عند تعطل المضخة الكهربائية).' }
  },
  {
    id: 'q63', topic: 'fire-pumps',
    q: { en: 'What is the purpose of the anti-vortex plate at the tank suction outlet?', ar: 'ما الغرض من لوح منع الدوامة عند فتحة السحب في الخزان؟' },
    options: [
      { en: 'To measure the pump flow', ar: 'قياس تدفق المضخة' },
      { en: 'To stop the tank overflowing', ar: 'منع فيضان الخزان' },
      { en: 'To prevent air being drawn into the suction, which causes cavitation and loss of flow', ar: 'منع سحب الهواء إلى خط السحب، الذي يسبب التكهف وفقد التدفق' },
      { en: 'To filter sand from the water', ar: 'ترشيح الرمل من المياه' }
    ],
    answer: 2,
    explain: { en: 'A vortex at low water level lets air into the pump; the plate breaks the vortex so more of the tank volume is usable.', ar: 'تسمح الدوامة عند انخفاض منسوب المياه بدخول الهواء إلى المضخة، ويكسر اللوح الدوامة فيصبح حجم أكبر من الخزان قابلاً للاستخدام.' }
  },
  {
    id: 'q64', topic: 'fire-pumps',
    q: { en: 'Which statement correctly distinguishes a relief valve from a pressure-reducing valve (PRV)?', ar: 'أي عبارة تميّز بشكل صحيح بين صمام التنفيس وصمام تخفيض الضغط؟' },
    options: [
      { en: 'Both are the same device with different names', ar: 'كلاهما الجهاز نفسه باسمين مختلفين' },
      { en: 'The relief valve dumps excess pressure to protect the system; the PRV lowers the outlet pressure to what the device needs', ar: 'يصرّف صمام التنفيس الضغط الزائد لحماية النظام، ويخفض صمام تخفيض الضغط ضغط المخرج إلى ما يحتاجه الجهاز' },
      { en: 'The PRV is installed only on the jockey pump', ar: 'يُركَّب صمام تخفيض الضغط على مضخة الجوكي فقط' },
      { en: 'The relief valve raises pressure at the top floors', ar: 'يرفع صمام التنفيس الضغط في الطوابق العليا' }
    ],
    answer: 1,
    explain: { en: 'Relief valves discharge to drain, tank or suction; PRVs keep sprinklers and 2½" outlets at or below 175 psi (12.1 bar) in tall buildings.', ar: 'تصرّف صمامات التنفيس إلى الصرف أو الخزان أو السحب، وتُبقي صمامات تخفيض الضغط الرشاشات ومخارج 2½ بوصة عند 175 رطل/بوصة² (12.1 بار) أو أقل في المباني العالية.' }
  },
  {
    id: 'q65', topic: 'fire-pumps',
    q: { en: 'Why are horizontal split-case pumps favoured for large fire pumps?', ar: 'لماذا تُفضَّل المضخات الأفقية منقسمة الغلاف لمضخات الحريق الكبيرة؟' },
    options: [
      { en: 'They need no base plate', ar: 'لا تحتاج إلى قاعدة' },
      { en: 'They are always close-coupled', ar: 'تكون دائماً متصلة مباشرة بالمحرك' },
      { en: 'They can only run on diesel', ar: 'لا تعمل إلا بالديزل' },
      { en: 'The split casing gives full access to the impeller and double suction reduces hydraulic imbalance', ar: 'يتيح الغلاف المنقسم الوصول الكامل إلى الدافع ويقلل السحب المزدوج عدم الاتزان الهيدروليكي' }
    ],
    answer: 3,
    explain: { en: 'Split-case pumps cover up to about 25,000 gpm and 500 ft head; end-suction pumps are smaller (≈ 4000 gpm, 150 ft in HVAC use).', ar: 'تغطي المضخات منقسمة الغلاف حتى نحو 25,000 جالون/دقيقة وضاغط 500 قدم، بينما مضخات السحب الطرفي أصغر (≈ 4000 جالون/دقيقة و150 قدماً في التكييف).' }
  },

  // ---------------- sprinklers
  {
    id: 'q66', topic: 'sprinklers',
    q: { en: 'A sprinkler glass bulb of 3 mm diameter normally indicates:', ar: 'تدل أمبولة الرشاش الزجاجية بقطر 3 مم عادةً على:' },
    options: [
      { en: 'Quick response (RTI ≤ 50 (m·s)^½)', ar: 'استجابة سريعة (RTI ≤ 50 (م·ث)^½)' },
      { en: 'Standard response (RTI ≥ 80 (m·s)^½)', ar: 'استجابة قياسية (RTI ≥ 80 (م·ث)^½)' },
      { en: 'High temperature rating', ar: 'تصنيف حرارة عالٍ' },
      { en: 'An open spray sprinkler', ar: 'رشاش رش مفتوح' }
    ],
    answer: 0,
    explain: { en: 'The thinner 3 mm bulb heats faster (quick response); the 5 mm bulb is standard response. The colour, not the size, shows the temperature.', ar: 'تسخن الأمبولة الأرفع 3 مم أسرع (استجابة سريعة)، والأمبولة 5 مم قياسية الاستجابة. واللون لا الحجم هو الذي يدل على الحرارة.' }
  },
  {
    id: 'q67', topic: 'sprinklers',
    q: { en: 'A boiler room ceiling can reach 66 °C in normal operation. Which temperature class is required?', ar: 'قد يبلغ سقف غرفة الغلايات 66 °م في التشغيل العادي. ما فئة الحرارة المطلوبة؟' },
    options: [
      { en: 'Ordinary, 57–77 °C', ar: 'عادية، 57–77 °م' },
      { en: 'High, 121–149 °C', ar: 'عالية، 121–149 °م' },
      { en: 'Intermediate, 79–107 °C', ar: 'متوسطة، 79–107 °م' },
      { en: 'Ultra high, 260–302 °C', ar: 'فائقة العلو، 260–302 °م' }
    ],
    answer: 2,
    explain: { en: 'NFPA 13: max ceiling 38 °C → ordinary; 66 °C → intermediate (yellow/green); 107 °C → high (blue).', ar: 'حسب NFPA 13: أقصى حرارة سقف 38 °م ← عادية؛ و66 °م ← متوسطة (صفراء/خضراء)؛ و107 °م ← عالية (زرقاء).' }
  },
  {
    id: 'q68', topic: 'sprinklers',
    q: { en: 'Standard sidewall sprinklers may NOT be used in which occupancy?', ar: 'في أي إشغال لا يجوز استخدام الرشاشات الجانبية القياسية؟' },
    options: [
      { en: 'Light hazard hotel rooms', ar: 'غرف الفنادق ذات الخطورة الخفيفة' },
      { en: 'Extra hazard', ar: 'الخطورة العالية' },
      { en: 'Ordinary hazard corridors', ar: 'ممرات الخطورة العادية' },
      { en: 'Light hazard offices', ar: 'مكاتب الخطورة الخفيفة' }
    ],
    answer: 1,
    explain: { en: 'Sidewalls throw a quarter-sphere pattern from the wall and are limited to light and ordinary hazard; uprights and pendents serve all hazards.', ar: 'تقذف الرشاشات الجانبية نمطاً على شكل ربع كرة من الجدار وتقتصر على الخطورة الخفيفة والعادية، بينما يخدم القائم والمتدلي جميع الخطورات.' }
  },
  {
    id: 'q69', topic: 'sprinklers',
    q: { en: 'The cover plate of a concealed pendent sprinkler must never be:', ar: 'لا يجوز أبداً في غطاء الرشاش المتدلي المخفي أن:' },
    options: [
      { en: 'Ordered in a factory colour', ar: 'يُطلب بلون من المصنع' },
      { en: 'Installed flush with the ceiling', ar: 'يُركَّب مستوياً مع السقف' },
      { en: 'Removed during a fire', ar: 'يسقط أثناء الحريق' },
      { en: 'Painted on site', ar: 'يُطلى في الموقع' }
    ],
    answer: 3,
    explain: { en: 'Paint can glue the plate or insulate its fusible solder (which releases about 11 °C / 20 °F below the sprinkler rating), delaying or preventing operation.', ar: 'قد يلصق الطلاء الغطاء أو يعزل لحامه القابل للانصهار (الذي يتحرر عند نحو 11 °م / 20 °ف دون تصنيف الرشاش)، فيؤخر التشغيل أو يمنعه.' }
  },
  {
    id: 'q70', topic: 'sprinklers',
    q: { en: 'Beam rule: a standard upright sprinkler is less than 1 ft (0.3 m) from the side of a beam. How far may its deflector be above the bottom of the beam?', ar: 'قاعدة الكمرات: رشاش قائم قياسي يبعد أقل من قدم واحد (0.3 م) عن جانب كمرة. كم يجوز أن يرتفع عاكسه فوق أسفل الكمرة؟' },
    options: [
      { en: '0 in — it must not be above the beam bottom', ar: '0 بوصة — لا يجوز أن يعلو أسفل الكمرة' },
      { en: '2½ in (64 mm)', ar: '2½ بوصة (64 مم)' },
      { en: '12 in (305 mm)', ar: '12 بوصة (305 مم)' },
      { en: '35 in (889 mm)', ar: '35 بوصة (889 مم)' }
    ],
    answer: 0,
    explain: { en: 'A < 1 ft → B = 0; 1 ft to < 1 ft 6 in → 2½ in; … 7 ft to < 7 ft 6 in → 35 in.', ar: 'A < 1 قدم ← B = 0؛ ومن 1 قدم إلى أقل من 1 قدم و6 بوصات ← 2½ بوصة؛ … ومن 7 أقدام إلى أقل من 7 أقدام و6 بوصات ← 35 بوصة.' }
  },
  {
    id: 'q71', topic: 'sprinklers',
    q: { en: 'Which sprinkler has NO heat-responsive element and is used on deluge systems?', ar: 'أي رشاش ليس له عنصر حساس للحرارة ويُستخدم في أنظمة الغمر؟' },
    options: [
      { en: 'Concealed pendent', ar: 'المتدلي المخفي' },
      { en: 'ESFR', ar: 'ESFR' },
      { en: 'Open spray sprinkler', ar: 'رشاش الرش المفتوح' },
      { en: 'Dry pendent', ar: 'المتدلي الجاف' }
    ],
    answer: 2,
    explain: { en: 'Open sprinklers are permanently open like nozzles; a separate detection system opens the deluge valve.', ar: 'الرشاشات المفتوحة مفتوحة دائماً كالفوهات، ويفتح نظام كشف مستقل صمام الغمر.' }
  },

  // ---------------- systems-overview
  {
    id: 'q72', topic: 'systems-overview',
    q: { en: 'In a pre-action system, a forklift knocks off a sprinkler but there is no fire. What happens?', ar: 'في نظام سابق التشغيل، تصدم رافعة شوكية رشاشاً فتكسره دون وجود حريق. ماذا يحدث؟' },
    options: [
      { en: 'Water discharges until the valve is closed', ar: 'تتدفق المياه حتى يُغلق الصمام' },
      { en: 'All sprinklers in the zone discharge', ar: 'تتدفق جميع رشاشات المنطقة' },
      { en: 'Only supervisory air escapes and a low-air (trouble/supervisory) alarm calls maintenance — no water', ar: 'يتسرب هواء الإشراف فقط ويصدر إنذار انخفاض الهواء (إشرافي) لاستدعاء الصيانة — دون مياه' },
      { en: 'The diesel pump starts', ar: 'تبدأ مضخة الديزل' }
    ],
    answer: 2,
    explain: { en: 'The pre-action valve only opens on detection; that is why pre-action suits areas where accidental damage or water damage is a concern.', ar: 'لا يُفتح صمام النظام سابق التشغيل إلا بالكشف، ولهذا يناسب المناطق المعرضة للكسر العرضي أو التي يُخشى فيها ضرر المياه.' }
  },
  {
    id: 'q73', topic: 'systems-overview',
    q: { en: 'NFPA 13 does not permit a gridded piping arrangement for which system?', ar: 'لا يسمح NFPA 13 بترتيب الأنابيب الشبكي في أي نظام؟' },
    options: [
      { en: 'Wet pipe', ar: 'الأنابيب الرطبة' },
      { en: 'Dry pipe', ar: 'الأنابيب الجافة' },
      { en: 'Any system in a light hazard office', ar: 'أي نظام في مكتب خطورة خفيفة' },
      { en: 'Antifreeze systems in heated areas', ar: 'أنظمة مانع التجمد في المناطق المدفأة' }
    ],
    answer: 1,
    explain: { en: 'Air trapped in a grid delays water delivery in a dry system; loops and grids are used for wet systems.', ar: 'يؤخر الهواء المحتبس في الشبكة وصول المياه في النظام الجاف، وتُستخدم الحلقات والشبكات للأنظمة الرطبة.' }
  },
  {
    id: 'q74', topic: 'systems-overview',
    q: { en: 'What distinguishes a deluge system from wet, dry and pre-action systems?', ar: 'ما الذي يميز نظام الغمر عن الأنظمة الرطبة والجافة وسابقة التشغيل؟' },
    options: [
      { en: 'It uses glass-bulb sprinklers rated 141 °C', ar: 'يستخدم رشاشات بأمبولة 141 °م' },
      { en: 'Its pipes are filled with nitrogen', ar: 'أنابيبه مملوءة بالنيتروجين' },
      { en: 'It needs no water supply', ar: 'لا يحتاج إلى مصدر مياه' },
      { en: 'All its open sprinklers discharge at once when detection opens the valve', ar: 'تتدفق جميع رشاشاته المفتوحة معاً عندما يفتح الكشف الصمام' }
    ],
    answer: 3,
    explain: { en: 'Used where fire spreads very fast: oil transformers, flammable liquid and fireworks stores, aircraft hangars.', ar: 'يُستخدم حيث ينتشر الحريق بسرعة كبيرة: المحولات الزيتية ومخازن السوائل القابلة للاشتعال والألعاب النارية وحظائر الطائرات.' }
  },
  {
    id: 'q75', topic: 'systems-overview',
    q: { en: 'Maximum time for water to reach the inspector\'s test outlet of a dry-pipe system in an ORDINARY hazard occupancy:', ar: 'أقصى زمن لوصول المياه إلى مخرج اختبار المفتش في نظام أنابيب جافة لإشغال خطورة عادية:' },
    options: [
      { en: '40 s', ar: '40 ثانية' },
      { en: '45 s', ar: '45 ثانية' },
      { en: '60 s', ar: '60 ثانية' },
      { en: '50 s', ar: '50 ثانية' }
    ],
    answer: 3,
    explain: { en: 'NFPA 13: light 60 s, ordinary 50 s, extra 45 s, high-piled storage 40 s. (The course quotes 60 s as a general figure.)', ar: 'حسب NFPA 13: الخفيفة 60 ثانية، والعادية 50، والعالية 45، والتخزين المرتفع 40. (تذكر الدورة 60 ثانية كرقم عام.)' }
  },
  {
    id: 'q76', topic: 'systems-overview',
    q: { en: 'After a fire, what is done with the sprinklers that operated?', ar: 'بعد الحريق، ماذا يُفعل بالرشاشات التي عملت؟' },
    options: [
      { en: 'Replaced with new sprinklers of the same type and rating', ar: 'تُستبدل برشاشات جديدة من النوع والتصنيف نفسيهما' },
      { en: 'Fitted with a new glass bulb', ar: 'تُركَّب لها أمبولة زجاجية جديدة' },
      { en: 'Cleaned and reinstalled', ar: 'تُنظَّف ويُعاد تركيبها' },
      { en: 'Left in place with a plug', ar: 'تُترك في مكانها مع سدادة' }
    ],
    answer: 0,
    explain: { en: 'Operated sprinklers are never repaired or reused; a spare-sprinkler cabinet with a wrench is kept on site.', ar: 'الرشاشات التي عملت لا تُصلح ولا يُعاد استخدامها أبداً، وتُحفظ في الموقع خزانة رشاشات احتياطية مع مفتاح الربط.' }
  },
  {
    id: 'q77', topic: 'systems-overview',
    q: { en: 'Minimum main drain size for a 4" (100 mm) sprinkler riser:', ar: 'أدنى قطر للصرف الرئيسي لرايزر رشاشات قطره 4 بوصات (100 مم):' },
    options: [
      { en: '¾" (20 mm)', ar: '¾ بوصة (20 مم)' },
      { en: '1¼" (32 mm)', ar: '1¼ بوصة (32 مم)' },
      { en: '2" (50 mm)', ar: '2 بوصة (50 مم)' },
      { en: '1" (25 mm)', ar: '1 بوصة (25 مم)' }
    ],
    answer: 2,
    explain: { en: 'Riser up to 2" → ¾"; 2½"–3½" → 1¼"; 4" and larger → 2".', ar: 'الرايزر حتى 2 بوصة ← ¾ بوصة؛ و2½–3½ بوصة ← 1¼ بوصة؛ و4 بوصات فأكبر ← 2 بوصة.' }
  },

  // ---------------- hazard-classification
  {
    id: 'q78', topic: 'hazard-classification',
    q: { en: 'Ordinary Hazard Group 1 allows stockpiles of combustibles up to:', ar: 'تسمح الخطورة العادية المجموعة 1 بأكوام تخزين للمواد القابلة للاحتراق حتى:' },
    options: [
      { en: '8 ft (2.4 m)', ar: '8 أقدام (2.4 م)' },
      { en: '12 ft (3.7 m)', ar: '12 قدماً (3.7 م)' },
      { en: '5 ft (1.5 m)', ar: '5 أقدام (1.5 م)' },
      { en: '15 ft (4.6 m)', ar: '15 قدماً (4.6 م)' }
    ],
    answer: 0,
    explain: { en: 'OH1: combustibility low, quantity moderate, stockpiles ≤ 8 ft; OH2: moderate-to-high, stockpiles ≤ 12 ft.', ar: 'المجموعة 1: قابلية احتراق منخفضة وكمية متوسطة وأكوام ≤ 8 أقدام؛ والمجموعة 2: متوسطة إلى عالية وأكوام ≤ 12 قدماً.' }
  },
  {
    id: 'q79', topic: 'hazard-classification',
    q: { en: 'How are the seating area and the service kitchen of a restaurant classified under NFPA 13?', ar: 'كيف تُصنَّف صالة الجلوس ومطبخ الخدمة في مطعم وفق NFPA 13؟' },
    options: [
      { en: 'Both Light Hazard', ar: 'كلاهما خطورة خفيفة' },
      { en: 'Seating Light Hazard; service kitchen Ordinary Hazard Group 1', ar: 'الصالة خطورة خفيفة؛ ومطبخ الخدمة خطورة عادية مجموعة 1' },
      { en: 'Both Extra Hazard Group 1', ar: 'كلاهما خطورة عالية مجموعة 1' },
      { en: 'Seating Ordinary Group 2; kitchen Light Hazard', ar: 'الصالة عادية مجموعة 2؛ والمطبخ خطورة خفيفة' }
    ],
    answer: 1,
    explain: { en: 'Hazard is assigned space by space; when in doubt choose the next higher class.', ar: 'تُحدَّد الخطورة لكل فراغ على حدة، وعند الشك تُختار الفئة الأعلى التالية.' }
  },

  // ---------------- pipe-schedule
  {
    id: 'q80', topic: 'pipe-schedule',
    q: { en: 'Sprinklers are 4.5 m apart along a branch line. The maximum distance from the end sprinkler to the wall along that line is:', ar: 'التباعد بين الرشاشات 4.5 م على الخط الفرعي. ما أقصى بعد من الرشاش الطرفي إلى الجدار على ذلك الخط؟' },
    options: [
      { en: '4.5 m', ar: '4.5 م' },
      { en: '1.5 m', ar: '1.5 م' },
      { en: '2.25 m', ar: '2.25 م' },
      { en: '2.0 m', ar: '2.0 م' }
    ],
    answer: 2,
    explain: { en: 'Distance to wall ≤ S/2 = 4.5 / 2 = 2.25 m (and L/2 in the other direction).', ar: 'البعد عن الجدار ≤ S/2 = 4.5 ÷ 2 = 2.25 م (وL/2 في الاتجاه الآخر).' }
  },
  {
    id: 'q81', topic: 'pipe-schedule',
    q: { en: 'Light hazard pipe schedule with sprinklers ABOVE and BELOW a ceiling: a 2" pipe may supply up to:', ar: 'جدول الأنابيب للخطورة الخفيفة مع رشاشات أعلى السقف وأسفله: يمكن لأنبوب 2 بوصة تغذية حتى:' },
    options: [
      { en: '10 sprinklers', ar: '10 رشاشات' },
      { en: '7 sprinklers', ar: '7 رشاشات' },
      { en: '30 sprinklers', ar: '30 رشاشاً' },
      { en: '15 sprinklers', ar: '15 رشاشاً' }
    ],
    answer: 3,
    explain: { en: 'Above/below table: 1"=2, 1¼"=4, 1½"=7, 2"=15, 2½"=50. The below-ceiling-only table allows 10 on 2".', ar: 'جدول أعلى/أسفل السقف: 1=2، و1¼=4، و1½=7، و2=15، و2½=50. أما جدول أسفل السقف فقط فيسمح بعشرة على 2 بوصة.' }
  },
  {
    id: 'q82', topic: 'pipe-schedule',
    q: { en: 'A NEW pipe schedule sprinkler system is normally permitted only up to:', ar: 'يُسمح عادةً بنظام رشاشات جديد بطريقة جدول الأنابيب حتى مساحة:' },
    options: [
      { en: '52,000 ft² (4831 m²)', ar: '52,000 قدم² (4831 م²)' },
      { en: '5000 ft² (465 m²)', ar: '5000 قدم² (465 م²)' },
      { en: '1500 ft² (139 m²)', ar: '1500 قدم² (139 م²)' },
      { en: '11,250 ft² (1045 m²)', ar: '11,250 قدم² (1045 م²)' }
    ],
    answer: 1,
    explain: { en: 'Larger new systems must be hydraulically calculated unless 50 psi residual is available at the highest sprinkler at the tabulated flow; extra hazard is not permitted.', ar: 'يجب حساب الأنظمة الجديدة الأكبر هيدروليكياً ما لم يتوفر ضغط متبقٍّ 50 رطل/بوصة² عند أعلى رشاش بالتدفق المجدول، ولا يُسمح بها للخطورة العالية.' }
  },

  // ---------------- hydraulic-calcs
  {
    id: 'q83', topic: 'hydraulic-calcs',
    q: { en: 'Light hazard, density 0.10 gpm/ft², 155 ft² per sprinkler, K = 5.3. Pressure required at the most remote sprinkler?', ar: 'خطورة خفيفة، كثافة 0.10 جالون/دقيقة/قدم²، و155 قدم² لكل رشاش، وK = 5.3. ما الضغط المطلوب عند الرشاش الأبعد؟' },
    options: [
      { en: '8.56 psi', ar: '8.56 رطل/بوصة²' },
      { en: '15.5 psi', ar: '15.5 رطل/بوصة²' },
      { en: '2.92 psi', ar: '2.92 رطل/بوصة²' },
      { en: '7.0 psi', ar: '7.0 رطل/بوصة²' }
    ],
    answer: 0,
    explain: { en: 'q = 0.10 × 155 = 15.5 gpm; P = (15.5/5.3)² = 2.925² ≈ 8.56 psi (≈ 0.59 bar), above the 7 psi minimum.', ar: 'q = 0.10 × 155 = 15.5 جالون/دقيقة؛ P = (15.5/5.3)² = 2.925² ≈ 8.56 رطل/بوصة² (≈ 0.59 بار)، وهو أعلى من الحد الأدنى 7.' }
  },
  {
    id: 'q84', topic: 'hydraulic-calcs',
    q: { en: 'A branch line is 3 ft above the cross main. The elevation pressure difference is:', ar: 'خط فرعي أعلى من الخط الرئيسي العرضي بثلاثة أقدام. فرق الضغط الناتج عن الارتفاع هو:' },
    options: [
      { en: '6.93 psi', ar: '6.93 رطل/بوصة²' },
      { en: '0.43 psi', ar: '0.43 رطل/بوصة²' },
      { en: '1.30 psi', ar: '1.30 رطل/بوصة²' },
      { en: '3.0 psi', ar: '3.0 رطل/بوصة²' }
    ],
    answer: 2,
    explain: { en: '3 ft × 0.433 psi/ft = 1.30 psi (1 psi = 2.31 ft). Multiplying 3 × 2.31 = 6.93 is a common error.', ar: '3 أقدام × 0.433 رطل/بوصة²/قدم = 1.30 رطل/بوصة² (1 رطل/بوصة² = 2.31 قدم). أما ضرب 3 × 2.31 = 6.93 فهو خطأ شائع.' }
  },
  {
    id: 'q85', topic: 'hydraulic-calcs',
    q: { en: 'A branch calculated at 66.4 gpm and 7.94 psi joins a node where the governing pressure is 9.04 psi. Its adjusted flow is:', ar: 'خط فرعي محسوب عند 66.4 جالون/دقيقة و7.94 رطل/بوصة² يلتقي بعقدة ضغطها الحاكم 9.04 رطل/بوصة². ما تدفقه المعدَّل؟' },
    options: [
      { en: '66.4 gpm', ar: '66.4 جالون/دقيقة' },
      { en: '75.6 gpm', ar: '75.6 جالون/دقيقة' },
      { en: '58.3 gpm', ar: '58.3 جالون/دقيقة' },
      { en: '70.9 gpm', ar: '70.9 جالون/دقيقة' }
    ],
    answer: 3,
    explain: { en: 'Q_adj = 66.4 × √(9.04/7.94) = 66.4 × 1.067 ≈ 70.9 gpm.', ar: 'Q_adj = 66.4 × √(9.04/7.94) = 66.4 × 1.067 ≈ 70.9 جالون/دقيقة.' }
  },

  // ---------------- standpipes
  {
    id: 'q86', topic: 'standpipes',
    q: { en: 'How is a dry riser charged with water?', ar: 'كيف يُملأ الرايزر الجاف بالمياه؟' },
    options: [
      { en: 'By the fire brigade pumping into the breaching inlet at street level', ar: 'بضخ الدفاع المدني في مدخل التغذية عند مستوى الشارع' },
      { en: 'By the jockey pump every morning', ar: 'بمضخة الجوكي كل صباح' },
      { en: 'By opening the roof tank valve', ar: 'بفتح صمام خزان السطح' },
      { en: 'It is always full of water', ar: 'يكون مملوءاً بالمياه دائماً' }
    ],
    answer: 0,
    explain: { en: 'A dry riser is empty until the brigade connects to the 2-way/4-way breaching inlet; a wet riser is permanently charged by the building pumps.', ar: 'يبقى الرايزر الجاف فارغاً حتى يوصل الدفاع المدني بمدخل التغذية الثنائي/الرباعي، أما الرايزر الرطب فمملوء دائماً بمضخات المبنى.' }
  },
  {
    id: 'q87', topic: 'standpipes',
    q: { en: 'What kind of hose is stored on a hose RACK?', ar: 'ما نوع الخرطوم المحفوظ على حامل الخرطوم؟' },
    options: [
      { en: 'Non-collapsible rubber hose on a drum', ar: 'خرطوم مطاطي غير قابل للطي على أسطوانة' },
      { en: 'Copper tubing', ar: 'أنبوب نحاسي' },
      { en: 'Semi-rigid 19 mm hose only', ar: 'خرطوم شبه صلب 19 مم فقط' },
      { en: 'Collapsible (canvas/lined) hose folded zig-zag so it pulls out quickly', ar: 'خرطوم قابل للطي (قماشي/مبطّن) مطوي بشكل متعرج ليُسحب بسرعة' }
    ],
    answer: 3,
    explain: { en: 'Rubber hose cannot be folded, so it is wound on a hose reel; racks use collapsible hose.', ar: 'لا يمكن طي الخرطوم المطاطي فيُلف على بكرة، أما الحوامل فتستخدم الخرطوم القابل للطي.' }
  },
  {
    id: 'q88', topic: 'standpipes',
    q: { en: 'Class I standpipe: top outlet 20 m above the pump, residual 100 psi required, friction losses 2.8 psi. Required pump pressure ≈', ar: 'أنبوب قائم من الفئة I: أعلى مخرج على ارتفاع 20 م فوق المضخة، والضغط المتبقي المطلوب 100 رطل/بوصة²، وفواقد الاحتكاك 2.8 رطل/بوصة². ضغط المضخة المطلوب ≈' },
    options: [
      { en: '100 psi', ar: '100 رطل/بوصة²' },
      { en: '131 psi', ar: '131 رطل/بوصة²' },
      { en: '160 psi', ar: '160 رطل/بوصة²' },
      { en: '103 psi', ar: '103 رطل/بوصة²' }
    ],
    answer: 1,
    explain: { en: 'Static 20 m × 3.281 × 0.433 = 28.4 psi; 28.4 + 100 + 2.8 ≈ 131 psi (≈ 9.0 bar).', ar: 'الساكن 20 م × 3.281 × 0.433 = 28.4 رطل/بوصة²؛ 28.4 + 100 + 2.8 ≈ 131 رطل/بوصة² (≈ 9.0 بار).' }
  },
  {
    id: 'q89', topic: 'standpipes',
    q: { en: 'Each Class I standpipe is hydraulically calculated with:', ar: 'يُحسب كل أنبوب قائم من الفئة I هيدروليكياً بتدفق:' },
    options: [
      { en: '100 gpm at the top outlet', ar: '100 جالون/دقيقة عند المخرج العلوي' },
      { en: '500 gpm at every outlet', ar: '500 جالون/دقيقة عند كل مخرج' },
      { en: '250 gpm at each of the two hydraulically most remote hose connections', ar: '250 جالون/دقيقة عند كل من أبعد وصلتي خرطوم هيدروليكياً' },
      { en: '1250 gpm at the base', ar: '1250 جالون/دقيقة عند القاعدة' }
    ],
    answer: 2,
    explain: { en: 'That gives 500 gpm for the most remote standpipe; each additional standpipe adds 250 gpm up to the cap (1000 gpm sprinklered, 1250 gpm non-sprinklered).', ar: 'وهذا يعطي 500 جالون/دقيقة للأنبوب القائم الأبعد، ويضيف كل أنبوب إضافي 250 جالون/دقيقة حتى الحد الأقصى (1000 للمرشوش و1250 لغير المرشوش).' }
  },

  // ---------------- design-workflow
  {
    id: 'q90', topic: 'design-workflow',
    q: { en: 'Which IBC chapters tell the designer which fire protection systems a building requires?', ar: 'أي فصول كود البناء الدولي IBC تحدد للمصمم أنظمة الحماية من الحريق التي يحتاجها المبنى؟' },
    options: [
      { en: 'Chapters 10 and 11', ar: 'الفصلان 10 و11' },
      { en: 'Chapters 16 and 17', ar: 'الفصلان 16 و17' },
      { en: 'Chapter 29 only', ar: 'الفصل 29 فقط' },
      { en: 'Chapter 3 (occupancy) and Chapter 9 (fire protection systems)', ar: 'الفصل 3 (الإشغال) والفصل 9 (أنظمة الحماية من الحريق)' }
    ],
    answer: 3,
    explain: { en: 'Chapter 3 classifies the use/occupancy; Chapter 9 then states where sprinklers, standpipes, alarms, etc. are required. NFPA 13/14/20 govern how they are designed.', ar: 'يصنّف الفصل 3 الاستخدام/الإشغال، ثم يحدد الفصل 9 أين تلزم الرشاشات والأنابيب القائمة والإنذار وغيرها، بينما تحكم NFPA 13 و14 و20 كيفية تصميمها.' }
  },
  {
    id: 'q91', topic: 'design-workflow',
    q: { en: 'What is the role of UL and FM Approvals in fire protection?', ar: 'ما دور UL وFM في الحماية من الحريق؟' },
    options: [
      { en: 'They test and list/approve equipment such as pumps, valves and sprinklers', ar: 'تختبران المعدات مثل المضخات والصمامات والرشاشات وتدرجانها/تعتمدانها' },
      { en: 'They are the local civil defence authority', ar: 'هما جهة الدفاع المدني المحلية' },
      { en: 'They write the IBC', ar: 'تكتبان كود البناء الدولي IBC' },
      { en: 'They design sprinkler systems for owners', ar: 'تصممان أنظمة الرشاشات للملاك' }
    ],
    answer: 0,
    explain: { en: 'UL and FM (US) — like LPCB (UK) and VdS (Germany) — list equipment; the AHJ approves the design. Check marks and certificates, since counterfeits exist.', ar: 'تدرج UL وFM ‏(الأمريكيتان) — مثل LPCB ‏(بريطانيا) وVdS ‏(ألمانيا) — المعدات، بينما تعتمد الجهة المختصة التصميم. تحقّق من العلامات والشهادات لوجود منتجات مزوّرة.' }
  },
  {
    id: 'q92', topic: 'design-workflow',
    q: { en: 'Why are OS&Y gate valves used on fire lines?', ar: 'لماذا تُستخدم صمامات البوابة OS&Y في خطوط الحريق؟' },
    options: [
      { en: 'They throttle flow more precisely', ar: 'لأنها تنظّم التدفق بدقة أكبر' },
      { en: 'They are cheaper than ball valves', ar: 'لأنها أرخص من الصمامات الكروية' },
      { en: 'The rising stem shows at a glance whether the valve is open or closed', ar: 'لأن العمود الصاعد يبيّن بنظرة واحدة إن كان الصمام مفتوحاً أو مغلقاً' },
      { en: 'They prevent reverse flow', ar: 'لأنها تمنع التدفق العكسي' }
    ],
    answer: 2,
    explain: { en: 'Stem out = open, stem in = closed; a tamper switch also reports closure to the fire alarm panel.', ar: 'العمود خارج = مفتوح، والعمود داخل = مغلق؛ ويبلغ مفتاح العبث لوحة الإنذار أيضاً بالإغلاق.' }
  },
  {
    id: 'q93', topic: 'design-workflow',
    q: { en: 'In NFPA wording, "shall" means:', ar: 'في صياغة NFPA، تعني كلمة «shall»:' },
    options: [
      { en: 'A recommendation that may be ignored', ar: 'توصية يمكن تجاهلها' },
      { en: 'A mandatory requirement', ar: 'متطلباً إلزامياً' },
      { en: 'An explanatory note in the annex', ar: 'ملاحظة تفسيرية في الملحق' },
      { en: 'Something the manufacturer decides', ar: 'أمراً يقرره المصنع' }
    ],
    answer: 1,
    explain: { en: '"Shall" is mandatory; "should" is advisory; the AHJ may approve alternatives.', ar: '«shall» إلزامية و«should» استرشادية، ويمكن للجهة المختصة اعتماد بدائل.' }
  },
  {
    id: 'q94', topic: 'design-workflow',
    q: { en: 'Stairwell pressurization: total leakage area per floor 0.78 ft², ΔP = 0.35 in w.g. Using Q = 2610·A·√ΔP, the leakage flow per floor is about:', ar: 'ضغط السلالم: مساحة التسرب الكلية لكل طابق 0.78 قدم²، وΔP = 0.35 بوصة ماء. باستخدام Q = 2610·A·√ΔP، يكون تدفق التسرب لكل طابق نحو:' },
    options: [
      { en: '1200 cfm', ar: '1200 قدم³/دقيقة' },
      { en: '2610 cfm', ar: '2610 قدم³/دقيقة' },
      { en: '713 cfm', ar: '713 قدم³/دقيقة' },
      { en: '3440 cfm', ar: '3440 قدم³/دقيقة' }
    ],
    answer: 0,
    explain: { en: '2610 × 0.78 × √0.35 = 2035.8 × 0.592 ≈ 1204 cfm; add the flow through open doors (Q = A·V).', ar: '2610 × 0.78 × √0.35 = 2035.8 × 0.592 ≈ 1204 قدم³/دقيقة، ويُضاف التدفق عبر الأبواب المفتوحة (Q = A·V).' }
  },

  // ---------------- hse-emergency
  {
    id: 'q95', topic: 'hse-emergency',
    q: { en: 'What is the FIRST step of the emergency response procedure taught in the HSE course?', ar: 'ما الخطوة الأولى في إجراءات الاستجابة للطوارئ التي تعلّمها دورة الصحة والسلامة والبيئة؟' },
    options: [
      { en: 'Provide first aid', ar: 'تقديم الإسعافات الأولية' },
      { en: 'Assess the situation and identify the risks', ar: 'تقييم الموقف وتحديد المخاطر' },
      { en: 'Reset the fire alarm panel', ar: 'إعادة ضبط لوحة إنذار الحريق' },
      { en: 'Coordinate with the police', ar: 'التنسيق مع الشرطة' }
    ],
    answer: 1,
    explain: { en: 'Assess → activate protocols → coordinate with authorities → manage evacuation and account for everyone → first aid.', ar: 'التقييم ← تفعيل البروتوكولات ← التنسيق مع الجهات المختصة ← إدارة الإخلاء والتحقق من الجميع ← الإسعافات الأولية.' }
  },
  {
    id: 'q96', topic: 'hse-emergency',
    q: { en: 'During an evacuation, what must be done at the assembly point?', ar: 'أثناء الإخلاء، ما الذي يجب فعله عند نقطة التجمع؟' },
    options: [
      { en: 'Let people return for belongings once the alarm stops', ar: 'السماح للأشخاص بالعودة لأغراضهم بعد توقف الإنذار' },
      { en: 'Start the diesel pump', ar: 'تشغيل مضخة الديزل' },
      { en: 'Silence the alarm', ar: 'إسكات الإنذار' },
      { en: 'Account for all individuals and report anyone missing to the fire brigade', ar: 'التحقق من وجود جميع الأشخاص وإبلاغ الدفاع المدني بأي مفقود' }
    ],
    answer: 3,
    explain: { en: 'Head counts tell responders whether a search is needed; nobody re-enters until the fire brigade allows it.', ar: 'يُعلم العدّ فرق الاستجابة إن كانت هناك حاجة للبحث، ولا يعود أحد إلى الداخل حتى يسمح الدفاع المدني بذلك.' }
  },
  {
    id: 'q97', topic: 'hse-emergency',
    q: { en: 'Which is an example of REDUNDANCY in a fire operation system?', ar: 'أيٌّ مما يلي مثال على التكرار الاحتياطي في نظام تشغيل الحريق؟' },
    options: [
      { en: 'Painting pipes red', ar: 'طلاء الأنابيب باللون الأحمر' },
      { en: 'A single smoke detector per floor', ar: 'كاشف دخان واحد لكل طابق' },
      { en: 'Standby batteries on the alarm panel and a diesel fire pump', ar: 'بطاريات احتياطية للوحة الإنذار ومضخة حريق بالديزل' },
      { en: 'Locking the pump room', ar: 'قفل غرفة المضخات' }
    ],
    answer: 2,
    explain: { en: 'Backup power and alternative communication paths keep the detect–alert–suppress–monitor functions working when the normal supply fails.', ar: 'تُبقي الطاقة الاحتياطية ومسارات الاتصال البديلة وظائف الكشف والتنبيه والإخماد والمراقبة عاملة عند تعطل التغذية العادية.' }
  },
  {
    id: 'q98', topic: 'hse-emergency',
    q: { en: 'When may the fire alarm panel be reset after an alarm?', ar: 'متى يجوز إعادة ضبط لوحة إنذار الحريق بعد إنذار؟' },
    options: [
      { en: 'Only after the cause has been found and cleared, and the event is logged', ar: 'فقط بعد معرفة السبب وإزالته وتسجيل الحدث' },
      { en: 'Immediately, to stop the noise', ar: 'فوراً لإيقاف الضجيج' },
      { en: 'After 30 seconds, automatically', ar: 'بعد 30 ثانية تلقائياً' },
      { en: 'Whenever the building manager requests it', ar: 'متى طلب مدير المبنى ذلك' }
    ],
    answer: 0,
    explain: { en: 'Acknowledge and silence the panel buzzer, investigate, act, and reset only when safe; resetting early can hide a real fire.', ar: 'أقرّ بالإنذار وأسكت صفارة اللوحة، وتحقّق، وتصرّف، ولا تُعِد الضبط إلا عند الأمان؛ فإعادة الضبط المبكرة قد تخفي حريقاً حقيقياً.' }
  },
  {
    id: 'q99', topic: 'hse-emergency',
    q: { en: 'In the hose drill, how do you confirm an instantaneous coupling is properly connected?', ar: 'في تمرين الخرطوم، كيف تتأكد من أن الوصلة الفورية موصولة بشكل صحيح؟' },
    options: [
      { en: 'Tape it with duct tape', ar: 'لفّها بشريط لاصق' },
      { en: 'Open the valve fully and watch for leaks', ar: 'افتح الصمام بالكامل وراقب التسرب' },
      { en: 'Turn it clockwise three times', ar: 'أدرها باتجاه عقارب الساعة ثلاث مرات' },
      { en: 'Push the male into the female until it locks, then pull back to prove it is latched', ar: 'ادفع الوصلة الذكر داخل الأنثى حتى تُقفل، ثم اسحبها للخلف للتأكد من إحكامها' }
    ],
    answer: 3,
    explain: { en: 'A tug test proves the lugs have engaged before the landing valve is opened slowly with two people on the nozzle.', ar: 'يثبت اختبار السحب تعشيق المشابك قبل فتح صمام الطابق ببطء مع وجود شخصين على الفوهة.' }
  },

  // ---------------- fire-basics
  {
    id: 'q100', topic: 'fire-basics',
    q: { en: 'Why is a water jet dangerous on a burning oil or petroleum fire?', ar: 'لماذا تكون نفثة الماء خطرة على حريق زيت أو بترول مشتعل؟' },
    options: [
      { en: 'Water raises the oxygen content of the air', ar: 'لأن الماء يرفع محتوى الأكسجين في الهواء' },
      { en: 'Water is heavier than oil only when frozen', ar: 'لأن الماء أثقل من الزيت فقط عند تجمده' },
      { en: 'Oil floats on water, so the water sinks below the burning liquid and can splash and spread it', ar: 'لأن الزيت يطفو على الماء، فيغوص الماء تحت السائل المشتعل وقد يتسبب في تطايره وانتشاره' },
      { en: 'Water conducts heat into the tank walls', ar: 'لأن الماء ينقل الحرارة إلى جدران الخزان' }
    ],
    answer: 2,
    explain: { en: 'Foam, lighter than the fuel, floats and smothers it. On a hot cooking-oil pan, water flashes to steam and throws out a fireball.', ar: 'أما الرغوة فهي أخف من الوقود فتطفو وتخنقه. وعلى مقلاة زيت طبخ ساخنة يتحول الماء فوراً إلى بخار ويقذف كرة لهب.' }
  },
  {
    id: 'q101', topic: 'fire-basics',
    q: { en: 'A cable fire continues after the electrical supply has been isolated. The burning PVC insulation is now classed as:', ar: 'يستمر حريق كابل بعد فصل التغذية الكهربائية. يُصنَّف عزل PVC المشتعل الآن ضمن الفئة:' },
    options: [
      { en: 'Class C', ar: 'C' },
      { en: 'Class A', ar: 'A' },
      { en: 'Class D', ar: 'D' },
      { en: 'Class K', ar: 'K' }
    ],
    answer: 1,
    explain: { en: 'Class C applies only while energized; afterwards classify by material (plastics → A, transformer oil → B).', ar: 'لا تنطبق الفئة C إلا أثناء التكهرب، وبعدها يُصنَّف حسب المادة (البلاستيك ← A، وزيت المحوّل ← B).' }
  },
  {
    id: 'q102', topic: 'fire-basics',
    q: { en: 'The specific heat of water, one reason it is the classic extinguishing agent, is about:', ar: 'الحرارة النوعية للماء، وهي أحد أسباب كونه وسيلة الإطفاء التقليدية، تبلغ نحو:' },
    options: [
      { en: '4.2 kJ/kg·K', ar: '4.2 كيلوجول/كجم·كلفن' },
      { en: '0.9 kJ/kg·K', ar: '0.9 كيلوجول/كجم·كلفن' },
      { en: '2257 kJ/kg·K', ar: '2257 كيلوجول/كجم·كلفن' },
      { en: '0.4 kJ/kg·K', ar: '0.4 كيلوجول/كجم·كلفن' }
    ],
    answer: 0,
    explain: { en: 'Water 4.2 vs aluminium 0.9 and copper 0.4 kJ/kg·K; 2257 kJ/kg is its latent heat of vaporisation (a different property).', ar: 'الماء 4.2 مقابل الألمنيوم 0.9 والنحاس 0.4 كيلوجول/كجم·كلفن؛ أما 2257 كيلوجول/كجم فهي حرارته الكامنة للتبخر (خاصية مختلفة).' }
  },
  {
    id: 'q103', topic: 'fire-basics',
    q: { en: 'What causes most deaths in building fires?', ar: 'ما سبب معظم الوفيات في حرائق المباني؟' },
    options: [
      { en: 'Direct burns from flames', ar: 'الحروق المباشرة من اللهب' },
      { en: 'Structural collapse', ar: 'انهيار المبنى' },
      { en: 'Electric shock from sprinkler water', ar: 'الصعق الكهربائي من مياه الرشاشات' },
      { en: 'Smoke inhalation (suffocation)', ar: 'استنشاق الدخان (الاختناق)' }
    ],
    answer: 3,
    explain: { en: 'In the lecture\'s test fire, smoke filled the room in under 2½ minutes; hence smoke extraction and stair pressurization are designed with HVAC.', ar: 'في حريق الاختبار بالمحاضرة امتلأت الغرفة بالدخان في أقل من دقيقتين ونصف، ولذلك يُصمَّم شفط الدخان وضغط السلالم بالتنسيق مع التكييف.' }
  }
];

export default QUIZ;
