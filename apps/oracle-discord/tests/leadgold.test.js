// Lead into Gold (activity/src/leadgold/): decays, the three natural series, and real routes to gold-197.
import test from "node:test";
import assert from "node:assert/strict";
import { CHAINS, ROUTES, MOVES, EL, GOLD, label } from "../activity/src/leadgold/data.js";
import { decay, DECAYERS, quiz, hintFor, fewest, apply, isGold, goldPoints, settle, room, dailyOf, turnOf } from "../activity/src/leadgold/logic.js";
import { SHOP, SLOTS, buyOrUse, lookOf } from "../activity/src/leadgold/shop.js";
import { benchSvg, chartSvg } from "../activity/src/leadgold/scene.js";

test("the three natural series are real: each step follows its decay and ends in stable lead", () => {
  const ends = { u238: "Pb-206", th232: "Pb-208", u235: "Pb-207" }, counts = { u238: [8, 6], th232: [6, 4], u235: [7, 4] };
  for (const c of CHAINS) {
    let [z, a] = c.steps[0]; const n = { a: 0, b: 0 };
    for (let i = 0; i < c.steps.length; i++) { const [sz, sa, d, h] = c.steps[i]; assert.deepEqual([sz, sa], [z, a], `${c.id} step ${i}`); assert.ok(h); if (!d) { assert.equal(i, c.steps.length - 1); break; } n[d]++; ({ z, a } = decay(z, a, d)); }
    assert.equal(label(z, a), ends[c.id]); assert.deepEqual([n.a, n.b], counts[c.id], `${c.id} alpha/beta count`);
  }
});

test("Level 1 questions are answerable and the daily is shared", () => {
  for (const q of quiz(7, 200)) { assert.ok(q.choices.includes(q.a)); assert.equal(new Set(q.choices).size, q.choices.length); assert.ok(q.why.includes("Half-life")); }
  assert.ok(DECAYERS.length >= 25); assert.ok(hintFor(90, 234, "b").includes("neutrons") && hintFor(92, 238, "a").includes("heavy"));
  assert.deepEqual(dailyOf("2026-11-27").rounds.map((q) => q.q), dailyOf("2026-11-27").rounds.map((q) => q.q));
});

test("Level 3: every route reaches gold-197, with the right fewest moves", () => {
  const want = { hg198: 1, hg196: 2, tl205: 8, pb208: 11, bi209: 12 };
  for (const r of ROUTES) assert.equal(fewest(r.z, r.a), want[r.id], r.id);
  let s = { z: 80, a: 196 }; s = apply(s, "cap"); assert.deepEqual(s, { z: 80, a: 197 }); s = apply(s, "ec"); assert.ok(isGold(s), "mercury-196 + n, then electron capture = gold-197");
  assert.ok(isGold(apply({ z: 80, a: 198 }, "p"))); assert.equal(GOLD.a - GOLD.z, 118);
  assert.deepEqual([goldPoints(12, 12), goldPoints(14, 12), goldPoints(20, 12)], [10, 6, 3]); assert.ok(MOVES.length === 5 && EL[79][0] === "Au");
});

test("progress, co-op turns, store and drawings", () => {
  const p = {}; assert.equal(settle(p, 3, 50, 50).perfect, true); assert.equal(settle(p, 3, 10, 50).won, false); assert.equal(room(p).plays, 2);
  assert.equal(turnOf(["a", "b", "c"], 4), "b"); assert.equal(turnOf([], 1), null);
  for (const [slot] of SLOTS) assert.ok(SHOP.some((s) => s.slot === slot && !s.price) && SHOP.some((s) => s.slot === slot && s.price > 0));
  const q = { essence: 500 }, it = SHOP.find((s) => s.price > 0); assert.equal(buyOrUse(q, it.id), "bought"); assert.equal(lookOf(q)[it.slot], it.id);
  assert.ok(benchSvg({ z: 79, a: 197, gold: true, look: lookOf(q) }).includes("Au-197")); assert.ok(chartSvg([{ z: 92, a: 238 }, { z: 90, a: 234 }]).includes("polyline"));
});
