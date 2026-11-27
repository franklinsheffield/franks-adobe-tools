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
  assert.deepEqual(DECKS.map((d) => d.id), ["alchemy", "futhark", "ogham", "egyptian", "maya", "tarot", "lenormand", "zodiac", "elements", "mixed"]);
  assert.equal(new Set(ALL_CARDS.map((c) => c.key)).size, ALL_CARDS.length, "keys unique");
  for (const D of DECKS) {
    assert.ok(HOOKS[D.id] && HOOKS[D.id].length, D.id + " has memory hooks");
    assert.ok(D.cards.length >= Math.max(...TIERS.map((T) => T.pairs)), D.id + " has enough pairs for Master");
    for (const c of D.cards) {
      assert.ok(c.name && c.fact && c.g !== undefined && c.g !== "", c.key);
      assert.ok(["glyph", "svg", "maya", "label"].includes(c.kind), c.key);
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
  assert.equal(new Set(mixed.map((c) => c.deck)).size, 9, "master mixed takes from all nine decks");
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

// ---- 2.0: new decks, weak signs, spells, daily ----
import { weakKeys, SPELLS, buySpell, cast, hintPair, dailyDeal, dailyScore, rng, spellCount } from "../activity/src/memory/engine.js";
import { HOOKS as HOOKS2 } from "../activity/src/memory/guide.js";

test("memory 2: new decks have the right sizes, unique keys and a guide each", () => {
  const n = Object.fromEntries(DECKS.map((d) => [d.id, d.cards.length]));
  assert.equal(n.tarot, 22); assert.equal(n.lenormand, 36); assert.equal(n.zodiac, 19); assert.equal(n.elements, 52);
  const keys = DECKS.filter((d) => d.id !== "mixed").flatMap((d) => d.cards.map((c) => c.key));
  assert.equal(new Set(keys).size, keys.length);
  for (const d of DECKS) assert.ok(HOOKS2[d.id], d.id);
  const mixed = DECKS.find((d) => d.id === "mixed");
  assert.ok(!mixed.cards.some((c) => c.solo), "planets stay out of the mixed deck");
  const z = DECKS.find((d) => d.id === "zodiac").cards;
  assert.equal(z.find((c) => c.name === "Mars").gloss, "Tuesday");
  assert.equal(z.find((c) => c.name === "Scorpio").sub, "water"); assert.match(z.find((c) => c.name === "Scorpio").fact, /23 Oct–21 Nov/);
  assert.equal(DECKS.find((d) => d.id === "elements").cards.find((c) => c.g === "Fe").name, "Iron");
});

test("memory 2: a mixed deal never contains a planet card", () => {
  const T = TIERS[2], D = DECKS.find((d) => d.id === "mixed");
  for (let s = 1; s < 40; s++) assert.ok(!pickPairs(D, T, [], rng(s)).some((c) => c.solo));
});

test("memory 2: slips make weak signs, weak signs deal before the rest, clean matches heal them", () => {
  const T = TIERS[0], D = DECKS.find((d) => d.id === "futhark"), p = {};
  const g = deal(D, T, [], rng(5));
  const [k1, k2] = [...new Set(g.cards.map((c) => c.key))];
  const a1 = g.cards.find((c) => c.key === k1), a2 = g.cards.find((c) => c.key === k1 && c !== a1), b1 = g.cards.find((c) => c.key === k2);
  assert.equal(flip(g, a1.i), "first"); assert.equal(flip(g, b1.i), "miss"); hide(g); // nothing seen before: no slip
  assert.deepEqual(g.slips, {});
  assert.equal(flip(g, b1.i), "first"); // b1 seen, its twin not yet
  const other = g.cards.find((c) => c.key !== k2 && c.i !== a1.i && !g.seen.includes(c.i));
  flip(g, a1.i); // a1 seen before, not b1's twin: slip on k1 (a1 is the 2nd card, already seen)
  assert.equal(g.slips[k1], 1); hide(g);
  settle(p, g, T, D);
  assert.deepEqual(weakKeys(p), [k1]);
  const learned = p.rooms.memory.learned.concat(D.cards.map((c) => c.key));
  assert.equal(pickPairs(D, T, learned, rng(9), p.rooms.memory.weak)[0].key, k1);
  const g2 = deal(D, T, [], rng(5)); const x = g2.cards.find((c) => c.key === k1), y = g2.cards.find((c) => c.key === k1 && c !== x);
  flip(g2, x.i); flip(g2, y.i); settle(p, g2, T, D);
  assert.deepEqual(weakKeys(p), []);
  assert.ok(other || true); assert.ok(a2);
});

test("memory 2: spells cost Essence, are used once, and are refused on the daily board", () => {
  const p = { essence: 30 };
  assert.equal(buySpell(p, "wick"), true); assert.equal(p.essence, 20); assert.equal(spellCount(p, "wick"), 1);
  assert.equal(buySpell(p, "charm"), true); assert.equal(buySpell(p, "insight"), false);
  const T = TIERS[0], D = DECKS[0], g = deal(D, T, [], rng(2));
  assert.equal(cast(p, g, "wick"), false, "nothing to relight");
  const [a, b] = [g.cards[0], g.cards.find((c) => c.key !== g.cards[0].key)]; flip(g, a.i); flip(g, b.i); hide(g);
  assert.equal(cast(p, g, "wick"), true); assert.equal(g.candles, g.of); assert.equal(spellCount(p, "wick"), 0);
  const pair = hintPair(g); assert.equal(g.cards[pair[0]].key, g.cards[pair[1]].key); assert.notEqual(pair[0], pair[1]);
  const { g: dg } = dailyDeal(7); assert.equal(cast(p, dg, "charm"), false);
  assert.equal(SPELLS.length, 3);
});

test("memory 2: the daily board is the same deal for everyone and scores candles", () => {
  const a = dailyDeal(123456), b = dailyDeal(123456);
  assert.equal(a.D.id, b.D.id); assert.deepEqual(a.g.cards.map((c) => c.key + c.side), b.g.cards.map((c) => c.key + c.side));
  assert.notEqual(a.D.id, "mixed"); assert.equal(a.T.name, "Adept");
  const g = a.g; const keys = [...new Set(g.cards.map((c) => c.key))];
  for (const k of keys) { const [x, y] = g.cards.filter((c) => c.key === k); flip(g, x.i); flip(g, y.i); }
  assert.equal(g.done, true); assert.equal(dailyScore(g), Math.round((8 * 10 + g.bonus) * 1.5) + 100);
  const p = {}; const r = settle(p, g, a.T, a.D); assert.equal(r.newStars, 0); assert.deepEqual(p.rooms.memory.best, {});
});

import { duelNew, duelFlip, duelPass, duelWinner, duelView, duelWho } from "../activity/src/memory/engine.js";
test("memory duel: turns, go again on a pair, pass on a miss, hidden faces, winner", () => {
  const D = DECKS.find((d) => d.id === "tarot"), d = duelNew(D, ["a", "b", "c"], rng(3));
  assert.deepEqual(d.seats, ["a", "b"]); assert.equal(duelWho(d), "a");
  assert.ok(duelView(d).cards.every((c) => c.key === undefined), "face-down cards hide their key");
  assert.equal(duelFlip(d, "b", 0), "ignored", "not b's turn");
  const k0 = d.g.cards[0].key, twin = d.g.cards.find((c) => c.key === k0 && c.i !== 0).i, other = d.g.cards.find((c) => c.key !== k0).i;
  assert.equal(duelFlip(d, "a", 0), "first"); assert.equal(duelView(d).cards[0].key, k0);
  assert.equal(duelFlip(d, "a", twin), "match"); assert.equal(d.score.a, 1); assert.equal(duelWho(d), "a", "a pair goes again");
  const x = d.g.cards.find((c) => !c.done), y = d.g.cards.find((c) => !c.done && c.key !== x.key);
  duelFlip(d, "a", x.i); assert.equal(duelFlip(d, "a", y.i), "miss"); assert.equal(duelFlip(d, "b", x.i), "ignored", "miss still showing");
  duelPass(d); assert.equal(duelWho(d), "b");
  for (const k of [...new Set(d.g.cards.filter((c) => !c.done).map((c) => c.key))]) { const [p, q] = d.g.cards.filter((c) => c.key === k); duelFlip(d, "b", p.i); duelFlip(d, "b", q.i); }
  assert.equal(d.g.done, true); assert.equal(duelWinner(d), "b"); assert.equal(d.score.a + d.score.b, 8);
  assert.ok(JSON.parse(JSON.stringify(d)).g.candles > 0, "a snapshot survives JSON");
  assert.ok(other >= 0);
});
