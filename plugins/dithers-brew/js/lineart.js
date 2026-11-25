"use strict";
// ======================================================================
// Line Art family (Dithers Brew 1.1): line-modulation screens, contour
// lines, spiral / ripple screens and blue-noise stipple. Pure JS and
// deterministic. Every generator maps demand (0..255, 255 = full ink)
// to a 1-bit ink mask, and the tone-true ones print ~d% ink for a flat
// d% grey (a line of width d inside each period).
// ======================================================================
const PI = Math.PI, TAU = 2 * Math.PI;

const LINE_ART = [
  { id: "wavescan",   name: "Wave Scan (line art)",      bend: true,  tone: true },
  { id: "waveamp",    name: "Wave Amplitude (line art)", bend: true,  tone: true },
  { id: "lineweight", name: "Line Weight (engraving)",   bend: false, tone: true },
  { id: "contour",    name: "Contour Lines",             bend: false, tone: false },
  { id: "spiral",     name: "Spiral Screen",             bend: false, tone: true },
  { id: "ripple",     name: "Ripple Screen",             bend: false, tone: true },
  { id: "stipple",    name: "Stipple (blue noise)",      bend: false, tone: true },
  { id: "crosswave",  name: "Crosswave",                 bend: true,  tone: true }
];

const TUNE_DEFAULTS = { threshold: 50, strength: 100, direction: "h", weight: 2, spacing: 6, jitter: 0 };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
// triangle wave: 1 at whole numbers, 0 half way; uniform over a period
function tri(t) { t -= Math.floor(t); return Math.abs(2 * t - 1); }

// separable box blur of a 0..255 plane -> Float32 0..1
function blurPlane(src, w, h, r) {
  const n = w * h, out = new Float32Array(n);
  r = Math.max(0, Math.round(r));
  if (r < 1) { for (let i = 0; i < n; i++) out[i] = src[i] / 255; return out; }
  const tmp = new Float32Array(n), win = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let s = 0;
    for (let k = -r; k <= r; k++) s += src[o + clamp(k, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[o + x] = s / win;
      s += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let k = -r; k <= r; k++) s += tmp[clamp(k, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / win / 255;
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

// (x, y) -> [a along the lines, b across them]
function axes(dir, w, h) {
  const cx = w / 2, cy = h / 2, R2 = Math.SQRT1_2;
  if (dir === "v") return (x, y) => [x, y];
  if (dir === "d") return (x, y) => [(x - y) * R2, (x + y) * R2];
  if (dir === "r") return (x, y) => { const dx = x - cx, dy = y - cy, r = Math.sqrt(dx * dx + dy * dy); return [Math.atan2(dy, dx) * Math.max(r, 1), r]; };
  return (x, y) => [y, x]; // "h": stripes run top to bottom, wiggle sideways
}

// ---------------------------------------------------------------- blue noise
let blueCache = null;
function blueNoise() {
  if (blueCache) return blueCache;
  const N = 64, n = N * N, R = 4, sig2 = 2 * 1.6 * 1.6;
  const energy = new Float64Array(n), used = new Uint8Array(n), rank = new Float32Array(n);
  const ker = [];
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) ker.push([dx, dy, Math.exp(-(dx * dx + dy * dy) / sig2)]);
  // seeded tiny offsets so ties break the same way on every machine
  for (let i = 0; i < n; i++) { let s = (i * 2654435761) >>> 0; s ^= s >>> 13; energy[i] = (s % 1000) * 1e-9; }
  for (let k = 0; k < n; k++) {
    let best = -1, be = Infinity;
    for (let i = 0; i < n; i++) if (!used[i] && energy[i] < be) { be = energy[i]; best = i; }
    used[best] = 1; rank[best] = (k + 0.5) / n;
    const bx = best % N, by = (best / N) | 0;
    for (const [dx, dy, g] of ker) energy[((by + dy + N) % N) * N + ((bx + dx + N) % N)] += g;
  }
  blueCache = { m: rank, n: N };
  return blueCache;
}

// ---------------------------------------------------------------- generators
function lineInk(demand, w, h, id, T, lsc) {
  T = Object.assign({}, TUNE_DEFAULTS, T || {});
  const n = w * h, out = new Uint8Array(n);
  const P = Math.max(2, (T.spacing || 6) * (lsc || 1));
  const st = clamp(T.strength, 0, 100) / 100, wt = clamp(T.weight, 1, 8);
  const ax = axes(T.direction, w, h);
  const D = (id === "wavescan" || id === "waveamp" || id === "contour" || id === "crosswave") ? blurPlane(demand, w, h, P * 0.5) : null;

  if (id === "stipple") {
    const B = blueNoise(), N = B.n;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (demand[i] / 255 > B.m[(y % N) * N + (x % N)]) out[i] = 255;
    }
    return out;
  }
  const cx = w / 2, cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, d = demand[i] / 255;
      let on = false;
      if (id === "spiral" || id === "ripple") {
        const dx = x - cx, dy = y - cy, r = Math.sqrt(dx * dx + dy * dy);
        const t = r / P + (id === "spiral" ? Math.atan2(dy, dx) / TAU : 0);
        on = tri(t) < d;
      } else if (id === "crosswave") {
        const c = 1 - Math.sqrt(Math.max(0, 1 - d)), bend = st * wt * 0.25 * D[i];
        on = tri((x + 0.5) / P + bend) < c || tri((y + 0.5) / P + bend) < c;
      } else if (id === "contour") {
        const L = 2 + wt * 2;
        on = D[i] > 0.02 && tri(D[i] * L + 0.5) > 1 - (0.06 + 0.14 * st);
      } else {
        const ab = ax(x + 0.5, y + 0.5), a = ab[0], b = ab[1];
        if (id === "wavescan") on = tri(b / P + st * wt * 0.8 * D[i]) < d;
        else if (id === "waveamp") on = tri((b + st * wt * 0.5 * P * D[i] * Math.sin(TAU * a / (P * 3))) / P) < d;
        else on = tri(b / P) < d; // lineweight
      }
      if (on) out[i] = 255;
    }
  }
  return out;
}

// threshold sampler for palette (Grade) mode: ink where d > thr(x, y)
function lineThr(id, T, w, h, lsc) {
  T = Object.assign({}, TUNE_DEFAULTS, T || {});
  const P = Math.max(2, (T.spacing || 6) * (lsc || 1));
  if (id === "stipple") { const B = blueNoise(), N = B.n; return (x, y) => B.m[(y % N) * N + (x % N)]; }
  const cx = w / 2, cy = h / 2;
  if (id === "spiral" || id === "ripple") return (x, y) => {
    const dx = x - cx, dy = y - cy;
    return tri(Math.sqrt(dx * dx + dy * dy) / P + (id === "spiral" ? Math.atan2(dy, dx) / TAU : 0));
  };
  const ax = axes(T.direction, w, h);
  return (x, y) => tri(ax(x + 0.5, y + 0.5)[1] / P);
}

module.exports = { LINE_ART, TUNE_DEFAULTS, lineInk, lineThr, blueNoise, tri, blurPlane };
