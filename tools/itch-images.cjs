// Store images for itch.io: a cover (630 x 500, drawn at 2x and halved), five screenshots (1280 x 720)
// and two GIFs (640 x 360, no flashes). Real gameplay, rendered through the test hook.
// Usage: node tools/itch-images.cjs [out dir, default docs/itch]   (needs Playwright and ffmpeg)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {execFileSync} = require('child_process');
const {chromium} = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'docs/itch'));
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.txt': 'text/plain'};

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const server = await serve(), url = `http://127.0.0.1:${server.address().port}/?test`;
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport: {width: 1400, height: 1000}, locale: 'en-US'});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('schichtwechsel-lang', 'en'); });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  const grab = () => page.evaluate(() => { __schicht.calm(); __schicht.render(); return document.getElementById('game').toDataURL('image/png'); });
  const save = async (name, data) => fs.writeFileSync(path.join(OUT, name), Buffer.from((data || await grab()).split(',')[1], 'base64'));
  // A quiet moment of an hour: the player at x, y in the given shift, the hint already gone.
  const scene = (i, x, y, layer, face = 'down', step = 40) => page.evaluate(({i, x, y, layer, face, step}) => {
    __schicht.start(i);
    for (let f = 0; f < 320; f++) __schicht.update();
    const s = __schicht.state;
    s.x = s.px = x; s.y = s.py = y; s.face = face; s.layer = layer; s.step = step; s.lastShift = step - 20;
    __schicht.quiet(); __schicht.setMode('play');
  }, {i, x, y, layer, face, step});

  // 1, 2: the same spot at one o'clock, in front of the etch cluster, in your shift and in the shift before.
  await scene(3, 9, 6, 0, 'up', 44); await save('shot-1-your-shift.png');
  await page.evaluate(() => { __schicht.state.layer = 1; }); await save('shot-2-the-shift-before.png');
  // 3: 04:00, the plasma in the corridor, the wall in its middle.
  await scene(6, 3, 3, 0, 'right', 33); await save('shot-3-plasma.png');
  // 4: the implanter as a minigame: the magnet on As+, the dose filling.
  await page.evaluate(() => {
    // Every step opens with its brief; SHIFT starts it.
    __schicht.start(4); __schicht.mini('implant'); for (let f = 0; f < 30; f++) __schicht.update(); __schicht.press('shift'); for (let f = 0; f < 40; f++) __schicht.update();
    __schicht.miniGame.B = window.SchichtMini.fieldFor(75); __schicht.press('shift');
    for (let f = 0; f < 200; f++) { const m = __schicht.miniGame; m.B += (window.SchichtMini.fieldFor(75) - m.B) * 0.3; __schicht.update(); }
  });
  await save('shot-4-implanter.png');
  // 5: the RCA clean, in the HF bath, the wafer dewetting.
  await page.evaluate(() => { __schicht.start(0); __schicht.mini('clean'); for (let f = 0; f < 30; f++) __schicht.update(); __schicht.press('shift'); for (let f = 0; f < 130 + 36 + 250; f++) __schicht.update(); __schicht.press('shift'); for (let f = 0; f < 44 + 36 + 250; f++) __schicht.update(); __schicht.press('shift'); for (let f = 0; f < 44 + 36 + 300; f++) __schicht.update(); });
  await save('shot-5-clean.png');

  // Cover: the same spot split into your shift and the shift before, the title across it.
  // Both stations done: no station label runs into the title or the border.
  await scene(3, 9, 6, 0, 'down', 44); await page.evaluate(() => { __schicht.state.got = __schicht.state.level.stations.length; }); const day = await grab();
  await page.evaluate(() => { __schicht.state.layer = 1; }); const night = await grab();
  const cover = await page.evaluate(async ({day, night}) => {
    const load = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
    const [a, b] = await Promise.all([load(day), load(night)]);
    const c = document.createElement('canvas'); c.width = 1260; c.height = 1000;
    const x = c.getContext('2d');
    // A window of the fab without the bars above and below, in the cover's 1.26 : 1, scaled up.
    const sh = 584, sw = Math.round(sh * 1.26), sy = 66, sx = Math.max(0, Math.min(1280 - sw, 608 - sw / 2));
    x.drawImage(a, sx, sy, sw, sh, 0, 0, 1260, 1000);
    // The border between the shifts runs through the gap between SCHICHT and WECHSEL at the height of the title.
    x.textBaseline = 'top'; x.font = '700 118px "Pixelify Sans"';
    const w1 = x.measureText('SCHICHT').width, w2 = x.measureText('WECHSEL').width, left = 630 - (w1 + w2) / 2;
    const mid = left + w1, ty = 50 + 59, slope = 140 / 1000, top = mid + slope * ty, bottom = mid - slope * (1000 - ty);
    x.save(); x.beginPath(); x.moveTo(top, 0); x.lineTo(1260, 0); x.lineTo(1260, 1000); x.lineTo(bottom, 1000); x.closePath(); x.clip();
    x.drawImage(b, sx, sy, sw, sh, 0, 0, 1260, 1000); x.restore();
    x.strokeStyle = '#ffb43a'; x.lineWidth = 6; x.beginPath(); x.moveTo(top, 0); x.lineTo(bottom, 1000); x.stroke();
    const g = x.createLinearGradient(0, 0, 0, 330); g.addColorStop(0, 'rgba(5,6,10,.92)'); g.addColorStop(1, 'rgba(5,6,10,0)');
    x.fillStyle = g; x.fillRect(0, 0, 1260, 330);
    x.textAlign = 'center';
    x.textAlign = 'left';
    x.fillStyle = '#2f6db3'; x.fillText('SCHICHT', left + 6, 56); x.fillStyle = '#e9eef5'; x.fillText('SCHICHT', left, 50);
    x.fillStyle = '#3a2200'; x.fillText('WECHSEL', left + w1 + 6, 56); x.fillStyle = '#ffb43a'; x.fillText('WECHSEL', left + w1, 50);
    x.textAlign = 'center'; x.font = '400 40px "Silkscreen"'; x.fillStyle = '#c9c2ae'; x.fillText('TURNO DI NOTTE', 630, 190);
    const g2 = x.createLinearGradient(0, 860, 0, 1000); g2.addColorStop(0, 'rgba(5,6,10,0)'); g2.addColorStop(1, 'rgba(5,6,10,.9)');
    x.fillStyle = g2; x.fillRect(0, 860, 1260, 140);
    x.font = '400 30px "Silkscreen"'; x.fillStyle = '#8c93a8'; x.fillText('PRESS SHIFT', 630, 940);
    const half = document.createElement('canvas'); half.width = 630; half.height = 500;
    const h = half.getContext('2d'); h.imageSmoothingEnabled = true; h.imageSmoothingQuality = 'high'; h.drawImage(c, 0, 0, 630, 500);
    return [c.toDataURL('image/png'), half.toDataURL('image/png')];
  }, {day, night});
  await save('cover-1260x1000.png', cover[0]); await save('cover-630x500.png', cover[1]);

  // Banner for the top of the itch page (1920 x 480, and 960 x 240): the same split, wide, the title in the middle.
  const banner = await page.evaluate(async ({day, night}) => {
    const load = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
    const [a, b] = await Promise.all([load(day), load(night)]);
    const c = document.createElement('canvas'); c.width = 1920; c.height = 480;
    const x = c.getContext('2d');
    const sw = 1280, sh = 320, sx = 0, sy = 230;
    x.textBaseline = 'top'; x.font = '700 120px "Pixelify Sans"';
    const w1 = x.measureText('SCHICHT').width, w2 = x.measureText('WECHSEL').width, left = 960 - (w1 + w2) / 2;
    const mid = left + w1, ty = 150 + 60, slope = 140 / 480, top = mid + slope * ty, bottom = mid - slope * (480 - ty);
    x.drawImage(a, sx, sy, sw, sh, 0, 0, 1920, 480);
    x.save(); x.beginPath(); x.moveTo(top, 0); x.lineTo(1920, 0); x.lineTo(1920, 480); x.lineTo(bottom, 480); x.closePath(); x.clip();
    x.drawImage(b, sx, sy, sw, sh, 0, 0, 1920, 480); x.restore();
    x.strokeStyle = '#ffb43a'; x.lineWidth = 6; x.beginPath(); x.moveTo(top, 0); x.lineTo(bottom, 480); x.stroke();
    const g = x.createRadialGradient(960, 220, 60, 960, 220, 760); g.addColorStop(0, 'rgba(5,6,10,.78)'); g.addColorStop(1, 'rgba(5,6,10,.15)');
    x.fillStyle = g; x.fillRect(0, 0, 1920, 480);
    x.textAlign = 'left';
    x.fillStyle = '#2f6db3'; x.fillText('SCHICHT', left + 6, 156); x.fillStyle = '#e9eef5'; x.fillText('SCHICHT', left, 150);
    x.fillStyle = '#3a2200'; x.fillText('WECHSEL', left + w1 + 6, 156); x.fillStyle = '#ffb43a'; x.fillText('WECHSEL', left + w1, 150);
    x.textAlign = 'center'; x.font = '400 36px "Silkscreen"'; x.fillStyle = '#c9c2ae'; x.fillText('TURNO DI NOTTE', 960, 290);
    const half = document.createElement('canvas'); half.width = 960; half.height = 240;
    const h = half.getContext('2d'); h.imageSmoothingEnabled = true; h.imageSmoothingQuality = 'high'; h.drawImage(c, 0, 0, 960, 240);
    return [c.toDataURL('image/png'), half.toDataURL('image/png')];
  }, {day, night});
  await save('banner-1920x480.png', banner[0]); await save('banner-960x240.png', banner[1]);

  // GIFs from frames, through ffmpeg with an optimised palette.
  const gif = async (name, setup, frames, perFrame) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-gif-'));
    await page.evaluate(setup);
    for (let k = 0; k < frames; k++) {
      await page.evaluate(perFrame);
      const d = await page.evaluate(() => { __schicht.calm(); __schicht.render(); return document.getElementById('game').toDataURL('image/png'); });
      fs.writeFileSync(path.join(dir, `f${String(k).padStart(3, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'));
    }
    const pal = path.join(dir, 'pal.png'), src = path.join(dir, 'f%03d.png');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '12', '-i', src, '-vf', 'scale=640:360:flags=lanczos,palettegen=max_colors=96', pal]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '12', '-i', src, '-i', pal, '-lavfi', 'scale=640:360:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', path.join(OUT, name)]);
    fs.rmSync(dir, {recursive: true, force: true});
  };
  // 23:00 in the shift before: a figure walks its round past you.
  await gif('round.gif', () => {
    __schicht.start(1); for (let f = 0; f < 320; f++) __schicht.update();
    const s = __schicht.state; s.x = s.px = 8; s.y = s.py = 6; s.layer = 1; s.face = 'down'; s.lastShift = -99; s.step = 0;
    s.enemies[0].pi = 0; s.enemies[0].x = 4; s.enemies[0].y = 8; __schicht.setLayer(1); __schicht.setMode('play');
  }, 54, () => { for (let f = 0; f < 5; f++) { const s = __schicht.state; s.lastShift = s.step; __schicht.update(); } });
  // The implanter: the magnet runs up the mass spectrum until As+ passes the slit.
  await gif('implanter.gif', () => { __schicht.start(4); __schicht.mini('implant'); for (let f = 0; f < 30; f++) __schicht.update(); __schicht.press('shift'); for (let f = 0; f < 30; f++) __schicht.update(); __schicht.miniGame.B = 0.17; }, 48,
    () => { const m = __schicht.miniGame; m.B = Math.min(window.SchichtMini.fieldFor(75), m.B + 0.0017); for (let f = 0; f < 5; f++) __schicht.update(); });

  await browser.close(); server.close();
  for (const f of fs.readdirSync(OUT).sort()) console.log(f.padEnd(30), Math.round(fs.statSync(path.join(OUT, f)).size / 1024), 'KB');
  if (errors.length) { console.error('page errors:', errors); process.exit(1); }
})();
