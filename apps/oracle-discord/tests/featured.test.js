// The ✨ Featured department (activity/src/featured.js): weekly picks, rare finds, full sets, mystery boxes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { STORE, item, goodsOf } from "../activity/src/store.js";
import { bookShop } from "../activity/src/book.js";
import { registerShelf } from "../activity/src/store.js";
import { weekOf, weekEnds, featured, rareOf, priceNow, buyNow, salePrice, SETS, wornSet, setProgress, BOXES, boxPool, openBox, REFUND } from "../activity/src/featured.js";
registerShelf(bookShop);
const MON = Date.UTC(2026, 10, 23, 1), NEXT = MON + 7 * 864e5;

test("four featured items a week, the same all week, discounted; rare items only in their week", () => {
  const a = featured(MON), b = featured(MON + 5 * 864e5), c = featured(NEXT);
  assert.equal(a.length, 4); assert.deepEqual(a.map((x) => x.id), b.map((x) => x.id)); assert.notDeepEqual(a.map((x) => x.id), c.map((x) => x.id));
  assert.equal(new Set(a.map((x) => x.id)).size, 4); assert.ok(a.every((x) => !x.rare && !x.set && x.price > 0));
  assert.equal(priceNow(a[0].id, MON), salePrice(a[0])); assert.ok(salePrice(a[0]) < a[0].price);
  assert.ok(weekEnds(MON) > MON && weekEnds(MON) - MON <= 7 * 864e5); assert.equal(weekOf(NEXT), weekOf(MON) + 1);
  const rare = STORE.filter((s) => s.rare); assert.ok(rare.length >= 3); assert.ok(goodsOf(rare[0].kind).every((x) => !x.rare), "rare items stay off normal shelves");
  for (let w = 0; w < 6; w++) { const at = MON + w * 7 * 864e5, r = rareOf(at); for (const x of rare) assert.equal(priceNow(x.id, at), r && r.id === x.id ? x.price : null); }
  const p = { essence: 1000, owned: [] }, r = [0, 1, 2, 3, 4, 5].map((w) => MON + w * 7 * 864e5).find((at) => !rareOf(at));
  assert.equal(buyNow(p, rare[0].id, r), false, "not on sale in a week without it");
});

test("each full set is four owned-able pieces, one per kind; wearing all four is the set", () => {
  for (const s of SETS) { for (const id of Object.values(s.kinds)) assert.ok(item(id), id); }
  const s = SETS[0], p = { owned: Object.values(s.kinds), ...s.kinds };
  assert.equal(wornSet(p).id, s.id); assert.deepEqual(setProgress(p, s), { own: 4, of: 4, worn: 4 });
  p.flame = "goldflame"; assert.equal(wornSet(p), null);
});

test("boxes roll by their shown odds; duplicates refund half; no rare, secret or free items inside", () => {
  for (const b of BOXES) assert.equal(Object.values(b.odds).reduce((a, x) => a + x, 0), 100);
  const P = boxPool(); assert.ok(Object.values(P).flat().every((x) => x.price > 0 && !x.rare && !x.secret));
  const p = { essence: 1000, owned: [] }, first = openBox(p, "box-curio", () => 0.01);
  assert.equal(first.tier, "common"); assert.equal(first.dupe, false); assert.equal(p.essence, 910);
  const again = openBox(p, "box-curio", () => 0.01); assert.equal(again.dupe, true); assert.equal(again.refund, Math.round(90 * REFUND)); assert.equal(p.essence, 910 - 90 + 45);
  assert.equal(openBox(p, "box-grand", () => 0.999).tier, "epic"); assert.equal(openBox({ essence: 10 }, "box-curio"), null);
  // over many rolls the share of each tier is close to the odds
  const n = 4000, q = { essence: 1e9, owned: [] }, c = { common: 0, rare: 0, epic: 0 }; for (let i = 0; i < n; i++) c[openBox(q, "box-curio").tier]++;
  assert.ok(Math.abs(c.common / n - 0.75) < 0.04 && Math.abs(c.epic / n - 0.03) < 0.02, JSON.stringify(c));
});
