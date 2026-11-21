"use strict";
// ---------------------------------------------------------------------
// ASCII engine: built-in 5x7 bitmap font (no system fonts needed, so the
// result is identical on every machine) + glyph ramps + cell renderer.
// Pure JS, no Photoshop calls.
// ---------------------------------------------------------------------

const GW = 5, GH = 7;

// each glyph = 7 rows of 5 chars, rows joined by "/"
const FONT_SRC = {
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
  " ": "...../...../...../...../...../...../....."
};

const FONT = {};
for (const ch of Object.keys(FONT_SRC)) {
  const rows = FONT_SRC[ch].split("/");
  const bits = new Uint8Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) bits[y * GW + x] = rows[y][x] === "#" ? 1 : 0;
  FONT[ch] = bits;
}

function glyphBits(ch) {
  if (FONT[ch]) return FONT[ch];
  const u = String(ch).toUpperCase();
  return FONT[u] || null;
}
function coverage(bits) { let c = 0; for (let i = 0; i < bits.length; i++) c += bits[i]; return c; }

// ---- procedural glyph sets -------------------------------------------
function bayer8() {
  let m = [[0]], s = 1;
  while (s < 8) {
    const nm = [];
    for (let y = 0; y < s * 2; y++) {
      nm[y] = [];
      for (let x = 0; x < s * 2; x++) {
        const add = (y < s) ? ((x < s) ? 0 : 2) : ((x < s) ? 3 : 1);
        nm[y][x] = m[y % s][x % s] * 4 + add;
      }
    }
    m = nm; s *= 2;
  }
  return m;
}

function procBlocks(levels) {
  const B = bayer8(), cells = [];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) cells.push({ i: y * GW + x, v: B[y][x] });
  cells.sort((a, b) => a.v - b.v || a.i - b.i);
  const out = [];
  for (let l = 0; l < levels; l++) {
    const bits = new Uint8Array(GW * GH);
    const n = Math.round((l / (levels - 1)) * cells.length);
    for (let k = 0; k < n; k++) bits[cells[k].i] = 1;
    out.push(bits);
  }
  return out;
}
function procDots(levels) {
  const out = [];
  for (let l = 0; l < levels; l++) {
    const bits = new Uint8Array(GW * GH);
    const r = 0.4 + (l / (levels - 1)) * 3.4;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const dx = x - 2, dy = (y - 3) * 0.9;
      if (Math.sqrt(dx * dx + dy * dy) <= r) bits[y * GW + x] = 1;
    }
    out.push(bits);
  }
  return out;
}
function procBars() {
  const sets = [[], [3], [1, 5], [1, 3, 5], [0, 2, 4, 6], [0, 1, 2, 3, 4, 5, 6]];
  return sets.map((rows) => {
    const bits = new Uint8Array(GW * GH);
    rows.forEach((r) => { for (let x = 0; x < GW; x++) bits[r * GW + x] = 1; });
    return bits;
  });
}

