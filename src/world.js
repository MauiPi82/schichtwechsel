/* Schichtwechsel - the fab, drawn at 640 x 360 (32 px per tile), oblique top-down: top faces plus front faces.
 * Tools are drawn after real equipment types (coater/developer track, immersion scanner, cluster platform,
 * vertical furnace, implanter beamline, wet bench, CD-SEM, stocker) under invented maker names. */
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
function lockers(x, y, px, py) {
  R('rgba(0,0,0,.25)', px, py + T, T, 3);
  R('#8d97a4', px, py - 10, T, T + 10); R('#a7b0bc', px, py - 10, T, 3);
  for (const dx of [1, 16]) {
    R('#b8c0cb', px + dx, py - 6, 15, T + 4); R('#97a1ae', px + dx, py - 6, 1, T + 4);
    for (let i = 0; i < 3; i++) R('#7c8693', px + dx + 4, py - 3 + i * 2, 7, 1);
    R('#4a525e', px + dx + 11, py + 10, 2, 4);
    text(String(10 + x * 2 + (dx > 1 ? 1 : 0)), px + dx + 3, py + 20, {size: 8, color: '#4a525e'});
  }
}
function bench(x, y, px, py) {
  floorTile(x, y, px, py);
  R('rgba(0,0,0,.25)', px + 2, py + 22, T - 2, 4);
  R('#c9cfd8', px, py + 10, T, 10); R('#e6eaf0', px, py + 10, T, 2); R('#8d97a4', px + 3, py + 20, 3, 6); R('#8d97a4', px + T - 6, py + 20, 3, 6);
  if (x % 2) { R('#f7f9fc', px + 6, py + 8, 14, 5); R('#d3dae4', px + 6, py + 12, 14, 1); }
  else { R('#e2e8f0', px + 8, py + 9, 6, 4); R('#e2e8f0', px + 16, py + 9, 6, 4); }
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
  // Cluster platform: transfer chamber with robot in the middle, process chambers around it, EFEM in front.
  cluster(x, y, w, h, t, s) {
    R('rgba(0,0,0,.22)', x + 3, y + h, w, 4);
    const cx = x + w / 2, cy = y + (h - 22) / 2 + 2, r = Math.min(w, h - 22) * 0.18;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i + 0.5) * Math.PI / n, ox = cx + Math.cos(a) * (r + 13), oy = cy + Math.sin(a) * (r + 10);
      ctx.strokeStyle = p.white3; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ox, oy); ctx.stroke();
      circle(p.white2, ox, oy, 11); ring(p.white3, ox, oy, 11, 2); circle(p.white, ox, oy, 7);
      const glow = t.plasma && s && s.plasmaOn;
      circle(glow ? '#c890ff' : p.dark, ox, oy, 3);
      if (glow) { ctx.fillStyle = 'rgba(190,110,255,.35)'; ctx.beginPath(); ctx.arc(ox, oy, 11, 0, 7); ctx.fill(); }
      R(p.accent2, ox - 1, oy - 13, 2, 3);
    }
    ctx.fillStyle = p.white2; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = p.white3; ctx.stroke();
    const ra = night ? 1.2 : F / 30;
    ctx.strokeStyle = p.dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ra) * r * 0.8, cy + Math.sin(ra) * r * 0.8); ctx.stroke();
    circle(p.dark, cx, cy, 3);
    const fy = body(x + 2, y + h - 22, w - 4, 22, 14);
    R(p.accent, x + 2, fy - 2, w - 4, 2);
    for (let i = 0; i < 3; i++) loadPort(x + 8 + i * 18, fy + 2, i !== 1);
    tablet(x + w - 30, fy + 2); emo(x + w - 9, fy + 7);
    brand(t.name || 'VALENTA C-5', x + 64, fy + 4, w - 100);
    signalTower(x + w - 8, y + h - 20, t.plasma && s && s.plasmaSoon ? 'y' : 'g');
  },
  // Vertical furnace: tall cabinet, exhaust on top, a window onto the quartz boat full of wafers.
  furnace(x, y, w, h, t, s) {
    const fy = body(x, y, w, h, 24);
    R(p.accent, x, fy + 2, w, 2);
    for (let i = 0; i < Math.floor(w / 22); i++) { circle(p.white3, x + 12 + i * 22, y + 9, 6); circle(p.grey, x + 12 + i * 22, y + 9, 3); }
    const hot = t.hot ? t.hot(s) : 0;
    const bx = x + w / 2 - 8, by = fy + 5;
    R(p.darker, bx - 2, by - 1, 20, 17);
    R(hot > 0.3 ? `rgba(255,${Math.round(120 + 80 * (1 - hot))},40,${0.5 + hot * 0.5})` : p.glass, bx - 1, by, 18, 15);
    for (let i = 0; i < 6; i++) R(hot > 0.3 ? '#fff0c0' : p.wafer, bx + 2, by + 2 + i * 2, 12, 1);
    brand(t.name || 'FORNO V-3', x + 4, fy + 6, bx - x - 8);
    emo(x + w - 7, fy + 8);
    signalTower(x + w - 5, y + 2, hot > 0.3 ? 'y' : 'g');
  },
  // Wet bench: open baths with chemistry labels, exhaust slots along the back.
  wetbench(x, y, w, h, t) {
    const fy = body(x, y, w, h, 14);
    for (let i = 0; i < Math.floor(w / 6); i++) R(p.grey, x + 3 + i * 6, y + 3, 3, 2);
    const baths = ['HF', 'SC-1', 'SC-2', 'SPM', 'QDR'], n = Math.min(baths.length, Math.floor((w - 8) / 28));
    for (let i = 0; i < n; i++) {
      const bx = x + 6 + i * 28, by = y + 9;
      R(p.white3, bx, by, 24, h - 30); R(night ? '#1a2a1a' : ['#cfe6f5', '#d8f0e0', '#e6f0d8', '#f3e6c8', '#d8e8f8'][i], bx + 2, by + 2, 20, h - 34);
      if (!night) R('rgba(255,255,255,.6)', bx + 4 + (F >> 3) % 12, by + 4, 3, 1);
      R(i === 0 || i === 3 ? '#e0281a' : '#f2c21a', bx + 4, fy + 3, 16, 7);
      text(baths[i], bx + 12, fy + 3, {align: 'center', size: 8, color: '#1a1004', max: 15});
    }
    emo(x + w - 8, fy + 7);
    signalTower(x + 3, y + 2, 'g');
  },
  // Implanter: source housing with high-voltage marking, analyser magnet, beamline to the end station.
  implanter(x, y, w, h, t) {
    const fy = body(x, y, w, h, 14, p.white2);
    for (let i = 0; i < w; i += 6) R(i % 12 ? '#1a1a1a' : '#f2c21a', x + i, fy + 2, 6, 3);
    text('HV', x + w / 2, fy + 6, {align: 'center', size: 8, color: night ? '#8a6a30' : '#e0281a'});
    circle(night ? '#4a2a10' : '#b87333', x + w / 2, y + (h - 14) / 2, Math.min(w, h - 14) / 3);
    circle(p.dark, x + w / 2, y + (h - 14) / 2, Math.min(w, h - 14) / 6);
    signalTower(x + w - 5, y + 2, 'y');
  },
  // CD-SEM: electron column on top, the monitor shows lines and a measured critical dimension.
  metrology(x, y, w, h, t) {
    const fy = body(x, y, w, h, 16);
    const cx = x + w * 0.62, cy = y + (h - 16) / 2;
    circle(p.white3, cx, cy, 11); ring(p.grey, cx, cy, 8, 2); circle(p.dark, cx, cy, 4); circle(night ? '#3a2a0a' : '#7fd0ff', cx, cy, 1.5);
    const mx = x + 6, my = fy - 18;
    R(p.darker, mx, my, 26, 18); R(night ? '#120c04' : '#1a1e24', mx + 1, my + 1, 24, 16);
    for (let i = 0; i < 5; i++) R(night ? '#3a2f1a' : '#9aa3ad', mx + 3 + i * 5, my + 2, 2, 12);
    if (!night) text('40.2nm', mx + 13, my + 13, {align: 'center', size: 8, color: '#7fd0ff', max: 24});
    loadPort(x + w - 22, fy + 3, true);
    brand(t.name || 'ORSA CD-9', x + 6, fy + 5, w - 34);
    signalTower(x + 3, y + 2, 'g');
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
  L.stations.forEach((st, n) => {
    if (st.layer !== layer) return;
    const px = st.x * T, py = FY + st.y * T, done = s.got > n, next = s.got === n;
    R('rgba(0,0,0,.25)', px + 6, py + 26, 22, 4);
    R(p.dark, px + 5, py + 14, 22, 14); R(p.darker, px + 5, py + 24, 22, 4);
    if (!done) {
      R(p.foup, px + 7, py + 4, 18, 12); R(p.foupLo, px + 7, py + 13, 18, 3);
      R(p.dark, px + 11, py + 2, 10, 3);
      R(night ? '#9a6c1e' : '#e8732a', px + 9, py + 7, 14, 5);
      text('4471', px + 16, py + 6, {align: 'center', size: 8, color: night ? '#1a1004' : '#fff', max: 13});
    } else R('#3fd06a', px + 12, py + 18, 8, 3);
    if (next) {
      const a = 0.5 + 0.5 * Math.sin(F / 8);
      ctx.strokeStyle = night ? `rgba(255,207,90,${a})` : `rgba(127,208,255,${a})`; ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
      const def = L.route && L.route[n];
      const label = def ? `${n + 1} · ${def[lang].toUpperCase()}` : `${n + 1}`;
      ctx.font = '400 8px "Silkscreen", monospace';
      // Below the port when a tool or wall stands right behind it, so the label never covers the tool.
      const blocked = ['M', '#'].includes(tileAt(L, layer, st.x, st.y - 1));
      const lw = ctx.measureText(label).width + 8, ly = (blocked ? py + 34 : py - 14) + Math.round(Math.sin(F / 12) * 2);
      R(night ? 'rgba(30,20,6,.92)' : 'rgba(10,16,26,.88)', px + 16 - lw / 2, ly, lw, 11);
      R(night ? '#ffcf5a' : '#7fd0ff', px + 16 - lw / 2, ly + 10, lw, 1);
      text(label, px + 16, ly + 1, {align: 'center', color: night ? '#ffcf5a' : '#e9eef5'});
    }
  });
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
  // the lot in the player's hands when facing you
  if (o.carry && face === 'down') { R(c.dark, px + 11, y + 16, 10, 7); R(o.night ? '#6a5a3a' : '#d9dde3', px + 11, y + 15, 10, 6); R(o.night ? '#9a6c1e' : '#e8732a', px + 12, y + 17, 8, 2); }
}

