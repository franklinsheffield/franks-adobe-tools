// Vell's Hazardous Guess Show (Flame Test Lab party mode): rules, sabotage, bets, views, claim, podium shelf.
import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../activity/src/flametest/show.js";
import { showSvg, vellSvg, PODIUMS } from "../activity/src/flametest/show-scene.js";
import { SHOP, SLOTS, DEFAULT_LOOK } from "../activity/src/flametest/shop.js";
import { SAMPLES, sample } from "../activity/src/flametest/data.js";
import { rng } from "../activity/src/timeline/logic.js";

const M = (...ids) => ids.map((id) => ({ id, name: id }));
const wrongFor = (id) => SAMPLES.find((x) => x.id !== id).id;

test("a show deals real samples with joke labels and every line is clean and filled", () => {
  const st = S.newShow(M("a", "b"), rng(1)); assert.equal(st.bottles.length, S.BOTTLES);
  for (const b of st.bottles) { assert.ok(sample(b.id)); assert.ok(S.LABELS.includes(b.label)); assert.equal(b.shelf.length, 3); assert.ok(!b.shelf.includes(b.label)); }
  assert.ok(S.LABELS.includes("Probably Not Soup")); assert.equal(S.HARMS.length, 5);
  for (const f of S.FIREWORKS) assert.ok(sample(f.id), f.id);
  const r = S.roastLine({ guess: "Purple", real: "Lithium", name: "Ada" }, () => 0); assert.ok(!/\{\w+\}/.test(r));
  for (const t of [...S.ROASTS, ...S.CHEERS]) assert.ok(!/\{(?!guess|real|name)\w+\}/.test(t), t);
});

test("scoring: right answers score, the fastest gets a bonus, wrong ones hurt Vell and go on the claim", () => {
  const st = S.newShow(M("a", "b", "c"), rng(2)), id = S.bottle(st).id;
  assert.equal(S.answer(st, "b", id), "ok"); assert.equal(S.answer(st, "a", id), "ok"); assert.equal(S.answer(st, "a", id), null);
  assert.equal(S.answer(st, "c", wrongFor(id)), "ok"); assert.equal(S.answer(st, "z", id), null); assert.ok(S.allAnswered(st));
  const L = S.reveal(st, (x) => x.toUpperCase(), rng(3));
  assert.equal(st.score.b, S.RIGHT + S.FIRST); assert.equal(st.score.a, S.RIGHT); assert.equal(st.score.c, 0);
  assert.equal(L.first, "b"); assert.equal(st.mishap, 1); assert.equal(st.claims[0].name, "C"); assert.equal(st.claims[0].harm, S.HARMS[0].name);
});

test("sabotage: a swap gives the target a different real salt, fog is one-shot, cards run out", () => {
  const st = S.newShow(M("a", "b"), rng(4)), id = S.bottle(st).id;
  assert.equal(S.sabotage(st, "a", "swap", "a"), null);
  assert.equal(S.sabotage(st, "a", "swap", "b", rng(5)), "swap"); assert.notEqual(S.sampleFor(st, "b"), id); assert.ok(sample(S.sampleFor(st, "b")));
  assert.equal(S.sabotage(st, "a", "swap", "b"), null); assert.equal(S.sabotage(st, "a", "fog", "b"), "fog"); assert.equal(S.sabotage(st, "a", "fog", "b"), null);
  S.answer(st, "b", S.sampleFor(st, "b")); S.answer(st, "a", id); S.reveal(st, undefined, rng(6));
  assert.equal(st.score.b, S.RIGHT + (st.answers.b.at < st.answers.a.at ? S.FIRST : 0)); // judged on the swapped bottle
  S.next(st); assert.equal(S.sabotage(st, "a", "swap", "b"), null); // used up
});

test("views hide others' answers, swaps, fog and bets until the reveal", () => {
  const st = S.newShow(M("a", "b"), rng(7)), id = S.bottle(st).id;
  S.answer(st, "a", id); S.sabotage(st, "a", "fog", "b"); assert.equal(S.bet(st, "a", 1), null); assert.equal(S.bet(st, "w", 1), "ok");
  const vb = S.showView(st, "b"); assert.equal(vb.answers.a.s, null); assert.deepEqual(vb.fog, { b: true }); assert.deepEqual(vb.bets, {});
  assert.equal(S.showView(st, "a").answers.a.s, id);
  S.reveal(st, undefined, rng(8)); assert.equal(S.showView(st, "b").answers.a.s, id);
});

test("a full show: late join, bets, finale firework by the winner, insurance claim, rewards", () => {
  const st = S.newShow(M("a", "b"), rng(9));
  assert.ok(S.join(st, "c")); S.answer(st, "a", S.bottle(st).id); assert.ok(!S.join(st, "d"));
  while (st.phase !== "final") { if (st.phase === "burn") { S.answer(st, "a", S.bottle(st).id); S.answer(st, "b", wrongFor(S.bottle(st).id)); S.bet(st, "w", 0); }
    S.advance(st, M("a", "b", "c"), (x) => x, rng(st.i + 10)); }
  assert.equal(st.winner, "a"); assert.equal(S.nameFirework(st, "b", "cu"), null); assert.equal(S.nameFirework(st, "a", "nope"), null);
  assert.equal(S.nameFirework(st, "a", "sr"), "over"); assert.ok(st.over);
  const c = S.claimOf(st, (x) => x.toUpperCase()); assert.equal(c.winner, "A"); assert.ok(c.losers.includes("B") && !c.losers.includes("A"));
  assert.equal(c.firework, "The Strontium Salute"); assert.equal(c.damages.length, st.claims.length); assert.ok(c.no >= 1000 && c.no < 10000);
  assert.ok(st.mishap >= S.BOTTLES); assert.equal(S.harmAt(99), S.HARMS[4]);
  const ra = S.reward(st, "a", 3); assert.ok(ra.won && ra.perfect && ra.essence <= 10);
  assert.ok(S.reward(st, "w", 3).essence <= S.AUD_GEMS); assert.ok(!S.reward(st, "b", 3).won);
});

test("the host's timer picks a firework if the winner doesn't", () => {
  const st = S.newShow(M("a"), rng(11), 1); S.advance(st, [], undefined, rng(1)); S.advance(st); assert.equal(st.phase, "final");
  assert.equal(S.advance(st, [], undefined, rng(2)), "over"); assert.ok(S.fireworkOf(st.firework));
});

test("Vell wears every mishap level and the stage draws; podiums are their own store shelf", () => {
  for (let m = 0; m <= 5; m++) assert.match(vellSvg(m), /hs-vell/);
  assert.match(vellSvg(5), /#6b5a52/); assert.match(vellSvg(3), /hs-siren/);
  const svg = showSvg({ look: DEFAULT_LOOK, flame: "cu", mishap: 2, shelf: ["A b", "C d", "E f"], drop: 1, fog: true, firework: "sr", podium: "ft-podium-neon" });
  assert.match(svg, /hs-bottle fall/); assert.match(svg, /fogged goggles/); assert.match(svg, /hs-burst/);
  assert.ok(SLOTS.some(([k]) => k === "podium")); const pods = SHOP.filter((x) => x.slot === "podium");
  assert.ok(pods.length >= 3 && pods.some((p) => p.price > 0)); for (const p of pods) assert.ok(PODIUMS[p.id], p.id);
});
