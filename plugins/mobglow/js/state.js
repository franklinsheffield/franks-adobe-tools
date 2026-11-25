"use strict";
const { clone, merge } = require("../core/imgmath.js");
// Mobglow 2.0 (Frank's spec, 2026-11-22): knob numbers match his reference panel
const DEFAULTS = {
  glow: { radius: 431, strength: 299, threshold: 1.45, gamma: 0.63, sat: 52, key: "bright", falloff: 50 },
  keycol: { on: false, hex: "#8A4DFF", range: 30 },
  streak: { on: false, length: 60, strength: 40, dir: "h", color: "blue" },
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
  { cat: "Neon", name: "Neon Edges", p: { glow: { radius: 40, strength: 450, threshold: 1.0, gamma: 1.0, sat: 100 }, finish: { darken: 35 } } },
  // 3.0 (approved 2026-11-24): Light Key, key colour, streaks, falloff
  { cat: "Light Key", name: "Neon Bloom", p: { glow: { key: "light", radius: 300, strength: 340, threshold: 1.3, gamma: 0.8, sat: 80, falloff: 40 } } },
  { cat: "Light Key", name: "Haze Lights", p: { glow: { key: "light", radius: 700, strength: 260, threshold: 0.9, gamma: 0.6, sat: 60, falloff: 70 } } },
  { cat: "Light Key", name: "Violet Strip", p: { glow: { key: "light", radius: 360, strength: 380, threshold: 1.0, gamma: 0.8, sat: 90 }, keycol: { on: true, hex: "#8A4DFF", range: 45 } } },
  { cat: "Streaks", name: "Anamorphic", p: { glow: { key: "light", radius: 260, strength: 300, threshold: 1.3, gamma: 0.8, sat: 70 }, streak: { on: true, length: 70, strength: 50, dir: "h", color: "blue" } } },
  { cat: "Streaks", name: "Star Cross", p: { glow: { radius: 200, strength: 320, threshold: 1.7, gamma: 1.0, sat: 60, falloff: 30 }, streak: { on: true, length: 35, strength: 45, dir: "x", color: "own" } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
