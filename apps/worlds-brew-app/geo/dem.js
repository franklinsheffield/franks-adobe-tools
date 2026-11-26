"use strict";
// Pixel Scape Terrain Lab: real ground heights for a box (plain Node).
// Source: AWS Terrain Tiles ("terrarium" PNG tiles, free, no key): USGS 3DEP (~10 m) in the USA, SRTM / GMTED (~30 m)
// elsewhere, ETOPO1 under the sea. Height in metres = R * 256 + G + B / 256 - 32768.
const P = require("./proj.js"), NET = require("./net.js"), PNG = require("./png.js");

const TERRARIUM = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
const SOURCES = {
  terrarium: { name: "AWS Terrain Tiles", maxZ: 15, credit: "Elevation: AWS Terrain Tiles (USGS 3DEP, SRTM, GMTED2010, ETOPO1; see github.com/tilezen/joerd attribution)" }
};

// the tile zoom whose pixels are no bigger than the grid step (capped at the source's best)
function zoomFor(box, n, maxZ) {
  const step = Math.max(box.w, box.d) / (n - 1);
  let z = 1; while (z < maxZ && P.tilePixelM(box.lat, z) > step) z++;
  return z;
}

// -> { n, h (Float32Array n*n, row 0 = the box's north edge, metres), min, max, z, pixelM, credit }
async function heights(box, n, opt) {
  opt = opt || {};
  const src = SOURCES.terrarium, z = Math.min(src.maxZ, opt.z || zoomFor(box, n, src.maxZ)), F = P.boxFrame(box);
  const a = P.tileXY(F.west, F.north, z), b = P.tileXY(F.east, F.south, z);
  const x0 = Math.floor(a.x) - 1, x1 = Math.floor(b.x) + 1, y0 = Math.max(0, Math.floor(a.y) - 1), y1 = Math.min(2 ** z - 1, Math.floor(b.y) + 1);
  const list = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) list.push([x, y]);
  if (list.length > 400) throw new Error("This area needs too many elevation tiles; make the box smaller or the detail lower.");
  let done = 0; const tiles = new Map(), n2 = 2 ** z;
  await NET.pool(list, 8, async ([x, y]) => {
    const buf = await NET.get(TERRARIUM(z, ((x % n2) + n2) % n2, y));
    if (buf) { const im = PNG.decode(buf), f = new Float32Array(65536); for (let i = 0; i < 65536; i++) { const q = i * im.ch; f[i] = im.d[q] * 256 + im.d[q + 1] + im.d[q + 2] / 256 - 32768; } tiles.set(x + ":" + y, f); }
    done++; if (opt.progress) opt.progress(done / list.length, "Elevation tiles " + done + " / " + list.length);
  });
  // height at a global pixel (tile x * 256 + px), clamped to the tiles we have
  const at = (gx, gy) => { gx = Math.max(x0 * 256, Math.min(x1 * 256 + 255, gx)); gy = Math.max(y0 * 256, Math.min(y1 * 256 + 255, gy));
    const t = tiles.get(Math.floor(gx / 256) + ":" + Math.floor(gy / 256)); return t ? t[(gy & 255) * 256 + (gx & 255)] : 0; };
  const h = new Float32Array(n * n); let min = Infinity, max = -Infinity;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const g = F.at(i / (n - 1), j / (n - 1)), t = P.tileXY(g.lon, g.lat, z), fx = t.x * 256 - 0.5, fy = t.y * 256 - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
    h[j * n + i] = (at(ix, iy) * (1 - ax) + at(ix + 1, iy) * ax) * (1 - ay) + (at(ix, iy + 1) * (1 - ax) + at(ix + 1, iy + 1) * ax) * ay;
  }
  const tm = Math.max(40, 12 * Math.max(box.w, box.d) / (n - 1)), fixed = fillHoles(h, n, tm) + despike(h, n, tm);
  for (let i = 0; i < h.length; i++) { const v = h[i]; if (v < min) min = v; if (v > max) max = v; }
  return { n, h, min, max, z, fixed, pixelM: P.tilePixelM(box.lat, z), tiles: list.length, source: src.name, credit: src.credit };
}

