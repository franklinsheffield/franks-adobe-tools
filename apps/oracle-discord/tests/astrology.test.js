import test from "node:test";
import assert from "node:assert";
import { castChart } from "../src/modules/astrology/chart.js";
import { render, withPng, command } from "../src/modules/astrology/index.js";

let sw = null;
try { sw = (await import("sweph")).default; } catch {}
const arcmin = (a, b) => { let e = Math.abs(a - b) % 360; if (e > 180) e = 360 - e; return e * 60; };

test("Asc, MC and Placidus cusps match Swiss Ephemeris", { skip: !sw && "sweph not installed" }, () => {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 200; i++) {
    const d = new Date(Date.UTC(1900, 0, 1) + rnd() * (Date.UTC(2050, 0, 1) - Date.UTC(1900, 0, 1)));
    const lat = -60 + rnd() * 120, lon = -180 + rnd() * 360;
    const c = castChart({ utc: d, lat, lon, houses: "placidus" }), jd = d.getTime() / 86400000 + 2440587.5;
    const r = sw.houses(jd, lat, lon, "P");
    assert.ok(arcmin(c.get("asc").lon, r.data.points[0]) < 0.5, "asc");
    assert.ok(arcmin(c.get("mc").lon, r.data.points[1]) < 0.5, "mc");
    if (c.system === "placidus") c.cusps.forEach((x, k) => assert.ok(arcmin(x, r.data.houses[k]) < 0.5, `cusp ${k + 1} on ${d.toISOString()}`));
  }
});

test("Einstein: Sun 23 Pisces, Moon 14 Sagittarius, Cancer rising (Astrodienst)", () => {
  const c = castChart({ utc: new Date("1879-03-14T10:50:04Z"), lat: 48.4, lon: 9.9833, houses: "placidus" });
  assert.equal(c.get("sun").sign, "Pisces"); assert.equal(Math.floor(c.get("sun").deg), 23);
  assert.equal(c.get("moon").sign, "Sagittarius"); assert.equal(Math.floor(c.get("moon").deg), 14);
  assert.equal(c.get("asc").sign, "Cancer"); assert.equal(Math.floor(c.get("asc").deg), 11);
  assert.equal(c.get("sun").house, 10);
});

test("polar birth falls back to Whole Sign; unknown time has no houses", () => {
  const polar = castChart({ utc: new Date("1990-06-21T12:00:00Z"), lat: 78.2, lon: 15.6, houses: "placidus" });
  assert.equal(polar.system, "whole");
  const noTime = castChart({ utc: new Date("1990-06-21T19:00:00Z"), lat: 33.45, lon: -112.07, timeKnown: false });
  assert.equal(noTime.cusps, null); assert.equal(noTime.get("sun").house, undefined);
  assert.ok(!noTime.aspects.some((a) => a.a === "moon" || a.b === "moon"));
});

test("reading fits Discord embed limits and renders a PNG", async () => {
  for (const [time, houses] of [["08:45", "placidus"], ["", "placidus"], ["23:10", "whole"]]) {
    const c = castChart({ utc: new Date("1990-07-14T15:45:00Z"), lat: 33.45, lon: -112.07, houses, timeKnown: !!time });
    const r = render(c, { date: "1990-07-14", time, place: "Phoenix, AZ", name: "Test <&>" }, { name: "Phoenix, Arizona, United States" });
    const e = r.embeds[0];
    assert.ok(e.fields.length <= 25);
    for (const f of e.fields) { assert.ok(f.name.length <= 256 && f.value.length <= 1024 && f.value.length > 0, f.name); }
    const total = e.title.length + e.description.length + e.footer.text.length + e.fields.reduce((n, f) => n + f.name.length + f.value.length, 0);
    assert.ok(total <= 6000, String(total));
    assert.ok(r.ephemeral);
  }
  const c = castChart({ utc: new Date("1990-07-14T15:45:00Z"), lat: 33.45, lon: -112.07 });
  const r = await withPng(render(c, { date: "1990-07-14", time: "08:45", place: "Phoenix" }, { name: "Phoenix" }));
  assert.deepEqual([...r.files[0].data.slice(1, 4)], [80, 78, 71]); // "PNG"
  assert.equal(command.name, "astrology");
});

test("/astrology now: sky context, transits and embed limits", async () => {
  const { renderNow, render } = await import("../src/modules/astrology/index.js");
  const { castNow, moonPhase, ingresses, transits } = await import("../src/modules/astrology/now.js");
  assert.equal(moonPhase(0, 180).name, "🌕 Full Moon"); assert.equal(moonPhase(10, 5).name, "🌑 New Moon");
  const date = new Date("2026-11-26T18:30:00Z");
  const ing = ingresses(date); assert.ok(ing.some((x) => x.key === "moon") && ing.every((x) => x.at > date));
  const sky = castNow(date, null); assert.equal(sky.cusps, null);
  assert.ok(sky.aspects.some((a) => a.a === "moon" || a.b === "moon"), "moon aspects kept when only houses are missing");
  const natal = castChart({ utc: new Date("1879-03-14T10:50:04Z"), lat: 48.4, lon: 9.9833 });
  assert.ok(transits(natal, sky).length > 0);
  for (const where of [null, { lat: 33.45, lon: -112.07, name: "Phoenix, Arizona" }]) {
    const r = renderNow(castNow(date, where), date, where, natal);
    const e = r.embeds[0];
    for (const f of e.fields) assert.ok(f.value.length > 0 && f.value.length <= 1024, f.name);
    assert.ok(e.fields.length <= 25 && r.ephemeral);
  }
  const withNow = render(natal, { date: "1879-03-14", time: "11:30", place: "Ulm" }, { name: "Ulm" }, sky).embeds[0];
  assert.ok(withNow.fields.some((f) => f.name === "🌌 Right now"));
  const total = withNow.title.length + withNow.description.length + withNow.footer.text.length + withNow.fields.reduce((n, f) => n + f.name.length + f.value.length, 0);
  assert.ok(total <= 6000, String(total));
});

test("time_unknown from the saved-profile modal hides houses", async () => {
  const { run } = await import("../src/modules/astrology/index.js");
  const r = await run({ subcommand: "chart", date: "1990-07-14", time: "12:00", time_unknown: true, place: "Phoenix" },
    { geocoded: { lat: 33.45, lon: -112.07, name: "Phoenix" }, now: new Date("2026-11-26T18:30:00Z") });
  assert.equal(r.chart.cusps, null);
  assert.ok(r.embeds[0].description.includes("birth time unknown"));
});
