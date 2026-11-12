/* Schichtwechsel - six process steps you play yourself. Nothing can be lost here: how well you hit a step
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
const STEPS = ['clean', 'oxidize', 'coat', 'expose', 'etch', 'implant'];
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
  text(title, PX + 6, y0 + 2, {color: '#ffcf5a', max: PW - 104});
  const canSkip = m.phase === 'play' && m.t > 60;
  text(canSkip ? L('ENTER: ÜBERSPRINGEN', 'ENTER: SKIP') : 'LOT 4471', PX + PW - 6, y0 + 2, {align: 'right', color: canSkip ? '#6b5a2a' : '#c9a15a', max: 96});
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
    // Furnace from the side, the boat rising in.
    const fx = a.x + 14, fw = 60, top = a.y + 6, bot = a.y + a.h - 6, rise = smooth(m.t / 100), heat = clamp((m.t - 60) / 50, 0, 1);
    R('#3a2a1a', fx, top, fw, bot - top - 14);
    for (let yy = top + 4; yy < bot - 20; yy += 5) R(`rgba(255,${120 + 60 * (1 - heat)},40,${0.3 + 0.5 * heat})`, fx + 3, yy, fw - 6, 2);
    R('rgba(200,230,255,.25)', fx + 12, top + 4, fw - 24, bot - top - 18);
    const by = bot - 16 - rise * (bot - top - 28);
    for (let k = 0; k < 13; k++) R(heat > 0.6 ? '#fff0c8' : '#c9ced6', fx + 18, by + k * 3, fw - 36, 1);
    if (m.st === 'grow') for (let k = 0; k < 6; k++) circle('rgba(160,220,255,.8)', fx + 18 + ((k * 11) % 24), top + 6 + ((F * 0.6 + k * 13) % (bot - top - 26)), 1);
    text(m.st === 'grow' ? `t = ${Math.round(m.g / 6)} min` : L('BOOT FÄHRT EIN', 'BOAT LOADING'), fx + fw / 2, bot - 10, {align: 'center', color: '#9aa6b5', max: fw + 20});
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

/* ---------- 4 Expose: focus every field with the arrows, then SHIFT. The wafer is not flat ---------- */
const FIELDS = 4;
const expose = {
  // Focus in nm. The fields stand at different heights (±100 nm); within ±15 nm it is perfetto.
  init(m) { m.field = 0; m.z = 0; m.target = Math.round((Math.random() - 0.5) * 200); m.res = []; m.flash = 0; m.offs = []; m.hold = 0; },
  update(m, inp) {
    if (m.flash > 0) { m.flash--; if (!m.flash && m.field >= FIELDS) this.end(m); return; }
    const dir = (inp.right || inp.up ? 1 : 0) - (inp.left || inp.down ? 1 : 0);
    m.hold = dir ? m.hold + 1 : 0;
    m.z = clamp(m.z + dir * (m.hold > 30 ? 4 : 1), -300, 300);
    if (inp.pressed && m.field < FIELDS) {
      const off = Math.abs(m.z - m.target);
      m.res.push(clamp(1 - off / 150, 0, 1)); m.offs.push(off);
      m.field++; m.flash = 26; m.sfx('zap');
      m.target = Math.round(clamp(m.target + (Math.random() - 0.5) * 160, -100, 100));
    }
  },
  end(m) {
    const s = m.res.reduce((x, y) => x + y, 0) / FIELDS, off = m.offs.reduce((x, y) => x + y, 0) / FIELDS;
    finish(m, s, {defocus: off}, [
      L(`Mittlere Fokusabweichung ${Math.round(off)} nm`, `Mean focus error ${Math.round(off)} nm`),
      L('Unscharf belichtet heißt breitere Linien. Das CD-SEM sieht es.', 'Blurred exposure means wider lines. The CD-SEM will see it.')]);
  },
  draw(m) {
    const a = frame(m, L(`BELICHTEN · FELD ${Math.min(m.field + 1, FIELDS)}/${FIELDS}`, `EXPOSE · FIELD ${Math.min(m.field + 1, FIELDS)}/${FIELDS}`), L('← → FOKUS · SHIFT: BELICHTEN', '← → FOCUS · SHIFT: EXPOSE'));
    // The aerial image: five lines, blurred by the focus error.
    const ix = a.x + 8, iy = a.y + 8, iw = 120, ih = a.h - 30, off = Math.abs(m.z - m.target), b = clamp(off / 200, 0, 1);
    R('#2a2f38', ix, iy, iw, ih);
    for (let k = 0; k < 5; k++) {
      const lx = ix + 12 + k * 22, sp = 1 + b * 9;
      for (let j = 3; j >= 1; j--) { ctx.globalAlpha = (0.18 + 0.1 * (1 - b)) / j; R('#d8dde5', lx - sp * j / 3, iy + 6, 8 + 2 * sp * j / 3, ih - 12); }
      ctx.globalAlpha = 1 - 0.75 * b; R('#e9eef5', lx, iy + 6, 8, ih - 12); ctx.globalAlpha = 1;
    }
    if (m.flash) { ctx.fillStyle = `rgba(200,160,255,${m.flash / 26 * 0.6})`; ctx.fillRect(ix, iy, iw, ih); }
    text(L('LUFTBILD', 'AERIAL IMAGE'), ix + 2, iy + ih + 2, {color: '#6b7190'});
    // Sharpness meter and focus position.
    const sx = ix + iw + 10, sw = 12, sh = ih;
    R('#1a2030', sx, iy, sw, sh); R(b < 0.12 ? '#3fe06a' : b < 0.4 ? '#ffcf5a' : '#e0402a', sx + 2, iy + sh * b, sw - 4, sh * (1 - b));
    text(L('SCHÄRFE', 'SHARP'), sx + sw / 2, iy + sh + 2, {align: 'center', color: '#6b7190'});
    text(`z ${m.z >= 0 ? '+' : ''}${Math.round(m.z)} nm`, sx + sw + 8, iy, {color: '#e9e4d6'});
    // The wafer with its fields.
    const cx = a.x + a.w - 44, cy = a.y + a.h / 2 + 6, r = 32;
    circle('#5a6270', cx, cy, r + 1); circle('#d99a32', cx, cy, r);
    for (let k = 0; k < FIELDS; k++) {
      const fx = cx - 24 + (k % 3) * 16 + (k >= 3 ? 8 : 0), fy = cy - 14 + Math.floor(k / 3) * 16;
      if (k < m.res.length) R(grade(m.res[k]).color, fx, fy, 14, 14);
      else R('rgba(0,0,0,.25)', fx, fy, 14, 14);
      if (k === m.field && m.phase === 'play' && (F >> 4) % 2) { ctx.strokeStyle = '#ffffff'; ctx.strokeRect(fx + 0.5, fy + 0.5, 13, 13); }
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

const GAMES = {clean, oxidize, coat, expose, etch, implant};
// Skipped with Enter: the tool runs its standard recipe, which is never quite tuned for this lot.
const SKIP = {clean: {particles: 12}, oxidize: {oxide: 52.4}, coat: {resist: 104, rpm: 1850}, expose: {defocus: 60}, etch: {overEtch: 8}, implant: {dose: 0.8, purity: 1}};
function skip(m) {
  if (m.phase !== 'play') return;
  finish(m, 0.6, SKIP[m.type], [L('Übersprungen: Die Anlage fährt ihr Standardrezept.', 'Skipped: the tool runs its standard recipe.')]);
}
function create(type, o = {}) {
  const m = {type, t: 0, phase: 'play', score: 0, values: {}, closed: false, resultT: 0, sfx: o.sfx || (() => {})};
  GAMES[type].init(m);
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

window.SchichtMini = {has: type => !!GAMES[type], create, update, draw, skip, grade, yieldOf, STEPS, radius, fieldFor};
})();
