// The Dark Séance (activity/src/darkseance): real methods vs real controls, suspicion, the flashlight, committee night.
import test from "node:test";
import assert from "node:assert/strict";
import { EFFECTS, CONTROLS, METHODS, LEVELS, works, makes, methodOf } from "../activity/src/darkseance/data.js";
import * as D from "../activity/src/darkseance/logic.js";
import { groupStart, groupAct, publicView, groupReward, methodsFor, GROUP_ROUNDS } from "../activity/src/darkseance/group.js";
import * as S from "../activity/src/darkseance/shop.js";
import { roomSvg } from "../activity/src/darkseance/scene.js";
import { methodsHtml, darkseanceCodex } from "../activity/src/darkseance/room.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { DAILY_ROOMS } from "../activity/src/scene.js";
import { ROOM_BOOKS } from "../activity/src/library.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("13 documented methods, each with the control that beat it; every effect and level is playable", () => {
  assert.equal(METHODS.length, 13); assert.equal(new Set(METHODS.map((m) => m.id)).size, 13);
  for (const m of METHODS) {
    assert.ok(m.makes.length && m.makes.every((e) => EFFECTS[e]), m.id); assert.ok(m.beaten.length && m.beaten.every((c) => CONTROLS[c]), m.id);
    assert.ok(m.caught.length > 40 && /\d{4}/.test(m.caught) || m.id === "whisper", m.id + " has a dated fact");
  }
  for (const e of Object.keys(EFFECTS)) assert.ok(METHODS.some((m) => m.makes.includes(e)), "a method makes " + e);
  assert.ok(works("toes", "rap", [])); assert.ok(!works("toes", "rap", ["feet"])); assert.ok(!works("toes", "tilt", []));
  assert.ok(works("handsub", "bell", ["hands"]), "hand substitution beats held hands"); assert.ok(!works("handsub", "bell", ["bands"]));
  for (const L of LEVELS) for (let i = 0; i < 300; i++) {
    const rd = D.roundOf(L); assert.ok(L.effects.includes(rd.effect)); L.fixed.forEach((c) => assert.ok(rd.controls.includes(c)));
    assert.ok(rd.options.some((m) => works(m, rd.effect, rd.controls)), "a way through"); assert.ok(rd.options.length >= D.OPTIONS);
  }
});

test("a séance: right method scores, a beaten one gets you caught, a useless one makes the sitters doubt, 3 eyes exposes you", () => {
  const L = LEVELS[0], run = D.start(L, { seed: 11 });
  assert.equal(run.rounds.length, 4);
  for (let i = 1; i < run.rounds.length; i++) assert.notEqual(run.rounds[i].effect, run.rounds[i - 1].effect);
  const way = (r) => r.options.find((m) => works(m, r.effect, r.controls)), bad = (r) => METHODS.find((m) => !makes(m.id, r.effect)).id;
  assert.equal(D.choose(run, bad(D.roundNow(run))), "nothing"); assert.equal(run.eyes, 2);
  const first = D.roundNow(run); assert.equal(D.choose(run, way(first)), "done"); assert.equal(run.pts, 1, "1 point after a slip");
  while (!run.over) D.choose(run, way(D.roundNow(run)));
  assert.equal(run.won, true); assert.equal(D.scoreOf(run), 1 + 2 * 3 + 2); assert.equal(D.perfect(run), false);
  const p = { essence: 0 }, s = D.settle(p, run); assert.ok(s.fresh.length >= 1); assert.equal(D.room(p).wins[1], 1);
  const lose = D.start(L, { seed: 4 }); let res; for (let k = 0; k < 3; k++) res = D.choose(lose, bad(D.roundNow(lose)));
  assert.equal(res, "exposed"); assert.equal(D.scoreOf(lose), 0);
  const caught = D.start(LEVELS[1], { seed: 9 }), rd = D.roundNow(caught), beaten = METHODS.find((m) => makes(m.id, rd.effect) && !works(m.id, rd.effect, rd.controls));
  if (beaten) { assert.equal(D.choose(caught, beaten.id), "caught"); D.settle(p, { ...caught, over: true }); assert.ok(D.room(p).caught.includes(beaten.id)); }
});

