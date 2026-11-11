/* Schichtwechsel - rendering, audio, input and screens. Rules live in core.js, levels in levels.js. */
(() => {
'use strict';
const C = window.SchichtCore, {LEVELS, ENDING} = window.SchichtLevels;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const W = 320, H = 180, Z = 3, T = 16, FY = 16;
const STEP_FRAMES = 7;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const levels = LEVELS.map(d => C.parseLevel(d));

/* ---------- Language ---------- */
const UI = {
  de: {
    day: 'TAGSCHICHT', night: 'NACHTSCHICHT', open: 'SCHLEUSE OFFEN', airlock: 'ZUR SCHLEUSE',
    press: isTouch ? 'SHIFT TIPPEN' : 'SHIFT DRÜCKEN', orSpace: 'oder Leertaste', cont: isTouch ? 'SHIFT: WEITER' : 'SHIFT ODER ENTER: WEITER',
    tagline: 'Die Vorschicht ist nie gegangen. Sie ist eine Schicht geworden.', checkpoint: 'PROZESSSCHRITT GESICHERT',
    sticky: 'Tipp: Die Leertaste wechselt auch die Schicht (Windows-Einrastfunktion).',
    resume: 'Weiter ab', fresh: 'N: neue Nacht ab 22:00', physics: 'PHYSIK DER SCHICHT',
    caught: 'ERWISCHT', crushed: 'EINGEMAUERT', robot: 'ÜBERFAHREN', beam: 'IM STRAHL',
    paused: 'PAUSE', pausedHint: 'P oder ESC: weiter', bell: 'GLOCKE', ion: 'IONEN', retry: 'R: neu versuchen',
    stats: (d, s) => `Erwischt: ${d}   Schichtwechsel: ${s}`, thanks: 'Danke fürs Spielen.',
    sub: 'TURNO DI NOTTE · LUINO', credit: 'Ein Spiel von Maurizio Odenwaeller für Game Off 2026 · entwickelt mit Claude',
    sound: on => 'Ton: ' + (on ? 'an' : 'aus'), pause: 'Pause', full: 'Vollbild',
  },
  en: {
    day: 'DAY SHIFT', night: 'NIGHT SHIFT', open: 'AIRLOCK OPEN', airlock: 'TO THE AIRLOCK',
    press: isTouch ? 'TAP SHIFT' : 'PRESS SHIFT', orSpace: 'or Space', cont: isTouch ? 'SHIFT: CONTINUE' : 'SHIFT OR ENTER: CONTINUE',
    tagline: 'The previous shift never left. They became a layer.', checkpoint: 'PROCESS STEP SAVED',
    sticky: 'Tip: Space changes the shift too (Windows Sticky Keys).',
    resume: 'Continue from', fresh: 'N: new night from 22:00', physics: 'PHYSICS OF THE SHIFT',
    caught: 'CAUGHT', crushed: 'WALLED IN', robot: 'RUN OVER', beam: 'IN THE BEAM',
    paused: 'PAUSED', pausedHint: 'P or ESC: resume', bell: 'BELL', ion: 'IONS', retry: 'R: try again',
    stats: (d, s) => `Caught: ${d}   Shift changes: ${s}`, thanks: 'Thank you for playing.',
    sub: 'TURNO DI NOTTE · LUINO', credit: 'A game by Maurizio Odenwaeller for Game Off 2026 · made with Claude',
    sound: on => 'Sound: ' + (on ? 'on' : 'off'), pause: 'Pause', full: 'Fullscreen',
  },
};
const store = {
  get(k) { try { return localStorage.getItem('schichtwechsel-' + k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem('schichtwechsel-' + k, v); } catch (_) { /* storage blocked */ } },
};
let lang = store.get('lang') || ((navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en');
if (lang !== 'de' && lang !== 'en') lang = 'en';
const t = () => UI[lang];
const langSel = document.getElementById('language');
function applyLanguage() {
  document.documentElement.lang = lang;
  langSel.value = lang;
  document.querySelectorAll('[data-de]').forEach(el => { el.innerHTML = el.dataset[lang]; });
  btnSound.textContent = t().sound(audio.on);
  btnPause.textContent = t().pause;
  btnFull.textContent = t().full;
}
langSel.addEventListener('change', () => { lang = langSel.value; store.set('lang', lang); applyLanguage(); });

/* ---------- Helpers ---------- */
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
function txt(s, x, y, o = {}) {
  const size = o.size || 8, font = o.font || 'Silkscreen';
  ctx.font = `${o.weight || 400} ${size}px "${font}", ui-monospace, monospace`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
  if (o.shadow !== null) { ctx.fillStyle = o.shadow || '#000'; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1, o.max || W - 8); }
  ctx.fillStyle = o.color || '#e9e4d6'; ctx.fillText(s, Math.round(x), Math.round(y), o.max || W - 8);
}

/* ---------- Audio ---------- */
const audio = {
  ctx: null, on: store.get('sound') !== 'off', vol: clamp(+(store.get('volume') ?? 80) / 100, 0, 1), master: null, layer: 0, noise: null, radioNext: 0, radioPos: 0,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const a = this.ctx = new AC();
    const comp = a.createDynamicsCompressor(); comp.connect(a.destination);
    this.master = a.createGain(); this.master.gain.value = this.on ? this.vol : 0; this.master.connect(comp);
    const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.dayBus = a.createGain(); this.nightBus = a.createGain();
    this.dayBus.connect(this.master); this.nightBus.connect(this.master);
    this.nightBus.gain.value = 0;
    // Day: air handlers and mains hum. Night: the same air, lower, and a detuned drone.
    this.loopNoise(500, 0.05, this.dayBus);
    this.osc('sine', 100, 0.012, this.dayBus);
    this.loopNoise(170, 0.09, this.nightBus);
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.connect(this.nightBus);
    this.osc('sawtooth', 55, 0.025, lp); this.osc('sawtooth', 55.7, 0.025, lp);
    // Radio: a speaker-shaped band, plus a slow echo for the night version.
    this.radio = a.createGain(); this.radio.gain.value = 0.09;
    const band = a.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 1400; band.Q.value = 0.6;
    this.radio.connect(band); band.connect(this.master);
    this.echo = a.createDelay(1); this.echo.delayTime.value = 0.37;
    const fb = a.createGain(); fb.gain.value = 0.45; this.echo.connect(fb); fb.connect(this.echo);
    this.echoOut = a.createGain(); this.echoOut.gain.value = 0; this.echo.connect(this.echoOut); this.echoOut.connect(band);
    this.radio.connect(this.echo);
    this.radioNext = a.currentTime + 0.2;
    setInterval(() => this.scheduleRadio(), 100);
  },
  osc(type, f, g, out) {
    const o = this.ctx.createOscillator(), v = this.ctx.createGain();
    o.type = type; o.frequency.value = f; v.gain.value = g; o.connect(v); v.connect(out); o.start();
  },
  loopNoise(cut, g, out) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut;
    const v = this.ctx.createGain(); v.gain.value = g; s.connect(f); f.connect(v); v.connect(out); s.start();
  },
  setLayer(layer) {
    this.layer = layer;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.dayBus.gain.setTargetAtTime(layer ? 0 : 1, now, 0.03);
    this.nightBus.gain.setTargetAtTime(layer ? 1 : 0, now, 0.03);
    this.echoOut.gain.setTargetAtTime(layer ? 0.7 : 0, now, 0.05);
    this.radio.gain.setTargetAtTime(mode === 'title' || mode === 'card' ? 0.05 : layer ? 0.07 : 0.09, now, 0.05);
  },
  toggle() {
    this.on = !this.on; store.set('sound', this.on ? 'on' : 'off');
    if (this.master) this.master.gain.value = this.on ? this.vol : 0;
    btnSound.textContent = t().sound(this.on);
  },
  env(node, t0, a, peak, dec) {
    node.gain.setValueAtTime(0.0001, t0);
    node.gain.exponentialRampToValueAtTime(peak, t0 + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t0 + a + dec);
  },
  tone(type, f, t0, dur, peak, out, f2) {
    const a = this.ctx, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    this.env(g, t0, 0.005, peak, dur); o.connect(g); g.connect(out || this.master); o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  },
  burst(t0, dur, peak, type, f, q, pan, out) {
    const a = this.ctx, s = a.createBufferSource(); s.buffer = this.noise;
    const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7;
    const g = a.createGain(); this.env(g, t0, 0.004, peak, dur);
    let last = g;
    if (pan !== undefined && a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); last = p; }
    s.connect(fl); fl.connect(g); last.connect(out || this.master); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  },
  // Church bell: inharmonic partials with different decays (hum, prime, minor third, fifth, octave...).
  bell(peak = 0.3, f0 = 196) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    [[0.5, 1, 4], [1, 1, 3], [1.19, 0.6, 2.5], [1.5, 0.45, 2], [2, 0.5, 1.6], [2.74, 0.25, 1], [3.01, 0.2, 0.8], [4.07, 0.12, 0.6]]
      .forEach(([r, amp, dec]) => this.tone('sine', f0 * r, t0, dec, peak * amp));
  },
  horn() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime, a = this.ctx;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.connect(this.master);
    for (const f of [98, 147, 196.5]) {
      const o = a.createOscillator(), g = a.createGain(); o.type = 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.4);
      g.gain.setValueAtTime(0.08, t0 + 2.2); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4);
      o.connect(g); g.connect(lp); o.start(t0); o.stop(t0 + 3.5);
    }
  },
  sfx(name, o = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    switch (name) {
      case 'shift':
        this.tone('sine', 900, t0, 0.2, 0.22, null, 55);
        this.burst(t0, 0.12, 0.18, 'highpass', 2500);
        this.tone('sine', 52, t0 + 0.02, 0.35, 0.3);
        break;
      case 'blocked': this.tone('square', 90, t0, 0.09, 0.08); break;
      case 'station': this.tone('triangle', 880, t0, 0.18, 0.12); this.tone('triangle', 1320, t0 + 0.09, 0.3, 0.1); break;
      case 'bell-warning': this.bell(0.12); break;
      case 'bell': this.bell(0.34); break;
      case 'beam-switch': this.tone('sawtooth', 140, t0, 0.18, 0.08, null, 40); this.burst(t0, 0.08, 0.06, 'bandpass', 3000, 2); break;
      case 'beam-warning': this.tone('sine', 220, t0, 0.3, 0.04, null, 440); break;
      case 'step':
        this.burst(t0, 0.06, o.gain || 0.05, 'bandpass', o.day ? 180 : 320, 3, o.pan);
        break;
      case 'heart':
        this.tone('sine', 62, t0, 0.14, o.gain || 0.2); this.tone('sine', 55, t0 + 0.17, 0.16, (o.gain || 0.2) * 0.7);
        break;
      case 'lost':
        this.burst(t0, 0.7, 0.5, 'lowpass', 2400);
        this.tone('sawtooth', 160, t0, 0.8, 0.25, null, 30);
        break;
      case 'won': this.burst(t0, 1.2, 0.16, 'highpass', 1200); this.tone('square', 70, t0 + 1.1, 0.12, 0.12); break;
    }
  },
  // Shift radio: an original waltz with mandolin tremolo. At night the same tune plays slower, lower and echoed.
  scheduleRadio() {
    if (!this.ctx || !this.on) return;
    const beat = 60 / 100;
    while (this.radioNext < this.ctx.currentTime + 0.4) {
      const [note, len, chord] = RADIO[this.radioPos % RADIO.length];
      const night = this.layer === 1 && mode === 'play';
      const k = night ? 0.79 : 1, slow = night ? 1.25 : 1;
      const t0 = this.radioNext, dur = len * beat * slow;
      if (note) {
        const f = 440 * Math.pow(2, (note - 69) / 12) * k;
        const reps = len >= 1 ? Math.floor(dur * 11) : 1;
        for (let r = 0; r < reps; r++) this.tone('triangle', f * (night ? 1 + (r % 2 ? 0.006 : -0.006) : 1), t0 + r / 11, 0.12, 0.5 * Math.pow(0.93, r), this.radio);
      }
      if (chord) {
        const [root, third, fifth] = chord;
        this.tone('triangle', 440 * Math.pow(2, (root - 69) / 12) * k, t0, 0.5, 0.35, this.radio);
        for (const b of [1, 2]) for (const n of [third, fifth]) {
          this.tone('triangle', 440 * Math.pow(2, (n - 69) / 12) * k, t0 + b * beat * slow, 0.18, 0.18, this.radio);
        }
      }
      this.radioNext += dur; this.radioPos++;
    }
  },
};
// [melody MIDI note or 0, length in beats, chord at the bar start: [bass, chord tone, chord tone]]
const Dm = [50, 65, 69], Gm = [43, 62, 67], A7 = [45, 61, 67], F = [41, 60, 65], Bb = [46, 62, 65];
const RADIO = [
  [74, 1, Dm], [77, 0.5], [76, 0.5], [74, 1], [69, 2, Dm], [65, 1],
  [67, 1, Gm], [69, 0.5], [70, 0.5], [72, 1], [69, 3, F],
  [70, 1, Bb], [69, 0.5], [67, 0.5], [65, 1], [64, 2, A7], [69, 1],
  [74, 1, Dm], [73, 0.5], [76, 0.5], [74, 1], [74, 3, Dm],
  [69, 1, F], [72, 1], [77, 1], [76, 2, A7], [73, 1],
  [74, 1, Dm], [70, 1], [67, 1], [69, 3, A7], [0, 3, Dm],
];

