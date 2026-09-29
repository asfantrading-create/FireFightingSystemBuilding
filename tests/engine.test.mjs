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
