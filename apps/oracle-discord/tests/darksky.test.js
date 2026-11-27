// The Observatory's menu background (watch/menubg.js) and hidden finds (watch/darksky.js).
import test from "node:test";
import assert from "node:assert/strict";
import { obsBg, menuBg, showerTonight, isNight } from "../activity/src/watch/menubg.js";
import { secrets, ITEMS } from "../activity/src/watch/darksky.js";
import { PLACES } from "../activity/src/stars/tonight.js";

const run = (kind, data) => { const got = []; secrets.event(kind, data, { find: (id, line) => { assert.ok(line && line.length > 30, id); got.push(id); } }); return got; };
const local = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();

test("menu background: real showers, real night, tap targets, city only", () => {
  assert.equal(showerTonight(local(2026, 8, 12)), "Perseids"); assert.equal(showerTonight(local(2026, 12, 14)), "Geminids"); assert.equal(showerTonight(local(2026, 3, 1)), null);
  const lon = PLACES.find((p) => p.name === "London");
  assert.equal(isNight(Date.parse("2026-12-15T23:00:00Z"), lon), true); assert.equal(isNight(Date.parse("2026-06-15T12:00:00Z"), lon), false);
  const html = obsBg(local(2026, 8, 12, 23)); assert.ok(html.includes("Perseids tonight")); assert.equal((html.match(/class="ob-met/g) || []).length, 7);
  for (const t of ["polaris", "milkyway", "meteor", "moon", "dome"]) assert.ok(html.includes(`data-tap="${t}"`), t);
  assert.ok(menuBg.css.includes(".mb-hot")); assert.ok(menuBg.html(Date.now(), { prog: { rooms: { watch: { place: { name: "Lisbon" } } } } }).includes("obs-bg"));
});

test("the Dark Sky: 20 unique finds with real facts, found by the right events", () => {
  assert.equal(ITEMS.length, 20); assert.equal(new Set(ITEMS.map((i) => i.id)).size, 20);
  for (const it of secrets.items) assert.ok(it.e && it.name && it.hint && (it.pay.token || it.pay.gem) && !it.line, it.id);
  assert.deepEqual(run("tap", { tap: "polaris" }), ["polaris"]);
  assert.ok(run("tap", { tap: "dome", count: 5, at: local(2026, 6, 1, 12) }).includes("dome"));
  assert.deepEqual(run("home", { at: local(2026, 1, 7, 12) }), ["galileo"]);
  assert.ok(run("home", { at: local(2028, 2, 29, 12) }).includes("leapday"));
  assert.ok(run("home", { at: local(2026, 12, 21, 3) }).includes("turning"));
  assert.ok(run("home", { at: local(2026, 12, 21, 3) }).includes("darkhours"));
  assert.deepEqual(run("poke", { count: 7 }), ["altair"]);
  assert.deepEqual(run("result", { room: "watch", won: true, level: 3, perfect: true }), ["almanac", "mauna"]);
  assert.deepEqual(run("result", { room: "rummy", won: true, level: 3, perfect: true }), []);
});
