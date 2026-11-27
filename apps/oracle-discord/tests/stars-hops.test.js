// Star-hops: every route uses real bright stars, the hops are sensible distances, and the rules score fairly.
import test from "node:test";
import assert from "node:assert/strict";
import { HOPS, hopById, startHop, hop, hopStars, hopTime, settleHop, hopsDone, hopBest } from "../activity/src/stars/hops.js";
import { starByHip, sep, nameOf } from "../activity/src/stars/engine.js";

test("every route is made of real stars, a sensible hop apart", () => {
  assert.ok(HOPS.length >= 8); assert.equal(new Set(HOPS.map((h) => h.id)).size, HOPS.length);
  for (const r of HOPS) {
    assert.ok(r.name && r.emoji && r.fact && r.steps.length >= 3, r.id);
    for (const h of r.start) assert.ok(starByHip(h), `${r.id} start ${h}`);
    let prev = null;
    for (const st of r.steps) {
      assert.ok(st.say.length > 20 && st.to.length, r.id);
      for (const h of st.to) { const s = starByHip(h); assert.ok(s, `${r.id}: HIP ${h}`); assert.ok(s[2] < 3.5, `${r.id}: ${nameOf(s)} bright enough`); }
      const s = starByHip(st.to[0]);
      if (prev) { const d = sep(prev[0], prev[1], s[0], s[1]); assert.ok(d > 1 && d < 75, `${r.id}: hop to ${nameOf(s)} is ${d.toFixed(1)}°`); }
      prev = s;
    }
  }
  // the classic hops really line up: Merak → Dubhe extended points at Polaris
  const merak = starByHip(53910), dubhe = starByHip(54061), pol = starByHip(11767);
  assert.ok(sep(merak[0], merak[1], pol[0], pol[1]) > sep(dubhe[0], dubhe[1], pol[0], pol[1]), "Polaris lies beyond Dubhe");
});

test("hop rules and scoring", () => {
  const r = hopById("polaris"), run = startHop(r);
  assert.equal(hop(run, r, 54061), "miss"); assert.equal(run.mistakes, 1);
  assert.equal(hop(run, r, 53910), "ok"); assert.equal(hop(run, r, 53910), null, "same star again is ignored");
  assert.equal(hop(run, r, 54061), "ok"); assert.deepEqual(run.drawn, ["53910-54061"]);
  assert.equal(hop(run, r, 11767), "done"); assert.equal(hop(run, r, 11767), null);
  assert.equal(hopStars(1), 3); assert.equal(hopStars(3), 2); assert.equal(hopStars(4), 1); assert.equal(hopTime(r), 100);
  const p = {}; assert.deepEqual(settleHop(p, run), { xp: 30, essence: 30, stars: 3, first: true });
  assert.equal(settleHop(p, run).essence, 0, "replays pay only improvements"); assert.equal(hopsDone(p), 1); assert.equal(hopBest(p, "polaris"), 3);
  const s = startHop(hopById("south")); assert.equal(hop(s, hopById("south"), 71681), "ok", "either star of Alpha Centauri counts");
});
