"use strict";
// ======================================================================
// Colour Deck: the suite's shared colour control (Frank, 2026-11-22).
// Pure maths, no host calls. Two modes on top of any tool's result:
//   Tone Map  1..6 colours, each owning a tone range [a..b] (0 = black,
//             100 = white). Overlaps blend Hard / Smooth / Dither; tones no
//             colour covers show the Background (or nothing with Knockout).
//   Palette   2..16 swatches; every pixel snaps to the nearest one, plain
//             or dithered. Extract builds a palette from an image.
// The result is one RGBA layer ("Colour Deck") the panel puts at the top of
// the tool's group at Mix opacity, so the tool's own layers stay untouched.
//
// State (lives at state.deck in every tool):
//   { mode: "off" | "tone" | "palette", mix: 0..100, contrast: -100..100,
//     tone: { n, bands: [{ c: "#RRGGBB", a: 0..100, b: 0..100 }] (6 slots),
//             trans: "hard" | "smooth" | "dither", spread: 0..100,
//             bg: "#RRGGBB", knockout: bool },
//     pal:  { colors: ["#RRGGBB", ...], count: 2..16, match: "nearest" | "dither"
//             | "none" | "bayer" | "floyd" | "atkinson" | "blue", metric: "oklab" | "rgb", locks: [bool] },
//     3.0:  mode "gradient" | "inks" | "grade" as well;
//           grad: { stops: [{ c, p: 0..100 }] (2..16) }, ink: { n: 1..3, paper, inks: [{ c, g, lo, hi }] },
//           adj: { hue, sat, light, temp, tint, sh/mid/hi: { h, a }, replace: [{ from, to, tol, soft, on }] }
//           (applied before every mode), blend: PS blend mode of the deck layer, proof (preview only),
//           brandLock: bool (colours snap to the team brand palette) }
// ======================================================================
const K = require("./colour3.js");   // 3.0 colour tools (gradient, inks, grade, reduction, proof...)
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const isHex = (h) => /^#[0-9A-Fa-f]{6}$/.test(String(h));
function hexToRgb(h) { h = String(h).replace("#", ""); return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0]; }
function rgbToHex(c) { return "#" + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase(); }
const luma = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];

const MAX_BANDS = 6, MAX_SWATCHES = 16;

