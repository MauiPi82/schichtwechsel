# Store page notes (itch.io)

Findings from 15 Steam pages of short atmospheric horror and puzzle games (Iron Lung, SIGNALIS, Mouthwashing, Buckshot Roulette, Return of the Obra Dinn, Papers, Please, INSIDE, Mundaun, Inscryption, Lorelei and the Laser Eyes, Viewfinder, Superliminal, COCOON, The Exit 8, Lethal Company) and the itch.io creator docs. Collected 2026-11-11.

## What the best pages do

- **Short description:** one or two sentences, present tense, about 100 to 180 characters for short games (Iron Lung 96, Buckshot 111, Exit 8 112). It names what you do with a concrete verb and object ("pilot a tiny submarine"). An optional two-to-four word punch line can follow ("God is not watching.").
- **Mechanic:** stated once and plainly, often as a single defining sentence ("each world exists within an orb that you can carry on your back").
- **Mystery:** name the unknown, never the answer ("whatever lurks", "a dark secret"). Mechanics and setting are plain, the twist stays hidden.
- **Feature list:** three to six bullets, one idea each, verb first or concrete noun phrases. The modern layout repeats clip, short header and one line.
- **Play time:** every sub-hour game states it ("15 to 20-minute", "under an hour").
- **Tagline:** used exactly once, at the start of the description or the end of the short description.
- **Tone:** dry rather than loud. No exclamation marks or superlatives in the strong examples.
- **First screenshot:** real gameplay showing the core loop, not a menu or title screen.
- **Trailer:** about 40 to 60 seconds, gameplay within the first three seconds.
- **Content notes:** flat and specific. itch.io only has an adult flag, so add one factual line to the description.

## itch.io specifics

- **Cover:** 630 × 500 (315:250), readable at 315 × 250, one focal point, bold colour. For pixel art use an integer scale.
- **Short description field:** shown in listings with the cover. Do not repeat the title. Lead with genre and verb, because listings truncate.
- **Layout:** HTML5 pages default to one column and hide screenshots. Set Screenshots to "Sidebar" in Edit theme, or place two or three GIFs inline.
- **Screenshots:** three to five, GIFs allowed, at most 3 MB each. Suggested order:
  1. the same spot in your shift
  2. the same spot in the shift before
  3. a hazard
  4. wafer progress
  5. shadows gathering beneath you
- **Embed:** an integer multiple of the native resolution, a fullscreen button, click to play. Only tick "Mobile friendly" with working touch controls.
- **Tags:** at most 10. Horror, Psychological Horror, Atmospheric, Puzzle, Top-Down, Short, Physics, Mystery, Creepy.
- **Controls note:** pressing Shift five times on Windows triggers Sticky Keys. The game also accepts Space; say so on the page.
- **Devlog:** post the launch as "Major Update or Launch", plus one long-form post on the physics (for example how the Lorentz-force beam works). Publish only when the page is complete, because a page gets one appearance in "Most Recent".
- **Flashes:** the shift is a full-screen brightness change. Animated covers and GIFs must not flash. Crossfade or slow the swap.

## Page copy (final draft, 2026-11-12)

**Title:** Schichtwechsel · Turno di notte

**Short description (EN):** A night shift in a chip fab on Lago Maggiore. Press Shift to step into the shift before, where the missing crew is still at work.

**Short description (DE):** Eine Nachtschicht in einem Chipwerk am Lago Maggiore. Mit Shift trittst du in die Vorschicht, in der die verschwundene Belegschaft noch arbeitet.

**Description (EN):**

> Luino, 21:56. Shift B did not clock out. You take over Bay 7 and their hot lot 4471, due at six in the morning.
>
> The fab exists twice. Your shift is bright and safe, but walls stand in your way. The shift before is the same hall in yellow light, decayed, and the previous shift still walks its rounds there. Press Shift to change between them.
>
> - Take lot 4471 through a real front-end process, one layer per hour: clean, oxidise, coat, expose, etch, implant, anneal, contact, metal.
> - Play the steps yourself: lift the wafers out of the baths in time, stop the oxygen at 50 nm, rinse the developer when the lines are 40 nm wide, keep the analysing magnet on arsenic.
> - Real physics decides: an ion beam bent by the Lorentz force, heat spreading from furnace doors, plasma firing in rhythm.
> - Watch their shadows in your shift, slip past them in theirs. Light stops them.
> - Measuring stations judge your work. Your yield is the score of the night.
> - Eight reticles hide in the shift before. They lead to a second ending.
>
> 15 to 20 minutes. German and English. Keyboard, touch or controller.
>
> Content note: dark atmosphere, mild jump scares, brief full-screen flashes when changing shift. No gore.
>
> Made for GitHub Game Off 2026, theme SHIFT. Made with Claude, an AI by Anthropic.

**Description (DE):**

