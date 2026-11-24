"use strict";
// ======================================================================
// Brew 3.0 "Night Arcade" sprite fonts (spec: Night Arcade style).
// UXP ignores @font-face, so display text is drawn as small PNG sprites,
// like the knobs: identical on every computer, nothing to install.
//   Brew Pixel        5 x 7 (the ASCII engine's own font), wordmark and headings at 2x-4x
//   Brew Pixel Label  7 x 10 cell (tall cut of Brew Pixel, drawn for labels at 1x, rule 24)
//   Brew LCD          seven-segment digits with faint unlit segments (value boxes)
// Sprites render at 2 image pixels per CSS pixel and are shown at half size,
// so they stay crisp on Retina and on 1x screens.
//   text(str, { font: "pixel"|"label"|"lcd", color, scale, glow, unlit }) -> { url, w, h } (CSS px)
// Lowercase draws as uppercase (small caps look).
// ======================================================================
const PNG = require("./png.js");

const GW = 5, GH = 7;
// each glyph = 7 rows of 5 chars, rows joined by "/" (same data as plugins/dithers-brew/js/ascii.js)
const SRC = {
  "A": ".###./#...#/#...#/#####/#...#/#...#/#...#",
  "B": "####./#...#/#...#/####./#...#/#...#/####.",
  "C": ".###./#...#/#..../#..../#..../#...#/.###.",
  "D": "####./#...#/#...#/#...#/#...#/#...#/####.",
  "E": "#####/#..../#..../####./#..../#..../#####",
  "F": "#####/#..../#..../####./#..../#..../#....",
  "G": ".###./#...#/#..../#.###/#...#/#...#/.###.",
  "H": "#...#/#...#/#...#/#####/#...#/#...#/#...#",
  "I": ".###./..#../..#../..#../..#../..#../.###.",
  "J": "..###/...#./...#./...#./...#./#..#./.##..",
  "K": "#...#/#..#./#.#../##.../#.#../#..#./#...#",
  "L": "#..../#..../#..../#..../#..../#..../#####",
  "M": "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#",
  "N": "#...#/##..#/#.#.#/#..##/#...#/#...#/#...#",
  "O": ".###./#...#/#...#/#...#/#...#/#...#/.###.",
  "P": "####./#...#/#...#/####./#..../#..../#....",
  "Q": ".###./#...#/#...#/#...#/#.#.#/#..#./.##.#",
  "R": "####./#...#/#...#/####./#.#../#..#./#...#",
  "S": ".####/#..../#..../.###./....#/....#/####.",
  "T": "#####/..#../..#../..#../..#../..#../..#..",
  "U": "#...#/#...#/#...#/#...#/#...#/#...#/.###.",
  "V": "#...#/#...#/#...#/#...#/#...#/.#.#./..#..",
  "W": "#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#",
  "X": "#...#/#...#/.#.#./..#../.#.#./#...#/#...#",
  "Y": "#...#/#...#/.#.#./..#../..#../..#../..#..",
  "Z": "#####/....#/...#./..#../.#.../#..../#####",
  "0": ".###./#...#/#..##/#.#.#/##..#/#...#/.###.",
  "1": "..#../.##../..#../..#../..#../..#../.###.",
  "2": ".###./#...#/....#/...#./..#../.#.../#####",
  "3": ".###./#...#/....#/..##./....#/#...#/.###.",
  "4": "...#./..##./.#.#./#..#./#####/...#./...#.",
  "5": "#####/#..../####./....#/....#/#...#/.###.",
  "6": "..##./.#.../#..../####./#...#/#...#/.###.",
  "7": "#####/....#/...#./..#../.#.../.#.../.#...",
  "8": ".###./#...#/#...#/.###./#...#/#...#/.###.",
  "9": ".###./#...#/#...#/.####/....#/...#./.##..",
  ".": "...../...../...../...../...../.##../.##..",
  ",": "...../...../...../...../.##../..#../.#...",
  ":": "...../.##../.##../...../.##../.##../.....",
  ";": "...../.##../.##../...../.##../..#../.#...",
  "!": "..#../..#../..#../..#../..#../...../..#..",
  "?": ".###./#...#/....#/...#./..#../...../..#..",
  "-": "...../...../...../#####/...../...../.....",
  "_": "...../...../...../...../...../...../#####",
  "+": "...../..#../..#../#####/..#../..#../.....",
  "=": "...../...../#####/...../#####/...../.....",
  "*": "...../#.#.#/.###./#####/.###./#.#.#/.....",
  "#": ".#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.",
  "%": "##..#/##..#/...#./..#../.#.../#..##/#..##",
  "@": ".###./#...#/#.###/#.#.#/#.###/#..../.###.",
  "/": "....#/....#/...#./..#../.#.../#..../#....",
  "\\": "#..../#..../.#.../..#../...#./....#/....#",
  "|": "..#../..#../..#../..#../..#../..#../..#..",
  "'": "..#../..#../.#.../...../...../...../.....",
  "\"": ".#.#./.#.#./...../...../...../...../.....",
  "(": "...#./..#../.#.../.#.../.#.../..#../...#.",
  ")": ".#.../..#../...#./...#./...#./..#../.#...",
  "<": "...#./..#../.#.../#..../.#.../..#../...#.",
  ">": ".#.../..#../...#./....#/...#./..#../.#...",
  "[": ".###./.#.../.#.../.#.../.#.../.#.../.###.",
  "]": ".###./...#./...#./...#./...#./...#./.###.",
  "$": "..#../.####/#.#../.###./..#.#/####./..#..",
  "&": ".##../#..#./#.#../.#.../#.#.#/#..#./.##.#",
  "~": "...../...../.#.../#.#.#/...#./...../.....",
  "^": "..#../.#.#./#...#/...../...../...../.....",
  " ": "...../...../...../...../...../...../.....",
  "\u00b0": ".##../#..#./.##../...../...../...../.....",
  "\u00d7": "...../#...#/.#.#./..#../.#.#./#...#/.....",
  "\u00b7": "...../...../...../..#../...../...../.....",
  "\u2013": "...../...../...../.###./...../...../.....",
  "\u2014": "...../...../...../#####/...../...../.....",
  "\u2192": "...../..#../...#./#####/...#./..#../.....",
  "\u2190": "...../..#../.#.../#####/.#.../..#../.....",
  "\u25b6": ".#.../.##../.###./.####/.###./.##../.#...",
  "\u25c0": "....#/...##/..###/.####/..###/...##/....#"
};

