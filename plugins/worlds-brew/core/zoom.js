"use strict";
// ======================================================================
// Brew 3.0 preview zoom (spec "Preview zoom and pan"): pure helpers.
//   Fit / 1:1, - / + through the preset ladder, typed 5-3200 %, click to zoom
//   at a point, Alt-click out, drag to pan, navigator, pixel grid from 800 %.
// Up to 100 % the preview renders a downscaled copy of the visible area; above
// 100 % it renders the visible area at full size and enlarges it with hard-edged
// pixels, so dithers and ASCII cells stay exact. No wheel zoom (rule 1).
// ======================================================================
const LADDER = [0.05, 0.0625, 0.0833, 0.125, 0.1667, 0.25, 0.3333, 0.5, 0.6667, 1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 20, 24, 32];
const PRESETS = [["Fit", "fit"], ["Fill", "fill"], ["25%", 0.25], ["50%", 0.5], ["100%", 1], ["200%", 2], ["400%", 4], ["800%", 8], ["1600%", 16]];
const MIN = 0.05, MAX = 32;

function clampZ(z) { return Math.max(MIN, Math.min(MAX, z)); }
// next step on the ladder from z (dir +1 / -1)
function step(z, dir) {
  if (dir > 0) { for (const s of LADDER) if (s > z * 1.001) return s; return MAX; }
  for (let i = LADDER.length - 1; i >= 0; i--) if (LADDER[i] < z * 0.999) return LADDER[i];
  return MIN;
}
function fitZoom(W, H, boxW, boxH) { return Math.min(boxW / W, boxH / H); }
function fillZoom(W, H, boxW, boxH) { return Math.max(boxW / W, boxH / H); }
function pctText(z) { const p = z * 100; return p >= 10 ? String(Math.round(p)) : p.toFixed(1); }

// Visible region of a W x H image at zoom z in a boxW x boxH viewport, centred on (cx, cy) 0..1.
// Returns doc-pixel rect { l, t, w, h }, the viewport size { vw, vh } and the centre clamped so
// the view never leaves the picture.
function region(W, H, z, boxW, boxH, cx, cy) {
  const vw = Math.max(1, Math.min(boxW, Math.round(W * z))), vh = Math.max(1, Math.min(boxH, Math.round(H * z)));
  const w = Math.max(1, Math.min(W, Math.round(vw / z))), h = Math.max(1, Math.min(H, Math.round(vh / z)));
  let l = Math.round(cx * W - w / 2), t = Math.round(cy * H - h / 2);
  l = Math.max(0, Math.min(W - w, l)); t = Math.max(0, Math.min(H - h, t));
  return { l, t, w, h, vw, vh, cx: (l + w / 2) / W, cy: (t + h / 2) / H };
}

// crop an RGBA/RGB source { w, h, c, data } to rect (extra keys like masks are cropped too when they are full-size planes)
function crop(src, r) {
  const c = src.c || 4, out = { w: r.w, h: r.h, c, data: new Uint8Array(r.w * r.h * c) };
  for (let y = 0; y < r.h; y++) out.data.set(src.data.subarray(((r.t + y) * src.w + r.l) * c, ((r.t + y) * src.w + r.l + r.w) * c), y * r.w * c);
  return out;
}

// nearest-neighbour enlarge of an RGB (3 ch) image to ow x oh: hard-edged pixels
function enlarge(rgb, w, h, ow, oh) {
  const out = new Uint8Array(ow * oh * 3);
  const xs = new Int32Array(ow);
  for (let x = 0; x < ow; x++) xs[x] = Math.min(w - 1, Math.floor(x * w / ow)) * 3;
  for (let y = 0; y < oh; y++) {
    const sy = Math.min(h - 1, Math.floor(y * h / oh)) * w * 3, o = y * ow * 3;
    for (let x = 0; x < ow; x++) { const s = sy + xs[x], d = o + x * 3; out[d] = rgb[s]; out[d + 1] = rgb[s + 1]; out[d + 2] = rgb[s + 2]; }
  }
  return out;
}

// 1 px grid on doc-pixel boundaries (pixel grid toggle, shown from 800 %)
function drawGrid(rgb, ow, oh, w, h) {
  const line = (d) => { rgb[d] = (rgb[d] * 3 + 128) >> 2; rgb[d + 1] = (rgb[d + 1] * 3 + 128) >> 2; rgb[d + 2] = (rgb[d + 2] * 3 + 128) >> 2; };
  let px = -1;
  for (let x = 0; x < ow; x++) { const sx = Math.floor(x * w / ow); if (sx !== px) { px = sx; for (let y = 0; y < oh; y++) line((y * ow + x) * 3); } }
  let py = -1;
  for (let y = 0; y < oh; y++) { const sy = Math.floor(y * h / oh); if (sy !== py) { py = sy; for (let x = 0; x < ow; x++) line((y * ow + x) * 3); } }
  return rgb;
}

// navigator: small thumbnail with the visible rect outlined in cyan (#5cf2ff)
function navigator(thumb, tw, th, rect, W, H) {
  const out = Uint8Array.from(thumb);
  const x0 = Math.floor(rect.l / W * tw), y0 = Math.floor(rect.t / H * th);
  const x1 = Math.min(tw - 1, Math.ceil((rect.l + rect.w) / W * tw) - 1), y1 = Math.min(th - 1, Math.ceil((rect.t + rect.h) / H * th) - 1);
  const put = (x, y) => { if (x < 0 || y < 0 || x >= tw || y >= th) return; const d = (y * tw + x) * 3; out[d] = 92; out[d + 1] = 242; out[d + 2] = 255; };
  for (let x = x0; x <= x1; x++) { put(x, y0); put(x, y1); }
  for (let y = y0; y <= y1; y++) { put(x0, y); put(x1, y); }
  // dim outside the box
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) if (x < x0 || x > x1 || y < y0 || y > y1) { const d = (y * tw + x) * 3; out[d] >>= 1; out[d + 1] >>= 1; out[d + 2] >>= 1; }
  return out;
}

module.exports = { LADDER, PRESETS, MIN, MAX, clampZ, step, fitZoom, fillZoom, pctText, region, crop, enlarge, drawGrid, navigator };
