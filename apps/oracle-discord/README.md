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

## The Oracle Chamber (Discord Activity)
`activity/`: the full-screen fortune-teller experience. Pick a system, give the Oracle your question or birth details, and she reveals the reading with the chart art, a journal of your last 20 readings (on that device) and your saved `/profile` filled in.
- Readings run in the browser with the same modules as the bot (`build.mjs` bundles every module in `MODULES`, swapping resvg, `node:fs` and `node:url` for shims in `activity/src/shims/`), so they always match the chat version.
- `activity/worker.mjs` (Worker `oracle-chamber`): serves the build, swaps the Discord sign-in code for a token (`DISCORD_CLIENT_SECRET`, from repo secret `ORACLE_DISCORD_CLIENT_SECRET`) and returns the member's own saved profile.
- Discord Developer Portal: Activities on, URL mapping `/` -> the `oracle-chamber` Worker host and `/osm` -> `nominatim.openstreetmap.org`, OAuth2 redirect `https://127.0.0.1`. Then set `ACTIVITY_READY = "true"` in `wrangler.toml` so the bot's **Enter the Chamber** button launches it.
- Local: `node activity/build.mjs`, then serve `activity/dist/` and open it in a browser (sign-in and profile are skipped outside Discord).

## Human Design
`src/humandesign/`: chart (26 activations, design moment at 88° of solar arc, true node), branded bodygraph PNG, and original Science is Magic interpretation text. Verified against Ra Uru Hu's published chart and 400 random charts from an independent engine.

## Local preview
`npm ci && node scripts/try.js humandesign 1990-04-09 "2:30 pm" "Phoenix, USA"` writes `out/bodygraph.png` and `out/embeds.json`.

## Secrets (repo settings)
`ORACLE_DISCORD_APP_ID`, `ORACLE_DISCORD_PUBLIC_KEY`, `ORACLE_DISCORD_BOT_TOKEN`, optional `ORACLE_KEY` (32 random bytes, base64; otherwise derived from the bot token), plus the shared `GH_DISPATCH_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
