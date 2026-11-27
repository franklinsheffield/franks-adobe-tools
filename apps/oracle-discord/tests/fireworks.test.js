// Fireworks Workshop (activity/src/fireworks/): real colourants, oxidisers, chlorine donors; build, launch, Show Night.
import test from "node:test";
import assert from "node:assert/strict";
import { COLOURS, COLOURANTS, OXIDISERS, TAILS, PATTERNS, SIZES, HISTORY, agentFor } from "../activity/src/fireworks/data.js";
import { room, deal, makeTarget, rng, check, burstOf, tryPoints, timingPoints, cueTimes, describe, settle, dailyOf, tally } from "../activity/src/fireworks/logic.js";
import { SHOP, SLOTS, buyOrUse, lookOf } from "../activity/src/fireworks/shop.js";
import { burstSvg, skySvg, shellSvg } from "../activity/src/fireworks/scene.js";

const build = (t, over = {}) => { const a1 = agentFor(t.c1), a2 = t.c2 ? agentFor(t.c2) : null; return { c1: a1.id, c2: a2 ? a2.id : null, ox: "kclo4", cl: [a1, a2].some((a) => a && a.needsCl), tail: t.tail, pat: t.pat, size: t.size, ...over }; };

test("chemistry: every colour has a real colourant; blue and purple need chlorine", () => {
  for (const c of Object.keys(COLOURS)) assert.ok(agentFor(c), c);
  assert.equal(agentFor("red").id, "sr"); assert.equal(agentFor("green").id, "ba"); assert.equal(agentFor("blue").id, "cu"); assert.equal(agentFor("yellow").id, "na");
  assert.ok(agentFor("blue").needsCl && agentFor("purple").needsCl);
  assert.equal(burstOf({ c1: "cu", ox: "kclo4", cl: false, tail: "none" }).c1, "white", "copper without chlorine burns pale");
  assert.equal(burstOf({ c1: "cu", ox: "kclo4", cl: true, tail: "none" }).c1, "blue");
  assert.ok(burstOf({ c1: "sr", ox: "kno3", tail: "none" }).dull, "saltpetre alone gives dull colour");
  assert.ok(OXIDISERS.some((o) => o.id === "kclo4") && TAILS.length >= 3 && PATTERNS.length >= 2 && SIZES.length >= 3 && HISTORY.length >= 3);
  for (const c of COLOURANTS) assert.ok(c.note && c.note.length > 20, c.id);
});

test("targets: a matching build passes; each wrong part is named", () => {
  for (const level of [1, 2, 3]) for (let s = 1; s < 80; s++) {
    const t = makeTarget(level, rng(s)); assert.deepEqual(check(build(t), t), [], JSON.stringify(t));
    if (level >= 2) assert.notEqual(t.c1, t.c2);
    assert.equal(!!t.size, level === 3); assert.ok(describe(t).length > 5);
  }
  const t = { c1: "blue", c2: null, tail: "none", pat: "sphere", size: null };
  assert.deepEqual(check(build(t, { cl: false }), t), ["cl"]); assert.deepEqual(check(build(t, { ox: "kno3" }), t), ["ox"]);
  assert.deepEqual(check(build(t, { c1: "sr" }), t), ["c1"]); assert.deepEqual(check(build(t, { pat: "ring" }), t), ["pat"]);
  assert.deepEqual(deal(2, 9), deal(2, 9), "seeded"); assert.equal(deal(1, 3).length, 5); assert.equal(deal(3, 3).length, 4);
  assert.deepEqual(dailyOf("2026-11-27"), dailyOf("2026-11-27")); assert.ok(dailyOf("2026-11-27").target.c2);
});

test("scoring, settling, the show and Show Night votes", () => {
  assert.deepEqual([1, 2, 3, 4].map(tryPoints), [10, 6, 3, 0]);
  assert.deepEqual([0.2, -0.9, 1.5, 3].map(timingPoints), [10, 6, 3, 0]); assert.deepEqual(cueTimes(), [6, 11, 16, 21]);
  const p = {}; assert.equal(settle(p, 1, 25, 50).won, true); assert.equal(settle(p, 1, 50, 50).perfect, true); assert.equal(settle(p, 2, 10, 50).won, false);
  assert.equal(room(p).plays, 3); assert.equal(room(p).wins, 2); assert.equal(room(p).best[1], 50);
  const rows = tally({ a: { name: "Ann" }, b: { name: "Bo" }, c: { name: "Cy" } }, { a: "b", b: "b", c: "b", x: "a" });
  assert.equal(rows[0].id, "b"); assert.equal(rows[0].votes, 2, "no voting for yourself"); assert.equal(rows.find((r) => r.id === "a").votes, 1, "the audience votes too");
});

test("store and drawings", () => {
  for (const [slot] of SLOTS) assert.ok(SHOP.some((s) => s.slot === slot && s.price === 0) && SHOP.some((s) => s.slot === slot && s.price > 0), slot);
  assert.equal(new Set(SHOP.map((s) => s.id)).size, SHOP.length); assert.ok(SHOP.every((s) => s.id.startsWith("fw-")));
  const p = { essence: 0 }, paid = SHOP.find((s) => s.price > 0);
  assert.equal(buyOrUse(p, paid.id), "poor"); p.essence = 1000; assert.equal(buyOrUse(p, paid.id), "bought"); assert.equal(lookOf(p)[paid.slot], paid.id);
  const b = burstOf(build({ c1: "red", c2: "green", tail: "ti", pat: "ring", size: 4 }));
  assert.ok(burstSvg(b, 200, 90).includes("<")); assert.ok(skySvg({ look: lookOf(p) }).includes("<svg")); assert.ok(shellSvg(b, lookOf(p)).includes("<"));
});
