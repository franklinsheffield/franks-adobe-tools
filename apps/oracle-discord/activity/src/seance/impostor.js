// The Impostor: a party round for Séance: Guess the Ghost. Rules kept pure for tests; the room is impostor-room.js.
// Everyone at the table is handed the same real ghost (a Level 3 historical magician or scientist), except one sitter,
// the impostor, who is handed a different ghost of the same kind and told they are the impostor. Over two rounds each
// sitter lays one hint word from a shared menu (no free text). Then everyone votes. Catch the impostor and the circle
// wins, unless the impostor can then name the real ghost from a short list, which steals the win.
// With fewer than 3 people the empty chairs are filled by spirit sitters (bots the host runs).
import { GHOSTS } from "./ghosts.js";

/** Six one-word (or short) hints per ghost. Every hint is a documented fact about that ghost and never names them. */
export const HINTS = {
  houdini: ["Handcuffs", "Straitjacket", "Water tank", "Budapest", "Debunker", "Secret code"],
  roberthoudin: ["Clockmaker", "Paris theatre", "Electromagnet", "Algeria", "Heavy chest", "Automaton"],
  maskelyne: ["Watchmaker", "Egyptian Hall", "Coin lock", "Spirit cabinet", "Home of Mystery", "Exposé"],
  adelaide: ["Dancer", "Acrobat", "Stage assistant", "Widow", "Queen of Magic", "Vaudeville"],
  chunglingsoo: ["Disguise", "Silent act", "Rival", "Bullet catch", "Wood Green", "New York"],
  pepper: ["Sheet of glass", "Reflection", "Lecturer", "Polytechnic", "Dickens", "Hologram"],
  dee: ["Angels", "Crystal", "Obsidian mirror", "Library", "Coronation", "Royal adviser"],
  newton: ["Prism", "Gravity", "Apple", "Royal Mint", "Alchemy", "Counterfeiters"],
  faraday: ["Bookbinder", "Induction", "Table-turning", "Christmas Lectures", "Royal Institution", "Moving magnet"],
  curie: ["Warsaw", "Radioactivity", "Two Nobels", "Polonium", "Radium", "Flying University"],
  tesla: ["Alternating current", "Artificial lightning", "Coil", "Colorado Springs", "Croatia", "Magnetic unit"],
  lovelace: ["Poet's daughter", "Analytical Engine", "Bernoulli numbers", "Babbage", "Poetical science", "First program"],
  galileo: ["Telescope", "Jupiter's moons", "Pisa", "Inquisition", "Pendulum", "Horoscopes"],
  darwin: ["Beagle", "Finches", "Barnacles", "Galápagos", "Natural selection", "Naturalist"],
  benfranklin: ["Kite", "Lightning rod", "Bifocals", "Mesmer inquiry", "Blindfold test", "Declaration"],
  rosalind: ["X-ray", "Photo 51", "DNA", "Coal", "Polio virus", "Cambridge"],
  kepler: ["Prague", "Ellipses", "Tycho's data", "Witch trial", "Three laws", "Astrological calendars"],
  paracelsus: ["The dose", "Poison", "Mercury", "Wanderer", "Elemental spirits", "Burned textbooks"],
  kellar: ["Levitation", "Princess Karnac", "Thurston", "Pennsylvania", "Runaway", "Mentor"],
  vernon: ["Card trick", "The Professor", "Ottawa", "Magic Castle", "Middle deal", "Sleight of hand"],
};

export const MIN = 3, SEATS = 4, ROUNDS = 2, MENU = 12, STEAL_OPTS = 6;
export const CREW = 10, SPOT = 5, ESCAPE = 20, STEAL = 15;
export const TIMES = { hint: 35, vote: 40, steal: 25 };
export const SPIRITS = [{ id: "spirit:thimble", name: "Mr. Thimble 👻" }, { id: "spirit:velvet", name: "Aunt Velvet 👻" }, { id: "spirit:colonel", name: "The Colonel 👻" }];
export const isSpirit = (id) => String(id).startsWith("spirit:");
export const ghost = (id) => GHOSTS.find((g) => g.id === id) || null;
export const usable = () => GHOSTS.filter((g) => (HINTS[g.id] || []).length >= 6);

const shuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, r) => a[Math.floor(r() * a.length)];

