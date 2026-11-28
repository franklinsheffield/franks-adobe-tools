// Black Chamber (activity/src/blackchamber): substitution duels against real codebreakers.
import test from "node:test";
import assert from "node:assert/strict";
import { RIVALS, LEVELS, HINT_COST } from "../activity/src/blackchamber/data.js";
import { POOL, keyOf, encipher, rng, start, assign, solved, hint, left, finishDuel, settle, room, commonest, wrongOnes, duelRank, dailyOf, plainOf, working } from "../activity/src/blackchamber/logic.js";
import { SHOP, SLOTS, buyOrUse, lookOf } from "../activity/src/blackchamber/shop.js";
import { chamberHtml, boardHtml, countsHtml, keysHtml } from "../activity/src/blackchamber/scene.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { ROOM_BOOKS } from "../activity/src/library.js";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

test("six real rivals, two per level, faster each level; a pool of breakable lines", () => {
  assert.equal(RIVALS.length, 6); for (const L of LEVELS) assert.equal(RIVALS.filter((r) => r.lvl === L.n).length, 2);
  for (let i = 1; i < RIVALS.length; i++) assert.ok(RIVALS[i].secs < RIVALS[i - 1].secs);
  for (const r of RIVALS) assert.ok(r.fact.length > 60 && r.line.length > 10, r.id);
  assert.ok(POOL.length >= 40);
  const k = keyOf(rng(5)); assert.equal(new Set(k).size, 26); for (let i = 0; i < 26; i++) assert.notEqual(k[i], A[i]);
  assert.equal(encipher("AB C", "BCDEFGHIJKLMNOPQRSTUVWXYZA"), "BC D");
});

test("a duel: given letters, assigning, hints, win before the clock", () => {
  const d = start(LEVELS[0], { seed: 11 }); assert.equal(d.given.length, 4); assert.equal(d.rival, "phelippes");
  for (const c of d.given) assert.equal(d.guess[c], plainOf(d, c));
  assert.ok(!assign(d, d.given[0], "Q"), "given letters stay");
  const rest = commonest(d.text).filter((c) => !d.given.includes(c));
  const a = rest[0], b = rest[1]; assign(d, a, "Z"); assign(d, b, "Z"); assert.equal(d.guess[a], undefined, "a plain letter moves"); assert.equal(d.guess[b], "Z");
  for (const c of rest) assign(d, c, plainOf(d, c));
  assert.ok(solved(d)); assert.equal(working(d), d.plain); assert.equal(wrongOnes(d).length, 0);
  finishDuel(d, 60); assert.ok(d.won && d.score > 0);
  const p = {}, r = settle(p, d); assert.ok(r.newRival && r.won); assert.deepEqual(room(p).beaten, ["phelippes"]);
  const d2 = start(LEVELS[0], { beaten: room(p).beaten }); assert.equal(d2.rival, "rossignol");
  const d3 = start(LEVELS[2], { seed: 2 }); assert.equal(d3.given.length, 0); const c = hint(d3); assert.equal(d3.guess[c], plainOf(d3, c)); assert.equal(left(d3, 0), d3.secs - HINT_COST);
  finishDuel(d3, d3.secs + 1); assert.ok(!d3.won);
  assert.deepEqual(duelRank({ a: { ok: true, t: 90 }, b: { ok: true, t: 40 }, c: { ok: false, t: 0, right: 3 } }).map((x) => x.id), ["b", "a", "c"]);
  assert.deepEqual(dailyOf("2026-12-02"), dailyOf("2026-12-02"));
});

test("kit, drawing, trophy, banter and library", () => {
  for (const [k] of SLOTS) assert.ok(SHOP.some((s) => s.slot === k && s.price === 0), k);
  for (const s of SHOP) { assert.match(s.id, /^bc-/); assert.ok(s.note.length > 40); }
  const p = { essence: 100 }; assert.equal(buyOrUse(p, "bc-chess"), "poor"); assert.equal(buyOrUse(p, "bc-graph"), "bought"); assert.equal(lookOf(p).sheet, "bc-graph");
  const d = start(LEVELS[1], { seed: 4 });
  for (const timer of ["bc-sand", "bc-watch", "bc-chess"]) for (const frac of [1, 0.5, 0]) assert.doesNotMatch(chamberHtml({ look: { ...lookOf({}), timer }, rival: RIVALS[0], frac, state: "won" }), /undefined|NaN/);
  assert.match(boardHtml(d, d.text[0], lookOf({})), /bc-cell/); assert.match(countsHtml({ A: 3 }, "ETAOIN"), /English/); assert.match(keysHtml(["A"]), /used/);
  assert.ok(TROPHIES.some((t) => t.id === "blackchamber")); assert.equal(Object.keys(BANTER.blackchamber).length, 10); assert.ok(ROOM_BOOKS.blackchamber);
});
