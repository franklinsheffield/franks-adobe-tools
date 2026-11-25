"use strict";
// ---------------------------------------------------------------------
// Dithers ASCII 3.0 (spec "Dithers ASCII 3.0", Frank 2026-11-24):
// 20 algorithms in 4 groups, 4 built-in pixel fonts, cell size in px,
// spacing, invert, seed. Pure JS, no Photoshop calls.
//
// render(demand, w, h, O) -> Uint8Array ink mask (255 = ink)
//   demand : Uint8Array w*h, 0..255 (255 = full ink)
//   O      : { algo, font, cell (px, already scaled), spacing (px), set, custom,
//              keepOrder, edgeAmt 0..1, text, invert, seed, lum, cellMask(cx,cy) }
// The legacy 5x7 path (Luminance ramp / Edge-directional / Text halftone on the
// Classic font, no spacing, no invert) calls ascii.js unchanged, so every
// saved 2.x look renders exactly as before.
// ---------------------------------------------------------------------
const A1 = require("./ascii.js");

// ---- algorithms -------------------------------------------------------
const ALGOS = [
  { id: "luma",      g: "Tone",      n: "Luminance ramp" },
  { id: "equal",     g: "Tone",      n: "Equalised ramp" },
  { id: "ordered",   g: "Tone",      n: "Ordered ASCII" },
  { id: "diffuse",   g: "Tone",      n: "Error-diffused ASCII" },
  { id: "bluenoise", g: "Tone",      n: "Blue-noise ASCII" },
  { id: "edge",      g: "Structure", n: "Edge-directional" },
  { id: "shape",     g: "Structure", n: "Shape match" },
  { id: "shapetone", g: "Structure", n: "Shape + tone" },
  { id: "contour",   g: "Structure", n: "Contour lines" },
  { id: "box",       g: "Structure", n: "Box drawing" },
  { id: "half",      g: "Mosaic",    n: "Half blocks" },
  { id: "quad",      g: "Mosaic",    n: "Quadrant blocks" },
  { id: "sextant",   g: "Mosaic",    n: "Sextants" },
  { id: "braille",   g: "Mosaic",    n: "Braille dots" },
  { id: "adaptive",  g: "Mosaic",    n: "Adaptive cells" },
  { id: "text",      g: "Stylised",  n: "Text halftone" },
  { id: "weight",    g: "Stylised",  n: "Weight ramp" },
  { id: "overstrike",g: "Stylised",  n: "Typewriter overstrike" },
  { id: "rain",      g: "Stylised",  n: "Matrix rain" },
  { id: "glitch",    g: "Stylised",  n: "Glitch match" }
];
const GROUPS = ["Tone", "Structure", "Mosaic", "Stylised"];
const ALGO_BY_ID = {}; ALGOS.forEach((a) => (ALGO_BY_ID[a.id] = a));

