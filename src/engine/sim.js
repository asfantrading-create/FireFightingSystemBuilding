// Deterministic scenario simulator. A scenario is simulated once (dt = 0.1 s) into a
// timeline sampled every 0.5 s; playback and scrubbing simply index into the timeline.
//
// Physics used:
//  • t² fire growth  Q = α t²  (capped at Qmax)
//  • Alpert ceiling-jet correlations for gas temperature / velocity at sprinklers & detectors
//  • RTI heat-link model  dTd/dt = √u (Tg − Td) / RTI  (NFPA 13 / DETACT)
//  • Evans sprinkler suppression  Q(t) = Qact·exp(−(t−tact)/τ),  τ = 3.0·w″^−1.85
//  • Hydraulics: Q = K√P outlets, quadratic pump curves, Hazen–Williams losses, system compliance
//  • NFPA 20 pressure-switch sequencing (jockey → electric → diesel), manual stop only
//  • NFPA 2001 clean-agent discharge & hold; NFPA 11 foam coverage model

import { ALPHA, BAR_PER_M, kFlow } from './design.js';

export const SAMPLE_DT = 0.5;
const DT = 0.1;

export const FIELDS = [
  't', 'hrr', 'gasT', 'P', 'Pfloor', 'Q', 'Qspr', 'Qhose', 'tank', 'heads', 'jockey', 'main', 'diesel',
  'agent', 'o2', 'foam', 'coverage', 'concentrate', 'smoke', 'water',
];

function alpert(Q, H, r) {
  // Returns [ΔT (K), u (m/s)] of the ceiling jet at radius r (m) for fire Q (kW) at height H (m)
  if (Q <= 0) return [0, 0];
  H = Math.max(H, 0.5);
  if (r / H <= 0.18) {
    return [16.9 * Math.pow(Q, 2 / 3) / Math.pow(H, 5 / 3), 0.947 * Math.pow(Q / H, 1 / 3)];
  }
  return [5.38 * Math.pow(Q / r, 2 / 3) / H, 0.197 * Math.pow(Q, 1 / 3) * Math.sqrt(H) / Math.pow(r, 5 / 6)];
}

function makeTimeline(duration) {
  const n = Math.floor(duration / SAMPLE_DT) + 1;
  const data = {};
  for (const f of FIELDS) data[f] = new Float32Array(n);
  return { n, duration, data, events: [], headTimes: [], detectorTimes: [] };
}

