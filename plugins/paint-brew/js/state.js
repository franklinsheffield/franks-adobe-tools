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
  ink: { flow: 55, rim: 60, cells: 45, blend: 40, veins: 35, metal: "gold" },
  spray: { cans: 5, soft: 40, overspray: 50, speckle: 40, halftone: 0, drips: 30, dripLength: 50, outline: 30, highlight: 0, wall: "concrete", wallColour: "#A8A49C", relief: 50, bare: 0 },
  pastel: { paper: "#8E8D88", tooth: 60, smudge: 35, pressure: 65, hatch: "follow", angle: 45, oil: false },
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
  { cat: "Impressionism", name: "Broken Colour", p: { style: "impressionism", brush: { size: 20, length: 0.8, detail: 4, randomness: 60, follow: 40 }, colour: { simplify: 30, saturation: 40, jitter: 90 }, texture: { lift: 40, canvas: 20 } } },
  { cat: "Alcohol Ink", name: "Gold Vein", p: { style: "ink", brush: { size: 40 }, colour: { simplify: 55, saturation: 25 }, ink: { flow: 50, rim: 80, cells: 35, blend: 35, veins: 60, metal: "gold" } } },
  { cat: "Alcohol Ink", name: "Ocean Bloom", p: { style: "ink", brush: { size: 46 }, colour: { simplify: 60, saturation: 20, warmth: -30 }, ink: { flow: 85, rim: 55, cells: 85, blend: 50, veins: 0 } } },
  { cat: "Alcohol Ink", name: "Neon Pour", p: { style: "ink", brush: { size: 36 }, colour: { simplify: 50, saturation: 90 }, ink: { flow: 65, rim: 35, cells: 50, blend: 30, veins: 40, metal: "silver" } } },
  { cat: "Spray Paint", name: "Street Stencil", p: { style: "spray", brush: { size: 30 }, colour: { simplify: 60, saturation: 20 }, spray: { cans: 4, soft: 10, overspray: 20, speckle: 25, halftone: 0, drips: 15, dripLength: 40, outline: 70, highlight: 35, wall: "concrete", wallColour: "#A8A49C", relief: 45, bare: 0 } } },
  { cat: "Spray Paint", name: "Soft Fade Mural", p: { style: "spray", brush: { size: 36 }, colour: { simplify: 45, saturation: 30, warmth: 10 }, spray: { cans: 7, soft: 85, overspray: 85, speckle: 45, halftone: 0, drips: 10, dripLength: 40, outline: 0, highlight: 0, wall: "stucco", wallColour: "#D8CCB4", relief: 70, bare: 0 } } },
  { cat: "Spray Paint", name: "Drip Pop", p: { style: "spray", brush: { size: 32 }, colour: { simplify: 55, saturation: 70 }, spray: { cans: 5, soft: 45, overspray: 45, speckle: 60, halftone: 35, drips: 85, dripLength: 90, outline: 40, highlight: 25, wall: "brick", wallColour: "#9C4A36", relief: 55, bare: 0 } } },
  { cat: "Spray Paint", name: "Night Burst", p: { style: "spray", brush: { size: 34 }, colour: { simplify: 55, saturation: 85 }, spray: { cans: 6, soft: 55, overspray: 70, speckle: 85, halftone: 60, drips: 70, dripLength: 85, outline: 55, highlight: 20, wall: "block", wallColour: "#2A2A2C", relief: 40, bare: 100 } } },
  { cat: "Spray Paint", name: "Rough Wall", p: { style: "spray", brush: { size: 40 }, colour: { simplify: 50, saturation: 60 }, spray: { cans: 6, soft: 75, overspray: 65, speckle: 50, halftone: 0, drips: 25, dripLength: 50, outline: 50, highlight: 0, wall: "stucco", wallColour: "#E8E6E1", relief: 90, bare: 0 } } },
  { cat: "Pastel", name: "Chalk on Grey", p: { style: "pastel", brush: { size: 34, length: 1, detail: 3, randomness: 30, follow: 70 }, colour: { simplify: 45, saturation: 15 }, pastel: { paper: "#8E8D88", tooth: 85, smudge: 25, pressure: 60, hatch: "follow", oil: false } } },
  { cat: "Pastel", name: "Warm Sketch", p: { style: "pastel", brush: { size: 30, length: 1.3, detail: 2, randomness: 20, follow: 60 }, colour: { simplify: 50, saturation: 10, warmth: 20 }, pastel: { paper: "#C8AE86", tooth: 60, smudge: 15, pressure: 35, hatch: "fixed", angle: 45, oil: false } } },
  { cat: "Pastel", name: "Oil Pastel", p: { style: "pastel", brush: { size: 40, length: 0.9, detail: 3, randomness: 40, follow: 65 }, colour: { simplify: 40, saturation: 45 }, pastel: { paper: "#EFE6D2", tooth: 40, smudge: 40, pressure: 90, hatch: "follow", oil: true } } }
];
const SWATCHES = {
  paper: [{ v: "#EFE6D2", l: "Cream" }, { v: "#8E8D88", l: "Grey" }, { v: "#C8AE86", l: "Tan" }, { v: "#1E1E1E", l: "Black" }],
  wall: [{ v: "#E8E6E1", l: "White" }, { v: "#A8A49C", l: "Concrete" }, { v: "#D8CCB4", l: "Cream" }, { v: "#9C4A36", l: "Brick" }, { v: "#7D848C", l: "Steel" }, { v: "#8A6A48", l: "Timber" }, { v: "#1C1C1C", l: "Black" }]
};
module.exports = { DEFAULTS, PRESETS, SWATCHES, clone, merge };
