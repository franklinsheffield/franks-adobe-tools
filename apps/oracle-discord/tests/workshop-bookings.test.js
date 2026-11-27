// The Workshop (60 tricks from Case Files methods) and Bookings (Tonight's Bill, billing, matinees, /booking):
// steps 2 and 3 of the Séance Parlour's core loop.
import test from "node:test";
import assert from "node:assert/strict";
import { METHODS } from "../activity/src/casefiles/data.js";
import { room as cfRoom } from "../activity/src/casefiles/logic.js";
import { TRICKS, LEVELS, trickOf, hintFor } from "../activity/src/workshop/data.js";
import * as W from "../activity/src/workshop/logic.js";
import * as WS from "../activity/src/workshop/shop.js";
import { stageSvg } from "../activity/src/workshop/scene.js";
import { repertoireHtml, trickCardHtml, workshopCodex } from "../activity/src/workshop/room.js";
import * as B from "../activity/src/bookings/bill.js";
import * as BL from "../activity/src/bookings/logic.js";
import * as BS from "../activity/src/bookings/shop.js";
import { billSvg } from "../activity/src/bookings/scene.js";
import { histHtml, bookingsCodex } from "../activity/src/bookings/room.js";
import { dailySeed } from "../activity/src/daily.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { DAILY_ROOMS } from "../activity/src/scene.js";
import * as booking from "../src/modules/booking/index.js";
import { MODULES } from "../src/registry.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fresh = (methods = []) => { const p = { essence: 0 }; cfRoom(p).methods.push(...methods); return p; };

test("60 tricks: one per method at Level 1, 17 routines, 12 famous acts, all well formed", () => {
  assert.equal(TRICKS.length, 60); assert.equal(new Set(TRICKS.map((t) => t.id)).size, 60);
  assert.deepEqual([1, 2, 3].map((l) => TRICKS.filter((t) => t.lv === l).length), [31, 17, 12]);
  for (const m of METHODS) assert.ok(TRICKS.some((t) => t.lv === 1 && t.needs.length === 1 && t.needs[0] === m.id), "L1 trick for " + m.id);
  for (const t of TRICKS) {
    assert.equal(t.steps.length, [0, 4, 5, 6][t.lv], t.id + " steps"); assert.equal(new Set(t.steps).size, t.steps.length, t.id + " distinct steps");
    assert.equal(t.needs.length >= (t.lv === 1 ? 1 : 2), true, t.id); t.needs.forEach((m) => assert.ok(METHODS.some((x) => x.id === m), t.id + " " + m));
    assert.ok(t.tell.length > 15 && t.fact.length > 30 && t.emoji && t.name, t.id);
  }
  assert.equal(new Set(TRICKS.map((t) => t.tell)).size, 60, "every tell is different");
  assert.match(hintFor("toes"), /Hydesville/); assert.match(trickOf("w-pepper").fact, /1862/);
});

