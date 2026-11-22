"use strict";
// Mobglow 2.0 - panel UI: one-click realistic, dreamy glow (Frank's spec, 2026-11-22).
// Glow card follows Frank's reference: Render, three icon keys (source image,
// eyedropper, brush mask), Radius / Strength / Threshold / Gamma / Saturation
// and a Color switch with its swatch.
const Engine = require("./js/engine.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const { createToolPanel } = require("./core/toolpanel.js");
const PNG = require("./core/png.js");

const GROUP = "Frank's Mobglow Brew";

// ---- icons: white line glyphs drawn in code (UXP's SVG support is patchy)
function icon(kind) {
  const S = 36, d = new Uint8Array(S * S * 4);
  const segs = [], discs = [];
  const seg = (x0, y0, x1, y1, w) => segs.push([x0, y0, x1, y1, w]);
  if (kind === "image") {
    seg(5, 8, 31, 8, 2.2); seg(31, 8, 31, 28, 2.2); seg(31, 28, 5, 28, 2.2); seg(5, 28, 5, 8, 2.2);
    seg(8, 25, 15, 16, 2); seg(15, 16, 21, 23, 2); seg(19, 21, 23, 18, 2); seg(23, 18, 28, 25, 2);
    discs.push([24, 13, 2.6]);
  } else if (kind === "drop") {
    seg(7, 29, 20, 16, 2.4); seg(7, 29, 9, 27, 3.4);
    seg(17, 13, 23, 19, 2.6); discs.push([25, 11, 5]);
  } else {
    seg(29, 7, 17, 19, 2.6); seg(18, 18, 14, 22, 4.4);
    discs.push([10, 26, 4.6]); seg(7, 30, 4, 32, 2);
  }
  const distSeg = (px, py, [x0, y0, x1, y1]) => {
    const vx = x1 - x0, vy = y1 - y0, t = Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / (vx * vx + vy * vy || 1)));
    return Math.hypot(px - (x0 + vx * t), py - (y0 + vy * t));
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let a = 0;
    for (const s of segs) a = Math.max(a, Math.max(0, Math.min(1, s[4] / 2 + 0.5 - distSeg(x + 0.5, y + 0.5, s))));
    for (const [cx, cy, r] of discs) a = Math.max(a, Math.max(0, Math.min(1, r + 0.5 - Math.hypot(x + 0.5 - cx, y + 0.5 - cy))));
    const i = (y * S + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
  }
  return PNG.dataURL(d, S, S, 4);
}

// ---- Photoshop side of the brush key: mask the last Mobglow group's Glow layer and pick the Brush tool
async function maskGlowAndBrush() {
  const ps = require("photoshop");
  const doc = ps.app.activeDocument;
  if (!doc) throw new Error("Open a document first.");
  const group = Array.from(doc.layers || []).find((L) => String(L.name).indexOf(GROUP) === 0 && L.layers);
  const glow = group && Array.from(group.layers).find((L) => L.name === "Glow");
  if (!glow) throw new Error("Render first: no Mobglow group in this document.");
  await ps.core.executeAsModal(async () => {
    const bp = ps.action.batchPlay;
    await bp([{ _obj: "select", _target: [{ _ref: "layer", _id: glow.id }], makeVisible: false }], {});
    const info = await bp([{ _obj: "get", _target: [{ _ref: "layer", _id: glow.id }] }], {});
    if (!(info && info[0] && info[0].hasUserMask)) {
      await bp([{ _obj: "make", new: { _class: "channel" }, at: { _ref: "channel", _enum: "channel", _value: "mask" }, using: { _enum: "userMaskEnabled", _value: "revealAll" } }], {});
    }
    await bp([{ _obj: "set", _target: [{ _ref: "color", _property: "foregroundColor" }], to: { _obj: "RGBColor", red: 0, grain: 0, blue: 0 } }], {});
    await bp([{ _obj: "select", _target: [{ _ref: "paintbrushTool" }] }], {});
  }, { commandName: GROUP + " - mask" });
}

