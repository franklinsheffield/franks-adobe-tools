"use strict";
// ======================================================================
// Chrometone engine (pure JS, no host calls): turns an image into liquid
// chrome / metal.  luminance -> pre-blur -> tone -> bands -> metal gradient
// -> relief shading + specular shine -> grain / bloom / source mix.
// Sizes are in document pixels and scaled by P.scale so the preview of a
// downscaled image matches the full-size Apply.
// ======================================================================

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const FX = require("./fx.js");
const HEX_RE = /^#?[0-9a-f]{6}$/i;
function hexToRgb(h) { h = String(h).replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function isHex(h) { return HEX_RE.test(String(h)); }

// separable box blur, run `passes` times (3 passes ~ gaussian); in place
function boxBlur(f, w, h, r, passes) {
  r = Math.round(r);
  if (r < 1) return f;
  const tmp = new Float32Array(Math.max(w, h));
  for (let p = 0; p < (passes || 2); p++) {
    for (let y = 0; y < h; y++) {                 // horizontal
      const o = y * w; let acc = 0;
      for (let x = -r; x <= r; x++) acc += f[o + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        tmp[x] = acc / (2 * r + 1);
        acc += f[o + Math.min(x + r + 1, w - 1)] - f[o + Math.max(x - r, 0)];
      }
      for (let x = 0; x < w; x++) f[o + x] = tmp[x];
    }
    for (let x = 0; x < w; x++) {                 // vertical
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += f[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        tmp[y] = acc / (2 * r + 1);
        acc += f[Math.min(y + r + 1, h - 1) * w + x] - f[Math.max(y - r, 0) * w + x];
      }
      for (let y = 0; y < h; y++) f[y * w + x] = tmp[y];
    }
  }
  return f;
}

// 256-entry RGB lookup from gradient stops [{p:0..100, c:"#RRGGBB"}]
function gradientLUT(stops) {
  const s = (stops || []).filter((x) => x && isHex(x.c)).map((x) => ({ p: clamp(Number(x.p) || 0, 0, 100) / 100, c: hexToRgb(x.c) }))
    .sort((a, b) => a.p - b.p);
  if (!s.length) s.push({ p: 0, c: [0, 0, 0] }, { p: 1, c: [255, 255, 255] });
  const lut = new Float32Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = s[0], b = s[s.length - 1];
    for (let k = 0; k < s.length - 1; k++) if (t >= s[k].p && t <= s[k + 1].p) { a = s[k]; b = s[k + 1]; break; }
    let u = b.p > a.p ? (t - a.p) / (b.p - a.p) : 0;
    if (t <= s[0].p) { a = b = s[0]; u = 0; } else if (t >= s[s.length - 1].p) { a = b = s[s.length - 1]; u = 0; }
    for (let ch = 0; ch < 3; ch++) lut[i * 3 + ch] = a.c[ch] + (b.c[ch] - a.c[ch]) * u;
  }
  return lut;
}

function bandShape(v, shape, soft) {
  const f = v - Math.floor(v);
  if (shape === "triangle") return 1 - Math.abs(2 * f - 1);
  if (shape === "hard") {
    const e = Math.max(0.001, soft * 0.25);      // softness widens the edge
    const a = clamp((f - 0.5 + e) / (2 * e), 0, 1), b = clamp((f - 1 + e) / (2 * e), 0, 1) + clamp((e - f) / (2 * e), 0, 1);
    return clamp(a - b + (f < e ? 0 : 0), 0, 1);
  }
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * v);  // sine
}

// deterministic per-pixel noise in [-1, 1] (same settings = same pixels)
function hashNoise(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177 | 0;
  return (((n ^ (n >>> 16)) >>> 0) / 4294967295) * 2 - 1;
}