/** A new game. members: [{id}] (people at the table). Spirit sitters fill the table up to SEATS when fewer than MIN. */
export function newGame(members, rand = Math.random, round = 1) {
  const people = members.map((m) => m.id), spirits = people.length < MIN ? SPIRITS.slice(0, SEATS - people.length).map((s) => s.id) : [];
  const seats = [...people, ...spirits];
  const real = pick(usable(), rand), kin = usable().filter((g) => g.field === real.field && g.id !== real.id), decoy = pick(kin, rand);
  const others = shuffle(kin.filter((g) => g.id !== decoy.id), rand);
  const words = [...shuffle(HINTS[real.id], rand).slice(0, 4), ...shuffle(HINTS[decoy.id], rand).slice(0, 4), ...others.slice(0, 2).flatMap((g) => shuffle(HINTS[g.id], rand).slice(0, 2))];
  const menu = shuffle([...new Set(words)], rand).slice(0, MENU);
  const steal = shuffle([real.id, ...others.slice(0, STEAL_OPTS - 1).map((g) => g.id)], rand);
  return { round, phase: "hint", turn: 1, rounds: ROUNDS, seats, real: real.id, decoy: decoy.id, imp: pick(seats, rand), menu, hints: { 1: {}, 2: {} },
    votes: {}, caught: null, steal, stolen: null, guess: null, score: Object.fromEntries(seats.map((id) => [id, 0])), winner: null, over: false };
}

/** Your card: the ghost you were handed, and whether you're the impostor. */
export const cardOf = (st, who) => (st.seats.includes(who) ? { ghost: who === st.imp ? st.decoy : st.real, imp: who === st.imp } : null);
const used = (st, who) => Object.values(st.hints).map((h) => h[who]).filter(Boolean);

/** Lay one hint word this round. "ok" | null */
export function hint(st, who, word) {
  if (st.phase !== "hint" || !st.seats.includes(who) || st.hints[st.turn][who] || !st.menu.includes(word) || used(st, who).includes(word)) return null;
  st.hints[st.turn][who] = word; return "ok";
}
export const allHinted = (st) => st.seats.every((id) => st.hints[st.turn][id]);

/** A spirit's (or a sleepy sitter's) hint: a word from its own ghost if it can, else any word it hasn't laid. */
export function autoHint(st, who, rand = Math.random) {
  const c = cardOf(st, who), mine = HINTS[c.ghost], free = st.menu.filter((w) => !used(st, who).includes(w)), own = free.filter((w) => mine.includes(w));
  if (c.imp && isSpirit(who)) { const bluff = free.filter((w) => !mine.includes(w)); if (bluff.length && rand() < 0.6) return hint(st, who, pick(bluff, rand)); } // a spirit impostor bluffs
  return hint(st, who, own.length ? pick(own, rand) : pick(free, rand));
}

/** How much someone's hints match a ghost's hint list. */
const match = (st, who, gid) => used(st, who).filter((w) => HINTS[gid].includes(w)).length;

/** Close the hint round: fill gaps, then the next round or the vote. */
export function closeHints(st, rand = Math.random) {
  if (st.phase !== "hint") return null;
  for (const id of st.seats) if (!st.hints[st.turn][id]) autoHint(st, id, rand);
  if (st.turn < st.rounds) { st.turn++; return "hint"; }
  st.phase = "vote"; return "vote";
}

/** Point at who you think the impostor is. Anyone at the table, not yourself. */
export function vote(st, who, target) {
  if (st.phase !== "vote" || !st.seats.includes(who) || !st.seats.includes(target) || who === target) return null;
  st.votes[who] = target; return "ok";
}
export const allVoted = (st) => st.seats.every((id) => st.votes[id]);

/** A spirit's vote: the sitter whose hints least fit the spirit's own ghost (ties at random). */
export function autoVote(st, who, rand = Math.random) {
  const g = cardOf(st, who).ghost, rows = shuffle(st.seats.filter((id) => id !== who), rand).map((id) => ({ id, m: match(st, id, g) }));
  return vote(st, who, rows.sort((a, b) => a.m - b.m)[0].id);
}

/** The count. One clear top vote is caught; a tie catches nobody. */
export function tally(votes) {
  const n = {}; for (const t of Object.values(votes)) n[t] = (n[t] || 0) + 1;
  const top = Math.max(0, ...Object.values(n)), best = Object.keys(n).filter((t) => n[t] === top);
  return best.length === 1 ? best[0] : null;
}

