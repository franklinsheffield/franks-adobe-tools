"use strict";
// CRT Phaser 1.1 - Phase FX. Turns the image into glowing beam lines whose
// shape follows brightness, then dresses them as a CRT: glow, colour fringe,
// phosphor dot grid, signal debris, prism flare, grain.
//
// Every mode draws the iso-lines of one scalar field F (a line wherever F is
// a whole number). Distance to the line in pixels = |F - round(F)| / |grad F|,
// so lines keep an even width however hard they bend.
//   Waveform: F = y/sp - bend * Ls          beam lines pushed up by brightness
//   Linear:   F = t/sp  (t across the angle) straight raster, width swells with brightness
//   Flux:     F = y/sp * (1-k) + levels * Ld + warp * flow   contour swirls around shapes
const M = require("../core/imgmath.js");
const { clamp } = M;

function sample(C, w, h, x, y) {              // bilinear, clamped
  x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1);
  const x0 = x | 0, y0 = y | 0, x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1), fx = x - x0, fy = y - y0;
  const a = C[y0 * w + x0] + (C[y0 * w + x1] - C[y0 * w + x0]) * fx, b = C[y1 * w + x0] + (C[y1 * w + x1] - C[y1 * w + x0]) * fx;
  return a + (b - a) * fy;
}