// ---------------------------------------------------------------- 1.1: outline face
// Bevel from the distance to the shape's edge; colour from a reflection that
// follows the surface tilt (Gradient: through the metal stops, Horizon: sky /
// wavy horizon / ground); same Lambert + Blinn lighting as the classic relief.
async function outlineFace(M, w, h, P, sc, yieldFn) {
  const n = w * h, surf = P.surface, rel = P.relief;
  const D = FX.insideDistance(M, w, h);
  const bw = Math.max(1, surf.bevel * sc);
  const H = FX.bevelHeight(D, n, bw, surf.profile);
  boxBlur(H, w, h, Math.max(1, rel.soft * sc * 0.5), 2);
  await yieldFn();
  const bb = FX.bbox(M, w, h), bh = Math.max(1, bb.b - bb.t + 1), bwd = Math.max(1, bb.r - bb.l + 1);
  const depth = rel.depth / 100, tilt = 0.4 + 1.6 * depth;
  const az = rel.angle * Math.PI / 180, el = 50 * Math.PI / 180;
  const lx = Math.cos(az) * Math.cos(el), ly = -Math.sin(az) * Math.cos(el), lz = Math.sin(el);
  let hx = lx, hy = ly, hz = lz + 1; const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
  const shin = 4 + rel.gloss * 1.2, sAmt = rel.spec / 100;
  const horizon = surf.reflect === "horizon";
  const lut = gradientLUT(P.look.stops), sky = gradientLUT(surf.sky), ground = gradientLUT(surf.ground);
  const bands = P.bands, bc = bands.count, bph = bands.phase / 360, bmix = bands.mix / 100, bsoft = bands.soft / 100, inv = !!P.look.invert;
  const amp = surf.wave / 100 * 0.14, freq = 1.5 + surf.waveSize / 100 * 10, hz0 = surf.horizon / 100, e = 1.2 / bh;
  // 3.0 desert chrome (Frank's reference video 2026-11-25): horizon shapes, bend to the letters, bevel gradient
  const shape = surf.hshape || "hills";
  const hline = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const fx = (x - bb.l) / bwd;
    let v;
    if (shape === "mountains") v = -1.6 * (Math.abs(FX.noise1(fx * freq * 0.8, 7)) * 0.75 + Math.abs(FX.noise1(fx * freq * 2.1, 13)) * 0.35) + 0.6;
    else if (shape === "angled") v = (fx - 0.5) * 1.6 + 0.25 * FX.noise1(fx * freq * 1.5, 7);
    else if (shape === "curtain") v = -Math.sin(Math.PI * clamp(fx, 0, 1)) * 1.4 + 0.7 + 0.15 * Math.sin(fx * freq * 2.2);
    else if (shape === "flat") v = 0.06 * FX.noise1(fx * freq * 3, 7);
    else v = 0.7 * FX.noise1(fx * freq, 7) + 0.3 * FX.noise1(fx * freq * 2.7, 13);
    hline[x] = clamp(hz0 + amp * v, 0.02, 0.98);
  }
  const bend = (surf.bend || 0) / 100 * 0.35;
  const bevG = surf.bevelOn ? gradientLUT(surf.bevelStops || surf.sky) : null;
  const R = new Float32Array(n * 3), S = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (M[i] <= 0) continue;
      const gx = (H[y * w + Math.min(x + 1, w - 1)] - H[y * w + Math.max(x - 1, 0)]) * 0.5 * tilt;
      const gy = (H[Math.min(y + 1, h - 1) * w + x] - H[Math.max(y - 1, 0) * w + x]) * 0.5 * tilt;
      const nl = Math.hypot(gx, gy, 1), nx = -gx / nl, ny = -gy / nl, nz = 1 / nl;
      let u = (y - bb.t) / bh + ny * 0.55 + Math.abs(nx) * 0.08;
      let r, g, b;
      if (horizon) {
        const hv = clamp(hline[x] + (bend ? ny * bend + nx * bend * 0.4 : 0), 0.02, 0.98), m = FX.smooth(hv - e, hv + e, u);
        const us = Math.round(clamp(u / hv, 0, 1) * 255) * 3, ug = Math.round(clamp((u - hv) / (1 - hv), 0, 1) * 255) * 3;
        r = sky[us] + (ground[ug] - sky[us]) * m; g = sky[us + 1] + (ground[ug + 1] - sky[us + 1]) * m; b = sky[us + 2] + (ground[ug + 2] - sky[us + 2]) * m;
        if (bevG) {   // the bevel rim takes its own gradient (top to bottom of the shape)
          const k = 1 - FX.smooth(bw * 0.3, bw * 0.55, D[i]);
          if (k > 0) { const q = Math.round(clamp((y - bb.t) / bh + ny * 0.35, 0, 1) * 255) * 3; r += (bevG[q] - r) * k; g += (bevG[q + 1] - g) * k; b += (bevG[q + 2] - b) * k; }
        }
      } else {
        let t = clamp(u, 0, 1);
        if (inv) t = 1 - t;
        if (bc > 0 && bmix > 0) t = t + (bandShape(t * bc + bph, bands.shape, bsoft) - t) * bmix;
        const q = Math.round(clamp(t, 0, 1) * 255) * 3;
        r = lut[q]; g = lut[q + 1]; b = lut[q + 2];
      }
      const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
      const m = clamp(1 - depth * 0.75 * (1 - diff / lz), 0, 1.4);
      R[i * 3] = r * m; R[i * 3 + 1] = g * m; R[i * 3 + 2] = b * m;
      S[i] = clamp(Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), shin) * sAmt, 0, 1);
    }
    if ((y & 63) === 0) await yieldFn();
  }
  return { R, S, D, bb };
}

