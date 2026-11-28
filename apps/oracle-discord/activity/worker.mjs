// Oracle Chamber Activity Worker: serves the Chamber (static build in dist/) and two small APIs.
//   POST /api/token   { code } -> { access_token }   (Discord sign-in; the client secret stays here)
//   DELETE /api/profile  Bearer <access_token> -> { ok } (removes the saved /profile)
//   GET  /api/profile  Bearer <access_token> -> { profile } (the member's own saved /profile, opened with ORACLE_KEY)
//   GET/PUT /api/progress  Bearer <access_token> -> { progress }  (the Chamber game layer: codex, streak, unlocks)
//   GET/POST /api/daily/<game>  Bearer <access_token> -> today's shared daily-challenge board (src/daily.js)
//   POST /api/share  Bearer <access_token> { channelId, title, lines, color } -> { ok }  (a Grimoire page posted by the bot)
//   POST /api/boost  Bearer <access_token> { guildId } -> { boosting, fresh, reward }  (server boosts pay Essence once each)
//   GET/POST /api/party/<star|meteor>  Bearer <access_token> { add } -> the shared Star Party / meteor count (src/starparty/shared.js)
//   POST /api/level  Bearer <access_token> { guildId } -> { gate, grant, founding, roles }  (House gate + bot role sync, src/levels.js)
//   GET  /api/tables?game=&instance=  (WebSocket) -> the call's shared table for a game room (tables.mjs, multiplayer)
import { loadProfile, deleteProfile } from "../src/profiles.js";
import { Tables, tableRoute } from "./tables.mjs";
export { Tables };
import { settleBoost } from "./src/boost.js";
import { partyKey, addToParty, partyView } from "./src/starparty/shared.js";
import { grantFor, rolesWanted, rolesDiff } from "./src/levels.js";

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function exchange(env, code, fetchImpl = fetch) {
  const body = new URLSearchParams({ client_id: env.DISCORD_APP_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code });
  const r = await fetchImpl("https://discord.com/api/v10/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) return { status: r.ok ? 502 : r.status, body: { error: j.error || "token exchange failed" } };
  return { status: 200, body: { access_token: j.access_token } };
}

export async function whoIs(token, fetchImpl = fetch) {
  const r = await fetchImpl("https://discord.com/api/v10/users/@me", { headers: { authorization: "Bearer " + token } });
  return r.ok ? r.json() : null;
}

/** Daily boards: KV "daily:<game>:<day>" = { e: { [userId]: { n, s, w, d, t } } }. First score per player per day counts. */
const DAILY_MAX = 2000; // not exported: a Worker module may only export handlers and classes
export function boardView(doc, meId, day) {
  const all = Object.entries((doc && doc.e) || {}).map(([id, x]) => ({ id, ...x })).sort((a, b) => b.s - a.s || a.t - b.t);
  const row = (x) => ({ name: x.n, score: x.s, won: !!x.w, detail: x.d || "", me: x.id === meId });
  const i = all.findIndex((x) => x.id === meId);
  return { day, count: all.length, top: all.slice(0, 10).map(row), me: i >= 0 ? { rank: i + 1, ...row(all[i]) } : null };
}
async function daily(req, env, game, url) {
  if (!/^[a-z0-9-]{1,24}$/.test(game)) return json({ error: "unknown game" }, 404);
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token.length > 200) return json({ error: "sign in first" }, 401);
  if (!env.PROFILES) return json({ error: "storage not set up" }, 503);
  const me = await whoIs(token);
  if (!me || !me.id) return json({ error: "sign in first" }, 401);
  const today = new Date().toISOString().slice(0, 10), yday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (req.method === "GET") {
    const day = url.searchParams.get("day") === yday ? yday : today;
    return json(boardView(await env.PROFILES.get(`daily:${game}:${day}`, "json"), me.id, day));
  }
  if (req.method !== "POST") return json({ error: "GET or POST" }, 405);
  const b = await req.json().catch(() => null);
  if (!b || typeof b.score !== "number" || !Number.isFinite(b.score) || Math.abs(b.score) > 1e7) return json({ error: "bad score" }, 400);
  const day = b.day === yday ? yday : today, key = `daily:${game}:${day}`; // a run started just before midnight still counts for its day
  const doc = (await env.PROFILES.get(key, "json")) || { e: {} };
  if (!doc.e[me.id] && Object.keys(doc.e).length < DAILY_MAX) {
    doc.e[me.id] = { n: String(me.global_name || me.username || "traveller").slice(0, 32), s: Math.round(b.score), w: b.won ? 1 : 0, d: String(b.detail || "").slice(0, 80), t: Date.now() };
    await env.PROFILES.put(key, JSON.stringify(doc), { expirationTtl: 60 * 60 * 24 * 8 });
  }
  return json(boardView(doc, me.id, day));
}