// whole patches of a source tile can be garbage too (thousands of metres below everything else in the box, e.g. the
// East River at zoom 15). Heights below a big empty gap in the box's lowest quarter are no-data, filled from the nearest
// good samples (breadth-first, averaging the neighbours already filled). Real ground and sea floor have no such gap.
function fillHoles(h, n, t) {
  // the cut: the highest big empty gap in the lowest quarter of the heights (real ground and sea floor have no such gap)
  const N = n * n, s = Float32Array.from(h).sort(), gap = Math.max(300, 4 * t), bad = new Uint8Array(N);
  let cut = s[Math.floor(N * 0.02)] - gap; for (let k = Math.floor(N * 0.25); k > 0; k--) if (s[k] - s[k - 1] > gap) { cut = Math.max(cut, s[k]); break; }   // ...or far below the 2nd percentile
  let count = 0; for (let i = 0; i < N; i++) if (h[i] < cut) { bad[i] = 1; count++; }
  if (!count || count === N) return 0;
  for (let pass = 0; pass < 3; pass++) {   // grow the patch by 3 samples: its edge is blended half-way into good ground
    const grow = []; for (let i = 0; i < N; i++) if (!bad[i]) { const x = i % n, y = (i - x) / n;
      if ((x > 0 && bad[i - 1]) || (x < n - 1 && bad[i + 1]) || (y > 0 && bad[i - n]) || (y < n - 1 && bad[i + n])) grow.push(i); }
    for (const i of grow) bad[i] = 1; count += grow.length;
  }
  if (count >= N) return 0;
  let front = []; for (let i = 0; i < N; i++) if (!bad[i]) { const x = i % n, y = (i - x) / n;
    if ((x > 0 && bad[i - 1]) || (x < n - 1 && bad[i + 1]) || (y > 0 && bad[i - n]) || (y < n - 1 && bad[i + n])) front.push(i); }
  while (front.length) {
    const next = [];
    for (const i of front) { const x = i % n, y = (i - x) / n;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue; const q = yy * n + xx; if (bad[q] === 1) { bad[q] = 2; next.push(q); } } }
    for (const q of next) { const x = q % n, y = (q - x) / n; let sum = 0, k = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue; const r = yy * n + xx; if (!bad[r]) { sum += h[r]; k++; } }
      h[q] = k ? sum / k : h[q]; }
    for (const q of next) bad[q] = 0;
    front = next;
  }
  return count;
}
// the source tiles have rare bad pixels (thousands of metres down, mostly over rivers and harbours at high zoom):
// a sample further than t metres from its neighbourhood's median takes the median. Real ground never jumps that far
// between neighbouring samples. Returns how many samples were fixed.
function despike(h, n, t) {
  let fixed = 0; const win = [];
  for (const r of [2, 2, 2, 4, 4, 8]) {   // repeat (a fixed neighbour unmasks the next one); wider windows catch small clusters
    let changed = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const p = j * n + i, v = h[p]; let s = 0, k = 0;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const x = i + dx, y = j + dy; if (x >= 0 && y >= 0 && x < n && y < n) { s += h[y * n + x]; k++; } }
      if (Math.abs(v - s / k) < t / 2) continue;   // cheap test first
      win.length = 0; for (let y = Math.max(0, j - r); y <= Math.min(n - 1, j + r); y++) for (let x = Math.max(0, i - r); x <= Math.min(n - 1, i + r); x++) win.push(h[y * n + x]);
      win.sort((a, b) => a - b); const m = win[win.length >> 1];
      if (Math.abs(v - m) > t) { h[p] = m; changed++; }
    }
    fixed += changed;
  }
  return fixed;
}

// a quick height lookup for one point (the map's readout)
async function heightAt(lon, lat, z) {
  z = z || 12; const t = P.tileXY(lon, lat, z), buf = await NET.get(TERRARIUM(z, Math.floor(t.x), Math.floor(t.y)));
  if (!buf) return null; const im = PNG.decode(buf), q = ((Math.floor((t.y % 1) * 256)) * 256 + Math.floor((t.x % 1) * 256)) * im.ch;
  return im.d[q] * 256 + im.d[q + 1] + im.d[q + 2] / 256 - 32768;
}

module.exports = { heights, despike, fillHoles, heightAt, zoomFor, TERRARIUM, SOURCES };
