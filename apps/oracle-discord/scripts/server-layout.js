// Server layout for the House gate rework, run by .github/workflows/server-layout.yml (the bot token lives in GitHub).
//   node scripts/server-layout.js snapshot   read only: prints every category, channel, its permission overwrites
//                                            (by role name) and the role list, and writes snapshot.json
//   node scripts/server-layout.js plan       read only: lists what stage1 would create
//   node scripts/server-layout.js stage1     creates the new categories and channels HIDDEN from @everyone (the bot
//                                            keeps view). Idempotent: anything with the same name is reused. Moves and
//                                            permission switches happen in stage 2 (switch-on), not here.
import { writeFileSync } from "node:fs";

const mode = process.argv[2], GUILD = process.env.GUILD_ID || "1530029383404884069", token = process.env.DISCORD_BOT_TOKEN;
if (!token) { console.error("DISCORD_BOT_TOKEN missing"); process.exit(1); }
const api = async (path, o = {}) => {
  for (let i = 0; i < 5; i++) {
    const r = await fetch("https://discord.com/api/v10" + path, { ...o, headers: { authorization: "Bot " + token, "content-type": "application/json", ...(o.headers || {}) } });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await new Promise((ok) => setTimeout(ok, Math.ceil((j.retry_after || 1) * 1000))); continue; }
    if (!r.ok) throw new Error(`${o.method || "GET"} ${path}: ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error("rate limited: " + path);
};
const TYPE = { 0: "text", 2: "voice", 4: "CATEGORY", 5: "announce", 13: "stage", 15: "forum", 16: "media" };
// permission bits worth reading at a glance
const BITS = { VIEW: 10n, SEND: 11n, CONNECT: 20n, THREADS: 35n, READ_HISTORY: 16n, REACT: 6n, ATTACH: 15n };
const bits = (s) => Object.entries(BITS).filter(([, b]) => (BigInt(s) >> b) & 1n).map(([k]) => k).join("+") || "-";

// ---- stage 1: the new structure, hidden (server pitch, approved 2026-11-28; move list posted 02:27Z) ----
const T = { text: 0, voice: 2, category: 4, forum: 15 };
const HOUSES = [["🔮", "oracle", "Oracle"], ["⚗️", "alchemist", "Alchemist"], ["🔭", "observatory", "Observatory"], ["🕯️", "parlour", "Parlour"], ["🪶", "scriptorium", "Scriptorium"]];
const CLASSES = ["hermeticist", "astrologer-astronomer", "mentalist", "sibyllist", "astrochemist", "showman-chemist", "cipher-alchemist", "sky-skeptic", "almanac-maker", "document-examiner"];
export const LAYOUT = [
  ...HOUSES.map(([e, slug, name]) => ({ category: `${e} ${name} Wing`, channels: [[T.text, `${e}-${slug}-common`], [T.forum, `${e}-${slug}-notebook`], [T.voice, `${name} Wing Voice`]] })),
  { category: "⛲ The Common Grounds", channels: [[T.text, "⛲-common-grounds"], [T.text, "🪙-market"], [T.text, "🎲-group-activities"], [T.text, "🧰-lab-tools"], [T.voice, "Common Grounds"]] },
  { category: "🏛 Guild Halls", channels: CLASSES.map((c) => [T.text, `🏛-${c}`]) },
  { category: "🕯 The Sealed Path", channels: [[T.text, "🕯-the-sealed-path"], [T.voice, "Sealed Path Lounge"]] },
  { category: "🎭 Backstage", channels: [[T.text, "the-green-room"], [T.voice, "Dressing Room"], [T.text, "the-workshop"]] },
  { category: null, parentName: "Welcome", channels: [[T.text, "🚪-choose-your-house"]] },
];
if (!["snapshot", "plan", "stage1"].includes(mode)) { console.error("usage: server-layout.js snapshot|plan|stage1"); process.exit(2); }
if (mode !== "snapshot") { await stage1(mode === "plan"); process.exit(0); }
const [roles, channels] = await Promise.all([api(`/guilds/${GUILD}/roles`), api(`/guilds/${GUILD}/channels`)]);
const roleName = new Map(roles.map((r) => [r.id, r.id === GUILD ? "@everyone" : r.name]));
const ow = (c) => (c.permission_overwrites || []).map((o) => `${o.type === 0 ? roleName.get(o.id) || o.id : "member:" + o.id} allow[${bits(o.allow)}] deny[${bits(o.deny)}]`).join("; ");
const cats = channels.filter((c) => c.type === 4).sort((a, b) => a.position - b.position);
const kids = (id) => channels.filter((c) => c.parent_id === id && c.type !== 4).sort((a, b) => a.position - b.position);
const line = (c, ind) => console.log(`${ind}${TYPE[c.type] || c.type} #${c.name} (${c.id})${ow(c) ? "  || " + ow(c) : ""}`);
console.log("== Channels ==");
kids(null).forEach((c) => line(c, ""));
for (const cat of cats) { line(cat, ""); kids(cat.id).forEach((c) => line(c, "   ")); }
console.log("\n== Roles (top first) ==");
[...roles].sort((a, b) => b.position - a.position).forEach((r) => console.log(`${r.position} ${roleName.get(r.id)} (${r.id})${r.managed ? " [bot]" : ""}${(BigInt(r.permissions) >> 3n) & 1n ? " [admin]" : ""}`));
writeFileSync(process.env.SNAPSHOT_OUT || "snapshot.json", JSON.stringify({ at: new Date().toISOString(), roles, channels }, null, 1));

async function stage1(dry) {
  const [chans, me] = await Promise.all([api(`/guilds/${GUILD}/channels`), api("/users/@me")]);
  // hidden from everyone; the bot keeps view + manage so stage 2 can move and open them
  const hidden = [{ id: GUILD, type: 0, deny: String(1n << 10n), allow: "0" }, { id: me.id, type: 1, allow: String((1n << 10n) | (1n << 4n) | (1n << 11n) | (1n << 20n)), deny: "0" }];
  const find = (name, type, parent) => chans.find((c) => c.name === name && c.type === type && (parent === undefined || c.parent_id === parent));
  let made = 0;
  const make = async (body) => { if (dry) { console.log("would create:", body.type === 4 ? "CATEGORY" : body.type, body.name); return { id: "dry" }; }
    const c = await api(`/guilds/${GUILD}/channels`, { method: "POST", headers: { "x-audit-log-reason": "House gate rework, stage 1 (hidden)" }, body: JSON.stringify({ ...body, permission_overwrites: hidden }) });
    chans.push(c); made++; console.log("created:", body.name, c.id); return c; };
  for (const g of LAYOUT) {
    let parent = null;
    if (g.category) parent = find(g.category, T.category) || await make({ name: g.category, type: T.category });
    else parent = chans.find((c) => c.type === T.category && c.name === g.parentName);
    if (!parent) { console.warn(`::warning::category ${g.parentName} not found; skipping`); continue; }
    for (const [type, name] of g.channels) if (!find(name, type, dry ? undefined : parent.id)) await make({ name, type, parent_id: parent.id === "dry" ? undefined : parent.id });
  }
  console.log(dry ? "plan only, nothing created" : `${made} created (all hidden from @everyone)`);
}
