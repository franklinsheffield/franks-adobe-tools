"use strict";
// ======================================================================
// Colour section 3.0 (Brew Suite 3.0 spec, all 12 tools locked in by Frank
// 2026-11-24). Pure maths, no host calls; shared/colour.js calls in here.
//   1 Gradient Map        multi-stop ramp (2..16 stops), presets
//   2 Duotone / Tritone   2-3 print inks, curve per ink, paper colour
//   3 Palette library     built-ins + .ase / .aco / .gpl / hex list import
//   4 Harmony generator   complementary / triad / analogous / split / tetrad / shades (OKLCH)
//   5 Brand palette lock  snap every chosen colour to the brand swatches
//   6 Smarter reduction   OKLab nearest colour + dither choice
//   7 Shadows/Mids/Highs  three tint wheels (hue + amount)
//   8 Hue/Sat/Light/Temp/Tint  global OKLCH knobs
//   9 Colour replace      from -> to with tolerance + softness (up to 4)
//  10 Spot-colour layers  one named mask layer per palette colour
//  11 Proof checks        CMYK gamut warning + colour-blind simulation
//  12 Swatch sync         PS foreground/background as inks, .ase/.gpl export
// plus Randomise with per-swatch locks.
// ======================================================================
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const isHex = (h) => /^#[0-9A-Fa-f]{6}$/.test(String(h));
function hexToRgb(h) { h = String(h).replace("#", ""); return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0]; }
function rgbToHex(c) { return "#" + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase(); }

// ---- OKLab / OKLCH (Ottosson) ------------------------------------------
const LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const toSRGB = (v) => { v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return clamp(v * 255, 0, 255); };
function linToLab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
const rgbToLab = (c) => linToLab(LIN[clamp(c[0] | 0, 0, 255)], LIN[clamp(c[1] | 0, 0, 255)], LIN[clamp(c[2] | 0, 0, 255)]);
function labToLin(L, a, b) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
const labToRgb = (L, a, b) => labToLin(L, a, b).map(toSRGB);
const labToLch = (p) => [p[0], Math.hypot(p[1], p[2]), (Math.atan2(p[2], p[1]) * 180 / Math.PI + 360) % 360];
const lchToLab = (L, C, H) => [L, C * Math.cos(H * Math.PI / 180), C * Math.sin(H * Math.PI / 180)];
// keep in sRGB gamut by lowering chroma (binary search), like CSS gamut mapping
function lchToRgb(L, C, H) {
  const inG = (c) => { const v = labToLin.apply(null, lchToLab(L, c, H)); return v.every((x) => x >= -1e-4 && x <= 1 + 1e-4); };
  if (!inG(C)) { let lo = 0, hi = C; for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (inG(m)) lo = m; else hi = m; } C = lo; }
  return labToRgb.apply(null, lchToLab(clamp(L, 0, 1), C, H));
}
const hexLch = (h) => labToLch(rgbToLab(hexToRgb(h)));
const lchHex = (L, C, H) => rgbToHex(lchToRgb(L, C, H));
const deltaE = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

