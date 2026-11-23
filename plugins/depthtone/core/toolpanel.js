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
//     viewDefaultBg, footer,
//     prepareSource(doc, r, phase)  optional: add extra inputs to r.src (e.g. a focus mask); phase "preview" | "apply"
//     prepareApply(doc, setStatus)  optional: returns the document to write into (e.g. a print-ready copy)
//     groupLabel(state, presetName) optional: the look's name in the layer group
//     cancellable                   optional: Apply turns into Cancel while working; the engine gets hooks.progress
//     reEdit                        optional: every applied group gets a " #K3F9" tag and its settings are
//                                   saved; a Re-edit button loads them back from the selected group, and the
//                                   next Apply hides that old group (non-destructive re-runs)
//     code, glow                    the tool's rack code ("PB-09") and neon hex for the knobs
//     brand                         "console" (default, the suite look since 2026-11-22) or "none"
//     colour                        false = no Colour Deck card (export-mode tools never get one)
//     colourBase                    background the Colour Deck reads tones from: "black" (default) or "white"
//     lookSample                    optional: require("./look-sample.js") - the look browser's sample picture
//     sectionOf(title)              optional: "look" | "controls" | "colour" | "output" for a card;
//                                   else ui.card's {section}, else by title (Style/Effect type = look,
//                                   Colour/Color/Tint = colour, everything else = controls) })
// Panel order (Frank, 2026-11-22): A Look (Library, style) / B Controls (the tool's cards as tabs in
// one Effects card; cards with {bypass} get an on/off dot) / C Colour / D Output, with a jump strip
// pinned under the preview and foldable cards.
// Engine must export render(src, P, hooks) and composite(res, bg) (+ demoImage).
//
// Export mode (tools that write a file instead of layers, e.g. Font Brew):
//   previewRender(state, {tick}) -> { rgb, w, h, status, docline }  replaces the pixel preview
//   previewRows(ui, kit) -> [rows]   replaces the Whole/Detail + background row
//   outputCard(ui, kit) -> card      replaces the Output/Apply card
// ======================================================================
const PNG = require("./png.js");
const PS = require("./ps-io.js");
const { createUI, getPath } = require("./ui.js");
const { createPreviewLoop, tick } = require("./preview.js");
const { splitLayout } = require("./layout.js");
const { createLibrary } = require("./library.js");
const Colour = require("./colour.js");
const { createColourDeck, applyDeckPreview, addDeckLayer } = require("./colourdeck.js");
const IM = require("./imgmath.js");

// Plain-English versions of raw host errors (research quick win UX-16, 2026-11-23):
// say what happened and what to do next.
function plainError(msg) {
  const m = String(msg || "");
  if (/modal state/i.test(m)) return "Photoshop is busy (a dialog or another plugin is working). Finish that, then try again.";
  if (/out of memory|memory/i.test(m)) return "Not enough memory for this size. Try Detail view, a smaller document, or close other documents.";
  if (/(no|invalid) (active )?document|document is closed/i.test(m)) return "The document was closed. Open or select a document, then try again.";
  if (/locked/i.test(m)) return "That layer is locked. Unlock it in the Layers panel, then try again.";
  if (/timed? ?out/i.test(m)) return "Photoshop took too long to answer. Try again; if it repeats, restart Photoshop.";
  return m;
}

