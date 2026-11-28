// Bombe Room (activity/src/bombe): a real Enigma I, crib placement and a real bombe search.
import test from "node:test";
import assert from "node:assert/strict";
import { MESSAGES, LEVELS, HOURS, ORDERS } from "../activity/src/bombe/data.js";
import { enigma, start, slide, place, run, read, plain, clashes, search, settle, perfect, maxScore, dailyOf, orderKey } from "../activity/src/bombe/logic.js";
import { SHOP, SLOTS, buyOrUse, lookOf, DEFAULT_LOOK } from "../activity/src/bombe/shop.js";
import { hutHtml, stripHtml } from "../activity/src/bombe/scene.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { ROOM_BOOKS } from "../activity/src/library.js";

test("a true Enigma I: known test vector, self-inverse, never a letter to itself", () => {
  assert.equal(enigma("AAAAA", ["I", "II", "III"], "AAA"), "BDZGO");
  const c = enigma("WETTERVORHERSAGE", ["III", "I", "II"], "QEV"); assert.equal(enigma(c, ["III", "I", "II"], "QEV"), "WETTERVORHERSAGE");
  for (const m of MESSAGES) { const x = enigma(m.text, ["II", "III", "I"], "KDV"); for (let i = 0; i < x.length; i++) assert.notEqual(x[i], m.text[i]); assert.ok(m.text.includes(m.crib), m.id); assert.ok(m.fact.length > 50); }
});

test("crib window has one clash-free place; the bombe stops only on the right order", () => {
  const g = start(LEVELS[2], { seed: 9 });
  assert.ok(g.hi - g.lo >= 3); assert.equal(clashes(g.cipher, g.crib, g.at).length, 0);
  for (let o = g.lo; o <= g.hi; o++) if (o !== g.at) assert.ok(clashes(g.cipher, g.crib, o).length > 0, "other places clash");
  assert.equal(g.orders.length, 6); assert.notEqual(g.slide, g.at);
  assert.equal(place(g), "wrong"); assert.equal(g.hours, HOURS - 1);
  while (g.slide !== g.at) slide(g, g.slide < g.at ? 1 : -1); assert.equal(place(g), "right");
  assert.ok(search(g.order.split("-"), g.cipher, g.crib, g.at).includes(g.key));
  const wrong = g.orders.find((o) => o !== g.order); assert.equal(run(g, wrong).result, "nostop");
  assert.equal(run(g, g.order).result, "stop"); assert.equal(g.stop, g.key);
  assert.equal(plain(g), MESSAGES.find((m) => m.id === g.msg).text);
  const bad = g.meanings.find((m) => m !== g.msg); assert.equal(read(g, bad), "wrong"); assert.equal(read(g, g.msg), "right");
  assert.ok(g.won && !perfect(g)); assert.equal(g.score, Math.round(g.hours * 3 * 2));
});

test("levels, a perfect run, settling, daily", () => {
  const g = start(LEVELS[0], { seed: 4 }); assert.equal(g.orders.length, 1);
  g.slide = g.at; place(g); run(g, g.order); read(g, g.msg); assert.ok(perfect(g)); assert.equal(g.score, maxScore(LEVELS[0]));
  const p = {}, r = settle(p, g); assert.ok(r.newMsg); assert.equal(r.essence, r.xp + 10); assert.ok(!settle(p, g).newMsg);
  assert.equal(start(LEVELS[1], { seed: 3 }).orders.length, 2);
  const d = dailyOf("2026-11-28"); assert.ok(LEVELS.includes(d.L)); assert.equal(start(d.L, { seed: d.seed }).cipher, start(d.L, { seed: d.seed }).cipher);
  assert.equal(ORDERS.length, 6); assert.equal(orderKey(ORDERS[0]), "I-II-III");
});

test("drawing, shop and wiring", () => {
  assert.match(hutHtml({ look: DEFAULT_LOOK, spin: true }), /bo-drum spin/);
  assert.match(stripHtml("ABCDEF", "XBZ", 0), /clash/);
  for (const [k] of SLOTS) assert.equal(SHOP.filter((s) => s.slot === k && s.price === 0).length, 1);
  for (const s of SHOP) assert.ok(s.id.startsWith("bo-") && s.note.length > 40, s.id);
  const p = { essence: 70 }; assert.equal(buyOrUse(p, "bo-usbombe"), "poor"); assert.equal(buyOrUse(p, "bo-m4"), "bought"); assert.equal(lookOf(p).machine, "bo-m4");
  assert.ok(TROPHIES.some((t) => t.id === "bombe")); assert.ok(BANTER.bombe); assert.ok(ROOM_BOOKS.bombe);
});
