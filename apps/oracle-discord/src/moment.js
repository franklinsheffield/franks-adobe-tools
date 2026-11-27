// The birth moment: what a careful reader works out from the date, clock time and place before reading anything.
// Clock time -> UTC with the zone rules in force that day (daylight time, war time, pre-standard local mean time),
// then the facts that depend on where the birth happened: true solar time, sunrise and sunset, day or night,
// the seasonal hour, the Moon's phase. Every birth system reads from this one object, so they all agree.
import * as A from "astronomy-engine";
import { timeZoneAt, localToUtc } from "./birthplace.js";

const MIN = 60000, HOUR = 3600000, pad = (n) => String(n).padStart(2, "0");
export const PHASES = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
const MOON_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

/** Offset (minutes, local minus UTC) and short zone name of an IANA zone at a UTC instant. */
function zoneAt(zone, utcMs) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", timeZoneName: "short",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(utcMs));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { offset: Math.round((Date.UTC(+p.year, p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utcMs) / MIN), abbr: p.timeZoneName };
}
export const offsetText = (min) => `UTC${min < 0 ? "−" : "+"}${pad(Math.floor(Math.abs(min) / 60))}:${pad(Math.abs(min) % 60)}`;
const wallOf = (ms) => { const d = new Date(ms); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() }; };
export const hm = (w) => `${pad(w.hour)}:${pad(w.minute)}`;
export const span = (minutes) => { const m = Math.round(Math.abs(minutes)); return m < 60 ? `${m} min` : m < 2880 ? `${Math.floor(m / 60)} h ${pad(m % 60)} min` : `${(m / 1440).toFixed(1)} days`; };

function moonAt(t) {
  const elong = A.MoonPhase(t), lon = A.Ecliptic(A.GeoMoon(t)).elon;
  return { elong, lon, sign: MOON_SIGNS[Math.floor(lon / 30)], phase: PHASES[Math.floor(((elong + 22.5) % 360) / 45)], lit: (1 - Math.cos(elong * Math.PI / 180)) / 2, age: (elong / 360) * 29.530588 };
}

/**
 * Work out the birth moment.
 * birth: { year, month, day, hour, minute } wall clock (use 12:00 when the time is unknown); where: { lat, lon, name }.
 */
