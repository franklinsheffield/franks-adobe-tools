import test from "node:test";
import assert from "node:assert";
import { SYMBOLS, RECIPES, DISCOVERIES, REAGENTS, OPS, ELEMENTS } from "../activity/src/alchemy/lab.js";
import { GLYPH } from "../activity/src/alchemy/glyphs.js";
import { NOTEBOOK } from "../activity/src/alchemy/guide.js";
import { SHOP, DEFAULT_LOOK, buyOrUse, lookOf, owns } from "../activity/src/alchemy/shop.js";
import { sceneSvg } from "../activity/src/alchemy/scene.js";
import { LEVELS, ALL, TITLES, FLAMES, start, options, moreClue, readSymbol, judge, transmute, hintOf, nameIt, settle, scoreOf, solvedCount, room, opsFor } from "../activity/src/alchemy/logic.js";
import { activity } from "../activity/src/game.js";

// ---- balanced equations: count atoms on each side ----
const SUB = { "₀": 0, "₁": 1, "₂": 2, "₃": 3, "₄": 4, "₅": 5, "₆": 6, "₇": 7, "₈": 8, "₉": 9 };
const digits = (s) => s.replace(/[₀-₉]/g, (c) => SUB[c]);
function atoms(formula) {
  const f = digits(formula.trim()), m = f.match(/^(\d*)(.*)$/), k = +(m[1] || 1), stack = [{}];
  const re = /([A-Z][a-z]?)(\d*)|(\()|\)(\d*)/g; let t;
  const s = m[2]; let i = 0;
  while (i < s.length) {
    re.lastIndex = i; t = re.exec(s); assert.equal(t.index, i, "bad formula " + formula);
    if (t[1]) { const top = stack.at(-1); top[t[1]] = (top[t[1]] || 0) + +(t[2] || 1); }
    else if (t[0] === "(") stack.push({});
    else { const g = stack.pop(), n = +(t[4] || 1), top = stack.at(-1); for (const [e, c] of Object.entries(g)) top[e] = (top[e] || 0) + c * n; }
    i = re.lastIndex;
  }
  return Object.fromEntries(Object.entries(stack[0]).map(([e, c]) => [e, c * k]));
}
const side = (s) => s.split(" + ").map(atoms).reduce((a, b) => { for (const [e, c] of Object.entries(b)) a[e] = (a[e] || 0) + c; return a; }, {});

test("every equation in the Lab balances", () => {
  let n = 0;
  for (const x of [...RECIPES, ...DISCOVERIES]) {
    if (x.noBalance) continue;
    const [l, r] = x.eq.split(" → "); assert.ok(r, x.id);
    assert.deepStrictEqual(side(l), side(r), `${x.id}: ${x.eq}`); n++;
  }
  assert.ok(n >= 13);
});

test("content is complete and consistent", () => {
  assert.equal(new Set(SYMBOLS.map((s) => s.id)).size, SYMBOLS.length);
  for (const s of SYMBOLS) {
    assert.ok(GLYPH[s.glyph], s.id); assert.equal(s.clues.length, 2, s.id);
    for (const k of ["name", "modern", "fact"]) assert.ok(s[k], s.id + " " + k);
    const nm = s.name.toLowerCase().split(" ")[0]; for (const c of s.clues) assert.ok(!c.toLowerCase().includes(nm), `${s.id} clue gives it away`);
  }
  for (const x of [...RECIPES, ...DISCOVERIES]) {
    assert.ok(OPS[x.op], x.id); assert.equal(new Set(x.shelf).size, 6, x.id + " shelf of 6");
    for (const i of x.shelf) assert.ok(REAGENTS[i], `${x.id} reagent ${i}`);
    for (const i of x.make) assert.ok(x.shelf.includes(i), `${x.id} needs ${i} on the shelf`);
    for (const k of ["goal", "hint", "product", "story", "science", "eq", "colour"]) assert.ok(x[k], x.id + " " + k);
    for (const e of x.el) assert.ok(ELEMENTS[e], `${x.id} element ${e}`);
  }
  for (const s of SYMBOLS) for (const e of s.el) assert.ok(ELEMENTS[e], `${s.id} element ${e}`);
  for (const d of DISCOVERIES) { const a = d.answer.toLowerCase().split(/[ :]/)[0];
    for (const k of ["goal", "hint", "product", "story"]) assert.ok(!d[k].toLowerCase().includes(a), `${d.id} ${k} gives the answer away`);
    assert.equal(d.options.length, 4); assert.ok(d.options.includes(d.answer), d.id); assert.ok(d.who && d.when); }
  for (const x of RECIPES) assert.notEqual(x.op, "electrolyse", "no electricity in old recipes");
  assert.equal(DISCOVERIES.find((d) => d.id === "potassium").op, "electrolyse");
  assert.ok(!opsFor(LEVELS[1]).includes("electrolyse") && opsFor(LEVELS[2]).includes("electrolyse"));
  // Real periodic-table positions and atomic numbers for a few checks
  assert.deepStrictEqual(ELEMENTS.Au, [6, 11, 79]); assert.deepStrictEqual(ELEMENTS.Fe, [4, 8, 26]); assert.deepStrictEqual(ELEMENTS.P, [3, 15, 15]);
  assert.equal(TITLES.at(-1).at, ALL.length);
  assert.ok(NOTEBOOK.length >= 6 && NOTEBOOK.every((s) => s.h && s.p.length));
});

