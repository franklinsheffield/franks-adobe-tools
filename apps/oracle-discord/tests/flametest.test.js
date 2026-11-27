// Flame Test Lab (activity/src/flametest): real data, round rules, daily and race decks, the shelf.
import test from "node:test";
import assert from "node:assert/strict";
import { SAMPLES, SPECTRA, HIDDEN, LEVELS, ROUND, TRIES, nmToRgb, sample } from "../activity/src/flametest/data.js";
import { start, guess, hint, next, won, perfect, settle, choicesFor, speedDeck, dailyOf, raceRank, room, rng } from "../activity/src/flametest/logic.js";
import { SHOP, SLOTS, owns, buyOrUse, lookOf } from "../activity/src/flametest/shop.js";
import { benchSvg, spectrumSvg } from "../activity/src/flametest/scene.js";
import { chartHtml, flametestCodex } from "../activity/src/flametest/room.js";
import { TROPHIES } from "../activity/src/trophies.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("samples and spectra hold real, well-formed data", () => {
  const ids = new Set();
  for (const s of [...SAMPLES, ...SPECTRA]) { assert.ok(!ids.has(s.id), s.id); ids.add(s.id); assert.ok(s.name && s.sym); }
  for (const s of SAMPLES) { assert.equal(s.flame.length, 3); s.flame.forEach((c) => assert.match(c, /^#[0-9a-f]{6}$/i)); assert.ok(s.fact.length > 30 && s.use.length > 20); assert.ok((s.lines || []).length || (s.bands || []).length, s.id); }
  for (const s of [...SAMPLES, ...SPECTRA]) { for (const [nm, k] of s.lines || []) { assert.ok(nm >= 380 && nm <= 800 && k > 0 && k <= 1, s.id + " " + nm); } for (const [a, b] of s.bands || []) assert.ok(a < b && a >= 380 && b <= 800); }
  for (const s of SPECTRA) assert.ok(s.lines.length && s.story.length > 60 && s.who && s.when && s.clue);
  assert.deepEqual(sample("na").lines.map((l) => l[0]), [589.0, 589.6]); // the sodium D lines
  for (const id of HIDDEN) assert.ok(sample(id).cobalt && sample(id).cobaltHex, id + " has a cobalt-glass colour");
  assert.match(nmToRgb(589), /^#[0-9a-f]{6}$/); assert.notEqual(nmToRgb(450), nmToRgb(650));
});

test("a round deals 5 samples with 4 distinct choices that include the answer", () => {
  for (const L of LEVELS) { const run = start(L); assert.equal(run.items.length, ROUND);
    for (const it of run.items) { assert.equal(new Set(it.choices).size, 4); assert.ok(it.choices.includes(it.id)); assert.ok(L.pool.includes(it.id)); } }
  assert.equal(choicesFor(LEVELS[1], "k").filter((x) => HIDDEN.includes(x)).length, 4, "Level 2 choices come from the hidden-metal pool");
});

test("scoring: tries left x multiplier, hints cost a try, 3 of 5 wins, perfect needs no slips", () => {
  const p = {}, L = LEVELS[1], run = start(L);
  const it0 = run.items[0]; assert.equal(guess(run, it0.choices.find((c) => c !== it0.id)), "wrong"); assert.equal(guess(run, it0.id), "right");
  assert.equal(run.score, Math.round((TRIES - 1) * L.mult));
  next(run); assert.ok(hint(run)); assert.ok(!hint(run), "one hint per sample"); guess(run, run.items[1].id);
  next(run); const wrongs = run.items[2].choices.filter((c) => c !== run.items[2].id); guess(run, wrongs[0]); guess(run, wrongs[1]); assert.equal(guess(run, wrongs[2]), "out");
  while (next(run)) guess(run, run.items[run.i].id);
  assert.ok(won(run)); assert.ok(!perfect(run));
  const r = settle(p, run); assert.ok(r.won && r.xp === run.score && r.essence > 0); assert.equal(room(p).wins[2], 1); assert.ok(room(p).seen.length >= 1);
  const clean = start(LEVELS[0]); do guess(clean, clean.items[clean.i].id); while (next(clean)); assert.ok(perfect(clean));
});

test("daily and race decks are the same for everyone", () => {
  assert.deepEqual(dailyOf("2026-12-01"), dailyOf("2026-12-01")); assert.ok([1, 2].includes(dailyOf("2026-12-01").L.n));
  const d = dailyOf("2026-12-01"), a = start(d.L, { seed: d.seed }), b = start(d.L, { seed: d.seed }); assert.deepEqual(a.items.map((x) => x.id), b.items.map((x) => x.id));
  assert.deepEqual(speedDeck(42).map((x) => x.id), speedDeck(42).map((x) => x.id));
  const deck = speedDeck(7); for (let i = 1; i < deck.length; i++) assert.notEqual(deck[i].id, deck[i - 1].id, "no flame twice in a row");
  const rows = raceRank({ a: { n: 9, t: 5 }, b: { n: 12, t: 9 }, c: { n: 12, t: 4 } }); assert.deepEqual(rows.map((r) => r.id), ["c", "b", "a"]); assert.equal(rows[0].place, 1);
  const r1 = rng(1); assert.ok(r1() >= 0 && r1() < 1);
});

test("the bench kit shelf: a free starter per slot, real notes, buying and wearing", () => {
  for (const [k] of SLOTS) assert.ok(SHOP.some((s) => s.slot === k && s.price === 0), k);
  for (const s of SHOP) { assert.match(s.id, /^ft-/); assert.ok(s.note.length > 30); }
  const p = { essence: 100 }; assert.equal(buyOrUse(p, "ft-platinum"), "poor"); assert.equal(buyOrUse(p, "ft-teclu"), "bought"); assert.equal(p.essence, 30);
  assert.ok(owns(p, "ft-teclu")); assert.equal(lookOf(p).burner, "ft-teclu"); assert.equal(buyOrUse(p, "ft-bunsen"), "used"); assert.equal(lookOf(p).burner, "ft-bunsen");
});

test("drawing, chart, codex and trophy", () => {
  const svg = benchSvg({ look: lookOf({}), flame: sample("cu").flame, cobalt: { hex: "#123456" }, spectrum: sample("sr"), label: "Sr" });
  assert.match(svg, /^<svg/); assert.match(svg, /cobalt glass/); assert.match(spectrumSvg(sample("na")), /589/);
  assert.match(chartHtml({}, esc), /Caesium/); assert.match(flametestCodex({}, esc), /Flame Test Lab/);
  assert.ok(TROPHIES.some((t) => t.id === "flametest" && t.art === "burner"));
});
