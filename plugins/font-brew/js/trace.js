"use strict";
// ======================================================================
// Pixel tracer: RGBA layer pixels -> smooth closed outlines (cubic Beziers).
//   1. ink mask: alpha (transparent layers) or darkness (opaque artwork)
//   2. crack following: exact pixel-edge loops, no gaps, holes included
//   3. corners: found on a de-staircased polygon (Douglas-Peucker)
//   4. curves: Schneider least-squares cubic fit between corners
// Output contours use the mask's pixel coordinates (y down).
// A contour = [{t:"M",x,y}, {t:"L",x,y} | {t:"C",x1,y1,x2,y2,x,y}, ...] (closed).
// Pure JS, deterministic, no Photoshop calls.
// ======================================================================

// ---- 1. mask -----------------------------------------------------------
// opts: { ink:"auto"|"alpha"|"dark", threshold:0..100 }
function inkMask(img, opts) {
  const { w, h, data } = img;
  const c = img.c || 4, n = w * h;
  const thr = Math.round(255 * (opts.threshold == null ? 50 : opts.threshold) / 100);
  let mode = opts.ink || "auto";
  if (mode === "auto") {
    let clear = 0;
    if (c === 4) for (let i = 0; i < n; i++) if (data[i * 4 + 3] < 128) clear++;
    mode = clear > n * 0.01 ? "alpha" : "dark";
  }
  const m = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * c;
    const a = c === 4 ? data[p + 3] : 255;
    if (mode === "alpha") m[i] = a >= Math.max(1, thr) ? 1 : 0;
    else {
      const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
      const dark = 255 - (lum * a / 255 + 255 * (1 - a / 255));
      m[i] = dark >= Math.max(1, 255 - thr) ? 1 : 0;
    }
  }
  return { w, h, m, mode };
}

// ---- 2. crack following ---------------------------------------------------
// Edges run clockwise around ink (y down); at a 4-way vertex we turn right,
// which keeps diagonal pixels apart. Returns loops of integer corner points.
function crackLoops(mask) {
  const { w, h, m } = mask;
  const W = w + 1;
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? m[y * w + x] : 0);
  const out = new Map();   // vertex key -> [dir,...]  dir 0:+x 1:+y 2:-x 3:-y
  const add = (x, y, d) => { const k = y * W + x; const a = out.get(k); if (a) a.push(d); else out.set(k, [d]); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!m[y * w + x]) continue;
    if (!at(x, y - 1)) add(x, y, 0);
    if (!at(x + 1, y)) add(x + 1, y, 1);
    if (!at(x, y + 1)) add(x + 1, y + 1, 2);
    if (!at(x - 1, y)) add(x, y + 1, 3);
  }
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const loops = [];
  const keys = Array.from(out.keys()).sort((a, b) => a - b);
  for (const k0 of keys) {
    let list = out.get(k0);
    while (list && list.length) {
      let x = k0 % W, y = (k0 - x) / W;
      let d = list.shift();
      const pts = [[x, y]];
      const sx = x, sy = y;
      for (let guard = 0; guard < 4 * (w + 2) * (h + 2); guard++) {
        x += DX[d]; y += DY[d];
        if (x === sx && y === sy) {
          break;
        }
        pts.push([x, y]);
        const here = out.get(y * W + x);
        if (!here || !here.length) break;
        // prefer right turn, then straight, then left
        const pref = [(d + 1) % 4, d, (d + 3) % 4];
        let pick = -1;
        for (const nd of pref) { const i = here.indexOf(nd); if (i >= 0) { pick = nd; here.splice(i, 1); break; } }
        if (pick < 0) { pick = here.shift(); }
        d = pick;
      }
      if (pts.length >= 4) loops.push(pts);
      list = out.get(k0);
    }
  }
  return loops;
}

function polyArea(p) {
  let a = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j][0] * p[i][1] - p[i][0] * p[j][1]);
  return a / 2;
}

