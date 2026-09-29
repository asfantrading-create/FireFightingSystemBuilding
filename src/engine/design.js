// Engineering design calculations used by the simulator.
// All internal units are SI: flow L/min, pressure bar, length m, area m², volume m³, temperature °C.
// Methods follow NFPA 13 (sprinklers), NFPA 14 (standpipes), NFPA 20 (fire pumps),
// NFPA 2001 (clean agents), NFPA 11 (foam) and NFPA 409 (hangars). Values are
// educational reference designs, not a substitute for a licensed engineer's design.

export const GPM = 3.78541;       // L/min per US gpm
export const PSI = 0.0689476;     // bar per psi
export const BAR_PER_M = 0.0981;  // static head of water, bar per metre

// NFPA 13 density/area method (metric equivalents of 0.10/1500 … 0.40/2500 gpm/ft² over ft²)
export const HAZARDS = {
  LH:  { code: 'LH',  density: 4.1,  area: 139, maxCoverage: 20.9, hose: 379,  duration: 30,  name: { en: 'Light Hazard', ar: 'خطورة خفيفة' } },
  OH1: { code: 'OH1', density: 6.1,  area: 139, maxCoverage: 12.1, hose: 946,  duration: 60,  name: { en: 'Ordinary Hazard Group 1', ar: 'خطورة عادية – مجموعة 1' } },
  OH2: { code: 'OH2', density: 8.1,  area: 139, maxCoverage: 12.1, hose: 946,  duration: 90,  name: { en: 'Ordinary Hazard Group 2', ar: 'خطورة عادية – مجموعة 2' } },
  EH1: { code: 'EH1', density: 12.2, area: 232, maxCoverage: 9.3,  hose: 1893, duration: 90,  name: { en: 'Extra Hazard Group 1', ar: 'خطورة عالية – مجموعة 1' } },
  EH2: { code: 'EH2', density: 16.3, area: 232, maxCoverage: 9.3,  hose: 1893, duration: 120, name: { en: 'Extra Hazard Group 2', ar: 'خطورة عالية – مجموعة 2' } },
};

// t² fire growth coefficients, kW/s²
export const ALPHA = { slow: 0.00293, medium: 0.01172, fast: 0.0469, ultrafast: 0.1876 };

