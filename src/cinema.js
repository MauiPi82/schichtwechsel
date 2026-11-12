/* Schichtwechsel - wordless prologue before the night shift, drawn at 640 x 360 with letterbox bars.
 * Six shots: the lake at 21:40, Bay 7 in yellow light, the scanner fault, the emergency stop,
 * darkness with three pairs of eyes, and the walk to the gate at 21:56. */
(() => {
'use strict';
const W = 640, H = 360, BAR = 40;
let ctx, F = 0;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
function circle(c, x, y, r) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); }
function txt(s, x, y, size, color, font = 'Silkscreen') {
  ctx.font = `400 ${size}px "${font}", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function rain(alpha = 0.35, n = 160, slant = 0.35) {
  ctx.strokeStyle = `rgba(170,190,220,${alpha})`; ctx.lineWidth = 1; ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = (i * 97 + F * 9) % (W + 80) - 40, y = (i * 61 + F * 23) % (H + 40) - 20;
    ctx.moveTo(x, y); ctx.lineTo(x - 7 * slant, y + 14);
  }
  ctx.stroke();
}
function clockFace(cx, cy, r, h, m) {
  circle('#e9dfb8', cx, cy, r); circle('#2a2418', cx, cy, r - 1); circle('#efe4be', cx, cy, r - 2);
  const a = (m / 60) * Math.PI * 2 - Math.PI / 2, b = ((h % 12) / 12 + m / 720) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#1a1208'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3)); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(b) * (r - 6), cy + Math.sin(b) * (r - 6)); ctx.stroke();
}
// The far shore: Alps in fog, Luino with its campanile on the left, the fab on the right.
function lakeScene(t, clock, pan) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#05070d'); g.addColorStop(0.5, '#0d1424'); g.addColorStop(1, '#04060b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  circle('rgba(220,225,200,.12)', 470 - pan * 0.2, 80, 40); circle('#cfd2c0', 470 - pan * 0.2, 80, 9);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(30,38,56,.55)'; ctx.beginPath(); ctx.ellipse(((i * 210 + F * 0.15) % (W + 300)) - 150, 70 + i * 13, 140, 14, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#0b111d'; ctx.beginPath(); ctx.moveTo(0, 190);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 150 + Math.sin(x / 47) * 18 + Math.sin(x / 13) * 5 - pan * 0.02);
  ctx.lineTo(W, 210); ctx.lineTo(0, 210); ctx.fill();
  ctx.fillStyle = 'rgba(40,50,70,.35)'; ctx.fillRect(0, 170, W, 30);
  ctx.save(); ctx.translate(-pan, 0);
  // Luino: houses, lights, the campanile with its clock.
  for (let i = 0; i < 18; i++) {
    const x = 20 + i * 18, h = 14 + hash(i) * 22;
    R('#06090f', x, 210 - h, 16, h);
    if (hash(i * 3) > 0.45) R('#e8b450', x + 4 + (hash(i * 5) * 6 | 0), 214 - h + 6, 2, 2);
  }
  R('#070a10', 180, 108, 18, 104); R('#070a10', 176, 100, 26, 10); R('#070a10', 186, 80, 6, 22);
  clockFace(189, 130, 8, clock[0], clock[1]);
  // The fab on the shore: long hall, stacks with steam, the red VOGT sign.
  R('#080c14', 520, 168, 360, 44); R('#0b1220', 520, 168, 360, 3);
  for (let i = 0; i < 24; i++) if (hash(i + 40) > 0.3) R('#7fb4e0', 530 + i * 14, 184, 8, 3);
  for (const sx of [560, 640, 760]) {
    R('#070a10', sx, 128, 10, 40);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = `rgba(150,160,180,${0.12 - k * 0.025})`; ctx.beginPath(); ctx.arc(sx + 5 + k * 6 + Math.sin(F / 30 + k) * 3, 120 - k * 12 - (F % 60) * 0.2, 7 + k * 4, 0, 7); ctx.fill(); }
  }
  const flick = hash(F >> 2) > 0.06;
  ctx.font = '400 16px "Pixelify Sans", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  if (flick) { ctx.fillStyle = 'rgba(255,40,30,.25)'; ctx.fillText('VOGT', 600, 147); ctx.fillText('VOGT', 602, 149); }
  ctx.fillStyle = flick ? '#ff4030' : '#5a1810'; ctx.fillText('VOGT', 601, 148);
  ctx.restore();
  // Water: a dark blue sheet with ripples, the far shore mirrored upside down, lights drawn out into
  // shimmering columns, a ferry far out, a moored boat and rain rings close by. Unmistakably a lake.
  const wy = 212, g2 = ctx.createLinearGradient(0, wy, 0, H);
  g2.addColorStop(0, '#13233a'); g2.addColorStop(0.35, '#0b1729'); g2.addColorStop(1, '#050a14');
  ctx.fillStyle = g2; ctx.fillRect(0, wy, W, H - wy);
  ctx.fillStyle = 'rgba(11,17,29,.55)'; ctx.beginPath(); ctx.moveTo(0, wy);
  for (let x = 0; x <= W; x += 16) ctx.lineTo(x, wy + (wy - (150 + Math.sin(x / 47) * 18 + Math.sin(x / 13) * 5)) * 0.35);
  ctx.lineTo(W, wy); ctx.fill();
  R('rgba(150,170,200,.35)', 0, wy, W, 1);
  const column = (cx, col, a0, wide) => {
    for (let y = wy + 2; y < H; y += 2) {
      const k = (y - wy) / (H - wy), seg = wide * (0.6 + 0.8 * hash(y * 3 + (F >> 3)));
      ctx.fillStyle = col.replace('A', (a0 * (1 - k * 0.8)).toFixed(3));
      ctx.fillRect(cx - seg / 2 + Math.sin(F / 13 + y * 0.7) * (2 + k * 6), y, seg, 1);
    }
  };
  column(474 - pan * 0.2, 'rgba(225,230,210,A)', 0.55, 16);
  ctx.save(); ctx.translate(-pan, 0);
  for (let i = 0; i < 18; i++) if (hash(i * 3) > 0.45) column(25 + i * 18 + (hash(i * 5) * 6 | 0), 'rgba(240,180,80,A)', 0.4, 4);
  column(625, 'rgba(255,60,40,A)', 0.5, 34);
  for (let i = 0; i < 24; i += 3) if (hash(i + 40) > 0.3) column(534 + i * 14, 'rgba(127,180,224,A)', 0.25, 6);
  ctx.restore();
  for (let i = 0; i < 70; i++) {
    const y = wy + 4 + (i * 37) % (H - wy - 4), k = (y - wy) / (H - wy);
    R(`rgba(160,185,220,${0.07 + 0.1 * k})`, (i * 131 + F * (0.4 + k)) % (W + 40) - 20, y, 6 + k * 18, 1);
  }
  // The ferry, lit windows, crossing slowly far out.
  const fx = ((t * 6 + 120) % (W + 160)) - 80, fy = wy + 10;
  R('#05080e', fx, fy - 4, 46, 5); R('#05080e', fx + 10, fy - 9, 24, 5); R('#05080e', fx + 28, fy - 14, 3, 5);
  for (let i = 0; i < 5; i++) R('#ffd27a', fx + 12 + i * 4, fy - 7, 2, 1);
  R('#ff3a2a', fx + 2, fy - 6, 1, 1); R('#3fe06a', fx + 44, fy - 6, 1, 1);
  for (let y = fy + 2; y < fy + 14; y += 2) R(`rgba(255,210,122,${0.25 - (y - fy) * 0.016})`, fx + 12 + Math.sin(F / 9 + y) * 2, y, 20, 1);
  // A rowing boat on its mooring, rocking.
  const rock = Math.sin(F / 40) * 1.5;
  ctx.save(); ctx.translate(96, 300 + rock); ctx.rotate(Math.sin(F / 55) * 0.03);
  ctx.fillStyle = '#04060b'; ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(34, -6); ctx.lineTo(26, 3); ctx.lineTo(-28, 3); ctx.closePath(); ctx.fill();
  R('#0d1626', -30, -7, 60, 1);
  ctx.restore();
  R('#04060b', 150, 268, 3, 52); R('rgba(140,160,190,.25)', 152, 270 + rock, 1, 30);
  // Rain rings on the water.
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const life = ((F + i * 23) % 50) / 50, rx = (i * 173 + Math.floor((F + i * 23) / 50) * 97) % W, ry = 250 + (i * 41 + Math.floor((F + i * 23) / 50) * 31) % 70;
    ctx.strokeStyle = `rgba(180,200,230,${0.35 * (1 - life)})`; ctx.beginPath(); ctx.ellipse(rx, ry, 2 + life * 9, 1 + life * 2.5, 0, 0, 7); ctx.stroke();
  }
}

// Bay 7 seen from the side, in yellow light: three operators at the litho cell.
function bayScene(t) {
  const flick = hash(F >> 3) > 0.12 ? 1 : 0.55;
  R('#120c04', 0, 0, W, H);
  ctx.fillStyle = `rgba(255,190,70,${0.18 * flick})`; ctx.fillRect(0, 0, W, H);
  for (let x = 40; x < W; x += 120) { R(flick > 0.9 ? '#ffd27a' : '#6a5022', x, 60, 70, 4); ctx.fillStyle = `rgba(255,200,90,${0.08 * flick})`; ctx.beginPath(); ctx.moveTo(x - 30, 64); ctx.lineTo(x + 100, 64); ctx.lineTo(x + 150, 290); ctx.lineTo(x - 80, 290); ctx.fill(); }
  R('#2a1e0c', 0, 290, W, 70); for (let x = 0; x < W; x += 24) R('#1c1408', x, 290, 1, 70);
  // Track and scanner in profile.
  R('#4a3a1c', 70, 190, 240, 100); R('#5a4824', 70, 190, 240, 6); R('#2a2010', 70, 250, 240, 4);
  for (let i = 0; i < 3; i++) { R('#1a1208', 110 + i * 60, 210, 36, 26); circle('#6a5a3a', 128 + i * 60, 223, 9); }
  R('#3a2c14', 330, 150, 220, 140); R('#4a3a1c', 330, 150, 220, 6); circle('#1a1208', 470, 200, 26); circle('#2a2010', 470, 200, 16);
  R('#120c04', 360, 230, 90, 30); R('#ffb43a', 366 + (Math.sin(F / 20) + 1) * 30, 240, 14, 10);
  // Wall clock: 21:40.
  clockFace(590, 100, 14, 21, 40);
  // Three operators; they stop working and turn their heads.
  const stop = t > 3.6, turn = t > 4.4;
  [[150, 'track'], [300, 'walk'], [430, 'screen']].forEach(([x0, job], i) => {
    const x = job === 'walk' && !stop ? x0 + Math.sin(t * 1.4) * 30 : x0;
    const bob = !stop ? Math.sin(F / 6 + i) : 0;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x + 12, 292, 16, 4, 0, 0, 7); ctx.fill();
    R('#d8c08a', x + 4, 226 + bob, 18, 40); R('#b39c62', x + 4, 256 + bob, 18, 4);
    R('#d8c08a', x + 6, 266, 6, 24); R('#d8c08a', x + 14, 266, 6, 24); R('#cdb888', x + 5, 282, 8, 8); R('#cdb888', x + 13, 282, 8, 8);
    R('#e3cf9a', x + 5, 204 + bob, 16, 22); R('#b39c62', x + 5, 222 + bob, 16, 3);
    const face = turn ? 1 : -1;
    R('#2a1e0a', x + (face > 0 ? 12 : 5), 210 + bob, 8, 5); R('#ffcf5a', x + (face > 0 ? 15 : 7), 211 + bob, 3, 2);
    R('#7a5a8a', x + (job === 'track' && !stop ? 22 + Math.sin(F / 8) * 3 : 20), 240 + bob, 5, 5);
  });
}

// Close-up: wafer under the lens, laser pulses, then the fault on the screen.
function scannerScene(t) {
  R('#0a0704', 0, 0, W, H);
  const fault = t > 2.6;
  // Lens and wafer stage.
  R('#3a2c14', 60, 40, 240, 50); circle('#1a1208', 180, 110, 50); circle('#2a2010', 180, 110, 38); circle('#0a0704', 180, 110, 24);
  const pulse = !fault && (F >> 1) % 2;
  if (pulse) { ctx.fillStyle = 'rgba(170,120,255,.5)'; ctx.beginPath(); ctx.moveTo(160, 130); ctx.lineTo(200, 130); ctx.lineTo(186, 250); ctx.lineTo(174, 250); ctx.fill(); }
  // The stage carries the wafer back and forth under the lens; exposed fields stay violet.
  const wx = fault ? 180 : 180 + Math.sin(t * 2.2) * 40, wy = 250;
  R('#2a2010', 40, 292, 280, 14); circle('#5a5040', wx, wy, 44); circle('#d99a32', wx, wy, 40);
  ctx.save(); ctx.beginPath(); ctx.arc(wx, wy, 40, 0, 7); ctx.clip();
  const done = Math.floor(clamp(t / 2.6, 0, 1) * 24);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
    const n = j * 5 + (j % 2 ? 4 - i : i);
    R(n < done ? 'rgba(120,70,200,.55)' : 'rgba(0,0,0,.08)', wx - 40 + i * 16 + 1, wy - 40 + j * 16 + 1, 14, 14);
  }
  ctx.restore();
  // Monitor.
  R('#1a1208', 360, 70, 230, 170); R(fault && (F >> 3) % 2 ? '#3a0804' : '#0a1a10', 368, 78, 214, 154);
  txt('LOT 4471', 475, 92, 16, '#7fd09a');
  txt('ESPOSIZIONE  2 / 3', 475, 116, 8, '#7fd09a');
  for (let i = 0; i < 5; i++) R('#2a6a3a', 388, 140 + i * 10, (fault ? 60 : 40 + t * 40) % 170, 3);
  if (fault) { txt('ERRORE', 475, 190, 16, '#ff4030'); txt('STAGE 0x0B · 21:40:07', 475, 212, 8, '#ff8070'); }
}

// A gloved hand presses the emergency stop.
function emoScene(t) {
  R('#0c0805', 0, 0, W, H);
  R('#3a3a3a', 0, 140, W, 220); R('#2a2a2a', 0, 140, W, 6);
  circle('#f2c21a', 320, 230, 70); circle('#1a1a1a', 320, 230, 52); circle('#e0281a', 320, 222, 46); circle('#ff5a3a', 304, 206, 12);
  txt('ARRESTO DI EMERGENZA', 320, 302, 8, '#f2c21a');
  const k = ease(t / 2.2), press = t > 2.3 ? 6 : 0;
  const hx = 640 - k * 270, hy = 120 + k * 60 + press;
  R('#6a40b0', hx, hy, 140, 46); R('#8a5cd6', hx, hy, 140, 8);
  for (let i = 0; i < 4; i++) R('#7a50c6', hx - 30 + (i === 0 ? 10 : 0), hy + 4 + i * 11, 40, 9);
  R('#f7f9fc', hx + 140, hy - 6, 120, 60); R('#d3dae4', hx + 140, hy + 40, 120, 8);
  if (t > 2.4) R('#000', 0, 0, W, H);
}

// Darkness: the stack light, then three pairs of eyes.
function darkScene(t) {
  R('#000', 0, 0, W, H);
  const red = (F >> 4) % 2;
  R('#1a0604', 316, 100, 8, 60); R(red ? '#ff3a2a' : '#3a0a06', 312, 92, 16, 10); R('#2a2a0a', 312, 104, 16, 10); R('#0a2a0e', 312, 116, 16, 10);
  if (red) { ctx.fillStyle = 'rgba(255,40,30,.12)'; ctx.beginPath(); ctx.arc(320, 97, 60, 0, 7); ctx.fill(); }
  [[180, 190, 1.2], [440, 170, 2.0], [300, 240, 2.8]].forEach(([x, y, at]) => {
    if (t < at) return;
    const a = clamp((t - at) * 2, 0, 1) * (hash((F >> 2) + x) > 0.05 ? 1 : 0.1);
    ctx.globalAlpha = a; R('#ffb43a', x, y, 4, 3); R('#ffb43a', x + 12, y, 4, 3); ctx.globalAlpha = 1;
  });
}

// 21:56: a figure in a jacket walks along the promenade in the rain towards the gate.
function arrivalScene(t) {
  lakeScene(t, [21, 56], 140);
  R('#0a0d14', 0, 286, W, 74); R('#1a2030', 0, 286, W, 2);
  for (let x = 30; x < W; x += 110) { R('#0e121c', x, 230, 3, 56); R('#0e121c', x - 4, 228, 11, 3); circle('rgba(255,200,120,.10)', x + 1, 234, 12); R('#ffd890', x - 1, 231, 5, 3); }
  // Gate with sign.
  R('#141820', 520, 230, 6, 56); for (let gx = 526; gx < 546; gx += 6) R('#1a1f2a', gx, 246, 2, 40); R('#05070b', 546, 236, 38, 50);
  R('#1a1f2a', 506, 214, 120, 14); txt('VOGT MICROELETTRONICA', 566, 217, 8, '#c9ced6');
  // Walk at an even pace to the gate and through it; the legs stop when the walking stops.
  const walkEnd = 6.4, x = 40 + Math.min(t, walkEnd) / walkEnd * 512, moving = t < walkEnd;
  const step = moving ? Math.floor(F / 8) % 2 : 0, fadeOut = clamp((x - 528) / 24, 0, 1);
  ctx.globalAlpha = 1 - fadeOut;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x + 8, 287, 10, 3, 0, 0, 7); ctx.fill();
  R('#1a2438', x + 2, 254, 14, 18); R('#24324e', x + 3, 254, 12, 2);
  R('#2a3a5a', x + 4 + step * 2, 272, 4, 14); R('#2a3a5a', x + 10 - step * 2, 272, 4, 14);
  R('#1a2438', x + 4, 242, 10, 12); R('#0e1420', x + 5, 240, 8, 3);
  R('#4a3420', x + 13, 258, 5, 8);
  ctx.globalAlpha = 1;
  // The open gate wing in front of the figure as it passes.
  R('#141820', 600, 230, 6, 56); for (let gx = 584; gx < 600; gx += 6) R('#1a1f2a', gx, 246, 2, 40);
}

// xin: how long the shot dissolves in over the one before (seconds). The power cut stays short on purpose.
const SHOTS = [
  {dur: 7.0, xin: 0, draw: t => { lakeScene(t, [21, 40], t * 8); rain(0.3); }, sound: 'lake'},
  {dur: 6.6, xin: 1.4, draw: bayScene, sound: 'bay'},
  {dur: 5.2, xin: 1.0, draw: scannerScene, sound: 'scanner'},
  {dur: 3.6, xin: 0.6, draw: emoScene, sound: 'emo'},
  {dur: 4.8, xin: 0.35, draw: darkScene, sound: 'dark'},
  {dur: 8.4, xin: 1.8, draw: t => { arrivalScene(t); rain(0.35); }, sound: 'arrival'},
];
const FADE_IN = 1.6, FADE_OUT = 1.8;
// A sequence of shots on one timeline: each starts xin seconds before the one before it ends.
function timeline(shots) { let at = 0; for (const s of shots) { at -= s.xin; s.start = at; at += s.dur; } return at; }
const TOTAL = timeline(SHOTS);

/* ---------- Epilogue of the normal ending: 05:59 to 06:12 ---------- */
// The lot goes into the stocker.
function stockerScene(t) {
  R('#c9ced6', 0, 0, W, H); R('#e6e9ee', 0, 0, W, 60);
  for (let x = 30; x < W; x += 140) { R('#f7f9fc', x, 54, 90, 4); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(x - 20, 58); ctx.lineTo(x + 110, 58); ctx.lineTo(x + 150, 290); ctx.lineTo(x - 60, 290); ctx.fill(); }
  R('#a9b1bc', 0, 290, W, 70); for (let x = 0; x < W; x += 24) R('#9aa3ae', x, 290, 1, 70);
  // The stocker: a tall cabinet with FOUPs behind glass, an input port, its display.
  R('#7c8693', 200, 70, 300, 220); R('#8d97a4', 200, 70, 300, 6); R('#5a6370', 210, 86, 280, 150);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { R('#d9dde3', 220 + c * 38, 96 + r * 34, 28, 22); R('#e8732a', 224 + c * 38, 102 + r * 34, 20, 3); }
  R('rgba(200,225,255,.18)', 210, 86, 280, 150);
  R('#3a4058', 300, 244, 100, 30); R('#9aa6b5', 300, 244, 100, 4);
  const lift = ease((t - 1.6) / 1.8), gone = t > 3.4;
  if (!gone) {
    const fx = 330, fy = 220 - lift * 74;
    R('#d9dde3', fx, fy, 40, 26); R('#a9b1bc', fx, fy + 22, 40, 4); R('#e8732a', fx + 6, fy + 8, 28, 4); R('#5a6370', fx + 14, fy - 4, 12, 4);
    R('#d8262a', fx + 36 + Math.round(Math.sin(F / 10)), fy + 6, 8, 12); R('#ffffff', fx + 38 + Math.round(Math.sin(F / 10)), fy + 10, 4, 2);
  }
  R('#0b0f18', 420, 244, 64, 24);
  if (t > 3.6 && (F >> 4) % 2) txt('4471 OK', 452, 252, 8, '#3fe06a');
  else if (t <= 3.6) txt('4471 >', 452, 252, 8, '#ffcf5a');
  // You beside it, in the suit, seen from the side.
  const x = 120;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 14, 292, 18, 4, 0, 0, 7); ctx.fill();
  R('#f7f9fc', x + 4, 226, 22, 40); R('#d3dae4', x + 4, 256, 22, 4); R('#f7f9fc', x + 6, 266, 7, 24); R('#f7f9fc', x + 16, 266, 7, 24);
  R('#e2e8f0', x + 5, 282, 9, 8); R('#e2e8f0', x + 15, 282, 9, 8);
  R('#f7f9fc', x + 5, 202, 20, 24); R('#2a3240', x + 14, 208, 10, 6); R('#4a8fd8', x + 17, 209, 5, 3);
  R('#8a5cd6', x + 24, 240, 6, 6);
  clockFace(560, 100, 16, 5, 59);
}
// 06:00 over the lake: first light, the campanile strikes six; rings of sound go out over the water.
function dawnScene(t) {
  lakeScene(t, [6, 0], 60 + t * 4);
  const g = ctx.createLinearGradient(0, 40, 0, 220);
  g.addColorStop(0, 'rgba(40,60,110,.35)'); g.addColorStop(0.7, 'rgba(230,140,90,.32)'); g.addColorStop(1, 'rgba(255,190,120,.45)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 212);
  ctx.fillStyle = 'rgba(255,170,110,.12)'; ctx.fillRect(0, 212, W, H - 212);
  const cx = 189 - (60 + t * 4), cy = 130;
  for (let k = 0; k < 6; k++) {
    const age = t - 0.6 - k * 0.7; if (age < 0 || age > 2.4) continue;
    ctx.strokeStyle = `rgba(255,230,190,${0.5 * (1 - age / 2.4)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 10 + age * 60, 0, 7); ctx.stroke();
  }
}
// The time clock at the exit: the card goes through it like through air.
function timeClockScene(t) {
  R('#1a1e24', 0, 0, W, H); for (let y = 0; y < H; y += 32) R('#20252c', 0, y, W, 1); for (let x = 0; x < W; x += 48) R('#20252c', x, 0, 1, H);
  // The card rack beside it: everyone's cards, three of them still in the IN row.
  R('#3a3226', 450, 80, 120, 200); R('#4a4032', 450, 80, 120, 6);
  txt('ENTRATA', 480, 90, 8, '#c9b98a'); txt('USCITA', 540, 90, 8, '#c9b98a');
  for (let r = 0; r < 8; r++) { R('#2a2418', 456, 104 + r * 21, 50, 16); R('#2a2418', 514, 104 + r * 21, 50, 16); }
  for (const r of [1, 4, 6]) { R('#efe6c8', 456, 98 + r * 21, 50, 20); R('#c9b98a', 456, 98 + r * 21, 50, 4); }
  txt('ROSSI', 481, 108 + 1 * 21, 8, '#5a4a2a'); txt('COLOMBO', 481, 108 + 4 * 21, 8, '#5a4a2a'); txt('FERRARI', 481, 108 + 6 * 21, 8, '#5a4a2a');
  // The clock: cream housing, a round dial on top, the display, the slot.
  R('#d8cfb8', 200, 70, 200, 220); R('#c4bba4', 200, 70, 200, 8); R('#b8ae96', 200, 282, 200, 8);
  circle('#2a2418', 300, 62, 30); circle('#efe4be', 300, 62, 27); clockFace(300, 62, 25, t > 2.2 ? 6 : 5, t > 2.2 ? 0 : 59);
  txt('VOGT · TIMBRATRICE', 300, 84, 8, '#7a6e56');
  R('#0b0f18', 224, 100, 152, 46);
  const denied = t > 2.2, on = (F >> 4) % 2;
  if (denied) { txt('USCITA NEGATA', 300, 108, 16, on ? '#ff3a2a' : '#7a1810'); txt('06:00', 300, 128, 8, on ? '#ff3a2a' : '#7a1810'); }
  else { txt('TIMBRA', 300, 108, 16, '#3fe06a'); txt('05:59', 300, 128, 8, '#3fe06a'); }
  R('#2a2418', 280, 168, 40, 6); txt('▼', 300, 178, 8, '#7a6e56');
  // The card slides down into the slot and comes out below, unstamped; the glove lets go.
  const k = ease((t - 0.6) / 2.2), cy = 40 + k * 230;
  ctx.globalAlpha = cy > 150 && cy < 290 ? 0.35 : 1;
  R('#efe6c8', 304, cy, 32, 50); R('#c9b98a', 304, cy, 32, 6); txt('18', 320, cy + 20, 8, '#5a4a2a');
  ctx.globalAlpha = 1;
  if (t < 2.8) { R('#8a5cd6', 296, Math.min(cy, 150) - 26, 48, 28); R('#6a40b0', 296, Math.min(cy, 150) - 4, 48, 4); }
  if (denied) { ctx.fillStyle = `rgba(255,40,30,${0.08 + 0.06 * Math.sin(F / 6)})`; ctx.fillRect(0, 0, W, H); }
}
// The fab from the water at dawn: one window still in yellow light, and now four stand in it.
function windowScene(t) {
  const g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, '#1c2a4a'); g.addColorStop(0.6, '#8a6a7a'); g.addColorStop(1, '#e8a878');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 220);
  R('#141a26', 60, 90, 520, 130); R('#1c2432', 60, 90, 520, 6);
  for (let i = 0; i < 8; i++) if (i !== 4) R('#2a3448', 84 + i * 62, 120, 40, 50);
  // The lit window: three in the tan suits of shift B, one in white.
  const wx = 330, wy = 112, flick = hash(F >> 3) > 0.08 ? 1 : 0.6;
  R(`rgba(255,196,80,${0.9 * flick})`, wx - 12, wy, 92, 66);
  ctx.fillStyle = `rgba(255,190,70,${0.18 * flick})`; ctx.beginPath(); ctx.moveTo(wx - 12, wy + 66); ctx.lineTo(wx + 80, wy + 66); ctx.lineTo(wx + 110, 220); ctx.lineTo(wx - 40, 220); ctx.fill();
  const four = clamp((t - 1.2) / 1.4, 0, 1);
  [[wx - 2, '#4a3a1c'], [wx + 20, '#4a3a1c'], [wx + 42, '#4a3a1c'], [wx + 62, '#f7f9fc']].forEach(([fx, col], i) => {
    ctx.globalAlpha = i === 3 ? four : 1;
    R(col, fx, wy + 30, 12, 36); R(col, fx + 1, wy + 18, 10, 13);
    R(i === 3 ? '#4a8fd8' : '#ffb43a', fx + 3, wy + 22, 6, 2);
  });
  ctx.globalAlpha = 1;
  // Water with the reflection of the lit window.
  const wyy = 220, g2 = ctx.createLinearGradient(0, wyy, 0, H);
  g2.addColorStop(0, '#2a3048'); g2.addColorStop(1, '#0a0e18'); ctx.fillStyle = g2; ctx.fillRect(0, wyy, W, H - wyy);
  for (let y = wyy + 2; y < H; y += 2) {
    const k = (y - wyy) / (H - wyy), seg = 70 * (0.6 + 0.6 * hash(y * 3 + (F >> 3)));
    ctx.fillStyle = `rgba(255,196,80,${(0.45 * (1 - k)).toFixed(3)})`; ctx.fillRect(wx + 34 - seg / 2 + Math.sin(F / 13 + y * 0.7) * (2 + k * 6), y, seg, 1);
  }
}
// Lot 4471 in cross-section: eight layers from tonight, and a ninth settling on top.
function layersScene(t) {
  R('#07080c', 0, 0, W, H);
  const x0 = 150, w = 340, base = 300;
  const bands = [[60, '#4f5866'], [12, '#cfe8ff'], [14, '#9fc4a8'], [20, '#a9cbe6'], [8, '#7a8a9a'], [20, '#a9cbe6'], [12, '#c9ced6'], [22, '#c9ced6']];
  let y = base;
  bands.forEach(([h, col]) => { R(col, x0, y - h, w, h); R('rgba(0,0,0,.25)', x0, y - h, w, 1); y -= h; });
  for (const hx of [0.2, 0.5, 0.8]) { ctx.fillStyle = 'rgba(150,100,230,.8)'; ctx.beginPath(); ctx.ellipse(x0 + hx * w, base - 60, 22, 12, 0, 0, Math.PI); ctx.fill(); }
  // Eight layers, counted up the side; then the ninth comes down and settles, with four small figures in it.
  bands.forEach((_, i) => { if (t > 0.3 + i * 0.12) txt(String(i + 1), x0 - 16, base - bands.slice(0, i + 1).reduce((a, b) => a + b[0], 0) + bands[i][0] / 2 - 6, 8, '#6b7190'); });
  const top = y, k = ease((t - 1.6) / 2.4), h9 = 8, yy = top - h9 - (1 - k) * 110;
  ctx.globalAlpha = k;
  ctx.fillStyle = `rgba(220,200,255,${0.25 + 0.15 * Math.sin(F / 8)})`; ctx.fillRect(x0 - 6, yy - 6, w + 12, h9 + 12);
  R('#e8e2f4', x0, yy, w, h9); R('#ffffff', x0, yy, w, 1);
  for (let i = 0; i < 4; i++) { const fx = x0 + 50 + i * 76; R(i === 3 ? '#ffffff' : '#8a7a5a', fx, yy + 2, 14, 4); R(i === 3 ? '#ffffff' : '#8a7a5a', fx + 14, yy + 3, 5, 2); }
  ctx.globalAlpha = 1;
  if (k >= 1) { txt('9', x0 - 16, yy - 3, 8, '#e0402a'); txt('12 nm', x0 + w + 46, yy - 6, 16, '#e0402a'); R('#e0402a', x0 + w + 4, yy + 3, 16, 1); }
  txt('LOT 4471', x0 + w / 2, base + 10, 16, '#6b7190');
}
const END_SHOTS = [
  {dur: 5.6, xin: 0, draw: stockerScene},
  {dur: 6.0, xin: 1.2, draw: dawnScene},
  {dur: 5.4, xin: 1.0, draw: timeClockScene},
  {dur: 6.2, xin: 1.2, draw: windowScene},
  {dur: 7.0, xin: 1.2, draw: layersScene},
];
const END_TOTAL = timeline(END_SHOTS);

