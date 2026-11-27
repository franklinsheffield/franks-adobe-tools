// Oracle Chamber Activity Worker: serves the Chamber (static build in dist/) and two small APIs.
//   POST /api/token   { code } -> { access_token }   (Discord sign-in; the client secret stays here)
//   GET  /api/profile  Bearer <access_token> -> { profile } (the member's own saved /profile, opened with ORACLE_KEY)
import { loadProfile } from "../src/profiles.js";

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
    if (path === "/api/health") return json({ ok: true, signIn: !!env.DISCORD_CLIENT_SECRET, profiles: !!env.PROFILES });
    return env.ASSETS.fetch(req);
  },
};
