import { equippedBack } from "../cardbacks.js";
// Constellation Rummy rules (pure, no DOM). You play the Oracle. Each turn: draw one card (deck or the top discard),
// lay down sets or add cards to sets on the table, then discard one. Sets: 3 or 4 stars of one constellation, and from
// Level 2 also 3+ stars of the same spectral class from different constellations. Empty your hand to go out.
// Score = points of the cards you laid down (by brightness) minus the points still in your hand, +5 for going out.
import { CARD, LEVELS, CONS, pts } from "./deck.js";
export { LEVELS, pts };

export const OUT_BONUS = 5, L3_MISS = 1;
/** Small seeded random generator so games and tests can be replayed. */
export function rng(seed = Date.now()) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** A fresh game at a level. g.hands.me / g.hands.or hold HIP numbers. */
export function newGame(L, seed = Date.now()) {
  const r = rng(seed), deck = shuffle(Object.values(CARD).filter((c) => L.cons.includes(c.con)).map((c) => c.hip), r);
  const g = { level: L.n, seed, r, deck, discard: [], hands: { me: [], or: [] }, melds: [], turn: "me", phase: "draw", took: null, misses: 0, nights: 1, over: false, out: null, nextId: 1 };
  for (let i = 0; i < L.hand; i++) { g.hands.me.push(deck.pop()); g.hands.or.push(deck.pop()); }
  g.discard.push(deck.pop());
  return g;
}
export const levelOf = (g) => LEVELS[g.level - 1];
export const top = (g) => g.discard[g.discard.length - 1] ?? null;

/** What set these cards make, or null. { type: "con", key: "Ori" } or { type: "col", key: "B" } */
export function setType(g, hips) {
  const L = levelOf(g), cs = hips.map((h) => CARD[h]);
  if (cs.length < 3 || new Set(hips).size !== hips.length) return null;
  if (cs.length <= 4 && cs.every((c) => c.con === cs[0].con)) return { type: "con", key: cs[0].con };
  if (L.colour && cs.every((c) => c.cls === cs[0].cls) && new Set(cs.map((c) => c.con)).size === cs.length) return { type: "col", key: cs[0].cls };
  return null;
}
/** Can this card join that set on the table? */
export function fits(g, hip, m) {
  const c = CARD[hip];
  if (m.type === "con") return c.con === m.key && m.cards.length < 4;
  return c.cls === m.key && !m.cards.some((x) => CARD[x.hip].con === c.con);
}
export const fitsAny = (g, hip) => g.melds.find((m) => fits(g, hip, m)) || null;

function take(g, who, hips) { const h = g.hands[who]; for (const x of hips) { const i = h.indexOf(x); if (i < 0) return false; } for (const x of hips) h.splice(h.indexOf(x), 1); return true; }
function checkOut(g, who) { if (!g.hands[who].length) { g.over = true; g.out = who; } }

export function draw(g, who, from = "deck") {
  if (g.over || g.turn !== who || g.phase !== "draw") return null;
  if (from === "discard") { if (!g.discard.length) return null; const h = g.discard.pop(); g.hands[who].push(h); g.took = h; g.phase = "play"; return h; }
  if (!g.deck.length) restock(g);
  if (!g.deck.length) { g.over = true; return null; }
  const h = g.deck.pop(); g.hands[who].push(h); g.took = null; g.phase = "play"; return h;
}
/** The deck ran out: once per game, the discards (all but the top) are shuffled into a new night's deck. */
function restock(g) { if (g.nights >= 2 || g.discard.length < 2) return; const keep = g.discard.pop(); g.deck = shuffle(g.discard, g.r); g.discard = [keep]; g.nights++; }

/** Lay down a new set. Returns the meld, or null (on Level 3 a wrong try costs a point). */
export function layDown(g, who, hips) {
  if (g.over || g.turn !== who || g.phase !== "play") return null;
  const t = setType(g, hips);
  if (!t) { if (who === "me" && !levelOf(g).labels) g.misses++; return null; }
  if (!take(g, who, hips)) return null;
  const m = { id: g.nextId++, ...t, owner: who, cards: hips.map((hip) => ({ hip, by: who })) };
  g.melds.push(m); checkOut(g, who); return m;
}
export function layOff(g, who, hip, meldId) {
  if (g.over || g.turn !== who || g.phase !== "play") return null;
  const m = g.melds.find((x) => x.id === meldId);
  if (!m || !fits(g, hip, m)) { if (who === "me" && !levelOf(g).labels) g.misses++; return null; }
  if (!take(g, who, [hip])) return null;
  m.cards.push({ hip, by: who }); checkOut(g, who); return m;
}
/** Discard one card and end the turn. You can't throw back the card you just took from the discard pile. */
export function discard(g, who, hip) {
  if (g.over || g.turn !== who || g.phase !== "play") return false;
  if (hip === g.took && g.hands[who].length > 1) return false;
  if (!take(g, who, [hip])) return false;
  g.discard.push(hip); g.took = null; checkOut(g, who);
  if (!g.over) { if (!g.deck.length && g.nights >= 2) g.over = true; else { g.turn = who === "me" ? "or" : "me"; g.phase = "draw"; } }
  return true;
}

