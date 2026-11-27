// Show night with friends (activity/tables.mjs + src/net.js). Each round every player stages one ghost (a slide and
// an effect), then everyone votes for the best ghost that isn't their own. Three rounds; most votes wins.
// The host's client keeps this state.
import { SLIDES, EFFECTS } from "./data.js";

export const NIGHT_ROUNDS = 3;
const LOG_MAX = 12;
export function nightStart(members, game = 1) { return { game, round: 1, phase: "stage", staged: {}, votes: {}, total: Object.fromEntries(members.map((m) => [m.id, 0])), log: [], over: false }; }
const slideOf = (id) => SLIDES.find((s) => s.id === id), fxOf = (id) => EFFECTS.find((e) => e.id === id);
/** Apply a move. Returns "stage" | "vote" | "voted" | "round" | "over" | null. */
export function nightMove(st, who, a, members) {
  if (!st || st.over || !a || !members.some((m) => m.id === who)) return null;
  if (a.a === "stage") { if (st.phase !== "stage" || !slideOf(a.slide) || !fxOf(a.fx)) return null; st.staged[who] = { slide: a.slide, fx: a.fx };
    if (members.every((m) => st.staged[m.id])) { st.phase = "vote"; return "vote"; } return "stage"; }
  if (a.a === "vote") { if (st.phase !== "vote" || a.for === who || !st.staged[a.for]) return null; st.votes[who] = a.for;
    if (!members.every((m) => st.votes[m.id] || members.length < 2)) return "voted";
    const got = {}; for (const v of Object.values(st.votes)) got[v] = (got[v] || 0) + 1;
    for (const [id, n] of Object.entries(got)) st.total[id] = (st.total[id] || 0) + n;
    st.log.unshift({ round: st.round, ghosts: Object.entries(st.staged).map(([id, g]) => ({ id, name: (members.find((m) => m.id === id) || {}).name || "a showman", ...g, votes: got[id] || 0 })) });
    st.log.length = Math.min(st.log.length, LOG_MAX); st.staged = {}; st.votes = {};
    if (st.round >= NIGHT_ROUNDS) { st.over = true; st.phase = "over"; return "over"; } st.round++; st.phase = "stage"; return "round"; }
  return null;
}
/** Until everyone has staged, nobody sees the others' ghosts; votes stay secret until the round ends. */
export const nightView = (st, forId) => ({ ...st, staged: st.phase === "stage" ? Object.fromEntries(Object.keys(st.staged).map((id) => [id, id === forId ? st.staged[id] : "?"])) : st.staged,
  votes: Object.fromEntries(Object.keys(st.votes).map((id) => [id, id === forId ? st.votes[id] : "?"])) });
/** Most votes wins (ties share the win). */
export function nightReward(st, me) { const top = Math.max(...Object.values(st.total)), won = (st.total[me] || 0) === top && top > 0; return { won, xp: won ? 12 : 5, essence: won ? 6 : 2 }; }
export { slideOf, fxOf };
