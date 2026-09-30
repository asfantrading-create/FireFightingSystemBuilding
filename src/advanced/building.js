// Demo project for the Smart Systems Lab: a 3-storey office building ("ASFAN Business Center")
// with one addressable SLC loop, two NAC circuits and the building services the fire alarm
// system talks to (AHUs, dampers, stair fans, lift, door holders, access control, FM-200, PA).
// Plan coordinates are metres; every floor is 48 m × 22 m.

export const PLAN = { w: 48, h: 22 };

export const FLOORS = [
  { id: 'G', name: { en: 'Ground floor', ar: 'الطابق الأرضي' }, level: 0 },
  { id: '1', name: { en: 'First floor', ar: 'الطابق الأول' }, level: 1 },
  { id: '2', name: { en: 'Second floor', ar: 'الطابق الثاني' }, level: 2 },
];

const R = (id, x, y, w, h, en, ar, kind = 'office') => ({ id, x, y, w, h, name: { en, ar }, kind });

/** Rooms per floor (the same shell on every floor, with floor-specific uses). */
export function roomsFor(floor) {
  const special = {
    G: [R('off4', 38, 0, 10, 9, 'Reception', 'الاستقبال'), R('kit', 12, 13, 6, 9, 'Electrical / FACP room', 'غرفة الكهرباء ولوحة الإنذار', 'tech')],
    1: [R('off4', 38, 0, 10, 9, 'Server room (FM-200)', 'غرفة الخوادم (FM-200)', 'server'), R('kit', 12, 13, 6, 9, 'Pantry', 'مطبخ صغير', 'kitchen')],
    2: [R('off4', 38, 0, 10, 9, 'Meeting room', 'غرفة اجتماعات'), R('kit', 12, 13, 6, 9, 'Kitchen', 'المطبخ', 'kitchen')],
  }[floor];
  return [
    R('stA', 0, 0, 5, 9, 'Stair A', 'الدرج A', 'stair'),
    R('off1', 5, 0, 9, 9, 'Office 1', 'مكتب 1'),
    R('off2', 14, 0, 8, 9, 'Office 2', 'مكتب 2'),
    R('riser', 22, 0, 2, 4, 'Riser', 'الرايزر', 'shaft'),
    R('lift', 24, 0, 4, 4, 'Lift', 'المصعد', 'shaft'),
    R('lobby', 22, 4, 6, 5, 'Lift lobby', 'ردهة المصعد', 'lobby'),
    R('off3', 28, 0, 10, 9, 'Office 3', 'مكتب 3'),
    R('cor', 0, 9, 48, 4, 'Corridor', 'الممر', 'corridor'),
    R('off5', 0, 13, 12, 9, 'Office 5', 'مكتب 5'),
    R('off6', 18, 13, 13, 9, 'Open office', 'مكتب مفتوح'),
    R('off7', 31, 13, 12, 9, 'Office 7', 'مكتب 7'),
    R('stB', 43, 13, 5, 9, 'Stair B', 'الدرج B', 'stair'),
    ...special,
  ];
}

/** Device catalogue: loop current (mA), standby & alarm, and drawing symbol. */
export const DEVICE_TYPES = {
  smoke: { sym: 'S', name: { en: 'Photoelectric smoke detector', ar: 'كاشف دخان كهروضوئي' }, iq: 0.3, ia: 0.3, input: true, analog: true },
  heat: { sym: 'H', name: { en: 'Heat detector (58 °C / ROR)', ar: 'كاشف حرارة (58 °م / معدل ارتفاع)' }, iq: 0.3, ia: 0.3, input: true, analog: true },
  multi: { sym: 'M', name: { en: 'Multi-criteria detector (smoke + heat)', ar: 'كاشف متعدد المعايير (دخان + حرارة)' }, iq: 0.35, ia: 0.35, input: true, analog: true },
  mcp: { sym: 'F', name: { en: 'Manual call point', ar: 'زر إنذار يدوي' }, iq: 0.25, ia: 0.25, input: true },
  flow: { sym: 'W', name: { en: 'Monitor module – waterflow switch', ar: 'وحدة مراقبة – مفتاح تدفق المياه' }, iq: 0.4, ia: 0.4, input: true },
  tamper: { sym: 'T', name: { en: 'Monitor module – valve tamper switch', ar: 'وحدة مراقبة – مفتاح عبث الصمام' }, iq: 0.4, ia: 0.4, input: true },
  relay: { sym: 'C', name: { en: 'Control module (relay output)', ar: 'وحدة تحكم (مخرج ريليه)' }, iq: 0.4, ia: 6, input: false },
  iso: { sym: 'I', name: { en: 'Short-circuit isolator', ar: 'عازل دائرة القصر' }, iq: 0.1, ia: 0.1, input: false },
};

