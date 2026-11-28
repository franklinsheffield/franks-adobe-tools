// Dark Séance with friends (activity/tables.mjs + src/net.js): one player is the medium, everyone else is the
// investigating committee. Each round the sitters ask for an effect. The medium secretly picks a method; each
// investigator picks one control. Then the lights go up: if any chosen control beats the method (or the method can't
// make that effect) the committee scores, otherwise the medium does. The host's client keeps this state.
import { METHODS, CONTROLS, works, makes, methodOf } from "./data.js";

export const GROUP_ROUNDS = 5, GROUP_EFFECTS = ["rap", "tilt", "touch", "bell", "trumpet", "voice", "tambourine", "form", "apport", "slate"];
const LOG_MAX = 10;
export function groupStart(members, game = 1, rand = Math.random) {
  const ids = members.map((m) => m.id), medium = ids[(game - 1) % ids.length], effects = [];
  for (let i = 0; i < GROUP_ROUNDS; i++) { const pool = GROUP_EFFECTS.filter((e) => e !== effects[i - 1]); effects.push(pool[Math.floor(rand() * pool.length)]); }
  return { game, medium, effects, i: 0, pick: null, ctl: {}, score: { medium: 0, table: 0 }, log: [], over: false };
}
export const methodsFor = (effect) => METHODS.filter((m) => makes(m.id, effect)).map((m) => m.id);
const investigators = (st, members) => members.filter((m) => m.id !== st.medium);
/** Apply a move from `who`. Returns "pick" | "ctl" | "round" | "over" | null. */
export function groupAct(st, who, act, members, hostId) {
  if (!st || st.over || !act) return null;
  if (act.a === "pick") { if (who !== st.medium || !methodOf(act.m) || !makes(act.m, st.effects[st.i])) return null; st.pick = act.m; }
  else if (act.a === "ctl") { if (who === st.medium || !CONTROLS[act.c]) return null; st.ctl[who] = act.c; }
  else if (act.a === "reveal") { if (who !== hostId || !st.pick) return null; return resolve(st, members); }
  else return null;
  const inv = investigators(st, members), all = inv.every((m) => st.ctl[m.id]);
  return st.pick && all ? resolve(st, members) : act.a;
}
function resolve(st, members) {
  const effect = st.effects[st.i], used = [...new Set(Object.values(st.ctl))], m = methodOf(st.pick), ok = works(st.pick, effect, used);
  const beat = m.beaten.filter((c) => used.includes(c)), by = Object.entries(st.ctl).filter(([, c]) => beat.includes(c)).map(([id]) => (members.find((x) => x.id === id) || {}).name || "a sitter");
  ok ? st.score.medium++ : st.score.table++;
  st.log.unshift({ effect, method: st.pick, controls: used, ok, beat, by }); st.log.length = Math.min(st.log.length, LOG_MAX);
  st.i++; st.pick = null; st.ctl = {};
  if (st.i >= st.effects.length) { st.over = true; return "over"; }
  return "round";
}
/** What everyone but the medium may see: the medium's pick stays hidden until the lights go up. */
export const publicView = (st, forId) => (forId === st.medium ? st : { ...st, pick: st.pick ? "?" : null });
/** Your side's result when the game is over. */
export function groupReward(st, me) {
  const mediumWon = st.score.medium > st.score.table, mine = me === st.medium ? mediumWon : !mediumWon;
  return { won: mine, xp: mine ? 12 : 4, essence: mine ? 6 : 2 };
}
