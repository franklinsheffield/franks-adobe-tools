// Rune and Glyph Decoder rules: no DOM here, so the tests can run it in Node.
import { SCRIPTS, LEVELS, levelsOf, byId } from "./levels.js";
import { mayaDate } from "../../../src/modules/mayan/calendar.js";

const chars = (s) => Array.from(s);
export const signOf = (script, g) => SCRIPTS[script].signs.find((s) => s.g === g) || null;

/** The glyphs of a level that are real signs (separators, the Ogham feather marks and spaces dropped). */
export function glyphsOf(level) {
  if (level.script === "maya") return level.text.map(String);
  return chars(level.text).filter((g) => signOf(level.script, g));
}
/** The sounds the player has to tap, in order. */
export const target = (level) => glyphsOf(level).map((g) => (level.script === "maya" ? g : signOf(level.script, g).v));

/** Signs the player has met in this script up to and including this level. */
export function taught(level) {
  if (level.script === "maya") return SCRIPTS.maya.signs;
  const seen = new Set();
  for (const l of levelsOf(level.script)) { for (const g of chars(l.teach || "")) seen.add(g); if (l.id === level.id) break; }
  return SCRIPTS[level.script].signs.filter((s) => seen.has(s.g));
}
/** Tiles to tap: each distinct sound met so far, in the script's own order. */
export function tiles(level) {
  const out = []; for (const s of taught(level)) if (!out.includes(s.v)) out.push(s.v);
  return out;
}

/** Compare taps so far against the answer. */
export function check(level, picks) {
  const t = target(level);
  for (let i = 0; i < picks.length; i++) if (picks[i] !== t[i]) return { ok: false, wrongAt: i, done: false };
  return { ok: true, wrongAt: -1, done: picks.length === t.length };
}
export const hint = (level, picks) => target(level)[picks.length] ?? null;

/** 3 stars: from memory. 2: peeked at the codebook or a couple of slips. 1: needed hints. */
export function starsFor({ peeks = 0, hints = 0, misses = 0 }) {
  if (hints > 0 || misses > 4) return 1;
  if (peeks > 0 || misses > 0) return 2;
  return 3;
}

/** Spell Latin letters in a script (digraphs first). Unknown characters are skipped. */
export function writeIn(script, text) {
  const w = SCRIPTS[script].write, s = String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const words = []; let cur = "";
  for (let i = 0; i < s.length; ) {
    const two = s.slice(i, i + 2);
    if (w[two]) { cur += w[two]; i += 2; continue; }
    if (w[s[i]]) cur += w[s[i]]; else if (/\s|-/.test(s[i]) && cur) { words.push(cur); cur = ""; }
    i++;
  }
  if (cur) words.push(cur);
  return words;
}

/** A Gregorian date ("YYYY-MM-DD") in the Maya calendar, or null. */
export function mayaOf(iso) {
  const t = String(iso || "").trim(), dd = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t); // DD/MM/YYYY as typed, or year-first
  const m = dd ? [t, dd[3], dd[2], dd[1]] : /^(-?\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(t); if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const r = mayaDate({ year: y, month: mo, day: d });
  return r.days < 0 ? null : r;
}

// ---- progress: kept in state.prog.rooms.decoder = { plays, solved: { levelId: stars }, codex: [titles] } ----
export const XP_PER_STAR = 5;
export const ESSENCE_PER_STAR = 5;
export const FIRST_CLEAR = 5;
export const dec = (p) => { const d = ((p.rooms ||= {}).decoder ||= {}); d.plays ||= 0; d.solved ||= {}; d.codex ||= []; return d; };

/** Score a finished level. Returns what to award; only improvements earn, so replays are free practice. */
export function complete(p, id, stars) {
  const d = dec(p), before = d.solved[id] || 0, lvl = byId(id);
  const gained = Math.max(0, stars - before), first = !before;
  d.plays++; if (stars > before) d.solved[id] = stars;
  let newCodex = null;
  if (lvl && lvl.codex && !d.codex.includes(lvl.codex)) { d.codex.push(lvl.codex); newCodex = lvl.codex; }
  const power = stars === 3 && before < 3 ? grantPower(p, id) : null; // a power card for every new ★★★
  return { first, stars, best: Math.max(stars, before), power, xp: gained * XP_PER_STAR + (first ? FIRST_CLEAR : 0), essence: gained * ESSENCE_PER_STAR + (first ? FIRST_CLEAR : 0), newCodex };
}
export const unlocked = (p, id) => { const l = byId(id), list = levelsOf(l.script), i = list.indexOf(l); return i === 0 || !!dec(p).solved[list[i - 1].id]; };
export const scriptStars = (p, script) => levelsOf(script).reduce((n, l) => n + (dec(p).solved[l.id] || 0), 0);
export const totalStars = () => LEVELS.length * 3;