/** Pump-set hydraulic model shared by all water-based systems. */
export class PumpSet {
  constructor(pumps, faults, tankM3, ev) {
    this.p = pumps;
    this.faults = faults;
    this.ev = ev;
    this.P = pumps.jockeyStop;
    this.C = 3.0;                           // system compliance, L/bar
    this.jockey = false; this.jockeyRunT = 0;
    this.main = 0; this.mainState = 'standby'; this.mainT = 0;
    this.diesel = 0; this.dieselState = 'standby'; this.dieselT = 0;
    this.a = (pumps.churnP - pumps.ratedP) / (pumps.rated ** 2);
    this.jc = pumps.jockeyStop + 1.2;
    this.ja = (this.jc - pumps.jockeyStart) / (pumps.jockeyFlow ** 2);
    this.tank = tankM3; this.tank0 = tankM3;
    this.lowTankAlarm = false; this.emptyAlarm = false;
    this.Qin = 0;
  }
  suction() { return this.tank > 0.2 ? this.p.suctionP : -5; }
  inflow(P) {
    let q = 0;
    const ps = this.suction();
    if (this.jockey && ps > -1) q += Math.sqrt(Math.max(0, (this.jc - P) / this.ja));
    for (const s of [this.main, this.diesel]) {
      if (s > 0 && ps > -1) q += this.p.count * Math.sqrt(Math.max(0, (s * s * this.p.churnP + ps - P) / this.a));
    }
    return q;
  }
  step(t, dt, outflow) {
    const p = this.p;
    // Controllers (NFPA 20 sequencing). Main pumps latch on: manual stop only.
    if (!this.faults.jockeyFail) {
      const bigRunning = this.main > 0 || this.diesel > 0;
      if (!this.jockey && !bigRunning && this.P < p.jockeyStart) { this.jockey = true; this.ev(t, 'info', 'jockeyStart', { p: this.P }); }
      else if (this.jockey && (this.P >= p.jockeyStop - 0.02 || this.main >= 1 || this.diesel >= 1)) { this.jockey = false; this.ev(t, 'info', 'jockeyStop', { p: this.P }); }
    }
    if (this.mainState === 'standby' && this.P < p.mainStart) {
      if (this.faults.powerFail) { this.mainState = 'failed'; this.ev(t, 'alarm', 'mainFail', { p: this.P }); }
      else { this.mainState = 'starting'; this.mainT = t; this.ev(t, 'warn', 'mainStart', { p: this.P }); }
    }
    // Sequential start (NFPA 20): the standby diesel only follows if pressure stays low
    // 10 s after the electric pump was called, or immediately if the electric pump failed.
    const mainHelping = this.mainState !== 'failed' && this.mainState !== 'standby' && t - this.mainT < 10;
    if (this.dieselState === 'standby' && this.P < p.dieselStart && !mainHelping) {
      this.dieselState = 'cranking'; this.dieselT = t; this.ev(t, 'warn', 'dieselCrank', { p: this.P });
    }
    if (this.mainState === 'starting') {
      this.main = Math.min(1, (t - this.mainT) / 3); // star-delta/soft start ≈ 3 s
      if (this.main >= 1) { this.mainState = 'running'; this.ev(t, 'info', 'mainRunning', {}); }
    }
    if (this.dieselState === 'cranking' && t - this.dieselT > 6) { this.dieselState = 'ramping'; this.dieselT = t; }
    if (this.dieselState === 'ramping') {
      this.diesel = Math.min(1, (t - this.dieselT) / 4);
      if (this.diesel >= 1) { this.dieselState = 'running'; this.ev(t, 'info', 'dieselRunning', {}); }
    }
    // Implicit pressure update: C·(P−P0)/dt = (Qin(P) − Qout(P)) / 60   (bisection, monotone)
    const P0 = this.P;
    let lo = -1, hi = p.churnP + p.suctionP + 3;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      const f = this.C * (m - P0) / dt - (this.inflow(m) - outflow(m)) / 60;
      if (f > 0) hi = m; else lo = m;
    }
    this.P = Math.max(0, (lo + hi) / 2);
    this.Qin = this.inflow(this.P);
    const drawn = (this.main > 0 || this.diesel > 0 || this.jockey) ? this.Qin : 0;
    this.tank = Math.max(0, this.tank - drawn * dt / 60000);
    if (!this.lowTankAlarm && this.tank < 0.25 * this.tank0) { this.lowTankAlarm = true; this.ev(t, 'warn', 'tankLow', {}); }
    if (!this.emptyAlarm && this.tank <= 0.2) { this.emptyAlarm = true; this.ev(t, 'alarm', 'tankEmpty', {}); }
  }
  manualStop(t) {
    if (this.main > 0 || this.diesel > 0) this.ev(t, 'info', 'pumpsStopped', {});
    this.main = 0; this.diesel = 0;
    this.mainState = this.mainState === 'failed' ? 'failed' : 'standby';
    this.dieselState = 'standby';
  }
}

// Total flow of outlet groups sharing one supply main with friction kf·Q^1.85.
// Each group: { n, K, dp (static/extra loss, bar), cap (PRV outlet setting, bar | null) }.
// Solves Q = Σ n·K·√(min(P − kf·Q^1.85 − dp, cap)) self-consistently (monotone → bisection).
export function solveFlow(P, groups, kf) {
  const flowAt = (Q) => {
    const pm = P - kf * Math.pow(Q, 1.85);
    let q = 0;
    for (const g of groups) {
      if (!g.n || !g.K) continue;
      let p = pm - (g.dp || 0);
      if (g.cap != null) p = Math.min(p, g.cap);
      q += g.n * kFlow(g.K, p);
    }
    return q;
  };
  const hi0 = flowAt(0);
  if (hi0 <= 0) return { Q: 0, pm: P };
  let lo = 0, hi = hi0;
  for (let i = 0; i < 32; i++) {
    const m = (lo + hi) / 2;
    if (m - flowAt(m) > 0) hi = m; else lo = m;
  }
  const Q = (lo + hi) / 2;
  return { Q, pm: P - kf * Math.pow(Q, 1.85) };
}

