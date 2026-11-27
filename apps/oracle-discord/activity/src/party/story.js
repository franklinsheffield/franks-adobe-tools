// Story rounds for the Oracle Chamber (Possession first): the players "possess" the host. Each beat the host asks a
// question ("What did the hero steal?"); everyone types an answer; everyone votes; the winning answer becomes the host's
// next line, spoken in the House's voice. The beats build one tale, and the last beat names it.
// A sibling of party/vote.js (Fact or Fib's engine) with the same shape: pure state on the HOST's client (net.js
// joinTable), sent out with publicView(). Every answer goes through party/filter.js, and the table host can strike any
// card that still slips through.
//
// A beat:  write -> vote -> reveal.
//   write   every seated player types an answer (filtered).
//   vote    the answers are shown with no names; everyone votes for one that isn't theirs. The table host may strike cards.
//   reveal  the most votes wins (ties: audience votes, then a coin toss). Each vote your answer gets: VOTE_PTS. The winning
//           answer's writers: + WIN_PTS. The last beat (the title) counts FINAL_MULT times.
// Safety nets: if nobody writes (or every card is struck), the House answers itself; late arrivals vote as audience and get
// a seat at the next beat; the host can skip ahead.
// A beat: { ask, frame: "…{a}…", fall: [house answers], title?: true, narr?, truth? }
//
// Two modes. "made": everyone writes every beat (a made-up tale with a title). "true" (story-builder): the host narrates a
// real story (narr, then truth after the possessed line); at each beat only a few players are picked to possess the host
// (writersFor: 1 for up to 3 players, 2 for up to 5, then 3), rotating so the fewest turns go first. With one writer
// their answer is spoken straight away; with more, everyone else votes.
import { check } from "./filter.js";

export const VOTE_PTS = 5, WIN_PTS = 10, FINAL_MULT = 2, MAX_CARDS = 8;
export const TIMES = { write: 75, vote: 30, reveal: 10 }, LONG = 2; // seconds; long timers double write + vote

