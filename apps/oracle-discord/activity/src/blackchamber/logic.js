// Black Chamber rules: no DOM. A duel is one cryptogram against one rival's clock. You map cipher letters to plain
// letters; when every mapping is right, you've broken it. Hints reveal one letter and cost HINT_COST seconds.
// Win = broken before the rival's time runs out. Score = seconds to spare × level multiplier (minimum 1 if broken).
import { RIVALS, LEVELS, HINT_COST, MIN_LETTERS, ETAOIN, rivalOf } from "./data.js";
import { LINES } from "../cipherdesk/data.js";
import { dailySeed, todayKey } from "../daily.js";

const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const letters = (s) => s.replace(/[^A-Z]/g, "");
/** The cryptogram pool: Cipher Desk lines long enough to break by counting. */
export const POOL = LINES.filter((l) => letters(l.plain).length >= MIN_LETTERS);

/** A substitution key with no letter left as itself (a derangement), like the hand-made keys of the period. */
export function keyOf(rand) {
  for (;;) { const b = [...A]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } if (b.every((c, i) => c !== A[i])) return b.join(""); }
}
export const encipher = (plain, key) => [...plain].map((c) => (A.includes(c) ? key[A.indexOf(c)] : c)).join("");

export function room(p) {
  p.rooms = p.rooms || {}; const r = (p.rooms.blackchamber = p.rooms.blackchamber || {});
  r.plays ||= 0; r.wins ||= {}; r.best ||= {}; r.beaten = Array.isArray(r.beaten) ? r.beaten : []; r.broken = Array.isArray(r.broken) ? r.broken : [];
  return r;
}

/** Start a duel. rival: id (defaults to the level's first not-yet-beaten rival). */
export function start(L, { seed = null, rival = null, daily = null, beaten = [] } = {}) {
  const rand = seed == null ? Math.random : rng(seed);
  const line = POOL[Math.floor(rand() * POOL.length)], key = keyOf(rand), text = encipher(line.plain, key);
  const pair = RIVALS.filter((r) => r.lvl === L.n), R = rivalOf(rival) || pair.find((r) => !beaten.includes(r.id)) || pair[0];
  const d = { L, line: line.id, plain: line.plain, key, text, rival: R.id, secs: R.secs, guess: {}, given: [], hints: 0, wrongs: 0, done: false, won: false, daily, t0: null, used: 0 };
  // give the level's starting letters: the commonest cipher letters, mapped right
  for (const c of commonest(text).slice(0, L.given)) { d.guess[c] = plainOf(d, c); d.given.push(c); }
  return d;
}
/** Cipher letters in the cryptogram, commonest first (ties by first appearance). */
export function commonest(text) {
  const n = {}, first = {}; [...text].forEach((c, i) => { if (A.includes(c)) { n[c] = (n[c] || 0) + 1; if (!(c in first)) first[c] = i; } });
  return Object.keys(n).sort((a, b) => n[b] - n[a] || first[a] - first[b]);
}
export const counts = (text) => { const n = {}; for (const c of text) if (A.includes(c)) n[c] = (n[c] || 0) + 1; return n; };
export const plainOf = (d, c) => A[d.key.indexOf(c)];
/** Assign a plain letter to a cipher letter (or clear it with ""). A plain letter can belong to one cipher letter only. */
export function assign(d, c, p) {
  if (d.done || d.given.includes(c) || !A.includes(c)) return false;
  if (!p) { delete d.guess[c]; return true; }
  for (const k of Object.keys(d.guess)) if (d.guess[k] === p && !d.given.includes(k)) delete d.guess[k];
  if (Object.values(d.guess).includes(p)) return false; // a given letter already holds it
  d.guess[c] = p; return true;
}
/** The working text: guessed letters filled in, the rest as underscores. */
export const working = (d) => [...d.text].map((c) => (A.includes(c) ? d.guess[c] || "_" : c)).join("");
export const solved = (d) => [...new Set(letters(d.text))].every((c) => d.guess[c] === plainOf(d, c));
/** Wrong guesses so far (cipher letters mapped to the wrong plain letter). */
export const wrongOnes = (d) => Object.keys(d.guess).filter((c) => d.guess[c] !== plainOf(d, c));
/** A hint: fix the commonest unsolved cipher letter. Costs HINT_COST seconds. */
export function hint(d) {
  if (d.done) return null; const c = commonest(d.text).find((x) => d.guess[x] !== plainOf(d, x)); if (!c) return null;
  assign(d, c, ""); for (const k of Object.keys(d.guess)) if (d.guess[k] === plainOf(d, c)) delete d.guess[k];
  d.guess[c] = plainOf(d, c); d.given.push(c); d.hints++; return c;
}
/** Seconds left on the rival's clock after `elapsed` seconds of play, with hint costs. */
export const left = (d, elapsed) => Math.max(0, Math.round(d.secs - elapsed - d.hints * HINT_COST));
/** Finish: won if solved with time left. */
export function finishDuel(d, elapsed) {
  d.done = true; d.used = elapsed; const t = left(d, elapsed); d.won = solved(d) && t > 0;
  d.score = d.won ? Math.max(1, Math.round(t * d.L.mult / 10)) : 0; return d;
}

/** Bank a duel. Returns { won, xp, essence, best, newRival, newLine }. */
export function settle(p, d) {
  const r = room(p); r.plays++;
  if (d.won) r.wins[d.L.n] = (r.wins[d.L.n] || 0) + 1;
  const best = d.score > (r.best[d.L.n] || 0); if (best) r.best[d.L.n] = d.score;
  const newRival = d.won && !r.beaten.includes(d.rival); if (newRival) r.beaten.push(d.rival);
  const newLine = d.won && !r.broken.includes(d.line); if (newLine) r.broken.push(d.line);
  return { won: d.won, xp: d.score + (newRival ? 10 : 0), essence: d.score + (newRival ? 15 : 0), best, newRival, newLine };
}
/** Fastest first among those who broke it; the rest by letters right. rows: { id: { t, ok, right, name } } */
export function duelRank(results) {
  const rows = Object.entries(results).map(([id, r]) => ({ id, ...r }));
  rows.sort((a, b) => (b.ok - a.ok) || (a.ok ? a.t - b.t : b.right - a.right));
  return rows.map((r, i) => ({ ...r, place: i + 1 }));
}
export function dailyOf(day = todayKey()) { const seed = dailySeed("blackchamber", day); return { seed, L: LEVELS[seed % 3], day }; }
export { LEVELS, RIVALS, ETAOIN };
