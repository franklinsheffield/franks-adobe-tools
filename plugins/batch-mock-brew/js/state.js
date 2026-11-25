"use strict";
// Batch Mock Brew settings. Folders are kept separately (persistent tokens),
// so setups can be shared across Macs without anyone's paths in them.
const { clone, merge } = require("../core/imgmath.js");

const DEFAULTS = {
  folders: { subfolders: false },
  so: { name: "artwork", rule: "exact", all: true, numbered: false },
  place: { mode: "fit", bg: "transparent", bgHex: "#FFFFFF" },
  export: { format: "jpg", quality: 10, pngAlpha: true, organise: "mockup", skipExisting: false },
  naming: { order: ["mockup", "artwork", "suffix"], delim: "_", suffix: "" },
  // 3.0 (all off by default, so 1.0 setups run exactly as before)
  variants: { on: false, layer: "Colour", list: "Black #111111, White #F5F5F5, Red #C8102E" },
  csv: { on: false, path: "" },
  sizes: { on: false, list: "1080x1080, 1920x1080", keepFull: true },
  sheet: { cell: 240 },
  last: { failed: [] }
};

const PRESETS = [
  { cat: "Setup", name: "Print-on-demand tees", p: { place: { mode: "fill" }, export: { format: "jpg", quality: 10, organise: "artwork" }, naming: { order: ["artwork", "mockup", ""], delim: "-" } } },
  { cat: "Setup", name: "Packaging set", p: { so: { numbered: true }, place: { mode: "fit" }, export: { format: "png", pngAlpha: true, organise: "mockup" } } },
  { cat: "Setup", name: "Layered review", p: { place: { mode: "fit" }, export: { format: "psd", organise: "one" }, naming: { order: ["mockup", "artwork", "suffix"], suffix: "review" } } },
  { cat: "Setup", name: "Social video", p: { place: { mode: "fill" }, export: { format: "mp4", organise: "one" }, naming: { order: ["artwork", "mockup", ""], delim: "_" } } }
];

module.exports = { DEFAULTS, PRESETS, clone, merge };
