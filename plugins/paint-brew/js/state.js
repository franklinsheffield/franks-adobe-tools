"use strict";
const { clone, merge } = require("../core/imgmath.js");
// Sizes are px at a 3000 px long side (the engine scales them to the image).
const DEFAULTS = {
  style: "oil",
  seed: 1,
  brush: { size: 40, length: 1, detail: 3, randomness: 30, follow: 70, tool: "brush", mix: 30 },
  colour: { simplify: 50, saturation: 15, warmth: 0, jitter: 20, palette: 0 },
  texture: { impasto: 55, light: 135, bristle: 50, canvas: 30, canvasScale: 7, lift: 0, thickLights: 45 },
  water: { paperColour: "#F7F2E6", density: 85, wetEdge: 60, granulation: 45, bleed: 14, paperTexture: 45, pencil: 40, splashes: 0, splashSize: 70, fade: 45 },
  ink: { flow: 55, rim: 60, cells: 45, blend: 40, veins: 35, metal: "gold" },
  spray: { cans: 5, soft: 40, overspray: 50, speckle: 40, halftone: 0, drips: 30, dripLength: 50, outline: 30, highlight: 0, wall: "concrete", wallColour: "#A8A49C", relief: 50, bare: 0,
    blend: "normal", paintOpacity: 100, grime: 20, cracks: 0,
    brickPattern: "running", brickSize: 100, mortar: 45, mortarColour: "#CFC8BA", brickVariation: 50,
    woodDir: "vertical", woodFinish: "raw", plankWidth: 100, grain: 60, knots: 30 },
  pastel: { paper: "#8E8D88", tooth: 60, smudge: 35, pressure: 65, hatch: "follow", angle: 45, oil: false },
  focus: { falloff: 120, outside: 40 },
  view: { kind: "whole", bg: "white", size: 360 },
  out: { source: "flat", hide: false, focus: "none", printCopy: true, minLong: 2500, minLongWater: 3000, ppi: 300 }
};
const PRESETS = [
  { cat: "Oil", name: "Studio Oil", p: { style: "oil" } },
  { cat: "Oil", name: "Palette Knife", p: { style: "oil", brush: { size: 70, length: 0.7, detail: 2, randomness: 45, follow: 50, tool: "knife", mix: 55 }, colour: { simplify: 80, saturation: 25 }, texture: { impasto: 90, bristle: 20, canvas: 15, thickLights: 70 } } },
  { cat: "Oil", name: "Glaze", p: { style: "oil", brush: { size: 28, length: 1.6, detail: 4, randomness: 15, follow: 85, mix: 15 }, colour: { simplify: 30, saturation: 5, warmth: 10 }, texture: { impasto: 20, bristle: 70, canvas: 45, thickLights: 20 } } },
  { cat: "Oil", name: "Coastal Knife", p: { style: "oil", brush: { size: 46, length: 0.9, detail: 3, randomness: 40, follow: 60, tool: "knife", mix: 45 }, colour: { simplify: 55, saturation: 45, warmth: 5 }, texture: { impasto: 75, bristle: 25, canvas: 10, thickLights: 75, lift: 20 } } },
  { cat: "Oil", name: "Golden Hour", p: { style: "oil", brush: { size: 34, length: 1.2, detail: 3, randomness: 25, follow: 75, tool: "brush", mix: 35 }, colour: { simplify: 45, saturation: 30, warmth: 25 }, texture: { impasto: 45, bristle: 55, canvas: 60, thickLights: 55, lift: 55 } } },
  { cat: "Impressionism", name: "Garden Light", p: { style: "impressionism", brush: { size: 30, length: 1, detail: 3, randomness: 40, follow: 60 }, colour: { simplify: 40, saturation: 30, warmth: 12, jitter: 55 }, texture: { lift: 35, canvas: 25, bristle: 50 } } },
  { cat: "Impressionism", name: "Harbour Morning", p: { style: "impressionism", brush: { size: 32, length: 1.4, detail: 3, randomness: 30, follow: 75 }, colour: { simplify: 45, saturation: 20, warmth: -25, jitter: 45 }, texture: { lift: 25, canvas: 25 } } },
  { cat: "Impressionism", name: "Broken Colour", p: { style: "impressionism", brush: { size: 20, length: 0.8, detail: 4, randomness: 60, follow: 40 }, colour: { simplify: 30, saturation: 40, jitter: 90 }, texture: { lift: 40, canvas: 20 } } },
  { cat: "Alcohol Ink", name: "Gold Vein", p: { style: "ink", brush: { size: 40 }, colour: { simplify: 55, saturation: 25 }, ink: { flow: 50, rim: 80, cells: 35, blend: 35, veins: 60, metal: "gold" } } },
  { cat: "Alcohol Ink", name: "Ocean Bloom", p: { style: "ink", brush: { size: 46 }, colour: { simplify: 60, saturation: 20, warmth: -30 }, ink: { flow: 85, rim: 55, cells: 85, blend: 50, veins: 0 } } },
  { cat: "Alcohol Ink", name: "Neon Pour", p: { style: "ink", brush: { size: 36 }, colour: { simplify: 50, saturation: 90 }, ink: { flow: 65, rim: 35, cells: 50, blend: 30, veins: 40, metal: "silver" } } },
  { cat: "Spray Paint", name: "Street Stencil", p: { style: "spray", brush: { size: 30 }, colour: { simplify: 60, saturation: 20 }, spray: { cans: 4, soft: 10, overspray: 20, speckle: 25, halftone: 0, drips: 15, dripLength: 40, outline: 70, highlight: 35, wall: "concrete", wallColour: "#A8A49C", relief: 45, bare: 0 } } },
  { cat: "Spray Paint", name: "Soft Fade Mural", p: { style: "spray", brush: { size: 36 }, colour: { simplify: 45, saturation: 30, warmth: 10 }, spray: { cans: 7, soft: 85, overspray: 85, speckle: 45, halftone: 0, drips: 10, dripLength: 40, outline: 0, highlight: 0, wall: "stucco", wallColour: "#D8CCB4", relief: 70, bare: 0 } } },
  { cat: "Spray Paint", name: "Drip Pop", p: { style: "spray", brush: { size: 32 }, colour: { simplify: 55, saturation: 70 }, spray: { cans: 5, soft: 45, overspray: 45, speckle: 60, halftone: 35, drips: 85, dripLength: 90, outline: 40, highlight: 25, wall: "brick", wallColour: "#9C4A36", relief: 55, bare: 0, grime: 35, brickVariation: 65 } } },
  { cat: "Spray Paint", name: "Night Burst", p: { style: "spray", brush: { size: 34 }, colour: { simplify: 55, saturation: 85 }, spray: { cans: 6, soft: 55, overspray: 70, speckle: 85, halftone: 60, drips: 70, dripLength: 85, outline: 55, highlight: 20, wall: "block", wallColour: "#2A2A2C", relief: 40, bare: 100 } } },
  { cat: "Spray Paint", name: "Rough Wall", p: { style: "spray", brush: { size: 40 }, colour: { simplify: 50, saturation: 60 }, spray: { cans: 6, soft: 75, overspray: 65, speckle: 50, halftone: 0, drips: 25, dripLength: 50, outline: 50, highlight: 0, wall: "stucco", wallColour: "#E8E6E1", relief: 90, bare: 0, grime: 45, cracks: 40 } } },
  { cat: "Spray Paint", name: "Barn Siding", p: { style: "spray", brush: { size: 34 }, colour: { simplify: 50, saturation: 40 }, spray: { cans: 5, soft: 50, overspray: 55, speckle: 35, halftone: 0, drips: 30, dripLength: 60, outline: 30, highlight: 0, wall: "wood", wallColour: "#8E2F25", relief: 60, bare: 0, blend: "hardlight", paintOpacity: 92, grime: 30, woodDir: "horizontal", woodFinish: "painted", plankWidth: 110, grain: 50, knots: 20 } } },
  { cat: "Spray Paint", name: "Old Fence", p: { style: "spray", brush: { size: 36 }, colour: { simplify: 55, saturation: 55 }, spray: { cans: 5, soft: 60, overspray: 60, speckle: 40, halftone: 0, drips: 40, dripLength: 70, outline: 35, highlight: 15, wall: "wood", wallColour: "#8A6A48", relief: 70, bare: 0, blend: "softlight", paintOpacity: 100, grime: 40, cracks: 40, woodDir: "vertical", woodFinish: "weathered", plankWidth: 100, grain: 75, knots: 60 } } },
  { cat: "Pastel", name: "Chalk on Grey", p: { style: "pastel", brush: { size: 34, length: 1, detail: 3, randomness: 30, follow: 70 }, colour: { simplify: 45, saturation: 15 }, pastel: { paper: "#8E8D88", tooth: 85, smudge: 25, pressure: 60, hatch: "follow", oil: false } } },
  { cat: "Pastel", name: "Warm Sketch", p: { style: "pastel", brush: { size: 30, length: 1.3, detail: 2, randomness: 20, follow: 60 }, colour: { simplify: 50, saturation: 10, warmth: 20 }, pastel: { paper: "#C8AE86", tooth: 60, smudge: 15, pressure: 35, hatch: "fixed", angle: 45, oil: false } } },
  { cat: "Pastel", name: "Oil Pastel", p: { style: "pastel", brush: { size: 40, length: 0.9, detail: 3, randomness: 40, follow: 65 }, colour: { simplify: 40, saturation: 45 }, pastel: { paper: "#EFE6D2", tooth: 40, smudge: 40, pressure: 90, hatch: "follow", oil: true } } }
];
const SWATCHES = {
  paper: [{ v: "#EFE6D2", l: "Cream" }, { v: "#8E8D88", l: "Grey" }, { v: "#C8AE86", l: "Tan" }, { v: "#1E1E1E", l: "Black" }],
  wall: [{ v: "#E8E6E1", l: "White" }, { v: "#A8A49C", l: "Concrete" }, { v: "#D8CCB4", l: "Cream" }, { v: "#9C4A36", l: "Brick" }, { v: "#7D848C", l: "Steel" }, { v: "#8A6A48", l: "Timber" }, { v: "#C2A26E", l: "Yellow brick" }, { v: "#5E2A20", l: "Dark brick" }, { v: "#8E2F25", l: "Barn red" }, { v: "#1C1C1C", l: "Black" }],
  mortar: [{ v: "#E6E1D6", l: "White" }, { v: "#CFC8BA", l: "Light" }, { v: "#C2AE8C", l: "Sand" }, { v: "#8F8C86", l: "Grey" }, { v: "#3E3C39", l: "Dark" }]
};
module.exports = { DEFAULTS, PRESETS, SWATCHES, clone, merge };
