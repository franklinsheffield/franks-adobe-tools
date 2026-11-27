import test from "node:test";
import assert from "node:assert";
import { FIELDS } from "../activity/src/seance/ghosts.js";
import { POOL } from "../activity/src/seance/practices.js";
import { SKEPTICS, CASES } from "../activity/src/seance/debunk.js";
import { guessMethod, hintsFor, buyHint, HINT_COST, related } from "../activity/src/seance/logic.js";
import { LEVELS, ALL, TITLES, CANDLES, PICK_COST, optionById, start, guessField, moreClue, usePick, whoIs, choices, guessName, settle, solvedCount, room, nextGhost, keyOf } from "../activity/src/seance/logic.js";
import { fresh, merge, activity } from "../activity/src/game.js";

test("Séance decks: three levels, 5 real clues each, no clue gives the answer away", () => {
  assert.equal(LEVELS.length, 4);
  for (const L of LEVELS.slice(0, 3)) {
    assert.ok(L.deck.length >= 12, "level " + L.n);
    assert.equal(new Set(L.deck.map((g) => g.id)).size, L.deck.length);
    for (const f of Object.keys(FIELDS)) assert.ok(L.deck.some((g) => g.field === f), `level ${L.n} has ${f}`);
    for (const g of L.deck) {
      assert.equal(g.clues.length, 5, g.id); assert.ok(FIELDS[g.field], g.id);
      for (const k of ["name", "emoji", "bio", "link"]) assert.ok(g[k], g.id + " " + k);
      const giveaway = g.name.toLowerCase().replace(/\s*\(.*\)/, "");
      for (const c of g.clues) assert.ok(!c.toLowerCase().includes(giveaway), `${g.id} clue names the answer: ${c}`);
      if (L.pool) { assert.ok(g.answers?.length, g.id + " answers"); for (const a of g.answers) assert.ok(POOL.some((x) => x.id === a), g.id + " answer " + a);
        for (const a of g.answers) { const n = POOL.find((x) => x.id === a).name.toLowerCase(); for (const c of g.clues) assert.ok(!c.toLowerCase().includes(n), `${g.id} clue names its kind: ${c}`); } }
    }
  }
  assert.equal(LEVELS[2].deck.find((g) => g.id === "tesla").field, "both");
  assert.ok(LEVELS[0].deck.length >= POOL.length * 3, "about 3 practitioners per pool answer");
  for (const k of POOL) assert.ok(LEVELS[0].deck.filter((g) => g.answers[0] === k.id).length >= 3, "3 ghosts for " + k.id);
  assert.ok(LEVELS[1].deck.length >= 20 && LEVELS[2].deck.length >= 20);
  assert.equal(TITLES.at(-1).at, ALL.length);
});

test("typed answers: every alias matches within its own level, typos forgiven", () => {
  const [L1, L2, L3] = LEVELS;
  for (const L of [L2, L3]) for (const g of L.deck) for (const a of g.aliases) assert.equal(whoIs(a, L)?.id, g.id, `L${L.n} ${a}`);
  for (const k of POOL) for (const a of k.aliases) assert.equal(whoIs(a, L1)?.id, k.id, `pool ${a}`);
  for (const g of L1.deck) for (const a of g.aliases) assert.equal(whoIs(a, L1, g)?.id, g.id, `L1 ghost ${a}`);
  assert.equal(whoIs("Houdni", L3)?.id, "houdini");
  assert.equal(whoIs("houdin", L3)?.id, "roberthoudin");
  assert.equal(whoIs("Marie Currie", L3)?.id, "curie");
  assert.equal(whoIs("astronmy", L1)?.id, "astronomy");
  assert.equal(whoIs("Sleight of Hand", L1)?.id, "sleight");
  assert.equal(whoIs("biologist", L1)?.id, "biology");
  assert.equal(whoIs("Kepler", L3)?.id, "kepler");
  assert.equal(whoIs("Rosalind Franklin", L3)?.id, "rosalind");
  assert.equal(whoIs("zig zag", L2)?.id, "zigzag");
  assert.equal(whoIs("carbon dating", L2)?.id, "radiocarbon");
  assert.equal(whoIs("Pepper's Ghost", L2)?.id, "peppersghost");
  assert.equal(whoIs("Einstein", L3), null);
  assert.equal(whoIs("", L1), null);
});

test("four-answer choices include the answer once, no repeats", () => {
  for (const L of LEVELS) for (const g of L.deck) { const c = choices(g, L); assert.equal(c.length, 4); assert.equal(new Set(c.map((x) => x.id)).size, 4);
    const right = c.filter((x) => (L.pool ? g.answers.includes(x.id) : x.id === g.id)); assert.equal(right.length, 1, `L${L.n} ${g.id} has exactly one right choice`);
    for (const x of c) assert.equal(optionById(x.id, L), x); }
});