// ---- 1 Gradient Map -------------------------------------------------------
const MAX_STOPS = 16;
const G = (id, name, cols) => ({ id, name, stops: cols.map((c, i) => ({ c, p: Math.round(i / (cols.length - 1) * 100) })) });
const GRADIENTS = [
  G("synth", "Synthwave", ["#0B0221", "#3D0C6E", "#C2187E", "#FF6B35", "#FFE66D"]),
  G("thermal", "Thermal", ["#000004", "#320A5E", "#9B2964", "#E35933", "#F9C932", "#FCFFA4"]),
  G("ice", "Ice", ["#020B1A", "#0B3C6E", "#1F8FD1", "#8BE3FF", "#F2FCFF"]),
  G("gold", "Gold Leaf", ["#140A02", "#5A3A0A", "#B8860B", "#F3D37A", "#FFF7DC"]),
  G("acid", "Acid", ["#0A0A0A", "#1E5128", "#4FFF00", "#F0FF6B"]),
  G("noir", "Noir", ["#000000", "#2B2B2B", "#BFBFBF", "#FFFFFF"]),
  G("sunset", "Sunset Strip", ["#1A0533", "#6B0F6B", "#E0245E", "#FF8A3D", "#FFE29A"]),
  G("chrome", "Chrome", ["#0A0A12", "#5F6B7A", "#E8EEF5", "#4A5563", "#F7FBFF"]),
  G("arcade", "Night Arcade", ["#05040C", "#3A1D6E", "#BC71FE", "#5CF2FF", "#F2FFFF"]),
  G("rust", "Rust", ["#120502", "#5C1F0A", "#B6501A", "#E9A15A", "#F8E2C2"])
];
function gradLUT(stops) {
  const s = (stops || []).filter((x) => x && isHex(x.c)).map((x) => ({ p: clamp(+x.p || 0, 0, 100) / 100 * 255, lab: rgbToLab(hexToRgb(x.c)) })).sort((a, b) => a.p - b.p);
  const lut = new Uint8Array(256 * 3);
  if (!s.length) { for (let v = 0; v < 256; v++) lut[v * 3] = lut[v * 3 + 1] = lut[v * 3 + 2] = v; return lut; }
  for (let v = 0, k = 0; v < 256; v++) {
    while (k < s.length - 1 && s[k + 1].p <= v) k++;
    const A = s[k], B = s[Math.min(k + 1, s.length - 1)];
    const t = v <= A.p || A === B ? 0 : clamp((v - A.p) / Math.max(1e-6, B.p - A.p), 0, 1);
    const L = v < s[0].p ? s[0].lab : [A.lab[0] + (B.lab[0] - A.lab[0]) * t, A.lab[1] + (B.lab[1] - A.lab[1]) * t, A.lab[2] + (B.lab[2] - A.lab[2]) * t];
    const rgb = labToRgb(L[0], L[1], L[2]);
    lut[v * 3] = rgb[0]; lut[v * 3 + 1] = rgb[1]; lut[v * 3 + 2] = rgb[2];
  }
  return lut;
}

// ---- 2 Duotone / Tritone ---------------------------------------------------
// Each ink lays down coverage = curve(darkness); colour = paper x every ink
// (subtractive, like stacked print inks). gamma bends the ink curve; lo/hi
// clip where the ink starts and reaches full coverage (0..100 darkness).
const INKSETS = [
  { id: "riso-bp", name: "Riso Blue + Fluo Pink", paper: "#F5F0E6", inks: [{ c: "#0078BF", g: 1, lo: 30, hi: 100 }, { c: "#FF48B0", g: 1.4, lo: 0, hi: 80 }] },
  { id: "navy", name: "Navy + Cream", paper: "#F4EBD0", inks: [{ c: "#1B2A49", g: 1, lo: 0, hi: 100 }] },
  { id: "black-red", name: "Black + Red", paper: "#FFFFFF", inks: [{ c: "#111111", g: 1.6, lo: 40, hi: 100 }, { c: "#E10600", g: 0.8, lo: 0, hi: 70 }] },
  { id: "screen3", name: "Screen Print 3", paper: "#FAF6EC", inks: [{ c: "#2E3192", g: 1.6, lo: 45, hi: 100 }, { c: "#EC008C", g: 1, lo: 15, hi: 85 }, { c: "#FFF200", g: 0.7, lo: 0, hi: 60 }] },
  { id: "teal-orange", name: "Teal + Orange", paper: "#FFF8EE", inks: [{ c: "#006D77", g: 1.2, lo: 20, hi: 100 }, { c: "#FF7B00", g: 0.9, lo: 0, hi: 75 }] },
  { id: "riso-gold", name: "Riso Black + Gold", paper: "#F7F2E7", inks: [{ c: "#000000", g: 1.5, lo: 35, hi: 100 }, { c: "#BB8B41", g: 1, lo: 0, hi: 90 }] }
];
function inkLUT(I) {
  const paper = hexToRgb(I && I.paper || "#FFFFFF").map((v) => v / 255);
  const inks = ((I && I.inks) || []).slice(0, clamp((I && I.n) || ((I && I.inks) || []).length, 1, 3)).map((k) => ({ c: hexToRgb(k.c).map((v) => v / 255), g: clamp(+k.g || 1, 0.2, 5), lo: clamp(k.lo == null ? 0 : k.lo, 0, 100) / 100, hi: clamp(k.hi == null ? 100 : k.hi, 0, 100) / 100 }));
  const lut = new Uint8Array(256 * 3);
  for (let v = 0; v < 256; v++) {
    const dark = 1 - v / 255, col = paper.slice();
    for (const k of inks) {
      const t = clamp((dark - k.lo) / Math.max(1e-3, k.hi - k.lo), 0, 1), cov = Math.pow(t, k.g);
      for (let c = 0; c < 3; c++) col[c] *= 1 - cov * (1 - k.c[c]);
    }
    for (let c = 0; c < 3; c++) lut[v * 3 + c] = clamp(Math.round(col[c] * 255), 0, 255);
  }
  return lut;
}

