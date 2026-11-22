"use strict";
const { clone, merge } = require("../core/imgmath.js");
// Sizes are px at a 3000 px long side (the engine scales them to the image).
const DEFAULTS = {
  style: "oil",
  seed: 1,
  brush: { size: 40, length: 1, detail: 3, randomness: 30, follow: 70 },
  colour: { simplify: 50, saturation: 15, warmth: 0, jitter: 20, palette: 0 },
  texture: { impasto: 55, light: 135, bristle: 50, canvas: 30, canvasScale: 7, lift: 0 },
  water: { paperColour: "#F7F2E6", density: 85, wetEdge: 60, granulation: 45, bleed: 14, paperTexture: 45, pencil: 40, splashes: 0, splashSize: 70, fade: 45 },
  focus: { falloff: 120, outside: 40 },
  view: { kind: "whole", bg: "white", size: 360 },
  out: { source: "flat", hide: false, focus: "none", printCopy: true, minLong: 2500, minLongWater: 3000, ppi: 300 }
};
const PRESETS = [
  { cat: "Oil", name: "Studio Oil", p: { style: "oil" } },
  { cat: "Oil", name: "Palette Knife", p: { style: "oil", brush: { size: 70, length: 0.7, detail: 2, randomness: 45, follow: 50 }, colour: { simplify: 80, saturation: 25 }, texture: { impasto: 95, bristle: 20, canvas: 15 } } },
  { cat: "Oil", name: "Glaze", p: { style: "oil", brush: { size: 28, length: 1.6, detail: 4, randomness: 15, follow: 85 }, colour: { simplify: 30, saturation: 5, warmth: 10 }, texture: { impasto: 20, bristle: 70, canvas: 45 } } },
  { cat: "Watercolour", name: "Loose Wash", p: { style: "watercolour", brush: { size: 26 }, colour: { simplify: 70, saturation: 10 }, water: { density: 75, fade: 70, pencil: 15, wetEdge: 70 } } },
  { cat: "Watercolour", name: "Ink and Wash", p: { style: "watercolour", brush: { size: 18 }, colour: { simplify: 50, saturation: -35 }, water: { density: 70, pencil: 90, granulation: 30, fade: 40, paperColour: "#F4F1EA" } } },
  { cat: "Watercolour", name: "Splash Pop", p: { style: "watercolour", brush: { size: 22 }, colour: { simplify: 60, saturation: 45 }, water: { density: 95, splashes: 9, splashSize: 80, pencil: 30, fade: 55, wetEdge: 80 } } },
  { cat: "Impressionism", name: "Garden Light", p: { style: "impressionism", brush: { size: 30, length: 1, detail: 3, randomness: 40, follow: 60 }, colour: { simplify: 40, saturation: 30, warmth: 12, jitter: 55 }, texture: { lift: 35, canvas: 25, bristle: 50 } } },
  { cat: "Impressionism", name: "Harbour Morning", p: { style: "impressionism", brush: { size: 32, length: 1.4, detail: 3, randomness: 30, follow: 75 }, colour: { simplify: 45, saturation: 20, warmth: -25, jitter: 45 }, texture: { lift: 25, canvas: 25 } } },
  { cat: "Impressionism", name: "Broken Colour", p: { style: "impressionism", brush: { size: 20, length: 0.8, detail: 4, randomness: 60, follow: 40 }, colour: { simplify: 30, saturation: 40, jitter: 90 }, texture: { lift: 40, canvas: 20 } } }
];
module.exports = { DEFAULTS, PRESETS, clone, merge };