// ---- presets -----------------------------------------------------------
// Tone maps: colours listed dark -> light; ranges are spread evenly with a
// little overlap unless given.
function evenBands(cols, overlap) {
  const n = cols.length, w = 100 / n, ov = overlap == null ? 8 : overlap;
  return cols.map((c, i) => ({ c, a: Math.round(clamp(i * w - (i ? ov : 0), 0, 100)), b: Math.round(clamp((i + 1) * w + (i < n - 1 ? ov : 0), 0, 100)) }));
}
const TM = (id, name, cols, bg, extra) => Object.assign({ id, name, bands: evenBands(cols), bg: bg || "#000000", knockout: !bg }, extra || {});
const TONEMAPS = [
  TM("ember", "Ember", ["#1E2A8C", "#C2389E", "#FF6A1F", "#FFC234", "#CFE6FF"], "#120806"),
  TM("ice", "Ice Phosphor", ["#03123A", "#0D5CC4", "#29C6FF", "#E0FBFF"], "#000308"),
  TM("neon", "Neon Night", ["#2A0845", "#FF2A6D", "#05D9E8", "#D1F7FF"], "#0D0221"),
  TM("riso", "Riso Pink + Blue", ["#0078BF", "#FF48B0", "#F5F0E6"], "#F5F0E6"),
  TM("duonavy", "Navy Duotone", ["#1B2A49", "#F4EBD0"], "#F4EBD0", { trans: "smooth" }),
  TM("green", "Green Phosphor", ["#002B0C", "#00A83A", "#7CFF9B"], "#000000"),
  TM("amber", "Amber Phosphor", ["#2A1200", "#C46A00", "#FFB000", "#FFE6A8"], "#000000"),
  TM("vapor", "Vaporwave", ["#2B0B3F", "#B83B5E", "#F08A5D", "#F9ED69"], "#1A0626"),
  TM("toxic", "Toxic", ["#0A1F00", "#3FA300", "#C6FF00"], "#000000"),
  TM("sunset", "Sunset", ["#2D0A31", "#AB2B6E", "#F05A28", "#FFB830", "#FFF3B0"], "#14040F"),
  TM("ocean", "Ocean Depth", ["#03045E", "#0077B6", "#00B4D8", "#CAF0F8"], "#01022A"),
  TM("blood", "Blood Moon", ["#1A0000", "#8A0303", "#FF3B30", "#FFD6C9"], "#050000"),
  TM("cyano", "Cyanotype", ["#0B2A4A", "#1B5E8C", "#6FA8D6", "#E8F1F8"], "#E8F1F8", { trans: "smooth" }),
  TM("sepia", "Sepia", ["#2B1B0E", "#8A6239", "#D8B98A", "#F6EBD3"], "#F6EBD3", { trans: "smooth" }),
  TM("hologram", "Hologram", ["#1B0B4F", "#7B2FF7", "#00F0FF", "#B8FFF4", "#FFFFFF"], "#05001A"),
  TM("mono", "Ink on Transparent", ["#111111", "#8C8C8C"], null)
];
const PALETTES = [
  { id: "gameboy", name: "Game Boy", colors: ["#0F380F", "#306230", "#8BAC0F", "#9BBC0F"] },
  { id: "nokia", name: "Nokia 3310", colors: ["#43523D", "#C7F0D8"] },
  { id: "pico8", name: "PICO-8 (16)", colors: ["#000000", "#1D2B53", "#7E2553", "#008751", "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8", "#FF004D", "#FFA300", "#FFEC27", "#00E436", "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA"] },
  { id: "sweetie16", name: "Sweetie 16", colors: ["#1A1C2C", "#5D275D", "#B13E53", "#EF7D57", "#FFCD75", "#A7F070", "#38B764", "#257179", "#29366F", "#3B5DC9", "#41A6F6", "#73EFF7", "#F4F4F4", "#94B0C2", "#566C86", "#333C57"] },
  { id: "c64", name: "Commodore 64", colors: ["#000000", "#FFFFFF", "#68372B", "#70A4B2", "#6F3D86", "#588D43", "#352879", "#B8C76F", "#6F4F25", "#433900", "#9A6759", "#444444", "#6C6C6C", "#9AD284", "#6C5EB5", "#959595"] },
  { id: "ega16", name: "EGA (16)", colors: ["#000000", "#0000AA", "#00AA00", "#00AAAA", "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA", "#555555", "#5555FF", "#55FF55", "#55FFFF", "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF"] },
  { id: "cga1", name: "CGA palette 1", colors: ["#000000", "#55FFFF", "#FF55FF", "#FFFFFF"] },
  { id: "zx", name: "ZX Spectrum", colors: ["#000000", "#0000D7", "#D70000", "#D700D7", "#00D700", "#00D7D7", "#D7D700", "#D7D7D7"] },
  { id: "bw", name: "Black & White", colors: ["#000000", "#FFFFFF"] },
  { id: "newsprint", name: "Newsprint", colors: ["#141414", "#6E6A63", "#BDB8AD", "#F2EFE6"] },
  { id: "riso5", name: "Riso 5", colors: ["#000000", "#0078BF", "#FF48B0", "#FFE800", "#00A95C"] },
  { id: "neon", name: "Neon Night", colors: ["#0D0221", "#FF2A6D", "#05D9E8", "#D1F7FF", "#F9C80E"] },
  { id: "lily", name: "Poster Lily", colors: ["#0E1B3D", "#5B6B2E", "#F2A48A", "#F4E6C8", "#E8432E", "#B5163A", "#2F7BFF"] },
  { id: "pastel", name: "Pastel", colors: ["#F8EDEB", "#FFB5A7", "#FCD5CE", "#F9DCC4", "#FEC89A", "#D8E2DC"] },
  { id: "earth", name: "Earth Tones", colors: ["#2F1B0C", "#6F4E37", "#A47148", "#D9B38C", "#F2E8CF", "#606C38"] },
  { id: "sunset", name: "Sunset", colors: ["#2D0A31", "#6A0572", "#AB2B6E", "#F05A28", "#FFB830", "#FFF3B0"] },
  { id: "ocean", name: "Ocean", colors: ["#03045E", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"] },
  { id: "terminal", name: "Terminal Green", colors: ["#000000", "#003B00", "#008F11", "#00FF41"] },
  { id: "amber", name: "Amber CRT", colors: ["#000000", "#3A1F00", "#A35A00", "#FFB000"] },
  { id: "vapor", name: "Vaporwave", colors: ["#2B0B3F", "#6A2C70", "#B83B5E", "#F08A5D", "#F9ED69", "#08D9D6"] },
  { id: "screen6", name: "Screen Print 6", colors: ["#1A1A1A", "#E63946", "#F1FAEE", "#A8DADC", "#457B9D", "#FFB703"] },
  { id: "candy", name: "Candy Shop", colors: ["#2B2D42", "#EF233C", "#FF8FA3", "#FFD6E0", "#8D99AE", "#EDF2F4"] }
];

const DEFAULT_COLOUR = {
  mode: "off", mix: 100, contrast: 0, solo: false, inks: false,
  tone: { n: 5, bands: padBands(TONEMAPS[0].bands), trans: "dither", spread: 50, bg: TONEMAPS[0].bg, knockout: false },
  pal: { colors: PALETTES[12].colors.slice(), count: 7, match: "nearest", metric: "oklab", locks: [] },
  grad: { stops: K.GRADIENTS[0].stops.map((x) => Object.assign({}, x)) },
  ink: { n: 2, paper: K.INKSETS[0].paper, inks: K.INKSETS[0].inks.map((x) => Object.assign({}, x)).concat([{ c: "#FFE800", g: 0.8, lo: 0, hi: 60 }]).slice(0, 3) },
  adj: JSON.parse(JSON.stringify(K.DEFAULT_ADJ)), blend: "normal", proof: "off", brandLock: false
};
function padBands(b) {
  const out = b.map((x) => ({ c: x.c, a: x.a, b: x.b }));
  while (out.length < MAX_BANDS) out.push({ c: "#FFFFFF", a: 90, b: 100 });
  return out.slice(0, MAX_BANDS);
}
function cloneColour(c) { return JSON.parse(JSON.stringify(c || DEFAULT_COLOUR)); }
// fill missing keys from defaults (old saved looks have no colour block)
function normalize(c) {
  const d = cloneColour(DEFAULT_COLOUR);
  if (!c || typeof c !== "object") return d;
  const out = Object.assign(d, c);
  out.tone = Object.assign(cloneColour(DEFAULT_COLOUR).tone, c.tone || {});
  out.tone.bands = padBands((out.tone.bands || []).filter((x) => x && isHex(x.c)));
  out.tone.n = clamp(Math.round(out.tone.n) || 1, 1, MAX_BANDS);
  out.pal = Object.assign(cloneColour(DEFAULT_COLOUR).pal, c.pal || {});
  out.pal.colors = (out.pal.colors || []).filter(isHex).slice(0, MAX_SWATCHES);
  if (out.pal.colors.length < 1) out.pal.colors = ["#000000", "#FFFFFF"];
  if (!c.pal || !c.pal.metric) out.pal.metric = c.pal ? "rgb" : "oklab";   // saved 1.x/2.x decks keep their exact match
  const D = cloneColour(DEFAULT_COLOUR);
  out.grad = Object.assign(D.grad, c.grad || {});
  out.grad.stops = (out.grad.stops || []).filter((x) => x && isHex(x.c)).slice(0, K.MAX_STOPS);
  if (out.grad.stops.length < 2) out.grad.stops = D.grad.stops;
  out.ink = Object.assign(D.ink, c.ink || {});
  out.ink.inks = (out.ink.inks || []).filter((x) => x && isHex(x.c)).slice(0, 3);
  while (out.ink.inks.length < 3) out.ink.inks.push({ c: "#000000", g: 1, lo: 0, hi: 100 });
  out.ink.n = clamp(Math.round(out.ink.n) || 2, 1, 3);
  out.adj = Object.assign(D.adj, c.adj || {});
  out.adj.replace = (out.adj.replace || []).slice(0, 4);
  return out;
}
function applyToneMap(C, tm) {
  C.tone.n = tm.bands.length;
  C.tone.bands = padBands(tm.bands);
  C.tone.bg = tm.bg; C.tone.knockout = !!tm.knockout;
  if (tm.trans) C.tone.trans = tm.trans;
  return C;
}
function evenSpread(C) { const t = C.tone, b = evenBands(t.bands.slice(0, t.n).map((x) => x.c)); for (let i = 0; i < t.n; i++) { t.bands[i].a = b[i].a; t.bands[i].b = b[i].b; } return C; }
function reverse(C) { const t = C.tone, cols = t.bands.slice(0, t.n).map((x) => x.c).reverse(); for (let i = 0; i < t.n; i++) t.bands[i].c = cols[i]; return C; }

// ---- ordered-dither threshold (8x8 Bayer), 0..1
const BAYER = (() => {
  const m = [[0, 2], [3, 1]];
  let M = m;
  for (let s = 2; s < 8; s *= 2) {
    const N = [];
    for (let y = 0; y < s * 2; y++) { N.push([]); for (let x = 0; x < s * 2; x++) N[y].push(4 * M[y % s][x % s] + m[(y / s) | 0][(x / s) | 0]); }
    M = N;
  }
  const f = new Float32Array(64);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) f[y * 8 + x] = (M[y][x] + 0.5) / 64;
  return f;
})();

// ---- Tone Map table: for each tone 0..255 -> {i, j, t} (two band indices
// and the mix between them); i = -1 means background.
function toneTable(tone) {
  const n = clamp(tone.n | 0, 1, MAX_BANDS), bands = tone.bands.slice(0, n).map((b, k) => {
    const a = clamp(Math.min(b.a, b.b), 0, 100) / 100 * 255, z = clamp(Math.max(b.a, b.b), 0, 100) / 100 * 255;
    return { k, a, z, mid: (a + z) / 2, c: hexToRgb(b.c) };
  });
  const I = new Int8Array(256), J = new Int8Array(256), T = new Float32Array(256);
  const sharp = 1 + (100 - clamp(tone.spread == null ? 50 : tone.spread, 0, 100)) / 25;   // 1..5
  for (let v = 0; v < 256; v++) {
    const hit = bands.filter((b) => v >= b.a - 0.5 && v <= b.z + 0.5).sort((p, q) => Math.abs(v - p.mid) - Math.abs(v - q.mid));
    if (!hit.length) { I[v] = -1; J[v] = -1; T[v] = 0; continue; }
    if (hit.length === 1) { I[v] = hit[0].k; J[v] = hit[0].k; T[v] = 0; continue; }
    // two nearest: lower-mid band p, higher-mid band q
    let p = hit[0], q = hit[1];
    if (p.mid > q.mid) { const s = p; p = q; q = s; }
    const lo = Math.max(p.a, q.a), hi = Math.min(p.z, q.z);           // overlap span
    let t = hi > lo ? (v - lo) / (hi - lo) : (v >= (p.mid + q.mid) / 2 ? 1 : 0);
    t = clamp((t - 0.5) * sharp + 0.5, 0, 1);
    I[v] = p.k; J[v] = q.k; T[v] = t;
  }
  return { I, J, T, cols: bands.map((b) => b.c) };
}

function contrastLUT(c) {
  const k = 1 + clamp(c || 0, -100, 100) / 100, lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) lut[v] = clamp(Math.round((v - 128) * k + 128), 0, 255);
  return lut;
}

