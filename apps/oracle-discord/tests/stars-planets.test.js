// Planet Tracker: real planet positions for the star chart, where they are in a city's sky, and the astrological tradition, labelled as such.
import test from "node:test";
import assert from "node:assert/strict";
import { PLANETS, planetById, where, track, lightMinutes, skyTonight, riseTime, fists, dignity, rules, astroState, visibility, FACTS, FIND, PSTYLES, planetStyleOf, trackerOf, findReward } from "../activity/src/stars/planets.js";
import { PLACES, cityOf } from "../activity/src/stars/tonight.js";
import { planetShop, stars } from "../activity/src/stars/room.js";

const phx = PLACES.find((p) => p.name === "Phoenix");
const T = Date.UTC(2026, 10, 28, 4, 0); // 9 pm in Phoenix, 27 Nov 2026

test("positions match the ephemeris: Saturn in Pisces/Cetus, Venus a morning star near Virgo, all eight tracked", () => {
  assert.equal(PLANETS.length, 8); assert.equal(planetById("mars").name, "Mars"); assert.equal(planetById("pluto"), null);
  const sat = where(planetById("saturn"), T), ven = where(planetById("venus"), T);
  assert.ok(["Pisces", "Cetus"].includes(sat.con), sat.con); assert.ok(sat.ra > 0 && sat.ra < 20, `Saturn RA ${sat.ra}`);
  assert.equal(ven.con, "Virgo"); assert.ok(ven.mag < -4, "Venus is dazzling"); assert.ok(ven.elong < 48, "Venus never strays far from the Sun");
  for (const p of PLANETS) { const w = where(p, T); assert.ok(w.ra >= 0 && w.ra < 360 && Math.abs(w.dec) <= 30, p.id); assert.ok(FACTS[p.id].length === 3 && FIND[p.id], p.id); }
  assert.ok(where(planetById("mercury"), T).elong <= 28.5, "Mercury stays within about 28° of the Sun");
  assert.ok(Math.abs(lightMinutes(1) - 8.317) < 0.01, "sunlight takes about 8.3 minutes");
});

test("a city's sky: altitude, compass point, rising time, glare and binoculars", () => {
  const rows = skyTonight(phx, T), by = Object.fromEntries(rows.map((r) => [r.p.id, r]));
  assert.ok(by.saturn.up && by.saturn.see && by.saturn.alt > 40, "Saturn is high in the evening");
  assert.ok(!by.venus.up && by.venus.rise > T && by.venus.rise - T < 864e5, "Venus is below the horizon and rises before dawn");
  assert.equal(riseTime(planetById("venus"), phx, T), by.venus.rise);
  assert.match(by.neptune.why, /binoculars/); assert.match(by.uranus.why, /binoculars/);
  assert.match(visibility(planetById("mars"), { elong: 5, mag: 1 }).why, /glare/);
  assert.equal(visibility(planetById("mercury"), { elong: 14, mag: 0 }).ok, false, "Mercury needs 15° from the Sun");
  assert.equal(fists(30), 3); assert.equal(fists(4), 1);
  for (const r of rows) assert.ok(r.dir && r.az >= 0 && r.az < 360, r.p.id);
});

test("the retrograde loop is real: Mars runs backwards around its 2027 opposition", () => {
  const st = astroState(Date.UTC(2027, 1, 19)); assert.equal(st.planets.mars.retro, true, "Mars retrograde Feb 2027");
  assert.equal(astroState(Date.UTC(2027, 5, 1)).planets.mars.retro, false);
  assert.equal(st.planets.sun.retro, false); assert.equal(st.planets.moon.retro, false);
  const path = track(planetById("mars"), Date.UTC(2027, 1, 19), 80, 80, 4), dra = path.slice(1).map((p, i) => ((p[0] - path[i][0] + 540) % 360) - 180);
  assert.ok(dra.some((d) => d > 0) && dra.some((d) => d < 0), "its RA goes both ways: a loop");
});

test("dignity table follows tradition, aspects come with orbs", () => {
  assert.equal(dignity("mars", "Aries"), "domicile"); assert.equal(dignity("venus", "Pisces"), "exaltation");
  assert.equal(dignity("mars", "Libra"), "detriment"); assert.equal(dignity("saturn", "Aries"), "fall"); assert.equal(dignity("sun", "Libra"), "fall");
  assert.equal(dignity("jupiter", "Gemini"), "detriment"); assert.equal(dignity("moon", "Scorpio"), "fall"); assert.equal(dignity("mercury", "Leo"), "peregrine");
  assert.deepEqual(rules("venus"), ["Taurus", "Libra"]); assert.deepEqual(rules("neptune"), ["Pisces"]);
  const st = astroState(T), s = st.planets.saturn;
  assert.equal(s.sign, "Aries"); assert.ok(s.text.includes("Aries"));
  for (const a of st.aspects) { assert.ok(a.a !== a.b && a.orb >= 0 && a.orb <= 8, JSON.stringify(a)); }
  const ma = st.aspects.find((a) => [a.a, a.b].sort().join() === "jupiter,mars"); assert.ok(ma, "Mars and Jupiter are close together in late Nov 2026");
});

test("rewards: once a day per planet, more for a clean find, first ever pays essence, shown pays nothing", () => {
  const r = {}, pl = trackerOf(r, T);
  assert.deepEqual(findReward(pl, "mars", 1, true), { xp: 0, essence: 0, first: false, today: false });
  assert.deepEqual(findReward(pl, "mars", 0, false), { xp: 15, essence: 7, first: true, today: true });
  assert.deepEqual(findReward(pl, "mars", 0, false), { xp: 2, essence: 0, first: false, today: false });
  const next = trackerOf(r, T + 864e5); assert.deepEqual(next.found, []); assert.deepEqual(next.ever, ["mars"]);
  assert.deepEqual(findReward(next, "mars", 2, false), { xp: 10, essence: 2, first: false, today: true });
});

test("store shelf and city-only location", () => {
  assert.equal(planetShop.kind, "planets"); assert.ok(stars.shops.includes(planetShop)); assert.equal(PSTYLES[0].price, 0);
  assert.ok(PSTYLES.every((t) => t.id.startsWith("pl-") && t.note));
  assert.equal(planetStyleOf({ planets: "pl-halo", owned: [] }), "pl-disc"); assert.equal(planetStyleOf({ planets: "pl-halo", owned: ["pl-halo"] }), "pl-halo");
  assert.equal(cityOf({ name: "Your location", lat: 33.4512, lon: -112.0734 }), null, "a precise location is never kept");
  assert.equal(cityOf({ name: "Delhi" }).tz, "Asia/Kolkata"); assert.ok(PLACES.length >= 75);
  assert.equal(new Set(PLACES.map((p) => p.name)).size, PLACES.length);
});
