// Case Files (activity/src/casefiles): 40 real cases, methods, tools, candles, casebook, daily, shelf, trophy.
import test from "node:test";
import assert from "node:assert/strict";
import { CASES, CLASSES, METHODS, LEVELS, TOOLS, TOOL_KEYS, caseOf, method, findingOf } from "../activity/src/casefiles/data.js";
import { start, useTool, accuse, scoreOf, settle, perfect, optionsFor, nextOf, dailyOf, room, learnedMethods, useful, CANDLES, OPTIONS } from "../activity/src/casefiles/logic.js";
import { SHOP, SLOTS, buyOrUse, lookOf } from "../activity/src/casefiles/shop.js";
import { deskSvg } from "../activity/src/casefiles/scene.js";
import { casebookHtml, cardHtml, casefilesCodex } from "../activity/src/casefiles/room.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("40 real cases, well formed, across 3 levels and 7 method classes", () => {
  assert.equal(CASES.length, 40); assert.equal(new Set(CASES.map((c) => c.id)).size, 40);
  assert.equal(new Set(LEVELS.flatMap((L) => L.pool)).size, 40);
  for (const c of CASES) {
    assert.ok(method(c.method), c.id + " method"); assert.ok(c.year >= 1700 && c.year <= 2000, c.id + " year");
    const ev = Object.keys(c.ev); assert.ok(ev.length >= 2, c.id + " evidence"); ev.forEach((k) => assert.ok(TOOL_KEYS.includes(k), c.id + " tool " + k));
    assert.ok(c.scene.length > 30 && c.fact.length > 30 && c.by && c.who && c.emoji, c.id);
  }
  for (const [k] of CLASSES) assert.ok(CASES.some((c) => method(c.method).cls === k), "class " + k + " has a case");
  for (const m of METHODS) assert.ok(CLASSES.some(([k]) => k === m.cls) && m.how.length > 20, m.id);
  // documented anchors
  assert.equal(caseOf("fox").year, 1848); assert.equal(caseOf("hope").method, "plateswap"); assert.equal(caseOf("palladino").year, 1895);
  assert.match(caseOf("margery").ev.record, /\$2,500/); assert.match(caseOf("cottingley").ev.record, /1983/); assert.equal(Object.keys(TOOLS).length, 6);
});

test("candles: tools and wrong answers burn one; score is candles left + 1 times the multiplier", () => {
  const p = {}, L = LEVELS[1], run = start(L, "margery");
  assert.equal(run.options.length, OPTIONS); assert.ok(run.options.includes("reach")); assert.equal(new Set(run.options).size, OPTIONS);
  assert.ok(useTool(run, "control")); assert.ok(!useTool(run, "control"), "a tool runs once"); assert.ok(useful("margery", "control")); assert.ok(!useful("margery", "magician"));
  assert.match(findingOf(caseOf("margery"), "magician"), /Nothing useful/);
  assert.equal(accuse(run, run.options.find((x) => x !== "reach")), "wrong"); assert.equal(accuse(run, "reach"), "right");
  assert.equal(run.candles, CANDLES - 2); assert.equal(scoreOf(run), Math.round((CANDLES - 1) * 1.5)); assert.ok(!perfect(run));
  const r = settle(p, run); assert.ok(r.first && r.essence >= 5); assert.equal(r.learned, "reach"); assert.deepEqual(learnedMethods(p), ["reach"]);
  const r2 = settle(p, start(L, "margery")); assert.equal(r2.learned, null);
  const out = start(LEVELS[0], "fox"); for (const id of out.options.filter((x) => x !== "toes")) { if (accuse(out, id) === "out") break; } assert.ok(out.done && !out.won);
  const keep = start(LEVELS[0], "table"); for (const k of TOOL_KEYS) useTool(keep, k); assert.equal(keep.candles, 1, "the last candle is kept for naming");
});

test("next, options, daily", () => {
  const p = {}; room(p).solved = LEVELS[0].pool.slice(0, -1); assert.equal(nextOf(p, LEVELS[0]), LEVELS[0].pool.at(-1), "unsolved cases come first");
  assert.ok(optionsFor("fox").includes("toes"));
  assert.deepEqual(dailyOf("2026-12-02"), dailyOf("2026-12-02")); assert.ok(dailyOf("2026-12-02").L.pool.includes(dailyOf("2026-12-02").id));
});

test("desk drawings, casebook, card, shelf, trophy and banter", () => {
  for (const [k] of SLOTS) assert.ok(SHOP.some((s) => s.slot === k && s.price === 0));
  const p = { essence: 200 }; assert.equal(buyOrUse(p, "cf-spr"), "bought"); assert.equal(lookOf(p).folder, "cf-spr"); assert.equal(buyOrUse({ essence: 0 }, "cf-safe"), "poor");
  for (const t of [null, ...TOOL_KEYS]) assert.match(deskSvg(caseOf("duncan"), { look: lookOf(p), tool: t, candles: 3 }), /^<svg/);
  assert.match(deskSvg(caseOf("fox"), { solved: true }), /EXPOSED/); assert.match(deskSvg(null), /^<svg/);
  room(p).solved.push("fox"); room(p).methods.push("toes");
  assert.match(casebookHtml(p, esc), /1 \/ 40/); assert.match(cardHtml(caseOf("fox"), esc), /Cracked joints/); assert.match(casefilesCodex(p, esc), /Cracked joints/);
  assert.ok(TROPHIES.some((t) => t.id === "casefiles")); assert.ok(BANTER.casefiles);
});