// Recolour an image. img = { w, h, c (3|4), data }. Returns Uint8ClampedArray RGBA.
// Pixels with alpha 0 in the input stay transparent.
function render(img, C) {
  C = normalize(C);
  // 3.0: grade first (hue/sat/temp, tone wheels, colour replace) so every mode sees it
  if (K.adjActive(C.adj) && C.mode !== "off") img = { w: img.w, h: img.h, c: img.c || 4, data: K.grade(img.data, img.c || 4, C.adj) };
  const w = img.w, h = img.h, ch = img.c || 4, d = img.data, n = w * h, out = new Uint8ClampedArray(n * 4);
  const cl = contrastLUT(C.contrast);
  if (C.mode === "gradient" || C.mode === "inks") {
    const lut = C.mode === "gradient" ? K.gradLUT(C.grad.stops) : K.inkLUT(C.ink);
    for (let i = 0; i < n; i++) {
      const s = i * ch, o = i * 4;
      if (ch === 4 && d[s + 3] === 0) continue;
      const v = cl[Math.round(0.299 * d[s] + 0.587 * d[s + 1] + 0.114 * d[s + 2])] * 3;
      out[o] = lut[v]; out[o + 1] = lut[v + 1]; out[o + 2] = lut[v + 2]; out[o + 3] = 255;
    }
    return out;
  }
  if (C.mode === "grade") {
    for (let i = 0; i < n; i++) { const s = i * ch, o = i * 4; if (ch === 4 && d[s + 3] === 0) continue; out[o] = cl[d[s]]; out[o + 1] = cl[d[s + 1]]; out[o + 2] = cl[d[s + 2]]; out[o + 3] = 255; }
    return out;
  }
  if (C.mode === "palette" && (C.pal.metric === "oklab" || !/^(nearest|dither)$/.test(C.pal.match))) {
    const cols = C.pal.colors.slice(0, clamp(C.pal.count | 0, 1, MAX_SWATCHES)).map(hexToRgb);
    const dm = C.pal.match === "nearest" ? "none" : C.pal.match === "dither" ? "bayer" : C.pal.match;
    let src = img;
    if (C.contrast) { const dd = new Uint8ClampedArray(d.length); for (let i = 0; i < d.length; i++) dd[i] = ch === 4 && i % 4 === 3 ? d[i] : cl[d[i]]; src = { w, h, c: ch, data: dd }; }
    return K.reduce(src, cols, dm, BAYER);
  }
  if (C.mode === "tone") {
    const tb = toneTable(C.tone), bg = hexToRgb(C.tone.bg), ko = !!C.tone.knockout, mode = C.tone.trans || "dither";
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      const s = i * ch, o = i * 4;
      if (ch === 4 && d[s + 3] === 0) continue;
      const v = cl[Math.round(0.299 * d[s] + 0.587 * d[s + 1] + 0.114 * d[s + 2])];
      const a = tb.I[v];
      if (a < 0) { if (!ko) { out[o] = bg[0]; out[o + 1] = bg[1]; out[o + 2] = bg[2]; out[o + 3] = 255; } continue; }
      const b = tb.J[v], t = tb.T[v], ca = tb.cols[a], cb = tb.cols[b];
      if (a === b || t <= 0) { out[o] = ca[0]; out[o + 1] = ca[1]; out[o + 2] = ca[2]; }
      else if (mode === "smooth") { out[o] = ca[0] + (cb[0] - ca[0]) * t; out[o + 1] = ca[1] + (cb[1] - ca[1]) * t; out[o + 2] = ca[2] + (cb[2] - ca[2]) * t; }
      else {
        const pick = mode === "hard" ? (t >= 0.5) : (t > BAYER[(y & 7) * 8 + (x & 7)]);
        const c = pick ? cb : ca; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2];
      }
      out[o + 3] = 255;
    }
    return out;
  }
  if (C.mode === "palette") {
    const cols = C.pal.colors.slice(0, clamp(C.pal.count | 0, 1, MAX_SWATCHES)).map(hexToRgb), m = cols.length, dith = C.pal.match === "dither";
    const cache = new Map();
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      const s = i * ch, o = i * 4;
      if (ch === 4 && d[s + 3] === 0) continue;
      const r = cl[d[s]], g = cl[d[s + 1]], bl = cl[d[s + 2]], key = (r << 16) | (g << 8) | bl;
      let e = cache.get(key);
      if (!e) {
        let b1 = 0, d1 = Infinity, b2 = 0, d2 = Infinity;
        for (let k = 0; k < m; k++) {
          const c = cols[k], dr = r - c[0], dg = g - c[1], db = bl - c[2], dd = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
          if (dd < d1) { d2 = d1; b2 = b1; d1 = dd; b1 = k; } else if (dd < d2) { d2 = dd; b2 = k; }
        }
        const s1 = Math.sqrt(d1), s2 = Math.sqrt(d2);
        e = { b1, b2, t: m > 1 && s1 + s2 > 0 ? s1 / (s1 + s2) : 0 };
        if (cache.size < 65536) cache.set(key, e);
      }
      const c = dith && e.t > BAYER[(y & 7) * 8 + (x & 7)] ? cols[e.b2] : cols[e.b1];
      out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
    }
    return out;
  }
  // off: plain copy
  for (let i = 0; i < n; i++) { const s = i * ch, o = i * 4; out[o] = d[s]; out[o + 1] = d[s + 1]; out[o + 2] = d[s + 2]; out[o + 3] = ch === 4 ? d[s + 3] : 255; }
  return out;
}

