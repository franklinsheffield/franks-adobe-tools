// D4 rooms: the room logic over a real SQLite (node:sqlite) and fake hibernatable sockets.
import test from "node:test";
import assert from "node:assert";
import { DatabaseSync } from "node:sqlite";
import W from "../activity/worker.mjs";
import { Hub, identify, packChunk, unpackChunk, MAX_BUILDERS } from "../activity/rooms.mjs";

function world(env, f) {
  const db = new DatabaseSync(":memory:"), socks = [];
  const sql = { exec: (s, ...a) => { const st = db.prepare(s); const rows = /^\s*SELECT/i.test(s) ? st.all(...a) : (st.run(...a), []); return { toArray: () => rows }; } };
  const ctx = { storage: { sql }, getWebSockets: (tag) => socks.filter((w) => w.tag === tag && !w.closed) };
  const hub = new Hub(ctx, Object.assign({ DEV_ROOMS: "1" }, env), f);
  const join = async (name, room = "r1", guild = "dev") => {
    const ws = { tag: room, sent: [], att: null, send(x) { this.sent.push(typeof x === "string" ? JSON.parse(x) : unpackChunk(x)); }, serializeAttachment(a) { this.att = JSON.parse(JSON.stringify(a)); }, deserializeAttachment() { return this.att && JSON.parse(JSON.stringify(this.att)); }, close(c) { this.closed = c; } };
    ws.last = (t) => [...ws.sent].reverse().find((m) => m.t === t || (m.head && m.head.t === t));
    ws.say = (o) => hub.message(ws, typeof o === "string" || o instanceof Uint8Array ? o : JSON.stringify(o));
    socks.push(ws); hub.open(ws, room, guild); if (name) await ws.say({ t: "hello", dev: true, name }); return ws;
  };
  return { hub, join, db };
}
const sphere = (x) => ({ type: "sphere", x, y: 1, z: 0, s: 1, mat: "Chrome" });

test("join: welcome with peers and colours, others hear about it", async () => {
  const w = world(), a = await w.join("Ana"), b = await w.join("Bo");
  assert.strictEqual(a.last("welcome").scene, null, "a new room is empty");
  const wb = b.last("welcome"); assert.strictEqual(wb.peers.length, 1); assert.strictEqual(wb.peers[0].name, "Ana");
  assert.notStrictEqual(wb.you.color, wb.peers[0].color, "each builder gets their own colour");
  assert.strictEqual(a.last("join").peer.name, "Bo");
});

test("dev sign-in only when the Worker allows it; Discord sign-in checks the server", async () => {
  await assert.rejects(identify({}, { dev: true, name: "x" }, "g"), /Discord/);
  const f = async (u) => new Response(JSON.stringify(/guilds$/.test(u) ? [{ id: "111" }] : { id: "9", global_name: "Frank" }), { status: 200 });
  assert.deepStrictEqual(await identify({}, { token: "t" }, "111", f), { userId: "9", name: "Frank", channel: null });
  await assert.rejects(identify({}, { token: "t" }, "222", f), /not in this server/);
  const bad = async () => new Response("{}", { status: 401 }); await assert.rejects(identify({}, { token: "t" }, "111", bad), /expired/);
  // with the bot token: the call's channel, and members outside the call are turned away
  const g = (users) => async (u) => new Response(JSON.stringify(/activity-instances/.test(u) ? { location: { guild_id: "111", channel_id: "555" }, users } : /guilds$/.test(u) ? [{ id: "111" }] : { id: "9", username: "frank" }), { status: 200 });
  assert.strictEqual((await identify({ DISCORD_BOT_TOKEN: "b", DISCORD_APP_ID: "1" }, { token: "t", instance: "i-1" }, "111", g(["9"]))).channel, "555");
  await assert.rejects(identify({ DISCORD_BOT_TOKEN: "b", DISCORD_APP_ID: "1" }, { token: "t", instance: "i-1" }, "111", g(["8"])), /not in this call/);
  const w = world({ DEV_ROOMS: "" }), s = await w.join(null); await s.say({ t: "hello", dev: true, name: "x" });
  assert.ok(s.closed && s.last("error").fatal, "dev hello refused in production");
});

test("put / del / env reach the others and are kept for later joiners", async () => {
  const w = world(), a = await w.join("Ana"), b = await w.join("Bo");
  await a.say({ t: "put", nid: "n1", o: sphere(1) }); await a.say({ t: "put", nid: "n2", o: sphere(2) });
  await a.say({ t: "env", e: { sky: "Dusk" } }); await b.say({ t: "env", e: { fog: 20 } });
  await a.say({ t: "del", nid: "n2" });
  assert.strictEqual(b.last("put").o.x, 2); assert.strictEqual(b.last("del").nid, "n2"); assert.strictEqual(a.last("env").e.fog, 20);
  assert.ok(!a.sent.some((m) => m.t === "put"), "no echo to the sender");
  const c = await w.join("Cy"), s = c.last("welcome").scene;
  assert.deepStrictEqual(s.objs.map((x) => x.nid), ["n1"]); assert.deepStrictEqual(s.env, { sky: "Dusk", fog: 20 }, "env edits merge");
});

