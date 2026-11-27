// Calendar Keeper: the calendar maths matches known historical anchors, and every puzzle's answer is real and reachable.
import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../activity/src/calendar/engine.js";
import { LEVELS, ALL } from "../activity/src/calendar/puzzles.js";
import { start, useHint, check, settle, room, starsOf, isOpen, nextPuzzle, SHOP, lookOf } from "../activity/src/calendar/logic.js";
import { GUIDES, GUIDE_ORDER } from "../activity/src/calendar/guide.js";

const J = (y, m, d) => E.jdnOf({ year: y, month: m, day: d });
const julian = (Y, M, D) => { const a = Math.floor((14 - M) / 12), y = Y + 4800 - a, m = M + 12 * a - 3; return D + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083; };

test("dates round-trip and the Maya anchors hold", () => {
  for (const j of [J(2012, 12, 21), J(1, 1, 1), J(-3113, 8, 11), J(2026, 11, 27)]) assert.equal(E.jdnOf(E.dateOf(j)), j);
  const m = E.maya(J(2012, 12, 21)); assert.equal(m.tz, "4 Ajaw"); assert.equal(m.haabName, "3 K'ank'in"); assert.equal(m.lc, "13.0.0.0.0");
  const z = E.maya(J(-3113, 8, 11)); assert.equal(z.tz, "4 Ajaw"); assert.equal(z.haabName, "8 Kumk'u");
  assert.deepEqual(E.tzAdd(13, 19, 1), { tone: 1, sign: 0 });
  assert.equal(E.CALENDAR_ROUND % 260, 0); assert.equal(E.CALENDAR_ROUND % 365, 0); assert.equal(E.CALENDAR_ROUND / 365, 52);
  const t = J(2026, 11, 27), np = E.nextHaab(t, 0, 0); assert.equal(E.maya(np).haabName, "0 Pop");
  assert.equal(E.maya(E.nextHaab(t, 0, 18)).haabName, "0 Wayeb'");
});

test("Egyptian civil year matches Censorinus and Ptolemy's era", () => {
  assert.equal(E.egyptCivil(julian(-746, 2, 26)).name, "1 Thoth"); // Era of Nabonassar
  assert.equal(E.egyptCivil(julian(238, 6, 25)).name, "1 Thoth"); // Censorinus, De die natali 21
  const t = J(2026, 11, 27), th = E.nextThoth(t); assert.equal(E.egyptCivil(th).name, "1 Thoth"); assert.ok(th > t && th - t <= 365);
  assert.deepEqual(E.egyAdd(0, 25, 10), { month: 1, day: 5 });
  assert.deepEqual(E.egyAdd(11, 30, 1), { month: 12, day: 1 });
  const n = E.nextNayrouz(t), g = E.dateOf(n); assert.equal(g.month, 9); assert.ok([11, 12].includes(g.day));
  assert.equal(E.dateOf(E.nextNayrouz(J(2023, 1, 1))).day, 12); // the year before 2024, a leap year
  assert.equal(E.dateOf(E.nextNayrouz(J(2025, 1, 1))).day, 11);
});

test("Celtic festivals and the Sun's cross-quarter points", () => {
  const nf = E.nextFestival(J(2026, 11, 27)); assert.equal(nf.f.id, "imbolc"); assert.equal(E.fmt(nf.jdn), "1 Feb 2027");
  const s = E.dateOf(E.sunAt(225, J(2026, 9, 1))); assert.equal(s.month, 11); assert.ok(s.day >= 6 && s.day <= 8);
});

test("real eclipses and the Saros", () => {
  const e = E.nextSolar(J(2024, 4, 1)); assert.equal(E.fmt(e.jdn), "8 Apr 2024"); assert.equal(e.kind, "total");
  assert.equal(E.fmt(E.sarosAfter(e).jdn), "20 Apr 2042");
  const a = E.nextSolar(J(2017, 8, 1)); assert.equal(E.fmt(a.jdn), "21 Aug 2017"); assert.equal(E.fmt(E.sarosAfter(a).jdn), "2 Sep 2035");
  const l = E.nextLunar(J(2008, 2, 1), true); assert.equal(E.fmt(l.jdn), "21 Feb 2008"); assert.equal(E.fmt(E.sarosAfter(l).jdn), "3 Mar 2026");
});

