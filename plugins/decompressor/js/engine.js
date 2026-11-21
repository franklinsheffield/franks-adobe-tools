"use strict";
// Decompressor engine: deliberate digital decay. Real 8x8 DCT quantisation
// (JPEG tables, repeated generations), chroma subsampling, bit crush,
// macroblock datamosh and glitch slices. Seeded, so results repeat.
const M = require("../core/imgmath.js");
const { clamp } = M;

const QY = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
const QC = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99].concat(new Array(32).fill(99));
function qTable(base, quality) {
  const q = clamp(quality, 1, 100), s = q < 50 ? 5000 / q : 200 - 2 * q;
  return base.map((v) => clamp(Math.floor((v * s + 50) / 100), 1, 255));
}
const COS = new Float32Array(64);
for (let x = 0; x < 8; x++) for (let u = 0; u < 8; u++) COS[x * 8 + u] = Math.cos((2 * x + 1) * u * Math.PI / 16) * (u === 0 ? Math.SQRT1_2 : 1) / 2;

// quantise one plane in place through DCT -> round(coef / q) * q -> IDCT
function dctPlane(P, w, h, qt, shift) {
  const blk = new Float32Array(64), tmp = new Float32Array(64), co = new Float32Array(64);
  for (let by = -shift; by < h; by += 8) for (let bx = -shift; bx < w; bx += 8) {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) blk[y * 8 + x] = P[clamp(by + y, 0, h - 1) * w + clamp(bx + x, 0, w - 1)] - 128;
    for (let y = 0; y < 8; y++) for (let u = 0; u < 8; u++) { let s = 0; for (let x = 0; x < 8; x++) s += blk[y * 8 + x] * COS[x * 8 + u]; tmp[y * 8 + u] = s; }
    for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) { let s = 0; for (let y = 0; y < 8; y++) s += tmp[y * 8 + u] * COS[y * 8 + v]; const q = qt[v * 8 + u]; co[v * 8 + u] = Math.round(s / q) * q; }
    for (let u = 0; u < 8; u++) for (let y = 0; y < 8; y++) { let s = 0; for (let v = 0; v < 8; v++) s += co[v * 8 + u] * COS[y * 8 + v]; tmp[y * 8 + u] = s; }
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const yy = by + y, xx = bx + x;
      if (yy < 0 || xx < 0 || yy >= h || xx >= w) continue;
      let s = 0; for (let u = 0; u < 8; u++) s += tmp[y * 8 + u] * COS[x * 8 + u];
      P[yy * w + xx] = clamp(s + 128, 0, 255);
    }
  }
}