export function birthMoment(birth, where, timeKnown = true) {
  const zone = timeZoneAt(where.lat, where.lon), wall = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
  let utc = localToUtc(birth, zone), lmt = false;
  // Before standard time zones the zone's offset is the zone city's local mean time (not a whole quarter hour):
  // use local mean time at the birthplace itself, as astrologers do.
  if (Math.round((wall - utc) / MIN) % 15 !== 0) { utc = new Date(wall - (where.lon / 15) * HOUR); lmt = true; }
  const z = zoneAt(zone, utc.getTime()), skipped = !lmt && z.offset !== Math.round((wall - utc) / MIN);
  const offset = lmt ? Math.round((wall - utc) / MIN) : z.offset;
  const jan = zoneAt(zone, Date.UTC(birth.year, 0, 15)).offset, jul = zoneAt(zone, Date.UTC(birth.year, 6, 15)).offset;
  const standard = Math.min(jan, jul), dst = !lmt && offset > standard;
  // A clock time that happens twice (clocks set back) or never (clocks set forward) that day.
  const later = utc.getTime() + HOUR, repeated = !lmt && !skipped && later + zoneAt(zone, later).offset * MIN === wall;

  const t = A.MakeTime(utc), obs = new A.Observer(where.lat, where.lon, 0);
  // True (apparent) solar time: the Sun's hour angle at the birthplace, so local noon is the Sun on the meridian.
  const ha = A.HourAngle(A.Body.Sun, t, obs), solarH = (ha + 12) % 24, clockH = birth.hour + birth.minute / 60;
  let solarShift = (solarH - clockH) * 60; if (solarShift > 720) solarShift -= 1440; if (solarShift < -720) solarShift += 1440;
  const solar = wallOf(wall + Math.round(solarShift) * MIN);
  const meanShift = where.lon * 4 - offset; // local mean time minus clock time, minutes
  const lst = (((A.SiderealTime(t) + where.lon / 15) % 24) + 24) % 24;

  // Sunrise and sunset around the birth, the Sun's altitude, and the seasonal hour (day and night each cut in twelve).
  const alt = A.Horizon(t, obs, A.Equator(A.Body.Sun, t, obs, true, true).ra, A.Equator(A.Body.Sun, t, obs, true, true).dec, "normal").altitude;
  const ev = (dir, back) => { const r = A.SearchRiseSet(A.Body.Sun, obs, dir, back ? t.AddDays(-1.2) : t, 1.2); if (!r) return null;
    if (!back) return r.date; let last = r; for (;;) { const n = A.SearchRiseSet(A.Body.Sun, obs, dir, last.AddDays(0.01), 1.2); if (!n || n.ut > t.ut) break; last = n; } return last.ut <= t.ut ? last.date : null; };
  const daylight = alt > -0.833, rise0 = ev(+1, true), set0 = ev(-1, true), rise1 = ev(+1, false), set1 = ev(-1, false);
  const from = daylight ? rise0 : set0, to = daylight ? set1 : rise1;
  let seasonal = null;
  if (from && to && to > from) { const f = (utc - from) / (to - from); seasonal = { n: Math.min(12, Math.floor(f * 12) + 1), length: (to - from) / 12 / MIN, of: daylight ? "day" : "night" }; }
  const local = (d) => (d ? wallOf(d.getTime() + zoneAt(zone, d.getTime()).offset * MIN) : null);

  const moon = moonAt(t);
  // Unknown time: what the Moon does across the whole local day.
  const d0 = localToUtc({ ...birth, hour: 0, minute: 0 }, zone), d1 = new Date(d0.getTime() + 24 * HOUR - MIN);
  const moonDay = [moonAt(A.MakeTime(d0)), moonAt(A.MakeTime(d1))];

  return { birth, where, timeKnown, zone, abbr: z.abbr, utc, offset, standard, dst, lmt, skipped, repeated,
    solar, solarShift, meanShift, lst, alt, daylight, sunrise: local(daylight ? rise0 : rise1), sunset: local(daylight ? set1 : set0),
    lastSunrise: rise0, lastSunset: set0, nextSunrise: rise1, nextSunset: set1, seasonal, moon, moonDay };
}

