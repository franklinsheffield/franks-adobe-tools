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

function hueOf(c) {
  const r = c[0], g = c[1], b = c[2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d <= 0) return 0;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
// 1-D blur along rows (or columns): 3 running-box passes, so a long soft streak
function line1d(f, w, h, r, vert) {
  const L = vert ? h : w, lines = vert ? w : h, ri = Math.max(1, Math.round(r)), buf = new Float32Array(L);
  for (let pass = 0; pass < 3; pass++) for (let a = 0; a < lines; a++) {
    const at = (b) => (vert ? b * w + a : a * w + b);
    for (let b = 0; b < L; b++) buf[b] = f[at(b)];
    let s = 0; for (let b = -ri; b <= ri; b++) s += buf[Math.min(L - 1, Math.max(0, b))];
    for (let b = 0; b < L; b++) {
      f[at(b)] = s / (2 * ri + 1);
      s += buf[Math.min(L - 1, b + ri + 1)] - buf[Math.max(0, b - ri)];
    }
  }
  return f;
}

async function render(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale, d = src.data;
  const g = P.glow, col = P.color || {}, fin = P.finish || {};
  // 3.0 Light Key: coloured light sources (LED strips, neon) key in by their own colour, not just brightness
  const lightKey = g.key === "light";
  // 3.0 Key colour: only light near one hue blooms
  const KC = P.keycol || {}, kc = KC.on && M.isHex(KC.hex) ? hueOf(M.hexToRgb(KC.hex)) : null;
  const range = Math.max(5, Math.min(180, KC.range == null ? 30 : KC.range));
  const keyMatch = (r, gg, b) => {
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), s = (mx - mn) / Math.max(mx, 1e-4);
    let dh = Math.abs(hueOf([r, gg, b]) - kc); if (dh > 180) dh = 360 - dh;
    const m = clamp(1 - dh / range, 0, 1);
    return m * m * (3 - 2 * m) * clamp(s * 3, 0, 1);
  };
  // 1. linear light + luminance; reference level = brightest 0.5 % of the picture
  const LR = new Float32Array(n), LG = new Float32Array(n), LB = new Float32Array(n), Y = new Float32Array(n), A = new Float32Array(n);
  const hist = new Uint32Array(1024);
  for (let i = 0; i < n; i++) {
    const r = TO_LIN[d[i * 4]], gg = TO_LIN[d[i * 4 + 1]], b = TO_LIN[d[i * 4 + 2]];
    LR[i] = r; LG[i] = gg; LB[i] = b; A[i] = d[i * 4 + 3] / 255;
    let y = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    if (lightKey) { const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); y = mx * (0.15 + 0.85 * (mx - mn) / Math.max(mx, 1e-4)); }
    if (kc) y *= keyMatch(r, gg, b);
    Y[i] = y;
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
  // 3.0 Falloff: 50 = even mix of the six sizes; lower keeps the light tight, higher spreads it wide
  const fo = g.falloff == null ? 50 : clamp(g.falloff, 0, 100), FS = [1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1];
  const fw = FS.map((_, i) => Math.pow(4, (i - 2.5) / 2.5 * (fo - 50) / 50)), fsum = fw.reduce((a, b) => a + b, 0);
  for (let si = 0; si < 6; si++) {
    const r = Math.max(0.5, R * FS[si]), kk = k * fw[si] * 6 / fsum;
    blurAdd(GR, BR, w, h, r, kk); blurAdd(GG, BG, w, h, r, kk); blurAdd(GB, BB, w, h, r, kk);
    await yieldFn();
  }
  // 3.0 Streaks: anamorphic lens streaks from the brightest lights only
  const ST = P.streak || {};
  if (ST.on && (ST.strength || 0) > 0) {
    let sr = 0, sg = 0, sb = 0, top = 0;
    for (let i = 0; i < n; i++) top = Math.max(top, BR[i] + BG[i] + BB[i]);
    const cut = top * 0.35, SR = new Float32Array(n), SG = new Float32Array(n), SB = new Float32Array(n);
    for (let i = 0; i < n; i++) { const v = BR[i] + BG[i] + BB[i]; if (v > cut) { const m = (v - cut) / Math.max(top - cut, 1e-6); SR[i] = BR[i] * m; SG[i] = BG[i] * m; SB[i] = BB[i] * m; } }
    const len = Math.max(2, (ST.length == null ? 60 : ST.length) / 100 * Math.max(w, h) * 0.5) / 1.7;
    const blue = ST.color !== "own", gain = clamp(ST.strength, 0, 100) / 100 * 6 * k;
    const dirs = ST.dir === "v" ? [true] : ST.dir === "x" ? [false, true] : [false];
    for (const vert of dirs) {
      const pr = [SR, SG, SB].map((pl) => line1d(Float32Array.from(pl), w, h, len, vert));
      for (let i = 0; i < n; i++) {
        if (blue) { const m = (pr[0][i] + pr[1][i] + pr[2][i]) / 3; sr = m * 0.45; sg = m * 0.75; sb = m * 1.8; }
        else { sr = pr[0][i]; sg = pr[1][i]; sb = pr[2][i]; }
        GR[i] += sr * gain; GG[i] += sg * gain; GB[i] += sb * gain;
      }
    }
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