// Street clothes before gowning: dark jacket, jeans, a bag over the shoulder.
function civilian(px, py, face, walk) {
  const sw = walk ? [0, 1, 0, -1][walk] : 0;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 30, 8, 3, 0, 0, 7); ctx.fill();
  R('#3a5a8a', px + 11, py + 21, 4, 8 - Math.max(0, sw)); R('#3a5a8a', px + 17, py + 21, 4, 8 - Math.max(0, -sw));
  R('#1a1e24', px + 11, py + 28, 4, 2); R('#1a1e24', px + 17, py + 28, 4, 2);
  R('#24324e', px + 9, py + 10, 14, 12); R('#1a2438', px + 15, py + 10, 1, 12); R('#2e4064', px + 9, py + 10, 14, 1);
  R('#24324e', px + 6, py + 11 + sw, 3, 9); R('#24324e', px + 23, py + 11 - sw, 3, 9);
  R('#e2b896', px + 6, py + 20 + sw, 3, 2); R('#e2b896', px + 23, py + 20 - sw, 3, 2);
  R('#5a3a1a', px + 21, py + 11, 2, 10); R('#6a4a2a', px + 20, py + 18, 6, 5);
  R('#e2b896', px + 11, py + 2, 10, 9); R('#5a3a1a', px + 11, py + 1, 10, 3); R('#5a3a1a', px + 10, py + 2, 2, 5); R('#5a3a1a', px + 20, py + 2, 2, 4);
  if (face === 'down') { R('#2a1a0a', px + 13, py + 5, 1, 1); R('#2a1a0a', px + 18, py + 5, 1, 1); R('#c0907a', px + 15, py + 8, 2, 1); }
  if (face === 'up') R('#5a3a1a', px + 11, py + 2, 10, 8);
}

