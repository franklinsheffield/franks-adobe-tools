// Tonight's real sky for Star Lore Navigator: where the stars are right now from the player's place on Earth.
// Low-precision astronomy (good to a fraction of a degree, plenty for naked-eye stargazing): the Sun's position,
// sidereal time, altitude/azimuth, rising and setting. Pure functions, no DOM, so tests can check them.
// The sky is drawn in a horizon frame: [360 − azimuth, altitude], so the zenith is "up" and, facing south, east is on the left.
import { centroid } from "./engine.js";

const D = Math.PI / 180, DAY = 864e5;
const norm = (x) => ((x % 360) + 360) % 360;
const days = (ms) => ms / DAY + 2440587.5 - 2451545; // days since J2000.0

/** The Sun's RA and Dec (degrees) at a time (ms). */
export function sunRaDec(ms) {
  const d = days(ms), g = (357.528 + 0.9856003 * d) * D, L = 280.46 + 0.9856474 * d;
  const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D, eps = (23.439 - 4e-7 * d) * D;
  return [norm(Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / D), Math.asin(Math.sin(eps) * Math.sin(lam)) / D];
}
/** Greenwich mean sidereal time, degrees. */
export const gmst = (ms) => norm(280.46061837 + 360.98564736629 * days(ms));
/** Local sidereal time, degrees (longitude east positive). */
export const lst = (ms, lon) => norm(gmst(ms) + lon);
/** Altitude and azimuth (degrees; azimuth from north through east) of an RA/Dec point. */
export function altAz(ra, de, lat, LST) {
  const H = (LST - ra) * D, d = de * D, p = lat * D;
  const alt = Math.asin(Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(H));
  return [norm(az / D), alt / D];
}
/** The horizon frame the sky is drawn in: [360 − az, alt]. */
export function frame(place, ms) {
  const L = lst(ms, place.lon);
  return (ra, de) => { const [az, alt] = altAz(ra, de, place.lat, L); return [norm(360 - az), alt]; };
}
export const sunAlt = (place, ms) => { const [r, d] = sunRaDec(ms); return altAz(r, d, place.lat, lst(ms, place.lon))[1]; };
const DARK = -12; // nautical twilight: dark enough for the constellations

/** The night to show: { start, end, at } in ms. "at" is now if it's dark, otherwise when tonight gets dark. */
export function nightOf(place, now = Date.now()) {
  const step = 10 * 60e3; let s = now;
  if (sunAlt(place, now) > DARK) { s = null; for (let t = now; t < now + DAY; t += step) if (sunAlt(place, t) <= DARK) { s = t; break; } }
  else for (let t = now; t > now - DAY / 2; t -= step) { if (sunAlt(place, t) > DARK) break; s = t; }
  if (s == null) { // midsummer near the poles: never properly dark, so use the darkest hour
    let best = now, low = 99; for (let t = now; t < now + DAY; t += step) { const a = sunAlt(place, t); if (a < low) { low = a; best = t; } }
    return { start: best - 2 * 36e5, end: best + 2 * 36e5, at: best, bright: true };
  }
  let e = s; for (let t = s; t < s + DAY; t += step) { if (sunAlt(place, t) > DARK) break; e = t; }
  return { start: s, end: e, at: now >= s && now <= e ? now : Math.min(e, s + 30 * 60e3) };
}
/** Rising and setting around a time: { always } (never sets), { never } (never rises), or { rise, set, transit } (ms, the ones nearest "at"). */
export function riseSet(ra, de, place, at) {
  const p = place.lat * D, d = de * D, h0 = -0.57 * D;
  const c = (Math.sin(h0) - Math.sin(p) * Math.sin(d)) / (Math.cos(p) * Math.cos(d));
  if (c < -1) return { always: true }; if (c > 1) return { never: true };
  const H0 = Math.acos(c) / D, sid = DAY / 1.00273790935, L = lst(at, place.lon);
  const when = (target) => { let dh = norm(target - L); if (dh > 180) dh -= 360; return at + (dh / 360) * sid; };
  const transit = when(ra); let rise = when(ra - H0), set = when(ra + H0);
  if (rise > transit) rise -= sid; if (set < transit) set += sid;
  return { rise, set, transit };
}
const POINTS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
/** "south-east" for an azimuth. */
export const compass = (az) => POINTS[Math.round(norm(az) / 45) % 8];

/** Constellations up tonight: [{ g, az, alt }] with the figure's centre at least minAlt up and every star above the horizon, highest first. */
export function upTonight(deck, pointsOf, place, ms, minAlt = 25) {
  const L = lst(ms, place.lon), out = [];
  for (const g of deck) {
    const stars = pointsOf(g), [ra, de] = centroid(stars), [az, alt] = altAz(ra, de, place.lat, L);
    const low = Math.min(...stars.map((s) => altAz(s[0], s[1], place.lat, L)[1]));
    if (alt >= minAlt && low > 3) out.push({ g, az, alt });
  }
  return out.sort((a, b) => b.alt - a.alt);
}

