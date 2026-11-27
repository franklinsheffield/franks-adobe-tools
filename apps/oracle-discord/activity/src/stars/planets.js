// Planet Tracker for Star Lore Navigator: where the Moon and planets really are tonight, and what astrological tradition
// says about each one's current position. Astronomy from astronomy-engine (the same library as the Oracle's birth charts,
// src/ephemeris.js): J2000 RA/Dec for the star chart, magnitude, distance, the constellation it is really in, and the
// angle from the Sun. Astrology (clearly labelled as tradition, not science): tropical sign and degree, retrograde,
// rulership and dignity, and the classic aspects between planets. Pure functions: tests/stars-planets.test.js checks them.
import * as A from "astronomy-engine";
import { positions, zodiac } from "../../../src/ephemeris.js";
import { ASPECTS } from "../../../src/modules/astrology/chart.js";
import { frame, compass } from "./tonight.js";

const DAY = 864e5;
/** The wanderers we track. eye: visible to the naked eye; bin: needs binoculars or a telescope. */
export const PLANETS = [
  { id: "moon", name: "Moon", glyph: "☽", colour: "#f4f1e6", eye: true, body: "Moon" },
  { id: "mercury", name: "Mercury", glyph: "☿", colour: "#c9b8a6", eye: true, body: "Mercury" },
  { id: "venus", name: "Venus", glyph: "♀", colour: "#fff4cf", eye: true, body: "Venus" },
  { id: "mars", name: "Mars", glyph: "♂", colour: "#ff8a5c", eye: true, body: "Mars" },
  { id: "jupiter", name: "Jupiter", glyph: "♃", colour: "#f6dfb3", eye: true, body: "Jupiter" },
  { id: "saturn", name: "Saturn", glyph: "♄", colour: "#ecd48f", eye: true, body: "Saturn" },
  { id: "uranus", name: "Uranus", glyph: "♅", colour: "#a9e6ec", eye: false, body: "Uranus" },
  { id: "neptune", name: "Neptune", glyph: "♆", colour: "#7fa0ff", eye: false, body: "Neptune" },
];
export const planetById = (id) => PLANETS.find((p) => p.id === id) || null;

/** Real astronomy for one wanderer at a time (ms): J2000 RA/Dec (degrees), magnitude, distance (AU), constellation, elongation from the Sun. */
export function where(p, ms) {
  const t = A.MakeTime(new Date(ms)), v = p.id === "moon" ? A.GeoMoon(t) : A.GeoVector(A.Body[p.body], t, true), e = A.EquatorFromVector(v);
  const con = A.Constellation(e.ra, e.dec), il = A.Illumination(A.Body[p.body], t);
  return { ra: e.ra * 15, dec: e.dec, dist: e.dist, mag: il.mag, phase: il.phase_fraction, con: con.name, elong: A.Elongation(A.Body[p.body], t).elongation };
}
/** Its path on the star chart over a span of days around ms (J2000 [ra, dec] points), for drawing retrograde loops. */
export function track(p, ms, before = 40, after = 40, step = 2) {
  const out = []; for (let d = -before; d <= after; d += step) { const w = where(p, ms + d * DAY); out.push([w.ra, w.dec]); } return out;
}
/** Light travel time to Earth, in minutes. */
export const lightMinutes = (au) => (au * 149597870.7) / 299792.458 / 60;

/** When it next rises over a place after ms (ms, or null if it doesn't rise in the next day). Real rise/set search, refraction included. */
export function riseTime(p, place, ms) {
  const r = A.SearchRiseSet(A.Body[p.body], new A.Observer(place.lat, place.lon, 0), +1, A.MakeTime(new Date(ms)), 1);
  return r ? r.date.getTime() : null;
}
/** Every wanderer for a place and time: where it is in the sky (altitude, azimuth, compass point), whether you could see it, and the chart point. */
export function skyTonight(place, ms) {
  const conv = frame(place, ms);
  return PLANETS.map((p) => { const w = where(p, ms), [x, alt] = conv(w.ra, w.dec), az = (360 - x) % 360, v = visibility(p, w);
    return { p, w, alt, az, dir: compass(az), up: alt > 0, see: alt > 3 && v.ok, why: v.why, rise: alt > 0 ? null : riseTime(p, place, ms) }; });
}
/** Altitude in fists: a fist held at arm's length covers about 10 degrees of sky. */
export const fists = (alt) => Math.max(1, Math.round(alt / 10));

// ---- astrological tradition ----
const DOMICILE = { sun: ["Leo"], moon: ["Cancer"], mercury: ["Gemini", "Virgo"], venus: ["Taurus", "Libra"], mars: ["Aries", "Scorpio"],
  jupiter: ["Sagittarius", "Pisces"], saturn: ["Capricorn", "Aquarius"], uranus: ["Aquarius"], neptune: ["Pisces"] };