test("every puzzle generates a fair question with its answer among the options", () => {
  let seed = 7; const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const today of [J(2026, 11, 27), J(2027, 6, 15), J(2028, 2, 29)]) for (const { L, p } of ALL) for (let k = 0; k < 4; k++) {
    const g = p.gen(rng, today), id = `${L.n}:${p.id}`;
    assert.ok(g.q && g.explain && g.hints.length === 2, id);
    if (g.kind === "choice") { assert.equal(g.choices.length, 4, id + " " + g.choices); assert.equal(new Set(g.choices).size, 4, id); assert.ok(g.choices.includes(g.answer), id); }
    if (g.kind === "tz") { assert.ok(g.answer.tone >= 1 && g.answer.tone <= 13 && g.answer.sign >= 0 && g.answer.sign < 20, id); assert.equal(E.maya(g.after).tone, g.answer.tone, id); assert.equal(E.maya(g.after).sign, g.answer.sign, id); }
    if (g.kind === "egy") { assert.deepEqual({ month: E.egyptCivil(g.after).month, day: E.egyptCivil(g.after).day }, g.answer, id); }
    if (g.kind === "num") assert.ok(Number.isInteger(g.answer), id);
  }
  assert.equal(ALL.length, 26);
});

test("scoring: hints and mistakes cost stars, replays pay only improvement, levels unlock", () => {
  const prog = { xp: 0 }, L = LEVELS[0], p = L.deck.find((x) => x.id === "tz-260");
  let run = start(L, p, p.gen(Math.random, J(2026, 11, 27)));
  assert.ok(useHint(run)); assert.equal(check(run, "200"), "wrong"); assert.equal(run.stars, 1);
  assert.equal(useHint(run), null, "never spend the last star on a hint");
  assert.equal(check(run, "260"), "right");
  let r = settle(prog, run); assert.equal(r.stars, 1); assert.ok(r.first); assert.equal(r.xp, 9); assert.equal(r.essence, 3);
  run = start(L, p, p.gen(Math.random, J(2026, 11, 27))); check(run, "260"); r = settle(prog, run);
  assert.equal(r.stars, 3); assert.equal(r.xp, 8); assert.equal(r.essence, 6);
  run = start(L, p, p.gen(Math.random, J(2026, 11, 27))); check(run, "260"); r = settle(prog, run); assert.equal(r.xp, 0);
  run = start(L, p, p.gen(Math.random, J(2026, 11, 27))); check(run, 1); check(run, 2); assert.equal(check(run, 3), "out"); assert.equal(settle(prog, run).xp, 0);
  assert.equal(starsOf(prog), 3); assert.equal(room(prog).plays, 4);
  assert.ok(!isOpen(prog, LEVELS[1]));
  for (const x of L.deck.slice(0, 4)) room(prog).stars[`1:${x.id}`] = 1;
  assert.ok(isOpen(prog, LEVELS[1]));
  assert.notEqual(nextPuzzle(prog, L, "tz-next").id, "tz-next");
  const tz = L.deck.find((x) => x.id === "tz-next"), g = tz.gen(Math.random, J(2026, 11, 27)); run = start(L, tz, g);
  assert.equal(check(run, { ...g.answer }), "right");
});

test("shop shelf and guides", () => {
  assert.ok(SHOP.every((s) => s.id.startsWith("cal-") && s.kind === "calendar" && s.look));
  assert.equal(SHOP.filter((s) => s.price === 0).length, 1);
  assert.equal(lookOf({}), SHOP[0].look);
  assert.equal(lookOf({ calendar: "cal-jade", owned: [] }), SHOP[0].look, "unowned looks fall back");
  assert.equal(lookOf({ calendar: "cal-jade", owned: ["cal-jade"] }), SHOP[1].look);
  for (const k of GUIDE_ORDER) assert.ok(GUIDES[k].sections.length >= 4, k);
});

