"use strict";
// Chrometone settings, defaults and built-in presets.
const DEFAULTS = {
  look: { stops: [{ p: 0, c: "#0A0C10" }, { p: 30, c: "#5A6270" }, { p: 55, c: "#F4F7FA" }, { p: 70, c: "#8C95A3" }, { p: 100, c: "#FFFFFF" }], invert: false },
  tone: { blur: 2, contrast: 140, mid: 50 },
  bands: { count: 3, phase: 0, shape: "sine", soft: 50, mix: 60 },
  relief: { depth: 45, angle: 135, gloss: 40, spec: 60, soft: 3 },
  finish: { grain: 0, bloom: 20, mix: 0 },
  view: { kind: "whole", bg: "checker", size: 360 },
  out: { source: "flat", layers: "split", hide: true }
};

const S = (p, c) => ({ p, c });
const PRESETS = [
  { cat: "Chrome", name: "Liquid Silver", p: {} },
  { cat: "Chrome", name: "Polished Gold", p: { look: { stops: [S(0, "#2A1A05"), S(30, "#8A5A12"), S(55, "#FFE9A8"), S(72, "#C08A2A"), S(100, "#FFF6D8")] }, bands: { count: 2, mix: 55 } } },
  { cat: "Chrome", name: "Gunmetal", p: { look: { stops: [S(0, "#050607"), S(40, "#2C3138"), S(65, "#9AA3AE"), S(80, "#3E444C"), S(100, "#D7DCE2")] }, relief: { gloss: 60, spec: 45 }, bands: { count: 2, mix: 40 } } },
  { cat: "Chrome", name: "Black Mirror", p: { look: { stops: [S(0, "#000000"), S(50, "#101216"), S(62, "#E8ECF0"), S(70, "#1A1D22"), S(100, "#6B727C")] }, tone: { contrast: 180 }, relief: { gloss: 80, spec: 80 } } },
  { cat: "Colour", name: "Holo Foil", p: { look: { stops: [S(0, "#3A1C71"), S(20, "#D76D77"), S(40, "#FFAF7B"), S(60, "#7BF1FF"), S(80, "#B983FF"), S(100, "#FFFFFF")] }, bands: { count: 5, mix: 70 }, finish: { bloom: 30 } } },
  { cat: "Colour", name: "Rose Chrome", p: { look: { stops: [S(0, "#1E0A10"), S(35, "#9C4D5E"), S(58, "#FFE1E8"), S(75, "#C97C8C"), S(100, "#FFF5F7")] } } },
  { cat: "Colour", name: "Y2K Ice", p: { look: { stops: [S(0, "#06223A"), S(30, "#2F7FB8"), S(55, "#E9FBFF"), S(72, "#6EC6F0"), S(100, "#FFFFFF")] }, bands: { count: 4, shape: "triangle", mix: 65 }, finish: { bloom: 40 } } },
  { cat: "Colour", name: "Copper Wire", p: { look: { stops: [S(0, "#1A0802"), S(35, "#7A3412"), S(58, "#FFC29A"), S(75, "#B5582A"), S(100, "#FFE6D2")] }, bands: { count: 6, shape: "hard", soft: 40, mix: 50 }, finish: { grain: 15 } } }
];

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
function merge(base, patch) {
  const out = clone(base);
  (function rec(dst, src) {
    for (const k of Object.keys(src)) {
      if (isObj(src[k]) && isObj(dst[k])) rec(dst[k], src[k]);
      else dst[k] = clone(src[k]);
    }
  })(out, patch || {});
  return out;
}
module.exports = { DEFAULTS, PRESETS, clone, merge };
