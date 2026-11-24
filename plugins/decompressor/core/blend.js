"use strict";
// shared/blend.js - Blending (all plugins): blend mode + opacity for the result group.
// State lives at state.blend = { mode, opacity } and is saved with the look.
// Apply sets these as real Photoshop settings on the result group, so they stay
// editable in the Layers panel. When blending is active the group sits over the
// visible source, so the source is never hidden.
// The preview flattens the result, then blends it over the source with the same
// maths Photoshop uses (W3C compositing formulas; Dissolve is a hashed dither).

const DEFAULT = { mode: "NORMAL", opacity: 100 };

// the 27 Photoshop layer blend modes, grouped as in Photoshop's menu
const MODES = [
  ["NORMAL", "Normal"], ["DISSOLVE", "Dissolve"],
  ["DARKEN", "Darken"], ["MULTIPLY", "Multiply"], ["COLORBURN", "Color Burn"], ["LINEARBURN", "Linear Burn"], ["DARKERCOLOR", "Darker Color"],
  ["LIGHTEN", "Lighten"], ["SCREEN", "Screen"], ["COLORDODGE", "Color Dodge"], ["LINEARDODGE", "Linear Dodge (Add)"], ["LIGHTERCOLOR", "Lighter Color"],
  ["OVERLAY", "Overlay"], ["SOFTLIGHT", "Soft Light"], ["HARDLIGHT", "Hard Light"], ["VIVIDLIGHT", "Vivid Light"], ["LINEARLIGHT", "Linear Light"], ["PINLIGHT", "Pin Light"], ["HARDMIX", "Hard Mix"],
  ["DIFFERENCE", "Difference"], ["EXCLUSION", "Exclusion"], ["SUBTRACT", "Subtract"], ["DIVIDE", "Divide"],
  ["HUE", "Hue"], ["SATURATION", "Saturation"], ["COLOR", "Color"], ["LUMINOSITY", "Luminosity"]
];
const GROUPS = [2, 5, 5, 7, 4, 4];   // menu separators: how many modes in each group

const norm = (b) => {
  const m = b && MODES.some((x) => x[0] === b.mode) ? b.mode : "NORMAL";
  const o = b && Number.isFinite(Number(b.opacity)) ? Math.max(0, Math.min(100, Number(b.opacity))) : 100;
  return { mode: m, opacity: o };
};
function active(b) { const n = norm(b); return n.mode !== "NORMAL" || n.opacity < 100; }
function label(b) { const n = norm(b); return (MODES.find((x) => x[0] === n.mode)[1]).toUpperCase() + " " + Math.round(n.opacity) + "%"; }

// ---- per-channel (separable) modes, values 0..1: b = backdrop (source), s = result
const C = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const SEP = {
  NORMAL: (b, s) => s,
  DISSOLVE: (b, s) => s,
  DARKEN: (b, s) => Math.min(b, s),
  MULTIPLY: (b, s) => b * s,
  COLORBURN: (b, s) => (b >= 1 ? 1 : s <= 0 ? 0 : 1 - Math.min(1, (1 - b) / s)),
  LINEARBURN: (b, s) => C(b + s - 1),
  LIGHTEN: (b, s) => Math.max(b, s),
  SCREEN: (b, s) => b + s - b * s,
  COLORDODGE: (b, s) => (b <= 0 ? 0 : s >= 1 ? 1 : Math.min(1, b / (1 - s))),
  LINEARDODGE: (b, s) => C(b + s),
  OVERLAY: (b, s) => SEP.HARDLIGHT(s, b),
  SOFTLIGHT: (b, s) => {
    if (s <= 0.5) return b - (1 - 2 * s) * b * (1 - b);
    const d = b <= 0.25 ? ((16 * b - 12) * b + 4) * b : Math.sqrt(b);
    return b + (2 * s - 1) * (d - b);
  },
  HARDLIGHT: (b, s) => (s <= 0.5 ? b * 2 * s : SEP.SCREEN(b, 2 * s - 1)),
  VIVIDLIGHT: (b, s) => (s <= 0.5 ? SEP.COLORBURN(b, 2 * s) : SEP.COLORDODGE(b, 2 * s - 1)),
  LINEARLIGHT: (b, s) => C(b + 2 * s - 1),
  PINLIGHT: (b, s) => (s <= 0.5 ? Math.min(b, 2 * s) : Math.max(b, 2 * s - 1)),
  HARDMIX: (b, s) => (b + s >= 1 ? 1 : 0),
  DIFFERENCE: (b, s) => Math.abs(b - s),
  EXCLUSION: (b, s) => b + s - 2 * b * s,
  SUBTRACT: (b, s) => C(b - s),
  DIVIDE: (b, s) => (s <= 0 ? (b > 0 ? 1 : 0) : C(b / s))
};

// ---- non-separable modes (whole colour), W3C definitions
const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
function clipColor(c) {
  const l = lum(c), n = Math.min(c[0], c[1], c[2]), x = Math.max(c[0], c[1], c[2]);
  let o = c;
  if (n < 0) o = o.map((v) => l + (v - l) * l / (l - n || 1));
  if (x > 1) o = o.map((v) => l + (v - l) * (1 - l) / (x - l || 1));
  return o;
}
const setLum = (c, l) => { const d = l - lum(c); return clipColor([c[0] + d, c[1] + d, c[2] + d]); };
const sat = (c) => Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
function setSat(c, s) {
  const mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
  if (mx <= mn) return [0, 0, 0];
  return c.map((v) => (v - mn) * s / (mx - mn));
}
const WHOLE = {
  HUE: (b, s) => setLum(setSat(s, sat(b)), lum(b)),
  SATURATION: (b, s) => setLum(setSat(b, sat(s)), lum(b)),
  COLOR: (b, s) => setLum(s, lum(b)),
  LUMINOSITY: (b, s) => setLum(b, lum(s)),
  DARKERCOLOR: (b, s) => (lum(s) < lum(b) ? s : b),
  LIGHTERCOLOR: (b, s) => (lum(s) > lum(b) ? s : b)
};