const ASCII_SETS = [
  { id: "classic", name: "Classic  . : - = + * # % @", chars: ".:-=+*#%@" },
  { id: "dense",   name: "Dense ramp", chars: ".,:;!/1ILCGO08@#" },
  { id: "digits",  name: "Digits  0-9", chars: "0123456789" },
  { id: "binary",  name: "Binary  0 1", chars: "01" },
  { id: "letters", name: "Letters  A-Z", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { id: "math",    name: "Math  + - = * / % < >", chars: "+-=*/%<>" },
  { id: "hatch",   name: "Hatch  - / | \\ X #", chars: "-/|\\X#" },
  { id: "symbols", name: "Symbols  $ & @ # %", chars: "$&@#%*" },
  { id: "blocks",  name: "Blocks (pixel patterns)", proc: "blocks" },
  { id: "dots",    name: "Dots (growing circles)", proc: "dots" },
  { id: "bars",    name: "Bars (stacked lines)", proc: "bars" },
  { id: "custom",  name: "My own characters...", custom: true }
];

// Returns an array of Uint8Array(35) bitmaps ordered light -> dark. Blank first.
function buildRamp(setId, customChars, keepOrder) {
  const set = ASCII_SETS.find((s) => s.id === setId) || ASCII_SETS[0];
  let glyphs = [];
  if (set.proc === "blocks") glyphs = procBlocks(9);
  else if (set.proc === "dots") glyphs = procDots(8);
  else if (set.proc === "bars") glyphs = procBars();
  else {
    const chars = set.custom ? String(customChars || "FRANK") : set.chars;
    const seen = {};
    for (const ch of chars) {
      if (seen[ch]) continue;
      seen[ch] = 1;
      const g = glyphBits(ch);
      if (g && coverage(g) > 0) glyphs.push(g);
    }
    if (!glyphs.length) glyphs.push(FONT["#"]);
    if (!(set.custom && keepOrder)) glyphs.sort((a, b) => coverage(a) - coverage(b));
    glyphs.unshift(new Uint8Array(GW * GH));
  }
  if (coverage(glyphs[0]) !== 0) glyphs.unshift(new Uint8Array(GW * GH));
  return glyphs;
}

// ---- cell renderer -----------------------------------------------------
// demand: Uint8Array 0..255 (255 = full ink).  Output: Uint8Array ink mask.
// O: { k, ramp, lum, edgeAmt, textMode, text, cellMask(cx,cy) -> Uint8Array }
const EDGE_CHARS = ["-", "\\", "|", "/"];

function asciiInk(demand, w, h, O, out) {
  const k = Math.max(1, Math.round(O.k));
  const cw = (GW + 1) * k, ch = (GH + 1) * k;
  const cols = Math.ceil(w / cw), rows = Math.ceil(h / ch);
  const ramp = O.ramp, nr = ramp.length;
  const edgeAmt = O.edgeAmt || 0, lum = O.lum;
  const edgeGlyphs = EDGE_CHARS.map((c) => glyphBits(c));
  let textGlyphs = null;
  if (O.textMode) {
    textGlyphs = [];
    for (const c of String(O.text || "FRANK")) { const g = glyphBits(c); if (g) textGlyphs.push(g); }
    if (!textGlyphs.length) textGlyphs.push(FONT["#"]);
  }
  const target0 = out || new Uint8Array(w * h);

  for (let cy = 0; cy < rows; cy++) {
    const y0 = cy * ch, y1 = Math.min(h, y0 + ch);
    for (let cx = 0; cx < cols; cx++) {
      const x0 = cx * cw, x1 = Math.min(w, x0 + cw);
      let sum = 0, cnt = 0, gxx = 0, gxy = 0, mag2 = 0;
      for (let y = y0; y < y1; y++) {
        const row = y * w;
        for (let x = x0; x < x1; x++) { sum += demand[row + x]; cnt++; }
      }
      if (!cnt) continue;
      const t = sum / (cnt * 255);

      let bits = null;
      if (edgeAmt > 0 && lum) {
        // Sobel summed over the cell; doubled-angle averaging avoids trig per pixel
        for (let y = Math.max(1, y0); y < Math.min(h - 1, y1); y++) {
          for (let x = Math.max(1, x0); x < Math.min(w - 1, x1); x++) {
            const i = y * w + x;
            const gx = (lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1]) - (lum[i - w - 1] + 2 * lum[i - 1] + lum[i + w - 1]);
            const gy = (lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1]) - (lum[i - w - 1] + 2 * lum[i - w] + lum[i - w + 1]);
            gxx += gx * gx - gy * gy;
            gxy += 2 * gx * gy;
            mag2 += gx * gx + gy * gy;
          }
        }
        const m = Math.sqrt(mag2 / cnt) / 1020;           // 0..1
        if (m * 4 * edgeAmt > 0.35) {
          const theta = Math.atan2(gxy, gxx) / 2;         // gradient orientation
          let phi = theta + Math.PI / 2;                  // line direction
          phi = ((phi % Math.PI) + Math.PI) % Math.PI;
          const sector = Math.round(phi / (Math.PI / 4)) % 4;
          bits = edgeGlyphs[sector];
        }
      }

      const target = O.cellMask ? O.cellMask(cx, cy) : target0;
      if (!target) continue;

      if (textGlyphs && !bits) {
        // text halftone: glyph grows with darkness
        if (t < 0.04) continue;
        const g = textGlyphs[(cy * cols + cx) % textGlyphs.length];
        const f = Math.sqrt(Math.min(1, t * 1.15));
        const bw = Math.max(1, Math.round(cw * f * 0.96)), bh = Math.max(1, Math.round(ch * f * 0.96));
        const ox = x0 + Math.floor((cw - bw) / 2), oy = y0 + Math.floor((ch - bh) / 2);
        for (let py = 0; py < bh; py++) {
          const yy = oy + py; if (yy < 0 || yy >= h) continue;
          const gy = Math.min(GH - 1, Math.floor((py / bh) * GH));
          for (let px = 0; px < bw; px++) {
            const xx = ox + px; if (xx < 0 || xx >= w) continue;
            const gx = Math.min(GW - 1, Math.floor((px / bw) * GW));
            if (g[gy * GW + gx]) target[yy * w + xx] = 255;
          }
        }
        continue;
      }

      if (!bits) bits = ramp[Math.min(nr - 1, Math.floor(t * nr))];
      if (!bits) continue;
      for (let gy = 0; gy < GH; gy++) {
        for (let gx = 0; gx < GW; gx++) {
          if (!bits[gy * GW + gx]) continue;
          const bx = x0 + gx * k, by = y0 + gy * k;
          for (let yy = by; yy < by + k && yy < h; yy++) {
            const r = yy * w;
            for (let xx = bx; xx < bx + k && xx < w; xx++) target[r + xx] = 255;
          }
        }
      }
    }
  }
  return target0;
}

module.exports = { GW, GH, FONT, glyphBits, coverage, ASCII_SETS, buildRamp, asciiInk };
