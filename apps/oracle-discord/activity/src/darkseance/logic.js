// Dark Séance rules. Each round the sitters ask for an effect while the investigators keep some controls. Choose a
// method that makes that effect and that none of tonight's controls beats. A beaten method gets you caught, a method
// that can't make the effect leaves the sitters doubting: either way one 👁️ of suspicion. 3 👁️ and you're exposed.
// When an investigator has a flashlight, you must also act while its beam points away.
// Score: 2 per round done first time, 1 after a slip, x level multiplier. Perfect: no suspicion at all.
// prog.rooms.darkseance = { plays, wins: {1,2,3}, best: {1,2,3}, learned: [methodIds], caught: [methodIds], look }.
import { EFFECTS, METHODS, LEVELS, works, makes, methodOf } from "./data.js";
import { rng } from "../casefiles/logic.js";
import { dailySeed, todayKey } from "../daily.js";

export const EYES = 3, OPTIONS = 4;
export function room(p) {
  const r = ((p.rooms ||= {}).darkseance ||= { plays: 0 });
  r.wins ||= {}; r.best ||= {}; r.learned ||= []; r.caught ||= []; r.look ||= {};
  return r;
}
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const sample = (a, n, rand) => shuffle(a, rand).slice(0, n);

/** One round: an effect, the controls in force, and 4 methods to choose from (at least one works). */
export function roundOf(L, rand = Math.random, prev = null) {
  for (let tries = 0; tries < 50; tries++) {
    const pool = L.effects.filter((e) => e !== prev), effect = pool[Math.floor(rand() * pool.length)];
    const controls = [...L.fixed, ...sample(L.controls, L.per, rand)];
    if (L.torch && !controls.includes("torch") && rand() < L.torch) controls.push("torch");
    const can = METHODS.filter((m) => makes(m.id, effect)), ok = can.filter((m) => works(m.id, effect, controls));
    if (!ok.length) continue;
    const decoys = shuffle(METHODS.filter((m) => !makes(m.id, effect)), rand);
    const options = shuffle([...can, ...decoys].slice(0, Math.max(OPTIONS, can.length)).map((m) => m.id), rand);
    return { effect, controls, options };
  }
  throw new Error("no workable round");
}
export function start(L, { seed = null, daily = null } = {}) {
  const rand = seed ? rng(seed) : Math.random, rounds = [];
  for (let i = 0; i < L.rounds; i++) rounds.push(roundOf(L, rand, rounds.length ? rounds[rounds.length - 1].effect : null));
  return { L, rounds, i: 0, eyes: EYES, slips: 0, pts: 0, roundSlips: 0, tried: [], used: [], over: false, won: false, daily, pending: null };
}
export const roundNow = (run) => run.rounds[run.i];
/** Does this pick need the flashlight timing step? */
export const needsTiming = (run, mid) => roundNow(run).controls.includes("torch") && works(mid, roundNow(run).effect, roundNow(run).controls);
/** Choose a method. "done" | "timing" (act while the beam is away, then call act()) | "caught" | "nothing" | "exposed" | "won". */
export function choose(run, mid) {
  if (run.over || run.pending) return null; const rd = roundNow(run);
  if (works(mid, rd.effect, rd.controls)) { if (rd.controls.includes("torch")) { run.pending = mid; return "timing"; } return succeed(run, mid); }
  run.tried.push(mid); return slip(run, makes(mid, rd.effect) ? "caught" : "nothing", mid);
}
/** The flashlight step: inBeam = the beam was on you when you acted. */
export function act(run, inBeam) {
  if (run.over || !run.pending) return null; const mid = run.pending; run.pending = null;
  return inBeam ? slip(run, "lit", mid) : succeed(run, mid);
}
function slip(run, kind, mid) {
  run.slips++; run.roundSlips++; run.eyes--; if (kind !== "nothing") run.caughtBy = mid;
  if (run.eyes <= 0) { run.over = true; return "exposed"; } return kind;
}
function succeed(run, mid) {
  run.pts += run.roundSlips ? 1 : 2; run.used.push(mid); run.roundSlips = 0; run.tried = []; run.i++;
  if (run.i >= run.rounds.length) { run.over = run.won = true; return "won"; } return "done";
}
export const scoreOf = (run) => (run.won ? Math.round((run.pts + run.eyes) * run.L.mult) : 0);
export const perfect = (run) => run.won && !run.slips;
/** Record a finished séance. Returns { xp, essence, score, fresh: [new methods used] }. */
export function settle(p, run) {
  const r = room(p), L = run.L, score = scoreOf(run); r.plays++;
  const fresh = [...new Set(run.used)].filter((m) => !r.learned.includes(m)); r.learned.push(...fresh);
  if (run.caughtBy && !r.caught.includes(run.caughtBy)) r.caught.push(run.caughtBy);
  const out = { score, xp: run.won ? score : 3, essence: run.won ? Math.ceil(score / 2) + fresh.length : 1, fresh };
  if (run.won) { r.wins[L.n] = (r.wins[L.n] || 0) + 1; if (score > (r.best[L.n] || 0)) r.best[L.n] = score; }
  return out;
}
/** Today's séance, the same for everyone. */
export function dailyOf(day = todayKey()) { const seed = dailySeed("darkseance", day); return { seed, L: LEVELS[seed % 3], day }; }
/** Where the beam points (degrees, 0-360) at time t ms, and whether it's on the medium's seat (around 90°). */
export const beamAt = (t, L) => ((t / (L.n === 3 ? 9 : 12)) % 360);
export const onSeat = (deg) => Math.abs(((deg - 90 + 540) % 360) - 180) < 38;
export { EFFECTS, methodOf };
