/* Schichtwechsel - process close-ups. When lot 4471 reaches a station, a window shows what the tool does
 * to the wafer: spin coating, exposure through a reticle, development down to 40 nm lines, and the later
 * steps as animated cross-sections. Drawn in interface coordinates (320 x 180). */
(() => {
'use strict';
const W = 320, PX = 44, PY = 18, PW = 232, PH = 132;
let ctx, F = 0;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function circle(c, x, y, r) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fill(); }
function text(s, x, y, o = {}) {
  ctx.font = `${o.weight || 400} ${o.size || 8}px "${o.font || 'Silkscreen'}", monospace`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = o.color || '#e9e4d6'; ctx.fillText(s, Math.round(x), Math.round(y), o.max || 300);
}
const CAP = {
  coat: {de: ['BELACKEN · SPIN-COATING', 'Lack auf die Mitte, dann 3000 U/min. Dicke ∝ 1/√ω: hier 1,2 µm.'],
    en: ['COAT · SPIN COATING', 'Resist on the centre, then 3000 rpm. Thickness ∝ 1/√ω: here 1.2 µm.']},
  expose: {de: ['BELICHTEN · 193 NM, RETIKEL 4:1', 'Das Retikel scannt, der Wafertisch läuft gegenläufig. Feld für Feld.'],
    en: ['EXPOSE · 193 NM, RETICLE 4:1', 'The reticle scans, the wafer stage moves the other way. Field by field.']},
  develop: {de: ['ENTWICKELN', 'Belichteter Lack löst sich im Entwickler. Übrig bleiben Linien von 40 nm.'],
    en: ['DEVELOP', 'Exposed resist dissolves in the developer. What remains: 40 nm lines.']},
  etch: {de: ['ÄTZEN · PLASMA', 'Ionen fallen senkrecht durch die Lackmaske und tragen das Oxid ab.'],
    en: ['ETCH · PLASMA', 'Ions fall straight through the resist mask and remove the oxide.']},
  strip: {de: ['LACK ENTFERNEN · SAUERSTOFFPLASMA', 'Der Lack verascht zu CO₂ und Wasser. Das Muster bleibt im Oxid.'],
    en: ['STRIP RESIST · OXYGEN PLASMA', 'The resist burns off as CO₂ and water. The pattern stays in the oxide.']},
  implant: {de: ['IMPLANTIEREN · ARSEN, 40 KEV', 'Ionen schlagen unter 7° ins Silizium, nur dort, wo das Oxid offen ist.'],
    en: ['IMPLANT · ARSENIC, 40 KEV', 'Ions strike the silicon at 7°, only where the oxide is open.']},
  anneal: {de: ['AUSHEILEN · 1050 °C', 'Das Gitter heilt aus, die Dotierung wandert: Länge ≈ 2·√(D·t).'],
    en: ['ANNEAL · 1050 °C', 'The lattice heals and the dopant spreads: length ≈ 2·√(D·t).']},
  deposit: {de: ['OXID ABSCHEIDEN · CVD', 'Moleküle aus dem Gas wachsen Lage für Lage über die Stufen.'],
    en: ['DEPOSIT OXIDE · CVD', 'Molecules from the gas grow layer by layer over the steps.']},
  contacts: {de: ['KONTAKTE ÄTZEN', 'Senkrechte Löcher durch das Oxid, bis hinunter auf die Dotierung.'],
    en: ['ETCH CONTACTS', 'Straight holes through the oxide, down onto the doped silicon.']},
  sputter: {de: ['SPUTTERN · ALUMINIUM', 'Argon schlägt Atome aus dem Target. Im Vakuum fliegen sie geradeaus.'],
    en: ['SPUTTER · ALUMINIUM', 'Argon knocks atoms out of the target. In vacuum they fly straight.']},
  measure: {de: ['MESSEN · CD-SEM', 'Der Elektronenstrahl rastert die Linien ab. Breite: 40,2 nm.'],
    en: ['MEASURE · CD-SEM', 'The electron beam scans the lines. Width: 40.2 nm.']},
};

function wafer(cx, cy, r, film, rot) {
  circle('#5a6270', cx, cy, r + 1);
  circle('#c9ced6', cx, cy, r);
  if (film) film();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0);
  R('#0b0f18', -2, r - 2, 4, 3);
  ctx.restore();
}