function record(tl, i, obj) {
  for (const f of FIELDS) tl.data[f][i] = obj[f] ?? 0;
}

// ─────────────────────────────── sprinkler systems ───────────────────────────────
function simSprinkler(fac, sc, design, opts) {
  const f = opts.faults;
  const T0 = opts.ambient;
  const duration = sc.duration ?? 1800;
  const tl = makeTimeline(duration);
  const ev = (t, level, key, params = {}) => tl.events.push({ t, level, key, params });
  const sys = fac.system;
  const comp = sc.compartment;
  const s = sys.spacing;
  const heads = [];
  for (let x = s / 2; x < comp.w; x += s) {
    for (let z = s / 2; z < comp.d; z += s) heads.push({ x, z, Td: T0, open: false, t: null });
  }
  const detSp = sc.detectorSpacing ?? 9;
  const dets = [];
  for (let x = detSp / 2; x < comp.w; x += detSp) for (let z = detSp / 2; z < comp.d; z += detSp) dets.push({ x, z, on: false });
  const H = comp.h - (sc.fire.baseH ?? 0);
  const alpha = ALPHA[sc.fire.growth] ?? sc.fire.alpha;
  const qMax = sc.fire.qMax;
  const tankV = design.tank * (f.tankLow ? 0.2 : 1);
  const pumps = new PumpSet(design.pumps, f, tankV, ev);
  const elevBar = sys.elevation * BAR_PER_M;
  const K = sys.K;
  const leakK = f.leak ? 1.2 : 0;
  const hoseK = 360;
  const cover = s * s;
  const kf = design.kf;
  // Outlet groups downstream of the floor control assembly (optional pressure-reducing valve)
  const groups = () => [
    { n: valveClosed ? 0 : headsOpen, K, dp: elevBar, cap: sys.prv ?? null },
    { n: hoseOpen ? 1 : 0, K: hoseK, dp: elevBar + 0.5, cap: sys.prv ? sys.prv + 2 : null },
  ];
  const floorPress = (P) => {
    const r = solveFlow(P, groups(), kf);
    const p = r.pm - elevBar;
    return sys.prv ? Math.min(p, sys.prv) : p;
  };
  let tEff = 0, Q = 0, activeWater = false, controlledT = null, extinguished = false;
  let firstAlarm = null, flowSince = null, flowAlarm = false, brigadeT = null, brigadeArrived = false;
  let hoseOpen = false, valveClosed = !!f.valveClosed, valveClosedByFS = false, stopT = null;
  let Qprev = 0, Qspr = 0, Qhose = 0, headsOpen = 0, smoke = 0, water = 0, tAct = null;
  if (f.valveClosed) ev(0, 'warn', 'tamper', {});
  if (f.leak) ev(0, 'info', 'leakPresent', {});
  if (f.powerFail) ev(0, 'warn', 'powerFail', {});
  if (f.tankLow) ev(0, 'warn', 'tankLowStart', {});
  ev(0, 'info', 'ignition', { name: sc.name });

  let sampleIdx = 0;
  const steps = Math.round(duration / DT);
  for (let k = 0; k <= steps; k++) {
    const t = k * DT;
    // ── fire
    const floorP = floorPress(pumps.P);
    const nearOpen = heads.filter((h) => h.open && Math.hypot(h.x - sc.fire.x, h.z - sc.fire.z) < 1.6 * s);
    activeWater = !valveClosed && nearOpen.length > 0 && floorP > 0.35;
    if (activeWater) {
      const qh = kFlow(K, floorP);
      const w = Math.min(qh * nearOpen.length, qh * 4) / (cover * Math.min(nearOpen.length, 4)) / 60; // mm/s
      let tau = 3.0 * Math.pow(Math.max(w, 1e-3), -1.85);
      tau = sys.esfr ? 25 : Math.min(600, Math.max(45, tau));
      Q *= Math.exp(-DT / tau);
      if (hoseOpen) Q *= Math.exp(-DT / 40);
    } else if (hoseOpen || extinguished) {
      Q *= Math.exp(-DT / (extinguished ? 20 : 60));
    } else {
      tEff = Math.sqrt(Q / alpha) + DT;
      Q = Math.min(qMax, alpha * tEff * tEff);
    }
    if (k === 0) Q = 1;
    if (tAct !== null && controlledT === null && Q < 15) { controlledT = t; ev(t, 'info', 'controlled', {}); }
    if (controlledT !== null && !extinguished && Q < 3) { extinguished = true; ev(t, 'info', 'extinguished', {}); }
    smoke = Math.min(1, smoke + (Q / 2000) * DT * 0.05) * (Q < 15 ? 0.999 : 1);

    // ── heads (Alpert + RTI)
    let gasMax = T0;
    for (const h of heads) {
      const r = Math.max(0.3, Math.hypot(h.x - sc.fire.x, h.z - sc.fire.z));
      const [dT, u] = alpert(Q, H, r);
      const Tg = T0 + dT;
      if (r < s) gasMax = Math.max(gasMax, Tg);
      if (!h.open) {
        h.Td += DT * Math.sqrt(u) / sys.RTI * (Tg - h.Td);
        if (h.Td >= sys.Tact) {
          h.open = true; h.t = t; headsOpen++;
          tl.headTimes.push({ x: h.x, z: h.z, t });
          if (tAct === null) { tAct = t; ev(t, 'alarm', 'firstHead', { temp: sys.Tact }); }
          else ev(t, 'warn', 'headOpen', { n: headsOpen });
        }
      }
    }
    // ── detectors
    if (!f.detectorFail) {
      for (const d of dets) {
        if (d.on) continue;
        const r = Math.max(0.3, Math.hypot(d.x - sc.fire.x, d.z - sc.fire.z));
        const [dT] = alpert(Q, H, r);
        if (dT >= (sc.detector === 'heat' ? 40 : 13)) {
          d.on = true; tl.detectorTimes.push({ x: d.x, z: d.z, t });
          if (firstAlarm === null) { firstAlarm = t; ev(t, 'alarm', 'detector', { type: sc.detector ?? 'smoke' }); }
        }
      }
    }
    // ── hydraulics
    const outflow = (P) => solveFlow(P, groups(), kf).Q + kFlow(leakK, P);
    pumps.step(t, DT, outflow);
    const pf = floorPress(pumps.P);
    Qspr = !valveClosed && headsOpen ? headsOpen * kFlow(K, pf) : 0;
    Qhose = hoseOpen ? kFlow(hoseK, sys.prv ? Math.min(pf + 2, pf + 99) - 0.5 : pf - 0.5) : 0;
    Qprev = Qspr + Qhose;
    water += Qprev * DT / 60000;

    // ── alarms & fire service
    if (Qspr > 38) { if (flowSince === null) flowSince = t; } else flowSince = null;
    if (!flowAlarm && flowSince !== null && t - flowSince >= 20) {
      flowAlarm = true; ev(t, 'alarm', 'flowSwitch', {});
      if (firstAlarm === null) firstAlarm = t;
    }
    if (firstAlarm !== null && brigadeT === null) { brigadeT = firstAlarm + (sc.brigade ?? 480); ev(firstAlarm, 'info', 'brigadeCalled', {}); }
    if (brigadeT !== null && !brigadeArrived && t >= brigadeT) {
      brigadeArrived = true; ev(t, 'info', 'brigadeArrived', {});
      if (Q > 50) { hoseOpen = true; ev(t, 'warn', 'hoseOpen', {}); }
    }
    if (brigadeArrived && !valveClosedByFS && controlledT !== null && Q < 5 && t > Math.max(controlledT + 180, brigadeT + 120)) {
      valveClosedByFS = true; valveClosed = true; hoseOpen = false; stopT = t + 90;
      ev(t, 'info', 'valveClosedFS', {});
    }
    if (stopT !== null && t >= stopT) { pumps.manualStop(t); stopT = null; }

    if (Math.abs(t - sampleIdx * SAMPLE_DT) < DT / 2 && sampleIdx < tl.n) {
      record(tl, sampleIdx++, {
        t, hrr: Q, gasT: gasMax, P: pumps.P, Pfloor: Math.max(0, pf), Q: pumps.Qin, Qspr, Qhose,
        tank: pumps.tank, heads: headsOpen, jockey: pumps.jockey ? 1 : 0, main: pumps.main, diesel: pumps.diesel,
        o2: 20.9, smoke, water,
      });
    }
  }
  tl.summary = { tDetect: firstAlarm, tAct, controlledT, headsOpen, water };
  tl.events.sort((a, b) => a.t - b.t);
  return tl;
}

