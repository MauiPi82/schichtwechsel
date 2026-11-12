/* Schichtwechsel - the fab, drawn at 640 x 360 (32 px per tile), oblique top-down: top faces plus front faces.
 * Tools are drawn after real equipment types (coater/developer track, immersion scanner, cluster platforms for etch,
 * CVD and sputtering, single plasma chambers, vertical and horizontal furnaces, implanter source and end station,
 * wet bench, metrology, gas cabinets, stocker) under invented maker names. */
(() => {
'use strict';
const C = window.SchichtCore;
const T = 32, FY = 32, WW = 640;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
let ctx, F = 0, night = false, reduced = false;
const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const O = (c, x, y, w, h) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w - 1, h - 1); };
function circle(c, x, y, r) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function ring(c, x, y, r, w = 1) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
function text(s, x, y, o = {}) {
  ctx.font = `${o.weight || 400} ${o.size || 8}px "${o.font || 'Silkscreen'}", monospace`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1, o.max || 400); }
  ctx.fillStyle = o.color || '#1a2230'; ctx.fillText(s, Math.round(x), Math.round(y), o.max || 400);
}

/* ---------- Palettes: your shift and the shift before ---------- */
const P = [
  {floor: '#b4bcc7', floorHi: '#cdd3db', floorLo: '#98a1ad', dot: '#8b94a1', solid: '#bec5ce', wallTop: '#e8ecf1', wallFace: '#c4ccd6', wallLo: '#9aa4b1', grille: '#8a94a2', trim: '#2c6fb5',
    white: '#eef1f4', white2: '#d6dbe2', white3: '#b3bbc6', grey: '#7c8693', dark: '#3a414c', darker: '#262b33', glass: 'rgba(160,205,240,.55)', screen: '#0d2a4a', ui: '#7fd0ff',
    accent: '#2c6fb5', accent2: '#e8732a', wafer: '#c9ced6', foup: '#d9dde3', foupLo: '#a9b1bc', label: '#1a2230', void: '#1c2129'},
  {floor: '#2a2013', floorHi: '#3a2d18', floorLo: '#1a130a', dot: '#120c05', solid: '#2f2414', wallTop: '#4a3a1c', wallFace: '#342812', wallLo: '#1f170a', grille: '#160f06', trim: '#9a6c1e',
    white: '#5a4a2a', white2: '#4a3c22', white3: '#3a2f1a', grey: '#2d2414', dark: '#1a140a', darker: '#100c05', glass: 'rgba(120,80,20,.35)', screen: '#1a0d02', ui: '#ffb43a',
    accent: '#7a5414', accent2: '#8a4a12', wafer: '#6a5a3a', foup: '#6a5a3a', foupLo: '#4a3d24', label: '#c08a2a', void: '#030201'},
];
let p = P[0];

/* ---------- Floor, walls, windows, holes ---------- */
function tileAt(L, layer, x, y) { return x < 0 || y < 0 || x >= C.W || y >= C.H ? '#' : L.layers[layer][y * C.W + x]; }

function floorTile(x, y, px, py) {
  const h = hash(x * 31 + y * 17 + (night ? 7 : 0));
  R(h > 0.85 ? p.solid : p.floor, px, py, T, T);
  if (h <= 0.85) for (let yy = 4; yy < T - 2; yy += 4) for (let xx = 4; xx < T - 2; xx += 4) R(p.dot, px + xx, py + yy, 2, 2);
  R(p.floorHi, px, py, T, 1); R(p.floorHi, px, py, 1, T); R(p.floorLo, px, py + T - 1, T, 1); R(p.floorLo, px + T - 1, py, 1, T);
  if (night) {
    if (h > 0.6) { ctx.fillStyle = 'rgba(10,6,0,.35)'; ctx.beginPath(); ctx.ellipse(px + 10 + h * 12, py + 14, 9 + h * 6, 5, h * 3, 0, 7); ctx.fill(); }
    if (h < 0.18) { R('#0b0703', px + 4, py + 20, 12, 1); R('#0b0703', px + 15, py + 18, 9, 1); R('#0b0703', px + 23, py + 17, 5, 1); }
  }
}

function wallTile(L, layer, x, y, px, py) {
  const below = tileAt(L, layer, x, y + 1) !== '#', face = below ? 14 : 0;
  R(p.wallTop, px, py, T, T - face);
  R(night ? '#584526' : '#f6f8fa', px, py, T, 1);
  if (below) {
    const fy = py + T - face;
    R(p.wallFace, px, fy, T, face); R(p.trim, px, fy, T, 2);
    for (let i = 0; i < 4; i++) R(p.grille, px + 3, fy + 5 + i * 2, T - 6, 1);
    R(p.wallLo, px, fy + face - 2, T, 2);
    R('rgba(0,0,0,.22)', px, py + T, T, 4);
    if (night && hash(x * 5 + y) > 0.55) R('rgba(20,10,0,.5)', px + (hash(x) * 24 | 0), fy + 2, 2, face - 3);
  }
  if (tileAt(L, layer, x, y - 1) !== '#') R(night ? '#5a4626' : '#f8fafc', px, py, T, 2);
}

function lakeWindow(x, y, px, py) {
  R(p.wallTop, px, py, T, 8);
  R(night ? '#030305' : '#081633', px, py + 8, T, T - 8);
  R(night ? '#04050a' : '#0e2147', px, py + 18, T, T - 18);
  if (!night) {
    for (let i = 0; i < 4; i++) R('#f2e6b0', px + 12 + ((F >> 4) + i) % 3, py + 20 + i * 3, 8 - i * 2, 1);
    R('#ffd27a', px + (hash(x) * 26 | 0), py + 15, 2, 1);
    circle('#f6efcf', px + 24, py + 12, 2);
  } else if ((x + y) % 3 === 0 && (F >> 5) % 3) R('#a02818', px + 16, py + 14, 2, 2);
  R(night ? '#2a200e' : '#9aa6b5', px, py + 8, T, 1); R(night ? '#2a200e' : '#9aa6b5', px + 15, py + 8, 2, T - 8);
}

// A missing floor plate shows the pedestals and cables of the raised floor beneath.
function holeTile(L, layer, x, y, px, py) {
  R(p.void, px, py, T, T);
  for (const [ox, oy] of [[2, 4], [T - 6, 4], [2, T - 6], [T - 6, T - 6]]) R(night ? '#24190a' : '#38404b', px + ox, py + oy, 4, 4);
  R(night ? '#3a1408' : '#2a3a5a', px + 4, py + 16 + (hash(x * 9 + y) * 6 | 0), T - 8, 2);
  if (tileAt(L, layer, x, y - 1) !== 'o') R(night ? '#120c04' : '#596270', px, py, T, 4);
}

