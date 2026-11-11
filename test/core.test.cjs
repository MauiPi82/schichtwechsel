// Rules, physics and solvability. Run: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
const {LEVELS, ENDING} = require('../src/levels.js');

const levels = LEVELS.map(d => core.parseLevel(d));
const play = (level, actions) => { const s = core.newState(level); for (const a of actions) core.step(s, a); return s; };

test('every level has texts in both languages', () => {
  for (const d of LEVELS) {
    for (const key of ['title', 'log', 'fact', 'hint']) for (const l of ['de', 'en']) assert.ok(d[key] && d[key][l], `${d.id} ${key} ${l}`);
    if (d.route) for (const r of d.route) assert.ok(r.de && r.en, `${d.id} route`);
    assert.equal(d.route ? d.route.length : 0, core.parseLevel(d).stations.length, `${d.id}: route names match stations`);
  }
  assert.equal(ENDING.log.de.length, ENDING.log.en.length);
});

for (const level of levels) {
  test(`${level.time} ${level.title.en} is solvable and the solution replays`, () => {
    const solution = core.solve(level);
    assert.ok(solution, 'solver found a way');
    const s = play(level, solution);
    assert.equal(s.status, 'won');
    assert.equal(s.got, level.stations.length);
  });
}

test('implanter beam follows r = sqrt(2mE)/(qB): heavier ions bend less', () => {
  const beam = levels.find(l => l.beams.length).beams[0];
  const r = Object.fromEntries(beam.phases.map(p => [p.species, p.radiusMeters]));
  // 40 keV, 0.25 T: boron 11 u, phosphorus 31 u, arsenic 75 u
  assert.ok(Math.abs(r.B - 0.382) < 0.002, `B ${r.B}`);
  assert.ok(Math.abs(r.P - 0.641) < 0.002, `P ${r.P}`);
  assert.ok(Math.abs(r.As - 0.997) < 0.003, `As ${r.As}`);
  assert.ok(Math.abs(r.As / r.B - Math.sqrt(75 / 11)) < 1e-9, 'radius scales with the square root of the mass');
  for (const p of beam.phases) assert.ok(p.cells.some(Boolean), `${p.species} beam crosses the floor`);
});

test('a shift into a solid tile is refused, a shift onto the previous shift is fatal', () => {
  const def = {
    id: 't1', time: '', title: {}, day: [
      '####################', '#P.................#', '#..................#', '#..................#', '#..................#',
      '#..................#', '#..................#', '#..................#', '#.................X#', '####################'],
    night: [
      '####################', '##.................#', '#..................#', '#..................#', '#..................#',
      '#..................#', '#..................#', '#..................#', '#.................V#', '####################'],
    enemyEvery: 99,
  };
  const L = core.parseLevel(def);
  const s = core.newState(L);
  core.step(s, 'shift');
  assert.ok(s.events.includes('blocked')); assert.equal(s.layer, core.DAY);
  core.step(s, 'right');
  core.step(s, 'shift');
  assert.equal(s.layer, core.NIGHT);
  // Teleport next to the waiting enemy and step onto it.
  s.x = 17; s.y = 8;
  core.step(s, 'right');
  assert.equal(s.status, 'lost'); assert.equal(s.cause, 'caught');
});

test('the bell shifts the player and walls in whoever stands in a wall', () => {
  const day = ['####################', '#P.................#', '#..................#', '#..................#', '#..................#',
    '#..................#', '#..................#', '#..................#', '#.................X#', '####################'];
  const night = day.map((r, y) => y === 1 ? '#o.................#' : r.replace('P', '.').replace('X', '.'));
  const L = core.parseLevel({id: 't2', time: '', title: {}, day, night, bell: 5});
  const s = core.newState(L);
  for (let i = 0; i < 5; i++) core.step(s, 'wait');
  assert.equal(s.status, 'lost'); assert.equal(s.cause, 'crushed');
  const s2 = core.newState(L);
  core.step(s2, 'right');
  for (let i = 0; i < 4; i++) core.step(s2, 'wait');
  assert.equal(s2.status, 'play'); assert.equal(s2.layer, core.NIGHT);
});

test('process stations only count in order', () => {
  const day = ['####################', '#P.2.1............X#', '#..................#', '#..................#', '#..................#',
    '#..................#', '#..................#', '#..................#', '#..................#', '####################'];
  const L = core.parseLevel({id: 't3', time: '', title: {}, day, night: day.map(r => r.replace(/[P123X]/g, '.'))});
  const s = play(L, ['right', 'right']);
  assert.equal(s.got, 0, 'station 2 before station 1 does nothing');
  play(L, []);
  const s2 = play(L, ['right', 'right', 'right', 'right', 'left', 'left']);
  assert.equal(s2.got, 2);
});

test('the previous shift gathers under a player hiding in the day shift', () => {
  const def = LEVELS.find(d => d.id === '2300');
  const L = core.parseLevel(def);
  const s = core.newState(L);
  for (let i = 0; i < 120; i++) core.step(s, 'wait');
  const e = s.enemies[0];
  assert.ok(Math.abs(e.x - s.x) + Math.abs(e.y - s.y) <= 1, `enemy at ${e.x},${e.y}, player at ${s.x},${s.y}`);
});