/** NAC appliances (horn/strobes) — not on the loop; powered from the panel NAC circuits. */
export const NAC_TYPE = { name: { en: 'Horn / strobe (NAC)', ar: 'بوق / وميض (دائرة إنذار)' }, ia: 110, dB: 88 };

// Loop order per floor (the cable route) — devices are created in this order.
const FLOOR_LAYOUT = (f) => {
  const d = [];
  const add = (type, x, y, room, en, ar, zone = `Z${f}`) => d.push({ type, floor: f, x, y, room, label: { en, ar }, zone });
  add('iso', 21.4, 3.2, 'riser', 'Isolator – riser', 'عازل – الرايزر');
  add('flow', 22.6, 1.0, 'riser', 'Waterflow switch', 'مفتاح تدفق المياه');
  add('tamper', 23.4, 2.4, 'riser', 'Floor control valve tamper', 'مفتاح عبث صمام الطابق');
  add('smoke', 25, 6.5, 'lobby', 'Lift lobby', 'ردهة المصعد');
  add('smoke', 18, 4.5, 'off2', 'Office 2', 'مكتب 2');
  add('smoke', 9.5, 4.5, 'off1', 'Office 1', 'مكتب 1');
  add('mcp', 5.4, 10, 'cor', 'Call point – Stair A', 'زر إنذار – الدرج A');
  add('smoke', 4, 11, 'cor', 'Corridor west', 'الممر الغربي');
  add('smoke', 6, 17.5, 'off5', 'Office 5', 'مكتب 5');
  add('smoke', 13, 11, 'cor', 'Corridor', 'الممر');
  add(f === 'G' ? 'heat' : f === '1' ? 'heat' : 'heat', 15, 17.5, 'kit', f === 'G' ? 'Electrical room' : 'Kitchen', f === 'G' ? 'غرفة الكهرباء' : 'المطبخ');
  add('smoke', 22, 11, 'cor', 'Corridor centre', 'منتصف الممر');
  add('multi', 24.5, 17.5, 'off6', 'Open office', 'المكتب المفتوح');
  add('smoke', 31, 11, 'cor', 'Corridor east', 'الممر الشرقي');
  add('smoke', 33, 4.5, 'off3', 'Office 3', 'مكتب 3');
  if (f === '1') {
    add('smoke', 41, 3, 'off4', 'Server room – detector A', 'غرفة الخوادم – كاشف A', 'SR-A');
    add('smoke', 45, 6, 'off4', 'Server room – detector B', 'غرفة الخوادم – كاشف B', 'SR-B');
  } else add('smoke', 43, 4.5, 'off4', f === 'G' ? 'Reception' : 'Meeting room', f === 'G' ? 'الاستقبال' : 'غرفة الاجتماعات');
  add('smoke', 40, 11, 'cor', 'Corridor far east', 'أقصى شرق الممر');
  add('smoke', 37, 17.5, 'off7', 'Office 7', 'مكتب 7');
  add('mcp', 42.6, 12, 'cor', 'Call point – Stair B', 'زر إنذار – الدرج B');
  add('relay', 27, 1.2, 'lobby', 'Control module – floor AHU / damper', 'وحدة تحكم – مكيف/خانق الطابق');
  return d;
};

export function defaultDevices() {
  const list = [];
  for (const f of FLOORS) list.push(...FLOOR_LAYOUT(f.id));
  return list.map((d, i) => ({
    id: `d${i + 1}`, addr: i + 1, order: i, dirt: 0.08 + ((i * 37) % 23) / 100, disabled: false, fault: null, ...d,
  }));
}

/** Horn/strobes per floor, on NAC1 (G + 1) and NAC2 (2). */
export function defaultNac() {
  const out = [];
  for (const f of FLOORS) {
    for (const [x, y] of [[9, 12.6], [27, 12.6], [40, 9.4]]) out.push({ floor: f.id, x, y, nac: f.id === '2' ? 'NAC2' : 'NAC1' });
  }
  return out;
}

/** Where the FACP sits (ground-floor electrical room). */
export const PANEL_POS = { floor: 'G', x: 14, y: 20.5 };
export const RISER_POS = { x: 21.4, y: 1.4 };
