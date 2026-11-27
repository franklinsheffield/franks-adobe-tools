import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "../src/registry.js";
import { insight, odds, binom, hyper, choose, list } from "../src/insight.js";

const B = { date: "1991-05-21", time: "14:30", place: "Phoenix, USA", name: "Ada Byron Lovelace" };
const ctx = { user: "Tester", geocoded: { lat: 33.45, lon: -112.07, name: "Phoenix, USA" }, now: new Date("2026-11-27T12:00:00Z") };
const CAST = ["iching", "runes", "oraclebones", "ifa", "tarot", "lenormand", "magicdeck"];
const OPTS = { astrology: { subcommand: "chart", ...B }, tarot: { question: "Should I launch?", spread: "celtic" }, lenormand: { question: "x", spread: "square" }, magicdeck: { question: "x", spread: "five" }, runes: { question: "x", spread: "five" } };
const SYSTEMS = MODULES.filter((m) => CAST.includes(m) || ["humandesign", "astrology", "numerology", "chinesezodiac", "mayan", "egyptian", "celtic"].includes(m));
const run = async (m, o) => (await import(`../src/modules/${m}/index.js`)).run(o || OPTS[m] || (CAST.includes(m) ? { question: "Should I launch?" } : B), ctx);

test("odds helpers", () => {
  assert.equal(choose(78, 2), 3003); assert.ok(Math.abs(binom(6, 3, 0.5) - 0.3125) < 1e-9);
  let s = 0; for (let k = 0; k <= 3; k++) s += hyper(78, 22, 3, k); assert.ok(Math.abs(s - 1) < 1e-9);
  assert.equal(odds(1 / 12), "about 1 in 12 (8.3%)"); assert.equal(odds(0), "not possible"); assert.equal(list(["a", "b", "c"]), "a, b and c");
  assert.equal(insight({ data: [["A", "b"]], patterns: ["", "p"] }).analysis.patterns.length, 1);
});

test("every reading system leads with a data-first analysis: facts, patterns, possible meanings, open questions, method", async () => {
  assert.equal(SYSTEMS.length, 14);
  for (const m of SYSTEMS) {
    const r = await run(m), a = r.analysis;
    assert.ok(a, `${m} has analysis`);
    for (const k of ["data", "patterns", "conclusions", "questions", "method"]) assert.ok(a[k].length >= 2, `${m}.${k}`);
    assert.equal(r.embeds[1].title, "🔬 Reading the data", `${m}: analysis sits right after the main embed`);
    for (const e of r.embeds) { assert.ok((e.fields || []).length <= 25, m); for (const f of e.fields || []) assert.ok(f.value.length <= 1024 && f.value.length > 0 && f.name.length <= 256, `${m}: ${f.name}`); }
    assert.ok(a.conclusions.some((c) => /\b(may|tends?|read as|reads?|associated|tradition|possible|cannot be concluded)\b/i.test(c)), `${m}: conclusions are hedged`);
    assert.ok(a.questions.every((q) => q.trim().endsWith("?") || /\?/.test(q)), `${m}: open questions`);
    assert.ok(r.headline, `${m} headline`);
  }
});

test("no reading hands out an experiment or a direct instruction in its analysis", async () => {
  const ADVICE = /\b(you should|you must|you need to|make sure|try to|do this|don't |go with|lean into|start there|clear them first)\b/i;
  for (const m of SYSTEMS) for (let i = 0; i < (CAST.includes(m) ? 4 : 1); i++) {
    const r = await run(m);
    for (const e of r.embeds) for (const f of e.fields || []) assert.doesNotMatch(f.name, /Your experiment|Advice$/, `${m}: ${f.name}`);
    for (const k of ["patterns", "conclusions", "questions", "method"]) for (const s of r.analysis[k]) assert.doesNotMatch(s, ADVICE, `${m}: ${s}`);
  }
});

test("numerology analysis keeps the name and birth-date parts private unless asked to show them", async () => {
  const hidden = JSON.stringify((await run("numerology")).analysis), shown = JSON.stringify((await run("numerology", { ...B, show_name: true })).analysis);
  assert.doesNotMatch(hidden, /LOVELACE|BYRON|month 5/); assert.match(shown, /LOVELACE 30→3/); assert.match(shown, /month 5 \+ day 3 \+ year 2 = 10/);
});

test("the sky-now reading carries the analysis too", async () => {
  const r = await run("astrology", { subcommand: "now" });
  assert.equal(r.embeds[1].title, "🔬 Reading the data"); assert.match(r.analysis.conclusions[0], /applies to everyone/);
});
