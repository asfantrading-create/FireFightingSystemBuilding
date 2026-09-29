// Facility library. Site names, coordinates and building facts are public information;
// the fire-protection systems are REFERENCE DESIGNS prepared for teaching with NFPA methods
// (they are not the as-built systems of these sites).

const L = (en, ar) => ({ en, ar });

export const FACILITIES = [
  {
    id: 'HIGH_RISE', color: '#ef4444', scene: 'highrise',
    type: L('High-Rise Tower', 'برج شاهق'),
    name: L('Burj Khalifa – High-Rise Fire Protection', 'برج خليفة – منظومة الحماية من الحريق لبرج شاهق'),
    site: L('UAE (Dubai, Downtown)', 'الإمارات (دبي، وسط المدينة)'),
    lat: 25.1972, lon: 55.2744,
    blurb: L('828 m · 163 floors · wet sprinklers LH/OH1 · Class I standpipes · 8 pressure zones · 2 × fire pumps + jockey',
      '828 م · 163 طابقاً · رشاشات رطبة LH/OH1 · أنابيب قائمة Class I · 8 مناطق ضغط · مضختان + مضخة جوكي'),
    date: '15 Jan', time: '14:00', ambient: 24, humidity: 45, wind: 3.6, sun: 42,
    facts: [
      [L('Height', 'الارتفاع'), '828 m'], [L('Floors', 'الطوابق'), '163 + mechanical'],
      [L('Completed', 'سنة الإنجاز'), '2010'], [L('Occupancy', 'الإشغال'), L('Offices, hotel, residences', 'مكاتب، فندق، شقق سكنية')],
    ],
    system: {
      kind: 'sprinkler', hazard: 'LH', K: 80.6, spacing: 4.0, RTI: 50, Tact: 68, response: 'QR',
      mainDia: 150, mainLength: 140, elevation: 88, prv: 5.0, suctionP: 0.3,
      standpipe: { count: 3, dia: 150, zoneHeight: 100, zones: 8 },
    },
    scenarios: [
      {
        id: 'office', name: L('Office workstation fire – Level 21', 'حريق محطة عمل مكتبية – الطابق 21'),
        compartment: { w: 24, d: 16, h: 3.0 }, fire: { x: 13.0, z: 7.0, growth: 'fast', qMax: 3000, baseH: 0.75 },
        detector: 'smoke',
      },
      {
        id: 'carpark', name: L('Car fire – podium car park, level P2', 'حريق سيارة – موقف المنصة، المستوى P2'),
        override: { hazard: 'OH1', spacing: 3.4, elevation: 8, prv: null },
        compartment: { w: 24, d: 16, h: 3.2 }, fire: { x: 10.2, z: 8.5, growth: 'medium', qMax: 5000, baseH: 0.5 },
        detector: 'heat',
      },
    ],
    components: [
      ['tank', L('Fire water tanks', 'خزانات مياه الحريق'), 'tank'],
      ['pumps', L('Fire pump room (Zone 1)', 'غرفة مضخات الحريق (المنطقة 1)'), 'pump'],
      ['riser', L('Wet risers & standpipes', 'الأنابيب القائمة الرطبة'), 'flow'],
      ['transfer', L('Transfer tanks & booster pumps', 'خزانات النقل ومضخات التعزيز'), 'zones'],
      ['floor', L('Fire floor – sprinklers', 'طابق الحريق – الرشاشات'), 'heads'],
      ['fdc', L('Fire department connection', 'وصلة الدفاع المدني'), 'fdc'],
      ['hydrants', L('Yard hydrants & ring main', 'حنفيات الحريق والحلقة الرئيسية'), 'hose'],
      ['facp', L('Fire command centre (FACP)', 'مركز قيادة الحريق (لوحة الإنذار)'), 'alarm'],
    ],
  },
  {
    id: 'WAREHOUSE', color: '#f59e0b', scene: 'warehouse',
    type: L('ESFR Warehouse', 'مستودع ESFR'),
    name: L('Aqaba Logistics Warehouse – ESFR Rack Storage', 'مستودع لوجستي في العقبة – تخزين رفوف ESFR'),
    site: L('Jordan (Aqaba, logistics zone near the port) – representative facility', 'الأردن (العقبة، المنطقة اللوجستية قرب الميناء) – منشأة تمثيلية'),
    lat: 29.43, lon: 35.00,
    blurb: L('120 × 80 m · 12.2 m ceiling · 10.7 m rack storage · ESFR K-360 pendent · 12-head design',
      '120 × 80 م · سقف 12.2 م · تخزين رفوف 10.7 م · رشاشات ESFR K-360 · تصميم 12 رشاشاً'),
    date: '20 Jul', time: '11:00', ambient: 38, humidity: 30, wind: 5.2, sun: 78,
    facts: [
      [L('Floor area', 'المساحة'), '9,600 m²'], [L('Ceiling height', 'ارتفاع السقف'), '12.2 m (40 ft)'],
      [L('Commodity', 'البضائع'), L('Cartoned unexpanded plastics', 'بلاستيك غير ممدد في كراتين')], [L('Storage', 'التخزين'), L('Double-row racks, 10.7 m', 'رفوف مزدوجة 10.7 م')],
    ],
    system: {
      kind: 'sprinkler', hazard: 'EH2', K: 363, spacing: 3.0, RTI: 28, Tact: 74, response: 'ESFR',
      esfr: { heads: 12, minP: 2.4 }, hose: 946, duration: 60,
      mainDia: 250, mainLength: 260, elevation: 12, suctionP: 0.4,
    },
    scenarios: [
      {
        id: 'rack', name: L('Rack fire – flue space, aisle 4', 'حريق رفوف – الفراغ بين الرفوف، الممر 4'),
        compartment: { w: 30, d: 21, h: 12.2 }, fire: { x: 15.4, z: 10.6, growth: 'ultrafast', qMax: 20000, baseH: 0 },
        detector: 'smoke', detectorSpacing: 12,
      },
      {
        id: 'dock', name: L('Pallet fire – loading dock', 'حريق طبليات – رصيف التحميل'),
        compartment: { w: 30, d: 21, h: 12.2 }, fire: { x: 6.2, z: 4.4, growth: 'fast', qMax: 8000, baseH: 0 },
        detector: 'smoke', detectorSpacing: 12,
      },
    ],
    components: [
      ['tank', L('Fire water tank', 'خزان مياه الحريق'), 'tank'],
      ['pumps', L('Fire pump house', 'مبنى مضخات الحريق'), 'pump'],
      ['riser', L('ESFR riser & alarm valve', 'الرايزر وصمام الإنذار'), 'flow'],
      ['floor', L('ESFR sprinklers – racks', 'رشاشات ESFR – الرفوف'), 'heads'],
      ['hydrants', L('Yard hydrants', 'حنفيات الحريق الخارجية'), 'hose'],
      ['fdc', L('Fire department connection', 'وصلة الدفاع المدني'), 'fdc'],
      ['facp', L('Fire alarm panel', 'لوحة إنذار الحريق'), 'alarm'],
    ],
  },
  {
    id: 'DATA_CENTER', color: '#8b5cf6', scene: 'datacenter',
    type: L('Data Centre – Clean Agent', 'مركز بيانات – غاز نظيف'),
    name: L('Amman Tier III Data Centre – FM-200 Total Flooding', 'مركز بيانات Tier III في عمّان – إغراق كلي FM-200'),
    site: L('Jordan (Amman) – representative facility', 'الأردن (عمّان) – منشأة تمثيلية'),
    lat: 31.95, lon: 35.91,
    blurb: L('Server hall 20 × 15 × 3.5 m · HFC-227ea at 7 % · VESDA + cross-zoned detection · 30 s pre-discharge',
      'قاعة خوادم 20 × 15 × 3.5 م · HFC-227ea بتركيز 7% · VESDA وكشف متقاطع · تأخير 30 ثانية قبل التفريغ'),
    date: '12 Oct', time: '10:00', ambient: 22, humidity: 40, wind: 2.8, sun: 50,
    facts: [
      [L('IT load', 'الحمل التقني'), '1.2 MW'], [L('Racks', 'الخزائن'), '96 × 42U'],
      [L('Agent', 'المادة'), 'HFC-227ea (FM-200)'], [L('Backup', 'الاحتياطي'), L('Double-interlock pre-action', 'رشاشات تمهيدية بقفل مزدوج')],
    ],
    system: { kind: 'cleanAgent', room: { l: 20, w: 15, h: 3.5 }, designTemp: 20, concentration: 7.0, preDischarge: 30 },
    scenarios: [
      {
        id: 'rack', name: L('Server rack electrical fire – row C', 'حريق كهربائي في خزانة خوادم – الصف C'),
        compartment: { w: 20, d: 15, h: 3.5 }, fire: { x: 9, z: 7, growth: 'slow', qMax: 250 },
      },
      {
        id: 'ups', name: L('UPS / battery room fire', 'حريق غرفة UPS والبطاريات'),
        override: { room: { l: 12, w: 8, h: 3.5 }, concentration: 7.9 },
        compartment: { w: 12, d: 8, h: 3.5 }, fire: { x: 5, z: 4, growth: 'medium', qMax: 400 },
      },
    ],
    components: [
      ['cylinders', L('FM-200 cylinder bank', 'مجموعة أسطوانات FM-200'), 'agentMass'],
      ['hall', L('Server hall (protected volume)', 'قاعة الخوادم (الحجم المحمي)'), 'agent'],
      ['nozzles', L('Discharge nozzles', 'فوهات التفريغ'), 'o2'],
      ['vesda', L('VESDA aspirating detection', 'كاشف الشفط VESDA'), 'alarm'],
      ['panel', L('Release control panel', 'لوحة التحكم بالإطلاق'), 'release'],
      ['generators', L('Standby generators', 'مولدات الاحتياط'), 'static'],
    ],
  },
  {
    id: 'TANK_FARM', color: '#10b981', scene: 'tankfarm',
    type: L('Oil Tank Farm – Foam', 'مزرعة خزانات نفط – رغوة'),
    name: L('Aqaba Crude Oil Terminal – Tank Foam Protection', 'محطة النفط الخام في العقبة – حماية الخزانات بالرغوة'),
    site: L('Jordan (Aqaba, south coast) – representative facility', 'الأردن (العقبة، الساحل الجنوبي) – منشأة تمثيلية'),
    lat: 29.37, lon: 34.98,
    blurb: L('4 × 60 m floating-roof + 2 × 30 m fixed-roof tanks · AFFF 3 % · rim-seal pourers · Type II outlets · cooling rings',
      '4 خزانات بسقف عائم قطر 60 م + خزانان بسقف ثابت 30 م · رغوة AFFF 3% · صبابات الحافة · مخارج Type II · حلقات تبريد'),
    date: '08 Aug', time: '15:00', ambient: 40, humidity: 25, wind: 6.5, sun: 55,
    facts: [
      [L('Storage', 'السعة'), '≈ 280,000 m³'], [L('Product', 'المنتج'), L('Crude oil (flash point < 37.8 °C)', 'نفط خام (نقطة وميض < 37.8 °م)')],
      [L('Foam', 'الرغوة'), 'AFFF 3 %'], [L('Bunds', 'الأحواض'), L('110 % of largest tank', '110% من أكبر خزان')],
    ],
    system: {
      kind: 'foam', mode: 'rimSeal', tankD: 60, sealWidth: 0.6, rate: 12.2, duration: 20, pct: 3,
      cooling: 3770, supplementary: 567, suppDuration: 30, waterDuration: 240,
      nozzleK: 51, nozzleP: 5, mainDia: 250, mainLength: 600, elevation: 22, suctionP: 0.6,
    },
    scenarios: [
      {
        id: 'rim', name: L('Rim-seal fire – floating roof tank T-101', 'حريق حافة السقف العائم – الخزان T-101'),
        fire: { growth: 'medium', qMax: 25000 }, detectQ: 400, detectDelay: 20, detector: 'lhd', transit: 45,
        foamTau: 55, suppDelay: 480, postTime: 900,
      },
      {
        id: 'full', name: L('Full-surface fire – fixed roof tank T-201', 'حريق كامل السطح – خزان السقف الثابت T-201'),
        override: { mode: 'fullSurface', tankD: 30, rate: 4.1, duration: 55, cooling: 2827, supplementary: 378, nozzleK: 775, nozzleP: 3.5, elevation: 16 },
        fire: { growth: 'ultrafast', qMax: 900000 }, detectQ: 2000, detectDelay: 60, detector: 'lhd', releaseDelay: 120, transit: 60,
        foamTau: 240, suppDelay: 420, postTime: 900,
      },
    ],
    components: [
      ['tankFire', L('Tank on fire', 'الخزان المشتعل'), 'hrr'],
      ['foamHouse', L('Foam pump house & bladder tank', 'مبنى مضخات الرغوة وخزان الغشاء'), 'pump'],
      ['pourers', L('Foam pourers / Type II outlets', 'صبابات الرغوة / مخارج Type II'), 'foam'],
      ['cooling', L('Cooling rings – adjacent tanks', 'حلقات التبريد – الخزانات المجاورة'), 'cooling'],
      ['waterTank', L('Fire water reservoir', 'خزان مياه الحريق'), 'tank'],
      ['monitors', L('Foam monitors & hose streams', 'مدافع الرغوة وخطوط الخراطيم'), 'hose'],
      ['bund', L('Bund / dike wall', 'جدار الحوض'), 'static'],
    ],
  },
  {
    id: 'HANGAR', color: '#3b82f6', scene: 'hangar',
    type: L('Aircraft Hangar – Deluge', 'حظيرة طائرات – غمر'),
    name: L('Queen Alia International Airport – MRO Hangar', 'مطار الملكة علياء الدولي – حظيرة صيانة الطائرات'),
    site: L('Jordan (Amman, QAIA) – representative facility', 'الأردن (عمّان، مطار الملكة علياء) – منشأة تمثيلية'),
    lat: 31.7226, lon: 35.9932,
    blurb: L('Group I hangar 90 × 70 × 25 m · foam-water deluge 6.5 L/min·m² · UV/IR flame detection · low-level foam monitors',
      'حظيرة من الفئة الأولى 90 × 70 × 25 م · غمر رغوة-ماء 6.5 ل/د·م² · كواشف لهب UV/IR · مدافع رغوة منخفضة'),
    date: '03 Mar', time: '09:00', ambient: 14, humidity: 55, wind: 4.1, sun: 38,
    facts: [
      [L('Hangar type', 'نوع الحظيرة'), 'NFPA 409 Group I'], [L('Aircraft', 'الطائرة'), L('Wide-body (A330 class)', 'عريضة البدن (فئة A330)')],
      [L('Door opening', 'فتحة الباب'), '80 × 20 m'], [L('Foam', 'الرغوة'), 'AFFF 3 %'],
    ],
    system: {
      kind: 'foam', mode: 'deluge', area: 3150, zones: 2, rate: 6.5, duration: 10, waterDuration: 45, pct: 3,
      cooling: 0, supplementary: 3786, suppDuration: 10, nozzleK: 80.6, nozzleP: 1.2,
      mainDia: 300, mainLength: 400, elevation: 25, suctionP: 0.5,
    },
    scenarios: [
      {
        id: 'spill', name: L('Jet-fuel spill fire under wing', 'حريق انسكاب وقود تحت الجناح'),
        fire: { growth: 'ultrafast', qMax: 40000 }, detectQ: 100, detectDelay: 3, detector: 'flame', releaseDelay: 2, transit: 25,
        foamTau: 30, suppDelay: 20, postTime: 600,
      },
    ],
    components: [
      ['aircraft', L('Aircraft & spill fire', 'الطائرة وحريق الانسكاب'), 'hrr'],
      ['deluge', L('Foam-water deluge heads', 'رؤوس الغمر رغوة-ماء'), 'foam'],
      ['valves', L('Deluge valve station', 'محطة صمامات الغمر'), 'valve'],
      ['flame', L('UV/IR flame detectors', 'كواشف اللهب UV/IR'), 'alarm'],
      ['monitors', L('Low-level foam monitors', 'مدافع الرغوة المنخفضة'), 'hose'],
      ['pumps', L('Fire pump house', 'مبنى مضخات الحريق'), 'pump'],
      ['tank', L('Fire water tanks', 'خزانات مياه الحريق'), 'tank'],
    ],
  },
];

