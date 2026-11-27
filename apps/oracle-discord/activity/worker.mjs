// Oracle Chamber Activity Worker: serves the Chamber (static build in dist/) and two small APIs.
//   POST /api/token   { code } -> { access_token }   (Discord sign-in; the client secret stays here)
//   GET  /api/profile  Bearer <access_token> -> { profile } (the member's own saved /profile, opened with ORACLE_KEY)
//   GET/PUT /api/progress  Bearer <access_token> -> { progress }  (the Chamber game layer: codex, streak, unlocks)
//   POST /api/boost  Bearer <access_token> { guildId } -> { boosting, fresh, reward }  (server boosts pay Essence once each)
import { loadProfile } from "../src/profiles.js";
import { settleBoost } from "./src/boost.js";

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

/** Is this member boosting the guild? The bot reads their member record (premium_since); each boost pays once. */
export async function boostCheck(env, userId, guildId, fetchImpl = fetch) {
  if (!env.DISCORD_BOT_TOKEN || !/^\d{5,25}$/.test(String(guildId || ""))) return { boosting: false, fresh: false, reward: 0 };
  const r = await fetchImpl(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, { headers: { authorization: "Bot " + env.DISCORD_BOT_TOKEN } });
  const member = r.ok ? await r.json().catch(() => null) : null;
  const key = "boost:" + userId, out = settleBoost(member, await env.PROFILES.get(key, "json"));
  if (out.fresh) await env.PROFILES.put(key, JSON.stringify(out.ledger));
  return { boosting: out.boosting, fresh: out.fresh, reward: out.reward, since: out.since };
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
    if (path === "/api/health") return json({ ok: true, signIn: !!env.DISCORD_CLIENT_SECRET, profiles: !!env.PROFILES });
    return env.ASSETS.fetch(req);
  },
};
