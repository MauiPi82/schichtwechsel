/* Schichtwechsel - rendering, audio, input and screens. Rules live in core.js, levels in levels.js. */
(() => {
'use strict';
const C = window.SchichtCore, {LEVELS, ENDING, INTRO, FINALE} = window.SchichtLevels;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
// In an iframe (itch.io) or with ?embed only the game is shown, filling the frame.
const embedded = (() => { try { return window.top !== window.self; } catch (_) { return true; } })() || new URLSearchParams(location.search).has('embed');
if (embedded) document.body.classList.add('embed');
const W = 320, H = 180, Z = 4, T = 16, FY = 16;
const STEP_FRAMES = 8;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const levels = LEVELS.map(d => C.parseLevel(d));

/* ---------- Language ---------- */
const UI = {
  de: {
    day: 'DEINE SCHICHT', night: 'VORSCHICHT', open: 'SCHLEUSE OFFEN', airlock: 'ZUR SCHLEUSE', layerWord: 'SCHICHT',
    press: isTouch ? 'SHIFT TIPPEN' : 'SHIFT DRÜCKEN', orSpace: 'oder Leertaste', cont: isTouch ? 'SHIFT: WEITER' : 'SHIFT ODER ENTER: WEITER',
    tagline: 'Die Vorschicht ist nie gegangen. Sie ist eine Schicht geworden.', reticles: 'RETIKEL', missing: 'Die Vorschicht wartet noch.', checkpoint: 'PROZESSSCHRITT GESICHERT',
    sticky: 'Tipp: Die Leertaste wechselt auch die Schicht (Windows-Einrastfunktion).',
    resume: 'Weiter ab', fresh: 'N: neue Nacht ab 22:00', physics: 'PHYSIK DER SCHICHT',
    caught: 'ERWISCHT', crushed: 'EINGEMAUERT', robot: 'ÜBERFAHREN', beam: 'IM STRAHL', heat: 'VERBRANNT', plasma: 'IM PLASMA',
    paused: 'PAUSE', pausedHint: 'P oder ESC: weiter', bell: 'GLOCKE', ion: 'IONEN', retry: 'R: neu versuchen',
    stats: (d, s) => `Erwischt: ${d}   Schichtwechsel: ${s}`, thanks: 'Danke fürs Spielen.',
    sub: 'TURNO DI NOTTE · LUINO', credit: 'Ein Spiel von Maurizio Odenwaeller für Game Off 2026 · entwickelt mit Claude',
    sound: on => 'Ton: ' + (on ? 'an' : 'aus'), pause: 'Pause', full: 'Vollbild',
    noteHead: 'VOGT MICROELETTRONICA · BAY 7 · TURNO B', q: ['„', '“'],
    useLight: 'ANLAUFEN: LICHT', useStop: 'ANLAUFEN: NOT-AUS', charging: 'LÄDT',
    yieldWord: 'AUSBEUTE', best: 'BESTE AUSBEUTE', rewind: 'SHIFT: ZURÜCKSPULEN', lightTip: 'LAUF GEGEN DIE ANLAGE: IHR LICHT HÄLT SIE AUF', yieldLog: y => `Ausbeute Los 4471: ${y} %`,
    // Why a shift was refused: what stands on this spot in the other shift.
    blocked: (to, what) => what === 'o' ? 'IN DER VORSCHICHT FEHLT HIER DER BODEN'
      : `HIER STEHT IN ${to ? 'DER VORSCHICHT' : 'DEINER SCHICHT'} ${what === 'M' ? 'EINE ANLAGE' : 'EINE WAND'}`,
  },
  en: {
    day: 'YOUR SHIFT', night: 'THE SHIFT BEFORE', open: 'AIRLOCK OPEN', airlock: 'TO THE AIRLOCK', layerWord: 'LAYER',
    press: isTouch ? 'TAP SHIFT' : 'PRESS SHIFT', orSpace: 'or Space', cont: isTouch ? 'SHIFT: CONTINUE' : 'SHIFT OR ENTER: CONTINUE',
    tagline: 'The previous shift never left. They became a layer.', reticles: 'RETICLES', missing: 'The shift before is still waiting.', checkpoint: 'PROCESS STEP SAVED',
    sticky: 'Tip: Space changes the shift too (Windows Sticky Keys).',
    resume: 'Continue from', fresh: 'N: new night from 22:00', physics: 'PHYSICS OF THE SHIFT',
    caught: 'CAUGHT', crushed: 'WALLED IN', robot: 'RUN OVER', beam: 'IN THE BEAM', heat: 'BURNED', plasma: 'IN THE PLASMA',
    paused: 'PAUSED', pausedHint: 'P or ESC: resume', bell: 'BELL', ion: 'IONS', retry: 'R: try again',
    stats: (d, s) => `Caught: ${d}   Shift changes: ${s}`, thanks: 'Thank you for playing.',
    sub: 'TURNO DI NOTTE · LUINO', credit: 'A game by Maurizio Odenwaeller for Game Off 2026 · made with Claude',
    sound: on => 'Sound: ' + (on ? 'on' : 'off'), pause: 'Pause', full: 'Fullscreen',
    noteHead: 'VOGT MICROELETTRONICA · BAY 7 · TURNO B', q: ['“', '”'],
    useLight: 'WALK INTO: LIGHT', useStop: 'WALK INTO: STOP', charging: 'CHARGING',
    yieldWord: 'YIELD', best: 'BEST YIELD', rewind: 'SHIFT: REWIND', lightTip: 'WALK INTO THE TOOL: ITS LIGHT STOPS THEM', yieldLog: y => `Yield of lot 4471: ${y} %`,
    blocked: (to, what) => what === 'o' ? 'NO FLOOR HERE IN THE SHIFT BEFORE'
      : `${what === 'M' ? 'A TOOL' : 'A WALL'} STANDS HERE IN ${to ? 'THE SHIFT BEFORE' : 'YOUR SHIFT'}`,
  },
};
// What each tool is, shown when you stand next to it.
const TOOL_INFO = {
  track: ['Lackbahn: belackt, backt und entwickelt', 'Coater/developer track: coats, bakes, develops'],
  scanner: ['Scanner: bildet das Retikel mit 193 nm ab', 'Scanner: images the reticle at 193 nm'],
  'cluster-etch': ['Ätzcluster: Plasma ätzt, wo die Maske offen ist', 'Etch cluster: plasma etches where the mask is open'],
  'cluster-pvd': ['Sputtercluster: Argon schlägt Aluminium ab', 'Sputter cluster: argon knocks off aluminium'],
  'cluster-cvd': ['CVD-Cluster: Schichten wachsen aus dem Gas', 'CVD cluster: films grow from the gas'],
  'chamber-etch': ['Plasmaätzer: Ionen ätzen senkrecht nach unten', 'Plasma etcher: ions etch straight down'],
  'chamber-cvd': ['PECVD-Kammer: scheidet Oxid aus dem Plasma ab', 'PECVD chamber: deposits oxide from a plasma'],
  'chamber-pvd': ['Sputterkammer: das Magnetron trägt Aluminium ab', 'Sputter chamber: the magnetron erodes aluminium'],
  'chamber-asher': ['Asher: verascht Lack im Sauerstoffplasma', 'Asher: burns off resist in an oxygen plasma'],
  furnace: ['Vertikalofen: oxidiert 100 Wafer auf einmal', 'Vertical furnace: oxidises 100 wafers at once'],
  tubes: ['Diffusionsofen: heilt das Kristallgitter aus', 'Diffusion furnace: heals the crystal lattice'],
  wetbench: ['Nassbank: Säuren und Laugen reinigen die Wafer', 'Wet bench: acids and bases clean the wafers'],
  'implanter-source': ['Ionenquelle: erzeugt und beschleunigt Ionen', 'Ion source: makes and accelerates ions'],
  'implanter-end': ['Endstation: dreht die Wafer durch den Strahl', 'End station: spins the wafers through the beam'],
  'metrology-lines': ['CD-SEM: misst Linienbreiten mit Elektronen', 'CD-SEM: measures line widths with electrons'],
  'metrology-particles': ['Partikelmessung: ein Laser sucht Staub', 'Particle scanner: a laser looks for dust'],
  'metrology-thickness': ['Ellipsometer: misst Schichtdicken mit Licht', 'Ellipsometer: measures film thickness with light'],
  'metrology-rs': ['Vierspitzenmessung: Schichtwiderstand', 'Four-point probe: sheet resistance'],
  stocker: ['Stocker: hier warten die FOUPs', 'Stocker: where the FOUPs wait'],
  gascab: ['Gasschrank: Prozessgas, abgesaugt und überwacht', 'Gas cabinet: process gas, exhausted and monitored'],
  'metrology-tw': ['Thermawelle: prüft die Implantation vor dem Ausheilen', 'Therma-wave: checks the implant before the anneal'],
  generic: ['Anlage', 'Tool'],
};
function toolKey(b) {
  if (b.type === 'cluster' || b.type === 'chamber') return `${b.type}-${b.kind || 'etch'}`;
  if (b.type === 'implanter') return `implanter-${b.part || 'end'}`;
  if (b.type === 'metrology') return `metrology-${b.screen || 'lines'}`;
  return TOOL_INFO[b.type] ? b.type : 'generic';
}
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
langSel.addEventListener('change', () => { lang = langSel.value; store.set('lang', lang); applyLanguage(); langSel.blur(); });

/* ---------- Helpers ---------- */
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
function txt(s, x, y, o = {}) {
  const size = o.size || 8, font = o.font || 'Silkscreen';
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px "${font}", ui-monospace, monospace`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
  if (o.shadow !== null) { ctx.fillStyle = o.shadow || '#000'; ctx.fillText(s, Math.round(x) + 1, Math.round(y) + 1, o.max || W - 8); }
  ctx.fillStyle = o.color || '#e9e4d6'; ctx.fillText(s, Math.round(x), Math.round(y), o.max || W - 8);
}

/* ---------- Audio ---------- */
const audio = {
  ctx: null, on: store.get('sound') !== 'off', vol: clamp(+(store.get('volume') ?? 80) / 100, 0, 1), master: null, layer: 0, noise: null, radioNext: 0, radioPos: 0,
  unlock() {
    if (this.ctx) { if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume(); return; }
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
    this.paBus = a.createGain(); this.paBus.gain.value = 1; this.paBus.connect(band);
    this.echo = a.createDelay(1); this.echo.delayTime.value = 0.37;
    const fb = a.createGain(); fb.gain.value = 0.45; this.echo.connect(fb); fb.connect(this.echo);
    this.echoOut = a.createGain(); this.echoOut.gain.value = 0; this.echo.connect(this.echoOut); this.echoOut.connect(band);
    this.radio.connect(this.echo); this.paBus.connect(this.echo);
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
  // Announcement: a three-tone gong, then a voice made of a buzzing larynx and two moving formants,
  // one syllable per vowel of the Italian text, through the loudspeaker band (echoed in the shift before).
  announce(text) {
    if (!this.ctx) return;
    const a = this.ctx, t0 = a.currentTime + 0.05;
    [[784, 0], [659.3, 0.34], [523.3, 0.68]].forEach(([f, dt]) => {
      this.tone('sine', f, t0 + dt, 1.2, 0.2, this.paBus); this.tone('sine', f * 2.005, t0 + dt, 0.5, 0.035, this.paBus);
    });
    const {syl, dur} = paSyllables(text), v0 = t0 + PA_START;
    const o = a.createOscillator(), f1 = a.createBiquadFilter(), f2 = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth'; f1.type = f2.type = 'bandpass'; f1.Q.value = 5; f2.Q.value = 8; g.gain.value = 0.0001;
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(this.paBus);
    const VOW = {a: [730, 1090], e: [530, 1840], i: [270, 2290], o: [570, 840], u: [300, 870]};
    o.frequency.setValueAtTime(122, v0);
    for (const sy of syl) {
      const ts = v0 + sy.t;
      if (sy.hiss) { this.burst(ts, sy.len, 0.05, 'highpass', 3800, 1, undefined, this.paBus); continue; }
      const [a1, a2] = VOW[sy.v], k = sy.t / Math.max(0.5, dur);
      f1.frequency.setTargetAtTime(a1, ts, 0.02); f2.frequency.setTargetAtTime(a2, ts, 0.02);
      o.frequency.setTargetAtTime(120 + 18 * Math.sin(k * Math.PI) - 14 * k + sy.len * 40, ts, 0.04);
      g.gain.setTargetAtTime(0.7, ts, 0.012); g.gain.setTargetAtTime(0.0001, ts + sy.len * 0.75, 0.025);
    }
    o.start(v0); o.stop(v0 + dur + 0.4);
    const norm = this.layer ? 0.07 : 0.09;
    this.radio.gain.setTargetAtTime(0.012, t0, 0.15); this.radio.gain.setTargetAtTime(norm, v0 + dur + 0.6, 0.6);
  },
  // An old wall telephone: the bell hammer at 25 strokes a second, three rings, the last one cut short.
  ring(pan) {
    if (!this.ctx) return;
    const a = this.ctx, t0 = a.currentTime;
    let out = this.master;
    if (a.createStereoPanner) { out = a.createStereoPanner(); out.pan.value = clamp(pan, -1, 1); out.connect(this.master); }
    for (const [start, len] of [[0, 1.0], [2.5, 1.0], [5.0, 0.36]]) {
      for (let k = 0; k < len * 25; k++) {
        const tk = t0 + start + k / 25;
        this.tone('triangle', 1180, tk, 0.035, 0.06, out); this.tone('triangle', 1430, tk + 0.018, 0.035, 0.045, out);
      }
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
        if (o.cause === 'crushed' || o.cause === 'robot') {
          // The slam of the wall, then rubble.
          this.burst(t0 + 0.12, 0.25, 0.6, 'lowpass', 280); this.tone('sine', 60, t0 + 0.12, 0.7, 0.55, null, 28);
          this.burst(t0 + 0.25, 1.3, 0.12, 'bandpass', 1500, 0.8);
        } else if (o.cause === 'beam') {
          this.tone('sawtooth', 2400, t0, 0.5, 0.08, null, 300); this.tone('sine', 6000, t0, 0.9, 0.035, null, 7000);
          this.burst(t0, 0.9, 0.12, 'highpass', 4000);
        } else if (o.cause === 'heat') {
          this.burst(t0, 1.5, 0.32, 'lowpass', 500); this.burst(t0 + 0.1, 1.3, 0.1, 'bandpass', 2500, 0.6); this.tone('sine', 45, t0, 1.3, 0.2);
        } else if (o.cause === 'plasma') {
          this.tone('sawtooth', 60, t0, 1.1, 0.16); this.tone('sawtooth', 120.5, t0, 1.1, 0.09);
          for (let i = 0; i < 9; i++) this.burst(t0 + i * 0.09 + hash(i) * 0.05, 0.04, 0.22, 'highpass', 2500);
        } else {
          this.burst(t0, 0.7, 0.5, 'lowpass', 2400);
          this.tone('sawtooth', 160, t0, 0.8, 0.25, null, 30);
        }
        break;
      case 'won': this.burst(t0, 1.2, 0.16, 'highpass', 1200); this.tone('square', 70, t0 + 1.1, 0.12, 0.12); break;
      case 'reticle': [1320, 1760, 2640].forEach((f, i) => this.tone('sine', f, t0 + i * 0.07, 0.4, 0.06)); break;
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
      case 'flash':
        // A lamp striking: the ballast thumps, the arc whines, the light hisses.
        this.tone('triangle', 180, t0, 0.35, 0.14, null, 90); this.tone('sine', 2600, t0, 0.3, 0.07, null, 700);
        this.burst(t0, 0.35, 0.1, 'highpass', 3000);
        break;
      case 'freeze': [1568, 2093, 2637].forEach((f, i) => this.tone('sine', f, t0 + 0.05 + i * 0.05, 0.5, 0.035)); break;
      case 'emo': this.tone('square', 120, t0, 0.05, 0.18); this.tone('sawtooth', 220, t0 + 0.05, 0.7, 0.08, null, 35); break;
      case 'rewind': {
        const o2 = this.tone('sawtooth', 180, t0, 0.95, 0.06, null, 1400);
        this.burst(t0, 0.9, 0.06, 'highpass', 2500);
        for (let i = 0; i < 10; i++) this.tone('square', 900 + i * 120, t0 + i * 0.085, 0.03, 0.02);
        void o2; break;
      }
      case 'tool-wait': this.tone('square', 330, t0, 0.05, 0.04); this.tone('square', 330, t0 + 0.09, 0.05, 0.04); break;
      case 'sting':
        this.tone('sawtooth', 55, t0, 2.4, 0.07); this.tone('sawtooth', 58.3, t0, 2.4, 0.07);
        this.tone('sine', 1250, t0 + 0.1, 1.6, 0.025); this.tone('sine', 1323, t0 + 0.1, 1.6, 0.025);
        this.burst(t0, 1.2, 0.05, 'bandpass', 900, 3);
        break;
      case 'blackout':
        this.tone('square', 140, t0, 0.04, 0.2); this.burst(t0, 0.08, 0.15, 'lowpass', 900);
        this.tone('sawtooth', 120, t0, 0.55, 0.1, null, 25); this.tone('sine', 50, t0, 0.6, 0.12, null, 20);
        this.tone('sine', 1250, t0 + 0.2, 0.6, 0.025); this.tone('sine', 1258, t0 + 0.2, 0.6, 0.025);
        this.tone('sine', 50, t0 + 0.75, 0.4, 0.08, null, 100); this.tone('square', 160, t0 + 0.8, 0.03, 0.12);
        break;
      case 'whisper':
        for (let i = 0; i < 7; i++) this.burst(t0 + i * 0.13 + (i > 3 ? 0.25 : 0), 0.09 + hash(i) * 0.08, 0.05, 'bandpass', 3200 + hash(i * 3) * 1800, 2, o.pan);
        this.tone('sine', 1250, t0, 1.2, 0.015);
        break;
    }
  },
  // Shift radio: an original waltz with mandolin tremolo. At night the same tune plays slower, lower and echoed.
  scheduleRadio() {
    if (!this.ctx || !this.on) return;
    // After a pause or with the sound off, pick up from now instead of catching up on every missed note.
    if (this.radioNext < this.ctx.currentTime) this.radioNext = this.ctx.currentTime + 0.05;
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

// Syllables of an announcement: one per vowel, a hiss for s, z, c, f, pauses at spaces and punctuation.
const PA_START = 1.4;
function paSyllables(text) {
  const syl = [];
  let tt = 0, i = 0;
  for (const ch of text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
    i++;
    if ('aeiou'.includes(ch)) { const len = 0.1 + hash(i * 7.3) * 0.06; syl.push({t: tt, len, v: ch}); tt += len + 0.025; }
    else if ('szcf'.includes(ch)) { syl.push({t: tt, len: 0.05, hiss: true}); tt += 0.03; }
    else if (ch === ' ') tt += 0.06;
    else if ('.,:;!?'.includes(ch)) tt += 0.32;
  }
  return {syl, dur: tt};
}

/* ---------- Input ---------- */
const held = new Set();
let queuedDir = null, queuedShift = false, shiftQueuedAt = 0, lastDir = null, shiftHeld = false, miniPressed = false;
const KEYDIR = {ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'};
addEventListener('keydown', e => {
  if (e.target instanceof Element && e.target.closest('select,input,textarea,button,a')) return;
  audio.unlock();
  const d = KEYDIR[e.code];
  if (d) { e.preventDefault(); if (!e.repeat) { held.add(d); lastDir = d; queuedDir = mode === 'note' ? null : d; } return; }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') {
    e.preventDefault(); shiftHeld = true; if (e.repeat) return;
    press('shift');
    if (e.code !== 'Space') stickyCheck();
    return;
  }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); press('enter'); return; }
  const k = (e.key || '').toLowerCase(), is = (c, ch) => e.code === c || k === ch;
  if (is('KeyP', 'p') || e.code === 'Escape') { togglePause(); return; }
  if (is('KeyM', 'm')) { audio.toggle(); return; }
  if (is('KeyR', 'r') && (mode === 'play' || mode === 'paused') && !introMode) { checkpoint = null; startLevel(levelIndex); return; }
  if (is('KeyL', 'l') && mode === 'title') { lang = lang === 'de' ? 'en' : 'de'; store.set('lang', lang); applyLanguage(); return; }
  if (is('KeyN', 'n') && mode === 'title' && veilPhase !== 'out') { progress = 0; store.set('level', 0); audio.unlock(); transition(startCinema, 36, 1); }
});
addEventListener('keyup', e => {
  const d = KEYDIR[e.code]; if (d) held.delete(d);
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') shiftHeld = false;
});
addEventListener('blur', () => { held.clear(); shiftHeld = false; });
function press(what) {
  if (veilPhase === 'out') return;
  if (mode === 'cinema') { if (cinemaT > 0.4) transition(() => startIntro(), 28, 60); return; }
  if (introMode && (mode === 'play' || mode === 'shower')) { if (what === 'enter') transition(endIntro, 30, 1); return; }
  if (mode === 'mini') { if (what === 'enter') window.SchichtMini.skip(mini); else miniPressed = true; return; }
  // After a death the picture waits; a key brings you back to the last process step, in your own shift.
  if (mode === 'dead') { if (deadT > DEAD_LEN) { queuedDir = null; queuedShift = false; startRewind(); } return; }
  if (mode === 'process') { if (procT > 40) mode = 'play'; return; }
  if (mode === 'note') { if (noteT > 25) { mode = 'play'; queuedDir = null; queuedShift = false; } return; }
  if (mode === 'play') { if (what === 'shift') { queuedShift = true; shiftQueuedAt = frame; } return; }
  if (mode === 'title') { audio.unlock(); if (progress === 0) transition(startCinema, 36, 1); else transition(() => startCard(progress), 30, 30); return; }
  if (mode === 'card' && cardT > 20) { transition(() => { checkpoint = null; startLevel(levelIndex); }, 22, 36); return; }
  const toTitle = () => { mode = 'title'; audio.setLayer(0); };
  if (mode === 'ending' && cardT > 120) transition(toTitle, 40, 40);
  if (mode === 'finale') { if (finT < window.SchichtOdenchip.TOTAL) finT = window.SchichtOdenchip.TOTAL; else if (finT > window.SchichtOdenchip.TOTAL + 5) transition(toTitle, 40, 40); }
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
padShift.addEventListener('pointerdown', e => { e.preventDefault(); audio.unlock(); shiftHeld = true; press('shift'); padShift.classList.add('on'); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(n => padShift.addEventListener(n, () => { shiftHeld = false; padShift.classList.remove('on'); }));
cv.addEventListener('pointerdown', () => { window.focus(); audio.unlock(); if (mode !== 'play') press('enter'); });
['pointerup', 'touchend', 'click'].forEach(n => document.addEventListener(n, () => audio.unlock(), {passive: true}));
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
  if (now.shift !== !!padPrev.shift) shiftHeld = now.shift;
  if (now.start && !padPrev.start) togglePause();
  padPrev = now;
}

/* ---------- Game flow ---------- */
let mode = 'title', levelIndex = 0, state = null, frame = 0, stepFrame = 0, cardT = 0, fx = 0, fxLayer = 0, deadT = 0, shake = 0;
let progress = clamp(+store.get('level') || 0, 0, levels.length - 1), deaths = 0, totalShifts = 0, heartT = 0, hintT = 0;
const deathsBy = levels.map(() => 0);
const BUILD = '0.22 · 2026-11-12';
// Testers can jump to an hour: ?stunde=3 or ?hour=3 opens the third hour.
const jump = +(new URLSearchParams(location.search).get('stunde') || new URLSearchParams(location.search).get('hour') || 0);
if (jump >= 1 && jump <= levels.length) progress = jump - 1;
function startCard(i) {
  levelIndex = i; mode = 'card'; cardT = 0; fadeIn(36); paNow = null; paQueue = []; scare = null;
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
/* ---------- Lot 4471: what you made of it ---------- */
// Scores (0..1) of the played steps and their measured values; the measuring stations and the yield read them.
let lot = {s: {}, v: {}}, mini = null;
let history = [], rewT = 0, rewFrom = 0;
try { const l = JSON.parse(store.get('lot') || 'null'); if (l && l.s && l.v) lot = l; } catch (_) { /* fresh lot */ }
function saveLot() { store.set('lot', JSON.stringify(lot)); }
function newLot() { lot = {s: {}, v: {}}; saveLot(); }
const lotYield = () => window.SchichtMini ? window.SchichtMini.yieldOf(lot) : 97;
function startMini(type) {
  mini = window.SchichtMini.create(type, {sfx: n => audio.sfx(n === 'good' ? 'station' : n === 'meh' ? 'tool-wait' : n)});
  mode = 'mini'; miniPressed = false;
}
function endMini() {
  lot.s[mini.type] = mini.score; Object.assign(lot.v, mini.values); saveLot();
  mini = null; mode = 'play'; queuedDir = null; queuedShift = false;
}

/* ---------- Announcements, notes from shift B, scares ---------- */
// None of these changes the rules: a blackout freezes the clock while it lasts, so it can never cost a life.
let lightTaught = false, flashFx = null, blockedT = 0, paNow = null, paT = 0, paQueue = [], paDone = new Set(), noteRead = false, noteT = 0, scareDone = false, scare = null, freezeT = 0;
const fade = (tt, a, b, c) => tt < a ? tt / a : tt < b ? 1 : clamp((c - tt) / (c - b), 0, 1);
const SCARE_LEN = {phone: 330, window: 90, blackout: 54, shadow: 80};
function paLen(p) { return Math.round((PA_START + paSyllables(p.it).dur + 1.8) * 60); }
function startPA(p) { paNow = {...p, len: paLen(p), voice: paSyllables(p.it).dur}; paT = 0; audio.announce(p.it); }
function phoneRinging(tt) { return tt < 60 || (tt >= 150 && tt < 210) || (tt >= 300 && tt < 322); }
function blackoutAt(tt) {
  if (reduced) return fade(tt, 6, 40, 54);
  return tt < 6 ? tt / 6 : tt < 36 ? 1 : tt < 40 ? 0.3 : tt < 46 ? 1 : clamp((54 - tt) / 8, 0, 1);
}
function storyStep() {
  const def = LEVELS[levelIndex], L = state.level;
  (def.pa || []).forEach((p, i) => { if (!paDone.has(i) && state.step >= p.at) { paDone.add(i); paQueue.push(p); } });
  if (!paNow && paQueue.length) startPA(paQueue.shift());
  if (state.events.includes('note') && !noteRead && state.status === 'play' && mode === 'play') {
    noteRead = true; mode = 'note'; noteT = 0; audio.sfx('rustle');
  }
  const sc = def.scare;
  if (!sc || scareDone || scare || state.status !== 'play') return;
  if (sc.afterPa !== undefined ? !(paDone.has(sc.afterPa) && !paNow) : state.step < (sc.at || 0)) return;
  if (sc.type === 'phone') { scare = {type: 'phone', t: 0}; audio.ring((sc.x - state.x) / 10); }
  else if (sc.type === 'blackout' && state.layer === (sc.layer === 'day' ? 0 : 1)) { scare = {type: 'blackout', t: 0}; freezeT = SCARE_LEN.blackout; audio.sfx('blackout'); }
  else if (sc.type === 'window' && state.layer === 0) {
    let best = null;
    for (let i = 0; i < L.layers[0].length; i++) {
      if (L.layers[0][i] !== '=') continue;
      const x = i % C.W, y = (i / C.W) | 0, d = Math.abs(x - state.x) + Math.abs(y - state.y);
      if (d <= 3 && (!best || d < best.d)) best = {x, y, d};
    }
    if (best) { scare = {type: 'window', t: 0, x: best.x, y: best.y}; audio.sfx('sting'); }
  } else if (sc.type === 'shadow' && state.layer === 0 && state.events.includes('move')) {
    const [dx, dy] = C.DIRS[state.face], bx = state.x - dx, by = state.y - dy;
    const spots = [[bx, by], [bx - dy, by + dx], [bx + dy, by - dx]].slice(0, sc.n || 1).filter(([x, y]) => C.walkable(L, 0, x, y));
    if (spots.length) { scare = {type: 'shadow', t: 0, spots}; audio.sfx('whisper', {pan: -dx * 0.6}); }
  }
  if (scare) scareDone = true;
}

/* ---------- Reticles and the secret finale ---------- */
let found = new Set(), finT = 0;
try { found = new Set(JSON.parse(store.get('reticles') || '[]')); } catch (_) { found = new Set(); }
function updateFinale() {
  const before = window.SchichtOdenchip.phaseAt(finT);
  finT += 1 / 60;
  const [id, u] = window.SchichtOdenchip.phaseAt(finT);
  if (id !== before[0]) audio.sfx(id === 'dawn' ? 'won' : 'reticle');
  if (id === 'bond' && frame % 8 === 0) audio.sfx('zap');
  if (id === 'mold' && u > 1 && u < 2.6 && frame % 4 === 0) audio.sfx('zap');
  if (id === 'board' && frame % 33 === 0) audio.sfx('station');
  if (id === 'dawn' && before[0] !== 'dawn') audio.horn();
}

/* ---------- Prologue (no words) ---------- */
/* ---------- Transitions ---------- */
// Between two parts of the game the picture fades to black, the next part is set up, and it fades in again.
// While it fades out, time stands still and input waits, so nothing happens twice.
let veil = 0, veilPhase = null, veilT = 0, veilOut = 1, veilIn = 1, veilThen = null;
function transition(then, out = 24, inn = 30) {
  if (veilPhase === 'out') return;
  veilThen = then; veilOut = out; veilIn = inn; veilPhase = 'out'; veilT = Math.round(veil * out);
}
function fadeIn(inn = 30) { veil = 1; veilPhase = 'in'; veilIn = inn; veilT = 0; }
function stepVeil() {
  veilT++;
  if (veilPhase === 'out') {
    veil = clamp(veilT / veilOut, 0, 1);
    if (veil >= 1) { const then = veilThen; veilThen = null; veilPhase = 'in'; veilT = 0; then(); }
  } else if (veilPhase === 'in') {
    veil = clamp(1 - veilT / veilIn, 0, 1);
    if (veil <= 0) veilPhase = null;
  }
}

let cinemaT = 0;
function startCinema() { newLot(); mode = 'cinema'; cinemaT = 0; audio.setLayer(0); audio.rain(0.09); }
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
  if (cinemaT >= window.SchichtCinema.TOTAL) { startIntro(); fadeIn(70); }
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
  if (!suited && state.y <= 4 && state.x >= INTRO.suitAt) { audio.sfx('rustle'); transition(() => { suited = true; audio.sfx('rustle'); }, 18, 30); }
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
    state.safeUntil = state.step + 14; state.bellFrom = state.step;
  } else { state = C.newState(levels[i]); hintT = 0; toastT = 0; shiftHintT = 0; paDone = new Set(); paQueue = []; paNow = null; noteRead = false; scareDone = false; }
  scare = null; freezeT = 0; history = [];
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
  if (queuedShift) {
    // A SHIFT pressed during the cooldown is kept for a moment and done as soon as it is allowed.
    const wait = state.step + 1 - state.lastShift < C.SHIFT_COOLDOWN;
    if (!wait || frame - shiftQueuedAt > 30) { queuedShift = false; if (!wait) return 'shift'; }
  }
  if (queuedDir) { const d = queuedDir; queuedDir = null; return d; }
  if (lastDir && held.has(lastDir)) return lastDir;
  for (const d of held) return d;
  return 'wait';
}

function doStep(action) {
  const before = state.layer, from = state.enemies.map(e => [e.x, e.y]);
  if (!introMode) { history.push(C.clone(state)); if (history.length > 600) history.shift(); }
  C.step(state, action);
  state.enemies.forEach((e, i) => { if (e.moved === state.step) { e.fx = from[i][0]; e.fy = from[i][1]; } });
  totalShifts += state.events.filter(e => e === 'shift').length;
  for (const ev of state.events) {
    if (ev === 'enemy-step') continue;
    if (['shift', 'blocked', 'station', 'bell', 'bell-warning', 'beam-switch', 'beam-warning', 'won', 'lost', 'pulse', 'pulse-warning', 'furnace-open', 'flash', 'emo', 'tool-wait'].includes(ev)) audio.sfx(ev, {cause: state.cause});
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
  if (state.events.includes('reticle') && !introMode && !found.has(LEVELS[levelIndex].id)) {
    found.add(LEVELS[levelIndex].id); store.set('reticles', JSON.stringify([...found]));
    audio.sfx('reticle'); procType = 'reticle'; procT = 0; mode = 'process';
  }
  if (state.events.includes('station') && state.status === 'play') {
    checkpoint = C.clone(state); history = []; toast(t().checkpoint, 100);
    const step = LEVELS[levelIndex].route && LEVELS[levelIndex].route[state.got - 1];
    if (step && step.proc && window.SchichtMini && window.SchichtMini.has(step.proc)) startMini(step.proc);
    else if (step && step.proc && window.SchichtProcess) { procType = step.proc; procT = 0; mode = 'process'; }
  }
  if (state.events.includes('bump')) {
    const [dx, dy] = C.DIRS[state.face], o = 1 - state.layer;
    if (C.walkable(state.level, o, state.x, state.y) && C.walkable(state.level, o, state.x + dx, state.y + dy)) shiftHintT = 120;
  }
  if (state.events.includes('shift')) shiftHintT = 0;
  if (state.events.includes('freeze')) audio.sfx('freeze');
  if (state.events.includes('flash')) flashFx = {...state.used, t: 0};
  if (state.events.includes('blocked') && !introMode) {
    const to = 1 - state.layer, what = state.level.layers[to][idx(state.x, state.y)];
    toast(t().blocked(to, what), 110); blockedT = 18;
  }
  if (!introMode) storyStep();
  if (introMode) introStep();
  if (state.status === 'lost') { mode = 'dead'; deadT = 0; deaths++; deathsBy[levelIndex]++; }
  if (state.status === 'won' && introMode) { if (veilPhase !== 'out') { audio.sfx('door'); transition(endIntro, 40, 1); } return; }
  if (state.status === 'won') {
    mode = 'clear'; deadT = 0;
    progress = Math.max(progress, Math.min(levelIndex + 1, levels.length - 1)); store.set('level', progress);
  }
}

function update() {
  frame++; pollPad();
  if (veilPhase) { stepVeil(); if (veilPhase === 'out') return; }
  if (mode === 'card' || mode === 'ending') cardT++;
  if (mode === 'finale') updateFinale();
  if (mode === 'play') {
    hintT++;
    if (freezeT > 0) freezeT--;
    else if (++stepFrame >= STEP_FRAMES) { stepFrame = 0; doStep(nextAction()); }
    // Heartbeat: faster and louder the closer the previous shift is, louder at night.
    const d = state.enemies.length ? C.nearestEnemy(state) : Infinity;
    if (!lightTaught && !introMode && state.layer === 1 && d <= 5 && nearTool() && store.get('lighttip') !== '1') {
      lightTaught = true; store.set('lighttip', '1'); toast(t().lightTip, 300);
    }
    if (d <= 7 && audio.ctx) {
      heartT -= 1 / 60;
      if (heartT <= 0) { audio.sfx('heart', {gain: (state.layer ? 0.17 : 0.07) * (1 - d / 9)}); heartT = 0.4 + d * 0.12; }
    }
  }
  if (fx > 0) fx--;
  if (shake > 0) shake--;
  if (mode === 'note') noteT++;
  if (mode === 'mini' && mini) {
    window.SchichtMini.update(mini, {pressed: miniPressed, held: shiftHeld, up: held.has('up'), down: held.has('down'), left: held.has('left'), right: held.has('right')});
    miniPressed = false;
    if (mini.closed) endMini();
  }
  if (paNow && ++paT > paNow.len) { paNow = null; if (paQueue.length && mode !== 'card') startPA(paQueue.shift()); }
  if (scare && ['play', 'note', 'process'].includes(mode) && ++scare.t > SCARE_LEN[scare.type]) scare = null;
  if (toastT > 0) toastT--;
  if (shiftHintT > 0) shiftHintT--;
  if (blockedT > 0) blockedT--;
  if (flashFx && ++flashFx.t > 34) flashFx = null;
  if (mode === 'cinema') updateCinema();
  if (mode === 'process' && ++procT > window.SchichtProcess.duration(procType)) mode = 'play';
  if (mode === 'shower') updateShower();
  if (mode === 'dead') deadT++;
  if (mode === 'rewind') updateRewind();
  if (mode === 'clear' && ++deadT > 60) {
    checkpoint = null;
    if (levelIndex + 1 < levels.length) startCard(levelIndex + 1);
    else if (Object.keys(lot.s).length) store.set('best', String(Math.max(+(store.get('best') || 0), lotYield())));
    if (levelIndex + 1 >= levels.length && found.size >= LEVELS.length) { mode = 'finale'; finT = 0; store.set('odenchip', '1'); audio.setLayer(0); audio.bell(0.25); fadeIn(40); }
    else if (levelIndex + 1 >= levels.length) { mode = 'ending'; cardT = 0; audio.setLayer(0); audio.horn(); fadeIn(40); }
  }
}

/* ---------- World ---------- */
// The previous shift creeps: each move is spread over its whole move interval.
function enemyPos(e) {
  if (e.moved < 0 || e.fx === undefined) return [e.x, e.y];
  const span = (e.ev || state.level.enemyEvery) * (state.layer ? 1 : 2) * STEP_FRAMES;
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
    // Pad oxide and nitride from the second hour.
    top = si - 6; R('#cfe8ff', x0, si - 3, w, 3); R('#9fc4a8', x0, top, w, 3);
    if (n >= 3) for (const hx of holes) R('#4f5866', hx, top, 10, 6);
    glow(1, top, 6);
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
  const def2 = LEVELS[levelIndex], by = FY + C.H * T - 13;
  const tool = nearTool();
  if (tool && (hintT >= 300 || !def2.hint)) {
    // The tool next to you: maker, what it does, and what walking into it does.
    const info = TOOL_INFO[toolKey(tool)][lang === 'de' ? 0 : 1], name = tool.name || (tool.type === 'gascab' ? `GAS ${tool.gas || ''}` : tool.type.toUpperCase());
    const ready = state.step >= (state.toolReady[`${state.layer}:${tool.x0},${tool.y0}`] || 0), use = C.toolUse(L, tool);
    R('rgba(0,0,0,.66)', 0, by, W, 13); R(night ? '#5a4214' : '#2f6db3', 0, by, W, 1);
    txt(name, 4, by + 2, {color: night ? '#ffcf5a' : '#9fe0ff', max: 64});
    ctx.font = '400 8px "Silkscreen", monospace';
    const nw = Math.min(64, ctx.measureText(name).width);
    txt(info, 10 + nw, by + 2, {font: 'IBM Plex Sans', size: 8, color: '#e9e4d6', max: W - nw - 98});
    txt(ready ? (use.stops ? t().useStop : t().useLight) : t().charging, W - 4, by + 2, {align: 'right', color: ready ? '#c9a5ff' : '#6b7190', max: 84});
  } else if (L.beams.length && (hintT >= 300 || !def2.hint)) {
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

// A tool block of this shift right next to the player (not diagonal).
function nearTool() {
  if (introMode || !state) return null;
  const L = state.level;
  for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) {
    const x = state.x + dx, y = state.y + dy;
    if (x < 0 || y < 0 || x >= C.W || y >= C.H) continue;
    const n = L.blockAt[state.layer][idx(x, y)];
    if (n >= 0) return L.blocks[state.layer][n];
  }
  return null;
}
function storyView() {
  const def = LEVELS[levelIndex], sc = scare, d = def.scare;
  if (introMode) return {};
  return {
    note: def.note ? {x: def.note.x, y: def.note.y, layer: def.note.layer === 'day' ? 0 : 1, read: noteRead} : null,
    phone: d && d.type === 'phone' ? {x: d.x, y: d.y, ringing: !!(sc && sc.type === 'phone' && phoneRinging(sc.t))} : null,
    windowFace: sc && sc.type === 'window' ? {x: sc.x, y: sc.y, a: fade(sc.t, 10, 70, 90)} : null,
    ghosts: sc && sc.type === 'shadow' ? sc.spots.map(([x, y]) => [x, y, fade(sc.t, 15, 55, 80)]) : [],
    blackout: sc && sc.type === 'blackout' ? blackoutAt(sc.t) : 0,
  };
}
// The strip never covers the player: at the top, or above the bottom bar when the player is up there.
function paY() { return state && state.y <= 3 ? FY + C.H * T - 13 - 26 : FY + 3; }
// The announcement as a strip under the bar: loudspeaker, the Italian words as they are spoken, the translation.
function drawPA() {
  if (!paNow || introMode || mode === 'rewind') return;
  const a = clamp(Math.min(paT / 12, (paNow.len - paT) / 24), 0, 1), night = state.layer === 1;
  const x = 10, y = paY(), w = W - 20, speaking = paT / 60 > PA_START && paT / 60 < PA_START + paNow.voice;
  ctx.globalAlpha = a;
  R('rgba(6,8,12,.9)', x, y, w, 24); R(night ? '#ffb43a' : '#9fe0ff', x, y + 23, w, 1);
  R('#c9c2ae', x + 6, y + 9, 3, 6);
  ctx.fillStyle = '#c9c2ae'; ctx.beginPath(); ctx.moveTo(x + 9, y + 9); ctx.lineTo(x + 14, y + 5); ctx.lineTo(x + 14, y + 19); ctx.lineTo(x + 9, y + 15); ctx.fill();
  if (speaking || paT / 60 < PA_START) for (let i = 0; i < 2; i++) if ((frame >> 3) % 3 > i) R('#c9c2ae', x + 17 + i * 3, y + 9 - i * 2, 1, 6 + i * 4);
  const k = clamp((paT / 60 - PA_START) / Math.max(0.3, paNow.voice), 0, 1), it = paNow.it.slice(0, Math.ceil(paNow.it.length * k));
  const [q0, q1] = t().q;
  txt(paT / 60 < PA_START ? '· · ·' : `${q0}${it}${k < 1 ? '' : q1}`, x + 26, y + 2, {font: 'IBM Plex Sans', size: 9, italic: true, color: night ? '#ffcf5a' : '#e9eef5', max: w - 32});
  if (k >= 1) txt(paNow[lang], x + 26, y + 13, {font: 'IBM Plex Sans', size: 7, color: '#8c93a8', max: w - 32});
  ctx.globalAlpha = 1;
}
// A note from shift B: torn ruled paper, a coffee ring, blue handwriting, the signature.
function drawNote() {
  const n = LEVELS[levelIndex].note, a = clamp(noteT / 10, 0, 1);
  ctx.globalAlpha = a;
  R('rgba(0,0,0,.62)', 0, FY, W, H - FY);
  const pw = 212, ph = 116, px = Math.round(W / 2 - pw / 2), py = Math.round(34 + (1 - a) * 6);
  R('rgba(0,0,0,.5)', px + 3, py + 4, pw, ph);
  R('#ece4cc', px, py, pw, ph);
  for (let i = 0; i < pw; i += 3) { const h = 1 + Math.floor(hash(i + levelIndex * 50) * 3); R('#ece4cc', px + i, py - h, Math.min(3, pw - i), h); }
  for (let yy = py + 30; yy < py + ph - 4; yy += 14) R('#bccadf', px + 4, yy, pw - 8, 1);
  R('#e3a8a0', px + 20, py + 2, 1, ph - 4);
  ctx.strokeStyle = 'rgba(140,96,50,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + pw - 30, py + ph - 26, 15, 0.3, 5.9); ctx.stroke();
  txt(t().noteHead, px + 26, py + 7, {font: 'IBM Plex Sans', size: 6, color: '#8a8470', shadow: null, max: pw - 32});
  n.text[lang].forEach((line, i) => txt(line, px + 26, py + 20 + i * 14, {font: 'IBM Plex Sans', size: 9, italic: true, color: '#1f2c6e', shadow: null, max: pw - 34}));
  txt(`— ${n.by}`, px + pw - 10, py + ph - 14, {font: 'IBM Plex Sans', size: 9, italic: true, weight: 600, align: 'right', color: '#1f2c6e', shadow: null, max: pw - 30});
  if (noteT > 25 && (frame >> 5) % 2) txt(t().cont, W / 2, py + ph + 8, {align: 'center', color: '#8c93a8'});
  ctx.globalAlpha = 1;
}

// A copy of the frame so far, for effects that shift slices of the picture.
let snapCanvas = null;
function snapshot() {
  if (!snapCanvas || snapCanvas.width !== cv.width) { snapCanvas = document.createElement('canvas'); snapCanvas.width = cv.width; snapCanvas.height = cv.height; }
  const c = snapCanvas.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(cv, 0, 0);
  return snapCanvas;
}
function renderPlay() {
  const k = clamp(stepFrame / STEP_FRAMES, 0, 1);
  R('#000', 0, 0, W, H);
  ctx.save();
  // The fab is drawn at twice the resolution of the interface: 640 x 360.
  ctx.setTransform(Z / 2, 0, 0, Z / 2, 0, 0);
  if (fx > 0 && !reduced) ctx.translate(Math.round((hash(frame) - 0.5) * 6), 0);
  if (shake > 0) ctx.translate(Math.round((hash(frame * 3) - 0.5) * shake * 0.8), Math.round((hash(frame * 5) - 0.5) * shake * 0.6));
  const rt = state.level.reticle && !state.reticle && !introMode && !found.has(LEVELS[levelIndex].id) ? state.level.reticle : null;
  window.SchichtWorld.draw(ctx, state, {reticle: rt, reticleN: levelIndex,k: mode === 'play' ? k : 1, frame, reduced, lang, enemies: state.enemies.map(enemyPos),
    playerVisible: !(state.step < state.safeUntil && (frame >> 2) % 2), shiftHint: shiftHintT > 0 && !introMode, civilian: introMode && !suited,
    frozen: state.enemies.map(e => C.frozen(state, e)), flash: flashFx && {...flashFx, a: 1 - flashFx.t / 34},
    grace: !introMode && state.layer === 1 && state.enemies.length ? clamp(1 - ((state.step - state.lastShift) * STEP_FRAMES + stepFrame) / (C.GRACE * STEP_FRAMES), 0, 1) : 0,
    ...storyView()});
  ctx.restore();
  ctx.setTransform(Z, 0, 0, Z, 0, 0);
  if (blockedT > 0 && !introMode) {
    // A refused shift: the spot flashes red for a moment.
    ctx.globalAlpha = blockedT / 18; ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 1;
    ctx.strokeRect(state.x * T + 0.5, FY + state.y * T + 0.5, T - 1, T - 1);
    ctx.globalAlpha = 1;
  }
  drawHUD();
  drawPA();
  if (toastT > 0) {
    ctx.globalAlpha = clamp(toastT / 20, 0, 1);
    ctx.font = '400 8px "Silkscreen", monospace';
    const w = Math.min(W - 16, ctx.measureText(toastText).width + 14);
    const ty = paNow && !introMode && paY() === FY + 3 ? FY + 30 : FY + 4;
    R('rgba(5,6,10,.85)', W / 2 - w / 2, ty, w, 13); R(state.layer ? '#ffb43a' : '#9fe0ff', W / 2 - w / 2, ty + 12, w, 1);
    txt(toastText, W / 2, ty + 3, {align: 'center', color: '#e9e4d6', max: w - 10});
    ctx.globalAlpha = 1;
  }
  if (fx > 0) {
    // The shift: the picture tears into horizontal slices, washed in the colour of the new layer.
    const a = fx / 12;
    if (!reduced) {
      const snap = snapshot();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 9; i++) {
        const sy = Math.floor(hash(i + frame) * cv.height), sh = 6 + Math.floor(hash(i * 3 + frame) * 40);
        ctx.drawImage(snap, 0, sy, cv.width, sh, Math.round((hash(i * 7 + frame) - 0.5) * 60 * a), sy, cv.width, sh);
      }
      ctx.restore();
    }
    ctx.fillStyle = fxLayer ? `rgba(255,180,50,${0.35 * a})` : `rgba(230,245,255,${0.45 * a})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// Every way to fail has its own picture: their visor, the wall that closes, the ion beam, the furnace heat, the plasma.
const DEAD_LEN = 80, ION_COL = {B: '#9fe0ff', P: '#d59cff', As: '#9cff9c', BF2: '#ffe08a'};
function deathPicture(cause, d) {
  const px = state.x * T + T / 2, py = FY + state.y * T + T / 2 - 2, night = state.layer === 1;
  if (cause === 'crushed' || cause === 'robot') {
    // The wall of the other shift closes on you from both sides; dust trickles from the seam.
    const e = 1 - Math.pow(1 - clamp(d / 10, 0, 1), 3), gap = (1 - e) * (W / 2 + 12);
    const jolt = d >= 10 && d < 20 && !reduced ? Math.round((hash(frame) - 0.5) * 4) : 0;
    const face = night ? '#342812' : '#c4ccd6', top = night ? '#4a3a1c' : '#e8ecf1', trim = night ? '#9a6c1e' : '#2c6fb5', gr = night ? '#160f06' : '#8a94a2';
    if (gap > 1) { R('#4a8fd8', px - 3, py - 4, 2, 2); R('#4a8fd8', px + 1, py - 4, 2, 2); }
    for (const side of [-1, 1]) {
      const x0 = (side < 0 ? px - gap - W : px + gap) + jolt;
      R(face, x0, FY, W, H - FY); R(top, x0, FY, W, 12);
      R(trim, side < 0 ? x0 + W - 3 : x0, FY, 3, H - FY);
      for (let y = FY + 18; y < H; y += 6) R(gr, x0 + 8, y, W - 16, 1);
    }
    if (d >= 10) for (let i = 0; i < 46; i++) {
      const t2 = d - 10, x = px + jolt + (hash(i) - 0.5) * (3 + t2 * 0.8), y = py - 40 + ((hash(i * 3) * 30 + t2 * (1.2 + hash(i * 7) * 2)) % 110);
      R(night ? '#7a6a48' : '#eef1f4', x, y, 1, 1);
    }
  } else if (cause === 'beam') {
    // The beam takes the whole room; the suit sputters away atom by atom.
    const b = state.level.beams[0], sp = b ? b.phases[C.beamPhase(b, state.step)].species : 'B', col = ION_COL[sp] || '#9fe0ff';
    const th = 3 + 22 * clamp(d / 8, 0, 1), fb = clamp((56 - d) / 30, 0, 1);
    // Light adds up in the dark; on the bright day floor the beam is painted over it instead.
    ctx.globalCompositeOperation = night ? 'lighter' : 'source-over';
    for (const [w, a] of [[th * 2, 0.22], [th, 0.4], [th * 0.35, 0.85]]) { ctx.globalAlpha = a * fb; R(col, 0, py - w / 2, W, w); }
    ctx.globalAlpha = fb; R('#ffffff', 0, py - 1, W, 2);
    for (let i = 0; i < 50; i++) R(col, (hash(i) * W + d * (8 + hash(i * 3) * 10)) % W, py + (hash(i * 5) - 0.5) * th, 5 + hash(i * 2) * 6, 1);
    ctx.globalCompositeOperation = 'source-over';
    const t2 = Math.max(0, d - 4);
    for (let i = 0; i < 80; i++) {
      ctx.globalAlpha = clamp(1 - t2 / 55, 0, 1);
      R(hash(i) > 0.3 ? '#f7f9fc' : '#8a5cd6', px + (hash(i * 9) - 0.5) * 10 + t2 * (1 + hash(i * 11) * 3), py + (hash(i * 13) - 0.5) * 18 + t2 * (hash(i * 17) - 0.5) * 1.4, 1, 1);
    }
    ctx.globalAlpha = 1;
    if (d > 8) txt(`${sp}+ · ${b ? b.keV : 40} keV`, W / 2, py + th + 4 > H - 12 ? py - th - 12 : py + th + 4, {align: 'center', color: col});
  } else if (cause === 'heat') {
    // The air shimmers, the floor glows, embers rise; the thermometer climbs to tube temperature.
    const h = clamp(d / 24, 0, 1);
    if (!reduced) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const snap = snapshot();
      for (let y = 0; y < cv.height; y += 8) ctx.drawImage(snap, 0, y, cv.width, 8, Math.sin(y / 23 + d / 3) * 6 * h, y, cv.width, 8);
      ctx.restore();
    }
    const g = ctx.createLinearGradient(0, H, 0, FY);
    g.addColorStop(0, `rgba(255,120,30,${0.75 * h})`); g.addColorStop(1, `rgba(255,60,20,${0.22 * h})`);
    ctx.fillStyle = g; ctx.fillRect(0, FY, W, H - FY);
    const rg = ctx.createRadialGradient(px, py, 1, px, py, 10 + 30 * h);
    rg.addColorStop(0, `rgba(255,245,200,${0.9 * h})`); rg.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = rg; ctx.fillRect(px - 40, py - 40, 80, 80);
    for (let i = 0; i < 50; i++) R(hash(i * 2) > 0.5 ? '#ffcf5a' : '#ff7a2a', hash(i) * W + Math.sin(d / 9 + i) * 5, H - ((d * (1 + hash(i * 3) * 1.5) + hash(i * 7) * (H - FY)) % (H - FY)), 1, 2);
    txt(`${Math.round(22 + 1028 * h)} °C`, W / 2, FY + 14, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: '#fff0c0', shadow: '#5a1a00'});
  } else if (cause === 'plasma') {
    // A violet glow, the sheath as a growing ring, arcs that branch from you into the dark.
    const a = clamp(d / 10, 0, 1), f = clamp((62 - d) / 30, 0, 1);
    ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createRadialGradient(px, py, 2, px, py, 20 + d * 2);
    rg.addColorStop(0, `rgba(220,160,255,${0.75 * a * f})`); rg.addColorStop(1, 'rgba(120,40,200,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, FY, W, H - FY);
    ctx.strokeStyle = `rgba(240,215,255,${0.8 * f})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 6 + d * 1.6, 0, 7); ctx.stroke();
    const seed = Math.floor(d / 6);
    ctx.lineWidth = 1; ctx.strokeStyle = `rgba(235,200,255,${0.9 * f})`;
    for (let k = 0; k < 6; k++) {
      let x = px, y = py, ang = hash(k * 7 + seed * 13) * 7;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 9; j++) { ang += (hash(k * 31 + j * 7 + seed) - 0.5) * 1.3; x += Math.cos(ang) * 8; y += Math.sin(ang) * 8; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    if (d > 8) txt('13,56 MHz', W / 2, FY + 14, {align: 'center', color: '#e6c8ff'});
  }
}

function renderDead() {
  renderDeadPicture();
  if (deadT > DEAD_LEN) txt(t().rewind, W / 2, H / 2 + 14, {align: 'center', color: '#8c93a8'});
}
/* ---------- Rewind: the shift slips back to the last station ---------- */
// Every step since the last station is kept. After a death the hour runs backwards, like a tape, in under a second.
function startRewind() {
  mode = 'rewind'; rewT = 0; rewFrom = history.length; audio.sfx('rewind');
  if (!history.length) endRewind();
}
function updateRewind() {
  rewT++;
  const i = rewFrom - 1 - Math.floor(rewT / 48 * rewFrom);
  if (i < 0) return endRewind();
  state = C.clone(history[i]);
}
function endRewind() { history = []; startLevel(levelIndex, true); fadeIn(10); }
function renderRewind() {
  renderPlay();
  // Tape look: the picture shudders in slices, a tracking band runs through it, scanlines, a cold tint.
  const snap = snapshot();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!reduced) for (let i = 0; i < 6; i++) {
    const sy = Math.floor(hash(i + rewT * 3) * cv.height), sh = 8 + Math.floor(hash(i * 5 + rewT) * 30);
    ctx.drawImage(snap, 0, sy, cv.width, sh, Math.round((hash(i * 7 + rewT) - 0.5) * 40), sy, cv.width, sh);
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(40,60,90,.22)'; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 2) R('rgba(0,0,0,.18)', 0, y, W, 1);
  const band = (rewT * 7) % (H + 20) - 10;
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, band, W, 6);
  for (let i = 0; i < 40; i++) R('rgba(255,255,255,.5)', hash(i + rewT) * W, band + hash(i * 3 + rewT) * 6, 2, 1);
  ctx.fillStyle = '#e9eef5'; ctx.beginPath();
  for (const ox of [0, 9]) { ctx.moveTo(14 + ox, FY + 8); ctx.lineTo(14 + ox, FY + 20); ctx.lineTo(5 + ox, FY + 14); }
  ctx.fill();
  txt('REW', 34, FY + 9, {color: '#e9eef5', size: 8});
}
function renderDeadPicture() {
  renderPlay();
  const cause = state.cause || 'caught';
  if (cause !== 'caught') {
    deathPicture(cause, deadT);
    ctx.fillStyle = `rgba(0,0,0,${clamp((deadT - 28) / 40, 0, 0.9)})`; ctx.fillRect(0, 0, W, H);
    if (deadT > 24) txt(t()[cause] || t().caught, W / 2, H / 2 - 8, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: '#e0402a'});
    return;
  }
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
  if (deadT > 30) txt(t().caught, W / 2, H / 2 - 8, {align: 'center', size: 16, font: 'Pixelify Sans', weight: 700, color: '#e0402a'});
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
  txt(`${t().reticles} ${found.size}/${LEVELS.length}`, W - 10, H - 9, {align: 'right', color: found.size ? '#9fe0ff' : '#3a4058'});
  if (Object.keys(lot.s).length) txt(`${t().yieldWord} ${lotYield()} %`, 10, H - 9, {color: '#ffcf5a'});
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
  // In an iframe the keyboard only arrives after a click into the game.
  if (embedded && !document.hasFocus() && (frame >> 5) % 2) txt(lang === 'de' ? 'INS SPIEL KLICKEN' : 'CLICK INTO THE GAME', W / 2, 146, {align: 'center', color: '#9fe0ff'});
  if (embedded) txt(lang === 'de' ? 'L: ENGLISH · M: TON' : 'L: DEUTSCH · M: SOUND', W - 4, H - 20, {align: 'right', color: '#4c5470', font: 'IBM Plex Sans', size: 6, shadow: null});
  if (store.get('odenchip') === '1') {
    ctx.save(); ctx.translate(20, 20); ctx.scale(0.06, 0.06); ctx.translate(-window.SchichtOdenchip.PK.cx, -window.SchichtOdenchip.PK.cy);
    window.SchichtOdenchip.pack({wires: 99, mold: 1, mark: 1}, ctx); ctx.restore();
    txt('ODENCHIP', 34, 16, {color: '#ffd27a', shadow: null});
  } else if (found.size) txt(`${t().reticles} ${found.size}/${LEVELS.length}`, 6, 6, {color: '#4c5470', shadow: null});
  if (store.get('best')) txt(`${t().best} ${store.get('best')} %`, 6, H - 10, {color: '#6b5a2a', font: 'IBM Plex Sans', size: 6, shadow: null});
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
    txt(t().stats(deaths, totalShifts), 16, 136, {color: '#8c93a8', max: 180});
    txt(LEVELS.map((d, i) => `${i + 1}:${deathsBy[i]}`).join('  '), 16, 146, {color: '#6b7190', max: 180});
  }
  if (cardT > 280 && Object.keys(lot.s).length) {
    const y = lotYield(), g = window.SchichtMini.grade((y - 26) / 71);
    txt(`${t().yieldWord} ${y} %`, 254, 128, {align: 'center', color: '#ffcf5a', max: 100});
    txt(g.word, 254, 137, {align: 'center', color: g.color, max: 100});
  }
  if (cardT > 300) txt(t().thanks, W / 2, 158, {align: 'center', color: '#c9c2ae'});
  if (cardT > 330) {
    txt(`${t().reticles} ${found.size}/${LEVELS.length}`, 254, 110, {align: 'center', color: '#6b7190', max: 100});
    txt(t().missing, 254, 119, {align: 'center', color: '#4c5470', font: 'IBM Plex Sans', size: 6, max: 110});
  }
  txt(t().credit, W / 2, H - 9, {align: 'center', color: '#4c5470', font: 'IBM Plex Sans', size: 6});
}

function render() {
  renderMode();
  if (veil > 0) {
    ctx.setTransform(Z, 0, 0, Z, 0, 0);
    const v = veil * veil * (3 - 2 * veil);
    ctx.fillStyle = `rgba(0,0,0,${v})`; ctx.fillRect(0, 0, W, H);
  }
}
function renderMode() {
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
  if (mode === 'finale') {
    const fin = Object.keys(lot.s).length ? {...FINALE, log: {de: [...FINALE.log.de, UI.de.yieldLog(lotYield())], en: [...FINALE.log.en, UI.en.yieldLog(lotYield())]}} : FINALE;
    ctx.setTransform(Z / 2, 0, 0, Z / 2, 0, 0); window.SchichtOdenchip.draw(ctx, finT, frame, lang, fin);
    ctx.setTransform(Z, 0, 0, Z, 0, 0); return;
  }
  if (mode === 'dead') return renderDead();
  if (mode === 'rewind') return renderRewind();
  renderPlay();
  if (mode === 'note') drawNote();
  if (mode === 'mini' && mini) window.SchichtMini.draw(ctx, mini, lang);
  if (mode === 'process') window.SchichtProcess.draw(ctx, procType, procT, lang, {n: levelIndex + 1, found: found.size, total: LEVELS.length, lot});
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
volume.addEventListener('change', () => volume.blur());
volume.addEventListener('input', () => {
  audio.vol = volume.value / 100; store.set('volume', volume.value);
  if (audio.master && audio.on) audio.master.gain.value = audio.vol;
});
btnPause.addEventListener('click', e => { togglePause(); e.currentTarget.blur(); });
btnFull.addEventListener('click', e => {
  e.currentTarget.blur();
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const go = document.body.requestFullscreen || document.body.webkitRequestFullscreen; const p = go && go.call(document.body); if (p && p.catch) p.catch(() => {}); }
  } catch (_) { /* fullscreen unavailable */ }
});
if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) btnFull.style.display = 'none';
applyLanguage();

/* ---------- Main loop ---------- */
let last = performance.now(), acc = 0;
const FRAME = 1000 / 60;
// One failing frame must never stop the game: the loop always asks for the next frame, and only renders
// when something was updated (no double work on 120 or 144 Hz screens).
function loop(now) {
  requestAnimationFrame(loop);
  acc += Math.min(250, now - last); last = now;
  let ticked = false;
  try {
    while (acc >= FRAME) { update(); acc -= FRAME; ticked = true; }
    if (ticked) render();
  } catch (e) { console.error(e); }
}
if (new URLSearchParams(location.search).has('test')) {
  // Test hook: deterministic control for the browser check, only with ?test in the URL.
  window.__schicht = {
    levels, get state() { return state; }, get mode() { return mode; },
    card: i => startCard(i), start: i => startLevel(i), act: a => doStep(a), render, update, intro: () => startIntro(), cinema: () => startCinema(), get cinemaT() { return cinemaT; },
    finale: () => { mode = 'finale'; finT = 0; }, get finT() { return finT; }, found,
    process: (type, tt) => { procType = type; procT = tt; mode = 'process'; },
    setLayer: l => audio.setLayer(l), lang: l => { lang = l; applyLanguage(); },
    get paNow() { return paNow; }, get paT() { return paT; }, set paT(v) { paT = v; }, get scare() { return scare; }, get noteT() { return noteT; }, set noteT(v) { noteT = v; },
    pa: i => startPA(LEVELS[levelIndex].pa[i]), setMode: m => { mode = m; }, calm: () => { fx = 0; shake = 0; },
    dead: (cause, tt) => { state.cause = cause; mode = 'dead'; deadT = tt; },
    mini: type => startMini(type), get miniGame() { return mini; }, get lot() { return lot; }, press: w => press(w), setShift: v => { shiftHeld = v; },
    get fadingOut() { return veilPhase === 'out'; }, get veil() { return veil; }, get cardT() { return cardT; }, set cinemaT(v) { cinemaT = v; }, scareNow: (type, extra = {}) => { scare = {type, t: 0, ...extra}; },
  };
}
try { render(); } catch (e) { console.error(e); }
requestAnimationFrame(loop);
})();