/* ---------- Input ---------- */
const held = new Set();
let queuedDir = null, queuedShift = false, lastDir = null;
const KEYDIR = {ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'};
addEventListener('keydown', e => {
  if (e.target instanceof Element && e.target.closest('select,input,textarea,button,a')) return;
  audio.unlock();
  const d = KEYDIR[e.code];
  if (d) { e.preventDefault(); if (!e.repeat) { held.add(d); lastDir = d; queuedDir = d; } return; }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') {
    e.preventDefault(); if (e.repeat) return;
    press('shift');
    if (e.code !== 'Space') stickyCheck();
    return;
  }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); press('enter'); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  if (e.code === 'KeyM') { audio.toggle(); return; }
  if (e.code === 'KeyR' && (mode === 'play' || mode === 'paused')) { checkpoint = null; startLevel(levelIndex); return; }
  if (e.code === 'KeyN' && mode === 'title') { progress = 0; store.set('level', 0); press('shift'); }
});
addEventListener('keyup', e => { const d = KEYDIR[e.code]; if (d) held.delete(d); });
addEventListener('blur', () => held.clear());
function press(what) {
  if (mode === 'play') { if (what === 'shift') queuedShift = true; return; }
  if (mode === 'title') { audio.unlock(); startCard(progress); return; }
  if (mode === 'card' && cardT > 20) { checkpoint = null; startLevel(levelIndex); return; }
  if (mode === 'ending' && cardT > 120) { mode = 'title'; audio.setLayer(0); }
}
// Touch pad: hold a direction, tap SHIFT.
document.querySelectorAll('.pad [data-dir]').forEach(b => {
  const d = b.dataset.dir;
  const on = e => { e.preventDefault(); audio.unlock(); held.add(d); lastDir = d; queuedDir = d; b.classList.add('on'); };
  const off = e => { e.preventDefault(); held.delete(d); b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
  b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});
const padShift = document.querySelector('.pad [data-k="shift"]');
padShift.addEventListener('pointerdown', e => { e.preventDefault(); audio.unlock(); press('shift'); padShift.classList.add('on'); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(n => padShift.addEventListener(n, () => padShift.classList.remove('on')));
cv.addEventListener('pointerdown', () => { audio.unlock(); if (mode !== 'play') press('enter'); });
// Gamepad: stick or d-pad to move, A or a shoulder button to shift, Start to pause.
let padPrev = {};
function pollPad() {
  let gp = null;
  try { gp = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).find(Boolean); } catch (_) { gp = null; }
  if (!gp) return;
  const b = n => !!(gp.buttons[n] && gp.buttons[n].pressed), ax = n => gp.axes[n] || 0;
  const now = {up: b(12) || ax(1) < -0.5, down: b(13) || ax(1) > 0.5, left: b(14) || ax(0) < -0.5, right: b(15) || ax(0) > 0.5,
    shift: b(0) || b(4) || b(5), start: b(9)};
  for (const d of ['up', 'down', 'left', 'right']) {
    if (now[d] && !padPrev[d]) { held.add(d); lastDir = d; queuedDir = d; }
    if (!now[d] && padPrev[d]) held.delete(d);
  }
  if (now.shift && !padPrev.shift) { audio.unlock(); press('shift'); }
  if (now.start && !padPrev.start) togglePause();
  padPrev = now;
}

/* ---------- Game flow ---------- */
let mode = 'title', levelIndex = 0, state = null, frame = 0, stepFrame = 0, cardT = 0, fx = 0, fxLayer = 0, deadT = 0;
let progress = clamp(+store.get('level') || 0, 0, levels.length - 1), deaths = 0, totalShifts = 0, heartT = 0, hintT = 0;
const deathsBy = levels.map(() => 0);
const BUILD = '0.3 · 2026-11-11';
// Testers can jump to an hour: ?stunde=3 or ?hour=3 opens the third hour.
const jump = +(new URLSearchParams(location.search).get('stunde') || new URLSearchParams(location.search).get('hour') || 0);
if (jump >= 1 && jump <= levels.length) progress = jump - 1;
function startCard(i) {
  levelIndex = i; mode = 'card'; cardT = 0;
  audio.setLayer(0); audio.bell(0.2);
}
let checkpoint = null, toastText = '', toastT = 0, shiftHintT = 0, stickyTimes = [], stickyWarned = store.get('sticky') === '1';
function toast(text, frames = 150) { toastText = text; toastT = frames; }
function stickyCheck() {
  if (stickyWarned || !/Windows/.test(navigator.userAgent)) return;
  const now = performance.now();
  stickyTimes = stickyTimes.filter(x => now - x < 3000).concat(now);
  if (stickyTimes.length >= 4) { stickyWarned = true; store.set('sticky', '1'); toast(t().sticky, 420); }
}
// After a death the hour resumes at the last process step; the previous shift returns to its posts.
function startLevel(i, resume = false) {
  levelIndex = i; mode = 'play'; stepFrame = 0; fx = 0; deadT = 0;
  if (resume && checkpoint) {
    state = C.clone(checkpoint);
    state.enemies.forEach((e, n) => { const s0 = levels[i].enemyStarts[n]; Object.assign(e, {x: s0.x, y: s0.y, px: s0.x, py: s0.y, moved: -1, fx: undefined, fy: undefined}); });
    state.px = state.x; state.py = state.y;
  } else { state = C.newState(levels[i]); hintT = 0; toastT = 0; shiftHintT = 0; }
  queuedDir = null; queuedShift = false;
  audio.setLayer(state.layer);
}
function togglePause() {
  if (mode === 'play') mode = 'paused';
  else if (mode === 'paused') mode = 'play';
}
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') mode = 'paused'; });

function nextAction() {
  if (queuedShift) { queuedShift = false; return 'shift'; }
  if (queuedDir) { const d = queuedDir; queuedDir = null; return d; }
  if (lastDir && held.has(lastDir)) return lastDir;
  for (const d of held) return d;
  return 'wait';
}

function doStep(action) {
  const before = state.layer, from = state.enemies.map(e => [e.x, e.y]);
  C.step(state, action);
  state.enemies.forEach((e, i) => { if (e.moved === state.step) { e.fx = from[i][0]; e.fy = from[i][1]; } });
  totalShifts += state.events.filter(e => e === 'shift').length;
  for (const ev of state.events) {
    if (ev === 'enemy-step') continue;
    if (['shift', 'blocked', 'station', 'bell', 'bell-warning', 'beam-switch', 'beam-warning', 'won', 'lost'].includes(ev)) audio.sfx(ev);
  }
  if (state.events.includes('enemy-step')) {
    for (const e of state.enemies) {
      if (e.moved !== state.step) continue;
      const dist = Math.abs(e.x - state.x) + Math.abs(e.y - state.y);
      if (dist <= 9) audio.sfx('step', {gain: 0.09 * (1 - dist / 10) * (state.layer ? 1 : 0.5), pan: (e.x - state.x) / 8, day: !state.layer});
    }
  }
  if (state.layer !== before) { fx = reduced ? 6 : 12; fxLayer = state.layer; audio.setLayer(state.layer); }
  if (state.events.includes('station') && state.status === 'play') { checkpoint = C.clone(state); toast(t().checkpoint, 100); }
  if (state.events.includes('bump')) {
    const [dx, dy] = C.DIRS[state.face], o = 1 - state.layer;
    if (C.walkable(state.level, o, state.x, state.y) && C.walkable(state.level, o, state.x + dx, state.y + dy)) shiftHintT = 120;
  }
  if (state.events.includes('shift')) shiftHintT = 0;
  if (state.status === 'lost') { mode = 'dead'; deadT = 0; deaths++; deathsBy[levelIndex]++; }
  if (state.status === 'won') {
    mode = 'clear'; deadT = 0;
    progress = Math.max(progress, Math.min(levelIndex + 1, levels.length - 1)); store.set('level', progress);
  }
}

function update() {
  frame++; pollPad();
  if (mode === 'card' || mode === 'ending') cardT++;
  if (mode === 'play') {
    hintT++;
    if (++stepFrame >= STEP_FRAMES) { stepFrame = 0; doStep(nextAction()); }
    // Heartbeat: faster and louder the closer the previous shift is, louder at night.
    const d = state.enemies.length ? C.nearestEnemy(state) : Infinity;
    if (d <= 7 && audio.ctx) {
      heartT -= 1 / 60;
      if (heartT <= 0) { audio.sfx('heart', {gain: (state.layer ? 0.28 : 0.12) * (1 - d / 9)}); heartT = 0.32 + d * 0.11; }
    }
  }
  if (fx > 0) fx--;
  if (toastT > 0) toastT--;
  if (shiftHintT > 0) shiftHintT--;
  if (mode === 'dead' && ++deadT > 70) startLevel(levelIndex, true);
  if (mode === 'clear' && ++deadT > 60) {
    checkpoint = null;
    if (levelIndex + 1 < levels.length) startCard(levelIndex + 1);
    else { mode = 'ending'; cardT = 0; audio.setLayer(0); audio.horn(); }
  }
}

/* ---------- Drawing: tiles ---------- */
const PAL = [
  {floor: '#b8c0cb', grate: '#a0a9b6', seam: '#aab2be', wall: '#f3f5f8', wallSide: '#6f7a8a', trim: '#2f6db3', mach: '#e9ecf0', machSide: '#8a95a4',
    panel: '#4c5663', screen: '#7fd0ff', hole: '#3b4350', text: '#14202e', glow: '#9fe0ff'},
  {floor: '#1c1407', grate: '#2b1f0b', seam: '#130d04', wall: '#4a3610', wallSide: '#2a1e08', trim: '#9a6c1e', mach: '#33260d', machSide: '#1d1506',
    panel: '#120d05', screen: '#c78b26', hole: '#030201', text: '#f0c060', glow: '#ffcc66'},
];
function tileAt(L, layer, x, y) { return x < 0 || y < 0 || x >= C.W || y >= C.H ? '#' : L.layers[layer][y * C.W + x]; }

function drawTile(L, layer, x, y) {
  const P = PAL[layer], c = tileAt(L, layer, x, y), px = x * T, py = FY + y * T, h = hash(x * 31 + y * 17 + layer * 7);
  if (c === '#') {
    R(P.wall, px, py, T, T);
    if (tileAt(L, layer, x, y + 1) !== '#') { R(P.wallSide, px, py + T - 6, T, 6); R(P.trim, px, py + T - 7, T, 1); R('rgba(0,0,0,.18)', px, py + T, T, 2); }
    if (layer && h > 0.7) R('#2c2008', px + (h * 10 | 0), py + 3, 1, 8);
    return;
  }
  if (c === 'o') {
    R(P.hole, px, py, T, T);
    if (tileAt(L, layer, x, y - 1) !== 'o') R(layer ? '#120c04' : '#596270', px, py, T, 3);
    return;
  }
  if (c === '=') {
    // Window to Lago Maggiore at night: dark water, the moon's reflection, lights on the far shore.
    R(layer ? '#040507' : '#0b1730', px, py, T, T);
    R(layer ? '#07080c' : '#132447', px, py + 9, T, 7);
    if (!layer) { R('#f2e6b0', px + 6 + (h * 4 | 0), py + 10 + (frame >> 4) % 2, 3, 1); R('#ffd27a', px + (h * 13 | 0), py + 6, 1, 1); }
    else if ((x + y) % 3 === 0) R('#a02818', px + 8, py + 6, 1, 1);
    R(layer ? '#2a1e08' : '#9aa6b5', px, py, T, 1); R(layer ? '#2a1e08' : '#9aa6b5', px, py + T - 1, T, 1);
    return;
  }
  R(P.floor, px, py, T, T);
  for (let gy = 2; gy < T; gy += 4) for (let gx = 2; gx < T; gx += 4) R(P.grate, px + gx, py + gy, 1, 1);
  R(P.seam, px, py, T, 1); R(P.seam, px, py, 1, T);
  if (layer && h > 0.82) { R('#0c0803', px + 3, py + 5, 7, 1); R('#0c0803', px + 9, py + 6, 3, 1); }
  if (c === 'M') {
    const up = tileAt(L, layer, x, y - 1) === 'M', down = tileAt(L, layer, x, y + 1) === 'M';
    const lf = tileAt(L, layer, x - 1, y) === 'M', rt = tileAt(L, layer, x + 1, y) === 'M';
    R(P.mach, px + (lf ? 0 : 1), py + (up ? 0 : 1), T - (lf ? 0 : 1) - (rt ? 0 : 1), T - (up ? 0 : 1));
    if (!down) R(P.machSide, px + (lf ? 0 : 1), py + T - 4, T - (lf ? 0 : 1) - (rt ? 0 : 1), 4);
    if (!up) {
      R(P.panel, px + 3, py + 3, T - 6, 5);
      const blink = layer ? (hash((frame >> 3) + x) > 0.4) : true;
      if (blink) R(P.screen, px + 4, py + 4, T - 8, 3);
      if (!lf) R(layer ? '#5a1408' : ((frame >> 5) + x) % 2 ? '#3fd06a' : '#1f7a3a', px + 3, py + 10, 2, 2);
    }
  }
}

function drawStationsAndExits(L, layer) {
  const P = PAL[layer];
  L.stations.forEach((s, n) => {
    if (s.layer !== layer) return;
    const px = s.x * T, py = FY + s.y * T, done = state.got > n, next = state.got === n;
    R(layer ? '#5a4214' : '#8e99a8', px + 2, py + 3, 12, 11);
    R(layer ? '#241a07' : '#d8dee6', px + 3, py + 4, 10, 6);
    R(layer ? '#9a6c1e' : '#2f6db3', px + 5, py + 6, 6, 3);
    txt(String(n + 1), px + 8, py + 4, {align: 'center', color: done ? '#7a8a7a' : P.text, shadow: null});
    if (done) R('#3fd06a', px + 11, py + 11, 3, 2);
    if (next && (frame >> 4) % 2) { ctx.strokeStyle = P.glow; ctx.lineWidth = 1; ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1); }
  });
  const open = state.got === L.stations.length;
  for (const e of L.exits) {
    if (e.layer !== layer) continue;
    const px = e.x * T, py = FY + e.y * T;
    R(layer ? '#3a2b0c' : '#7d8896', px, py, T, T);
    const gap = open ? 5 : 0;
    R(layer ? '#5c4514' : '#c8d0da', px + 1, py + 1, 7 - gap, 14); R(layer ? '#5c4514' : '#c8d0da', px + 8 + gap, py + 1, 7 - gap, 14);
    R(open ? '#3fd06a' : '#e0402a', px + 7, py + 1, 2, 2);
    if (open && (frame >> 4) % 2) { ctx.strokeStyle = '#3fd06a'; ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1); }
  }
}