// ---------------------------------------------------------------- 1.1: extras
function anyShine(P) { const s = P.shine || {}; return !!((s.glints && s.glints.on) || (s.sweep && s.sweep.on) || (s.rim && s.rim.on) || (s.arcs && s.arcs.on)); }
function extrasOn(P) {
  return !!((P.extrude && P.extrude.on) || (P.glow && (P.glow.modules || []).some((m) => m && m.on)) || anyShine(P));
}

async function extras(o) {
  const { w, h, n, sc, P, face, colour, S, yieldFn } = o;
  const below = [], above = [];
  const az = P.relief.angle * Math.PI / 180, light = { hx: Math.cos(az), hy: -Math.sin(az) };
  const needEdges = (P.extrude && P.extrude.on) || (P.shine.rim && P.shine.rim.on);
  const EN = needEdges ? FX.edgeNormals(face, w, h, boxBlur, 1.5 * Math.max(sc, 0.7)) : null;
  let D = o.faceD;
  const getD = () => (D = D || FX.insideDistance(face, w, h));
  const bb = o.bb || FX.bbox(face, w, h), bh = Math.max(1, bb.b - bb.t + 1), bwd = Math.max(1, bb.r - bb.l + 1);

  // walls + long shadow
  let WA = null;
  const X = P.extrude;
  if (X && X.on) {
    const wall = FX.extrude(face, EN.Ex, EN.Ey, w, h, Object.assign({}, X, { lut: gradientLUT(X.stops) }), sc, light);
    await yieldFn();
    if (wall) {
      WA = wall.WA;
      if (X.shadow > 0) below.push({ name: "Long shadow", rgba: FX.longShadow(face, WA, w, h, wall.dir, wall.Dp, X.shadow, sc, boxBlur), blend: "MULTIPLY" });
      below.push({ name: "Extrusion", rgba: wall.rgba, blend: "NORMAL" });
    }
  }
  const U = new Float32Array(n);
  for (let i = 0; i < n; i++) U[i] = WA ? Math.max(face[i], WA[i]) : face[i];

  // final face brightness (colour screened with shine), for bloom and glints
  const lumF = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const l = (0.2126 * colour[i * 4] + 0.7152 * colour[i * 4 + 1] + 0.0722 * colour[i * 4 + 2]) / 255;
    lumF[i] = (1 - (1 - l) * (1 - (o.shine ? S[i] : 0))) * face[i];
  }

  // glow modules
  const lo = new Float32Array(n * 3), hi = new Float32Array(n * 3);
  let loUsed = false, hiUsed = false;
  for (const m of (P.glow.modules || [])) {
    if (!m || !m.on || !(m.strength > 0)) continue;
    const col = FX.hexToRgb(m.color), r = Math.max(1, m.size * sc), k = m.strength / 100;
    if (m.type === "dreamy" || m.type === "halo") {
      const B = Float32Array.from(U);
      boxBlur(B, w, h, r, 3);
      if (m.type === "dreamy") {
        const B2 = Float32Array.from(U), B3 = Float32Array.from(U);
        boxBlur(B2, w, h, r * 2.5, 3); boxBlur(B3, w, h, r * 6, 3);
        for (let i = 0; i < n; i++) FX.screenAdd(lo, i, col, (0.55 * B[i] + 0.4 * B2[i] + 0.3 * B3[i]) * k * 1.3);
      } else for (let i = 0; i < n; i++) FX.screenAdd(lo, i, col, B[i] * k * 1.5);
      loUsed = true;
    } else if (m.type === "neon") {
      const Mb = Float32Array.from(face);
      boxBlur(Mb, w, h, Math.max(1, 1.2 * sc), 2);
      const E = new Float32Array(n);
      for (let i = 0; i < n; i++) E[i] = 4 * Mb[i] * (1 - Mb[i]);
      const B = Float32Array.from(E);
      boxBlur(B, w, h, r, 3);
      for (let i = 0; i < n; i++) FX.screenAdd(hi, i, col, (E[i] * 0.9 + B[i] * 2.5) * k);
      hiUsed = true;
    } else if (m.type === "inner") {
      const Dd = getD();
      for (let i = 0; i < n; i++) if (face[i] > 0) FX.screenAdd(hi, i, col, face[i] * Math.exp(-Dd[i] / r) * k);
      hiUsed = true;
    } else if (m.type === "bloom") {
      const B = new Float32Array(n);
      for (let i = 0; i < n; i++) B[i] = Math.max(0, lumF[i] - 0.7) * 3.3;
      boxBlur(B, w, h, r, 3);
      for (let i = 0; i < n; i++) FX.screenAdd(hi, i, col, B[i] * k * 1.6);
      hiUsed = true;
    }
    await yieldFn();
  }

  // shine FX
  const SH = P.shine;
  if (SH.sweep && SH.sweep.on && SH.sweep.strength > 0) {
    const a = SH.sweep.angle * Math.PI / 180, ca = Math.cos(a), sa = -Math.sin(a);
    const cx = (bb.l + bb.r) / 2, cy = (bb.t + bb.b) / 2, ext = Math.abs(bwd * ca) + Math.abs(bh * sa) || 1;
    const pos = SH.sweep.pos / 100, wd = Math.max(0.005, SH.sweep.width / 100 * 0.25), k = SH.sweep.strength / 100;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (face[i] <= 0) continue;
      const b = ((x - cx) * ca + (y - cy) * sa) / ext + 0.5, z = (b - pos) / wd;
      FX.screenAdd(hi, i, [255, 255, 255], Math.exp(-z * z) * k * face[i]);
    }
    hiUsed = true;
  }
  if (SH.rim && SH.rim.on && SH.rim.width > 0) {
    const Dd = getD(), wp = Math.max(0.8, SH.rim.width * sc), col = FX.hexToRgb(SH.rim.color);
    for (let i = 0; i < n; i++) {
      if (face[i] <= 0 || Dd[i] >= wp) continue;
      const away = Math.max(0, -(EN.Ex[i] * light.hx + EN.Ey[i] * light.hy));
      const f = 1 - Dd[i] / wp;
      FX.screenAdd(hi, i, col, f * f * away * face[i] * 1.1);
    }
    hiUsed = true;
  }
  if (SH.glints && SH.glints.on && SH.glints.count > 0) {
    const g = Math.max(3, Math.round(Math.min(bwd, bh) / 10)), cand = [];
    for (let cy = bb.t; cy <= bb.b; cy += g) for (let cx = bb.l; cx <= bb.r; cx += g) {
      let best = -1, bi = -1;
      for (let y = cy; y < Math.min(cy + g, h); y++) for (let x = cx; x < Math.min(cx + g, w); x++) { const i = y * w + x; if (lumF[i] > best) { best = lumF[i]; bi = i; } }
      if (best > 0.55) cand.push([best, bi]);
    }
    cand.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    const len = Math.max(2, SH.glints.size * sc), minD = Math.max(g, len * 0.8), picked = [];
    for (const [v, i] of cand) {
      if (picked.length >= SH.glints.count) break;
      const x = i % w, y = (i / w) | 0;
      if (picked.some((p) => Math.hypot(p[0] - x, p[1] - y) < minD)) continue;
      picked.push([x, y, v]);
    }
    const rot = SH.glints.rot * Math.PI / 180, col = FX.hexToRgb(SH.glints.color || "#FFFFFF");
    for (const [x, y, v] of picked) FX.star(hi, w, h, x, y, len * (0.6 + 0.4 * v), SH.glints.rays, rot, 0.6 + 0.4 * v, col);
    if (picked.length) hiUsed = true;
  }
  if (SH.arcs && SH.arcs.on && SH.arcs.count > 0) {
    const Dd = getD(), pts = [];
    const stride = Math.max(1, Math.round(2 * Math.max(sc, 0.5)));
    for (let y = 0; y < h; y += stride) for (let x = 0; x < w; x += stride) { const i = y * w + x; if (face[i] >= 0.5 && Dd[i] <= 1.5) pts.push([x, y]); }
    if (pts.length > 2) {
      const rand = FX.rng(4242 + SH.arcs.count * 7 + Math.round(SH.arcs.spread)), A = new Float32Array(n);
      const diag = Math.hypot(bwd, bh), spread = SH.arcs.spread / 100, target = (0.1 + 0.3 * spread) * diag;
      const wd = Math.max(0.5, 0.9 * sc);
      for (let k = 0; k < SH.arcs.count; k++) {
        const a = pts[Math.floor(rand() * pts.length)];
        let b = null, bd = Infinity;
        for (let t = 0; t < 16; t++) { const q = pts[Math.floor(rand() * pts.length)], dd = Math.abs(Math.hypot(q[0] - a[0], q[1] - a[1]) - target); if (dd < bd) { bd = dd; b = q; } }
        const path = FX.boltPath(rand, a[0], a[1], b[0], b[1], 0.12 + 0.2 * spread, 6);
        for (let j = 0; j < path.length - 1; j++) FX.drawLine(A, w, h, path[j][0], path[j][1], path[j + 1][0], path[j + 1][1], wd, 1);
        for (let br = 0; br < 2; br++) {           // short side branches
          const p = path[Math.floor(rand() * (path.length - 1))], ang = rand() * Math.PI * 2, bl = Math.hypot(b[0] - a[0], b[1] - a[1]) * (0.15 + rand() * 0.2);
          const bp = FX.boltPath(rand, p[0], p[1], p[0] + Math.cos(ang) * bl, p[1] + Math.sin(ang) * bl, 0.25, 4);
          for (let j = 0; j < bp.length - 1; j++) FX.drawLine(A, w, h, bp[j][0], bp[j][1], bp[j + 1][0], bp[j + 1][1], wd * 0.7, 0.7);
        }
      }
      const B = Float32Array.from(A);
      boxBlur(B, w, h, Math.max(1, 5 * sc), 3);
      const col = FX.hexToRgb(SH.arcs.color), core = col.map((v) => (v + 255 * 2) / 3);
      for (let i = 0; i < n; i++) { FX.screenAdd(hi, i, col, B[i] * 2.4); FX.screenAdd(hi, i, core, A[i]); }
      hiUsed = true;
    }
  }
  if (loUsed) below.unshift({ name: "Glow", rgba: FX.accToRGBA(lo, n), blend: "SCREEN" });
  if (hiUsed) above.push({ name: "Sparkle", rgba: FX.accToRGBA(hi, n), blend: "SCREEN" });
  return { below, above };
}

