"use strict";
// ======================================================================
// Frank's Dithers Brew - pixel engine (pure JS, no Photoshop calls)
//
//   render(src, P, hooks)  ->  { w, h, layers[], paper, notes[] }
//   composite(result, bg)  ->  Uint8Array RGB for the preview
//
// src  = { w, h, c (1|3|4 components), data: Uint8Array }
// P    = settings object shaped like state.DEFAULTS plus P.ppi / P.scale
// Every layer = { name, color:[r,g,b], mask:Uint8Array(0..255 ink), blend }
// ======================================================================
const ASCII = require("./ascii.js");
const ASCII3 = require("./ascii3.js");
const LA = require("./lineart.js");

const PI = Math.PI;
const SQ3 = Math.sqrt(3);

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function hexToRgb(h) {
  h = String(h || "").trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(c) {
  return "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function isHex(h) { return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(h || "").trim()); }
function luma(c) { return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; }
function hash2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// ----------------------------------------------------------------------
// Catalogues
// ----------------------------------------------------------------------
const SCREENS = [
  { id: "round",   name: "Round Dot" },
  { id: "ellipse", name: "Ellipse" },
  { id: "diamond", name: "Diamond" },
  { id: "square",  name: "Square" },
  { id: "line",    name: "Line" },
  { id: "cross",   name: "Cross-hatch" },
  { id: "hex",     name: "Hex Dots" },
  { id: "rings",   name: "Concentric Rings" },
  { id: "wave",    name: "Wavy Line" },
  { id: "checker", name: "Checker Dot" },
  { id: "grain",   name: "Xerox Grain" }
];

const KERNELS = {
  fs:      { d: 16, k: [[1,0,7],[-1,1,3],[0,1,5],[1,1,1]] },
  atk:     { d: 8,  k: [[1,0,1],[2,0,1],[-1,1,1],[0,1,1],[1,1,1],[0,2,1]] },
  jjn:     { d: 48, k: [[1,0,7],[2,0,5],[-2,1,3],[-1,1,5],[0,1,7],[1,1,5],[2,1,3],[-2,2,1],[-1,2,3],[0,2,5],[1,2,3],[2,2,1]] },
  stu:     { d: 42, k: [[1,0,8],[2,0,4],[-2,1,2],[-1,1,4],[0,1,8],[1,1,4],[2,1,2],[-2,2,1],[-1,2,2],[0,2,4],[1,2,2],[2,2,1]] },
  bur:     { d: 32, k: [[1,0,8],[2,0,4],[-2,1,2],[-1,1,4],[0,1,8],[1,1,4],[2,1,2]] },
  sl:      { d: 4,  k: [[1,0,2],[-1,1,1],[0,1,1]] },
  sierra3: { d: 32, k: [[1,0,5],[2,0,3],[-2,1,2],[-1,1,4],[0,1,5],[1,1,4],[2,1,2],[-1,2,2],[0,2,3],[1,2,2]] },
  sierra2: { d: 16, k: [[1,0,4],[2,0,3],[-2,1,1],[-1,1,2],[0,1,3],[1,1,2],[2,1,1]] }
};

const DITHERS = [
  { id: "fs",      name: "Floyd-Steinberg",           t: "ed", k: "fs" },
  { id: "fsj",     name: "Floyd-Steinberg (jittered)", t: "ed", k: "fs", jit: 0.35 },
  { id: "atk",     name: "Atkinson (classic Mac)",    t: "ed", k: "atk" },
  { id: "jjn",     name: "Jarvis-Judice-Ninke",       t: "ed", k: "jjn" },
  { id: "stu",     name: "Stucki",                    t: "ed", k: "stu" },
  { id: "bur",     name: "Burkes",                    t: "ed", k: "bur" },
  { id: "sl",      name: "Sierra Lite",               t: "ed", k: "sl" },
  { id: "sierra3", name: "Sierra",                    t: "ed", k: "sierra3" },
  { id: "sierra2", name: "Sierra Two-Row",            t: "ed", k: "sierra2" },
  { id: "b2",      name: "Bayer 2x2 (ordered)",       t: "ord", map: { type: "bayer", n: 2 } },
  { id: "b4",      name: "Bayer 4x4 (ordered)",       t: "ord", map: { type: "bayer", n: 4 } },
  { id: "b8",      name: "Bayer 8x8 (ordered)",       t: "ord", map: { type: "bayer", n: 8 } },
  { id: "b16",     name: "Bayer 16x16 (ordered)",     t: "ord", map: { type: "bayer", n: 16 } },
  { id: "c4",      name: "Clustered Dot 4x4",         t: "ord", map: { type: "cluster", n: 4, kind: "round" } },
  { id: "c8",      name: "Clustered Dot 8x8",         t: "ord", map: { type: "cluster", n: 8, kind: "round" } },
  { id: "d8",      name: "Diamond Cluster 8x8",       t: "ord", map: { type: "cluster", n: 8, kind: "diamond" } },
  { id: "l6",      name: "Line Cluster 6x6",          t: "ord", map: { type: "cluster", n: 6, kind: "line" } },
  { id: "ign",     name: "Gradient Noise (stochastic)", t: "ign" },
  { id: "white",   name: "White Noise (grain)",       t: "white" },
  { id: "thr",     name: "Hard Threshold",            t: "thr" }
].concat(LA.LINE_ART.map((l) => ({ id: l.id, name: l.name, t: "line" })));
const DITHER_BY_ID = {};
DITHERS.forEach((d) => { DITHER_BY_ID[d.id] = d; });

// ----------------------------------------------------------------------
// Screen spot functions on the unit cell (u,v in 0..1, low value = inked first)
// ----------------------------------------------------------------------
const SPOTS = {
  round:   (u, v) => { const x = 2 * u - 1, y = 2 * v - 1; return 0.5 * (1 - 0.5 * (Math.cos(PI * x) + Math.cos(PI * y))); },
  ellipse: (u, v) => { const x = 2 * u - 1, y = 2 * v - 1; return (0.6 * x * x + y * y) / 1.6; },
  diamond: (u, v) => (Math.abs(2 * u - 1) + Math.abs(2 * v - 1)) / 2,
  square:  (u, v) => Math.max(Math.abs(2 * u - 1), Math.abs(2 * v - 1)),
  line:    (u, v) => Math.abs(2 * v - 1),
  cross:   (u, v) => Math.min(Math.abs(2 * u - 1), Math.abs(2 * v - 1)),
  rings:   (u, v) => { const x = 2 * u - 1, y = 2 * v - 1; const t = Math.sqrt(x * x + y * y) / 1.41421356 * 2.5; return Math.abs((t - Math.floor(t)) - 0.5) * 2; },
  wave:    (u, v) => { const x = 2 * u - 1, y = 2 * v - 1; return Math.min(1, Math.abs(y + 0.4 * Math.sin(PI * x)) / 1.4); },
  checker: (u, v) => { const x = 2 * u - 1, y = 2 * v - 1; return (1 - Math.cos(PI * x) * Math.cos(PI * y)) / 2; },
  hex: (u, v) => {
    const X = u, Y = v * SQ3;
    let d = 1e9;
    const P = [[0, 0], [1, 0], [0.5, SQ3 / 2], [0, SQ3], [1, SQ3]];
    for (let i = 0; i < P.length; i++) { const dx = X - P[i][0], dy = Y - P[i][1]; const dd = dx * dx + dy * dy; if (dd < d) d = dd; }
    return Math.min(1, Math.sqrt(d) / 0.57735);
  }
};
SPOTS.grain = SPOTS.round;
const SCREEN_VS = { hex: SQ3 };

// spot value -> exact tone percentile, so 50% grey really prints ~50% ink
const rankCache = {};
function rankLUT(kind) {
  if (rankCache[kind]) return rankCache[kind];
  const N = 2048, M = 160, hist = new Float64Array(N), f = SPOTS[kind];
  for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
    const val = clamp(f((i + 0.5) / M, (j + 0.5) / M), 0, 1);
    hist[Math.min(N - 1, Math.floor(val * N))]++;
  }
  const lut = new Float32Array(N), tot = M * M;
  let acc = 0;
  for (let b = 0; b < N; b++) { lut[b] = (acc + hist[b] * 0.5) / tot; acc += hist[b]; }
  rankCache[kind] = lut;
  return lut;
}

// ----------------------------------------------------------------------
// Threshold maps for ordered dithering
// ----------------------------------------------------------------------
const mapCache = {};
function bayerMap(n) {
  const key = "b" + n;
  if (mapCache[key]) return mapCache[key];
  let m = [[0]], s = 1;
  while (s < n) {
    const nm = [];
    for (let y = 0; y < s * 2; y++) {
      nm[y] = [];
      for (let x = 0; x < s * 2; x++) {
        const add = (y < s) ? ((x < s) ? 0 : 2) : ((x < s) ? 3 : 1);
        nm[y][x] = m[y % s][x % s] * 4 + add;
      }
    }
    m = nm; s *= 2;
  }
  const out = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) out[y * n + x] = (m[y][x] + 0.5) / (n * n);
  mapCache[key] = out;
  return out;
}
function clusterMap(n, kind) {
  const key = "c" + n + kind;
  if (mapCache[key]) return mapCache[key];
  const arr = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    arr.push({ i: y * n + x, f: SPOTS[kind]((x + 0.5) / n, (y + 0.5) / n) + 1e-7 * (y * n + x) });
  }
  arr.sort((a, b) => a.f - b.f);
  const out = new Float32Array(n * n);
  arr.forEach((o, r) => { out[o.i] = (r + 0.5) / (n * n); });
  mapCache[key] = out;
  return out;
}
function mapFor(D) {
  return D.map.type === "bayer" ? { m: bayerMap(D.map.n), n: D.map.n } : { m: clusterMap(D.map.n, D.map.kind), n: D.map.n };
}

