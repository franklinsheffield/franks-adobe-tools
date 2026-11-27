import { test } from "node:test";
import assert from "node:assert/strict";
import { GENERAL, BY_SYSTEM } from "../activity/src/jokes.js";
import { tone, answer, quip, deeperPages, coreLine } from "../activity/src/answer.js";

const good = "Supreme success. Growth and good fortune. Begin now; the way is open.";
const bad = "Danger and obstruction. Wait. Misfortune if you advance; patience and retreat.";

test("tone reads go and wait", () => {
  assert.ok(tone(good) > 0); assert.ok(tone(bad) < 0);
});
const A = { data: ["Dealt: The Sun"], patterns: ["One Major card."], conclusions: ["The matter may be larger than it looks."], questions: ["What would change the picture?"], method: ["Drawn from 78."] };
test("answers describe the lean and possible meanings, never a verdict or advice", () => {
  assert.match(answer("Should I launch?", good, "Frank", A).line, /evidence, not verdicts.*\*\*leans (gently )?toward (openness|movement)/);
  assert.match(answer("Should I launch?", bad, "Frank", A).line, /\*\*leans (gently )?toward caution/);
  for (const q of ["Should I launch?", "When will it happen?", "Should I stay or go?", "What do I need?", ""]) for (const txt of [good, bad]) {
    const l = answer(q, txt, "Frank", A).line;
    assert.doesNotMatch(l, /My answer|\*\*(Yes|No|Not yet)\b/);
    assert.match(l, /may be larger/); assert.match(l, /leaves this open: What would change/);
  }
  assert.match(answer("When will it happen?", good).line, /^When\? No reading keeps a calendar/);
  assert.match(answer("Should I stay or go?", good).line, /stays with you.*\*\*Stay\*\*/);
  assert.match(answer("Should I stay or go?", bad).line, /\*\*Go\*\*/);
  assert.match(answer("", good, "Frank").line, /Frank/);
});
test("core line is the reading's first sentence, not an instruction picked out of it", () => {
  assert.equal(coreLine("The image: wind over sky. Keep moving and refine."), "Wind over sky.");
});
test("no joke repeats until a member has heard them all", () => {
  const heard = [], n = GENERAL.length + BY_SYSTEM.iching.length;
  assert.ok(GENERAL.length >= 100);
  const seen = new Set(Array.from({ length: n }, () => quip("iching", "Frank", heard)));
  assert.equal(seen.size, n);
  assert.ok(![...seen].some((t) => t.includes("{name}")));
  quip("iching", "Frank", heard); assert.ok(heard.length <= n);
});
test("deeper pages cover every field", () => {
  const r = { embeds: [{ description: "Question: x? A long road.", fields: [{ name: "The situation", value: "One. Two." }, { name: "The image", value: "Three." }] }] };
  const p = deeperPages(r, "x?");
  assert.equal(p.length, 3); assert.match(p[1], /The situation: One\. Two\./);
});
test("deeper pages lead with Codex history and the analysis, and skip the analysis embed", () => {
  const r = { analysis: A, embeds: [{ description: "A long road.", fields: [] }, { title: "🔬 Reading the data", fields: [{ name: "x", value: "Dup." }] }] };
  const p = deeperPages(r, "", ["Seen twice before."]);
  assert.match(p[0], /^From your Codex\. Seen twice/); assert.match(p[1], /^The data first\. Dealt/);
  assert.ok(p.some((x) => /^What may be concluded/.test(x))); assert.ok(!p.some((x) => /Dup\./.test(x)));
});
test("the Codex adds history: counts against chance, new entries, and other birth systems", async () => {
  const { fresh, record, codexNotes } = await import("../activity/src/game.js");
  const p = fresh(), r = (names) => ({ embeds: [{}], reading: { cards: names.map((name) => ({ name })) } });
  assert.match(codexNotes(p, "tarot", r(["The Sun"]))[0], /first card reading in your Codex/);
  for (let i = 0; i < 3; i++) record(p, "tarot", r(["The Sun", "The Moon"]));
  assert.deepEqual(p.seen.tarot, { "The Sun": 3, "The Moon": 3 });
  const n = codexNotes(p, "tarot", r(["The Sun", "The Star"])).join(" ");
  assert.match(n, /3 earlier readings.*2 of 78 cards/); assert.match(n, /The Sun has come up 3 times before in 6 recorded draws.*more often than chance/);
  assert.match(n, /The Star is new to your Codex/);
  assert.doesNotMatch(n, /\b(you should|try to|make sure)\b/i);
  record(p, "celtic", { embeds: [{}], reading: { tree: "Hawthorn" } });
  const b = codexNotes(p, "egyptian", { embeds: [{}], reading: { god: "Anubis" } }).join(" ");
  assert.match(b, /first Egyptian entry/); assert.match(b, /also holds Hawthorn \(Celtic tree\)/);
});