// ---- 7 + 8 + 9 grade (applied before every mode; "Grade" mode shows it alone)
const DEFAULT_ADJ = { hue: 0, sat: 0, light: 0, temp: 0, tint: 0, sh: { h: 220, a: 0 }, mid: { h: 40, a: 0 }, hi: { h: 50, a: 0 }, replace: [] };
const adjActive = (A) => !!A && (A.hue || A.sat || A.light || A.temp || A.tint || (A.sh && A.sh.a) || (A.mid && A.mid.a) || (A.hi && A.hi.a) || (A.replace || []).some((r) => r && r.on !== false && isHex(r.from) && isHex(r.to)));
// returns a function rgb(0..255 x3) -> rgb, cached per colour by the caller
function grader(A) {
  A = Object.assign({}, DEFAULT_ADJ, A || {});
  const hs = (A.hue || 0), sat = 1 + clamp(A.sat || 0, -100, 100) / 100, lgt = clamp(A.light || 0, -100, 100) / 250;
  const temp = clamp(A.temp || 0, -100, 100) / 100 * 0.06, tint = clamp(A.tint || 0, -100, 100) / 100 * 0.06;
  const wheel = (w, k) => { const a = clamp(w && w.a || 0, 0, 100) / 100 * 0.08 * k, h = (w && w.h || 0) * Math.PI / 180; return [a * Math.cos(h), a * Math.sin(h)]; };
  const SH = wheel(A.sh, 1), MI = wheel(A.mid, 1), HI = wheel(A.hi, 1);
  const reps = (A.replace || []).filter((r) => r && r.on !== false && isHex(r.from) && isHex(r.to)).slice(0, 4).map((r) => ({ f: rgbToLab(hexToRgb(r.from)), t: rgbToLab(hexToRgb(r.to)), tol: clamp(r.tol == null ? 20 : r.tol, 0, 100) / 100 * 0.35, soft: clamp(r.soft == null ? 50 : r.soft, 0, 100) / 100 }));
  return function (r, g, b) {
    let p = linToLab(LIN[r], LIN[g], LIN[b]);
    for (const R of reps) {
      const d = deltaE(p, R.f), edge = R.tol * (1 + R.soft);
      if (d >= edge) continue;
      const k = d <= R.tol ? 1 : 1 - (d - R.tol) / Math.max(1e-6, edge - R.tol);
      // shift by the from->to offset so shading inside the matched area survives
      p = [p[0] + (R.t[0] - R.f[0]) * k, p[1] + (R.t[1] - R.f[1]) * k, p[2] + (R.t[2] - R.f[2]) * k];
    }
    let L = p[0], a = p[1], bb = p[2];
    if (hs) { const c = Math.cos(hs * Math.PI / 180), s = Math.sin(hs * Math.PI / 180), na = a * c - bb * s; bb = a * s + bb * c; a = na; }
    a *= sat; bb *= sat;
    L += lgt * (1 - Math.abs(2 * L - 1) * 0.5);
    bb += temp; a += tint;
    const ws = clamp(1 - L * 2, 0, 1), wh = clamp(L * 2 - 1, 0, 1), wm = 1 - ws - wh;
    a += SH[0] * ws + MI[0] * wm + HI[0] * wh; bb += SH[1] * ws + MI[1] * wm + HI[1] * wh;
    return labToRgb(clamp(L, 0, 1), a, bb);
  };
}
// grade an RGB(A) image into a new array of the same layout
function grade(data, ch, A) {
  const f = grader(A), out = new Uint8ClampedArray(data.length), cache = new Map();
  for (let i = 0; i < data.length; i += ch) {
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    let v = cache.get(key);
    if (!v) { v = f(data[i], data[i + 1], data[i + 2]); if (cache.size < 200000) cache.set(key, v); }
    out[i] = v[0]; out[i + 1] = v[1]; out[i + 2] = v[2];
    if (ch === 4) out[i + 3] = data[i + 3];
  }
  return out;
}

