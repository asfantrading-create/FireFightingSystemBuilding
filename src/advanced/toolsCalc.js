// Engineering Tools — pure calculation helpers (no DOM), unit-tested in tests/tools.test.mjs.
//  • NFPA 13 §28 tree hydraulic calculation (Hazen–Williams SI, K-factor balancing, water supply curve)
//  • NFPA 72 §10.6.7 secondary-supply (battery) sizing and charger check
//  • NAC voltage drop (lumped vs distributed load, UL 1971 16–33 V regulated range)
//  • SLC loop loading (resistance, capacitance, isolator spacing, address capacity)

// ───────────────────────── pipes & fittings
/** Schedule 40 steel pipe (ASME B36.10M) internal diameters. */
export const PIPES = [
  { key: '1', nps: '1"', dn: 25, id: 26.64 },
  { key: '1.25', nps: '1¼"', dn: 32, id: 35.05 },
  { key: '1.5', nps: '1½"', dn: 40, id: 40.89 },
  { key: '2', nps: '2"', dn: 50, id: 52.50 },
  { key: '2.5', nps: '2½"', dn: 65, id: 62.71 },
  { key: '3', nps: '3"', dn: 80, id: 77.93 },
  { key: '4', nps: '4"', dn: 100, id: 102.26 },
  { key: '6', nps: '6"', dn: 150, id: 154.05 },
  { key: '8', nps: '8"', dn: 200, id: 202.72 },
];
export const pipe = (key) => PIPES.find((p) => p.key === String(key)) || PIPES[0];

/** NFPA 13 (2022) Table 28.2.3.1.1 — equivalent pipe length in FEET (Sch 40, C = 120), same order as PIPES. */
export const FITTINGS = {
  e45: { ft: [1, 1, 2, 2, 3, 3, 4, 7, 9], en: '45° elbow', ar: 'كوع 45°' },
  e90: { ft: [2, 3, 4, 5, 6, 7, 10, 14, 18], en: '90° standard elbow', ar: 'كوع 90° قياسي' },
  tee: { ft: [5, 6, 8, 10, 12, 15, 20, 30, 35], en: 'Tee / cross (flow turned 90°)', ar: 'تي / صليب (تدفق منعطف 90°)' },
  gate: { ft: [0, 0, 0, 1, 1, 1, 2, 3, 4], en: 'Gate valve', ar: 'صمام بوابي' },
  check: { ft: [5, 7, 9, 11, 14, 16, 22, 32, 45], en: 'Swing check / alarm valve', ar: 'صمام عدم رجوع / صمام إنذار' },
};
export const FT = 0.3048;
/** Table 28.2.3.1.1 note: multiply equivalent lengths for C ≠ 120. */
export function cMultiplier(C) {
  const t = [[100, 0.713], [120, 1], [130, 1.16], [140, 1.33], [150, 1.51]];
  if (C <= 100) return 0.713;
  if (C >= 150) return 1.51;
  for (let i = 0; i < t.length - 1; i++) {
    const [c0, m0] = t[i], [c1, m1] = t[i + 1];
    if (C >= c0 && C <= c1) return m0 + ((C - c0) / (c1 - c0)) * (m1 - m0);
  }
  return 1;
}
/** Equivalent length (m) of the fittings on one segment. */
export function fittingLength(row) {
  const idx = Math.max(0, PIPES.findIndex((p) => p.key === String(row.size)));
  let ft = 0;
  for (const k of Object.keys(FITTINGS)) ft += (+row[k] || 0) * FITTINGS[k].ft[idx];
  return ft * FT * cMultiplier(+row.C || 120);
}

/** Hazen–Williams, SI form: friction loss in bar per metre (Q in L/min, d in mm). */
export function hazen(Q, d, C = 120) {
  if (!(Q > 0)) return 0;
  return (6.05e5 * Math.pow(Q, 1.85)) / (Math.pow(C, 1.85) * Math.pow(d, 4.87));
}
export const BAR_PER_M = 0.0981; // elevation pressure (0.433 psi/ft)
export const velocity = (Q, d) => (Q / 60000) / (Math.PI * Math.pow(d / 1000, 2) / 4);

