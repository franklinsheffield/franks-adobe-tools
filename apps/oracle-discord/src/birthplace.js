// Birth place -> lat/lon + IANA time zone, and local birth time -> UTC (historical DST via Intl tz data).
import tzlookup from "tz-lookup";

/** Geocode a place name with OpenStreetMap Nominatim. Returns { lat, lon, name } or null. */
export async function geocode(place, fetchImpl = fetch) {
  const m = String(place).trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (m) return { lat: +m[1], lon: +m[2], name: `${m[1]}, ${m[2]}` };
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodeURIComponent(place);
  const r = await fetchImpl(url, { headers: { "user-agent": "science-is-magic-oracle/0.1", "accept-language": "en" } });
  if (!r.ok) throw new Error("geocoder HTTP " + r.status);
  const [hit] = await r.json();
  return hit ? { lat: +hit.lat, lon: +hit.lon, name: hit.display_name } : null;
}

export const timeZoneAt = (lat, lon) => tzlookup(lat, lon);

// Offset (minutes, local minus UTC) of an IANA zone at a UTC instant.
function offsetAt(zone, utcMs) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  return (Date.UTC(+p.year, p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utcMs) / 60000;
}

/** Local wall-clock time in `zone` -> UTC Date. Ambiguous (DST fall-back) times take the first occurrence. */
export function localToUtc({ year, month, day, hour = 12, minute = 0 }, zone) {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let t = wall - offsetAt(zone, wall) * 60000;
  t = wall - offsetAt(zone, t) * 60000;
  const earlier = wall - offsetAt(zone, t - 3 * 3600000) * 60000; // DST fold: prefer the earlier instant
  if (earlier < t && Math.round((earlier + offsetAt(zone, earlier) * 60000) / 60000) === Math.round(wall / 60000)) t = earlier;
  return new Date(t);
}

/** Parse "1990-04-09" and "14:30" / "2:30 pm". */
export function parseBirth(dateStr, timeStr) {
  const d = String(dateStr).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!d) throw new Error("Date must look like 1990-04-09 (year-month-day).");
  const t = String(timeStr || "").trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!t) throw new Error("Time must look like 14:30 or 2:30 pm.");
  let hour = +t[1]; const minute = +(t[2] || 0);
  if (t[3] === "pm" && hour < 12) hour += 12;
  if (t[3] === "am" && hour === 12) hour = 0;
  const v = { year: +d[1], month: +d[2], day: +d[3], hour, minute };
  if (v.month < 1 || v.month > 12 || v.day < 1 || v.day > 31 || hour > 23 || minute > 59) throw new Error("That date or time isn't valid.");
  if (v.year < 1800 || v.year > 2100) throw new Error("Birth year must be between 1800 and 2100.");
  return v;
}
