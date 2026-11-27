// Bookings rules (browser side). Tonight's Bill (bill.js) has 3 bookings a day, each played once for full pay.
// Matinees are extra bookings at your billing's venues, any time, at half pay. Each part allows 2 tries: right first
// time 2 points, second try 1, two misses and the booking flops. Shows (bookings played well) raise your billing.
// prog.rooms.bookings = { plays, shows, day, bill: { [slot]: { won, score } }, wins, best, hist: [...] , look }.
import { BILLINGS, tonightsBill, bookingOf, billingOf, pay, utcDay, rng, KEY_PAY } from "./bill.js";
import { room as wsRoom } from "../workshop/logic.js";

export const TRIES = 2, HIST = 30;
export function room(p) {
  const r = ((p.rooms ||= {}).bookings ||= { plays: 0, shows: 0 });
  r.shows ||= 0; r.bill ||= {}; r.wins ||= {}; r.best ||= {}; r.hist ||= []; r.look ||= {};
  return r;
}
/** Today's bill and what you've played of it (resets each UTC day). */
export function billFor(p, day = utcDay()) {
  const r = room(p); if (r.day !== day) { r.day = day; r.bill = {}; }
  return { ...tonightsBill(day), played: r.bill };
}
export const billing = (p) => billingOf(room(p).shows);
/** The next billing up, or null at Star Turn. */
export const nextBilling = (p) => BILLINGS[billing(p).n + 1] || null;
/** A matinee: a random booking at a level, at venues your billing can book. */
export function matinee(p, lv, rand = Math.random) { return bookingOf(lv, rand, { tier: Math.min(billing(p).n, 3) }); }
export function start(b, { slot = null, day = null } = {}) { return { b, slot, day, i: 0, tries: 0, pts: 0, slips: 0, over: false, won: false, bonus: 0 }; }
export const partNow = (run) => run.b.parts[run.i];
/** Answer the current part. "right" | "retry" | "flop"; "right" on the last part ends the booking won. */
export function answer(run, opt, p = null) {
  if (run.over) return null; const part = partNow(run);
  if (opt === part.answer) {
    run.pts += run.tries ? 1 : 2;
    if (part.kind === "perform" && p && wsRoom(p).rep.includes(part.trickId)) run.bonus++; // you rehearsed it
    run.i++; run.tries = 0; if (run.i >= run.b.parts.length) { run.over = run.won = true; } return "right";
  }
  run.slips++; run.tries++; if (run.tries >= TRIES) { run.over = true; return "flop"; } return "retry";
}
export const perfect = (run) => run.won && !run.slips;
export const scoreOf = (run, bill) => (run.won ? pay(run.pts + run.bonus, run.b.lv, bill) : 0);
/** Record a finished booking. Returns { xp, essence, score, keys, show, billingUp, billDone }. */
export function settle(p, run, { parlour = false } = {}) {
  const r = room(p), before = billing(p), score = scoreOf(run, before), half = run.slot == null; r.plays++;
  const out = { score, xp: run.won ? (half ? Math.ceil(score / 2) : score) : 2, essence: run.won ? Math.ceil(score / (half ? 4 : 2)) : 1, keys: 0, show: false, billingUp: null, billDone: false };
  if (run.won) {
    r.shows++; out.show = true; const L = run.b.lv; r.wins[L] = (r.wins[L] || 0) + 1; if (score > (r.best[L] || 0)) r.best[L] = score;
    if (!half && L === 3 && parlour) out.keys = KEY_PAY;
    const after = billing(p); if (after.n > before.n) out.billingUp = after.name;
  }
  if (!half) { r.bill[run.slot] = { won: run.won, score }; out.billDone = [0, 1, 2].every((s) => r.bill[s]); }
  r.hist.unshift({ day: utcDay(), lv: run.b.lv, venue: run.b.venue, client: run.b.client, method: run.b.method, won: run.won, score, matinee: half }); r.hist.length = Math.min(r.hist.length, HIST);
  return out;
}
/** The day's total from Tonight's Bill, for the daily board. */
export const billTotal = (p) => Object.values(room(p).bill).reduce((s, x) => s + (x.score || 0), 0);
export { rng };
