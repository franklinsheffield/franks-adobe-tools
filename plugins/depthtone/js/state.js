"use strict";
const { clone, merge } = require("../core/imgmath.js");
const S = (p, c) => ({ p, c });
const DEFAULTS = {
  depth: { invert: false, smooth: 3, near: 100, far: 0, levels: 12 },
  style: "terraces",
  look: { stops: [S(0, "#1B1F3B"), S(50, "#4F7CAC"), S(100, "#F2E8CF")], fog: 0, fogColor: "#C9D6DF" },
  lines: { width: 2, every: 1, colorBy: "solid", color: "#111111", fill: false },
  light: { angle: 135, shadow: 6, strength: 60 },
  view: { kind: "whole", bg: "checker", size: 360 },
  out: { source: "flat", hide: true }
};
const PRESETS = [
  { cat: "Map", name: "Topo Map", p: { style: "contours", depth: { levels: 20 }, look: { stops: [S(0, "#2E5E3E"), S(45, "#B9C48A"), S(75, "#C9A16B"), S(100, "#F4F1E8")] }, lines: { width: 1, every: 1, colorBy: "solid", color: "#5A3E22", fill: true } } },
  { cat: "Map", name: "Terrace Stack", p: {} },
  { cat: "Map", name: "Night Contours", p: { style: "contours", depth: { levels: 24 }, look: { stops: [S(0, "#0B1026"), S(100, "#6EE7F9")] }, lines: { width: 2, colorBy: "depth", fill: false } } },
  { cat: "Relief", name: "Clay Relief", p: { style: "relief", depth: { levels: 10, smooth: 4 }, look: { stops: [S(0, "#7A4E3A"), S(100, "#E8C7A8")] }, light: { strength: 75 } } },
  { cat: "Map", name: "Blueprint Lines", p: { style: "contours", depth: { levels: 16 }, look: { stops: [S(0, "#0F3D7A"), S(100, "#0F3D7A")] }, lines: { width: 1, every: 2, colorBy: "solid", color: "#E6F0FF", fill: true } } },
  { cat: "Strata", name: "Sunset Strata", p: { style: "terraces", depth: { levels: 9 }, look: { stops: [S(0, "#2B1055"), S(40, "#D53A9D"), S(75, "#FF9A3C"), S(100, "#FFE29A")] }, light: { shadow: 10 } } },
  { cat: "Strata", name: "Fog Layers", p: { style: "terraces", depth: { levels: 8, smooth: 6 }, look: { stops: [S(0, "#2F3E46"), S(100, "#CAD2C5")], fog: 70, fogColor: "#E5ECE9" }, light: { shadow: 4, strength: 40 } } },
  { cat: "Map", name: "Neon Isolines", p: { style: "contours", depth: { levels: 18 }, look: { stops: [S(0, "#FF00A8"), S(50, "#7B2FF7"), S(100, "#00F0FF")] }, lines: { width: 3, colorBy: "depth", fill: false } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
