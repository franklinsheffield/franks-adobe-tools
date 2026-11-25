"use strict";
// ======================================================================
// Dithers Lab 3.0: Modulation and Pattern threshold tiles (from Frank's
// reference video, 2026-11-25). Each algorithm is a periodic tile of
// threshold values. The tile is rank-equalised so a flat d% grey prints
// about d% ink, then used like an ordered (Bayer) map.
//   Modulation: lines whose width follows tone (CRT-like), column, tilt,
//               dispersed (each cell picks its own angle), circuit (traces
//               that turn at right angles, with pads)
//   Pattern:    variable hatch (hatch in highlights, checker in mids, solid
//               shadows), brick, knit, serpentine, stitch, star, grid,
//               clock, cyber
// ======================================================================
const PI = Math.PI, TAU = 2 * Math.PI;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const tri = (t) => { t -= Math.floor(t); return Math.abs(2 * t - 1); };   // 1 on the line, 0 half way between
const BAYER8 = (() => { const m = [0]; let n = 1; let cur = [0]; while (n < 8) { const nx = new Array(4 * n * n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = cur[y * n + x] * 4; nx[y * 2 * n + x] = v; nx[y * 2 * n + x + n] = v + 2; nx[(y + n) * 2 * n + x] = v + 3; nx[(y + n) * 2 * n + x + n] = v + 1; } cur = nx; n *= 2; } return cur.map((v) => (v + 0.5) / 64); })();
const bay = (x, y) => BAYER8[(y & 7) * 8 + (x & 7)];

// raw "ink first" functions: low value = inked first. p = cell size in px.
const RAW = {
  modlines: (x, y, p) => 1 - tri(y / p + 0.5) + bay(x, y) * 1e-3,
  modcolumn: (x, y, p) => 1 - tri(x / p + 0.5) + bay(x, y) * 1e-3,
  modtilt: (x, y, p) => 1 - tri((x + y) / (p * 1.4142) + 0.5) + bay(x, y) * 1e-3,
  moddisp: (x, y, p) => {
    const q = p * 3, cx = Math.floor(x / q), cy = Math.floor(y / q), a = Math.floor(hash(cx, cy, 3) * 4) * PI / 4;
    const v = (-x * Math.sin(a) + y * Math.cos(a)) / p;
    return 1 - tri(v + 0.5) + bay(x, y) * 1e-3;
  },
  circuit: (x, y, p) => {
    const q = p * 2, cx = Math.floor(x / q), cy = Math.floor(y / q), u = x / q - cx, v = y / q - cy;
    const horiz = hash(cx, cy, 7) < 0.5;
    let d = horiz ? Math.abs(v - 0.5) : Math.abs(u - 0.5);          // the trace through the cell
    const pad = Math.hypot(u - 0.5, v - 0.5);
    if (hash(cx, cy, 9) < 0.25) d = Math.min(d, Math.max(0, pad - 0.12) * 1.2);   // solder pad
    if (hash(cx, cy, 11) < 0.35) d = Math.min(d, horiz ? Math.abs(u - 0.5) + Math.max(0, 0.5 - v) : Math.abs(v - 0.5) + Math.max(0, 0.5 - u)); // turn
    return d * 2 + bay(x, y) * 1e-3;
  },
  vhatch: (x, y, p) => {
    const k = Math.max(2, Math.round(p / 2));
    if (((x + y) % (2 * k)) === 0) return 0.05 + bay(x, y) * 0.2;                 // diagonal hatch: lightest tones
    if (((x + y) & 1) === 0) return 0.3 + bay(x, y) * 0.25;                        // checker: mid tones
    return 0.6 + bay(x, y) * 0.4;                                                  // fill: shadows
  },
  brick: (x, y, p) => {
    const bh = Math.max(3, Math.round(p)), bw = bh * 2, row = Math.floor(y / bh), off = (row & 1) ? bw / 2 : 0;
    const my = y % bh, mx = (x + off) % bw;
    const edge = Math.min(my, bh - 1 - my, mx, bw - 1 - mx);
    return edge === 0 ? 0.02 + bay(x, y) * 0.1 : 0.15 + (edge / (bh / 2)) * 0.5 + bay(x, y) * 0.35;
  },
  knit: (x, y, p) => 1 - tri(y / p + Math.abs((x / p) % 1 - 0.5) * 1.2 + 0.5) + bay(x, y) * 1e-3,
  serpent: (x, y, p) => 1 - tri(y / p + 0.35 * Math.sin(TAU * x / (p * 2.5)) + 0.5) + bay(x, y) * 1e-3,
  stitchv: (x, y, p) => { const d = 1 - tri(x / p + 0.5), g = ((y / p) % 1) < 0.25 ? 0.6 : 0; return clamp(d + g, 0, 1.6) + bay(x, y) * 1e-3; },
  stitchh: (x, y, p) => { const d = 1 - tri(y / p + 0.5), g = ((x / p) % 1) < 0.25 ? 0.6 : 0; return clamp(d + g, 0, 1.6) + bay(x, y) * 1e-3; },
  star: (x, y, p) => {
    const q = p * 1.5, u = (x / q) % 1 * 2 - 1, v = (y / q) % 1 * 2 - 1, r = Math.hypot(u, v), a = Math.atan2(v, u);
    return r * (0.65 + 0.35 * Math.cos(4 * a)) + bay(x, y) * 1e-3;
  },
  grid: (x, y, p) => 1 - Math.max(tri(x / p), tri(y / p)) + bay(x, y) * 0.05,
  clock: (x, y, p) => {
    const q = p * 2, u = (x / q) % 1 - 0.5, v = (y / q) % 1 - 0.5, a = (Math.atan2(v, u) + PI) / TAU;
    return tri(a * 12) * 0.7 + Math.hypot(u, v) * 0.6 + bay(x, y) * 1e-3;
  },
  cyber: (x, y, p) => {
    const col = Math.floor(x / Math.max(2, p / 2)), seg = Math.floor((y + hash(col, 0, 5) * 97) / (p * 2.5));
    const len = hash(col, seg, 13), within = ((y + hash(col, 0, 5) * 97) / (p * 2.5)) % 1;
    return (within < 0.15 + len * 0.7 ? len * 0.5 : 0.5 + len * 0.5) + bay(x, y) * 0.08;
  }
};