test("Workshop: tricks open with Case Files methods; steps in order, then the tell; 3 spotlights", () => {
  const p = fresh();
  assert.equal(W.nextOf(p, LEVELS[0]), null, "nothing open with no methods");
  cfRoom(p).methods.push("palm");
  assert.equal(W.nextOf(p, LEVELS[0]), "w-coin"); assert.ok(W.isOpen(p, trickOf("w-coin"))); assert.deepEqual(W.missing(p, trickOf("w-spoons")), ["expect"]);
  const run = W.start("w-coin", { seed: 7 });
  assert.notDeepEqual(run.order, [0, 1, 2, 3], "never dealt in order"); assert.equal(run.tells.length, 3); assert.ok(run.tells.includes(trickOf("w-coin").tell));
  assert.equal(W.tapStep(run, 2), "slip"); assert.equal(run.lights, 2);
  assert.equal(W.tapStep(run, 0), "next"); assert.equal(W.tapStep(run, 1), "next"); assert.equal(W.tapStep(run, 2), "next"); assert.equal(W.tapStep(run, 3), "steps-done");
  assert.equal(run.phase, "tell"); assert.equal(W.pickTell(run, trickOf("w-coin").tell), "right");
  assert.equal(W.scoreOf(run), 3); assert.equal(W.perfect(run), false);
  const s = W.settle(p, run); assert.equal(s.learned, true); assert.equal(s.essence, 2 + W.LEARN_PAY); assert.deepEqual(W.repertoire(p), ["w-coin"]);
  assert.equal(W.settle(p, { ...run }).learned, false, "learned only once");
  const flop = W.start("w-coin", { seed: 3 }); flop.order.filter((i) => i !== 0).slice(0, 3).forEach((i) => W.tapStep(flop, i));
  assert.equal(flop.over, true); assert.equal(flop.won, false); assert.equal(W.scoreOf(flop), 0);
  const lent = W.start("w-pepper", { lent: true }); [0, 1, 2, 3, 4, 5].forEach((i) => W.tapStep(lent, i)); W.pickTell(lent, trickOf("w-pepper").tell);
  assert.equal(W.perfect(lent), true); assert.equal(W.settle(p, lent).learned, false, "a lent daily trick isn't kept"); assert.ok(!W.repertoire(p).includes("w-pepper"));
  const d = W.dailyOf("2026-11-27"); assert.equal(d.id, TRICKS[dailySeed("workshop", "2026-11-27") % 60].id);
});

test("Workshop: shop, stage, repertoire and codex", () => {
  assert.equal(WS.SHOP.length, 9); assert.ok(WS.SLOTS.every(([k]) => WS.SHOP.filter((s) => s.slot === k).length === 3 && WS.SHOP.some((s) => s.slot === k && s.price === 0)));
  assert.ok(WS.SHOP.every((s) => s.id.startsWith("ws-") && s.note.length > 30));
  const p = fresh(["palm"]); assert.equal(WS.buyOrUse(p, "ws-lime"), "poor"); p.essence = 100; assert.equal(WS.buyOrUse(p, "ws-lime"), "bought"); assert.equal(WS.lookOf(p).light, "ws-lime");
  for (const st of [null, "bow", "flop"]) assert.match(stageSvg(trickOf("w-coin"), { look: WS.lookOf(p), lights: 1, state: st }), /^<svg[\s\S]*<\/svg>$/);
  assert.match(repertoireHtml(p, esc), /0 \/ 60/); assert.match(repertoireHtml(p, esc), /Solve: /);
  assert.match(trickCardHtml(trickOf("w-coin"), esc), /The tell/); assert.match(workshopCodex(p, esc), /The Workshop/);
});

test("Tonight's Bill: 3 bookings a day, the same for everyone, Levels 1-3, Level 3 chains expose -> perform -> explain", () => {
  assert.equal(B.seedOf("bookings", "2026-11-27"), dailySeed("bookings", "2026-11-27"), "same seed as daily.js");
  const a = B.tonightsBill("2026-11-27"), b = B.tonightsBill("2026-11-27"), c = B.tonightsBill("2026-11-28");
  assert.deepEqual(a, b); assert.notDeepEqual(a.bookings, c.bookings);
  for (let d = 1; d <= 28; d++) {
    const bill = B.tonightsBill(`2026-12-${String(d).padStart(2, "0")}`);
    assert.deepEqual(bill.bookings.map((x) => x.lv), [1, 2, 3]); assert.equal(new Set(bill.bookings.map((x) => x.client)).size, 3);
    for (const bk of bill.bookings) {
      assert.equal(bk.parts.length, bk.lv); assert.ok(B.venueOf(bk.venue));
      for (const part of bk.parts) { assert.ok(part.options.includes(part.answer)); assert.equal(new Set(part.options).size, part.options.length); assert.equal(part.method, bk.method); }
    }
    assert.deepEqual(bill.bookings[2].parts.map((x) => x.kind), ["expose", "perform", "explain"]);
  }
  assert.ok(B.VENUES.every((v) => v.fact.length > 30)); assert.deepEqual(B.BILLINGS.map((x) => x.name), ["Bottom of the Bill", "Supporting Act", "Top of the Bill", "Star Turn"]);
  assert.equal(B.billingOf(0).n, 0); assert.equal(B.billingOf(3).n, 1); assert.equal(B.billingOf(10).n, 2); assert.equal(B.billingOf(99).n, 3);
});

