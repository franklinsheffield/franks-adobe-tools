// Your Grimoire (activity/src/book.js): the book shelf, the Journal log by day, and Patterns.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BOOKS, DEFAULT_BOOK, bookOf, bookShop, coverSvg, addLog, LOG_CAP, dayKey, dayLabel, byDay, topDrawn, hoursOf } from "../activity/src/book.js";

test("the book shelf has a free default and every binding draws", () => {
  assert.equal(BOOKS.find((b) => b.id === DEFAULT_BOOK).price, 0);
  assert.equal(new Set(BOOKS.map((b) => b.id)).size, BOOKS.length);
  assert.equal(bookOf({}).id, DEFAULT_BOOK); assert.equal(bookOf({ book: "bk-atlas" }).id, "bk-atlas");
  assert.equal(bookShop.kind, "book"); assert.equal(bookShop.items.length, BOOKS.length);
  for (const b of BOOKS) assert.match(coverSvg(b), /^<svg[\s\S]*YOUR GRIMOIRE[\s\S]*<\/svg>$/);
});

test("the Journal logs newest first, capped, grouped by day with times", () => {
  const day1 = new Date(2026, 10, 26, 9, 5).getTime(), day2 = new Date(2026, 10, 27, 21, 40).getTime();
  let L = addLog(null, "reading", "🃏", "Tarot reading", null, day1);
  L = addLog(L, "save", "📖", "Saved it", 123, day2);
  assert.equal(L[0].at, day2); assert.equal(L[0].ref, 123); assert.ok(!("ref" in L[1]));
  const g = byDay(L); assert.deepEqual(g.map((d) => d.day), ["2026-11-27", "2026-11-26"]);
  assert.equal(dayKey(day1), "2026-11-26");
  assert.equal(dayLabel("2026-11-27", day2), "Today"); assert.equal(dayLabel("2026-11-26", day2), "Yesterday");
  assert.match(dayLabel("2026-11-20", day2), /2026/);
  for (let i = 0; i < LOG_CAP + 20; i++) L = addLog(L, "x", "·", "t");
  assert.equal(L.length, LOG_CAP);
  assert.equal(addLog([], "x", "·", "y".repeat(500))[0].t.length, 220);
});

test("Patterns count the most drawn and when the member reads", () => {
  const top = topDrawn({ seen: { tarot: { "The Star": 3, "The Moon": 1 }, runes: { Fehu: 2 } } }, 2);
  assert.deepEqual(top.map((x) => x.name), ["The Star", "Fehu"]);
  const h = hoursOf([{ k: "reading", at: new Date(2026, 0, 1, 8).getTime() }, { k: "reading", at: new Date(2026, 0, 1, 23).getTime() }, { k: "save", at: new Date(2026, 0, 1, 14).getTime() }]);
  assert.deepEqual(h, { Night: 1, Morning: 1, Afternoon: 0, Evening: 0 });
});

test("the store try-on draws the binding opening on a sample spread", async () => {
  const { bookPreviewHtml } = await import("../activity/src/book.js");
  for (const b of BOOKS) { const h = bookPreviewHtml(b); assert.ok(h.includes(`data-page="${b.page}"`) && h.includes("bkp-cover") && h.includes("The Codex") && h.includes("Today"), b.id); }
});
