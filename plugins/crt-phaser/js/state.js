"use strict";
const { clone, merge } = require("../core/imgmath.js");
const DEFAULTS = {
  screen: { lines: 240 },
  conv: { x: 1, y: 0 },
  mask: { type: "grille", scale: 1, strength: 45 },
  scan: { strength: 55, width: 45 },
  tube: { bloom: 35, curve: 25, corner: 30, vignette: 35 },
  signal: { noise: 6, roll: 30, rollStrength: 0 },
  finish: { brightness: 115, contrast: 105, tint: "none" },
  view: { kind: "whole", bg: "black", size: 360 },
  out: { source: "flat", layers: "merged", hide: true }
};
const PRESETS = [
  { cat: "Arcade", name: "Arcade Cabinet", p: {} },
  { cat: "TV", name: "Trinitron", p: { screen: { lines: 480 }, mask: { type: "grille", strength: 35 }, scan: { strength: 40 }, tube: { curve: 10, corner: 15, vignette: 20 } } },
  { cat: "TV", name: "Consumer TV", p: { screen: { lines: 300 }, conv: { x: 2, y: 1 }, mask: { type: "shadow", strength: 50 }, tube: { curve: 35, corner: 45, vignette: 45, bloom: 45 }, signal: { noise: 12 } } },
  { cat: "Mono", name: "Green Phosphor", p: { screen: { lines: 200 }, conv: { x: 0 }, mask: { type: "none" }, scan: { strength: 65 }, tube: { bloom: 55 }, finish: { brightness: 120, tint: "green" } } },
  { cat: "Mono", name: "Amber Terminal", p: { screen: { lines: 200 }, conv: { x: 0 }, mask: { type: "none" }, scan: { strength: 60 }, tube: { bloom: 50 }, finish: { tint: "amber" } } },
  { cat: "Pro", name: "Broadcast Monitor", p: { screen: { lines: 576 }, conv: { x: 0 }, mask: { type: "slot", strength: 30 }, scan: { strength: 30, width: 60 }, tube: { curve: 8, corner: 10, vignette: 10, bloom: 20 }, signal: { noise: 2 } } },
  { cat: "TV", name: "Busted VHS Set", p: { screen: { lines: 240 }, conv: { x: 4, y: 2 }, mask: { type: "shadow", strength: 55 }, tube: { curve: 40, corner: 50, vignette: 55, bloom: 50 }, signal: { noise: 30, roll: 62, rollStrength: 70 } } },
  { cat: "Pro", name: "Clean Scanlines", p: { conv: { x: 0 }, mask: { type: "none" }, scan: { strength: 50 }, tube: { curve: 0, corner: 0, vignette: 0, bloom: 15 }, signal: { noise: 0 } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
