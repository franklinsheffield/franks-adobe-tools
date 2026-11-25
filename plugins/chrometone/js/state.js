"use strict";
// Chrometone settings, defaults and built-in presets.
const DEFAULTS = {
  look: { stops: [{ p: 0, c: "#0A0C10" }, { p: 30, c: "#5A6270" }, { p: 55, c: "#F4F7FA" }, { p: 70, c: "#8C95A3" }, { p: 100, c: "#FFFFFF" }], invert: false },
  tone: { blur: 2, contrast: 140, mid: 50 },
  bands: { count: 3, phase: 0, shape: "sine", soft: 50, mix: 60 },
  relief: { depth: 45, angle: 135, gloss: 40, spec: 60, soft: 3 },
  finish: { grain: 0, bloom: 20, mix: 0 },
  view: { kind: "whole", bg: "checker", size: 360 },
  out: { source: "flat", layers: "split", hide: true },
  // 1.1 (all off by default, so classic looks and saved looks render exactly as in 1.0)
  surface: {
    from: "brightness", key: 12, bevel: 30, profile: "chamfer", reflect: "gradient", horizon: 52, wave: 35, waveSize: 40,
    sky: [{ p: 0, c: "#FFFFFF" }, { p: 55, c: "#BFD9FF" }, { p: 100, c: "#7FA8E8" }],
    ground: [{ p: 0, c: "#3A2418" }, { p: 45, c: "#B86A3C" }, { p: 100, c: "#FFF1DC" }],
    // 3.0 desert chrome (Frank's reference video 2026-11-25)
    hshape: "hills", bend: 0, bevelOn: false,
    bevelStops: [{ p: 0, c: "#FFFFFF" }, { p: 45, c: "#9AA6B8" }, { p: 55, c: "#2A3038" }, { p: 100, c: "#E8EEF6" }]
  },
  extrude: { on: false, depth: 80, angle: 290, persp: 0, stops: [{ p: 0, c: "#E8EEF6" }, { p: 100, c: "#20242C" }], shade: 60, lines: 50, shadow: 0 },
  glow: { modules: [
    { on: false, type: "dreamy", color: "#BFD8FF", size: 60, strength: 50 },
    { on: false, type: "halo", color: "#FFFFFF", size: 25, strength: 50 },
    { on: false, type: "neon", color: "#00E5FF", size: 12, strength: 60 },
    { on: false, type: "bloom", color: "#FFFFFF", size: 30, strength: 50 }
  ] },
  shine: {
    glints: { on: false, count: 4, size: 80, rays: 4, rot: 0, color: "#FFFFFF" },
    sweep: { on: false, angle: 60, pos: 40, width: 20, strength: 60 },
    rim: { on: false, color: "#FFD9A8", width: 8 },
    arcs: { on: false, count: 4, color: "#D9A8FF", spread: 50 }
  }
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
  // always 4 glow slots, each complete, so the panel's rows stay bound
  if (out.glow && Array.isArray(out.glow.modules)) {
    const m = out.glow.modules;
    for (let i = 0; i < 4; i++) m[i] = Object.assign(clone(DEFAULTS.glow.modules[i]), isObj(m[i]) ? m[i] : {});
    m.length = 4;
  }
  return out;
}

