"use strict";
// Depthtone - panel UI (brightness -> depth: contours, terraces, relief)
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");

const panel = createToolPanel({
  code: "DT-03", glow: "#f5ff3b",
  appName: "Frank's Depthtone Brew", title: "Frank's Depthtone Brew", sub: "contours  /  terraces  /  relief", panelId: "depthtonePanel",
  presetFile: "presets.json", exportName: "depthtone-looks.json",
  Engine, DEFAULTS, PRESETS, merge, clone,
  cards: (ui, kit) => {
    const { card, sliderRow, selectRow, checkRow, segGroup, el, showIf } = ui;
    const linesCard = card("Lines", [
      sliderRow("Width", "lines.width", 1, 12, 1, " px"),
      sliderRow("Every Nth level", "lines.every", 1, 8, 1, ""),
      selectRow("Colour by", "lines.colorBy", [{ v: "solid", l: "One colour" }, { v: "depth", l: "Depth gradient" }]),
      kit.colourRow("Line colour", "lines.color"),
      checkRow("Fill bands with the depth gradient", "lines.fill")
    ]);
    showIf(linesCard, () => kit.state.style === "contours");
    const lightCard = card("Light and shadow", [
      sliderRow("Light angle", "light.angle", 0, 360, 5, "°"),
      sliderRow("Shadow length", "light.shadow", 1, 40, 1, " px"),
      sliderRow("Strength", "light.strength", 0, 100, 1, "%")
    ]);
    showIf(lightCard, () => kit.state.style !== "contours");
    return [
      card("Style", [segGroup("style", [{ v: "contours", l: "Contours" }, { v: "terraces", l: "Terraces" }, { v: "relief", l: "Relief" }], "big")]),
      card("Depth", [
        checkRow("Invert (dark is near)", "depth.invert"),
        sliderRow("Smooth", "depth.smooth", 0, 20, 1, " px"),
        sliderRow("Near", "depth.near", 1, 100, 1, "%"),
        sliderRow("Far", "depth.far", 0, 99, 1, "%"),
        sliderRow("Levels", "depth.levels", 2, 64, 1, "")
      ]),
      card("Colour (far to near)", [
        kit.gradientEditor("look.stops"),
        sliderRow("Fog", "look.fog", 0, 100, 1, "%"),
        kit.colourRow("Fog colour", "look.fogColor")
      ]),
      linesCard, lightCard
    ];
  }
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
