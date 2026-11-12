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
  clean: {de: ['REINIGEN · RCA', 'SC-1 hebt Partikel ab, SC-2 löst Metalle, HF nimmt das native Oxid.'],
    en: ['CLEAN · RCA', 'SC-1 lifts particles, SC-2 dissolves metals, HF strips the native oxide.']},
  inspect: {de: ['PRÜFEN · PARTIKELMESSUNG', 'Ein Laser fährt spiralförmig über den Wafer. Jedes Streulicht ist ein Partikel.'],
    en: ['INSPECT · PARTICLE SCAN', 'A laser spirals across the wafer. Every flash of scattered light is a particle.']},
  oxidize: {de: ['OXIDIEREN · 1000 °C, TROCKEN', 'O₂ wandert durchs Oxid zum Silizium. 44 % der Schicht wachsen nach unten.'],
    en: ['OXIDISE · 1000 °C, DRY', 'O₂ diffuses through the oxide to the silicon. 44 % of the film grows downward.']},
  nitride: {de: ['NITRID · LPCVD, 780 °C', 'Bei 0,3 mbar erreicht das Gas alle 100 Wafer gleich. Si₃N₄ wächst Lage für Lage.'],
    en: ['NITRIDE · LPCVD, 780 °C', 'At 0.3 mbar the gas reaches all 100 wafers alike. Si₃N₄ grows layer by layer.']},
  ellipso: {de: ['SCHICHTDICKE · ELLIPSOMETER', 'Polarisiertes Licht kommt elliptisch zurück. Daraus folgen beide Dicken.'],
    en: ['FILM THICKNESS · ELLIPSOMETER', 'Polarised light comes back elliptical. Both thicknesses follow from it.']},
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
  measure: {de: ['MESSEN · CD-SEM', 'Der Elektronenstrahl rastert die Linien ab. Ziel: 40 nm Breite.'],
    en: ['MEASURE · CD-SEM', 'The electron beam scans the lines. Target: 40 nm wide.']},
};

function wafer(cx, cy, r, film, rot) {
  circle('#5a6270', cx, cy, r + 1);
  circle('#c9ced6', cx, cy, r);
  if (film) film();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0);
  R('#0b0f18', -2, r - 2, 4, 3);
  ctx.restore();
}

