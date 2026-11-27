// Party rounds for the Oracle Chamber: one shared prompt-and-vote loop any room can reuse (first user: Fact or Fib in
// the History of Magic). Pure state, kept on the HOST's client (net.js joinTable) and sent out with publicView().
//
// A match is a list of prompts. Each prompt runs:  write -> vote -> reveal.
//   write   every seated player types a fib (a believable wrong answer). A fib that hits the truth is refused.
//   vote    the truth, every fib and some house fibs are shown with no names; everyone picks the one they think is true.
//   reveal  picking the truth scores TRUTH, every player you fooled scores FOOL for you. House fibs score nobody.
// The last prompt is the final round: points x FINAL_MULT.
// Safety nets (so a missing or dropped player never stalls the room): when time runs out, anyone who wrote nothing gets
// a house fib written for them, and voting closes without them. People who arrive mid-prompt watch and vote as audience
// (no score) and take a seat at the next prompt. The table host can skip ahead at any time.
//
// A prompt: { id, ask, truth, truthText, fact?, parse(text) -> value | null, show(value) -> text, near(value) -> bool,
//             house(rand) -> [value...] }   (value = anything comparable with ===, e.g. a year)

export const TRUTH = 10, FOOL = 5, FINAL_MULT = 2, HOUSE_FIBS = 2, MAX_CHOICES = 8;
export const TIMES = { write: 60, vote: 30 }, LONG = 2; // seconds; "long timers" doubles both (stream delay, slow typers)

const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** A new match for these members. `prompts` is the deal (plain data the host keeps; helpers are looked up by id). */
export function startMatch(prompts, members, { long = false } = {}) {
  const ids = members.map((m) => m.id);
  return { i: 0, n: prompts.length, prompts: prompts.map((p) => p.id), phase: "write", seats: ids, fibs: {}, votes: {}, aud: {},
    choices: [], score: Object.fromEntries(ids.map((id) => [id, 0])), log: [], long: !!long, over: false, last: null };
}
export const isFinal = (st) => st.i === st.n - 1;
export const mult = (st) => (isFinal(st) ? FINAL_MULT : 1);
export const seconds = (st) => (TIMES[st.phase] || 0) * (st.long ? LONG : 1);

/** Someone arrived: seat them at once while players are still writing, otherwise they wait for the next prompt. */
export function join(st, id) {
  if (st.over || st.seats.includes(id)) return false;
  if (st.phase !== "write") return false;
  st.seats.push(id); st.score[id] ??= 0; return true;
}

/** A player's fib. Returns "ok" | "truth" (too close to the real answer: try again) | "bad" (couldn't read it) | null. */
export function submit(st, P, who, text) {
  if (st.over || st.phase !== "write" || !st.seats.includes(who)) return null;
  const v = P.parse(text);
  if (v === null || v === undefined) return "bad";
  if (v === P.truth || P.near(v)) return "truth";
  st.fibs[who] = { v, house: false }; return "ok";
}
export const allWritten = (st) => st.seats.every((id) => st.fibs[id]);

/** Close the writing: fill in house fibs for anyone who wrote nothing, add the house's own, build the shuffled choices. */
export function openVote(st, P, rand = Math.random) {
  if (st.phase !== "write") return false;
  const pool = P.house(rand).filter((v) => v !== P.truth && !P.near(v)), taken = new Set();
  const nextHouse = () => { while (pool.length) { const v = pool.shift(); if (!taken.has(v)) return v; } return null; };
  for (const id of st.seats) if (!st.fibs[id]) { const v = nextHouse(); if (v !== null) st.fibs[id] = { v, house: true }; }
  const by = new Map(); // one card per distinct answer; players who wrote the same fib share it
  for (const [id, f] of Object.entries(st.fibs)) { taken.add(f.v); const c = by.get(f.v) || { v: f.v, by: [], house: true }; if (!f.house) { c.by.push(id); c.house = false; } by.set(f.v, c); }
  for (let k = 0; k < HOUSE_FIBS; k++) { const v = nextHouse(); if (v !== null && !by.has(v)) { taken.add(v); by.set(v, { v, by: [], house: true }); } }
  let cards = [...by.values()]; if (cards.length > MAX_CHOICES - 1) cards = [...cards.filter((c) => !c.house), ...cards.filter((c) => c.house)].slice(0, MAX_CHOICES - 1);
  st.choices = shuffle([...cards, { v: P.truth, by: [], truth: true }], rand).map((c, k) => ({ key: "c" + k, text: P.show(c.v), v: c.v, by: c.by, house: !!c.house, truth: !!c.truth }));
  st.phase = "vote"; st.votes = {}; st.aud = {}; return true;
}

