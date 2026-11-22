"use strict";
// ======================================================================
// Paint Brew engine: Oil, Watercolour and Impressionism from a photo.
// Pure JS, no host calls, deterministic (seeded noise).
//
// Shared analysis: colour adjust -> edge-preserving abstraction (Kuwahara
// style, from box means) -> structure-tensor flow field + edge map.
// Oil and Impressionism paint real strokes along the flow, coarse to fine
// (each pass only where the canvas still differs from the photo), with
// bristle streaks and a paint height map. Watercolour builds washes, wet
// edges, granulation, pencil and splashes over a paper colour.
//
// Sizes are "px at 3000 px long side", so a 1200 px and a 3000 px photo,
// and the small preview, all get the same look.  k = real px per unit.
// src.focus (optional Float32Array 0..1) marks the subject.
// ======================================================================
const M = require("../core/imgmath.js");
const { clamp } = M;
const REF = 3000;

// ---------------------------------------------------------------- noise
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = M.hashNoise(xi, yi, seed), b = M.hashNoise(xi + 1, yi, seed), c = M.hashNoise(xi, yi + 1, seed), d = M.hashNoise(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function fbm(x, y, seed, oct) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) { s += amp * vnoise(x * f, y * f, seed + o * 131); norm += amp; amp *= 0.5; f *= 2.03; }
  return s / norm;
}

