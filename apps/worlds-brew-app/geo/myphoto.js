"use strict";
// Pixel Scape Terrain Lab 0.13 "My photo": put your own aerial / drone / map picture on the terrain (plain Node + browser).
//   decodeTIFF(buf, maxSide)      -> { w, h, d (RGBA), geo: { wf: [A, D, B, E, C, F], epsg } | null }   (GeoTIFFs, plain TIFFs)
//   readEXIF(jpegBytes)            -> { lat, lon, alt, dir, f35, pitch, yaw, relAlt } (any may be missing) or null
//   worldFile(text), crsFromPrj(text), crsFromEPSG(code), guessCRS(X, Y, lon) -> where a picture sits on the earth
//   placement(spec, w, h)          -> { lonlatToPx(lon, lat) -> [u, v], pxToLonLat(u, v), kind, mpp, rms } from a world file + CRS, pins, or a drone shot
//   render(place, box, W, H, src)  -> RGBA W x H over the box (row 0 = north edge), alpha 0 where the photo doesn't reach
// A placement spec is plain JSON (saved in terrain.json): { kind: "world", wf, crs } | { kind: "pins", pins: [{ u, v, lon, lat }] }
const zlib = require("zlib"), P = require("./proj.js");

// ---------------------------------------------------------------- TIFF (strips or tiles; none / LZW / Deflate; 8 or 16 bit)
const TS = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 16: 8, 17: 8, 18: 8 };
function lzw(src, outLen) {   // TIFF LZW (MSB first, early change)
  const out = new Uint8Array(outLen); let o = 0, bit = 0, width = 9;
  const dict = [], read = () => { let v = 0; for (let i = 0; i < width; i++) { const B = src[(bit >> 3)]; v = (v << 1) | (B === undefined ? 0 : (B >> (7 - (bit & 7))) & 1); bit++; } return v; };
  const reset = () => { dict.length = 258; for (let i = 0; i < 256; i++) dict[i] = [i]; width = 9; };
  reset(); let prev = null;
  while (bit < src.length * 8) {
    const code = read(); if (code === 257) break;
    if (code === 256) { reset(); prev = null; continue; }
    let entry; if (code < dict.length && dict[code]) entry = dict[code]; else if (prev) entry = prev.concat(prev[0]); else break;
    for (let i = 0; i < entry.length && o < outLen; i++) out[o++] = entry[i];
    if (prev) dict.push(prev.concat(entry[0]));
    prev = entry;
    if (dict.length + 1 >= 1 << width && width < 12) width++;
  }
  return out;
}
function decodeTIFF(buf, maxSide) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf.buffer || buf, buf.byteOffset || 0, buf.byteLength);
  const le = b.toString("latin1", 0, 2) === "II"; if (!le && b.toString("latin1", 0, 2) !== "MM") throw new Error("not a TIFF file");
  const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o)), u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o)), u64 = (o) => Number(le ? b.readBigUInt64LE(o) : b.readBigUInt64BE(o));
  const big = u16(2) === 43, ifd = big ? u64(8) : u32(4), n = big ? u64(ifd) : u16(ifd), es = big ? 20 : 12, start = ifd + (big ? 8 : 2), tags = {};
  for (let i = 0; i < n; i++) {
    const e = start + i * es, tag = u16(e), type = u16(e + 2), count = big ? u64(e + 4) : u32(e + 4), sz = (TS[type] || 1) * count;
    const off = sz <= (big ? 8 : 4) ? e + (big ? 12 : 8) : (big ? u64(e + 12) : u32(e + 8)), v = [];
    for (let k = 0; k < count && k < 1 << 20; k++) { const o = off + k * (TS[type] || 1);
      v.push(type === 3 ? u16(o) : type === 4 ? u32(o) : type === 16 ? u64(o) : type === 12 ? (le ? b.readDoubleLE(o) : b.readDoubleBE(o)) : type === 11 ? (le ? b.readFloatLE(o) : b.readFloatBE(o)) : type === 2 || type === 1 || type === 7 ? b[o] : u32(o)); }
    tags[tag] = v;
  }
  const one = (t, d) => (tags[t] ? tags[t][0] : d);
  const w = one(256), h = one(257), spp = one(277, 1), bps = one(258, 8), comp = one(259, 1), pred = one(317, 1), photo = one(262, 2), planar = one(284, 1);
  if (comp === 7 || comp === 6) throw new Error("this TIFF uses JPEG compression inside, which Pixel Scape can't read yet: save it as a plain or LZW TIFF, or as a JPEG with its world file");
  if (comp !== 1 && comp !== 5 && comp !== 8 && comp !== 32946) throw new Error("unsupported TIFF compression (" + comp + ")");
  if (bps !== 8 && bps !== 16) throw new Error("only 8 or 16-bit TIFFs are supported (this one is " + bps + "-bit)");
  if (planar !== 1 && spp > 1) throw new Error("this TIFF stores colours in separate planes, which isn't supported");
  const tiled = !!tags[322], tw = tiled ? one(322) : w, th = tiled ? one(323) : one(278, h), offs = tags[tiled ? 324 : 273], cnts = tags[tiled ? 325 : 279];
  const k = Math.max(1, Math.ceil(Math.max(w, h) / (maxSide || 8192))), W = Math.ceil(w / k), H = Math.ceil(h / k), out = new Uint8Array(W * H * 4), Bpp = spp * bps / 8;
  const cmap = tags[320], extra = one(338, 0);
  const across = Math.ceil(w / tw);
  for (let i = 0; i < offs.length; i++) {
    const tx = tiled ? (i % across) * tw : 0, ty = tiled ? Math.floor(i / across) * th : i * th; if (ty >= h) continue;
    const rows = Math.min(th, h - ty), need = tw * (tiled ? th : rows) * Bpp;
    let raw = b.subarray(offs[i], offs[i] + cnts[i]);
    if (comp === 5) raw = lzw(raw, need); else if (comp === 8 || comp === 32946) raw = zlib.inflateSync(raw);
    const d = new Uint8Array(raw.buffer, raw.byteOffset, raw.length), row = tw * spp;
    const S = bps === 16 ? (q) => (le ? d[q * 2 + 1] : d[q * 2]) : (q) => d[q];
    if (pred === 2 && bps === 8) for (let y = 0; y < rows; y++) for (let x = spp; x < row; x++) d[y * row + x] = (d[y * row + x] + d[y * row + x - spp]) & 255;
    for (let y = 0; y < rows; y++) { const gy = ty + y; if (gy % k) continue;
      for (let x = 0; x < tw; x++) { const gx = tx + x; if (gx >= w || gx % k) continue;
        const q = (y * tw + x) * spp, o = ((gy / k) * W + gx / k) * 4;
        if (photo === 3 && cmap) { const c = S(q), nC = cmap.length / 3; out[o] = cmap[c] >> 8; out[o + 1] = cmap[nC + c] >> 8; out[o + 2] = cmap[2 * nC + c] >> 8; out[o + 3] = 255; }
        else if (spp >= 3) { out[o] = S(q); out[o + 1] = S(q + 1); out[o + 2] = S(q + 2); out[o + 3] = spp >= 4 && extra ? S(q + 3) : 255; }
        else { let g = S(q); if (photo === 0) g = 255 - g; out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = spp === 2 ? S(q + 1) : 255; }
      } }
  }
  // where it sits: ModelPixelScale + ModelTiepoint, or ModelTransformation; and the EPSG code from the GeoKeys
  let geo = null;
  if (tags[33550] && tags[33922]) { const sc = tags[33550], tp = tags[33922];
    const A = sc[0], E = -sc[1], C = tp[3] - tp[0] * sc[0], F = tp[4] + tp[1] * sc[1]; geo = { wf: [A, 0, 0, E, C + A / 2, F + E / 2] }; }   // world files point at pixel centres
  else if (tags[34264]) { const m = tags[34264]; geo = { wf: [m[0], m[4], m[1], m[5], m[3] + (m[0] + m[1]) / 2, m[7] + (m[4] + m[5]) / 2] }; }
  if (geo) {
    const gk = tags[34735] || []; let epsg = null, geog = null, point = false;
    for (let i = 4; i + 3 < gk.length; i += 4) { if (gk[i] === 3072) epsg = gk[i + 3]; if (gk[i] === 2048) geog = gk[i + 3]; if (gk[i] === 1025 && gk[i + 3] === 2) point = true; }
    if (point) { geo.wf[4] -= (geo.wf[0] + geo.wf[2]) / 2; geo.wf[5] -= (geo.wf[1] + geo.wf[3]) / 2; }   // "pixel is point": the tiepoint was already a centre
    geo.epsg = epsg && epsg !== 32767 ? epsg : geog || null;
    // the shrunk picture: one output pixel = k source pixels
    geo.wf = [geo.wf[0] * k, geo.wf[1] * k, geo.wf[2] * k, geo.wf[3] * k, geo.wf[4], geo.wf[5]];   // every k-th source pixel is kept, so pixel 0 stays put
  }
  return { w: W, h: H, d: out, srcW: w, srcH: h, shrink: k, geo };
}

