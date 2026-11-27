# Science is Magic oracle bot

One Discord app for the server's readings: `/oracle` (the fortune teller), `/humandesign`, `/astrology`, `/iching`, `/numerology`, `/chinesezodiac`, `/mayan`, `/egyptian`, `/celtic`, `/runes`, `/oraclebones`, `/ifa`, plus `/profile`.

- **Worker** (`worker/index.js`, Cloudflare free tier): checks Discord's signature, defers the reply, seals the options with AES-GCM (`ORACLE_KEY`) and dispatches `.github/workflows/oracle-reading.yml`.
- **Reading job** (`scripts/job.js`, GitHub Actions): opens the options, runs `src/modules/<name>/index.js`, posts embeds + PNG to Discord. Birth data is never stored or logged.
- **Modules**: export `command` (slash command JSON) and `async run(options, ctx)` -> `{ embeds, files: [{ name, data }], ephemeral? }`. List them in `src/registry.js`.
- **Shared core**: `src/ephemeris.js` (astronomy-engine, MIT; tests check it against Swiss Ephemeris to under 1 arcminute) and `src/birthplace.js` (OpenStreetMap geocoding, IANA time zone, historical DST).

## The Oracle (`/oracle`)
`src/oracle/`: the Science is Magic fortune teller. `/oracle` opens her card (only the visitor sees it): a portrait, an in-character greeting and a menu of every registered system (`systems.js`; new modules appear once they're in `MODULES`).
- **Question systems** (I Ching, runes, oracle bones, Ifá) open a question form; **birth systems** use the saved `/profile` or open the birth form.
- The reading posts as usual, opened by the Oracle's spoken lines (`voice.js`, written text, no AI service) with her name on the first embed.
- Every reading ends with **Another reading** and **Enter the Chamber** buttons. The Chamber button launches the Oracle Chamber Activity once `ACTIVITY_READY = "true"` in `wrangler.toml`.
- Portrait: `figure.js` draws her; `node scripts/make-portrait.js` re-renders `assets/oracle.png` and the copy the Worker serves at `/oracle.png`.

## The Oracle Chamber (Discord Activity)
`activity/`: the full-screen fortune-teller experience. The Oracle (the creature from the server logo, `src/oracle/figure.js`) sits top left, the reading table top right, and its words scroll in the bottom half. Pick a system, give the Oracle your question or birth details; the tools are cast on the table with an animation (`activity/src/table.js`), the reading art is laid down, and the Oracle talks it through with retro text-box blips (`activity/src/voice-sfx.js`, Web Audio, mute button). Also a journal of your last 20 readings (on that device) and your saved `/profile` filled in.
- Readings run in the browser with the same modules as the bot (`build.mjs` bundles every module in `MODULES`, swapping resvg, `node:fs` and `node:url` for shims in `activity/src/shims/`), so they always match the chat version.
- `activity/worker.mjs` (Worker `oracle-chamber`): serves the build, swaps the Discord sign-in code for a token (`DISCORD_CLIENT_SECRET`, from repo secret `ORACLE_DISCORD_CLIENT_SECRET`) and returns the member's own saved profile.
- Discord Developer Portal: Activities on, URL mapping `/` -> the `oracle-chamber` Worker host and `/osm` -> `nominatim.openstreetmap.org`, OAuth2 redirect `https://127.0.0.1`. Then set `ACTIVITY_READY = "true"` in `wrangler.toml` so the bot's **Enter the Chamber** button launches it.
- Local: `node activity/build.mjs`, then serve `activity/dist/` and open it in a browser (sign-in and profile are skipped outside Discord).

### Rooms: Séance: Guess the Ghost

The Chamber hosts rooms, small games listed under "Investigate & learn" (registry `ROOMS` in `activity/src/main.js`; each room lives in `activity/src/<room>/` and keeps progress in `prog.rooms.<id>` with a `plays` counter). **Séance: Guess the Ghost** (`activity/src/seance/`): a ghost raps out 5 clues, each one real method, tool or fact of what it practised. Three levels: **1 Apprentice**, 36 practitioners (a cardiologist, a card sharp, a horoscope columnist…), named by their general kind from a 12-answer pool (astronomy, physics, chemistry, biology, geology, stage illusion, sleight of hand, escapology, mentalism, spirit mediumship, alchemy, astrology); some count as two (a pharmacist is chemistry or biology), and typing the job title also counts; **2 Adept**, 20 specific techniques (spectroscopy, radiocarbon dating, tree-ring dating, X-ray crystallography, pasteurisation, Zener cards, bullet catch, Zig Zag Girl, linking rings, distillation…); **3 Master**, 20 historical scientists and magicians (Tesla, Newton, Dee, Pepper, Kepler and Paracelsus count as both). Say magic, science or both, then name it: type it (typos forgiven), or "show me 4", which blows out 3 candles (always leaving one). Five candles; extra clues and wrong names snuff one. No `<form>`: Discord's Activity sandbox blocks form submit, so the answer box uses a button and Enter. Points scale ×1 / ×1.5 / ×2 by level; first identification pays ✦ and 💎, replays only improvements. Decks in `practices.js` (POOL, GENERAL, SPECIFIC) and `ghosts.js`. Store shelf (`shop.js`, kind `seancecandle`): séance candles coloured by real flame tests (lithium crimson, copper green, calcium orange, potassium lilac, will-o'-the-wisp blue), equipped id in `prog.seancecandle`.

