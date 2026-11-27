import test from "node:test";
import assert from "node:assert";
import { CASES, TOOLS, TITLES } from "../activity/src/seance/cases.js";
import { CANDLES, start, examine, guess, settle, toolChoices, solvedCount, titleOf, nextCase, room } from "../activity/src/seance/logic.js";
import { fresh, merge, activity } from "../activity/src/game.js";

test("Séance cases: 12 complete, one right answer each, every tool reachable", () => {
  assert.equal(CASES.length, 12);
  assert.equal(new Set(CASES.map((c) => c.id)).size, 12);
  for (const c of CASES) {
    assert.equal(c.clues.length, 4, c.id);
    assert.ok(c.clues.filter((k) => k.herring).length <= 1, c.id);
    assert.ok(c.options.length >= 3 && c.answer >= 0 && c.answer < c.options.length, c.id);
    assert.ok(TOOLS[c.tool] && c.decoys.length === 2 && c.decoys.every((d) => TOOLS[d] && d !== c.tool), c.id);
    for (const k of ["title", "year", "place", "medium", "question", "reveal", "exposed", "fact", "emoji", "prop"]) assert.ok(c[k], c.id + " " + k);
    assert.deepEqual([...toolChoices(c)].sort(), [c.tool, ...c.decoys].sort());
  }
  assert.deepEqual(new Set(CASES.map((c) => c.tool)), new Set(Object.keys(TOOLS)), "each toolkit idea is taught by a case");
  assert.equal(TITLES.at(-1).at, CASES.length);
});

test("Séance rules: candles, clues, wrong guesses, closing unsolved", () => {
  const c = CASES[0], run = start(c);
  assert.equal(run.candles, CANDLES);
  assert.ok(examine(run, 0)); assert.ok(!examine(run, 0), "same clue twice");
  examine(run, 1); examine(run, 2);
  assert.equal(run.candles, 1); assert.ok(!examine(run, 3), "the last candle is kept for the guess");
  const wrong = c.answer === 0 ? 1 : 0;
  assert.equal(guess(run, c, wrong), "out"); assert.ok(run.done && !run.won);
  const r2 = start(c);
  assert.equal(guess(r2, c, wrong), "wrong"); assert.equal(guess(r2, c, wrong), null, "same wrong option twice");
  assert.equal(guess(r2, c, c.answer), "right"); assert.equal(r2.candles, 3);
});

test("Séance rewards: first solve pays, replays pay only improvements, tools once", () => {
  const p = fresh(), c = CASES[1];
  let run = start(c); examine(run, 0); guess(run, c, c.answer);
  let g = settle(p, run, c.tool);
  assert.equal(g.xp, 10 + 5 * 3 + 5); assert.equal(g.essence, g.xp); assert.ok(g.first && g.newTool);
  run = start(c); examine(run, 0); guess(run, c, c.answer);
  g = settle(p, run, c.tool); assert.equal(g.xp, 0, "same score again pays nothing");
  run = start(c); guess(run, c, c.answer);
  g = settle(p, run, c.tool); assert.equal(g.xp, 5); assert.ok(g.best && !g.newTool);
  run = start(c); for (const i of [0, 1, 2]) examine(run, i); guess(run, c, c.answer === 0 ? 1 : 0);
  g = settle(p, run, null); assert.equal(g.xp, 3); assert.equal(g.essence, 0);
  assert.equal(solvedCount(p), 1); assert.equal(titleOf(solvedCount(p)).name, "Curious");
  assert.equal(nextCase(p).id, CASES[0].id);
  assert.equal(room(p).plays, 4);
});

test("merge keeps room progress (plays count with readings)", () => {
  const a = { ...fresh(), readings: 2 }, b = fresh(); room(b).plays = 5;
  assert.equal(activity(b), 5); assert.equal(merge(a, b), b);
  assert.equal(merge({ ...fresh(), readings: 9 }, b).readings, 9);
});
