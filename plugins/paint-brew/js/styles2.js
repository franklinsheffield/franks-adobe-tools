"use strict";
// ======================================================================
// Paint Brew 1.1 styles: Alcohol Ink, Spray Paint and Pastel.
// Same rules as engine.js: pure JS, deterministic, sizes in "px at a 3000 px
// long side" (k = real px per unit), src.focus marks the subject.
// Textures (wall, paper tooth, metallic sparkle) are generated in code.
// ======================================================================
const M = require("../core/imgmath.js");
const { clamp } = M;
const REF = 3000;

let X = null;   // engine internals, loaded on first use (engine.js requires this file lazily)
const ix = () => X || (X = require("./engine.js")._internal);

const METALS = { gold: [214, 172, 62], silver: [206, 208, 214], copper: [190, 112, 58] };
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

function setup(src, P) {
  const I = ix();
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const fullLong = Math.max(P.fullW || w / sc, P.fullH || h / sc, 1);
  const k = Math.max(0.02, sc * fullLong / REF);
  const { R, G, B } = I.opaquePlanes(src);
  I.adjustColour(R, G, B, n, P.colour.saturation, P.colour.warmth);
  const focus = I.focusOf(src, n);
  return { I, w, h, n, k, R, G, B, focus, seed: (P.seed | 0) + 1, rad0: Math.max(0.8, P.brush.size * k), simp: 0.25 + P.colour.simplify / 100 };
}
// 1 where a pixel's label differs from its right or lower neighbour
function labelEdges(L, w, h) {
  const E = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, a = L[i];
    if ((x + 1 < w && L[i + 1] !== a) || (y + 1 < h && L[i + w] !== a)) { E[i] = 1; if (x + 1 < w) E[i + 1] = 1; if (y + 1 < h) E[i + w] = 1; }
  }
  return E;
}
function fillRGBA(rgb, n, a) {
  const out = new Uint8Array(n * 4);
  for (let i = 0, p = 0; i < n; i++, p += 4) { out[p] = rgb[0]; out[p + 1] = rgb[1]; out[p + 2] = rgb[2]; out[p + 3] = a; }
  return out;
}
// soft round dot, "over" into a straight-colour rgba layer
function dot(out, w, h, cx, cy, r, col, alpha) {
  const R1 = r + 1;
  for (let y = Math.max(0, Math.floor(cy - R1)); y <= Math.min(h - 1, Math.ceil(cy + R1)); y++)
    for (let x = Math.max(0, Math.floor(cx - R1)); x <= Math.min(w - 1, Math.ceil(cx + R1)); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const a = clamp(r + 0.5 - d, 0, 1) * alpha;
      if (a <= 0.003) continue;
      const p = (y * w + x) * 4, a0 = out[p + 3] / 255, na = a + a0 * (1 - a);
      for (let c = 0; c < 3; c++) out[p + c] = clamp(Math.round((col[c] * a + out[p + c] * a0 * (1 - a)) / na), 0, 255);
      out[p + 3] = Math.round(na * 255);
    }
}

