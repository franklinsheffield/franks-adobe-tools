// Satellite texture from Sentinel-2 L2A true-colour COGs on AWS (no key needed).
"use strict";
const mgrs = require("mgrs");
const proj4 = require("proj4");
const { fromUrl } = require("geotiff");
const G = require("./geo");
const BUCKET = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/";

async function getText(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + " -> HTTP " + r.status); return r.text(); }

// MGRS 100 km squares touching the box (Sentinel-2 tiles are these squares + 9.8 km overlap).
function tilesFor(b) {
  const [w, s, e, n] = b.bbox, pts = [[b.lon, b.lat], [w, s], [w, n], [e, s], [e, n]];
  return [...new Set(pts.map((p) => mgrs.forward(p, 0)))];
}

// Recent summer scenes for one tile, best first (low cloud, full coverage of our box).
async function scenesFor(tile, b, now = new Date()) {
  const m = tile.match(/^(\d+)([A-Z])([A-Z]{2})$/); if (!m) return [];
  const months = b.lat >= 0 ? [6, 7, 8, 9, 5, 10] : [12, 1, 2, 3, 11, 4], Y = now.getUTCFullYear();
  const prefixes = [];
  for (const y of [Y - 1, Y - 2]) for (const mo of months) prefixes.push(`sentinel-s2-l2a-cogs/${+m[1]}/${m[2]}/${m[3]}/${y}/${mo}/`);
  const lists = await Promise.all(prefixes.map((p) => getText(BUCKET + "?list-type=2&delimiter=/&prefix=" + p).catch(() => "")));
  const dirs = lists.flatMap((x) => [...x.matchAll(/<Prefix>([^<]+_L2A\/)<\/Prefix>/g)].map((r) => r[1])).slice(0, 40);
  const items = await Promise.all(dirs.map(async (d) => {
    try { const id = d.split("/").slice(-2)[0], j = JSON.parse(await getText(BUCKET + d + id + ".json")); return j; } catch (e) { return null; }
  }));
  const [w, s, e, n] = b.bbox;
  return items.filter(Boolean).map((j) => {
    const p = j.properties, [a, c, d, f] = j.bbox;
    const ix = Math.max(0, Math.min(e, d) - Math.max(w, a)) * Math.max(0, Math.min(n, f) - Math.max(s, c)), cover = ix / ((e - w) * (n - s));
    return { id: j.id, href: j.assets.visual ? j.assets.visual.href : BUCKET + j.id, epsg: p["proj:epsg"], cloud: p["eo:cloud_cover"], nodata: p["s2:nodata_pixel_percentage"] || 0, date: p.datetime, cover };
  }).filter((x) => x.cover > 0.05 && x.cloud < 30)
    .sort((x, y) => (y.cover > 0.999) - (x.cover > 0.999) || (x.cloud + x.nodata * 0.3) - (y.cloud + y.nodata * 0.3));
}

const utmDef = (epsg) => `+proj=utm +zone=${epsg % 100} ${Math.floor(epsg / 100) === 327 ? "+south " : ""}+datum=WGS84 +units=m +no_defs`;

