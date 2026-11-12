/* Schichtwechsel - the Odenchip (the chip from Elektronenreise on odenwaeller.org) and the secret finale.
 * With all eight reticles, lot 4471 is exposed one last time, sawn, bonded, moulded, marked and lights eight LEDs.
 * Drawn at 640 x 360 with letterbox bars, like the prologue. */
(() => {
'use strict';
const W = 640, H = 360, BAR = 40;
let ctx, F = 0;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function dot(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); }
function line(a, b, w, c) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
function txt(s, x, y, size, color, o = {}) {
  ctx.font = `${o.weight || 400} ${size}px "${o.font || 'Silkscreen'}", monospace`;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = color; ctx.fillText(s, x, y, o.max || 600);
}

/* ---------- The Odenchip die, after frameDie() in Elektronenreise ---------- */
function die(c, x0, y0, s) {
  ctx = c;
  const ur = (u, v, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x0 + u * s, y0 + v * s, w * s, h * s); };
  ur(0, 0, 1, 1, '#26343b'); ur(0.02, 0.02, 0.96, 0.96, '#1b282f');
  for (const [x, y, w, h] of [[0.015, 0.015, 0.97, 0.005], [0.015, 0.98, 0.97, 0.005], [0.015, 0.015, 0.005, 0.97], [0.98, 0.015, 0.005, 0.97]]) ur(x, y, w, h, '#8f9ca4');
  for (let i = 0; i < 14; i++) { const q = 0.07 + i * 0.064; ur(q, 0.03, 0.035, 0.035, '#c8a050'); ur(q, 0.935, 0.035, 0.035, '#c8a050'); ur(0.03, q, 0.035, 0.035, '#c8a050'); ur(0.935, q, 0.035, 0.035, '#c8a050'); }
  ur(0.1, 0.1, 0.35, 0.35, '#24405a'); for (let i = 0; i < 14; i++) { ur(0.1 + i * 0.025, 0.1, 0.004, 0.35, '#2f5576'); ur(0.1, 0.1 + i * 0.025, 0.35, 0.004, '#2f5576'); }
  ur(0.5, 0.1, 0.4, 0.52, '#2d3f33');
  for (let r = 0; r < 26; r++) for (let c2 = 0; c2 < 20; c2++) if (hash(r * 31 + c2) > 0.55) ur(0.5 + c2 * 0.02, 0.1 + r * 0.02, 0.016, 0.012, '#3c5a46');
  ur(0.1, 0.5, 0.35, 0.38, '#3a3346'); for (let i = 0; i < 6; i++) ur(0.13 + i * 0.05, 0.55, 0.03, 0.28, i % 2 ? '#4a3f5a' : '#463c56');
  ur(0.5, 0.66, 0.4, 0.21, '#33303f'); ur(0.55, 0.7, 0.12, 0.12, '#4a4258'); ur(0.72, 0.7, 0.14, 0.06, '#40394e');
  for (let i = 0; i < 5; i++) ur(0.08, 0.08 + i * 0.21, 0.84, 0.006, 'rgba(200,210,220,.35)');
}

// A reticle: quartz plate, chrome pattern, pellicle frame, barcode label.
function reticle(c, x, y, s, n = 0) {
  ctx = c;
  R('rgba(0,0,0,.35)', x + 2, y + s * 0.92, s, s * 0.12);
  R('#bfe0f0', x, y, s, s); R('#e6f6ff', x, y, s, Math.max(1, s * 0.04));
  R('#8a96a4', x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.76); R('#c9e6f4', x + s * 0.16, y + s * 0.16, s * 0.68, s * 0.68);
  const k = 6;
  for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) if (hash(i * 7 + j * 13 + n * 31) > 0.35) R('#3a4250', x + s * (0.2 + i * 0.1), y + s * (0.2 + j * 0.1), s * 0.07, s * 0.07);
  R('#f2f4f6', x + s * 0.05, y + s * 0.9, s * 0.4, s * 0.07);
  for (let i = 0; i < 9; i++) R('#1a1e24', x + s * (0.07 + i * 0.04), y + s * 0.91, Math.max(1, s * 0.015), s * 0.05);
}

let dieCanvas = null;
function dieSprite() {
  if (!dieCanvas) {
    const main = ctx;
    dieCanvas = document.createElement('canvas'); dieCanvas.width = dieCanvas.height = 72;
    die(dieCanvas.getContext('2d'), 0, 0, 72);
    ctx = main;
  }
  return dieCanvas;
}