// ----------------------------------------------------------------------
// Resampling helpers
// ----------------------------------------------------------------------
function downBox(src, w, h, w2, h2) {
  const out = new Uint8Array(w2 * h2);
  const xb = new Int32Array(w2 + 1), yb = new Int32Array(h2 + 1);
  for (let i = 0; i <= w2; i++) xb[i] = Math.min(w, Math.floor(i * w / w2));
  for (let j = 0; j <= h2; j++) yb[j] = Math.min(h, Math.floor(j * h / h2));
  for (let j = 0; j < h2; j++) {
    for (let i = 0; i < w2; i++) {
      let sum = 0, cnt = 0;
      const y1 = Math.max(yb[j + 1], yb[j] + 1), x1 = Math.max(xb[i + 1], xb[i] + 1);
      for (let y = yb[j]; y < y1 && y < h; y++) {
        const r = y * w;
        for (let x = xb[i]; x < x1 && x < w; x++) { sum += src[r + x]; cnt++; }
      }
      out[j * w2 + i] = cnt ? (sum / cnt + 0.5) | 0 : 0;
    }
  }
  return out;
}
function upNearest(src, w2, h2, w, h) {
  const out = new Uint8Array(w * h);
  const sx = new Int32Array(w);
  for (let x = 0; x < w; x++) sx[x] = Math.min(w2 - 1, Math.floor(x * w2 / w));
  for (let y = 0; y < h; y++) {
    const r = Math.min(h2 - 1, Math.floor(y * h2 / h)) * w2, o = y * w;
    for (let x = 0; x < w; x++) out[o + x] = src[r + sx[x]];
  }
  return out;
}

// ----------------------------------------------------------------------
// Ink generators:  demand (0..255, 255 = full ink)  ->  ink mask (0..255)
// ----------------------------------------------------------------------
function screenInk(demand, w, h, kind, cellPx, angle, aa, phase) {
  const out = new Uint8Array(w * h);
  const lut = rankLUT(kind), N = lut.length, spot = SPOTS[kind];
  const th = angle * PI / 180, c = Math.cos(th), s = Math.sin(th);
  const cp = Math.max(1.5, cellPx);
  const iu = 1 / cp, iv = 1 / (cp * (SCREEN_VS[kind] || 1));
  const ox = phase ? phase[0] : 0, oy = phase ? phase[1] : 0;
  const grain = kind === "grain";
  const k = cp * 0.8;
  for (let y = 0; y < h; y++) {
    const py = y + oy, row = y * w;
    for (let x = 0; x < w; x++) {
      const d0 = demand[row + x];
      if (d0 === 0) continue;
      const pxx = x + ox;
      const u = (pxx * c + py * s) * iu, v = (-pxx * s + py * c) * iv;
      const fu = u - Math.floor(u), fv = v - Math.floor(v);
      let thr = lut[(spot(fu, fv) * (N - 1) + 0.5) | 0];
      if (grain) thr = clamp(thr + (hash2(x, y, 7) - 0.5) * 0.32, 0.0005, 0.9995);
      const d = d0 / 255;
      if (aa) {
        const a = d * (k + 1) - thr * k;
        out[row + x] = a <= 0 ? 0 : (a >= 1 ? 255 : (a * 255) | 0);
      } else if (d > thr) out[row + x] = 255;
    }
  }
  return out;
}