/** NFPA 13 (2022) Fig. 19.3.3.1.1 design points and Table 19.3.3.1.2 hose allowance (inside + outside). */
export const HAZARDS = [
  { id: 'LH', en: 'Light hazard', ar: 'خطر خفيف', density: 4.1, area: 139, hose: 380, dur: 30, maxAs: 20.9 },
  { id: 'OH1', en: 'Ordinary hazard Group 1', ar: 'خطر عادي – المجموعة 1', density: 6.1, area: 139, hose: 950, dur: 60, maxAs: 12.1 },
  { id: 'OH2', en: 'Ordinary hazard Group 2', ar: 'خطر عادي – المجموعة 2', density: 8.1, area: 139, hose: 950, dur: 60, maxAs: 12.1 },
  { id: 'EH1', en: 'Extra hazard Group 1', ar: 'خطر إضافي – المجموعة 1', density: 12.2, area: 232, hose: 1900, dur: 90, maxAs: 9.3 },
  { id: 'EH2', en: 'Extra hazard Group 2', ar: 'خطر إضافي – المجموعة 2', density: 16.3, area: 232, hose: 1900, dur: 120, maxAs: 9.3 },
];

/**
 * Default example: OH-1 office/parking, 12 × K80 pendent sprinklers on three 4-head branch lines,
 * side-fed 2"/2½" cross main, 3" riser, 4" underground to the flow-test point.
 * Each row = one node + the pipe from that node towards the source ("to").
 * x, y (m) and z = elevation are used for the drawing; elev (m) is used by the calculation.
 */
export function defaultNetwork() {
  const r = (node, k, elev, to, size, len, fit = {}, x = 0, y = 0) =>
    ({ node, k, elev, to, size, len, e90: 0, e45: 0, tee: 0, gate: 0, check: 0, C: 120, ...fit, x, y });
  const rows = [];
  const branch = (n0, cm, x) => {
    const ys = [12.6, 9.0, 5.4, 1.8];
    for (let i = 0; i < 4; i++) {
      const node = `S${n0 + i}`;
      const to = i < 3 ? `S${n0 + i + 1}` : cm;
      const size = i < 2 ? '1' : i === 2 ? '1.25' : '1.5';
      rows.push(r(node, 80, 4.0, to, size, i < 3 ? 3.6 : 1.8, i === 3 ? { tee: 1 } : {}, x, ys[i]));
    }
  };
  branch(1, 'CM1', 9.0);
  branch(5, 'CM2', 12.2);
  branch(9, 'CM3', 15.4);
  rows.push(r('CM1', 0, 4.0, 'CM2', '2', 3.2, {}, 9.0, 0));
  rows.push(r('CM2', 0, 4.0, 'CM3', '2', 3.2, {}, 12.2, 0));
  rows.push(r('CM3', 0, 4.0, 'TOR', '2.5', 3.0, { e90: 1 }, 15.4, 0));
  rows.push(r('TOR', 0, 4.0, 'BOR', '3', 4.2, { e90: 1, check: 1, gate: 1 }, 18.6, 0));
  rows.push(r('BOR', 0, 0.0, 'SRC', '4', 30.0, { e90: 2, gate: 1, check: 1 }, 18.6, 0));
  return { rows, source: { id: 'SRC', elev: 0, x: 25.6, y: 0 }, hazard: 'OH1', density: 6.1, area: 139, pmin: 0.5, hose: 950, supply: { static: 4.8, residual: 3.4, flow: 2500 }, margin: 0.35 };
}

/**
 * NFPA 13 §28 tree calculation starting at the most remote sprinkler.
 * Every sprinkler gets at least density × (area / n) at no less than pmin (0.5 bar / 7 psi);
 * at each junction the lower-pressure path is raised to the governing pressure with the
 * K-equivalent method (Q' = Q·√(P_high / P_low)).
 */
