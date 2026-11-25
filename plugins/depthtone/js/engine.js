"use strict";
// Depthtone 2.0 engine: build a depth field (smart / depth layer / brightness, see depth.js),
// then redraw it in one of 7 styles. The photo can show through every style (Photo mix).
//   contours  anti-aliased isolines (+ heavier index line every 5th), optional band fill
//   terraces  quantised bands with soft paper-cut shadows
//   relief    lit sculpture from smooth depth + photo micro-detail (diffuse, shine, occlusion)
//   ridges    horizontal lines lifted by depth, nearer rows hide farther ones
//   heat      false-colour depth through the gradient, modulated by photo detail
//   anaglyph  red / cyan 3D from depth parallax
//   haze      the photo with depth fog, far blur and near warmth
const M = require("../core/imgmath.js");
const Depth = require("./depth.js");
const { clamp, boxBlur, hexToRgb } = M;

function grad(F, w, h) {
  const gx = new Float32Array(w * h), gy = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    gx[i] = (F[y * w + Math.min(x + 1, w - 1)] - F[y * w + Math.max(x - 1, 0)]) / 2;
    gy[i] = (F[Math.min(y + 1, h - 1) * w + x] - F[Math.max(y - 1, 0) * w + x]) / 2;
  }
  return { gx, gy };
}