// ---- the card game: Scribe's Hand ----
// The inscription lies on the table as glyph cards. The player holds sound cards and plays the right one onto the next
// glyph. The deck holds one card for every glyph plus decoys (other sounds met so far), loosely in reading order, so
// the card you need is never far away. Drawing costs 1 ink, a wrong card costs 2, a right card refills 1 (up to the
// well's size); run out of ink and the level is lost.
export const HAND = 5, HAND_MAX = 7;
export const INK_DRAW = 1, INK_MISS = 2, INK_RIGHT = 1;
/** The ink well for a level: room for a few draws and a slip or two. */
export const inkFor = (level) => Math.min(12, 5 + Math.ceil(target(level).length / 4));
const rng = (seed) => { let h = [...String(seed)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) || 1; return () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296); };
/** Build the deck (top first). `seed` makes it repeatable for tests; the room passes a fresh one each deal. */
export function buildDeck(level, seed = level.id) {
  const R = rng(seed), need = target(level), pool = tiles(level).filter((v) => !need.includes(v));
  const extra = pool.length ? pool : tiles(level);
  const decoys = Array.from({ length: Math.min(4, Math.ceil(need.length / 2) + 2) }, () => extra[Math.floor(R() * extra.length)]);
  const seq = [];
  need.forEach((v) => { if (decoys.length && R() < 0.55) seq.push(decoys.pop()); seq.push(v); });
  seq.push(...decoys);
  for (let i = 0; i + 1 < seq.length; i++) if (R() < 0.35) [seq[i], seq[i + 1]] = [seq[i + 1], seq[i]]; // loosen the order a little
  return seq.map((v, i) => ({ id: i, v }));
}
/** A fresh game state. */
export function deal(level, seed) { const deck = buildDeck(level, seed); return { deck, hand: deck.splice(0, HAND), picks: [], ink: inkFor(level), well: inkFor(level), peeks: 0, hints: 0, misses: 0, draws: 0, lost: false }; }
/** Play a card from the hand onto the next glyph. Returns { ok, done, lost }. Wrong cards go to the bottom of the deck. */
export function playCard(level, g, cardId) {
  const i = g.hand.findIndex((c) => c.id === cardId); if (i < 0 || g.lost) return { ok: false, done: false, lost: g.lost };
  const card = g.hand[i], r = check(level, [...g.picks, card.v]);
  if (!r.ok) { g.misses++; g.ink -= INK_MISS; g.hand.splice(i, 1); g.deck.push(card); if (g.deck.length && g.hand.length < HAND) g.hand.push(g.deck.shift()); g.lost = g.ink <= 0; return { ok: false, done: false, lost: g.lost }; }
  g.hand.splice(i, 1); g.picks.push(card.v); g.ink = Math.min(g.well, g.ink + INK_RIGHT);
  if (g.deck.length && g.hand.length < HAND) g.hand.push(g.deck.shift());
  return { ok: true, done: r.done, lost: false };
}
/** Draw one card for 1 ink. With a full hand, the oldest card goes to the bottom of the deck first. */
export function drawCard(level, g) {
  if (g.lost || !g.deck.length || g.ink < INK_DRAW) return null;
  if (g.hand.length >= HAND_MAX) g.deck.push(g.hand.shift());
  const c = g.deck.shift(); g.hand.push(c); g.ink -= INK_DRAW; g.draws++; g.lost = g.ink <= 0 && !g.hand.some((h) => h.v === needed(level, g)); return c;
}
/** The sound the next glyph needs. */
export const needed = (level, g) => target(level)[g.picks.length] ?? null;

// ---- power cards: earned with ★★★, kept in a satchel (prog.rooms.decoder.powers), up to 2 used per level ----
//   rosetta: a wild card, plays as the sound the glowing glyph needs (like the Rosetta Stone's three scripts).
//   ink:     an ink pot, +3 ink (up to the well's size).
//   scholar: look at the top 3 cards of the deck and take one into your hand, free.
export const POWERS = {
  rosetta: { emoji: "🗿", name: "Rosetta", note: "Wild: plays as the sound the glowing glyph needs" },
  ink: { emoji: "🫙", name: "Ink pot", note: "+3 ink" },
  scholar: { emoji: "🦉", name: "Scholar", note: "See the top 3 cards and take one free" },
};
export const POWER_ORDER = ["rosetta", "ink", "scholar"], POWER_CAP = 5, POWERS_PER_LEVEL = 2;
/** The satchel; new players start with one of each so they meet them. */
export const satchel = (p) => { const d = dec(p); d.powers ||= { rosetta: 1, ink: 1, scholar: 1 }; return d.powers; };
/** Give a power card (which one cycles with the level, so it is repeatable in tests). Returns its kind or null when full. */
export function grantPower(p, id = "") {
  const s = satchel(p), start = [...String(id)].reduce((n, c) => n + c.charCodeAt(0), 0) % 3;
  for (let k = 0; k < 3; k++) { const kind = POWER_ORDER[(start + k) % 3]; if ((s[kind] || 0) < POWER_CAP) { s[kind] = (s[kind] || 0) + 1; return kind; } }
  return null;
}
/** Can this power be used now? */
export const canPower = (p, g, kind) => !g.lost && (satchel(p)[kind] || 0) > 0 && (g.powers || 0) < POWERS_PER_LEVEL && !g.noPowers
  && (kind !== "ink" || g.ink < g.well) && (kind !== "scholar" || g.deck.length > 0);
/** Use a power. rosetta -> { ok, done }; ink -> { ink }; scholar -> { peek: [cards] } (then takePeek). */
export function usePower(level, p, g, kind) {
  if (!canPower(p, g, kind)) return null;
  satchel(p)[kind]--; g.powers = (g.powers || 0) + 1;
  if (kind === "rosetta") { const v = needed(level, g); g.picks.push(v); g.ink = Math.min(g.well, g.ink + INK_RIGHT); return { ok: true, done: g.picks.length === target(level).length, v }; }
  if (kind === "ink") { g.ink = Math.min(g.well, g.ink + 3); return { ink: g.ink }; }
  return { peek: g.deck.slice(0, 3) };
}
/** After a Scholar: take one of the top 3 cards into the hand (a full hand returns its oldest card under the deck). */
export function takePeek(g, cardId) {
  const i = g.deck.slice(0, 3).findIndex((c) => c.id === cardId); if (i < 0) return null;
  const [c] = g.deck.splice(i, 1); if (g.hand.length >= HAND_MAX) g.deck.push(g.hand.shift()); g.hand.push(c); return c;
}