// ---------------------------------------------------------------- EXIF GPS (+ DJI XMP) from a JPEG
function readEXIF(u8) {
  const b = Buffer.from(u8.buffer || u8, u8.byteOffset || 0, u8.byteLength || u8.length);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  const r = {}; let i = 2;
  while (i + 4 < b.length && b[i] === 0xff) {
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m === 0xda || m === 0xd9) break;
    if (m === 0xe1 && b.toString("latin1", i + 4, i + 10) === "Exif\0\0") exifBlock(b.subarray(i + 10, i + 2 + len), r);
    else if (m === 0xe1 && b.toString("latin1", i + 4, i + 33) === "http://ns.adobe.com/xap/1.0/\0") xmp(b.toString("utf8", i + 33, i + 2 + len), r);
    i += 2 + len;
  }
  return Object.keys(r).length ? r : null;
}
function exifBlock(t, r) {
  const le = t.toString("latin1", 0, 2) === "II", u16 = (o) => (le ? t.readUInt16LE(o) : t.readUInt16BE(o)), u32 = (o) => (le ? t.readUInt32LE(o) : t.readUInt32BE(o));
  const ifd = (off) => { const n = u16(off), out = {}; for (let k = 0; k < n; k++) { const e = off + 2 + k * 12; out[u16(e)] = { type: u16(e + 2), count: u32(e + 4), off: (TS[u16(e + 2)] || 1) * u32(e + 4) <= 4 ? e + 8 : u32(e + 8) }; } return out; };
  const rat = (x, k) => { const o = x.off + k * 8, d = u32(o + 4); return d ? u32(o) / d : 0; };
  const val = (x) => (x.type === 3 ? u16(x.off) : x.type === 4 ? u32(x.off) : x.type === 5 ? rat(x, 0) : x.type === 2 ? t.toString("latin1", x.off, x.off + x.count).replace(/\0.*$/, "") : t[x.off]);
  try {
    const t0 = ifd(u32(4));
    if (t0[0x8769]) { const ex = ifd(val(t0[0x8769])); if (ex[0xa405]) r.f35 = val(ex[0xa405]); if (ex[0x920a]) r.focal = val(ex[0x920a]); }
    if (t0[0x8825]) {
      const g = ifd(val(t0[0x8825])), dms = (x) => rat(x, 0) + rat(x, 1) / 60 + rat(x, 2) / 3600;
      if (g[2] && g[4]) { r.lat = dms(g[2]) * (g[1] && val(g[1]) === "S" ? -1 : 1); r.lon = dms(g[4]) * (g[3] && val(g[3]) === "W" ? -1 : 1); if (!r.lat && !r.lon) { delete r.lat; delete r.lon; } }
      if (g[6]) r.alt = rat(g[6], 0) * (g[5] && val(g[5]) === 1 ? -1 : 1);
      if (g[17]) r.dir = rat(g[17], 0);
    }
  } catch (e) { /* a damaged EXIF block: keep what was read */ }
}
function xmp(s, r) {
  const num = (k) => { const m = new RegExp("drone-dji:" + k + "\\s*=\\s*\"([-+0-9.]+)\"").exec(s) || new RegExp("<drone-dji:" + k + ">([-+0-9.]+)<").exec(s); return m ? +m[1] : null; };
  const pitch = num("GimbalPitchDegree"), yaw = num("GimbalYawDegree"), fyaw = num("FlightYawDegree"), rel = num("RelativeAltitude");
  if (pitch != null) r.pitch = pitch; if (yaw != null || fyaw != null) r.yaw = yaw != null ? yaw : fyaw; if (rel != null) r.relAlt = rel;
  const la = num("GpsLatitude") || num("GpsLatitude".replace("Gps", "GPS")), lo = num("GpsLongitude") || num("GpsLongtitude");
  if (r.lat == null && la != null && lo != null) { r.lat = la; r.lon = lo; }
}

