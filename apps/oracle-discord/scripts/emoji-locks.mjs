// Role-lock server emoji to the House system roles (pitch: "Role locks and bot emoji").
//   MODE=lock-plan (default) prints what each emoji would be locked to, changes nothing.
//   MODE=lock CONFIRM=swap applies it. MODE=unlock CONFIRM=swap opens every emoji in the map again.
// House crest + cheers -> that House's home and Key roles; cl_* -> its class role; lvN -> level N and up.
// The bot's own role is always added so the bot can still post them. lv_half and conch* stay open until their roles exist.
import { HOUSE_IDS, CLASSES, roleSpecs } from "../activity/src/levels.js";

const API = "https://discord.com/api/v10";
const TOKEN = process.env.DISCORD_BOT_TOKEN, MODE = process.env.MODE || "lock-plan";
const GUILD = process.env.GUILD_ID || "1530029383404884069";
const PFX = { oracle: "or", alchemist: "al", observatory: "ob", parlour: "pa", scriptorium: "sc" };
if (!TOKEN) { console.log("::warning::No bot token; nothing to do."); process.exit(0); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(method, url, body, reason) {
  for (let tries = 0; tries < 6; tries++) {
    const r = await fetch(API + url, { method, headers: { Authorization: `Bot ${TOKEN}`, ...(body ? { "Content-Type": "application/json" } : {}), ...(reason ? { "X-Audit-Log-Reason": encodeURIComponent(reason) } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); if ((j.retry_after || 0) > 60) throw new Error(`rate limited for ${j.retry_after}s`); await sleep(((j.retry_after || 2) + 0.5) * 1000); continue; }
    if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error(`${method} ${url} rate limited too long`);
}

const guild = await api("GET", `/guilds/${GUILD}`);
const me = await api("GET", "/users/@me");
const botRole = guild.roles.find((r) => r.managed && r.tags?.bot_id === me.id);
const byName = new Map(guild.roles.map((r) => [r.name, r]));
const role = {}; // key -> role
for (const s of roleSpecs()) if (byName.has(s.name)) role[s.key] = byName.get(s.name);
const counts = await api("GET", `/guilds/${GUILD}/roles/member-counts`).catch(() => null);
const missing = roleSpecs().filter((s) => !role[s.key]).map((s) => s.name);

const want = {}; // emoji name -> [role keys]
for (const h of HOUSE_IDS) for (const n of ["crest", "cheer", "cheer_still"]) want[`${PFX[h]}_${n}`] = [`home:${h}`, `open:${h}`];
for (const c of Object.values(CLASSES)) want[`cl_${c.id.replace(/-/g, "_")}`] = [`class:${c.id}`];
for (let n = 1; n <= 6; n++) want[`lv${n}`] = [...Array.from({ length: 11 - n }, (_, i) => `lv:${n + i}`), "lv:12"];

console.log(`Server: ${guild.name} | bot role: ${botRole ? botRole.name : "NOT FOUND"} | House roles found: ${Object.keys(role).length}/${roleSpecs().length}`);
if (missing.length) console.log(`Missing roles: ${missing.join(", ")}`);
const plan = [];
for (const [name, keys] of Object.entries(want)) {
  const e = guild.emojis.find((x) => x.name === name);
  if (!e) { console.log(`skip :${name}: (not on server)`); continue; }
  const ids = keys.map((k) => role[k]?.id).filter(Boolean);
  if (!ids.length) { console.log(`skip :${name}: (no roles found for ${keys.join(", ")})`); continue; }
  const roles = MODE === "unlock" ? [] : [...new Set([...ids, ...(botRole ? [botRole.id] : [])])];
  const who = keys.filter((k) => role[k]).map((k) => `${role[k].name}${counts ? ` (${counts[role[k].id] ?? 0})` : ""}`).join(", ");
  console.log(`:${name}: -> ${MODE === "unlock" ? "open to all" : who}`);
  plan.push([e, roles]);
}
if (MODE === "lock-plan") { console.log(`Plan only: ${plan.length} emoji. Nothing changed.`); process.exit(0); }
if (process.env.CONFIRM !== "swap") throw new Error(`MODE=${MODE} needs CONFIRM=swap`);
for (const [e, roles] of plan) { await api("PATCH", `/guilds/${GUILD}/emojis/${e.id}`, { roles }, MODE === "unlock" ? "Unlock emoji" : "House role lock"); }
console.log(`${MODE === "unlock" ? "Unlocked" : "Locked"} ${plan.length} emoji.`);