// ---------------------------------------------------------------- colour
function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 1e-6) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
  return [h, mx > 0 ? d / mx : 0, mx];
}
function hsv2rgb(h, s, v) {
  h = ((h % 1) + 1) % 1; s = clamp(s, 0, 1); v = clamp(v, 0, 1);
  const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const m = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
  return [m[0] * 255, m[1] * 255, m[2] * 255];
}
// saturation (%), warmth (-50..50) on float planes, in place
function adjustColour(R, G, B, n, sat, warm) {
  const s = 1 + sat / 100, wr = warm * 0.5, wb = -warm * 0.5;
  for (let i = 0; i < n; i++) {
    const l = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i];
    R[i] = clamp(l + (R[i] - l) * s + wr, 0, 255);
    G[i] = clamp(l + (G[i] - l) * s + warm * 0.1, 0, 255);
    B[i] = clamp(l + (B[i] - l) * s + wb, 0, 255);
  }
}
// small k-means palette from a subsample (deterministic)
function palette(R, G, B, n, count, rnd) {
  const S = Math.min(n, 4000), sx = [], sy = [], sz = [];
  for (let j = 0; j < S; j++) { const i = Math.floor(rnd() * n); sx.push(R[i]); sy.push(G[i]); sz.push(B[i]); }
  const C = [];
  for (let c = 0; c < count; c++) { const j = Math.floor((c + 0.5) / count * S); C.push([sx[j], sy[j], sz[j]]); }
  const asg = new Int32Array(S);
  for (let it = 0; it < 10; it++) {
    for (let j = 0; j < S; j++) asg[j] = nearest(C, sx[j], sy[j], sz[j]);
    const acc = C.map(() => [0, 0, 0, 0]);
    for (let j = 0; j < S; j++) { const a = acc[asg[j]]; a[0] += sx[j]; a[1] += sy[j]; a[2] += sz[j]; a[3]++; }
    acc.forEach((a, c) => { if (a[3]) C[c] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  return C;
}
function nearest(C, r, g, b) {
  let best = 0, bd = 1e12;
  for (let c = 0; c < C.length; c++) { const d = (C[c][0] - r) ** 2 + (C[c][1] - g) ** 2 + (C[c][2] - b) ** 2; if (d < bd) { bd = d; best = c; } }
  return best;
}

// ---------------------------------------------------------------- analysis
const blur = (f, w, h, r, p) => M.boxBlur(Float32Array.from(f), w, h, r, p || 3);
// Kuwahara-style abstraction: four quadrant means, weighted by 1/variance^2
function abstraction(R, G, B, w, h, rad) {
  rad = Math.max(1, Math.round(rad));
  const n = w * h, L = new Float32Array(n), L2 = new Float32Array(n);
  for (let i = 0; i < n; i++) { const l = 0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i]; L[i] = l; L2[i] = l * l; }
  const mR = M.boxBlur(Float32Array.from(R), w, h, rad, 1), mG = M.boxBlur(Float32Array.from(G), w, h, rad, 1), mB = M.boxBlur(Float32Array.from(B), w, h, rad, 1);
  const mL = M.boxBlur(L, w, h, rad, 1), mL2 = M.boxBlur(L2, w, h, rad, 1);
  const oR = new Float32Array(n), oG = new Float32Array(n), oB = new Float32Array(n);
  const off = [[-rad, -rad], [rad, -rad], [-rad, rad], [rad, rad]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sw = 0, r = 0, g = 0, b = 0;
    for (let q = 0; q < 4; q++) {
      const j = clamp(y + off[q][1], 0, h - 1) * w + clamp(x + off[q][0], 0, w - 1);
      const v = Math.max(0, mL2[j] - mL[j] * mL[j]) + 4;
      const wt = 1 / (v * v);
      sw += wt; r += mR[j] * wt; g += mG[j] * wt; b += mB[j] * wt;
    }
    const i = y * w + x;
    oR[i] = r / sw; oG[i] = g / sw; oB[i] = b / sw;
  }
  return [oR, oG, oB];
}
// flow field (edge tangent) + edge strength; flat areas follow a smooth noise field
function flowField(R, G, B, w, h, k, seed) {
  const n = w * h, L = new Float32Array(n);
  for (let i = 0; i < n; i++) L[i] = (0.299 * R[i] + 0.587 * G[i] + 0.114 * B[i]) / 255;
  M.boxBlur(L, w, h, Math.max(1, 1.5 * k), 2);
  const Exx = new Float32Array(n), Eyy = new Float32Array(n), Exy = new Float32Array(n), E = new Float32Array(n);
  const l = (x, y) => L[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gx = l(x + 1, y - 1) + 2 * l(x + 1, y) + l(x + 1, y + 1) - l(x - 1, y - 1) - 2 * l(x - 1, y) - l(x - 1, y + 1);
    const gy = l(x - 1, y + 1) + 2 * l(x, y + 1) + l(x + 1, y + 1) - l(x - 1, y - 1) - 2 * l(x, y - 1) - l(x + 1, y - 1);
    const i = y * w + x;
    Exx[i] = gx * gx; Eyy[i] = gy * gy; Exy[i] = gx * gy; E[i] = Math.hypot(gx, gy);
  }
  const tr = Math.max(1, 6 * k);
  M.boxBlur(Exx, w, h, tr, 3); M.boxBlur(Eyy, w, h, tr, 3); M.boxBlur(Exy, w, h, tr, 3);
  const TX = new Float32Array(n), TY = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, a = Exx[i], b = Eyy[i], c = Exy[i];
    const d = Math.sqrt((a - b) * (a - b) + 4 * c * c), sum = a + b + 1e-9;
    const coh = clamp(d / sum, 0, 1) * clamp(sum * 400, 0, 1);
    // gradient angle doubled; tangent = gradient + 90deg
    let c2 = (a - b) / (d + 1e-12), s2 = 2 * c / (d + 1e-12);
    c2 = -c2; s2 = -s2;
    const na = fbm(x / k / 420, y / k / 420, seed, 2) * Math.PI * 2;
    const nc = Math.cos(na), ns = Math.sin(na);
    const mc = c2 * coh + nc * (1 - coh), ms = s2 * coh + ns * (1 - coh);
    const ang = 0.5 * Math.atan2(ms, mc);
    TX[i] = Math.cos(ang); TY[i] = Math.sin(ang);
  }
  return { TX, TY, E };
}

// ---------------------------------------------------------------- strokes
// Paints strokes into a premultiplied float layer. Incremental "over" with a
// per-stroke mark buffer, so a stroke never darkens where its own segments overlap.
function makeLayerBuf(n) { return { P0: new Float32Array(n), P1: new Float32Array(n), P2: new Float32Array(n), PA: new Float32Array(n) }; }
function bufToRGBA(buf, n) {
  const out = new Uint8Array(n * 4);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const a = buf.PA[i];
    if (a <= 0.002) continue;
    out[p] = clamp(Math.round(buf.P0[i] / a), 0, 255); out[p + 1] = clamp(Math.round(buf.P1[i] / a), 0, 255); out[p + 2] = clamp(Math.round(buf.P2[i] / a), 0, 255); out[p + 3] = clamp(Math.round(a * 255), 0, 255);
  }
  return out;
}
function rasterStroke(ctx, buf, pts, rad, col, sid, st) {
  const { w, h, mark, cov, H } = ctx;
  const nSeg = Math.max(1, pts.length - 1), single = pts.length === 1;
  const nBr = st.bristles, seedB = sid * 7 + 3;
  const aa = Math.min(1, 1.2 / Math.max(0.5, rad));
  // per-bristle colour shift and dry-brush cut, per-segment edge wobble (precomputed for speed)
  const BN = new Float32Array(nBr + 1), CUT = new Float32Array(nBr + 1);
  for (let b = 0; b <= nBr; b++) { BN[b] = M.hashNoise(b, seedB, 5); CUT[b] = 1 - st.dry * (0.55 + 0.45 * M.hashNoise(b, seedB, 9)); }
  const segLen = new Float32Array(nSeg + 1);
  for (let j = 0; j < pts.length - 1; j++) segLen[j + 1] = segLen[j] + Math.hypot(pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]);
  for (let j = 0; j < nSeg; j++) {
    const wob = 1 + st.rough * vnoise((segLen[j] + segLen[j + 1]) * 0.5 / (rad * 0.9 + 1), sid, 11);
    const A = pts[j], Bp = single ? pts[0] : pts[j + 1];
    const ax = A[0], ay = A[1], dx = Bp[0] - ax, dy = Bp[1] - ay, len2 = dx * dx + dy * dy, len = Math.sqrt(len2) || 1;
    const R1 = rad * 1.15 + 1;
    const x0 = Math.max(0, Math.floor(Math.min(ax, Bp[0]) - R1)), x1 = Math.min(w - 1, Math.ceil(Math.max(ax, Bp[0]) + R1));
    const y0 = Math.max(0, Math.floor(Math.min(ay, Bp[1]) - R1)), y1 = Math.min(h - 1, Math.ceil(Math.max(ay, Bp[1]) + R1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x - ax, py = y - ay;
      const t0 = len2 > 0 ? (px * dx + py * dy) / len2 : 0;
      // flat brush: square-ish ends on the first and last segment (ragged by bristle), round joins inside
      let over = 0;
      if (!single && ((t0 < 0 && j === 0) || (t0 > 1 && j === nSeg - 1))) { over = (t0 < 0 ? -t0 : t0 - 1) * len / Math.max(0.5, rad); if (over > st.cap) continue; }
      const t = t0 < 0 ? 0 : t0 > 1 ? 1 : t0;
      const qx = px - dx * t, qy = py - dy * t;
      const dist = over > 0 ? Math.abs(dx * py - dy * px) / len : Math.sqrt(qx * qx + qy * qy);
      const side = (dx * py - dy * px) >= 0 ? 1 : -1;
      const u = single ? 0.5 : (j + t) / nSeg;
      const uu = u < 0 ? 0 : u > 1 ? 1 : u;
      const rr = rad * (0.86 + 0.56 * uu * (1 - uu)) * wob;
      const v = dist / rr;
      if (v >= 1) continue;
      let a = clamp((1 - v) / aa, 0, 1) * st.load;
      const bi = Math.min(nBr, Math.floor((side * v + 1) * 0.5 * nBr));
      const bn = BN[bi];
      if (over > 0) { const lim = st.cap * (0.725 + 0.275 * bn); if (over > lim) continue; a *= clamp((lim - over) * rad / 1.2, 0, 1); }
      if (st.dry > 0 && !single) { const cut = CUT[bi]; if (u > cut) a *= clamp(1 - (u - cut) * 12, 0, 1); }
      if (a <= 0.003) continue;
      const i = y * w + x;
      const bf = 1 + st.bristle * bn;
      const c0 = clamp(col[0] * bf, 0, 255), c1 = clamp(col[1] * bf, 0, 255), c2 = clamp(col[2] * bf, 0, 255);
      // flat-topped paint with a ridge pushed to the edges, streaked by bristles
      const hv = H ? st.thick * (0.62 + 0.38 * bn) * (v < 0.8 ? 0.7 + 0.45 * v * v : (1 - v) * 5 * 0.99) : 0;
      if (mark[i] === sid) {
        const a0 = cov[i];
        if (a <= a0 || a0 >= 0.999) continue;
        const f = (1 - a) / (1 - a0);
        buf.P0[i] = c0 + (buf.P0[i] - c0) * f; buf.P1[i] = c1 + (buf.P1[i] - c1) * f; buf.P2[i] = c2 + (buf.P2[i] - c2) * f; buf.PA[i] = 1 + (buf.PA[i] - 1) * f;
        if (H) H[i] = hv + (H[i] - hv) * f;
      } else {
        mark[i] = sid;
        const ia = 1 - a;
        buf.P0[i] = c0 * a + buf.P0[i] * ia; buf.P1[i] = c1 * a + buf.P1[i] * ia; buf.P2[i] = c2 * a + buf.P2[i] * ia; buf.PA[i] = a + buf.PA[i] * ia;
        if (H) H[i] = hv * a + H[i] * ia;
      }
      cov[i] = a;
    }
  }
}
// One coarse-to-fine pass (Hertzmann-style): a stroke goes wherever the
// canvas still differs from the reference by more than `thresh`.
async function strokePass(ctx, buf, ref, o, yieldFn) {
  const { w, h, TX, TY, canvas, focus } = ctx;
  const rnd = M.rng(o.seed);
  const cell = Math.max(1, Math.round(o.spacing));
  const gw = Math.ceil(w / cell), gh = Math.ceil(h / cell), order = new Int32Array(gw * gh);
  for (let i = 0; i < order.length; i++) order[i] = i;
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
  const [rR, rG, rB] = ref;
  let count = 0;
  for (let q = 0; q < order.length; q++) {
    const cx = (order[q] % gw) * cell, cy = Math.floor(order[q] / gw) * cell;
    let best = -1, bi = -1, sum = 0, cnt = 0;
    for (let y = cy; y < Math.min(h, cy + cell); y++) for (let x = cx; x < Math.min(w, cx + cell); x++) {
      const i = y * w + x;
      const e = canvas ? Math.abs(canvas[0][i] - rR[i]) + Math.abs(canvas[1][i] - rG[i]) + Math.abs(canvas[2][i] - rB[i]) : 0;
      sum += e; cnt++;
      if (e > best) { best = e; bi = i; }
    }
    if (bi < 0) continue;
    let px = bi % w, py = (bi / w) | 0;
    if (o.fillAll) { px = Math.min(w - 1, cx + Math.floor(rnd() * cell)); py = Math.min(h - 1, cy + Math.floor(rnd() * cell)); }
    const fc = focus ? focus[py * w + px] : 1;
    const th = o.thresh * (1 + (1 - fc) * o.outsideSuppress);
    if (!o.fillAll && sum / cnt < th) continue;
    const i0 = py * w + px;
    let col = [rR[i0], rG[i0], rB[i0]];
    if (o.colourFn) col = o.colourFn(col, rnd, px, py);
    const rad = o.radius * (1 + (1 - fc) * o.outsideGrow) * (0.85 + 0.3 * rnd());
    // trace along the flow
    const pts = [[px, py]];
    let dxp = TX[i0], dyp = TY[i0];
    if (o.jitter) { const ja = (rnd() - 0.5) * 2 * o.jitter; const c = Math.cos(ja), s = Math.sin(ja); const nx = dxp * c - dyp * s; dyp = dxp * s + dyp * c; dxp = nx; }
    if (rnd() < 0.5) { dxp = -dxp; dyp = -dyp; }
    let x = px, y = py;
    const steps = o.minLen + Math.floor(rnd() * (o.maxLen - o.minLen + 1));
    for (let s = 0; s < steps; s++) {
      const j = clamp(Math.round(y), 0, h - 1) * w + clamp(Math.round(x), 0, w - 1);
      let tx = TX[j], ty = TY[j];
      if (tx * dxp + ty * dyp < 0) { tx = -tx; ty = -ty; }
      let nx = dxp * (1 - o.follow) + tx * o.follow, ny = dyp * (1 - o.follow) + ty * o.follow;
      const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
      x += nx * rad * o.step; y += ny * rad * o.step;
      if (x < -rad || y < -rad || x > w + rad || y > h + rad) break;
      const k2 = clamp(Math.round(y), 0, h - 1) * w + clamp(Math.round(x), 0, w - 1);
      if (s >= o.stopAfter && Math.abs(rR[k2] - col[0]) + Math.abs(rG[k2] - col[1]) + Math.abs(rB[k2] - col[2]) > o.stopDiff) break;
      pts.push([x, y]); dxp = nx; dyp = ny;
    }
    // draw with every second traced point: same curve, about half the overdraw
    const dpts = pts.length > 3 ? pts.filter((q, qi) => qi % 2 === 0 || qi === pts.length - 1) : pts;
    rasterStroke(ctx, buf, dpts, rad, col, ++ctx.sid, o.style);
    if (++count % 400 === 0) await yieldFn();
  }
  return count;
}
// canvas = layer over canvas (straight colour)
function overCanvas(canvas, rgba, n) {
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const a = rgba[p + 3] / 255; if (!a) continue;
    canvas[0][i] += (rgba[p] - canvas[0][i]) * a; canvas[1][i] += (rgba[p + 1] - canvas[1][i]) * a; canvas[2][i] += (rgba[p + 2] - canvas[2][i]) * a;
  }
}
function opaque(R, G, B, n) { return M.toRGBA(R, G, B, null, n); }
// grey overlay layer from a height field (lit emboss); amp in grey levels
function litLayer(Hf, w, h, angleDeg, amp, extra) {
  const n = w * h, out = new Uint8Array(n * 4), a = angleDeg * Math.PI / 180, lx = Math.cos(a), ly = -Math.sin(a);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const gx = Hf[y * w + Math.min(w - 1, x + 1)] - Hf[y * w + Math.max(0, x - 1)];
    const gy = Hf[Math.min(h - 1, y + 1) * w + x] - Hf[Math.max(0, y - 1) * w + x];
    let v = 128 + (-(gx * lx + gy * ly)) * amp;
    if (extra) v += extra[i];
    v = clamp(Math.round(v), 0, 255);
    out[i * 4] = v; out[i * 4 + 1] = v; out[i * 4 + 2] = v; out[i * 4 + 3] = 255;
  }
  return out;
}
// woven canvas height (0..1) at unit coords; period in units
function weaveField(w, h, k, period, seed) {
  const n = w * h, F = new Float32Array(n), p = Math.max(1, period);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ux = x / k + 0.7 * fbm(x / k / 60, y / k / 60, seed, 2) * p, uy = y / k + 0.7 * fbm(x / k / 60 + 9, y / k / 60, seed, 2) * p;
    const cx = Math.floor(ux / p), cy = Math.floor(uy / p), fx = ux / p - cx, fy = uy / p - cy;
    const horiz = ((cx + cy) & 1) === 0;
    const thread = horiz ? Math.sin(Math.PI * fy) * (0.75 + 0.25 * Math.sin(Math.PI * fx)) : Math.sin(Math.PI * fx) * (0.75 + 0.25 * Math.sin(Math.PI * fy));
    F[y * w + x] = thread * (0.85 + 0.15 * M.hashNoise(cx, cy, seed));
  }
  return F;
}
// see-through pixels count as white (paper / bare canvas), so transparent PNGs paint cleanly
function opaquePlanes(src) {
  const pl = M.planes(src), n = src.w * src.h, A = pl.A;
  for (let i = 0; i < n; i++) if (A[i] < 255) { const t = A[i] / 255; pl.R[i] = pl.R[i] * t + 255 * (1 - t); pl.G[i] = pl.G[i] * t + 255 * (1 - t); pl.B[i] = pl.B[i] * t + 255 * (1 - t); }
  return pl;
}
function focusOf(src, n) { return src.focus && src.focus.length === n ? src.focus : null; }

