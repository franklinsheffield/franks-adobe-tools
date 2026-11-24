"use strict";
// ======================================================================
// Frank's Dithers Brew - panel UI
// ======================================================================
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone, normAscii } = require("./js/state.js");
const ASCII3 = require("./js/ascii3.js");
const { PALETTES, TONEMAPS } = require("./js/palettes.js");
const ASCII = require("./js/ascii.js");
// shared suite core (synced from /shared by tools/sync-core.js)
const PNG = require("./core/png.js");
const PS = require("./core/ps-io.js");
const { createUI, getPath } = require("./core/ui.js");
const QW = require("./core/quickwins.js");
const IM = require("./core/imgmath.js");
const { createPreviewLoop, tick } = require("./core/preview.js");
const { splitLayout } = require("./core/layout.js");
const { createLibrary } = require("./core/library.js");
const Colour = require("./core/colour.js");
const Blend = require("./core/blend.js");
const { createColourDeck, applyDeckPreview, addDeckLayer, recolourInks } = require("./core/colourdeck.js");

PS.configure({ appName: "Frank's Dithers Brew", presetFile: "presets.json", exportName: "franks-brew-presets.json" });

if (!DEFAULTS.blend) DEFAULTS.blend = clone(Blend.DEFAULT);   // Blending (all plugins), saved with the look
let state = normAscii(clone(DEFAULTS));
// values of the look loaded last: double-clicking a knob goes back to them (quick win ID-02)
let lookBase = clone(state);
let docCache = { ppi: 300, name: "", w: 0, h: 0, demo: true };
let lastSrc = null;
let auto = true;
let built = false;
let confirmArmed = false;
let lib = null;
let quickNext = false;     // next preview is a fast half-size frame (slider being dragged)
let lastScale = 1, lastPpi = 300;
let deck = null;
// Colour Deck state (shared suite colour control); states set from outside may lack it
const D = () => (state.deck && typeof state.deck === "object" ? state.deck : (state.deck = Colour.normalize(state.deck)));
// ink layers recoloured, or one Colour Deck layer read from the print on white paper
function withDeck(res) {
  const C = D();
  if (!Colour.active(C)) return res;
  // ASCII 3.0 Glyph colour "Colour Deck": the deck recolours the glyph ink layers
  const inks = C.inks || (state.engine === "ascii" && state.ascii && state.ascii.glyph === "deck");
  return inks ? recolourInks(res, C) : addDeckLayer(res, C, Engine, null, "white");
}

const refs = {};
const ui = createUI({ getState: () => state, onChange: () => touch(), pickColor: (hex) => PS.pickColor(hex), brand: "console", glow: "#ff9f1c", onLive: () => liveFrame(), storeKey: "Frank's Dithers Brew",
  getDefault: (path) => getPath(lookBase, path), onSelect: (i) => { if (refs.keys) refs.keys.textContent = i ? QW.keysFor(i) : KEYS_IDLE; } });
const KEYS_IDLE = QW.keysIdle("");
const { el, clear, bind, showIf, refreshAll, row, sliderRow, selectRow, checkRow, segGroup, pill, textRow, numInput, hexField, card } = ui;

// ---------------------------------------------------------------- helpers
// Image card: editing any of its values switches the adjustments on (loading a look does not)
let preSig = "";
const preKey = () => { const p = Object.assign({}, state.fx.pre); delete p.on; return JSON.stringify(p); };
function touch() {
  if (!state.blend) state.blend = clone(Blend.DEFAULT);   // older saved looks have no blend
  quickNext = false;
  const k = preKey();
  if (k !== preSig) { if (preSig && !state.fx.pre.on) state.fx.pre.on = true; preSig = k; }
  refreshAll(); updateInfo(); if (auto) schedulePreview(150);
}
function liveFrame() {
  if (!auto || !lastSrc) return;
  const k = preKey();
  if (k !== preSig && !state.fx.pre.on) state.fx.pre.on = true;
  quickNext = true;
  if (!loop.rendering) loop.schedule(0); else loop.run();
}
const effPpi = (ppi) => (state.out.dpi > 0 ? state.out.dpi : ppi);

// live drag: a slider being held renders a fast half-size frame from the cached source
function onDragInput(ev) {
  const t = ev.target;
  if (!t || t.tagName !== "INPUT" || t.getAttribute("type") !== "range") return;
  liveFrame();
}
function halfSrc(src) {
  const c = src.c || 4, w2 = Math.max(1, src.w >> 1), h2 = Math.max(1, src.h >> 1), out = new Uint8Array(w2 * h2 * c);
  for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) for (let k = 0; k < c; k++) {
    const a = ((2 * y) * src.w + 2 * x) * c + k, b = a + src.w * c;
    out[(y * w2 + x) * c + k] = (src.data[a] + src.data[a + c] + src.data[b] + src.data[b + c] + 2) >> 2;
  }
  return { w: w2, h: h2, c, data: out };
}


