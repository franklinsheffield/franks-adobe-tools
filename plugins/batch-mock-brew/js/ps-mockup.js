"use strict";
// ======================================================================
// Batch Mock Brew: every Photoshop / file-system call lives here.
// Call these from inside core.executeAsModal (the panel does that per job).
//   folders : pick, persistent tokens, list files, export sub-folders
//   mockup  : open, find target Smart Objects, close without saving
//   replace : edit SO contents, place artwork, size it, save + close the SO
//   export  : JPG / PNG / PSD copies, MP4 through Render Video
// The mockup files on disk are never saved.
// ======================================================================
const photoshop = require("photoshop");
const { app, constants, action } = photoshop;
const { storage } = require("uxp");
const fsys = storage.localFileSystem;
const Plan = require("./plan.js");

const DONT = { dialogOptions: "dontDisplay" };
const play = (cmds) => action.batchPlay(Array.isArray(cmds) ? cmds : [cmds], DONT);
const px = (v) => ({ _unit: "pixelsUnit", _value: v });
function num(v, d) {
  if (v == null) return d;
  if (typeof v === "object") { const x = v._value != null ? v._value : v.value; return x != null ? Number(x) : d; }
  const n = Number(v); return isNaN(n) ? d : n;
}
function hexRGB(h) {
  h = String(h || "#FFFFFF").replace("#", "");
  return { _obj: "RGBColor", red: parseInt(h.slice(0, 2), 16) || 0, grain: parseInt(h.slice(2, 4), 16) || 0, blue: parseInt(h.slice(4, 6), 16) || 0 };
}

// ---- folders ---------------------------------------------------------------
async function pickFolder() { return fsys.getFolder(); }
async function tokenFor(entry) { return fsys.createPersistentToken(entry); }
async function folderFromToken(token) { return token ? fsys.getEntryForPersistentToken(token) : null; }
const pathOf = (e) => (e && (e.nativePath || e.name)) || "";

// Files in a folder (optionally sub-folders), as [{ name, entry, rel }]
async function listFiles(folder, recursive, keep) {
  const out = [];
  async function walk(f, rel) {
    let kids = [];
    try { kids = await f.getEntries(); } catch (e) { return; }
    for (const k of kids) {
      if (k.name.startsWith(".")) continue;
      if (k.isFolder) { if (recursive) await walk(k, rel + k.name + "/"); }
      else if (keep(k.name)) out.push({ name: k.name, entry: k, rel: rel + k.name });
    }
  }
  await walk(folder, "");
  return out;
}

async function subFolder(root, name, cache) {
  if (!name) return root;
  if (cache && cache[name]) return cache[name];
  let f = null;
  try { f = await root.getEntry(name); } catch (e) { f = null; }
  if (!f || !f.isFolder) f = await root.createFolder(name);
  if (cache) cache[name] = f;
  return f;
}
async function exists(folder, name) {
  try { const e = await folder.getEntry(name); return !!e; } catch (e) { return false; }
}
// A free name on disk: "x.jpg", then "x (2).jpg" ...
async function freeName(folder, name) {
  if (!(await exists(folder, name))) return name;
  const { base, ext } = Plan.splitName(name);
  for (let i = 2; i < 1000; i++) { const n = base + " (" + i + ")." + ext; if (!(await exists(folder, n))) return n; }
  return name;
}
async function writeText(folder, name, text) {
  const f = await folder.createFile(name, { overwrite: true });
  await f.write(text);
}

// ---- settings file in the plugin data folder -------------------------------
async function loadSettings(file) {
  try { const d = await fsys.getDataFolder(); const f = await d.getEntry(file); return JSON.parse(await f.read()); } catch (e) { return null; }
}
async function saveSettings(file, obj) {
  const d = await fsys.getDataFolder();
  const f = await d.createFile(file, { overwrite: true });
  await f.write(JSON.stringify(obj));
}

// ---- mockups ---------------------------------------------------------------
async function openDoc(entry) { return app.open(entry); }
async function closeDoc(doc) { try { await doc.closeWithoutSaving(); } catch (e) { /* already closed */ } }