function drawSigns(L, layer) {
  for (const e of L.exits) {
    if (tileAt(L, layer, e.x, e.y - 1) === '#') {
      const px = e.x * T, py = FY + (e.y - 1) * T;
      R(layer ? '#1f3a12' : '#1f9a4a', px - 11, py + 3, 38, 9);
      txt('USCITA', px + 8, py + 4, {align: 'center', color: layer ? '#6a8a40' : '#eaffef', shadow: null, max: 36});
    }
  }
  for (const s of L.signs || []) {
    const px = s.x * T, py = FY + s.y * T;
    const w = Math.max(38, s.text.length * 6 + 6);
    R(layer ? '#3a2a08' : s.bg || '#e8b020', px + 8 - w / 2, py + 3, w, 9);
    txt(s.text, px + 8, py + 4, {align: 'center', color: layer ? '#8a6420' : '#1a1004', shadow: null, max: w - 2});
  }
}

/* ---------- Drawing: figures ---------- */
function suit(px, py, face, layer, body, shade, visor, bob, outline) {
  if (outline) for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) suitShape(px + ox, py + oy, face, outline, outline, outline, bob);
  R('rgba(0,0,0,.28)', px + 3, py + 13, 10, 2);
  suitShape(px, py, face, body, shade, visor, bob);
}
function suitShape(px, py, face, body, shade, visor, bob) {
  const y = py + bob;
  R(shade, px + 4, y + 9, 3, 5); R(shade, px + 9, y + 9, 3, 5);
  R(body, px + 4, y + 4, 8, 7);
  R(body, px + 5, y + 1, 6, 5);
  R(shade, px + 4, y + 10, 8, 1);
  const vx = face === 'left' ? 5 : face === 'right' ? 7 : 6;
  if (face !== 'up') R(visor, px + vx, y + 2, 4, 2);
  R(shade, px + 3, y + 5, 1, 4); R(shade, px + 12, y + 5, 1, 4);
}
function drawPlayer(k) {
  const x = lerp(state.px, state.x, k), y = lerp(state.py, state.y, k);
  const moving = state.px !== state.x || state.py !== state.y;
  const bob = moving && k < 0.6 ? -1 : 0;
  const night = state.layer === 1;
  suit(x * T, FY + y * T, state.face, state.layer, night ? '#ffe2a0' : '#ffffff', night ? '#a07a32' : '#aeb8c6', night ? '#ffcf5a' : '#2f6fd0', bob, night ? '#000000' : '#1b2533');
  if (shiftHintT > 0 && (frame >> 3) % 4) {
    // The key itself, above the player: a wall here is open in the other shift.
    const kx = Math.round(x * T) - 4, ky = Math.round(FY + y * T) - 13;
    R('#000', kx - 1, ky - 1, 26, 11); R(night ? '#ffcf5a' : '#e9eef5', kx, ky, 24, 9); R(night ? '#a07a32' : '#9aa6b5', kx, ky + 7, 24, 2);
    txt('SHIFT', kx + 12, ky + 1, {align: 'center', color: '#0d1420', shadow: null, max: 22});
  }
}
// The previous shift creeps: each move is spread over its whole move interval.
function enemyPos(e) {
  if (e.moved < 0 || e.fx === undefined) return [e.x, e.y];
  const span = state.level.enemyEvery * STEP_FRAMES;
  const k = clamp(((state.step - e.moved) * STEP_FRAMES + stepFrame) / span, 0, 1);
  return [lerp(e.fx, e.x, k), lerp(e.fy, e.y, k)];
}
function drawEnemies(k, layer) {
  for (const e of state.enemies) {
    const [x, y] = enemyPos(e), px = x * T, py = FY + y * T;
    if (layer === 1) {
      const tilt = Math.round(Math.sin(frame / 37 + e.x) * 1), jit = !reduced && hash(frame + e.x * 9) > 0.96 ? 2 : 0;
      const ex = px + jit, ey = py - 5;
      R('rgba(0,0,0,.45)', px + 2, py + 13, 12, 3);
      R('#3d3625', ex + 4, ey + 13, 3, 7); R('#3d3625', ex + 9, ey + 13, 3, 7);
      R('#7d7458', ex + 3, ey + 5, 10, 10); R('#5e5640', ex + 3, ey + 12, 10, 2);
      R('#7d7458', ex + 2, ey + 6, 2, 11); R('#7d7458', ex + 12, ey + 6, 2, 11);
      R('#2a2418', ex + 2, ey + 16, 2, 2); R('#2a2418', ex + 12, ey + 16, 2, 2);
      R('#8f8466', ex + 4 + tilt, ey + 1, 8, 6); R('#050402', ex + 5 + tilt, ey + 3, 6, 3);
      R('#ffb43a', ex + 6 + tilt, ey + 4, 1, 1); R('#ffb43a', ex + 9 + tilt, ey + 4, 1, 1);
      R('#4a3a1a', ex + 6, ey + 8, 3, 2); R('#4a3a1a', ex + 9, ey + 11, 2, 1);
    } else {
      // By day only their shadows show, a little stretched, as if cast from the other shift.
      ctx.globalAlpha = 0.22 + 0.06 * Math.sin(frame / 9 + e.x);
      R('#0b1220', px + 4, py + 2, 8, 12); R('#0b1220', px + 5, py, 6, 3); R('#0b1220', px + 2, py + 13, 12, 2);
      ctx.globalAlpha = 1;
    }
  }
}
function drawEyesInDark() {
  for (const e of state.enemies) {
    const [x, y] = enemyPos(e), d = Math.hypot(x - state.x, y - state.y);
    if (d > 7) continue;
    ctx.globalAlpha = clamp((7 - d) / 4, 0, 0.9) * (hash(frame >> 2) > 0.08 ? 1 : 0.2);
    R('#ffb43a', x * T + 6, FY + y * T - 1, 1, 1); R('#ffb43a', x * T + 9, FY + y * T - 1, 1, 1);
    ctx.globalAlpha = 1;
  }
}