test("level 1: four options with the answer once; clues and wrong answers cost flames", () => {
  for (const s of SYMBOLS) { const o = options(s); assert.equal(o.length, 4); assert.equal(new Set(o.map((x) => x.id)).size, 4); assert.ok(o.some((x) => x.id === s.id)); }
  const L = LEVELS[0], x = SYMBOLS[0], run = start(x, L);
  assert.ok(moreClue(run, x)); assert.equal(run.flames, FLAMES - 1); assert.ok(!moreClue(run, x));
  assert.equal(readSymbol(run, x, "silver"), "wrong"); assert.equal(readSymbol(run, x, "silver"), null, "same wrong twice is ignored");
  assert.equal(readSymbol(run, x, "gold"), "right"); assert.equal(scoreOf(run), 2 * 5);
  const lose = start(x, L); for (const id of ["silver", "lead", "tin"]) readSymbol(lose, x, id);
  assert.equal(readSymbol(lose, x, "iron"), "out"); assert.equal(lose.won, false);
});

test("bench: judge gives counts, hints reveal in order, level 3 names the find", () => {
  const L2 = LEVELS[1], x = RECIPES.find((r) => r.id === "aquafortis");
  assert.deepStrictEqual(judge(x, ["saltpetre", "salt"], "heat"), { ok: false, right: 1, extra: 1, missing: 1, opRight: false });
  const run = start(x, L2);
  assert.equal(transmute(run, x, ["saltpetre", "salt"], "distil"), "wrong"); assert.equal(run.flames, 3);
  assert.equal(hintOf(run, x), "line"); assert.equal(hintOf(run, x), "saltpetre"); assert.equal(hintOf(run, x), null, "keeps one flame");
  assert.equal(transmute(run, x, ["vitriol", "saltpetre"], "distil"), "right"); assert.ok(run.won); assert.equal(scoreOf(run), Math.round(1 * 5 * 1.5));
  const L3 = LEVELS[2], d = DISCOVERIES.find((r) => r.id === "oxygen"), r3 = start(d, L3);
  assert.equal(transmute(r3, d, ["mercurycalx"], "heat"), "right"); assert.equal(r3.stage, "name"); assert.ok(!r3.done);
  assert.equal(nameIt(r3, d, "Oxygen"), true); assert.equal(scoreOf(r3), 4 * 5 * 2 + 10 * 2);
});

test("settle: first success pays, replays only improvements, elements light up, plays count as activity", () => {
  const p = { readings: 0, xp: 0, essence: 0 }, L = LEVELS[0], x = SYMBOLS.find((s) => s.id === "salt");
  const a = start(x, L); readSymbol(a, x, "salt"); const s1 = settle(p, a, x);
  assert.ok(s1.first); assert.equal(s1.xp, 20); assert.deepStrictEqual(s1.newEls, ["Na", "Cl"]);
  const b = start(x, L); readSymbol(b, x, "gold"); readSymbol(b, x, "salt"); const s2 = settle(p, b, x);
  assert.equal(s2.xp, 0); assert.deepStrictEqual(s2.newEls, []);
  const c = start(x, L); for (const id of options(x).map((o) => o.id).filter((i) => i !== "salt")) readSymbol(c, x, id);
  assert.equal(settle(p, c, x).xp, c.won ? 0 : 3);
  assert.equal(solvedCount(p), 1); assert.equal(room(p).plays, 3); assert.equal(activity(p), 3);
});

