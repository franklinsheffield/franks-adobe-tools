"use strict";
// Pixel Scape app: scaling tools (host-free, used by the Inspector and the tests).
// 1 scene unit = 1 metre. Size (o.s) scales everything; Width / Height / Depth (o.sx / sy / sz) stretch one axis.
const CT = require("../engine/controls.js");
const M = require("../engine/models.js");

const FT = 3.28084;
const r3 = (v) => +(+v).toFixed(3);
const clampS = (v) => Math.max(0.02, Math.min(400, v));

// the object's own (unrotated) bounding size in metres: { w, h, d }
function dims(o) {
  if (!o || o.type === "light") return { w: 0, h: 0, d: 0 };
  const s = o.s, ax = o.sx || 1, ay = o.sy || 1, az = o.sz || 1;
  if (o.type === "terrain") { const top = Math.max(0.05, (require("../engine/scene.js").heightmap(o).top || 1)); return { w: r3(2 * s), h: r3(o.h * top), d: r3(2 * s) }; }
  if (o.type === "mesh") {
    if (!o.mesh._box) { const v = o.mesh.v, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < v.length; i += 3) for (let k = 0; k < 3; k++) { if (v[i + k] < mn[k]) mn[k] = v[i + k]; if (v[i + k] > mx[k]) mx[k] = v[i + k]; } o.mesh._box = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]; }
    const b = o.mesh._box; return { w: r3(b[0] * s * ax), h: r3(b[1] * s * ay), d: r3(b[2] * s * az) };
  }
  const base = { sphere: [2, 2, 2], cube: [2, 2, 2], cylinder: [2, 2, 2], cone: [2, 2, 2], torus: [2, 0.56, 2] }[o.type] || [2, 2, 2];
  return { w: r3(base[0] * s * ax), h: r3(base[1] * s * ay), d: r3(base[2] * s * az) };
}
function fmt(m) { return m < 10 ? m.toFixed(2) : m.toFixed(1); }
// "2.40 x 3.10 x 1.20 m  (7.9 x 10.2 x 3.9 ft)"
function sizeText(o) {
  const d = dims(o); if (!d.w && !d.h) return "";
  return fmt(d.w) + " x " + fmt(d.h) + " x " + fmt(d.d) + " m   (" + (d.w * FT).toFixed(1) + " x " + (d.h * FT).toFixed(1) + " x " + (d.d * FT).toFixed(1) + " ft)";
}
function settle(scene, o, stick) { if (stick && o.type !== "terrain" && o.type !== "light") CT.rest(scene, o); return o; }

// multiply the overall size (x0.5, x2, ...)
function mul(scene, o, k, stick) { if (o.type === "terrain") { o.s = r3(clampS(o.s * k)); o.h = r3(clampS(o.h * k)); } else o.s = r3(clampS(o.s * k)); return settle(scene, o, stick); }
// make the object a given real height (metres), keeping its proportions
function setHeight(scene, o, metres, stick) { const h = dims(o).h; if (!(h > 0) || !(metres > 0)) return o; return mul(scene, o, metres / h, stick); }
// set one axis' stretch; with lock on, the other two follow in proportion
function stretch(scene, o, axis, value, lock, stick) {
  const key = { w: "sx", h: "sy", d: "sz" }[axis]; if (!key) return o;
  value = Math.max(0.05, Math.min(20, +value || 1));
  if (o.type === "terrain") { if (axis === "h") o.h = r3(value * (o._h0 || o.h)); else o.s = r3(clampS(value * (o._s0 || o.s))); return o; }
  const old = o[key] || 1, k = value / old;
  if (lock) { o.sx = r3((o.sx || 1) * k); o.sy = r3((o.sy || 1) * k); o.sz = r3((o.sz || 1) * k); } else o[key] = r3(value);
  return settle(scene, o, stick);
}
// after a W / H / D dial edit: with lock on, spread the change of the edited axis to the other two
function applyLock(o, prev) {
  if (!prev) return false;
  const ks = ["sx", "sy", "sz"], ch = ks.filter((k) => Math.abs((o[k] || 1) - (prev[k] || 1)) > 1e-9);
  if (ch.length !== 1) return false;
  const k = (o[ch[0]] || 1) / (prev[ch[0]] || 1);
  ks.forEach((q) => { if (q !== ch[0]) o[q] = r3((prev[q] || 1) * k); });
  return true;
}
function resetStretch(scene, o, stick) { o.sx = 1; o.sy = 1; o.sz = 1; return settle(scene, o, stick); }
// make o the same height as target (its largest side if either is flat)
function match(scene, o, target, stick) {
  const a = dims(o), b = dims(target); if (!a.h || !b.h) return o;
  const sa = Math.max(a.w, a.h, a.d), sb = Math.max(b.w, b.h, b.d);
  return mul(scene, o, a.h > 0.05 && b.h > 0.05 ? b.h / a.h : sb / sa, stick);
}
// a few real-world heights for quick sizing
const REAL = [["Person", 1.8], ["Door", 2.1], ["Car", 1.5], ["House", 7], ["Tree", 12], ["Tower", 30]];

module.exports = { FT, dims, sizeText, mul, setHeight, stretch, applyLock, resetStretch, match, REAL };
