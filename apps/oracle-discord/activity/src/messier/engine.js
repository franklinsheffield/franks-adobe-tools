// Messier's Catalogue: pure logic (no DOM). The Observatory's catalogue track and its hunt game.
// Level 1 What is it?: an eyepiece sketch of a real Messier object; name its kind.
// Level 2 Where is it?: name the constellation it lies in.
// Level 3 Tonight: from the player's city at night, which of four objects stands highest?
// A right answer logs the object. Night Watch logs of Messier targets count too (watchLogged).
// Progress: prog.rooms.messier = { plays, best: { level: stars }, cleared: [levels], logged: [M numbers], paidTens: n, sealed }.
import { MESSIER_ROWS } from "./data.js";
import { altAz, lst } from "../stars/tonight.js";
import { loggedTargets } from "../watch/engine.js";

export const ROOM = "messier";
export const room = (p) => {
  const r = ((p.rooms ||= {})[ROOM] ||= { plays: 0, best: {}, cleared: [], logged: [], paidTens: 0, sealed: false });
  r.best ||= {}; r.cleared ||= []; r.logged ||= []; r.paidTens ||= 0; return r;
};
export const ROUNDS = 5, PASS = 3, TOTAL = 110, TEN_PAY = 50, SEAL_SHARDS = 10;
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const KINDS = {
  gc: { name: "Globular cluster", fact: "A globular cluster is a ball of hundreds of thousands of old stars, held together by gravity in the halo around our galaxy." },
  oc: { name: "Open cluster", fact: "An open cluster is a loose family of young stars born from the same cloud. Over a few hundred million years they drift apart." },
  sg: { name: "Galaxy", fact: "A spiral galaxy is a disc of billions of stars with arms where new stars form, millions of light years beyond our own Milky Way." },
  eg: { name: "Galaxy", fact: "An elliptical galaxy is a smooth ball of old stars with little gas left to make new ones. Many sit in the Virgo Cluster." },
  ig: { name: "Galaxy", fact: "M82 is a starburst galaxy: a close pass by its neighbour M81 set off a burst of star birth that blows gas out of its centre." },
  neb: { name: "Nebula", fact: "A glowing nebula is a cloud of gas lit up by hot young stars inside it: a stellar nursery." },
  rn: { name: "Nebula", fact: "A reflection nebula is dust that shines by reflecting the light of nearby stars, so it looks blue, like our sky." },
  pn: { name: "Planetary nebula", fact: "A planetary nebula is the shell a dying Sun-like star puffs off. William Herschel named them because their discs looked like planets." },
  snr: { name: "Supernova remnant", fact: "The Crab Nebula is the wreck of a star that exploded in 1054. Chinese astronomers saw it in daylight for 23 days." },
  grp: { name: "Star group", fact: "Three Messier entries are not one object: M24 is a bright patch of the Milky Way, M40 a double star and M73 a small group of four stars." },
};
export const KIND_CHOICES = ["Globular cluster", "Open cluster", "Galaxy", "Nebula", "Planetary nebula", "Supernova remnant", "Star group"];

/** All 110: { m, name, kind, kindName, ra, dec, mag, con, desig, label }. */
export const MESSIER = MESSIER_ROWS.map(([m, name, kind, ra, dec, mag, con, desig]) => ({ m, name, kind, kindName: KINDS[kind].name, ra, dec, mag, con, desig, label: `M${m}${name ? ` · ${name}` : ""}` }));
export const byM = (m) => MESSIER[m - 1] || null;

/** M numbers logged in the Night Watch (its Messier targets). */
export const watchLogged = (p) => loggedTargets(p).filter((t) => t.messier).map((t) => t.messier);
/** Every M number the player has logged anywhere, sorted. */
export const loggedSet = (p) => [...new Set([...room(p).logged, ...watchLogged(p)])].sort((a, b) => a - b);
export const loggedCount = (p) => loggedSet(p).length;
export const isLogged = (p, m) => loggedSet(p).includes(m);

/** Log an object. Returns { first, tens (💎 payouts newly due, each TEN_PAY), sealed (full catalogue just finished) }. */
export function logObject(p, m) {
  const r = room(p), first = !isLogged(p, m);
  if (first) r.logged.push(m);
  return { first, ...payouts(p) };
}
/** Settle any milestone pay due: every 10 logged pays 💎 TEN_PAY once; all 110 seals the catalogue once. */
export function payouts(p) {
  const r = room(p), n = loggedCount(p), due = Math.floor(n / 10) - r.paidTens, tens = Math.max(0, due);
  r.paidTens += tens;
  const sealed = n >= TOTAL && !r.sealed; if (sealed) r.sealed = true;
  return { tens, sealed };
}

