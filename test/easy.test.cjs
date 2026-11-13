// The calm mode: gentler rules for the same hours. Every hour must stay solvable in it, and it must be gentler.
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
const {LEVELS} = require('../src/levels.js');

test('the calm mode is gentler: slower rounds, a longer ring, an earlier bell warning, noticing only from closer', () => {
  for (const d of LEVELS) {
    const n = core.parseLevel(d), e = core.parseLevel(d, {easy: true});
    assert.ok(e.grace > n.grace && e.alertRadius < n.alertRadius, d.id);
    n.patrols.forEach((p, i) => assert.ok(e.patrols[i].every > p.every, `${d.id} patrol ${i}`));
    if (d.bell) assert.ok(core.bellWarning(d.bell, true) > core.bellWarning(d.bell), d.id);
  }
});

for (const d of LEVELS) {
  test(`${d.time} is solvable in the calm mode too, and still needs SHIFT`, () => {
    const L = core.parseLevel(d, {easy: true});
    const sol = core.solve(L);
    assert.ok(sol, `${d.id} calm`);
    const s = core.newState(L);
    for (const a of sol) core.step(s, a);
    assert.equal(s.status, 'won');
    assert.equal(core.solve(L, {noShift: true}), null, `${d.id}: calm without SHIFT`);
  });
}
