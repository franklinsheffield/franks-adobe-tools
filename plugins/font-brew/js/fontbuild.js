"use strict";
// ======================================================================
// Font Brew engine: glyph sources -> font units -> .otf (CFF) bytes, plus
// the text preview. Pure JS, no Photoshop calls.
//
// A glyph source (one per mapped layer), all in that layer's mask pixels:
//   { ch, layerId, name, contours, origin:{left,top} (doc px of mask 0,0),
//     scale (mask px per doc px), adj:{lsb, rsb, dy} (font units) }
// ======================================================================
const opentype = require("./lib/opentype.js");
const G = require("./geom.js");
const { glyphName } = require("./charmap.js");

const UPM = 1000;
const FLAT_BOTTOM = "ABDEFHIKLMNPRTUVWXYZ";   // capitals that sit exactly on the baseline
const FLAT_TOP = "BDEFHIKLMNPRTXZ";           // capitals whose top is exactly cap height
const DESCENDERS = "gjpqy,;Q";

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[(s.length - 1) >> 1]; };

// ink bounds of a source in document pixels
function docBox(src) {
  const b = G.bounds(src.contours);
  if (!b) return null;
  return { x0: src.origin.left + b.x0 / src.scale, y0: src.origin.top + b.y0 / src.scale, x1: src.origin.left + b.x1 / src.scale, y1: src.origin.top + b.y1 / src.scale };
}

// P.metrics: { baseline:"auto"|"line"|"each"|"guides", capHeight, tracking, space, descent }
// guides: { baseline, cap } in doc px (either may be missing)
// -> { mode, scale (units per doc px), glyphs:[{ch, name, contours (units, y up), advance, box}], ascender, descender, notes:[] }
function computeLayout(sources, P, guides) {
  const M = P.metrics, notes = [];
  const items = sources.map((s) => ({ s, box: docBox(s) })).filter((x) => x.box);
  const byCh = {};
  items.forEach((x) => { byCh[x.s.ch] = x; });
  const pick = (set, f) => set.split("").filter((c) => byCh[c]).map((c) => f(byCh[c].box));
  let mode = M.baseline;
  if (mode === "guides" && !(guides && guides.baseline != null)) { notes.push("No horizontal guide found: using Auto baseline."); mode = "auto"; }
  // cap height in px measured on each glyph's own box (works in both modes)
  let capPx = median(pick(FLAT_TOP, (b) => b.y1 - b.y0));
  if (mode === "auto") {
    const bottoms = pick(FLAT_BOTTOM, (b) => b.y1);
    const spread = bottoms.length > 1 ? Math.max.apply(null, bottoms) - Math.min.apply(null, bottoms) : 0;
    const ref = capPx || median(items.map((x) => x.box.y1 - x.box.y0)) || 1;
    if (bottoms.length > 1) mode = spread > ref * 0.25 ? "each" : "line";
    else {
      const allB = items.filter((x) => DESCENDERS.indexOf(x.s.ch) < 0).map((x) => x.box.y1);
      const sp = allB.length > 1 ? Math.max.apply(null, allB) - Math.min.apply(null, allB) : 0;
      mode = sp > ref * 0.25 ? "each" : "line";
    }
  }
  let basePx = null;
  if (mode === "guides") {
    basePx = guides.baseline;
    if (guides.cap != null && guides.cap < basePx) capPx = basePx - guides.cap;
  } else if (mode === "line") {
    basePx = median(pick(FLAT_BOTTOM, (b) => b.y1));
    if (basePx == null) basePx = median(items.filter((x) => DESCENDERS.indexOf(x.s.ch) < 0).map((x) => x.box.y1));
  }
  if (!capPx) {
    if (basePx != null) capPx = Math.max.apply(null, items.map((x) => basePx - x.box.y0).concat([1]));
    else capPx = Math.max.apply(null, items.map((x) => x.box.y1 - x.box.y0).concat([1]));
    if (items.length) notes.push("No capitals like H or E mapped: cap height taken from the tallest glyph.");
  }
  const s = M.capHeight / capPx;
  const glyphs = [];
  let yMax = -Infinity, yMin = Infinity;
  for (const { s: src, box } of items) {
    const adj = src.adj || {};
    let base = basePx;
    if (base == null) base = box.y1 - (DESCENDERS.indexOf(src.ch) >= 0 ? capPx * M.descent / 100 : 0);
    const lsb = M.tracking + (adj.lsb || 0), rsb = M.tracking + (adj.rsb || 0), dy = adj.dy || 0;
    const contours = G.fixWinding(G.mapContours(src.contours, (x, y) => {
      const dx = src.origin.left + x / src.scale, dyy = src.origin.top + y / src.scale;
      return [Math.round((dx - box.x0) * s + lsb), Math.round((base - dyy) * s + dy)];
    }), true);
    const b = G.bounds(contours);
    if (b) { yMax = Math.max(yMax, b.y1); yMin = Math.min(yMin, b.y0); }
    glyphs.push({ ch: src.ch, name: glyphName(src.ch), contours, advance: Math.max(1, Math.round((box.x1 - box.x0) * s + lsb + rsb)), box: b });
  }
  return {
    mode, scale: s, glyphs, notes, space: M.space, capHeight: M.capHeight,
    ascender: Math.max(800, isFinite(yMax) ? Math.ceil(yMax) : 0),
    descender: Math.min(-200, isFinite(yMin) ? Math.floor(yMin) : 0)
  };
}

