/* Schichtwechsel - 3D renderer prototype (three.js). Draws a level from the same rules state as the 2D game.
 * One tile is one unit. Your shift and the shift before are two groups with their own geometry and light. */
import * as THREE from 'three';
import {EffectComposer} from '../vendor/three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from '../vendor/three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from '../vendor/three/examples/jsm/postprocessing/OutputPass.js';
import {RoomEnvironment} from '../vendor/three/examples/jsm/environments/RoomEnvironment.js';

const C = window.SchichtCore;
const WALL_H = 0.95;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

// Raised cleanroom floor: perforated plates. The shift before: the same plates, stained and cracked.
function floorTexture(night) {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = night ? '#2b2112' : '#aab3bf'; g.fillRect(0, 0, w, h);
    for (let y = 20; y < h; y += 24) for (let x = 20; x < w; x += 24) {
      g.fillStyle = night ? '#120c05' : '#8d96a3'; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill();
      g.fillStyle = night ? '#3a2d18' : '#e6eaf0'; g.beginPath(); g.arc(x - 1, y - 1, 1.6, 0, 7); g.fill();
    }
    g.strokeStyle = night ? '#0e0904' : '#a4adb9'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
    g.strokeStyle = night ? '#4a3a1e' : '#eef1f5'; g.lineWidth = 2; g.strokeRect(5, 5, w - 10, h - 10);
    if (night) {
      for (let i = 0; i < 9; i++) {
        g.fillStyle = `rgba(20,10,0,${0.15 + hash(i) * 0.25})`;
        g.beginPath(); g.ellipse(hash(i * 3) * w, hash(i * 5) * h, 20 + hash(i * 7) * 50, 10 + hash(i * 11) * 30, hash(i) * 3, 0, 7); g.fill();
      }
      g.strokeStyle = '#0b0703'; g.lineWidth = 2; g.beginPath(); g.moveTo(30, 200); g.lineTo(90, 150); g.lineTo(120, 170); g.lineTo(200, 90); g.stroke();
    }
  });
}

function wallTexture(night) {
  return canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = night ? '#3b2d14' : '#dfe4ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = night ? '#2a200e' : '#b8c1cc'; g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle = night ? '#9a6c1e' : '#2f6db3'; g.fillRect(0, h * 0.58, w, 8);
    g.strokeStyle = night ? '#231a0b' : '#c3cad4'; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
    if (night) for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(15,8,0,.35)'; g.fillRect(hash(i) * w, hash(i * 2) * h * 0.6, 2 + hash(i * 3) * 4, 20 + hash(i * 4) * 60); }
  });
}

function screenTexture(night, seed) {
  return canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = night ? '#1a0d02' : '#071a33'; g.fillRect(0, 0, w, h);
    g.fillStyle = night ? '#ffb43a' : '#7fd0ff';
    for (let i = 0; i < 5; i++) g.fillRect(8, 8 + i * 10, 20 + hash(seed + i) * 80, 4);
    g.fillStyle = night ? '#ff5a1a' : '#3fd06a'; g.fillRect(w - 22, 8, 14, 14);
    if (night) { g.font = 'bold 12px monospace'; g.fillStyle = '#ffcf5a'; g.fillText('ROSSI_01', 30, 58); }
  });
}

function labelSprite(text, {color = '#e9eef5', bg = 'rgba(8,12,20,.85)', edge = '#2f6db3', height = 0.32} = {}) {
  const pad = 14, fs = 44;
  const c = document.createElement('canvas'), g = c.getContext('2d');
  g.font = `700 ${fs}px "Silkscreen", monospace`;
  c.width = Math.ceil(g.measureText(text).width) + pad * 2; c.height = fs + pad * 1.4;
  g.font = `700 ${fs}px "Silkscreen", monospace`;
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = edge; g.fillRect(0, c.height - 5, c.width, 5);
  g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, pad, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map: t, depthTest: false, transparent: true}));
  s.scale.set(height * c.width / c.height, height, 1);
  s.renderOrder = 10;
  return s;
}

