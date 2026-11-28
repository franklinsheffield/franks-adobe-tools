// Illuminator (activity/src/illuminator): real order of work and real pigments for a manuscript page.
import test from "node:test";
import assert from "node:assert/strict";
import { STEPS, PIGMENTS, PAGES, LEVELS, INK, CHOICES, ZONE_NAMES, pigmentOf } from "../activity/src/illuminator/data.js";
import { start, placeStep, paint, zone, settle, perfect, maxScore, stepsFor, choicesFor, rng, dailyOf, room } from "../activity/src/illuminator/logic.js";
import { SHOP, SLOTS, buyOrUse, lookOf, DEFAULT_LOOK } from "../activity/src/illuminator/shop.js";
import { pageSvg, deskHtml } from "../activity/src/illuminator/scene.js";
import { grantMantle, MANTLE } from "../activity/src/hosts/scriptorium-desk.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { ROOM_BOOKS } from "../activity/src/library.js";

test("real data: stages in order, gold before paint, every page's pigments exist", () => {
  const ids = STEPS.map((s) => s.id); assert.ok(ids.indexOf("write") < ids.indexOf("gild") && ids.indexOf("gild") < ids.indexOf("paint") && ids.indexOf("paint") < ids.indexOf("outline"));
  for (const L of LEVELS) assert.equal(stepsFor(L).length, [5, 6, 7][L.n - 1]);
  for (const p of PIGMENTS) assert.ok(p.clue.length > 20 && p.fact.length > 30 && /^#[0-9a-f]{6}$/.test(p.hex), p.id);
  for (const pg of PAGES) { assert.ok(LEVELS.some((L) => L.n === pg.lvl)); for (const [part, pig] of pg.zones) { assert.ok(ZONE_NAMES[part], part); assert.ok(pigmentOf(pig), pig); } }
  for (const L of LEVELS) assert.ok(PAGES.filter((p) => p.lvl === L.n).length >= 2);
  const ch = choicesFor("ultramarine", rng(3)); assert.equal(ch.length, CHOICES); assert.ok(ch.includes("ultramarine")); assert.equal(new Set(ch).size, CHOICES);
});

test("a perfect page: stages in order, then the right pigments", () => {
  const g = start(LEVELS[0], { seed: 7, page: "hours" });
  assert.equal(placeStep(g, "paint"), "wrong"); assert.equal(g.drops, INK - 1);
  const g2 = start(LEVELS[0], { seed: 7, page: "hours" });
  for (const id of g2.order) assert.equal(placeStep(g2, id), "right");
  assert.equal(g2.stage, "colours"); assert.equal(placeStep(g2, "rule"), null);
  for (const [, pig] of PAGES[0].zones) assert.equal(paint(g2, pig), "right");
  assert.ok(g2.over && g2.won && perfect(g2)); assert.equal(g2.score, maxScore(LEVELS[0]));
  const p = { essence: 0 }, r = settle(p, g2); assert.ok(r.newPage && r.won); assert.equal(r.essence, r.xp + 10);
  assert.ok(!settle(p, g2).newPage, "a page is new only once");
});

test("wrong pigments cost ink and can ruin the page", () => {
  const g = start(LEVELS[2], { seed: 2 }); for (const id of g.order) placeStep(g, id);
  let r; for (let i = 0; i < INK && !g.over; i++) { const z = zone(g), bad = z.choices.find((c) => c !== z.pig && !z.tried.includes(c)); if (!bad) { paint(g, z.pig); continue; } r = paint(g, bad); }
  assert.ok(g.misses > 0); if (g.over && !g.won) { assert.equal(r, "ruined"); assert.equal(g.score, 0); }
});

test("drawing, shop, mantle, daily and wiring", () => {
  assert.match(pageSvg(null, "D", true), /il-gold/); const g = start(LEVELS[0], { seed: 1 }); assert.ok(!/il-gold/.test(pageSvg(g)));
  assert.match(deskHtml({ look: DEFAULT_LOOK, sample: true, label: "x" }), /il-desk/);
  for (const [k] of SLOTS) assert.equal(SHOP.filter((s) => s.slot === k && s.price === 0).length, 1);
  for (const s of SHOP) assert.ok(s.id.startsWith("il-") && s.note.length > 40, s.id);
  const p = { essence: 60 }; assert.equal(buyOrUse(p, "il-reed"), "poor"); assert.equal(buyOrUse(p, "il-quill"), "bought"); assert.equal(lookOf(p).brush, "il-quill"); room(p);
  grantMantle(p); assert.ok(p.owned.includes(MANTLE));
  const d = dailyOf("2026-11-28"); assert.ok(LEVELS.includes(d.L)); assert.equal(d.seed, dailyOf("2026-11-28").seed);
  assert.ok(TROPHIES.some((t) => t.id === "illuminator")); assert.ok(BANTER.illuminator); assert.ok(ROOM_BOOKS.illuminator);
  for (const lines of Object.values(BANTER.illuminator)) for (const k of Object.keys(lines)) for (const l of [].concat(lines[k])) assert.ok(l.length <= 90, l);
});
