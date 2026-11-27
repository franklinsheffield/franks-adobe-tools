import test from "node:test";
import assert from "node:assert";
import { DECKS, deckById, ALL_CARDS, cardByKey } from "../activity/src/memory/deck.js";
import { TIERS, TITLES, starsFor, pickPairs, deal, flip, hide, peek, settle, room, learnedCount, keyOf } from "../activity/src/memory/engine.js";
import { HOOKS } from "../activity/src/memory/guide.js";
import { OWN_BACK, backOf, backHtml } from "../activity/src/memory/shop.js";
import { STORE, ensureFree, buy } from "../activity/src/store.js";
import { fresh } from "../activity/src/game.js";

const seeded = (s = 1) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

test("Memory decks: complete, unique, every deck has a guide", () => {
  assert.deepEqual(DECKS.map((d) => d.id), ["alchemy", "futhark", "ogham", "egyptian", "maya", "mixed"]);
  assert.equal(new Set(ALL_CARDS.map((c) => c.key)).size, ALL_CARDS.length, "keys unique");
  for (const D of DECKS) {
    assert.ok(HOOKS[D.id] && HOOKS[D.id].length, D.id + " has memory hooks");
    assert.ok(D.cards.length >= Math.max(...TIERS.map((T) => T.pairs)), D.id + " has enough pairs for Master");
    for (const c of D.cards) {
      assert.ok(c.name && c.fact && c.g !== undefined && c.g !== "", c.key);
      assert.ok(["glyph", "svg", "maya"].includes(c.kind), c.key);
      if (c.kind === "glyph") assert.ok(c.font, c.key + " font");
    }
    // two meaning cards on one board must never read the same
    const faces = D.cards.map((c) => `${c.name}|${c.gloss}|${c.sub}`);
    assert.equal(new Set(faces).size, faces.length, D.id + " meaning cards distinct");
  }
  assert.equal(deckById("futhark").cards.length, 24);
  assert.equal(deckById("ogham").cards.length, 20);
  assert.equal(deckById("maya").cards.length, 20);
  assert.equal(deckById("alchemy").cards.length, 14);
  assert.equal(cardByKey("alchemy:copper").gloss, "Venus");
  assert.equal(cardByKey("futhark:fehu").sub, "f");
  assert.equal(cardByKey("egyptian:owl").sub, "m");
});

test("Memory engine: deal, flip, match, miss, win", () => {
  for (const T of TIERS) for (const D of DECKS) {
    const g = deal(D, T, [], seeded(T.n + D.id.length));
    assert.equal(g.cards.length, T.pairs * 2);
    assert.equal(new Set(g.pairs.map((c) => c.key)).size, T.pairs, "no repeated pairs");
    for (const p of g.pairs) assert.deepEqual(g.cards.filter((c) => c.key === p.key).map((c) => c.side).sort(), ["m", "s"]);
  }
  const T = TIERS[0], D = deckById("futhark"), g = deal(D, T, [], seeded(3));
  const a = g.cards[0], other = g.cards.find((c) => c.key !== a.key), twin = g.cards.find((c) => c.key === a.key && c !== a);
  assert.equal(flip(g, a.i), "first"); assert.equal(flip(g, a.i), "ignored");
  assert.equal(flip(g, other.i), "miss"); assert.equal(g.misses, 1); assert.equal(g.candles, T.candles - 1);
  assert.equal(flip(g, twin.i), "ignored", "two cards are up: wait for hide()");
  hide(g); assert.ok(!a.up && !other.up);
  flip(g, a.i); assert.equal(flip(g, twin.i), "match"); assert.ok(a.done && twin.done);
  let r; for (const p of g.pairs.filter((x) => x.key !== a.key)) { const [x, y] = g.cards.filter((c) => c.key === p.key); flip(g, x.i); r = flip(g, y.i); }
  assert.equal(r, "won"); assert.ok(g.done); assert.equal(g.bestCombo, T.pairs, "all pairs in a row after the miss");
  assert.ok(g.bonus > 0);
  peek(g, false); assert.ok(g.cards.every((c) => c.up === false || c.done));
  assert.equal(g.found.length, T.pairs);
  // running out of candles ends the game
  const h = deal(deckById("ogham"), TIERS[2], [], seeded(11)); let out;
  for (let k = 0; k < TIERS[2].candles; k++) { const x = h.cards.find((c) => !c.done && !c.up), y = h.cards.find((c) => !c.done && !c.up && c.key !== x.key); flip(h, x.i); out = flip(h, y.i); if (out === "miss") hide(h); }
  assert.equal(out, "out"); assert.ok(h.done && h.lost); assert.equal(h.candles, 0); assert.equal(flip(h, 0), "ignored");
});