test("the flashlight: act while the beam is away, or you're caught", () => {
  const L = { ...LEVELS[1], torch: 1 }, run = D.start(L, { seed: 3 }), rd = D.roundNow(run);
  assert.ok(rd.controls.includes("torch")); const m = rd.options.find((x) => works(x, rd.effect, rd.controls));
  assert.equal(D.choose(run, m), "timing"); assert.equal(D.choose(run, m), null, "one thing at a time");
  assert.equal(D.act(run, true), "lit"); assert.equal(run.eyes, 2);
  assert.equal(D.choose(run, m), "timing"); assert.equal(D.act(run, false), "done");
  assert.equal(D.onSeat(90), true); assert.equal(D.onSeat(270), false); assert.ok(D.beamAt(1200, LEVELS[1]) >= 0 && D.beamAt(1e7, LEVELS[2]) < 360);
});

test("committee night: secret pick, controls, the medium's pick hidden from the committee", () => {
  const members = [{ id: "a", name: "Ada" }, { id: "b", name: "Bo" }, { id: "c", name: "Cy" }];
  const st = groupStart(members, 1, () => 0.2); assert.equal(st.medium, "a"); assert.equal(st.effects.length, GROUP_ROUNDS);
  assert.equal(groupStart(members, 2).medium, "b", "the medium rotates");
  const e = st.effects[0], ms = methodsFor(e), m = ms[0], beat = methodOf(m).beaten[0];
  assert.equal(groupAct(st, "b", { a: "pick", m }, members, "a"), null, "only the medium picks");
  assert.equal(groupAct(st, "a", { a: "pick", m }, members, "a"), "pick");
  assert.equal(publicView(st, "b").pick, "?"); assert.equal(publicView(st, "a").pick, m);
  assert.equal(groupAct(st, "b", { a: "ctl", c: beat }, members, "a"), "ctl");
  assert.equal(groupAct(st, "c", { a: "ctl", c: beat }, members, "a"), "round");
  assert.equal(st.score.table, 1); assert.deepEqual(st.log[0].by, ["Bo", "Cy"]);
  while (!st.over) { const ef = st.effects[st.i], mm = methodsFor(ef)[0], free = Object.keys(CONTROLS).find((c) => !methodOf(mm).beaten.includes(c));
    groupAct(st, "a", { a: "pick", m: mm }, members, "a"); groupAct(st, "b", { a: "ctl", c: free }, members, "a"); groupAct(st, "c", { a: "ctl", c: free }, members, "a"); }
  assert.equal(st.score.medium, GROUP_ROUNDS - 1); assert.equal(groupReward(st, "a").won, true); assert.equal(groupReward(st, "b").won, false);
});

test("shop, art, book, codex and hooks", () => {
  assert.equal(S.SHOP.length, 9); assert.ok(S.SLOTS.every(([k]) => S.SHOP.filter((x) => x.slot === k).length === 3 && S.SHOP.some((x) => x.slot === k && !x.price)));
  assert.ok(S.SHOP.every((x) => x.id.startsWith("ds-") && x.note.length > 40));
  const p = { essence: 500 }; assert.equal(S.buyOrUse(p, "ds-margery"), "bought"); assert.equal(S.lookOf(p).cabinet, "ds-margery");
  for (const effect of [null, ...Object.keys(EFFECTS)]) assert.match(roomSvg({ look: S.lookOf(p), controls: ["bands", "light", "torch"], effect, eyes: 1, caught: true, exposed: true }), /^<svg[\s\S]*id="ds-beam"[\s\S]*<\/svg>$/);
  assert.match(methodsHtml(p, esc), /0 \/ 13/); assert.match(darkseanceCodex(p, esc), /Dark Séance/);
  assert.ok(TROPHIES.some((t) => t.id === "darkseance")); assert.ok(BANTER.darkseance); assert.ok(DAILY_ROOMS.includes("darkseance")); assert.ok(ROOM_BOOKS.darkseance);
  const d = D.dailyOf("2026-11-27"); assert.deepEqual(D.dailyOf("2026-11-27"), d); assert.ok(LEVELS.includes(d.L));
});
