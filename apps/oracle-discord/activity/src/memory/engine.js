// Grimoire Memory: rules kept pure for tests. Progress lives in prog.rooms.memory:
//   { plays, best: { "<tier>:<deck>": stars }, learned: [card keys matched at least once], last,
//     weak: { "<card key>": slips }, spells: { insight, wick, charm } }
// A slip is a miss you could have avoided: you turned a card whose twin you had already seen, or turned a card you
// had already seen thinking it was the twin. Slips make a sign "weak"; weak signs are dealt again sooner and can be
// drilled on their own (the Review deck). Each clean match of a weak sign wears one slip off.
// A board is pairs of cards face down: each pair is a symbol card and its meaning card. Turn two: if they are a
// pair they stay up, otherwise they turn back. Each miss snuffs a candle: when the last candle goes out the game
// ends. Higher tiers give more pairs and fewer candles. Candles left = stars. Matching in a row builds a combo.
import { DECKS, deckById, ALL_CARDS } from "./deck.js";

export const TIERS = [
  { n: 1, name: "Apprentice", pairs: 6, candles: 12, cols: 12, colsSm: 6, peek: 3000, mult: 1, what: "6 pairs · 12 candles · a 3-second peek" },
  { n: 2, name: "Adept", pairs: 8, candles: 10, cols: 8, colsSm: 6, peek: 1500, mult: 1.5, what: "8 pairs · 10 candles · a 1.5-second peek" },
  { n: 3, name: "Master", pairs: 10, candles: 8, cols: 10, colsSm: 7, peek: 0, mult: 2, what: "10 pairs · 8 candles · no peek" },
];
export const TITLES = [{ at: 0, name: "Novice Scribe" }, { at: 15, name: "Keeper of Signs" }, { at: 40, name: "Glyph Reader" }, { at: 75, name: "Archivist" }, { at: ALL_CARDS.length, name: "Grand Archivist" }];
export const keyOf = (T, D) => T.n + ":" + D.id;

export const room = (p) => {
  const r = ((p.rooms ||= {}).memory ||= { plays: 0, best: {}, learned: [], last: null });
  r.best ||= {}; r.learned ||= []; r.weak ||= {}; r.spells ||= {}; return r;
};
export const learnedCount = (p, deckId) => (deckId ? room(p).learned.filter((k) => k.startsWith(deckId + ":")).length : room(p).learned.length);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const starsOf = (p, T, D) => room(p).best[keyOf(T, D)] || 0;
/** Weak signs, worst first (optionally only one deck's). */
export const weakKeys = (p, deckId) => Object.entries(room(p).weak).filter(([k, n]) => n > 0 && (!deckId || k.startsWith(deckId + ":"))).sort((a, b) => b[1] - a[1]).map(([k]) => k);

/** One-use spells, bought in the room's satchel with Essence. Not allowed on the daily board. */
export const SPELLS = [
  { id: "insight", emoji: "🕯️", name: "Candle of Insight", price: 15, what: "Every card lifts for a 1.5-second peek" },
  { id: "wick", emoji: "🧵", name: "Spare wick", price: 10, what: "Relights one snuffed candle" },
  { id: "charm", emoji: "🧿", name: "Pairing charm", price: 20, what: "Two twins glow for a moment" },
];
export const spellCount = (p, id) => room(p).spells[id] || 0;
export function buySpell(p, id) { const S = SPELLS.find((x) => x.id === id); if (!S || (p.essence || 0) < S.price) return false; p.essence -= S.price; room(p).spells[id] = spellCount(p, id) + 1; return true; }
/** Cast a spell on a game: false if it can't be cast now (none left, game over, two cards waiting, nothing to relight). */
export function cast(p, g, id) {
  if (g.done || g.open.length >= 2 || g.noSpells || spellCount(p, id) <= 0) return false;
  if (id === "wick" && g.candles >= g.of) return false;
  if (id === "wick") g.candles++;
  room(p).spells[id]--; g.cast[id] = (g.cast[id] || 0) + 1; return true;
}
/** The pairing charm's pick: an unmatched pair, preferring one with a card you've already seen (and not the one
 *  open now unless its twin is the answer). Returns [i, j]. */
export function hintPair(g) {
  const open = g.open[0], left = g.cards.filter((c) => !c.done);
  if (open != null) { const t = left.find((c) => c.key === g.cards[open].key && c.i !== open); return [open, t.i]; }
  const keys = [...new Set(left.map((c) => c.key))];
  const k = keys.find((key) => left.some((c) => c.key === key && g.seen.includes(c.i))) || keys[0];
  return left.filter((c) => c.key === k).map((c) => c.i);
}