/** Points for each side. melded = cards each laid down (credited to whoever played the card). */
export function tally(g) {
  const side = (who) => { const melded = g.melds.flatMap((m) => m.cards).filter((c) => c.by === who).reduce((s, c) => s + pts(c.hip), 0);
    const hand = g.hands[who].reduce((s, h) => s + pts(h), 0), bonus = g.out === who ? OUT_BONUS : 0, miss = who === "me" ? g.misses * L3_MISS : 0;
    return { melded, hand, bonus, miss, total: melded - hand + bonus - miss }; };
  const me = side("me"), or = side("or");
  return { me, or, win: me.total > or.total, tie: me.total === or.total };
}

// ---- the Oracle's play ----
/** How much the Oracle wants to keep a card: partners in hand, and whether it fits the table. */
function keep(g, hand, hip) {
  const c = CARD[hip], L = levelOf(g); let v = 0;
  const same = hand.filter((h) => h !== hip && CARD[h].con === c.con).length; v += same * 2;
  if (L.colour) v += 0.6 * new Set(hand.filter((h) => h !== hip && CARD[h].cls === c.cls && CARD[h].con !== c.con).map((h) => CARD[h].con)).size;
  if (fitsAny(g, hip)) v += 5;
  return v - pts(hip) * 0.15; // with ties, throw away the bright (costly) one
}
/** Best sets in a hand: whole constellations first, then colour sets from what's left. */
export function findSets(g, hand) {
  const L = levelOf(g), left = [...hand], out = [];
  const byCon = {}; for (const h of left) (byCon[CARD[h].con] ||= []).push(h);
  for (const hs of Object.values(byCon)) if (hs.length >= 3) { out.push(hs.slice(0, 4)); for (const h of hs.slice(0, 4)) left.splice(left.indexOf(h), 1); }
  if (L.colour) {
    const byCls = {}; for (const h of left) (byCls[CARD[h].cls] ||= []).push(h);
    for (const hs of Object.values(byCls)) { const pick = []; const seen = new Set(); for (const h of hs) if (!seen.has(CARD[h].con)) { seen.add(CARD[h].con); pick.push(h); } if (pick.length >= 3) out.push(pick); }
  }
  return out;
}
/** The Oracle's turn as steps (a generator, so the room can animate each one). Each yield: { t, ... } */
export function* oracleTurn(g) {
  const L = levelOf(g), r = g.r, hand = g.hands.or, t = top(g);
  const wantTop = t != null && (fitsAny(g, t) || hand.filter((h) => CARD[h].con === CARD[t].con).length >= 2 ||
    (L.colour && new Set(hand.filter((h) => CARD[h].cls === CARD[t].cls && CARD[h].con !== CARD[t].con).map((h) => CARD[h].con)).size >= 2));
  const from = wantTop && r() < L.skill + 0.1 ? "discard" : "deck";
  const got = draw(g, "or", from); yield { t: "draw", from, hip: got };
  if (g.over) return;
  for (const set of findSets(g, hand)) { const m = layDown(g, "or", set); if (m) { yield { t: "meld", meld: m }; if (g.over) return; } }
  let again = true;
  while (again && hand.length > 1) { again = false;
    for (const h of [...hand]) { const m = fitsAny(g, h); if (m && hand.length > 1) { layOff(g, "or", h, m.id); yield { t: "layoff", hip: h, meld: m }; again = true; if (g.over) return; } } }
  const options = hand.filter((h) => h !== g.took || hand.length === 1);
  let pick = options.reduce((a, h) => (keep(g, hand, h) < keep(g, hand, a) ? h : a), options[0]);
  if (r() > L.skill) pick = options[Math.floor(r() * options.length)];
  discard(g, "or", pick); yield { t: "discard", hip: pick };
}

// ---- progress and rewards ----
export const room = (p) => { const x = ((p.rooms ||= {}).rummy ||= { plays: 0 }); x.wins ||= {}; x.games ||= {}; x.best ||= {}; x.cons ||= {}; x.full ||= {}; return x; };
export const TITLES = [{ at: 0, name: "Star Dealer" }, { at: 3, name: "Sky Shuffler" }, { at: 8, name: "Constellation Keeper" }, { at: 15, name: "Master of the Zodiac Table" }];
export const winsOf = (p) => Object.values(room(p).wins).reduce((s, n) => s + n, 0);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
/** Record a finished game. Returns { xp, essence, win, firstWin, best, newCons, newFull } */
export function settle(p, g) {
  const L = levelOf(g), x = room(p), s = tally(g), k = String(L.n);
  x.plays++; x.games[k] = (x.games[k] || 0) + 1;
  const firstWin = s.win && !x.wins[k]; if (s.win) x.wins[k] = (x.wins[k] || 0) + 1;
  const best = s.me.total > (x.best[k] ?? -Infinity); if (best) x.best[k] = s.me.total;
  const mine = g.melds.filter((m) => m.type === "con" && m.cards.some((c) => c.by === "me"));
  const newCons = [...new Set(mine.map((m) => m.key))].filter((c) => !x.cons[c]); for (const c of newCons) x.cons[c] = true;
  const newFull = mine.filter((m) => m.cards.length === 4 && m.owner === "me").map((m) => m.key).filter((c) => !x.full[c]); for (const c of newFull) x.full[c] = true;
  const xp = Math.round(Math.max(3, s.me.total) * L.mult);
  const essence = (s.win ? 4 * L.n : 0) + (firstWin ? 10 : 0) + 3 * newFull.length;
  return { xp, essence, win: s.win, tie: s.tie, firstWin, best, newCons, newFull, score: s };
}

// ---- card backs: chosen on the Essence store's Cards shelf (cardbacks.js), shared by every deck in the Chamber ----
export const backOf = (p) => equippedBack(p) || "cb-midnight";
export { CONS };
