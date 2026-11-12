/* Schichtwechsel - rendering, audio, input and screens. Rules live in core.js, levels in levels.js. */
(() => {
'use strict';
const C = window.SchichtCore, {LEVELS, ENDING, INTRO} = window.SchichtLevels;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const W = 320, H = 180, Z = 4, T = 16, FY = 16;
const STEP_FRAMES = 7;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const levels = LEVELS.map(d => C.parseLevel(d));

/* ---------- Language ---------- */
const UI = {
  de: {
    day: 'DEINE SCHICHT', night: 'VORSCHICHT', open: 'SCHLEUSE OFFEN', airlock: 'ZUR SCHLEUSE', layerWord: 'SCHICHT',
    press: isTouch ? 'SHIFT TIPPEN' : 'SHIFT DRÜCKEN', orSpace: 'oder Leertaste', cont: isTouch ? 'SHIFT: WEITER' : 'SHIFT ODER ENTER: WEITER',
    tagline: 'Die Vorschicht ist nie gegangen. Sie ist eine Schicht geworden.', checkpoint: 'PROZESSSCHRITT GESICHERT',
    sticky: 'Tipp: Die Leertaste wechselt auch die Schicht (Windows-Einrastfunktion).',
    resume: 'Weiter ab', fresh: 'N: neue Nacht ab 22:00', physics: 'PHYSIK DER SCHICHT',
    caught: 'ERWISCHT', crushed: 'EINGEMAUERT', robot: 'ÜBERFAHREN', beam: 'IM STRAHL', heat: 'VERBRANNT', plasma: 'IM PLASMA',
    paused: 'PAUSE', pausedHint: 'P oder ESC: weiter', bell: 'GLOCKE', ion: 'IONEN', retry: 'R: neu versuchen',
    stats: (d, s) => `Erwischt: ${d}   Schichtwechsel: ${s}`, thanks: 'Danke fürs Spielen.',
    sub: 'TURNO DI NOTTE · LUINO', credit: 'Ein Spiel von Maurizio Odenwaeller für Game Off 2026 · entwickelt mit Claude',
    sound: on => 'Ton: ' + (on ? 'an' : 'aus'), pause: 'Pause', full: 'Vollbild',
  },
  en: {
    day: 'YOUR SHIFT', night: 'THE SHIFT BEFORE', open: 'AIRLOCK OPEN', airlock: 'TO THE AIRLOCK', layerWord: 'LAYER',
    press: isTouch ? 'TAP SHIFT' : 'PRESS SHIFT', orSpace: 'or Space', cont: isTouch ? 'SHIFT: CONTINUE' : 'SHIFT OR ENTER: CONTINUE',
    tagline: 'The previous shift never left. They became a layer.', checkpoint: 'PROCESS STEP SAVED',
    sticky: 'Tip: Space changes the shift too (Windows Sticky Keys).',
    resume: 'Continue from', fresh: 'N: new night from 22:00', physics: 'PHYSICS OF THE SHIFT',
    caught: 'CAUGHT', crushed: 'WALLED IN', robot: 'RUN OVER', beam: 'IN THE BEAM', heat: 'BURNED', plasma: 'IN THE PLASMA',
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
  // Rain: a looped band of noise; louder outdoors, a murmur through the walls.
  rain(level) {
    if (!this.ctx) return;
    if (!this.rainGain) {
      const src = this.ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.4;
      this.rainGain = this.ctx.createGain(); this.rainGain.gain.value = 0;
      src.connect(bp); bp.connect(this.rainGain); this.rainGain.connect(this.master); src.start();
    }
    this.rainGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.4);
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
      case 'zap': this.tone('sawtooth', 1800, t0, 0.05, 0.03, null, 900); break;
      case 'error': this.tone('square', 880, t0, 0.15, 0.08); this.tone('square', 880, t0 + 0.25, 0.15, 0.08); this.tone('sine', 300, t0, 1.8, 0.05, null, 2400); break;
      case 'click': this.tone('square', 160, t0, 0.03, 0.2); this.burst(t0, 0.05, 0.2, 'highpass', 3000); break;
      case 'powerdown': this.tone('sawtooth', 120, t0, 2.2, 0.12, null, 18); this.tone('sine', 60, t0, 2.2, 0.15, null, 12); break;
      case 'hum': this.tone('sawtooth', 50, t0, 5.5, 0.04); this.tone('sine', 100, t0, 5.5, 0.03); break;
      case 'eyes': this.tone('sine', 1250, t0, 0.9, 0.03); this.tone('sine', 1257, t0, 0.9, 0.03); break;
      case 'shower': this.burst(t0, 2.8, 0.14, 'highpass', 700); this.burst(t0, 2.8, 0.08, 'lowpass', 300); break;
      case 'rustle': for (let i = 0; i < 4; i++) this.burst(t0 + i * 0.12, 0.1, 0.06, 'bandpass', 2500, 1.5); break;
      case 'door': this.burst(t0, 0.35, 0.1, 'lowpass', 600); this.tone('square', 55, t0 + 0.3, 0.1, 0.08); break;
      case 'pulse': this.tone('sawtooth', 110, t0, 0.35, 0.07, null, 220); this.burst(t0, 0.3, 0.05, 'bandpass', 1800, 4); break;
      case 'pulse-warning': this.tone('sine', 330, t0, 0.15, 0.03); break;
      case 'furnace-open': this.burst(t0, 0.9, 0.08, 'lowpass', 300); this.tone('sine', 40, t0, 0.8, 0.12); break;
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
  if (e.code === 'KeyN' && mode === 'title') { progress = 0; store.set('level', 0); audio.unlock(); startCinema(); }
});
addEventListener('keyup', e => { const d = KEYDIR[e.code]; if (d) held.delete(d); });
addEventListener('blur', () => held.clear());
function press(what) {
  if (mode === 'cinema') { if (cinemaT > 0.4) startIntro(); return; }
  if (introMode && (mode === 'play' || mode === 'shower')) { if (what === 'enter') endIntro(); return; }
  if (mode === 'process') { if (procT > 40) mode = 'play'; return; }
  if (mode === 'play') { if (what === 'shift') queuedShift = true; return; }
  if (mode === 'title') { audio.unlock(); if (progress === 0) startCinema(); else startCard(progress); return; }
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
let mode = 'title', levelIndex = 0, state = null, frame = 0, stepFrame = 0, cardT = 0, fx = 0, fxLayer = 0, deadT = 0, shake = 0;
let progress = clamp(+store.get('level') || 0, 0, levels.length - 1), deaths = 0, totalShifts = 0, heartT = 0, hintT = 0;
const deathsBy = levels.map(() => 0);
const BUILD = '0.7 · 2026-11-12';
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
/* ---------- Intro: corridor, gowning room, air shower ---------- */
let introMode = false, suited = false, showerT = 0, showerDone = false, introSeen = new Set(), procT = 0, procType = '';
const idx = (x, y) => y * C.W + x;
function introDoors(L) { const d = []; for (let i = 0; i < L.layers[0].length; i++) if (L.layers[0][i] === 'D') d.push(i); return d.sort((a, b) => a - b); }
/* ---------- Prologue (no words) ---------- */
let cinemaT = 0;
function startCinema() { mode = 'cinema'; cinemaT = 0; audio.setLayer(0); audio.rain(0.09); }
// Sound cues per shot: [shot, second, cue].
const CUES = [[0, 0.8, 'bell'], [0, 2.9, 'bell'], [1, 0.1, 'hum'], [1, 3.6, 'click'], [2, 2.6, 'error'], [3, 2.3, 'click'], [3, 2.4, 'powerdown'],
  [4, 0.6, 'heart'], [4, 1.2, 'eyes'], [4, 1.6, 'heart'], [4, 2.0, 'eyes'], [4, 2.6, 'heart'], [4, 2.8, 'eyes'], [5, 3.0, 'horn']];
function updateCinema() {
  const before = window.SchichtCinema.shotAt(cinemaT);
  cinemaT += 1 / 60;
  const [shot, t] = window.SchichtCinema.shotAt(cinemaT);
  if (shot !== before[0]) audio.rain(shot === 0 || shot === 5 ? 0.09 : shot === 4 ? 0 : 0.02);
  for (const [s, at, cue] of CUES) {
    if (shot !== s || t < at || (before[0] === s && before[1] >= at)) continue;
    if (cue === 'bell') audio.bell(0.3); else if (cue === 'horn') audio.horn(); else audio.sfx(cue, {gain: 0.25});
  }
  if (shot === 2 && t < 2.6 && frame % 6 === 0) audio.sfx('zap');
  if (cinemaT >= window.SchichtCinema.TOTAL) startIntro();
}
function startIntro() {
  const L = C.parseLevel(INTRO);
  const [entry] = introDoors(L);
  L.open = new Set([entry]); L.walk[0][entry] = 1; L.showerT = 0;
  introMode = true; suited = false; showerT = 0; showerDone = false; introSeen = new Set();
  state = C.newState(L); mode = 'play'; stepFrame = 0; fx = 0; hintT = 999; toastT = 0; checkpoint = null;
  audio.setLayer(0);
}
function endIntro() {
  introMode = false; store.set('intro', '1');
  startCard(0);
}
function introStep() {
  const L = state.level;
  INTRO.triggers.forEach((tr, n) => {
    if (!introSeen.has(n) && Math.abs(tr.x - state.x) + Math.abs(tr.y - state.y) <= 1) { introSeen.add(n); toast(tr.text[lang], 420); }
  });
  if (!suited && state.y <= 4 && state.x >= INTRO.suitAt) { suited = true; audio.sfx('rustle'); fx = 6; fxLayer = 0; }
  if (!showerDone && L.layers[0][idx(state.x, state.y)] === 'A' && suited) {
    const [entry] = introDoors(L);
    L.open.delete(entry); L.walk[0][entry] = 0;
    mode = 'shower'; showerT = 0; audio.sfx('door'); audio.sfx('shower');
  }
}
function updateShower() {
  const L = state.level;
  L.showerT = ++showerT;
  if (showerT === 90) audio.sfx('shower');
  if (showerT > 180) {
    const [, exit] = introDoors(L);
    L.open.add(exit); L.walk[0][exit] = 1; L.showerT = 0; showerDone = true; mode = 'play'; audio.sfx('door');
  }
}

// After a death the hour resumes at the last process step; the previous shift returns to its posts.
function startLevel(i, resume = false) {
  introMode = false; audio.rain(0);
  levelIndex = i; mode = 'play'; stepFrame = 0; fx = 0; deadT = 0;
  if (resume && checkpoint) {
    state = C.clone(checkpoint);
    state.enemies.forEach((e, n) => { const s0 = levels[i].enemyStarts[n]; Object.assign(e, {x: s0.x, y: s0.y, px: s0.x, py: s0.y, moved: -1, fx: undefined, fy: undefined}); });
    state.px = state.x; state.py = state.y;
    state.safeUntil = state.step + 14;
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
  if (introMode) queuedShift = false;
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
    if (['shift', 'blocked', 'station', 'bell', 'bell-warning', 'beam-switch', 'beam-warning', 'won', 'lost', 'pulse', 'pulse-warning', 'furnace-open'].includes(ev)) audio.sfx(ev);
    if (ev === 'bell' && !reduced) shake = 10;
  }
  if (state.events.includes('enemy-step')) {
    for (const e of state.enemies) {
      if (e.moved !== state.step) continue;
      const dist = Math.abs(e.x - state.x) + Math.abs(e.y - state.y);
      if (dist <= 9) audio.sfx('step', {gain: 0.09 * (1 - dist / 10) * (state.layer ? 1 : 0.5), pan: (e.x - state.x) / 8, day: !state.layer});
    }
  }
  if (state.layer !== before) { fx = reduced ? 6 : 12; fxLayer = state.layer; audio.setLayer(state.layer); }
  if (state.events.includes('station') && state.status === 'play') {
    checkpoint = C.clone(state); toast(t().checkpoint, 100);
    const step = LEVELS[levelIndex].route && LEVELS[levelIndex].route[state.got - 1];
    if (step && step.proc && window.SchichtProcess) { procType = step.proc; procT = 0; mode = 'process'; }
  }
  if (state.events.includes('bump')) {
    const [dx, dy] = C.DIRS[state.face], o = 1 - state.layer;
    if (C.walkable(state.level, o, state.x, state.y) && C.walkable(state.level, o, state.x + dx, state.y + dy)) shiftHintT = 120;
  }
  if (state.events.includes('shift')) shiftHintT = 0;
  if (introMode) introStep();
  if (state.status === 'lost') { mode = 'dead'; deadT = 0; deaths++; deathsBy[levelIndex]++; }
  if (state.status === 'won' && introMode) { audio.sfx('door'); endIntro(); return; }
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
  if (shake > 0) shake--;
  if (toastT > 0) toastT--;
  if (shiftHintT > 0) shiftHintT--;
  if (mode === 'cinema') updateCinema();
  if (mode === 'process' && ++procT > window.SchichtProcess.DURATION) mode = 'play';
  if (mode === 'shower') updateShower();
  if (mode === 'dead' && ++deadT > 70) startLevel(levelIndex, true);
  if (mode === 'clear' && ++deadT > 60) {
    checkpoint = null;
    if (levelIndex + 1 < levels.length) startCard(levelIndex + 1);
    else { mode = 'ending'; cardT = 0; audio.setLayer(0); audio.horn(); }
  }
}

/* ---------- World ---------- */
// The previous shift creeps: each move is spread over its whole move interval.
function enemyPos(e) {
  if (e.moved < 0 || e.fx === undefined) return [e.x, e.y];
  const span = state.level.enemyEvery * STEP_FRAMES * (state.layer ? 1 : 2);
  const k = clamp(((state.step - e.moved) * STEP_FRAMES + stepFrame) / span, 0, 1);
  return [lerp(e.fx, e.x, k), lerp(e.fy, e.y, k)];
}

// Cross-section of lot 4471: substrate at the bottom, one more layer after every completed hour.
function drawStack(x0, y0, w, h, n) {
  const si = y0 + h - 26, holes = [0.2, 0.5, 0.8].map(f => Math.round(x0 + f * w) - 5), pulse = 0.55 + 0.45 * Math.sin(frame / 10);
  R('#0b0e16', x0 - 4, y0 - 4, w + 8, h + 8); R('#232b44', x0 - 4, y0 - 4, w + 8, 1);
  R('#4f5866', x0, si, w, 26);
  for (let y = si + 3; y < si + 26; y += 4) for (let x = x0 + 2 + (y % 8 ? 2 : 0); x < x0 + w; x += 4) R('#5d6775', x, y, 1, 1);
  const glow = (k, y, hh) => { if (k === n) { ctx.strokeStyle = `rgba(255,190,80,${pulse})`; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y + 0.5, w - 1, hh - 1); } };
  if (n >= 4) for (const hx of holes) {
    const wide = n >= 5 ? 9 : 5, deep = n >= 5 ? 9 : 5;
    ctx.fillStyle = 'rgba(150,100,230,.85)'; ctx.beginPath(); ctx.ellipse(hx + 5, si, wide + 3, deep, 0, 0, Math.PI); ctx.fill();
  }
  if (n === 4 || n === 5) glow(n, si, 10);
  let top = si;
  if (n >= 1) {
    top = si - 4; R('#cfe8ff', x0, top, w, 4);
    if (n >= 3) for (const hx of holes) R('#4f5866', hx, top, 10, 4);
    glow(1, top, 4);
  }
  if (n === 2 || n === 3) {
    R('#d9a032', x0, top - 7, w, 7);
    if (n === 3) for (const hx of holes) R('#0b0e16', hx, top - 7, 10, 7);
    glow(n, top - 7, 7);
  }
  if (n >= 6) {
    const ild = top - 10; R('#a9cbe6', x0, ild, w, 10);
    for (const hx of holes) R(n >= 7 ? '#c9ced6' : '#0b0e16', hx + 2, ild, 6, 14);
    glow(6, ild, 10); top = ild;
  }
  if (n >= 7) { R('#c9ced6', x0, top - 5, w, 5); R('#e6e9ee', x0, top - 5, w, 1); glow(7, top - 5, 5); top -= 5; }
  if (n >= 8) {
    R('#262a34', x0, top - 4, w, 4); glow(8, top - 4, 4);
    // Three faces pressed into the last layer.
    for (const fx of [0.3, 0.55, 0.78]) {
      const cx = Math.round(x0 + fx * w);
      R('#3a3f4c', cx - 2, top - 4, 5, 4); R('#ffb43a', cx - 1, top - 3, 1, 1); R('#ffb43a', cx + 1, top - 3, 1, 1);
    }
  }
}

/* ---------- Drawing: HUD ---------- */
function drawHUD() {
  if (introMode) {
    R('#0d1420', 0, 0, W, FY); R('#2f6db3', 0, FY - 1, W, 1);
    txt(`${INTRO.time} · ${INTRO.layer[lang].toUpperCase()}`, 4, 4, {color: '#9fe0ff'});
    txt(lang === 'de' ? 'ENTER: ÜBERSPRINGEN' : 'ENTER: SKIP', W - 4, 4, {align: 'right', color: '#6b7190'});
    return;
  }
  const L = state.level, def = LEVELS[levelIndex], night = state.layer === 1;
  R(night ? '#0c0803' : '#0d1420', 0, 0, W, FY);
  R(night ? '#5a4214' : '#2f6db3', 0, FY - 1, W, 1);
  txt(`${t().layerWord} ${levelIndex + 1}/${LEVELS.length}`, 4, 4, {color: night ? '#ffcf5a' : '#9fe0ff'});
  txt(def.layer[lang].toUpperCase(), 66, 4, {color: '#8c93a8', max: 64});
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
  R('#000', 0, 0, W, H);
  ctx.save();
  // The fab is drawn at twice the resolution of the interface: 640 x 360.
  ctx.setTransform(Z / 2, 0, 0, Z / 2, 0, 0);
  if (fx > 0 && !reduced) ctx.translate(Math.round((hash(frame) - 0.5) * 6), 0);
  if (shake > 0) ctx.translate(Math.round((hash(frame * 3) - 0.5) * shake * 0.8), Math.round((hash(frame * 5) - 0.5) * shake * 0.6));
  window.SchichtWorld.draw(ctx, state, {k: mode === 'play' ? k : 1, frame, reduced, lang, enemies: state.enemies.map(enemyPos),
    playerVisible: !(state.step < state.safeUntil && (frame >> 2) % 2), shiftHint: shiftHintT > 0 && !introMode, civilian: introMode && !suited});
  ctx.restore();
  ctx.setTransform(Z, 0, 0, Z, 0, 0);
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
  const cause = t()[state.cause] || t().caught;
  if (deadT > 30) txt(cause, W / 2, H / 2 - 8, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: '#e0402a'});
}

function renderCard() {
  const def = LEVELS[levelIndex];
  R('#07080c', 0, 0, W, H);
  txt('VOGT MICROELETTRONICA · LUINO · LOT 4471', W / 2, 6, {align: 'center', color: '#4c5470'});
  txt(`${t().layerWord} ${levelIndex + 1}/${LEVELS.length}`, 16, 20, {color: '#6b7190'});
  txt(def.layer[lang].toUpperCase(), 16, 30, {size: 24, font: 'Pixelify Sans', weight: 700, color: '#ffcf5a', shadow: '#3a2200', max: 170});
  txt(`${def.time} · ${def.title[lang]}`, 16, 58, {color: '#8c93a8', font: 'IBM Plex Sans', size: 8, max: 170});
  const shown = Math.floor(cardT / 1.5);
  let used = 0;
  def.log[lang].forEach((line, i) => {
    const part = line.slice(0, Math.max(0, shown - used)); used += line.length;
    txt(part, 16, 72 + i * 10, {color: '#e9e4d6', font: 'IBM Plex Sans', size: 8, max: 176});
  });
  drawStack(204, 22, 100, 72, levelIndex);
  txt(def.stack[lang], 254, 100, {align: 'center', color: '#c9c2ae', font: 'IBM Plex Sans', size: 7});
  const y0 = 116;
  R('#0f1422', 10, y0 - 4, W - 20, 46); R('#2f6db3', 10, y0 - 4, 2, 46);
  txt(t().physics, 18, y0 - 1, {color: '#9fe0ff'});
  def.fact[lang].forEach((line, i) => txt(line, 18, y0 + 10 + i * 9, {color: '#b9c2cf', font: 'IBM Plex Sans', size: 7, max: W - 36}));
  if (cardT > 20 && (frame >> 5) % 2) txt(t().cont, W / 2, H - 9, {align: 'center', color: '#6b7190'});
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
  const g = ctx.createLinearGradient(0, 110, 0, 180);
  g.addColorStop(0, `rgba(40,50,80,${dawn * 0.8})`); g.addColorStop(1, `rgba(220,140,90,${dawn * 0.5})`);
  ctx.fillStyle = g; ctx.fillRect(0, 110, W, 70);
  txt(`${t().layerWord} ${LEVELS.length + 1}`, 16, 20, {color: '#6b7190'});
  txt(ENDING.layer[lang].toUpperCase(), 16, 30, {size: 24, font: 'Pixelify Sans', weight: 700, color: '#e0402a', shadow: '#2a0800', max: 180});
  txt(ENDING.time, 16, 58, {color: '#8c93a8', font: 'IBM Plex Sans', size: 8});
  const shown = Math.floor(cardT / 2);
  let used = 0;
  ENDING.log[lang].forEach((line, i) => {
    const part = line.slice(0, Math.max(0, shown - used)); used += line.length + 4;
    txt(part, 16, 72 + i * 10, {color: i >= 4 ? '#e0402a' : '#e9e4d6', font: 'IBM Plex Sans', size: 8, max: 180});
  });
  drawStack(204, 22, 100, 72, cardT > 200 ? LEVELS.length : LEVELS.length - 1);
  if (cardT > 200) txt(ENDING.stack[lang], 254, 100, {align: 'center', color: '#e0402a', font: 'IBM Plex Sans', size: 7});
  if (cardT > 260) {
    txt(t().stats(deaths, totalShifts), W / 2, 136, {align: 'center', color: '#8c93a8'});
    txt(LEVELS.map((d, i) => `${i + 1}:${deathsBy[i]}`).join('  '), W / 2, 146, {align: 'center', color: '#6b7190', max: W - 20});
  }
  if (cardT > 300) txt(t().thanks, W / 2, 158, {align: 'center', color: '#c9c2ae'});
  txt(t().credit, W / 2, H - 9, {align: 'center', color: '#4c5470', font: 'IBM Plex Sans', size: 6});
}

function render() {
  ctx.setTransform(Z, 0, 0, Z, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (mode === 'cinema') {
    ctx.setTransform(Z / 2, 0, 0, Z / 2, 0, 0); window.SchichtCinema.draw(ctx, cinemaT, frame);
    ctx.setTransform(Z, 0, 0, Z, 0, 0);
    if (cinemaT > 1) txt(lang === 'de' ? 'SHIFT: ÜBERSPRINGEN' : 'SHIFT: SKIP', W - 6, H - 12, {align: 'right', color: '#3a4058', shadow: null});
    return;
  }
  if (mode === 'title') return renderTitle();
  if (mode === 'card') return renderCard();
  if (mode === 'ending') return renderEnding();
  if (mode === 'dead') return renderDead();
  renderPlay();
  if (mode === 'process') window.SchichtProcess.draw(ctx, procType, procT, lang);
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
    card: i => startCard(i), start: i => startLevel(i), act: a => doStep(a), render, update, intro: () => startIntro(), cinema: () => startCinema(), get cinemaT() { return cinemaT; },
    process: (type, tt) => { procType = type; procT = tt; mode = 'process'; },
    setLayer: l => audio.setLayer(l), lang: l => { lang = l; applyLanguage(); },
  };
}
render();
requestAnimationFrame(loop);
})();
