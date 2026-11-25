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
//   Flux Dots: the Flux field, drawn as round phosphor dots on a staggered grid
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
  // Background calm (3.0): local texture (brick, foliage) thins the lines there; 0 = off
  let CALM = null;
  if ((Q.calm || 0) > 0) {
    const lo = M.boxBlur(L.slice(), w, h, Math.max(2, sp * 1.5), 2);
    const det = new Float32Array(n); for (let i = 0; i < n; i++) det[i] = Math.abs(L[i] - lo[i]);
    const dm = M.boxBlur(det, w, h, Math.max(2, sp * 2.5), 2), srt = Float32Array.from(dm).sort(), ref = Math.max(1e-3, srt[(n * 0.95) | 0]);
    const c = Q.calm / 100; CALM = new Float32Array(n);
    for (let i = 0; i < n; i++) CALM[i] = 1 - c * clamp((dm[i] / ref - 0.35) / 0.65, 0, 1) * 0.85;
  }
  await yieldFn();

  // 2. the field
  // Lidar depth: 0 near .. 1 far. Prototype takes P.depthMap (Smart depth / Depth layer in the plugin); falls back to inverted smooth brightness
  let DEP = null;
  if (mode === "lidar") {
    DEP = P.depthMap ? Float32Array.from(P.depthMap) : Float32Array.from(Ls, (v) => 1 - v);
    const srt = Float32Array.from(DEP).sort(), lo = srt[(n * 0.02) | 0], hi = srt[(n * 0.98) | 0];
    for (let i = 0; i < n; i++) DEP[i] = clamp((DEP[i] - lo) / Math.max(1e-3, hi - lo), 0, 1);   // stretch to the full near..far range
  }
  const F = new Float32Array(n), bend = Q.amp / 100 * 10;
  // Angle turns the line direction in every mode (0 = horizontal lines, 90 = vertical); brightness bends lines across it
  const ang = (Q.angle || 0) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  let flow = null;
  if (mode === "flux" || mode === "fluxdots" || Q.warp > 0) flow = flowNoise(w, h, sp * 6, Q.seed | 0);
  const warp = Q.warp / 100 * 1.5, levels = 2 + Q.amp / 100 * 10;
  // Instability (3.0 proto): wander = slow line drift, jitter = fast per-line wobble, tear = sideways sync slips
  const U = Q.unstable || 0, un = U / 100;
  let wander = null, jit = null, tearX = null;
  if (un > 0) {
    wander = flowNoise(w, h, sp * (10 - 6 * (Q.chaos || 50) / 100), (Q.seed | 0) + 101);
    jit = flowNoise(w, h, Math.max(2, sp * 1.2), (Q.seed | 0) + 202);
    tearX = new Float32Array(h); const rt = M.rng((Q.seed | 0) + 303); let off = 0;
    for (let y = 0; y < h; y++) { if (rt() < 0.04 * un) off = (rt() * 2 - 1) * sp * 14 * un; else off *= 0.97; tearX[y] = off; }
  }
  for (let y = 0, i = 0; y < h; y++) for (let x0 = 0; x0 < w; x0++, i++) {
    const x = tearX ? x0 + tearX[y] : x0;
    const t = ang ? -x * sa + y * ca : y;          // distance across the line direction
    if (mode === "waveform") F[i] = t / sp - bend * (0.7 * Ls[i] + 0.3 * Ld[i]) + (flow ? warp * 0.4 * flow[i] : 0);
    else if (mode === "linear") F[i] = t / sp + (flow ? warp * 0.25 * flow[i] : 0);
    else if (mode === "lidar") F[i] = t / sp + bend * 0.6 * (1 - DEP[i]);
    else F[i] = (t / sp) * 0.35 + levels * (0.55 * Ld[i] + 0.45 * Ls[i]) + warp * flow[i];
    if (un > 0) { const xi = y * w + Math.min(w - 1, Math.max(0, x | 0)); F[i] += un * (3.2 * wander[i] + 0.6 * jit[i]) * (0.6 + 0.8 * Ls[xi]); }
  }
  await yieldFn();

  // 3. beam lines: intensity I (0..1) and a hot core
  const I = new Float32Array(n), core = new Float32Array(n);
  const wBase = clamp(Q.width / 100, 0.05, 1) * sp * 0.32, dots = Q.dots / 100;
  const pitch = Math.max(2, sp * 0.55);
  const dp3 = Math.max(2.5, sp * (0.45 + 0.5 * Q.dots / 100));      // Flux Dots grid pitch (Dot size dial)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const gx = (F[y * w + Math.min(x + 1, w - 1)] - F[y * w + Math.max(x - 1, 0)]) / ((x > 0 && x < w - 1) ? 2 : 1);
      const gy = (F[Math.min(y + 1, h - 1) * w + x] - F[Math.max(y - 1, 0) * w + x]) / ((y > 0 && y < h - 1) ? 2 : 1);
      const gm = Math.max(Math.hypot(gx, gy), 0.15 / sp);
      const fr = F[i] - Math.round(F[i]), d = Math.abs(fr) / gm;          // pixels to the nearest line
      if (mode === "lidar") {
        // scan ring = nearest whole F; dots along the ring, sparser and smaller with distance, random dropouts
        const ring = Math.round(F[i]); const dRing = Math.abs(F[i] - ring) / gm;
        const D = DEP[i], pitchL = Math.max(2, sp * (0.4 + 1.2 * D) * (0.6 + Q.dots / 100));
        const along = ang ? x * ca + y * sa : x;
        const k0 = Math.round((along + (ring & 1) * pitchL * 0.5) / pitchL);
        const da = along + (ring & 1) * pitchL * 0.5 - k0 * pitchL;
        const hsh = (M.hashNoise(k0, ring, (Q.seed | 0) + 41) + 1) / 2;
        if (hsh < 0.05 + 0.35 * D * ((Q.drop == null ? 30 : Q.drop) / 100)) continue;            // dropouts, more far away
        const rad = Math.max(0.7, wBase * (2.4 - 1.5 * D) * (0.8 + 0.4 * hsh));
        const dd = Math.hypot(da, dRing), disc = clamp(rad - dd + 0.5, 0, 1);
        if (disc <= 0) continue;
        const v = 0.35 + 0.65 * Math.pow(clamp((Ld[i] - th) / (1 - th) + 0.25, 0, 1), 0.8);   // return intensity
        I[i] = disc * (Q.color === "depth" ? 1 : v); core[i] = disc * (1 - D) * 0.6;
        if (Q.color === "depth") I[i] = disc * (0.4 + 0.6 * (1 - D));          // ramp by distance: near = hot end
        continue;
      }
      if (mode === "fluxdots") {
        // light the grid dot whose centre sits on a contour; dot size follows line strength there
        const row = Math.floor(y / dp3), ox = (row & 1) ? dp3 / 2 : 0;
        const cxp = Math.floor((x + ox) / dp3) * dp3 + dp3 / 2 - ox, cyp = row * dp3 + dp3 / 2;
        const ci = Math.min(h - 1, Math.max(0, cyp | 0)) * w + Math.min(w - 1, Math.max(0, cxp | 0));
        const vc = Math.pow(clamp((Ld[ci] - th) / (1 - th), 0, 1), 1.25);
        if (vc <= 0) continue;
        const fc = F[ci] - Math.round(F[ci]), dc = Math.abs(fc) / gm;
        const sg = Math.max(1.1, wBase * (1.3 + 1.1 * vc));
        const pc = Math.exp(-(dc * dc) / (2 * sg * sg)), amt = Math.min(1, Math.pow(vc, 0.7) * (0.82 * pc + 0.18));   // faint dots fill the subject between contours
        if (amt < 0.04) continue;
        const rad = dp3 * 0.55 * Math.sqrt(amt), disc = clamp(rad - Math.hypot(x - cxp, y - cyp) + 0.5, 0, 1);
        if (disc <= 0) continue;
        I[i] = Math.min(1, amt * 1.6) * disc; core[i] = disc * Math.pow(pc, 3) * vc * vc;
        continue;
      }
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
      if (CALM) { k *= CALM[i]; }
      I[i] = k; core[i] = Math.pow(prof, 5) * v * v * (CALM ? CALM[i] : 1);
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
    // Flare at (3.0): "random" spots (1.x) or "bright" = the brightest highlights, kept apart from each other
    let spots = null;
    if (Q.flareAt === "bright") {
      spots = []; const cand = [], st = Math.max(2, Math.round(mn / 40));
      for (let y = st; y < h - st; y += st) for (let x = st; x < w - st; x += st) cand.push([Ls[y * w + x] * 0.6 + L[y * w + x] * 0.4, x, y]);
      cand.sort((a, b) => b[0] - a[0]);
      for (const c of cand) { if (spots.length >= count) break; if (spots.every((q) => Math.hypot(q[0] - c[1], q[1] - c[2]) > mn * 0.22)) spots.push([c[1], c[2]]); }
    }
    for (let s = 0; s < count; s++) {
      let cx = (0.1 + 0.8 * rnd()) * w, cy = (0.1 + 0.8 * rnd()) * h; const a = (-35 - 40 * rnd()) * Math.PI / 180;
      if (spots) { if (!spots[s]) break; cx = spots[s][0]; cy = spots[s][1]; }
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
  // Photo mix (3.0): the (toned) photo screened under the lines so the subject stays readable; 0 = off
  const pm = clamp((Q.photo || 0) / 100, 0, 1);
  const ph3 = (px, py, ch) => (ch === 0 ? sample(R, w, h, px, py) : ch === 1 ? sample(G, w, h, px, py) : sample(B, w, h, px, py)) * pm;
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
        let br = Math.max(0, base[0] + gn * 0.6 + 6) * k, bg = Math.max(0, base[1] + gn * 0.6 + 4) * k, bb = Math.max(0, base[2] + gn * 0.6 + 3) * k;
        if (pm > 0) { const sc3 = (b0, c) => 255 - (255 - clamp(b0, 0, 255)) * (255 - c * k) / 255; br = sc3(br, ph3(px, py, 0)); bg = sc3(bg, ph3(px, py, 1)); bb = sc3(bb, ph3(px, py, 2)); }
        oBase[i * 4] = clamp(br, 0, 255); oBase[i * 4 + 1] = clamp(bg, 0, 255); oBase[i * 4 + 2] = clamp(bb, 0, 255); oBase[i * 4 + 3] = 255;
        putAdd(oLines, i, fin(lr * k), fin(lg * k), fin(lb * k));
        if (oGlow) putAdd(oGlow, i, gr * k, gg * k, gb * k);
        oGrid[i * 4] = clamp(mr * 255 / 1.35, 0, 255); oGrid[i * 4 + 1] = clamp(mg * 255 / 1.35, 0, 255); oGrid[i * 4 + 2] = clamp(mb * 255 / 1.35, 0, 255); oGrid[i * 4 + 3] = 255;
        if (oFlare) putAdd(oFlare, i, fl[0] * k, fl[1] * k, fl[2] * k);
      } else {
        // merged: base + lines + glow, through the mask, flare screened on top
        let r = base[0] + gn * 0.6 + 6 + lr + gr, g = base[1] + gn * 0.6 + 4 + lg + gg, b = base[2] + gn * 0.6 + 3 + lb + gb;
        if (pm > 0) { const p0 = ph3(px, py, 0), p1 = ph3(px, py, 1), p2 = ph3(px, py, 2); r += p0 * (1 - clamp(r, 0, 255) / 255); g += p1 * (1 - clamp(g, 0, 255) / 255); b += p2 * (1 - clamp(b, 0, 255) / 255); }
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
