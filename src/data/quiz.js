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
  }
];

export default QUIZ;
