// Comet Hunter: pure logic (no DOM). The Observatory's second new game.
// Level 1 Spot the mover: blink two plates taken a week apart and tap what moved (plate flaws show on one plate only).
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
/** A plate pair: stars (same on both), the mover's two positions, and (from round 3) a flaw on one plate only. Plates are 400x260. */
export function platePair(seed, round = 0) {
  const r = rng(seed), n = 34 + round * 12, shift = Math.max(9, 30 - round * 5);
  const stars = Array.from({ length: n }, () => ({ x: 14 + r() * 372, y: 14 + r() * 232, s: 0.5 + r() * r() * 2.2 }));
  const x0 = 60 + r() * 280, y0 = 40 + r() * 180, a = r() * Math.PI * 2;
  const mover = { a: { x: x0, y: y0 }, b: { x: Math.min(386, Math.max(14, x0 + Math.cos(a) * shift)), y: Math.min(246, Math.max(14, y0 + Math.sin(a) * shift)) }, s: 1.1 + r() * 0.6 };
  const flaw = round >= 2 ? { x: 20 + r() * 360, y: 20 + r() * 220, on: r() < 0.5 ? "a" : "b" } : null;
  return { stars, mover, flaw };
}
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