function setStatus(msg, isErr) {
  if (!refs.status) return;
  if (isErr) msg = QW.plainError(msg);
  refs.status.textContent = msg;
  refs.status.className = "status" + (isErr ? " err" : "");
  if (refs.led) refs.led.set(isErr ? "err" : (/^(Rendering|Reading|Writing|Brewing)/.test(msg) ? "busy" : "ready"));
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


// ---------------------------------------------------------------- 1.1 widgets
const curDither = () => Engine.DITHERS.find((d) => d.id === state.algo.dither) || Engine.DITHERS[0];
const isLine = () => state.engine === "dither" && curDither().t === "line";
const lineInfo = () => Engine.LINE_ART.find((l) => l.id === state.algo.dither) || {};

// sphere test image for algorithm thumbnails
function sphereSrc(n) {
  const data = new Uint8Array(n * n * 4), r = n * 0.42, c = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (x - c) / r, dy = (y - c) / r, d2 = dx * dx + dy * dy, i = (y * n + x) * 4;
    let v = 70;
    if (d2 <= 1) { const z = Math.sqrt(1 - d2); v = Math.max(0, Math.min(255, 255 * (0.15 + 0.85 * Math.max(0, -0.45 * dx - 0.55 * dy + 0.7 * z)))); }
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  return { w: n, h: n, c: 4, data };
}
const thumbCache = {};
// ASCII 3.0 algorithm tiles: each one a live sample of that algorithm on the sphere
function asciiTile(id) {
  return () => {
    const key = "a3:" + id;
    if (thumbCache[key] == null) {
      try {
        const N = 64, src = sphereSrc(N), n = N * N, lum = new Uint8Array(n), demand = new Uint8Array(n);
        for (let i = 0; i < n; i++) { const p = i * 4; lum[i] = Math.round(0.299 * src.data[p] + 0.587 * src.data[p + 1] + 0.114 * src.data[p + 2]); demand[i] = 255 - lum[i]; }
        const m = ASCII3.render(demand, N, N, { algo: id, font: "classic", cell: 8, set: "classic", text: id === "weight" ? "O" : "FRANK", seed: 1, lum, edgeAmt: id === "edge" ? 0.7 : 0 });
        const rgb = new Uint8Array(n * 3);
        for (let i = 0; i < n; i++) rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = m[i] ? 10 : 245;
        thumbCache[key] = PNG.dataURL(rgb, N, N, 3);
      } catch (e) { thumbCache[key] = ""; }
    }
    return thumbCache[key];
  };
}
function algoList(engine) {
  if (engine === "halftone") return Engine.SCREENS;
  if (engine === "ascii") return ASCII.ASCII_SETS;
  return Engine.DITHERS;
}
// scrolling strip of rendered thumbnails; click picks the algorithm
function algoStrip() {
  const strip = el("div", { class: "algostrip" });
  let shown = "";
  async function fill(engine) {
    clear(strip);
    const items = algoList(engine), N = 44, src = sphereSrc(N);
    const nodes = items.map((a) => {
      const img = el("img", { class: "thumbimg" });
      const b = el("div", { class: "thumb", title: a.name }, [img]);
      b.addEventListener("click", () => { state.algo[engine] = a.id; touch(); });
      strip.appendChild(b);
      return { a, b, img };
    });
    for (const o of nodes) {
      const key = engine + ":" + o.a.id;
      if (!thumbCache[key]) {
        const P = merge(DEFAULTS, { engine, algo: { [engine]: o.a.id }, mode: "mono", lpi: 30, pixel: engine === "dither" && o.a.id !== "stipple" ? 1 : 1, ascii: { size: 1 }, tune: { spacing: 4 } });
        P.ppi = 300; P.scale = 1; P.view = state.view; P.out = state.out;
        try {
          const res = await Engine.render(src, P, {});
          thumbCache[key] = PNG.dataURL(Engine.composite(res, { type: "white" }), res.w, res.h, 3);
        } catch (e) { thumbCache[key] = ""; }
        await tick();
      }
      if (thumbCache[key]) o.img.src = thumbCache[key];
      if (shown !== engine) return;      // engine changed while rendering
    }
  }
  bind(() => {
    if (shown !== state.engine) { shown = state.engine; fill(shown); }
    const cur = state.algo[state.engine];
    const items = algoList(state.engine);
    Array.from(strip.children).forEach((b, i) => { if (items[i] && items[i].id === cur) b.classList.add("on"); else b.classList.remove("on"); });
  });
  return strip;
}

// 3-handle levels (black / mid / white) on a gradient track. Mid maps to gamma.
function levelsWidget() {
  const pre = () => state.fx.pre;
  const track = el("div", { class: "levels" });
  const hs = ["black", "mid", "white"].map((k) => { const h = el("div", { class: "lvh lvh-" + k, title: k + " point" }); track.appendChild(h); return h; });
  const midPos = () => { const p = pre(); return p.black + (p.white - p.black) * Math.pow(0.5, p.gamma > 0.05 ? p.gamma : 1); };
  const vals = el("div", { class: "row" }, [
    el("span", { class: "lbl", text: "Black / mid / white" }),
    numInput("fx.pre.black", 0, 250), numInput("fx.pre.gamma", 0.1, 4), numInput("fx.pre.white", 5, 255)
  ]);
  bind(() => {
    const W = 100 / 255;
    hs[0].style.left = (pre().black * W) + "%";
    hs[1].style.left = (midPos() * W) + "%";
    hs[2].style.left = (pre().white * W) + "%";
  });
  let drag = -1;
  const posOf = (ev) => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(255, ((ev.clientX - r.left) / Math.max(1, r.width)) * 255)); };
  function setFrom(ev, live) {
    const v = posOf(ev), p = pre();
    p.on = true;
    if (drag === 0) p.black = Math.round(Math.min(v, p.white - 5));
    else if (drag === 2) p.white = Math.round(Math.max(v, p.black + 5));
    else {
      const t = Math.max(0.02, Math.min(0.98, (v - p.black) / Math.max(1, p.white - p.black)));
      p.gamma = Math.round(Math.max(0.1, Math.min(4, Math.log(t) / Math.log(0.5))) * 100) / 100;
    }
    if (live) { refreshAll(); liveFrame(); }
  }
  const down = (ev) => {
    const v = posOf(ev), p = pre(), c = [p.black, midPos(), p.white].map((x) => Math.abs(x - v));
    drag = c.indexOf(Math.min.apply(null, c));
    try { if (track.setPointerCapture && ev.pointerId != null) track.setPointerCapture(ev.pointerId); } catch (e) { /* older UXP */ }
    setFrom(ev, true);
  };
  const move = (ev) => { if (drag >= 0) setFrom(ev, true); };
  const up = (ev) => { if (drag < 0) return; setFrom(ev, false); drag = -1; touch(); };
  track.addEventListener("pointerdown", down); track.addEventListener("pointermove", move); track.addEventListener("pointerup", up);
  track.addEventListener("mousedown", (e) => { if (drag < 0) down(e); }); track.addEventListener("mousemove", move); track.addEventListener("mouseup", up);
  track.addEventListener("mouseleave", (e) => { if (drag >= 0) up(e); });
  return el("div", {}, [row("Levels", track), vals]);
}