function diffuseMono(demand, w, h, K, jit, seed, strength) {
  const est = strength == null ? 1 : strength;
  const n = w * h, buf = new Float32Array(n), out = new Uint8Array(n);
  for (let i = 0; i < n; i++) buf[i] = demand[i];
  const kd = K.k, kl = kd.length, div = K.d;
  for (let y = 0; y < h; y++) {
    const rev = (y & 1) === 1;
    const xs = rev ? w - 1 : 0, xe = rev ? -1 : w, st = rev ? -1 : 1;
    for (let x = xs; x !== xe; x += st) {
      const idx = y * w + x, old = buf[idx];
      let thr = 127.5;
      if (jit) thr += (hash2(x, y, seed) - 0.5) * jit * 255;
      const nv = old >= thr ? 255 : 0;
      out[idx] = nv;
      const err = est === 1 ? (old - nv) / div : (old - nv) * est / div;
      if (err === 0) continue;
      for (let k = 0; k < kl; k++) {
        const e = kd[k];
        const nx = x + (rev ? -e[0] : e[0]), ny = y + e[1];
        if (nx >= 0 && nx < w && ny < h) buf[ny * w + nx] += err * e[2];
      }
    }
  }
  return out;
}

function ditherInk(demand, w, h, D, phase, T, lsc) {
  const n = w * h, out = new Uint8Array(n);
  const ox = phase ? phase[0] : 0, oy = phase ? phase[1] : 0;
  const st = T && T.strength != null ? clamp(T.strength, 0, 100) / 100 : 1;
  if (D.t === "line") return LA.lineInk(demand, w, h, D.id, T, lsc);
  if (D.t === "ed") return diffuseMono(demand, w, h, KERNELS[D.k], D.jit || 0, 11 + ox, st);
  if (D.t === "ord") {
    const M = mapFor(D), sz = M.n;
    const jit = T && T.jitter ? clamp(T.jitter, 0, 100) / 100 : 0;
    const plain = st === 1 && !jit;
    for (let y = 0; y < h; y++) {
      const ry = ((y + oy) % sz) * sz;
      for (let x = 0; x < w; x++) {
        let t = M.m[ry + ((x + ox) % sz)];
        if (!plain) { t = 0.5 + (t - 0.5) * st; if (jit) t += (hash2(x, y, 23 + ox) - 0.5) * jit; }
        if (demand[y * w + x] / 255 > t) out[y * w + x] = 255;
      }
    }
    return out;
  }
  if (D.t === "ign") {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let f = 0.06711056 * (x + ox) + 0.00583715 * (y + oy);
      f -= Math.floor(f);
      let r = 52.9829189 * f;
      r -= Math.floor(r);
      if (demand[y * w + x] / 255 > r) out[y * w + x] = 255;
    }
    return out;
  }
  if (D.t === "white") {
    for (let i = 0; i < n; i++) if (demand[i] / 255 > hash2(i % w, (i / w) | 0, 5 + ox)) out[i] = 255;
    return out;
  }
  for (let i = 0; i < n; i++) out[i] = demand[i] >= 128 ? 255 : 0;
  return out;
}

// threshold sampler (0..1) for engines that can drive palette dithering
function makeThr(E, angle) {
  if (E.engine === "halftone") {
    const kind = E.algo, lut = rankLUT(kind), N = lut.length, spot = SPOTS[kind];
    const th = angle * PI / 180, c = Math.cos(th), s = Math.sin(th);
    const cp = Math.max(1.5, E.cellPx), iu = 1 / cp, iv = 1 / (cp * (SCREEN_VS[kind] || 1));
    return (x, y) => {
      const u = (x * c + y * s) * iu, v = (-x * s + y * c) * iv;
      let t = lut[(spot(u - Math.floor(u), v - Math.floor(v)) * (N - 1) + 0.5) | 0];
      if (kind === "grain") t = clamp(t + (hash2(x, y, 7) - 0.5) * 0.32, 0, 1);
      return t;
    };
  }
  const D = DITHER_BY_ID[E.algo] || DITHERS[0];
  if (D.t === "line") return LA.lineThr(D.id, E.tune, (E.w || 512) / (E.ps > 1.01 ? E.ps : 1), (E.h || 512) / (E.ps > 1.01 ? E.ps : 1), E.lsc);
  if (D.t === "ord") {
    const M = mapFor(D), sz = M.n;
    return (x, y) => M.m[(y % sz) * sz + (x % sz)];
  }
  if (D.t === "ign") return (x, y) => { let f = 0.06711056 * x + 0.00583715 * y; f -= Math.floor(f); const r = 52.9829189 * f; return r - Math.floor(r); };
  if (D.t === "white") return (x, y) => hash2(x, y, 5);
  return () => 0.5;
}

function inkFromPlane(demand, w, h, E, angle, phase, asc) {
  const thr = E.tune && E.tune.threshold != null ? E.tune.threshold : 50;
  if (thr !== 50) {
    const sh = (50 - thr) * 2.55, d2 = new Uint8Array(demand.length);
    for (let i = 0; i < demand.length; i++) d2[i] = demand[i] ? clamp(demand[i] + sh, 0, 255) : 0;
    demand = d2;
  }
  if (E.engine === "halftone") return screenInk(demand, w, h, E.algo, E.cellPx, angle, E.aa, phase);
  if (E.engine === "ascii") return ASCII3.render(demand, w, h, asc);
  const D = DITHER_BY_ID[E.algo] || DITHERS[0];
  if (E.ps > 1.01) {
    const w2 = Math.max(2, Math.round(w / E.ps)), h2 = Math.max(2, Math.round(h / E.ps));
    const small = downBox(demand, w, h, w2, h2);
    return upNearest(ditherInk(small, w2, h2, D, phase, E.tune, E.lsc), w2, h2, w, h);
  }
  return ditherInk(demand, w, h, D, phase, E.tune, E.lsc);
}

// ----------------------------------------------------------------------
// Pre-processing
// ----------------------------------------------------------------------
function boxBlurRGB(src, w, h, r) {
  r = Math.round(r);
  if (r < 1) return src;
  const win = 2 * r + 1;
  const tmp = new Uint8Array(src.length), out = new Uint8Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let ch = 0; ch < 3; ch++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += src[(y * w + clamp(k, 0, w - 1)) * 3 + ch];
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 3 + ch] = (sum / win + 0.5) | 0;
        sum += src[(y * w + Math.min(w - 1, x + r + 1)) * 3 + ch] - src[(y * w + Math.max(0, x - r)) * 3 + ch];
      }
    }
  }
  for (let x = 0; x < w; x++) {
    for (let ch = 0; ch < 3; ch++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += tmp[(clamp(k, 0, h - 1) * w + x) * 3 + ch];
      for (let y = 0; y < h; y++) {
        out[(y * w + x) * 3 + ch] = (sum / win + 0.5) | 0;
        sum += tmp[(Math.min(h - 1, y + r + 1) * w + x) * 3 + ch] - tmp[(Math.max(0, y - r) * w + x) * 3 + ch];
      }
    }
  }
  return out;
}

