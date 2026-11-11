// 3D prototype: the rules from core.js, drawn by render3d.js. Keyboard only; no audio, no cards.
import {createRenderer} from './render3d.js';
const C = window.SchichtCore, {LEVELS} = window.SchichtLevels;
const params = new URLSearchParams(location.search);
const index = Math.min(Math.max((+params.get('level') || 3) - 1, 0), LEVELS.length - 1);
const level = C.parseLevel(LEVELS[index]);
const canvas = document.getElementById('c');
await document.fonts.load('700 44px "Silkscreen"');
const view3d = createRenderer(canvas);
view3d.resize(canvas.width, canvas.height);
view3d.setLevel(level, LEVELS[index]);
let state = C.newState(level), stepFrame = 0, frame = 0;
const STEP = 7, held = new Set();
let queued = null, shift = false;
const KEYS = {ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right'};
addEventListener('keydown', e => {
  const d = KEYS[e.code];
  if (d) { e.preventDefault(); if (!e.repeat) { held.add(d); queued = d; } }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) shift = true; }
  if (e.code === 'KeyR') state = C.newState(level);
});
addEventListener('keyup', e => { const d = KEYS[e.code]; if (d) held.delete(d); });
const info = document.getElementById('info');
function enemyView(k) {
  return state.enemies.map(e => {
    if (e.fx === undefined || e.moved < 0) return [e.x, e.y];
    const span = level.enemyEvery * STEP * (state.layer ? 1 : 2);
    const q = Math.min(1, ((state.step - e.moved) * STEP + stepFrame) / span);
    return [e.fx + (e.x - e.fx) * q, e.fy + (e.y - e.fy) * q];
  });
}
function act(a) {
  const from = state.enemies.map(e => [e.x, e.y]);
  C.step(state, a);
  state.enemies.forEach((e, i) => { if (e.moved === state.step) { e.fx = from[i][0]; e.fy = from[i][1]; } });
  if (state.status !== 'play') setTimeout(() => { state = C.newState(level); }, 900);
}
function draw() {
  const k = Math.min(1, stepFrame / STEP);
  const px = state.px + (state.x - state.px) * k, py = state.py + (state.y - state.py) * k;
  view3d.render(state, {time: performance.now() / 1000, player: [px, py], enemies: enemyView(k), bob: (state.px !== state.x || state.py !== state.y) ? Math.sin(k * Math.PI) * 0.05 : 0});
  info.innerHTML = `<b>${LEVELS[index].layer.de}</b> · ${state.layer ? 'VORSCHICHT' : 'DEINE SCHICHT'} · ${state.got}/${level.stations.length} · ${state.status}`;
}
function loop() {
  frame++;
  if (!params.has('still') && state.status === 'play' && ++stepFrame >= STEP) {
    stepFrame = 0;
    const a = shift ? 'shift' : queued || [...held][0] || 'wait';
    shift = false; queued = null; act(a);
  }
  draw(); requestAnimationFrame(loop);
}
window.__proto = {get state() { return state; }, act, draw, level, set stepFrame(v) { stepFrame = v; }};
requestAnimationFrame(loop);
