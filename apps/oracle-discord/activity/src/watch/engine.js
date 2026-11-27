// The Night Watch: the Observatory's core loop, as pure logic (no DOM, so tests can check it).
// Observe tonight's real sky over the player's city -> measure what you logged in the Plate Room -> deliver results to
// clients at the Almanac Desk. Progress: prog.rooms.watch = { plays, log: { id: { at, city, alt, arch, eye } },
// plates: { id: stars 1-3 }, jobs: { day, done: [jobId] }, jobsDone, place: { name } }.
import { TARGETS, WANDERERS, EYEPIECES, CLASSES, TYPES, targetById } from "./catalog.js";
import { altAz, lst, nightOf, cityOf, placeForZone, zone, compass } from "../stars/tonight.js";
import { skyTonight, fists } from "../stars/planets.js";

export const ROOM = "watch";
export const room = (p) => {
  const r = ((p.rooms ||= {})[ROOM] ||= { plays: 0, log: {}, plates: {}, jobs: { day: "", done: [] }, jobsDone: 0 });
  r.log ||= {}; r.plates ||= {}; r.jobs ||= { day: "", done: [] }; r.jobsDone ||= 0; return r;
};
/** The player's city: the one saved here, else Star Lore's, else the one for the device's time zone. City only, never more precise. */
export const placeOf = (p) => cityOf(room(p).place) || cityOf(((p.rooms || {}).stars || {}).place) || placeForZone(zone());

export const MIN_ALT = 15; // lower than this the air is too thick to see much
export const FAINT = 4;    // targets fainter than this need dark-adapted eyes

/** What you could observe from a place at a time: [{ t, alt, az, dir, fists }], highest first. Planets use the real ephemeris. */
export function upNow(place, ms) {
  const L = lst(ms, place.lon), out = [];
  for (const t of TARGETS) { const [az, alt] = altAz(t.ra, t.dec, place.lat, L); if (alt >= MIN_ALT) out.push({ t, alt, az }); }
  const sky = skyTonight(place, ms);
  for (const w of WANDERERS) { const s = sky.find((x) => x.p.id === w.id); if (s && s.see && s.alt >= MIN_ALT - 5) out.push({ t: w, alt: s.alt, az: s.az, mag: s.w.mag }); }
  return out.map((o) => ({ ...o, dir: compass(o.az), fists: fists(o.alt) })).sort((a, b) => b.alt - a.alt);
}
/** The time to observe: now if it's dark, otherwise when tonight gets dark. */
export const watchTime = (place, now = Date.now()) => { const n = nightOf(place, now); return { at: n.at, night: n }; };

/** Tonight's Target: the same pick for everyone who shares a city on a day, from what is really up. */
export function tonightsTarget(place, ms, seed) {
  const up = upNow(place, ms).filter((o) => o.t.plate !== "phase"); if (!up.length) return null;
  return up[seed % up.length];
}

export const eyepiece = (id) => EYEPIECES.find((e) => e.id === id) || EYEPIECES[0];
/** Why an eyepiece is wrong for a target (one real reason), or null when it's the right one. */
export function eyeVerdict(t, epId) {
  if (epId === t.eye) return null;
  if (t.eye === "high") return `${t.name} is small and bright: it needs high power to show any detail.`;
  if (t.eye === "low") return epId === "high" ? `At high power ${t.name} spills out of the view and its light is spread too thin. Go wide.` : `${t.name} is spread out: the widest eyepiece frames it best.`;
  return epId === "low" ? `${t.name} is small: at low power it's just a fuzzy dot. Use more magnification.` : `At 167× ${t.name} is too dim and blurry. Back off a little.`;
}
export const needsDark = (t) => typeof t.mag === "number" && t.mag > FAINT;

/** Log an observation. 3 tries at the eyepiece: returns { ok, done, misses } for the try. */
export function observe(p, t, epId, ctx) {
  const r = room(p), ok = !eyeVerdict(t, epId);
  if (ok) r.log[t.id] = { at: ctx.at, city: ctx.city, alt: Math.round(ctx.alt || 0), arch: !!ctx.arch, eye: epId };
  return { ok };
}
export const logged = (p, id) => !!room(p).log[id];
export const logCount = (p) => Object.keys(room(p).log).length;
export const loggedTargets = (p) => Object.keys(room(p).log).map(targetById).filter(Boolean);
export const messierLogged = (p) => loggedTargets(p).filter((t) => t.messier).length;

