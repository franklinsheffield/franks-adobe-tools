import test from "node:test";
import assert from "node:assert";
import { LEVELS, TIERS, byId } from "../activity/src/geometry/levels.js";
import { makeBoard, place, undo, progress, nextStep, hasPoint, pointsOf, cross, circle, segment, dist, starsFor, quizStars, complete, geo, unlocked, levelsOf, titleOf, TITLES, par } from "../activity/src/geometry/engine.js";
import { SOLIDS, faceChoices } from "../activity/src/geometry/solids.js";
import { GUIDE } from "../activity/src/geometry/guide.js";
import { SETS, TALK, KIND } from "../activity/src/geometry/shop.js";
import { fresh, activity } from "../activity/src/game.js";

const PHI = (1 + Math.sqrt(5)) / 2;
const play = (l) => { const b = makeBoard(l); for (const s of l.steps) {
  const [p, q] = s.t === "c" ? [s.c, s.p] : [s.a, s.b];
  assert.ok(hasPoint(b, p) && hasPoint(b, q), `${l.id}: step needs a point that isn't on the board yet`);
  assert.ok(place(b, s.t === "c" ? "compass" : "ruler", p, q), `${l.id}: step can't be drawn`); } return b; };

test("every construction can be drawn with its own steps, using only points already on the board", () => {
  for (const l of LEVELS.filter((x) => !x.kind)) { const b = play(l); assert.ok(progress(l, b).complete, l.id); assert.equal(nextStep(l, b), null); }
});

test("levels: three tiers, complete content, questions with the right answer in range", () => {
  assert.deepEqual(TIERS.map((t) => t.n), [1, 2, 3]);
  for (const t of TIERS) assert.ok(levelsOf(t.n).length >= 3);
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
  for (const l of LEVELS) {
    for (const k of ["title", "emoji", "lesson", "fact", "codex", "src"]) assert.ok(l[k], `${l.id} ${k}`);
    assert.ok(l.how.length >= 1, l.id);
    assert.ok(l.q.choices.length >= 3 && l.q.choices[l.q.right] && l.q.why, l.id);
  }
});

test("the engine's crossings are right", () => {
  const A = circle([0, 0], [10, 0]), B = circle([10, 0], [0, 0]);
  const x = cross(A, B); assert.equal(x.length, 2); for (const p of x) { assert.ok(Math.abs(dist(p, [0, 0]) - 10) < 1e-9); assert.ok(Math.abs(p[0] - 5) < 1e-9); }
  assert.deepEqual(cross(segment([-5, 0], [5, 0]), segment([0, -5], [0, 5])), [[0, 0]]);
  assert.equal(cross(segment([-5, 0], [5, 0]), segment([6, -5], [6, 5])).length, 0); // segments stop at their ends
  assert.equal(cross(circle([0, 0], [10, 0]), segment([-20, 0], [20, 0])).length, 2);
  assert.equal(cross(circle([0, 0], [1, 0]), circle([10, 0], [11, 0])).length, 0);
});

test("the maths the room teaches is true on the board", () => {
  // vesica: height / width = √3 (centres 90 apart, radius 90, so the lens is 90 wide)
  const v = play(byId("g2")), tips = pointsOf(v).filter((p) => Math.abs(p[0]) < 1e-6);
  assert.ok(Math.abs(dist(tips[0], tips[1]) / 90 - Math.sqrt(3)) < 1e-9);
  // equilateral triangle sides equal
  const l3 = byId("g3"), [A, B, C] = [l3.given.pts[0], l3.given.pts[1], l3.names[0]];
  assert.ok(Math.abs(dist(A, C) - dist(A, B)) < 1e-9 && Math.abs(dist(B, C) - dist(A, B)) < 1e-9);
  // hexagon side = radius
  for (const s of byId("g4").steps.filter((s) => s.t === "s")) assert.ok(Math.abs(dist(s.a, s.b) - 90) < 1e-9);
  // golden section: AB / AS = AS / SB = φ
  const a3 = byId("a3"), [GA, GB] = a3.given.pts, S = a3.names[1];
  assert.ok(Math.abs(dist(GA, GB) / dist(GA, S) - PHI) < 1e-9); assert.ok(Math.abs(dist(GA, S) / dist(S, GB) - PHI) < 1e-9);
  const sb = play(a3); assert.ok(pointsOf(sb).some((p) => dist(p, S) < 1e-6), "S appears on the board");
  // Ptolemy's pentagon: five equal sides, diagonal / side = φ
  const m1 = byId("m1"), sides = m1.steps.filter((s) => s.t === "s").map((s) => dist(s.a, s.b));
  for (const x of sides) assert.ok(Math.abs(x - sides[0]) < 1e-9);
  const corners = m1.steps.filter((s) => s.t === "s").map((s) => s.a);
  assert.ok(Math.abs(dist(corners[0], corners[2]) / sides[0] - PHI) < 1e-9);
  // Flower: 19 circles; Metatron: 13 centres → 78 lines
  assert.equal(byId("m2").given.objs.length + byId("m2").steps.length, 19);
  assert.equal(byId("m3").given.pts.length, 13); assert.equal((13 * 12) / 2, Number(byId("m3").q.choices[byId("m3").q.right]));
});

