"use strict";
const { clone, merge } = require("../core/imgmath.js");
const DEFAULTS = {
  jpeg: { on: true, quality: 12, generations: 3, chroma: "420" },
  crush: { bits: 8 },
  mosh: { amount: 0, dir: 0, block: 16 },
  glitch: { slices: 0, offset: 40, seed: 1 },
  finish: { mix: 100 },
  view: { kind: "whole", bg: "checker", size: 360 },
  out: { source: "flat", hide: true }
};
const PRESETS = [
  { cat: "JPEG", name: "Crunchy JPEG", p: {} },
  { cat: "JPEG", name: "Deep Fried", p: { jpeg: { quality: 3, generations: 8, chroma: "411" }, crush: { bits: 5 } } },
  { cat: "JPEG", name: "Old Webcam", p: { jpeg: { quality: 18, generations: 2, chroma: "411" }, crush: { bits: 6 }, glitch: { slices: 2, offset: 6, seed: 3 } } },
  { cat: "Glitch", name: "Datamosh Drift", p: { jpeg: { quality: 20, generations: 2 }, mosh: { amount: 35, dir: 0, block: 16 }, glitch: { seed: 5 } } },
  { cat: "Glitch", name: "VHS Rip", p: { jpeg: { quality: 30, generations: 1, chroma: "411" }, glitch: { slices: 14, offset: 25, seed: 9 } } },
  { cat: "Retro", name: "8-bit Crush", p: { jpeg: { on: false }, crush: { bits: 2 } } },
  { cat: "Glitch", name: "Broken Stream", p: { jpeg: { quality: 6, generations: 4 }, mosh: { amount: 55, dir: 270, block: 16 }, glitch: { slices: 8, offset: 60, seed: 13 } } },
  { cat: "Retro", name: "Fax Machine", p: { jpeg: { quality: 25, generations: 1, chroma: "411" }, crush: { bits: 1 }, glitch: { slices: 5, offset: 4, seed: 21 } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
