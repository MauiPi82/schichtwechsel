/* Schichtwechsel - game rules without rendering, audio or DOM.
 * Runs in the browser (window.SchichtCore) and in Node (require) so tests and the solver use the same rules.
 *
 * The world is a 20 x 10 grid that exists twice: the day shift (layer 0) and the night shift (layer 1).
 * Time advances in steps (one step = one player move). Each step the player moves, shifts or waits;
 * then forced shifts, pickups, robots and the previous shift ("Vorschicht") are resolved. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SchichtCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const W = 20, H = 10, N = W * H;
  const DAY = 0, NIGHT = 1;
  const ACTIONS = ['up', 'right', 'down', 'left', 'shift', 'wait'];
  const DIRS = {up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0]};
  const ORDER = ['up', 'right', 'down', 'left'];
  // Grace equals the cooldown, so a player who shifts next to the previous shift can always shift back in time.
  // After a shift into the shift before, the previous shift cannot catch you for GRACE steps:
  // time to see where they stand and to shift back.
  const SHIFT_COOLDOWN = 3, GRACE = 6;
  // Tools as help: walking into a tool flares its work light. The previous shift became a layer, and like
  // photoresist it reacts to light: within FLASH_RADIUS they set for FREEZE steps. Plasma chambers and the
  // implanter also stop on their emergency button for HAZARD_OFF steps. Every tool needs RECHARGE steps.
  const FLASH_RADIUS = 4, FREEZE = 18, HAZARD_OFF = 24, RECHARGE = 48;
  // Watchfulness: whoever passes one of shift B on their round this close, in their shift, is followed for a few
  // steps; then they walk back to the place on their round where they left it.
  // ALERT_RADIUS counts steps along the way in their shift: no noticing through walls or across holes.
  const ALERT_RADIUS = 3, ALERT_STEPS = 12;
  const BELL_WARNING = 24;
  // Plasma glows faintly this many steps before it fires.
  const PULSE_WARN = 10;
  // The warning comes in the last third of the interval, at most BELL_WARNING steps before the bell.
  // In the calm mode the warning comes earlier: in the last half of the interval.
  const bellWarning = (bell, easy = false) => Math.min(BELL_WARNING, Math.floor(bell / (easy ? 2 : 3)));
  // The calm mode: the same hours, gentler. Their rounds take two of your steps per tile where they took one,
  // the ring after a shift lasts longer, and they notice you only from closer.
  const EASY = {grace: 10, alert: 2, slower: 2};
  // Tiles: # wall, M machine, = glass, o hole, . floor, P start, X airlock exit,
  // 1-8 process stations (visited in order), V previous shift (night only).
  // K lockers, B bench, D door (closed until the game opens it; only in the intro).
  const SOLID = new Set(['#', 'M', 'o', '=', 'K', 'B', 'D', 'G']);

  // Ion species for implanter beams: mass in atomic mass units, charge in elementary charges.
  const AMU = 1.66053907e-27, QE = 1.602176634e-19;
  const SPECIES = {B: {m: 11, q: 1}, P: {m: 31, q: 1}, As: {m: 75, q: 1}, BF2: {m: 49, q: 1}};

  const idx = (x, y) => y * W + x;

  function parseLevel(def, {easy = false} = {}) {
    const layers = [def.day, def.night].map((rows, layer) => {
      if (rows.length !== H || rows.some(r => r.length !== W)) {
        throw new Error(`Level ${def.id}: layer ${layer} must be ${W} x ${H}`);
      }
      return rows.join('');
    });
    const walk = layers.map(s => Uint8Array.from(s, c => SOLID.has(c) ? 0 : 1));
    let start = null;
    const stations = [], exits = [], enemies = [];
    layers.forEach((s, layer) => {
      for (let i = 0; i < N; i++) {
        const c = s[i], x = i % W, y = (i / W) | 0;
        if (c === 'P') start = {x, y, layer};
        if (c >= '1' && c <= '8') {
          if (stations[c - 1]) throw new Error(`Level ${def.id}: station ${c} appears twice`);
          stations[c - 1] = {x, y, layer};
        }
        if (c === 'X') exits.push({x, y, layer});
        if (c === 'V') {
          if (layer !== NIGHT) throw new Error(`Level ${def.id}: the previous shift lives in the night layer`);
          enemies.push({x, y});
        }
      }
    });
    if (!start) throw new Error(`Level ${def.id}: no start`);
    if (!exits.length) throw new Error(`Level ${def.id}: no exit`);
    for (let n = 0; n < stations.length; n++) if (!stations[n]) throw new Error(`Level ${def.id}: station ${n + 1} missing`);
    const robots = (def.robots || []).map((path, n) => {
      const cells = path.map(([x, y]) => {
        if (!walk[DAY][idx(x, y)]) throw new Error(`Level ${def.id}: robot ${n} path crosses a solid day tile at ${x},${y}`);
        return {x, y};
      });
      return cells;
    });
    const level = {
      ...def, layers, walk, start, stations, exits, enemyStarts: enemies, robots,
      enemyEvery: (def.enemyEvery || 3) * (easy ? EASY.slower : 1),
      bell: def.bell || 0, easy,
      grace: easy ? EASY.grace : GRACE, alertRadius: easy ? EASY.alert : ALERT_RADIUS,
      dist: distanceFields(walk[NIGHT]),
    };
    // Rounds of the previous shift: waypoints joined by straight lines, walked as a loop in a fixed rhythm.
    level.patrols = (def.patrols || []).map((pt, n) => {
      const wp = pt.path, cells = [];
      for (let i = 0; i < wp.length; i++) {
        const [x0, y0] = wp[i], [x1, y1] = wp[(i + 1) % wp.length];
        if (x0 !== x1 && y0 !== y1) throw new Error(`Level ${def.id}: patrol ${n} must go straight from ${x0},${y0} to ${x1},${y1}`);
        const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0), len = Math.abs(x1 - x0) + Math.abs(y1 - y0);
        for (let k = 0; k < len || (wp.length === 1 && k === 0); k++) cells.push({x: x0 + sx * k, y: y0 + sy * k});
      }
      for (const c of cells) if (!walk[NIGHT][idx(c.x, c.y)]) throw new Error(`Level ${def.id}: patrol ${n} crosses a solid night tile at ${c.x},${c.y}`);
      // every: steps per tile in the shift before; by day, while you watch their shadows, half as fast.
      return {cells, every: (pt.every || 2) * (easy ? EASY.slower : 1), start: pt.start || 0};
    });
    level.blocks = layers.map((map, layer) => toolBlocks(def, map));
    level.blockAt = level.blocks.map(list => { const a = new Int16Array(N).fill(-1); list.forEach((b, n) => { for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) a[idx(x, y)] = n; }); return a; });
    level.beams = (def.beams || []).map(b => ({...b, phases: b.species.map(sp => traceBeam(level, b, sp))}));
    level.heat = def.heat ? simulateHeat(level, def.heat) : null;
    // One hidden reticle per layer, always in the shift before. Optional; all eight open the secret finale.
    if (def.reticle) {
      const [rx, ry] = def.reticle;
      if (!walkable(level, NIGHT, rx, ry)) throw new Error(`Level ${def.id}: reticle on a solid night tile`);
      level.reticle = {x: rx, y: ry, layer: NIGHT};
    }
    // A note left by shift B, read by standing on it in the shift it lies in (default: the shift before).
    if (def.note) {
      const layer = def.note.layer === 'day' ? DAY : NIGHT;
      if (!walkable(level, layer, def.note.x, def.note.y)) throw new Error(`Level ${def.id}: note on a solid tile`);
      level.note = {x: def.note.x, y: def.note.y, layer};
    }
    level.pulses = (def.pulses || []).map(p => {
      const cells = new Uint8Array(N);
      for (let y = p.y0; y <= p.y1; y++) for (let x = p.x0; x <= p.x1; x++) cells[idx(x, y)] = 1;
      // In an hour with a trial bell the plasma that keeps time with the bell sleeps through the first round.
      return {...p, layer: p.layer || DAY, cells, quietFirst: !!def.bellTrial && p.sync === 'bell'};
    });
    level.bellTrial = !!def.bellTrial;
    return level;
  }

  // Connected machine rectangles of one map, each matched to its entry in the level's tool list.
  function toolBlocks(def, map) {
    const seen = new Uint8Array(N), out = [];
    for (let i = 0; i < N; i++) {
      if (map[i] !== 'M' || seen[i]) continue;
      const x0 = i % W, y0 = (i / W) | 0;
      let x1 = x0, y1 = y0;
      while (x1 + 1 < W && map[idx(x1 + 1, y0)] === 'M') x1++;
      while (y1 + 1 < H && map[idx(x0, y1 + 1)] === 'M') y1++;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) seen[idx(x, y)] = 1;
      const t = (def.tools || []).find(q => q.x0 === x0 && q.y0 === y0) || {type: 'generic'};
      out.push({...t, x0, y0, x1, y1});
    }
    return out;
  }
  // What a tool does when you walk into it: every tool flares its light; tools with a deadly process also stop.
  function toolUse(level, b) {
    const stops = b.type === 'implanter' ? (level.beams.length ? 'beam' : null)
      : (b.type === 'chamber' || b.type === 'cluster') && level.pulses.length ? 'plasma' : null;
    return {flash: true, stops};
  }

  // Furnace heat on the day floor: explicit finite differences of dT/dt = a * laplace(T) - k (T - T0).
  // Walls insulate. While the furnace door is open its mouth holds the tube temperature.
  // The cycle is periodic, so one recorded period after warm-up describes every step.
  function simulateHeat(level, h) {
    const T = new Float64Array(N).fill(h.ambient), next = new Float64Array(N);
    const conducts = new Uint8Array(N);
    for (let i = 0; i < N; i++) conducts[i] = level.walk[DAY][i];
    for (const [x, y] of h.sources) conducts[idx(x, y)] = 1;
    // Cooled niches: shielded and ventilated, they stay at room temperature. A place to wait out the heat.
    for (const [x, y] of h.shields || []) conducts[idx(x, y)] = 0;
    // Each furnace mouth may open with its own delay, so the heat can travel along a bank of furnaces.
    const offset = new Int16Array(N).fill(-1);
    for (const [x, y, off = 0] of h.sources) offset[idx(x, y)] = off;
    const temps = [], hot = [];
    const tick = phase => {
      const open = i => { const q = ((phase - offset[i]) % h.period + h.period) % h.period; return q >= h.open[0] && q < h.open[1]; };
      for (let sub = 0; sub < h.substeps; sub++) {
        for (let i = 0; i < N; i++) {
          if (!conducts[i]) { next[i] = h.ambient; continue; }
          if (offset[i] >= 0 && open(i)) { next[i] = h.source; continue; }
          const x = i % W, y = (i / W) | 0;
          let lap = 0;
          for (const k of ORDER) {
            const nx = x + DIRS[k][0], ny = y + DIRS[k][1];
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const n = idx(nx, ny);
            if (conducts[n]) lap += T[n] - T[i];
          }
          next[i] = T[i] + h.alpha * lap - h.cooling * (T[i] - h.ambient);
        }
        T.set(next);
      }
    };
    for (let s = 0; s < h.period * 6; s++) tick(s % h.period);
    for (let s = 0; s < h.period; s++) {
      tick(s);
      temps.push(Float32Array.from(T));
      hot.push(Uint8Array.from(T, (v, i) => level.walk[DAY][i] && v >= h.threshold ? 1 : 0));
    }
    // Recorded frame s holds the field after the tick of phase s: index it with step % period.
    return {...h, temps, hot};
  }

  // A pulse with sync: 'bell' keeps its rhythm with the bell, also after a rewind restarts the bell (from).
  function pulseOn(p, step, from = 0) {
    if (p.quietFirst && step - from < p.period) return false;
    const ph = ((step - (p.sync ? from : 0)) % p.period + p.period) % p.period;
    return ph >= p.on[0] && ph < p.on[1];
  }
  // Steps since the last shift or since the ring was given back (after a window in the shift before).
  function sinceRing(state) { return state.step - Math.max(state.lastShift, state.graceFrom === undefined ? -Infinity : state.graceFrom); }

  // Hazards that depend only on time: heat by day, plasma in either shift. plasmaOff: true for all pulses,
  // or a function telling for each pulse (by its index) whether its emergency stop holds.
  function timedHazard(level, layer, step, x, y, plasmaOff = false, from = 0) {
    const i = idx(x, y), off = typeof plasmaOff === 'function' ? plasmaOff : () => plasmaOff;
    if (layer === DAY && level.heat && level.heat.hot[step % level.heat.period][i]) return 'heat';
    for (let n = 0; n < level.pulses.length; n++) {
      const p = level.pulses[n];
      if (p.layer === layer && p.cells[i] && pulseOn(p, step, from) && !off(n)) return 'plasma';
    }
    return null;
  }
  // The emergency stop of a plasma tool holds the pulses right next to it (in both shifts), not every one.
  const NEAR_TOOL = 2;
  function pulsesNear(level, b) {
    const out = [];
    level.pulses.forEach((p, n) => { if (p.x0 <= b.x1 + NEAR_TOOL && p.x1 >= b.x0 - NEAR_TOOL && p.y0 <= b.y1 + NEAR_TOOL && p.y1 >= b.y0 - NEAR_TOOL) out.push(n); });
    return out;
  }
  function pulseStopped(state, n, at = state.step) {
    return !!state.hazardOff && (at < (state.hazardOff.plasma || 0) || at < (state.hazardOff['p' + n] || 0));
  }

  // Implanter beam: straight outside the magnet, a circle of radius r = sqrt(2 m E) / (q B) inside it.
  // Positive ions and B into the screen (B > 0) bend counterclockwise on screen (F = q v x B, y pointing down).
  function traceBeam(level, beam, speciesKey) {
    const sp = SPECIES[speciesKey];
    if (!sp) throw new Error(`Level ${level.id}: unknown ion ${speciesKey}`);
    const m = sp.m * AMU, q = sp.q * QE, E = beam.keV * 1e3 * QE, f = beam.field;
    const radius = Math.sqrt(2 * m * E) / (q * Math.abs(f.B)) / beam.metersPerTile;
    const turn = -Math.sign(f.B) * Math.sign(sp.q);
    let x = beam.x + 0.5, y = beam.y + 0.5, [vx, vy] = DIRS[beam.dir];
    const ds = 0.02, points = [[x, y]], cells = new Uint8Array(N);
    let left = false;
    for (let i = 0; i < 20000; i++) {
      if (x >= f.x0 && x < f.x1 + 1 && y >= f.y0 && y < f.y1 + 1) {
        const a = turn * ds / radius, c = Math.cos(a), s = Math.sin(a);
        [vx, vy] = [vx * c - vy * s, vx * s + vy * c];
      }
      x += vx * ds; y += vy * ds;
      const cx = Math.floor(x), cy = Math.floor(y);
      if (cx < 0 || cy < 0 || cx >= W || cy >= H) break;
      const inSource = cx === beam.x && cy === beam.y;
      if (!inSource) left = true;
      if (left && !walkable(level, DAY, cx, cy)) break;
      if (!inSource) cells[idx(cx, cy)] = 1;
      if (i % 10 === 0) points.push([x, y]);
    }
    points.push([x, y]);
    return {species: speciesKey, mass: sp.m, radiusTiles: radius, radiusMeters: radius * beam.metersPerTile, points, cells};
  }

  function beamPhase(beam, step) {
    return Math.floor(step / beam.every) % beam.species.length;
  }

  // Shortest night-layer distance from every tile to every target tile (BFS from each target).
  function distanceFields(walk) {
    const fields = new Array(N);
    const queue = new Int16Array(N);
    for (let t = 0; t < N; t++) {
      const d = new Int16Array(N).fill(-1);
      if (walk[t]) {
        let head = 0, tail = 0;
        d[t] = 0; queue[tail++] = t;
        while (head < tail) {
          const c = queue[head++], cx = c % W, cy = (c / W) | 0;
          for (const k of ORDER) {
            const nx = cx + DIRS[k][0], ny = cy + DIRS[k][1];
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const n = idx(nx, ny);
            if (walk[n] && d[n] < 0) { d[n] = d[c] + 1; queue[tail++] = n; }
          }
        }
      }
      fields[t] = d;
    }
    return fields;
  }

  function newState(level) {
    return {
      level, step: 0, layer: level.start.layer,
      x: level.start.x, y: level.start.y, px: level.start.x, py: level.start.y, face: 'down',
      got: 0, enemies: level.enemyStarts.map(e => ({x: e.x, y: e.y, px: e.x, py: e.y, moved: -1, frozenUntil: 0}))
        .concat(level.patrols.map((p, n) => { const c = p.cells[p.start % p.cells.length]; return {x: c.x, y: c.y, px: c.x, py: c.y, moved: -1, frozenUntil: 0, pt: n, pi: p.start % p.cells.length, ev: p.every}; })),
      lastShift: -SHIFT_COOLDOWN, shifts: 0, status: 'play', cause: '', events: [], safeUntil: 0, reticle: false,
      toolReady: {}, hazardOff: {beam: 0, plasma: 0}, used: null,
    };
  }

  function walkable(level, layer, x, y) {
    return x >= 0 && y >= 0 && x < W && y < H && level.walk[layer][idx(x, y)] === 1;
  }

  function robotAt(level, step, n) {
    const path = level.robots[n];
    return path[step % path.length];
  }

  // Where the previous shift wants to go: the night tile under the player, wherever the player is.
  function enemyStep(level, e, tx, ty, blocked) {
    const field = level.dist[idx(tx, ty)];
    const here = field[idx(e.x, e.y)];
    let best = null, bestScore = Infinity;
    for (const k of ORDER) {
      const nx = e.x + DIRS[k][0], ny = e.y + DIRS[k][1];
      if (!walkable(level, NIGHT, nx, ny) || blocked(nx, ny)) continue;
      const d = field[idx(nx, ny)];
      // Reachable target: follow the shortest path. Unreachable: creep as close as the walls allow.
      const score = here >= 0
        ? (d >= 0 && d < here ? d : Infinity)
        : (Math.abs(nx - tx) + Math.abs(ny - ty) < Math.abs(e.x - tx) + Math.abs(e.y - ty) ? Math.abs(nx - tx) + Math.abs(ny - ty) : Infinity);
      if (score < bestScore) { bestScore = score; best = [nx, ny]; }
    }
    return best;
  }

  function hazardStopped(state, kind) { return !!state.hazardOff && state.step < state.hazardOff[kind]; }
  function frozen(state, e) { return state.step < (e.frozenUntil || 0); }

  function bellIn(state) {
    const b = state.level.bell;
    return b ? b - ((state.step - (state.bellFrom || 0)) % b) : Infinity;
  }

  function step(state, action) {
    const L = state.level;
    state.events = [];
    if (state.status !== 'play') return state;
    state.step++;
    state.px = state.x; state.py = state.y;
    for (const e of state.enemies) { e.px = e.x; e.py = e.y; }

    if (DIRS[action]) {
      state.face = action;
      const nx = state.x + DIRS[action][0], ny = state.y + DIRS[action][1];
      if (walkable(L, state.layer, nx, ny)) { state.x = nx; state.y = ny; state.events.push('move'); }
      else {
        state.events.push('bump');
        const n = nx >= 0 && ny >= 0 && nx < W && ny < H ? L.blockAt[state.layer][idx(nx, ny)] : -1;
        // The solver proves every hour without this help, so it can only make things easier.
        if (n >= 0 && !state.noAids) {
          const b = L.blocks[state.layer][n], key = `${state.layer}:${b.x0},${b.y0}`;
          if (state.step < (state.toolReady[key] || 0)) state.events.push('tool-wait');
          else {
            const use = toolUse(L, b);
            state.toolReady = {...state.toolReady, [key]: state.step + RECHARGE};
            state.used = {layer: state.layer, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, step: state.step, stops: use.stops};
            state.events.push('flash');
            for (const e of state.enemies) if (Math.max(Math.abs(e.x - state.x), Math.abs(e.y - state.y)) <= FLASH_RADIUS) { e.frozenUntil = state.step + FREEZE; state.events.push('freeze'); }
            if (use.stops === 'plasma') {
              const near = pulsesNear(L, b);
              if (near.length) { state.hazardOff = {...state.hazardOff}; for (const n of near) state.hazardOff['p' + n] = state.step + HAZARD_OFF; state.events.push('emo'); }
            } else if (use.stops) { state.hazardOff = {...state.hazardOff, [use.stops]: state.step + HAZARD_OFF}; state.events.push('emo'); }
          }
        }
      }
    } else if (action === 'shift') {
      const other = 1 - state.layer;
      if (state.step - state.lastShift < SHIFT_COOLDOWN) state.events.push('cooldown');
      else if (!walkable(L, other, state.x, state.y)) state.events.push('blocked');
      else { state.layer = other; state.lastShift = state.step; state.shifts++; state.events.push('shift'); }
    }

    if (L.bell) {
      // bellFrom: after a resume the bell starts a full interval again (0 for a fresh hour and the solver).
      const bs = state.step - (state.bellFrom || 0), left = L.bell - (bs % L.bell);
      const warn = bellWarning(L.bell, L.easy);
      if (left === warn || left === Math.floor(warn / 2)) state.events.push('bell-warning');
      if (bs % L.bell === 0) {
        const other = 1 - state.layer;
        state.events.push('bell');
        // The first strike of an hour with a trial bell shows what the bell does, but cannot wall you in.
        const trial = L.bellTrial && bs === L.bell;
        if (trial) state.events.push('bell-trial');
        // Whoever shifts on the strike itself goes over with the bell, not back with it.
        if (action === 'shift' && state.lastShift === state.step) { /* already over */ }
        else if (!walkable(L, other, state.x, state.y)) {
          if (state.step >= state.safeUntil && !trial) return lose(state, 'crushed');
        } else { state.layer = other; state.lastShift = state.step; state.events.push('shift'); }
      }
    }

    const rt = L.reticle;
    if (rt && !state.reticle && rt.layer === state.layer && rt.x === state.x && rt.y === state.y) { state.reticle = true; state.events.push('reticle'); }
    const nt = L.note;
    if (nt && nt.layer === state.layer && nt.x === state.x && nt.y === state.y) state.events.push('note');
    const st = L.stations[state.got];
    if (st && st.layer === state.layer && st.x === state.x && st.y === state.y) {
      state.got++; state.events.push('station');
    }

    const safe = state.step < state.safeUntil;
    if (state.layer === DAY && !safe) {
      for (let n = 0; n < L.robots.length; n++) {
        const r = robotAt(L, state.step, n), prev = robotAt(L, state.step - 1, n);
        const hit = r.x === state.x && r.y === state.y;
        const crossed = prev.x === state.x && prev.y === state.y && r.x === state.px && r.y === state.py;
        if (hit || crossed) return lose(state, 'robot');
      }
      if (!hazardStopped(state, 'beam')) for (const b of L.beams) {
        if (b.phases[beamPhase(b, state.step)].cells[idx(state.x, state.y)]) return lose(state, 'beam');
      }
    }
    const hz = safe ? null : timedHazard(L, state.layer, state.step, state.x, state.y, n => pulseStopped(state, n), state.bellFrom || 0);
    if (hz) return lose(state, hz);
    L.pulses.forEach((p, n) => {
      if (pulseStopped(state, n)) return;
      const ph = state.step - (p.sync ? state.bellFrom || 0 : 0);
      if (p.quietFirst && ph + PULSE_WARN < p.period + p.on[0] && ph < p.period) return;
      if (((ph + PULSE_WARN) % p.period + p.period) % p.period === p.on[0]) state.events.push('pulse-warning');
      if ((ph % p.period + p.period) % p.period === p.on[0]) state.events.push('pulse');
    });
    if (L.heat && L.heat.sources.some(([, , off = 0]) => (state.step - off) % L.heat.period === L.heat.open[0])) state.events.push('furnace-open');
    for (const b of L.beams) {
      const before = beamPhase(b, state.step - 1), now = beamPhase(b, state.step);
      if (before !== now) state.events.push('beam-switch');
      if ((state.step + 6) % b.every === 0) state.events.push('beam-warning');
    }

    // On their rounds the previous shift keeps its rhythm: awake in their own shift, slow while you are in yours.
    // Set by light, they stop. Pass one of them closely in their shift and they leave the round to follow you.
    for (const e of state.enemies) {
      if (e.pt === undefined || frozen(state, e)) continue;
      // They notice you only once the ring is gone: a quick pass right after a shift goes unseen, lingering does not.
      // Noticing startles them for a step: they neither move nor catch you in it, you have a moment to react.
      const way = L.dist[idx(state.x, state.y)][idx(e.x, e.y)];
      // Not on the step that reaches a station: its window opens, and nobody notices you while it is open.
      if (state.layer === NIGHT && !safe && sinceRing(state) >= L.grace && way >= 0 && way <= L.alertRadius && !state.events.includes('station')) {
        if (!(state.step < (e.alert || 0))) { state.events.push('alert'); e.startled = state.step; }
        e.alert = state.step + ALERT_STEPS;
      }
      if (e.startled === state.step) continue;
      const chasing = state.step < (e.alert || 0);
      // Following you they go at most half your pace, however fast their round is.
      if (state.step % ((chasing ? Math.max(e.ev, 2) : e.ev) * (state.layer === DAY ? 2 : 1)) !== 0) continue;
      const cells = L.patrols[e.pt].cells, home = cells[e.pi];
      if (chasing) {
        const next = enemyStep(L, e, state.x, state.y, (x, y) => state.enemies.some(o => o !== e && o.x === x && o.y === y));
        if (next) { e.x = next[0]; e.y = next[1]; e.off = true; e.moved = state.step; state.events.push('enemy-step'); }
      } else if (e.off) {
        const next = enemyStep(L, e, home.x, home.y, () => false);
        if (next) { e.x = next[0]; e.y = next[1]; e.moved = state.step; state.events.push('enemy-step'); }
        if ((e.x === home.x && e.y === home.y) || !next) { e.x = home.x; e.y = home.y; e.off = false; }
      } else {
        e.pi = (e.pi + 1) % cells.length; e.x = cells[e.pi].x; e.y = cells[e.pi].y; e.moved = state.step; state.events.push('enemy-step');
      }
    }
    // Chasers creep towards you, at half speed while you are in your own shift.
    if (state.step % (L.enemyEvery * (state.layer === DAY ? 2 : 1)) === 0) {
      for (const e of state.enemies) {
        if (e.pt !== undefined || frozen(state, e)) continue;
        const occupied = (x, y) => state.enemies.some(o => o !== e && o.x === x && o.y === y);
        const next = enemyStep(L, e, state.x, state.y, occupied);
        if (next) { e.x = next[0]; e.y = next[1]; e.moved = state.step; state.events.push('enemy-step'); }
      }
    }

    // Grace after a shift into the night: time to shift back after a misjudgement. In it they cannot catch
    // you, but whoever walks into one of them yourself is caught all the same: you cannot pass through them.
    if (state.layer === NIGHT && !safe) {
      const grace = sinceRing(state) < L.grace, walked = state.x !== state.px || state.y !== state.py;
      for (const e of state.enemies) {
        if (frozen(state, e) || e.startled === state.step) continue;
        const onPlayer = e.x === state.x && e.y === state.y;
        const crossed = e.px === state.x && e.py === state.y && e.x === state.px && e.y === state.py;
        if ((onPlayer || crossed) && (!grace || walked)) return lose(state, state.step < (e.alert || 0) ? 'noticed' : 'caught');
      }
    }

    if (state.got === L.stations.length && L.exits.some(x => x.layer === state.layer && x.x === state.x && x.y === state.y)) {
      state.status = 'won'; state.events.push('won');
    }
    return state;
  }

  function lose(state, cause) {
    state.status = 'lost'; state.cause = cause; state.events.push('lost');
    return state;
  }

  function clone(state) {
    return {...state, enemies: state.enemies.map(e => ({...e})), toolReady: {...state.toolReady}, hazardOff: {...state.hazardOff}, events: []};
  }

  // Night-layer path distance from the nearest enemy to the player's tile, for heartbeat and danger cues.
  function nearestEnemy(state) {
    const field = state.level.dist[idx(state.x, state.y)];
    let best = Infinity;
    for (const e of state.enemies) {
      const d = field[idx(e.x, e.y)];
      const m = d >= 0 ? d : Math.abs(e.x - state.x) + Math.abs(e.y - state.y) + 6;
      if (m < best) best = m;
    }
    return best;
  }

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  // Breadth-first search over complete game states; returns the shortest action list that wins, or null.
  // noShift: SHIFT is never pressed (the bell may still shift). reticle: the hour only counts with the reticle.
  // unseen (default): the proof never lets shift B notice the player, so it stays small; a chase is the player's risk.
  function solve(level, {maxStates = 4e6, noShift = false, reticle = false, unseen = true} = {}) {
    const period = [level.enemyEvery * 2, level.bell || 1, ...level.robots.map(r => r.length), ...level.beams.map(b => b.every * b.species.length),
      level.heat ? level.heat.period : 1, ...level.pulses.map(p => p.period), ...level.patrols.map(p => p.every * 2)]
      .reduce((a, b) => a / gcd(a, b) * b, 1);
    const key = s => `${s.x},${s.y},${s.layer},${s.got},${s.reticle ? 1 : 0},${s.step % period},${Math.min(s.step - s.lastShift, Math.max(SHIFT_COOLDOWN, level.grace))},` +
      s.enemies.map(e => e.pt === undefined ? e.x + ':' + e.y
        : 'p' + e.pi + (e.off || s.step < (e.alert || 0) ? `@${e.x}:${e.y}:${Math.max(0, (e.alert || 0) - s.step)}` : '')).join(';');
    const actions = noShift ? ACTIONS.filter(a => a !== 'shift') : ACTIONS;
    // Proven without the help of the tools: their light and their emergency stops only make an hour easier.
    const start = {...newState(level), noAids: true};
    const seen = new Map([[key(start), null]]);
    let frontier = [{s: start, path: null}];
    while (frontier.length) {
      const next = [];
      for (const {s, path} of frontier) {
        for (const a of actions) {
          const t = step(clone(s), a);
          if (t.status === 'lost' || (unseen && t.events.includes('alert'))) continue;
          const p = {a, prev: path};
          if (t.status === 'won' && (!reticle || t.reticle)) {
            const out = [];
            for (let q = p; q; q = q.prev) out.push(q.a);
            return out.reverse();
          }
          if (t.status === 'won') continue;
          const k = key(t);
          if (seen.has(k)) continue;
          seen.set(k, null);
          if (seen.size > maxStates) throw new Error(`Level ${level.id}: solver gave up after ${maxStates} states`);
          next.push({s: t, path: p});
        }
      }
      frontier = next;
    }
    return null;
  }

  return {W, H, DAY, NIGHT, ACTIONS, DIRS, SHIFT_COOLDOWN, GRACE, FLASH_RADIUS, FREEZE, HAZARD_OFF, RECHARGE, BELL_WARNING, bellWarning, PULSE_WARN, ALERT_RADIUS, ALERT_STEPS, SPECIES,
    parseLevel, newState, step, clone, toolUse, hazardStopped, frozen, walkable, robotAt, beamPhase, pulseOn, sinceRing, timedHazard, pulsesNear, pulseStopped, bellIn, nearestEnemy, solve, idx};
});