// ---- 1.1 Retro chrome looks: outline bevels, horizon reflections, extrusion, glow + shine
const G = (type, color, size, strength) => ({ on: true, type, color, size, strength });
function mods(...list) { const out = list.slice(0, 4); while (out.length < 4) out.push(clone(DEFAULTS.glow.modules[out.length])); return out; }
const surf = (o) => Object.assign({ from: "auto" }, o);
const RETRO = [
  { name: "Glacier Rim", p: { surface: surf({ profile: "rim", bevel: 22, reflect: "horizon", horizon: 50, wave: 30, sky: [S(0, "#FFFFFF"), S(60, "#DDEEFF"), S(100, "#9CC6F2")], ground: [S(0, "#3F74B0"), S(55, "#A9D4F5"), S(100, "#F2FAFF")] }), relief: { depth: 55, gloss: 60, spec: 60 }, bands: { count: 0 }, glow: { modules: mods(G("halo", "#CFE6FF", 25, 60)) } } },
  { name: "Sunset Slab", p: { surface: surf({ bevel: 26, reflect: "horizon", horizon: 45, wave: 40, sky: [S(0, "#F4F8FF"), S(50, "#B8CCF5"), S(100, "#8FA8E0")], ground: [S(0, "#2A1C1E"), S(45, "#C27A4A"), S(100, "#FFE3B8")] }), bands: { count: 0 }, extrude: { on: true, depth: 70, angle: 290, stops: [S(0, "#F0C99A"), S(100, "#3A2A26")], shade: 60, lines: 60 }, shine: { glints: { on: true, count: 3, size: 70 } } } },
  { name: "Lilac Storm", p: { surface: surf({ bevel: 22, reflect: "horizon", horizon: 40, wave: 45, sky: [S(0, "#FFF3F8"), S(55, "#F0C8E0"), S(100, "#C8A0D8")], ground: [S(0, "#5A3A6A"), S(50, "#C89AB8"), S(100, "#FFE8F0")] }), bands: { count: 0 }, extrude: { on: true, depth: 24, angle: 300, stops: [S(0, "#D8B8E0"), S(100, "#6A4A78")] }, glow: { modules: mods(G("dreamy", "#C9A0FF", 50, 45)) }, shine: { arcs: { on: true, count: 5, color: "#D8B0FF", spread: 60 } } } },
  { name: "Dreamy Pearl", p: { surface: surf({ profile: "round", bevel: 35 }), look: { stops: [S(0, "#8A7A8A"), S(35, "#F7E8F0"), S(55, "#FFFFFF"), S(75, "#E8D0E0"), S(100, "#FFF8FC")] }, bands: { count: 2, mix: 40 }, glow: { modules: mods(G("dreamy", "#FFD8EE", 60, 70), G("halo", "#FFFFFF", 15, 40)) } } },
  { name: "Midnight Edge", p: { surface: surf({ profile: "round", bevel: 20 }), look: { stops: [S(0, "#000000"), S(50, "#101216"), S(62, "#E8ECF0"), S(70, "#1A1D22"), S(100, "#6B727C")] }, relief: { gloss: 80, spec: 80 }, bands: { count: 0 }, glow: { modules: mods(G("neon", "#00E5FF", 14, 80)) }, shine: { rim: { on: true, color: "#00E5FF", width: 6 } } } },
  { name: "Heavy Metal", p: { surface: surf({ bevel: 24 }), look: { stops: [S(0, "#0A0C10"), S(30, "#3A4048"), S(55, "#C8D0D8"), S(75, "#4A5058"), S(100, "#E8ECF0")] }, bands: { count: 3, mix: 50 }, extrude: { on: true, depth: 120, angle: 300, persp: 60, stops: [S(0, "#8A929C"), S(100, "#101216")], lines: 70, shade: 70, shadow: 40 } } },
  { name: "Arcade Gold", p: { surface: surf({ bevel: 24, reflect: "horizon", horizon: 48, wave: 30, sky: [S(0, "#FFFBEA"), S(55, "#FFE7A0"), S(100, "#F0C060")], ground: [S(0, "#3A2208"), S(50, "#B07A20"), S(100, "#FFF0C0")] }), bands: { count: 0 }, extrude: { on: true, depth: 30, stops: [S(0, "#E0A840"), S(100, "#4A2C08")] }, shine: { sweep: { on: true, angle: 60, pos: 35, width: 18, strength: 70 } } } },
  { name: "Frostbite", p: { surface: surf({ profile: "rim", bevel: 14 }), look: { stops: [S(0, "#3F6F9A"), S(30, "#DDF0FF"), S(48, "#FFFFFF"), S(68, "#7FAFD8"), S(100, "#F4FBFF")] }, bands: { count: 2, mix: 35 }, finish: { grain: 12 }, glow: { modules: mods(G("inner", "#BFE8FF", 30, 60), G("halo", "#DFF3FF", 20, 35)) } } },
  { name: "Hot Rod Candy", p: { surface: surf({ profile: "round", bevel: 30 }), look: { stops: [S(0, "#2A0005"), S(30, "#B0101E"), S(55, "#FF8A3C"), S(75, "#FFE0B0"), S(100, "#FFFFFF")] }, bands: { count: 2, mix: 50 }, glow: { modules: mods(G("bloom", "#FFB070", 40, 70)) } } },
  { name: "Vapor Mint", p: { surface: surf({ bevel: 18, reflect: "horizon", horizon: 50, wave: 35, sky: [S(0, "#F0FFF8"), S(55, "#B8F5DC"), S(100, "#7FE0C0")], ground: [S(0, "#4A2A5A"), S(50, "#E08AC0"), S(100, "#FFE0F0")] }), bands: { count: 0 }, glow: { modules: mods(G("halo", "#9FFFE0", 25, 45), G("dreamy", "#FFB0E0", 50, 45)) } } },
  { name: "Ultra Blue", p: { surface: surf({ bevel: 24 }), look: { stops: [S(0, "#000A30"), S(30, "#0A3AC8"), S(55, "#9FD0FF"), S(75, "#1A50E0"), S(100, "#E8F4FF")] }, bands: { count: 3, shape: "triangle", mix: 50 }, extrude: { on: true, depth: 14, stops: [S(0, "#2A5AE0"), S(100, "#000A30")], shadow: 65 } } },
  { name: "Rose Ingot", p: { surface: surf({ bevel: 26 }), look: { stops: [S(0, "#3A1A18"), S(35, "#B8706A"), S(58, "#FFE0D8"), S(75, "#D89088"), S(100, "#FFF4F0")] }, bands: { count: 2, mix: 45 }, extrude: { on: true, depth: 50, stops: [S(0, "#E0A090"), S(100, "#4A2420")] }, shine: { rim: { on: true, color: "#FFE8D8", width: 8 } } } },
  { name: "Night Drive", p: { surface: surf({ bevel: 22, reflect: "horizon", horizon: 46, wave: 60, waveSize: 55, sky: [S(0, "#FFE8FF"), S(50, "#C890F0"), S(100, "#7A40C8")], ground: [S(0, "#200828"), S(50, "#FF6A20"), S(100, "#FFD080")] }), bands: { count: 0 }, shine: { glints: { on: true, count: 4, size: 80, rays: 8 } } } },
  { name: "Mercury Drop", p: { surface: surf({ profile: "round", bevel: 45 }), look: { stops: [S(0, "#20242A"), S(30, "#8A929C"), S(55, "#FFFFFF"), S(75, "#6A727C"), S(100, "#F4F6F8")] }, bands: { count: 2, mix: 60 }, shine: { sweep: { on: true, angle: 45, pos: 60, width: 25, strength: 55 } } } },
  { name: "Prism Foil", p: { surface: surf({ bevel: 18 }), look: { stops: [S(0, "#3A1C71"), S(20, "#D76D77"), S(40, "#FFAF7B"), S(60, "#7BF1FF"), S(80, "#B983FF"), S(100, "#FFFFFF")] }, bands: { count: 5, mix: 70 }, glow: { modules: mods(G("neon", "#FF7BF0", 12, 70)) } } },
  { name: "Titan Block", p: { surface: surf({ bevel: 20 }), look: { stops: [S(0, "#050607"), S(40, "#2C3138"), S(65, "#9AA3AE"), S(80, "#3E444C"), S(100, "#D7DCE2")] }, bands: { count: 2, mix: 40 }, extrude: { on: true, depth: 160, angle: 270, stops: [S(0, "#6A727C"), S(100, "#0A0C10")], lines: 60 }, glow: { modules: mods(G("bloom", "#E0E8FF", 30, 60)) } } }
];
RETRO.forEach((r) => PRESETS.push({ cat: "Retro chrome", name: r.name, p: r.p }));

