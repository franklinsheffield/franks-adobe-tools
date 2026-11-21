"use strict";
const { clone, merge } = require("../core/imgmath.js");
const DEFAULTS = {
  source: { mode: "both", threshold: 65, edge: 40 },
  tint: { mode: "source", color1: "#FF2BD6", color2: "#2BF0FF", sat: 40 },
  halo: { tight: { size: 3, strength: 70 }, mid: { size: 12, strength: 45 }, wide: { size: 40, strength: 30 } },
  fringe: { offset: 0 },
  finish: { grain: 0, darken: 0 },
  view: { kind: "whole", bg: "black", size: 360 },
  out: { source: "flat", hide: false }
};
const PRESETS = [
  { cat: "Neon", name: "Neon Sign", p: { source: { mode: "edges", edge: 60 }, tint: { mode: "one", color1: "#FF2BD6" }, finish: { darken: 35 } } },
  { cat: "Soft", name: "Soft Dream", p: { source: { mode: "highlights", threshold: 55 }, halo: { tight: { strength: 30 }, mid: { size: 20, strength: 50 }, wide: { size: 60, strength: 45 } } } },
  { cat: "Neon", name: "Club Laser", p: { source: { mode: "edges", edge: 80 }, tint: { mode: "two", color1: "#00FF66", color2: "#FF0044" }, fringe: { offset: 3 }, finish: { darken: 50 } } },
  { cat: "Neon", name: "Vapor Pink", p: { tint: { mode: "two", color1: "#FF71CE", color2: "#01CDFE" }, finish: { darken: 20, grain: 20 } } },
  { cat: "Neon", name: "Toxic Green", p: { tint: { mode: "one", color1: "#7CFF00" }, halo: { wide: { size: 30, strength: 50 } }, finish: { darken: 40 } } },
  { cat: "Soft", name: "Ice Halo", p: { source: { mode: "highlights", threshold: 60 }, tint: { mode: "one", color1: "#9BE7FF" }, halo: { wide: { size: 70, strength: 40 } } } },
  { cat: "Soft", name: "Golden Hour", p: { source: { mode: "highlights", threshold: 50 }, tint: { mode: "two", color1: "#FF7A18", color2: "#FFD86F" }, halo: { mid: { size: 18 }, wide: { size: 55, strength: 40 } }, finish: { grain: 10 } } },
  { cat: "Neon", name: "Hologram", p: { source: { mode: "both", edge: 55 }, tint: { mode: "two", color1: "#7B2FF7", color2: "#00F0FF" }, fringe: { offset: 4 }, finish: { grain: 25, darken: 25 } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
