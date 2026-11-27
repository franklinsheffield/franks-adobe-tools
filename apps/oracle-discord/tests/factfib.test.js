// Fact or Fib (History of Magic party round) and the shared party vote engine (activity/src/party/vote.js).
import test from "node:test";
import assert from "node:assert/strict";
import * as V from "../activity/src/party/vote.js";
import { parseYear, promptOf, promptById, dealFib, usable, EMCEE, emcee, PROMPTS, MAX_PM } from "../activity/src/timeline/factfib.js";
import { runOf } from "../activity/src/timeline/factfib-room.js";
import { EVENTS } from "../activity/src/timeline/events.js";
import { SHOP, THEMES } from "../activity/src/timeline/shop.js";
import { rng } from "../activity/src/timeline/logic.js";

const M = (...ids) => ids.map((id) => ({ id, name: id }));

test("years parse in every common form, and nonsense or year 0 is refused", () => {
  assert.equal(parseYear("1848"), 1848); assert.equal(parseYear(" 300 BCE "), -300); assert.equal(parseYear("300 bc"), -300); assert.equal(parseYear("44 B.C."), -44);
  assert.equal(parseYear("-44"), -44); assert.equal(parseYear("AD 79"), 79); assert.equal(parseYear("79 CE"), 79); assert.equal(parseYear("1,600"), 1600);
  for (const bad of ["", "0", "abc", "1848ish", "5000 BCE", "2999", "12.5.3"]) assert.equal(parseYear(bad), null, bad);
});

test("only events with a sure year are used, and every House fib is a real wrong answer", () => {
  assert.ok(usable().length >= 40);
  for (const e of usable()) { assert.ok(e.pm <= MAX_PM); const P = promptOf(e), r = rng(e.year + 7);
    const h = P.house(r); assert.ok(h.length >= 4, e.id);
    for (const y of h) { assert.notEqual(y, e.year); assert.ok(!P.near(y), e.id + " " + y); assert.notEqual(y, 0); assert.ok(y <= 2026); } }
});

test("a deal is 5 cards from at least 3 eras, no repeats", () => {
  for (let s = 1; s < 30; s++) { const d = dealFib({}, rng(s)); assert.equal(d.length, PROMPTS);
    assert.equal(new Set(d.map((p) => p.id)).size, PROMPTS); assert.ok(new Set(d.map((p) => p.ev.era)).size >= 3); }
});

test("a full match: fibs, truth refused, house fill-in, scoring, fooling, final double, late join", () => {
  const prompts = dealFib({}, rng(3)), st = V.startMatch(prompts.map((p) => ({ id: p.id })), M("a", "b", "c")), P = () => promptById(st.prompts[st.i]);
  const e = P().ev;
  assert.equal(V.submit(st, P(), "a", String(e.year)), "truth");
  assert.equal(V.submit(st, P(), "a", "nope"), "bad");
  const fibA = e.year > 1000 ? e.year - 50 : e.year + 50;
  assert.equal(V.submit(st, P(), "a", String(fibA)), "ok");
  assert.equal(V.submit(st, P(), "b", String(fibA)), "ok"); // same fib: a and b share one card
  assert.equal(V.submit(st, P(), "z", "1500"), null); // not seated
  assert.ok(!V.allWritten(st));
  assert.ok(V.join(st, "d")); // arrives while writing: seated at once
  assert.ok(V.openVote(st, P(), rng(9))); // time's up: c and d get house fibs
  assert.ok(st.fibs.c.house && st.fibs.d.house);
  const truth = st.choices.find((c) => c.truth), shared = st.choices.find((c) => c.v === fibA);
  assert.deepEqual(shared.by.sort(), ["a", "b"]); assert.equal(new Set(st.choices.map((c) => c.v)).size, st.choices.length);
  assert.equal(V.vote(st, "a", shared.key), "own");
  assert.equal(V.vote(st, "a", truth.key), "ok"); assert.equal(V.vote(st, "c", shared.key), "ok"); assert.equal(V.vote(st, "d", shared.key), "ok");
  assert.equal(V.vote(st, "late", truth.key), "aud"); assert.ok(!V.join(st, "late")); // arrives while voting: audience
  const pv = V.publicView(st, "c"); assert.equal(pv.fibs, undefined); assert.ok(pv.choices.every((c) => !("by" in c) && !("truth" in c)));
  const L = V.reveal(st);
  assert.equal(st.score.a, V.TRUTH + 2 * V.FOOL); assert.equal(st.score.b, 2 * V.FOOL); assert.equal(st.score.c, 0);
  assert.deepEqual(L.found, ["a"]); assert.equal(L.aud, 1); assert.equal(L.audTruth, 1);
  assert.equal(V.next(st, M("a", "b", "c", "d", "late")), "write"); assert.ok(st.seats.includes("late"));
  while (!st.over) { if (st.phase === "vote" && V.isFinal(st)) { V.vote(st, "b", st.choices.find((c) => c.truth).key); const before = st.score.b; V.reveal(st); assert.equal(st.score.b - before, V.TRUTH * V.FINAL_MULT); continue; }
    V.advance(st, P(), [], rng(st.i + 1)); }
  assert.equal(st.phase, "over"); const s = V.standings(st); assert.equal(s[0].place, 1);
  const rw = V.reward(st, "a", 5); assert.ok(rw.xp > 0 && rw.essence <= 10);
});

test("writing hides everyone's fib; solo reward stays small", () => {
  const prompts = dealFib({}, rng(5)), st = V.startMatch(prompts.map((p) => ({ id: p.id })), M("me")), P = () => promptById(st.prompts[st.i]);
  V.submit(st, P(), "me", "1111"); const pv = V.publicView(st, "other"); assert.equal(pv.mine, null); assert.deepEqual(pv.done, Object.keys(st.fibs));
  while (!st.over) { if (st.phase === "vote") V.vote(st, "me", st.choices.find((c) => c.truth).key); V.advance(st, P(), [], rng(2)); }
  const rw = V.reward(st, "me", 1); assert.equal(rw.found, PROMPTS); assert.ok(rw.perfect); assert.ok(rw.essence <= PROMPTS);
});

test("timers double with long timers; the ribbon pins only revealed cards", () => {
  const st = V.startMatch([{ id: usable()[0].id }, { id: usable()[1].id }], M("a"), { long: true });
  assert.equal(V.seconds(st), V.TIMES.write * V.LONG); assert.equal(runOf(st).line.length, 0);
  st.phase = "reveal"; assert.equal(runOf(st).line.length, 1);
});

test("every House emcees in its own voice, with every line kind filled", () => {
  const kinds = Object.keys(EMCEE.oracle);
  for (const id of ["oracle", "alchemist", "observatory", "parlour", "scriptorium"]) { assert.ok(EMCEE[id], id);
    for (const k of kinds) assert.ok(EMCEE[id][k].length >= 2 && EMCEE[id][k].every((l) => l.length > 10), id + " " + k); }
  const all = Object.values(EMCEE).flatMap((E) => Object.values(E).flat()); assert.equal(new Set(all).size, all.length);
  assert.match(emcee("truth", { year: "1848" }), /1848/); assert.match(emcee("fooled", { name: "Ada", n: 2 }), /Ada/);
});

test("Fact or Fib has its own store item on the timeline shelf", () => {
  const it = SHOP.find((x) => x.id === "tl-masquerade"); assert.ok(it && it.price > 0 && THEMES[it.id]);
  assert.ok(EVENTS.length > 0);
});