// ---- 6 Smarter reduction ---------------------------------------------------
const DITHERS = [
  { v: "none", l: "None" }, { v: "bayer", l: "Bayer" }, { v: "floyd", l: "Floyd" }, { v: "atkinson", l: "Atkinson" }, { v: "blue", l: "Blue noise" }
];
// 64x64 blue-ish noise from a fixed void-and-cluster-like shuffle (deterministic)
const BLUE = (() => {
  const N = 64, f = new Float32Array(N * N);
  let s = 1234567;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  // interleaved gradient noise jittered: cheap, low-clump threshold map
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) f[y * N + x] = (52.9829189 * ((0.06711056 * x + 0.00583715 * y) % 1) + rnd() * 0.15) % 1;
  return f;
})();
// img: {w,h,c,data}; cols: [[r,g,b]]; returns RGBA; alpha-0 pixels stay clear
function reduce(img, cols, dither, bayer) {
  const w = img.w, h = img.h, ch = img.c || 4, d = img.data, out = new Uint8ClampedArray(w * h * 4), m = cols.length;
  const labs = cols.map(rgbToLab);
  const near2 = (p) => { let b1 = 0, d1 = Infinity, b2 = 0, d2 = Infinity; for (let k = 0; k < m; k++) { const dd = deltaE(p, labs[k]); if (dd < d1) { d2 = d1; b2 = b1; d1 = dd; b1 = k; } else if (dd < d2) { d2 = dd; b2 = k; } } return [b1, b2, d1, d2]; };
  if (dither === "floyd" || dither === "atkinson") {
    const E = new Float32Array(w * h * 3);
    for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) E[i * 3 + c] = LIN[d[i * ch + c]];
    const lins = cols.map((c) => c.map((v) => LIN[v]));
    const spread = dither === "floyd" ? [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]] : [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (ch === 4 && d[i * 4 + 3] === 0) continue;
      const r = clamp(E[i * 3], 0, 1), g = clamp(E[i * 3 + 1], 0, 1), b = clamp(E[i * 3 + 2], 0, 1);
      const k = near2(linToLab(r, g, b))[0], q = lins[k];
      out[i * 4] = cols[k][0]; out[i * 4 + 1] = cols[k][1]; out[i * 4 + 2] = cols[k][2]; out[i * 4 + 3] = 255;
      const er = [r - q[0], g - q[1], b - q[2]];
      for (const s of spread) {
        const xx = x + s[0], yy = y + s[1];
        if (xx < 0 || xx >= w || yy >= h) continue;
        const j = (yy * w + xx) * 3;
        E[j] += er[0] * s[2]; E[j + 1] += er[1] * s[2]; E[j + 2] += er[2] * s[2];
      }
    }
    return out;
  }
  const cache = new Map();
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
    const s = i * ch, o = i * 4;
    if (ch === 4 && d[s + 3] === 0) continue;
    const key = (d[s] << 16) | (d[s + 1] << 8) | d[s + 2];
    let e = cache.get(key);
    if (!e) { const r = near2(rgbToLab([d[s], d[s + 1], d[s + 2]])); e = { b1: r[0], b2: r[1], t: m > 1 && r[2] + r[3] > 0 ? r[2] / (r[2] + r[3]) : 0 }; if (cache.size < 65536) cache.set(key, e); }
    let k = e.b1;
    if (dither === "bayer" && e.t > bayer[(y & 7) * 8 + (x & 7)]) k = e.b2;
    else if (dither === "blue" && e.t > BLUE[(y & 63) * 64 + (x & 63)]) k = e.b2;
    out[o] = cols[k][0]; out[o + 1] = cols[k][1]; out[o + 2] = cols[k][2]; out[o + 3] = 255;
  }
  return out;
}

// ---- 4 Harmony generator (OKLCH, even perceived steps) --------------------
const HARMONIES = [
  { v: "complementary", l: "Complementary", hues: [0, 180] },
  { v: "analogous", l: "Analogous", hues: [-30, 0, 30] },
  { v: "triad", l: "Triad", hues: [0, 120, 240] },
  { v: "split", l: "Split", hues: [0, 150, 210] },
  { v: "tetrad", l: "Tetrad", hues: [0, 90, 180, 270] },
  { v: "shades", l: "Shades", hues: [0] }
];
// returns n hex colours, dark -> light, built around the base colour
function harmony(hex, kind, n) {
  const H = HARMONIES.find((x) => x.v === kind) || HARMONIES[0];
  const base = hexLch(isHex(hex) ? hex : "#5CF2FF");
  n = clamp(Math.round(n) || Math.max(H.hues.length, 5), 2, 16);
  const out = [];
  for (let i = 0; i < n; i++) {
    const hue = (base[2] + H.hues[i % H.hues.length] + 360) % 360;
    const L = 0.18 + 0.74 * (n === 1 ? 0.5 : i / (n - 1));               // even lightness steps
    const C = base[1] * (1 - 0.5 * Math.abs(L - 0.55) / 0.45);           // less chroma at the ends
    out.push(lchHex(L, C, hue));
  }
  return out;
}