export const CITIES = [
  { id: 'amman', name: L('Amman, Jordan', 'عمّان، الأردن'), lat: 31.95, lon: 35.91, ambient: 22, biome: 'hills' },
  { id: 'aqaba', name: L('Aqaba, Jordan', 'العقبة، الأردن'), lat: 29.53, lon: 35.01, ambient: 34, biome: 'desert' },
  { id: 'dubai', name: L('Dubai, UAE', 'دبي، الإمارات'), lat: 25.20, lon: 55.27, ambient: 32, biome: 'city' },
  { id: 'riyadh', name: L('Riyadh, Saudi Arabia', 'الرياض، السعودية'), lat: 24.71, lon: 46.68, ambient: 35, biome: 'desert' },
  { id: 'doha', name: L('Doha, Qatar', 'الدوحة، قطر'), lat: 25.29, lon: 51.53, ambient: 33, biome: 'city' },
  { id: 'cairo', name: L('Cairo, Egypt', 'القاهرة، مصر'), lat: 30.04, lon: 31.24, ambient: 28, biome: 'desert' },
  { id: 'baghdad', name: L('Baghdad, Iraq', 'بغداد، العراق'), lat: 33.32, lon: 44.37, ambient: 30, biome: 'desert' },
  { id: 'kuwait', name: L('Kuwait City, Kuwait', 'مدينة الكويت'), lat: 29.38, lon: 47.99, ambient: 36, biome: 'city' },
];

