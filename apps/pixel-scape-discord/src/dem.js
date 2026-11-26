// Elevation from AWS Terrain Tiles (terrarium PNG: h = R*256 + G + B/256 - 32768).
"use strict";
const { PNG } = require("pngjs");
const G = require("./geo");
const TILE = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

async function fetchBuf(url, tries = 3) {
  for (let i = 0; ; i++) {
    try { const r = await fetch(url); if (!r.ok) throw new Error(url + " -> HTTP " + r.status); return Buffer.from(await r.arrayBuffer()); }
    catch (e) { if (i >= tries - 1) throw e; await new Promise((ok) => setTimeout(ok, 500 * (i + 1))); }
  }
}

// Returns Float32Array grid x grid (row 0 = north), metres.
async function heights(b, grid) {
  const z = G.demZoom(b, grid), t = G.tileRange(b, z), tw = t.tx1 - t.tx0 + 1, th = t.ty1 - t.ty0 + 1, n = 2 ** z;
  const W = tw * 256, mos = new Float32Array(W * th * 256);
  const jobs = [];
  for (let ty = t.ty0; ty <= t.ty1; ty++) for (let tx = t.tx0; tx <= t.tx1; tx++) jobs.push((async () => {
    const png = PNG.sync.read(await fetchBuf(TILE(z, ((tx % n) + n) % n, ty))), d = png.data;
    const ox = (tx - t.tx0) * 256, oy = (ty - t.ty0) * 256;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const i = (y * 256 + x) * 4; mos[(oy + y) * W + ox + x] = d[i] * 256 + d[i + 1] + d[i + 2] / 256 - 32768; }
  })());
  await Promise.all(jobs);
  const [px0, py0] = G.toPx(b.x0, b.y1, z), [px1, py1] = G.toPx(b.x1, b.y0, z), H = th * 256;
  const out = new Float32Array(grid * grid);
  const at = (x, y) => mos[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  for (let j = 0; j < grid; j++) for (let i = 0; i < grid; i++) {
    const x = px0 + (px1 - px0) * i / (grid - 1) - t.tx0 * 256 - 0.5, y = py0 + (py1 - py0) * j / (grid - 1) - t.ty0 * 256 - 0.5;
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    out[j * grid + i] = (at(xi, yi) * (1 - fx) + at(xi + 1, yi) * fx) * (1 - fy) + (at(xi, yi + 1) * (1 - fx) + at(xi + 1, yi + 1) * fx) * fy;
  }
  return { h: out, zoom: z };
}
module.exports = { heights, fetchBuf };