/** Stars for a cleared board from the candles still lit: 3 with half or more left, 2 with a quarter or more, else 1.
 *  No candles left means the board was not cleared: 0. */
export const starsFor = (left, of) => (left <= 0 ? 0 : left * 2 >= of ? 3 : left * 4 >= of ? 2 : 1);

/** Pick the pairs for a board. Unlearned signs come first, so each game teaches something new. The mixed deck
 *  takes from every deck in turn. rnd is injectable for tests. */
export function pickPairs(D, T, learned = [], rnd = Math.random, weak = {}) {
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // unlearned first, then weak (worst first), then the rest
  const rank = (c) => (!learned.includes(c.key) ? 0 : weak[c.key] > 0 ? 1 : 2);
  const fresh = (cs) => { const s = shuffle(cs); return [0, 1, 2].flatMap((r) => s.filter((c) => rank(c) === r).sort((a, b) => (r === 1 ? (weak[b.key] || 0) - (weak[a.key] || 0) : 0))); };
  if (D.id !== "mixed") return fresh(D.cards).slice(0, T.pairs);
  const piles = shuffle(DECKS.filter((d) => d.id !== "mixed")).map((d) => fresh(d.cards.filter((c) => !c.solo))), out = [];
  for (let i = 0; out.length < T.pairs; i++) out.push(piles[i % piles.length][Math.floor(i / piles.length)]);
  return out;
}

/** A new game: 2 cards per pair (side "s" = symbol, "m" = meaning), shuffled. */
export function deal(D, T, learned = [], rnd = Math.random, weak = {}) {
  const pairs = pickPairs(D, T, learned, rnd, weak);
  const cards = pairs.flatMap((c) => [{ key: c.key, side: "s" }, { key: c.key, side: "m" }]);
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return { tier: T.n, deck: D.id, pairs, cards: cards.map((c, i) => ({ ...c, i, up: false, done: false })), open: [], candles: T.candles, of: T.candles, misses: 0, matched: 0, found: [], seen: [], slips: {}, cast: {}, noSpells: false, lost: false, combo: 0, bestCombo: 0, bonus: 0, turns: 0, done: false };
}

/**
 * Turn card i. Returns one of: "ignored" (already up, or two are waiting to turn back), "first" (one card up),
 * "match", "miss" (two up that don't pair, a candle snuffed: call hide() to turn them back), "won" (the last pair)
 * or "out" (a miss that snuffed the last candle: the game is over).
 */
export function flip(g, i) {
  const c = g.cards[i]; if (!c || c.up || c.done || g.open.length >= 2 || g.done) return "ignored";
  c.up = true; g.open.push(i);
  const saw = g.seen.includes(i); if (!saw) g.seen.push(i);
  if (g.open.length === 1) return "first";
  g.turns++;
  const [a, b] = g.open.map((k) => g.cards[k]);
  if (a.key !== b.key) {
    const twinSeen = g.cards.some((c) => c.key === a.key && c.i !== a.i && g.seen.includes(c.i) && c.i !== b.i);
    if (twinSeen) g.slips[a.key] = (g.slips[a.key] || 0) + 1;
    if (saw) g.slips[b.key] = (g.slips[b.key] || 0) + 1;
  }
  if (a.key === b.key) {
    a.done = b.done = true; g.open = []; g.matched++; g.found.push(a.key); g.combo++; g.bestCombo = Math.max(g.bestCombo, g.combo);
    if (g.combo > 1) g.bonus += 5 * (g.combo - 1);
    if (g.matched === g.pairs.length) { g.done = true; return "won"; }
    return "match";
  }
  g.misses++; g.combo = 0; g.candles--;
  if (g.candles <= 0) { g.candles = 0; g.done = true; g.lost = true; return "out"; }
  return "miss";
}
/** Turn the two unmatched cards back face down. */
export function hide(g) { for (const k of g.open) g.cards[k].up = false; g.open = []; }
/** Peek: every card up (true) or back down (false). */
export function peek(g, on) { for (const c of g.cards) if (!c.done) c.up = on; }

export const scoreOf = (g, T) => Math.round((g.pairs.length * 10 + g.bonus) * T.mult);

