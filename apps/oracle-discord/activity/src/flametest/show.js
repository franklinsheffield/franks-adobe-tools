// Vell's Hazardous Guess Show: the Flame Test Lab as a party game show. Pure rules, run on the host's client
// (net.js joinTable "flameshow") and sent out with showView(). The chemistry is real (data.js SAMPLES); the comedy is
// Vell's: every wrong guess sets off the next lab mishap, and the losers end up named in his insurance claim.
//
// A show is BOTTLES rounds. Each round a Mystery Bottle (a real salt under a joke label) goes in the flame and every
// player locks in an element. Right: RIGHT points, plus FIRST for the fastest right answer. Wrong: Vell's mishap level
// goes up (eyebrows, coat, alarm, goggles, soot) and the guess goes on the claim form.
// Sabotage: each player has one Swap card (the target's bottle is swapped for a different real salt, so they must
// read their own flame) and one Fog card (the target's goggles fog up for the round). Never on yourself.
// Audience: people watching (not seated) bet on which of three shelf bottles Vell knocks over next. A right bet is a
// point; at the end each point is 1 💎, at most AUD_GEMS.
// Finale: the winner names the closing firework. Every reveal teaches the real element and why it burns that colour.
import { SAMPLES, sample } from "./data.js";

export const BOTTLES = 6, RIGHT = 10, FIRST = 5, AUD_GEMS = 3;
export const TIMES = { burn: 25, reveal: 12, final: 20 };
export const LABELS = ["Probably Not Soup", "Definitely Not Lemonade", "Vell's Lunch (Do Not Burn)", "Do Not Shake", "Unlabelled", "Sample 7½",
  "Smells Like Tuesday", "Mostly Harmless", "Ask Me Later", "Not My Handwriting", "Return to Sender", "Extra Spicy (Allegedly)", "Found It Under the Bench", "Totally Fine"];
/** Vell's mishaps, worst last. Level n = the first n have happened. */
export const HARMS = [
  { id: "brows", e: "🔥", name: "singed eyebrows", line: "My eyebrows! Fine, fine. They'll grow back. Smile for the camera!" },
  { id: "coat", e: "💨", name: "a smoking lab coat", line: "Is that... my coat? It's smoking. I'm not smoking, the coat is. Next bottle!" },
  { id: "alarm", e: "🚨", name: "the fire alarm, again", line: "That's the alarm. It's fine, it goes off on Tuesdays. And Wednesdays. Keep guessing!" },
  { id: "goggles", e: "🥽", name: "cracked goggles", line: "Cracked my goggles. I can see two of you now. Both of you, please guess better." },
  { id: "soot", e: "🌋", name: "head-to-toe soot", line: "I am now mostly soot. A professional is always camera-ready. Ta-da!" },
];
export const ROASTS = [
  "{guess}? That's {real}'s cousin who owes me money.",
  "{guess}! Bold. Wrong, but bold. It was {real}.",
  "I'll write '{guess}' on the insurance form, {name}. It was {real}.",
  "{guess}? My eyebrows disagree. That was {real}.",
  "Ah, {guess}. A classic. A classic wrong answer. It's {real}!",
  "{name} says {guess}. The flame says {real}. The flame wins.",
  "{guess}, {name}? I've seen better guesses from a teaspoon. {real}!",
  "Ooh, {guess}. So close. Well, no. Not close. {real}.",
];
export const CHEERS = ["{name} nailed it: {real}! Nobody's on fire! Well, less on fire.", "{real}, says {name}, and {real} it is! Applause, please. Quietly, the alarm is sensitive.",
  "Correct, {name}! {real}! I'd shake your hand, but mine are still smoking."];
/** The closing fireworks: one per flame colour, so the finale bursts in that element's real colour. */
export const FIREWORKS = [
  { id: "li", name: "The Lithium Lullaby" }, { id: "na", name: "The Sodium Sunrise" }, { id: "k", name: "The Lilac Lift-off" }, { id: "ca", name: "The Brick-Red Bonanza" },
  { id: "sr", name: "The Strontium Salute" }, { id: "ba", name: "The Barium Bouquet" }, { id: "cu", name: "The Copper Kettle Comet" }, { id: "b", name: "Vell's Eyebrow Memorial" },
];
export const fireworkOf = (id) => FIREWORKS.find((f) => f.id === id) || null;

