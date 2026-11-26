"use strict";
// Pixel Scape Terrain Lab: read one tile out of a big PMTiles v3 archive with byte-range requests (plain Node),
// and decode Mapbox Vector Tiles (protobuf) into polygons with their properties.
// Used for the Overture Maps buildings archive (one file for the planet, z0..14, gzip, clustered).
const zlib = require("zlib"), NET = require("./net.js");

// ---- PMTiles v3
const u64 = (b, o) => Number(b.readBigUInt64LE(o));
function varint(b, st) { let v = 0, s = 1, x; do { x = b[st.i++]; v += (x & 0x7f) * s; s *= 128; } while (x & 0x80); return v; }
function gunzip(b, comp) { return comp === 2 ? zlib.gunzipSync(b) : comp === 3 ? zlib.brotliDecompressSync(b) : b; }
// z/x/y -> Hilbert tile id (the PMTiles spec)
function zxyToId(z, x, y) {
  let acc = 0; for (let t = 0; t < z; t++) acc += 4 ** t;
  const n = 2 ** z; let d = 0, rx, ry;
  for (let s = n / 2; s >= 1; s /= 2) {
    rx = (x & s) > 0 ? 1 : 0; ry = (y & s) > 0 ? 1 : 0; d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const t = x; x = y; y = t; }
  }
  return acc + d;
}
function readDir(buf) {
  const st = { i: 0 }, n = varint(buf, st), e = new Array(n);
  let last = 0; for (let k = 0; k < n; k++) { last += varint(buf, st); e[k] = { id: last, off: 0, len: 0, run: 0 }; }
  for (let k = 0; k < n; k++) e[k].run = varint(buf, st);
  for (let k = 0; k < n; k++) e[k].len = varint(buf, st);
  for (let k = 0; k < n; k++) { const v = varint(buf, st); e[k].off = v === 0 && k > 0 ? e[k - 1].off + e[k - 1].len : v - 1; }
  return e;
}
function findEntry(dir, id) {
  let lo = 0, hi = dir.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1, c = id - dir[m].id; if (c > 0) lo = m + 1; else if (c < 0) hi = m - 1; else return dir[m]; }
  if (hi >= 0) { const e = dir[hi]; if (e.run === 0 || id - e.id < e.run) return e; }
  return null;
}
// open(url) -> { header, tile(z, x, y) -> Buffer | null }. Directories are kept in memory; tiles go through the disk cache.
function open(url) {
  let head = null; const dirs = new Map();
  const range = async (off, len) => { const b = await NET.get(url, [off, off + len - 1]); if (!b) throw new Error("the buildings archive is missing: " + url); return b; };
  async function header() {
    if (head) return head;
    const b = await range(0, 16384);
    if (b.toString("latin1", 0, 7) !== "PMTiles" || b[7] !== 3) throw new Error("not a PMTiles v3 archive");
    head = { rootOff: u64(b, 8), rootLen: u64(b, 16), metaOff: u64(b, 24), metaLen: u64(b, 32), leafOff: u64(b, 40), leafLen: u64(b, 48), dataOff: u64(b, 56),
      ic: b[97], tc: b[98], minZ: b[100], maxZ: b[101] };
    dirs.set("root", readDir(gunzip(b.subarray(head.rootOff, head.rootOff + head.rootLen), head.ic)));
    return head;
  }
  async function dir(off, len) {
    const k = off + ":" + len; if (dirs.has(k)) return dirs.get(k);
    const d = readDir(gunzip(await range(head.leafOff + off, len), head.ic)); dirs.set(k, d); return d;
  }
  async function tile(z, x, y) {
    const h = await header(), id = zxyToId(z, x, y); let d = dirs.get("root");
    for (let depth = 0; depth < 4; depth++) {
      const e = findEntry(d, id); if (!e) return null;
      if (e.run > 0) return gunzip(await range(h.dataOff + e.off, e.len), h.tc);
      d = await dir(e.off, e.len);
    }
    return null;
  }
  async function metadata() { const h = await header(); return JSON.parse(gunzip(await range(h.metaOff, h.metaLen), h.ic).toString("utf8")); }
  return { header, tile, metadata };
}

