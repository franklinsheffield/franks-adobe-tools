// Inscription Tray (activity/src/inscriptions): real script data, round rules, daily and race decks, the shelf.
import test from "node:test";
import assert from "node:assert/strict";
import { SCRIPTS, TYPES, LEVELS, TESTS, ROUND, DROPS, CHOICES, script } from "../activity/src/inscriptions/data.js";
import { start, test as runTest, guess, next, won, perfect, settle, choicesFor, speedDeck, dailyOf, raceRank, room, foundScripts, drawers, file } from "../activity/src/inscriptions/logic.js";
import { SHOP, SLOTS, owns, buyOrUse, lookOf } from "../activity/src/inscriptions/shop.js";
import { traySvg, fontCss } from "../activity/src/inscriptions/scene.js";
import { FONTS } from "../activity/src/inscriptions/fonts.gen.js";
import { drawersHtml, inscriptionsCodex } from "../activity/src/inscriptions/room.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("40 scripts with every clue filled in, filed under real script types", () => {
  assert.equal(SCRIPTS.length, 40); const ids = new Set();
  for (const s of SCRIPTS) {
    assert.ok(!ids.has(s.id), s.id); ids.add(s.id);
    assert.ok(TYPES.some((t) => t.id === s.type), s.id + " type");
    for (const t of TESTS) assert.ok(s[t.k] && s[t.k].length >= 6, `${s.id} ${t.k}`);
    assert.ok(s.fact.length > 50 && s.when && s.where && s.name, s.id);
    assert.ok(s.sample || s.draw, s.id + " has a sample or a sketch");
    if (s.font) { assert.ok(FONTS[s.font], s.id + " font bundled"); }
  }
  assert.deepEqual(SCRIPTS.filter((s) => s.type === "undeciphered").map((s) => s.id).sort(), ["indus", "lineara", "rongorongo"]);
  assert.equal(LEVELS.at(-1).pool.length, 40); assert.equal(LEVELS[0].pool.length, 12);
  assert.match(script("linearb").fact, /Ventris/); assert.match(script("cherokee").fact, /1821/);
  assert.match(fontCss(), /@font-face\{font-family:"ins-linearb"/);
});

test("a round: 5 finds, 6 choices with the answer, tests and wrong names cost ink", () => {
  for (const L of LEVELS) { const run = start(L); assert.equal(run.items.length, ROUND); assert.equal(new Set(run.items.map((x) => x.id)).size, ROUND);
    for (const it of run.items) { assert.equal(new Set(it.choices).size, CHOICES); assert.ok(it.choices.includes(it.id)); assert.ok(L.pool.includes(it.id)); } }
  const p = {}, L = LEVELS[2], run = start(L), it = run.items[0];
  assert.equal(runTest(run, "dir"), script(it.id).dir); assert.equal(runTest(run, "dir"), null, "each test once"); assert.equal(it.drops, DROPS - 1);
  runTest(run, "signs"); runTest(run, "tool"); assert.equal(runTest(run, "mark"), null, "the last drop is kept for a name");
  assert.equal(guess(run, it.id), "right"); assert.equal(run.score, Math.round(1 * L.mult));
  next(run); const w = run.items[1].choices.filter((c) => c !== run.items[1].id);
  for (let k = 0; k < DROPS - 1; k++) assert.equal(guess(run, w[k]), "wrong"); assert.equal(guess(run, w[DROPS - 1]), "out");
  while (next(run)) guess(run, run.items[run.i].id);
  assert.ok(won(run)); assert.ok(!perfect(run));
  const r = settle(p, run); assert.ok(r.won && r.xp === run.score && r.essence > 0); assert.equal(room(p).wins[3], 1);
  assert.equal(foundScripts(p).length, 4); assert.equal(r.newFound.length, 4);
  assert.deepEqual(file(p, [run.items[0].id]), [], "filing twice adds nothing");
  const clean = start(LEVELS[0]); do guess(clean, clean.items[clean.i].id); while (next(clean)); assert.ok(perfect(clean));
});

test("drawers, daily, race and speed decks", () => {
  const p = {}; file(p, ["latin", "hebrew", "lineara"]); const d = drawers(p);
  assert.equal(d.length, TYPES.length); assert.equal(d.find((x) => x.id === "abjad").got.length, 1); assert.equal(d.find((x) => x.id === "undeciphered").got[0].id, "lineara");
  assert.deepEqual(dailyOf("2026-12-01"), dailyOf("2026-12-01")); const dd = dailyOf("2026-12-01");
  assert.deepEqual(start(dd.L, { seed: dd.seed }).items.map((x) => x.id), start(dd.L, { seed: dd.seed }).items.map((x) => x.id));
  const deck = speedDeck(9); assert.deepEqual(deck.map((x) => x.id), speedDeck(9).map((x) => x.id));
  for (let i = 0; i < deck.length; i++) { assert.equal(deck[i].choices.length, 4); assert.ok(deck[i].choices.includes(deck[i].id)); if (i) assert.notEqual(deck[i].id, deck[i - 1].id); }
  assert.deepEqual(raceRank({ a: { n: 3, t: 1 }, b: { n: 5, t: 9 }, c: { n: 5, t: 2 } }).map((r) => r.id), ["c", "b", "a"]);
  assert.match(drawersHtml(p, esc), /Linear A/); assert.match(inscriptionsCodex(p, esc), /3 \/ 40/);
});

test("the tray kit shelf, drawing, trophy and banter", () => {
  for (const [k] of SLOTS) assert.ok(SHOP.some((s) => s.slot === k && s.price === 0), k);
  for (const s of SHOP) { assert.match(s.id, /^in-/); assert.ok(s.note.length > 40); }
  const p = { essence: 100 }; assert.equal(buyOrUse(p, "in-rti"), "poor"); assert.equal(buyOrUse(p, "in-squeeze"), "bought"); assert.equal(p.essence, 40);
  assert.ok(owns(p, "in-squeeze")); assert.equal(lookOf(p).copy, "in-squeeze"); assert.equal(buyOrUse(p, "in-charcoal"), "used"); assert.equal(lookOf(p).copy, "in-charcoal");
  for (const s of SCRIPTS) { const svg = traySvg({ look: lookOf({}), id: s.id, scan: true, filed: true, label: s.name }); assert.match(svg, /^<svg/); assert.doesNotMatch(svg, /undefined|null/, s.id); }
  assert.match(traySvg({ look: { light: "in-rti", copy: "in-cast", tray: "in-box" }, id: "maya" }), /plaster cast/);
  assert.ok(TROPHIES.some((t) => t.id === "inscriptions" && t.art === "loupe"));
  assert.equal(Object.keys(BANTER.inscriptions).length, 10);
});
