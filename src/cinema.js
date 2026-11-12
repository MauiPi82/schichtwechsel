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
  // Water: reflections broken by rain.
  ctx.fillStyle = '#04070d'; ctx.fillRect(0, 212, W, H - 212);
  for (let y = 214; y < H; y += 3) {
    const k = (y - 212) / (H - 212);
    ctx.fillStyle = `rgba(232,180,80,${0.12 * (1 - k)})`; ctx.fillRect(40 - pan + Math.sin(F / 9 + y) * 4, y, 200, 1);
    ctx.fillStyle = `rgba(255,60,40,${0.18 * (1 - k)})`; ctx.fillRect(600 - pan + Math.sin(F / 7 + y) * 5, y, 40, 1);
    ctx.fillStyle = `rgba(200,210,190,${0.08 * (1 - k)})`; ctx.fillRect(460 - pan * 0.2 + Math.sin(F / 11 + y) * 3, y, 12, 1);
  }
  for (let i = 0; i < 40; i++) R('rgba(180,200,230,.25)', (i * 113 + F * 3) % W, 215 + (i * 37) % (H - 215), 3, 1);
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
  R('#141820', 520, 230, 6, 56); R('#141820', 600, 230, 6, 56); for (let x = 526; x < 600; x += 6) R('#1a1f2a', x, 246, 2, 40);
  R('#1a1f2a', 506, 214, 120, 14); txt('VOGT MICROELETTRONICA', 566, 217, 8, '#c9ced6');
  const x = 60 + ease(t / 6.5) * 400, step = Math.floor(F / 8) % 2;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x + 8, 287, 10, 3, 0, 0, 7); ctx.fill();
  R('#1a2438', x + 2, 254, 14, 18); R('#24324e', x + 3, 254, 12, 2);
  R('#2a3a5a', x + 4 + step * 2, 272, 4, 14); R('#2a3a5a', x + 10 - step * 2, 272, 4, 14);
  R('#1a2438', x + 4, 242, 10, 12); R('#0e1420', x + 5, 240, 8, 3);
  R('#4a3420', x + 13, 258, 5, 8);
}

const SHOTS = [
  {dur: 7.0, draw: t => { lakeScene(t, [21, 40], t * 8); rain(0.3); }, sound: 'lake'},
  {dur: 6.0, draw: bayScene, sound: 'bay'},
  {dur: 4.6, draw: scannerScene, sound: 'scanner'},
  {dur: 3.2, draw: emoScene, sound: 'emo'},
  {dur: 4.6, draw: darkScene, sound: 'dark'},
  {dur: 7.4, draw: t => { arrivalScene(t); rain(0.35); }, sound: 'arrival'},
];
const TOTAL = SHOTS.reduce((a, s) => a + s.dur, 0);

function shotAt(time) {
  let t = time;
  for (let i = 0; i < SHOTS.length; i++) { if (t < SHOTS[i].dur) return [i, t]; t -= SHOTS[i].dur; }
  return [SHOTS.length, 0];
}

function draw(c, time, frame) {
  ctx = c; F = frame;
  const [i, t] = shotAt(time);
  if (i >= SHOTS.length) { R('#000', 0, 0, W, H); return; }
  ctx.save();
  // A slow push-in on every shot.
  const z = 1 + t * 0.012;
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  SHOTS[i].draw(t);
  ctx.restore();
  // Cuts through black.
  const s = SHOTS[i], fade = Math.min(clamp(t / 0.5, 0, 1), clamp((s.dur - t) / 0.5, 0, 1));
  ctx.fillStyle = `rgba(0,0,0,${1 - fade})`; ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 220; k++) R(`rgba(255,255,255,${hash(k + frame) * 0.06})`, hash(k * 3 + frame) * W, hash(k * 7 + frame) * H, 1, 1);
  R('#000', 0, 0, W, BAR); R('#000', 0, H - BAR, W, BAR);
}

window.SchichtCinema = {draw, TOTAL, shotAt, SHOTS};
})();
