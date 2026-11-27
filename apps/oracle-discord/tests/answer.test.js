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
  assert.match(p[0], /^Seen twice/); assert.equal(p.exams, 1); assert.match(p[1], /^The data first\. Dealt/);
  assert.ok(p.some((x) => /^What may be concluded/.test(x))); assert.ok(!p.some((x) => /Dup\./.test(x)));
});
test("Go deeper examines the member's own data against the reading, one at a time, without naming the Codex", async () => {
  const { fresh, record, codexNotes } = await import("../activity/src/game.js");
  const { themeOf } = await import("../activity/src/codexthemes.js");
  const p = fresh(), r = (names) => ({ embeds: [{}], reading: { cards: names.map((name) => ({ name })) } });
  assert.deepEqual(codexNotes(p, "tarot", r(["The Sun"]), themeOf), [], "no personal data, nothing to examine");
  for (let i = 0; i < 3; i++) record(p, "tarot", r(["The Sun", "The Moon"]));
  record(p, "chinesezodiac", { embeds: [{}], headline: "Metal Horse · Yang" });
  record(p, "celtic", { embeds: [{}], reading: { tree: "Hawthorn" } });
  const n = codexNotes(p, "tarot", r(["The Sun", "The Star"]), themeOf);
  assert.ok(n.length >= 4 && n.length <= 6);
  for (const x of n) { assert.match(x, /^Because /); assert.match(x, /you may consider/); assert.doesNotMatch(x, /codex/i); assert.doesNotMatch(x, /\d+ of 78|%|chance/); }
  assert.match(n[0], /^Because The Sun has come to you 3 times before \(joy, success, vitality\), you may consider that joy is still an open question/);
  assert.ok(n.some((x) => /^Because your Chinese zodiac is Horse \([^)]+\), and this reading turns on The (Sun|Star) \(/.test(x)));
  assert.ok(n.some((x) => /^Because your Celtic tree is Hawthorn/.test(x)));
  assert.ok(n.some((x) => /^Because The Moon is what your readings have turned to most/.test(x)));
  assert.ok(n.some((x) => /^Because The Star has never come up for you before/.test(x)));
  const b = codexNotes(p, "egyptian", { embeds: [{}], reading: { god: "Anubis" } }, themeOf);
  assert.match(b[0], /^Because your Chinese zodiac is Horse \([^)]+\), and this chart gives Anubis \(/);
  const d = deeperPages({ embeds: [{ description: "A long road.", fields: [] }] }, "", n);
  assert.equal(d.exams, n.length); assert.equal(d[0], n[0]);
});
test("every Codex system with meanings has keywords for its entries", async () => {
  const { themeOf } = await import("../activity/src/codexthemes.js");
  for (const [k, name] of [["tarot", "Ten of Cups"], ["lenormand", "Key"], ["magicdeck", "The Eclipse"], ["runes", "Ehwaz"], ["iching", "Hexagram 63"], ["ifa", "Ìrosùn Òtúrá"], ["numerology", "Life Path 7"],
    ["astrology", "Sun in Aries"], ["humandesign", "Projector"], ["mayan", "Lamat"], ["egyptian", "Thoth"], ["celtic", "Alder"], ["chinesezodiac", "Horse"]]) assert.ok(themeOf(k, name).length >= 1, k);
  assert.deepEqual(themeOf("oraclebones", "Yǐ Sì"), []);
});
