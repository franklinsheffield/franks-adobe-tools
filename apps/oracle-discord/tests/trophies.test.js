import test from "node:test";
import assert from "node:assert/strict";

test("trophies: tiers, one-time payouts, prismatic, sets, oracle readings, showcase", async () => {
  const T = await import("../activity/src/trophies.js");
  assert.equal(T.TROPHIES.length, 22);
  const p = { essence: 0 };
  assert.equal(T.recordWin(p, "seance", 1, { won: true }), null, "needs 3 wins");
  T.recordWin(p, "seance", 1, { won: true }); const n = T.recordWin(p, "seance", 1, { won: true, perfect: true });
  assert.deepEqual([n.from, n.tier, n.pay], [0, 1, 25]);
  assert.equal(T.recordWin(p, "seance", 1, { won: true }), null, "no repeat payout");
  assert.equal(T.recordWin(p, "seance", 2, { won: false }), null, "a loss counts nothing");
  const d = T.recordWin(p, "duel", 3, { won: true }); assert.deepEqual([d.tier, d.pay], [3, 25 + 60 + 120], "skipping ahead pays every tier crossed");
  T.recordWin(p, "duel", 1, { won: true, perfect: true }); T.recordWin(p, "duel", 2, { won: true, perfect: true });
  const pr = T.recordWin(p, "duel", 3, { won: true, perfect: true }); assert.equal(pr.tier, 4); assert.equal(pr.pay, 250);
  T.recordWin(p, "rummy", 3, { won: true }); const set = T.recordWin(p, "memory", 3, { won: true });
  assert.equal(set.sets[0].id, "cards"); assert.equal(set.pay, 205 + 100);
  p.readings = 50; p.systems = { tarot: 1 }; assert.equal(T.recordReading(p, 14).tier, 2);
  assert.equal(T.caseLevel(p).name, "Curator");
  T.togglePin(p, "duel"); T.togglePin(p, "rummy"); T.togglePin(p, "memory"); T.togglePin(p, "seance");
  assert.deepEqual(p.showcase, ["rummy", "memory", "seance"]); T.togglePin(p, "alchemy"); assert.equal(p.showcase.length, 3, "locked trophies can't be pinned");
  for (const t of T.TROPHIES) for (const k of ["none", "bronze", "silver", "gold", "prism"]) assert.match(T.trophyArt(t.art, k), /<svg/);
  assert.ok(T.earned(p) > 0);
});

test("trophies: every game room reports to the Trophy Case", async () => {
  const { readFileSync } = await import("node:fs");
  for (const r of ["seance", "decoder", "alchemy", "timeline", "stars", "calendar", "grimoire", "duel", "memory", "rummy", "watch", "comet"])
    assert.match(readFileSync(new URL(`../activity/src/${r}/room.js`, import.meta.url), "utf8"), new RegExp(`trophy\\?\\.\\("${r}"`), r);
});

test("trophies: no trophy name contains a tier's name", async () => {
  const T = await import("../activity/src/trophies.js");
  for (const t of T.TROPHIES) for (const x of T.TIERS.slice(1)) assert.ok(!new RegExp(`\\b${x.name}\\b`, "i").test(t.name + " " + (T.LINES[t.id] || "")), `${t.name} mentions ${x.name}`);
});
