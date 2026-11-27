// Eclipse Chaser: pure logic (no DOM). The Observatory's third new game; real eclipses from Astronomy Engine.
// Level 1 Line them up: from where the Moon is (phase, height above Earth's orbit, near or far), say what happens.
// Level 2 The nodes: of four real new (or full) Moons in a year, pick the one that really makes an eclipse.
// Level 3 Saros and paths: real eclipses ahead: their kind, their saros return, where totality is longest.
// Progress: prog.rooms.eclipse = { plays, best: { level: stars }, cleared: [levels] }.
import * as A from "astronomy-engine";

export const ROOM = "eclipse";
export const room = (p) => { const r = ((p.rooms ||= {})[ROOM] ||= { plays: 0, best: {}, cleared: [] }); r.best ||= {}; r.cleared ||= []; return r; };
export const ROUNDS = 5, PASS = 3, SAROS_DAYS = 6585.32, TILT = 5.14;
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const DAY = 864e5;
export const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// ---- Level 1: line them up ----
export const PHASES = { 0: "New Moon", 45: "Waxing crescent", 90: "First quarter", 135: "Waxing gibbous", 180: "Full Moon", 225: "Waning gibbous", 270: "Last quarter", 315: "Waning crescent" };
export const OUTCOMES = ["Total solar eclipse", "Annular solar eclipse", "Total lunar eclipse", "No eclipse"];
/** What really happens for a Moon at phase angle `ph` (0 new, 180 full), `lat` degrees above Earth's orbit, near (perigee) or far. */
export function outcome({ ph, lat, near }) {
  if (ph === 0 && Math.abs(lat) < 1) return near ? "Total solar eclipse" : "Annular solar eclipse";
  if (ph === 180 && Math.abs(lat) < 0.4) return "Total lunar eclipse";
  return "No eclipse";
}
export function why({ ph, lat, near }) {
  const o = outcome({ ph, lat, near });
  if (o === "Total solar eclipse") return "A New Moon right on Earth's orbital plane, and near perigee: its disc looks bigger than the Sun's and covers it completely.";
  if (o === "Annular solar eclipse") return "A New Moon on the plane, but near apogee: it looks a little smaller than the Sun, so a ring of Sun shows round it.";
  if (o === "Total lunar eclipse") return "A Full Moon right on the plane passes through Earth's shadow and turns coppery red with sunlight bent through our atmosphere.";
  if (ph !== 0 && ph !== 180) return `${PHASES[ph]}: Sun, Earth and Moon aren't in a line, so nothing can be eclipsed.`;
  return `The Moon is ${Math.abs(lat).toFixed(1)}° ${lat > 0 ? "above" : "below"} Earth's orbital plane, so its shadow (or ours) misses. Its orbit is tilted about 5°, which is why there isn't an eclipse every month.`;
}
export function lineUp(seed) {
  const r = rng(seed * 2654435761), roll = r();
  const ph = roll < 0.35 ? 0 : roll < 0.65 ? 180 : [45, 90, 135, 225, 270, 315][Math.floor(r() * 6)];
  const onPlane = r() < 0.65, lat = +((onPlane ? (r() - 0.5) * 0.5 : (r() < 0.5 ? -1 : 1) * (1.8 + r() * 3.2))).toFixed(1), near = r() < 0.5;
  const cfg = { ph, lat, near };
  return { cfg, choices: OUTCOMES, a: outcome(cfg), why: why(cfg) };
}

// ---- real eclipses (Astronomy Engine) ----
const cache = {};
/** Real solar eclipses from `from` to `to` (years): [{ ms, kind, lat, lon }]. */
export function solarEclipses(from = 2026, to = 2045) {
  const k = `s${from}-${to}`; if (cache[k]) return cache[k];
  const out = []; let e = A.SearchGlobalSolarEclipse(A.MakeTime(new Date(Date.UTC(from, 0, 1))));
  while (e.peak.date.getUTCFullYear() <= to) { out.push({ ms: e.peak.date.getTime(), kind: e.kind, lat: e.latitude, lon: e.longitude }); e = A.NextGlobalSolarEclipse(e.peak); }
  return (cache[k] = out);
}
export function lunarEclipses(from = 2026, to = 2045) {
  const k = `l${from}-${to}`; if (cache[k]) return cache[k];
  const out = []; let e = A.SearchLunarEclipse(new Date(Date.UTC(from, 0, 1)));
  while (e.peak.date.getUTCFullYear() <= to) { out.push({ ms: e.peak.date.getTime(), kind: e.kind }); e = A.NextLunarEclipse(e.peak); }
  return (cache[k] = out);
}
/** Every New (deg 0) or Full (deg 180) Moon in a year, with the Moon's height above Earth's orbital plane (ecliptic latitude). */
export function moonsOf(year, deg) {
  const out = []; let t = A.MakeTime(new Date(Date.UTC(year, 0, 1)));
  for (;;) { const m = A.SearchMoonPhase(deg, t, 40); if (!m || m.date.getUTCFullYear() > year) break; out.push({ ms: m.date.getTime(), lat: A.EclipticGeoMoon(m).lat }); t = m.AddDays(20); }
  return out;
}

