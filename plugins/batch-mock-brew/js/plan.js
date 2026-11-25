"use strict";
// ======================================================================
// Batch Mock Brew planner: pure JS, no Photoshop calls, unit tested.
// Folder lists in, a job list out: which artwork goes into which Smart
// Object of which mockup, and where each result is saved under what name.
// ======================================================================

const MOCKUP_EXT = ["psd", "psb"];
const ART_EXT = ["jpg", "jpeg", "png", "psd", "psb", "pdf", "tif", "tiff", "gif", "bmp"];
const OUT_EXT = { jpg: "jpg", png: "png", psd: "psd", mp4: "mp4", webp: "webp" };
const DELIMS = { "_": "_", "-": "-", ".": ".", " ": " " };

function splitName(fileName) {
  const s = String(fileName);
  const i = s.lastIndexOf(".");
  if (i <= 0) return { base: s, ext: "" };
  return { base: s.slice(0, i), ext: s.slice(i + 1).toLowerCase() };
}
const isMockup = (n) => !String(n).startsWith(".") && MOCKUP_EXT.includes(splitName(n).ext);
const isArtwork = (n) => !String(n).startsWith(".") && ART_EXT.includes(splitName(n).ext);

// Names safe on macOS and Windows.
function cleanName(s) {
  return String(s).replace(/[\/\\:*?"<>|\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim() || "untitled";
}

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

// ---- Smart Object matching ---------------------------------------------
// rule: "exact" | "starts" | "contains"; case-insensitive; trims spaces.
function matchesTarget(layerName, target, rule) {
  const n = String(layerName).trim().toLowerCase(), t = String(target).trim().toLowerCase();
  if (!t) return false;
  if (rule === "contains") return n.includes(t);
  if (rule === "starts") return n.startsWith(t);
  // exact also accepts a slot number: "artwork", "artwork_2", "artwork 2", "artwork-2", "artwork.2", "artwork2"
  return n === t || new RegExp("^" + escapeRe(t) + "[ _.\\-]?\\d+$").test(n);
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Slot number of a Smart Object ("artwork_2" -> 2); 1 when it has none.
function slotOf(layerName, target) {
  const n = String(layerName).trim().toLowerCase(), t = String(target).trim().toLowerCase();
  const rest = n.startsWith(t) ? n.slice(t.length) : n;
  const m = /(\d+)\s*$/.exec(rest);
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
}

// ---- artwork sets ----------------------------------------------------------
// numbered off: every artwork is its own set of one.
// numbered on: "tee_1.png" + "tee_2.png" form set "tee" (delimiter-aware);
// files with no number are sets of one.
function artworkSets(artworks, numbered, delim) {
  const list = artworks.slice().sort(byName);
  if (!numbered) return list.map((a) => ({ name: splitName(a.name).base, members: { 1: a } }));
  const re = new RegExp("^(.*?)" + escapeRe(delim) + "(\\d+)$");
  const sets = new Map();
  for (const a of list) {
    const base = splitName(a.name).base;
    const m = re.exec(base);
    const key = m ? m[1] : base, idx = m ? parseInt(m[2], 10) : 1;
    if (!sets.has(key)) sets.set(key, { name: key, members: {} });
    const s = sets.get(key);
    if (!s.members[idx]) s.members[idx] = a;
  }
  return Array.from(sets.values());
}

// ---- naming --------------------------------------------------------------
// order: e.g. ["mockup", "artwork", "suffix"]; "" or "none" slots are skipped.
function outputName(o) {
  const parts = { mockup: o.mockup, artwork: o.artwork, suffix: o.suffix };
  const words = (o.order || []).map((k) => parts[k]).filter((v) => v != null && String(v).trim() !== "").map(cleanName);
  const base = words.length ? words.join(o.delim) : cleanName(o.mockup + o.delim + o.artwork);
  return base + "." + OUT_EXT[o.format];
}
// Adds " (2)", " (3)" ... until the name is free.
function uniqueName(name, taken) {
  if (!taken.has(name.toLowerCase())) return name;
  const { base, ext } = splitName(name);
  for (let i = 2; ; i++) { const n = base + " (" + i + ")." + ext; if (!taken.has(n.toLowerCase())) return n; }
}
// Sub-folder for a job, relative to the export folder ("" = the folder itself).
function outputDir(organise, mockup, artwork) {
  if (organise === "mockup") return cleanName(mockup);
  if (organise === "artwork") return cleanName(artwork);
  return "";
}

// ---- jobs ------------------------------------------------------------------
// mockups/artworks: [{ name, ... }] (any extra fields are carried through)
// S: settings (see state.js)
function buildJobs(mockups, artworks, S) {
  const ms = mockups.filter((m) => isMockup(m.name)).sort(byName);
  const sets = artworkSets(artworks.filter((a) => isArtwork(a.name)), S.so.numbered, S.naming.delim);
  // 3.0 colour variants: every job runs once per colour, the colour name joins the artwork name
  const V = S.variants || {}, colours = V.on ? parseColours(V.list) : [];
  const variants = colours.length ? colours : [null];
  const jobs = [];
  const taken = new Map();   // dir -> Set(lower-case names)
  for (const m of ms) {
    for (const set of sets) {
      for (const variant of variants) {
        const mockup = splitName(m.name).base, art = variant ? set.name + S.naming.delim + variant.name : set.name;
        const dir = outputDir(S.export.organise, mockup, set.name);
        if (!taken.has(dir)) taken.set(dir, new Set());
        const name = uniqueName(outputName({ order: S.naming.order, delim: S.naming.delim, mockup, artwork: art, suffix: S.naming.suffix, format: S.export.format }), taken.get(dir));
        taken.get(dir).add(name.toLowerCase());
        jobs.push({ mockup: m, set, dir, name, variant });
      }
    }
  }
  return jobs;
}
// a stable id for a job (resume failed jobs from the last run)
function jobKey(j) { return (j.mockup.rel || j.mockup.name) + "|" + j.set.name + "|" + (j.variant ? j.variant.name : ""); }
function onlyKeys(jobs, keys) { const k = new Set(keys || []); return jobs.filter((j) => k.has(jobKey(j))); }

// ---- 3.0 colour variants -------------------------------------------------------
// "Red #FF0000", "#00FF00 Green", "navy=#001F5B", "#ABC" ... one per line or comma; unnamed colours are named by hex
function parseColours(text) {
  const out = [], seen = new Set();
  for (const part of String(text || "").split(/[\n,;]+/)) {
    const m = /#?([0-9a-f]{6}|[0-9a-f]{3})\b/i.exec(part);
    if (!m || !/#|^[0-9a-f]{3,6}$/i.test(part.trim()) && part.indexOf("#") < 0) continue;
    let hex = m[1].toUpperCase(); if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const name = cleanName(part.replace(m[0], "").replace(/[=:]/g, " ").trim() || hex);
    if (seen.has(name.toLowerCase())) continue; seen.add(name.toLowerCase());
    out.push({ name, hex: "#" + hex });
  }
  return out;
}

// ---- 3.0 text from CSV ---------------------------------------------------------
function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false; const s = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === "," || c === ";" || c === "\t") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((x) => x.trim() !== "")) rows.push(row); row = []; }
    else cell += c;
  }
  row.push(cell); if (row.some((x) => x.trim() !== "")) rows.push(row);
  const headers = (rows.shift() || []).map((h) => h.trim());
  return { headers, rows: rows.map((r) => { const o = {}; headers.forEach((h, i) => { o[h] = (r[i] == null ? "" : r[i]).trim(); }); return o; }) };
}
// the row for an artwork set: the "artwork" (or "file") column matches its name, else the first column
function csvRowFor(csv, setName) {
  if (!csv || !csv.headers.length) return null;
  const key = csv.headers.find((h) => /^(artwork|file|name)$/i.test(h)) || csv.headers[0], want = String(setName).trim().toLowerCase();
  return csv.rows.find((r) => splitName(String(r[key] || "")).base.trim().toLowerCase() === want || String(r[key] || "").trim().toLowerCase() === want) || null;
}
// text layer name -> new text for one row (the key column is left out)
function csvTexts(csv, row) {
  if (!row) return {};
  const key = csv.headers.find((h) => /^(artwork|file|name)$/i.test(h)) || csv.headers[0], out = {};
  for (const h of csv.headers) if (h && h !== key) out[h] = row[h];
  return out;
}

