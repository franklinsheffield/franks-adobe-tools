"use strict";
// Frank's Font Brew - panel UI: selected layers -> an installable .otf font.
// Reads the document only; never changes it.
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");
const { parseLayerName, SETS } = require("./js/charmap.js");
const T = require("./js/trace.js");
const F = require("./js/fontbuild.js");
const { bestReading } = require("./js/pathread.js");
const H = require("./js/host.js");

const MAX_READ = 1000;          // longest side read per layer, px
const TITLE = "Frank's Font Brew";

// ---- project: which layer is which character (per document) ---------------
const project = {
  doc: null,                    // document name the mapping belongs to
  glyphs: {},                   // ch -> { layerId, name, adj:{lsb,rsb,dy} }
  layers: {},                   // layerId -> { name, img, origin, scale, ppi, path }
  unassigned: [],               // [{ id, name, why }]
  custom: "",                   // extra characters shown in the grid
  current: null,                // ch selected in the grid
  notes: []
};
let saved = {};                 // all documents' saved assignments
const traceCache = new Map();   // layerId|settings -> { contours, how }
const demoCache = new Map();

function outlineKey(o) { return [o.source, o.ink, o.threshold, o.smooth, o.corner, o.minArea].join("|"); }

function outlineFor(id, o) {
  const key = id + "|" + outlineKey(o);
  if (traceCache.has(key)) return traceCache.get(key);
  const L = project.layers[id];
  let r = null;
  if (o.source === "auto" && L.path) {
    const mask = T.inkMask(L.img, { ink: "alpha", threshold: 50 });
    const best = bestReading(L.path, L.ppi, mask, L.origin, L.scale);
    if (best && !best.rejected) r = { contours: best.contours, how: "path" };
  }
  if (!r) r = { contours: T.traceImage(L.img, o).contours, how: "trace" };
  traceCache.set(key, r);
  return r;
}

function demoSources(o) {
  const key = outlineKey(o);
  if (!demoCache.has(key)) {
    demoCache.clear();
    demoCache.set(key, Array.from(F.DEMO_CHARS).map((ch, i) => ({ ch, contours: T.traceImage(F.demoImage(ch), o).contours, origin: { left: i * 90, top: 20 }, scale: 1, adj: {} })));
  }
  return demoCache.get(key);
}

function mappedSources(o) {
  const out = [];
  let paths = 0;
  for (const ch of Object.keys(project.glyphs)) {
    const g = project.glyphs[ch], L = project.layers[g.layerId];
    if (!L) continue;
    const r = outlineFor(g.layerId, o);
    if (!r.contours.length) continue;
    if (r.how === "path") paths++;
    out.push({ ch, layerId: g.layerId, contours: r.contours, origin: L.origin, scale: L.scale, adj: g.adj || {} });
  }
  return { sources: out, paths };
}

let guides = null;
function buildLayout(state) {
  const mapped = Object.keys(project.glyphs).length;
  const { sources, paths } = mapped ? mappedSources(state.outline) : { sources: demoSources(state.outline), paths: 0 };
  const layout = F.computeLayout(sources, state, guides);
  return { layout, demo: !mapped, paths, count: sources.length };
}

const GLOW = [25, 255, 176];
let ui = null, kit = null;
const refs = {};

async function previewRender(state) {
  const b = buildLayout(state);
  const pv = F.renderPreview(b.layout, state.view.text, state.view.size, 640, state.view.bg, state.view.outline, GLOW);
  const modeName = { line: "one line", each: "each layer's own bottom", guides: "guides" }[b.layout.mode] || b.layout.mode;
  let status = b.count + " glyph" + (b.count === 1 ? "" : "s") + "  |  baseline: " + modeName;
  if (!b.demo) status += "  |  " + b.paths + " from shape paths, " + (b.count - b.paths) + " traced";
  if (pv.missing.length) status += "  |  not mapped: " + pv.missing.slice(0, 12).join(" ");
  if (b.layout.notes.length) status += "  |  " + b.layout.notes.join(" ");
  return {
    rgb: pv.rgb, w: pv.w, h: pv.h, status,
    docline: b.demo ? "Demo glyphs - select your letter layers and press Map" : (project.doc + "  -  " + b.count + " glyphs mapped")
  };
}

// ---- mapping ---------------------------------------------------------------
function docKey() { return project.doc || ""; }
async function persist() {
  const assign = {}, adj = {};
  for (const ch of Object.keys(project.glyphs)) { const g = project.glyphs[ch]; assign[g.layerId] = ch; if (g.adj && (g.adj.lsb || g.adj.rsb || g.adj.dy)) adj[ch] = g.adj; }
  saved[docKey()] = { assign, adj, custom: project.custom };
  try { await H.saveProjects(saved); } catch (e) { /* not fatal */ }
}