> Luino, 21:56. Schicht B hat nicht ausgestempelt. Du übernimmst Bay 7 und ihr Eillos 4471, fällig um sechs Uhr morgens.
>
> Das Werk gibt es zweimal. Deine Schicht ist hell und sicher, aber Wände stehen im Weg. Die Vorschicht ist dieselbe Halle im Gelblicht, verfallen, und die Schicht von vorhin geht dort noch ihre Runden. Mit Shift wechselst du zwischen beiden.
>
> - Bring Los 4471 durch einen echten Front-End-Prozess, eine Schicht pro Stunde: reinigen, oxidieren, belacken, belichten, ätzen, implantieren, ausheilen, kontaktieren, metallisieren.
> - Spiel die Schritte selbst: die Wafer rechtzeitig aus dem Bad heben, den Sauerstoff bei 50 nm abstellen, den Entwickler bei 40 nm Linienbreite abspülen, den Analysiermagneten auf Arsen halten.
> - Echte Physik entscheidet: ein Ionenstrahl, den die Lorentzkraft biegt, Hitze aus Ofentüren, Plasma im Takt.
> - In deiner Schicht ihre Schatten beobachten, in ihrer an ihnen vorbei. Licht hält sie auf.
> - Messstationen bewerten deine Arbeit. Deine Ausbeute ist der Punktestand der Nacht.
> - Acht Retikel liegen in der Vorschicht. Sie führen zu einem zweiten Ende.
>
> 15 bis 20 Minuten. Deutsch und Englisch. Tastatur, Touch oder Controller.
>
> Hinweis: düstere Stimmung, leichte Schreckmomente, kurze Bildblitze beim Schichtwechsel. Keine Gewalt.
>
> Für GitHub Game Off 2026, Thema SHIFT. Entwickelt mit Claude, einer KI von Anthropic.

**Controls (both languages on the page):** WASD or arrow keys walk · Shift or Space changes the shift (Space avoids Windows Sticky Keys) · walk into a tool to use it · Enter skips · P pause · R restart the hour · M sound · B shift log · L language.

**Tags (10):** Horror, Atmospheric, Puzzle, Top-Down, Short, Pixel Art, Physics, Mystery, Singleplayer, Psychological Horror.

**Genre:** Puzzle. **Made with:** HTML5. **AI disclosure:** yes, code and art with Claude; say so in the description.

**Images (docs/itch/, made by `node tools/itch-images.cjs`):**
1. `cover-630x500.png` as the cover (the 1260 × 1000 version for retina, if itch asks).
2. Screenshots in this order: `shot-1-your-shift.png`, `shot-2-the-shift-before.png`, `shot-3-plasma.png`, `shot-4-implanter.png`, `shot-5-clean.png`.
3. GIFs inline in the description: `round.gif` after the second paragraph, `implanter.gif` after the feature list. Neither flashes.

**Embed:** "Embed in page", 960 × 540 (the game fills the frame and keeps 16:9), "Fullscreen button" on, "Mobile friendly" on, orientation landscape. "Click to launch in fullscreen" off.

**Theme (Edit theme):** BG `#07080c`, BG2 `#0f1422`, Text `#e9e4d6`, Link `#ffb43a`, Headers `#ffcf5a`, Buttons `#2f6db3`, Screenshots: Sidebar, header font Pixelify Sans if offered, otherwise default.

## Upload

The workflow `.github/workflows/itch.yml` runs the tests, builds the package (`tools/build-itch.py`) and uploads it with butler after every push to main that changes the game. Without the secret it only builds and keeps the ZIP as an artifact.

One-time setup:
1. On itch.io: Dashboard → Create new project. Title "Schichtwechsel", URL `schichtwechsel` (so the target is `mauipi/schichtwechsel`), kind of project HTML, visibility Draft.
2. GitHub, repository MauiPi82/schichtwechsel → Settings → Secrets and variables → Actions → New repository secret: name `BUTLER_API_KEY`, value: the same API key as for the Axt (itch.io → Settings → API keys). Never paste the key into a chat.
3. Actions → itch → Run workflow. The upload appears as channel `html5`; then tick "This file will be played in the browser" once in Edit game.

## Schedule to the deadline

Deadline: **Tuesday 1 December 2026, 13:37 PST = 22:37 in Germany.**

| Date | What |
| --- | --- |
| until 22 Nov | Playtests (friends, colleagues), fix what they find, balance the hours |
| 23–24 Nov | Last features, then full run in Chrome, Firefox, Safari, on a phone |
| **25 Nov** | **Content freeze**: only fixes after this |
| 26 Nov | itch page complete (text, cover, screenshots, GIFs, theme), still Draft |
| 27 Nov | Devlog drafted (launch post plus one post on the physics) |
| 28 Nov | Mirror on odenwaeller.org via one PR (page, counter, donation box, overview card, sitemap, privacy paragraph) |
| 29 Nov | Page public, join the jam, submit (do not wait for the last day) |
| 30 Nov – 1 Dec | Buffer; small fixes still upload automatically |
