"use strict";
// ======================================================================
// Chrometone 1.1 effects (pure JS, deterministic):
//   shape mask + outline bevel + horizon reflection   (Surface card)
//   3D extrusion side walls + long shadow             (Extrusion card)
//   modular glow stack                                 (Glow card)
//   glints, sweep, rim light, electric arcs            (Shine card)
// Sizes are document pixels times sc (P.scale), so preview matches Apply.
// ======================================================================

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function hexToRgb(h) { h = String(h || "#FFFFFF").replace("#", ""); return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0]; }

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// smooth 1D value noise in [-1, 1]
function noise1(x, seed) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const hv = (k) => { let n = (k * 374761393 + seed * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return (((n ^ (n >>> 16)) >>> 0) / 4294967295) * 2 - 1; };
  return hv(i) + (hv(i + 1) - hv(i)) * u;
}

// ---------------------------------------------------------------- mask
// Decide how the surface is built: "outline" (from alpha or keyed dark bg) or "brightness".
function pickMode(src, surf) {
  const from = surf.from || "brightness";
  if (from === "brightness") return { mode: "brightness" };
  const w = src.w, h = src.h, n = w * h, c = src.c || 4, d = src.data;
  let transp = 0;
  if (c >= 4) for (let i = 0; i < n; i++) if (d[i * c + 3] < 128) transp++;
  if (transp > n * 0.02) return { mode: "outline", key: false };
  if (from === "outline") return { mode: "outline", key: true };
  // auto: opaque image; a dark border means "logo on black", so key it out
  let dark = 0, cnt = 0;
  const lum = (i) => { const j = i * c; return c >= 3 ? (0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 255 : d[j] / 255; };
  const stepX = Math.max(1, Math.floor(w / 64)), stepY = Math.max(1, Math.floor(h / 64));
  for (let x = 0; x < w; x += stepX) { cnt += 2; if (lum(x) < 0.2) dark++; if (lum((h - 1) * w + x) < 0.2) dark++; }
  for (let y = 0; y < h; y += stepY) { cnt += 2; if (lum(y * w) < 0.2) dark++; if (lum(y * w + w - 1) < 0.2) dark++; }
  return dark >= cnt * 0.8 ? { mode: "outline", key: true } : { mode: "brightness" };
}

// coverage 0..1: alpha, times a soft key on brightness when keying a dark background
function shapeMask(src, L, keyOn, keyPct) {
  const n = src.w * src.h, c = src.c || 4, d = src.data, M = new Float32Array(n);
  const k = clamp((keyPct == null ? 12 : keyPct) / 100, 0.005, 0.95), e = 0.04;
  for (let i = 0; i < n; i++) {
    let a = c >= 4 ? d[i * c + 3] / 255 : 1;
    if (keyOn) a *= smooth(k - e, k + e, L[i]);
    M[i] = a;
  }
  return M;
}

// ---------------------------------------------------------------- distance transform
function edt1d(f, n, dOut, v, z) {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; dOut[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
// distance (px) from each inside pixel to the nearest outside pixel; the canvas edge counts as outside
function insideDistance(M, w, h) {
  const n = w * h, D = new Float32Array(n), m = Math.max(w, h);
  const f = new Float64Array(m), dd = new Float64Array(m), v = new Int32Array(m), z = new Float64Array(m + 1);
  for (let i = 0; i < n; i++) D[i] = M[i] >= 0.5 ? 1e20 : 0;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = D[y * w + x];
    edt1d(f, h, dd, v, z);
    for (let y = 0; y < h; y++) D[y * w + x] = dd[y];
  }
  for (let y = 0; y < h; y++) {
    const o = y * w;
    for (let x = 0; x < w; x++) f[x] = D[o + x];
    edt1d(f, w, dd, v, z);
    for (let x = 0; x < w; x++) {
      let r = Math.sqrt(dd[x]);
      r = Math.min(r, x + 1, w - x, y + 1, h - y);
      // sub-pixel edge from the anti-aliased coverage
      D[o + x] = M[o + x] > 0 ? Math.max(0, r - 0.5 + (M[o + x] - 0.5)) : 0;
    }
  }
  return D;
}

function bbox(M, w, h) {
  let l = w, t = h, r = -1, b = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (M[y * w + x] >= 0.5) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
  if (r < 0) return { l: 0, t: 0, r: w - 1, b: h - 1, empty: true };
  return { l, t, r, b, empty: false };
}

// outward edge normals from the gradient of a blurred mask
function edgeNormals(M, w, h, blur, r) {
  const Mb = Float32Array.from(M);
  blur(Mb, w, h, Math.max(1, r), 2);
  const n = w * h, Ex = new Float32Array(n), Ey = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const gx = Mb[y * w + Math.min(x + 1, w - 1)] - Mb[y * w + Math.max(x - 1, 0)];
    const gy = Mb[Math.min(y + 1, h - 1) * w + x] - Mb[Math.max(y - 1, 0) * w + x];
    const l = Math.hypot(gx, gy);
    if (l > 1e-5) { Ex[i] = -gx / l; Ey[i] = -gy / l; }
  }
  return { Ex, Ey, Mb };
}

// ---------------------------------------------------------------- bevel height
function bevelHeight(D, n, bw, profile) {
  const H = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = Math.min(D[i] / bw, 1);
    let h;
    if (profile === "round") h = Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
    else if (profile === "rim") h = D[i] < bw ? 0.55 * Math.sin(Math.PI * t) : 0;
    else h = t;                                              // chamfer
    H[i] = h * bw;
  }
  return H;
}

