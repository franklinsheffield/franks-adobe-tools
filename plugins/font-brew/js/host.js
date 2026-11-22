"use strict";
// ======================================================================
// Font Brew's Photoshop calls (reading only: Font Brew never changes the
// document). Pixels go through the shared ps-io so the PS 28 modal rule holds.
// ======================================================================
const photoshop = require("photoshop");
const { app, core, action, constants } = photoshop;
const { storage } = require("uxp");
const PS = require("../core/ps-io.js");
const fsys = storage.localFileSystem;
const PROJECTS = "fontbrew-projects.json";

function isGroup(l) {
  try {
    const k = l.kind, G = constants.LayerKind && constants.LayerKind.GROUP;
    return k != null && (k === G || String(k).toLowerCase() === "group");
  } catch (e) { return false; }
}
function leaves(list, out) {
  for (const l of list) {
    if (isGroup(l)) { let kids = []; try { kids = Array.from(l.layers || []); } catch (e) { kids = []; } leaves(kids, out); }
    else out.push(l);
  }
  return out;
}

// Selected layers, with groups opened up into their layers.
function selectedLayers(doc) {
  let sel = [];
  try { sel = Array.from(doc.activeLayers || []); } catch (e) { sel = []; }
  const seen = new Set();
  return leaves(sel, []).filter((l) => { if (seen.has(l.id)) return false; seen.add(l.id); return true; });
}

// Layer pixels, longest side capped at maxSize (scale = image px per doc px).
async function readLayer(doc, layer, maxSize) {
  const r = await PS.readSource(doc, { kind: "layer", layer }, { kind: "whole", size: maxSize || 1000 });
  return { img: r.src, origin: r.origin, scale: r.scale, ppi: r.ppi };
}

// Shape layers: the vector mask path, or null. Read-only batchPlay "get".
// Photoshop 28 quits when asked for a path that doesn't exist, so the layer's
// hasVectorMask flag is checked first and only shape layers are asked.
async function hasVectorMask(doc, layer) {
  try {
    const r = await action.batchPlay([{ _obj: "get", _target: [{ _property: "hasVectorMask" }, { _ref: "layer", _id: layer.id }, { _ref: "document", _id: doc.id }], _options: { dialogOptions: "dontDisplay" } }], {});
    return !!(r && r[0] && r[0].hasVectorMask === true);
  } catch (e) { return false; }
}
async function readVectorMask(doc, layer) {
  if (!(await hasVectorMask(doc, layer))) return null;
  const targets = [
    [{ _ref: "path", _enum: "path", _value: "vectorMask" }, { _ref: "layer", _id: layer.id }, { _ref: "document", _id: doc.id }],
    [{ _property: "pathContents" }, { _ref: "path", _enum: "path", _value: "vectorMask" }, { _ref: "layer", _id: layer.id }, { _ref: "document", _id: doc.id }]
  ];
  for (const t of targets) {
    try {
      const r = await action.batchPlay([{ _obj: "get", _target: t, _options: { dialogOptions: "dontDisplay" } }], {});
      const d = r && r[0];
      if (d && d.pathContents && d.pathContents.pathComponents) return d;
    } catch (e) { /* no vector mask: fall through */ }
  }
  return null;
}

// Horizontal guides: the lowest is the baseline, the next one up the cap height.
function horizontalGuides(doc) {
  try {
    const H = constants.Direction ? constants.Direction.HORIZONTAL : "horizontal";
    const ys = Array.from(doc.guides || []).filter((g) => g.direction === H || String(g.direction).toLowerCase() === "horizontal").map((g) => Number(g.coordinate)).filter((v) => !isNaN(v)).sort((a, b) => b - a);
    if (!ys.length) return null;
    return { baseline: ys[0], cap: ys.length > 1 ? ys[ys.length - 1] : null };
  } catch (e) { return null; }
}

async function saveFont(buffer, fileName) {
  const f = await fsys.getFileForSaving(fileName, { types: ["otf"] });
  if (!f) return null;
  await f.write(buffer, { format: storage.formats.binary });
  return f.nativePath || f.name || fileName;
}

// Per-document mapping (manual assignments, per-glyph spacing) in the plugin's data folder.
async function loadProjects() {
  try { const folder = await fsys.getDataFolder(); const f = await folder.getEntry(PROJECTS); const o = JSON.parse(await f.read()); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { return {}; }
}
async function saveProjects(all) {
  const folder = await fsys.getDataFolder();
  const f = await folder.createFile(PROJECTS, { overwrite: true });
  await f.write(JSON.stringify(all));
}

module.exports = { hasVectorMask, activeDoc: PS.activeDoc, docInfo: PS.docInfo, selectedLayers, readLayer, readVectorMask, horizontalGuides, saveFont, loadProjects, saveProjects };
