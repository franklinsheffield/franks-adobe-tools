// Bookings: step 3 of the Séance Parlour's core loop (investigate -> rehearse -> perform). Every UTC day brings
// Tonight's Bill: 3 bookings, the same for everyone, at Levels 1, 2 and 3. A newspaper wants a claim exposed, a
// theatre wants a trick performed, a skeptics' society wants one explained. Level 3 chains all three on one method.
// No booking ever asks you to contact the dead. Pure data and maths: the /booking bot command uses this file too,
// so it imports nothing that needs a browser.
import { CASES, METHODS, method } from "../casefiles/data.js";
import { TRICKS, trickOf } from "../workshop/data.js";

/** Billing on the playbill, earned by shows (bookings played well). Higher billing pays more and books bigger venues. */
export const BILLINGS = [
  { n: 0, name: "Bottom of the Bill", shows: 0, mult: 1 },
  { n: 1, name: "Supporting Act", shows: 3, mult: 1.25 },
  { n: 2, name: "Top of the Bill", shows: 10, mult: 1.5 },
  { n: 3, name: "Star Turn", shows: 25, mult: 2 },
];
export const billingOf = (shows = 0) => [...BILLINGS].reverse().find((b) => shows >= b.shows);

/** Real venues of stage magic and psychical research. tier = the billing that books it for a matinee. */
export const VENUES = [
  { id: "cheltenham", tier: 0, e: "🏛️", name: "Cheltenham Town Hall", fact: "In 1865 Maskelyne and Cooke first repeated the Davenport brothers' cabinet act in Cheltenham." },
  { id: "pier", tier: 0, e: "🌊", name: "The West Pier, Brighton", fact: "Brighton's West Pier opened in 1866 and later added a concert hall for variety shows." },
  { id: "canterbury", tier: 1, e: "🍺", name: "The Canterbury Hall, Lambeth", fact: "Charles Morton opened the Canterbury Hall in 1852, often called the first purpose-built music hall." },
  { id: "polytechnic", tier: 1, e: "🪞", name: "The Royal Polytechnic, London", fact: "Pepper's ghost was first shown here on Christmas Eve 1862." },
  { id: "lyceum", tier: 1, e: "🔥", name: "The Lyceum Theatre, London", fact: "In 1817 the Lyceum was among the first theatres lit by gas." },
  { id: "egyptian", tier: 2, e: "🏺", name: "The Egyptian Hall, Piccadilly", fact: "Maskelyne and Cooke made the Egyptian Hall 'England's Home of Mystery' from 1873." },
  { id: "stgeorge", tier: 2, e: "🎩", name: "St George's Hall, London", fact: "Maskelyne moved his magic shows to St George's Hall in 1905." },
  { id: "sciam", tier: 2, e: "📰", name: "Scientific American, New York", fact: "In 1924 the magazine's committee, with Houdini, tested Margery. Its $2,500 prize was never paid." },
  { id: "houdin", tier: 3, e: "🇫🇷", name: "Théâtre Robert-Houdin, Paris", fact: "Robert-Houdin opened his theatre in 1845. Georges Méliès, the film pioneer, bought it in 1888." },
  { id: "hippodrome", tier: 3, e: "🐘", name: "The New York Hippodrome", fact: "In 1918 Houdini made an elephant named Jennie vanish on the Hippodrome stage." },
  { id: "tonight", tier: 3, e: "📺", name: "The Tonight Show studio, Burbank", fact: "In 1986 James Randi played the recording of Peter Popoff's earpiece on The Tonight Show." },
];
export const venueOf = (id) => VENUES.find((v) => v.id === id);

/** Who books you, and which part of the loop they want. */
export const CLIENTS = {
  paper: { e: "📰", name: "A newspaper editor", ask: "wants a medium's claim exposed", part: "expose" },
  theatre: { e: "🎭", name: "A theatre manager", ask: "wants a trick performed on stage", part: "perform" },
  society: { e: "🔬", name: "A skeptics' society", ask: "wants a method demonstrated and explained", part: "explain" },
};
export const LEVEL_MULT = [0, 1, 1.5, 2];
export const KEY_PAY = 1; // 🗝️ for a Level 3 booking from Tonight's Bill, in the Parlour

