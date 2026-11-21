"use strict";
// ======================================================================
// Shared tool panel: the standard frame every suite tool uses.
//   pinned preview (Whole / Detail, background, auto-update, Pin on top)
//   Library card (8 built-ins, saved looks, export / import)
//   the tool's own cards (cfg.cards)
//   Output card (source, extra rows, hide source, Apply, one undo step)
// Colour swatches open Photoshop's colour picker; the panel scrolls.
//
//   createToolPanel({ appName, title, sub, panelId, presetFile, exportName,
//     Engine, DEFAULTS, PRESETS, merge, clone, cards(ui, kit), outputRows(ui),
//     viewDefaultBg, footer })
// Engine must export render(src, P, hooks) and composite(res, bg) (+ demoImage).
// ======================================================================
const PNG = require("./png.js");
const PS = require("./ps-io.js");
const { createUI, getPath } = require("./ui.js");
const { createPreviewLoop, tick } = require("./preview.js");
const { splitLayout } = require("./layout.js");
const { createLibrary } = require("./library.js");

function createToolPanel(cfg) {
  const { Engine, DEFAULTS, PRESETS, merge, clone } = cfg;
  PS.configure({ appName: cfg.appName, presetFile: cfg.presetFile || "presets.json", exportName: cfg.exportName || "looks.json" });

  let state = PRESETS[0] ? merge(DEFAULTS, PRESETS[0].p) : clone(DEFAULTS);   // start on the first preset so its name matches
  let docCache = { ppi: 300, name: "", w: 0, h: 0, demo: true };
  let auto = true, built = false, confirmArmed = false, lib = null, layout = null;
  let presetName = PRESETS[0] ? PRESETS[0].name : "Custom";
  const refs = {};
  const ui = createUI({ getState: () => state, onChange: () => touch(), pickColor: (hex) => PS.pickColor(hex) });
  const { el, clear, bind, showIf, refreshAll, segGroup, selectRow, checkRow, hexField, card } = ui;

  function touch() { refreshAll(); if (auto) schedulePreview(150); }
  function setStatus(msg, isErr) {
    if (!refs.status) return;
    refs.status.textContent = msg;
    refs.status.className = "status" + (isErr ? " err" : "");
  }

  // ---- gradient editor for a stops array at `path` ([{p, c}], 2..8 stops)
  function gradientEditor(path) {
    const stops = () => getPath(state, path);
    const bar = el("div", { class: "gradbar" });
    bind(() => {
      const s = stops().filter((x) => /^#[0-9A-Fa-f]{6}$/.test(x.c)).slice().sort((a, b) => a.p - b.p);
      bar.style.backgroundImage = "linear-gradient(to right, " + s.map((x) => x.c + " " + x.p + "%").join(", ") + ")";
    });
    const MAX = 8, wrap = el("div", { class: "stops" }, [bar]);
    const st = (i) => stops()[i];
    for (let i = 0; i < MAX; i++) {
      const pos = el("input", { type: "text", class: "num" });
      pos.addEventListener("change", () => {
        if (!st(i)) return;
        let v = parseFloat(pos.value); if (isNaN(v)) v = st(i).p;
        st(i).p = Math.max(0, Math.min(100, v)); touch();
      });
      bind(() => { if (st(i)) pos.value = String(st(i).p); });
      const del = el("button", { class: "btn small mini", text: "x", title: "Remove this stop" });
      del.addEventListener("click", () => { if (stops().length > 2 && st(i)) { stops().splice(i, 1); touch(); } });
      const r = el("div", { class: "row" }, [
        el("span", { class: "lbl", text: "Stop " + (i + 1) }), pos, el("span", { class: "lbl2", text: "%" }),
        hexField(() => (st(i) ? st(i).c : ""), (v) => { if (st(i)) st(i).c = v; }), del
      ]);
      showIf(r, () => i < stops().length);
      wrap.appendChild(r);
    }
    const add = el("button", { class: "btn small", text: "Add stop" });
    add.addEventListener("click", () => { if (stops().length < MAX) { stops().push({ p: 50, c: "#FFFFFF" }); touch(); } });
    showIf(add, () => stops().length < MAX);
    wrap.appendChild(add);
    return wrap;
  }
  // a colour row bound to a "#RRGGBB" string at `path`
  function colourRow(label, path) {
    return ui.row(label, hexField(() => getPath(state, path), (v) => ui.setPath(state, path, v)));
  }

  // ---- preview
  const loop = createPreviewLoop({
    renderOnce: () => previewOnce(),
    onError: (e) => { setStatus("Preview problem: " + (e && e.message ? e.message : e), true); console.error(e); }
  });
  const schedulePreview = (delay) => loop.schedule(delay);
  function tryLayerTarget(doc) { try { return PS.collectTargets(doc, "layer")[0]; } catch (e) { return { kind: "flat" }; } }

  async function previewOnce() {
    setStatus("Rendering preview...");
    const t0 = Date.now();
    let src, scale = 1;
    const doc = PS.activeDoc();
    if (doc) {
      const target = (state.out.source !== "flat") ? tryLayerTarget(doc) : { kind: "flat" };
      const r = await PS.readSource(doc, target, { kind: state.view.kind, size: state.view.size });
      src = r.src; scale = r.scale;
      docCache = { ppi: r.ppi, name: r.info.name, w: r.info.w, h: r.info.h, demo: false };
    } else {
      src = Engine.demoImage(state.view.size, Math.round(state.view.size * 0.75));
      docCache = { ppi: 300, name: "Demo image", w: src.w, h: src.h, demo: true };
    }
    refs.docline.textContent = docCache.demo ? "No document open - demo image" : (docCache.name + "  " + docCache.w + " x " + docCache.h + " px");
    const res = await Engine.render(src, Object.assign({}, state, { scale, fullH: docCache.h }), { yield: tick });
    const rgb = Engine.composite(res, { type: state.view.bg }, src);
    refs.preview.src = PNG.dataURL(rgb, res.w, res.h, 3);
    const avail = (refs.previewBox.clientWidth || 320) - 4;
    const maxH = layout ? layout.previewMaxHeight() : Infinity;
    const dw = Math.max(1, Math.round(Math.min(avail, res.w, maxH * res.w / res.h))), dh = Math.round(res.h * dw / res.w);
    refs.preview.style.width = dw + "px";
    refs.preview.style.height = dh + "px";
    setStatus("Preview " + res.w + " x " + res.h + " in " + (Date.now() - t0) + " ms  |  " + res.layers.length + " layer" + (res.layers.length === 1 ? "" : "s"));
  }

  // ---- apply
  async function applyNow() {
    const doc = PS.activeDoc();
    if (!doc) { setStatus("Open a document first. The preview is only using the demo image.", true); return; }
    const btn = refs.apply;
    loop.setBusy(true);
    try {
      const targets = PS.collectTargets(doc, state.out.source);
      const info = PS.docInfo(doc);
      const work = info.w * info.h * targets.length * (cfg.costFactor ? cfg.costFactor(state) : 1);
      if (work > 40e6 && !confirmArmed) {
        confirmArmed = true;
        setStatus("Big job (about " + Math.round(work / 1e6) + " million pixel-steps, may take a while). Click Apply again to confirm.", true);
        btn.textContent = "Click again to confirm";
        return;
      }
      confirmArmed = false;
      btn.textContent = "Working...";
      btn.setAttribute("disabled", "true");
      let done = 0;
      for (const t of targets) {
        setStatus("Reading pixels " + (done + 1) + "/" + targets.length + "...");
        const r = await PS.readSource(doc, t, { kind: "full" });
        setStatus("Rendering " + (done + 1) + "/" + targets.length + "...");
        const res = await Engine.render(r.src, Object.assign({}, state, { scale: 1, fullH: r.info.h }), { yield: tick });
        setStatus("Writing layers...");
        const base = t.kind === "layer" ? (t.layer.name + " - ") : "";
        const warnings = await PS.writeResult(doc, res, {
          origin: r.origin,
          groupName: base + cfg.title + " - " + presetName,
          hideSource: state.out.hide,
          hideLayers: t.kind === "layer" ? [t.layer] : null
        });
        done++;
        if (warnings && warnings.length) setStatus(warnings.join(" | "), true);
      }
      if (!refs.status.className.includes("err")) setStatus("Done. " + done + " group" + (done === 1 ? "" : "s") + " added. Undo with one Ctrl/Cmd+Z.");
    } catch (e) {
      console.error(e);
      setStatus("Apply failed: " + (e && e.message ? e.message : e), true);
    } finally {
      loop.setBusy(false);
      if (!confirmArmed) btn.textContent = "Apply to document";
      btn.removeAttribute("disabled");
    }
  }

  // ---- presets
  function applyPatch(p, name) {
    const keepOut = clone(state.out), keepView = clone(state.view);
    state = merge(DEFAULTS, p);
    state.out = keepOut; state.view = keepView;
    presetName = name || "Custom";
    touch();
  }
  function stateForSave() { const s = clone(state); delete s.view; delete s.out; return s; }

  // ---- build
  function build(root) {
    clear(root);
    layout = splitLayout(root, el);
    const top = layout.pinned;
    top.appendChild(el("div", { class: "hdr" }, [el("div", { class: "title", text: cfg.title }), el("div", { class: "sub", text: cfg.sub })]));
    refs.docline = el("div", { class: "docline", text: "" });
    refs.preview = el("img", { class: "preview" });
    refs.previewBox = el("div", { class: "previewbox" }, [refs.preview]);
    refs.status = el("div", { class: "status", text: "Starting..." });
    const refresh = el("button", { class: "btn small", text: "Refresh" });
    refresh.addEventListener("click", () => schedulePreview(0));
    const autoCb = el("input", { type: "checkbox" });
    autoCb.checked = true;
    autoCb.addEventListener("change", () => { auto = !!autoCb.checked; if (auto) schedulePreview(0); });
    const pinCb = el("input", { type: "checkbox", title: "Keep the preview on top while the controls scroll" });
    pinCb.checked = true;
    pinCb.addEventListener("change", () => { layout.setPinned(!!pinCb.checked); schedulePreview(0); });
    top.appendChild(card("Preview", [
      refs.docline, refs.previewBox,
      el("div", { class: "row wrap" }, [
        segGroup("view.kind", [{ v: "whole", l: "Whole" }, { v: "detail", l: "Detail 1:1", t: "True pixel size, centre crop" }]),
        segGroup("view.bg", [{ v: "checker", l: "Checker" }, { v: "white", l: "White" }, { v: "black", l: "Black" }])
      ]),
      el("div", { class: "row" }, [refresh, el("span", { class: "lbl2", text: "Auto-update" }), autoCb, el("span", { class: "lbl2", text: "Pin on top" }), pinCb]),
      refs.status
    ]));
    root = layout.scroller;

    lib = createLibrary(ui, {
      builtins: PRESETS,
      applyPatch: (p) => { const hit = PRESETS.find((x) => x.p === p); applyPatch(p, hit ? hit.name : "Custom"); },
      getSaveable: stateForSave, io: PS, setStatus
    });
    root.appendChild(lib.card);
    const kit = { gradientEditor, colourRow, touch, get state() { return state; } };
    cfg.cards(ui, kit).forEach((c) => root.appendChild(c));

    refs.apply = el("button", { class: "apply", text: "Apply to document" });
    refs.apply.addEventListener("click", applyNow);
    root.appendChild(card("Output", [
      selectRow("Source", "out.source", [{ v: "flat", l: "Flattened document" }, { v: "layer", l: "Active layer" }, { v: "each", l: "Each selected layer (batch)" }], () => { confirmArmed = false; })
    ].concat(cfg.outputRows ? cfg.outputRows(ui, kit) : []).concat([
      checkRow("Hide source artwork afterwards", "out.hide"),
      refs.apply,
      el("div", { class: "hint", text: "Creates a layer group; your artwork is never changed. One undo step." })
    ])));
    root.appendChild(el("div", { class: "foot", text: cfg.footer || (cfg.title + " 1.0  -  part of Frank's tool suite") }));
    refreshAll();
  }

  async function init() {
    if (built) return;
    built = true;
    build(document.getElementById("app"));
    await lib.load();
    schedulePreview(100);
  }

  try {
    const { entrypoints } = require("uxp");
    const panels = {};
    panels[cfg.panelId] = { create() { init(); }, show() { if (!built) init(); else schedulePreview(200); } };
    entrypoints.setup({ panels });
  } catch (e) { /* older hosts: fall through to direct init */ }
  setTimeout(() => { init(); }, 0);

  return { _test: { get state() { return state; }, set state(v) { state = v; }, applyNow, runPreview: () => loop.run(), init, refs, touch } };
}

module.exports = { createToolPanel };
