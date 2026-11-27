// The Chamber's music (activity/src/music.js): 16 records, one to start, 12 by tasks, 3 in the store, an endless playlist.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { TRACKS, STARTER, musicOf, hasTrack, checkUnlocks, playlist, togglePlaylist, moveInPlaylist, battleList, nextIndex, recordShop, shopId, trackOf } from "../activity/src/music.js";
import { fresh } from "../activity/src/game.js";
import { STORE, registerShelf, deptOf } from "../activity/src/store.js";

test("16 records: 1 to start, 12 by tasks, 3 for sale, 2 battle themes, every file present", () => {
  assert.equal(TRACKS.length, 16); assert.equal(new Set(TRACKS.map((t) => t.id)).size, 16);
  assert.deepEqual(TRACKS.filter((t) => t.how === "start").map((t) => t.id), [STARTER]);
  assert.equal(TRACKS.filter((t) => t.how === "task").length, 12); assert.equal(TRACKS.filter((t) => t.how === "shop").length, 3);
  assert.deepEqual(TRACKS.filter((t) => t.hero).map((t) => t.id).sort(), ["arcade-heros-theme", "high-score-hero"]);
  for (const t of TRACKS) { assert.ok(existsSync(new URL(`../activity/music/${t.id}.mp3`, import.meta.url)), t.id); if (t.how === "task") assert.ok(t.task && typeof t.test === "function", t.id); }
});

test("a new member owns only the starter; tasks unlock records and add them to the playlist (heroes stay for battles)", () => {
  const p = fresh(); const s = musicOf(p);
  assert.equal(s.on, true); assert.deepEqual(playlist(p), [STARTER]); assert.equal(TRACKS.filter((t) => hasTrack(p, t)).length, 1);
  assert.deepEqual(checkUnlocks(p), []);
  p.readings = 1; assert.deepEqual(checkUnlocks(p).map((t) => t.id), ["pixel-and-pennywhistle"]); assert.deepEqual(checkUnlocks(p), [], "only once");
  p.trophies = { duel: { tier: 1 } }; s.lost = true;
  assert.deepEqual(checkUnlocks(p).map((t) => t.id).sort(), ["dreamy-game-over", "high-score-hero"]);
  assert.ok(!playlist(p).includes("high-score-hero") && playlist(p).includes("dreamy-game-over"));
  assert.deepEqual(battleList(p, "duel"), ["high-score-hero"]); assert.equal(battleList(p, "seance"), null);
});

test("the playlist: only owned records, add, remove, reorder, loops forever", () => {
  const p = fresh(); musicOf(p);
  assert.equal(togglePlaylist(p, "pixel-shaman"), false, "can't add a record you don't own");
  p.owned = [shopId(trackOf("pixel-shaman"))]; assert.equal(togglePlaylist(p, "pixel-shaman"), true);
  moveInPlaylist(p, "pixel-shaman", -1); assert.deepEqual(playlist(p), ["pixel-shaman", STARTER]);
  assert.equal(togglePlaylist(p, STARTER), false); assert.deepEqual(playlist(p), ["pixel-shaman"]);
  assert.equal(nextIndex(2, 3), 0); assert.equal(nextIndex(0, 3, -1), 2); assert.equal(nextIndex(0, 1), 0);
});

test("three records are sold on the Records shelf in The Chamber department", () => {
  assert.equal(recordShop.items.length, 3); for (const it of recordShop.items) assert.ok(!STORE.some((s) => s.id === it.id), it.id);
  registerShelf(recordShop); assert.equal(deptOf("record").id, "chamber");
  const css = readFileSync(new URL("../activity/src/chamber.css", import.meta.url), "utf8"); assert.ok(css.includes(".tt.playing .tt-disc"));
});

test("the four themed records unlock their own way: runes, coins, daily streaks, a mystery box", () => {
  const p = fresh(); musicOf(p); checkUnlocks(p);
  p.gs = ["cipher"]; p.essence = 1000; p.daily = { duel: { best: 3 } }; p.boxes = 1;
  assert.deepEqual(checkUnlocks(p).map((t) => t.id).sort(), ["arcade-alley", "coin-drop-groove", "jade-cartridge-shop", "the-nordic-trading-post"]);
});