// A seeded generator, the same mulberry32 the Case Files use (kept here so the bot needs no browser modules).
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** The same FNV-1a seed as daily.js dailySeed (tests keep them equal). */
export function seedOf(game, day) { let h = 0x811c9dc5; const s = game + ":" + day; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h || 1; }
export const utcDay = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickOf = (a, rand) => a[Math.floor(rand() * a.length)];
/** n distinct items from list (not equal to `not`), look-alikes first by score. */
const near = (list, not, n, score, rand) => list.filter((x) => x !== not).map((x) => [x, score(x) + rand() * 1.6]).sort((a, b) => b[1] - a[1]).slice(0, n).map(([x]) => x);

/** One part of a booking. expose: name the case's method. perform: pick the trick whose effect the client wants. explain: say why a method works. */
export function partOf(kind, m, rand, { caseId = null, trickId = null } = {}) {
  const M = method(m);
  if (kind === "expose") {
    const c = caseId ? CASES.find((x) => x.id === caseId) : pickOf(CASES.filter((x) => x.method === m), rand);
    const others = near(METHODS, M, 3, (x) => (x.cls === M.cls ? 2 : 0), rand).map((x) => x.id);
    return { kind, caseId: c.id, method: m, answer: m, options: shuffle([m, ...others], rand) };
  }
  if (kind === "perform") {
    const t = trickId ? trickOf(trickId) : pickOf(TRICKS.filter((x) => x.needs.includes(m) && x.lv === 1), rand);
    const others = near(TRICKS, t, 3, (x) => (x.lv === t.lv ? 1 : 0) + (method(x.needs[0]).cls === M.cls ? 1 : 0), rand).map((x) => x.id);
    return { kind, trickId: t.id, method: m, brief: t.steps[t.steps.length - 1], answer: t.id, options: shuffle([t.id, ...others], rand) };
  }
  const others = near(METHODS, M, 2, (x) => (x.cls === M.cls ? 2 : 0), rand).map((x) => x.id);
  return { kind: "explain", method: m, answer: m, options: shuffle([m, ...others], rand) };
}

/** A booking at level lv (1-3). Level 1: one part. Level 2: two parts on one method. Level 3: expose -> perform -> explain on one method. */
export function bookingOf(lv, rand, { tier = null, clientKey = null } = {}) {
  const tiers = tier == null ? [lv - 1, Math.min(3, lv)] : [tier], venue = pickOf(VENUES.filter((v) => tiers.includes(v.tier)), rand);
  const m = pickOf(METHODS.filter((x) => CASES.some((c) => c.method === x.id) && TRICKS.some((t) => t.lv === 1 && t.needs.includes(x.id))), rand).id;
  const ck = clientKey || pickOf(Object.keys(CLIENTS), rand), lead = CLIENTS[ck].part;
  const kinds = lv === 1 ? [lead] : lv === 2 ? (lead === "explain" ? ["perform", "explain"] : [lead, "explain"]) : ["expose", "perform", "explain"];
  return { lv, venue: venue.id, client: ck, method: m, parts: kinds.map((k) => partOf(k, m, rand)) };
}
/** Tonight's Bill for a UTC day: 3 bookings (Levels 1, 2, 3), the same for everyone, with a different client each. */
export function tonightsBill(day = utcDay()) {
  const rand = rng(seedOf("bookings", day)), clients = shuffle(Object.keys(CLIENTS), rand);
  return { day, seed: seedOf("bookings", day), bookings: [1, 2, 3].map((lv, i) => bookingOf(lv, rand, { clientKey: clients[i] })) };
}
/** Points: each part 2 if right first time, 1 on the second try; +1 for a performed trick that's in your repertoire. */
export const pay = (pts, lv, billing) => Math.round(pts * LEVEL_MULT[lv] * billing.mult);
/** The line a client says when booking you. */
export function pitchOf(b) {
  const v = venueOf(b.venue), c = CLIENTS[b.client];
  return `${c.e} ${c.name} at ${v.name} ${c.ask}.`;
}
