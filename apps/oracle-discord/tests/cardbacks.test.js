// One set of card backs for every deck (activity/src/cardbacks.js) and the store's departments (store.js).
import test from "node:test";
import assert from "node:assert/strict";
import { CARD_BACK, CARD_BACK_ITEMS, OLD_BACKS, migrateBacks, cardBackSvg, equippedBack } from "../activity/src/cardbacks.js";
import { STORE, KINDS, SHOP_TALK, DEPTS, departments, deptOf, goodsOf, kindLabel, ensureFree, registerShelf } from "../activity/src/store.js";
import { CARD_BACKS } from "../activity/src/table.js";
import { backSvg } from "../activity/src/duel/scene.js";

test("every card back draws, animates and is sold once", () => {
  assert.ok(Object.keys(CARD_BACK).length >= 10);
  for (const [id, b] of Object.entries(CARD_BACK)) {
    const svg = cardBackSvg(id); assert.match(svg, /^<svg class="cbk" viewBox="0 0 60 84"/); assert.match(svg, /cbk-(twk|spin|pulse|glow|dash|blink|drift|ring|sweep)/, id + " moves");
    assert.ok(b.name && b.note && b.price > 0); assert.equal(STORE.filter((s) => s.id === id && s.kind === "cardback").length, 1);
  }
  assert.equal(CARD_BACK_ITEMS[0].id, "cb-deck"); assert.equal(CARD_BACK_ITEMS[0].price, 0); assert.equal(cardBackSvg("cb-deck"), "");
  const a = cardBackSvg("cb-nebula"), b = cardBackSvg("cb-nebula"); assert.notEqual(a.match(/id="(\w+)"/)[1], b.match(/id="(\w+)"/)[1], "gradient ids are unique per copy");
});

test("old Memory, Rummy and table backs migrate onto the one set", () => {
  for (const to of Object.values(OLD_BACKS)) assert.ok(to === "cb-deck" || CARD_BACK[to], to);
  const p = migrateBacks({ owned: ["gm-lapis", "cb-astrolabe", "cb-pulsar", "crimson"], cardback: "gm-starlit", rummyback: "cb-astrolabe" });
  assert.deepEqual(p.owned.sort(), ["cb-lapis", "cb-pulsar", "cb-zodiac", "crimson"].sort()); assert.equal(p.cardback, "cb-zodiac"); assert.ok(!("rummyback" in p));
  assert.equal(migrateBacks({ owned: [], cardback: "gm-seal", rummyback: "cb-pulsar" }).cardback, "cb-seal");
  assert.equal(ensureFree({ owned: [] }).cardback, "cb-deck"); assert.equal(equippedBack({ cardback: "cb-deck" }), ""); assert.equal(equippedBack({ cardback: "cb-seal" }), "cb-seal");
});

test("the chosen back dresses the table decks and Element Duel", () => {
  assert.match(backSvg("cb-zodiac", 10, 20, 30, 40), /<svg class="cbk"[^>]*x="10" y="20" width="30" height="40"/);
  assert.ok(!backSvg("db-atom", 0, 0, 30, 40).includes("cbk")); assert.deepEqual(CARD_BACKS, Object.keys(CARD_BACK));
});

test("store departments: Cards and Ghosts exist and every shelf has a home", () => {
  const d = departments(); assert.deepEqual(d.map((x) => x.id), DEPTS.map((x) => x.id)); assert.ok(d.some((x) => x.id === "cards") && d.some((x) => x.id === "ghosts"));
  assert.deepEqual(d.find((x) => x.id === "cards").kinds, ["cardback"]);
  for (const [k] of KINDS) assert.equal(d.filter((x) => x.kinds.includes(k)).length, 1, k + " is in exactly one department");
  const haunted = goodsOf("haunted"); assert.ok(haunted.length >= 4); for (const it of haunted) assert.ok(it.ghost && it.kind !== "haunted");
  assert.equal(deptOf("haunted").id, "ghosts"); assert.equal(deptOf("cardback").id, "cards"); assert.match(kindLabel("haunted"), /Haunted/);
  for (const act of ["open", "tryon", "buy"]) assert.ok(SHOP_TALK.haunted[act].length >= 2);
  const before = STORE.length; registerShelf({ kind: "cardback", items: [{ id: "x", price: 1 }] }); registerShelf({ kind: "rummyback", items: [{ id: "y", price: 1 }] }); assert.equal(STORE.length, before, "rooms can't add a second set of card backs");
  registerShelf({ kind: "testroom", label: "🧪 Test", items: [{ id: "tr-1", name: "t", price: 5 }] }); assert.equal(deptOf("testroom").id, "rooms");
});
