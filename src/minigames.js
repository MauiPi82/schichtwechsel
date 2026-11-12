/* Schichtwechsel - nine process steps you play yourself. Nothing can be lost here: how well you hit a step
 * only changes the quality of lot 4471, which the measuring stations judge later and which ends up as the yield.
 * Controls are those of the game: SHIFT (press or hold) and the arrow keys. Drawn in interface coordinates (320 x 180). */
(() => {
'use strict';
const W = 320, PX = 36, PY = 16, PW = 248, PH = 142;
let ctx, F = 0, lang = 'de';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function circle(c, x, y, r) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); }
function text(s, x, y, o = {}) {
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${o.size || 8}px "${o.font || 'Silkscreen'}", monospace`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = o.color || '#e9e4d6'; ctx.fillText(s, Math.round(x), Math.round(y), o.max || 300);
}
const hashM = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const L = (de, en) => lang === 'de' ? de : en;
const num = (v, d = 1) => v.toFixed(d).replace('.', lang === 'de' ? ',' : '.');

/* ---------- Grades and yield ---------- */
function grade(s) {
  if (s >= 0.9) return {word: 'PERFETTO', de: 'perfekt', en: 'perfect', color: '#3fe06a'};
  if (s >= 0.7) return {word: 'BENE', de: 'gut', en: 'good', color: '#9fe0ff'};
  if (s >= 0.45) return {word: 'COSÌ COSÌ', de: 'na ja', en: 'so-so', color: '#ffcf5a'};
  return {word: 'SCARTO', de: 'Ausschuss', en: 'scrap', color: '#e0402a'};
}
// Yield of lot 4471: every played step keeps 80 to 100 % of the chips, the rest of the flow costs 3 %.
const STEPS = ['clean', 'oxidize', 'nitride', 'coat', 'expose', 'develop', 'etch', 'implant', 'sputter'];
function yieldOf(lot) {
  let y = 0.97;
  for (const k of STEPS) if (lot && lot.s && lot.s[k] !== undefined) y *= 0.8 + 0.2 * lot.s[k];
  return Math.round(y * 100);
}

/* ---------- Frame, result ---------- */
// Skipping only once the label says so: not by a stray key in the first moment.
const skippable = m => (m.phase === 'play' && m.t > 60) || (m.phase === 'brief' && m.ft > 30);
function frame(m, title, help) {
  const appear = ease(m.ft / 20), y0 = Math.round(PY + (1 - appear) * 14);
  ctx.fillStyle = `rgba(3,4,8,${0.6 * appear})`; ctx.fillRect(0, 0, W, 180);
  R('#0b0f18', PX - 2, y0 - 2, PW + 4, PH + 4); R('#ffb43a', PX - 2, y0 - 2, PW + 4, 1);
  R('#1c160c', PX, y0, PW, 12);
  text(title, PX + 6, y0 + 2, {color: '#ffcf5a', max: PW - 116});
  const canSkip = skippable(m);
  text(canSkip ? L('ENTER: ÜBERSPRINGEN', 'ENTER: SKIP') : 'LOT 4471', PX + PW - 6, y0 + 2, {align: 'right', color: canSkip ? '#b09060' : '#c9a15a', max: 100});
  R('#0d111a', PX, y0 + 12, PW, PH - 28);
  R('#141a28', PX, y0 + PH - 16, PW, 16);
  const done = m.phase === 'result';
  text(done ? (m.retried ? L('SHIFT: WEITER', 'SHIFT: CONTINUE') : L('SHIFT: WEITER · ENTER: NOCHMAL', 'SHIFT: CONTINUE · ENTER: AGAIN')) : help, PX + PW / 2, y0 + PH - 12, {align: 'center', color: done ? '#8c93a8' : '#e9e4d6', max: PW - 12});
  ctx.save(); ctx.beginPath(); ctx.rect(PX, y0 + 12, PW, PH - 28); ctx.clip();
  return {x: PX, y: y0 + 12, w: PW, h: PH - 28, y0};
}
function result(m, a) {
  if (m.phase !== 'result') return;
  const k = ease(m.resultT / 18), g = grade(m.score);
  ctx.fillStyle = `rgba(8,10,16,${0.82 * k})`; ctx.fillRect(a.x, a.y, a.w, a.h);
  ctx.globalAlpha = k;
  text(g.word, a.x + a.w / 2, a.y + a.h / 2 - 24, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: g.color});
  // The Italian grade with its meaning underneath.
  text(L(g.de, g.en), a.x + a.w / 2, a.y + a.h / 2 - 9, {align: 'center', font: 'IBM Plex Sans', size: 7, color: '#8c93a8'});
  (m.lines || []).forEach((s, i) => text(s, a.x + a.w / 2, a.y + a.h / 2 + 2 + i * 11, {align: 'center', font: 'IBM Plex Sans', size: 8, color: '#e9e4d6', max: a.w - 16}));
  ctx.globalAlpha = 1;
}
function finish(m, score, values, lines) {
  m.score = clamp(score, 0, 1); m.values = values; m.lines = lines; m.phase = 'result'; m.resultT = 0;
  m.sfx(m.score >= 0.7 ? 'good' : 'meh');
}

/* ---------- 1 Clean: lift the carrier out of each bath while the time is in the green ---------- */
const BATHS = [
  // SC-1 1:1:5 at 75 °C about 10 min, SC-2 the same, HF 1 % about a minute (30 to 120 s still fine).
  {name: 'SC-1', col: '#bfe3d0', max: 15, unit: 'min', zone: [8, 12], what: ['HEBT PARTIKEL AB', 'LIFTS PARTICLES']},
  {name: 'SC-2', col: '#dfe8b8', max: 15, unit: 'min', zone: [8, 12], what: ['LÖST METALLE', 'DISSOLVES METALS']},
  {name: 'HF 1%', col: '#cfe3f5', max: 150, unit: 's', zone: [45, 90], what: ['LÖST NATIVES OXID', 'STRIPS NATIVE OXIDE']},
];
const BATH_FRAMES = 420;
// The bench: a load station, three chemical baths, the rinse and the dryer. The robot moves the 25 wafers from the
// FOUP into a carrier, the gripper on the gantry takes it from bath to bath. You time the three chemical baths;
// rinsing (quick dump), drying (IPA vapour) and putting the wafers back into the FOUP run by themselves.
const CLEAN_LOAD = 130, CL_RINSE = 150, CL_DRY = 130, CL_BACK = 84, CL_UNLOAD = 100;
const clean = {
  init(m) { m.bath = 0; m.st = 'load'; m.bt = 0; m.res = []; m.times = []; },
  update(m, inp) {
    // What the bench does by itself runs at double speed: you only watch it.
    m.bt += ['load', 'rinse', 'dry', 'back', 'unload'].includes(m.st) ? 2 : 1;
    if (m.st === 'load') { if (m.bt >= CLEAN_LOAD) { m.st = 'down'; m.bt = 0; } if (m.bt % 16 === 0 && m.bt > 10 && m.bt < 90) m.sfx('click'); return; }
    if (m.st === 'down' && m.bt >= 36) { m.st = 'in'; m.bt = 0; }
    else if (m.st === 'in') {
      const b = BATHS[m.bath], v = m.bt / BATH_FRAMES * b.max;
      if (inp.pressed || m.bt >= BATH_FRAMES) {
        const [z0, z1] = b.zone, off = v < z0 ? z0 - v : v > z1 ? v - z1 : 0;
        m.res.push(clamp(1 - off / b.max * 4, 0, 1)); m.times.push(v);
        m.st = 'up'; m.bt = 0; m.sfx('click');
      }
    } else if (m.st === 'up' && m.bt >= 44) {
      m.bath++; m.bt = 0; m.st = m.bath >= BATHS.length ? 'rinse' : 'down';
    } else if (m.st === 'rinse' && m.bt >= CL_RINSE) { m.st = 'dry'; m.bt = 0; m.sfx('click'); }
    else if (m.st === 'dry' && m.bt >= CL_DRY) { m.st = 'back'; m.bt = 0; }
    else if (m.st === 'back' && m.bt >= CL_BACK) { m.st = 'unload'; m.bt = 0; }
    else if (m.st === 'unload') {
      if (m.bt % 16 === 0 && m.bt < 80) m.sfx('click');
      if (m.bt >= CL_UNLOAD) {
        const [s1, s2, s3] = m.res, particles = Math.round(1 + 26 * (1 - s1) + 6 * (1 - s3));
        finish(m, (s1 + s2 + s3) / 3, {particles}, [
          L(`SC-1 ${num(m.times[0])} min · SC-2 ${num(m.times[1])} min · HF ${Math.round(m.times[2])} s`, `SC-1 ${num(m.times[0])} min · SC-2 ${num(m.times[1])} min · HF ${Math.round(m.times[2])} s`),
          L('Gespült, getrocknet, zurück in der Box. Die Partikelmessung zählt gleich nach.', 'Rinsed, dried, back in the box. The particle scanner counts next.')]);
      }
    }
  },
  draw(m) {
    const auto = ['rinse', 'dry', 'back', 'unload'].includes(m.st);
    const help = m.st === 'load' ? L('DER ROBOTER SETZT DIE 25 WAFER IN DEN TRÄGER', 'THE ROBOT MOVES THE 25 WAFERS INTO THE CARRIER')
      : m.st === 'unload' || m.st === 'back' ? L('ZURÜCK IN DIE BOX', 'BACK INTO THE BOX')
      : auto ? L('SPÜLEN UND TROCKNEN LAUFEN VON SELBST', 'RINSING AND DRYING RUN BY THEMSELVES')
      : L('SHIFT: HERAUSHEBEN, WENN DIE ZEIT IM GRÜNEN IST', 'SHIFT: LIFT OUT WHILE THE TIME IS IN THE GREEN');
    const a = frame(m, L('REINIGEN · RCA', 'CLEAN · RCA'), help);
    const tw = (a.w - 16) / 6, ty = a.y + 26, th = 32, col = i => a.x + 8 + i * tw, mid = i => col(i) + (tw - 6) / 2;
    // Gantry rail with its trolley.
    R('#7c8693', a.x + 4, a.y + 5, a.w - 8, 3); R('#5a6370', a.x + 4, a.y + 8, a.w - 8, 1);
    const tanks = [...BATHS, {name: L('SPÜLEN', 'RINSE'), col: '#d4e6fa', zone: null}, {name: L('TROCKNEN', 'DRY'), col: '#cfe0f0', zone: null}];
    // Where the carrier is (tank index 0..4, or -1 at the load station) and how deep it hangs (0 up, 1 down).
    const lx = col(0), lw = tw - 6, c0 = lx + 22;
    let cx, dip, tank = -1;
    if (m.st === 'load') { const g = clamp((m.bt - 90) / 40, 0, 1); cx = c0 + (mid(1) - c0) * smooth((g - 0.3) / 0.7); dip = 1 - smooth(g / 0.3); }
    else if (m.st === 'rinse') { tank = 3; cx = mid(4); dip = m.bt < 30 ? smooth(m.bt / 30) : m.bt < 125 ? 1 : 1 - smooth((m.bt - 125) / 25); }
    else if (m.st === 'dry') { tank = 4; cx = m.bt < 30 ? mid(4) + (mid(5) - mid(4)) * smooth(m.bt / 30) : mid(5); dip = m.bt < 30 ? 0 : m.bt < 52 ? smooth((m.bt - 30) / 22) : 1 - smooth((m.bt - 52) / 78); }
    else if (m.st === 'back') { cx = mid(5) + (c0 - mid(5)) * smooth(clamp(m.bt / 70, 0, 1)); dip = smooth((m.bt - 70) / 14); }
    else if (m.st === 'unload') { cx = c0; dip = 1; }
    else {
      const at = Math.min(m.bath, 3), from = mid(at + 1), to = mid(Math.min(5, at + 2));
      tank = at; dip = m.st === 'down' ? smooth(m.bt / 36) : m.st === 'in' ? 1 : 1 - smooth(m.bt / 16);
      cx = m.st === 'up' && m.bt > 16 ? from + (to - from) * smooth((m.bt - 16) / 28) : from;
    }
    const cy = a.y + 10 + dip * 20, dipped = dip > 0.6;
    // Load station: the FOUP with its door open; wafers go into the carrier five at a time, and at the end back.
    const inBox = m.st === 'load' ? 5 - clamp(Math.floor((m.bt - 10) / 16), 0, 5) : m.st === 'unload' ? clamp(Math.floor(m.bt / 16), 0, 5) : 0;
    R('#7c8693', lx - 6, ty + 4, 13, 22); R('#141a28', lx - 4, ty + 6, 9, 18);
    for (let n = 0; n < inBox; n++) for (let q = 0; q < 5; q++) R('#c9ced6', lx - 3, ty + 7 + (n * 5 + q) * 0.68, 7, 1);
    R('#d8262a', lx - 8, ty + 8, 2, 6);
    const moving = (m.st === 'load' && m.bt > 10 && m.bt < 90) || (m.st === 'unload' && m.bt < 80);
    if (moving) { const f = (m.bt % 16) / 16, dx = m.st === 'load' ? f : 1 - f; R('#9aa3ad', lx + 4 + dx * 6, ty + 12, 5, 1); R('#c9ced6', lx + 4 + dx * 6, ty + 10, 5, 2); }
    R('#5a6270', lx + 8, ty + th - 2, lw - 6, 3);
    text(L('LADEN', 'LOAD'), mid(0), ty + th + 2, {align: 'center', color: m.st === 'load' || m.st === 'unload' ? '#ffcf5a' : '#6b7190', max: tw - 6});
    // Quick dump rinse: the water drops away and is sprayed back in, twice.
    const qdr = m.st === 'rinse' && m.bt > 30 && m.bt < 125 ? Math.abs(Math.sin((m.bt - 30) / 95 * Math.PI * 2)) : 0;
    tanks.forEach((b, i) => {
      const bx = col(i + 1), bw = tw - 6, cur = i === tank, hot = i < 2, here = cur && dipped;
      R('#5a6270', bx, ty, bw, th); R('#2a303a', bx + 2, ty + 2, bw - 4, th - 4);
      if (i === 4) {
        // The dryer: a closed chamber, its lid open while the carrier goes in or out; IPA vapour above the water.
        R(b.col, bx + 2, ty + 20, bw - 4, th - 22); R('rgba(255,255,255,.55)', bx + 2, ty + 20, bw - 4, 1);
        for (let k = 0; k < 3; k++) { const vy = (F * 0.3 + k * 6) % 16; ctx.fillStyle = `rgba(235,240,255,${0.35 * (1 - vy / 16)})`; ctx.beginPath(); ctx.arc(bx + 6 + k * 9, ty + 18 - vy, 2 + vy / 6, 0, 7); ctx.fill(); }
        const open = m.st === 'dry' || (m.st === 'back' && m.bt < 12);
        R('#7c8693', open ? bx + bw - 4 : bx, ty - 3, open ? 4 : bw, 3);
        text('IPA', bx + bw / 2, ty + 6, {align: 'center', color: '#7a8a9a', size: 8});
      } else {
        // The bath: liquid (a little higher with the carrier in it), its surface, the heater glow.
        const lv = ty + 7 - (here ? 2 : 0) + (i === 3 ? Math.round(qdr * (th - 12)) : 0);
        R(b.col, bx + 2, lv, bw - 4, ty + th - 2 - lv); R('rgba(255,255,255,.55)', bx + 2, lv, bw - 4, 1);
        if (hot) R('rgba(255,120,60,.5)', bx + 2, ty + th - 4, bw - 4, 2);
        if (hot) for (let k = 0; k < 4; k++) circle('rgba(255,255,255,.75)', bx + 4 + ((k * 11 + i * 5) % (bw - 8)), ty + th - 4 - ((F * 0.4 + k * 7) % (th - 12)), 0.9);
        if (hot) for (let k = 0; k < 2; k++) { const sy = (F * 0.25 + k * 10) % 18; ctx.fillStyle = `rgba(220,230,240,${0.25 * (1 - sy / 18)})`; ctx.beginPath(); ctx.arc(bx + 7 + k * 12 + Math.sin(F / 20 + k) * 2, ty - sy, 3 + sy / 6, 0, 7); ctx.fill(); }
        if (i === 3) {
          R('rgba(210,230,255,.8)', bx - 1, ty - 1, 2, 6 + (F >> 3) % 3); R('rgba(210,230,255,.8)', bx + bw - 1, ty - 1, 2, 6 + ((F >> 3) + 1) % 3);
          if (qdr > 0.05) for (let k = 0; k < 6; k++) R('rgba(210,230,255,.9)', bx + 3 + k * 5, ty + 3 + ((F * 2 + k * 5) % 12), 1, 3);
        }
        if (i === 2) text('HF', bx + bw - 3, ty + th - 9, {align: 'right', color: '#7a8a9a', size: 8});
      }
      text(b.name, bx + bw / 2, ty + th + 2, {align: 'center', color: cur ? '#ffcf5a' : '#6b7190', max: tw - 4});
      if (i < 3) {
        // The timer bar with its green window.
        const by = ty + th + 12, z = b.zone;
        R('#1a2030', bx, by, bw, 5);
        R('#1f6a36', bx + z[0] / b.max * bw, by, (z[1] - z[0]) / b.max * bw, 5);
        const v = i < m.bath ? m.times[i] / b.max : i === m.bath && m.st === 'in' ? m.bt / BATH_FRAMES : 0;
        R(i < m.bath ? '#9aa3ad' : '#ffcf5a', bx, by + 1, v * bw, 3);
        if (i === m.bath && m.st === 'in') text(`${num(v * b.max, b.unit === 's' ? 0 : 1)} ${b.unit}`, bx + bw / 2, by + 7, {align: 'center', color: '#e9e4d6', max: bw});
        else if (i < m.bath) text(grade(m.res[i]).word, bx + bw / 2, by + 7, {align: 'center', color: grade(m.res[i]).color, max: bw + 4});
      }
    });
    // The carrier on its gripper.
    R('#9aa3ad', cx - 6, a.y + 3, 12, 6); R('#9aa3ad', cx - 1, a.y + 9, 2, cy - a.y - 9);
    R('#7c8693', cx - 9, cy - 2, 18, 2); R('#7c8693', cx - 9, cy - 2, 2, 5); R('#7c8693', cx + 7, cy - 2, 2, 5);
    R('#e6e9ee', cx - 13, cy + 1, 26, 16); R('#c3ccd8', cx - 13, cy + 15, 26, 2);
    for (let k = 0; k < 25; k++) R(k % 2 ? '#f7f9fc' : '#aab4c2', cx - 12 + k, cy + 3, 1, 11);
    const inCarrier = 5 - inBox;
    if (m.st === 'load' || m.st === 'unload') { ctx.fillStyle = 'rgba(13,17,26,.7)'; ctx.fillRect(cx - 12 + inCarrier * 5, cy + 3, 25 - inCarrier * 5, 11); }
    text(m.st === 'load' || m.st === 'unload' ? `${inCarrier * 5}/25` : '25', cx, cy - 11, {align: 'center', color: '#c9c2ae', max: 30});
    // In a bath the liquid covers the carrier: drawn again over it, see-through.
    if (tank >= 0 && tank < 4 && dipped) {
      const bx = col(tank + 1), lv = ty + 5 + (tank === 3 ? Math.round(qdr * (th - 12)) : 0), b = tanks[tank];
      if (cy + 17 > lv) { ctx.globalAlpha = 0.55; R(b.col, Math.max(bx + 2, cx - 14), lv, 28, Math.min(ty + th - 2, cy + 18) - lv); ctx.globalAlpha = 1; R('rgba(255,255,255,.55)', Math.max(bx + 2, cx - 14), lv, 28, 1); }
    }
    if (tank === 4 && dip > 0.3) { const lv = ty + 20; if (cy + 17 > lv) { ctx.globalAlpha = 0.5; R(tanks[4].col, cx - 14, lv, 28, Math.min(ty + th - 2, cy + 18) - lv); ctx.globalAlpha = 1; } }
    if ((m.st === 'up' && m.bt < 30) || (m.st === 'rinse' && m.bt > 125)) for (let k = 0; k < 4; k++) { const dy = ((m.bt * 2 + k * 9) % 20); circle('rgba(190,220,255,.85)', cx - 9 + k * 6, cy + 18 + dy, 1); }
    // Between the baths the gantry passes spray nozzles: DI water stops the chemistry before the next bath.
    const between = m.st === 'up' && m.bath < 2 && m.bt > 16;
    if (between) for (let k = 0; k < 6; k++) {
      const p = ((m.bt * 3 + k * 7) % 14) / 14, yy = cy + 3 + k * 2 + p * 3;
      circle('rgba(190,220,255,.9)', cx - 20 + p * 9, yy, 1); circle('rgba(190,220,255,.9)', cx + 20 - p * 9, yy, 1);
    }
    // What the step does to the surface.
    const k = m.st === 'in' && m.bath < 3 ? m.bt / BATH_FRAMES : 0;
    const zy = a.y + a.h - 18, zx = a.x + 10, zw = a.w - 20;
    R('#141a28', zx, zy, zw, 18); R('#4f5866', zx, zy + 12, zw, 6);
    if (auto || m.st === 'load') {
      const say = {load: L('25 WAFER AUS DER BOX IN DEN TRÄGER', '25 WAFERS FROM THE BOX INTO THE CARRIER'), rinse: L('DI-WASSER SPÜLT DIE SÄURE AB', 'DI WATER RINSES THE ACID OFF'),
        dry: L('IPA-DAMPF: DAS WASSER LÄUFT OHNE TROPFEN AB', 'IPA VAPOUR: THE WATER RUNS OFF WITHOUT DROPS'), back: L('ZURÜCK ZUR BOX', 'BACK TO THE BOX'), unload: L('25 WAFER ZURÜCK IN DER BOX', '25 WAFERS BACK IN THE BOX')}[m.st];
      text(say, zx + 3, zy + 1, {color: '#9fe0ff', max: zw - 10});
    } else if (between) {
      text(L('ZWISCHENSPÜLEN: DI-WASSER STOPPT DIE CHEMIE', 'RINSE BETWEEN BATHS: DI WATER STOPS THE CHEMISTRY'), zx + 3, zy + 1, {color: '#9fe0ff', max: zw - 10});
    } else if (m.bath < 3) {
      const b = BATHS[m.bath], part = b.zone[0] / b.max;
      text(`${b.name} ${b.what[lang === 'de' ? 0 : 1]}`, zx + 3, zy + 1, {color: '#9fe0ff', max: zw - 10});
      for (let j = 0; j < 9; j++) {
        const gone = clamp(k / part - j * 0.05, 0, 1);
        if (gone < 1) { ctx.globalAlpha = 1 - gone; circle(m.bath === 1 ? '#e0402a' : '#8a7a5a', zx + zw - 90 + j * 10, zy + 10 - gone * 6, m.bath === 1 ? 1 : 1.6); ctx.globalAlpha = 1; }
      }
      if (k > b.zone[1] / b.max) for (let j = 0; j < zw; j += 3) R('#2a303a', zx + j, zy + 12, 2, (j * 7) % 3);
      // In HF the bare silicon turns water-repellent: the wafer dewets. The sign that the oxide is gone.
      if (m.bath === 2 && k * b.max >= b.zone[0]) {
        text(L('WAFER ENTNETZT', 'WAFER DEWETS'), zx + zw - 4, zy + 1, {align: 'right', color: '#3fe06a'});
        for (let j = 0; j < 6; j++) circle('rgba(170,210,255,.9)', zx + 20 + j * 17 + Math.sin(F / 20 + j) * 2, zy + 10, 2);
      }
    }
    ctx.restore(); result(m, a);
  },
};

/* ---------- 2 Oxidise: oxygen off at 50 nm. Deal-Grove: fast at first, then slower ---------- */
// The furnace recipe: the boat sits at 700 °C, ramps to 1000 °C, holds there while dry O₂ flows, cools under N₂.
// You set the heater power with ↑ ↓; the tube follows slowly (it is a lot of quartz and metal). Oxide grows only
// during the hold, faster the hotter (Deal-Grove, B ∝ exp(−1.23 eV / kT)): stay on the curve and it is 50 nm.
const OX_TAU = 180, OX_A = 50, RAMP = 1.0;
const oxide = g => OX_A * (Math.sqrt(1 + g / OX_TAU) - 1);
const OX_IN = 120, OX_UP = 300, OX_HOLD = 480, OX_DOWN = 180, OX_LAG = 90, OX_EA = 1.23;
const oxGoal = f => f < OX_IN ? 700 : f < OX_IN + OX_UP ? 700 + 300 * (f - OX_IN) / OX_UP : f < OX_IN + OX_UP + OX_HOLD ? 1000
  : f < OX_IN + OX_UP + OX_HOLD + OX_DOWN ? 1000 - 200 * (f - OX_IN - OX_UP - OX_HOLD) / OX_DOWN : 800;
const oxSS = P => 400 + 70 * P;                         // where the tube settles at heater power P (0 to 10)
const oxRate = T => 540 / OX_HOLD * Math.exp(OX_EA / KB_EV * (1 / 1273.15 - 1 / (T + 273.15)));
const KB_EV = 8.617e-5;
const oxidize = {
  init(m) { m.f = 0; m.T = 700; m.P = (700 - 400) / 70; m.g = 0; m.err = 0; m.n = 0; m.goal = 700; m.slope = 0; m.hist = []; },
  update(m, inp) {
    if (m.t < 40) return;
    m.f++;
    if (inp.up) m.P = Math.min(10, m.P + 0.04);
    if (inp.down) m.P = Math.max(0, m.P - 0.04);
    m.T += (oxSS(m.P) - m.T) / OX_LAG;
    m.goal = oxGoal(m.f); m.slope = oxGoal(m.f + 1) - m.goal;
    m.err += (m.T - m.goal) ** 2; m.n++;
    if (m.f % 3 === 0) m.hist.push([m.f, m.T]);
    const hold = m.f >= OX_IN + OX_UP && m.f < OX_IN + OX_UP + OX_HOLD;
    if (hold) m.g += oxRate(m.T);
    if (m.f >= OX_IN + OX_UP + OX_HOLD + OX_DOWN) {
      const fin = oxide(m.g) + RAMP, rms = Math.sqrt(m.err / m.n);
      const thick = clamp(1 - Math.abs(fin - 50) / 10, 0, 1), track = clamp(1 - rms / 40, 0, 1);
      m.sfx('click');
      finish(m, 0.65 * thick + 0.35 * track, {oxide: fin}, [
        L(`SiO₂ ${num(fin)} nm · ${L('im Mittel', 'on average')} ${Math.round(rms)} °C ${L('neben der Kurve', 'off the curve')}`, `SiO₂ ${num(fin)} nm · ${Math.round(rms)} °C off the curve on average`),
        fin > 51.5 ? L('Zu heiß gehalten: Das Oxid ist zu dick geworden.', 'Held too hot: the oxide grew too thick.')
          : fin < 48.5 ? L('Zu kalt gehalten: Das Oxid ist zu dünn.', 'Held too cold: the oxide is too thin.')
            : L('Die Rampe sauber gefahren. Das Ellipsometer misst nach.', 'A clean ramp. The ellipsometer checks it.')]);
    }
  },
  draw(m) {
    const a = frame(m, L('OXIDIEREN · 1000 °C, TROCKEN', 'OXIDISE · 1000 °C, DRY'), L('↑ ↓ HEIZLEISTUNG · FOLGE DER GELBEN KURVE', '↑ ↓ HEATER POWER · FOLLOW THE YELLOW CURVE'));
    const rise = smooth(m.t / 40), heat = clamp((m.T - 600) / 400, 0, 1), hold = m.f >= OX_IN + OX_UP && m.f < OX_IN + OX_UP + OX_HOLD;
    window.SchichtProcess.furnace(ctx, a.x + 2, a.y + 2, 86, a.h - 14, {rise, heat, t: m.t, gas: hold ? ['rgba(160,220,255,.9)'] : m.f > OX_IN + OX_UP + OX_HOLD ? ['rgba(200,210,255,.6)'] : null,
      temp: `${Math.round(m.T)} °C`});
    text(hold ? L('O₂ STRÖMT', 'O₂ FLOWING') : m.f > OX_IN + OX_UP + OX_HOLD ? L('N₂ SPÜLT', 'N₂ PURGE') : L('RAMPE', 'RAMP'), a.x + 45, a.y + a.h - 10, {align: 'center', color: hold ? '#9fe0ff' : '#9aa6b5', max: 90});
    // The recipe curve (yellow) and the tube temperature (blue), 650 to 1100 °C, over the whole run.
    const px = a.x + 92, pw = a.w - 98, gx = px + 4, gy = a.y + 30, gw = pw - 8, gh = a.h - 50;
    const total = OX_IN + OX_UP + OX_HOLD + OX_DOWN, toY = T => gy + gh - (T - 650) / 450 * gh, toX = f => gx + f / total * gw;
    R('#0b0f18', gx, gy, gw, gh);
    ctx.globalAlpha = 0.18; R('#9fe0ff', toX(OX_IN + OX_UP), gy, toX(OX_IN + OX_UP + OX_HOLD) - toX(OX_IN + OX_UP), gh); ctx.globalAlpha = 1;
    text('O₂', toX(OX_IN + OX_UP + OX_HOLD / 2), gy + 2, {align: 'center', color: '#6b9ec0', font: 'IBM Plex Sans', size: 7});
    ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 2; ctx.setLineDash([3, 2]); ctx.beginPath();
    for (let f = 0; f <= total; f += 6) ctx[f ? 'lineTo' : 'moveTo'](toX(f), toY(oxGoal(f))); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#9fe0ff'; ctx.lineWidth = 1; ctx.beginPath();
    m.hist.forEach(([f, T], i) => ctx[i ? 'lineTo' : 'moveTo'](toX(f), toY(T))); ctx.stroke();
    circle('#ffffff', toX(m.f), toY(m.T), 1.5);
    const off = m.T - m.goal, okT = Math.abs(off) < 10;
    text(`${Math.round(m.T)} °C`, px + pw / 2 - 30, a.y + 4, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: okT ? '#3fe06a' : Math.abs(off) < 30 ? '#ffcf5a' : '#ff8a5a'});
    text(`${L('SOLL', 'SET')} ${Math.round(m.goal)} °C`, px + pw / 2 + 36, a.y + 4, {align: 'center', color: '#ffcf5a', max: 70});
    text(`SiO₂ ${num(oxide(m.g))} nm`, px + pw / 2 + 36, a.y + 14, {align: 'center', color: '#cfe8ff', max: 70});
    // Heater power as a bar under the graph.
    R('#1a2030', gx, gy + gh + 6, gw, 4); R('#ff9a4a', gx, gy + gh + 6, gw * m.P / 10, 4);
    text(L('HEIZUNG', 'HEATER'), gx, gy + gh + 11, {color: '#8c93a8', font: 'IBM Plex Sans', size: 6});
    ctx.restore(); result(m, a);
  },
};

/* ---------- 2b Nitride: LPCVD, SiH2Cl2 + NH3 at 780 °C. The gas enters at the top of the tube and is used up on
 * its way down, so the lower wafers get less. Tilt the three heater zones until every wafer grows alike. ---------- */
// Rate per wafer: Arrhenius in the local temperature (Ea about 1.8 eV: +1.9 % per kelvin near 780 °C) times the gas
// left at that height (down to 74 % at the bottom). The zones follow their set point with some delay.
const NIT_EA = 1.8, KB = 8.617e-5, NIT_T0 = 780, NIT_N = 12, NIT_TARGET = 100, NIT_RATE = 100 / 520, NIT_LAG = 35;
const nitGas = i => 1 - 0.26 * i / (NIT_N - 1);
const nitTemp = (z, i) => {
  // Zone centres at wafers 1.5, 5.5 and 9.5; the profile runs linearly through them and on past the ends.
  const p = (i - 1.5) / 4, k = clamp(Math.floor(p), 0, 1), f = p - k;
  return z[k] + (z[Math.min(2, k + 1)] - z[k]) * f;
};
const nitRate = (z, i) => nitGas(i) * Math.exp(NIT_EA / KB * (1 / (NIT_T0 + 273.15) - 1 / (nitTemp(z, i) + 273.15)));
function nitUniformity(v) { const mx = Math.max(...v), mn = Math.min(...v), mean = v.reduce((a, b) => a + b, 0) / v.length; return {mean, u: (mx - mn) / (2 * mean) * 100}; }
const nitride = {
  init(m) { m.st = 'load'; m.bt = 0; m.set = [780, 780, 780]; m.act = [780, 780, 780]; m.sel = 2; m.th = Array(NIT_N).fill(0); m.prev = {}; },
  update(m, inp) {
    m.bt++;
    if (m.st === 'load') { if (m.bt > 100) { m.st = 'tune'; m.bt = 0; } return; }
    // ↑ ↓ pick a zone, ← → move its set point; the real temperature follows.
    if (inp.up && !m.prev.up) m.sel = Math.max(0, m.sel - 1);
    if (inp.down && !m.prev.down) m.sel = Math.min(2, m.sel + 1);
    if (inp.left) m.set[m.sel] = Math.max(760, m.set[m.sel] - 0.1);
    if (inp.right) m.set[m.sel] = Math.min(820, m.set[m.sel] + 0.1);
    m.prev = {up: inp.up, down: inp.down};
    for (let k = 0; k < 3; k++) m.act[k] += (m.set[k] - m.act[k]) / NIT_LAG;
    if (m.st === 'tune') { if (inp.pressed) { m.st = 'run'; m.bt = 0; m.sfx('click'); } return; }
    for (let i = 0; i < NIT_N; i++) m.th[i] += NIT_RATE * nitRate(m.act, i);
    const {mean, u} = nitUniformity(m.th);
    if (mean >= NIT_TARGET) {
      // ±1 % is as good as the tool gets; from about ±7 % the lot is scrap.
      finish(m, 1 - Math.max(0, u - 1) / 6, {nitride: mean, nitrideU: u}, [
        L(`Si₃N₄ ${num(mean)} nm · Gleichmäßigkeit ±${num(u)} %`, `Si₃N₄ ${num(mean)} nm · uniformity ±${num(u)} %`),
        L(`Zonen ${m.set.map(v => num(v)).join(' / ')} °C. Das Ellipsometer misst nach.`, `Zones ${m.set.map(v => num(v)).join(' / ')} °C. The ellipsometer checks it.`)]);
    }
  },
  draw(m) {
    const help = {load: L('DAS BOOT FÄHRT EIN', 'THE BOAT IS LOADING'), tune: L('↑↓ ZONE · ←→ TEMPERATUR · SHIFT: ABSCHEIDEN', '↑↓ ZONE · ←→ TEMPERATURE · SHIFT: DEPOSIT'),
      run: L('ABSCHEIDUNG LÄUFT · ←→ NACHREGELN', 'DEPOSITING · ←→ TO ADJUST')}[m.st];
    const a = frame(m, L('NITRID · LPCVD, 0,3 MBAR', 'NITRIDE · LPCVD, 0.3 MBAR'), help);
    const rise = smooth(m.t / 100), heat = clamp((m.t - 40) / 60, 0, 1);
    const f = window.SchichtProcess.furnace(ctx, a.x + 2, a.y + 2, 86, a.h - 14, {rise, heat, t: m.t, gas: m.st === 'run' ? ['rgba(120,200,255,.9)', 'rgba(140,240,160,.9)'] : null,
      temp: m.st === 'load' ? `${Math.round(400 + 380 * heat)} °C` : 'SiH₂Cl₂ + NH₃'});
    text(L('GAS VERARMT ZUM ENDE', 'GAS DEPLETES ALONG'), a.x + 45, a.y + a.h - 10, {align: 'center', color: '#9aa6b5', max: 90});
    if (m.st === 'load') { ctx.restore(); result(m, a); return; }
    // The three heater zones: set point and actual temperature; the selected one is framed.
    const px = a.x + 92, names = L(['OBEN', 'MITTE', 'UNTEN'], ['TOP', 'MIDDLE', 'BOTTOM']);
    for (let k = 0; k < 3; k++) {
      const zy = a.y + 4 + k * 22, sel = k === m.sel, hot = clamp((m.act[k] - 770) / 40, 0, 1);
      R(sel ? '#1c160c' : '#0b0f18', px, zy, 72, 19);
      if (sel) { ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, zy + 0.5, 71, 18); }
      R(`rgb(${Math.round(150 + 105 * hot)},${Math.round(90 + 40 * hot)},40)`, px + 3, zy + 4, 3, 11);
      text(names[k], px + 9, zy + 2, {color: sel ? '#ffcf5a' : '#8c93a8', max: 36});
      text(`${num(m.act[k], 1)} °C`, px + 9, zy + 10, {color: '#e9e4d6', max: 50});
      // The set point, while the zone is still on its way there.
      if (Math.abs(m.set[k] - m.act[k]) > 0.2) text(`→ ${num(m.set[k])}`, px + 69, zy + 2, {align: 'right', color: '#c9a15a', font: 'IBM Plex Sans', size: 7, max: 26});
    }
    // Twelve wafers, top to bottom: the rate now (tune) or the thickness so far (run), against the mean.
    const bx = px + 78, bw = a.x + a.w - bx - 4, rates = m.th.map((_, i) => nitRate(m.act, i));
    const vals = m.st === 'run' ? m.th : rates, {mean, u} = nitUniformity(vals);
    text(m.st === 'run' ? L('DICKE JE WAFER', 'THICKNESS PER WAFER') : L('RATE JE WAFER', 'RATE PER WAFER'), bx + bw / 2, a.y + 2, {align: 'center', color: '#9fe0ff', max: bw});
    const top = a.y + 13, row = 5.2, mid = bx + bw / 2;
    R('#3a4058', mid, top - 1, 1, NIT_N * row + 1);
    vals.forEach((v, i) => {
      const dev = mean ? (v - mean) / mean : 0, len = clamp(dev * 300, -bw / 2 + 2, bw / 2 - 2), ok = Math.abs(dev) < 0.01;
      R(ok ? '#3fe06a' : Math.abs(dev) < 0.03 ? '#ffcf5a' : '#ff8a5a', len < 0 ? mid + len : mid + 1, top + i * row, Math.max(1, Math.abs(len)), 3);
    });
    text(L('− DÜNNER', '− THINNER'), bx + 2, top + NIT_N * row + 2, {color: '#5a6280', font: 'IBM Plex Sans', size: 6, max: bw / 2});
    text(L('DICKER +', 'THICKER +'), bx + bw - 2, top + NIT_N * row + 2, {align: 'right', color: '#5a6280', font: 'IBM Plex Sans', size: 6, max: bw / 2});
    const ok = u < 1.1;
    text(`±${num(u)} %`, bx + bw / 2, a.y + a.h - 22, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: ok ? '#3fe06a' : u < 3 ? '#ffcf5a' : '#ff8a5a'});
    if (m.st === 'run') {
      const th = nitUniformity(m.th).mean;
      text(`Si₃N₄ ${Math.round(th)} nm · t = ${Math.round(th / 3.4)} min`, a.x + 45, a.y + a.h - 19, {align: 'center', color: '#bfe6c8', max: 90, font: 'IBM Plex Sans', size: 7});
    }
    ctx.restore(); result(m, a);
  },
};

/* ---------- 3 Coat: hold SHIFT to spin up; the film thins as 1/sqrt(rpm). Let go and it dries ---------- */
// For 40 nm lines the resist is thin: 100 nm at 2000 rpm. Thicker resist would make the lines topple.
const filmOf = rpm => rpm > 200 ? 100 * Math.sqrt(2000 / rpm) : 400;
// The film only ever gets thinner: what is flung off the edge does not come back. At each speed it thins towards
// the thickness that speed allows (h ∝ 1/√ω) and stays there; slowing down again leaves it as it is.
const coat = {
  // Once, for a moment, the wet resist mirrors a hood behind you that is not there.
  init(m) { m.rpm = 0; m.still = 0; m.rot = 0; m.spinning = false; m.film = 400; m.prev = {}; m.spinT = 0; m.ghost = 150 + Math.random() * 120; },
  update(m, inp) {
    if (m.t < 50) return;
    const tap = k => inp[k] && !m.prev[k];
    if (inp.held) { m.rpm = Math.min(5000, m.rpm + 10); m.still = 0; m.spinning = true; }
    // ↑ ↓: 50 rpm per press, and on while held.
    else if (m.spinning && (inp.down || inp.up)) { m.rpm = clamp(m.rpm + (inp.up ? 1 : -1) * (tap(inp.up ? 'up' : 'down') ? 50 : 4), 500, 5000); m.still = 0; }
    else if (m.spinning) m.still++;
    m.prev = {up: inp.up, down: inp.down};
    if (m.spinning) { m.spinT++; if (m.spinT === Math.floor(m.ghost)) m.sfx('whisper'); }
    m.rot += m.rpm / 6000;
    const eq = filmOf(m.rpm);
    if (eq < m.film) m.film += (eq - m.film) * 0.05;
    // It dries at any speed; a slow spin just leaves a far too thick film.
    if (m.spinning && m.still >= 150) {
      const film = m.film;
      finish(m, 1 - Math.abs(film - 100) / 20, {resist: film, rpm: m.rpm}, [
        L(`${Math.round(m.rpm)} U/min → Lack ${num(film)} nm`, `${Math.round(m.rpm)} rpm → resist ${num(film)} nm`),
        L('Zu dick oder zu dünn verschiebt später die Linienbreite.', 'Too thick or too thin shifts the line width later.')]);
    }
  },
  draw(m) {
    const a = frame(m, L('BELACKEN · SPIN-COATING', 'COAT · SPIN COATING'), L('SHIFT HALTEN: SCHNELLER · ↑ ↓ FEIN · NUR DÜNNER, NIE DICKER', 'HOLD SHIFT: FASTER · ↑ ↓ FINE · ONLY THINNER, NEVER THICKER'));
    const cx = a.x + 62, cy = a.y + a.h / 2 + 2, r = 44, film = m.film;
    // Thin-film colours: the hue turns as the thickness changes (about 0.18 µm per order in resist).
    const hue = (film / 180 * 360) % 360;
    // The coater cup around the wafer: resist flung off the edge lands on its wall.
    circle('#1a2030', cx, cy, r + 9); circle('#2a3040', cx, cy, r + 7); circle('#141a28', cx, cy, r + 4);
    if (m.rpm > 0) for (let k = 0; k < 10; k++) R('rgba(217,154,50,.35)', cx + Math.cos(k * 0.63) * (r + 6) - 1, cy + Math.sin(k * 0.63) * (r + 6) - 1, 2, 2);
    circle('#5a6270', cx, cy, r + 1); circle('#c9ced6', cx, cy, r);
    const spread = m.t < 50 ? smooth((m.t - 20) / 30) * 10 : 10 + smooth(m.rpm / 1500) * (r - 10);
    if (m.t > 20) { ctx.globalAlpha = 0.85; circle(`hsl(${hue},55%,${m.spinning ? 55 : 45}%)`, cx, cy, spread); ctx.globalAlpha = 1; }
    // The edge bead: a little more resist stays at the rim once the film reaches it.
    if (spread > r - 2) { ctx.strokeStyle = `hsla(${hue},55%,35%,.9)`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, 7); ctx.stroke(); }
    for (let k = 0; k < 4; k++) { const ang = m.rot * 6 + k * Math.PI / 2; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, ang, ang + 0.4); ctx.stroke(); }
    // Spin-off: droplets leave the rim along the tangent, more and further the faster it turns.
    if (m.rpm > 300) for (let k = 0; k < 8; k++) {
      const ang = m.rot * 6 + k * 0.785, life = ((m.t * 0.15 + k * 0.37) % 1), d = life * 8 * Math.min(1, m.rpm / 3000);
      const ex = cx + Math.cos(ang) * r, ey = cy + Math.sin(ang) * r, tx = -Math.sin(ang), ty = Math.cos(ang);
      circle(`hsla(${hue},55%,50%,${1 - life})`, ex + tx * d + Math.cos(ang) * d * 0.5, ey + ty * d + Math.sin(ang) * d * 0.5, 0.9);
    }
    R('#0b0f18', cx - 2, cy + r - 2, 4, 3);
    // The reflection: ten frames, faint, and then only the spinning film again.
    if (m.spinT >= m.ghost && m.spinT < m.ghost + 10) {
      ctx.globalAlpha = 0.38 * Math.sin((m.spinT - m.ghost) / 10 * Math.PI);
      circle('#1a1408', cx + 10, cy - 8, 13); R('#1a1408', cx - 2, cy - 2, 24, 16);
      R('#050402', cx + 2, cy - 11, 16, 5); R('#ffb43a', cx + 4, cy - 10, 3, 2); R('#ffb43a', cx + 12, cy - 10, 3, 2);
      ctx.globalAlpha = 1;
    }
    // The dispense arm swings in over the centre, drops the resist, and swings out again.
    const arm = m.t < 12 ? smooth(m.t / 12) : m.t < 50 ? 1 : 1 - smooth((m.t - 50) / 20);
    if (arm > 0) {
      const nx = cx + (1 - arm) * (r + 30), ny = cy - 2;
      R('#7c8693', nx, ny - 2, cx + r + 34 - nx, 4); R('#5a6270', nx - 3, ny - 4, 7, 8); R('#d99a32', nx - 1, ny + 3, 3, 2);
      if (m.t > 15 && m.t < 48) circle('#d99a32', nx, ny + 6, 1.5);
    }
    // Dial with the green window around 3000 rpm.
    const dx = a.x + a.w - 70, dy = a.y + 54, dr = 34, A0 = Math.PI * 0.8, A1 = Math.PI * 2.2, ang = v => A0 + (A1 - A0) * v / 5000;
    ctx.lineWidth = 5; ctx.strokeStyle = '#1a2030'; ctx.beginPath(); ctx.arc(dx, dy, dr, A0, A1); ctx.stroke();
    // The target: a bright green window at 2000 rpm with its number, red beyond (too thin, no way back).
    ctx.lineWidth = 7; ctx.strokeStyle = '#3fe06a'; ctx.beginPath(); ctx.arc(dx, dy, dr, ang(1900), ang(2100)); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(224,64,42,.6)'; ctx.beginPath(); ctx.arc(dx, dy, dr + 4, ang(2300), A1); ctx.stroke();
    text('2000', dx + Math.cos(ang(2000)) * (dr - 14), dy + Math.sin(ang(2000)) * (dr - 14) - 4, {align: 'center', color: '#3fe06a'});
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffcf5a'; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(ang(m.rpm)) * (dr - 6), dy + Math.sin(ang(m.rpm)) * (dr - 6)); ctx.stroke();
    text(`${Math.round(m.rpm)}`, dx, dy + 8, {align: 'center', color: '#e9e4d6'});
    text(L('U/MIN', 'RPM'), dx, dy + 17, {align: 'center', color: '#6b7190'});
    text(`${num(Math.min(film, 400))} nm`, dx, a.y + 4, {align: 'center', color: Math.abs(film - 100) < 2 ? '#3fe06a' : '#cfe8ff'});
    text(L('ZIEL 100 NM', 'TARGET 100 NM'), dx, a.y + 14, {align: 'center', color: '#ffcf5a', max: 90});
    if (m.spinning && m.still > 0 && m.phase === 'play') {
      R('#1a2030', dx - 30, a.y + a.h - 8, 60, 3); R('#9fe0ff', dx - 30, a.y + a.h - 8, 60 * Math.min(1, m.still / 150), 3);
      text(L('TROCKNET', 'DRYING'), dx, a.y + a.h - 18, {align: 'center', color: '#9fe0ff'});
    }
    ctx.restore(); result(m, a);
  },
};

/* ---------- 4 Expose: load the reticle, align it (SHIFT stops the mark, X then Y), then the scanner steps
 * across the whole wafer by itself, field after field. Overlay is what you contribute. ---------- */
const ALIGN_A = 14, ALIGN_T = 240, NM_PER_PX = 2.5;
const sign = v => { const r = Math.round(v * 10) / 10; return `${r < 0 ? '−' : '+'}${num(Math.abs(r))}`; };
// Exposure fields on a 300 mm wafer: a full grid inside the round edge, walked in a meander.
const FIELD_GRID = (() => {
  const out = [], n = 10, s = 8;
  for (let j = 0; j < n; j++) {
    const row = [];
    for (let i = 0; i < n; i++) { const fx = (i - n / 2) * s, fy = (j - n / 2) * s; if (Math.hypot(fx + s / 2, fy + s / 2) < 38) row.push({fx, fy}); }
    out.push(...(j % 2 ? row.reverse() : row));
  }
  return out;
})();
const expose = {
  init(m) { m.st = 'load'; m.bt = 0; m.ph = Math.random() * 6; m.dx = 0; m.dy = 0; m.field = 0; },
  mark(m) { return ALIGN_A * Math.sin(m.ph + m.bt * Math.PI * 2 / ALIGN_T); },
  update(m, inp) {
    m.bt++;
    if (m.st === 'load' && m.bt > 100) { m.st = 'alignX'; m.bt = 0; }
    else if (m.st === 'alignX' || m.st === 'alignY') {
      if (inp.pressed || m.bt > 900) {
        const off = this.mark(m);
        if (m.st === 'alignX') { m.dx = off; m.st = 'alignY'; m.ph = Math.random() * 6; } else { m.dy = off; m.st = 'expose'; }
        m.bt = 0; m.sfx('click');
      }
    } else if (m.st === 'expose') {
      m.field = Math.min(FIELD_GRID.length, Math.floor(m.bt / 3));
      if (m.bt % 3 === 0 && m.field < FIELD_GRID.length) m.sfx('zap');
      if (m.bt > FIELD_GRID.length * 3 + 30) {
        const ox = m.dx * NM_PER_PX, oy = m.dy * NM_PER_PX, ov = Math.hypot(ox, oy);
        const sx = clamp(1 - Math.abs(m.dx) / 12, 0, 1), sy = clamp(1 - Math.abs(m.dy) / 12, 0, 1);
        finish(m, (sx + sy) / 2, {overlay: ov}, [
          `Overlay X ${sign(ox)} nm · Y ${sign(oy)} nm`,
          L(`${FIELD_GRID.length} Felder belichtet. Verschobene Ebenen treffen die Kontakte schlechter.`, `${FIELD_GRID.length} fields exposed. Shifted layers hit the contacts less well.`)]);
      }
    }
  },
  draw(m) {
    const help = {load: L('DAS RETIKEL WIRD GELADEN', 'LOADING THE RETICLE'), alignX: L('SHIFT: STOPPEN, WENN DIE MARKEN DECKEN · X', 'SHIFT: STOP WHEN THE MARKS MEET · X'),
      alignY: L('SHIFT: STOPPEN, WENN DIE MARKEN DECKEN · Y', 'SHIFT: STOP WHEN THE MARKS MEET · Y'), expose: L('BELICHTUNG LÄUFT, FELD FÜR FELD', 'EXPOSING, FIELD BY FIELD')}[m.st];
    const a = frame(m, L('BELICHTEN · ARF 193 NM, IMMERSION', 'EXPOSE · ARF 193 NM, IMMERSION'), help);
    // Side view of the scanner (shared with the process views): reticle loading, alignment beam, then exposure.
    const exp = m.st === 'expose' && m.field < FIELD_GRID.length, pulse = exp && (m.bt % 3) < 2;
    const f = FIELD_GRID[Math.min(m.field, FIELD_GRID.length - 1)];
    window.SchichtProcess.scanner(ctx, a.x + 2, a.y + 2, 114, a.h - 4, {t: m.t, pulse, load: m.st === 'load' ? smooth(m.bt / 90) : 1,
      scan: exp ? Math.sin(m.bt / 2) : 0, align: m.st === 'alignX' || m.st === 'alignY', step: exp ? Math.round(f.fx / 3) : 0}, lang);
    // Right: reticle library, alignment microscope or the wafer map.
    const px = a.x + 122, pw = a.w - 126, pc = px + pw / 2, pcy = a.y + a.h / 2 + 2;
    if (m.st === 'load') {
      text(L('RETIKEL-BIBLIOTHEK', 'RETICLE LIBRARY'), pc, a.y + 6, {align: 'center', color: '#9aa6b5', max: pw});
      for (let k = 0; k < 6; k++) { R('#3a4058', px + 10, a.y + 22 + k * 12, pw - 20, 8); if (k !== 2 || m.bt < 10) R('#cfe8ff', px + 14, a.y + 24 + k * 12, pw - 28, 4); }
      text(m.variant === 'contacts' ? L('MASKE 2 · KONTAKTE', 'MASK 2 · CONTACTS') : L('MASKE 1 · AKTIVGEBIET', 'MASK 1 · ACTIVE AREA'), pc, a.y + a.h - 14, {align: 'center', color: '#ffcf5a', max: pw});
    } else if (m.st === 'alignX' || m.st === 'alignY') {
      const r = 34, off = this.mark(m), ox = m.st === 'alignX' ? off : 0, oy = m.st === 'alignY' ? off : 0;
      const fx = m.st === 'alignY' ? m.dx : 0;
      circle('#2a3040', pc, pcy, r + 2); circle('#c8862a', pc, pcy, r);
      R('#5a3a10', pc - r, pcy, r * 2, 1); R('#5a3a10', pc, pcy - r, 1, r * 2);
      // The wafer's zero mark: a cross etched into the silicon before the first layer. The reticle mark: a bright frame.
      R('#3a2a10', pc - 2, pcy - 12, 4, 24); R('#3a2a10', pc - 12, pcy - 2, 24, 4);
      ctx.strokeStyle = '#9fe0ff'; ctx.lineWidth = 2; ctx.strokeRect(pc - 9 + ox + fx, pcy - 9 + oy, 18, 18);
      const nm = Math.round(off * NM_PER_PX);
      text(`${m.st === 'alignX' ? 'X' : 'Y'} ${nm >= 0 ? '+' : ''}${nm} nm`, pc, a.y + 2, {align: 'center', color: Math.abs(off) < 1 ? '#3fe06a' : '#e9e4d6', max: pw});
      text(L('JUSTAGE', 'ALIGNMENT'), pc, a.y + a.h - 10, {align: 'center', color: '#6b7190', max: pw});
    } else {
      const r = 40;
      circle('#5a6270', pc, pcy, r + 1); circle('#d99a32', pc, pcy, r);
      FIELD_GRID.forEach((f, k) => {
        if (k < m.field) R('rgba(110,60,190,.6)', pc + f.fx + 0.5, pcy + f.fy + 0.5, 7, 7);
        if (k === m.field && pulse) R('rgba(230,210,255,.95)', pc + f.fx + 0.5, pcy + f.fy + 0.5, 7, 7);
      });
      R('#0b0f18', pc - 2, pcy + r - 2, 4, 3);
      text(L(`FELD ${Math.min(m.field + 1, FIELD_GRID.length)}/${FIELD_GRID.length}`, `FIELD ${Math.min(m.field + 1, FIELD_GRID.length)}/${FIELD_GRID.length}`), pc, a.y + 2, {align: 'center', color: '#c9c2ae', max: pw});
    }
    ctx.restore(); result(m, a);
  },
};

/* ---------- 5 Etch: first the nitride clears (CN line drops), then the oxide (CO line drops). ----------
 * Then a little more: 20 to 30 % over-etch makes sure every trench is open. */
const etch = {
  // 100 nm nitride first, then 50 nm oxide, which CF₄/CHF₃ etches at least as fast: the oxide phase is the shorter.
  // The RF power must stay matched to the plasma: its impedance drifts, and jumps when the nitride is through.
  // Badly matched, the power is reflected and the etch stalls. ↑ ↓ tune the matching network.
  init(m) { m.tn = 130 + Math.random() * 50; m.te = m.tn + 50 + Math.random() * 40; m.g = 0; m.cn = []; m.co = []; m.match = 0.5; m.ideal = 0.5; m.refl = 0; m.mq = 0; m.mn = 0; m.ph = Math.random() * 6; },
  idealAt(m) { return 0.5 + 0.16 * Math.sin(m.t / 70 + m.ph) + 0.06 * Math.sin(m.t / 23) + 0.22 * smooth((m.g - m.tn) / 30); },
  lines(m, g) {
    const drop = (t0, len) => g < t0 ? 1 : g < t0 + len ? 1 - (g - t0) / len : 0;
    const n1 = Math.sin(g * 0.7) * 0.03 + Math.sin(g * 2.3 + 1) * 0.02, n2 = Math.sin(g * 0.9 + 2) * 0.03 + Math.sin(g * 1.7) * 0.02;
    const cn = 0.25 + 0.65 * drop(m.tn, 30) + n1;
    const co = 0.2 + 0.7 * (g < m.tn ? 0.1 : g < m.tn + 30 ? (g - m.tn) / 30 : 1) * drop(m.te, 40) + n2;
    return [cn, co];
  },
  update(m, inp) {
    if (m.t < 30) return;
    if (inp.up) m.match = Math.min(1, m.match + 0.006);
    if (inp.down) m.match = Math.max(0, m.match - 0.006);
    m.ideal = this.idealAt(m);
    m.refl = clamp(Math.abs(m.match - m.ideal) * 250, 0, 100);
    m.mq += 1 - m.refl / 100; m.mn++;
    m.g += 1 - 0.85 * clamp((m.refl - 5) / 60, 0, 1);
    const [cn, co] = this.lines(m, m.g);
    m.cn.push(cn); m.co.push(co); if (m.cn.length > 230) { m.cn.shift(); m.co.shift(); }
    const T = m.te + 40, p = (m.g - T) / T * 100;
    if (inp.pressed || p > 120) {
      m.sfx('click');
      const s = p < 0 ? 1 + p / 25 : p < 20 ? 0.8 + 0.2 * p / 20 : p <= 30 ? 1 : 1 - (p - 30) / 60, avg = m.mn ? m.mq / m.mn : 1;
      finish(m, clamp(s, 0, 1) * (0.55 + 0.45 * avg), {overEtch: p}, [
        (p < 0 ? L('Zu früh gestoppt: Oxidreste in den Gräben.', 'Stopped too early: oxide left in the trenches.') : L(`Überätzung ${Math.round(p)} %`, `Over-etch ${Math.round(p)} %`)) + L(` · Abstimmung ${Math.round(avg * 100)} %`, ` · matching ${Math.round(avg * 100)} %`),
        avg < 0.8 ? L('Oft verstimmt: Das Plasma hat geflackert, die Wände sind rau geworden.', 'Often mistuned: the plasma flickered, the walls turned rough.') : L('20 bis 30 % sind richtig, mehr greift das Silizium an.', '20 to 30 % is right, more attacks the silicon.')]);
    }
  },
  draw(m) {
    const T = m.te + 40, p = (m.g - T) / T * 100, past = m.g >= T;
    const a = frame(m, L('ÄTZEN · PLASMA, ENDPUNKT', 'ETCH · PLASMA, ENDPOINT'), past ? L('SHIFT: STOPP BEI ÜBERÄTZEN 20 BIS 30 % · ↑ ↓ ABSTIMMEN', 'SHIFT: STOP AT OVER-ETCH 20 TO 30 % · ↑ ↓ TUNE') : L('↑ ↓ ABSTIMMEN, REFLEXION NIEDRIG · DANN CN-, CO-ABFALL', '↑ ↓ TUNE, KEEP REFLECTION LOW · THEN CN, CO DROP'));
    // Left: the chamber. The plasma glows in the colour of what it etches: CN blue-violet on nitride, CO violet on oxide.
    const lit = m.t >= 30, cn = m.cn.length ? m.cn[m.cn.length - 1] : 0.9, co = m.co.length ? m.co[m.co.length - 1] : 0.1;
    const mix = [Math.round(110 * cn + 214 * co + 60), Math.round(200 * cn + 120 * co + 20), 255];
    // Mistuned, the plasma flickers and dims.
    const flick = m.refl > 35 ? 0.45 + 0.55 * hashM(m.t) : 1;
    window.SchichtProcess.chamber(ctx, a.x + 2, a.y + 8, 94, a.h - 24, {t: m.t, gas: 'CF₄ · CHF₃ · Ar', rgb: mix.map(v => Math.min(255, v)), glow: lit ? flick : 0.15, window: true}, lang);
    // The reflected RF power: green while it stays low.
    const ry = a.y + a.h - 13, rw = 90, good = m.refl < 12;
    R('#1a2030', a.x + 4, ry + 8, rw, 4); R(good ? '#3fe06a' : m.refl < 35 ? '#ffcf5a' : '#ff6a3a', a.x + 4, ry + 8, rw * m.refl / 100, 4);
    R('rgba(63,224,106,.35)', a.x + 4, ry + 7, rw * 0.12, 1);
    text(`${L('REFLEKTIERT', 'REFLECTED')} ${Math.round(m.refl)} %`, a.x + 4, ry - 1, {color: good ? '#8fd8a0' : '#ffcf5a', font: 'IBM Plex Sans', size: 7, max: rw});
    // A fibre from the window to the spectrometer.
    ctx.strokeStyle = '#3a4058'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x + 96, a.y + 34); ctx.quadraticCurveTo(a.x + 101, a.y + 30, a.x + 104, a.y + 24); ctx.stroke();
    // Right top: optical emission over time; CN while the nitride etches, CO while the oxide etches.
    const gx = a.x + 104, gy = a.y + 4, gw = a.w - 108, gh = 50;
    R('#0b0f18', gx, gy, gw, gh); text('OES', gx + gw - 3, gy + 2, {align: 'right', color: '#4c5470'});
    const lines = [[m.cn, '#7fe0ff', 'CN 387 nm', 2], [m.co, '#d6a8ff', 'CO 483 nm', 12]];
    lines.forEach(([tr, colr]) => {
      const shown = tr.slice(-(gw - 2));
      ctx.strokeStyle = colr; ctx.lineWidth = 1; ctx.beginPath();
      shown.forEach((v, i) => ctx[i ? 'lineTo' : 'moveTo'](gx + gw - 1 - shown.length + i, gy + gh - 3 - v * (gh - 8)));
      ctx.stroke();
    });
    // The names over the traces, on their own dark ground.
    lines.forEach(([, colr, name, ly]) => { R('rgba(11,15,24,.85)', gx + 2, gy + ly - 1, 58, 10); text(name, gx + 3, gy + ly, {color: colr, max: 56}); });
    // When the CO line has dropped, the tool calls the endpoint and counts the over-etch from there.
    if (past) {
      const ex = gx + gw - 1 - (m.g - T);
      if (ex > gx) { ctx.globalAlpha = 0.7; R('#ffcf5a', ex, gy + 2, 1, gh - 4); ctx.globalAlpha = 1; }
      const good = p >= 20 && p <= 30;
      R('rgba(11,15,24,.9)', gx + gw / 2, gy + gh - 13, gw / 2 - 1, 11);
      text(`${L('ÜBERÄTZEN', 'OVER-ETCH')} ${Math.max(0, Math.round(p))} %`, gx + gw - 3, gy + gh - 12, {align: 'right', color: good ? '#3fe06a' : p < 20 ? '#ffcf5a' : '#ff8a5a', max: gw - 4});
    }
    // Right bottom: cross-section. Resist, nitride, oxide; the holes go down, polymer on their walls, then the silicon.
    const sx = gx, sw = gw, si = a.y + a.h - 8, nit = 12, ox = 6, holes = [0.18, 0.5, 0.82].map(f => sx + f * sw - 6);
    R('#4f5866', sx, si, sw, 8); R('#cfe8ff', sx, si - ox, sw, ox); R('#9fc4a8', sx, si - ox - nit, sw, nit); R('#d99a32', sx, si - ox - nit - 8, sw, 8);
    const dn = clamp(m.g / (m.tn + 30), 0, 1) * nit, dox = clamp((m.g - m.tn - 30) / (m.te + 40 - m.tn - 30), 0, 1) * ox, over = Math.max(0, m.g - m.te - 40);
    holes.forEach(hx => {
      const d = 8 + dn + dox;
      R('#0b0f18', hx, si - ox - nit - 8, 12, d);
      if (d > 10) { R('rgba(230,140,60,.8)', hx, si - ox - nit, 1, d - 8); R('rgba(230,140,60,.8)', hx + 11, si - ox - nit, 1, d - 8); }
      if (over > 0) R('#1a1e28', hx + 1, si, 10, Math.min(6, over / 50));
      if (lit) for (let k = 0; k < 2; k++) { const iy = (F * 2 + k * 7 + hx) % Math.max(4, d + 10); R('#e0c8ff', hx + 4 + k * 3, si - ox - nit - 18 + iy, 1, 2); }
    });
    text(L('LACK', 'RESIST'), sx + 2, si - ox - nit - 17, {color: '#f0b850', font: 'IBM Plex Sans', size: 6});
    const stage = m.g < m.tn ? L('NITRID', 'NITRIDE') : m.g < m.te + 40 ? L('OXID', 'OXIDE') : L('ÜBERÄTZEN', 'OVER-ETCH');
    text(stage, sx + sw - 2, si - ox - nit - 17, {align: 'right', color: m.g < m.tn ? '#7fe0ff' : m.g < m.te + 40 ? '#d6a8ff' : '#ffcf5a', font: 'IBM Plex Sans', size: 6});
    ctx.restore(); result(m, a);
  },
};

/* ---------- 6 Implant: the mass spectrum of the source. Set the magnet on As+ and keep it there ----------
 * The arsine source also gives AsH+ right next to it, As++ and leftovers of the last recipe (BF2+, P+). */
const ION = {
  'P+': [31, 1, '#d59cff', 0.25], 'As++': [75, 2, '#7fd0ff', 0.2], 'BF2+': [49, 1, '#ffe08a', 0.15],
  'As+': [75, 1, '#9cff9c', 1], 'AsH+': [76, 1, '#5fbf6f', 0.45],
};
const V = 40e3, AMU = 1.66054e-27, QE = 1.602177e-19;
const radius = (mass, B, z = 1) => Math.sqrt(2 * mass * AMU * V * z * QE) / (z * QE * B);
const fieldFor = (mass, z = 1, r = 1) => Math.sqrt(2 * mass * AMU * V * z * QE) / (z * QE * r);
const R0 = 1.0, PASS = 0.0008, IMPLANT_FRAMES = 420, BMIN = 0.15, BMAX = 0.27;
const implant = {
  init(m) { m.B = 0.172 + Math.random() * 0.02; m.st = 'tune'; m.it = 0; m.good = 0; m.bad = 0; m.drift = Math.random() * 6; m.hold = 0; },
  through(m) { return Object.keys(ION).find(k => Math.abs(m.B - fieldFor(ION[k][0], ION[k][1])) < PASS) || null; },
  update(m, inp) {
    const dir = (inp.up || inp.right ? 1 : 0) - (inp.down || inp.left ? 1 : 0);
    m.hold = dir ? m.hold + 1 : 0;
    m.B = clamp(m.B + dir * (m.hold > 30 ? 0.0004 : 0.0001), BMIN, BMAX);
    if (m.st === 'tune') { if (inp.pressed) { m.st = 'implant'; m.sfx('click'); } return; }
    m.it++;
    m.B += Math.sin(m.it / 60 + m.drift) * 0.000012;
    const ion = this.through(m);
    if (ion === 'As+') m.good++; else if (ion) m.bad++;
    if (m.it >= IMPLANT_FRAMES) {
      const dose = m.good / IMPLANT_FRAMES, purity = 1 - Math.min(1, m.bad / 90);
      finish(m, dose * purity, {dose, purity}, [
        L(`Arsendosis ${Math.round(dose * 100)} % vom Soll`, `Arsenic dose ${Math.round(dose * 100)} % of target`),
        m.bad ? L('Falsche Ionen sind mit hineingeflogen.', 'Wrong ions got in as well.') : L('Nur As⁺ hat den Spalt passiert.', 'Only As⁺ passed the slit.')]);
    }
  },
  draw(m) {
    const a = frame(m, L('IMPLANTIEREN · ARSEN 40 KEV', 'IMPLANT · ARSENIC 40 KEV'),
      m.st === 'tune' ? L('↑ ↓ MAGNETFELD AUF As⁺ · SHIFT: IMPLANTIEREN', '↑ ↓ MAGNET ON As⁺ · SHIFT: IMPLANT') : L('↑ ↓ NACHREGELN, DAS FELD DRIFTET', '↑ ↓ KEEP IT ON, THE FIELD DRIFTS'));
    // The spectrum: beam current through the slit over the field.
    const gx = a.x + 8, gy = a.y + 4, gw = a.w - 16, gh = 42, X = B => gx + (B - BMIN) / (BMAX - BMIN) * gw;
    R('#0b0f18', gx, gy, gw, gh);
    ctx.strokeStyle = '#4a5470'; ctx.lineWidth = 1; ctx.beginPath();
    for (let px = 0; px <= gw; px++) {
      const B = BMIN + px / gw * (BMAX - BMIN);
      let I = 0; for (const k in ION) { const d = (B - fieldFor(ION[k][0], ION[k][1])) / 0.0007; I += ION[k][3] * Math.exp(-d * d); }
      ctx[px ? 'lineTo' : 'moveTo'](gx + px, gy + gh - 3 - Math.min(1, I) * (gh - 12));
    }
    ctx.stroke();
    for (const k in ION) { const bx = X(fieldFor(ION[k][0], ION[k][1])); text(k, bx + (k === 'AsH+' ? 3 : k === 'As+' ? -3 : 0), gy + gh - 12 - ION[k][3] * (gh - 14), {align: k === 'AsH+' ? 'left' : k === 'As+' ? 'right' : 'center', color: ION[k][2]}); }
    R('#ffcf5a', X(m.B), gy, 1, gh);
    // Beamline below: source, magnet, slit, wafer; each ion on its circle.
    const ion = this.through(m), S = 46, ex = a.x + 44, ey = gy + gh + 10, slitX = ex + R0 * S, slitY = ey + R0 * S + 4;
    R('#5a6270', a.x + 8, ey - 4, 24, 8);
    R('#3a2410', ex - 2, ey - 6, S + 22, S + 8); ctx.strokeStyle = '#b87333'; ctx.strokeRect(ex - 1.5, ey - 5.5, S + 21, S + 7);
    R('#7c8693', ex + 2, slitY, slitX - ex - 4, 2); R('#7c8693', slitX + 3, slitY, 30, 2);
    R('#9aa3ad', a.x + 32, ey - 1, ex - a.x - 32, 2);
    for (const k in ION) {
      const r = radius(ION[k][0], m.B, ION[k][1]) * S, pass = k === ion;
      ctx.strokeStyle = ION[k][2]; ctx.globalAlpha = pass ? 1 : 0.45; ctx.lineWidth = pass ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(ex, ey);
      for (let th = 0; th <= Math.PI / 2 + 0.001; th += 0.1) ctx.lineTo(ex + r * Math.sin(th), ey + r * (1 - Math.cos(th)));
      ctx.lineTo(ex + r, pass ? a.y + a.h - 6 : slitY); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#c9ced6'; ctx.beginPath(); ctx.ellipse(slitX, a.y + a.h - 4, 20, 4, 0, 0, 7); ctx.fill();
    const rx = a.x + a.w - 80;
    text(`B = ${num(m.B * 1000, 1)} mT`, rx, ey + 38, {color: '#ffcf5a', max: 76});
    text(ion ? (ion === 'As+' ? L('As⁺ IM SPALT', 'As⁺ IN THE SLIT') : L(`${ion} IM SPALT`, `${ion} IN THE SLIT`)) : L('KEIN STRAHL', 'NO BEAM'), rx, ey + 2, {color: ion === 'As+' ? '#9cff9c' : ion ? '#e0402a' : '#6b7190', max: 76});
    if (m.st === 'implant') {
      R('#1a2030', rx, ey + 18, 72, 5); R('#9cff9c', rx, ey + 18, 72 * m.good / IMPLANT_FRAMES, 5);
      text(L('DOSIS', 'DOSE'), rx, ey + 26, {color: '#6b7190'});
    }
    ctx.restore(); result(m, a);
  },
};

/* ---------- 5 Develop: a puddle of TMAH on the wafer. The exposed trenches open, then the lines slim down.
 * SHIFT starts the DI rinse; it needs two seconds to stop the developer. Target: 40 nm lines. ---------- */
// Game model of a puddle develop: after a wetting delay the exposed resist clears in DEV_CLEAR s (for 100 nm),
// then the partly exposed edges keep dissolving and the line narrows by DEV_RATE nm/s. Below 30 nm the lines are
// more than three times as tall as wide and topple when the rinse water dries between them (pattern collapse).
const DEV_FPS = 8, DEV_CLEAR = 15, DEV_CD0 = 50, DEV_RATE = 0.4, DEV_LAG = 2, DEV_MAX = 90, DEV_COLLAPSE = 30, DEV_PITCH = 80;
const clearTime = resist => DEV_CLEAR * resist / 100;
function cdAfter(sec, resist = 100) { const tc = clearTime(resist); return sec < tc ? null : DEV_CD0 - DEV_RATE * (sec - tc); }
const develop = {
  init(m, o) { m.st = 'dispense'; m.bt = 0; m.g = 0; m.resist = (o.lot && o.lot.v && o.lot.v.resist) || 100; m.fin = 0; m.cd = null; m.spin = 0; },
  sec(m) { return m.g / DEV_FPS; },
  update(m, inp) {
    m.bt++;
    if (m.st === 'dispense') { if (m.bt > 110) { m.st = 'puddle'; m.bt = 0; } return; }
    if (m.st === 'puddle') {
      m.g++;
      if (inp.pressed || this.sec(m) >= DEV_MAX) { m.st = 'rinse'; m.bt = 0; m.fin = this.sec(m) + DEV_LAG; m.cd = cdAfter(m.fin, m.resist); m.sfx('click'); }
      return;
    }
    // Rinse: the developer works on for DEV_LAG seconds, then the wafer spins dry.
    if (m.bt <= DEV_LAG * DEV_FPS) m.g++;
    m.spin += Math.min(1, m.bt / 40) * 0.5;
    if (m.bt === 40) m.sfx('click');
    if (m.bt > 130) {
      const tc = clearTime(m.resist), cd = m.cd, sec = Math.round(m.fin);
      if (cd === null) {
        finish(m, 0.05, {cd: 72, dev: m.fin}, [L(`Pfütze ${sec} s: Lackreste in den Gräben (Scumming).`, `Puddle ${sec} s: resist scum in the trenches.`),
          L(`Bei ${num(m.resist, 0)} nm Lack ist der Graben erst nach ${num(tc, 0)} s frei.`, `With ${num(m.resist, 0)} nm of resist the trench clears after ${num(tc, 0)} s.`)]);
      } else if (cd < DEV_COLLAPSE) {
        finish(m, 0, {cd, dev: m.fin}, [L(`Pfütze ${sec} s → Linie ${num(cd)} nm`, `Puddle ${sec} s → line ${num(cd)} nm`),
          L('Zu schmal: Beim Trocknen sind die Linien umgekippt.', 'Too thin: the lines toppled while drying.')]);
      } else {
        finish(m, 1 - Math.abs(cd - 40) / 8, {cd, dev: m.fin}, [L(`Pfütze ${sec} s → Linie ${num(cd)} nm`, `Puddle ${sec} s → line ${num(cd)} nm`),
          L('Das CD-SEM misst gleich nach. In echt legt vor allem die Dosis die Breite fest.', 'The CD-SEM measures next. In a real fab the dose sets the width above all.')]);
      }
    }
  },
  draw(m) {
    const help = {dispense: L('DER ENTWICKLER WIRD AUFGETRAGEN', 'DISPENSING THE DEVELOPER'), puddle: L('SHIFT: SPÜLEN, WENN DIE LINIE 40 NM HAT', 'SHIFT: RINSE WHEN THE LINE IS 40 NM'),
      rinse: L('SPÜLEN MIT DI-WASSER, TROCKENSCHLEUDERN', 'DI WATER RINSE, SPIN DRY')}[m.st];
    const a = frame(m, L('ENTWICKELN · LAUGE (TMAH), PFÜTZE', 'DEVELOP · DEVELOPER (TMAH), PUDDLE'), help);
    const sec = this.sec(m), tc = clearTime(m.resist);
    // Left: the track's develop cup from the side, the wafer on its chuck, the puddle on top.
    const cx = a.x + 56, wy = a.y + 70, ww = 84;
    R('#1a2030', cx - 52, wy - 18, 3, 40); R('#1a2030', cx + 49, wy - 18, 3, 40); R('#1a2030', cx - 52, wy + 20, 104, 3);
    R('#3a4058', cx - 3, wy + 2, 6, 18); R('#5a6270', cx - 10, wy + 1, 20, 2);
    R('#8e98a3', cx - ww / 2, wy - 1, ww, 2); R('#d99a32', cx - ww / 2, wy - 2, ww, 1);
    // Spinning: streaks on the wafer edge and droplets thrown off sideways.
    if (m.st === 'rinse' && m.bt > 20) {
      for (let k = 0; k < 6; k++) { const ph = (m.spin * 3 + k / 6) % 1; R('rgba(255,255,255,.5)', cx - ww / 2 + ph * ww, wy, 3, 1); }
      for (let k = 0; k < 10; k++) {
        const ph = ((m.bt * 2 + k * 23) % 40) / 40, side = k % 2 ? 1 : -1;
        if (m.bt < 110) circle('rgba(160,210,255,.8)', cx + side * (ww / 2 + ph * 10), wy - 3 - Math.sin(ph * 3) * 6 + ph * 14, 1);
      }
    }
    // The puddle: laid down by the slit nozzle from left to right, held by surface tension, thrown off in the rinse.
    const lay = m.st === 'dispense' ? clamp((m.bt - 20) / 70, 0, 1) : 1;
    const left = m.st === 'rinse' ? clamp(1 - (m.bt - 20) / 60, 0, 1) : 1;
    if (lay > 0 && left > 0) {
      const x0 = cx - ww / 2, x1 = x0 + ww * lay, ph = 5 * left;
      ctx.fillStyle = m.st === 'rinse' ? 'rgba(170,215,255,.6)' : 'rgba(120,190,255,.6)';
      ctx.beginPath(); ctx.moveTo(x0, wy - 2);
      ctx.quadraticCurveTo(x0, wy - 2 - ph, x0 + 6, wy - 2 - ph); ctx.lineTo(x1 - 6, wy - 2 - ph); ctx.quadraticCurveTo(x1, wy - 2 - ph, x1, wy - 2);
      ctx.closePath(); ctx.fill();
      R('rgba(220,240,255,.7)', x0 + 6, wy - 2 - ph, Math.max(0, x1 - x0 - 12), 1);
      if (x1 - x0 > 30) R('rgba(255,255,255,.85)', x0 + 8 + (m.t * 0.25) % (x1 - x0 - 22), wy - 1 - ph, 6, 1);
    }
    if (m.st === 'dispense' && m.bt < 100) {
      const nx = cx - ww / 2 + ww * clamp((m.bt - 20) / 70, 0, 1);
      R('#5a6270', nx - 4, wy - 34, 8, 6); R('#3a4058', nx - 1, wy - 48, 2, 14);
      if (m.bt > 18 && m.bt < 92) for (let k = 0; k < 3; k++) R('rgba(120,190,255,.8)', nx - 3 + k * 3, wy - 28 + ((m.bt + k * 3) % 4), 1, 20);
    }
    if (m.st === 'rinse' && m.bt < 90) { R('#5a6270', cx - 3, wy - 40, 6, 6); for (let k = 0; k < 2; k++) R('rgba(220,240,255,.85)', cx - 1 + k * 2, wy - 34, 1, 30); }
    text('23 °C', cx - 50, a.y + 3, {color: '#6b7190'});
    text(m.st === 'puddle' || m.st === 'rinse' ? `t = ${Math.floor(Math.min(sec, m.fin || sec))} s` : '', cx + 50, a.y + 3, {align: 'right', color: '#9aa6b5'});
    text(L(`LACK ${num(m.resist, 0)} NM`, `RESIST ${num(m.resist, 0)} NM`), cx, wy + 26, {align: 'center', color: '#6b7190', max: 100});
    // Right: the cross-section, 40 nm lines and spaces, resist on nitride, 0.5 px per nm.
    const zx = a.x + 118, zy = a.y + 4, zw = a.w - 122, zh = a.h - 8, S = 0.5;
    ctx.save(); ctx.beginPath(); ctx.rect(zx, zy, zw, zh); ctx.clip();
    R('#0b0f18', zx, zy, zw, zh);
    const base = zy + zh - 22, H = Math.round(m.resist * S * (1 - 0.0012 * sec)), top = base - H;
    R('#cfe8ff', zx, base + 10, zw, 6); R('#9fc4a8', zx, base, zw, 10);
    const now = Math.min(sec, m.fin || Infinity), cd = cdAfter(now, m.resist);
    const fall = m.st === 'rinse' && m.cd !== null && m.cd < DEV_COLLAPSE ? smooth((m.bt - 70) / 50) : 0;
    // Developer above the resist and in the trenches (gone once the wafer spins dry).
    const wet = m.st === 'dispense' ? lay : m.st === 'rinse' ? left : 1, wa = 0.28 * wet;
    const wetCol = `rgb(${Math.round(11 + 79 * wa)},${Math.round(15 + 145 * wa)},${Math.round(24 + 216 * wa)})`;
    R(wetCol, zx, zy, zw, top - zy);
    const P = DEV_PITCH * S, f = clamp(now / tc, 0, 1), lines = [];
    for (let lc = zx + 10; lc < zx + zw + P; lc += P) lines.push(lc);
    if (!fall) {
      R('#d99a32', zx, top, zw, H); R('#f0b850', zx, top, zw, 1);
      for (const lc of lines) {
        const sc = lc + P / 2;
        // The latent image: where the light fell, the resist has turned soluble.
        if (cd === null) R('rgba(150,100,215,.42)', sc - 20 * S, top, 40 * S, H);
        // The trench: before clearing narrow and shallow, then full depth and widening as the line slims.
        const tw = (cd === null ? (DEV_PITCH - DEV_CD0) * (0.55 + 0.45 * f) : DEV_PITCH - cd) * S, depth = cd === null ? H * f : H;
        if (depth > 0) {
          R(wetCol, sc - tw / 2, top, tw, depth);
          R('#a8701e', sc - tw / 2 - 1, top, 1, depth); R('#f0b850', sc + tw / 2, top, 1, depth);
          // Dissolved resist rises out of the trench while the developer works.
          if (m.st === 'puddle' && sec < tc + 12) for (let k = 0; k < 2; k++) {
            const h = (m.t * 0.6 + k * 17 + lc) % 40, al = 1 - h / 40;
            R(`rgba(200,160,255,${0.6 * al})`, sc - 1 + (k ? 2 : -2), top + depth - 2 - h, 1, 1);
          }
        }
      }
    } else {
      // Pattern collapse: the drying water pulls neighbouring lines together; they fall onto each other in pairs.
      const lw = cd * S;
      lines.forEach((lc, i) => {
        ctx.save(); ctx.translate(lc, base); ctx.rotate(fall * 0.36 * (i % 2 ? -1 : 1));
        ctx.fillStyle = '#d99a32'; ctx.fillRect(-lw / 2, -H, lw, H); R('#f0b850', -lw / 2, -H, lw, 1); R('#a8701e', lw / 2 - 1, -H, 1, H);
        ctx.restore();
      });
    }
    // The 40 nm target on one line: two dashed marks at its edges.
    const mc = lines[1];
    if (m.st !== 'dispense' && !fall) {
      ctx.strokeStyle = '#ffcf5a'; ctx.setLineDash([2, 2]); ctx.lineWidth = 1;
      for (const e of [-20, 20]) { const ex = Math.round(mc + e * S) + (e > 0 ? 0.5 : -0.5); ctx.beginPath(); ctx.moveTo(ex, top - 6); ctx.lineTo(ex, base); ctx.stroke(); }
      ctx.setLineDash([]);
      text('40', mc, top - 15, {align: 'center', color: '#ffcf5a'});
    }
    ctx.restore();
    const read = cd === null ? L(`GRABEN ${Math.round(f * 100)} % FREI`, `TRENCH ${Math.round(f * 100)} % CLEAR`) : `${L('LINIE', 'LINE')} ${num(Math.max(0, cd))} NM`;
    const ok = cd !== null && Math.abs(cd - 40) < 1.5;
    // Just above 41 nm is the moment to rinse (the water needs two seconds): the readout says so.
    const rinseNow = m.st === 'puddle' && cd !== null && cd <= 41.8 && cd >= 40.4;
    R('rgba(8,10,16,.85)', zx, zy + zh - 12, zw, 12);
    text(m.st === 'dispense' ? L('UNSICHTBARES BILD IM LACK', 'HIDDEN IMAGE IN THE RESIST') : rinseNow ? `${read} · ${L('JETZT SPÜLEN', 'RINSE NOW')}` : read, zx + zw / 2, zy + zh - 10,
      {align: 'center', color: rinseNow ? ((F >> 3) % 2 ? '#ffcf5a' : '#fff4d0') : ok ? '#3fe06a' : cd !== null && cd < 36 ? '#ff8a5a' : '#cfe8ff', max: zw - 4});
    ctx.restore(); result(m, a);
  },
};

/* ---------- 9 Sputter: hold SHIFT to let argon in, the pump draws it off. Keep the pressure in the band ----------
 * DC magnetron, Al with 0.5 % Cu. Below about 1.5 µbar the plasma goes out; above 6 µbar the sputtered atoms
 * scatter on the argon and the film grows slower and porous (higher resistivity). 500 nm is the target. */
const SP_PUMP = 1 / 60, SP_FLOW = 10 / 60, SP_BAND = [3, 6], SP_OFF = 1.5, SP_ON = 2.2, SP_TARGET = 500, SP_MAX = 900;
const spQuality = p => p >= SP_BAND[0] && p <= SP_BAND[1] ? 1 : p >= SP_OFF && p <= 7.5 ? 0.55 : 0.2;
const sputter = {
  init(m) { m.st = 'pump'; m.bt = 0; m.p = 0.4; m.flow = 0; m.lit = false; m.al = 0; m.q = 0; m.hist = []; },
  update(m, inp) {
    m.bt++;
    if (m.st === 'pump') { if (m.bt > 70) { m.st = 'run'; m.bt = 0; } return; }
    // The valve follows the key with a little lag; the gas line wobbles; the pump draws in proportion.
    m.flow += ((inp.held ? 1 : 0) - m.flow) * 0.12;
    const k = SP_FLOW * (1 + 0.15 * Math.sin(m.bt / 70));
    m.p = clamp(m.p + m.flow * k - SP_PUMP * m.p, 0, 12);
    if (!m.lit && m.p >= SP_ON) { m.lit = true; m.sfx('click'); }
    if (m.lit && m.p < SP_OFF) { m.lit = false; m.sfx('click'); }
    if (m.lit) {
      const rate = 1.5 * clamp(1 - Math.abs(m.p - 4.5) / 6, 0.3, 1), d = Math.min(rate, SP_TARGET - m.al);
      m.q += d * spQuality(m.p); m.al += d;
    }
    m.hist.push(m.p); if (m.hist.length > 116) m.hist.shift();
    if (m.al >= SP_TARGET || m.bt >= SP_MAX) {
      const q = m.al ? m.q / m.al : 0, score = q * (m.al / SP_TARGET);
      finish(m, score, {al: m.al, alQ: q}, [
        L(`Al ${Math.round(m.al)} nm · ${Math.round(q * 100)} % im Band`, `Al ${Math.round(m.al)} nm · ${Math.round(q * 100)} % in the band`),
        q > 0.8 ? L('Dichte, glatte Schicht. Der Vierspitzer misst gleich nach.', 'A dense, smooth film. The four-point probe checks it next.')
          : L('Gestreute Atome: Die Schicht ist porös, ihr Widerstand höher.', 'Scattered atoms: the film is porous, its resistance higher.')]);
    }
  },
  draw(m) {
    const help = m.st === 'pump' ? L('DIE KAMMER WIRD AUSGEPUMPT', 'PUMPING THE CHAMBER DOWN') : L('SHIFT HALTEN: ARGON AUF · LOSLASSEN: DIE PUMPE ZIEHT AB', 'HOLD SHIFT: ARGON IN · RELEASE: THE PUMP DRAWS IT OFF');
    const a = frame(m, L('SPUTTERN · AL, DC-MAGNETRON', 'SPUTTER · AL, DC MAGNETRON'), help);
    // Left: the chamber. Magnets behind the target, the racetrack plasma under it, the wafer with its film below.
    const cx = a.x + 4, cy = a.y + 4, cw = 112, ch = a.h - 8, glow = m.lit ? clamp(0.35 + m.p / 8, 0.35, 1) * (0.85 + 0.15 * Math.sin(F / 3)) : 0;
    R('#3a4058', cx, cy, cw, ch); R('#141a28', cx + 4, cy + 4, cw - 8, ch - 8);
    R('#2a3040', cx + 10, cy + 6, cw - 20, 6); for (let i = 0; i < 4; i++) R(i % 2 ? '#d8262a' : '#2c6fb5', cx + 14 + i * ((cw - 32) / 3), cy + 7, 6, 4);
    R('#c9ced6', cx + 10, cy + 12, cw - 20, 5);
    text(L('AL-TARGET', 'AL TARGET'), cx + cw / 2, cy + 12, {align: 'center', color: '#3a4058', font: 'IBM Plex Sans', size: 6, max: cw});
    if (glow > 0) {
      ctx.fillStyle = `rgba(255,120,200,${0.6 * glow})`; ctx.beginPath(); ctx.ellipse(cx + cw / 2, cy + 24, cw / 2 - 14, 6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,170,230,${0.3 * glow})`; ctx.fillRect(cx + 8, cy + 18, cw - 16, 30);
      // Aluminium atoms on their way down; above the band they zigzag (scattered on the argon).
      const scat = m.p > SP_BAND[1];
      for (let i = 0; i < 12; i++) {
        const yy = cy + 24 + ((F * 1.4 + i * 11) % (ch - 54)), xx = cx + 14 + ((i * 29) % (cw - 28)) + (scat ? Math.sin(F / 3 + i) * 5 : 0);
        R('#e6e9ee', Math.round(xx), Math.round(yy), 1, 2);
      }
    }
    // Argon in the chamber: more dots, more pressure.
    for (let i = 0; i < Math.round(m.p * 3); i++) R('rgba(160,190,255,.6)', cx + 8 + ((i * 37 + (F >> 2)) % (cw - 16)), cy + 20 + ((i * 53) % (ch - 46)), 1, 1);
    const film = Math.round(6 * m.al / SP_TARGET);
    R('#5a6270', cx + 12, cy + ch - 22, cw - 24, 8); R('#c9ced6', cx + 16, cy + ch - 24 - film, cw - 32, 2 + film);
    text(m.lit ? L('PLASMA AN', 'PLASMA ON') : L('PLASMA AUS', 'PLASMA OFF'), cx + cw / 2, cy + ch - 12, {align: 'center', color: m.lit ? '#ff9ad8' : '#6b7190', font: 'IBM Plex Sans', size: 7});
    // Right: the pressure gauge with its green band and the last seconds as a trace; the film thickness below.
    const gx = a.x + 124, gy = a.y + 4, gw = a.w - 128, gh = 62, toY = p => gy + gh - 2 - clamp(p / 10, 0, 1) * (gh - 4);
    R('#0b0f18', gx, gy, gw, gh);
    ctx.globalAlpha = 0.35; R('#3fe06a', gx, toY(SP_BAND[1]), gw, toY(SP_BAND[0]) - toY(SP_BAND[1])); ctx.globalAlpha = 1;
    R('#5a2a20', gx, toY(SP_OFF), gw, 1);
    text(L('PLASMA ERLISCHT', 'PLASMA GOES OUT'), gx + 3, toY(SP_OFF) + 1, {color: '#8a4a3a', font: 'IBM Plex Sans', size: 6});
    ctx.strokeStyle = '#9fe0ff'; ctx.lineWidth = 1; ctx.beginPath();
    m.hist.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](gx + gw - m.hist.length + i, toY(p))); ctx.stroke();
    const inBand = m.p >= SP_BAND[0] && m.p <= SP_BAND[1];
    text(`Ar ${num(m.p)} µbar`, gx + gw - 3, gy + 2, {align: 'right', color: inBand ? '#3fe06a' : m.p > SP_BAND[1] ? '#ff8a5a' : '#ffcf5a', max: gw - 4});
    const ty = gy + gh + 8;
    text(`Al ${Math.round(m.al)} / ${SP_TARGET} nm`, gx + gw / 2, ty, {align: 'center', color: '#e9e4d6', max: gw});
    R('#141a28', gx + 4, ty + 12, gw - 8, 6); R('#c9ced6', gx + 4, ty + 12, Math.round((gw - 8) * m.al / SP_TARGET), 6);
    ctx.restore(); result(m, a);
  },
};

