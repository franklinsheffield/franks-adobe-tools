"use strict";
// ======================================================================
// Chrometone engine (pure JS, no host calls): turns an image into liquid
// chrome / metal.  luminance -> pre-blur -> tone -> bands -> metal gradient
// -> relief shading + specular shine -> grain / bloom / source mix.
// Sizes are in document pixels and scaled by P.scale so the preview of a
// downscaled image matches the full-size Apply.
// ======================================================================

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
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
  const R = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const q = Math.round(T[i] * 255) * 3; R[i * 3] = lut[q]; R[i * 3 + 1] = lut[q + 1]; R[i * 3 + 2] = lut[q + 2]; }

  // 6. relief: height = blurred tone, normal from its slope, Lambert + Blinn
  const rel = P.relief, depth = rel.depth / 100;
  const S = new Float32Array(n);                // specular 0..1
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
    colour[i * 4 + 3] = A[i];
    const s = Math.round(S[i] * 255);
    shine[i * 4] = s; shine[i * 4 + 1] = s; shine[i * 4 + 2] = s; shine[i * 4 + 3] = A[i];
  }
  const layers = [{ name: "Chrome colour", rgba: colour, blend: "NORMAL" }];
  if (split) layers.push({ name: "Chrome shine", rgba: shine, blend: "SCREEN" });
  return { w, h, layers, notes };
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
        const t = L.blend === "SCREEN" ? 255 - (255 - o) * (255 - v) / 255 : v;
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
