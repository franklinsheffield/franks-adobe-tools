"use strict";
// ======================================================================
// Frank's Chrometone Brew - panel UI (liquid chrome, retro chrome type,
// 3D extrusion, glow and shine FX). Built on the shared tool panel.
// ======================================================================
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");

// how far glow / extrusion can reach past the artwork (document px)
function reach(s) {
  let r = 0;
  const X = s.extrude || {};
  if (X.on) r = Math.max(r, X.depth * 1.15 + (X.shadow > 0 ? X.depth * 0.7 + 40 : 0));
  for (const m of ((s.glow && s.glow.modules) || [])) {
    if (!m || !m.on) continue;
    r = Math.max(r, m.size * (m.type === "dreamy" ? 8 : m.type === "halo" || m.type === "neon" ? 3 : 0));
  }
  const SH = s.shine || {};
  if (SH.glints && SH.glints.on) r = Math.max(r, SH.glints.size);
  if (SH.arcs && SH.arcs.on) r = Math.max(r, 60);
  return Math.min(1500, Math.ceil(r));
}

let panel = null;
// Active-layer sources are read at the layer's bounds; widen them (inside the
// document) so glow and extrusion aren't cut off at the layer's edge.
async function prepareSource(doc, r) {
  const s = panel ? panel._test.state : DEFAULTS;
  if (!s || (s.view && s.view.kind === "detail")) return;
  const pad = reach(s);
  if (!pad) return;
  const info = r.info, o = r.origin, sc = r.scale || 1, src = r.src;
  const bwDoc = Math.round(src.w / sc), bhDoc = Math.round(src.h / sc);
  const l = Math.max(0, o.left - pad), t = Math.max(0, o.top - pad);
  const rr = Math.min(info.w, o.left + bwDoc + pad), bb = Math.min(info.h, o.top + bhDoc + pad);
  if (l === o.left && t === o.top && rr <= o.left + bwDoc && bb <= o.top + bhDoc) return;
  const ox = Math.round((o.left - l) * sc), oy = Math.round((o.top - t) * sc);
  const W = Math.max(src.w, Math.round((rr - l) * sc)), H = Math.max(src.h, Math.round((bb - t) * sc));
  const c = src.c || 4, out = new Uint8Array(W * H * 4);
  for (let y = 0; y < src.h; y++) {
    if (y + oy >= H) break;
    for (let x = 0; x < src.w; x++) {
      if (x + ox >= W) break;
      const j = (y * src.w + x) * c, k = ((y + oy) * W + x + ox) * 4;
      out[k] = src.data[j]; out[k + 1] = c >= 3 ? src.data[j + 1] : src.data[j]; out[k + 2] = c >= 3 ? src.data[j + 2] : src.data[j];
      out[k + 3] = c >= 4 ? src.data[j + 3] : 255;
    }
  }
  r.src = { w: W, h: H, c: 4, data: out };
  r.origin = { left: l, top: t };
}

