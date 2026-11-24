"use strict";
// Frank's Worlds Brew: surface layers. Each object can carry a stack of bitmap layers over its base material,
// like Photoshop layers: how the picture wraps (box, cylinder, sphere, top-down or the model's own UVs), tiles,
// offset, rotation, opacity, blend mode, a mask (height, slope or a mask bitmap), relief (bump), shine and glow.
// This file is the reference maths used by the CPU ray tracer; the app's GPU view runs the same steps in GLSL
// (apps/worlds-brew-app/renderer/surfaces.js), so the two agree.

const WRAPS = ["Box", "Cylinder", "Sphere", "Top", "UV"];
const BLENDS = ["Normal", "Multiply", "Screen", "Overlay", "Add"];
const MASKS = ["None", "Height", "Slope", "Bitmap"];
let LID = 1;

function layer(extra) {
  return Object.assign({ id: LID++, on: true, name: "Layer", img: null, wrap: "Box", tile: 1, ox: 0, oy: 0, rot: 0, opacity: 100, blend: "Normal",
    mask: "None", lo: 0, hi: 1, soft: 0.1, inv: false, mimg: null, bump: 0, shine: false, rough: 0.5, metal: 0, glow: 0 }, extra || {});
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, x) => { if (b <= a) return x < a ? 0 : 1; const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// the object's box for the projections: centre + half-size in local metres (before rotation)
function frame(o) {
  const s = o.s || 1, ax = o.sx || 1, ay = o.sy || 1, az = o.sz || 1;
  if (o.type === "terrain") return { c: [0, (o.h || 1) / 2, 0], e: [s, Math.max(0.01, (o.h || 1) / 2), s] };
  if (o.type === "torus") return { c: [0, 0, 0], e: [s * ax, 0.28 * s * ay, s * az] };
  if (o.type === "mesh" && o.mesh) { const hy = o.mesh.hy || 1; return { c: [0, 0, 0], e: [s * ax, s * ay * hy, s * az] }; }
  return { c: [0, 0, 0], e: [s * ax, s * ay, s * az] };
}

// bilinear, repeating sample of an RGBA picture ({ w, h, d }); v = 1 is the top row. Returns [r, g, b, a] 0..1
function sample(T, u, v, out) {
  const x = (u - Math.floor(u)) * T.w - 0.5, y = (1 - (v - Math.floor(v))) * T.h - 0.5;
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, W = T.w, H = T.h, d = T.d;
  const i = (xx, yy) => ((((yy % H) + H) % H) * W + (((xx % W) + W) % W)) * 4;
  const a = i(x0, y0), b = i(x0 + 1, y0), c = i(x0, y0 + 1), e = i(x0 + 1, y0 + 1);
  for (let k = 0; k < 4; k++) out[k] = ((d[a + k] * (1 - fx) + d[b + k] * fx) * (1 - fy) + (d[c + k] * (1 - fx) + d[e + k] * fx) * fy) / 255;
  return out;
}
// tile, rotate (degrees, around the picture's centre) and offset (fraction of a tile)
function place(L, u, v) {
  const r = (L.rot || 0) * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r), t = L.tile || 1, x = u - 0.5, y = v - 0.5;
  return [(cs * x - sn * y) * t + 0.5 + (L.ox || 0), (sn * x + cs * y) * t + 0.5 + (L.oy || 0)];
}
// sample a picture through the layer's wrap. q = local position / half-size (-1..1), n = local normal, uv = model UVs or null
function wrapSample(L, T, q, n, uv, out) {
  const w = L.wrap;
  if (w === "Box" || (w === "UV" && !uv)) {   // three planar projections blended by the normal
    let wx = n[0] ** 4, wy = n[1] ** 4, wz = n[2] ** 4; const s = wx + wy + wz || 1; wx /= s; wy /= s; wz /= s;
    const acc = [0, 0, 0, 0], tmp = [0, 0, 0, 0];
    const add = (u, v, k) => { if (k < 0.002) return; const p = place(L, u, v); sample(T, p[0], p[1], tmp); for (let j = 0; j < 4; j++) acc[j] += tmp[j] * k; };
    add(q[2] * 0.5 + 0.5, q[1] * 0.5 + 0.5, wx); add(q[0] * 0.5 + 0.5, q[2] * 0.5 + 0.5, wy); add(q[0] * 0.5 + 0.5, q[1] * 0.5 + 0.5, wz);
    for (let j = 0; j < 4; j++) out[j] = acc[j]; return out;
  }
  let u, v;
  if (w === "Cylinder") { u = Math.atan2(q[0], q[2]) / (Math.PI * 2) + 0.5; v = q[1] * 0.5 + 0.5; }
  else if (w === "Sphere") { const l = Math.hypot(q[0], q[1], q[2]) || 1; u = Math.atan2(q[0], q[2]) / (Math.PI * 2) + 0.5; v = Math.asin(clamp(q[1] / l, -1, 1)) / Math.PI + 0.5; }
  else if (w === "Top") { u = q[0] * 0.5 + 0.5; v = -q[2] * 0.5 + 0.5; }
  else { u = uv[0]; v = uv[1]; }
  const p = place(L, u, v); return sample(T, p[0], p[1], out);
}
const lum = (c) => c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
function band(L, x) {   // 1 inside lo..hi, soft edges; the ends at 0 and 1 stay open
  const s = Math.max(0.001, L.soft || 0), lo = L.lo || 0, hi = L.hi == null ? 1 : L.hi;
  let k = lo <= 0 ? 1 : smooth(lo - s, lo + s, x); if (hi < 1) k *= 1 - smooth(hi - s, hi + s, x); return k;
}
function blendCh(mode, b, t) {
  if (mode === "Multiply") return b * t;
  if (mode === "Screen") return 1 - (1 - b) * (1 - t);
  if (mode === "Overlay") return b < 0.5 ? 2 * b * t : 1 - 2 * (1 - b) * (1 - t);
  if (mode === "Add") return Math.min(1, b + t);
  return t;
}

