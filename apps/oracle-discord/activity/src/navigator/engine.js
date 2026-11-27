// Celestial Navigator: pure logic (no DOM). The Observatory's fourth new game. Sail a real voyage home by the sky.
// Level 1 Polaris: bring Polaris down to the horizon with the sextant; its altitude is your latitude.
// Level 2 The noon Sun: shoot the Sun at noon, take the Sun's declination from the almanac, work out your latitude.
// Level 3 Longitude: the chronometer keeps Greenwich time; each hour local noon is late or early is 15° of longitude.
// A run is one real voyage: 5 days at sea, one sight a day, along the way from the start port to the home port.
// Progress: prog.rooms.navigator = { plays, best: { level: stars }, cleared: [levels], voyages: [voyage ids] }.
import { altAz, lst, sunRaDec } from "../stars/tonight.js";

export const ROOM = "navigator";
export const room = (p) => { const r = ((p.rooms ||= {})[ROOM] ||= { plays: 0, best: {}, cleared: [], voyages: [] }); r.best ||= {}; r.cleared ||= []; r.voyages ||= []; return r; };
export const ROUNDS = 5, PASS = 3, SIGHT_TOL = 1; // a sight is good within 1°
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const POLARIS = { ra: 37.95, dec: 89.26 }; // J2000

/** Real voyages, all in the northern hemisphere so Polaris is always up. */
export const VOYAGES = [
  { id: "mayflower", name: "The Mayflower, 1620", from: { name: "Plymouth", lat: 50.37, lon: -4.14 }, to: { name: "Cape Cod", lat: 42.05, lon: -70.2 }, month: 9,
    note: "The Mayflower left Plymouth on 16 September 1620 and sighted Cape Cod after 66 days at sea, navigating by latitude and dead reckoning." },
  { id: "columbus", name: "Columbus, 1492", from: { name: "La Gomera", lat: 28.1, lon: -17.1 }, to: { name: "San Salvador", lat: 24.05, lon: -74.5 }, month: 9,
    note: "Columbus left La Gomera in the Canary Islands on 6 September 1492 and reached the Bahamas on 12 October, sailing roughly due west along a line of latitude." },
  { id: "h4", name: "Harrison's H4 trial, 1761", from: { name: "Portsmouth", lat: 50.8, lon: -1.1 }, to: { name: "Port Royal, Jamaica", lat: 17.94, lon: -76.84 }, month: 11,
    note: "William Harrison sailed to Jamaica in 1761 to test his father's H4 watch. After 81 days at sea it was only about 5 seconds slow: under 2 minutes of longitude." },
  { id: "hokulea", name: "Hōkūleʻa's return, 1976", from: { name: "Papeete, Tahiti", lat: 17.5, lon: -149.6, south: true }, to: { name: "Honolulu", lat: 21.3, lon: -157.86 }, month: 7,
    note: "In 1976 the voyaging canoe Hōkūleʻa sailed between Hawaiʻi and Tahiti with no instruments, navigator Mau Piailug reading stars, swells and birds. It proved such voyages could be made on purpose." },
  { id: "cutty", name: "Lisbon to Bermuda", from: { name: "Lisbon", lat: 38.7, lon: -9.14 }, to: { name: "Bermuda", lat: 32.3, lon: -64.8 }, month: 5,
    note: "Portuguese navigators of the 1400s found latitude from Polaris with a simple quadrant, which let them sail out into the Atlantic and back." },
];
export const voyageById = (id) => VOYAGES.find((v) => v.id === id) || null;

/** Where the ship is on day i (0..ROUNDS-1) of a voyage: a straight line on the chart, from the start to just short of home. */
export function shipOn(v, i) { const f = (i + 1) / (ROUNDS + 0.5), lat = (v.from.south ? -v.from.lat : v.from.lat); return { lat: +(lat + (v.to.lat - lat) * f).toFixed(2), lon: +(v.from.lon + (v.to.lon - v.from.lon) * f).toFixed(2) }; }
const latText = (l) => `${Math.abs(Math.round(l))}° ${l >= 0 ? "N" : "S"}`, lonText = (l) => `${Math.abs(Math.round(l))}° ${l >= 0 ? "E" : "W"}`;
export { latText, lonText };
/** A time on day i of a voyage (a recent year, the voyage's season), at a UTC hour. */
const dayMs = (v, i, hourUTC) => Date.UTC(2026, v.month - 1, 3 + i * 5, Math.floor(hourUTC), Math.round((hourUTC % 1) * 60));
const choicesAround = (a, step, r, fmt) => shuffle([a, a + step, a - step, a + 2 * step * (r() < 0.5 ? 1 : -1)], r).map(fmt);

