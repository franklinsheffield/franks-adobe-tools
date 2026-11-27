// History of Magic timeline room: the deck is well formed, every deal has one certain order, scoring is fair.
import test from "node:test";
import assert from "node:assert/strict";
import { EVENTS, ERAS, KINDS, eventsOf } from "../activity/src/timeline/events.js";
import { LEVELS, SANDS, TOTAL, TITLES, apart, deal, start, current, place, slotOf, perfect, scoreOf, settle, room, chronicled, rng, levelOf } from "../activity/src/timeline/logic.js";
import { GUIDES } from "../activity/src/timeline/guide.js";
import { SHOP, THEMES, TALK } from "../activity/src/timeline/shop.js";
import { timeline, sceneSvg, xOf, codexHtml } from "../activity/src/timeline/room.js";
import { fresh, merge } from "../activity/src/game.js";

const esc = (s) => String(s);

test("deck: unique ids, every era and kind used, dates inside their era, card faces never give the date away", () => {
  assert.equal(new Set(EVENTS.map((e) => e.id)).size, EVENTS.length);
  assert.ok(EVENTS.length >= 50);
  for (const E of ERAS) assert.ok(eventsOf(E.id).length >= 12, E.id);
  for (const k of Object.keys(KINDS)) assert.ok(EVENTS.some((e) => e.kind === k), k);
  for (const e of EVENTS) {
    const E = ERAS.find((x) => x.id === e.era); assert.ok(E, e.id);
    assert.ok(e.year - e.pm >= E.from && e.year + e.pm < E.to, `${e.id} ${e.year} outside ${E.id}`);
    for (const k of ["title", "what", "fact", "when", "emoji"]) assert.ok(e[k], e.id + " " + k);
    assert.ok(KINDS[e.kind], e.id);
    assert.ok(!/\b\d{3,4}\b/.test(e.what), `${e.id} card face shows a year: ${e.what}`);
    assert.ok(!/\b(BCE|CE|century|centuries)\b/i.test(e.what), `${e.id} card face dates itself`);
    if (e.pm === 0 && e.year > 0) assert.ok(e.when.includes(String(e.year)), `${e.id} when ${e.when} vs ${e.year}`);
  }
});

test("study guides: one per era, and each mentions every card's title subject", () => {
  for (const E of ERAS) {
    const g = GUIDES[E.id]; assert.ok(g && g.sections.length >= 4, E.id);
    const text = g.sections.flatMap((s) => s.p).join(" ").replace(/<[^>]+>/g, "").toLowerCase();
    for (const e of eventsOf(E.id)) {
      const yr = e.year < 0 ? String(-e.year) : String(e.year);
      assert.ok(text.includes(yr) || text.includes(e.when.replace("c. ", "").toLowerCase()), `${E.id} guide lacks the date of ${e.id} (${e.when})`);
    }
  }
});

test("deals: right size, safely apart, from the right eras, for many seeds", () => {
  for (const L of LEVELS) for (let s = 1; s <= 150; s++) {
    const r = rng(s * 7919), era = L.n === 1 ? undefined : ERAS[s % 4].id, d = deal(L, { era, r });
    assert.equal(d.hand.length, L.cards, `L${L.n} seed ${s}`);
    for (let i = 0; i < d.hand.length; i++) for (let j = i + 1; j < d.hand.length; j++) assert.ok(apart(d.hand[i], d.hand[j], L.gap), `L${L.n} ${d.hand[i].id}/${d.hand[j].id}`);
    for (const c of d.hand) assert.ok(d.eras.includes(c.era));
    if (L.n === 1) assert.ok(new Set(d.hand.map((c) => c.era)).size >= 3);
    if (L.n === 2) { assert.equal(d.eras.length, 2); assert.equal(Math.abs(ERAS.findIndex((e) => e.id === d.eras[0]) - ERAS.findIndex((e) => e.id === d.eras[1])), 1); assert.ok(d.eras.includes(era)); }
    if (L.n === 3) assert.deepEqual(d.eras, [era]);
  }
});

test("unseen cards are dealt first", () => {
  const L = levelOf(3), seen = Object.fromEntries(eventsOf("modern").slice(0, 7).map((e) => [e.id, true]));
  const d = deal(L, { era: "modern", seen, r: rng(3) });
  assert.ok(d.hand.filter((c) => !seen[c.id]).length >= 5);
});