function preprocess(rgb, w, h, pre, s) {
  const lut = new Uint8Array(256);
  const black = clamp(pre.black, 0, 250), white = Math.max(black + 1, clamp(pre.white, 1, 255));
  const gam = pre.gamma > 0.05 ? pre.gamma : 1;
  const ct = clamp(pre.contrast, -100, 100) * 2.55;
  const cf = (259 * (ct + 255)) / (255 * (259 - ct));
  for (let v = 0; v < 256; v++) {
    let t = clamp((v - black) / (white - black), 0, 1);
    t = Math.pow(t, 1 / gam);
    let x = t * 255;
    x = cf * (x - 128) + 128 + clamp(pre.brightness, -100, 100) * 1.28;
    if (pre.haze) { const hz = clamp(pre.haze, 0, 100) / 100 * 96; x = hz + x * (1 - hz / 255); }
    x = clamp(x, 0, 255);
    const inv = typeof pre.invert === "number" ? clamp(pre.invert, 0, 100) / 100 : (pre.invert ? 1 : 0);
    if (inv) x = x + (255 - 2 * x) * inv;
    lut[v] = (x + 0.5) | 0;
  }
  for (let i = 0; i < rgb.length; i++) rgb[i] = lut[rgb[i]];

  let work = rgb;
  const br = pre.blur * s;
  if (br >= 0.5) { work = boxBlurRGB(work, w, h, br); }
  if (pre.sharpen > 0) {
    const bl = boxBlurRGB(work, w, h, Math.max(1, Math.round((pre.radius || 1.5) * s)));
    const amt = pre.sharpen / 100 * 2;
    for (let i = 0; i < work.length; i++) work[i] = clamp(work[i] + amt * (work[i] - bl[i]), 0, 255);
  }
  if (pre.noise < 0) {
    const a = Math.min(100, -pre.noise) / 100, bl = boxBlurRGB(work, w, h, Math.max(1, Math.round(2 * s)));
    for (let i = 0; i < work.length; i++) work[i] = work[i] + (bl[i] - work[i]) * a;
  }
  if (pre.noise > 0) {
    const amp = pre.noise / 100 * 64;
    for (let i = 0, p = 0; i < w * h; i++, p += 3) {
      const nz = (hash2(i % w, (i / w) | 0, 3) - 0.5) * 2 * amp;
      work[p] = clamp(work[p] + nz, 0, 255); work[p + 1] = clamp(work[p + 1] + nz, 0, 255); work[p + 2] = clamp(work[p + 2] + nz, 0, 255);
    }
  }
  if (work !== rgb) rgb.set(work);
}

function lumPlane(rgb, n) {
  const out = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 3) out[i] = (rgb[j] * 77 + rgb[j + 1] * 150 + rgb[j + 2] * 29) >> 8;
  return out;
}

// ----------------------------------------------------------------------
// Mask operations (post FX)
// ----------------------------------------------------------------------
function morph(src, w, h, dilate, cross) {
  const out = new Uint8Array(src.length);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - 1) * w, y1 = y * w, y2 = Math.min(h - 1, y + 1) * w;
    for (let x = 0; x < w; x++) {
      const xl = Math.max(0, x - 1), xr = Math.min(w - 1, x + 1);
      let v = src[y1 + x];
      const a = src[y0 + x], b = src[y2 + x], c = src[y1 + xl], d = src[y1 + xr];
      if (dilate) {
        if (a > v) v = a; if (b > v) v = b; if (c > v) v = c; if (d > v) v = d;
        if (!cross) {
          const e = src[y0 + xl], f = src[y0 + xr], g = src[y2 + xl], hh = src[y2 + xr];
          if (e > v) v = e; if (f > v) v = f; if (g > v) v = g; if (hh > v) v = hh;
        }
      } else {
        if (a < v) v = a; if (b < v) v = b; if (c < v) v = c; if (d < v) v = d;
        if (!cross) {
          const e = src[y0 + xl], f = src[y0 + xr], g = src[y2 + xl], hh = src[y2 + xr];
          if (e < v) v = e; if (f < v) v = f; if (g < v) v = g; if (hh < v) v = hh;
        }
      }
      out[y1 + x] = v;
    }
  }
  return out;
}

function dotGain(mask, w, h, amount, s) {
  const iters = Math.min(8, Math.round(Math.abs(amount) * s));
  if (!iters) return mask;
  let m = mask;
  for (let i = 0; i < iters; i++) m = morph(m, w, h, amount > 0, i % 2 === 0);
  return m;
}

function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function distress(mask, w, h, amount, s, seed) {
  const th = clamp(amount, 0, 100) / 100 * 0.62;
  if (th <= 0) return mask;
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      const X = x / s, Y = y / s;
      const n = 0.45 * vnoise(X / 7, Y / 7, seed) + 0.3 * vnoise(X / 2.5, Y / 2.5, seed + 1) + 0.25 * hash2(x, y, seed + 2);
      const t = clamp((n - (th - 0.03)) / 0.06, 0, 1);
      out[i] = (mask[i] * t + 0.5) | 0;
    }
  }
  return out;
}

function removeSpecks(mask, w, h, minArea) {
  if (minArea <= 1) return mask;
  const n = w * h;
  const seen = new Uint8Array(n), queue = new Int32Array(n);
  let removed = 0;
  for (let i = 0; i < n; i++) {
    if (seen[i] || mask[i] < 128) continue;
    let qs = 0, qe = 0;
    queue[qe++] = i; seen[i] = 1;
    while (qs < qe) {
      const p = queue[qs++], x = p % w, y = (p / w) | 0;
      if (x > 0 && !seen[p - 1] && mask[p - 1] >= 128) { seen[p - 1] = 1; queue[qe++] = p - 1; }
      if (x < w - 1 && !seen[p + 1] && mask[p + 1] >= 128) { seen[p + 1] = 1; queue[qe++] = p + 1; }
      if (y > 0 && !seen[p - w] && mask[p - w] >= 128) { seen[p - w] = 1; queue[qe++] = p - w; }
      if (y < h - 1 && !seen[p + w] && mask[p + w] >= 128) { seen[p + w] = 1; queue[qe++] = p + w; }
    }
    if (qe < minArea) {
      removed++;
      for (let k = 0; k < qe; k++) {
        const p = queue[k], x = p % w, y = (p / w) | 0;
        mask[p] = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny * w + nx] < 128) mask[ny * w + nx] = 0;
        }
      }
    }
  }
  return mask;
}