const GAMES = {clean, oxidize, nitride, coat, expose, develop, etch, implant, sputter};
// Before each step: what it is for and how to play it, then SHIFT starts it. The last line is the controls.
const BRIEF = {
  clean: {title: ['REINIGEN · RCA', 'CLEAN · RCA'],
    de: ['Drei Bäder: SC-1 hebt Partikel ab, SC-2 löst Metalle, HF das native Oxid.', 'Nach jedem Bad spült Wasser die Chemie ab. Jedes Bad braucht seine Zeit.', 'SHIFT hebt den Korb heraus, wenn die Zeit im Grünen ist.'],
    en: ['Three baths: SC-1 lifts particles, SC-2 dissolves metals, HF the native oxide.', 'After each bath, water rinses the chemicals off. Each bath needs its time.', 'SHIFT lifts the carrier out while the time is in the green.']},
  oxidize: {title: ['OXIDIEREN · 1000 °C', 'OXIDISE · 1000 °C'],
    de: ['Der Ofen fährt ein Rezept: hoch auf 1000 °C, halten, während Sauerstoff strömt, abkühlen.', 'Das Oxid wächst beim Halten, heißer schneller. Der Ofen ist träge: früh gegensteuern.', '↑ ↓ Heizleistung. Bleib auf der gelben Kurve, dann werden es 50 nm.'],
    en: ['The furnace runs a recipe: up to 1000 °C, hold while oxygen flows, cool down.', 'The oxide grows during the hold, faster when hotter. The furnace is slow: steer early.', '↑ ↓ heater power. Stay on the yellow curve and it will be 50 nm.']},
  nitride: {title: ['NITRID · LPCVD', 'NITRIDE · LPCVD'],
    de: ['Das Gas strömt von oben ins Rohr und wird unterwegs verbraucht:', 'Die unteren Wafer bekommen weniger. Wärmer wächst es schneller.', '↑↓ Zone · ←→ Temperatur · SHIFT startet die Abscheidung.'],
    en: ['The gas enters the tube at the top and is used up on the way down:', 'the lower wafers get less. Warmer, it grows faster.', '↑↓ zone · ←→ temperature · SHIFT starts the deposition.']},
  coat: {title: ['BELACKEN · SPIN-COATING', 'COAT · SPIN COATING'],
    de: ['Der Lack wird aufgeschleudert: je schneller, desto dünner. Was abfliegt, kommt nicht zurück.', 'Ziel: 100 nm Lack, das sind 2000 Umdrehungen pro Minute. Taste dich heran, nicht drüber.', 'SHIFT halten: schneller · ↑↓ fein · loslassen: Lack trocknet.'],
    en: ['The resist is spun on: the faster, the thinner. What flies off does not come back.', 'Target: 100 nm of resist, that is 2000 revolutions per minute. Creep up on it, not past it.', 'Hold SHIFT: faster · ↑↓ fine · let go: the resist dries.']},
  expose: {title: ['BELICHTEN · SCANNER', 'EXPOSE · SCANNER'],
    de: ['Die erste Maske richtet sich nach der Kerbe; ihre Marken tragen alle späteren Ebenen.', 'Die Justagemarken laufen hin und her. Stopp sie, wenn sie decken.', 'SHIFT stoppt X, dann Y. Danach belichtet der Scanner allein.'],
    en: ['The first mask aligns to the notch; its marks carry every later layer.', 'The alignment marks sweep back and forth. Stop them when they meet.', 'SHIFT stops X, then Y. Then the scanner exposes by itself.']},
  // The same scanner at 04:00: the contact holes must land on the doped areas of the first layer.
  'expose:contacts': {title: ['KONTAKTE BELICHTEN · SCANNER', 'EXPOSE CONTACTS · SCANNER'],
    de: ['Die Kontaktlöcher müssen genau auf den dotierten Gebieten landen,', 'also justiert der Scanner auf die Marken der ersten Ebene. Stopp die Marken, wenn sie decken.', 'SHIFT stoppt X, dann Y. Danach belichtet der Scanner allein.'],
    en: ['The contact holes must land exactly on the doped areas,', 'so the scanner aligns to the marks of the first layer. Stop the marks when they meet.', 'SHIFT stops X, then Y. Then the scanner exposes by itself.']},
  sputter: {title: ['SPUTTERN · ALUMINIUM', 'SPUTTER · ALUMINIUM'],
    de: ['Argon-Ionen schlagen Aluminium aus dem Target, es setzt sich auf dem Wafer ab.', 'Zu wenig Argon: Das Plasma geht aus. Zu viel: Die Atome streuen, die Schicht wird porös.', 'SHIFT halten lässt Argon ein. Halte den Druck im grünen Band, bis 500 nm liegen.'],
    en: ['Argon ions knock aluminium out of the target; it settles on the wafer.', 'Too little argon: the plasma goes out. Too much: the atoms scatter, the film turns porous.', 'Hold SHIFT to let argon in. Keep the pressure in the green band until 500 nm are down.']},
  develop: {title: ['ENTWICKELN · TMAH', 'DEVELOP · TMAH'],
    de: ['Nach dem Backen bei 100 °C löst eine Lauge (TMAH) den belichteten Lack:', 'erst öffnen sich die Gräben, dann werden die Linien schmaler. Ziel: 40 nm.', 'SHIFT spült mit Wasser. Es wirkt erst 2 s später, also bei knapp 41 nm drücken.'],
    en: ['After a bake at 100 °C an alkaline developer (TMAH) dissolves the exposed resist:', 'first the trenches open, then the lines slim down. Target: 40 nm.', 'SHIFT rinses with water. It takes 2 s, so press at just under 41 nm.']},
  etch: {title: ['ÄTZEN · PLASMA', 'ETCH · PLASMA'],
    de: ['Das Plasma ätzt durch Nitrid und Oxid. Seine Hochfrequenz muss abgestimmt bleiben,', 'sonst wird sie zurückgeworfen und das Ätzen stockt. Sein Licht zeigt: erst CN, dann CO.', '↑↓ abstimmen (Reflexion niedrig) · SHIFT stoppt bei ÜBERÄTZEN 25 %.'],
    en: ['The plasma etches through nitride and oxide. Its radio frequency must stay tuned,', 'or it is reflected and the etch stalls. Its light shows: first CN, then CO.', '↑↓ tune (keep reflection low) · SHIFT stops at OVER-ETCH 25 %.']},
  implant: {title: ['IMPLANTIEREN · ARSEN', 'IMPLANT · ARSENIC'],
    de: ['Der Magnet trennt die Ionen nach ihrer Masse.', 'Nur Arsen (As⁺) soll durch den Spalt, bis die Dosis voll ist.', '↑↓ Magnetfeld · SHIFT öffnet den Strahl · das Feld driftet.'],
    en: ['The magnet separates the ions by their mass.', 'Only arsenic (As⁺) may pass the slit until the dose is full.', '↑↓ magnetic field · SHIFT opens the beam · the field drifts.']},
};
function drawBrief(m) {
  const b = (m.variant && BRIEF[`${m.type}:${m.variant}`]) || BRIEF[m.type], de = lang === 'de';
  const a = frame(m, b.title[de ? 0 : 1], m.ft > 20 ? L('SHIFT: STARTEN', 'SHIFT: START') : '');
  text(L('AUFGABE', 'YOUR TASK'), a.x + a.w / 2, a.y + 12, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: '#ffcf5a'});
  const lines = b[de ? 'de' : 'en'];
  lines.forEach((l, i) => {
    const last = i === lines.length - 1;
    text(l, a.x + a.w / 2, a.y + 40 + i * 13 + (last ? 8 : 0), {align: 'center', font: 'IBM Plex Sans', size: 8, color: last ? '#9fe0ff' : '#e9e4d6', max: a.w - 14});
  });
  ctx.restore();
}
// Skipped with Enter: the tool runs its standard recipe, which is never quite tuned for this lot.
const SKIP = {clean: {particles: 12}, oxidize: {oxide: 52.4}, nitride: {nitride: 100.2, nitrideU: 2.4}, coat: {resist: 104, rpm: 1850}, expose: {overlay: 8}, develop: {cd: 43.2, dev: 60}, etch: {overEtch: 8}, implant: {dose: 0.8, purity: 1}, sputter: {al: 500, alQ: 0.6}};
function skip(m) {
  if (!skippable(m)) return;
  finish(m, 0.45, SKIP[m.type], [L('Übersprungen: Die Anlage fährt ihr Standardrezept.', 'Skipped: the tool runs its standard recipe.')]);
}
function create(type, o = {}) {
  // With brief, the step first explains itself and starts on SHIFT.
  const m = {type, variant: o.variant || null, t: 0, ft: 0, phase: o.brief ? 'brief' : 'play', score: 0, values: {}, closed: false, resultT: 0, sfx: o.sfx || (() => {})};
  GAMES[type].init(m, o);
  return m;
}
function update(m, inp) {
  m.ft++;
  if (m.phase === 'brief') { if (inp.pressed && m.ft > 20) { m.phase = 'play'; m.sfx('click'); } return; }
  m.t++;
  if (m.phase === 'play') GAMES[m.type].update(m, inp);
  else { m.resultT++; if ((inp.pressed && m.resultT > 24) || m.resultT > 600) m.closed = true; }
}
function draw(c, m, language) {
  ctx = c; F = m.t; lang = language;
  if (m.phase === 'brief') drawBrief(m); else GAMES[m.type].draw(m);
}

window.SchichtMini = {has: type => !!GAMES[type], create, update, draw, skip, grade, yieldOf, STEPS, radius, fieldFor, cdAfter, DEV: {FPS: DEV_FPS, LAG: DEV_LAG}, nitRate, nitUniformity};
})();