const ord = (n) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4]}`;
export { ord };

/**
 * Data rows describing the birth moment. detail: print the clock time, zone and coordinates (private readings only).
 * Without detail only facts that do not give the birth time or place away are shown.
 */
export function momentRows(m, { detail = false } = {}) {
  const rows = [];
  if (!m.timeKnown) {
    rows.push(["Birth moment", `birth time unknown, so noon is used as the middle of the day. Anything that moves within a day is approximate${detail ? ` (${m.zone}, ${offsetText(m.offset)})` : ""}.`]);
    const [a, b] = m.moonDay;
    rows.push(["Moon that day", `${a.sign === b.sign ? `in ${a.sign} all day` : `moves from ${a.sign} into ${b.sign} during the day, so the Moon sign depends on the hour`} · ${a.phase === b.phase ? a.phase : `${a.phase} turning ${b.phase}`}, ${Math.round(a.lit * 100)} to ${Math.round(b.lit * 100)}% lit`]);
    return rows;
  }
  const zoneLine = m.lmt ? `local mean time (before standard time zones), ${offsetText(m.offset)}` : `${m.abbr} ${offsetText(m.offset)}, ${m.dst ? `daylight time in force (standard is ${offsetText(m.standard)})` : "standard time"}`;
  if (detail) rows.push(["Birth moment", `${pad(m.birth.day)}/${pad(m.birth.month)}/${m.birth.year} ${hm(m.birth)} clock time at ${m.where.lat.toFixed(2)}°, ${m.where.lon.toFixed(2)}° · ${m.zone}: ${zoneLine} · ${pad(m.utc.getUTCDate())}/${pad(m.utc.getUTCMonth() + 1)}/${m.utc.getUTCFullYear()} ${m.utc.toISOString().slice(11, 16)} UTC`]);
  else rows.push(["Birth moment", `clock time converted to UTC with the zone rules in force at the birthplace that day (${m.lmt ? "local mean time, before standard zones" : m.dst ? "daylight time was in force" : "standard time"}). The full conversion is shown in private readings.`]);
  if (m.skipped) rows.push(["Clock check", "that clock time did not exist that day (clocks were set forward). It is read as if the clocks had not yet changed."]);
  if (m.repeated) rows.push(["Clock check", "that clock time happened twice that day (clocks were set back). The first occurrence is used."]);
  rows.push(["True solar time", `${detail ? `${hm(m.solar)}, ` : ""}${Math.abs(m.solarShift) < 1 ? "the same as the clock" : `${span(m.solarShift)} ${m.solarShift > 0 ? "ahead of" : "behind"} the clock`} (the Sun's real position over the birthplace)${detail ? ` · local sidereal time ${pad(Math.floor(m.lst))}:${pad(Math.floor((m.lst % 1) * 60))}` : ""}`]);
  const sun = m.seasonal ? `${ord(m.seasonal.n)} of the 12 ${m.seasonal.of} hours (each ${Math.round(m.seasonal.length)} min long that ${m.seasonal.of})` : "the Sun did not rise or set that day at that latitude";
  rows.push(["Sun", `${m.daylight ? "above" : "below"} the horizon (${m.alt.toFixed(0)}°): a ${m.daylight ? "day" : "night"} birth · ${sun}${detail && m.sunrise && m.sunset ? ` · sunrise ${hm(m.sunrise)}, sunset ${hm(m.sunset)}` : ""}`]);
  rows.push(["Moon at birth", `${m.moon.phase}, ${Math.round(m.moon.lit * 100)}% lit, ${m.moon.age.toFixed(1)} days after new moon · in ${m.moon.sign}`]);
  return rows;
}

/** One method line on how the time was converted. */
export const momentMethod = (m) => (m.timeKnown
  ? "The clock time is converted to UTC with the historical time-zone rules for the birthplace (IANA tz database), including daylight time and, before standard zones, local mean time. True solar time comes from the Sun's hour angle at the birthplace."
  : "No birth time was given. Noon is used, and every result that changes within a day is marked as approximate.");

/**
 * Which day a birth belongs to when the day is not counted from midnight. Returns the civil date, the date if the
 * day begins at sunrise (ancient Egypt), and the date if it begins at sunset (the Gauls, and one reading of the
 * Maya count). Needs a known time and a place where the Sun rose and set that day; otherwise null.
 */
export function dayReckoning(m) {
  if (!m || !m.timeKnown || !m.seasonal) return null;
  const shift = (n) => { const d = new Date(Date.UTC(m.birth.year, m.birth.month - 1, m.birth.day + n)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }; };
  const civil = shift(0), beforeSunrise = !m.daylight && m.birth.hour < 12, afterSunset = !m.daylight && m.birth.hour >= 12;
  return { civil, beforeSunrise, afterSunset, part: m.daylight ? "in daylight" : beforeSunrise ? "at night, before sunrise" : "at night, after sunset",
    fromSunrise: beforeSunrise ? shift(-1) : civil, fromSunset: afterSunset ? shift(1) : civil };
}

/** Shared intake for the date-only systems: an optional time and place give a birth moment; otherwise null. */
export async function optionalMoment(o, birthAt, ctx, geocode) {
  if (!o.place || !String(o.place).trim()) return null;
  const where = ctx.geocoded || await geocode(o.place, ctx.fetch || fetch);
  if (!where) return null; // these systems still work from the date alone
  const timeKnown = !o.time_unknown && !!(o.time && String(o.time).trim());
  return birthMoment(birthAt(timeKnown), where, timeKnown);
}
export const DATE_ONLY_ROW = ["Birth moment", "only the date is used here. With a birth time and place, the reading can also say whether the birth was by day or night and which day it belongs to when days are not counted from midnight."];
