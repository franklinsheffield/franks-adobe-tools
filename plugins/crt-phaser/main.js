"use strict";
// CRT Phaser - panel UI (the image on an old tube; 1.1 adds Phase FX beam lines)
// Brew 3.0 pilot (2026-11-24): Night Arcade style, 7 zones, one control per job
// (knob = character, fader = mix %, stepper = exact counts, angle dial), max 6
// primary controls per effect with the rest in Advanced, hover help from help.js.
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");
const BRAND = require("./brand.js");
const { SUITE } = require("./core/brand.js");
const HELP = require("./help.js");

const phaseOn = (s) => s.phase.mode !== "off";
const lidar = (s) => s.phase.mode === "lidar";

const panel = createToolPanel({
  code: "CRT-06", glow: "#bc71fe", ui3: true, help: HELP, version: "3.0",
  autoTone: { on: (s) => !!(s.phase && s.phase.mode !== "off") },
  appName: BRAND.NAME, title: BRAND.NAME, storeKey: BRAND.LEGACY, sub: "phase fx  /  scanlines  /  phosphor  /  tube", panelId: "crtPhaserPanel",
  presetFile: "presets.json", exportName: "crt-phaser-looks.json",
  footer: BRAND.NAME + " 3.0  -  " + SUITE,
  reEdit: true,
  Engine, DEFAULTS, PRESETS, merge, clone,
  cards: (ui, kit) => {
    const { card, sliderRow, fader, stepper, angle, selectRow, segGroup, showIf, el } = ui;
    const S = () => kit.state;
    const only = (node, fn) => { showIf(node, () => fn(S())); return node; };
    const phaseCard = card("Phase FX", [
      segGroup("phase.mode", [
        { v: "off", l: "Off", t: "Classic tube render (1.0 looks)" },
        { v: "waveform", l: "Wave", t: "Beam lines pushed up by brightness" },
        { v: "linear", l: "Linear", t: "Straight raster, line width follows brightness" },
        { v: "flux", l: "Flux", t: "Contour swirls that flow around shapes" },
        { v: "lidar", l: "Lidar", t: "Dots on scan rings shaped by depth, sparser and smaller far away" }
      ]),
      only(stepper("Lines", "phase.lines", 20, 600, 5, ""), (s) => phaseOn(s) && !lidar(s)),
      only(stepper("Rings", "phase.lines", 20, 600, 5, ""), lidar),
      only(sliderRow("Bend", "phase.amp", 0, 100, 1, "%"), (s) => phaseOn(s) && s.phase.mode !== "linear" && !lidar(s)),
      only(angle("Angle", "phase.angle", 0, 180, 1), phaseOn),
      only(sliderRow("Beam width", "phase.width", 5, 100, 1, "%"), (s) => phaseOn(s) && !lidar(s)),
      only(sliderRow("Dot size", "phase.width", 5, 100, 1, "%"), lidar),
      only(sliderRow("Spacing", "phase.dots", 0, 100, 1, "%"), lidar),
      only(sliderRow("Dropout", "phase.drop", 0, 100, 1, "%"), lidar),
      only(sliderRow("Flow warp", "phase.warp", 0, 100, 1, "%"), (s) => phaseOn(s) && s.phase.mode !== "linear" && !lidar(s)),
      only(sliderRow("Unstable", "phase.unstable", 0, 100, 1, "%"), phaseOn)
    ], { advanced: [
      only(sliderRow("Chaos", "phase.chaos", 0, 100, 1, "%"), (s) => phaseOn(s) && s.phase.unstable > 0),
      only(sliderRow("Background calm", "phase.calm", 0, 100, 1, "%"), (s) => phaseOn(s) && !lidar(s) && s.phase.mode !== "fluxdots"),
      only(sliderRow("Threshold", "phase.threshold", 0, 90, 1, "%"), phaseOn),
      only(sliderRow("Depth bend", "phase.amp", 0, 100, 1, "%"), lidar),
      only(sliderRow("Smoothness", "phase.smooth", 0, 100, 1, "%"), (s) => s.phase.mode === "waveform"),
      only(sliderRow("Detail", "phase.detail", 0, 100, 1, "%"), (s) => /^flux/.test(s.phase.mode)),
      only(sliderRow("Dot break-up", "phase.dots", 0, 100, 1, "%"), (s) => phaseOn(s) && !lidar(s) && s.phase.mode !== "fluxdots"),
      only(sliderRow("Dot size", "phase.dots", 0, 100, 1, "%"), (s) => s.phase.mode === "fluxdots")
    ] });
    const lookCard = only(card("Phase look", [
      sliderRow("Glow", "phase.glow", 0, 100, 1, "%"),
      sliderRow("Colour fringe", "phase.fringe", 0, 100, 1, "%"),
      sliderRow("Signal debris", "phase.debris", 0, 100, 1, "%"),
      sliderRow("Prism flare", "phase.flare", 0, 100, 1, "%"),
      only(segGroup("phase.flareAt", [{ v: "random", l: "Random", t: "Flares land at random spots" }, { v: "bright", l: "Highlights", t: "Flares sit on the brightest highlights" }]), (s) => s.phase.flare > 0),
      sliderRow("Grain", "phase.grain", 0, 100, 1, "%"),
      stepper("Seed", "phase.seed", 1, 99, 1, "")
    ]), phaseOn);
    const colourCard = only(card("Phase colour", [
      segGroup("phase.color", [{ v: "ramp", l: "Ramp", t: "Dark to hot colours from the ramp below, by brightness (Lidar: by return intensity)" }, { v: "depth", l: "Distance", t: "Lidar: near dots take the hot end of the ramp, far dots the dim end" }, { v: "full", l: "Photo", t: "Keep the photo's own colours" }]),
      only(kit.gradientEditor("phase.ramp"), (s) => s.phase.color !== "full"),
fader("Photo mix", "phase.photo", 0, 100, 1, "%"),
            kit.colourRow("Screen base", "phase.base")
    ], { section: "colour" }), phaseOn);
    return [
      phaseCard, lookCard,
      only(card("Screen", [segGroup("screen.lines", [{ v: 240, l: "240", t: "Low-res arcade / TV rows" }, { v: 480, l: "480", t: "Standard-definition rows" }, { v: 720, l: "720", t: "HD monitor rows" }]), stepper("Lines", "screen.lines", 60, 1200, 10, "")]), (s) => !phaseOn(s) || s.scan.strength > 0),
      card("Convergence", [
        stepper("Red / blue X", "conv.x", -10, 10, 0.5, "px"),
        stepper("Red / blue Y", "conv.y", -10, 10, 0.5, "px")
      ], { bypass: { "conv.x": 0, "conv.y": 0 } }),
      card("Mask", [
        segGroup("mask.type", [{ v: "grille", l: "Grille", t: "Aperture grille (Trinitron)" }, { v: "shadow", l: "Shadow", t: "Shadow mask (dot triads)" }, { v: "slot", l: "Slot", t: "Slot mask" }, { v: "dots", l: "Dots", t: "Round phosphor dot grid" }, { v: "none", l: "None" }]),
        stepper("Scale", "mask.scale", 1, 8, 1, "x"),
        fader("Strength", "mask.strength", 0, 100, 1, "%")
      ], { bypass: { "mask.type": "none" } }),
      card("Scanlines", [
        fader("Strength", "scan.strength", 0, 100, 1, "%"),
        sliderRow("Beam width", "scan.width", 10, 100, 1, "%")
      ], { bypass: { "scan.strength": 0 } }),
      card("Tube", [
        only(sliderRow("Bloom", "tube.bloom", 0, 100, 1, "%"), (s) => !phaseOn(s)),
        sliderRow("Curvature", "tube.curve", 0, 100, 1, "%"),
        sliderRow("Corners", "tube.corner", 0, 100, 1, "%"),
        sliderRow("Vignette", "tube.vignette", 0, 100, 1, "%")
      ], { bypass: { "tube.bloom": 0, "tube.curve": 0, "tube.corner": 0, "tube.vignette": 0 } }),
      only(card("Signal", [
        sliderRow("Noise", "signal.noise", 0, 100, 1, "%"),
        sliderRow("Roll strength", "signal.rollStrength", 0, 100, 1, "%"),
        fader("Roll position", "signal.roll", 0, 100, 1, "%")
      ], { bypass: { "signal.noise": 0, "signal.rollStrength": 0 } }), (s) => !phaseOn(s)),
      card("Finish", [
        sliderRow("Brightness", "finish.brightness", 50, 200, 1, "%"),
        sliderRow("Contrast", "finish.contrast", 50, 200, 1, "%"),
        only(segGroup("finish.tint", [{ v: "none", l: "Colour" }, { v: "green", l: "Green" }, { v: "amber", l: "Amber" }, { v: "white", l: "White" }]), (s) => !phaseOn(s))
      ]),
      colourCard
    ];
  },
  outputRows: (ui) => [ui.segGroup("out.layers", [{ v: "merged", l: "Merged layer" }, { v: "split", l: "Editable stack" }])]
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