// ---------------------------------------------------------------- styles
async function paintStrokes(src, P, hooks, kind) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const prog = (hooks && hooks.progress) || (() => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const fullLong = Math.max(P.fullW || w / sc, P.fullH || h / sc, 1);
  const k = Math.max(0.02, sc * fullLong / REF);
  const B = P.brush, C = P.colour, T = P.texture, seed = (P.seed | 0) + 1;
  prog("Analysing the photo...");
  const { R, G, B: Bl } = opaquePlanes(src);
  adjustColour(R, G, Bl, n, C.saturation, C.warmth);
  const rnd = M.rng(seed * 977);
  const pal = C.palette > 1 ? palette(R, G, Bl, n, C.palette, rnd) : null;
  await yieldFn();
  const flow = flowField(R, G, Bl, w, h, k, seed);
  await yieldFn();
  const focus = focusOf(src, n);
  const ctx = { w, h, TX: flow.TX, TY: flow.TY, focus, mark: new Int32Array(n), cov: new Float32Array(n), sid: 0, canvas: null, H: kind === "oil" ? new Float32Array(n) : null };
  const rad0 = Math.max(0.8, B.size * k);
  const simp = 0.25 + C.simplify / 100;
  const layers = [];
  // ground / underpainting
  prog("Underpainting...");
  let gR, gG, gB;
  if (kind === "oil") { [gR, gG, gB] = abstraction(R, G, Bl, w, h, rad0 * 0.6 * simp); }
  else {
    gR = blur(R, w, h, rad0 * 1.2); gG = blur(G, w, h, rad0 * 1.2); gB = blur(Bl, w, h, rad0 * 1.2);
    const tone = [196, 150, 96];
    for (let i = 0; i < n; i++) { gR[i] = gR[i] * 0.8 + tone[0] * 0.2; gG[i] = gG[i] * 0.8 + tone[1] * 0.2; gB[i] = gB[i] * 0.8 + tone[2] * 0.2; }
  }
  layers.push({ name: kind === "oil" ? "Underpainting" : "Ground", rgba: opaque(gR, gG, gB, n), blend: "NORMAL" });
  ctx.canvas = [Float32Array.from(gR), Float32Array.from(gG), Float32Array.from(gB)];
  await yieldFn();
  const jit = C.jitter / 100;
  const colourFn = (col) => {
    let c = col;
    if (pal) c = pal[nearest(pal, c[0], c[1], c[2])].slice();
    return c;
  };
  const brokenFn = (col, r) => {
    let c = pal ? pal[nearest(pal, col[0], col[1], col[2])] : col;
    const hsv = rgb2hsv(c[0], c[1], c[2]);
    return hsv2rgb(hsv[0] + (r() - 0.5) * 0.22 * jit, hsv[1] * (1 + 0.3 * jit) + (r() - 0.5) * 0.35 * jit, hsv[2] * (1 + (r() - 0.5) * 0.4 * jit));
  };
  const style = kind === "oil"
    ? { bristles: 7 + Math.round(B.size / 6), bristle: 0.06 + T.bristle / 100 * 0.18, rough: 0.12, dry: 0.12 + B.randomness / 100 * 0.2, load: 1, thick: 1, cap: 0.35 }
    : { bristles: 5, bristle: 0.04 + T.bristle / 100 * 0.12, rough: 0.2, dry: 0.05, load: 0.96, thick: 1, cap: 0.6 };
  const passes = clamp(Math.round(B.detail), 1, 4);
  const follow = B.follow / 100;
  const fOut = P.focus.outside / 100;      // detail kept outside focus (100 = same as inside)
  const groups = kind === "oil" ? [["Broad strokes", [0]], ["Detail strokes", [1, 2, 3]]]
    : [["Large dabs", [0]], ["Medium dabs", [1]], ["Fine detail", [2, 3]]];
  for (const [gname, idxs] of groups) {
    const use = idxs.filter((p) => p < passes);
    if (!use.length) continue;
    const buf = makeLayerBuf(n);
    for (const p of use) {
      prog(gname + " (pass " + (p + 1) + " of " + passes + ")...");
      const minR = (kind === "oil" ? 5 : 4) * k;
      if (p > 0 && rad0 * Math.pow(kind === "oil" ? 0.5 : 0.55, p - 1) <= minR * 1.05) continue;   // already at the finest useful size
      const r = Math.max(0.6, minR, rad0 * Math.pow(kind === "oil" ? 0.5 : 0.55, p));
      const refAbs = abstraction(R, G, Bl, w, h, Math.max(1, r * 0.5 * simp));
      await yieldFn();
      const o = kind === "oil"
        ? { seed: seed * 31 + p, radius: r, spacing: r * (p === 0 ? 1.1 : 1.0), fillAll: p === 0, thresh: 30 + 12 * p, minLen: Math.max(3, Math.round((p === 0 ? 6 : 4) * B.length)),
            maxLen: Math.max(4, Math.round((p === 0 ? 14 : 10) * B.length)), step: 0.6, follow, jitter: B.randomness / 100 * 0.5, stopAfter: Math.max(3, Math.round(5 * B.length)), stopDiff: 90 + 50 * (1 - p / 3),
            outsideSuppress: (1 - fOut) * 3, outsideGrow: (1 - fOut) * 0.8, colourFn, style: Object.assign({}, style, { thick: 1 - p * 0.18 }) }
        : { seed: seed * 31 + p, radius: r, spacing: r * 1.05, fillAll: p === 0, thresh: 34 + 10 * p, minLen: Math.max(1, Math.round(2 * B.length)), maxLen: Math.max(2, Math.round(3.2 * B.length)),
            step: 0.8, follow: follow * 0.6, jitter: 0.35 + B.randomness / 100 * 0.9, stopAfter: 1, stopDiff: 200,
            outsideSuppress: (1 - fOut) * 3, outsideGrow: (1 - fOut) * 0.7, colourFn: brokenFn, style };
      await strokePass(ctx, buf, refAbs, o, yieldFn);
    }
    const rgba = bufToRGBA(buf, n);
    overCanvas(ctx.canvas, rgba, n);
    layers.push({ name: gname, rgba, blend: "NORMAL" });
    await yieldFn();
  }
  prog("Texture...");
  const weaveAmt = T.canvas / 100;
  let weave = null;
  if (weaveAmt > 0) weave = weaveField(w, h, k, T.canvasScale, seed + 5);
  if (kind === "oil" && T.impasto > 0) {
    const Hs = M.boxBlur(ctx.H, w, h, Math.max(1, 0.8 * k), 2);
    layers.push({ name: "Impasto light", rgba: litLayer(Hs, w, h, T.light, T.impasto / 100 * 260 / Math.max(0.6, k * 1.2)), blend: "OVERLAY" });
  }
  if (kind === "impressionism" && T.lift > 0) {
    const out = new Uint8Array(n * 4), a = Math.round(T.lift / 100 * 255), cv = ctx.canvas;
    const shadow = [70, 80, 190], light = [255, 214, 140];
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const l = (0.299 * cv[0][i] + 0.587 * cv[1][i] + 0.114 * cv[2][i]) / 255, t = l * l * (3 - 2 * l);
      out[p] = shadow[0] + (light[0] - shadow[0]) * t; out[p + 1] = shadow[1] + (light[1] - shadow[1]) * t; out[p + 2] = shadow[2] + (light[2] - shadow[2]) * t; out[p + 3] = a;
    }
    layers.push({ name: "Light and colour lift", rgba: out, blend: "SOFTLIGHT" });
  }
  if (weave) {
    const Hf = new Float32Array(n), amp = weaveAmt * 90;
    for (let i = 0; i < n; i++) Hf[i] = weave[i] * (ctx.H ? 1 - 0.75 * clamp(ctx.H[i], 0, 1) : 1);
    layers.push({ name: "Canvas weave", rgba: litLayer(Hf, w, h, T.light, amp, null), blend: "OVERLAY" });
  }
  return { w, h, layers, notes: [] };
}

