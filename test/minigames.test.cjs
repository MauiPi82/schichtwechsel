// The six playable process steps: physics, scoring and a full play of each. Run: node --test test/
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
  assert.equal(M.yieldOf({s: worst}), Math.round(0.97 * 0.8 ** 6 * 100));
});

test('oxidise: stopping at 50 nm is perfetto, waiting too long is not', () => {
  const m = M.create('oxidize');
  run(m, 111);
  // Stop a little early: about 1 nm grows on while the furnace ramps down.
  while (m.phase === 'play' && 50 * (Math.sqrt(1 + (m.g + 1) / 180) - 1) + 1 < 50) M.update(m, idle);
  press(m);
  assert.equal(m.phase, 'result'); assert.ok(m.score > 0.9, `score ${m.score}`); assert.ok(Math.abs(m.values.oxide - 50) < 0.5, `${m.values.oxide}`);
  const late = M.create('oxidize'); run(late, 2000);
  assert.equal(late.phase, 'result'); assert.ok(late.score < 0.1);
});

test('coat: hold SHIFT to 2000 rpm, let go, the film dries at 100 nm', () => {
  const m = M.create('coat');
  run(m, 50); run(m, 200, {...idle, held: true}); run(m, 160);
  assert.equal(m.phase, 'result'); assert.equal(m.values.rpm, 2000); assert.ok(Math.abs(m.values.resist - 100) < 1e-9); assert.equal(m.score, 1);
});

test('skipping with Enter runs the standard recipe: così così', () => {
  for (const type of M.STEPS) {
    const m = M.create(type); run(m, 10); M.skip(m);
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