/* ---------- Front end: clean, inspect, oxidise, nitride, measure the films ---------- */
// What the measuring stations find depends on how the played steps went (lot.s scores, lot.v values).
let lotInfo = null;
const sc = k => lotInfo && lotInfo.s && lotInfo.s[k] !== undefined ? lotInfo.s[k] : null;
const val = (k, d) => lotInfo && lotInfo.v && lotInfo.v[k] !== undefined ? lotInfo.v[k] : d;
const fmt = (v, d = 1) => v.toFixed(d).replace('.', lang === 'de' ? ',' : '.');
function verdict(s, x, y) {
  if (s === null || !window.SchichtMini) return;
  const g = window.SchichtMini.grade(s);
  text(g.word, x, y, {align: 'center', color: g.color, size: 8});
}
function cdOf() {
  const e = sc('expose'), c = sc('coat'), t = sc('etch');
  return 40.2 + 9 * (1 - (e === null ? 1 : e)) + 4 * (1 - (c === null ? 1 : c)) + 5 * (1 - (t === null ? 1 : t));
}
// RCA clean, side view of four baths with the carrier travelling along; below, the surface magnified.
function clean(t, x, y, w, h) {
  const baths = [['SC-1', '#bfe3d0', '75 °C'], ['SC-2', '#dfe8b8', '75 °C'], ['HF 1%', '#cfe3f5', '22 °C'], [lang === 'de' ? 'SPÜLEN' : 'RINSE', '#d4e6fa', 'DIW']];
  const tw = (w - 20) / 4, ty = y + 22, th = 30, phase = Math.min(3, Math.floor(t / 55)), pt = t - phase * 55;
  R('#7c8693', x + 6, y + 6, w - 12, 2);
  baths.forEach(([name, col, temp], i) => {
    const bx = x + 10 + i * tw;
    R('#5a6270', bx, ty, tw - 6, th); R(col, bx + 2, ty + 6, tw - 10, th - 8);
    text(name, bx + (tw - 6) / 2, ty + th + 2, {align: 'center', color: i === phase ? '#ffcf5a' : '#6b7190', max: tw - 6});
    text(temp, bx + (tw - 6) / 2, y + 12, {align: 'center', color: '#4a5470', font: 'IBM Plex Sans', size: 6, max: tw - 6});
    if (i === phase && pt > 12 && pt < 46) for (let k = 0; k < 6; k++) circle('rgba(255,255,255,.75)', bx + 6 + ((k * 7 + F) % (tw - 16)), ty + th - 4 - ((F * 0.7 + k * 9) % (th - 10)), 1);
  });
  // The carrier: down into the bath, wait, up, over to the next.
  const from = x + 10 + phase * tw + (tw - 6) / 2, to = x + 10 + Math.min(3, phase + 1) * tw + (tw - 6) / 2;
  // Gently: down, wait in the bath, up, and a calm glide to the next bath.
  const glide = k => k * k * (3 - 2 * clamp(k, 0, 1));
  const cx = pt > 43 && phase < 3 ? from + (to - from) * glide(clamp((pt - 43) / 12, 0, 1)) : from;
  const dip = pt < 14 ? glide(pt / 14) : pt < 35 ? 1 : pt < 43 ? 1 - glide((pt - 35) / 8) : 0;
  const cy = y + 8 + dip * 18;
  R('#9aa3ad', cx - 1, y + 7, 2, cy - y - 6);
  R('#4a525e', cx - 11, cy, 22, 18); for (let k = 0; k < 6; k++) R('#c9ced6', cx - 9 + k * 3.5, cy + 2, 1, 14);
  // Magnified surface: particles lift, metals dissolve, the native oxide goes, water runs off.
  const zy = y + 70, zh = h - 72, zx = x + 10, zw = w - 20;
  R('#141a28', zx, zy, zw, zh); R('#4f5866', zx, zy + zh - 10, zw, 10);
  const oxide = phase < 2 ? 3 : phase === 2 ? 3 * (1 - clamp(pt / 40, 0, 1)) : 0;
  if (oxide > 0) R('#9fc8ff', zx, zy + zh - 10 - oxide, zw, oxide);
  for (let k = 0; k < 7; k++) {
    const px = zx + 14 + k * (zw - 28) / 6, lift = phase > 0 ? 1 : clamp((pt - 14 - k * 3) / 30, 0, 1);
    if (lift < 1) { ctx.globalAlpha = 1 - lift; circle('#8a7a5a', px, zy + zh - 13 - oxide - lift * 18, 2 + (k % 3)); ctx.globalAlpha = 1; }
    const gone = phase > 1 ? 1 : phase === 1 ? clamp((pt - 10 - k * 3) / 25, 0, 1) : 0;
    if (gone < 1) { ctx.globalAlpha = 1 - gone; R(['#e0402a', '#ffcf5a', '#7fd0ff'][k % 3], px + 7, zy + zh - 12 - oxide - gone * 10, 2, 2); ctx.globalAlpha = 1; }
  }
  if (phase === 3) for (let k = 0; k < 5; k++) { const dx = (pt * (1.5 + k * 0.4) + k * 40) % zw; circle('rgba(160,200,255,.8)', zx + dx, zy + zh - 13, 2); }
  if (phase >= 2 && (phase > 2 || pt > 30)) for (let k = 0; k < zw; k += 6) R('#c9ced6', zx + k, zy + zh - 12, 1, 2);
  const label = {de: ['SC-1 LÖST PARTIKEL', 'SC-2 LÖST METALLE', 'HF NIMMT DAS OXID', 'SPÜLEN, TROCKENSCHLEUDERN'], en: ['SC-1 LIFTS PARTICLES', 'SC-2 DISSOLVES METALS', 'HF STRIPS THE OXIDE', 'RINSE, SPIN DRY']}[lang][phase];
  text(label, zx + 4, zy + 2, {color: '#9fe0ff', max: zw - 60});
  text('×1 000 000', zx + zw - 4, zy + 2, {align: 'right', color: '#4a5470'});
}

