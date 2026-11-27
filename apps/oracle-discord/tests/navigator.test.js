// Celestial Navigator (activity/src/navigator/): real voyages, real sky.
import test from "node:test";
import assert from "node:assert/strict";
import { VOYAGES, shipOn, polarisSight, noonSight, longitudeSight, voyagesFor, goodSight, sightAngle, settleRun, isOpen, room, ROUNDS } from "../activity/src/navigator/engine.js";
import { SAILS, INSTRUMENTS, chartSvg, sightSvg, chronoSvg } from "../activity/src/navigator/room.js";

const lat = (t) => (t.endsWith("S") ? -1 : 1) * parseInt(t, 10), lon = (t) => (t.endsWith("W") ? -1 : 1) * parseInt(t, 10);

test("Polaris: its altitude is the latitude (within a degree), so the answer is always right", () => {
  for (const v of voyagesFor(1)) for (let i = 0; i < ROUNDS; i++) {
    const s = polarisSight(v, i, i * 13 + 5); assert.ok(Math.abs(s.alt - s.ship.lat) < 1, `${v.id} ${i}: ${s.alt} vs ${s.ship.lat}`);
    assert.ok(s.choices.includes(s.a)); assert.equal(new Set(s.choices).size, 4); assert.ok(goodSight(s, s.alt + 0.8) && !goodSight(s, s.alt + 2));
  }
  assert.ok(!voyagesFor(1).some((v) => v.id === "hokulea"), "Polaris can't be used across the equator");
});

test("noon Sun and chronometer: the sums give back the ship's real position", () => {
  for (const v of VOYAGES) for (let i = 0; i < ROUNDS; i++) {
    const n = noonSight(v, i, i + 1), worked = n.dec + (n.south ? 1 : -1) * (90 - n.alt); assert.ok(Math.abs(worked - n.ship.lat) < 0.1, v.id);
    assert.ok(n.choices.includes(n.a)); assert.equal(lat(n.a), Math.round(n.ship.lat) + 0);
    const c = longitudeSight(v, i, i + 1), [h, m] = c.gmt.split(":").map(Number), L = (12 - (h + m / 60)) * 15; assert.ok(Math.abs(L - c.ship.lon) < 0.3, `${v.id}: ${L} vs ${c.ship.lon}`);
    assert.equal(lon(c.a), Math.round(c.ship.lon) + 0); assert.ok(c.choices.includes(c.a)); assert.equal(sightAngle(c), null);
  }
});

test("voyages, runs and drawings", () => {
  for (const v of VOYAGES) { assert.ok(v.note.length > 60); const end = shipOn(v, ROUNDS - 1); assert.ok(Math.abs(end.lat - v.to.lat) < Math.abs(v.from.lat - v.to.lat) / 4 + 0.01, v.id + " ends near home"); assert.ok(chartSvg(v, 3, SAILS[0]).includes("nv-svg")); }
  assert.ok(sightSvg(polarisSight(VOYAGES[0], 0, 1), 30, INSTRUMENTS[0]).includes("Arm: 30.0°")); assert.ok(chronoSvg(longitudeSight(VOYAGES[0], 0, 1), INSTRUMENTS[0]).includes("GREENWICH"));
  const p = {}; assert.ok(!isOpen(p, 2)); const r = settleRun(p, 1, "mayflower", [3, 3, 3, 3, 3]); assert.ok(r.won && r.perfect && r.newVoyage && isOpen(p, 2)); assert.deepEqual(room(p).voyages, ["mayflower"]);
  assert.equal(settleRun(p, 1, "mayflower", [3, 3, 3, 0, 0]).newVoyage, false);
  assert.ok(SAILS[0].price === 0 && INSTRUMENTS[0].price === 0);
});