/** Record a finished board. First clear: 5 ✦ + 5 💎; each new star: 5 ✦ + 5 💎, all × the tier; plus 1 ✦ for each
 *  sign learned for the first time (only pairs you found). Replays that don't beat your stars still pay 2 ✦ for the
 *  practice. A board lost to the candles pays only for the signs learned and the practice. */
export function settle(p, g, T, D) {
  const r = room(p), k = keyOf(T, D), before = r.best[k] || 0, stars = g.lost ? 0 : starsFor(g.candles, g.of);
  const newStars = g.review ? 0 : Math.max(0, stars - before), first = !g.review && !g.lost && before === 0;
  const fresh = g.found.filter((key) => !r.learned.includes(key));
  r.learned.push(...fresh); r.plays++;
  if (!g.review) { r.best[k] = Math.max(before, stars); r.last = k; }
  for (const [key, n] of Object.entries(g.slips)) r.weak[key] = (r.weak[key] || 0) + n;
  for (const key of g.found) if (!g.slips[key] && r.weak[key]) { r.weak[key]--; if (!r.weak[key]) delete r.weak[key]; }
  const m = T.mult, unit = Math.round(5 * m);
  const xp = (first ? unit : 0) + newStars * unit + fresh.length + (newStars || first ? 0 : 2);
  const essence = (first ? unit : 0) + newStars * unit;
  return { stars, newStars, first, fresh, xp, essence, score: scoreOf(g, T) };
}

export { DECKS, deckById };

/** A small seeded random generator, so the daily board is the same deal for everyone. */
export function rng(seed = Date.now()) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** The daily Grimoire: one deck a day (rotating through every deck but the mixed one), dealt at Adept from the
 *  day's seed, the same for every player. No spells. Score: the board's points plus 10 for each candle still lit;
 *  a board lost to the candles scores 10 for each pair found. */
export const DAILY_TIER = TIERS[1];
export function dailyDeal(seed) {
  const decks = DECKS.filter((d) => d.id !== "mixed"), D = decks[seed % decks.length];
  const g = deal(D, DAILY_TIER, [], rng(seed)); g.daily = true; g.review = true; g.noSpells = true;
  return { D, T: DAILY_TIER, g };
}
export const dailyScore = (g) => (g.lost ? g.matched * 10 : scoreOf(g, TIERS[g.tier - 1]) + g.candles * 10);

// ---- the two-player duel (played over the call's shared table: net.js; the host's client runs these) ----
// One Adept board, no candles and no spells. Players take turns turning two cards: a pair scores 1 and you go
// again, a miss passes the turn. Most pairs when the board is clear wins. Anyone else at the table watches.
export const DUEL_TIER = TIERS[1];
export function duelNew(D, seats, rnd = Math.random) {
  const g = deal(D, DUEL_TIER, [], rnd); g.candles = g.of = 9999; g.noSpells = true; g.review = true;
  return { id: Math.floor(rnd() * 1e9), g, deck: D.id, seats: seats.slice(0, 2), turn: 0, score: Object.fromEntries(seats.slice(0, 2).map((id) => [id, 0])), last: null, wait: false };
}
export const duelWho = (d) => d.seats[d.turn];
/** A player turns card i. Returns flip()'s result, or "ignored" (not your turn, or a miss still showing). After a
 *  "miss" the host shows it, then calls duelPass. */
export function duelFlip(d, who, i) {
  if (d.g.done || d.wait || duelWho(d) !== who) return "ignored";
  const r = flip(d.g, i); if (r === "ignored") return r;
  if (r === "match" || r === "won") { d.score[who]++; d.last = { who, key: d.g.found[d.g.found.length - 1] }; }
  if (r === "miss") d.wait = true;
  return r;
}
export function duelPass(d) { hide(d.g); d.wait = false; d.turn = 1 - d.turn; }
/** The winner's id, or null for a tie (only when the board is clear). */
export const duelWinner = (d) => { const [a, b] = d.seats; return d.score[a] === d.score[b] ? null : d.score[a] > d.score[b] ? a : b; };
/** What everyone at the table may see: a face-down card's identity stays on the host. */
export const duelView = (d) => ({ id: d.id, deck: d.deck, seats: d.seats, turn: d.turn, score: d.score, wait: d.wait, done: d.g.done, last: d.last, pairs: d.g.pairs.length, found: d.g.found,
  cards: d.g.cards.map((c) => (c.up || c.done ? { i: c.i, up: c.up, done: c.done, key: c.key, side: c.side } : { i: c.i })) });