// ─────────────────────────────── clean agent (FM-200) ───────────────────────────────
function simCleanAgent(fac, sc, design, opts) {
  const f = opts.faults;
  const T0 = opts.ambient;
  const duration = sc.duration ?? 900;
  const tl = makeTimeline(duration);
  const ev = (t, level, key, params = {}) => tl.events.push({ t, level, key, params });
  const alpha = ALPHA[sc.fire.growth];
  const qMax = sc.fire.qMax;
  const Cd = design.concentration, Cext = design.extinguishing;
  let Q = 1, C = 0, agentLeft = design.W, state = 'normal';
  let tAlert = null, tZ1 = null, tZ2 = null, tCount = null, tDis = null, tExt = null, holdOK = true;
  const tauLeak = (f.doorOpen ? 4 : 90) * 60;
  const escape = f.doorOpen ? 0.7 : 1.0;
  let smoke = 0, extinguishTimer = 0;
  ev(0, 'info', 'ignition', { name: sc.name });
  if (f.doorOpen) ev(0, 'warn', 'doorOpen', {});
  let si = 0;
  const steps = Math.round(duration / DT);
  for (let k = 0; k <= steps; k++) {
    const t = k * DT;
    // detection – aspirating (VESDA) + point detectors, cross-zoned
    if (tAlert === null && Q >= 3) { tAlert = t; ev(t, 'warn', 'vesdaAlert', {}); }
    if (tZ1 === null && Q >= 20) { tZ1 = t; ev(t, 'alarm', 'zone1', {}); }
    if (!f.detectorFail && tZ2 === null && Q >= 45) { tZ2 = t; ev(t, 'alarm', 'zone2', {}); }
    if (f.detectorFail && tZ1 !== null && tZ2 === null && t >= tZ1 + 120) { tZ2 = t; ev(t, 'warn', 'manualRelease', {}); }
    if (tZ2 !== null && tCount === null) { tCount = t; state = 'countdown'; ev(t, 'alarm', 'preDischarge', { s: design.preDischarge }); ev(t, 'info', 'hvacShutdown', {}); }
    const abortDelay = f.abort ? 90 : 0;
    if (f.abort && tCount !== null && !tl._abort && t >= tCount + 10) { tl._abort = true; ev(t, 'warn', 'abortHeld', { s: abortDelay }); }
    if (tCount !== null && tDis === null && t >= tCount + design.preDischarge + abortDelay) {
      tDis = t; state = 'discharging'; ev(t, 'alarm', 'discharge', { kg: design.W });
    }
    if (tDis !== null) {
      const td = t - tDis;
      if (td <= 10) {
        const rate = design.W / 10;
        agentLeft = Math.max(0, design.W - rate * td);
        C = Cd * escape * (td / 10);
        if (td + DT > 10 && state === 'discharging') { state = 'hold'; ev(t, 'info', 'dischargeComplete', { c: C }); }
      } else {
        C = Cd * escape * Math.exp(-(td - 10) / tauLeak);
        if (holdOK && td > 10 && C < Cext) { holdOK = false; ev(t, 'alarm', 'concentrationLow', {}); }
        if (td >= 610 && state === 'hold') { state = 'held'; ev(t, holdOK ? 'info' : 'warn', holdOK ? 'holdComplete' : 'holdFailed', {}); }
      }
    }
    // fire
    if (C >= Cext) {
      extinguishTimer += DT;
      Q *= Math.exp(-DT / 6);
    } else if (C >= 0.6 * Cext) {
      Q = Math.max(1, Q * Math.exp(-DT / 60));
    } else {
      const te = Math.sqrt(Q / alpha) + DT;
      Q = Math.min(qMax, alpha * te * te);
    }
    if (tExt === null && tDis !== null && Q < 2) { tExt = t; ev(t, 'info', 'extinguished', {}); }
    smoke = Math.min(1, smoke + Q / 5000 * DT);
    const [dT] = alpert(Q, sc.compartment.h - 2.0, 1.0);
    if (Math.abs(t - si * SAMPLE_DT) < DT / 2 && si < tl.n) {
      record(tl, si++, {
        t, hrr: Q, gasT: T0 + dT, agent: C, o2: 20.9 * (1 - C / 100), concentrate: agentLeft, smoke,
        P: tDis === null ? 42 : Math.max(2, 42 * (agentLeft / design.W) ** 0.8),
      });
    }
  }
  delete tl._abort;
  tl.summary = { tDetect: tZ1, tAct: tDis, controlledT: tExt, state };
  tl.events.sort((a, b) => a.t - b.t);
  return tl;
}