/* ---------- Lithography from the top ---------- */
function coat(t, x, y, w, h) {
  const cx = x + w / 2 - 30, cy = y + h / 2 + 4, r = 42;
  const spin = t < 60 ? 0 : Math.min(1, (t - 60) / 40), rot = F * 0.4 * spin;
  const spread = t < 30 ? 0 : t < 60 ? ease((t - 30) / 30) * 12 : 12 + ease((t - 60) / 90) * (r - 12);
  wafer(cx, cy, r, () => {
    // Interference colours run outward while the film thins.
    const rings = ['#c0392b', '#d98a1e', '#8bbf3a', '#3a8fd0', '#9a4ac8'];
    for (let i = rings.length - 1; i >= 0; i--) {
      const rr = spread * (1 - i * 0.12 * (t > 140 ? 0.3 : 1));
      if (rr > 0) { ctx.globalAlpha = 0.55; circle(rings[(i + Math.floor(t / 20)) % rings.length], cx, cy, rr); }
    }
    ctx.globalAlpha = 1;
    if (spread > 0) { ctx.globalAlpha = 0.7; circle('#d99a32', cx, cy, spread * 0.92); ctx.globalAlpha = 1; }
  }, rot);
  if (spin > 0) for (let i = 0; i < 4; i++) {
    const a = rot + i * Math.PI / 2;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, a, a + 0.5); ctx.stroke();
  }
  if (t > 80 && t < 170) for (let i = 0; i < 8; i++) {
    const a = rot * 1.3 + i * 0.8, d = r + ((t * 2 + i * 9) % 30);
    circle('#d99a32', cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.2);
  }
  // Dispense arm with nozzle and drop.
  const armX = t < 30 ? cx + 90 - ease(t / 30) * 90 : t < 70 ? cx : cx + ease((t - 70) / 30) * 90;
  R('#7c8693', armX, cy - r - 14, x + w - armX, 4); R('#4a525e', armX - 3, cy - r - 16, 6, 10);
  if (t > 28 && t < 62) for (let i = 0; i < 4; i++) circle('#d99a32', cx, cy - r - 4 + ((t * 3 + i * 9) % (r + 4)), 1.5);
  const rpm = Math.round(spin * 3000);
  text(`${rpm} ${lang === 'de' ? 'U/MIN' : 'RPM'}`, x + w - 62, y + 10, {color: '#7fd0ff'});
  text('1,2 µm', x + w - 62, y + 22, {color: t > 150 ? '#ffcf5a' : '#4a5470'});
}

function fieldsGrid(cx, cy, r) {
  const out = [], n = 7, s = (2 * r) / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const fx = cx - r + i * s, fy = cy - r + j * s;
    if (Math.hypot(fx + s / 2 - cx, fy + s / 2 - cy) < r - s * 0.45) out.push({fx, fy, s, j, i: j % 2 ? n - 1 - i : i});
  }
  return out.sort((a, b) => a.j - b.j || a.i - b.i);
}

function expose(t, x, y, w, h) {
  // Side view: laser, reticle with chrome, projection lens, wafer stage.
  const sx = x + 8, sw = 104, mid = sx + sw / 2;
  const pulse = (F >> 1) % 2;
  R('#3a2a6a', mid - 20, y + 6, 40, 12); text('193 NM', mid, y + 8, {align: 'center', color: '#d6c8ff'});
  const scan = Math.sin(t / 12) * 14;
  R('#cfe8ff', sx + 8 + scan, y + 32, sw - 16, 6);
  for (let i = 0; i < 8; i++) if (i % 3 !== 1) R('#1a1e24', sx + 12 + scan + i * 10, y + 32, 6, 6);
  text(lang === 'de' ? 'RETIKEL' : 'RETICLE', sx, y + 22, {color: '#9aa6b5'});
  ctx.fillStyle = 'rgba(200,220,255,.85)'; ctx.beginPath(); ctx.ellipse(mid, y + 62, 34, 6, 0, 0, 7); ctx.fill();
  text(lang === 'de' ? 'OBJEKTIV' : 'LENS', sx, y + 70, {color: '#9aa6b5'});
  ctx.strokeStyle = `rgba(170,120,255,${pulse ? 0.9 : 0.4})`; ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) if (i % 3 !== 1) {
    const rx = sx + 15 + scan + i * 10;
    ctx.beginPath(); ctx.moveTo(rx, y + 18); ctx.lineTo(rx, y + 32); ctx.moveTo(rx, y + 38); ctx.lineTo(mid + (rx - mid) * 0.5, y + 62); ctx.lineTo(mid + (rx - mid) * 0.12 - scan * 0.25, y + 96); ctx.stroke();
  }
  R('#5a6270', sx + 10 - scan * 0.25, y + 100, sw - 20, 8); R('#d99a32', sx + 10 - scan * 0.25, y + 96, sw - 20, 4);
  text(lang === 'de' ? 'WAFERTISCH' : 'WAFER STAGE', mid, y + 110, {align: 'center', color: '#9aa6b5'});
  // Top view: fields exposed one after another.
  const cx = x + w - 54, cy = y + h / 2 + 2, r = 44, fields = fieldsGrid(cx, cy, r);
  const done = Math.floor(clamp((t - 10) / 170, 0, 1) * fields.length);
  wafer(cx, cy, r, () => {
    circle('#d99a32', cx, cy, r - 1);
    fields.forEach((f, i) => {
      if (i < done) { R('rgba(120,70,200,.55)', f.fx + 1, f.fy + 1, f.s - 2, f.s - 2); }
      if (i === done && pulse) R('rgba(220,200,255,.95)', f.fx + 1, f.fy + 1, f.s - 2, f.s - 2);
    });
  });
}

