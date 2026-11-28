// Forgery Desk (activity/src/forgery): catch the feature too new for a document's claimed date.
import test from "node:test";
import assert from "node:assert/strict";
import { FEATURES, DOCS, CASES, LEVELS, MARGIN, ROUND, REP, TOOLS } from "../activity/src/forgery/data.js";
import { start, doc, test as probe, judge, next, settle, perfect, maxScore, dailyOf, oldFor, newFor, makeDoc, rng } from "../activity/src/forgery/logic.js";
import { SHOP, SLOTS, buyOrUse, lookOf, DEFAULT_LOOK } from "../activity/src/forgery/shop.js";
import { deskHtml } from "../activity/src/forgery/scene.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { ROOM_BOOKS } from "../activity/src/library.js";

test("real data: every feature dated, every document has old clues and at least one slip", () => {
  assert.equal(new Set(FEATURES.map((f) => f.id)).size, FEATURES.length);
  for (const f of FEATURES) { assert.ok(TOOLS[f.tool], f.id); assert.ok(f.found.length > 20 && f.seen.length > 5); assert.ok(f.year > 0 && f.year < 2000); }
  for (const d of DOCS) { assert.ok(oldFor(d.year).length >= 4, d.id); assert.ok(newFor(d.year).length >= 1, d.id); }
  for (const c of CASES) assert.ok(c.fact.length > 60);
  const rand = rng(3);
  for (const d of DOCS) { const x = makeDoc(d, 4, false, rand); assert.equal(x.feats.length, 4); assert.ok(x.fake);
    for (const id of x.feats) { const f = FEATURES.find((y) => y.id === id); if (id === x.fake) assert.ok(f.year >= d.year + MARGIN); else assert.ok(f.year <= d.year - MARGIN); } }
});

test("a round: tests are limited, verdicts score, genuine documents appear from Level 2", () => {
  const g = start(LEVELS[0], { seed: 5 }); assert.equal(g.docs.length, ROUND); assert.ok(g.docs.every((d) => d.fake && d.feats.length === 3));
  const d = doc(g), f = probe(g, d.feats[0]); assert.ok(f); assert.equal(g.tests, LEVELS[0].tests - 1); assert.equal(probe(g, d.feats[0]), null);
  for (const x of g.docs) { assert.equal(judge(g, x.fake), "right"); next(g); }
  assert.ok(g.over && g.won && perfect(g)); assert.equal(g.score, Math.round((ROUND * 3 + g.tests) * 1));
  const p = {}, r = settle(p, g); assert.ok(r.newCase); assert.equal(p.rooms.forgery.caught, ROUND);
  let gens = 0; for (let s = 1; s < 20; s++) gens += start(LEVELS[1], { seed: s }).docs.filter((x) => !x.fake).length; assert.ok(gens > 0);
  assert.equal(maxScore(LEVELS[2]), Math.round((ROUND * 3 + 5) * 2));
});

test("wrong calls cost reputation and can lose the round", () => {
  const g = start(LEVELS[1], { seed: 8 });
  for (let i = 0; i < REP; i++) { const d = doc(g), wrong = d.fake ? "genuine" : d.feats[0]; const r = judge(g, wrong); if (r === "lost") break; next(g); }
  assert.ok(g.over && !g.won); assert.equal(g.rep, 0); assert.equal(g.score, 0);
  const d = dailyOf("2026-11-28"); assert.deepEqual(start(d.L, { seed: d.seed }).docs, start(d.L, { seed: d.seed }).docs);
});

test("drawing, shop and wiring", () => {
  assert.match(deskHtml({ look: DEFAULT_LOOK, year: "1863", tool: "uv" }), /t-uv/);
  for (const [k] of SLOTS) assert.equal(SHOP.filter((s) => s.slot === k && s.price === 0).length, 1);
  for (const s of SHOP) assert.ok(s.id.startsWith("fo-") && s.note.length > 40, s.id);
  const p = { essence: 70 }; assert.equal(buyOrUse(p, "fo-vinland"), "poor"); assert.equal(buyOrUse(p, "fo-quartz"), "bought"); assert.equal(lookOf(p).lamp, "fo-quartz");
  assert.ok(TROPHIES.some((t) => t.id === "forgery")); assert.ok(BANTER.forgery); assert.ok(ROOM_BOOKS.forgery);
});
