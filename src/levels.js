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
        de: ['Turno B nicht erschienen:', 'Rossi, Colombo, Ferrari.', 'Übernehmen Sie Bay 7.'],
        en: ['Shift B did not show up:', 'Rossi, Colombo, Ferrari.', 'Take over Bay 7.'],
      },
      fact: {
        de: ['Chip-Silizium ist zu 99,9999999 % rein: Auf eine Milliarde', 'Siliziumatome kommt höchstens ein fremdes. Darum Reinraum,', 'Anzug und Schleuse. Ein Staubkorn ist hier ein Felsbrocken.'],
        en: ['Chip-grade silicon is 99.9999999 % pure: at most one foreign', 'atom per billion silicon atoms. Hence the cleanroom, the suit', 'and the airlock. Down here, a speck of dust is a boulder.'],
      },
      hint: {de: 'SHIFT wechselt die Schicht', en: 'SHIFT changes the shift'},
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
        {x0: 3, y0: 5, type: 'wetbench', name: 'PURA W-6', baths: ['SPM', 'HF', 'SC-1', 'SC-2', 'DRY']},
        {x0: 13, y0: 2, type: 'metrology', name: 'ORSA SP-3', screen: 'particles'},
        {x0: 12, y0: 7, type: 'stocker'},
      ],
      lamps: [[4, 3], [8, 7], [1, 6]],
      day: [
        '####################',
        '#.....MMM.#........#',
        '#.P...MMM.#..MMMM..#',
        '#.........#..MMMM..#',
        '#.........#........#',
        '#..MMMMM..#........#',
        '#..MMMMM..#.....X..#',
        '#.........#.MM.....#',
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
      id: 'ox', reticle: [1, 8], time: '23:00',
      layer: {de: 'Oxid', en: 'Oxide'}, stack: {de: 'SiO₂ · 50 nm', en: 'SiO₂ · 50 nm'},
      title: {de: 'Schatten', en: 'Shadows'},
      log: {
        de: ['In der Vorschicht steht jemand.', 'Niemand ist eingestempelt.'],
        en: ['Someone is standing in the shift before.', 'Nobody is clocked in.'],
      },
      fact: {
        de: ['Thermisches Oxid: Bei 1000 °C wächst SiO₂ in trockenem', 'Sauerstoff nur einige zehn Nanometer pro Stunde.', 'Je dicker die Schicht, desto langsamer (Deal-Grove).'],
        en: ['Thermal oxide: at 1000 °C, SiO₂ grows in dry oxygen', 'by only a few tens of nanometres per hour.', 'The thicker it gets, the slower it grows (Deal-Grove).'],
      },
      hint: {de: 'Ihre Schatten folgen dir auch in deiner Schicht', en: 'Their shadows follow you, even in your shift'},
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 5, it: 'Il lotto 4471 è in attesa. Ripeto: in attesa.', de: 'Los 4471 wartet. Ich wiederhole: wartet.', en: 'Lot 4471 is waiting. I repeat: waiting.'},
      ],
      note: {x: 10, y: 8, by: 'Colombo', text: {
        de: ['Die Öfen stehen auf 1000 °C.', 'Es läuft kein Rezept.', 'Ich hab es ins Schichtbuch geschrieben.', 'Danach war die Seite leer.'],
        en: ['The furnaces sit at 1000 °C.', 'No recipe is running.', 'I wrote it in the shift log.', 'Afterwards the page was blank.'],
      }},
      scare: {type: 'window'},
      enemyEvery: 4,
      tools: [
        {x0: 3, y0: 1, type: 'furnace', n: 3, name: 'FORNO V-3', temp: '1000°C'},
        {x0: 11, y0: 1, type: 'wetbench', name: 'PURA W-6', baths: ['SPM', 'SC-1', 'SC-2', 'HF', 'DRY']},
        {x0: 16, y0: 4, type: 'metrology', name: 'ORSA EL-4', screen: 'thickness'},
        {x0: 1, y0: 5, type: 'gascab', gas: 'O2'},
      ],
      lamps: [[5, 3], [2, 7], [11, 7]],
      day: [
        '####################',
        '#P.MMMMMM#.MMMMM...#',
        '#..MMMMMM#.MMMMM...#',
        '#........#.........#',
        '#........#......MM.#',
        '#M.......#......MM.#',
        '#M.......#.........#',
        '#........#......X..#',
        '#........#......===#',
        '####################',
      ],
      night: [
        '####################',
        '#..MMMMMM#ooooooooo#',
        '#..MMMMMM#ooooooooo#',
        '#........#ooooooooo#',
        '#..o.....#ooooooooo#',
        '#M.....o.#ooooooooo#',
        '#M.......#.....oooo#',
        '#....o...#...V.oooo#',
        '#.............o.===#',
        '####################',
      ],
    },
    {
      id: 'pr', reticle: [2, 8], time: '00:00',
      layer: {de: 'Fotolack', en: 'Photoresist'}, stack: {de: 'Fotolack · 1,2 µm', en: 'Resist · 1.2 µm'},
      title: {de: 'Gelblicht', en: 'Yellow Light'},
      log: {
        de: ['Los 4471 steht seit 21:40 vor dem Coater.', 'Bringen Sie es durch die Lithografie.'],
        en: ['Lot 4471 has been waiting at the coater since 21:40.', 'Take it through lithography.'],
      },
      fact: {
        de: ['Fotolack reagiert auf kurzwelliges Licht. Ein Photon', 'gelben Lichts (580 nm) trägt nur E = hc/λ ≈ 2,1 eV.', 'Zu wenig zum Belichten. Darum ist die Vorschicht gelb.'],
        en: ['Photoresist reacts to short wavelengths. A photon of', 'yellow light (580 nm) carries only E = hc/λ ≈ 2.1 eV.', 'Too little to expose it. That is why the shift before is yellow.'],
      },
      hint: {de: 'Die Schritte in Reihenfolge, dann zur Schleuse', en: 'The steps in order, then to the airlock'},
      // Announcements over the PA (step, Italian, translation), a note from shift B, one scare.
      pa: [
        {at: 4, it: 'Litografia: luce gialla. Non aprire le porte.', de: 'Lithografie: Gelblicht. Türen nicht öffnen.', en: 'Lithography: yellow light. Do not open the doors.'},
      ],
      note: {x: 9, y: 5, by: 'Ferrari', text: {
        de: ['Gelblicht an. Auf dem Boden liegen Schatten.', 'Außer uns ist niemand hier.', 'Wir zählen sie: einer, zwei, drei.', 'Vier.'],
        en: ['Yellow light on. There are shadows on the floor.', 'Nobody is here but us.', 'We count them: one, two, three.', 'Four.'],
      }},
      scare: {type: 'blackout', at: 14, layer: 'night'},
      route: [{de: 'Belacken', en: 'Coat', proc: 'coat'}, {de: 'Belichten', en: 'Expose', proc: 'expose'}, {de: 'Entwickeln', en: 'Develop', proc: 'develop'}],
      enemyEvery: 4,
      tools: [
        {x0: 2, y0: 2, type: 'track', name: 'KENSEI CT-7'},
        {x0: 10, y0: 2, type: 'scanner', name: 'LUMENA S193i'},
        {x0: 15, y0: 7, type: 'stocker'},
      ],
      lamps: [[4, 5], [11, 5], [16, 2], [10, 7]],
      day: [
        '####################',
        '#P......#.........X#',
        '#.MMMMM.#.MMMM.....#',
        '#.MMMMM.#.MMMM.....#',
        '#..1.3..#.MMMM.....#',
        '#.......#..........#',
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
        '#..V.........2.....#',
        '###.#####...###.####',
        '#.......#...#..MM..#',
        '#....V..#...#..MM..#',
        '####################',
      ],
    },
    {
      id: 'st', reticle: [11, 7], time: '01:00',
      layer: {de: 'Struktur', en: 'Pattern'}, stack: {de: 'Linien · 40 nm', en: 'Lines · 40 nm'},
      title: {de: 'Campanile', en: 'Campanile'},
      log: {
        de: ['Drüben in Luino schlägt der Campanile.', 'Bei jedem Schlag wechselt die Schicht.', 'Wer dann in der Wand steht, bleibt drin.'],
        en: ['Across the water, the campanile of Luino strikes.', 'With every strike the shift changes.', 'Whoever stands inside a wall then, stays there.'],
      },
      fact: {
        de: ['Der Scanner belichtet mit 193 nm, unter Wasser (n ≈ 1,44).', 'Kleinste Struktur ≈ k₁ · λ / NA = 0,28 · 193 nm / 1,35 ≈ 40 nm.', 'Das Ätzen überträgt das Muster dann ins Oxid.'],
        en: ['The scanner exposes at 193 nm, through water (n ≈ 1.44).', 'Smallest feature ≈ k₁ · λ / NA = 0.28 · 193 nm / 1.35 ≈ 40 nm.', 'Etching then transfers the pattern into the oxide.'],
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
      enemyEvery: 4,
      bell: 30,
      tools: [
        {x0: 6, y0: 1, type: 'cluster', kind: 'etch', name: 'VALENTA C-5', chambers: 5},
        {x0: 15, y0: 1, type: 'wetbench', name: 'PURA W-6', baths: ['SPM', 'SPM', 'QDR', 'DRY']},
        {x0: 16, y0: 6, type: 'chamber', kind: 'etch', name: 'VALENTA A-2'},
        {x0: 6, y0: 7, type: 'gascab', gas: 'C4F8'},
        {x0: 12, y0: 7, type: 'gascab', gas: 'CF4'},
      ],
      lamps: [[9, 6], [2, 2], [17, 5]],
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
        '#..o#.M..V..M.#====#',
        '####################',
      ],
    },
    {
      id: 'im', reticle: [1, 8], time: '02:00',
      layer: {de: 'Dotierung', en: 'Doping'}, stack: {de: 'Arsen · 10¹⁵ cm⁻²', en: 'Arsenic · 10¹⁵ cm⁻²'},
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
      enemyEvery: 4,
      beams: [{x: 1, y: 8, dir: 'right', keV: 40, metersPerTile: 0.15, field: {x0: 3, y0: 1, x1: 12, y1: 8, B: 0.25}, species: ['B', 'P', 'As'], every: 24}],
      tools: [
        {x0: 1, y0: 7, type: 'implanter', part: 'source'},
        {x0: 13, y0: 3, type: 'implanter', part: 'end', name: 'AURIGA HC-3'},
        {x0: 14, y0: 7, type: 'metrology', name: 'ORSA RS-1', screen: 'rs', value: '52Ω/□'},
      ],
      lamps: [[4, 2], [8, 6], [12, 1]],
      day: [
        '####################',
        '#.....#....#......X#',
        '#.1...#....#.......#',
        '#.....#....#.MMMMM.#',
        '#..........#.MMMMM.#',
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
        '#ooo.......#ooooooo#',
        '#oo...V....#ooooooo#',
        '#oo........#ooooooo#',
        '#o.........#ooooooo#',
        '#...........ooooooo#',
        '####################',
      ],
    },
    {
      id: 'an', reticle: [1, 8], time: '03:00',
      layer: {de: 'Ausheilen', en: 'Anneal'}, stack: {de: '1050 °C · 10 s', en: '1050 °C · 10 s'},
      title: {de: 'Ofenreihe', en: 'Furnace Row'},
      log: {
        de: ['Die Öfen öffnen sich von selbst, einer nach dem anderen.', 'Im Rohr liegen Wafer, die niemand geladen hat.'],
        en: ['The furnaces open by themselves, one after another.', 'Inside the tubes lie wafers nobody loaded.'],
      },
      fact: {
        de: ['Wärme breitet sich nach ∂T/∂t = α·∇²T aus. Dotieratome', 'wandern genauso: Diffusionslänge ≈ 2·√(D·t). Darum heizen', 'Kurzzeitöfen in Sekunden über 1000 °C und gleich wieder ab.'],
        en: ['Heat spreads as ∂T/∂t = α·∇²T. Dopant atoms wander', 'the same way: diffusion length ≈ 2·√(D·t). That is why rapid', 'thermal anneals go past 1000 °C for seconds, then cool at once.'],
      },
      hint: {de: 'Warte, bis die Hitze zurückweicht', en: 'Wait for the heat to fall back'},
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
      enemyEvery: 4,
      heat: {
        ambient: 22, source: 1000, threshold: 60, alpha: 0.2, cooling: 0.3, substeps: 2, period: 48, open: [0, 14],
        sources: [[6, 1, 0], [9, 1, 8], [12, 1, 16], [15, 1, 24], [5, 5, 12], [8, 5, 20], [11, 5, 28], [14, 5, 36]],
      },
      tools: [
        {x0: 1, y0: 5, type: 'gascab', gas: 'N2'},
        {x0: 5, y0: 1, type: 'tubes', name: 'FORNO H-12'},
        {x0: 5, y0: 5, type: 'tubes', name: 'FORNO H-12'},
      ],
      lamps: [[2, 4], [10, 7], [17, 6]],
      day: [
        '####################',
        '#P..#MMMMMMMMMMM#..#',
        '#...#.....#.....#.1#',
        '#.........#........#',
        '#...#.....#.....#..#',
        '#M..#MMMMMMMMMMM#..#',
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
        '#...........V......#',
        '#...#...........#..#',
        '####################',
      ],
    },
    {
      id: 'ct', reticle: [18, 1], time: '04:00',
      layer: {de: 'Kontakte', en: 'Contacts'}, stack: {de: 'Kontaktloch · 60 nm', en: 'Contact hole · 60 nm'},
      title: {de: 'Plasma', en: 'Plasma'},
      log: {
        de: ['Im Ätzer leuchtet Plasma.', 'Auf dem Bildschirm steht das Rezept ROSSI_01.'],
        en: ['Plasma glows in the etcher.', 'On the screen: recipe ROSSI_01.'],
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
        de: ['ROSSI_01 ist mein Rezept.', 'Ich habe es nicht gestartet.', 'Ich kann nichts mehr starten.', 'Ich kann nichts mehr anfassen.'],
        en: ['ROSSI_01 is my recipe.', 'I did not start it.', 'I cannot start anything any more.', 'I cannot touch anything any more.'],
      }},
      scare: {type: 'blackout', at: 22, layer: 'night'},
      route: [{de: 'Oxid abscheiden', en: 'Deposit oxide', proc: 'deposit'}, {de: 'Kontakte ätzen', en: 'Etch contacts', proc: 'contacts'}],
      enemyEvery: 4,
      pulses: [
        {x0: 1, y0: 3, x1: 6, y1: 4, period: 30, on: [0, 10]},
        {x0: 7, y0: 3, x1: 12, y1: 4, period: 30, on: [10, 20]},
        {x0: 13, y0: 3, x1: 18, y1: 4, period: 30, on: [20, 30]},
      ],
      tools: [
        {x0: 1, y0: 6, type: 'chamber', kind: 'cvd', name: 'VALENTA D-2'},
        {x0: 15, y0: 6, type: 'chamber', kind: 'etch', name: 'VALENTA E-1'},
        {x0: 4, y0: 1, type: 'chamber', kind: 'cvd', name: 'VALENTA D-2'},
        {x0: 10, y0: 1, type: 'chamber', kind: 'etch', name: 'VALENTA E-1'},
        {x0: 16, y0: 1, type: 'chamber', kind: 'etch', name: 'VALENTA E-1'},
      ],
      lamps: [[2, 3], [9, 7], [16, 6]],
      day: [
        '####################',
        '#P..MM....MM....MM.#',
        '#...MM....MM....MM.#',
        '#..................#',
        '#..................#',
        '####.####.####.#####',
        '#MMM.....#.....MMM.#',
        '#MMM.....#.....MMM.#',
        '#.1......#......2.X#',
        '####################',
      ],
      night: [
        '####################',
        '#...oo....oo....oo.#',
        '#...oo....oo....oo.#',
        '#..................#',
        '#........V.........#',
        '####.####.####.#####',
        '#MMM...............#',
        '#MMM......V........#',
        '#..................#',
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
        de: ['Sputtern im Vakuum: Freie Weglänge λ = kT / (√2·π·d²·p).', 'Bei 10⁻⁶ mbar fliegt ein Argonatom im Mittel rund 70 m weit.', 'Darum treffen die Aluminiumatome geradlinig auf den Wafer.'],
        en: ['Sputtering in vacuum: mean free path λ = kT / (√2·π·d²·p).', 'At 10⁻⁶ mbar an argon atom flies about 70 m on average.', 'So the aluminium atoms reach the wafer in straight lines.'],
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
      route: [{de: 'Sputtern', en: 'Sputter', proc: 'sputter'}, {de: 'Messen', en: 'Measure', proc: 'measure'}],
      enemyEvery: 4,
      bell: 36,
      pulses: [{x0: 8, y0: 2, x1: 11, y1: 7, period: 30, on: [0, 12]}],
      tools: [
        {x0: 8, y0: 1, type: 'cluster', kind: 'pvd', name: 'VALENTA S-4', chambers: 3},
        {x0: 2, y0: 3, type: 'stocker'},
        {x0: 2, y0: 6, type: 'chamber', kind: 'pvd', name: 'VALENTA S-4'},
        {x0: 15, y0: 3, type: 'metrology', name: 'ORSA CD-9', screen: 'lines'},
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
      {x: 1, y: 7, text: {de: 'Vogt Microelettronica, Luino. 21:56. Du übernimmst die Nachtschicht in Bay 7.', en: 'Vogt Microelettronica, Luino. 21:56. You take over the night shift in Bay 7.'}},
      {x: 2, y: 5, text: {de: 'Umkleide: Overall, Haube, Mundschutz, Brille, Handschuhe, Überschuhe. Ein Mensch verliert Millionen Partikel pro Minute.', en: 'Gowning room: coverall, hood, face mask, goggles, gloves, boot covers. A person sheds millions of particles a minute.'}},
      {x: 6, y: 3, text: {de: 'Luftdusche: Düsen blasen gefilterte Luft mit etwa 25 m/s und lösen die letzten Partikel vom Anzug.', en: 'Air shower: nozzles blow filtered air at about 25 m/s and loosen the last particles from the suit.'}},
      {x: 13, y: 3, text: {de: 'Bay 7. Die Anlagen laufen. Niemand ist hier.', en: 'Bay 7. The tools are running. Nobody is here.'}},
    ],
    suitAt: 6,
    lamps: [],
    signs: [
      {x: 3, y: 5, text: 'VESTIZIONE'}, {x: 9, y: 2, text: {de: "DOCCIA D'ARIA", en: "DOCCIA D'ARIA"}, bg: '#2c6fb5', color: '#ffffff'},
      {x: 12, y: 5, text: 'BAY 7', bg: '#2c6fb5', color: '#ffffff'}, {x: 15, y: 5, text: 'ZONA ISO 3'},
    ],
    day: [
      '####################',
      '#KKKKKK#####......X#',
      '#......#####.......#',
      '#.BBBB.DAAAAD......#',
      '#......#####.......#',
      '##.#################',
      '#..................#',
      '#P.................#',
      '#==================#',
      '####################',
    ],
  };
  INTRO.night = INTRO.day.map(r => r.replace('P', '.').replace('X', '.'));

  // The secret finale with all eight reticles: lot 4471 becomes the Odenchip from Elektronenreise.
  const FINALE = {
    caps: {
      expose: {de: 'Acht Retikel, acht Schichten. Los 4471 wird ein letztes Mal belichtet.', en: 'Eight reticles, eight layers. Lot 4471 is exposed one last time.'},
      wafer: {de: 'Auf dem Wafer: Hunderte gleicher Chips.', en: 'On the wafer: hundreds of identical chips.'},
      die: {de: 'Der Odenchip. Zwischen den Bondpads steht etwas in der obersten Metallebene.', en: 'The Odenchip. Between the bond pads, something is written in the top metal.'},
      bond: {de: 'Gesägt, aufgeklebt, gebondet: Golddrähte, dünner als ein Haar.', en: 'Sawn, attached, bonded: gold wires thinner than a hair.'},
      mold: {de: 'Vergossen. Der Laser schreibt den Namen.', en: 'Moulded. The laser writes its name.'},
      board: {de: 'Acht LEDs. Eine für jede Schicht.', en: 'Eight LEDs. One for every layer.'},
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
      de: ['Über dem See tutet das erste Schiff.', 'Die Frühschicht kommt.', '', 'Schichtbuch, 06:12:', 'Nachtschicht nicht erschienen.', 'Neue Schicht auf Los 4471: 12 nm.'],
      en: ['Out on the lake, the first ferry sounds its horn.', 'The morning shift arrives.', '', 'Shift log, 06:12:', 'Night shift did not show up.', 'New layer on lot 4471: 12 nm.'],
    },
  };

  return {LEVELS, ENDING, INTRO, FINALE};
});