function createToolPanel(cfg) {
  const { Engine, DEFAULTS, PRESETS, merge, clone } = cfg;
  cfg = Object.assign({ brand: "console" }, cfg);
  if (cfg.brand === "none") cfg.brand = undefined;
  PS.configure({ appName: cfg.appName, presetFile: cfg.presetFile || "presets.json", exportName: cfg.exportName || "looks.json" });

  let state = PRESETS[0] ? merge(DEFAULTS, PRESETS[0].p) : clone(DEFAULTS);   // start on the first preset so its name matches
  const hasDeck = cfg.colour !== false && !cfg.previewRender && !cfg.outputCard;
  if (cfg.split == null) cfg.split = !cfg.previewRender;   // Before/After on every pixel tool (research quick win ID-09)
  if (hasDeck) state.deck = Colour.normalize(PRESETS[0] && PRESETS[0].p.deck);
  let lastSrc = null, lastScale = 1, deck = null, lookBrowser = null;
  const D = () => (state.deck && typeof state.deck === "object" ? state.deck : (state.deck = Colour.normalize(state.deck)));   // states set from outside may lack it
  let docCache = { ppi: 300, name: "", w: 0, h: 0, demo: true };
  let auto = true, built = false, confirmArmed = false, lib = null, layout = null;
  let presetName = PRESETS[0] ? PRESETS[0].name : "Custom";
  const refs = {};
  let offFx = {};   // effect tabs switched off: { cardTitle: { path: neutral } }
  // the state the engine sees: switched-off effects get their neutral values
  function engineState(extra) {
    const base = Object.assign({}, state, extra || {});
    const titles = Object.keys(offFx);
    if (!titles.length) return base;
    const s = Object.assign(clone(state), extra || {});
    titles.forEach((t) => { const m = offFx[t]; Object.keys(m).forEach((p) => { try { ui.setPath(s, p, m[p]); } catch (e) { /* path not in this state */ } }); });
    return s;
  }
  // the values of the look that was loaded last: double-clicking a knob goes back to them
  let lookBase = clone(state);
  const ui = createUI({ getState: () => state, onChange: () => touch(), pickColor: (hex) => PS.pickColor(hex), brand: cfg.brand, glow: cfg.glow, storeKey: cfg.appName || cfg.title,
    getDefault: (path) => getPath(lookBase, path), onSelect: (i) => showKeys(i) });
  // live key hints for the selected knob (Blender-style status line, research quick win ID-13)
  const KEYS_IDLE = "Drag a knob or its name to turn it  |  double-click resets  |  Esc cancels a running Apply";
  function showKeys(i) {
    if (!refs.keys) return;
    if (!i) { refs.keys.textContent = KEYS_IDLE; return; }
    const range = i.min + "-" + i.max + (i.unit ? " " + i.unit : "");
    refs.keys.textContent = String(i.label).toUpperCase() + " " + range + "  |  drag / wheel turns, Shift = fine  |  Up/Down steps, Shift = x10  |  double-click resets";
  }
  const { el, clear, bind, showIf, refreshAll, segGroup, selectRow, checkRow, hexField, card } = ui;

  function touch() { refreshAll(); if (auto) schedulePreview(150); }
  function setStatus(msg, isErr) {
    if (!refs.status) return;
    if (isErr) msg = plainError(msg);
    refs.status.textContent = msg;
    refs.status.className = "status" + (isErr ? " err" : "");
    if (refs.led) refs.led.set(isErr ? "err" : (working ? "busy" : "ready"));
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
    if (cfg.previewRender) {
      const r = await cfg.previewRender(state, { tick });
      refs.docline.textContent = r.docline || "";
      refs.preview.src = PNG.dataURL(r.rgb, r.w, r.h, 3);
      sizePreview(r.w, r.h);
      if (lookBrowser) lookBrowser.sourceChanged();
      setStatus(r.status != null ? r.status : ("Preview in " + (Date.now() - t0) + " ms"), !!r.err);
      return;
    }
    let src, scale = 1;
    const doc = PS.activeDoc();
    if (doc) {
      const target = (state.out.source !== "flat") ? tryLayerTarget(doc) : { kind: "flat" };
      const r = await PS.readSource(doc, target, { kind: state.view.kind, size: state.view.size });
      src = r.src; scale = r.scale;
      if (cfg.prepareSource) { try { await cfg.prepareSource(doc, r, "preview"); } catch (e) { console.error(e); } }
      docCache = { ppi: r.ppi, name: r.info.name, w: r.info.w, h: r.info.h, demo: false };
    } else {
      src = Engine.demoImage(state.view.size, Math.round(state.view.size * 0.75));
      docCache = { ppi: 300, name: "Demo image", w: src.w, h: src.h, demo: true };
    }
    refs.docline.textContent = docCache.demo ? "No document open - demo image" : (docCache.name + "  " + docCache.w + " x " + docCache.h + " px");
    markApplyReady(!docCache.demo);
    const res = await Engine.render(src, engineState({ scale, fullH: docCache.h, fullW: docCache.w }), { yield: tick });
    const rgb = Engine.composite(res, { type: state.view.bg }, src);
    lastSrc = src; lastScale = scale;
    if (lookBrowser) lookBrowser.sourceChanged();
    if (hasDeck) { applyDeckPreview(rgb, res, D(), Engine, src, state.view.bg, cfg.colourBase); }
    lastShown = { rgb, w: res.w, h: res.h, before: cfg.split ? IM.composite({ w: res.w, h: res.h, layers: [], overSource: true }, { type: state.view.bg }, src) : null };
    paintPreview();
    sizePreview(res.w, res.h);
    if (refs.scr) { refs.scrL.textContent = "CH1  " + String(cfg.groupLabel ? cfg.groupLabel(state, presetName) : presetName).toUpperCase(); refs.scrR.textContent = res.w + " x " + res.h + " PX"; }
    setStatus("Preview " + res.w + " x " + res.h + " in " + (Date.now() - t0) + " ms  |  " + res.layers.length + " layer" + (res.layers.length === 1 ? "" : "s"));
  }

  // Before/After split (cfg.split, Mobglow 2.0): left of the divider is the untouched
  // picture, right is the result. Dragging on the preview moves the divider without a re-render.
  let lastShown = null;
  function paintPreview() {
    const L = lastShown;
    if (!L) return;
    const pos = cfg.split ? (state.view.split || 0) : 0;
    if (!pos || !L.before) { refs.preview.src = PNG.dataURL(L.rgb, L.w, L.h, 3); return; }
    const out = Uint8Array.from(L.rgb), cut = Math.round(L.w * pos / 100);
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const j = (y * L.w + x) * 3;
      if (x === cut || x === cut - 1) { out[j] = out[j + 1] = out[j + 2] = 255; }
      else if (x < cut) { out[j] = L.before[j]; out[j + 1] = L.before[j + 1]; out[j + 2] = L.before[j + 2]; }
    }
    refs.preview.src = PNG.dataURL(out, L.w, L.h, 3);
  }
  // where a pointer event lands on the preview, as 0..1 of the picture
  function previewXY(e) {
    const img = refs.preview;
    let r = null; try { r = img.getBoundingClientRect(); } catch (err) { /* no layout */ }
    const W = (r && r.width) || img.clientWidth || 1, H = (r && r.height) || img.clientHeight || 1;
    const x = r ? e.clientX - r.left : (e.offsetX || 0), y = r ? e.clientY - r.top : (e.offsetY || 0);
    return { u: Math.max(0, Math.min(1, x / W)), v: Math.max(0, Math.min(1, y / H)) };
  }
  const previewClickers = [];   // tool hooks, e.g. Mobglow's eyedropper; return true to take the press
  let splitDrag = false;
  function wirePreviewPointer() {
    const img = refs.preview;
    const moveSplit = (e) => { const { u } = previewXY(e); state.view.split = Math.max(1, Math.min(99, Math.round(u * 100))); paintPreview(); };
    img.addEventListener("mousedown", (e) => {
      const at = previewXY(e);
      for (const f of previewClickers) { try { if (f(at, e)) return; } catch (err) { console.error(err); } }
      if (cfg.split && state.view.split) { splitDrag = true; moveSplit(e); }
    });
    img.addEventListener("mousemove", (e) => { if (splitDrag) moveSplit(e); });
    const end = () => { splitDrag = false; };
    img.addEventListener("mouseup", end); img.addEventListener("mouseleave", end);
  }

  // The preview keeps the picture's exact shape. clientWidth includes the box's
  // padding (4 px each side with the console brand), so subtract the real padding:
  // an image even a few px wider than the box gets squeezed sideways by UXP while
  // its height stays, which distorts it (Frank, 2026-11-22). Refit when the panel
  // is resized, too.
  let previewWH = null, fitW = 0;
  function boxInner() {
    const box = refs.previewBox;
    let pad = 10;
    try { const cs = window.getComputedStyle(box); const p = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0); if (p > 0) pad = p + 2; } catch (e) { /* no computed style */ }
    return (box.clientWidth || 330) - pad;
  }
  function sizePreview(w, h) {
    previewWH = [w, h];
    const avail = boxInner();
    fitW = refs.previewBox.clientWidth || 0;
    const maxH = layout ? layout.previewMaxHeight() : Infinity;
    const dw = Math.max(1, Math.floor(Math.min(avail, w, maxH * w / h))), dh = Math.max(1, Math.round(h * dw / w));
    refs.preview.style.width = dw + "px";
    refs.preview.style.height = dh + "px";
    refs.preview.style.maxWidth = "none";
    refs.preview.style.flexShrink = "0";
  }
  function refitPreview() { if (previewWH && refs.previewBox && (refs.previewBox.clientWidth || 0) !== fitW) sizePreview(previewWH[0], previewWH[1]); }
  try { window.addEventListener("resize", refitPreview); } catch (e) { /* host without resize events */ }

  // ---- apply
  let working = false, cancelReq = false;
  // error prevention (UX-06): with no document the Apply key looks blocked and says why
  function markApplyReady(ok) {
    const b = refs.apply;
    if (!b) return;
    if (ok) { b.classList.remove("blocked"); b.setAttribute("title", "Apply to the document as a new layer group (one undo step)"); }
    else { b.classList.add("blocked"); b.setAttribute("title", "Open a document first. The preview is using the demo image."); }
  }
  // Esc cancels a running Apply (UX-04)
  try {
    document.addEventListener("keydown", (e) => {
      const k = e.key || e.code;
      if ((k === "Escape" || e.keyCode === 27) && working && cfg.cancellable) { cancelReq = true; setStatus("Cancelling..."); }
    });
  } catch (e) { /* no document events */ }
  // Right after Edit > Undo (or while another plugin works) Photoshop can say
  // "host is in a modal state" for a moment. Wait and try again instead of failing.
  async function whenNotModal(fn) {
    for (let i = 0; ; i++) {
      try { return await fn(); } catch (e) {
        if (i >= 8 || !/modal state/i.test(String(e && e.message || e))) throw e;
        setStatus("Photoshop is busy, retrying...");
        await new Promise((r) => setTimeout(r, 250 + i * 150));
      }
    }
  }
  async function applyNow() {
    if (working) { if (cfg.cancellable) { cancelReq = true; setStatus("Cancelling..."); } return; }
    let doc = PS.activeDoc();
    if (!doc) { setStatus("Open a document first. The preview is only using the demo image.", true); return; }
    const btn = refs.apply, tStart = Date.now();
    loop.setBusy(true);
    try {
      // a preview render may still hold Photoshop's modal scope: let it finish first
      for (let i = 0; i < 100 && loop.rendering; i++) await new Promise((r) => setTimeout(r, 50));
      const targets = PS.collectTargets(doc, state.out.source);
      const info = PS.docInfo(doc);
      const work = info.w * info.h * targets.length * (cfg.costFactor ? cfg.costFactor(engineState()) : 1);
      if (work > 40e6 && !confirmArmed) {
        confirmArmed = true;
        setStatus("Big job (about " + Math.round(work / 1e6) + " million pixel-steps, may take a while). Click Apply again to confirm.", true);
        btn.textContent = "Click again to confirm";
        return;
      }
      confirmArmed = false;
      working = true; cancelReq = false;
      if (refs.meter) refs.meter.run();
      if (refs.led) refs.led.set("busy");
      btn.textContent = cfg.cancellable ? "Cancel" : "Working...";
      if (!cfg.cancellable) btn.setAttribute("disabled", "true");
      if (cfg.prepareApply) doc = await cfg.prepareApply(doc, setStatus);
      const runTargets = cfg.prepareApply ? PS.collectTargets(doc, state.out.source) : targets;
      const hooks = cfg.cancellable
        ? { yield: async () => { await tick(); if (cancelReq) throw new Error("Cancelled. Nothing was added."); }, progress: (m) => setStatus(m) }
        : { yield: tick };
      let done = 0;
      for (const t of runTargets) {
        setStatus("Reading pixels " + (done + 1) + "/" + runTargets.length + "...");
        const r = await whenNotModal(() => PS.readSource(doc, t, { kind: "full" }));
        if (cfg.prepareSource) await cfg.prepareSource(doc, r, "apply");
        setStatus("Rendering " + (done + 1) + "/" + runTargets.length + "...");
        let res = await Engine.render(r.src, engineState({ scale: 1, fullH: r.info.h, fullW: r.info.w }), hooks);
        if (hasDeck && Colour.active(D())) { setStatus("Colour Deck..."); res = addDeckLayer(res, D(), Engine, r.src, cfg.colourBase); }
        setStatus("Writing layers...");
        const base = t.kind === "layer" ? (t.layer.name + " - ") : "";
        const tag = cfg.reEdit ? " #" + newTag() : "";
        const hiddenIds = [];
        const warnings = await PS.writeResult(doc, res, {
          hiddenIds,
          origin: r.origin,
          groupName: base + cfg.title + " - " + (cfg.groupLabel ? cfg.groupLabel(state, presetName) : presetName) + tag,
          hideSource: state.out.hide,
          hideLayers: t.kind === "layer" ? [t.layer] : null
        });
        if (tag) await rememberLook(tag.slice(2), hiddenIds);
        done++;
        if (warnings && warnings.length) setStatus(warnings.join(" | "), true);
      }
      if (refs.meter) refs.meter.done((Date.now() - tStart) / 1000);
      if (!refs.status.className.includes("err")) setStatus("Done. " + done + " group" + (done === 1 ? "" : "s") + " added. Undo with one Ctrl/Cmd+Z.");
    } catch (e) {
      console.error(e);
      const msg = e && e.message ? e.message : String(e);
      if (refs.meter) refs.meter.idle();
      setStatus(/^Cancelled/.test(msg) ? msg : "Apply failed: " + msg, true);
    } finally {
      working = false; cancelReq = false;
      loop.setBusy(false);
      if (refs.led) refs.led.set(refs.status.className.includes("err") ? "err" : "ready");
      if (!confirmArmed) btn.textContent = cfg.applyLabel || "Apply to document";
      btn.removeAttribute("disabled");
    }
  }

  // ---- re-edit: settings saved per applied group, keyed by its #tag
  const LOOKS_FILE = "applied-looks.json";
  function newTag() {
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = ""; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
    return s;
  }
  async function rememberLook(tag, hiddenIds) {
    const all = (await PS.loadData(LOOKS_FILE)) || {};
    all[tag] = { name: presetName, p: stateForSave(), t: Date.now(), src: hiddenIds || [] };
    const keys = Object.keys(all).sort((a, b) => all[b].t - all[a].t);
    keys.slice(300).forEach((k) => delete all[k]);     // keep the newest 300
    try { await PS.saveData(LOOKS_FILE, all); } catch (e) { console.error(e); }
  }
  async function reEditNow() {
    const doc = PS.activeDoc();
    const layer = doc ? PS.activeLayer(doc) : null;
    const m = layer && /#([A-Z0-9]{4})\s*$/.exec(String(layer.name || ""));
    if (!m) { setStatus("Select a group made by " + cfg.title + " (its name ends in #CODE), then press Re-edit.", true); return; }
    const all = (await PS.loadData(LOOKS_FILE)) || {};
    const hit = all[m[1]];
    if (!hit) { setStatus("No saved settings for #" + m[1] + " on this computer.", true); return; }
    // show the artwork the old group was made from (and hide the group) so preview and Apply read the original
    try { await PS.swapToSource(doc, layer, hit.src); } catch (e) { console.error(e); }
    applyPatch(hit.p, hit.name);
    setStatus("Loaded #" + m[1] + ". The old group is hidden (not deleted) and the original is showing. Change anything, then Apply.");
  }

  // ---- look browser (Frank, 2026-11-22: from Dithers Brew, at the top of every plugin):
  // every built-in look rendered small on the current preview source; click one to load it
  function halfSrc(src) {
    const c = src.c || 4, w2 = Math.max(1, src.w >> 1), h2 = Math.max(1, src.h >> 1), out = new Uint8Array(w2 * h2 * c);
    for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) for (let k = 0; k < c; k++) {
      const a = ((2 * y) * src.w + 2 * x) * c + k, b = a + src.w * c;
      out[(y * w2 + x) * c + k] = (src.data[a] + src.data[a + c] + src.data[b] + src.data[b + c] + 2) >> 2;
    }
    return { w: w2, h: h2, c, data: out };
  }
  function decodeSample(smp) {
    const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", T = new Uint8Array(128);
    for (let i = 0; i < 64; i++) T[A.charCodeAt(i)] = i;
    const b = smp.rgb, n = smp.w * smp.h, data = new Uint8Array(n * 4);
    let px = 0, ch = 0;
    const put = (v) => { data[px * 4 + ch] = v; if (++ch === 3) { data[px * 4 + 3] = 255; ch = 0; px++; } };
    for (let i = 0; i + 3 < b.length && px < n; i += 4) {
      const q = (T[b.charCodeAt(i)] << 18) | (T[b.charCodeAt(i + 1)] << 12) | (T[b.charCodeAt(i + 2)] << 6) | T[b.charCodeAt(i + 3)];
      put((q >> 16) & 255); if (b[i + 2] !== "=" && px < n) put((q >> 8) & 255); if (b[i + 3] !== "=" && px < n) put(q & 255);
    }
    return { w: smp.w, h: smp.h, c: 4, data };
  }
  function createLookBrowser() {
    const KEY = "brew.looks." + (cfg.appName || cfg.title);
    let smp = cfg.lookSample;   // each plugin's own sample picture: plugins/<tool>/look-sample.js
    if (!smp) { try { smp = require("../look-sample.js"); } catch (e) { smp = null; } }
    const sample = smp && smp.rgb ? decodeSample(smp) : null;
    let onSample = !!sample;
    try { if (localStorage.getItem(KEY + ".src") === "doc") onSample = false; } catch (e) { /* no storage */ }
    const grid = el("div", { class: "lookgrid" });
    const btn = el("button", { class: "btn small", text: "Show looks" });
    let shown = false, sig = "", runId = 0, cells = [];
    function setShown(v) {
      shown = v;
      grid.style.display = v ? "" : "none";
      btn.textContent = v ? "Hide looks" : "Show looks";
      try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) { /* no storage */ }
      if (v) render();
    }
    btn.addEventListener("click", () => setShown(!shown));
    function build() {
      clear(grid);
      cells = PRESETS.map((pr) => {
        const img = el("img", { class: "lookimg" });
        const c = el("div", { class: "look", title: (pr.cat ? pr.cat + " - " : "") + pr.name + ": click to load" }, [img, el("div", { class: "lookname", text: pr.name })]);
        c.addEventListener("click", () => { applyPatch(pr.p, pr.name); mark(); });
        grid.appendChild(c);
        return { pr, img, node: c };
      });
    }
    function fitThumb(o) {
      if (!o.aspect) return;
      const cw = (o.node.clientWidth || 0) - 2;
      if (cw > 4) o.img.style.height = Math.round(cw * o.aspect) + "px";
    }
    function mark() { cells.forEach((o) => { if (o.pr.name === presetName) o.node.classList.add("on"); else o.node.classList.remove("on"); }); }
    async function render() {
      if (cfg.previewRender) return renderExport();
      const useDoc = !onSample && lastSrc;
      const src0 = onSample && sample ? sample : (lastSrc || Engine.demoImage(160, 120));
      const s2 = (onSample && sample ? "sample" : "") + (useDoc ? docCache.name + docCache.w + "x" + docCache.h : "demo") + "|" + src0.w + "x" + src0.h + "|" + (state.view && state.view.bg);
      if (!cells.length) build();
      mark();
      if (s2 === sig) return;
      sig = s2;
      const id = ++runId;
      let src = src0;
      const plain = Object.keys(src0).every((k) => k === "w" || k === "h" || k === "c" || k === "data");   // extra inputs (masks) stay full size
      while (plain && src.w > 200) src = halfSrc(src);   // thumbnails render at 160-200 px: fast enough to show on open
      const scale = (useDoc ? lastScale : 1) * src.w / src0.w;
      for (const o of cells) {
        if (id !== runId || !shown) return;
        try {
          const P = merge(DEFAULTS, o.pr.p);
          P.out = clone(state.out); P.view = clone(state.view);
          (Array.isArray(o.pr.p._off) ? o.pr.p._off : []).forEach((t) => { const m = bypassMaps[t]; if (m) Object.keys(m).forEach((k) => { try { ui.setPath(P, k, m[k]); } catch (e) { /* not in state */ } }); });
          Object.assign(P, useDoc ? { scale, fullH: docCache.h || src.h, fullW: docCache.w || src.w } : { scale, fullH: src.h, fullW: src.w });
          const res = await Engine.render(src, P, { yield: tick });
          const rgb = Engine.composite(res, { type: state.view.bg }, src);
          if (hasDeck && o.pr.p.deck) applyDeckPreview(rgb, res, Colour.normalize(o.pr.p.deck), Engine, src, state.view.bg, cfg.colourBase);
          o.img.src = PNG.dataURL(rgb, res.w, res.h, 3);
          // UXP does not keep an image's shape from its width alone: set the height
          // too, or a thumbnail is stretched (Frank, 2026-11-22: "the preview is distorted")
          o.aspect = res.h / res.w; fitThumb(o);
        } catch (e) { /* leave this one blank */ }
        await tick();
      }
    }
    // export-mode tools (Font Brew): each look drawn by the tool's own preview
    async function renderExport() {
      if (!cells.length) build();
      mark();
      const s2 = "x|" + JSON.stringify(state.view);
      if (s2 === sig) return;
      sig = s2;
      const id = ++runId;
      for (const o of cells) {
        if (id !== runId || !shown) return;
        try {
          const P = merge(DEFAULTS, o.pr.p);
          P.out = clone(state.out); P.view = clone(state.view);
          const r = await cfg.previewRender(P, { tick });
          o.img.src = PNG.dataURL(r.rgb, r.w, r.h, 3);
          o.aspect = r.h / r.w; fitThumb(o);
        } catch (e) { /* leave this one blank */ }
        await tick();
      }
    }
    // picture switch: this plugin's sample picture or the open document
    const srcBtns = sample && !cfg.previewRender ? [["sample", "Sample"], ["doc", "My image"]].map(([v, l]) => {
      const b = el("button", { class: "btn small lsrc", text: l, title: v === "sample" ? "Show the looks on this plugin's sample picture" : "Show the looks on your open document" });
      b.addEventListener("click", () => { onSample = v === "sample"; try { localStorage.setItem(KEY + ".src", v); } catch (e) { /* no storage */ } paintSrc(); sig = ""; if (shown) render(); });
      b.__v = v;
      return b;
    }) : [];
    function paintSrc() { srcBtns.forEach((b) => { if ((b.__v === "sample") === onSample) b.classList.add("on"); else b.classList.remove("on"); }); }
    paintSrc();
    const node = card("Look browser", [
      el("div", { class: "row" }, [btn].concat(srcBtns)),
      el("div", { class: "hint", text: cfg.previewRender ? "Every built-in look. Click one to load it." : "Every built-in look, on " + (sample ? "a sample picture or your image" : "your image") + ". Click one to load it." }),
      grid
    ], { section: "look" });
    let want = false;
    want = true;   // previews show by default (Frank, 2026-11-22); Hide is remembered
    try { if (localStorage.getItem(KEY) === "0") want = false; } catch (e) { /* no storage */ }
    grid.style.display = "none";
    return {
      card: node,
      sourceChanged() { if (shown) render(); else mark(); },
      // open now, render after the first preview so the panel's own preview comes first
      start() { if (want) { shown = true; grid.style.display = ""; btn.textContent = "Hide looks"; build(); } },
      _test: { setShown, get cells() { return cells; }, get onSample() { return onSample; }, srcBtns }
    };
  }

  // ---- presets
  function applyPatch(p, name) {
    const keepOut = clone(state.out), keepView = clone(state.view), keepColour = state.deck;
    state = merge(DEFAULTS, p);
    state.out = keepOut; state.view = keepView;
    if (hasDeck) state.deck = p && p.deck ? Colour.normalize(p.deck) : keepColour;   // looks without colour keep the current deck
    setOffList(p && p._off);
    presetName = name || "Custom";
    lookBase = clone(state);
    touch();
  }
  function stateForSave() { const s = clone(state); delete s.view; delete s.out; const off = Object.keys(offFx); if (off.length) s._off = off; return s; }
  let bypassMaps = {};   // card title -> { path: neutral } for cards that can be switched off
  function setOffList(list) {
    offFx = {};
    (Array.isArray(list) ? list : []).forEach((t) => { if (bypassMaps[t]) offFx[t] = bypassMaps[t]; });
  }
  function fxOn(title) { return !offFx[title]; }
  function setFxOn(title, on) { if (on) delete offFx[title]; else if (bypassMaps[title]) offFx[title] = bypassMaps[title]; }

  // which section a tool card goes in
  function sectionOf(c) {
    const info = c.__card || { title: "", opts: {} };
    const t = String(info.title || "");
    if (cfg.sectionOf) { const v = cfg.sectionOf(t); if (v) return v; }
    if (info.opts && info.opts.section) return info.opts.section;
    if (/^(style|effect type)$/i.test(t)) return "look";
    if (/colou?r|tint|palette/i.test(t)) return "colour";
    return "controls";
  }


  // ---- build
  function build(root) {
    clear(root);
    layout = splitLayout(root, el);
    const top = layout.pinned;
    if (ui.brand) {
      root.classList.add("brand-" + cfg.brand);
      const h = ui.brand.header(cfg);
      refs.led = h;
      top.appendChild(h.node);
    } else {
      top.appendChild(el("div", { class: "hdr" }, [el("div", { class: "title", text: cfg.title }), el("div", { class: "sub", text: cfg.sub })]));
    }
    refs.docline = el("div", { class: "docline", text: "" });
    refs.preview = el("img", { class: "preview" });
    if (ui.brand) {
      refs.scrL = el("span", { class: "scrl", text: "CH1" });
      refs.scrR = el("span", { class: "scrr", text: "" });
      refs.scr = el("div", { class: "scrstrip" }, [refs.scrL, refs.scrR]);
    }
    refs.previewBox = el("div", { class: "previewbox" }, [refs.scr || null, refs.preview]);
    refs.previewBox.addEventListener("mouseover", refitPreview);     // UXP panels don't always send resize: refit when the pointer comes back
    refs.status = el("div", { class: "status", text: "Starting..." });
    const refresh = el("button", { class: "btn small", text: "Refresh" });
    refresh.addEventListener("click", () => schedulePreview(0));
    const autoCb = el("input", { type: "checkbox" });
    autoCb.checked = true;
    const setAuto = (v) => { auto = !!v; if (auto) schedulePreview(0); };
    autoCb.addEventListener("change", () => setAuto(autoCb.checked));
    const pinCb = el("input", { type: "checkbox", title: "Keep the preview on top while the controls scroll" });
    pinCb.checked = true;
    const setPin = (v) => { layout.setPinned(!!v); schedulePreview(0); };
    pinCb.addEventListener("change", () => setPin(pinCb.checked));
    const kit = { gradientEditor, colourRow, touch, setStatus, schedulePreview, loop, get state() { return state; },
      applyNow: () => applyNow(), io: PS, onPreviewPress: (f) => previewClickers.push(f),
      get source() { return lastSrc; }, get presetName() { return presetName; } };
    wirePreviewPointer();
    top.appendChild(card("Preview", [
      refs.docline, refs.previewBox
    ].concat(cfg.previewRows ? cfg.previewRows(ui, kit) : [
      el("div", { class: "row wrap" }, [
        segGroup("view.kind", [{ v: "whole", l: "Whole" }, { v: "detail", l: "Detail 1:1", t: "True pixel size, centre crop" }]),
        segGroup("view.bg", [{ v: "checker", l: "Checker" }, { v: "white", l: "White" }, { v: "black", l: "Black" }])
      ])
    ]).concat([
      cfg.split && ui.brand ? el("div", { class: "row" }, [ui.brand.miniToggle("Before / After", !!state.view.split, (v) => { state.view.split = v ? 50 : 0; paintPreview(); }, "Split the preview: original on the left, result on the right. Drag on the preview to move the line.")]) : null,
      el("div", { class: "row" }, ui.brand ? [refresh,
        ui.brand.miniToggle("Auto-update", true, setAuto),
        ui.brand.miniToggle("Pin on top", true, setPin, pinCb.title)
      ] : [refresh, el("span", { class: "lbl2", text: "Auto-update" }), autoCb, el("span", { class: "lbl2", text: "Pin on top" }), pinCb]),
      refs.status,
      ui.brand ? (refs.keys = el("div", { class: "keys", text: KEYS_IDLE })) : null
    ]), { fold: false }));
    root = layout.scroller;

    lib = createLibrary(ui, {
      builtins: PRESETS,
      applyPatch: (p) => { const hit = PRESETS.find((x) => x.p === p); applyPatch(p, hit ? hit.name : "Custom"); },
      getSaveable: stateForSave, io: PS, setStatus
    });
    const toolCards = cfg.cards(ui, kit).filter(Boolean);
    toolCards.forEach((c) => { const i = c.__card; if (i && i.opts && i.opts.bypass) bypassMaps[i.title] = i.opts.bypass; });
    const by = { look: [], controls: [], colour: [], output: [] };
    toolCards.forEach((c) => (by[sectionOf(c)] || by.controls).push(c));
    const secs = [];
    const addSection = (letter, name, id, nodes) => {
      if (!ui.brand) { nodes.forEach((n) => root.appendChild(n)); return; }
      const bar = ui.section(letter, name, id);
      root.appendChild(bar);
      nodes.forEach((n) => root.appendChild(n));
      secs.push({ letter, name, id, node: bar });
    };
    refs.sections = by;
    if (PRESETS.length) lookBrowser = createLookBrowser();
    addSection("A", "LOOK", "look", (lookBrowser ? [lookBrowser.card] : []).concat([lib.card]).concat(by.look));
    const ctl = by.controls.length > 1 && ui.brand ? [ui.tabs(by.controls, { title: "Effects", isOn: fxOn, setOn: setFxOn })] : by.controls;
    addSection("B", "CONTROLS", "controls", ctl);
    refs.colourSection = { cards: by.colour };
    if (hasDeck) {
      deck = createColourDeck(ui, { getC: D, touch, getSource: () => lastSrc, io: PS, setStatus });
      by.colour.push(deck.card);
    }
    if (by.colour.length) addSection("C", "COLOUR", "colour", by.colour);
    if (cfg.outputCard) {
      addSection("D", "OUTPUT", "output", [cfg.outputCard(ui, kit)].concat(by.output));
      if (ui.brand) top.appendChild(ui.jumpStrip(secs, layout.scroller));
      root.appendChild(el("div", { class: "foot", text: cfg.footer || (cfg.title + " 1.0  -  Frank's Brew suite") }));
      refreshAll();
      if (lookBrowser) lookBrowser.start();
      return;
    }

    refs.apply = el("button", { class: "apply", text: cfg.applyLabel || "Apply to document" });
    // Apply fires on mouse-up after a press on the key, with click as the fallback: UXP sometimes
    // drops the click on this key (CRT smoke test, 2026-11-22), while mousedown/up still arrive.
    let applyDown = false, skipClick = false, skipT = null;
    refs.apply.addEventListener("mousedown", () => { applyDown = true; });
    refs.apply.addEventListener("mouseleave", () => { applyDown = false; });
    refs.apply.addEventListener("mouseup", () => {
      if (!applyDown || refs.apply.hasAttribute("disabled")) return;
      applyDown = false;
      skipClick = true; clearTimeout(skipT); skipT = setTimeout(() => { skipClick = false; }, 500);   // the click that may follow is the same press
      applyNow();
    });
    refs.apply.addEventListener("click", () => { applyDown = false; if (skipClick) { skipClick = false; return; } applyNow(); });
    if (ui.brand) refs.meter = ui.brand.meter(12);
    addSection("D", "OUTPUT", "output", by.output.concat([card("Output", [
      selectRow("Source", "out.source", [{ v: "flat", l: "Flattened document" }, { v: "layer", l: "Active layer" }, { v: "each", l: "Each selected layer (batch)" }], () => { confirmArmed = false; })
    ].concat(cfg.outputRows ? cfg.outputRows(ui, kit) : []).concat([
      checkRow("Hide source artwork afterwards", "out.hide"),
      refs.meter ? refs.meter.node : null,
      refs.apply,
      cfg.reEdit ? (() => { const b = el("button", { class: "btn small reedit", text: "Re-edit selected group", title: "Load the settings of a group this tool made" }); b.addEventListener("click", () => { reEditNow().catch((e) => setStatus("Re-edit failed: " + e.message, true)); }); return b; })() : null,
      el("div", { class: "hint", text: "Creates a layer group; your artwork is never changed. One undo step." })
    ]))]));
    if (ui.brand) top.appendChild(ui.jumpStrip(secs, layout.scroller));
    root.appendChild(el("div", { class: "foot", text: cfg.footer || (cfg.title + " 1.0  -  Frank's Brew suite") }));
    refreshAll();
    if (lookBrowser) lookBrowser.start();
  }

  function menuAction(id) {
    if (id === "resetLook") {
      const keepOut = clone(state.out), keepView = clone(state.view);
      state = clone(lookBase); state.out = keepOut; state.view = keepView;
      touch(); setStatus("Knobs reset to " + presetName + ".");
    }
    else if (id === "split") { state.view.split = state.view.split ? 0 : 50; paintPreview(); schedulePreview(0); }
    else if (id === "foldAll") { if (ui.foldAll) ui.foldAll(!ui.anyOpen()); }
    else if (id === "about") setStatus(cfg.title + " " + (cfg.version || "") + "  |  " + (cfg.code || "") + "  |  Frank's Brew suite. Hover any control for help.");
  }
  async function init() {
    if (built) return;
    built = true;
    build(document.getElementById("app"));
    await lib.load();
    if (deck) await deck.load();
    schedulePreview(100);
  }

  try {
    const { entrypoints } = require("uxp");
    const panels = {};
    panels[cfg.panelId] = {
      create() { init(); }, show() { if (!built) init(); else schedulePreview(200); },
      // panel flyout menu (research quick win AD-05)
      menuItems: [
        { id: "resetLook", label: "Reset knobs to this look" },
        cfg.split ? { id: "split", label: "Before / After split" } : null,
        { id: "foldAll", label: "Fold or open all cards" },
        "-",
        { id: "about", label: "About " + cfg.title }
      ].filter(Boolean),
      invokeMenu(id) { menuAction(id); }
    };
    entrypoints.setup({ panels });
  } catch (e) { /* older hosts: fall through to direct init */ }
  setTimeout(() => { init(); }, 0);

  return { _test: { get state() { return state; }, set state(v) { state = v; }, applyNow, reEditNow, runPreview: () => loop.run(), init, refs, touch, menuAction, plainError, get lookBase() { return lookBase; }, get lookBrowser() { return lookBrowser; } } };
}

module.exports = { createToolPanel };
