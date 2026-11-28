// Pixel Scape level 6 reward post (Frank approved 2026-11-28 03:05Z): a reply under the Houses launch announcement.
//   node scripts/pixel-scape-reply.js plan   read only: finds the announcement and checks the length
//   node scripts/pixel-scape-reply.js send   posts launch/pixel-scape-level6.md as a reply to it (once: skips if already posted)
import { readFileSync } from "node:fs";
const mode = process.argv[2], token = process.env.DISCORD_BOT_TOKEN;
const ANNOUNCE = process.env.ANNOUNCE_CHANNEL || "1575201206823952585"; // #announcements
if (!["plan", "send"].includes(mode)) { console.error("usage: pixel-scape-reply.js plan|send"); process.exit(2); }
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
const body = readFileSync(new URL("./launch/pixel-scape-level6.md", import.meta.url), "utf8").trim();
if (body.length > 2000) { console.error(`reply is ${body.length} characters (max 2000); nothing sent`); process.exit(1); }
const me = await api("/users/@me"), recent = await api(`/channels/${ANNOUNCE}/messages?limit=50`);
const launch = recent.find((m) => m.author.id === me.id && m.content.startsWith("# 🚪 The Houses are open"));
if (!launch) { console.error("Houses launch announcement not found in #announcements; nothing sent"); process.exit(1); }
const done = recent.find((m) => m.author.id === me.id && m.message_reference && m.message_reference.message_id === launch.id && m.content.includes("Level 6 reward: Pixel Scape"));
console.log(`announcement ${launch.id}; reply ${body.length} characters; already posted: ${done ? done.id : "no"}`);
if (mode === "plan" || done) process.exit(0);
const m = await api(`/channels/${ANNOUNCE}/messages`, { method: "POST", body: JSON.stringify({ content: body, allowed_mentions: { parse: [] }, message_reference: { message_id: launch.id, fail_if_not_exists: true } }) });
console.log("reply posted:", m.id, `https://discord.com/channels/1530029383404884069/${ANNOUNCE}/${m.id}`);