function shiftMask(mask, w, h, dx, dy) {
  if (!dx && !dy) return mask;
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    const sy = y - dy;
    if (sy < 0 || sy >= h) continue;
    for (let x = 0; x < w; x++) {
      const sx = x - dx;
      if (sx >= 0 && sx < w) out[y * w + x] = mask[sy * w + sx];
    }
  }
  return out;
}

function edgeDemand(lum, w, h, edges, s) {
  const out = new Uint8Array(w * h);
  const gain = clamp(edges.strength, 0, 100) / 100 * 1.1;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = (lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1]) - (lum[i - w - 1] + 2 * lum[i - 1] + lum[i + w - 1]);
      const gy = (lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1]) - (lum[i - w - 1] + 2 * lum[i - w] + lum[i - w + 1]);
      out[i] = clamp(Math.sqrt(gx * gx + gy * gy) * gain * 0.6, 0, 255);
    }
  }
  let m = out;
  const it = Math.min(6, Math.round((edges.thick - 1) * s));
  for (let i = 0; i < it; i++) m = morph(m, w, h, true, false);
  // push soft edges to a decisive line
  for (let i = 0; i < m.length; i++) m[i] = clamp((m[i] - 40) * 2.2, 0, 255);
  return m;
}

function knockout(rgb, alpha, w, h, dtf) {
  const g = hexToRgb(dtf.garment);
  const f = clamp(dtf.fuzz, 0, 100) / 100 * 0.5;
  const fe = clamp(dtf.feather, 0, 100) / 100 * 0.5 + 0.004;
  const out = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < w * h; i++, p += 3) {
    if (!alpha[i]) continue;
    const dr = rgb[p] - g[0], dg = rgb[p + 1] - g[1], db = rgb[p + 2] - g[2];
    const d = Math.sqrt(dr * dr + dg * dg + db * db) / 441.673;
    let a = clamp((d - f) / fe, 0, 1);
    a = a * a * (3 - 2 * a);
    out[i] = (alpha[i] * a + 0.5) | 0;
  }
  return out;
}

// ----------------------------------------------------------------------
// Colour: CMYK split, palettes
// ----------------------------------------------------------------------
function cmykPlanes(rgb, n, gcr) {
  const C = new Uint8Array(n), M = new Uint8Array(n), Y = new Uint8Array(n), K = new Uint8Array(n);
  const g = clamp(gcr, 0, 100) / 100;
  for (let i = 0, p = 0; i < n; i++, p += 3) {
    const r = rgb[p] / 255, gg = rgb[p + 1] / 255, b = rgb[p + 2] / 255;
    const k0 = 1 - Math.max(r, gg, b);
    const k = k0 * g;
    const d = 1 - k;
    let c = 0, m = 0, y = 0;
    if (d > 1e-6) { c = (1 - r - k) / d; m = (1 - gg - k) / d; y = (1 - b - k) / d; }
    C[i] = clamp(c, 0, 1) * 255 + 0.5; M[i] = clamp(m, 0, 1) * 255 + 0.5; Y[i] = clamp(y, 0, 1) * 255 + 0.5; K[i] = clamp(k, 0, 1) * 255 + 0.5;
  }
  return { C, M, Y, K };
}

function medianCut(samples, k) {
  const boxes = [samples];
  while (boxes.length < k) {
    let bi = -1, best = -1, bch = 0;
    for (let b = 0; b < boxes.length; b++) {
      const box = boxes[b];
      if (box.length < 2) continue;
      const mn = [255, 255, 255], mx = [0, 0, 0];
      for (let i = 0; i < box.length; i++) for (let c = 0; c < 3; c++) { if (box[i][c] < mn[c]) mn[c] = box[i][c]; if (box[i][c] > mx[c]) mx[c] = box[i][c]; }
      for (let c = 0; c < 3; c++) {
        const score = (mx[c] - mn[c]) * Math.sqrt(box.length);
        if (score > best) { best = score; bi = b; bch = c; }
      }
    }
    if (bi < 0 || best <= 0) break;
    const box = boxes[bi];
    box.sort((a, b) => a[bch] - b[bch]);
    const mid = box.length >> 1;
    boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid));
  }
  return boxes.map((box) => {
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < box.length; i++) { r += box[i][0]; g += box[i][1]; b += box[i][2]; }
    const nn = Math.max(1, box.length);
    return [Math.round(r / nn), Math.round(g / nn), Math.round(b / nn)];
  }).sort((a, b) => luma(a) - luma(b));
}

function paletteFromImage(rgb, w, h, k) {
  const n = w * h, step = Math.max(1, Math.floor(n / 20000)), samples = [];
  for (let i = 0; i < n; i += step) samples.push([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]);
  return medianCut(samples, clamp(Math.round(k), 2, 24)).map(rgbToHex);
}

function mergeClosest(hexList) {
  if (hexList.length < 3) return hexList.slice();
  const cols = hexList.map(hexToRgb);
  let bi = 0, bj = 1, best = 1e18;
  for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) {
    const d = (cols[i][0] - cols[j][0]) ** 2 * 0.3 + (cols[i][1] - cols[j][1]) ** 2 * 0.59 + (cols[i][2] - cols[j][2]) ** 2 * 0.11;
    if (d < best) { best = d; bi = i; bj = j; }
  }
  const mid = [0, 1, 2].map((c) => Math.round((cols[bi][c] + cols[bj][c]) / 2));
  const out = [];
  hexList.forEach((hx, i) => { if (i === bi) out.push(rgbToHex(mid)); else if (i !== bj) out.push(hx); });
  return out;
}