// The shot that is coming in at this moment, and its own time.
function shotAt(time, shots = SHOTS, total = TOTAL) {
  if (time >= total) return [shots.length, 0];
  for (let i = shots.length - 1; i >= 0; i--) if (time >= shots[i].start) return [i, time - shots[i].start];
  return [0, time];
}

let off = null, octx = null;
function drawShot(shots, i, t) {
  ctx.save();
  // A slow push-in on every shot.
  const z = 1 + t * 0.012;
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  shots[i].draw(t);
  ctx.restore();
}

function play(c, time, frame, shots, total) {
  ctx = c; F = frame;
  const [i, t] = shotAt(time, shots, total);
  if (i >= shots.length) { R('#000', 0, 0, W, H); return; }
  const s = shots[i];
  if (i > 0 && t < s.xin) {
    // Dissolve: the shot before stays underneath, the new one is drawn off screen and laid over it.
    drawShot(shots, i - 1, time - shots[i - 1].start);
    if (!off || off.width !== c.canvas.width || off.height !== c.canvas.height) {
      off = document.createElement('canvas'); off.width = c.canvas.width; off.height = c.canvas.height; octx = off.getContext('2d');
    }
    octx.setTransform(c.getTransform()); octx.clearRect(0, 0, W, H);
    ctx = octx; drawShot(shots, i, t); ctx = c;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = ease(t / s.xin); c.drawImage(off, 0, 0); c.restore();
  } else drawShot(shots, i, t);
  // In from black at the start, out to black at the end.
  const black = Math.max(1 - ease(time / FADE_IN), ease((time - (total - FADE_OUT)) / FADE_OUT));
  if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, W, H); }
  for (let k = 0; k < 220; k++) R(`rgba(255,255,255,${hash(k + frame) * 0.06})`, hash(k * 3 + frame) * W, hash(k * 7 + frame) * H, 1, 1);
  R('#000', 0, 0, W, BAR); R('#000', 0, H - BAR, W, BAR);
}
function draw(c, time, frame) { play(c, time, frame, SHOTS, TOTAL); }
// The epilogue with a caption per shot in the lower bar.
function drawEnd(c, time, frame, captions) {
  play(c, time, frame, END_SHOTS, END_TOTAL);
  const [i, t] = shotAt(time, END_SHOTS, END_TOTAL);
  if (i >= END_SHOTS.length || !captions || !captions[i]) return;
  const a = Math.min(clamp((t - 0.6) / 0.8, 0, 1), clamp((END_SHOTS[i].dur - t - 0.3) / 0.6, 0, 1));
  ctx.globalAlpha = a;
  ctx.font = '400 15px "IBM Plex Sans", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#e9e4d6'; ctx.fillText(captions[i], W / 2, H - BAR + 11, W - 40);
  ctx.globalAlpha = 1;
}

window.SchichtCinema = {draw, TOTAL, shotAt, SHOTS, drawEnd, END_TOTAL, endShotAt: time => shotAt(time, END_SHOTS, END_TOTAL)};
})();
