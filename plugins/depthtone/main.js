"use strict";
// Depthtone 2.0 - panel UI. Depth comes from Smart depth (Photoshop's Select Subject +
// floor plane), a Depth layer (e.g. Neural Filters > Depth Blur > Output depth map only)
// or Brightness, and is redrawn in 7 styles.
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");
const DS = require("./core/depth.js");

const BRAND = require("./brand.js");
const HELP = require("./help.js");
const { SUITE } = require("./core/brand.js");
const APP = BRAND.NAME;
let panel = null;
const st = () => (panel ? panel._test.state : DEFAULTS);

// Smart depth / Depth layer inputs (shared/depth.js)
const prepareSource = (doc, r, phase) => DS.prepareSourceFor(st, APP)(doc, r, phase);

panel = createToolPanel({
  code: "DT-03", glow: "#f5ff3b", ui3: true, help: HELP, version: "3.0",
  appName: APP, title: APP, storeKey: BRAND.LEGACY, sub: "smart depth  /  contours  /  ridges  /  relief", panelId: "depthtonePanel",
  presetFile: "presets.json", exportName: "depthtone-looks.json",
  footer: APP + " 3.0  -  " + SUITE,
  Engine, DEFAULTS, PRESETS, merge, clone,
  prepareSource,
  // the suite sample photo plus its subject mask, so look thumbnails use Smart depth too
  lookSample: Object.assign({}, require("./look-sample.js"), { subject: require("./look-subject.js") }),
  keepOnLook: ["depth.source", "depth.layerId", "depth.layerName", "depth.layerDoc"],
  outputRows: (ui) => [ui.checkRow("Also add the depth map as a hidden layer", "out.depthLayer")],
  cards: (ui, kit) => {
    const { card, sliderRow, fader, stepper, angle, selectRow, checkRow, segGroup, el, showIf, row } = ui;
    const s = () => kit.state;
    const when = (node, fn) => { showIf(node, fn); return node; };
    const is = (...v) => () => v.includes(s().style);

    // Depth source (first card, shared with other tools)
    const source = DS.depthSourceCard(ui, kit);
    const depth = card("Depth", [
      checkRow("Auto range", "depth.auto"),
      sliderRow("Smooth", "depth.smooth", 0, 20, 1, " px"),
      checkRow("Invert (far comes forward)", "depth.invert"),
      when(stepper("Levels", "depth.levels", 2, 64, 1, ""), is("contours", "terraces")),
      when(fader("Near", "depth.near", 1, 100, 1, "%"), () => s().depth.auto === false),
      when(fader("Far", "depth.far", 0, 99, 1, "%"), () => s().depth.auto === false)
    ]);
    const style = card("Style", [
      segGroup("style", [{ v: "contours", l: "Contours" }, { v: "terraces", l: "Terraces" }, { v: "relief", l: "Relief" }, { v: "ridges", l: "Ridges" }], "big"),
      segGroup("style", [{ v: "heat", l: "Heat" }, { v: "anaglyph", l: "Anaglyph" }, { v: "haze", l: "Haze" }], "big"),
      when(fader("Photo mix", "photo", 0, 100, 1, "%"), () => !["anaglyph", "haze"].includes(s().style))
    ]);
    const colour = when(card("Colour (far to near)", [
      kit.gradientEditor("look.stops"),
      fader("Fog", "look.fog", 0, 100, 1, "%"),
      kit.colourRow("Fog colour", "look.fogColor")
    ], { section: "colour" }), () => s().style !== "anaglyph");
    const lines = when(card("Lines", [
      stepper("Width", "lines.width", 1, 12, 1, " px"),
      when(stepper("Every Nth level", "lines.every", 1, 8, 1, ""), is("contours")),
      when(checkRow("Heavier line every 5th level", "lines.index"), is("contours")),
      when(selectRow("Colour by", "lines.colorBy", [{ v: "solid", l: "One colour" }, { v: "depth", l: "Depth gradient" }]), is("contours")),
      when(kit.colourRow("Line colour", "lines.color"), is("contours")),
      when(checkRow("Fill bands with the depth gradient", "lines.fill"), is("contours"))
    ]), is("contours", "ridges"));
    const ridges = when(card("Ridges", [
      stepper("Line spacing", "ridges.spacing", 3, 24, 1, " px"),
      sliderRow("Lift", "ridges.lift", 0, 100, 1, "%"),
      selectRow("Line colour", "ridges.colorBy", [{ v: "depth", l: "Depth gradient" }, { v: "photo", l: "Photo colours" }]),
      kit.colourRow("Background", "ridges.bg")
    ]), is("ridges"));
    const light = when(card("Light and shadow", [
      angle("Light angle", "light.angle", 0, 360, 5),
      when(sliderRow("Shadow length", "light.shadow", 1, 40, 1, " px"), is("terraces")),
      sliderRow("Strength", "light.strength", 0, 100, 1, "%"),
      when(sliderRow("Shine", "light.shine", 0, 100, 1, "%"), is("relief")),
      when(sliderRow("Photo detail", "light.detail", 0, 200, 1, "%"), is("relief"))
    ]), is("terraces", "relief"));
    const anaglyph = when(card("Anaglyph", [
      sliderRow("Strength", "anaglyph.strength", 0, 100, 1, "%"),
      checkRow("Grey left eye (less colour fringing)", "anaglyph.grey")
    ]), is("anaglyph"));
    const haze = when(card("Haze", [
      sliderRow("Far blur", "haze.blur", 0, 30, 1, " px"),
      sliderRow("Near warmth", "haze.warm", 0, 200, 1, "%"),
      kit.colourRow("Near tint", "haze.nearTint")
    ]), is("haze"));
    return [source, style, depth, colour, lines, ridges, light, anaglyph, haze];
  }
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