// ---- 3.0 multi-size export ----------------------------------------------------
// "1080x1080, 1920x1080" -> [{ w, h, label }]
function parseSizes(text) {
  const out = [];
  for (const m of String(text || "").matchAll(/(\d{2,5})\s*[x×*]\s*(\d{2,5})/gi)) {
    const w = +m[1], h = +m[2]; if (w > 0 && h > 0 && !out.some((o) => o.w === w && o.h === h)) out.push({ w, h, label: w + "x" + h });
  }
  return out;
}
function sizedName(name, size, delim, format) { const b = splitName(name).base; return b + delim + size.label + "." + (OUT_EXT[format] || splitName(name).ext); }
// fit the image inside the box, centred (the rest of the box is filled)
function fitBox(w, h, W, H) { const k = Math.min(W / w, H / h); const nw = Math.max(1, Math.round(w * k)), nh = Math.max(1, Math.round(h * k)); return { w: nw, h: nh, left: Math.round((W - nw) / 2), top: Math.round((H - nh) / 2) }; }

// ---- 3.0 preview sheet --------------------------------------------------------
// contact-sheet grid for n thumbnails of cell px, at most maxCols wide
function sheetGrid(n, cell, maxCols, gap) {
  const g = gap == null ? 8 : gap, cols = Math.max(1, Math.min(maxCols || 6, Math.ceil(Math.sqrt(n * 1.5)))), rows = Math.max(1, Math.ceil(n / cols));
  return { cols, rows, W: cols * cell + (cols + 1) * g, H: rows * (cell + 18) + (rows + 1) * g, pos: (i) => ({ left: g + (i % cols) * (cell + g), top: g + Math.floor(i / cols) * (cell + 18 + g) }) };
}