/* Shade a point. o = the scene object, lp = local position (metres, object frame), ln = local normal,
   wny = world normal's up component (for the slope mask), uv = model UVs or null.
   base = { r, g, b, rough, metal } is changed in place; returns { glow: [r,g,b], h } (h = relief height). */
function shade(o, F, lp, ln, wny, uv, base) {
  const q = [(lp[0] - F.c[0]) / F.e[0], (lp[1] - F.c[1]) / F.e[1], (lp[2] - F.c[2]) / F.e[2]], c = [0, 0, 0, 0], m = [0, 0, 0, 0];
  const glow = [0, 0, 0]; let h = 0;
  for (const L of o.layers) {
    if (!L.on || !L.img) continue;
    wrapSample(L, L.img, q, ln, uv, c);
    let k = (L.opacity == null ? 100 : L.opacity) / 100 * c[3];
    if (L.mask === "Height") k *= band(L, clamp(q[1] * 0.5 + 0.5, 0, 1));
    else if (L.mask === "Slope") k *= band(L, clamp(wny, 0, 1));
    else if (L.mask === "Bitmap" && L.mimg) k *= lum(wrapSample(L, L.mimg, q, ln, uv, m));
    if (L.inv && L.mask !== "None") k = (L.opacity == null ? 100 : L.opacity) / 100 * c[3] - k;
    if (k <= 0.001) continue;
    base.r += (blendCh(L.blend, base.r, c[0]) - base.r) * k; base.g += (blendCh(L.blend, base.g, c[1]) - base.g) * k; base.b += (blendCh(L.blend, base.b, c[2]) - base.b) * k;
    if (L.shine) { base.rough += (L.rough - base.rough) * k; base.metal += (L.metal - base.metal) * k; }
    if (L.glow > 0) { glow[0] += c[0] * L.glow * k; glow[1] += c[1] * L.glow * k; glow[2] += c[2] * L.glow * k; }
    if (L.bump) h += lum(c) * L.bump * k;
  }
  return { glow, h };
}
const active = (o) => !!(o && o.layers && o.layers.some((L) => L.on && L.img));

// a picture from code (for the built-in presets and tests): paint(u, v) -> [r, g, b] or [r, g, b, a] in 0..255
function makeImage(name, size, paint) {
  const d = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const p = paint(x / size, 1 - y / size), i = (y * size + x) * 4; d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = p.length > 3 ? p[3] : 255; }
  return { w: size, h: size, d, name };
}

module.exports = { WRAPS, BLENDS, MASKS, layer, frame, sample, place, wrapSample, band, blendCh, shade, active, makeImage, lum };
