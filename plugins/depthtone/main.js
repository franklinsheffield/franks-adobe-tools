"use strict";
// Depthtone 2.0 - panel UI. Depth comes from Smart depth (Photoshop's Select Subject +
// floor plane), a Depth layer (e.g. Neural Filters > Depth Blur > Output depth map only)
// or Brightness, and is redrawn in 7 styles.
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");
const PD = require("./js/ps-depth.js");

const APP = "Frank's Depthtone Brew";
let panel = null, refindSubject = false;
const st = () => (panel ? panel._test.state : DEFAULTS);

async function prepareSource(doc, r, phase) {
  const d = st().depth || {};
  if (d.source === "smart") {
    try { await PD.addSubject(doc, r, phase, APP, refindSubject); refindSubject = false; }
    catch (e) { console.warn("Select Subject failed: " + (e && e.message)); }
  } else if (d.source === "layer" && d.layerId != null) {
    try { await PD.addDepthLayer(doc, r, d.layerId, APP); }
    catch (e) { console.warn("Depth layer read failed: " + (e && e.message)); }
  }
}

panel = createToolPanel({
  code: "DT-03", glow: "#f5ff3b",
  appName: APP, title: APP, sub: "smart depth  /  contours  /  ridges  /  relief", panelId: "depthtonePanel",
  presetFile: "presets.json", exportName: "depthtone-looks.json",
  footer: "Frank's Depthtone Brew 2.0  -  Frank's Brew suite",
  Engine, DEFAULTS, PRESETS, merge, clone,
  prepareSource,
  keepOnLook: ["depth.source", "depth.layerId", "depth.layerName"],
  outputRows: (ui) => [ui.checkRow("Also add the depth map as a hidden layer", "out.depthLayer")],
  cards: (ui, kit) => {
    const { card, sliderRow, selectRow, checkRow, segGroup, el, showIf, row } = ui;
    const s = () => kit.state;
    const when = (node, fn) => { showIf(node, fn); return node; };
    const is = (...v) => () => v.includes(s().style);

    // Depth source (first card)
    const layerLine = el("div", { class: "hint", text: "" });
    const useLayer = el("button", { class: "btn small", text: "Use active layer as depth map" });
    useLayer.addEventListener("click", () => {
      const doc = kit.io.activeDoc(), L = doc ? kit.io.activeLayer(doc) : null;
      if (!L) { kit.setStatus("Select the depth map layer in the Layers panel first.", true); return; }
      s().depth.layerId = L.id; s().depth.layerName = L.name; kit.touch();
    });
    const refind = el("button", { class: "btn small", text: "Find subject again" });
    refind.addEventListener("click", () => { refindSubject = true; PD.clearCache(); kit.touch(); });
    ui.bind(() => { const d = s().depth; layerLine.textContent = d.layerId != null ? "Depth layer: " + (d.layerName || "#" + d.layerId) + " (hide it before Apply)" : "No depth layer chosen yet."; });
    const source = card("Depth source", [
      segGroup("depth.source", [
        { v: "smart", l: "Smart", t: "Photoshop's Select Subject lifts the subject off a floor plane. Automatic." },
        { v: "layer", l: "Depth layer", t: "A depth map layer, e.g. Filter > Neural Filters > Depth Blur > Output depth map only. Best quality." },
        { v: "brightness", l: "Brightness", t: "1.0 behaviour: bright areas come forward." }
      ], "big"),
      when(el("div", { class: "row wrap" }, [refind]), () => s().depth.source === "smart"),
      when(sliderRow("Subject pop", "depth.pop", 0, 100, 1, "%"), () => s().depth.source === "smart"),
      when(sliderRow("Horizon", "depth.horizon", 0, 90, 1, "%"), () => s().depth.source === "smart"),
      when(el("div", { class: "row wrap" }, [useLayer]), () => s().depth.source === "layer"),
      when(layerLine, () => s().depth.source === "layer"),
      checkRow("Show the depth map in the preview", "view.depth")
    ]);
    const depth = card("Depth", [
      checkRow("Auto range", "depth.auto"),
      sliderRow("Smooth", "depth.smooth", 0, 20, 1, " px"),
      checkRow("Invert (far comes forward)", "depth.invert"),
      when(sliderRow("Levels", "depth.levels", 2, 64, 1, ""), is("contours", "terraces")),
      when(sliderRow("Near", "depth.near", 1, 100, 1, "%"), () => s().depth.auto === false),
      when(sliderRow("Far", "depth.far", 0, 99, 1, "%"), () => s().depth.auto === false)
    ]);
    const style = card("Style", [
      segGroup("style", [{ v: "contours", l: "Contours" }, { v: "terraces", l: "Terraces" }, { v: "relief", l: "Relief" }, { v: "ridges", l: "Ridges" }], "big"),
      segGroup("style", [{ v: "heat", l: "Heat" }, { v: "anaglyph", l: "Anaglyph" }, { v: "haze", l: "Haze" }], "big"),
      when(sliderRow("Photo mix", "photo", 0, 100, 1, "%"), () => !["anaglyph", "haze"].includes(s().style))
    ]);
    const colour = when(card("Colour (far to near)", [
      kit.gradientEditor("look.stops"),
      sliderRow("Fog", "look.fog", 0, 100, 1, "%"),
      kit.colourRow("Fog colour", "look.fogColor")
    ], { section: "colour" }), () => s().style !== "anaglyph");
    const lines = when(card("Lines", [
      sliderRow("Width", "lines.width", 1, 12, 1, " px"),
      when(sliderRow("Every Nth level", "lines.every", 1, 8, 1, ""), is("contours")),
      when(checkRow("Heavier line every 5th level", "lines.index"), is("contours")),
      when(selectRow("Colour by", "lines.colorBy", [{ v: "solid", l: "One colour" }, { v: "depth", l: "Depth gradient" }]), is("contours")),
      when(kit.colourRow("Line colour", "lines.color"), is("contours")),
      when(checkRow("Fill bands with the depth gradient", "lines.fill"), is("contours"))
    ]), is("contours", "ridges"));
    const ridges = when(card("Ridges", [
      sliderRow("Line spacing", "ridges.spacing", 3, 24, 1, " px"),
      sliderRow("Lift", "ridges.lift", 0, 100, 1, "%"),
      selectRow("Line colour", "ridges.colorBy", [{ v: "depth", l: "Depth gradient" }, { v: "photo", l: "Photo colours" }]),
      kit.colourRow("Background", "ridges.bg")
    ]), is("ridges"));
    const light = when(card("Light and shadow", [
      sliderRow("Light angle", "light.angle", 0, 360, 5, "°"),
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