// ---- 3.0 Desert chrome (Frank's reference video 2026-11-25): mountain horizon through the letters,
// blue sky above, airbrushed red-orange ground below, own bevel gradient, warm glow, grain
const DSKY = [S(0, "#0B2A8A"), S(45, "#3C7BE0"), S(100, "#CFE6FF")], DGROUND = [S(0, "#1A0400"), S(35, "#B3200A"), S(70, "#FF7A1A"), S(100, "#FFE2A0")];
const BEV = [S(0, "#FFFFFF"), S(40, "#A8B4C8"), S(52, "#20242C"), S(100, "#F0F4FA")];
const DESERT = [
  { name: "Desert Chrome", p: { surface: surf({ bevel: 16, reflect: "horizon", hshape: "mountains", horizon: 50, wave: 55, waveSize: 35, sky: DSKY, ground: DGROUND, bevelOn: true, bevelStops: BEV }), bands: { count: 0 }, relief: { depth: 55, gloss: 55, spec: 65 }, glow: { modules: mods(G("dreamy", "#FFB070", 55, 40)) }, shine: { sweep: { on: true, angle: 60, pos: 30, width: 12, strength: 25 } }, finish: { grain: 20, bloom: 20 } } },
  { name: "Desert Chrome 3D", p: { surface: surf({ bevel: 16, reflect: "horizon", hshape: "mountains", horizon: 50, wave: 55, waveSize: 35, sky: DSKY, ground: DGROUND, bevelOn: true, bevelStops: BEV }), bands: { count: 0 }, relief: { depth: 55, gloss: 55, spec: 65 }, extrude: { on: true, depth: 90, angle: 270, stops: [S(0, "#D84A1A"), S(100, "#2A0800")], shade: 60, lines: 40 }, glow: { modules: mods(G("dreamy", "#FFB070", 55, 40)) }, finish: { grain: 20, bloom: 20 } } },
  { name: "Pure Chrome Horizon", p: { surface: surf({ bevel: 16, reflect: "horizon", hshape: "angled", horizon: 52, wave: 40, sky: [S(0, "#3A4048"), S(50, "#C8D0DA"), S(100, "#FFFFFF")], ground: [S(0, "#000000"), S(40, "#2A2E34"), S(100, "#D8DEE6")], bevelOn: true, bevelStops: BEV }), bands: { count: 0 }, relief: { depth: 55, gloss: 65, spec: 70 }, finish: { grain: 15, bloom: 25 } } },
  { name: "80s Chrome", p: { surface: surf({ bevel: 16, reflect: "horizon", hshape: "flat", horizon: 50, wave: 20, sky: [S(0, "#10104A"), S(50, "#3A6AF0"), S(100, "#E8F0FF")], ground: [S(0, "#2A0A30"), S(40, "#C02A90"), S(100, "#FFC8F0")], bevelOn: true, bevelStops: [S(0, "#FFFFFF"), S(45, "#FF7AD8"), S(55, "#2A0830"), S(100, "#FFE8FA")] }), bands: { count: 0 }, glow: { modules: mods(G("neon", "#FF4FD8", 14, 55)) }, shine: { glints: { on: true, count: 3, size: 90, rays: 4 } }, finish: { grain: 18 } } },
  { name: "Hot Sunset Chrome", p: { surface: surf({ bevel: 18, reflect: "horizon", hshape: "curtain", horizon: 48, wave: 70, sky: [S(0, "#3A0A40"), S(45, "#E0305A"), S(100, "#FFD080")], ground: [S(0, "#0A0204"), S(45, "#7A1408"), S(100, "#FF8A2A")], bevelOn: true, bevelStops: [S(0, "#FFF4D8"), S(45, "#E08A40"), S(55, "#2A0A04"), S(100, "#FFE0B0")] }), bands: { count: 0 }, glow: { modules: mods(G("dreamy", "#FF7A40", 60, 50)) }, finish: { grain: 22, bloom: 30 } } },
  { name: "Gold Desert", p: { surface: surf({ bevel: 16, reflect: "horizon", hshape: "mountains", horizon: 54, wave: 45, sky: [S(0, "#5A3A08"), S(45, "#E8B040"), S(100, "#FFF4C8")], ground: [S(0, "#1A0A00"), S(45, "#8A4A08"), S(100, "#FFD070")], bevelOn: true, bevelStops: [S(0, "#FFFBE8"), S(45, "#D8A040"), S(55, "#2A1800"), S(100, "#FFF0C0")], bend: 40 }), bands: { count: 0 }, relief: { depth: 55, gloss: 60, spec: 70 }, finish: { grain: 18, bloom: 25 } } }
];
DESERT.forEach((r) => PRESETS.push({ cat: "Desert chrome", name: r.name, p: r.p }));

module.exports = { DEFAULTS, PRESETS, clone, merge };
