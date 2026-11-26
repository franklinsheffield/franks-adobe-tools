"use strict";
// Pixel Scape Terrain Lab: map maths (host-free, plain Node).
//   Web Mercator tiles (the elevation tiles), UTM (Sentinel-2 pictures), the Sentinel-2 / MGRS tile name,
//   and the build box: a square-ish area on the ground, centre + width / depth in metres + turn, sampled as a
//   local flat grid in metres (fine up to ~100 km: the error is well under one grid step).
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const A = 6378137, F = 1 / 298.257223563, E2 = F * (2 - F), EP2 = E2 / (1 - E2), K0 = 0.9996;

// ---- Web Mercator tiles (z / x / y, 256 px)
function tileXY(lon, lat, z) {
  const n = 2 ** z, s = Math.sin(Math.max(-85.0511, Math.min(85.0511, lat)) * D2R);
  return { x: (lon + 180) / 360 * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
}
function tileLonLat(x, y, z) { const n = 2 ** z; return { lon: x / n * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * R2D }; }
// ground size of one 256 px tile pixel at a latitude
const tilePixelM = (lat, z) => 2 * Math.PI * A * Math.cos(lat * D2R) / (256 * 2 ** z);

// ---- UTM (WGS84), Snyder's series: good to ~1 mm inside a zone
function utmZone(lon, lat) {
  let z = Math.floor((lon + 180) / 6) + 1;
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) z = 32;                            // Norway
  if (lat >= 72 && lat < 84) { if (lon >= 0 && lon < 9) z = 31; else if (lon >= 9 && lon < 21) z = 33; else if (lon >= 21 && lon < 33) z = 35; else if (lon >= 33 && lon < 42) z = 37; }   // Svalbard
  return Math.min(60, Math.max(1, z));
}
const cm = (zone) => (zone - 1) * 6 - 180 + 3;
function meridianArc(phi) {
  return A * ((1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 ** 3 / 256) * phi - (3 * E2 / 8 + 3 * E2 * E2 / 32 + 45 * E2 ** 3 / 1024) * Math.sin(2 * phi)
    + (15 * E2 * E2 / 256 + 45 * E2 ** 3 / 1024) * Math.sin(4 * phi) - (35 * E2 ** 3 / 3072) * Math.sin(6 * phi));
}
// lon/lat -> { e, n } in the given zone (north-hemisphere style northing; south adds 10,000 km)
function toUTM(lon, lat, zone, south) {
  const phi = lat * D2R, lam = (lon - cm(zone)) * D2R, s = Math.sin(phi), c = Math.cos(phi), t = Math.tan(phi);
  const N = A / Math.sqrt(1 - E2 * s * s), T = t * t, C = EP2 * c * c, Aa = c * lam, M = meridianArc(phi);
  const e = K0 * N * (Aa + (1 - T + C) * Aa ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * EP2) * Aa ** 5 / 120) + 500000;
  let n = K0 * (M + N * t * (Aa * Aa / 2 + (5 - T + 9 * C + 4 * C * C) * Aa ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * EP2) * Aa ** 6 / 720));
  if (south) n += 10000000;
  return { e, n };
}
function fromUTM(e, n, zone, south) {
  const x = e - 500000, y = south ? n - 10000000 : n, M = y / K0, mu = M / (A * (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1), C1 = EP2 * c * c, T1 = t * t, N1 = A / Math.sqrt(1 - E2 * s * s), R1 = A * (1 - E2) / Math.pow(1 - E2 * s * s, 1.5), D = x / (N1 * K0);
  const lat = p1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * D ** 5 / 120) / c;
  return { lon: cm(zone) + lon * R2D, lat: lat * R2D };
}

// ---- Sentinel-2 tile name (MGRS 100 km square), e.g. Grand Canyon Village -> "12SUE"
const BANDS = "CDEFGHJKLMNPQRSTUVWX", COLS = ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"], ROWS = "ABCDEFGHJKLMNPQRSTUV";
function band(lat) { return BANDS[Math.min(19, Math.max(0, Math.floor((lat + 80) / 8)))]; }
// the 100 km square that holds (e, n) in a zone; returns its name and lower-left corner
function square(zone, e, n) {
  const col = COLS[(zone - 1) % 3][Math.floor(e / 100000) - 1], row = ROWS[(Math.floor(n / 100000) + (zone % 2 ? 0 : 5)) % 20];
  return { col, row, e0: Math.floor(e / 100000) * 100000, n0: Math.floor(n / 100000) * 100000 };
}
function mgrsTile(lon, lat) {
  const zone = utmZone(lon, lat), south = lat < 0, u = toUTM(lon, lat, zone, south), sq = square(zone, u.e, u.n);
  return { id: String(zone).padStart(2, "0") + band(lat) + sq.col + sq.row, zone, south, band: band(lat), sq: sq.col + sq.row, e: u.e, n: u.n };
}

// ---- the build box: { lat, lon, w, d (metres), turn (degrees, clockwise from north) }
// local metres (x east, z south, so +z runs down the picture like image rows) <-> lon/lat
function radii(lat) { const s = Math.sin(lat * D2R), w = 1 - E2 * s * s; return { M: A * (1 - E2) / Math.pow(w, 1.5), N: A / Math.sqrt(w) }; }
function boxFrame(box) {
  const r = radii(box.lat), c = Math.cos((box.turn || 0) * D2R), s = Math.sin((box.turn || 0) * D2R), cl = Math.cos(box.lat * D2R);
  // (u, v) in 0..1 across the box (u east-ish, v south-ish) -> lon / lat
  const at = (u, v) => {
    const x = (u - 0.5) * box.w, z = (v - 0.5) * box.d, ex = x * c - z * s, nz = -(x * s + z * c);   // turn the box clockwise
    return { lon: box.lon + ex / (r.N * cl) * R2D, lat: box.lat + nz / r.M * R2D };
  };
  // lon / lat -> metres from the box centre (x east-ish, z south-ish), the terrain mesh's own frame
  const local = (lon, lat) => { const ex = (lon - box.lon) * D2R * r.N * cl, mz = -(lat - box.lat) * D2R * r.M; return { x: c * ex + s * mz, z: -s * ex + c * mz }; };
  const corners = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)];
  const lons = corners.map((p) => p.lon), lats = corners.map((p) => p.lat);
  return { at, local, corners, west: Math.min(...lons), east: Math.max(...lons), south: Math.min(...lats), north: Math.max(...lats) };
}
// a box from two map corners (no turn)
function boxFromBounds(west, south, east, north) {
  const lat = (south + north) / 2, lon = (west + east) / 2, r = radii(lat);
  return { lat, lon, w: (east - west) * D2R * r.N * Math.cos(lat * D2R), d: (north - south) * D2R * r.M, turn: 0 };
}

module.exports = { D2R, R2D, tileXY, tileLonLat, tilePixelM, utmZone, toUTM, fromUTM, band, square, mgrsTile, radii, boxFrame, boxFromBounds };
