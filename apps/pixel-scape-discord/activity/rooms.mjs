// Pixel Scape Activity (Discord D4): building together. One Durable Object per Discord server ("guild"); inside it,
// one room per Activity instance (one call). The room holds the shared scene, who is in it (up to 8 builders), what
// each builder has selected (selected = locked for everyone else), the server's scene library, and the big pieces the
// scenes use (meshes, photos, sculpt grids) as content-addressed blobs sent in chunks under the 1 MiB WebSocket limit.
// Each device renders on its own; a render can be posted to the call's channel by the bot.
//
// Wire (JSON text frames): client -> room
//   hello {token, instance, channel} | {dev, name}     put {nid, o}   del {nid}   env {e}   lock {nid|null}   live {nid, p}
//   replace {objs:[{nid,o}], env, cam, name}           get {h}        save {name} lib    open {id}   unsave {id}   post {h, caption}
// room -> client: welcome, join, left, put, del, env, lock, live, scene, nack, lib, saved, posted, missing, full, error
// Binary frames carry blob chunks both ways: [u32 header length][header JSON {t:"chunk", h, i, n}][bytes]
export const MAX_BUILDERS = 8;
export const COLORS = ["#FF5A5A", "#FF6B9E", "#FFD166", "#7AA2FF", "#C38BFF", "#FF9F5A", "#4DE1FF", "#B8F35A"];
export const CHUNK = 512 * 1024;
const MAX_CHUNKS = 160, MAX_OBJ = 256 * 1024, MAX_OBJS = 400, POST_MAX = 10 * 1024 * 1024, POST_GAP = 20000;
const ROOM_TTL = 30 * 864e5, BLOB_GRACE = 864e5, API = "https://discord.com/api/v10";
export const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS rooms (room TEXT PRIMARY KEY, env TEXT, cam TEXT, name TEXT, at INTEGER)",
  "CREATE TABLE IF NOT EXISTS objs (room TEXT, nid TEXT, ord INTEGER, data TEXT, PRIMARY KEY (room, nid))",
  "CREATE TABLE IF NOT EXISTS blobs (h TEXT, i INTEGER, n INTEGER, d BLOB, at INTEGER, PRIMARY KEY (h, i))",
  "CREATE TABLE IF NOT EXISTS scenes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, by TEXT, byId TEXT, at INTEGER, data TEXT)"
];
const HASH = /^[0-9a-f]{64}$/, NID = /^[A-Za-z0-9_-]{1,40}$/;
const enc = new TextEncoder(), dec = new TextDecoder();

// binary chunk frames
export function packChunk(head, bytes) {
  const h = enc.encode(JSON.stringify(head)), out = new Uint8Array(4 + h.length + bytes.length);
  new DataView(out.buffer).setUint32(0, h.length, true); out.set(h, 4); out.set(bytes, 4 + h.length); return out;
}
export function unpackChunk(buf) {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf), n = new DataView(u.buffer, u.byteOffset, u.byteLength).getUint32(0, true);
  if (n > 4096 || 4 + n > u.length) throw new Error("bad chunk");
  return { head: JSON.parse(dec.decode(u.subarray(4, 4 + n))), bytes: u.subarray(4 + n) };
}
const toU8 = (d) => (d instanceof Uint8Array ? d : new Uint8Array(d));

