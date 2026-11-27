// Terms of Service and Privacy Policy pages for the Pixel Scape Discord app (linked from the Developer Portal).
const DATE = "27 November 2026";
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Pixel Scape</title>
<style>:root{color-scheme:dark}body{margin:0;background:#0b0d10;color:#e8ecef;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:720px;margin:0 auto;padding:40px 16px 64px}h1{font-size:28px;margin:0 0 4px}h2{font-size:18px;margin:28px 0 6px;color:#5effc8}p,li{color:#c9d1d8}small{color:#8a96a0}a{color:#5effc8}</style></head>
<body><main><h1>${title}</h1><small>Pixel Scape for Discord · last updated ${DATE}</small>${body}<p><small><a href="terms">Terms of Service</a> · <a href="privacy">Privacy Policy</a></small></p></main></body></html>`;

export const TERMS = page("Terms of Service", `
<p>Pixel Scape for Discord ("Pixel Scape") is a free Discord app made by the Science is Magic community. It has a <b>/terrain</b> command that builds 3D terrain of real places, and an Activity where members build 3D scenes together. By using it you agree to these terms.</p>
<h2>Using Pixel Scape</h2>
<ul><li>You must follow <a href="https://discord.com/terms">Discord's Terms of Service</a> and <a href="https://discord.com/guidelines">Community Guidelines</a>, and the rules of the server you use it in.</li>
<li>Server admins decide who can use it (for example with access roles).</li>
<li>Don't use it to post anything illegal, hateful, sexual, or that you don't have the rights to, and don't try to break, overload or abuse the service.</li></ul>
<h2>Your content</h2>
<p>You keep the rights to scenes, pictures and models you make or upload. You let Pixel Scape store and show them to the people in your room and server, and post renders you choose to share to the channel, so the app can work. Content you share is visible to other members of that server.</p>
<h2>Map and terrain data</h2>
<p>Terrain uses public data: elevation from AWS Terrain Tiles, imagery from Copernicus Sentinel-2, and place search from OpenStreetMap (© OpenStreetMap contributors). Their own licences apply. Terrain is for creative use and is not accurate enough for navigation, safety or survey work.</p>
<h2>No warranty</h2>
<p>Pixel Scape is provided free and "as is", without any warranty. It may change, pause or stop at any time, and saved scenes may be removed. To the extent the law allows, the makers are not liable for any loss from using it.</p>
<h2>Ending use</h2>
<p>We may block anyone who breaks these terms. You can stop using Pixel Scape any time by removing the app or leaving the server.</p>
<h2>Changes and contact</h2>
<p>We may update these terms; the date above shows the latest version. Questions: ask in the Science is Magic Discord server.</p>`);

export const PRIVACY = page("Privacy Policy", `
<p>This policy explains what the Pixel Scape Discord app collects and why. We keep it to what the app needs to work. We don't sell data or show ads.</p>
<h2>What we collect</h2>
<ul><li><b>Your Discord account basics</b> when you open the Activity: your user ID, username/display name, and whether you're a member of the server and have its access role. This comes from Discord when you approve the sign-in.</li>
<li><b>What you build</b>: the scene in your room (objects, settings, uploaded pictures, models and heightmaps) and scenes you save to the server's library, with your name as the builder.</li>
<li><b>/terrain requests</b>: the place, options and your username, used to build and post the result.</li>
<li><b>Basic logs</b> kept by our hosting (Cloudflare and GitHub) for errors and abuse, for a short time.</li></ul>
<h2>How we use it</h2>
<p>Only to run Pixel Scape: show who is in a room, sync scenes, keep the library, post renders you ask to share, and limit abuse (for example one render post every 20 seconds).</p>
<h2>Who sees it</h2>
<p>People in your room and server see your name and what you build. Renders you post go to the Discord channel. Place searches are sent to OpenStreetMap's search service. Data is stored by our hosts, Cloudflare and GitHub. We share nothing else, except if the law requires it.</p>
<h2>How long we keep it</h2>
<p>Rooms are deleted 30 days after they were last used; unused uploaded files sooner. Saved library scenes stay until the builder removes them or the app is shut down. Sign-in tokens are not stored by us.</p>
<h2>Your choices</h2>
<p>You can delete your saved scenes in the Library, stop using the app at any time, or ask us to delete your data by asking in the Science is Magic Discord server. Pixel Scape is not meant for anyone under 13 (or the minimum age for Discord where you live).</p>
<h2>Changes</h2>
<p>We may update this policy; the date above shows the latest version.</p>`);
