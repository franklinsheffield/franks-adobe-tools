"use strict";
// Mobglow engine: highlights and edges radiate coloured light in three
// halos (tight / mid / wide), with optional RGB fringe, grain and a
// background darken. The original stays visible underneath.
const M = require("../core/imgmath.js");
const { clamp } = M;

async function render(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const { R, G, B, A } = M.planes(src);
  const { L } = M.luminance(src);
  // 1. glow source mask
  const S = new Float32Array(n), th = P.source.threshold / 100, soft = 0.08;
  const useHi = P.source.mode !== "edges", useEd = P.source.mode !== "highlights", es = P.source.edge / 100 * 4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    let m = 0;
    if (useHi) m = clamp((L[i] - th) / soft + 0.5, 0, 1) * L[i];
    if (useEd) {
      const l = (xx, yy) => L[clamp(yy, 0, h - 1) * w + clamp(xx, 0, w - 1)];
      const gx = l(x + 1, y - 1) + 2 * l(x + 1, y) + l(x + 1, y + 1) - l(x - 1, y - 1) - 2 * l(x - 1, y) - l(x - 1, y + 1);
      const gy = l(x - 1, y + 1) + 2 * l(x, y + 1) + l(x + 1, y + 1) - l(x - 1, y - 1) - 2 * l(x, y - 1) - l(x + 1, y - 1);
      m = Math.max(m, clamp(Math.hypot(gx, gy) * es, 0, 1));
    }
    S[i] = m * (A[i] / 255);
  }
  await yieldFn();
  // 2. tint
  const tint = P.tint, c1 = M.hexToRgb(tint.color1), c2 = M.hexToRgb(tint.color2), sat = tint.sat / 100;
  const TR = new Float32Array(n), TG = new Float32Array(n), TB = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let r, g, b;
    if (tint.mode === "source") {
      const m = (R[i] + G[i] + B[i]) / 3;
      r = m + (R[i] - m) * (1 + sat); g = m + (G[i] - m) * (1 + sat); b = m + (B[i] - m) * (1 + sat);
    } else if (tint.mode === "one") { r = c1[0]; g = c1[1]; b = c1[2]; }
    else { const t = L[i]; r = c1[0] + (c2[0] - c1[0]) * t; g = c1[1] + (c2[1] - c1[1]) * t; b = c1[2] + (c2[2] - c1[2]) * t; }
    TR[i] = clamp(r, 0, 255) * S[i]; TG[i] = clamp(g, 0, 255) * S[i]; TB[i] = clamp(b, 0, 255) * S[i];
  }
  // 3. three halos
  const GR = new Float32Array(n), GG = new Float32Array(n), GB = new Float32Array(n);
  for (const halo of [P.halo.tight, P.halo.mid, P.halo.wide]) {
    if (halo.strength <= 0) continue;
    const r = Math.max(1, halo.size * sc), k = halo.strength / 100 * 2;
    const br = M.boxBlur(Float32Array.from(TR), w, h, r, 3), bg = M.boxBlur(Float32Array.from(TG), w, h, r, 3), bb = M.boxBlur(Float32Array.from(TB), w, h, r, 3);
    for (let i = 0; i < n; i++) { GR[i] += br[i] * k; GG[i] += bg[i] * k; GB[i] += bb[i] * k; }
    await yieldFn();
  }
  const gAmt = P.finish.grain / 100 * 30;
  if (gAmt) for (let i = 0; i < n; i++) {
    const x = i % w, y = (i / w) | 0, nz = M.hashNoise(Math.round(x / sc), Math.round(y / sc), 7) * gAmt * Math.min(1, (GR[i] + GG[i] + GB[i]) / 120);
    GR[i] += nz; GG[i] += nz; GB[i] += nz;
  }
  const layers = [];
  if (P.finish.darken > 0) {
    const d = new Uint8Array(n * 4), a = Math.round(P.finish.darken / 100 * 255);
    for (let i = 0; i < n; i++) d[i * 4 + 3] = Math.round(a * (A[i] / 255));
    layers.push({ name: "Background darken", rgba: d, blend: "NORMAL" });
  }
  layers.push({ name: "Glow", rgba: M.toRGBA(GR, GG, GB, null, n), blend: "SCREEN" });
  if (P.fringe.offset > 0) {
    const o = Math.max(1, Math.round(P.fringe.offset * sc)), f = new Uint8Array(n * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, xr = clamp(x - o, 0, w - 1), xb = clamp(x + o, 0, w - 1);
      f[i * 4] = clamp(GR[y * w + xr], 0, 255); f[i * 4 + 1] = 0; f[i * 4 + 2] = clamp(GB[y * w + xb], 0, 255); f[i * 4 + 3] = 255;
    }
    layers.push({ name: "Fringe", rgba: f, blend: "LIGHTEN" });
  }
  return { w, h, layers, notes: [], overSource: true };
}

module.exports = { render, composite: M.composite, demoImage: M.demoImage };