const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const key = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Put an answer into the host's line. A sentence that starts with the answer gets a capital letter. */
export function fill(frame, a) {
  const s = frame.replace(/\{a\}/g, a);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A new tale for these members. beats = [{ ask, frame, fall, title? }] (plain data, kept in the state). */
export function startTale(tale, beats, members, { long = false, level = 1, house = "oracle", mode = "made", rand = Math.random } = {}) {
  const ids = members.map((m) => m.id), zero = () => Object.fromEntries(ids.map((id) => [id, 0]));
  const st = { tale: tale.id, name: tale.name, house, level, mode: mode === "true" ? "true" : "made",
    beats: beats.map(({ ask, frame, fall, title, narr, truth }) => ({ ask, frame, fall: fall || [], title: !!title, ...(narr ? { narr } : {}), ...(truth ? { truth } : {}) })),
    i: 0, n: beats.length, phase: "write", seats: ids, writers: [], turns: zero(), wrote: zero(), lines: {}, votes: {}, aud: {}, struck: [], choices: [], story: [], title: mode === "true" ? tale.name : "",
    score: zero(), wins: zero(), log: [], long: !!long, over: false, last: null };
  pickWriters(st, rand); return st;
}
/** How many players possess the host at one beat of a true tale. */
export const writersFor = (n) => (n <= 3 ? 1 : n <= 5 ? 2 : 3);
/** Choose this beat's writers: everyone in a made-up tale; in a true tale the fewest turns so far (ties at random). */
export function pickWriters(st, rand = Math.random) {
  if (st.mode !== "true") { st.writers = st.seats.slice(); return st.writers; }
  const order = shuffle(st.seats, rand).sort((a, b) => (st.turns[a] || 0) - (st.turns[b] || 0));
  st.writers = order.slice(0, writersFor(st.seats.length));
  for (const id of st.writers) st.turns[id] = (st.turns[id] || 0) + 1;
  return st.writers;
}
export const beat = (st) => st.beats[st.i];
export const isFinal = (st) => st.i === st.n - 1;
export const mult = (st) => (isFinal(st) ? FINAL_MULT : 1);
export const seconds = (st) => (st.phase === "reveal" && st.mode === "true" ? TRUE_REVEAL : (TIMES[st.phase] || 0) * (st.long && st.phase !== "reveal" ? LONG : 1));
export const TRUE_REVEAL = 18; // the possessed line, then the host snaps back to the facts

/** Someone arrived: seated at once while answers are being written, otherwise at the next beat. */
export function join(st, id) {
  if (st.over || st.seats.includes(id) || st.phase !== "write") return false;
  seat(st, id); if (st.mode !== "true") st.writers.push(id); return true;
}

function seat(st, id) {
  const least = Math.min(...st.seats.map((x) => st.turns[x] || 0), 99);
  st.seats.push(id); st.score[id] ??= 0; st.wins[id] ??= 0; st.wrote[id] ??= 0; st.turns[id] ??= least === 99 ? 0 : least; // a newcomer waits their fair turn
}
/** A player's answer. Returns { r: "ok", text } | { r: "bad", why } (the filter said no) | null (not now). */
export function submit(st, who, text) {
  if (st.over || st.phase !== "write" || !st.seats.includes(who) || !st.writers.includes(who)) return null;
  const c = check(text); if (!c.ok) return { r: "bad", why: c.why };
  st.lines[who] = c.text; return { r: "ok", text: c.text };
}
export const allWritten = (st) => st.writers.length > 0 && st.writers.every((id) => st.lines[id]);

function houseCard(st, rand, taken) {
  const pool = shuffle(beat(st).fall || [], rand).filter((t) => !taken.has(key(t)));
  return pool.length ? { text: pool[0], by: [], house: true } : null;
}

/** Close the writing: one card per distinct answer (same answers share a card). A House card joins when there are fewer than 2. */
export function openVote(st, rand = Math.random) {
  if (st.phase !== "write") return false;
  const by = new Map();
  for (const id of st.writers) { const t = st.lines[id]; if (!t) continue; const k = key(t), c = by.get(k) || { text: t, by: [], house: false }; c.by.push(id); by.set(k, c); }
  let cards = [...by.values()].slice(0, MAX_CARDS);
  const taken = new Set(cards.map((c) => key(c.text)));
  while (cards.length < (st.mode === "true" ? 1 : 2)) { const h = houseCard(st, rand, taken); if (!h) break; taken.add(key(h.text)); cards.push(h); }
  st.choices = shuffle(cards, rand).map((c, k) => ({ key: "c" + k, ...c }));
  st.phase = "vote"; st.votes = {}; st.aud = {}; st.struck = []; return true;
}

/** A vote. Seated players can't vote for their own answer; anyone else in the call votes as audience. */
export function vote(st, who, k) {
  if (st.over || st.phase !== "vote") return null;
  const c = st.choices.find((x) => x.key === k); if (!c || st.struck.includes(k)) return null;
  if (!st.seats.includes(who)) { st.aud[who] = k; return "aud"; }
  if (c.by.includes(who)) return "own";
  st.votes[who] = k; return "ok";
}
/** Everyone who can vote has voted (a player whose only choice is their own card is not waited for). */
export const allVoted = (st) => live(st).length <= 1 || st.seats.every((id) => st.votes[id] || !live(st).some((c) => !c.by.includes(id)));
const live = (st) => st.choices.filter((c) => !st.struck.includes(c.key));

/** The table host strikes a card (a rude answer the filter missed). Its votes are void; if nothing is left, the House answers. */
export function strike(st, k, rand = Math.random) {
  if (st.phase !== "vote" || st.struck.includes(k) || !st.choices.some((c) => c.key === k)) return false;
  st.struck.push(k);
  for (const m of [st.votes, st.aud]) for (const [id, v] of Object.entries(m)) if (v === k) delete m[id];
  if (!live(st).length) { const h = houseCard(st, rand, new Set(st.choices.map((c) => key(c.text)))) || { text: (beat(st).fall || ["…"])[0], by: [], house: true }; st.choices.push({ key: "c" + st.choices.length, ...h }); }
  return true;
}

/** Count the votes, write the winning line into the tale, score. Returns the reveal summary. */
export function reveal(st, rand = Math.random) {
  if (st.phase !== "vote") return null;
  const m = mult(st), cards = live(st), n = (k, src) => Object.values(src).filter((v) => v === k).length;
  const ranked = shuffle(cards, rand).sort((a, b) => n(b.key, st.votes) - n(a.key, st.votes) || n(b.key, st.aud) - n(a.key, st.aud) || (a.house ? 1 : 0) - (b.house ? 1 : 0));
  const win = ranked[0], gain = Object.fromEntries(st.seats.map((id) => [id, 0]));
  for (const c of cards) for (const a of c.by) gain[a] = (gain[a] || 0) + n(c.key, st.votes) * VOTE_PTS * m;
  if (win) for (const a of win.by) { gain[a] = (gain[a] || 0) + WIN_PTS * m; st.wins[a] = (st.wins[a] || 0) + 1; }
  for (const id of st.writers) if (st.lines[id]) st.wrote[id] = (st.wrote[id] || 0) + 1;
  for (const [id, g] of Object.entries(gain)) st.score[id] = (st.score[id] || 0) + g;
  const b = beat(st), text = win ? win.text : (b.fall || ["…"])[0], line = b.title ? text : fill(b.frame, text);
  if (b.title) st.title = text; else st.story.push({ line, by: win ? win.by : [], house: !win || win.house, ...(b.narr ? { narr: b.narr } : {}), ...(b.truth ? { truth: b.truth } : {}) });
  st.last = { beat: st.i, key: win && win.key, text, line, by: win ? win.by : [], house: !win || !!win.house, votes: win ? n(win.key, st.votes) : 0, gain, title: b.title, cards: cards.length, ...(b.truth ? { truth: b.truth } : {}) };
  st.log.unshift(st.last); st.log.length = Math.min(st.log.length, 10);
  st.phase = "reveal"; return st.last;
}

/** On to the next beat (seating anyone who arrived), or the tale is told. */
export function next(st, members = [], rand = Math.random) {
  if (st.phase !== "reveal") return false;
  if (st.i >= st.n - 1) { st.over = true; st.phase = "over"; st.writers = []; return "over"; }
  st.i++; st.phase = "write"; st.lines = {}; st.votes = {}; st.aud = {}; st.struck = []; st.choices = [];
  for (const mm of members) if (!st.seats.includes(mm.id)) seat(st, mm.id);
  pickWriters(st, rand); return "write";
}

/** The host's skip button / the timer running out: move the current phase on. */
export function advance(st, members = [], rand = Math.random) {
  if (st.phase === "write") return openVote(st, rand) ? "vote" : null;
  if (st.phase === "vote") return reveal(st, rand) ? "reveal" : null;
  if (st.phase === "reveal") return next(st, members, rand);
  return null;
}

/** What one person may see. Writing: who is done, never what they wrote. Voting: cards with no names (yours marked).
 * Reveal and after: everything. */
export function publicView(st, forId) {
  const base = { ...st, lines: undefined, done: Object.keys(st.lines), mine: st.lines[forId] || null };
  if (st.phase === "write") return { ...base, choices: [], votes: undefined, voted: [] };
  if (st.phase === "vote") return { ...base, choices: st.choices.map((c) => ({ key: c.key, text: c.text, own: c.by.includes(forId), struck: st.struck.includes(c.key) })), votes: undefined, aud: undefined, voted: Object.keys(st.votes), myVote: st.votes[forId] || st.aud[forId] || null };
  return { ...base, voted: Object.keys(st.votes), myVote: st.votes[forId] || st.aud[forId] || null };
}

/** Final standings, best first: [{ id, score, place }] (ties share a place). */
export function standings(st) {
  const rows = Object.entries(st.score).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
  rows.forEach((r, k) => (r.place = k && r.score === rows[k - 1].score ? rows[k - 1].place : k + 1)); return rows;
}

/** The finished tale as plain text: title, the story lines (and, for a true tale, the fact after each), who wrote it. */
export function taleText(st, nameOf = (id) => id) {
  const authors = [...new Set(st.story.flatMap((s) => s.by))].map(nameOf);
  return { title: st.title || st.name, lines: st.story.map((s) => s.line), truths: st.story.map((s) => s.truth || ""), authors, mode: st.mode };
}

/** Your reward when the tale is told. Small, so solo play can't farm it. Solo: finishing is the win. */
export function reward(st, me, players = 1, { helped = false } = {}) {
  const s = standings(st), mine = s.find((r) => r.id === me) || { score: 0, place: s.length || 1 }, beats = st.wins[me] || 0;
  const won = players > 1 ? mine.place === 1 && mine.score > 0 : st.over;
  const perfect = players > 1 ? (st.mode === "true" ? (st.wrote[me] || 0) > 0 && beats === st.wrote[me] : beats === st.n) : st.over && !helped;
  return { won, perfect, beats, score: mine.score, place: mine.place, xp: 4 + Math.min(st.n, beats) * 2 + (won && players > 1 ? 6 : 0), essence: Math.min(10, Math.ceil(beats / 2) + (won && players > 1 ? 4 : 0)) };
}
