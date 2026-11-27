// Skeptic's Séance rules, kept pure so they can be tested. Progress lives in prog.rooms.seance:
//   { plays, solved: { caseId: bestScore }, tools: [toolId], last: caseId }
// A case starts with 4 candles. Examining a clue snuffs one; a wrong guess snuffs one. Name the method before the
// last candle goes out to solve it. Score = 10 + 5 per candle left (max 30 with a first guess and no clues, which is
// allowed but bold). First solve pays the score in ✦ and 💎; replays only pay the improvement on your best.
import { CASES, TOOLS, TITLES } from "./cases.js";

export const CANDLES = 4;
export const score = (left) => 10 + 5 * left;
export const toolBonus = 5;

export const room = (p) => ((p.rooms ||= {}).seance ||= { plays: 0, solved: {}, tools: [], last: null });
export const solvedCount = (p) => Object.keys(room(p).solved).length;
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const caseById = (id) => CASES.find((c) => c.id === id);

/** A fresh attempt at a case. */
export const start = (c) => ({ id: c.id, candles: CANDLES, seen: [], wrong: [], done: false, won: false });

/** Examine clue i. Returns false if it can't be examined (already seen, or one candle must stay for the guess). */
export function examine(run, i) {
  if (run.done || run.seen.includes(i) || run.candles <= 1) return false;
  run.seen.push(i); run.candles--; return true;
}

/** Name the method. Returns "right" | "wrong" | "out" (last candle gone: case closes unsolved) | null. */
export function guess(run, c, i) {
  if (run.done || run.wrong.includes(i)) return null;
  if (i === c.answer) { run.done = true; run.won = true; return "right"; }
  run.wrong.push(i); run.candles--;
  if (run.candles <= 0) { run.done = true; return "out"; }
  return "wrong";
}

/** Shuffle the toolkit question: the case's tool plus its two decoys, in a stable order per case. */
export function toolChoices(c) {
  const ids = [c.tool, ...c.decoys];
  const h = [...c.id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 3;
  return [...ids.slice(h), ...ids.slice(0, h)];
}

/** Settle a finished run into progress. Returns { xp, essence, first, best, newTool } for the rewards line. */
export function settle(p, run, toolPick) {
  const r = room(p), c = caseById(run.id); r.plays++; r.last = run.id;
  const out = { xp: 0, essence: 0, first: false, best: false, newTool: null, score: 0 };
  if (!run.won) { out.xp = 3; return out; }
  const s = score(run.candles), prev = r.solved[run.id] || 0;
  out.score = s; out.first = !prev;
  if (s > prev) { out.best = !!prev; const gain = s - prev; out.xp += gain; out.essence += gain; r.solved[run.id] = s; }
  if (toolPick === c.tool && !r.tools.includes(c.tool)) { r.tools.push(c.tool); out.newTool = TOOLS[c.tool]; out.xp += toolBonus; out.essence += toolBonus; }
  return out;
}

/** The next unsolved case, else the first case. */
export const nextCase = (p) => CASES.find((c) => !room(p).solved[c.id]) || CASES[0];