// smooth seeded value noise in -1..1, `cell` pixels per lattice step, 3 octaves
function flowNoise(w, h, cell, seed) {
  const out = new Float32Array(w * h);
  let amp = 1, norm = 0;
  for (let o = 0; o < 3; o++) {
    const c = Math.max(2, cell / Math.pow(2, o)), gw = Math.ceil(w / c) + 2, gh = Math.ceil(h / c) + 2;
    const rnd = M.rng(seed * 31 + o * 7 + 1), g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = rnd() * 2 - 1;
    for (let y = 0; y < h; y++) {
      const gy = y / c, y0 = gy | 0, fy = gy - y0, sy = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < w; x++) {
        const gx = x / c, x0 = gx | 0, fx = gx - x0, sx = fx * fx * (3 - 2 * fx);
        const a = g[y0 * gw + x0], b = g[y0 * gw + x0 + 1], cc = g[(y0 + 1) * gw + x0], d = g[(y0 + 1) * gw + x0 + 1];
        out[y * w + x] += amp * ((a + (b - a) * sx) + ((cc + (d - cc) * sx) - (a + (b - a) * sx)) * sy);
      }
    }
    norm += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

function hsvRainbow(t) {                       // t 0..1 -> red..violet
  const hh = clamp(t, 0, 1) * 0.8 * 6, i = hh | 0, f = hh - i, q = 1 - f;
  return [[1, f, 0], [q, 1, 0], [0, 1, f], [0, q, 1], [f, 0, 1], [1, 0, q]][i % 6];
}

async function renderPhase(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const fullH = P.fullH || h, Q = P.phase, mode = Q.mode;
  const { R, G, B, A } = M.planes(src);
  const sp = Math.max(1.5, fullH / clamp(Q.lines, 20, 1200) * sc);   // line spacing in this image's pixels
  const th = clamp(Q.threshold / 100, 0, 0.95);

  // 1. brightness: Ld = lightly smoothed (detail), Ls = smoothed for the bend
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) L[i] = (0.2126 * R[i] + 0.7152 * G[i] + 0.0722 * B[i]) / 255 * (A[i] / 255);
  const Ld = M.boxBlur(L.slice(), w, h, Math.max(1, sp * 0.5 * (1.2 - Q.detail / 100)), 2);
  const Ls = M.boxBlur(L.slice(), w, h, Math.max(1, sp * (0.6 + 3 * Q.smooth / 100)), 3);
  await yieldFn();

  // 2. the field
  const F = new Float32Array(n), bend = Q.amp / 100 * 10;
  const ang = (mode === "linear" ? Q.angle : 0) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  let flow = null;
  if (mode === "flux" || Q.warp > 0) flow = flowNoise(w, h, sp * 6, Q.seed | 0);
  const warp = Q.warp / 100 * 1.5, levels = 2 + Q.amp / 100 * 10;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
    if (mode === "waveform") F[i] = y / sp - bend * (0.7 * Ls[i] + 0.3 * Ld[i]) + (flow ? warp * 0.4 * flow[i] : 0);
    else if (mode === "linear") F[i] = (-x * sa + y * ca) / sp + (flow ? warp * 0.25 * flow[i] : 0);
    else F[i] = (y / sp) * 0.35 + levels * (0.55 * Ld[i] + 0.45 * Ls[i]) + warp * flow[i];
  }
  await yieldFn();

  // 3. beam lines: intensity I (0..1) and a hot core
  const I = new Float32Array(n), core = new Float32Array(n);
  const wBase = clamp(Q.width / 100, 0.05, 1) * sp * 0.32, dots = Q.dots / 100;
  const pitch = Math.max(2, sp * 0.55);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const gx = (F[y * w + Math.min(x + 1, w - 1)] - F[y * w + Math.max(x - 1, 0)]) / ((x > 0 && x < w - 1) ? 2 : 1);
      const gy = (F[Math.min(y + 1, h - 1) * w + x] - F[Math.max(y - 1, 0) * w + x]) / ((y > 0 && y < h - 1) ? 2 : 1);
      const gm = Math.max(Math.hypot(gx, gy), 0.15 / sp);
      const fr = F[i] - Math.round(F[i]), d = Math.abs(fr) / gm;          // pixels to the nearest line
      const v = Math.pow(clamp((Ld[i] - th) / (1 - th), 0, 1), 1.25);
      if (v <= 0) continue;
      const sig = Math.max(0.55, wBase * (mode === "linear" ? (0.25 + 1.1 * v) : (0.45 + 0.55 * v)));
      const prof = Math.exp(-(d * d) / (2 * sig * sig));
      let k = Math.min(1, Math.pow(v, 0.8) * prof * 1.2);
      if (dots > 0) {                            // dim parts of a line break up into phosphor dots
        const along = (mode === "linear" ? (x * ca + y * sa) : x) / pitch;
        const dp = 0.5 + 0.5 * Math.cos(2 * Math.PI * along);
        k *= 1 - dots * Math.pow(1 - v, 0.6) * (1 - dp * dp);
      }
      I[i] = k; core[i] = Math.pow(prof, 5) * v * v;
    }
    if ((y & 63) === 0) await yieldFn();
  }

  // 4. colour: phosphor ramp or the photo's own colours
  const LR = new Float32Array(n), LG = new Float32Array(n), LB = new Float32Array(n);
  const lut = Q.color === "full" ? null : M.gradientLUT(Q.ramp);
  for (let i = 0; i < n; i++) {
    const k = I[i]; if (k <= 0) continue;
    if (lut) { const j = clamp(Math.round(k * 255), 0, 255) * 3; LR[i] = lut[j]; LG[i] = lut[j + 1]; LB[i] = lut[j + 2]; }
    else { const s = 1.7 * k; LR[i] = R[i] * s; LG[i] = G[i] * s; LB[i] = B[i] * s; }
    const c = core[i] * 120; LR[i] += c; LG[i] += c; LB[i] += c;
  }
  // signal debris: dim blocky dot-matrix ghosts where the image is dark
  if (Q.debris > 0) {
    const bs = Math.max(4, Math.round(sp * 3)), bx = Math.ceil(w / bs), by = Math.ceil(h / bs), amt = Q.debris / 100;
    const dc = lut ? [lut[100 * 3], lut[100 * 3 + 1], lut[100 * 3 + 2]] : [140, 160, 170];
    for (let j = 0; j < by; j++) for (let q = 0; q < bx; q++) {
      const hsh = (M.hashNoise(q, j, (Q.seed | 0) + 11) + 1) / 2;
      const run = 1 + Math.floor(((M.hashNoise(q, j, (Q.seed | 0) + 12) + 1) / 2) * 5);   // blocks run sideways
      if (hsh > amt * 0.45) continue;
      const cx = Math.min(w - 1, (q * bs + bs / 2) | 0), cy = Math.min(h - 1, (j * bs + bs / 2) | 0);
      const lv = Ls[cy * w + cx]; if (lv > th + 0.25) continue;
      const strength = 0.22 + 0.3 * ((M.hashNoise(q, j, (Q.seed | 0) + 13) + 1) / 2);
      for (let yy = j * bs; yy < Math.min(h, (j + 1) * bs); yy++) {
        const ry = (yy % Math.max(2, sp)) / Math.max(2, sp); if (ry > 0.45) continue;
        for (let xx = q * bs; xx < Math.min(w, (q + run) * bs); xx++) {
          const rx = (xx % Math.max(2, pitch)) / Math.max(2, pitch); if (rx > 0.5) continue;
          const i = yy * w + xx;
          LR[i] += dc[0] * strength; LG[i] += dc[1] * strength; LB[i] += dc[2] * strength;
        }
      }
    }
  }
  await yieldFn();

  // 5. glow: tight + wide bloom of the lines
  const glow = Q.glow / 100;
  let GR = null, GG = null, GB = null;
  if (glow > 0) {
    const r1 = Math.max(1, sp * 0.9), r2 = Math.max(2, sp * 4.5);
    const mk = (C) => { const a = M.boxBlur(C.slice(), w, h, r1, 2), b = M.boxBlur(C.slice(), w, h, r2, 3); for (let i = 0; i < n; i++) a[i] = (a[i] * 0.9 + b[i] * 1.1) * glow; return a; };
    GR = mk(LR); GG = mk(LG); GB = mk(LB);
  }
  await yieldFn();

  // 6. prism flare streaks
  let FL = null;
  if (Q.flare > 0) {
    FL = new Float32Array(n * 3);
    const rnd = M.rng((Q.seed | 0) * 97 + 5), count = 1 + Math.round(Q.flare / 100 * 2), mn = Math.min(w, h);
    for (let s = 0; s < count; s++) {
      const cx = (0.1 + 0.8 * rnd()) * w, cy = (0.1 + 0.8 * rnd()) * h, a = (-35 - 40 * rnd()) * Math.PI / 180;
      const len = mn * (0.07 + 0.08 * rnd()), wid = len * 0.16, ux = Math.cos(a), uy = Math.sin(a), str = Q.flare / 100 * 255;
      const x0 = Math.max(0, (cx - len) | 0), x1 = Math.min(w - 1, (cx + len) | 0), y0 = Math.max(0, (cy - len) | 0), y1 = Math.min(h - 1, (cy + len) | 0);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy, t = (dx * ux + dy * uy) / len, c = (-dx * uy + dy * ux) / (wid * (1 - 0.6 * Math.abs(t)) + 0.5);
        if (Math.abs(t) >= 1) continue;
        const k = Math.exp(-c * c * 1.5) * Math.sin((t + 1) / 2 * Math.PI) * str, col = hsvRainbow(1 - (c * 0.5 + 0.5));
        const i = (y * w + x) * 3; FL[i] += col[0] * k; FL[i + 1] += col[1] * k; FL[i + 2] += col[2] * k;
      }
    }
  }

  // 7. screen pass: curvature, convergence + radial fringe, dot grid, scanlines, vignette, corners, grain
  const curv = P.tube.curve / 100 * 0.25, fr = Q.fringe / 100 * sp * 0.9;
  const ccx = P.conv.x * sc, ccy = P.conv.y * sc;
  const maskType = P.mask.type, ms = Math.max(1, P.mask.scale * sc), mStr = P.mask.strength / 100;
  const sStr = P.scan.strength / 100, beam = clamp(P.scan.width / 100, 0.1, 1);
  const vig = P.tube.vignette / 100, rad = P.tube.corner / 100 * 0.12 * Math.min(w, h);
  const grain = Q.grain / 100 * 34, bri = P.finish.brightness / 100, con = P.finish.contrast / 100;
  const lineH = Math.max(1, fullH / Math.max(60, Math.min(2000, P.screen.lines))) * sc;
  const scanVis = clamp((lineH - 1.2) / 1.6, 0, 1), maskVis = clamp(P.mask.scale * sc, 0, 1) ** 2;
  const base = M.hexToRgb(M.isHex(Q.base) ? Q.base : "#000000");
  const split = P.out.layers === "split";
  const oBase = split ? new Uint8Array(n * 4) : null, oLines = split ? new Uint8Array(n * 4) : null, oGlow = split && GR ? new Uint8Array(n * 4) : null;
  const oGrid = split ? new Uint8Array(n * 4) : null, oFlare = split && FL ? new Uint8Array(n * 4) : null, out = split ? null : new Uint8Array(n * 4);
  const fin = (c) => clamp((c - 128) * con + 128 + (bri - 1) * 128, 0, 255);
  // straight (un-premultiplied) colour from an additive value on black, for transparent layers
  const putAdd = (buf, i, r, g, b) => {
    r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
    const a = Math.max(r, g, b); if (a <= 0) return;
    buf[i * 4] = Math.round(r / a * 255); buf[i * 4 + 1] = Math.round(g / a * 255); buf[i * 4 + 2] = Math.round(b / a * 255); buf[i * 4 + 3] = Math.round(a);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const u = x / (w - 1) * 2 - 1, v = y / (h - 1) * 2 - 1, r2 = u * u + v * v;
      const su = u * (1 + curv * r2), sv = v * (1 + curv * r2);
      if (Math.abs(su) > 1 || Math.abs(sv) > 1) {
        if (split) { oBase[i * 4 + 3] = 255; oGrid[i * 4] = oGrid[i * 4 + 1] = oGrid[i * 4 + 2] = 255; oGrid[i * 4 + 3] = 255; }
        else out[i * 4 + 3] = 255;
        continue;
      }
      const px = (su + 1) / 2 * (w - 1), py = (sv + 1) / 2 * (h - 1);
      const rr = Math.sqrt(r2 / 2), fx = fr * (0.35 + rr) * (u >= 0 ? 1 : -1);
      let lr = sample(LR, w, h, px + ccx + fx, py + ccy), lg = sample(LG, w, h, px, py), lb = sample(LB, w, h, px - ccx - fx, py - ccy);
      let gr = 0, gg = 0, gb = 0;
      if (GR) { gr = sample(GR, w, h, px + fx * 2, py); gg = sample(GG, w, h, px, py); gb = sample(GB, w, h, px - fx * 2, py); }
      // dot grid / phosphor mask and scanlines as a multiplier per channel
      let mr = 1, mg = 1, mb = 1;
      if (maskType !== "none" && mStr > 0) {
        if (maskType === "dots") {
          const p3 = ms * 3, row = Math.floor(py / p3), ox = (row % 2) * p3 / 2;
          const qx = ((px + ox) % p3) / p3 - 0.5, qy = (py % p3) / p3 - 0.5, dd = Math.sqrt(qx * qx + qy * qy);
          const dot = clamp(1 - (dd - 0.28) * 6, 0, 1);
          const m = 1 - mStr * (1 - dot) * 0.85, mean = 1 - mStr * 0.85 * 0.6;
          mr = mg = mb = mean + (m - mean) * maskVis;
        } else {
          const col = Math.floor(px / ms), row = Math.floor(py / ms);
          let ph, slot = 1;
          if (maskType === "grille") ph = col % 3;
          else if (maskType === "shadow") ph = (col + (row % 2) * 1.5 | 0) % 3;
          else { ph = col % 3; if (((row + (Math.floor(col / 3) % 2) * 2) % 4) === 3) slot = 1 - mStr * 0.6; }
          const lo = 1 - mStr * 0.7, hi = 1 + mStr * 0.35, mean = (hi + 2 * lo) / 3;
          const q = (t) => (mean + (t - mean) * maskVis) * slot;
          mr = q(ph === 0 ? hi : lo); mg = q(ph === 1 ? hi : lo); mb = q(ph === 2 ? hi : lo);
        }
      }
      if (sStr > 0) {
        const f = (py % lineH) / lineH - 0.5, prof = (ff) => 1 - sStr * (1 - Math.exp(-(ff * ff) / (2 * beam * beam * 0.09)));
        let sl = prof(f);
        if (scanVis < 1) { let mm = 0; for (let s = 0; s < 8; s++) mm += prof((s + 0.5) / 8 - 0.5); sl = mm / 8 + (sl - mm / 8) * scanVis; }
        mr *= sl; mg *= sl; mb *= sl;
      }
      const vg = 1 - vig * Math.pow(r2 / 2, 1.5) * 1.6;
      let corner = 1;
      if (rad > 0) {
        const qx = Math.min(x, w - 1 - x), qy = Math.min(y, h - 1 - y);
        if (qx < rad && qy < rad) { const d = Math.hypot(rad - qx, rad - qy); corner = clamp(rad - d + 1, 0, 1); }
      }
      const k = Math.max(0, vg) * corner;
      const gn = grain ? M.hashNoise(Math.round(x / Math.max(sc, 0.35)), Math.round(y / Math.max(sc, 0.35)), (Q.seed | 0) + 3) * grain : 0;
      const fl = FL ? [sample3(FL, w, h, px, py, 0), sample3(FL, w, h, px, py, 1), sample3(FL, w, h, px, py, 2)] : null;
      if (split) {
        const br = Math.max(0, base[0] + gn * 0.6 + 6) * k, bg = Math.max(0, base[1] + gn * 0.6 + 4) * k, bb = Math.max(0, base[2] + gn * 0.6 + 3) * k;
        oBase[i * 4] = clamp(br, 0, 255); oBase[i * 4 + 1] = clamp(bg, 0, 255); oBase[i * 4 + 2] = clamp(bb, 0, 255); oBase[i * 4 + 3] = 255;
        putAdd(oLines, i, fin(lr * k), fin(lg * k), fin(lb * k));
        if (oGlow) putAdd(oGlow, i, gr * k, gg * k, gb * k);
        oGrid[i * 4] = clamp(mr * 255 / 1.35, 0, 255); oGrid[i * 4 + 1] = clamp(mg * 255 / 1.35, 0, 255); oGrid[i * 4 + 2] = clamp(mb * 255 / 1.35, 0, 255); oGrid[i * 4 + 3] = 255;
        if (oFlare) putAdd(oFlare, i, fl[0] * k, fl[1] * k, fl[2] * k);
      } else {
        // merged: base + lines + glow, through the mask, flare screened on top
        let r = base[0] + gn * 0.6 + 6 + lr + gr, g = base[1] + gn * 0.6 + 4 + lg + gg, b = base[2] + gn * 0.6 + 3 + lb + gb;
        r = fin(r * mr * k); g = fin(g * mg * k); b = fin(b * mb * k);
        if (fl) { r = 255 - (255 - r) * (255 - clamp(fl[0] * k, 0, 255)) / 255; g = 255 - (255 - g) * (255 - clamp(fl[1] * k, 0, 255)) / 255; b = 255 - (255 - b) * (255 - clamp(fl[2] * k, 0, 255)) / 255; }
        out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = 255;
      }
    }
    if ((y & 63) === 0) await yieldFn();
  }
  if (!split) return { w, h, layers: [{ name: "Phase Screen", rgba: out, blend: "NORMAL" }], notes: [] };
  const layers = [{ name: "Base", rgba: oBase, blend: "NORMAL" }, { name: "Phase Lines", rgba: oLines, blend: "NORMAL" }];
  if (oGlow) layers.push({ name: "Glow", rgba: oGlow, blend: "SCREEN" });
  layers.push({ name: "Dot Grid", rgba: oGrid, blend: "MULTIPLY" });
  if (oFlare) layers.push({ name: "Prism Flare", rgba: oFlare, blend: "SCREEN" });
  return { w, h, layers, notes: [] };
}
function sample3(C, w, h, x, y, ch) {
  x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1);
  const x0 = x | 0, y0 = y | 0, x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1), fx = x - x0, fy = y - y0;
  const g = (xx, yy) => C[(yy * w + xx) * 3 + ch];
  const a = g(x0, y0) + (g(x1, y0) - g(x0, y0)) * fx, b = g(x0, y1) + (g(x1, y1) - g(x0, y1)) * fx;
  return a + (b - a) * fy;
}

module.exports = { renderPhase };
