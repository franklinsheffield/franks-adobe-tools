// The Almanac Desk: clients bring jobs astronomers were really paid to do. 3 jobs a day, the same for everyone
// (seeded by the day). Hard jobs need a Plate Room result, so they chain the whole loop: observe -> measure -> deliver.
// Each job: { id, emoji, client, needs?: [target ids, any one], hint?, gen(rnd, place) -> { q, choices, a, why } }.
import { PLACES } from "../stars/tonight.js";
import { room, measured } from "./engine.js";

const DAY = 864e5;
const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
const shuffle = (a, rnd) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
/** A small seeded random (mulberry32), so a day's jobs are the same for everyone. */
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const SAROS_DAYS = 6585.32; // 223 lunar months: about 18 years 11 days 8 hours
/** Real total solar eclipses (time of greatest eclipse, UTC) whose next saros return Level-3 clients ask about. */
export const ECLIPSES = [{ d: "2017-08-21T18:26Z", where: "across the United States" }, { d: "2019-07-02T19:23Z", where: "over Chile and Argentina" }, { d: "2024-04-08T18:17Z", where: "over Mexico, the US and Canada" }];
export const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export const JOBS = [
  { id: "latitude", emoji: "⚓", client: "A ship's navigator", gen(rnd) {
    const port = pick(PLACES.filter((p) => p.lat > 15 && p.lat < 65), rnd), lat = Math.round(port.lat);
    return { q: `"Polaris stands ${lat}° above the sea tonight." How far north is the ship?`, choices: shuffle([`About ${lat}° N`, `About ${90 - lat}° N`, `About ${Math.min(89, lat + 15)}° N`, `About ${Math.max(1, lat - 15)}° N`].filter((v, i, a) => a.indexOf(v) === i), rnd), a: `About ${lat}° N`,
      why: `Polaris sits almost over Earth's North Pole, so its height above the horizon is roughly your latitude. ${lat}° is about the latitude of ${port.name}.` }; } },
  { id: "nile", emoji: "🌾", client: "A farmer by the Nile", gen(rnd) {
    return { q: "Which star, rising just before dawn, tells me the flood is coming?", choices: shuffle(["Sirius", "Vega", "Polaris", "Betelgeuse"], rnd), a: "Sirius",
      why: "In ancient Egypt the first dawn rising of Sirius, which they called Sopdet, came around the start of the Nile's yearly flood." }; } },
  { id: "leap", emoji: "📜", client: "The calendar council", gen(rnd) {
    const y = pick([1700, 1800, 1900, 2000, 2100, 2400, 2028, 2032], rnd), ok = isLeap(y);
    return { q: `Will ${y} have a 29 February?`, choices: ["Yes", "No"], a: ok ? "Yes" : "No",
      why: `The Gregorian rule of 1582: every 4th year is a leap year, but century years only when they divide by 400. So ${y} ${ok ? "is" : "is not"} a leap year.` }; } },
  { id: "longitude", emoji: "🧭", client: "A sea captain", gen(rnd) {
    const h = 1 + Math.floor(rnd() * 8), west = rnd() < 0.5, deg = 15 * h;
    return { q: `"My chronometer keeps Greenwich time. Local noon came when it read ${west ? 12 + h : 12 - h}:00." What is our longitude?`,
      choices: shuffle([`${deg}° ${west ? "W" : "E"}`, `${deg}° ${west ? "E" : "W"}`, `${h}° ${west ? "W" : "E"}`, `${Math.min(180, deg + 15)}° ${west ? "W" : "E"}`], rnd), a: `${deg}° ${west ? "W" : "E"}`,
      why: `Earth turns 15° an hour. Noon ${h} hour${h > 1 ? "s" : ""} ${west ? "after" : "before"} Greenwich puts you ${deg}° ${west ? "west" : "east"}. John Harrison's H4 chronometer made this work at sea on a 1761 voyage.` }; } },
  { id: "sundial", emoji: "🕰️", client: "A clockmaker", gen(rnd) {
    const nov = rnd() < 0.5;
    return nov ? { q: "In early November my sundial reads noon. What does a correct clock say?", choices: ["About 11:44", "Exactly 12:00", "About 12:16", "About 13:00"], a: "About 11:44",
      why: "Around 3 November the sundial runs about 16 minutes ahead of clock time, the most of the year. The gap is the equation of time, from Earth's tilt and its oval orbit." }
      : { q: "In mid-February my sundial reads noon. What does a correct clock say?", choices: ["About 11:46", "Exactly 12:00", "About 12:14", "About 13:00"], a: "About 12:14",
      why: "Around 11 February the sundial runs about 14 minutes behind clock time. The gap is the equation of time, from Earth's tilt and its oval orbit." }; } },
  { id: "metonic", emoji: "🌙", client: "A temple priest", gen(rnd) {
    return { q: "After how many years do the Moon's phases fall on the same dates again?", choices: shuffle(["19", "12", "29", "100"], rnd), a: "19",
      why: "235 lunar months come within about two hours of 19 years: the Metonic cycle, named after Meton of Athens (432 BC). It still sets the date of Easter." }; } },
  { id: "saros", emoji: "👑", client: "A king's astronomer", gen(rnd) {
    const e = pick(ECLIPSES, rnd), t = Date.parse(e.d), next = t + SAROS_DAYS * DAY;
    return { q: `A total eclipse of the Sun fell on ${fmtDate(t)} ${e.where}. When does its saros bring the next one in its series?`,
      choices: shuffle([fmtDate(next), fmtDate(t + 365.25 * 18 * DAY), fmtDate(t + 365.25 * 19 * DAY), fmtDate(t + 365.25 * 11 * DAY)], rnd), a: fmtDate(next),
      why: "Eclipses repeat after a saros: 223 lunar months, about 18 years 11 days 8 hours. The extra 8 hours moves each eclipse about a third of the way round the world." }; } },
  // ---- hard jobs: they need a Plate Room result ----
  { id: "algol", emoji: "👁️", client: "A night watchman", needs: ["algol"], hint: "Measure Algol in the Plate Room first: a star that winks every few days.", gen(rnd) {
    return { q: "\"The Demon Star just faded.\" When will Algol fade again?", choices: shuffle(["In about 2 days 21 hours", "In about 5 days 9 hours", "Tomorrow night", "In about a month"], rnd), a: "In about 2 days 21 hours",
      why: "Algol's dimmer companion passes in front of it every 2 days 20 hours 49 minutes. Its name comes from the Arabic for 'the demon's head'." }; } },
  { id: "cepheid", emoji: "📏", client: "A professor of astronomy", needs: ["delcep"], hint: "Time Delta Cephei's light curve in the Plate Room first.", gen(rnd) {
    return { q: "From its 5.37-day period, how far away is Delta Cephei?", choices: shuffle(["About 890 light-years", "About 9 light-years", "About 89,000 light-years", "About 2.5 million light-years"], rnd), a: "About 890 light-years",
      why: "Leavitt's law (1912): a longer period means a brighter Cepheid. Compare how bright it looks with how bright it is and you get the distance. Space telescopes measure about 890 light-years." }; } },
  { id: "hotter", emoji: "🔥", client: "A curious glassblower", needs: ["rigel", "betelgeuse"], hint: "Sort Rigel or Betelgeuse by spectrum in the Plate Room first.", gen(rnd) {
    return { q: "Which is hotter: blue Rigel or red Betelgeuse?", choices: shuffle(["Rigel", "Betelgeuse", "The same"], rnd), a: "Rigel",
      why: "Like hot glass, stars change colour with heat: Rigel is a B star at over 10,000 K, Betelgeuse an M star under 3,700 K." }; } },
  { id: "comet", emoji: "☄️", client: "A comet hunter", needs: ["m31", "m1", "m42", "m13"], hint: "Measure any Messier object in the Plate Room first.", gen(rnd) {
    return { q: "\"I found a fuzzy patch in Andromeda, but it hasn't moved all week.\" Have I found a comet?", choices: shuffle(["No: it's the Andromeda Galaxy, M31", "Yes: a new comet", "No: it's a planet"], rnd), a: "No: it's the Andromeda Galaxy, M31",
      why: "Comets move against the stars from night to night. Charles Messier listed the fuzzy patches that don't, so comet hunters wouldn't be fooled." }; } },
  { id: "bessel", emoji: "🎓", client: "The Royal Society", needs: ["61cyg"], hint: "Measure 61 Cygni's parallax in the Plate Room first.", gen(rnd) {
    return { q: "Whose distance did Friedrich Bessel measure in 1838, the first star beyond the Sun?", choices: shuffle(["61 Cygni", "Sirius", "Polaris", "Vega"], rnd), a: "61 Cygni",
      why: "Bessel measured 61 Cygni's yearly shift against farther stars: about a third of an arcsecond, which puts it about 11 light-years away." }; } },
];
export const jobById = (id) => JOBS.find((j) => j.id === id) || null;

/** The day's 3 jobs: two open jobs and one hard job, the same for everyone that day. */
export function jobsFor(seed) {
  const r = rng(seed), easy = shuffle(JOBS.filter((j) => !j.needs), r), hard = shuffle(JOBS.filter((j) => j.needs), r);
  return [easy[0], easy[1], hard[0]];
}
export const unlocked = (p, job) => !job.needs || job.needs.some((id) => measured(p, id));
/** The question for a job today (stable for the day: seeded by the day and the job). */
export const questionFor = (job, seed) => job.gen(rng(seed ^ [...job.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)));

/** Today's Desk state for a player: { day, done: [ids] }, reset each day. */
export function deskToday(p, day) { const r = room(p); if (r.jobs.day !== day) r.jobs = { day, done: [] }; return r.jobs; }
export function deliver(p, day, job, ok) {
  const d = deskToday(p, day), r = room(p);
  if (!ok || d.done.includes(job.id)) return { paid: false };
  d.done.push(job.id); r.jobsDone += 1; return { paid: true, hard: !!job.needs };
}