// Listed fire-pump sizes (US gpm) per NFPA 20
const PUMP_SIZES_GPM = [250, 300, 400, 450, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

// Hazen–Williams friction loss, SI form: bar per metre (Q L/min, d mm)
export function hazenWilliams(Q, d, C = 120) {
  if (Q <= 0) return 0;
  return 6.05e5 * Math.pow(Q, 1.85) / (Math.pow(C, 1.85) * Math.pow(d, 4.87));
}

export const kFlow = (K, P) => K * Math.sqrt(Math.max(0, P));   // Q = K √P
export const kPressure = (K, Q) => (Q / K) ** 2;                 // P = (Q/K)²

// FM-200 (HFC-227ea) specific vapour volume, m³/kg (NFPA 2001)
export const fm200SpecificVolume = (T) => 0.1269 + 0.0005131 * T;
// Agent quantity W = (V/S)·(C/(100−C))
export const fm200Quantity = (V, T, C) => (V / fm200SpecificVolume(T)) * (C / (100 - C));

function selectPump(flowLpm) {
  const gpm = flowLpm / GPM;
  const size = PUMP_SIZES_GPM.find((s) => s >= gpm) ?? PUMP_SIZES_GPM[PUMP_SIZES_GPM.length - 1];
  return size;
}

const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/**
 * Build the pump set shared by every system type.
 * @param {number} demandFlow   L/min required at the pump discharge
 * @param {number} demandP      bar required at the pump discharge
 * @param {number} suctionP     bar available at pump suction (flooded suction head)
 */
export function designPumps(demandFlow, demandP, suctionP = 0.3, smallestOutletFlow = 200) {
  // Above the largest listed size, split the duty between identical pumps in parallel
  const count = Math.max(1, Math.ceil(demandFlow / GPM / 5000));
  const ratedGpm = selectPump(demandFlow / count);
  const rated = ratedGpm * GPM;
  // Rated pressure: required net pressure + 5 % margin, rounded up to 0.5 bar
  const ratedP = Math.ceil(((demandP - suctionP) * 1.05) / 0.5) * 0.5;
  const churnP = ratedP * 1.2;             // NFPA 20: churn ≤ 140 % of rated
  const at150 = churnP - (churnP - ratedP) * 2.25; // quadratic curve → pressure at 150 % flow
  const jockeyStop = churnP + suctionP;
  const jockeyStart = jockeyStop - 10 * PSI;
  const mainStart = jockeyStart - 5 * PSI;
  const dieselStart = mainStart - 10 * PSI;
  const jockeyFlow = Math.min(0.03 * rated * count, 0.8 * smallestOutletFlow);
  // Brake power peaks near 150 % flow (1.5 Q × 0.75 P ≈ 1.125 Q·P); 70 % efficiency
  const motorKw = (rated / 60000) * (ratedP * 1e5) * 1.125 / 0.7 / 1000;
  return {
    count, ratedGpm, rated: round(rated, 0), ratedP: round(ratedP, 1), churnP: round(churnP, 1),
    at150Pct: round(at150, 1), at150PctRatio: round(at150 / ratedP, 2),
    suctionP, jockeyStop: round(jockeyStop, 2), jockeyStart: round(jockeyStart, 2),
    mainStart: round(mainStart, 2), dieselStart: round(dieselStart, 2),
    jockeyFlow: round(jockeyFlow, 0), motorKw: Math.ceil(motorKw / 5) * 5,
  };
}

/** Sprinkler (wet / ESFR / pre-action) design per NFPA 13 density/area or ESFR tables. */
export function designSprinkler(sys) {
  const steps = [];
  let heads, qHead, pHead, area, density;
  if (sys.esfr) {
    heads = sys.esfr.heads;              // ESFR: 12 most demanding heads
    pHead = sys.esfr.minP;
    qHead = kFlow(sys.K, pHead);
    area = heads * sys.spacing * sys.spacing;
    density = qHead / (sys.spacing * sys.spacing);
    steps.push({ k: 'esfr', v: `${heads} × K${sys.K} @ ${pHead} bar` });
  } else {
    const hz = HAZARDS[sys.hazard];
    density = hz.density; area = hz.area;
    const coverage = sys.spacing * sys.spacing;
    heads = Math.ceil(area / coverage);
    const qMin = density * coverage;
    pHead = Math.max(0.5, kPressure(sys.K, qMin));
    qHead = kFlow(sys.K, pHead);
    steps.push({ k: 'density', v: `${density} mm/min × ${round(coverage, 1)} m² = ${round(qMin, 0)} L/min` });
    steps.push({ k: 'headP', v: `P = (Q/K)² = (${round(qMin, 0)}/${sys.K})² = ${round(pHead, 2)} bar` });
  }
  const hz = HAZARDS[sys.hazard] || HAZARDS.EH2;
  const imbalance = 1.12; // hydraulically remote heads flow more than minimum
  const sprFlow = heads * qHead * imbalance;
  const hose = sys.hose ?? hz.hose;
  const duration = sys.duration ?? hz.duration;
  const mainLoss = hazenWilliams(sprFlow, sys.mainDia, 120) * sys.mainLength * 1.2; // +20 % fittings
  const elev = sys.elevation * BAR_PER_M;
  const demandP = pHead + mainLoss + elev + 0.5; // +0.5 bar alarm valve & branch losses
  let standpipe = null;
  let pumpFlow = sprFlow + (sys.insideHose ? hose : 0);
  let pumpP = demandP;
  if (sys.standpipe) {
    const sp = sys.standpipe;
    const flow = Math.min(1893 + 946 * (sp.count - 1), 3785); // 500 gpm + 250 each additional ≤ 1000 gpm
    const topP = 6.9 + sp.zoneHeight * BAR_PER_M + hazenWilliams(flow, sp.dia, 120) * sp.zoneHeight * 1.2;
    standpipe = { flow: round(flow, 0), topP: round(topP, 1), count: sp.count, zones: sp.zones, zoneHeight: sp.zoneHeight };
    // NFPA 14: in a fully sprinklered building the standpipe demand includes the sprinkler demand
    pumpFlow = Math.max(pumpFlow, flow);
    pumpP = Math.max(pumpP, topP);
  }
  const totalFlow = sprFlow + hose;
  // Storage: sprinkler + hose for the NFPA 13 duration, or standpipe demand for 30 min (NFPA 14)
  const storage = Math.max(totalFlow * duration, standpipe ? standpipe.flow * 30 : 0);
  const tank = Math.ceil(storage / 1000 / 5) * 5; // m³, rounded up to 5
  const pumps = designPumps(pumpFlow, pumpP, sys.suctionP ?? 0.3, qHead);
  // Friction coefficient used by the simulator: loss = kf · Q^1.85
  const kf = mainLoss / Math.pow(sprFlow, 1.85);
  steps.push({ k: 'sprFlow', v: `${heads} × ${round(qHead, 0)} L/min × ${imbalance} = ${round(sprFlow, 0)} L/min` });
  steps.push({ k: 'friction', v: `Hazen–Williams DN${sys.mainDia}, ${sys.mainLength} m → ${round(mainLoss, 2)} bar` });
  steps.push({ k: 'elev', v: `${sys.elevation} m × 0.0981 = ${round(elev, 2)} bar` });
  steps.push({ k: 'demand', v: `${round(sprFlow, 0)} L/min @ ${round(demandP, 1)} bar` });
  steps.push({ k: 'tank', v: standpipe && standpipe.flow * 30 > totalFlow * duration
    ? `${standpipe.flow} L/min × 30 min (standpipe) = ${tank} m³`
    : `(${round(sprFlow, 0)} + ${hose}) × ${duration} min = ${tank} m³` });
  return {
    type: 'sprinkler', density: round(density, 1), area: round(area, 0), heads,
    qHead: round(qHead, 0), pHead: round(pHead, 2), sprFlow: round(sprFlow, 0), hose, duration,
    mainLoss: round(mainLoss, 2), elevLoss: round(elev, 2), demandP: round(demandP, 1),
    totalFlow: round(totalFlow, 0), tank, pumps, standpipe, kf, steps,
  };
}

/** FM-200 total-flooding design per NFPA 2001. */
export function designCleanAgent(sys) {
  const V = sys.room.l * sys.room.w * sys.room.h;
  const S = fm200SpecificVolume(sys.designTemp);
  const W = fm200Quantity(V, sys.designTemp, sys.concentration);
  const cylSize = 180, fill = 1.0;          // 180 L cylinders at ≤1.15 kg/L; design fill 1.0 kg/L
  const perCyl = cylSize * fill;
  const cylinders = Math.ceil(W / perCyl);
  const nozzles = Math.max(1, Math.ceil((sys.room.l * sys.room.w) / 90));
  const flowRate = W / 10; // kg/s — discharge ≤ 10 s
  return {
    type: 'cleanAgent', volume: round(V, 0), S: round(S, 5), W: round(W, 1), cylinders, cylSize, perCyl,
    nozzles, flowRate: round(flowRate, 1), concentration: sys.concentration, noael: 9.0,
    extinguishing: round(sys.concentration / 1.2, 2), holdTime: 10, preDischarge: sys.preDischarge ?? 30,
    steps: [
      { k: 'volume', v: `V = ${sys.room.l} × ${sys.room.w} × ${sys.room.h} = ${round(V, 0)} m³` },
      { k: 'S', v: `S = 0.1269 + 0.0005131 × ${sys.designTemp} = ${round(S, 5)} m³/kg` },
      { k: 'W', v: `W = (${round(V, 0)}/${round(S, 5)}) × (${sys.concentration}/(100 − ${sys.concentration})) = ${round(W, 1)} kg` },
      { k: 'cyl', v: `${cylinders} × ${cylSize} L cylinders (≈${perCyl} kg each)` },
    ],
  };
}

/** Foam (tank rim-seal / full-surface) and foam-water deluge designs. */
export function designFoam(sys) {
  let area, rate = sys.rate, duration = sys.duration, desc;
  if (sys.mode === 'rimSeal') {
    const D = sys.tankD, w = sys.sealWidth;
    area = (Math.PI / 4) * (D * D - (D - 2 * w) ** 2);
    desc = `π/4 × (${D}² − ${round(D - 2 * w, 1)}²) = ${round(area, 1)} m²`;
  } else if (sys.mode === 'fullSurface') {
    area = (Math.PI / 4) * sys.tankD ** 2;
    desc = `π/4 × ${sys.tankD}² = ${round(area, 0)} m²`;
  } else {
    area = sys.area;
    desc = `${sys.zones} zones × ${round(sys.area / sys.zones, 0)} m² = ${round(area, 0)} m²`;
  }
  const solution = area * rate;                         // L/min
  const cooling = sys.cooling ?? 0;                     // L/min water for exposures
  const supplementary = sys.supplementary ?? 0;         // L/min hose streams / monitors
  const totalFlow = solution + cooling + supplementary;
  const solutionVol = (solution * duration + supplementary * (sys.suppDuration ?? 30)) / 1000;
  const concentrate = solutionVol * sys.pct / 100;
  const water = (totalFlow * (sys.waterDuration ?? duration)) / 1000;
  const K = sys.nozzleK;
  const pNozzle = sys.nozzleP;
  const nozzles = Math.ceil(solution / kFlow(K, pNozzle));
  const pipeLoss = hazenWilliams(totalFlow, sys.mainDia, 120) * sys.mainLength * 1.2;
  const demandP = pNozzle + pipeLoss + sys.elevation * BAR_PER_M + 0.7; // + proportioner loss
  const pumps = designPumps(totalFlow, demandP, sys.suctionP ?? 0.5, kFlow(K, pNozzle));
  return {
    type: 'foam', mode: sys.mode, area: round(area, 1), rate, duration, solution: round(solution, 0),
    cooling: round(cooling, 0), supplementary, totalFlow: round(totalFlow, 0),
    solutionVol: round(solutionVol, 1), concentrate: round(concentrate, 2), pct: sys.pct,
    water: Math.ceil(water / 5) * 5, nozzles, nozzleK: K, nozzleP: pNozzle, pipeLoss: round(pipeLoss, 2),
    demandP: round(demandP, 1), pumps, kf: pipeLoss / Math.pow(totalFlow, 1.85),
    steps: [
      { k: 'area', v: desc },
      { k: 'solution', v: `${round(area, 1)} m² × ${rate} L/min·m² = ${round(solution, 0)} L/min` },
      { k: 'concentrate', v: `${round(solutionVol, 1)} m³ × ${sys.pct}% = ${round(concentrate, 2)} m³` },
      { k: 'total', v: `${round(solution, 0)} + ${round(cooling, 0)} + ${supplementary} = ${round(totalFlow, 0)} L/min` },
      { k: 'demand', v: `${round(totalFlow, 0)} L/min @ ${round(demandP, 1)} bar` },
    ],
  };
}

export function designSystem(sys) {
  if (sys.kind === 'cleanAgent') return designCleanAgent(sys);
  if (sys.kind === 'foam') return designFoam(sys);
  return designSprinkler(sys);
}

export function toUS(val, unit) {
  switch (unit) {
    case 'L/min': return `${round(val / GPM, 0)} gpm`;
    case 'bar': return `${round(val / PSI, 0)} psi`;
    case 'm³': return `${round(val * 264.172, 0)} gal`;
    case 'm': return `${round(val * 3.28084, 1)} ft`;
    case 'm²': return `${round(val * 10.7639, 0)} ft²`;
    case 'mm/min': return `${round(val / 40.746, 2)} gpm/ft²`;
    default: return '';
  }
}
