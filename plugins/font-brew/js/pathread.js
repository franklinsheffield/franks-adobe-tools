"use strict";
// ======================================================================
// Photoshop shape paths -> contours. A shape layer's vector mask comes back
// from batchPlay as pathContents.pathComponents[].subpathListKey[].points[]
// with anchor / forward / backward handles. The unit (points or pixels) and
// the handle order are not documented for PS 28, so we try each reading and
// keep the one whose filled shape best matches the layer's own pixels.
// If none matches well (IoU < minIoU) the caller traces pixels instead.
// No Photoshop calls in here.
// ======================================================================
const G = require("./geom.js");

function val(v) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object") return Number(v._value != null ? v._value : v.value);
  return Number(v);
}
function pt(o) { return o ? [val(o.horizontal), val(o.vertical)] : null; }
function opName(c) {
  const s = c && c.shapeOperation;
  const v = s && (s._value || s.value || s);
  return String(v || "add").toLowerCase();
}

// -> { contours (doc px), ops:[...] } for one unit factor + handle order
function readContours(desc, unit, swap) {
  const pc = desc && (desc.pathContents || desc);
  const comps = (pc && pc.pathComponents) || [];
  const contours = [], ops = [];
  for (const comp of comps) {
    const op = opName(comp);
    for (const sp of comp.subpathListKey || []) {
      const pts = (sp.points || []).map((p) => {
        const a = pt(p.anchor);
        let f = pt(p.forward) || a, b = pt(p.backward) || a;
        if (swap) { const t = f; f = b; b = t; }
        return { a: [a[0] * unit, a[1] * unit], f: [f[0] * unit, f[1] * unit], b: [b[0] * unit, b[1] * unit] };
      });
      if (pts.length < 2) continue;
      const c = [{ t: "M", x: pts[0].a[0], y: pts[0].a[1] }];
      const n = pts.length;
      const closed = sp.closedSubpath !== false;
      for (let i = 1; i <= (closed ? n : n - 1); i++) {
        const p0 = pts[i - 1], p1 = pts[i % n];
        const straight = near(p0.f, p0.a) && near(p1.b, p1.a);
        if (straight) c.push({ t: "L", x: p1.a[0], y: p1.a[1] });
        else c.push({ t: "C", x1: p0.f[0], y1: p0.f[1], x2: p1.b[0], y2: p1.b[1], x: p1.a[0], y: p1.a[1] });
      }
      const L = c[c.length - 1];
      if (L.t === "L" && near([L.x, L.y], [c[0].x, c[0].y])) c.pop();
      contours.push(c);
      ops.push(op);
    }
  }
  return { contours, ops };
}
const near = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;

// desc: batchPlay result; ppi: document resolution
// mask: { w, h, m } ink mask of the layer pixels; origin: {left, top} of the
// mask in doc px; scale: mask px per doc px.
// -> { contours (mask px), iou, unit, swap } or null
function bestReading(desc, ppi, mask, origin, scale, minIoU) {
  const units = [1, (ppi || 72) / 72];
  let best = null;
  for (const unit of units) for (const swap of [false, true]) {
    const r = readContours(desc, unit, swap);
    if (!r.contours.length) continue;
    if (r.ops.some((o) => /xor|intersect|exclude/.test(o))) return null;   // not safe to rebuild: trace instead
    const local = G.mapContours(r.contours, (x, y) => [(x - origin.left) * scale, (y - origin.top) * scale]);
    const cov = G.rasterize(G.fixWinding(local, true), mask.w, mask.h);
    const score = G.iou(cov, mask.m);
    if (!best || score > best.iou) best = { contours: local, iou: score, unit, swap };
  }
  if (!best || best.iou < (minIoU == null ? 0.92 : minIoU)) return best ? Object.assign(best, { rejected: true }) : null;
  return best;
}

module.exports = { readContours, bestReading };