/** Level 1: Polaris's real altitude from the ship, a few hours after dark. */
export function polarisSight(v, i, seed) {
  const r = rng(seed), s = shipOn(v, i), local = 21 + r() * 4, ms = dayMs(v, i, local - s.lon / 15), alt = altAz(POLARIS.ra, POLARIS.dec, s.lat, lst(ms, s.lon))[1];
  const a = Math.round(s.lat), q = "You've brought Polaris down to the horizon. What's your latitude?";
  return { kind: "polaris", ship: s, alt, a: latText(a), choices: choicesAround(a, 5, r, latText), q,
    why: `Polaris sits less than 1° from the celestial pole, so its height above the horizon is your latitude: ${alt.toFixed(1)}° up puts you near ${latText(s.lat)}.` };
}
/** Level 2: the Sun at local noon. Latitude = 90° − altitude + declination (Sun bearing south). */
export function noonSight(v, i, seed) {
  const r = rng(seed), s = shipOn(v, i), ms = dayMs(v, i, 12 - s.lon / 15), dec = sunRaDec(ms)[1], alt = 90 - Math.abs(s.lat - dec), south = s.lat > dec;
  const a = Math.round(s.lat);
  return { kind: "noon", ship: s, alt, dec: +dec.toFixed(1), south, a: latText(a), choices: choicesAround(a, 4, r, latText),
    q: `Noon sight: the Sun stood ${alt.toFixed(1)}° high, bearing ${south ? "south" : "north"}. The almanac gives its declination today as ${Math.abs(dec).toFixed(1)}° ${dec >= 0 ? "N" : "S"}. Your latitude?`,
    why: `With the Sun to the ${south ? "south" : "north"}: latitude = 90° − ${alt.toFixed(1)}° ${south ? "+" : "−"} declination (${dec.toFixed(1)}°) = ${s.lat.toFixed(1)}°. Navigators did this sum every day at noon.` };
}
/** Level 3: Greenwich time at local noon (after the equation-of-time correction) gives longitude. */
export function longitudeSight(v, i, seed) {
  const r = rng(seed), s = shipOn(v, i), gmt = 12 - s.lon / 15, hh = Math.floor(gmt), mm = Math.round((gmt - hh) * 60), shown = `${String(hh + (mm === 60 ? 1 : 0)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
  const a = Math.round(s.lon);
  return { kind: "longitude", ship: s, gmt: shown, a: lonText(a), choices: choicesAround(a, 15, r, lonText),
    q: `The Sun reached its highest (local noon, corrected for the equation of time) when the chronometer, set to Greenwich, read ${shown}. Your longitude?`,
    why: `Earth turns 15° an hour. Local noon came ${(gmt - 12).toFixed(2)} hours after Greenwich noon, so you are ${(Math.abs(s.lon)).toFixed(1)}° ${s.lon < 0 ? "west" : "east"}. ${v.id === "h4" ? "Harrison's H4 made exactly this work on this voyage." : "Without a good clock, longitude was guesswork until the 1760s."}` };
}
export const sightOf = (level, v, i, seed) => (level === 1 ? polarisSight(v, i, seed) : level === 2 ? noonSight(v, i, seed) : longitudeSight(v, i, seed));
/** The angle the sextant must read for a sight (Polaris's or the noon Sun's altitude), or null for Level 3. */
export const sightAngle = (s) => (s.kind === "longitude" ? null : s.alt);
export const goodSight = (s, angle) => sightAngle(s) == null || Math.abs(angle - sightAngle(s)) <= SIGHT_TOL;
/** Voyages a level can use (Hōkūleʻa starts south of the equator, so not for Polaris on day 1). */
export const voyagesFor = (level) => VOYAGES.filter((v) => level !== 1 || !v.from.south);
export const voyageOf = (level, seed) => { const vs = voyagesFor(level); return vs[Math.floor(rng(seed)() * vs.length)]; };

export const starsFor = (tries) => (tries <= 1 ? 3 : tries === 2 ? 2 : 1);
export const isOpen = (p, level) => level === 1 || room(p).cleared.includes(level - 1);
export function settleRun(p, level, voyageId, results) {
  const r = room(p), right = results.filter((x) => x > 0).length, stars = results.reduce((a, b) => a + b, 0), won = right >= PASS, perfect = results.every((x) => x === 3);
  const first = won && !r.cleared.includes(level); if (first) r.cleared.push(level); r.best[level] = Math.max(r.best[level] || 0, stars); r.plays += 1;
  const newVoyage = won && !r.voyages.includes(voyageId); if (newVoyage) r.voyages.push(voyageId);
  return { won, perfect, first, stars, right, newVoyage };
}
