// End credits (activity/src/credits.js): roll on finishing every game on every level, once, with a permanent Star Crown.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { GAMES, CREDITS_TITLES, COMPOSERS, mastered, masteryCount, checkMastery, hasCrown, creditSections, SPECIAL_THANKS, CREDITS_SONG, levelsDone } from "../activity/src/credits.js";
import { recordWin, TROPHIES } from "../activity/src/trophies.js";
import { TRACKS, OPENER, checkUnlocks, musicOf } from "../activity/src/music.js";
import { HOSTS } from "../activity/src/hosts/index.js";
import { readFileSync } from "node:fs";

const winAll = (p, upTo = 3) => { for (const t of GAMES) for (let L = 1; L <= upTo; L++) for (let i = 0; i < t.need; i++) recordWin(p, t.id, L, { won: true }); };

test("the credits roll once, after every game is finished on every level", () => {
  const p = {};
  assert.equal(GAMES.length, TROPHIES.filter((t) => !t.meta).length - 1); assert.ok(!GAMES.some((t) => t.id === "oracle"));
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

test("every House rolls the same credits song with its own title card, host and games first", () => {
  const main = readFileSync(new URL("../activity/src/main.js", import.meta.url), "utf8");
  assert.ok(main.includes('{ id: "credits", emoji: "🎬"'), "a Credits tile in every House menu");
  assert.ok(main.includes("credits: () => rollCredits(false)"), "the tile rolls the credits");
  assert.equal((main.match(/new Audio\(`music\/\$\{CREDITS_SONG\}\.mp3`\)/g) || []).length, 1, "one song for every House");
  for (const h of HOSTS) {
    assert.ok(CREDITS_TITLES[h.id], h.id);
    const S = creditSections(h.id), all = JSON.stringify(S);
    for (const x of HOSTS) { assert.ok(all.includes(x.name), `${h.id}: ${x.name}`); assert.ok(all.includes(x.house), `${h.id}: ${x.house}`); }
    assert.ok(S[1].rows[0][1] === h.name, `${h.id}: its host first`);
    for (const t of GAMES) assert.ok(all.includes(t.game), `${h.id}: ${t.game}`);
    if (h.rooms !== "all") assert.equal(S[3].h, `Games in ${h.house}`);
    for (const s of ["Bubble and Brass", "Music of the Spheres", "Knock Once for Yes", "Vespers at the Desk", "Possession", "Fact or Fib", "Surveyor Flint", "emoji", "Wall of curiosities", "The reading nook", "Study hall", "Don't Judge a Space Kid", ...COMPOSERS]) assert.ok(all.includes(s), `${h.id}: ${s}`);
  }
});
