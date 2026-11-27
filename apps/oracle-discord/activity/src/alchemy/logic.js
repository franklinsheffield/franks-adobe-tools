// Alchemist's Lab rules, kept pure for tests. Progress lives in prog.rooms.alchemy:
//   { plays, solved: { "<level>:<id>": bestScore }, elements: [symbols lit on your periodic table], last }
// Every experiment has 4 furnace flames. Level 1: say which substance a symbol stands for (a second clue or a wrong
// answer costs a flame). Levels 2-3: choose the reagents and the operation, then Transmute; a failed mix or a hint
// from the notebook costs a flame. Level 3 then asks what the experiment really found (one try, bonus points).
// Points scale ×1 / ×1.5 / ×2. First success pays ✦ and 💎; replays pay only the improvement on your best.
import { SYMBOLS, RECIPES, DISCOVERIES, OPS_ALCH, HAZARDS } from "./lab.js";

export const LEVELS = [
  { n: 1, name: "Apprentice", what: "Read the symbols", deck: SYMBOLS, mult: 1 },
  { n: 2, name: "Journeyman", what: "Follow the old recipes", deck: RECIPES, mult: 1.5 },
  { n: 3, name: "Adept", what: "Alchemy becomes chemistry", deck: DISCOVERIES, mult: 2 },
];
export const ALL = LEVELS.flatMap((L) => L.deck.map((x) => ({ L, x })));
export const keyOf = (L, x) => L.n + ":" + x.id;
export const TITLES = [{ at: 0, name: "Puffer" }, { at: 5, name: "Apprentice" }, { at: 12, name: "Journeyman" }, { at: 21, name: "Adept" }, { at: ALL.length, name: "Chymist" }];
export const FLAMES = 4;
export const PER_FLAME = 5, NAME_PTS = 10;
export const opsFor = (L) => (L.n === 3 ? [...OPS_ALCH, "electrolyse"] : OPS_ALCH);

export const room = (p) => {
  const r = ((p.rooms ||= {}).alchemy ||= { plays: 0, solved: {}, elements: [], last: null });
  r.solved ||= {}; r.elements ||= []; return r;
};
export const solvedCount = (p, L) => (L ? L.deck.filter((x) => room(p).solved[keyOf(L, x)]).length : ALL.filter(({ L: l, x }) => room(p).solved[keyOf(l, x)]).length);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const byId = (id, L) => L.deck.find((x) => x.id === id);
export function nextOf(p, L, after) {
  const open = L.deck.filter((x) => !room(p).solved[keyOf(L, x)] && x.id !== after);
  const pool = open.length ? open : L.deck.filter((x) => x.id !== after);
  return pool[Math.floor(Math.random() * pool.length)] || L.deck[0];
}
const hash = (s) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

export const start = (x, L) => ({ id: x.id, level: L.n, flames: FLAMES, clues: 1, wrong: [], hints: [], tries: 0, stage: L.n === 1 ? "read" : "bench", named: null, done: false, won: false });
const spend = (run) => { run.flames--; if (run.flames <= 0) { run.flames = 0; run.done = true; } };

// ---- level 1 ----
/** Four names to choose from: the answer and three others, stable per symbol. */
export function options(x) {
  const h = hash(x.id), others = SYMBOLS.filter((s) => s.id !== x.id), picks = [];
  for (let i = 0; picks.length < 3; i++) { const s = others[(h + i * 5) % others.length]; if (!picks.includes(s)) picks.push(s); }
  const all = [x, ...picks], k = h % 4; return [...all.slice(k), ...all.slice(0, k)];
}
/** Show the second clue for a flame (keeps one flame back). */
export function moreClue(run, x) { if (run.done || run.clues >= x.clues.length || run.flames <= 1) return false; run.clues++; run.flames--; return true; }
/** "right" | "wrong" | "out" | null */
export function readSymbol(run, x, id) {
  if (run.done || run.wrong.includes(id)) return null;
  if (id === x.id) { run.done = run.won = true; return "right"; }
  run.wrong.push(id); spend(run); return run.done ? "out" : "wrong";
}

// ---- levels 2 and 3: the bench ----
/** Compare a mix with the recipe. Returns { ok, right, extra, missing, opRight } (counts, so feedback teaches without telling). */
export function judge(x, ings, op) {
  const set = [...new Set(ings)], right = set.filter((i) => x.make.includes(i)).length;
  const extra = set.length - right, missing = x.make.length - right, opRight = op === x.op;
  return { ok: !extra && !missing && opRight, right, extra, missing, opRight };
}
/** The real hazard this mix and operation set off, or null. */
export function hazardOf(ings, op) {
  return HAZARDS.find((h) => h.all.every((i) => ings.includes(i)) && (!h.any || h.any.some((i) => ings.includes(i))) && (!h.ops || h.ops.includes(op))) || null;
}
/** Transmute. "right" | "wrong" | "out" | "boom" | null, plus the judgement in run.last (or the hazard in run.boom). */
export function transmute(run, x, ings, op) {
  if (run.done || run.stage !== "bench" || !op || !ings.length) return null;
  run.tries++;
  const hz = hazardOf(ings, op);
  if (hz) { run.boom = hz.id; run.flames = 0; run.done = true; run.won = false; return "boom"; } const j = judge(x, ings, op); run.last = j;
  if (j.ok) { if (run.level === 3) run.stage = "name"; else { run.done = run.won = true; } return "right"; }
  spend(run); return run.done ? "out" : "wrong";
}
/** The notebook's next hint for a flame: first the hint line, then each reagent, then the operation. Keeps one flame. */
export function hintOf(run, x) {
  if (run.done || run.stage !== "bench" || run.flames <= 1) return null;
  const next = !run.hints.includes("line") ? "line" : x.make.find((i) => !run.hints.includes(i)) || (!run.hints.includes("op:" + x.op) ? "op:" + x.op : null);
  if (!next) return null;
  run.hints.push(next); run.flames--; return next;
}
/** Level 3: what did the experiment find? One try. */
export function nameIt(run, x, choice) {
  if (run.stage !== "name" || run.done) return null;
  run.named = choice === x.answer; run.done = run.won = true; run.stage = "done"; return run.named;
}

export const levelOf = (run) => LEVELS[run.level - 1];
export const scoreOf = (run) => { const m = levelOf(run).mult; return run.won ? Math.round(run.flames * PER_FLAME * m + (run.named ? NAME_PTS * m : 0)) : 0; };

/** Settle a finished experiment into progress. Returns { xp, essence, first, best, score, newEls }. */
export function settle(p, run, x) {
  const r = room(p), k = run.level + ":" + run.id; r.plays++; r.last = run.id;
  const out = { xp: 0, essence: 0, first: false, best: false, score: scoreOf(run), newEls: [] };
  if (run.boom) { r.booms = (r.booms || 0) + 1; (r.accidents ||= []).includes(run.boom) || r.accidents.push(run.boom); out.boom = true; return out; }
  if (!run.won) { out.xp = 3; return out; }
  for (const e of x.el || []) if (!r.elements.includes(e)) { r.elements.push(e); out.newEls.push(e); }
  const prev = r.solved[k] || 0; out.first = !prev;
  if (out.score > prev) { out.best = !!prev; out.xp = out.essence = out.score - prev; r.solved[k] = out.score; }
  return out;
}
