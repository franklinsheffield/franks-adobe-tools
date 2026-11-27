// Workshop rules. A trick is open when every method it needs is learned in the Case Files (or for today's daily,
// which Madame Rook lends you). Rehearse it: tap its steps in order, then pick the tell an investigator would catch.
// 3 spotlights: each wrong step or wrong tell dims one; lose all 3 and the rehearsal flops.
// Score (spotlights left + 1) x level multiplier. A first clean rehearsal puts the trick in your repertoire.
// prog.rooms.workshop = { plays, rep: [trickIds], wins: {1,2,3}, best: {1,2,3}, last, look }.
import { TRICKS, LEVELS, trickOf } from "./data.js";
import { room as cfRoom, rng } from "../casefiles/logic.js";
import { dailySeed, todayKey } from "../daily.js";

export const LIGHTS = 3, LEARN_PAY = 4;
export function room(p) {
  const r = ((p.rooms ||= {}).workshop ||= { plays: 0 });
  r.rep ||= []; r.wins ||= {}; r.best ||= {}; r.look ||= {};
  return r;
}
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Methods learned in the Case Files. */
export const learned = (p) => cfRoom(p).methods;
/** Can you rehearse this trick? (all its methods learned) */
export const isOpen = (p, t) => t.needs.every((m) => learned(p).includes(m));
export const missing = (p, t) => t.needs.filter((m) => !learned(p).includes(m));
export const openAt = (p, L) => TRICKS.filter((t) => t.lv === L.n && isOpen(p, t));
/** The next trick to rehearse at a level: an open one not yet in the repertoire, else any open one but the last. */
export function nextOf(p, L, rand = Math.random) {
  const r = room(p), open = openAt(p, L); if (!open.length) return null;
  const fresh = open.filter((t) => !r.rep.includes(t.id) && t.id !== r.last), pool = fresh.length ? fresh : open.filter((t) => t.id !== r.last);
  const use = pool.length ? pool : open; return use[Math.floor(rand() * use.length)].id;
}
/** The tell plus look-alike tells from other tricks at the same level. */
export function tellsFor(id, rand = Math.random) {
  const t = trickOf(id), L = LEVELS[t.lv - 1];
  const others = shuffle(TRICKS.filter((x) => x.id !== id && x.tell !== t.tell), rand).slice(0, L.tells - 1).map((x) => x.tell);
  return shuffle([t.tell, ...others], rand);
}
export function start(id, { seed = null, daily = null, lent = false } = {}) {
  const rand = seed ? rng(seed) : Math.random, t = trickOf(id), L = LEVELS[t.lv - 1];
  const order = shuffle(t.steps.map((_, i) => i), rand);
  if (order.every((v, i) => v === i)) order.push(order.shift()); // never deal the answer
  return { id, L, lights: LIGHTS, order, done: [], slips: 0, phase: "steps", tells: tellsFor(id, rand), wrongTells: [], over: false, won: false, daily, lent };
}
/** Tap step i (its index in the trick). "next" | "slip" | "steps-done" | "flop". */
export function tapStep(run, i) {
  if (run.over || run.phase !== "steps" || run.done.includes(i)) return null;
  if (i === run.done.length) { run.done.push(i); if (run.done.length === trickOf(run.id).steps.length) { run.phase = "tell"; return "steps-done"; } return "next"; }
  run.slips++; run.lights--; if (run.lights <= 0) { run.over = true; return "flop"; } return "slip";
}
/** Name the tell. "right" | "wrong" | "flop". */
export function pickTell(run, text) {
  if (run.over || run.phase !== "tell") return null;
  if (text === trickOf(run.id).tell) { run.over = run.won = true; return "right"; }
  if (!run.wrongTells.includes(text)) run.wrongTells.push(text); run.slips++; run.lights--;
  if (run.lights <= 0) { run.over = true; return "flop"; } return "wrong";
}
export const scoreOf = (run) => (run.won ? Math.round((run.lights + 1) * run.L.mult) : 0);
export const perfect = (run) => run.won && run.slips === 0;
/** Record a finished rehearsal. A lent (daily, not yet open) trick never joins the repertoire. Returns { xp, essence, score, learned }. */
export function settle(p, run) {
  const r = room(p), L = run.L, score = scoreOf(run); r.plays++; r.last = run.id;
  const out = { score, xp: run.won ? score : 2, essence: run.won ? Math.ceil(score / 2) : 1, learned: false };
  if (run.won) {
    if (!run.lent && !r.rep.includes(run.id)) { r.rep.push(run.id); out.learned = true; out.essence += LEARN_PAY; }
    r.wins[L.n] = (r.wins[L.n] || 0) + 1; if (score > (r.best[L.n] || 0)) r.best[L.n] = score;
  }
  return out;
}
/** Today's trick, the same for everyone: any of the 60 (lent for the day if you haven't unlocked it). */
export function dailyOf(day = todayKey()) {
  const seed = dailySeed("workshop", day), t = TRICKS[seed % TRICKS.length];
  return { seed, id: t.id, L: LEVELS[t.lv - 1], day };
}
export const repertoire = (p) => room(p).rep.slice();