// ---- 3 Palette library: parsers and writers -------------------------------
function parseHexList(text) {
  const out = [], re = /#?\b([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g; let m;
  while ((m = re.exec(String(text))) && out.length < 256) { let h = m[1]; if (h.length === 3) h = h.split("").map((c) => c + c).join(""); out.push("#" + h.toUpperCase()); }
  return out;
}
function parseGPL(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/.exec(line);
    if (m) out.push(rgbToHex([+m[1], +m[2], +m[3]]));
  }
  return out;
}
const u8 = (buf) => buf instanceof Uint8Array ? buf : new Uint8Array(buf.buffer ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : buf);
// Adobe Swatch Exchange: RGB, CMYK, LAB and Gray entries
function parseASE(buf) {
  const b = u8(buf), v = new DataView(b.buffer, b.byteOffset, b.byteLength), out = [];
  if (b.length < 12 || String.fromCharCode(b[0], b[1], b[2], b[3]) !== "ASEF") throw new Error("Not an .ase swatch file.");
  const n = v.getUint32(8); let p = 12;
  for (let k = 0; k < n && p + 6 <= b.length; k++) {
    const type = v.getUint16(p), len = v.getUint32(p + 2), s = p + 6; p = s + len;
    if (type !== 1) continue;
    const nl = v.getUint16(s), q = s + 2 + nl * 2, model = String.fromCharCode(b[q], b[q + 1], b[q + 2], b[q + 3]).trim(), f = (i) => v.getFloat32(q + 4 + i * 4);
    if (model === "RGB") out.push(rgbToHex([f(0) * 255, f(1) * 255, f(2) * 255]));
    else if (model === "CMYK") out.push(rgbToHex([0, 1, 2].map((i) => 255 * (1 - f(i)) * (1 - f(3)))));
    else if (model === "Gray") out.push(rgbToHex([f(0) * 255, f(0) * 255, f(0) * 255]));
    else if (model === "LAB") out.push(rgbToHex(cielabToRgb(f(0) * 100, f(1), f(2))));
  }
  return out;
}
// Photoshop .aco (v1 or v2): RGB, HSB, CMYK, Lab, Gray
function parseACO(buf) {
  const b = u8(buf), v = new DataView(b.buffer, b.byteOffset, b.byteLength), out = [];
  if (b.length < 4) throw new Error("Not an .aco swatch file.");
  const n = v.getUint16(2);
  for (let k = 0; k < n && 4 + k * 10 + 10 <= b.length; k++) {
    const p = 4 + k * 10, sp = v.getUint16(p), w = [1, 2, 3, 4].map((i) => v.getUint16(p + i * 2));
    if (sp === 0) out.push(rgbToHex(w.slice(0, 3).map((x) => x / 257)));
    else if (sp === 1) out.push(rgbToHex(hsvToRgb(w[0] / 65535 * 360, w[1] / 65535, w[2] / 65535)));
    else if (sp === 2) out.push(rgbToHex([0, 1, 2].map((i) => 255 * (w[i] / 65535) * (w[3] / 65535))));   // stored inverted
    else if (sp === 7) out.push(rgbToHex(cielabToRgb(w[0] / 100, (w[1] << 16 >> 16) / 100, (w[2] << 16 >> 16) / 100)));
    else if (sp === 8) out.push(rgbToHex([w[0], w[0], w[0]].map((x) => x / 10000 * 255)));
  }
  return out;
}
function hsvToRgb(h, s, v) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}
function cielabToRgb(L, a, b) {   // D65 CIELAB -> sRGB
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200, e = 216 / 24389, k = 24389 / 27;
  const inv = (t) => t * t * t > e ? t * t * t : (116 * t - 16) / k;
  const X = 0.95047 * inv(fx), Y = L > k * e ? Math.pow(fy, 3) : L / k, Z = 1.08883 * inv(fz);
  return [3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z, 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z].map(toSRGB);
}
// detect by name/content; returns hex list or throws with a plain message
function importPalette(name, data) {
  const ext = String(name || "").toLowerCase().split(".").pop();
  let cols;
  if (ext === "ase") cols = parseASE(data);
  else if (ext === "aco") cols = parseACO(data);
  else {
    const text = typeof data === "string" ? data : new TextDecoder().decode(u8(data));
    cols = ext === "gpl" || /^GIMP Palette/.test(text) ? parseGPL(text) : parseHexList(text);
  }
  if (!cols.length) throw new Error("No colours found in " + (name || "that text") + ".");
  return cols;
}
function writeASE(colors, name) {
  const cols = colors.filter(isHex), parts = [];
  const str = (s) => { const a = [], t = String(s).slice(0, 60) + "\0"; for (const ch of t) { const c = ch.charCodeAt(0); a.push(c >> 8, c & 255); } return { a, n: t.length }; };
  const u16 = (x) => [(x >> 8) & 255, x & 255], u32 = (x) => [(x >>> 24) & 255, (x >> 16) & 255, (x >> 8) & 255, x & 255];
  const f32 = (x) => { const d = new DataView(new ArrayBuffer(4)); d.setFloat32(0, x); return [d.getUint8(0), d.getUint8(1), d.getUint8(2), d.getUint8(3)]; };
  const block = (type, body) => parts.push(...u16(type), ...u32(body.length), ...body);
  const g = str(name || "Brew palette"); block(0xC001, [...u16(g.n), ...g.a]);
  cols.forEach((h) => { const s = str(h), c = hexToRgb(h).map((v) => v / 255); block(1, [...u16(s.n), ...s.a, 82, 71, 66, 32, ...f32(c[0]), ...f32(c[1]), ...f32(c[2]), ...u16(2)]); });
  block(0xC002, []);
  return Uint8Array.from([65, 83, 69, 70, 0, 1, 0, 0, ...u32(cols.length + 2), ...parts]);
}
function writeGPL(colors, name) {
  return "GIMP Palette\nName: " + (name || "Brew palette") + "\nColumns: 8\n#\n" + colors.filter(isHex).map((h) => { const c = hexToRgb(h); return c.map((v) => String(v).padStart(3)).join(" ") + "\t" + h; }).join("\n") + "\n";
}

