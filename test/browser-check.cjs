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
      await page.reload(); await page.keyboard.press('Shift'); await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => __schicht.mode), 'play', 'a fresh night starts with the gowning intro');
      await page.keyboard.press('Enter'); await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => __schicht.mode), 'card', 'Enter skips the intro');
      await page.waitForTimeout(500); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => __schicht.mode), 'play');
      const x0 = await page.evaluate(() => __schicht.state.x);
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
      assert.ok(await page.evaluate(() => __schicht.state.x) > x0, 'player walks right');
      assert.deepEqual(errors, [], `no page errors in ${locale}`);
      await page.close();
    }
    console.log('PASS: all levels won in the browser (DE and EN), keyboard input, no page errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