async function paintWatercolour(src, P, hooks) {
  const yieldFn = (hooks && hooks.yield) || (async () => {});
  const prog = (hooks && hooks.progress) || (() => {});
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale;
  const fullLong = Math.max(P.fullW || w / sc, P.fullH || h / sc, 1);
  const k = Math.max(0.02, sc * fullLong / REF);
  const B = P.brush, C = P.colour, W = P.water, seed = (P.seed | 0) + 1;
  prog("Analysing the photo...");
  const { R, G, B: Bl } = opaquePlanes(src);
  adjustColour(R, G, Bl, n, C.saturation, C.warmth);
  const rad0 = Math.max(0.8, B.size * k), simp = 0.25 + C.simplify / 100;
  let [aR, aG, aB] = abstraction(R, G, Bl, w, h, rad0 * 0.5 * simp);
  [aR, aG, aB] = abstraction(aR, aG, aB, w, h, rad0 * 0.3 * simp);
  await yieldFn();
  if (C.palette > 1) {
    const pal = palette(aR, aG, aB, n, C.palette, M.rng(seed * 977));
    for (let i = 0; i < n; i++) { const c = pal[nearest(pal, aR[i], aG[i], aB[i])]; aR[i] = aR[i] * 0.35 + c[0] * 0.65; aG[i] = aG[i] * 0.35 + c[1] * 0.65; aB[i] = aB[i] * 0.35 + c[2] * 0.65; }
  }
  // bleed: wobble the sampling position with low-frequency noise
  prog("Washes...");
  const bl = W.bleed * k, wR = new Float32Array(n), wG = new Float32Array(n), wB = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ux = x / k, uy = y / k;
    const sx = clamp(Math.round(x + bl * fbm(ux / 90, uy / 90, seed + 1, 3)), 0, w - 1), sy = clamp(Math.round(y + bl * fbm(ux / 90 + 5.3, uy / 90, seed + 2, 3)), 0, h - 1);
    const j = sy * w + sx, i = y * w + x;
    wR[i] = aR[j]; wG[i] = aG[j]; wB[i] = aB[j];
  }
  const br = Math.max(1, bl * 0.25);
  M.boxBlur(wR, w, h, br, 2); M.boxBlur(wG, w, h, br, 2); M.boxBlur(wB, w, h, br, 2);
  await yieldFn();
  // fade to paper away from the subject
  const focus = focusOf(src, n), fade = W.fade / 100, F = new Float32Array(n);
  const fall = Math.max(1, P.focus.falloff * k);
  if (focus) {
    for (let i = 0; i < n; i++) F[i] = focus[i];
    M.boxBlur(F, w, h, fall, 3);
  } else {
    for (let i = 0; i < n; i++) F[i] = 1;
  }
  const outside = P.focus.outside / 100;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, nx = (x / w - 0.5) * 2, ny = (y / h - 0.5) * 2;
    const r = Math.sqrt(nx * nx * 0.9 + ny * ny * 0.9) + 0.35 * fbm(x / k / 260, y / k / 260, seed + 3, 4);
    const vig = 1 - clamp((r - (1.15 - fade * 0.75)) / 0.28, 0, 1);
    let f = focus ? (F[i] + (1 - F[i]) * outside) : 1;
    f = Math.min(f, fade > 0 ? vig : 1);
    F[i] = clamp(f, 0, 1);
  }
  const dens = W.density / 100, paper = M.hexToRgb(W.paperColour);
  const washR = new Float32Array(n), washG = new Float32Array(n), washB = new Float32Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const d = dens * F[i] * (0.82 + 0.3 * fbm(x / k / 140, y / k / 140, seed + 4, 3));
    washR[i] = clamp(255 - (255 - wR[i] * 255 / Math.max(1, paper[0])) * d, 0, 255);
    washG[i] = clamp(255 - (255 - wG[i] * 255 / Math.max(1, paper[1])) * d, 0, 255);
    washB[i] = clamp(255 - (255 - wB[i] * 255 / Math.max(1, paper[2])) * d, 0, 255);
  }
  const layers = [];
  layers.push({ name: "Washes", rgba: opaque(washR, washG, washB, n), blend: "MULTIPLY" });
  await yieldFn();
  // wet edges: pigment pools where the wash changes
  if (W.wetEdge > 0) {
    prog("Wet edges...");
    const er = Math.max(1, 2.2 * k), Lw = new Float32Array(n);
    for (let i = 0; i < n; i++) Lw[i] = 0.299 * washR[i] + 0.587 * washG[i] + 0.114 * washB[i];
    const Lb = blur(Lw, w, h, er, 2), out = new Uint8Array(n * 4), g = W.wetEdge / 100 * 0.07;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const e = clamp((Lb[i] - Lw[i]) * g * 3, 0, 1) + clamp(Math.abs(Lb[i] - Lw[i]) * g, 0, 0.6);
      out[p] = washR[i] * washR[i] / 255; out[p + 1] = washG[i] * washG[i] / 255; out[p + 2] = washB[i] * washB[i] / 255; out[p + 3] = Math.round(clamp(e, 0, 1) * 255);
    }
    layers.push({ name: "Wet edges", rgba: out, blend: "MULTIPLY" });
    await yieldFn();
  }
  if (W.granulation > 0) {
    prog("Granulation...");
    const out = new Uint8Array(n * 4), g = W.granulation / 100;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      const pig = 1 - (0.299 * washR[i] + 0.587 * washG[i] + 0.114 * washB[i]) / 255;
      const nz = 0.5 + 0.5 * fbm(x / k / 2.2, y / k / 2.2, seed + 6, 2);
      const v = clamp(255 - g * pig * nz * nz * 150, 0, 255);
      out[p] = v; out[p + 1] = v; out[p + 2] = v * 0.98; out[p + 3] = 255;
    }
    layers.push({ name: "Granulation", rgba: out, blend: "MULTIPLY" });
    await yieldFn();
  }
  if (W.pencil > 0) {
    prog("Pencil...");
    const L = new Float32Array(n);
    for (let i = 0; i < n; i++) L[i] = 0.299 * R[i] + 0.587 * G[i] + 0.114 * Bl[i];
    const s1 = blur(L, w, h, Math.max(1, 1.2 * k), 2), s2 = blur(L, w, h, Math.max(1, 2.4 * k), 2);
    const out = new Uint8Array(n * 4), st = W.pencil / 100;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      const d = s2[i] - s1[i];
      let line = clamp((d - 2.5) / 7, 0, 1);
      line *= 0.55 + 0.45 * (0.5 + 0.5 * fbm(x / k / 3 + y / k / 9, y / k / 3, seed + 7, 2));
      const vis = clamp(F[i] * 1.6 + 0.15, 0, 1);
      const v = 255 - st * line * vis * 170;
      out[p] = v; out[p + 1] = v; out[p + 2] = clamp(v + 4, 0, 255); out[p + 3] = 255;
    }
    layers.push({ name: "Pencil", rgba: out, blend: "MULTIPLY" });
    await yieldFn();
  }
  if (W.splashes > 0) {
    prog("Splashes...");
    const out = new Uint8Array(n * 4), rnd = M.rng(seed * 4099);
    const cnt = Math.round(W.splashes);
    for (let s = 0; s < cnt; s++) {
      // prefer the soft boundary of the painting
      let cx = 0, cy = 0;
      for (let tries = 0; tries < 12; tries++) {
        cx = rnd() * w; cy = rnd() * h;
        const f = F[Math.floor(cy) * w + Math.floor(cx)];
        if (f > 0.15 && f < 0.85) break;
      }
      const j = Math.floor(cy) * w + Math.floor(cx);
      const hsv = rgb2hsv(aR[j], aG[j], aB[j]);
      const col = hsv2rgb(hsv[0], Math.min(1, hsv[1] * 1.3 + 0.15), Math.min(1, hsv[2] * 0.95 + 0.05));
      const rs = W.splashSize * k * (0.5 + rnd());
      const blobs = [[cx, cy, rs]];
      const nd = 6 + Math.floor(rnd() * 14);
      for (let d = 0; d < nd; d++) { const a = rnd() * Math.PI * 2, dist = rs * (1.1 + rnd() * 2.2); blobs.push([cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, rs * (0.04 + rnd() * 0.16)]); }
      const sd = seed * 13 + s;
      for (const [bx, by, br0] of blobs) {
        const R1 = br0 * 1.4 + 1;
        for (let y = Math.max(0, Math.floor(by - R1)); y <= Math.min(h - 1, Math.ceil(by + R1)); y++)
          for (let x = Math.max(0, Math.floor(bx - R1)); x <= Math.min(w - 1, Math.ceil(bx + R1)); x++) {
            const dx = x - bx, dy = y - by, dist = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
            const rr = br0 * (1 + 0.3 * fbm(Math.cos(ang) * 2 + sd, Math.sin(ang) * 2, sd, 3));
            if (dist >= rr) continue;
            const t = dist / rr, a = clamp((1 - t) * rr / 1.2, 0, 1) * (0.55 + 0.45 * t * t) * 0.85;
            const p = (y * w + x) * 4, a0 = out[p + 3] / 255, na = a + a0 * (1 - a);
            if (na <= 0) continue;
            for (let c = 0; c < 3; c++) out[p + c] = clamp(Math.round((col[c] * a + out[p + c] * a0 * (1 - a)) / na), 0, 255);
            out[p + 3] = Math.round(na * 255);
          }
      }
    }
    layers.push({ name: "Splashes", rgba: out, blend: "MULTIPLY" });
  }
  if (W.paperTexture > 0) {
    prog("Paper texture...");
    const Hf = new Float32Array(n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) Hf[y * w + x] = fbm(x / k / 7, y / k / 7, seed + 8, 3) * 0.7 + fbm(x / k / 1.8, y / k / 1.8, seed + 9, 2) * 0.3;
    layers.push({ name: "Paper texture", rgba: litLayer(Hf, w, h, 135, W.paperTexture / 100 * 140 / Math.max(0.6, k), null), blend: "OVERLAY" });
  }
  return { w, h, layers, paper, notes: [] };
}