/* ---------- Gowning room and air shower ---------- */
function lockers(x, y, px, py, open) {
  R('rgba(0,0,0,.25)', px, py + T, T, 3);
  R('#8d97a4', px, py - 10, T, T + 10); R('#a7b0bc', px, py - 10, T, 3);
  for (const dx of [1, 16]) {
    R('#b8c0cb', px + dx, py - 6, 15, T + 4); R('#97a1ae', px + dx, py - 6, 1, T + 4);
    for (let i = 0; i < 3; i++) R('#7c8693', px + dx + 4, py - 3 + i * 2, 7, 1);
    R('#4a525e', px + dx + 11, py + 10, 2, 4);
    const no = 10 + x * 2 + (dx > 1 ? 1 : 0);
    text(String(no), px + dx + 3, py + 20, {size: 8, color: '#4a525e'});
    // Your locker, open: the door swung aside, jacket and bag on the hook, a note taped inside the door.
    if (open && open.no === no && !night) {
      const k = Math.min(1, open.t / 16);
      R('#2a2e36', px + dx + 1, py - 5, 13, T + 2); R('#3a404a', px + dx + 1, py - 5, 13, 1);
      R('#9aa3ae', px + dx + 6, py - 3, 3, 1);
      if (open.t > 30) { R('#24324e', px + dx + 3, py - 2, 9, 12); R('#1a2438', px + dx + 7, py - 2, 1, 12); R('#6a4a2a', px + dx + 8, py + 9, 5, 5); }
      R('#b8c0cb', px + dx - Math.round(11 * k), py - 6, 3 + Math.round(9 * (1 - k)), T + 4);
      if (open.t > 60) { R('#f3eedc', px + dx - Math.round(11 * k) + 1, py, 3, 4); if ((F >> 4) % 2) R('#fff6dc', px + dx - Math.round(11 * k) + 1, py, 1, 1); }
    }
    // In the shift before three lockers stand open, the street clothes of shift B still inside.
    if (night && no >= 15 && no <= 17) {
      R('#14100a', px + dx + 1, py - 5, 13, T + 2); R('#3a2e1c', px + dx + 4, py - 3, 7, 1);
      R(['#3a4a6a', '#5a3a2a', '#2a3a2a'][no - 15], px + dx + 4, py - 2, 7, 12); R('#1a140a', px + dx + 7, py - 2, 1, 12);
      R('#8d97a4', px + dx - (dx > 1 ? 4 : -13), py - 6, 4, T + 4);
    }
  }
  if (night) R('rgba(16,11,4,.7)', px, py - 10, T, T + 10);
}
// The gowning rack: a steel rail, a hanger, the cleanroom suit with its hood; boot covers and gloves on the shelf.
function gownRack(px, py, taken, glow) {
  R('rgba(0,0,0,.25)', px + 2, py + T, T - 4, 3);
  R('#8d97a4', px + 3, py - 10, 2, T + 10); R('#8d97a4', px + T - 5, py - 10, 2, T + 10); R('#b8c0cb', px + 2, py - 9, T - 4, 2);
  R('#7c8693', px + 15, py - 7, 2, 3);
  ctx.strokeStyle = '#5a6370'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + 9.5, py - 1.5); ctx.lineTo(px + 16, py - 4.5); ctx.lineTo(px + 22.5, py - 1.5); ctx.stroke();
  if (!taken) {
    // An empty suit: the hood hangs over the hanger with its face opening, arms and legs limp, folds in the cloth.
    const c = SUIT.day, sw = Math.round(Math.sin(F / 40));
    R(c.suit, px + 12 + sw, py - 4, 8, 6); R(c.pleat, px + 14 + sw, py - 2, 4, 3); R(c.shade, px + 12 + sw, py + 1, 8, 1);
    R(c.suit, px + 10 + sw, py + 2, 12, 15); R(c.zip, px + 16 + sw, py + 3, 1, 13); R(c.badge, px + 18 + sw, py + 5, 2, 2);
    R(c.pleat, px + 12 + sw, py + 9, 3, 1); R(c.pleat, px + 18 + sw, py + 12, 3, 1);
    R(c.suit, px + 8 + sw, py + 3, 3, 12); R(c.suit, px + 21 + sw, py + 3, 3, 12); R(c.shade, px + 8 + sw, py + 14, 3, 1); R(c.shade, px + 21 + sw, py + 14, 3, 1);
    R(c.suit, px + 11 + sw, py + 17, 4, 6); R(c.suit, px + 17 + sw, py + 17, 4, 6); R(c.shade, px + 10 + sw, py + 16, 12, 1);
    R(c.frame, px + 23, py + 20, 5, 2); R(c.lens, px + 24, py + 20, 1, 1); R(c.lens, px + 26, py + 20, 1, 1);
  }
  R('#a9b1bc', px + 3, py + 25, T - 6, 2);
  if (!taken) { R('#cfe6f5', px + 6, py + 22, 6, 3); R('#cfe6f5', px + 13, py + 22, 6, 3); R(SUIT.day.glove, px + 21, py + 21, 6, 4); }
  if (night) R('rgba(16,11,4,.7)', px, py - 10, T, T + 10);
  // Until the suit is on, the place in front of the rack glows like the next process station.
  if (glow) glowSpot(px, py + T);
}
function glowSpot(px, py) {
  const a = 0.45 + 0.4 * Math.sin(F / 8);
  ctx.strokeStyle = `rgba(127,208,255,${a})`; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
}
function bench(x, y, px, py) {
  floorTile(x, y, px, py);
  R('rgba(0,0,0,.25)', px + 2, py + 22, T - 2, 4);
  R('#c9cfd8', px, py + 10, T, 10); R('#e6eaf0', px, py + 10, T, 2); R('#8d97a4', px + 3, py + 20, 3, 6); R('#8d97a4', px + T - 6, py + 20, 3, 6);
  if (x % 2) { R('#f7f9fc', px + 6, py + 8, 14, 5); R('#d3dae4', px + 6, py + 12, 14, 1); }
  else { R('#e2e8f0', px + 8, py + 9, 6, 4); R('#e2e8f0', px + 16, py + 9, 6, 4); }
  if (night) R('rgba(16,11,4,.7)', px, py + 8, T, 18);
}
function showerFloor(L, x, y, px, py) {
  R('#9aa3ae', px, py, T, T);
  for (let i = 3; i < T; i += 5) R('#6c7581', px + 2, py + i, T - 4, 2);
  if (L.showerT > 0) R(`rgba(200,230,255,${0.1 + 0.05 * Math.sin(F / 2)})`, px, py, T, T);
}
function showerNozzles(L, layer, x, y, px, py) {
  const below = tileAt(L, layer, x, y + 1) === 'A', above = tileAt(L, layer, x, y - 1) === 'A';
  if (!below && !above) return;
  const ny = below ? py + T - 9 : py + 2;
  for (let i = 0; i < 3; i++) { circle('#4a525e', px + 6 + i * 10, ny + 3, 3); circle(L.showerT > 0 ? '#dff2ff' : '#2a3038', px + 6 + i * 10, ny + 3, 1.5); }
}
function door(L, x, y, px, py) {
  const open = L.open && L.open.has(y * C.W + x);
  R('#4a525e', px, py - 8, T, T + 8);
  if (open) { R('#1a1f26', px + 4, py - 4, T - 8, T + 2); R('#b8c0cb', px + T - 6, py - 4, 4, T + 2); }
  else {
    R('#b8c0cb', px + 4, py - 4, T - 8, T + 2); R('rgba(160,205,240,.6)', px + 9, py, T - 18, 10);
    R('#4a525e', px + T - 10, py + 12, 2, 5);
  }
  if (night) R('rgba(16,11,4,.6)', px, py - 8, T, T + 8);
  R(open ? '#3fe06a' : '#ff3a2a', px + 14, py - 7, 4, 3);
}
// Filtered air from the nozzles; particles leave the suit and are sucked to the floor grates.
function showerAir(L) {
  const cells = [];
  for (let i = 0; i < L.layers[0].length; i++) if (L.layers[0][i] === 'A') cells.push(i);
  if (!cells.length) return;
  const x0 = (cells[0] % C.W) * T, x1 = (cells[cells.length - 1] % C.W + 1) * T, y0 = FY + ((cells[0] / C.W) | 0) * T;
  for (let i = 0; i < 70; i++) {
    const ph = (F * 3 + i * 37) % 40, fromTop = i % 2 === 0;
    const x = x0 + 4 + (i * 53 % (x1 - x0 - 8)), yy = fromTop ? y0 - 6 + ph * 0.9 : y0 + T + 6 - ph * 0.9;
    R(i % 5 ? 'rgba(230,245,255,.7)' : '#ffffff', x + Math.sin(F / 3 + i) * 2, yy, 1, i % 3 ? 2 : 3);
  }
  for (let i = 0; i < 18; i++) R('rgba(255,255,255,.9)', x0 + (i * 29 + F * 2) % (x1 - x0), y0 + 8 + (i * 17 + F) % 16, 1, 1);
}
// Plain wall signs from the level: position is the wall tile, the sign hangs on its front.
function wallSigns(L, layer, lang) {
  for (const sg of L.signs || []) {
    const label = typeof sg.text === 'string' ? sg.text : sg.text[lang];
    ctx.font = '400 8px "Silkscreen", monospace';
    const w = ctx.measureText(label).width + 10, px = sg.x * T + 16 - w / 2, py = FY + sg.y * T + 12;
    R(sg.bg || (night ? '#3a2a08' : '#f2c21a'), px, py, w, 12); R('rgba(0,0,0,.25)', px, py + 12, w, 2);
    text(label, px + w / 2, py + 2, {align: 'center', color: sg.color || (night ? '#8a6420' : '#1a1004')});
  }
}

/* ---------- Equipment ---------- */
// Signal tower: the red-amber-green stack light every tool carries.
function signalTower(x, y, state) {
  R(p.darker, x, y - 18, 2, 18);
  const lit = night ? ((F >> 4) % 2 ? 'r' : '') : state;
  [['r', '#ff3a2a', '#5a1a14'], ['y', '#ffc21a', '#5a4a14'], ['g', '#3fe06a', '#1a4a24']].forEach(([k, on, off], i) => {
    R(lit === k ? on : off, x - 2, y - 26 + i * 5, 6, 4);
    if (lit === k && !night) { ctx.fillStyle = on + '55'; ctx.fillRect(x - 4, y - 28 + i * 5, 10, 8); }
  });
  R(p.darker, x - 2, y - 27, 6, 1);
}
function emo(x, y) { circle('#f2c21a', x, y, 3); circle(night ? '#6a1a10' : '#e0281a', x, y, 2); }
function loadPort(x, y, withFoup) {
  R(p.dark, x, y, 14, 10); R(p.darker, x + 1, y + 7, 12, 3);
  if (withFoup) { R(p.foup, x + 1, y - 6, 12, 8); R(p.foupLo, x + 1, y, 12, 2); R(p.dark, x + 4, y - 7, 6, 2); }
}
function tablet(x, y) {
  R(p.darker, x + 4, y + 8, 2, 6);
  R(p.darker, x, y, 11, 9); R(p.screen, x + 1, y + 1, 9, 7);
  if (!night || (F >> 3) % 5) { R(p.ui, x + 2, y + 2, 5, 1); R(p.ui, x + 2, y + 4, 7, 1); R(p.ui, x + 2, y + 6, 3, 1); }
}
function brand(label, x, y, w) {
  text(label, x, y, {size: 8, color: night ? '#8a6a30' : '#26303d', max: w});
}
// Common body: a top face and a front face; returns the front face y.
function body(x, y, w, h, face, col = p.white) {
  R('rgba(0,0,0,.22)', x + 3, y + h, w, 4);
  R(col, x, y, w, h - face); R(night ? '#6a5632' : '#fafbfc', x, y, w, 1);
  R(p.white2, x, y + h - face, w, face); R(p.white3, x, y + h - 2, w, 2);
  O(night ? '#1a1208' : '#9aa4b1', x, y, w, h);
  return y + h - face;
}

// A process chamber seen from above. etch: copper TCP coil on a ceramic window; cvd: showerhead with its gas box;
// pvd: aluminium target with the racetrack the magnetron erodes. A burning plasma glows through.
function chamberLid(kind, cx, cy, r, on, i) {
  circle('rgba(0,0,0,.2)', cx + 2, cy + 3, r);
  circle(p.white2, cx, cy, r); ring(p.white3, cx, cy, r, 2);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.3; R(p.grey, cx + Math.cos(a) * (r - 2) - 1, cy + Math.sin(a) * (r - 2) - 1, 2, 2); }
  const glow = on && !reduced ? 0.55 + 0.25 * Math.sin(F / 3 + i) : on ? 0.6 : 0;
  if (kind === 'pvd') {
    circle(night ? '#4a4030' : '#d9dee5', cx, cy, r * 0.72);
    ring(night ? '#2a2216' : '#9aa3ad', cx, cy, r * 0.45, Math.max(2, r * 0.16));
    if (glow) { ctx.strokeStyle = `rgba(170,120,255,${glow})`; ctx.lineWidth = Math.max(2, r * 0.18); ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, 7); ctx.stroke(); }
    circle(p.grey, cx, cy, Math.max(1.5, r * 0.1));
  } else if (kind === 'cvd') {
    circle(night ? '#3a3020' : '#c6ccd4', cx, cy, r * 0.72);
    for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (xx * xx + yy * yy <= 9) R(glow ? `rgba(255,170,230,${glow})` : p.grey, cx + xx * r * 0.18 - 0.5, cy + yy * r * 0.18 - 0.5, 1, 1);
    R(p.white3, cx - r * 0.25, cy - r * 0.95, r * 0.5, r * 0.3); R(p.grey, cx - 1, cy - r * 1.05, 2, r * 0.3);
    if (glow) { ctx.fillStyle = `rgba(255,140,220,${glow * 0.35})`; ctx.beginPath(); ctx.arc(cx, cy, r * 0.75, 0, 7); ctx.fill(); }
  } else {
    circle(night ? '#4a3e28' : '#ece4d0', cx, cy, r * 0.72);
    if (glow) { ctx.fillStyle = `rgba(190,110,255,${glow * 0.6})`; ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, 7); ctx.fill(); }
    ctx.strokeStyle = night ? '#6a4a20' : '#c07a3a'; ctx.lineWidth = Math.max(1, r * 0.09); ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) { const rr = r * (0.12 + a / (Math.PI * 5) * 0.55); ctx[a ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    ctx.stroke();
    R(p.white3, cx + r * 0.45, cy - r * 1.0, r * 0.55, r * 0.4); R(p.dark, cx + r * 0.55, cy - r * 0.9, r * 0.2, r * 0.2);
  }
}