// ---------------------------------------------------------------- world files and map projections
function worldFile(text) { const v = String(text).trim().split(/\s+/).map(Number); return v.length >= 6 && v.slice(0, 6).every(isFinite) ? v.slice(0, 6) : null; }   // A D B E C F
function crsFromEPSG(c) {
  c = +c; if (!c) return null;
  if ([4326, 4269, 4258, 4283, 4167, 4617, 4019].includes(c)) return { kind: "ll", epsg: c };
  if ([3857, 900913, 3785, 102100, 102113].includes(c)) return { kind: "merc", epsg: c };
  if (c >= 32601 && c <= 32660) return { kind: "utm", zone: c - 32600, south: false, epsg: c };
  if (c >= 32701 && c <= 32760) return { kind: "utm", zone: c - 32700, south: true, epsg: c };
  if (c >= 26901 && c <= 26923) return { kind: "utm", zone: c - 26900, south: false, epsg: c };   // NAD83 UTM (within ~1 m of WGS84)
  if (c >= 25828 && c <= 25838) return { kind: "utm", zone: c - 25800, south: false, epsg: c };   // ETRS89 UTM
  return null;
}
function crsFromPrj(text) {
  const s = String(text || ""); if (!s.trim()) return null;
  const ep = /AUTHORITY\["EPSG",\s*"?(\d+)"?\]\s*\]\s*$/i.exec(s.trim()) || /ID\["EPSG",\s*(\d+)\]\s*\]\s*$/i.exec(s.trim()); if (ep) { const c = crsFromEPSG(ep[1]); if (c) return c; }
  const u = /UTM[_ ]?zone[_ ]?(\d{1,2})\s*([NS])?/i.exec(s); if (u) return { kind: "utm", zone: +u[1], south: /S/i.test(u[2] || "") || /Southern/i.test(s) };
  if (/Mercator_Auxiliary_Sphere|Pseudo[-_ ]Mercator|Popular Visualisation|Web[_ ]Mercator/i.test(s)) return { kind: "merc" };
  if (/^\s*GEOGCS|^\s*GEOGCRS|^\s*GEODCRS/i.test(s)) return { kind: "ll" };
  return null;
}
// no projection given: guess from the numbers (and, for UTM, the zone where the box is now)
function guessCRS(X, Y, lon, lat) {
  if (Math.abs(X) <= 180 && Math.abs(Y) <= 90) return { kind: "ll", guessed: true };
  if (X > 100000 && X < 900000 && Math.abs(Y) < 10000000) return { kind: "utm", zone: P.utmZone(lon || 0, lat || 0), south: (lat || 0) < 0, guessed: true };
  if (Math.abs(X) < 20037509 && Math.abs(Y) < 20048967) return { kind: "merc", guessed: true };
  return null;
}
const RM = 6378137;
function toCRS(lon, lat, crs) {
  if (crs.kind === "ll") return [lon, lat];
  if (crs.kind === "merc") return [lon * P.D2R * RM, Math.log(Math.tan(Math.PI / 4 + lat * P.D2R / 2)) * RM];
  const u = P.toUTM(lon, lat, crs.zone, crs.south); return [u.e, u.n];
}
function fromCRS(X, Y, crs) {
  if (crs.kind === "ll") return { lon: X, lat: Y };
  if (crs.kind === "merc") return { lon: X / RM * P.R2D, lat: (2 * Math.atan(Math.exp(Y / RM)) - Math.PI / 2) * P.R2D };
  return P.fromUTM(X, Y, crs.zone, crs.south);
}

