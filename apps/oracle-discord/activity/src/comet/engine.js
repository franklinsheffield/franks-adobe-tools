// Comet Hunter: pure logic (no DOM). The Observatory's second new game.
// Level 1 Spot the mover: blink two plates and tap what moved. Decoys teach: a variable star, dust on one plate, a satellite trail.
// The size of the hop says what it is (near-Earth, main belt, far out); the last plate is modelled on Tombaugh's 1930 Pluto pair.
// Level 2 Comet or Messier object: a fuzzy patch on both plates. Did it move? If not, which Messier object is it?
// Level 3 Predict a return: from a real comet's last pass and its period, say when it comes back, as Halley did.
// Progress: prog.rooms.comet = { plays, best: { 1: stars, 2, 3 }, cleared: [levels], caught: [comet ids] }.
import { TARGETS } from "../watch/catalog.js";

export const ROOM = "comet";
export const room = (p) => { const r = ((p.rooms ||= {})[ROOM] ||= { plays: 0, best: {}, cleared: [], caught: [] }); r.best ||= {}; r.cleared ||= []; r.caught ||= []; return r; };
export const ROUNDS = 5, PASS = 3;
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Real comets caught on Level 2 plates. Each fact is checkable. */
export const COMETS = [
  { id: "halley", name: "Halley's Comet (1P)", note: "In 1986 the Giotto probe flew about 600 km from Halley's nucleus and photographed it: a dark, peanut-shaped lump about 15 km long." },
  { id: "halebopp", name: "Hale-Bopp (C/1995 O1)", note: "Found on 23 July 1995 by Alan Hale and Thomas Bopp, independently, on the same night. It stayed visible to the naked eye for about 18 months." },
  { id: "hyakutake", name: "Hyakutake (C/1996 B2)", note: "Found by amateur Yuji Hyakutake with big binoculars in January 1996. Two months later it passed about 15 million km from Earth." },
  { id: "neowise", name: "NEOWISE (C/2020 F3)", note: "Found in March 2020 by the NEOWISE space telescope, it was a naked-eye comet in July 2020." },
  { id: "tsuchinshan", name: "Tsuchinshan-ATLAS (C/2023 A3)", note: "Found by Purple Mountain Observatory in China and the ATLAS survey, it was bright in October 2024." },
  { id: "sl9", name: "Shoemaker-Levy 9", note: "Jupiter's gravity tore it into more than 20 pieces, which hit Jupiter in July 1994: the first collision of two Solar System bodies ever watched." },
  { id: "messier1769", name: "The Great Comet of 1769", note: "Charles Messier discovered it on 8 August 1769. Hunting comets was his career; his list of fuzzy non-comets made him famous instead." },
];
/** The Messier objects Level 2 can show (from the Night Watch catalogue), with a shape for the plate drawing. */
const SHAPE = { "Galaxy": "galaxy", "Globular cluster": "globular", "Open cluster": "open", "Planetary nebula": "ring", "Supernova remnant": "crab", "Nebula": "nebula" };
export const MESSIERS = TARGETS.filter((t) => t.messier).map((t) => ({ id: t.id, name: t.name, m: t.messier, kind: t.kind, shape: SHAPE[t.kind] || "nebula", note: t.note }));

/** Real periodic comets for Level 3: last perihelion year, period in years, the real next return year, and its meteor shower. */
export const RETURNS = [
  { id: "halley1682", name: "Halley's Comet", seen: 1682, period: 76, next: 1758, why: "Edmond Halley saw that the comets of 1531, 1607 and 1682 were one comet and predicted its return for 1758. It was spotted on Christmas night 1758, 16 years after his death." },
  { id: "halley", name: "Halley's Comet (1P)", seen: 1986, period: 76, next: 2061, shower: "Orionids and Eta Aquariids", why: "It last passed the Sun in February 1986 and returns in July 2061. Its dust gives two showers a year: the Eta Aquariids in May and the Orionids in October." },
  { id: "tempeltuttle", name: "Tempel-Tuttle (55P)", seen: 1998, period: 33, next: 2031, shower: "Leonids", why: "It passed the Sun in 1998 and is due back in 2031. Its dust is the Leonids: in 1833 they fell like snow over North America." },
  { id: "swifttuttle", name: "Swift-Tuttle (109P)", seen: 1992, period: 133, next: 2126, shower: "Perseids", why: "It last passed the Sun in December 1992 and returns in 2126. Its dust is the Perseids every August." },
  { id: "encke", name: "Encke's Comet (2P)", seen: 2023.8, when: "October 2023", period: 3.3, next: 2027, shower: "Taurids", why: "It has the shortest period of any bright comet, about 3.3 years. Johann Encke worked out its orbit in 1819. Its dust is the Taurids." },
  { id: "67p", name: "Churyumov-Gerasimenko (67P)", seen: 2021.8, when: "November 2021", period: 6.4, next: 2028, why: "It goes round every 6.4 years. In 2014 the Rosetta probe orbited it and set the Philae lander down on its surface, a first." },
  { id: "ponsbrooks", name: "Pons-Brooks (12P)", seen: 2024, period: 71, next: 2095, why: "It passed the Sun in April 2024, the month of the total solar eclipse over North America, and returns in the 2090s, about 71 years later." },
];