// who is this? Discord sign-in token -> member of this server (and, when the bot can see it, of this call)
export async function identify(env, hello, guild, f = fetch) {
  if (hello.dev) {
    if (env.DEV_ROOMS !== "1") throw new Error("sign in through Discord");
    return { userId: "dev:" + String(hello.name || "Guest").slice(0, 32), name: String(hello.name || "Guest").slice(0, 32), channel: null };
  }
  if (!hello.token || typeof hello.token !== "string") throw new Error("sign-in needed");
  const auth = { headers: { authorization: "Bearer " + hello.token } };
  const me = await f(API + "/users/@me", auth);
  if (!me.ok) throw new Error("Discord sign-in expired, reopen the Activity");
  const u = await me.json();
  const mr = await f(API + "/users/@me/guilds/" + guild + "/member", auth);   // a member of this server (and, in the gated server, with an access role)
  if (mr.status === 404) throw new Error("you are not in this server");
  if (!mr.ok) throw new Error("could not check your server membership (" + mr.status + ")");
  const mem = await mr.json().catch(() => ({})), need = String(env.GATE_ROLE_IDS || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (env.GATE_GUILD_ID === guild && need.length && !(mem.roles || []).some((r) => need.includes(r))) throw new Error(env.GATE_MESSAGE || "Pixel Scape is locked.");
  let channel = null;
  if (env.DISCORD_BOT_TOKEN && hello.instance) {   // the call itself: which channel, who is in it (best effort)
    try {
      const r = await f(API + "/applications/" + env.DISCORD_APP_ID + "/activity-instances/" + encodeURIComponent(hello.instance), { headers: { authorization: "Bot " + env.DISCORD_BOT_TOKEN } });
      if (r.ok) {
        const j = await r.json(), loc = j.location || {};
        if (loc.guild_id && loc.guild_id !== guild) throw new Error("this call is in another server");
        if (Array.isArray(j.users) && j.users.length && !j.users.includes(u.id)) throw new Error("you are not in this call");
        channel = loc.channel_id || null;
      } else console.log("activity instance check", r.status);
    } catch (e) { if (/server|call/.test(e.message)) throw e; console.log("activity instance check failed", e.message); }
  }
  return { userId: u.id, name: String(u.global_name || u.username || "Builder").slice(0, 40), channel };
}

// the room logic, over a SQL store (Durable Object storage.sql, or node:sqlite in tests) and hibernatable sockets
export class Hub {
  constructor(ctx, env, f) {
    this.ctx = ctx; this.env = env || {}; this.f = f || ((...a) => fetch(...a)); this.sql = ctx.storage.sql;
    for (const s of SCHEMA) this.sql.exec(s);
  }
  q(s, ...a) { return this.sql.exec(s, ...a).toArray(); }
  meta(ws) { return ws.deserializeAttachment() || {}; }
  setMeta(ws, m) { ws.serializeAttachment(m); }
  members(room, except) { return this.ctx.getWebSockets(room).filter((w) => w !== except && this.meta(w).ok); }
  send(ws, o) { try { ws.send(typeof o === "string" || o instanceof Uint8Array ? o : JSON.stringify(o)); } catch (e) { /* gone */ } }
  cast(room, o, except) { const s = JSON.stringify(o); for (const w of this.members(room, except)) this.send(w, s); }
  peer(m) { return { sid: m.sid, name: m.name, color: m.color, sel: m.sel || null }; }

  // a new socket (the Worker checked guild + room); it says hello next
  open(ws, room, guild) { this.setMeta(ws, { room, guild, ok: false }); }

  scene(room) {
    const r = this.q("SELECT env, cam, name FROM rooms WHERE room = ?", room)[0];
    const objs = this.q("SELECT nid, data FROM objs WHERE room = ? ORDER BY ord", room).map((x) => ({ nid: x.nid, o: JSON.parse(x.data) }));
    if (!r || (!r.env && !objs.length)) return null;
    return { objs, env: r.env ? JSON.parse(r.env) : {}, cam: r.cam ? JSON.parse(r.cam) : null, name: r.name || "" };
  }
  touch(room) { this.sql.exec("INSERT INTO rooms (room, at) VALUES (?, ?) ON CONFLICT(room) DO UPDATE SET at = excluded.at", room, Date.now()); }
  lockedBy(room, nid, ws) { return nid ? this.members(room, ws).map((w) => this.meta(w)).find((m) => m.sel === nid) : null; }
  writeScene(room, s) {
    this.sql.exec("DELETE FROM objs WHERE room = ?", room);
    s.objs.forEach(({ nid, o }, i) => this.sql.exec("INSERT OR REPLACE INTO objs (room, nid, ord, data) VALUES (?, ?, ?, ?)", room, nid, i, JSON.stringify(o)));
    this.sql.exec("INSERT INTO rooms (room, env, cam, name, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(room) DO UPDATE SET env = excluded.env, cam = excluded.cam, name = excluded.name, at = excluded.at",
      room, JSON.stringify(s.env || {}), s.cam ? JSON.stringify(s.cam) : null, String(s.name || "").slice(0, 80), Date.now());
    for (const w of this.members(room)) { const m = this.meta(w); if (m.sel) { m.sel = null; this.setMeta(w, m); } }   // a new scene: nobody holds anything
  }
  validScene(s) {
    return s && Array.isArray(s.objs) && s.objs.length <= MAX_OBJS && s.objs.every((x) => x && NID.test(x.nid) && x.o && typeof x.o === "object" && JSON.stringify(x.o).length <= MAX_OBJ);
  }
  lib() { return this.q("SELECT id, name, by, at FROM scenes ORDER BY at DESC LIMIT 200"); }

  async message(ws, data) {
    const m = this.meta(ws);
    if (typeof data !== "string") return m.ok ? this.chunk(ws, m, data) : undefined;
    let x; try { x = JSON.parse(data); } catch (e) { return; }
    if (!x || typeof x.t !== "string") return;
    if (x.t === "hello") return this.hello(ws, m, x);
    if (!m.ok) return this.send(ws, { t: "error", error: "say hello first" });
    const room = m.room, by = m.sid;
    switch (x.t) {
      case "put": {
        if (!NID.test(x.nid) || !x.o || typeof x.o !== "object") return;
        const s = JSON.stringify(x.o); if (s.length > MAX_OBJ) return this.send(ws, { t: "error", error: "object too big to share" });
        const h = this.lockedBy(room, x.nid, ws); if (h) return this.send(ws, { t: "nack", nid: x.nid, by: h.name });
        this.sql.exec("INSERT INTO objs (room, nid, ord, data) VALUES (?, ?, (SELECT COALESCE(MAX(ord), -1) + 1 FROM objs WHERE room = ?), ?) ON CONFLICT(room, nid) DO UPDATE SET data = excluded.data", room, x.nid, room, s); this.touch(room);
        return this.cast(room, { t: "put", nid: x.nid, o: x.o, by }, ws);
      }
      case "del": {
        if (!NID.test(x.nid)) return;
        const h = this.lockedBy(room, x.nid, ws); if (h) return this.send(ws, { t: "nack", nid: x.nid, by: h.name });
        this.sql.exec("DELETE FROM objs WHERE room = ? AND nid = ?", room, x.nid); this.touch(room);
        return this.cast(room, { t: "del", nid: x.nid, by }, ws);
      }
      case "env": {
        if (!x.e || typeof x.e !== "object" || JSON.stringify(x.e).length > 64 * 1024) return;
        const r = this.q("SELECT env FROM rooms WHERE room = ?", room)[0], e = Object.assign(r && r.env ? JSON.parse(r.env) : {}, x.e);
        this.sql.exec("INSERT INTO rooms (room, env, at) VALUES (?, ?, ?) ON CONFLICT(room) DO UPDATE SET env = excluded.env, at = excluded.at", room, JSON.stringify(e), Date.now());
        return this.cast(room, { t: "env", e: x.e, by }, ws);
      }
      case "lock": {
        const nid = x.nid == null ? null : String(x.nid);
        if (nid && !NID.test(nid)) return;
        const h = this.lockedBy(room, nid, ws); if (h) return this.send(ws, { t: "nack", nid, by: h.name, lock: true });
        m.sel = nid; this.setMeta(ws, m);
        return this.cast(room, { t: "lock", sid: by, nid }, ws);
      }
      case "live": {
        if (!x.nid || m.sel !== x.nid || !x.p || typeof x.p !== "object" || JSON.stringify(x.p).length > 2048) return;
        return this.cast(room, { t: "live", nid: x.nid, p: x.p, by }, ws);
      }
      case "replace": {
        if (!this.validScene(x)) return this.send(ws, { t: "error", error: "scene too big to share" });
        const s = { objs: x.objs, env: x.env || {}, cam: x.cam || null, name: x.name || "" };
        this.writeScene(room, s); this.send(ws, { t: "replaced" });
        return this.cast(room, { t: "scene", scene: s, by }, ws);
      }
      case "get": {
        if (!HASH.test(x.h)) return;
        const rows = this.q("SELECT i, n, d FROM blobs WHERE h = ? ORDER BY i", x.h);
        if (!rows.length || rows.length !== rows[0].n) return this.send(ws, { t: "missing", h: x.h });
        for (const r of rows) this.send(ws, packChunk({ t: "chunk", h: x.h, i: r.i, n: r.n }, toU8(r.d)));
        return;
      }
      case "save": {
        const s = this.scene(room); if (!s) return this.send(ws, { t: "error", error: "nothing to save yet" });
        const name = String(x.name || s.name || "Untitled").slice(0, 60).trim() || "Untitled";
        this.sql.exec("INSERT INTO scenes (name, by, byId, at, data) VALUES (?, ?, ?, ?, ?)", name, m.name, m.userId, Date.now(), JSON.stringify(Object.assign(s, { name })));
        this.cast(room, { t: "saved", name, by: m.name });
        return this.cast(room, { t: "lib", items: this.lib() });
      }
      case "lib": return this.send(ws, { t: "lib", items: this.lib() });
      case "unsave": {
        const r = this.q("SELECT byId FROM scenes WHERE id = ?", +x.id)[0];
        if (!r) return; if (r.byId !== m.userId) return this.send(ws, { t: "error", error: "only the builder who saved it can remove it" });
        this.sql.exec("DELETE FROM scenes WHERE id = ?", +x.id);
        return this.cast(room, { t: "lib", items: this.lib() });
      }
      case "open": {
        const r = this.q("SELECT data FROM scenes WHERE id = ?", +x.id)[0]; if (!r) return this.send(ws, { t: "error", error: "that scene is gone" });
        const s = JSON.parse(r.data); this.writeScene(room, s);
        return this.cast(room, { t: "scene", scene: s, by, opened: s.name });
      }
      case "post": return this.post(ws, m, x);
    }
  }

  async hello(ws, m, x) {
    if (m.ok) return;
    let who;
    try { who = await identify(this.env, x, m.guild, this.f); } catch (e) { this.send(ws, { t: "error", error: e.message, fatal: true }); return ws.close(4001, "not allowed"); }
    const others = this.members(m.room, ws);
    if (others.length >= MAX_BUILDERS) { this.send(ws, { t: "full", max: MAX_BUILDERS }); return ws.close(4002, "room full"); }
    const used = new Set(others.map((w) => this.meta(w).color));
    const isNew = !this.q("SELECT room FROM rooms WHERE room = ?", m.room).length;
    Object.assign(m, who, { ok: true, sid: Math.random().toString(36).slice(2, 10), color: COLORS.find((c) => !used.has(c)) || COLORS[0], sel: null, channel: who.channel || x.channel || null, verified: !!who.channel });
    this.setMeta(ws, m);
    this.send(ws, { t: "welcome", you: this.peer(m), peers: others.map((w) => this.peer(this.meta(w))), scene: this.scene(m.room), max: MAX_BUILDERS, chunk: CHUNK });
    this.cast(m.room, { t: "join", peer: this.peer(m) }, ws);
    if (isNew) this.prune();
  }

  chunk(ws, m, data) {
    let c; try { c = unpackChunk(data); } catch (e) { return; }
    const { h, i, n } = c.head || {};
    if (!HASH.test(h) || !(n >= 1 && n <= MAX_CHUNKS) || !(i >= 0 && i < n) || c.bytes.length > CHUNK) return this.send(ws, { t: "error", error: "bad upload" });
    this.sql.exec("INSERT OR IGNORE INTO blobs (h, i, n, d, at) VALUES (?, ?, ?, ?, ?)", h, i, n, c.bytes, Date.now());
  }

  close(ws) {
    const m = this.meta(ws); if (!m.ok) return;
    m.ok = false; this.setMeta(ws, m);
    this.cast(m.room, { t: "left", sid: m.sid }, ws);
  }

  // a render -> the call's channel, posted by the bot
  async post(ws, m, x) {
    const now = Date.now();
    if (m.lastPost && now - m.lastPost < POST_GAP) return this.send(ws, { t: "posted", ok: false, error: "one post every 20 seconds" });
    const channel = (m.verified && m.channel) || this.env.PLAY_CHANNEL_ID;
    if (!this.env.DISCORD_BOT_TOKEN || !channel) return this.send(ws, { t: "posted", ok: false, error: "posting is not set up" });
    if (!HASH.test(x.h)) return;
    const rows = this.q("SELECT i, n, d FROM blobs WHERE h = ? ORDER BY i", x.h);
    if (!rows.length || rows.length !== rows[0].n) return this.send(ws, { t: "posted", ok: false, error: "render upload incomplete" });
    const parts = rows.map((r) => toU8(r.d)), size = parts.reduce((a, b) => a + b.length, 0);
    if (size > POST_MAX) return this.send(ws, { t: "posted", ok: false, error: "render too big (10 MB max)" });
    m.lastPost = now; this.setMeta(ws, m);
    const caption = String(x.caption || "").replace(/[@<>]/g, "").slice(0, 200);
    const form = new FormData();
    form.append("payload_json", JSON.stringify({ content: "**" + m.name.replace(/[*_~`|@<>]/g, "") + "** rendered in Pixel Scape" + (caption ? ": " + caption : ""), allowed_mentions: { parse: [] }, attachments: [{ id: 0, filename: "pixel-scape.png" }] }));
    form.append("files[0]", new Blob(parts, { type: "image/png" }), "pixel-scape.png");
    let ok = false, error = "";
    try { const r = await this.f(API + "/channels/" + channel + "/messages", { method: "POST", headers: { authorization: "Bot " + this.env.DISCORD_BOT_TOKEN }, body: form }); ok = r.ok; if (!ok) error = "Discord said " + r.status; }
    catch (e) { error = e.message; }
    this.sql.exec("DELETE FROM blobs WHERE h = ?", x.h);
    this.send(ws, { t: "posted", ok, error, channel });
  }

  // old rooms and blobs nothing uses any more
  prune() {
    const now = Date.now();
    for (const r of this.q("SELECT room FROM rooms WHERE at < ?", now - ROOM_TTL)) { this.sql.exec("DELETE FROM objs WHERE room = ?", r.room); this.sql.exec("DELETE FROM rooms WHERE room = ?", r.room); }
    const used = new Set(), grab = (s) => { for (const mm of String(s).matchAll(/"([0-9a-f]{64})"/g)) used.add(mm[1]); };
    for (const r of this.q("SELECT data FROM objs")) grab(r.data);
    for (const r of this.q("SELECT data FROM scenes")) grab(r.data);
    for (const r of this.q("SELECT DISTINCT h FROM blobs WHERE at < ?", now - BLOB_GRACE)) if (!used.has(r.h)) this.sql.exec("DELETE FROM blobs WHERE h = ?", r.h);
  }
}

// the Durable Object (WebSocket Hibernation API: the object can sleep between messages, sockets stay open)
export class Rooms {
  constructor(ctx, env) { this.hub = new Hub(ctx, env); this.ctx = ctx; }
  async fetch(req) {
    const url = new URL(req.url), room = url.searchParams.get("room"), guild = url.searchParams.get("guild");
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [room]); this.hub.open(server, room, guild);
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, data) { try { await this.hub.message(ws, data); } catch (e) { console.error("room message", e && e.stack || e); } }
  async webSocketClose(ws, code) { this.hub.close(ws); try { ws.close(code === 1005 ? 1000 : code, "bye"); } catch (e) { /* already closed */ } }
  async webSocketError(ws) { this.hub.close(ws); }
}