const TOOLS = {
  // Coater/developer track: white cabinet, blue band, spin cups behind glass, load ports at the left end.
  track(x, y, w, h, t) {
    const fy = body(x, y, w, h, 16);
    R(p.accent, x, fy - 3, w, 3);
    const cups = Math.max(2, Math.floor((w - 40) / 30));
    for (let i = 0; i < cups; i++) {
      const cx = x + 44 + i * ((w - 52) / cups) + 10, cy = y + (h - 16) / 2;
      R(p.white3, cx - 11, cy - 10, 22, 20); R(p.glass, cx - 10, cy - 9, 20, 18);
      circle(p.dark, cx, cy, 8); circle(p.wafer, cx, cy, 6);
      const a = night ? 0.6 : F * 0.35 + i;
      ctx.strokeStyle = night ? '#3a2f1a' : '#f6f9fc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); ctx.stroke();
      if (night && i === 1) { R('#0b0703', cx - 8, cy - 2, 14, 1); R('#0b0703', cx + 2, cy - 6, 1, 10); }
    }
    R(p.white3, x + 4, y + 4, 32, h - 24); for (let i = 0; i < 4; i++) R(p.grey, x + 7, y + 7 + i * 4, 26, 1);
    loadPort(x + 4, fy + 4, true); loadPort(x + 20, fy + 4, false);
    tablet(x + w - 30, fy + 3); emo(x + w - 8, fy + 8);
    brand(t.name || 'KENSEI CT-7', x + 38, fy + 5, w - 74);
    signalTower(x + 3, y + 2, 'g');
  },
  // Immersion scanner: big body, illuminator, reticle unit, projection lens, wafer stage moving under glass.
  scanner(x, y, w, h, t) {
    const fy = body(x, y, w, h, 18);
    R(p.darker, x, fy - 1, w, 4); R(p.dark, x, fy + 12, w, 6);
    R(p.white2, x + 6, y + 5, w * 0.4, (h - 18) * 0.45); O(p.white3, x + 6, y + 5, w * 0.4, (h - 18) * 0.45);
    for (let i = 0; i < 5; i++) R(p.grey, x + 9 + i * 6, y + 8, 3, (h - 18) * 0.45 - 6);
    const lx = x + w * 0.62, ly = y + (h - 18) * 0.38;
    circle(p.white3, lx, ly, 13); circle(p.dark, lx, ly, 10); ring(night ? '#5a4a2a' : '#c9d4e0', lx, ly, 7, 2); circle(night ? '#120c04' : '#1a3a6a', lx, ly, 4);
    const gx = x + 8, gy = y + (h - 18) * 0.62, gw = w - 16, gh = (h - 18) * 0.3;
    R(p.darker, gx, gy, gw, gh); R(p.glass, gx + 1, gy + 1, gw - 2, gh - 2);
    const sx = night ? gx + gw * 0.3 : gx + 4 + (Math.sin(F / 25) * 0.5 + 0.5) * (gw - 20);
    R(p.grey, sx, gy + 2, 12, gh - 4); circle(p.wafer, sx + 6, gy + gh / 2, Math.min(5, gh / 2 - 2));
    R(night ? '#3a2a0a' : '#f2c21a', x + w - 22, fy + 3, 9, 8); R(night ? '#1a1004' : '#1a1a1a', x + w - 18, fy + 5, 1, 4);
    tablet(x + 6, fy + 3);
    brand(t.name || 'LUMENA S193i', x + 22, fy + 4, w - 50);
    signalTower(x + w - 6, y + 2, 'g');
  },
  // Cluster platform: polygonal transfer chamber with a frog-leg robot, process chambers around it, EFEM in front.
  // kind: etch (TCP coil on a ceramic window), cvd (showerhead), pvd (magnetron target with its racetrack).
  cluster(x, y, w, h, t, s) {
    R('rgba(0,0,0,.22)', x + 3, y + h, w, 4);
    const kind = t.kind || 'etch', efem = 22, area = h - efem;
    const n = t.chambers || (w > 150 ? 5 : 4);
    const cr = clamp(Math.min(w * 0.42, area * 0.5) * 0.36, 9, 21);
    const cx = x + w / 2, cy = y + area - Math.max(8, cr * 0.6), ax = w / 2 - cr - 5, ay = Math.max(8, area - cr - 12);
    const tr = clamp(Math.min(ax, ay) * 0.42, 8, 26);
    R(p.white3, x + 4, y + 3, w - 8, area - 2); R(p.white2, x + 5, y + 4, w - 10, area - 4);
    for (let i = 0; i < Math.floor((w - 16) / 8); i++) R(p.grey, x + 9 + i * 8, y + 6, 4, 1);
    const pos = [...Array(n)].map((_, i) => { const a = Math.PI + (i + 0.5) * Math.PI / n; return [cx + Math.cos(a) * ax, cy + Math.sin(a) * ay]; });
    for (const [ox, oy] of pos) {
      const dx = ox - cx, dy = oy - cy, d = Math.hypot(dx, dy), ex = cx + dx / d * tr, ey = cy + dy / d * tr;
      ctx.strokeStyle = p.white3; ctx.lineWidth = Math.max(5, cr * 0.5); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ox - dx / d * cr, oy - dy / d * cr); ctx.stroke();
      ctx.strokeStyle = p.dark; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ex + dx / d * 3, ey + dy / d * 3); ctx.lineTo(ox - dx / d * (cr + 2), oy - dy / d * (cr + 2)); ctx.stroke();
    }
    const on = s ? s.plasmaOn : false;
    pos.forEach(([ox, oy], i) => chamberLid(kind, ox, oy, cr, on && (s.allOn || i % 2 === (F >> 6) % 2 || s.hasPulses), i));
    ctx.fillStyle = p.white2; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * tr, cy + Math.sin(a) * tr); }
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = p.white3; ctx.lineWidth = 2; ctx.stroke();
    circle(p.white, cx, cy, tr * 0.7); ring(p.white3, cx, cy, tr * 0.7, 1);
    // Frog-leg robot: two arms meeting at the end effector that carries a wafer.
    const ra = night ? 1.2 : F / 40, reach = tr * (0.55 + 0.25 * Math.sin(F / 23));
    const hx = cx + Math.cos(ra) * reach, hy = cy + Math.sin(ra) * reach;
    ctx.strokeStyle = p.dark; ctx.lineWidth = 2;
    for (const sg of [-1, 1]) { const ex = cx + Math.cos(ra + sg * 0.9) * tr * 0.38, ey = cy + Math.sin(ra + sg * 0.9) * tr * 0.38; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke(); }
    circle(p.wafer, hx, hy, Math.max(3, tr * 0.22)); circle(p.dark, cx, cy, 2.5);
    const fy = body(x + 2, y + h - efem, w - 4, efem, 14);
    R(p.accent, x + 2, fy - 2, w - 4, 2);
    const ports = clamp(Math.floor((w - 70) / 18), 1, 3);
    for (let i = 0; i < ports; i++) loadPort(x + 8 + i * 18, fy + 2, i !== 1);
    tablet(x + w - 30, fy + 2); emo(x + w - 9, fy + 7);
    brand(t.name || 'VALENTA C-5', x + 12 + ports * 18, fy + 4, w - 48 - ports * 18);
    signalTower(x + w - 8, y + 4, s && s.plasmaSoon ? 'y' : 'g');
  },
  // Single-chamber tool: chamber on a frame, RF generator beside it, a viewport that shows the plasma.
  chamber(x, y, w, h, t, s) {
    const fy = body(x, y, w, h, 16);
    const on = s && s.plasmaOn, cr = Math.min(w * 0.3, (h - 16) * 0.42);
    const cx = x + w * 0.42, cy = y + (h - 16) / 2 + 1;
    R(p.white3, x + w - 16, y + 4, 12, h - 26); R(p.grey, x + w - 14, y + 6, 8, 3); R(p.grey, x + w - 14, y + 11, 8, 1); R(p.grey, x + w - 14, y + 13, 8, 1);
    ctx.strokeStyle = p.grey; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w - 16, y + 10); ctx.lineTo(cx + cr * 0.7, cy - cr * 0.5); ctx.stroke();
    chamberLid(t.kind || 'etch', cx, cy, cr, on, 0);
    const vx = x + 14, vy = fy + 8;
    circle(p.white3, vx, vy, 5); circle(on ? '#d79cff' : p.darker, vx, vy, 3.5);
    if (on) { ctx.fillStyle = 'rgba(200,120,255,.35)'; ctx.beginPath(); ctx.arc(vx, vy, 8, 0, 7); ctx.fill(); }
    brand(t.name || 'VALENTA E-1', x + 22, fy + 4, w - 34);
    emo(x + w - 8, fy + 8);
    signalTower(x + 4, y + 4, s && s.plasmaSoon ? 'y' : on && s.hasPulses ? 'r' : 'g');
  },
  // Vertical furnaces in a bank: tall cabinets, exhaust on top, quartz boat behind a window, temperature display.
  furnace(x, y, w, h, t, s) {
    const n = t.n || Math.max(1, Math.round(w / 62)), cw = Math.floor((w - (n - 1) * 3) / n);
    for (let k = 0; k < n; k++) {
      const bx0 = x + k * (cw + 3), fy = body(bx0, y, cw, h, Math.min(30, Math.round(h * 0.45)));
      R(p.accent, bx0, fy + 2, cw, 2);
      circle(p.white3, bx0 + 9, y + 9, 6); circle(p.grey, bx0 + 9, y + 9, 3); circle(p.darker, bx0 + 9, y + 9, 1.5);
      R(p.white3, bx0 + 18, y + 4, cw - 22, 10); for (let i = 0; i < 3; i++) R(p.grey, bx0 + 20, y + 6 + i * 3, cw - 26, 1);
      R(p.white3, bx0 + 4, y + 18, cw - 8, fy - y - 22); R(p.grey, bx0 + 6, y + 20, cw - 12, 1);
      const hot = t.hot ? t.hot(s, k) : 0, glow = night ? 0 : 0.35 + 0.15 * Math.sin(F / 30 + k * 2);
      const wx = bx0 + 5, wy = fy + 6, ww = 15;
      R(p.darker, wx - 1, wy - 1, ww + 2, 18);
      R(hot > 0.3 ? `rgba(255,${Math.round(120 + 80 * (1 - hot))},40,${0.5 + hot * 0.5})` : `rgba(255,150,60,${glow})`, wx, wy, ww, 16);
      if (night) R(p.glass, wx, wy, ww, 16);
      for (let i = 0; i < 7; i++) R(hot > 0.3 || !night ? '#ffe6b0' : p.wafer, wx + 2, wy + 2 + i * 2, ww - 4, 1);
      R(p.white3, wx + ww / 2 - 1, wy + 1, 2, 14);
      const dx = bx0 + 24;
      R(p.darker, dx, fy + 6, cw - 34, 9);
      if (!night || (F >> 3) % 7) text(night ? '----' : (t.temps && t.temps[k]) || t.temp || '1000°C', dx + (cw - 34) / 2, fy + 7, {align: 'center', size: 8, color: night ? '#5a3a10' : '#ff6a3a', max: cw - 36});
      if (k === 0) brand(t.name || 'FORNO V-3', dx, fy + 17, cw - 30);
      emo(bx0 + cw - 7, fy + 10);
      signalTower(bx0 + cw - 5, y + 4, hot > 0.3 ? 'y' : 'g');
    }
  },
  // Horizontal diffusion furnaces: a long bank, one quartz tube per mouth; an open door glows with the boat inside.
  tubes(x, y, w, h, t, s) {
    const fy = body(x, y, w, h, Math.round(h * 0.5));
    R(p.accent, x, fy, w, 2);
    R(p.white2, x + 3, y + 2, 66, fy - y - 4);
    for (let i = 0; i < Math.floor((w - 78) / 6); i++) R(p.white3, x + 74 + i * 6, y + 3, 3, fy - y - 6);
    const mouths = t.mouths || [];
    mouths.forEach(m => {
      const mx = m.px, my = fy + (h - (fy - y)) / 2 + 1, hot = m.hot;
      R(p.darker, mx - 9, fy + 2, 18, h - (fy - y) - 3);
      circle(p.white3, mx, my, 6);
      circle(hot > 0.3 ? `rgb(255,${Math.round(150 + 90 * hot)},${Math.round(60 + 120 * hot)})` : p.dark, mx, my, 4.5);
      if (hot > 0.3) {
        R('#fff6d8', mx - 3, my - 1, 6, 1); R('#fff6d8', mx - 3, my + 1, 6, 1);
        ctx.fillStyle = `rgba(255,170,60,${0.25 * hot})`; ctx.beginPath(); ctx.arc(mx, my, 14, 0, 7); ctx.fill();
      }
      R(hot > 0.3 ? '#ffc21a' : '#3fe06a', mx + 6, fy + 3, 2, 2);
    });
    for (let i = 0; i + 1 < mouths.length; i++) {
      const dx = (mouths[i].px + mouths[i + 1].px) / 2 - 10;
      R(p.darker, dx, fy + 3, 20, 8);
      if (!night || (F >> 3) % 5) text(night ? '--' : '1000', dx + 10, fy + 3, {align: 'center', size: 8, color: night ? '#5a3a10' : '#ff6a3a', max: 19});
    }
    brand(t.name || 'FORNO H-12', x + 6, y + 3, 62);
  },
  // Wet bench: open baths with chemistry labels, exhaust slots along the back, a robot gantry over the baths.
  wetbench(x, y, w, h, t) {
    const fy = body(x, y, w, h, 14);
    for (let i = 0; i < Math.floor(w / 6); i++) R(p.grey, x + 3 + i * 6, y + 3, 3, 2);
    const baths = t.baths || ['HF', 'SC-1', 'SC-2', 'SPM', 'QDR'], n = Math.min(baths.length, Math.floor((w - 8) / 24));
    const tint = {HF: '#cfe6f5', 'SC-1': '#d8f0e0', 'SC-2': '#e6f0d8', SPM: '#f3e6c8', QDR: '#d8e8f8', DIW: '#d8e8f8', HOT: '#f3dcc8', DRY: '#e6e9ee'};
    const bw = Math.floor((w - 12) / n);
    for (let i = 0; i < n; i++) {
      const bx = x + 6 + i * bw, by = y + 9;
      R(p.white3, bx, by, bw - 4, h - 39); R(night ? '#1a2a1a' : tint[baths[i]] || '#d8e8f8', bx + 2, by + 2, bw - 8, h - 43);
      if (!night) { R('rgba(255,255,255,.6)', bx + 4 + (F >> 3) % Math.max(1, bw - 14), by + 4, 3, 1); if (baths[i] === 'SPM' || baths[i] === 'HOT') R('rgba(255,255,255,.5)', bx + 6 + (F >> 2) % 9, by + 8 + (F >> 3) % 5, 1, 1); }
      const hazard = ['HF', 'SPM', 'HOT'].includes(baths[i]);
      R(hazard ? '#e0281a' : '#f2c21a', bx + 2, fy + 3, bw - 8, 8);
      text(baths[i], bx + bw / 2 - 2, fy + 3, {align: 'center', size: 8, color: hazard ? '#fff' : '#1a1004', max: bw - 10});
    }
    const gx = night ? x + 6 + bw : x + 6 + ((Math.sin(F / 60) * 0.5 + 0.5) * (w - 12 - bw));
    R(p.dark, x + 4, y + 7, w - 8, 2); R(p.grey, gx, y + 5, bw - 4, 5); R(p.wafer, gx + 4, y + 10, bw - 12, 3);
    brand(t.name || 'PURA W-6', x + 6, fy - 10, 70);
    emo(x + w - 8, fy + 7);
    signalTower(x + 3, y + 2, 'g');
  },
  // Implanter, two parts. source: high-voltage terminal behind a fence, the arc chamber glowing.
  // end: the end station with its spinning batch disc of wafers, as in high-current implanters.
  implanter(x, y, w, h, t) {
    if (t.part === 'source') {
      const fy = body(x, y, w, h, 18, p.white2);
      R(p.darker, x + 3, y + 3, w - 6, fy - y - 6);
      for (let i = 0; i < w - 6; i += 4) R(night ? '#3a2a10' : '#8a94a2', x + 3 + i, y + 3, 1, fy - y - 6);
      for (let i = 0; i < fy - y - 6; i += 4) R(night ? '#3a2a10' : '#8a94a2', x + 3, y + 3 + i, w - 6, 1);
      const a = night ? 0.25 : 0.6 + 0.4 * Math.sin(F / 4);
      circle(p.white3, x + w / 2, y + (fy - y) / 2, 6); circle(`rgba(255,140,40,${a})`, x + w / 2, y + (fy - y) / 2, 4);
      for (let i = 0; i < w; i += 6) R(i % 12 ? '#1a1a1a' : '#f2c21a', x + i, fy + 2, Math.min(6, w - i), 3);
      text('HV', x + w / 2, fy + 7, {align: 'center', size: 8, color: night ? '#8a6a30' : '#e0281a'});
      R(p.darker, x + w - 3, y + h - 12, 4, 7);
      signalTower(x + 4, y + 4, 'y');
      return;
    }
    const fy = body(x, y, w, h, 16);
    const dr = Math.min((fy - y) * 0.48, w * 0.22), dx = x + w * 0.62, dy = y + (fy - y) / 2 + 1;
    circle(p.white3, dx, dy, dr + 3); circle(p.dark, dx, dy, dr);
    const rot = night ? 0.3 : F / 9, k = Math.max(8, Math.floor(dr * 0.75));
    for (let i = 0; i < k; i++) { const a = rot + i * Math.PI * 2 / k; circle(p.wafer, dx + Math.cos(a) * dr * 0.72, dy + Math.sin(a) * dr * 0.72, Math.max(2, dr * 0.17)); }
    circle(p.white2, dx, dy, dr * 0.32); circle(p.grey, dx, dy, dr * 0.12);
    R(p.white3, x + 4, dy - 4, dx - dr - x - 6, 8); R(p.darker, x + 4, dy - 1, dx - dr - x - 6, 2);
    for (let i = 0; i < 2; i++) loadPort(x + 6 + i * 18, fy + 2, i === 0);
    for (let i = 0; i < w - 50; i += 6) R(i % 12 ? '#1a1a1a' : '#f2c21a', x + 44 + i, fy + 2, 6, 2);
    brand(t.name || 'AURIGA HC-3', x + 44, fy + 6, w - 70);
    tablet(x + w - 24, fy + 3);
    signalTower(x + w - 5, y + 4, 'g');
  },
  // Metrology: a measuring head on top, the monitor shows what it measures.
  // screen: lines (CD-SEM), particles (wafer map), thickness (ellipsometer), rs (four-point probe).
  metrology(x, y, w, h, t) {
    const fy = body(x, y, w, h, 16);
    const cx = x + w * 0.66, cy = y + (h - 16) / 2;
    circle(p.white3, cx, cy, 11); ring(p.grey, cx, cy, 8, 2); circle(p.dark, cx, cy, 4); circle(night ? '#3a2a0a' : '#7fd0ff', cx, cy, 1.5);
    const mx = x + 5, my = y + 4, mw = Math.min(30, w * 0.45), mh = Math.min(22, fy - y - 8);
    R(p.darker, mx, my, mw, mh); R(night ? '#120c04' : '#101820', mx + 1, my + 1, mw - 2, mh - 2);
    const scr = t.screen || 'lines', ink = night ? '#3a2f1a' : '#9aa3ad', hi = night ? '#5a3a10' : '#7fd0ff';
    if (scr === 'lines') {
      for (let i = 0; i < 5; i++) R(ink, mx + 3 + i * ((mw - 6) / 5), my + 2, 2, mh - 9);
      if (!night) text('40.2nm', mx + mw / 2, my + mh - 8, {align: 'center', size: 8, color: hi, max: mw - 2});
    } else if (scr === 'particles') {
      const r = Math.min(mw, mh) / 2 - 2; circle(night ? '#2a1e0a' : '#2a3a50', mx + mw / 2, my + mh / 2, r);
      for (let i = 0; i < 9; i++) { const a = hash(i * 3.1) * 7, d = Math.sqrt(hash(i * 7.7)) * (r - 1); R(i < 2 && !night ? '#ff5a3a' : hi, mx + mw / 2 + Math.cos(a) * d, my + mh / 2 + Math.sin(a) * d, 1, 1); }
    } else if (scr === 'thickness') {
      for (let i = 0; i < mw - 6; i++) R(hi, mx + 3 + i, my + mh - 6 - Math.round((mh - 12) * (0.5 + 0.4 * Math.sin(i / 3))), 1, 1);
      if (!night) text('50.1nm', mx + mw / 2, my + 1, {align: 'center', size: 8, color: '#e9eef5', max: mw - 2});
    } else if (scr === 'tw') {
      for (let i = 0; i < mw - 6; i++) R(hi, mx + 3 + i, my + mh / 2 - Math.round(Math.sin(i / 2 + F / 6) * (mh / 2 - 4) * Math.exp(-i / 30)), 1, 1);
      if (!night) text('TW 812', mx + mw / 2, my + 1, {align: 'center', size: 8, color: '#e9eef5', max: mw - 2});
    } else {
      for (let i = 0; i < 4; i++) R(ink, mx + 4 + i * ((mw - 8) / 4), my + 3, 1, 6);
      if (!night) text(t.value || '52Ω/□', mx + mw / 2, my + mh - 9, {align: 'center', size: 8, color: hi, max: mw - 2});
    }
    loadPort(x + w - 20, fy + 3, true);
    brand(t.name || 'ORSA CD-9', x + 6, fy + 5, w - 30);
    signalTower(x + w - 5, y + 4, 'g');
  },
  // Gas cabinet: steel cabinet with an exhaust on top, cylinders behind the door window, the gas on a hazard label.
  gascab(x, y, w, h, t) {
    const fy = body(x, y, w, h, Math.min(26, Math.round(h * 0.42)), p.white2);
    R(p.grey, x + w / 2 - 6, y + 3, 12, 8); R(p.darker, x + w / 2 - 4, y + 5, 8, 4);
    for (let i = 0; i < 3; i++) R(p.white3, x + 3, y + 15 + i * 4, w - 6, 2);
    R(p.darker, x + 3, fy + 3, w - 6, h - (fy - y) - 8); R(p.glass, x + 4, fy + 4, w - 8, h - (fy - y) - 10);
    const cyl = Math.max(1, Math.floor((w - 8) / 9));
    for (let i = 0; i < cyl; i++) { const cx0 = x + 6 + i * 9; R(night ? '#3a2a14' : ['#8a5a3a', '#6a7a8a', '#9a9a5a'][i % 3], cx0, fy + 6, 6, h - (fy - y) - 13); R(p.white3, cx0 + 1, fy + 5, 4, 2); }
    const lx = x + w / 2, ly = y + 25;
    R(night ? '#4a1a0a' : '#e0281a', lx - 12, ly - 1, 24, 10);
    text(t.gas || 'SiH₄', lx, ly, {align: 'center', size: 8, color: night ? '#8a5a2a' : '#ffffff', max: 22});
    signalTower(x + w - 4, y + 4, night ? 'r' : 'g');
  },
  // Stocker: tall storage with FOUP shelves behind glass.
  stocker(x, y, w, h, t) {
    const fy = body(x, y, w, h, 26);
    for (let r = 0; r < 3; r++) for (let c = 0; c < Math.floor((w - 6) / 10); c++) {
      R(p.darker, x + 4 + c * 10, fy + 3 + r * 7, 9, 6);
      if (hash(c * 7 + r * 3 + (night ? 5 : 0)) > 0.35) R(p.foup, x + 5 + c * 10, fy + 4 + r * 7, 7, 4);
    }
    R(p.glass, x + 3, fy + 2, w - 6, 22);
    for (let i = 0; i < 4; i++) R(p.grey, x + 6, y + 6 + i * 4, w - 12, 1);
    signalTower(x + w - 5, y + 2, 'g');
  },
  generic(x, y, w, h, t) {
    const fy = body(x, y, w, h, 14);
    R(p.accent, x, fy, w, 2);
    for (let i = 0; i < 3; i++) R(p.grey, x + 5, y + 5 + i * 4, w - 10, 1);
    if (w >= 48) tablet(x + w - 18, fy + 2);
    emo(x + 7, fy + 7);
    signalTower(x + w - 5, y + 2, 'g');
  },
};