// Blend the Colour Deck layer over a composited RGB preview, in place.
function overPreview(rgb, deck, mix) {
  const k = clamp(mix == null ? 100 : mix, 0, 100) / 100, n = rgb.length / 3;
  for (let i = 0; i < n; i++) {
    const a = deck[i * 4 + 3] / 255 * k;
    if (!a) continue;
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = rgb[i * 3 + c] + (deck[i * 4 + c] - rgb[i * 3 + c]) * a;
  }
  return rgb;
}

// ---- Extract: median cut on an image -> k hex colours, dark -> light
function extract(img, k) {
  const n = img.w * img.h, ch = img.c || 4, step = Math.max(1, Math.floor(n / 20000)), samples = [];
  for (let i = 0; i < n; i += step) { const s = i * ch; if (ch === 4 && img.data[s + 3] < 128) continue; samples.push([img.data[s], img.data[s + 1], img.data[s + 2]]); }
  if (!samples.length) return ["#000000", "#FFFFFF"];
  k = clamp(Math.round(k) || 6, 2, MAX_SWATCHES);
  const boxes = [samples];
  while (boxes.length < k) {
    let bi = -1, best = 0, bch = 0;
    for (let b = 0; b < boxes.length; b++) {
      const box = boxes[b]; if (box.length < 2) continue;
      const mn = [255, 255, 255], mx = [0, 0, 0];
      for (const p of box) for (let c = 0; c < 3; c++) { if (p[c] < mn[c]) mn[c] = p[c]; if (p[c] > mx[c]) mx[c] = p[c]; }
      for (let c = 0; c < 3; c++) { const sc = (mx[c] - mn[c]) * Math.sqrt(box.length); if (sc > best) { best = sc; bi = b; bch = c; } }
    }
    if (bi < 0) break;
    const box = boxes[bi].sort((a, b) => a[bch] - b[bch]), mid = box.length >> 1;
    boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid));
  }
  return boxes.map((box) => { const s = [0, 0, 0]; for (const p of box) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; } return s.map((v) => v / box.length); })
    .sort((a, b) => luma(a) - luma(b)).map(rgbToHex);
}

