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
