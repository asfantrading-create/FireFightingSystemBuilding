// Smart Systems Lab engine tests (addressable FACP, loop topology, cause & effect, grading).
import test from 'node:test';
import assert from 'node:assert/strict';
import { FireSystem, gradeMatrix, typicalMatrix, emptyMatrix, batteryCalc, systemLoads } from '../src/advanced/system.js';

const run = (s, sec) => { for (let i = 0; i < sec * 5; i++) s.step(0.2); };
const find = (s, fn) => s.devices.find(fn);

test('healthy project starts with no events', () => {
  const s = new FireSystem();
  assert.equal(s.sortedEvents().length, 0);
  assert.ok(s.devices.length > 50);
});

test('smoke test raises FIRE at the right address and latches until reset', () => {
  const s = new FireSystem();
  const d = find(s, (x) => x.floor === '1' && x.room === 'off3');
  s.test(d.id, 'smoke'); run(s, 15);
  assert.ok(s.events.has(`fire:${d.id}`));
  s.endTest(d.id); run(s, 30);
  assert.ok(s.events.has(`fire:${d.id}`), 'fire events latch');
  s.reset(); assert.ok(s.events.has(`fire:${d.id}`), 'reset needs access level 2');
  s.accessLevel = 2; s.reset(); run(s, 1);
  assert.ok(!s.events.has(`fire:${d.id}`));
});

test('Class A survives one open circuit, Class B loses the devices beyond it', () => {
  const s = new FireSystem();
  s.cut(10); run(s, 1);
  assert.equal(s.devices.filter((d) => !d.comm).length, 0);
  s.setClass('B'); run(s, 1);
  assert.equal(s.devices.filter((d) => !d.comm).length, s.devices.length - 10);
});

test('isolators contain a short circuit to one section', () => {
  const s = new FireSystem();
  s.shortSeg(5); run(s, 1);
  const lost = s.devices.filter((d) => !d.comm);
  assert.ok(lost.length > 0 && lost.length < 25);
  assert.ok(lost.every((d) => d.floor === 'G'));
});

test('double address and unprogrammed device are reported', () => {
  const s = new FireSystem();
  const [a, b] = s.devices.filter((d) => d.type === 'smoke');
  s.setAddr(b.id, a.addr); run(s, 1);
  assert.ok([...s.events.keys()].some((k) => k.startsWith('trb:dup')));
  const n = s.addDevice({ type: 'smoke', floor: 'G', x: 10, y: 10, room: 'cor', label: { en: 'x', ar: 'x' }, addr: 150 }); run(s, 1);
  assert.ok(s.events.has(`trb:unprog:${n.id}`));
  s.setAddr(b.id, 149); s.autolearn(); run(s, 1);
  assert.ok(![...s.events.keys()].some((k) => k.startsWith('trb:unprog') || k.startsWith('trb:dup')));
});

test('cross-zoned server room: one detector = pre-discharge only, both = delayed FM-200 release', () => {
  const s = new FireSystem();
  s.test(find(s, (d) => d.zone === 'SR-A').id, 'smoke'); run(s, 15);
  assert.equal(s.outputs().fm, 'pre');
  s.test(find(s, (d) => d.zone === 'SR-B').id, 'smoke'); run(s, 12);
  assert.ok(s.outputs().fmDelay > 0, 'countdown running');
  run(s, 35);
  assert.equal(s.outputs().fm, 'discharged');
});

test('lobby detector on the recall floor sends the lift to the alternate floor', () => {
  const s = new FireSystem();
  s.test(find(s, (d) => d.floor === 'G' && d.room === 'lobby').id, 'smoke'); run(s, 30);
  assert.equal(s.lift.mode, 'recalled');
  assert.equal(s.lift.target, 1);
});

test('tamper is supervisory (no evacuation) and restores', () => {
  const s = new FireSystem();
  const t = find(s, (d) => d.type === 'tamper');
  s.test(t.id, 'tamper'); run(s, 2);
  assert.equal(s.count('super'), 1); assert.equal(s.count('fire'), 0);
  assert.ok(Object.values(s.outputs().voice).every((v) => v === 'off'));
  s.endTest(t.id); run(s, 1);
  assert.equal(s.count('super'), 0);
});

test('Contact-ID reports go out for fire when the matrix signals Civil Defense', () => {
  const s = new FireSystem();
  s.test(find(s, (d) => d.type === 'mcp').id, 'mcp'); run(s, 2);
  assert.ok(s.cid.some((c) => c.code === 115 && c.q === 1));
});

test('matrix grading: typical passes, empty fails, single-detector FM-200 release is flagged', () => {
  assert.ok(gradeMatrix(typicalMatrix()).score >= 90);
  assert.ok(gradeMatrix(emptyMatrix()).score < 30);
  const m = typicalMatrix(); m.srOne.fmRelease = 1;
  const g = gradeMatrix(m);
  assert.ok(g.findings.some((f) => f.level === 'error' && /single detector/.test(f.text.en)));
});

test('battery sizing: 24 h standby + 5 min alarm with 20 % margin', () => {
  const r = batteryCalc({ standbyA: 0.5, alarmA: 3 });
  assert.ok(Math.abs(r.ah - (0.5 * 24 + 3 / 12) * 1.2) < 1e-9);
  assert.equal(r.pick, 17);
  const s = new FireSystem();
  const l = systemLoads(s);
  assert.ok(l.alarmA > l.standbyA);
});
