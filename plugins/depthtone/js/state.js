"use strict";
const { clone, merge } = require("../core/imgmath.js");
const S = (p, c) => ({ p, c });
const DEFAULTS = {
  depth: { source: "smart", auto: true, invert: false, smooth: 2, near: 100, far: 0, levels: 12, pop: 50, horizon: 45, detail: 1, layerId: null, layerName: "" },
  style: "terraces",
  photo: 0,
  look: { stops: [S(0, "#1B1F3B"), S(50, "#4F7CAC"), S(100, "#F2E8CF")], fog: 0, fogColor: "#C9D6DF" },
  lines: { width: 2, every: 1, colorBy: "solid", color: "#111111", fill: false, index: true },
  light: { angle: 135, shadow: 6, strength: 60, shine: 30, detail: 100 },
  ridges: { spacing: 7, lift: 40, colorBy: "depth", bg: "#000000" },
  anaglyph: { strength: 40, grey: true },
  haze: { blur: 6, warm: 100, nearTint: "#FFB36B" },
  view: { kind: "whole", bg: "checker", size: 360, depth: false },
  out: { source: "flat", hide: true, depthLayer: false }
};
const NEON = [S(0, "#3A1CFF"), S(50, "#FF2BD6"), S(100, "#FFF26B")];
const PRESETS = [
  // 2.0 looks
  { cat: "Lines", name: "Holo Contours", p: { style: "contours", photo: 35, depth: { levels: 40 }, look: { stops: NEON }, lines: { width: 1.2, colorBy: "depth", fill: false, index: true } } },
  { cat: "Lines", name: "Topo over Photo", p: { style: "contours", photo: 80, depth: { levels: 30 }, look: { stops: [S(0, "#2E5E3E"), S(45, "#B9C48A"), S(75, "#C9A16B"), S(100, "#F4F1E8")] }, lines: { width: 1, colorBy: "solid", color: "#4A2F17", fill: true, index: true } } },
  { cat: "Lines", name: "Ridge Lines", p: { style: "ridges", photo: 0, look: { stops: [S(0, "#FFFFFF"), S(100, "#FFFFFF")] }, ridges: { spacing: 7, lift: 45 }, lines: { width: 2 } } },
  { cat: "Lines", name: "Neon Ridges", p: { style: "ridges", photo: 0, look: { stops: [S(0, "#2A6BFF"), S(50, "#B23BFF"), S(100, "#FF3BD0")] }, ridges: { spacing: 6, lift: 45 }, lines: { width: 2 } } },
  { cat: "Strata", name: "Paper Strata", p: { style: "terraces", photo: 50, depth: { levels: 9 }, look: { stops: [S(0, "#2B1055"), S(40, "#D53A9D"), S(75, "#FF9A3C"), S(100, "#FFE29A")] }, light: { shadow: 10, strength: 90 } } },
  { cat: "Relief", name: "Clay Relief 2", p: { style: "relief", photo: 0, look: { stops: [S(0, "#5A3426"), S(100, "#F0CFAE")] }, light: { strength: 100, shine: 40, detail: 100 } } },
  { cat: "Relief", name: "Chrome Relief", p: { style: "relief", photo: 0, look: { stops: [S(0, "#1B1F2A"), S(40, "#6D7B92"), S(70, "#DFE7F2"), S(100, "#9AA6B8")] }, light: { strength: 100, shine: 90, detail: 100 } } },
  { cat: "Colour", name: "Depth Heat", p: { style: "heat", photo: 60, look: { stops: [S(0, "#30123B"), S(20, "#4662D7"), S(40, "#36AAF9"), S(55, "#1AE4B6"), S(70, "#A2FC3C"), S(82, "#F9BA38"), S(92, "#E4460A"), S(100, "#7A0403")] } } },
  { cat: "Photo", name: "Anaglyph 3D", p: { style: "anaglyph", anaglyph: { strength: 40, grey: true } } },
  { cat: "Photo", name: "Depth Haze", p: { style: "haze", look: { fog: 70, fogColor: "#3B2A6E" }, haze: { blur: 6, warm: 100, nearTint: "#FFB36B" } } },
  // 1.0 looks, same recipes on the new depth
  { cat: "Map", name: "Topo Map", p: { style: "contours", depth: { levels: 20 }, look: { stops: [S(0, "#2E5E3E"), S(45, "#B9C48A"), S(75, "#C9A16B"), S(100, "#F4F1E8")] }, lines: { width: 1, every: 1, colorBy: "solid", color: "#5A3E22", fill: true } } },
  { cat: "Strata", name: "Terrace Stack", p: {} },
  { cat: "Map", name: "Night Contours", p: { style: "contours", depth: { levels: 24 }, look: { stops: [S(0, "#0B1026"), S(100, "#6EE7F9")] }, lines: { width: 2, colorBy: "depth", fill: false } } },
  { cat: "Relief", name: "Clay Relief", p: { style: "relief", depth: { levels: 10, smooth: 4 }, look: { stops: [S(0, "#7A4E3A"), S(100, "#E8C7A8")] }, light: { strength: 75, shine: 10, detail: 30 } } },
  { cat: "Map", name: "Blueprint Lines", p: { style: "contours", depth: { levels: 16 }, look: { stops: [S(0, "#0F3D7A"), S(100, "#0F3D7A")] }, lines: { width: 1, every: 2, colorBy: "solid", color: "#E6F0FF", fill: true } } },
  { cat: "Strata", name: "Sunset Strata", p: { style: "terraces", depth: { levels: 9 }, look: { stops: [S(0, "#2B1055"), S(40, "#D53A9D"), S(75, "#FF9A3C"), S(100, "#FFE29A")] }, light: { shadow: 10 } } },
  { cat: "Strata", name: "Fog Layers", p: { style: "terraces", depth: { levels: 8, smooth: 6 }, look: { stops: [S(0, "#2F3E46"), S(100, "#CAD2C5")], fog: 70, fogColor: "#E5ECE9" }, light: { shadow: 4, strength: 40 } } },
  { cat: "Map", name: "Neon Isolines", p: { style: "contours", depth: { levels: 18 }, look: { stops: [S(0, "#FF00A8"), S(50, "#7B2FF7"), S(100, "#00F0FF")] }, lines: { width: 3, colorBy: "depth", fill: false } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
