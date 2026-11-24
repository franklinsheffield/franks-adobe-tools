"use strict";
// ----------------------------------------------------------------------
// Shared Photoshop / UXP I/O for every tool in the suite. Everything that
// touches the host lives here so each tool's engine stays pure and testable.
//   every modal call goes through modal.js runModal (watchdog + Cancel)
//   reading : executeAsModal + imaging.getPixels (PS 28 needs the modal scope)
//   writing : executeAsModal + createPixelLayer + imaging.putPixels
// ----------------------------------------------------------------------
const photoshop = require("photoshop");
const { app, core, imaging, constants, action } = photoshop;
const { storage } = require("uxp");
const Blend = require("./blend.js");
const { runModal } = require("./modal.js");
const fsys = storage.localFileSystem;

// Per-tool names: call configure() once from the tool's main.js.
const CFG = {
  appName: "Frank's Tools",          // history step + modal command name
  presetFile: "presets.json",        // in the plugin's private data folder
  exportName: "presets.json"         // default file name for Export all
};
function configure(o) { Object.assign(CFG, o || {}); }

function num(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === "object") { const x = v.value != null ? v.value : v._value; return x != null ? Number(x) : fallback; }
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

function activeDoc() {
  try { return app.activeDocument || null; } catch (e) { return null; }
}

function docInfo(doc) {
  return {
    id: doc.id,
    name: doc.name || "Untitled",
    w: Math.round(num(doc.width, 0)),
    h: Math.round(num(doc.height, 0)),
    ppi: num(doc.resolution, 72) || 72
  };
}

function layerBounds(layer, fallbackW, fallbackH) {
  try {
    const b = layer.bounds;
    const l = Math.round(num(b.left, 0)), t = Math.round(num(b.top, 0)), r = Math.round(num(b.right, fallbackW)), btm = Math.round(num(b.bottom, fallbackH));
    if (r > l && btm > t) return { left: l, top: t, right: r, bottom: btm };
  } catch (e) { /* fall through */ }
  return { left: 0, top: 0, right: fallbackW, bottom: fallbackH };
}

function isGroup(layer) {
  try {
    const k = layer.kind;
    const G = constants.LayerKind && constants.LayerKind.GROUP;
    return k != null && (k === G || String(k).toLowerCase() === "group");
  } catch (e) { return false; }
}