// Connected machine rectangles in a layer, matched to the level's tool list.
function toolBlocks(L, layer) {
  const key = `tb${layer}`;
  if (L[key]) return L[key];
  const map = L.layers[layer], seen = new Set(), out = [];
  for (let i = 0; i < map.length; i++) {
    if (map[i] !== 'M' || seen.has(i)) continue;
    let x0 = i % C.W, y0 = (i / C.W) | 0, x1 = x0, y1 = y0;
    while (x1 + 1 < C.W && map[y0 * C.W + x1 + 1] === 'M') x1++;
    while (y1 + 1 < C.H && map[(y1 + 1) * C.W + x0] === 'M') y1++;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) seen.add(y * C.W + x);
    const def = (L.tools || []).find(t => t.x0 === x0 && t.y0 === y0) || {type: 'generic'};
    out.push({x0, y0, x1, y1, ...def});
  }
  return (L[key] = out);
}

/* ---------- Stations, airlock, rail ---------- */
function stations(L, layer, s, lang) {
  // The next station lies in the other shift: its place shows as a dashed outline, so you know where to shift.
  const nx = L.stations[s.got];
  if (nx && nx.layer !== layer && !L.intro) {
    const px = nx.x * T, py = FY + nx.y * T, a = 0.45 + 0.25 * Math.sin(F / 10);
    ctx.setLineDash([3, 3]); ctx.lineWidth = 2; ctx.strokeStyle = nx.layer ? `rgba(255,180,58,${a})` : `rgba(127,208,255,${a})`;
    ctx.strokeRect(px + 2.5, py + 2.5, T - 5, T - 5); ctx.setLineDash([]);
    const def = L.route && L.route[s.got], other = lang === 'de' ? (nx.layer ? 'IN DER VORSCHICHT' : 'IN DEINER SCHICHT') : (nx.layer ? 'IN THE SHIFT BEFORE' : 'IN YOUR SHIFT');
    const label = `${s.got + 1} · ${def ? def[lang].toUpperCase() : ''} · ${other}`;
    ctx.font = '400 8px "Silkscreen", monospace';
    const lw = ctx.measureText(label).width + 8, ly = py - 14 < FY ? py + 34 : py - 14;
    const lx = clamp(px + 16, lw / 2 + 2, WW - lw / 2 - 2);
    R('rgba(10,12,18,.75)', lx - lw / 2, ly, lw, 11);
    text(label, lx, ly + 1, {align: 'center', color: nx.layer ? '#ffcf5a' : '#9fe0ff'});
  }
  L.stations.forEach((st, n) => {
    if (st.layer !== layer) return;
    const px = st.x * T, py = FY + st.y * T, done = s.got > n, next = s.got === n;
    if (L.intro) handoverCart(px, py, done);
    else {
    // An empty load port: the lot is in your hands. Three kinematic pins wait for the FOUP; the LED shows the state.
    R('rgba(0,0,0,.25)', px + 6, py + 26, 22, 4);
    R(p.dark, px + 5, py + 12, 22, 16); R(p.darker, px + 5, py + 24, 22, 4); R(p.grey, px + 6, py + 13, 20, 1);
    for (const kx of [9, 15, 21]) R(night ? '#4a3d24' : '#b3bbc6', px + kx, py + 16 + (kx === 15 ? 3 : 0), 2, 2);
    const led = done ? '#3fe06a' : next ? ((F >> 4) % 2 ? (night ? '#ffcf5a' : '#7fd0ff') : p.darker) : night ? '#3a1408' : '#5a2a20';
    R(led, px + 23, py + 25, 2, 2);
    text(done ? 'OK' : `${n + 1}`, px + 9, py + 23, {size: 8, color: done ? '#3fe06a' : night ? '#8a6a30' : '#9aa6b5', max: 12});
    }
    if (next) {
      const a = 0.5 + 0.5 * Math.sin(F / 8);
      ctx.strokeStyle = night ? `rgba(255,207,90,${a})` : `rgba(127,208,255,${a})`; ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
      const def = L.route && L.route[n];
      const label = def ? `${n + 1} · ${def[lang].toUpperCase()}` : `${n + 1}`;
      ctx.font = '400 8px "Silkscreen", monospace';
      // Below the port when a tool or wall stands right behind it, so the label never covers the tool.
      const blocked = ['M', '#'].includes(tileAt(L, layer, st.x, st.y - 1));
      const lw = ctx.measureText(label).width + 8, side = blocked && st.y >= C.H - 2;
      const bob = Math.round(Math.sin(F / 12) * 2), ly = (side ? py + 10 : blocked ? py + 34 : py - 14) + bob;
      const lx = side ? (st.x < C.W / 2 ? px + 34 + lw / 2 : px - 2 - lw / 2) : px + 16;
      R(night ? 'rgba(30,20,6,.92)' : 'rgba(10,16,26,.88)', lx - lw / 2, ly, lw, 11);
      R(night ? '#ffcf5a' : '#7fd0ff', lx - lw / 2, ly + 10, lw, 1);
      text(label, lx, ly + 1, {align: 'center', color: night ? '#ffcf5a' : '#e9eef5'});
    }
  });
}

