// Phantasmagoria rules. Lantern and Pepper rounds: set a slider and press Show; within tolerance it's right, outside
// it the audience sees a wrong-sized (or wrong-tilted) ghost and you lose one 🕯️ of lamp oil, then try again.
// Show rounds: a cue sheet of 6 cues; tap on each one (perfect ±120 ms = 2, good ±280 ms = 1); an early tap or a
// missed cue costs oil; an act passes with 4 hits. Out of oil: the show is a flop.
// Score: points + oil left, x multiplier. prog.rooms.phantasmagoria = { plays, wins, best, tricks: [ids], look }.
import { LEVELS, LANTERN_ASKS, PEPPER_ASKS, SHOW, CUE_KINDS, LANTERN_TOL, PEPPER_TOL, ghostHeight, ghostTilt, SCALE } from "./data.js";
import { rng } from "../casefiles/logic.js";
import { dailySeed, todayKey } from "../daily.js";

export const OIL = 3;
export const TRICK_IDS = ["lantern", "pepper", "show"];
export function room(p) {
  const r = ((p.rooms ||= {}).phantasmagoria ||= { plays: 0 });
  r.wins ||= {}; r.best ||= {}; r.tricks ||= []; r.look ||= {};
  return r;
}
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
/** A cue sheet: n cues spread over len ms, at least 700 ms apart, never in the first or last 800 ms. */
export function cueSheet(rand = Math.random, n = SHOW.cues, len = SHOW.len) {
  const slot = (len - 1600) / n, cues = [];
  for (let i = 0; i < n; i++) cues.push({ t: Math.round(800 + i * slot + rand() * (slot - 700)), kind: CUE_KINDS[Math.floor(rand() * CUE_KINDS.length)].id });
  return cues;
}
export function start(L, { seed = null, daily = null } = {}) {
  const rand = seed ? rng(seed) : Math.random; let rounds;
  if (L.kind === "lantern") rounds = shuffle(LANTERN_ASKS, rand).slice(0, L.rounds).map((a) => ({ kind: "lantern", ...a, answer: a.h / SCALE }));
  else if (L.kind === "pepper") rounds = shuffle(PEPPER_ASKS, rand).slice(0, L.rounds).map((a) => ({ kind: "pepper", ...a, answer: a.tilt / 2 }));
  else rounds = Array.from({ length: L.rounds }, (_, i) => ({ kind: "show", act: i + 1, cues: cueSheet(rand) }));
  return { L, rounds, i: 0, oil: OIL, slips: 0, roundSlips: 0, pts: 0, over: false, won: false, daily, act: null, last: null };
}
export const roundNow = (run) => run.rounds[run.i];
function slip(run) { run.slips++; run.roundSlips++; run.oil--; if (run.oil <= 0) { run.over = true; return "flop"; } return "wrong"; }
function next(run, pts) { run.pts += pts; run.roundSlips = 0; run.i++; if (run.i >= run.rounds.length) { run.over = run.won = true; return "won"; } return "right"; }
/** Lantern distance (m) or glass angle (°). Returns "right" | "won" | "wrong" | "flop"; run.last = what the audience saw. */
export function setTo(run, v) {
  if (run.over) return null; const rd = roundNow(run); if (rd.kind === "show") return null;
  if (rd.kind === "lantern") { const h = ghostHeight(v); run.last = { h, big: h > rd.h }; return Math.abs(h - rd.h) / rd.h <= LANTERN_TOL ? next(run, run.roundSlips ? 1 : 2) : slip(run); }
  const tilt = ghostTilt(v); run.last = { tilt, back: tilt < rd.tilt }; return Math.abs(v - rd.answer) <= PEPPER_TOL ? next(run, run.roundSlips ? 1 : 2) : slip(run);
}
/** Start an act of the timed show. */
export function beginAct(run) { const rd = roundNow(run); if (!rd || rd.kind !== "show") return null; run.act = { hit: rd.cues.map(() => null), early: 0 }; return run.act; }
/** A tap at t ms into the act. Returns "perfect" | "good" | "early" | "flop" | null. */
export function tapAt(run, t) {
  if (run.over || !run.act) return null; const rd = roundNow(run), a = run.act;
  let best = -1, gap = Infinity; rd.cues.forEach((c, k) => { if (a.hit[k] === null && Math.abs(c.t - t) < gap) { gap = Math.abs(c.t - t); best = k; } });
  if (best >= 0 && gap <= SHOW.good) { a.hit[best] = gap <= SHOW.perfect ? 2 : 1; return gap <= SHOW.perfect ? "perfect" : "good"; }
  a.early++; return slip(run) === "flop" ? "flop" : "early";
}
/** Cues the needle has passed without a tap, at time t. Each costs oil once. Returns the newly missed indexes. */
export function missedBy(run, t) {
  if (run.over || !run.act) return []; const rd = roundNow(run), a = run.act, out = [];
  rd.cues.forEach((c, k) => { if (a.hit[k] === null && t > c.t + SHOW.good) { a.hit[k] = 0; out.push(k); slip(run); } });
  return out;
}
/** End the act (the music stops). Returns "right" | "won" | "wrong" | "flop" (an act fails below SHOW.pass hits). */
export function endAct(run) {
  if (!run.act) return null; if (run.over) return run.won ? "won" : "flop";
  const a = run.act, hits = a.hit.filter((x) => x > 0).length, pts = a.hit.reduce((s, x) => s + (x || 0), 0); run.act = null;
  if (hits < SHOW.pass) { run.roundSlips++; return run.over ? "flop" : "wrong"; }
  return next(run, Math.round(pts / 3));
}
export const scoreOf = (run) => (run.won ? Math.round((run.pts + run.oil) * run.L.mult) : 0);
export const perfect = (run) => run.won && !run.slips;
/** Record a show. Returns { xp, essence, score, fresh: [new tricks] }. */
export function settle(p, run) {
  const r = room(p), L = run.L, score = scoreOf(run); r.plays++;
  const fresh = run.won && !r.tricks.includes(L.kind) ? [L.kind] : []; r.tricks.push(...fresh);
  const out = { score, xp: run.won ? score : 3, essence: run.won ? Math.ceil(score / 2) + fresh.length * 2 : 1, fresh };
  if (run.won) { r.wins[L.n] = (r.wins[L.n] || 0) + 1; if (score > (r.best[L.n] || 0)) r.best[L.n] = score; }
  return out;
}
/** Today's show, the same for everyone. */
export function dailyOf(day = todayKey()) { const seed = dailySeed("phantasmagoria", day); return { seed, L: LEVELS[seed % 3], day }; }
