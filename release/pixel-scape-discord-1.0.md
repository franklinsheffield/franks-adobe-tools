# Pixel Scape in Discord 1.0

Pixel Scape now lives in the Science is Magic Discord: a bot that builds real terrain, and an Activity where up to 8 members build 3D worlds together.

## What's new

**/terrain (bot)**
- `/terrain place:<name or lat,lon>` posts a rendered image and a `.glb` model of the real place, built from real elevation and Sentinel-2 satellite imagery. Options: size (1 to 40 km), view (oblique or top-down), format (image, .glb or both), relief.
- Ready in about 1 to 3 minutes. One build per member per minute.

**/model (3D library)**
- About 6,800 free models (CC0, CC BY, public domain) from Frank's library, with previews, licence and credit.
- `/model find query:<words>` shows the 5 best matches, `/model random` picks one (🎲 Another for more), `/model show` brings up one by name.
- The same library is in the Activity's **3D library** card, so you can drop models straight into a shared scene.

**/pixelscape (Activity launcher)**
- `/pixelscape` opens Pixel Scape right in the channel. You can also start it from the rocket (App Launcher) in a voice call or in #🌍-pixel-scape-play.

**Building together**
- Everyone in the call joins the same room and sees the same scene live. Each builder has their own colour and name tag.
- Selecting an object locks it to you, and others see your drags as they happen.
- Undo only undoes your own edits.
- Pictures, models and heightmaps are shared automatically. Late joiners get the whole scene.
- **Save** keeps the scene in the server's library. **Library** reopens any saved scene for everyone.
- **Post render** posts a 1920x1080 image to the call's channel (or #🌍-pixel-scape-play). One post per 20 seconds.
- Rooms are kept for 30 days.

## Who can use it
- Members of Science is Magic with a Pixel Scape access role. Others get a private "locked" note.
- The app is verified by Discord (team Science is Magic), so the Activity opens for every member with access.
- Terms: https://pixel-scape-activity.science-is-magic.workers.dev/terms · Privacy: https://pixel-scape-activity.science-is-magic.workers.dev/privacy

## Under the hood
- $0 hosting: Cloudflare Workers + a Durable Object per server (SQLite) for rooms, and GitHub Actions for terrain renders.
- PRs: #15, #18-#22 (bot, web build, Activity), #25 (role gate), #31 (building together), #49 (/pixelscape), #54 (3D library), #109 (terms and privacy).
