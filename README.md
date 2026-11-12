# Schichtwechsel · Turno di notte

A dark night-shift game for **GitHub Game Off 2026**, theme **SHIFT**.

The late shift at Vogt Microelettronica, a chip fab near Luino on Lago Maggiore, never clocked in. You take over Bay 7 until the morning shift. The fab exists twice: the **day shift**, cold, bright and safe, and the **night shift**, the same rooms in the yellow light of lithography, decayed, where the previous shift is still at work.

Press **SHIFT** to change between them.

- By day you are safe, but walls block your way. You see the shadows of the previous shift walking their rounds; watch them before you shift. In the last hour they come for you.
- By night you pass where walls stand by day. You only see what your helmet lamp shows.
- Take lot 4471 through the process steps in the right order, then reach the airlock.

Every hour adds one layer to lot 4471, in the order of a real process flow, and is built on real semiconductor physics:

| Hour | Layer | Mechanic | Physics |
| --- | --- | --- | --- |
| 22:00 Handover | Silicon | clean (RCA), inspect for particles | 99.9999999 % purity, SC-1, SC-2 and HF |
| 23:00 Shadows | Oxide and nitride | oxidise, deposit nitride, measure the films | Deal-Grove oxidation, LPCVD Si₃N₄, ellipsometry |
| 00:00 Yellow Light | Photoresist | coat, expose, develop, measure the lines | photon energy E = hc/λ: why litho rooms are yellow; 100 nm resist ∝ 1/√ω |
| 01:00 Campanile | Pattern | the bell forces the shift | resolution ≈ k₁ · λ / NA of 193 nm immersion lithography |
| 02:00 Implanter | Doping | an ion beam sweeps the room | Lorentz force: r = √(2mE)/(qB) for B, P and As ions |
| 03:00 Furnace Row | Anneal | heat spreads from the furnace doors | heat equation, diffusion length ≈ 2√(Dt) |
| 04:00 Plasma | Contacts | plasma fires in rhythm | 13.56 MHz RF plasma, ions falling through the sheath |
| 05:00 Airlock | Metal | everything at once, a faster bell | sputtering in argon at 10⁻³ mbar: mean free path ≈ 7 cm; four-point probe |

Every hour after the first needs SHIFT: a design check (`node tools/analyze.cjs`) asks the solver whether an hour can be done without it, and whether the previous shift and the hazards actually change the best route.

The implanter beam is traced with the real formula: at 40 keV and 0.25 T, boron flies on a 0.38 m circle, phosphorus on 0.64 m and arsenic on 1.00 m. The heat on the floor is solved with finite differences, and every level is proven solvable by a search over all game states.

The tools are drawn after real equipment types under invented maker names: coater/developer track, immersion scanner, etch, CVD and sputter clusters, vertical and horizontal furnaces, implanter source and end station, wet benches, metrology and gas cabinets.

Six process steps are played, not watched: lift the carrier out of the RCA baths in time, switch off the oxygen at 50 nm (minus the nanometre that grows on while the furnace ramps down), spin the resist to 100 nm, focus every field before exposing it, stop the etch a little after the CO line of the plasma drops, and keep the analysing magnet on As⁺ while the field drifts. Nothing can be lost there. The measuring stations judge the results (particles, film thickness, line width) with Perfetto, Bene, Così così or Scarto, and the yield of lot 4471 is the score of the night.

Tools are more than scenery. Stand next to one and the bar at the bottom says what it is. Walk into it and its work light flares: the previous shift became a layer, and like photoresist it reacts to light, so whoever is close freezes for a moment. Plasma chambers and the implanter also go to emergency stop. Every hour is still proven solvable without this help.

The night goes on around you: announcements over the loudspeakers in Italian with subtitles, notes from Rossi, Colombo and Ferrari of shift B, and one scare per hour that never costs a life. Every layer also hides a reticle in the shift before. Find all eight for the other ending.

## Play

Open `index.html` through any local web server, for example:

```sh
python3 -m http.server 8770
```

Then open <http://127.0.0.1:8770/>. Add `?hour=3` (or `?stunde=3`) to start at the third hour.

| Input | Action |
| --- | --- |
| WASD or arrow keys | walk |
| SHIFT or Space | change shift |
| R | restart the hour |
| P or Esc | pause |
| M | sound on or off |
| Touch | pad on screen, SHIFT button |
| Controller | stick or d-pad, A or shoulder buttons shift, Start pauses |

German and English are built in.

## Development

No build step and no dependencies. Plain JavaScript and canvas.

| Path | Content |
| --- | --- |
| `src/core.js` | rules: steps, shifting, the previous shift, bell, beams, solver |
| `src/levels.js` | levels, texts and physics facts |
| `src/game.js` | rendering, procedural audio, input, screens |
| `test/core.test.cjs` | rules, physics and solvability of every level |
| `test/browser-check.cjs` | plays every level in Chromium with Playwright |
| `tools/levels-report.cjs` | prints both layers of each level with the shortest solution |

```sh
npm test
npm run levels
npm run browser-check -- http://127.0.0.1:8770/
```

The solver searches complete game states (player, layer, process step, every member of the previous shift, bell and beam phase), so every level is proven solvable on each test run.

## Credits

Game by Maurizio Odenwaeller, [odenwaeller.org](https://odenwaeller.org/spiele/).

**AI disclosure:** code, level design, texts, pixel art and the procedural sound were created with Claude (Anthropic) through Claude Code, directed by Maurizio Odenwaeller. All graphics and sounds are generated in code; there are no image or audio files.

The radio waltz is an original melody.

## License

Code, levels and texts: MIT, see `LICENSE`.

Fonts in `assets/fonts/` keep their own SIL Open Font License: Pixelify Sans, Silkscreen, IBM Plex Sans.
