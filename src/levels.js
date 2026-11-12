/* Schichtwechsel - levels and texts. Each level adds one layer to lot 4471, in the order of a real
 * front-end process flow, during one night at Vogt Microelettronica, Stabilimento di Luino, on Lago Maggiore.
 * Both maps are 20 x 10: "day" is your shift, "night" is the shift before.
 * Legend: # wall, M machine, = window to the lake, o hole, . floor, P start, X airlock,
 * 1-8 process stations in order (in the map where they are drawn), V previous shift (night map only).
 * route: names of the process stations. fact: the physics behind the layer.
 * beams: implanter beams (your shift), bent by a magnet: r = sqrt(2 m E) / (q B).
 * heat: furnace mouths that open in turns; the floor heat follows the heat equation.
 * pulses: plasma that fires in a fixed rhythm inside a rectangle of one map.
 * pa: announcements over the loudspeakers (from step "at", Italian with translation). note: a note from shift B,
 * read by standing on it (in the shift before unless layer: "day"). scare: one harmless scare per hour. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SchichtLevels = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LEVELS = [
    {
      id: 'si', reticle: [5, 8], time: '22:00',
      layer: {de: 'Silizium', en: 'Silicon'}, stack: {de: 'Wafer · 775 µm', en: 'Wafer · 775 µm'},
      title: {de: 'Übergabe', en: 'Handover'},
      log: {
        de: ['Turno B hat nicht ausgestempelt:', 'Rossi, Colombo, Ferrari.', 'Ihr Los 4471: HOT LOT, fällig um 06:00.', 'Acht Schichten bis zum Morgen.'],
        en: ['Shift B never clocked out:', 'Rossi, Colombo, Ferrari.', 'Their lot 4471: HOT LOT, due at 06:00.', 'Eight layers until morning.'],
      },
      fact: {
        de: ['Chip-Silizium ist zu 99,9999999 % rein. Vor dem ersten Schritt die', 'RCA-Reinigung: SC-1 löst Partikel, SC-2 Metalle, HF das native Oxid.', 'Danach zählt ein Laser, was übrig ist. Ein Staubkorn ist hier ein Fels.'],
        en: ['Chip silicon is 99.9999999 % pure. Before the first step comes the', 'RCA clean: SC-1 lifts particles, SC-2 metals, HF the native oxide.', 'Then a laser counts what is left. Down here a speck of dust is a rock.'],
      },
      hint: {de: 'SHIFT wechselt die Schicht', en: 'SHIFT changes the shift'},
      route: [{de: 'Reinigen', en: 'Clean', proc: 'clean'}, {de: 'Prüfen', en: 'Inspect', proc: 'inspect'}],
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 3, it: 'Attenzione. Turno B, presentarsi in Bay 7.', de: 'Achtung. Schicht B, bitte in Bay 7 melden.', en: 'Attention. Shift B, please report to Bay 7.'},
      ],
      note: {x: 11, y: 4, by: 'Rossi', text: {
        de: ['21:31. Los 4471 vom Stocker geholt.', 'Der Scanner summt, obwohl er im Leerlauf ist.', 'Colombo sagt, das ist normal.', 'Ist es nicht.'],
        en: ['21:31. Took lot 4471 from the stocker.', 'The scanner hums, though it is idle.', 'Colombo says that is normal.', 'It is not.'],
      }},
      scare: {type: 'phone', at: 12, x: 4, y: 0},
      tools: [
        {x0: 6, y0: 1, type: 'stocker'},
        {x0: 3, y0: 5, type: 'wetbench', name: 'PURA W-6', baths: ['SC-1', 'QDR', 'SC-2', 'QDR', 'HF', 'DRY']},
        {x0: 13, y0: 2, type: 'metrology', name: 'ORSA SP-3', screen: 'particles'},
        {x0: 12, y0: 7, type: 'stocker'},
      ],
      lamps: [[4, 3], [8, 7], [1, 6]],
      day: [
        '####################',
        '#.....MMM.#........#',
        '#.P...MMM.#..MMMM..#',
        '#.........#..MMMM..#',
        '#.........#...2....#',
        '#..MMMMM..#........#',
        '#..MMMMM..#.....X..#',
        '#....1....#.MM.....#',
        '#==.......#.MM.....#',
        '####################',
      ],
      night: [
        '####################',
        '#..o..MMM.#oooooooo#',
        '#.....MMM.#oooooooo#',
        '#........o#oooooooo#',
        '#............oooooo#',
        '#..MMMMM..#oooooooo#',
        '#..MMMMM..#oooooooo#',
        '#.o.......#oooooooo#',
        '#==.......#oooooooo#',
        '####################',
      ],
    },
    {
      id: 'ox', reticle: [13, 7], time: '23:00',
      layer: {de: 'Oxid', en: 'Oxide'}, stack: {de: 'SiO₂ 50 nm · Si₃N₄ 100 nm', en: 'SiO₂ 50 nm · Si₃N₄ 100 nm'},
      title: {de: 'Schatten', en: 'Shadows'},
      log: {
        de: ['In der Vorschicht steht jemand.', 'Laut Stempeluhr ist Turno B noch im Werk.'],
        en: ['Someone is standing in the shift before.', 'By the time clock, shift B is still inside.'],
      },
      fact: {
        de: ['Thermisches Oxid: Bei 1000 °C wächst SiO₂ in trockenem O₂ nur einige', 'zehn nm pro Stunde, je dicker, desto langsamer (Deal-Grove). Darauf', 'scheidet der LPCVD-Ofen bei 780 °C Siliziumnitrid ab: Si₃N₄, 100 nm.'],
        en: ['Thermal oxide: at 1000 °C, SiO₂ grows in dry O₂ by only a few tens', 'of nm per hour, slower the thicker it gets (Deal-Grove). On top, the', 'LPCVD furnace deposits silicon nitride at 780 °C: Si₃N₄, 100 nm.'],
      },
      hint: {de: 'Lauf gegen eine Anlage: Ihr Licht lässt sie erstarren', en: 'Walk into a tool: its light makes them freeze'},
      route: [{de: 'Oxidieren', en: 'Oxidise', proc: 'oxidize'}, {de: 'Nitrid abscheiden', en: 'Deposit nitride', proc: 'nitride'}, {de: 'Schicht messen', en: 'Measure films', proc: 'ellipso'}],
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 5, it: 'Lotto 4471 in ritardo. Consegna alle sei.', de: 'Los 4471 im Verzug. Liefertermin sechs Uhr.', en: 'Lot 4471 behind schedule. Due at six.'},
      ],
      note: {x: 10, y: 8, by: 'Colombo', text: {
        de: ['Die Öfen stehen auf 1000 °C.', 'Es läuft kein Rezept.', 'Ich hab es ins Schichtbuch geschrieben.', 'Danach war die Seite leer.'],
        en: ['The furnaces sit at 1000 °C.', 'No recipe is running.', 'I wrote it in the shift log.', 'Afterwards the page was blank.'],
      }},
      scare: {type: 'window'},
      enemyEvery: 6,
      tools: [
        {x0: 3, y0: 1, type: 'furnace', n: 3, name: 'FORNO V-3', temps: ['1000°C', '1000°C', '780°C']},
        {x0: 11, y0: 1, type: 'wetbench', name: 'PURA W-6', baths: ['SPM', 'SC-1', 'SC-2', 'HF', 'DRY']},
        {x0: 16, y0: 4, type: 'metrology', name: 'ORSA EL-4', screen: 'thickness'},
        {x0: 1, y0: 5, type: 'gascab', gas: 'DCS'},
      ],
      lamps: [[5, 3], [2, 7], [11, 7]],
      // The previous shift walks its round along the only way through the wall.
      patrols: [{path: [[4, 8], [13, 8]], every: 2}],
      day: [
        '####################',
        '#P.MMMMMM#.MMMMM...#',
        '#..MMMMMM#.MMMMM...#',
        '#...1....#.........#',
        '#........#......MM.#',
        '#M.......#......MM.#',
        '#M.......#.......3.#',
        '#........#......X..#',
        '#........#......===#',
        '####################',
      ],
      night: [
        '####################',
        '#..MMMMMM#ooooooooo#',
        '#..MMMMMM#ooooooooo#',
        '#.......2#ooooooooo#',
        '#..o.....#ooooooooo#',
        '#M.....o.#ooooooooo#',
        '#M.......#.....oooo#',
        '#....o...#.....oooo#',
        '#.............o.===#',
        '####################',
      ],
    },
    {
      id: 'pr', reticle: [2, 8], time: '00:00',
      layer: {de: 'Fotolack', en: 'Photoresist'}, stack: {de: 'Fotolack · 100 nm', en: 'Resist · 100 nm'},
      title: {de: 'Gelblicht', en: 'Yellow Light'},
      log: {
        de: ['Gelblicht. Am Scanner liegen drei Paar Handschuhe.', 'Er zeigt FEHLER, seit 21:40.'],
        en: ['Yellow light. Three pairs of gloves lie by the scanner.', 'It has shown FAULT since 21:40.'],
      },
      fact: {
        de: ['Fotolack reagiert auf kurzwelliges Licht. Ein Photon', 'gelben Lichts (580 nm) trägt nur E = hc/λ ≈ 2,1 eV.', 'Zu wenig zum Belichten. Darum ist die Vorschicht gelb.'],
        en: ['Photoresist reacts to short wavelengths. A photon of', 'yellow light (580 nm) carries only E = hc/λ ≈ 2.1 eV.', 'Too little to expose it. That is why the shift before is yellow.'],
      },
      hint: {de: 'Die Schritte in Reihenfolge, dann zur Schleuse', en: 'The steps in order, then to the airlock'},
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 4, it: 'Litografia: luce gialla. Non aprire le porte.', de: 'Lithografie: Gelblicht. Türen nicht öffnen.', en: 'Lithography: yellow light. Do not open the doors.'},
        {at: 60, it: 'Q-time del lotto 4471: scade alle due.', de: 'Q-Zeit von Los 4471: läuft um zwei ab.', en: 'Q-time of lot 4471: runs out at two.'},
      ],
      note: {x: 9, y: 5, by: 'Ferrari', text: {
        de: ['Gelblicht an. Auf dem Boden liegen Schatten.', 'Außer uns ist niemand hier.', 'Wir zählen sie: einer, zwei, drei.', 'Vier.'],
        en: ['Yellow light on. There are shadows on the floor.', 'Nobody is here but us.', 'We count them: one, two, three.', 'Four.'],
      }},
      scare: {type: 'blackout', at: 14, layer: 'night'},
      // The litho bay works under yellow light, also in your shift: no short waves to expose the resist.
      yellowLight: true,
      route: [{de: 'Belacken', en: 'Coat', proc: 'coat'}, {de: 'Belichten', en: 'Expose', proc: 'expose'}, {de: 'Entwickeln', en: 'Develop', proc: 'develop'}, {de: 'Linien messen', en: 'Measure lines', proc: 'measure'}],
      enemyEvery: 6,
      tools: [
        {x0: 2, y0: 2, type: 'track', name: 'KENSEI CT-7'},
        {x0: 10, y0: 2, type: 'scanner', name: 'LUMENA S193i'},
        {x0: 15, y0: 3, type: 'metrology', name: 'ORSA CD-9', screen: 'lines'},
        {x0: 15, y0: 7, type: 'stocker'},
      ],
      lamps: [[4, 5], [11, 5], [16, 2], [10, 7]],
      patrols: [{path: [[2, 5], [16, 5]], every: 2}, {path: [[1, 8], [7, 8]], every: 2}],
      day: [
        '####################',
        '#P......#.........X#',
        '#.MMMMM.#.MMMM.....#',
        '#.MMMMM.#.MMMM.MM..#',
        '#..1.3..#.MMMM.MM..#',
        '#.......#......4...#',
        '###.#####...###.####',
        '#.......#...#..MM..#',
        '#.......#...#..MM..#',
        '####################',
      ],
      night: [
        '####################',
        '#......o#oooooooooo#',
        '#.MMMMM.#oMMMMooooo#',
        '#.MMMMM.#.MMMM.ooo.#',
        '#..o....#.MMMM...o.#',
        '#............2.....#',
        '###.#####...###.####',
        '#.......#...#..MM..#',
        '#.......#...#..MM..#',
        '####################',
      ],
    },
    {
      id: 'st', reticle: [9, 7], time: '01:00',
      layer: {de: 'Struktur', en: 'Pattern'}, stack: {de: 'Linien · 40 nm', en: 'Lines · 40 nm'},
      title: {de: 'Campanile', en: 'Campanile'},
      log: {
        de: ['Drüben in Luino schlägt der Campanile.', 'Bei jedem Schlag wechselt die Schicht.', 'Wer dann in der Wand steht, bleibt drin.'],
        en: ['Across the water, the campanile of Luino strikes.', 'With every strike the shift changes.', 'Whoever stands inside a wall then, stays there.'],
      },
      fact: {
        de: ['Der Scanner belichtet mit 193 nm, unter Wasser (n ≈ 1,44).', 'Kleinster Halbpitch ≈ k₁ · λ / NA = 0,28 · 193 nm / 1,35 ≈ 40 nm.', 'Das Ätzen überträgt das Muster dann in Nitrid und Oxid.'],
        en: ['The scanner exposes at 193 nm, through water (n ≈ 1.44).', 'Smallest half-pitch ≈ k₁ · λ / NA = 0.28 · 193 nm / 1.35 ≈ 40 nm.', 'Etching then transfers the pattern into nitride and oxide.'],
      },
      hint: {de: 'Die Glocke wechselt für dich. Steh auf festem Boden', en: 'The bell shifts for you. Stand on solid ground'},
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 6, it: 'Si ricorda: il turno di notte finisce alle sei.', de: 'Zur Erinnerung: Die Nachtschicht endet um sechs.', en: 'A reminder: the night shift ends at six.'},
      ],
      note: {x: 15, y: 3, by: 'Rossi', text: {
        de: ['Der Campanile hat geschlagen,', 'und ich stand woanders. Gleiche Bay, andere Schicht.', 'Colombo stand direkt neben mir.', 'Er hat mich nicht gehört.'],
        en: ['The campanile struck,', 'and I stood somewhere else. Same bay, other shift.', 'Colombo stood right next to me.', 'He did not hear me.'],
      }},
      scare: {type: 'shadow', at: 10, n: 1},
      route: [{de: 'Ätzen', en: 'Etch', proc: 'etch'}, {de: 'Lack entfernen', en: 'Strip resist', proc: 'strip'}],
      enemyEvery: 6,
      bell: 30,
      tools: [
        {x0: 6, y0: 1, type: 'cluster', kind: 'etch', name: 'VALENTA C-5', chambers: 5},
        {x0: 15, y0: 1, type: 'wetbench', name: 'PURA W-6', baths: ['SPM', 'SPM', 'QDR', 'DRY']},
        {x0: 16, y0: 6, type: 'chamber', kind: 'asher', name: 'VALENTA A-2'},
        {x0: 6, y0: 7, type: 'gascab', gas: 'C4F8'},
        {x0: 12, y0: 7, type: 'gascab', gas: 'CF4'},
      ],
      lamps: [[9, 6], [2, 2], [17, 5]],
      patrols: [{path: [[7, 6], [11, 6], [11, 8], [7, 8]], every: 2}],
      day: [
        '####################',
        '#P..#.MMMMMMM.#MMMM#',
        '#...#.MMMMMMM.#MMMM#',
        '#...#.MMMMMMM.#....#',
        '#...#.MMMMMMM.#...X#',
        '#...#....1....#....#',
        '#.............#.MM.#',
        '#...#.M.....M.#.MM.#',
        '#...#.M.....M.#====#',
        '####################',
      ],
      night: [
        '####################',
        '#...#.MMMMMMM.#oooo#',
        '#...#.MMMMMMM.#oooo#',
        '#...#.MMMMMMM......#',
        '#...#.MMMMMMM.#oo.o#',
        '#..o#oooo.oooo#....#',
        '#...#.........#o2.o#',
        '#...#.M.....M.#.oo.#',
        '#..o#.M.....M.#====#',
        '####################',
      ],
    },
    {
      id: 'im', reticle: [9, 1], time: '02:00',
      layer: {de: 'Dotierung', en: 'Doping'}, stack: {de: 'Arsen · 2·10¹⁵ cm⁻²', en: 'Arsenic · 2·10¹⁵ cm⁻²'},
      title: {de: 'Implanter', en: 'Implanter'},
      log: {
        de: ['Der Implanter fährt sein Rezept: Bor, Phosphor, Arsen.', 'Er hätte um 22:00 stehen sollen.', 'Q-Zeit überschritten: Los 4471 auf HOLD.', 'Freigegeben von: TURNO B.'],
        en: ['The implanter runs its recipe: boron, phosphorus, arsenic.', 'It should have stopped at 22:00.', 'Q-time exceeded: lot 4471 on HOLD.', 'Released by: TURNO B.'],
      },
      fact: {
        de: ['Im Magnet fliegt jedes Ion auf einem Kreis: r = √(2mE) / (qB).', 'Bei 40 keV und 0,25 T: Bor 0,38 m, Phosphor 0,64 m, Arsen 1,00 m.', 'So trennt die Anlage die Sorten. Der Strahl ist tödlich.'],
        en: ['In the magnet every ion flies on a circle: r = √(2mE) / (qB).', 'At 40 keV and 0.25 T: boron 0.38 m, phosphorus 0.64 m, arsenic 1.00 m.', 'That is how the tool separates them. The beam is deadly.'],
      },
      hint: {de: 'Lies den Strahl. Schwere Ionen fliegen weiter', en: 'Read the beam. Heavy ions fly wider'},
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 3, it: "Attenzione: alta tensione nell'area impianti.", de: 'Achtung: Hochspannung im Implanterbereich.', en: 'Caution: high voltage in the implanter area.'},
      ],
      note: {x: 4, y: 2, by: 'Colombo', text: {
        de: ['Ich habe die acht Retikel versteckt,', 'eins in jeder Schicht, in der Vorschicht.', 'Wer alle findet, macht 4471 fertig.', 'Dann dürfen wir gehen.'],
        en: ['I hid the eight reticles,', 'one in every layer, in the shift before.', 'Whoever finds them all finishes 4471.', 'Then we may leave.'],
      }},
      scare: {type: 'blackout', at: 18, layer: 'day'},
      route: [{de: 'Implantieren', en: 'Implant', proc: 'implant'}],
      enemyEvery: 6,
      beams: [{x: 1, y: 8, dir: 'right', keV: 40, metersPerTile: 0.15, field: {x0: 3, y0: 1, x1: 12, y1: 8, B: 0.25}, species: ['B', 'P', 'As'], every: 24}],
      tools: [
        {x0: 1, y0: 7, type: 'implanter', part: 'source'},
        {x0: 13, y0: 3, type: 'implanter', part: 'end', name: 'AURIGA HC-3'},
        {x0: 14, y0: 7, type: 'metrology', name: 'ORSA TW-2', screen: 'tw'},
      ],
      lamps: [[4, 2], [8, 6], [12, 1]],
      // The station room is walled in by day: in through the shift before. The middle is open only by day,
      // across the beam; the way into the room is a round of the previous shift.
      patrols: [{path: [[4, 3], [5, 3], [5, 5], [4, 5]], every: 2}],
      day: [
        '####################',
        '#.....#....#......X#',
        '#.1...#....#.......#',
        '#.....#....#.MMMMM.#',
        '######.....#.MMMMM.#',
        '#..........#.......#',
        '#..........#.......#',
        '#M.........#..MM...#',
        '#M.........P..MM...#',
        '####################',
      ],
      night: [
        '####################',
        '#.....#......ooooo.#',
        '#.....#......ooooo.#',
        '#ooo..#....#ooooooo#',
        '#ooo...o...#ooooooo#',
        '#oo....o...#ooooooo#',
        '#oo....o...#ooooooo#',
        '#o.....o...#ooooooo#',
        '#......o....ooooooo#',
        '####################',
      ],
    },
    {
      id: 'an', reticle: [17, 6], time: '03:00',
      layer: {de: 'Ausheilen', en: 'Anneal'}, stack: {de: '1000 °C · 30 min · N₂', en: '1000 °C · 30 min · N₂'},
      title: {de: 'Ofenreihe', en: 'Furnace Row'},
      log: {
        de: ['Die Öfen öffnen sich von selbst, einer nach dem anderen.', 'Im Rohr liegen Wafer, die niemand geladen hat.'],
        en: ['The furnaces open by themselves, one after another.', 'Inside the tubes lie wafers nobody loaded.'],
      },
      fact: {
        de: ['Wärme breitet sich nach ∂T/∂t = α·∇²T aus, Dotieratome wandern', 'genauso: Diffusionslänge ≈ 2·√(D·t). Im Rohrofen heilt das Gitter', 'bei 1000 °C in 30 min aus. RTP-Anlagen schaffen es in Sekunden.'],
        en: ['Heat spreads as ∂T/∂t = α·∇²T, and dopant atoms wander the same', 'way: diffusion length ≈ 2·√(D·t). In the tube furnace the lattice', 'heals at 1000 °C in 30 min. RTP tools manage it in seconds.'],
      },
      hint: {de: 'Warte in einer Kühlnische, bis die Hitze zurückweicht', en: 'Wait in a cooled niche until the heat falls back'},
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 4, it: 'Il signor Rossi è atteso in portineria.', de: 'Herr Rossi wird an der Pforte erwartet.', en: 'Signor Rossi is expected at the gate.'},
      ],
      note: {x: 9, y: 3, by: 'Ferrari', text: {
        de: ['03:00. Wir wollten ausstempeln.', 'Die Karte geht durch die Uhr wie durch Luft.', 'Auf dem Display: USCITA NEGATA.', 'Ausgang verweigert.'],
        en: ['03:00. We tried to clock out.', 'The card passes through the clock like air.', 'The display says: USCITA NEGATA.', 'Exit denied.'],
      }},
      scare: {type: 'phone', at: 14, x: 2, y: 0},
      route: [{de: 'Ausheilen', en: 'Anneal', proc: 'anneal'}],
      enemyEvery: 6,
      heat: {
        ambient: 22, source: 1000, threshold: 60, alpha: 0.2, cooling: 0.3, substeps: 2, period: 48, open: [0, 20],
        sources: [[6, 1, 0], [9, 1, 8], [12, 1, 16], [15, 1, 24], [5, 5, 12], [8, 5, 20], [11, 5, 28], [14, 5, 36]],
        // Two cooled niches in the banks, where the heat cannot reach.
        shields: [[7, 1], [13, 5]],
      },
      tools: [
        {x0: 1, y0: 5, type: 'gascab', gas: 'HCl'},
        {x0: 5, y0: 1, type: 'tubes', name: 'FORNO H-12'},
        {x0: 5, y0: 5, type: 'tubes', name: 'FORNO H-12'},
        {x0: 8, y0: 1, type: 'tubes', name: 'FORNO H-12'},
        {x0: 14, y0: 5, type: 'tubes', name: 'FORNO H-12'},
      ],
      lamps: [[2, 4], [10, 7], [17, 6]],
      // No way round at night any more: the furnace corridor is the way, with a round in the middle passage.
      patrols: [{path: [[9, 2], [11, 2], [11, 4], [9, 4]], every: 2}],
      day: [
        '####################',
        '#P..#MM.MMMMMMMM#..#',
        '#...#.....#.....#.1#',
        '#.........#........#',
        '#...#.....#.....#..#',
        '#M..#MMMMMMMM.MM#..#',
        '#M..#...........#..#',
        '#...#...........#..#',
        '#...#...........#.X#',
        '####################',
      ],
      night: [
        '####################',
        '#...#ooooooooooo#..#',
        '#...#oooo...oooo#..#',
        '#...#oooo...oooo#..#',
        '#...#oooo...oooo#..#',
        '#M..#...........#..#',
        '#M..#...........#..#',
        '#...............#..#',
        '#...#...........#..#',
        '####################',
      ],
    },
    {
      id: 'ct', reticle: [13, 1], time: '04:00',
      layer: {de: 'Kontakte', en: 'Contacts'}, stack: {de: 'Kontaktloch · 60 nm', en: 'Contact hole · 60 nm'},
      title: {de: 'Plasma', en: 'Plasma'},
      log: {
        de: ['Im Ätzer leuchtet Plasma.', 'Auf dem Bildschirm: ROSSI_01_final_v2_NICHT_BENUTZEN.'],
        en: ['Plasma glows in the etcher.', 'On the screen: ROSSI_01_final_v2_DO_NOT_USE.'],
      },
      fact: {
        de: ['Der Ätzer zündet Plasma mit 13,56 MHz. Ionen fallen senkrecht', 'durch die Randschicht auf den Wafer. So entstehen gerade,', 'tiefe Kontaktlöcher statt runder Mulden.'],
        en: ['The etcher strikes a plasma at 13.56 MHz. Ions fall straight', 'down through the sheath onto the wafer. That is how straight,', 'deep contact holes form instead of round dents.'],
      },
      hint: {de: 'Das Plasma zündet im Takt', en: 'The plasma fires in rhythm'},
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 4, it: 'Allarme gas rientrato. Ripeto: rientrato.', de: 'Gasalarm aufgehoben. Ich wiederhole: aufgehoben.', en: 'Gas alarm cleared. I repeat: cleared.'},
      ],
      note: {x: 4, y: 6, by: 'Rossi', text: {
        de: ['ROSSI_01_final_v2 ist mein Rezept. NICHT BENUTZEN.', 'Ich habe es nicht gestartet.', 'Ich kann nichts mehr starten.', 'Ich kann nichts mehr anfassen.'],
        en: ['ROSSI_01_final_v2 is my recipe. DO NOT USE.', 'I did not start it.', 'I cannot start anything any more.', 'I cannot touch anything any more.'],
      }},
      scare: {type: 'blackout', at: 22, layer: 'night'},
      route: [{de: 'Oxid abscheiden', en: 'Deposit oxide', proc: 'deposit'}, {de: 'Kontakte belichten', en: 'Expose contacts', proc: 'cexpose'}, {de: 'Kontakte ätzen', en: 'Etch contacts', proc: 'contacts'}],
      enemyEvery: 6,
      // Plasma only where plasma chambers stand: the PECVD chamber on the left and the etcher on the right fire
      // into the corridor in turn, by day. In the shift before the floor under both has caved in, so you pass them
      // in your shift: wait for the gaps, or stop a chamber with its emergency button. The middle is walled by day;
      // there you pass in the shift before, where one of shift B walks its round.
      pulses: [
        {x0: 1, y0: 3, x1: 8, y1: 4, period: 30, on: [0, 13]},
        {x0: 12, y0: 3, x1: 18, y1: 4, period: 30, on: [15, 28]},
      ],
      tools: [
        {x0: 1, y0: 6, type: 'chamber', kind: 'cvd', name: 'VALENTA D-2'},
        {x0: 15, y0: 6, type: 'chamber', kind: 'etch', name: 'VALENTA E-1'},
        {x0: 4, y0: 1, type: 'chamber', kind: 'cvd', name: 'VALENTA D-2'},
        {x0: 10, y0: 1, type: 'scanner', name: 'LUMENA S193i'},
        {x0: 16, y0: 1, type: 'chamber', kind: 'etch', name: 'VALENTA E-1'},
      ],
      lamps: [[2, 3], [9, 7], [16, 6]],
      patrols: [{path: [[6, 3], [13, 3], [13, 4], [6, 4]], every: 2}],
      day: [
        '####################',
        '#P..MM....MM....MM.#',
        '#...MM....MM....MM.#',
        '#........##2.......#',
        '#........##........#',
        '####.#########.#####',
        '#MMM.....#.....MMM.#',
        '#MMM.....#.....MMM.#',
        '#.1......#......3.X#',
        '####################',
      ],
      night: [
        '####################',
        '#...oo....oo....oo.#',
        '#...oo....oo....oo.#',
        '#...oo..........oo.#',
        '#...oo..........oo.#',
        '####.#########.#####',
        '#MMM.....#.........#',
        '#MMM.....#.........#',
        '#........#.........#',
        '####################',
      ],
    },
    {
      id: 'me', reticle: [9, 2], time: '05:00',
      layer: {de: 'Metall', en: 'Metal'}, stack: {de: 'Aluminium · 500 nm', en: 'Aluminium · 500 nm'},
      title: {de: 'Schleuse', en: 'Airlock'},
      log: {
        de: ['Letzter Schritt. Die Glocke schlägt öfter.', 'Sie warten an der Schleuse.'],
        en: ['Last step. The bell strikes more often.', 'They are waiting at the airlock.'],
      },
      fact: {
        de: ['Sputtern: Die Kammer wird auf 10⁻⁸ mbar gepumpt, dann mit Argon', 'auf 10⁻³ mbar gefüllt. Freie Weglänge λ = kT / (√2·π·d²·p) ≈ 7 cm,', 'etwa der Abstand Target–Wafer: Das Aluminium fliegt fast geradeaus.'],
        en: ['Sputtering: the chamber is pumped to 10⁻⁸ mbar, then filled with', 'argon to 10⁻³ mbar. Mean free path λ = kT / (√2·π·d²·p) ≈ 7 cm,', 'about the target-to-wafer gap: the aluminium flies nearly straight.'],
      },
      hint: {de: 'Alles zugleich. Die Glocke schlägt öfter', en: 'Everything at once. The bell strikes more often'},
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 2, it: 'Turno B: Rossi. Colombo. Ferrari.', de: 'Schicht B: Rossi. Colombo. Ferrari.', en: 'Shift B: Rossi. Colombo. Ferrari.'},
        {at: 24, it: '... e tu.', de: '... und du.', en: '... and you.'},
      ],
      note: {x: 5, y: 8, layer: 'day', by: 'Rossi, Colombo, Ferrari', text: {
        de: ['Wenn du das liest, bist du schon lange hier.', 'Mach das Los fertig.', 'Und bleib nicht stehen,', 'wenn die Glocke schlägt.'],
        en: ['If you are reading this, you have been here long.', 'Finish the lot.', 'And do not stand still', 'when the bell strikes.'],
      }},
      scare: {type: 'shadow', afterPa: 1, n: 3},
      route: [{de: 'Sputtern', en: 'Sputter', proc: 'sputter'}, {de: 'Schichtwiderstand', en: 'Sheet resistance', proc: 'rs'}],
      enemyEvery: 6,
      bell: 18,
      pulses: [{x0: 8, y0: 2, x1: 11, y1: 7, period: 30, on: [0, 12]}],
      tools: [
        {x0: 8, y0: 1, type: 'cluster', kind: 'pvd', name: 'VALENTA S-4', chambers: 3},
        {x0: 2, y0: 3, type: 'stocker'},
        {x0: 2, y0: 6, type: 'chamber', kind: 'pvd', name: 'VALENTA S-4'},
        {x0: 15, y0: 3, type: 'metrology', name: 'ORSA EL-4', screen: 'thickness'},
        {x0: 15, y0: 6, type: 'metrology', name: 'ORSA RS-1', screen: 'rs', value: '0.054Ω'},
      ],
      lamps: [[5, 5], [10, 4], [13, 8]],
      day: [
        '####################',
        '#P.....#MMMM#.....X#',
        '#......#MMMM#......#',
        '#.MMM..........MM..#',
        '#.MMM...#..#...MM..#',
        '#.......#..#.......#',
        '#.MMM...#..#...MMM.#',
        '#.MMM..........MMM.#',
        '#..1...#....#...2..#',
        '####################',
      ],
      night: [
        '####################',
        '#..o...#oooo#...o..#',
        '#......#....#......#',
        '#.MMM.....V....MM..#',
        '#.MMM...#..#...MM..#',
        '#o......#..#......o#',
        '#.MMM...#..#...MMM.#',
        '#.MMM..........MMM.#',
        '#......#....#...V..#',
        '####################',
      ],
    },
  ];

  // Before the first hour: from the corridor along the lake, through the gowning room and the air shower into Bay 7.
  // K lockers, B bench, D doors of the air shower, A air shower floor. No shifting here.
  const INTRO = {
    id: 'intro', time: '21:56', intro: true,
    layer: {de: 'Einschleusen', en: 'Gowning'}, stack: {de: '', en: ''},
    title: {de: 'Einschleusen', en: 'Gowning'}, log: {de: [], en: []}, fact: {de: [], en: []}, hint: {de: '', en: ''},
    triggers: [
      {x: 1, y: 7, text: {de: 'Vogt Microelettronica, Luino. 21:56. Du übernimmst Bay 7 von Turno B. Keiner von ihnen hat ausgestempelt.', en: 'Vogt Microelettronica, Luino. 21:56. You take over Bay 7 from shift B. None of them clocked out.'}},
      {x: 2, y: 5, text: {de: 'Umkleide: Overall, Haube, Mundschutz, Brille, Handschuhe, Überschuhe. Ein Mensch verliert Millionen Partikel pro Minute.', en: 'Gowning room: coverall, hood, face mask, goggles, gloves, boot covers. A person sheds millions of particles a minute.'}},
      {x: 6, y: 3, text: {de: 'Luftdusche: Düsen blasen gefilterte Luft mit etwa 25 m/s und lösen die letzten Partikel vom Anzug.', en: 'Air shower: nozzles blow filtered air at about 25 m/s and loosen the last particles from the suit.'}},
      {x: 13, y: 3, text: {de: 'Bay 7. Die Anlagen laufen. Niemand ist hier. Am Übergabewagen steht ein Los.', en: 'Bay 7. The tools are running. Nobody is here. A lot stands on the handover cart.'}},
    ],
    // The handover: lot 4471 on its cart, where shift B left it at 21:40. Read when it is picked up.
    pickup: {
      de: 'Los 4471. Roter Reiter: HOT LOT, Liefertermin 06:00. Laufzettel: zuletzt gebucht 21:40, Turno B. Danach nichts mehr.',
      en: 'Lot 4471. Red tag: HOT LOT, due at 06:00. Traveller: last booked at 21:40 by shift B. Nothing after that.',
    },
    route: [{de: 'Los 4471 abholen', en: 'Pick up lot 4471'}],
    suitAt: 6,
    // In the air shower the picture tears into the shift before for a moment: shift B stands in the cabin with you,
    // one, two, three. Afterwards their handover note lies in front of the door to Bay 7.
    ghosts: [[11, 3], [10, 3], [9, 3]],
    note: {x: 13, y: 3, by: 'Turno B', text: {
      de: ['Übergabe an die Nachtschicht:', 'Los 4471 steht auf dem Wagen in Bay 7.', 'HOT LOT. Bis sechs muss es fertig sein.', 'Wir warten drinnen.'],
      en: ['Handover to the night shift:', 'Lot 4471 is on the cart in Bay 7.', 'HOT LOT. It must be done by six.', 'We are waiting inside.'],
    }},
    lamps: [],
    signs: [
      {x: 3, y: 5, text: 'VESTIZIONE'}, {x: 9, y: 2, text: {de: "DOCCIA D'ARIA", en: "DOCCIA D'ARIA"}, bg: '#2c6fb5', color: '#ffffff'},
      {x: 12, y: 5, text: 'BAY 7', bg: '#2c6fb5', color: '#ffffff'}, {x: 15, y: 5, text: 'ZONA ISO 5'},
    ],
    day: [
      '####################',
      '#KKKKKK#####......X#',
      '#......#####.......#',
      '#.BBBB.DAAAAD......#',
      '#......#####....1..#',
      '##.#################',
      '#..................#',
      '#P.................#',
      '#==================#',
      '####################',
    ],
  };
  INTRO.night = INTRO.day.map(r => r.replace('P', '.').replace('X', '.').replace('1', '.'));

  // The secret finale with all eight reticles: lot 4471 becomes the Odenchip from Elektronenreise.
  const FINALE = {
    caps: {
      expose: {de: 'Acht Retikel, acht Schichten. Los 4471 wird ein letztes Mal belichtet.', en: 'Eight reticles, eight layers. Lot 4471 is exposed one last time.'},
      wafer: {de: 'Auf dem Wafer: Hunderte gleicher Chips.', en: 'On the wafer: hundreds of identical chips.'},
      die: {de: 'Der Odenchip. Zwischen den Bondpads steht etwas in der obersten Metallebene.', en: 'The Odenchip. Between the bond pads, something is written in the top metal.'},
      bond: {de: 'Gesägt, aufgeklebt, gebondet: Golddrähte, dünner als ein Haar.', en: 'Sawn, attached, bonded: gold wires thinner than a hair.'},
      mold: {de: 'Vergossen. Der Laser schreibt den Namen.', en: 'Moulded. The laser writes its name.'},
      board: {de: 'Acht LEDs, eine je Schicht. Wie viele leuchten, entscheidet die Ausbeute.', en: 'Eight LEDs, one per layer. The yield decides how many light up.'},
    },
    log: {
      de: ['06:00. Über dem See wird es hell.', '', 'Schichtbuch, 06:00:', 'Turno B ausgestempelt: Rossi, Colombo, Ferrari.', 'Los 4471 fertig. Odenchip, Revision A.'],
      en: ['06:00. Dawn over the lake.', '', 'Shift log, 06:00:', 'Shift B clocked out: Rossi, Colombo, Ferrari.', 'Lot 4471 finished. Odenchip, revision A.'],
    },
  };

  const ENDING = {
    time: '06:00',
    layer: {de: 'Passivierung', en: 'Passivation'}, stack: {de: '12 nm', en: '12 nm'},
    log: {
      de: ['Über dem See tutet das erste Schiff.', 'Los 4471 steht pünktlich im Stocker.', '', 'Schichtbuch, 06:12:', 'Nachtschicht nicht ausgestempelt.', 'Neue Schicht auf Los 4471: 12 nm.'],
      en: ['Out on the lake, the first ferry sounds its horn.', 'Lot 4471 sits in the stocker, on time.', '', 'Shift log, 06:12:', 'Night shift never clocked out.', 'New layer on lot 4471: 12 nm.'],
    },
  };

  return {LEVELS, ENDING, INTRO, FINALE};
});
