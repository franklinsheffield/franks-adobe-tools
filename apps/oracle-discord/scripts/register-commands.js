// Registers the oracle's slash commands globally. Env: DISCORD_BOT_TOKEN (app id comes from the token).
import { MODULES } from "../src/registry.js";
const auth = { authorization: "Bot " + (process.env.DISCORD_BOT_TOKEN || "").trim() };
const me = await fetch("https://discord.com/api/v10/oauth2/applications/@me", { headers: auth });
if (!me.ok) { console.error("bot token check failed:", me.status, await me.text()); process.exit(1); }
const app = await me.json();
const commands = [];
for (const m of MODULES) commands.push((await import(`../src/modules/${m}/index.js`)).command);
const r = await fetch(`https://discord.com/api/v10/applications/${app.id}/commands`, {
  method: "PUT", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify(commands),
});
console.log(`registered ${commands.map((c) => "/" + c.name).join(" ")} for "${app.name}":`, r.status);
if (!r.ok) { console.error(await r.text()); process.exit(1); }
