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

## Role gate (Science is Magic)
Both pieces only open for members of the Science is Magic server who hold one of the roles in `GATE_ROLE_IDS`
(Pixel Scape Access, Hierophant, Patron of the Lab). Set in `wrangler.toml` and `activity/wrangler.toml`; leave it empty to open to everyone.
- `/terrain` checks `member.roles` on the interaction and answers with a private "sealed" note otherwise.
- The Activity asks for `guilds.members.read`, and `/api/token` checks `/users/@me/guilds/{GATE_GUILD_ID}/member`. It returns 403 `locked` (no token) when the role is missing, and the web build shows a "Sealed" screen.

## Building together (D4)

Everyone in a call who opens the Activity shares one scene. The Activity Worker routes `/.proxy/api/room?guild=&room=`
(WebSocket) to a Durable Object (`activity/rooms.mjs`, class `Rooms`, SQLite storage), one per Discord server, one room
per Activity instance. Up to 8 builders per room.

- Join: the page sends its Discord token; the room checks the member (and the role gate above) and, when the bot can
  see the call, that they are in it. Then it sends the shared scene, or the first builder's scene seeds the room.
- Edits: each object has a network id; after each committed edit the page sends only what changed. Meshes, photos and
  sculpt grids travel once as content-addressed blobs (gzip, 512 KB chunks). Selected = locked for the others, shown as
  an outline in that builder's colour with their name. Drags stream live. Undo only undoes your own edits. Cameras are
  your own.
- Room bar: **Save** (to this server's library), **Library** (open a saved scene for everyone), **Post render** (renders
  on your device, the bot posts the PNG to the call's channel, or #pixel-scape-play when the call can't be confirmed).
- Tests: `npm test` (room logic over node:sqlite); browsers in one room:
  `cd activity && npx wrangler dev --port 8799 --var DEV_ROOMS:1`, then in `apps/worlds-brew-app`:
  `npm run web && node web/multi-smoke.js http://127.0.0.1:8799`. Locally an edit reaches the other browser in 2 to 5 ms.
