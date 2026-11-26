"use strict";
// Pixel Scape Terrain Lab: heights + photo -> the terrain asset (host-free: Node and the app window).
//   grid(dem, box, opt)  -> real-metre mesh arrays (positions, normals, uvs, indices), optional skirt + base
//   glb(mesh, jpeg)      -> a binary glTF with the photo as its colour texture (metres, Y up, centred)
//   heightPNG(dem)       -> 16-bit grey PNG bytes (white = the highest point)
//   info(...)            -> terrain.json: where, how big, which data, credits
// Coordinates: x east, y up, z south (row 0 of the grid / photo = the north edge, at -z).

const BAND = 0.06;   // share of the texture's height used for the base's earth layers
// the texture for a terrain with a base: the photo, then a band of level earth layers below it (coloured from the photo)
function addBand(pic, band) {
  band = band == null ? BAND : band;
  const H = Math.round(pic.h / (1 - band)), bh = H - pic.h, d = new Uint8Array(pic.w * H * 4); d.set(pic.d);
  let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < pic.d.length; i += 4 * 97) { r += pic.d[i]; g += pic.d[i + 1]; b += pic.d[i + 2]; n++; }
  r /= n || 1; g /= n || 1; b /= n || 1;
  for (let y = 0; y < bh; y++) {
    const t = y / Math.max(1, bh - 1), layer = Math.sin(t * 37.0) * 0.06 + Math.sin(t * 91.0 + 1.3) * 0.04, k = (0.62 - t * 0.3 + layer);
    for (let x = 0; x < pic.w; x++) { const q = ((pic.h + y) * pic.w + x) * 4, j = ((x * 13 + y * 7) % 11) / 11 * 0.05; d[q] = Math.min(255, (r * 0.7 + 40) * (k + j)); d[q + 1] = Math.min(255, (g * 0.7 + 30) * (k + j)); d[q + 2] = Math.min(255, (b * 0.7 + 22) * (k + j)); d[q + 3] = 255; }
  }
  return { w: pic.w, h: H, d, name: pic.name };
}
// resample an n x n height grid to m x m (bilinear)
function resample(h, n, m) {
  if (m === n) return h;
  const out = new Float32Array(m * m);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
    const x = i / (m - 1) * (n - 1), y = j / (m - 1) * (n - 1), x0 = Math.min(n - 2, Math.floor(x)), y0 = Math.min(n - 2, Math.floor(y)), ax = x - x0, ay = y - y0, p = y0 * n + x0;
    out[j * m + i] = (h[p] * (1 - ax) + h[p + 1] * ax) * (1 - ay) + (h[p + n] * (1 - ax) + h[p + n + 1] * ax) * ay;
  }
  return out;
}
// light smoothing (passes of a 3 x 3 blur) for noisy elevation
function smooth(h, n, passes) {
  let a = h;
  for (let k = 0; k < passes; k++) { const b = new Float32Array(a.length);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const x = i + di, y = j + dj; if (x >= 0 && y >= 0 && x < n && y < n) { const w = di || dj ? 1 : 4; s += a[y * n + x] * w; c += w; } } b[j * n + i] = s / c; }
    a = b; }
  return a;
}