// ---- fonts ------------------------------------------------------------
// Tiny 3 x 5, drawn for the suite. Missing characters fall back to a reduced Classic glyph.
const TINY_SRC = {
  "A": ".#./#.#/###/#.#/#.#", "B": "##./#.#/##./#.#/##.", "C": ".##/#../#../#../.##", "D": "##./#.#/#.#/#.#/##.",
  "E": "###/#../##./#../###", "F": "###/#../##./#../#..", "G": ".##/#../#.#/#.#/.##", "H": "#.#/#.#/###/#.#/#.#",
  "I": "###/.#./.#./.#./###", "J": "..#/..#/..#/#.#/.#.", "K": "#.#/#.#/##./#.#/#.#", "L": "#../#../#../#../###",
  "M": "#.#/###/###/#.#/#.#", "N": "##./#.#/#.#/#.#/#.#", "O": ".#./#.#/#.#/#.#/.#.", "P": "##./#.#/##./#../#..",
  "Q": ".#./#.#/#.#/##./.##", "R": "##./#.#/##./#.#/#.#", "S": ".##/#../.#./..#/##.", "T": "###/.#./.#./.#./.#.",
  "U": "#.#/#.#/#.#/#.#/###", "V": "#.#/#.#/#.#/#.#/.#.", "W": "#.#/#.#/###/###/#.#", "X": "#.#/#.#/.#./#.#/#.#",
  "Y": "#.#/#.#/.#./.#./.#.", "Z": "###/..#/.#./#../###",
  "0": "###/#.#/#.#/#.#/###", "1": ".#./##./.#./.#./###", "2": "##./..#/.#./#../###", "3": "##./..#/.#./..#/##.",
  "4": "#.#/#.#/###/..#/..#", "5": "###/#../##./..#/##.", "6": ".##/#../###/#.#/###", "7": "###/..#/.#./.#./.#.",
  "8": "###/#.#/###/#.#/###", "9": "###/#.#/###/..#/##.",
  ".": ".../.../.../.../.#.", ",": ".../.../.../.#./#..", ":": ".../.#./.../.#./...", ";": ".../.#./.../.#./#..",
  "!": ".#./.#./.#./.../.#.", "?": "##./..#/.#./.../.#.", "-": ".../.../###/.../...", "_": ".../.../.../.../###",
  "+": ".../.#./###/.#./...", "=": ".../###/.../###/...", "*": "#.#/.#./###/.#./#.#", "#": "#.#/###/#.#/###/#.#",
  "%": "#.#/..#/.#./#../#.#", "@": "###/#.#/###/#../.##", "/": "..#/..#/.#./#../#..", "\\": "#../#../.#./..#/..#",
  "|": ".#./.#./.#./.#./.#.", "'": ".#./.#./.../.../...", "\"": "#.#/#.#/.../.../...", "(": "..#/.#./.#./.#./..#",
  ")": "#../.#./.#./.#./#..", "<": "..#/.#./#../.#./..#", ">": "#../.#./..#/.#./#..", "[": "##./#../#../#../##.",
  "]": ".##/..#/..#/..#/.##", "$": ".##/##./.#./.##/##.", "&": ".#./#.#/.#./#.#/.##", "~": ".../#../###/..#/...",
  "^": ".#./#.#/.../.../...", " ": ".../.../.../.../..."
};
function parse(src, w, h) {
  const rows = src.split("/"), b = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) b[y * w + x] = rows[y] && rows[y][x] === "#" ? 1 : 0;
  return b;
}
function reduceGlyph(g5, w, h) {   // Classic 5x7 -> w x h by area coverage
  const b = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, c = 0;
    for (let yy = Math.floor(y * 7 / h); yy < Math.ceil((y + 1) * 7 / h); yy++) for (let xx = Math.floor(x * 5 / w); xx < Math.ceil((x + 1) * 5 / w); xx++) { s += g5[yy * 5 + xx]; c++; }
    b[y * w + x] = c && s / c >= 0.4 ? 1 : 0;
  }
  return b;
}
// Console 8x8: the Classic shape, one column bolder, on an 8x8 body
function consoleGlyph(g5) {
  const b = new Uint8Array(64);
  for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (g5[y * 5 + x]) { b[y * 8 + x + 1] = 1; b[y * 8 + x + 2] = 1; }
  return b;
}
// Terminal 8x16: tall thin strokes; each Classic row becomes two, horizontal runs stay 1 px
function terminalGlyph(g5) {
  const b = new Uint8Array(128);
  const at = (x, y) => (x >= 0 && x < 5 && y >= 0 && y < 7 ? g5[y * 5 + x] : 0);
  for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) {
    if (!at(x, y)) continue;
    const X = x + 1, Y = 1 + y * 2;
    b[Y * 8 + X] = 1;
    if (at(x, y + 1) || (!at(x - 1, y) && !at(x + 1, y))) b[(Y + 1) * 8 + X] = 1;   // vertical strokes and dots stay joined
  }
  return b;
}
const FONTS = [
  { id: "tiny",     name: "Tiny 3 x 5",      w: 3, h: 5 },
  { id: "classic",  name: "Classic 5 x 7",   w: 5, h: 7 },
  { id: "console",  name: "Console 8 x 8",   w: 8, h: 8 },
  { id: "terminal", name: "Terminal 8 x 16", w: 8, h: 16 }
];
const FONT_BY_ID = {}; FONTS.forEach((f) => (FONT_BY_ID[f.id] = f));
const glyphCache = {};
function glyph(fontId, ch) {
  const key = fontId + "|" + ch;
  if (key in glyphCache) return glyphCache[key];
  const g5 = A1.glyphBits(ch);
  let g = null;
  if (fontId === "tiny") { const s = TINY_SRC[ch] || TINY_SRC[String(ch).toUpperCase()]; g = s ? parse(s, 3, 5) : (g5 ? reduceGlyph(g5, 3, 5) : null); }
  else if (!g5) g = null;
  else if (fontId === "console") g = consoleGlyph(g5);
  else if (fontId === "terminal") g = terminalGlyph(g5);
  else g = g5;
  glyphCache[key] = g;
  return g;
}
function cov(b) { let c = 0; for (let i = 0; i < b.length; i++) c += b[i]; return c / b.length; }

