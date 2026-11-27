// Herbalist's Grimoire: rules kept pure for tests. Progress lives in prog.rooms.grimoire:
//   { plays, solved: { "<level>:<id>": bestScore }, last }
// A specimen arrives with 5 leaves. Its first clue is free; each further clue and each wrong typed name costs a leaf;
// a wrong pick from the four choices costs WRONG_PICK (3) leaves.
// Step 1: name the plant (typed scores double; "show me 4" halves it). Step 2: gentle, handle with care, or poison?
// Step 3: one claim about it: does science back it, or is it just folklore? Points scale with the level.
// The first identification pays ✦ and 💎; replays pay only the improvement on your best.
import { KITCHEN, MEADOW, POISON } from "./plants.js";

export const LEVELS = [
  { n: 1, name: "Kitchen garden", what: "Herbs, spices and common garden plants", deck: KITCHEN, mult: 1 },
  { n: 2, name: "Apothecary's meadow", what: "Folk medicines of field and hedgerow", deck: MEADOW, mult: 1.5 },
  { n: 3, name: "The poison garden", what: "Witches' herbs and deadly plants", deck: POISON, mult: 2 },
];
export const ALL = LEVELS.flatMap((L) => L.deck.map((p) => ({ L, p })));
export const keyOf = (L, p) => L.n + ":" + p.id;
export const TITLES = [{ at: 0, name: "Seedling" }, { at: 6, name: "Herb Gatherer" }, { at: 14, name: "Hedge Scholar" }, { at: 24, name: "Apothecary" }, { at: ALL.length, name: "Master Herbalist" }];

export const LEAVES = 5;
export const WRONG_PICK = 3;
export const perLeaf = (mode, L = LEVELS[0]) => Math.round((mode === "pick" ? 1.5 : 3) * L.mult);
export const safetyPts = (L = LEVELS[0]) => Math.round(5 * L.mult);
export const claimPts = (L = LEVELS[0]) => Math.round(5 * L.mult);

export const room = (p) => {
  const r = ((p.rooms ||= {}).grimoire ||= { plays: 0, solved: {}, last: null });
  r.solved ||= {}; return r;
};
export const solvedCount = (p, L) => (L ? L.deck.filter((x) => room(p).solved[keyOf(L, x)]).length : ALL.filter(({ L: l, p: x }) => room(p).solved[keyOf(l, x)]).length);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const plantById = (id, L) => (L ? L.deck : ALL.map((x) => x.p)).find((x) => x.id === id);
export const levelOfPlant = (id) => LEVELS.find((L) => L.deck.some((x) => x.id === id));
export const nextPlant = (p, L, after) => {
  const open = L.deck.filter((x) => !room(p).solved[keyOf(L, x)] && x.id !== after);
  const pool = open.length ? open : L.deck.filter((x) => x.id !== after);
  return pool[Math.floor(Math.random() * pool.length)] || L.deck[0];
};

export const start = (plant, L = LEVELS[0]) => ({ id: plant.id, level: L.n, shown: 1, leaves: LEAVES, wrong: [], mode: "type", named: false, won: false, safety: null, safetyRight: false, claim: null, claimRight: false });

/** Another clue. Keeps one leaf back for a final guess. */
export function moreClue(run, plant) {
  if (run.named || run.shown >= plant.clues.length || run.leaves <= 1) return false;
  run.shown++; run.leaves--; return true;
}
export const usePick = (run) => { run.mode = "pick"; };

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const tol = (n) => (n < 5 ? 0 : n < 9 ? 1 : 2);
/** Which plant of a level a typed name means (forgiving small typos), or null. */
export function whichPlant(text, L = LEVELS[0]) {
  const t = norm(text); if (!t) return null;
  let best = null, bd = Infinity;
  for (const x of L.deck) for (const a of x.aliases) { const d = lev(t, norm(a)); if (d < bd) { bd = d; best = x; } }
  return best && best.aliases.some((a) => lev(t, norm(a)) <= tol(norm(a).length)) ? best : null;
}

/** Four names to pick from: the plant and three others, preferring the same danger class. Stable per plant. */
export function choices(plant, L = LEVELS[0]) {
  const h = [...plant.id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0;
  const same = L.deck.filter((x) => x.id !== plant.id && x.danger[0] === plant.danger[0]), other = L.deck.filter((x) => x.id !== plant.id && x.danger[0] !== plant.danger[0]);
  const pool = [...same, ...other], picks = [];
  for (let i = 0; picks.length < 3; i++) { const x = pool[(h + i * 7) % pool.length]; if (!picks.includes(x)) picks.push(x); }
  const all = [plant, ...picks], k = h % 4;
  return [...all.slice(k), ...all.slice(0, k)];
}

/** Name it (a plant object, from whichPlant or the choices). "right" | "wrong" | "out" | null. */
export function guessName(run, plant, pick) {
  if (run.named) return null;
  if (pick && pick.id === plant.id) { run.named = true; run.won = true; return "right"; }
  run.wrong.push(pick ? pick.id : "?"); run.leaves = Math.max(0, run.leaves - (run.mode === "pick" ? WRONG_PICK : 1));
  if (run.leaves <= 0) { run.named = true; return "out"; }
  return "wrong";
}

/** Gentle, care or poison? One answer; any of the plant's accepted classes counts. */
export function guessSafety(run, plant, d) { if (run.safety) return null; run.safety = d; run.safetyRight = plant.danger.includes(d); return run.safetyRight; }
/** Science or folklore? true = "science backs it". */
export function guessClaim(run, plant, saysFact) { if (run.claim !== null) return null; run.claim = !!saysFact; run.claimRight = !!saysFact === plant.claim.fact; return run.claimRight; }

export const levelOf = (run) => LEVELS[(run.level || 1) - 1];
export const scoreOf = (run) => { const L = levelOf(run);
  return (run.won ? perLeaf(run.mode, L) * run.leaves : 0) + (run.safetyRight ? safetyPts(L) : 0) + (run.claimRight ? claimPts(L) : 0); };

/** Settle a finished specimen into progress. Returns { xp, essence, first, best, score }. */
export function settle(p, run) {
  const r = room(p), k = run.level + ":" + run.id; r.plays++; r.last = run.id;
  const out = { xp: 0, essence: 0, first: false, best: false, score: scoreOf(run) };
  if (!run.won) { out.xp = 3; return out; }
  const prev = r.solved[k] || 0; out.first = !prev;
  if (out.score > prev) { out.best = !!prev; out.xp = out.essence = out.score - prev; r.solved[k] = out.score; }
  return out;
}