test("selected = locked: others can't edit, select or delete it; leaving frees it", async () => {
  const w = world(), a = await w.join("Ana"), b = await w.join("Bo");
  await a.say({ t: "put", nid: "n1", o: sphere(1) }); await a.say({ t: "lock", nid: "n1" });
  assert.deepStrictEqual(b.last("lock"), { t: "lock", sid: a.last("welcome").you.sid, nid: "n1" });
  await b.say({ t: "lock", nid: "n1" }); assert.strictEqual(b.last("nack").by, "Ana");
  await b.say({ t: "put", nid: "n1", o: sphere(9) }); await b.say({ t: "del", nid: "n1" });
  assert.strictEqual(b.sent.filter((m) => m.t === "nack").length, 3);
  await a.say({ t: "live", nid: "n1", p: { x: 3 } }); assert.deepStrictEqual(b.last("live").p, { x: 3 }, "the holder's drag streams live");
  await b.say({ t: "live", nid: "n1", p: { x: 5 } }); assert.ok(!a.sent.some((m) => m.t === "live"), "only the holder can stream it");
  a.closed = 1000; w.hub.close(a);
  assert.strictEqual(b.last("left").sid, a.last("welcome").you.sid);
  await b.say({ t: "lock", nid: "n1" }); assert.strictEqual(b.sent.filter((m) => m.t === "nack").length, 3, "free after Ana left");
});

test("room full at 8 builders", async () => {
  const w = world(); for (let i = 0; i < MAX_BUILDERS; i++) await w.join("P" + i);
  const late = await w.join("Late"); assert.ok(late.last("full") && late.closed === 4002);
});

test("blobs: chunked upload, download, missing", async () => {
  const w = world(), a = await w.join("Ana"), b = await w.join("Bo"), h = "a".repeat(64);
  await a.say(packChunk({ t: "chunk", h, i: 1, n: 2 }, new Uint8Array([3, 4])));
  await b.say({ t: "get", h }); assert.strictEqual(b.last("missing").h, h, "half a blob is missing");
  await a.say(packChunk({ t: "chunk", h, i: 0, n: 2 }, new Uint8Array([1, 2])));
  b.sent.length = 0; await b.say({ t: "get", h });
  assert.deepStrictEqual(b.sent.map((c) => [c.head.i, [...c.bytes]]), [[0, [1, 2]], [1, [3, 4]]]);
  await a.say(packChunk({ t: "chunk", h: "nothex", i: 0, n: 1 }, new Uint8Array([1]))); assert.strictEqual(a.last("error").error, "bad upload");
});

test("replace, library save / open / unsave", async () => {
  const w = world(), a = await w.join("Ana"), b = await w.join("Bo");
  await a.say({ t: "replace", objs: [{ nid: "x1", o: sphere(1) }, { nid: "x2", o: sphere(2) }], env: { sky: "Noon" }, cam: { yaw: 1 }, name: "Garden" });
  assert.strictEqual(b.last("scene").scene.objs.length, 2);
  await a.say({ t: "save", name: "Garden v1" }); assert.strictEqual(b.last("saved").name, "Garden v1");
  const id = b.last("lib").items[0].id;
  await b.say({ t: "replace", objs: [], env: { sky: "Night" }, name: "Empty" });
  await b.say({ t: "open", id }); const s = a.last("scene").scene;
  assert.strictEqual(s.name, "Garden v1"); assert.strictEqual(s.objs.length, 2); assert.ok(b.last("scene"), "the opener gets it too");
  await b.say({ t: "unsave", id }); assert.match(b.last("error").error, /only the builder/);
  await a.say({ t: "unsave", id }); assert.deepStrictEqual(a.last("lib").items, []);
});

test("post render: bot posts the PNG to the call's channel, rate limited", async () => {
  const calls = [];
  const f = async (u, o) => { calls.push({ u, o }); return new Response("{}", { status: 200 }); };
  const w = world({ DISCORD_BOT_TOKEN: "bot", PLAY_CHANNEL_ID: "777" }, f), a = await w.join("Ana"), h = "b".repeat(64);
  await a.say(packChunk({ t: "chunk", h, i: 0, n: 1 }, new Uint8Array([137, 80, 78, 71])));
  await a.say({ t: "post", h, caption: "sunset @everyone" });
  assert.ok(a.last("posted").ok); assert.match(calls[0].u, /channels\/777\/messages$/);
  const payload = JSON.parse(calls[0].o.body.get("payload_json")); assert.deepStrictEqual(payload.allowed_mentions, { parse: [] }); assert.ok(!/@/.test(payload.content));
  assert.strictEqual((await calls[0].o.body.get("files[0]").arrayBuffer()).byteLength, 4);
  await a.say(packChunk({ t: "chunk", h, i: 0, n: 1 }, new Uint8Array([1])));
  await a.say({ t: "post", h }); assert.match(a.last("posted").error, /20 seconds/);
});

test("Worker: /api/room needs a WebSocket, a server and a room", async () => {
  const env = { ROOMS: { idFromName: (n) => n, get: (id) => ({ fetch: async () => new Response("room " + id) }) }, ASSETS: { fetch: async () => new Response("asset") } };
  const up = { headers: { upgrade: "websocket" } };
  assert.strictEqual((await W.fetch(new Request("https://x/api/room?guild=123456&room=i1"), env)).status, 426);
  assert.strictEqual((await W.fetch(new Request("https://x/.proxy/api/room?guild=abc&room=i1", up), env)).status, 400);
  assert.strictEqual((await W.fetch(new Request("https://x/.proxy/api/room?guild=dev&room=i1", up), env)).status, 400, "dev rooms off in production");
  assert.strictEqual(await (await W.fetch(new Request("https://x/.proxy/api/room?guild=123456&room=i1", up), env)).text(), "room guild:123456");
});
