// Constellation Rummy: the deck is real, sets follow the rules, the Oracle plays legal games, scores add up.
import test from "node:test";
import assert from "node:assert/strict";
import { Constellation } from "astronomy-engine";
import { STARS, STAR_NAMES } from "../activity/src/stars/sky.gen.js";
import { CARDS, CARD, CONS, CLASSES, LEVELS } from "../activity/src/rummy/deck.js";
import { newGame, setType, fits, draw, layDown, layOff, discard, tally, oracleTurn, settle, pts, room, backOf } from "../activity/src/rummy/engine.js";
import { GUIDE } from "../activity/src/rummy/guide.js";

test("deck: 48 real stars, 4 per constellation, in the right constellation", () => {
  assert.equal(CARDS.length, 48); assert.equal(Object.keys(CONS).length, 12);
  for (const con of Object.keys(CONS)) assert.equal(CARDS.filter((c) => c.con === con).length, 4, con);
  for (const c of CARDS) {
    const s = STARS.find((x) => x[4] === c.hip); assert.ok(s, c.name);
    assert.equal(s[5], c.con, c.name); assert.equal(Constellation(s[0] / 15, s[1]).symbol, c.con, c.name);
    assert.ok(CLASSES[c.cls], c.name); assert.ok(c.fact.length > 20, c.name);
    if (STAR_NAMES[c.hip] && c.name !== "Schedar") assert.equal(STAR_NAMES[c.hip], c.name);
  }
  assert.equal(new Set(CARDS.map((c) => c.hip)).size, 48);
  // brightness points: Sirius 3, Polaris 2, Yildun 1
  assert.equal(pts(32349), 3); assert.equal(pts(11767), 2); assert.equal(pts(85822), 1);
  // red cards really are red (B-V high), blue cards blue
  for (const c of CARDS) { if (c.cls === "M") assert.ok(c.bv > 1.4, c.name); if (c.cls === "B") assert.ok(c.bv < 0.1, c.name); }
  for (const L of LEVELS) for (const con of L.cons) assert.ok(CONS[con], con);
});

test("sets: constellation sets of 3-4, colour sets only from Level 2, distinct constellations", () => {
  const g1 = newGame(LEVELS[0], 1), g2 = newGame(LEVELS[1], 1);
  const ori = CARDS.filter((c) => c.con === "Ori").map((c) => c.hip);
  assert.deepEqual(setType(g1, ori.slice(0, 3)), { type: "con", key: "Ori" });
  assert.deepEqual(setType(g1, ori), { type: "con", key: "Ori" });
  assert.equal(setType(g1, ori.slice(0, 2)), null);
  const blues = [24436, 49669, 4427]; // Rigel, Regulus, Navi
  assert.equal(setType(g1, blues), null);
  assert.deepEqual(setType(g2, blues), { type: "col", key: "B" });
  assert.equal(setType(g2, [24436, 25336, 49669]), null, "two from Orion is not a colour set");
  const m = { type: "col", key: "B", cards: blues.map((hip) => ({ hip })) };
  assert.ok(fits(g2, 85927, m)); assert.ok(!fits(g2, 25336, m), "Bellatrix: Orion already in the set");
});

test("turn rules: draw, can't throw back the taken discard, going out ends the game", () => {
  const g = newGame(LEVELS[0], 7), t = g.discard[0];
  assert.equal(discard(g, "me", g.hands.me[0]), false, "must draw first");
  assert.equal(draw(g, "me", "discard"), t);
  assert.equal(discard(g, "me", t), false);
  assert.ok(discard(g, "me", g.hands.me[0]));
  assert.equal(g.turn, "or");
});