// Which things should we process?  [{ kind:"flat" } | { kind:"layer", layer }]
// Brew 3.0 chaining (Frank, 2026-11-24): "prev" = the topmost Brew result group in the document
// (any plugin's "<layer> - Frank's <Tool> Brew - <look>" group), so one plugin runs on another's result.
function findPrevBrew(doc) {
  let top = [];
  try { top = Array.from(doc.layers || []); } catch (e) { top = []; }
  return top.find((l) => { try { return l.visible !== false && /Frank's .+ Brew - /.test(String(l.name || "")); } catch (e) { return false; } }) || null;
}
function collectTargets(doc, source) {
  if (source === "flat") return [{ kind: "flat" }];
  if (source === "prev") {
    const g = findPrevBrew(doc);
    if (!g) throw new Error("No earlier Brew result in this document. Apply another Brew plugin first, or set Source to Flattened document.");
    return [{ kind: "layer", layer: g, prev: true }];
  }
  let layers = [];
  try { layers = Array.from(doc.activeLayers || []); } catch (e) { layers = []; }
  layers = layers.filter((l) => !isGroup(l));
  if (!layers.length) throw new Error("Select at least one pixel layer (or switch Source to Flattened document).");
  if (source === "layer") layers = layers.slice(0, 1);
  return layers.map((l) => ({ kind: "layer", layer: l }));
}

const READ_TIMEOUT_MS = 60000;
const WRITE_TIMEOUT_MS = 5 * 60000;   // big documents; the watchdog only has to end a modal that never settles
function withTimeout(p, ms) {
  let t = null;
  const stop = new Promise((_, rej) => { t = setTimeout(() => rej(new Error("Photoshop did not answer the pixel read in " + Math.round(ms / 1000) + " s. Try again.")), ms); });
  return Promise.race([p, stop]).finally(() => clearTimeout(t));
}

async function getPixels(doc, layerId, bounds, targetSize) {
  // never open a modal read that Photoshop can't finish: an empty area, or a
  // document that was closed while a preview was on its way, can leave a stuck
  // "reading pixels" Progress window that blocks every plugin
  if (bounds && (bounds.right - bounds.left < 1 || bounds.bottom - bounds.top < 1)) throw new Error("Nothing to read: the layer or area is empty.");
  try { if (app.documents && !Array.from(app.documents).some((d) => d.id === doc.id)) throw new Error("gone"); }
  catch (e) { if (e && e.message === "gone") throw new Error("That document is closed."); }
  const opts = { documentID: doc.id, colorSpace: "RGB", componentSize: 8 };
  if (layerId != null) opts.layerID = layerId;
  if (bounds) opts.sourceBounds = bounds;
  if (targetSize) opts.targetSize = targetSize;
  // Photoshop 2027 (28.x) refuses imaging.getPixels outside a modal scope,
  // so reads go through executeAsModal too (found in the first real test).
  return runModal(CFG.appName + ": reading pixels", async () => {
    // a read that never answers must not hold Photoshop's modal state forever
    const r = await withTimeout(imaging.getPixels(opts), READ_TIMEOUT_MS);
    const img = r.imageData;
    const raw = await withTimeout(img.getData({ chunky: true }), READ_TIMEOUT_MS);
    const data = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
    const w = img.width, h = img.height;
    let c = img.components;
    if (!c) c = Math.round(data.length / (w * h));
    try { img.dispose(); } catch (e) { /* ignore */ }
    return { w, h, c, data };
  }, { docId: doc.id, timeoutMs: READ_TIMEOUT_MS * 2 + 5000 });
}

// view = { kind:"detail"|"whole"|"full", size }
async function readSource(doc, target, view) {
  const info = docInfo(doc);
  let bounds = { left: 0, top: 0, right: info.w, bottom: info.h };
  let layerId = null;
  if (target.kind === "layer") {
    // a Brew result group can't be read by layer id ("Unsupported layer type" in PS 28, found on the
    // Mac 2026-11-24): chaining reads the visible composite inside the group's bounds instead
    layerId = target.prev ? null : target.layer.id;
    bounds = layerBounds(target.layer, info.w, info.h);
  }
  const bw = bounds.right - bounds.left, bh = bounds.bottom - bounds.top;
  let scale = 1, origin = { left: bounds.left, top: bounds.top }, src;

  if (view.kind === "detail") {
    const size = view.size || 360;
    const cw = Math.min(bw, size), ch = Math.min(bh, size);
    const l = bounds.left + Math.floor((bw - cw) / 2), t = bounds.top + Math.floor((bh - ch) / 2);
    src = await getPixels(doc, layerId, { left: l, top: t, right: l + cw, bottom: t + ch });
    origin = { left: l, top: t };
  } else if (view.kind === "region") {
    // Brew 3.0 zoom: a rect of the source (relative to the layer bounds), read at view.scale (<= 1)
    const r = view.rect, sc = Math.min(1, view.scale || 1);
    const l = bounds.left + r.l, t = bounds.top + r.t;
    const rb = { left: l, top: t, right: l + r.w, bottom: t + r.h };
    src = sc < 1 ? await getPixels(doc, layerId, rb, { width: Math.max(1, Math.round(r.w * sc)), height: Math.max(1, Math.round(r.h * sc)) }) : await getPixels(doc, layerId, rb);
    scale = src.w / r.w;
    origin = { left: l, top: t };
  } else if (view.kind === "whole") {
    const size = view.size || 360;
    scale = Math.min(1, size / Math.max(bw, bh));
    if (scale < 1) {
      src = await getPixels(doc, layerId, bounds, { width: Math.max(1, Math.round(bw * scale)), height: Math.max(1, Math.round(bh * scale)) });
      scale = src.w / bw;
    } else src = await getPixels(doc, layerId, bounds);
  } else {
    src = await getPixels(doc, layerId, bounds);
  }
  return { src, scale, ppi: info.ppi, origin, info };
}

// A result layer is either
//   { name, color:[r,g,b], mask:Uint8Array(n) 0..255, blend }   one ink, or
//   { name, rgba:Uint8Array(n*4), blend, opacity? }              full colour
function layerRGBA(L, n) {
  // Photoshop's imaging API takes only Uint8Array / Uint16Array / Float32Array (not Uint8ClampedArray)
  if (L.rgba) return L.rgba.constructor === Uint8Array ? L.rgba : new Uint8Array(L.rgba.buffer, L.rgba.byteOffset, L.rgba.length);
  const out = new Uint8Array(n * 4), c = L.color, m = L.mask;
  for (let i = 0, p = 0; i < n; i++, p += 4) { out[p] = c[0]; out[p + 1] = c[1]; out[p + 2] = c[2]; out[p + 3] = m[i]; }
  return out;
}
function layerRGBonWhite(L, n) {
  const out = new Uint8Array(n * 3);
  if (L.rgba) {
    const s = L.rgba;
    for (let i = 0, p = 0, q = 0; i < n; i++, p += 3, q += 4) {
      const t = s[q + 3] / 255;
      out[p] = s[q] * t + 255 * (1 - t); out[p + 1] = s[q + 1] * t + 255 * (1 - t); out[p + 2] = s[q + 2] * t + 255 * (1 - t);
    }
    return out;
  }
  const c = L.color, m = L.mask;
  for (let i = 0, p = 0; i < n; i++, p += 3) {
    const t = m[i] / 255;
    out[p] = c[0] * t + 255 * (1 - t); out[p + 1] = c[1] * t + 255 * (1 - t); out[p + 2] = c[2] * t + 255 * (1 - t);
  }
  return out;
}

async function putLayerPixels(doc, layer, buf, w, h, components, origin) {
  const imageData = await imaging.createImageDataFromBuffer(buf, { width: w, height: h, components, colorSpace: "RGB", chunky: true });
  try {
    await imaging.putPixels({ documentID: doc.id, layerID: layer.id, imageData, replace: true, targetBounds: { left: origin.left, top: origin.top } });
  } finally {
    try { imageData.dispose(); } catch (e) { /* ignore */ }
  }
}

// res = engine result; opts = { origin, groupName, hideSource, hideLayers, paperLayer, hiddenIds, blend }
// blend (optional) = { mode, opacity }: set on the result group (shared/blend.js)
// hiddenIds (optional array) receives the ids of the source layers this call hid
async function writeResult(doc, res, opts) {
  const n = res.w * res.h;
  const warnings = [];
  await runModal(CFG.appName, async (ctl) => {
    let hid = null;
    try { hid = await ctl.hostControl.suspendHistory({ documentID: doc.id, name: CFG.appName }); } catch (e) { hid = null; }
    try {
      // the source is hidden at the end: Photoshop 2027 ignores hiding a
      // document's only layer, so it must happen after our layers exist
      const sourceLayers = opts.hideSource ? (opts.hideLayers && opts.hideLayers.length ? opts.hideLayers : Array.from(doc.layers)) : [];
      const made = [], toHide = [];   // layers flagged hidden (Colour Deck "only") are hidden after the group exists
      const paper = res.paper || (opts.paperLayer ? [255, 255, 255] : null);
      if (paper) {
        const pl = await doc.createPixelLayer({ name: "Paper " + toHex(paper), opacity: 100, fillNeutral: false });
        const buf = new Uint8Array(n * 4);
        for (let i = 0, p = 0; i < n; i++, p += 4) { buf[p] = paper[0]; buf[p + 1] = paper[1]; buf[p + 2] = paper[2]; buf[p + 3] = 255; }
        await putLayerPixels(doc, pl, buf, res.w, res.h, 4, opts.origin);
        made.push(pl);
        if (res.paperHidden) toHide.push(pl);
      }
      for (const L of res.layers) {
        const pl = await doc.createPixelLayer({ name: L.name, opacity: L.opacity == null ? 100 : L.opacity, fillNeutral: false });
        let blend = L.blend;
        try {
          await putLayerPixels(doc, pl, layerRGBA(L, n), res.w, res.h, 4, opts.origin);
        } catch (e) {
          // fallback: opaque RGB on white, multiplied
          warnings.push("RGBA write failed for " + L.name + " (" + e.message + "); used Multiply fallback.");
          await putLayerPixels(doc, pl, layerRGBonWhite(L, n), res.w, res.h, 3, opts.origin);
          if (blend === "NORMAL") blend = "MULTIPLY";
        }
        try { pl.blendMode = constants.BlendMode[blend] || constants.BlendMode.NORMAL; } catch (e) { /* ignore */ }
        made.push(pl);
        if (L.hidden) toHide.push(pl);
      }
      let group = null;
      try {
        group = await doc.createLayerGroup({ name: opts.groupName, fromLayers: made });
      } catch (e) {
        group = await doc.createLayerGroup({ name: opts.groupName });
        for (const pl of made) { try { await pl.move(group, constants.ElementPlacement.PLACEINSIDE); } catch (e2) { warnings.push("Could not move layer into group: " + e2.message); } }
      }
      // chaining: the active layer sits inside the previous Brew group, so Photoshop made the new
      // group inside it; move it out, above that group, before the old one is hidden (Mac 2026-11-24)
      if (opts.placeAbove && group) {
        try { await group.move(opts.placeAbove, constants.ElementPlacement.PLACEBEFORE); }
        catch (e) { warnings.push("Could not move the new group above the previous result: " + e.message); }
      }
      if (opts.blend && group) Blend.applyToGroup(group, opts.blend, constants);
      for (const pl of toHide) { try { pl.visible = false; } catch (e) { /* ignore */ } }
      for (const L of sourceLayers) { try { if (L.visible) { L.visible = false; if (opts.hiddenIds) opts.hiddenIds.push(L.id); } } catch (e) { /* locked or group */ } }
    } finally {
      if (hid != null) { try { await ctl.hostControl.resumeHistory(hid); } catch (e) { /* ignore */ } }
    }
  }, { docId: doc.id, timeoutMs: WRITE_TIMEOUT_MS });
  return warnings;
}

// Opens Photoshop's own colour picker on `hex`; resolves to "#RRGGBB", or
// null when the user cancels. Used by every colour swatch in the suite.
async function pickColor(hex, title) {
  const h = String(hex || "#FFFFFF").replace("#", "");
  const start = { red: parseInt(h.slice(0, 2), 16) || 0, grain: parseInt(h.slice(2, 4), 16) || 0, blue: parseInt(h.slice(4, 6), 16) || 0 };
  const res = await runModal(CFG.appName + ": pick colour", async () => action.batchPlay([{
    _obj: "showColorPicker",
    context: title || CFG.appName,
    color: { _obj: "RGBColor", red: start.red, grain: start.grain, blue: start.blue }
  }], {}), { timeoutMs: 10 * 60000 });   // the user may sit in the picker
  const r = res && res[0];
  if (!r || r.value === false) return null;
  const c = r.RGBFloatColor || r.color || r;
  const g = c.grain != null ? c.grain : c.green;
  if (c.red == null || g == null || c.blue == null) return null;
  return toHex([c.red, g, c.blue].map((v) => Math.max(0, Math.min(255, v))));
}

function toHex(c) { return "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase(); }

// ---- user presets (stored in the plugin's data folder) ------------------
async function loadUserPresets() {
  try {
    const folder = await fsys.getDataFolder();
    const f = await folder.getEntry(CFG.presetFile);
    const parsed = JSON.parse(await f.read());
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}
async function saveUserPresets(list) {
  const folder = await fsys.getDataFolder();
  const f = await folder.createFile(CFG.presetFile, { overwrite: true });
  await f.write(JSON.stringify(list));
}
async function exportPresets(list) {
  const f = await fsys.getFileForSaving(CFG.exportName, { types: ["json"] });
  if (!f) return false;
  await f.write(JSON.stringify(list, null, 2));
  return true;
}
async function importPresets() {
  const f = await fsys.getFileForOpening({ types: ["json"] });
  if (!f) return null;
  const parsed = JSON.parse(await f.read());
  return Array.isArray(parsed) ? parsed : null;
}

// ---- small JSON store in the plugin's data folder (e.g. settings saved per applied group)
async function loadData(name) {
  try { const folder = await fsys.getDataFolder(); const f = await folder.getEntry(name); return JSON.parse(await f.read()); } catch (e) { return null; }
}
async function saveData(name, obj) {
  const folder = await fsys.getDataFolder();
  const f = await folder.createFile(name, { overwrite: true });
  await f.write(JSON.stringify(obj));
}
// the first selected layer of `doc` (or null)
function activeLayer(doc) { try { const a = Array.from(doc.activeLayers || []); return a[0] || null; } catch (e) { return null; } }
// hide one layer or group in its own modal step
async function hideLayer(layer) {
  await runModal(CFG.appName + ": hide old version", async () => { try { layer.visible = false; } catch (e) { /* locked */ } }, { timeoutMs: 15000 });
}
// re-edit swap in one History step: hide the old group, show the source layers it hid (by id)
async function swapToSource(doc, group, ids) {
  await runModal(CFG.appName + ": re-edit", async () => {
    const want = new Set(ids || []);
    const walk = (list) => { for (const L of Array.from(list || [])) { if (want.has(L.id)) { try { L.visible = true; } catch (e) { /* locked */ } } if (L.layers) walk(L.layers); } };
    walk(doc.layers);
    try { group.visible = false; } catch (e) { /* locked */ }
  }, { timeoutMs: 15000 });
}

// ---- Colour 3.0: swatch sync + palette files ------------------------------
// Photoshop's foreground / background colours as "#RRGGBB" (null when unreadable)
function getFgBg() {
  const hx = (c) => { try { const h = c && c.rgb && c.rgb.hexValue; return h ? "#" + String(h).toUpperCase() : null; } catch (e) { return null; } };
  return { fg: hx(app.foregroundColor), bg: hx(app.backgroundColor) };
}
// adds each colour to the Swatches panel (named "<name> 1..n"); returns the count added
async function addSwatches(colors, name) {
  const list = colors.map((h, i) => {
    const c = String(h).replace("#", "");
    return { _obj: "make", _target: [{ _ref: "colors" }], using: { _obj: "colors", name: (name || "Brew") + " " + (i + 1) + " " + h, color: { _obj: "RGBColor", red: parseInt(c.slice(0, 2), 16), grain: parseInt(c.slice(2, 4), 16), blue: parseInt(c.slice(4, 6), 16) } } };
  });
  await runModal(CFG.appName + ": add swatches", async () => action.batchPlay(list, {}), { timeoutMs: 30000 });
  return list.length;
}
// open a palette file (.ase .aco .gpl .txt .hex): resolves { name, data } or null
async function openPaletteFile() {
  const f = await fsys.getFileForOpening({ types: ["ase", "aco", "gpl", "txt", "hex"] });
  if (!f) return null;
  const ext = String(f.name || "").toLowerCase().split(".").pop(), bin = ext === "ase" || ext === "aco";
  const data = bin ? await f.read({ format: storage.formats.binary }) : await f.read();
  return { name: f.name, data };
}
// save text or bytes (Uint8Array) through the system Save dialog
async function savePaletteFile(name, data) {
  const ext = String(name).split(".").pop();
  const f = await fsys.getFileForSaving(name, { types: [ext] });
  if (!f) return false;
  if (typeof data === "string") await f.write(data);
  else await f.write(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), { format: storage.formats.binary });
  return true;
}
module.exports = {
  getFgBg, addSwatches, openPaletteFile, savePaletteFile,
  findPrevBrew, configure, loadData, saveData, activeLayer, hideLayer, swapToSource, get APP_NAME() { return CFG.appName; }, activeDoc, docInfo, collectTargets, readSource, writeResult, getPixels,
  loadUserPresets, saveUserPresets, exportPresets, importPresets, pickColor
};