// ---------------------------------------------------------------- Alcohol Ink
async function paintInk(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const prog = (hooks && hooks.progress) || (() => {});
  const S = setup(src, P), { I, w, h, n, k, R, G, B, focus, seed, rad0, simp } = S, Q = P.ink;
  prog("Analysing the photo...");
  // alcohol inks are vivid: push saturation a little more than the Colour card does
  I.adjustColour(R, G, B, n, 25, 0);
  const [aR, aG, aB] = I.abstraction(R, G, B, w, h, rad0 * 1.0 * simp);
  { const sb = Math.max(1, rad0 * 0.5 * simp); M.boxBlur(aR, w, h, sb, 2); M.boxBlur(aG, w, h, sb, 2); M.boxBlur(aB, w, h, sb, 2); }
  await yieldFn();
  const count = P.colour.palette > 1 ? P.colour.palette : 7;
  const pal = I.palette(aR, aG, aB, n, count, M.rng(seed * 977));
  const lab = new Uint8Array(n);
  for (let i = 0; i < n; i++) lab[i] = I.nearest(pal, aR[i], aG[i], aB[i]);
  // pour: domain-warp the colour regions along a smooth noise field
  prog("Pouring the ink...");
  const flow = Q.flow / 100, outside = P.focus.outside / 100;
  const D = rad0 * (0.3 + 1.2 * flow), sc = Math.max(6, P.brush.size * 12);
  const L = new Uint8Array(n), cR = new Float32Array(n), cG = new Float32Array(n), cB = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, ux = x / k / sc, uy = y / k / sc;
    const fc = focus ? focus[i] : 1, d = D * (1 + (1 - fc) * (1 - outside) * 1.5);
    const wx = I.fbm(ux, uy, seed + 21, 3), wy = I.fbm(ux + 7.1, uy - 3.3, seed + 22, 3);
    const sx = clamp(Math.round(x + d * (wx + 0.35 * I.fbm(ux * 3 + wx, uy * 3 + wy, seed + 23, 2))), 0, w - 1);
    const sy = clamp(Math.round(y + d * (wy + 0.35 * I.fbm(ux * 3 - wy, uy * 3 + wx, seed + 24, 2))), 0, h - 1);
    const j = sy * w + sx, c = pal[lab[j]];
    L[i] = lab[j];
    cR[i] = c[0] * 0.78 + aR[j] * 0.22; cG[i] = c[1] * 0.78 + aG[j] * 0.22; cB[i] = c[2] * 0.78 + aB[j] * 0.22;
  }
  await yieldFn();
  { const br = Math.max(1, (0.2 + Q.blend / 100 * 0.5) * rad0); M.boxBlur(cR, w, h, br, 2); M.boxBlur(cG, w, h, br, 2); M.boxBlur(cB, w, h, br, 2); }   // a little blending always: no sampling grain
  // ink migrates to the drying edge: pools are lighter in the middle
  const E = labelEdges(L, w, h), Eb = M.boxBlur(Float32Array.from(E), w, h, Math.max(1, rad0 * 0.45), 2);
  const layers = [];
  const sheen = new Uint8Array(n * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 4, v = 250 + 4 * (0.5 + 0.5 * I.fbm(x / k / 900, y / k / 900, seed + 25, 2));
    sheen[p] = v; sheen[p + 1] = v; sheen[p + 2] = clamp(v + 1, 0, 255); sheen[p + 3] = 255;
  }
  layers.push({ name: "Gloss paper", rgba: sheen, blend: "NORMAL" });
  const pools = new Uint8Array(n * 4);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const mid = 1 - clamp(Eb[i] * 2.2, 0, 1), lift = 0.2 * mid * (0.6 + 0.4 * (0.5 + 0.5 * I.fbm((i % w) / k / 110, ((i / w) | 0) / k / 110, seed + 26, 3)));
    pools[p] = clamp(cR[i] + (255 - cR[i]) * lift, 0, 255); pools[p + 1] = clamp(cG[i] + (255 - cG[i]) * lift, 0, 255); pools[p + 2] = clamp(cB[i] + (255 - cB[i]) * lift, 0, 255);
    pools[p + 3] = Math.round(255 * (0.86 + 0.14 * (1 - mid)));
  }
  layers.push({ name: "Pools", rgba: pools, blend: "NORMAL" });
  await yieldFn();
  // cells: pale blooms where alcohol pushed the ink aside, each with its own dark drying ring
  let cellsOut = null;
  const ring = new Float32Array(n);
  if (Q.cells > 0) {
    prog("Cells...");
    cellsOut = new Uint8Array(n * 4);
    const rnd = M.rng(seed * 6007), c = Q.cells / 100;
    const cs = Math.max(2.5, rad0 * 1.1);
    const cnt = Math.min(250, Math.round(c * n / (cs * cs) * 0.03));
    for (let s = 0; s < cnt; s++) {
      const cx = rnd() * w, cy = rnd() * h, r = cs * (0.35 + rnd() * 1.1), sd = seed * 17 + s;
      const j = clamp(Math.floor(cy), 0, h - 1) * w + clamp(Math.floor(cx), 0, w - 1);
      const col = [cR[j] + (255 - cR[j]) * 0.5, cG[j] + (255 - cG[j]) * 0.5, cB[j] + (255 - cB[j]) * 0.5];
      const R1 = r * 1.5 + 1, rimW = Math.max(0.9, 1.1 * k) / r;
      for (let y = Math.max(0, Math.floor(cy - R1)); y <= Math.min(h - 1, Math.ceil(cy + R1)); y++)
        for (let x = Math.max(0, Math.floor(cx - R1)); x <= Math.min(w - 1, Math.ceil(cx + R1)); x++) {
          const dx = x - cx, dy = y - cy, ang = Math.atan2(dy, dx);
          const rr = r * (1 + 0.38 * I.fbm(Math.cos(ang) * 1.3 + sd, Math.sin(ang) * 1.3, sd, 3));
          const t = Math.hypot(dx, dy) / rr, i = y * w + x;
          if (t >= 1 + 3 * rimW) continue;
          ring[i] = Math.max(ring[i], Math.exp(-((t - 1) * (t - 1)) / (rimW * rimW)) * (0.5 + 0.5 * c));
          if (t >= 1) continue;
          const a = clamp(0.75 * (1 - t * t * t * t), 0, 1) * (0.45 + 0.4 * c), p = i * 4;
          if (a * 255 <= cellsOut[p + 3]) continue;
          cellsOut[p] = col[0]; cellsOut[p + 1] = col[1]; cellsOut[p + 2] = col[2]; cellsOut[p + 3] = Math.round(a * 255);
        }
    }
    await yieldFn();
  }
  if (Q.rim > 0) {
    prog("Drying rims...");
    const rw = Math.max(1, (0.4 + Q.rim / 100 * 1.4) * k * 2), Rb = M.boxBlur(Float32Array.from(E), w, h, rw, 2);
    const out = new Uint8Array(n * 4), g = Q.rim / 100;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const vary = 0.45 + 0.55 * (0.5 + 0.5 * I.fbm((i % w) / k / 120, ((i / w) | 0) / k / 120, seed + 29, 2));
      const a = Math.max(clamp(Rb[i] * 2.4, 0, 1) * vary, ring[i] * 0.8) * g;
      if (a <= 0) continue;
      out[p] = cR[i] * cR[i] / 255 * 0.75; out[p + 1] = cG[i] * cG[i] / 255 * 0.75; out[p + 2] = cB[i] * cB[i] / 255 * 0.75; out[p + 3] = Math.round(a * 255);
    }
    layers.push({ name: "Rims", rgba: out, blend: "MULTIPLY" });
    await yieldFn();
  }
  if (cellsOut) layers.push({ name: "Cells", rgba: cellsOut, blend: "SCREEN" });
  if (Q.veins > 0) {
    prog("Metallic veins...");
    const metal = METALS[Q.metal] || METALS.gold, v = Q.veins / 100;
    const lw = Math.max(0.8, (0.6 + 0.9 * v) * k * 1.6), Vb = M.boxBlur(Float32Array.from(E), w, h, lw, 2);
    const out = new Uint8Array(n * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      // only some edges carry a vein; more of them as Veins goes up
      const pick = smooth(0.78 - 0.32 * v, 0.88 - 0.32 * v, 0.5 + 0.5 * I.fbm(x / k / 260, y / k / 260, seed + 27, 2));
      const a = clamp(Vb[i] * 1.6, 0, 1) * pick;
      if (a <= 0.01) continue;
      const sp = 0.72 + 0.5 * (0.5 + 0.5 * I.vnoise(x / k / 2.5, y / k / 2.5, seed + 28));
      out[p] = clamp(metal[0] * sp, 0, 255); out[p + 1] = clamp(metal[1] * sp, 0, 255); out[p + 2] = clamp(metal[2] * sp, 0, 255); out[p + 3] = Math.round(a * 255);
    }
    layers.push({ name: "Metallic veins", rgba: out, blend: "NORMAL" });
  }
  return { w, h, layers, notes: [] };
}