/* ---------- Package and board, after the outro of Elektronenreise ---------- */
const PK = {cx: 320, cy: 176, die: 110, body: 210, pin: 14, tip: 76, n: 14};
const pkPt = (s, a, d) => s === 0 ? [PK.cx + a, PK.cy - d] : s === 1 ? [PK.cx + d, PK.cy + a] : s === 2 ? [PK.cx + a, PK.cy + d] : [PK.cx - d, PK.cy + a];
const pinA = i => -PK.body / 2 + (i + 1) * PK.body / (PK.n + 1);
// Draws on the given context; the title screen calls this before the finale ever ran.
function pack(o, c) {
  if (c) ctx = c;
  const hb = PK.body / 2;
  for (let s = 0; s < 4; s++) for (let i = 0; i < PK.n; i++) {
    const at = -68 + i * 136 / (PK.n - 1), ap = pinA(i);
    line(pkPt(s, at, PK.tip), pkPt(s, ap, hb), 3, '#aeb6be'); line(pkPt(s, ap, hb), pkPt(s, ap, hb + PK.pin), 6, '#c8d0d8');
  }
  R('#8e98a2', PK.cx - 62, PK.cy - 62, 124, 124);
  die(ctx, PK.cx - PK.die / 2, PK.cy - PK.die / 2, PK.die);
  for (let j = 0; j < Math.min(o.wires, 4 * PK.n); j++) {
    const s = j / PK.n | 0, i = j % PK.n, q = 0.07 + i * 0.064 + 0.0175, f = Math.min(1, o.wires - j);
    const a = pkPt(s, (q - 0.5) * PK.die, (0.5 - 0.0475) * PK.die), b = pkPt(s, -68 + i * 136 / (PK.n - 1), PK.tip);
    const e = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
    line(a, e, 1, '#f2cf6a');
    if (f < 1) { dot(e[0], e[1], 5, 'rgba(200,210,220,.25)'); dot(e[0], e[1], 2, '#dfe6ec'); }
  }
  if (o.mold > 0) {
    ctx.globalAlpha = o.mold;
    R('#17191e', PK.cx - hb, PK.cy - hb, PK.body, PK.body); R('#202329', PK.cx - hb + 5, PK.cy - hb + 5, PK.body - 10, PK.body - 10);
    dot(PK.cx - hb + 20, PK.cy - hb + 20, 6, '#121418');
    ctx.globalAlpha = 1;
  }
  if (o.mark > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(PK.cx - 90, PK.cy - 30, 180 * o.mark, 50); ctx.clip();
    txt('Odenchip', PK.cx, PK.cy - 18, 32, '#b9bfc7', {font: 'Pixelify Sans', weight: 700});
    txt('LOT 4471 · REV A', PK.cx, PK.cy + 20, 8, '#8e959e');
    ctx.restore();
    if (o.mark < 1) { const x = PK.cx - 90 + 180 * o.mark; dot(x, PK.cy, 7, 'rgba(255,240,220,.3)'); dot(x, PK.cy, 2.5, '#fff'); }
  }
}
let ledMax = 8;
const LEDC = ['#ff4d4d', '#ff8c3a', '#ffd23a', '#7be05a', '#3ad6c8', '#4aa8ff', '#8a6bff', '#ff5ad6'];
function board(u) {
  R('#0f3a22', 40, 50, 560, 260); R('#14482a', 46, 56, 548, 248);
  for (let i = 0; i < 40; i++) dot(60 + (i * 97) % 520, 70 + (i * 53) % 220, 2, '#1d5c38');
  // The chip at the left, small.
  ctx.save(); ctx.translate(170, 180); ctx.scale(0.42, 0.42); ctx.translate(-PK.cx, -PK.cy); pack({wires: 99, mold: 1, mark: 1}); ctx.restore();
  for (let k = 0; k < 8; k++) {
    const y = 78 + k * 28, on = u * 9 > k + 0.5 && k < ledMax;
    line([220, 140 + k * 10], [300, y], 2, '#c8a050'); line([300, y], [480, y], 2, '#c8a050');
    R('#c8b48a', 430, y - 4, 22, 8); R('#7a5a2a', 436, y - 4, 2, 8); R('#7a5a2a', 442, y - 4, 2, 8);
    dot(510, y, 9, on ? LEDC[k] : '#3a3a3a'); dot(507, y - 3, 3, on ? '#ffffff' : '#555');
    if (on) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(F / 6 + k); dot(510, y, 22, LEDC[k]); ctx.globalAlpha = 1; }
  }
  txt('+3,3 V', 540, 60, 8, '#e8d29a');
}

/* ---------- Sequence ---------- */
const PHASES = [
  {id: 'expose', d: 3.4}, {id: 'wafer', d: 2.8}, {id: 'die', d: 4.4}, {id: 'bond', d: 3.6}, {id: 'mold', d: 2.8}, {id: 'board', d: 4.4}, {id: 'dawn', d: 999},
];
function phaseAt(t) {
  for (const p of PHASES) { if (t < p.d) return [p.id, t, p.d]; t -= p.d; }
  return ['dawn', t, 999];
}

