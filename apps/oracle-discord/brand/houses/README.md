# Houses brand briefs

Brand for every Science is Magic House (`activity/src/hosts/`). Houses 1 to 3 are live; Houses 4 and 5 are approved and their channels exist, ready to build. Pixel Scape's game language is approved. Machine-readable values: `house-tokens.json`. Crests: `crests/*.svg`. Overview: `houses-brand-sheet.png`. Full brand book (voice tables, social use): https://claude.ai/artifact/K9y5opNhdzTdYoXLfNVLiu

## Shared rules (every House)

- Endorsement on social and headers: "a Science is Magic House".
- Background Chamber Night `#07050F`, text Starlight `#F4F1FF`, Essence and ranks in Honey Gold `#F2B63C`. Body text Cormorant Garamond.
- Every joke, idle line and store note carries a real, checkable fact. Readings and lore describe; never medical, financial or life advice.
- Banter lines under 90 characters (`tests/houses.test.js`). One emoji marker per House, at the start of a line.
- Each House has: host, accent colour, display face, door-arch crest, speech-blip voice, its own music player, one store shelf with a free starter.
- Each House's accent and blip voice must differ from the others (table below).

| # | House | id | Host | Rooms | Daily | Channel | Accent | Display face | Blip voice | Player |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | The Oracle Chamber | `oracle` | The Oracle | all | – | #🔮-oracle (live) | `#FF4FB3` | Cinzel | square 330 Hz | The Record Player |
| 2 | The Alchemist's House | `alchemist` | Magister Vell (she) | alchemy, duel, grimoire | alchemy | #⚗️-laboratory (live) | `#E89A55` | IM Fell English | triangle 270 Hz | The Brass Phonograph |
| 3 | The Observatory | `observatory` | Keeper Altair (he) | stars, calendar, rummy | stars | #🔭-observatory `1575975395692642596` (live) | `#8FB8FF` | Cormorant Garamond, wide caps | sine 220 Hz | The Orrery Music Box |
| 4 | The Séance Parlour | `parlour` | Madame Rook (she) | seance, timeline | timeline | #🕯️-parlour `1575977181622829158` | `#C3A6FF` | Cormorant Garamond italic | sawtooth 200 Hz, low-passed | The Spirit Trumpet Gramophone |
| 5 | The Scriptorium | `scriptorium` | Archivist Wren (they) | decoder, memory | decoder | #🪶-scriptorium `1575977195048927232` | `#E8483B` | Uncial Antiqua | triangle 380 Hz | The Hurdy-Gurdy |

All display faces are already bundled in `activity/src/fonts/` or `assets/`. All five channels exist under 🔮 Sanctum of Mysteries; use the ids above in each host's `channelIds`.

## House 3: The Observatory

- **Host look:** midnight-blue hood stitched with star charts, brass telescope eyepiece over the eye, small astrolabe badge. Named after Altair, the brightest star in Aquila.
- **Positioning line:** Real stars, real calendars and the myths people told about them, with an astronomer who talks back.
- **Tagline:** Look up. Then look closer.
- **Voice:** calm, patient, quietly amazed; pairs every myth with the astronomy; respects every culture's sky; soft jokes. Never rushes, never presents a myth as fact, never mocks astrology fans.
- **Sample lines:** "Give your eyes 20 minutes in the dark, {name}. The sky gets bigger." / "Every culture drew its own pictures. Tonight, the Lakota sky." / "I'd tell you a joke about the Sun, but it's too far out."
- **Colours:** surface Deep Sky `#0B1530`, accent Polaris Blue `#8FB8FF`, highlight Star Silver `#DCE6FF`, warm Brick Gold `#E2B04A`, line Chart Navy `#2A3F6E`.
- **Visual:** dark dome, silver star charts, brass instruments, orbit rings. Emblem: eyepiece ring with crosshairs over an eight-point star.
- **Sound:** wind over the dome, brass ratchet on calendar gears (exists), soft chime per star found; sting: two chimes a fifth apart.
- **Shelf:** star maps from different cultures, one real fact each. Free starter: the Greek sky.

## House 4: The Séance Parlour

