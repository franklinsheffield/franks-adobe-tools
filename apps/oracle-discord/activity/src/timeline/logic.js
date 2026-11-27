// History of Magic: the timeline game's rules, kept pure for tests. Progress lives in prog.rooms.timeline:
//   { plays, cards: { <eventId>: true }, best: { <level>: score }, perfect: { <level>: true }, last }
// A game deals cards one at a time. The first is laid on the timeline face up; each next card's date is hidden and
// the player taps the gap where it belongs. Wrong places cost an hourglass (3 per game) and the card is put where it
// really goes. Level 1 spans all of history with cards far apart; level 2 two neighbouring eras, closer; level 3 one
// era, close together. Cards are only dealt together when their dates (with their uncertainty) can't overlap.
import { EVENTS, ERAS, eventsOf, byId } from "./events.js";
import { DECKS, deckOf, MYTHS, mythById } from "./events2.js"; // also adds the expansion cards to EVENTS

export const LEVELS = [
  { n: 1, name: "Apprentice", what: "Across all of history", cards: 5, gap: 120, mult: 1 },
  { n: 2, name: "Adept", what: "Two neighbouring eras", cards: 6, gap: 15, mult: 1.5 },
  { n: 3, name: "Master", what: "One era, close together", cards: 7, gap: 2, mult: 2 },
];
/** Extra modes. The Daily Chronicle: the same 6 cards for everyone today (daily.js seed). Themed decks: one story. */
export const DAILY = { n: 4, key: "daily", name: "Daily Chronicle", what: "The same 6 cards for everyone today", cards: 6, gap: 40, mult: 1.5 };
export const DECK = { n: 5, key: "deck", name: "Themed deck", what: "Six cards from one story", cards: 6, gap: 5, mult: 1.5 };
export const MODES = [...LEVELS, DAILY, DECK];
export const SANDS = 3;
export const PER_CARD = 10;
export const TOTAL = EVENTS.length;
export const MYTH_PTS = 5;
export const TITLES = [{ at: 0, name: "Time Tourist" }, { at: 10, name: "Apprentice Chronicler" }, { at: 25, name: "Keeper of Years" }, { at: 42, name: "Royal Historian" }, { at: TOTAL, name: "Master of the Chronicle" }];

export const room = (p) => {
  const r = ((p.rooms ||= {}).timeline ||= { plays: 0, cards: {}, best: {}, perfect: {}, last: null });
  r.cards ||= {}; r.best ||= {}; r.perfect ||= {}; r.myths ||= {}; r.seals ||= {}; r.decks ||= {}; r.bulls ||= 0; return r;
};
export const chronicled = (p, era) => EVENTS.filter((e) => room(p).cards[e.id] && (!era || e.era === era)).length;
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const levelOf = (n) => MODES[n - 1];
export const pts = (L) => Math.round(PER_CARD * L.mult);

/** Can these two cards share a game? Their date ranges must stay apart by the level's gap. */
export const apart = (a, b, gap) => Math.abs(a.year - b.year) > a.pm + b.pm + gap;

/** A seeded random number generator, so tests (and replays) can repeat a deal. */
export function rng(seed = Date.now()) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** The pool a level deals from. Level 1: everything. Level 2: an era and its neighbour. Level 3: one era. */
export function poolFor(L, era, r = Math.random, deck = null) {
  if (L.n === 1 || L.n === DAILY.n) return { eras: ERAS.map((e) => e.id), cards: EVENTS };
  if (L.n === DECK.n) { const d = deckOf(deck) || DECKS[0], ids = new Set(d.ids); return { eras: ERAS.map((e) => e.id), cards: EVENTS.filter((e) => ids.has(e.id)), deck: d.id }; }
  const i = era ? ERAS.findIndex((e) => e.id === era) : Math.floor(r() * ERAS.length);
  if (L.n === 3) return { eras: [ERAS[i].id], cards: eventsOf(ERAS[i].id) };
  const j = i === ERAS.length - 1 ? i - 1 : i === 0 ? 1 : r() < 0.5 ? i - 1 : i + 1, pair = [ERAS[Math.min(i, j)].id, ERAS[Math.max(i, j)].id];
  return { eras: pair, cards: EVENTS.filter((e) => pair.includes(e.era)) };
}

/** Deal a game's cards: unseen cards first (so collections grow), every pair safely apart. */
export function deal(L, { era, deck, seen = {}, r = Math.random } = {}) {
  const { eras, cards } = poolFor(L, era, r, deck);
  for (let tries = 0; tries < 40; tries++) {
    const fresh = shuffle(cards.filter((c) => !seen[c.id]), r), old = shuffle(cards.filter((c) => seen[c.id]), r), hand = [];
    for (const c of [...fresh, ...old]) { if (hand.length >= L.cards) break; if (hand.every((h) => apart(h, c, L.gap))) hand.push(c); }
    if ((L.n === 1 || L.n === DAILY.n) && new Set(hand.map((h) => h.era)).size < 3) continue; // these should cross the ages
    if (hand.length === L.cards) return { eras, hand: shuffle(hand, r), deck: L.n === DECK.n ? (deck || DECKS[0].id) : null, myth: MYTHS[Math.floor(r() * MYTHS.length)].id };
  }
  throw new Error("timeline: could not deal level " + L.n);
}

const sorted = (cards) => cards.slice().sort((a, b) => a.year - b.year);