const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

export function newShow(members, rand = Math.random, n = BOTTLES) {
  const ids = members.map((m) => m.id), samples = shuffle(SAMPLES.map((s) => s.id), rand), labels = shuffle(LABELS, rand);
  const bottles = Array.from({ length: n }, (_, k) => ({ id: samples[k % samples.length], label: labels[k % labels.length], shelf: shuffle(labels.filter((l, j) => j !== k % labels.length), rand).slice(0, 3) }));
  return { n, i: 0, phase: "burn", seats: ids, score: Object.fromEntries(ids.map((id) => [id, 0])), bottles, answers: {}, order: 0,
    swap: {}, fog: {}, cards: Object.fromEntries(ids.map((id) => [id, { swap: 1, fog: 1 }])), mishap: 0, claims: [], bets: {}, betWins: {}, drops: [], last: null, firework: null, winner: null, over: false };
}
export const bottle = (st) => st.bottles[st.i];
/** The sample this player is actually looking at (their own, if someone swapped it). */
export const sampleFor = (st, who) => st.swap[who] || bottle(st).id;

/** Seat someone who arrived: only between rounds' answers, i.e. while nobody has answered yet. */
export function join(st, id) {
  if (st.over || st.seats.includes(id) || st.phase !== "burn" || Object.keys(st.answers).length) return false;
  st.seats.push(id); st.score[id] ??= 0; st.cards[id] ??= { swap: 1, fog: 1 }; return true;
}

/** A player's answer. "ok" | null. */
export function answer(st, who, s) {
  if (st.phase !== "burn" || !st.seats.includes(who) || st.answers[who] || !sample(s)) return null;
  st.answers[who] = { s, at: st.order++ }; return "ok";
}
export const allAnswered = (st) => st.seats.every((id) => st.answers[id]);

/** Play a sabotage card. "swap" swaps the target's bottle for a different real salt; "fog" fogs their goggles. */
export function sabotage(st, who, card, target, rand = Math.random) {
  if (st.phase !== "burn" || who === target || !st.seats.includes(who) || !st.seats.includes(target) || st.answers[target]) return null;
  const c = st.cards[who]; if (!c || !c[card]) return null;
  if (card === "swap") { if (st.swap[target]) return null; const others = SAMPLES.filter((x) => x.id !== bottle(st).id); st.swap[target] = others[Math.floor(rand() * others.length)].id; }
  else if (card === "fog") { if (st.fog[target]) return null; st.fog[target] = who; }
  else return null;
  c[card]--; (st.sab ||= []).push({ who, card, target }); return card;
}

/** An audience bet on which shelf bottle Vell knocks over (0-2). Seated players don't bet. */
export function bet(st, who, k) { if (st.phase !== "burn" || st.seats.includes(who) || !(k >= 0 && k <= 2)) return null; st.bets[who] = k; return "ok"; }

/** Lights up: score the bottle, set off mishaps, knock a bottle off the shelf, write the claims. */
export function reveal(st, nameOf = (id) => id, rand = Math.random) {
  if (st.phase !== "burn") return null;
  const B = bottle(st), right = [], wrong = [], gain = {};
  const first = Object.entries(st.answers).filter(([who, a]) => a.s === sampleFor(st, who)).sort((a, b) => a[1].at - b[1].at)[0];
  for (const who of st.seats) {
    const a = st.answers[who], real = sampleFor(st, who);
    if (a && a.s === real) { gain[who] = RIGHT + (first && first[0] === who ? FIRST : 0); right.push(who); (st.rightN ||= {})[who] = (st.rightN[who] || 0) + 1; }
    else { gain[who] = 0; if (a) { wrong.push(who); st.mishap++; const harm = HARMS[Math.min(HARMS.length, st.mishap) - 1];
      st.claims.push({ bottle: st.i + 1, label: B.label, who, name: nameOf(who), guess: sample(a.s).name, real: sample(real).name, harm: harm.name, e: harm.e }); } }
    st.score[who] = (st.score[who] || 0) + gain[who];
  }
  const drop = Math.floor(rand() * 3); st.drops.push(drop);
  for (const [who, k] of Object.entries(st.bets)) if (k === drop) st.betWins[who] = (st.betWins[who] || 0) + 1;
  st.last = { bottle: st.i, id: B.id, right, wrong, first: first ? first[0] : null, gain, drop, swaps: { ...st.swap }, mishap: st.mishap };
  st.phase = "reveal"; return st.last;
}