/** Star Party and meteor-watch counts: KV "party:star:<week>" / "party:meteor:<shower-year>" = { total, e }. */
async function party(req, env, kind) {
  if (kind !== "star" && kind !== "meteor") return json({ error: "unknown party" }, 404);
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token.length > 200) return json({ error: "sign in first" }, 401);
  if (!env.PROFILES) return json({ error: "storage not set up" }, 503);
  const me = await whoIs(token);
  if (!me || !me.id) return json({ error: "sign in first" }, 401);
  const key = partyKey(kind);
  if (!key) return json({ key: null, total: 0, count: 0, top: [], you: 0 });
  if (req.method === "GET") return json(partyView(await env.PROFILES.get(key, "json"), me.id, key));
  if (req.method !== "POST") return json({ error: "GET or POST" }, 405);
  const b = await req.json().catch(() => null);
  const before = await env.PROFILES.get(key, "json"), was = JSON.stringify(before);
  const doc = addToParty(before, kind, { id: me.id, name: me.global_name || me.username }, b && b.add);
  if (JSON.stringify(doc) !== was) await env.PROFILES.put(key, JSON.stringify(doc), { expirationTtl: 60 * 60 * 24 * 60 });
  return json(partyView(doc, me.id, key));
}

/** Is this member boosting the guild? The bot reads their member record (premium_since); each boost pays once. */
/** Post a Grimoire page to the Activity's channel as an embed, from the bot. Text only, trimmed; one per member per minute. */
export async function sharePage(env, me, body, fetchImpl = fetch) {
  const { channelId, title, lines, color, kind } = body || {}, prof = kind === "profile"; // kind "profile": the member's profile card
  if (!env.DISCORD_BOT_TOKEN || !/^\d{5,25}$/.test(String(channelId || ""))) return { ok: false, error: "sharing is not available here" };
  if (env.PROFILES) { const k = "share:" + me.id, last = await env.PROFILES.get(k, "json"); if (last && Date.now() - last.at < 60000) return { ok: false, error: "one page a minute" }; await env.PROFILES.put(k, JSON.stringify({ at: Date.now() })); }
  const clean = (t, n) => String(t || "").replace(/@(everyone|here)/gi, "@\u200b$1").replace(/<@[!&]?\d+>/g, "").slice(0, n);
  const desc = (Array.isArray(lines) ? lines : []).slice(0, 14).map((l) => clean(l, 140)).join("\n");
  const name = me.global_name || me.username || "A seeker";
  const embed = { title: clean(`${prof ? "🪪" : "📖"} ${title || "A page from Your Grimoire"}`, 200), description: desc || "…", color: /^#?[0-9a-f]{6}$/i.test(String(color || "")) ? parseInt(String(color).replace("#", ""), 16) : 0xe2b04a,
    footer: { text: clean(prof ? `${name} · Science is Magic Oracle Chamber` : `From ${name}'s Grimoire · Science is Magic Oracle Chamber`, 120) } };
  const r = await fetchImpl(`https://discord.com/api/v10/channels/${channelId}/messages`, { method: "POST", headers: { authorization: "Bot " + env.DISCORD_BOT_TOKEN, "content-type": "application/json" }, body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } }) }).catch(() => null);
  return r && r.ok ? { ok: true } : { ok: false, error: "the bot could not post in this channel" };
}

export async function boostCheck(env, userId, guildId, fetchImpl = fetch) {
  if (!env.DISCORD_BOT_TOKEN || !/^\d{5,25}$/.test(String(guildId || ""))) return { boosting: false, fresh: false, reward: 0 };
  const r = await fetchImpl(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, { headers: { authorization: "Bot " + env.DISCORD_BOT_TOKEN } });
  const member = r.ok ? await r.json().catch(() => null) : null;
  const key = "boost:" + userId, out = settleBoost(member, await env.PROFILES.get(key, "json"));
  if (out.fresh) await env.PROFILES.put(key, JSON.stringify(out.ledger));
  return { boosting: out.boosting, fresh: out.fresh, reward: out.reward, since: out.since };
}

/** The House gate and the bot's role sync (server pitch, approved 2026-11-28). Env: HOUSE_GATE "on" switches the gate on;
 *  SWITCH_AT (ISO time) marks Founding Members (joined before it); LEVEL_GRANTS {"userId": level} (dev.n 6, Frank 12);
 *  ROLE_IDS {"roleKey": "roleId"} from scripts/house-roles.js. KV "scholar:<id>" = Scholar's Path points (migration).
 *  The game is the source of truth: each launch adds the roles the member has earned and removes managed roles they
 *  haven't; roles not in ROLE_IDS (staff and the rest) are never touched. Off or unconfigured, nothing changes. */