// merge layers (bottom to top) into one RGBA, W3C blend-then-composite
function flatten(layers, n) {
  const out = new Uint8Array(n * 4);
  const B = { NORMAL: (b, s) => s, SCREEN: (b, s) => 255 - (255 - b) * (255 - s) / 255, MULTIPLY: (b, s) => b * s / 255 };
  for (let i = 0; i < n; i++) {
    let r = 0, g = 0, bl = 0, ab = 0;
    for (const L of layers) {
      const s = L.rgba, as = s[i * 4 + 3] / 255;
      if (as <= 0) continue;
      const f = B[L.blend] || B.NORMAL, ao = as + ab * (1 - as);
      const mix = (cb, cs) => (as * (1 - ab) * cs + as * ab * f(cb, cs) + (1 - as) * ab * cb) / ao;
      r = mix(r, s[i * 4]); g = mix(g, s[i * 4 + 1]); bl = mix(bl, s[i * 4 + 2]); ab = ao;
    }
    out[i * 4] = clamp(Math.round(r), 0, 255); out[i * 4 + 1] = clamp(Math.round(g), 0, 255); out[i * 4 + 2] = clamp(Math.round(bl), 0, 255); out[i * 4 + 3] = clamp(Math.round(ab * 255), 0, 255);
  }
  return out;
}

