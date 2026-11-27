// Phantasmagoria (activity/src/phantasmagoria): lantern sizes, Pepper's ghost angles, the timed show, show night,
// shop, scenes and hooks.
import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, LANTERN_ASKS, PEPPER_ASKS, SHOW, DIST, ANGLE, ghostHeight, ghostTilt, SLIDES, EFFECTS } from "../activity/src/phantasmagoria/data.js";
import * as P from "../activity/src/phantasmagoria/logic.js";
import { rng } from "../activity/src/casefiles/logic.js";
import { nightStart, nightMove, nightView, nightReward, NIGHT_ROUNDS } from "../activity/src/phantasmagoria/group.js";
import * as S from "../activity/src/phantasmagoria/shop.js";
import { sceneSvg } from "../activity/src/phantasmagoria/scene.js";
import { illusionsHtml, phantasmagoriaCodex, trickLine } from "../activity/src/phantasmagoria/room.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { DAILY_ROOMS } from "../activity/src/scene.js";
import { ROOM_BOOKS } from "../activity/src/library.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("optics: ghost height grows with distance, the reflection turns twice the glass angle; every ask is reachable", () => {
  assert.equal(ghostHeight(2), 1); assert.equal(ghostHeight(4), 2); assert.equal(ghostTilt(45), 90);
  for (const a of LANTERN_ASKS) { const d = a.h / 0.5; assert.ok(d >= DIST.min && d <= DIST.max, a.ask); }
  for (const a of PEPPER_ASKS) { const g = a.tilt / 2; assert.ok(g >= ANGLE.min && g <= ANGLE.max, a.ask); }
  assert.ok(["lantern", "pepper", "show"].every((k) => trickLine(k).length > 60));
});

test("lantern and Pepper rounds: in tolerance scores, outside burns oil, 3 burns is a flop", () => {
  const run = P.start(LEVELS[0], { seed: 9 }); const rd = P.roundNow(run);
  assert.equal(P.setTo(run, rd.answer * 1.5), "wrong"); assert.equal(run.oil, 2); assert.equal(run.last.big, true);
  assert.equal(P.setTo(run, rd.answer), "right"); assert.equal(run.pts, 1);
  while (!run.over) P.setTo(run, P.roundNow(run).answer);
  assert.equal(run.won, true); assert.equal(P.scoreOf(run), 1 + 2 * 4 + 2);
  const pep = P.start(LEVELS[1], { seed: 2 }), a = P.roundNow(pep).answer;
  assert.equal(P.setTo(pep, a + 2), "right", "within 3°"); let res; for (let k = 0; k < 3; k++) res = P.setTo(pep, ANGLE.min === P.roundNow(pep).answer ? ANGLE.max : ANGLE.min);
  assert.equal(res, "flop"); assert.equal(P.scoreOf(pep), 0);
  const p = { essence: 0 }, s = P.settle(p, run); assert.deepEqual(s.fresh, ["lantern"]); assert.deepEqual(P.settle(p, { ...run }).fresh, []);
});

test("the timed show: cues are spaced, taps on the beat score, early taps and missed cues burn oil", () => {
  for (let s = 1; s < 300; s++) { const c = P.cueSheet(rng(s)); assert.equal(c.length, SHOW.cues); for (let i = 1; i < c.length; i++) assert.ok(c[i].t - c[i - 1].t >= 700); assert.ok(c[0].t >= 800 && c[c.length - 1].t <= SHOW.len - 800); }
  const run = P.start(LEVELS[2], { seed: 5 }), rd = P.roundNow(run); P.beginAct(run);
  assert.equal(P.tapAt(run, rd.cues[0].t + 50), "perfect"); assert.equal(P.tapAt(run, rd.cues[1].t - 200), "good");
  assert.equal(P.tapAt(run, 100), "early"); assert.equal(run.oil, 2);
  for (let k = 2; k < 6; k++) P.tapAt(run, rd.cues[k].t);
  assert.deepEqual(P.missedBy(run, SHOW.len), []); assert.equal(P.endAct(run), "right"); assert.equal(run.i, 1);
  P.beginAct(run); assert.deepEqual(P.missedBy(run, SHOW.len).length, 6); assert.equal(run.over, true); assert.equal(run.won, false);
  const d = P.dailyOf("2026-11-27"); assert.deepEqual(P.dailyOf("2026-11-27"), d);
});

test("show night: stage hidden until all staged, no voting for yourself, 3 rounds, most votes wins", () => {
  const members = [{ id: "a", name: "Ada" }, { id: "b", name: "Bo" }, { id: "c", name: "Cy" }];
  const st = nightStart(members);
  assert.equal(nightMove(st, "a", { a: "stage", slide: "nun", fx: "grow" }, members), "stage");
  assert.equal(nightView(st, "b").staged.a, "?"); assert.equal(nightMove(st, "a", { a: "vote", for: "b" }, members), null, "no voting while staging");
  nightMove(st, "b", { a: "stage", slide: "owl", fx: "fade" }, members); assert.equal(nightMove(st, "c", { a: "stage", slide: "devil", fx: "pepper" }, members), "vote");
  assert.equal(nightMove(st, "a", { a: "vote", for: "a" }, members), null, "not your own");
  nightMove(st, "a", { a: "vote", for: "c" }, members); nightMove(st, "b", { a: "vote", for: "c" }, members); assert.equal(nightMove(st, "c", { a: "vote", for: "a" }, members), "round");
  assert.equal(st.total.c, 2); assert.equal(st.round, 2);
  while (!st.over) { for (const m of members) nightMove(st, m.id, { a: "stage", slide: SLIDES[0].id, fx: EFFECTS[0].id }, members); for (const m of members) nightMove(st, m.id, { a: "vote", for: m.id === "c" ? "a" : "c" }, members); }
  assert.equal(st.round, NIGHT_ROUNDS); assert.equal(nightReward(st, "c").won, true); assert.equal(nightReward(st, "b").won, false);
});

test("shop, scenes, book, codex and hooks", () => {
  assert.equal(S.SHOP.length, 9); assert.ok(S.SLOTS.every(([k]) => S.SHOP.filter((x) => x.slot === k).length === 3 && S.SHOP.some((x) => x.slot === k && !x.price)));
  assert.ok(S.SHOP.every((x) => x.id.startsWith("ph-") && x.note.length > 40));
  const p = { essence: 500 }; assert.equal(S.buyOrUse(p, "ph-nun"), "bought"); assert.equal(S.lookOf(p).slide, "ph-nun");
  for (const mode of ["lantern", "pepper", "show", "hall"]) for (const cue of [null, "appear", "grow", "thunder", "fade", "skull", "dissolve"]) for (const state of [null, "won", "flop"])
    assert.match(sceneSvg({ mode, look: S.lookOf(p), dist: 3.4, angle: 40, showGhost: true, cue, state }), /^<svg[\s\S]*<\/svg>$/);
  assert.match(illusionsHtml(p, esc), /0 \/ 3/); assert.match(phantasmagoriaCodex(p, esc), /Phantasmagoria/);
  assert.ok(TROPHIES.some((t) => t.id === "phantasmagoria")); assert.ok(BANTER.phantasmagoria); assert.ok(DAILY_ROOMS.includes("phantasmagoria")); assert.ok(ROOM_BOOKS.phantasmagoria);
});
