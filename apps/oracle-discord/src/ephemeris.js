// Planet positions for birth charts, from astronomy-engine (MIT, pure JS: runs in Node and Cloudflare Workers).
// Geocentric, tropical, apparent ecliptic longitude of date (true equinox, with aberration), like Swiss Ephemeris'
// default output. tests/ephemeris.test.js checks it against Swiss Ephemeris to well under 1 arcminute.
import * as A from "astronomy-engine";

export const BODIES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const AE = { sun: A.Body.Sun, moon: A.Body.Moon, mercury: A.Body.Mercury, venus: A.Body.Venus, mars: A.Body.Mars,
  jupiter: A.Body.Jupiter, saturn: A.Body.Saturn, uranus: A.Body.Uranus, neptune: A.Body.Neptune, pluto: A.Body.Pluto };

export const norm = (x) => ((x % 360) + 360) % 360;

function lon(body, t) {
  if (body === "sun") return A.SunPosition(t).elon;
  if (body === "moon") return A.Ecliptic(A.GeoMoon(t)).elon;
  return A.Ecliptic(A.GeoVector(AE[body], t, true)).elon;
}

// True (osculating) lunar node: ascending node of the Moon's instantaneous geocentric orbit on the ecliptic of date.
function trueNode(t) {
  const s = A.RotateState(A.Rotation_EQJ_ECT(t), A.GeoMoonState(t));
  const hx = s.y * s.vz - s.z * s.vy, hy = s.z * s.vx - s.x * s.vz;
  return norm(Math.atan2(hx, -hy) * 180 / Math.PI);
}
// Mean node (Meeus, Astronomical Algorithms 47.7).
function meanNode(t) {
  const T = t.tt / 36525;
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441 - T ** 4 / 60616000);
}

const H = 1 / 24; // speed step: 1 hour
const speed = (f, t) => { let d = f(t.AddDays(H)) - f(t.AddDays(-H)); if (d > 180) d -= 360; if (d < -180) d += 360; return d / (2 * H); };

/** Positions at a UTC instant. Returns { sun: { lon, speed }, ..., node: { lon, speed }, time: Date }. */
export function positions(date, { node = "true" } = {}) {
  const t = A.MakeTime(date), out = { time: new Date(t.date) };
  for (const b of BODIES) out[b] = { lon: norm(lon(b, t)), speed: speed((x) => lon(b, x), t) };
  const nf = node === "mean" ? meanNode : trueNode;
  out.node = { lon: nf(t), speed: speed(nf, t), type: node };
  return out;
}

/** Instant before `date` when the Sun was `degrees` of longitude earlier (Human Design: 88 degrees). */
export function solarArcBefore(date, degrees = 88) {
  const t = A.MakeTime(date), target = norm(A.SunPosition(t).elon - degrees);
  const hit = A.SearchSunLongitude(target, t.AddDays(-degrees * 1.1 - 6), 20);
  if (!hit) throw new Error("design date search failed");
  return hit.date;
}

export const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
export function zodiac(l) {
  const x = norm(l), s = Math.floor(x / 30), d = x - s * 30, deg = Math.floor(d), min = Math.floor((d - deg) * 60);
  return { sign: SIGNS[s], deg, min, text: `${deg}°${String(min).padStart(2, "0")}' ${SIGNS[s]}` };
}

/** True obliquity of the ecliptic (degrees) at a UTC instant. */
export const obliquity = (date) => A.e_tilt(A.MakeTime(date)).tobl;
/** Greenwich apparent sidereal time (hours) at a UTC instant. */
export const siderealTime = (date) => A.SiderealTime(A.MakeTime(date));
