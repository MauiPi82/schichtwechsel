/* Schichtwechsel - seven process steps you play yourself. Nothing can be lost here: how well you hit a step
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
const L = (de, en) => lang === 'de' ? de : en;
const num = (v, d = 1) => v.toFixed(d).replace('.', lang === 'de' ? ',' : '.');

/* ---------- Grades and yield ---------- */
function grade(s) {
  if (s >= 0.9) return {word: 'PERFETTO', color: '#3fe06a'};
  if (s >= 0.7) return {word: 'BENE', color: '#9fe0ff'};
  if (s >= 0.45) return {word: 'COSÌ COSÌ', color: '#ffcf5a'};
  return {word: 'SCARTO', color: '#e0402a'};
}
// Yield of lot 4471: every played step keeps 80 to 100 % of the chips, the rest of the flow costs 3 %.
const STEPS = ['clean', 'oxidize', 'coat', 'expose', 'develop', 'etch', 'implant'];
function yieldOf(lot) {
  let y = 0.97;
  for (const k of STEPS) if (lot && lot.s && lot.s[k] !== undefined) y *= 0.8 + 0.2 * lot.s[k];
  return Math.round(y * 100);
}

/* ---------- Frame, result ---------- */
function frame(m, title, help) {
  const appear = ease(m.t / 20), y0 = Math.round(PY + (1 - appear) * 14);
  ctx.fillStyle = `rgba(3,4,8,${0.6 * appear})`; ctx.fillRect(0, 0, W, 180);
  R('#0b0f18', PX - 2, y0 - 2, PW + 4, PH + 4); R('#ffb43a', PX - 2, y0 - 2, PW + 4, 1);
  R('#1c160c', PX, y0, PW, 12);
  text(title, PX + 6, y0 + 2, {color: '#ffcf5a', max: PW - 116});
  const canSkip = m.phase === 'play' && m.t > 60;
  text(canSkip ? L('ENTER: ÜBERSPRINGEN', 'ENTER: SKIP') : 'LOT 4471', PX + PW - 6, y0 + 2, {align: 'right', color: canSkip ? '#6b5a2a' : '#c9a15a', max: 100});
  R('#0d111a', PX, y0 + 12, PW, PH - 28);
  R('#141a28', PX, y0 + PH - 16, PW, 16);
  const done = m.phase === 'result';
  text(done ? L('SHIFT: WEITER', 'SHIFT: CONTINUE') : help, PX + PW / 2, y0 + PH - 12, {align: 'center', color: done ? '#8c93a8' : '#e9e4d6', max: PW - 12});
  ctx.save(); ctx.beginPath(); ctx.rect(PX, y0 + 12, PW, PH - 28); ctx.clip();
  return {x: PX, y: y0 + 12, w: PW, h: PH - 28, y0};
}
function result(m, a) {
  if (m.phase !== 'result') return;
  const k = ease(m.resultT / 18), g = grade(m.score);
  ctx.fillStyle = `rgba(8,10,16,${0.82 * k})`; ctx.fillRect(a.x, a.y, a.w, a.h);
  ctx.globalAlpha = k;
  text(g.word, a.x + a.w / 2, a.y + a.h / 2 - 22, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: g.color});
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
  {name: 'SC-1', col: '#bfe3d0', max: 15, unit: 'min', zone: [8, 12], what: ['PARTIKEL', 'PARTICLES']},
  {name: 'SC-2', col: '#dfe8b8', max: 15, unit: 'min', zone: [8, 12], what: ['METALLE', 'METALS']},
  {name: 'HF 1%', col: '#cfe3f5', max: 150, unit: 's', zone: [45, 90], what: ['NATIVES OXID', 'NATIVE OXIDE']},
];
const BATH_FRAMES = 420;
const clean = {
  init(m) { m.bath = 0; m.st = 'down'; m.bt = 0; m.res = []; m.times = []; },
  update(m, inp) {
    m.bt++;
    if (m.st === 'down' && m.bt >= 36) { m.st = 'in'; m.bt = 0; }
    else if (m.st === 'in') {
      const b = BATHS[m.bath], v = m.bt / BATH_FRAMES * b.max;
      if (inp.pressed || m.bt >= BATH_FRAMES) {
        const [z0, z1] = b.zone, off = v < z0 ? z0 - v : v > z1 ? v - z1 : 0;
        m.res.push(clamp(1 - off / b.max * 4, 0, 1)); m.times.push(v);
        m.st = 'up'; m.bt = 0; m.sfx('click');
      }
    } else if (m.st === 'up' && m.bt >= 44) {
      m.bath++; m.bt = 0; m.st = 'down';
      if (m.bath >= BATHS.length) {
        const [s1, s2, s3] = m.res, particles = Math.round(1 + 26 * (1 - s1) + 6 * (1 - s3));
        finish(m, (s1 + s2 + s3) / 3, {particles}, [
          L(`SC-1 ${num(m.times[0])} min · SC-2 ${num(m.times[1])} min · HF ${Math.round(m.times[2])} s`, `SC-1 ${num(m.times[0])} min · SC-2 ${num(m.times[1])} min · HF ${Math.round(m.times[2])} s`),
          L('Was übrig bleibt, zählt gleich die Partikelmessung.', 'The particle scanner will count what is left.')]);
      }
    }
  },
  draw(m) {
    const a = frame(m, L('REINIGEN · RCA', 'CLEAN · RCA'), L('SHIFT: HERAUSHEBEN, WENN DIE ZEIT IM GRÜNEN IST', 'SHIFT: LIFT OUT WHILE THE TIME IS IN THE GREEN'));
    const tw = (a.w - 20) / 4, ty = a.y + 24, th = 28;
    R('#7c8693', a.x + 6, a.y + 6, a.w - 12, 2);
    const tanks = [...BATHS, {name: L('SPÜLEN', 'RINSE'), col: '#d4e6fa', zone: null}];
    tanks.forEach((b, i) => {
      const bx = a.x + 10 + i * tw, cur = i === Math.min(m.bath, 3);
      R('#5a6270', bx, ty, tw - 6, th); R(b.col, bx + 2, ty + 5, tw - 10, th - 7);
      text(b.name, bx + (tw - 6) / 2, ty + th + 2, {align: 'center', color: cur ? '#ffcf5a' : '#6b7190', max: tw - 6});
      if (i < 3) {
        // The timer bar with its green window.
        const bw = tw - 6, by = ty + th + 12, z = b.zone;
        R('#1a2030', bx, by, bw, 5);
        R('#1f6a36', bx + z[0] / b.max * bw, by, (z[1] - z[0]) / b.max * bw, 5);
        const v = i < m.bath ? m.times[i] / b.max : i === m.bath && m.st === 'in' ? m.bt / BATH_FRAMES : 0;
        R(i < m.bath ? '#9aa3ad' : '#ffcf5a', bx, by + 1, v * bw, 3);
        if (i === m.bath && m.st === 'in') text(`${num(v * b.max, b.unit === 's' ? 0 : 1)} ${b.unit}`, bx + bw / 2, by + 7, {align: 'center', color: '#e9e4d6', max: bw});
        else if (i < m.bath) text(grade(m.res[i]).word, bx + bw / 2, by + 7, {align: 'center', color: grade(m.res[i]).color, max: bw});
      }
      if (cur && m.st === 'in') for (let k = 0; k < 5; k++) circle('rgba(255,255,255,.7)', bx + 6 + ((k * 7 + F * 0.4) % (tw - 16)), ty + th - 4 - ((F * 0.35 + k * 9) % (th - 10)), 1);
    });
    // The carrier: down, in the bath, up and along.
    const i = Math.min(m.bath, 3), from = a.x + 10 + i * tw + (tw - 6) / 2, to = a.x + 10 + Math.min(3, i + 1) * tw + (tw - 6) / 2;
    const dip = m.st === 'down' ? smooth(m.bt / 36) : m.st === 'in' ? 1 : 1 - smooth(m.bt / 16);
    const cx = m.st === 'up' && m.bt > 16 ? from + (to - from) * smooth((m.bt - 16) / 28) : from, cy = a.y + 8 + dip * 18;
    R('#9aa3ad', cx - 1, a.y + 7, 2, cy - a.y - 6);
    R('#4a525e', cx - 10, cy, 20, 16); for (let k = 0; k < 6; k++) R('#c9ced6', cx - 8 + k * 3.2, cy + 2, 1, 12);
    // What the bath does to the surface, while you watch the time.
    const k = m.st === 'in' && m.bath < 3 ? m.bt / BATH_FRAMES : 0;
    const zy = a.y + a.h - 18, zx = a.x + 10, zw = a.w - 20;
    R('#141a28', zx, zy, zw, 18); R('#4f5866', zx, zy + 12, zw, 6);
    if (m.bath < 3) {
      const b = BATHS[m.bath], part = b.zone[0] / b.max;
      text(L(`${b.name} LÖST ${b.what[0]}`, `${b.name} REMOVES ${b.what[1]}`), zx + 3, zy + 1, {color: '#9fe0ff', max: zw - 10});
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
const OX_TAU = 180, OX_A = 50, RAMP = 1.0;
const oxide = g => OX_A * (Math.sqrt(1 + g / OX_TAU) - 1);
const oxidize = {
  init(m) { m.st = 'load'; m.g = 0; },
  update(m, inp) {
    if (m.st === 'load') { if (m.t > 110) m.st = 'grow'; return; }
    m.g++;
    const d = oxide(m.g);
    if (inp.pressed || d >= 90) {
      // While the furnace ramps down, about 1 nm grows on. Stop a little early.
      const fin = d + RAMP;
      m.sfx('click');
      finish(m, 1 - Math.abs(fin - 50) / 10, {oxide: fin}, [
        L(`SiO₂ ${num(fin)} nm (${num(d)} + ${num(RAMP)} beim Abrampen)`, `SiO₂ ${num(fin)} nm (${num(d)} + ${num(RAMP)} on ramp-down)`),
        L('Das Ellipsometer misst es nach dem Nitrid nach.', 'The ellipsometer checks it after the nitride.')]);
    }
  },
  draw(m) {
    const a = frame(m, L('OXIDIEREN · 1000 °C, TROCKEN', 'OXIDISE · 1000 °C, DRY'), L('SHIFT: SAUERSTOFF AUS BEI 50 NM', 'SHIFT: OXYGEN OFF AT 50 NM'));
    // The vertical furnace cut open from the side; the boat with its wafers rides up into the quartz bell.
    const rise = smooth(m.t / 100), heat = clamp((m.t - 60) / 50, 0, 1);
    window.SchichtProcess.furnace(ctx, a.x + 2, a.y + 2, 86, a.h - 14, {rise, heat, t: m.t, gas: m.st === 'grow' ? ['rgba(160,220,255,.9)'] : null,
      temp: `${Math.round(400 + 600 * heat)} °C`});
    text(m.st === 'grow' ? `t = ${Math.round(m.g / 6)} min` : L('BOOT FÄHRT EIN', 'BOAT LOADING'), a.x + 45, a.y + a.h - 10, {align: 'center', color: '#9aa6b5', max: 90});
    // Thickness, big, and the growth curve with the target line.
    const d = oxide(m.g), px = a.x + 92, pw = a.w - 98;
    text(`${num(d)} nm`, px + pw / 2, a.y + 6, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: Math.abs(d + RAMP - 50) < 1 ? '#3fe06a' : '#cfe8ff'});
    text(L('ZIEL 50 NM · ABRAMPEN +1 NM', 'TARGET 50 NM · RAMP-DOWN +1 NM'), px + pw / 2, a.y + 26, {align: 'center', color: '#ffcf5a', max: pw});
    const gx = px + 4, gy = a.y + 40, gw = pw - 8, gh = a.h - 46, G = 900, D = 90;
    R('#0b0f18', gx, gy, gw, gh);
    const ty = gy + gh - 50 / D * gh;
    R('#5a4a1a', gx, ty, gw, 1); text('50', gx + 2, ty - 9, {color: '#c9a15a'});
    ctx.strokeStyle = '#9fe0ff'; ctx.lineWidth = 1; ctx.beginPath();
    for (let g = 0; g <= m.g; g += 6) ctx[g ? 'lineTo' : 'moveTo'](gx + g / G * gw, gy + gh - oxide(g) / D * gh);
    ctx.stroke();
    circle('#ffffff', gx + m.g / G * gw, gy + gh - d / D * gh, 1.5);
    ctx.restore(); result(m, a);
  },
};

/* ---------- 3 Coat: hold SHIFT to spin up; the film thins as 1/sqrt(rpm). Let go and it dries ---------- */
// For 40 nm lines the resist is thin: 100 nm at 2000 rpm. Thicker resist would make the lines topple.
const filmOf = rpm => rpm > 200 ? 100 * Math.sqrt(2000 / rpm) : 400;
const coat = {
  init(m) { m.rpm = 0; m.still = 0; m.rot = 0; m.spinning = false; },
  update(m, inp) {
    if (m.t < 50) return;
    if (inp.held) { m.rpm = Math.min(5000, m.rpm + 10); m.still = 0; m.spinning = true; }
    else if (inp.down && m.spinning) { m.rpm = Math.max(500, m.rpm - 4); m.still = 0; }
    else if (inp.up && m.spinning) { m.rpm = Math.min(5000, m.rpm + 4); m.still = 0; }
    else if (m.spinning) m.still++;
    m.rot += m.rpm / 6000;
    if (m.spinning && m.rpm > 500 && m.still >= 150) {
      const film = filmOf(m.rpm);
      finish(m, 1 - Math.abs(film - 100) / 20, {resist: film, rpm: m.rpm}, [
        L(`${Math.round(m.rpm)} U/min → Lack ${num(film)} nm`, `${Math.round(m.rpm)} rpm → resist ${num(film)} nm`),
        L('Zu dick oder zu dünn verschiebt später die Linienbreite.', 'Too thick or too thin shifts the line width later.')]);
    }
  },
  draw(m) {
    const a = frame(m, L('BELACKEN · SPIN-COATING', 'COAT · SPIN COATING'), L('SHIFT HALTEN: SCHNELLER · ↑ ↓ FEIN · DANN TROCKNEN', 'HOLD SHIFT: FASTER · ↑ ↓ FINE · THEN IT DRIES'));
    const cx = a.x + 62, cy = a.y + a.h / 2 + 2, r = 44, film = filmOf(m.rpm);
    // Thin-film colours: the hue turns as the thickness changes (about 0.18 µm per order in resist).
    const hue = (film / 180 * 360) % 360;
    circle('#5a6270', cx, cy, r + 1); circle('#c9ced6', cx, cy, r);
    const spread = m.t < 50 ? smooth((m.t - 20) / 30) * 10 : 10 + smooth(m.rpm / 1500) * (r - 10);
    if (m.t > 20) { ctx.globalAlpha = 0.85; circle(`hsl(${hue},55%,${m.spinning ? 55 : 45}%)`, cx, cy, spread); ctx.globalAlpha = 1; }
    if (m.t > 15 && m.t < 50) circle('#d99a32', cx, cy - r - 4 + ((m.t * 3) % (r + 4)), 1.5);
    for (let k = 0; k < 4; k++) { const ang = m.rot * 6 + k * Math.PI / 2; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, ang, ang + 0.4); ctx.stroke(); }
    R('#0b0f18', cx - 2, cy + r - 2, 4, 3);
    // Dial with the green window around 3000 rpm.
    const dx = a.x + a.w - 70, dy = a.y + 54, dr = 34, A0 = Math.PI * 0.8, A1 = Math.PI * 2.2, ang = v => A0 + (A1 - A0) * v / 5000;
    ctx.lineWidth = 5; ctx.strokeStyle = '#1a2030'; ctx.beginPath(); ctx.arc(dx, dy, dr, A0, A1); ctx.stroke();
    ctx.strokeStyle = '#1f6a36'; ctx.beginPath(); ctx.arc(dx, dy, dr, ang(1920), ang(2080)); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffcf5a'; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(ang(m.rpm)) * (dr - 6), dy + Math.sin(ang(m.rpm)) * (dr - 6)); ctx.stroke();
    text(`${Math.round(m.rpm)}`, dx, dy + 8, {align: 'center', color: '#e9e4d6'});
    text(L('U/MIN', 'RPM'), dx, dy + 17, {align: 'center', color: '#6b7190'});
    text(`${num(Math.min(film, 400))} nm`, dx, a.y + 4, {align: 'center', color: Math.abs(film - 100) < 2 ? '#3fe06a' : '#cfe8ff'});
    text(L('ZIEL 100 NM', 'TARGET 100 NM'), dx, a.y + 14, {align: 'center', color: '#ffcf5a', max: 90});
    if (m.spinning && m.still > 0 && m.phase === 'play') {
      R('#1a2030', dx - 30, a.y + a.h - 8, 60, 3); R('#9fe0ff', dx - 30, a.y + a.h - 8, 60 * m.still / 150, 3);
      text(L('TROCKNET', 'DRYING'), dx, a.y + a.h - 18, {align: 'center', color: '#9fe0ff'});
    }
    ctx.restore(); result(m, a);
  },
};

/* ---------- 4 Expose: load the reticle, align it (SHIFT stops the mark, X then Y), then the scanner steps
 * across the whole wafer by itself, field after field. Overlay is what you contribute. ---------- */
const ALIGN_A = 14, ALIGN_T = 200, NM_PER_PX = 2.5;
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
        const sx = clamp(1 - Math.abs(m.dx) / 8, 0, 1), sy = clamp(1 - Math.abs(m.dy) / 8, 0, 1);
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
    // Side view of the scanner: laser, reticle stage, projection lens, water film, wafer stage.
    const cx = a.x + 58, exp = m.st === 'expose' && m.field < FIELD_GRID.length, pulse = exp && (m.bt % 3) < 2;
    R('#2a1e4a', cx - 26, a.y + 3, 52, 9); text('ARF 193 NM', cx, a.y + 4, {align: 'center', color: '#d6c8ff', max: 48});
    R('#5a6270', cx - 50, a.y + 26, 100, 2);
    const load = m.st === 'load' ? smooth(m.bt / 90) : 1, rx = cx - 30 + (1 - load) * -60, scan = exp ? Math.sin(m.bt / 2) * 6 : 0;
    R('#cfe8ff', rx + scan, a.y + 19, 60, 6); R('#9fb8d0', rx + scan, a.y + 24, 60, 1);
    for (let k = 0; k < 9; k++) if (k % 3 !== 1) R('#1a1e24', rx + scan + 10 + k * 4.5, a.y + 20, 3, 4);
    R('#1a1e24', rx + scan + 2, a.y + 20, 3, 1); R('#1a1e24', rx + scan + 3, a.y + 19, 1, 3); R('#1a1e24', rx + scan + 55, a.y + 20, 3, 1); R('#1a1e24', rx + scan + 56, a.y + 19, 1, 3);
    text(L('RETIKEL', 'RETICLE'), a.x + 1, a.y + 12, {color: '#8c93a8', font: 'IBM Plex Sans', size: 6, max: 30});
    // Projection lens: a column of elements in its housing, 4 : 1 reduction.
    R('#3a4058', cx - 30, a.y + 32, 4, 44); R('#3a4058', cx + 26, a.y + 32, 4, 44);
    [26, 22, 24, 18, 14, 10].forEach((wd, k) => { ctx.fillStyle = 'rgba(200,225,255,.75)'; ctx.beginPath(); ctx.ellipse(cx, a.y + 36 + k * 7, wd, 2.2, 0, 0, 7); ctx.fill(); });
    text(L('OBJEKTIV', 'LENS'), a.x + 1, a.y + 40, {color: '#8c93a8', font: 'IBM Plex Sans', size: 6, max: 26});
    // Exposure light: through the pattern, gathered by the lens onto one field.
    if (pulse) {
      ctx.strokeStyle = 'rgba(190,140,255,.85)'; ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) { const lx = cx - 20 + k * 8; ctx.beginPath(); ctx.moveTo(lx, a.y + 12); ctx.lineTo(lx, a.y + 19); ctx.moveTo(lx, a.y + 25); ctx.lineTo(cx + (lx - cx) * 0.5, a.y + 50); ctx.lineTo(cx + (lx - cx) * 0.12, a.y + 80); ctx.stroke(); }
    }
    // Water film and wafer on the stage; during alignment a red alignment beam comes in from the side.
    const wx = cx + (exp ? Math.cos(m.bt / 7) * 8 : 0);
    R('rgba(90,170,255,.6)', cx - 12, a.y + 79, 24, 2);
    R('#5a6270', wx - 40, a.y + 86, 80, 5); R('#d99a32', wx - 34, a.y + 82, 68, 3); R('#8e98a3', wx - 34, a.y + 85, 68, 1);
    if (m.st === 'alignX' || m.st === 'alignY') { ctx.strokeStyle = 'rgba(255,90,74,.8)'; ctx.beginPath(); ctx.moveTo(a.x + 4, a.y + 64); ctx.lineTo(cx - 14, a.y + 82); ctx.stroke(); }
    text(L('WAFERTISCH', 'WAFER STAGE'), cx, a.y + 94, {align: 'center', color: '#6b7190', max: 100});
    // Right: reticle library, alignment microscope or the wafer map.
    const px = a.x + 122, pw = a.w - 126, pc = px + pw / 2, pcy = a.y + a.h / 2 + 2;
    if (m.st === 'load') {
      text(L('RETIKEL-BIBLIOTHEK', 'RETICLE LIBRARY'), pc, a.y + 6, {align: 'center', color: '#9aa6b5', max: pw});
      for (let k = 0; k < 6; k++) { R('#3a4058', px + 10, a.y + 22 + k * 12, pw - 20, 8); if (k !== 2 || m.bt < 10) R('#cfe8ff', px + 14, a.y + 24 + k * 12, pw - 28, 4); }
      text(L('MASKE 1 · AKTIVGEBIET', 'MASK 1 · ACTIVE AREA'), pc, a.y + a.h - 14, {align: 'center', color: '#ffcf5a', max: pw});
    } else if (m.st === 'alignX' || m.st === 'alignY') {
      const r = 34, off = this.mark(m), ox = m.st === 'alignX' ? off : 0, oy = m.st === 'alignY' ? off : 0;
      const fx = m.st === 'alignY' ? m.dx : 0;
      circle('#2a3040', pc, pcy, r + 2); circle('#c8862a', pc, pcy, r);
      R('#5a3a10', pc - r, pcy, r * 2, 1); R('#5a3a10', pc, pcy - r, 1, r * 2);
      // The wafer mark: a cross etched into the layer below. The reticle mark: a bright frame.
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
 * Then a little more: 20 to 30 % over-etch makes sure every hole is open. */
const etch = {
  init(m) { m.tn = 140 + Math.random() * 60; m.te = m.tn + 180 + Math.random() * 140; m.g = 0; m.cn = []; m.co = []; },
  lines(m, g) {
    const drop = (t0, len) => g < t0 ? 1 : g < t0 + len ? 1 - (g - t0) / len : 0;
    const n1 = Math.sin(g * 0.7) * 0.03 + Math.sin(g * 2.3 + 1) * 0.02, n2 = Math.sin(g * 0.9 + 2) * 0.03 + Math.sin(g * 1.7) * 0.02;
    const cn = 0.25 + 0.65 * drop(m.tn, 30) + n1;
    const co = 0.2 + 0.7 * (g < m.tn ? 0.1 : g < m.tn + 30 ? (g - m.tn) / 30 : 1) * drop(m.te, 40) + n2;
    return [cn, co];
  },
  update(m, inp) {
    if (m.t < 30) return;
    m.g++;
    const [cn, co] = this.lines(m, m.g);
    m.cn.push(cn); m.co.push(co); if (m.cn.length > 230) { m.cn.shift(); m.co.shift(); }
    const T = m.te + 40, p = (m.g - T) / T * 100;
    if (inp.pressed || p > 120) {
      m.sfx('click');
      const s = p < 0 ? 1 + p / 25 : p < 15 ? 0.8 + 0.2 * p / 15 : p <= 35 ? 1 : 1 - (p - 35) / 60;
      finish(m, s, {overEtch: p}, [
        p < 0 ? L('Zu früh gestoppt: Oxidreste in den Löchern.', 'Stopped too early: oxide left in the holes.') : L(`Überätzung ${Math.round(p)} %`, `Over-etch ${Math.round(p)} %`),
        L('20 bis 30 % sind richtig, mehr greift das Silizium an.', '20 to 30 % is right, more attacks the silicon.')]);
    }
  },
  draw(m) {
    const a = frame(m, L('ÄTZEN · PLASMA, ENDPUNKT', 'ETCH · PLASMA, ENDPOINT'), L('SHIFT: STOPP, ETWAS NACH DEM CO-ABFALL', 'SHIFT: STOP A LITTLE AFTER THE CO DROP'));
    // Optical emission of the plasma: CN while nitride is etched, CO while oxide is etched.
    const gx = a.x + 8, gy = a.y + 6, gw = a.w - 16, gh = 50;
    R('#0b0f18', gx, gy, gw, gh);
    [[m.cn, '#7fe0ff', 'CN 387 nm', 2], [m.co, '#d6a8ff', 'CO 483 nm', 12]].forEach(([tr, col, name, ly]) => {
      text(name, gx + 3, gy + ly, {color: col});
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath();
      tr.forEach((v, i) => ctx[i ? 'lineTo' : 'moveTo'](gx + gw - tr.length + i, gy + gh - 3 - v * (gh - 8)));
      ctx.stroke();
    });
    // Cross-section: resist mask, nitride, oxide; the holes go down, then into the silicon.
    const sx = a.x + 20, sw = a.w - 40, si = a.y + a.h - 12, nit = 5, ox = 13, holes = [0.2, 0.5, 0.8].map(f => sx + f * sw - 8);
    R('#4f5866', sx, si, sw, 12); R('#cfe8ff', sx, si - ox, sw, ox); R('#9fc4a8', sx, si - ox - nit, sw, nit); R('#d99a32', sx, si - ox - nit - 8, sw, 8);
    const dn = clamp(m.g / (m.tn + 30), 0, 1) * nit, dox = clamp((m.g - m.tn - 30) / (m.te + 40 - m.tn - 30), 0, 1) * ox, over = Math.max(0, m.g - m.te - 40);
    holes.forEach(hx => {
      R('#0b0f18', hx, si - ox - nit - 8, 16, 8 + dn + dox);
      if (over > 0) R('#1a1e28', hx, si, 16, Math.min(6, over / 60));
    });
    for (let k = 0; k < 16; k++) circle('#c890ff', sx + ((k * 97 + Math.floor(F / 40) * 31) % sw), gy + gh + 4 + ((F * 1.2 + k * 11) % Math.max(4, si - ox - nit - 12 - gy - gh)), 1);
    ctx.restore(); result(m, a);
  },
};

/* ---------- 6 Implant: the mass spectrum of the source. Set the magnet on As+ and keep it there ----------
 * The arsine source also gives AsH+ right next to it, As2+ and leftovers of the last recipe (BF2+, P+). */
const ION = {
  'P+': [31, 1, '#d59cff', 0.25], 'As2+': [75, 2, '#7fd0ff', 0.2], 'BF2+': [49, 1, '#ffe08a', 0.15],
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
          L('Das CD-SEM misst sie gleich nach.', 'The CD-SEM measures it next.')]);
      }
    }
  },
  draw(m) {
    const help = {dispense: L('DER ENTWICKLER WIRD AUFGETRAGEN', 'DISPENSING THE DEVELOPER'), puddle: L('SHIFT: SPÜLEN, WENN DIE LINIE 40 NM HAT', 'SHIFT: RINSE WHEN THE LINE IS 40 NM'),
      rinse: L('SPÜLEN MIT DI-WASSER, TROCKENSCHLEUDERN', 'DI WATER RINSE, SPIN DRY')}[m.st];
    const a = frame(m, L('ENTWICKELN · TMAH 2,38 %, PFÜTZE', 'DEVELOP · TMAH 2.38 %, PUDDLE'), help);
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
    R('#cfe8ff', zx, base + 4, zw, 12); R('#9fc4a8', zx, base, zw, 4);
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
    R('rgba(8,10,16,.85)', zx, zy + zh - 12, zw, 12);
    text(m.st === 'dispense' ? L('LATENTES BILD', 'LATENT IMAGE') : read, zx + zw / 2, zy + zh - 10, {align: 'center', color: ok ? '#3fe06a' : cd !== null && cd < 36 ? '#ff8a5a' : '#cfe8ff', max: zw - 4});
    ctx.restore(); result(m, a);
  },
};

