// Prints every level side by side (day | night) with the solver's shortest solution.
// Usage: node tools/levels-report.cjs [level id]
const core = require('../src/core.js');
const {LEVELS} = require('../src/levels.js');

const only = process.argv[2];
for (const def of LEVELS) {
  if (only && def.id !== only) continue;
  const level = core.parseLevel(def);
  console.log(`\n${def.time} ${def.title.en}  (enemies ${level.enemyStarts.length}, every ${level.enemyEvery} steps, bell ${level.bell || '-'})`);
  for (let y = 0; y < core.H; y++) console.log(`  ${def.day[y]}   ${def.night[y]}`);
  const t0 = Date.now();
  const sol = core.solve(level);
  const ms = Date.now() - t0;
  if (!sol) { console.log(`  UNSOLVABLE (${ms} ms)`); continue; }
  const shifts = sol.filter(a => a === 'shift').length;
  console.log(`  solved in ${sol.length} steps, ${shifts} shifts, ${ms} ms`);
  console.log('  ' + sol.map(a => ({up: 'U', down: 'D', left: 'L', right: 'R', shift: 'S', wait: '.'})[a]).join(''));
}