async function render(src, P, hooks) {
  if (P.style === "watercolour") return paintWatercolour(src, P, hooks);
  return paintStrokes(src, P, hooks, P.style === "impressionism" ? "impressionism" : "oil");
}
// preview: paper (if any) under the layers
function composite(res, bg, src) {
  if (!res.paper) return M.composite(res, bg, src);
  const n = res.w * res.h, rgba = new Uint8Array(n * 4);
  for (let i = 0, p = 0; i < n; i++, p += 4) { rgba[p] = res.paper[0]; rgba[p + 1] = res.paper[1]; rgba[p + 2] = res.paper[2]; rgba[p + 3] = 255; }
  return M.composite({ w: res.w, h: res.h, layers: [{ rgba, blend: "NORMAL" }].concat(res.layers) }, bg, src);
}
// a photo-like demo: sky, hills, a sun, a tree and a red house
function demoImage(w, h) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = x / w, fy = y / h, i = (y * w + x) * 4;
    let r = 90 + 80 * fy, g = 150 + 60 * fy, b = 230 - 30 * fy;
    const hill = 0.62 + 0.06 * Math.sin(fx * 7) + 0.03 * Math.sin(fx * 19);
    if (fy > hill) { const t = (fy - hill) * 3; r = 70 + 60 * t + 30 * Math.sin(fx * 40 + fy * 20); g = 140 - 20 * t; b = 60; }
    const sd = Math.hypot(fx - 0.78, fy - 0.22);
    if (sd < 0.07) { r = 255; g = 230; b = 140; } else if (sd < 0.16) { const t = 1 - (sd - 0.07) / 0.09; r += (255 - r) * t * 0.5; g += (220 - g) * t * 0.5; b += (160 - b) * t * 0.3; }
    const td = Math.hypot((fx - 0.25) * 1.3, fy - 0.42);
    if (td < 0.16) { r = 40 + 30 * Math.sin(fx * 90); g = 110 + 40 * Math.sin(fy * 70); b = 50; }
    if (fx > 0.235 && fx < 0.265 && fy > 0.5 && fy < 0.72) { r = 90; g = 60; b = 35; }
    if (fx > 0.48 && fx < 0.66 && fy > 0.52 && fy < 0.74) { r = 200; g = 50; b = 40; if (fx > 0.54 && fx < 0.58 && fy > 0.62) { r = 70; g = 40; b = 30; } }
    if (fy > 0.43 && fy <= 0.52 && Math.abs(fx - 0.57) < (fy - 0.43) * 1.1) { r = 120; g = 70; b = 60; }
    data[i] = clamp(r, 0, 255); data[i + 1] = clamp(g, 0, 255); data[i + 2] = clamp(b, 0, 255); data[i + 3] = 255;
  }
  return { w, h, c: 4, data };
}

module.exports = { render, composite, demoImage, _internal: { vnoise, fbm, abstraction, flowField, rgb2hsv, hsv2rgb, weaveField } };