async function mapSelected() {
  const doc = H.activeDoc();
  if (!doc) { kit.setStatus("Open your lettering document first.", true); return; }
  const layers = H.selectedLayers(doc);
  if (!layers.length) { kit.setStatus("Select your letter layers (or a group of them) in the Layers panel, then press Map.", true); return; }
  kit.loop.setBusy(true);
  refs.mapBtn.setAttribute("disabled", "true");
  try {
    const info = H.docInfo(doc);
    if (project.doc !== info.name) { project.glyphs = {}; project.layers = {}; project.unassigned = []; project.current = null; }
    project.doc = info.name;
    const keep = saved[info.name] || { assign: {}, adj: {} };
    project.custom = keep.custom || project.custom || "";
    guides = H.horizontalGuides(doc);
    const dup = [], ligs = [];
    let i = 0;
    for (const layer of layers) {
      i++;
      kit.setStatus("Reading layer " + i + " of " + layers.length + ": " + layer.name);
      const r = await H.readLayer(doc, layer, MAX_READ);
      r.path = await H.readVectorMask(doc, layer);
      r.name = layer.name;
      project.layers[layer.id] = r;
      for (const k of Array.from(traceCache.keys())) if (k.startsWith(layer.id + "|")) traceCache.delete(k);
      project.unassigned = project.unassigned.filter((u) => u.id !== layer.id);
      const already = Object.keys(project.glyphs).find((c) => project.glyphs[c].layerId === layer.id);
      if (already) continue;
      const manual = keep.assign && keep.assign[layer.id];
      const p = manual ? { kind: "char", ch: manual } : parseLayerName(layer.name);
      if (p.kind === "char" && !project.glyphs[p.ch]) {
        project.glyphs[p.ch] = { layerId: layer.id, name: layer.name, adj: (keep.adj && keep.adj[p.ch]) || { lsb: 0, rsb: 0, dy: 0 } };
      } else {
        const why = p.kind === "char" ? "second layer for " + p.ch : p.kind === "lig" ? "ligature (coming in phase 2)" : "name is not a character";
        if (p.kind === "char") dup.push(layer.name); else if (p.kind === "lig") ligs.push(layer.name);
        project.unassigned.push({ id: layer.id, name: layer.name, why });
      }
    }
    await persist();
    renderGrid();
    const n = Object.keys(project.glyphs).length;
    let msg = "Mapped " + n + " glyph" + (n === 1 ? "" : "s") + ".";
    if (project.unassigned.length) msg += " " + project.unassigned.length + " layer" + (project.unassigned.length === 1 ? "" : "s") + " need a character: pick one under Unassigned, then click its cell.";
    if (ligs.length) msg += " Ligatures (" + ligs.slice(0, 4).join(", ") + ") come in phase 2.";
    kit.setStatus(msg);
  } catch (e) {
    console.error(e);
    kit.setStatus("Map failed: " + (e && e.message ? e.message : e), true);
  } finally {
    refs.mapBtn.removeAttribute("disabled");
    kit.loop.setBusy(false);
    kit.touch();
  }
}

function cellClick(ch) {
  const pickId = refs.tray && refs.tray.value;
  if (pickId) {
    const u = project.unassigned.find((x) => String(x.id) === pickId);
    if (u) {
      if (project.glyphs[ch]) { const old = project.glyphs[ch]; project.unassigned.push({ id: old.layerId, name: old.name, why: "replaced" }); }
      project.glyphs[ch] = { layerId: u.id, name: u.name, adj: { lsb: 0, rsb: 0, dy: 0 } };
      project.unassigned = project.unassigned.filter((x) => x !== u);
      project.current = ch;
      persist();
      renderGrid();
      kit.touch();
      return;
    }
  }
  project.current = project.glyphs[ch] ? ch : null;
  renderGrid();
}

function clearCurrent() {
  const ch = project.current;
  if (!ch || !project.glyphs[ch]) return;
  const g = project.glyphs[ch];
  project.unassigned.push({ id: g.layerId, name: g.name, why: "cleared" });
  delete project.glyphs[ch];
  project.current = null;
  persist(); renderGrid(); kit.touch();
}

