// Server layout for the House gate rework, run by .github/workflows/server-layout.yml (the bot token lives in GitHub).
//   node scripts/server-layout.js snapshot   read only: prints every category, channel, its permission overwrites
//                                            (by role name) and the role list, and writes snapshot.json
import { writeFileSync } from "node:fs";

const mode = process.argv[2], GUILD = process.env.GUILD_ID || "1530029383404884069", token = process.env.DISCORD_BOT_TOKEN;
if (!token) { console.error("DISCORD_BOT_TOKEN missing"); process.exit(1); }
const api = async (path) => {
  const r = await fetch("https://discord.com/api/v10" + path, { headers: { authorization: "Bot " + token } });
  if (!r.ok) throw new Error(`GET ${path}: ${r.status} ${await r.text()}`);
  return r.json();
};
const TYPE = { 0: "text", 2: "voice", 4: "CATEGORY", 5: "announce", 13: "stage", 15: "forum", 16: "media" };
// permission bits worth reading at a glance
const BITS = { VIEW: 10n, SEND: 11n, CONNECT: 20n, THREADS: 35n, READ_HISTORY: 16n, REACT: 6n, ATTACH: 15n };
const bits = (s) => Object.entries(BITS).filter(([, b]) => (BigInt(s) >> b) & 1n).map(([k]) => k).join("+") || "-";

if (mode !== "snapshot") { console.error("usage: server-layout.js snapshot"); process.exit(2); }
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