// ---- the Plate Room ----
const shuffle = (a, rnd) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const PERIODS = { algol: ["2 days 21 hours", "5 days 9 hours", "11 hours", "27 days"], delcep: ["5 days 9 hours", "2 days 21 hours", "1 year", "19 hours"] };
const PHASES = ["New Moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full Moon", "Waning gibbous", "Last quarter", "Waning crescent"];
/** The phase name for a Moon phase angle (0 new, 90 first quarter, 180 full, 270 last quarter). */
export const phaseName = (deg) => PHASES[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

/** The question a plate asks: { q, choices, a, why }. moonDeg: the Moon's phase angle now (for the phase plate). */
export function plateQuestion(t, rnd = Math.random, moonDeg = 0) {
  switch (t.plate) {
    case "spectrum": return { q: `Sort ${t.name} by its spectrum. Which class is it?`, choices: CLASSES, a: t.cls, why: `${t.name} is class ${t.cls}.` };
    case "light": return { q: `Time ${t.name}'s light curve. How long from one dip to the next?`, choices: shuffle(PERIODS[t.id], rnd), a: t.periodText, why: t.note };
    case "count": return { q: `How many stars does the plate of ${t.name} show at 31×?`, choices: ["1", "2", "3", "4"], a: String(t.count), why: t.note };
    case "parallax": return { q: `It shifted against the far stars between plates six months apart. How far is ${t.name}?`, choices: shuffle(["About 11 light-years", "About 110 light-years", "About 1 light-year", "About 1,100 light-years"], rnd), a: "About 11 light-years", why: t.note };
    case "type": return { q: `What is ${t.name}?`, choices: [t.kind, ...shuffle(TYPES.filter((x) => x !== t.kind), rnd).slice(0, 3)].sort(), a: t.kind, why: t.note };
    case "blink": return { q: `Blink the two plates. Which dot moved? That one is ${t.name}.`, choices: ["A", "B", "C", "D"], a: "B", why: "Planets wander against the fixed stars: 'planet' comes from the Greek for wanderer." };
    case "phase": { const a = phaseName(moonDeg); return { q: "Name tonight's phase of the Moon.", choices: [...new Set([a, ...shuffle(PHASES, rnd)])].slice(0, 4).sort(), a, why: "The Moon's phases are the part of its sunlit half we can see. A full cycle takes about 29.5 days." }; }
    case "moons": return { q: "How many moons did Galileo see beside Jupiter?", choices: ["2", "3", "4", "7"], a: "4", why: t.note };
    default: return null;
  }
}
/** A plate answered: 1st try 3 stars, 2nd try 2, after that 1. */
export const plateStars = (tries) => (tries <= 1 ? 3 : tries === 2 ? 2 : 1);
export function settlePlate(p, id, tries) { const r = room(p), s = plateStars(tries), was = r.plates[id] || 0; r.plates[id] = Math.max(was, s); return { stars: s, first: !was, better: s > was }; }
export const measured = (p, id) => !!room(p).plates[id];
export const plateCount = (p) => Object.keys(room(p).plates).length;

// ---- reputation at the Almanac Desk ----
export const REPUTATION = [{ at: 0, name: "Village Stargazer" }, { at: 8, name: "Royal Society Fellow" }, { at: 25, name: "Astronomer Royal" }];
export const repOf = (p) => REPUTATION.reduce((a, t) => (room(p).jobsDone >= t.at ? t : a), REPUTATION[0]);
export const nextRep = (p) => REPUTATION.find((t) => t.at > room(p).jobsDone) || null;

/** Rewards: [xp, essence]. */
export const PAY = { log: [8, 5], archive: [4, 2], plate: (s) => [4 * s, 3 * s], job: [15, 10], hard: [25, 20] };
