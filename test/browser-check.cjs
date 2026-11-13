// Plays every level in a real browser with the solver's solution and fails on page errors.
// Serve the repository root, then: node test/browser-check.cjs http://127.0.0.1:8770/
const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
const {LEVELS} = require('../src/levels.js');
const url = process.argv[2];
if (!url) throw new Error('Pass the URL of the served repository root.');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM || undefined});
  try {
    for (const locale of ['de-DE', 'en-US']) {
      const page = await browser.newPage({locale, viewport: {width: 1100, height: 900}});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'test');
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.lang), locale.slice(0, 2));
      for (let i = 0; i < LEVELS.length; i++) {
        const solution = core.solve(core.parseLevel(LEVELS[i]));
        const result = await page.evaluate(({i, solution}) => {
          __schicht.card(i); __schicht.render();
          __schicht.start(i);
          for (const a of solution) { __schicht.act(a); __schicht.render(); }
          return {status: __schicht.state.status, mode: __schicht.mode};
        }, {i, solution});
        assert.equal(result.status, 'won', `${LEVELS[i].time} in ${locale}`);
      }
      // The night goes on hour by hour: after the second-to-last hour the card of the last one, after the last the
      // ending (the normal one, or the Odenchip with all eight reticles). Played through the real end-of-hour flow.
      if (locale === 'de-DE') {
        const finish = i => core.solve(core.parseLevel(LEVELS[i]));
        const r = await page.evaluate(({a, b}) => {
          const S = __schicht, run = (i, sol) => { S.start(i); for (const x of sol) S.act(x); for (let f = 0; f < 90; f++) S.update(); return S.mode; };
          S.found.clear();
          const afterSecondLast = run(6, a), afterLast = run(7, b);
          for (const id of ['si', 'ox', 'pr', 'st', 'im', 'an', 'ct', 'me']) S.found.add(id);
          const withAll = run(7, b);
          S.found.clear();
          return [afterSecondLast, afterLast, withAll];
        }, {a: finish(6), b: finish(7)});
        assert.deepEqual(r, ['card', 'epilogue', 'finale'], 'the last hour is played, then the ending');
      }
      // The calm mode, switched on the page: the hours with rounds and a bell, played with the calm solutions.
      if (locale === 'de-DE') {
        await page.click('#btnEasy');
        for (const i of [2, 3, 6, 7]) {
          const solution = core.solve(core.parseLevel(LEVELS[i], {easy: true}));
          const r = await page.evaluate(({i, solution}) => { __schicht.start(i); for (const a of solution) __schicht.act(a); return [__schicht.state.status, __schicht.state.level.easy]; }, {i, solution});
          assert.deepEqual(r, ['won', true], `${LEVELS[i].time} in the calm mode`);
        }
        await page.click('#btnEasy');
        assert.equal(await page.evaluate(() => { __schicht.start(0); return __schicht.state.level.easy; }), false, 'back to the normal pace');
      }
      // A death after a process step rewinds to that step, also in hours where the shift before walks rounds.
      for (const i of [1, 2, 5]) {
        const solution = core.solve(core.parseLevel(LEVELS[i]));
        const r = await page.evaluate(({i, solution}) => {
          __schicht.start(i);
          for (const a of solution) {
            __schicht.act(a);
            let g = 0;
            while (__schicht.mode !== 'play' && g++ < 3000) { if (__schicht.mode === 'mini') __schicht.press(__schicht.miniGame && __schicht.miniGame.phase === 'result' ? 'shift' : 'enter'); if (__schicht.mode === 'process') __schicht.press('shift'); __schicht.update(); }
            if (__schicht.state.got >= 1) break;
          }
          const at = {x: __schicht.state.x, y: __schicht.state.y, got: __schicht.state.got};
          for (let k = 0; k < 4; k++) __schicht.act('wait');
          __schicht.dead('caught', 0);
          for (let f = 0; f < 120; f++) { __schicht.update(); __schicht.render(); }
          __schicht.press('shift');
          let g = 0; while (__schicht.mode !== 'play' && g++ < 400) { __schicht.update(); __schicht.render(); }
          const s = __schicht.state;
          return {at, after: {x: s.x, y: s.y, got: s.got}, safe: s.safeUntil > s.step, mode: __schicht.mode};
        }, {i, solution});
        assert.deepEqual(r.after, r.at, `${LEVELS[i].time}: the rewind stops at the last process step`);
        assert.ok(r.safe && r.mode === 'play', `${LEVELS[i].time}: the hour resumes with a moment of safety`);
      }
      // The gowning intro end to end: the door stays shut without the suit, street clothes go into the locker first,
      // the suit goes on at the rack,
      // the air shower tears into the shift before, the note of shift B, the lot from the cart, then the airlock.
      if (locale === 'de-DE') {
        const r = await page.evaluate(() => {
          const S = __schicht, log = [];
          const settle = () => { let g = 0; while (S.mode !== 'play' && g++ < 2000) { if (S.mode === 'note' && S.noteT > 30) S.press('shift'); S.update(); } };
          const walk = moves => { for (const m of moves) { S.act(m); for (let f = 0; f < 10; f++) S.update(); settle(); } return [S.state.x, S.state.y]; };
          S.intro();
          // First the time clock in the corridor, then into the gowning room.
          walk(['up', 'right', 'right', 'right']); S.act('right'); for (let f = 0; f < 10; f++) S.update();
          log.push(S.mode === 'process' ? 'clock in' : `no clock (${S.mode})`); settle();
          walk(['left', 'left', 'left', 'up', 'up', 'right', 'right', 'right', 'right', 'up', 'right']);
          log.push(S.state.x === 6 && S.state.y === 3 ? 'door shut' : `door open at ${S.state.x},${S.state.y}`);
          walk(['up']); log.push(S.mode === 'play' ? 'locker first' : 'suit without locker');
          // A window opens only once the figure stands on the field: right after the step it is still walking.
          S.act('left'); for (let f = 0; f < 10; f++) S.update(); S.act('left');
          const walking = S.mode === 'play'; for (let f = 0; f < 10; f++) S.update();
          log.push(walking && S.mode === 'locker' ? 'locker' : `no locker (${walking}, ${S.mode})`); settle();
          // After a window, time rests half a second before the next step.
          walk(['right']); S.act('right'); for (let f = 0; f < 60 && S.mode !== 'gown'; f++) S.update(); log.push(S.mode === 'gown' ? 'gowning' : 'no gowning'); settle();
          walk(['down', 'right', 'right']);
          walk(['right', 'right', 'right', 'right', 'right']);
          log.push(S.introNote && S.introNote.read ? 'note read' : 'note missed');
          walk(['right', 'right', 'down', 'right']);
          log.push(S.state.got === 1 ? 'lot picked up' : 'no lot');
          walk(['up', 'up', 'up', 'right', 'right']);
          for (let f = 0; f < 120; f++) S.update();
          log.push(S.mode);
          return log;
        });
        assert.deepEqual(r, ['clock in', 'door shut', 'locker first', 'locker', 'gowning', 'note read', 'lot picked up', 'card'], 'the gowning intro plays through');
      }
      // Real keyboard input reaches the game: start from the title and walk.
      // A fresh night (no stored progress) starts with the gowning intro.
      await page.evaluate(() => { try { localStorage.clear(); } catch (_) { /* blocked */ } });
      // Every change of scene fades through black, so wait for the next scene instead of a fixed time.
      const until = (fn, arg) => page.waitForFunction(fn, arg, {timeout: 6000}).catch(() => {});
      const settled = m => until(m => __schicht.mode === m && !__schicht.fadingOut, m);
      await page.reload(); await page.keyboard.press('Shift');
      await until(() => __schicht.mode === 'cinema' && __schicht.cinemaT > 0.6);
      assert.equal(await page.evaluate(() => __schicht.mode), 'cinema', 'a fresh night starts with the prologue');
      await page.keyboard.press('Enter'); await settled('play');
      assert.equal(await page.evaluate(() => __schicht.mode), 'play', 'the prologue skips to the gowning intro');
      await page.keyboard.press('Enter'); await until(() => __schicht.mode === 'card' && __schicht.cardT > 30);
      assert.equal(await page.evaluate(() => __schicht.mode), 'card', 'Enter skips the intro');
      await page.keyboard.press('Enter'); await settled('play');
      assert.equal(await page.evaluate(() => __schicht.mode), 'play');
      const x0 = await page.evaluate(() => __schicht.state.x);
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
      assert.ok(await page.evaluate(() => __schicht.state.x) > x0, 'player walks right');
      // A minigame with the real keyboard: hold SHIFT to spin up the coater, let go, it dries, SHIFT closes it.
      await page.evaluate(() => __schicht.mini('coat'));
      await page.waitForTimeout(900); await page.keyboard.down('Shift'); await page.waitForTimeout(2200); await page.keyboard.up('Shift');
      await until(() => __schicht.miniGame && __schicht.miniGame.phase === 'result' && __schicht.miniGame.resultT > 30);
      assert.equal(await page.evaluate(() => __schicht.miniGame && __schicht.miniGame.phase), 'result', 'the coater dries and grades');
      await page.keyboard.press('Shift'); await settled('play');
      assert.ok(await page.evaluate(() => __schicht.lot.s.coat !== undefined), 'the coat result goes into the lot');
      // H pauses first, a second H leads to the main menu; the page button does it in one click.
      await page.keyboard.press('h');
      assert.equal(await page.evaluate(() => __schicht.mode), 'paused', 'H pauses first');
      await page.keyboard.press('h'); await settled('title');
      assert.equal(await page.evaluate(() => __schicht.mode), 'title', 'a second H opens the main menu');
      await page.evaluate(() => __schicht.card(2)); await page.click('#btnMenu'); await settled('title');
      assert.equal(await page.evaluate(() => __schicht.mode), 'title', 'the menu button opens the main menu');
      // Reload with every saved state there is (finished night, secret ending, reticles, a lot): it must start.
      await page.evaluate(() => { for (const [k, v] of Object.entries({odenchip: '1', level: '7', reticles: '["si","ox","pr","st","im","an","ct","me"]', intro: '1', best: '91', lot: '{"s":{"clean":0.9},"v":{"particles":4}}'})) localStorage.setItem('schichtwechsel-' + k, v); });
      await page.reload(); await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => __schicht.mode), 'title', 'the game starts with every saved state');
      assert.deepEqual(errors, [], `no page errors in ${locale}`);
      await page.close();
    }
    console.log('PASS: all levels won in the browser (DE and EN), the calm mode, the last hour and both endings, rewind to the last process step, the gowning intro, keyboard input, a minigame with the keyboard, the way to the main menu, reload with saved states, no page errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