// ---- 3. corners -------------------------------------------------------------
// Douglas-Peucker on a closed loop; returns kept indices (sorted).
function dpClosed(pts, tol) {
  const n = pts.length;
  // split at the two points furthest apart
  let a = 0, b = 0, best = -1;
  for (let i = 0; i < n; i += Math.max(1, (n / 64) | 0)) {
    for (let j = 0; j < n; j += Math.max(1, (n / 64) | 0)) {
      const d = (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2;
      if (d > best) { best = d; a = i; b = j; }
    }
  }
  if (a > b) { const t = a; a = b; b = t; }
  const keep = new Uint8Array(n);
  keep[a] = keep[b] = 1;
  const seg = (i0, i1) => {           // i1 may wrap past n
    const stack = [[i0, i1]];
    while (stack.length) {
      const [s, e] = stack.pop();
      if (e - s < 2) continue;
      const P = pts[s % n], Q = pts[e % n];
      const dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.hypot(dx, dy) || 1;
      let md = -1, mi = -1;
      for (let i = s + 1; i < e; i++) {
        const R = pts[i % n];
        const d = Math.abs((R[0] - P[0]) * dy - (R[1] - P[1]) * dx) / L;
        if (d > md) { md = d; mi = i; }
      }
      if (md > tol) { keep[mi % n] = 1; stack.push([s, mi], [mi, e]); }
    }
  };
  seg(a, b); seg(b, a + n);
  const idx = [];
  for (let i = 0; i < n; i++) if (keep[i]) idx.push(i);
  return idx;
}

// ---- 4. Schneider curve fitting ------------------------------------------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const addv = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const norm = (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
function bez(b, t) {
  const u = 1 - t;
  return [
    u * u * u * b[0][0] + 3 * u * u * t * b[1][0] + 3 * u * t * t * b[2][0] + t * t * t * b[3][0],
    u * u * u * b[0][1] + 3 * u * u * t * b[1][1] + 3 * u * t * t * b[2][1] + t * t * t * b[3][1]
  ];
}
function bezD1(b, t) {
  const u = 1 - t;
  return [
    3 * (u * u * (b[1][0] - b[0][0]) + 2 * u * t * (b[2][0] - b[1][0]) + t * t * (b[3][0] - b[2][0])),
    3 * (u * u * (b[1][1] - b[0][1]) + 2 * u * t * (b[2][1] - b[1][1]) + t * t * (b[3][1] - b[2][1]))
  ];
}
function bezD2(b, t) {
  const u = 1 - t;
  return [
    6 * (u * (b[2][0] - 2 * b[1][0] + b[0][0]) + t * (b[3][0] - 2 * b[2][0] + b[1][0])),
    6 * (u * (b[2][1] - 2 * b[1][1] + b[0][1]) + t * (b[3][1] - 2 * b[2][1] + b[1][1]))
  ];
}
function chordParams(P) {
  const u = [0];
  for (let i = 1; i < P.length; i++) u.push(u[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = u[u.length - 1] || 1;
  return u.map((v) => v / L);
}
function generate(P, u, t1, t2) {
  const p0 = P[0], p3 = P[P.length - 1];
  let c00 = 0, c01 = 0, c11 = 0, x0 = 0, x1 = 0;
  for (let i = 0; i < P.length; i++) {
    const t = u[i], s = 1 - t;
    const b1 = 3 * t * s * s, b2 = 3 * t * t * s;
    const A1 = mul(t1, b1), A2 = mul(t2, b2);
    c00 += dot(A1, A1); c01 += dot(A1, A2); c11 += dot(A2, A2);
    const tmp = sub(P[i], addv(mul(p0, s * s * s + b1), mul(p3, b2 + t * t * t)));
    x0 += dot(A1, tmp); x1 += dot(A2, tmp);
  }
  const det = c00 * c11 - c01 * c01;
  let a1 = 0, a2 = 0;
  if (Math.abs(det) > 1e-12) { a1 = (x0 * c11 - x1 * c01) / det; a2 = (c00 * x1 - c01 * x0) / det; }
  const seg = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]);
  const eps = 1e-6 * seg;
  if (a1 < eps || a2 < eps || a1 > seg * 2 || a2 > seg * 2) { a1 = a2 = seg / 3; }
  return [p0, addv(p0, mul(t1, a1)), addv(p3, mul(t2, a2)), p3];
}
function maxErr(P, b, u) {
  let md = 0, mi = (P.length / 2) | 0;
  for (let i = 1; i < P.length - 1; i++) {
    const q = bez(b, u[i]);
    const d = (q[0] - P[i][0]) ** 2 + (q[1] - P[i][1]) ** 2;
    if (d > md) { md = d; mi = i; }
  }
  return [md, mi];
}
function reparam(P, b, u) {
  return u.map((t, i) => {
    const d = sub(bez(b, t), P[i]), d1 = bezD1(b, t), d2 = bezD2(b, t);
    const num = dot(d, d1), den = dot(d1, d1) + dot(d, d2);
    if (Math.abs(den) < 1e-12) return t;
    const nt = t - num / den;
    return nt < 0 ? 0 : nt > 1 ? 1 : nt;
  });
}
function fitCubic(P, t1, t2, err, out, depth) {
  if (P.length === 2) {
    const d = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]) / 3;
    out.push([P[0], addv(P[0], mul(t1, d)), addv(P[1], mul(t2, d)), P[1]]);
    return;
  }
  let u = chordParams(P);
  let b = generate(P, u, t1, t2);
  let [e, split] = maxErr(P, b, u);
  const e2 = err * err;
  if (e < e2) { out.push(b); return; }
  if (e < e2 * 4) {
    for (let it = 0; it < 4; it++) {
      u = reparam(P, b, u);
      b = generate(P, u, t1, t2);
      [e, split] = maxErr(P, b, u);
      if (e < e2) { out.push(b); return; }
    }
  }
  if (depth > 24 || P.length < 4) { out.push(b); return; }
  split = Math.max(1, Math.min(P.length - 2, split));
  const tc = norm(sub(P[split - 1], P[split + 1]));
  fitCubic(P.slice(0, split + 1), t1, tc, err, out, depth + 1);
  fitCubic(P.slice(split), mul(tc, -1), t2, err, out, depth + 1);
}

