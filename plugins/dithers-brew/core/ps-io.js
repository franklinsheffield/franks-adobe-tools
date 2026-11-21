"use strict";
// ----------------------------------------------------------------------
// Shared Photoshop / UXP I/O for every tool in the suite. Everything that
// touches the host lives here so each tool's engine stays pure and testable.
//   reading : imaging.getPixels  (no modal scope needed)
//   writing : executeAsModal + createPixelLayer + imaging.putPixels
// ----------------------------------------------------------------------
const photoshop = require("photoshop");
const { app, core, imaging, constants } = photoshop;
const { storage } = require("uxp");
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
function collectTargets(doc, source) {
  if (source === "flat") return [{ kind: "flat" }];
  let layers = [];
  try { layers = Array.from(doc.activeLayers || []); } catch (e) { layers = []; }
  layers = layers.filter((l) => !isGroup(l));
  if (!layers.length) throw new Error("Select at least one pixel layer (or switch Source to Flattened document).");
  if (source === "layer") layers = layers.slice(0, 1);
  return layers.map((l) => ({ kind: "layer", layer: l }));
}

async function getPixels(doc, layerId, bounds, targetSize) {
  const opts = { documentID: doc.id, colorSpace: "RGB", componentSize: 8 };
  if (layerId != null) opts.layerID = layerId;
  if (bounds) opts.sourceBounds = bounds;
  if (targetSize) opts.targetSize = targetSize;
  const r = await imaging.getPixels(opts);
  const img = r.imageData;
  const raw = await img.getData({ chunky: true });
  const data = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const w = img.width, h = img.height;
  let c = img.components;
  if (!c) c = Math.round(data.length / (w * h));
  try { img.dispose(); } catch (e) { /* ignore */ }
  return { w, h, c, data };
}

// view = { kind:"detail"|"whole"|"full", size }
async function readSource(doc, target, view) {
  const info = docInfo(doc);
  let bounds = { left: 0, top: 0, right: info.w, bottom: info.h };
  let layerId = null;
  if (target.kind === "layer") {
    layerId = target.layer.id;
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
  if (L.rgba) return L.rgba;
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

// res = engine result; opts = { origin, groupName, hideSource, hideLayers, paperLayer }
async function writeResult(doc, res, opts) {
  const n = res.w * res.h;
  const warnings = [];
  await core.executeAsModal(async (ctl) => {
    let hid = null;
    try { hid = await ctl.hostControl.suspendHistory({ documentID: doc.id, name: CFG.appName }); } catch (e) { hid = null; }
    try {
      if (opts.hideSource) {
        const list = opts.hideLayers && opts.hideLayers.length ? opts.hideLayers : Array.from(doc.layers);
        for (const L of list) { try { L.visible = false; } catch (e) { /* locked or group */ } }
      }
      const made = [];
      const paper = res.paper || (opts.paperLayer ? [255, 255, 255] : null);
      if (paper) {
        const pl = await doc.createPixelLayer({ name: "Paper " + toHex(paper), opacity: 100, fillNeutral: false });
        const buf = new Uint8Array(n * 4);
        for (let i = 0, p = 0; i < n; i++, p += 4) { buf[p] = paper[0]; buf[p + 1] = paper[1]; buf[p + 2] = paper[2]; buf[p + 3] = 255; }
        await putLayerPixels(doc, pl, buf, res.w, res.h, 4, opts.origin);
        made.push(pl);
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
      }
      let group = null;
      try {
        group = await doc.createLayerGroup({ name: opts.groupName, fromLayers: made });
      } catch (e) {
        group = await doc.createLayerGroup({ name: opts.groupName });
        for (const pl of made) { try { await pl.move(group, constants.ElementPlacement.PLACEINSIDE); } catch (e2) { warnings.push("Could not move layer into group: " + e2.message); } }
      }
    } finally {
      if (hid != null) { try { await ctl.hostControl.resumeHistory(hid); } catch (e) { /* ignore */ } }
    }
  }, { commandName: CFG.appName });
  return warnings;
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

module.exports = {
  configure, get APP_NAME() { return CFG.appName; }, activeDoc, docInfo, collectTargets, readSource, writeResult,
  loadUserPresets, saveUserPresets, exportPresets, importPresets
};