// ---------------------------------------------------------------- extrusion
// Walls run from the face toward angle `angle` (0 = right, 90 = up) for `depth` px.
// One sweep along the main axis: s(p) = |v| + s(p - v), s = 0 inside the face.
function extrude(M, Ex, Ey, w, h, E, sc, light) {
  const n = w * h, Dp = Math.max(0, E.depth * sc);
  const S = new Float32Array(n).fill(Infinity), Nx = new Float32Array(n), Ny = new Float32Array(n);
  for (let i = 0; i < n; i++) if (M[i] >= 0.5) { S[i] = 0; Nx[i] = Ex[i]; Ny[i] = Ey[i]; }
  if (Dp < 0.5) return null;
  const th = E.angle * Math.PI / 180, bx0 = Math.cos(th), by0 = -Math.sin(th);
  const bb = bbox(M, w, h), cx = (bb.l + bb.r) / 2, cy = (bb.t + bb.b) / 2, diag = Math.hypot(w, h);
  const persp = clamp(E.persp / 100, 0, 1);
  const L = persp > 0 ? diag * (1.5 + 6 * (1 - persp)) : 0;
  const vpx = cx + bx0 * L, vpy = cy + by0 * L;
  const xMajor = Math.abs(bx0) >= Math.abs(by0);
  const dirFor = (x, y) => {
    if (!L) return [bx0, by0];
    const dx = vpx - x, dy = vpy - y, l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  };
  if (xMajor) {
    const sx = bx0 >= 0 ? 1 : -1;
    for (let k = 0; k < w; k++) {
      const x = sx > 0 ? k : w - 1 - k, xp = x - sx;
      if (xp < 0 || xp >= w) continue;
      for (let y = 0; y < h; y++) {
        const i = y * w + x;
        if (S[i] === 0) continue;
        const [dx, dy] = dirFor(x, y);
        let vy = dy / Math.abs(dx || 1e-6); vy = clamp(vy, -1, 1);
        const len = Math.hypot(1, vy), yf = y - vy, y0 = Math.floor(yf), t = yf - y0, y1 = y0 + 1;
        const a = (y0 >= 0 && y0 < h) ? S[y0 * w + xp] : Infinity, b = (y1 >= 0 && y1 < h) ? S[y1 * w + xp] : Infinity;
        let s, j;
        if (a !== Infinity && b !== Infinity) { s = a + (b - a) * t; j = t < 0.5 ? y0 * w + xp : y1 * w + xp; }
        else if (a !== Infinity && t <= 0.5) { s = a; j = y0 * w + xp; }
        else if (b !== Infinity && t >= 0.5) { s = b; j = y1 * w + xp; }
        else continue;
        s += len;
        if (s > Dp + 1.5) continue;
        S[i] = s; Nx[i] = Nx[j]; Ny[i] = Ny[j];
      }
    }
  } else {
    const sy = by0 >= 0 ? 1 : -1;
    for (let k = 0; k < h; k++) {
      const y = sy > 0 ? k : h - 1 - k, yp = y - sy;
      if (yp < 0 || yp >= h) continue;
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (S[i] === 0) continue;
        const [dx, dy] = dirFor(x, y);
        let vx = dx / Math.abs(dy || 1e-6); vx = clamp(vx, -1, 1);
        const len = Math.hypot(1, vx), xf = x - vx, x0 = Math.floor(xf), t = xf - x0, x1 = x0 + 1;
        const a = (x0 >= 0 && x0 < w) ? S[yp * w + x0] : Infinity, b = (x1 >= 0 && x1 < w) ? S[yp * w + x1] : Infinity;
        let s, j;
        if (a !== Infinity && b !== Infinity) { s = a + (b - a) * t; j = t < 0.5 ? yp * w + x0 : yp * w + x1; }
        else if (a !== Infinity && t <= 0.5) { s = a; j = yp * w + x0; }
        else if (b !== Infinity && t >= 0.5) { s = b; j = yp * w + x1; }
        else continue;
        s += len;
        if (s > Dp + 1.5) continue;
        S[i] = s; Nx[i] = Nx[j]; Ny[i] = Ny[j];
      }
    }
  }
  // colour the walls
  const lut = E.lut, shadeAmt = clamp(E.shade / 100, 0, 1), lines = clamp(E.lines / 100, 0, 1);
  const lw = Math.max(0.8, 1.2 * sc);
  const rgba = new Uint8Array(n * 4), WA = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, s = S[i];
    if (!(s > 0) || s === Infinity) continue;
    const a = clamp(Dp + 1 - s, 0, 1);
    if (a <= 0) continue;
    const q = clamp(s / Dp, 0, 1), li = Math.round(q * 255) * 3;
    const nx = Nx[i], ny = Ny[i];
    const facing = nx * light.hx + ny * light.hy;                 // -1..1, 1 = faces the light
    const shade = 1 - shadeAmt * (0.5 - 0.5 * facing) * 1.3;
    const spec = Math.pow(Math.max(0, facing), 24) * 0.55;
    // lines: where the wall meets the face, at the back edge, and at wall corners
    let line = 0;
    if (s <= lw + 1) line = Math.max(line, 1 - (s - 1) / lw);
    if (Dp - s < lw) line = Math.max(line, 0.6 * (1 - (Dp - s) / lw));
    if (x + 1 < w && S[i + 1] > 0 && S[i + 1] !== Infinity) line = Math.max(line, clamp((1 - (nx * Nx[i + 1] + ny * Ny[i + 1])) * 3, 0, 1));
    if (y + 1 < h && S[i + w] > 0 && S[i + w] !== Infinity) line = Math.max(line, clamp((1 - (nx * Nx[i + w] + ny * Ny[i + w])) * 3, 0, 1));
    line *= lines;
    for (let ch = 0; ch < 3; ch++) {
      let v = lut[li + ch] * clamp(shade, 0.05, 1.3);
      v = 255 - (255 - v) * (1 - spec);
      v = v + (255 - v) * line;
      rgba[i * 4 + ch] = clamp(Math.round(v), 0, 255);
    }
    rgba[i * 4 + 3] = Math.round(a * 255);
    WA[i] = a;
  }
  return { rgba, WA, S, Dp, dir: [bx0, by0] };
}

