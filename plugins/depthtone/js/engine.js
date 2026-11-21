"use strict";
// Depthtone engine: brightness becomes depth, redrawn as contour lines,
// stacked terraces or a lit relief, coloured near -> far with optional fog.
const M = require("../core/imgmath.js");
const { clamp } = M;

async function render(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const { L, A } = M.luminance(src);
  if (P.depth.invert) for (let i = 0; i < n; i++) L[i] = 1 - L[i];
  if (P.depth.smooth > 0) M.boxBlur(L, w, h, P.depth.smooth * sc, 3);
  await yieldFn();
  // near / far range -> 0..1 depth (1 = near), quantised to `levels`
  const lo = P.depth.far / 100, hi = Math.max(lo + 0.01, P.depth.near / 100), lv = Math.max(2, Math.round(P.depth.levels));
  const Q = new Uint8Array(n), D = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const d = clamp((L[i] - lo) / (hi - lo), 0, 1);
    const q = Math.min(lv - 1, Math.floor(d * lv));
    Q[i] = q; D[i] = q / (lv - 1);
  }
  const lut = M.gradientLUT(P.look.stops);
  const fog = M.hexToRgb(P.look.fogColor), fogAmt = P.look.fog / 100;
  const colourOf = (t, out, k) => {
    const q = Math.round(t * 255) * 3, f = fogAmt * (1 - t) * (1 - t);   // far = more fog
    out[k] = lut[q] + (fog[0] - lut[q]) * f; out[k + 1] = lut[q + 1] + (fog[1] - lut[q + 1]) * f; out[k + 2] = lut[q + 2] + (fog[2] - lut[q + 2]) * f;
  };
  const layers = [];
  const az = P.light.angle * Math.PI / 180, ldx = Math.cos(az), ldy = -Math.sin(az);

  if (P.style === "contours") {
    // edge where the level changes between neighbours, thickened to line width
    const E = new Uint8Array(n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, q = Q[i];
      if ((x + 1 < w && Q[i + 1] !== q) || (y + 1 < h && Q[i + w] !== q)) E[i] = 1;
    }
    const r = Math.max(0, Math.round((P.lines.width * sc - 1) / 2));
    const LN = new Float32Array(n);
    for (let i = 0; i < n; i++) LN[i] = E[i];
    if (r > 0) { M.boxBlur(LN, w, h, r, 1); for (let i = 0; i < n; i++) LN[i] = LN[i] > 0.5 / (2 * r + 1) ? 1 : 0; }
    // every Nth level only (spacing)
    const every = Math.max(1, Math.round(P.lines.every));
    const lineCol = M.hexToRgb(P.lines.color), useGrad = P.lines.colorBy === "depth";
    const out = new Uint8Array(n * 4), tmp = new Float32Array(3);
    for (let i = 0; i < n; i++) {
      if (!LN[i] || (Q[i] % every) !== 0 && every > 1) continue;
      if (useGrad) { colourOf(D[i], tmp, 0); out[i * 4] = tmp[0]; out[i * 4 + 1] = tmp[1]; out[i * 4 + 2] = tmp[2]; }
      else { out[i * 4] = lineCol[0]; out[i * 4 + 1] = lineCol[1]; out[i * 4 + 2] = lineCol[2]; }
      out[i * 4 + 3] = A[i];
    }
    if (P.lines.fill) {
      const fill = new Uint8Array(n * 4);
      for (let i = 0; i < n; i++) { colourOf(D[i], tmp, 0); fill[i * 4] = tmp[0]; fill[i * 4 + 1] = tmp[1]; fill[i * 4 + 2] = tmp[2]; fill[i * 4 + 3] = A[i]; }
      layers.push({ name: "Depth fill", rgba: fill, blend: "NORMAL" });
    }
    layers.push({ name: "Contours", rgba: out, blend: "NORMAL" });
    return { w, h, layers, notes: [] };
  }

  const C = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) colourOf(D[i], C, i * 3);
  if (P.style === "terraces") {
    // drop shadow: darken where a nearer level sits up-light within `dist`
    const dist = Math.max(1, Math.round(P.light.shadow * sc)), amt = P.light.strength / 100;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x; let s = 0;
        for (let k = 1; k <= dist; k++) {
          const sx = Math.round(x + ldx * k), sy = Math.round(y + ldy * k);
          if (sx < 0 || sy < 0 || sx >= w || sy >= h) break;
          if (Q[sy * w + sx] > Q[i]) { s = 1 - (k - 1) / dist; break; }
        }
        const m = 1 - amt * 0.6 * s;
        C[i * 3] *= m; C[i * 3 + 1] *= m; C[i * 3 + 2] *= m;
      }
      if ((y & 63) === 0) await yieldFn();
    }
  } else {
    // relief: lit height field from the stepped depth
    const H = Float32Array.from(D);
    M.boxBlur(H, w, h, Math.max(1, 1.5 * sc), 1);
    const el = 45 * Math.PI / 180, lx = ldx * Math.cos(el), ly = ldy * Math.cos(el), lz = Math.sin(el);
    const k = 8 * (P.light.strength / 100) / Math.max(0.25, sc);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const dx = (H[y * w + Math.min(x + 1, w - 1)] - H[y * w + Math.max(x - 1, 0)]) * k;
      const dy = (H[Math.min(y + 1, h - 1) * w + x] - H[Math.max(y - 1, 0) * w + x]) * k;
      const nl = Math.hypot(dx, dy, 1), diff = Math.max(0, (-dx * lx - dy * ly + lz) / nl);
      const m = clamp(0.35 + 0.65 * diff / lz, 0, 1.5);
      C[i * 3] *= m; C[i * 3 + 1] *= m; C[i * 3 + 2] *= m;
    }
  }
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { out[i * 4] = clamp(C[i * 3], 0, 255); out[i * 4 + 1] = clamp(C[i * 3 + 1], 0, 255); out[i * 4 + 2] = clamp(C[i * 3 + 2], 0, 255); out[i * 4 + 3] = A[i]; }
  layers.push({ name: P.style === "terraces" ? "Terraces" : "Relief", rgba: out, blend: "NORMAL" });
  return { w, h, layers, notes: [] };
}

module.exports = { render, composite: M.composite, demoImage: M.demoImage };