// dem = { n, h, min, max }; box = { w, d } metres
// opt: { n (grid side), exag (height scale), smooth (passes), water (metres or null: flatten below it), base ("none" | "skirt"), baseDepth (metres below the lowest point) }
function grid(dem, box, opt) {
  opt = opt || {};
  const m = Math.max(2, Math.min(4096, opt.n || dem.n)), ex = opt.exag || 1;
  let h = resample(dem.h, dem.n, m); if (opt.smooth) h = smooth(h, m, opt.smooth);
  let lo = Infinity, hi = -Infinity; for (let p = 0; p < h.length; p++) { if (opt.water != null && h[p] < opt.water) h[p] = opt.water; lo = Math.min(lo, h[p]); hi = Math.max(hi, h[p]); }
  // with a base, the texture gets a band of earth layers under the photo (addBand): the top uses v 0..1-band, the walls the band
  const skirt = opt.base === "skirt", nv = m * m, E = skirt ? 4 * (m - 1) : 0, band = skirt ? (opt.band != null ? opt.band : BAND) : 0;
  const pos = new Float32Array((nv + 2 * E) * 3), uv = new Float32Array((nv + 2 * E) * 2);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
    const p = j * m + i, u = i / (m - 1), v = j / (m - 1);
    pos[p * 3] = (u - 0.5) * box.w; pos[p * 3 + 1] = (h[p] - lo) * ex; pos[p * 3 + 2] = (v - 0.5) * box.d; uv[p * 2] = u; uv[p * 2 + 1] = v * (1 - band);
  }
  const idx = [];
  for (let j = 0; j < m - 1; j++) for (let i = 0; i < m - 1; i++) { const a = j * m + i, b = a + 1, c = a + m, d = c + 1; idx.push(a, c, b, b, c, d); }   // counter-clockwise seen from above (+y)
  const top = idx.length / 3;
  if (skirt) {
    // the border, walked clockwise from the north-west corner: a top copy (earth band, top) and a bottom copy at the base
    const edge = []; for (let i = 0; i < m - 1; i++) edge.push(i); for (let j = 0; j < m - 1; j++) edge.push(j * m + m - 1);
    for (let i = m - 1; i > 0; i--) edge.push((m - 1) * m + i); for (let j = m - 1; j > 0; j--) edge.push(j * m);
    const yb = -(opt.baseDepth != null ? opt.baseDepth : Math.max(5, (hi - lo) * ex * 0.12)), per = 2 * (box.w + box.d);
    let run = 0;
    edge.forEach((p, k) => {
      if (k) { const q = edge[k - 1]; run += Math.hypot(pos[p * 3] - pos[q * 3], pos[p * 3 + 2] - pos[q * 3 + 2]); }
      const t = nv + k, b = nv + E + k, u = (run / per * 4) % 1;   // the band repeats once per side
      pos[t * 3] = pos[b * 3] = pos[p * 3]; pos[t * 3 + 2] = pos[b * 3 + 2] = pos[p * 3 + 2]; pos[t * 3 + 1] = pos[p * 3 + 1]; pos[b * 3 + 1] = yb;
      // earth layers run level: v follows height, from the band's top (at the highest ground) to its bottom (at the base)
      const f = (pos[p * 3 + 1] - yb) / ((hi - lo) * ex - yb || 1);
      uv[t * 2] = uv[b * 2] = u; uv[t * 2 + 1] = 1 - band * f * 0.98 - 0.001; uv[b * 2 + 1] = 0.999;
    });
    for (let k = 0; k < E; k++) { const a = nv + k, b = nv + (k + 1) % E, a2 = nv + E + k, b2 = nv + E + (k + 1) % E; idx.push(a, b, a2, b, b2, a2); }
    // the floor: a fan over the base ring (a rectangle's outline, so the fan stays inside)
    for (let k = 1; k < E - 1; k++) idx.push(nv + E, nv + E + k + 1, nv + E + k);
  }
  const I = new Uint32Array(idx), N = normals(pos, I);
  return { pos, nrm: N, uv, idx: I, n: m, minH: lo, maxH: hi, exag: ex, w: box.w, d: box.d, topTris: top, tris: I.length / 3 };
}
function normals(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const q of [a, b, c]) { n[q] += nx; n[q + 1] += ny; n[q + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}

// ---- binary glTF 2.0 with one textured primitive. image = { bytes, mime } (JPEG or PNG) or null
function glb(mesh, image, name) {
  const parts = [], views = [], acc = [];
  let off = 0;
  const add = (arr, target) => { const b = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength), padN = (4 - (b.length % 4)) % 4; views.push({ buffer: 0, byteOffset: off, byteLength: b.length, ...(target ? { target } : {}) }); parts.push(b); if (padN) parts.push(new Uint8Array(padN)); off += b.length + padN; return views.length - 1; };
  const nv = mesh.pos.length / 3, mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mesh.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], mesh.pos[i + k]); mx[k] = Math.max(mx[k], mesh.pos[i + k]); }
  acc.push({ bufferView: add(mesh.pos, 34962), componentType: 5126, count: nv, type: "VEC3", min: mn, max: mx });
  acc.push({ bufferView: add(mesh.nrm, 34962), componentType: 5126, count: nv, type: "VEC3" });
  acc.push({ bufferView: add(mesh.uv, 34962), componentType: 5126, count: nv, type: "VEC2" });
  acc.push({ bufferView: add(mesh.idx, 34963), componentType: 5125, count: mesh.idx.length, type: "SCALAR" });
  const json = { asset: { version: "2.0", generator: "Pixel Scape Terrain Lab" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: name || "Terrain" }],
    meshes: [{ name: name || "Terrain", primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{ name: "Satellite photo", pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 } }], accessors: acc, bufferViews: views };
  if (image) {
    const iv = add(image.bytes); json.images = [{ bufferView: iv, mimeType: image.mime || "image/jpeg" }];
    json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }]; json.textures = [{ source: 0, sampler: 0 }];
    json.materials[0].pbrMetallicRoughness.baseColorTexture = { index: 0 };
  }
  json.buffers = [{ byteLength: off }];
  const enc = (s) => (typeof TextEncoder !== "undefined" ? new TextEncoder().encode(s) : Buffer.from(s, "utf8"));
  let js = enc(JSON.stringify(json)); const jpad = (4 - (js.length % 4)) % 4; if (jpad) { const t = new Uint8Array(js.length + jpad); t.set(js); t.fill(0x20, js.length); js = t; }
  const total = 12 + 8 + js.length + 8 + off, out = new Uint8Array(total), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, js.length, true); dv.setUint32(16, 0x4e4f534a, true); out.set(js, 20);
  let o = 20 + js.length; dv.setUint32(o, off, true); dv.setUint32(o + 4, 0x004e4942, true); o += 8;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

// 16-bit heightmap values 0..65535 across [min, max] (encode with png.encodeGray16)
function heightValues(dem) { const span = dem.max - dem.min || 1, v = new Float32Array(dem.h.length); for (let i = 0; i < v.length; i++) v[i] = (dem.h[i] - dem.min) / span * 65535; return v; }

function info(o) {
  return {
    pixelScapeTerrain: 1, name: o.name, made: new Date().toISOString(), app: o.app || "",
    centre: { lat: +o.box.lat.toFixed(6), lon: +o.box.lon.toFixed(6) }, sizeM: { w: Math.round(o.box.w), d: Math.round(o.box.d) }, turnDeg: o.box.turn || 0,
    heightM: { min: +o.dem.min.toFixed(1), max: +o.dem.max.toFixed(1) }, heightScale: o.exag || 1,
    elevation: { source: o.dem.source, zoom: o.dem.z, groundStepM: +o.dem.pixelM.toFixed(1), gridN: o.dem.n },
    photo: o.photo ? { source: "Sentinel-2 L2A true colour", dates: o.photo.dates, px: [o.photo.w, o.photo.h] } : null,
    files: o.files || [], credits: [o.dem.credit].concat(o.photo ? [o.photo.credit] : []),
    units: "metres; glTF is Y up, x east, z south, centred on the box"
  };
}

module.exports = { BAND, addBand, resample, smooth, grid, normals, glb, heightValues, info };
