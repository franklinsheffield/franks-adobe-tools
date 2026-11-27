# Houses brand briefs

Brand for every Science is Magic House (`activity/src/hosts/`). Houses 1 and 2 are live; Houses 3 to 5 are approved briefs ready to build. Machine-readable values: `house-tokens.json`. Crests: `crests/*.svg`. Overview: `houses-brand-sheet.png`. Full brand book (voice tables, social use): https://claude.ai/artifact/K9y5opNhdzTdYoXLfNVLiu

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
| 3 | The Observatory | `observatory` | Keeper Altair (he) | stars, calendar, rummy | stars | #🔭-observatory (to create) | `#8FB8FF` | Cormorant Garamond, wide caps | sine 220 Hz | The Orrery Music Box |
| 4 | The Séance Parlour | `parlour` | Madame Rook (she) | seance, timeline | timeline | #🕯️-parlour (to create) | `#C3A6FF` | Cormorant Garamond italic | sawtooth 200 Hz, low-passed | The Spirit Trumpet Gramophone |
| 5 | The Scriptorium | `scriptorium` | Archivist Wren (they) | decoder, memory | decoder | #🪶-scriptorium (to create) | `#E8483B` | Uncial Antiqua | triangle 380 Hz | The Hurdy-Gurdy |

All display faces are already bundled in `activity/src/fonts/` or `assets/`. Leave `channelIds: []` for Houses 3 to 5 until the channels exist (preview with `?house=<id>`).

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