// expandable picker: a "Select >" row that opens a list of rendered choices
function selectFold(label, getName, buildList) {
  const name = el("span", { class: "val" });
  const open = el("button", { class: "btn small", text: "Select >" });
  const list = el("div", { class: "picklist" });
  list.style.display = "none";
  open.addEventListener("click", () => {
    const show = list.style.display === "none";
    list.style.display = show ? "" : "none";
    open.textContent = show ? "Close" : "Select >";
    if (show) buildList(list, () => { list.style.display = "none"; open.textContent = "Select >"; });
  });
  bind(() => { name.textContent = getName(); });
  return el("div", {}, [row(label, name, open), list]);
}

function toneMapList(list, close) {
  clear(list);
  TONEMAPS.forEach((t) => {
    const strip = el("div", { class: "tmstrip" }, [t.paper ? el("span", { class: "tmsw", style: { backgroundColor: t.paper } }) : null]
      .concat(t.inks.map((hx) => el("span", { class: "tmsw", style: { backgroundColor: hx } }))));
    const r = el("div", { class: "pickrow" + (state.tonal.tone === t.id ? " on" : ""), title: t.name }, [strip, el("span", { class: "pickname", text: t.name })]);
    r.addEventListener("click", () => { state.tonal.tone = t.id; state.tonal.inks = t.inks.slice(); state.tonal.paper = t.paper; close(); touch(); });
    list.appendChild(r);
  });
}

// thumbnail grid of the built-in looks, rendered from the current source
let lookSig = "", lookOnSample = true, lookSample = null;
try { if (localStorage.getItem("brew.looks.dithers.src") === "doc") lookOnSample = false; } catch (e) { /* no storage */ }
function sampleSrc() {
  if (lookSample) return lookSample;
  const smp = require("./look-sample.js"), A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const n = smp.w * smp.h, data = new Uint8Array(n * 4), bytes = [];
  for (let i = 0; i < smp.rgb.length; i += 4) {
    const q = (A.indexOf(smp.rgb[i]) << 18) | (A.indexOf(smp.rgb[i + 1]) << 12) | (Math.max(0, A.indexOf(smp.rgb[i + 2])) << 6) | Math.max(0, A.indexOf(smp.rgb[i + 3]));
    bytes.push((q >> 16) & 255, (q >> 8) & 255, q & 255);
  }
  for (let p = 0; p < n; p++) { data[p * 4] = bytes[p * 3]; data[p * 4 + 1] = bytes[p * 3 + 1]; data[p * 4 + 2] = bytes[p * 3 + 2]; data[p * 4 + 3] = 255; }
  return (lookSample = { w: smp.w, h: smp.h, c: 4, data });
}
async function lookGrid(list) {
  const useDoc = !lookOnSample && lastSrc;
  const src0 = useDoc ? lastSrc : (lookOnSample ? sampleSrc() : Engine.demoImage(160, 120));
  const sig = (useDoc ? "doc" + docCache.name : (lookOnSample ? "sample" : "demo")) + src0.w + "x" + src0.h;
  if (sig === lookSig && list.firstChild) return;
  lookSig = sig;
  clear(list);
  let src = src0;
  while (src.w > 200) src = halfSrc(src);
  const sc = (useDoc ? lastScale : 1) * src.w / src0.w;
  const cells = PRESETS.map((pr) => {
    const img = el("img", { class: "lookimg" });
    const c = el("div", { class: "look", title: pr.cat + " - " + pr.name }, [img, el("div", { class: "lookname", text: pr.name })]);
    c.addEventListener("click", () => applyPatch(pr.p));
    list.appendChild(c);
    return { pr, img };
  });
  for (const o of cells) {
    try {
      const P = merge(DEFAULTS, o.pr.p);
      P.ppi = effPpi(useDoc ? lastPpi : 300); P.scale = sc;
      const res = await Engine.render(src, P, {});
      o.img.src = PNG.dataURL(Engine.composite(res, { type: "white" }), res.w, res.h, 3);
      // UXP does not keep an image's shape from its width alone: set the height too
      const cw = (o.img.parentNode && o.img.parentNode.clientWidth || 0) - 2;
      if (cw > 4) o.img.style.height = Math.round(cw * res.h / res.w) + "px";
    } catch (e) { /* leave blank */ }
    await tick();
  }
}

