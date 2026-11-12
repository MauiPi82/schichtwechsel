// The nine playable process steps: physics, scoring and a full play of each. Run: node --test test/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');

const win = {};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/minigames.js'), 'utf8'), {window: win, Math});
const M = win.SchichtMini;
const idle = {pressed: false, held: false, up: false, down: false, left: false, right: false};
const run = (m, n, inp = idle) => { for (let i = 0; i < n; i++) M.update(m, inp); };
const press = m => M.update(m, {...idle, pressed: true});

test('the analysing magnet separates the ions as r = sqrt(2mE)/(qB)', () => {
  assert.ok(Math.abs(M.radius(75, 0.25) - 0.997) < 0.003);
  assert.ok(Math.abs(M.radius(11, 0.25) - 0.382) < 0.002);
  // Fields for r = 1 m at 40 kV: As+ 249.4 mT, AsH+ 251.0, BF2+ 201.6, As2+ 176.4, P+ 160.3.
  for (const [m, z, mT] of [[75, 1, 249.4], [76, 1, 251.0], [49, 1, 201.6], [75, 2, 176.35], [31, 1, 160.3]]) assert.ok(Math.abs(M.fieldFor(m, z) * 1000 - mT) < 0.3, `${m}/${z}`);
});

test('grades and yield', () => {
  assert.equal(M.grade(0.95).word, 'PERFETTO');
  assert.equal(M.grade(0.2).word, 'SCARTO');
  assert.equal(M.yieldOf({s: {}}), 97);
  const perfect = Object.fromEntries(M.STEPS.map(k => [k, 1])), worst = Object.fromEntries(M.STEPS.map(k => [k, 0]));
  assert.equal(M.yieldOf({s: perfect}), 97);
  assert.equal(M.yieldOf({s: worst}), Math.round(0.97 * 0.8 ** M.STEPS.length * 100));
});

test('oxidise: following the recipe curve gives 50 nm; a furnace left alone stays cold and grows nothing', () => {
  // A careful operator: heater power for where the curve goes next, with the furnace lag (90 frames) in mind.
  const m = M.create('oxidize');
  let g = 0;
  while (m.phase === 'play' && g++ < 3000) { if (m.goal !== undefined) m.P = Math.max(0, Math.min(10, (m.goal + 90 * m.slope - 400) / 70)); M.update(m, idle); }
  assert.equal(m.phase, 'result'); assert.ok(m.score > 0.9, `score ${m.score}`); assert.ok(Math.abs(m.values.oxide - 50) < 1.5, `${m.values.oxide}`);
  // Too hot during the hold: the oxide grows too thick.
  const hot = M.create('oxidize'); g = 0;
  while (hot.phase === 'play' && g++ < 3000) { if (hot.goal !== undefined) hot.P = Math.max(0, Math.min(10, (hot.goal + 40 + 90 * hot.slope - 400) / 70)); M.update(hot, idle); }
  assert.ok(hot.values.oxide > 52, `hot ${hot.values.oxide}`);
  const cold = M.create('oxidize'); g = 0;
  while (cold.phase === 'play' && g++ < 3000) M.update(cold, idle);
  assert.equal(cold.phase, 'result'); assert.ok(cold.score < 0.2, `cold ${cold.score}`);
});

test('etch: a tuned plasma etches at full rate; mistuned it stalls and costs grade', () => {
  const tuned = M.create('etch'), loose = M.create('etch');
  loose.tn = tuned.tn; loose.te = tuned.te; loose.ph = tuned.ph;
  for (let i = 0; i < 400; i++) { tuned.match = tuned.ideal; M.update(tuned, idle); M.update(loose, idle); }
  assert.ok(tuned.g > loose.g + 50, `tuned ${tuned.g} loose ${loose.g}`);
  assert.ok(tuned.refl < 1 && loose.refl > 10);
});