// procedural sets (Blocks / Dots / Bars) drawn at any font size
function procRamp(kind, fw, fh) {
  const B = bayerN(8), out = [];
  if (kind === "blocks") {
    const cells = []; for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) cells.push({ i: y * fw + x, v: B[y % 8][x % 8] });
    cells.sort((a, b) => a.v - b.v || a.i - b.i);
    for (let l = 0; l < 9; l++) { const b = new Uint8Array(fw * fh); const n = Math.round(l / 8 * cells.length); for (let k = 0; k < n; k++) b[cells[k].i] = 1; out.push(b); }
  } else if (kind === "dots") {
    for (let l = 0; l < 8; l++) {
      const b = new Uint8Array(fw * fh), r = (0.08 + l / 7 * 0.62) * Math.max(fw, fh);
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const dx = x + 0.5 - fw / 2, dy = (y + 0.5 - fh / 2) * (fw / fh); if (Math.sqrt(dx * dx + dy * dy) <= r) b[y * fw + x] = 1; }
      out.push(b);
    }
  } else {   // bars
    for (let l = 0; l <= 5; l++) { const b = new Uint8Array(fw * fh); for (let y = 0; y < fh; y++) if (l && (y % Math.max(1, Math.round(fh / (l + 1))) === 0 || l === 5)) for (let x = 0; x < fw; x++) b[y * fw + x] = 1; out.push(b); }
  }
  return out;
}
function bayerN(n) {
  let m = [[0]], s = 1;
  while (s < n) { const nm = []; for (let y = 0; y < s * 2; y++) { nm[y] = []; for (let x = 0; x < s * 2; x++) nm[y][x] = m[y % s][x % s] * 4 + ((y < s) ? ((x < s) ? 0 : 2) : ((x < s) ? 3 : 1)); } m = nm; s *= 2; }
  return m;
}
const BAYER = bayerN(8);

// light -> dark glyph list for a character set on a font: [{ b, c }] (blank first)
function buildRamp(fontId, setId, custom, keepOrder) {
  const f = FONT_BY_ID[fontId] || FONT_BY_ID.classic;
  const set = A1.ASCII_SETS.find((s) => s.id === setId) || A1.ASCII_SETS[0];
  let list;
  if (set.proc) list = procRamp(set.proc, f.w, f.h).map((b) => ({ b, c: cov(b) }));
  else {
    const chars = set.custom ? String(custom || "FRANK") : set.chars, seen = {};
    list = [];
    for (const ch of chars) { if (seen[ch]) continue; seen[ch] = 1; const b = glyph(f.id, ch); if (b && cov(b) > 0) list.push({ b, c: cov(b), ch }); }
    if (!list.length) list.push({ b: glyph(f.id, "#"), c: cov(glyph(f.id, "#")), ch: "#" });
    if (!(set.custom && keepOrder)) list.sort((a, b) => a.c - b.c);
  }
  if (!list.length || list[0].c !== 0) list.unshift({ b: new Uint8Array(f.w * f.h), c: 0, ch: " " });
  return { font: f, list };
}

// ---- helpers ------------------------------------------------------------
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s | 0) * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
// cheap blue-ish noise: interleaved gradient noise, offset by seed
function ign(x, y, s) { const ox = (s * 5.588238) % 64, oy = (s * 3.141592) % 64; const v = 52.9829189 * ((0.06711056 * (x + ox) + 0.00583715 * (y + oy)) % 1); return v - Math.floor(v); }