// ---------------------------------------------------------------- info / warnings
function updateInfo() {
  if (!refs.info) return;
  const ppi = effPpi(docCache.ppi || 300), lines = [];
  const mm = (px) => (px / ppi * 25.4);
  if (state.engine === "halftone") {
    const pitch = 25.4 / state.lpi;
    lines.push(state.lpi + " LPI: cell " + pitch.toFixed(2) + " mm (" + (ppi / state.lpi).toFixed(1) + " px). 5% highlight dot is about " + (pitch * 0.2523).toFixed(2) + " mm.");
    if (ppi / state.lpi < 6) lines.push("Warning: cells under 6 px look rough. Use a higher PPI or a lower LPI.");
  } else if (state.engine === "dither") {
    lines.push("Scale " + state.pixel + "x: dot " + state.pixel + " px = " + mm(state.pixel).toFixed(2) + " mm at " + Math.round(ppi) + " PPI" + (state.out.dpi > 0 ? " (DPI override)" : "") + ".");
    if (mm(state.pixel) < 0.5 && state.fx.dtf.on) lines.push("Warning: dots under 0.5 mm may not hold on DTF film.");
  } else {
    lines.push("Character cell " + (state.ascii.size * 6) + " x " + (state.ascii.size * 8) + " px (" + mm(state.ascii.size * 6).toFixed(2) + " mm wide).");
  }
  if (ppi < 300) lines.push((state.out.dpi > 0 ? "Output is " : "Document is ") + Math.round(ppi) + " PPI. Print and DTF work best at 300+.");
  if (docCache.demo) lines.push("No document open: showing the built-in demo image.");
  refs.info.textContent = lines.join("\n");
}

// ---------------------------------------------------------------- preview
const loop = createPreviewLoop({
  renderOnce: () => previewOnce(),
  onError: (e) => { setStatus("Preview problem: " + (e && e.message ? e.message : e), true); console.error(e); }
});
const schedulePreview = (delay) => loop.schedule(delay);
const runPreview = () => loop.run();

async function previewOnce() {
  const quick = quickNext && !!lastSrc;
  quickNext = false;
  if (quick) return previewFrame(halfSrc(lastSrc), lastScale / 2, lastPpi, true);
  setStatus("Rendering preview...");
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
  lastSrc = src; lastScale = scale; lastPpi = ppi;
  markApplyReady(!docCache.demo);
  if (refs.lookList && refs.lookList.style.display !== "none") lookGrid(refs.lookList);   // re-render looks when the image changes
  refs.docline.textContent = docCache.demo ? "No document open - demo image" : (docCache.name + "  " + docCache.w + " x " + docCache.h + " px @ " + Math.round(docCache.ppi) + " PPI");
  return previewFrame(src, scale, ppi, false);
}

async function previewFrame(src, scale, ppi, quick) {
  const t0 = Date.now();
  const P = Object.assign({}, state, { ppi: effPpi(ppi), scale });
  const res = await Engine.render(src, P, { yield: tick });
  const dtf = state.fx.dtf;
  const bgType = state.view.bg;
  const bg = (dtf.on && dtf.view === "garment") ? { type: "garment", color: Engine.hexToRgb(dtf.garment) } : { type: bgType };
  let rgb;
  if (D().inks && Colour.active(D())) rgb = Engine.composite(withDeck(res), bg);
  else { rgb = Engine.composite(res, bg); applyDeckPreview(rgb, res, D(), Engine, null, bgType, "white"); }
  if (Blend.active(state.blend)) rgb = Blend.preview(Engine, withDeck(res), src, state.blend);   // as the group will look over the picture
  lastShown = { rgb, w: res.w, h: res.h, before: IM.composite({ w: res.w, h: res.h, layers: [], overSource: true }, { type: bgType }, src) };
  paintPreview();
  const avail = (refs.previewBox.clientWidth || 320) - 4;
  const maxH = layout ? layout.previewMaxHeight() : Infinity;   // pinned preview leaves room for controls
  const fw = quick ? res.w * 2 : res.w, fh = quick ? res.h * 2 : res.h;
  const dw = Math.max(1, Math.round(Math.min(avail, fw, maxH * fw / fh))), dh = Math.round(fh * dw / fw);
  refs.preview.style.width = dw + "px";
  refs.preview.style.height = dh + "px";
  updateInfo();
  const notes = res.notes && res.notes.length ? "  |  " + res.notes.join("; ") : "";
  if (refs.scrL) {
    const algo = state.engine === "ascii" ? "ASCII " + state.algo.ascii : (algoList(state.engine).find((a) => a.id === state.algo[state.engine]) || {}).name || "";
    refs.scrL.textContent = ("CH1  " + state.mode + "  " + String(algo).replace(/ \(.*\)$/, "")).toUpperCase();
    refs.scrR.textContent = res.w + " x " + res.h + " PX" + (quick ? "  LIVE" : "");
  }
  setStatus((quick ? "Live " : "Preview ") + res.w + " x " + res.h + " in " + (Date.now() - t0) + " ms  |  " + res.layers.length + " layer" + (res.layers.length === 1 ? "" : "s") + notes);
}

