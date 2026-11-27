// Shared multiplayer tables (activity/tables.mjs): host election, relay rules, snapshots, sign-in.
import test from "node:test";
import assert from "node:assert/strict";
import { Table, identify, MAX_SEATS } from "../activity/tables.mjs";

function fakeCtx() {
  const store = new Map(), socks = [];
  return { socks, storage: { get: async (k) => store.get(k), put: async (k, v) => store.set(k, v), delete: async (ks) => [].concat(ks).forEach((k) => store.delete(k)) },
    getWebSockets: () => socks.filter((s) => !s.closed) };
}
function sock(ctx) {
  const s = { att: { ok: false }, got: [], closed: false, serializeAttachment(a) { this.att = a; }, deserializeAttachment() { return this.att; },
    send(d) { this.got.push(JSON.parse(d)); }, close() { this.closed = true; } };
  ctx.socks.push(s); return s;
}
const last = (s, t) => [...s.got].reverse().find((x) => x.t === t);
async function join(tb, ctx, name) { const s = sock(ctx); await tb.message(s, JSON.stringify({ t: "hello", dev: true, name })); return s; }

test("first to arrive hosts; the host relays, others reach only the host", async () => {
  const ctx = fakeCtx(), tb = new Table(ctx, { DEV_ROOMS: "1" });
  const a = await join(tb, ctx, "Ann"), b = await join(tb, ctx, "Bo"), c = await join(tb, ctx, "Cy");
  assert.equal(last(a, "welcome").host, "dev:Ann");
  assert.deepEqual(last(c, "welcome").members.map((m) => m.name), ["Ann", "Bo", "Cy"]);
  assert.equal(last(a, "members").members.length, 3);
  await tb.message(a, JSON.stringify({ t: "to", to: "dev:Bo", m: { k: "hi" } }));
  assert.deepEqual(last(b, "msg"), { t: "msg", from: "dev:Ann", m: { k: "hi" } }); assert.equal(last(c, "msg"), undefined);
  await tb.message(a, JSON.stringify({ t: "to", to: "*", m: 1 })); assert.equal(last(c, "msg").m, 1);
  await tb.message(b, JSON.stringify({ t: "up", m: { a: "draw" } }));
  assert.deepEqual(last(a, "msg"), { t: "msg", from: "dev:Bo", m: { a: "draw" } }); assert.equal(last(c, "msg").m, 1);
  await tb.message(b, JSON.stringify({ t: "to", to: "*", m: "x" })); assert.match(last(b, "error").error, /host/);
});

test("when the host leaves, the next member hosts and gets the saved game", async () => {
  const ctx = fakeCtx(), tb = new Table(ctx, { DEV_ROOMS: "1" });
  const a = await join(tb, ctx, "Ann"), b = await join(tb, ctx, "Bo");
  await tb.message(a, JSON.stringify({ t: "snap", s: { turn: 3 } }));
  a.closed = true; await tb.close(a);
  assert.equal(last(b, "members").host, "dev:Bo");
  assert.deepEqual(last(b, "host").snap, { turn: 3 });
});

test("an empty table starts fresh; same person twice replaces the old window; dev needs DEV_ROOMS", async () => {
  const ctx = fakeCtx(), tb = new Table(ctx, { DEV_ROOMS: "1" });
  const a = await join(tb, ctx, "Ann"); await tb.message(a, JSON.stringify({ t: "snap", s: 1 }));
  a.closed = true; await tb.close(a);
  const a2 = await join(tb, ctx, "Ann"); assert.equal(last(a2, "welcome").snap, null);
  const a3 = await join(tb, ctx, "Ann"); assert.ok(a2.closed); assert.equal(last(a3, "welcome").members.length, 1);
  const ctx2 = fakeCtx(), tb2 = new Table(ctx2, {}), z = await join(tb2, ctx2, "Zed");
  assert.ok(last(z, "error").fatal); assert.ok(z.closed);
  await assert.rejects(identify({}, { token: "x" }, async () => ({ ok: false })), /expired/);
  assert.deepEqual(await identify({}, { token: "x" }, async () => ({ ok: true, json: async () => ({ id: 5, username: "u" }) })), { id: "5", name: "u" });
});

test("the table fills up at MAX_SEATS", async () => {
  const ctx = fakeCtx(), tb = new Table(ctx, { DEV_ROOMS: "1" });
  for (let i = 0; i < MAX_SEATS; i++) await join(tb, ctx, "P" + i);
  const x = await join(tb, ctx, "Late"); assert.match(last(x, "error").error, /full/);
});
