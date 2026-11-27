// Observatory races and co-op (activity/src/obsrace.js) and their wiring in Comet Hunter, Celestial Navigator, Eclipse Chaser.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rankRace, coopTotal, cleanResult } from "../activity/src/obsrace.js";

test("obsrace: ranking, co-op totals and result cleaning", () => {
  const rows = rankRace({ a: { n: 9, t: 5000, name: "A" }, b: { n: 12, t: 9000, name: "B" }, c: { n: 12, t: 7000, name: "C" } });
  assert.deepEqual(rows.map((r) => [r.id, r.place]), [["c", 1], ["b", 2], ["a", 3]]);
  assert.deepEqual(coopTotal(rows, 27), { total: 33, goal: 27, won: true });
  assert.equal(coopTotal(rows, 40).won, false);
  assert.deepEqual(cleanResult({ n: 9999, t: -4 }, 15), { n: 15, t: 0 });
  assert.deepEqual(cleanResult({ n: "x" }), { n: 0, t: 0 });
});

test("obsrace: the three rooms open a race and report their run through onDone", () => {
  for (const [room, pre] of [["comet", "ch"], ["navigator", "nv"], ["eclipse", "ec"]]) {
    const src = readFileSync(new URL(`../activity/src/${room}/room.js`, import.meta.url), "utf8");
    assert.match(src, /makeRace\(C, \{ game: "/, room); assert.match(src, new RegExp(`id="${pre}-race"`), room);
    assert.match(src, /if \(opt\.onDone\) return opt\.onDone\(\{ n: stars/, room); assert.match(src, /opt\.seed != null/, room);
  }
  assert.match(readFileSync(new URL("../activity/src/eclipse/room.js", import.meta.url), "utf8"), /coop: true/);
});
