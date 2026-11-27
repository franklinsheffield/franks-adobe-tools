// Group séance: everyone in the Discord call sits at one table (activity/tables.mjs + src/net.js). The host's client
// keeps this state and applies every move; the others send moves up and draw what the host sends back.
// One shared ghost, one shared set of candles: the circle votes on the kind, asks for clues together (half the circle
// must ask), and anyone may name the ghost. The first right name wins the round; each wrong name snuffs a shared candle.
import { FIELDS } from "./ghosts.js";
import { LEVELS, CANDLES, whoIs, isRight, perCandle, fieldPts, ghostById } from "./logic.js";

export const GROUP_LEVELS = [1, 2, 3]; // Level 4 has its own method step; the group plays levels 1 to 3
const LOG_MAX = 12;

export function groupStart(L, g, round = 1) {
  return { n: L.n, id: g.id, shown: 1, candles: CANDLES, votes: {}, field: null, fieldRight: false, asks: {}, log: [], winner: null, winnerName: "", over: false, round };
}
export const groupGhost = (st) => { const L = LEVELS[st.n - 1]; return { L, g: L && ghostById(st.id, L) }; };
const here = (o, members) => members.filter((m) => o[m.id] !== undefined);

/** The circle's choice: most votes; a tie goes to the host's vote, else the first kind voted. */
export function majority(votes, hostId) {
  const n = {}; for (const f of Object.values(votes)) n[f] = (n[f] || 0) + 1;
  const top = Math.max(0, ...Object.values(n)), best = Object.keys(n).filter((f) => n[f] === top);
  if (!best.length) return null;
  return best.length > 1 && best.includes(votes[hostId]) ? votes[hostId] : best[0];
}
function settleVote(st, g, hostId) { st.field = majority(st.votes, hostId); st.fieldRight = st.field === g.field; return "field"; }

/** Apply one move from `who` (an id). members: [{id, name}] at the table now. Returns what happened, or null. */
export function groupAct(st, who, act, members, hostId) {
  const { L, g } = groupGhost(st); if (!g || st.over || !act) return null;
  const nameOf = (id) => (members.find((m) => m.id === id) || {}).name || "a guest";
  if (act.a === "vote") {
    if (st.field || !FIELDS[act.f]) return null;
    st.votes[who] = act.f;
    return here(st.votes, members).length >= members.length ? settleVote(st, g, hostId) : "vote";
  }
  if (act.a === "close") { if (st.field || who !== hostId || !Object.keys(st.votes).length) return null; return settleVote(st, g, hostId); }
  if (!st.field) return null;
  if (act.a === "ask") {
    if (st.shown >= g.clues.length || st.candles <= 1) return null;
    st.asks[who] = 1;
    if (here(st.asks, members).length < Math.ceil(members.length / 2)) return "ask";
    st.shown++; st.candles--; st.asks = {}; return "clue";
  }
  if (act.a === "guess") {
    const text = String(act.text || "").trim().slice(0, 60); if (!text) return null;
    const x = whoIs(text, L, g), entry = { who, name: nameOf(who), text, ok: null };
    const push = () => { st.log.push(entry); if (st.log.length > LOG_MAX) st.log.shift(); };
    if (!x) { push(); return "unknown"; }
    entry.text = x.name;
    if (isRight(g, x)) { entry.ok = true; push(); st.winner = who; st.winnerName = entry.name; st.over = true; return "right"; }
    entry.ok = false; push(); st.candles--;
    if (st.candles <= 0) { st.over = true; return "out"; }
    return "wrong";
  }
  return null;
}

/** What one sitter earns when the round ends. The winner's round is a real séance run (it fills their journal). */
export function groupReward(st, meId) {
  const L = LEVELS[st.n - 1], team = st.fieldRight ? fieldPts(L) : 0;
  if (st.winner === meId) return { won: true, run: { id: st.id, level: st.n, won: true, candles: st.candles, fieldRight: st.fieldRight, mode: "type", wrong: [] }, bonus: perCandle("type", L) };
  return { won: false, xp: 3 + team, essence: team };
}
