// Case Files rules. One case per round, 5 candles: each investigator's tool burns one, and so does a wrong method.
// Name the real method and score (candles left + 1) x the level multiplier. A case solved for the first time goes in
// your casebook, and its method is learned: learned methods become tricks in the Workshop (core loop step 2).
// prog.rooms.casefiles = { plays, solved: [caseIds], methods: [methodIds], wins: {1,2,3}, best: {1,2,3}, last, look }.
import { LEVELS, CASES, METHODS, TOOL_KEYS, caseOf, method } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

export const CANDLES = 5, OPTIONS = 6, SOLVE_PAY = 5;
export function room(p) {
  const r = ((p.rooms ||= {}).casefiles ||= { plays: 0 });
  r.solved ||= []; r.methods ||= []; r.wins ||= {}; r.best ||= {}; r.look ||= {};
  return r;
}
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** The right method plus 5 others, look-alikes first (same class), so the tools matter. */
export function optionsFor(id, rand = Math.random) {
  const m = method(caseOf(id).method);
  const near = (x) => (x.cls === m.cls ? 2 : 0) + rand() * 1.6;
  const picks = METHODS.filter((x) => x.id !== m.id).sort((a, b) => near(b) - near(a)).slice(0, OPTIONS - 1).map((x) => x.id);
  return shuffle([m.id, ...picks], rand);
}
/** The next case at a level: an unsolved one if any, else any but the last. */
export function nextOf(p, L, rand = Math.random) {
  const r = room(p), fresh = L.pool.filter((id) => !r.solved.includes(id) && id !== r.last), pool = fresh.length ? fresh : L.pool.filter((id) => id !== r.last);
  return pool[Math.floor(rand() * pool.length)];
}
export function start(L, id, { seed = null, daily = null } = {}) {
  const rand = seed ? rng(seed) : Math.random;
  return { L, id, candles: CANDLES, tools: [], wrong: [], done: false, won: false, options: optionsFor(id, rand), daily };
}
/** Use a tool: false if already used or no candle to spare (the last candle is kept for naming). */
export function useTool(run, key) {
  if (run.done || run.tools.includes(key) || !TOOL_KEYS.includes(key) || run.candles <= 1) return false;
  run.tools.push(key); run.candles--; return true;
}
/** Name the method: "right" | "wrong" | "out". */
export function accuse(run, methodId) {
  if (run.done) return null;
  if (methodId === caseOf(run.id).method) { run.done = run.won = true; return "right"; }
  if (!run.wrong.includes(methodId)) run.wrong.push(methodId); run.candles--;
  if (run.candles <= 0) { run.done = true; return "out"; }
  return "wrong";
}
export const scoreOf = (run) => (run.won ? Math.round((run.candles + 1) * run.L.mult) : 0);
/** Perfect: right first time, with at most 2 tools. */
export const perfect = (run) => run.won && !run.wrong.length && run.tools.length <= 2;
/** Did a tool find real evidence? (A wasted candle teaches something too, but it shows differently.) */
export const useful = (id, tool) => Boolean(caseOf(id).ev[tool]);
/** Record a finished case. Returns { xp, essence, score, first, learned }. */
export function settle(p, run) {
  const r = room(p), L = run.L, c = caseOf(run.id), score = scoreOf(run); r.plays++; r.last = run.id;
  const out = { score, xp: run.won ? score : 2, essence: run.won ? Math.ceil(score / 2) : 1, first: false, learned: null };
  if (run.won) {
    if (!r.solved.includes(run.id)) { r.solved.push(run.id); out.first = true; out.essence += SOLVE_PAY; }
    if (!r.methods.includes(c.method)) { r.methods.push(c.method); out.learned = c.method; }
    r.wins[L.n] = (r.wins[L.n] || 0) + 1; if (score > (r.best[L.n] || 0)) r.best[L.n] = score;
  }
  return out;
}
/** Today's case, the same for everyone: any of the 40. */
export function dailyOf(day = todayKey()) {
  const seed = dailySeed("casefiles", day), c = CASES[seed % CASES.length], L = LEVELS.find((x) => x.pool.includes(c.id));
  return { seed, L, id: c.id, day };
}
/** Methods uncovered so far: the Workshop's unlocked tricks (core loop step 2). */
export const learnedMethods = (p) => room(p).methods.slice();
export const solvedCases = (p) => room(p).solved.slice();