// ---- main ----------------------------------------------------------------
// opts: { ink, threshold, smooth (px fit error, 0 = straight lines only),
//         corner (deg: turns sharper than this stay corners), minArea (px^2) }
function traceImage(img, opts) {
  opts = opts || {};
  const mask = inkMask(img, opts);
  return traceMask(mask, opts);
}

function traceMask(mask, opts) {
  opts = opts || {};
  const smooth = opts.smooth == null ? 1 : opts.smooth;
  const cornerDeg = opts.corner == null ? 60 : opts.corner;
  const minArea = opts.minArea == null ? 4 : opts.minArea;
  const loops = crackLoops(mask).filter((p) => Math.abs(polyArea(p)) >= minArea);
  const contours = [];
  for (const raw of loops) {
    const n = raw.length;
    const kept = dpClosed(raw, 0.75);           // removes the pixel staircase
    if (kept.length < 3) continue;
    if (smooth <= 0) {                          // straight-line mode (pixel fonts)
      const lin = dpClosed(raw, 0.01);
      const c = [{ t: "M", x: raw[lin[0]][0], y: raw[lin[0]][1] }];
      for (let i = 1; i < lin.length; i++) c.push({ t: "L", x: raw[lin[i]][0], y: raw[lin[i]][1] });
      contours.push(c);
      continue;
    }
    // corners: turn angle at each kept vertex
    const K = kept.length;
    const isCorner = new Uint8Array(K);
    for (let i = 0; i < K; i++) {
      const a = raw[kept[(i - 1 + K) % K]], b = raw[kept[i]], c = raw[kept[(i + 1) % K]];
      const v1 = norm(sub(b, a)), v2 = norm(sub(c, b));
      const turn = Math.acos(Math.max(-1, Math.min(1, dot(v1, v2)))) * 180 / Math.PI;
      const la = Math.hypot(b[0] - a[0], b[1] - a[1]), lc = Math.hypot(c[0] - b[0], c[1] - b[1]);
      // a sharp turn between two real edges is a corner; tiny steps are noise
      if (turn >= cornerDeg && Math.min(la, lc) >= 1.5) isCorner[i] = 1;
    }
    // dense de-staircased points: edge midpoints, corners kept exact
    const cornerIdx = [];
    for (let i = 0; i < K; i++) if (isCorner[i]) cornerIdx.push(kept[i]);
    const isC = new Uint8Array(n);
    cornerIdx.forEach((i) => { isC[i] = 1; });
    const dense = [], denseIsC = [];
    for (let i = 0; i < n; i++) {
      if (isC[i]) { dense.push(raw[i].slice()); denseIsC.push(1); continue; }
      const q = raw[(i + 1) % n];
      if (isC[(i + 1) % n]) continue;
      dense.push([(raw[i][0] + q[0]) / 2, (raw[i][1] + q[1]) / 2]); denseIsC.push(0);
    }
    // light smoothing of non-corner points (two passes of 1-2-1)
    const D = dense.length;
    for (let pass = 0; pass < 2; pass++) {
      const cp = dense.map((p) => p.slice());
      for (let i = 0; i < D; i++) {
        if (denseIsC[i]) continue;
        const a = cp[(i - 1 + D) % D], b = cp[(i + 1) % D];
        dense[i] = [(a[0] + 2 * cp[i][0] + b[0]) / 4, (a[1] + 2 * cp[i][1] + b[1]) / 4];
      }
    }
    // segments between corners (or the whole loop, closed smoothly)
    const cs = [];
    for (let i = 0; i < D; i++) if (denseIsC[i]) cs.push(i);
    const beziers = [];
    const tangentAt = (pts, i, dir) => {
      const k = Math.min(3, pts.length - 1);
      return norm(sub(pts[dir > 0 ? Math.min(pts.length - 1, i + k) : Math.max(0, i - k)], pts[i]));
    };
    if (!cs.length) {
      const pts = dense.concat([dense[0]]);
      const tin = norm(sub(dense[1 % D], dense[(D - 1) % D]));
      fitCubic(pts, tin, mul(tin, -1), smooth, beziers, 0);
    } else {
      for (let s = 0; s < cs.length; s++) {
        const i0 = cs[s], i1 = cs[(s + 1) % cs.length];
        const pts = [];
        for (let i = i0; ; i = (i + 1) % D) { pts.push(dense[i]); if (i === i1 && pts.length > 1) break; if (pts.length > D + 1) break; }
        if (pts.length < 2) continue;
        // short straight runs between corners stay straight lines
        const chord = Math.hypot(pts[pts.length - 1][0] - pts[0][0], pts[pts.length - 1][1] - pts[0][1]);
        let dev = 0;
        for (const p of pts) {
          const P0 = pts[0], P1 = pts[pts.length - 1];
          const dx = P1[0] - P0[0], dy = P1[1] - P0[1];
          dev = Math.max(dev, Math.abs((p[0] - P0[0]) * dy - (p[1] - P0[1]) * dx) / (chord || 1));
        }
        if (chord > 1e-6 && dev <= Math.max(0.6, smooth * 0.5)) { beziers.push({ line: true, a: pts[0], b: pts[pts.length - 1] }); continue; }
        fitCubic(pts, tangentAt(pts, 0, 1), tangentAt(pts, pts.length - 1, -1), smooth, beziers, 0);
      }
    }
    if (!beziers.length) continue;
    const first = beziers[0].line ? beziers[0].a : beziers[0][0];
    const c = [{ t: "M", x: r2(first[0]), y: r2(first[1]) }];
    for (const b of beziers) {
      if (b.line) c.push({ t: "L", x: r2(b.b[0]), y: r2(b.b[1]) });
      else c.push({ t: "C", x1: r2(b[1][0]), y1: r2(b[1][1]), x2: r2(b[2][0]), y2: r2(b[2][1]), x: r2(b[3][0]), y: r2(b[3][1]) });
    }
    // drop the closing duplicate of the start point
    const L = c[c.length - 1];
    if (L.t === "L" && Math.abs(L.x - c[0].x) < 1e-6 && Math.abs(L.y - c[0].y) < 1e-6) c.pop();
    contours.push(c);
  }
  return { contours, mode: mask.mode, w: mask.w, h: mask.h };
}
const r2 = (v) => Math.round(v * 100) / 100;

module.exports = { inkMask, crackLoops, traceImage, traceMask, polyArea, fitCubic };
