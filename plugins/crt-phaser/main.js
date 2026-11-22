"use strict";
// CRT Phaser - panel UI (the image on an old tube)
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");

const panel = createToolPanel({
  code: "CRT-06", glow: "#b14cff",
  appName: "Frank's CRT Phaser Brew", title: "Frank's CRT Phaser Brew", sub: "scanlines  /  phosphor mask  /  tube", panelId: "crtPhaserPanel",
  presetFile: "presets.json", exportName: "crt-phaser-looks.json",
  Engine, DEFAULTS, PRESETS, merge, clone,
  cards: (ui) => {
    const { card, sliderRow, selectRow, segGroup } = ui;
    return [
      card("Screen", [sliderRow("Lines (on the full image)", "screen.lines", 60, 1200, 10, "")]),
      card("Convergence", [
        sliderRow("Red / blue shift X", "conv.x", -10, 10, 0.5, " px"),
        sliderRow("Red / blue shift Y", "conv.y", -10, 10, 0.5, " px")
      ]),
      card("Phosphor mask", [
        segGroup("mask.type", [{ v: "grille", l: "Grille", t: "Aperture grille (Trinitron)" }, { v: "shadow", l: "Shadow", t: "Shadow mask (dot triads)" }, { v: "slot", l: "Slot", t: "Slot mask" }, { v: "none", l: "None" }]),
        sliderRow("Scale", "mask.scale", 1, 8, 1, "x"),
        sliderRow("Strength", "mask.strength", 0, 100, 1, "%")
      ]),
      card("Scanlines", [
        sliderRow("Strength", "scan.strength", 0, 100, 1, "%"),
        sliderRow("Beam width", "scan.width", 10, 100, 1, "%")
      ]),
      card("Tube", [
        sliderRow("Bloom", "tube.bloom", 0, 100, 1, "%"),
        sliderRow("Curvature", "tube.curve", 0, 100, 1, "%"),
        sliderRow("Corner radius", "tube.corner", 0, 100, 1, "%"),
        sliderRow("Vignette", "tube.vignette", 0, 100, 1, "%")
      ]),
      card("Signal", [
        sliderRow("Noise", "signal.noise", 0, 100, 1, "%"),
        sliderRow("Roll band position", "signal.roll", 0, 100, 1, "%"),
        sliderRow("Roll band strength", "signal.rollStrength", 0, 100, 1, "%")
      ]),
      card("Finish", [
        sliderRow("Brightness", "finish.brightness", 50, 200, 1, "%"),
        sliderRow("Contrast", "finish.contrast", 50, 200, 1, "%"),
        selectRow("Phosphor colour", "finish.tint", [{ v: "none", l: "Full colour" }, { v: "green", l: "Green mono" }, { v: "amber", l: "Amber mono" }, { v: "white", l: "White mono" }])
      ])
    ];
  },
  outputRows: (ui) => [ui.selectRow("Layers", "out.layers", [{ v: "merged", l: "One merged layer" }, { v: "split", l: "Screen + Scanlines (multiply)" }])]
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
