// House gate setup, run by .github/workflows/house-gate.yml (the bot token lives in GitHub secrets).
//   node scripts/house-gate-setup.js roles  -> checks the bot can manage roles, creates any missing House gate roles
//                                              (no permissions, reused by name), finds the grants, gate stays OFF
//   node scripts/house-gate-setup.js on     -> the same, plus HOUSE_GATE=on and SWITCH_AT (Founding cut-off)
//   node scripts/house-gate-setup.js off    -> HOUSE_GATE=off only (the kill switch)
// Writes the Worker secrets as JSON to $SECRETS_OUT for `wrangler secret bulk`. Grants (Frank 2026-11-28 01:47Z):
// the server owner (Frank) level 12, dev.n level 6.
import { writeFileSync } from "node:fs";
import { roleSpecs } from "../activity/src/levels.js";

const mode = process.argv[2], GUILD = process.env.GUILD_ID || "1530029383404884069", token = process.env.DISCORD_BOT_TOKEN;
const out = process.env.SECRETS_OUT || "house-gate-secrets.json";
if (!["roles", "on", "off"].includes(mode)) { console.error("usage: house-gate-setup.js roles|on|off"); process.exit(2); }
const save = (o) => { writeFileSync(out, JSON.stringify(o)); console.log("secrets to set:", Object.keys(o).join(", ")); };
if (mode === "off") { save({ HOUSE_GATE: "off" }); process.exit(0); }
if (!token) { console.error("DISCORD_BOT_TOKEN missing"); process.exit(1); }

const api = async (path, o = {}) => {
  for (let i = 0; i < 4; i++) {
    const r = await fetch("https://discord.com/api/v10" + path, { ...o, headers: { authorization: "Bot " + token, "content-type": "application/json", ...(o.headers || {}) } });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await new Promise((s) => setTimeout(s, Math.ceil((j.retry_after || 1) * 1000))); continue; }
    if (!r.ok) throw new Error(`${o.method || "GET"} ${path}: ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error("rate limited: " + path);
};

// 1. Can the bot manage roles? (Manage Roles = 1<<28, Administrator = 1<<3)
const [guild, roles, me] = await Promise.all([api(`/guilds/${GUILD}`), api(`/guilds/${GUILD}/roles`), api("/users/@me")]);
const bot = await api(`/guilds/${GUILD}/members/${me.id}`);
const mine = roles.filter((r) => bot.roles.includes(r.id) || r.id === GUILD), perms = mine.reduce((a, r) => a | BigInt(r.permissions), 0n);
const top = Math.max(...mine.map((r) => r.position));
if (!(perms & (1n << 28n)) && !(perms & (1n << 3n))) { console.error("The bot does not have Manage Roles yet."); process.exit(1); }
console.log(`bot ${me.username}: Manage Roles OK, highest role position ${top}`);

// 2. Create the missing roles (reused by name, never renamed or duplicated).
const byName = new Map(roles.map((r) => [r.name, r])), ids = {}; let made = 0;
for (const spec of roleSpecs()) {
  const have = byName.get(spec.name);
  if (have) { ids[spec.key] = have.id; if (have.position >= top) console.warn(`::warning::"${spec.name}" sits above the bot's role; the bot can't assign it until it is dragged below.`); continue; }
  const r = await api(`/guilds/${GUILD}/roles`, { method: "POST", headers: { "x-audit-log-reason": "Science is Magic House gate roles" },
    body: JSON.stringify({ name: spec.name, color: spec.color || 0, hoist: !!spec.hoist, mentionable: false, permissions: "0" }) });
  ids[spec.key] = r.id; made++; console.log("created:", spec.name);
}
console.log(`${made} roles created, ${Object.keys(ids).length} managed in all`);

// 3. Grants: the owner is Frank (12); dev.n by username (6).
const grants = { [guild.owner_id]: 12 };
const found = await api(`/guilds/${GUILD}/members/search?query=${encodeURIComponent("dev.n")}&limit=10`).catch(() => []);
const dev = found.find((m) => [m.user.username, m.user.global_name, m.nick].some((n) => String(n || "").toLowerCase() === "dev.n"));
if (dev) { grants[dev.user.id] = 6; console.log("dev.n found: level 6 grant"); } else console.warn("::warning::dev.n not found by name; no level 6 grant set. Re-run once their username is confirmed.");

const s = { ROLE_IDS: JSON.stringify(ids), LEVEL_GRANTS: JSON.stringify(grants), GUILD_ID: GUILD, HOUSE_GATE: mode === "on" ? "on" : "off" };
if (mode === "on") s.SWITCH_AT = process.env.SWITCH_AT || new Date().toISOString();
if (s.SWITCH_AT) console.log("Founding cut-off (SWITCH_AT):", s.SWITCH_AT);
save(s);
