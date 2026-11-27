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
  assert.match(p[0], /^Compared with your Codex\. Seen twice/); assert.match(p[1], /^The data first\. Dealt/);
  assert.ok(p.some((x) => /^What may be concluded/.test(x))); assert.ok(!p.some((x) => /Dup\./.test(x)));
});
test("the Codex compares a reading with the member's history and says what that may mean, with no tallies", async () => {
  const { fresh, record, codexNotes } = await import("../activity/src/game.js");
  const { themeOf } = await import("../activity/src/codexthemes.js");
  const p = fresh(), r = (names) => ({ embeds: [{}], reading: { cards: names.map((name) => ({ name })) } });
  assert.deepEqual(codexNotes(p, "tarot", r(["The Sun"]), themeOf), [], "no history, nothing to compare");
  for (let i = 0; i < 3; i++) record(p, "tarot", r(["The Sun", "The Moon"]));
  assert.deepEqual(p.seen.tarot, { "The Sun": 3, "The Moon": 3 });
  const n = codexNotes(p, "tarot", r(["The Sun", "The Star"]), themeOf).join(" ");
  assert.match(n, /The Sun is back: it came up 3 times before in your readings, and it is read as joy, success, vitality/);
  assert.match(n, /may point to a theme that is still open for you/);
  assert.match(n, /turned most often to The Moon \(/); assert.match(n, /The Star \([^)]+\) has not appeared for you before/);
  assert.doesNotMatch(n, /\d+ of 78|%|chance alone predicts|recorded draws/, "no Codex statistics");
  assert.doesNotMatch(n, /\b(you should|you must|you need to|try to|make sure)\b/i);
  assert.match(n, /\bmay\b/);
  record(p, "celtic", { embeds: [{}], reading: { tree: "Hawthorn" } });
  const b = codexNotes(p, "egyptian", { embeds: [{}], reading: { god: "Anubis" } }, themeOf).join(" ");
  assert.match(b, /Set beside your other charts: this one gives Anubis \(/); assert.match(b, /Hawthorn \([^)]+\) in the Celtic tree reading/);
  const c = codexNotes(p, "tarot", r(["The Tower"]), themeOf).join(" ");
  assert.match(c, /Your charts describe you through Hawthorn/); assert.match(c, /Nothing here repeats an earlier draw/);
});
test("every Codex system with meanings has keywords for its entries", async () => {
  const { themeOf } = await import("../activity/src/codexthemes.js");
  for (const [k, name] of [["tarot", "Ten of Cups"], ["lenormand", "Key"], ["magicdeck", "The Eclipse"], ["runes", "Ehwaz"], ["iching", "Hexagram 63"], ["ifa", "Ìrosùn Òtúrá"], ["numerology", "Life Path 7"],
    ["astrology", "Sun in Aries"], ["humandesign", "Projector"], ["mayan", "Lamat"], ["egyptian", "Thoth"], ["celtic", "Alder"], ["chinesezodiac", "Horse"]]) assert.ok(themeOf(k, name).length >= 1, k);
  assert.deepEqual(themeOf("oraclebones", "Yǐ Sì"), []);
});
