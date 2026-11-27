import test from "node:test";
import assert from "node:assert";
import { todayKey, yesterdayOf, dayNumber, dailySeed, dailyState, finishDaily, boardHtml } from "../activity/src/daily.js";
import chamber, { boardView } from "../activity/worker.mjs";

test("daily seed: same for everyone on a day, different per game and per day", () => {
  assert.equal(dailySeed("duel", "2026-11-27"), dailySeed("duel", "2026-11-27"));
  assert.notEqual(dailySeed("duel", "2026-11-27"), dailySeed("duel", "2026-11-28"));
  assert.notEqual(dailySeed("duel", "2026-11-27"), dailySeed("seance", "2026-11-27"));
  assert.ok(dailySeed("duel") > 0);
  assert.equal(todayKey(Date.parse("2026-11-27T23:59:00Z")), "2026-11-27");
  assert.equal(yesterdayOf("2026-12-01"), "2026-11-30");
  assert.equal(dayNumber("2026-01-01"), 1);
});

test("daily streak: first run counts, streak grows on consecutive days and resets after a gap", () => {
  const p = {};
  assert.equal(dailyState(p, "duel", "2026-11-25").played, false);
  assert.deepEqual(finishDaily(p, "duel", { score: 900, won: true }, "2026-11-25"), { first: true, streak: 1, best: 1 });
  assert.equal(finishDaily(p, "duel", { score: 5000 }, "2026-11-25").first, false); // a replay does not count
  assert.equal(dailyState(p, "duel", "2026-11-25").today.score, 900);
  assert.equal(finishDaily(p, "duel", { score: 100 }, "2026-11-26").streak, 2);
  assert.equal(dailyState(p, "duel", "2026-11-27").streak, 2); // still alive until tonight
  assert.equal(dailyState(p, "duel", "2026-11-28").streak, 0); // missed a day
  assert.deepEqual(finishDaily(p, "duel", { score: 1 }, "2026-11-28"), { first: true, streak: 1, best: 2 });
  const esc = (s) => s;
  assert.match(boardHtml(null, esc, { local: { score: 5 } }), /Sign in/);
  assert.match(boardHtml({ top: [{ name: "Ada", score: 9, won: true, me: true }], count: 1, me: { rank: 1 } }, esc), /Ada · 9 pts ✓/);
});

class KV { m = new Map(); async get(k, t) { const v = this.m.get(k); return v == null ? null : t === "json" ? JSON.parse(v) : v; } async put(k, v) { this.m.set(k, v); } }
test("daily board API: first score per player per day, sorted, own rank", async () => {
  const env = { PROFILES: new KV(), ASSETS: { fetch: () => new Response("static") } };
  const real = globalThis.fetch;
  let who = { id: "1", global_name: "Ada" };
  globalThis.fetch = async () => Response.json(who);
  const call = (method, game, body) => chamber.fetch(new Request("https://x/.proxy/api/daily/" + game, { method, headers: { authorization: "Bearer t" }, ...(body ? { body: JSON.stringify(body) } : {}) }), env);
  try {
    assert.equal((await chamber.fetch(new Request("https://x/api/daily/duel"), env)).status, 401);
    assert.equal((await call("GET", "BAD_ID!")).status, 404);
    assert.equal((await call("POST", "duel", { score: "lots" })).status, 400);
    let b = await (await call("POST", "duel", { score: 500, won: true, detail: "6 rounds" })).json();
    assert.equal(b.count, 1); assert.equal(b.me.rank, 1);
    b = await (await call("POST", "duel", { score: 9999 })).json(); // second run ignored
    assert.equal(b.top[0].score, 500);
    who = { id: "2", username: "bob" };
    b = await (await call("POST", "duel", { score: 800 })).json();
    assert.deepEqual(b.top.map((e) => e.name), ["bob", "Ada"]);
    assert.equal(b.me.rank, 1);
    b = await (await call("GET", "duel")).json();
    assert.equal(b.count, 2); assert.equal(b.day, new Date().toISOString().slice(0, 10));
    assert.equal((await (await call("GET", "seance")).json()).count, 0);
  } finally { globalThis.fetch = real; }
  const v = boardView({ e: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [String(i), { n: "p" + i, s: i, t: i }])) }, "0", "d");
  assert.equal(v.top.length, 10); assert.equal(v.me.rank, 15); assert.equal(v.top[0].name, "p14");
});
