"use strict";
// CRT Phaser engine: the image on an old tube. Virtual line resolution,
// RGB convergence error, phosphor mask, scanlines, bloom, barrel curvature,
// rounded corners, vignette, noise and a rolling band.
const M = require("../core/imgmath.js");
const { clamp } = M;

function sample(C, w, h, x, y) {              // bilinear
  x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1), fx = x - x0, fy = y - y0;
  const a = C[y0 * w + x0] + (C[y0 * w + x1] - C[y0 * w + x0]) * fx, b = C[y1 * w + x0] + (C[y1 * w + x1] - C[y1 * w + x0]) * fx;
  return a + (b - a) * fy;
}

// monochrome phosphors: luminance times this colour
const TINTS = { green: [0.35, 1.08, 0.45], amber: [1.1, 0.72, 0.2], white: [1, 1, 1.04] };

async function render(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const fullH = P.fullH || h;
  const { R, G, B, A } = M.planes(src);
  // 1. virtual screen: each scanline holds one row-average of the source
  const lines = Math.max(60, Math.min(2000, P.screen.lines));
  const lineH = Math.max(1, fullH / lines) * sc;          // in this image's pixels
  const VR = new Float32Array(n), VG = new Float32Array(n), VB = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    const ly = Math.floor(y / lineH), y0 = Math.floor(ly * lineH), y1 = Math.min(h, Math.max(y0 + 1, Math.floor((ly + 1) * lineH)));
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let yy = y0; yy < y1; yy++) { const i = yy * w + x; r += R[i]; g += G[i]; b += B[i]; }
      const k = y1 - y0, i = y * w + x; VR[i] = r / k; VG[i] = g / k; VB[i] = b / k;
    }
  }
  M.boxBlur(VR, w, h, 0.6 * sc, 1); M.boxBlur(VG, w, h, 0.6 * sc, 1); M.boxBlur(VB, w, h, 0.6 * sc, 1);
  await yieldFn();
  // 2. bloom from the bright parts
  const bloom = P.tube.bloom / 100;
  let BR = null, BG = null, BB = null;
  if (bloom > 0) {
    const t = (v) => Math.max(0, v - 150) * 1.6;
    BR = M.boxBlur(VR.map(t), w, h, 10 * sc, 3); BG = M.boxBlur(VG.map(t), w, h, 10 * sc, 3); BB = M.boxBlur(VB.map(t), w, h, 10 * sc, 3);
  }
  // 3. per output pixel: curvature -> convergence -> mask -> scanline -> finish
  const curv = P.tube.curve / 100 * 0.25, cx = P.conv.x * sc, cy = P.conv.y * sc;
  const maskType = P.mask.type, ms = Math.max(1, P.mask.scale * sc), mStr = P.mask.strength / 100;
  const sStr = P.scan.strength / 100, beam = clamp(P.scan.width / 100, 0.1, 1);
  const vig = P.tube.vignette / 100, rad = P.tube.corner / 100 * 0.12 * Math.min(w, h);
  const noise = P.signal.noise / 100 * 40, rollY = P.signal.roll / 100, rollA = P.signal.rollStrength / 100;
  const bri = P.finish.brightness / 100, con = P.finish.contrast / 100;
  const split = P.out.layers === "split";
  const tint = TINTS[P.finish.tint] || null;
  const scanVis = clamp((lineH - 1.2) / 1.6, 0, 1), maskVis = clamp(P.mask.scale * sc, 0, 1) ** 2;
  const out = new Uint8Array(n * 4), scan = split ? new Uint8Array(n * 4) : null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // barrel distortion: output (u,v) in -1..1 maps to a source point
      const u = x / (w - 1) * 2 - 1, v = y / (h - 1) * 2 - 1, r2 = u * u + v * v;
      const su = u * (1 + curv * r2), sv = v * (1 + curv * r2);
      if (Math.abs(su) > 1 || Math.abs(sv) > 1) { out[i * 4 + 3] = 255; if (scan) { scan[i * 4] = scan[i * 4 + 1] = scan[i * 4 + 2] = 255; scan[i * 4 + 3] = 255; } continue; }
      const px = (su + 1) / 2 * (w - 1), py = (sv + 1) / 2 * (h - 1);
      let r = sample(VR, w, h, px + cx, py + cy), g = sample(VG, w, h, px, py), b = sample(VB, w, h, px - cx, py - cy);
      if (BR) { r += sample(BR, w, h, px, py) * bloom; g += sample(BG, w, h, px, py) * bloom; b += sample(BB, w, h, px, py) * bloom; }
      if (tint) { const L = 0.299 * r + 0.587 * g + 0.114 * b; r = L * tint[0]; g = L * tint[1]; b = L * tint[2]; }
      // phosphor mask
      if (maskType !== "none" && mStr > 0) {
        const col = Math.floor(px / ms), row = Math.floor(py / ms);
        let ph;
        if (maskType === "grille") ph = col % 3;
        else if (maskType === "shadow") ph = (col + (row % 2) * 1.5 | 0) % 3;
        else { ph = col % 3; if (((row + (Math.floor(col / 3) % 2) * 2) % 4) === 3) { r *= 1 - mStr * 0.6; g *= 1 - mStr * 0.6; b *= 1 - mStr * 0.6; } }
        const lo = 1 - mStr * 0.7, hi = 1 + mStr * 0.35, mean = (hi + 2 * lo) / 3;
        // small previews can't show the real mask pitch: fade it to its average
        const q = (v) => mean + (v - mean) * maskVis;
        r *= q(ph === 0 ? hi : lo); g *= q(ph === 1 ? hi : lo); b *= q(ph === 2 ? hi : lo);
      }
      // scanline: bright beam centre, dark gap; brighter pixels make wider beams
      const f = (py % lineH) / lineH - 0.5, lum = (r + g + b) / 765;
      const bw = beam * (0.6 + 0.4 * clamp(lum, 0, 1));
      const prof = (ff) => 1 - sStr * (1 - Math.exp(-(ff * ff) / (2 * bw * bw * 0.09)));
      let sl = prof(f);
      if (scanVis < 1) {                       // lines thinner than ~2 px alias: blend to the beam's average
        let m = 0; for (let s = 0; s < 8; s++) m += prof((s + 0.5) / 8 - 0.5);
        sl = m / 8 + (sl - m / 8) * scanVis;
      }
      // vignette, rounded corners, noise, rolling band
      const vg = 1 - vig * Math.pow(r2 / 2, 1.5) * 1.6;
      let corner = 1;
      if (rad > 0) {
        const qx = Math.min(x, w - 1 - x), qy = Math.min(y, h - 1 - y);
        if (qx < rad && qy < rad) { const d = Math.hypot(rad - qx, rad - qy); corner = clamp(rad - d + 1, 0, 1); }
      }
      const nz = noise ? M.hashNoise(Math.round(x / sc), Math.round(y / sc), 3) * noise : 0;
      const band = rollA ? rollA * 0.35 * Math.exp(-Math.pow((y / h - rollY) * 12, 2)) : 0;
      const k = vg * corner * (1 + band), applyScan = split ? 1 : sl;
      const fin = (c) => clamp(((c * applyScan * k + nz) - 128) * con + 128 + (bri - 1) * 128, 0, 255);
      out[i * 4] = fin(r); out[i * 4 + 1] = fin(g); out[i * 4 + 2] = fin(b); out[i * 4 + 3] = Math.max(A[i], corner < 1 ? 255 : A[i]);
      if (scan) { const s = clamp(Math.round(sl * 255), 0, 255); scan[i * 4] = s; scan[i * 4 + 1] = s; scan[i * 4 + 2] = s; scan[i * 4 + 3] = 255; }
    }
    if ((y & 63) === 0) await yieldFn();
  }
  const layers = [{ name: "Screen", rgba: out, blend: "NORMAL" }];
  if (scan) layers.push({ name: "Scanlines", rgba: scan, blend: "MULTIPLY" });
  return { w, h, layers, notes: [] };
}

module.exports = { render, composite: M.composite, demoImage: M.demoImage };
