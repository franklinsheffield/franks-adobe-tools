// Pixel Scape Activity (Discord D3): serves the Pixel Scape web build (static assets) and swaps the Discord sign-in
// code for an access token. The client secret stays here, never in the page.
//   POST /api/token  { code } -> { access_token }, or 403 { error: "locked" } when the member lacks an access role.
//   GET  /api/room?guild=&room=  (WebSocket) -> the shared room for this call (D4, rooms.mjs; same role gate)
import { Rooms } from "./rooms.mjs";
export { Rooms };
// Role gate: GATE_GUILD_ID + GATE_ROLE_IDS (comma list). Unset = no gate.
export const gateRoles = (env) => String(env.GATE_ROLE_IDS || "").split(",").map((x) => x.trim()).filter(Boolean);
export const hasAccess = (env, roles) => { const need = gateRoles(env); return !need.length || (roles || []).some((r) => need.includes(r)); };
export async function checkMember(env, token, fetchImpl = fetch) {
  if (!env.GATE_GUILD_ID || !gateRoles(env).length) return { ok: true };
  const r = await fetchImpl(`https://discord.com/api/v10/users/@me/guilds/${env.GATE_GUILD_ID}/member`, { headers: { authorization: "Bearer " + token } });
  if (!r.ok) return { ok: false, reason: r.status === 404 ? "not a member" : "member lookup " + r.status };
  const m = await r.json().catch(() => ({}));
  return hasAccess(env, m.roles) ? { ok: true } : { ok: false, reason: "missing role" };
}
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
      const r = await exchange(env, code); if (r.status !== 200) { console.error("token exchange failed", r.status, r.body.error); return json(r.body, r.status); }
      const g = await checkMember(env, r.body.access_token);
      if (!g.ok) { console.log("locked:", g.reason); return json({ error: "locked", message: env.GATE_MESSAGE || "Pixel Scape is locked." }, 403); }
      return json(r.body, 200);
    }
    if (path === "/api/room") {
      if ((req.headers.get("upgrade") || "").toLowerCase() !== "websocket") return json({ error: "WebSocket only" }, 426);
      const guild = url.searchParams.get("guild") || "", room = url.searchParams.get("room") || "";
      const dev = env.DEV_ROOMS === "1" && guild === "dev";
      if (!dev && !/^\d{5,25}$/.test(guild)) return json({ error: "building together works in a server" }, 400);
      if (!/^[\w:.-]{1,100}$/.test(room)) return json({ error: "missing room" }, 400);
      if (!env.ROOMS) return json({ error: "rooms are not set up" }, 503);
      return env.ROOMS.get(env.ROOMS.idFromName("guild:" + guild)).fetch(req);
    }
    if (path === "/api/health") return json({ ok: true, signIn: !!env.DISCORD_CLIENT_SECRET, rooms: !!env.ROOMS, posting: !!env.DISCORD_BOT_TOKEN });
    return env.ASSETS.fetch(req);
  }
};