// 256 x 1 RGB strip of the current map, for the panel's colour strip
function strip(C, width) {
  C = normalize(C);
  const w = width || 256, data = new Uint8Array(w * 8 * 3);
  for (let y = 0; y < 8; y++) for (let x = 0; x < w; x++) { const v = Math.round(x / (w - 1) * 255), o = (y * w + x) * 3; data[o] = data[o + 1] = data[o + 2] = v; }
  const rgba = render({ w, h: 8, c: 3, data }, C), out = new Uint8Array(w * 8 * 3);
  for (let i = 0; i < w * 8; i++) {
    const a = rgba[i * 4 + 3] / 255, chk = ((i % w) >> 2 ^ (i / w) >> 2) & 1 ? 70 : 40;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = rgba[i * 4 + c] * a + chk * (1 - a);
  }
  return { rgb: out, w, h: 8 };
}

const MODES = ["tone", "palette", "gradient", "inks", "grade"];
const LABELS = { tone: "Tone Map", palette: "Palette", gradient: "Gradient Map", inks: "Inks", grade: "Grade" };
const active = (C) => !!C && MODES.includes(C.mode);
const label = (C) => !active(C) ? "" : C.mode === "inks" ? ["", "Monotone", "Duotone", "Tritone"][clamp((C.ink && C.ink.n) || 2, 1, 3)] : LABELS[C.mode];
// colours the current mode uses (for Randomise, Spot layers, swatch export)
function colours(C) {
  C = normalize(C);
  if (C.mode === "tone") return C.tone.bands.slice(0, C.tone.n).map((b) => b.c);
  if (C.mode === "gradient") return C.grad.stops.map((x) => x.c);
  if (C.mode === "inks") return [C.ink.paper].concat(C.ink.inks.slice(0, C.ink.n).map((k) => k.c));
  return C.pal.colors.slice(0, C.pal.count);
}
function setColours(C, cols) {
  if (C.mode === "tone") cols.forEach((h, i) => { if (C.tone.bands[i]) C.tone.bands[i].c = h; });
  else if (C.mode === "gradient") cols.forEach((h, i) => { if (C.grad.stops[i]) C.grad.stops[i].c = h; });
  else if (C.mode === "inks") { C.ink.paper = cols[0] || C.ink.paper; cols.slice(1).forEach((h, i) => { if (C.ink.inks[i]) C.ink.inks[i].c = h; }); }
  else cols.forEach((h, i) => { C.pal.colors[i] = h; });
  return C;
}

module.exports = { K, MODES, colours, setColours, DEFAULT_COLOUR, TONEMAPS, PALETTES, MAX_BANDS, MAX_SWATCHES, normalize, cloneColour, applyToneMap, evenSpread, reverse, toneTable, render, overPreview, extract, strip, active, label, hexToRgb, rgbToHex };
