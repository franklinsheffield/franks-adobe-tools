// Commissions rules. Three jobs a day, the same for everyone (one per tier), each asking for a Discovery Bench product.
// Deliver a product you have discovered to earn 💎, philosopher's stones and reputation. Reputation unlocks the
// Guild (5) and the Royal Society (15). prog.rooms.commissions = { rep, done: { [day]: [jobIds] }, total, look }.
import { TIERS, JOBS, job, tierOf } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";
import { PRODUCTS } from "../bench/data.js";

export function room(p) { const r = ((p.rooms ||= {}).commissions ||= { rep: 0 }); r.done ||= {}; r.total ||= 0; r.look ||= {}; return r; }
export const repOf = (p) => room(p).rep || 0;
/** The highest tier the member's reputation has reached. */
export const rankOf = (p) => TIERS.reduce((a, t) => (repOf(p) >= t.at ? t : a), TIERS[0]);
export const nextRank = (p) => TIERS.find((t) => t.at > repOf(p)) || null;
export const unlocked = (p, tier) => repOf(p) >= tierOf(tier).at;
/** Today's three jobs (one per tier), picked from the shared daily seed. */
export function jobsOf(day = todayKey()) {
  const seed = dailySeed("commissions", day);
  return TIERS.map((t, i) => { const pool = JOBS.filter((j) => j.tier === t.n); return pool[(seed >>> (i * 5)) % pool.length]; });
}
export const doneToday = (p, day = todayKey()) => room(p).done[day] || [];
const made = (p) => (((p.rooms || {}).bench || {}).made) || [];
export const productName = (id) => (PRODUCTS.find((x) => x.id === id) || {}).name || id;
/** Can this job be delivered now? "ok" | "done" | "locked" | "missing". */
export function statusOf(p, j, day = todayKey()) {
  if (doneToday(p, day).includes(j.id)) return "done";
  if (!unlocked(p, j.tier)) return "locked";
  return made(p).includes(j.wants) ? "ok" : "missing";
}
/** Deliver: pays and records. Returns { ok, pay, stones, rep, rankUp, allDone } or { ok: false, why }. */
export function deliver(p, id, day = todayKey()) {
  const j = job(id); if (!j || !jobsOf(day).some((x) => x.id === id)) return { ok: false, why: "gone" };
  const st = statusOf(p, j, day); if (st !== "ok") return { ok: false, why: st };
  const r = room(p), t = tierOf(j.tier), before = rankOf(p).n;
  (r.done[day] ||= []).push(id); r.rep += t.rep; r.total++;
  for (const d of Object.keys(r.done)) if (d < todayKey(Date.parse(day) - 30 * 864e5)) delete r.done[d]; // keep a month
  const open = jobsOf(day).filter((x) => unlocked(p, x.tier) && !r.done[day].includes(x.id));
  return { ok: true, job: j, pay: t.pay, stones: t.stones, rep: t.rep, rankUp: rankOf(p).n > before ? rankOf(p) : null, allDone: !open.length };
}
export { TIERS, JOBS, job, tierOf };