test("Bookings: two tries a part, repertoire bonus, billing rises, matinees pay half, the bill resets daily", () => {
  const p = fresh(); const bill = BL.billFor(p, "2026-11-27"), bk = bill.bookings[2];
  W.room(p).rep.push(bk.parts[1].trickId);
  const run = BL.start(bk, { slot: 2, day: "2026-11-27" });
  assert.equal(BL.answer(run, bk.parts[0].options.find((o) => o !== bk.parts[0].answer), p), "retry");
  assert.equal(BL.answer(run, bk.parts[0].answer, p), "right"); assert.equal(BL.answer(run, bk.parts[1].answer, p), "right"); assert.equal(BL.answer(run, bk.parts[2].answer, p), "right");
  assert.equal(run.won, true); assert.equal(run.pts, 5); assert.equal(run.bonus, 1); assert.equal(BL.perfect(run), false);
  const s = BL.settle(p, run, { parlour: true }); assert.equal(s.score, 12); assert.equal(s.keys, B.KEY_PAY); assert.equal(BL.room(p).shows, 1); assert.equal(s.billDone, false);
  const m = BL.start(BL.matinee(p, 1, () => 0.3)); assert.equal(BL.answer(m, m.b.parts[0].answer), "right");
  const ms = BL.settle(p, m, { parlour: true }); assert.equal(ms.keys, 0, "matinees pay no keys"); assert.equal(ms.essence, Math.ceil(ms.score / 4));
  const f = BL.start(bill.bookings[0], { slot: 0 }), wrong = bill.bookings[0].parts[0].options.filter((o) => o !== bill.bookings[0].parts[0].answer);
  BL.answer(f, wrong[0]); assert.equal(BL.answer(f, wrong[1]), "flop"); BL.settle(p, f);
  const g = BL.start(bill.bookings[1], { slot: 1 }); bill.bookings[1].parts.forEach((x) => BL.answer(g, x.answer)); assert.equal(BL.settle(p, g).billDone, true);
  assert.equal(BL.billTotal(p), 12 + Math.round(4 * 1.5));
  BL.room(p).shows = 2; const up = BL.start(BL.matinee(p, 1)); BL.answer(up, up.b.parts[0].answer); assert.equal(BL.settle(p, up).billingUp, "Supporting Act");
  assert.deepEqual(BL.billFor(p, "2026-11-28").played, {}, "a new day, a new bill");
  assert.match(histHtml(p, esc), /Past shows/); assert.match(bookingsCodex(p, esc), /Supporting Act/);
  assert.equal(BS.SHOP.length, 9); assert.ok(BS.SHOP.every((x) => x.id.startsWith("bk-") && x.note.length > 30));
  for (const st of [null, "won", "flop"]) assert.match(billSvg(bk, { look: BS.lookOf(p), name: "Frank & Co", billing: 3, state: st }), /^<svg[\s\S]*FRANK &amp; CO[\s\S]*<\/svg>$/);
});

test("/booking posts Tonight's Bill without the answers; rooms are wired into trophies, banter and dailies", async () => {
  assert.ok(MODULES.includes("booking")); assert.equal(booking.command.name, "booking");
  const r = await booking.run({}, { now: new Date("2026-11-27T12:00:00Z") });
  assert.equal(r.embeds[0].fields.length, 4); assert.match(r.embeds[0].title, /2026-11-27/);
  const bill = B.tonightsBill("2026-11-27"), text = JSON.stringify(r.embeds);
  for (const bk of bill.bookings) { const lead = bk.parts[0]; if (lead.kind === "expose" || lead.kind === "perform") assert.ok(!text.includes(METHODS.find((x) => x.id === bk.method).how), "no method explanation leaked"); }
  for (const id of ["workshop", "bookings"]) { assert.ok(TROPHIES.some((t) => t.id === id)); assert.ok(BANTER[id]); assert.ok(DAILY_ROOMS.includes(id)); }
});
