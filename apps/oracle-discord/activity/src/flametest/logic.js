// Flame Test Lab rules. A round is 5 samples; each sample allows 3 tries (one try is also the price of a hint).
// A sample scores its tries left x the level multiplier. Win a round with 3 or more of 5 right; perfect = 5 on the
// first try with no hints. Progress lives in prog.rooms.flametest = { plays, wins: {1,2,3}, best: {1,2,3}, seen: [ids],
// speed: best speed-round count, look: { burner, wire, scope } }.
import { LEVELS, ROUND, TRIES, SAMPLES, SPECTRA, sample, spectrum } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

export const WIN_AT = 3, SPEED_PAY = 2, RACE_WIN = 15;
export function room(p) {
  const r = ((p.rooms ||= {}).flametest ||= { plays: 0 });
  r.wins ||= {}; r.best ||= {}; r.seen ||= []; r.speed ||= 0; r.look ||= {};
  return r;
}
/** A small seedable RNG (mulberry32), so a daily or a race deals everyone the same samples. */
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** The item a level's id points at: a sample (levels 1-2) or a spectrum (level 3). */
export const itemOf = (L, id) => (L.n === 3 ? spectrum(id) : sample(id));
/** The 4 answer choices for one sample: the answer and 3 others from the same level, shuffled. */
export function choicesFor(L, id, rand = Math.random) {
  const all = L.n === 3 ? SPECTRA.map((s) => s.id) : L.n === 2 ? L.pool : SAMPLES.map((s) => s.id);
  return shuffle([id, ...shuffle(all.filter((x) => x !== id), rand).slice(0, 3)], rand);
}
/** Deal a round: ROUND distinct ids from the level's pool (a pool smaller than ROUND repeats ids in a new order). */
export function deal(L, rand = Math.random) {
  let ids = shuffle(L.pool, rand); while (ids.length < ROUND) ids = ids.concat(shuffle(L.pool, rand));
  return ids.slice(0, ROUND).map((id) => ({ id, choices: choicesFor(L, id, rand), tries: TRIES, wrong: [], hint: false, done: false, right: false }));
}
export function start(L, { seed = null, daily = null } = {}) {
  const rand = seed ? rng(seed) : Math.random;
  return { level: L.n, L, items: deal(L, rand), i: 0, score: 0, daily, hints: 0 };
}
export const current = (run) => run.items[run.i];
/** Spend a try on a hint (the spectroscope at Level 2, a written clue at Level 3). False if it would use the last try. */
export function hint(run) { const it = current(run); if (it.hint || it.tries <= 1) return false; it.hint = true; it.tries--; run.hints++; return true; }
/** Guess an id for the current sample: "right" | "wrong" | "out" (no tries left). */
export function guess(run, id) {
  const it = current(run); if (!it || it.done) return null;
  if (id === it.id) { it.done = it.right = true; run.score += Math.round(it.tries * run.L.mult); return "right"; }
  if (!it.wrong.includes(id)) it.wrong.push(id); it.tries--;
  if (it.tries <= 0) { it.done = true; return "out"; }
  return "wrong";
}
export const next = (run) => (++run.i < run.items.length);
export const rightCount = (run) => run.items.filter((x) => x.right).length;
export const won = (run) => rightCount(run) >= WIN_AT;
export const perfect = (run) => run.items.every((x) => x.right && !x.wrong.length && !x.hint);
export const maxScore = (L) => Math.round(ROUND * TRIES * L.mult);

/** Record a finished round. Returns { xp, essence, best, newSeen }. */
export function settle(p, run) {
  const r = room(p), L = run.L, w = won(run); r.plays++;
  const newSeen = [];
  for (const it of run.items) if (it.right) { const k = (L.n === 3 ? "s:" : "f:") + it.id; if (!r.seen.includes(k)) { r.seen.push(k); newSeen.push(it.id); } }
  if (w) r.wins[L.n] = (r.wins[L.n] || 0) + 1;
  const best = run.score > (r.best[L.n] || 0); if (best) r.best[L.n] = run.score;
  return { xp: w ? run.score : 3, essence: w ? Math.round(run.score / 2) + newSeen.length * 3 : 1, best, newSeen, won: w };
}

// ---- speed round: as many Level 1 flames as you can name in SPEED_SECS ----
export function speedDeck(seed = null, n = 60) {
  const rand = seed ? rng(seed) : Math.random, out = []; let prev = null;
  while (out.length < n) { const s = SAMPLES[Math.floor(rand() * SAMPLES.length)].id; if (s === prev) continue; prev = s; out.push({ id: s, choices: choicesFor(LEVELS[0], s, rand) }); }
  return out;
}
export function logSpeed(p, n) { const r = room(p), best = n > r.speed; if (best) r.speed = n; return { best, pay: n * SPEED_PAY }; }
export function raceRank(results) {
  return Object.entries(results).map(([id, x]) => ({ id, ...x })).sort((a, b) => b.n - a.n || a.t - b.t).map((x, i) => ({ ...x, place: i + 1 }));
}

// ---- the daily: one shared Level 1 or 2 round per UTC day ----
export function dailyOf(day = todayKey()) {
  const seed = dailySeed("flametest", day), L = LEVELS[seed % 2];
  return { seed, L, day };
}
export const elementsSeen = (p) => room(p).seen.length;
export { LEVELS };