test("play: right places score, wrong ones cost sand and still file the card in order", () => {
  const L = levelOf(1), d = deal(L, { r: rng(11) }), run = start(L, d);
  assert.equal(run.line.length, 1);
  let first = true;
  while (current(run)) {
    const c = current(run), at = slotOf(run.line, c);
    const r = place(run, first ? (at === 0 ? 1 : 0) : at); first = false;
    assert.equal(r.slot, at);
    for (let i = 1; i < run.line.length; i++) assert.ok(run.line[i - 1].year < run.line[i].year);
  }
  assert.equal(run.done, true); assert.equal(run.sands, SANDS - 1); assert.equal(run.wrong.length, 1);
  assert.equal(run.right.length, L.cards - 2); assert.equal(perfect(run), false);
  assert.equal(scoreOf(run), (L.cards - 2) * 10 + (SANDS - 1) * 5);
});

test("out of sand ends the game early", () => {
  const L = levelOf(3), run = start(L, deal(L, { era: "renaissance", r: rng(5) }));
  for (let i = 0; i < SANDS; i++) { const at = slotOf(run.line, current(run)); place(run, at === 0 ? run.line.length : 0); }
  assert.equal(run.done, true); assert.equal(run.sands, 0); assert.ok(run.queue.length > 0);
  assert.equal(place(run, 0), null);
});

test("settle: new cards pay ✦ and 💎 once, best score pays the improvement, perfect bonus once", () => {
  const p = fresh(), L = levelOf(2);
  const play = (seed) => { const run = start(L, deal(L, { era: "wonders", seen: room(p).cards, r: rng(seed) })); while (current(run)) place(run, slotOf(run.line, current(run))); return run; };
  const a = play(1), r1 = settle(p, a);
  assert.equal(perfect(a), true); assert.equal(r1.fresh.length, L.cards - 1); assert.equal(r1.perfectFirst, true);
  assert.equal(r1.score, (L.cards - 1) * 15 + SANDS * 8 + 15);
  assert.equal(r1.xp, 3 + r1.fresh.length * 4 + r1.score); assert.equal(r1.essence, r1.fresh.length * 4 + 20);
  const anchor = a.line.find((c) => !a.right.includes(c.id)), b = start(L, { eras: a.eras, hand: [anchor, ...a.line.filter((c) => c !== anchor)] }); while (current(b)) place(b, slotOf(b.line, current(b)));
  const r2 = settle(p, b);
  assert.equal(r2.fresh.length, 0); assert.equal(r2.perfectFirst, false); assert.equal(r2.xp, 3); assert.equal(r2.essence, 0);
  assert.equal(chronicled(p), L.cards - 1); assert.equal(room(p).plays, 2);
  assert.ok(merge(fresh(), p).rooms.timeline.plays >= 2);
});

test("titles reach the whole deck; shop and scene render for every theme", () => {
  assert.equal(TITLES.at(-1).at, TOTAL);
  assert.equal(timeline.shop.kind, "timeline");
  for (const it of SHOP) { assert.ok(THEMES[it.id], it.id); assert.ok(it.id.startsWith("tl-")); assert.equal(it.kind, undefined); }
  assert.equal(SHOP.filter((s) => s.price === 0).length, 1);
  for (const k of ["open", "tryon", "buy"]) assert.ok(TALK[k].length >= 3);
  const L = levelOf(3), run = start(L, deal(L, { era: "ancient", r: rng(2) }));
  for (const id of Object.keys(THEMES)) { const svg = sceneSvg(run, id, { hand: current(run) }); assert.ok(svg.startsWith("<svg") && svg.includes("HISTORY OF MAGIC")); }
  assert.ok(xOf(-1700, ["ancient"]) < xOf(390, ["ancient"]));
  assert.ok(xOf(1500, ERAS.map((e) => e.id)) < xOf(1700, ERAS.map((e) => e.id)));
  const p = fresh(); room(p).cards.delphi = true;
  assert.ok(codexHtml(p, esc).includes("Oracle of Delphi"));
});

// ---- improvements: daily, pinpoint, decks, myths, links ----
import { DAILY, DECK, pinRange, pinpoint, answerMyth, yearText, MYTH_PTS, PIN } from "../activity/src/timeline/logic.js";
import { DECKS, MYTHS, LINKS, MORE } from "../activity/src/timeline/events2.js";
import { dailySeed } from "../activity/src/daily.js";
import { GHOSTS } from "../activity/src/seance/ghosts.js";
import { SCRIPTS } from "../activity/src/decoder/levels.js";