test('coat: hold SHIFT to 2000 rpm, let go, the film dries at 100 nm', () => {
  const m = M.create('coat');
  run(m, 50); run(m, 200, {...idle, held: true}); run(m, 160);
  assert.equal(m.phase, 'result'); assert.equal(m.values.rpm, 2000); assert.ok(Math.abs(m.values.resist - 100) < 0.1); assert.ok(m.score > 0.99);
});

test('coat: the film only gets thinner; slowing down after 4000 rpm leaves it thin', () => {
  const m = M.create('coat');
  run(m, 50); run(m, 400, {...idle, held: true}); run(m, 490, {...idle, down: true});
  // 4000 rpm thinned it to about 71 nm; going back to about 2000 does not bring the resist back.
  assert.ok(m.rpm < 2000 && m.film < 75, `rpm ${m.rpm}, film ${m.film}`);
  // A tap of an arrow key moves the speed by 50 rpm.
  const r0 = m.rpm; M.update(m, {...idle, up: true}); M.update(m, idle); assert.equal(m.rpm, r0 + 50);
  run(m, 160); assert.equal(m.phase, 'result'); assert.ok(m.values.resist < 75); assert.ok(m.score < 0.0001);
});

test('skipping with Enter runs the standard recipe: così così', () => {
  for (const type of M.STEPS) {
    const m = M.create(type); run(m, 70); M.skip(m);
    assert.equal(m.phase, 'result'); assert.equal(M.grade(m.score).word, 'COSÌ COSÌ', type);
  }
});

test('clean, expose, etch and implant end with a score and close on SHIFT', () => {
  for (const type of ['clean', 'expose', 'etch', 'implant']) {
    const m = M.create(type);
    for (let i = 0; i < 6000 && m.phase === 'play'; i++) M.update(m, {...idle, pressed: i % 97 === 96});
    assert.equal(m.phase, 'result', type);
    assert.ok(m.score >= 0 && m.score <= 1, `${type} ${m.score}`);
    run(m, 30); press(m);
    assert.ok(m.closed, `${type} closes`);
  }
});

test('implant: only arsenic through the slit gives the full dose', () => {
  const m = M.create('implant');
  const As = M.fieldFor(75), P = M.fieldFor(31);
  m.B = As; press(m);
  for (let i = 0; i < 420; i++) { m.B += (As - m.B) * 0.3; M.update(m, idle); }
  assert.equal(m.phase, 'result'); assert.ok(m.score > 0.95, `${m.score}`);
  const wrong = M.create('implant');
  wrong.B = P; press(wrong);
  for (let i = 0; i < 420; i++) { wrong.B += (P - wrong.B) * 0.3; M.update(wrong, idle); }
  assert.ok(wrong.score < 0.05, `phosphorus instead of arsenic: ${wrong.score}`);
});

test('develop: rinse so the line ends at 40 nm; too early leaves scum, too late topples the lines', () => {
  const {FPS, LAG} = M.DEV;
  // Press when the line, two seconds of rinse later, is 40 nm: 15 s to clear 100 nm, then 0.4 nm/s.
  const at = 15 + (50 - 40) / 0.4 - LAG;
  const m = M.create('develop', {lot: {v: {resist: 100}}});
  run(m, 111);
  while (m.phase === 'play' && m.g < at * FPS) M.update(m, idle);
  press(m); run(m, 140);
  assert.equal(m.phase, 'result'); assert.ok(Math.abs(m.values.cd - 40) < 0.3, `${m.values.cd}`); assert.ok(m.score > 0.95);
  // Thicker resist from the coater clears later: the same moment leaves wider lines.
  const thick = M.create('develop', {lot: {v: {resist: 120}}});
  run(thick, 111); while (thick.g < at * FPS) M.update(thick, idle); press(thick); run(thick, 140);
  assert.ok(thick.values.cd > 41, `${thick.values.cd}`);
  const early = M.create('develop'); run(early, 111 + 5 * FPS); press(early); run(early, 140);
  assert.ok(early.score < 0.1, 'scum');
  const late = M.create('develop'); run(late, 2000);
  assert.equal(late.phase, 'result'); assert.equal(late.score, 0, 'pattern collapse');
  assert.ok(M.cdAfter(10) === null && Math.abs(M.cdAfter(40) - 40) < 1e-9);
});

