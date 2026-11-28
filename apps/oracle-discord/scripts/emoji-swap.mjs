// Swap server emoji: back up and remove the RETIRE list, then upload the House kit emoji.
// MODE=plan (default) changes nothing: it prints the server's emoji, slot math and bot permission.
// MODE=apply needs CONFIRM=swap. Retired images are saved to emoji-backup/ first (uploaded as a workflow artifact).
import fs from "node:fs";
import path from "node:path";

const API = "https://discord.com/api/v10";
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const MODE = process.env.MODE || "plan";
const CHANNEL = process.env.CHANNEL || "1575683489712439467"; // #🔮-oracle, used to find the guild
const RETIRE = (process.env.RETIRE || "").split(",").map((s) => s.trim()).filter(Boolean);
const KIT_DIR = path.resolve(process.env.KIT_DIR || "brand/houses/emoji");
const LIMITS = { 0: 50, 1: 100, 2: 150, 3: 250 };
const MANAGE_EXPRESSIONS = 1n << 30n, ADMIN = 1n << 3n;

if (!TOKEN) { console.log("::warning::No bot token; nothing to do."); process.exit(0); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(method, url, body, reason) {
  for (let tries = 0; tries < 6; tries++) {
    const r = await fetch(API + url, { method, headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json", ...(reason ? { "X-Audit-Log-Reason": encodeURIComponent(reason) } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await sleep(((j.retry_after || 2) + 0.5) * 1000); continue; }
    if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error(`${method} ${url} rate limited too long`);
}

const ch = await api("GET", `/channels/${CHANNEL}`);
const gid = ch.guild_id;
const guild = await api("GET", `/guilds/${gid}`);
const me = await api("GET", "/users/@me");
const member = await api("GET", `/guilds/${gid}/members/${me.id}`);
let perms = 0n;
for (const role of guild.roles) if (role.id === gid || member.roles.includes(role.id)) perms |= BigInt(role.permissions);
const canManage = guild.owner_id === me.id || (perms & ADMIN) !== 0n || (perms & MANAGE_EXPRESSIONS) !== 0n;
const limit = LIMITS[guild.premium_tier] ?? 50;
const emojis = guild.emojis;
const count = (list, anim) => list.filter((e) => !!e.animated === anim).length;

const kit = fs.readdirSync(KIT_DIR).filter((f) => /^(or|al|ob|pa|sc)_[a-z_]+\.(png|gif)$/.test(f)).sort();
const kitNames = new Set(kit.map((f) => f.replace(/\.(png|gif)$/, "")));
const toAdd = kit.filter((f) => !emojis.some((e) => e.name === f.replace(/\.(png|gif)$/, "")));
const addStatic = toAdd.filter((f) => f.endsWith(".png")).length, addAnim = toAdd.length - addStatic;
const retire = emojis.filter((e) => RETIRE.includes(e.name) && !kitNames.has(e.name));
const missing = RETIRE.filter((n) => !emojis.some((e) => e.name === n));
const after = (anim) => count(emojis, anim) - count(retire, anim) + (anim ? addAnim : addStatic);

console.log(`Server: ${guild.name} | boost tier ${guild.premium_tier} | limit ${limit} static + ${limit} animated`);
console.log(`Bot ${me.username}: can manage emoji = ${canManage}`);
for (const role of guild.roles) if (role.id === gid || member.roles.includes(role.id)) {
  const p = BigInt(role.permissions);
  console.log(`  role "${role.id === gid ? "@everyone" : role.name}" (managed=${!!role.managed}): admin=${!!(p & ADMIN)} manageExpressions=${!!(p & MANAGE_EXPRESSIONS)} createExpressions=${!!(p & (1n << 43n))}`);
}
const named = guild.roles.filter((r) => /oracle|science/i.test(r.name)).map((r) => `${r.name}${member.roles.includes(r.id) ? " [bot has it]" : ""}: manageExpressions=${!!(BigInt(r.permissions) & MANAGE_EXPRESSIONS)}`);
console.log(`  roles named Oracle/Science: ${named.join("; ") || "none"}`);
console.log(`Now: ${count(emojis, false)} static, ${count(emojis, true)} animated`);
console.log(`Server emoji: ${emojis.map((e) => `${e.name}${e.animated ? "(a)" : ""}`).sort().join(", ")}`);
console.log(`Retire ${retire.length}: ${retire.map((e) => e.name + (e.animated ? "(a)" : "")).join(", ")}`);
if (missing.length) console.log(`Not on server (skipped): ${missing.join(", ")}`);
console.log(`Upload ${toAdd.length}: ${addStatic} static, ${addAnim} animated`);
console.log(`After: ${after(false)} static, ${after(true)} animated`);
const fits = after(false) <= limit && after(true) <= limit;
if (!fits) console.log("::error::The new set does not fit the slot limit; retire more first.");
if (MODE !== "apply") { console.log("Plan only. Nothing changed."); process.exit(fits && canManage ? 0 : 1); }
if (process.env.CONFIRM !== "swap") throw new Error("MODE=apply needs CONFIRM=swap");
if (!canManage) throw new Error("Bot lacks Manage Expressions on this server");
if (!fits) throw new Error("Does not fit");

fs.mkdirSync("emoji-backup", { recursive: true });
for (const e of retire) {
  const ext = e.animated ? "gif" : "png";
  const r = await fetch(`https://cdn.discordapp.com/emojis/${e.id}.${ext}?size=128`);
  if (!r.ok) throw new Error(`backup ${e.name} failed: ${r.status}`);
  fs.writeFileSync(`emoji-backup/${e.name}.${ext}`, Buffer.from(await r.arrayBuffer()));
}
console.log(`Backed up ${retire.length} to emoji-backup/`);
for (const e of retire) { await api("DELETE", `/guilds/${gid}/emojis/${e.id}`, null, "House kit swap (retired, backed up)"); console.log(`removed :${e.name}:`); }
for (const f of toAdd) {
  const b64 = fs.readFileSync(path.join(KIT_DIR, f)).toString("base64");
  const name = f.replace(/\.(png|gif)$/, "");
  await api("POST", `/guilds/${gid}/emojis`, { name, image: `data:image/${f.endsWith(".gif") ? "gif" : "png"};base64,${b64}` }, "House kit emoji");
  console.log(`added :${name}:`);
}
const fin = (await api("GET", `/guilds/${gid}/emojis`));
console.log(`Done: ${count(fin, false)} static, ${count(fin, true)} animated`);
