// Stage 2 of the House gate rework (the switch-on), run by .github/workflows/server-layout.yml.
//   node scripts/server-switch.js plan2    read only: prints every move, rename, permission set and role grant
//   node scripts/server-switch.js stage2   does them. Re-runnable: moves and permission PUTs are idempotent and
//                                          members who already hold Founding Member are skipped.
// Turning the game gate on (HOUSE_GATE=on, SWITCH_AT) is the separate "House gate" workflow, mode "on", run straight after.
// Library forums (📚), StratNav, the Hive's own category, Frank's Domus, the Salon and the Athenaeum are never touched.
import { CLASSES, HOUSE_IDS, HOUSE_ROLES } from "../activity/src/levels.js";

const mode = process.argv[2], GUILD = process.env.GUILD_ID || "1530029383404884069", token = process.env.DISCORD_BOT_TOKEN;
if (!["plan2", "stage2"].includes(mode)) { console.error("usage: server-switch.js plan2|stage2"); process.exit(2); }
if (!token) { console.error("DISCORD_BOT_TOKEN missing"); process.exit(1); }
const dry = mode === "plan2", REASON = { "x-audit-log-reason": "House gate rework, stage 2 (switch-on)" };
const api = async (path, o = {}) => {
  for (let i = 0; i < 6; i++) {
    const r = await fetch("https://discord.com/api/v10" + path, { ...o, headers: { authorization: "Bot " + token, ...(o.body ? { "content-type": "application/json" } : {}), ...(o.headers || {}) } });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await new Promise((ok) => setTimeout(ok, Math.ceil((j.retry_after || 1) * 1000))); continue; }
    if (!r.ok) throw new Error(`${o.method || "GET"} ${path}: ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error("rate limited: " + path);
};
const B = (...n) => String(n.reduce((a, b) => a | (1n << BigInt(b)), 0n));
// VIEW 10, SEND 11, READ_HISTORY 16, CONNECT 20, SPEAK 21, CREATE_PUBLIC_THREADS 35, SEND_IN_THREADS 38, EMBEDDED_ACTIVITIES 39
const VIEW = B(10, 16), TALK = B(10, 11, 16, 20, 21, 35, 38, 39), POST = B(11, 20, 21, 35, 38), NOPOST = B(11, 21, 35, 38);

const [roles, chans, me] = await Promise.all([api(`/guilds/${GUILD}/roles`), api(`/guilds/${GUILD}/channels`), api("/users/@me")]);
const R = (name) => { const r = roles.find((x) => x.name === name); if (!r) throw new Error("role not found: " + name); return r.id; };
const C = (name, type) => chans.find((c) => c.name === name && (type === undefined || c.type === type));
const cat = (name) => C(name, 4), kids = (c) => chans.filter((x) => x.parent_id === c.id);
const ow = (id, allow = "0", deny = "0") => ({ id, type: 0, allow, deny });
const BOT = { id: me.id, type: 1, allow: B(4, 10, 11, 16, 20), deny: "0" };
const STAFF = R("Hierophant"), FOUND = R("Founding Member");
const LV = (from) => [4, 5, 6, 7, 8, 9, 10, 12].filter((n) => n >= from).map((n) => roles.find((r) => r.name.startsWith(`Lv ${n} `))?.id).filter(Boolean);
const opens = (h) => [R(HOUSE_ROLES[h].name), R(HOUSE_ROLES[h].key)]; // home House role or its Key
const SLUG = { oracle: ["🔮", "Oracle", "🔮-oracle"], alchemist: ["⚗️", "Alchemist", "⚗️-laboratory"], observatory: ["🔭", "Observatory", "🔭-observatory"], parlour: ["🕯️", "Parlour", "🕯️-parlour"], scriptorium: ["🪶", "Scriptorium", "🪶-scriptorium"] };
// Hall map (approved 2026-11-28 02:26Z): who may post. Everyone can still read. The Scriptorium opens every hall.
const HALLS = { "🦉 Hall of Inquiry": ["alchemist", "observatory", "parlour", "scriptorium"], "⚕️ Hall of Vitality": ["alchemist", "oracle", "scriptorium"],
  "🌱 Hall of Growth": ["alchemist", "observatory", "scriptorium"], "⚒️ Hall of Craft": ["parlour", "oracle", "scriptorium"], "🎭 Hall of Verse": ["oracle", "parlour", "scriptorium"] };

const steps = [];
const perms = (c, list, why) => c && steps.push({ k: "perms", c, list: [...list, BOT], why });
const move = (c, parent, why) => c && c.parent_id !== parent.id && steps.push({ k: "move", c, parent, why });
const rename = (c, name) => c && c.name !== name && steps.push({ k: "rename", c, name });
const gated = (allowIds) => [ow(GUILD, "0", B(10)), ow(STAFF, TALK), ...allowIds.map((id) => ow(id, TALK))];

// 1. Wings: hidden except to members who opened that House (home role or Key), Founding Members and staff.
//    The House's game channel moves in and stays readable by everyone, so visitors can still open /play for a taster.
for (const h of HOUSE_IDS) {
  const [e, name, game] = SLUG[h], wing = cat(`${e} ${name} Wing`), who = [...opens(h), FOUND];
  if (!wing) throw new Error(`${name} Wing missing: run stage1 first`);
  perms(wing, gated(who), `${name} Wing: ${HOUSE_ROLES[h].name} / ${HOUSE_ROLES[h].key} / Founding`);
  kids(wing).forEach((c) => perms(c, gated(who), "  same as its wing"));
  const g = C(game, 0); move(g, wing, `game channel into the ${name} Wing`);
  perms(g, [ow(GUILD, VIEW, NOPOST), ow(STAFF, TALK), ...who.map((id) => ow(id, TALK))], "  everyone reads + launches /play; posting for the House");
}
const spiritual = C("🧪-spiritual", 0), oracleWing = cat("🔮 Oracle Wing");
move(spiritual, oracleWing, "into the Oracle Wing");
perms(spiritual, [ow(GUILD, VIEW, NOPOST), ow(STAFF, TALK), ...[...opens("oracle"), FOUND].map((id) => ow(id, TALK))], "  everyone reads; posting for Oracle");

// 2. Halls: everyone reads; posting by the hall map (+ Scriptorium, Founding, staff). 📚 library forums untouched.
for (const [hall, houses] of Object.entries(HALLS)) {
  const c = cat(hall); if (!c) { console.warn(`::warning::${hall} not found`); continue; }
  const who = [...new Set([...houses, "scriptorium"])].flatMap(opens).concat(FOUND);
  const list = [ow(GUILD, "0", NOPOST), ow(STAFF, TALK), ...who.map((id) => ow(id, POST))];
  perms(c, list, `${hall}: posting for ${[...new Set([...houses, "scriptorium"])].join(", ")} + Founding`);
  kids(c).filter((k) => !k.name.startsWith("📚")).forEach((k) => perms(k, list, "  same as its hall"));
}

// 3. Level spaces.
const cg = cat("⛲ The Common Grounds"), hive = R("Order of the Hive");
perms(cg, gated([...LV(4), FOUND, hive]), "Common Grounds: level 4+, Founding, Order of the Hive");
cg && kids(cg).forEach((c) => perms(c, gated([...LV(4), FOUND, hive]), "  same"));
const guild = cat("🏛 Guild Halls"), classRoles = Object.values(CLASSES).map((c) => [c.id, R(c.name)]);
perms(guild, gated(classRoles.map(([, id]) => id)), "Guild Halls: any class role (level 2+)");
classRoles.forEach(([id, role]) => perms(C(`🏛-${id}`, 0), gated([role]), `  #🏛-${id}: that class only`));
const sealed = cat("🕯 The Sealed Path");
perms(sealed, gated(LV(6)), "Sealed Path: level 6+"); sealed && kids(sealed).forEach((c) => perms(c, gated(LV(6)), "  same"));
// Backstage keeps stage 1's hidden state (half-step and level 11 have no roles yet); staff can see it.
const back = cat("🎭 Backstage"); perms(back, gated([]), "Backstage: staff only for now"); back && kids(back).forEach((c) => perms(c, gated([]), "  same"));
// Pixel Scape: level 6+ or Founding (Frank 01:58Z); #🧪-pixel-scape keeps its own Pixel Scape Access list.
const px = cat("🧪 Pixel Scape"), pxWho = [...LV(6), FOUND, R("Pixel Scape Access")];
perms(px, gated(pxWho), "Pixel Scape: level 6+, Founding, Pixel Scape Access");
px && kids(px).filter((c) => c.name !== "🧪-pixel-scape").forEach((c) => perms(c, gated(pxWho), "  same"));

// 4. The Threshold.
const welcome = cat("Welcome"); rename(welcome, "🚪 The Threshold"); rename(C("scholars-path", 0), "your-path");
perms(C("🚪-choose-your-house", 0), [ow(GUILD, VIEW, NOPOST), ow(STAFF, TALK)], "#🚪-choose-your-house: everyone reads, only the bot posts");

// 5. Founding Member + Lv 4 for every member here now (the game re-syncs each member's real roles when they play).
let members = [];
try { for (let after = "0"; ;) { const page = await api(`/guilds/${GUILD}/members?limit=1000&after=${after}`); members.push(...page); if (page.length < 1000) break; after = page.at(-1).user.id; } }
catch (e) { console.warn("::warning::can't list members (turn on Server Members Intent for the bot):", e.message); members = null; }
const lv4 = LV(4)[0], humans = (members || []).filter((m) => !m.user.bot), todo = humans.filter((m) => !m.roles.includes(FOUND));

// Without the grants every current member would lose posting, so stage 2 refuses to run until it can list members.
if (!dry && !members) { console.error("Stopped before changing anything: turn on Server Members Intent for the bot, then rerun stage2."); process.exit(1); }
console.log(`== Stage 2 ${dry ? "PLAN (nothing changes)" : "RUN"} ==`);
for (const s of steps) {
  const label = s.k === "move" ? `move #${s.c.name} -> ${s.parent.name} (${s.why})` : s.k === "rename" ? `rename ${s.c.name} -> ${s.name}` : `perms #${s.c.name}: ${s.why}`;
  console.log(label);
  if (dry) continue;
  if (s.k === "move") await api(`/channels/${s.c.id}`, { method: "PATCH", headers: REASON, body: JSON.stringify({ parent_id: s.parent.id }) });
  if (s.k === "rename") await api(`/channels/${s.c.id}`, { method: "PATCH", headers: REASON, body: JSON.stringify({ name: s.name }) });
  if (s.k === "perms") await api(`/channels/${s.c.id}`, { method: "PATCH", headers: REASON, body: JSON.stringify({ permission_overwrites: s.list }) });
}
console.log(members ? `Founding Member + Lv 4: ${todo.length} of ${humans.length} members still need them` : "Founding Member grants: skipped (member list unavailable)");
if (!dry) for (const m of todo) for (const r of [FOUND, lv4]) if (!m.roles.includes(r)) await api(`/guilds/${GUILD}/members/${m.user.id}/roles/${r}`, { method: "PUT", headers: REASON });
console.log(dry ? `plan only: ${steps.length} channel changes, nothing done` : `done: ${steps.length} channel changes, ${todo.length} members granted`);