- **Host look:** plum velvet hood, lace veil, cameo brooch, a single candle. A former stage medium who now explains her tricks, as Houdini exposed mediums in the 1920s.
- **Positioning line:** Ghosts, conjurors and the real history of magic, with a medium who shows you the trick.
- **Tagline:** Every ghost has a method.
- **Voice:** theatrical, then a wink: mood in one line, the plain fact in the next. Playful skeptic; respects believers; never promises contact with the dead, never mocks faith or grief.
- **Sample lines:** "Hush, {name}. Three knocks... That's the radiator. Now, the real clue." / "Believe what you like. I just like knowing how it works." / "My crystal ball is mostly for dramatic lighting."
- **Colours:** surface Velvet Plum `#2A0F24`, accent Spirit Lilac `#C3A6FF`, highlight Candle Glow `#FFE3A3`, line Smoke `#8A7F99`, secondary Cameo Rose `#E7A0B4`.
- **Visual:** velvet curtains, lace, one candle, planchette, playbill borders, smoke clearing to show the answer. Emblem: candle flame inside a keyhole.
- **Sound:** three knocks, curtain swish, candle gutter, music-hall piano; sting: three knocks, then a bright reveal chord. Spirit trumpets were real séance props.
- **Shelf:** trick cards, each teaching one real conjuring or séance method. Free starter: the classic card force.

## House 5: The Scriptorium