function nearestFn(pal) {
  const np = pal.length, pr = new Float32Array(np), pg = new Float32Array(np), pb = new Float32Array(np);
  pal.forEach((c, i) => { pr[i] = c[0]; pg[i] = c[1]; pb[i] = c[2]; });
  return (r, g, b) => {
    let best = 0, bd = 1e18;
    for (let i = 0; i < np; i++) {
      const dr = r - pr[i], dg = g - pg[i], db = b - pb[i];
      const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
}

function gradeDiffuse(rgb, w, h, pal, K) {
  const np = pal.length, near = nearestFn(pal);
  const masks = pal.map(() => new Uint8Array(w * h));
  const W3 = w * 3, rows = [new Float32Array(W3), new Float32Array(W3), new Float32Array(W3)];
  const load = (row, y) => { if (y >= h) { row.fill(0); return; } const o = y * W3; for (let i = 0; i < W3; i++) row[i] = rgb[o + i]; };
  load(rows[0], 0); load(rows[1], 1); load(rows[2], 2);
  const kd = K.k, kl = kd.length, div = K.d;
  for (let y = 0; y < h; y++) {
    const rr = [rows[y % 3], rows[(y + 1) % 3], rows[(y + 2) % 3]];
    const rev = (y & 1) === 1;
    const xs = rev ? w - 1 : 0, xe = rev ? -1 : w, st = rev ? -1 : 1;
    for (let x = xs; x !== xe; x += st) {
      const p = x * 3;
      const r = clamp(rr[0][p], 0, 255), g = clamp(rr[0][p + 1], 0, 255), b = clamp(rr[0][p + 2], 0, 255);
      const bi = near(r, g, b);
      masks[bi][y * w + x] = 255;
      const er = (r - pal[bi][0]) / div, eg = (g - pal[bi][1]) / div, eb = (b - pal[bi][2]) / div;
      for (let k = 0; k < kl; k++) {
        const e = kd[k], nx = x + (rev ? -e[0] : e[0]), ny = y + e[1];
        if (nx < 0 || nx >= w || ny >= h) continue;
        const t = rr[e[1]], q = nx * 3, wt = e[2];
        t[q] += er * wt; t[q + 1] += eg * wt; t[q + 2] += eb * wt;
      }
    }
    load(rows[y % 3], y + 3);
  }
  return masks;
}

function gradeThreshold(rgb, w, h, pal, thr, spread) {
  const near = nearestFn(pal);
  const masks = pal.map(() => new Uint8Array(w * h));
  const amp = clamp(spread, 0, 100) / 100 * 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 3, off = (thr(x, y) - 0.5) * amp;
      masks[near(clamp(rgb[p] + off, 0, 255), clamp(rgb[p + 1] + off, 0, 255), clamp(rgb[p + 2] + off, 0, 255))][y * w + x] = 255;
    }
  }
  return masks;
}

function gradeAscii(rgb, w, h, pal, asc) {
  const near = nearestFn(pal);
  const masks = pal.map(() => new Uint8Array(w * h));
  const G = ASCII3.geom(asc), cw = G.cw, ch = G.ch;
  const cols = Math.ceil(w / cw), rows = Math.ceil(h / ch);
  const idx = new Int16Array(cols * rows);
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    let r = 0, g = 0, b = 0, cnt = 0;
    for (let y = cy * ch; y < Math.min(h, cy * ch + ch); y++) for (let x = cx * cw; x < Math.min(w, cx * cw + cw); x++) {
      const p = (y * w + x) * 3; r += rgb[p]; g += rgb[p + 1]; b += rgb[p + 2]; cnt++;
    }
    idx[cy * cols + cx] = cnt ? near(r / cnt, g / cnt, b / cnt) : 0;
  }
  const demand = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) demand[i] = 255 - asc.lum[i];
  const asc2 = Object.assign({}, asc, { cellMask: (cx, cy) => masks[idx[cy * cols + cx]] });
  ASCII3.render(demand, w, h, asc2);
  return masks;
}

// ----------------------------------------------------------------------
// Demo image (used when no document is open)
// ----------------------------------------------------------------------
function demoImage(w, h) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const fx = x / w, fy = y / h;
      let r = 255 * (0.15 + 0.85 * fx), g = 255 * (0.25 + 0.5 * (1 - fy) * fx + 0.2 * fy), b = 255 * (0.9 - 0.7 * fx * fy);
      const dx = fx - 0.5, dy = fy - 0.52, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.27) { const t = 1 - d / 0.27; r = 255 * (0.3 + 0.7 * t); g = 255 * (0.1 + 0.8 * t * t); b = 255 * (0.05 + 0.3 * t); }
      if (fy > 0.82) { const band = ((x / (w / 16)) | 0) % 2; const k = (fx * 255); r = g = b = band ? k : 255 - k; }
      data[i] = clamp(r, 0, 255); data[i + 1] = clamp(g, 0, 255); data[i + 2] = clamp(b, 0, 255); data[i + 3] = 255;
    }
  }
  return { w, h, c: 4, data };
}