// ─────────────────────────────── foam / deluge ───────────────────────────────
function simFoam(fac, sc, design, opts) {
  const f = opts.faults;
  const T0 = opts.ambient;
  const duration = sc.duration ?? 1800;
  const tl = makeTimeline(duration);
  const ev = (t, level, key, params = {}) => tl.events.push({ t, level, key, params });
  const sys = fac.system;
  const pumps = new PumpSet(design.pumps, f, design.water * (f.tankLow ? 0.2 : 1), ev);
  const alpha = ALPHA[sc.fire.growth];
  const qMax = sc.fire.qMax;
  const nN = design.nozzles, Kn = design.nozzleK;
  const coolK = design.cooling > 0 ? design.cooling / Math.sqrt(3.5) : 0; // cooling rings at ~3.5 bar
  const suppK = design.supplementary > 0 ? design.supplementary / Math.sqrt(7) : 0;
  const elevBar = sys.elevation * BAR_PER_M;
  let Q = 1, cov = 0, conc = design.concentrate * 1.1, tDet = null, tValve = null, tFoam = null, tSupp = null;
  let tCtrl = null, tExt = null, open = false, suppOpen = false, stopT = null, closed = false;
  let Qprev = 0, water = 0, smoke = 0;
  ev(0, 'info', 'ignition', { name: sc.name });
  if (f.powerFail) ev(0, 'warn', 'powerFail', {});
  if (f.valveClosed) ev(0, 'warn', 'tamper', {});
  const leakK = f.leak ? 1.2 : 0;
  let si = 0;
  const steps = Math.round(duration / DT);
  for (let k = 0; k <= steps; k++) {
    const t = k * DT;
    if (tDet === null && !f.detectorFail && Q >= sc.detectQ) { tDet = t + sc.detectDelay; }
    if (tDet === null && f.detectorFail && t >= 150) { tDet = t; ev(t, 'warn', 'manualRelease', {}); }
    if (tDet !== null && t >= tDet && tValve === null) {
      ev(t, 'alarm', sc.detector === 'flame' ? 'flameDetected' : 'lhdDetected', {});
      tValve = t + (sc.releaseDelay ?? 2);
    }
    if (tValve !== null && !open && t >= tValve && !closed) {
      open = true; ev(t, 'alarm', 'delugeOpen', {});
      tFoam = t + (sc.transit ?? 30);
    }
    if (tFoam !== null && t >= tFoam && tFoam > 0) { ev(t, 'info', 'foamArrives', {}); tFoam = -1; }
    if (open && tSupp === null && tExt === null && design.supplementary > 0) tSupp = t + (sc.suppDelay ?? 120);
    if (tSupp !== null && !suppOpen && t >= tSupp && !closed && tExt === null) { suppOpen = true; ev(t, 'info', 'monitorsOpen', {}); }

    const flowing = open && !f.valveClosed;
    const groups = [
      { n: flowing ? nN : 0, K: Kn, dp: elevBar + 0.7 },
      { n: flowing && coolK ? 1 : 0, K: coolK, dp: elevBar + 0.7 },
      { n: flowing && suppOpen && suppK ? 1 : 0, K: suppK, dp: 0.7 },
    ];
    const outflow = (P) => solveFlow(P, groups, design.kf).Q + kFlow(leakK, P);
    pumps.step(t, DT, outflow);
    const pn = solveFlow(pumps.P, groups, design.kf).pm - elevBar - 0.7;
    const Qsol = open && !f.valveClosed ? nN * kFlow(Kn, pn) : 0;
    const Qcool = open && !f.valveClosed ? kFlow(coolK, pn) : 0;
    const Qsupp = suppOpen && !f.valveClosed ? kFlow(suppK, pn + elevBar) : 0;
    Qprev = Qsol + Qcool + Qsupp;
    water += Qprev * DT / 60000;
    const foaming = tFoam === -1 && conc > 0 && (Qsol + Qsupp) > 0;
    if (foaming) conc = Math.max(0, conc - (Qsol + Qsupp) * design.pct / 100 * DT / 60000);
    // foam blanket coverage
    const ratio = foaming ? Math.min(1.5, (Qsol + Qsupp * 0.5) / design.solution) : 0;
    if (ratio > 0.3) cov = Math.min(1, cov + (ratio / sc.foamTau) * (1 - cov) * DT * 3);
    else cov = Math.max(0, cov - DT / 600);
    // fire
    const te = Math.sqrt(Math.max(1, Q / (1 - Math.min(cov, 0.999))) / alpha) + DT;
    const free = Math.min(qMax, alpha * te * te);
    Q = Math.max(0, free * (1 - cov));
    if (tCtrl === null && cov >= 0.9) { tCtrl = t; ev(t, 'info', 'fireControlled', {}); }
    if (tExt === null && cov >= 0.995) { tExt = t; ev(t, 'info', 'extinguished', {}); stopT = t + (sc.postTime ?? 600); }
    if (stopT !== null && t >= stopT && !closed) {
      closed = true; open = false; suppOpen = false; ev(t, 'info', 'delugeClosed', {}); stopT = t + 60;
    } else if (closed && stopT !== null && t >= stopT) { pumps.manualStop(t); stopT = null; }
    if (conc <= 0 && foaming === false && tFoam === -1 && !closed && !tl._ce) { tl._ce = true; ev(t, 'alarm', 'concentrateOut', {}); }
    smoke = Math.min(1, smoke + Q / 5e5 * DT) * (Q < 100 ? 0.998 : 1);
    if (Math.abs(t - si * SAMPLE_DT) < DT / 2 && si < tl.n) {
      record(tl, si++, {
        t, hrr: Q, gasT: T0 + Math.min(1100, 30 * Math.pow(Q / 1000, 0.6)), P: pumps.P, Pfloor: Math.max(0, pn), Q: pumps.Qin,
        Qspr: Qsol, Qhose: Qcool + Qsupp, tank: pumps.tank, jockey: pumps.jockey ? 1 : 0, main: pumps.main,
        diesel: pumps.diesel, foam: Qsol + Qsupp, coverage: cov, concentrate: conc, smoke, water, o2: 20.9,
      });
    }
  }
  delete tl._ce;
  tl.summary = { tDetect: tDet, tAct: tValve, controlledT: tCtrl, tExt, water };
  tl.events.sort((a, b) => a.t - b.t);
  return tl;
}

export function scenarioSystem(fac, sc) {
  return { ...fac.system, ...(sc.override || {}) };
}

export function runScenario(fac, sc, design, opts) {
  const o = { ambient: 25, faults: {}, ...opts };
  fac = { ...fac, system: scenarioSystem(fac, sc) };
  if (fac.system.kind === 'cleanAgent') return simCleanAgent(fac, sc, design, o);
  if (fac.system.kind === 'foam') return simFoam(fac, sc, design, o);
  return simSprinkler(fac, sc, design, o);
}

export function sampleAt(tl, t) {
  const i = Math.max(0, Math.min(tl.n - 1, Math.round(t / SAMPLE_DT)));
  const out = {};
  for (const f of FIELDS) out[f] = tl.data[f][i];
  return out;
}
