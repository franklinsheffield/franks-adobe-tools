// Element Duel rules, kept pure for tests (no DOM). A 1-player card battle against the Oracle.
//   Each side has 20 Stability and a hand of 7 element cards (one atom each), dealt from its own shuffled deck.
//   On your turn put cards on the bench and React: if the bench is a real compound, its power hits the Oracle.
//   Power = atoms + √(−ΔHf)/8 (more exothermic, harder hit), changed by the round's lab condition, the bonus compound
//   and (Master) chain steps. Endothermic compounds cost the maker 1 Stability, unless heat or a spark pays for it.
//   A noble gas on its own can be raised as an inert shield (free, once a turn) that blocks the next hit.
//   Recycle: discard bench cards and draw (ends your turn). Then the Oracle plays.
//   Win: bring the Oracle to 0 Stability, or be the first to discover 5 different compounds.
// Progress lives in prog.rooms.duel: { plays, wins: {1,2,3}, played: {1,2,3}, codex: { id: 1 }, chains: { id: 1 }, look, seen }.
import { EL, poolOf, isNoble } from "./elements.js";
import { COMPOUNDS, BY_KEY, BY_ID, compoundsOf, keyOf, pretty, CHAINS } from "./compounds.js";
import { RIVAL, rivalTaste, RIVAL_PRIZE } from "./rivals.js";
import { MILESTONES } from "./uses.js";

export const START = 20, HAND = 7, GOAL = 5, SHIELD = 4, MAX_ROUNDS = 30;
export const LEVELS = [
  { n: 1, name: "Apprentice", what: "20 common elements, two-atom compounds, valid combos glow", mult: 1, hints: true, fizzle: 0, recycle: 7, undo: true, ai: "novice", oHand: 7 },
  { n: 2, name: "Chemist", what: "40 elements, real multi-atom formulas, charges must balance, no hints, the Oracle holds 8 cards", mult: 1.5, hints: false, fizzle: 1, recycle: 3, undo: true, ai: "sharp", oHand: 8 },
  { n: 3, name: "Master", what: "52 elements, reaction chains, a cunning Oracle holding 9 cards, no undo", mult: 2, hints: false, fizzle: 2, recycle: 2, undo: false, ai: "master", oHand: 9 },
];
for (const L of LEVELS) { L.pool = poolOf(L.n); L.deck = compoundsOf(L.n); }

// Lab conditions: one is drawn at random each round. Each is a real effect, simplified into a game rule.
export const CONDITIONS = [
  { id: "heat", emoji: "🔥", name: "High heat", rule: "Endothermic compounds cost no Stability. Metal oxides +1.", why: "Heat supplies the energy endothermic reactions soak up, and hot metals oxidise faster." },
  { id: "catalyst", emoji: "⚗️", name: "Catalyst", rule: "Compounds made industrially over a catalyst +3 (NH₃, NO, HNO₃, H₂SO₄…).", why: "A catalyst speeds a reaction up without being used up, like iron in the Haber–Bosch process." },
  { id: "water", emoji: "💧", name: "Water bath", rule: "Acids and bases +2.", why: "In water, acids release H⁺ ions and bases release OH⁻ ions: that is what makes them acids and bases." },
  { id: "oxygen", emoji: "🌬️", name: "Oxygen-rich air", rule: "Oxides +2.", why: "More oxygen drives oxidation: things burn far more fiercely in pure O₂." },
  { id: "argon", emoji: "🛡️", name: "Argon blanket", rule: "Oxides −2. Noble-gas shields block double.", why: "Welders flood the weld with argon so the hot metal can't react with oxygen." },
  { id: "spark", emoji: "⚡", name: "Electric spark", rule: "NO, NO₂ and H₂O +3. Endothermic compounds cost no Stability.", why: "Lightning makes NO and NO₂ out of air, and a spark sets off hydrogen and oxygen to make water." },
  { id: "cold", emoji: "❄️", name: "Cold trap", rule: "Gases −2.", why: "A cold trap freezes gases out of the air before they can do anything." },
  { id: "vacuum", emoji: "🫙", name: "Vacuum chamber", rule: "Gases +2.", why: "With no air in the way, a gas rushes out to fill the whole chamber." },
];
export const COND = Object.fromEntries(CONDITIONS.map((c) => [c.id, c]));

