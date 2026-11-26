// Geo helpers: Web Mercator boxes, terrarium tiles, coordinate parsing.
"use strict";
const R = 6378137;
const merc = (lon, lat) => [R * lon * Math.PI / 180, R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
const unmerc = (x, y) => [x / R * 180 / Math.PI, (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI];

// Square box of sizeKm x sizeKm on the ground, centred on lat/lon, in Mercator metres.
function box(lat, lon, sizeKm) {
  if (!(Math.abs(lat) <= 84)) throw new Error("Latitude must be between -84 and 84.");
  const k = Math.cos(lat * Math.PI / 180), half = sizeKm * 500 / k, [cx, cy] = merc(lon, lat);
  const b = { x0: cx - half, x1: cx + half, y0: cy - half, y1: cy + half, lat, lon, sizeKm, k };
  b.widthM = (b.x1 - b.x0) * k; b.depthM = (b.y1 - b.y0) * k;
  const [w, s] = unmerc(b.x0, b.y0), [e, n] = unmerc(b.x1, b.y1); b.bbox = [w, s, e, n];
  return b;
}

// Terrarium zoom: DEM pixel about half a grid cell, capped so we fetch at most ~16 tiles.
function demZoom(b, grid) {
  const want = b.widthM / grid / 2, z0 = Math.ceil(Math.log2(156543.03 * b.k / want));
  let z = Math.max(4, Math.min(14, z0));
  while (z > 4 && tileCount(b, z) > 16) z--;
  return z;
}
const worldPx = (z) => 256 * 2 ** z;
// Mercator metres -> global pixel at zoom z.
const toPx = (x, y, z) => [(x / (2 * Math.PI * R) + 0.5) * worldPx(z), (0.5 - y / (2 * Math.PI * R)) * worldPx(z)];
function tileRange(b, z) { const [a, c] = toPx(b.x0, b.y1, z), [d, e] = toPx(b.x1, b.y0, z); return { tx0: Math.floor(a / 256), ty0: Math.floor(c / 256), tx1: Math.floor((d - 1e-6) / 256), ty1: Math.floor((e - 1e-6) / 256) }; }
function tileCount(b, z) { const t = tileRange(b, z); return (t.tx1 - t.tx0 + 1) * (t.ty1 - t.ty0 + 1); }

// "36.1, -112.1" or "36.1 -112.1" -> {lat, lon}; else null.
function parseCoords(s) {
  const m = String(s).trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null; const lat = +m[1], lon = +m[2];
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon, name: lat.toFixed(4) + ", " + lon.toFixed(4) } : null;
}

module.exports = { R, merc, unmerc, box, demZoom, toPx, tileRange, tileCount, parseCoords };