test("turning the desk by hand", async () => {
  const E = await import("../activity/src/calendar/engine.js");
  const D = await import("../activity/src/calendar/drag.js");
  const j0 = E.jdnOf({ year: 2026, month: 11, day: 27 });
  // n = 0 matches the desk's own rotation formulas
  const a0 = D.turnAngles(j0, 0);
  assert.equal(a0.small, -(j0 - E.GMT) * (360 / 13));
  assert.equal(a0.big, (j0 - E.GMT) * 18);
  // one Tzolk'in round brings both gears back to the same position (mod 360)
  const a260 = D.turnAngles(j0, 260);
  assert.ok(Math.abs(((a260.small - a0.small) % 360 + 360) % 360) < 1e-6 || Math.abs(((a260.small - a0.small) % 360 + 360) % 360 - 360) < 1e-6);
  assert.ok(Math.abs(((a260.big - a0.big) % 360 + 360) % 360) < 1e-6);
  // the needle does one full turn in 365 days
  assert.ok(Math.abs(D.turnAngles(j0, 365).needle - a0.needle - 360) < 1e-9);
  // pickers <-> dials round-trip
  for (const n of [0, 1, 13, 20, 99, 259]) { const m = E.maya(j0 + n); assert.equal(D.daysToTz(j0, { tone: m.tone, sign: m.sign }), n); }
  for (const n of [0, 5, 30, 200, 364]) { const e = E.egyptCivil(j0 + n); assert.equal(D.daysToEgy(j0, { month: e.month, day: e.day }), n); }
  assert.equal(D.hubAt(238 + 50, 128), "small"); assert.equal(D.hubAt(130 + 60, 292), "egypt"); assert.equal(D.hubAt(5, 5), null);
});

test("Daily Sky: the same three puzzles for everyone, a new set each day", async () => {
  const DS = await import("../activity/src/calendar/daily-sky.js");
  const a = DS.dailySet("2026-11-27"), b = DS.dailySet("2026-11-27"), c = DS.dailySet("2026-11-28");
  assert.equal(a.length, 3);
  assert.deepEqual(a.map((x) => [x.L.n, x.p.id, JSON.stringify(x.g.answer), x.g.q]), b.map((x) => [x.L.n, x.p.id, JSON.stringify(x.g.answer), x.g.q]));
  assert.deepEqual(a.map((x) => x.L.n), [1, 2, 3]);
  assert.notDeepEqual(a.map((x) => x.g.q), c.map((x) => x.g.q));
  for (let d = 1; d <= 30; d++) for (const x of DS.dailySet(`2026-12-${String(d).padStart(2, "0")}`)) { assert.ok(x.g.q && x.g.answer != null); if (x.g.choices) assert.ok(x.g.choices.includes(x.g.answer)); }
  assert.equal(DS.dailyScore([3, 2, 0]), 5);
  assert.deepEqual(DS.dailyReward(9, 1), { xp: 37, essence: 18 });
  assert.equal(DS.dailyReward(9, 50).essence, 30);
});

test("birthday in every calendar", async () => {
  const B = await import("../activity/src/calendar/birthday.js");
  const birth = E.jdnOf({ year: 2012, month: 12, day: 21 }), today = E.jdnOf({ year: 2026, month: 11, day: 27 });
  const b = B.birthdayOf(birth, today);
  assert.equal(b.maya.tz, "4 Ajaw"); assert.equal(b.maya.lc, "13.0.0.0.0"); assert.match(b.maya.meaning, /lord/);
  assert.equal(b.celtic.after.id, "samhain"); assert.equal(b.celtic.next.id, "imbolc");
  // the next sacred birthday really is the same Tzolk'in day, within 260 days
  assert.ok(b.nextTz.days >= 0 && b.nextTz.days < 260); assert.equal(E.maya(b.nextTz.jdn).tz, "4 Ajaw");
  assert.equal(E.egyptCivil(b.nextEgy.jdn).doy, E.egyptCivil(birth).doy);
  assert.equal(b.rounds, Math.floor((today - birth) / 260));
  assert.equal(B.SIGN_MEANING.length, 20);
  // 1 January sits after Samhain; 1 May is Bealtaine itself
  assert.equal(B.celticSeason(E.jdnOf({ year: 2000, month: 1, day: 1 })).after.id, "samhain");
  assert.ok(B.celticSeason(E.jdnOf({ year: 2000, month: 5, day: 1 })).onDay);
  // an epagomenal birthday names its god
  const ep = E.NABONASSAR + 365 * 3000 + 363; assert.equal(B.birthdayOf(ep, ep + 10).egypt.god, "Isis");
});
