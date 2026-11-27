import { equippedBack } from "../cardbacks.js";
// Constellation Rummy rules (pure, no DOM). You play the Oracle. Each turn: draw one card (deck or the top discard),
// lay down sets or add cards to sets on the table, then discard one. Sets: 3 or 4 stars of one constellation, and from
// Level 2 also 3+ stars of the same spectral class from different constellations. Empty your hand to go out.
// Score = points of the cards you laid down (by brightness) minus the points still in your hand, +5 for going out.
import { CARD, LEVELS, CONS, pts } from "./deck.js";
export { LEVELS, pts };

export const OUT_BONUS = 5, L3_MISS = 1;
/** Small seeded random generator so games and tests can be replayed. */
export function rng(seed = Date.now()) { let a = seed >>> 0; const f = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; f.state = () => a; return f; }
export function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** A fresh game at a level. o.seats = seat ids in turn order (default ["me", "or"]: you and the Oracle); o.persona = { seatId: persona key }
 *  for Oracle seats. g.hands[seat] hold HIP numbers. With 3 or 4 seats more constellations join the deck so everyone gets a full hand. */
export function newGame(L, seed = Date.now(), o = {}) {
  const seats = o.seats || ["me", "or"], need = seats.length * L.hand + 10, cons = [...L.cons];
  for (const c of LEVELS[LEVELS.length - 1].cons) if (cons.length * 4 < need && !cons.includes(c)) cons.push(c);
  const r = rng(seed), deck = shuffle(Object.values(CARD).filter((c) => cons.includes(c.con)).map((c) => c.hip), r);
  const g = { level: L.n, seed, r, deck, discard: [], seats, cons, persona: o.persona || {}, hands: Object.fromEntries(seats.map((s) => [s, []])), melds: [], turn: seats[0], phase: "draw",
    took: null, miss: {}, nights: 1, over: false, out: null, nextId: 1 };
  for (let i = 0; i < L.hand; i++) for (const s of seats) g.hands[s].push(deck.pop());
  g.discard.push(deck.pop());
  return g;
}
/** The seat after this one. */
export const nextSeat = (g, who) => g.seats[(g.seats.indexOf(who) + 1) % g.seats.length];
/** For saving or sending a game: plain JSON (the random generator becomes its state). */
export const freeze = (g) => ({ ...g, r: undefined, rs: g.r ? g.r.state() : g.rs });
export const thaw = (x) => ({ ...x, r: rng(x.rs) });
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
  if (!t) { if (!levelOf(g).labels) g.miss[who] = (g.miss[who] || 0) + 1; return null; }
  if (!take(g, who, hips)) return null;
  const m = { id: g.nextId++, ...t, owner: who, cards: hips.map((hip) => ({ hip, by: who })) };
  g.melds.push(m); checkOut(g, who); return m;
}
export function layOff(g, who, hip, meldId) {
  if (g.over || g.turn !== who || g.phase !== "play") return null;
  const m = g.melds.find((x) => x.id === meldId);
  if (!m || !fits(g, hip, m)) { if (!levelOf(g).labels) g.miss[who] = (g.miss[who] || 0) + 1; return null; }
  if (!take(g, who, [hip])) return null;
  m.cards.push({ hip, by: who }); checkOut(g, who); return m;
}
/** Discard one card and end the turn. You can't throw back the card you just took from the discard pile. */
export function discard(g, who, hip) {
  if (g.over || g.turn !== who || g.phase !== "play") return false;
  if (hip === g.took && g.hands[who].length > 1) return false;
  if (!take(g, who, [hip])) return false;
  g.discard.push(hip); g.took = null; checkOut(g, who);
  if (!g.over) { if (!g.deck.length && g.nights >= 2) g.over = true; else { g.turn = nextSeat(g, who); g.phase = "draw"; } }
  return true;
}

/** Points for each seat. melded = cards each laid down (credited to whoever played the card). you = whose view:
 *  me = your line, or = the best other seat, win = you beat every other seat, place = 1 for first. */
