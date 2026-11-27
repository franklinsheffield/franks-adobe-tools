// Mineral Cabinet rules. One specimen per round. You start with 5 sample chips: every test uses one, and so does a
// wrong guess. Name it right and score (chips left + 1) x the level multiplier; the first time a mineral is named it
// goes into your drawers. prog.rooms.minerals = { plays, found: [ids], flamed: [ids], wins: {1,2,3}, best: {1,2,3},
// last, look: { lens, case, lamp } }. found also feeds the Discovery Bench (each found mineral becomes an ingredient).
import { LEVELS, MINERALS, mineral } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

export const CHIPS = 5, OPTIONS = 6, FIND_PAY = 5;
export function room(p) {
  const r = ((p.rooms ||= {}).minerals ||= { plays: 0 });
  r.found ||= []; r.flamed ||= []; r.wins ||= {}; r.best ||= {}; r.look ||= {};
  return r;
}
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Look-alikes first: the distractors are the minerals that share the most visible traits (lustre, class, colour). */
export function optionsFor(id, L, rand = Math.random) {
  const m = mineral(id), pool = MINERALS.filter((x) => x.id !== id && (L.n === 3 || L.pool.includes(x.id) || x.lustre === m.lustre));
  const near = (x) => (x.lustre === m.lustre ? 2 : 0) + (x.cls === m.cls ? 1 : 0) + (x.streak === m.streak ? 1 : 0) + rand() * 1.5;
  const picks = pool.sort((a, b) => near(b) - near(a)).slice(0, OPTIONS - 1).map((x) => x.id);
  return shuffle([id, ...picks], rand);
}
/** The next specimen at a level: one not yet found if any, else any but the last. */
export function nextOf(p, L, rand = Math.random) {
  const r = room(p), fresh = L.pool.filter((id) => !r.found.includes(id) && id !== r.last), pool = fresh.length ? fresh : L.pool.filter((id) => id !== r.last);
  return pool[Math.floor(rand() * pool.length)];
}
export function start(L, id, { seed = null, daily = null, uv = false } = {}) {
  const rand = seed ? rng(seed) : Math.random;
  return { L, id, chips: CHIPS, tests: [], wrong: [], done: false, won: false, options: optionsFor(id, L, rand), daily, uv };
}
/** Which tests can be run here: the level's list, plus the UV lamp at any level once you own one. */
export const testsFor = (run) => [...new Set([...run.L.tests, ...(run.uv ? ["uv"] : [])])];
/** Run a test: false if already run, unavailable or out of chips. */
export function runTest(run, key) {
  if (run.done || run.tests.includes(key) || !testsFor(run).includes(key) || run.chips <= 0) return false;
  run.tests.push(key); run.chips--; return true;
}
/** Name the specimen: "right" | "wrong" | "out". */
export function name(run, id) {
  if (run.done) return null;
  if (id === run.id) { run.done = run.won = true; return "right"; }
  if (!run.wrong.includes(id)) run.wrong.push(id); run.chips--;
  if (run.chips <= 0) { run.done = true; return "out"; }
  return "wrong";
}
export const scoreOf = (run) => (run.won ? Math.round((run.chips + 1) * run.L.mult) : 0);
export const perfect = (run) => run.won && !run.wrong.length && run.tests.length <= 2;
/** Record a finished specimen. Returns { xp, essence, score, first, flamed }. */
export function settle(p, run) {
  const r = room(p), L = run.L, score = scoreOf(run); r.plays++; r.last = run.id;
  const out = { score, xp: run.won ? score : 2, essence: run.won ? Math.ceil(score / 2) : 1, first: false, flamed: false };
  if (run.tests.includes("flame") && !r.flamed.includes(run.id)) { r.flamed.push(run.id); out.flamed = true; }
  if (run.won) { if (!r.found.includes(run.id)) { r.found.push(run.id); out.first = true; out.essence += FIND_PAY; }
    r.wins[L.n] = (r.wins[L.n] || 0) + 1; if (score > (r.best[L.n] || 0)) r.best[L.n] = score; }
  return out;
}
/** Today's specimen, the same for everyone: any of the 40. */
export function dailyOf(day = todayKey()) {
  const seed = dailySeed("minerals", day), m = MINERALS[seed % MINERALS.length], L = LEVELS.find((x) => x.pool.includes(m.id));
  return { seed, L, id: m.id, day };
}
/** Minerals found, for the Discovery Bench and the periodic table. */
export const foundMinerals = (p) => room(p).found.slice();
export const elementsFound = (p) => [...new Set(room(p).found.flatMap((id) => mineral(id)?.el || []))];
