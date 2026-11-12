// Design check for every hour: does it need its mechanics? Usage: node tools/analyze.cjs [level id]
// best: shortest solution. no SHIFT: must be unsolvable (the bell may still shift you). Without the previous
// shift and without the hazards the best route should change, or the mechanic does not matter.
// reticle: the shortest way that also picks up the reticle.
const core = require('../src/core.js');
const {LEVELS} = require('../src/levels.js');
const fmt = sol => sol === 'gave up' ? 'too many states' : sol ? `${sol.length} steps, ${sol.filter(a => a === 'shift').length} shifts` : 'unsolvable';
const tryS = (L, o) => { try { return core.solve(L, o); } catch (_) { return 'gave up'; } };
const only = process.argv[2];
for (const def of LEVELS) {
  if (only && def.id !== only) continue;
  const t0 = Date.now(), L = core.parseLevel(def), best = tryS(L);
  const noShift = tryS(L, {noShift: true});
  const calm = core.parseLevel({...def, patrols: [], night: def.night.map(r => r.replace(/V/g, '.'))});
  const safe = core.parseLevel({...def, beams: [], heat: null, pulses: [], bell: 0});
  const noEnemies = tryS(calm), noHazards = tryS(safe), ret = L.reticle ? tryS(L, {reticle: true}) : null;
  console.log(`${def.time} ${def.id}  best ${fmt(best)} | no SHIFT ${noShift ? (noShift === 'gave up' ? '?' : 'SOLVABLE ') + fmt(noShift) : 'unsolvable'} | ` +
    `without them ${fmt(noEnemies)} | without hazards ${fmt(noHazards)} | with reticle ${fmt(ret)}  (${Date.now() - t0} ms)`);
}