// ---- Level 1: spot the mover ----
/** What a mover is, by how far it hops between plates: the nearer an object, the faster it seems to move against the stars. */
export const MOVERS = {
  near: { hop: [40, 55], label: "Near-Earth asteroid", note: "A big hop means it's close. Surveys such as ATLAS and Pan-STARRS find near-Earth asteroids this way today: repeat images of the same sky, searched for points that move." },
  main: { hop: [18, 30], label: "Main-belt asteroid", note: "A middling hop: most likely a main-belt asteroid, between Mars and Jupiter. Giuseppe Piazzi found the first, Ceres, on 1 January 1801 by seeing it shift from night to night." },
  far: { hop: [8, 12], label: "Something far out", note: "A tiny hop: something a long way off. The farther out an object is, the slower it seems to drift against the stars." },
  pluto: { hop: [8, 10], label: "Pluto, 1930", note: "Clyde Tombaugh blinked plates of Gemini taken on 23 and 29 January 1930 and spotted Pluto on 18 February 1930, near the star Delta Geminorum. He was 24." },
};
/** The last plate of a run is a Pluto plate modelled on Tombaugh's discovery pair. */
export const PLUTO_ROUND = 4;
/**
 * A plate pair (400x260): stars (same on both), the mover's two positions and kind, and decoys that teach:
 * from round 1 a variable star (brightens, never moves), from round 2 a flaw on one plate, from round 3 a satellite trail on one plate.
 */
export function platePair(seed, round = 0) {
  const r = rng(seed), n = 34 + round * 12;
  const stars = Array.from({ length: n }, () => ({ x: 14 + r() * 372, y: 14 + r() * 232, s: 0.5 + r() * r() * 2.2 }));
  const kind = round === PLUTO_ROUND ? "pluto" : round <= 1 ? (r() < 0.5 ? "near" : "main") : ["near", "main", "far"][Math.floor(r() * 3)];
  const [lo, hi] = MOVERS[kind].hop, shift = lo + r() * (hi - lo);
  const x0 = 70 + r() * 260, y0 = 50 + r() * 160, a = r() * Math.PI * 2, cl = (v, m) => Math.min(m - 14, Math.max(14, v));
  const mover = { kind, a: { x: x0, y: y0 }, b: { x: cl(x0 + Math.cos(a) * shift, 400), y: cl(y0 + Math.sin(a) * shift, 260) }, s: Math.max(0.9, 1.7 - round * 0.18) };
  const away = (x, y, d = 30) => [mover.a, mover.b].every((m) => Math.hypot(m.x - x, m.y - y) > d);
  for (const q of stars) for (let k = 0; k < 20 && !away(q.x, q.y, 14); k++) { q.x = 14 + r() * 372; q.y = 14 + r() * 232; } // no star crowds the mover
  const spot = () => { for (let k = 0; k < 20; k++) { const x = 24 + r() * 352, y = 24 + r() * 212; if (away(x, y)) return { x, y }; } return { x: 30, y: 30 }; };
  const variable = round >= 1 ? { ...spot(), sa: 2.4, sb: 0.9, bright: r() < 0.5 ? "a" : "b" } : null;
  const flaw = round >= 2 ? { ...spot(), on: r() < 0.5 ? "a" : "b" } : null;
  let trail = null;
  if (round >= 3) { const y1 = 20 + r() * 220, y2 = 20 + r() * 220; trail = { x1: 0, y1, x2: 400, y2, on: r() < 0.5 ? "a" : "b" }; if ([mover.a, mover.b].some((m) => segDist(trail, m.x, m.y) < 22)) { trail.y1 = cl(mover.a.y + 60, 260); trail.y2 = cl(mover.a.y + 70, 260); } }
  return { stars, mover, flaw, variable, trail };
}
const segDist = (t, x, y) => { const dx = t.x2 - t.x1, dy = t.y2 - t.y1, k = Math.max(0, Math.min(1, ((x - t.x1) * dx + (y - t.y1) * dy) / (dx * dx + dy * dy))); return Math.hypot(t.x1 + k * dx - x, t.y1 + k * dy - y); };
/** What a tap at (x, y) lands on: the nearest of mover / variable / flaw / trail / star within R, or null for empty sky. */
export function pickAt(pair, x, y, R = 16) {
  const c = [];
  for (const m of [pair.mover.a, pair.mover.b]) c.push(["mover", Math.hypot(m.x - x, m.y - y) * 0.8]); // a small pull towards the mover
  if (pair.variable) c.push(["variable", Math.hypot(pair.variable.x - x, pair.variable.y - y)]);
  if (pair.flaw) c.push(["flaw", Math.hypot(pair.flaw.x - x, pair.flaw.y - y)]);
  if (pair.trail) c.push(["trail", segDist(pair.trail, x, y) + 4]);
  for (const s of pair.stars) c.push(["star", Math.hypot(s.x - x, s.y - y)]);
  const best = c.filter((q) => q[1] <= R).sort((p, q) => p[1] - q[1])[0];
  return best ? best[0] : null;
}
/** How far the mover hopped, and what that suggests. */
export const hopOf = (pair) => ({ d: Math.round(Math.hypot(pair.mover.a.x - pair.mover.b.x, pair.mover.a.y - pair.mover.b.y)), ...MOVERS[pair.mover.kind] });
/** Did a tap at (x, y) on the 400x260 plate hit the mover (on either plate)? */
export const hitMover = (pair, x, y, R = 12) => [pair.mover.a, pair.mover.b].some((m) => Math.hypot(m.x - x, m.y - y) <= R);
export const hitFlaw = (pair, x, y, R = 12) => !!pair.flaw && Math.hypot(pair.flaw.x - x, pair.flaw.y - y) <= R;