function draw(c, t, frame, lang, texts) {
  ledMax = texts && texts.leds !== undefined ? texts.leds : 8;
  ctx = c; F = frame;
  const [id, u, d] = phaseAt(t), k = clamp(u / Math.min(d, 99), 0, 1);
  R('#05070c', 0, 0, W, H);
  if (id === 'expose') {
    const wx = W / 2, wy = 200;
    dot(wx, wy, 112, '#5a6270'); dot(wx, wy, 108, '#d99a32');
    for (let i = 0; i < 8; i++) {
      const arrive = 0.25 + i * 0.32, kk = ease((u - arrive) / 0.4);
      if (u < arrive) continue;
      reticle(ctx, lerp(40 + i * 70, wx - 40 + i * 4, kk), lerp(-60, 50 + i * 3, kk), 80, i);
    }
    if (u > 3.0) { ctx.fillStyle = `rgba(210,190,255,${clamp((3.4 - u) * 3, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
  } else if (id === 'wafer' || id === 'die') {
    const zoom = id === 'wafer' ? 1 + ease(k) * 1.6 : 0;
    if (id === 'wafer') {
      ctx.save(); ctx.translate(W / 2, 190); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -190);
      dot(W / 2, 190, 140, '#5a6270'); dot(W / 2, 190, 136, '#8e99a6');
      // Hundreds of identical chips: one die is drawn once, sharp enough for the zoom, then copied.
      const sprite = dieSprite(), main = ctx;
      for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) {
        const x = W / 2 + i * 15 - 7, y = 190 + j * 15 - 7;
        if (Math.hypot(i * 15, j * 15) < 128) main.drawImage(sprite, x, y, 13, 13);
      }
      ctx = main;
      ctx.restore();
    } else {
      // A slow push towards the whole die.
      const zk = ease(clamp((u - 1.0) / 4, 0, 1)), s = 230 + zk * 40;
      die(ctx, W / 2 - 0.5 * s, 190 - 0.5 * s, s);
    }
  } else if (id === 'bond') {
    pack({wires: ease(k) * 4 * PK.n, mold: 0, mark: 0});
  } else if (id === 'mold') {
    pack({wires: 99, mold: ease(k * 2.5), mark: clamp((u - 1.0) / 1.6, 0, 1)});
  } else if (id === 'board') {
    board(k);
  } else {
    // Dawn over the lake; the three of shift B walk out and fade.
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a2440'); g.addColorStop(0.45, '#c86a4a'); g.addColorStop(0.6, '#f2b26a'); g.addColorStop(1, '#2a2a3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a2034'; ctx.beginPath(); ctx.moveTo(0, 190); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 160 + Math.sin(x / 47) * 16); ctx.lineTo(W, 214); ctx.lineTo(0, 214); ctx.fill();
    dot(470, 200, 26, '#ffd890');
    R('#1a1a28', 0, 214, W, H - 214);
    for (let y = 216; y < H; y += 3) { ctx.fillStyle = `rgba(255,200,120,${0.25 * (1 - (y - 214) / 146)})`; ctx.fillRect(440 + Math.sin(F / 9 + y) * 6, y, 60, 1); }
    R('#14141e', 120, 120, 14, 94); R('#14141e', 116, 112, 22, 10);
    const walk = clamp(u / 8, 0, 1);
    [0, 1, 2].forEach(i => {
      const x = 250 + i * 34 + walk * 140, a = clamp(1 - walk * 1.1 + i * 0.05, 0, 1);
      ctx.globalAlpha = a * 0.85;
      R('#f2ead8', x, 236, 14, 26); R('#f2ead8', x + 1, 224, 12, 12); R('#2a1e0a', x + 3, 228, 8, 3);
      R('#e2d8c0', x + 2, 262, 4, 12); R('#e2d8c0', x + 8, 262, 4, 12);
      ctx.globalAlpha = 1;
    });
    texts.log[lang].forEach((l, i) => {
      const shown = Math.floor(u * 24) - i * 12;
      if (shown > 0) txt(l.slice(0, shown), W / 2, 58 + i * 16, 12, i >= 3 ? '#fff4d8' : '#f2e6d0', {font: 'IBM Plex Sans'});
    });
    if (u > 5) {
      ctx.save(); ctx.translate(W / 2 - 34, 296); ctx.scale(0.16, 0.16); ctx.translate(-PK.cx, -PK.cy); pack({wires: 99, mold: 1, mark: 1}); ctx.restore();
      txt(lang === 'de' ? 'ODENCHIP FREIGESCHALTET' : 'ODENCHIP UNLOCKED', W / 2 + 40, 290, 8, '#ffd27a', {align: 'left'});
      txt('odenwaeller.org/spiele/elektron', W / 2 + 40, 302, 8, '#c9c2ae', {align: 'left'});
    }
  }
  // Grain, bars, caption.
  for (let i = 0; i < 160; i++) R(`rgba(255,255,255,${hash(i + frame) * 0.05})`, hash(i * 3 + frame) * W, hash(i * 7 + frame) * H, 1, 1);
  R('#000', 0, 0, W, BAR); R('#000', 0, H - BAR, W, BAR);
  const cap = texts.caps[id];
  if (cap) txt(cap[lang], W / 2, H - BAR + 12, 12, '#c9c8cf', {font: 'IBM Plex Sans', max: W - 40});
  const fadeIn = clamp(u / 0.5, 0, 1);
  if (fadeIn < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fadeIn})`; ctx.fillRect(0, 0, W, H); }
}

const TOTAL = PHASES.slice(0, -1).reduce((a, p) => a + p.d, 0);
window.SchichtOdenchip = {die, reticle, pack, draw, phaseAt, TOTAL, PK};
})();