function renderGrid() {
  if (!refs.grid) return;
  const { el, clear } = ui;
  clear(refs.grid);
  const sets = SETS.concat(project.custom ? [{ name: "Custom", chars: project.custom }] : []);
  for (const s of sets) {
    refs.grid.appendChild(el("div", { class: "lbl3", text: s.name }));
    const wrap = el("div", { class: "cells" });
    for (const ch of Array.from(s.chars)) {
      const g = project.glyphs[ch];
      const c = el("button", { class: "cell" + (g ? " on" : "") + (project.current === ch ? " cur" : ""), text: ch, title: g ? ("Layer: " + g.name) : "Not mapped" });
      c.addEventListener("click", () => cellClick(ch));
      wrap.appendChild(c);
    }
    refs.grid.appendChild(wrap);
  }
  // unassigned tray
  clear(refs.tray);
  refs.tray.appendChild(el("option", { value: "", text: project.unassigned.length ? "Pick a layer, then click its cell..." : "No unassigned layers" }));
  project.unassigned.forEach((u) => refs.tray.appendChild(el("option", { value: String(u.id), text: u.name + "  (" + u.why + ")" })));
  refs.tray.selectedIndex = 0;
  const n = Object.keys(project.glyphs).length;
  refs.mapInfo.textContent = n ? (n + " mapped, " + project.unassigned.length + " unassigned") : "Nothing mapped yet: the preview shows demo glyphs.";
  const cur = project.current && project.glyphs[project.current];
  refs.curLine.textContent = cur ? ("Selected: " + project.current + "  (layer \"" + cur.name + "\")") : "Click a lit cell to adjust that glyph.";
  ["lsb", "rsb", "dy"].forEach((k) => { refs.adj[k].value = cur ? String(cur.adj[k] || 0) : ""; });
}

// ---- export ------------------------------------------------------------------
async function exportFont() {
  const st = kit.state;
  if (!Object.keys(project.glyphs).length) { kit.setStatus("Map your letter layers first (Map card). The demo glyphs can't be exported.", true); return; }
  const btn = refs.exportBtn;
  btn.setAttribute("disabled", "true"); btn.textContent = "Building font...";
  kit.loop.setBusy(true);
  try {
    const b = buildLayout(st);
    const f = F.buildFont(b.layout, st.out);
    btn.textContent = "Saving...";
    const where = await H.saveFont(f.buffer, f.fileName);
    if (!where) { kit.setStatus("Export cancelled."); return; }
    kit.setStatus("Saved " + where + ": " + (f.glyphCount - 2) + " glyphs, " + Math.max(1, Math.round(f.buffer.byteLength / 1024)) + " KB. Double-click the .otf to install it in Font Book.");
  } catch (e) {
    console.error(e);
    kit.setStatus("Export failed: " + (e && e.message ? e.message : e), true);
  } finally {
    btn.removeAttribute("disabled"); btn.textContent = "Export .otf font";
    kit.loop.setBusy(false);
  }
}