const PATTERNS = [
  { id: "modlines", name: "Modulation Lines (CRT)", group: "Modulation" },
  { id: "modcolumn", name: "Modulation Columns", group: "Modulation" },
  { id: "modtilt", name: "Modulation Tilt", group: "Modulation" },
  { id: "moddisp", name: "Dispersed Modulation", group: "Modulation" },
  { id: "circuit", name: "Circuit Modulation", group: "Modulation" },
  { id: "vhatch", name: "Variable Hatch", group: "Pattern" },
  { id: "brick", name: "Brick Block", group: "Pattern" },
  { id: "knit", name: "Knit", group: "Pattern" },
  { id: "serpent", name: "Serpentine", group: "Pattern" },
  { id: "stitchv", name: "Vertical Stitch", group: "Pattern" },
  { id: "stitchh", name: "Horizontal Stitch", group: "Pattern" },
  { id: "star", name: "Star", group: "Pattern" },
  { id: "grid", name: "Grid", group: "Pattern" },
  { id: "clock", name: "Clock", group: "Pattern" },
  { id: "cyber", name: "Cyber", group: "Pattern" }
];

// tile period: every pattern repeats within LCM-friendly sizes; random ones use a big tile
const cache = new Map();
function tile(id, p) {
  p = Math.max(2, Math.round(p));
  const key = id + ":" + p;
  if (cache.has(key)) return cache.get(key);
  const f = RAW[id] || RAW.modlines;
  const n = clamp(p * 24, 48, 480);                     // tile edge in px
  const raw = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) raw[y * n + x] = f(x, y, p);
  // rank-equalise: sort indexes by raw value, thresholds become (rank + 0.5) / N
  const idx = new Uint32Array(n * n); for (let i = 0; i < idx.length; i++) idx[i] = i;
  idx.sort((a, b) => raw[a] - raw[b]);
  const m = new Float32Array(n * n), N = idx.length;
  for (let r = 0; r < N; r++) m[idx[r]] = (r + 0.5) / N;
  const t = { n, m };
  if (cache.size > 40) cache.clear();
  cache.set(key, t);
  return t;
}

module.exports = { PATTERNS, tile, _internal: { RAW } };