export const OCCUPANCIES = {
  office: { hazard: 'LH', growth: 'fast', qMax: 3000, spacing: 4.0, name: L('Office', 'مكاتب') },
  hospital: { hazard: 'LH', growth: 'medium', qMax: 2000, spacing: 4.0, name: L('Hospital', 'مستشفى') },
  hotel: { hazard: 'LH', growth: 'fast', qMax: 2500, spacing: 4.0, name: L('Hotel / residential', 'فندق / سكني') },
  school: { hazard: 'LH', growth: 'fast', qMax: 2500, spacing: 4.0, name: L('School / university', 'مدرسة / جامعة') },
  parking: { hazard: 'OH1', growth: 'medium', qMax: 5000, spacing: 3.4, name: L('Car park', 'موقف سيارات') },
  mall: { hazard: 'OH2', growth: 'fast', qMax: 5000, spacing: 3.4, name: L('Shopping mall', 'مركز تسوق') },
  factory: { hazard: 'OH2', growth: 'fast', qMax: 6000, spacing: 3.4, name: L('Factory / workshop', 'مصنع / ورشة') },
  storage: { hazard: 'EH1', growth: 'ultrafast', qMax: 10000, spacing: 3.0, name: L('Storage (miscellaneous)', 'تخزين عام') },
};

