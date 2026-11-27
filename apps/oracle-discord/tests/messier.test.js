// Messier's Catalogue (activity/src/messier/) and Observatory progression (activity/src/obsprog.js).
import test from "node:test";
import assert from "node:assert/strict";
import * as A from "astronomy-engine";
import { MESSIER, byM, KINDS, KIND_CHOICES, kindRound, conRound, tonightRound, logObject, loggedCount, loggedSet, settleRun, isOpen, kindCounts, TEN_PAY } from "../activity/src/messier/engine.js";
import { houseRank, houseXp, harmony, claimHarmony, harmonyDone, grandOrrery, OBS_GAMES, RANKS } from "../activity/src/obsprog.js";
import { altAz, lst } from "../activity/src/stars/tonight.js";

test("messier: all 110, numbered in order, real kinds and known landmarks", () => {
  assert.equal(MESSIER.length, 110);
  MESSIER.forEach((o, i) => { assert.equal(o.m, i + 1); assert.ok(KINDS[o.kind], o.m); assert.ok(KIND_CHOICES.includes(o.kindName), o.m); assert.ok(o.ra >= 0 && o.ra < 360 && Math.abs(o.dec) <= 90); });
  assert.equal(byM(1).kind, "snr"); assert.equal(byM(1).con, "Taurus");
  assert.equal(byM(13).kind, "gc"); assert.equal(byM(13).con, "Hercules");
  assert.equal(byM(31).kindName, "Galaxy"); assert.equal(byM(31).con, "Andromeda");
  assert.equal(byM(42).con, "Orion"); assert.equal(byM(45).kind, "oc"); assert.equal(byM(57).kind, "pn"); assert.equal(byM(57).con, "Lyra");
  assert.equal(byM(104).con, "Virgo"); assert.equal(byM(40).kind, "grp");
  const c = kindCounts({}); assert.equal(c["Globular cluster"].all, 29); assert.equal(c["Galaxy"].all, 40); assert.equal(c["Planetary nebula"].all, 4);
  for (const o of MESSIER) assert.equal(A.Constellation(o.ra / 15, o.dec).name, o.con);
});

test("messier: rounds have exactly one right answer among 4 choices", () => {
  for (let s = 1; s < 60; s++) {
    for (const rd of [kindRound(s, {}), conRound(s, {})]) { assert.equal(rd.choices.length, 4); assert.equal(rd.choices.filter((c) => c === rd.a).length, 1); assert.equal(new Set(rd.choices).size, 4); }
    const k = kindRound(s, {}); assert.ok(!k.q.includes(k.o.name) || !k.o.name, "level 1 doesn't give the name away");
  }
});

test("messier: Tonight's answer really is the highest of the four", () => {
  const place = { name: "Phoenix", tz: "America/Phoenix", lat: 33.45, lon: -112.07 }, at = Date.UTC(2026, 2, 20, 5, 0);
  for (let s = 1; s < 30; s++) {
    const rd = tonightRound(s, place, at), L = lst(at, place.lon);
    assert.equal(rd.choices.length, 4);
    const alts = rd.opts.map((o) => altAz(byM(o.m).ra, byM(o.m).dec, place.lat, L)[1]);
    const top = rd.opts[alts.indexOf(Math.max(...alts))];
    assert.equal(rd.a, top.label); assert.ok(Math.max(...alts) >= 15);
  }
});

test("messier: logging pays every 10 once, Night Watch logs count, levels open in order", () => {
  const p = {};
  let paid = 0; for (let m = 1; m <= 25; m++) paid += logObject(p, m).tens;
  assert.equal(paid, 2); assert.equal(loggedCount(p), 25);
  assert.equal(logObject(p, 3).first, false);
  p.rooms.watch = { log: { m31: { at: 0 } }, plates: {}, jobsDone: 0 };
  assert.ok(loggedSet(p).includes(31));
  assert.equal(isOpen(p, 2), false); settleRun(p, 1, [3, 3, 0, 2, 0]); assert.equal(isOpen(p, 2), true);
  assert.equal(TEN_PAY, 50);
});

test("obsprog: ranks climb with House XP; Harmony stages pay once; Grand Orrery needs gold on all six", () => {
  const p = {}; assert.equal(houseRank(p).name, "Stargazer"); assert.equal(houseXp(p), 0);
  p.trophies = Object.fromEntries(OBS_GAMES.map((id) => [id, { tier: 3, wins: { 1: 5, 2: 5, 3: 5 } }]));
  assert.ok(houseXp(p) >= RANKS[3].at); assert.equal(houseRank(p).name, "Astronomer Royal");
  assert.equal(grandOrrery(p), true);
  const h = harmony(p); assert.deepEqual(h.map((s) => s.done), [false, true, false, true]);
  const host = { id: "observatory", token: { id: "shard" } };
  assert.equal(claimHarmony(p, host).length, 2); assert.equal(claimHarmony(p, host).length, 0);
  assert.equal(harmonyDone(p), false);
});

test("messier: room wired with trophy, banter, daily", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../activity/src/messier/room.js", import.meta.url), "utf8");
  assert.match(src, /trophy\?\.\("messier"/); assert.match(src, /finishDaily\(P\(\), "messier"/); assert.match(src, /banter\("messier"/);
});

test("messier: star-hops past the Pleiades and Andromeda log M45 and M31", async () => {
  const { HOP_MESSIER, hopById } = await import("../activity/src/stars/hops.js");
  for (const [id, ms] of Object.entries(HOP_MESSIER)) { assert.ok(hopById(id), id); for (const m of ms) assert.ok(byM(m)); }
  assert.match(hopById("belt").steps.map((s) => s.say).join(" "), /Pleiades/); assert.match(hopById("andromeda").fact, /Andromeda Galaxy/);
  const { readFileSync } = await import("node:fs");
  assert.match(readFileSync(new URL("../activity/src/stars/room.js", import.meta.url), "utf8"), /HOP_MESSIER\[route\.id\]/);
});
