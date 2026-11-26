// Pixel Scape Activity (Discord D3): serves the Pixel Scape web build (static assets) and swaps the Discord sign-in
// code for an access token. The client secret stays here, never in the page.
//   POST /api/token  { code } -> { access_token }
export async function exchange(env, code, fetchImpl = fetch) {
  const body = new URLSearchParams({ client_id: env.DISCORD_APP_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code });
  const r = await fetchImpl("https://discord.com/api/v10/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) return { status: r.ok ? 502 : r.status, body: { error: j.error || "token exchange failed" } };
  return { status: 200, body: { access_token: j.access_token } };
}
const json = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname.replace(/^\/\.proxy/, "");
    if (path === "/api/token") {
      if (req.method !== "POST") return json({ error: "POST only" }, 405);
      if (!env.DISCORD_CLIENT_SECRET) return json({ error: "sign-in is not set up yet" }, 503);
      const { code } = await req.json().catch(() => ({}));
      if (!code || typeof code !== "string" || code.length > 200) return json({ error: "missing code" }, 400);
      const r = await exchange(env, code); if (r.status !== 200) console.error("token exchange failed", r.status, r.body.error);
      return json(r.body, r.status);
    }
    if (path === "/api/health") return json({ ok: true, signIn: !!env.DISCORD_CLIENT_SECRET });
    return env.ASSETS.fetch(req);
  }
};