/* ---------- Hazards ---------- */
function beams(L, s) {
  for (const b of L.beams) {
    const f = b.field;
    ctx.fillStyle = 'rgba(40,70,140,.08)'; ctx.fillRect(f.x0 * T, FY + f.y0 * T, (f.x1 - f.x0 + 1) * T, (f.y1 - f.y0 + 1) * T);
    ctx.strokeStyle = 'rgba(90,110,160,.55)'; ctx.lineWidth = 1;
    for (let y = f.y0; y <= f.y1; y += 2) for (let x = f.x0; x <= f.x1; x += 3) {
      const cx = x * T + 16, cy = FY + y * T + 16;
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.moveTo(cx - 3, cy - 3); ctx.lineTo(cx + 3, cy + 3); ctx.moveTo(cx + 3, cy - 3); ctx.lineTo(cx - 3, cy + 3); ctx.stroke();
    }
    const ph = b.phases[C.beamPhase(b, s.step)];
    if (b.every - (s.step % b.every) <= 6 && (F >> 2) % 2) continue;
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
  for (const pl of L.pulses) {
    if (pl.layer !== layer) continue;
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

/* ---------- Scene ---------- */
function draw(c, s, o) {
  ctx = c; F = o.frame; night = s.layer === 1; reduced = o.reduced; p = P[s.layer];
  const L = s.level, layer = s.layer;
  R(p.void, 0, 0, WW, 360);
  // Tiles in rows; tools and figures are drawn row by row so nearer things overlap farther ones.
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
    const c2 = tileAt(L, layer, x, y), px = x * T, py = FY + y * T;
    if (c2 === 'o') holeTile(L, layer, x, y, px, py);
    else if (c2 === 'A') showerFloor(L, x, y, px, py);
    else if (c2 !== '#' && c2 !== '=') floorTile(x, y, px, py);
  }
  airlock(L, layer, s);
  heatAndPlasma(L, layer, s);
  const blocks = toolBlocks(L, layer);
  const plasmaOn = L.pulses.some(pl => pl.layer === layer && C.pulseOn(pl, s.step));
  const plasmaSoon = L.pulses.some(pl => pl.layer === layer && !C.pulseOn(pl, s.step) && C.pulseOn(pl, s.step + 6));
  const heatAt = (x, y) => L.heat ? clamp((L.heat.temps[s.step % L.heat.period][y * C.W + x] - 22) / 600, 0, 1) : 0;
  const k = o.k;
  const ppx = lerp(s.px, s.x, k) * T, ppy = FY + lerp(s.py, s.y, k) * T;
  const figures = [];
  const walkF = (s.px !== s.x || s.py !== s.y) ? (Math.floor(k * 4) % 4) : 0;
  if (o.playerVisible) figures.push({y: lerp(s.py, s.y, k), draw: () => o.civilian ? civilian(ppx, ppy - 4, s.face, walkF)
    : bunny(ppx, ppy - 4, s.face, walkF, night ? SUIT.night : SUIT.day, {carry: !L.intro, night})});
  if (night) o.enemies.forEach(([ex, ey], i) => figures.push({y: ey, draw: () => {
    const jit = !reduced && hash(F + i * 9) > 0.97 ? 2 : 0;
    const face = Math.abs(ex - s.x) > Math.abs(ey - s.y) ? (ex > s.x ? 'left' : 'right') : (ey > s.y ? 'up' : 'down');
    bunny(ex * T + jit, FY + ey * T - 4, face === 'up' ? 'down' : face, 0, SUIT.them, {tall: 5, longArms: true, eyes: true});
    R('#3a2a10', ex * T + 12 + jit, FY + ey * T + 10, 4, 3); R('#2a1a08', ex * T + 18 + jit, FY + ey * T + 16, 3, 2);
  }}));
  for (let y = 0; y < C.H; y++) {
    for (let x = 0; x < C.W; x++) {
      const c2 = tileAt(L, layer, x, y), px = x * T, py = FY + y * T;
      if (c2 === '#') { wallTile(L, layer, x, y, px, py); showerNozzles(L, layer, x, y, px, py); }
      else if (c2 === '=') lakeWindow(x, y, px, py);
      else if (c2 === 'K') lockers(x, y, px, py);
      else if (c2 === 'B') bench(x, y, px, py);
      else if (c2 === 'D') door(L, x, y, px, py);
    }
    for (const b of blocks) {
      if (b.y1 !== y) continue;
      const fn = TOOLS[b.type] || TOOLS.generic;
      fn(b.x0 * T + 2, FY + b.y0 * T + 2, (b.x1 - b.x0 + 1) * T - 4, (b.y1 - b.y0 + 1) * T - 4,
        {...b, hot: () => b.type === 'furnace' ? Math.max(...[...Array(b.x1 - b.x0 + 1)].map((_, i) => heatAt(b.x0 + i, b.y1 + 1 < C.H ? b.y1 + 1 : b.y1))) : 0},
        {plasmaOn, plasmaSoon});
    }
    if (layer === 0 && y === C.H - 1) beams(L, s);
    for (const f of figures) if (Math.floor(f.y + 0.5) === y) f.draw();
  }
  stations(L, layer, s, o.lang);
  if (o.reticle && night && window.SchichtOdenchip) {
    const rx = o.reticle.x * T, ry = FY + o.reticle.y * T, bob = Math.round(Math.sin(F / 14) * 2);
    R('rgba(0,0,0,.35)', rx + 8, ry + 26, 18, 3);
    window.SchichtOdenchip.reticle(ctx, rx + 7, ry + 5 + bob, 18, o.reticleN);
    ctx = c;
  }
  wallSigns(L, layer, o.lang);
  if (L.showerT > 0) showerAir(L);
  // Shadows of the previous shift on your floor, a little stretched, as if cast from the other shift.
  if (!night) o.enemies.forEach(([ex, ey], i) => {
    const px = ex * T, py = FY + ey * T, a = 0.26 + 0.07 * Math.sin(F / 9 + i);
    ctx.fillStyle = `rgba(10,16,30,${a})`;
    ctx.beginPath(); ctx.ellipse(px + 16, py + 22, 9, 13, 0.25, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(px + 18, py + 6, 6, 6, 0, 0, 7); ctx.fill();
  });
  rail(L, layer);
  if (o.shiftHint && (F >> 3) % 4) {
    const kx = Math.round(ppx) + 2, ky = Math.round(ppy) - 20;
    R('#000', kx - 1, ky - 1, 30, 13); R(night ? '#ffcf5a' : '#e9eef5', kx, ky, 28, 11); R(night ? '#a07a32' : '#9aa6b5', kx, ky + 9, 28, 2);
    text('SHIFT', kx + 14, ky + 1, {align: 'center', color: '#0d1420', max: 26});
  }
  // Light: by day a cool ceiling glow; in the shift before the helmet lamp and a few dying sodium lamps.
  if (night) {
    const lx = ppx + 16, ly = ppy + 12, r = 118 + (reduced ? 0 : (hash(F >> 2) - 0.5) * 6);
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, r);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(2,1,0,.35)'); g.addColorStop(1, 'rgba(1,0,0,.95)');
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
    ctx.globalCompositeOperation = 'source-over';
    if (o.reticle) {
      // A glint of quartz in the dark, visible from afar.
      const gx = o.reticle.x * T + 16, gy = FY + o.reticle.y * T + 12, tw = (F % 50) / 50;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tw * Math.PI);
      R('#dff6ff', gx - 4 + tw * 8, gy, 3, 1); R('#dff6ff', gx, gy - 2, 1, 5); R('#ffffff', gx, gy, 1, 1);
      ctx.globalAlpha = 1;
    }
    o.enemies.forEach(([ex, ey]) => {
      const d = Math.hypot(ex - s.x, ey - s.y);
      if (d > 8) return;
      ctx.globalAlpha = clamp((8 - d) / 4, 0, 0.95) * (hash(F >> 2) > 0.08 ? 1 : 0.2);
      R('#ffb43a', ex * T + 13, FY + ey * T - 2, 2, 2); R('#ffb43a', ex * T + 18, FY + ey * T - 2, 2, 2);
      ctx.globalAlpha = 1;
    });
  } else {
    const v = ctx.createRadialGradient(WW / 2, FY + 160, 140, WW / 2, FY + 160, 420);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,20,40,.32)');
    ctx.fillStyle = v; ctx.fillRect(0, FY, WW, C.H * T);
  }
}

window.SchichtWorld = {draw, TOOLS: Object.keys(TOOLS)};
})();