// ----------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------
async function render(src, P, hooks) {
  hooks = hooks || {};
  const tick = hooks.yield || (async () => {});
  const progress = hooks.progress || (() => {});
  const notes = [];
  const s = P.scale || 1, ppi = P.ppi || 300;
  const w = src.w, h = src.h, n = w * h;

  // 1. composite on white, remember alpha
  const rgb = new Uint8Array(n * 3), alpha = new Uint8Array(n);
  let anyA = false;
  const comp = src.c || 4, d = src.data;
  for (let i = 0, j = 0, k = 0; i < n; i++, j += comp, k += 3) {
    let a = 255, r, g, b;
    if (comp === 1) { r = g = b = d[j]; }
    else { r = d[j]; g = d[j + 1]; b = d[j + 2]; if (comp === 4) a = d[j + 3]; }
    if (a < 255) {
      anyA = true;
      const t = a / 255;
      r = r * t + 255 * (1 - t); g = g * t + 255 * (1 - t); b = b * t + 255 * (1 - t);
    }
    rgb[k] = (r + 0.5) | 0; rgb[k + 1] = (g + 0.5) | 0; rgb[k + 2] = (b + 0.5) | 0;
    alpha[i] = a;
  }

  // 2. transparency / garment knock-out (uses the original colours)
  const dtf = P.fx.dtf;
  let alphaF = null;
  if (dtf.on || anyA) alphaF = dtf.on ? knockout(rgb, alpha, w, h, dtf) : alpha;

  // 3. shape the image
  if (P.fx.pre.on) preprocess(rgb, w, h, P.fx.pre, s);
  const lum = lumPlane(rgb, n);

  // 4. engine configuration
  const E = {
    engine: P.engine,
    algo: (P.algo && P.algo[P.engine]) || (P.engine === "halftone" ? "round" : "fs"),
    cellPx: (ppi / clamp(P.lpi || 35, 3, 300)) * s,
    ps: Math.max(1, (P.pixel || 1) * s),
    aa: !!P.aa,
    tune: P.tune || null,
    w: w, h: h
  };
  E.lsc = ((P.pixel || 1) * s) / (E.ps > 1.01 ? E.ps : 1);
  if (E.engine === "halftone" && E.cellPx < 3) notes.push("Cells are under 3 px; raise the document PPI or lower the LPI.");
  // ASCII 3.0: algorithm, font, cell height in px (2.x looks keep Scale x 8 px), spacing, invert, seed
  const cellPx = P.ascii.cell || (P.ascii.size || 4) * 8;
  const asc = {
    algo: P.ascii.algo || (P.ascii.textMode ? "text" : "luma"),
    font: P.ascii.font || "classic",
    cell: cellPx * s,
    spacing: (P.ascii.spacing || 0) * s,
    invert: !!P.ascii.invert,
    seed: P.ascii.seed | 0,
    set: P.algo.ascii, custom: P.ascii.custom, keepOrder: P.ascii.keepOrder,
    lum: lum,
    edgeAmt: (P.ascii.edge || 0) / 100,
    textMode: !!P.ascii.textMode,
    text: P.ascii.text
  };
  const edgeD = P.fx.edges.on ? edgeDemand(lum, w, h, P.fx.edges, s) : null;

  // 5. alpha mask (semi-transparent edges become dots for DTF)
  let aMask = null;
  if (alphaF) {
    if (dtf.on) {
      if (dtf.dots) {
        const Ea = E.engine === "ascii" ? { engine: "dither", algo: "fs", ps: E.ps } : E;
        aMask = inkFromPlane(alphaF, w, h, Ea, 45, [0, 0], null);
      } else {
        aMask = new Uint8Array(n);
        for (let i = 0; i < n; i++) aMask[i] = alphaF[i] >= 128 ? 255 : 0;
      }
    } else aMask = alphaF;
  }

  // 6. per-layer post processing
  const seed = 17;
  function post(mask, idx) {
    let m = mask;
    if (aMask) {
      m = new Uint8Array(n);
      for (let i = 0; i < n; i++) m[i] = (mask[i] * aMask[i] + 127) / 255 | 0;
    }
    if (P.fx.gain.on && P.fx.gain.amount) m = dotGain(m, w, h, P.fx.gain.amount, s);
    if (P.fx.distress.on) m = distress(m, w, h, P.fx.distress.amount, s, seed + idx);
    if (P.fx.clean.on) {
      const dPx = P.fx.clean.mm / 25.4 * ppi * s;
      m = removeSpecks(m, w, h, Math.round(PI * dPx * dPx / 4));
    }
    if (P.fx.misreg.on && idx > 0) {
      const OFF = [[0, 0], [1, 0], [0, 1], [-1, -1], [1, -1]];
      const o = OFF[idx % OFF.length], a = P.fx.misreg.amount * s;
      m = shiftMask(m, w, h, Math.round(o[0] * a), Math.round(o[1] * a));
    }
    return m;
  }
  const angTag = (a) => (E.engine === "halftone" ? " " + Math.round(a) + "°" : "");
  const layers = [];
  let paper = null;

  function runPlane(demand, angle, idx) {
    const ink = inkFromPlane(demand, w, h, E, angle, [idx * 3, idx * 5], E.engine === "ascii" ? asc : null);
    return post(ink, idx);
  }

  const mode = P.mode;
  if (mode === "mono") {
    progress(0, 1, "ink");
    const dem = new Uint8Array(n);
    for (let i = 0; i < n; i++) dem[i] = 255 - lum[i];
    if (edgeD) for (let i = 0; i < n; i++) if (edgeD[i] > dem[i]) dem[i] = edgeD[i];
    const col = hexToRgb(P.mono.ink);
    layers.push({ name: "Ink " + rgbToHex(col) + angTag(P.angle), color: col, mask: runPlane(dem, P.angle, 0), blend: "NORMAL" });
    paper = P.mono.paper ? hexToRgb(P.mono.paper) : null;
  } else if (mode === "tonal") {
    const inks = (P.tonal.inks || []).filter(isHex).map((hx, i) => ({ rgb: hexToRgb(hx), i }));
    if (inks.length < 2) notes.push("Tonal mode needs at least 2 inks.");
    inks.sort((a, b) => luma(b.rgb) - luma(a.rgb));
    const nk = Math.max(1, inks.length);
    for (let k = 0; k < inks.length; k++) {
      progress(k, inks.length, "ink " + (k + 1));
      const dem = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const dk = (255 - lum[i]) / 255;
        dem[i] = clamp(dk * nk - k, 0, 1) * 255 + 0.5;
      }
      if (edgeD && k === inks.length - 1) for (let i = 0; i < n; i++) if (edgeD[i] > dem[i]) dem[i] = edgeD[i];
      const ang = (P.tonal.angles && P.tonal.angles[k] != null) ? P.tonal.angles[k] : 45;
      layers.push({ name: "Tone " + (k + 1) + " " + rgbToHex(inks[k].rgb) + angTag(ang), color: inks[k].rgb, mask: runPlane(dem, ang, k), blend: "NORMAL" });
      await tick();
    }
    paper = P.tonal.paper ? hexToRgb(P.tonal.paper) : null;
  } else if (mode === "cmyk") {
    const pl = cmykPlanes(rgb, n, P.cmyk.gcr);
    const defs = [
      { name: "Yellow",  col: [255, 242, 0], plane: pl.Y, ai: 2, i: 2 },
      { name: "Magenta", col: [236, 0, 140], plane: pl.M, ai: 1, i: 1 },
      { name: "Cyan",    col: [0, 174, 239], plane: pl.C, ai: 0, i: 0 },
      { name: "Black",   col: [0, 0, 0],     plane: pl.K, ai: 3, i: 3 }
    ];
    let cnt = 0;
    for (const df of defs) {
      if (!P.cmyk.on[df.i]) continue;
      progress(cnt++, 4, df.name);
      const dem = df.plane;
      if (edgeD && df.name === "Black") for (let i = 0; i < n; i++) if (edgeD[i] > dem[i]) dem[i] = edgeD[i];
      const ang = P.cmyk.angles[df.ai];
      layers.push({ name: df.name + angTag(ang) + " " + rgbToHex(df.col), color: df.col, mask: runPlane(dem, ang, df.i), blend: "MULTIPLY" });
      await tick();
    }
  } else if (mode === "rgb") {
    const defs = [
      { name: "Red",   col: [255, 0, 0], ch: 0 },
      { name: "Green", col: [0, 255, 0], ch: 1 },
      { name: "Blue",  col: [0, 0, 255], ch: 2 }
    ];
    let cnt = 0;
    for (const df of defs) {
      if (!P.rgb.on[df.ch]) continue;
      progress(cnt++, 3, df.name);
      const dem = new Uint8Array(n), st = clamp(P.rgb.strength[df.ch], 0, 200) / 100;
      for (let i = 0; i < n; i++) dem[i] = clamp(rgb[i * 3 + df.ch] * st, 0, 255);
      const ang = P.rgb.angles[df.ch];
      layers.push({ name: df.name + angTag(ang) + " " + rgbToHex(df.col), color: df.col, mask: runPlane(dem, ang, df.ch), blend: "LINEARDODGE" });
      await tick();
    }
    paper = [0, 0, 0];
  } else if (mode === "grade") {
    const cols = P.grade.colors.filter(isHex).map(hexToRgb);
    const off = P.grade.off || [];
    let pal = cols.filter((c, i) => off.indexOf(i) < 0);
    if (pal.length < 2) { notes.push("Palette needs at least 2 active colours; using black and white."); pal = [[0, 0, 0], [255, 255, 255]]; }
    let masks;
    progress(0, 1, "palette");
    if (E.engine === "ascii") masks = gradeAscii(rgb, w, h, pal, asc);
    else if (E.engine === "dither" && DITHER_BY_ID[E.algo] && DITHER_BY_ID[E.algo].t === "ed") {
      if (E.ps > 1.01) {
        // dither at reduced size, then enlarge with nearest-neighbour
        const w2 = Math.max(2, Math.round(w / E.ps)), h2 = Math.max(2, Math.round(h / E.ps));
        const small = new Uint8Array(w2 * h2 * 3);
        for (let c = 0; c < 3; c++) {
          const ch = new Uint8Array(n);
          for (let i = 0; i < n; i++) ch[i] = rgb[i * 3 + c];
          const sm = downBox(ch, w, h, w2, h2);
          for (let i = 0; i < w2 * h2; i++) small[i * 3 + c] = sm[i];
        }
        masks = gradeDiffuse(small, w2, h2, pal, KERNELS[DITHER_BY_ID[E.algo].k]).map((m) => upNearest(m, w2, h2, w, h));
      } else masks = gradeDiffuse(rgb, w, h, pal, KERNELS[DITHER_BY_ID[E.algo].k]);
    } else {
      const thr = makeThr(E, P.angle);
      if (E.engine === "dither" && E.ps > 1.01) {
        const ps = E.ps;
        const thr2 = (x, y) => thr(Math.floor(x / ps), Math.floor(y / ps));
        masks = gradeThreshold(rgb, w, h, pal, thr2, P.grade.spread);
      } else masks = gradeThreshold(rgb, w, h, pal, thr, P.grade.spread);
    }
    let order = pal.map((c, i) => i);
    let skip = -1;
    if (P.grade.skipLightest) { let bl = -1; pal.forEach((c, i) => { if (luma(c) > bl) { bl = luma(c); skip = i; } }); }
    order.forEach((i, k) => {
      if (i === skip) return;
      layers.push({ name: rgbToHex(pal[i]), color: pal[i], mask: post(masks[i], k), blend: "NORMAL" });
    });
    notes.push(pal.length + " colours" + (skip >= 0 ? " (lightest left as paper)" : ""));
  }

  // ASCII 3.0 Glyph colour "Cell colour": every glyph takes its cell's average picture colour
  if (E.engine === "ascii" && P.ascii.glyph === "cell" && layers.length && layers.every((L) => L.mask)) {
    const G = ASCII3.geom(asc), cols = Math.ceil(w / G.cw), rows = Math.ceil(h / G.ch);
    const cc = new Float32Array(cols * rows * 3), cn = new Float32Array(cols * rows);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const j = Math.floor(y / G.ch) * cols + Math.floor(x / G.cw), p = (y * w + x) * 3;
      cc[j * 3] += rgb[p]; cc[j * 3 + 1] += rgb[p + 1]; cc[j * 3 + 2] += rgb[p + 2]; cn[j]++;
    }
    const rgba = new Uint8Array(n * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; let a = 0;
      for (const L of layers) if (L.mask[i] > a) a = L.mask[i];
      if (!a) continue;
      const j = Math.floor(y / G.ch) * cols + Math.floor(x / G.cw), c = cn[j] || 1;
      rgba[i * 4] = cc[j * 3] / c; rgba[i * 4 + 1] = cc[j * 3 + 1] / c; rgba[i * 4 + 2] = cc[j * 3 + 2] / c; rgba[i * 4 + 3] = a;
    }
    layers.length = 0;
    layers.push({ name: "ASCII cell colour", rgba, blend: "NORMAL" });
    if (!paper) paper = [0, 0, 0];
  }

  progress(1, 1, "done");
  return { w, h, layers, paper, notes, E };
}

