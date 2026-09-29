// Educational lessons (English + Arabic) for the Fire-Protection Digital Twin trainer.
// Values reflect NFPA 13/14/20/25/72/2001/11 (recent editions). Always verify against the
// edition adopted by the Authority Having Jurisdiction (AHJ) / local civil defence code.

export const LESSONS = [
  // ---------------------------------------------------------------- 1
  {
    id: 'fire-basics',
    icon: '🔥',
    title: { en: 'Fire Fundamentals (HSE)', ar: 'أساسيات الحريق (السلامة والصحة المهنية)' },
    summary: {
      en: 'Fire chemistry, fire classes, heat transfer, t-squared fire growth and how each extinguishing method breaks the fire.',
      ar: 'كيمياء الحريق، وتصنيف الحرائق، وانتقال الحرارة، ونمو الحريق وفق منحنى مربع الزمن، وكيف تكسر كل وسيلة إطفاء الحريق.'
    },
    sections: [
      {
        h: { en: 'Fire triangle and tetrahedron', ar: 'مثلث الحريق ورباعي الحريق' },
        p: {
          en: 'Combustion needs fuel, heat and oxygen (the fire triangle). Flaming combustion is sustained by a fourth element, the uninhibited chemical chain reaction of free radicals, giving the fire tetrahedron. Removing any one side stops the fire.',
          ar: 'يحتاج الاحتراق إلى وقود وحرارة وأكسجين (مثلث الحريق). ويستمر الاحتراق اللهبي بعنصر رابع هو التفاعل الكيميائي المتسلسل غير المثبَّط للجذور الحرة، فيتكوّن رباعي الحريق. وإزالة أي ضلع منها توقف الحريق.'
        },
        bullets: [
          { en: 'Fuel: solid, liquid or gas; liquids burn as vapour above their flash point.', ar: 'الوقود: صلب أو سائل أو غاز؛ والسوائل تحترق على هيئة أبخرة فوق نقطة الوميض.' },
          { en: 'Oxygen: most hydrocarbon flames cannot be sustained below roughly 15% O₂ (normal air 20.9%).', ar: 'الأكسجين: لا تستمر معظم لهب الهيدروكربونات تحت نحو 15% أكسجين (الهواء العادي 20.9%).' },
          { en: 'Heat: must raise the fuel to its ignition temperature and keep producing vapour.', ar: 'الحرارة: يجب أن ترفع الوقود إلى درجة الاشتعال وتستمر في توليد الأبخرة.' },
          { en: 'Chain reaction: free radicals (H•, OH•) propagate the flame; halocarbon and dry-chemical agents interrupt it.', ar: 'التفاعل المتسلسل: الجذور الحرة (H• و OH•) تنشر اللهب، وتقطعه عوامل الهالوكربون والمساحيق الكيميائية الجافة.' }
        ]
      },
      {
        h: { en: 'Classes of fire', ar: 'تصنيف الحرائق' },
        p: {
          en: 'The US/NFPA 10 classification selects the right extinguishing agent. European EN 2 (used with IEC/BS practice in many Gulf projects) uses different letters, so always check which system a drawing or extinguisher label follows.',
          ar: 'يُستخدم التصنيف الأمريكي (NFPA 10) لاختيار وسيلة الإطفاء المناسبة. أما التصنيف الأوروبي EN 2 (المستخدم مع ممارسات IEC/BS في كثير من مشاريع الخليج) فيستخدم حروفاً مختلفة، لذا تحقّق دائماً من النظام المتّبع في المخطط أو ملصق الطفاية.'
        },
        bullets: [
          { en: 'Class A: ordinary combustibles (wood, paper, cloth, many plastics). Water is the primary agent.', ar: 'الفئة A: المواد القابلة للاحتراق العادية (الخشب والورق والقماش وكثير من البلاستيك). والماء هو وسيلة الإطفاء الأساسية.' },
          { en: 'Class B: flammable liquids and gases (petrol, diesel, solvents). Foam, dry chemical, CO₂.', ar: 'الفئة B: السوائل والغازات القابلة للاشتعال (البنزين والديزل والمذيبات). تُطفأ بالرغوة أو المسحوق الكيميائي الجاف أو ثاني أكسيد الكربون.' },
          { en: 'Class C (US): energized electrical equipment. Use non-conductive agents (CO₂, clean agent).', ar: 'الفئة C (الأمريكية): المعدات الكهربائية المكهربة. تُستخدم عوامل غير موصلة (ثاني أكسيد الكربون أو الغاز النظيف).' },
          { en: 'Class D: combustible metals (Mg, Na, Ti, Li). Special dry powders only; water may react violently.', ar: 'الفئة D: المعادن القابلة للاحتراق (المغنيسيوم والصوديوم والتيتانيوم والليثيوم). تُستخدم مساحيق جافة خاصة فقط، وقد يتفاعل الماء معها بعنف.' },
          { en: 'Class K (US) / Class F (EN): cooking oils and fats. Wet chemical agent saponifies the oil.', ar: 'الفئة K (الأمريكية) / الفئة F (الأوروبية): زيوت ودهون الطبخ. يعمل العامل الكيميائي الرطب على تصبين الزيت.' },
          { en: 'EN 2 differences: Class B = liquids, Class C = gases; electrical fires are not a class (shown by a symbol).', ar: 'الاختلاف في EN 2: الفئة B للسوائل والفئة C للغازات، ولا تُعد الحرائق الكهربائية فئة مستقلة (يُشار إليها برمز).' }
        ]
      },
      {
        h: { en: 'Heat transfer', ar: 'انتقال الحرارة' },
        p: {
          en: 'Fire spreads by conduction (through solids such as steel beams and pipes), convection (hot smoke and gases rising and spreading under the ceiling, which is what operates sprinklers and detectors) and radiation (electromagnetic heat from flames and the hot smoke layer, which causes flashover and ignites distant items).',
          ar: 'ينتشر الحريق بالتوصيل (عبر المواد الصلبة كالكمرات والأنابيب الفولاذية)، وبالحمل (صعود الدخان والغازات الساخنة وانتشارها تحت السقف، وهو ما يشغّل الرشاشات والكواشف)، وبالإشعاع (حرارة كهرومغناطيسية من اللهب وطبقة الدخان الساخنة، تسبّب الاشتعال الوميضي وتشعل المواد البعيدة).'
        },
        bullets: [
          { en: 'Ceiling jet: a thin, fast layer of hot gas under the ceiling; sprinklers are placed within it (typically 25–300 mm below the deck).', ar: 'تيار السقف: طبقة رقيقة وسريعة من الغاز الساخن أسفل السقف؛ تُركَّب الرشاشات داخلها (عادةً على بعد 25–300 مم أسفل السقف).' },
          { en: 'Flashover: sudden transition to full-room involvement when the upper layer reaches about 500–600 °C.', ar: 'الاشتعال الوميضي: تحوّل مفاجئ إلى اشتعال الغرفة بالكامل عندما تبلغ الطبقة العليا نحو 500–600 °م.' }
        ]
      },
      {
        h: { en: 't-squared fire growth', ar: 'نمو الحريق وفق مربع الزمن (t²)' },
        p: {
          en: 'Design fires are modelled with heat release rate growing with the square of time. The growth coefficient α defines how fast the fire reaches 1055 kW (1000 Btu/s).',
          ar: 'تُنمذَج حرائق التصميم بمعدل انطلاق حرارة يزداد مع مربع الزمن. ويحدد معامل النمو α مدى سرعة وصول الحريق إلى 1055 كيلوواط (1000 وحدة حرارية بريطانية/ث).'
        },
        formula: 'Q = α · t²   (Q in kW, t in s)\nslow α = 0.00293 kW/s² (≈600 s to 1055 kW)\nmedium α = 0.01172 kW/s² (≈300 s)\nfast α = 0.0469 kW/s² (≈150 s)\nultrafast α = 0.1876 kW/s² (≈75 s)',
        bullets: [
          { en: 'Example: a fast fire after 120 s releases 0.0469 × 120² ≈ 675 kW.', ar: 'مثال: الحريق السريع بعد 120 ثانية يطلق 0.0469 × 120² ≈ 675 كيلوواط.' },
          { en: 'Typical use: slow = dense hardwood furniture; medium = cotton/polyester mattress, offices; fast = upholstered furniture, stacked cartons; ultrafast = pool fires, flammable liquids.', ar: 'الاستخدام النموذجي: البطيء للأثاث الخشبي الكثيف، والمتوسط للمراتب القطنية والمكاتب، والسريع للأثاث المنجّد والكراتين المكدسة، وفائق السرعة لحرائق البرك والسوائل القابلة للاشتعال.' }
        ]
      },
      {
        h: { en: 'Extinguishing mechanisms', ar: 'آليات الإطفاء' },
        p: {
          en: 'Every agent works by attacking one or more sides of the tetrahedron.',
          ar: 'تعمل كل وسيلة إطفاء بمهاجمة ضلع أو أكثر من أضلاع رباعي الحريق.'
        },
        bullets: [
          { en: 'Cooling (remove heat): water, the most effective because of its high latent heat of vaporisation (~2260 kJ/kg).', ar: 'التبريد (إزالة الحرارة): الماء، وهو الأكثر فعالية لارتفاع حرارته الكامنة للتبخر (نحو 2260 كيلوجول/كجم).' },
          { en: 'Smothering / oxygen dilution: foam blanket, CO₂, inert gases (IG-541, IG-55), water mist steam.', ar: 'الخنق / تخفيف الأكسجين: غطاء الرغوة، وثاني أكسيد الكربون، والغازات الخاملة (IG-541 وIG-55)، وبخار الرذاذ المائي.' },
          { en: 'Starving (remove fuel): closing a fuel valve, pumping out a tank, firebreaks.', ar: 'التجويع (إزالة الوقود): إغلاق صمام الوقود، أو تفريغ الخزان، أو فواصل الحريق.' },
          { en: 'Chemical inhibition: dry chemical powders, halocarbon clean agents (HFC-227ea) scavenge free radicals.', ar: 'التثبيط الكيميائي: المساحيق الكيميائية الجافة وعوامل الهالوكربون النظيفة (HFC-227ea) تلتقط الجذور الحرة.' }
        ]
      }
    ],
    refs: ['NFPA 10 (2022) Ch. 5 – Classification of fires', 'EN 2:1992+A1:2004 – Classification of fires', 'SFPE Handbook – t-squared fires', 'NFPA 72 (2022) Annex B – Engineering guide for detector spacing']
  },

  // ---------------------------------------------------------------- 2
  {
    id: 'systems-overview',
    icon: '🏢',
    title: { en: 'Building Fire-Fighting Systems Overview', ar: 'نظرة عامة على أنظمة مكافحة الحريق في المباني' },
    summary: {
      en: 'Active vs passive protection and the full water path from tank to sprinkler, plus the four main sprinkler system types.',
      ar: 'الحماية الفعّالة مقابل الحماية الإنشائية، ومسار المياه الكامل من الخزان إلى الرشاش، والأنواع الأربعة الرئيسية لأنظمة الرشاشات.'
    },
    sections: [
      {
        h: { en: 'Active vs passive protection', ar: 'الحماية الفعّالة مقابل الحماية الإنشائية (السلبية)' },
        p: {
          en: 'Passive protection is built into the structure and works without activation; active protection must detect, operate or be operated. A code-compliant building needs both working together.',
          ar: 'الحماية السلبية (الإنشائية) مدمجة في المبنى وتعمل دون تشغيل؛ أما الحماية الفعّالة فيجب أن تكتشف الحريق أو تعمل أو تُشغَّل. ويحتاج المبنى المطابق للكود إلى كليهما معاً.'
        },
        bullets: [
          { en: 'Passive: fire-rated walls/floors (compartmentation), fire doors, fire stopping, protected escape stairs, fire-resistive coatings.', ar: 'السلبية: الجدران والأرضيات المقاومة للحريق (التقسيم إلى حيّزات)، وأبواب الحريق، وسدّ الفتحات، وسلالم الهروب المحمية، والطلاءات المقاومة للحريق.' },
          { en: 'Active: sprinklers, standpipes and hose reels, fire pumps, detection and alarm, clean-agent and foam systems, smoke control.', ar: 'الفعّالة: الرشاشات، والأنابيب القائمة وبكرات الخراطيم، ومضخات الحريق، والكشف والإنذار، وأنظمة الغاز النظيف والرغوة، والتحكم في الدخان.' }
        ]
      },
      {
        h: { en: 'The water path end-to-end', ar: 'مسار المياه من البداية إلى النهاية' },
        p: {
          en: 'A typical building system is a closed hydraulic chain. Each link must deliver the required flow at the required pressure for the required duration.',
          ar: 'نظام المبنى النموذجي سلسلة هيدروليكية متصلة، ويجب أن توفّر كل حلقة فيها التدفق المطلوب عند الضغط المطلوب طوال المدة المطلوبة.'
        },
        bullets: [
          { en: '1. Water source: dedicated fire water tank (or reserve in a shared tank) sized for sprinkler + hose demand × duration, or a reliable public main.', ar: '1. مصدر المياه: خزان مياه حريق مخصص (أو احتياطي في خزان مشترك) يُحسب حجمه من (طلب الرشاشات + الخراطيم) × المدة، أو شبكة عامة موثوقة.' },
          { en: '2. Pump room: electric main pump, diesel standby pump and jockey pump with controllers and a test header.', ar: '2. غرفة المضخات: مضخة رئيسية كهربائية، ومضخة ديزل احتياطية، ومضخة الاستعاضة (جوكي) مع لوحات التحكم ورأس الاختبار.' },
          { en: '3. Risers: vertical pipes (أنابيب قائمة) carrying water to each floor, often combined sprinkler/standpipe risers.', ar: '3. الرايزرات: أنابيب قائمة رأسية تنقل المياه إلى كل طابق، وغالباً ما تكون مشتركة بين الرشاشات والخراطيم.' },
          { en: '4. Floor control valve assembly: supervised isolation valve, flow switch, drain and test connection, pressure gauge.', ar: '4. مجموعة صمام التحكم في الطابق: صمام عزل مراقَب، ومفتاح تدفق، وصرف ووصلة اختبار، ومقياس ضغط.' },
          { en: '5. Cross mains and branch lines feeding the sprinklers; the most remote area governs the design.', ar: '5. الخطوط الرئيسية العرضية والخطوط الفرعية التي تغذي الرشاشات؛ والمنطقة الأبعد هي التي تحكم التصميم.' },
          { en: '6. Standpipes / landing valves and hose reels for fire brigade and occupant use.', ar: '6. الأنابيب القائمة / صمامات الطوابق وبكرات الخراطيم لاستخدام الدفاع المدني والشاغلين.' },
          { en: '7. Fire department connection (Siamese inlet) lets fire engines boost the system; external hydrants serve the site.', ar: '7. وصلة الدفاع المدني (المدخل الثنائي) تتيح لسيارات الإطفاء دعم النظام، وتخدم الحنفيات الخارجية الموقع.' },
          { en: '8. Alarm: flow switches and alarm valves signal the fire alarm panel and sound the alarm.', ar: '8. الإنذار: ترسل مفاتيح التدفق وصمامات الإنذار إشارة إلى لوحة إنذار الحريق وتطلق الإنذار.' }
        ]
      },
      {
        h: { en: 'Wet pipe systems', ar: 'أنظمة الأنابيب الرطبة' },
        p: {
          en: 'Pipes are permanently filled with water under pressure. When a bulb breaks, water discharges immediately. Simplest, most reliable and cheapest to maintain; used wherever the space is kept above 4 °C (40 °F).',
          ar: 'تكون الأنابيب مملوءة بالمياه المضغوطة دائماً، وعند انكسار الأمبولة تتدفق المياه فوراً. وهي الأبسط والأكثر اعتمادية والأقل كلفة في الصيانة، وتُستخدم حيثما تبقى الحرارة فوق 4 °م (40 °ف).'
        }
      },
      {
        h: { en: 'Dry, pre-action and deluge systems', ar: 'الأنظمة الجافة وسابقة التشغيل والغمر' },
        p: {
          en: 'Where freezing, water damage or very fast fire spread is a concern, the water is held back at a special valve.',
          ar: 'حيثما يُخشى التجمد أو أضرار المياه أو الانتشار السريع جداً للحريق، تُحجز المياه عند صمام خاص.'
        },
        bullets: [
          { en: 'Dry pipe: pipes filled with pressurised air/nitrogen; a sprinkler opening lets air escape and the dry-pipe valve trips. Water delivery to the test outlet is typically limited to 60 s. Used in cold stores and unheated car parks.', ar: 'الأنبوب الجاف: الأنابيب مملوءة بهواء أو نيتروجين مضغوط؛ وعند فتح رشاش يتسرب الهواء فيفتح صمام الأنبوب الجاف. ويُحدَّد زمن وصول المياه إلى مخرج الاختبار عادة بـ 60 ثانية. يُستخدم في المخازن المبردة والمواقف غير المدفأة.' },
          { en: 'Pre-action: closed sprinklers + detection. Single interlock needs detection; double interlock needs detection AND a sprinkler opening. Used for data centres, museums, archives.', ar: 'سابق التشغيل: رشاشات مغلقة مع نظام كشف. التشابك الأحادي يتطلب الكشف فقط، والتشابك المزدوج يتطلب الكشف وفتح رشاش معاً. يُستخدم لمراكز البيانات والمتاحف والأرشيف.' },
          { en: 'Deluge: open nozzles; detection opens the deluge valve and water flows from all nozzles at once. Used for transformers, fuel loading racks, aircraft hangars, cooling towers.', ar: 'الغمر: فوهات مفتوحة؛ يفتح نظام الكشف صمام الغمر فتتدفق المياه من جميع الفوهات معاً. يُستخدم للمحولات ومنصات تحميل الوقود وحظائر الطائرات وأبراج التبريد.' }
        ]
      },
      {
        h: { en: 'Design basis and governing codes', ar: 'أساس التصميم والأكواد الحاكمة' },
        p: {
          en: 'Design starts with the occupancy and hazard, then selects the system type, calculates demand, and sizes the water supply and pumps. In the Middle East the local civil defence code (e.g., UAE Fire & Life Safety Code, Saudi SBC 801, Qatar QCDD) usually adopts NFPA standards by reference.',
          ar: 'يبدأ التصميم بتحديد نوع الإشغال والخطورة، ثم اختيار نوع النظام، وحساب الطلب، وتحديد مصدر المياه والمضخات. وفي الشرق الأوسط يعتمد كود الدفاع المدني المحلي (مثل كود الإمارات للحريق وسلامة الأرواح، والكود السعودي SBC 801، واشتراطات الدفاع المدني في قطر) معايير NFPA بالإحالة.'
        }
      }
    ],
    refs: ['NFPA 13 (2022) Ch. 8 – System types', 'NFPA 14 (2024) – Standpipes', 'NFPA 20 (2022) – Fire pumps', 'NFPA 24 (2022) – Private fire service mains', 'SBC 801 / UAE FLSC Ch. 9']
  },

  // ---------------------------------------------------------------- 3
  {
    id: 'sprinklers',
    icon: '💧',
    title: { en: 'How Sprinklers Work', ar: 'كيف تعمل الرشاشات' },
    summary: {
      en: 'Heat-responsive elements, temperature ratings, response time index, K-factor flow equation, spacing limits and ESFR.',
      ar: 'العناصر الحساسة للحرارة، وتصنيفات درجات الحرارة، ومؤشر زمن الاستجابة، ومعادلة التدفق بمعامل K، وحدود التباعد، ورشاشات ESFR.'
    },
    sections: [
      {
        h: { en: 'Operating element', ar: 'عنصر التشغيل' },
        p: {
          en: 'Each sprinkler is an individual heat-activated valve. A glass bulb filled with a liquid expands and shatters, or a fusible solder link melts, releasing the cap. Water strikes the deflector and forms a spray pattern. Only sprinklers heated to their rating open; in most fires fewer than four operate.',
          ar: 'كل رشاش هو صمام فردي يعمل بالحرارة. تتمدد الأمبولة الزجاجية المملوءة بسائل فتنكسر، أو تنصهر الوصلة المعدنية القابلة للانصهار، فيتحرر الغطاء. وتصطدم المياه بالعاكس فتتشكل نفثة الرش. ولا يفتح إلا الرشاش الذي بلغ درجة حرارته المقررة، وفي معظم الحرائق يعمل أقل من أربعة رشاشات.'
        },
        bullets: [
          { en: 'Orange 57 °C (135 °F) and Red 68 °C (155 °F): ordinary temperature class.', ar: 'البرتقالي 57 °م (135 °ف) والأحمر 68 °م (155 °ف): فئة الحرارة العادية.' },
          { en: 'Yellow 79 °C (175 °F) and Green 93 °C (200 °F): intermediate class.', ar: 'الأصفر 79 °م (175 °ف) والأخضر 93 °م (200 °ف): الفئة المتوسطة.' },
          { en: 'Blue 141 °C (286 °F): high class (e.g., near ovens, skylights in hot climates).', ar: 'الأزرق 141 °م (286 °ف): الفئة العالية (مثل قرب الأفران أو المناور في المناخ الحار).' },
          { en: 'Rule: choose a rating at least ~30 °C above the maximum expected ceiling temperature (ordinary class for ceilings up to 38 °C).', ar: 'القاعدة: اختر درجة تزيد بنحو 30 °م على الأقل عن أعلى حرارة متوقعة عند السقف (الفئة العادية للأسقف حتى 38 °م).' }
        ]
      },
      {
        h: { en: 'Response time index (RTI)', ar: 'مؤشر زمن الاستجابة (RTI)' },
        p: {
          en: 'RTI measures the thermal sensitivity of the element. Quick-response (QR) sprinklers have RTI ≤ 50 (m·s)^½ and open earlier in the fire growth curve; standard-response (SR) have RTI ≥ 80 (m·s)^½. NFPA 13 requires QR sprinklers in light hazard occupancies.',
          ar: 'يقيس مؤشر RTI الحساسية الحرارية للعنصر. فالرشاشات سريعة الاستجابة (QR) لها RTI ≤ 50 (م·ث)^½ وتفتح في مرحلة مبكرة من نمو الحريق، أما قياسية الاستجابة (SR) فلها RTI ≥ 80 (م·ث)^½. ويشترط NFPA 13 استخدام رشاشات سريعة الاستجابة في إشغالات الخطورة الخفيفة.'
        }
      },
      {
        h: { en: 'K-factor and discharge', ar: 'معامل K والتصريف' },
        p: {
          en: 'Flow from a sprinkler depends on the orifice (K-factor) and the pressure at the sprinkler. The minimum operating pressure for any sprinkler is 7 psi (0.5 bar).',
          ar: 'يعتمد تدفق الرشاش على الفتحة (معامل K) والضغط عند الرشاش. وأقل ضغط تشغيل لأي رشاش هو 7 رطل/بوصة² (0.5 بار).'
        },
        formula: 'Q = K · √P\nUS: Q [gpm], P [psi]   K5.6 (½" orifice), K8.0, K11.2 ...\nSI: Q [L/min], P [bar]   K80 ≡ K5.6, K115 ≡ K8.0   (K_SI ≈ 14.4 × K_US)\nExample: K5.6 at 16 psi → Q = 5.6 × 4 = 22.4 gpm',
        bullets: [
          { en: 'Required pressure at a sprinkler: P = (Q/K)².', ar: 'الضغط المطلوب عند الرشاش: P = (Q/K)².' },
          { en: 'Larger K gives more flow at lower pressure, useful for high densities (storage).', ar: 'معامل K الأكبر يعطي تدفقاً أكبر عند ضغط أقل، وهو مفيد للكثافات العالية (التخزين).' }
        ]
      },
      {
        h: { en: 'Coverage and spacing (standard spray)', ar: 'مساحة التغطية والتباعد (الرشاشات القياسية)' },
        p: {
          en: 'NFPA 13 limits the area each standard spray sprinkler may protect and the distance between sprinklers.',
          ar: 'يحدد NFPA 13 المساحة التي يمكن أن يحميها كل رشاش قياسي والمسافة بين الرشاشات.'
        },
        bullets: [
          { en: 'Light hazard: max 225 ft² (20.9 m²) per sprinkler (hydraulically calculated), max 15 ft (4.6 m) spacing.', ar: 'الخطورة الخفيفة: بحد أقصى 225 قدم² (20.9 م²) لكل رشاش (بالحساب الهيدروليكي)، وتباعد أقصى 15 قدم (4.6 م).' },
          { en: 'Ordinary hazard: max 130 ft² (12.1 m²), max 15 ft (4.6 m) spacing.', ar: 'الخطورة العادية: بحد أقصى 130 قدم² (12.1 م²)، وتباعد أقصى 15 قدم (4.6 م).' },
          { en: 'Extra hazard: max 100 ft² (9.3 m²) hydraulic (90 ft² pipe schedule), max 12 ft (3.7 m) spacing.', ar: 'الخطورة العالية: بحد أقصى 100 قدم² (9.3 م²) بالحساب الهيدروليكي (90 قدم² بطريقة جدول الأنابيب)، وتباعد أقصى 12 قدم (3.7 م).' },
          { en: 'Minimum 6 ft (1.8 m) between sprinklers to prevent cold soldering; max distance to wall = ½ allowable spacing; min 4 in (100 mm) from wall.', ar: 'حد أدنى 6 أقدام (1.8 م) بين الرشاشات لمنع التبريد المتبادل؛ وأقصى بعد عن الجدار = نصف التباعد المسموح؛ وأدنى بعد 4 بوصات (100 مم) عن الجدار.' },
          { en: 'Obstructions: beams, ducts and lights disturb the spray; NFPA 13 gives the three-times rule (keep sprinkler ≥ 3× the obstruction width away, max 24 in) and beam-rule tables.', ar: 'العوائق: الكمرات ومجاري الهواء ووحدات الإنارة تعيق نفثة الرش؛ ويعطي NFPA 13 قاعدة الثلاثة أضعاف (إبعاد الرشاش ≥ 3 أضعاف عرض العائق، بحد أقصى 24 بوصة) وجداول قاعدة الكمرات.' }
        ]
      },
      {
        h: { en: 'Special sprinkler types and ESFR', ar: 'أنواع خاصة من الرشاشات ورشاشات ESFR' },
        p: {
          en: 'Orientation: pendent, upright, sidewall, concealed. ESFR (Early Suppression Fast Response) sprinklers, K14 to K25, are designed to suppress (not just control) high-challenge storage fires with a high-momentum spray. They are ceiling-only (no in-rack sprinklers normally), have strict obstruction and ceiling slope rules, and are designed on 12 sprinklers operating at a specified minimum pressure.',
          ar: 'من حيث الاتجاه: متدلٍّ، وقائم، وجانبي، ومخفي. أما رشاشات ESFR (الإخماد المبكر سريع الاستجابة) بمعاملات من K14 إلى K25 فمصممة لإخماد حرائق التخزين عالية الخطورة (لا مجرد السيطرة عليها) بنفثة ذات زخم عالٍ. وتُركَّب في السقف فقط (دون رشاشات داخل الرفوف عادة)، ولها قيود صارمة على العوائق وميل السقف، وتُصمَّم على أساس تشغيل 12 رشاشاً عند ضغط أدنى محدد.'
        }
      }
    ],
    refs: ['NFPA 13 (2022) Ch. 7 – Sprinkler characteristics, Table 7.2.4.1 (temperature ratings)', 'NFPA 13 (2022) Ch. 10 – Standard pendent/upright spray sprinklers', 'NFPA 13 (2022) Ch. 14 – ESFR sprinklers', 'UL 199 / FM 2000']
  },

  // ---------------------------------------------------------------- 4
  {
    id: 'hazard-classification',
    icon: '🏭',
    title: { en: 'Occupancy Hazard Classification', ar: 'تصنيف خطورة الإشغال' },
    summary: {
      en: 'NFPA 13 hazard groups, density/area design criteria and hose stream allowances with durations.',
      ar: 'مجموعات الخطورة حسب NFPA 13، ومعايير التصميم (الكثافة/المساحة)، وبدلات الخراطيم ومدد التشغيل.'
    },
    sections: [
      {
        h: { en: 'Why classify?', ar: 'لماذا التصنيف؟' },
        p: {
          en: 'The hazard class reflects the quantity and combustibility of contents and the expected heat release rate. It sets the design density, design area, hose allowance, duration and sprinkler spacing. Storage (above ~3.7 m / 12 ft) is handled separately by the storage chapters.',
          ar: 'يعكس تصنيف الخطورة كمية المحتويات وقابليتها للاحتراق ومعدل انطلاق الحرارة المتوقع، ويحدد كثافة التصميم ومساحة التصميم وبدل الخراطيم والمدة وتباعد الرشاشات. أما التخزين (فوق نحو 3.7 م / 12 قدماً) فتعالجه فصول التخزين بشكل منفصل.'
        }
      },
      {
        h: { en: 'Hazard classes with examples', ar: 'فئات الخطورة مع أمثلة' },
        p: { en: 'NFPA 13 Annex A gives typical examples:', ar: 'يعطي الملحق A من NFPA 13 أمثلة نموذجية:' },
        bullets: [
          { en: 'Light Hazard (LH): offices, schools, hospitals, hotels, residential, churches/mosques, museums, restaurant seating areas.', ar: 'الخطورة الخفيفة (LH): المكاتب، والمدارس، والمستشفيات، والفنادق، والسكن، ودور العبادة، والمتاحف، وصالات الطعام في المطاعم.' },
          { en: 'Ordinary Hazard Group 1 (OH1): car parks, laundries, restaurant kitchens, bakeries, electronic plants, canneries, beverage manufacturing.', ar: 'الخطورة العادية المجموعة 1 (OH1): مواقف السيارات، والمغاسل، ومطابخ المطاعم، والمخابز، ومصانع الإلكترونيات، ومصانع التعليب، وتصنيع المشروبات.' },
          { en: 'Ordinary Hazard Group 2 (OH2): mercantile/retail, library stack rooms, machine shops, dry cleaners, post offices, repair garages, stages, textile mills.', ar: 'الخطورة العادية المجموعة 2 (OH2): المحلات التجارية والبيع بالتجزئة، ومستودعات الكتب في المكتبات، والورش الميكانيكية، والتنظيف الجاف، ومكاتب البريد، وورش إصلاح السيارات، والمسارح، ومصانع النسيج.' },
          { en: 'Extra Hazard Group 1 (EH1): saw mills, plywood manufacturing, die casting, rubber reclaiming, upholstering with plastic foams, printing with low-flash-point inks.', ar: 'الخطورة العالية المجموعة 1 (EH1): مناشر الخشب، وتصنيع الخشب الرقائقي، والصب بالقوالب، واستصلاح المطاط، والتنجيد بالرغوة البلاستيكية، والطباعة بأحبار منخفضة نقطة الوميض.' },
          { en: 'Extra Hazard Group 2 (EH2): flammable liquid spraying, asphalt saturating, open oil quenching, plastics processing, solvent cleaning, varnish and paint dipping.', ar: 'الخطورة العالية المجموعة 2 (EH2): رش السوائل القابلة للاشتعال، وتشبيع الأسفلت، والتبريد بالزيت المكشوف، ومعالجة البلاستيك، والتنظيف بالمذيبات، والغمس في الورنيش والدهانات.' }
        ]
      },
      {
        h: { en: 'Density/area design criteria', ar: 'معايير التصميم: الكثافة / المساحة' },
        p: {
          en: 'The sprinkler system must deliver at least the design density over the hydraulically most demanding (remote) design area. Typical single points from the density/area curves:',
          ar: 'يجب أن يوفّر نظام الرشاشات كثافة التصميم على الأقل فوق مساحة التصميم الأكثر طلباً هيدروليكياً (البعيدة). وفيما يلي نقاط نموذجية من منحنيات الكثافة/المساحة:'
        },
        formula: 'LH : 0.10 gpm/ft² over 1500 ft²  (4.1 mm/min over 139 m²)\nOH1: 0.15 gpm/ft² over 1500 ft²  (6.1 mm/min over 139 m²)\nOH2: 0.20 gpm/ft² over 1500 ft²  (8.1 mm/min over 139 m²)\nEH1: 0.30 gpm/ft² over 2500 ft²  (12.2 mm/min over 232 m²)\nEH2: 0.40 gpm/ft² over 2500 ft²  (16.3 mm/min over 232 m²)\n1 gpm/ft² = 40.7 mm/min (L/min·m²)',
        bullets: [
          { en: 'Sprinkler demand = density × area (e.g., OH2: 0.20 × 1500 = 300 gpm, before hydraulic imbalance).', ar: 'طلب الرشاشات = الكثافة × المساحة (مثلاً OH2: 0.20 × 1500 = 300 جالون/دقيقة، قبل عدم الاتزان الهيدروليكي).' },
          { en: 'Area reductions are allowed for quick-response sprinklers (up to 40% with ceiling height limits); increases apply for dry/double-interlock pre-action systems (+30%) and sloped ceilings.', ar: 'يُسمح بتخفيض المساحة عند استخدام الرشاشات سريعة الاستجابة (حتى 40% ضمن حدود ارتفاع السقف)، وتُزاد المساحة للأنظمة الجافة وسابقة التشغيل مزدوجة التشابك (+30%) والأسقف المائلة.' }
        ]
      },
      {
        h: { en: 'Hose stream allowance and duration', ar: 'بدل الخراطيم ومدة التشغيل' },
        p: {
          en: 'The water supply must also cover inside and outside hose streams, added at the point of connection to the supply, for the full duration.',
          ar: 'يجب أن يغطي مصدر المياه أيضاً تدفق الخراطيم الداخلية والخارجية، ويُضاف عند نقطة الاتصال بالمصدر، طوال المدة كاملة.'
        },
        bullets: [
          { en: 'Light hazard: 100 gpm (380 L/min), 30 min.', ar: 'الخطورة الخفيفة: 100 جالون/دقيقة (380 لتر/دقيقة) لمدة 30 دقيقة.' },
          { en: 'Ordinary hazard: 250 gpm (950 L/min), 60–90 min.', ar: 'الخطورة العادية: 250 جالون/دقيقة (950 لتر/دقيقة) لمدة 60–90 دقيقة.' },
          { en: 'Extra hazard: 500 gpm (1900 L/min), 90–120 min.', ar: 'الخطورة العالية: 500 جالون/دقيقة (1900 لتر/دقيقة) لمدة 90–120 دقيقة.' }
        ],
        formula: 'Tank volume = (sprinkler demand + hose allowance) × duration\nExample OH2: (300 + 250) gpm × 60 min = 33,000 gal ≈ 125 m³'
      }
    ],
    refs: ['NFPA 13 (2022) §4.3 – Occupancy classifications', 'NFPA 13 (2022) Fig. 19.3.3.1.1 – Density/area curves', 'NFPA 13 (2022) Table 19.3.3.1.2 – Hose stream allowance and duration', 'NFPA 13 (2022) Annex A.4.3']
  },

  // ---------------------------------------------------------------- 5
  {
    id: 'pipe-schedule',
    icon: '📋',
    title: { en: 'NFPA 13 Pipe Schedule Method', ar: 'طريقة جدول الأنابيب حسب NFPA 13' },
    summary: {
      en: 'Sizing pipes by counting sprinklers: where it is permitted, the steel pipe tables and required residual pressures.',
      ar: 'تحديد أقطار الأنابيب بعدّ الرشاشات: أين يُسمح بها، وجداول الأنابيب الفولاذية، والضغوط المتبقية المطلوبة.'
    },
    sections: [
      {
        h: { en: 'What is the pipe schedule method?', ar: 'ما هي طريقة جدول الأنابيب؟' },
        p: {
          en: 'The oldest sprinkler design method: the pipe size is chosen from a table according to the number of sprinklers it feeds, without hydraulic calculation. It is conservative and simple, but can oversize or undersize pipes and gives no proof of performance, so modern practice prefers hydraulic calculation.',
          ar: 'أقدم طرق تصميم الرشاشات: يُختار قطر الأنبوب من جدول وفق عدد الرشاشات التي يغذيها، دون حساب هيدروليكي. وهي طريقة محافظة وبسيطة، لكنها قد تكبّر الأقطار أو تصغّرها ولا تقدّم إثباتاً للأداء، لذا تفضّل الممارسة الحديثة الحساب الهيدروليكي.'
        }
      },
      {
        h: { en: 'Where it is permitted', ar: 'متى يُسمح باستخدامها' },
        p: { en: 'NFPA 13 restricts the method for new work:', ar: 'يقيّد NFPA 13 استخدام هذه الطريقة في الأعمال الجديدة:' },
        bullets: [
          { en: 'Light and ordinary hazard occupancies only; not for new extra hazard or storage systems.', ar: 'لإشغالات الخطورة الخفيفة والعادية فقط، ولا تُستخدم لأنظمة الخطورة العالية أو التخزين الجديدة.' },
          { en: 'New systems of 5000 ft² (465 m²) or less, or additions/modifications to existing pipe schedule systems.', ar: 'الأنظمة الجديدة بمساحة 5000 قدم² (465 م²) أو أقل، أو الإضافات والتعديلات على أنظمة جدول الأنابيب القائمة.' },
          { en: 'Larger new systems only where the tabulated flows are available with at least 50 psi (3.4 bar) residual at the highest sprinkler elevation.', ar: 'الأنظمة الجديدة الأكبر فقط إذا توفرت التدفقات المجدولة بضغط متبقٍّ لا يقل عن 50 رطل/بوصة² (3.4 بار) عند منسوب أعلى رشاش.' },
          { en: 'Tabulated supply: LH 500–750 gpm for 30–60 min; OH 850–1500 gpm for 60–90 min (flow at base of riser).', ar: 'الإمداد المجدول: الخطورة الخفيفة 500–750 جالون/دقيقة لمدة 30–60 دقيقة؛ والعادية 850–1500 جالون/دقيقة لمدة 60–90 دقيقة (التدفق عند قاعدة الرايزر).' }
        ]
      },
      {
        h: { en: 'Light hazard steel pipe schedule', ar: 'جدول الأنابيب الفولاذية للخطورة الخفيفة' },
        p: {
          en: 'Maximum number of sprinklers that may be supplied by each steel pipe size. Branch lines are limited to 8 sprinklers on either side of a cross main.',
          ar: 'أقصى عدد من الرشاشات يمكن أن يغذيه كل قطر من الأنابيب الفولاذية. ويُحدَّد الخط الفرعي بثمانية رشاشات على أي جانب من الخط الرئيسي العرضي.'
        },
        formula: '1"  (25 mm) = 2\n1¼" (32 mm) = 3\n1½" (40 mm) = 5\n2"  (50 mm) = 10\n2½" (65 mm) = 30\n3"  (80 mm) = 60\n(larger sizes: per table / area limits)'
      },
      {
        h: { en: 'Ordinary hazard steel pipe schedule', ar: 'جدول الأنابيب الفولاذية للخطورة العادية' },
        p: {
          en: 'Ordinary hazard uses the same small sizes but larger pipes carry fewer sprinklers because of the higher density.',
          ar: 'تستخدم الخطورة العادية الأقطار الصغيرة نفسها، لكن الأنابيب الأكبر تحمل عدداً أقل من الرشاشات بسبب الكثافة الأعلى.'
        },
        formula: '1"  = 2      2½" = 20      4" = 100\n1¼" = 3      3"  = 40      5" = 160\n1½" = 5      3½" = 65      6" = 275\n2"  = 10'
      },
      {
        h: { en: 'Pressure requirement and limitations', ar: 'اشتراطات الضغط والقيود' },
        p: {
          en: 'The supply must provide at least 15 psi (1.0 bar) residual at the highest sprinkler for light hazard and 20 psi (1.4 bar) for ordinary hazard, at the tabulated flow. Other limits: max protection area per system riser 52,000 ft² (4831 m²) for LH/OH; sprinklers per branch line limited (8 each side); coverage per sprinkler for pipe schedule LH is 200 ft² (18.6 m²).',
          ar: 'يجب أن يوفّر المصدر ضغطاً متبقياً لا يقل عن 15 رطل/بوصة² (1.0 بار) عند أعلى رشاش للخطورة الخفيفة و20 رطل/بوصة² (1.4 بار) للخطورة العادية، عند التدفق المجدول. ومن القيود الأخرى: أقصى مساحة حماية لكل رايزر 52,000 قدم² (4831 م²) للخطورة الخفيفة والعادية؛ وتحديد عدد الرشاشات على الخط الفرعي (8 على كل جانب)؛ وتغطية الرشاش في طريقة الجدول للخطورة الخفيفة 200 قدم² (18.6 م²).'
        },
        bullets: [
          { en: 'Example: a 2½" OH cross main may feed up to 20 sprinklers; for 25 sprinklers step up to 3" (40).', ar: 'مثال: الخط الرئيسي العرضي 2½ بوصة في الخطورة العادية يغذي حتى 20 رشاشاً؛ ولـ 25 رشاشاً يُرفع إلى 3 بوصات (40).' },
          { en: 'Copper tube has its own (slightly more generous) tables.', ar: 'لأنابيب النحاس جداولها الخاصة (أكثر سخاءً قليلاً).' }
        ]
      }
    ],
    refs: ['NFPA 13 (2022) §19.2.2 & Table 19.2.2.1 – Pipe schedule water supply', 'NFPA 13 (2022) §28.5 – Pipe schedules (Tables 28.5.2.2.1, 28.5.3.4)', 'NFPA 13 (2022) §4.4 – Protection area limitations']
  },

  // ---------------------------------------------------------------- 6
  {
    id: 'hydraulic-calcs',
    icon: '📐',
    title: { en: 'Hydraulic Calculations', ar: 'الحسابات الهيدروليكية' },
    summary: {
      en: 'Hazen–Williams friction loss, remote area, fittings, elevation, a worked two-sprinkler example and the supply/demand graph.',
      ar: 'فقد الاحتكاك بمعادلة هازن–ويليامز، والمنطقة البعيدة، والتجهيزات، والارتفاع، ومثال محلول لرشاشين، ومنحنى الإمداد/الطلب.'
    },
    sections: [
      {
        h: { en: 'Hazen–Williams equation', ar: 'معادلة هازن–ويليامز' },
        p: {
          en: 'NFPA 13 uses Hazen–Williams for water-based sprinkler piping. Friction loss rises with Q^1.85 and falls with d^4.87: doubling flow multiplies loss by ≈3.6; doubling diameter divides it by ≈29.',
          ar: 'يستخدم NFPA 13 معادلة هازن–ويليامز لأنابيب الرشاشات المائية. ويزداد فقد الاحتكاك مع Q^1.85 ويقل مع d^4.87: فمضاعفة التدفق تضاعف الفقد نحو 3.6 مرة، ومضاعفة القطر تقسمه على نحو 29.'
        },
        formula: 'p = 4.52 · Q^1.85 / (C^1.85 · d^4.87)   [psi/ft; Q gpm; d internal in]\np = 6.05×10^5 · Q^1.85 / (C^1.85 · d^4.87)   [bar/m; Q L/min; d mm]',
        bullets: [
          { en: 'C-factor: 120 for black steel in wet systems; 100 for dry and pre-action steel; 150 for CPVC, copper and stainless steel; 140 for cement-lined ductile iron.', ar: 'معامل C: 120 للفولاذ الأسود في الأنظمة الرطبة؛ و100 للفولاذ في الأنظمة الجافة وسابقة التشغيل؛ و150 لـ CPVC والنحاس والفولاذ المقاوم للصدأ؛ و140 لحديد الدكتايل المبطّن بالإسمنت.' },
          { en: 'Always use actual internal diameter (e.g., 1" Sch 40 = 1.049 in, 2" Sch 40 = 2.067 in).', ar: 'استخدم دائماً القطر الداخلي الفعلي (مثل 1 بوصة جدول 40 = 1.049 بوصة، و2 بوصة جدول 40 = 2.067 بوصة).' }
        ]
      },
      {
        h: { en: 'Remote area and most demanding sprinkler', ar: 'المنطقة البعيدة والرشاش الأكثر طلباً' },
        p: {
          en: 'The design area is placed where it demands the highest pressure at the source, normally the far end of the far branch line. It is rectangular with its long side parallel to the branch lines: L ≥ 1.2·√A. Number of sprinklers = A / coverage per sprinkler (round up). The calculation starts at the most demanding sprinkler, whose flow must be at least density × coverage area and pressure at least 7 psi.',
          ar: 'توضع مساحة التصميم في المكان الذي يتطلب أعلى ضغط عند المصدر، وعادةً عند الطرف الأبعد للخط الفرعي الأبعد. وتكون مستطيلة وضلعها الطويل موازٍ للخطوط الفرعية: L ≥ 1.2·√A. وعدد الرشاشات = A ÷ مساحة تغطية الرشاش (مع التقريب لأعلى). ويبدأ الحساب من الرشاش الأكثر طلباً، الذي يجب ألا يقل تدفقه عن الكثافة × مساحة التغطية ولا يقل ضغطه عن 7 رطل/بوصة².'
        }
      },
      {
        h: { en: 'Fittings and elevation', ar: 'التجهيزات والارتفاع' },
        p: {
          en: 'Fittings and valves are converted to equivalent lengths of pipe (NFPA 13 Table 28.2.3.1.1, based on C = 120; multiply by 0.713 for C = 100, 1.51 for C = 150). A tee is counted with flow turned 90°. Elevation adds static pressure loss when flowing upward.',
          ar: 'تُحوَّل التجهيزات والصمامات إلى أطوال مكافئة من الأنابيب (جدول NFPA 13 رقم 28.2.3.1.1، على أساس C = 120؛ وتُضرب في 0.713 عند C = 100 وفي 1.51 عند C = 150). ويُحتسب التي (T) عند انعطاف التدفق بزاوية 90°. ويضيف الارتفاع فقداً في الضغط الساكن عند التدفق لأعلى.'
        },
        formula: 'Elevation: ΔP = 0.433 psi/ft  (0.098 bar/m)\nTotal P_node = P_prev + friction (L_pipe + L_eq) × p + elevation',
        bullets: [
          { en: 'Typical equivalent lengths: 1" elbow 2 ft, 1" tee 5 ft; 2" elbow 5 ft, 2" tee 10 ft; 4" tee 20 ft; 4" butterfly valve 12 ft.', ar: 'أطوال مكافئة نموذجية: كوع 1 بوصة = 2 قدم، وتي 1 بوصة = 5 أقدام؛ كوع 2 بوصة = 5 أقدام، وتي 2 بوصة = 10 أقدام؛ وتي 4 بوصات = 20 قدماً؛ وصمام فراشة 4 بوصات = 12 قدماً.' },
          { en: 'A 30 m high riser costs about 30 × 0.098 ≈ 2.9 bar of pressure before any friction.', ar: 'الرايزر بارتفاع 30 م يستهلك نحو 30 × 0.098 ≈ 2.9 بار من الضغط قبل أي احتكاك.' }
        ]
      },
      {
        h: { en: 'Worked mini example', ar: 'مثال محلول مختصر' },
        p: {
          en: 'OH2, 0.20 gpm/ft², 130 ft² per sprinkler, K5.6, 12 ft of 1" Sch 40 steel (C = 120) between sprinkler 1 and sprinkler 2 (same elevation, fittings ignored for clarity).',
          ar: 'خطورة عادية مجموعة 2، كثافة 0.20 جالون/دقيقة/قدم²، و130 قدم² لكل رشاش، ومعامل K5.6، و12 قدماً من أنبوب فولاذي 1 بوصة جدول 40 (C = 120) بين الرشاش 1 والرشاش 2 (المنسوب نفسه مع إهمال التجهيزات للتبسيط).'
        },
        formula: 'Sprinkler 1: Q1 = 0.20 × 130 = 26 gpm → P1 = (26/5.6)² = 21.6 psi\nFriction 1": p = 4.52·26^1.85/(120^1.85·1.049^4.87) = 0.211 psi/ft\nLoss over 12 ft = 2.54 psi → P2 = 24.1 psi\nSprinkler 2: Q2 = 5.6·√24.1 = 27.5 gpm\nFlow onward = 26 + 27.5 = 53.5 gpm (continue node by node)'
      },
      {
        h: { en: 'Supply vs demand graph', ar: 'منحنى الإمداد مقابل الطلب' },
        p: {
          en: 'The water supply is plotted on semi-logarithmic N^1.85 graph paper, where Hazen–Williams behaviour becomes a straight line: static pressure at zero flow and residual pressure at test flow (from a hydrant flow test or pump curve). The system demand point (sprinkler flow at base of riser plus hose allowance) must fall below the supply line. Many consultants and Gulf authorities require a safety margin (commonly 10% or 5–10 psi).',
          ar: 'يُرسم مصدر المياه على ورق بياني شبه لوغاريتمي N^1.85، حيث يصبح سلوك هازن–ويليامز خطاً مستقيماً: الضغط الساكن عند تدفق صفري، والضغط المتبقي عند تدفق الاختبار (من اختبار تدفق الحنفية أو منحنى المضخة). ويجب أن تقع نقطة طلب النظام (تدفق الرشاشات عند قاعدة الرايزر مضافاً إليه بدل الخراطيم) تحت خط الإمداد. ويشترط كثير من الاستشاريين وجهات الدفاع المدني في الخليج هامش أمان (عادةً 10% أو 5–10 رطل/بوصة²).'
        },
        formula: 'Supply at flow Q: P = Ps − (Ps − Pr)·(Q/Qr)^1.85'
      }
    ],
    refs: ['NFPA 13 (2022) Ch. 28 – Plans and calculations (§28.2.2 Hazen–Williams)', 'NFPA 13 (2022) Table 28.2.3.1.1 – Equivalent pipe lengths', 'NFPA 13 (2022) Table 28.2.4.8.1 – C values', 'NFPA 13 (2022) §19.3.3 – Density/area method']
  },

  // ---------------------------------------------------------------- 7
  {
    id: 'fire-pumps',
    icon: '⚙️',
    title: { en: 'Fire Pump Room (NFPA 20)', ar: 'غرفة مضخات الحريق (NFPA 20)' },
    summary: {
      en: 'Main electric, diesel and jockey pumps, controllers, performance curve rules, pressure setpoints, testing and pump room requirements.',
      ar: 'المضخة الكهربائية الرئيسية ومضخة الديزل ومضخة الاستعاضة (جوكي)، ولوحات التحكم، وقواعد منحنى الأداء، ونقاط ضبط الضغط، والاختبارات، واشتراطات غرفة المضخات.'
    },
    sections: [
      {
        h: { en: 'Pump set components', ar: 'مكونات مجموعة المضخات' },
        p: {
          en: 'A typical Middle East pump set: one electric main pump (duty), one diesel pump of the same rating (standby, independent of mains power), and a small jockey pump to maintain pressure against minor leaks. Most are horizontal split-case or end-suction; vertical turbine pumps are used when water is below the pump (lift from a sump).',
          ar: 'مجموعة المضخات النموذجية في الشرق الأوسط: مضخة كهربائية رئيسية (عاملة)، ومضخة ديزل بالسعة نفسها (احتياطية ومستقلة عن الكهرباء العامة)، ومضخة استعاضة (جوكي) صغيرة للمحافظة على الضغط في مواجهة التسربات البسيطة. ومعظمها أفقية منقسمة الغلاف أو ذات سحب طرفي، وتُستخدم المضخات التوربينية الرأسية عندما يكون الماء أسفل المضخة (السحب من بئر).'
        },
        bullets: [
          { en: 'Listed controllers (UL/FM) for each pump; electric controller with transfer switch if an alternate source is used; diesel controller with two battery sets.', ar: 'لوحات تحكم معتمدة (UL/FM) لكل مضخة؛ ولوحة المضخة الكهربائية مع مفتاح تحويل عند استخدام مصدر بديل؛ ولوحة الديزل مع مجموعتي بطاريات.' },
          { en: 'Standard rated capacities (gpm): 25, 50, 100, 150, 200, 250, 300, 400, 450, 500, 750, 1000, 1250, 1500, 2000, 2500 ... 5000.', ar: 'السعات القياسية (جالون/دقيقة): 25، 50، 100، 150، 200، 250، 300، 400، 450، 500، 750، 1000، 1250، 1500، 2000، 2500 ... 5000.' },
          { en: 'Test header (hose valves outside) or a listed flow meter loop, relief valve where churn + suction could exceed system rating, pressure sensing lines with check valves.', ar: 'رأس اختبار (صمامات خراطيم في الخارج) أو حلقة مقياس تدفق معتمد، وصمام تنفيس حيث قد يتجاوز ضغط الإغلاق مع ضغط السحب تصنيف النظام، وخطوط استشعار الضغط مع صمامات عدم رجوع.' }
        ]
      },
      {
        h: { en: 'Pump performance curve rules', ar: 'قواعد منحنى أداء المضخة' },
        p: {
          en: 'A listed centrifugal fire pump must have a flat curve so that it performs across the full demand range.',
          ar: 'يجب أن يكون لمضخة الحريق الطاردة المركزية المعتمدة منحنى مسطح لتعمل بكفاءة عبر كامل مدى الطلب.'
        },
        formula: 'Churn (0 flow): pressure ≤ 140% of rated pressure\nRated point: 100% flow at 100% rated pressure\nOverload: 150% of rated flow at ≥ 65% of rated pressure\nExample 500 gpm @ 100 psi: churn ≤ 140 psi; 750 gpm at ≥ 65 psi',
        bullets: [
          { en: 'Select the pump so the system demand lies between 90% and 140% of rated flow; the 150% point gives reserve for hose streams.', ar: 'تُختار المضخة بحيث يقع طلب النظام بين 90% و140% من التدفق المقنّن؛ وتعطي نقطة 150% احتياطياً لتدفق الخراطيم.' }
        ]
      },
      {
        h: { en: 'Pressure setpoints (NFPA 20 Annex A)', ar: 'نقاط ضبط الضغط (الملحق A من NFPA 20)' },
        p: {
          en: 'Pumps start in sequence on falling pressure so the jockey handles leaks and the main pumps start only for real demand. Main pumps are stopped manually (automatic stop is not recommended in most cases); minimum run timer is used when auto-stop is permitted.',
          ar: 'تبدأ المضخات بالتتابع عند انخفاض الضغط، بحيث تعالج مضخة الجوكي التسربات ولا تبدأ المضخات الرئيسية إلا عند الطلب الفعلي. وتُوقَف المضخات الرئيسية يدوياً (لا يُنصح بالإيقاف التلقائي في معظم الحالات)، ويُستخدم مؤقّت أدنى زمن تشغيل عند السماح بالإيقاف التلقائي.'
        },
        formula: 'Jockey stop  = pump churn pressure + minimum static suction pressure\nJockey start = jockey stop − 10 psi\nMain pump start = jockey start − 5 psi\nEach additional pump start = 10 psi lower\nExample: churn 120 + suction 20 → jockey stop 140, start 130; electric start 125; diesel start 115 psi'
      },
      {
        h: { en: 'Suction and pump room', ar: 'السحب وغرفة المضخات' },
        p: {
          en: 'Positive suction (flooded) from a tank is preferred. Suction pressure must not fall below −3 psi (−0.2 bar) at 150% flow when taking from a ground-level tank. Suction pipe velocity ≤ 15 ft/s (4.6 m/s) at 150% flow; an OS&Y gate valve is the only valve allowed in the suction (no butterfly valve within 50 ft); eccentric reducer with flat side up; no elbow in a horizontal plane within 10 pipe diameters of the suction flange.',
          ar: 'يُفضَّل السحب الموجب (المغمور) من خزان. ويجب ألا يقل ضغط السحب عن −3 رطل/بوصة² (−0.2 بار) عند تدفق 150% عند السحب من خزان على مستوى الأرض. وتكون سرعة المياه في أنبوب السحب ≤ 15 قدم/ث (4.6 م/ث) عند 150%؛ وصمام البوابة ذو العمود الظاهر (OS&Y) هو الصمام الوحيد المسموح في خط السحب (لا صمام فراشة ضمن 50 قدماً)؛ ومخفِّض لامركزي بالجانب المسطح للأعلى؛ ولا يوجد كوع في مستوى أفقي ضمن 10 أقطار من شفة السحب.'
        },
        bullets: [
          { en: 'Room: fire-rated separation (2 h, or 1 h in fully sprinklered low-rise), heated ≥ 4.4 °C (21 °C for diesel without engine heater), ventilated for diesel combustion/cooling air, floor drains, emergency lighting.', ar: 'الغرفة: فصل مقاوم للحريق (ساعتان، أو ساعة في المباني المنخفضة المرشوشة بالكامل)، وتدفئة ≥ 4.4 °م (21 °م للديزل دون سخان محرك)، وتهوية لهواء احتراق وتبريد الديزل، ومصارف أرضية، وإنارة طوارئ.' },
          { en: 'Diesel fuel tank: 1 gal per hp (5.07 L/kW) plus 5% expansion and 5% sump volume, enough for 8 h running.', ar: 'خزان وقود الديزل: 1 جالون لكل حصان (5.07 لتر/كيلوواط) مع 5% للتمدد و5% للترسبات، بما يكفي لتشغيل 8 ساعات.' },
          { en: 'Jockey pump: sized to make up allowable leakage within ~10 min (often ~1% of main pump rated flow), and with a lower capacity than any fire pump.', ar: 'مضخة الجوكي: تُحسب لتعويض التسرب المسموح خلال نحو 10 دقائق (غالباً نحو 1% من التدفق المقنّن للمضخة الرئيسية)، وبسعة أقل من أي مضخة حريق.' }
        ]
      },
      {
        h: { en: 'Testing (NFPA 25)', ar: 'الاختبارات (NFPA 25)' },
        p: {
          en: 'Regular no-flow (churn) runs prove the pump starts and runs; the annual flow test proves the curve.',
          ar: 'يثبت التشغيل الدوري دون تدفق (عند الإغلاق) أن المضخة تبدأ وتعمل، ويثبت اختبار التدفق السنوي منحنى الأداء.'
        },
        bullets: [
          { en: 'Diesel pumps: weekly no-flow run, minimum 30 min.', ar: 'مضخات الديزل: تشغيل أسبوعي دون تدفق لمدة 30 دقيقة على الأقل.' },
          { en: 'Electric pumps: no-flow run for 10 min, weekly traditionally; NFPA 25 allows monthly for most electric pumps (weekly still required e.g. for high-rise pumps with limited service).', ar: 'المضخات الكهربائية: تشغيل دون تدفق لمدة 10 دقائق، أسبوعياً تقليدياً؛ ويسمح NFPA 25 بالتشغيل الشهري لمعظم المضخات الكهربائية (ويظل الأسبوعي مطلوباً في حالات مثل مضخات المباني العالية).' },
          { en: 'Annual: full flow test at churn, 100% and 150% of rated flow through the test header or flow meter; results must be within 95% of the original acceptance curve.', ar: 'سنوياً: اختبار تدفق كامل عند الإغلاق و100% و150% من التدفق المقنّن عبر رأس الاختبار أو مقياس التدفق؛ ويجب أن تكون النتائج ضمن 95% من منحنى القبول الأصلي.' }
        ]
      }
    ],
    refs: ['NFPA 20 (2022) §4.8 – Standard pump sizes', 'NFPA 20 (2022) §6.2 – Horizontal pump performance (140%/65%)', 'NFPA 20 (2022) §4.14 – Suction pipe and fittings', 'NFPA 20 (2022) Annex A.14.2.7 – Pressure setpoints', 'NFPA 25 (2023) Ch. 8 – Fire pumps']
  },

  // ---------------------------------------------------------------- 8
  {
    id: 'standpipes',
    icon: '🧯',
    title: { en: 'Standpipes and Hose Systems (NFPA 14)', ar: 'أنظمة الأنابيب القائمة والخراطيم (NFPA 14)' },
    summary: {
      en: 'Standpipe classes, outlet sizes, residual pressures, flow rates, pressure limits, zoning of tall buildings and hose reels.',
      ar: 'فئات الأنابيب القائمة، وأقطار المخارج، والضغوط المتبقية، ومعدلات التدفق، وحدود الضغط، وتقسيم المباني العالية إلى مناطق، وبكرات الخراطيم.'
    },
    sections: [
      {
        h: { en: 'Standpipe classes', ar: 'فئات الأنابيب القائمة' },
        p: {
          en: 'A standpipe is a vertical pipe with hose outlets on each floor, usually located in the protected exit stair so fire fighters can attack from a safe position.',
          ar: 'الأنبوب القائم أنبوب رأسي به مخارج خراطيم في كل طابق، ويُوضع عادةً داخل درج الهروب المحمي ليتمكن رجال الإطفاء من الهجوم من موقع آمن.'
        },
        bullets: [
          { en: 'Class I: 2½" (65 mm) hose connections for fire department use.', ar: 'الفئة I: وصلات خراطيم 2½ بوصة (65 مم) لاستخدام الدفاع المدني.' },
          { en: 'Class II: 1½" (40 mm) hose stations for trained occupants / first aid fire fighting.', ar: 'الفئة II: محطات خراطيم 1½ بوصة (40 مم) للشاغلين المدرَّبين / المكافحة الأولية.' },
          { en: 'Class III: both 2½" and 1½" outlets.', ar: 'الفئة III: مخارج 2½ بوصة و1½ بوصة معاً.' },
          { en: 'Types: automatic-wet (most common, supplied by pumps), automatic-dry, semiautomatic-dry, manual-dry and manual-wet.', ar: 'الأنواع: رطب تلقائي (الأكثر شيوعاً، يُغذّى بالمضخات)، وجاف تلقائي، وجاف شبه تلقائي، وجاف يدوي، ورطب يدوي.' }
        ]
      },
      {
        h: { en: 'Pressure and flow requirements', ar: 'اشتراطات الضغط والتدفق' },
        p: {
          en: 'Hydraulic design is based on the most remote standpipe and outlets.',
          ar: 'يعتمد التصميم الهيدروليكي على الأنبوب القائم والمخارج الأبعد.'
        },
        bullets: [
          { en: 'Class I/III: 100 psi (6.9 bar) residual at the outlet of the most remote 2½" (65 mm) hose connection.', ar: 'الفئة I/III: ضغط متبقٍّ 100 رطل/بوصة² (6.9 بار) عند مخرج أبعد وصلة خرطوم 2½ بوصة (65 مم).' },
          { en: 'Class II: 65 psi (4.5 bar) at the most remote 1½" (40 mm) outlet, flow 100 gpm (380 L/min).', ar: 'الفئة II: 65 رطل/بوصة² (4.5 بار) عند أبعد مخرج 1½ بوصة (40 مم)، بتدفق 100 جالون/دقيقة (380 لتر/دقيقة).' },
          { en: 'Class I/III flow: 500 gpm (1893 L/min) for the first standpipe + 250 gpm (946 L/min) for each additional standpipe, total max 1000 gpm (3785 L/min) in fully sprinklered buildings or 1250 gpm (4731 L/min) in non-sprinklered buildings.', ar: 'تدفق الفئة I/III: 500 جالون/دقيقة (1893 لتر/دقيقة) للأنبوب القائم الأول + 250 جالون/دقيقة (946 لتر/دقيقة) لكل أنبوب إضافي، بحد أقصى إجمالي 1000 جالون/دقيقة (3785 لتر/دقيقة) في المباني المرشوشة بالكامل أو 1250 جالون/دقيقة (4731 لتر/دقيقة) في غير المرشوشة.' },
          { en: 'Minimum duration: 30 min (local codes may require more).', ar: 'المدة الدنيا: 30 دقيقة (وقد تشترط الأكواد المحلية مدة أطول).' }
        ]
      },
      {
        h: { en: 'Pressure limits and PRVs', ar: 'حدود الضغط وصمامات تخفيض الضغط' },
        p: {
          en: 'Maximum system pressure is 350 psi (24.1 bar). Where static pressure at a 2½" hose connection exceeds 175 psi (12.1 bar), a listed pressure-regulating device must limit static and residual pressure to 175 psi; for 1½" hose stations residual pressure above 100 psi (6.9 bar) must be reduced. PRVs require periodic flow testing because they are a common failure point.',
          ar: 'أقصى ضغط للنظام 350 رطل/بوصة² (24.1 بار). وحيثما تجاوز الضغط الساكن عند وصلة خرطوم 2½ بوصة قيمة 175 رطل/بوصة² (12.1 بار)، يجب أن يحدّ جهاز تنظيم ضغط معتمد الضغطين الساكن والمتبقي عند 175 رطل/بوصة²؛ وفي محطات خراطيم 1½ بوصة يجب تخفيض الضغط المتبقي الذي يزيد على 100 رطل/بوصة² (6.9 بار). وتحتاج صمامات تخفيض الضغط إلى اختبار تدفق دوري لأنها نقطة فشل شائعة.'
        }
      },
      {
        h: { en: 'High-rise zoning', ar: 'تقسيم المباني العالية إلى مناطق' },
        p: {
          en: 'Because each 10 m of height needs about 1 bar, very tall towers (common in the Gulf) are divided into vertical pressure zones. Options: series (booster) pumps at mechanical floors, break-tanks at intermediate levels, or high-pressure risers with PRV stations. A zone should not exceed the height the fire department connection can supply; NFPA 14 requires each zone above the lowest to have two or more standpipes/means of supply for reliability.',
          ar: 'لأن كل 10 أمتار من الارتفاع تحتاج إلى نحو 1 بار، تُقسَّم الأبراج الشاهقة (الشائعة في الخليج) إلى مناطق ضغط رأسية. ومن الخيارات: مضخات تعزيز على التوالي في الطوابق الميكانيكية، أو خزانات كسر ضغط في المستويات الوسيطة، أو رايزرات عالية الضغط مع محطات صمامات تخفيض الضغط. ويجب ألا تتجاوز المنطقة الارتفاع الذي تستطيع وصلة الدفاع المدني تغذيته، ويشترط NFPA 14 أن يكون لكل منطقة فوق المنطقة الأدنى أنبوبان قائمان أو وسيلتا تغذية على الأقل لضمان الاعتمادية.'
        }
      },
      {
        h: { en: 'Fire department connection and hose reels', ar: 'وصلة الدفاع المدني وبكرات الخراطيم' },
        p: {
          en: 'The fire department connection (FDC, Siamese inlet) has 2½" (65 mm) inlets with check valve, located on the street side within reach of a hydrant (typically ≤ 100 ft / 30 m), clearly signed. Hose reels (EN 671-1 / BS 5306) with 19–25 mm semi-rigid hose, typically 30 m long, are required by most Gulf civil defence codes for occupant first-aid use, placed so every point is within reach of the hose plus a ~6 m jet.',
          ar: 'تحتوي وصلة الدفاع المدني (المدخل الثنائي) على مداخل 2½ بوصة (65 مم) مع صمام عدم رجوع، وتُوضع على جهة الشارع ضمن مدى الحنفية (عادةً ≤ 100 قدم / 30 م) مع لافتة واضحة. أما بكرات الخراطيم (EN 671-1 / BS 5306) ذات الخرطوم شبه الصلب بقطر 19–25 مم وطول 30 م عادةً، فتشترطها معظم أكواد الدفاع المدني في الخليج للاستخدام الأولي من قبل الشاغلين، وتُوزَّع بحيث تصل كل نقطة بطول الخرطوم مع نفثة نحو 6 أمتار.'
        }
      }
    ],
    refs: ['NFPA 14 (2024) §3.3 – Classes of standpipe systems', 'NFPA 14 (2024) §7.8 – Minimum residual pressure', 'NFPA 14 (2024) §7.10 – Flow rates', 'NFPA 14 (2024) §7.2 – Pressure limitations', 'EN 671-1 – Hose reels with semi-rigid hose']
  },

  // ---------------------------------------------------------------- 9
  {
    id: 'detection-alarm',
    icon: '🚨',
    title: { en: 'Fire Detection and Alarm (NFPA 72)', ar: 'كشف وإنذار الحريق (NFPA 72)' },
    summary: {
      en: 'Detector technologies, the fire alarm control panel, cause & effect and the interface with sprinkler and pump systems.',
      ar: 'تقنيات الكواشف، ولوحة التحكم في إنذار الحريق، ومصفوفة السبب والنتيجة، والربط مع أنظمة الرشاشات والمضخات.'
    },
    sections: [
      {
        h: { en: 'Smoke detectors', ar: 'كواشف الدخان' },
        p: {
          en: 'Smoke detection gives the earliest warning in most occupancies. Nominal spacing on smooth ceilings is 30 ft (9.1 m), adjusted for ceiling height, beams and airflow.',
          ar: 'يوفّر كشف الدخان الإنذار الأبكر في معظم الإشغالات. والتباعد الاسمي على الأسقف الملساء 30 قدماً (9.1 م)، ويُعدَّل حسب ارتفاع السقف والكمرات وحركة الهواء.'
        },
        bullets: [
          { en: 'Photoelectric (optical): light scattering; best for smouldering fires with large particles.', ar: 'الكهروضوئي (البصري): يعتمد على تشتت الضوء؛ وهو الأفضل للحرائق الخامدة ذات الجسيمات الكبيرة.' },
          { en: 'Ionisation: small particles from fast flaming fires; being phased out because of the radioactive source.', ar: 'التأيّني: يكشف الجسيمات الصغيرة من الحرائق اللهبية السريعة؛ ويجري التخلي عنه بسبب المصدر المشع.' },
          { en: 'Beam detectors for atria and warehouses; duct detectors to shut down AHUs.', ar: 'كواشف الشعاع للأفنية الداخلية والمستودعات، وكواشف مجاري الهواء لإيقاف وحدات مناولة الهواء.' },
          { en: 'Aspirating (VESDA): pipes draw air samples to a very sensitive laser chamber; used in data centres, clean rooms, heritage buildings.', ar: 'الكواشف الشفّاطة (VESDA): تسحب الأنابيب عينات الهواء إلى حجرة ليزر عالية الحساسية؛ وتُستخدم في مراكز البيانات والغرف النظيفة والمباني التراثية.' }
        ]
      },
      {
        h: { en: 'Heat, flame and manual devices', ar: 'كواشف الحرارة واللهب والأجهزة اليدوية' },
        p: {
          en: 'Heat detectors are used where smoke detectors would false alarm (kitchens, car parks, dusty areas).',
          ar: 'تُستخدم كواشف الحرارة حيث تسبّب كواشف الدخان إنذارات كاذبة (المطابخ، ومواقف السيارات، والمناطق المغبرة).'
        },
        bullets: [
          { en: 'Fixed-temperature: alarms at a set point (e.g., 57 °C).', ar: 'ثابت الحرارة: يعطي إنذاراً عند درجة محددة (مثل 57 °م).' },
          { en: 'Rate-of-rise: alarms when temperature rises faster than about 8.3 °C/min (15 °F/min); often combined with fixed temperature.', ar: 'معدل الارتفاع: يعطي إنذاراً عندما ترتفع الحرارة أسرع من نحو 8.3 °م/دقيقة (15 °ف/دقيقة)؛ وغالباً يُدمج مع الحرارة الثابتة.' },
          { en: 'Flame detectors (UV, IR, UV/IR, multi-IR) for fuel areas, hangars and turbine enclosures.', ar: 'كواشف اللهب (فوق البنفسجية، وتحت الحمراء، والمدمجة، ومتعددة الأشعة تحت الحمراء) لمناطق الوقود والحظائر وحاويات التوربينات.' },
          { en: 'Manual call points (pull stations) at exits, within 5 ft (1.5 m) of each exit door, max 200 ft (61 m) travel.', ar: 'نقاط النداء اليدوية عند المخارج، ضمن 5 أقدام (1.5 م) من كل باب مخرج، وبمسافة انتقال قصوى 200 قدم (61 م).' }
        ]
      },
      {
        h: { en: 'Control panel and notification', ar: 'لوحة التحكم والتنبيه' },
        p: {
          en: 'The fire alarm control panel (FACP) supervises all circuits, distinguishes alarm, supervisory and trouble signals, and has 24 h standby batteries plus 5 min (or 15 min for voice) of alarm. Addressable systems identify each device. Notification appliances (horns, strobes, voice evacuation) must reach 15 dB above average ambient sound.',
          ar: 'تراقب لوحة التحكم في إنذار الحريق (FACP) جميع الدوائر، وتميّز بين إشارات الإنذار والإشراف والعطل، ولها بطاريات احتياطية لمدة 24 ساعة إضافة إلى 5 دقائق من الإنذار (أو 15 دقيقة للإنذار الصوتي). وتحدد الأنظمة العنونية كل جهاز على حدة. ويجب أن تتجاوز أجهزة التنبيه (الصفارات والومضات والإخلاء الصوتي) متوسط الضجيج المحيط بمقدار 15 ديسيبل.'
        },
        bullets: [
          { en: 'Cross-zoning (coincidence): two independent detectors/zones must operate before releasing a gas or pre-action system, reducing false discharge.', ar: 'التقاطع بين المناطق (التطابق): يجب أن يعمل كاشفان أو منطقتان مستقلتان قبل إطلاق نظام الغاز أو النظام سابق التشغيل، مما يقلل الإطلاق الخاطئ.' }
        ]
      },
      {
        h: { en: 'Interface with water-based systems', ar: 'الربط مع الأنظمة المائية' },
        p: {
          en: 'The alarm system monitors the sprinkler and pump equipment so faults are known before a fire.',
          ar: 'يراقب نظام الإنذار معدات الرشاشات والمضخات بحيث تُعرف الأعطال قبل وقوع الحريق.'
        },
        bullets: [
          { en: 'Water flow switch / alarm valve pressure switch: ALARM signal (retard ≤ 90 s to avoid surges).', ar: 'مفتاح تدفق المياه / مفتاح ضغط صمام الإنذار: إشارة إنذار (تأخير ≤ 90 ثانية لتفادي موجات الضغط).' },
          { en: 'Valve tamper (supervisory) switch: SUPERVISORY signal within two revolutions of the handwheel or 1/5 of travel.', ar: 'مفتاح العبث بالصمام (الإشرافي): إشارة إشرافية خلال دورتين من عجلة التشغيل أو خُمس مشوار الصمام.' },
          { en: 'Fire pump: pump running, power failure / phase reversal, controller trouble, diesel fail-to-start, low fuel; low tank level and low room temperature.', ar: 'مضخة الحريق: تشغيل المضخة، وانقطاع الكهرباء / انعكاس الأطوار، وعطل لوحة التحكم، وفشل تشغيل الديزل، وانخفاض الوقود؛ وانخفاض منسوب الخزان وانخفاض حرارة الغرفة.' }
        ]
      },
      {
        h: { en: 'Cause & effect matrix', ar: 'مصفوفة السبب والنتيجة' },
        p: {
          en: 'A cause & effect matrix lists every input (detector zone, flow switch, call point) against every output (sounders, AHU shutdown, smoke fans, lift recall, door release, gas release, BMS signal). It is the key commissioning document and is tested point-by-point during acceptance.',
          ar: 'تسرد مصفوفة السبب والنتيجة كل مدخل (منطقة كاشف، مفتاح تدفق، نقطة نداء) مقابل كل مخرج (الصفارات، وإيقاف وحدات مناولة الهواء، ومراوح الدخان، واستدعاء المصاعد، وتحرير الأبواب، وإطلاق الغاز، وإشارة نظام إدارة المبنى). وهي وثيقة التشغيل التجريبي الأساسية وتُختبر نقطة بنقطة أثناء الاستلام.'
        }
      }
    ],
    refs: ['NFPA 72 (2022) Ch. 17 – Initiating devices', 'NFPA 72 (2022) Ch. 18 – Notification appliances', 'NFPA 72 (2022) Ch. 10 & 23 – Fundamentals, protected premises systems', 'NFPA 72 (2022) §17.13 – Sprinkler waterflow and supervisory devices']
  },

  // ---------------------------------------------------------------- 10
  {
    id: 'clean-agent',
    icon: '🌫️',
    title: { en: 'Clean Agent Systems (FM-200 / NFPA 2001)', ar: 'أنظمة الإطفاء بالغاز النظيف (FM-200 / NFPA 2001)' },
    summary: {
      en: 'FM-200 (HFC-227ea) total flooding design: concentration, specific volume, agent quantity, discharge, hold time and room integrity, with a full worked example.',
      ar: 'تصميم الغمر الكلي بغاز FM-200 (HFC-227ea): التركيز، والحجم النوعي، وكمية الغاز، والتصريف، وزمن الاحتفاظ، وإحكام الغرفة، مع مثال محلول كامل.'
    },
    sections: [
      {
        h: { en: 'Why clean agents?', ar: 'لماذا الغازات النظيفة؟' },
        p: {
          en: 'Clean agents are electrically non-conductive and leave no residue, so they protect server rooms, telecom, control rooms, archives and museums where water would cause more damage than the fire. They are total flooding systems: the room is filled to a uniform design concentration.',
          ar: 'الغازات النظيفة غير موصلة للكهرباء ولا تترك أي بقايا، لذا تحمي غرف الخوادم والاتصالات وغرف التحكم والأرشيف والمتاحف حيث يسبب الماء ضرراً أكبر من الحريق. وهي أنظمة غمر كلي: تُملأ الغرفة بتركيز تصميمي منتظم.'
        }
      },
      {
        h: { en: 'Design concentration and safety', ar: 'التركيز التصميمي والسلامة' },
        p: {
          en: 'Minimum design concentration = extinguishing concentration × safety factor (1.2 for Class A and C, 1.3 for Class B). For FM-200 a typical Class A design is about 7% (listed range ≈ 6.25–7%), Class B (heptane) ≈ 8.7%. For normally occupied spaces the concentration should not exceed the NOAEL of 9% (LOAEL 10.5%).',
          ar: 'التركيز التصميمي الأدنى = تركيز الإطفاء × معامل الأمان (1.2 للفئتين A وC، و1.3 للفئة B). ولغاز FM-200 يكون التصميم النموذجي للفئة A نحو 7% (المدى المعتمد نحو 6.25–7%)، وللفئة B (الهيبتان) نحو 8.7%. وفي الأماكن المشغولة عادةً يجب ألا يتجاوز التركيز مستوى NOAEL البالغ 9% (ومستوى LOAEL 10.5%).'
        }
      },
      {
        h: { en: 'Agent quantity formula', ar: 'معادلة كمية الغاز' },
        p: {
          en: 'NFPA 2001 flooding factor equation for halocarbon agents (no leakage allowance; the room must be tight):',
          ar: 'معادلة معامل الغمر في NFPA 2001 لعوامل الهالوكربون (دون احتساب التسرب؛ لذا يجب أن تكون الغرفة محكمة):'
        },
        formula: 'W = (V / S) · (C / (100 − C))\nW = agent mass [kg]; V = net protected volume [m³]\nC = design concentration [% by volume]\nS = specific vapour volume [m³/kg] = 0.1269 + 0.0005131·T  (T in °C, HFC-227ea)',
        bullets: [
          { en: 'Use the minimum expected room temperature (lower T → smaller S → more agent).', ar: 'استخدم أدنى حرارة متوقعة للغرفة (T أقل ← S أصغر ← كمية غاز أكبر).' },
          { en: 'Correct for altitude above ~1000 m (lower atmospheric pressure → less agent needed).', ar: 'صحّح للارتفاع فوق نحو 1000 م (الضغط الجوي الأقل ← كمية غاز أقل).' },
          { en: 'Include raised floor and ceiling voids if they are part of the same enclosure.', ar: 'أدرج فراغات الأرضية المرفوعة والسقف المستعار إذا كانت جزءاً من الحيز نفسه.' }
        ]
      },
      {
        h: { en: 'Worked example: server room', ar: 'مثال محلول: غرفة خوادم' },
        p: {
          en: 'Server room 10 m × 8 m × 3 m, minimum temperature 20 °C, Class A design concentration 7%.',
          ar: 'غرفة خوادم بأبعاد 10 م × 8 م × 3 م، وأدنى حرارة 20 °م، وتركيز تصميمي للفئة A بنسبة 7%.'
        },
        formula: 'V = 10 × 8 × 3 = 240 m³\nS = 0.1269 + 0.0005131 × 20 = 0.13716 m³/kg\nV/S = 240 / 0.13716 = 1749.8 kg\nC/(100 − C) = 7/93 = 0.07527\nW = 1749.8 × 0.07527 ≈ 131.7 kg of HFC-227ea\n→ select cylinder(s) with fill density ≤ 1.15 kg/L (e.g., one 147 L cylinder or two smaller)',
        bullets: [
          { en: 'Check: 7% < NOAEL 9%, so safe for an occupied room.', ar: 'التحقق: 7% أقل من NOAEL البالغ 9%، لذا فهو آمن لغرفة مشغولة.' }
        ]
      },
      {
        h: { en: 'Discharge, hold time and room integrity', ar: 'التصريف وزمن الاحتفاظ وإحكام الغرفة' },
        p: {
          en: 'Halocarbon agents must discharge 95% of the design quantity within 10 s to limit decomposition products (HF). The design concentration should be held for at least 10 min (or as required by the AHJ) to allow emergency response and prevent re-ignition. Hold time is verified by a door fan (enclosure integrity) test per NFPA 2001 Annex C. Pressure relief vents are required for lightweight enclosures.',
          ar: 'يجب أن تُصرِّف عوامل الهالوكربون 95% من الكمية التصميمية خلال 10 ثوانٍ للحد من نواتج التحلل (فلوريد الهيدروجين). ويجب الاحتفاظ بالتركيز التصميمي لمدة 10 دقائق على الأقل (أو حسب متطلبات الجهة المختصة) لإتاحة الاستجابة ومنع إعادة الاشتعال. ويُتحقق من زمن الاحتفاظ باختبار مروحة الباب (إحكام الحيز) وفق الملحق C من NFPA 2001. وتلزم فتحات تنفيس الضغط للحيزات خفيفة الإنشاء.'
        },
        bullets: [
          { en: 'Sequence: 1st detector → alarm; 2nd detector (cross-zoned) → pre-discharge alarm, HVAC shutdown, dampers close; time delay (typically 30 s) → discharge; "discharged" lamp outside door.', ar: 'التسلسل: الكاشف الأول ← إنذار؛ الكاشف الثاني (بالتقاطع) ← إنذار ما قبل الإطلاق وإيقاف التكييف وإغلاق المخمدات؛ تأخير زمني (عادةً 30 ثانية) ← الإطلاق؛ مصباح «تم الإطلاق» خارج الباب.' },
          { en: 'Abort switch (hold-to-abort) and manual release station at the exit; lock-off for maintenance.', ar: 'مفتاح الإيقاف المؤقت (بالضغط المستمر) ومحطة الإطلاق اليدوي عند المخرج؛ وقفل للعزل أثناء الصيانة.' }
        ]
      },
      {
        h: { en: 'Other agents', ar: 'عوامل أخرى' },
        p: {
          en: 'Novec 1230 (FK-5-1-12): a fluoroketone liquid stored in cylinders, Class A design ≈ 4.5–5.3%, NOAEL 10% (large safety margin), very low global warming potential, S = 0.0664 + 0.000274·T. Inert gases (IG-541 Inergen, IG-55, IG-01 argon, IG-100 nitrogen) reduce oxygen to about 12–14% at design concentrations of roughly 35–50%, discharge in 60 s (up to 120 s for Class A/C), need many high-pressure cylinders and larger vent areas, but have zero ozone depletion and GWP. HFCs such as FM-200 face phase-down under the Kigali Amendment.',
          ar: 'نوفك 1230 (FK-5-1-12): سائل من الفلوروكيتونات يُخزَّن في أسطوانات، وتركيزه التصميمي للفئة A نحو 4.5–5.3%، وNOAEL له 10% (هامش أمان كبير)، وله احترار عالمي منخفض جداً، و S = 0.0664 + 0.000274·T. أما الغازات الخاملة (IG-541 إنرجن، وIG-55، وIG-01 الأرغون، وIG-100 النيتروجين) فتخفض الأكسجين إلى نحو 12–14% بتركيزات تصميمية تقارب 35–50%، وتُصرَّف خلال 60 ثانية (حتى 120 ثانية للفئتين A وC)، وتحتاج إلى أسطوانات كثيرة عالية الضغط وفتحات تنفيس أكبر، لكن تأثيرها على الأوزون والاحترار العالمي صفري. وتخضع مركبات HFC مثل FM-200 للتخفيض التدريجي بموجب تعديل كيغالي.'
        }
      }
    ],
    refs: ['NFPA 2001 (2022) §5.4 – Design concentration and safety factors', 'NFPA 2001 (2022) §5.5 – Total flooding quantity (Eq. 5.5.1)', 'NFPA 2001 (2022) §1.5 – Safe use / NOAEL', 'NFPA 2001 (2022) §5.7.1 – Discharge time', 'NFPA 2001 (2022) Annex C – Enclosure integrity']
  },

  // ---------------------------------------------------------------- 11
  {
    id: 'foam-and-special',
    icon: '🛢️',
    title: { en: 'Foam, Special Hazards and ITM', ar: 'الرغوة والمخاطر الخاصة والفحص والاختبار والصيانة' },
    summary: {
      en: 'Foam concentrates and storage tank protection (NFPA 11), deluge, monitors, water mist, hangars, and inspection/testing/maintenance per NFPA 25.',
      ar: 'مركزات الرغوة وحماية خزانات التخزين (NFPA 11)، والغمر، والمدافع المائية، والرذاذ المائي، والحظائر، والفحص والاختبار والصيانة وفق NFPA 25.'
    },
    sections: [
      {
        h: { en: 'Foam concentrates and proportioning', ar: 'مركزات الرغوة والخلط' },
        p: {
          en: 'Foam solution = water + concentrate at 1%, 3% or 6%. The foam blanket smothers the fuel, suppresses vapours and cools. Proportioning uses bladder tanks, inline inductors, balanced-pressure or around-the-pump proportioners.',
          ar: 'محلول الرغوة = ماء + مركّز بنسبة 1% أو 3% أو 6%. ويخنق غطاء الرغوة الوقود ويكبت الأبخرة ويبرّد. ويتم الخلط بخزانات المثانة أو الحاقنات الخطية أو خالطات الضغط المتوازن أو الخالطات حول المضخة.'
        },
        bullets: [
          { en: 'AFFF: aqueous film-forming foam, fast knockdown of hydrocarbon fires (PFAS concerns are driving a move to fluorine-free SFFF).', ar: 'AFFF: رغوة مكوّنة للغشاء المائي، سريعة الإخماد لحرائق الهيدروكربونات (وتدفع مخاوف مركبات PFAS نحو الرغوة الخالية من الفلور SFFF).' },
          { en: 'AR-AFFF: alcohol-resistant, required for polar solvents (alcohols, ketones), often 3%×3% or 3%×6%.', ar: 'AR-AFFF: مقاومة للكحول، مطلوبة للمذيبات القطبية (الكحولات والكيتونات)، وغالباً بنسبة 3%×3% أو 3%×6%.' },
          { en: 'FFFP: film-forming fluoroprotein, better burnback resistance.', ar: 'FFFP: بروتين مفلور مكوّن للغشاء، بمقاومة أفضل لإعادة الاشتعال.' },
          { en: 'Expansion ratio: low < 20:1 (tanks, bunds), medium 20–200:1, high 200–1000:1 (hangars, warehouses, total flooding).', ar: 'نسبة التمدد: منخفضة < 20:1 (الخزانات والأحواض)، ومتوسطة 20–200:1، وعالية 200–1000:1 (الحظائر والمستودعات والغمر الكلي).' }
        ]
      },
      {
        h: { en: 'Storage tank protection (NFPA 11)', ar: 'حماية خزانات التخزين (NFPA 11)' },
        p: {
          en: 'Fixed-roof (cone roof) tanks use Type II foam discharge outlets (foam chambers) around the shell that deliver foam gently onto the liquid surface. Open-top/external floating-roof tanks protect the rim seal area with foam dams.',
          ar: 'تستخدم الخزانات ذات السقف الثابت (المخروطي) مخارج تصريف رغوة من النوع II (غرف الرغوة) حول الجدار، تُوصل الرغوة بلطف إلى سطح السائل. أما الخزانات ذات السقف العائم الخارجي فتحمي منطقة الإحكام الحلقي بحواجز الرغوة.'
        },
        formula: 'Fixed roof, Type II outlets: 4.1 L/min·m² (0.10 gpm/ft²) of liquid surface\n  Hydrocarbon, flash point 37.8–93.3 °C: 30 min\n  Flash point < 37.8 °C, or crude oil: 55 min\nFloating roof rim seal: 12.2 L/min·m² (0.30 gpm/ft²) of seal area, 20 min\nExample: 30 m dia. fixed-roof tank, gasoline\n  A = π·15² = 706.9 m² → 706.9 × 4.1 = 2898 L/min solution\n  3% concentrate × 55 min → 0.03 × 2898 × 55 ≈ 4782 L',
        bullets: [
          { en: 'Add supplementary hose streams and cooling water for exposed adjacent tanks.', ar: 'أضف خطوط خراطيم تكميلية ومياه تبريد للخزانات المجاورة المعرّضة.' }
        ]
      },
      {
        h: { en: 'Deluge, monitors and water mist', ar: 'الغمر والمدافع المائية والرذاذ المائي' },
        p: {
          en: 'Water spray / deluge (NFPA 15) protects transformers (≈ 10.2 L/min·m², 0.25 gpm/ft², over all surfaces), vessels (exposure cooling ≈ 10.2 L/min·m²) and conveyors, activated by heat or flame detection or pilot sprinkler lines. Monitors (fixed or oscillating, 1900–7600 L/min) cover process areas, jetties and tank farms. Water mist (NFPA 750) uses very fine droplets (Dv0.99 < 1000 µm) at low, intermediate or high pressure to cool and displace oxygen with far less water, used for machinery spaces, turbines and heritage buildings; systems must be listed for the specific hazard.',
          ar: 'يحمي الرش المائي / الغمر (NFPA 15) المحولات (نحو 10.2 لتر/دقيقة·م²، أي 0.25 جالون/دقيقة/قدم²، على جميع الأسطح)، والأوعية (تبريد التعرض نحو 10.2 لتر/دقيقة·م²) والسيور الناقلة، ويُشغَّل بكواشف الحرارة أو اللهب أو خطوط الرشاشات التجريبية. وتغطي المدافع المائية (الثابتة أو المتذبذبة، 1900–7600 لتر/دقيقة) مناطق المعالجة والأرصفة البحرية ومزارع الخزانات. أما الرذاذ المائي (NFPA 750) فيستخدم قطرات دقيقة جداً (Dv0.99 < 1000 ميكرون) بضغط منخفض أو متوسط أو عالٍ للتبريد وإزاحة الأكسجين بكمية مياه أقل بكثير، ويُستخدم لغرف الآلات والتوربينات والمباني التراثية، ويجب أن يكون النظام معتمداً للخطر المحدد.'
        }
      },
      {
        h: { en: 'Aircraft hangars (NFPA 409)', ar: 'حظائر الطائرات (NFPA 409)' },
        p: {
          en: 'Hangars are classed Group I–IV by door height, area and construction. Group I hangars typically need foam-water deluge over the whole floor (e.g., 0.16 gpm/ft² ≈ 6.5 L/min·m² with AFFF) or closed-head foam-water sprinklers plus a supplementary low-level foam system (monitors or high-expansion foam) to cover the area under the wings, with a design duration of 10 min for foam.',
          ar: 'تُصنَّف الحظائر في المجموعات من I إلى IV حسب ارتفاع الباب والمساحة ونوع الإنشاء. وتحتاج حظائر المجموعة I عادةً إلى غمر بالرغوة والماء فوق كامل الأرضية (مثلاً 0.16 جالون/دقيقة/قدم² ≈ 6.5 لتر/دقيقة·م² مع AFFF) أو رشاشات رغوة-ماء مغلقة مع نظام رغوة تكميلي منخفض المستوى (مدافع أو رغوة عالية التمدد) لتغطية المنطقة أسفل الأجنحة، بمدة تصميم 10 دقائق للرغوة.'
        }
      },
      {
        h: { en: 'Inspection, testing and maintenance (NFPA 25)', ar: 'الفحص والاختبار والصيانة (NFPA 25)' },
        p: {
          en: 'A system is only as good as its maintenance. NFPA 25 sets minimum frequencies; key items:',
          ar: 'لا تكون كفاءة النظام إلا بقدر صيانته. ويحدد NFPA 25 الحد الأدنى للتكرار، ومن أهم البنود:'
        },
        bullets: [
          { en: 'Weekly: sealed control valves (visual), diesel fire pump run 30 min, dry/pre-action gauges and heat in valve rooms during cold weather.', ar: 'أسبوعياً: صمامات التحكم المختومة (بصرياً)، وتشغيل مضخة الديزل 30 دقيقة، ومقاييس الأنظمة الجافة وسابقة التشغيل وحرارة غرف الصمامات في الطقس البارد.' },
          { en: 'Monthly: locked/supervised control valves, electric fire pump no-flow run, wet system gauges, alarm valve exterior condition.', ar: 'شهرياً: صمامات التحكم المقفلة / المراقَبة، وتشغيل المضخة الكهربائية دون تدفق، ومقاييس الأنظمة الرطبة، والحالة الخارجية لصمام الإنذار.' },
          { en: 'Quarterly: waterflow alarm test (pressure switch type, via inspector test), supervisory switches, hydraulic nameplate, FDC inspection.', ar: 'ربع سنوي: اختبار إنذار تدفق المياه (من نوع مفتاح الضغط، عبر وصلة اختبار المفتش)، والمفاتيح الإشرافية، ولوحة البيانات الهيدروليكية، وفحص وصلة الدفاع المدني.' },
          { en: 'Annual: fire pump flow test, main drain test, sprinklers inspected from floor, dry-pipe valve trip test (partial), antifreeze check, vane flow switches (semi-annual).', ar: 'سنوياً: اختبار تدفق مضخة الحريق، واختبار الصرف الرئيسي، وفحص الرشاشات من مستوى الأرض، واختبار فتح صمام الأنبوب الجاف (جزئياً)، وفحص مانع التجمد، ومفاتيح التدفق الريشية (نصف سنوي).' },
          { en: '5-year: internal pipe inspection / obstruction assessment, gauge replacement or calibration, standpipe hydrostatic test for dry systems, PRV full-flow test; sprinklers: sample-test standard sprinklers at 50 years, fast-response at 20 years.', ar: 'كل 5 سنوات: الفحص الداخلي للأنابيب / تقييم الانسداد، واستبدال المقاييس أو معايرتها، والاختبار الهيدروستاتيكي للأنابيب القائمة الجافة، واختبار التدفق الكامل لصمامات تخفيض الضغط؛ والرشاشات: اختبار عينات من الرشاشات القياسية عند 50 عاماً، وسريعة الاستجابة عند 20 عاماً.' }
        ]
      }
    ],
    refs: ['NFPA 11 (2021) §5.2.5 – Fixed-roof tanks, Table 5.2.5.2.2', 'NFPA 11 (2021) §5.3 – Open-top floating roof tanks', 'NFPA 15 (2022) – Water spray fixed systems', 'NFPA 409 (2022) – Aircraft hangars', 'NFPA 750 (2023) – Water mist', 'NFPA 25 (2023) Tables 5.1.1.2, 8.1.1.2, 13.1.1.2']
  }
];

export default LESSONS;