async function render(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const { D, L, A, used } = Depth.build(src, P);
  await yieldFn();
  const c = src.c || 4, S = src.data;
  const lut = M.gradientLUT(P.look.stops);
  const col = (t, k) => lut[Math.round(clamp(t, 0, 1) * 255) * 3 + k];
  const fog = hexToRgb(P.look.fogColor), fogAmt = (P.look.fog || 0) / 100;
  const photo = clamp((P.photo == null ? 0 : P.photo) / 100, 0, 1);
  const C = new Float32Array(n * 3);
  // far = more fog
  const tint = (i, t) => { const f = fogAmt * (1 - t) * (1 - t); for (let k = 0; k < 3; k++) C[i * 3 + k] += (fog[k] - C[i * 3 + k]) * f; };
  // photo tone: darkens / lightens the colour with the picture's own brightness
  const tone = (i) => (1 - photo) + photo * (0.3 + 1.4 * L[i]);
  const Ds = Float32Array.from(D); boxBlur(Ds, w, h, Math.max(1, sc), 2);
  const Lb = Float32Array.from(L); boxBlur(Lb, w, h, Math.max(2, 4 * sc), 3);
  const HP = new Float32Array(n); for (let i = 0; i < n; i++) HP[i] = L[i] - Lb[i];
  const az = P.light.angle * Math.PI / 180, ldx = Math.cos(az), ldy = -Math.sin(az);
  const layers = [];
  const st = P.style;

  if (st === "contours") {
    const lv = Math.max(2, Math.round(P.depth.levels)), every = Math.max(1, Math.round(P.lines.every));
    const lineCol = hexToRgb(P.lines.color), byDepth = P.lines.colorBy === "depth";
    const { gx, gy } = grad(Ds, w, h);
    const width = Math.max(0.6, P.lines.width * Math.max(0.5, sc));
    for (let i = 0; i < n; i++) {
      if (P.lines.fill) { const q = Math.min(lv - 1, Math.floor(Ds[i] * lv)) / (lv - 1); for (let k = 0; k < 3; k++) C[i * 3 + k] = col(q, k); tint(i, q); const m = tone(i); for (let k = 0; k < 3; k++) C[i * 3 + k] *= m; }
      else { const g = photo * L[i] * 255 * 0.6; C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = g; }
    }
    const LN = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = Ds[i] * lv, k = Math.round(v), gm = Math.hypot(gx[i], gy[i]) * lv;
      if (k % every !== 0 || gm < 0.012 || Ds[i] <= 0.002 || Ds[i] >= 0.998) continue;
      const index = P.lines.index && k % (5 * every) === 0, wd = index ? width * 2 : width;
      const a = clamp(wd / 2 + 0.5 - Math.abs(v - k) / gm, 0, 1);
      if (a <= 0) continue;
      const rgb = byDepth ? [col(D[i], 0), col(D[i], 1), col(D[i], 2)] : lineCol;
      LN[i * 4] = rgb[0]; LN[i * 4 + 1] = rgb[1]; LN[i * 4 + 2] = rgb[2]; LN[i * 4 + 3] = Math.round(a * (A[i] || 255));
    }
    const base = new Uint8Array(n * 4);
    const showBase = P.lines.fill || photo > 0;
    // no fill and no photo: lines sit on a dark version of the far colour, not on nothing
    const dark = [0, 1, 2].map((k) => col(0, k) * 0.14);
    for (let i = 0; i < n; i++) { for (let k = 0; k < 3; k++) base[i * 4 + k] = clamp(showBase ? C[i * 3 + k] : dark[k], 0, 255); base[i * 4 + 3] = A[i]; }
    layers.push({ name: P.lines.fill ? "Depth fill" : showBase ? "Photo" : "Background", rgba: base, blend: "NORMAL" });
    layers.push({ name: "Contours", rgba: LN, blend: "NORMAL" });
  } else if (st === "terraces") {
    const lv = Math.max(2, Math.round(P.depth.levels)), Q = new Float32Array(n);
    for (let i = 0; i < n; i++) Q[i] = Math.min(lv - 1, Math.floor(Ds[i] * lv));
    const off = Math.max(1, Math.round(P.light.shadow * sc)), amt = P.light.strength / 100;
    const Sh = new Float32Array(n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const sx = clamp(Math.round(x - ldx * off), 0, w - 1), sy = clamp(Math.round(y - ldy * off), 0, h - 1);
      Sh[y * w + x] = Q[sy * w + sx] > Q[y * w + x] ? 1 : 0;
    }
    boxBlur(Sh, w, h, Math.max(1, off * 0.5), 2);
    await yieldFn();
    for (let i = 0; i < n; i++) {
      const t = Q[i] / (lv - 1); for (let k = 0; k < 3; k++) C[i * 3 + k] = col(t, k); tint(i, t);
      const m = (1 - 0.6 * amt * Sh[i]) * tone(i); for (let k = 0; k < 3; k++) C[i * 3 + k] *= m;
    }
    layers.push({ name: "Terraces", rgba: null, blend: "NORMAL" });
  } else if (st === "relief") {
    const H = new Float32Array(n), dk = 60 * Math.max(0.25, sc) / Math.max(0.25, sc);
    const detail = 6 * (P.light.detail == null ? 1 : P.light.detail / 100);
    for (let i = 0; i < n; i++) H[i] = Ds[i] * dk * (w / 480) + (HP[i] + 0.3 * L[i]) * detail;
    const { gx, gy } = grad(H, w, h), AO = Float32Array.from(H); boxBlur(AO, w, h, Math.max(2, w / 48), 2);
    const el = 40 * Math.PI / 180, lx = ldx * Math.cos(el), ly = ldy * Math.cos(el), lz = Math.sin(el);
    const hx = lx, hy = ly, hz = lz + 1, hn = Math.hypot(hx, hy, hz);
    const k = P.light.strength / 100, spec = (P.light.shine == null ? 30 : P.light.shine) / 100, shin = 8 + 40 * spec;
    for (let i = 0; i < n; i++) {
      const nx = -gx[i] * k, ny = -gy[i] * k, nl = Math.hypot(nx, ny, 1);
      const dif = Math.max(0, (nx * lx + ny * ly + lz) / nl);
      const sp = Math.pow(Math.max(0, (nx * hx + ny * hy + hz) / (nl * hn)), shin) * spec * 255;
      const ao = clamp(1 - (AO[i] - H[i]) * 0.04, 0.45, 1), m = (0.25 + 0.95 * dif) * ao;
      for (let q = 0; q < 3; q++) C[i * 3 + q] = col(Ds[i], q); tint(i, Ds[i]);
      const t = tone(i); for (let q = 0; q < 3; q++) C[i * 3 + q] = C[i * 3 + q] * m * t + sp;
    }
    layers.push({ name: "Relief", rgba: null, blend: "NORMAL" });
  } else if (st === "ridges") {
    // Depth waves (3.0, Texturelabs reference 2026-11-25): rows of lines lifted by depth, each column moved
    // up as a whole (no Displace copies), nearer rows hide the rows behind. Columns, tilt, depth contrast, glow.
    const RG = P.ridges, cols = RG.dir === "cols";
    const W = cols ? h : w, Hh0 = cols ? w : h;
    const T = (a, k) => { if (!cols) return a; const o = new Float32Array(a.length); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let q = 0; q < k; q++) o[(x * h + y) * k + q] = a[(y * w + x) * k + q]; return o; };
    const step = Math.max(2, Math.round(RG.spacing * Math.max(0.5, sc))), amp = RG.lift / 100 * Hh0 * 0.2;
    const bg = hexToRgb(RG.bg || "#000000"), byPhoto = RG.colorBy === "photo";
    let Hh = Float32Array.from(D); boxBlur(Hh, w, h, Math.max(1, 2 * sc), 2);
    const ct = (RG.contrast || 0) / 100;
    if (ct > 0) for (let i = 0; i < n; i++) { const v = Hh[i], s2 = v * v * (3 - 2 * v); Hh[i] = clamp(0.5 + (v + (s2 - v) * ct - 0.5) * (1 + ct), 0, 1); }
    Hh = T(Hh, 1);
    const Lt = T(L, 1), Sc = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) for (let q = 0; q < 3; q++) Sc[i * 3 + q] = S[i * c + (c >= 3 ? q : 0)];
    const St = T(Sc, 3), O = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { O[i * 3] = bg[0]; O[i * 3 + 1] = bg[1]; O[i * 3 + 2] = bg[2]; }
    const lw = Math.max(0.8, P.lines.width * 0.6 * Math.max(0.5, sc));
    // baselines: even, or with Tilt spaced closer at the top (far) and wider at the bottom (near)
    const tilt = (RG.tilt || 0) / 100, base = [];
    const rowsN = Math.ceil((Hh0 + amp) / step);
    for (let k = 0; k <= rowsN; k++) { const t = k / rowsN; base.push(tilt > 0 ? (Hh0 + amp) * Math.pow(t, 1 + tilt * 1.2) : k * step); }
    for (let r = 0; r < base.length; r++) {
      const y0 = base[r], next = r + 1 < base.length ? base[r + 1] : y0 + step, gap = Math.max(1, next - y0);
      const ampR = tilt > 0 ? amp * Math.min(1.6, (gap / step) * 0.7 + 0.3) : amp;
      let prev = null;
      const row = Math.min(Hh0 - 1, Math.round(y0));
      for (let x = 0; x < W; x++) {
        const i = row * W + x, d = Hh[i], yl = y0 - ampR * d;
        for (let y = Math.max(0, Math.ceil(yl)); y < Math.min(Hh0, y0 + gap); y++) { const j = y * W + x; O[j * 3] = bg[0]; O[j * 3 + 1] = bg[1]; O[j * 3 + 2] = bg[2]; }
        const lum = 0.45 + 1.1 * Math.pow(Lt[i], 0.8) * (photo > 0 ? 1 : 0.6) + (photo > 0 ? 0 : 0.25);
        const cr = (byPhoto ? St[i * 3] : col(d, 0)) * lum, cg = (byPhoto ? St[i * 3 + 1] : col(d, 1)) * lum, cb = (byPhoto ? St[i * 3 + 2] : col(d, 2)) * lum;
        const y1 = prev == null ? yl : Math.min(prev, yl), y2 = prev == null ? yl : Math.max(prev, yl);
        for (let y = Math.floor(y1 - lw); y <= Math.ceil(y2 + lw); y++) {
          if (y < 0 || y >= Hh0) continue;
          const dist = y < y1 ? y1 - y : y > y2 ? y - y2 : 0, a = clamp(lw / 2 + 0.5 - dist, 0, 1);
          if (a <= 0) continue;
          const j = y * W + x; O[j * 3] += (cr - O[j * 3]) * a; O[j * 3 + 1] += (cg - O[j * 3 + 1]) * a; O[j * 3 + 2] += (cb - O[j * 3 + 2]) * a;
        }
        prev = yl;
      }
      if ((r & 15) === 0) await yieldFn();
    }
    if (cols) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let q = 0; q < 3; q++) C[(y * w + x) * 3 + q] = O[(x * h + y) * 3 + q]; }
    else C.set(O);
    const gl = (RG.glow || 0) / 100;
    if (gl > 0) {   // line glow: blurred lines added as light
      for (let q = 0; q < 3; q++) {
        const pl = new Float32Array(n); for (let i = 0; i < n; i++) pl[i] = Math.max(0, C[i * 3 + q] - bg[q]);
        boxBlur(pl, w, h, Math.max(2, 6 * sc), 3);
        for (let i = 0; i < n; i++) C[i * 3 + q] = Math.min(255, C[i * 3 + q] + pl[i] * gl * 2.2);
      }
    }
    layers.push({ name: "Ridges", rgba: null, blend: "NORMAL" });
  } else if (st === "heat") {
    for (let i = 0; i < n; i++) { const m = 0.55 + 0.9 * L[i] * (0.4 + photo) + HP[i] * 1.5 * (0.3 + photo); for (let k = 0; k < 3; k++) C[i * 3 + k] = col(Ds[i], k) * m; }
    layers.push({ name: "Heat", rgba: null, blend: "NORMAL" });
  } else if (st === "anaglyph") {
    const k = P.anaglyph.strength / 100 * 0.025 * w, grey = P.anaglyph.grey;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, dsp = (Ds[i] - 0.5) * k;
      const a = (y * w + clamp(Math.round(x + dsp), 0, w - 1)) * c, b = (y * w + clamp(Math.round(x - dsp), 0, w - 1)) * c;
      C[i * 3] = grey ? 0.3 * S[a] + 0.59 * S[a + 1] + 0.11 * S[a + 2] : S[a];
      C[i * 3 + 1] = S[b + 1]; C[i * 3 + 2] = S[b + 2];
    }
    layers.push({ name: "Anaglyph", rgba: null, blend: "NORMAL" });
  } else { // haze
    const r = Math.max(1, P.haze.blur * sc), near = hexToRgb(P.haze.nearTint);
    const B = [0, 1, 2].map((k) => { const p = new Float32Array(n); for (let i = 0; i < n; i++) p[i] = S[i * c + k]; boxBlur(p, w, h, r, 2); return p; });
    for (let i = 0; i < n; i++) {
      const d = Ds[i], f = Math.pow(1 - d, 1.6) * fogAmt, bl = clamp((0.55 - d) * 2.2, 0, 1);
      for (let k = 0; k < 3; k++) {
        let v = S[i * c + k] + (B[k][i] - S[i * c + k]) * bl;
        v += (fog[k] - v) * f;
        C[i * 3 + k] = v * (1 + 0.25 * d) + (near[k] - 128) * 0.18 * d * (P.haze.warm / 100);
      }
    }
    layers.push({ name: "Haze", rgba: null, blend: "NORMAL" });
  }

  // finish the full-colour layer
  const last = layers[layers.length - 1];
  if (!last.rgba) {
    const out = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) { out[i * 4] = clamp(C[i * 3], 0, 255); out[i * 4 + 1] = clamp(C[i * 3 + 1], 0, 255); out[i * 4 + 2] = clamp(C[i * 3 + 2], 0, 255); out[i * 4 + 3] = A[i]; }
    last.rgba = out;
  }
  if (P.out && P.out.depthLayer) {
    const dm = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) { const v = Math.round(D[i] * 255); dm[i * 4] = dm[i * 4 + 1] = dm[i * 4 + 2] = v; dm[i * 4 + 3] = A[i]; }
    layers.unshift({ name: "Depth map", rgba: dm, blend: "NORMAL", hidden: true });
  }
  if (P.view && P.view.depth) {   // preview toggle: show the depth field itself
    const dm = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) { const v = Math.round(D[i] * 255); dm[i * 4] = dm[i * 4 + 1] = dm[i * 4 + 2] = v; dm[i * 4 + 3] = 255; }
    return { w, h, layers: [{ name: "Depth map", rgba: dm, blend: "NORMAL" }], notes: ["Depth: " + used] };
  }
  return { w, h, layers, notes: ["Depth: " + used] };
}

module.exports = { render, composite: M.composite, demoImage: M.demoImage };
