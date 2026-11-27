// The birth moment (src/moment.js): zone rules, daylight time, local mean time, true solar time, day or night,
// and how the birth systems use them.
import test from "node:test";
import assert from "node:assert/strict";
import { birthMoment, momentRows } from "../src/moment.js";
import { run as astrology } from "../src/modules/astrology/index.js";
import { run as humandesign } from "../src/modules/humandesign/index.js";
import { run as chinese, compute } from "../src/modules/chinesezodiac/index.js";
import { risingWindow } from "../src/modules/astrology/insight.js";
import { lineMargins } from "../src/humandesign/insight.js";
import { bodygraph } from "../src/humandesign/chart.js";
import { castChart, signOf } from "../src/modules/astrology/chart.js";

const PHX = { lat: 33.4484, lon: -112.074, name: "Phoenix, Arizona, USA" }, LON = { lat: 51.5074, lon: -0.1278, name: "London, UK" };
const b = (year, month, day, hour, minute) => ({ year, month, day, hour, minute });

test("zone rules: standard time, daylight time and local mean time", () => {
  const phx = birthMoment(b(1990, 4, 9, 14, 30), PHX);
  assert.equal(phx.utc.toISOString(), "1990-04-09T21:30:00.000Z"); assert.equal(phx.dst, false); assert.equal(phx.offset, -420);
  const lon = birthMoment(b(1985, 7, 14, 3, 15), LON);
  assert.equal(lon.utc.toISOString(), "1985-07-14T02:15:00.000Z"); assert.equal(lon.dst, true); assert.equal(lon.standard, 0);
  const old = birthMoment(b(1870, 3, 2, 9, 0), { lat: 48.8566, lon: 2.3522, name: "Paris" });
  assert.equal(old.lmt, true); assert.ok(Math.abs(old.offset - 9) <= 1, "Paris local mean time is about 9 minutes ahead of UTC");
});

test("clock times that repeat or never happened are flagged", () => {
  const NYC = { lat: 40.71, lon: -74.0, name: "New York" };
  assert.equal(birthMoment(b(2001, 10, 28, 1, 30), NYC).repeated, true);
  assert.equal(birthMoment(b(2001, 4, 1, 2, 30), NYC).skipped, true);
  assert.equal(birthMoment(b(2001, 6, 1, 2, 30), NYC).skipped, false);
});

test("true solar time, day or night, seasonal hour and the Moon", () => {
  const m = birthMoment(b(1990, 4, 9, 14, 30), PHX);
  assert.ok(Math.abs(m.solarShift + 30) < 2, "Phoenix runs about half an hour ahead of the Sun in April");
  assert.equal(m.daylight, true); assert.equal(m.seasonal.of, "day"); assert.equal(m.seasonal.n, 8);
  assert.equal(m.moon.phase, "Full Moon"); assert.equal(m.moon.sign, "Libra");
  const n = birthMoment(b(1985, 7, 14, 3, 15), LON);
  assert.equal(n.daylight, false); assert.equal(n.seasonal.of, "night"); assert.ok(n.solarShift < -60, "British Summer Time puts the clock over an hour ahead of the Sun");
  const polar = birthMoment(b(1995, 6, 21, 12, 0), { lat: 69.65, lon: 18.96, name: "Tromsø" });
  assert.equal(polar.seasonal, null, "midnight sun: no sunrise or sunset to divide");
});

test("public rows never print the clock time, place or coordinates; private rows do", () => {
  const m = birthMoment(b(1990, 4, 9, 14, 30), PHX), pub = JSON.stringify(momentRows(m)), priv = JSON.stringify(momentRows(m, { detail: true }));
  for (const leak of ["14:30", "14:00", "33.45", "112.07", "Phoenix", "UTC−07", "06:05", "21:30"]) assert.ok(!pub.includes(leak), `public rows leak ${leak}`);
  assert.ok(priv.includes("14:30") && priv.includes("America/Phoenix") && priv.includes("21:30 UTC"));
  const unknown = momentRows(birthMoment(b(1990, 4, 9, 12, 0), PHX, false));
  assert.match(unknown[0][1], /birth time unknown/); assert.equal(unknown[1][0], "Moon that day");
});

test("astrology: angles, sect and how exact the time has to be", async () => {
  const r = await astrology({ date: "1990-04-09", time: "14:30", place: "Phoenix" }, { geocoded: PHX, now: new Date("2026-11-27T12:00:00Z") });
  const data = r.analysis.data.join("\n");
  assert.match(data, /Sect: day chart/); assert.match(data, /On the angles: Mars .* Descendant/); assert.match(data, /Time sensitivity: Leo rising holds/);
  const w = risingWindow(r.chart), at = (min) => signOf(castChart({ utc: new Date(r.chart.utc.getTime() + min * 60000), lat: PHX.lat, lon: PHX.lon }).get("asc").lon);
  assert.equal(at(w.after.min - 1), "Leo"); assert.equal(at(w.after.min), "Virgo"); assert.equal(at(-w.before.min), "Cancer");
  const u = await astrology({ date: "1990-04-09", time_unknown: true, place: "Phoenix" }, { geocoded: PHX, now: new Date("2026-11-27T12:00:00Z") });
  assert.match(u.analysis.patterns.join("\n"), /Without a birth time there is no Ascendant/); assert.ok(!/Sect:/.test(u.analysis.data.join("\n")));
});

test("human design: the line margins match a recomputed chart", async () => {
  const r = await humandesign({ date: "1990-04-09", time: "14:30", place: "Phoenix", private: true }, { geocoded: PHX });
  const mg = lineMargins(r.chart), s = mg.soonest, dir = s.later <= s.earlier ? 1 : -1, near = Math.min(s.later, s.earlier);
  const side = s.side === "conscious" ? "personality" : "design", lineAt = (min) => bodygraph(new Date(r.chart.birthUtc.getTime() + dir * min * 60000))[side][s.key].line;
  assert.equal(lineAt(Math.max(0, near - 3)), s.line); assert.notEqual(lineAt(near + 3), s.line);
  assert.match(r.analysis.data.join("\n"), /Time sensitivity: the first activation to change line/);
});

test("chinese pillars: the hour follows true solar time and says when the clock disagrees", async () => {
  const same = await chinese({ date: "1990-04-09", time: "14:30", place: "Phoenix" }, { geocoded: PHX, now: new Date("2026-11-27T12:00:00Z") });
  assert.equal(same.reading.p.hour.branch.animal, "Goat"); assert.equal(same.reading.pClock.hour.branch.animal, "Goat");
  const diff = await chinese({ date: "1990-04-09", time: "13:10", place: "Phoenix" }, { geocoded: PHX, now: new Date("2026-11-27T12:00:00Z") });
  assert.equal(diff.reading.p.hour.branch.animal, "Horse"); assert.equal(diff.reading.pClock.hour.branch.animal, "Goat");
  assert.match(diff.analysis.patterns.join("\n"), /Clock time and true solar time disagree/);
  assert.ok(diff.embeds.some((e) => (e.fields || []).some((f) => /Clock time and Sun time disagree/.test(f.name))));
  const noPlace = compute({ birth: b(1990, 4, 9, 13, 10), utc: new Date(Date.UTC(1990, 3, 9, 5, 10)), timeKnown: true });
  assert.equal(noPlace.pClock, null, "without a place there is no solar correction");
});
