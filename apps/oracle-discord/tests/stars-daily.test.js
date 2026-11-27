// Daily Constellation: everyone gets the same figure and starting sky each UTC day; faster, cleaner drawings score higher.
import test from "node:test";
import assert from "node:assert/strict";
import { dailySeed, finishDaily, dailyState } from "../activity/src/daily.js";
import { DECK, LEVELS, dailyPick, dailyScore, start, startView, attempt, figureEdges } from "../activity/src/stars/engine.js";

test("same constellation and start view for everyone on a day, different days vary", () => {
  const s = dailySeed("stars", "2026-11-27");
  assert.equal(dailyPick(s).id, dailyPick(dailySeed("stars", "2026-11-27")).id);
  const a = start(dailyPick(s), LEVELS[1], s), b = start(dailyPick(s), LEVELS[1], s);
  assert.deepEqual(startView(dailyPick(s), a.seed), startView(dailyPick(s), b.seed));
  const ids = new Set(Array.from({ length: 30 }, (_, i) => dailyPick(dailySeed("stars", `2026-12-${String(i + 1).padStart(2, "0")}`)).id));
  assert.ok(ids.size >= 12, `a month of dailies uses many constellations (${ids.size})`);
  assert.ok(DECK.includes(dailyPick(s)));
});

test("fastest clean draw scores highest; only the first run of the day counts", () => {
  const g = DECK[0], run = start(g, LEVELS[1], 1);
  assert.equal(dailyScore(run, 50), 0, "not drawn = 0");
  for (const [x, y] of figureEdges(g)) attempt(run, g, x, y);
  assert.equal(dailyScore(run, 60), 1100); run.mistakes = 2; assert.equal(dailyScore(run, 60), 1000); assert.equal(dailyScore(run, 0), 400);
  run.mistakes = 20; assert.equal(dailyScore(run, 0), 100, "never below 100 when drawn");
  run.revealed = true; assert.equal(dailyScore(run, 60), 0, "revealed doesn't count");
  const p = {}; assert.equal(finishDaily(p, "stars", { score: 900, won: true }, "2026-11-27").first, true);
  assert.equal(finishDaily(p, "stars", { score: 1200, won: true }, "2026-11-27").first, false);
  assert.equal(dailyState(p, "stars", "2026-11-27").today.score, 900);
});