export function solveNetwork(net) {
  const errors = [];
  const rows = net.rows.map((r) => ({ ...r, node: String(r.node).trim(), to: String(r.to).trim() }));
  const byNode = new Map();
  for (const r of rows) {
    if (!r.node) { errors.push({ code: 'emptyNode' }); continue; }
    if (byNode.has(r.node)) errors.push({ code: 'dupNode', node: r.node });
    byNode.set(r.node, r);
  }
  const roots = [...new Set(rows.map((r) => r.to).filter((t) => !byNode.has(t)))];
  if (roots.length !== 1) errors.push({ code: 'roots', roots });
  const root = roots[0] ?? net.source?.id ?? 'SRC';
  // cycle check
  for (const r of rows) {
    const seen = new Set([r.node]); let t = r.to; let guard = 0;
    while (byNode.has(t) && guard++ < 500) { if (seen.has(t)) { errors.push({ code: 'cycle', node: r.node }); break; } seen.add(t); t = byNode.get(t).to; }
  }
  const heads = rows.filter((r) => +r.k > 0);
  if (!heads.length) errors.push({ code: 'noHeads' });
  if (errors.length) return { ok: false, errors };

  const n = heads.length;
  const As = net.area / n;
  const qmin = net.density * As;
  const pmin = Math.max(net.pmin ?? 0.5, 0);
  const elev = (id) => (id === root ? +(net.source?.elev ?? 0) : +byNode.get(id).elev || 0);
  const kids = new Map();
  for (const r of rows) { if (!kids.has(r.to)) kids.set(r.to, []); kids.get(r.to).push(r); }
  // report order: follow the largest sub-tree first so the calculation starts at the most remote sprinkler
  const size = new Map();
  const sz = (id) => { if (!size.has(id)) size.set(id, 1 + (kids.get(id) || []).reduce((s, c) => s + sz(c.node), 0)); return size.get(id); };
  for (const list of kids.values()) list.sort((a, b) => sz(b.node) - sz(a.node));

  const steps = [];       // report rows in calculation order
  const nodes = {};       // node id → { P, Qout, qHead, pReq }
  const segs = {};        // node id (downstream) → segment result
  const warnings = [];

  function solve(id) {
    const r = byNode.get(id); // undefined for root
    const paths = [];
    for (const c of kids.get(id) || []) {
      const s = solve(c.node);
      const p = pipe(c.size);
      const C = +c.C || 120;
      const pf = hazen(s.Q, p.id, C);
      const F = fittingLength(c);
      const L = +c.len || 0;
      const T = L + F;
      const Pf = pf * T;
      const Pe = BAR_PER_M * (elev(c.node) - elev(id));
      const P = s.P + Pf + Pe;
      const seg = { from: c.node, to: id, q: nodes[c.node].qHead, Q: s.Q, size: c.size, d: p.id, C, pf, L, F, T, Pf, Pe, Pstart: s.P, Pend: P, v: velocity(s.Q, p.id), fit: { e90: +c.e90 || 0, e45: +c.e45 || 0, tee: +c.tee || 0, gate: +c.gate || 0, check: +c.check || 0 } };
      segs[c.node] = seg;
      steps.push({ kind: 'seg', ...seg });
      paths.push({ c, Q: s.Q, P });
    }
    const k = r ? +r.k || 0 : 0;
    const pHead = k > 0 ? Math.max(pmin, Math.pow(qmin / k, 2)) : 0;
    let P = Math.max(pHead, ...paths.map((x) => x.P), 0);
    let Q = 0;
    for (const x of paths) {
      if (x.P < P - 1e-9 && x.P > 0) {
        const Keq = x.Q / Math.sqrt(x.P);
        const Qa = Keq * Math.sqrt(P);
        steps.push({ kind: 'bal', at: id, from: x.c.node, Q: x.Q, P: x.P, Pgov: P, Keq, Qa });
        Q += Qa;
      } else Q += x.Q;
    }
    let qHead = 0;
    if (k > 0) {
      qHead = k * Math.sqrt(P);
      Q += qHead;
      steps.push({ kind: 'head', at: id, k, P, q: qHead, governing: P > pHead + 1e-9 ? 'path' : pmin >= Math.pow(qmin / k, 2) ? 'pmin' : 'density' });
    } else if (!paths.length) warnings.push({ code: 'deadEnd', node: id });
    nodes[id] = { P, Q, qHead, elev: elev(id) };
    return { Q, P };
  }
  const res = solve(root);
  const hose = +net.hose || 0;
  const Qtot = res.Q + hose;
  const sup = net.supply || {};
  const Pavail = supplyPressure(sup, Qtot);
  const PavailSpr = supplyPressure(sup, res.Q);
  const margin = Pavail - res.P;
  const need = +net.margin || 0;
  const minHead = Math.min(...heads.map((h) => nodes[h.node].P));
  const maxV = Math.max(...Object.values(segs).map((s) => s.v));
  return {
    ok: true, root, n, As, qmin, pmin, steps, nodes, segs, warnings,
    Qspr: res.Q, Pdem: res.P, hose, Qtot, Pavail, PavailSpr, margin, need,
    pass: margin >= need && minHead >= pmin - 1e-9,
    minHead, maxV,
    avgDensity: res.Q / net.area,
    remote: heads.reduce((a, h) => (nodes[h.node].P < nodes[a.node].P ? h : a), heads[0]).node,
  };
}

