// Place -> heightfield + satellite texture -> .glb (the Terrain Lab "map pick" pipeline, server side).
"use strict";
const jpegjs = require("jpeg-js");
const G = require("./geo");
const { heights } = require("./dem");
const { texture } = require("./sentinel");
const { terrainGLB } = require("./glb");

// Hypsometric tint + hillshade for pixels the satellite pass could not fill (sea, gaps, no scenes).
function tintGaps(rgb, mask, T, h, grid, lo, hi, cell) {
  const sample = (u, v) => { const x = u * (grid - 1), y = v * (grid - 1), i = Math.min(grid - 2, Math.floor(x)), j = Math.min(grid - 2, Math.floor(y)), fx = x - i, fy = y - j;
    return (h[j * grid + i] * (1 - fx) + h[j * grid + i + 1] * fx) * (1 - fy) + (h[(j + 1) * grid + i] * (1 - fx) + h[(j + 1) * grid + i + 1] * fx) * fy; };
  const ramp = [[0, [70, 98, 62]], [0.35, [138, 140, 92]], [0.7, [150, 120, 92]], [1, [235, 235, 235]]], e = 1 / (T - 1);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const o = y * T + x; if (mask[o]) continue;
    const u = x * e, v = y * e, z = sample(u, v);
    let c;
    if (z <= 0.5 && lo < 1) c = [28, 52, 78];
    else { const t = hi > lo ? (z - lo) / (hi - lo) : 0; let k = 1; while (k < ramp.length - 1 && t > ramp[k][0]) k++; const [t0, c0] = ramp[k - 1], [t1, c1] = ramp[k], f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0))); c = c0.map((a, i) => a + (c1[i] - a) * f); }
    const gx = (sample(Math.min(1, u + e), v) - sample(Math.max(0, u - e), v)) / (2 * cell), gy = (sample(u, Math.min(1, v + e)) - sample(u, Math.max(0, v - e))) / (2 * cell);
    const shade = Math.max(0.35, Math.min(1.25, 0.85 + (-gx * 0.7 - gy * 0.7) * 3));
    for (let i = 0; i < 3; i++) rgb[o * 3 + i] = Math.max(0, Math.min(255, c[i] * shade));
  }
}

// opts: { lat, lon, sizeKm, name, grid=256, tex=2048, quality=88, log }
async function buildTerrain(opts) {
  const { lat, lon, sizeKm, name = "terrain", grid = 256, tex = 2048, quality = 88, log = () => {} } = opts;
  const b = G.box(lat, lon, sizeKm);
  const [{ h, zoom }, sat] = await Promise.all([heights(b, grid), texture(b, tex, log)]);
  let lo = Infinity, hi = -Infinity; for (const v of h) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (sat.filled < 1) tintGaps(sat.rgb, sat.mask, tex, h, grid, lo, hi, b.widthM / (tex - 1));
  const rgba = Buffer.alloc(tex * tex * 4); for (let i = 0, n = tex * tex; i < n; i++) { rgba[i * 4] = sat.rgb[i * 3]; rgba[i * 4 + 1] = sat.rgb[i * 3 + 1]; rgba[i * 4 + 2] = sat.rgb[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
  const jpeg = jpegjs.encode({ data: rgba, width: tex, height: tex }, quality).data;
  const info = { name, lat, lon, sizeKm, bbox: b.bbox.map((v) => +v.toFixed(5)), widthM: Math.round(b.widthM), depthM: Math.round(b.depthM),
    minElevationM: Math.round(lo), maxElevationM: Math.round(hi), demZoom: zoom, satelliteCoverage: +sat.filled.toFixed(3), scenes: sat.scenes,
    sources: ["Elevation: AWS Terrain Tiles (Mapzen terrarium)", sat.scenes.length ? "Imagery: Copernicus Sentinel-2 L2A (ESA), via AWS Open Data" : "Imagery: none available, elevation tint"] };
  const glb = terrainGLB({ h, grid, widthM: b.widthM, depthM: b.depthM, jpeg, name, extras: { lat, lon, bbox: info.bbox, scenes: sat.scenes.map((s) => s.id) } });
  return { glb, jpeg, info };
}
module.exports = { buildTerrain };
