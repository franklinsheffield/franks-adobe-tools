// Oracle Chamber multiplayer: shared tables for any game room (Constellation Rummy first; Element Duel, Grimoire Memory and
// others can reuse it). One Durable Object per Discord call (Activity instance) and game. The server knows nothing about
// the game's rules: the HOST's client runs the game and the server only relays.
//   - Everyone who opens the game in the same call joins its table (up to MAX_SEATS people). The first to arrive hosts.
//   - The host sends to one member, a list, or everyone ("*"); every other member's messages go to the host only.
//   - The host can store a snapshot of the game; if the host leaves, the next member becomes host and gets the snapshot.
// Wire (JSON text frames). client -> table:
//   hello {token} | {dev, name}      to {to: "*" | id | [ids], m}  (host only)      up {m}      snap {s}  (host only)
// table -> client:
//   welcome {you, members, host, snap?}   members {members, host}   msg {from, m}   host {snap}   error {error, fatal?}
// Members are { id, name } with id = the Discord user id ("dev:<name>" in local dev).
export const MAX_SEATS = 8;
const SNAP_MAX = 120 * 1024, MSG_MAX = 64 * 1024, API = "https://discord.com/api/v10";

/** Who is this? A Discord sign-in token -> { id, name }. Local dev (DEV_ROOMS=1): { dev: true, name }. */
export async function identify(env, hello, f = fetch) {
  if (hello.dev) {
    if (env.DEV_ROOMS !== "1") throw new Error("sign in through Discord");
    const name = String(hello.name || "Guest").replace(/[^\w ' -]/g, "").slice(0, 24) || "Guest";
    return { id: "dev:" + name, name };
  }
  if (!hello.token || typeof hello.token !== "string" || hello.token.length > 200) throw new Error("sign-in needed");
  const r = await f(API + "/users/@me", { headers: { authorization: "Bearer " + hello.token } });
  if (!r.ok) throw new Error("Discord sign-in expired, reopen the Activity");
  const u = await r.json();
  return { id: String(u.id), name: String(u.global_name || u.username || "Stargazer").slice(0, 40) };
}

/** The table logic over Durable Object storage and hibernatable sockets (tests pass a fake ctx). */
export class Table {
  constructor(ctx, env, f) { this.ctx = ctx; this.env = env || {}; this.f = f || ((...a) => fetch(...a)); }
  meta(ws) { return ws.deserializeAttachment() || {}; }
  setMeta(ws, m) { ws.serializeAttachment(m); }
  socks() { return this.ctx.getWebSockets().filter((w) => this.meta(w).ok); }
  send(ws, o) { try { ws.send(typeof o === "string" ? o : JSON.stringify(o)); } catch (e) { /* gone */ } }
  members() {
    const seen = new Map();
    for (const w of this.socks()) { const m = this.meta(w); if (!seen.has(m.id)) seen.set(m.id, m); }
    return [...seen.values()].sort((a, b) => a.at - b.at).map((m) => ({ id: m.id, name: m.name }));
  }
  async host() {
    const ms = this.members(); if (!ms.length) return null;
    let h = await this.ctx.storage.get("host");
    if (!ms.some((m) => m.id === h)) { h = ms[0].id; await this.ctx.storage.put("host", h); return { id: h, changed: true }; }
    return { id: h, changed: false };
  }
  async roster() {
    const h = await this.host(), members = this.members(), o = JSON.stringify({ t: "members", members, host: h && h.id });
    for (const w of this.socks()) this.send(w, o);
    if (h && h.changed) { const snap = (await this.ctx.storage.get("snap")) || null; for (const w of this.socks()) if (this.meta(w).id === h.id) this.send(w, { t: "host", snap }); }
  }

  async message(ws, data) {
    if (typeof data !== "string" || data.length > SNAP_MAX + 1024) return;
    let x; try { x = JSON.parse(data); } catch (e) { return; }
    if (!x || typeof x.t !== "string") return;
    const m = this.meta(ws);
    if (x.t === "hello") return this.hello(ws, m, x);
    if (!m.ok) return this.send(ws, { t: "error", error: "say hello first" });
    const h = await this.host(), isHost = h && h.id === m.id;
    if (x.t === "up") {
      if (JSON.stringify(x.m ?? null).length > MSG_MAX) return;
      if (isHost) return; // the host plays on its own client
      for (const w of this.socks()) if (this.meta(w).id === h.id) this.send(w, { t: "msg", from: m.id, m: x.m });
      return;
    }
    if (x.t === "to") {
      if (!isHost) return this.send(ws, { t: "error", error: "only the host can deal" });
      if (JSON.stringify(x.m ?? null).length > MSG_MAX) return this.send(ws, { t: "error", error: "message too big" });
      const to = x.to === "*" ? null : new Set([].concat(x.to).map(String)), o = JSON.stringify({ t: "msg", from: m.id, m: x.m });
      for (const w of this.socks()) { const id = this.meta(w).id; if (id !== m.id && (!to || to.has(id))) this.send(w, o); }
      return;
    }
    if (x.t === "snap") {
      if (!isHost) return;
      const s = JSON.stringify(x.s ?? null); if (s.length > SNAP_MAX) return this.send(ws, { t: "error", error: "game too big to save" });
      await this.ctx.storage.put("snap", x.s ?? null); return;
    }
  }

  async hello(ws, m, x) {
    if (m.ok) return;
    let who;
    try { who = await identify(this.env, x, this.f); } catch (e) { this.send(ws, { t: "error", error: e.message, fatal: true }); return ws.close(4001, "not allowed"); }
    // the same person in a second window replaces the first
    for (const w of this.socks()) if (this.meta(w).id === who.id) { const o = this.meta(w); o.ok = false; this.setMeta(w, o); try { w.close(4003, "opened elsewhere"); } catch (e) { /* gone */ } }
    if (this.members().length >= MAX_SEATS) { this.send(ws, { t: "error", error: `this table is full (${MAX_SEATS} people)`, fatal: true }); return ws.close(4002, "full"); }
    Object.assign(m, who, { ok: true, at: Date.now() }); this.setMeta(ws, m);
    if (!this.members().some((p) => p.id !== who.id)) await this.ctx.storage.delete(["host", "snap"]); // an empty table starts fresh
    const h = await this.host();
    this.send(ws, { t: "welcome", you: who, members: this.members(), host: h.id, snap: h.id === who.id ? (await this.ctx.storage.get("snap")) || null : null });
    const o = JSON.stringify({ t: "members", members: this.members(), host: h.id });
    for (const w of this.socks()) if (w !== ws) this.send(w, o);
  }

  async close(ws) {
    const m = this.meta(ws); if (!m.ok) return;
    m.ok = false; this.setMeta(ws, m);
    await this.roster();
  }
}

/** The Durable Object (WebSocket Hibernation API: it sleeps between messages, the sockets stay open). */
export class Tables {
  constructor(ctx, env) { this.ctx = ctx; this.table = new Table(ctx, env); }
  async fetch() {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server); this.table.setMeta(server, { ok: false });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, data) { try { await this.table.message(ws, data); } catch (e) { console.error("table message", (e && e.stack) || e); } }
  async webSocketClose(ws, code) { await this.table.close(ws); try { ws.close(code === 1005 ? 1000 : code, "bye"); } catch (e) { /* closed */ } }
  async webSocketError(ws) { await this.table.close(ws); }
}

/** The Worker's route: GET /api/tables?game=<id>&instance=<Activity instance id> (WebSocket upgrade). */
export function tableRoute(req, env, url) {
  if ((req.headers.get("upgrade") || "").toLowerCase() !== "websocket") return new Response(JSON.stringify({ error: "WebSocket only" }), { status: 426 });
  const game = url.searchParams.get("game") || "", inst = url.searchParams.get("instance") || "";
  if (!/^[a-z][a-z0-9-]{1,23}$/.test(game) || !/^[\w:.-]{1,100}$/.test(inst)) return new Response(JSON.stringify({ error: "missing game or call" }), { status: 400 });
  if (!env.TABLES) return new Response(JSON.stringify({ error: "multiplayer is not set up" }), { status: 503 });
  return env.TABLES.get(env.TABLES.idFromName(game + ":" + inst)).fetch(req);
}