async function render(src, P, hooks) {
  hooks = hooks || {};
  const yieldFn = hooks.yield || (async () => {});
  const w = src.w, h = src.h, n = w * h, c = src.c || 4, d = src.data;
  const sc = P.scale == null ? 1 : P.scale;
  const notes = [];

  // 1. luminance + alpha
  const L = new Float32Array(n), A = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += c) {
    const r = d[j], g = c >= 3 ? d[j + 1] : r, b = c >= 3 ? d[j + 2] : r;
    L[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    A[i] = c >= 4 ? d[j + 3] : 255;
  }
  // 1b. surface: outline (shape) or brightness (classic)
  const surf = P.surface || { from: "brightness" };
  const pick = FX.pickMode(src, surf);
  const outline = pick.mode === "outline";
  const Mf = outline ? FX.shapeMask(src, L, pick.key, surf.key) : null;
  let R, S, faceD = null, bb = null;
  if (outline) {
    const f = await outlineFace(Mf, w, h, P, sc, yieldFn);
    R = f.R; S = f.S; faceD = f.D; bb = f.bb;
  } else {
    // 2. pre-blur
    if (P.tone.blur > 0) boxBlur(L, w, h, P.tone.blur * sc, 3);
    await yieldFn();

    // 3. tone + 4. bands
    const k = P.tone.contrast / 100, mid = P.tone.mid / 100, inv = !!P.look.invert;
    const bands = P.bands, bc = bands.count, bph = bands.phase / 360, bmix = bands.mix / 100, bsoft = bands.soft / 100;
    const T = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let t = clamp((L[i] - mid) * k + 0.5, 0, 1);
      if (inv) t = 1 - t;
      if (bc > 0 && bmix > 0) t = t + (bandShape(t * bc + bph, bands.shape, bsoft) - t) * bmix;
      T[i] = t;
    }
    await yieldFn();

    // 5. metal gradient
    const lut = gradientLUT(P.look.stops);
    R = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const q = Math.round(T[i] * 255) * 3; R[i * 3] = lut[q]; R[i * 3 + 1] = lut[q + 1]; R[i * 3 + 2] = lut[q + 2]; }

    // 6. relief: height = blurred tone, normal from its slope, Lambert + Blinn
    const rel = P.relief, depth = rel.depth / 100;
    S = new Float32Array(n);                      // specular 0..1
    if (depth > 0 || rel.spec > 0) {
      const H = Float32Array.from(T);
      boxBlur(H, w, h, Math.max(1, rel.soft * sc), 2);
      const az = rel.angle * Math.PI / 180, el = 50 * Math.PI / 180;
      const lx = Math.cos(az) * Math.cos(el), ly = -Math.sin(az) * Math.cos(el), lz = Math.sin(el);
      let hx = lx, hy = ly, hz = lz + 1; const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
      const strength = 6 * depth / Math.max(0.25, sc), shin = 4 + rel.gloss * 1.2, sAmt = rel.spec / 100;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const dx = (H[y * w + Math.min(x + 1, w - 1)] - H[y * w + Math.max(x - 1, 0)]) * strength;
          const dy = (H[Math.min(y + 1, h - 1) * w + x] - H[Math.max(y - 1, 0) * w + x]) * strength;
          const nl = Math.hypot(dx, dy, 1), nx = -dx / nl, ny = -dy / nl, nz = 1 / nl;
          const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
          const shade = 1 - depth * 0.75 * (1 - diff / lz);     // flat = 1
          const sp = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), shin) * sAmt;
          S[i] = clamp(sp, 0, 1);
          const m = clamp(shade, 0, 1.4);
          R[i * 3] *= m; R[i * 3 + 1] *= m; R[i * 3 + 2] *= m;
        }
        if ((y & 63) === 0) await yieldFn();
      }
    }
  }

  // 7. finish: bloom on highlights, grain, source mix
  const fin = P.finish;
  if (fin.bloom > 0) {
    const B = new Float32Array(n);
    for (let i = 0; i < n; i++) { const l = (0.2126 * R[i * 3] + 0.7152 * R[i * 3 + 1] + 0.0722 * R[i * 3 + 2]) / 255; B[i] = Math.max(0, Math.max(l, S[i]) - 0.75) * 4; }
    boxBlur(B, w, h, 8 * sc, 3);
    const amt = fin.bloom / 100;
    for (let i = 0; i < n; i++) S[i] = clamp(S[i] + B[i] * amt * 0.6, 0, 1);
  }
  const gAmt = fin.grain / 100 * 40, mix = fin.mix / 100;
  const colour = new Uint8Array(n * 4), shine = new Uint8Array(n * 4);
  const split = P.out.layers === "split";
  for (let i = 0; i < n; i++) {
    const x = i % w, y = (i / w) | 0;
    const g = gAmt ? hashNoise(Math.round(x / Math.max(sc, 0.0001)), Math.round(y / Math.max(sc, 0.0001))) * gAmt : 0;
    const j = i * c;
    for (let ch = 0; ch < 3; ch++) {
      let v = R[i * 3 + ch] + g;
      if (mix > 0) v = v + ((c >= 3 ? d[j + ch] : d[j]) - v) * mix;
      if (!split) v = 255 - (255 - v) * (1 - S[i]);          // screen the shine in
      colour[i * 4 + ch] = clamp(Math.round(v), 0, 255);
    }
    colour[i * 4 + 3] = outline ? Math.round(Mf[i] * 255) : A[i];
    const s = Math.round(S[i] * 255);
    shine[i * 4] = s; shine[i * 4 + 1] = s; shine[i * 4 + 2] = s; shine[i * 4 + 3] = outline ? Math.round(Mf[i] * 255) : A[i];
  }
  const layers = [{ name: "Chrome colour", rgba: colour, blend: "NORMAL" }];
  if (split) layers.push({ name: "Chrome shine", rgba: shine, blend: "SCREEN" });
  if (!extrasOn(P)) return { w, h, layers, notes };
  // 8. extrusion, glow and shine FX around the face
  const face = new Float32Array(n);
  for (let i = 0; i < n; i++) face[i] = outline ? Mf[i] : A[i] / 255;
  const out = await extras({ w, h, n, sc, P, face, faceD, bb, colour, shine: split ? shine : null, S, yieldFn });
  const all = out.below.concat(layers, out.above);
  if (split) return { w, h, layers: all, notes };
  return { w, h, layers: [{ name: "Chrome colour", rgba: flatten(all, n), blend: "NORMAL" }], notes };
}

