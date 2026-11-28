// The Mentalist rules. Each round is a choice: the right force, the line that fits anyone, the right code word, or
// the slip you read last. A wrong answer costs one 🎭 of nerve (the audience starts to doubt) and you try again.
// Lose all 3 and you're booed off. Score: 2 per round right first time, 1 after a slip, plus nerve left, x multiplier.
// prog.rooms.mentalist = { plays, wins: {1,2,3}, best: {1,2,3}, methods: [ids], look }.
import { FORCES, BARNUM, SPECIFIC, SITTERS, FORER, CODE, CODE_FACTS, CUES, CARD, QUESTIONS, BILLET_FACTS, LEVELS, wordOf, forceOf } from "./data.js";
import { rng } from "../casefiles/logic.js";
import { dailySeed, todayKey } from "../daily.js";

export const NERVE = 3, OPTIONS = 4;
/** Everything you can learn here: the 6 forces, the Barnum reading, the code, the one-ahead. */
export const METHOD_IDS = [...FORCES.map((f) => f.id), "barnum", "code", "oneahead"];
export const METHOD_NAMES = { ...Object.fromEntries(FORCES.map((f) => [f.id, f.name])), barnum: "The Barnum reading", code: "The Houdinis' word code", oneahead: "The one-ahead" };
export function room(p) {
  const r = ((p.rooms ||= {}).mentalist ||= { plays: 0 });
  r.wins ||= {}; r.best ||= {}; r.methods ||= []; r.look ||= {};
  return r;
}
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickOf = (a, rand) => a[Math.floor(rand() * a.length)];
const digitWord = (d) => wordOf(d || 10);