function develop(t, x, y, w, h) {
  const cx = x + 66, cy = y + h / 2 + 2, r = 46, fields = fieldsGrid(cx, cy, r), k = ease((t - 20) / 120);
  wafer(cx, cy, r, () => {
    circle('#d99a32', cx, cy, r - 1);
    fields.forEach(f => {
      for (let i = 0; i < 4; i++) {
        // Lines appear where the exposed resist dissolves.
        ctx.globalAlpha = k; R('#5a6270', f.fx + 2 + i * (f.s / 4), f.fy + 2, Math.max(1, f.s / 8), f.s - 4); ctx.globalAlpha = 1;
      }
    });
    if (t < 140) { ctx.globalAlpha = 0.3 * (1 - k); circle('#7fc8ff', cx, cy, r - 1); ctx.globalAlpha = 1; }
  });
  // Zoom into one die: lines and spaces like an SEM image, with the measured width.
  const zx = x + 128, zy = y + 18, zw = 94, zh = 82, z = ease((t - 110) / 60);
  if (z > 0) {
    ctx.strokeStyle = '#7fd0ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + 10, cy - 6); ctx.lineTo(zx, zy + zh / 2); ctx.stroke();
    R('#0b0f18', zx - 1, zy - 1, zw + 2, zh + 2);
    ctx.globalAlpha = z;
    R('#2a2f38', zx, zy, zw, zh);
    for (let i = 0; i < 6; i++) {
      const lx = zx + 6 + i * 15;
      R('#9aa3ad', lx, zy + 2, 7, zh - 4); R('#d6dbe2', lx, zy + 2, 1, zh - 4); R('#d6dbe2', lx + 6, zy + 2, 1, zh - 4);
    }
    for (let i = 0; i < 300; i++) R(`rgba(255,255,255,${((i * 7919) % 13) / 60})`, zx + (i * 37) % zw, zy + (i * 61) % zh, 1, 1);
    R('#ffcf5a', zx + 36, zy + zh / 2, 7, 1); R('#ffcf5a', zx + 36, zy + zh / 2 - 3, 1, 7); R('#ffcf5a', zx + 42, zy + zh / 2 - 3, 1, 7);
    text('40 nm', zx + 46, zy + zh / 2 - 4, {color: '#ffcf5a'});
    ctx.globalAlpha = 1;
  }
}