// ---------------------------------------------------------------- Spray Paint
function wallLayer(w, h, k, Q, seed, I) {
  const n = w * h, out = new Uint8Array(n * 4), base = M.hexToRgb(Q.wallColour), mortar = [205, 200, 190];
  const BH = 75, BW = 230, MT = 9;      // brick height, width, mortar, in units
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ux = x / k, uy = y / k, p = (y * w + x) * 4;
    let col = base, v = 1;
    if (Q.wall === "concrete") {
      v = 0.9 + 0.12 * I.fbm(ux / 90, uy / 90, seed + 31, 4) + 0.06 * I.fbm(ux / 6, uy / 6, seed + 32, 2);
      if (M.hashNoise(Math.floor(ux / 3), Math.floor(uy / 3), seed + 33) > 0.985) v *= 0.7;       // small pits
    } else if (Q.wall === "brick") {
      const row = Math.floor(uy / BH), off = (row & 1) * BW / 2, col0 = Math.floor((ux + off) / BW);
      const fx = (ux + off) - col0 * BW, fy = uy - row * BH;
      if (fx < MT || fy < MT) { col = mortar; v = 0.95 + 0.06 * I.fbm(ux / 5, uy / 5, seed + 34, 2); }
      else v = 0.88 + 0.14 * M.hashNoise(col0, row, seed + 35) + 0.07 * I.fbm(ux / 14, uy / 14, seed + 36, 2);
    } else v = 1 + 0.025 * I.fbm(ux / 120, uy / 120, seed + 37, 2);
    out[p] = clamp(col[0] * v, 0, 255); out[p + 1] = clamp(col[1] * v, 0, 255); out[p + 2] = clamp(col[2] * v, 0, 255); out[p + 3] = 255;
  }
  return out;
}
async function paintSpray(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const prog = (hooks && hooks.progress) || (() => {});
  const S = setup(src, P), { I, w, h, n, k, R, G, B, focus, seed, rad0, simp } = S, Q = P.spray;
  const layers = [];
  prog("Wall...");
  layers.push({ name: "Wall", rgba: wallLayer(w, h, k, Q, seed, I), blend: "NORMAL" });
  await yieldFn();
  prog("Mixing the cans...");
  const [aR, aG, aB] = I.abstraction(R, G, B, w, h, rad0 * 0.45 * simp);
  await yieldFn();
  // base fade: a soft sprayed wash of the picture's broad colours
  {
    const br = Math.max(2, rad0 * 5), fR = I.blur(aR, w, h, br), fG = I.blur(aG, w, h, br), fB = I.blur(aB, w, h, br), A = new Uint8Array(n);
    for (let i = 0; i < n; i++) A[i] = Math.round(110 + 40 * (0.5 + 0.5 * I.fbm((i % w) / k / 300, ((i / w) | 0) / k / 300, seed + 38, 2)));
    layers.push({ name: "Base fade", rgba: M.toRGBA(fR, fG, fB, A, n), blend: "NORMAL" });
  }
  const cans = clamp(Math.round(Q.cans), 3, 8);
  const pal = I.palette(aR, aG, aB, n, cans, M.rng(seed * 977)).sort((a, b) => lum(b[0], b[1], b[2]) - lum(a[0], a[1], a[2]));   // lightest first
  const lab = new Uint8Array(n);
  for (let i = 0; i < n; i++) lab[i] = I.nearest(pal, aR[i], aG[i], aB[i]);
  const outside = P.focus.outside / 100, os = Q.overspray / 100;
  const hr = Math.max(1, (0.15 + os * 0.9) * rad0);
  for (let c = 0; c < cans; c++) {
    prog("Can " + (c + 1) + " of " + cans + "...");
    // each can sprays its stencil plus everything darker (stencils stack light to dark)
    const m = new Float32Array(n);
    for (let i = 0; i < n; i++) m[i] = lab[i] >= c ? 1 : 0;
    const core = M.boxBlur(Float32Array.from(m), w, h, Math.max(1, 0.7 * k), 1), halo = M.boxBlur(m, w, h, hr, 3);
    const out = new Uint8Array(n * 4), col = pal[c], lightest = c === 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4, fc = focus ? focus[i] : 1;
      const grain = 0.5 + 0.5 * M.hashNoise(x, y, seed * 7 + c);
      const hg = halo[i] * (1 + (1 - fc) * (1 - outside)) * 0.55 * grain;
      let a = Math.max(clamp(core[i] * 1.6 - 0.3, 0, 1), clamp(hg, 0, 0.6));
      if (lightest) a *= 0.8;                       // the wall reads through the first coat
      if (a <= 0.004) continue;
      out[p] = col[0]; out[p + 1] = col[1]; out[p + 2] = col[2]; out[p + 3] = Math.round(clamp(a, 0, 0.97) * 255);
    }
    layers.push({ name: "Can " + (c + 1), rgba: out, blend: "NORMAL" });
    await yieldFn();
  }
  const E = labelEdges(lab, w, h);
  if (Q.speckle > 0) {
    prog("Speckle...");
    const out = new Uint8Array(n * 4), rnd = M.rng(seed * 811), sp = Q.speckle / 100;
    const Eb = M.boxBlur(Float32Array.from(E), w, h, Math.max(1, hr), 2);
    const cnt = Math.min(40000, Math.round(sp * n / Math.max(1, k * k) * 0.0035 + sp * 80));
    for (let s = 0; s < cnt; s++) {
      const x = rnd() * w, y = rnd() * h, i = Math.min(n - 1, Math.floor(y) * w + Math.floor(x));
      if (rnd() > 0.25 + 0.75 * clamp(Eb[i] * 3, 0, 1)) continue;          // mostly near edges
      const col = pal[lab[i]];
      dot(out, w, h, x, y, Math.max(0.4, (0.5 + rnd() * 1.4) * k * 1.3), col, 0.9);
    }
    layers.push({ name: "Speckle", rgba: out, blend: "NORMAL" });
    await yieldFn();
  }
  if (Q.drips > 0) {
    prog("Drips...");
    const out = new Uint8Array(n * 4), rnd = M.rng(seed * 1999), dr = Q.drips / 100;
    const cnt = Math.round(dr * 50 * Math.sqrt(n / Math.max(1, k * k)) / 400 + dr * 6);
    const half = Math.floor(cans / 2);
    let made = 0;
    for (let tries = 0; tries < cnt * 30 && made < cnt; tries++) {
      const x = Math.floor(rnd() * w), y = Math.floor(rnd() * (h - 2));
      const i = y * w + x, c = lab[i];
      if (c < half || lab[i + w] >= c) continue;    // start at the lower edge of a darker coat
      made++;
      const col = pal[c], wd = Math.max(0.7, (2.2 + rnd() * 2.6) * k * (0.6 + P.brush.size / 80));
      const len = (Q.dripLength / 100) * (40 + rnd() * 200) * k;
      const sd = seed * 3 + made;
      for (let t = 0; t <= len; t += Math.max(0.5, wd * 0.5)) {
        const xx = x + wd * 0.8 * I.vnoise(t / Math.max(1, 30 * k), sd, sd), taper = 1 - 0.35 * (t / Math.max(1, len));
        dot(out, w, h, xx, y + t, wd * taper, col, 0.95);
      }
      dot(out, w, h, x + wd * 0.8 * I.vnoise(len / Math.max(1, 30 * k), sd, sd), y + len, wd * 1.35, col, 0.95);
    }
    layers.push({ name: "Drips", rgba: out, blend: "NORMAL" });
    await yieldFn();
  }
  if (Q.outline > 0) {
    prog("Outline...");
    // only the strong steps between coats get the fat-cap line
    const S2 = new Float32Array(n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, a = pal[lab[i]], la = lum(a[0], a[1], a[2]);
      let d = 0;
      if (x + 1 < w) { const b = pal[lab[i + 1]]; d = Math.max(d, Math.abs(la - lum(b[0], b[1], b[2]))); }
      if (y + 1 < h) { const b = pal[lab[i + w]]; d = Math.max(d, Math.abs(la - lum(b[0], b[1], b[2]))); }
      S2[i] = d > 45 ? 1 : 0;
    }
    const lw = Math.max(1, (0.8 + Q.outline / 100 * 2.6) * k * 1.4), Ob = M.boxBlur(S2, w, h, lw, 2);
    const out = new Uint8Array(n * 4), g = Q.outline / 100;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const a = clamp(Ob[i] * 4 - 0.25, 0, 1) * (0.55 + 0.45 * g);
      if (a <= 0.004) continue;
      out[p] = 18; out[p + 1] = 18; out[p + 2] = 20; out[p + 3] = Math.round(a * 255);
    }
    layers.push({ name: "Outline", rgba: out, blend: "NORMAL" });
  }
  return { w, h, layers, notes: [] };
}