- **Host look:** hood trimmed with quill feathers, ink-stained gloves, red wax-seal badge. Keeps the marks; the SiM Librarian bot keeps the books (don't merge the two).
- **Positioning line:** Runes, glyphs and the signs people wrote, with a scribe who talks back.
- **Tagline:** Every mark means something.
- **Voice:** precise, gentle, delighted by small details; one letter pun at most per line; labels modern uses (rune magic sets are modern; the futhark is an alphabet). Never invents meanings for symbols.
- **Sample lines:** "One rune read, {name}. That's how every scholar starts." / "This is the Gallehus horn, about AD 400. Its maker signed it in runes." / "I'm not a morning person. I'm a manuscript person."
- **Colours:** surface Vellum Dark `#1C1710`, accent Vermilion Ink `#E8483B`, highlight Vellum `#F1E4C6`, secondary Lapis `#3D6BE0`, line Iron-gall `#4A3A2C`. (Red rubrics and lapis ultramarine are the real manuscript colours.)
- **Visual:** vellum pages, red initials, gold leaf on one letter, quills, wax seals, ruled lines. Emblem: crossed quill over a wax seal.
- **Sound:** quill scratch, page turn, wax-seal thump, small bell on a match; sting: quill scratch, then the seal.
- **Shelf:** inks and pigments, one real fact each. Free starter: iron-gall ink; then vermilion, ultramarine, malachite green, orpiment yellow, Tyrian purple.

## Pixel Scape: a Science is Magic Lab (not a House)

Pixel Scape (`apps/pixel-scape-discord`, `apps/worlds-brew-app`) is branded the same way, but as a Lab: a place to build, not a House to visit. Its crest is a square map tile (`crests/pixel-scape-crest.svg`) instead of the door arch. Values are under `labs.pixel-scape` in `house-tokens.json`.

- **Host:** PX-10, a small survey drone named after the app code. Voice of the bot, start screen and tips.
- **Positioning line:** Build any real place on Earth in 3D, together, from real elevation and satellite data.
- **Tagline:** Any place on Earth. Built together.
- **Voice:** a field instrument. Numbers first ("10.0 × 10.0 km, 1,135 to 3,753 m, built in 14 s"), always credit the data, invite people in ("Three builders in the room. Tap a name to follow."), one dry joke per finished build ("Survey complete. No mountains were harmed."), never a joke on a failure.
- **Colours (Night Arcade, already in the Lab Suite):** Void `#05040C`, Panel `#0B0A18`, accent Press Cyan `#5CF2FF`, Glow Ice `#8FD8FF`, success and points Ready Green `#3DFF8B`, in progress Busy Amber `#FFC23D`, error and sealed Alert Rose `#FF3D6E`.
- **Type:** Night Machine for display and labels (installed, not bundled); web and Discord fallback VT323. System sans for body, monospace for stats.
- **Visual:** pixel grid over contour lines, satellite tiles, scanlines, LED status lights, before/after renders. Emoji 🌍 (🗺️ for builds).
- **Sound:** chiptune. Sonar ping for pings and "survey started", LED click on buttons, four-note rising arpeggio on build done, short fanfare on a badge.

### Game language (for the gamification design)

Pixel Scape points feed the Scholar's Path, so it has titles and badges, not a second rank ladder.

| Element | Brand name | Notes |
|---|---|---|
| Weekly theme (`web/theme.js`) | The Weekly Build | Already in posted render captions |
| Real-place challenge | Expedition | A named real place to build and explore |
| Shared room | Survey Party | Up to 8 builders |
| Posted render | Field Report | 5 pts in #🖼-showcase, +10 if a Hierophant picks it |
| Remix | Remix | Already built |
| Builder titles | Scout → Surveyor → Cartographer → Worldwright | Shown in the Activity only |
| Badges | Summit (place over 3,000 m), Coastline, Home Town, First Remix, Full Party (8 builders) | One-time sigils |

## Personalities and shop items

Each House gets four paid personalities plus its host's own voice (free), and one new shelf: a free starter plus seven paid items. Personalities change delivery, never facts. Prices: personalities 100 to 160 Essence, items 30 to 160. Every item carries one real fact; every line stays under 90 characters. Full tables with sample lines: brand book, "Personalities and shop items".

| House | Personalities (Essence) | New shelf: items (Essence) |
|---|---|---|
| Oracle Chamber | The Pythia 160, The Skeptic 140, The Court Astrologer 140, The Night Shift 120 | Scrying tools: Quartz sphere free, I Ching coins 50, Tea-leaf cup 60, Foucault's pendulum 80, Oracle bone 90, Astrolabe 100, Delphic tripod 110, Dr Dee's mirror 120 |
| Alchemist's House | Excitable Vell free, Safety Officer 100, Mad Professor 120, Field Botanist 120, Victorian Lecturer 140 | Glassware: Round-bottom flask free, Erlenmeyer 40, Retort 50, Alembic 60, Liebig condenser 70, Bunsen burner 80, Kipp's apparatus 90, Philosopher's egg 150 |
| Observatory | Keeper Altair free, Night Watchman 100, Ship's Navigator 120, Babylonian Scribe 140, Mission Control 140 | Instruments: Star wheel free, Red lamp 30, Binoculars 50, Sextant 80, Galileo's telescope 90, Armillary sphere 100, Orrery 120, Antikythera mechanism 160 |
| Séance Parlour | Madame Rook free, Music-Hall Showman 100, Gothic Novelist 120, Houdini's Assistant 120, The Ghost Herself 140 | Parlour props: Plain candle free, Planchette 50, Spirit trumpet 60, Spirit slate 80, Talking board 90, Spirit cabinet 100, Houdini's handcuffs 110, Crystal skull 140 |
| Scriptorium | Archivist Wren free, Exacting Editor 100, Weary Scribe 120, Decipherer 140, Codebreaker 140 | Writing tools 🪶: Goose quill free, Reed pen 40, Wax tablet 50, Papyrus scroll 60, Clay tablet 70, Vellum sheet 80, Seal ring 90, Rosetta Stone replica 150 |
| Pixel Scape (Lab) | PX-10 Field Unit free, Tour Guide 100, Arcade Announcer 120, Nature Narrator 120, Hype Drone 140 | Survey kit 🗺️: PX-10 classic shell free, Scanline look 40, Dither look 50, Contour overlay 60, Halo look 70, Chroma look 80, Golden hour sky 90, Aurora sky 120 |

Pixel Scape has no wallet yet. Use the shared Essence wallet when the game layer lands; fallback currency "Pixels" only if it stays separate.

Sample facts (one per item, checkable): Enigma had about 1.59 × 10²⁰ settings; cuneiform began about 3200 BC; the Rosetta Stone was found in 1799; auroras glow about 100 to 300 km up; low sun crosses more air, which scatters blue away.