// ---- rounds ----
/** Level 1: name the kind from the sketch. */
export function kindRound(seed, p) {
  const r = rng(seed * 2654435761), pool = preferUnlogged(p, r), o = pool[Math.floor(r() * pool.length)];
  const others = shuffle(KIND_CHOICES.filter((k) => k !== o.kindName), r).slice(0, 3);
  return { o, q: `M${o.m} (${o.desig}), in ${o.con}. Through the eyepiece, what kind of object is it?`, choices: shuffle([o.kindName, ...others], r), a: o.kindName,
    why: `M${o.m} is a ${o.kindName.toLowerCase()} in ${o.con}, magnitude ${o.mag}. ${KINDS[o.kind].fact}` };
}
/** Level 2: name the constellation. */
export function conRound(seed, p) {
  const r = rng(seed * 2654435761), pool = preferUnlogged(p, r), o = pool[Math.floor(r() * pool.length)];
  const cons = [...new Set(MESSIER.map((x) => x.con))].filter((c) => c !== o.con);
  return { o, q: `${o.label} (${o.desig}), a ${o.kindName.toLowerCase()}. Which constellation is it in?`, choices: shuffle([o.con, ...shuffle(cons, r).slice(0, 3)], r), a: o.con,
    why: `M${o.m} lies in ${o.con}, at right ascension ${(o.ra / 15).toFixed(1)} h and declination ${o.dec > 0 ? "+" : ""}${o.dec.toFixed(1)}°. ${KINDS[o.kind].fact}` };
}
/** Level 3: four objects; which is highest over the city at that time? Altitudes are real (alt-az from RA/Dec and sidereal time). */
export function tonightRound(seed, place, at) {
  const r = rng(seed * 2654435761), L = lst(at, place.lon);
  const withAlt = MESSIER.map((o) => ({ o, alt: altAz(o.ra, o.dec, place.lat, L)[1] }));
  const up = shuffle(withAlt.filter((x) => x.alt >= 15), r);
  for (let tries = 0; tries < 40; tries++) {
    const pick = [up[Math.floor(r() * up.length)], ...shuffle(withAlt, r).slice(0, 3)];
    const alts = pick.map((x) => x.alt).sort((a, b) => b - a);
    if (new Set(pick.map((x) => x.o.m)).size === 4 && alts[0] - alts[1] >= 8) {
      const top = pick.reduce((a, b) => (b.alt > a.alt ? b : a));
      const opts = shuffle(pick, r);
      return { o: top.o, opts: opts.map((x) => ({ m: x.o.m, label: x.o.label, alt: Math.round(x.alt) })), q: `Over ${place.name} at ${hhmm(at, place)}, which of these stands highest in the sky?`,
        choices: opts.map((x) => x.o.label), a: top.o.label,
        why: `${top.o.label} is ${Math.round(top.alt)}° up. ${opts.filter((x) => x !== top).map((x) => `${x.o.label} ${x.alt < 0 ? `is below the horizon (${Math.round(x.alt)}°)` : `is ${Math.round(x.alt)}° up`}`).join("; ")}.` };
    }
  }
  return kindRound(seed, null);
}
const hhmm = (at, place) => { try { return new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: place.tz }); } catch { return new Date(at).toISOString().slice(11, 16) + " UTC"; } };
/** Mostly objects not yet logged, so runs fill the catalogue. */
function preferUnlogged(p, r) { if (!p) return MESSIER; const have = new Set(loggedSet(p)), fresh = MESSIER.filter((o) => !have.has(o.m)); return fresh.length && r() < 0.8 ? fresh : MESSIER; }

export const roundOf = (level, seed, p, place, at) => (level === 1 ? kindRound(seed, p) : level === 2 ? conRound(seed, p) : tonightRound(seed, place, at));
export const starsFor = (tries) => (tries <= 1 ? 3 : tries === 2 ? 2 : 1);
export const isOpen = (p, level) => level === 1 || room(p).cleared.includes(level - 1);
export function settleRun(p, level, results) {
  const r = room(p), right = results.filter((x) => x > 0).length, stars = results.reduce((a, b) => a + b, 0), won = right >= PASS, perfect = results.every((x) => x === 3);
  const first = won && !r.cleared.includes(level); if (first) r.cleared.push(level); r.best[level] = Math.max(r.best[level] || 0, stars); r.plays += 1;
  return { won, perfect, first, stars, right };
}
/** Counts by kind for the catalogue page. */
export function kindCounts(p) {
  const have = new Set(loggedSet(p)), out = {};
  for (const o of MESSIER) { const k = o.kindName; out[k] ||= { have: 0, all: 0 }; out[k].all++; if (have.has(o.m)) out[k].have++; }
  return out;
}