async function render(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const { R, G, B, A } = M.planes(src);
  const R0 = Float32Array.from(R), G0 = Float32Array.from(G), B0 = Float32Array.from(B);
  const Y = new Float32Array(n), Cb = new Float32Array(n), Cr = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    Y[i] = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i];
    Cb[i] = 128 - 0.168736 * R[i] - 0.331264 * G[i] + 0.5 * B[i];
    Cr[i] = 128 + 0.5 * R[i] - 0.418688 * G[i] - 0.081312 * B[i];
  }
  // chroma subsampling: average over cells, then hold (blocky colour bleed)
  const cs = P.jpeg.chroma, cw = cs === "411" ? 4 : cs === "420" ? 2 : 1, ch = cs === "420" ? 2 : 1;
  if (cw > 1 || ch > 1) for (const C of [Cb, Cr]) for (let y = 0; y < h; y += ch) for (let x = 0; x < w; x += cw) {
    let s = 0, k = 0;
    for (let yy = y; yy < Math.min(h, y + ch); yy++) for (let xx = x; xx < Math.min(w, x + cw); xx++) { s += C[yy * w + xx]; k++; }
    s /= k;
    for (let yy = y; yy < Math.min(h, y + ch); yy++) for (let xx = x; xx < Math.min(w, x + cw); xx++) C[yy * w + xx] = s;
  }
  // JPEG generations (alternate a 1-2 px grid shift so loss accumulates)
  if (P.jpeg.on) {
    const qy = qTable(QY, P.jpeg.quality), qc = qTable(QC, P.jpeg.quality);
    for (let g = 0; g < P.jpeg.generations; g++) {
      const shift = g % 3;
      dctPlane(Y, w, h, qy, shift); await yieldFn();
      dctPlane(Cb, w, h, qc, shift); dctPlane(Cr, w, h, qc, shift); await yieldFn();
    }
  }
  for (let i = 0; i < n; i++) {
    const y = Y[i], cb = Cb[i] - 128, cr = Cr[i] - 128;
    R[i] = y + 1.402 * cr; G[i] = y - 0.344136 * cb - 0.714136 * cr; B[i] = y + 1.772 * cb;
  }
  // bit crush
  if (P.crush.bits < 8) {
    const lv = Math.pow(2, P.crush.bits) - 1;
    for (const C of [R, G, B]) for (let i = 0; i < n; i++) C[i] = Math.round(clamp(C[i], 0, 255) / 255 * lv) / lv * 255;
  }
  const rnd = M.rng(P.glitch.seed * 7919 + 1);
  // datamosh: blocks drag their content along a direction
  if (P.mosh.amount > 0) {
    const bs = Math.max(2, Math.round(P.mosh.block * sc)), ang = P.mosh.dir * Math.PI / 180;
    const dx = Math.round(Math.cos(ang) * bs), dy = Math.round(-Math.sin(ang) * bs);
    const nbx = Math.ceil(w / bs), nby = Math.ceil(h / bs);
    for (let by = 0; by < nby; by++) for (let bx = 0; bx < nbx; bx++) {
      if (rnd() > P.mosh.amount / 100) continue;
      const steps = 1 + Math.floor(rnd() * 6);
      for (let s = 1; s <= steps; s++) {
        const ox = bx * bs + dx * s, oy = by * bs + dy * s;
        for (let y = 0; y < bs; y++) for (let x = 0; x < bs; x++) {
          const sx = bx * bs + x, sy = by * bs + y, tx = ox + x, ty = oy + y;
          if (sx >= w || sy >= h || tx < 0 || ty < 0 || tx >= w || ty >= h) continue;
          const si = sy * w + sx, ti = ty * w + tx;
          R[ti] = R[si]; G[ti] = G[si]; B[ti] = B[si];
        }
      }
    }
    await yieldFn();
  }
  // glitch slices: horizontal bands shifted sideways (wrap around)
  const fullH = P.fullH || h;
  for (let k = 0; k < P.glitch.slices; k++) {
    const y0 = Math.floor(rnd() * h), bh = Math.max(1, Math.round((2 + rnd() * 0.04 * fullH) * sc));
    const off = Math.round((rnd() * 2 - 1) * P.glitch.offset * sc);
    if (!off) continue;
    const row = new Float32Array(w * 3);
    for (let y = y0; y < Math.min(h, y0 + bh); y++) {
      for (let x = 0; x < w; x++) { const i = y * w + x; row[x * 3] = R[i]; row[x * 3 + 1] = G[i]; row[x * 3 + 2] = B[i]; }
      for (let x = 0; x < w; x++) { const sx = ((x - off) % w + w) % w, i = y * w + x; R[i] = row[sx * 3]; G[i] = row[sx * 3 + 1]; B[i] = row[sx * 3 + 2]; }
    }
  }
  const mix = P.finish.mix / 100;
  if (mix < 1) for (let i = 0; i < n; i++) { R[i] = R0[i] + (R[i] - R0[i]) * mix; G[i] = G0[i] + (G[i] - G0[i]) * mix; B[i] = B0[i] + (B[i] - B0[i]) * mix; }
  return { w, h, layers: [{ name: "Decompressed", rgba: M.toRGBA(R, G, B, A, n), blend: "NORMAL" }], notes: [] };
}

module.exports = { render, composite: M.composite, demoImage: M.demoImage, _internal: { qTable, dctPlane } };
