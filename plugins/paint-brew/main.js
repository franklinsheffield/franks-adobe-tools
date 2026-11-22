"use strict";
// Frank's Paint Brew - panel UI (oil, watercolour and impressionism paintings)
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");
const PS = require("./core/ps-io.js");
const PP = require("./js/paintps.js");

let getState = () => DEFAULTS;
let printFocus = null;          // focus read from the original before a print copy: { w, h, m, W, H }
const isWater = () => getState().style === "watercolour";
const minLong = () => (isWater() ? getState().out.minLongWater : getState().out.minLong);
const sourceLayer = (doc) => { try { return getState().out.source !== "flat" ? Array.from(doc.activeLayers || [])[0] : null; } catch (e) { return null; } };

const panel = createToolPanel({
  appName: "Frank's Paint Brew", title: "Frank's Paint Brew", sub: "oil  /  watercolour  /  impressionism", panelId: "paintPanel",
  presetFile: "presets.json", exportName: "paint-looks.json",
  Engine, DEFAULTS, PRESETS, merge, clone,
  cancellable: true,
  costFactor: (s) => (s.style === "watercolour" ? 2 : s.style === "oil" ? 4 : 3),
  async prepareApply(doc, setStatus) {
    printFocus = null;
    const s = getState(), info = PS.docInfo(doc);
    if (!s.out.printCopy || !PP.needsCopy(info, minLong())) return doc;
    if (s.out.focus !== "none") {
      try {
        const m = await PP.readFocus(doc, s.out.focus, sourceLayer(doc), { src: { w: info.w, h: info.h }, scale: 1, origin: { left: 0, top: 0 } });
        if (m) printFocus = { w: info.w, h: info.h, m };
      } catch (e) { console.warn("focus", e); }
    }
    setStatus("Making a print-ready copy (" + minLong() + " px, " + s.out.ppi + " ppi)...");
    const copy = await PP.makePrintCopy(doc, minLong(), s.out.ppi);
    if (printFocus) { const ci = PS.docInfo(copy); printFocus.W = ci.w; printFocus.H = ci.h; }
    return copy;
  },
  async prepareSource(doc, r, phase) {
    const s = getState();
    if (s.out.focus === "none") return;
    if (phase === "apply" && printFocus) {
      const big = PP.scaleMask(printFocus.m, printFocus.w, printFocus.h, printFocus.W, printFocus.H);
      const W = r.src.w, H = r.src.h, out = new Float32Array(W * H), ox = r.origin.left, oy = r.origin.top;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const X = x + ox, Y = y + oy; if (X >= 0 && Y >= 0 && X < printFocus.W && Y < printFocus.H) out[y * W + x] = big[Y * printFocus.W + X]; }
      r.src.focus = out;
      return;
    }
    try { const m = await PP.readFocus(doc, s.out.focus, sourceLayer(doc), r); if (m) r.src.focus = m; } catch (e) { console.warn("No focus area found: " + (e && e.message)); }
  },
  cards: (ui, kit) => {
    const { card, sliderRow, segGroup, selectRow, el, showIf } = ui;
    getState = () => kit.state;
    const strokes = () => kit.state.style !== "watercolour";
    const only = (node, fn) => { showIf(node, fn); return node; };
    const brush = card("Brush", [
      sliderRow("Stroke size", "brush.size", 4, 120, 1, " px"),
      only(sliderRow("Stroke length", "brush.length", 0.4, 2.5, 0.1, "x"), strokes),
      only(sliderRow("Detail passes", "brush.detail", 1, 4, 1, ""), strokes),
      only(sliderRow("Randomness", "brush.randomness", 0, 100, 1, "%"), strokes),
      only(sliderRow("Follow edges", "brush.follow", 0, 100, 1, "%"), strokes),
      sliderRow("Variation", "seed", 1, 99, 1, "")
    ], { hint: "Sizes are for a 3000 px image and scale with yours." });
    const colour = card("Colour", [
      sliderRow("Simplify", "colour.simplify", 0, 100, 1, "%"),
      sliderRow("Saturation", "colour.saturation", -50, 100, 1, "%"),
      sliderRow("Warmth", "colour.warmth", -50, 50, 1, ""),
      only(sliderRow("Broken colour", "colour.jitter", 0, 100, 1, "%"), () => kit.state.style === "impressionism"),
      sliderRow("Palette limit", "colour.palette", 0, 24, 1, " colours")
    ], { hint: "Palette limit 0 keeps every colour." });
    const texture = only(card("Texture", [
      only(sliderRow("Impasto depth", "texture.impasto", 0, 100, 1, "%"), () => kit.state.style === "oil"),
      sliderRow("Light angle", "texture.light", 0, 360, 5, " deg"),
      sliderRow("Bristle streaks", "texture.bristle", 0, 100, 1, "%"),
      sliderRow("Canvas weave", "texture.canvas", 0, 100, 1, "%"),
      sliderRow("Weave size", "texture.canvasScale", 3, 16, 1, " px"),
      only(sliderRow("Light and colour lift", "texture.lift", 0, 100, 1, "%"), () => kit.state.style === "impressionism")
    ]), strokes);
    const water = only(card("Water and paper", [
      kit.colourRow("Paper colour", "water.paperColour"),
      sliderRow("Pigment", "water.density", 20, 100, 1, "%"),
      sliderRow("Wet edges", "water.wetEdge", 0, 100, 1, "%"),
      sliderRow("Granulation", "water.granulation", 0, 100, 1, "%"),
      sliderRow("Bleed", "water.bleed", 0, 60, 1, " px"),
      sliderRow("Paper texture", "water.paperTexture", 0, 100, 1, "%"),
      sliderRow("Pencil", "water.pencil", 0, 100, 1, "%"),
      sliderRow("Splashes", "water.splashes", 0, 20, 1, ""),
      sliderRow("Splash size", "water.splashSize", 10, 200, 1, " px"),
      sliderRow("Fade to paper", "water.fade", 0, 100, 1, "%")
    ]), isWater);
    const focus = card("Focus", [
      selectRow("Subject", "out.focus", [{ v: "none", l: "Whole image" }, { v: "selection", l: "Current selection" }, { v: "mask", l: "Source layer mask" }]),
      sliderRow("Edge softness", "focus.falloff", 0, 400, 5, " px"),
      sliderRow("Detail outside", "focus.outside", 0, 100, 1, "%")
    ], { hint: "Mark the subject: smaller strokes and more detail there, looser paint and more paper around it." });
    return [card("Style", [segGroup("style", [{ v: "oil", l: "Oil" }, { v: "watercolour", l: "Watercolour" }, { v: "impressionism", l: "Impressionism" }])]),
      brush, colour, texture, water, focus];
  },
  outputRows: (ui, kit) => {
    const { checkRow, sliderRow, selectRow, showIf } = ui;
    const a = sliderRow("Minimum long side", "out.minLong", 1000, 6000, 100, " px"), b = sliderRow("Minimum long side", "out.minLongWater", 1000, 6000, 100, " px");
    showIf(a, () => kit.state.out.printCopy && kit.state.style !== "watercolour");
    showIf(b, () => kit.state.out.printCopy && kit.state.style === "watercolour");
    const ppi = selectRow("Print resolution", "out.ppi", [{ v: 150, l: "150 ppi" }, { v: 240, l: "240 ppi" }, { v: 300, l: "300 ppi" }, { v: 350, l: "350 ppi" }]);
    showIf(ppi, () => kit.state.out.printCopy);
    return [checkRow("Print-ready copy for small photos", "out.printCopy"), a, b, ppi];
  }
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