// ----------------------------------------------------------------------
// Preview compositing
// ----------------------------------------------------------------------
function composite(result, bg) {
  const w = result.w, h = result.h, n = w * h;
  const out = new Uint8Array(n * 3);
  bg = bg || { type: "white" };
  const base = result.paper
    ? result.paper
    : (bg.type === "black" ? [0, 0, 0] : bg.type === "garment" || bg.type === "color" ? (bg.color || [128, 128, 128]) : [255, 255, 255]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = base[0], g = base[1], b = base[2];
      if (!result.paper && bg.type === "checker") { const v = (((x >> 3) + (y >> 3)) & 1) ? 150 : 205; r = g = b = v; }
      const p = (y * w + x) * 3;
      out[p] = r; out[p + 1] = g; out[p + 2] = b;
    }
  }
  for (const L of result.layers) {
    if (L.rgba) {   // full-colour layer (ASCII cell colour)
      const q = L.rgba;
      for (let i = 0, p = 0; i < n; i++, p += 3) { const t = q[i * 4 + 3] / 255; if (!t) continue; out[p] = out[p] * (1 - t) + q[i * 4] * t; out[p + 1] = out[p + 1] * (1 - t) + q[i * 4 + 1] * t; out[p + 2] = out[p + 2] * (1 - t) + q[i * 4 + 2] * t; }
      continue;
    }
    const m = L.mask, c = L.color;
    for (let i = 0, p = 0; i < n; i++, p += 3) {
      const a = m[i];
      if (!a) continue;
      const t = a / 255;
      if (L.blend === "MULTIPLY") {
        out[p] = out[p] * (1 - t + t * c[0] / 255); out[p + 1] = out[p + 1] * (1 - t + t * c[1] / 255); out[p + 2] = out[p + 2] * (1 - t + t * c[2] / 255);
      } else if (L.blend === "LINEARDODGE") {
        out[p] = Math.min(255, out[p] + c[0] * t); out[p + 1] = Math.min(255, out[p + 1] + c[1] * t); out[p + 2] = Math.min(255, out[p + 2] + c[2] * t);
      } else {
        out[p] = out[p] * (1 - t) + c[0] * t; out[p + 1] = out[p + 1] * (1 - t) + c[1] * t; out[p + 2] = out[p + 2] * (1 - t) + c[2] * t;
      }
    }
  }
  return out;
}

module.exports = {
  SCREENS, DITHERS, KERNELS, SPOTS, ASCII_SETS: ASCII.ASCII_SETS,
  render, composite, demoImage, paletteFromImage, mergeClosest,
  hexToRgb, rgbToHex, isHex, luma, clamp,
  LINE_ART: LA.LINE_ART, TUNE_DEFAULTS: LA.TUNE_DEFAULTS,
  _internal: { blueNoise: LA.blueNoise, lineInk: LA.lineInk, screenInk, ditherInk, rankLUT, bayerMap, clusterMap, downBox, upNearest, cmykPlanes, removeSpecks, dotGain, morph, makeThr, medianCut }
};
