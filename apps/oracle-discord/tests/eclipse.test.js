// Eclipse Chaser (activity/src/eclipse/): real eclipses from Astronomy Engine.
import test from "node:test";
import assert from "node:assert/strict";
import { outcome, lineUp, nodeRound, sarosRound, solarEclipses, lunarEclipses, SAROS_DAYS, LUXOR, settleRun, isOpen, room } from "../activity/src/eclipse/engine.js";
import { CORONAE, GLASSES, totalitySvg, lineUpSvg, nodesSvg } from "../activity/src/eclipse/room.js";

test("Level 1: eclipses need the right phase AND the plane", () => {
  assert.equal(outcome({ ph: 0, lat: 0.2, near: true }), "Total solar eclipse"); assert.equal(outcome({ ph: 0, lat: 0.2, near: false }), "Annular solar eclipse");
  assert.equal(outcome({ ph: 180, lat: -0.1, near: false }), "Total lunar eclipse"); assert.equal(outcome({ ph: 0, lat: 3.4, near: true }), "No eclipse"); assert.equal(outcome({ ph: 90, lat: 0, near: true }), "No eclipse");
  const seen = new Set(); for (let s = 1; s < 300; s++) { const r = lineUp(s); assert.ok(r.choices.includes(r.a) && r.why.length > 30); seen.add(r.a); assert.ok(lineUpSvg(r.cfg).includes("ec-svg")); }
  assert.equal(seen.size, 4, "every outcome comes up");
});

test("real eclipses: 2026-2027 match the published list, saros returns land on real eclipses", () => {
  const s = solarEclipses(2026, 2027).map((e) => [new Date(e.ms).toISOString().slice(0, 10), e.kind]);
  assert.deepEqual(s, [["2026-02-17", "annular"], ["2026-08-12", "total"], ["2027-02-06", "annular"], ["2027-08-02", "total"]]);
  const lux = solarEclipses(2027, 2027)[1]; assert.ok(Math.abs(lux.lat - 25.7) < 1.5 && Math.abs(lux.lon - 32.6) < 2, "greatest eclipse near Luxor");
  assert.equal(new Date(lunarEclipses(2026, 2026)[0].ms).toISOString().slice(0, 10), "2026-03-03");
  const later = solarEclipses(2044, 2064);
  for (const e of solarEclipses(2026, 2045)) assert.ok(later.some((x) => Math.abs(x.ms - (e.ms + SAROS_DAYS * 864e5)) < 864e5), "saros return of " + new Date(e.ms).toISOString());
  assert.ok(LUXOR.choices.includes(LUXOR.a));
});

test("Level 2 and 3: one real eclipse among four Moons; every answer is a choice", () => {
  for (let s = 1; s < 40; s++) {
    const r = nodeRound(s); assert.equal(r.opts.length, 4); assert.equal(r.opts.filter((o) => o.date === r.a).length, 1);
    const hit = r.opts.find((o) => o.date === r.a); assert.ok(r.opts.every((o) => Math.abs(o.lat) >= Math.abs(hit.lat)), "the eclipse is the Moon nearest the node");
    assert.ok(nodesSvg(r, true).includes('class="hl"'));
    const q = sarosRound(s); assert.ok(q.choices.includes(q.a), q.q); assert.equal(new Set(q.choices).size, q.choices.length);
  }
  const p = {}; assert.ok(!isOpen(p, 2)); assert.ok(settleRun(p, 1, [3, 2, 1, 0, 0]).won); assert.ok(isOpen(p, 2)); assert.equal(room(p).best[1], 6);
  for (const c of CORONAE) assert.ok(totalitySvg(c, GLASSES[0]).includes("corona") && c.note.length > 40);
  assert.ok(GLASSES[0].price === 0 && GLASSES[0].note.includes("ISO 12312-2"));
});
