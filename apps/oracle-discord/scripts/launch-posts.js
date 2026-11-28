// Launch posts for the House gate (Frank approved 2026-11-28: the announcement, and both Deven letters sent WITH it).
//   node scripts/launch-posts.js plan   read only: prints where each message goes and its length
//   node scripts/launch-posts.js send   posts launch/announcement.md to #announcements, then DMs dev.n the quest
//                                       letter and the three command-letter messages. Run once, after stage 2 + gate on.
import { readFileSync } from "node:fs";
const mode = process.argv[2], GUILD = process.env.GUILD_ID || "1530029383404884069", token = process.env.DISCORD_BOT_TOKEN;
const ANNOUNCE = process.env.ANNOUNCE_CHANNEL || "1575201206823952585"; // #announcements
if (!["plan", "send"].includes(mode)) { console.error("usage: launch-posts.js plan|send"); process.exit(2); }
if (!token) { console.error("DISCORD_BOT_TOKEN missing"); process.exit(1); }
const api = async (path, o = {}) => {
  for (let i = 0; i < 5; i++) {
    const r = await fetch("https://discord.com/api/v10" + path, { ...o, headers: { authorization: "Bot " + token, ...(o.body ? { "content-type": "application/json" } : {}) } });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await new Promise((ok) => setTimeout(ok, Math.ceil((j.retry_after || 1) * 1000))); continue; }
    if (!r.ok) throw new Error(`${o.method || "GET"} ${path}: ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error("rate limited: " + path);
};
const text = (f) => readFileSync(new URL(`./launch/${f}`, import.meta.url), "utf8").trim();
const found = await api(`/guilds/${GUILD}/members/search?query=${encodeURIComponent("dev.n")}&limit=10`);
const dev = found.find((m) => [m.user.username, m.user.global_name, m.nick].some((n) => String(n || "").toLowerCase() === "dev.n"));
if (!dev) { console.error("dev.n not found in the server; nothing sent"); process.exit(1); }
const letters = [text("deven-quest.md").replace("{name}", "Deven"), text("deven-commands-1.md"), text("deven-commands-2.md"), text("deven-commands-3.md")];
const announcement = text("announcement.md");
for (const [where, body] of [["#announcements", announcement], ...letters.map((b, i) => [`DM dev.n (${i + 1}/4)`, b])]) {
  if (body.length > 2000) { console.error(`${where} is ${body.length} characters (max 2000); nothing sent`); process.exit(1); }
  console.log(`${where}: ${body.length} characters`);
}
if (mode === "plan") process.exit(0);
const none = { parse: [] }; // no pings from the text
const a = await api(`/channels/${ANNOUNCE}/messages`, { method: "POST", body: JSON.stringify({ content: announcement, allowed_mentions: none }) });
console.log("announcement posted:", a.id);
const dm = await api("/users/@me/channels", { method: "POST", body: JSON.stringify({ recipient_id: dev.user.id }) });
for (const body of letters) { const m = await api(`/channels/${dm.id}/messages`, { method: "POST", body: JSON.stringify({ content: body, allowed_mentions: none }) }); console.log("letter sent:", m.id); }
console.log("launch posts done");