// Laser particle scan: a spot spirals out over the spinning wafer; the map fills in as it goes.
function dustOf() {
  const n = Math.round(val('particles', 3)), out = [];
  for (let i = 0; i < Math.min(n, 40); i++) out.push([0.15 + 0.8 * ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1, i * 2.39996]);
  return out.sort((p, q) => p[0] - q[0]);
}
function inspect(t, x, y, w, h) {
  const DUST = dustOf();
  const cx = x + 62, cy = y + h / 2 + 2, r = 44, k = clamp((t - 10) / 180, 0, 1), rot = F * 0.35;
  wafer(cx, cy, r, null, rot);
  const sr = k * (r - 3), sa = rot * 3;
  const spx = cx + Math.cos(sa) * sr, spy = cy + Math.sin(sa) * sr;
  ctx.strokeStyle = 'rgba(120,220,255,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(spx, spy); ctx.stroke();
  circle('#d8f6ff', spx, spy, 1.5);
  DUST.forEach(([dr, da]) => { if (Math.abs(dr * (r - 3) - sr) < 2.5 && k < 1) { circle('rgba(255,255,255,.55)', spx, spy, 6); } });
  R('#3a4058', x + 2, y + 2, 10, 7); text(lang === 'de' ? 'LASER 355 NM' : 'LASER 355 NM', x + 14, y + 2, {color: '#4a5470'});
  // The map.
  const mx = x + w - 62, my = cy, mr = 40;
  circle('#1a2438', mx, my, mr + 1); circle('#0b1220', mx, my, mr);
  ctx.fillStyle = 'rgba(60,120,180,.35)'; ctx.beginPath(); ctx.arc(mx, my, k * mr, 0, 7); ctx.fill();
  let found = 0;
  DUST.forEach(([dr, da]) => { if (dr <= k) { found++; R('#ff5a3a', mx + Math.cos(da) * dr * mr - 1, my + Math.sin(da) * dr * mr - 1, 3, 3); } });
  text(lang === 'de' ? `PARTIKEL ≥ 26 NM: ${found}` : `PARTICLES ≥ 26 NM: ${found}`, mx, y + 4, {align: 'center', color: '#c9c2ae', max: 120});
  if (k >= 1) {
    if (sc('clean') === null) text(lang === 'de' ? 'SAUBER GENUG · OK' : 'CLEAN ENOUGH · OK', mx, y + h - 12, {align: 'center', color: '#3fe06a'});
    else verdict(sc('clean'), mx, y + h - 12);
  }
}

