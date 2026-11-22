"use strict";
// CRT Phaser - panel UI (the image on an old tube; 1.1 adds Phase FX beam lines)
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");

const phaseOn = (s) => s.phase.mode !== "off";

const panel = createToolPanel({
  code: "CRT-06", glow: "#b14cff",
  appName: "Frank's CRT Phaser Brew", title: "Frank's CRT Phaser Brew", sub: "phase fx  /  scanlines  /  phosphor  /  tube", panelId: "crtPhaserPanel",
  presetFile: "presets.json", exportName: "crt-phaser-looks.json",
  footer: "Frank's CRT Phaser Brew 1.1  -  Frank's Brew suite",
  reEdit: true,
  Engine, DEFAULTS, PRESETS, merge, clone,
  cards: (ui, kit) => {
    const { card, sliderRow, selectRow, segGroup, showIf, el } = ui;
    const S = () => kit.state;
    const only = (node, fn) => { showIf(node, () => fn(S())); return node; };
    const phaseCard = card("Phase FX", [
      segGroup("phase.mode", [
        { v: "off", l: "Off", t: "Classic tube render (1.0 looks)" },
        { v: "waveform", l: "Waveform", t: "Beam lines pushed up by brightness" },
        { v: "linear", l: "Linear", t: "Straight raster, line width follows brightness" },
        { v: "flux", l: "Flux", t: "Contour swirls that flow around shapes" },
        { v: "fluxdots", l: "Flux Dots", t: "Flux contours drawn as round phosphor dots" }
      ]),
      only(el("div", {}, [
        sliderRow("Lines (on the full image)", "phase.lines", 20, 600, 5, ""),
        only(sliderRow("Bend", "phase.amp", 0, 100, 1, "%"), (s) => s.phase.mode !== "linear"),
        only(sliderRow("Smoothness", "phase.smooth", 0, 100, 1, "%"), (s) => s.phase.mode === "waveform"),
        segGroup("phase.angle", [
          { v: 0, l: "0\u00b0", t: "Horizontal lines" },
          { v: 45, l: "45\u00b0", t: "Diagonal, falling to the right" },
          { v: 90, l: "90\u00b0", t: "Vertical lines" },
          { v: 135, l: "135\u00b0", t: "Diagonal, rising to the right" }
        ]),
        sliderRow("Angle", "phase.angle", 0, 180, 1, " deg"),
        only(sliderRow("Flow warp", "phase.warp", 0, 100, 1, "%"), (s) => s.phase.mode !== "linear"),
        only(sliderRow("Detail", "phase.detail", 0, 100, 1, "%"), (s) => /^flux/.test(s.phase.mode)),
        sliderRow("Beam width", "phase.width", 5, 100, 1, "%"),
        sliderRow("Threshold", "phase.threshold", 0, 90, 1, "%"),
        only(sliderRow("Dot break-up", "phase.dots", 0, 100, 1, "%"), (s) => s.phase.mode !== "fluxdots"),
        only(sliderRow("Dot size", "phase.dots", 0, 100, 1, "%"), (s) => s.phase.mode === "fluxdots")
      ]), phaseOn)
    ]);
    const lookCard = only(card("Phase look", [
      sliderRow("Glow", "phase.glow", 0, 100, 1, "%"),
      sliderRow("Colour fringe", "phase.fringe", 0, 100, 1, "%"),
      sliderRow("Signal debris", "phase.debris", 0, 100, 1, "%"),
      sliderRow("Prism flare", "phase.flare", 0, 100, 1, "%"),
      sliderRow("Grain", "phase.grain", 0, 100, 1, "%"),
      sliderRow("Seed", "phase.seed", 1, 99, 1, "")
    ]), phaseOn);
    const colourCard = only(card("Phase colour", [
      selectRow("Colour", "phase.color", [{ v: "ramp", l: "Phosphor ramp (dark to hot)" }, { v: "full", l: "Photo's own colours" }]),
      only(kit.gradientEditor("phase.ramp"), (s) => s.phase.color !== "full"),
      kit.colourRow("Screen base", "phase.base")
    ]), phaseOn);
    return [
      phaseCard, lookCard, colourCard,
      only(card("Screen", [sliderRow("Lines (on the full image)", "screen.lines", 60, 1200, 10, "")]), (s) => !phaseOn(s) || s.scan.strength > 0),
      card("Convergence", [
        sliderRow("Red / blue shift X", "conv.x", -10, 10, 0.5, " px"),
        sliderRow("Red / blue shift Y", "conv.y", -10, 10, 0.5, " px")
      ], { bypass: { "conv.x": 0, "conv.y": 0 } }),
      card("Phosphor mask", [
        segGroup("mask.type", [{ v: "grille", l: "Grille", t: "Aperture grille (Trinitron)" }, { v: "shadow", l: "Shadow", t: "Shadow mask (dot triads)" }, { v: "slot", l: "Slot", t: "Slot mask" }, { v: "dots", l: "Dots", t: "Round phosphor dot grid" }, { v: "none", l: "None" }]),
        sliderRow("Scale", "mask.scale", 1, 8, 1, "x"),
        sliderRow("Strength", "mask.strength", 0, 100, 1, "%")
      ], { bypass: { "mask.type": "none" } }),
      card("Scanlines", [
        sliderRow("Strength", "scan.strength", 0, 100, 1, "%"),
        sliderRow("Beam width", "scan.width", 10, 100, 1, "%")
      ], { bypass: { "scan.strength": 0 } }),
      card("Tube", [
        only(sliderRow("Bloom", "tube.bloom", 0, 100, 1, "%"), (s) => !phaseOn(s)),
        sliderRow("Curvature", "tube.curve", 0, 100, 1, "%"),
        sliderRow("Corner radius", "tube.corner", 0, 100, 1, "%"),
        sliderRow("Vignette", "tube.vignette", 0, 100, 1, "%")
      ], { bypass: { "tube.bloom": 0, "tube.curve": 0, "tube.corner": 0, "tube.vignette": 0 } }),
      only(card("Signal", [
        sliderRow("Noise", "signal.noise", 0, 100, 1, "%"),
        sliderRow("Roll band position", "signal.roll", 0, 100, 1, "%"),
        sliderRow("Roll band strength", "signal.rollStrength", 0, 100, 1, "%")
      ], { bypass: { "signal.noise": 0, "signal.rollStrength": 0 } }), (s) => !phaseOn(s)),
      card("Finish", [
        sliderRow("Brightness", "finish.brightness", 50, 200, 1, "%"),
        sliderRow("Contrast", "finish.contrast", 50, 200, 1, "%"),
        only(selectRow("Phosphor colour", "finish.tint", [{ v: "none", l: "Full colour" }, { v: "green", l: "Green mono" }, { v: "amber", l: "Amber mono" }, { v: "white", l: "White mono" }]), (s) => !phaseOn(s))
      ])
    ];
  },
  outputRows: (ui) => [ui.selectRow("Layers", "out.layers", [{ v: "merged", l: "One merged layer" }, { v: "split", l: "Editable stack (separate layers)" }])]
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
