import { test } from "node:test";
import assert from "node:assert/strict";
import { GENERAL, BY_SYSTEM } from "../activity/src/jokes.js";
import { tone, answer, quip, deeperPages, coreLine } from "../activity/src/answer.js";

const good = "Supreme success. Growth and good fortune. Begin now; the way is open.";
const bad = "Danger and obstruction. Wait. Misfortune if you advance; patience and retreat.";

test("tone reads go and wait", () => {
  assert.ok(tone(good) > 0); assert.ok(tone(bad) < 0);
});
test("yes/no, when, either/or and open questions get direct answers", () => {
  assert.match(answer("Should I launch?", good).line, /^My answer: \*\*.*[Yy]es/);
  assert.match(answer("Should I launch?", bad).line, /^My answer: \*\*(Not|No|Wait|Hold)/);
  assert.match(answer("When will it happen?", good).line, /^When\? /);
  assert.match(answer("Should I stay or go?", good).line, /\*\*Stay\*\*/);
  assert.match(answer("Should I stay or go?", bad).line, /\*\*Go\*\*/);
  assert.match(answer("What do I need?", bad).line, /straight from the glass/);
  assert.match(answer("", good, "Frank").line, /Frank/);
});
test("core line prefers advice", () => {
  assert.equal(coreLine("The image: wind over sky. Keep moving and refine."), "Keep moving and refine.");
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