// ---------------------------------------------------------------- Pastel
async function paintPastel(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const prog = (hooks && hooks.progress) || (() => {});
  const S = setup(src, P), { I, w, h, n, k, R, G, B, focus, seed, rad0, simp } = S, Q = P.pastel, Br = P.brush, C = P.colour;
  const paper = M.hexToRgb(Q.paper), oil = !!Q.oil, tooth = Q.tooth / 100 * (oil ? 0.3 : 1), press = Q.pressure / 100;
  const layers = [];
  prog("Toned paper...");
  // tooth: a fine bumpy grain the chalk catches on
  const T = new Float32Array(n);
  // grain is 7 units; below ~3 px (small previews) it is averaged out instead of drawn as pixel noise
  const tz = Math.max(2.5, 7 * k), tc = clamp(7 * k / 3, 0.35, 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) T[y * w + x] = 0.5 + 0.5 * tc * (0.75 * I.fbm(x / tz, y / tz * 0.55, seed + 41, 3) + 0.25 * I.vnoise(x / tz * 1.7, y / tz * 1.7, seed + 42));
  {
    const out = new Uint8Array(n * 4);
    for (let i = 0, p = 0; i < n; i++, p += 4) { const v = 0.95 + 0.1 * T[i] * (0.3 + tooth); out[p] = clamp(paper[0] * v, 0, 255); out[p + 1] = clamp(paper[1] * v, 0, 255); out[p + 2] = clamp(paper[2] * v, 0, 255); out[p + 3] = 255; }
    layers.push({ name: "Toned paper", rgba: out, blend: "NORMAL" });
  }
  await yieldFn();
  const rnd = M.rng(seed * 977);
  const pal = C.palette > 1 ? I.palette(R, G, B, n, C.palette, rnd) : null;
  // hatch direction: the picture's own flow, or one fixed angle
  let TX, TY;
  if (Q.hatch === "fixed") {
    const a = -Q.angle * Math.PI / 180; TX = new Float32Array(n).fill(Math.cos(a)); TY = new Float32Array(n).fill(Math.sin(a));
  } else { const f = I.flowField(R, G, B, w, h, k, seed); TX = f.TX; TY = f.TY; }
  await yieldFn();
  const ctx = { w, h, TX, TY, focus, mark: new Int32Array(n), cov: new Float32Array(n), sid: 0, canvas: null, H: null };
  // smudge: blended colour rubbed in under the strokes
  prog("Smudging...");
  const [sR, sG, sB] = I.abstraction(R, G, B, w, h, Math.max(1, rad0 * 0.8 * simp));
  const br = Math.max(1, rad0 * 0.6); M.boxBlur(sR, w, h, br, 2); M.boxBlur(sG, w, h, br, 2); M.boxBlur(sB, w, h, br, 2);
  const sa = Q.smudge / 100 * 0.9;
  const smA = new Uint8Array(n).fill(Math.round(sa * 255));
  if (sa > 0) layers.push({ name: "Smudge", rgba: M.toRGBA(sR, sG, sB, smA, n), blend: "NORMAL" });
  ctx.canvas = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++) { ctx.canvas[0][i] = paper[0] + (sR[i] - paper[0]) * sa; ctx.canvas[1][i] = paper[1] + (sG[i] - paper[1]) * sa; ctx.canvas[2][i] = paper[2] + (sB[i] - paper[2]) * sa; }
  await yieldFn();
  // each stick of pastel is a slightly different shade, so the hatching reads
  const colourFn = (col, r) => { const c = pal ? pal[I.nearest(pal, col[0], col[1], col[2])] : col, v = 1 + (r() - 0.5) * 0.22; return [c[0] * v, c[1] * v, c[2] * v]; };
  const style = { bristles: 4, bristle: 0.05, rough: oil ? 0.12 : 0.3, dry: oil ? 0.05 : 0.25, load: 0.55 + 0.45 * press, thick: 0, cap: 0.5 };
  // the tooth breaks a stroke: low pressure lets more paper through
  const breakUp = (buf, amt) => {
    const cut = 0.22 + (1 - press) * 0.4 + tooth * 0.18;
    for (let i = 0; i < n; i++) {
      const a = buf.PA[i]; if (a <= 0) continue;
      const m = 1 - amt * 0.65 * (1 - smooth(cut - 0.22, cut + 0.22, T[i]));
      buf.P0[i] *= m; buf.P1[i] *= m; buf.P2[i] *= m; buf.PA[i] *= m;
    }
  };
  const fOut = P.focus.outside / 100, passes = clamp(Math.round(Br.detail), 1, 4), follow = Q.hatch === "fixed" ? 1 : Br.follow / 100;
  const radB = rad0 * (oil ? 0.55 : 0.42);
  const buf = makeBuf(n);
  for (let p = 0; p < passes; p++) {
    prog("Strokes (pass " + (p + 1) + " of " + passes + ")...");
    const r = Math.max(0.6, 3 * k, radB * Math.pow(0.6, p));
    const ref = I.abstraction(R, G, B, w, h, Math.max(1, r * 0.6 * simp));
    await yieldFn();
    await I.strokePass(ctx, buf, ref, { seed: seed * 31 + p, radius: r, spacing: r * 1.1, fillAll: p === 0, thresh: 30 + 10 * p, minLen: Math.max(2, Math.round(3 * Br.length)), maxLen: Math.max(3, Math.round(7 * Br.length)),
      step: 0.7, follow, jitter: Br.randomness / 100 * (Q.hatch === "fixed" ? 0.15 : 0.45), stopAfter: 2, stopDiff: 140,
      outsideSuppress: (1 - fOut) * 3, outsideGrow: (1 - fOut) * 0.7, colourFn, style }, yieldFn);
  }
  breakUp(buf, 1);
  const strokes = I.bufToRGBA(buf, n);
  layers.push({ name: "Strokes", rgba: strokes, blend: "NORMAL" });
  I.overCanvas(ctx.canvas, strokes, n);
  await yieldFn();
  prog("Highlights...");
  {
    const hb = makeBuf(n), L0 = new Float32Array(n);
    for (let i = 0; i < n; i++) L0[i] = lum(R[i], G[i], B[i]);
    const hiFn = (col, r2) => { const c = colourFn(col, r2); return [c[0] + (255 - c[0]) * 0.45, c[1] + (255 - c[1]) * 0.45, c[2] + (255 - c[2]) * 0.4]; };
    // reference = the photo only where it is bright, so strokes land on the highlights
    const hR = new Float32Array(n), hG = new Float32Array(n), hB = new Float32Array(n);
    for (let i = 0; i < n; i++) { const b = L0[i] > 185; hR[i] = b ? 255 : ctx.canvas[0][i]; hG[i] = b ? 255 : ctx.canvas[1][i]; hB[i] = b ? 255 : ctx.canvas[2][i]; }
    const r = Math.max(0.6, 3 * k, radB * 0.5);
    await I.strokePass(ctx, hb, [hR, hG, hB], { seed: seed * 53, radius: r, spacing: r * 1.6, fillAll: false, thresh: 60, minLen: 2, maxLen: Math.max(3, Math.round(5 * Br.length)),
      step: 0.7, follow, jitter: 0.2, stopAfter: 1, stopDiff: 255, outsideSuppress: (1 - fOut) * 3, outsideGrow: 0, colourFn: (col, r2, x, y) => hiFn([R[y * w + x], G[y * w + x], B[y * w + x]], r2), style }, yieldFn);
    breakUp(hb, 1);
    layers.push({ name: "Highlights", rgba: I.bufToRGBA(hb, n), blend: "NORMAL" });
  }
  if (!oil) {
    prog("Dust...");
    const out = new Uint8Array(n * 4), r2 = M.rng(seed * 313), cv = ctx.canvas;
    const cnt = Math.round(Math.min(n * 0.01, n / Math.max(1, k * k) * 0.00012) * (0.3 + tooth) + 20);
    for (let s = 0; s < cnt; s++) {
      const x = r2() * w, y = r2() * h, i = Math.min(n - 1, Math.floor(y) * w + Math.floor(x));
      dot(out, w, h, x, y, Math.max(0.5, (0.4 + r2() * 0.9) * k * 1.4), [cv[0][i], cv[1][i], cv[2][i]], 0.25);
    }
    layers.push({ name: "Dust", rgba: out, blend: "SCREEN" });
  }
  return { w, h, layers, notes: [] };
}
function makeBuf(n) { return { P0: new Float32Array(n), P1: new Float32Array(n), P2: new Float32Array(n), PA: new Float32Array(n) }; }

module.exports = { paintInk, paintSpray, paintPastel, METALS };
