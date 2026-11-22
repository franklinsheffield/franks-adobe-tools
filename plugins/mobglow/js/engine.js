"use strict";
// Mobglow 2.0 engine: a realistic, dreamy bloom (Frank's spec, 2026-11-22).
// Light above a threshold (relative to the picture's own brightest lights)
// spreads through six blur sizes, from Radius/32 to Radius, and is added as
// light in linear space with a soft shoulder. The result is stored as one
// Screen layer over the untouched original.
const M = require("../core/imgmath.js");
const { clamp } = M;

// sRGB <-> linear lookup tables
const TO_LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; TO_LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function fromSrgb(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function toSrgb(x) { x = x <= 0 ? 0 : x >= 1 ? 1 : x; return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; }
// soft shoulder: values above KNEE roll off towards 1 instead of clipping
const KNEE = 0.8;
function shoulder(x) { return x <= KNEE ? x : KNEE + (1 - KNEE) * (1 - Math.exp(-(x - KNEE) / (1 - KNEE))); }

// average-downsample a plane by an integer factor
function down(f, w, h, d) {
  const W = Math.max(1, Math.ceil(w / d)), H = Math.max(1, Math.ceil(h / d)), o = new Float32Array(W * H), c = new Float32Array(W * H);
  for (let y = 0; y < h; y++) { const Y = (y / d) | 0; for (let x = 0; x < w; x++) { const j = Y * W + ((x / d) | 0); o[j] += f[y * w + x]; c[j]++; } }
  for (let j = 0; j < o.length; j++) o[j] /= c[j] || 1;
  return { f: o, w: W, h: H };
}
// bilinear upsample back to w x h and add k * value into acc
function upAdd(acc, s, w, h, d, k) {
  const { f, w: W, h: H } = s;
  for (let y = 0; y < h; y++) {
    const fy = clamp((y + 0.5) / d - 0.5, 0, H - 1), y0 = fy | 0, y1 = Math.min(H - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = clamp((x + 0.5) / d - 0.5, 0, W - 1), x0 = fx | 0, x1 = Math.min(W - 1, x0 + 1), tx = fx - x0;
      const a = f[y0 * W + x0] + (f[y0 * W + x1] - f[y0 * W + x0]) * tx, b = f[y1 * W + x0] + (f[y1 * W + x1] - f[y1 * W + x0]) * tx;
      acc[y * w + x] += (a + (b - a) * ty) * k;
    }
  }
}
// Gaussian-like blur of radius r (3 box passes), done at reduced size for big radii
function blurAdd(acc, plane, w, h, r, k) {
  const rb = r / 1.7;
  if (rb < 1) { for (let i = 0; i < acc.length; i++) acc[i] += plane[i] * k; return; }
  let d = 1;
  while (rb / (d * 2) >= 4 && d < 64) d *= 2;
  if (d === 1) { const b = M.boxBlur(Float32Array.from(plane), w, h, rb, 3); for (let i = 0; i < acc.length; i++) acc[i] += b[i] * k; return; }
  const s = down(plane, w, h, d);
  M.boxBlur(s.f, s.w, s.h, rb / d, 3);
  upAdd(acc, s, w, h, d, k);
}

async function render(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale, d = src.data;
  const g = P.glow, col = P.color || {}, fin = P.finish || {};
  // 1. linear light + luminance; reference level = brightest 0.5 % of the picture
  const LR = new Float32Array(n), LG = new Float32Array(n), LB = new Float32Array(n), Y = new Float32Array(n), A = new Float32Array(n);
  const hist = new Uint32Array(1024);
  for (let i = 0; i < n; i++) {
    const r = TO_LIN[d[i * 4]], gg = TO_LIN[d[i * 4 + 1]], b = TO_LIN[d[i * 4 + 2]];
    LR[i] = r; LG[i] = gg; LB[i] = b; A[i] = d[i * 4 + 3] / 255;
    const y = 0.2126 * r + 0.7152 * gg + 0.0722 * b; Y[i] = y;
    if (A[i] > 0) hist[Math.min(1023, (y * 1023) | 0)]++;
  }
  let total = 0; for (let i = 0; i < 1024; i++) total += hist[i];
  let ref = 1, acc = 0;
  for (let i = 1023; i >= 0; i--) { acc += hist[i]; if (acc >= total * 0.005) { ref = (i + 0.5) / 1023; break; } }
  ref = Math.max(0.05, ref);
  // 2. bright pass with a soft knee, shaped by gamma, coloured by saturation or one tint colour
  const t = ref * clamp(g.threshold, 0, 3) / 2, knee = 0.5 * t + 1e-4, gam = clamp(g.gamma, 0.1, 3), satK = clamp(g.sat, 0, 100) / 100 * 3;
  let tint = null;
  if (col.on) { const c = M.hexToRgb(M.isHex(col.hex) ? col.hex : "#E0305A").map((v) => TO_LIN[v]), l = Math.max(0.02, 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]); tint = c.map((v) => v / l); }
  const BR = new Float32Array(n), BG = new Float32Array(n), BB = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const y = Y[i], x = clamp(y - t + knee, 0, 2 * knee), soft = x * x / (4 * knee);
    const wgt = Math.max(soft, y - t) / Math.max(y, 1e-4) * A[i] / ref;
    let r = Math.pow(LR[i] * wgt, gam), gg = Math.pow(LG[i] * wgt, gam), b = Math.pow(LB[i] * wgt, gam);
    const m = (r + gg + b) / 3;
    if (tint) { r = m * tint[0]; gg = m * tint[1]; b = m * tint[2]; }
    else { r = m + (r - m) * satK; gg = m + (gg - m) * satK; b = m + (b - m) * satK; }
    BR[i] = Math.max(0, r); BG[i] = Math.max(0, gg); BB[i] = Math.max(0, b);
  }
  await yieldFn();
  // 3. six blur sizes, Radius/32 .. Radius (Radius is in px on a 2048 px long side)
  const R = Math.max(1, g.radius) * Math.max(P.fullW || w / sc, P.fullH || h / sc) / 2048 * sc;
  const k = clamp(g.strength, 0, 500) / 100 * 3 * ref / 6;
  const GR = new Float32Array(n), GG = new Float32Array(n), GB = new Float32Array(n);
  for (const f of [1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1]) {
    const r = Math.max(0.5, R * f);
    blurAdd(GR, BR, w, h, r, k); blurAdd(GG, BG, w, h, r, k); blurAdd(GB, BB, w, h, r, k);
    await yieldFn();
  }
  // 4. add as light with a soft shoulder, then store it as a Screen layer:
  //    screen(S, Gl) = 1 - (1 - S)(1 - Gl)  =>  Gl = 1 - (1 - O) / (1 - S)
  const gAmt = (fin.grain || 0) / 100 * 0.12, dkA = clamp((fin.darken || 0) / 100, 0, 1);
  const glow = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    let nz = 0;
    if (gAmt) { const x = i % w, y = (i / w) | 0; nz = M.hashNoise(Math.round(x / sc), Math.round(y / sc), 7) * gAmt * Math.min(1, (GR[i] + GG[i] + GB[i]) * 2); }
    const fd = 1 - dkA * A[i], gl = [GR[i] + nz, GG[i] + nz, GB[i] + nz];
    for (let c = 0; c < 3; c++) {
      const S = d[i * 4 + c] / 255 * fd, pl = fd === 1 ? [LR, LG, LB][c][i] : fromSrgb(S);   // the base under the glow (after Background darken)
      const O = toSrgb(Math.max(pl, shoulder(pl + Math.max(0, gl[c]))));
      glow[i * 4 + c] = S >= 0.999 ? 0 : Math.round(clamp(1 - (1 - O) / (1 - S), 0, 1) * 255);
    }
    glow[i * 4 + 3] = 255;
  }
  const layers = [];
  if (fin.darken > 0) {
    const dk = new Uint8Array(n * 4), a = Math.round(fin.darken / 100 * 255);
    for (let i = 0; i < n; i++) dk[i * 4 + 3] = Math.round(a * A[i]);
    layers.push({ name: "Background darken", rgba: dk, blend: "NORMAL" });
  }
  layers.push({ name: "Glow", rgba: glow, blend: "SCREEN" });
  return { w, h, layers, notes: [], overSource: true };
}

module.exports = { render, composite: M.composite, demoImage: M.demoImage };
