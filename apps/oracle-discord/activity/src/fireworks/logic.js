// Fireworks Workshop rules. A build = { c1, c2, ox, cl, tail, pat, size }. A target says what the burst must look like.
// prog.rooms.fireworks = { plays, best: { [level]: score }, wins, shots, look }.
import { COLOURS, COLOURANTS, TAILS, PATTERNS, SIZES, ROUND, CUES, agentFor, colourant, tail, size } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

export function room(p) { const r = ((p.rooms ||= {}).fireworks ||= { plays: 0 }); r.best ||= {}; r.wins ||= 0; r.shots ||= 0; r.look ||= {}; return r; }
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s ^ (s >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0) / 4294967296); }
const pickOf = (r, a) => a[Math.floor(r() * a.length)];
const COLS = Object.keys(COLOURS);
/** One target: level 1 a colour; level 2 a two-stage star with a tail and a pattern; level 3 adds a shell size. */
export function makeTarget(level, r) {
  const c1 = pickOf(r, COLS);
  if (level === 1) return { c1, c2: null, tail: "none", pat: "sphere", size: null };
  let c2 = pickOf(r, COLS); while (c2 === c1) c2 = pickOf(r, COLS);
  const t = { c1, c2, tail: pickOf(r, TAILS).id, pat: pickOf(r, PATTERNS).id, size: null };
  if (level === 3) t.size = pickOf(r, SIZES).id;
  return t;
}
export function deal(level, seed) { const r = rng(seed), n = level === 3 ? CUES : ROUND; return Array.from({ length: n }, () => makeTarget(level, r)); }
/** The show: cue i bursts at these seconds after the music starts. */
export const cueTimes = (n = CUES) => Array.from({ length: n }, (_, i) => 6 + i * 5);
/** What the build would really do in the sky. */
export function burstOf(b) {
  const a1 = colourant(b.c1), a2 = b.c2 ? colourant(b.c2) : null, dull = b.ox !== "kclo4";
  const col = (a) => { if (!a) return null; if (a.needsCl && !b.cl) return "white"; return a.colour; }; // blue/purple without chlorine burn pale and whitish
  return { c1: col(a1), c2: a2 ? col(a2) : null, dull, effect: tail(b.tail).effect, pat: b.pat || "sphere", size: b.size ? size(b.size) : null };
}
/** Which parts of a build miss the target: [] when it matches. */
export function check(b, t) {
  const out = [], a1 = colourant(b.c1), a2 = b.c2 ? colourant(b.c2) : null;
  if (!a1 || a1.colour !== t.c1) out.push("c1");
  if (t.c2 ? !a2 || a2.colour !== t.c2 : !!a2) out.push("c2");
  if (b.ox !== "kclo4") out.push("ox");
  if (!b.cl && [a1, a2].some((a) => a && a.needsCl)) out.push("cl");
  if ((b.tail || "none") !== t.tail) out.push("tail");
  if ((b.pat || "sphere") !== t.pat) out.push("pat");
  if (t.size && +b.size !== t.size) out.push("size");
  return out;
}
export const tryPoints = (tries) => [0, 10, 6, 3][tries] || 0;
/** Timing score for one cue of the show: seconds between the burst and the beat. */
export const timingPoints = (err) => { const e = Math.abs(err); return e <= 0.4 ? 10 : e <= 1 ? 6 : e <= 2 ? 3 : 0; };
export function describe(t) {
  const C = (c) => COLOURS[c].name, eff = { peony: "peony", willow: "willow with gold tails", chrysanthemum: "chrysanthemum with silver sparks" }[tail(t.tail).effect];
  return `${t.pat === "ring" ? "A ring" : "A"} ${t.c2 ? `${C(t.c1)}-to-${C(t.c2)}` : C(t.c1)} ${eff}${t.size ? `, ${size(t.size).name.replace("-inch shell", "-inch")}` : ""}`;
}
/** Settle a level: pay, best score, win (half marks) and perfect (full marks). */
export function settle(p, level, score, max) {
  const r = room(p), won = score >= max / 2, perfect = score >= max; r.plays++; if (won) r.wins++;
  const best = score > (r.best[level] || 0); if (best) r.best[level] = score;
  return { won, perfect, best };
}
/** The daily shell: a level-2 target for everyone. */
export function dailyOf(day = todayKey()) { const seed = dailySeed("fireworks", day); return { seed, day, target: makeTarget(2, rng(seed)) }; }
/** Show Night votes: { voter: votedFor } -> ranked rows. */
export function tally(shells, votes) {
  const n = {}; for (const [voter, who] of Object.entries(votes || {})) if (who !== voter && shells[who]) n[who] = (n[who] || 0) + 1;
  return Object.keys(shells).map((id) => ({ id, name: shells[id].name, votes: n[id] || 0 })).sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
}
export { COLOURANTS, COLOURS, agentFor };