function isSmartObject(layer) {
  const k = layer.kind, S = constants.LayerKind && constants.LayerKind.SMARTOBJECT;
  return k != null && (k === S || String(k).toLowerCase() === "smartobject");
}
function walkLayers(layers, fn) {
  for (const L of Array.from(layers || [])) { fn(L); if (L.layers) walkLayers(L.layers, fn); }
}
async function layerDesc(doc, id) {
  const r = await play({ _obj: "get", _target: [{ _ref: "layer", _id: id }, { _ref: "document", _id: doc.id }] });
  return (r && r[0]) || {};
}

// Target Smart Objects of a mockup: [{ layer, id, name, slot, soId }]
// Linked-file SOs are left out (editing them would change files on disk);
// instances that share one embedded SO are edited once.
async function findTargets(doc, so) {
  const hits = [], skipped = [];
  walkLayers(doc.layers, (L) => { if (isSmartObject(L) && Plan.matchesTarget(L.name, so.name, so.rule)) hits.push(L); });
  // a shared Smart Object is edited once, through its lowest slot number
  hits.sort((a, b) => Plan.slotOf(a.name, so.name) - Plan.slotOf(b.name, so.name));
  const seen = new Set(), out = [];
  for (const L of hits) {
    const d = await layerDesc(doc, L.id);
    const sm = d.smartObjectMore || {}, sob = d.smartObject || {};
    if (sob.linked === true) { skipped.push(L.name + " (linked file)"); continue; }
    const key = sm.ID || ("layer" + L.id);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ layer: L, id: L.id, name: L.name, slot: Plan.slotOf(L.name, so.name), soId: key });
    if (!so.all) break;
  }
  return { targets: out, skipped };
}

// ---- replace one Smart Object's contents -----------------------------------
async function selectLayer(doc, id) {
  await play({ _obj: "select", _target: [{ _ref: "layer", _id: id }, { _ref: "document", _id: doc.id }], makeVisible: false });
}
function boundsOf(layer) {
  const b = layer.boundsNoEffects || layer.bounds;
  const l = num(b.left, 0), t = num(b.top, 0);
  return { left: l, top: t, w: num(b.right, 0) - l, h: num(b.bottom, 0) - t };
}

// placeArt = { entry, name } ; P = settings
async function replaceContents(doc, target, art, P) {
  await selectLayer(doc, target.id);
  await play({ _obj: "placedLayerEditContents" });
  const so = app.activeDocument;
  if (!so || so.id === doc.id) throw new Error("Could not open Smart Object \"" + target.name + "\"");
  try {
    const can = { w: num(so.width, 0), h: num(so.height, 0) };
    const old = Array.from(so.layers).map((L) => L.id);
    if (old.length) await selectLayer(so, old[0]);   // new layers go on top
    const needBg = P.place.bg !== "transparent";
    if (needBg) {
      const hex = P.place.bg === "white" ? "#FFFFFF" : P.place.bg === "black" ? "#000000" : P.place.bgHex;
      await play({ _obj: "make", _target: [{ _ref: "contentLayer" }], using: { _obj: "contentLayer", name: "Background fill", type: { _obj: "solidColorLayer", color: hexRGB(hex) } } });
    }
    const token = await fsys.createSessionToken(art.entry);
    const place = { _obj: "placeEvent", null: { _path: token, _kind: "local" }, linked: false,
      freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" },
      offset: { _obj: "offset", horizontal: px(0), vertical: px(0) } };
    if (Plan.splitName(art.name).ext === "pdf") place.as = { _obj: "PDFGenericFormat", selection: { _enum: "pdfSelection", _value: "page" }, pageNumber: 1, crop: { _enum: "cropTo", _value: "boundingBox" } };
    await play(place);
    const L = so.activeLayers[0];
    if (!L || old.includes(L.id)) throw new Error("Placing " + art.name + " failed");
    try { L.name = Plan.splitName(art.name).base; } catch (e) { /* cosmetic */ }
    // natural size of the artwork (Center mode), else its placed size
    const now = boundsOf(L);
    let nat = { w: now.w, h: now.h };
    try {
      const d = await layerDesc(so, L.id), sz = d.smartObjectMore && d.smartObjectMore.size;
      if (sz && num(sz.width, 0) > 0 && num(sz.height, 0) > 0) nat = { w: num(sz.width, 0), h: num(sz.height, 0) };
    } catch (e) { /* keep placed size */ }
    const aspectArt = P.place.mode === "center" ? nat : { w: now.w, h: now.h };
    const r = Plan.placeRect(P.place.mode, aspectArt, can);
    if (now.w > 0 && now.h > 0) {
      await L.scale(100 * r.w / now.w, 100 * r.h / now.h, constants.AnchorPosition ? constants.AnchorPosition.TOPLEFT : undefined);
      const b = boundsOf(L);
      await L.translate(r.left - b.left, r.top - b.top);
    }
    for (const id of old) { const o = Array.from(so.layers).find((x) => x.id === id); if (o) { try { await o.delete(); } catch (e) { o.visible = false; } } }
    await play({ _obj: "close", saving: { _enum: "yesNo", _value: "yes" } });
  } catch (e) {
    try { if (app.activeDocument && app.activeDocument.id === so.id) await so.closeWithoutSaving(); } catch (e2) { /* ignore */ }
    throw e;
  }
}

