"use strict";
// Mobglow - panel UI (neon / bloom glow over the untouched original)
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");

const panel = createToolPanel({
  code: "MG-04", glow: "#ff2fd6",
  appName: "Frank's Mobglow Brew", title: "Frank's Mobglow Brew", sub: "neon  /  bloom  /  halo glow", panelId: "mobglowPanel",
  presetFile: "presets.json", exportName: "mobglow-looks.json",
  Engine, DEFAULTS, PRESETS, merge, clone,
  cards: (ui, kit) => {
    const { card, sliderRow, segGroup, el, showIf } = ui;
    const halo = (name, key, max) => [
      el("div", { class: "lbl3", text: name }),
      sliderRow("Size", "halo." + key + ".size", 1, max, 1, " px"),
      sliderRow("Strength", "halo." + key + ".strength", 0, 100, 1, "%")
    ];
    const c1 = kit.colourRow("Colour 1", "tint.color1"), c2 = kit.colourRow("Colour 2", "tint.color2"), sat = sliderRow("Saturation boost", "tint.sat", 0, 100, 1, "%");
    showIf(c1, () => kit.state.tint.mode !== "source");
    showIf(c2, () => kit.state.tint.mode === "two");
    showIf(sat, () => kit.state.tint.mode === "source");
    return [
      card("Glow source", [
        segGroup("source.mode", [{ v: "highlights", l: "Highlights" }, { v: "edges", l: "Edges" }, { v: "both", l: "Both" }]),
        sliderRow("Threshold", "source.threshold", 0, 100, 1, "%"),
        sliderRow("Edge strength", "source.edge", 0, 100, 1, "%")
      ]),
      card("Tint", [segGroup("tint.mode", [{ v: "source", l: "Source colour" }, { v: "one", l: "One colour" }, { v: "two", l: "Two-colour" }]), c1, c2, sat]),
      card("Halos", [].concat(halo("Tight", "tight", 20), halo("Mid", "mid", 60), halo("Wide", "wide", 150))),
      card("Finish", [
        sliderRow("RGB fringe", "fringe.offset", 0, 20, 1, " px"),
        sliderRow("Grain", "finish.grain", 0, 100, 1, "%"),
        sliderRow("Darken background", "finish.darken", 0, 100, 1, "%")
      ], { bypass: { "fringe.offset": 0, "finish.grain": 0, "finish.darken": 0 } })
    ];
  }
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
