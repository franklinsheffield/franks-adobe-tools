// Tonight's real sky: the astronomy is right to well under a degree, and the right constellations are up.
import test from "node:test";
import assert from "node:assert/strict";
import { sunRaDec, gmst, altAz, frame, nightOf, riseSet, compass, upTonight, placeForZone, PLACES, sunAlt } from "../activity/src/stars/tonight.js";
import { DECK, figureStars, starByHip, TONIGHT, timeFor, drawPts, start } from "../activity/src/stars/engine.js";

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const phx = PLACES.find((p) => p.name === "Phoenix"), syd = PLACES.find((p) => p.name === "Sydney");
const pts = (g) => figureStars(g).map((h) => starByHip(h)).map((s) => [s[0], s[1]]);

test("Sun and sidereal time", () => {
  const [, dJune] = sunRaDec(Date.UTC(2026, 5, 21, 12)); near(dJune, 23.44, 0.1, "June solstice dec");
  const [raMar, dMar] = sunRaDec(Date.UTC(2026, 2, 20, 15)); near(dMar, 0, 0.3, "March equinox dec"); assert.ok(raMar < 1 || raMar > 359, "RA ~0 at equinox");
  near(gmst(Date.UTC(2000, 0, 1, 12)), 280.46, 0.01, "GMST at J2000");
});

test("alt-az: Polaris sits at the latitude, the meridian is south", () => {
  const [az, alt] = altAz(37.95, 89.26, 33.45, 0); near(alt, 33.45, 1, "Polaris altitude"); assert.ok(az < 2 || az > 358, "due north");
  const [azS, altS] = altAz(100, 0, 33.45, 100); near(azS, 180, 0.01, "south"); near(altS, 56.55, 0.01, "90 - lat");
  const f = frame(phx, Date.now()), [x, y] = f(37.95, 89.26); assert.ok(x > 358 || x < 2); near(y, 33.45, 1, "frame alt");
});

test("the night and rising/setting", () => {
  const n = nightOf(phx, Date.UTC(2026, 10, 27, 18)); // 11 am in Phoenix
  assert.ok(n.start > Date.UTC(2026, 10, 28, 0) && n.start < Date.UTC(2026, 10, 28, 2), "dark soon after 5-6 pm local");
  assert.ok(n.end - n.start > 9 * 36e5, "a long November night"); assert.ok(sunAlt(phx, n.at) <= -11.9);
  assert.ok(riseSet(37.95, 89.26, phx, n.at).always, "Polaris never sets from Phoenix");
  assert.ok(riseSet(190, -63, phx, n.at).never, "the Southern Cross never rises from Phoenix");
  const r = riseSet(84, -1, phx, n.at); assert.ok(r.rise < r.transit && r.transit < r.set); near((r.set - r.rise) / 36e5, 12, 0.4, "Orion is up ~12 h");
});

test("what's up tonight", () => {
  const at = Date.UTC(2026, 11, 15, 6, 30); // 11:30 pm in Phoenix, mid December
  const up = upTonight(DECK, pts, phx, at).map((u) => u.g.id); assert.ok(up.includes("ori"), up.join()); assert.ok(!up.includes("cru"), "no Crux from Arizona");
  const down = upTonight(DECK, pts, syd, Date.UTC(2026, 4, 15, 11)).map((u) => u.g.id); assert.ok(down.includes("cru"), down.join());
  assert.equal(compass(135), "south-east"); assert.equal(compass(359), "north");
  assert.equal(placeForZone("America/Phoenix").name, "Phoenix"); assert.equal(placeForZone("America/Boise").tz.split("/")[0], "America"); assert.equal(placeForZone("").name, "London");
});

test("Tonight scores like level 2 and has a clock", () => {
  const g = DECK[0], run = start(g, TONIGHT); run.done = true; assert.equal(drawPts(run), 45); assert.ok(timeFor(g, TONIGHT) > 90);
});
