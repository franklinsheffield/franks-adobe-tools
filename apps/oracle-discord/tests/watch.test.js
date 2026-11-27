// The Night Watch (activity/src/watch/): the Observatory's core loop. Observe -> measure -> deliver.
import test from "node:test";
import assert from "node:assert/strict";
import { TARGETS, WANDERERS, EYEPIECES, CLASSES, TYPES, targetById, magnification, ALL_IDS } from "../activity/src/watch/catalog.js";
import { upNow, eyeVerdict, observe, logged, plateQuestion, settlePlate, measured, phaseName, repOf, tonightsTarget, placeOf, room } from "../activity/src/watch/engine.js";
import { JOBS, jobsFor, questionFor, unlocked, deliver, deskToday, isLeap, ECLIPSES, SAROS_DAYS } from "../activity/src/watch/desk.js";
import { PLACES } from "../activity/src/stars/tonight.js";

const city = (n) => PLACES.find((p) => p.name === n);

test("the catalogue is complete and consistent", () => {
  assert.equal(new Set(ALL_IDS).size, ALL_IDS.length, "ids are unique");
  const eyes = EYEPIECES.map((e) => e.id);
  assert.deepEqual(EYEPIECES.map(magnification), [31, 83, 167]);
  for (const t of [...TARGETS, ...WANDERERS]) {
    assert.ok(t.name && t.kind && t.note && t.note.length > 30, t.id);
    assert.ok(eyes.includes(t.eye), t.id + " eyepiece");
    if (t.plate === "spectrum") assert.ok(CLASSES.includes(t.cls), t.id);
    if (t.plate === "type") assert.ok(TYPES.includes(t.kind) && t.messier, t.id);
    if (t.ra !== undefined) assert.ok(t.ra >= 0 && t.ra < 360 && t.dec >= -90 && t.dec <= 90, t.id);
  }
  for (const c of CLASSES) assert.ok(TARGETS.some((t) => t.cls === c), "a star of class " + c);
});

test("tonight's sky is real: Polaris stands at the latitude in the north and never rises in the south", () => {
  const at = Date.parse("2026-12-15T05:00:00Z");
  const pol = upNow(city("London"), at).find((o) => o.t.id === "polaris"); assert.ok(pol); assert.ok(Math.abs(pol.alt - 51.5) < 1.5, "Polaris altitude ~ latitude");
  assert.ok(!upNow(city("Sydney"), at).some((o) => o.t.id === "polaris"));
  assert.ok(upNow(city("Sydney"), Date.parse("2026-06-15T12:00:00Z")).some((o) => o.t.id === "acen"), "Alpha Centauri is up over Sydney on a June night");
  const t = tonightsTarget(city("Phoenix"), at, 12345); assert.ok(t && t.alt >= 15);
  assert.equal(placeOf({ rooms: { watch: { place: { name: "Lisbon" } } } }).name, "Lisbon");
  assert.equal(placeOf({ rooms: { watch: { place: { name: "My house", lat: 1, lon: 2 } } } }).lat === 1, false, "only listed cities are kept");
});

test("eyepieces: one right choice per target, with a real reason for the others", () => {
  for (const t of [...TARGETS, ...WANDERERS]) for (const e of EYEPIECES) {
    const v = eyeVerdict(t, e.id); if (e.id === t.eye) assert.equal(v, null); else assert.ok(v && v.includes(t.name), t.id + e.id);
  }
  const p = {}; const m45 = targetById("m45");
  assert.equal(observe(p, m45, "high", { at: 1, city: "Rome", alt: 50 }).ok, false); assert.ok(!logged(p, "m45"));
  assert.equal(observe(p, m45, "low", { at: 1, city: "Rome", alt: 50 }).ok, true); assert.ok(logged(p, "m45"));
});

test("every plate asks a question whose answer is among the choices", () => {
  for (const t of [...TARGETS, ...WANDERERS]) for (const deg of [0, 95, 180, 300]) {
    const q = plateQuestion(t, Math.random, deg); assert.ok(q && q.q && q.why, t.id);
    assert.ok(q.choices.includes(q.a), `${t.id}: ${q.a} in ${q.choices}`); assert.equal(new Set(q.choices).size, q.choices.length, t.id + " no repeats");
  }
  assert.equal(phaseName(0), "New Moon"); assert.equal(phaseName(90), "First quarter"); assert.equal(phaseName(180), "Full Moon"); assert.equal(phaseName(270), "Last quarter"); assert.equal(phaseName(355), "New Moon");
  const p = {}; assert.equal(settlePlate(p, "algol", 2).stars, 2); assert.equal(settlePlate(p, "algol", 1).better, true); assert.equal(room(p).plates.algol, 3); assert.ok(measured(p, "algol"));
});

test("the Almanac Desk: real answers, 3 jobs a day with one hard job, hard jobs need a plate", () => {
  for (const j of JOBS) {
    for (const s of [1, 2, 3, 99, 12345]) { const q = questionFor(j, s); assert.ok(q.choices.includes(q.a), `${j.id}: ${q.a}`); assert.equal(new Set(q.choices).size, q.choices.length, j.id); }
    for (const id of j.needs || []) assert.ok(targetById(id), j.id + " needs " + id);
  }
  for (const s of [1, 7, 42, 2026]) { const js = jobsFor(s); assert.equal(js.length, 3); assert.equal(js.filter((j) => j.needs).length, 1); assert.equal(new Set(js.map((j) => j.id)).size, 3); }
  assert.deepEqual(jobsFor(77).map((j) => j.id), jobsFor(77).map((j) => j.id), "same day, same jobs");
  for (const [y, ok] of [[1900, false], [2000, true], [2100, false], [2400, true], [2028, true], [2026, false]]) assert.equal(isLeap(y), ok, String(y));
  // saros returns of real eclipses land on the real next eclipses of each series
  const next = ECLIPSES.map((e) => new Date(Date.parse(e.d) + SAROS_DAYS * 864e5).toISOString().slice(0, 10));
  assert.deepEqual(next, ["2035-09-02", "2037-07-13", "2042-04-20"]);
  const p = {}, algol = JOBS.find((j) => j.id === "algol"); assert.equal(unlocked(p, algol), false); settlePlate(p, "algol", 1); assert.equal(unlocked(p, algol), true);
  assert.equal(deliver(p, "2026-11-27", algol, true).paid, true); assert.equal(deliver(p, "2026-11-27", algol, true).paid, false, "once a day");
  assert.equal(deskToday(p, "2026-11-28").done.length, 0, "new day, new jobs");
  room(p).jobsDone = 8; assert.equal(repOf(p).name, "Royal Society Fellow"); room(p).jobsDone = 25; assert.equal(repOf(p).name, "Astronomer Royal");
});