// A vertical furnace from the side: heater coils, quartz tube, the boat of wafers rising in.
function furnaceSide(t, x, y, h, temp, glowCol) {
  const fx = x + 18, fw = 64, top = y + 6, bot = y + h - 6, rise = ease(t / 60);
  R('#3a2a1a', fx, top, fw, bot - top - 16);
  const heat = clamp((t - 50) / 60, 0, 1);
  for (let yy = top + 4; yy < bot - 22; yy += 5) R(heat > 0 ? `rgba(255,${120 + 60 * (1 - heat)},40,${0.35 + 0.5 * heat})` : '#5a3a20', fx + 3, yy, fw - 6, 2);
  R('rgba(200,230,255,.25)', fx + 12, top + 4, fw - 24, bot - top - 20);
  const by = bot - 18 - rise * (bot - top - 30);
  R('#c9ced6', fx + 18, by - 2, 1, (bot - top) * 0.55); R('#c9ced6', fx + fw - 19, by - 2, 1, (bot - top) * 0.55);
  for (let k = 0; k < 14; k++) R(heat > 0.6 ? '#fff0c8' : '#c9ced6', fx + 19, by + k * 3, fw - 38, 1);
  R('#5a6270', fx + 8, bot - 14, fw - 16, 10);
  text(`${Math.round(400 + (parseInt(temp, 10) - 400) * heat)} °C`, fx + fw / 2, top + 2, {align: 'center', color: glowCol});
  return {fx, fw, top, bot, heat, rise};
}
// Cross-section on the right: silicon, the original surface, films growing.
function stackView(x, y, w, h, films, labels) {
  R('#141a28', x, y, w, h);
  const base = y + h - 22;
  R('#4f5866', x, base, w, 22);
  for (let yy = base + 4; yy < y + h; yy += 5) for (let xx = x + 2 + (yy % 10 ? 2 : 0); xx < x + w; xx += 5) R('#5d6775', xx, yy, 1, 1);
  text('Si', x + 4, y + h - 12, {color: '#c9ced6'});
  let top = base;
  films.forEach(([th, col, below = 0]) => { R(col, x, top - th + below, w, th); top -= th - below; });
  labels.forEach(([s, yy, col]) => text(s, x + w - 4, yy, {align: 'right', color: col, max: w - 8}));
  return {base, top};
}
function oxidize(t, x, y, w, h) {
  const f = furnaceSide(t, x, y, h, '1000', '#ffb070');
  for (let k = 0; k < 6; k++) circle('rgba(160,220,255,.8)', f.fx + 20 + ((k * 11) % 24), f.top + 6 + ((F * 1.2 + k * 13) % (f.bot - f.top - 30)), 1);
  text('O₂', f.fx + f.fw + 4, f.top + 4, {color: '#9fe0ff'});
  // Deal-Grove: linear at first, then parabolic. 44 % of the oxide lies below the old surface.
  const k = clamp((t - 70) / 150, 0, 1), d = (Math.sqrt(1 + 6 * k) - 1) / (Math.sqrt(7) - 1), px = x + 116, pw = w - 122;
  const oxPx = 26 * d, st = stackView(px, y + 34, pw, h - 38, [[oxPx, '#cfe8ff', oxPx * 0.44]], []);
  ctx.strokeStyle = '#ffcf5a'; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.moveTo(px, st.base + 0.5); ctx.lineTo(px + pw, st.base + 0.5); ctx.stroke(); ctx.setLineDash([]);
  text(lang === 'de' ? 'ALTE OBERFLÄCHE' : 'OLD SURFACE', px + 4, st.base - 9, {color: '#ffcf5a', size: 8});
  if (d > 0.08) text(`SiO₂ ${Math.round(50 * d)} nm`, px + pw - 4, st.top - 10, {align: 'right', color: '#cfe8ff'});
  // The growth curve.
  R('#0b0f18', px, y + 2, pw, 30); text('d(t)', px + 3, y + 3, {color: '#4a5470'});
  ctx.strokeStyle = '#9fe0ff'; ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const kk = i / 40 * k, dd = (Math.sqrt(1 + 6 * kk) - 1) / (Math.sqrt(7) - 1); ctx[i ? 'lineTo' : 'moveTo'](px + 4 + kk * (pw - 8), y + 29 - dd * 22); }
  ctx.stroke();
}
function nitride(t, x, y, w, h) {
  const f = furnaceSide(t, x, y, h, '780', '#ffcf9a');
  for (let k = 0; k < 10; k++) circle(k % 2 ? 'rgba(120,200,255,.85)' : 'rgba(140,240,160,.85)', f.fx + 20 + ((k * 7) % 24), f.top + 6 + ((F * 0.8 + k * 9) % (f.bot - f.top - 30)), 1);
  text('0,3 mbar', f.fx + f.fw + 4, f.top + 4, {color: '#9aa6b5'});
  const k = clamp((t - 70) / 150, 0, 1), px = x + 116, pw = w - 122;
  const st = stackView(px, y + 22, pw, h - 26, [[6, '#cfe8ff'], [18 * k, '#9fc4a8']], []);
  for (let i = 0; i < 10; i++) {
    const mx = px + 6 + (i * 37) % (pw - 12), fall = (F * 1.5 + i * 17) % 40;
    circle(i % 2 ? '#78c8ff' : '#8cf0a0', mx, st.top - 40 + fall, 1.2);
  }
  text('SiO₂ 50 nm', px + 4, st.base - 6 - 8, {color: '#cfe8ff'});
  if (k > 0.2) text(`Si₃N₄ ${Math.round(100 * k)} nm`, px + pw - 4, st.top - 10, {align: 'right', color: '#bfe6c8'});
  text('3 SiH₂Cl₂ + 4 NH₃ → Si₃N₄', px + pw / 2, y + 4, {align: 'center', color: '#9aa6b5', font: 'IBM Plex Sans', size: 7, max: pw});
}
// Ellipsometry: linear polarisation in, elliptical out; the fit finds both thicknesses.
function ellipso(t, x, y, w, h) {
  const st = stackView(x + 10, y + h - 30, w - 20, 28, [[4, '#cfe8ff'], [7, '#9fc4a8']], []);
  const sx = x + 30, sy = y + 16, ex = x + w - 30, ey = y + 16, hx = x + w / 2, hy = st.top;
  R('#5a6270', sx - 14, sy - 8, 20, 12); R('#5a6270', ex - 6, ey - 8, 20, 12);
  text(lang === 'de' ? 'POLARISATOR' : 'POLARISER', sx - 14, sy + 6, {color: '#6b7190'});
  text(lang === 'de' ? 'ANALYSATOR' : 'ANALYSER', ex + 14, ey + 6, {align: 'right', color: '#6b7190'});
  const k = clamp(t / 40, 0, 1);
  ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (hx - sx) * k, sy + (hy - sy) * k); ctx.stroke();
  if (k >= 1) { const k2 = clamp((t - 40) / 30, 0, 1); ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + (ex - hx) * k2, hy + (ey - hy) * k2); ctx.stroke(); }
  // The polarisation: a line on the way in, an ellipse on the way out.
  const ph = F / 6;
  ctx.strokeStyle = '#ffcf5a'; ctx.beginPath(); ctx.moveTo(sx + 26 - 6 * Math.cos(ph), sy + 14 - 6 * Math.cos(ph)); ctx.lineTo(sx + 26 + 6 * Math.cos(ph), sy + 14 + 6 * Math.cos(ph)); ctx.stroke();
  if (t > 70) { ctx.beginPath(); ctx.ellipse(ex - 26, ey + 14, 8, 4, 0.6, 0, 7); ctx.stroke(); circle('#ffcf5a', ex - 26 + 8 * Math.cos(ph) * 0.8, ey + 14 + 4 * Math.sin(ph) * 0.8, 1.5); }
  const fit = clamp((t - 90) / 100, 0, 1);
  const psi = (12 + 20 * fit + Math.sin(F / 5) * 2 * (1 - fit)).toFixed(1), del = (95 + 60 * fit + Math.cos(F / 4) * 4 * (1 - fit)).toFixed(1);
  text(`Ψ ${psi}°  Δ ${del}°`, x + w / 2, y + 4, {align: 'center', color: '#9fe0ff'});
  if (fit >= 1) {
    const ox = val('oxide', 50.1);
    text(`SiO₂ ${fmt(ox)} nm · Si₃N₄ ${fmt(100.4)} nm`, x + w / 2, y + 15, {align: 'center', color: '#e9e4d6', font: 'IBM Plex Sans', size: 8});
    verdict(sc('oxidize'), x + w / 2, y + 26);
  }
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
  // Pad oxide with the nitride on top, both from the second hour.
  const film = () => { R('#cfe8ff', bx, oxTop + 4, bw, ox - 4); R('#9fc4a8', bx, oxTop, bw, 4); };
  const oxide = (open) => { film(); if (open) holes.forEach(hx => R('#0b0f18', hx, oxTop, 18, ox * open)); };
  const resist = (amount, gaps) => { R('#d99a32', bx, oxTop - 12 * amount, bw, 12 * amount); if (gaps) holes.forEach(hx => R('#0b0f18', hx, oxTop - 12, 18, 12)); };
  const rain = (col, n, slant = 0, until = oxTop) => {
    for (let i = 0; i < n; i++) {
      const px = bx + ((i * 47) % bw), py = y + 10 + ((F * 3 + i * 23) % (until - y - 10));
      circle(col, px + (py - y) * slant, py, 1.2);
    }
  };
  switch (type) {
    case 'etch': {
      film(); holes.forEach(hx => R('#0b0f18', hx, oxTop, 18, ox * k)); resist(1, true);
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
      const lw = Math.round(12 * cdOf() / 40.2);
      R('#8e98a3', lx, zy + yy, lw, 1); R('#dfe4ea', lx, zy + yy, 1, 1); R('#dfe4ea', lx + lw - 1, zy + yy, 1, 1);
    }
    if (yy % 3 === 0) R(`rgba(255,255,255,${((yy * 7) % 9) / 90})`, zx, zy + yy, zw, 1);
  }
  if (scan < zh) R('#7fd0ff', zx, zy + scan, zw, 1);
  else {
    const lx = zx + 8 + 3 * 28;
    R('#ffcf5a', lx, zy + zh / 2, 12, 1); R('#ffcf5a', lx, zy + zh / 2 - 6, 1, 13); R('#ffcf5a', lx + 11, zy + zh / 2 - 6, 1, 13);
    R('rgba(10,14,20,.85)', lx + 16, zy + zh / 2 - 8, 74, 14);
    const cd = cdOf();
    text(`CD = ${fmt(cd)} nm`, lx + 20, zy + zh / 2 - 5, {color: '#ffcf5a'});
    if (sc('expose') !== null || sc('etch') !== null) verdict(1 - Math.abs(cd - 40) / 12, lx + 57, zy + zh / 2 + 10);
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
  if (t > 40) text(lang === 'de' ? 'SHIFT: WEITER' : 'SHIFT: CONTINUE', W / 2, y0 + PH + 6, {align: 'center', color: '#4c5470'});
}
// The animations are written for 230 frames. Each one plays slower than that, so there is time to look:
// the clean takes about ten seconds, one bath after another. At the end the picture rests a moment.
const BASE = 230, HOLD = 150;
const DUR = {clean: 620, inspect: 480, oxidize: 540, nitride: 480, ellipso: 460, reticle: 230};
function duration(type) { return (DUR[type] || 330) + (type === 'reticle' ? 0 : HOLD); }
function draw(c, type, t, language, info) {
  ctx = c; lang = language; lotInfo = info && info.lot;
  if (type === 'reticle') { F = t; return drawReticleFound(t, info || {n: 1, found: 1, total: 8}); }
  const tt = t * BASE / (DUR[type] || 330);
  F = tt;
  const appear = ease(t / 24), cap = (CAP[type] || CAP.etch)[language];
  ctx.fillStyle = `rgba(3,4,8,${0.55 * appear})`; ctx.fillRect(0, 0, W, 180);
  const y0 = PY + (1 - appear) * 20;
  R('#0b0f18', PX - 2, y0 - 2, PW + 4, PH + 4); R('#2f6db3', PX - 2, y0 - 2, PW + 4, 1);
  R('#141a28', PX, y0, PW, 12);
  text(cap[0], PX + 6, y0 + 2, {color: '#9fe0ff', max: PW - 60});
  text('LOT 4471', PX + PW - 6, y0 + 2, {align: 'right', color: '#ffcf5a'});
  ctx.save(); ctx.beginPath(); ctx.rect(PX, y0 + 12, PW, PH - 28); ctx.clip();
  R('#0d111a', PX, y0 + 12, PW, PH - 28);
  const fn = {clean, inspect, oxidize, nitride, ellipso, coat, expose, develop, measure}[type];
  const tp = Math.min(tt, BASE + 10);
  if (fn) fn(tp, PX, y0 + 12, PW, PH - 28); else section(tp, PX, y0 + 12, PW, PH - 28, type);
  ctx.restore();
  R('#141a28', PX, y0 + PH - 16, PW, 16);
  text(cap[1], PX + 6, y0 + PH - 12, {font: 'IBM Plex Sans', size: 7, color: '#c9c8cf', max: PW - 12});
  if (t > 40) text(language === 'de' ? 'SHIFT: WEITER' : 'SHIFT: CONTINUE', W / 2, y0 + PH + 6, {align: 'center', color: '#4c5470'});
}

window.SchichtProcess = {draw, duration, DURATION: BASE};
})();