// ---------------------------------------------------------------- fits: 2 pins similarity, 3 affine, 4+ perspective
function solve(A, b) {   // least squares: (A^T A) x = A^T b, Gaussian elimination
  const n = A[0].length, M = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (let r = 0; r < A.length; r++) for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) M[i][j] += A[r][i] * A[r][j]; M[i][n] += A[r][i] * b[r]; }
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]]; if (Math.abs(M[c][c]) < 1e-12) return null;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j]; }
  }
  return M.map((row, i) => row[n] / row[i]);
}
// (X, Y) -> (u, v) with X, Y in metres on a local flat plane around the pins
function fitMap(src, dst) {
  const k = src.length; let f = null, kind;
  if (k >= 4) {   // perspective (a photo taken at an angle over flattish ground)
    const A = [], b = []; for (let i = 0; i < k; i++) { const [X, Y] = src[i], [u, v] = dst[i];
      A.push([X, Y, 1, 0, 0, 0, -u * X, -u * Y]); b.push(u); A.push([0, 0, 0, X, Y, 1, -v * X, -v * Y]); b.push(v); }
    const h = solve(A, b); if (h) { kind = "perspective"; f = (X, Y) => { const wq = h[6] * X + h[7] * Y + 1; return [(h[0] * X + h[1] * Y + h[2]) / wq, (h[3] * X + h[4] * Y + h[5]) / wq]; }; }
  }
  if (!f && k >= 3) {
    const A = src.map(([X, Y]) => [X, Y, 1]), a = solve(A, dst.map((d) => d[0])), c = solve(A, dst.map((d) => d[1]));
    if (a && c) { kind = "affine"; f = (X, Y) => [a[0] * X + a[1] * Y + a[2], c[0] * X + c[1] * Y + c[2]]; }
  }
  if (!f && k >= 2) {   // similarity: u = aX + bY + c, v = bX - aY + d (photo rows run down while north runs up: a photo seen from above is this way round)
    const A = [], bb = []; for (let i = 0; i < k; i++) { const [X, Y] = src[i], [u, v] = dst[i]; A.push([X, Y, 1, 0]); bb.push(u); A.push([-Y, X, 0, 1]); bb.push(v); }
    const s = solve(A, bb); if (s) { kind = "similar"; f = (X, Y) => [s[0] * X + s[1] * Y + s[2], s[1] * X - s[0] * Y + s[3]]; }
  }
  return f ? { f, kind } : null;
}
// ground spot for a drone photo looking straight down: the four corners, from height, lens and heading
function droneCorners(ex, w, h) {
  if (ex == null || ex.lat == null || ex.relAlt == null || !(ex.relAlt > 2) || ex.pitch == null || Math.abs(ex.pitch + 90) > 12) return null;
  const f35 = ex.f35 || (ex.focal ? ex.focal * 4.8 : 24), hfov = 2 * Math.atan(36 / (2 * f35)), gw = 2 * ex.relAlt * Math.tan(hfov / 2), gh = gw * h / w;   // 36 mm frame width
  const yaw = ((ex.yaw != null ? ex.yaw : ex.dir) || 0) * P.D2R, r = P.radii(ex.lat), cl = Math.cos(ex.lat * P.D2R);
  const at = (x, y) => { const e = x * Math.cos(yaw) + y * Math.sin(yaw), nn = -x * Math.sin(yaw) + y * Math.cos(yaw); return { lon: ex.lon + e / (r.N * cl) * P.R2D, lat: ex.lat + nn / r.M * P.R2D }; };   // x right, y up in the picture
  return [[0, 0, at(-gw / 2, gh / 2)], [w, 0, at(gw / 2, gh / 2)], [w, h, at(gw / 2, -gh / 2)], [0, h, at(-gw / 2, -gh / 2)]].map(([u, v, g]) => ({ u, v, lon: g.lon, lat: g.lat }));
}
// a spec -> lon/lat -> photo pixel (u, v), plus a quality figure
function placement(spec, w, h) {
  if (!spec) return null;
  if (spec.kind === "world") {
    const [A, D, B, E, C, F] = spec.wf, det = A * E - B * D; if (!det) return null;
    const lonlatToPx = (lon, lat) => { const [X, Y] = toCRS(lon, lat, spec.crs), x = X - C, y = Y - F; return [(E * x - B * y) / det + 0.5, (-D * x + A * y) / det + 0.5]; };
    const c = fromCRS(C + A * w / 2 + B * h / 2, F + D * w / 2 + E * h / 2, spec.crs), c2 = fromCRS(C + A * (w / 2 + 1) + B * h / 2, F + D * (w / 2 + 1) + E * h / 2, spec.crs);
    const r = P.radii(c.lat), mpp = Math.hypot((c2.lon - c.lon) * P.D2R * r.N * Math.cos(c.lat * P.D2R), (c2.lat - c.lat) * P.D2R * r.M);
    const pxToLonLat = (u, v) => fromCRS(C + A * (u - 0.5) + B * (v - 0.5), F + D * (u - 0.5) + E * (v - 0.5), spec.crs);
    return { lonlatToPx, pxToLonLat, kind: "map", centre: c, mpp, rms: 0, spec };
  }
  const pins = spec.pins || []; if (pins.length < 2) return null;
  const lat0 = pins.reduce((s, p) => s + p.lat, 0) / pins.length, lon0 = pins.reduce((s, p) => s + p.lon, 0) / pins.length, r = P.radii(lat0), cl = Math.cos(lat0 * P.D2R);
  const XY = (lon, lat) => [(lon - lon0) * P.D2R * r.N * cl, (lat - lat0) * P.D2R * r.M];
  const fit = fitMap(pins.map((p) => XY(p.lon, p.lat)), pins.map((p) => [p.u, p.v])); if (!fit) return null;
  // metres per photo pixel near the middle, and how far the pins miss (metres)
  const [u0, v0] = fit.f(0, 0), [u1, v1] = fit.f(10, 0), [u2, v2] = fit.f(0, 10), mpp = 10 / Math.max(1e-9, Math.sqrt(Math.abs((u1 - u0) * (v2 - v0) - (v1 - v0) * (u2 - u0))));
  let e2 = 0; for (const p of pins) { const [u, v] = fit.f(...XY(p.lon, p.lat)); e2 += (u - p.u) ** 2 + (v - p.v) ** 2; }
  const free = { similar: 2, affine: 3, perspective: 4 }[fit.kind];
  const back = fitMap(pins.map((p) => [p.u, p.v]), pins.map((p) => XY(p.lon, p.lat)));   // photo pixel -> ground (for outlines on the map)
  const pxToLonLat = (u, v) => { const [X, Y] = back.f(u, v); return { lon: lon0 + X / (r.N * cl) * P.R2D, lat: lat0 + Y / r.M * P.R2D }; };
  return { lonlatToPx: (lon, lat) => fit.f(...XY(lon, lat)), pxToLonLat, kind: fit.kind, centre: { lon: lon0, lat: lat0 }, mpp, rms: pins.length > free ? Math.sqrt(e2 / pins.length) * mpp : null, spec };
}
// the photo laid over a box: exact projection on a 65 x 65 grid, bilinear in between; bilinear photo sampling
function render(place, box, W, H, src) {
  const F = P.boxFrame(box), G = 64, gu = new Float64Array((G + 1) * (G + 1)), gv = new Float64Array((G + 1) * (G + 1));
  for (let j = 0; j <= G; j++) for (let i = 0; i <= G; i++) { const g = F.at(i / G, j / G), [u, v] = place.lonlatToPx(g.lon, g.lat); gu[j * (G + 1) + i] = u; gv[j * (G + 1) + i] = v; }
  const out = new Uint8Array(W * H * 4), sw = src.w, sh = src.h, s = src.d; let covered = 0;
  for (let y = 0; y < H; y++) {
    const fy = (y + 0.5) / H * G, j = Math.min(G - 1, Math.floor(fy)), ay = fy - j;
    for (let x = 0; x < W; x++) {
      const fx = (x + 0.5) / W * G, i = Math.min(G - 1, Math.floor(fx)), ax = fx - i, p = j * (G + 1) + i;
      const u = (gu[p] * (1 - ax) + gu[p + 1] * ax) * (1 - ay) + (gu[p + G + 1] * (1 - ax) + gu[p + G + 2] * ax) * ay - 0.5;
      const v = (gv[p] * (1 - ax) + gv[p + 1] * ax) * (1 - ay) + (gv[p + G + 1] * (1 - ax) + gv[p + G + 2] * ax) * ay - 0.5;
      if (!(u > -0.5 && v > -0.5 && u < sw - 0.5 && v < sh - 0.5)) continue;
      const x0 = Math.max(0, Math.min(sw - 2, Math.floor(u))), y0 = Math.max(0, Math.min(sh - 2, Math.floor(v))), bx = Math.max(0, Math.min(1, u - x0)), by = Math.max(0, Math.min(1, v - y0));
      const q = (y0 * sw + x0) * 4, o = (y * W + x) * 4; let a = 0;
      for (let c = 0; c < 4; c++) { const val = (s[q + c] * (1 - bx) + s[q + 4 + c] * bx) * (1 - by) + (s[q + sw * 4 + c] * (1 - bx) + s[q + sw * 4 + 4 + c] * bx) * by; out[o + c] = val; if (c === 3) a = val; }
      if (a > 0) covered++;
    }
  }
  return { w: W, h: H, d: out, cover: covered / (W * H) };
}

module.exports = { decodeTIFF, lzw, readEXIF, worldFile, crsFromEPSG, crsFromPrj, guessCRS, toCRS, fromCRS, fitMap, droneCorners, placement, render };
