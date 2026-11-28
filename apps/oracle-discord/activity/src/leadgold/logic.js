// Lead into Gold rules (no DOM). prog.rooms.leadgold = { plays, best: { [level]: score }, wins, gold, look }.
import { CHAINS, ROUTES, MOVES, GOLD, EL, ROUND, label } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

export function room(p) { const r = ((p.rooms ||= {}).leadgold ||= { plays: 0 }); r.best ||= {}; r.wins ||= 0; r.gold ||= 0; r.look ||= {}; return r; }
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0) / 4294967296); }
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** What a decay does: alpha loses 2 protons and 2 neutrons; beta-minus turns a neutron into a proton. */
export const decay = (z, a, d) => (d === "a" ? { z: z - 2, a: a - 4 } : { z: z + 1, a });
/** Every unstable nucleus in the three series, once. */
export const DECAYERS = (() => { const m = new Map(); for (const c of CHAINS) for (const [z, a, d, h] of c.steps) if (d) m.set(`${z}-${a}`, { z, a, d, h }); return [...m.values()]; })();
/** Level 1: { q, choices, a, why } about one decay. Kind 0: what does it become? Kind 1: which decay was it? */
export function quizRound(r) {
  const n = DECAYERS[Math.floor(r() * DECAYERS.length)], to = decay(n.z, n.a, n.d), kind = r() < 0.65 ? 0 : 1;
  const why = n.d === "a" ? `Alpha decay throws out 2 protons and 2 neutrons, a helium nucleus: ${label(n.z, n.a)} becomes ${label(to.z, to.a)}. Half-life ${n.h}.` : `Beta decay turns a neutron into a proton and shoots out an electron: ${label(n.z, n.a)} becomes ${label(to.z, to.a)}, same mass. Half-life ${n.h}.`;
  if (kind === 1) return { n, q: `${label(n.z, n.a)} decays into ${label(to.z, to.a)}. Which decay was it?`, choices: ["Alpha (α)", "Beta (β)"], a: n.d === "a" ? "Alpha (α)" : "Beta (β)", why };
  const wrong = [decay(n.z, n.a, n.d === "a" ? "b" : "a"), { z: n.z + 2, a: n.a + 4 }, { z: n.z - 2, a: n.a - 2 }, { z: n.z - 1, a: n.a }, { z: n.z - 2, a: n.a }].filter((x) => EL[x.z] && !(x.z === to.z && x.a === to.a));
  const opts = [label(to.z, to.a), ...shuffle([...new Set(wrong.map((x) => label(x.z, x.a)))], r).slice(0, 3)];
  return { n, q: `${label(n.z, n.a)} decays by ${n.d === "a" ? "alpha (α)" : "beta (β)"}. What does it become?`, choices: shuffle(opts, r), a: label(to.z, to.a), why };
}
export const quiz = (seed, n = ROUND) => { const r = rng(seed); return Array.from({ length: n }, () => quizRound(r)); };
/** Why a nucleus decays the way it does, as a hint: too many neutrons means beta; heavy and balanced means alpha. */
export const hintFor = (z, a, d) => (d === "b" ? `${label(z, a)} has too many neutrons for its protons (${a - z} to ${z}). Nuclei like that fix it by turning a neutron into a proton.` : `${label(z, a)} is simply too heavy. Big nuclei shed weight by throwing out an alpha particle.`);
/** Level 3: fewest moves from (z, n) to gold-197, by breadth-first search over the moves. */
export function fewest(z, a, goal = GOLD) {
  const start = [z, a - z], end = [goal.z, goal.a - goal.z], seen = new Set([start.join()]); let edge = [start];
  for (let d = 0; d <= 24; d++) {
    if (edge.some(([zz, nn]) => zz === end[0] && nn === end[1])) return d;
    const next = []; for (const [zz, nn] of edge) for (const m of MOVES) { const s = [zz + m.dz, nn + m.dn], k = s.join(); if (s[0] < 70 || s[0] > 95 || s[1] < 100 || s[1] > 150 || seen.has(k)) continue; seen.add(k); next.push(s); }
    edge = next;
  }
  return -1;
}
export const apply = (st, id) => { const m = MOVES.find((x) => x.id === id); return m ? { z: st.z + m.dz, a: st.a + m.dz + m.dn } : st; };
export const isGold = (st) => st.z === GOLD.z && st.a === GOLD.a;
/** Points for reaching gold in `used` moves when `best` was possible. */
export const goldPoints = (used, best) => (used <= best ? 10 : used <= best + 2 ? 6 : 3);
export const routesFor = (seed) => shuffle(ROUTES, rng(seed));
export const chainOf = (id) => CHAINS.find((c) => c.id === id) || CHAINS[0];
/** Settle a run: won at half marks, perfect at full. */
export function settle(p, level, score, max) {
  const r = room(p), won = score >= max / 2, perfect = score >= max; r.plays++; if (won) r.wins++;
  const best = score > (r.best[level] || 0); if (best) r.best[level] = score; return { won, perfect, best };
}
/** The daily: the same five decay questions for everyone. */
export function dailyOf(day = todayKey()) { const seed = dailySeed("leadgold", day); return { seed, day, rounds: quiz(seed) }; }
/** Co-op chain: whose turn it is (members take steps in order). */
export const turnOf = (ids, step) => (ids.length ? ids[step % ids.length] : null);