/** Water supply curve from a flow test: P = Ps − (Ps − Pr)(Q / Qr)^1.85. */
export function supplyPressure(s, Q) {
  const Ps = +s.static || 0, Pr = +s.residual || 0, Qr = +s.flow || 1;
  return Ps - (Ps - Pr) * Math.pow(Math.max(0, Q) / Qr, 1.85);
}

// ───────────────────────── NFPA 72 battery calculation
export const BATTERY_SIZES = [7, 12, 17, 18, 26, 33, 40, 55, 65, 100];
/**
 * rows: [{ qty, standby (mA), alarm (mA) }]
 * standby Ah = I_q × 24 h ; alarm Ah = I_a × t_alarm ; required = (sum) × (1 + margin).
 */
export function batterySizing(rows, { standbyH = 24, alarmMin = 5, margin = 0.2, charger = 1.5, rechargeH = 48, sizes = BATTERY_SIZES } = {}) {
  let q = 0, a = 0;
  for (const r of rows) { q += (+r.qty || 0) * (+r.standby || 0); a += (+r.qty || 0) * (+r.alarm || 0); }
  const standbyA = q / 1000, alarmA = a / 1000;
  const standbyAh = standbyA * standbyH;
  const alarmAh = alarmA * (alarmMin / 60);
  const base = standbyAh + alarmAh;
  const required = base * (1 + margin);
  const pick = sizes.find((s) => s >= required) ?? Math.ceil(required);
  // Charger: carry the standby load and restore the discharged capacity (×1.2 charge-efficiency) within 48 h
  const chargerReq = standbyA + (1.2 * base) / rechargeH;
  return { standbyA, alarmA, standbyAh, alarmAh, base, required, pick, chargerReq, chargerOk: charger >= chargerReq };
}

// ───────────────────────── NAC voltage drop
/** Copper conductor DC resistance at 20 °C, Ω per km (NEC Ch.9 Table 8 solid / IEC 60228 class 2). */
export const WIRES = [
  { key: 'awg18', en: '18 AWG (0.82 mm²)', r: 25.5 },
  { key: 'awg16', en: '16 AWG (1.31 mm²)', r: 16.1 },
  { key: 'mm1.5', en: '1.5 mm²', r: 12.1 },
  { key: 'awg14', en: '14 AWG (2.08 mm²)', r: 10.1 },
  { key: 'mm2.5', en: '2.5 mm²', r: 7.41 },
  { key: 'awg12', en: '12 AWG (3.31 mm²)', r: 6.34 },
  { key: 'mm4', en: '4 mm²', r: 4.61 },
];
export const wire = (k) => WIRES.find((w) => w.key === k) || WIRES[0];
/** Typical 24 V DC horn/strobe UL max RMS current (16–33 V) per candela setting — always use the listed data sheet value. */
export const CANDELA = [
  { cd: 15, mA: 79 },
  { cd: 30, mA: 113 },
  { cd: 75, mA: 197 },
  { cd: 110, mA: 248 },
];