// The handover cart in Bay 7 of the intro: lot 4471 where shift B left it, its red HOT LOT tag on the FOUP.
function handoverCart(px, py, taken) {
  R('rgba(0,0,0,.25)', px + 3, py + 27, 26, 3);
  R('#6a7380', px + 4, py + 17, 1, 10); R('#6a7380', px + 27, py + 17, 1, 10);
  R('#a9b1bc', px + 3, py + 16, 26, 2); R('#7c8693', px + 3, py + 18, 26, 1); R('#8a939f', px + 4, py + 24, 24, 2);
  R('#2a2e36', px + 4, py + 27, 3, 2); R('#2a2e36', px + 25, py + 27, 3, 2);
  R('#5a6370', px + 28, py + 10, 1, 7); R('#7c8693', px + 27, py + 9, 3, 1);
  // The traveller: a sheet in a sleeve on the push handle.
  R('#e9e4d6', px + 23, py + 19, 4, 5); R('#9aa6b5', px + 24, py + 20, 2, 1); R('#9aa6b5', px + 24, py + 22, 2, 1);
  if (taken) return;
  const fx = px + 8, fy = py + 3;
  R('rgba(0,0,0,.2)', fx + 1, fy + 12, 14, 1);
  R('#d9dde3', fx, fy, 14, 12); R('#a9b1bc', fx, fy + 10, 14, 2); R('#eef1f4', fx + 1, fy + 1, 12, 1);
  R('#5a6370', fx + 4, fy - 2, 6, 2); R('#e8732a', fx + 2, fy + 4, 10, 2);
  text('4471', fx + 7, fy + 6, {align: 'center', size: 8, color: '#2a2e36', max: 13});
  const sw = (F >> 4) % 2;
  R('#d8262a', fx + 12 + sw, fy + 2, 4, 6); R('#ffffff', fx + 13 + sw, fy + 4, 2, 1);
}

function airlock(L, layer, s) {
  const open = s.got === L.stations.length;
  for (const e of L.exits) {
    if (e.layer !== layer) continue;
    const px = e.x * T, py = FY + e.y * T;
    R(p.darker, px, py, T, T);
    const gap = open ? 10 : 0;
    R(p.white2, px + 2, py + 2, 14 - gap, T - 4); R(p.white2, px + 16 + gap, py + 2, 14 - gap, T - 4);
    R(p.glass, px + 4, py + 6, 10 - gap, 12); R(p.glass, px + 18 + gap, py + 6, 10 - gap, 12);
    R(open ? '#3fe06a' : '#ff3a2a', px + 14, py + 1, 4, 3);
    if (open && (F >> 4) % 2) { ctx.strokeStyle = '#3fe06a'; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2); }
    if (tileAt(L, layer, e.x, e.y - 1) === '#') {
      R(night ? '#1f3a12' : '#139a4a', px - 6, py - 22, 44, 12);
      text('USCITA', px + 16, py - 20, {align: 'center', color: night ? '#6a8a40' : '#eaffef', max: 40});
    }
  }
}

// Overhead hoist transport: a rail above the widest aisle, carriers gliding with their shadows below.
function rail(L, layer) {
  if (L.intro) return;
  if (L.railRow === undefined) {
    let best = -1, len = 0;
    for (let y = 1; y < C.H - 1; y++) { let run = 0; for (let x = 1; x < C.W - 1; x++) { run = L.layers[0][y * C.W + x] !== '#' ? run + 1 : 0; if (run > len) { len = run; best = y; } } }
    L.railRow = best;
  }
  if (L.railRow < 0) return;
  const ry = FY + L.railRow * T + 4;
  R('rgba(0,0,0,.12)', T, ry + 14, WW - 2 * T, 3);
  R(night ? '#1a140a' : '#5a6370', T, ry, WW - 2 * T, 3);
  for (let k = 0; k < 2; k++) {
    const cx = night ? T + 120 + k * 250 : T + ((F * 0.9 + k * 280) % (WW - 3 * T));
    const sw = night ? Math.sin(F / 40 + k) * 2 : 0;
    R('rgba(0,0,0,.18)', cx + 2, ry + 16, 18, 4);
    R(p.dark, cx + 7 + sw, ry + 2, 4, 4);
    R(p.foup, cx + sw, ry + 5, 18, 10); R(p.foupLo, cx + sw, ry + 13, 18, 2);
  }
}

