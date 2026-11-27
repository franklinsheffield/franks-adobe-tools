# Science is Magic oracle bot

One Discord app for the server's readings: `/oracle` (the fortune teller), `/humandesign`, `/astrology`, `/iching` and `/profile`; more systems plug in as modules.

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

## Local preview
`npm ci && node scripts/try.js humandesign 1990-04-09 "2:30 pm" "Phoenix, USA"` writes `out/bodygraph.png` and `out/embeds.json`.

## Secrets (repo settings)
`ORACLE_DISCORD_APP_ID`, `ORACLE_DISCORD_PUBLIC_KEY`, `ORACLE_DISCORD_BOT_TOKEN`, optional `ORACLE_KEY` (32 random bytes, base64; otherwise derived from the bot token), plus the shared `GH_DISPATCH_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
