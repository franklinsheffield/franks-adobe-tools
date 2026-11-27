import test from "node:test";
import assert from "node:assert";
import { GHOSTS, FIELDS, TITLES } from "../activity/src/seance/ghosts.js";
import { CANDLES, start, guessField, moreClue, usePick, whoIs, choices, guessName, settle, solvedCount, room, nextGhost } from "../activity/src/seance/logic.js";
import { fresh, merge, activity } from "../activity/src/game.js";

test("Séance ghosts: complete, 5 clues each, every kind present", () => {
  assert.ok(GHOSTS.length >= 12);
  assert.equal(new Set(GHOSTS.map((g) => g.id)).size, GHOSTS.length);
  for (const g of GHOSTS) {
    assert.equal(g.clues.length, 5, g.id);
    assert.ok(FIELDS[g.field], g.id);
    for (const k of ["name", "life", "emoji", "bio", "link"]) assert.ok(g[k], g.id + " " + k);
    for (const c of g.clues) assert.ok(!c.toLowerCase().includes(g.name.toLowerCase()), g.id + " clue gives the name away");
  }
  for (const f of Object.keys(FIELDS)) assert.ok(GHOSTS.some((g) => g.field === f), f);
  assert.equal(TITLES.at(-1).at, GHOSTS.length);
});

test("typed names: aliases and small typos match the right ghost, nothing else", () => {
  for (const g of GHOSTS) for (const a of g.aliases) assert.equal(whoIs(a)?.id, g.id, a);
  assert.equal(whoIs("Houdni")?.id, "houdini");
  assert.equal(whoIs("houdin")?.id, "roberthoudin");
  assert.equal(whoIs("Marie Currie")?.id, "curie");
  assert.equal(whoIs("Isaac  NEWTON!")?.id, "newton");
  assert.equal(whoIs("Einstein"), null);
  assert.equal(whoIs(""), null);
});

test("four-name choices include the ghost once, no repeats", () => {
  for (const g of GHOSTS) { const c = choices(g); assert.equal(c.length, 4); assert.equal(new Set(c.map((x) => x.id)).size, 4); assert.ok(c.some((x) => x.id === g.id)); }
});

test("Séance rules and rewards", () => {
  const g = GHOSTS.find((x) => x.id === "faraday"), p = fresh();
  let run = start(g);
  assert.equal(guessField(run, g, "scientist"), true); assert.equal(guessField(run, g, "magician"), null, "one field guess");
  assert.ok(moreClue(run, g)); assert.equal(run.candles, CANDLES - 1);
  assert.equal(guessName(run, g, whoIs("Tesla")), "wrong"); assert.equal(run.candles, CANDLES - 2);
  assert.equal(guessName(run, g, whoIs("faraday")), "right");
  let r = settle(p, run); assert.equal(r.score, 10 + 6 * 3); assert.ok(r.first); assert.equal(r.essence, r.xp);
  run = start(g); guessField(run, g, "scientist"); usePick(run); guessName(run, g, g);
  r = settle(p, run); assert.equal(r.score, 10 + 3 * 5); assert.equal(r.xp, 0, "lower score pays nothing");
  run = start(g); guessField(run, g, "magician"); for (let i = 0; i < 4; i++) moreClue(run, g);
  assert.equal(run.candles, 1); assert.ok(!moreClue(run, g), "last candle kept for a guess");
  assert.equal(guessName(run, g, whoIs("newton")), "out");
  r = settle(p, run); assert.equal(r.xp, 3); assert.equal(r.essence, 0);
  assert.equal(solvedCount(p), 1); assert.equal(room(p).plays, 3);
  assert.notEqual(nextGhost(p, "faraday").id, "faraday");
});

test("merge keeps room progress (plays count with readings)", () => {
  const a = { ...fresh(), readings: 2 }, b = fresh(); room(b).plays = 5;
  assert.equal(activity(b), 5); assert.equal(merge(a, b), b);
});
