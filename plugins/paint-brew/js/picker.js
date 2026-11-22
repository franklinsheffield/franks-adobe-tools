"use strict";
// In-panel colour picker: a shade square for the current hue plus a hue strip.
// Drawn as small PNG images (UXP has no full canvas), driven by mouse drags.
// It never opens Photoshop's own colour picker dialog.
const PNG = require("../core/png.js");

function hsv2rgb(h, s, v) {
  const i = Math.floor(h * 6) % 6, f = h * 6 - Math.floor(h * 6), p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const r = [v, q, p, p, t, v][i], g = [t, v, v, q, p, p][i], b = [p, p, t, v, v, q][i];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 1e-6) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; if (h < 0) h += 1; }
  return [h, mx > 0 ? d / mx : 0, mx];
}
const toHex = (c) => "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
const fromHex = (h) => { const v = parseInt(String(h).replace("#", ""), 16) || 0; return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };

const SW = 96, SH = 56;     // shade square image size (shown larger)
function squareURL(hue) {
  const d = new Uint8Array(SW * SH * 3);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const c = hsv2rgb(hue, x / (SW - 1), 1 - y / (SH - 1)), p = (y * SW + x) * 3;
    d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
  }
  return PNG.dataURL(d, SW, SH, 3);
}
let hueURL = null;
function hueStripURL() {
  if (hueURL) return hueURL;
  const W = 120, H = 4, d = new Uint8Array(W * H * 3);
  for (let x = 0; x < W; x++) { const c = hsv2rgb(x / W, 1, 1); for (let y = 0; y < H; y++) { const p = (y * W + x) * 3; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; } }
  return (hueURL = PNG.dataURL(d, W, H, 3));
}

// opts: { el, get: () => "#RRGGBB", set: (hex, commit) => void }
// returns { chip, panel, sync }: chip opens/closes the panel; sync() follows outside changes
function createPicker(opts) {
  const { el } = opts;
  const BW = 200, BH = 110, HH = 14;
  let hsv = rgb2hsv(...fromHex(opts.get())), open = false, dragging = false, shownHue = -1;
  const chip = el("div", { class: "pickchip", title: "Colour picker", style: { width: "22px", height: "18px", border: "1px solid #ffffff", borderRadius: "3px", marginLeft: "4px", cursor: "pointer", flex: "none" } });
  const sq = el("img", { style: { width: BW + "px", height: BH + "px", display: "block" } });
  const sqDot = el("div", { style: { position: "absolute", width: "8px", height: "8px", border: "2px solid #ffffff", borderRadius: "6px", boxShadow: "0 0 2px #000000" } });
  const sqWrap = el("div", { style: { position: "relative", width: BW + "px", height: BH + "px", cursor: "crosshair" } }, [sq, sqDot]);
  const hue = el("img", { src: hueStripURL(), style: { width: BW + "px", height: HH + "px", display: "block" } });
  const hueMark = el("div", { style: { position: "absolute", top: "-2px", width: "4px", height: (HH + 2) + "px", border: "1px solid #ffffff", background: "rgba(0,0,0,0.25)" } });
  const hueWrap = el("div", { style: { position: "relative", width: BW + "px", height: HH + "px", marginTop: "6px", cursor: "ew-resize" } }, [hue, hueMark]);
  const panel = el("div", { class: "picker", style: { display: "none", padding: "6px 0 8px 0" } }, [sqWrap, hueWrap]);

  const draw = () => {
    if (Math.abs(hsv[0] - shownHue) > 1e-4) { sq.src = squareURL(hsv[0]); shownHue = hsv[0]; }
    sqDot.style.left = Math.round(hsv[1] * BW - 6) + "px";
    sqDot.style.top = Math.round((1 - hsv[2]) * BH - 6) + "px";
    hueMark.style.left = Math.round(hsv[0] * BW - 2) + "px";
    chip.style.backgroundColor = toHex(hsv2rgb(hsv[0], hsv[1], hsv[2]));
  };
  const emit = (commit) => { const hex = toHex(hsv2rgb(hsv[0], hsv[1], hsv[2])); chip.style.backgroundColor = hex; opts.set(hex, commit); };
  const drag = (wrap, onPos) => {
    const pos = (e) => { const r = wrap.getBoundingClientRect(); onPos(Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width))), Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)))); draw(); emit(false); };
    const move = (e) => { if (dragging) pos(e); };
    const up = () => { if (!dragging) return; dragging = false; document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); emit(true); };
    wrap.addEventListener("mousedown", (e) => {
      dragging = true; pos(e);
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
      if (e.preventDefault) e.preventDefault();
    });
  };
  drag(sqWrap, (x, y) => { hsv[1] = x; hsv[2] = 1 - y; });
  drag(hueWrap, (x) => { hsv[0] = Math.min(0.999, x); if (hsv[1] < 0.05) hsv[1] = 0.6; if (hsv[2] < 0.05) hsv[2] = 0.6; });
  chip.addEventListener("click", () => { open = !open; panel.style.display = open ? "" : "none"; if (open) draw(); });
  const sync = () => {
    if (dragging) return;
    const cur = String(opts.get()).toUpperCase();
    if (cur !== toHex(hsv2rgb(hsv[0], hsv[1], hsv[2]))) {
      const n = rgb2hsv(...fromHex(cur));
      if (n[1] < 1e-3) n[0] = hsv[0];          // greys keep the hue you were on
      hsv = n;
    }
    chip.style.backgroundColor = cur;
    if (open) draw();
  };
  return { chip, panel, sync };
}

module.exports = { createPicker, hsv2rgb, rgb2hsv, toHex, fromHex };