test("Memory stars, picking unlearned first, mixed deck spread", () => {
  assert.equal(starsFor(12, 12), 3); assert.equal(starsFor(6, 12), 3); assert.equal(starsFor(5, 12), 2); assert.equal(starsFor(3, 12), 2); assert.equal(starsFor(2, 12), 1); assert.equal(starsFor(0, 12), 0);
  // harder tiers: more pairs, fewer candles
  for (let i = 1; i < TIERS.length; i++) { assert.ok(TIERS[i].pairs > TIERS[i - 1].pairs); assert.ok(TIERS[i].candles < TIERS[i - 1].candles); }
  const D = deckById("alchemy"), learned = D.cards.slice(0, 8).map((c) => c.key);
  const got = pickPairs(D, TIERS[0], learned, seeded(9));
  assert.ok(got.every((c) => !learned.includes(c.key)), "6 unlearned of 14 exist: all picked fresh");
  const mixed = pickPairs(deckById("mixed"), TIERS[2], [], seeded(5));
  assert.equal(new Set(mixed.map((c) => c.deck)).size, 5, "master mixed takes from all five decks");
});

test("Memory settle: rewards, best stars, learned signs, titles", () => {
  const p = fresh(), T = TIERS[1], D = deckById("ogham"), g = deal(D, T, [], seeded(2));
  for (const p2 of g.pairs) g.found.push(p2.key);
  g.candles = 3; // of 10: 2 stars
  const r1 = settle(p, g, T, D);
  assert.equal(r1.stars, 2); assert.ok(r1.first); assert.equal(r1.fresh.length, 8);
  assert.equal(r1.xp, 8 + 16 + 8); // unit round(5*1.5)=8: first clear 8, two new stars 16, 8 signs learned 8
  assert.equal(r1.essence, 8 + 16);
  assert.equal(room(p).best[keyOf(T, D)], 2); assert.equal(learnedCount(p, "ogham"), 8); assert.equal(room(p).plays, 1);
  const g2 = deal(D, T, room(p).learned, seeded(4)); g2.found = g2.pairs.map((x) => x.key);
  const r2 = settle(p, g2, T, D);
  assert.equal(r2.newStars, 1); assert.equal(r2.essence, 8); assert.ok(!r2.first);
  const g3 = deal(D, T, room(p).learned, seeded(6)); g3.found = g3.pairs.map((x) => x.key); g3.candles = 1;
  const r3 = settle(p, g3, T, D); assert.equal(r3.essence, 0); assert.ok(r3.xp >= 2, "practice still pays");
  // a board lost to the candles: no stars, no first-clear pay, only the pairs found are learned
  const q = fresh(), D2 = deckById("futhark"), lost = deal(D2, T, [], seeded(8));
  lost.found = [lost.pairs[0].key]; lost.lost = true; lost.candles = 0;
  const r4 = settle(q, lost, T, D2);
  assert.equal(r4.stars, 0); assert.equal(r4.essence, 0); assert.ok(!r4.first); assert.deepEqual(r4.fresh, [lost.pairs[0].key]);
  assert.equal(room(q).best[keyOf(T, D2)], 0);
  assert.equal(room(p).best[keyOf(T, D)], 3, "best never drops");
  assert.equal(TITLES[TITLES.length - 1].at, ALL_CARDS.length);
});

test("Memory card backs follow the store's Cards shelf", () => {
  const p = ensureFree(fresh()); assert.equal(p.cardback, "cb-deck");
  assert.equal(backOf(p), OWN_BACK); assert.equal(backOf({}), OWN_BACK); assert.ok(backHtml(OWN_BACK).includes("<svg"));
  p.essence = 500; assert.ok(buy(p, "cb-lapis")); p.cardback = "cb-lapis";
  assert.equal(backOf(p).unified, "cb-lapis"); assert.match(backHtml(backOf(p)), /class="cbk"/);
  assert.ok(!STORE.some((s) => /^gm-/.test(s.id)));
});