/** Next bottle, or the finale once all are done. */
export function next(st, members = []) {
  if (st.phase !== "reveal") return null;
  if (st.i >= st.n - 1) { st.phase = "final"; st.winner = standings(st)[0]?.id || null; return "final"; }
  st.i++; st.phase = "burn"; st.answers = {}; st.order = 0; st.swap = {}; st.fog = {}; st.bets = {};
  for (const m of members) if (!st.seats.includes(m.id)) { st.seats.push(m.id); st.score[m.id] ??= 0; st.cards[m.id] ??= { swap: 1, fog: 1 }; }
  return "burn";
}

/** The winner names the closing firework (the host's timer picks one if they don't). */
export function nameFirework(st, who, id, isHost = false) {
  if (st.phase !== "final" || !fireworkOf(id) || (who !== st.winner && !isHost)) return null;
  st.firework = id; st.phase = "over"; st.over = true; return "over";
}

/** Timer or host skip: move on. */
export function advance(st, members = [], nameOf, rand = Math.random) {
  if (st.phase === "burn") return reveal(st, nameOf, rand) ? "reveal" : null;
  if (st.phase === "reveal") return next(st, members);
  if (st.phase === "final") return nameFirework(st, null, FIREWORKS[Math.floor(rand() * FIREWORKS.length)].id, true);
  return null;
}

export function standings(st) {
  const rows = Object.entries(st.score).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
  rows.forEach((r, k) => (r.place = k && r.score === rows[k - 1].score ? rows[k - 1].place : k + 1)); return rows;
}

/** What one person sees: other players' answers stay hidden until the reveal; only you see your own swap and fog. */
export function showView(st, forId) {
  const hide = st.phase === "burn";
  return { ...st, answers: hide ? Object.fromEntries(Object.keys(st.answers).map((id) => [id, id === forId ? st.answers[id] : { s: null }])) : st.answers,
    swap: hide ? (st.swap[forId] ? { [forId]: st.swap[forId] } : {}) : st.swap, fog: hide ? (st.fog[forId] ? { [forId]: true } : {}) : st.fog,
    bets: hide ? (st.bets[forId] !== undefined ? { [forId]: st.bets[forId] } : {}) : st.bets };
}

/** Lines for the emcee (Vell). */
export const roastLine = (vars, rand = Math.random) => fill(ROASTS[Math.floor(rand() * ROASTS.length)], vars);
export const cheerLine = (vars, rand = Math.random) => fill(CHEERS[Math.floor(rand() * CHEERS.length)], vars);
export const harmAt = (level) => (level ? HARMS[Math.min(HARMS.length, level) - 1] : null);

/** Vell's insurance claim: the losers are the parties responsible. Plain rows for the Journal. */
export function claimOf(st, nameOf = (id) => id) {
  const no = 1000 + ((st.bottles.map((b) => b.id).join("").length * 37 + st.claims.length * 101 + st.n * 7) % 9000);
  const losers = standings(st).filter((r) => r.id !== st.winner).map((r) => nameOf(r.id));
  return { no, winner: st.winner ? nameOf(st.winner) : "nobody", losers, firework: (fireworkOf(st.firework) || {}).name || "",
    damages: st.claims.map((c) => `Bottle ${c.bottle} ("${c.label}"): ${c.name} guessed ${c.guess}, it was ${c.real}. Damage: ${c.harm}.`) };
}

/** Your reward at the end. Small, and solo can't farm it. */
export function reward(st, me, players = 1) {
  const s = standings(st), mine = s.find((r) => r.id === me) || { score: 0, place: s.length || 1 }, won = mine.place === 1 && mine.score > 0;
  const correct = (st.rightN || {})[me] || 0;
  return { won, place: mine.place, score: mine.score, correct, perfect: correct === st.n, xp: 4 + correct * 2 + (won && players > 1 ? 6 : 0),
    essence: Math.min(10, correct + (won && players > 1 ? 4 : 0)) + Math.min(AUD_GEMS, st.betWins[me] || 0) };
}
