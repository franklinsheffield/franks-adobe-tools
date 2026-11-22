"use strict";
// ======================================================================
// Outline geometry shared by the tracer, the Photoshop path reader, the
// font writer and the preview: transforms, bounds, flattening, winding
// fix-up and an anti-aliased non-zero rasteriser.
// Contour format: [{t:"M",x,y}, {t:"L",x,y} | {t:"C",x1,y1,x2,y2,x,y}, ...] (closed).
// ======================================================================

function mapContours(contours, fn) {
  return contours.map((c) => c.map((s) => {
    if (s.t === "C") { const a = fn(s.x1, s.y1), b = fn(s.x2, s.y2), p = fn(s.x, s.y); return { t: "C", x1: a[0], y1: a[1], x2: b[0], y2: b[1], x: p[0], y: p[1] }; }
    const p = fn(s.x, s.y); return { t: s.t, x: p[0], y: p[1] };
  }));
}

// sample a contour into a polygon [[x,y],...]
function flatten(c, steps) {
  steps = steps || 8;
  const out = [];
  let px = 0, py = 0;
  for (const s of c) {
    if (s.t === "M" || s.t === "L") { out.push([s.x, s.y]); px = s.x; py = s.y; continue; }
    for (let k = 1; k <= steps; k++) {
      const t = k / steps, u = 1 - t;
      out.push([
        u * u * u * px + 3 * u * u * t * s.x1 + 3 * u * t * t * s.x2 + t * t * t * s.x,
        u * u * u * py + 3 * u * u * t * s.y1 + 3 * u * t * t * s.y2 + t * t * t * s.y
      ]);
    }
    px = s.x; py = s.y;
  }
  return out;
}

function area(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return a / 2;
}
function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}

function reverse(c) {
  // segment i runs from point i-1 to point i; the closing line back to the start is implicit
  const n = c.length, P = c.map((s) => [s.x, s.y]);
  const out = [{ t: "M", x: P[0][0], y: P[0][1] }];
  if (!(P[n - 1][0] === P[0][0] && P[n - 1][1] === P[0][1])) out.push({ t: "L", x: P[n - 1][0], y: P[n - 1][1] });
  for (let i = n - 1; i >= 1; i--) {
    const s = c[i], to = P[i - 1];
    if (i === 1 && s.t !== "C") break;            // back to the start: implicit close
    if (s.t === "C") out.push({ t: "C", x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1, x: to[0], y: to[1] });
    else out.push({ t: "L", x: to[0], y: to[1] });
  }
  return out;
}

// Make winding consistent: outermost contours positive area (in the
// coordinate system given), holes negative, by nesting depth (even-odd
// artwork in, non-zero-safe font outlines out).
function fixWinding(contours, outerPositive) {
  const polys = contours.map((c) => flatten(c, 6));
  return contours.map((c, i) => {
    const p = polys[i];
    if (p.length < 3) return c;
    let depth = 0;
    const probe = p[0];
    for (let j = 0; j < polys.length; j++) if (j !== i && polys[j].length > 2 && Math.abs(area(polys[j])) > Math.abs(area(p)) && inside(probe, polys[j])) depth++;
    const want = (depth % 2 === 0) === !!outerPositive;
    const isPos = area(p) > 0;
    return isPos === want ? c : reverse(c);
  });
}

function bounds(contours) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of contours) for (const q of flatten(c, 6)) {
    if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
    if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
  }
  return isFinite(x0) ? { x0, y0, x1, y1 } : null;
}

// Anti-aliased non-zero fill into a w x h coverage buffer (0..255), 4x4 supersampled.
function rasterize(contours, w, h, cov, opts) {
  cov = cov || new Uint8Array(w * h);
  const SS = (opts && opts.ss) || 4;
  const edges = [];
  for (const c of contours) {
    const p = flatten(c, 10);
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const a = p[j], b = p[i];
      if (a[1] === b[1]) continue;
      edges.push(a[1] < b[1] ? [a[0], a[1], b[0], b[1], 1] : [b[0], b[1], a[0], a[1], -1]);
    }
  }
  if (!edges.length) return cov;
  let ymin = Infinity, ymax = -Infinity;
  for (const e of edges) { if (e[1] < ymin) ymin = e[1]; if (e[3] > ymax) ymax = e[3]; }
  const y0 = Math.max(0, Math.floor(ymin)), y1 = Math.min(h - 1, Math.ceil(ymax));
  const acc = new Float32Array(w);
  const xs = [];
  for (let y = y0; y <= y1; y++) {
    acc.fill(0);
    let any = false;
    for (let sy = 0; sy < SS; sy++) {
      const fy = y + (sy + 0.5) / SS;
      xs.length = 0;
      for (const e of edges) if (fy >= e[1] && fy < e[3]) xs.push([e[0] + (fy - e[1]) * (e[2] - e[0]) / (e[3] - e[1]), e[4]]);
      if (!xs.length) continue;
      xs.sort((a, b) => a[0] - b[0]);
      let wind = 0;
      for (let k = 0; k < xs.length - 1; k++) {
        wind += xs[k][1];
        if (!wind) continue;
        const xa = Math.max(0, xs[k][0]), xb = Math.min(w, xs[k + 1][0]);
        if (xb <= xa) continue;
        any = true;
        // horizontal coverage with exact partial ends
        const ia = Math.floor(xa), ib = Math.floor(xb);
        if (ia === ib) { acc[ia] += (xb - xa); continue; }
        acc[ia] += (ia + 1 - xa);
        for (let x = ia + 1; x < ib && x < w; x++) acc[x] += 1;
        if (ib < w) acc[ib] += (xb - ib);
      }
    }
    if (!any) continue;
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (!acc[x]) continue;
      const v = Math.min(255, cov[row + x] + Math.round(255 * acc[x] / SS));
      cov[row + x] = v;
    }
  }
  return cov;
}

// overlap of two binary-ish masks (coverage >= 128 vs 0/1 mask): intersection / union
function iou(cov, mask) {
  let inter = 0, uni = 0;
  for (let i = 0; i < mask.length; i++) {
    const a = cov[i] >= 128, b = !!mask[i];
    if (a && b) inter++;
    if (a || b) uni++;
  }
  return uni ? inter / uni : 0;
}

function stroke(contours, w, h, rgb, color, opts) {
  // 1px outline overlay for the preview
  for (const c of contours) {
    const p = flatten(c, 10);
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const a = p[j], b = p[i];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(a[0] + (b[0] - a[0]) * k / n), y = Math.round(a[1] + (b[1] - a[1]) * k / n);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const q = (y * w + x) * 3;
        rgb[q] = color[0]; rgb[q + 1] = color[1]; rgb[q + 2] = color[2];
      }
    }
  }
  return rgb;
}

module.exports = { mapContours, flatten, area, inside, reverse, fixWinding, bounds, rasterize, iou, stroke };