// mix one pixel: backdrop b and result s are [r,g,b] 0..1; a = result alpha x opacity
function mixPixel(mode, b, s, a, i) {
  if (mode === "DISSOLVE") { const h = Math.sin(i * 12.9898) * 43758.5453; return (h - Math.floor(h)) < a ? s : b; }
  let f;
  if (WHOLE[mode]) f = WHOLE[mode](b, s);
  else { const g = SEP[mode] || SEP.NORMAL; f = [g(b[0], s[0]), g(b[1], s[1]), g(b[2], s[2])]; }
  return [b[0] + (f[0] - b[0]) * a, b[1] + (f[1] - b[1]) * a, b[2] + (f[2] - b[2]) * a];
}

// The result group's own pixels (RGB + alpha), from the engine's composite on black and on white
function flatten(Engine, res, src) {
  const k = Engine.composite(res, { type: "black" }, src), w = Engine.composite(res, { type: "white" }, src);
  const n = res.w * res.h, rgb = new Float32Array(n * 3), alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = 1 - Math.min(1, Math.max(0, ((w[i * 3] - k[i * 3]) + (w[i * 3 + 1] - k[i * 3 + 1]) + (w[i * 3 + 2] - k[i * 3 + 2])) / 765));
    alpha[i] = a;
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = a > 1e-3 ? Math.min(1, k[i * 3 + c] / 255 / a) : 0;
  }
  return { rgb, alpha };
}

// Preview: the result blended over the source (as it will look in Photoshop), RGB 0..255
function preview(Engine, res, src, blend) {
  const b = norm(blend), n = res.w * res.h, out = new Uint8Array(n * 3);
  const { rgb, alpha } = flatten(Engine, res, src);
  const c = src.c || 4, op = b.opacity / 100;
  for (let i = 0; i < n; i++) {
    const j = i * c, d = src.data;
    const bk = [d[j] / 255, (c >= 3 ? d[j + 1] : d[j]) / 255, (c >= 3 ? d[j + 2] : d[j]) / 255];
    const m = mixPixel(b.mode, bk, [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]], alpha[i] * op, i);
    out[i * 3] = Math.round(C(m[0]) * 255); out[i * 3 + 1] = Math.round(C(m[1]) * 255); out[i * 3 + 2] = Math.round(C(m[2]) * 255);
  }
  return out;
}

// Photoshop side: set the mode and opacity on the result group (constants = require("photoshop").constants)
function applyToGroup(group, blend, constants) {
  const b = norm(blend);
  if (!group || !active(b)) return;
  try { group.blendMode = constants.BlendMode[b.mode] || constants.BlendMode.NORMAL; } catch (e) { /* ignore */ }
  try { group.opacity = b.opacity; } catch (e) { /* ignore */ }
}

// The Blend card (shared toolpanel, Output section, directly above Output).
// Its folded summary reads like "SCREEN 80%".
function card(ui, getState) {
  const { el, selectRow, sliderRow, showIf } = ui;
  const hint = el("div", { class: "hint", text: "Blends the result over your picture, like a layer's blend mode. The source stays visible under it." });
  showIf(hint, () => active(getState().blend));
  return ui.card("Blend", [
    selectRow("Blend mode", "blend.mode", MODES.map((m) => ({ v: m[0], l: m[1] }))),
    sliderRow("Opacity", "blend.opacity", 0, 100, 1, "%"),
    hint
  ], { section: "output" });
}

// ---- API for the 3.0 toolpanel (Brew 3.0 build thread)
// createBlendCard(ui, { getState, touch }) -> the Blend card node
function createBlendCard(ui, o) { return card(ui, o && o.getState ? o.getState : () => ({ blend: DEFAULT })); }
// blendPreview(rgbaTop, rgbUnder, w, h, blend) -> Uint8Array RGB
//   rgbaTop: Uint8Array w*h*4 (the result group's pixels), rgbUnder: Uint8Array w*h*3 or *4 (the picture)
function blendPreview(rgbaTop, rgbUnder, w, h, blend) {
  const b = norm(blend), n = w * h, out = new Uint8Array(n * 3), cu = rgbUnder.length >= n * 4 ? 4 : 3, op = b.opacity / 100;
  for (let i = 0; i < n; i++) {
    const u = i * cu, t = i * 4;
    const m = mixPixel(b.mode, [rgbUnder[u] / 255, rgbUnder[u + 1] / 255, rgbUnder[u + 2] / 255], [rgbaTop[t] / 255, rgbaTop[t + 1] / 255, rgbaTop[t + 2] / 255], rgbaTop[t + 3] / 255 * op, i);
    out[i * 3] = Math.round(C(m[0]) * 255); out[i * 3 + 1] = Math.round(C(m[1]) * 255); out[i * 3 + 2] = Math.round(C(m[2]) * 255);
  }
  return out;
}
// applyBlend(group, blend[, constants]) - Photoshop side; constants defaults to require("photoshop").constants
function applyBlend(group, blend, constants) {
  if (!constants) { try { constants = require("photoshop").constants; } catch (e) { return; } }
  applyToGroup(group, blend, constants);
}

module.exports = { DEFAULT, MODES, GROUPS, norm, active, label, mixPixel, flatten, preview, applyToGroup, card,
  createBlendCard, blendPreview, applyBlend, _internal: { SEP, WHOLE } };