const BITS = {};
for (const ch of Object.keys(SRC)) {
  const rows = SRC[ch].split("/");
  const b = new Uint8Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) b[y * GW + x] = rows[y][x] === "#" ? 1 : 0;
  BITS[ch] = b;
}
function glyph(ch) {
  return BITS[ch] || BITS[String(ch).toUpperCase()] || (/\s/.test(ch) ? BITS[" "] : BITS["?"]);
}

// Brew Pixel Label: rows 1, 4 and 5 are doubled (7 -> 10), so the crossbar of A/E/H
// sits just above the middle and strokes stay 1 px. Cell is 7 wide (5 + 2 spacing).
const LABEL_ROWS = [0, 1, 1, 2, 3, 4, 4, 5, 5, 6];
const FONTS = {
  pixel: { cw: 6, ch: 7, rows: [0, 1, 2, 3, 4, 5, 6] },
  label: { cw: 7, ch: 10, rows: LABEL_ROWS }
};

function hexRGB(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim());
  const n = m ? parseInt(m[1], 16) : 0xffffff;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// alpha mask (1 per font pixel) for a string
function maskFor(str, font) {
  const F = FONTS[font] || FONTS.label;
  const chars = Array.from(String(str));
  const W = Math.max(1, chars.length * F.cw - (F.cw - GW)), H = F.ch;
  const m = new Uint8Array(W * H);
  chars.forEach((c, i) => {
    const g = glyph(c);
    if (!g) return;
    const ox = i * F.cw;
    for (let y = 0; y < H; y++) {
      const sy = F.rows[y];
      for (let x = 0; x < GW; x++) if (g[sy * GW + x]) m[y * W + ox + x] = 1;
    }
  });
  return { m, W, H };
}

// Brew LCD: seven segments in a 7 x 11 cell (+1 spacing), 1 px strokes
//  segments a(top) b(top right) c(bottom right) d(bottom) e(bottom left) f(top left) g(middle)
const SEG = {
  "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc",
  "8": "abcdefg", "9": "abcdfg", "-": "g", " ": "", "E": "afged", "r": "eg", "o": "cdeg", "L": "fed", "H": "fbgec", "P": "abfge"
};
const LCD_W = 7, LCD_H = 11, LCD_GAP = 2;
function lcdSegPixels(s) {
  const px = [];
  const hz = (y) => { for (let x = 1; x < LCD_W - 1; x++) px.push([x, y]); };
  const vt = (x, y0, y1) => { for (let y = y0; y <= y1; y++) px.push([x, y]); };
  if (s === "a") hz(0);
  if (s === "g") hz(5);
  if (s === "d") hz(10);
  if (s === "f") vt(0, 1, 4);
  if (s === "b") vt(LCD_W - 1, 1, 4);
  if (s === "e") vt(0, 6, 9);
  if (s === "c") vt(LCD_W - 1, 6, 9);
  return px;
}
function lcdMask(str, unlit) {
  const chars = Array.from(String(str));
  // "." and ":" take a narrow 2 px cell
  const widths = chars.map((c) => (c === "." || c === ":" ? 2 : LCD_W + LCD_GAP));
  const W = Math.max(1, widths.reduce((a, b) => a + b, 0) - (chars.length && widths[widths.length - 1] > 2 ? LCD_GAP : 0)), H = LCD_H;
  const m = new Uint8Array(W * H);   // 0 off, 1 unlit, 2 lit
  let ox = 0;
  chars.forEach((c, i) => {
    if (c === ".") { m[(H - 1) * W + ox] = 2; ox += widths[i]; return; }
    if (c === ":") { m[3 * W + ox] = 2; m[7 * W + ox] = 2; ox += widths[i]; return; }
    const lit = SEG[c] != null ? SEG[c] : (SEG[String(c).toUpperCase()] || "g");
    "abcdefg".split("").forEach((s) => {
      const on = lit.indexOf(s) >= 0;
      if (!on && !unlit) return;
      lcdSegPixels(s).forEach(([x, y]) => { const k = y * W + ox + x; if (on || !m[k]) m[k] = on ? 2 : 1; });
    });
    ox += widths[i];
  });
  return { m, W, H };
}

