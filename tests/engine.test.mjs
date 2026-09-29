import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACILITIES } from '../src/data/facilities.js';
import { designSystem, fm200Quantity, hazenWilliams } from '../src/engine/design.js';
import { runScenario, scenarioSystem } from '../src/engine/sim.js';

test('FM-200 worked example (NFPA 2001)', () => {
  const W = fm200Quantity(240, 20, 7);
  assert.ok(Math.abs(W - 131.7) < 0.3, `W=${W}`);
});

test('Hazen-Williams SI sanity', () => {
  // 1000 L/min in DN100 steel C=120 ≈ 0.005 bar/m (0.022 psi/ft)
  const p = hazenWilliams(1000, 100, 120);
  assert.ok(p > 0.004 && p < 0.007, `p=${p}`);
});

for (const fac of FACILITIES) {
  for (const sc of fac.scenarios) {
    test(`${fac.id}/${sc.id} simulates and suppresses`, () => {
      const d = designSystem(scenarioSystem(fac, sc));
      const tl = runScenario(fac, sc, d, { ambient: fac.ambient, faults: {} });
      const s = tl.summary;
      console.log(fac.id, sc.id, JSON.stringify({ pumps: d.pumps && { n: d.pumps.count, gpm: d.pumps.ratedGpm, P: d.pumps.ratedP }, tank: d.tank ?? d.water, W: d.W, ...s }),
        tl.events.map((e) => `${e.t.toFixed(0)}:${e.key}`).join(' '));
      assert.ok(s.tAct !== null, 'system actuated');
      assert.ok(s.controlledT !== null, 'fire controlled');
    });
  }
}

test('closed valve lets the fire grow', () => {
  const fac = FACILITIES[0], sc = fac.scenarios[0];
  const d = designSystem(scenarioSystem(fac, sc));
  const tl = runScenario(fac, sc, d, { ambient: 24, faults: { valveClosed: true } });
  assert.ok(tl.events.some((e) => e.key === 'tamper'));
});

test('power failure starts diesel', () => {
  const fac = FACILITIES[1], sc = fac.scenarios[0];
  const d = designSystem(scenarioSystem(fac, sc));
  const tl = runScenario(fac, sc, d, { ambient: 38, faults: { powerFail: true } });
  assert.ok(tl.events.some((e) => e.key === 'dieselRunning'));
});

import { applyEdits, designWithEdits } from '../src/engine/edits.js';

test('user edits change the design and flag non-compliance', () => {
  const fac = FACILITIES[0], sc = fac.scenarios[0];
  const edits = { 'sys.spacing': 4.8, 'sys.K': 115, 'fire.qMax': 5000 };
  const eff = applyEdits(fac, sc, edits);
  assert.equal(eff.fac.system.spacing, 4.8);
  assert.equal(eff.sc.fire.qMax, 5000);
  assert.equal(fac.system.spacing, 4.0, 'reference facility untouched');
  const d = designWithEdits(scenarioSystem(eff.fac, eff.sc), edits);
  assert.ok(d.checks.some((c) => !c.ok && /Spacing/.test(c.en)));
  const tl = runScenario(eff.fac, eff.sc, d, { ambient: 24, faults: {} });
  assert.ok(tl.summary.tAct !== null);
});

test('pump and tank overrides are honoured', () => {
  const fac = FACILITIES[1], sc = fac.scenarios[0];
  const edits = { 'pump.gpm': 2500, 'pump.P': 7, tank: 700 };
  const eff = applyEdits(fac, sc, edits);
  const d = designWithEdits(scenarioSystem(eff.fac, eff.sc), edits);
  assert.equal(d.pumps.ratedGpm, 2500);
  assert.equal(d.pumps.ratedP, 7);
  assert.equal(d.tank, 700);
});

test('clean agent room edit recomputes FM-200 quantity', () => {
  const fac = FACILITIES[2], sc = fac.scenarios[0];
  const edits = { 'sys.room.l': 10, 'sys.room.w': 8, 'sys.room.h': 3 };
  const eff = applyEdits(fac, sc, edits);
  const d = designWithEdits(scenarioSystem(eff.fac, eff.sc), edits);
  assert.ok(Math.abs(d.W - 131.7) < 0.3, `W=${d.W}`);
});