/** Close the vote: catch someone (or nobody). If the impostor is caught they get one try to name the real ghost. */
export function closeVote(st, rand = Math.random) {
  if (st.phase !== "vote") return null;
  for (const id of st.seats) if (!st.votes[id] && isSpirit(id)) autoVote(st, id, rand);
  st.caught = tally(st.votes);
  if (st.caught === st.imp) { st.phase = "steal"; return "steal"; }
  return finish(st, "escape");
}

/** The caught impostor names the real ghost. */
export function steal(st, who, gid) {
  if (st.phase !== "steal" || who !== st.imp || !st.steal.includes(gid)) return null;
  st.guess = gid; return finish(st, gid === st.real ? "stolen" : "caught");
}
/** A spirit impostor's steal: the listed ghost the circle's hints fit best. */
export function autoSteal(st, rand = Math.random) {
  const crew = st.seats.filter((id) => id !== st.imp), fit = (g) => crew.reduce((s, id) => s + match(st, id, g), 0);
  const best = shuffle(st.steal, rand).sort((a, b) => fit(b) - fit(a))[0];
  return steal(st, st.imp, best);
}

function finish(st, how) {
  st.result = how; st.phase = "over"; st.over = true;
  const crewWin = how === "caught";
  for (const id of st.seats) {
    if (id === st.imp) st.score[id] += how === "escape" ? ESCAPE : how === "stolen" ? STEAL : 0;
    else st.score[id] += (crewWin ? CREW : 0) + (st.votes[id] === st.imp ? SPOT : 0);
  }
  st.winner = crewWin ? "circle" : "impostor"; return "over";
}

/** Timer or host skip. */
export function advance(st, rand = Math.random) {
  if (st.phase === "hint") return closeHints(st, rand);
  if (st.phase === "vote") return closeVote(st, rand);
  if (st.phase === "steal") return isSpirit(st.imp) ? autoSteal(st, rand) : finish(st, "caught");
  return null;
}

/** Spirits play their turn (the host calls this after every change). Returns true if anything moved. */
export function spiritsAct(st, rand = Math.random) {
  let moved = false;
  for (const id of st.seats) if (isSpirit(id)) {
    if (st.phase === "hint" && !st.hints[st.turn][id]) moved = !!autoHint(st, id, rand) || moved;
    else if (st.phase === "vote" && !st.votes[id]) moved = !!autoVote(st, id, rand) || moved;
  }
  if (st.phase === "steal" && isSpirit(st.imp)) moved = !!autoSteal(st, rand) || moved;
  return moved;
}

/** What one person sees. Nobody sees who the impostor is, or anyone else's card, until the end; this round's
 *  hints stay face down until everyone has laid one; votes stay secret until the count. */
export function gameView(st, forId) {
  if (st.over) return { ...st, card: cardOf(st, forId) };
  const hints = { ...st.hints };
  if (st.phase === "hint") hints[st.turn] = Object.fromEntries(Object.keys(st.hints[st.turn]).map((id) => [id, id === forId ? st.hints[st.turn][id] : "?"]));
  const { real, decoy, imp, ...rest } = st;
  return { ...rest, hints, votes: st.phase === "vote" ? Object.fromEntries(Object.keys(st.votes).map((id) => [id, id === forId ? st.votes[id] : "?"])) : st.votes,
    card: cardOf(st, forId), steal: st.phase === "steal" ? st.steal : null, imp: st.phase === "steal" ? imp : null };
}

/** Your reward. Spirit games pay less (you can't farm the spirits). */
export function reward(st, me) {
  const imp = me === st.imp, people = st.seats.filter((id) => !isSpirit(id)).length;
  const won = imp ? st.result !== "caught" : st.result === "caught", spotted = !imp && st.votes[me] === st.imp;
  const full = people >= MIN;
  return { won, imp, spotted, score: st.score[me] || 0, xp: (full ? 6 : 3) + (won ? 6 : 0) + (spotted ? 2 : 0), essence: Math.min(full ? 10 : 5, (won ? 4 : 1) + (spotted ? 2 : 0) + (imp && won ? 2 : 0)) };
}