const EXALT = { sun: "Aries", moon: "Taurus", mercury: "Virgo", venus: "Pisces", mars: "Capricorn", jupiter: "Cancer", saturn: "Libra" };
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const opp = (s) => SIGNS[(SIGNS.indexOf(s) + 6) % 12];
/** Rulership and dignity of a planet in a sign: domicile, exaltation, detriment, fall or peregrine (none). Uranus and Neptune use their modern rulerships. */
export function dignity(id, sign) {
  if ((DOMICILE[id] || []).includes(sign)) return "domicile";
  if (EXALT[id] === sign) return "exaltation";
  if ((DOMICILE[id] || []).map(opp).includes(sign)) return "detriment";
  if (EXALT[id] && opp(EXALT[id]) === sign) return "fall";
  return "peregrine";
}
export const DIGNITY_TEXT = {
  domicile: "at home in the sign it rules: tradition says it acts at full strength, in its own way",
  exaltation: "exalted: an honoured guest, tradition says, at its most dignified",
  detriment: "in detriment, in the sign opposite its home: tradition says it works awkwardly here",
  fall: "in its fall, opposite its exaltation: tradition says it struggles to express itself",
  peregrine: "peregrine (a wanderer with no special dignity here): tradition reads it through the sign's ruler",
};
export const rules = (id) => DOMICILE[id] || [];
export const KEYWORD = { moon: "feelings and habits", mercury: "thinking and messages", venus: "love, beauty and value", mars: "drive, courage and conflict",
  jupiter: "growth, luck and wisdom", saturn: "structure, limits and time", uranus: "change and surprise", neptune: "dreams and imagination", sun: "self and vitality" };
export const ASPECT_TEXT = { conjunction: "blend their themes", opposition: "pull in opposite directions", trine: "flow together easily",
  square: "create tension that pushes for action", sextile: "offer a gentle opportunity", quincunx: "need an awkward adjustment" };

/** The astrological state of every wanderer at a time: { id: { lon, sign, deg, text, retro, dignity } } plus aspects [{ a, b, type, symbol, orb }]. */
export function astroState(ms) {
  const pos = positions(new Date(ms)), out = {};
  for (const p of [...PLANETS, { id: "sun" }]) { const x = pos[p.id], z = zodiac(x.lon); out[p.id] = { lon: x.lon, sign: z.sign, deg: z.deg, text: z.text, retro: x.speed < 0, speed: x.speed, dignity: dignity(p.id, z.sign) }; }
  const ids = Object.keys(out), aspects = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    let d = Math.abs(out[ids[i]].lon - out[ids[j]].lon); if (d > 180) d = 360 - d;
    for (const a of ASPECTS) if (Math.abs(d - a.angle) <= a.orb) { aspects.push({ a: ids[i], b: ids[j], type: a.type, symbol: a.symbol, orb: +Math.abs(d - a.angle).toFixed(1) }); break; }
  }
  return { planets: out, aspects };
}

/** Why it looks the way it does tonight (astronomy). */
export function visibility(p, w) {
  if (p.id !== "moon" && w.elong < (p.id === "mercury" ? 15 : 10)) return { ok: false, why: `too close to the Sun (${Math.round(w.elong)}° away): lost in its glare` };
  if (p.id === "uranus") return { ok: true, why: `magnitude ${w.mag.toFixed(1)}: binoculars show it; sharp eyes under a truly dark sky can just catch it` };
  if (!p.eye) return { ok: true, why: `magnitude ${w.mag.toFixed(1)}: too faint for the eye alone, use binoculars or a small telescope` };
  return { ok: true, why: `magnitude ${w.mag.toFixed(1)}${w.mag < 0 ? ", brighter than almost every star" : ""}` };
}

