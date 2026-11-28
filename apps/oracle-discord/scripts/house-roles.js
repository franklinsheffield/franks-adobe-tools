// Create the House gate's Discord roles once (names and colours approved by Frank 2026-11-28 01:59Z).
//   DISCORD_BOT_TOKEN=... node scripts/house-roles.js            dry run: lists roles to create, changes nothing
//   DISCORD_BOT_TOKEN=... node scripts/house-roles.js --create   creates the missing ones (hidden: no permissions)
// Prints ROLE_IDS JSON for the Chamber Worker: `wrangler secret put ROLE_IDS` (from activity/). Roles that already exist
// (same name) are reused, never duplicated or renamed. The bot needs Manage Roles, and its role must sit above these.
import { roleSpecs } from "../activity/src/levels.js";

const GUILD = process.env.GUILD_ID || "1530029383404884069", token = process.env.DISCORD_BOT_TOKEN, create = process.argv.includes("--create");
if (!token) { console.error("Set DISCORD_BOT_TOKEN first."); process.exit(1); }
const api = (path, o = {}) => fetch("https://discord.com/api/v10" + path, { ...o, headers: { authorization: "Bot " + token, "content-type": "application/json", ...(o.headers || {}) } });

const existing = await api(`/guilds/${GUILD}/roles`).then((r) => (r.ok ? r.json() : Promise.reject(new Error("could not read roles: " + r.status))));
const byName = new Map(existing.map((r) => [r.name, r.id])), ids = {};
for (const spec of roleSpecs()) {
  if (byName.has(spec.name)) { ids[spec.key] = byName.get(spec.name); continue; }
  if (!create) { console.log("would create:", spec.name); continue; }
  const r = await api(`/guilds/${GUILD}/roles`, { method: "POST", headers: { "x-audit-log-reason": "Science is Magic House gate roles" },
    body: JSON.stringify({ name: spec.name, color: spec.color || 0, hoist: !!spec.hoist, mentionable: false, permissions: "0" }) });
  if (!r.ok) { console.error("failed:", spec.name, r.status, await r.text()); continue; }
  ids[spec.key] = (await r.json()).id; console.log("created:", spec.name);
  await new Promise((s) => setTimeout(s, 600)); // stay under Discord's role-create rate limit
}
console.log("\nROLE_IDS=" + JSON.stringify(ids));