export function tally(g, you = "me") {
  const side = (who) => { const melded = g.melds.flatMap((m) => m.cards).filter((c) => c.by === who).reduce((s, c) => s + pts(c.hip), 0);
    const hand = g.hands[who].reduce((s, h) => s + pts(h), 0), bonus = g.out === who ? OUT_BONUS : 0, miss = (g.miss[who] || 0) * L3_MISS;
    return { melded, hand, bonus, miss, total: melded - hand + bonus - miss }; };
  const by = Object.fromEntries(g.seats.map((s) => [s, side(s)])), me = by[you];
  const rest = g.seats.filter((s) => s !== you), best = rest.reduce((a, s) => (by[s].total > by[a].total ? s : a), rest[0]), or = by[best];
  const place = 1 + rest.filter((s) => by[s].total > me.total).length;
  return { by, me, or, best, win: rest.every((s) => me.total > by[s].total), tie: me.total === or.total, place };
}

// ---- the Oracle's play ----
// Oracle opponents. Each plays a different style and has its own lines (room.js) and a first-win Essence prize.
export const PERSONAS = {
  seer: { key: "seer", name: "The Oracle", emoji: "🔮", style: "Plays a steady, balanced game.", prize: 0 },
  magpie: { key: "magpie", name: "Magpie", emoji: "🐦‍⬛", style: "Grabs almost every discard and adds to every set it can.", prize: 15 },
  hoarder: { key: "hoarder", name: "Hoarder", emoji: "💰", style: "Keeps the brightest stars and throws away the dim ones.", prize: 15 },
  trickster: { key: "trickster", name: "Trickster", emoji: "🃏", style: "Hides its sets until it can go out at once, and throws bait.", prize: 20 },
};
export const personaOf = (g, who) => PERSONAS[g.persona?.[who]] || PERSONAS.seer;