test('nitride: tilting the heater zones against the gas depletion makes every wafer alike', () => {
  const rateU = z => M.nitUniformity([...Array(12)].map((_, i) => M.nitRate(z, i))).u;
  assert.ok(rateU([780, 780, 780]) > 10, 'flat zones: the lower wafers starve');
  assert.ok(rateU([780, 786, 792]) < 1, 'a tilt of about 6 °C per zone fixes it');
  const play = zones => {
    const m = M.create('nitride'); run(m, 101);
    m.set = zones.slice(); m.act = zones.slice(); press(m);
    for (let i = 0; i < 3000 && m.phase === 'play'; i++) M.update(m, idle);
    return m;
  };
  const good = play([780, 786, 792]);
  assert.equal(good.phase, 'result'); assert.ok(Math.abs(good.values.nitride - 100) < 0.5, `${good.values.nitride}`); assert.ok(good.score > 0.9, `${good.score}`);
  assert.ok(play([780, 780, 780]).score < 0.05);
  // Arrow keys: ↓ picks the bottom zone, → heats it; the real temperature follows its set point.
  const m = M.create('nitride'); run(m, 101); assert.equal(m.sel, 2);
  run(m, 50, {...idle, right: true}); assert.ok(Math.abs(m.set[2] - 785) < 1e-6); assert.ok(m.act[2] > 780 && m.act[2] < 785);
  M.update(m, {...idle, up: true}); M.update(m, idle); assert.equal(m.sel, 1);
});

test('coat: a brief spin still dries, into a far too thick film, and the drying bar stops at full', () => {
  const m = M.create('coat');
  run(m, 50); run(m, 3, {...idle, held: true}); run(m, 200);
  assert.equal(m.phase, 'result'); assert.ok(m.values.resist > 300); assert.equal(m.score, 0);
});

test('with a brief, each step first explains itself and starts on SHIFT; Enter still skips', () => {
  for (const type of M.STEPS) {
    const m = M.create(type, {brief: true});
    run(m, 200);
    assert.equal(m.phase, 'brief', type); assert.equal(m.t, 0, `${type} waits`);
    press(m); assert.equal(m.phase, 'play', type);
    const s = M.create(type, {brief: true}); run(s, 40); M.skip(s); assert.equal(s.phase, 'result', `${type} skips from the brief`);
  }
});

test('sputter: argon held in the band gives a dense 500 nm film; no argon, no plasma, no film', () => {
  // A player who opens the valve below 4.5 µbar and closes it above keeps the pressure in the band.
  const m = M.create('sputter');
  let g = 0;
  while (m.phase === 'play' && g++ < 2000) M.update(m, {...idle, held: m.p !== undefined && m.p < 4.5});
  assert.equal(m.phase, 'result');
  assert.ok(Math.abs(m.values.al - 500) < 0.01, `film ${m.values.al}`);
  assert.equal(M.grade(m.score).word, 'PERFETTO', `score ${m.score}`);
  // Holding the valve open the whole time: too much argon, scattered atoms, a porous film.
  const open = M.create('sputter');
  g = 0;
  while (open.phase === 'play' && g++ < 2000) M.update(open, {...idle, held: true});
  assert.ok(open.score < 0.5, `open valve ${open.score}`);
  // Never letting argon in: the plasma never strikes, nothing grows.
  const shut = M.create('sputter');
  g = 0;
  while (shut.phase === 'play' && g++ < 2000) M.update(shut, idle);
  assert.equal(shut.values.al, 0); assert.equal(M.grade(shut.score).word, 'SCARTO');
});
