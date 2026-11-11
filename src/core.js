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
  const SHIFT_COOLDOWN = 3, GRACE = SHIFT_COOLDOWN;
  const BELL_WARNING = 24;
  // Tiles: # wall, M machine, = glass, o hole, . floor, P start, X airlock exit,
  // 1-8 process stations (visited in order), V previous shift (night only).
  const SOLID = new Set(['#', 'M', 'o', '=']);

  // Ion species for implanter beams: mass in atomic mass units, charge in elementary charges.
  const AMU = 1.66053907e-27, QE = 1.602176634e-19;
  const SPECIES = {B: {m: 11, q: 1}, P: {m: 31, q: 1}, As: {m: 75, q: 1}, BF2: {m: 49, q: 1}};

  const idx = (x, y) => y * W + x;

  function parseLevel(def) {
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
      enemyEvery: def.enemyEvery || 3,
      bell: def.bell || 0,
      dist: distanceFields(walk[NIGHT]),
    };
    level.beams = (def.beams || []).map(b => ({...b, phases: b.species.map(sp => traceBeam(level, b, sp))}));
    level.heat = def.heat ? simulateHeat(level, def.heat) : null;
    level.pulses = (def.pulses || []).map(p => {
      const cells = new Uint8Array(N);
      for (let y = p.y0; y <= p.y1; y++) for (let x = p.x0; x <= p.x1; x++) cells[idx(x, y)] = 1;
      return {...p, layer: p.layer || DAY, cells};
    });
    return level;
  }

  // Furnace heat on the day floor: explicit finite differences of dT/dt = a * laplace(T) - k (T - T0).
  // Walls insulate. While the furnace door is open its mouth holds the tube temperature.
  // The cycle is periodic, so one recorded period after warm-up describes every step.
  function simulateHeat(level, h) {
    const T = new Float64Array(N).fill(h.ambient), next = new Float64Array(N);
    const conducts = new Uint8Array(N);
    for (let i = 0; i < N; i++) conducts[i] = level.walk[DAY][i];
    for (const [x, y] of h.sources) conducts[idx(x, y)] = 1;
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

  function pulseOn(p, step) {
    const ph = step % p.period;
    return ph >= p.on[0] && ph < p.on[1];
  }

  // Hazards that depend only on time: heat by day, plasma in either shift.
  function timedHazard(level, layer, step, x, y) {
    const i = idx(x, y);
    if (layer === DAY && level.heat && level.heat.hot[step % level.heat.period][i]) return 'heat';
    for (const p of level.pulses) if (p.layer === layer && p.cells[i] && pulseOn(p, step)) return 'plasma';
    return null;
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
      got: 0, enemies: level.enemyStarts.map(e => ({x: e.x, y: e.y, px: e.x, py: e.y, moved: -1})),
      lastShift: -SHIFT_COOLDOWN, shifts: 0, status: 'play', cause: '', events: [], safeUntil: 0,
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

  function bellIn(state) {
    const b = state.level.bell;
    return b ? b - (state.step % b) : Infinity;
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
      else state.events.push('bump');
    } else if (action === 'shift') {
      const other = 1 - state.layer;
      if (state.step - state.lastShift < SHIFT_COOLDOWN) state.events.push('cooldown');
      else if (!walkable(L, other, state.x, state.y)) state.events.push('blocked');
      else { state.layer = other; state.lastShift = state.step; state.shifts++; state.events.push('shift'); }
    }

    if (L.bell) {
      const left = L.bell - (state.step % L.bell);
      if (left === BELL_WARNING || left === BELL_WARNING / 2) state.events.push('bell-warning');
      if (state.step % L.bell === 0) {
        const other = 1 - state.layer;
        state.events.push('bell');
        if (!walkable(L, other, state.x, state.y)) {
          if (state.step >= state.safeUntil) return lose(state, 'crushed');
        } else { state.layer = other; state.lastShift = state.step; state.events.push('shift'); }
      }
    }

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
      for (const b of L.beams) {
        if (b.phases[beamPhase(b, state.step)].cells[idx(state.x, state.y)]) return lose(state, 'beam');
      }
    }
    const hz = safe ? null : timedHazard(L, state.layer, state.step, state.x, state.y);
    if (hz) return lose(state, hz);
    for (const p of L.pulses) {
      if ((state.step + 6) % p.period === p.on[0]) state.events.push('pulse-warning');
      if (state.step % p.period === p.on[0]) state.events.push('pulse');
    }
    if (L.heat && L.heat.sources.some(([, , off = 0]) => (state.step - off) % L.heat.period === L.heat.open[0])) state.events.push('furnace-open');
    for (const b of L.beams) {
      const before = beamPhase(b, state.step - 1), now = beamPhase(b, state.step);
      if (before !== now) state.events.push('beam-switch');
      if ((state.step + 6) % b.every === 0) state.events.push('beam-warning');
    }

    // The previous shift creeps at half speed while you are in your own shift.
    if (state.step % (L.enemyEvery * (state.layer === DAY ? 2 : 1)) === 0) {
      for (const e of state.enemies) {
        const occupied = (x, y) => state.enemies.some(o => o !== e && o.x === x && o.y === y);
        const next = enemyStep(L, e, state.x, state.y, occupied);
        if (next) { e.x = next[0]; e.y = next[1]; e.moved = state.step; state.events.push('enemy-step'); }
      }
    }

    // Grace after a shift into the night: time to shift back after a misjudgement.
    if (state.layer === NIGHT && !safe && state.step - state.lastShift >= GRACE) {
      for (const e of state.enemies) {
        const onPlayer = e.x === state.x && e.y === state.y;
        const crossed = e.px === state.x && e.py === state.y && e.x === state.px && e.y === state.py;
        if (onPlayer || crossed) return lose(state, 'caught');
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
    return {...state, enemies: state.enemies.map(e => ({...e})), events: []};
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
  function solve(level, {maxStates = 4e6} = {}) {
    const period = [level.enemyEvery * 2, level.bell || 1, ...level.robots.map(r => r.length), ...level.beams.map(b => b.every * b.species.length),
      level.heat ? level.heat.period : 1, ...level.pulses.map(p => p.period)]
      .reduce((a, b) => a / gcd(a, b) * b, 1);
    const key = s => `${s.x},${s.y},${s.layer},${s.got},${s.step % period},${Math.min(s.step - s.lastShift, SHIFT_COOLDOWN)},` +
      s.enemies.map(e => e.x + ':' + e.y).join(';');
    const start = newState(level);
    const seen = new Map([[key(start), null]]);
    let frontier = [{s: start, path: null}];
    while (frontier.length) {
      const next = [];
      for (const {s, path} of frontier) {
        for (const a of ACTIONS) {
          const t = step(clone(s), a);
          if (t.status === 'lost') continue;
          const p = {a, prev: path};
          if (t.status === 'won') {
            const out = [];
            for (let q = p; q; q = q.prev) out.push(q.a);
            return out.reverse();
          }
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

  return {W, H, DAY, NIGHT, ACTIONS, DIRS, SHIFT_COOLDOWN, BELL_WARNING, SPECIES, parseLevel, newState, step, clone,
    walkable, robotAt, beamPhase, pulseOn, timedHazard, bellIn, nearestEnemy, solve, idx};
});