/** How much the Oracle wants to keep a card: partners in hand, and whether it fits the table. */
function keep(g, hand, hip, P = PERSONAS.seer) {
  const c = CARD[hip], L = levelOf(g); let v = 0;
  const same = hand.filter((h) => h !== hip && CARD[h].con === c.con).length; v += same * 2;
  if (L.colour) v += 0.6 * new Set(hand.filter((h) => h !== hip && CARD[h].cls === c.cls && CARD[h].con !== c.con).map((h) => CARD[h].con)).size;
  if (fitsAny(g, hip)) v += 5;
  return v + pts(hip) * (P.key === "hoarder" ? 0.8 : -0.15); // with ties, throw away the bright (costly) one; the Hoarder keeps it
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
/** An Oracle seat's turn as steps (a generator, so the room can animate each one). Each yield: { t, who, ... } */
export function* oracleTurn(g, who = "or") {
  const L = levelOf(g), r = g.r, hand = g.hands[who], t = top(g), P = personaOf(g, who);
  const partners = t != null ? hand.filter((h) => CARD[h].con === CARD[t].con).length : 0;
  const wantTop = t != null && (fitsAny(g, t) || partners >= 2 ||
    (L.colour && new Set(hand.filter((h) => CARD[h].cls === CARD[t].cls && CARD[h].con !== CARD[t].con).map((h) => CARD[h].con)).size >= 2));
  let from = wantTop && r() < L.skill + 0.1 ? "discard" : "deck";
  if (t != null && P.key === "magpie" && (wantTop || partners >= 1) && r() < 0.95) from = "discard";
  if (t != null && P.key === "hoarder" && pts(t) >= 2 && r() < 0.8) from = "discard";
  const got = draw(g, who, from); yield { t: "draw", who, from, hip: got };
  if (g.over) return;
  const sets = findSets(g, hand);
  // the Trickster keeps its sets hidden until it can go out in one go, or the night is nearly over, or someone is close to going out
  let hold = false;
  if (P.key === "trickster" && sets.length) {
    const used = new Set(sets.flat()), loose = hand.filter((h) => !used.has(h) && !fitsAny(g, h)).length;
    const late = g.deck.length < 8 || g.seats.some((s) => s !== who && g.hands[s].length <= 3);
    hold = loose > 1 && !late;
  }
  if (!hold) for (const set of sets) { const m = layDown(g, who, set); if (m) { yield { t: "meld", who, meld: m }; if (g.over) return; } }
  let again = !hold || P.key !== "trickster";
  while (again && hand.length > 1) { again = false;
    for (const h of [...hand]) { const m = fitsAny(g, h); if (m && hand.length > 1) { layOff(g, who, h, m.id); yield { t: "layoff", who, hip: h, meld: m }; again = true; if (g.over) return; } } }
  const options = hand.filter((h) => h !== g.took || hand.length === 1);
  let pick = options.reduce((a, h) => (keep(g, hand, h, P) < keep(g, hand, a, P) ? h : a), options[0]);
  if (r() > L.skill) pick = options[Math.floor(r() * options.length)];
  let bait = false;
  if (P.key === "trickster" && r() < 0.3) { // bait: throw away one of a pair, as if it didn't want that constellation
    const pair = options.find((h) => hand.filter((x) => x !== h && CARD[x].con === CARD[h].con).length === 1 && !fitsAny(g, h));
    if (pair != null) { pick = pair; bait = true; }
  }
  discard(g, who, pick); yield { t: "discard", who, hip: pick, bait };
}

// ---- progress and rewards ----
export const room = (p) => { const x = ((p.rooms ||= {}).rummy ||= { plays: 0 }); x.wins ||= {}; x.games ||= {}; x.best ||= {}; x.cons ||= {}; x.full ||= {}; return x; };
export const TITLES = [{ at: 0, name: "Star Dealer" }, { at: 3, name: "Sky Shuffler" }, { at: 8, name: "Constellation Keeper" }, { at: 15, name: "Master of the Zodiac Table" }];
export const winsOf = (p) => Object.values(room(p).wins).reduce((s, n) => s + n, 0);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
/** Record a finished game for seat you. Returns { xp, essence, win, firstWin, best, newCons, newFull, beat } (beat = a persona beaten for the first time). */
export function settle(p, g, you = "me") {
  const L = levelOf(g), x = room(p), s = tally(g, you), k = String(L.n);
  x.plays++; x.games[k] = (x.games[k] || 0) + 1;
  const firstWin = s.win && !x.wins[k]; if (s.win) x.wins[k] = (x.wins[k] || 0) + 1;
  const best = s.me.total > (x.best[k] ?? -Infinity); if (best) x.best[k] = s.me.total;
  const mine = g.melds.filter((m) => m.type === "con" && m.cards.some((c) => c.by === you));
  const newCons = [...new Set(mine.map((m) => m.key))].filter((c) => !x.cons[c]); for (const c of newCons) x.cons[c] = true;
  const newFull = mine.filter((m) => m.cards.length === 4 && m.owner === you).map((m) => m.key).filter((c) => !x.full[c]); for (const c of newFull) x.full[c] = true;
  const xp = Math.round(Math.max(3, s.me.total) * L.mult);
  x.beat ||= {}; let beat = null;
  if (s.win) for (const o of g.seats) { const P = g.persona?.[o] && PERSONAS[g.persona[o]]; if (P && P.prize && !x.beat[P.key]) { x.beat[P.key] = true; beat = beat || P; } }
  const essence = (s.win ? 4 * L.n : 0) + (firstWin ? 10 : 0) + 3 * newFull.length + (beat ? beat.prize : 0);
  return { xp, essence, win: s.win, tie: s.tie, firstWin, best, newCons, newFull, score: s, beat };
}

// ---- card backs: chosen on the Essence store's Cards shelf (cardbacks.js), shared by every deck in the Chamber ----
export const backOf = (p) => equippedBack(p) || "cb-midnight";
export { CONS };
