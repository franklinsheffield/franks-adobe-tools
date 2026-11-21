"use strict";
// ======================================================================
// Batch Mock Brew planner: pure JS, no Photoshop calls, unit tested.
// Folder lists in, a job list out: which artwork goes into which Smart
// Object of which mockup, and where each result is saved under what name.
// ======================================================================

const MOCKUP_EXT = ["psd", "psb"];
const ART_EXT = ["jpg", "jpeg", "png", "psd", "psb", "pdf", "tif", "tiff", "gif", "bmp"];
const OUT_EXT = { jpg: "jpg", png: "png", psd: "psd", mp4: "mp4" };
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
  const jobs = [];
  const taken = new Map();   // dir -> Set(lower-case names)
  for (const m of ms) {
    for (const set of sets) {
      const mockup = splitName(m.name).base;
      const dir = outputDir(S.export.organise, mockup, set.name);
      if (!taken.has(dir)) taken.set(dir, new Set());
      const name = uniqueName(outputName({ order: S.naming.order, delim: S.naming.delim, mockup, artwork: set.name, suffix: S.naming.suffix, format: S.export.format }), taken.get(dir));
      taken.get(dir).add(name.toLowerCase());
      jobs.push({ mockup: m, set, dir, name });
    }
  }
  return jobs;
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
  buildJobs, artworkForSlot, placeRect, leavesGaps
};
