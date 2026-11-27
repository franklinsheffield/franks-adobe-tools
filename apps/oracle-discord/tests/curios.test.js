import test from "node:test";
import assert from "node:assert/strict";
import { CURIOS, WEEKS, liveCurios, nextWeek, timedMore, repdigit, findCurio, curFound, curCount, magicWord, hearWord, WORDS, timedNow, eclipseOn, meeting, cabinetHtml, ALL_PAY } from "../activity/src/curios.js";
import { ALL_EMOTES, owned } from "../activity/src/emotes.js";

const esc = (s) => String(s);
test("every curiosity has an id, a riddle and a reward; ids are unique", () => {
  assert.equal(new Set(CURIOS.map((c) => c.id)).size, CURIOS.length);
  for (const c of CURIOS) { assert.ok(c.hint.length > 10, c.id); assert.ok((c.pay.gem || 0) + (c.pay.moon || 0) > 0, c.id); }
  assert.ok(CURIOS.length >= 20);
});
test("finds pay once; ten pays the Curator emote, all pays the Cabinet prize", () => {
  const p = { essence: 0, tokens: 0 };
  const r = findCurio(p, "window"); assert.equal(r.pay.gem, 15); assert.equal(p.essence, 15); assert.equal(findCurio(p, "window"), null); assert.equal(p.essence, 15);
  assert.ok(curFound(p, "window")); assert.equal(findCurio(p, "nope"), null);
  const later = Date.UTC(2027, 1, 1), live = liveCurios(later); assert.equal(live.length, CURIOS.length);
  let ten = 0, all = 0, weeks = 0; for (const c of CURIOS) { const x = findCurio(p, c.id, later); if (x?.ten) ten++; if (x?.all) all++; if (x?.week) weeks++; }
  assert.equal(ten, 1); assert.equal(all, 1); assert.equal(weeks, WEEKS.length); assert.equal(curCount(p), CURIOS.length);
  const gems = CURIOS.reduce((a, c) => a + (c.pay.gem || 0), 0) + ALL_PAY.gem, moons = CURIOS.reduce((a, c) => a + (c.pay.moon || 0), 0) + ALL_PAY.moon + 2 * WEEKS.length;
  assert.equal(p.essence, gems); assert.equal(p.tokens, moons);
  const mine = owned(p).map((e) => e.id); for (const id of ["knot", "curator", "wonder"]) assert.ok(mine.includes(id), id);
  assert.ok(ALL_EMOTES.some((e) => e.id === "wonder"));
});
test("magic words: phrases anywhere, short words only alone; all eight completes the lexicon", () => {
  assert.equal(magicWord("What is the MEANING of life?!")[0], "42"); assert.equal(magicWord("42")[0], "42"); assert.equal(magicWord("I own 42 cats"), null);
  assert.equal(magicWord("abracadabra please")[0], "abracadabra"); assert.equal(magicWord("will I get the job"), null);
  const p = {}; let r; for (const [id] of WORDS) r = hearWord(p, id); assert.ok(r.all); assert.equal(p.curW.length, WORDS.length);
});
test("timed finds read the real clock and calendar", () => {
  assert.deepEqual(timedNow(new Date(2026, 1, 13, 15, 33), "1990-02-13"), ["witch", "fri13", "bday"]);
  assert.deepEqual(timedNow(new Date(2028, 1, 29, 23, 11)), ["witch", "leap"]);
  assert.deepEqual(timedNow(new Date(2026, 10, 27, 13, 8)), []);
});
test("eclipses and planet meetings come from real astronomy", () => {
  assert.equal(eclipseOn(new Date(2026, 7, 12, 12)).kind, "solar"); // total solar eclipse, 12 Aug 2026
  assert.equal(eclipseOn(new Date(2026, 2, 3, 12)).kind, "lunar"); // total lunar eclipse, 3 Mar 2026
  assert.equal(eclipseOn(new Date(2026, 4, 20, 12)), null);
  const m = meeting(Date.UTC(2020, 11, 21, 18)); assert.ok(m && /Jupiter|Saturn/.test(m.a + m.b) && m.sep < 1); // the great conjunction
});
test("the Cabinet pages show riddles, never names, until found", () => {
  const p = { cur: ["skull"] }, [L, R] = cabinetHtml(p, esc), html = L + R;
  assert.ok(html.includes("The skull's whole act")); assert.ok(!html.includes("The staring contest")); assert.ok(html.includes("1 of " + liveCurios().length)); assert.ok(html.includes("more drawers open"));
});
test("weekly drawers open on their Friday, not before", () => {
  const before = new Date(2026, 11, 3, 23, 59).getTime(), on = new Date(2026, 11, 4, 0, 1).getTime();
  assert.equal(liveCurios(before).length, 24); assert.equal(liveCurios(on).length, 28);
  assert.equal(findCurio({}, "shake", before), null); assert.ok(findCurio({}, "shake", on));
  assert.equal(nextWeek(on).n, 2); assert.equal(nextWeek(Date.UTC(2027, 0, 1)), null);
  const ids = new Set(); for (const w of WEEKS) { assert.ok(w.items.length >= 3 && w.items.length <= 4); for (const c of w.items) ids.add(c.id); } assert.equal(ids.size, WEEKS.length * 4);
});
test("the weekly timed finds read real dates and astronomy", () => {
  assert.deepEqual(timedMore(new Date(2026, 11, 21, 12)).map(([id]) => id), ["solstice"]); // December solstice 2026
  assert.deepEqual(timedMore(new Date(2026, 11, 13, 20)).map(([id]) => id), ["meteor"]); // Geminids
  assert.deepEqual(timedMore(new Date(2027, 0, 1, 0, 0)).map(([id]) => id), ["midnight", "twins", "newyear"]);
  assert.deepEqual(timedMore(new Date(2027, 2, 14, 15, 14)).map(([id]) => id), ["pi"]);
  assert.ok(repdigit(777) && repdigit(2222) && !repdigit(77) && !repdigit(778));
});