/** Where the player is: a city per common time zone, so the sky is right without asking for location. */
export const PLACES = [
  { name: "Phoenix", tz: "America/Phoenix", lat: 33.45, lon: -112.07 }, { name: "Los Angeles", tz: "America/Los_Angeles", lat: 34.05, lon: -118.24 },
  { name: "Denver", tz: "America/Denver", lat: 39.74, lon: -104.99 }, { name: "Chicago", tz: "America/Chicago", lat: 41.88, lon: -87.63 },
  { name: "New York", tz: "America/New_York", lat: 40.71, lon: -74.01 }, { name: "Toronto", tz: "America/Toronto", lat: 43.65, lon: -79.38 },
  { name: "Vancouver", tz: "America/Vancouver", lat: 49.28, lon: -123.12 }, { name: "Anchorage", tz: "America/Anchorage", lat: 61.22, lon: -149.9 },
  { name: "Honolulu", tz: "Pacific/Honolulu", lat: 21.31, lon: -157.86 }, { name: "Mexico City", tz: "America/Mexico_City", lat: 19.43, lon: -99.13 },
  { name: "Bogotá", tz: "America/Bogota", lat: 4.71, lon: -74.07 }, { name: "Lima", tz: "America/Lima", lat: -12.05, lon: -77.04 },
  { name: "São Paulo", tz: "America/Sao_Paulo", lat: -23.55, lon: -46.63 }, { name: "Buenos Aires", tz: "America/Argentina/Buenos_Aires", lat: -34.6, lon: -58.38 },
  { name: "Santiago", tz: "America/Santiago", lat: -33.45, lon: -70.67 }, { name: "Reykjavík", tz: "Atlantic/Reykjavik", lat: 64.15, lon: -21.94 },
  { name: "London", tz: "Europe/London", lat: 51.51, lon: -0.13 }, { name: "Dublin", tz: "Europe/Dublin", lat: 53.35, lon: -6.26 },
  { name: "Paris", tz: "Europe/Paris", lat: 48.86, lon: 2.35 }, { name: "Madrid", tz: "Europe/Madrid", lat: 40.42, lon: -3.7 },
  { name: "Berlin", tz: "Europe/Berlin", lat: 52.52, lon: 13.4 }, { name: "Rome", tz: "Europe/Rome", lat: 41.9, lon: 12.5 },
  { name: "Stockholm", tz: "Europe/Stockholm", lat: 59.33, lon: 18.07 }, { name: "Athens", tz: "Europe/Athens", lat: 37.98, lon: 23.73 },
  { name: "Istanbul", tz: "Europe/Istanbul", lat: 41.01, lon: 28.98 }, { name: "Moscow", tz: "Europe/Moscow", lat: 55.76, lon: 37.62 },
  { name: "Cairo", tz: "Africa/Cairo", lat: 30.04, lon: 31.24 }, { name: "Lagos", tz: "Africa/Lagos", lat: 6.52, lon: 3.38 },
  { name: "Nairobi", tz: "Africa/Nairobi", lat: -1.29, lon: 36.82 }, { name: "Johannesburg", tz: "Africa/Johannesburg", lat: -26.2, lon: 28.05 },
  { name: "Dubai", tz: "Asia/Dubai", lat: 25.2, lon: 55.27 }, { name: "Mumbai", tz: "Asia/Kolkata", lat: 19.08, lon: 72.88 },
  { name: "Bangkok", tz: "Asia/Bangkok", lat: 13.76, lon: 100.5 }, { name: "Singapore", tz: "Asia/Singapore", lat: 1.35, lon: 103.82 },
  { name: "Manila", tz: "Asia/Manila", lat: 14.6, lon: 120.98 }, { name: "Hong Kong", tz: "Asia/Hong_Kong", lat: 22.32, lon: 114.17 },
  { name: "Shanghai", tz: "Asia/Shanghai", lat: 31.23, lon: 121.47 }, { name: "Seoul", tz: "Asia/Seoul", lat: 37.57, lon: 126.98 },
  { name: "Tokyo", tz: "Asia/Tokyo", lat: 35.68, lon: 139.69 }, { name: "Perth", tz: "Australia/Perth", lat: -31.95, lon: 115.86 },
  { name: "Sydney", tz: "Australia/Sydney", lat: -33.87, lon: 151.21 }, { name: "Auckland", tz: "Pacific/Auckland", lat: -36.85, lon: 174.76 },
  // more cities (2026-11-27): the player picks the nearest one, close enough for the sky and nothing more personal
  { name: "Seattle", tz: "America/Los_Angeles", lat: 47.61, lon: -122.33 }, { name: "San Francisco", tz: "America/Los_Angeles", lat: 37.77, lon: -122.42 },
  { name: "Dallas", tz: "America/Chicago", lat: 32.78, lon: -96.8 }, { name: "Houston", tz: "America/Chicago", lat: 29.76, lon: -95.37 },
  { name: "Atlanta", tz: "America/New_York", lat: 33.75, lon: -84.39 }, { name: "Miami", tz: "America/New_York", lat: 25.76, lon: -80.19 },
  { name: "Boston", tz: "America/New_York", lat: 42.36, lon: -71.06 }, { name: "Montreal", tz: "America/Toronto", lat: 45.5, lon: -73.57 },
  { name: "Halifax", tz: "America/Halifax", lat: 44.65, lon: -63.57 }, { name: "Caracas", tz: "America/Caracas", lat: 10.48, lon: -66.9 },
  { name: "Rio de Janeiro", tz: "America/Sao_Paulo", lat: -22.91, lon: -43.17 }, { name: "Lisbon", tz: "Europe/Lisbon", lat: 38.72, lon: -9.14 },
  { name: "Edinburgh", tz: "Europe/London", lat: 55.95, lon: -3.19 }, { name: "Amsterdam", tz: "Europe/Amsterdam", lat: 52.37, lon: 4.9 },
  { name: "Oslo", tz: "Europe/Oslo", lat: 59.91, lon: 10.75 }, { name: "Helsinki", tz: "Europe/Helsinki", lat: 60.17, lon: 24.94 },
  { name: "Warsaw", tz: "Europe/Warsaw", lat: 52.23, lon: 21.01 }, { name: "Kyiv", tz: "Europe/Kiev", lat: 50.45, lon: 30.52 },
  { name: "Tel Aviv", tz: "Asia/Jerusalem", lat: 32.09, lon: 34.78 }, { name: "Riyadh", tz: "Asia/Riyadh", lat: 24.71, lon: 46.68 },
  { name: "Tehran", tz: "Asia/Tehran", lat: 35.69, lon: 51.39 }, { name: "Karachi", tz: "Asia/Karachi", lat: 24.86, lon: 67.01 },
  { name: "Delhi", tz: "Asia/Kolkata", lat: 28.61, lon: 77.21 }, { name: "Kathmandu", tz: "Asia/Kathmandu", lat: 27.72, lon: 85.32 },
  { name: "Dhaka", tz: "Asia/Dhaka", lat: 23.81, lon: 90.41 }, { name: "Jakarta", tz: "Asia/Jakarta", lat: -6.21, lon: 106.85 },
  { name: "Kuala Lumpur", tz: "Asia/Kuala_Lumpur", lat: 3.14, lon: 101.69 }, { name: "Taipei", tz: "Asia/Taipei", lat: 25.03, lon: 121.57 },
  { name: "Beijing", tz: "Asia/Shanghai", lat: 39.9, lon: 116.4 }, { name: "Brisbane", tz: "Australia/Brisbane", lat: -27.47, lon: 153.03 },
  { name: "Melbourne", tz: "Australia/Melbourne", lat: -37.81, lon: 144.96 }, { name: "Cape Town", tz: "Africa/Johannesburg", lat: -33.92, lon: 18.42 },
  { name: "Accra", tz: "Africa/Accra", lat: 5.6, lon: -0.19 }, { name: "Addis Ababa", tz: "Africa/Addis_Ababa", lat: 9.03, lon: 38.74 },
  { name: "Casablanca", tz: "Africa/Casablanca", lat: 33.57, lon: -7.59 },
];
/** A saved place, kept only if it is one of the cities (older saves could hold a precise "Your location": that is dropped). */
export const cityOf = (p) => (p && PLACES.find((x) => x.name === p.name)) || null;
/** The city for a time zone (exact, then same region, then London). */
export function placeForZone(tz) {
  return PLACES.find((p) => p.tz === tz) || PLACES.find((p) => tz && p.tz.split("/")[0] === tz.split("/")[0]) || PLACES.find((p) => p.name === "London");
}
export const zone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; } };
/** Hours and minutes in the place's own clock when its time zone is known, else the device's. */
export function clock(ms, place) {
  const o = { hour: "numeric", minute: "2-digit" };
  try { return new Date(ms).toLocaleTimeString([], place && place.tz ? { ...o, timeZone: place.tz } : o); } catch { return new Date(ms).toLocaleTimeString([], o); }
}
