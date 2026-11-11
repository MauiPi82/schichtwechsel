/* Schichtwechsel - levels and texts. Each level is one hour of the night shift at
 * Vogt Microelettronica, Stabilimento di Luino, on Lago Maggiore.
 * Both layers are 20 x 10. Legend: # wall, M machine, = window to the lake, o hole, . floor,
 * P start, X airlock, 1-8 process stations in order (in the layer where they are drawn),
 * V previous shift (night only).
 * route: names of the process stations. fact: real semiconductor physics behind the hour.
 * beams: implanter beams (day only), bent by a magnet: r = sqrt(2 m E) / (q B). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SchichtLevels = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LEVELS = [
    {
      id: '2200', time: '22:00',
      title: {de: 'Übergabe', en: 'Handover'},
      log: {
        de: ['Turno B nicht erschienen: Rossi, Colombo, Ferrari.', 'Anlagen laufen.', 'Übernehmen Sie Bay 7 bis zur Frühschicht.'],
        en: ['Shift B did not show up: Rossi, Colombo, Ferrari.', 'Tools are running.', 'Take over Bay 7 until the morning shift.'],
      },
      fact: {
        de: ['Reinraum ISO-Klasse 3: höchstens 35 Partikel ab 0,5 µm', 'pro Kubikmeter Luft. Ein gehender Mensch verliert', 'Millionen pro Minute. Darum der Anzug.'],
        en: ['Cleanroom ISO class 3: at most 35 particles of 0.5 µm', 'or larger per cubic metre of air. A walking person', 'sheds millions per minute. Hence the suit.'],
      },
      hint: {de: 'SHIFT wechselt die Schicht', en: 'SHIFT changes the shift'},
      day: [
        '####################',
        '#.........#........#',
        '#.P.......#........#',
        '#.........#...MM...#',
        '#.........#...MM...#',
        '#..MM.....#........#',
        '#..MM.....#.....X..#',
        '#.........#........#',
        '#==.......#........#',
        '####################',
      ],
      night: [
        '####################',
        '#..o......#oooooooo#',
        '#.........#oooooooo#',
        '#.....o...#oooooooo#',
        '#............oooooo#',
        '#..MM.....#oooooooo#',
        '#..MM.....#oooooooo#',
        '#.o.......#oooooooo#',
        '#==.......#oooooooo#',
        '####################',
      ],
    },
    {
      id: '2300', time: '23:00',
      title: {de: 'Gelblicht', en: 'Yellow Light'},
      log: {
        de: ['Im Gelblicht steht jemand.', 'Niemand ist eingestempelt.'],
        en: ['Someone is standing in the yellow light.', 'Nobody is clocked in.'],
      },
      fact: {
        de: ['Fotolack reagiert auf kurzwelliges Licht. Ein Photon', 'gelben Lichts (580 nm) trägt nur E = hc/λ ≈ 2,1 eV.', 'Zu wenig zum Belichten. Darum ist die Lithografie gelb.'],
        en: ['Photoresist reacts to short wavelengths. A photon of', 'yellow light (580 nm) carries only E = hc/λ ≈ 2.1 eV.', 'Too little to expose it. That is why litho is yellow.'],
      },
      hint: {de: 'Ihre Schatten folgen dir auch am Tag', en: 'Their shadows follow you, even by day'},
      enemyEvery: 3,
      day: [
        '####################',
        '#P.......#.........#',
        '#........#.........#',
        '#..MM....#....MM...#',
        '#..MM....#....MM...#',
        '#........#.........#',
        '#........#.........#',
        '#........#......X..#',
        '#........#......===#',
        '####################',
      ],
      night: [
        '####################',
        '#........#ooooooooo#',
        '#..o.....#ooooooooo#',
        '#..MM....#ooooooooo#',
        '#..MM..o.#ooooooooo#',
        '#........#ooooooooo#',
        '#........#.....oooo#',
        '#....o...#...V.oooo#',
        '#.............o.===#',
        '####################',
      ],
    },
    {
      id: '0000', time: '00:00',
      title: {de: 'Los 4471', en: 'Lot 4471'},
      log: {
        de: ['Los 4471 steht seit 21:40 vor dem Coater.', 'Bringen Sie es durch die Lithografie.'],
        en: ['Lot 4471 has been waiting at the coater since 21:40.', 'Take it through lithography.'],
      },
      fact: {
        de: ['Der Scanner belichtet mit 193 nm, unter Wasser (n ≈ 1,44).', 'Kleinste Struktur ≈ k₁ · λ / NA = 0,28 · 193 nm / 1,35', '≈ 40 nm. Kleiner geht nur mit mehreren Belichtungen.'],
        en: ['The scanner exposes at 193 nm, through water (n ≈ 1.44).', 'Smallest feature ≈ k₁ · λ / NA = 0.28 · 193 nm / 1.35', '≈ 40 nm. Smaller needs several exposures.'],
      },
      hint: {de: 'Die Schritte in Reihenfolge, dann zur Schleuse', en: 'The steps in order, then to the airlock'},
      route: [{de: 'Belacken', en: 'Coat'}, {de: 'Belichten', en: 'Expose'}, {de: 'Entwickeln', en: 'Develop'}],
      enemyEvery: 3,
      day: [
        '####################',
        '#P.....#.......#..X#',
        '#......#.MM.MM.#...#',
        '#..MM..#.MM.MM.#...#',
        '#..MM..........#...#',
        '########.#######.###',
        '#..1...#.......#...#',
        '#......#..MM...#.3.#',
        '#......#..MM.......#',
        '####################',
      ],
      night: [
        '####################',
        '#......o.......#o..#',
        '#.o....#.MM.MM.#o..#',
        '#..MM..#.MM.MM.#...#',
        '#..MM..#.......#...#',
        '#.##.###.#####.#.#.#',
        '#......#.......#...#',
        '#.....o#..MM.2.#...#',
        '#...o.V...MM..V#...#',
        '####################',
      ],
    },
    {
      id: '0100', time: '01:00',
      title: {de: 'Campanile', en: 'Campanile'},
      log: {
        de: ['Drüben in Luino schlägt der Campanile.', 'Bei jedem Schlag wechselt die Schicht.', 'Wer dann in der Wand steht, bleibt drin.'],
        en: ['Across the water, the campanile of Luino strikes.', 'With every strike the shift changes.', 'Whoever stands inside a wall then, stays there.'],
      },
      fact: {
        de: ['Thermisches Oxid: Bei 1000 °C wächst SiO₂ in trockenem', 'Sauerstoff nur einige zehn Nanometer pro Stunde.', 'Je dicker die Schicht, desto langsamer (Deal-Grove).'],
        en: ['Thermal oxide: at 1000 °C, SiO₂ grows in dry oxygen', 'by only a few tens of nanometres per hour.', 'The thicker it gets, the slower it grows (Deal-Grove).'],
      },
      hint: {de: 'Die Glocke wechselt für dich. Steh auf festem Boden', en: 'The bell shifts for you. Stand on solid ground'},
      route: [{de: 'Reinigen', en: 'Clean'}, {de: 'Oxidieren', en: 'Oxidise'}],
      enemyEvery: 3,
      bell: 40,
      day: [
        '####################',
        '#P..#....M....#....#',
        '#...#.M..M..M.#.MM.#',
        '#...#.M.....M.#.MM.#',
        '#.......MMM.......X#',
        '#...#.M.....M.#....#',
        '#...#.M..M..M.#.MM.#',
        '#.1.#....M....#.MM.#',
        '#...#.........#====#',
        '####################',
      ],
      night: [
        '####################',
        '#..o#oooo.oooo#o..o#',
        '#...#.o..o..o.#...o#',
        '#.....o.....o......#',
        '#...#...ooo...#ooo.#',
        '#...#.o.....o.#....#',
        '#...#.o..o..o.#..2.#',
        '#...#oooo.oooo#o..o#',
        '#..V#.........#====#',
        '####################',
      ],
    },
    {
      id: '0200', time: '02:00',
      title: {de: 'Implanter', en: 'Implanter'},
      log: {
        de: ['Der Implanter fährt sein Rezept: Bor, Phosphor, Arsen.', 'Er hätte um 22:00 stehen sollen.'],
        en: ['The implanter runs its recipe: boron, phosphorus, arsenic.', 'It should have stopped at 22:00.'],
      },
      fact: {
        de: ['Im Magnet fliegt jedes Ion auf einem Kreis: r = √(2mE) / (qB).', 'Bei 40 keV und 0,25 T: Bor 0,38 m, Phosphor 0,64 m, Arsen 1,00 m.', 'So trennt die Anlage die Sorten. Der Strahl ist tödlich.'],
        en: ['In the magnet every ion flies on a circle: r = √(2mE) / (qB).', 'At 40 keV and 0.25 T: boron 0.38 m, phosphorus 0.64 m, arsenic 1.00 m.', 'That is how the tool separates them. The beam is deadly.'],
      },
      hint: {de: 'Lies den Strahl. Schwere Ionen fliegen weiter', en: 'Read the beam. Heavy ions fly wider'},
      route: [{de: 'Implantieren', en: 'Implant'}],
      enemyEvery: 3,
      beams: [{x: 1, y: 8, dir: 'right', keV: 40, metersPerTile: 0.15, field: {x0: 3, y0: 1, x1: 12, y1: 8, B: 0.25}, species: ['B', 'P', 'As'], every: 24}],
      day: [
        '####################',
        '#.....#....#......X#',
        '#.1...#....#.......#',
        '#.....#....#..MM...#',
        '#..........#..MM...#',
        '#..........#.......#',
        '#..........#.......#',
        '#..........#..MM...#',
        '#M.........P..MM...#',
        '####################',
      ],
      night: [
        '####################',
        '#.....#......ooooo.#',
        '#.....#......ooooo.#',
        '#ooo..#....#ooooooo#',
        '#ooo.......#ooooooo#',
        '#oo...V....#ooooooo#',
        '#oo........#ooooooo#',
        '#o.........#ooooooo#',
        '#...........ooooooo#',
        '####################',
      ],
    },
  ];

  const ENDING = {
    time: '06:00',
    log: {
      de: ['Über dem See tutet das erste Schiff.', 'Die Frühschicht kommt.', '', 'Schichtbuch, 06:12:', 'Nachtschicht nicht erschienen.', 'Neue Schicht auf Los 4471: 12 nm.'],
      en: ['Out on the lake, the first ferry sounds its horn.', 'The morning shift arrives.', '', 'Shift log, 06:12:', 'Night shift did not show up.', 'New layer on lot 4471: 12 nm.'],
    },
  };

  return {LEVELS, ENDING};
});