function longShadow(M, WA, w, h, dir, Dp, amt, sc, blur) {
  const n = w * h, U = new Float32Array(n);
  const off = Dp * 0.45 + 6 * sc, ox = Math.round(dir[0] * off), oy = Math.round(dir[1] * off);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xs = x - ox, ys = y - oy;
    if (xs < 0 || ys < 0 || xs >= w || ys >= h) continue;
    const j = ys * w + xs;
    U[y * w + x] = Math.max(M[j], WA ? WA[j] : 0);
  }
  blur(U, w, h, Math.max(1, 6 * sc + Dp * 0.25), 3);
  const rgba = new Uint8Array(n * 4), k = clamp(amt / 100, 0, 1);
  for (let i = 0; i < n; i++) rgba[i * 4 + 3] = clamp(Math.round(U[i] * k * 255), 0, 255);
  return rgba;
}

// ---------------------------------------------------------------- glow / shine helpers
function screenAdd(acc, i, col, v) {
  if (v <= 0) return;
  v = Math.min(v, 1);
  for (let ch = 0; ch < 3; ch++) { const c = col[ch] / 255 * v; acc[i * 3 + ch] = 1 - (1 - acc[i * 3 + ch]) * (1 - c); }
}
// screen-ready layer: colour = acc / a, alpha = a = max channel (exactly Screen(o, acc))
function accToRGBA(acc, n) {
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const r = acc[i * 3], g = acc[i * 3 + 1], b = acc[i * 3 + 2], a = Math.max(r, g, b);
    if (a <= 1 / 512) continue;
    out[i * 4] = clamp(Math.round(r / a * 255), 0, 255); out[i * 4 + 1] = clamp(Math.round(g / a * 255), 0, 255); out[i * 4 + 2] = clamp(Math.round(b / a * 255), 0, 255);
    out[i * 4 + 3] = clamp(Math.round(a * 255), 0, 255);
  }
  return out;
}