const cache = new Map();
// opts: { font, color, scale (font px -> CSS px), glow (0 none, 1 = 2-step neon glow), unlit (lcd) }
function text(str, opts) {
  opts = opts || {};
  const font = opts.font || "label", scale = Math.max(1, Math.round(opts.scale || 1)), color = opts.color || "#ffffff";
  const glowOn = !!opts.glow, unlit = opts.unlit !== false;
  const key = [font, scale, color, glowOn ? 1 : 0, unlit ? 1 : 0, str].join("|");
  if (cache.has(key)) return cache.get(key);
  const src = font === "lcd" ? lcdMask(str, unlit) : maskFor(str, font);
  const pad = glowOn ? 2 : 0;                       // glow margin in font pixels
  const D = 2 * scale;                              // image pixels per font pixel
  const W = (src.W + pad * 2) * D, H = (src.H + pad * 2) * D;
  // 4-bit indexed sprite: 0 clear, 1 unlit LCD, 2 glow ring 2, 3 glow ring 1, 4 ink
  const idx = new Uint8Array(W * H);
  const [r, g, b] = hexRGB(color);
  const PAL = [[0, 0, 0, 0], [r, g, b, 34], [r, g, b, 26], [r, g, b, 70], [r, g, b, 255]];
  const put = (x, y, v) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (v > idx[i]) idx[i] = v;
  };
  // stepped 2-step glow (not blurred): ring 1 at 35%, ring 2 at 14%
  if (glowOn) {
    for (let y = 0; y < src.H; y++) for (let x = 0; x < src.W; x++) {
      if (src.m[y * src.W + x] < 2 && !(font !== "lcd" && src.m[y * src.W + x])) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const ring = Math.max(Math.abs(dx), Math.abs(dy));
        const a = ring === 1 ? 3 : ring === 2 ? 2 : 0;
        if (!a) continue;
        for (let yy = 0; yy < D; yy++) for (let xx = 0; xx < D; xx++) put((x + pad + dx) * D + xx, (y + pad + dy) * D + yy, a);
      }
    }
  }
  for (let y = 0; y < src.H; y++) for (let x = 0; x < src.W; x++) {
    const v = src.m[y * src.W + x];
    if (!v) continue;
    const a = font === "lcd" && v === 1 ? 1 : 4;   // unlit LCD segments are faint
    for (let yy = 0; yy < D; yy++) for (let xx = 0; xx < D; xx++) put((x + pad) * D + xx, (y + pad) * D + yy, a);
  }
  const out = { url: PNG.dataURL(idx, W, H, 1, PAL), w: W / 2, h: H / 2 };
  if (cache.size > 3000) cache.clear();
  cache.set(key, out);
  return out;
}

// Put sprite text into a DOM element: an <img> for the eye plus the same text in a hidden
// span, so textContent, tests and screen readers still read the words.
function paint(e, str, opts) {
  const t = text(str, opts);
  let img = e.__pxImg, txt = e.__pxTxt;
  if (!img) {
    while (e.firstChild) e.removeChild(e.firstChild);
    img = document.createElement("img"); img.className = "pxt";
    txt = document.createElement("span"); txt.className = "pxhide";
    e.appendChild(img); e.appendChild(txt);
    e.__pxImg = img; e.__pxTxt = txt;
  }
  img.src = t.url;
  img.style.width = t.w + "px"; img.style.height = t.h + "px";
  img.setAttribute("alt", String(str));
  txt.textContent = String(str);
  e.__pxStr = String(str);
  e.classList.add("px");
  return e;
}

module.exports = { text, paint, glyph, maskFor, lcdMask, FONTS, SRC };
