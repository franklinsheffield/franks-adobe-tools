import test from "node:test";
import assert from "node:assert";
import { positions, solarArcBefore } from "../src/ephemeris.js";
import { localToUtc, timeZoneAt, parseBirth } from "../src/birthplace.js";

let sw = null;
try { sw = (await import("sweph")).default; } catch {}
const P = { sun: 0, moon: 1, mercury: 2, venus: 3, mars: 4, jupiter: 5, saturn: 6, uranus: 7, neptune: 8, pluto: 9, node: 11 };

test("positions match Swiss Ephemeris within 1 arcminute (1900-2050)", { skip: !sw && "sweph not installed" }, () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 300; i++) {
    const d = new Date(Date.UTC(1900, 0, 1) + rnd() * (Date.UTC(2050, 0, 1) - Date.UTC(1900, 0, 1)));
    const p = positions(d), jd = d.getTime() / 86400000 + 2440587.5;
    for (const [k, id] of Object.entries(P)) {
      const r = sw.calc_ut(jd, id, sw.constants.SEFLG_MOSEPH | sw.constants.SEFLG_SPEED);
      let e = Math.abs(p[k].lon - r.data[0]); if (e > 180) e = 360 - e;
      assert.ok(e * 60 < 1, `${k} off by ${(e * 60).toFixed(2)}' on ${d.toISOString()}`);
    }
  }
});

test("design instant is 88 degrees of solar arc earlier", () => {
  const b = new Date("1990-07-01T19:00:00Z"), d = solarArcBefore(b);
  let arc = positions(b).sun.lon - positions(d).sun.lon; if (arc < 0) arc += 360;
  assert.ok(Math.abs(arc - 88) < 1e-4, String(arc));
  const days = (b - d) / 86400000; assert.ok(days > 85 && days < 93, String(days));
});

test("local time to UTC uses historical DST", () => {
  assert.equal(localToUtc(parseBirth("1990-07-01", "12:00"), timeZoneAt(33.45, -112.07)).toISOString(), "1990-07-01T19:00:00.000Z");
  assert.equal(localToUtc(parseBirth("1990-07-01", "12:00"), "America/New_York").toISOString(), "1990-07-01T16:00:00.000Z");
  assert.equal(localToUtc(parseBirth("1990-01-01", "12 pm"), "America/New_York").toISOString(), "1990-01-01T17:00:00.000Z");
  assert.equal(localToUtc(parseBirth("2021-11-07", "1:30 am"), "America/New_York").toISOString(), "2021-11-07T05:30:00.000Z");
  assert.equal(localToUtc(parseBirth("1985-03-10", "08:15"), "Europe/London").toISOString(), "1985-03-10T08:15:00.000Z");
});