/** Build a facility object from the "Create facility manually" form. */
export function customFacility(form) {
  const city = CITIES.find((c) => c.id === form.city) ?? CITIES[0];
  const occ = OCCUPANCIES[form.occupancy] ?? OCCUPANCIES.office;
  const floors = Math.max(1, Math.min(60, +form.floors || 5));
  const fh = Math.max(3, Math.min(6, +form.floorHeight || 3.6));
  const fireFloor = Math.max(1, Math.min(floors, +form.fireFloor || 1));
  const elevation = (fireFloor - 1) * fh + fh - 0.3;
  const w = Math.max(20, Math.min(150, +form.width || 40));
  const d = Math.max(15, Math.min(100, +form.depth || 25));
  const K = +form.K || 80.6;
  const Tact = +form.Tact || 68;
  const qr = form.response !== 'SR';
  const nm = form.name?.trim() || 'Custom building';
  const standpipe = floors * fh > 9 ? { count: Math.max(1, Math.ceil((w * d) / 3000)), dia: 150, zoneHeight: Math.min(floors * fh, 100), zones: Math.max(1, Math.ceil((floors * fh) / 100)) } : null;
  return {
    id: 'CUSTOM', color: '#a855f7', scene: 'custom', custom: { floors, fh, w, d, fireFloor, biome: city.biome },
    type: L('Custom facility', 'منشأة مخصصة'),
    name: L(nm, nm),
    site: city.name, lat: city.lat, lon: city.lon,
    blurb: L(`${floors} floors · ${w} × ${d} m · ${occ.name.en} · ${occ.hazard} · K${K} ${qr ? 'QR' : 'SR'} ${Tact} °C`,
      `${floors} طوابق · ${w} × ${d} م · ${occ.name.ar} · ${occ.hazard} · K${K} ${qr ? 'QR' : 'SR'} ${Tact} °م`),
    date: '01 Jun', time: '12:00', ambient: city.ambient, humidity: 40, wind: 3.0, sun: 60,
    facts: [
      [L('Floors', 'الطوابق'), String(floors)], [L('Footprint', 'المسقط'), `${w} × ${d} m`],
      [L('Occupancy', 'الإشغال'), occ.name], [L('Height', 'الارتفاع'), `${(floors * fh).toFixed(1)} m`],
    ],
    system: {
      kind: 'sprinkler', hazard: occ.hazard, K, spacing: occ.spacing, RTI: qr ? 50 : 200, Tact, response: qr ? 'QR' : 'SR',
      mainDia: w * d > 3000 ? 200 : 150, mainLength: w + d + floors * fh, elevation, suctionP: 0.3, standpipe,
      prv: elevation > 60 ? 7.0 : null,
    },
    scenarios: [{
      id: 'custom', name: L(`${occ.name.en} fire – floor ${fireFloor}`, `حريق ${occ.name.ar} – الطابق ${fireFloor}`),
      compartment: { w: Math.min(w, 30), d: Math.min(d, 20), h: fh - 0.6 },
      fire: { x: Math.min(w, 30) * 0.55, z: Math.min(d, 20) * 0.45, growth: occ.growth, qMax: occ.qMax, baseH: 0.5 },
      detector: 'smoke',
    }],
    components: [
      ['tank', L('Fire water tank', 'خزان مياه الحريق'), 'tank'],
      ['pumps', L('Fire pump room', 'غرفة مضخات الحريق'), 'pump'],
      ['riser', L('Riser / standpipe', 'الرايزر / الأنبوب القائم'), 'flow'],
      ['floor', L('Fire floor – sprinklers', 'طابق الحريق – الرشاشات'), 'heads'],
      ['fdc', L('Fire department connection', 'وصلة الدفاع المدني'), 'fdc'],
      ['facp', L('Fire alarm panel', 'لوحة إنذار الحريق'), 'alarm'],
    ],
  };
}