// Artwork for one Smart Object of a job (null = leave that SO unchanged).
function artworkForSlot(set, slot, numbered) {
  if (!numbered) return set.members[1] || null;
  return set.members[slot] || null;
}

// ---- placement -------------------------------------------------------------
// Size and position of the artwork inside the Smart Object canvas.
// art: { w, h } natural pixels; can: { w, h }. Returns { w, h, left, top }.
function placeRect(mode, art, can) {
  let w, h;
  if (mode === "stretch") { w = can.w; h = can.h; }
  else if (mode === "center") { w = art.w; h = art.h; }
  else {
    const k = mode === "fill" ? Math.max(can.w / art.w, can.h / art.h) : Math.min(can.w / art.w, can.h / art.h);
    w = art.w * k; h = art.h * k;
  }
  return { w, h, left: (can.w - w) / 2, top: (can.h - h) / 2 };
}
// Does the placed artwork leave part of the canvas uncovered?
function leavesGaps(mode, art, can) {
  const r = placeRect(mode, art, can);
  return r.left > 0.5 || r.top > 0.5;
}

module.exports = {
  MOCKUP_EXT, ART_EXT, DELIMS, splitName, isMockup, isArtwork, cleanName,
  matchesTarget, slotOf, artworkSets, outputName, uniqueName, outputDir,
  buildJobs, artworkForSlot, placeRect, leavesGaps,
  jobKey, onlyKeys, parseColours, parseCSV, csvRowFor, csvTexts, parseSizes, sizedName, fitBox, sheetGrid
};
