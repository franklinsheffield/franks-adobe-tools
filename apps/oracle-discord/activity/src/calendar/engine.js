// Calendar Keeper engine: pure date maths for the Maya, Egyptian and Celtic calendars, plus real eclipses and solar
// festival points from astronomy-engine. No DOM here, so tests/calendar.test.js can check every answer.
// Day numbers are Julian Day Numbers (JDN, whole days). Gregorian dates are { year, month, day }.
import * as A from "astronomy-engine";
import { mayaDate, SIGNS, HAAB, GMT } from "../../../src/modules/mayan/calendar.js";
import { coptic } from "../../../src/modules/egyptian/index.js";
import { COPTIC } from "../../../src/modules/egyptian/data.js";

export { SIGNS, HAAB, GMT };
export const mod = (n, m) => ((n % m) + m) % m;
export const DAY = 86400000;
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MON = MONTHS.map((m) => m.slice(0, 3));

/** Gregorian date to JDN (proleptic Gregorian, astronomical years: 1 BCE = 0). */
export function jdnOf({ year, month, day }) {
  const a = Math.floor((14 - month) / 12), y = year + 4800 - a, m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}
/** JDN to a Gregorian date. */
export function dateOf(j) {
  const a = j + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153);
  return { day: e - Math.floor((153 * m + 2) / 5) + 1, month: m + 3 - 12 * Math.floor(m / 10), year: 100 * b + d - 4800 + Math.floor(m / 10) };
}
/** Julian-calendar date to JDN (astronomical years). Historians date events before 1582 in the Julian calendar. */
export function julianJdn({ year, month, day }) {
  const a = Math.floor((14 - month) / 12), y = year + 4800 - a, m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
}
/** JDN to a Julian-calendar date. */
export function julianOf(j) {
  const c = j + 32082, d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor((1461 * d) / 4), m = Math.floor((5 * e + 2) / 153);
  return { day: e - Math.floor((153 * m + 2) / 5) + 1, month: m + 3 - 12 * Math.floor(m / 10), year: d - 4800 + Math.floor(m / 10) };
}
/** "28 May 585 BCE" in the Julian calendar. */
export const GREGORIAN_START = 2299161; // 15 Oct 1582
export const fmtJ = (j, long = false) => { const g = julianOf(j); return `${g.day} ${(long ? MONTHS : MON)[g.month - 1]} ${g.year > 0 ? g.year : `${1 - g.year} BCE`}`; };
/** JDN from a JS Date (UTC calendar day). */
export const jdnOfDate = (dt) => jdnOf({ year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() });
export const utcOf = (j) => { const g = dateOf(j); return new Date(Date.UTC(g.year, g.month - 1, g.day, 12)); };
/** Today's JDN for the viewer's own calendar day. */
export const todayJdn = (now = new Date()) => jdnOf({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
/** "21 Dec 2012" (or with weekday). */
export const fmt = (j, long = false) => { const g = dateOf(j); return `${g.day} ${(long ? MONTHS : MON)[g.month - 1]} ${g.year > 0 ? g.year : `${1 - g.year} BCE`}`; };
export const parseYmd = (s) => { const m = /^(-?\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(String(s || "").trim()); if (!m) return null;
  const g = { year: +m[1], month: +m[2], day: +m[3] }; if (g.month < 1 || g.month > 12 || g.day < 1 || g.day > 31) return null;
  const j = jdnOf(g), back = dateOf(j); return back.month === g.month && back.day === g.day ? j : null; };

// ---------------- Maya ----------------
/** Tzolk'in, Haab' and Long Count for a JDN (GMT correlation 584283, via the Oracle's verified engine). */
export function maya(j) { const m = mayaDate(dateOf(j)); return { ...m, tz: `${m.tone} ${m.signName}`, lc: m.longCount.join(".") }; }
export const tzName = (tone, sign) => `${tone} ${SIGNS[sign]}`;
export const haabName = (day, month) => `${day} ${HAAB[month]}`;
/** Move a Tzolk'in date on by n days. */
export const tzAdd = (tone, sign, n) => ({ tone: mod(tone - 1 + n, 13) + 1, sign: mod(sign + n, 20) });
/** Move a Haab' date on by n days (month 18 = Wayeb', 5 days). */
export function haabAdd(day, month, n) { const p = mod(month * 20 + day + n, 365); return { day: p % 20, month: Math.floor(p / 20) }; }
/** Next JDN (after `from`, or on it if `inclusive`) when the Haab' reads day/month. */
export function nextHaab(from, day, month, inclusive = false) {
  const h = maya(from).haab, now = h.month * 20 + h.day, want = month * 20 + day;
  const d = mod(want - now, 365); return from + (d === 0 && !inclusive ? 365 : d);
}
export const CALENDAR_ROUND = 18980; // lcm(260, 365) = 52 Haab' years = 73 Tzolk'in rounds
export const LC_UNITS = [["b'ak'tun", 144000], ["k'atun", 7200], ["tun", 360], ["winal", 20], ["k'in", 1]];

// ---------------- Egypt ----------------
// The ancient civil ("wandering") year: 12 months of 30 days in three seasons, then 5 epagomenal days, never a leap
// day. Counted here from the Era of Nabonassar used by Ptolemy: 1 Thoth of year 1 = 26 Feb 747 BCE (Julian) = JDN 1448638.
// Check: Censorinus says 1 Thoth fell on 25 June in 238 CE (Julian); this count agrees (tests).
export const NABONASSAR = 1448638;
export const EGY_MONTHS = ["Thoth", "Phaophi", "Athyr", "Choiak", "Tybi", "Mechir", "Phamenoth", "Pharmuthi", "Pachons", "Payni", "Epiphi", "Mesore", "the Epagomenal days"];
export const EGY_SEASON = ["Akhet", "Akhet", "Akhet", "Akhet", "Peret", "Peret", "Peret", "Peret", "Shemu", "Shemu", "Shemu", "Shemu", "Heriu-renpet"];
export const EPAGOMENAL_GODS = ["Osiris", "Horus", "Set", "Isis", "Nephthys"];
/** Ancient Egyptian civil date: { month 0-12, day 1-30 (1-5 for epagomenal), doy 0-364, season, name }. */
export function egyptCivil(j) {
  const d = j - NABONASSAR, doy = mod(d, 365), month = Math.min(12, Math.floor(doy / 30)), day = doy - month * 30 + 1;
  const name = month === 12 ? `epagomenal day ${day} (birthday of ${EPAGOMENAL_GODS[day - 1]})` : `${day} ${EGY_MONTHS[month]}`;
  return { year: Math.floor(d / 365) + 1, month, day, doy, season: EGY_SEASON[month], name, short: month === 12 ? `epagomenal ${day}` : name };
}
/** Add n days to a civil date (month 0-12, day 1-30). */
export function egyAdd(month, day, n) { const doy = mod(month * 30 + day - 1 + n, 365), m = Math.min(12, Math.floor(doy / 30)); return { month: m, day: doy - m * 30 + 1 }; }
export const egyName = (month, day) => (month === 12 ? `epagomenal day ${day}` : `${day} ${EGY_MONTHS[month]}`);
/** Next 1 Thoth (Wepet Renpet, New Year) of the wandering year, strictly after `from`. */
export const nextThoth = (from) => from + (365 - egyptCivil(from).doy);
/** Coptic (Alexandrian) date: the same months, fixed to the sun by Augustus's leap day. */
export function copticOf(j) { const c = coptic(dateOf(j)); return { ...c, text: c.month === 13 ? `${c.day} Pi Kogi Enavot` : `${c.day} ${c.name}` }; }
/** Next Coptic New Year, Nayrouz (1 Thout), strictly after `from`. */
export function nextNayrouz(from) { for (let j = from + 1; j < from + 400; j++) { const c = copticOf(j); if (c.month === 1 && c.day === 1) return j; } return null; }
export { COPTIC };

// ---------------- Celtic ----------------
// Fixed festival dates as kept in Ireland today (each begins at sunset the evening before), and the astronomical
// cross-quarter point where the Sun reaches the ecliptic longitude halfway between a solstice and an equinox.
export const FESTIVALS = [
  { id: "imbolc", name: "Imbolc", month: 2, day: 1, lon: 315, between: "the winter solstice and the spring equinox", marks: "the first signs of spring and the lambing season; later the feast of St Brigid" },
  { id: "beltane", name: "Bealtaine (Beltane)", month: 5, day: 1, lon: 45, between: "the spring equinox and the summer solstice", marks: "the start of summer, when cattle were driven between bonfires and out to summer pasture" },
  { id: "lughnasadh", name: "Lughnasadh", month: 8, day: 1, lon: 135, between: "the summer solstice and the autumn equinox", marks: "the start of the harvest, with fairs and games linked to the god Lugh" },
  { id: "samhain", name: "Samhain", month: 11, day: 1, lon: 225, between: "the autumn equinox and the winter solstice", marks: "the end of summer and the start of the dark half of the year, when herds came home" },
];
const jdOfTime = (t) => Math.floor(t.ut + 2451545.0 + 0.5); // AstroTime.ut is days since 2000-01-01 12:00 UT
/** Next fixed-date festival on or after `from`: { f, jdn } (the eve is jdn - 1). */
export function nextFestival(from) {
  let best = null;
  for (const f of FESTIVALS) for (const y of [dateOf(from).year, dateOf(from).year + 1]) {
    const j = jdnOf({ year: y, month: f.month, day: f.day }); if (j >= from && (!best || j < best.jdn)) best = { f, jdn: j };
  }
  return best;
}
/** UT calendar day (JDN) when the Sun reaches ecliptic longitude `lon`, searching forward from JDN `from`. */
export function sunAt(lon, from) { const t = A.SearchSunLongitude(lon, utcOf(from - 1), 380); return t ? jdOfTime(t) : null; }
/** The Sun's ecliptic longitude (degrees) at noon UT of a JDN: where it stands on the wheel of the year. */
export const sunLon = (j) => A.SunPosition(utcOf(j)).elon;
/** Moon phase angle 0-360 (0 new, 180 full) at noon UT. */
export const moonPhase = (j) => A.MoonPhase(utcOf(j));

// ---------------- Eclipses ----------------
export const SYNODIC = 29.530589; // days in a lunar month
export const SAROS = 6585.3211; // 223 lunar months: about 18 years 11 days 8 hours
export const ECLIPSE_YEAR = 346.62; // the Sun returns to the same node of the Moon's orbit
const solarInfo = (e) => ({ type: "solar", kind: e.kind, jdn: jdOfTime(e.peak), date: e.peak.date, lat: e.latitude, lon: e.longitude });
const lunarInfo = (e) => ({ type: "lunar", kind: e.kind, jdn: jdOfTime(e.peak), date: e.peak.date });
/** First solar eclipse (anywhere on Earth) after JDN `from`. */
export const nextSolar = (from) => solarInfo(A.SearchGlobalSolarEclipse(utcOf(from)));
/** First lunar eclipse after JDN `from` (penumbral ones included unless `visible`). */
export function nextLunar(from, visible = false) {
  let e = A.SearchLunarEclipse(utcOf(from));
  while (visible && e.kind === "penumbral") e = A.NextLunarEclipse(e.peak);
  return lunarInfo(e);
}
/** The next eclipse of either type after `from`. */
export function nextEclipse(from, visible = true) { const s = nextSolar(from), l = nextLunar(from, visible); return s.jdn <= l.jdn ? s : l; }
/** The eclipse one Saros after `e`, found by searching just before the predicted day (it lands within a day). */
export function sarosAfter(e) {
  const at = e.jdn + Math.round(SAROS) - 3;
  return e.type === "solar" ? nextSolar(at) : nextLunar(at);
}
/** Real solar (or lunar) eclipses between two JDNs. */
export function eclipsesBetween(type, a, b, visible = true) {
  const out = []; let e = type === "solar" ? nextSolar(a) : nextLunar(a, visible);
  while (e.jdn < b) { out.push(e); e = type === "solar" ? nextSolar(e.jdn + 1) : nextLunar(e.jdn + 1, visible); }
  return out;
}
export const KIND = { total: "total", annular: "annular", partial: "partial", hybrid: "hybrid", penumbral: "penumbral" };
export const eclipseName = (e) => `${e.kind} ${e.type} eclipse`;
/** Plain-English longitude, e.g. "104°W". */
export const lonText = (x) => `${Math.abs(Math.round(x))}°${x < 0 ? "W" : "E"}`;

/** Everything the Keeper's desk shows for one day. */
export function desk(j) {
  const m = maya(j), e = egyptCivil(j), c = copticOf(j), nf = nextFestival(j);
  return { jdn: j, date: fmt(j, true), maya: m, egypt: e, coptic: c, festival: nf, sun: sunLon(j), moon: moonPhase(j) };
}