/**
 * Class B NAC, n appliances evenly spaced along a one-way length L (first one at L/n, last one at L).
 * Lumped: all current at the end → V_end = Vs − I·R_loop.
 * Distributed: segment j carries (n − j + 1)·i → V_end = Vs − I·R_loop·(n + 1)/(2n).
 */
export function nacDrop({ wireKey, length, n, mA, vs = 20.4, vmin = 16, eol = 4700, maxA = 2.5 }) {
  const r = wire(wireKey).r / 1000; // Ω/m per conductor
  const i = mA / 1000;
  const iEol = vs / eol;
  const I = n * i + iEol;
  const Rloop = 2 * r * length;
  const vLumped = vs - I * Rloop;
  const seg = n > 0 ? length / n : length;
  const profile = [{ x: 0, v: vs }];
  let v = vs;
  for (let j = 1; j <= n; j++) {
    const Iseg = (n - j + 1) * i + iEol;
    v -= Iseg * 2 * r * seg;
    profile.push({ x: j * seg, v });
  }
  const vDist = n > 0 ? v : vs - iEol * Rloop;
  return { r, I, Rloop, vLumped, vDist, profile, dropPct: ((vs - vDist) / vs) * 100, passLumped: vLumped >= vmin, passDist: vDist >= vmin, currentOk: I <= maxA, iEol };
}
/** Smallest conductor (highest resistance) that keeps the end-of-line voltage ≥ vmin. */
export function minWire(p, method = 'dist') {
  const sorted = [...WIRES].sort((a, b) => b.r - a.r);
  for (const w of sorted) {
    const res = nacDrop({ ...p, wireKey: w.key });
    if (method === 'lumped' ? res.passLumped : res.passDist) return w.key;
  }
  return null;
}

// ───────────────────────── SLC loop
/** Isolator segments along the loop: devices between consecutive isolators (panel loop OUT / IN count as isolators). */
export function isolatorSegments(ordered) {
  const segs = []; let cur = [];
  for (const d of ordered) {
    if (d.type === 'iso') { segs.push(cur); cur = []; } else cur.push(d);
  }
  segs.push(cur);
  return segs;
}
/** Approximate cable route length (m): Manhattan runs on each floor, via the riser between floors, ceiling drops, +10 % slack. */
export function loopRouteLength(ordered, { panel = { floor: 'G', x: 14, y: 20.5 }, riser = { x: 21.4, y: 1.4 }, floorH = 4, levels = { G: 0, 1: 1, 2: 2 }, drop = 0.5, slack = 1.1 } = {}) {
  const pts = [panel, ...ordered, panel];
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (a.floor === b.floor) L += Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    else L += Math.abs(a.x - riser.x) + Math.abs(a.y - riser.y) + Math.abs(levels[a.floor] - levels[b.floor]) * floorH + Math.abs(b.x - riser.x) + Math.abs(b.y - riser.y);
  }
  return (L + ordered.length * drop * 2) * slack;
}
export function slcCheck({ devices, length, rPerKm, pfPerM = 150, loopV = 24, vMinDev = 17, maxR = 40, maxC = 0.5, maxA = 0.5, maxAddr = 159, maxBetween = 32, ledMA = 5, ledMax = 10 }) {
  const iq = devices.reduce((s, d) => s + d.iq, 0) / 1000;
  const ia = (devices.reduce((s, d) => s + d.ia, 0) + ledMA * Math.min(ledMax, devices.length)) / 1000;
  const R = 2 * (rPerKm / 1000) * length;
  const Cuf = (pfPerM * length) / 1e6;
  const vFar = loopV - ia * R;
  return { iq, ia, R, Cuf, vFar, rOk: R <= maxR, cOk: Cuf <= maxC, aOk: ia <= maxA, vOk: vFar >= vMinDev, addrOk: devices.length <= maxAddr, maxAddr, maxBetween };
}
