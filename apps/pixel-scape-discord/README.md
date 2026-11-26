# Pixel Scape Discord bot (D1)

`/terrain place:<name or lat,lon> [size:km] [view] [format] [relief]` posts a rendered image and a `.glb` of real terrain to the channel.

Runs for $0:

- **Cloudflare Worker** (`worker/index.mjs`): Discord interactions endpoint. Checks the Ed25519 signature, replies "thinking..." at once, starts the render job, 1 request per member per minute.
- **GitHub Actions** (`.github/workflows/pixel-scape-render.yml` → `scripts/job.js`): geocodes (OpenStreetMap Nominatim), builds the terrain (AWS Terrain Tiles elevation + Sentinel-2 L2A true colour, `src/`), renders it headless with Three.js in Chrome, and edits the reply with the files. About 1 to 3 minutes. Files over the upload limit (10 MB, `MAX_UPLOAD_MB`) fall back to a 1024 px texture, then image only.
- **Deploy** (`.github/workflows/pixel-scape-deploy.yml`): on merge to main, runs tests, deploys the Worker with its secrets and registers the slash commands. Skips the deploy until the secrets exist.

Repo secrets: `DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GH_DISPATCH_TOKEN` (fine-grained, this repo, Actions read/write).

After the first deploy, paste the Worker URL (shown in the deploy run summary) into Discord Developer Portal > General Information > Interactions Endpoint URL.

Local: `npm test`; `node scripts/try.js "36.10,-112.11" 10 out` (build + render); `DRY_RUN=out PLACE="36.10,-112.11" node scripts/job.js` (full job without posting).

Next: switch `src/` to Terrain Lab's shared `apps/worlds-brew-app/geo/` modules once Terrain Lab 0.11 is on main (same data sources), so the bot and the desktop app build identical terrain.

Imagery: Copernicus Sentinel-2 (ESA) via AWS Open Data. Elevation: AWS Terrain Tiles (Mapzen terrarium).