test("Séance rules and rewards scale by level", () => {
  const [L1, , L3] = LEVELS, g = L3.deck.find((x) => x.id === "faraday"), p = fresh();
  let run = start(g, L3);
  assert.equal(guessField(run, g, "science"), true); assert.equal(guessField(run, g, "magic"), null, "one field guess");
  assert.ok(moreClue(run, g)); assert.equal(run.candles, CANDLES - 1);
  assert.equal(guessName(run, g, whoIs("Tesla", L3)), "wrong");
  assert.equal(guessName(run, g, whoIs("faraday", L3)), "right");
  let r = settle(p, run); assert.equal(r.score, 10 + 6 * 3); assert.ok(r.first); assert.equal(r.essence, r.xp);
  run = start(g, L3); guessField(run, g, "science"); assert.ok(usePick(run)); assert.equal(run.candles, CANDLES - PICK_COST, "show me 4 blows out 3 candles");
  assert.ok(!usePick(run), "only once"); guessName(run, g, g);
  r = settle(p, run); assert.equal(r.score, 10 + 6 * 2); assert.equal(r.xp, 0, "lower score pays nothing");
  run = start(g, L3); moreClue(run, g); moreClue(run, g); moreClue(run, g); usePick(run); assert.equal(run.candles, 1, "always leaves one candle");
  const c = L1.deck.find((x) => x.id === "cardio"); run = start(c, L1);
  guessField(run, c, "science"); assert.equal(guessName(run, c, whoIs("biologist", L1, c)), "right", "a cardiologist counts as Biology");
  r = settle(p, run); assert.equal(r.score, 5 + 3 * 5);
  const ph = L1.deck.find((x) => x.id === "pharmacist");
  for (const t of ["chemistry", "biology", "pharmacist"]) { run = start(ph, L1); assert.equal(guessName(run, ph, whoIs(t, L1, ph)), "right", t); }
  run = start(ph, L1); assert.equal(guessName(run, ph, whoIs("astrology", L1, ph)), "wrong");
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

test("Séance shelf: candle flames from real flame tests, one free", async () => {
  const { shop, CANDLE_LOOK, candleLook, DEFAULT_CANDLE } = await import("../activity/src/seance/shop.js");
  assert.equal(shop.kind, "seancecandle");
  assert.equal(shop.items.filter((x) => x.price === 0).length, 1);
  for (const it of shop.items) { assert.ok(it.id.startsWith("sc-") && CANDLE_LOOK[it.id], it.id); assert.ok(it.name && it.note, it.id); }
  assert.equal(candleLook("nope"), CANDLE_LOOK[DEFAULT_CANDLE]);
  for (const k of ["open", "tryon", "buy"]) assert.ok(shop.talk[k].length);
});

test("Level 4 Debunk: cases, skeptics, method step, no clue names the skeptic", () => {
  const L4 = LEVELS[3]; assert.ok(L4.debunk && L4.deck === CASES && L4.pool === SKEPTICS);
  assert.ok(CASES.length >= 10);
  for (const c of CASES) {
    assert.equal(c.clues.length, 4, c.id); assert.equal(c.options.length, 4); assert.ok(c.options[c.answer], c.id);
    const sk = SKEPTICS.find((x) => x.id === c.answers[0]); assert.ok(sk, c.id);
    for (const a of sk.aliases.filter((a) => a.length > 4)) for (const t of c.clues) assert.ok(!t.toLowerCase().includes(a), `${c.id} names ${a}`);
    for (const a of sk.aliases) assert.equal(whoIs(a, L4, c)?.id, sk.id, a);
    const ch = choices(c, L4); assert.equal(ch.length, 4); assert.equal(ch.filter((x) => x.id === sk.id).length, 1);
  }
  const c = CASES.find((x) => x.id === "margery"), run = start(c, L4), p = fresh();
  assert.equal(guessMethod(run, c, c.answer), true); assert.equal(guessMethod(run, c, 0), null, "one try");
  assert.equal(guessName(run, c, whoIs("Houdini", L4, c)), "right");
  assert.equal(settle(p, run).score, Math.round(5 * 2.5) + Math.round(3 * 2.5) * 5);
});

test("hints cost Essence, once each; journal links a related ghost", () => {
  const p = { ...fresh(), essence: HINT_COST + 5 };
  for (const L of LEVELS) for (const g of L.deck) {
    const hs = hintsFor(L, g); assert.ok(hs.length >= 2, g.id); assert.equal(new Set(hs.map((h) => h.id)).size, hs.length, g.id);
    const r = related(L, g); assert.ok(r.g && r.L.deck.includes(r.g) && r.g !== g, "related " + g.id);
  }
  const L = LEVELS[2], g = L.deck[0], run = start(g, L);
  assert.equal(buyHint(p, run, "letter"), "ok"); assert.equal(p.essence, 5);
  assert.equal(buyHint(p, run, "letter"), "had"); assert.equal(buyHint(p, run, "when"), "poor");
  const n = hintsFor(LEVELS[0], LEVELS[0].deck[0]).find((h) => h.id === "narrow"); assert.ok(n.text.includes(POOL.find((x) => x.id === LEVELS[0].deck[0].answers[0]).name));
});

test("Daily Ghost: same pick for a seed, rotates levels, share line has no spoilers", async () => {
  const { dailyPick, shareLine } = await import("../activity/src/seance/logic.js");
  const a = dailyPick(12345), b = dailyPick(12345); assert.equal(a.g.id, b.g.id); assert.equal(a.L.n, b.L.n);
  assert.equal(new Set([0, 1, 2, 3].map((i) => dailyPick(1000 + i).L.n)).size, 4);
  const run = { candles: 3, won: true, mode: "type", fieldRight: true, hints: [] }, line = shareLine(run, a.L, 331);
  assert.ok(line.includes("#331") && line.includes("🕯️🕯️🕯️💨💨")); assert.ok(!line.toLowerCase().includes(a.g.name.toLowerCase()));
});