const panel = createToolPanel({
  code: "MG-04", glow: "#ff2fd6",
  appName: GROUP, title: GROUP, sub: "one-click realistic, dreamy glow", panelId: "mobglowPanel",
  presetFile: "presets.json", exportName: "mobglow-looks.json",
  applyLabel: "Render", split: true,
  footer: GROUP + " 2.0  -  Frank's Brew suite",
  Engine, DEFAULTS, PRESETS, merge, clone,
  cards: (ui, kit) => {
    const { card, sliderRow, checkRow, el, showIf, bind } = ui;
    let picking = false;
    const key = (kind, title, onClick) => {
      const b = el("button", { class: "btn mgkey", title }, [el("img", { class: "mgico", src: icon(kind) })]);
      b.addEventListener("click", onClick);
      return b;
    };
    const srcKey = key("image", "Glow source: flattened image or the active layer (click to switch)", () => {
      kit.state.out.source = kit.state.out.source === "flat" ? "layer" : "flat"; kit.touch();
    });
    const srcLbl = el("span", { class: "lbl2 mgsrc" });
    bind(() => { const flat = kit.state.out.source === "flat"; srcLbl.textContent = flat ? "Image" : "Layer"; srcKey.classList.add("on"); });
    const dropKey = key("drop", "Pick the glow colour: click this, then click the preview", () => {
      picking = !picking;
      if (picking) dropKey.classList.add("on"); else dropKey.classList.remove("on");
      kit.setStatus(picking ? "Click the preview to pick the glow colour." : "Ready");
    });
    const brushKey = key("brush", "Paint the glow away: adds a mask to the Glow layer of the last Render and picks the Brush tool (black)", () => {
      maskGlowAndBrush().then(() => kit.setStatus("Glow mask ready: paint black to remove glow, white to bring it back."))
        .catch((e) => kit.setStatus(String(e && e.message || e), true));
    });
    kit.onPreviewPress(({ u, v }) => {
      if (!picking) return false;
      const s = kit.source;
      if (!s) return true;
      const x = Math.min(s.w - 1, Math.floor(u * s.w)), y = Math.min(s.h - 1, Math.floor(v * s.h)), c = s.c || 4;
      // average a 5x5 patch so one noisy pixel does not decide the colour
      let r = 0, g = 0, b = 0, k = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = Math.max(0, Math.min(s.w - 1, x + dx)), yy = Math.max(0, Math.min(s.h - 1, y + dy)), j = (yy * s.w + xx) * c;
        r += s.data[j]; g += s.data[j + 1]; b += s.data[j + 2]; k++;
      }
      const hex = "#" + [r, g, b].map((v2) => Math.round(v2 / k).toString(16).padStart(2, "0")).join("").toUpperCase();
      kit.state.color.hex = hex; kit.state.color.on = true;
      picking = false; dropKey.classList.remove("on");
      kit.setStatus("Glow colour " + hex);
      kit.touch();
      return true;
    });
    const render = el("button", { class: "btn mgrender", text: "Render", title: "Apply the glow to the document (same as the Render key under Output)" });
    render.addEventListener("click", () => kit.applyNow());
    const colourOn = checkRow("Color", "color.on");
    const colourHex = kit.colourRow("Glow colour", "color.hex");
    showIf(colourHex, () => kit.state.color.on);
    return [
      card("Glow", [
        render,
        el("div", { class: "row mgkeys" }, [el("span", { class: "mgk" }, [srcKey, srcLbl]), dropKey, brushKey]),
        sliderRow("Radius", "glow.radius", 1, 1000, 1, " px"),
        sliderRow("Strength", "glow.strength", 0, 500, 1, ""),
        sliderRow("Threshold", "glow.threshold", 0, 3, 0.01, ""),
        sliderRow("Gamma", "glow.gamma", 0.1, 3, 0.01, ""),
        sliderRow("Saturation", "glow.sat", 0, 100, 1, ""),
        colourOn, colourHex
      ], { section: "controls" }),
      card("Finish", [
        sliderRow("Grain", "finish.grain", 0, 100, 1, "%"),
        sliderRow("Darken background", "finish.darken", 0, 100, 1, "%")
      ], { section: "controls", bypass: { "finish.grain": 0, "finish.darken": 0 } })
    ];
  }
});
if (typeof module !== "undefined" && module && module.exports) module.exports = panel;
