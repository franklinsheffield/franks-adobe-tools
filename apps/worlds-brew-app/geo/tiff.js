"use strict";
// Pixel Scape Terrain Lab: a small reader for Cloud-Optimised GeoTIFFs over the web (plain Node).
// Reads only the header and the tiles a window needs, at the best overview level, using byte-range downloads.
// Enough for the Sentinel-2 files: tiled, 8-bit, DEFLATE (+ horizontal predictor) or none, any band count.
const zlib = require("zlib");

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 16: 8, 17: 8, 18: 8 };

// get(range) -> Buffer of bytes [start, end] (inclusive)
async function openCOG(get) {
  let head = await get([0, 65535]);
  const ensure = async (end) => { if (end < head.length) return; head = Buffer.concat([head, await get([head.length, Math.max(end, head.length + 262143)])]); };
  const le = head.toString("latin1", 0, 2) === "II"; if (!le && head.toString("latin1", 0, 2) !== "MM") throw new Error("not a TIFF file");
  const u16 = (o) => (le ? head.readUInt16LE(o) : head.readUInt16BE(o)), u32 = (o) => (le ? head.readUInt32LE(o) : head.readUInt32BE(o));
  const u64 = (o) => Number(le ? head.readBigUInt64LE(o) : head.readBigUInt64BE(o));
  const big = u16(2) === 43;
  let ifd = big ? u64(8) : u32(4);
  const levels = []; let geo = null;
  while (ifd) {
    await ensure(ifd + 20);
    const n = big ? u64(ifd) : u16(ifd), es = big ? 20 : 12, start = ifd + (big ? 8 : 2);
    await ensure(start + n * es + 8);
    const tags = {};
    for (let i = 0; i < n; i++) {
      const e = start + i * es, tag = u16(e), type = u16(e + 2), count = big ? u64(e + 4) : u32(e + 4), sz = (TYPE_SIZE[type] || 1) * count;
      const inline = sz <= (big ? 8 : 4), off = inline ? e + (big ? 12 : 8) : (big ? u64(e + 12) : u32(e + 8));
      tags[tag] = { type, count, off, inline };
    }
    const read = async (tag) => {
      const t = tags[tag]; if (!t) return null;
      await ensure(t.off + (TYPE_SIZE[t.type] || 1) * t.count);
      const out = new Array(t.count);
      for (let i = 0; i < t.count; i++) {
        const o = t.off + i * (TYPE_SIZE[t.type] || 1);
        out[i] = t.type === 3 ? u16(o) : t.type === 4 ? u32(o) : t.type === 16 ? u64(o) : t.type === 12 ? (le ? head.readDoubleLE(o) : head.readDoubleBE(o)) : t.type === 1 ? head[o] : u32(o);
      }
      return out;
    };
    const L = { w: (await read(256))[0], h: (await read(257))[0], spp: ((await read(277)) || [1])[0], bps: ((await read(258)) || [8])[0], comp: ((await read(259)) || [1])[0],
      pred: ((await read(317)) || [1])[0], tw: ((await read(322)) || [0])[0], th: ((await read(323)) || [0])[0], offsets: await read(324), counts: await read(325),
      sub: ((await read(254)) || [0])[0] };
    if (!L.tw || !L.offsets) throw new Error("this GeoTIFF is not tiled");
    if (!geo && tags[33550] && tags[33922]) {
      const sc = await read(33550), tp = await read(33922), gk = tags[34735] ? await read(34735) : [];
      let epsg = null; for (let i = 4; i + 3 < gk.length; i += 4) if (gk[i] === 3072 || (gk[i] === 2048 && !epsg)) epsg = gk[i + 3];
      geo = { x0: tp[3] - tp[0] * sc[0], y0: tp[4] + tp[1] * sc[1], rx: sc[0], ry: sc[1], epsg };
    }
    if (!(L.sub & 4)) levels.push(L);   // skip mask images
    ifd = big ? u64(start + n * es) : u32(start + n * es);
  }
  if (!geo) throw new Error("this TIFF has no map position");
  const full = levels[0];
  levels.forEach((L) => { L.rx = geo.rx * full.w / L.w; L.ry = geo.ry * full.h / L.h; });

  const cache = new Map();
  async function tile(L, tx, ty) {
    const k = levels.indexOf(L) + ":" + tx + ":" + ty; if (cache.has(k)) return cache.get(k);
    const p = (async () => {
      const i = ty * Math.ceil(L.w / L.tw) + tx, off = L.offsets[i], cnt = L.counts[i], bpp = L.spp * L.bps / 8;
      if (!cnt) return new Uint8Array(L.tw * L.th * bpp);
      let raw = await get([off, off + cnt - 1]);
      if (L.comp === 8 || L.comp === 32946) raw = zlib.inflateSync(raw);
      else if (L.comp !== 1) throw new Error("unsupported TIFF compression " + L.comp);
      const d = new Uint8Array(raw.buffer, raw.byteOffset, raw.length);
      if (L.pred === 2 && L.bps === 8) { const row = L.tw * L.spp; for (let y = 0; y < L.th; y++) for (let x = L.spp; x < row; x++) d[y * row + x] = (d[y * row + x] + d[y * row + x - L.spp]) & 255; }
      return d;
    })();
    cache.set(k, p); return p;
  }
  // the coarsest level whose pixels are still at most `res` metres (map units)
  function levelFor(res) { let best = levels[0]; for (const L of levels) if (L.rx <= res * 1.0001 && L.rx >= best.rx) best = L; return best; }
  // load every tile under a window (map units) at a level, then sample(x, y) -> [band values] synchronously
  async function window(L, minX, minY, maxX, maxY, pool) {
    const px = (x) => (x - geo.x0) / L.rx, py = (y) => (geo.y0 - y) / L.ry;
    const tx0 = Math.max(0, Math.floor(px(minX) / L.tw) - 0), tx1 = Math.min(Math.ceil(L.w / L.tw) - 1, Math.floor(px(maxX) / L.tw));
    const ty0 = Math.max(0, Math.floor(py(maxY) / L.th)), ty1 = Math.min(Math.ceil(L.h / L.th) - 1, Math.floor(py(minY) / L.th));
    const want = []; for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) want.push([tx, ty]);
    const tiles = new Map();
    await (pool || ((a, n, f) => Promise.all(a.map(f))))(want, 6, async ([tx, ty]) => { tiles.set(tx + ":" + ty, await tile(L, tx, ty)); });
    const out = new Array(L.spp).fill(0);
    // nearest sample at map (x, y); outside the file -> null
    function sample(x, y) {
      const fx = Math.floor(px(x)), fy = Math.floor(py(y)); if (fx < 0 || fy < 0 || fx >= L.w || fy >= L.h) return null;
      const t = tiles.get(Math.floor(fx / L.tw) + ":" + Math.floor(fy / L.th)); if (!t) return null;
      const q = ((fy % L.th) * L.tw + (fx % L.tw)) * L.spp; for (let b = 0; b < L.spp; b++) out[b] = t[q + b]; return out;
    }
    // bilinear (for photos): writes into o, returns false outside
    function bilinear(x, y, o) {
      const fx = px(x) - 0.5, fy = py(y) - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
      if (x0 < 0 || y0 < 0 || x0 + 1 >= L.w || y0 + 1 >= L.h) return false;
      const at = (xx, yy) => { const t = tiles.get(Math.floor(xx / L.tw) + ":" + Math.floor(yy / L.th)); return t ? [t, ((yy % L.th) * L.tw + (xx % L.tw)) * L.spp] : null; };
      const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1); if (!a || !b || !c || !d) return false;
      for (let k = 0; k < L.spp; k++) o[k] = (a[0][a[1] + k] * (1 - ax) + b[0][b[1] + k] * ax) * (1 - ay) + (c[0][c[1] + k] * (1 - ax) + d[0][d[1] + k] * ax) * ay;
      return true;
    }
    return { sample, bilinear, tiles: want.length };
  }
  return { geo, levels, levelFor, window };
}

module.exports = { openCOG };