/** How to pick each one out outdoors. */
export const FIND = {
  moon: "You can't miss it.",
  mercury: "It's low in the twilight glow, near where the Sun went down or will come up. Binoculars help; never sweep them near the Sun itself.",
  venus: "It's the brightest point in the sky after the Moon: people often mistake it for an aircraft's landing light.",
  mars: "Look for a steady orange-red point.",
  jupiter: "Look for a brilliant, steady cream-white point, brighter than any star around it.",
  saturn: "Look for a steady, pale gold point: not dazzling, but it doesn't twinkle much.",
  uranus: "Sweep with binoculars: it looks like a faint star with a slight green-blue tint.",
  neptune: "You'll need binoculars or a small telescope and a dark sky: a faint blue-grey 'star'.",
};
/** Astronomy facts (for the card), three each. */
export const FACTS = {
  moon: ["The Moon is about 384,000 km away; its light reaches us in just over a second.", "It always shows us the same face, because it spins exactly once per orbit.", "It moves about its own width every hour against the stars, all the way round the sky in 27.3 days."],
  mercury: ["Mercury is the smallest planet and the closest to the Sun, circling it every 88 days.", "It never strays more than about 28° from the Sun, so it is only seen low in twilight.", "Its 'retrogrades' happen three or four times a year, as the faster planet overtakes us on the inside lane."],
  venus: ["Venus is the brightest planet: after the Moon, the brightest thing in the night sky.", "Thick clouds of sulphuric acid make it shine, and trap heat: its surface is about 465 °C.", "Through binoculars or a small telescope it shows phases like the Moon, which Galileo used in 1610 to back a Sun-centred system."],
  mars: ["Mars looks red because its surface dust is rich in iron oxide: rust.", "Every 26 months Earth overtakes it; then it is closest, brightest and appears to loop backwards.", "It has the tallest volcano known, Olympus Mons, about 22 km high."],
  jupiter: ["Jupiter is the largest planet: more than 1,300 Earths would fit inside it.", "Binoculars held steady show up to four of its moons, the ones Galileo found in 1610.", "It takes about 12 years to go round the Sun, so it moves roughly one zodiac sign a year."],
  saturn: ["Saturn's rings are mostly ice, hundreds of thousands of km wide but often only tens of metres thick.", "It takes about 29.5 years to circle the Sun, the slowest of the planets the ancients knew.", "It is the farthest planet you can easily see with the naked eye: a steady, pale gold point."],
  uranus: ["Uranus was the first planet discovered with a telescope, by William Herschel in 1781.", "It spins on its side, tipped over by about 98°.", "It shines at about magnitude 5.7: just visible to sharp eyes under a very dark sky, if you know exactly where to look."],
  neptune: ["Neptune was found in 1846 where mathematics predicted it, from the pull it had on Uranus.", "It is never visible to the naked eye; binoculars show it as a faint blue-grey star.", "One year on Neptune lasts about 165 Earth years."],
};
/** Retrograde, explained (astronomy and tradition). */
export const RETRO = {
  sky: "Retrograde is a real effect of perspective: as Earth overtakes an outer planet (or an inner one overtakes us), the planet seems to slide backwards against the stars for a while, tracing a loop. Watch the dotted path.",
  lore: "In astrological tradition a retrograde planet turns its themes inward: a time to review, revise and return rather than to start fresh.",
};

// ---- the store shelf: how the wanderers are marked on the chart ----
export const PKIND = "planets";
export const PSTYLES = [
  { id: "pl-disc", name: "True-colour discs", note: "Each planet in its real colour, sized by brightness", price: 0 },
  { id: "pl-glyph", name: "Astrologer's glyphs", note: "The old symbols beside each one: ☿ ♀ ♂ ♃ ♄, shorthand astronomers and astrologers shared for centuries", price: 70 },
  { id: "pl-halo", name: "Glowing halos", note: "A soft glow that pulses gently, like a planet seen through thin haze", price: 90 },
  { id: "pl-scope", name: "Telescope view", note: "What a small telescope shows: Saturn's rings, Jupiter's belts and the real phases of Venus, Mercury and the Moon", price: 130 },
  { id: "pl-trails", name: "Orbit trails", note: "Every planet you've found draws its path over four months, retrograde loops and all", price: 110 },
];
/** The equipped marker style (prog.planets, set by the store), falling back to the free one. */
export const planetStyleOf = (p) => (PSTYLES.some((t) => t.id === p[PKIND]) && (p[PKIND] === "pl-disc" || (p.owned || []).includes(p[PKIND])) ? p[PKIND] : "pl-disc");
/** Today's tracker progress (prog.stars.pl): planets found today and ever. day is the UTC date. */
export function trackerOf(r, ms = Date.now()) {
  const day = new Date(ms).toISOString().slice(0, 10); r.pl ||= { day, found: [], ever: [], all: "" };
  if (r.pl.day !== day) { r.pl.day = day; r.pl.found = []; } return r.pl;
}
/** Points for a find: new today 10 (+5 with no misses), 2 essence; +5 essence the first time ever; nothing when it was shown, not found. */
export function findReward(pl, id, misses, shown) {
  if (shown) return { xp: 0, essence: 0, first: false, today: false };
  const today = !pl.found.includes(id), first = !pl.ever.includes(id);
  if (today) pl.found.push(id); if (first) pl.ever.push(id);
  return { xp: today ? 10 + (misses ? 0 : 5) : 2, essence: (today ? 2 : 0) + (first ? 5 : 0), first, today };
}