function star(acc, w, h, cx, cy, len, rays, rot, gain, col) {
  const R = Math.ceil(len), wd = Math.max(0.55, len * 0.03), core = Math.max(0.8, len * 0.1);
  const angs = []; for (let k = 0; k < rays / 2; k++) angs.push(rot + k * Math.PI * 2 / rays);
  for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(h - 1, Math.ceil(cy + R)); y++) {
    for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(w - 1, Math.ceil(cx + R)); x++) {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
      if (r > len) continue;
      let v = Math.exp(-(r * r) / (core * core));
      for (let k = 0; k < angs.length; k++) {
        const perp = Math.abs(dx * Math.sin(angs[k]) - dy * Math.cos(angs[k]));
        const fall = Math.pow(1 - r / len, 1.6) * (k % 2 ? 0.6 : 1);
        v = Math.max(v, Math.exp(-(perp * perp) / (wd * wd)) * fall);
      }
      screenAdd(acc, y * w + x, col, v * gain);
    }
  }
}

function drawLine(A, w, h, x0, y0, x1, y1, wd, val) {
  const len = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(len * 2));
  for (let s = 0; s <= steps; s++) {
    const px = x0 + (x1 - x0) * s / steps, py = y0 + (y1 - y0) * s / steps;
    for (let y = Math.floor(py - wd - 1); y <= Math.ceil(py + wd + 1); y++) {
      if (y < 0 || y >= h) continue;
      for (let x = Math.floor(px - wd - 1); x <= Math.ceil(px + wd + 1); x++) {
        if (x < 0 || x >= w) continue;
        const v = clamp(wd + 0.5 - Math.hypot(x - px, y - py), 0, 1) * val, i = y * w + x;
        if (v > A[i]) A[i] = v;
      }
    }
  }
}
function boltPath(rand, ax, ay, bx, by, jag, depth) {
  let pts = [[ax, ay], [bx, by]];
  let disp = Math.hypot(bx - ax, by - ay) * jag;
  for (let d = 0; d < depth; d++) {
    const nx = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const p = pts[k], q = pts[k + 1], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
      const o = (rand() * 2 - 1) * disp;
      nx.push(p, [mx - dy / l * o, my + dx / l * o]);
    }
    nx.push(pts[pts.length - 1]);
    pts = nx; disp *= 0.55;
  }
  return pts;
}

module.exports = { clamp, smooth, hexToRgb, rng, noise1, pickMode, shapeMask, insideDistance, bbox, edgeNormals, bevelHeight, extrude, longShadow, screenAdd, accToRGBA, star, drawLine, boltPath };
