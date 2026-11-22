"use strict";
// Pure image helpers shared by the suite's engines (no host calls).
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function hexToRgb(h) { h = String(h).replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
const isHex = (h) => /^#?[0-9a-f]{6}$/i.test(String(h));

// separable box blur on a Float32Array, `passes` times (3 ~ gaussian), in place
function boxBlur(f, w, h, r, passes) {
  r = Math.round(r);
  if (r < 1) return f;
  const tmp = new Float32Array(Math.max(w, h)), k = 2 * r + 1;
  for (let p = 0; p < (passes || 2); p++) {
    for (let y = 0; y < h; y++) {
      const o = y * w; let acc = 0;
      for (let x = -r; x <= r; x++) acc += f[o + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) { tmp[x] = acc / k; acc += f[o + Math.min(x + r + 1, w - 1)] - f[o + Math.max(x - r, 0)]; }
      for (let x = 0; x < w; x++) f[o + x] = tmp[x];
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += f[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) { tmp[y] = acc / k; acc += f[Math.min(y + r + 1, h - 1) * w + x] - f[Math.max(y - r, 0) * w + x]; }
      for (let y = 0; y < h; y++) f[y * w + x] = tmp[y];
    }
  }
  return f;
}

// 256-entry RGB lookup from stops [{p:0..100, c:"#RRGGBB"}]
function gradientLUT(stops) {
  const s = (stops || []).filter((x) => x && isHex(x.c)).map((x) => ({ p: clamp(Number(x.p) || 0, 0, 100) / 100, c: hexToRgb(x.c) })).sort((a, b) => a.p - b.p);
  if (!s.length) s.push({ p: 0, c: [0, 0, 0] }, { p: 1, c: [255, 255, 255] });
  const lut = new Float32Array(768);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = s[0], b = s[s.length - 1], u = 0;
    if (t <= s[0].p) { a = b = s[0]; } else if (t >= s[s.length - 1].p) { a = b = s[s.length - 1]; } else {
      for (let k = 0; k < s.length - 1; k++) if (t >= s[k].p && t <= s[k + 1].p) { a = s[k]; b = s[k + 1]; break; }
      u = b.p > a.p ? (t - a.p) / (b.p - a.p) : 0;
    }
    for (let ch = 0; ch < 3; ch++) lut[i * 3 + ch] = a.c[ch] + (b.c[ch] - a.c[ch]) * u;
  }
  return lut;
}

// deterministic noise in [-1, 1]
function hashNoise(x, y, seed) {
  let n = (x * 374761393 + y * 668265263 + (seed || 0) * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (((n ^ (n >>> 16)) >>> 0) / 4294967295) * 2 - 1;
}
// seeded PRNG (mulberry32) for repeatable "random" choices
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function luminance(src) {
  const n = src.w * src.h, c = src.c || 4, d = src.data, L = new Float32Array(n), A = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += c) {
    const r = d[j], g = c >= 3 ? d[j + 1] : r, b = c >= 3 ? d[j + 2] : r;
    L[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    A[i] = c >= 4 ? d[j + 3] : 255;
  }
  return { L, A };
}
// float RGB planes 0..255 from a source image
function planes(src) {
  const n = src.w * src.h, c = src.c || 4, d = src.data, R = new Float32Array(n), G = new Float32Array(n), B = new Float32Array(n), A = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += c) { R[i] = d[j]; G[i] = c >= 3 ? d[j + 1] : d[j]; B[i] = c >= 3 ? d[j + 2] : d[j]; A[i] = c >= 4 ? d[j + 3] : 255; }
  return { R, G, B, A };
}
function toRGBA(R, G, B, A, n) {
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { out[i * 4] = clamp(Math.round(R[i]), 0, 255); out[i * 4 + 1] = clamp(Math.round(G[i]), 0, 255); out[i * 4 + 2] = clamp(Math.round(B[i]), 0, 255); out[i * 4 + 3] = A ? A[i] : 255; }
  return out;
}