/* ---------- People ---------- */
// Cleanroom bunny suit: hood with only goggles and face mask showing, zipper, badge, nitrile gloves,
// knee-high boot covers. walk: 0-3. pal swaps the colours for the shift before and for the previous shift.
const SUIT = {
  day: {suit: '#f7f9fc', shade: '#d3dae4', dark: '#aab4c2', frame: '#2a3240', lens: '#4a8fd8', hi: '#bfe3ff', mask: '#e6edf6', pleat: '#c3ccd8',
    zip: '#b8c2d0', badge: '#2c6fb5', glove: '#8a5cd6', gloveLo: '#6a40b0', boot: '#e2e8f0', sole: '#7c8693', skin: '#e2b896'},
  night: {suit: '#e3cf9a', shade: '#b39c62', dark: '#8a7444', frame: '#2a1e0a', lens: '#ffcf5a', hi: '#fff0c0', mask: '#d8c290', pleat: '#a88e58',
    zip: '#9c8452', badge: '#7a5414', glove: '#7a5a8a', gloveLo: '#5a3a6a', boot: '#cdb888', sole: '#4a3a1c', skin: '#c89a6a'},
  // Set by the light, like exposed resist: pale, violet, without eyes.
  set: {suit: '#b9b2c8', shade: '#9a92ae', dark: '#6e6684', frame: '#2a2438', lens: '#2a2438', hi: '#2a2438', mask: '#aaa2bc', pleat: '#8a829e',
    zip: '#8a829e', badge: '#5a4a7a', glove: '#6a5a8a', gloveLo: '#4a3a6a', boot: '#a8a0b8', sole: '#4a4458', skin: '#7a7090'},
  them: {suit: '#8f8466', shade: '#6d6448', dark: '#4e4632', frame: '#050402', lens: '#050402', hi: '#050402', mask: '#7a7258', pleat: '#5e5640',
    zip: '#5e5640', badge: '#3a2a10', glove: '#4a3a4a', gloveLo: '#2a1a2a', boot: '#6a6248', sole: '#2a2418', skin: '#5a4a34'},
};
function bunny(px, py, face, walk, c, o = {}) {
  const sw = walk ? [0, 1, 0, -1][walk] : 0, tall = o.tall || 0, arm = o.longArms ? 4 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 30, 9, 3, 0, 0, 7); ctx.fill();
  const y = py - tall;
  const side = face === 'left' || face === 'right', dir = face === 'left' ? -1 : 1;
  // legs and boot covers
  const lA = Math.max(0, sw), lB = Math.max(0, -sw);
  if (side) {
    R(c.suit, px + 13, y + 22 + tall, 6, 4); R(c.boot, px + 13 + sw, y + 26 + tall - lA, 5, 4); R(c.boot, px + 14 - sw, y + 26 + tall - lB, 5, 4);
    R(c.sole, px + 13 + sw, y + 29 + tall, 5, 1); R(c.sole, px + 14 - sw, y + 29 + tall, 5, 1);
  } else {
    R(c.suit, px + 11, y + 22, 4, 4 + tall); R(c.suit, px + 17, y + 22, 4, 4 + tall);
    R(c.boot, px + 11, y + 25 + tall - lA, 4, 5); R(c.boot, px + 17, y + 25 + tall - lB, 4, 5);
    R(c.shade, px + 11, y + 25 + tall - lA, 4, 1); R(c.shade, px + 17, y + 25 + tall - lB, 4, 1);
    R(c.sole, px + 11, y + 29 + tall, 4, 1); R(c.sole, px + 17, y + 29 + tall, 4, 1);
  }
  // body
  const bx = side ? 11 : 9, bw = side ? 10 : 14;
  R(c.suit, px + bx, y + 11, bw, 12); R(c.shade, px + bx, y + 21, bw, 2);
  R(c.shade, px + bx, y + 11, 1, 11); R(c.dark, px + bx + bw - 1, y + 12, 1, 10);
  if (!side && face === 'down') {
    R(c.zip, px + 16, y + 11, 1, 11); R(c.badge, px + 18, y + 13, 3, 2); R('#ffffff', px + 18, y + 13, 3, 1);
    R(c.shade, px + 12, y + 15, 1, 5); R(c.shade, px + 20, y + 16, 1, 5);
  } else if (face === 'up') { R(c.shade, px + 16, y + 12, 1, 10); R(c.dark, px + 11, y + 13, 10, 1); }
  // arms with gloves
  if (side) {
    R(c.suit, px + 15 - dir, y + 12, 3, 9 + arm); R(c.shade, px + 15 - dir, y + 12, 1, 9 + arm);
    R(c.glove, px + 15 - dir + sw, y + 20 + arm, 3, 3); R(c.gloveLo, px + 15 - dir + sw, y + 22 + arm, 3, 1);
  } else {
    R(c.suit, px + 6, y + 12 + sw, 3, 9 + arm); R(c.suit, px + 23, y + 12 - sw, 3, 9 + arm);
    R(c.shade, px + 6, y + 12 + sw, 1, 9 + arm); R(c.dark, px + 25, y + 12 - sw, 1, 9 + arm);
    R(c.glove, px + 6, y + 20 + sw + arm, 3, 3); R(c.glove, px + 23, y + 20 - sw + arm, 3, 3);
    R(c.gloveLo, px + 6, y + 22 + sw + arm, 3, 1); R(c.gloveLo, px + 23, y + 22 - sw + arm, 3, 1);
  }
  // hood
  const hx = side ? 11 : 10, hw = side ? 11 : 12;
  R(c.suit, px + hx + 1, y, hw - 2, 1); R(c.suit, px + hx, y + 1, hw, 10); R(c.shade, px + hx, y + 9, hw, 2);
  R(c.shade, px + hx, y + 2, 1, 7); R(c.dark, px + hx + hw - 1, y + 2, 1, 8);
  if (face === 'down') {
    R(c.skin, px + 12, y + 3, 8, 3);
    R(c.frame, px + 12, y + 3, 8, 3); R(c.lens, px + 13, y + 4, 2, 1); R(c.lens, px + 17, y + 4, 2, 1);
    R(c.hi, px + 13, y + 4, 1, 1); R(c.hi, px + 17, y + 4, 1, 1);
    R(c.mask, px + 12, y + 6, 8, 4); R(c.pleat, px + 13, y + 7, 6, 1); R(c.pleat, px + 13, y + 9, 6, 1);
    R(c.shade, px + 16, y, 1, 2);
  } else if (side) {
    const fx = dir > 0 ? px + 16 : px + 11;
    R(c.skin, fx, y + 3, 5, 3); R(c.frame, fx, y + 3, 5, 3); R(c.lens, fx + (dir > 0 ? 2 : 1), y + 4, 2, 1); R(c.hi, fx + (dir > 0 ? 3 : 1), y + 4, 1, 1);
    R(c.mask, fx + (dir > 0 ? 1 : -1), y + 6, 5, 4); R(c.pleat, fx + (dir > 0 ? 2 : 0), y + 8, 3, 1);
  } else { R(c.shade, px + 16, y + 1, 1, 9); R(c.dark, px + 12, y + 8, 8, 1); }
  if (o.eyes) { R('#ffb43a', px + (side ? (dir > 0 ? 18 : 13) : 13), y + 4, 2, 1); if (!side) R('#ffb43a', px + 17, y + 4, 2, 1); }
  // Lot 4471 in its FOUP, carried in both hands: in front when facing you, at the side when walking sideways.
  if (o.carry && face !== 'up') {
    const fx = face === 'down' ? px + 10 : dir > 0 ? px + 17 : px + 5, fy = y + 14;
    R(c.dark, fx, fy + 1, 12, 8); R(o.night ? '#6a5a3a' : '#d9dde3', fx, fy, 12, 7); R(o.night ? '#4a3d24' : '#a9b1bc', fx, fy + 6, 12, 1);
    R(o.night ? '#9a6c1e' : '#e8732a', fx + 2, fy + 2, 8, 2); R(o.night ? '#2a1e0a' : '#5a6370', fx + 4, fy - 1, 4, 1);
    // The red tag of the hot lot, swinging a little.
    const sw = (F >> 4) % 2;
    R(o.night ? '#8a2018' : '#d8262a', fx + (face === 'left' ? -2 : 11) + sw, fy + 3, 3, 4); R(o.night ? '#c9a59a' : '#ffffff', fx + (face === 'left' ? -1 : 12) + sw, fy + 4, 1, 1);
  }
}

// Street clothes before gowning: dark jacket, jeans, a bag over the shoulder.
function civilian(px, py, face, walk, light) {
  const sw = walk ? [0, 1, 0, -1][walk] : 0;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 30, 8, 3, 0, 0, 7); ctx.fill();
  R('#3a5a8a', px + 11, py + 21, 4, 8 - Math.max(0, sw)); R('#3a5a8a', px + 17, py + 21, 4, 8 - Math.max(0, -sw));
  R('#1a1e24', px + 11, py + 28, 4, 2); R('#1a1e24', px + 17, py + 28, 4, 2);
  // Jacket and bag; once they are in the locker, a grey jumper.
  const top = light ? '#7a8594' : '#24324e';
  R(top, px + 9, py + 10, 14, 12); R(light ? '#6a7584' : '#1a2438', px + 15, py + 10, 1, light ? 2 : 12); R(light ? '#8a96a6' : '#2e4064', px + 9, py + 10, 14, 1);
  R(top, px + 6, py + 11 + sw, 3, 9); R(top, px + 23, py + 11 - sw, 3, 9);
  R('#e2b896', px + 6, py + 20 + sw, 3, 2); R('#e2b896', px + 23, py + 20 - sw, 3, 2);
  if (!light) { R('#5a3a1a', px + 21, py + 11, 2, 10); R('#6a4a2a', px + 20, py + 18, 6, 5); }
  R('#e2b896', px + 11, py + 2, 10, 9); R('#5a3a1a', px + 11, py + 1, 10, 3); R('#5a3a1a', px + 10, py + 2, 2, 5); R('#5a3a1a', px + 20, py + 2, 2, 4);
  if (face === 'down') { R('#2a1a0a', px + 13, py + 5, 1, 1); R('#2a1a0a', px + 18, py + 5, 1, 1); R('#c0907a', px + 15, py + 8, 2, 1); }
  if (face === 'up') R('#5a3a1a', px + 11, py + 2, 10, 8);
}

