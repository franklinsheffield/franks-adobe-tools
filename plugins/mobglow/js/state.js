"use strict";
const { clone, merge } = require("../core/imgmath.js");
// Mobglow 2.0 (Frank's spec, 2026-11-22): knob numbers match his reference panel
const DEFAULTS = {
  glow: { radius: 431, strength: 299, threshold: 1.45, gamma: 0.63, sat: 52 },
  color: { on: false, hex: "#E0305A" },
  finish: { grain: 0, darken: 0 },
  view: { kind: "whole", bg: "black", size: 360, split: 0 },
  out: { source: "flat", hide: false }
};
const PRESETS = [
  { cat: "Dreamy", name: "Dreamy", p: {} },
  { cat: "Dreamy", name: "Fog City", p: { glow: { radius: 700, strength: 230, threshold: 1.15, gamma: 0.5, sat: 40 } } },
  { cat: "Neon", name: "Neon Rain", p: { glow: { radius: 260, strength: 320, threshold: 1.2, gamma: 0.8, sat: 85 }, finish: { grain: 25 } } },
  { cat: "Dreamy", name: "Soft Portrait", p: { glow: { radius: 380, strength: 180, threshold: 1.6, gamma: 0.7, sat: 30 } } },
  { cat: "Neon", name: "Hot Lights", p: { glow: { radius: 150, strength: 420, threshold: 1.9, gamma: 1.3, sat: 60 } } },
  { cat: "Tint", name: "Blue Hour", p: { glow: { radius: 520, strength: 300, threshold: 1.2, gamma: 0.6, sat: 52 }, color: { on: true, hex: "#2BB8FF" }, finish: { darken: 15 } } },
  { cat: "Tint", name: "Rose Haze", p: { glow: { radius: 480, strength: 280, threshold: 1.3, gamma: 0.55, sat: 52 }, color: { on: true, hex: "#FF4F9A" } } },
  { cat: "Neon", name: "Neon Edges", p: { glow: { radius: 40, strength: 450, threshold: 1.0, gamma: 1.0, sat: 100 }, finish: { darken: 35 } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
