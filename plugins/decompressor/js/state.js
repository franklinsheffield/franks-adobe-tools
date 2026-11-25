"use strict";
const { clone, merge } = require("../core/imgmath.js");
const DEFAULTS = {
  jpeg: { on: true, quality: 12, generations: 3, chroma: "420", real: false, fry: 0 },
  crush: { bits: 8, mode: "bits", fax: 50 },
  sort: { on: false, lo: 25, hi: 80, dir: "horizontal", length: 60, reverse: false },
  protect: { on: false, amount: 100, feather: 12 },
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
  { cat: "Retro", name: "Fax Machine", p: { jpeg: { quality: 25, generations: 1, chroma: "411" }, crush: { bits: 1, mode: "fax", fax: 52 }, glitch: { slices: 5, offset: 4, seed: 21 } } },
  // 3.0 (approved 2026-11-24): real codec generations, true fax, pixel sort
  { cat: "JPEG", name: "Shared 30 Times", p: { jpeg: { real: true, quality: 22, generations: 30, chroma: "420" } } },
  { cat: "JPEG", name: "Deep Fried Real", p: { jpeg: { real: true, quality: 8, generations: 24, chroma: "411", fry: 30 }, crush: { bits: 6 } } },
  { cat: "Sort", name: "Pixel Sort Melt", p: { jpeg: { on: false }, sort: { on: true, lo: 30, hi: 90, dir: "vertical", length: 70 } } },
  { cat: "Sort", name: "Sorted Highlights", p: { jpeg: { quality: 40, generations: 1 }, sort: { on: true, lo: 55, hi: 100, dir: "horizontal", length: 45, reverse: true } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
