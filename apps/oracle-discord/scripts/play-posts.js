// The one-tap Play cards (src/play-posts.js), run by .github/workflows/play-posts.yml.
//   node scripts/play-posts.js plan   read only: prints each card, its channel, and whether one is already there
//   node scripts/play-posts.js send   posts each card (or edits the one already there) and pins it. Re-runnable.
import { HOSTS } from "../activity/src/hosts/index.js";
import { playPosts, isPlayCard } from "../src/play-posts.js";
const mode = process.argv[2], GUILD = process.env.GUILD_ID || "1530029383404884069", token = process.env.DISCORD_BOT_TOKEN;
if (!["plan", "send"].includes(mode)) { console.error("usage: play-posts.js plan|send"); process.exit(2); }
if (!token) { console.error("DISCORD_BOT_TOKEN missing"); process.exit(1); }
const api = async (path, o = {}) => {
  for (let i = 0; i < 5; i++) {
    const r = await fetch("https://discord.com/api/v10" + path, { ...o, headers: { authorization: "Bot " + token, ...(o.body ? { "content-type": "application/json" } : {}), "x-audit-log-reason": "Science is Magic Play cards" } });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await new Promise((ok) => setTimeout(ok, Math.ceil((j.retry_after || 1) * 1000))); continue; }
    if (!r.ok) throw new Error(`${o.method || "GET"} ${path}: ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error("rate limited: " + path);
};
const me = await api("/users/@me"), chans = await api(`/guilds/${GUILD}/channels`);
// The Wing text channels, so a later change can route /play there too (printed only).
for (const c of chans.filter((x) => x.type === 0 && /-common$/.test(x.name))) console.log(`wing channel #${c.name} = ${c.id}`);
const link = (c, m) => `https://discord.com/channels/${GUILD}/${c}/${m}`;
for (const { channelId, label, body } of playPosts(HOSTS)) {
  const ch = chans.find((c) => c.id === channelId);
  if (!ch) { console.warn(`::warning::${label} (${channelId}) not found; skipped`); continue; }
  const pins = await api(`/channels/${channelId}/pins`).catch(() => []), recent = await api(`/channels/${channelId}/messages?limit=50`).catch(() => []);
  const have = [...pins, ...recent].find((m) => isPlayCard(m, me.id));
  console.log(`#${ch.name}: "${body.embeds[0].title}" (${body.embeds[0].description.length} chars), button "${body.components[0].components[0].label}"; ${have ? `edit ${have.id}` : "new post"}`);
  if (mode === "plan") continue;
  const m = have ? await api(`/channels/${channelId}/messages/${have.id}`, { method: "PATCH", body: JSON.stringify(body) })
    : await api(`/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify(body) });
  if (!m.pinned) await api(`/channels/${channelId}/pins/${m.id}`, { method: "PUT" }).catch((e) => console.warn(`::warning::could not pin in #${ch.name}: ${e.message}`));
  console.log("  done:", link(channelId, m.id));
}