/* ---------- Cross-sections for the later steps ---------- */
function section(t, x, y, w, h, type) {
  const bx = x + 14, bw = w - 28, si = y + h - 34, holes = [0.2, 0.5, 0.8].map(f => bx + f * bw - 9);
  const k = ease((t - 20) / 140);
  R('#4f5866', bx, si, bw, 30);
  for (let yy = si + 4; yy < si + 30; yy += 5) for (let xx = bx + 2 + (yy % 10 ? 2 : 0); xx < bx + bw; xx += 5) R('#5d6775', xx, yy, 1, 1);
  text('Si', bx + 4, si + 18, {color: '#c9ced6'});
  const ox = 10, oxTop = si - ox;
  const doped = (depth, wide) => holes.forEach(hx => { ctx.fillStyle = 'rgba(150,100,230,.85)'; ctx.beginPath(); ctx.ellipse(hx + 9, si, 9 + wide, depth, 0, 0, Math.PI); ctx.fill(); });
  const oxide = (open) => { R('#cfe8ff', bx, oxTop, bw, ox); if (open) holes.forEach(hx => R('#0b0f18', hx, oxTop, 18, ox * open)); };
  const resist = (amount, gaps) => { R('#d99a32', bx, oxTop - 12 * amount, bw, 12 * amount); if (gaps) holes.forEach(hx => R('#0b0f18', hx, oxTop - 12, 18, 12)); };
  const rain = (col, n, slant = 0, until = oxTop) => {
    for (let i = 0; i < n; i++) {
      const px = bx + ((i * 47) % bw), py = y + 10 + ((F * 3 + i * 23) % (until - y - 10));
      circle(col, px + (py - y) * slant, py, 1.2);
    }
  };
  switch (type) {
    case 'etch': {
      R('#cfe8ff', bx, oxTop, bw, ox); holes.forEach(hx => R('#0b0f18', hx, oxTop, 18, ox * k)); resist(1, true);
      rain('#c890ff', 40); ctx.fillStyle = 'rgba(190,110,255,.12)'; ctx.fillRect(bx, y + 8, bw, oxTop - y - 20); break;
    }
    case 'strip': {
      oxide(1); resist(1 - k, true);
      for (let i = 0; i < 25; i++) circle('rgba(160,200,255,.8)', bx + (i * 31) % bw, oxTop - 14 - ((F + i * 13) % 40), 1);
      text('CO₂ + H₂O', bx + bw - 60, y + 12, {color: '#9fc8ff'}); break;
    }
    case 'implant': oxide(1); doped(4 + 8 * k, 0); rain('#9cff9c', 40, 0.12); break;
    case 'anneal': {
      oxide(1); doped(12 + 6 * k, 6 * k);
      ctx.fillStyle = `rgba(255,120,30,${0.18 + 0.15 * Math.sin(F / 6)})`; ctx.fillRect(bx, y + 8, bw, h - 18);
      text('1050 °C', bx + bw - 54, y + 12, {color: '#ffb070'}); break;
    }
    case 'deposit': {
      oxide(1); doped(18, 6);
      const top = oxTop - 22 * k; R('#a9cbe6', bx, top, bw, oxTop - top);
      rain('#d8ecff', 30, 0, top); break;
    }
    case 'contacts': {
      oxide(1); doped(18, 6); R('#a9cbe6', bx, oxTop - 22, bw, 22);
      holes.forEach(hx => R('#0b0f18', hx + 5, oxTop - 22, 8, (22 + ox) * k));
      rain('#c890ff', 30); break;
    }
    case 'sputter': {
      oxide(1); doped(18, 6); R('#a9cbe6', bx, oxTop - 22, bw, 22); holes.forEach(hx => R('#c9ced6', hx + 5, oxTop - 22, 8, (22 + ox) * Math.min(1, k * 1.5)));
      R('#c9ced6', bx, oxTop - 22 - 8 * k, bw, 8 * k);
      R('#7c8693', bx + 20, y + 6, bw - 40, 8); text('AL TARGET', bx + bw / 2, y + 6, {align: 'center', color: '#1a1e24'});
      for (let i = 0; i < 30; i++) R('#e6e9ee', bx + 22 + (i * 37) % (bw - 44), y + 16 + ((F * 2 + i * 17) % (oxTop - y - 50)), 1, 2);
      for (let i = 0; i < 10; i++) circle('#c890ff', bx + 30 + (i * 53) % (bw - 60), y + 14 + ((F * 3 + i * 11) % 20), 1.3);
      break;
    }
    default: oxide(1); rain('#9fc8ff', 20);
  }
}

function measure(t, x, y, w, h) {
  const zx = x + 20, zy = y + 10, zw = w - 40, zh = h - 22, scan = Math.floor(clamp(t / 140, 0, 1) * zh);
  R('#101317', zx, zy, zw, zh);
  for (let yy = 0; yy < scan; yy++) {
    for (let i = 0; i < 7; i++) {
      const lx = zx + 8 + i * 28;
      R('#8e98a3', lx, zy + yy, 12, 1); R('#dfe4ea', lx, zy + yy, 1, 1); R('#dfe4ea', lx + 11, zy + yy, 1, 1);
    }
    if (yy % 3 === 0) R(`rgba(255,255,255,${((yy * 7) % 9) / 90})`, zx, zy + yy, zw, 1);
  }
  if (scan < zh) R('#7fd0ff', zx, zy + scan, zw, 1);
  else {
    const lx = zx + 8 + 3 * 28;
    R('#ffcf5a', lx, zy + zh / 2, 12, 1); R('#ffcf5a', lx, zy + zh / 2 - 6, 1, 13); R('#ffcf5a', lx + 11, zy + zh / 2 - 6, 1, 13);
    R('rgba(10,14,20,.85)', lx + 16, zy + zh / 2 - 8, 74, 14);
    text('CD = 40,2 nm', lx + 20, zy + zh / 2 - 5, {color: '#ffcf5a'});
  }
}

