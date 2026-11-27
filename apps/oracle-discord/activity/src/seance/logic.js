// The Séance: Guess the Ghost, rules kept pure for tests. Progress lives in prog.rooms.seance:
//   { plays, solved: { "<level>:<id>": bestScore }, last }
// Each séance has 5 candles. The ghost's first clue is free; each further clue snuffs a candle, and so does each wrong
// name. Step 1: magic, science or a bit of both (one try). Step 2: name it. Level 1 names the kind of practice from a
// small answer pool (a cardiologist counts as Biology); level 2 names the exact technique; level 3 names the person.
// Typing is the challenge; "show me 4" blows out 3 candles (always leaving one). Points scale with the level. First
// identification pays ✦ and 💎; replays pay only the improvement on your best.
import { GHOSTS } from "./ghosts.js";
import { POOL, GENERAL, SPECIFIC } from "./practices.js";

/** Three levels: 1 general practices, 2 specific practices, 3 historical people. Points scale with the level. */
export const LEVELS = [
  { n: 1, name: "Apprentice", what: "General practices", deck: GENERAL, pool: POOL, ask: "Which kind of science or magic did it practise?", mult: 1 },
  { n: 2, name: "Adept", what: "Specific techniques", deck: SPECIFIC, ask: "Which technique is this?", mult: 1.5 },
  { n: 3, name: "Master", what: "Historical scientists and magicians", deck: GHOSTS, ask: "Who is this?", mult: 2 },
];
export const ALL = LEVELS.flatMap((L) => L.deck.map((g) => ({ L, g })));
export const keyOf = (L, g) => L.n + ":" + g.id;
const TOTAL = ALL.length;
export const TITLES = [{ at: 0, name: "Curious" }, { at: 6, name: "Medium-rare" }, { at: 14, name: "Ghost Whisperer" }, { at: 24, name: "Spirit Scholar" }, { at: TOTAL, name: "Master of the Séance" }];

export const CANDLES = 5;
export const FIELD_PTS = 5;
export const PICK_COST = 3;
export const perCandle = (mode, L = LEVELS[2]) => Math.round(3 * L.mult);
export const fieldPts = (L = LEVELS[2]) => Math.round(FIELD_PTS * L.mult);

export const room = (p) => {
  const r = ((p.rooms ||= {}).seance ||= { plays: 0, solved: {}, last: null });
  r.solved ||= {}; return r;
};
export const solvedCount = (p, L) => (L ? L.deck.filter((g) => room(p).solved[keyOf(L, g)]).length : ALL.filter(({ L: l, g }) => room(p).solved[keyOf(l, g)]).length);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const ghostById = (id, L = LEVELS[2]) => L.deck.find((g) => g.id === id);
export const nextGhost = (p, L, after) => {
  const open = L.deck.filter((g) => !room(p).solved[keyOf(L, g)] && g.id !== after);
  const pool = open.length ? open : L.deck.filter((g) => g.id !== after);
  return pool[Math.floor(Math.random() * pool.length)] || L.deck[0];
};

export const start = (g, L = LEVELS[2]) => ({ id: g.id, level: L.n, shown: 1, candles: CANDLES, field: null, fieldRight: false, wrong: [], mode: "type", done: false, won: false });

export function guessField(run, g, f) { if (run.field) return null; run.field = f; run.fieldRight = f === g.field; return run.fieldRight; }

/** Another clue from the ghost. Keeps one candle back for a final guess. */
export function moreClue(run, g) {
  if (run.done || run.shown >= g.clues.length || run.candles <= 1) return false;
  run.shown++; run.candles--; return true;
}

/** Switch to multiple choice: blows out 3 candles, always leaving one for the guess. */
export const usePick = (run) => { if (run.mode === "pick" || run.done) return false; run.mode = "pick"; run.candles = Math.max(1, run.candles - PICK_COST); return true; };

/** What a level's answers are: the pool at level 1, the deck itself at levels 2-3. */
export const optionsOf = (L) => L.pool || L.deck;
export const optionById = (id, L = LEVELS[2]) => optionsOf(L).find((x) => x.id === id);
/** Is this answer right for this ghost? Level 1 accepts any pool entry in g.answers. */
export const isRight = (g, x) => !!x && (x.id === g.id || (g.answers || []).includes(x.id));
/** The answers a ghost accepts, as pool entries (level 1), or just the ghost. */
export const answersOf = (g, L) => (L.pool ? g.answers.map((id) => L.pool.find((x) => x.id === id)) : [g]);

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const tol = (n) => (n < 6 ? 0 : n < 10 ? 1 : 2);
/** Which answer a typed name means (forgiving small typos), or null. Level 1 matches the pool, plus the current
 *  ghost's own job title ("cardiologist") when g is given. */
export function whoIs(text, L = LEVELS[2], g = null) {
  const t = norm(text); if (!t) return null;
  let best = null, bd = Infinity;
  const list = L.pool ? [...L.pool, ...(g ? [g] : [])] : L.deck;
  for (const x of list) for (const a of x.aliases) { const d = lev(t, norm(a)); if (d < bd) { bd = d; best = x; } }
  if (!best) return null;
  const ok = best.aliases.some((a) => lev(t, norm(a)) <= tol(norm(a).length));
  return ok ? best : null;
}

/** Four answers to choose from: one right one and three wrong, preferring the same kind. Stable per ghost. */
export function choices(g, L = LEVELS[2]) {
  const opts = optionsOf(L), right = L.pool ? answersOf(g, L)[0] : g;
  const h = [...g.id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0;
  const wrong = opts.filter((x) => !isRight(g, x));
  const same = wrong.filter((x) => x.field === g.field), other = wrong.filter((x) => x.field !== g.field);
  const pool = [...same, ...other], picks = [];
  for (let i = 0; picks.length < 3; i++) { const x = pool[(h + i * 7) % pool.length]; if (!picks.includes(x)) picks.push(x); }
  const all = [right, ...picks], k = h % 4;
  return [...all.slice(k), ...all.slice(0, k)];
}

/** Name the ghost (an answer from whoIs or the choices). "right" | "wrong" | "out" | null. */
export function guessName(run, g, pick) {
  if (run.done) return null;
  if (isRight(g, pick)) { run.done = true; run.won = true; return "right"; }
  run.wrong.push(pick ? pick.id : "?"); run.candles--;
  if (run.candles <= 0) { run.done = true; return "out"; }
  return "wrong";
}

export const levelOf = (run) => LEVELS[(run.level || 3) - 1];
export const scoreOf = (run) => (run.fieldRight ? fieldPts(levelOf(run)) : 0) + (run.won ? perCandle(run.mode, levelOf(run)) * run.candles : 0);

/** Settle a finished séance into progress. Returns { xp, essence, first, best, score }. */
export function settle(p, run) {
  const r = room(p), k = run.level + ":" + run.id; r.plays++; r.last = run.id;
  const out = { xp: 0, essence: 0, first: false, best: false, score: scoreOf(run) };
  if (!run.won) { out.xp = 3; return out; }
  const prev = r.solved[k] || 0; out.first = !prev;
  if (out.score > prev) { out.best = !!prev; out.xp = out.essence = out.score - prev; r.solved[k] = out.score; }
  return out;
}
