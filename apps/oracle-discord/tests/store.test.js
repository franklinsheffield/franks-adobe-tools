import { test } from "node:test";
import assert from "node:assert/strict";
import { readsLeft, useRead, buyDayPass, buy, dailyLimit, STORE, DAY_PASS } from "../activity/src/store.js";
import { fresh, record } from "../activity/src/game.js";

const r = { embeds: [{ title: "I Ching · 9 · Small Taming", fields: [] }], reading: {} };
test("daily Chamber readings grow with rank: 1, 3, 5, unlimited", () => {
  assert.deepEqual(["Seeker", "Initiate", "Adept", "Magus", "Oracle-touched"].map(dailyLimit), [1, 3, 5, Infinity, Infinity]);
});
test("a reading uses today's allowance; a day pass adds one for Essence", () => {
  const p = fresh(), now = new Date(2026, 10, 26, 12);
  assert.equal(readsLeft(p, "Seeker", now), 1);
  useRead(p, now); assert.equal(readsLeft(p, "Seeker", now), 0);
  assert.equal(buyDayPass(p, now), false);
  p.essence = DAY_PASS + 5; assert.equal(buyDayPass(p, now), true);
  assert.equal(p.essence, 5); assert.equal(readsLeft(p, "Seeker", now), 1);
  assert.equal(readsLeft(p, "Seeker", new Date(2026, 10, 27, 12)), 1, "resets the next day");
});
test("readings earn Essence; the store sells each item once", () => {
  const p = fresh(); const g = record(p, "iching", r);
  assert.ok(g.essence >= g.xp && p.essence === g.essence);
  const cat = STORE.find((s) => s.id === "cat"); p.essence = cat.price;
  assert.equal(buy(p, "cat"), true); assert.equal(p.essence, 0); assert.equal(buy(p, "cat"), false);
  assert.equal(buy(p, "cosmic"), false, "not enough Essence");
});
test("every kind has a free starter or earned option", () => {
  for (const k of ["outfit", "avatar", "flame", "voice"]) assert.ok(STORE.some((s) => s.kind === k && s.price === 0), k);
});
