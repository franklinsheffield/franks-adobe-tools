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
  // 1.1 Phase FX: "off" keeps the classic tube render exactly as in 1.0
  phase: {
    mode: "off", lines: 150, amp: 40, smooth: 40, width: 45, threshold: 10, angle: 0, warp: 15, detail: 50,
    dots: 35, drop: 30, unstable: 0, chaos: 50, glow: 55, fringe: 30, debris: 0, flare: 0, flareAt: "random", photo: 0, calm: 0, grain: 25, seed: 7,
    color: "ramp", ramp: [{ p: 0, c: "#000000" }, { p: 20, c: "#3A0A00" }, { p: 50, c: "#D2400C" }, { p: 75, c: "#FF9A2E" }, { p: 100, c: "#FFF3D6" }], base: "#000000"
  },
  view: { kind: "whole", bg: "black", size: 360 },
  out: { source: "flat", layers: "merged", hide: true }
};
const R = (...a) => a.map(([p, c]) => ({ p, c }));
const RAMPS = {
  ember: R([0, "#000000"], [15, "#3A0A00"], [45, "#C2330A"], [70, "#FF8A1F"], [88, "#FFD27A"], [100, "#FFF6E0"]),
  ice: R([0, "#000000"], [15, "#001A3A"], [45, "#0A6FD0"], [70, "#2FD6FF"], [90, "#B8F6FF"], [100, "#FFFFFF"]),
  scope: R([0, "#000000"], [20, "#002A0A"], [60, "#10C040"], [85, "#8DFF9A"], [100, "#F0FFF0"]),
  violet: R([0, "#000000"], [15, "#1A0533"], [45, "#6A1BD0"], [75, "#E04CE0"], [100, "#FFD0F4"]),
  gold: R([0, "#000000"], [15, "#2A1500"], [50, "#C07A10"], [80, "#FFC23D"], [100, "#FFF2C0"]),
  blue: R([0, "#000000"], [15, "#00103A"], [50, "#1F4DFF"], [80, "#3FC8FF"], [100, "#E8FBFF"]),
  white: R([0, "#000000"], [20, "#202428"], [60, "#9AA4AD"], [100, "#FFFFFF"]),
  sunset: R([0, "#000000"], [15, "#2B0020"], [45, "#D0186F"], [75, "#FF7A2A"], [100, "#FFE6C0"]),
  heat: R([0, "#000000"], [10, "#1A0040"], [25, "#6A00A8"], [45, "#D0103A"], [65, "#FF7A00"], [85, "#FFE14A"], [100, "#FFFFFF"]),
  plasma: R([0, "#000000"], [15, "#2A0030"], [45, "#FF2FA0"], [65, "#8A5CFF"], [85, "#2FE6FF"], [100, "#FFFFFF"]),
  teal: R([0, "#000000"], [15, "#00241E"], [45, "#0FA08A"], [75, "#3DFF9A"], [100, "#E8FFF2"]),
  spectrum: R([0, "#000000"], [10, "#30123B"], [28, "#4669DB"], [45, "#1AE4B6"], [62, "#A2FC3C"], [78, "#FBB938"], [92, "#E4460A"], [100, "#7A0403"])
};
// shared screen dressing for the Phase looks (on top of DEFAULTS)
function phaseLook(phase, extra) {
  return merge({
    screen: { lines: 480 }, conv: { x: 0.5, y: 0 }, mask: { type: "dots", scale: 1, strength: 40 },
    scan: { strength: 18, width: 60 }, tube: { bloom: 0, curve: 6, corner: 8, vignette: 30 },
    signal: { noise: 0, roll: 30, rollStrength: 0 }, finish: { brightness: 100, contrast: 100, tint: "none" }
  }, merge({ phase }, extra || {}));
}
const PRESETS = [
  { cat: "Arcade", name: "Arcade Cabinet", p: {} },
  { cat: "TV", name: "Trinitron", p: { screen: { lines: 480 }, mask: { type: "grille", strength: 35 }, scan: { strength: 40 }, tube: { curve: 10, corner: 15, vignette: 20 } } },
  { cat: "TV", name: "Consumer TV", p: { screen: { lines: 300 }, conv: { x: 2, y: 1 }, mask: { type: "shadow", strength: 50 }, tube: { curve: 35, corner: 45, vignette: 45, bloom: 45 }, signal: { noise: 12 } } },
  { cat: "Mono", name: "Green Phosphor", p: { screen: { lines: 200 }, conv: { x: 0 }, mask: { type: "none" }, scan: { strength: 65 }, tube: { bloom: 55 }, finish: { brightness: 120, tint: "green" } } },
  { cat: "Mono", name: "Amber Terminal", p: { screen: { lines: 200 }, conv: { x: 0 }, mask: { type: "none" }, scan: { strength: 60 }, tube: { bloom: 50 }, finish: { tint: "amber" } } },
  { cat: "Pro", name: "Broadcast Monitor", p: { screen: { lines: 576 }, conv: { x: 0 }, mask: { type: "slot", strength: 30 }, scan: { strength: 30, width: 60 }, tube: { curve: 8, corner: 10, vignette: 10, bloom: 20 }, signal: { noise: 2 } } },
  { cat: "TV", name: "Busted VHS Set", p: { screen: { lines: 240 }, conv: { x: 4, y: 2 }, mask: { type: "shadow", strength: 55 }, tube: { curve: 40, corner: 50, vignette: 55, bloom: 50 }, signal: { noise: 30, roll: 62, rollStrength: 70 } } },
  { cat: "Pro", name: "Clean Scanlines", p: { conv: { x: 0 }, mask: { type: "none" }, scan: { strength: 50 }, tube: { curve: 0, corner: 0, vignette: 0, bloom: 15 }, signal: { noise: 0 } } },
  // ---- 1.1 Phase FX looks: 5 Waveform, 5 Linear, 5 Flux
  { cat: "Waveform", name: "Ember Trace", p: phaseLook({ mode: "waveform", lines: 150, amp: 60, smooth: 35, width: 50, threshold: 8, dots: 35, glow: 70, fringe: 35, grain: 35, ramp: RAMPS.ember, base: "#0E0503" }) },
  { cat: "Waveform", name: "Ice Pulse", p: phaseLook({ mode: "waveform", lines: 190, amp: 50, smooth: 25, width: 40, threshold: 10, dots: 55, glow: 60, fringe: 45, debris: 35, grain: 20, ramp: RAMPS.ice, base: "#01040A" }, { mask: { strength: 60 } }) },
  { cat: "Waveform", name: "Scope Green", p: phaseLook({ mode: "waveform", lines: 110, amp: 30, smooth: 55, width: 25, threshold: 12, dots: 10, glow: 45, fringe: 0, grain: 15, ramp: RAMPS.scope }, { mask: { type: "grille", strength: 30 }, conv: { x: 0 } }) },
  { cat: "Waveform", name: "Deep Field", p: phaseLook({ mode: "waveform", lines: 80, amp: 85, smooth: 60, width: 55, threshold: 6, dots: 30, glow: 75, fringe: 30, grain: 30, ramp: RAMPS.violet, base: "#06020C" }) },
  { cat: "Waveform", name: "Static Bloom", p: phaseLook({ mode: "waveform", lines: 160, amp: 40, smooth: 35, width: 55, threshold: 5, dots: 25, glow: 95, fringe: 40, grain: 40, color: "full" }) },
  { cat: "Linear", name: "Raster Gold", p: phaseLook({ mode: "linear", lines: 120, width: 70, threshold: 6, dots: 15, glow: 55, fringe: 20, grain: 25, ramp: RAMPS.gold, base: "#0A0602" }, { mask: { type: "grille", strength: 30 } }) },
  { cat: "Linear", name: "Broadcast Blue", p: phaseLook({ mode: "linear", lines: 220, width: 55, threshold: 8, dots: 30, glow: 50, fringe: 35, grain: 15, ramp: RAMPS.blue, base: "#01020A" }) },
  { cat: "Linear", name: "Ghost Scan", p: phaseLook({ mode: "linear", lines: 170, width: 45, threshold: 14, dots: 50, glow: 40, fringe: 15, debris: 70, grain: 30, ramp: RAMPS.white }) },
  { cat: "Linear", name: "Diagonal Feed", p: phaseLook({ mode: "linear", lines: 140, angle: 30, width: 60, threshold: 6, dots: 25, glow: 60, fringe: 30, grain: 25, ramp: RAMPS.sunset, base: "#0A0206" }) },
  { cat: "Linear", name: "Clean Line", p: phaseLook({ mode: "linear", lines: 180, width: 60, threshold: 4, dots: 0, glow: 35, fringe: 10, grain: 0, color: "full" }, { mask: { type: "none" }, scan: { strength: 0 }, tube: { vignette: 15 } }) },
  { cat: "Flux", name: "Thermal Flux", p: phaseLook({ mode: "flux", lines: 170, amp: 55, warp: 15, detail: 55, width: 45, threshold: 6, dots: 30, glow: 70, fringe: 30, grain: 25, ramp: RAMPS.heat }) },
  { cat: "Flux", name: "Cyan Flux", p: phaseLook({ mode: "flux", lines: 190, amp: 45, warp: 20, detail: 50, width: 40, threshold: 10, dots: 50, glow: 60, fringe: 45, flare: 60, debris: 25, grain: 20, ramp: RAMPS.ice, base: "#01040A" }, { mask: { strength: 55 } }) },
  { cat: "Flux", name: "Contour Map", p: phaseLook({ mode: "flux", lines: 90, amp: 80, warp: 5, detail: 30, width: 30, threshold: 4, dots: 0, glow: 25, fringe: 0, grain: 10, ramp: RAMPS.white }, { mask: { type: "none" }, scan: { strength: 0 } }) },
  { cat: "Flux", name: "Plasma Bend", p: phaseLook({ mode: "flux", lines: 150, amp: 60, warp: 70, detail: 45, width: 50, threshold: 6, dots: 25, glow: 80, fringe: 40, grain: 30, ramp: RAMPS.plasma, base: "#07020A" }) },
  { cat: "Flux", name: "Bent Signal", p: phaseLook({ mode: "flux", lines: 170, amp: 50, warp: 30, detail: 60, width: 45, threshold: 10, dots: 45, glow: 60, fringe: 35, debris: 80, grain: 25, ramp: RAMPS.teal, base: "#010605" }) },
  // ---- 3.0 Lidar (Frank, 2026-11-24; replaces Flux Dots): dots on scan rings bent by depth,
  // sparser, smaller and dropping out with distance. Colour by distance or by return intensity.
  { cat: "Lidar", name: "Lidar Ice", p: phaseLook({ mode: "lidar", lines: 120, amp: 45, width: 55, threshold: 4, dots: 30, drop: 30, glow: 60, fringe: 20, grain: 15, color: "depth", ramp: RAMPS.ice, base: "#01040A" }, { mask: { type: "none" }, scan: { strength: 0 } }) },
  { cat: "Lidar", name: "Lidar Spectrum", p: phaseLook({ mode: "lidar", lines: 130, amp: 45, width: 55, threshold: 4, dots: 25, drop: 25, glow: 55, fringe: 15, grain: 10, color: "depth", ramp: RAMPS.spectrum, base: "#020206" }, { mask: { type: "none" }, scan: { strength: 0 } }) },
  { cat: "Lidar", name: "Lidar Scope", p: phaseLook({ mode: "lidar", lines: 110, amp: 40, width: 50, threshold: 6, dots: 35, drop: 35, glow: 50, fringe: 0, grain: 15, color: "ramp", ramp: RAMPS.scope }, { mask: { type: "grille", strength: 25 }, conv: { x: 0 } }) },
  { cat: "Lidar", name: "Lidar Ember", p: phaseLook({ mode: "lidar", lines: 120, amp: 50, width: 60, threshold: 4, dots: 30, drop: 30, glow: 70, fringe: 30, grain: 25, color: "depth", ramp: RAMPS.ember, base: "#0E0503" }, { mask: { type: "none" } }) },
  { cat: "Lidar", name: "Lidar Survey", p: phaseLook({ mode: "lidar", lines: 160, amp: 35, width: 40, threshold: 3, dots: 20, drop: 15, glow: 35, fringe: 0, grain: 0, color: "depth", ramp: RAMPS.white, base: "#000000" }, { mask: { type: "none" }, scan: { strength: 0 }, tube: { vignette: 15 } }) }
];
module.exports = { DEFAULTS, PRESETS, RAMPS, clone, merge };
