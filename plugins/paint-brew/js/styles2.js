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
// a box-blurred 2 px edge peaks at 2/(2r+1): scale it back so a line keeps the
// strength it has at r = 1 (the small preview) at any size
const lineGain = (r) => (2 * Math.max(1, Math.round(r)) + 1) / 3;
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
    const rw = Math.max(1, (1.2 + Q.rim / 100 * 3) * k * 2), rg = 2.4 * lineGain(rw), Rb = M.boxBlur(Float32Array.from(E), w, h, rw, 2);
    const out = new Uint8Array(n * 4), g = Q.rim / 100;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const vary = 0.45 + 0.55 * (0.5 + 0.5 * I.fbm((i % w) / k / 120, ((i / w) | 0) / k / 120, seed + 29, 2));
      const a = Math.max(clamp(Rb[i] * rg, 0, 1) * vary, ring[i] * 0.8) * g;
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
    const lw = Math.max(0.8, (2.4 + 3.6 * v) * k * 1.6), vg = 1.6 * lineGain(lw), Vb = M.boxBlur(Float32Array.from(E), w, h, lw, 2);
    const out = new Uint8Array(n * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      // only some edges carry a vein; more of them as Veins goes up
      const pick = smooth(0.78 - 0.32 * v, 0.88 - 0.32 * v, 0.5 + 0.5 * I.fbm(x / k / 260, y / k / 260, seed + 27, 2));
      const a = clamp(Vb[i] * vg, 0, 1) * pick;
      if (a <= 0.01) continue;
      const sp = 0.72 + 0.5 * (0.5 + 0.5 * I.vnoise(x / k / 2.5, y / k / 2.5, seed + 28));
      out[p] = clamp(metal[0] * sp, 0, 255); out[p + 1] = clamp(metal[1] * sp, 0, 255); out[p + 2] = clamp(metal[2] * sp, 0, 255); out[p + 3] = Math.round(a * 255);
    }
    layers.push({ name: "Metallic veins", rgba: out, blend: "NORMAL" });
  }
  return { w, h, layers, notes: [] };
}

