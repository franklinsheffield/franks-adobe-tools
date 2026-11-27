// End credits (activity/src/credits.js): roll on finishing every game on every level, once, with a permanent Star Crown.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { GAMES, mastered, masteryCount, checkMastery, hasCrown, creditSections, SPECIAL_THANKS, CREDITS_SONG, levelsDone } from "../activity/src/credits.js";
import { recordWin, TROPHIES } from "../activity/src/trophies.js";
import { TRACKS, checkUnlocks, musicOf } from "../activity/src/music.js";

const winAll = (p, upTo = 3) => { for (const t of GAMES) for (let L = 1; L <= upTo; L++) for (let i = 0; i < t.need; i++) recordWin(p, t.id, L, { won: true }); };

test("the credits roll once, after every game is finished on every level", () => {
  const p = {};
  assert.equal(GAMES.length, TROPHIES.length - 1); assert.ok(!GAMES.some((t) => t.id === "oracle"));
  winAll(p, 2); assert.equal(mastered(p), false); assert.equal(checkMastery(p), false); assert.equal(hasCrown(p), false);
  assert.deepEqual(masteryCount(p), { done: GAMES.length * 2, of: GAMES.length * 3 });
  for (const t of GAMES.slice(1)) for (let i = 0; i < t.need; i++) recordWin(p, t.id, 3, { won: true });
  assert.equal(mastered(p), false, "one game still missing its last level");
  const last = GAMES[0]; for (let i = 0; i < last.need; i++) recordWin(p, last.id, 3, { won: true });
  assert.deepEqual(levelsDone(p, last.id), [1, 2, 3]);
  assert.equal(checkMastery(p), true); assert.equal(hasCrown(p), true); assert.equal(checkMastery(p), false, "only once");
});

test("mastery unlocks the credits song as a record", () => {
  const p = {}; musicOf(p); winAll(p); checkMastery(p);
  assert.ok(checkUnlocks(p).some((t) => t.id === CREDITS_SONG));
  assert.ok(TRACKS.some((t) => t.id === CREDITS_SONG));
  assert.ok(existsSync(new URL(`../activity/music/${CREDITS_SONG}.mp3`, import.meta.url)));
});

test("the credits name the creator, the music, every room and a special thanks", () => {
  const S = creditSections(), all = JSON.stringify(S);
  for (const s of ["Frank Sheffield", "Zona", "Claude", "Astronomy Engine", "Hipparcos", "OpenStreetMap", "Pamela Colman Smith", "Harry Houdini"]) assert.ok(all.includes(s), s);
  for (const t of GAMES) assert.ok(all.includes(t.game), t.game);
  for (const t of TRACKS) assert.ok(all.includes(t.title), t.title);
  assert.equal(SPECIAL_THANKS.name, "Frank Sheffield");
});
