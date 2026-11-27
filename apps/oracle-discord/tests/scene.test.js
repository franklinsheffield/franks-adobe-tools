// The interface batch (activity/src/scene.js): living Chamber, transitions, reading card, orbs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { partOfDay, moonLight, phaseName, sceneHtml, CINE, cineHtml, cardFacts, readingCardHtml, orbsFor, markCard, markStore, DAILY_ROOMS } from "../activity/src/scene.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
test("the window shows the real part of day and the Moon's phase", () => {
  assert.deepEqual([3, 6, 12, 18, 22].map(partOfDay), ["night", "dawn", "day", "dusk", "night"]);
  const full = Date.UTC(2026, 10, 24, 14, 0); // full moon, 24 Nov 2026
  assert.ok(moonLight(full).lit > 0.95, "full moon is lit"); assert.equal(phaseName(full), "Full moon");
  const html = sceneHtml(new Date(2026, 10, 27, 23).getTime(), { rnd: () => 0.5 });
  assert.match(html, /sc-night/); assert.match(html, /Tonight's moon/); assert.ok(!/NaN|undefined/.test(html));
  assert.match(sceneHtml(new Date(2026, 10, 27, 12).getTime(), { rnd: () => 0.5 }), /Daylight/);
});
test("every transition kind draws", () => { for (const k of Object.values(CINE)) assert.ok(cineHtml(k).length > 5, k); });
test("the reading card shows the headline and up to 3 facts, escaped", () => {
  const r = { embeds: [{ title: "The Tower <b>", fields: [{ name: "Card", value: "The Tower. A sudden change." }, { name: "Element", value: "Fire" }, { name: "A", value: "x" }, { name: "B", value: "y" }] }] };
  assert.equal(cardFacts(r).length, 3); assert.equal(cardFacts(r)[0].v, "The Tower");
  const h = readingCardHtml({ emoji: "🃏", label: "Tarot" }, r, "The Tower falls", esc);
  assert.match(h, /The Tower &lt;b&gt;/); assert.match(h, /id="rc"/);
});
test("orbs: today's card, unplayed dailies, a new store week; marking clears them", () => {
  const p = {}, at = Date.UTC(2026, 10, 27, 18);
  let o = orbsFor(p, DAILY_ROOMS, at); assert.equal(o.card, true); assert.equal(o.games.length, DAILY_ROOMS.length); assert.equal(o.store, true);
  markCard(p, at); markStore(p, at); p.daily = { duel: { today: { day: "2026-11-27" } } };
  o = orbsFor(p, DAILY_ROOMS, at); assert.equal(o.card, false); assert.equal(o.store, false); assert.ok(!o.games.includes("duel"));
});
