"use strict";
// Decompressor - panel UI (JPEG decay, bit crush, datamosh, glitch slices)
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const BRAND = require("./brand.js");
const HELP = require("./help.js");
const { SUITE } = require("./core/brand.js");
const { createToolPanel } = require("./core/toolpanel.js");
const DS = require("./core/depth.js");
let panel = null;
// 3.0 Protect: Select Subject (shared depth.js) only when Protect is on
async function prepareSource(doc, r, phase) {
  const s = panel ? panel._test.state : null;
  if (!s || !s.protect || !s.protect.on) return;
  try { await DS.addSubject(doc, r, phase, BRAND.NAME, false); } catch (e) { console.warn("Select Subject failed: " + (e && e.message)); }
}

panel = createToolPanel({
  code: "DC-05", glow: "#39ff14", ui3: true, help: HELP, version: "3.0",
  autoTone: { on: false },
  appName: BRAND.NAME, title: BRAND.NAME, storeKey: BRAND.LEGACY, sub: "jpeg rot  /  bit crush  /  datamosh", panelId: "decompressorPanel",
  presetFile: "presets.json", exportName: "decompressor-looks.json",
  Engine, DEFAULTS, PRESETS, merge, clone, prepareSource,
  costFactor: (s) => (s.jpeg.on ? 1 + s.jpeg.generations * 1.5 : 1),
  cards: (ui) => {
    const { card, sliderRow, fader, stepper, angle, selectRow, checkRow, segGroup, el, showIf } = ui;
    const when = (n, fn) => { showIf(n, fn); return n; };
    const st = () => panel ? panel._test.state : DEFAULTS;
    return [
      card("JPEG decay", [
        checkRow("Compress", "jpeg.on"),
        checkRow("Real codec (full save every generation)", "jpeg.real"),
        sliderRow("Quality", "jpeg.quality", 1, 100, 1, ""),
        stepper("Generations", "jpeg.generations", 1, 40, 1, "x"),
        when(sliderRow("Deep fry", "jpeg.fry", 0, 100, 1, "%"), () => !!st().jpeg.real),
        selectRow("Chroma", "jpeg.chroma", [{ v: "444", l: "4:4:4 (no bleed)" }, { v: "420", l: "4:2:0 (JPEG)" }, { v: "411", l: "4:1:1 (video smear)" }])
      ], { bypass: { "jpeg.on": false } }),
      card("Bit crush", [
        segGroup("crush.mode", [{ v: "bits", l: "Bits" }, { v: "fax", l: "1-bit Fax" }]),
        when(stepper("Bits per channel", "crush.bits", 1, 8, 1, ""), () => st().crush.mode !== "fax"),
        when(fader("Fax threshold", "crush.fax", 0, 100, 1, "%"), () => st().crush.mode === "fax")
      ], { bypass: { "crush.bits": 8, "crush.mode": "bits" } }),
      card("Pixel sort", [
        checkRow("Sort pixels", "sort.on"),
        when(el("div", { class: "row" }, [el("span", { class: "lbl", text: "Direction" }), segGroup("sort.dir", [{ v: "horizontal", l: "Across" }, { v: "vertical", l: "Down" }])]), () => st().sort.on),
        when(fader("From brightness", "sort.lo", 0, 100, 1, "%"), () => st().sort.on),
        when(fader("To brightness", "sort.hi", 0, 100, 1, "%"), () => st().sort.on),
        when(sliderRow("Max streak", "sort.length", 2, 100, 1, "%"), () => st().sort.on),
        when(checkRow("Bright first", "sort.reverse"), () => st().sort.on)
      ], { bypass: { "sort.on": false } }),
      card("Datamosh", [
        sliderRow("Amount", "mosh.amount", 0, 100, 1, "%"),
        angle("Direction", "mosh.dir", 0, 360, 15),
        el("div", { class: "row" }, [el("span", { class: "lbl", text: "Block" }), segGroup("mosh.block", [{ v: 8, l: "8 px" }, { v: 16, l: "16 px" }])])
      ], { bypass: { "mosh.amount": 0 } }),
      card("Glitch slices", [
        stepper("Slices", "glitch.slices", 0, 40, 1, ""),
        sliderRow("Max offset", "glitch.offset", 0, 300, 1, " px"),
        stepper("Seed", "glitch.seed", 1, 99, 1, "")
      ], { bypass: { "glitch.slices": 0 } }),
      card("Protect", [
        checkRow("Protect the subject (Select Subject)", "protect.on"),
        when(fader("Protection", "protect.amount", 0, 100, 1, "%"), () => st().protect.on),
        when(sliderRow("Feather", "protect.feather", 0, 80, 1, " px"), () => st().protect.on)
      ], { bypass: { "protect.on": false } }),
      card("Finish", [fader("Effect mix", "finish.mix", 0, 100, 1, "%")])
    ];
  }
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