function drawBeams(L) {
  for (const b of L.beams) {
    const f = b.field;
    ctx.fillStyle = 'rgba(40,70,140,.07)'; ctx.fillRect(f.x0 * T, FY + f.y0 * T, (f.x1 - f.x0 + 1) * T, (f.y1 - f.y0 + 1) * T);
    ctx.fillStyle = 'rgba(40,70,140,.35)';
    for (let y = f.y0; y <= f.y1; y += 2) for (let x = f.x0; x <= f.x1; x += 3) {
      const cx = x * T + 8, cy = FY + y * T + 8;
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(205,215,235,.9)'; ctx.lineWidth = 0.6;
    for (let y = f.y0; y <= f.y1; y += 2) for (let x = f.x0; x <= f.x1; x += 3) {
      const cx = x * T + 8, cy = FY + y * T + 8;
      ctx.beginPath(); ctx.moveTo(cx - 1.5, cy - 1.5); ctx.lineTo(cx + 1.5, cy + 1.5); ctx.moveTo(cx + 1.5, cy - 1.5); ctx.lineTo(cx - 1.5, cy + 1.5); ctx.stroke();
    }
    const ph = b.phases[C.beamPhase(b, state.step)];
    const warn = b.every - (state.step % b.every) <= 6;
    if (warn && (frame >> 2) % 2) continue;
    const col = {B: '#9fe0ff', P: '#d59cff', As: '#9cff9c', BF2: '#ffe08a'}[ph.species];
    for (const [w, a] of [[5, 0.12], [3, 0.25], [1, 1]]) {
      ctx.strokeStyle = col; ctx.globalAlpha = a * (0.85 + 0.15 * Math.sin(frame / 3)); ctx.lineWidth = w;
      ctx.beginPath(); ph.points.forEach(([x, y], i) => i ? ctx.lineTo(x * T, FY + y * T) : ctx.moveTo(x * T, FY + y * T)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------- Drawing: scene and HUD ---------- */
function drawWorld(layer, k) {
  const L = state.level;
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) drawTile(L, layer, x, y);
  drawSigns(L, layer);
  drawStationsAndExits(L, layer);
  if (layer === 0) drawBeams(L);
  drawEnemies(k, layer);
  if (state.layer === layer) drawPlayer(k);
  if (layer === 1) {
    // Only the helmet lamp: a flickering circle of yellow light in the dark.
    const x = lerp(state.px, state.x, k) * T + 8, y = FY + lerp(state.py, state.y, k) * T + 8;
    const r = 58 + (reduced ? 0 : (hash(frame >> 2) - 0.5) * 4);
    const g = ctx.createRadialGradient(x, y, 6, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(2,1,0,.3)'); g.addColorStop(1, 'rgba(1,0,0,.97)');
    ctx.fillStyle = g; ctx.fillRect(0, FY, W, C.H * T);
    const warm = ctx.createRadialGradient(x, y, 2, x, y, r * 0.6);
    warm.addColorStop(0, 'rgba(255,190,80,.22)'); warm.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = warm; ctx.fillRect(0, FY, W, C.H * T);
    ctx.globalCompositeOperation = 'source-over';
    drawEyesInDark();
  } else {
    const v = ctx.createRadialGradient(W / 2, FY + 80, 60, W / 2, FY + 80, 210);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,20,40,.35)');
    ctx.fillStyle = v; ctx.fillRect(0, FY, W, C.H * T);
  }
}

function drawHUD() {
  const L = state.level, def = LEVELS[levelIndex], night = state.layer === 1;
  R(night ? '#0c0803' : '#0d1420', 0, 0, W, FY);
  R(night ? '#5a4214' : '#2f6db3', 0, FY - 1, W, 1);
  txt(def.time, 4, 4, {color: night ? '#ffcf5a' : '#9fe0ff'});
  txt(def.title[lang].toUpperCase(), 34, 4, {color: '#8c93a8', max: 90});
  txt(night ? t().night : t().day, W / 2 + 18, 4, {align: 'center', color: night ? '#ffb43a' : '#e9eef5'});
  let right = '';
  if (state.got < L.stations.length && def.route) right = `${state.got + 1}/${L.stations.length} ${def.route[state.got][lang].toUpperCase()}`;
  else right = state.got === L.stations.length && L.stations.length ? t().open : t().airlock;
  txt(right, W - 4, 4, {align: 'right', color: state.got === L.stations.length ? '#7be08f' : '#c9c2ae', max: 96});
  if (L.bell) {
    const left = C.bellIn(state), w = 40, k = 1 - left / L.bell;
    R('#1a1e2a', W / 2 - 2 - w / 2 + 18, 13, w, 2);
    R(left <= C.BELL_WARNING && (frame >> 3) % 2 ? '#ff6a3a' : '#c9a15a', W / 2 - 2 - w / 2 + 18, 13, Math.round(w * k), 2);
  }
  const def2 = LEVELS[levelIndex];
  if (L.beams.length && (hintT >= 300 || !def2.hint)) {
    const b = L.beams[0], ph = b.phases[C.beamPhase(b, state.step)], next = b.phases[(C.beamPhase(b, state.step) + 1) % b.phases.length];
    R('rgba(0,0,0,.55)', 0, FY + C.H * T - 13, W, 13);
    txt(`${t().ion}: ${ph.species}+ ${ph.mass} u · r = ${ph.radiusMeters.toFixed(2)} m · ${b.keV} keV · ${b.field.B} T`, 4, FY + C.H * T - 11, {color: '#9fe0ff', max: 230});
    txt(`→ ${next.species}+ ${Math.ceil((b.every - state.step % b.every) * STEP_FRAMES / 60)} s`, W - 4, FY + C.H * T - 11, {align: 'right', color: '#c9c2ae'});
  }
  if (hintT < 300 && def2.hint) {
    ctx.globalAlpha = clamp((300 - hintT) / 40, 0, 1);
    R('rgba(0,0,0,.6)', 0, FY + C.H * T - 13, W, 13);
    txt(def2.hint[lang], W / 2, FY + C.H * T - 11, {align: 'center', color: '#e9e4d6'});
    ctx.globalAlpha = 1;
  }
}

function renderPlay() {
  const k = clamp(stepFrame / STEP_FRAMES, 0, 1);
  ctx.save();
  if (fx > 0 && !reduced) ctx.translate(Math.round((hash(frame) - 0.5) * 3), 0);
  drawWorld(state.layer, mode === 'play' ? k : 1);
  ctx.restore();
  drawHUD();
  if (toastT > 0) {
    ctx.globalAlpha = clamp(toastT / 20, 0, 1);
    ctx.font = '400 8px "Silkscreen", monospace';
    const w = Math.min(W - 16, ctx.measureText(toastText).width + 14);
    R('rgba(5,6,10,.85)', W / 2 - w / 2, FY + 4, w, 13); R(state.layer ? '#ffb43a' : '#9fe0ff', W / 2 - w / 2, FY + 16, w, 1);
    txt(toastText, W / 2, FY + 7, {align: 'center', color: '#e9e4d6', max: w - 10});
    ctx.globalAlpha = 1;
  }
  if (fx > 0) {
    // The shift: the picture tears into horizontal slices, washed in the colour of the new layer.
    const a = fx / 12;
    if (!reduced) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 9; i++) {
        const sy = Math.floor(hash(i + frame) * cv.height), sh = 6 + Math.floor(hash(i * 3 + frame) * 40);
        ctx.drawImage(cv, 0, sy, cv.width, sh, Math.round((hash(i * 7 + frame) - 0.5) * 60 * a), sy, cv.width, sh);
      }
      ctx.restore();
    }
    ctx.fillStyle = fxLayer ? `rgba(255,180,50,${0.35 * a})` : `rgba(230,245,255,${0.45 * a})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function renderDead() {
  renderPlay();
  const k = deadT / 70;
  ctx.fillStyle = `rgba(0,0,0,${clamp(k * 1.6, 0, 0.92)})`; ctx.fillRect(0, 0, W, H);
  if (deadT < 34) {
    // A visor fills the screen for a moment.
    const s = reduced ? 1 : 1 + deadT / 60, cx = W / 2, cy = H / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    R('#8f8466', -60, -50, 120, 110); R('#4e4632', -60, 40, 120, 20);
    R('#050402', -42, -26, 84, 30);
    R('#ffb43a', -20, -14, 5, 4); R('#ffb43a', 15, -14, 5, 4);
    ctx.restore();
    if (!reduced) for (let i = 0; i < 300; i++) R(hash(i + frame) > 0.5 ? '#fff' : '#000', hash(i * 3 + frame) * W, hash(i * 7 + frame) * H, 1, 1);
  }
  const cause = state.cause === 'crushed' ? t().crushed : state.cause === 'robot' ? t().robot : state.cause === 'beam' ? t().beam : t().caught;
  if (deadT > 30) txt(cause, W / 2, H / 2 - 8, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: '#e0402a'});
}

function renderCard() {
  const def = LEVELS[levelIndex];
  R('#07080c', 0, 0, W, H);
  txt('VOGT MICROELETTRONICA · LUINO · BAY 7', W / 2, 10, {align: 'center', color: '#4c5470'});
  txt(def.time, W / 2, 24, {align: 'center', size: 32, font: 'Pixelify Sans', weight: 700, color: '#ffcf5a', shadow: '#3a2200'});
  txt(def.title[lang].toUpperCase(), W / 2, 60, {align: 'center', size: 8, color: '#c9c2ae'});
  const shown = Math.floor(cardT / 1.5);
  let used = 0;
  def.log[lang].forEach((line, i) => {
    const part = line.slice(0, Math.max(0, shown - used)); used += line.length;
    txt(part, W / 2, 76 + i * 11, {align: 'center', color: '#e9e4d6', font: 'IBM Plex Sans', size: 8});
  });
  if (def.fact) {
    const y0 = 116;
    R('#0f1422', 14, y0 - 4, W - 28, 44); R('#2f6db3', 14, y0 - 4, 2, 44);
    txt(t().physics, 22, y0 - 1, {color: '#9fe0ff'});
    def.fact[lang].forEach((line, i) => txt(line, 22, y0 + 10 + i * 9, {color: '#b9c2cf', font: 'IBM Plex Sans', size: 7, max: W - 44}));
  }
  if (cardT > 20 && (frame >> 5) % 2) txt(t().cont, W / 2, H - 10, {align: 'center', color: '#6b7190'});
}

function renderTitle() {
  R('#05060a', 0, 0, W, H);
  const split = W / 2 + Math.round(Math.sin(frame / 50) * 20);
  // The fab on the shore of Lago Maggiore: left of the split by day light, right of it in the night shift.
  for (let x = 0; x < W; x += 2) {
    const night = x >= split, h = 22 + (x > 40 && x < 250 ? 18 : 0) + ((x / 2 | 0) % 37 < 4 ? 10 : 0);
    R(night ? '#100b04' : '#141c2c', x, 126 - h, 2, h);
    R(night ? '#080603' : '#0b1322', x, 128, 2, 30);
    if (hash(x) > 0.82) {
      const lit = night ? hash(x + (frame >> 6)) > 0.5 : true;
      if (lit) { R(night ? '#c78b26' : '#bfe6ff', x, 126 - h + 6 + (hash(x * 3) * 10 | 0), 2, 2); R(night ? 'rgba(199,139,38,.35)' : 'rgba(191,230,255,.25)', x, 134 + (hash(x * 5) * 18 | 0) + ((frame >> 4) + x) % 2, 2, 1); }
    }
  }
  // The campanile of Luino across the water.
  R('#0d0f16', 280, 92, 8, 34); R('#0d0f16', 278, 88, 12, 5); R('#0d0f16', 283, 80, 2, 8);
  if ((frame >> 5) % 4 === 0) R('#a02818', 283, 95, 2, 2);
  R('#0a0d16', 0, 158, W, 22);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, split, H); ctx.clip();
  txt('SCHICHTWECHSEL', W / 2, 34, {align: 'center', size: 32, font: 'Pixelify Sans', weight: 700, color: '#e9eef5', shadow: '#2f6db3'});
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(split, 0, W - split, H); ctx.clip();
  txt('SCHICHTWECHSEL', W / 2 + (reduced ? 0 : (hash(frame >> 3) > 0.9 ? 2 : 0)), 34, {align: 'center', size: 32, font: 'Pixelify Sans', weight: 700, color: '#ffb43a', shadow: '#3a2200'});
  ctx.restore();
  R('#e9eef5', split, 30, 1, 40);
  txt(t().sub, W / 2, 72, {align: 'center', color: '#8c93a8'});
  txt(t().tagline, W / 2, 84, {align: 'center', color: '#c9c2ae', font: 'IBM Plex Sans', size: 8});
  if ((frame >> 5) % 2) txt(t().press, W / 2, 98, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: '#ffcf5a', shadow: '#3a2200'});
  if (!isTouch) txt(t().orSpace, W / 2, 112, {align: 'center', color: '#6b7190'});
  if (progress > 0) {
    txt(`${t().resume} ${LEVELS[progress].time}`, W / 2, 124, {align: 'center', color: '#c9c2ae'});
    if (!isTouch) txt(t().fresh, W / 2, 134, {align: 'center', color: '#6b7190'});
  }
  txt(t().credit, W / 2, H - 10, {align: 'center', color: '#4c5470', font: 'IBM Plex Sans', size: 6});
  txt('v' + BUILD, W - 3, 3, {align: 'right', color: '#2c3248', font: 'IBM Plex Sans', size: 6, shadow: null});
}

function renderEnding() {
  R('#07080c', 0, 0, W, H);
  const dawn = clamp(cardT / 600, 0, 1);
  const g = ctx.createLinearGradient(0, 100, 0, 180);
  g.addColorStop(0, `rgba(40,50,80,${dawn})`); g.addColorStop(1, `rgba(220,140,90,${dawn * 0.6})`);
  ctx.fillStyle = g; ctx.fillRect(0, 100, W, 80);
  R('#0b0f18', 0, 150, W, 30);
  txt(ENDING.time, W / 2, 16, {align: 'center', size: 32, font: 'Pixelify Sans', weight: 700, color: '#ffcf5a', shadow: '#3a2200'});
  const shown = Math.floor(cardT / 2);
  let used = 0;
  ENDING.log[lang].forEach((line, i) => {
    const part = line.slice(0, Math.max(0, shown - used)); used += line.length + 4;
    txt(part, W / 2, 56 + i * 11, {align: 'center', color: i >= 4 ? '#e0402a' : '#e9e4d6', font: 'IBM Plex Sans', size: 8});
  });
  if (cardT > 260) {
    txt(t().stats(deaths, totalShifts), W / 2, 126, {align: 'center', color: '#8c93a8'});
    txt(LEVELS.map((d, i) => `${d.time} ${deathsBy[i]}`).join('  '), W / 2, 136, {align: 'center', color: '#6b7190', max: W - 20});
  }
  if (cardT > 300) txt(t().thanks, W / 2, 148, {align: 'center', color: '#c9c2ae'});
  txt(t().credit, W / 2, H - 10, {align: 'center', color: '#4c5470', font: 'IBM Plex Sans', size: 6});
}

function render() {
  ctx.setTransform(Z, 0, 0, Z, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (mode === 'title') return renderTitle();
  if (mode === 'card') return renderCard();
  if (mode === 'ending') return renderEnding();
  if (mode === 'dead') return renderDead();
  renderPlay();
  if (mode === 'clear') {
    ctx.fillStyle = `rgba(0,0,0,${clamp(deadT / 60, 0, 1)})`; ctx.fillRect(0, 0, W, H);
  }
  if (mode === 'paused') {
    R('rgba(5,6,10,.7)', 0, 0, W, H);
    txt(t().paused, W / 2, 70, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: '#ffcf5a'});
    txt(t().pausedHint, W / 2, 96, {align: 'center', color: '#c9c2ae'});
    txt(t().retry, W / 2, 108, {align: 'center', color: '#6b7190'});
  }
}

/* ---------- Page controls ---------- */
const btnSound = document.getElementById('btnSound'), btnPause = document.getElementById('btnPause'), btnFull = document.getElementById('btnFull');
btnSound.addEventListener('click', e => { audio.unlock(); audio.toggle(); e.currentTarget.blur(); });
const volume = document.getElementById('volume');
volume.value = Math.round(audio.vol * 100);
volume.addEventListener('input', () => {
  audio.vol = volume.value / 100; store.set('volume', volume.value);
  if (audio.master && audio.on) audio.master.gain.value = audio.vol;
});
btnPause.addEventListener('click', e => { togglePause(); e.currentTarget.blur(); });
btnFull.addEventListener('click', e => {
  e.currentTarget.blur();
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else { const p = document.body.requestFullscreen && document.body.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
  } catch (_) { /* fullscreen unavailable */ }
});
applyLanguage();

/* ---------- Main loop ---------- */
let last = performance.now(), acc = 0;
const FRAME = 1000 / 60;
function loop(now) {
  acc += Math.min(250, now - last); last = now;
  while (acc >= FRAME) { update(); acc -= FRAME; }
  render();
  requestAnimationFrame(loop);
}
if (new URLSearchParams(location.search).has('test')) {
  // Test hook: deterministic control for the browser check, only with ?test in the URL.
  window.__schicht = {
    levels, get state() { return state; }, get mode() { return mode; },
    card: i => startCard(i), start: i => startLevel(i), act: a => doStep(a), render, update,
    setLayer: l => audio.setLayer(l), lang: l => { lang = l; applyLanguage(); },
  };
}
render();
requestAnimationFrame(loop);
})();