function toPath(contours) {
  const p = new opentype.Path();
  for (const c of contours) {
    for (const seg of c) {
      if (seg.t === "M") p.moveTo(seg.x, seg.y);
      else if (seg.t === "L") p.lineTo(seg.x, seg.y);
      else p.curveTo(seg.x1, seg.y1, seg.x2, seg.y2, seg.x, seg.y);
    }
    p.close();
  }
  return p;
}

function notdefPath(adv, asc) {
  const p = new opentype.Path(), m = 50, t = 40;
  p.moveTo(m, 0); p.lineTo(adv - m, 0); p.lineTo(adv - m, asc); p.lineTo(m, asc); p.close();
  p.moveTo(m + t, t); p.lineTo(m + t, asc - t); p.lineTo(adv - m - t, asc - t); p.lineTo(adv - m - t, t); p.close();
  return p;
}

// names: { family, style, version, designer, license, url }
function buildFont(layout, names) {
  names = names || {};
  const family = (names.family || "Brew Lettering").trim() || "Brew Lettering";
  const style = (names.style || "Regular").trim() || "Regular";
  const glyphs = [
    new opentype.Glyph({ name: ".notdef", advanceWidth: 600, path: notdefPath(600, layout.capHeight) }),
    new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: layout.space, path: new opentype.Path() })
  ];
  const seen = { " ": 1 };
  for (const g of layout.glyphs) {
    if (seen[g.ch]) continue;
    seen[g.ch] = 1;
    glyphs.push(new opentype.Glyph({ name: g.name, unicode: g.ch.codePointAt(0), advanceWidth: g.advance, path: toPath(g.contours) }));
  }
  const vm = /^\d+(\.\d+)?$/.test(String(names.version || "")) ? String(names.version) : "1.000";
  const font = new opentype.Font({
    familyName: family, styleName: style, unitsPerEm: UPM,
    ascender: layout.ascender, descender: layout.descender,
    designer: names.designer || "", designerURL: names.url || "", manufacturer: names.designer || "",
    license: names.license || "", licenseURL: names.url || "",
    version: vm, description: "Made with Frank's Font Brew",
    copyright: names.designer ? ("Copyright " + new Date().getFullYear() + " " + names.designer) : "",
    glyphs
  });
  try { font.tables.os2 = Object.assign(font.tables.os2 || {}, { sCapHeight: layout.capHeight }); } catch (e) { /* optional */ }
  const buf = font.toArrayBuffer();
  return { buffer: buf, glyphCount: glyphs.length, family, style, fileName: (family + "-" + style).replace(/[^A-Za-z0-9_-]+/g, "") + ".otf" };
}