function radialTexture(inner, outer) {
  return canvasTexture(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    r.addColorStop(0, inner); r.addColorStop(1, outer); g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
}

function hazardTexture(night) {
  return canvasTexture(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const band = 10;
    g.save(); g.beginPath(); g.rect(0, 0, w, h); g.rect(band, band, w - 2 * band, h - 2 * band); g.clip('evenodd');
    for (let i = -h; i < w + h; i += 16) { g.fillStyle = night ? '#6a4a0a' : '#f2c21a'; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, 0); g.lineTo(i + 8 - h, h); g.lineTo(i - h, h); g.fill(); }
    for (let i = -h + 8; i < w + h; i += 16) { g.fillStyle = night ? '#120c04' : '#1a1a1a'; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, 0); g.lineTo(i + 8 - h, h); g.lineTo(i - h, h); g.fill(); }
    g.restore();
  });
}

const SIGNS = ['ZONA ISO 3', 'ATTENZIONE', 'LUCE GIALLA', 'VIETATO L\'ACCESSO', 'FAB 7 · BAY 7', 'TURNO B', 'NON CORRERE'];

// Film grain and vignette after bloom: keeps the bright shift clinical and the dark one oppressive.
const GrainShader = {
  uniforms: {tDiffuse: {value: null}, time: {value: 0}, amount: {value: 0.05}, vignette: {value: 0.35}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, amount, vignette; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); float n = rnd(vUv * 1000.0) - 0.5;
      vec2 d = vUv - 0.5; float v = 1.0 - vignette * dot(d, d) * 2.6;
      gl_FragColor = vec4((c.rgb + n * amount) * v, c.a); }`,
};

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 200);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(960, 540), 0.5, 0.5, 0.8);
  composer.addPass(bloom);
  const grain = new ShaderPass(GrainShader);
  composer.addPass(grain);
  composer.addPass(new OutputPass());

  const groups = [new THREE.Group(), new THREE.Group()];
  scene.add(groups[0], groups[1]);
  const dyn = {flicker: [], stations: [], enemies: [], shadows: [], player: null, lamp: null, glow: null, markers: [], arms: [], oht: []};
  let level = null, def = null, camPos = new THREE.Vector3(), camInit = false;

  const mats = [0, 1].map(n => ({
    floor: new THREE.MeshStandardMaterial({map: floorTexture(n), roughness: n ? 0.7 : 0.32, metalness: n ? 0.3 : 0.55}),
    wall: new THREE.MeshStandardMaterial({map: wallTexture(n), roughness: n ? 0.9 : 0.6}),
    body: new THREE.MeshStandardMaterial({color: n ? '#4a3a1c' : '#eef1f4', roughness: n ? 0.75 : 0.28, metalness: n ? 0.35 : 0.2}),
    accent: new THREE.MeshStandardMaterial({color: n ? '#7a4a12' : '#e8732a', roughness: 0.4, metalness: 0.2}),
    glass: new THREE.MeshStandardMaterial({color: n ? '#3a2a10' : '#9fd0ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35}),
    dark: new THREE.MeshStandardMaterial({color: n ? '#1b1409' : '#55606e', roughness: 0.6, metalness: 0.3}),
  }));

  function clearGroup(g) {
    while (g.children.length) { const c = g.children.pop(); c.traverse?.(o => { if (o.geometry) o.geometry.dispose(); }); }
  }

  // Machine blocks: connected rectangles of M tiles, each with a screen, a status light and a name.
  function machineBlocks(layer) {
    const seen = new Set(), blocks = [], map = level.layers[layer];
    for (let i = 0; i < map.length; i++) {
      if (map[i] !== 'M' || seen.has(i)) continue;
      let x0 = i % C.W, y0 = (i / C.W) | 0, x1 = x0, y1 = y0;
      while (x1 + 1 < C.W && map[y0 * C.W + x1 + 1] === 'M') x1++;
      while (y1 + 1 < C.H && map[(y1 + 1) * C.W + x0] === 'M') y1++;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) seen.add(y * C.W + x);
      blocks.push({x0, y0, x1, y1});
    }
    return blocks;
  }
  function nameFor(b, n) {
    const names = def.machines || {};
    const key = `${b.x0},${b.y0}`;
    if (names[key]) return names[key];
    let best = null, bestD = 3.5;
    level.stations.forEach((s, i) => {
      const d = Math.hypot(s.x - (b.x0 + b.x1) / 2, s.y - (b.y0 + b.y1) / 2);
      if (d < bestD && def.route) { bestD = d; best = def.route[i].en.toUpperCase(); }
    });
    return best || ['STOCKER', 'METROLOGIA', 'WET BENCH', 'TRACK', 'CLEAN'][n % 5];
  }

  function buildLayer(layer) {
    const g = groups[layer], M = mats[layer], map = level.layers[layer];
    clearGroup(g);
    const tiles = [...map].map((c, i) => ({c, x: i % C.W, y: (i / C.W) | 0}));
    // Deep void under everything: holes show it.
    const voidPlane = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({color: layer ? '#030201' : '#1a1f28'}));
    voidPlane.rotation.x = -Math.PI / 2; voidPlane.position.set(C.W / 2, -3, C.H / 2); g.add(voidPlane);
    const floorTiles = tiles.filter(t => t.c !== 'o');
    const floor = new THREE.InstancedMesh(new THREE.BoxGeometry(0.98, 0.2, 0.98), M.floor, floorTiles.length);
    floorTiles.forEach((t, n) => floor.setMatrixAt(n, new THREE.Matrix4().makeTranslation(t.x + 0.5, -0.1, t.y + 0.5)));
    floor.receiveShadow = true; g.add(floor);
    const walls = tiles.filter(t => t.c === '#');
    const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(1, WALL_H, 1), M.wall, walls.length);
    walls.forEach((t, n) => wall.setMatrixAt(n, new THREE.Matrix4().makeTranslation(t.x + 0.5, WALL_H / 2, t.y + 0.5)));
    wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
    // Windows to the lake: a low sill and the night water of Lago Maggiore behind glass.
    const lake = canvasTexture(256, 128, (c, w, h) => {
      c.fillStyle = layer ? '#030305' : '#06122a'; c.fillRect(0, 0, w, h);
      c.fillStyle = layer ? '#05060a' : '#0c1d40'; c.fillRect(0, h * 0.55, w, h);
      if (!layer) { c.fillStyle = '#f2e6b0'; for (let i = 0; i < 6; i++) c.fillRect(110 + hash(i) * 30, h * 0.6 + i * 7, 18 - i * 2, 2); for (let i = 0; i < 14; i++) { c.fillStyle = '#ffd27a'; c.fillRect(hash(i * 7) * w, h * 0.45 + hash(i) * 6, 3, 2); } }
      else { c.fillStyle = '#a02818'; c.fillRect(200, h * 0.4, 3, 3); }
    });
    for (const t of tiles.filter(t => t.c === '=')) {
      const sill = new THREE.Mesh(new THREE.BoxGeometry(1, 0.35, 1), M.wall); sill.position.set(t.x + 0.5, 0.175, t.y + 0.5); g.add(sill);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 0.08), new THREE.MeshStandardMaterial({map: lake, emissive: '#ffffff', emissiveMap: lake, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.4}));
      pane.position.set(t.x + 0.5, 0.8, t.y + 0.85); g.add(pane);
    }
    machineBlocks(layer).forEach((b, n) => {
      const w = b.x1 - b.x0 + 1, d = b.y1 - b.y0 + 1, cx = b.x0 + w / 2, cz = b.y0 + d / 2, h = 1.0 + (hash(n + layer) > 0.5 ? 0.25 : 0);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w - 0.14, h, d - 0.14), M.body);
      body.position.set(cx, h / 2, cz); body.castShadow = true; body.receiveShadow = true; g.add(body);
      // Orange accent band, a glass hood with the tool's inner robot, yellow-black floor marking around it.
      const band = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.07, d - 0.12), M.accent); band.position.set(cx, h * 0.35, cz); g.add(band);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(w - 0.5, 0.28, d - 0.5), M.glass); hood.position.set(cx, h + 0.18, cz); g.add(hood);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, Math.max(0.3, d - 0.9)), M.dark); arm.position.set(cx + (w > 1.5 ? 0.3 : 0), h + 0.14, cz); g.add(arm);
      dyn.arms.push({mesh: arm, x: cx, w, seed: n + layer * 9});
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.2, d + 0.2), new THREE.MeshStandardMaterial({map: hazardTexture(layer), roughness: 0.6, transparent: true}));
      stripe.rotation.x = -Math.PI / 2; stripe.position.set(cx, 0.006, cz); stripe.receiveShadow = true; g.add(stripe);
      const top = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.08, d - 0.3), M.dark); top.position.set(cx, h + 0.04, cz); g.add(top);
      const scr = screenTexture(layer, n * 13 + layer);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(0.9, w - 0.4), 0.38), new THREE.MeshStandardMaterial({map: scr, emissive: '#ffffff', emissiveMap: scr, emissiveIntensity: layer ? 1.4 : 1.1}));
      screen.position.set(cx, h * 0.68, b.y1 + 1 - 0.06); g.add(screen);
      if (layer) dyn.flicker.push({mesh: screen, seed: n});
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshStandardMaterial({color: '#000', emissive: layer ? '#ff3a1a' : '#3fff6a', emissiveIntensity: 4}));
      led.position.set(b.x0 + 0.3, h + 0.12, b.y1 + 1 - 0.25); g.add(led);
      if (!layer) {
        const label = labelSprite(nameFor(b, n), {height: 0.26});
        label.position.set(cx, h + 0.45, cz); g.add(label);
      }
    });
    // Process stations: a load port with lot 4471 in its carrier.
    level.stations.forEach((s, n) => {
      if (s.layer !== layer) return;
      const port = new THREE.Group();
      const table = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.8), M.dark); table.position.y = 0.225; table.castShadow = true; port.add(table);
      const foup = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.46), new THREE.MeshStandardMaterial({color: '#d9dde3', roughness: 0.3}));
      foup.position.y = 0.66; foup.castShadow = true; port.add(foup);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshStandardMaterial({color: '#ffb43a', emissive: '#ff9a1a', emissiveIntensity: 0.6, transparent: true, opacity: 0.85}));
      front.position.set(0, 0.66, 0.235); port.add(front);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.12), M.dark); handle.position.set(0, 0.9, 0); port.add(handle);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.54, 40), new THREE.MeshBasicMaterial({color: layer ? '#ffcf5a' : '#7fd0ff', transparent: true, side: THREE.DoubleSide}));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; port.add(ring);
      const name = def.route ? `${n + 1} · ${def.route[n][document.documentElement.lang === 'de' ? 'de' : 'en'].toUpperCase()}` : `${n + 1}`;
      const label = labelSprite(name, {color: layer ? '#ffcf5a' : '#e9eef5', edge: layer ? '#9a6c1e' : '#2f6db3', height: 0.3});
      label.position.y = 1.45; port.add(label);
      port.position.set(s.x + 0.5, 0, s.y + 0.5);
      g.add(port);
      dyn.stations.push({n, layer, port, ring, label, foup});
    });
    // The airlock: a frame, sliding doors and the green USCITA sign.
    for (const e of level.exits) {
      if (e.layer !== layer) continue;
      const ex = new THREE.Group();
      for (const sx of [-0.45, 0.45]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.9), M.dark); post.position.set(sx, 0.75, 0); ex.add(post); }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.9), M.dark); lintel.position.y = 1.5; ex.add(lintel);
      const doorMat = new THREE.MeshStandardMaterial({color: layer ? '#5c4514' : '#b9c3cf', roughness: 0.3, metalness: 0.6});
      const doors = [-0.2, 0.2].map(dx => { const d = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.38, 0.06), doorMat); d.position.set(dx, 0.69, 0.3); ex.add(d); return d; });
      const sign = labelSprite('USCITA', {color: '#eaffef', bg: layer ? 'rgba(20,40,12,.95)' : 'rgba(18,140,64,.95)', edge: '#0a3', height: 0.28});
      sign.position.y = 1.85; ex.add(sign);
      ex.position.set(e.x + 0.5, 0, e.y + 0.5); g.add(ex);
      dyn.markers.push({doors, layer, sign});
    }
    // Italian signs on walls that face the camera.
    let signN = 0;
    for (const t of walls) {
      if (t.y + 1 >= C.H || map[(t.y + 1) * C.W + t.x] === '#' || hash(t.x * 7 + t.y * 13 + layer) < 0.86) continue;
      const text = layer && signN === 0 ? 'LUCE GIALLA' : SIGNS[(t.x + t.y + signN) % SIGNS.length];
      const sign = labelSprite(text, {color: layer ? '#c08a2a' : '#1a1004', bg: layer ? 'rgba(40,28,8,.95)' : 'rgba(242,194,26,.95)', edge: layer ? '#5a3a0a' : '#1a1a1a', height: 0.2});
      sign.position.set(t.x + 0.5, WALL_H + 0.12, t.y + 1.0); g.add(sign); signN++;
    }
    // Overhead transport: a rail along the widest open row, carriers gliding along it (hanging still in the shift before).
    let bestRow = -1, bestLen = 0;
    for (let y = 1; y < C.H - 1; y++) {
      let run = 0;
      for (let x = 1; x < C.W - 1; x++) { run = map[y * C.W + x] !== '#' ? run + 1 : 0; if (run > bestLen) { bestLen = run; bestRow = y; } }
    }
    if (bestRow > 0) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(C.W - 2, 0.06, 0.12), M.dark); rail.position.set(C.W / 2, 2.1, bestRow + 0.5); g.add(rail);
      for (let k = 0; k < 3; k++) {
        const car = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.42), new THREE.MeshStandardMaterial({color: layer ? '#6a5530' : '#d9dde3', roughness: 0.3}));
        box.position.y = -0.35; box.castShadow = true; car.add(box);
        const hook = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), M.dark); hook.position.y = -0.08; car.add(hook);
        car.position.set(2 + k * 6, 2.1, bestRow + 0.5); g.add(car);
        dyn.oht.push({car, layer, phase: k * 6});
      }
    }
    // Light rigs.
    if (!layer) {
      g.add(new THREE.HemisphereLight('#eef4ff', '#5d6776', 0.55));
      const sun = new THREE.DirectionalLight('#f2f7ff', 1.7);
      sun.position.set(C.W / 2 - 3, 14, C.H / 2 + 5); sun.target.position.set(C.W / 2, 0, C.H / 2);
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, {left: -13, right: 13, top: 9, bottom: -9, near: 1, far: 40});
      sun.shadow.radius = 4; sun.shadow.bias = -0.0005;
      g.add(sun, sun.target);
    } else {
      g.add(new THREE.HemisphereLight('#7a5418', '#0a0602', 0.55));
      // Yellow litho lamps on a grid, buzzing and flickering; some are dead.
      let n = 0;
      for (let z = 1.5; z < C.H; z += 3.5) for (let x = 2.5; x < C.W; x += 5) {
        if (hash(x * 3 + z * 7) < 0.2) continue;
        const l = new THREE.PointLight('#ffae2a', 5, 5.5, 1.5); l.position.set(x, 1.9, z); g.add(l);
        const tube = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.12), new THREE.MeshBasicMaterial({color: '#ffcf5a'})); tube.position.set(x, 2.0, z); g.add(tube);
        dyn.flicker.push({light: l, base: 5, seed: n++ + 10, tube});
      }
    }
  }

  function makeFigure(night, enemy) {
    const f = new THREE.Group();
    const suitM = new THREE.MeshStandardMaterial({color: enemy ? '#8f8466' : '#f4f6f9', roughness: enemy ? 0.9 : 0.55});
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(enemy ? 0.2 : 0.22, enemy ? 0.62 : 0.42, 6, 14), suitM);
    body.position.y = enemy ? 0.62 : 0.5; body.castShadow = true; f.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 14), suitM); head.position.y = enemy ? 1.12 : 0.92; head.castShadow = true; f.add(head);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.08), new THREE.MeshStandardMaterial({color: enemy ? '#050402' : '#123', emissive: enemy ? '#000' : '#3a8cff', emissiveIntensity: enemy ? 0 : 1.5, roughness: 0.1, metalness: 0.8}));
    visor.position.set(0, head.position.y + 0.02, 0.16); f.add(visor);
    if (enemy) {
      for (const ex of [-0.06, 0.06]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({color: '#ffb43a'})); eye.position.set(ex, visor.position.y, 0.205); f.add(eye); }
      for (const ax of [-0.25, 0.25]) { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.5, 4, 8), suitM); arm.position.set(ax, 0.5, 0.02); f.add(arm); }
    } else {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.14), new THREE.MeshStandardMaterial({color: '#9aa6b5', roughness: 0.5})); pack.position.set(0, 0.6, -0.2); f.add(pack);
      const carrier = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.24), new THREE.MeshStandardMaterial({color: '#d9dde3', emissive: '#ff9a1a', emissiveIntensity: 0.08})); carrier.position.set(0, 0.48, 0.3); f.add(carrier);
    }
    return f;
  }

  return {
    setLevel(lv, d) {
      level = lv; def = d; dyn.flicker = []; dyn.stations = []; dyn.markers = []; dyn.arms = []; dyn.oht = []; camInit = false;
      buildLayer(0); buildLayer(1);
      if (dyn.player) scene.remove(dyn.player);
      dyn.player = makeFigure(false, false); scene.add(dyn.player);
      // Helmet lamp: only useful in the shift before.
      dyn.lamp = new THREE.SpotLight('#ffe2a8', 0, 9, 0.55, 0.55, 1.4);
      dyn.lamp.castShadow = true; dyn.lamp.shadow.mapSize.set(1024, 1024); dyn.lamp.position.set(0, 1.05, 0.35);
      dyn.player.add(dyn.lamp); dyn.player.add(dyn.lamp.target); dyn.lamp.target.position.set(0, 0, 3);
      dyn.glow = new THREE.PointLight('#ffd890', 0, 3.5, 1.8); dyn.glow.position.set(0, 2.2, 0.6); dyn.player.add(dyn.glow);
      dyn.suit = dyn.player.children[0].material;
      dyn.enemies.forEach(e => scene.remove(e)); dyn.shadows.forEach(s => scene.remove(s));
      dyn.enemies = lv.enemyStarts.map(() => { const e = makeFigure(true, true); scene.add(e); return e; });
      const shadowTex = radialTexture('rgba(0,0,0,.85)', 'rgba(0,0,0,0)');
      dyn.shadows = lv.enemyStarts.map(() => {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.1), new THREE.MeshBasicMaterial({map: shadowTex, transparent: true, depthWrite: false}));
        s.rotation.x = -Math.PI / 2; s.position.y = 0.012; scene.add(s); return s;
      });
    },
    resize(w, h) { renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); },
    render(state, view) {
      const layer = state.layer, night = layer === 1, t = view.time;
      groups[0].visible = !night; groups[1].visible = night;
      scene.background = new THREE.Color(night ? '#020100' : '#0b0f16');
      scene.fog = night ? new THREE.FogExp2('#140c03', 0.035) : null;
      scene.environmentIntensity = night ? 0.15 : 0.45;
      renderer.toneMappingExposure = night ? 1.15 : 0.85;
      bloom.strength = night ? 0.55 : 0.1; bloom.threshold = night ? 0.75 : 0.95; bloom.radius = 0.45;
      grain.uniforms.time.value = t % 100; grain.uniforms.amount.value = night ? 0.05 : 0.025; grain.uniforms.vignette.value = night ? 0.9 : 0.35;
      const [px, pz] = view.player, face = {up: Math.PI, down: 0, left: -Math.PI / 2, right: Math.PI / 2}[state.face] ?? 0;
      dyn.player.position.set(px + 0.5, view.bob || 0, pz + 0.5);
      dyn.player.rotation.y += ((face - dyn.player.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * 0.35;
      dyn.player.visible = view.playerVisible !== false;
      dyn.lamp.intensity = night ? 11 : 0; dyn.glow.intensity = night ? 0.5 : 0;
      dyn.suit.color.set(night ? '#b89a62' : '#f4f6f9');
      state.enemies.forEach((e, i) => {
        const [ex, ez] = view.enemies[i];
        dyn.enemies[i].visible = night; dyn.enemies[i].position.set(ex + 0.5, 0, ez + 0.5);
        dyn.enemies[i].lookAt(px + 0.5, 0, pz + 0.5);
        dyn.enemies[i].rotation.z = Math.sin(t * 0.7 + i) * 0.05;
        dyn.shadows[i].visible = !night; dyn.shadows[i].position.set(ex + 0.5 + 0.15, 0.012, ez + 0.5 + 0.35);
        dyn.shadows[i].material.opacity = 0.55 + 0.15 * Math.sin(t * 3 + i);
      });
      for (const f of dyn.flicker) {
        const on = hash(Math.floor(t * 12) + f.seed * 7) > 0.08;
        if (f.light) { f.light.intensity = on ? f.base * (0.85 + 0.15 * Math.sin(t * 40 + f.seed)) : f.base * 0.15; if (f.tube) f.tube.visible = on; }
        if (f.mesh) f.mesh.material.emissiveIntensity = on ? 1.4 : 0.2;
      }
      for (const s of dyn.stations) {
        const done = state.got > s.n, next = state.got === s.n;
        s.ring.visible = next; s.ring.material.opacity = 0.5 + 0.5 * Math.sin(t * 5);
        s.foup.visible = !done; s.label.material.opacity = done ? 0.35 : 1;
        s.label.position.y = 1.45 + (next ? Math.sin(t * 3) * 0.06 : 0);
      }
      for (const a of dyn.arms) a.mesh.position.x = a.x + Math.sin(t * (night ? 0.3 : 1.1) + a.seed) * Math.max(0, a.w / 2 - 0.45);
      for (const o of dyn.oht) {
        if (o.layer) { o.car.rotation.z = Math.sin(t * 0.8 + o.phase) * 0.08; continue; }
        o.car.position.x = 1.5 + ((t * 1.3 + o.phase) % (C.W - 3));
      }
      const open = state.got === level.stations.length;
      for (const m of dyn.markers) { m.doors[0].position.x = open ? -0.36 : -0.2; m.doors[1].position.x = open ? 0.36 : 0.2; }
      // Camera: high and slightly behind, following the player, clamped to the hall.
      const target = new THREE.Vector3(Math.min(Math.max(px + 0.5, 6.5), C.W - 6.5), 0, Math.min(Math.max(pz + 0.5, 3.5), C.H - 3.5));
      const want = target.clone().add(new THREE.Vector3(0, 12.5, 6.2));
      if (!camInit) { camPos.copy(want); camInit = true; } else camPos.lerp(want, 0.08);
      camera.position.copy(camPos); camera.lookAt(target.x, 0, target.z - 0.6);
      composer.render();
    },
  };
}
