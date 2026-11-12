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
  intake: {de: ['EINGANGSKONTROLLE · LOS 4471', 'Ein Los: 25 Siliziumscheiben in einer Box (FOUP). Jede bekommt dieselben Schichten.'],
    en: ['INCOMING CHECK · LOT 4471', 'A lot: 25 silicon wafers in a box (FOUP). Every one gets the same layers.']},
  inspect: {de: ['PRÜFEN · PARTIKELMESSUNG', 'Ein Laser fährt spiralförmig über den Wafer. Jedes Streulicht ist ein Partikel.'],
    en: ['INSPECT · PARTICLE SCAN', 'A laser spirals across the wafer. Every flash of scattered light is a particle.']},
  oxidize: {de: ['OXIDIEREN · 1000 °C, TROCKEN', 'O₂ wandert durchs Oxid zum Silizium. 44 % der Schicht wachsen nach unten.'],
    en: ['OXIDISE · 1000 °C, DRY', 'O₂ diffuses through the oxide to the silicon. 44 % of the film grows downward.']},
  nitride: {de: ['NITRID · LPCVD, 780 °C', 'Bei 0,3 mbar erreicht das Gas alle 100 Wafer. Si₃N₄ wächst gleichmäßig auf jedem.'],
    en: ['NITRIDE · LPCVD, 780 °C', 'At 0.3 mbar the gas reaches all 100 wafers. Si₃N₄ grows evenly on every one.']},
  ellipso: {de: ['SCHICHTDICKE · ELLIPSOMETER', 'Polarisiertes Licht kommt elliptisch zurück. Daraus folgen beide Dicken.'],
    en: ['FILM THICKNESS · ELLIPSOMETER', 'Polarised light comes back elliptical. Both thicknesses follow from it.']},
  coat: {de: ['BELACKEN · SPIN-COATING', 'Lack auf die Mitte, dann 2000 U/min. Dicke ∝ 1/√ω: hier 100 nm.'],
    en: ['COAT · SPIN COATING', 'Resist on the centre, then 2000 rpm. Thickness ∝ 1/√ω: here 100 nm.']},
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
  anneal: {de: ['AUSHEILEN · 1000 °C, 30 MIN, N₂', 'Das Gitter heilt aus, die Dotierung wandert: Länge ≈ 2·√(D·t).'],
    en: ['ANNEAL · 1000 °C, 30 MIN, N₂', 'The lattice heals and the dopant spreads: length ≈ 2·√(D·t).']},
  deposit: {de: ['OXID ABSCHEIDEN · CVD', 'Oxid wächst aus dem Gas gleichmäßig über die Stufen und füllt die Fenster.'],
    en: ['DEPOSIT OXIDE · CVD', 'Oxide grows evenly from the gas over the steps and fills the windows.']},
  contacts: {de: ['KONTAKTE ÄTZEN', 'Durch die Kontaktmaske: senkrechte Löcher bis auf die Dotierung.'],
    en: ['ETCH CONTACTS', 'Through the contact mask: straight holes down to the doped silicon.']},
  sputter: {de: ['SPUTTERN · ALUMINIUM', 'Argon schlägt Atome aus dem Target. Im Vakuum fliegen sie geradeaus.'],
    en: ['SPUTTER · ALUMINIUM', 'Argon knocks atoms out of the target. In vacuum they fly straight.']},
  cexpose: {de: ['KONTAKTE BELICHTEN · KONTAKTMASKE', 'Die zweite Maske: Löcher im Lack genau über der Dotierung.'],
    en: ['EXPOSE CONTACTS · CONTACT MASK', 'The second mask: holes in the resist right above the doping.']},
  rs: {de: ['SCHICHTWIDERSTAND · VIERSPITZE', 'Rs = 4,53 · V/I = 54 mΩ/□. Das sind 500 nm Aluminium.'],
    en: ['SHEET RESISTANCE · FOUR-POINT PROBE', 'Rs = 4.53 · V/I = 54 mΩ/□. That is 500 nm of aluminium.']},
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
  const g = window.SchichtMini.grade(s), loss = Math.round((1 - (0.8 + 0.2 * clamp(s, 0, 1))) * 100);
  text(g.word, x, y, {align: 'center', color: g.color, size: 8});
  text(lang === 'de' ? `AUSBEUTE −${loss} %` : `YIELD −${loss} %`, x, y + 9, {align: 'center', color: loss ? '#c9a15a' : '#3fe06a', size: 8});
}
function cdOf() {
  // The line the developer left, if that step was played; otherwise estimated from the steps before.
  const d = val('cd', null);
  if (d) return d;
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
// A vertical furnace cut open from the side: heater jacket with glowing coils, the quartz bell, and the quartz
// boat with its wafers lying flat, stacked like coins, riding up on the heat shield. o.rise and o.heat run 0..1.
function furnaceView(c, x, y, w, h, o) {
  const main = ctx; ctx = c;
  const fw = Math.min(w - 8, 72), fx = x + (w - fw) / 2, top = y + 2, jacketBot = y + h * 0.66, bot = y + h - 2;
  const heat = clamp(o.heat, 0, 1), rise = clamp(o.rise, 0, 1);
  // Jacket with a domed top; the cut shows the insulation and the heater windings on both inner walls.
  ctx.fillStyle = '#2b2219'; ctx.beginPath(); ctx.moveTo(fx, jacketBot); ctx.lineTo(fx, top + 12);
  ctx.quadraticCurveTo(fx, top, fx + 12, top); ctx.lineTo(fx + fw - 12, top); ctx.quadraticCurveTo(fx + fw, top, fx + fw, top + 12);
  ctx.lineTo(fx + fw, jacketBot); ctx.closePath(); ctx.fill();
  R('#3d3024', fx + 3, top + 8, 6, jacketBot - top - 8); R('#3d3024', fx + fw - 9, top + 8, 6, jacketBot - top - 8);
  for (let yy = top + 12; yy < jacketBot - 2; yy += 4) {
    const glow = heat > 0 ? `rgba(255,${Math.round(110 + 80 * (1 - heat))},40,${0.4 + 0.55 * heat})` : '#5a4430';
    R(glow, fx + 4, yy, 4, 2); R(glow, fx + fw - 8, yy, 4, 2);
  }
  // The quartz bell: transparent, domed, a little glow inside when hot.
  const bx0 = fx + 12, bx1 = fx + fw - 12, btop = top + 8;
  ctx.fillStyle = heat > 0 ? `rgba(255,170,90,${0.08 + 0.12 * heat})` : 'rgba(180,220,255,.07)';
  ctx.beginPath(); ctx.moveTo(bx0, jacketBot); ctx.lineTo(bx0, btop + 10); ctx.quadraticCurveTo(bx0, btop, (bx0 + bx1) / 2, btop);
  ctx.quadraticCurveTo(bx1, btop, bx1, btop + 10); ctx.lineTo(bx1, jacketBot); ctx.fill();
  ctx.strokeStyle = 'rgba(200,230,255,.55)'; ctx.lineWidth = 1; ctx.stroke();
  // Gas inlet at the top.
  R('#7c8693', (bx0 + bx1) / 2 - 1, top - 2, 2, 10);
  if (o.gas && heat > 0.3) for (let k = 0; k < o.gas.length * 3; k++) {
    const yy = btop + 4 + ((F * 0.5 + k * 11) % (jacketBot - btop - 10)), xx = bx0 + 3 + ((k * 13) % (bx1 - bx0 - 6));
    circle(o.gas[k % o.gas.length], xx, yy, 1);
  }
  // The boat: heat shield plates, three quartz rods, wafers as flat discs seen slightly from above.
  const n = 13, gap = 3.4, stack = n * gap, rx = (bx1 - bx0) / 2 - 3, cx = (bx0 + bx1) / 2;
  const lowest = bot - 8 - stack, highest = btop + 8;
  const by = lowest + (highest - lowest) * rise;
  R('#5a6270', cx - 1, by + stack + 6, 2, bot - (by + stack + 6));
  for (let k = 0; k < 3; k++) R(k % 2 ? '#7c8693' : '#9aa3ad', cx - rx + 2, by + stack + k * 2, rx * 2 - 4, 2);
  R('rgba(220,235,255,.5)', cx - rx, by - 2, 1, stack + 2); R('rgba(220,235,255,.5)', cx + rx - 1, by - 2, 1, stack + 2);
  for (let k = 0; k < n; k++) {
    const wy = by + k * gap, hot = heat > 0.6;
    ctx.fillStyle = hot ? '#b06a30' : '#7c8693'; ctx.beginPath(); ctx.ellipse(cx, wy + 1, rx - 1, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hot ? '#ffd9a0' : '#cfd5dd'; ctx.beginPath(); ctx.ellipse(cx, wy, rx - 1, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  }
  R('rgba(220,235,255,.7)', cx - 0.5, by - 2, 1, stack + 2);
  // Load lock below the jacket.
  R('rgba(90,98,112,.35)', fx + 4, jacketBot, fw - 8, 1);
  if (o.temp) text(o.temp, fx + fw / 2, top + 1, {align: 'center', color: o.tempColor || '#ffb070'});
  ctx = main;
  return {fx, fw, top, bot, heat, rise};
}
function furnaceSide(t, x, y, h, temp, glowCol) {
  const rise = ease(t / 60), heat = clamp((t - 50) / 60, 0, 1);
  const f = furnaceView(ctx, x, y, 100, h, {rise, heat, temp: `${Math.round(400 + (parseInt(temp, 10) - 400) * heat)} °C`, tempColor: glowCol});
  return f;
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
  const rise = ease(t / 60), heat = clamp((t - 50) / 60, 0, 1);
  const f = furnaceView(ctx, x, y, 100, h, {rise, heat, temp: `${Math.round(400 + 600 * heat)} °C`, gas: ['rgba(160,220,255,.9)']});
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
  const rise = ease(t / 60), heat = clamp((t - 50) / 60, 0, 1);
  const f = furnaceView(ctx, x, y, 100, h, {rise, heat, temp: `${Math.round(400 + 380 * heat)} °C`, tempColor: '#ffcf9a', gas: ['rgba(120,200,255,.9)', 'rgba(140,240,160,.9)']});
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
// Incoming check: the FOUP opens, a laser maps its 25 slots, one wafer comes out and is shown from above.
function intake(t, x, y, w, h) {
  const de = lang === 'de', fx = x + 10, fy = y + 8, fw = 84, fh = 88;
  // The FOUP from the front: grey shell, handle on top, the door slides down; red HOT LOT tag on the side.
  R('#7c8693', fx - 4, fy - 4, fw + 8, fh + 8); R('#9aa3ad', fx - 4, fy - 4, fw + 8, 3); R('#5a6370', fx + fw / 2 - 12, fy - 9, 24, 5);
  R('#d8262a', fx + fw + 4, fy + 10, 5, 14); R('#ffffff', fx + fw + 5, fy + 14, 3, 1);
  R('#141a28', fx, fy, fw, fh);
  const slotY = n => fy + 6 + n * 3.1, mapped = Math.floor(clamp((t - 55) / 55, 0, 1) * 25), out = 12;
  const pull = clamp((t - 125) / 40, 0, 1);
  for (let n = 0; n < 25; n++) {
    R('#3a4058', fx + 2, slotY(n) - 1, 3, 3); R('#3a4058', fx + fw - 5, slotY(n) - 1, 3, 3);
    if (n === out && pull > 0) continue;
    R('#c9ced6', fx + 6, slotY(n), fw - 12, 1); R('#eef1f4', fx + 10 + (n * 7) % 20, slotY(n), 10, 1);
  }
  const door = ease((t - 12) / 36);
  if (door < 1) { R('#8d97a4', fx, fy + fh * door, fw, fh * (1 - door)); R('#a9b1bc', fx + 6, fy + fh * door + 6, fw - 12, 2); text('FOUP', fx + fw / 2, fy + fh * door + fh * (1 - door) / 2 - 4, {align: 'center', color: '#3a4058'}); }
  // Mapping: a red laser runs down the slots and finds a wafer in each.
  if (t > 55 && t < 112) { const ly = slotY(mapped); R('rgba(255,70,50,.9)', fx - 6, ly, fw + 12, 1); circle('#ff4632', fx - 7, ly, 2); }
  // Right: the slot map while mapping, then the wafer that was pulled out, seen from above.
  const px = x + 108, pw = w - 114;
  if (t < 125) {
    text(de ? 'SLOT-MAPPING' : 'SLOT MAP', px + pw / 2, y + 4, {align: 'center', color: '#9fe0ff'});
    for (let n = 0; n < 25; n++) {
      const cx = px + 6 + (n % 5) * ((pw - 12) / 5), cy = y + 16 + Math.floor(n / 5) * 14, on = n < mapped;
      R(on ? '#1f6a36' : '#1a2030', cx, cy, (pw - 12) / 5 - 3, 11);
      text(String(n + 1), cx + ((pw - 12) / 5 - 3) / 2, cy + 2, {align: 'center', color: on ? '#bff5cf' : '#3a4058', max: 18});
    }
    text(`${mapped}/25`, px + pw / 2, y + 88, {align: 'center', color: mapped === 25 ? '#3fe06a' : '#e9e4d6'});
  } else {
    // The wafer slides out of slot 13 and turns to face us: polished silicon, 300 mm, with its notch.
    const k = ease((t - 125) / 45), cx = px + pw / 2, cy = y + 50, r = 6 + 34 * k;
    if (k < 1) R('#c9ced6', fx + 6 + (cx - fx - 40) * k, slotY(out), fw - 12, 1);
    if (k > 0.05) {
      circle('#5a6370', cx, cy, r + 1);
      const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      g.addColorStop(0, '#e8ecf2'); g.addColorStop(0.45, '#9aa6b5'); g.addColorStop(0.55, '#f7f9fc'); g.addColorStop(1, '#7c8693');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      R('#0d111a', cx - 1, cy + r - 2, 3, 3);
    }
    if (t > 172) {
      const L2 = (a2, b2) => de ? a2 : b2;
      text('Si', cx, cy - 5, {align: 'center', color: '#3a4058', size: 8});
      text(L2('Ø 300 MM', 'Ø 300 MM'), cx, y + 2, {align: 'center', color: '#ffcf5a', max: pw});
      text(L2('775 µm DICK · POLIERT', '775 µm THICK · POLISHED'), cx, y + 92, {align: 'center', color: '#c9c2ae', max: pw, font: 'IBM Plex Sans', size: 7});
      text(L2('KERBE', 'NOTCH'), cx + 10, cy + 33, {color: '#6b7190', font: 'IBM Plex Sans', size: 6});
    }
  }
  if (t > 205) { R('rgba(10,30,16,.9)', fx + 8, fy + fh / 2 - 8, fw - 16, 16); text(de ? '25/25 · OK' : '25/25 · OK', fx + fw / 2, fy + fh / 2 - 4, {align: 'center', color: '#3fe06a'}); }
}
// Ellipsometry: linear polarisation in, elliptical out; the fit finds both thicknesses.
function ellipso(t, x, y, w, h) {
  // The films, not to scale: nitride on oxide on silicon. The beam goes in, is bent at every interface
  // (Snell: n₁ sin θ₁ = n₂ sin θ₂), part of it turns back at each one, and the partial beams leave in parallel.
  const ys = y + h - 40, tn = 14, to = 10;
  R('#9fc4a8', x + 4, ys, w - 8, tn); R('#cfe8ff', x + 4, ys + tn, w - 8, to); R('#4f5866', x + 4, ys + tn + to, w - 8, y + h - ys - tn - to);
  for (let yy = ys + tn + to + 3; yy < y + h; yy += 5) for (let xx = x + 6 + (yy % 10 ? 2 : 0); xx < x + w - 4; xx += 5) R('#5d6775', xx, yy, 1, 1);
  text('Si₃N₄ · n = 2,0', x + w - 8, ys + 3, {align: 'right', color: '#1f3a2a', font: 'IBM Plex Sans', size: 7});
  text('SiO₂ · n = 1,46', x + w - 8, ys + tn + 1, {align: 'right', color: '#1f3050', font: 'IBM Plex Sans', size: 7});
  text('Si · n = 3,9', x + w - 8, ys + tn + to + 3, {align: 'right', color: '#c9ced6', font: 'IBM Plex Sans', size: 7});
  const th0 = Math.PI / 3, s0 = Math.sin(th0), t0 = Math.tan(th0);
  const t1 = Math.tan(Math.asin(s0 / 2.0)), t2 = Math.tan(Math.asin(s0 / 1.46)), t3 = Math.tan(Math.asin(s0 / 3.88));
  const P = [x + 96, ys], A = [P[0] + tn * t1, ys + tn], B = [A[0] + to * t2, ys + tn + to];
  const A2 = [B[0] + to * t2, ys + tn], P1 = [A[0] + tn * t1, ys], P2 = [A2[0] + tn * t1, ys];
  const topY = y + 12, S = [P[0] - (ys - topY) * t0, topY], up = p => [p[0] + (p[1] - topY) * t0, topY];
  const seg = (p, q, k, col, wdt = 1.5) => { if (k <= 0) return; ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k); ctx.stroke(); };
  const k1 = clamp(t / 30, 0, 1), k2 = clamp((t - 30) / 20, 0, 1), k3 = clamp((t - 50) / 20, 0, 1), k4 = clamp((t - 70) / 30, 0, 1);
  // Polariser and analyser with their labels.
  R('#5a6270', S[0] - 2, S[1] - 6, 16, 8); text(lang === 'de' ? 'POLARISATOR' : 'POLARISER', x + 4, y + 2, {color: '#6b7190', max: 80});
  const E = up(P2); R('#5a6270', E[0] - 26, E[1] - 8, 34, 8); text(lang === 'de' ? 'ANALYSATOR' : 'ANALYSER', x + w - 4, y + 2, {align: 'right', color: '#6b7190', max: 80});
  // Normal and angle of incidence.
  ctx.setLineDash([2, 2]); ctx.strokeStyle = 'rgba(200,210,230,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P[0], ys - 22); ctx.lineTo(P[0], ys); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(P[0], ys, 12, -Math.PI / 2 - th0, -Math.PI / 2); ctx.stroke();
  text('60°', P[0] - 14, ys - 22, {color: '#9aa6b5', size: 8});
  // In, through nitride and oxide, back from the silicon; a weak part runs on into the silicon and dies there.
  seg(S, P, k1, '#ff5a4a', 2);
  seg(P, A, k2, 'rgba(255,90,74,.85)'); seg(A, B, k2 > 0.5 ? (k2 - 0.5) * 2 : 0, 'rgba(255,90,74,.7)');
  seg(B, [B[0] + 10 * t3, B[1] + 10], k3, 'rgba(255,90,74,.25)');
  seg(A, P1, k3, 'rgba(255,90,74,.55)'); seg(B, A2, k3, 'rgba(255,90,74,.6)'); seg(A2, P2, k3, 'rgba(255,90,74,.6)');
  seg(P, up(P), k3, '#ff7a5a', 2); seg(P1, up(P1), k4, 'rgba(255,150,90,.75)'); seg(P2, up(P2), k4, 'rgba(255,200,110,.6)');
  // The polarisation: a line on the way in, an ellipse on the way out.
  const ph = F / 6, M = [(S[0] + P[0]) / 2, (S[1] + P[1]) / 2];
  ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(M[0] - 5 * Math.cos(ph), M[1] - 5 * Math.cos(ph) * 0.4); ctx.lineTo(M[0] + 5 * Math.cos(ph), M[1] + 5 * Math.cos(ph) * 0.4); ctx.stroke();
  if (k4 >= 1) { const N = [E[0] - 18, E[1] + 16]; ctx.beginPath(); ctx.ellipse(N[0], N[1], 7, 3.5, 0.6, 0, 7); ctx.stroke(); circle('#ffcf5a', N[0] + 7 * Math.cos(ph) * 0.8, N[1] + 3.5 * Math.sin(ph) * 0.8, 1.3); }
  // The fit: Ψ and Δ settle, the thicknesses follow.
  const fit = clamp((t - 100) / 90, 0, 1);
  const psi = (12 + 20 * fit + Math.sin(F / 5) * 2 * (1 - fit)).toFixed(1), del = (95 + 60 * fit + Math.cos(F / 4) * 4 * (1 - fit)).toFixed(1);
  if (t > 70) text(`Ψ ${psi}°  Δ ${del}°`, x + 108, y + 13, {align: 'center', color: '#9fe0ff'});
  if (fit >= 1) {
    const ox = val('oxide', 50.1);
    const nu = val('nitrideU', null);
    text(`SiO₂ ${fmt(ox)} nm · Si₃N₄ ${fmt(val('nitride', 100.4))} nm${nu !== null ? ` ±${fmt(nu)} %` : ''}`, x + 108, y + 23, {align: 'center', color: '#e9e4d6', font: 'IBM Plex Sans', size: 8, max: 200});
    // The verdict judges both films that were played.
    const played = [sc('oxidize'), sc('nitride')].filter(v => v !== null);
    verdict(played.length ? played.reduce((p, v) => p + v, 0) / played.length : null, x + 104, y + 33);
    // The SPC chart of this tool: the last seven lots all above the centre line. By the rules: out of control.
    const cx0 = x + 170, cy0 = y + 42, cw = 54, ch = 20;
    R('#0b0f18', cx0, cy0, cw, ch); R('#3a4058', cx0, cy0 + ch / 2, cw, 1); R('#5a2a20', cx0, cy0 + 2, cw, 1); R('#5a2a20', cx0, cy0 + ch - 3, cw, 1);
    for (let i = 0; i < 10; i++) {
      const v = i < 3 ? Math.sin(i * 2.1) * 4 : -3 - (i % 3), px = cx0 + 3 + i * 5, py = cy0 + ch / 2 + v;
      R(i >= 3 ? '#ff5a3a' : '#9fe0ff', px, py - 1, 2, 2);
    }
    text('SPC', cx0 + 2, cy0 + ch - 9, {color: '#4c5470', font: 'IBM Plex Sans', size: 6});
    if ((F >> 4) % 2) text('OOC', cx0 + cw - 2, cy0 + ch - 9, {align: 'right', color: '#ff5a3a', font: 'IBM Plex Sans', size: 6});
  }
}

// Four-point probe: current through the outer needles, voltage across the inner two. Rs = π/ln2 · V/I.
function rs(t, x, y, w, h) {
  const st = stackView(x + 10, y + h - 36, w - 20, 34, [[4, '#cfe8ff'], [3, '#9fc4a8'], [8, '#a9cbe6'], [7, '#c9ced6']], []);
  const cx = x + w / 2 - 30, down = ease(t / 50), top = y + 22, tip = st.top - 1;
  R('#5a6270', cx - 40, y + 8, 80, 12); text(lang === 'de' ? 'MESSKOPF' : 'PROBE HEAD', cx, y + 10, {align: 'center', color: '#1a1e24'});
  [-27, -9, 9, 27].forEach(dx => {
    R('#9aa3ad', cx + dx, top - 2, 1, 2 + down * (tip - top)); circle('#e9eef5', cx + dx + 0.5, top + down * (tip - top), 1.2);
  });
  if (t > 60) {
    for (let i = 0; i < 8; i++) circle('#ffcf5a', cx - 27 + ((F * 0.8 + i * 7) % 54), tip + 2, 0.9);
    const k = clamp((t - 60) / 80, 0, 1);
    text(`I = ${fmt(1.0, 3)} mA`, x + w - 8, y + 10, {align: 'right', color: '#ffcf5a'});
    text(`V = ${fmt(11.9 * k)} µV`, x + w - 8, y + 21, {align: 'right', color: '#9fe0ff'});
    if (k >= 1) {
      text('Rs = 4,53 · V/I', x + w - 8, y + 36, {align: 'right', color: '#9aa6b5', font: 'IBM Plex Sans', size: 8});
      text('= 54 mΩ/□', x + w - 8, y + 46, {align: 'right', color: '#3fe06a', font: 'IBM Plex Sans', size: 9});
    }
  }
  text(lang === 'de' ? 'Al 500 nm' : 'Al 500 nm', x + 14, st.top - 10, {color: '#c9ced6'});
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
  const rpm = Math.round(spin * 2000);
  text(`${rpm} ${lang === 'de' ? 'U/MIN' : 'RPM'}`, x + w - 62, y + 10, {color: '#7fd0ff'});
  text('100 nm', x + w - 62, y + 22, {color: t > 150 ? '#ffcf5a' : '#4a5470'});
}

function fieldsGrid(cx, cy, r) {
  const out = [], n = 7, s = (2 * r) / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const fx = cx - r + i * s, fy = cy - r + j * s;
    if (Math.hypot(fx + s / 2 - cx, fy + s / 2 - cy) < r - s * 0.45) out.push({fx, fy, s, j, i: j % 2 ? n - 1 - i : i});
  }
  return out.sort((a, b) => a.j - b.j || a.i - b.i);
}

// The scanner cut open from the side: ArF laser, beam over a mirror into the illuminator, the reticle on its scanning
// stage, the projection lens (4 : 1) with its light cone, the immersion hood with its water film, the wafer stage with
// the interferometer beam that measures where it is. o: {scan -1..1, pulse, load 0..1, align, step (px), t}.
function scannerView(c, x, y, w, h, o) {
  const main = ctx; ctx = c;
  const de = lang === 'de', mid = x + w / 2 + 6, scan = o.scan || 0, load = o.load === undefined ? 1 : o.load, pulse = o.pulse;
  const tiny = (s, xx, yy, col = '#6b7190') => text(s, xx, yy, {font: 'IBM Plex Sans', size: 6, color: col, max: 40});
  // Laser and beam path.
  R('#2a1e4a', x + 2, y + 2, 34, 11); R('#3a2a64', x + 2, y + 2, 34, 2); text('ArF', x + 19, y + 4, {align: 'center', color: '#d6c8ff', max: 30});
  R('#2a3040', x + 36, y + 6, mid - x - 36, 3); R('#5a6270', mid - 3, y + 4, 6, 6);
  if (pulse) { R('rgba(190,140,255,.95)', x + 36, y + 7, mid - x - 36, 1); R('rgba(190,140,255,.95)', mid, y + 8, 1, 6); }
  R('#3a4058', mid - 14, y + 13, 28, 7); tiny(de ? 'BELEUCHTUNG' : 'ILLUMINATOR', mid + 16, y + 13);
  // Reticle stage and reticle: quartz with a chrome pattern, sliding in while it loads, then scanning.
  R('#5a6270', x + 6, y + 27, w - 10, 2);
  const rx = mid - 24 + scan * 12 - (1 - load) * 70;
  R('#cfe8ff', rx, y + 22, 48, 5); R('#9fb8d0', rx, y + 26, 48, 1);
  for (let k = 0; k < 9; k++) if (k % 3 !== 1) R('#1a1e24', rx + 4 + k * 4.6, y + 23, 3, 3);
  tiny(de ? 'RETIKEL' : 'RETICLE', x + 2, y + 15);
  // Projection lens: housing and elements; the light cone narrows towards the wafer.
  R('#3a4058', mid - 22, y + 32, 3, 44); R('#3a4058', mid + 19, y + 32, 3, 44); R('#2a3040', mid - 22, y + 31, 44, 2);
  if (pulse) { ctx.fillStyle = 'rgba(170,120,255,.28)'; ctx.beginPath(); ctx.moveTo(mid - 16, y + 28); ctx.lineTo(mid + 16, y + 28); ctx.lineTo(mid + 3, y + 80); ctx.lineTo(mid - 3, y + 80); ctx.fill(); }
  [17, 15, 16, 13, 11, 9, 7].forEach((wd, k) => { ctx.fillStyle = 'rgba(200,225,255,.7)'; ctx.beginPath(); ctx.ellipse(mid, y + 36 + k * 6, wd, 1.8, 0, 0, 7); ctx.fill(); });
  tiny(de ? 'OBJEKTIV 4:1' : 'LENS 4:1', x + 2, y + 46);
  // Immersion hood with the water film between lens and wafer.
  R('#3a4058', mid - 12, y + 76, 24, 3); R('rgba(90,170,255,.75)', mid - 8, y + 79, 16, 2);
  tiny(de ? 'WASSER' : 'WATER', mid + 14, y + 74, '#5a8ab0');
  // Wafer stage: moves against the reticle (4 : 1) and steps from field to field; resist-coated wafer on its chuck.
  const wx = mid - scan * 3 + (o.step || 0);
  R('#2a3040', x + 6, y + 90, w - 10, 6); R('#5a6270', wx - 34, y + 84, 68, 6); R('#8e98a3', wx - 30, y + 83, 60, 1); R('#d99a32', wx - 30, y + 81, 60, 2);
  if (pulse) { R('rgba(230,210,255,.95)', mid - 3, y + 81, 6, 2); }
  // Interferometer: a red beam to the stage mirror, it knows the position to a nanometre.
  R('#7c8693', wx + 34, y + 84, 2, 6); ctx.strokeStyle = 'rgba(255,80,60,.55)'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(x + w - 2, y + 87.5); ctx.lineTo(wx + 36, y + 87.5); ctx.stroke(); ctx.setLineDash([]);
  if (o.align) { ctx.strokeStyle = 'rgba(255,90,74,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 2, y + 66); ctx.lineTo(mid - 10, y + 81); ctx.stroke(); }
  tiny(de ? 'WAFERTISCH' : 'WAFER STAGE', x + 2, y + 92);
  ctx = main;
}
// Contact etch: the plasma chamber on the left, the holes going down through the mask on the right.
function contacts(t, x, y, w, h) {
  // The etch removes oxide at a steady rate: the holes deepen linearly until they reach the silicon.
  const de = lang === 'de', k = clamp((t - 20) / 170, 0, 1), cw = 104, glow = 0.5 + 0.2 * Math.sin(F / 5);
  // Chamber: showerhead with gas, the glowing plasma, the dark sheath above the wafer, the chuck on 13.56 MHz.
  R('#3a4058', x + 4, y + 4, cw, h - 8); R('#141a28', x + 8, y + 8, cw - 8, h - 16);
  R('#7c8693', x + 12, y + 12, cw - 16, 5); for (let i = 0; i < 12; i++) R('#3a4058', x + 15 + i * 7, y + 16, 2, 1);
  text('C₄F₈ · O₂ · Ar', x + 4 + cw / 2, y + 2, {align: 'center', color: '#9aa6b5', font: 'IBM Plex Sans', size: 6, max: cw});
  const g = ctx.createLinearGradient(0, y + 18, 0, y + 64);
  g.addColorStop(0, `rgba(160,90,240,${0.25 * glow})`); g.addColorStop(0.5, `rgba(200,130,255,${0.55 * glow})`); g.addColorStop(1, `rgba(160,90,240,${0.3 * glow})`);
  ctx.fillStyle = g; ctx.fillRect(x + 10, y + 18, cw - 12, 48);
  for (let i = 0; i < 14; i++) circle('rgba(240,220,255,.7)', x + 14 + (i * 37 + F * 0.7) % (cw - 20), y + 22 + (i * 23 + F * 0.4) % 40, 0.8);
  R('#0b0f18', x + 10, y + 66, cw - 12, 8); text(de ? 'RANDSCHICHT' : 'SHEATH', x + 4 + cw / 2, y + 67, {align: 'center', color: '#4c5470', font: 'IBM Plex Sans', size: 6, max: cw});
  // Ions cross the sheath fast and straight down onto the wafer.
  for (let i = 0; i < 8; i++) { const iy = (F * 2.5 + i * 11) % 14; R('#e0b8ff', x + 18 + i * 11, y + 62 + iy, 1, 3); }
  R('#d99a32', x + 22, y + 74, cw - 36, 2); R('#c9ced6', x + 22, y + 76, cw - 36, 2); R('#5a6270', x + 18, y + 78, cw - 28, 8);
  R('#5a6270', x + 4 + cw / 2 - 1, y + 86, 2, h - 94); text('13,56 MHz', x + 4 + cw / 2 + 4, y + h - 14, {color: '#ffcf5a', font: 'IBM Plex Sans', size: 6, max: 50});
  // Cross-section: the resist mask, the deposited oxide, the holes etching down, polymer on their walls.
  const sx = x + cw + 10, sw = w - cw - 14, si = y + h - 22, top = si - 10 - 22, mask = top - 8, holes = [0.2, 0.5, 0.8].map(f => sx + f * sw - 4);
  R('#4f5866', sx, si, sw, 18); for (const hx of holes) { ctx.fillStyle = 'rgba(150,100,230,.85)'; ctx.beginPath(); ctx.ellipse(hx + 4, si, 10, 7, 0, 0, Math.PI); ctx.fill(); }
  R('#cfe8ff', sx, si - 6, sw, 6); R('#9fc4a8', sx, si - 10, sw, 4); R('#a9cbe6', sx, top, sw, si - 10 - top);
  const erode = 2 * k;
  R('#d99a32', sx, mask + erode, sw, top - mask - erode); R('#f0b850', sx, mask + erode, sw, 1);
  const depth = (si - top) * k;
  for (const hx of holes) {
    R('#0b0f18', hx, mask + erode, 8, top - mask - erode + depth);
    if (k > 0.1) { R('rgba(230,140,60,.8)', hx, top, 1, depth); R('rgba(230,140,60,.8)', hx + 7, top, 1, depth); }
    for (let i = 0; i < 3; i++) { const iy = (F * 2 + i * 9 + hx) % Math.max(4, mask - y - 6 + depth); R('#c890ff', hx + 3 + (i % 2), y + 4 + iy, 1, 2); }
    if (k >= 1) R('rgba(255,240,180,.8)', hx + 1, si - 1, 6, 1);
  }
  text(de ? 'LACK' : 'RESIST', sx + 2, mask - 9, {color: '#f0b850', font: 'IBM Plex Sans', size: 6});
  text(de ? 'OXID' : 'OXIDE', sx + 2, top + 2, {color: '#3a5a7a', font: 'IBM Plex Sans', size: 6});
  if (k > 0.2) text(de ? 'POLYMER AN DEN WÄNDEN' : 'POLYMER ON THE WALLS', sx + sw / 2, y + 2, {align: 'center', color: '#e08c3c', font: 'IBM Plex Sans', size: 6, max: sw});
  if (k >= 1 && (F >> 4) % 2) text(de ? 'ENDPUNKT: SILIZIUM' : 'ENDPOINT: SILICON', sx + sw / 2, y + 11, {align: 'center', color: '#3fe06a', max: sw});
}
function expose(t, x, y, w, h) {
  // Side view, then the fields on the wafer.
  const pulse = (F >> 1) % 2;
  scannerView(ctx, x + 2, y + 4, 112, h - 8, {scan: Math.sin(t / 12), pulse, step: Math.round(Math.sin(t / 40) * 6)});
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
      const py = y + 10 + ((F * 3 + i * 23) % (until - y - 10)), lap = Math.floor((F * 3 + i * 23) / (until - y - 10));
      const px = bx + ((i * 47 + lap * 61 + i * i * 13) % bw);
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
      // Conformal film: it grows equally on every surface, top, walls and floor of the windows, so its surface
      // traces the steps of the stack below. The windows close from the sides; the dips above them fade out.
      // Drawn as a thick round line along the surface, clipped to the open space above the stack.
      // CVD deposits at a constant rate: the film thickens linearly with time.
      const d = 22 * clamp((t - 20) / 150, 0, 1);
      if (d > 0.3) {
        ctx.save(); ctx.beginPath();
        ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.lineTo(bx + bw, oxTop);
        [...holes].reverse().forEach(hx => { ctx.lineTo(hx + 18, oxTop); ctx.lineTo(hx + 18, si); ctx.lineTo(hx, si); ctx.lineTo(hx, oxTop); });
        ctx.lineTo(bx, oxTop); ctx.closePath(); ctx.clip();
        const surface = () => {
          ctx.beginPath(); ctx.moveTo(bx - 30, oxTop);
          holes.forEach(hx => { ctx.lineTo(hx, oxTop); ctx.lineTo(hx, si); ctx.lineTo(hx + 18, si); ctx.lineTo(hx + 18, oxTop); });
          ctx.lineTo(bx + bw + 30, oxTop); ctx.stroke();
        };
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#d8ecff'; ctx.lineWidth = 2 * d + 2; surface();
        ctx.strokeStyle = '#a9cbe6'; ctx.lineWidth = 2 * d; surface();
        ctx.restore();
      }
      rain('#d8ecff', 30, 0, oxTop - d); break;
    }
    case 'sputter': {
      oxide(1); doped(18, 6); holes.forEach(hx => R('#a9cbe6', hx, oxTop, 18, ox)); R('#a9cbe6', bx, oxTop - 22, bw, 22);
      holes.forEach(hx => R('#0b0f18', hx + 5, oxTop - 22, 8, 22 + ox)); holes.forEach(hx => R('#c9ced6', hx + 5, oxTop - 22, 8, (22 + ox) * Math.min(1, k * 1.5)));
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
    if (sc('expose') !== null || sc('develop') !== null || sc('etch') !== null) verdict(1 - Math.abs(cd - 40) / 12, lx + 57, zy + zh / 2 + 10);
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
const DUR = {intake: 620, clean: 620, inspect: 480, oxidize: 540, nitride: 480, ellipso: 460, rs: 420, reticle: 230};
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
  const fn = {intake, clean, inspect, oxidize, nitride, ellipso, rs, coat, expose, cexpose: expose, develop, measure, contacts}[type];
  const tp = Math.min(tt, BASE + 10);
  if (fn) fn(tp, PX, y0 + 12, PW, PH - 28); else section(tp, PX, y0 + 12, PW, PH - 28, type);
  ctx.restore();
  R('#141a28', PX, y0 + PH - 16, PW, 16);
  text(cap[1], PX + 6, y0 + PH - 12, {font: 'IBM Plex Sans', size: 7, color: '#c9c8cf', max: PW - 12});
  if (t > 40) text(language === 'de' ? 'SHIFT: WEITER' : 'SHIFT: CONTINUE', W / 2, y0 + PH + 6, {align: 'center', color: '#4c5470'});
}

window.SchichtProcess = {draw, duration, furnace: (c, x, y, w, h, o) => { F = o.t || F; return furnaceView(c, x, y, w, h, o); },
  scanner: (c, x, y, w, h, o, language) => { F = o.t || F; if (language) lang = language; return scannerView(c, x, y, w, h, o); }, DURATION: BASE};
})();