panel = createToolPanel({
  appName: "Frank's Chrometone Brew", title: "Frank's Chrometone Brew", sub: "liquid chrome  /  retro chrome  /  3D  /  glow", panelId: "chrometonePanel",
  presetFile: "presets.json", exportName: "chrometone-looks.json",
  footer: "Frank's Chrometone Brew 1.1  -  Frank's Brew suite",
  Engine, DEFAULTS, PRESETS, merge, clone,
  prepareSource,
  costFactor: (s) => 1 + (s.extrude && s.extrude.on ? 0.5 : 0) + 0.6 * ((s.glow && s.glow.modules) || []).filter((m) => m && m.on).length,
  outputRows: (ui) => [
    ui.selectRow("Layers", "out.layers", [{ v: "split", l: "Separate layers (Colour, Shine, FX)" }, { v: "merged", l: "One merged layer" }])
  ],
  cards: (ui, kit) => {
    const { card, sliderRow, selectRow, checkRow, segGroup, el, showIf } = ui;
    const st = () => kit.state;
    const when = (node, fn) => { showIf(node, fn); return node; };
    const outlineMode = () => st().surface.from !== "brightness";

    // Surface (1.1)
    const horizonOn = () => outlineMode() && st().surface.reflect === "horizon";
    const surface = card("Surface", [
      segGroup("surface.from", [{ v: "auto", l: "Auto", t: "Outline when the layer has transparency or sits on black, else Brightness" }, { v: "outline", l: "Outline" }, { v: "brightness", l: "Brightness" }]),
      when(sliderRow("Key out dark", "surface.key", 0, 100, 1, "%"), outlineMode),
      when(sliderRow("Bevel width", "surface.bevel", 0, 200, 1, " px"), outlineMode),
      when(segGroup("surface.profile", [{ v: "chamfer", l: "Chamfer" }, { v: "round", l: "Round" }, { v: "rim", l: "Rim + flat" }]), outlineMode),
      when(segGroup("surface.reflect", [{ v: "gradient", l: "Gradient", t: "Metal gradient from the Look card, top to bottom" }, { v: "horizon", l: "Horizon", t: "Sky, wavy horizon, ground" }]), outlineMode),
      when(sliderRow("Horizon height", "surface.horizon", 0, 100, 1, "%"), horizonOn),
      when(sliderRow("Horizon wave", "surface.wave", 0, 100, 1, "%"), horizonOn),
      when(sliderRow("Wave size", "surface.waveSize", 0, 100, 1, "%"), horizonOn),
      when(el("div", { class: "lbl3", text: "Sky" }), horizonOn), when(kit.gradientEditor("surface.sky"), horizonOn),
      when(el("div", { class: "lbl3", text: "Ground" }), horizonOn), when(kit.gradientEditor("surface.ground"), horizonOn)
    ]);

    const look = card("Look", [kit.gradientEditor("look.stops"), checkRow("Invert (dark becomes bright)", "look.invert")]);
    const tone = card("Tone", [
      sliderRow("Smooth", "tone.blur", 0, 20, 1, " px"),
      sliderRow("Contrast", "tone.contrast", 20, 300, 5, "%"),
      sliderRow("Midpoint", "tone.mid", 0, 100, 1, "%")
    ]);
    const bands = card("Bands", [
      sliderRow("Count", "bands.count", 0, 12, 1, ""),
      sliderRow("Phase", "bands.phase", 0, 360, 5, "°"),
      selectRow("Shape", "bands.shape", [{ v: "sine", l: "Smooth (sine)" }, { v: "triangle", l: "Sharp (triangle)" }, { v: "hard", l: "Hard steps" }]),
      sliderRow("Softness", "bands.soft", 0, 100, 1, "%"),
      sliderRow("Strength", "bands.mix", 0, 100, 1, "%")
    ]);
    const relief = card("Relief", [
      sliderRow("Depth", "relief.depth", 0, 100, 1, "%"),
      sliderRow("Light angle", "relief.angle", 0, 360, 5, "°"),
      sliderRow("Gloss", "relief.gloss", 0, 100, 1, "%"),
      sliderRow("Shine", "relief.spec", 0, 100, 1, "%"),
      sliderRow("Bevel size", "relief.soft", 1, 20, 1, " px")
    ]);

    // Extrusion (1.1)
    const exOn = () => !!st().extrude.on;
    const extrusion = card("3D Extrusion", [
      checkRow("Extrude", "extrude.on"),
      when(sliderRow("Depth", "extrude.depth", 0, 400, 1, " px"), exOn),
      when(sliderRow("Angle", "extrude.angle", 0, 360, 5, "°"), exOn),
      when(sliderRow("Perspective", "extrude.persp", 0, 100, 1, "%"), exOn),
      when(el("div", { class: "lbl3", text: "Side colours (front to back)" }), exOn), when(kit.gradientEditor("extrude.stops"), exOn),
      when(sliderRow("Side shading", "extrude.shade", 0, 100, 1, "%"), exOn),
      when(sliderRow("Edge lines", "extrude.lines", 0, 100, 1, "%"), exOn),
      when(sliderRow("Long shadow", "extrude.shadow", 0, 100, 1, "%"), exOn)
    ]);

    // Glow stack (1.1): 4 modules
    const glowRows = [];
    for (let i = 0; i < 4; i++) {
      const base = "glow.modules." + i + ".", on = () => !!(st().glow.modules[i] && st().glow.modules[i].on);
      glowRows.push(
        checkRow("Glow " + (i + 1), base + "on"),
        when(selectRow("Type", base + "type", [{ v: "dreamy", l: "Dreamy" }, { v: "halo", l: "Halo" }, { v: "neon", l: "Neon edge" }, { v: "inner", l: "Inner" }, { v: "bloom", l: "Bloom (highlights)" }]), on),
        when(kit.colourRow("Colour", base + "color"), on),
        when(sliderRow("Size", base + "size", 1, 300, 1, " px"), on),
        when(sliderRow("Strength", base + "strength", 0, 100, 1, "%"), on)
      );
    }
    const glow = card("Glow", glowRows);

    // Shine FX (1.1)
    const g = () => st().shine;
    const shine = card("Shine FX", [
      checkRow("Star glints", "shine.glints.on"),
      when(sliderRow("Count", "shine.glints.count", 1, 20, 1, ""), () => g().glints.on),
      when(sliderRow("Size", "shine.glints.size", 4, 400, 1, " px"), () => g().glints.on),
      when(segGroup("shine.glints.rays", [{ v: 4, l: "4 rays" }, { v: 6, l: "6" }, { v: 8, l: "8" }]), () => g().glints.on),
      when(sliderRow("Rotation", "shine.glints.rot", 0, 90, 1, "°"), () => g().glints.on),
      checkRow("Sweep streak", "shine.sweep.on"),
      when(sliderRow("Angle", "shine.sweep.angle", 0, 180, 5, "°"), () => g().sweep.on),
      when(sliderRow("Position", "shine.sweep.pos", 0, 100, 1, "%"), () => g().sweep.on),
      when(sliderRow("Width", "shine.sweep.width", 1, 100, 1, "%"), () => g().sweep.on),
      when(sliderRow("Strength", "shine.sweep.strength", 0, 100, 1, "%"), () => g().sweep.on),
      checkRow("Rim light", "shine.rim.on"),
      when(kit.colourRow("Colour", "shine.rim.color"), () => g().rim.on),
      when(sliderRow("Width", "shine.rim.width", 1, 60, 1, " px"), () => g().rim.on),
      checkRow("Electric arcs", "shine.arcs.on"),
      when(sliderRow("Count", "shine.arcs.count", 1, 12, 1, ""), () => g().arcs.on),
      when(kit.colourRow("Colour", "shine.arcs.color"), () => g().arcs.on),
      when(sliderRow("Spread", "shine.arcs.spread", 0, 100, 1, "%"), () => g().arcs.on)
    ]);

    const finish = card("Finish", [
      sliderRow("Grain", "finish.grain", 0, 100, 1, "%"),
      sliderRow("Bloom", "finish.bloom", 0, 100, 1, "%"),
      sliderRow("Original mix", "finish.mix", 0, 100, 1, "%")
    ]);
    return [surface, look, tone, bands, relief, extrusion, glow, shine, finish];
  }
});
panel._chrome = { reach, prepareSource };
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