// ---- 5 Brand palette lock --------------------------------------------------
function nearestHex(hex, brand) {
  if (!brand || !brand.length) return hex;
  const p = rgbToLab(hexToRgb(hex)); let best = brand[0], bd = Infinity;
  for (const b of brand) { const d = deltaE(p, rgbToLab(hexToRgb(b))); if (d < bd) { bd = d; best = b; } }
  return best.toUpperCase();
}
// snaps every colour the deck uses (bands, swatches, stops, inks, paper, bg, replace targets) to the brand
function lockToBrand(C, brand) {
  brand = (brand || []).filter(isHex);
  if (!C || !brand.length) return C;
  const s = (h) => (isHex(h) ? nearestHex(h, brand) : h);
  if (C.tone) { C.tone.bands.forEach((b) => (b.c = s(b.c))); C.tone.bg = s(C.tone.bg); }
  if (C.pal) C.pal.colors = C.pal.colors.map(s);
  if (C.grad) C.grad.stops.forEach((x) => (x.c = s(x.c)));
  if (C.ink) { C.ink.paper = s(C.ink.paper); C.ink.inks.forEach((k) => (k.c = s(k.c))); }
  if (C.adj && C.adj.replace) C.adj.replace.forEach((r) => (r.to = s(r.to)));
  return C;
}

// ---- 10 Spot-colour layers -------------------------------------------------
// rgba (already reduced to the palette) -> one layer per colour that is used:
// { name, color: [r,g,b], mask: Uint8Array(w*h) 255 where the colour sits }
function spotLayers(rgba, w, h, colors) {
  const cols = colors.filter(isHex).map(hexToRgb), masks = cols.map(() => new Uint8Array(w * h)), used = cols.map(() => 0);
  for (let i = 0; i < w * h; i++) {
    if (!rgba[i * 4 + 3]) continue;
    let best = 0, bd = Infinity;
    for (let k = 0; k < cols.length; k++) { const c = cols[k], dd = Math.abs(rgba[i * 4] - c[0]) + Math.abs(rgba[i * 4 + 1] - c[1]) + Math.abs(rgba[i * 4 + 2] - c[2]); if (dd < bd) { bd = dd; best = k; if (!dd) break; } }
    masks[best][i] = rgba[i * 4 + 3]; used[best]++;
  }
  return cols.map((c, k) => ({ name: "Spot " + (k + 1) + " " + rgbToHex(c), color: c, mask: masks[k], pixels: used[k] })).filter((L) => L.pixels > 0);
}