/** A vote. Seated players can't pick their own fib; anyone else in the call votes as audience. */
export function vote(st, who, key) {
  if (st.over || st.phase !== "vote") return null;
  const c = st.choices.find((x) => x.key === key); if (!c) return null;
  if (!st.seats.includes(who)) { st.aud[who] = key; return "aud"; }
  if (c.by.includes(who)) return "own";
  st.votes[who] = key; return "ok";
}
export const allVoted = (st) => st.seats.every((id) => st.votes[id]);

/** Lights up: score the prompt and keep a short log. Returns the reveal summary. */
export function reveal(st) {
  if (st.phase !== "vote") return null;
  const m = mult(st), gain = Object.fromEntries(st.seats.map((id) => [id, 0])), found = [], fooled = {};
  for (const [who, key] of Object.entries(st.votes)) {
    const c = st.choices.find((x) => x.key === key); if (!c) continue;
    if (c.truth) { gain[who] += TRUTH * m; found.push(who); }
    else for (const a of c.by) if (a !== who) { gain[a] = (gain[a] || 0) + FOOL * m; (fooled[a] ||= []).push(who); }
  }
  for (const [id, g] of Object.entries(gain)) st.score[id] = (st.score[id] || 0) + g;
  const audTruth = Object.values(st.aud).filter((k) => (st.choices.find((x) => x.key === k) || {}).truth).length;
  st.last = { prompt: st.prompts[st.i], found, fooled, gain, aud: Object.keys(st.aud).length, audTruth, final: isFinal(st) };
  st.log.unshift(st.last); st.log.length = Math.min(st.log.length, 8);
  st.phase = "reveal"; return st.last;
}

/** On to the next prompt (seating anyone who arrived), or end the match. */
export function next(st, members = []) {
  if (st.phase !== "reveal") return false;
  if (st.i >= st.n - 1) { st.over = true; st.phase = "over"; return "over"; }
  st.i++; st.phase = "write"; st.fibs = {}; st.votes = {}; st.aud = {}; st.choices = [];
  for (const m of members) if (!st.seats.includes(m.id)) { st.seats.push(m.id); st.score[m.id] ??= 0; }
  return "write";
}

/** The host's skip button / the timer running out: move the current phase on. */
export function advance(st, P, members = [], rand = Math.random) {
  if (st.phase === "write") return openVote(st, P, rand) ? "vote" : null;
  if (st.phase === "vote") return reveal(st) ? "reveal" : null;
  if (st.phase === "reveal") return next(st, members);
  return null;
}

/** What one person may see. While writing: who is done, never what they wrote. While voting: the cards with no names
 * (your own fib is marked so you can't pick it). At the reveal and after: everything. */
export function publicView(st, forId) {
  const base = { ...st, fibs: undefined, done: Object.keys(st.fibs), mine: st.fibs[forId] ? st.fibs[forId].v : null };
  if (st.phase === "write") return { ...base, choices: [], votes: undefined, voted: [] };
  if (st.phase === "vote") return { ...base, choices: st.choices.map((c) => ({ key: c.key, text: c.text, own: c.by.includes(forId) })), votes: undefined, voted: Object.keys(st.votes), myVote: st.votes[forId] || st.aud[forId] || null };
  return { ...base, voted: Object.keys(st.votes), myVote: st.votes[forId] || st.aud[forId] || null };
}

/** Final standings, best first: [{ id, score, place }] (ties share a place). */
export function standings(st) {
  const rows = Object.entries(st.score).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
  rows.forEach((r, k) => (r.place = k && r.score === rows[k - 1].score ? rows[k - 1].place : k + 1)); return rows;
}

/** Your reward when the match ends: small, so solo play can't farm it. */
export function reward(st, me, players = 1) {
  const s = standings(st), mine = s.find((r) => r.id === me) || { score: 0, place: s.length || 1 }, won = mine.place === 1 && mine.score > 0;
  const found = st.log.filter((l) => l.found.includes(me)).length;
  return { won, perfect: found === st.n, xp: 4 + found * 2 + (won && players > 1 ? 6 : 0), essence: Math.min(10, found + (won && players > 1 ? 4 : 0)), score: mine.score, place: mine.place, found };
}
