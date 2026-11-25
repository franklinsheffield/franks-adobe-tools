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
const Brand = require("./brand.js");
const { createUI, getPath } = require("./ui.js");
const { createPreviewLoop, tick } = require("./preview.js");
const { splitLayout } = require("./layout.js");
const { createLibrary } = require("./library.js");
const Colour = require("./colour.js");
const { createColourDeck, applyDeckPreview, addDeckLayer } = require("./colourdeck.js");
const IM = require("./imgmath.js");

const QW = require("./quickwins.js");
const Blend = require("./blend.js");
const plainError = QW.plainError;

function createToolPanel(cfg) {
  const { Engine, PRESETS, merge, clone } = cfg;
  // Blending (all plugins): every look carries blend { mode, opacity }; cfg.blend === false opts out
  const hasBlend = cfg.blend !== false;
  const DEFAULTS = hasBlend ? Object.assign({ blend: clone(Blend.DEFAULT) }, cfg.DEFAULTS) : cfg.DEFAULTS;
  cfg = Object.assign({ brand: "console" }, cfg);
  if (cfg.brand === "none") cfg.brand = undefined;
  PS.configure({ appName: cfg.appName, presetFile: cfg.presetFile || "presets.json", exportName: cfg.exportName || "looks.json" });

  let state = PRESETS[0] ? merge(DEFAULTS, PRESETS[0].p) : clone(DEFAULTS);   // start on the first preset so its name matches
  // ---- Auto Tone (3.0 upgrade 1): cfg.autoTone = { on: bool | (state) => bool } turns the shared
  // pre-pass on for a tool; a look without its own autoTone gets the tool's default for that look.
  const AT = cfg.autoTone || null;
  function ensureAutoTone(st, patch) {
    if (!AT) return st;
    const own = patch && patch.autoTone;
    const on = typeof AT.on === "function" ? !!AT.on(st) : !!AT.on;
    st.autoTone = Object.assign({ on, amount: 100 }, own || {});
    return st;
  }
  const toneSrc = (src, st) => (AT && st && st.autoTone && st.autoTone.on && st.autoTone.amount > 0 ? IM.autoTone(src, st.autoTone.amount) : src);
  ensureAutoTone(state, PRESETS[0] && PRESETS[0].p);
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
  // Brew 3.0 (cfg.ui3, CRT Phaser pilot first): Night Arcade style, 7 fixed zones, hover help
  if (cfg.ui3) cfg.brand = "console";
  const ui = createUI({ getState: () => state, onChange: () => touch(), pickColor: (hex) => PS.pickColor(hex), brand: cfg.brand, glow: cfg.glow, storeKey: cfg.storeKey || cfg.appName || cfg.title,
    getDefault: (path) => getPath(lookBase, path), onSelect: (i) => showKeys(i),
    arcade: !!cfg.ui3, helpText: cfg.ui3 ? (cfg.help || {}) : null });
  // live key hints for the selected knob (Blender-style status line, research quick win ID-13)
  const KEYS_IDLE = QW.keysIdle(cfg.cancellable ? "a running Apply" : "");
  function showKeys(i) {
    if (!refs.keys) return;
    refs.keys.textContent = i ? QW.keysFor(i) : KEYS_IDLE;
  }
  const { el, clear, bind, showIf, refreshAll, segGroup, selectRow, checkRow, hexField, card } = ui;

  function touch() { if (hasBlend && !state.blend) state.blend = clone(Blend.DEFAULT); refreshAll(); if (auto) schedulePreview(150); }   // older saved looks have no blend
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
    return ui.helpAt(ui.row(label, hexField(() => getPath(state, path), (v) => ui.setPath(state, path, v))), { key: path, name: label, kind: "swatch" });
  }

  // ---- preview
  const loop = createPreviewLoop({
    renderOnce: () => previewOnce(),
    onError: (e) => { setStatus("Preview problem: " + (e && e.message ? e.message : e), true); console.error(e); }
  });
  const schedulePreview = (delay) => loop.schedule(delay);
  function tryLayerTarget(doc) { try { return PS.collectTargets(doc, state.out.source === "prev" ? "prev" : "layer")[0]; } catch (e) { return { kind: "flat" }; } }

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
    if (cfg.ui3 && zoom !== null) return previewZoomed(t0);
    let src, scale = 1;
    const doc = PS.activeDoc();
    if (doc) {
      const target = (state.out.source !== "flat") ? tryLayerTarget(doc) : { kind: "flat" };
      const r = await PS.readSource(doc, target, { kind: cfg.ui3 ? "whole" : state.view.kind, size: state.view.size });
      src = r.src; scale = r.scale;
      if (cfg.prepareSource) { try { await cfg.prepareSource(doc, r, "preview"); } catch (e) { console.error(e); } }
      docCache = { ppi: r.ppi, name: r.info.name, w: r.info.w, h: r.info.h, demo: false };
    } else {
      src = Engine.demoImage(state.view.size, Math.round(state.view.size * 0.75));
      docCache = { ppi: 300, name: "Demo image", w: src.w, h: src.h, demo: true };
    }
    refs.docline.textContent = docCache.demo ? "No document open - demo image" : (docCache.name + "  " + docCache.w + " x " + docCache.h + " px");
    markApplyReady(!docCache.demo);
    const res = await Engine.render(toneSrc(src, state), engineState({ scale, fullH: docCache.h, fullW: docCache.w }), { yield: tick });
    let rgb = Engine.composite(res, { type: state.view.bg }, src);
    lastSrc = src; lastScale = scale;
    if (lookBrowser) lookBrowser.sourceChanged();
    if (hasBlend && Blend.active(state.blend)) {
      // blended over the source, as the group will look in Photoshop
      const withDeck = hasDeck && Colour.active(D()) ? addDeckLayer(res, D(), Engine, src, cfg.colourBase) : res;
      rgb = Blend.preview(Engine, withDeck, src, state.blend);
    } else if (hasDeck) { applyDeckPreview(rgb, res, D(), Engine, src, state.view.bg, cfg.colourBase); }
    lastShown = { rgb, w: res.w, h: res.h, before: cfg.split ? IM.composite({ w: res.w, h: res.h, layers: [], overSource: true }, { type: state.view.bg }, src) : null };
    paintPreview();
    sizePreview(res.w, res.h);
    if (cfg.ui3) {
      // remember the whole picture for the navigator and the zoom maths
      fitDims = { W: Math.max(1, Math.round(src.w / scale)), H: Math.max(1, Math.round(src.h / scale)) };
      navThumb = { rgb: lastShown.before || rgb, w: res.w, h: res.h };
      showZoom();
      paintLookBar();
    }
    else if (refs.scr) { refs.scrL.textContent = "CH1  " + String(cfg.groupLabel ? cfg.groupLabel(state, presetName) : presetName).toUpperCase(); refs.scrR.textContent = res.w + " x " + res.h + " PX"; }
    setStatus("Preview " + res.w + " x " + res.h + " in " + (Date.now() - t0) + " ms  |  " + res.layers.length + " layer" + (res.layers.length === 1 ? "" : "s"));
  }

  // Before/After split (cfg.split, Mobglow 2.0): left of the divider is the untouched
  // picture, right is the result. Dragging on the preview moves the divider without a re-render.
  let lastShown = null;
  function paintPreview() {
    const L = lastShown;
    if (!L) return;
    const pos = cfg.split ? (state.view.split || 0) : 0;
    refs.preview.src = PNG.dataURL(QW.splitRGB(L.rgb, L.before, L.w, L.h, pos), L.w, L.h, 3);
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
    let maxH = layout ? layout.previewMaxHeight() : Infinity;
    if (cfg.ui3 && layout) {
      // rule 10: pinned zones (header, preview, effects bar, footer) take at most 50% of the panel
      const H = (document.getElementById("app") || {}).clientHeight || 820;
      const imgH = refs.preview.clientHeight || 0;
      const fixed = (layout.pinned.clientHeight || 0) - imgH + (layout.footer ? layout.footer.clientHeight || 0 : 0);
      maxH = Math.max(90, Math.min(Math.round(H * 0.38), Math.round(H * 0.5 - fixed)));
      if (userPrevH) maxH = Math.max(90, Math.min(maxH, userPrevH));
    }
    const dw = Math.max(1, Math.floor(Math.min(avail, w, maxH * w / h))), dh = Math.max(1, Math.round(h * dw / w));
    refs.preview.style.width = dw + "px";
    refs.preview.style.height = dh + "px";
    refs.preview.style.maxWidth = "none";
    refs.preview.style.flexShrink = "0";
  }
  function refitPreview(force) { if (previewWH && refs.previewBox && (force === true || (refs.previewBox.clientWidth || 0) !== fitW)) { if (cfg.ui3 && zoom !== null) schedulePreview(60); else sizePreview(previewWH[0], previewWH[1]); } }
  try { window.addEventListener("resize", refitPreview); } catch (e) { /* host without resize events */ }


  // ---- Brew 3.0 preview zoom and pan (shared/zoom.js; spec "Preview zoom and pan")
  const Z = require("./zoom.js");
  let zoom = null, zc = { x: 0.5, y: 0.5 }, gridOn = false, fitDims = null, navThumb = null, lastRect = null, demoFull = null, userPrevH = 0;
  function boxSize() {
    const bw = Math.max(60, boxInner());
    let bh = 260;
    if (layout) {
      const H = (document.getElementById("app") || {}).clientHeight || 820;
      const imgH = refs.preview.clientHeight || 0;
      const fixed = (layout.pinned.clientHeight || 0) - imgH + (layout.footer ? layout.footer.clientHeight || 0 : 0);
      bh = Math.max(90, Math.min(Math.round(H * 0.38), Math.round(H * 0.5 - fixed)));
      if (userPrevH) bh = Math.max(90, Math.min(bh, userPrevH));
    }
    return { bw, bh };
  }
  function dims() {
    if (fitDims) return fitDims;
    const doc = PS.activeDoc();
    if (doc) { const i = PS.docInfo(doc); return { W: i.w, H: i.h }; }
    return { W: state.view.size, H: Math.round(state.view.size * 0.75) };
  }
  function zoomNow() {
    const { W, H } = dims(), { bw, bh } = boxSize();
    if (zoom === null) return Math.min(1, Z.fitZoom(W, H, bw, bh), state.view.size / Math.max(W, H));
    if (zoom === "fill") return Z.fillZoom(W, H, bw, bh);
    return zoom;
  }
  function setZoom(z, at) {
    if (z === "fit" || z === null) { zoom = null; zc = { x: 0.5, y: 0.5 }; }
    else {
      if (z !== "fill") { z = Z.clampZ(z); const { W, H } = dims(), { bw, bh } = boxSize(); if (z <= Z.fitZoom(W, H, bw, bh) + 1e-6) { setZoom(null); return; } }
      if (at) zc = at;
      zoom = z;
    }
    showZoom();
    schedulePreview(0);
  }
  function showZoom() {
    if (!refs.zoomBox) return;
    refs.zoomBox.draw(Z.pctText(zoomNow()), false);
    if (refs.nav) refs.nav.style.display = zoom === null ? "none" : "";
    if (refs.gridBtn) { if (gridOn) refs.gridBtn.classList.add("on"); else refs.gridBtn.classList.remove("on"); }
    if (refs.fitBtn) { if (zoom === null) refs.fitBtn.classList.add("on"); else refs.fitBtn.classList.remove("on"); }
    if (refs.oneBtn) { if (zoom === 1) refs.oneBtn.classList.add("on"); else refs.oneBtn.classList.remove("on"); }
  }
  function resizeNearest(src, w, h) {
    const c = src.c || 4, out = new Uint8Array(w * h * c);
    for (let y = 0; y < h; y++) { const sy = Math.min(src.h - 1, Math.floor(y * src.h / h)); for (let x = 0; x < w; x++) { const sx = Math.min(src.w - 1, Math.floor(x * src.w / w)); out.set(src.data.subarray((sy * src.w + sx) * c, (sy * src.w + sx) * c + c), (y * w + x) * c); } }
    return { w, h, c, data: out };
  }
  async function previewZoomed(t0) {
    const z = zoomNow(), { W, H } = dims(), { bw, bh } = boxSize();
    const R = Z.region(W, H, z, bw, bh, zc.x, zc.y);
    zc = { x: R.cx, y: R.cy }; lastRect = R;
    const s = Math.min(1, z);
    let src, scale;
    const doc = PS.activeDoc();
    if (doc) {
      const target = (state.out.source !== "flat") ? tryLayerTarget(doc) : { kind: "flat" };
      const r = await PS.readSource(doc, target, { kind: "region", rect: R, scale: s });
      src = r.src; scale = r.scale;
      if (cfg.prepareSource) { try { await cfg.prepareSource(doc, r, "preview"); } catch (e) { console.error(e); } }
    } else {
      if (!demoFull || demoFull.w !== W || demoFull.h !== H) demoFull = Engine.demoImage(W, H);
      src = Z.crop(demoFull, R);
      if (s < 1) src = resizeNearest(src, Math.max(1, Math.round(R.w * s)), Math.max(1, Math.round(R.h * s)));
      scale = src.w / R.w;
    }
    const res = await Engine.render(toneSrc(src, state), engineState({ scale, fullH: H, fullW: W }), { yield: tick });
    let rgb = Engine.composite(res, { type: state.view.bg }, src);
    if (hasDeck) applyDeckPreview(rgb, res, D(), Engine, src, state.view.bg, cfg.colourBase);
    let before = cfg.split ? IM.composite({ w: res.w, h: res.h, layers: [], overSource: true }, { type: state.view.bg }, src) : null;
    let ow = res.w, oh = res.h;
    if (z > 1) {
      ow = R.vw; oh = R.vh;
      rgb = Z.enlarge(rgb, res.w, res.h, ow, oh);
      if (before) before = Z.enlarge(before, res.w, res.h, ow, oh);
      if (gridOn && z >= 8) { Z.drawGrid(rgb, ow, oh, res.w, res.h); if (before) Z.drawGrid(before, ow, oh, res.w, res.h); }
    }
    lastShown = { rgb, w: ow, h: oh, before };
    paintPreview();
    refs.preview.style.width = R.vw + "px"; refs.preview.style.height = R.vh + "px";
    refs.preview.style.maxWidth = "none"; refs.preview.style.flexShrink = "0";
    if (refs.nav && navThumb) {
      const t = navThumb;
      refs.nav.src = PNG.dataURL(Z.navigator(t.rgb, t.w, t.h, R, W, H), t.w, t.h, 3);
      const nw = 84; refs.nav.style.width = nw + "px"; refs.nav.style.height = Math.round(nw * t.h / t.w) + "px";
    }
    showZoom();
    paintLookBar();
    setStatus("Preview " + Z.pctText(z) + "% (" + R.w + " x " + R.h + " px of " + W + " x " + H + ") in " + (Date.now() - t0) + " ms");
  }
  // where a press on the preview lands in document pixels (0..1)
  function docPoint(e) {
    const { u, v } = previewXY(e);
    if (zoom === null || !lastRect) return { x: u, y: v };
    const { W, H } = dims();
    return { x: (lastRect.l + u * lastRect.w) / W, y: (lastRect.t + v * lastRect.h) / H };
  }
  function wireZoomPointer() {
    const img = refs.preview;
    let d = null, lastUp = 0;
    const nearSplit = (e) => {
      if (!cfg.split || !state.view.split) return false;
      const { u } = previewXY(e); let w = 300;
      try { w = img.getBoundingClientRect().width || 300; } catch (err) { /* no layout */ }
      return Math.abs(u * 100 - state.view.split) * w / 100 < 10;
    };
    img.addEventListener("mousedown", (e) => {
      const at = previewXY(e);
      for (const f of previewClickers) { try { if (f(at, e)) return; } catch (err) { console.error(err); } }
      d = { x: e.clientX, y: e.clientY, split: nearSplit(e), zc: Object.assign({}, zc), moved: false, alt: e.altKey };
      if (e.preventDefault) e.preventDefault();
    });
    const move = (e) => {
      if (!d) return;
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 3) d.moved = true;
      if (!d.moved) return;
      if (d.split) { state.view.split = Math.max(1, Math.min(99, Math.round(previewXY(e).u * 100))); paintPreview(); return; }
      if (zoom === null || !lastRect) return;
      const { W, H } = dims(), z = zoomNow();
      zc = { x: d.zc.x - (e.clientX - d.x) / (z * W), y: d.zc.y - (e.clientY - d.y) / (z * H) };
      schedulePreview(40);
    };
    const up = (e) => {
      if (!d) return;
      const was = d; d = null;
      if (was.moved) return;
      const t = Date.now(), dbl = t - lastUp < 350; lastUp = dbl ? 0 : t;
      if (dbl) { setZoom(null); return; }
      const p = docPoint(e), z = zoomNow();
      setZoom(was.alt || e.altKey ? Z.step(z, -1) : Z.step(z, 1), p);
    };
    img.addEventListener("mousemove", move);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    img.addEventListener("dblclick", () => setZoom(null));
    // keys while the pointer is over the preview: + / - zoom, 0 = Fit, 1 = 100%
    let over = false;
    refs.previewBox.addEventListener("mouseover", () => { over = true; });
    refs.previewBox.addEventListener("mouseout", (e) => { const to = e.relatedTarget; if (!to || !refs.previewBox.contains(to)) over = false; });
    document.addEventListener("keydown", (e) => {
      if (!over) return;
      const a = document.activeElement;
      if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA")) return;
      const k = e.key;
      if (k === "+" || k === "=") setZoom(Z.step(zoomNow(), 1));
      else if (k === "-" || k === "_") setZoom(Z.step(zoomNow(), -1));
      else if (k === "0") setZoom(null);
      else if (k === "1") setZoom(1);
    });
  }
  // zoom toolbar: Fit, 1:1, -, % box (LCD, type 5-3200, click for presets, drag the label), +, pixel grid
  function zoomBar() {
    const H = ui.helpAt;
    const b = (txt, key, name, fn, cls) => { const n = el("button", { class: "tbtn" + (cls ? " " + cls : ""), text: txt }); n.addEventListener("click", fn); H(n, { key, name, kind: "button" }); return n; };
    refs.fitBtn = b("Fit", "zoom.fit", "Fit", () => setZoom(null));
    refs.oneBtn = b("1:1", "zoom.one", "100%", () => setZoom(1));
    const minus = b("-", "zoom.out", "Zoom out", () => setZoom(Z.step(zoomNow(), -1)), "zstep");
    const plus = b("+", "zoom.in", "Zoom in", () => setZoom(Z.step(zoomNow(), 1)), "zstep");
    refs.gridBtn = b("Grid", "zoom.grid", "Pixel grid", () => { gridOn = !gridOn; showZoom(); if (zoomNow() >= 8) schedulePreview(0); });
    const vb = ui.brand.valueBox({ cls: "zbox" });
    refs.zoomBox = vb;
    const lab = el("div", { class: "dlabel scrub zlab", text: "%" });
    const commit = () => { vb.input.__typing = false; const v = require("./controls.js").evalBox(vb.input.value, zoomNow() * 100); if (v != null) setZoom(v / 100); else showZoom(); };
    vb.input.addEventListener("keydown", (e) => { const k = e.key || e.code; if (k === "Enter" || e.keyCode === 13) commit(); else if (k !== "Tab") vb.input.__typing = true; });
    vb.input.addEventListener("change", commit);
    vb.input.addEventListener("blur", () => { if (vb.input.__typing) commit(); });
    // click the box: preset list
    const list = el("div", { class: "zlist" }, Z.PRESETS.map(([l, v]) => { const n = el("div", { class: "zitem", text: l }); n.addEventListener("mousedown", (e) => { setZoom(v); list.style.display = "none"; if (e.stopPropagation) e.stopPropagation(); }); return n; }));
    list.style.display = "none";
    vb.node.addEventListener("mousedown", () => { list.style.display = list.style.display === "none" ? "" : "none"; });
    document.addEventListener("mousedown", (e) => { if (!vb.node.contains(e.target) && !list.contains(e.target)) list.style.display = "none"; });
    // drag the % label to scrub the zoom
    let sd = null;
    const smove = (e) => { if (sd) setZoom(Z.clampZ(sd.z * Math.pow(2, (e.clientX - sd.x) / 60))); };
    const sup = () => { sd = null; document.removeEventListener("mousemove", smove); document.removeEventListener("mouseup", sup); };
    lab.addEventListener("mousedown", (e) => { sd = { x: e.clientX, z: zoomNow() }; document.addEventListener("mousemove", smove); document.addEventListener("mouseup", sup); if (e.preventDefault) e.preventDefault(); });
    const wrap = el("div", { class: "zwrap" }, [vb.node, list]);
    H(wrap, { key: "zoom.pct", name: "Zoom", kind: "info", min: 5, max: 3200, unit: "%" });
    H(lab, { key: "zoom.pct", name: "Zoom", kind: "info" });
    return el("div", { class: "ptools zbar" }, [refs.fitBtn, refs.oneBtn, minus, wrap, lab, plus, refs.gridBtn]);
  }
  // drag the bottom edge of the preview bezel to make it taller or shorter (still within rule 10)
  function bezelHandle() {
    const h = el("div", { class: "bezel" });
    let d = null;
    const mv = (e) => { if (!d) return; userPrevH = Math.max(90, d.h + (e.clientY - d.y)); refitPreview(true); };
    const upf = () => { if (!d) return; d = null; document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", upf); schedulePreview(0); };
    h.addEventListener("mousedown", (e) => { d = { y: e.clientY, h: boxSize().bh }; document.addEventListener("mousemove", mv); document.addEventListener("mouseup", upf); if (e.preventDefault) e.preventDefault(); });
    ui.helpAt(h, { key: "zoom.bezel", name: "Preview height", kind: "info" });
    return h;
  }

  // ---- apply
  let working = false, cancelReq = false;
  // error prevention (UX-06): with no document the Apply key looks blocked and says why
  function markApplyReady(ok) {
    const b = refs.apply;
    if (!b) return;
    const why = ok ? "Apply to the document as a new layer group (one undo step)" : "Open a document first. The preview is using the demo image.";
    if (ok) b.classList.remove("blocked"); else b.classList.add("blocked");
    // 3.0: no native tooltip (it doubled up with the help pop-up on the Mac); the reason goes in the pop-up
    if (cfg.ui3) { b.removeAttribute("title"); if (b.__help) b.__help.note = ok ? "" : why; }
    else b.setAttribute("title", why);
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
        let res = await Engine.render(toneSrc(r.src, state), engineState({ scale: 1, fullH: r.info.h, fullW: r.info.w }), hooks);
        if (hasDeck && Colour.active(D())) { setStatus("Colour Deck..."); res = addDeckLayer(res, D(), Engine, r.src, cfg.colourBase); }
        setStatus("Writing layers...");
        const base = t.kind === "layer" && !t.prev ? (t.layer.name + " - ") : "";
        const tag = cfg.reEdit ? " #" + newTag() : "";
        const hiddenIds = [];
        const warnings = await PS.writeResult(doc, res, {
          hiddenIds,
          origin: r.origin,
          groupName: base + cfg.title + " - " + (cfg.groupLabel ? cfg.groupLabel(state, presetName) : presetName) + tag,
          hideSource: state.out.hide && !(hasBlend && Blend.active(state.blend)),   // a blended group needs its source visible
          blend: hasBlend ? state.blend : null,
          hideLayers: t.kind === "layer" ? [t.layer] : null,
          placeAbove: t.prev ? t.layer : null
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
    const out = { w: smp.w, h: smp.h, c: 4, data };
    // optional extra input for the sample (Depthtone: its Select Subject mask, 1 byte per pixel, base64)
    if (smp.subject) {
      const m = smp.subject, f = new Float32Array(n); let k = 0;
      const put1 = (v) => { if (k < n) f[k++] = v / 255; };
      for (let i = 0; i + 3 < m.length; i += 4) {
        const q = (T[m.charCodeAt(i)] << 18) | (T[m.charCodeAt(i + 1)] << 12) | (T[m.charCodeAt(i + 2)] << 6) | T[m.charCodeAt(i + 3)];
        put1((q >> 16) & 255); if (m[i + 2] !== "=") put1((q >> 8) & 255); if (m[i + 3] !== "=") put1(q & 255);
      }
      out.subject = f;
    }
    return out;
  }
  function createLookBrowser() {
    const KEY = "brew.looks." + (cfg.storeKey || cfg.appName || cfg.title);
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
        // 3.0: a badge marks looks that need a shape (type, a logo or a subject cut-out)
        const c = el("div", { class: "look", title: (pr.cat ? pr.cat + " - " : "") + pr.name + ": click to load" + (pr.badge === "Shape" ? " (best on type, logos or a Subject cut-out)" : "") }, [img, el("div", { class: "lookname", text: pr.name })].concat(pr.badge ? [el("span", { class: "lookbadge", text: pr.badge })] : []));
        c.addEventListener("click", () => { applyPatch(pr.p, pr.name); mark(); });
        if (ui.helpAt) ui.helpAt(c, { key: "look", name: pr.name, kind: "grid", note: (pr.cat ? "Group: " + pr.cat : "") + (pr.badge === "Shape" ? ". Needs a shape: type, a logo, or Surface > Subject cut-out on photos." : "") });
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
          ensureAutoTone(P, o.pr.p);
          const res = await Engine.render(toneSrc(src, P), P, { yield: tick });
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
    // settings a tool asks to keep across looks (e.g. Depthtone's depth source and layer)
    const path = (o, k) => k.split(".").reduce((a, b) => (a == null ? a : a[b]), o);
    const kept = (cfg.keepOnLook || []).map((k) => [k, clone({ v: path(state, k) }).v]);
    state = merge(DEFAULTS, p);
    ensureAutoTone(state, p);
    state.out = keepOut; state.view = keepView;
    for (const [k, v] of kept) {
      if (v === undefined || path(p, k) !== undefined) continue;
      const ks = k.split("."), last = ks.pop(), host = ks.reduce((a, b) => (a[b] = a[b] || {}), state);
      host[last] = v;
    }
    if (hasDeck) state.deck = p && p.deck ? Colour.normalize(p.deck) : keepColour;   // looks without colour keep the current deck
    setOffList(p && p._off);
    presetName = name || "Custom";
    lookBase = clone(state);
    if (cfg.ui3) paintLookBar();
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
      cfg.split && ui.brand ? el("div", { class: "row" }, [refs.splitSw = ui.brand.miniToggle("Before / After", !!state.view.split, (v) => { state.view.split = v ? 50 : 0; paintPreview(); }, "Split the preview: original on the left, result on the right. Drag on the preview to move the line.")]) : null,
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
      root.appendChild(el("div", { class: "foot", text: cfg.footer || (cfg.title + " 1.0  -  " + Brand.SUITE) }));
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
    addSection("D", "OUTPUT", "output", by.output.concat(hasBlend ? [Blend.card(ui, () => state)] : []).concat([card("Output", [
      selectRow("Source", "out.source", [{ v: "flat", l: "Flattened document" }, { v: "layer", l: "Active layer" }, { v: "each", l: "Each selected layer (batch)" }], () => { confirmArmed = false; })
    ].concat(cfg.outputRows ? cfg.outputRows(ui, kit) : []).concat([
      checkRow("Hide source artwork afterwards", "out.hide"),
      refs.meter ? refs.meter.node : null,
      refs.apply,
      cfg.reEdit ? (() => { const b = el("button", { class: "btn small reedit", text: "Re-edit selected group", title: "Load the settings of a group this tool made" }); b.addEventListener("click", () => { reEditNow().catch((e) => setStatus("Re-edit failed: " + e.message, true)); }); return b; })() : null,
      el("div", { class: "hint", text: "Creates a layer group; your artwork is never changed. One undo step." })
    ]))]));
    if (ui.brand) top.appendChild(ui.jumpStrip(secs, layout.scroller));
    root.appendChild(el("div", { class: "foot", text: cfg.footer || (cfg.title + " 1.0  -  " + Brand.SUITE) }));
    refreshAll();
    if (lookBrowser) lookBrowser.start();
  }


  // ---- Brew 3.0 build (spec "Panel layout"): seven zones in a fixed order.
  //   pinned: 1 rack header, 2 preview, 3 look bar (on the preview strip), 4 effects bar
  //   scroll: 5 active effect controls (+ folded Advanced), 6 shared cards (Colour, Looks, Output)
  //   pinned: 7 Apply footer (status, render meter, Apply / Cancel)
  const PF = require("./pixfont.js");
  function paintLookBar() {
    if (!refs.lookName) return;
    const n = String(cfg.groupLabel ? cfg.groupLabel(state, presetName) : presetName).toUpperCase();
    PF.paint(refs.lookName, n.length > 22 ? n.slice(0, 21) + "." : n, { font: "label", color: cfg.glow || "#5cf2ff" });
    if (lookBrowser) lookBrowser.sourceChanged();
  }
  function stepLook(dir) {
    if (!PRESETS.length) return;
    let i = PRESETS.findIndex((p) => p.name === presetName);
    i = i < 0 ? (dir > 0 ? 0 : PRESETS.length - 1) : (i + dir + PRESETS.length) % PRESETS.length;
    applyPatch(PRESETS[i].p, PRESETS[i].name);
  }
  function scrollToNode(n) {
    const sc = layout.scroller;
    try {
      const top = n.getBoundingClientRect().top - sc.getBoundingClientRect().top;
      sc.scrollTop = Math.max(0, sc.scrollTop + top - 2);
      setTimeout(() => { sc.scrollTop += 1; setTimeout(() => { sc.scrollTop -= 1; }, 40); }, 40);   // UXP hit-test re-sync
    } catch (e) { /* no layout */ }
  }
  function build3(root) {
    clear(root);
    layout = splitLayout(root, el, { footer: true });
    root.classList.add("brand-console", "arcade", "ui3");
    const top = layout.pinned, H = ui.helpAt;
    // 1. rack header (32 px) with the Assistance switch beside the status LED
    const h = ui.brand.header(cfg);
    h.node.classList.add("slim");
    refs.led = h;
    top.appendChild(h.node);
    // 2 + 3. preview with the look bar on its strip
    refs.docline = el("div", { class: "docline", text: "" });
    refs.preview = el("img", { class: "preview" });
    const prev = el("button", { class: "lookbtn", text: "◀" }), next = el("button", { class: "lookbtn", text: "▶" });
    prev.addEventListener("click", () => stepLook(-1)); next.addEventListener("click", () => stepLook(1));
    refs.lookName = el("span", { class: "lookname3" });
    const browse = el("button", { class: "lookbtn browse", text: "BROWSE" });
    browse.addEventListener("click", () => { if (refs.lookCard) { const i = refs.lookCard.__card; if (i && i.setOpen) i.setOpen(true, true); scrollToNode(refs.lookCard); } });
    H(prev, { key: "look.prev", name: "Previous look", kind: "button" });
    H(next, { key: "look.next", name: "Next look", kind: "button" });
    H(refs.lookName, { key: "look.name", name: "Look", kind: "info" });
    H(browse, { key: "look.browse", name: "Browse looks", kind: "button" });
    refs.scr = el("div", { class: "scrstrip lookbar" }, [el("span", { class: "lbl2 ch", text: "CH1" }), prev, refs.lookName, next, el("span", { class: "grow" }), browse]);
    refs.nav = el("img", { class: "navmap" });
    refs.nav.style.display = "none";
    H(refs.nav, { key: "zoom.nav", name: "Navigator", kind: "info" });
    refs.nav.addEventListener("mousedown", (e) => {
      const go = (ev) => { let r = null; try { r = refs.nav.getBoundingClientRect(); } catch (err) { r = null; } if (!r || !r.width) return; zc = { x: Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height)) }; schedulePreview(30); };
      go(e);
      const up = () => { document.removeEventListener("mousemove", go); document.removeEventListener("mouseup", up); };
      document.addEventListener("mousemove", go); document.addEventListener("mouseup", up);
      if (e.stopPropagation) e.stopPropagation(); if (e.preventDefault) e.preventDefault();
    });
    refs.previewBox = el("div", { class: "previewbox" }, [refs.scr, el("div", { class: "pstage" }, [refs.preview, refs.nav]), bezelHandle()]);
    H(refs.previewBox, { key: "preview", name: "Preview", kind: "preview" });
    refs.previewBox.addEventListener("mouseover", refitPreview);
    wireZoomPointer();
    const splitBtn = el("button", { class: "tbtn", text: "Split" });
    const paintSplit = () => { if (state.view.split) splitBtn.classList.add("on"); else splitBtn.classList.remove("on"); };
    splitBtn.addEventListener("click", () => { state.view.split = state.view.split ? 0 : 50; paintSplit(); paintPreview(); });
    refs.splitSw = { __sw: { set: (v) => { state.view.split = v ? 50 : 0; paintSplit(); paintPreview(); }, get: () => !!state.view.split } };
    H(splitBtn, { key: "view.split", name: "Before / After", kind: "switch" });
    paintSplit();
    const refresh = el("button", { class: "tbtn icon", text: "\u21bb" });
    refresh.addEventListener("click", () => schedulePreview(0));
    H(refresh, { key: "view.refresh", name: "Refresh", kind: "button" });
    // background behind transparent parts: one button that cycles Checker / White / Black
    const BG = [["checker", "Chk"], ["white", "Wht"], ["black", "Blk"]];
    const bgBtn = el("button", { class: "tbtn bgbtn", text: "BG" });
    const paintBg = () => { const b = BG.find((x) => x[0] === state.view.bg) || BG[2]; bgBtn.textContent = "BG " + b[1]; };
    bgBtn.addEventListener("click", () => { const i = BG.findIndex((x) => x[0] === state.view.bg); state.view.bg = BG[(i + 1) % BG.length][0]; paintBg(); touch(); });
    bind(paintBg);
    H(bgBtn, { key: "view.bg", name: "Background", kind: "button" });
    refs.docline.classList.add("inline");
    refs.previewTools = el("div", { class: "ptools" }, [splitBtn, bgBtn, refresh, refs.docline]);
    top.appendChild(el("div", { class: "pzone" }, [refs.previewBox, zoomBar(), refs.previewTools]));

    // tool cards
    const kit = { gradientEditor, colourRow, touch, setStatus, schedulePreview, loop, get state() { return state; },
      applyNow: () => applyNow(), io: PS, onPreviewPress: (f) => previewClickers.push(f),
      get source() { return lastSrc; }, get presetName() { return presetName; }, ui3: true };
    const sc = layout.scroller;
    lib = createLibrary(ui, {
      builtins: PRESETS,
      applyPatch: (p) => { const hit = PRESETS.find((x) => x.p === p); applyPatch(p, hit ? hit.name : "Custom"); },
      getSaveable: stateForSave, io: PS, setStatus
    });
    const toolCards = cfg.cards(ui, kit).filter(Boolean);
    toolCards.forEach((c) => { const i = c.__card; if (i && i.opts && i.opts.bypass) bypassMaps[i.title] = i.opts.bypass; });
    const by = { look: [], controls: [], colour: [], output: [] };
    toolCards.forEach((c) => (by[sectionOf(c)] || by.controls).push(c));
    refs.sections = by;

    // 4. effects bar (pinned): one tab per effect + the small section menu
    const fx = ui.tabs(by.controls, { title: "Effects", isOn: fxOn, setOn: setFxOn, split: true });
    refs.fxTabs = fx.api;
    const secs = [];
    const secBar = (name, id) => { const n = ui.section(name[0], name, id); secs.push({ letter: name[0], name, id, node: n }); return n; };
    // 5. active effect controls
    sc.appendChild(secBar("EFFECT", "controls"));
    sc.appendChild(fx.panes);
    // 6. shared cards
    if (hasDeck) { deck = createColourDeck(ui, { getC: D, touch, getSource: () => lastSrc, io: PS, setStatus, v3: true, inkTool: cfg.inkTool }); by.colour.push(deck.card); }
    if (by.colour.length) { sc.appendChild(secBar("COLOUR", "colour")); by.colour.forEach((c) => sc.appendChild(c)); }
    sc.appendChild(secBar("LOOKS", "look"));
    if (PRESETS.length) { lookBrowser = createLookBrowser(); refs.lookCard = lookBrowser.card; sc.appendChild(lookBrowser.card); }
    sc.appendChild(lib.card);
    by.look.forEach((c) => sc.appendChild(c));
    sc.appendChild(secBar("OUTPUT", "output"));
    by.output.forEach((c) => sc.appendChild(c));
    if (AT) {
      const amt = ui.fader("Amount", "autoTone.amount", 0, 100, 1, "%");
      ui.showIf(amt, () => !!(state.autoTone && state.autoTone.on));
      sc.appendChild(card("Auto Tone", [ui.checkRow("Auto Tone", "autoTone.on"), amt]));
    }
    if (hasBlend) sc.appendChild(Blend.card(ui, () => state));   // spec zone 6: Blend card above Output
    sc.appendChild(card("Output", [
      selectRow("Source", "out.source", [{ v: "flat", l: "Flattened document" }, { v: "layer", l: "Active layer" }, { v: "each", l: "Each selected layer (batch)" }, { v: "prev", l: "Previous Lab result (chain)" }], () => { confirmArmed = false; })
    ].concat(cfg.outputRows ? cfg.outputRows(ui, kit) : []).concat([
      checkRow("Hide source artwork afterwards", "out.hide"),
      cfg.reEdit ? (() => { const b = el("button", { class: "btn small reedit", text: "Re-edit selected group" }); b.addEventListener("click", () => { reEditNow().catch((e) => setStatus("Re-edit failed: " + e.message, true)); }); H(b, { key: "out.reedit", name: "Re-edit selected group", kind: "button" }); return b; })() : null,
      el("div", { class: "hint", text: "Apply makes one new layer group; your artwork is never changed. One undo step." })
    ])));
    sc.appendChild(el("div", { class: "foot", text: cfg.footer || (cfg.title + "  -  " + Brand.SUITE) }));
    // the section menu sits at the end of the effects row: GO opens a short list of sections
    const jump = ui.jumpStrip(secs, sc);
    jump.classList.add("secmenu");
    jump.style.display = "none";
    const go = el("div", { class: "tabbtn gobtn", role: "button", text: "GO" });
    go.addEventListener("click", (e) => { jump.style.display = jump.style.display === "none" ? "" : "none"; if (e.stopPropagation) e.stopPropagation(); });
    jump.addEventListener("click", () => { jump.style.display = "none"; });
    try { document.addEventListener("mousedown", (e) => { if (!go.contains(e.target) && !jump.contains(e.target)) jump.style.display = "none"; }); } catch (e) { /* no document */ }
    H(go, { key: "secmenu", name: "Go to section", kind: "button" });
    // 3.0 button rule: the effect buttons have their own bar; GO sits on a header strip above it
    const fxhead = el("div", { class: "fxhead" }, [el("span", { class: "fxlbl", text: "EFFECTS" }), el("span", { class: "grow" }), go]);
    top.appendChild(el("div", { class: "fxzone" }, [fxhead, fx.bar, jump]));

    // 7. Apply footer (pinned)
    refs.status = el("div", { class: "status", text: "Starting..." });
    refs.apply = el("button", { class: "apply", text: cfg.applyLabel || "Apply to document" });
    let applyDown = false, skipClick = false, skipT = null;
    refs.apply.addEventListener("mousedown", () => { applyDown = true; });
    refs.apply.addEventListener("mouseleave", () => { applyDown = false; });
    refs.apply.addEventListener("mouseup", () => {
      if (!applyDown || refs.apply.hasAttribute("disabled")) return;
      applyDown = false;
      skipClick = true; clearTimeout(skipT); skipT = setTimeout(() => { skipClick = false; }, 500);
      applyNow();
    });
    refs.apply.addEventListener("click", () => { applyDown = false; if (skipClick) { skipClick = false; return; } applyNow(); });
    H(refs.apply, { key: "apply", name: "Apply", kind: "button" });
    H(refs.status, { key: "status", name: "Status line", kind: "info" });
    refs.meter = ui.brand.meter(12);
    layout.footer.appendChild(refs.status);
    layout.footer.appendChild(el("div", { class: "applyrow" }, [refs.meter.node, refs.apply]));
    ui.sweep(root);
    ui.evenRows(root);
    refreshAll();
    if (lookBrowser) lookBrowser.start();
    paintLookBar();
  }

  function menuAction(id) {
    if (id === "resetLook") {
      const keepOut = clone(state.out), keepView = clone(state.view);
      state = clone(lookBase); state.out = keepOut; state.view = keepView;
      touch(); setStatus("Knobs reset to " + presetName + ".");
    }
    else if (id === "split") { if (refs.splitSw) refs.splitSw.__sw.set(!state.view.split); else { state.view.split = state.view.split ? 0 : 50; paintPreview(); } }
    else if (id === "foldAll") { if (ui.foldAll) ui.foldAll(!ui.anyOpen()); }
    else if (id === "assist") { if (ui.help) ui.help.setOn(!ui.help.on); setStatus("Assistance (help bubbles) " + (ui.help && ui.help.on ? "on." : "off.")); }
    else if (/^delay(\d+)$/.test(id)) { if (ui.help) ui.help.setDelay(+id.slice(5)); setStatus("Help pop-ups after " + id.slice(5) + " s."); }
    else if (id === "auto") { auto = !auto; if (auto) schedulePreview(0); setStatus("Auto-update " + (auto ? "on." : "off: press Refresh.")); }
    else if (id === "about") setStatus(cfg.title + " " + (cfg.version || "") + "  |  " + (cfg.code || "") + "  |  " + Brand.SUITE + ". Hover any control for help.");
  }
  async function init() {
    if (built) return;
    built = true;
    (cfg.ui3 ? build3 : build)(document.getElementById("app"));
    await lib.load();
    if (deck) await deck.load();
    schedulePreview(100);
    // 3.0: re-preview when a document opens, closes or is switched (Mac test 2026-11-24: a panel
    // opened before the document kept showing the demo image until Refresh)
    if (cfg.ui3) {
      try {
        require("photoshop").action.addNotificationListener(["open", "close", "select", "newDocument"], (ev, d) => {
          if (ev === "select" && !(d && d._target && JSON.stringify(d._target).includes("document"))) return;
          schedulePreview(250);
        });
      } catch (e) { /* host without notifications (tests) */ }
    }
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
        cfg.ui3 ? "-" : null,
        cfg.ui3 ? { id: "assist", label: "Assistance (help bubbles) on / off" } : null,
        cfg.ui3 ? { id: "delay2", label: "Help pop-up after 2 s" } : null,
        cfg.ui3 ? { id: "delay5", label: "Help pop-up after 5 s" } : null,
        cfg.ui3 ? { id: "delay10", label: "Help pop-up after 10 s" } : null,
        cfg.ui3 ? { id: "auto", label: "Auto-update preview on / off" } : null,
        "-",
        { id: "about", label: "About " + cfg.title }
      ].filter(Boolean),
      invokeMenu(id) { menuAction(id); }
    };
    entrypoints.setup({ panels });
  } catch (e) { /* older hosts: fall through to direct init */ }
  setTimeout(() => { init(); }, 0);

  return { _test: { ui, setZoom, get zoom() { return zoom; }, zoomNow: () => zoomNow(), get zc() { return zc; }, get layout() { return layout; }, stepLook, get presetName() { return presetName; }, get state() { return state; }, set state(v) { state = v; }, applyNow, reEditNow, applyPatch: (p, n) => applyPatch(p, n), runPreview: () => loop.run(), init, refs, touch, menuAction, plainError, get lookBase() { return lookBase; }, get lookBrowser() { return lookBrowser; } } };
}

module.exports = { createToolPanel };