test("the Oracle plays legal, finishing games at every level; scores add up", () => {
  for (const L of LEVELS) for (let seed = 1; seed <= 60; seed++) {
    const g = newGame(L, seed); let turns = 0;
    // a simple player: draw from the deck, lay down any constellation set, discard the first card
    while (!g.over && turns++ < 400) {
      if (g.turn === "me") { draw(g, "me", "deck"); if (g.over) break;
        const by = {}; for (const h of g.hands.me) (by[CARD[h].con] ||= []).push(h);
        for (const hs of Object.values(by)) if (hs.length >= 3) layDown(g, "me", hs.slice(0, 4));
        if (!g.over) discard(g, "me", g.hands.me.find((h) => h !== g.took) ?? g.hands.me[0]); }
      else for (const _ of oracleTurn(g)) {}
    }
    assert.ok(g.over, `L${L.n} seed ${seed} finished`);
    const cards = [...g.deck, ...g.discard, ...g.hands.me, ...g.hands.or, ...g.melds.flatMap((m) => m.cards.map((c) => c.hip))];
    assert.equal(cards.length, L.cons.length * 4, "no card lost or duplicated"); assert.equal(new Set(cards).size, cards.length);
    for (const m of g.melds) assert.ok(setType(g, m.cards.map((c) => c.hip)) || (m.type === "col" && m.cards.length >= 3), "legal set");
    const s = tally(g); assert.equal(s.me.total, s.me.melded - s.me.hand + s.me.bonus - s.me.miss);
  }
});

test("rewards: first win pays more, progress kept, card backs", () => {
  const p = { xp: 0, essence: 0, owned: [] }, g = newGame(LEVELS[0], 3);
  g.over = true; g.out = "me"; g.hands.me = []; g.melds = [{ id: 1, type: "con", key: "Ori", owner: "me", cards: CARDS.filter((c) => c.con === "Ori").map((c) => ({ hip: c.hip, by: "me" })) }];
  const r = settle(p, g); assert.ok(r.win && r.firstWin); assert.deepEqual(r.newFull, ["Ori"]);
  assert.equal(r.essence, 4 + 10 + 3); assert.equal(room(p).wins[1], 1);
  const r2 = settle(p, g); assert.equal(r2.firstWin, false); assert.equal(r2.essence, 4);
  assert.equal(backOf({}), "cb-midnight"); assert.equal(backOf({ cardback: "cb-deck" }), "cb-midnight"); assert.equal(backOf({ cardback: "cb-pulsar" }), "cb-pulsar");
  assert.ok(GUIDE.sections.length >= 5);
});

test("2 to 4 seats with personas: every game finishes, no card is lost, seats rotate", async () => {
  const { nextSeat, freeze, thaw, PERSONAS } = await import("../activity/src/rummy/engine.js");
  for (const L of LEVELS) for (let n = 2; n <= 4; n++) for (let seed = 1; seed <= 12; seed++) {
    const seats = Array.from({ length: n }, (_, i) => "s" + i), keys = Object.keys(PERSONAS), persona = Object.fromEntries(seats.map((s, i) => [s, keys[(i + seed) % keys.length]]));
    let g = newGame(L, seed, { seats, persona }), total = g.deck.length + g.discard.length + seats.reduce((a, s) => a + g.hands[s].length, 0), steps = 0;
    assert.ok(seats.every((s) => g.hands[s].length === L.hand), "full hands");
    while (!g.over && steps++ < 500) { const who = g.turn; for (const _ of oracleTurn(g, who)) {} if (!g.over) assert.equal(g.turn, nextSeat(g, who)); if (steps % 7 === 0) g = thaw(JSON.parse(JSON.stringify(freeze(g)))); }
    assert.ok(g.over, `L${L.n} ${n} seats seed ${seed} ends`);
    const cards = [...g.deck, ...g.discard, ...seats.flatMap((s) => g.hands[s]), ...g.melds.flatMap((m) => m.cards.map((c) => c.hip))];
    assert.equal(cards.length, total); assert.equal(new Set(cards).size, total);
    const t = tally(g, "s0"); assert.equal(Object.keys(t.by).length, n); assert.ok(t.place >= 1 && t.place <= n);
  }
});

test("a first win against a persona pays its prize once", async () => {
  const p = { xp: 0, essence: 0, owned: [] }, g = newGame(LEVELS[0], 5, { persona: { or: "trickster" } });
  g.over = true; g.out = "me"; g.hands.me = []; g.melds = [{ id: 1, type: "con", key: "Ori", owner: "me", cards: CARDS.filter((c) => c.con === "Ori").map((c) => ({ hip: c.hip, by: "me" })) }];
  const r = settle(p, g); assert.equal(r.beat.key, "trickster"); assert.equal(r.essence, 4 + 10 + 3 + 20);
  assert.equal(settle(p, g).beat, null);
});