// ---- Level 2: comet or Messier object ----
/** A round: { comet?, messier?, moved, choices (Messier names), a }. About half are comets. */
export function fuzzyRound(seed) {
  const r = rng(seed), isComet = r() < 0.5;
  if (isComet) { const c = COMETS[Math.floor(r() * COMETS.length)]; return { comet: c, moved: true, a: "comet" }; }
  const m = MESSIERS[Math.floor(r() * MESSIERS.length)], others = shuffle(MESSIERS.filter((x) => x.id !== m.id), r).slice(0, 3);
  return { messier: m, moved: false, a: "messier", choices: shuffle([m, ...others], r).map((x) => x.name), name: m.name };
}

// ---- Level 3: predict a return ----
/** { c, q, choices, a, why }: the real next return among 4 years. */
export function returnRound(seed) {
  const r = rng(seed), c = RETURNS[Math.floor(r() * RETURNS.length)], a = c.next;
  const wrong = [Math.round(c.seen + c.period / 2), Math.round(c.seen + c.period * 2), c.next + (c.period > 10 ? 11 : 2), c.next - (c.period > 10 ? 9 : 1)].filter((y) => y !== a);
  const choices = shuffle([a, ...[...new Set(wrong)].slice(0, 3)], r).map(String);
  return { c, q: `${c.name} last passed the Sun in ${c.when || c.seen}. It goes round once every ${c.period} years. When does it come back?`, choices, a: String(a), why: c.why };
}

/** A round of any level, from a seed. */
export const roundOf = (level, seed, i) => (level === 1 ? platePair(seed, i) : level === 2 ? fuzzyRound(seed) : returnRound(seed));
/** Stars for a round: 1st try 3, 2nd 2, 3rd 1. */
export const starsFor = (tries) => (tries <= 1 ? 3 : tries === 2 ? 2 : 1);
export const isOpen = (p, level) => level === 1 || room(p).cleared.includes(level - 1);
/** Finish a level run: { won, perfect, first, stars }. A run is won with PASS of ROUNDS right. */
export function settleRun(p, level, results) {
  const r = room(p), right = results.filter((x) => x > 0).length, stars = results.reduce((a, b) => a + b, 0), won = right >= PASS, perfect = results.every((x) => x === 3);
  const first = won && !r.cleared.includes(level); if (first) r.cleared.push(level); r.best[level] = Math.max(r.best[level] || 0, stars); r.plays += 1;
  return { won, perfect, first, stars, right };
}
/** Note a caught comet. Returns true the first time (that pays a ☄️ shard). */
export function catchComet(p, id) { const r = room(p); if (r.caught.includes(id)) return false; r.caught.push(id); return true; }