// ---- export ------------------------------------------------------------------
async function exportDoc(doc, folder, name, E) {
  const fmt = E.format;
  if (fmt === "mp4") return renderVideo(doc, folder, name);
  const file = await folder.createFile(name, { overwrite: true });
  if (fmt === "jpg") return doc.saveAs.jpg(file, { quality: Math.max(1, Math.min(12, Math.round(E.quality))) }, true);
  if (fmt === "psd") return doc.saveAs.psd(file, { maximizeCompatibility: true }, true);
  if (fmt === "png") {
    let fill = null;
    if (!E.pngAlpha) {
      await play({ _obj: "make", _target: [{ _ref: "contentLayer" }], using: { _obj: "contentLayer", name: "Export white", type: { _obj: "solidColorLayer", color: hexRGB("#FFFFFF") } } });
      fill = doc.activeLayers[0];
      try { await play({ _obj: "move", _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }], to: { _ref: "layer", _enum: "ordinal", _value: "back" } }); } catch (e) { /* has a Background */ }
    }
    try { return await doc.saveAs.png(file, { compression: 6 }, true); }
    finally { if (fill) { try { await fill.delete(); } catch (e) { /* ignore */ } } }
  }
  throw new Error("Unknown format " + fmt);
}

// Does the active document have a Video Timeline with more than one frame?
// (Render Video on a document without one writes a 1-frame clip.)
async function hasTimeline() {
  try {
    const r = await play({ _obj: "get", _target: [{ _property: "frameCount" }, { _ref: "timeline" }] });
    return num(r && r[0] && r[0].frameCount, 0) > 1;
  } catch (e) { return false; }
}

// MP4 (H.264) through File > Export > Render Video. Needs a Video Timeline.
async function renderVideo(doc, folder, name) {
  const dir = await fsys.createSessionToken(folder);
  const r = await play({ _obj: "export", using: {
    _obj: "videoExport", directory: { _path: dir, _kind: "local" }, name,
    ameFormatName: "H.264", amePresetName: "1_High Quality.epr",
    useDocumentSize: true, useDocumentFrameRate: true,
    pixelAspectRatio: { _enum: "pixelAspectRatio", _value: "document" },
    fieldOrder: { _enum: "videoField", _value: "preset" },
    manage: true, allFrames: true,
    renderAlpha: { _enum: "alphaRendering", _value: "none" }, quality: 1
  } });
  const res = r && r[0];
  if (res && res._obj === "error") throw new Error("Render Video failed (" + (res.message || "the mockup needs a Video Timeline") + ")");
  return res;
}

module.exports = {
  pickFolder, tokenFor, folderFromToken, pathOf, listFiles, subFolder, exists, freeName, writeText,
  loadSettings, saveSettings, openDoc, closeDoc, findTargets, replaceContents, exportDoc, renderVideo, hasTimeline
};
