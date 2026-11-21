"use strict";
// Decompressor - panel UI (JPEG decay, bit crush, datamosh, glitch slices)
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");

const panel = createToolPanel({
  appName: "Frank's Decompressor Brew", title: "Frank's Decompressor Brew", sub: "jpeg rot  /  bit crush  /  datamosh", panelId: "decompressorPanel",
  presetFile: "presets.json", exportName: "decompressor-looks.json",
  Engine, DEFAULTS, PRESETS, merge, clone,
  costFactor: (s) => (s.jpeg.on ? 1 + s.jpeg.generations * 1.5 : 1),
  cards: (ui) => {
    const { card, sliderRow, selectRow, checkRow, segGroup, el } = ui;
    return [
      card("JPEG decay", [
        checkRow("Compress", "jpeg.on"),
        sliderRow("Quality", "jpeg.quality", 1, 100, 1, ""),
        sliderRow("Generations", "jpeg.generations", 1, 20, 1, "x"),
        selectRow("Chroma", "jpeg.chroma", [{ v: "444", l: "4:4:4 (no bleed)" }, { v: "420", l: "4:2:0 (JPEG)" }, { v: "411", l: "4:1:1 (video smear)" }])
      ]),
      card("Bit crush", [sliderRow("Bits per channel", "crush.bits", 1, 8, 1, "")]),
      card("Datamosh", [
        sliderRow("Amount", "mosh.amount", 0, 100, 1, "%"),
        sliderRow("Direction", "mosh.dir", 0, 360, 15, "°"),
        el("div", { class: "row" }, [el("span", { class: "lbl", text: "Block" }), segGroup("mosh.block", [{ v: 8, l: "8 px" }, { v: 16, l: "16 px" }])])
      ]),
      card("Glitch slices", [
        sliderRow("Slices", "glitch.slices", 0, 40, 1, ""),
        sliderRow("Max offset", "glitch.offset", 0, 300, 1, " px"),
        sliderRow("Seed", "glitch.seed", 1, 99, 1, "")
      ]),
      card("Finish", [sliderRow("Effect mix", "finish.mix", 0, 100, 1, "%")])
    ];
  }
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
