// Every Science is Magic card has an explainer (the science behind its fact, and why it fits), with no advice.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DECK } from "../src/modules/magicdeck/data.js";
import { EXPLAIN } from "../src/modules/magicdeck/explain.js";
import { run } from "../src/modules/magicdeck/index.js";

test("all 44 cards have an explainer and nothing extra", () => {
  assert.equal(DECK.length, 44);
  for (const c of DECK) { const x = EXPLAIN[c.n]; assert.ok(x, c.n); assert.ok(x.sci.length > 120 && x.link.length > 40, c.n); }
  assert.deepEqual(Object.keys(EXPLAIN).sort(), DECK.map((c) => c.n).sort());
});

test("explainers explain, they don't advise", () => {
  for (const [n, x] of Object.entries(EXPLAIN)) assert.ok(!/\b(you should|you must|try to|make sure|don't|do not forget)\b/i.test(x.sci + " " + x.link), n);
});

test("/magicdeck readings carry a Card explainers embed after the data embed", async () => {
  const r = await run({ spread: "three" });
  const i = r.embeds.findIndex((e) => e.title === "🔬 Card explainers");
  assert.ok(i >= 2, "after the reading and the data embeds"); assert.equal(r.embeds[i].fields.length, 3);
  assert.ok(r.reading.cards.every((c) => c.explain && c.explain.sci));
});