function geom(O) {
  const f = FONT_BY_ID[O.font] || FONT_BY_ID.classic;
  const k = Math.max(1, Math.round((O.cell || 8) / (f.h + 1)));
  const sp = Math.max(0, Math.round(O.spacing || 0));
  return { f, k, sp, cw: (f.w + 1) * k + sp, ch: (f.h + 1) * k + sp };
}

// stamp a w x h bitmap at scale k into the cell origin
function stamp(target, W, H, x0, y0, b, bw, bh, k) {
  for (let gy = 0; gy < bh; gy++) for (let gx = 0; gx < bw; gx++) {
    if (!b[gy * bw + gx]) continue;
    const bx = x0 + gx * k, by = y0 + gy * k;
    for (let yy = by; yy < by + k && yy < H; yy++) { if (yy < 0) continue; const r = yy * W; for (let xx = bx; xx < bx + k && xx < W; xx++) if (xx >= 0) target[r + xx] = 255; }
  }
}
function fillRect(target, W, H, x0, y0, x1, y1) {
  for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) { const r = y * W; for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) target[r + x] = 255; }
}

// per-cell mean demand (0..1) and the cell's samples on the font grid (for shape matching)
function cellStats(demand, W, H, G, wantSamples) {
  const cols = Math.ceil(W / G.cw), rows = Math.ceil(H / G.ch);
  const mean = new Float32Array(cols * rows);
  const fw = G.f.w, fh = G.f.h, gw = (fw + 1) * G.k, gh = (fh + 1) * G.k;
  const samp = wantSamples ? new Float32Array(cols * rows * fw * fh) : null;
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const x0 = cx * G.cw, y0 = cy * G.ch, x1 = Math.min(W, x0 + G.cw), y1 = Math.min(H, y0 + G.ch);
    let s = 0, c = 0;
    for (let y = y0; y < y1; y++) { const r = y * W; for (let x = x0; x < x1; x++) { s += demand[r + x]; c++; } }
    mean[cy * cols + cx] = c ? s / (c * 255) : 0;
    if (samp) {
      const base = (cy * cols + cx) * fw * fh;
      for (let gy = 0; gy < fh; gy++) for (let gx = 0; gx < fw; gx++) {
        const sx0 = x0 + Math.floor(gx * gw / fw), sx1 = Math.max(sx0 + 1, x0 + Math.floor((gx + 1) * gw / fw));
        const sy0 = y0 + Math.floor(gy * gh / fh), sy1 = Math.max(sy0 + 1, y0 + Math.floor((gy + 1) * gh / fh));
        let a = 0, n = 0;
        for (let y = sy0; y < Math.min(H, sy1); y++) for (let x = sx0; x < Math.min(W, sx1); x++) { a += demand[y * W + x]; n++; }
        samp[base + gy * fw + gx] = n ? a / (n * 255) : mean[cy * cols + cx];
      }
    }
  }
  return { cols, rows, mean, samp };
}

// orientation of the cell's luminance gradient: 0 "-", 1 "\", 2 "|", 3 "/" (null when flat)
function cellEdge(lum, W, H, x0, y0, x1, y1, amt) {
  let gxx = 0, gxy = 0, mag2 = 0, cnt = 0;
  for (let y = Math.max(1, y0); y < Math.min(H - 1, y1); y++) for (let x = Math.max(1, x0); x < Math.min(W - 1, x1); x++) {
    const i = y * W + x;
    const gx = (lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1]) - (lum[i - W - 1] + 2 * lum[i - 1] + lum[i + W - 1]);
    const gy = (lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1]) - (lum[i - W - 1] + 2 * lum[i - W] + lum[i - W + 1]);
    gxx += gx * gx - gy * gy; gxy += 2 * gx * gy; mag2 += gx * gx + gy * gy; cnt++;
  }
  if (!cnt) return null;
  const m = Math.sqrt(mag2 / cnt) / 1020;
  if (m * 4 * amt <= 0.35) return null;
  let phi = Math.atan2(gxy, gxx) / 2 + Math.PI / 2;
  phi = ((phi % Math.PI) + Math.PI) % Math.PI;
  return Math.round(phi / (Math.PI / 4)) % 4;
}