// ---- preview ---------------------------------------------------------------
// Lays out `text` with the built glyphs at `size` px per em; returns contours
// in preview pixels (y down) for each line, wrapping at width.
function layoutText(layout, text, size, width, pad) {
  pad = pad == null ? 14 : pad;
  const k = size / UPM, map = {};
  layout.glyphs.forEach((g) => { if (!map[g.ch]) map[g.ch] = g; });
  const lineH = Math.round((layout.ascender - layout.descender) * k * 1.05);
  const words = String(text || "").split(/(\s+)/);
  const out = [], missing = new Set();
  let x = pad, line = 0;
  const place = (ch) => {
    const g = map[ch];
    const adv = ch === " " ? layout.space : (g ? g.advance : 600);
    return { g, adv: adv * k };
  };
  for (const w of words) {
    if (!w) continue;
    if (/^\s+$/.test(w)) { x += (w.indexOf("\n") >= 0 ? 0 : place(" ").adv * w.length); if (w.indexOf("\n") >= 0) { x = pad; line++; } continue; }
    const chars = Array.from(w);
    const ww = chars.reduce((a, c) => a + place(c).adv, 0);
    if (x > pad && x + ww > width - pad) { x = pad; line++; }
    for (const ch of chars) {
      const { g, adv } = place(ch);
      const base = pad + line * lineH + layout.ascender * k;
      const ox = x;
      if (g) out.push(G.mapContours(g.contours, (u, v) => [ox + u * k, base - v * k]));
      else {
        missing.add(ch);
        const bx = [[{ t: "M", x: ox + 50 * k, y: base }, { t: "L", x: ox + 550 * k, y: base }, { t: "L", x: ox + 550 * k, y: base - layout.capHeight * k }, { t: "L", x: ox + 50 * k, y: base - layout.capHeight * k }],
          [{ t: "M", x: ox + 90 * k, y: base - 40 * k }, { t: "L", x: ox + 90 * k, y: base - (layout.capHeight - 40) * k }, { t: "L", x: ox + 510 * k, y: base - (layout.capHeight - 40) * k }, { t: "L", x: ox + 510 * k, y: base - 40 * k }]];
        out.push(bx);
      }
      x += adv;
    }
  }
  const height = pad * 2 + (line + 1) * lineH;
  return { glyphs: out, height, missing: Array.from(missing) };
}

// bg: "checker" | "white" | "black"; returns { rgb, w, h, missing }
function renderPreview(layout, text, size, width, bg, outline, glow) {
  const L = layoutText(layout, text, size, width);
  const w = width, h = Math.max(40, Math.min(1400, Math.ceil(L.height)));
  const cov = new Uint8Array(w * h);
  for (const g of L.glyphs) G.rasterize(g, w, h, cov);
  const rgb = new Uint8Array(w * h * 3);
  const ink = bg === "white" ? 0 : 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    let b = bg === "white" ? 255 : bg === "black" ? 0 : (((x >> 3) + (y >> 3)) & 1 ? 70 : 40);
    const a = cov[i] / 255;
    const v = Math.round(b * (1 - a) + ink * a);
    rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = v;
  }
  if (outline) for (const g of L.glyphs) G.stroke(g, w, h, rgb, glow || [25, 255, 176]);
  return { rgb, w, h, missing: L.missing };
}

// ---- demo glyphs (no document open, and the tests) -------------------------
const BITMAPS = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"], B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."], D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"], F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."], H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"], J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"], L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"], N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"], R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."], T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."], V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."], X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."], Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."], 1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"], 3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."], 5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."], 7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."], 9: [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  ".": [".....", ".....", ".....", ".....", ".....", ".....", "..#.."], "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."]
};

// One RGBA image per demo character: round "bubble" dot-matrix letters on
// transparency (each bitmap cell is a disc, so diagonals join up).
function demoImage(ch, cell) {
  cell = cell || 12;
  const rows = BITMAPS[ch];
  const pad = 6, w = 5 * cell + pad * 2, h = 7 * cell + pad * 2, R = cell * 0.8;
  const centres = [];
  rows.forEach((r, j) => r.split("").forEach((c, i) => { if (c === "#") centres.push([pad + (i + 0.5) * cell, pad + (j + 0.5) * cell]); }));
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let d = Infinity;
    for (const c of centres) { const e = Math.hypot(x + 0.5 - c[0], y + 0.5 - c[1]); if (e < d) d = e; }
    const a = Math.max(0, Math.min(1, R - d + 0.5));
    const p = (y * w + x) * 4;
    data[p] = data[p + 1] = data[p + 2] = 20; data[p + 3] = Math.round(a * 255);
  }
  return { w, h, c: 4, data, pad };
}
const DEMO_CHARS = Object.keys(BITMAPS).join("");

module.exports = { computeLayout, buildFont, layoutText, renderPreview, demoImage, DEMO_CHARS, UPM, opentype };
