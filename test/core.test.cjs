// Rules, physics and solvability. Run: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
const {LEVELS, ENDING} = require('../src/levels.js');

const levels = LEVELS.map(d => core.parseLevel(d));
const play = (level, actions) => { const s = core.newState(level); for (const a of actions) core.step(s, a); return s; };

test('every level has texts in both languages', () => {
  for (const d of LEVELS) {
    for (const key of ['title', 'layer', 'stack', 'log', 'fact', 'hint']) for (const l of ['de', 'en']) assert.ok(d[key] && d[key][l], `${d.id} ${key} ${l}`);
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
  for (let i = 0; i < core.GRACE; i++) core.step(s, 'wait');
  // After the grace, teleport next to the waiting enemy and step onto it.
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

test('chasers gather under a player hiding in the day shift', () => {
  const day = ['####################', '#P.................#', '#..................#', '#..................#', '#..................#',
    '#..................#', '#..................#', '#..................#', '#.................X#', '####################'];
  const night = day.map((r, y) => y === 7 ? '#............V.....#' : r.replace(/[PX]/g, '.'));
  const L = core.parseLevel({id: 't8', time: '', title: {}, day, night, enemyEvery: 4});
  const s = core.newState(L);
  for (let i = 0; i < 400; i++) core.step(s, 'wait');
  const e = s.enemies[0];
  assert.ok(Math.abs(e.x - s.x) + Math.abs(e.y - s.y) <= 1, `enemy at ${e.x},${e.y}, player at ${s.x},${s.y}`);
});

test('on their rounds the previous shift keeps its rhythm, whatever you do', () => {
  const def = LEVELS.find(d => d.id === 'ox'), L = core.parseLevel(def), p = L.patrols[0];
  const a = core.newState(L), b = core.newState(L);
  for (let i = 0; i < 60; i++) { core.step(a, 'wait'); core.step(b, ['right', 'down', 'left', 'up', 'wait'][i % 5]); }
  assert.deepEqual([a.enemies[0].x, a.enemies[0].y], [b.enemies[0].x, b.enemies[0].y]);
  const k = Math.floor(60 / p.every) % p.cells.length;
  assert.deepEqual([a.enemies[0].x, a.enemies[0].y], [p.cells[k].x, p.cells[k].y]);
});

test('every hour after the first needs SHIFT, or at least the bell', () => {
  for (const def of LEVELS) {
    if (def.id === 'si' || def.bell) continue;
    assert.equal(core.solve(core.parseLevel(def), {noShift: true}), null, `${def.id} can be done without SHIFT`);
  }
});

test('every reticle can be collected and the hour still finished', () => {
  // With chasers (05:00) this search needs gigabytes; there the reachability test above has to do.
  for (const def of LEVELS) {
    const L = core.parseLevel(def);
    if (L.enemyStarts.length) continue;
    assert.ok(core.solve(L, {reticle: true}), `${def.id}: reticle and airlock`);
  }
});

test('after a resume nothing can kill for a moment, and the bell skips a walled-in player', () => {
  const day = ['####################', '#P.................#', '#..................#', '#..................#', '#..................#',
    '#..................#', '#..................#', '#..................#', '#.................X#', '####################'];
  const night = day.map((r, y) => y === 1 ? '#o.................#' : r.replace('P', '.').replace('X', '.'));
  const L = core.parseLevel({id: 't4', time: '', title: {}, day, night, bell: 5});
  const s = core.newState(L);
  s.safeUntil = 8;
  for (let i = 0; i < 5; i++) core.step(s, 'wait');
  assert.equal(s.status, 'play', 'the bell at step 5 does not wall in a protected player');
  assert.equal(s.layer, core.DAY);
});

test('grace after shifting next to the previous shift is long enough to shift back', () => {
  const day = ['####################', '#P.................#', '#..................#', '#..................#', '#..................#',
    '#..................#', '#..................#', '#..................#', '#.................X#', '####################'];
  const night = day.map((r, y) => y === 1 ? '#.V................#' : r.replace('P', '.').replace('X', '.'));
  const L = core.parseLevel({id: 't5', time: '', title: {}, day, night, enemyEvery: 1});
  const s = core.newState(L);
  core.step(s, 'shift');
  assert.equal(s.status, 'play', 'not caught on the step of the shift');
  core.step(s, 'wait'); core.step(s, 'wait');
  assert.equal(s.status, 'play', 'still inside the grace');
  core.step(s, 'shift');
  assert.equal(s.status, 'play'); assert.equal(s.layer, core.DAY);
});

test('every layer hides one reticle in the shift before, reachable from the start', () => {
  for (const level of levels) {
    assert.ok(level.reticle, `${level.id} has a reticle`);
    const {x, y} = level.reticle;
    assert.ok(!level.stations.some(t => t.x === x && t.y === y) && !level.exits.some(t => t.x === x && t.y === y), `${level.id}: reticle not on a station or exit`);
    const seen = new Set([`${level.start.x},${level.start.y},${level.start.layer}`]), q = [[level.start.x, level.start.y, level.start.layer]];
    while (q.length) {
      const [cx, cy, l] = q.shift();
      const next = [[cx + 1, cy, l], [cx - 1, cy, l], [cx, cy + 1, l], [cx, cy - 1, l], [cx, cy, 1 - l]];
      for (const [nx, ny, nl] of next) {
        const k = `${nx},${ny},${nl}`;
        if (!seen.has(k) && core.walkable(level, nl, nx, ny) && (nl === l || core.walkable(level, l, nx, ny))) { seen.add(k); q.push([nx, ny, nl]); }
      }
    }
    assert.ok(seen.has(`${x},${y},${core.NIGHT}`), `${level.id}: reticle reachable in the shift before`);
  }
});

test('a reticle is picked up only in the shift before', () => {
  const day = ['####################', '#P.................#', '#..................#', '#..................#', '#..................#',
    '#..................#', '#..................#', '#..................#', '#.................X#', '####################'];
  const L = core.parseLevel({id: 't6', time: '', title: {}, day, night: day.map(r => r.replace(/[PX]/g, '.')), reticle: [2, 1]});
  const s = core.newState(L);
  core.step(s, 'right');
  assert.equal(s.reticle, false, 'not by day');
  core.step(s, 'shift');
  assert.equal(s.reticle, true); assert.ok(s.events.includes('reticle'));
});

test('every hour has announcements, a reachable note from shift B and one harmless scare', () => {
  for (const def of LEVELS) {
    const level = core.parseLevel(def);
    assert.ok(def.pa && def.pa.length, `${def.id} has announcements`);
    for (const p of def.pa) assert.ok(p.it && p.de && p.en && p.at >= 0, `${def.id} announcement texts`);
    const n = def.note;
    assert.ok(n && n.by && n.text.de.length === n.text.en.length, `${def.id} note`);
    const {x, y, layer} = level.note;
    assert.ok(!level.stations.some(t => t.x === x && t.y === y) && !level.exits.some(t => t.x === x && t.y === y), `${def.id}: note not on a station or exit`);
    assert.ok(!(level.reticle && level.reticle.x === x && level.reticle.y === y), `${def.id}: note not on the reticle`);
    const seen = new Set([`${level.start.x},${level.start.y},${level.start.layer}`]), q = [[level.start.x, level.start.y, level.start.layer]];
    while (q.length) {
      const [cx, cy, l] = q.shift();
      for (const [nx, ny, nl] of [[cx + 1, cy, l], [cx - 1, cy, l], [cx, cy + 1, l], [cx, cy - 1, l], [cx, cy, 1 - l]]) {
        const k = `${nx},${ny},${nl}`;
        if (!seen.has(k) && core.walkable(level, nl, nx, ny) && (nl === l || core.walkable(level, l, nx, ny))) { seen.add(k); q.push([nx, ny, nl]); }
      }
    }
    assert.ok(seen.has(`${x},${y},${layer}`), `${def.id}: note reachable`);
    assert.ok(core.walkable(level, 1 - layer, x, y), `${def.id}: the shift works on the note, it never lies in a wall gap`);
    const sc = def.scare;
    assert.ok(['phone', 'window', 'blackout', 'shadow'].includes(sc.type), `${def.id} scare type`);
    if (sc.type === 'phone') assert.ok(def.day[sc.y][sc.x] === '#' && def.day[sc.y + 1][sc.x] !== '#', `${def.id}: phone hangs on a wall face`);
    if (sc.type === 'window') assert.ok(def.day.some(r => r.includes('=')), `${def.id}: a window for the face`);
    if (sc.afterPa !== undefined) assert.ok(def.pa[sc.afterPa], `${def.id}: scare after an existing announcement`);
  }
});

test('reading a note is an event and changes nothing else', () => {
  const def = LEVELS.find(d => d.id === 'si'), level = core.parseLevel(def);
  const s = core.newState(level);
  s.x = level.note.x - 1; s.y = level.note.y; s.layer = level.note.layer; s.lastShift = -10;
  const before = core.clone(s);
  core.step(s, 'right');
  assert.ok(s.events.includes('note'));
  assert.equal(s.got, before.got); assert.equal(s.status, 'play'); assert.equal(s.layer, before.layer);
});

test('walking into a tool flares its light: the previous shift nearby sets, the tool needs time to recharge', () => {
  const day = ['####################', '#P.MM..............#', '#..MM..............#', '#..................#', '#..................#',
    '#..................#', '#..................#', '#..................#', '#.................X#', '####################'];
  const night = day.map((r, y) => y === 4 ? '#....V.............#' : r.replace(/[PX]/g, '.'));
  const L = core.parseLevel({id: 't7', time: '', title: {}, day, night, enemyEvery: 1, tools: [{x0: 3, y0: 1, type: 'scanner'}]});
  const s = core.newState(L);
  core.step(s, 'right');
  core.step(s, 'right');
  assert.ok(s.events.includes('flash') && s.events.includes('freeze'), s.events.join());
  const e = s.enemies[0], at = [e.x, e.y];
  for (let i = 0; i < core.FREEZE - 2; i++) core.step(s, 'wait');
  assert.deepEqual([e.x, e.y], at, 'a frozen enemy does not move');
  core.step(s, 'right');
  assert.ok(s.events.includes('tool-wait'), 'the light needs to recharge');
  const solverStart = {...core.newState(L), noAids: true};
  core.step(solverStart, 'right'); core.step(solverStart, 'right');
  assert.ok(!solverStart.events.includes('flash'), 'the solver plays without the help of the tools');
});

test('the emergency stop of a plasma chamber stops its plasma for a while', () => {
  const def = LEVELS.find(d => d.id === 'ct'), L = core.parseLevel(def);
  const s = core.newState(L);
  const p = L.pulses[0];
  let t = 0; while (!core.pulseOn(p, t)) t++;
  s.hazardOff.plasma = t + 5; s.step = t;
  assert.equal(core.timedHazard(L, p.layer, t, p.x0, p.y0, core.hazardStopped(s, 'plasma')), null);
  assert.equal(core.timedHazard(L, p.layer, t, p.x0, p.y0), 'plasma');
  assert.ok(L.blocks[0].some(b => core.toolUse(L, b).stops === 'plasma'), 'a chamber in the contacts hour can stop the plasma');
});

test('after a resume the bell starts a full interval again', () => {
  const def = LEVELS.find(d => d.id === 'st'), L = core.parseLevel(def);
  const s = core.newState(L);
  s.step = 100; s.bellFrom = 100;
  assert.equal(core.bellIn(s), L.bell, 'a whole interval until the next strike');
  for (let i = 0; i < L.bell - 1; i++) { core.step(s, 'wait'); assert.ok(!s.events.includes('bell'), `no strike at ${s.step}`); }
});