const parse = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
export async function levelSync(env, userId, guildId, fetchImpl = fetch) {
  const gate = env.HOUSE_GATE === "on", out = { gate, grant: 0, founding: false, roles: null };
  if (!env.DISCORD_BOT_TOKEN || !/^\d{5,25}$/.test(String(guildId || "")) || (env.GUILD_ID && String(guildId) !== String(env.GUILD_ID))) return out;
  const base = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, auth = { authorization: "Bot " + env.DISCORD_BOT_TOKEN };
  const r = await fetchImpl(base, { headers: auth }).catch(() => null);
  const member = r && r.ok ? await r.json().catch(() => null) : null;
  if (!member) return out;
  const scholar = env.PROFILES ? await env.PROFILES.get("scholar:" + userId, "json").catch(() => null) : null;
  Object.assign(out, grantFor({ userId, joinedAt: member.joined_at, switchAt: env.SWITCH_AT, scholarPoints: Number(scholar) || 0, grants: parse(env.LEVEL_GRANTS, {}) }));
  const ids = parse(env.ROLE_IDS, null);
  if (!gate || !ids || !env.PROFILES) return out;
  const p = (await env.PROFILES.get("progress:" + userId, "json")) || {};
  const diff = rolesDiff(member.roles, rolesWanted({ ...p, grant: out.grant, founding: out.founding }), ids);
  const ops = [...diff.add.map((id) => ["PUT", id]), ...diff.remove.map((id) => ["DELETE", id])].slice(0, 16);
  let failed = 0;
  for (const [method, id] of ops) {
    const x = await fetchImpl(`${base}/roles/${id}`, { method, headers: { ...auth, "x-audit-log-reason": "Science is Magic Server level sync" } }).catch(() => null);
    if (!x || !x.ok) failed++;
  }
  out.roles = { added: diff.add.length, removed: diff.remove.length, failed };
  return out;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname.replace(/^\/\.proxy/, "");
    if (path === "/api/token") {
      if (req.method !== "POST") return json({ error: "POST only" }, 405);
      if (!env.DISCORD_CLIENT_SECRET) return json({ error: "sign-in is not set up yet" }, 503);
      const { code } = await req.json().catch(() => ({}));
      if (!code || typeof code !== "string" || code.length > 200) return json({ error: "missing code" }, 400);
      const r = await exchange(env, code);
      if (r.status !== 200) console.error("token exchange failed", r.status, r.body.error);
      return json(r.body, r.status);
    }
    if (path === "/api/profile") {
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token || token.length > 200) return json({ error: "sign in first" }, 401);
      const me = await whoIs(token);
      if (!me || !me.id) return json({ error: "sign in first" }, 401);
      if (req.method === "DELETE") { if (env.PROFILES) await deleteProfile(env, me.id); return json({ ok: true, profile: null }); } // "My charts" delete button
      return json({ profile: await loadProfile(env, me.id) });
    }
    if (path === "/api/progress") {
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token || token.length > 200) return json({ error: "sign in first" }, 401);
      if (!env.PROFILES) return json({ error: "storage not set up" }, 503);
      const me = await whoIs(token);
      if (!me || !me.id) return json({ error: "sign in first" }, 401);
      const key = "progress:" + me.id;
      if (req.method === "GET") return json({ progress: await env.PROFILES.get(key, "json") });
      if (req.method !== "PUT") return json({ error: "GET or PUT" }, 405);
      const text = await req.text();
      if (text.length > 32000) return json({ error: "too large" }, 413);
      let p; try { p = JSON.parse(text); } catch { return json({ error: "bad json" }, 400); }
      if (!p || typeof p !== "object" || p.v !== 1) return json({ error: "bad progress" }, 400);
      await env.PROFILES.put(key, JSON.stringify(p));
      return json({ ok: true });
    }
    if (path.startsWith("/api/daily/")) return daily(req, env, path.slice(11), url);
    if (path.startsWith("/api/party/")) return party(req, env, path.slice(11));
    if (path === "/api/boost") {
      if (req.method !== "POST") return json({ error: "POST only" }, 405);
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token || token.length > 200) return json({ error: "sign in first" }, 401);
      if (!env.PROFILES) return json({ error: "storage not set up" }, 503);
      const me = await whoIs(token);
      if (!me || !me.id) return json({ error: "sign in first" }, 401);
      const { guildId } = await req.json().catch(() => ({}));
      return json(await boostCheck(env, me.id, guildId));
    }
    if (path === "/api/level") {
      if (req.method !== "POST") return json({ error: "POST only" }, 405);
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token || token.length > 200) return json({ error: "sign in first" }, 401);
      const me = await whoIs(token);
      if (!me || !me.id) return json({ error: "sign in first" }, 401);
      const { guildId } = await req.json().catch(() => ({}));
      return json(await levelSync(env, me.id, guildId));
    }
    if (path === "/api/share") {
      if (req.method !== "POST") return json({ error: "POST only" }, 405);
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!token || token.length > 200) return json({ error: "sign in first" }, 401);
      const me = await whoIs(token);
      if (!me || !me.id) return json({ error: "sign in first" }, 401);
      return json(await sharePage(env, me, await req.json().catch(() => ({}))));
    }
    if (path === "/api/tables") return tableRoute(req, env, url);
    if (path === "/api/health") return json({ ok: true, signIn: !!env.DISCORD_CLIENT_SECRET, profiles: !!env.PROFILES, tables: !!env.TABLES });
    return env.ASSETS.fetch(req);
  },
};