// ---- 11 Proof checks -------------------------------------------------------
// Colour-blind simulation (Machado 2009, severity 1.0), in linear RGB.
const CVD = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900]
};
// CMYK gamut check: rough SWOP-like limit. A colour is flagged when its
// OKLCH chroma is above what coated CMYK reaches for that hue and lightness.
function cmykMaxChroma(L, H) {
  // peaks: yellow is bright and saturated, blue/violet is dark and duller
  const peak = 0.13 + 0.05 * Math.cos((H - 100) * Math.PI / 180), Lp = 0.62 + 0.25 * Math.cos((H - 100) * Math.PI / 180);
  return Math.max(0, peak * (1 - Math.pow((L - Lp) / (L > Lp ? 1 - Lp + 0.02 : Lp + 0.02), 2)));
}
const outOfCMYK = (rgb) => { const l = labToLch(rgbToLab(rgb)); return l[1] > cmykMaxChroma(l[0], l[2]) + 0.01; };
// in-place on an RGB (3 channel) preview: "gamut" paints flagged pixels grey-green, CVD types simulate
function proof(rgb, kind) {
  if (!kind || kind === "off") return rgb;
  if (kind === "gamut") {
    for (let i = 0; i < rgb.length; i += 3) if (outOfCMYK([rgb[i], rgb[i + 1], rgb[i + 2]])) { rgb[i] = 128; rgb[i + 1] = 255; rgb[i + 2] = 128; }
    return rgb;
  }
  const M = CVD[kind]; if (!M) return rgb;
  for (let i = 0; i < rgb.length; i += 3) {
    const r = LIN[rgb[i]], g = LIN[rgb[i + 1]], b = LIN[rgb[i + 2]];
    rgb[i] = toSRGB(M[0] * r + M[1] * g + M[2] * b); rgb[i + 1] = toSRGB(M[3] * r + M[4] * g + M[5] * b); rgb[i + 2] = toSRGB(M[6] * r + M[7] * g + M[8] * b);
  }
  return rgb;
}
const PROOFS = [{ v: "off", l: "Off" }, { v: "gamut", l: "CMYK gamut" }, { v: "protan", l: "Protan" }, { v: "deutan", l: "Deutan" }, { v: "tritan", l: "Tritan" }];

// ---- Randomise with per-swatch locks ---------------------------------------
function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// returns n colours; locked[i] keeps cur[i]; others are a random harmony in OKLCH
function randomise(cur, locked, n, seed) {
  const r = rng(seed == null ? Date.now() : seed), kinds = HARMONIES.map((h) => h.v);
  const anchor = (cur || []).find((h, i) => locked && locked[i] && isHex(h));
  const base = anchor || lchHex(0.6, 0.08 + r() * 0.12, r() * 360);
  const fresh = harmony(base, kinds[Math.floor(r() * kinds.length)], n);
  // jitter so two presses differ even with the same harmony
  return fresh.map((h, i) => (locked && locked[i] && isHex(cur[i]) ? cur[i] : (() => { const l = hexLch(h); return lchHex(clamp(l[0] + (r() - 0.5) * 0.08, 0.05, 0.98), l[1] * (0.8 + r() * 0.4), l[2] + (r() - 0.5) * 20); })()));
}

module.exports = {
  isHex, hexToRgb, rgbToHex, rgbToLab, labToRgb, labToLch, lchHex, hexLch, deltaE,
  MAX_STOPS, GRADIENTS, gradLUT, INKSETS, inkLUT,
  DEFAULT_ADJ, adjActive, grader, grade,
  DITHERS, reduce, HARMONIES, harmony,
  parseHexList, parseGPL, parseASE, parseACO, importPalette, writeASE, writeGPL, cielabToRgb,
  nearestHex, lockToBrand, spotLayers, CVD, proof, PROOFS, outOfCMYK, randomise
};
