// Split Key: the Cipher Desk's team race. Rules kept pure for tests; the room is splitkey-room.js.
// Everyone at the table is split at random into two teams, Team Quill and Team Seal. Both teams get the same bundle of
// documents (same seed) and race through it: anyone on a team can name the method or set the key on the team's current
// document, and ink is shared. Each team has its own chat that the other team never sees (filtered; party/filter.js).
// First team through the bundle gets a bonus; when both are through, or time runs out, the higher score wins.
// Alone, you race Wren's apprentices, a spirit team the host runs.
import { start, current, tryMethod, tryKey, next, rightCount, rng } from "./logic.js";
import { LEVELS } from "./data.js";
import { check } from "../party/filter.js";

export const TEAMS = { quill: { name: "Team Quill", e: "🪶", colour: "#e05a4f" }, seal: { name: "Team Seal", e: "🔵", colour: "#4f8fe0" } };
export const RACE_BONUS = 3, TIME = 300, CHAT_MAX = 14;
export const QUICK = ["Count the letters!", "Try the Caesar wheel", "Looks like numbers to me", "Dots and dashes?", "I think it's a keyword", "Nice one!", "Slow down, ink is shared", "Go go go!"];
export const BOT = "spirit:apprentices", BOT_NAME = "Wren's apprentices 👻";

const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const raceLevel = (n) => ({ ...LEVELS[n - 1], forgery: false }); // a race is all ciphers; forgeries stay at the desk

/** Split ids at random into two teams as even as can be. Alone: you against the apprentices. */
export function split(ids, rand = Math.random) {
  if (ids.length < 2) return { quill: ids.slice(), seal: [BOT] };
  const s = shuffle(ids, rand), half = Math.ceil(s.length / 2);
  return rand() < 0.5 ? { quill: s.slice(0, half), seal: s.slice(half) } : { quill: s.slice(s.length - half), seal: s.slice(0, s.length - half) };
}

export function newRace(members, n = 1, rand = Math.random, seed = Math.floor(rand() * 1e9)) {
  const teams = split(members.map((m) => m.id), rand), L = raceLevel(n);
  const team = (k) => ({ ids: teams[k], run: start(L, { seed }), done: false, at: 0, bonus: 0, chat: [], last: null });
  return { n, seed, phase: "race", teams: { quill: team("quill"), seal: team("seal") }, order: 0, winner: null, over: false, round: 1 };
}
export const teamOf = (st, who) => Object.keys(st.teams).find((k) => st.teams[k].ids.includes(who)) || null;
export const scoreOf = (t) => t.run.score + t.bonus;

/** A late arrival joins the smaller team (the apprentices never take people). */
export function join(st, who) {
  if (st.over || teamOf(st, who)) return null;
  const ks = Object.keys(st.teams).filter((k) => !st.teams[k].ids.includes(BOT)).sort((a, b) => st.teams[a].ids.length - st.teams[b].ids.length);
  if (!ks.length) return null; st.teams[ks[0]].ids.push(who); return ks[0];
}

function moveOn(st, t, res) {
  const it = current(t.run); t.last = { i: t.run.i, res, right: !!it.right, m: it.m, key: it.key, id: it.id };
  if (!next(t.run)) { t.done = true; t.at = ++st.order; if (t.at === 1) t.bonus += RACE_BONUS; t.run.i = t.run.items.length - 1; }
  if (Object.values(st.teams).every((x) => x.done)) end(st);
}

/** A team move from `who`: { a: "method", m } or { a: "key", k }. Returns what happened, or null. */
export function play(st, who, act) {
  const k = teamOf(st, who); if (st.over || !k || !act) return null; const t = st.teams[k]; if (t.done) return null;
  const r = act.a === "method" ? tryMethod(t.run, act.m) : act.a === "key" ? tryKey(t.run, act.k) : null;
  if (!r) return null;
  if (r === "right" || r === "out") moveOn(st, t, r); else t.last = { i: t.run.i, res: r };
  return r;
}

/** Team chat: filtered, kept to the team, last CHAT_MAX lines. -> { ok, line } | { ok: false, why } */
export function say(st, who, text, name = who) {
  const k = teamOf(st, who); if (!k) return { ok: false, why: "team" };
  const c = QUICK.includes(text) ? { ok: true, text } : check(text); if (!c.ok) return c;
  const line = { who, name, text: c.text }; const ch = st.teams[k].chat; ch.push(line); if (ch.length > CHAT_MAX) ch.shift();
  return { ok: true, line, team: k };
}

/** The apprentices: on each host tick, maybe crack (or botch) their current document. Easy enough to beat. */
export function botStep(st, rand = Math.random) {
  const k = teamOf(st, BOT); if (!k || st.over) return null; const t = st.teams[k]; if (t.done) return null;
  if (rand() > 0.045) return null; // about one document every 20-25 seconds of ticks
  const it = current(t.run), solved = rand() < 0.7;
  if (solved) { if (rand() < 0.5 && it.choices) { const wrongM = it.choices.find((m) => m !== it.m && !it.tried.includes(m)); if (wrongM) tryMethod(t.run, wrongM); }
    tryMethod(t.run, it.m); if (!it.done && it.stage === "key") tryKey(t.run, it.key); }
  else { while (!it.done) { const m = (it.choices || []).find((x) => x !== it.m && !it.tried.includes(x)); if (!m) { it.drops = 0; it.done = true; break; } tryMethod(t.run, m); } }
  moveOn(st, t, it.right ? "right" : "out"); return it.right ? "right" : "out";
}

function end(st) {
  if (st.over) return; st.over = true; st.phase = "over";
  const q = scoreOf(st.teams.quill), s = scoreOf(st.teams.seal);
  const qa = st.teams.quill.at || 99, sa = st.teams.seal.at || 99;
  st.winner = q > s ? "quill" : s > q ? "seal" : qa < sa ? "quill" : sa < qa ? "seal" : "draw"; // a tie goes to the team that finished first
}
/** Time's up (or the host calls it). */
export const timeUp = (st) => end(st);

/** What one person sees: their own team's run and chat in full; of the other team, only progress and score. */
export function raceView(st, forId) {
  const mine = teamOf(st, forId), out = {};
  for (const [k, t] of Object.entries(st.teams)) out[k] = k === mine || st.over
    ? { ...t, chat: k === mine ? t.chat : [] }
    : { ids: t.ids, done: t.done, at: t.at, bonus: t.bonus, chat: [], last: null, run: { i: t.run.i, score: t.run.score, n: t.run.items.length, right: rightCount(t.run) } };
  return { ...st, teams: out, mine };
}

/** Your reward: the winning team's people get more. Racing the apprentices pays less. */
export function reward(st, me) {
  const k = teamOf(st, me); if (!k) return { won: false, xp: 0, essence: 0, read: 0 };
  const t = st.teams[k], read = rightCount(t.run), vsBot = Object.values(st.teams).some((x) => x.ids.includes(BOT)), won = st.winner === k;
  return { won, draw: st.winner === "draw", read, perfect: read === t.run.items.length && t.run.items.every((x) => !x.tried.length), xp: 4 + read * 2 + (won ? 6 : 0),
    essence: Math.min(vsBot ? 6 : 10, read + (won ? 4 : 0)) };
}
export { rng };
