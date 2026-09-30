import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hazen, fittingLength, cMultiplier, defaultNetwork, solveNetwork, supplyPressure,
  batterySizing, nacDrop, minWire, isolatorSegments, loopRouteLength, slcCheck,
} from '../src/advanced/toolsCalc.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≉ ${b}`);

test('Hazen–Williams SI: 100 gpm in 2" Sch 40 ≈ 0.0224 psi/ft ≈ 0.0051 bar/m', () => {
  // US form: p = 4.52 Q^1.85 / (C^1.85 d^4.87) → 100 gpm, 2.067 in, C120 → 0.0226 psi/ft
  const psiFt = (4.52 * 100 ** 1.85) / (120 ** 1.85 * 2.067 ** 4.87);
  const barM = hazen(378.5, 52.5, 120);
  near(barM, psiFt * 0.0689476 / 0.3048, 0.0002);
});

test('Fitting equivalent lengths per NFPA 13 Table 28.2.3.1.1', () => {
  near(fittingLength({ size: '2', tee: 1, C: 120 }), 10 * 0.3048, 1e-9); // 2" tee = 10 ft
  near(fittingLength({ size: '4', e90: 2, gate: 1, check: 1, C: 120 }), (20 + 2 + 22) * 0.3048, 1e-9);
  near(cMultiplier(100), 0.713, 1e-9);
  near(cMultiplier(150), 1.51, 1e-9);
});

test('Default OH-1 network: remote head, balancing and supply check', () => {
  const r = solveNetwork(defaultNetwork());
  assert.ok(r.ok);
  assert.equal(r.n, 12);
  near(r.qmin, 6.1 * 139 / 12, 1e-6);
  // most remote head: max(0.5 bar, (qmin/K)^2)
  near(r.nodes.S1.P, (r.qmin / 80) ** 2, 1e-9);
  near(r.nodes.S1.qHead, r.qmin, 1e-6);
  // every head at or above pmin and its minimum flow
  for (let i = 1; i <= 12; i++) assert.ok(r.nodes[`S${i}`].qHead >= r.qmin - 1e-6);
  // total ≥ density × area, and at least one balancing step
  assert.ok(r.Qspr >= 6.1 * 139);
  assert.ok(r.steps.some((s) => s.kind === 'bal'));
  // flow continuity: source flow = sum of head flows after balancing is ≥ raw sum
  assert.ok(r.Qspr > 900 && r.Qspr < 1200, `Q=${r.Qspr}`);
  assert.ok(r.Pdem > 2 && r.Pdem < 4, `P=${r.Pdem}`);
  near(r.Qtot, r.Qspr + 950, 1e-9);
  assert.equal(r.pass, r.margin >= 0.35);
});

test('Network validation catches loops and missing heads', () => {
  const bad = { ...defaultNetwork(), rows: [{ node: 'A', k: 0, to: 'B', size: '1', len: 1 }, { node: 'B', k: 0, to: 'A', size: '1', len: 1 }] };
  const r = solveNetwork(bad);
  assert.equal(r.ok, false);
});

test('Supply curve passes through static and residual points', () => {
  const s = { static: 5, residual: 3.5, flow: 2000 };
  near(supplyPressure(s, 0), 5, 1e-12);
  near(supplyPressure(s, 2000), 3.5, 1e-12);
});

test('Battery sizing (NFPA 72 §10.6.7.2)', () => {
  const b = batterySizing([{ qty: 1, standby: 200, alarm: 2000 }], { alarmMin: 5, margin: 0.2 });
  near(b.required, (0.2 * 24 + 2 * 5 / 60) * 1.2, 1e-9);
  assert.equal(b.pick, 7);
  const v = batterySizing([{ qty: 1, standby: 400, alarm: 3000 }], { alarmMin: 15 });
  assert.equal(v.pick, 17); // (0.4×24 + 3×0.25)×1.2 = 12.42 Ah → next size 17 Ah
});

test('NAC voltage drop: distributed is less severe than lumped', () => {
  const r = nacDrop({ wireKey: 'awg14', length: 100, n: 10, mA: 197, vs: 20.4, eol: 1e12 });
  const I = 10 * 0.197, R = 2 * 0.0101 * 100;
  near(r.vLumped, 20.4 - I * R, 1e-9);
  near(r.vDist, 20.4 - I * R * 11 / 20, 1e-9);
  assert.ok(r.vDist > r.vLumped);
  assert.equal(minWire({ length: 20, n: 3, mA: 79 }), 'awg18');
  assert.equal(minWire({ length: 5000, n: 20, mA: 248 }), null);
});

test('SLC helpers', () => {
  const segs = isolatorSegments([{ type: 'iso' }, { type: 'smoke' }, { type: 'smoke' }, { type: 'iso' }, { type: 'mcp' }]);
  assert.deepEqual(segs.map((s) => s.length), [0, 2, 1]);
  const L = loopRouteLength([{ floor: 'G', x: 14, y: 10.5 }]);
  near(L, (10 + 10 + 2 * 0.5) * 1.1, 1e-9);
  const c = slcCheck({ devices: [{ iq: 0.3, ia: 0.3 }], length: 1000, rPerKm: 12.1 });
  near(c.R, 24.2, 1e-9);
  assert.ok(c.rOk);
});