const BLENDS = {
  NORMAL: (o, v) => v,
  SCREEN: (o, v) => 255 - (255 - o) * (255 - v) / 255,
  MULTIPLY: (o, v) => o * v / 255,
  LIGHTEN: (o, v) => (v > o ? v : o),
  LINEARDODGE: (o, v) => Math.min(255, o + v),
  OVERLAY: (o, v) => (o < 128 ? 2 * o * v / 255 : 255 - 2 * (255 - o) * (255 - v) / 255),
  SOFTLIGHT: (o, v) => {
    const a = o / 255, b = v / 255;
    const d = a <= 0.25 ? ((16 * a - 12) * a + 4) * a : Math.sqrt(a);
    return 255 * (b <= 0.5 ? a - (1 - 2 * b) * a * (1 - a) : a + (2 * b - 1) * (d - a));
  }
};
// RGB preview: background, then (if res.overSource) the source, then layers
function composite(res, bg, src) {
  const { w, h } = res, n = w * h, out = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = i % w, y = (i / w) | 0;
    const b = bg.type === "black" ? 0 : bg.type === "checker" ? (((x >> 3) + (y >> 3)) & 1 ? 200 : 240) : 255;
    out[i * 3] = b; out[i * 3 + 1] = b; out[i * 3 + 2] = b;
  }
  const stack = (res.overSource && src ? [{ rgba: null, blend: "NORMAL", src: true }] : []).concat(res.layers);
  for (const L of stack) {
    const f = BLENDS[L.blend] || BLENDS.NORMAL;
    const c = src ? (src.c || 4) : 4;
    for (let i = 0; i < n; i++) {
      let a, v0, v1, v2;
      if (L.src) { const j = i * c; v0 = src.data[j]; v1 = c >= 3 ? src.data[j + 1] : v0; v2 = c >= 3 ? src.data[j + 2] : v0; a = (c >= 4 ? src.data[j + 3] : 255) / 255; }
      else { const s = L.rgba; v0 = s[i * 4]; v1 = s[i * 4 + 1]; v2 = s[i * 4 + 2]; a = s[i * 4 + 3] / 255 * (L.opacity == null ? 1 : L.opacity / 100); }
      if (a <= 0) continue;
      const o0 = out[i * 3], o1 = out[i * 3 + 1], o2 = out[i * 3 + 2];
      out[i * 3] = Math.round(o0 + (f(o0, v0) - o0) * a);
      out[i * 3 + 1] = Math.round(o1 + (f(o1, v1) - o1) * a);
      out[i * 3 + 2] = Math.round(o2 + (f(o2, v2) - o2) * a);
    }
  }
  return out;
}

// colourful demo image with soft shapes, bright spots and hard edges
function demoImage(w, h) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = x / w, fy = y / h, i = (y * w + x) * 4;
    let r = 40 + 120 * fx, g = 30 + 90 * fy, b = 90 + 100 * (1 - fx);
    const dx = fx - 0.38, dy = fy - 0.45, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.22) { const t = Math.cos(d / 0.22 * Math.PI / 2); r = 255 * t + r * (1 - t); g = 200 * t + g * (1 - t); b = 120 * t + b * (1 - t); }
    if (fx > 0.62 && fx < 0.9 && fy > 0.2 && fy < 0.7) { r = 30; g = 220; b = 240; }
    if (fy > 0.8 && fy < 0.9 && ((fx * 8) % 1) < 0.6) { r = g = b = 250; }
    data[i] = clamp(r, 0, 255); data[i + 1] = clamp(g, 0, 255); data[i + 2] = clamp(b, 0, 255); data[i + 3] = 255;
  }
  return { w, h, c: 4, data };
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
function merge(base, patch) {
  const out = clone(base);
  (function rec(dst, src) { for (const k of Object.keys(src)) { if (isObj(src[k]) && isObj(dst[k])) rec(dst[k], src[k]); else dst[k] = clone(src[k]); } })(out, patch || {});
  return out;
}

module.exports = { clamp, hexToRgb, isHex, boxBlur, gradientLUT, hashNoise, rng, luminance, planes, toRGBA, composite, demoImage, BLENDS, clone, merge };