/* ---------- Hazards ---------- */
function beams(L, s) {
  const off = C.hazardStopped(s, 'beam');
  for (const b of L.beams) {
    const f = b.field;
    ctx.fillStyle = 'rgba(40,70,140,.08)'; ctx.fillRect(f.x0 * T, FY + f.y0 * T, (f.x1 - f.x0 + 1) * T, (f.y1 - f.y0 + 1) * T);
    ctx.strokeStyle = 'rgba(90,110,160,.55)'; ctx.lineWidth = 1;
    for (let y = f.y0; y <= f.y1; y += 2) for (let x = f.x0; x <= f.x1; x += 3) {
      const cx = x * T + 16, cy = FY + y * T + 16;
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.moveTo(cx - 3, cy - 3); ctx.lineTo(cx + 3, cy + 3); ctx.moveTo(cx + 3, cy - 3); ctx.lineTo(cx - 3, cy + 3); ctx.stroke();
    }
    const ph = b.phases[C.beamPhase(b, s.step)];
    if (off) { if ((F >> 5) % 2) text('BEAM OFF', b.x * T + 36, FY + b.y * T + 8, {color: '#e0281a', shadow: '#fff'}); continue; }
    if (b.every - (s.step % b.every) <= 6 && (F >> 4) % 2) continue;
    const col = {B: '#9fe0ff', P: '#d59cff', As: '#9cff9c', BF2: '#ffe08a'}[ph.species];
    for (const [w, a] of [[9, 0.12], [5, 0.25], [2, 1]]) {
      ctx.strokeStyle = col; ctx.globalAlpha = a * (0.85 + 0.15 * Math.sin(F / 3)); ctx.lineWidth = w;
      ctx.beginPath(); ph.points.forEach(([x, y], i) => i ? ctx.lineTo(x * T, FY + y * T) : ctx.moveTo(x * T, FY + y * T)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
function heatAndPlasma(L, layer, s) {
  if (L.heat && layer === 0) {
    const temps = L.heat.temps[s.step % L.heat.period];
    for (let i = 0; i < C.W * C.H; i++) {
      const v = temps[i];
      if (v < 35 || !L.walk[0][i]) continue;
      const x = (i % C.W) * T, y = FY + ((i / C.W) | 0) * T, a = clamp((v - 35) / 260, 0, 0.7);
      ctx.fillStyle = v >= L.heat.threshold ? `rgba(255,${Math.round(150 - a * 120)},30,${a})` : `rgba(255,170,60,${a * 0.6})`;
      ctx.fillRect(x, y, T, T);
      if (v >= L.heat.threshold && !reduced) for (let k = 0; k < 2; k++) R('rgba(255,230,160,.3)', x + ((F + i * 3 + k * 11) % 28), y + ((i * 7 + k * 13) % 24) + 4, 1, 3);
    }
  }
  const plasmaOff = C.hazardStopped(s, 'plasma');
  for (const pl of L.pulses) {
    if (pl.layer !== layer || plasmaOff) continue;
    const on = C.pulseOn(pl, s.step), ph = s.step % pl.period, soon = !on && ((ph + 6) % pl.period) >= pl.on[0] && ((ph + 6) % pl.period) < pl.on[0] + 6;
    if (!on && !soon) continue;
    for (let y = pl.y0; y <= pl.y1; y++) for (let x = pl.x0; x <= pl.x1; x++) {
      if (!L.walk[layer][y * C.W + x]) continue;
      const a = on ? 0.42 + 0.18 * Math.sin(F / 2 + x + y) : ((F >> 2) % 2 ? 0.12 : 0);
      ctx.fillStyle = `rgba(190,110,255,${a})`; ctx.fillRect(x * T, FY + y * T, T, T);
      if (on && !reduced && hash(F + x * 13 + y * 7) > 0.7) R('#f0dcff', x * T + (hash(x + F) * 30 | 0), FY + y * T + (hash(y + F) * 30 | 0), 1, 1);
    }
  }
}

/* ---------- Notes, the telephone, faces at the window ---------- */
// A sheet of paper from shift B on the floor: ruled lines and a few lines of handwriting.
function paperNote(n) {
  const px = n.x * T, py = FY + n.y * T;
  R('rgba(0,0,0,.25)', px + 9, py + 13, 17, 13);
  ctx.save(); ctx.translate(px + 16, py + 18); ctx.rotate(-0.18);
  R(night ? (n.read ? '#6a5a3a' : '#9a8a62') : (n.read ? '#cfcab8' : '#f3eedc'), -8, -6, 16, 12);
  R(night ? '#7a6a48' : '#e2dcc4', -8, 4, 16, 2);
  for (let i = 0; i < 3; i++) R(night ? '#3a3020' : '#5a6aa0', -6, -4 + i * 3, 8 + (i % 2) * 3, 1);
  ctx.restore();
}
// Wall telephone on a wall face; while it rings, the lamp blinks and the handset trembles.
function phone(ph, ringing) {
  const px = ph.x * T, py = FY + ph.y * T + T - 14, j = ringing && !reduced ? (F >> 1) % 2 : 0;
  R(night ? '#2a2216' : '#5a6370', px + 9, py + 1, 14, 12); R(night ? '#3a2e1c' : '#8a94a2', px + 10, py + 2, 12, 10);
  R(night ? '#1a140a' : '#262b33', px + 11 + j, py + 2, 4, 9); R(night ? '#1a140a' : '#262b33', px + 10 + j, py + 2, 6, 2); R(night ? '#1a140a' : '#262b33', px + 10 + j, py + 9, 6, 2);
  for (let i = 0; i < 6; i++) R(night ? '#4a3c24' : '#c9d0d8', px + 17 + (i % 2) * 2, py + 3 + (i >> 1) * 2, 1, 1);
  R(ringing && (F >> 3) % 2 ? '#ff3a2a' : night ? '#3a1a10' : '#6a2a20', px + 20, py + 9, 2, 2);
  if (ringing && !reduced) { R(night ? '#ffcf5a' : '#26303d', px + 5, py + 3 - j, 2, 1); R(night ? '#ffcf5a' : '#26303d', px + 25, py + 3 + j, 2, 1); }
}
// Someone stands outside on the lake, behind the glass, in a suit like yours.
function windowFace(g) {
  const px = g.x * T, py = FY + g.y * T;
  ctx.save(); ctx.beginPath(); ctx.rect(px, py + 9, T, T - 9); ctx.clip();
  ctx.globalAlpha = g.a;
  R('#6d6448', px + 7, py + 21, 18, 11); R('#8f8466', px + 10, py + 11, 12, 12); R('#8f8466', px + 9, py + 14, 14, 8);
  R('#050402', px + 11, py + 14, 10, 4); R('#ffb43a', px + 12, py + 15, 2, 2); R('#ffb43a', px + 18, py + 15, 2, 2);
  ctx.restore(); ctx.globalAlpha = 1;
}

/* ---------- Floor cache ---------- */
function floorTiles(L, layer) {
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
    const c2 = tileAt(L, layer, x, y), px = x * T, py = FY + y * T;
    if (c2 === 'o') holeTile(L, layer, x, y, px, py);
    else if (c2 === 'A') showerFloor(L, x, y, px, py);
    else if (c2 !== '#' && c2 !== '=') floorTile(x, y, px, py);
  }
}
const floorCache = new Map();
function floorLayer(L, layer) {
  const key = `${L.id}:${layer}`;
  let c = floorCache.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = WW * 2; c.height = 360 * 2;
    const main = ctx;
    ctx = c.getContext('2d'); ctx.setTransform(2, 0, 0, 2, 0, 0);
    floorTiles(L, layer);
    ctx = main; floorCache.set(key, c);
  }
  return c;
}

/* ---------- Scene ---------- */
function draw(c, s, o) {
  ctx = c; F = o.frame; night = s.layer === 1; reduced = o.reduced; p = P[s.layer];
  const L = s.level, layer = s.layer;
  R(p.void, 0, 0, WW, 360);
  // Tiles in rows; tools and figures are drawn row by row so nearer things overlap farther ones.
  // The floor never changes within an hour: it is drawn once per layer and then copied.
  if (L.intro) floorTiles(L, layer);
  else ctx.drawImage(floorLayer(L, layer), 0, 0, WW, 360);
  airlock(L, layer, s);
  heatAndPlasma(L, layer, s);
  if (o.note && o.note.layer === layer) paperNote(o.note);
  // Cooled niches in the furnace banks: hazard frame, a fan in the floor, KÜHL.
  if (L.heat && L.heat.shields && layer === 0) for (const [x, y] of L.heat.shields) {
    const px = x * T, py = FY + y * T;
    for (let i = 0; i < T; i += 4) { R((i >> 2) % 2 ? '#1a1a1a' : '#f2c21a', px + i, py, 4, 2); R((i >> 2) % 2 ? '#f2c21a' : '#1a1a1a', px + i, py + T - 2, 4, 2); }
    ring('#7c8693', px + 16, py + 15, 8, 2); const a = reduced ? 0.5 : F / 4;
    ctx.strokeStyle = '#5a6370'; ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 0; k < 3; k++) { const b = a + k * 2.09; ctx.moveTo(px + 16, py + 15); ctx.lineTo(px + 16 + Math.cos(b) * 6, py + 15 + Math.sin(b) * 6); }
    ctx.stroke();
    text('22°C', px + 16, py + 24, {align: 'center', size: 8, color: '#2c6fb5'});
  }
  const blocks = toolBlocks(L, layer);
  const hasPulses = L.pulses.some(pl => pl.layer === layer);
  const heatAt = (x, y) => L.heat ? clamp((L.heat.temps[s.step % L.heat.period][y * C.W + x] - 22) / 600, 0, 1) : 0;
  const k = o.k;
  const ppx = lerp(s.px, s.x, k) * T, ppy = FY + lerp(s.py, s.y, k) * T;
  const figures = [];
  const walkF = (s.px !== s.x || s.py !== s.y) ? (Math.floor(k * 4) % 4) : 0;
  if (o.playerVisible) figures.push({y: lerp(s.py, s.y, k), draw: () => {
    if (o.gown !== undefined) {
      // Putting on the suit: it covers the street clothes from the top down, hood first, boot covers last.
      civilian(ppx, ppy - 4, 'down', 0, true);
      const edge = ppy - 8 + 42 * o.gown;
      ctx.save(); ctx.beginPath(); ctx.rect(ppx, ppy - 10, T, edge - (ppy - 10)); ctx.clip();
      bunny(ppx, ppy - 4, 'down', 0, SUIT.day, {carry: false, night}); ctx.restore();
      if (o.gown < 1) R('rgba(255,255,255,.75)', ppx + 7, Math.round(edge), 18, 1);
      if (o.sparkle) for (const [sx, sy] of o.sparkle) { const a = 0.5 + 0.5 * Math.sin(F / 3); R(`rgba(255,255,255,${a})`, ppx + sx, ppy - 4 + sy, 2, 2); }
    } else if (o.civilian) civilian(ppx, ppy - 4, s.face, walkF, o.lockerDone);
    else bunny(ppx, ppy - 4, s.face, walkF, night ? SUIT.night : SUIT.day, {carry: !L.intro || s.got > 0, night});
  }});
  const isSet = i => !!(o.frozen && o.frozen[i]);
  if (night) o.enemies.forEach(([ex, ey], i) => figures.push({y: ey, draw: () => {
    const jit = !reduced && !isSet(i) && hash(F + i * 9) > 0.97 ? 2 : 0;
    const face = Math.abs(ex - s.x) > Math.abs(ey - s.y) ? (ex > s.x ? 'left' : 'right') : (ey > s.y ? 'up' : 'down');
    bunny(ex * T + jit, FY + ey * T - 4, face === 'up' ? 'down' : face, 0, isSet(i) ? SUIT.set : SUIT.them, {tall: 5, longArms: true, eyes: !isSet(i)});
    if (isSet(i) && !reduced) for (let k = 0; k < 3; k++) R('#efe6ff', ex * T + 8 + ((F + k * 11) % 16), FY + ey * T + ((F * 0.5 + k * 9) % 26), 1, 1);
    R('#3a2a10', ex * T + 12 + jit, FY + ey * T + 10, 4, 3); R('#2a1a08', ex * T + 18 + jit, FY + ey * T + 16, 3, 2);
  }}));
  for (let y = 0; y < C.H; y++) {
    for (let x = 0; x < C.W; x++) {
      const c2 = tileAt(L, layer, x, y), px = x * T, py = FY + y * T;
      if (c2 === '#') { wallTile(L, layer, x, y, px, py); showerNozzles(L, layer, x, y, px, py); }
      else if (c2 === '=') lakeWindow(x, y, px, py);
      else if (c2 === 'K') lockers(x, y, px, py, o.locker);
      else if (c2 === 'G') gownRack(px, py, !o.civilian || o.gown > 0.05, o.gownSpot);
      else if (c2 === 'B') bench(x, y, px, py);
      else if (c2 === 'D') door(L, x, y, px, py);
    }
    for (const b of blocks) {
      if (b.y1 !== y) continue;
      const fn = TOOLS[b.type] || TOOLS.generic;
      // Plasma: with pulses in this shift a tool burns with the pulse next to it; without, it runs by day.
      const near = when => !C.hazardStopped(s, 'plasma') && L.pulses.some(pl => pl.layer === layer && pl.x0 <= b.x1 + 1 && pl.x1 >= b.x0 - 1 && pl.y0 <= b.y1 + 2 && pl.y1 >= b.y0 - 2 && C.pulseOn(pl, when));
      const paced = hasPulses && L.pulses.some((pl, i) => pl.layer === layer && pl.x0 <= b.x1 + 1 && pl.x1 >= b.x0 - 1 && pl.y0 <= b.y1 + 2 && pl.y1 >= b.y0 - 2);
      const on = paced ? near(s.step) : !night;
      const tw = b.x1 - b.x0 + 1, row = b.y1 + 1 < C.H ? b.y1 + 1 : b.y1;
      const mouths = L.heat ? L.heat.sources.filter(([sx, sy]) => sx >= b.x0 && sx <= b.x1 && sy >= b.y0 && sy <= b.y1)
        .map(([sx, sy]) => ({px: sx * T + 16, hot: heatAt(sx, sy)})) : [];
      fn(b.x0 * T + 2, FY + b.y0 * T + 2, tw * T - 4, (b.y1 - b.y0 + 1) * T - 4,
        {...b, mouths, hot: (_, k = 0) => {
          if (!L.heat) return 0;
          const n = b.n || Math.max(1, Math.round((tw * T - 4) / 62)), per = tw / n;
          return Math.max(...[...Array(Math.ceil(per))].map((_, i) => heatAt(Math.min(b.x1, b.x0 + Math.floor(k * per) + i), row)));
        }},
        {plasmaOn: on, plasmaSoon: paced && !on && near(s.step + 6), hasPulses: paced, allOn: paced});
    }
    if (layer === 0 && y === C.H - 1) beams(L, s);
    for (const f of figures) if (Math.floor(f.y + 0.5) === y) f.draw();
  }
  stations(L, layer, s, o.lang);
  if (o.lockerSpot) glowSpot(o.lockerSpot[0] * T, FY + o.lockerSpot[1] * T);
  if (o.reticle && night && window.SchichtOdenchip) {
    const rx = o.reticle.x * T, ry = FY + o.reticle.y * T, bob = Math.round(Math.sin(F / 14) * 2);
    R('rgba(0,0,0,.35)', rx + 8, ry + 26, 18, 3);
    window.SchichtOdenchip.reticle(ctx, rx + 7, ry + 5 + bob, 18, o.reticleN);
    ctx = c;
  }
  wallSigns(L, layer, o.lang);
  if (o.phone) phone(o.phone, o.phone.ringing);
  if (o.windowFace && !night) windowFace(o.windowFace);
  if (L.showerT > 0) showerAir(L);
  // Shadows of the previous shift on your floor, a little stretched, as if cast from the other shift.
  if (!night) o.enemies.forEach(([ex, ey], i) => {
    const px = ex * T, py = FY + ey * T, a = isSet(i) ? 0.22 : 0.26 + 0.07 * Math.sin(F / 9 + i);
    ctx.fillStyle = isSet(i) ? `rgba(90,60,150,${a})` : `rgba(10,16,30,${a})`;
    ctx.beginPath(); ctx.ellipse(px + 16, py + 22, 9, 13, 0.25, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 18, py + 6, 6, 6, 0, 0, 7); ctx.fill();
  });
  if (!night) (o.ghosts || []).forEach(([gx, gy, a]) => {
    const px = gx * T, py = FY + gy * T;
    ctx.fillStyle = `rgba(10,16,30,${0.34 * a})`;
    ctx.beginPath(); ctx.ellipse(px + 16, py + 22, 9, 13, -0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 15, py + 6, 6, 6, 0, 0, 7); ctx.fill();
  });
  rail(L, layer);
  if (o.grace > 0) {
    ctx.strokeStyle = `rgba(255,207,90,${0.35 + 0.4 * o.grace})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ppx + 16, ppy + 14, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * o.grace); ctx.stroke();
  }
  if (o.shiftHint && (F >> 3) % 4) {
    const kx = Math.round(ppx) + 2, ky = Math.round(ppy) - 20;
    R('#000', kx - 1, ky - 1, 30, 13); R(night ? '#ffcf5a' : '#e9eef5', kx, ky, 28, 11); R(night ? '#a07a32' : '#9aa6b5', kx, ky + 9, 28, 2);
    text('SHIFT', kx + 14, ky + 1, {align: 'center', color: '#0d1420', max: 26});
  }
  // Light: by day a cool ceiling glow; in the shift before the helmet lamp and a few dying sodium lamps.
  if (night) {
    // The helmet lamp: wide enough to read the room, and the dark never quite black.
    const lx = ppx + 16, ly = ppy + 12, r = 150 + (reduced ? 0 : (hash(F >> 2) - 0.5) * 6);
    const g = ctx.createRadialGradient(lx, ly, 12, lx, ly, r);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, 'rgba(2,1,0,.28)'); g.addColorStop(1, 'rgba(1,0,0,.84)');
    ctx.fillStyle = g; ctx.fillRect(0, FY, WW, C.H * T);
    ctx.globalCompositeOperation = 'lighter';
    const warm = ctx.createRadialGradient(lx, ly, 4, lx, ly, r * 0.6);
    warm.addColorStop(0, 'rgba(255,190,80,.2)'); warm.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = warm; ctx.fillRect(0, FY, WW, C.H * T);
    (L.lamps || []).forEach(([x, y], i) => {
      if (hash((F >> 3) + i * 17) < 0.07) return;
      const cx = x * T + 16, cy = FY + y * T + 16, lg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70);
      lg.addColorStop(0, 'rgba(255,170,50,.32)'); lg.addColorStop(1, 'rgba(255,170,50,0)');
      ctx.fillStyle = lg; ctx.fillRect(cx - 70, cy - 70, 140, 140);
    });
    if (o.phone && o.phone.ringing && (F >> 3) % 2) {
      const cx = o.phone.x * T + 21, cy = FY + o.phone.y * T + T - 4, rg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 26);
      rg.addColorStop(0, 'rgba(255,60,40,.55)'); rg.addColorStop(1, 'rgba(255,60,40,0)');
      ctx.fillStyle = rg; ctx.fillRect(cx - 26, cy - 26, 52, 52);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (o.reticle) {
      // A glint of quartz in the dark, visible from afar.
      const gx = o.reticle.x * T + 16, gy = FY + o.reticle.y * T + 12, tw = (F % 50) / 50;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tw * Math.PI);
      R('#dff6ff', gx - 4 + tw * 8, gy, 3, 1); R('#dff6ff', gx, gy - 2, 1, 5); R('#ffffff', gx, gy, 1, 1);
      ctx.globalAlpha = 1;
    }
    if (o.note && o.note.layer === layer && !o.note.read && (F % 90) < 30) {
      const gx = o.note.x * T + 14, gy = FY + o.note.y * T + 15;
      ctx.globalAlpha = Math.sin((F % 90) / 30 * Math.PI) * 0.7; R('#fff6dc', gx, gy, 3, 2); ctx.globalAlpha = 1;
    }
    // The set ones glow faintly violet in the dark, so you can see that they are stuck.
    o.enemies.forEach(([ex, ey], i) => {
      if (!isSet(i)) return;
      const cx = ex * T + 16, cy = FY + ey * T + 12, g2 = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
      g2.addColorStop(0, 'rgba(200,170,255,.45)'); g2.addColorStop(1, 'rgba(200,170,255,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g2; ctx.fillRect(cx - 22, cy - 22, 44, 44); ctx.globalCompositeOperation = 'source-over';
    });
    o.enemies.forEach(([ex, ey], i) => {
      const d = Math.hypot(ex - s.x, ey - s.y);
      if (d > 8 || isSet(i)) return;
      const a = clamp((8 - d) / 4, 0, 0.95);
      ctx.globalAlpha = a * 0.35; ctx.strokeStyle = '#ffb43a'; ctx.lineWidth = 1;
      ctx.strokeRect(ex * T + 9.5, FY + ey * T - 8.5, 14, 13); ctx.strokeRect(ex * T + 7.5, FY + ey * T + 4.5, 18, 20);
      ctx.globalAlpha = a * (hash(F >> 2) > 0.08 ? 1 : 0.2);
      R('#ffb43a', ex * T + 13, FY + ey * T - 2, 2, 2); R('#ffb43a', ex * T + 18, FY + ey * T - 2, 2, 2);
      ctx.globalAlpha = 1;
    });
  } else {
    const v = ctx.createRadialGradient(WW / 2, FY + 160, 140, WW / 2, FY + 160, 420);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,20,40,.32)');
    ctx.fillStyle = v; ctx.fillRect(0, FY, WW, C.H * T);
  }
  // Yellow light in the litho bay, in your shift: the filtered tubes turn white to lemon and blue to grey-green.
  // Still bright and clean, unlike the dim amber of the shift before.
  if (L.yellowLight && !night) {
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#ffeaa6'; ctx.fillRect(0, FY, WW, C.H * T);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,236,150,.07)'; ctx.fillRect(0, FY, WW, C.H * T);
  }
  // A tool flares its work light: a violet-white burst that reaches as far as the light sets the previous shift.
  if (o.flash && o.flash.layer === layer && o.flash.a > 0) {
    const fl = o.flash, cx = (fl.x0 + fl.x1 + 1) / 2 * T, cy = FY + (fl.y0 + fl.y1 + 1) / 2 * T, rr = (C.FLASH_RADIUS + 0.5) * T;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, rr);
    g.addColorStop(0, `rgba(240,230,255,${0.75 * fl.a})`); g.addColorStop(0.5, `rgba(170,120,255,${0.35 * fl.a})`); g.addColorStop(1, 'rgba(120,60,255,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(220,200,255,${0.8 * fl.a})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, rr * (1.15 - fl.a * 0.6), 0, 7); ctx.stroke();
  }
  // A power dip: the light dies, and only their eyes are left.
  if (o.blackout > 0) {
    ctx.fillStyle = `rgba(0,0,0,${0.97 * o.blackout})`; ctx.fillRect(0, FY, WW, C.H * T);
    if (o.blackout > 0.6) o.enemies.forEach(([ex, ey]) => { R('#ffb43a', ex * T + 13, FY + ey * T - 2, 2, 2); R('#ffb43a', ex * T + 18, FY + ey * T - 2, 2, 2); });
  }
}

window.SchichtWorld = {draw, TOOLS: Object.keys(TOOLS)};
})();