// RGB preview: layers over a background (white | black | checker)
function composite(res, bg) {
  const { w, h } = res, n = w * h, out = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = i % w, y = (i / w) | 0;
    let b;
    if (bg.type === "black") b = 0; else if (bg.type === "checker") b = ((x >> 3) + (y >> 3)) & 1 ? 200 : 240; else b = 255;
    out[i * 3] = b; out[i * 3 + 1] = b; out[i * 3 + 2] = b;
  }
  for (const L of res.layers) {
    const s = L.rgba;
    for (let i = 0; i < n; i++) {
      const a = s[i * 4 + 3] / 255;
      for (let ch = 0; ch < 3; ch++) {
        const o = out[i * 3 + ch], v = s[i * 4 + ch];
        const t = L.blend === "SCREEN" ? 255 - (255 - o) * (255 - v) / 255 : L.blend === "MULTIPLY" ? o * v / 255 : v;
        out[i * 3 + ch] = Math.round(o + (t - o) * a);
      }
    }
  }
  return out;
}

// built-in demo: soft shapes with type-like bars, so chrome has edges to catch
function demoImage(w, h) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = x / w, fy = y / h, i = (y * w + x) * 4;
    const dx = fx - 0.5, dy = fy - 0.45, d = Math.sqrt(dx * dx + dy * dy);
    let v = 0.15 + 0.25 * fy;
    if (d < 0.3) v = 0.35 + 0.6 * Math.cos(d / 0.3 * Math.PI / 2);
    if (fy > 0.8 && fy < 0.92 && ((fx * 7) % 1) < 0.7) v = 0.95;
    const r = clamp(v * 255, 0, 255), g = clamp(v * 230 + 20 * fx, 0, 255), b = clamp(v * 210 + 40 * fy, 0, 255);
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  }
  return { w, h, c: 4, data };
}

module.exports = { render, composite, demoImage, gradientLUT, hexToRgb, isHex, clamp, _internal: { boxBlur, bandShape, hashNoise } };
