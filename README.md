# Schichtwechsel · Turno di notte

A dark night-shift game for **GitHub Game Off 2026**, theme **SHIFT**.

The late shift at Vogt Microelettronica, a chip fab near Luino on Lago Maggiore, never clocked in. You take over Bay 7 until the morning shift. The fab exists twice: the **day shift**, cold, bright and safe, and the **night shift**, the same rooms in the yellow light of lithography, decayed, where the previous shift is still at work.

Press **SHIFT** to change between them.

- By day you are safe, but walls block your way. You see the shadows of the previous shift, and they keep moving. They gather right beneath you.
- By night you pass where walls stand by day. You only see what your helmet lamp shows.
- Take lot 4471 through the process steps in the right order, then reach the airlock.

Every hour of the night is built on real semiconductor physics:

| Hour | Mechanic | Physics |
| --- | --- | --- |
| 22:00 Handover | changing shifts | cleanroom particle limits (ISO class 3) |
| 23:00 Yellow Light | the previous shift follows you | photon energy E = hc/λ: why litho rooms are yellow |
| 00:00 Lot 4471 | coat, expose, develop in order | resolution ≈ k₁ · λ / NA of 193 nm immersion lithography |
| 01:00 Campanile | the bell forces the shift | thermal oxidation (Deal-Grove) |
| 02:00 Implanter | an ion beam sweeps the room | Lorentz force: r = √(2mE)/(qB) for B, P and As ions |

The implanter beam is traced with the real formula: at 40 keV and 0.25 T, boron flies on a 0.38 m circle, phosphorus on 0.64 m and arsenic on 1.00 m.

## Play

Open `index.html` through any local web server, for example:

```sh
python3 -m http.server 8770
```

Then open <http://127.0.0.1:8770/>.

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

## License

Code, levels and texts: MIT, see `LICENSE`.

Fonts in `assets/fonts/` keep their own SIL Open Font License: Pixelify Sans, Silkscreen, IBM Plex Sans.

The radio waltz is an original melody.