/** Start a game: the first card is placed for free. */
export function start(L, dealt) {
  const [first, ...rest] = dealt.hand;
  return { level: L.n, eras: dealt.eras, deck: dealt.deck || null, line: [first], queue: rest, sands: SANDS, right: [], wrong: [], pins: [], myth: dealt.myth ? { id: dealt.myth, said: null, right: false } : null, done: false };
}
export const current = (run) => run.queue[0] || null;

/** Where the current card really goes: the gap index (0 = before the first card on the line). */
export const slotOf = (line, card) => line.filter((c) => c.year < card.year).length;

/** Place the current card in gap `slot`. Returns { ok, slot } (the correct gap), or null if the game is over. */
export function place(run, slot) {
  const card = current(run); if (!card || run.done) return null;
  const at = slotOf(run.line, card), ok = slot === at;
  run.line = sorted([...run.line, card]); run.queue.shift();
  (ok ? run.right : run.wrong).push(card.id);
  (run.log ||= []).push(ok ? 1 : 0);
  if (!ok) run.sands--;
  if (run.sands <= 0 || !run.queue.length) run.done = true;
  return { ok, slot: at, card };
}

/** Pinpoint: after a card is placed, the player guesses its year between its new neighbours on the line. */
export function pinRange(run, card) {
  const i = run.line.findIndex((c) => c.id === card.id), prev = run.line[i - 1], next = run.line[i + 1];
  const first = ERAS.find((e) => e.id === run.eras[0]), last = ERAS.find((e) => e.id === run.eras.at(-1));
  return { lo: prev ? prev.year + 1 : first.from, hi: next ? next.year - 1 : Math.min(last.to, 2026) };
}
export const PIN = { bull: 6, close: 3 };
/** Grade a year guess: "bull" (within the card's own uncertainty, or 5% of the range), "close" (15%), or "miss". */
export function pinpoint(run, card, guess) {
  const { lo, hi } = pinRange(run, card), span = Math.max(1, hi - lo), err = Math.abs(Math.round(guess) - card.year), L = levelOf(run.level);
  const grade = err <= Math.max(card.pm, span * 0.05, 1) ? "bull" : err <= Math.max(card.pm * 2, span * 0.15, 3) ? "close" : "miss";
  const pts = grade === "miss" ? 0 : Math.round(PIN[grade] * L.mult);
  run.pins.push({ id: card.id, err, grade, pts }); return { err, grade, pts };
}
/** Myth or fact? said = true (it happened) or false (myth). One answer per game. */
export function answerMyth(run, said) {
  if (!run.myth || run.myth.said !== null) return null;
  const m = mythById(run.myth.id); run.myth.said = !!said; run.myth.right = m.fact === !!said; return run.myth.right;
}
export const yearText = (y) => (y < 0 ? `${-y} BCE` : y < 1000 ? `${y} CE` : String(y));
export const perfect = (run) => run.done && run.wrong.length === 0 && run.queue.length === 0;
export const scoreOf = (run) => { const L = levelOf(run.level);
  return run.right.length * pts(L) + run.sands * Math.round(5 * L.mult) * (run.queue.length ? 0 : 1) + (perfect(run) ? pts(L) : 0)
    + (run.pins || []).reduce((a, x) => a + x.pts, 0) + (run.myth && run.myth.right ? Math.round(MYTH_PTS * L.mult) : 0); };

/** Settle a finished game. New cards placed right enter the Chronicle (✦ and 💎 each); a new best score pays the
 * improvement in ✦; a first perfect game at a level pays a 💎 bonus; each pinpoint bullseye pays 2 💎; a myth answered
 * right for the first time pays 3 💎; completing an era (a seal) or a themed deck pays 25 💎 once.
 * Returns { xp, essence, fresh, best, score, perfectFirst, bulls, mythNew, seals, decks }. */
export function settle(p, run) {
  const r = room(p), L = levelOf(run.level), score = scoreOf(run), key = run.deck ? "deck-" + run.deck : L.n;
  r.plays++; r.last = run.right.at(-1) || null;
  const fresh = run.right.filter((id) => !r.cards[id]); for (const id of fresh) r.cards[id] = true;
  const prev = r.best[key] || 0, best = score > prev; if (best) r.best[key] = score;
  const perfectFirst = L.n <= 3 && perfect(run) && !r.perfect[L.n]; if (perfectFirst) r.perfect[L.n] = true;
  const bulls = (run.pins || []).filter((x) => x.grade === "bull").length; r.bulls += bulls;
  const mythNew = !!(run.myth && run.myth.right && !r.myths[run.myth.id]); if (run.myth && run.myth.right) r.myths[run.myth.id] = true;
  const seals = ERAS.filter((E) => !r.seals[E.id] && eventsOf(E.id).every((e) => r.cards[e.id])).map((E) => E.id);
  for (const id of seals) r.seals[id] = true;
  const decks = DECKS.filter((d) => !r.decks[d.id] && d.ids.every((id) => r.cards[id])).map((d) => d.id);
  for (const id of decks) r.decks[id] = true;
  const xp = 3 + fresh.length * 4 + (best ? score - prev : 0);
  const essence = fresh.length * 4 + (perfectFirst ? 10 * L.n : 0) + bulls * 2 + (mythNew ? 3 : 0) + (seals.length + decks.length) * 25;
  return { xp, essence, fresh, best: best && prev > 0, score, perfectFirst, bulls, mythNew, seals, decks };
}
