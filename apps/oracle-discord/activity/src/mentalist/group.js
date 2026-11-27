// The two-person act with friends (activity/tables.mjs + src/net.js). One player is the mentalist (blindfolded on
// stage), one is the assistant in the audience, everyone else watches. Each round the assistant sees a card and
// sends one cue word from the Houdinis' code; the mentalist hears only the cue and names the card. 3 hits out of 5
// and the act is a success for everyone. Roles rotate each game. The host's client keeps this state.
import { CODE, CARD, valueOf } from "./data.js";

export const ACT_ROUNDS = 5, ACT_PASS = 3;
const LOG_MAX = 10;
export function actStart(members, game = 1, rand = Math.random) {
  const ids = members.map((m) => m.id), n = ids.length;
  const mentalist = ids[(game - 1) % n], assistant = ids[game % n];
  const cards = Array.from({ length: ACT_ROUNDS }, () => 1 + Math.floor(rand() * 10));
  return { game, mentalist, assistant, cards, i: 0, cue: null, hits: 0, log: [], over: false };
}
/** Apply a move from `who`. Returns "cue" | "round" | "over" | null. */
export function actMove(st, who, a) {
  if (!st || st.over || !a) return null;
  if (a.a === "cue") { if (who !== st.assistant || !valueOf(a.w) || st.cue) return null; st.cue = a.w; return "cue"; }
  if (a.a === "name") { if (who !== st.mentalist || !st.cue) return null; const v = +a.v; if (!(v >= 1 && v <= 10)) return null;
    const card = st.cards[st.i], sent = valueOf(st.cue), hit = v === card; if (hit) st.hits++;
    st.log.unshift({ card, cue: st.cue, said: v, hit, clean: sent === card }); st.log.length = Math.min(st.log.length, LOG_MAX);
    st.i++; st.cue = null; if (st.i >= st.cards.length) { st.over = true; return "over"; } return "round"; }
  return null;
}
/** The mentalist never sees the card before naming it; everyone else does. */
export const actView = (st, forId) => (forId === st.mentalist ? { ...st, cards: st.cards.map((c, k) => (k < st.i ? c : null)) } : st);
/** Everyone shares the result: a hit rate of 3 out of 5 or better is a success. */
export function actReward(st) { const won = st.hits >= ACT_PASS; return { won, xp: won ? 12 : 4, essence: won ? 6 : 2 }; }
export { CODE, CARD };
