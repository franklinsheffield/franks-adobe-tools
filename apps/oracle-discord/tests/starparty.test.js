// Star Party (activity/src/starparty/): weekly target, real meteor showers, the meteor watch and the shared counts.
import test from "node:test";
import assert from "node:assert/strict";
import { weekKey, weeklyTarget, activeShower, nextShower, SHOWERS, makeWatch, tracesBack, scoreWatch, observeTarget, partyPayDue, PARTY_GOAL, isOpen, settleWatch, room, LEVELS } from "../activity/src/starparty/engine.js";
import { partyKey, addToParty, partyView, PER_MEMBER } from "../activity/src/starparty/shared.js";
import { sunRaDec } from "../activity/src/stars/tonight.js";

test("starparty: ISO weeks", () => {
  assert.equal(weekKey(Date.UTC(2026, 0, 1)), "2026-W01");
  assert.equal(weekKey(Date.UTC(2027, 0, 1)), "2026-W53");
  assert.equal(weekKey(Date.UTC(2026, 10, 27)), "2026-W48");
  assert.equal(weekKey(Date.UTC(2026, 10, 23)), weekKey(Date.UTC(2026, 10, 29, 23)));
});

test("starparty: the weekly target is near opposition and the same all week", () => {
  for (let m = 0; m < 12; m++) {
    const ms = Date.UTC(2026, m, 15), t = weeklyTarget(ms), anti = (sunRaDec(ms)[0] + 180) % 360, gap = Math.abs(((t.ra - anti + 540) % 360) - 180);
    assert.ok(gap <= 60, `${m}: ${t.label} ${gap}`);
  }
  assert.equal(weeklyTarget(Date.UTC(2026, 10, 23, 1)).m, weeklyTarget(Date.UTC(2026, 10, 29, 22)).m);
});

test("starparty: real shower dates, active window and next shower", () => {
  assert.equal(SHOWERS.length, 8);
  assert.equal(activeShower(Date.UTC(2026, 7, 12)).id, "per");
  assert.equal(activeShower(Date.UTC(2026, 11, 13)).id, "gem");
  assert.equal(activeShower(Date.UTC(2027, 0, 2)).key, "qua-2027");
  assert.equal(activeShower(Date.UTC(2026, 10, 27)), null);
  assert.equal(nextShower(Date.UTC(2026, 10, 27)).id, "gem");
  assert.equal(nextShower(Date.UTC(2026, 11, 30)).id, "qua");
});

test("starparty: shower meteors trace back to the radiant, sporadics don't; scoring", () => {
  for (const L of [1, 2, 3]) for (let s = 1; s < 40; s++) {
    const w = makeWatch(L, s); assert.equal(w.meteors.length, LEVELS[L].n);
    for (const m of w.meteors) assert.equal(tracesBack(m, w.rx, w.ry), m.shower, `L${L} s${s}`);
    for (const m of w.meteors) assert.ok(m.t >= 0 && m.t < w.secs * 1000);
  }
  const w = makeWatch(1, 9), all = w.meteors.map((m, i) => (m.shower ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(scoreWatch(w, all).perfect, true);
  const strays = w.meteors.map((m, i) => (!m.shower ? i : -1)).filter((i) => i >= 0);
  assert.equal(scoreWatch(w, [...all, ...strays]).score, Math.max(0, all.length - strays.length));
  const p = {}; assert.equal(isOpen(p, 2), false); settleWatch(p, 1, scoreWatch(w, all)); assert.equal(isOpen(p, 2), true); assert.ok(room(p).meteors > 0);
});

test("starparty: one observation a day, the week's reward once", () => {
  const p = {}, t = Date.UTC(2026, 10, 24, 22);
  assert.equal(partyPayDue(p, PARTY_GOAL, t), false, "must help first");
  assert.equal(observeTarget(p, t), true); assert.equal(observeTarget(p, t + 3600e3), false); assert.equal(observeTarget(p, t + 864e5), true);
  assert.equal(partyPayDue(p, PARTY_GOAL - 1, t), false); assert.equal(partyPayDue(p, PARTY_GOAL, t), true); assert.equal(partyPayDue(p, PARTY_GOAL + 5, t), false);
});

test("starparty: shared counts cap per post, per day and per member", () => {
  const t = Date.UTC(2026, 7, 12, 3), me = { id: "1", name: "Ada" };
  assert.match(partyKey("star", t), /^party:star:2026-W33$/); assert.equal(partyKey("meteor", t), "party:meteor:per-2026"); assert.equal(partyKey("meteor", Date.UTC(2026, 10, 27)), null); assert.equal(partyKey("x", t), null);
  let d = addToParty(null, "star", me, 5, t); assert.equal(d.total, 1);
  d = addToParty(d, "star", me, 1, t + 3600e3); assert.equal(d.total, 1, "once a day");
  d = addToParty(d, "star", me, 1, t + 864e5); assert.equal(d.total, 2);
  let m = null; for (let i = 0; i < 20; i++) m = addToParty(m, "meteor", me, 999, t); assert.equal(m.total, PER_MEMBER.meteor);
  m = addToParty(m, "meteor", { id: "2", name: "Bo" }, -5, t); assert.equal(m.total, PER_MEMBER.meteor);
  const v = partyView(m, "1", "k"); assert.equal(v.you, PER_MEMBER.meteor); assert.equal(v.top[0].me, true);
});

test("starparty: room wired with trophy, banter, daily", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../activity/src/starparty/room.js", import.meta.url), "utf8");
  assert.match(src, /trophy\?\.\("starparty"/); assert.match(src, /finishDaily\(P\(\), "starparty"/); assert.match(src, /banter\("starparty"/);
  assert.match(readFileSync(new URL("../activity/worker.mjs", import.meta.url), "utf8"), /\/api\/party\//);
});