// Fills rgb (T*T*3) where mask==0 from one scene. Returns pixels filled.
async function paintScene(sc, b, T, rgb, mask) {
  const P = proj4("EPSG:3857", utmDef(sc.epsg)), L = 64;
  // UTM coords on a coarse lattice, interpolated per pixel (projection is smooth over <= 40 km).
  const lat = new Float64Array((L + 1) * (L + 1) * 2);
  let ux0 = Infinity, ux1 = -Infinity, uy0 = Infinity, uy1 = -Infinity;
  for (let j = 0; j <= L; j++) for (let i = 0; i <= L; i++) {
    const [ux, uy] = P.forward([b.x0 + (b.x1 - b.x0) * i / L, b.y1 - (b.y1 - b.y0) * j / L]), k = (j * (L + 1) + i) * 2;
    lat[k] = ux; lat[k + 1] = uy; ux0 = Math.min(ux0, ux); ux1 = Math.max(ux1, ux); uy0 = Math.min(uy0, uy); uy1 = Math.max(uy1, uy);
  }
  const tiff = await fromUrl(sc.href), base = await tiff.getImage(0), n = await tiff.getImageCount();
  const [bx0, , , by1] = base.getBoundingBox(), res0 = base.getResolution()[0], want = b.widthM / T;
  let img = base, res = res0;
  for (let i = 1; i < n; i++) { const o = await tiff.getImage(i), r = res0 * base.getWidth() / o.getWidth(); if (r <= want * 1.01) { img = o; res = r; } }
  const W = img.getWidth(), H = img.getHeight();
  const wx0 = Math.max(0, Math.floor((ux0 - bx0) / res) - 2), wx1 = Math.min(W, Math.ceil((ux1 - bx0) / res) + 2);
  const wy0 = Math.max(0, Math.floor((by1 - uy1) / res) - 2), wy1 = Math.min(H, Math.ceil((by1 - uy0) / res) + 2);
  if (wx1 <= wx0 || wy1 <= wy0) return 0;
  const ras = await img.readRasters({ window: [wx0, wy0, wx1, wy1], samples: [0, 1, 2], interleave: true }), rw = wx1 - wx0, rh = wy1 - wy0;
  let filled = 0;
  for (let py = 0; py < T; py++) {
    const gy = py / (T - 1) * L, j = Math.min(L - 1, Math.floor(gy)), fy = gy - j;
    for (let px = 0; px < T; px++) {
      const o = py * T + px; if (mask[o]) continue;
      const gx = px / (T - 1) * L, i = Math.min(L - 1, Math.floor(gx)), fx = gx - i;
      const k00 = (j * (L + 1) + i) * 2, k10 = k00 + 2, k01 = k00 + (L + 1) * 2, k11 = k01 + 2;
      const ux = (lat[k00] * (1 - fx) + lat[k10] * fx) * (1 - fy) + (lat[k01] * (1 - fx) + lat[k11] * fx) * fy;
      const uy = (lat[k00 + 1] * (1 - fx) + lat[k10 + 1] * fx) * (1 - fy) + (lat[k01 + 1] * (1 - fx) + lat[k11 + 1] * fx) * fy;
      const sx = (ux - bx0) / res - wx0 - 0.5, sy = (by1 - uy) / res - wy0 - 0.5, xi = Math.floor(sx), yi = Math.floor(sy);
      if (xi < 0 || yi < 0 || xi + 1 >= rw || yi + 1 >= rh) continue;
      const ax = sx - xi, ay = sy - yi, q = (yi * rw + xi) * 3, q2 = q + rw * 3;
      if (!(ras[q] | ras[q + 1] | ras[q + 2]) || !(ras[q2 + 3] | ras[q2 + 4] | ras[q2 + 5])) continue; // nodata edge
      for (let c = 0; c < 3; c++) rgb[o * 3 + c] = ((ras[q + c] * (1 - ax) + ras[q + 3 + c] * ax) * (1 - ay) + (ras[q2 + c] * (1 - ax) + ras[q2 + 3 + c] * ax) * ay) | 0;
      mask[o] = 1; filled++;
    }
  }
  return filled;
}

// Returns { rgb, filled (0..1), scenes: [{id,date,cloud}] }.
async function texture(b, T, log = () => {}) {
  const rgb = new Uint8Array(T * T * 3), mask = new Uint8Array(T * T), used = [];
  let total = 0;
  const lists = await Promise.all(tilesFor(b).map((t) => scenesFor(t, b).catch(() => [])));
  const cands = lists.flat().sort((x, y) => (y.cover > 0.999) - (x.cover > 0.999) || x.cloud - y.cloud);
  for (const sc of cands.slice(0, 4)) {
    if (total >= T * T) break;
    try { const f = await paintScene(sc, b, T, rgb, mask); if (f) { total += f; used.push({ id: sc.id, date: sc.date.slice(0, 10), cloud: +sc.cloud.toFixed(1) }); log("scene " + sc.id + " filled " + f); } }
    catch (e) { log("scene " + sc.id + " failed: " + e.message); }
  }
  return { rgb, mask, filled: total / (T * T), scenes: used };
}
module.exports = { texture, tilesFor, scenesFor };