// ---- panel -----------------------------------------------------------------
const panel = createToolPanel({
  code: "FB-08", glow: "#19ffb0",
  appName: TITLE, title: TITLE, sub: "layers  /  glyphs  /  opentype font", panelId: "fontbrewPanel",
  presetFile: "presets.json", exportName: "fontbrew-looks.json",
  Engine: null, DEFAULTS, PRESETS, merge, clone,
  previewRender,
  previewRows: (u, k) => {
    ui = u; kit = k;
    const { el, segGroup, textRow, sliderRow, pill } = u;
    return [
      textRow("Test text", "view.text", "Type to preview"),
      sliderRow("Size", "view.size", 24, 200, 1, " px"),
      el("div", { class: "row wrap" }, [
        segGroup("view.bg", [{ v: "checker", l: "Checker" }, { v: "white", l: "White" }, { v: "black", l: "Black" }]),
        pill("Outline", "view.outline", null, "Show the outline points in the preview")
      ])
    ];
  },
  cards: (u, k) => {
    ui = u; kit = k;
    const { card, el, segGroup, sliderRow, row } = u;
    refs.mapBtn = el("button", { class: "btn", text: "Map selected layers" });
    refs.mapBtn.addEventListener("click", mapSelected);
    const clearAll = el("button", { class: "btn small", text: "Clear all" });
    clearAll.addEventListener("click", () => {
      project.unassigned = project.unassigned.concat(Object.keys(project.glyphs).map((c) => ({ id: project.glyphs[c].layerId, name: project.glyphs[c].name, why: "cleared" })));
      project.glyphs = {}; project.current = null; persist(); renderGrid(); kit.touch();
    });
    refs.mapInfo = el("div", { class: "hint", text: "" });
    refs.grid = el("div", { class: "glyphgrid" });
    refs.tray = el("select", {});
    const addIn = el("input", { type: "text", placeholder: "e.g. é ß €" });
    const addBtn = el("button", { class: "btn small", text: "Add" });
    addBtn.addEventListener("click", () => {
      const extra = Array.from(addIn.value.replace(/\s+/g, "")).filter((c) => SETS.every((s) => s.chars.indexOf(c) < 0) && project.custom.indexOf(c) < 0).join("");
      project.custom += extra; addIn.value = ""; persist(); renderGrid();
    });
    refs.curLine = el("div", { class: "hint", text: "" });
    refs.adj = {};
    const adjInput = (key) => {
      const i = el("input", { type: "text", class: "num" });
      i.addEventListener("change", () => {
        const g = project.current && project.glyphs[project.current];
        if (!g) { i.value = ""; return; }
        const v = parseFloat(i.value);
        g.adj[key] = isNaN(v) ? 0 : Math.max(-1000, Math.min(1000, Math.round(v)));
        i.value = String(g.adj[key]);
        persist(); kit.touch();
      });
      refs.adj[key] = i;
      return i;
    };
    const clearOne = el("button", { class: "btn small", text: "Unmap" });
    clearOne.addEventListener("click", clearCurrent);
    const cards = [
      card("Map", [
        el("div", { class: "row" }, [refs.mapBtn, clearAll]),
        refs.mapInfo,
        el("div", { class: "hint", text: "A layer named A, a, 7 or ? (or uni00E9, space, period) maps itself. Groups are opened up." }),
        refs.grid,
        row("Unassigned", refs.tray),
        row("Add chars", addIn, addBtn)
      ]),
      card("Metrics", [
        segGroup("metrics.baseline", [{ v: "auto", l: "Auto" }, { v: "line", l: "One line", t: "All letters share one baseline" }, { v: "each", l: "Each layer", t: "Each layer's bottom is its baseline" }, { v: "guides", l: "Guides", t: "Lowest horizontal guide = baseline, highest = cap height" }]),
        sliderRow("Cap height", "metrics.capHeight", 400, 900, 5, " u"),
        sliderRow("Tracking", "metrics.tracking", -100, 300, 1, " u"),
        sliderRow("Space width", "metrics.space", 80, 800, 5, " u"),
        sliderRow("Descenders", "metrics.descent", 0, 60, 1, "%"),
        el("div", { class: "hint", text: "Units (u) are 1/1000 of the font size. Descenders: how far g j p q y drop in Each layer mode." }),
        el("div", { class: "lbl3", text: "Selected glyph" }),
        refs.curLine,
        el("div", { class: "row" }, [el("span", { class: "lbl", text: "Left / Right" }), adjInput("lsb"), adjInput("rsb"), el("span", { class: "lbl2", text: "u" })]),
        el("div", { class: "row" }, [el("span", { class: "lbl", text: "Shift up" }), adjInput("dy"), el("span", { class: "lbl2", text: "u" }), clearOne])
      ]),
      card("Outline", [
        segGroup("outline.source", [{ v: "auto", l: "Shapes as paths", t: "Shape layers keep their exact vector path; others are traced" }, { v: "trace", l: "Trace everything" }]),
        segGroup("outline.ink", [{ v: "auto", l: "Auto" }, { v: "alpha", l: "Transparency", t: "Ink is whatever is not transparent" }, { v: "dark", l: "Dark ink", t: "Ink is whatever is darker than the threshold (letters on white)" }]),
        sliderRow("Threshold", "outline.threshold", 1, 99, 1, "%"),
        sliderRow("Smoothing", "outline.smooth", 0, 4, 0.1, " px"),
        sliderRow("Corners", "outline.corner", 20, 170, 1, " deg"),
        sliderRow("Ignore specks", "outline.minArea", 0, 400, 1, " px"),
        el("div", { class: "hint", text: "Smoothing 0 keeps straight pixel edges (pixel fonts). Lower Corners keeps more sharp corners." })
      ])
    ];
    renderGrid();
    return cards;
  },
  outputCard: (u, k) => {
    const { card, el, textRow } = u;
    refs.exportBtn = el("button", { class: "apply", text: "Export .otf font" });
    refs.exportBtn.addEventListener("click", exportFont);
    return card("Export", [
      textRow("Family", "out.family", "Brew Lettering"),
      textRow("Style", "out.style", "Regular"),
      textRow("Version", "out.version", "1.000"),
      textRow("Designer", "out.designer", "Your name or studio"),
      textRow("Licence", "out.license", "e.g. Desktop licence, see URL"),
      textRow("URL", "out.url", "https://"),
      refs.exportBtn,
      el("div", { class: "hint", text: "Writes a standard OpenType (.otf) font. Your document is never changed." })
    ]);
  }
});

// load saved mappings
H.loadProjects().then((o) => { saved = o || {}; }).catch(() => {});

if (typeof module !== "undefined" && module && module.exports) module.exports = Object.assign(panel, { _font: { project, mapSelected, exportFont, cellClick, buildLayout, renderGrid } });
