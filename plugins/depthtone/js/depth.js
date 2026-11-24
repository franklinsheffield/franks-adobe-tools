"use strict";
// Depthtone 2.0 depth builder (pure JS, no host calls).
// Turns the source into a depth field D (0 = far, 1 = near) from one of three sources:
//   smart      - subject mask (Photoshop Select Subject, src.subject) + floor plane + photo detail
//   layer      - a depth map layer the user picked (src.depthMap, e.g. Neural Filters > Depth Blur)
//   brightness - 1.0 behaviour: bright is near
// then cleans it up: auto range, smoothing, subject pop, invert.
const M = require("../core/imgmath.js");
const { clamp, boxBlur } = M;

// grey 0..1 from a {w,h,c,data} image (or Float32Array already 0..1)
function grey(img, n) {
  if (img instanceof Float32Array) return Float32Array.from(img);
  const c = img.c || 4, d = img.data, o = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += c) o[i] = c >= 3 ? (0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]) / 255 : d[j] / 255;
  return o;
}
function sameSize(img, w, h) { return img && (img instanceof Float32Array ? img.length === w * h : img.w === w && img.h === h); }

// floor depth at the lowest pixel of each connected subject region (-1 outside / tiny bits)
function componentFoot(S, w, h, floor) {
  const n = w * h, lab = new Int32Array(n).fill(-1), out = new Float32Array(n).fill(-1);
  const stack = new Int32Array(n), minSize = Math.max(16, n * 0.002);
  let id = 0;
  for (let s0 = 0; s0 < n; s0++) {
    if (lab[s0] !== -1 || S[s0] <= 0.5) continue;
    let sp = 0, low = 0, size = 0; stack[sp++] = s0; lab[s0] = id;
    const members = [];
    while (sp) {
      const i = stack[--sp], x = i % w, y = (i / w) | 0; members.push(i); size++; if (y > low) low = y;
      if (x > 0 && lab[i - 1] === -1 && S[i - 1] > 0.5) { lab[i - 1] = id; stack[sp++] = i - 1; }
      if (x < w - 1 && lab[i + 1] === -1 && S[i + 1] > 0.5) { lab[i + 1] = id; stack[sp++] = i + 1; }
      if (y > 0 && lab[i - w] === -1 && S[i - w] > 0.5) { lab[i - w] = id; stack[sp++] = i - w; }
      if (y < h - 1 && lab[i + w] === -1 && S[i + w] > 0.5) { lab[i + w] = id; stack[sp++] = i + w; }
    }
    if (size >= minSize) { const fd = floor(Math.min(h - 1, low + 2)); for (const i of members) out[i] = fd; }
    id++;
  }
  // soften the edge between "in a figure" and "not" by spreading into the soft mask
  return out;
}

// Smart depth: floor plane gets nearer towards the bottom; the subject stands on it
// (each column of the subject takes the depth where its lowest pixel meets the floor),
// is lifted forward and rounded (centre nearer than edges), plus fine photo relief.
function smartDepth(L, S, w, h, o) {
  const n = w * h, D = new Float32Array(n);
  const hz = clamp((o.horizon == null ? 45 : o.horizon) / 100, 0, 0.95);
  const floor = (y) => { const t = (y / Math.max(1, h - 1) - hz) / (1 - hz); return t <= 0 ? 0 : Math.pow(t, 1.3); };
  const lift = 0.06 + 0.0024 * (o.pop == null ? 50 : o.pop);
  // soft mask, and a wider blur of it for the rounded "inflated" body
  const Ms = Float32Array.from(S); boxBlur(Ms, w, h, Math.max(1, w / 300), 2);
  const Mr = Float32Array.from(S); boxBlur(Mr, w, h, Math.max(2, w / 40), 3);
  // each vertical run of subject pixels stands where its lowest pixel meets the floor
  // (a leg reaching to the camera comes forward, a body standing further back stays back)
  const footW = new Float32Array(n), wt = new Float32Array(n);
  for (let x = 0; x < w; x++) {
    let y = h - 1;
    while (y >= 0) {
      if (S[y * w + x] <= 0.5) { y--; continue; }
      const fd = floor(Math.min(h - 1, y + 2));
      while (y >= 0 && S[y * w + x] > 0.5) { footW[y * w + x] = fd; wt[y * w + x] = 1; y--; }
    }
  }
  // smooth the foot depth widely inside the subject only (a narrow leg must not
  // leave a stripe up the body) ...
  const rr = Math.max(3, w / 12);
  boxBlur(footW, w, h, rr, 2); boxBlur(wt, w, h, rr, 2);
  // ... and blend it with one foot depth per connected figure, so a body reads as one piece
  const comp = componentFoot(S, w, h, floor);
  const F = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const col = wt[i] > 1e-3 ? footW[i] / wt[i] : 0;
    F[i] = comp[i] >= 0 ? 0.55 * comp[i] + 0.45 * col : col;
  }
  // fine relief from the photo (high-pass of brightness)
  const Lb = Float32Array.from(L); boxBlur(Lb, w, h, Math.max(2, w / 120), 2);
  const det = 0.08 * (o.detail == null ? 1 : o.detail);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const bg = floor(y) * 0.75;
    const body = clamp(F[i] * 0.75 + lift + 0.15 * (Mr[i] - 0.5), 0, 1);
    D[i] = bg + (body - bg) * Ms[i] + det * (L[i] - Lb[i]);
  }
  return D;
}

// stretch the 1st..99th percentile (or the manual Far..Near range) to 0..1
function range(D, auto, far, near) {
  const n = D.length;
  let lo, hi;
  if (auto) {
    const H = new Uint32Array(1024); let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) { if (D[i] < mn) mn = D[i]; if (D[i] > mx) mx = D[i]; }
    const span = mx - mn || 1;
    for (let i = 0; i < n; i++) H[Math.min(1023, ((D[i] - mn) / span * 1023) | 0)]++;
    const pick = (q) => { let a = 0; for (let k = 0; k < 1024; k++) { a += H[k]; if (a >= q * n) return mn + span * k / 1023; } return mx; };
    lo = pick(0.01); hi = pick(0.99);
  } else { lo = far / 100; hi = near / 100; }
  if (hi - lo < 1e-4) hi = lo + 1e-4;
  for (let i = 0; i < n; i++) D[i] = clamp((D[i] - lo) / (hi - lo), 0, 1);
  return D;
}

// build the cleaned depth field for this source; returns { D, L, A, used }
function build(src, P) {
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale, d = P.depth || {};
  const { L, A } = M.luminance(src);
  let used = d.source || "smart", D;
  if (used === "layer" && sameSize(src.depthMap, w, h)) D = grey(src.depthMap, n);
  else if (used === "smart" && sameSize(src.subject, w, h)) D = smartDepth(L, grey(src.subject, n), w, h, d);
  else if (used === "smart" && sameSize(src.depth, w, h)) D = grey(src.depth, n);       // a ready depth field (tests, AE)
  else { if (used !== "brightness") used = "brightness (no " + (used === "layer" ? "depth layer" : "subject") + " yet)"; D = Float32Array.from(L); }
  if (d.smooth > 0) boxBlur(D, w, h, d.smooth * sc, 3);
  range(D, d.auto !== false, d.far == null ? 0 : d.far, d.near == null ? 100 : d.near);
  if (d.invert) for (let i = 0; i < n; i++) D[i] = 1 - D[i];
  return { D, L, A, used };
}

module.exports = { build, smartDepth, range };
