import test from "node:test";
import assert from "node:assert";
import { FIELDS } from "../activity/src/seance/ghosts.js";
import { LEVELS, ALL, TITLES, CANDLES, start, guessField, moreClue, usePick, whoIs, choices, guessName, settle, solvedCount, room, nextGhost, keyOf } from "../activity/src/seance/logic.js";
import { fresh, merge, activity } from "../activity/src/game.js";

test("Séance decks: three levels, 5 real clues each, no clue gives the answer away", () => {
  assert.equal(LEVELS.length, 3);
  for (const L of LEVELS) {
    assert.ok(L.deck.length >= 12, "level " + L.n);
    assert.equal(new Set(L.deck.map((g) => g.id)).size, L.deck.length);
    for (const f of Object.keys(FIELDS)) assert.ok(L.deck.some((g) => g.field === f), `level ${L.n} has ${f}`);
    for (const g of L.deck) {
      assert.equal(g.clues.length, 5, g.id); assert.ok(FIELDS[g.field], g.id);
      for (const k of ["name", "emoji", "bio", "link"]) assert.ok(g[k], g.id + " " + k);
      const giveaway = g.name.toLowerCase().replace(/\s*\(.*\)/, "");
      for (const c of g.clues) assert.ok(!c.toLowerCase().includes(giveaway), `${g.id} clue names the answer: ${c}`);
    }
  }
  assert.equal(LEVELS[2].deck.find((g) => g.id === "tesla").field, "both");
  assert.equal(TITLES.at(-1).at, ALL.length);
});

test("typed answers: every alias matches within its own level, typos forgiven", () => {
  for (const L of LEVELS) for (const g of L.deck) for (const a of g.aliases) assert.equal(whoIs(a, L)?.id, g.id, `L${L.n} ${a}`);
  const [L1, L2, L3] = LEVELS;
  assert.equal(whoIs("Houdni", L3)?.id, "houdini");
  assert.equal(whoIs("houdin", L3)?.id, "roberthoudin");
  assert.equal(whoIs("Marie Currie", L3)?.id, "curie");
  assert.equal(whoIs("astronmy", L1)?.id, "astronomy");
  assert.equal(whoIs("Sleight of Hand", L1)?.id, "sleight");
  assert.equal(whoIs("carbon dating", L2)?.id, "radiocarbon");
  assert.equal(whoIs("Pepper's Ghost", L2)?.id, "peppersghost");
  assert.equal(whoIs("Einstein", L3), null);
  assert.equal(whoIs("", L1), null);
});

test("four-answer choices include the answer once, no repeats", () => {
  for (const L of LEVELS) for (const g of L.deck) { const c = choices(g, L); assert.equal(c.length, 4); assert.equal(new Set(c.map((x) => x.id)).size, 4); assert.ok(c.some((x) => x.id === g.id)); }
});

test("Séance rules and rewards scale by level", () => {
  const [L1, , L3] = LEVELS, g = L3.deck.find((x) => x.id === "faraday"), p = fresh();
  let run = start(g, L3);
  assert.equal(guessField(run, g, "science"), true); assert.equal(guessField(run, g, "magic"), null, "one field guess");
  assert.ok(moreClue(run, g)); assert.equal(run.candles, CANDLES - 1);
  assert.equal(guessName(run, g, whoIs("Tesla", L3)), "wrong");
  assert.equal(guessName(run, g, whoIs("faraday", L3)), "right");
  let r = settle(p, run); assert.equal(r.score, 10 + 6 * 3); assert.ok(r.first); assert.equal(r.essence, r.xp);
  run = start(g, L3); guessField(run, g, "science"); usePick(run); guessName(run, g, g);
  r = settle(p, run); assert.equal(r.xp, 0, "lower score pays nothing");
  const a = L1.deck.find((x) => x.id === "alchemy"); run = start(a, L1);
  guessField(run, a, "both"); guessName(run, a, whoIs("alchemist", L1));
  r = settle(p, run); assert.equal(r.score, 5 + 3 * 5);
  run = start(g, L3); for (let i = 0; i < 4; i++) moreClue(run, g);
  assert.ok(!moreClue(run, g), "last candle kept for a guess");
  assert.equal(guessName(run, g, whoIs("newton", L3)), "out"); r = settle(p, run); assert.equal(r.xp, 3);
  assert.equal(solvedCount(p), 2); assert.equal(solvedCount(p, L1), 1); assert.ok(room(p).solved[keyOf(L3, g)]);
  assert.notEqual(nextGhost(p, L3, "faraday").id, "faraday");
});

test("merge keeps room progress (plays count with readings)", () => {
  const a = { ...fresh(), readings: 2 }, b = fresh(); room(b).plays = 5;
  assert.equal(activity(b), 5); assert.equal(merge(a, b), b);
});
