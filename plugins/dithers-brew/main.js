"use strict";
// ======================================================================
// Frank's Dithers Brew - panel UI
// ======================================================================
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { PALETTES, TONEMAPS } = require("./js/palettes.js");
const PNG = require("./js/png.js");
const PS = require("./js/ps.js");
const ASCII = require("./js/ascii.js");

let state = clone(DEFAULTS);
let userPresets = [];
let docCache = { ppi: 300, name: "", w: 0, h: 0, demo: true };
let lastSrc = null;
let auto = true;
let built = false;
let confirmArmed = false;

const binders = [];
const rules = [];
const refs = {};

const tick = () => new Promise((r) => setTimeout(r, 0));

// ---------------------------------------------------------------- helpers
function getPath(o, p) { return p.split(".").reduce((a, k) => a[k], o); }
function setPath(o, p, v) {
  const ks = p.split(".");
  let a = o;
  for (let i = 0; i < ks.length - 1; i++) a = a[ks[i]];
  a[ks[ks.length - 1]] = v;
}
function el(tag, props, kids) {
  const e = document.createElement(tag);
  if (props) {
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k === "style") { for (const s of Object.keys(v)) e.style[s] = v[s]; }
      else e.setAttribute(k, v);
    }
  }
  (kids || []).forEach((c) => { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function bind(fn) { binders.push(fn); fn(); }
function showIf(node, fn) { rules.push(() => { node.style.display = fn() ? "" : "none"; }); }
function refreshAll() { binders.forEach((f) => f()); rules.forEach((f) => f()); }
function touch() { refreshAll(); updateInfo(); if (auto) schedulePreview(150); }

function setStatus(msg, isErr) {
  if (!refs.status) return;
  refs.status.textContent = msg;
  refs.status.className = "status" + (isErr ? " err" : "");
}

// ---------------------------------------------------------------- controls
function row(label, ...controls) {
  return el("div", { class: "row" }, [label ? el("span", { class: "lbl", text: label }) : null].concat(controls));
}

function sliderRow(label, path, min, max, step, unit) {
  const val = el("span", { class: "val" });
  const input = el("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(getPath(state, path)) });
  const fmt = (v) => (step >= 1 ? String(Math.round(v)) : Number(v).toFixed(step < 0.1 ? 2 : 1)) + (unit || "");
  input.addEventListener("input", () => { const v = parseFloat(input.value); setPath(state, path, v); val.textContent = fmt(v); });
  input.addEventListener("change", () => { setPath(state, path, parseFloat(input.value)); touch(); });
  bind(() => { const v = getPath(state, path); input.value = String(v); val.textContent = fmt(v); });
  return row(label, input, val);
}

function selectRow(label, path, options, after) {
  const sel = el("select", {});
  options.forEach((o) => sel.appendChild(el("option", { value: String(o.v), text: o.l })));
  sel.addEventListener("change", () => {
    const o = options[sel.selectedIndex];
    if (!o) return;
    setPath(state, path, o.v);
    if (after) after(o.v);
    touch();
  });
  bind(() => {
    const cur = String(getPath(state, path));
    let i = options.findIndex((o) => String(o.v) === cur);
    if (i < 0) i = 0;
    sel.selectedIndex = i;
  });
  return row(label, sel);
}

function checkRow(label, path, after) {
  const cb = el("input", { type: "checkbox" });
  cb.addEventListener("change", () => { setPath(state, path, !!cb.checked); if (after) after(!!cb.checked); touch(); });
  bind(() => { cb.checked = !!getPath(state, path); });
  return el("div", { class: "row chk" }, [cb, el("span", { class: "lbl2", text: label })]);
}

function segGroup(path, options, cls) {
  const wrap = el("div", { class: "seg " + (cls || "") });
  const btns = options.map((o) => {
    const b = el("button", { class: "segbtn", text: o.l, title: o.t || "" });
    b.addEventListener("click", () => { setPath(state, path, o.v); touch(); });
    wrap.appendChild(b);
    return b;
  });
  bind(() => { const cur = getPath(state, path); btns.forEach((b, i) => { b.className = "segbtn" + (options[i].v === cur ? " on" : ""); }); });
  return wrap;
}

function pill(label, path, dotColor, title) {
  const b = el("button", { class: "pill", title: title || "" });
  if (dotColor) b.appendChild(el("span", { class: "dot", style: { backgroundColor: dotColor } }));
  b.appendChild(el("span", { text: label }));
  b.addEventListener("click", () => { setPath(state, path, !getPath(state, path)); touch(); });
  bind(() => { b.className = "pill" + (getPath(state, path) ? " on" : ""); });
  return b;
}

function textRow(label, path, placeholder, after) {
  const input = el("input", { type: "text", placeholder: placeholder || "" });
  input.addEventListener("change", () => { setPath(state, path, input.value); if (after) after(); touch(); });
  bind(() => { input.value = String(getPath(state, path)); });
  return row(label, input);
}

function numInput(path, min, max) {
  const input = el("input", { type: "text", class: "num" });
  input.addEventListener("change", () => {
    let v = parseFloat(input.value);
    if (isNaN(v)) v = getPath(state, path);
    v = Math.max(min, Math.min(max, v));
    setPath(state, path, v);
    touch();
  });
  bind(() => { input.value = String(getPath(state, path)); });
  return input;
}

function hexField(get, set, allowEmpty) {
  const sw = el("span", { class: "sw" });
  const input = el("input", { type: "text", class: "hex", placeholder: allowEmpty ? "none" : "#RRGGBB" });
  input.addEventListener("change", () => {
    const t = input.value.trim();
    if (allowEmpty && t === "") { set(""); touch(); return; }
    if (Engine.isHex(t)) { set(Engine.rgbToHex(Engine.hexToRgb(t))); touch(); } else input.value = get();
  });
  bind(() => {
    const v = get();
    input.value = v || "";
    sw.style.backgroundColor = v && Engine.isHex(v) ? v : "transparent";
  });
  return el("span", { class: "hexwrap" }, [sw, input]);
}

function card(title, kids, opts) {
  const body = el("div", { class: "cardbody" }, kids);
  const head = el("div", { class: "cardhead" }, [el("span", { class: "ctitle", text: title })]);
  const c = el("div", { class: "card" }, [head, body]);
  if (opts && opts.hint) body.insertBefore(el("div", { class: "hint", text: opts.hint }), body.firstChild);
  return c;
}

// ---------------------------------------------------------------- palette widgets
function paletteSwatches() {
  const wrap = el("div", { class: "swatches" });
  const info = el("div", { class: "hint" });
  bind(() => {
    clear(wrap);
    const g = state.grade;
    g.colors.forEach((hx, i) => {
      const off = g.off.indexOf(i) >= 0;
      const s = el("div", { class: "swatch" + (off ? " off" : ""), title: hx + (off ? " (cut)" : " (click to cut)"), style: { backgroundColor: hx } });
      s.addEventListener("click", () => {
        const k = g.off.indexOf(i);
        if (k >= 0) g.off.splice(k, 1); else g.off.push(i);
        touch();
      });
      wrap.appendChild(s);
    });
    info.textContent = (g.colors.length - g.off.length) + " of " + g.colors.length + " colours active. Click a swatch to cut it.";
  });
  return el("div", {}, [wrap, info]);
}

function inkEditor() {
  const wrap = el("div", { class: "inks" });
  const render = () => {
    clear(wrap);
    state.tonal.inks.forEach((hx, i) => {
      const r = el("div", { class: "row" }, [
        el("span", { class: "lbl", text: "Ink " + (i + 1) }),
        hexField(() => state.tonal.inks[i], (v) => { state.tonal.inks[i] = v; }, false)
      ]);
      if (state.tonal.inks.length > 2) {
        const x = el("button", { class: "mini", text: "x", title: "Remove ink" });
        x.addEventListener("click", () => { state.tonal.inks.splice(i, 1); touch(); });
        r.appendChild(x);
      }
      wrap.appendChild(r);
    });
    if (state.tonal.inks.length < 5) {
      const add = el("button", { class: "btn small", text: "+ Add ink" });
      add.addEventListener("click", () => { state.tonal.inks.push("#808080"); touch(); });
      wrap.appendChild(add);
    }
  };
  let sig = "";
  bind(() => { const s = state.tonal.inks.join(","); if (s !== sig) { sig = s; render(); } });
  return wrap;
}

function srcToRGB(src) {
  const n = src.w * src.h, out = new Uint8Array(n * 3), c = src.c || 4;
  for (let i = 0; i < n; i++) {
    const j = i * c;
    out[i * 3] = src.data[j]; out[i * 3 + 1] = c >= 3 ? src.data[j + 1] : src.data[j]; out[i * 3 + 2] = c >= 3 ? src.data[j + 2] : src.data[j];
  }
  return out;
}

// ---------------------------------------------------------------- info / warnings
function updateInfo() {
  if (!refs.info) return;
  const ppi = docCache.ppi || 300, lines = [];
  const mm = (px) => (px / ppi * 25.4);
  if (state.engine === "halftone") {
    const pitch = 25.4 / state.lpi;
    lines.push(state.lpi + " LPI: cell " + pitch.toFixed(2) + " mm (" + (ppi / state.lpi).toFixed(1) + " px). 5% highlight dot is about " + (pitch * 0.2523).toFixed(2) + " mm.");
    if (ppi / state.lpi < 6) lines.push("Warning: cells under 6 px look rough. Use a higher PPI or a lower LPI.");
  } else if (state.engine === "dither") {
    lines.push("Dot " + state.pixel + " px = " + mm(state.pixel).toFixed(2) + " mm at " + Math.round(ppi) + " PPI.");
    if (mm(state.pixel) < 0.5 && state.fx.dtf.on) lines.push("Warning: dots under 0.5 mm may not hold on DTF film.");
  } else {
    lines.push("Character cell " + (state.ascii.size * 6) + " x " + (state.ascii.size * 8) + " px (" + mm(state.ascii.size * 6).toFixed(2) + " mm wide).");
  }
  if (ppi < 300) lines.push("Document is " + Math.round(ppi) + " PPI. Print and DTF work best at 300+.");
  if (docCache.demo) lines.push("No document open: showing the built-in demo image.");
  refs.info.textContent = lines.join("\n");
}

// ---------------------------------------------------------------- preview
let previewTimer = null, rendering = false, rerun = false;

let applying = false;

function schedulePreview(delay) {
  clearTimeout(previewTimer);
  if (applying) return;                       // don't fight a running Apply
  previewTimer = setTimeout(runPreview, delay == null ? 120 : delay);
}

async function runPreview() {
  if (rendering) { rerun = true; return; }
  rendering = true;
  do {
    rerun = false;
    try { await previewOnce(); } catch (e) { setStatus("Preview problem: " + (e && e.message ? e.message : e), true); console.error(e); }
  } while (rerun);
  rendering = false;
}

async function previewOnce() {
  setStatus("Rendering preview...");
  const t0 = Date.now();
  let src, scale = 1, ppi = 300;
  const doc = PS.activeDoc();
  if (doc) {
    const view = { kind: state.view.kind, size: state.view.size };
    const target = (state.out.source !== "flat") ? tryLayerTarget(doc) : { kind: "flat" };
    const r = await PS.readSource(doc, target, view);
    src = r.src; scale = r.scale; ppi = r.ppi;
    docCache = { ppi: r.ppi, name: r.info.name, w: r.info.w, h: r.info.h, demo: false };
  } else {
    src = Engine.demoImage(state.view.size, Math.round(state.view.size * 0.75));
    docCache = { ppi: 300, name: "Demo image", w: src.w, h: src.h, demo: true };
  }
  lastSrc = src;
  refs.docline.textContent = docCache.demo ? "No document open - demo image" : (docCache.name + "  " + docCache.w + " x " + docCache.h + " px @ " + Math.round(docCache.ppi) + " PPI");
  const P = Object.assign({}, state, { ppi, scale });
  const res = await Engine.render(src, P, { yield: tick });
  const dtf = state.fx.dtf;
  const bgType = state.view.bg;
  const bg = (dtf.on && dtf.view === "garment") ? { type: "garment", color: Engine.hexToRgb(dtf.garment) } : { type: bgType };
  const rgb = Engine.composite(res, bg);
  refs.preview.src = PNG.dataURL(rgb, res.w, res.h, 3);
  const avail = (refs.previewBox.clientWidth || 320) - 4;
  const dw = Math.min(avail, res.w), dh = Math.round(res.h * dw / res.w);
  refs.preview.style.width = dw + "px";
  refs.preview.style.height = dh + "px";
  updateInfo();
  const notes = res.notes && res.notes.length ? "  |  " + res.notes.join("; ") : "";
  setStatus("Preview " + res.w + " x " + res.h + " in " + (Date.now() - t0) + " ms  |  " + res.layers.length + " layer" + (res.layers.length === 1 ? "" : "s") + notes);
}

function tryLayerTarget(doc) {
  try { return PS.collectTargets(doc, "layer")[0]; } catch (e) { return { kind: "flat" }; }
}

// ---------------------------------------------------------------- apply
async function applyNow() {
  const doc = PS.activeDoc();
  if (!doc) { setStatus("Open a document first. The preview is only using the demo image.", true); return; }
  const btn = refs.apply;
  clearTimeout(previewTimer);
  applying = true;
  try {
    const targets = PS.collectTargets(doc, state.out.source);
    const info = PS.docInfo(doc);
    const planes = state.mode === "cmyk" ? 4 : (state.mode === "rgb" ? 3 : (state.mode === "tonal" ? state.tonal.inks.length : 1));
    const work = info.w * info.h * targets.length * planes;
    if (work > 60e6 && !confirmArmed) {
      confirmArmed = true;
      setStatus("Big job (" + Math.round(work / 1e6) + " million plane-pixels). Click Apply again to confirm, or raise Dot / pixel size.", true);
      btn.textContent = "Click again to confirm";
      return;
    }
    confirmArmed = false;
    btn.textContent = "Brewing...";
    btn.setAttribute("disabled", "true");
    let done = 0;
    for (const t of targets) {
      setStatus("Reading pixels " + (done + 1) + "/" + targets.length + "...");
      const r = await PS.readSource(doc, t, { kind: "full" });
      const P = Object.assign({}, state, { ppi: r.ppi, scale: 1 });
      const res = await Engine.render(r.src, P, {
        yield: tick,
        progress: (i, n, name) => setStatus("Rendering " + (done + 1) + "/" + targets.length + ": " + name + " (" + (i + 1) + "/" + n + ")...")
      });
      setStatus("Writing layers...");
      const label = state.engine === "halftone" ? Engine.SCREENS.find((s) => s.id === state.algo.halftone).name
        : state.engine === "dither" ? Engine.DITHERS.find((s) => s.id === state.algo.dither).name
        : "ASCII " + state.algo.ascii;
      const base = t.kind === "layer" ? (t.layer.name + " - ") : "";
      const warnings = await PS.writeResult(doc, res, {
        origin: r.origin,
        groupName: base + "Brew - " + label + (state.engine === "halftone" ? " " + state.lpi + " LPI" : ""),
        hideSource: state.out.hide,
        hideLayers: t.kind === "layer" ? [t.layer] : null,
        paperLayer: state.out.paper
      });
      done++;
      if (warnings && warnings.length) setStatus(warnings.join(" | "), true);
    }
    if (!refs.status.className.includes("err")) setStatus("Done. " + done + " group" + (done === 1 ? "" : "s") + " added. Undo with one Ctrl/Cmd+Z.");
  } catch (e) {
    console.error(e);
    setStatus("Apply failed: " + (e && e.message ? e.message : e), true);
  } finally {
    applying = false;
    if (!confirmArmed) btn.textContent = "Apply to document";
    btn.removeAttribute("disabled");
  }
}

// ---------------------------------------------------------------- presets
function allPresets() {
  return PRESETS.map((p) => ({ label: p.cat + " - " + p.name, p: p.p, user: false }))
    .concat(userPresets.map((u) => ({ label: "Mine - " + u.name, p: u.p, user: true, name: u.name })));
}
function applyPatch(p) {
  const keepOut = clone(state.out), keepView = clone(state.view);
  state = merge(DEFAULTS, p);
  state.out = keepOut; state.view = keepView;
  touch();
}
function stateForSave() {
  const s = clone(state);
  delete s.view; delete s.out;
  return s;
}
function fillSelect(sel, labels, placeholder) {
  clear(sel);
  sel.appendChild(el("option", { value: "", text: placeholder }));
  labels.forEach((l, i) => sel.appendChild(el("option", { value: String(i), text: l })));
  sel.selectedIndex = 0;
}

// ---------------------------------------------------------------- UI build
function build(root) {
  clear(root);

  // header
  root.appendChild(el("div", { class: "hdr" }, [
    el("div", { class: "title", text: "Frank's Dithers Brew" }),
    el("div", { class: "sub", text: "dither  /  halftone  /  ASCII  /  print separations" })
  ]));

  // ---- preview card
  refs.docline = el("div", { class: "docline", text: "" });
  refs.preview = el("img", { class: "preview" });
  refs.previewBox = el("div", { class: "previewbox" }, [refs.preview]);
  refs.status = el("div", { class: "status", text: "Starting..." });
  refs.info = el("div", { class: "info" });
  const refresh = el("button", { class: "btn small", text: "Refresh" });
  refresh.addEventListener("click", () => schedulePreview(0));
  const autoCb = el("input", { type: "checkbox" });
  autoCb.checked = true;
  autoCb.addEventListener("change", () => { auto = !!autoCb.checked; if (auto) schedulePreview(0); });
  root.appendChild(card("Preview", [
    refs.docline,
    refs.previewBox,
    el("div", { class: "row wrap" }, [
      segGroup("view.kind", [{ v: "detail", l: "Detail 1:1", t: "True dot size, centre crop" }, { v: "whole", l: "Whole", t: "Scaled-down view of everything" }]),
      segGroup("view.bg", [{ v: "white", l: "White" }, { v: "black", l: "Black" }, { v: "checker", l: "Checker" }])
    ]),
    el("div", { class: "row" }, [refresh, el("span", { class: "lbl2", text: "Auto-update" }), autoCb]),
    refs.status,
    refs.info
  ]));

  // ---- presets
  const presetSel = el("select", {});
  const userSel = el("select", {});
  const nameIn = el("input", { type: "text", placeholder: "Name your look" });
  const refillPresets = () => {
    const list = allPresets();
    fillSelect(presetSel, list.map((x) => x.label), "Choose a preset...");
    fillSelect(userSel, userPresets.map((u) => u.name), "My saved looks...");
  };
  presetSel.addEventListener("change", () => {
    const i = parseInt(presetSel.value, 10);
    if (isNaN(i)) return;
    applyPatch(allPresets()[i].p);
  });
  const saveBtn = el("button", { class: "btn small", text: "Save look" });
  saveBtn.addEventListener("click", async () => {
    const name = nameIn.value.trim();
    if (!name) { setStatus("Type a name for your look first.", true); return; }
    userPresets = userPresets.filter((u) => u.name !== name);
    userPresets.push({ name, p: stateForSave() });
    try { await PS.saveUserPresets(userPresets); setStatus("Saved look: " + name); } catch (e) { setStatus("Could not save: " + e.message, true); }
    refillPresets();
  });
  const delBtn = el("button", { class: "btn small", text: "Delete" });
  delBtn.addEventListener("click", async () => {
    const i = parseInt(userSel.value, 10);
    if (isNaN(i)) return;
    const nm = userPresets[i].name;
    userPresets.splice(i, 1);
    try { await PS.saveUserPresets(userPresets); setStatus("Deleted: " + nm); } catch (e) { setStatus("Could not delete: " + e.message, true); }
    refillPresets();
  });
  userSel.addEventListener("change", () => {
    const i = parseInt(userSel.value, 10);
    if (isNaN(i)) return;
    nameIn.value = userPresets[i].name;
    applyPatch(userPresets[i].p);
  });
  const expBtn = el("button", { class: "btn small", text: "Export all" });
  expBtn.addEventListener("click", async () => {
    try { const ok = await PS.exportPresets(userPresets); if (ok) setStatus("Exported " + userPresets.length + " looks."); } catch (e) { setStatus("Export failed: " + e.message, true); }
  });
  const impBtn = el("button", { class: "btn small", text: "Import" });
  impBtn.addEventListener("click", async () => {
    try {
      const list = await PS.importPresets();
      if (!list) return;
      list.forEach((u) => { if (u && u.name && u.p) { userPresets = userPresets.filter((x) => x.name !== u.name); userPresets.push(u); } });
      await PS.saveUserPresets(userPresets);
      refillPresets();
      setStatus("Imported looks. Share the exported file with your team.");
    } catch (e) { setStatus("Import failed: " + e.message, true); }
  });
  refs.refillPresets = refillPresets;
  root.appendChild(card("Library", [
    row("Preset", presetSel),
    row("Mine", userSel, delBtn),
    row("", nameIn, saveBtn),
    el("div", { class: "row" }, [expBtn, impBtn])
  ]));

  // ---- effect type toggles
  root.appendChild(card("Effect type", [
    segGroup("engine", [{ v: "halftone", l: "Halftone", t: "Dots, lines, rings at a real LPI and angle" }, { v: "dither", l: "Dither", t: "Pixel diffusion / ordered / noise" }, { v: "ascii", l: "ASCII", t: "Characters from a built-in pixel font" }], "big"),
    el("div", { class: "lbl3", text: "Colour mode" }),
    segGroup("mode", [{ v: "mono", l: "Mono" }, { v: "tonal", l: "Tonal" }, { v: "grade", l: "Grade" }, { v: "rgb", l: "RGB" }, { v: "cmyk", l: "CMYK" }], "big")
  ]));

  // ---- engine controls
  const htBox = el("div", {}, [
    selectRow("Screen", "algo.halftone", Engine.SCREENS.map((s) => ({ v: s.id, l: s.name }))),
    sliderRow("Screen (LPI)", "lpi", 5, 120, 1),
    (function () { const r = sliderRow("Angle", "angle", 0, 90, 1, " deg"); showIf(r, () => state.mode === "mono"); return r; })(),
    checkRow("Smooth (anti-aliased) edges", "aa")
  ]);
  showIf(htBox, () => state.engine === "halftone");
  const diBox = el("div", {}, [
    selectRow("Algorithm", "algo.dither", Engine.DITHERS.map((s) => ({ v: s.id, l: s.name }))),
    sliderRow("Dot / pixel px", "pixel", 1, 16, 1, " px")
  ]);
  showIf(diBox, () => state.engine === "dither");
  const customRow = textRow("Characters", "ascii.custom", "e.g. FRANK 01");
  showIf(customRow, () => state.algo.ascii === "custom");
  const keepRow = checkRow("Keep my order (light to dark)", "ascii.keepOrder");
  showIf(keepRow, () => state.algo.ascii === "custom");
  const textRowEl = textRow("Text", "ascii.text", "text to tile");
  showIf(textRowEl, () => state.ascii.textMode);
  const asBox = el("div", {}, [
    selectRow("Character set", "algo.ascii", ASCII.ASCII_SETS.map((s) => ({ v: s.id, l: s.name }))),
    customRow, keepRow,
    sliderRow("Character size", "ascii.size", 1, 16, 1, " px"),
    sliderRow("Edge glyphs", "ascii.edge", 0, 100, 1, "%"),
    checkRow("Text halftone (tile my own words)", "ascii.textMode"),
    textRowEl
  ]);
  showIf(asBox, () => state.engine === "ascii");
  root.appendChild(card("Engine", [htBox, diBox, asBox]));

  // ---- colour
  const monoBox = el("div", {}, [
    row("Ink", hexField(() => state.mono.ink, (v) => { state.mono.ink = v; }, false)),
    row("Paper", hexField(() => state.mono.paper, (v) => { state.mono.paper = v; }, true)),
    el("div", { class: "hint", text: "Leave paper empty for a transparent background (screen print / DTF)." })
  ]);
  showIf(monoBox, () => state.mode === "mono");

  const tonalBox = el("div", {}, [
    selectRow("Tone map", "tonal.tone", TONEMAPS.map((t) => ({ v: t.id, l: t.name })), (id) => {
      const t = TONEMAPS.find((x) => x.id === id);
      if (t) { state.tonal.inks = t.inks.slice(); state.tonal.paper = t.paper; }
    }),
    inkEditor(),
    row("Paper", hexField(() => state.tonal.paper, (v) => { state.tonal.paper = v; }, true)),
    el("div", { class: "hint", text: "Inks stack as tone bands, lightest underneath, like a gradient map made of dots." })
  ]);
  showIf(tonalBox, () => state.mode === "tonal");

  const fromImg = el("button", { class: "btn small", text: "From image" });
  fromImg.addEventListener("click", () => {
    if (!lastSrc) { setStatus("Preview first, then pull a palette.", true); return; }
    state.grade.colors = Engine.paletteFromImage(srcToRGB(lastSrc), lastSrc.w, lastSrc.h, state.grade.count);
    state.grade.off = []; state.grade.palette = "custom";
    touch();
  });
  const mergeBtn = el("button", { class: "btn small", text: "Merge closest" });
  mergeBtn.addEventListener("click", () => {
    const keep = state.grade.colors.filter((c, i) => state.grade.off.indexOf(i) < 0);
    if (keep.length < 3) { setStatus("Need at least 3 active colours to merge.", true); return; }
    state.grade.colors = Engine.mergeClosest(keep); state.grade.off = []; state.grade.palette = "custom";
    touch();
  });
  const resetBtn = el("button", { class: "btn small", text: "Reset palette" });
  resetBtn.addEventListener("click", () => {
    const p = PALETTES.find((x) => x.id === state.grade.palette);
    if (p) { state.grade.colors = p.colors.slice(); state.grade.off = []; touch(); }
  });
  const listArea = el("textarea", { placeholder: "#FF0000, #00FF00, #0000FF ...", rows: "2" });
  const useList = el("button", { class: "btn small", text: "Use hex list" });
  useList.addEventListener("click", () => {
    const found = (listArea.value.match(/#?[0-9a-fA-F]{6}\b/g) || []).map((h) => Engine.rgbToHex(Engine.hexToRgb(h))).slice(0, 24);
    if (found.length < 2) { setStatus("Paste at least two 6-digit hex colours.", true); return; }
    state.grade.colors = found; state.grade.off = []; state.grade.palette = "custom";
    touch();
  });
  const palOpts = PALETTES.map((p) => ({ v: p.id, l: p.name })).concat([{ v: "custom", l: "Custom / from image" }]);
  const gradeBox = el("div", {}, [
    selectRow("Palette", "grade.palette", palOpts, (id) => {
      const p = PALETTES.find((x) => x.id === id);
      if (p) { state.grade.colors = p.colors.slice(); state.grade.off = []; }
    }),
    paletteSwatches(),
    el("div", { class: "row wrap" }, [fromImg, mergeBtn, resetBtn]),
    sliderRow("Colours from image", "grade.count", 2, 24, 1),
    sliderRow("Dither spread", "grade.spread", 0, 100, 1, "%"),
    checkRow("Leave lightest colour as paper", "grade.skipLightest"),
    listArea, useList,
    el("div", { class: "hint", text: "Saves one layer per colour, named by its hex code." })
  ]);
  showIf(gradeBox, () => state.mode === "grade");

  const cmykBox = el("div", {}, [
    el("div", { class: "row wrap" }, [pill("C", "cmyk.on.0", "#00AEEF"), pill("M", "cmyk.on.1", "#EC008C"), pill("Y", "cmyk.on.2", "#FFF200"), pill("K", "cmyk.on.3", "#111111")]),
    el("div", { class: "row" }, [el("span", { class: "lbl", text: "Angles" }), numInput("cmyk.angles.0", -180, 180), numInput("cmyk.angles.1", -180, 180), numInput("cmyk.angles.2", -180, 180), numInput("cmyk.angles.3", -180, 180)]),
    sliderRow("Black generation", "cmyk.gcr", 0, 100, 1, "%"),
    el("div", { class: "hint", text: "C 15, M 75, Y 0, K 45 are the print standard. Angles only matter for halftone screens." })
  ]);
  showIf(cmykBox, () => state.mode === "cmyk");

  const rgbBox = el("div", {}, [
    el("div", { class: "row wrap" }, [pill("R", "rgb.on.0", "#FF3B3B"), pill("G", "rgb.on.1", "#3BFF6A"), pill("B", "rgb.on.2", "#3B7BFF")]),
    el("div", { class: "row" }, [el("span", { class: "lbl", text: "Angles" }), numInput("rgb.angles.0", -180, 180), numInput("rgb.angles.1", -180, 180), numInput("rgb.angles.2", -180, 180)]),
    sliderRow("Red strength", "rgb.strength.0", 0, 200, 1, "%"),
    sliderRow("Green strength", "rgb.strength.1", 0, 200, 1, "%"),
    sliderRow("Blue strength", "rgb.strength.2", 0, 200, 1, "%"),
    el("div", { class: "hint", text: "Channels add together over black (Linear Dodge)." })
  ]);
  showIf(rgbBox, () => state.mode === "rgb");
  root.appendChild(card("Colour", [monoBox, tonalBox, gradeBox, cmykBox, rgbBox]));

  // ---- FX stack
  const fxList = [
    { k: "pre", l: "Pre-process", t: "Shape the image before it dithers" },
    { k: "edges", l: "Edge lines", t: "Add outlines on top of the tone" },
    { k: "dtf", l: "DTF film", t: "Knock out the garment colour" },
    { k: "gain", l: "Dot gain", t: "Grow or shrink the ink" },
    { k: "misreg", l: "Misregister", t: "Offset the plates like a worn press" },
    { k: "clean", l: "Clean specks", t: "Remove dots too small to print" },
    { k: "distress", l: "Distress", t: "Knock out ink like a worn screen" }
  ];
  root.appendChild(card("Effect stack (click to switch on / off)", [
    el("div", { class: "row wrap" }, fxList.map((f) => pill(f.l, "fx." + f.k + ".on", null, f.t)))
  ]));

  const fxCard = (key, title, kids) => { const c = card(title, kids); showIf(c, () => state.fx[key].on); return c; };
  root.appendChild(fxCard("pre", "Pre-process", [
    sliderRow("Brightness", "fx.pre.brightness", -100, 100, 1),
    sliderRow("Contrast", "fx.pre.contrast", -100, 100, 1),
    sliderRow("Gamma", "fx.pre.gamma", 0.3, 3, 0.05),
    sliderRow("Black point", "fx.pre.black", 0, 200, 1),
    sliderRow("White point", "fx.pre.white", 55, 255, 1),
    sliderRow("Blur", "fx.pre.blur", 0, 8, 0.5, " px"),
    sliderRow("Sharpen", "fx.pre.sharpen", 0, 100, 1, "%"),
    sliderRow("Grain", "fx.pre.noise", 0, 100, 1, "%"),
    checkRow("Invert", "fx.pre.invert")
  ]));
  root.appendChild(fxCard("edges", "Edge lines", [
    sliderRow("Strength", "fx.edges.strength", 0, 100, 1, "%"),
    sliderRow("Thickness", "fx.edges.thick", 1, 6, 1, " px")
  ]));
  root.appendChild(fxCard("dtf", "DTF film", [
    row("Garment", hexField(() => state.fx.dtf.garment, (v) => { state.fx.dtf.garment = v; }, false)),
    sliderRow("Fuzziness", "fx.dtf.fuzz", 0, 100, 1, "%"),
    sliderRow("Feather", "fx.dtf.feather", 0, 100, 1, "%"),
    checkRow("Turn soft edges into dots", "fx.dtf.dots"),
    selectRow("View", "fx.dtf.view", [{ v: "garment", l: "On garment colour" }, { v: "paper", l: "On preview background" }]),
    el("div", { class: "hint", text: "Colours close to the garment colour become transparent; semi-transparent edges become printable dots." })
  ]));
  root.appendChild(fxCard("gain", "Dot gain", [sliderRow("Amount", "fx.gain.amount", -4, 4, 1, " px")]));
  root.appendChild(fxCard("misreg", "Misregistration", [sliderRow("Offset", "fx.misreg.amount", 1, 12, 1, " px"), el("div", { class: "hint", text: "Applies to the 2nd plate onwards (CMYK, RGB, tonal, grade)." })]));
  root.appendChild(fxCard("clean", "Clean specks", [sliderRow("Smallest dot", "fx.clean.mm", 0.1, 3, 0.1, " mm"), el("div", { class: "hint", text: "Dots smaller than this diameter are deleted. 0.5 mm is a safe DTF minimum." })]));
  root.appendChild(fxCard("distress", "Distress", [sliderRow("Amount", "fx.distress.amount", 0, 100, 1, "%")]));

  // ---- output
  refs.apply = el("button", { class: "apply", text: "Apply to document" });
  refs.apply.addEventListener("click", applyNow);
  root.appendChild(card("Output", [
    selectRow("Source", "out.source", [{ v: "flat", l: "Flattened document" }, { v: "layer", l: "Active layer" }, { v: "each", l: "Each selected layer (batch)" }], () => { confirmArmed = false; }),
    checkRow("Hide source artwork afterwards", "out.hide"),
    checkRow("Add a white paper layer", "out.paper"),
    refs.apply,
    el("div", { class: "hint", text: "Creates a layer group of ink layers with transparent paper. One undo step." })
  ]));

  root.appendChild(el("div", { class: "foot", text: "Frank's Dithers Brew 1.0  -  your artwork is never changed; results land in new layers." }));

  refs.refillPresets();
  refreshAll();
  updateInfo();
}

async function init() {
  if (built) return;
  built = true;
  build(document.getElementById("app"));
  try { userPresets = await PS.loadUserPresets(); refs.refillPresets(); } catch (e) { /* no saved looks yet */ }
  schedulePreview(100);
}

try {
  const { entrypoints } = require("uxp");
  entrypoints.setup({
    panels: {
      franksBrewPanel: {
        create() { init(); },
        show() { if (!built) init(); else schedulePreview(200); }
      }
    }
  });
} catch (e) { /* older hosts: fall through to direct init */ }
setTimeout(() => { init(); }, 0);

// test hook only; <script> contexts in UXP may not define `module`
if (typeof module !== "undefined" && module && module.exports) {
  module.exports = { _test: { get state() { return state; }, set state(v) { state = v; }, applyNow, runPreview, init, refs, touch } };
}
