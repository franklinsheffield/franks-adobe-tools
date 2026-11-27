import { test } from "node:test";
import assert from "node:assert/strict";
import { GEMS, gemOf, gemSvg, gemShop } from "../activity/src/gems.js";

test("table crystals and relics: one free default, unique ids, every one draws", () => {
  assert.equal(GEMS.filter((g) => g.price === 0).length, 1);
  assert.equal(new Set(GEMS.map((g) => g.id)).size, GEMS.length);
  for (const g of GEMS) { const s = gemSvg(g.id); assert.match(s, /gm-float/); assert.ok(!/NaN|undefined/.test(s), g.id); }
  assert.equal(gemOf("nope").id, "gem-quartz");
  for (const id of ["gem-ankh", "gem-skull", "gem-hourglass", "gem-astrolabe"]) assert.ok(GEMS.some((g) => g.id === id), id);
});
test("the shelf sells every crystal and relic with talk lines", () => {
  assert.equal(gemShop.kind, "gem"); assert.equal(gemShop.items.length, GEMS.length);
  for (const k of ["open", "tryon", "buy"]) assert.ok(gemShop.talk[k].length);
});