export const FAULTS = [
  { id: 'powerFail', name: L('Mains power failure (electric pump unavailable)', 'انقطاع الكهرباء (المضخة الكهربائية غير متاحة)'), kinds: ['sprinkler', 'foam'] },
  { id: 'valveClosed', name: L('Control valve left closed (impairment)', 'صمام التحكم مغلق (تعطيل)'), kinds: ['sprinkler', 'foam'] },
  { id: 'jockeyFail', name: L('Jockey pump failed', 'تعطل مضخة الجوكي'), kinds: ['sprinkler', 'foam'] },
  { id: 'leak', name: L('Small system leak (jockey short-cycling)', 'تسريب صغير (تشغيل متكرر للجوكي)'), kinds: ['sprinkler', 'foam'] },
  { id: 'tankLow', name: L('Water tank at 20 % (not refilled)', 'خزان المياه عند 20% (لم تتم إعادة تعبئته)'), kinds: ['sprinkler', 'foam'] },
  { id: 'detectorFail', name: L('Detection failure (manual release only)', 'تعطل الكشف (إطلاق يدوي فقط)'), kinds: ['sprinkler', 'cleanAgent', 'foam'] },
  { id: 'abort', name: L('Abort switch held by operator', 'ضغط مفتاح الإلغاء من قبل المشغل'), kinds: ['cleanAgent'] },
  { id: 'doorOpen', name: L('Door wedged open (room integrity lost)', 'باب مفتوح (فقدان إحكام الغرفة)'), kinds: ['cleanAgent'] },
];
