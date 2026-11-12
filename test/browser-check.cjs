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
      // Reload with every saved state there is (finished night, secret ending, reticles, a lot): it must start.
      await page.evaluate(() => { for (const [k, v] of Object.entries({odenchip: '1', level: '7', reticles: '["si","ox","pr","st","im","an","ct","me"]', intro: '1', best: '91', lot: '{"s":{"clean":0.9},"v":{"particles":4}}'})) localStorage.setItem('schichtwechsel-' + k, v); });
      await page.reload(); await page.evaluate(() => document.fonts.ready);
      const f0 = await page.evaluate(() => new Promise(r => requestAnimationFrame(() => r(performance.now()))));
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => __schicht.mode), 'title', 'the game starts with every saved state');
      assert.deepEqual(errors, [], `no page errors in ${locale}`);
      await page.close();
    }
    console.log('PASS: all levels won in the browser (DE and EN), keyboard input, a minigame with the keyboard, reload with saved states, no page errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
