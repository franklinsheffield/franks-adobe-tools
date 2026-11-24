"use strict";
// Default settings, deep-merge helper and the built-in preset library.

const DEFAULTS = {
  engine: "halftone",                       // halftone | dither | ascii
  algo: { halftone: "round", dither: "fs", ascii: "classic" },
  mode: "mono",                             // mono | tonal | grade | rgb | cmyk
  lpi: 35, angle: 45, pixel: 1, aa: false,
  // 1.1: per-algorithm controls (defaults reproduce 1.0 output exactly)
  tune: { threshold: 50, strength: 100, direction: "h", weight: 2, spacing: 6, jitter: 0 },
  ascii: { size: 4, custom: "FRANK", keepOrder: false, edge: 0, textMode: false, text: "FRANK" },
  mono:  { ink: "#000000", paper: "" },
  tonal: { tone: "duonavy", inks: ["#7FA6C9", "#1B2A49"], paper: "#F4EBD0", angles: [45, 15, 75, 0, 60] },
  grade: { palette: "pico8", colors: ["#000000", "#1D2B53", "#7E2553", "#008751", "#AB5236", "#5F574F", "#C2C3C7", "#FFF1E8", "#FF004D", "#FFA300", "#FFEC27", "#00E436", "#29ADFF", "#83769C", "#FF77A8", "#FFCCAA"],
           off: [], count: 8, spread: 50, skipLightest: false },
  cmyk:  { angles: [15, 75, 0, 45], on: [true, true, true, true], gcr: 100 },
  rgb:   { angles: [15, 75, 45], on: [true, true, true], strength: [100, 100, 100] },
  fx: {
    // Image card. invert is a 0-100 amount (1.0 looks stored true/false: both still work)
    pre:      { on: false, brightness: 0, contrast: 0, gamma: 1, black: 0, white: 255, blur: 0, sharpen: 0, radius: 1.5, noise: 0, haze: 0, invert: 0 },
    edges:    { on: false, strength: 60, thick: 1 },
    dtf:      { on: false, garment: "#1A1A1A", fuzz: 15, feather: 20, dots: true, view: "garment" },
    gain:     { on: false, amount: 0 },
    misreg:   { on: false, amount: 3 },
    clean:    { on: false, mm: 0.5 },
    distress: { on: false, amount: 30 }
  },
  out: { source: "flat", hide: true, paper: false, dpi: 0 },
  view: { kind: "detail", size: 360, bg: "white", split: 0 }
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
function merge(base, patch) {
  const out = clone(base);
  (function rec(dst, src) {
    for (const k of Object.keys(src)) {
      if (isObj(src[k]) && isObj(dst[k])) rec(dst[k], src[k]);
      else dst[k] = clone(src[k]);
    }
  })(out, patch);
  return out;
}

const G = (id) => ({ engine: "halftone", algo: { halftone: id } });
const D = (id) => ({ engine: "dither", algo: { dither: id } });

const PRESETS = [
  // ---- print screens ------------------------------------------------
  { cat: "Print", name: "Newsprint 45 deg / 35 LPI",       p: Object.assign(G("round"),  { lpi: 35, angle: 45, fx: { pre: { on: true, contrast: 10 } } }) },
  { cat: "Print", name: "Coarse screen print / 25 LPI",    p: Object.assign(G("round"),  { lpi: 25, angle: 45, fx: { pre: { on: true, contrast: 20, white: 245 } } }) },
  { cat: "Print", name: "Fine halftone / 60 LPI",          p: Object.assign(G("round"),  { lpi: 60, angle: 45 }) },
  { cat: "Print", name: "Line screen 0 deg / 30 LPI",      p: Object.assign(G("line"),   { lpi: 30, angle: 0 }) },
  { cat: "Print", name: "Diagonal line etching / 40 LPI",  p: Object.assign(G("line"),   { lpi: 40, angle: 45, fx: { pre: { on: true, contrast: 15 } } }) },
  { cat: "Print", name: "Cross-hatch engraving",           p: Object.assign(G("cross"),  { lpi: 30, angle: 30 }) },
  { cat: "Print", name: "Hex dot poster",                  p: Object.assign(G("hex"),    { lpi: 28, angle: 15 }) },
  { cat: "Print", name: "Xerox grain photocopy",           p: Object.assign(G("grain"),  { lpi: 40, angle: 45, fx: { pre: { on: true, contrast: 25, sharpen: 30 } } }) },
  { cat: "Print", name: "Concentric rings",                p: Object.assign(G("rings"),  { lpi: 20, angle: 0 }) },
  { cat: "Print", name: "Wavy lines (CRT feel)",           p: Object.assign(G("wave"),   { lpi: 30, angle: 0 }) },
  { cat: "Print", name: "Vintage distressed screen",       p: Object.assign(G("round"),  { lpi: 30, angle: 45, fx: { gain: { on: true, amount: 1 }, distress: { on: true, amount: 40 } } }) },
  // ---- garment / DTF -----------------------------------------------
  { cat: "DTF", name: "DTF soft edge / 45 LPI (knock out garment)", p: Object.assign(G("round"), { lpi: 45, angle: 45, fx: { dtf: { on: true, garment: "#1A1A1A", fuzz: 15, feather: 20, dots: true, view: "garment" }, clean: { on: true, mm: 0.5 }, pre: { on: true, white: 235 } } }) },
  { cat: "DTF", name: "DTF stipple (Atkinson, 3 px)",     p: Object.assign(D("atk"), { pixel: 3, fx: { dtf: { on: true, dots: true, view: "garment" }, clean: { on: true, mm: 0.5 } } }) },
  // ---- colour ------------------------------------------------------
  { cat: "Colour", name: "CMYK rosette / 55 LPI",           p: Object.assign(G("round"), { mode: "cmyk", lpi: 55 }) },
  { cat: "Colour", name: "CMYK coarse pop + misregistration", p: Object.assign(G("round"), { mode: "cmyk", lpi: 30, fx: { misreg: { on: true, amount: 4 }, gain: { on: true, amount: 1 } } }) },
  { cat: "Colour", name: "RGB split (Bayer 4x4)",           p: Object.assign(D("b4"), { mode: "rgb", pixel: 2 }) },
  { cat: "Colour", name: "Riso pink + blue tonal",          p: Object.assign(G("round"), { mode: "tonal", lpi: 40, tonal: { tone: "rb", inks: ["#FF48B0", "#0078BF"], paper: "#F5F0E6" } }) },
  { cat: "Colour", name: "Sunset tonal stipple",            p: Object.assign(D("fs"), { mode: "tonal", pixel: 2, tonal: { tone: "sunset3", inks: ["#FFB830", "#F05A28", "#AB2B6E", "#2D0A31"], paper: "#FFF6DC" } }) },
  { cat: "Colour", name: "Game Boy (Bayer 4x4)",            p: Object.assign(D("b4"), { mode: "grade", pixel: 2, grade: { palette: "gameboy", colors: ["#0F380F", "#306230", "#8BAC0F", "#9BBC0F"], off: [] } }) },
  { cat: "Colour", name: "PICO-8 (Floyd-Steinberg)",        p: Object.assign(D("fs"), { mode: "grade", pixel: 2, grade: { palette: "pico8", off: [] } }) },
  { cat: "Colour", name: "CGA arcade",                      p: Object.assign(D("b8"), { mode: "grade", pixel: 2, grade: { palette: "cga1", colors: ["#000000", "#55FFFF", "#FF55FF", "#FFFFFF"], off: [] } }) },
  // ---- pixel dithers -----------------------------------------------
  { cat: "Dither", name: "1-bit Mac (Atkinson, 2 px)",       p: Object.assign(D("atk"), { pixel: 2, fx: { pre: { on: true, contrast: 15 } } }) },
  { cat: "Dither", name: "Retro Bayer 4x4 (3 px)",           p: Object.assign(D("b4"), { pixel: 3 }) },
  { cat: "Dither", name: "Fine stipple (Floyd-Steinberg)",   p: Object.assign(D("fs"), { pixel: 1 }) },
  { cat: "Dither", name: "Riso grain (gradient noise, 2 px)", p: Object.assign(D("ign"), { pixel: 2, fx: { pre: { on: true, contrast: 10 } } }) },
  { cat: "Dither", name: "Jarvis newsprint (3 px)",           p: Object.assign(D("jjn"), { pixel: 3 }) },
  // ---- ASCII -------------------------------------------------------
  { cat: "ASCII", name: "Classic ASCII",                     p: { engine: "ascii", algo: { ascii: "classic" }, ascii: { size: 3 } } },
  { cat: "ASCII", name: "Edge ASCII",                        p: { engine: "ascii", algo: { ascii: "dense" }, ascii: { size: 3, edge: 70 }, fx: { pre: { on: true, contrast: 20 } } } },
  { cat: "ASCII", name: "Digit matrix (terminal green)",     p: { engine: "ascii", algo: { ascii: "digits" }, mode: "tonal", ascii: { size: 3 }, tonal: { tone: "amber3", inks: ["#008F11", "#00FF41"], paper: "#000000" } } },
  { cat: "ASCII", name: "Binary rain",                       p: { engine: "ascii", algo: { ascii: "binary" }, ascii: { size: 3 }, mono: { ink: "#00AA33", paper: "#000000" } } },
  { cat: "ASCII", name: "Text halftone: FRANK",              p: { engine: "ascii", algo: { ascii: "classic" }, ascii: { size: 5, textMode: true, text: "FRANK" } } },
  { cat: "ASCII", name: "Dot blocks (pixel patterns)",       p: { engine: "ascii", algo: { ascii: "blocks" }, ascii: { size: 3 } } },
  // ---- Line Art (1.1) ----------------------------------------------
  { cat: "Line Art", name: "Wave scan portrait (night violet)", p: Object.assign(D("wavescan"), { pixel: 3, mono: { ink: "#7A7CFF", paper: "#000000" }, tune: { threshold: 53 } }) },
  { cat: "Line Art", name: "Diagonal wave engraving",        p: Object.assign(D("wavescan"), { pixel: 2, tune: { direction: "d", weight: 3 }, fx: { pre: { on: true, contrast: 15 } } }) },
  { cat: "Line Art", name: "Seismograph",                    p: Object.assign(D("waveamp"), { pixel: 2, tune: { spacing: 7, weight: 3 } }) },
  { cat: "Line Art", name: "Banknote line engraving",        p: Object.assign(D("lineweight"), { pixel: 1, tune: { direction: "d", spacing: 5 }, fx: { pre: { on: true, contrast: 20, sharpen: 60 } } }) },
  { cat: "Line Art", name: "Topo contours (orange on black)", p: Object.assign(D("contour"), { pixel: 2, tune: { weight: 4 }, mono: { ink: "#FF9F1C", paper: "#000000" } }) },
  { cat: "Line Art", name: "Hypno spiral",                   p: Object.assign(D("spiral"), { pixel: 2, tune: { spacing: 8 } }) },
  { cat: "Line Art", name: "Crosswave riso",                 p: Object.assign(D("crosswave"), { mode: "tonal", pixel: 2, tonal: { tone: "rb", inks: ["#FF48B0", "#0078BF"], paper: "#F5F0E6" } }) },
  { cat: "Line Art", name: "Blue-noise stipple",             p: Object.assign(D("stipple"), { pixel: 1, fx: { pre: { on: true, contrast: 10 } } }) }
];

module.exports = { DEFAULTS, PRESETS, merge, clone };