// ---- main ---------------------------------------------------------------
function isLegacy(O) {
  return (O.font || "classic") === "classic" && !(O.spacing > 0) && !O.invert && (["luma", "edge", "text"].indexOf(O.algo || "luma") >= 0);
}

function render(demandIn, W, H, O) {
  const algo = ALGO_BY_ID[O.algo] ? O.algo : "luma";
  let demand = demandIn;
  // O.bright: glyphs on dark paper, so bright areas get the dense glyphs (colour glyph modes)
  if (!!O.invert !== !!O.bright) { demand = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) demand[i] = 255 - demandIn[i]; }
  if (O.bright) {
    // dark photos would leave the page empty: stretch the 2nd..99th percentile to the full range
    const N = W * H, hist = new Uint32Array(256);
    for (let i = 0; i < N; i++) hist[demand[i]]++;
    let lo = 0, hi = 255, acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= N * 0.02) { lo = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= N * 0.01) { hi = v; break; } }
    if (hi - lo > 8 && (lo > 0 || hi < 255)) {
      const src = demand === demandIn ? demandIn : demand, d2 = new Uint8Array(N), sc = 255 / (hi - lo);
      for (let i = 0; i < N; i++) { const v = (src[i] - lo) * sc; d2[i] = v < 0 ? 0 : v > 255 ? 255 : v; }
      demand = d2;
    }
  }
  const legacy = isLegacy(O) && !O.bright;
  if (legacy) {
    // the exact 2.x renderer (byte-identical for saved looks)
    const k = Math.max(1, Math.round((O.cell || 8) / 8));
    const ramp = A1.buildRamp(O.set, O.custom, O.keepOrder);
    const edgeAmt = algo === "edge" ? Math.max(0.35, O.edgeAmt || 0.7) : (O.edgeAmt || 0);
    const rampUse = algo === "edge" ? [new Uint8Array(35)] : ramp;
    return A1.asciiInk(demand, W, H, { k, ramp: rampUse, lum: O.lum, edgeAmt, textMode: algo === "text" || !!O.textMode, text: O.text, cellMask: O.cellMask }, O.out);
  }
  const out = O.cellMask ? null : (O.out || new Uint8Array(W * H));
  const G = geom(O);
  const R = buildRamp(G.f.id, O.set, O.custom, O.keepOrder);
  const list = R.list, nr = list.length, fw = G.f.w, fh = G.f.h, k = G.k;
  const needSamples = algo === "shape" || algo === "shapetone";
  const S = cellStats(demand, W, H, G, needSamples);
  const { cols, rows, mean } = S;
  const seed = O.seed | 0;
  const tgt = (cx, cy) => (O.cellMask ? O.cellMask(cx, cy) : out);
  const put = (cx, cy, b, bw, bh) => { const t = tgt(cx, cy); if (t && b) stamp(t, W, H, cx * G.cw, cy * G.ch, b, bw || fw, bh || fh, k); };
  const level = (t) => Math.min(nr - 1, Math.floor(t * nr));
  const edgeG = ["-", "\\", "|", "/"].map((c) => glyph(G.f.id, c));
  const lumI = O.lum || (() => { const l = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) l[i] = 255 - demand[i]; return l; })();

  if (algo === "luma" || algo === "equal" || algo === "ordered" || algo === "bluenoise" || algo === "glitch") {
    let map = null;
    if (algo === "equal") {   // histogram equalisation over cell tones
      const hist = new Float32Array(256); for (let i = 0; i < mean.length; i++) hist[Math.round(mean[i] * 255)]++;
      map = new Float32Array(256); let acc = 0; for (let v = 0; v < 256; v++) { acc += hist[v]; map[v] = acc / mean.length; }
    }
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      let t = mean[cy * cols + cx];
      if (map) t = t < 0.01 ? 0 : map[Math.round(t * 255)];
      let i;
      if (algo === "ordered" || algo === "bluenoise") {
        const p = t * (nr - 1), lo = Math.floor(p), fr = p - lo;
        const th = algo === "ordered" ? (BAYER[cy % 8][cx % 8] + 0.5) / 64 : ign(cx, cy, seed);
        i = Math.min(nr - 1, lo + (fr > th ? 1 : 0));
      } else if (algo === "glitch") {
        const c = level(t), lo = Math.max(c === 0 ? 0 : 1, c - 1), hi = c === 0 ? 0 : Math.min(nr - 1, c + 1);
        i = lo + Math.floor(hash(cx, cy, seed) * (hi - lo + 1));
      } else i = level(t);
      let b = list[i].b;
      if (O.edgeAmt > 0 && O.lum) { const e = cellEdge(lumI, W, H, cx * G.cw, cy * G.ch, cx * G.cw + G.cw, cy * G.ch + G.ch, O.edgeAmt); if (e != null) b = edgeG[e]; }
      if (i > 0 || b !== list[i].b) put(cx, cy, b);
    }
  } else if (algo === "diffuse") {
    const val = Float32Array.from(mean), cvals = list.map((g) => g.c), maxc = cvals[nr - 1] || 1;
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      const j = cy * cols + cx, v = Math.max(0, Math.min(1.2, val[j]));
      let best = 0, bd = 1e9; for (let i = 0; i < nr; i++) { const d = Math.abs(cvals[i] / maxc - v); if (d < bd) { bd = d; best = i; } }
      const err = v - cvals[best] / maxc;
      if (cx + 1 < cols) val[j + 1] += err * 7 / 16;
      if (cy + 1 < rows) { if (cx > 0) val[j + cols - 1] += err * 3 / 16; val[j + cols] += err * 5 / 16; if (cx + 1 < cols) val[j + cols + 1] += err / 16; }
      if (best > 0) put(cx, cy, list[best].b);
    }
  } else if (algo === "edge" || algo === "contour") {
    const L = 6;
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      const x0 = cx * G.cw, y0 = cy * G.ch, x1 = Math.min(W, x0 + G.cw), y1 = Math.min(H, y0 + G.ch);
      if (algo === "contour") {   // an iso-line crosses this cell when its tone levels differ
        let lo = 99, hi = -1;
        for (let y = y0; y < y1; y += Math.max(1, k)) for (let x = x0; x < x1; x += Math.max(1, k)) { const q = Math.min(L - 1, Math.floor(demand[y * W + x] / 256 * L)); if (q < lo) lo = q; if (q > hi) hi = q; }
        if (hi <= lo) continue;
      }
      // Edge-directional: the Edge glyphs knob is the sensitivity (0 -> only strong edges, 100 -> fine detail)
      const e = cellEdge(lumI, W, H, x0, y0, x1, y1, algo === "contour" ? 1 : 0.8 + (O.edgeAmt || 0.5) * 2.4);
      if (e == null) { if (algo === "contour") put(cx, cy, glyph(G.f.id, ".")); continue; }
      put(cx, cy, edgeG[e]);
    }
  } else if (algo === "shape" || algo === "shapetone") {
    const N = fw * fh, lam = algo === "shapetone" ? 1.2 : 0.4, sk = 2.2;
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      const j = cy * cols + cx, base = j * N, t = mean[j];
      if (t < 0.03) continue;
      let best = 0, bd = 1e9;
      for (let i = 0; i < nr; i++) {
        const b = list[i].b; let d = 0;
        // shape: compare the glyph's pattern with the cell's local contrast (both mean-free), so a dark
        // cell still picks an edge-shaped character; Shape + tone also keeps the cell's darkness
        const gc = list[i].c;
        for (let p = 0; p < N; p++) { const e = (b[p] - gc) - (S.samp[base + p] - t) * sk; d += e * e; }
        d = d / N + lam * (gc - t) * (gc - t);
        if (d < bd) { bd = d; best = i; }
      }
      if (best > 0) put(cx, cy, list[best].b);
    }
  } else if (algo === "box") {
    // tone > 50% cells form shapes; their outlines are traced with box-drawing pieces
    // threshold at the picture's median cell tone, so dark and light photos both get outlines
    const sorted = Float32Array.from(mean).sort(), med = sorted[sorted.length >> 1] || 0.5;
    const on = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && mean[y * cols + x] > med;
    const sw = Math.max(1, k);
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      if (!on(cx, cy)) continue;
      const border = !on(cx - 1, cy) || !on(cx + 1, cy) || !on(cx, cy - 1) || !on(cx, cy + 1);
      if (!border) continue;
      const t = tgt(cx, cy); if (!t) continue;
      const x0 = cx * G.cw, y0 = cy * G.ch, mx = x0 + Math.floor((G.cw - G.sp) / 2), my = y0 + Math.floor((G.ch - G.sp) / 2);
      const nb = (x, y) => on(x, y) && (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1));
      const L = nb(cx - 1, cy), Rr = nb(cx + 1, cy), U = nb(cx, cy - 1), D = nb(cx, cy + 1);
      if (L) fillRect(t, W, H, x0, my, mx + sw, my + sw);
      if (Rr) fillRect(t, W, H, mx, my, x0 + G.cw, my + sw);
      if (U) fillRect(t, W, H, mx, y0, mx + sw, my + sw);
      if (D) fillRect(t, W, H, mx, my, mx + sw, y0 + G.ch);
      if (!L && !Rr && !U && !D) fillRect(t, W, H, mx - sw, my - sw, mx + 2 * sw, my + 2 * sw);
    }
  } else if (algo === "half" || algo === "quad" || algo === "sextant" || algo === "braille") {
    const [nx, ny] = algo === "half" ? [1, 2] : algo === "quad" ? [2, 2] : algo === "sextant" ? [2, 3] : [2, 4];
    const bw = G.cw - G.sp, bh = G.ch - G.sp;
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      const t = tgt(cx, cy); if (!t) continue;
      const x0 = cx * G.cw, y0 = cy * G.ch;
      for (let sy = 0; sy < ny; sy++) for (let sx = 0; sx < nx; sx++) {
        const ax = x0 + Math.floor(sx * bw / nx), ax1 = x0 + Math.floor((sx + 1) * bw / nx), ay = y0 + Math.floor(sy * bh / ny), ay1 = y0 + Math.floor((sy + 1) * bh / ny);
        let s = 0, c = 0;
        for (let y = ay; y < Math.min(H, ay1); y++) for (let x = ax; x < Math.min(W, ax1); x++) { s += demand[y * W + x]; c++; }
        if (!c) continue;
        const th = (BAYER[(cy * ny + sy) % 8][(cx * nx + sx) % 8] + 0.5) / 64;
        if (s / (c * 255) <= th) continue;
        if (algo === "braille") {   // round dots, a third of the sub-cell
          const r = Math.max(0.6, Math.min(ax1 - ax, ay1 - ay) * 0.42), mx = (ax + ax1) / 2, my = (ay + ay1) / 2;
          for (let y = Math.floor(my - r); y <= Math.ceil(my + r); y++) for (let x = Math.floor(mx - r); x <= Math.ceil(mx + r); x++) {
            if (x < 0 || y < 0 || x >= W || y >= H) continue;
            const dx = x + 0.5 - mx, dy = y + 0.5 - my; if (dx * dx + dy * dy <= r * r) t[y * W + x] = 255;
          }
        } else fillRect(t, W, H, ax, ay, ax1, ay1);
      }
    }
  } else if (algo === "adaptive") {
    // quadtree: 4x4-cell blocks split while their tone varies, down to single cells
    const thr = 0.004;
    const block = (bx, by, n) => {
      let s = 0, s2 = 0, c = 0;
      for (let y = by; y < Math.min(rows, by + n); y++) for (let x = bx; x < Math.min(cols, bx + n); x++) { const v = mean[y * cols + x]; s += v; s2 += v * v; c++; }
      if (!c) return;
      const m = s / c, varr = s2 / c - m * m;
      if (n > 1 && varr > thr / n) { const h2 = n >> 1; block(bx, by, h2); block(bx + h2, by, h2); block(bx, by + h2, h2); block(bx + h2, by + h2, h2); return; }
      const i = level(m); if (!i) return;
      const t = tgt(bx, by); if (t) stamp(t, W, H, bx * G.cw, by * G.ch, list[i].b, fw, fh, k * n);
    };
    for (let by = 0; by < rows; by += 4) for (let bx = 0; bx < cols; bx += 4) block(bx, by, 4);
  } else if (algo === "text") {
    const gl = []; for (const c of String(O.text || "FRANK")) { const g = glyph(G.f.id, c); if (g && cov(g) > 0) gl.push(g); }
    if (!gl.length) gl.push(glyph(G.f.id, "#"));
    const bw0 = G.cw - G.sp, bh0 = G.ch - G.sp;
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      const tt = mean[cy * cols + cx]; if (tt < 0.04) continue;
      const t = tgt(cx, cy); if (!t) continue;
      const g = gl[(cy * cols + cx) % gl.length], f = Math.sqrt(Math.min(1, tt * 1.15));
      const bw = Math.max(1, Math.round(bw0 * f)), bh = Math.max(1, Math.round(bh0 * f));
      const ox = cx * G.cw + Math.floor((bw0 - bw) / 2), oy = cy * G.ch + Math.floor((bh0 - bh) / 2);
      for (let py = 0; py < bh; py++) { const yy = oy + py; if (yy >= H) break; const gy = Math.min(fh - 1, Math.floor(py / bh * fh));
        for (let px = 0; px < bw; px++) { const xx = ox + px; if (xx >= W) break; if (g[gy * fw + Math.min(fw - 1, Math.floor(px / bw * fw))]) t[yy * W + xx] = 255; } }
    }
  } else if (algo === "weight") {
    // one character in light -> heavy weights (dilated by 0..3 px on the font grid)
    const base = glyph(G.f.id, String(O.text || "O").trim()[0] || "O") || glyph(G.f.id, "O");
    const dil = (b, dx, dy) => { const o = new Uint8Array(fw * fh); for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (b[y * fw + x]) for (let yy = y; yy <= Math.min(fh - 1, y + dy); yy++) for (let xx = x; xx <= Math.min(fw - 1, x + dx); xx++) o[yy * fw + xx] = 1; return o; };
    const W3 = [null, base, dil(base, 1, 0), dil(base, 1, 1), dil(base, 2, 1), dil(base, 2, 2)];
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) { const i = Math.min(W3.length - 1, Math.floor(mean[cy * cols + cx] * W3.length)); if (i) put(cx, cy, W3[i]); }
  } else if (algo === "overstrike") {
    // singles, then pairs and triples of the densest characters struck in one cell
    const top = list.slice(1).slice(-4), ext = list.slice();
    const or = (a, b) => { const o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] | b[i]; return o; };
    for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) {
      const b2 = or(top[i].b, top[j].b); ext.push({ b: b2, c: cov(b2) });
      for (let m = j + 1; m < top.length; m++) { const b3 = or(b2, top[m].b); ext.push({ b: b3, c: cov(b3) }); }
    }
    ext.sort((a, b) => a.c - b.c);
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) { const i = Math.min(ext.length - 1, Math.floor(mean[cy * cols + cx] * ext.length)); if (i) put(cx, cy, ext[i].b); }
  } else if (algo === "rain") {
    // per column: a few streaks with bright heads that fade down the column, tone sets brightness
    for (let cx = 0; cx < cols; cx++) {
      const len = 4 + Math.floor(hash(cx, 1, seed) * Math.max(4, rows * 0.6)), off = Math.floor(hash(cx, 2, seed) * rows);
      for (let cy = 0; cy < rows; cy++) {
        const p = ((cy - off) % (len + 3) + (len + 3)) % (len + 3);
        if (p >= len) continue;
        const fade = 1 - p / len, t = mean[cy * cols + cx] * (0.35 + 0.65 * fade);
        const i = level(t); if (!i) continue;
        const j = Math.max(1, Math.min(nr - 1, i + Math.floor((hash(cx, cy, seed + 7) - 0.5) * 3)));
        put(cx, cy, list[j].b);
      }
    }
  }
  if (O.invert && out) for (let i = 0; i < W * H; i++) out[i] = 255 - out[i];   // invert = negative cells
  return out;
}

module.exports = { ALGOS, GROUPS, FONTS, glyph, buildRamp, geom, render, isLegacy, _internal: { TINY_SRC, consoleGlyph, terminalGlyph } };
