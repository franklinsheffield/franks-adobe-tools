"use strict";
// Frank's Paint Brew - panel UI (oil, watercolour, impressionism, alcohol ink, spray paint and pastel)
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, SWATCHES, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");
const PS = require("./core/ps-io.js");
const PP = require("./js/paintps.js");
const M = require("./core/imgmath.js");
const { WALL_COLOURS } = require("./js/styles2.js");
const { createPicker } = require("./js/picker.js");
const STYLE_NAMES = { oil: "Oil", watercolour: "Watercolour", impressionism: "Impressionism", ink: "Alcohol Ink", spray: "Spray Paint", pastel: "Pastel" };

let getState = () => DEFAULTS;
let printFocus = null;          // focus read from the original before a print copy: { w, h, m, W, H }
const isWater = () => getState().style === "watercolour";
const minLong = () => (isWater() ? getState().out.minLongWater : getState().out.minLong);
const sourceLayer = (doc) => { try { return getState().out.source !== "flat" ? Array.from(doc.activeLayers || [])[0] : null; } catch (e) { return null; } };

const panel = createToolPanel({
  appName: "Frank's Paint Brew", title: "Frank's Paint Brew", sub: "oil  /  watercolour  /  impressionism  /  ink  /  spray  /  pastel", panelId: "paintPanel",
  footer: "Frank's Paint Brew 1.1  -  Frank's Brew suite",
  presetFile: "presets.json", exportName: "paint-looks.json",
  Engine, DEFAULTS, PRESETS, merge, clone,
  cancellable: true,
  code: "PB-09", glow: "#6c96ff",
  // the group says which style was painted, even after the style was changed by hand
  groupLabel: (s, name) => {
    const pr = PRESETS.find((p) => p.name === name);
    const style = STYLE_NAMES[s.style] || s.style;
    return pr && pr.p.style === s.style ? name : style + " (custom)";
  },
  costFactor: (s) => ({ watercolour: 2, oil: 4, impressionism: 3, ink: 2, spray: 2, pastel: 3 }[s.style] || 3),
  async prepareApply(doc, setStatus) {
    printFocus = null;
    const s = getState(), info = PS.docInfo(doc);
    if (!s.out.printCopy || !PP.needsCopy(info, minLong())) return doc;
    if (s.out.focus !== "none") {
      try {
        const m = await PP.readFocus(doc, s.out.focus, sourceLayer(doc), { src: { w: info.w, h: info.h }, scale: 1, origin: { left: 0, top: 0 } });
        if (m) printFocus = { w: info.w, h: info.h, m };
      } catch (e) { console.warn("focus", e); }
    }
    setStatus("Making a print-ready copy (" + minLong() + " px, " + s.out.ppi + " ppi)...");
    const copy = await PP.makePrintCopy(doc, minLong(), s.out.ppi);
    if (printFocus) { const ci = PS.docInfo(copy); printFocus.W = ci.w; printFocus.H = ci.h; }
    return copy;
  },
  async prepareSource(doc, r, phase) {
    const s = getState();
    if (s.out.focus === "none") return;
    if (phase === "apply" && printFocus) {
      const big = PP.scaleMask(printFocus.m, printFocus.w, printFocus.h, printFocus.W, printFocus.H);
      const W = r.src.w, H = r.src.h, out = new Float32Array(W * H), ox = r.origin.left, oy = r.origin.top;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const X = x + ox, Y = y + oy; if (X >= 0 && Y >= 0 && X < printFocus.W && Y < printFocus.H) out[y * W + x] = big[Y * printFocus.W + X]; }
      r.src.focus = out;
      return;
    }
    try { const m = await PP.readFocus(doc, s.out.focus, sourceLayer(doc), r); if (m) r.src.focus = m; } catch (e) { console.warn("No focus area found: " + (e && e.message)); }
  },
  cards: (ui, kit) => {
    const { card, sliderRow, segGroup, selectRow, checkRow, el, bind, row, getPath, setPath, showIf } = ui;
    getState = () => kit.state;
    const is = (...st) => () => st.includes(kit.state.style);
    const strokes = is("oil", "impressionism", "pastel");
    // named swatches, a typed hex value and an in-panel picker (the chip opens it);
    // never opens Photoshop's own colour picker
    const swatchRow = (label, path, list) => {
      const hex = el("input", { type: "text", class: "num hex", title: label + " as #RRGGBB" });
      const pk = createPicker({ el, get: () => getPath(kit.state, path), set: (v, commit) => { setPath(kit.state, path, v); hex.value = v; if (commit) kit.touch(); } });
      hex.addEventListener("change", () => {
        const v = String(hex.value).trim();
        if (M.isHex(v)) { setPath(kit.state, path, ("#" + v.replace("#", "")).toUpperCase()); kit.touch(); } else hex.value = getPath(kit.state, path);
      });
      bind(() => { hex.value = getPath(kit.state, path); pk.sync(); });
      const sw = segGroup(path, list, "swatches");
      sw.style.flexWrap = "wrap"; sw.style.width = "100%";      // all swatches show, on two rows if needed
      return el("div", {}, [row(label, hex, pk.chip), pk.panel, el("div", { class: "row wrap" }, [sw])]);
    };
    const only = (node, fn) => { showIf(node, fn); return node; };
    const isWall = (...ws) => () => ws.includes(kit.state.spray.wall);
    const brush = card("Brush", [
      sliderRow("Stroke size", "brush.size", 4, 120, 1, " px"),
      only(sliderRow("Stroke length", "brush.length", 0.4, 2.5, 0.1, "x"), strokes),
      only(sliderRow("Detail passes", "brush.detail", 1, 4, 1, ""), strokes),
      only(sliderRow("Randomness", "brush.randomness", 0, 100, 1, "%"), strokes),
      only(sliderRow("Follow edges", "brush.follow", 0, 100, 1, "%"), strokes),
      only(row("Tool", segGroup("brush.tool", [{ v: "brush", l: "Brush" }, { v: "knife", l: "Palette knife" }])), is("oil")),
      only(sliderRow("Paint mixing", "brush.mix", 0, 100, 1, "%"), is("oil")),
      sliderRow("Variation", "seed", 1, 99, 1, "")
    ], { hint: "Sizes are for a 3000 px image and scale with yours." });
    const colour = card("Colour", [
      sliderRow("Simplify", "colour.simplify", 0, 100, 1, "%"),
      sliderRow("Saturation", "colour.saturation", -50, 100, 1, "%"),
      sliderRow("Warmth", "colour.warmth", -50, 50, 1, ""),
      only(sliderRow("Broken colour", "colour.jitter", 0, 100, 1, "%"), () => kit.state.style === "impressionism"),
      sliderRow("Palette limit", "colour.palette", 0, 24, 1, " colours")
    ], { hint: "Palette limit 0 keeps every colour." });
    const texture = only(card("Texture", [
      only(sliderRow("Impasto depth", "texture.impasto", 0, 100, 1, "%"), () => kit.state.style === "oil"),
      only(sliderRow("Thick lights", "texture.thickLights", 0, 100, 1, "%"), () => kit.state.style === "oil"),
      sliderRow("Light angle", "texture.light", 0, 360, 5, " deg"),
      sliderRow("Bristle streaks", "texture.bristle", 0, 100, 1, "%"),
      sliderRow("Canvas weave", "texture.canvas", 0, 100, 1, "%"),
      sliderRow("Weave size", "texture.canvasScale", 3, 16, 1, " px"),
      only(sliderRow("Light and colour lift", "texture.lift", 0, 100, 1, "%"), is("impressionism", "oil"))
    ], { bypass: { "texture.impasto": 0, "texture.bristle": 0, "texture.canvas": 0 } }), is("oil", "impressionism"));
    const water = only(card("Water and paper", [
      kit.colourRow("Paper colour", "water.paperColour"),
      sliderRow("Pigment", "water.density", 20, 100, 1, "%"),
      sliderRow("Wet edges", "water.wetEdge", 0, 100, 1, "%"),
      sliderRow("Granulation", "water.granulation", 0, 100, 1, "%"),
      sliderRow("Bleed", "water.bleed", 0, 60, 1, " px"),
      sliderRow("Paper texture", "water.paperTexture", 0, 100, 1, "%"),
      sliderRow("Pencil", "water.pencil", 0, 100, 1, "%"),
      sliderRow("Splashes", "water.splashes", 0, 20, 1, ""),
      sliderRow("Splash size", "water.splashSize", 10, 200, 1, " px"),
      sliderRow("Fade to paper", "water.fade", 0, 100, 1, "%")
    ]), isWater);
    const ink = only(card("Ink", [
      sliderRow("Flow", "ink.flow", 0, 100, 1, "%"),
      sliderRow("Rim strength", "ink.rim", 0, 100, 1, "%"),
      sliderRow("Cells", "ink.cells", 0, 100, 1, "%"),
      sliderRow("Blend", "ink.blend", 0, 100, 1, "%"),
      sliderRow("Veins", "ink.veins", 0, 100, 1, "%"),
      row("Vein metal", segGroup("ink.metal", [{ v: "gold", l: "Gold" }, { v: "silver", l: "Silver" }, { v: "copper", l: "Copper" }]))
    ], { hint: "Veins 0 turns the metallic lines off." }), is("ink"));
    const spray = only(card("Spray", [
      sliderRow("Cans", "spray.cans", 3, 8, 1, " colours"),
      sliderRow("Soft edges", "spray.soft", 0, 100, 1, "%"),
      sliderRow("Overspray", "spray.overspray", 0, 100, 1, "%"),
      sliderRow("Speckle and splats", "spray.speckle", 0, 100, 1, "%"),
      sliderRow("Halftone", "spray.halftone", 0, 100, 1, "%"),
      sliderRow("Drips", "spray.drips", 0, 100, 1, "%"),
      sliderRow("Drip length", "spray.dripLength", 0, 100, 1, "%"),
      sliderRow("Outline", "spray.outline", 0, 100, 1, "%"),
      sliderRow("Highlight edge", "spray.highlight", 0, 100, 1, "%")
    ], { hint: "Soft edges 0 is a crisp stencil; 100 is a can held far from the wall." }), is("spray"));
    // picking a wall type also picks its usual colour; a swatch or hex after that overrides it
    const wallSeg = (opts) => {
      const g = segGroup("spray.wall", opts);
      g.addEventListener("click", () => { const c = WALL_COLOURS[kit.state.spray.wall]; if (c && kit.state.spray.wallColour !== c) { kit.state.spray.wallColour = c; kit.touch(); } });
      return g;
    };
    const wall = only(card("Wall", [
      row("Wall", wallSeg([{ v: "plain", l: "Plain" }, { v: "concrete", l: "Concrete" }, { v: "stucco", l: "Stucco" }, { v: "brick", l: "Brick" }])),
      row("", wallSeg([{ v: "block", l: "Block" }, { v: "metal", l: "Metal" }, { v: "wood", l: "Wood" }])),
      swatchRow("Wall colour", "spray.wallColour", SWATCHES.wall),
      row("Paint blend", segGroup("spray.blend", [{ v: "normal", l: "Normal" }, { v: "multiply", l: "Multiply" }, { v: "linearburn", l: "Burn" }])),
      row("", segGroup("spray.blend", [{ v: "overlay", l: "Overlay" }, { v: "softlight", l: "Soft light" }, { v: "hardlight", l: "Hard light" }])),
      sliderRow("Paint opacity", "spray.paintOpacity", 10, 100, 1, "%"),
      sliderRow("Wall relief", "spray.relief", 0, 100, 1, "%"),
      sliderRow("Bare wall", "spray.bare", 0, 100, 1, "%"),
      sliderRow("Grime", "spray.grime", 0, 100, 1, "%"),
      only(sliderRow("Cracks", "spray.cracks", 0, 100, 1, "%"), () => kit.state.spray.wall !== "metal"),
      // brick options
      only(row("Bond", segGroup("spray.brickPattern", [{ v: "running", l: "Running" }, { v: "stack", l: "Stack" }, { v: "flemish", l: "Flemish" }, { v: "basket", l: "Basket" }])), isWall("brick")),
      only(sliderRow("Brick size", "spray.brickSize", 50, 200, 1, "%"), isWall("brick")),
      only(sliderRow("Mortar width", "spray.mortar", 0, 100, 1, "%"), isWall("brick")),
      only(sliderRow("Brick colour mix", "spray.brickVariation", 0, 100, 1, "%"), isWall("brick")),
      only(swatchRow("Mortar colour", "spray.mortarColour", SWATCHES.mortar), isWall("brick", "block")),
      // wood options
      only(row("Planks", segGroup("spray.woodDir", [{ v: "vertical", l: "Vertical" }, { v: "horizontal", l: "Horizontal" }])), isWall("wood")),
      only(row("Finish", segGroup("spray.woodFinish", [{ v: "raw", l: "Raw" }, { v: "weathered", l: "Weathered" }, { v: "painted", l: "Painted" }])), isWall("wood")),
      only(sliderRow("Plank width", "spray.plankWidth", 50, 200, 1, "%"), isWall("wood")),
      only(sliderRow("Grain", "spray.grain", 0, 100, 1, "%"), isWall("wood")),
      only(sliderRow("Knots", "spray.knots", 0, 100, 1, "%"), isWall("wood"))
    ], { hint: "Paint blend mixes the paint into the wall (Normal sits on top). Wall relief shows the bumps and joints through the paint. Bare wall leaves the wall where the lightest paint would go." }), is("spray"));
    const angle = sliderRow("Hatch angle", "pastel.angle", 0, 180, 5, " deg");
    showIf(angle, () => kit.state.pastel.hatch === "fixed");
    const pastel = only(card("Pastel", [
      swatchRow("Paper", "pastel.paper", SWATCHES.paper),
      sliderRow("Tooth", "pastel.tooth", 0, 100, 1, "%"),
      sliderRow("Smudge", "pastel.smudge", 0, 100, 1, "%"),
      sliderRow("Pressure", "pastel.pressure", 0, 100, 1, "%"),
      row("Hatch", segGroup("pastel.hatch", [{ v: "follow", l: "Follow image" }, { v: "fixed", l: "Fixed angle" }])),
      angle,
      checkRow("Oil pastel", "pastel.oil")
    ], { hint: "Low pressure lets more paper show through." }), is("pastel"));
    const focus = card("Focus", [
      selectRow("Subject", "out.focus", [{ v: "none", l: "Whole image" }, { v: "selection", l: "Current selection" }, { v: "mask", l: "Source layer mask" }]),
      sliderRow("Edge softness", "focus.falloff", 0, 400, 5, " px"),
      sliderRow("Detail outside", "focus.outside", 0, 100, 1, "%")
    ], { hint: "Mark the subject: smaller strokes and more detail there, looser paint and more paper around it." });
    return [card("Style", [
      segGroup("style", [{ v: "oil", l: "Oil" }, { v: "watercolour", l: "Watercolour" }, { v: "impressionism", l: "Impressionism" }]),
      segGroup("style", [{ v: "ink", l: "Alcohol Ink" }, { v: "spray", l: "Spray Paint" }, { v: "pastel", l: "Pastel" }])
    ]), brush, colour, texture, water, ink, spray, wall, pastel, focus];
  },
  outputRows: (ui, kit) => {
    const { checkRow, sliderRow, selectRow, showIf } = ui;
    const a = sliderRow("Minimum long side", "out.minLong", 1000, 6000, 100, " px"), b = sliderRow("Minimum long side", "out.minLongWater", 1000, 6000, 100, " px");
    showIf(a, () => kit.state.out.printCopy && kit.state.style !== "watercolour");
    showIf(b, () => kit.state.out.printCopy && kit.state.style === "watercolour");
    const ppi = selectRow("Print resolution", "out.ppi", [{ v: 150, l: "150 ppi" }, { v: 240, l: "240 ppi" }, { v: 300, l: "300 ppi" }, { v: 350, l: "350 ppi" }]);
    showIf(ppi, () => kit.state.out.printCopy);
    return [checkRow("Print-ready copy for small photos", "out.printCopy"), a, b, ppi];
  }
});
if (typeof window !== "undefined") window.__paintBrew_test = panel._test;   // for scripted smoke tests in the UXP Debug console
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