// ---- Mapbox Vector Tile -> { layerName: [{ type, rings: [[[x, y], ...]], props }] } with x, y in 0..1 across the tile
function decodeMVT(buf, want) {
  const out = {}; let i = 0;
  const vint = () => { let v = 0, s = 1, x; do { x = buf[i++]; v += (x & 0x7f) * s; s *= 128; } while (x & 0x80); return v; };
  const skip = (wt) => { if (wt === 0) vint(); else if (wt === 1) i += 8; else if (wt === 2) { const l = vint(); i += l; } else if (wt === 5) i += 4; };
  while (i < buf.length) {
    const key = vint(), f = key >> 3, wt = key & 7;
    if (f === 3 && wt === 2) { const l = vint(), end = i + l, L = layer(end); if (L && (!want || want.includes(L.name))) out[L.name] = L.features; i = end; }
    else skip(wt);
  }
  return out;
  function layer(end) {
    let name = "", extent = 4096; const keys = [], vals = [], feats = [];
    while (i < end) {
      const key = vint(), f = key >> 3, wt = key & 7;
      if (f === 1) { const l = vint(); name = buf.toString("utf8", i, i + l); i += l; }
      else if (f === 2) { const l = vint(); feats.push([i, i + l]); i += l; }
      else if (f === 3) { const l = vint(); keys.push(buf.toString("utf8", i, i + l)); i += l; }
      else if (f === 4) { const l = vint(), e = i + l; vals.push(value(e)); i = e; }
      else if (f === 5) extent = vint();
      else skip(wt);
    }
    if (want && !want.includes(name)) return { name, features: [] };
    const save = i, features = feats.map(([a, b]) => { i = a; return feature(b, keys, vals, extent); }); i = save;
    return { name, features };
  }
  function value(end) {
    let v = null;
    while (i < end) {
      const key = vint(), f = key >> 3, wt = key & 7;
      if (f === 1) { const l = vint(); v = buf.toString("utf8", i, i + l); i += l; }
      else if (f === 2) { v = buf.readFloatLE(i); i += 4; } else if (f === 3) { v = buf.readDoubleLE(i); i += 8; }
      else if (f === 4 || f === 5) v = vint(); else if (f === 6) { const z = vint(); v = (z >>> 1) ^ -(z & 1); } else if (f === 7) v = !!vint();
      else skip(wt);
    }
    return v;
  }
  function feature(end, keys, vals, extent) {
    let type = 0; const props = {}; let geom = [];
    while (i < end) {
      const key = vint(), f = key >> 3, wt = key & 7;
      if (f === 2) { const l = vint(), e = i + l; while (i < e) { const k = vint(), v = vint(); props[keys[k]] = vals[v]; } }
      else if (f === 3) type = vint();
      else if (f === 4) { const l = vint(), e = i + l; while (i < e) geom.push(vint()); }
      else skip(wt);
    }
    // geometry commands -> rings
    const rings = []; let x = 0, y = 0, ring = null, k = 0;
    while (k < geom.length) {
      const c = geom[k++], id = c & 7, n = c >> 3;
      if (id === 1 || id === 2) for (let r = 0; r < n; r++) {
        const dx = geom[k++], dy = geom[k++]; x += (dx >>> 1) ^ -(dx & 1); y += (dy >>> 1) ^ -(dy & 1);
        if (id === 1) { ring = []; rings.push(ring); }
        ring.push([x / extent, y / extent]);
      }
      else if (id === 7 && ring && ring.length) ring.push(ring[0].slice());
    }
    return { type, rings, props };
  }
}

module.exports = { open, decodeMVT, zxyToId };
