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
    const v = (at(ix, iy) * (1 - ax) + at(ix + 1, iy) * ax) * (1 - ay) + (at(ix, iy + 1) * (1 - ax) + at(ix + 1, iy + 1) * ax) * ay;
    h[j * n + i] = v; if (v < min) min = v; if (v > max) max = v;
  }
  return { n, h, min, max, z, pixelM: P.tilePixelM(box.lat, z), tiles: list.length, source: src.name, credit: src.credit };
}

// a quick height lookup for one point (the map's readout)
async function heightAt(lon, lat, z) {
  z = z || 12; const t = P.tileXY(lon, lat, z), buf = await NET.get(TERRARIUM(z, Math.floor(t.x), Math.floor(t.y)));
  if (!buf) return null; const im = PNG.decode(buf), q = ((Math.floor((t.y % 1) * 256)) * 256 + Math.floor((t.x % 1) * 256)) * im.ch;
  return im.d[q] * 256 + im.d[q + 1] + im.d[q + 2] / 256 - 32768;
}

module.exports = { heights, heightAt, zoomFor, TERRARIUM, SOURCES };
