// Server boosts (activity/src/boost.js + the Chamber Worker's /api/boost): each boost pays Essence once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { settleBoost, BOOST_ESSENCE, BOOST_THANKS } from "../activity/src/boost.js";
import chamber, { boostCheck } from "../activity/worker.mjs";

const kv = () => { const m = new Map(); return { get: async (k) => (m.has(k) ? JSON.parse(m.get(k)) : null), put: async (k, v) => m.set(k, v), m }; };

test("a boost pays once; a new boost later pays again; no boost pays nothing", () => {
  let r = settleBoost({ premium_since: null }, null); assert.deepEqual([r.boosting, r.fresh, r.reward], [false, false, 0]);
  r = settleBoost({ premium_since: "2026-11-27T10:00:00Z" }, null); assert.deepEqual([r.boosting, r.fresh, r.reward], [true, true, BOOST_ESSENCE]);
  const again = settleBoost({ premium_since: "2026-11-27T10:00:00Z" }, r.ledger); assert.deepEqual([again.fresh, again.reward], [false, 0]);
  const later = settleBoost({ premium_since: "2027-02-01T10:00:00Z" }, r.ledger); assert.equal(later.fresh, true);
  assert.ok(BOOST_THANKS.every((l) => l.includes("{name}") && /thank/i.test(l)));
});

test("the Worker checks the boost with the bot and records it", async () => {
  const env = { DISCORD_BOT_TOKEN: "bot", PROFILES: kv() }, seen = [];
  const f = async (url, o) => { seen.push([url, o.headers.authorization]); return new Response(JSON.stringify({ premium_since: "2026-11-27T10:00:00Z" })); };
  const a = await boostCheck(env, "123456", "987654321", f), b = await boostCheck(env, "123456", "987654321", f);
  assert.deepEqual([a.fresh, a.reward, b.fresh, b.reward], [true, BOOST_ESSENCE, false, 0]);
  assert.equal(seen[0][0], "https://discord.com/api/v10/guilds/987654321/members/123456"); assert.equal(seen[0][1], "Bot bot");
  assert.deepEqual(await boostCheck(env, "123456", "not-a-guild", f), { boosting: false, fresh: false, reward: 0 });
  assert.deepEqual(await boostCheck({ PROFILES: kv() }, "1", "987654321", f), { boosting: false, fresh: false, reward: 0 }, "no bot token, no reward");
});

test("/api/boost needs a signed-in member", async () => {
  const r = await chamber.fetch(new Request("https://x/api/boost", { method: "POST", body: "{}" }), { PROFILES: kv(), ASSETS: { fetch: () => new Response("") } });
  assert.equal(r.status, 401);
});