/** One round of a kind. Returns { kind, prompt, options: [{ id, text }], answer, fact, method }. */
export function roundOf(kind, rand = Math.random) {
  if (kind === "force") { const f = pickOf(FORCES, rand), opts = shuffle([f, ...shuffle(FORCES.filter((x) => x !== f), rand).slice(0, OPTIONS - 1)], rand);
    return { kind, prompt: f.fits, options: opts.map((x) => ({ id: x.id, text: `${x.e} ${x.name}` })), answer: f.id, fact: `${f.how} ${f.fact}`, method: f.id }; }
  if (kind === "read") { const b = pickOf(BARNUM, rand), opts = shuffle([b, ...shuffle(SPECIFIC, rand).slice(0, OPTIONS - 1)], rand);
    return { kind, prompt: pickOf(SITTERS, rand), options: opts.map((t) => ({ id: t, text: t })), answer: b, fact: `That line fits almost anyone. ${FORER}`, method: "barnum" }; }
  if (kind === "send") { const n = 1 + Math.floor(rand() * 10), w = wordOf(n), opts = shuffle([w, ...shuffle(CODE.map(([k]) => k).filter((k) => k !== w), rand).slice(0, OPTIONS - 1)], rand);
    return { kind, prompt: `The spectator shows you the ${CARD[n]}. What do you ask your partner?`, options: opts.map((k) => ({ id: k, text: `“${CUES[k]}”` })), answer: w, fact: `“${w}” means ${n}. ${pickOf(CODE_FACTS, rand)}`, method: "code", card: n }; }
  if (kind === "hear") { const n = 1 + Math.floor(rand() * 10), w = wordOf(n), opts = shuffle([n, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((v) => v !== n), rand).slice(0, OPTIONS - 1)], rand);
    return { kind, prompt: `You're blindfolded. Your partner calls: “${CUES[w]}” Which card is it?`, options: opts.map((v) => ({ id: String(v), text: CARD[v] })), answer: String(n), fact: `The first word, “${w}”, is ${n}. ${pickOf(CODE_FACTS, rand)}`, method: "code", card: n }; }
  if (kind === "two") { const num = 10 + Math.floor(rand() * 90), id = (v) => `${Math.floor(v / 10)}-${v % 10}`, nums = new Set([num]);
    for (let k = 0; nums.size < OPTIONS && k < 200; k++) { const v = 10 + Math.floor(rand() * 90); if (Math.floor(v / 10) !== v % 10) nums.add(v); }
    const line = (v) => `“${digitWord(Math.floor(v / 10))}… ${digitWord(v % 10).toLowerCase()}! The number?”`;
    return { kind, prompt: `A banknote's serial number ends in ${num}. Send both digits (Be quick stands for 0).`, options: shuffle([...nums], rand).map((v) => ({ id: id(v), text: line(v) })), answer: id(num),
      fact: `Two cue words, two digits: ${digitWord(Math.floor(num / 10))} then ${digitWord(num % 10)}. Letters worked the same way: A was Pray, B was Answer.`, method: "code" }; }
  throw new Error("unknown round kind " + kind);
}
/** The billet run: the plant's question first, then always the slip opened last. */
export function billetRounds(n, rand = Math.random) {
  const qs = shuffle(QUESTIONS, rand), plant = qs[0], slips = [...qs.slice(1, n), plant], rounds = [];
  for (let i = 0; i < n; i++) {
    const say = i === 0 ? plant : slips[i - 1], others = shuffle(QUESTIONS.filter((q) => q !== say), rand).slice(0, OPTIONS - 1);
    rounds.push({ kind: "billet", prompt: i === 0 ? `You lift slip 1 to your forehead. Your plant's question was: “${plant}”` : `You lift slip ${i + 1} to your forehead. What do you announce?`,
      options: shuffle([say, ...others], rand).map((t) => ({ id: t, text: `“${t}”` })), answer: say, opened: slips[i], last: i === n - 1,
      fact: i === n - 1 ? "The last slip you open is your plant's own. You pocket it, and the count comes out right." : BILLET_FACTS[i % BILLET_FACTS.length], method: "oneahead" });
  }
  return { plant, rounds };
}
export function start(L, { seed = null, daily = null } = {}) {
  const rand = seed ? rng(seed) : Math.random; let rounds, plant = null;
  if (L.kinds[0] === "billet") ({ rounds, plant } = billetRounds(L.rounds, rand));
  else rounds = Array.from({ length: L.rounds }, (_, i) => roundOf(L.n === 2 ? (i >= L.rounds - 2 ? "two" : L.kinds[i % 2]) : L.kinds[i % 2], rand));
  return { L, rounds, plant, i: 0, nerve: NERVE, slips: 0, roundSlips: 0, pts: 0, tried: [], used: [], over: false, won: false, daily };
}
export const roundNow = (run) => run.rounds[run.i];
/** Answer the round. "right" | "won" | "wrong" | "booed" | null. */
export function choose(run, id) {
  if (run.over) return null; const rd = roundNow(run);
  if (id === rd.answer) { run.pts += run.roundSlips ? 1 : 2; run.used.push(rd.method); run.roundSlips = 0; run.tried = []; run.i++;
    if (run.i >= run.rounds.length) { run.over = run.won = true; return "won"; } return "right"; }
  if (run.tried.includes(id)) return null;
  run.tried.push(id); run.slips++; run.roundSlips++; run.nerve--;
  if (run.nerve <= 0) { run.over = true; return "booed"; } return "wrong";
}
export const scoreOf = (run) => (run.won ? Math.round((run.pts + run.nerve) * run.L.mult) : 0);
export const perfect = (run) => run.won && !run.slips;
/** Record a show. Returns { xp, essence, score, fresh: [new methods] }. */
export function settle(p, run) {
  const r = room(p), L = run.L, score = scoreOf(run); r.plays++;
  const fresh = [...new Set(run.used)].filter((m) => !r.methods.includes(m)); r.methods.push(...fresh);
  const out = { score, xp: run.won ? score : 3, essence: run.won ? Math.ceil(score / 2) + fresh.length : 1, fresh };
  if (run.won) { r.wins[L.n] = (r.wins[L.n] || 0) + 1; if (score > (r.best[L.n] || 0)) r.best[L.n] = score; }
  return out;
}
/** Today's show, the same for everyone. */
export function dailyOf(day = todayKey()) { const seed = dailySeed("mentalist", day); return { seed, L: LEVELS[seed % 3], day }; }
export { forceOf };
