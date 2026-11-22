"use strict";
const { clone, merge } = require("../core/imgmath.js");
// Settings only. The layer mapping lives in the panel's project (per document),
// and out.* (font names) stays put when you switch presets.
const DEFAULTS = {
  outline: { source: "auto", ink: "auto", threshold: 50, smooth: 1.0, corner: 60, minArea: 6 },
  metrics: { baseline: "auto", capHeight: 700, tracking: 40, space: 260, descent: 25 },
  view: { kind: "whole", bg: "black", size: 72, text: "THE QUICK BROWN FOX AV TO 2026", outline: false },
  out: { source: "flat", hide: false, family: "Brew Lettering", style: "Regular", version: "1.000", designer: "", license: "", url: "" }
};
const PRESETS = [
  { cat: "Clean", name: "Clean Vector", p: { outline: { smooth: 0.8, corner: 70 }, metrics: { tracking: 40 } } },
  { cat: "Hand", name: "Brush Lettering", p: { outline: { smooth: 1.8, corner: 45, minArea: 20 }, metrics: { tracking: 25, space: 230 } } },
  { cat: "Display", name: "Bold Display", p: { outline: { smooth: 1.2, corner: 60 }, metrics: { capHeight: 740, tracking: 15, space: 220 } } },
  { cat: "Retro", name: "Pixel Font", p: { outline: { smooth: 0, threshold: 50, minArea: 1 }, metrics: { tracking: 60, space: 300 } } },
  { cat: "Hand", name: "Rough Stamp", p: { outline: { smooth: 0.4, corner: 80, threshold: 60, minArea: 1 }, metrics: { tracking: 35 } } },
  { cat: "Hand", name: "Soft Marker", p: { outline: { smooth: 2.6, corner: 35, threshold: 40 }, metrics: { tracking: 45 } } },
  { cat: "Display", name: "Wide Spaced", p: { outline: { smooth: 1.0 }, metrics: { capHeight: 650, tracking: 130, space: 400 } } },
  { cat: "Display", name: "Condensed Tight", p: { outline: { smooth: 1.0 }, metrics: { capHeight: 760, tracking: 0, space: 170 } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