let lang = 'de';
function drawReticleFound(t, info) {
  const appear = ease(t / 14), y0 = PY + (1 - appear) * 20;
  ctx.fillStyle = `rgba(3,4,8,${0.55 * appear})`; ctx.fillRect(0, 0, W, 180);
  R('#0b0f18', PX - 2, y0 - 2, PW + 4, PH + 4); R('#7fd0ff', PX - 2, y0 - 2, PW + 4, 1);
  R('#141a28', PX, y0, PW, 12);
  text(lang === 'de' ? `RETIKEL · MASKE FÜR SCHICHT ${info.n}` : `RETICLE · MASK FOR LAYER ${info.n}`, PX + 6, y0 + 2, {color: '#9fe0ff'});
  text(`${info.found}/${info.total}`, PX + PW - 6, y0 + 2, {align: 'right', color: '#ffcf5a'});
  R('#0d111a', PX, y0 + 12, PW, PH - 28);
  const s = 64 + Math.sin(t / 20) * 2, cx = PX + PW / 2, cy = y0 + 12 + (PH - 28) / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t / 40) * 0.08); ctx.translate(-s / 2, -s / 2);
  window.SchichtOdenchip.reticle(ctx, 0, 0, s, info.n);
  ctx.restore();
  for (let i = 0; i < 6; i++) { const a = t / 15 + i; R('#e6f6ff', cx + Math.cos(a) * 44, cy + Math.sin(a * 1.3) * 34, 1, 1); }
  R('#141a28', PX, y0 + PH - 16, PW, 16);
  text(lang === 'de' ? 'Jede Schicht braucht ihre eigene Maske. Chrom auf Quarz, 4:1.' : 'Every layer needs its own mask. Chrome on quartz, 4:1.', PX + 6, y0 + PH - 12, {font: 'IBM Plex Sans', size: 7, color: '#c9c8cf', max: PW - 12});
  if (t > 40 && (t >> 5) % 2) text(lang === 'de' ? 'SHIFT: WEITER' : 'SHIFT: CONTINUE', W / 2, y0 + PH + 6, {align: 'center', color: '#6b7190'});
}
function draw(c, type, t, language, info) {
  ctx = c; F = t; lang = language;
  if (type === 'reticle') return drawReticleFound(t, info || {n: 1, found: 1, total: 8});
  const appear = ease(t / 14), cap = (CAP[type] || CAP.etch)[language];
  ctx.fillStyle = `rgba(3,4,8,${0.55 * appear})`; ctx.fillRect(0, 0, W, 180);
  const y0 = PY + (1 - appear) * 20;
  R('#0b0f18', PX - 2, y0 - 2, PW + 4, PH + 4); R('#2f6db3', PX - 2, y0 - 2, PW + 4, 1);
  R('#141a28', PX, y0, PW, 12);
  text(cap[0], PX + 6, y0 + 2, {color: '#9fe0ff', max: PW - 60});
  text('LOT 4471', PX + PW - 6, y0 + 2, {align: 'right', color: '#ffcf5a'});
  ctx.save(); ctx.beginPath(); ctx.rect(PX, y0 + 12, PW, PH - 28); ctx.clip();
  R('#0d111a', PX, y0 + 12, PW, PH - 28);
  const fn = {coat, expose, develop, measure}[type];
  if (fn) fn(t, PX, y0 + 12, PW, PH - 28); else section(t, PX, y0 + 12, PW, PH - 28, type);
  ctx.restore();
  R('#141a28', PX, y0 + PH - 16, PW, 16);
  text(cap[1], PX + 6, y0 + PH - 12, {font: 'IBM Plex Sans', size: 7, color: '#c9c8cf', max: PW - 12});
  if (t > 40 && (t >> 5) % 2) text(language === 'de' ? 'SHIFT: WEITER' : 'SHIFT: CONTINUE', W / 2, y0 + PH + 6, {align: 'center', color: '#6b7190'});
}

window.SchichtProcess = {draw, DURATION: 230};
})();
