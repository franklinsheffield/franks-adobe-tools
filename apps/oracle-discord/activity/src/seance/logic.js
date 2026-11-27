// The Séance: Guess the Ghost, rules kept pure for tests. Progress lives in prog.rooms.seance:
//   { plays, solved: { ghostId: bestScore }, last }
// A séance has 5 candles. The ghost's first clue is free; each further clue snuffs a candle, and so does each wrong
// name. Step 1: say whether the ghost was a magician, a scientist or a bit of both (+10 if right, one try).
// Step 2: name the ghost. Typing the name is the challenge (6 per candle left); asking for four names to pick from
// halves that (3 per candle). First identification pays ✦ and 💎; replays pay only the improvement on your best.
import { GHOSTS, TITLES } from "./ghosts.js";

export const CANDLES = 5;
export const FIELD_PTS = 10;
export const perCandle = (mode) => (mode === "pick" ? 3 : 6);

export const room = (p) => {
  const r = ((p.rooms ||= {}).seance ||= { plays: 0, solved: {}, last: null });
  r.solved ||= {}; return r;
};
export const solvedCount = (p) => GHOSTS.filter((g) => room(p).solved[g.id]).length;
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const ghostById = (id) => GHOSTS.find((g) => g.id === id);
export const nextGhost = (p, after) => {
  const open = GHOSTS.filter((g) => !room(p).solved[g.id] && g.id !== after);
  const pool = open.length ? open : GHOSTS.filter((g) => g.id !== after);
  return pool[Math.floor(Math.random() * pool.length)] || GHOSTS[0];
};

export const start = (g) => ({ id: g.id, shown: 1, candles: CANDLES, field: null, fieldRight: false, wrong: [], mode: "type", done: false, won: false });

export function guessField(run, g, f) { if (run.field) return null; run.field = f; run.fieldRight = f === g.field; return run.fieldRight; }

/** Another clue from the ghost. Keeps one candle back for a final guess. */
export function moreClue(run, g) {
  if (run.done || run.shown >= g.clues.length || run.candles <= 1) return false;
  run.shown++; run.candles--; return true;
}

/** Switch to multiple choice (halves the points for the name). */
export const usePick = (run) => { run.mode = "pick"; };

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const tol = (n) => (n < 6 ? 0 : n < 10 ? 1 : 2);
/** Which ghost a typed name means (forgiving small typos), or null. */
export function whoIs(text) {
  const t = norm(text); if (!t) return null;
  let best = null, bd = Infinity;
  for (const g of GHOSTS) for (const a of g.aliases) { const d = lev(t, norm(a)); if (d < bd) { bd = d; best = g; } }
  if (!best) return null;
  const ok = best.aliases.some((a) => lev(t, norm(a)) <= tol(norm(a).length));
  return ok ? best : null;
}

/** Four names to choose from: the ghost and three others, preferring the same kind. Stable per ghost. */
export function choices(g) {
  const h = [...g.id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0;
  const same = GHOSTS.filter((x) => x.id !== g.id && x.field === g.field), other = GHOSTS.filter((x) => x.id !== g.id && x.field !== g.field);
  const pool = [...same, ...other], picks = [];
  for (let i = 0; picks.length < 3; i++) { const x = pool[(h + i * 7) % pool.length]; if (!picks.includes(x)) picks.push(x); }
  const all = [g, ...picks], k = h % 4;
  return [...all.slice(k), ...all.slice(0, k)];
}

/** Name the ghost (a ghost object, from whoIs or the choices). "right" | "wrong" | "out" | null. */
export function guessName(run, g, pick) {
  if (run.done) return null;
  if (pick && pick.id === g.id) { run.done = true; run.won = true; return "right"; }
  run.wrong.push(pick ? pick.id : "?"); run.candles--;
  if (run.candles <= 0) { run.done = true; return "out"; }
  return "wrong";
}

export const scoreOf = (run) => (run.fieldRight ? FIELD_PTS : 0) + (run.won ? perCandle(run.mode) * run.candles : 0);

/** Settle a finished séance into progress. Returns { xp, essence, first, best, score }. */
export function settle(p, run) {
  const r = room(p); r.plays++; r.last = run.id;
  const out = { xp: 0, essence: 0, first: false, best: false, score: scoreOf(run) };
  if (!run.won) { out.xp = 3; return out; }
  const prev = r.solved[run.id] || 0; out.first = !prev;
  if (out.score > prev) { out.best = !!prev; out.xp = out.essence = out.score - prev; r.solved[run.id] = out.score; }
  return out;
}