// ---- Level 2: the nodes ----
/** Four real New (solar) or Full (lunar) Moons of a year; exactly one makes an eclipse. Penumbral lunar eclipses are left out. */
export function nodeRound(seed) {
  const r = rng(seed * 2654435761), solar = r() < 0.5, year = 2026 + Math.floor(r() * 12);
  const ecl = (solar ? solarEclipses(year, year) : lunarEclipses(year, year)), near = (ms, list) => list.find((e) => Math.abs(e.ms - ms) < 2 * DAY);
  const moons = moonsOf(year, solar ? 0 : 180).map((m) => ({ ...m, e: near(m.ms, ecl) }));
  const hits = moons.filter((m) => m.e && (solar || m.e.kind !== "penumbral")), misses = moons.filter((m) => !m.e);
  if (!hits.length || misses.length < 3) return nodeRound((seed * 31 + 7) >>> 0);
  const hit = hits[Math.floor(r() * hits.length)], opts = shuffle([hit, ...shuffle(misses, r).slice(0, 3)], r).sort((a, b) => a.ms - b.ms);
  return { solar, year, opts: opts.map((m) => ({ date: fmtDate(m.ms), ms: m.ms, lat: +m.lat.toFixed(2) })), a: fmtDate(hit.ms), kind: hit.e.kind,
    why: `On ${fmtDate(hit.ms)} the ${solar ? "New" : "Full"} Moon was only ${Math.abs(hit.lat).toFixed(2)}° from Earth's orbital plane, close to a node, so it made a ${hit.e.kind} ${solar ? "solar" : "lunar"} eclipse. The others were too far above or below.` };
}

// ---- Level 3: saros and paths ----
export const LUXOR = { ms: Date.parse("2027-08-02T10:07:00Z"), q: "The total eclipse of 2 August 2027 crosses Spain, North Africa and Egypt. Where is totality longest?",
  choices: ["Luxor, Egypt", "Seville, Spain", "Tunis, Tunisia", "Jeddah, Saudi Arabia"], a: "Luxor, Egypt",
  why: "Near Luxor the Moon covers the Sun for about 6 minutes 23 seconds, the longest totality seen from land between 1991 and 2114." };
export const SHIFT = { q: "A saros is 6,585⅓ days. The extra third of a day moves each return's path round the world. Which way, and how far?",
  choices: ["About 120° west", "About 120° east", "It lands in the same place", "About 8° north"], a: "About 120° west",
  why: "In the extra 8 hours the Earth turns about 120° eastward, so the shadow lands about 120° further west. After three saroses (about 54 years and a month, the exeligmos) it comes back near the same longitude." };
export function sarosRound(seed) {
  const r = rng(seed * 2654435761), list = solarEclipses(2026, 2045), type = r();
  if (type < 0.15) return { ...SHIFT };
  if (type < 0.3) return { ...LUXOR };
  const e = list[Math.floor(r() * list.length)];
  if (type < 0.6) return { q: `What kind of solar eclipse falls on ${fmtDate(e.ms)}?`, choices: ["total", "annular", "partial"], a: e.kind,
    why: e.kind === "partial" ? "Only partial: the Moon's central shadow misses Earth entirely, passing above or below the pole." : e.kind === "total" ? "Total: the Moon is near enough to cover the Sun completely somewhere on Earth." : "Annular: the Moon is too far away to cover the Sun, so a ring of fire shows." };
  const next = e.ms + SAROS_DAYS * DAY;
  return { q: `A ${e.kind} eclipse of the Sun falls on ${fmtDate(e.ms)}. One saros later, when does its series bring the next one?`,
    choices: shuffle([fmtDate(next), fmtDate(e.ms + 365.25 * 18 * DAY), fmtDate(e.ms + 365.25 * 19 * DAY), fmtDate(e.ms + 365.25 * 11 * DAY)], r), a: fmtDate(next), next,
    why: "A saros is 223 lunar months, 6,585⅓ days: about 18 years 11 days 8 hours. After it, Sun, Moon and node line up almost exactly as before. Babylonian astronomers used it to predict eclipses." };
}

export const roundOf = (level, seed) => (level === 1 ? lineUp(seed) : level === 2 ? nodeRound(seed) : sarosRound(seed));
export const starsFor = (tries) => (tries <= 1 ? 3 : tries === 2 ? 2 : 1);
export const isOpen = (p, level) => level === 1 || room(p).cleared.includes(level - 1);
export function settleRun(p, level, results) {
  const r = room(p), right = results.filter((x) => x > 0).length, stars = results.reduce((a, b) => a + b, 0), won = right >= PASS, perfect = results.every((x) => x === 3);
  const first = won && !r.cleared.includes(level); if (first) r.cleared.push(level); r.best[level] = Math.max(r.best[level] || 0, stars); r.plays += 1;
  return { won, perfect, first, stars, right };
}
/** The next real solar eclipse after a time: { ms, kind, lat, lon }. */
export function nextSolar(ms = Date.now()) { const e = A.SearchGlobalSolarEclipse(A.MakeTime(new Date(ms))); return { ms: e.peak.date.getTime(), kind: e.kind, lat: e.latitude, lon: e.longitude }; }