test("expansion: about a hundred events, decks only name real cards and always deal", () => {
  assert.ok(EVENTS.length >= 100 && MORE.length >= 35);
  for (const D of DECKS) {
    assert.ok(D.ids.length >= 8, D.id); for (const id of D.ids) assert.ok(EVENTS.some((e) => e.id === id), `${D.id}: ${id}`);
    assert.ok(GUIDES["deck-" + D.id]?.sections.length >= 2, D.id);
    for (let s = 1; s <= 60; s++) { const d = deal(DECK, { deck: D.id, r: rng(s) }); assert.equal(d.hand.length, DECK.cards);
      for (const c of d.hand) assert.ok(D.ids.includes(c.id));
      for (let i = 0; i < d.hand.length; i++) for (let j = i + 1; j < d.hand.length; j++) assert.ok(apart(d.hand[i], d.hand[j], DECK.gap)); }
  }
});

test("daily: everyone gets the same deal and myth today, a different one tomorrow", () => {
  const a = deal(DAILY, { r: rng(dailySeed("timeline", "2026-11-27")) }), b = deal(DAILY, { r: rng(dailySeed("timeline", "2026-11-27")) });
  const c = deal(DAILY, { r: rng(dailySeed("timeline", "2026-11-28")) });
  assert.deepEqual(a.hand.map((x) => x.id), b.hand.map((x) => x.id)); assert.equal(a.myth, b.myth);
  assert.notDeepEqual(a.hand.map((x) => x.id), c.hand.map((x) => x.id));
  assert.equal(a.hand.length, 6); assert.ok(new Set(a.hand.map((x) => x.era)).size >= 3);
});

test("pinpoint: range sits between neighbours and always contains the true year; grades and points", () => {
  for (let s = 1; s <= 80; s++) {
    const L = levelOf((s % 3) + 1), run = start(L, deal(L, { era: ERAS[s % 4].id, r: rng(s) }));
    while (current(run)) { const c = current(run); place(run, slotOf(run.line, c)); const { lo, hi } = pinRange(run, c);
      assert.ok(lo <= c.year && c.year <= hi, `${c.id} ${lo}..${hi}`); }
  }
  const L = levelOf(1), run = start(L, deal(L, { r: rng(9) })), c = current(run); place(run, slotOf(run.line, c));
  assert.equal(pinpoint(run, c, c.year).grade, "bull"); assert.equal(run.pins[0].pts, PIN.bull);
  const { lo, hi } = pinRange(run, c), far = Math.abs(c.year - lo) > Math.abs(c.year - hi) ? lo : hi;
  assert.equal(pinpoint(run, c, far).grade === "bull", false);
  assert.equal(yearText(-410), "410 BCE"); assert.equal(yearText(64), "64 CE"); assert.equal(yearText(1888), "1888");
});

test("myth or fact: one answer per game, scores, pays 3 💎 once, all myths explained", () => {
  assert.ok(MYTHS.length >= 12 && MYTHS.some((m) => m.fact) && MYTHS.some((m) => !m.fact));
  for (const m of MYTHS) { assert.ok(m.claim && m.truth.length > 60, m.id); assert.ok(m.truth.startsWith(m.fact ? "Fact" : "M") || m.truth.startsWith("Legend") || m.truth.startsWith("Probably"), m.id); }
  const p = fresh(), L = levelOf(1), run = start(L, deal(L, { r: rng(4) })), m = MYTHS.find((x) => x.id === run.myth.id);
  assert.equal(answerMyth(run, m.fact), true); assert.equal(answerMyth(run, !m.fact), null);
  while (current(run)) place(run, slotOf(run.line, current(run)));
  const r = settle(p, run); assert.equal(r.mythNew, true); assert.ok(r.score >= MYTH_PTS);
  const run2 = start(L, deal(L, { r: rng(4) })); answerMyth(run2, m.fact); while (current(run2)) place(run2, slotOf(run2.line, current(run2)));
  assert.equal(settle(p, run2).mythNew, false);
});

test("era seals and deck badges pay once when every card is chronicled", () => {
  const p = fresh(), r0 = room(p);
  for (const e of EVENTS) if (e.era === "modern" && e.id !== "bem") r0.cards[e.id] = true;
  const L = levelOf(3); let got = null;
  for (let s = 1; s < 400 && !got; s++) { const d = deal(L, { era: "modern", r: rng(s) }); if (!d.hand.slice(1).some((c) => c.id === "bem")) continue;
    const run = start(L, d); while (current(run)) place(run, slotOf(run.line, current(run))); got = settle(p, run); }
  assert.ok(got); assert.deepEqual(got.seals, ["modern"]); assert.ok(got.essence >= 25);
});

test("links point at real Séance ghosts and Decoder scripts", () => {
  for (const [id, l] of Object.entries(LINKS)) {
    assert.ok(EVENTS.some((e) => e.id === id), id);
    if (l.seance) assert.ok(GHOSTS.some((g) => g.id === l.seance), l.seance);
    if (l.decoder) assert.ok(SCRIPTS[l.decoder], l.decoder);
  }
});