test("Platonic solids: real counts, Euler's V − E + F = 2, Plato's elements", () => {
  const want = { tetra: [4, 6, 4], cube: [8, 12, 6], octa: [6, 12, 8], dodeca: [20, 30, 12], icosa: [12, 30, 20] };
  assert.equal(SOLIDS.length, 5);
  for (const s of SOLIDS) { assert.deepEqual([s.v.length, s.e.length, s.faces], want[s.id], s.id); assert.equal(s.v.length - s.e.length + s.faces, 2);
    const c = faceChoices(s); assert.equal(c.length, 4); assert.ok(c.includes(s.faces)); }
  assert.deepEqual(Object.fromEntries(SOLIDS.map((s) => [s.id, s.element])), { tetra: "fire", cube: "earth", octa: "air", dodeca: "the heavens", icosa: "water" });
});

test("board rules: no drawing from empty space, no duplicates, undo", () => {
  const l = byId("g1"), b = makeBoard(l);
  assert.equal(place(b, "compass", [0, 0], [50, 50]), null); // (50, 50) isn't a point
  assert.ok(place(b, "compass", [0, 0], [90, 0]));
  assert.equal(place(b, "compass", [0, 0], [90, 0]), null);
  assert.equal(b.drawn.length, 1); undo(b); assert.equal(b.drawn.length, 0);
});

test("stars, rewards, unlocks, Codex and plays (so merge() keeps room progress)", () => {
  assert.equal(starsFor({ hints: 0, moves: 4, par: 4 }), 3); assert.equal(starsFor({ hints: 0, moves: 6, par: 4 }), 3);
  assert.equal(starsFor({ hints: 0, moves: 7, par: 4 }), 2); assert.equal(starsFor({ hints: 2, moves: 4, par: 4 }), 2); assert.equal(starsFor({ hints: 3 }), 1);
  assert.equal(quizStars(0), 3); assert.equal(quizStars(2), 2); assert.equal(quizStars(5), 1);
  const p = fresh(); assert.ok(unlocked(p, "g1") && !unlocked(p, "g2") && unlocked(p, "a1") && unlocked(p, "m1"));
  const r = complete(p, "g1", 2); assert.deepEqual([r.xp, r.essence, r.newCodex], [15, 15, "Circle and radius"]);
  assert.ok(unlocked(p, "g2"));
  const r2 = complete(p, "g1", 3); assert.deepEqual([r2.xp, r2.newCodex], [5, null]);
  const r3 = complete(p, "g1", 1); assert.deepEqual([r3.xp, r3.best], [0, 3]);
  assert.equal(geo(p).plays, 3); assert.ok(activity(p) >= 3);
  assert.equal(titleOf(p).name, TITLES[0].name);
  for (const l of LEVELS) complete(p, l.id, 3); assert.equal(titleOf(p).name, TITLES.at(-1).name);
});

test("study guide covers what the questions ask; shop shelf is well formed", () => {
  const text = GUIDE.sections.flatMap((s) => s.p).join(" ");
  for (const k of ["√3", "φ", "Euler", "Timaeus", "Ptolemy", "Leonardo", "Metatron", "78", "diameter", "Wantzel", "Lindemann", "137.5"]) assert.ok(text.includes(k), k);
  assert.equal(new Set(SETS.map((s) => s.id)).size, SETS.length);
  for (const s of SETS) { assert.ok(s.id.startsWith("geo-") && s.kind === KIND && s.name && s.bg && s.ink, s.id); assert.ok(s.price >= 0); }
  assert.equal(SETS.filter((s) => s.price === 0).length, 1);
  for (const k of ["open", "tryon", "buy"]) assert.ok(TALK[k].length >= 3);
});
