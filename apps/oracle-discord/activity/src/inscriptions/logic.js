// Inscription Tray rules. A round brings 5 unlabelled finds. Each find has 4 ink drops: every test (direction, sign
// count, tool, word breaks, telltale mark) costs a drop, and so does a wrong name. A right name scores the drops left x
// the level multiplier. Win a round with 3 of 5 named; perfect = all 5 named with no wrong guess.
// Progress lives in prog.rooms.inscriptions = { plays, wins: {1,2,3}, best: {1,2,3}, found: [script ids], speed,
// look: { light, copy, tray } }. found is what the Cipher Desk reads: every identified script opens its documents.
import { SCRIPTS, LEVELS, ROUND, DROPS, CHOICES, TESTS, TYPES, script } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

export const WIN_AT = 3, SPEED_PAY = 2, RACE_WIN = 15, FOUND_PAY = 3;
export function room(p) {
  const r = ((p.rooms ||= {}).inscriptions ||= { plays: 0 });
  r.wins ||= {}; r.best ||= {}; r.found ||= []; r.speed ||= 0; r.look ||= {};
  return r;
}
/** The script ids this player has identified (the Cipher Desk and Tree of Letters read this). */
export const foundScripts = (p) => room(p).found.slice();
/** A small seedable RNG (mulberry32), so a daily or a race deals everyone the same finds. */
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** The answer choices for one find: the answer and CHOICES-1 others from the level's pool, shuffled. */
export function choicesFor(L, id, rand = Math.random) {
  return shuffle([id, ...shuffle(L.pool.filter((x) => x !== id), rand).slice(0, CHOICES - 1)], rand);
}
/** Deal ROUND distinct finds from the level's pool. Level 2 and 3 rounds lean on their own new scripts (3 of 5). */
export function deal(L, rand = Math.random) {
  const fresh = shuffle(SCRIPTS.filter((s) => s.level === L.n).map((s) => s.id), rand), older = shuffle(L.pool.filter((id) => !fresh.includes(id)), rand);
  const ids = L.n === 1 ? fresh.slice(0, ROUND) : shuffle([...fresh.slice(0, 3), ...older.slice(0, ROUND - 3)], rand);
  return ids.map((id) => ({ id, choices: choicesFor(L, id, rand), drops: DROPS, tests: [], wrong: [], done: false, right: false }));
}
export function start(L, { seed = null, daily = null } = {}) {
  const rand = seed ? rng(seed) : Math.random;
  return { level: L.n, L, items: deal(L, rand), i: 0, score: 0, daily };
}
export const current = (run) => run.items[run.i];
/** Run a test on the current find: its clue text, or null if done already, unknown, or it would spend the last drop. */
export function test(run, k) {
  const it = current(run); if (!it || it.done || it.tests.includes(k) || !TESTS.some((t) => t.k === k) || it.drops <= 1) return null;
  it.tests.push(k); it.drops--; return script(it.id)[k];
}
/** Name a script for the current find: "right" | "wrong" | "out" (no drops left). */
export function guess(run, id) {
  const it = current(run); if (!it || it.done) return null;
  if (id === it.id) { it.done = it.right = true; run.score += Math.round(it.drops * run.L.mult); return "right"; }
  if (!it.wrong.includes(id)) it.wrong.push(id); it.drops--;
  if (it.drops <= 0) { it.done = true; return "out"; }
  return "wrong";
}
export const next = (run) => (++run.i < run.items.length);
export const rightCount = (run) => run.items.filter((x) => x.right).length;
export const won = (run) => rightCount(run) >= WIN_AT;
export const perfect = (run) => run.items.every((x) => x.right && !x.wrong.length);
export const maxScore = (L) => Math.round(ROUND * DROPS * L.mult);

/** File newly named scripts in the drawers. Returns the new ids. */
export function file(p, ids) { const r = room(p), out = []; for (const id of ids) if (script(id) && !r.found.includes(id)) { r.found.push(id); out.push(id); } return out; }
/** Record a finished round. Returns { xp, essence, best, newFound, won }. */
export function settle(p, run) {
  const r = room(p), L = run.L, w = won(run); r.plays++;
  const newFound = file(p, run.items.filter((x) => x.right).map((x) => x.id));
  if (w) r.wins[L.n] = (r.wins[L.n] || 0) + 1;
  const best = run.score > (r.best[L.n] || 0); if (best) r.best[L.n] = run.score;
  return { xp: w ? run.score : 3, essence: w ? Math.round(run.score / 2) + newFound.length * FOUND_PAY : 1, best, newFound, won: w };
}
/** The drawers: each script type with the scripts filed in it. */
export function drawers(p) {
  const f = room(p).found;
  return TYPES.map((t) => { const all = SCRIPTS.filter((s) => s.type === t.id); return { ...t, all, got: all.filter((s) => f.includes(s.id)) }; });
}

// ---- speed round: name as many scripts as you can from the sample alone (scripts with a sample or sketch) ----
export function speedDeck(seed = null, n = 60) {
  const rand = seed ? rng(seed) : Math.random, L = LEVELS[1], out = []; let prev = null;
  while (out.length < n) { const id = L.pool[Math.floor(rand() * L.pool.length)]; if (id === prev) continue; prev = id;
    out.push({ id, choices: shuffle([id, ...choicesFor(L, id, rand).filter((x) => x !== id).slice(0, 3)], rand) }); }
  return out;
}
export function logSpeed(p, n) { const r = room(p), best = n > r.speed; if (best) r.speed = n; return { best, pay: n * SPEED_PAY }; }
export function raceRank(results) {
  return Object.entries(results).map(([id, x]) => ({ id, ...x })).sort((a, b) => b.n - a.n || a.t - b.t).map((x, i) => ({ ...x, place: i + 1 }));
}

// ---- the daily: one shared round per UTC day; the level turns 1, 2, 3 by seed ----
export function dailyOf(day = todayKey()) {
  const seed = dailySeed("inscriptions", day), L = LEVELS[seed % 3];
  return { seed, L, day };
}
export { LEVELS };
