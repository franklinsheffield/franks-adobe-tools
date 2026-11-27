// Comet Hunter (activity/src/comet/): blink plates, comet or Messier object, predict a return.
import test from "node:test";
import assert from "node:assert/strict";
import { platePair, hitMover, hitFlaw, pickAt, hopOf, MOVERS, PLUTO_ROUND, fuzzyRound, returnRound, RETURNS, COMETS, MESSIERS, settleRun, isOpen, catchComet, room, ROUNDS } from "../activity/src/comet/engine.js";
import { TAILS, blinkSvg, fuzzySvg, orbitSvg } from "../activity/src/comet/room.js";

test("Level 1: the mover is on both plates, flaws on one only, and plates get harder", () => {
  for (let s = 1; s < 60; s++) for (let i = 0; i < ROUNDS; i++) {
    const p = platePair(s * 101, i), d = Math.hypot(p.mover.a.x - p.mover.b.x, p.mover.a.y - p.mover.b.y);
    assert.ok(d >= 5, "it visibly moved"); assert.ok(hitMover(p, p.mover.b.x, p.mover.b.y));
    if (i >= 2) { assert.ok(p.flaw && ["a", "b"].includes(p.flaw.on)); assert.ok(hitFlaw(p, p.flaw.x, p.flaw.y)); } else assert.equal(p.flaw, null);
    assert.equal(p.stars.length, 34 + i * 12);
  }
  assert.deepEqual(platePair(42, 1), platePair(42, 1), "seeded: the daily is the same for everyone");
  const svg = blinkSvg(platePair(7, 3)); assert.equal((svg.match(/data-k="mover"/g) || []).length, 2); assert.equal((svg.match(/data-k="flaw"/g) || []).length, 1);
  assert.equal((svg.match(/data-k="trail"/g) || []).length, 1); assert.equal((svg.match(/data-k="variable"/g) || []).length, 2); assert.ok(svg.includes('id="ch-loupe"'));
  assert.ok(blinkSvg(platePair(7, PLUTO_ROUND), { pluto: true, neg: true }).includes("23 Jan 1930") && blinkSvg(platePair(7, 0), { neg: true }).includes(" neg"));
});

test("Level 1: taps anywhere pick the nearest thing, decoys teach, and the hop says what it is", () => {
  for (let s = 1; s < 80; s++) for (let i = 0; i < ROUNDS; i++) {
    const p = platePair(s * 37, i), m = p.mover;
    assert.equal(pickAt(p, m.a.x, m.a.y), "mover"); assert.equal(pickAt(p, m.b.x + 3, m.b.y - 2), "mover", "a near miss still counts");
    if (p.variable) { assert.equal(pickAt(p, p.variable.x, p.variable.y), "variable"); assert.ok(p.variable.sa > p.variable.sb); }
    if (p.flaw) assert.equal(pickAt(p, p.flaw.x, p.flaw.y), "flaw");
    if (p.trail) { assert.ok(["a", "b"].includes(p.trail.on)); for (const q of [m.a, m.b]) assert.notEqual(pickAt(p, q.x, q.y), "trail"); }
    assert.equal(!!p.variable, i >= 1); assert.equal(!!p.trail, i >= 3);
    const h = hopOf(p), [lo, hi] = MOVERS[m.kind].hop; assert.ok(h.d >= lo - 15 && h.d <= hi + 1, `${m.kind} hop ${h.d}`); assert.ok(h.note.length > 40);
    if (i === PLUTO_ROUND) assert.equal(m.kind, "pluto");
  }
  assert.equal(pickAt({ stars: [], mover: { a: { x: 10, y: 10 }, b: { x: 20, y: 10 } } }, 300, 200), null, "empty sky is no guess");
  assert.match(MOVERS.pluto.note, /23 and 29 January 1930/); assert.match(MOVERS.pluto.note, /18 February 1930/);
});

test("Level 2 and 3: answers are among the choices and the return years are the real ones", () => {
  let comets = 0;
  for (let s = 1; s < 300; s++) { const r = fuzzyRound(s); if (r.comet) { comets++; assert.ok(r.moved); } else { assert.ok(!r.moved && r.choices.includes(r.name)); assert.equal(new Set(r.choices).size, 4); } assert.ok(fuzzySvg(r, s).includes("ch-plate")); }
  assert.ok(comets > 90 && comets < 210, "about half are comets");
  assert.equal(MESSIERS.length, 11); assert.ok(COMETS.every((c) => c.note.length > 40));
  const want = { halley1682: 1758, halley: 2061, tempeltuttle: 2031, swifttuttle: 2126, encke: 2027, "67p": 2028, ponsbrooks: 2095 };
  for (const c of RETURNS) { assert.equal(c.next, want[c.id], c.id); assert.ok(Math.abs(c.seen + c.period - c.next) <= 1.5, c.id + " period adds up"); }
  for (let s = 1; s < 200; s++) { const q = returnRound(s); assert.ok(q.choices.includes(q.a)); assert.equal(new Set(q.choices).size, q.choices.length); assert.ok(q.choices.length >= 3); }
  assert.ok(orbitSvg(TAILS[0]).includes("Earth's orbit"));
});

test("runs: 3 of 5 clears a level and opens the next; comets pay once", () => {
  const p = {}; assert.ok(isOpen(p, 1) && !isOpen(p, 2));
  assert.equal(settleRun(p, 1, [3, 0, 0, 2, 0]).won, false); assert.ok(!isOpen(p, 2));
  const r = settleRun(p, 1, [3, 3, 3, 3, 3]); assert.ok(r.won && r.perfect && r.first); assert.ok(isOpen(p, 2)); assert.equal(room(p).best[1], 15);
  assert.equal(settleRun(p, 1, [3, 3, 1, 0, 0]).first, false);
  assert.equal(catchComet(p, "halley"), true); assert.equal(catchComet(p, "halley"), false);
  assert.ok(TAILS[0].price === 0 && TAILS.every((t) => t.note.length > 40));
});