### Rooms: Rune & Glyph Decoder

**Rune & Glyph Decoder** (`activity/src/decoder/`) teaches four real scripts in 19 levels: Elder Futhark (the futhark, the bracteate words alu and laþu, the Einang Stone, the Gallehus horn), Ogham (letter names, OGAM, the MAQI MUCOI formula), Egyptian hieroglyphs (rn, the cartouches of Ptolemy, Cleopatra and Tutankhamun) and Maya numbers (bar and dot, 13.0.0.0.0, Pakal's birth 9.8.9.13.0). The Oracle teaches each new sign, the inscription is laid on the table, and the player taps the sound of each glyph, then answers what it means and gets its history and source. Each script also has a make-your-own level: your name in runes, Ogham or a cartouche, or your birthday in the Long Count (from `src/modules/mayan/calendar.js`). Stars: ★★★ from memory, ★★ with the codebook, ★ with hints. Each new star earns 5 ✦ and 5 💎, plus 5 more for a first clear. Codex entries appear under "Decoded". Each script has a 📖 Study guide (`guide.js`) that covers everything its questions ask, plus a full sign table. It opens from the script menu, the lesson and the meaning question, and closes while decoding (there the codebook costs a star). Glyph fonts are OFL Noto subsets embedded in `fonts.gen.js`. Decoder levels don't use daily readings.

## Human Design
`src/humandesign/`: chart (26 activations, design moment at 88° of solar arc, true node), branded bodygraph PNG, and original Science is Magic interpretation text. Verified against Ra Uru Hu's published chart and 400 random charts from an independent engine.

## Birth-data systems (milestone 1 of the 8-system expansion)
All use `/profile` (now with an optional birth name) and the pop-up form, which asks only for what each system needs (`BIRTH_FIELDS` in `src/profiles.js`). Shared card renderer: `src/card.js`.
- `/numerology`: Pythagorean life path, expression, soul urge, personality, birthday, personal year/month, maturity, pinnacles and challenges, karmic debt; masters 11/22/33 kept.
- `/chinesezodiac`: animal/element/yin-yang by the real lunar new year (new moons and principal terms from astronomy-engine, UTC+8), four pillars from solar terms (year at Lichun, day at 23:00), element balance, trines/clash, this year.
- `/mayan`: Tzolk'in day sign + tone, kin, trecena, Haab', Long Count, Lord of the Night (GMT 584283), bar-and-dot numerals.
- `/egyptian`: the modern "Egyptian zodiac" deity plus the birthday in the Coptic (Egyptian) calendar. Labelled as a modern reconstruction.
- `/celtic`: Graves' tree calendar with ogham letter and fire-festival season. Labelled as a modern reconstruction.

## Cast systems (milestone 2)
- `/runes`: 24 Elder Futhark runes drawn without replacement; one, three (Norns) or five (cross) spreads; reversible runes land merkstave half the time.
- `/oraclebones`: a charge (or the Shang routine ten-day charge), paired with its opposite, cracked on turtle plastron or ox scapula; Shang crack notations; dated with today's real day in the 60-day cycle; labelled as a modern reflection in the Shang format.
- `/ifa`: divining chain with 8 pods, the 16 principal Odù and their marks, 256 combinations; labelled as Ifá-inspired, not a babaláwo consultation; quotes no verses and prescribes no offerings.

Every module returns `headline` (short result) and `reading` (structured data) alongside the embeds, so non-Discord front ends can use it.
Preview any module: `node scripts/preview.js numerology '{"name":"Ada Lovelace","date":"1815-12-10"}'`.

## Local preview
`npm ci && node scripts/try.js humandesign 1990-04-09 "2:30 pm" "Phoenix, USA"` writes `out/bodygraph.png` and `out/embeds.json`.

## Secrets (repo settings)
`ORACLE_DISCORD_APP_ID`, `ORACLE_DISCORD_PUBLIC_KEY`, `ORACLE_DISCORD_BOT_TOKEN`, optional `ORACLE_KEY` (32 random bytes, base64; otherwise derived from the bot token), plus the shared `GH_DISPATCH_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