const GAMES = {clean, oxidize, coat, expose, develop, etch, implant};
// Skipped with Enter: the tool runs its standard recipe, which is never quite tuned for this lot.
const SKIP = {clean: {particles: 12}, oxidize: {oxide: 52.4}, coat: {resist: 104, rpm: 1850}, expose: {overlay: 8}, develop: {cd: 43.2, dev: 60}, etch: {overEtch: 8}, implant: {dose: 0.8, purity: 1}};
function skip(m) {
  if (m.phase !== 'play') return;
  finish(m, 0.6, SKIP[m.type], [L('Übersprungen: Die Anlage fährt ihr Standardrezept.', 'Skipped: the tool runs its standard recipe.')]);
}
function create(type, o = {}) {
  const m = {type, t: 0, phase: 'play', score: 0, values: {}, closed: false, resultT: 0, sfx: o.sfx || (() => {})};
  GAMES[type].init(m, o);
  return m;
}
function update(m, inp) {
  m.t++;
  if (m.phase === 'play') GAMES[m.type].update(m, inp);
  else { m.resultT++; if ((inp.pressed && m.resultT > 24) || m.resultT > 600) m.closed = true; }
}
function draw(c, m, language) {
  ctx = c; F = m.t; lang = language;
  GAMES[m.type].draw(m);
}

window.SchichtMini = {has: type => !!GAMES[type], create, update, draw, skip, grade, yieldOf, STEPS, radius, fieldFor, cdAfter, DEV: {FPS: DEV_FPS, LAG: DEV_LAG}};
})();
