// The Séance: Guess the Ghost, rules kept pure for tests. Progress lives in prog.rooms.seance:
//   { plays, solved: { "<level>:<id>": bestScore }, last }
// Each séance has 5 candles. The ghost's first clue is free; each further clue snuffs a candle, and so does each wrong
// name. Step 1: magic, science or a bit of both (one try). Step 2: name it. Level 1 names the kind of practice from a
// small answer pool (a cardiologist counts as Biology); level 2 names the exact technique; level 3 names the person.
// Typing is the challenge; "show me 4" blows out 3 candles (always leaving one). Points scale with the level. First
// identification pays ✦ and 💎; replays pay only the improvement on your best.
import { GHOSTS } from "./ghosts.js";
import { POOL, GENERAL, SPECIFIC } from "./practices.js";
import { SKEPTICS, CASES } from "./debunk.js";

/** Four levels: 1 general practices, 2 specific practices, 3 historical people, 4 debunk a fake medium. Points scale. */
export const LEVELS = [
  { n: 1, name: "Apprentice", what: "General practices", deck: GENERAL, pool: POOL, ask: "Which kind of science or magic did it practise?", mult: 1 },
  { n: 2, name: "Adept", what: "Specific techniques", deck: SPECIFIC, ask: "Which technique is this?", mult: 1.5 },
  { n: 3, name: "Master", what: "Historical scientists and magicians", deck: GHOSTS, ask: "Who is this?", mult: 2 },
  { n: 4, name: "Debunker", what: "Expose a fake medium", deck: CASES, pool: SKEPTICS, ask: "Who exposed the trick?", mult: 2.5, debunk: true },
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
/** Level 4's first step: which of the four explanations is the real method (one try). */
export function guessMethod(run, g, i) { if (run.field) return null; run.field = "m" + i; run.fieldRight = +i === g.answer; return run.fieldRight; }

/** Paid hints (💎 Essence), each once per séance, before you spend candles. Returns [{ id, label, text }]. */
export const HINT_COST = 15;
export function hintsFor(L, g) {
  const right = L.pool ? L.pool.find((x) => x.id === g.answers[0]) : g, nm = right.name;
  const out = [{ id: "letter", label: "🔤 First letter", text: `It begins with “${nm.replace(/^(the|a|an) /i, "").charAt(0).toUpperCase()}”.` }];
  if (g.life) out.push({ id: "when", label: "🗓️ When", text: `They lived ${g.life}.` });
  if (g.year) out.push({ id: "when", label: "🗓️ When", text: `It happened in ${g.year}${g.place ? ", " + g.place : ""}.` });
  if (L.pool) { const h = [...g.id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0, wrong = L.pool.filter((x) => !g.answers.includes(x.id));
    const two = [wrong[h % wrong.length], wrong[(h + 5) % wrong.length]].filter((x, i, a) => a.indexOf(x) === i);
    out.push({ id: "narrow", label: "🧭 Narrow it", text: `It's one of: ${[right, ...two].sort((a, b) => a.name.localeCompare(b.name)).map((x) => x.name).join(", ")}.` }); }
  else out.push({ id: "shape", label: "📏 Shape", text: `${nm.split(/\s+/).map((w) => w.replace(/[A-Za-z]/g, "_")).join("  ")} (${nm.split(/\s+/).length} word${nm.split(/\s+/).length > 1 ? "s" : ""})` });
  return out;
}
/** Spend Essence on a hint. "ok" | "poor" | "had". */
export function buyHint(p, run, id) {
  run.hints ||= []; if (run.hints.includes(id)) return "had";
  if ((p.essence || 0) < HINT_COST) return "poor";
  p.essence -= HINT_COST; run.hints.push(id); return "ok";
}

/** The ghost journal's "try next": a related ghost on another level (shared kind or a named link), else same level. */
const LINKS = { houdini: ["2:metamorph", "1:straitjacket", "4:margery"], pepper: ["2:peppersghost"], tesla: ["2:teslacoil", "1:electric"], faraday: ["2:induction", "4:table"],
  maskelyne: ["4:davenport", "1:vanisher"], curie: ["1:forensic"], newton: ["1:lensmaker", "2:spectroscopy"], galileo: ["1:astrophys"], dee: ["1:courtastro"], kepler: ["1:courtastro", "1:almanac"],
  paracelsus: ["1:elixir", "2:distil"], rosalind: ["2:xray"], benfranklin: ["1:hypnotist", "2:doubleblind"], vernon: ["1:cardsharp", "2:force"], kellar: ["1:levitator"], chunglingsoo: ["2:bulletcatch"],
  darwin: ["1:marinebio", "1:botanist"], lovelace: ["1:electric"], roberthoudin: ["1:vanisher"], adelaide: ["1:assistant", "2:bulletcatch"],
  table: ["3:faraday"], davenport: ["3:maskelyne"], margery: ["3:houdini"], mumler: ["1:spiritphoto"], duncan: ["1:ectoplasm"], forer: ["1:fortune", "2:coldreading"], cottingley: ["1:spiritphoto"] };
export function related(L, g) {
  const found = (LINKS[g.id] || []).map((k) => { const [n, id] = k.split(":"), l = LEVELS[+n - 1]; const x = l && ghostById(id, l); return x ? { L: l, g: x } : null; }).filter(Boolean);
  if (found.length) return found[0];
  const same = L.deck.filter((x) => x.id !== g.id && x.field === g.field && (!g.answers || (x.answers || [])[0] === g.answers[0]));
  const pool = same.length ? same : L.deck.filter((x) => x.id !== g.id);
  const h = [...g.id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0;
  return { L, g: pool[h % pool.length] };
}

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

/** Daily Ghost: everyone gets the same ghost each UTC day (seed from daily.js). The level rotates 1, 2, 3, 4. */
export function dailyPick(seed) {
  const L = LEVELS[seed % LEVELS.length];
  return { L, g: L.deck[Math.floor(seed / LEVELS.length) % L.deck.length] };
}
/** A spoiler-free result line to paste in chat: lit and snuffed candles, never the answer. */
export function shareLine(run, L, n) {
  const c = "🕯️".repeat(run.candles) + "💨".repeat(CANDLES - run.candles);
  return `🕯️ Séance Daily #${n} · Level ${L.n} · ${run.won ? c : "💀".repeat(CANDLES)} · ${run.won ? (run.mode === "type" ? "named it ✍️" : "picked it 🎴") : "stumped"}${run.fieldRight ? " · ✓ kind" : ""}${(run.hints || []).length ? ` · ${run.hints.length} hint${run.hints.length > 1 ? "s" : ""}` : ""}`;
}
