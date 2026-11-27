// Natal chart: planets (shared ephemeris) + houses, angles and aspects.
// Houses: Whole Sign (default, Frank 2026-11-26) or Placidus; Placidus falls back to Whole Sign where it is undefined (polar latitudes).
// tests/astrology.test.js checks Asc, MC and Placidus cusps against Swiss Ephemeris.
import { positions, obliquity, siderealTime, norm, SIGNS } from "../../ephemeris.js";

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
export const PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
export const NAMES = { sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter",
  saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto", node: "North Node", asc: "Ascendant", mc: "Midheaven" };

const eclFromRa = (ra, e) => norm(Math.atan2(Math.sin(ra * D2R), Math.cos(ra * D2R) * Math.cos(e * D2R)) * R2D);

export function angles(ramc, eps, lat) {
  const r = ramc * D2R, e = eps * D2R, f = lat * D2R;
  const mc = eclFromRa(ramc, eps);
  const asc = norm(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(f) * Math.sin(e))) * R2D);
  return { asc, mc };
}

function placidus(ramc, eps, lat, asc, mc) {
  const e = eps * D2R, tf = Math.tan(lat * D2R);
  const cusp = (offset, frac, above) => {
    let ra = ramc + offset;
    for (let i = 0; i < 60; i++) {
      const dec = Math.asin(Math.sin(e) * Math.sin(eclFromRa(ra, eps) * D2R));
      const x = tf * Math.tan(dec);
      if (Math.abs(x) >= 1) return null;
      const ad = Math.asin(x) * R2D;
      const next = above ? ramc + frac * (90 + ad) : ramc + 180 - frac * (90 - ad);
      if (Math.abs(next - ra) < 1e-9) break;
      ra = next;
    }
    return eclFromRa(ra, eps);
  };
  const c11 = cusp(30, 1 / 3, true), c12 = cusp(60, 2 / 3, true), c2 = cusp(120, 2 / 3, false), c3 = cusp(150, 1 / 3, false);
  if ([c11, c12, c2, c3].includes(null)) return null;
  return [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180), norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
}

export const ASPECTS = [
  { type: "conjunction", angle: 0, orb: 8, symbol: "☌" }, { type: "opposition", angle: 180, orb: 8, symbol: "☍" },
  { type: "trine", angle: 120, orb: 7, symbol: "△" }, { type: "square", angle: 90, orb: 7, symbol: "□" },
  { type: "sextile", angle: 60, orb: 5, symbol: "⚹" }, { type: "quincunx", angle: 150, orb: 2.5, symbol: "⚻" },
];

export const signOf = (l) => SIGNS[Math.floor(norm(l) / 30)];

/**
 * Cast a natal chart.
 * @param {{utc: Date, lat: number, lon: number, houses?: 'placidus'|'whole'|'none', timeKnown?: boolean}} o
 */
export function castChart({ utc, lat, lon, houses = "whole", timeKnown = true }) {
  const pos = positions(utc);
  const points = PLANETS.map((k) => ({ key: k, name: NAMES[k], lon: pos[k].lon, retro: pos[k].speed < 0 }));
  points.push({ key: "node", name: NAMES.node, lon: pos.node.lon, retro: false });
  let cusps = null, system = null, asc = null, mc = null;
  if (timeKnown && houses !== "none") {
    const eps = obliquity(utc), ramc = norm(siderealTime(utc) * 15 + lon);
    ({ asc, mc } = angles(ramc, eps, lat));
    system = houses;
    if (houses === "placidus") cusps = placidus(ramc, eps, lat, asc, mc);
    if (!cusps) { system = "whole"; const s = Math.floor(asc / 30) * 30; cusps = [...Array(12)].map((_, i) => norm(s + i * 30)); }
    points.push({ key: "asc", name: NAMES.asc, lon: asc, angle: true }, { key: "mc", name: NAMES.mc, lon: mc, angle: true });
    const houseOf = (l) => { for (let i = 0; i < 12; i++) if (norm(l - cusps[i]) < norm(cusps[(i + 1) % 12] - cusps[i])) return i + 1; return 1; };
    for (const p of points) if (!p.angle) p.house = houseOf(p.lon);
  }
  for (const p of points) { p.sign = signOf(p.lon); p.deg = norm(p.lon) % 30; }

  const aspects = [];
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    const a = points[i], b = points[j];
    if (a.angle && b.angle) continue;
    if (!timeKnown && (a.key === "moon" || b.key === "moon")) continue; // Moon moves ~13 deg/day: unreliable without a time
    let d = Math.abs(a.lon - b.lon); if (d > 180) d = 360 - d;
    const lum = [a.key, b.key].some((k) => k === "sun" || k === "moon");
    for (const asp of ASPECTS) {
      const orb = Math.abs(d - asp.angle);
      if (orb <= asp.orb + (lum ? 1 : 0)) { aspects.push({ a: a.key, b: b.key, type: asp.type, symbol: asp.symbol, orb }); break; }
    }
  }
  // Most important first: personal points and tight orbs.
  const W = { sun: 3, moon: 3, asc: 2, mc: 1.5, mercury: 2, venus: 2, mars: 2, jupiter: 1.5, saturn: 1.5, uranus: 1, neptune: 1, pluto: 1, node: 0.7 };
  const score = (x) => (W[x.a] + W[x.b]) / (1 + x.orb);
  aspects.sort((x, y) => score(y) - score(x));

  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const EL = ["fire", "earth", "air", "water"];
  for (const p of points) if (PLANETS.includes(p.key) || p.key === "asc") elements[EL[SIGNS.indexOf(p.sign) % 4]] += p.key === "sun" || p.key === "moon" || p.key === "asc" ? 2 : 1;

  return { utc, lat, lon, timeKnown, system, cusps, points, aspects, elements, get: (k) => points.find((p) => p.key === k) };
}