// Before/After split (quick win ID-09): left of the line is the untouched picture.
// Dragging on the preview moves the line without a re-render.
let lastShown = null;
function paintPreview() {
  const L = lastShown;
  if (!L) return;
  refs.preview.src = PNG.dataURL(QW.splitRGB(L.rgb, L.before, L.w, L.h, state.view.split || 0), L.w, L.h, 3);
}
function wireSplitDrag() {
  const img = refs.preview;
  let drag = false;
  const move = (e) => {
    let r = null; try { r = img.getBoundingClientRect(); } catch (err) { /* no layout */ }
    const W = (r && r.width) || img.clientWidth || 1, x = r ? e.clientX - r.left : (e.offsetX || 0);
    state.view.split = Math.max(1, Math.min(99, Math.round(100 * x / W))); paintPreview();
  };
  img.addEventListener("mousedown", (e) => { if (state.view.split) { drag = true; move(e); } });
  img.addEventListener("mousemove", (e) => { if (drag) move(e); });
  const end = () => { drag = false; };
  img.addEventListener("mouseup", end); img.addEventListener("mouseleave", end);
}
// error prevention (UX-06): with no document the Apply key looks blocked and says why
function markApplyReady(ok) {
  const b = refs.apply;
  if (!b) return;
  if (ok) { b.classList.remove("blocked"); b.setAttribute("title", "Apply to the document as new layer groups (one undo step)"); }
  else { b.classList.add("blocked"); b.setAttribute("title", "Open a document first. The preview is using the demo image."); }
}

function tryLayerTarget(doc) {
  try { return PS.collectTargets(doc, "layer")[0]; } catch (e) { return { kind: "flat" }; }
}

// ---------------------------------------------------------------- apply
async function applyNow() {
  const doc = PS.activeDoc();
  if (!doc) { setStatus("Open a document first. The preview is only using the demo image.", true); return; }
  const btn = refs.apply;
  loop.setBusy(true);                         // don't let the preview fight a running Apply
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
    var tStart = Date.now();
    refs.meter.run();
    btn.textContent = "Brewing...";
    btn.setAttribute("disabled", "true");
    let done = 0;
    for (const t of targets) {
      setStatus("Reading pixels " + (done + 1) + "/" + targets.length + "...");
      const r = await PS.readSource(doc, t, { kind: "full" });
      const P = Object.assign({}, state, { ppi: effPpi(r.ppi), scale: 1 });
      const res0 = await Engine.render(r.src, P, {
        yield: tick,
        progress: (i, n, name) => setStatus("Rendering " + (done + 1) + "/" + targets.length + ": " + name + " (" + (i + 1) + "/" + n + ")...")
      });
      const res = withDeck(res0);
      setStatus("Writing layers...");
      const label = state.engine === "halftone" ? Engine.SCREENS.find((s) => s.id === state.algo.halftone).name
        : state.engine === "dither" ? Engine.DITHERS.find((s) => s.id === state.algo.dither).name
        : "ASCII " + state.algo.ascii;
      const base = t.kind === "layer" ? (t.layer.name + " - ") : "";
      const warnings = await PS.writeResult(doc, res, {
        origin: r.origin,
        groupName: base + "Brew - " + label + (state.engine === "halftone" ? " " + state.lpi + " LPI" : ""),
        hideSource: state.out.hide && !Blend.active(state.blend),   // a blended group needs its source visible
        hideLayers: t.kind === "layer" ? [t.layer] : null,
        paperLayer: state.out.paper,
        blend: state.blend
      });
      done++;
      if (warnings && warnings.length) setStatus(warnings.join(" | "), true);
    }
    refs.meter.done((Date.now() - tStart) / 1000);
    if (!refs.status.className.includes("err")) setStatus("Done. " + done + " group" + (done === 1 ? "" : "s") + " added. Undo with one Ctrl/Cmd+Z.");
  } catch (e) {
    console.error(e);
    if (refs.meter) refs.meter.idle();
    setStatus("Apply failed: " + (e && e.message ? e.message : e), true);
  } finally {
    loop.setBusy(false);
    if (!confirmArmed) btn.textContent = "Apply to document";
    btn.removeAttribute("disabled");
  }
}

// ---------------------------------------------------------------- presets
function applyPatch(p) {
  const keepOut = clone(state.out), keepView = clone(state.view), keepDeck = state.deck;
  state = normAscii(merge(DEFAULTS, p));
  state.out = keepOut; state.view = keepView;
  state.deck = p && p.deck ? Colour.normalize(p.deck) : keepDeck;   // looks without colour keep the current deck
  // 1.0 looks stored invert as true/false; 1.1 uses a 0-100 amount (same pixels)
  if (typeof state.fx.pre.invert !== "number") state.fx.pre.invert = state.fx.pre.invert ? 100 : 0;
  preSig = preKey();
  lookBase = clone(state);
  touch();
}
function stateForSave() {
  const s = clone(state);
  delete s.view; delete s.out;
  return s;
}