// ---------------------------------------------------------------- Spray Paint
// wall colours a wall type starts with (the panel sets these when the type changes)
const WALL_COLOURS = { plain: "#E8E6E1", concrete: "#A8A49C", stucco: "#D8CCB4", brick: "#9C4A36", block: "#9A9A96", metal: "#7D848C", wood: "#8A6A48" };
// ---- wall surfaces (Spray Paint). Units are px at a 3000 px long side.
const u01 = (x, y, s) => 0.5 + 0.5 * M.hashNoise(x, y, s);
// where a pixel sits in a brick bond: { id, e } with e = units inside the brick (negative = mortar)
function brickCell(ux, uy, BW, BH, MT, pattern) {
  let cx, cy, fx, fy, cw, ch;
  if (pattern === "basket") {
    const S = BW, bx = Math.floor(ux / S), by = Math.floor(uy / S), lx = ux - bx * S, ly = uy - by * S;
    if ((bx + by) & 1) { const sub = ly < S / 2 ? 0 : 1; fx = lx; fy = ly - sub * S / 2; cw = S; ch = S / 2; cx = bx * 2 + sub; cy = by; }
    else { const sub = lx < S / 2 ? 0 : 1; fx = lx - sub * S / 2; fy = ly; cw = S / 2; ch = S; cx = bx * 2 + sub; cy = by + 7777; }
  } else {
    const row = Math.floor(uy / BH);
    fy = uy - row * BH; ch = BH; cy = row;
    if (pattern === "flemish") {
      const P = BW * 1.5, px = ux + (row & 1) * BW * 0.75, per = Math.floor(px / P), q = px - per * P;
      if (q < BW) { cx = per * 2; fx = q; cw = BW; } else { cx = per * 2 + 1; fx = q - BW; cw = BW / 2; }
    } else {
      const px = ux + (pattern === "stack" ? 0 : (row & 1) * BW / 2);
      cx = Math.floor(px / BW); fx = px - cx * BW; cw = BW;
    }
  }
  const rc = 3, dx = Math.min(fx, cw - fx) - MT / 2, dy = Math.min(fy, ch - fy) - MT / 2;
  const e = (dx < rc && dy < rc && dx > 0 && dy > 0) ? rc - Math.hypot(rc - dx, rc - dy) : Math.min(dx, dy);
  return { cx, cy, e };
}
// the wall: colour plus a relief map (-1 recess .. +1 bump) that also shows through the paint
function wallLayer(w, h, k, Q, seed, I) {
  const n = w * h, out = new Uint8Array(n * 4), base = M.hexToRgb(Q.wallColour), rel = new Float32Array(n);
  const mortarC = M.hexToRgb(Q.mortarColour || "#CFC8BA");
  const type = Q.wall, fineAmp = clamp((k - 0.08) / 0.5, 0.25, 1);   // fine grain fades at small preview sizes instead of turning to pixel noise
  const grime = (Q.grime || 0) / 100, cr = type === "metal" ? 0 : (Q.cracks || 0) / 100;
  const hu = h / k;
  // brick and block
  const isBrick = type === "brick", bs = (Q.brickSize || 100) / 100;
  const BH = isBrick ? 75 * bs : 190, BW = isBrick ? 230 * bs : 390, MT = isBrick ? 2 + (Q.mortar == null ? 45 : Q.mortar) / 100 * 16 : 11;
  const pattern = isBrick ? (Q.brickPattern || "running") : "running", bv = (Q.brickVariation == null ? 50 : Q.brickVariation) / 100;
  // wood
  const vertical = Q.woodDir !== "horizontal", PW = 150 * (Q.plankWidth || 100) / 100, GAP = vertical ? 6 : 3;
  const grainS = (Q.grain == null ? 60 : Q.grain) / 100, knotS = (Q.knots == null ? 30 : Q.knots) / 100, finish = Q.woodFinish || "raw";
  const bareWood = [138, 106, 72];
  const crackW = Math.max(1.3, 0.45 / k);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ux = x / k, uy = y / k, i = y * w + x, p = i * 4;
    let c0 = base[0], c1 = base[1], c2 = base[2], v = 1, r = 0, warm = 0, grey = 0;
    if (type === "concrete") {
      // poured panels with seams and tie holes, stains, aggregate and pits
      const pxI = Math.floor(ux / 1200), pyI = Math.floor(uy / 600), lx = ux - pxI * 1200, ly = uy - pyI * 600;
      v = 0.92 + 0.08 * I.fbm(ux / 90, uy / 90, seed + 31, 3) + 0.04 * M.hashNoise(pxI, pyI, seed + 52);
      r = 0.4 * fineAmp * I.fbm(ux / 6, uy / 6, seed + 32, 2) + 0.2 * I.fbm(ux / 40, uy / 40, seed + 39, 2);
      const seam = Math.min(lx, 1200 - lx, ly, 600 - ly);
      if (seam < 1.5) { r -= 0.45; v *= 0.93; }
      const tx = lx - 150 - 300 * Math.round((lx - 150) / 300), ty = ly - 150 - 300 * Math.round((ly - 150) / 300), td = Math.hypot(tx, ty);
      if (td < 9) { r = -0.95; v *= 0.62; } else if (td < 13) { r += 0.25; v *= 1.04; }
      const ax = Math.floor(ux / 2.5), ay = Math.floor(uy / 2.5), ah = M.hashNoise(ax, ay, seed + 53);
      if (ah > 0.86) v *= 1 + 0.12 * fineAmp * (M.hashNoise(ax, ay, seed + 54) > 0 ? 1 : -1);
      const cx = Math.floor(ux / 4), cy = Math.floor(uy / 4);                                     // round pits
      if (M.hashNoise(cx, cy, seed + 33) > 0.94 && Math.hypot(ux - cx * 4 - 2, uy - cy * 4 - 2) < 1.1 + 0.7 * M.hashNoise(cx, cy, seed + 50)) { r = -0.9; v *= 0.85; }
    } else if (type === "stucco") {
      const b = I.fbm(ux / 9, uy / 9, seed + 40, 4), bump = Math.sign(b) * Math.pow(Math.abs(b), 0.6);
      r = fineAmp * (0.85 * bump + 0.3 * I.fbm(ux / 2.6, uy / 2.6, seed + 41, 2));
      v = 0.97 + 0.06 * I.fbm(ux / 160, uy / 160, seed + 42, 2) + 0.02 * bump * fineAmp;
    } else if (type === "brick" || type === "block") {
      const B = brickCell(ux, uy, BW, BH, MT, pattern);
      let e = B.e;
      const chip = Math.max(0, I.fbm(ux / 5, uy / 5, seed + 60, 3) - 0.12) * 16 * (0.3 + 0.7 * u01(B.cx, B.cy, seed + 63));
      if (e > 0) e -= chip;                                                         // chipped, worn arrises
      if (e < 0) {
        c0 = mortarC[0]; c1 = mortarC[1]; c2 = mortarC[2];
        const sand = I.fbm(ux / 2.2, uy / 2.2, seed + 34, 2);
        r = -0.8 + 0.25 * sand * fineAmp; v = 0.88 + 0.1 * sand * fineAmp;
      } else {
        const h1 = M.hashNoise(B.cx, B.cy, seed + 35), h2 = M.hashNoise(B.cx, B.cy, seed + 36), h3 = u01(B.cx, B.cy, seed + 37);
        v = 1 + (isBrick ? 0.34 : 0.12) * bv * h1;
        warm = (isBrick ? 0.12 : 0.03) * bv * h2;
        if (isBrick && h3 > 0.93 - 0.06 * bv) { c0 = c0 * 0.5 + 34; c1 = c1 * 0.45 + 18; c2 = c2 * 0.45 + 14; warm -= 0.03; }   // over-fired dark bricks
        v *= 1 + 0.08 * I.fbm(ux / 22 + B.cx * 3.1, uy / 22, seed + 61, 3) + 0.05 * fineAmp * I.fbm(ux / 2, uy / 2, seed + 62, 1)
          + 0.07 * fineAmp * M.hashNoise(Math.floor(ux / 1.6), Math.floor(uy / 1.6), seed + 65);     // sand-faced speckle
        v *= 0.92 + 0.08 * smooth(0, 14, e);                                        // faces darken towards the edges
        r = -0.55 + 0.75 * smooth(0, 4, e) + (isBrick ? 0.22 * I.fbm(ux / 10, uy / 10, seed + 64, 3) : 0.3 * fineAmp * I.fbm(ux / 3, uy / 3, seed + 43, 2));
        const pc = isBrick ? 6 : 5, cx = Math.floor(ux / pc), cy = Math.floor(uy / pc);   // pits / cinder pores
        if (M.hashNoise(cx, cy, seed + 44) > (isBrick ? 0.975 : 0.86) && Math.hypot(ux - cx * pc - pc / 2 + 1.5 * M.hashNoise(cx, cy, seed + 66), uy - cy * pc - pc / 2) < (isBrick ? 0.6 + 1.2 * u01(cx, cy, seed + 51) : 1.1 + 0.8 * u01(cx, cy, seed + 51))) { r -= 0.8; v *= 0.82; }
      }
    } else if (type === "metal") {
      // corrugated shutter: horizontal ribs, a little rust and run-off streaks
      const ph = uy / 34 * Math.PI * 2;
      r = 0.9 * Math.sin(ph);
      v = 0.92 + 0.12 * Math.sin(ph - 0.9) + 0.06 * I.fbm(ux / 3, uy / 160, seed + 46, 2);
      const rust = smooth(0.35, 0.75, 0.5 + 0.5 * I.fbm(ux / 70, uy / 70, seed + 47, 3));
      v *= 1 - 0.18 * rust; warm += 0.12 * rust;
    } else if (type === "wood") {
      const across = vertical ? ux : uy, along = vertical ? uy : ux;
      const pl = Math.floor(across / PW), fa = across - pl * PW;
      let id = pl, ej = 1e9, al = along;
      if (!vertical) {                                                              // siding: boards butt-jointed along their length
        const L = 900 + 700 * u01(pl, 1, seed + 71), off = L * u01(pl, 2, seed + 72), seg = Math.floor((along + off) / L), fl = along + off - seg * L;
        ej = Math.min(fl, L - fl) - 1.5; id = pl * 977 + seg; al = fl;
      }
      const e = Math.min(fa - GAP / 2, PW - fa - GAP / 2, ej);
      // knots: the grain flows around them
      let disp = 0, knot = 0;
      if (knotS > 0) {
        const kc0 = Math.floor(along / 600);
        for (let kc = kc0 - 1; kc <= kc0 + 1; kc++) {
          if (u01(id, kc, seed + 73) > knotS * 0.85) continue;
          const ka = kc * 600 + 300 + 220 * M.hashNoise(id, kc, seed + 74), kf = PW * (0.25 + 0.5 * u01(id, kc, seed + 75));
          const R = 10 + 16 * u01(id, kc, seed + 76), d = Math.hypot((fa - kf) / R, (along - ka) / (R * 1.7));
          disp += 3 * R * Math.exp(-d * d * 0.35) * Math.sign(fa - kf || 1);
          if (d < 1.2) knot = Math.max(knot, 1 - smooth(0.6, 1.2, d));
        }
      }
      const t = fa + disp + 24 * I.fbm(al / 380 + id * 1.37, fa / 70, seed + 70, 3);
      const ringW = 6 + 6 * u01(id, 5, seed + 77);
      const line = 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t / ringW * Math.PI * 2), 4) + 0.25 * Math.pow(0.5 + 0.5 * Math.sin(t / (ringW * 0.37) * Math.PI * 2 + 1.3), 3);
      const fibre = fineAmp * I.fbm(fa / 1.1, al / 40, seed + 78, 2);
      const tone = 0.86 + 0.22 * u01(id, 9, seed + 79);
      if (e < 0) { r = -1; v = 0.35; }
      else {
        const bevel = vertical ? smooth(0, 3, e) : 1;
        const lap = vertical ? 0 : 0.55 - 1.1 * fa / PW;                                  // lap siding: each board tilts out at the bottom
        if (finish === "painted") {
          const pt = 0.66 - 0.2 * grime, peel = smooth(pt, pt + 0.035, 0.5 + 0.5 * I.fbm(ux / 45, uy / 45, seed + 80, 4));
          const grainR = 0.25 * grainS * (line - 0.3);
          r = -0.4 + 0.6 * bevel + lap + grainR - 0.35 * peel;
          v = 0.97 + 0.03 * fibre;
          if (peel > 0) {
            const wood = [bareWood[0] * tone, bareWood[1] * tone, bareWood[2] * tone], gl = 1 - 0.3 * grainS * line;
            c0 = c0 + (wood[0] * gl - c0) * peel; c1 = c1 + (wood[1] * gl - c1) * peel; c2 = c2 + (wood[2] * gl - c2) * peel;
            if (peel > 0.02 && peel < 0.6) v *= 0.85;                                     // the torn paint edge
          }
        } else {
          const wth = finish === "weathered";
          v = tone * (1 - (wth ? 0.42 : 0.42) * grainS * line) * (1 + (wth ? 0.12 : 0.08) * fibre);
          warm = wth ? -0.02 : 0.05 * line * grainS;
          grey = wth ? 0.7 : 0;
          r = -0.4 + 0.6 * bevel + lap + (wth ? 0.6 : 0.2) * grainS * (line - 0.3) + (wth ? 0.3 : 0.1) * fibre;
          if (wth) {                                                                       // checking: thin splits along the grain
            const ck = Math.abs(I.fbm(fa / 3 + id * 3.3, al / 320, seed + 81, 2));
            const zone = smooth(0.15, 0.45, I.fbm(fa / 40 + id, al / 500, seed + 82, 2));
            if (zone > 0 && ck < 0.025 * (0.4 + cr) * fineAmp) { r = Math.min(r, -0.5 * fineAmp * zone); v *= 1 - 0.35 * fineAmp * zone; }
          }
          if (knot > 0) { v *= 1 - 0.6 * knot * (0.75 + 0.25 * Math.sin(knot * 18)); warm += 0.06 * knot; r -= 0.35 * knot; }
        }
        // nails on the rails / studs
        const nAlong = vertical ? [0.14 * hu, 0.86 * hu] : null;
        const nx = vertical ? [PW * 0.3, PW * 0.7] : [PW * 0.22];
        for (let a = 0; a < nx.length; a++) {
          const dfa = fa - nx[a];
          if (Math.abs(dfa) > 3.2) continue;
          const dal = vertical ? Math.min(Math.abs(along - nAlong[0]), Math.abs(along - nAlong[1])) : Math.abs(along - 400 * Math.round(along / 400));
          if (Math.hypot(dfa, dal) < 2.4) { c0 = 70; c1 = 66; c2 = 62; v = 0.9; r = 0.6; grey = 0; warm = 0; }
        }
      }
    } else {
      // painted render: a fine roller texture
      v = 1 + 0.025 * I.fbm(ux / 120, uy / 120, seed + 37, 2);
      r = 0.15 * fineAmp * I.fbm(ux / 4, uy / 4, seed + 38, 2);
    }
    // cracks
    if (cr > 0 && type !== "wood") {
      const reg = smooth(1 - cr, 1.18 - cr, 0.5 + 0.5 * I.fbm(ux / 500, uy / 500, seed + 93, 2));
      if (reg > 0) {
        const wx = ux + 40 * I.fbm(ux / 200, uy / 200, seed + 90, 2), wy = uy + 40 * I.fbm(ux / 200, uy / 200, seed + 91, 2);
        const d1 = Math.abs(I.fbm(wx / 260, wy / 260, seed + 92, 5)) * 260 * 0.9;
        const d2 = Math.abs(I.fbm(wx / 110, wy / 110, seed + 94, 2)) * 110 * 0.9 * 1.6;
        const ca = Math.max(smooth(crackW, crackW * 0.3, d1), 0.75 * smooth(crackW * 0.8, crackW * 0.2, d2) * smooth(30, 6, d1)) * reg;
        if (ca > 0) { r = r + (-0.95 - r) * ca; v *= 1 - 0.5 * ca; }
      }
    }
    // grime: run-off streaks, dirt rising from the ground, patchy soiling
    if (grime > 0) {
      const s = 0.5 + 0.5 * I.fbm(ux / 35, uy / 520, seed + 84, 2);
      const streak = smooth(0.55, 0.85, s) * smooth(0, 0.35, y / h + 0.1);
      const ground = smooth(0.62, 1, y / h) * (0.7 + 0.3 * I.fbm(ux / 25, uy / 25, seed + 85, 2));
      const patch = smooth(0.25, 0.85, 0.5 + 0.5 * I.fbm(ux / 260, uy / 260, seed + 86, 2));
      const dirt = grime * (0.3 * streak + 0.3 * ground + 0.12 * patch);
      v *= 1 - dirt; grey += 0.5 * dirt; warm += 0.08 * dirt;
      if ((type === "brick" || type === "block" || type === "concrete") && grime > 0.3) {   // salt bloom
        const bloom = smooth(0.7, 0.95, 0.5 + 0.5 * I.fbm(ux / 70, uy / 70, seed + 87, 3)) * (grime - 0.3) * 0.5;
        c0 += (235 - c0) * bloom; c1 += (232 - c1) * bloom; c2 += (225 - c2) * bloom;
      }
    }
    if (grey > 0) { const g = Math.min(1, grey), l = lum(c0, c1, c2) * 1.02; c0 += (l - c0) * g; c1 += (l - c1) * g; c2 += (l - c2) * g; }
    rel[i] = clamp(r, -1, 1);
    out[p] = clamp(c0 * v * (1 + warm), 0, 255); out[p + 1] = clamp(c1 * v, 0, 255); out[p + 2] = clamp(c2 * v * (1 - warm), 0, 255); out[p + 3] = 255;
  }
  const shade = reliefShade(rel, w, h, k);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const f = 1 + 0.22 * shade[i];
    out[p] = clamp(out[p] * f, 0, 255); out[p + 1] = clamp(out[p + 1] * f, 0, 255); out[p + 2] = clamp(out[p + 2] * f, 0, 255);
  }
  return { rgba: out, shade };
}
// light from the top left: height plus its slope, -1..1
function reliefShade(rel, w, h, k) {
  const d = Math.max(1, Math.round(1.6 * k)), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, x2 = Math.min(w - 1, x + d), y2 = Math.min(h - 1, y + d);
    out[i] = clamp(0.45 * rel[i] + 0.9 * (rel[i] - rel[y2 * w + x2]), -1, 1);
  }
  return out;
}
async function paintSpray(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const prog = (hooks && hooks.progress) || (() => {});
  const S = setup(src, P), { I, w, h, n, k, R, G, B, focus, seed, rad0, simp } = S, Q = P.spray;
  const layers = [];
  prog("Wall...");
  const wall = wallLayer(w, h, k, Q, seed, I);
  layers.push({ name: "Wall", rgba: wall.rgba, blend: "NORMAL" });
  await yieldFn();
  prog("Mixing the cans...");
  const [aR, aG, aB] = I.abstraction(R, G, B, w, h, rad0 * 0.45 * simp);
  await yieldFn();
  // base fade: a soft sprayed wash of the picture's broad colours
  {
    const br = Math.max(2, rad0 * 5), fR = I.blur(aR, w, h, br), fG = I.blur(aG, w, h, br), fB = I.blur(aB, w, h, br), A = new Uint8Array(n);
    const keep = 1 - (Q.bare || 0) / 100;          // Bare wall: leave the wall showing where the lightest paint would go
    for (let i = 0; i < n; i++) A[i] = Math.round(keep * (110 + 40 * (0.5 + 0.5 * I.fbm((i % w) / k / 300, ((i / w) | 0) / k / 300, seed + 38, 2))));
    layers.push({ name: "Base fade", rgba: M.toRGBA(fR, fG, fB, A, n), blend: "NORMAL" });
  }
  const cans = clamp(Math.round(Q.cans), 3, 8);
  const pal = I.palette(aR, aG, aB, n, cans, M.rng(seed * 977)).sort((a, b) => lum(b[0], b[1], b[2]) - lum(a[0], a[1], a[2]));   // lightest first
  const lab = new Uint8Array(n);
  for (let i = 0; i < n; i++) lab[i] = I.nearest(pal, aR[i], aG[i], aB[i]);
  const outside = P.focus.outside / 100, os = Q.overspray / 100, sft = (Q.soft == null ? 0 : Q.soft) / 100;
  const hr = Math.max(1, (0.15 + os * 0.9) * rad0);
  // soft edges: a wider fade, broken up into spray dots like a real can held further from the wall
  const er = Math.max(1, 0.7 * k + sft * sft * rad0 * 1.6);
  const DS = 1.5;                                  // spray dot cell, in units
  const dotG = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) dotG[y * w + x] = 0.5 + 0.5 * M.hashNoise(Math.floor(x / k / DS), Math.floor(y / k / DS), seed * 5 + 3);
  for (let c = 0; c < cans; c++) {
    prog("Can " + (c + 1) + " of " + cans + "...");
    // each can sprays its stencil plus everything darker (stencils stack light to dark)
    const m = new Float32Array(n);
    for (let i = 0; i < n; i++) m[i] = lab[i] >= c ? 1 : 0;
    const core = M.boxBlur(Float32Array.from(m), w, h, er, sft > 0.05 ? 2 : 1), halo = M.boxBlur(m, w, h, hr, 3);
    const out = new Uint8Array(n * 4), col = pal[c], lightest = c === 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4, fc = focus ? focus[i] : 1, t = core[i];
      const crisp = clamp(t * 1.6 - 0.3, 0, 1);
      const stip = Math.pow(t, 1.3) > dotG[(i + c * 7919) % n] ? 1 : 0;
      const fuzzy = 0.45 * smooth(0, 1, t) + 0.55 * stip * smooth(0, 0.35, t);
      let a = crisp * (1 - sft) + fuzzy * sft;
      const grain = dotG[(i + c * 104729) % n];
      const hg = halo[i] * (1 + (1 - fc) * (1 - outside)) * 0.55 * grain;
      a = Math.max(a, clamp(hg, 0, 0.6));
      if (lightest) a *= 0.8 * (1 - (Q.bare || 0) / 100);   // the wall reads through the first coat
      if (a <= 0.004) continue;
      out[p] = col[0]; out[p + 1] = col[1]; out[p + 2] = col[2]; out[p + 3] = Math.round(clamp(a, 0, 0.97) * 255);
    }
    layers.push({ name: "Can " + (c + 1), rgba: out, blend: "NORMAL" });
    await yieldFn();
  }
  const half = Math.floor(cans / 2);
  if (Q.halftone > 0) {
    prog("Halftone...");
    // a dot screen fading out from the darker coats, in their colours
    const ht = Q.halftone / 100, D = new Float32Array(n), CR = new Float32Array(n), CG = new Float32Array(n), CB = new Float32Array(n);
    for (let i = 0; i < n; i++) if (lab[i] >= half) { const c = pal[lab[i]]; D[i] = 1; CR[i] = c[0]; CG[i] = c[1]; CB[i] = c[2]; }
    const rh = Math.max(2, (10 + 45 * ht) * k);
    const Df = M.boxBlur(Float32Array.from(D), w, h, rh, 3), Rf = M.boxBlur(CR, w, h, rh, 3), Gf = M.boxBlur(CG, w, h, rh, 3), Bf = M.boxBlur(CB, w, h, rh, 3);
    const out = new Uint8Array(n * 4), cs = 13, s2 = Math.SQRT1_2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      if (D[i] || Df[i] < 0.02) continue;
      const ux = x / k, uy = y / k, u = (ux + uy) * s2 / cs, v = (ux - uy) * s2 / cs;
      const d = Math.hypot(u - Math.round(u), v - Math.round(v)) * cs;          // units to the dot centre
      const r = Math.sqrt(clamp(Df[i] * 1.8, 0, 1)) * cs * 0.55 * (0.4 + 0.6 * ht);
      const a = clamp((r - d) * k + 0.5, 0, 1);
      if (a <= 0.01) continue;
      const f = 1 / Df[i];
      out[p] = clamp(Rf[i] * f, 0, 255); out[p + 1] = clamp(Gf[i] * f, 0, 255); out[p + 2] = clamp(Bf[i] * f, 0, 255); out[p + 3] = Math.round(a * 235);
    }
    layers.push({ name: "Halftone", rgba: out, blend: "NORMAL" });
    await yieldFn();
  }
  const E = labelEdges(lab, w, h);
  if (Q.speckle > 0) {
    prog("Speckle and splats...");
    const out = new Uint8Array(n * 4), rnd = M.rng(seed * 811), sp = Q.speckle / 100, area = n / Math.max(0.01, k * k);
    const Eb = M.boxBlur(Float32Array.from(E), w, h, Math.max(1, hr), 2);
    const cnt = Math.min(40000, Math.round(sp * area * 0.0035 + sp * 80));
    for (let s = 0; s < cnt; s++) {
      const x = rnd() * w, y = rnd() * h, i = Math.min(n - 1, Math.floor(y) * w + Math.floor(x));
      if (rnd() > 0.25 + 0.75 * clamp(Eb[i] * 3, 0, 1)) continue;          // mostly near edges
      dot(out, w, h, x, y, Math.max(0.4, (1 + rnd() * 2.5) * k * 1.3), pal[lab[i]], 0.9);
    }
    // splats: a blob with flung droplets around it
    const splats = Math.round(sp * sp * 16 * area / 6e6);
    const sz = 0.6 + P.brush.size / 80;
    for (let s = 0; s < splats; s++) {
      const x = rnd() * w, y = rnd() * h, i = Math.min(n - 1, Math.floor(y) * w + Math.floor(x));
      const col = pal[Math.max(half, lab[i])], r = (8 + rnd() * 24) * k * sz;
      for (let b = 0; b < 5; b++) dot(out, w, h, x + (rnd() - 0.5) * r * 0.7, y + (rnd() - 0.5) * r * 0.7, r * (0.55 + rnd() * 0.35), col, 0.95);
      const drops = 8 + Math.floor(rnd() * 10);
      for (let d = 0; d < drops; d++) {
        const ang = rnd() * Math.PI * 2, dist = r * (1.2 + rnd() * 2.2), dr = Math.max(0.5, r * (0.05 + rnd() * 0.16));
        const ex = x + Math.cos(ang) * dist, ey = y + Math.sin(ang) * dist;
        dot(out, w, h, ex, ey, dr, col, 0.95);
        if (rnd() < 0.4) for (let t = 0.2; t < 0.9; t += 0.15) dot(out, w, h, x + Math.cos(ang) * dist * (1 - t * 0.35), y + Math.sin(ang) * dist * (1 - t * 0.35), dr * (1 - t) * 0.8, col, 0.9);
      }
    }
    layers.push({ name: "Speckle", rgba: out, blend: "NORMAL" });
    await yieldFn();
  }
  if (Q.drips > 0) {
    prog("Drips...");
    const out = new Uint8Array(n * 4), rnd = M.rng(seed * 1999), dr = Q.drips / 100;
    const cnt = Math.round(dr * 50 * Math.sqrt(n / Math.max(1, k * k)) / 400 + dr * 6);
    let made = 0;
    for (let tries = 0; tries < cnt * 600 && made < cnt; tries++) {   // edges are thin at full size: try harder
      const x = Math.floor(rnd() * w), y = Math.floor(rnd() * (h - 2));
      const i = y * w + x, c = lab[i];
      if (c < 1 || lab[i + w] >= c) continue;    // start at the lower edge of a coat
      if (c < half && rnd() < 0.6) continue;     // darker coats drip more
      made++;
      const col = pal[c], wd = Math.max(0.7, (3.5 + rnd() * 4) * k * (0.6 + P.brush.size / 80));
      const len = (Q.dripLength / 100) * (50 + rnd() * 300) * k;
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
  // Paint blend / opacity: the coats are flattened into one "Paint" layer so the
  // blend mode acts between the paint and the wall, not between coats
  const PB = { normal: "NORMAL", multiply: "MULTIPLY", linearburn: "LINEARBURN", overlay: "OVERLAY", softlight: "SOFTLIGHT", hardlight: "HARDLIGHT" }[Q.blend || "normal"] || "NORMAL";
  const pop = Q.paintOpacity == null ? 100 : clamp(Q.paintOpacity, 0, 100);
  if (PB !== "NORMAL" || pop < 100) {
    const coats = layers.splice(1), out = new Uint8Array(n * 4);
    for (const L of coats) {
      const s = L.rgba;
      for (let p = 0; p < n * 4; p += 4) {
        const a = s[p + 3] / 255;
        if (a <= 0) continue;
        const a0 = out[p + 3] / 255, na = a + a0 * (1 - a);
        for (let c = 0; c < 3; c++) out[p + c] = Math.round((s[p + c] * a + out[p + c] * a0 * (1 - a)) / na);
        out[p + 3] = Math.round(na * 255);
      }
    }
    layers.push({ name: "Paint", rgba: out, blend: PB, opacity: Math.round(pop) });
  }
  const hl = (Q.highlight || 0) / 100;
  if (Q.outline > 0 || hl > 0) {
    prog("Outline...");
    // only the strong steps between coats get the fat-cap line
    const S2 = new Float32Array(n), L = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = pal[lab[i]]; L[i] = lum(a[0], a[1], a[2]); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, la = L[i];
      let d = 0;
      if (x + 1 < w) d = Math.max(d, Math.abs(la - L[i + 1]));
      if (y + 1 < h) d = Math.max(d, Math.abs(la - L[i + w]));
      S2[i] = d > 45 ? 1 : 0;
    }
    const g = Q.outline / 100;
    const lw = Math.max(1, (2.4 + Math.max(g, 0.3) * 6) * k * 1.4), og = 4 * (2 * Math.max(1, Math.round(lw)) + 1) / 3, Ob = M.boxBlur(Float32Array.from(S2), w, h, lw, 2);
    const oa = new Float32Array(n);
    if (g > 0) {
      const out = new Uint8Array(n * 4);
      for (let i = 0, p = 0; i < n; i++, p += 4) {
        const a = clamp(Ob[i] * og - 0.25, 0, 1) * (0.55 + 0.45 * g);
        oa[i] = a;
        if (a <= 0.004) continue;
        out[p] = 18; out[p + 1] = 18; out[p + 2] = 20; out[p + 3] = Math.round(a * 255);
      }
      layers.push({ name: "Outline", rgba: out, blend: "NORMAL" });
    }
    if (hl > 0) {
      // a white edge on the lighter side of each strong step, beside the black line
      prog("Highlights...");
      const hw = lw * (g > 0 ? 2.7 : 1.4), Hb = M.boxBlur(Float32Array.from(S2), w, h, hw, 2), Lb = M.boxBlur(Float32Array.from(L), w, h, hw, 2);
      const hgain = 4 * (2 * Math.max(1, Math.round(hw)) + 1) / 3;
      const out = new Uint8Array(n * 4);
      for (let i = 0, p = 0; i < n; i++, p += 4) {
        if (L[i] < Lb[i] + 2) continue;
        const a = clamp(Hb[i] * hgain - 0.3, 0, 1) * (1 - oa[i]) * (0.35 + 0.6 * hl);
        if (a <= 0.01) continue;
        out[p] = 250; out[p + 1] = 248; out[p + 2] = 240; out[p + 3] = Math.round(a * 255);
      }
      layers.push({ name: "Highlights", rgba: out, blend: "NORMAL" });
    }
    await yieldFn();
  }
  const rv = (Q.relief == null ? 0 : Q.relief) / 100;
  if (rv > 0) {
    // the wall's bumps, joints and ribs read through every coat
    const out = new Uint8Array(n * 4), sh = wall.shade;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const v = clamp(128 + 127 * sh[i], 0, 255);
      out[p] = v; out[p + 1] = v; out[p + 2] = v; out[p + 3] = Math.round(255 * clamp(rv * 0.9, 0, 1));
    }
    layers.push({ name: "Wall relief", rgba: out, blend: "OVERLAY" });
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

module.exports = { paintInk, paintSpray, paintPastel, METALS, WALL_COLOURS, _wallLayer: wallLayer };