test("apothecary: free items owned, buying spends Essence and puts it on the bench", () => {
  const p = { essence: 70, owned: [] };
  assert.ok(owns(p, "al-alembic")); assert.ok(!owns(p, "al-pelican"));
  assert.equal(buyOrUse(p, "al-pelican"), "poor");
  assert.equal(buyOrUse(p, "al-retort"), "bought"); assert.equal(p.essence, 0); assert.equal(lookOf(p).vessel, "al-retort"); assert.equal(p.alchemy, "al-retort");
  assert.equal(buyOrUse(p, "al-alembic"), "used"); assert.equal(lookOf(p).vessel, "al-alembic");
  p.alchemy = "al-retort"; assert.equal(lookOf(p).vessel, "al-retort", "put on from the Chamber store");
  for (const it of SHOP) { const svg = sceneSvg({ look: { ...DEFAULT_LOOK, [it.slot]: it.id }, flames: 2, shelf: RECIPES[0].shelf, chips: ["mercury", "saltpetre"], glyph: "gold", label: "Test" });
    assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>"), it.id); }
});

test("every recipe and discovery has its own reaction animation", async () => {
  const { reactionFx } = await import("../activity/src/alchemy/scene.js");
  for (const x of [...RECIPES, ...DISCOVERIES]) {
    assert.ok(x.fx && x.fxc, x.id);
    const r = reactionFx({ from: x.make.map((i) => REAGENTS[i].c), to: x.colour, fx: x.fx, fxc: x.fxc });
    assert.ok(r.after.length > 20, `${x.id} has no ${x.fx} effect`); assert.ok(r.anim.includes(x.colour), x.id);
  }
});

test("hazards: real dangerous mixes explode and end the experiment; no correct recipe is a hazard; each is reachable", async () => {
  const { HAZARDS } = await import("../activity/src/alchemy/lab.js");
  const { hazardOf } = await import("../activity/src/alchemy/logic.js");
  for (const x of [...RECIPES, ...DISCOVERIES]) assert.equal(hazardOf(x.make, x.op), null, `${x.id}'s own recipe explodes`);
  for (const h of HAZARDS) {
    assert.ok(h.what && h.lesson && h.name, h.id);
    const reach = [...RECIPES, ...DISCOVERIES].some((x) => { const ok = [...h.all, ...(h.any ? [h.any.find((i) => x.shelf.includes(i)) || h.any[0]] : [])];
      return ok.every((i) => x.shelf.includes(i)) && ok.length <= 3 && hazardOf(ok, (h.ops || ["dissolve"])[0])?.id === h.id; });
    assert.ok(reach, `${h.id} can't happen on any shelf`);
  }
  assert.equal(hazardOf(["vitriol", "water"], "dissolve").id, "acidwater");
  assert.equal(hazardOf(["iron", "vitriol"], "dissolve"), null); assert.equal(hazardOf(["iron", "vitriol"], "heat").id, "hydrogenfire");
  assert.equal(hazardOf(["mercury", "aquafortis", "wine"], "dissolve").id, "fulminate");
  const L = LEVELS[1], x = RECIPES.find((r) => r.id === "aquafortis"), run = start(x, L), p = { xp: 0, essence: 0 };
  assert.equal(transmute(run, x, ["vitriol", "water"], "distil"), "boom"); assert.ok(run.done && !run.won && run.flames === 0);
  assert.equal(transmute(run, x, ["saltpetre", "vitriol"], "distil"), null, "game over after the explosion");
  const s = settle(p, run, x); assert.equal(s.xp, 0); assert.ok(s.boom); assert.deepStrictEqual(room(p).accidents, ["acidwater"]); assert.equal(room(p).booms, 1);
});