// ---------------------------------------------------------------- UI build
let layout = null;
function build(root) {
  clear(root);
  layout = splitLayout(root, el);
  const top = layout.pinned;

  // header
  root.classList.add("brand-console");
  refs.led = ui.brand.header({ title: "Frank's Dithers Brew", code: "DB-01" });
  top.appendChild(refs.led.node);

  // ---- preview card
  refs.docline = el("div", { class: "docline", text: "" });
  refs.preview = el("img", { class: "preview" });
  refs.scrL = el("span", { class: "scrl", text: "CH1" });
  refs.scrR = el("span", { class: "scrr", text: "" });
  refs.previewBox = el("div", { class: "previewbox" }, [el("div", { class: "scrstrip" }, [refs.scrL, refs.scrR]), refs.preview]);
  refs.status = el("div", { class: "status", text: "Starting..." });
  refs.info = el("div", { class: "info" });
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
  top.appendChild(card("Preview", [
    refs.docline,
    refs.previewBox,
    el("div", { class: "row wrap" }, [
      segGroup("view.kind", [{ v: "detail", l: "Detail 1:1", t: "True dot size, centre crop" }, { v: "whole", l: "Whole", t: "Scaled-down view of everything" }]),
      segGroup("view.bg", [{ v: "white", l: "White" }, { v: "black", l: "Black" }, { v: "checker", l: "Checker" }])
    ]),
    el("div", { class: "row" }, ui.brand ? [refresh,
      ui.brand.miniToggle("Auto-update", true, setAuto),
      ui.brand.miniToggle("Pin on top", true, setPin, pinCb.title),
      refs.splitSw = ui.brand.miniToggle("Before / After", !!state.view.split, (v) => { state.view.split = v ? 50 : 0; paintPreview(); }, "Split the preview: original on the left, result on the right. Drag on the preview to move the line.")
    ] : [refresh, el("span", { class: "lbl2", text: "Auto-update" }), autoCb, el("span", { class: "lbl2", text: "Pin on top" }), pinCb]),
    refs.status,
    (refs.keys = el("div", { class: "keys", text: KEYS_IDLE })),
    refs.info
  ]));
  wireSplitDrag();

  root = layout.scroller;   // everything below scrolls under the pinned preview
  // organized panel (Frank, 2026-11-22): Look (look browser first) / Controls (tabs) / Colour / Output
  const secs = [];
  const sec = (letter, name, id) => { const n = ui.section(letter, name, id); root.appendChild(n); secs.push({ letter, name, id, node: n }); };
  sec("A", "LOOK", "look");

  const lookList = el("div", { class: "lookgrid" });
  lookList.style.display = "none";
  const lookBtn = el("button", { class: "btn small", text: "Show looks" });
  lookBtn.addEventListener("click", () => {
    const show = lookList.style.display === "none";
    lookList.style.display = show ? "" : "none";
    lookBtn.textContent = show ? "Hide looks" : "Show looks";
    if (show) lookGrid(lookList);
    try { localStorage.setItem("brew.looks.dithers", show ? "1" : "0"); } catch (e) { /* no storage */ }
  });
  refs.lookList = lookList;
  let lookWant = true;   // previews show by default (Frank, 2026-11-22); Hide is remembered
  try { if (localStorage.getItem("brew.looks.dithers") === "0") lookWant = false; } catch (e) { /* no storage */ }
  if (lookWant) { lookList.style.display = ""; lookBtn.textContent = "Hide looks"; lookGrid(lookList); }
  const srcBtns = [["sample", "Sample"], ["doc", "My image"]].map(([v, l]) => {
    const b = el("button", { class: "btn small lsrc", text: l });
    b.addEventListener("click", () => {
      lookOnSample = v === "sample";
      try { localStorage.setItem("brew.looks.dithers.src", v); } catch (e) { /* no storage */ }
      srcBtns.forEach((x) => { if (x === b) x.classList.add("on"); else x.classList.remove("on"); });
      if (lookList.style.display !== "none") lookGrid(lookList);
    });
    if ((v === "sample") === lookOnSample) b.classList.add("on");
    return b;
  });
  root.appendChild(card("Look browser", [
    el("div", { class: "row" }, [lookBtn].concat(srcBtns)),
    el("div", { class: "hint", text: "Every built-in look, on a sample picture or your image. Click one to load it." }),
    lookList
  ]));

  // ---- presets (shared Library card), under the look browser
  lib = createLibrary(ui, { builtins: PRESETS, applyPatch, getSaveable: stateForSave, io: PS, setStatus });
  root.appendChild(lib.card);

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
    sliderRow("Scale", "pixel", 1, 16, 1, "x")
  ]);
  showIf(diBox, () => state.engine === "dither");
  const customRow = textRow("Characters", "ascii.custom", "e.g. FRANK 01");
  showIf(customRow, () => state.algo.ascii === "custom");
  const keepRow = checkRow("Keep my order (light to dark)", "ascii.keepOrder");
  showIf(keepRow, () => state.algo.ascii === "custom");
  const textRowEl = textRow("Text", "ascii.text", "text to tile");
  showIf(textRowEl, () => ["text", "weight"].indexOf(state.ascii.algo) >= 0);
  // ASCII 3.0: 20 algorithms in 4 groups of 5 (live sample tiles), font, size, spacing, invert, glyph colour
  const algoGrids = ASCII3.GROUPS.map((g) => {
    const opts = ASCII3.ALGOS.filter((a) => a.g === g).map((a) => ({ v: a.id, l: a.n, img: asciiTile(a.id) }));
    return el("div", { class: "agroup" }, [el("div", { class: "lbl3", text: g }),
      ui.grid("ascii.algo", opts, { cls: "ascii20", after: (v) => { state.ascii.textMode = v === "text"; } })]);
  });
  const edgeRow = sliderRow("Edge glyphs", "ascii.edge", 0, 100, 1, "%");
  showIf(edgeRow, () => ["luma", "equal", "ordered", "bluenoise", "glitch", "edge"].indexOf(state.ascii.algo) >= 0);
  const seedRow = ui.stepper("Seed", "ascii.seed", 1, 9999, 1, "");
  showIf(seedRow, () => ["bluenoise", "glitch", "rain"].indexOf(state.ascii.algo) >= 0);
  const asBox = el("div", {}, algoGrids.concat([
    selectRow("Font", "ascii.font", ASCII3.FONTS.map((f) => ({ v: f.id, l: f.name }))),
    ui.stepper("Size", "ascii.cell", 4, 96, 1, "px"),
    selectRow("Character set", "algo.ascii", ASCII.ASCII_SETS.map((s) => ({ v: s.id, l: s.name }))),
    customRow, keepRow,
    ui.stepper("Spacing", "ascii.spacing", 0, 8, 1, "px"),
    edgeRow, seedRow,
    checkRow("Invert (light glyphs on dark)", "ascii.invert"),
    segGroup("ascii.glyph", [{ v: "ink", l: "Ink" }, { v: "cell", l: "Cell colour" }, { v: "deck", l: "Colour Deck" }]),
    textRowEl
  ]));
  showIf(asBox, () => state.engine === "ascii");
  const printRow = el("div", { class: "row wrap" }, [
    el("span", { class: "lbl", text: "Print" }),
    pill("DTF", "fx.dtf.on", null, "DTF film: knock out the garment colour"),
    el("span", { class: "lbl2", text: "DPI" }),
    (function () {
      const sel = el("select", { class: "dpisel" });
      const opts = [0, 150, 200, 300, 600, 1200];
      opts.forEach((v) => sel.appendChild(el("option", { value: String(v), text: v ? v + " DPI" : "Document" })));
      sel.addEventListener("change", () => { state.out.dpi = opts[sel.selectedIndex] || 0; touch(); });
      bind(() => { const i = opts.indexOf(state.out.dpi || 0); sel.selectedIndex = i < 0 ? 0 : i; });
      return sel;
    })()
  ]);
  const engineCard = card("Engine", [algoStrip(), htBox, diBox, asBox, printRow]);

  // ---- tune: only the controls the chosen algorithm uses
  const dirRow = segGroup("tune.direction", [{ v: "h", l: "Horiz" }, { v: "v", l: "Vert" }, { v: "d", l: "Diag" }, { v: "r", l: "Radial" }]);
  const dirWrap = row("Direction", dirRow);
  showIf(dirWrap, () => isLine() && ["wavescan", "waveamp", "lineweight"].indexOf(state.algo.dither) >= 0);
  const strRow = sliderRow("Strength", "tune.strength", 0, 100, 1, "%");
  showIf(strRow, () => state.engine === "dither" && (curDither().t === "ed" || curDither().t === "ord" || (isLine() && (lineInfo().bend || state.algo.dither === "contour"))));
  const spRow = sliderRow("Spacing", "tune.spacing", 2, 24, 1, " px");
  showIf(spRow, () => isLine() && state.algo.dither !== "stipple");
  const wtRow = sliderRow("Weight", "tune.weight", 1, 8, 1);
  showIf(wtRow, () => isLine() && (lineInfo().bend || state.algo.dither === "contour"));
  const jitRow = sliderRow("Jitter", "tune.jitter", 0, 100, 1, "%");
  showIf(jitRow, () => state.engine === "dither" && curDither().t === "ord");
  const thrRow = sliderRow("Threshold", "tune.threshold", 0, 100, 1);
  showIf(thrRow, () => state.mode !== "grade");
  const tuneHint = el("div", { class: "hint" });
  bind(() => {
    tuneHint.textContent = state.mode === "grade" ? "Threshold is not used in Grade mode (the palette decides)."
      : "Threshold 50 and Strength 100 give the classic look. Raise Threshold to clear faint background marks.";
  });
  const tuneCard = card("Tune", [thrRow, strRow, dirWrap, spRow, wtRow, jitRow, tuneHint]);

  // ---- colour
  const monoBox = el("div", {}, [
    row("Ink", hexField(() => state.mono.ink, (v) => { state.mono.ink = v; }, false)),
    row("Paper", hexField(() => state.mono.paper, (v) => { state.mono.paper = v; }, true)),
    el("div", { class: "hint", text: "Leave paper empty for a transparent background (screen print / DTF)." })
  ]);
  showIf(monoBox, () => state.mode === "mono");

  const tonalBox = el("div", {}, [
    selectFold("Tone map", () => { const t = TONEMAPS.find((x) => x.id === state.tonal.tone); return t ? t.name : "Custom"; }, toneMapList),
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
  const colourCard = card("Colour", [monoBox, tonalBox, gradeBox, cmykBox, rgbBox]);

  // ---- FX stack
  // each effect is a tab in the Effects card; its dot switches it on / off (was the pill stack)
  const fxKeyOf = { Image: "pre" };
  const fxCards = [];
  const fxCard = (key, title, kids) => { fxKeyOf[title] = key; const c = card(title, kids, { bypass: true }); fxCards.push(c); return c; };
  // ---- Image card: always visible; touching any control switches it on
  const more = el("div", {}, [
    sliderRow("Brightness", "fx.pre.brightness", -100, 100, 1),
    sliderRow("Contrast", "fx.pre.contrast", -100, 100, 1),
    sliderRow("Blur", "fx.pre.blur", 0, 8, 0.5, " px")
  ]);
  more.style.display = "none";
  const moreBtn = el("button", { class: "btn small", text: "More >" });
  moreBtn.addEventListener("click", () => { const sh = more.style.display === "none"; more.style.display = sh ? "" : "none"; moreBtn.textContent = sh ? "Less" : "More >"; });
  const radRow = sliderRow("  Radius", "fx.pre.radius", 0.5, 30, 0.5, " px");
  radRow.classList.add("sub");
  const imgCard = card("Image", [
    levelsWidget(),
    sliderRow("Sharpen", "fx.pre.sharpen", 0, 200, 1, "%"),
    radRow,
    sliderRow("Noise -/+", "fx.pre.noise", -100, 100, 1),
    sliderRow("Haze", "fx.pre.haze", 0, 100, 1, "%"),
    sliderRow("Invert", "fx.pre.invert", 0, 100, 1, "%"),
    el("div", { class: "row" }, [moreBtn]),
    more,
    checkRow("Image adjustments on", "fx.pre.on")
  ], { bypass: true });
  (fxCard("edges", "Edge lines", [
    sliderRow("Strength", "fx.edges.strength", 0, 100, 1, "%"),
    sliderRow("Thickness", "fx.edges.thick", 1, 6, 1, " px")
  ]));
  (fxCard("dtf", "DTF film", [
    row("Garment", hexField(() => state.fx.dtf.garment, (v) => { state.fx.dtf.garment = v; }, false)),
    sliderRow("Fuzziness", "fx.dtf.fuzz", 0, 100, 1, "%"),
    sliderRow("Feather", "fx.dtf.feather", 0, 100, 1, "%"),
    checkRow("Turn soft edges into dots", "fx.dtf.dots"),
    selectRow("View", "fx.dtf.view", [{ v: "garment", l: "On garment colour" }, { v: "paper", l: "On preview background" }]),
    el("div", { class: "hint", text: "Colours close to the garment colour become transparent; semi-transparent edges become printable dots." })
  ]));
  (fxCard("gain", "Dot gain", [sliderRow("Amount", "fx.gain.amount", -4, 4, 1, " px")]));
  (fxCard("misreg", "Misregistration", [sliderRow("Offset", "fx.misreg.amount", 1, 12, 1, " px"), el("div", { class: "hint", text: "Applies to the 2nd plate onwards (CMYK, RGB, tonal, grade)." })]));
  (fxCard("clean", "Clean specks", [sliderRow("Smallest dot", "fx.clean.mm", 0.1, 3, 0.1, " mm"), el("div", { class: "hint", text: "Dots smaller than this diameter are deleted. 0.5 mm is a safe DTF minimum." })]));
  (fxCard("distress", "Distress", [sliderRow("Amount", "fx.distress.amount", 0, 100, 1, "%")]));

  sec("B", "CONTROLS", "controls");
  root.appendChild(ui.tabs([engineCard, tuneCard, imgCard].concat(fxCards), {
    title: "Effects",
    isOn: (t) => !fxKeyOf[t] || !!state.fx[fxKeyOf[t]].on,
    setOn: (t, on) => { if (fxKeyOf[t]) state.fx[fxKeyOf[t]].on = !!on; }
  }));
  sec("C", "COLOUR", "colour");
  root.appendChild(colourCard);
  deck = createColourDeck(ui, { getC: D, touch, getSource: () => lastSrc, io: PS, setStatus, inkTool: true });
  root.appendChild(deck.card);

  // ---- output
  sec("D", "OUTPUT", "output");
  refs.meter = ui.brand.meter(12);
  refs.apply = el("button", { class: "apply", text: "Apply to document" });
  refs.apply.addEventListener("click", applyNow);
  root.appendChild(Blend.card(ui, () => state));
  root.appendChild(card("Output", [
    selectRow("Source", "out.source", [{ v: "flat", l: "Flattened document" }, { v: "layer", l: "Active layer" }, { v: "each", l: "Each selected layer (batch)" }], () => { confirmArmed = false; }),
    checkRow("Hide source artwork afterwards", "out.hide"),
    checkRow("Add a white paper layer", "out.paper"),
    refs.meter.node,
    refs.apply,
    el("div", { class: "hint", text: "Creates a layer group of ink layers with transparent paper. One undo step." })
  ]));

  top.appendChild(ui.jumpStrip(secs, layout.scroller));
  root.appendChild(el("div", { class: "foot", text: "Frank's Dithers Brew 1.1  -  your artwork is never changed; results land in new layers." }));

  root.addEventListener("input", onDragInput);
  preSig = preKey();
  refreshAll();
  updateInfo();
}

function menuAction(id) {
  if (id === "resetLook") {
    const keepOut = clone(state.out), keepView = clone(state.view), keepDeck = state.deck;
    state = clone(lookBase); state.out = keepOut; state.view = keepView; state.deck = keepDeck;
    preSig = preKey(); touch(); setStatus("Knobs reset to the last loaded look.");
  }
  else if (id === "split") { if (refs.splitSw) refs.splitSw.__sw.set(!state.view.split); else { state.view.split = state.view.split ? 0 : 50; paintPreview(); } }
  else if (id === "foldAll") { if (ui.foldAll) ui.foldAll(!ui.anyOpen()); }
  else if (id === "about") {
    let v = ""; try { v = require("./manifest.json").version; } catch (e) { /* no manifest in tests */ }
    setStatus("Frank's Dithers Brew " + v + "  |  DB-01  |  Frank's Brew suite. Hover any control for help.");
  }
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
  entrypoints.setup({
    panels: {
      franksBrewPanel: {
        create() { init(); },
        show() { if (!built) init(); else schedulePreview(200); },
        // panel flyout menu (quick win AD-05)
        menuItems: [
          { id: "resetLook", label: "Reset knobs to this look" },
          { id: "split", label: "Before / After split" },
          { id: "foldAll", label: "Fold or open all cards" },
          "-",
          { id: "about", label: "About Frank's Dithers Brew" }
        ],
        invokeMenu(id) { menuAction(id); }
      }
    }
  });
} catch (e) { /* older hosts: fall through to direct init */ }
setTimeout(() => { init(); }, 0);

// test hook only; <script> contexts in UXP may not define `module`
if (typeof module !== "undefined" && module && module.exports) {
  module.exports = { _test: { get state() { return state; }, set state(v) { state = v; }, applyNow, runPreview, init, refs, touch, menuAction, get lookBase() { return lookBase; } } };
}
