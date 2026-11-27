// Grimoire Memory: rules kept pure for tests. Progress lives in prog.rooms.memory:
//   { plays, best: { "<tier>:<deck>": stars }, learned: [card keys matched at least once], last }
// A board is pairs of cards face down: each pair is a symbol card and its meaning card. Turn two: if they are a
// pair they stay up, otherwise they turn back. Fewer misses = more stars. Matching in a row builds a combo.
import { DECKS, deckById, ALL_CARDS } from "./deck.js";

export const TIERS = [
  { n: 1, name: "Apprentice", pairs: 6, cols: 4, peek: 3000, mult: 1, what: "6 pairs · a 3-second peek at the start" },
  { n: 2, name: "Adept", pairs: 8, cols: 4, peek: 1500, mult: 1.5, what: "8 pairs · a quick 1.5-second peek" },
  { n: 3, name: "Master", pairs: 10, cols: 5, peek: 0, mult: 2, what: "10 pairs · no peek" },
];
export const TITLES = [{ at: 0, name: "Novice Scribe" }, { at: 15, name: "Keeper of Signs" }, { at: 40, name: "Glyph Reader" }, { at: 75, name: "Archivist" }, { at: ALL_CARDS.length, name: "Grand Archivist" }];
export const keyOf = (T, D) => T.n + ":" + D.id;

export const room = (p) => {
  const r = ((p.rooms ||= {}).memory ||= { plays: 0, best: {}, learned: [], last: null });
  r.best ||= {}; r.learned ||= []; return r;
};
export const learnedCount = (p, deckId) => (deckId ? room(p).learned.filter((k) => k.startsWith(deckId + ":")).length : room(p).learned.length);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const starsOf = (p, T, D) => room(p).best[keyOf(T, D)] || 0;

/** Stars for a finished board: 3 with at most half as many misses as pairs, 2 with up to one miss per pair, else 1. */
export const starsFor = (misses, pairs) => (misses <= Math.floor(pairs / 2) ? 3 : misses <= pairs ? 2 : 1);

/** Pick the pairs for a board. Unlearned signs come first, so each game teaches something new. The mixed deck
 *  takes from every deck in turn. rnd is injectable for tests. */
export function pickPairs(D, T, learned = [], rnd = Math.random) {
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fresh = (cs) => { const s = shuffle(cs); return [...s.filter((c) => !learned.includes(c.key)), ...s.filter((c) => learned.includes(c.key))]; };
  if (D.id !== "mixed") return fresh(D.cards).slice(0, T.pairs);
  const piles = shuffle(DECKS.filter((d) => d.id !== "mixed")).map((d) => fresh(d.cards)), out = [];
  for (let i = 0; out.length < T.pairs; i++) out.push(piles[i % piles.length][Math.floor(i / piles.length)]);
  return out;
}

/** A new game: 2 cards per pair (side "s" = symbol, "m" = meaning), shuffled. */
export function deal(D, T, learned = [], rnd = Math.random) {
  const pairs = pickPairs(D, T, learned, rnd);
  const cards = pairs.flatMap((c) => [{ key: c.key, side: "s" }, { key: c.key, side: "m" }]);
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return { tier: T.n, deck: D.id, pairs, cards: cards.map((c, i) => ({ ...c, i, up: false, done: false })), open: [], misses: 0, matched: 0, combo: 0, bestCombo: 0, bonus: 0, turns: 0, done: false };
}

/**
 * Turn card i. Returns one of: "ignored" (already up, or two are waiting to turn back), "first" (one card up),
 * "match", "miss" (two up that don't pair: call hide() to turn them back) or "won" (the last pair).
 */
export function flip(g, i) {
  const c = g.cards[i]; if (!c || c.up || c.done || g.open.length >= 2 || g.done) return "ignored";
  c.up = true; g.open.push(i);
  if (g.open.length === 1) return "first";
  g.turns++;
  const [a, b] = g.open.map((k) => g.cards[k]);
  if (a.key === b.key) {
    a.done = b.done = true; g.open = []; g.matched++; g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
    if (g.combo > 1) g.bonus += 5 * (g.combo - 1);
    if (g.matched === g.pairs.length) { g.done = true; return "won"; }
    return "match";
  }
  g.misses++; g.combo = 0;
  return "miss";
}
/** Turn the two unmatched cards back face down. */
export function hide(g) { for (const k of g.open) g.cards[k].up = false; g.open = []; }
/** Peek: every card up (true) or back down (false). */
export function peek(g, on) { for (const c of g.cards) if (!c.done) c.up = on; }

export const scoreOf = (g, T) => Math.round((g.pairs.length * 10 + g.bonus) * T.mult);

/** Record a finished board. First clear: 5 ✦ + 5 💎; each new star: 5 ✦ + 5 💎, all × the tier; plus 1 ✦ for each
 *  sign learned for the first time. Replays that don't beat your stars still pay 2 ✦ for the practice. */
export function settle(p, g, T, D) {
  const r = room(p), k = keyOf(T, D), before = r.best[k] || 0, stars = starsFor(g.misses, g.pairs.length);
  const newStars = Math.max(0, stars - before), first = before === 0;
  const fresh = g.pairs.map((c) => c.key).filter((key) => !r.learned.includes(key));
  r.learned.push(...fresh); r.best[k] = Math.max(before, stars); r.plays++; r.last = k;
  const m = T.mult, unit = Math.round(5 * m);
  const xp = (first ? unit : 0) + newStars * unit + fresh.length + (newStars || first ? 0 : 2);
  const essence = (first ? unit : 0) + newStars * unit;
  return { stars, newStars, first, fresh, xp, essence, score: scoreOf(g, T) };
}

export { DECKS, deckById };