// ---- random numbers: a seedable generator so tests (and replays) are repeatable ----
export function rng(seed = Date.now()) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
function shuffle(r, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let uid = 0;
/** A fresh shuffled deck for a level: each element card w times, weighted toward the abundant elements. */
// At Chemist and Master the common elements get one extra copy each, so the bigger table doesn't clog every hand.
export const copiesOf = (e, L) => e.w + (L.n > 1 && e.tier === 1 && e.w > 1 ? 1 : 0);
export const deckOf = (L, r) => shuffle(r, L.pool.flatMap((e) => Array.from({ length: copiesOf(e, L) }, () => ({ id: ++uid, s: e.s }))));

// ---- chemistry helpers ----
export const countOf = (cards) => cards.reduce((o, c) => ((o[c.s] = (o[c.s] || 0) + 1), o), {});
/** The compound these cards make at this level, or null. */
export function compoundOf(cards, L) {
  const c = BY_KEY[keyOf(countOf(cards))];
  return c && c.tier <= L.n ? c : null;
}
/** Every compound of the level that this hand can make. */
export function formable(hand, L) {
  const have = countOf(hand);
  return L.deck.filter((c) => Object.entries(c.atoms).every(([s, n]) => (have[s] || 0) >= n));
}
/** Pick the hand cards that make compound c. */
export function cardsFor(hand, c) {
  const need = { ...c.atoms }, out = [];
  for (const card of hand) if (need[card.s] > 0) { need[card.s]--; out.push(card); }
  return out;
}
/** Can these atoms balance their charges using each element's common oxidation states? Returns one assignment or null. */
export function balance(atoms, usualOnly = false) {
  const list = Object.entries(atoms).flatMap(([s, n]) => Array(n).fill(s));
  if (list.some((s) => !EL[s] || isNoble(s))) return null;
  const pick = [];
  const go = (i, sum) => {
    if (i === list.length) return sum === 0;
    for (const o of usualOnly ? EL[list[i]].ox.slice(0, 1) : EL[list[i]].ox) { pick[i] = o; if (go(i + 1, sum + o)) return true; }
    return false;
  };
  if (list.length < 2 || !go(0, 0)) return null;
  return list.map((s, i) => [s, pick[i]]);
}
const sign = (o) => (o > 0 ? "+" + o : String(o));
/** Why a bench fizzled, in plain words. Apprentice and Chemist also name the real compound those elements make. */
export function fizzleWhy(cards, L) {
  const atoms = countOf(cards), els = Object.keys(atoms);
  if (els.length < 2) return els.length && isNoble(els[0]) ? "A noble gas alone won't react. Raise it as a shield instead." : "One kind of element on its own isn't a compound. Add a partner.";
  if (els.some(isNoble)) return "Noble gases have full outer shells, so they won't bond here. Raise them as a shield instead.";
  const real = L.deck.filter((c) => c.els.length === els.length && els.every((s) => c.atoms[s])).sort((a, b) => a.n - b.n);
  const b = balance(atoms, true);
  const ox = els.map((s) => `${s} is usually ${EL[s].ox.filter((o) => o).slice(0, 2).map(sign).join(" or ")}`).join(", ");
  let why = b ? "With their usual charges it balances, but that exact formula isn't a compound in this lab." : `The charges don't balance: ${ox}. The total has to be zero.`;
  if (L.n < 3 && real.length) why += ` These elements really make ${real.slice(0, 2).map((c) => pretty(c.f)).join(" or ")}.`;
  else if (!real.length) why += " These elements don't form a compound in this lab.";
  return why;
}

/** The power of a compound right now, and the reasons. */
export function powerOf(c, g, side) {
  const notes = [];
  let p = c.n + Math.round(Math.sqrt(Math.max(0, -c.dh)) / 8);
  if (c.dh < -400) notes.push("strongly exothermic");
  const cond = g.cond, add = (n, why) => { if (n) { p += n; notes.push(`${n > 0 ? "+" : ""}${n} ${why}`); } };
  if (cond === "heat" && c.metalOxide) add(1, "heat");
  if (cond === "catalyst" && c.tags.includes("cat")) add(3, "catalyst");
  if (cond === "water" && (c.tags.includes("acid") || c.tags.includes("base"))) add(2, c.tags.includes("acid") ? "acid in water" : "base in water");
  if (cond === "oxygen" && c.oxide) add(2, "oxygen-rich");
  if (cond === "argon" && c.oxide) add(-2, "argon blanket");
  if (cond === "spark" && ["NO", "NO2", "H2O"].includes(c.id)) add(3, "spark");
  if (cond === "cold" && c.gas) add(-2, "cold trap");
  if (cond === "vacuum" && c.gas) add(2, "vacuum");
  if (g.bonus === c.id) add(2, "bonus compound");
  const ch = chainStep(g, side, c); if (ch && ch.k > 0) add(2 * ch.k, ch.chain.name);
  return { power: Math.max(1, p), notes, cost: c.endo && cond !== "heat" && cond !== "spark" ? 1 : 0, chain: ch };
}
/** Master level: is c the next step of a chain this side has going (or the start of one)? { chain, k } */
export function chainStep(g, side, c) {
  if (g.level < 3) return null;
  const last = g[side].last;
  for (const ch of CHAINS) { const k = ch.steps.indexOf(c.id); if (k > 0 && ch.steps[k - 1] === last && g[side].chainOk) return { chain: ch, k }; }
  for (const ch of CHAINS) if (ch.steps[0] === c.id) return { chain: ch, k: 0 };
  return null;
}

// ---- the duel ----
export function newGame(level = 1, seed = Date.now(), rival = null) {
  const L = LEVELS[level - 1], r = rng(seed), rv = level === 3 ? RIVAL[rival] || null : null;
  const extra = (deck) => { if (rv) for (const s of rv.fav) if (L.pool.some((e) => e.s === s)) for (let k = 0; k < (rv.copies ?? 2); k++) deck.push({ id: ++uid, s }); return rv ? shuffle(r, deck) : deck; };
  const side = (n = HAND, mine = false) => { const deck = mine ? extra(deckOf(L, r)) : deckOf(L, r); return { hp: START, deck, hand: deck.splice(0, n), discard: [], found: [], shield: 0, last: null, chainOk: false, chains: [], bonusHits: 0, recycled: 0, shieldUsed: false }; };
  const g = { level, seed, r, round: 0, turn: "you", rival: rv ? rv.id : null, you: side(), oracle: side(L.oHand + (rv?.hand || 0), true), oMax: START + (rv?.hp || 0), bench: [], cond: null, bonus: null, log: [], over: null };
  g.oracle.hp = g.oMax; nextRound(g); return g;
}
const L_ = (g) => LEVELS[g.level - 1];
function draw(g, s) {
  const p = g[s];
  const size = s === "oracle" ? L_(g).oHand + ((g.rival && RIVAL[g.rival].hand) || 0) : HAND;
  while (p.hand.length < size) {
    if (!p.deck.length) { if (!p.discard.length) break; p.deck = shuffle(g.r, p.discard); p.discard = []; }
    p.hand.push(p.deck.shift());
  }
}
/** A new round: a new lab condition (never the same twice running) and a new bonus compound. */
export function nextRound(g) {
  g.round++; const prev = g.cond;
  g.cond = pick(g.r, CONDITIONS.filter((c) => c.id !== prev)).id;
  const L = L_(g), easy = L.deck.filter((c) => c.n <= (g.level === 1 ? 2 : 4) && !g.you.found.includes(c.id));
  g.bonus = pick(g.r, easy.length ? easy : L.deck).id;
  g.turn = "you"; g.you.shieldUsed = false; g.you.recycled = 0;
}
function check(g) {
  if (g.over) return g.over;
  if (g.oracle.hp <= 0) g.over = { winner: "you", how: "stability" };
  else if (g.you.hp <= 0) g.over = { winner: "oracle", how: "stability" };
  else if (g.you.found.length >= GOAL) g.over = { winner: "you", how: "discovery" };
  else if (g.oracle.found.length >= GOAL) g.over = { winner: "oracle", how: "discovery" };
  else if (g.round > MAX_ROUNDS) g.over = { winner: g.you.hp > g.oracle.hp ? "you" : g.you.hp < g.oracle.hp ? "oracle" : "draw", how: "time" };
  return g.over;
}

// bench (your side)
export function place(g, cardId) {
  if (g.over || g.turn !== "you") return false;
  const i = g.you.hand.findIndex((c) => c.id === cardId); if (i < 0) return false;
  g.bench.push(...g.you.hand.splice(i, 1)); return true;
}
/** Take a card back off the bench (not at Master level). */
export function unplace(g, cardId) {
  if (!L_(g).undo || g.turn !== "you") return false;
  const i = g.bench.findIndex((c) => c.id === cardId); if (i < 0) return false;
  g.you.hand.push(...g.bench.splice(i, 1)); return true;
}
export function clearBench(g) { if (!L_(g).undo) return false; g.you.hand.push(...g.bench); g.bench = []; return true; }

/** The core of a reaction, for either side. Returns the result for the UI. */
function react(g, s, cards, c) {
  const me = g[s], foe = g[s === "you" ? "oracle" : "you"], pw = powerOf(c, g, s);
  let dmg = pw.power, blocked = 0;
  if (foe.shield) { blocked = Math.min(foe.shield, dmg); dmg -= blocked; foe.shield = 0; }
  foe.hp = Math.max(0, foe.hp - dmg); me.hp = Math.max(0, me.hp - pw.cost);
  const isNew = !me.found.includes(c.id); if (isNew) me.found.push(c.id);
  if (g.bonus === c.id) me.bonusHits++;
  let chainDone = null;
  if (pw.chain) { me.chainOk = true; if (pw.chain.k === pw.chain.chain.steps.length - 1) { chainDone = pw.chain.chain; if (!me.chains.includes(chainDone.id)) me.chains.push(chainDone.id); me.chainOk = false; } }
  else me.chainOk = false;
  me.last = chainDone ? null : c.id;
  me.discard.push(...cards);
  const out = { side: s, ok: true, c, cards, power: pw.power, dmg, blocked, cost: pw.cost, notes: pw.notes, isNew, chain: pw.chain, chainDone };
  g.log.push(out); return out;
}

/** React with the bench. Fizzles cost Stability at Chemist (1) and Master (2); at Master the bench is lost and the turn ends. */
export function playBench(g) {
  if (g.over || g.turn !== "you" || !g.bench.length) return null;
  const L = L_(g), c = compoundOf(g.bench, L);
  if (!c) {
    const why = fizzleWhy(g.bench, L), cost = L.fizzle; g.you.hp = Math.max(0, g.you.hp - cost);
    const out = { side: "you", ok: false, why, cost, cards: [...g.bench], lost: !L.undo };
    if (!L.undo) { g.you.discard.push(...g.bench); g.bench = []; draw(g, "you"); endTurn(g); }
    check(g); return out;
  }
  const cards = g.bench; g.bench = [];
  const out = react(g, "you", cards, c); draw(g, "you"); check(g); if (!g.over) endTurn(g); return out;
}
/** Raise a lone noble gas on the bench as a shield. Free, once a turn. */
export function raiseShield(g) {
  if (g.over || g.turn !== "you" || g.you.shieldUsed || g.bench.length !== 1 || !isNoble(g.bench[0].s)) return null;
  const card = g.bench.pop(); g.you.discard.push(card); g.you.shieldUsed = true;
  g.you.shield = SHIELD * (g.cond === "argon" ? 2 : 1); return { s: card.s, shield: g.you.shield };
}
/** Recycle the bench cards: discard them and draw. Ends your turn. Limited per level. */
export function recycle(g) {
  if (g.over || g.turn !== "you") return null;
  const n = Math.min(g.bench.length, L_(g).recycle);
  const back = g.bench.splice(n); g.you.hand.push(...back);
  g.you.discard.push(...g.bench); g.bench = []; draw(g, "you"); endTurn(g); return { n };
}
function endTurn(g) { g.turn = "oracle"; }

// ---- the Oracle ----
/** The Oracle's move: { kind: "react", c, cards } | { kind: "recycle", cards } (plus shield). Pure: doesn't change g. */
export function oracleMove(g) {
  const L = L_(g), me = g.oracle, r = g.r, opts = formable(me.hand, L).map((c) => ({ c, ...powerOf(c, g, "oracle") }));
  const nob = me.hand.find((x) => isNoble(x.s));
  let shield = null;
  if (nob && !me.shield && (L.ai === "master" ? me.hp <= 12 : r() < 0.5)) shield = nob;
  const recycleJunk = () => {
    const useful = new Set(L.deck.flatMap((c) => c.els));
    let junk = me.hand.filter((x) => x !== shield && (!useful.has(x.s) || isNoble(x.s)));
    if (!junk.length) junk = shuffle(r, me.hand.filter((x) => x !== shield)).slice(0, 3);
    return { kind: "recycle", cards: junk.slice(0, L.recycle), shield };
  };
  if (!opts.length) return recycleJunk();
  if (L.ai === "novice" && r() < 0.2) return recycleJunk();
  const net = (o) => o.power - o.cost * 2 - (g.you.shield ? Math.min(g.you.shield, o.power) : 0) + (!me.found.includes(o.c.id) ? (me.found.length >= GOAL - 2 ? 6 : 1) : 0) + (o.chain && o.chain.k === 0 && L.ai === "master" ? 2 : 0) + rivalTaste(RIVAL[g.rival], o.c, me.found);
  let best;
  if (L.ai === "novice") best = pick(r, opts);
  else if (L.ai === "sharp") best = r() < 0.75 ? opts.reduce((a, b) => (b.power > a.power ? b : a)) : pick(r, opts);
  else best = opts.reduce((a, b) => (net(b) > net(a) ? b : a));
  return { kind: "react", c: best.c, cards: cardsFor(me.hand, best.c), shield };
}
/** Play the Oracle's turn. Returns what it did, then starts the next round. */
export function oracleTurn(g, move = oracleMove(g)) {
  if (g.over || g.turn !== "oracle") return null;
  const me = g.oracle, take = (cards) => { for (const c of cards) { const i = me.hand.indexOf(c); if (i >= 0) me.hand.splice(i, 1); } };
  let shield = null;
  if (move.shield && me.hand.includes(move.shield)) { take([move.shield]); me.discard.push(move.shield); me.shield = SHIELD * (g.cond === "argon" ? 2 : 1); shield = { s: move.shield.s, shield: me.shield }; }
  let out;
  if (move.kind === "react" && move.cards.every((c) => me.hand.includes(c))) { take(move.cards); out = react(g, "oracle", move.cards, move.c); }
  else { const cards = move.cards.filter((c) => me.hand.includes(c)); take(cards); me.discard.push(...cards); out = { side: "oracle", ok: false, recycled: cards.length }; }
  out.shield = shield;
  draw(g, "oracle"); if (!check(g)) { nextRound(g); check(g); }
  return out;
}

/** Apprentice hints: ids of hand cards that are part of something you could make. */
export function glowing(g) {
  const L = L_(g); if (!L.hints) return new Set();
  const all = [...g.you.hand, ...g.bench], ids = new Set();
  for (const c of formable(all, L)) for (const card of cardsFor(all, c)) ids.add(card.id);
  return ids;
}
/** The strongest thing you could make right now (Apprentice hint button). */
export function bestHint(g) {
  const L = L_(g), all = [...g.you.hand, ...g.bench], opts = formable(all, L);
  return opts.length ? opts.reduce((a, b) => (powerOf(b, g, "you").power > powerOf(a, g, "you").power ? b : a)) : null;
}

// ---- progress ----
export const TITLES = [{ at: 0, name: "Lab Assistant" }, { at: 8, name: "Bench Chemist" }, { at: 25, name: "Analyst" }, { at: 50, name: "Professor" }, { at: 80, name: "Master Chemist" }, { at: COMPOUNDS.length, name: "Mendeleev's Heir" }];
export const room = (p) => {
  const r = ((p.rooms ||= {}).duel ||= { plays: 0, wins: {}, played: {}, codex: {}, chains: {} });
  r.wins ||= {}; r.played ||= {}; r.codex ||= {}; r.chains ||= {}; return r;
};
export const codexCount = (p) => Object.keys(room(p).codex).length;
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
/** Settle a finished duel into progress. Returns { xp, essence, newCodex: [ids], newChains: [ids], won }. */
export function settle(p, g) {
  const r = room(p), L = L_(g), won = g.over && g.over.winner === "you";
  r.plays++; r.played[L.n] = (r.played[L.n] || 0) + 1; if (won) r.wins[L.n] = (r.wins[L.n] || 0) + 1;
  const newCodex = g.you.found.filter((id) => !r.codex[id]); for (const id of newCodex) r.codex[id] = 1;
  const newChains = g.you.chains.filter((id) => !r.chains[id]); for (const id of newChains) r.chains[id] = 1;
  const xp = won ? Math.round((12 + 2 * g.you.found.length) * L.mult) : 3 + g.you.found.length;
  const essence = (won ? Math.round(10 * L.mult) : 0) + newCodex.length * 2 + g.you.bonusHits * 3 + newChains.length * 10;
  let newRival = null;
  if (won && g.rival) { const rv = (r.rivals ||= {}); if (!rv[g.rival]) newRival = g.rival; rv[g.rival] = (rv[g.rival] || 0) + 1; }
  const count = Object.keys(r.codex).length, before = count - newCodex.length;
  const newMilestones = MILESTONES.filter((m) => before < m.at && count >= m.at);
  return { xp, essence: essence + (newRival ? RIVAL_PRIZE : 0) + newMilestones.reduce((n, m) => n + m.essence, 0), newCodex, newChains, won, newRival, newMilestones };
}
export { COMPOUNDS, BY_ID, CHAINS, pretty };
