"use strict";
// Paint Brew's own Photoshop calls (everything else goes through core/ps-io.js):
//   makePrintCopy : duplicate + upscale + 300 ppi + 8-bit RGB, original untouched
//   readFocus     : the subject mask from the selection or the source layer's mask
const PS = require("../core/ps-io.js");
const { runModal } = require("../core/modal.js");
const photoshop = require("photoshop");
function ps() { return photoshop; }

function longSide(info) { return Math.max(info.w, info.h); }
function needsCopy(info, minLong) { return minLong > 0 && longSide(info) < minLong; }

async function makePrintCopy(doc, minLong, ppi) {
  const { core, constants } = ps();
  const info = PS.docInfo(doc);
  const s = minLong / longSide(info);
  const W = Math.round(info.w * s), H = Math.round(info.h * s);
  const name = String(info.name).replace(/\.[^.]+$/, "") + " - Paint Brew print";
  return runModal("Frank's Paint Brew: print-ready copy", async () => {
    const dup = await doc.duplicate(name);
    try { if (constants.BitsPerChannelType && dup.bitsPerChannel !== constants.BitsPerChannelType.EIGHT) dup.bitsPerChannel = constants.BitsPerChannelType.EIGHT; } catch (e) { /* already 8-bit */ }
    try { if (constants.DocumentMode && dup.mode !== constants.DocumentMode.RGB) await dup.changeMode(constants.ChangeMode.RGB); } catch (e) { /* already RGB */ }
    const RM = constants.ResampleMethod || {};
    const method = RM.PRESERVEDETAILS || RM.BICUBICSMOOTHER || RM.AUTOMATIC;
    await dup.resizeImage(W, H, ppi, method);
    return dup;
  }, { docId: doc.id, timeoutMs: 5 * 60000 });
}

// bounds and size that readSource used for r (so the mask lines up with the pixels)
function readBox(r) {
  const sc = r.scale || 1, b = { left: r.origin.left, top: r.origin.top };
  b.right = b.left + Math.round(r.src.w / sc); b.bottom = b.top + Math.round(r.src.h / sc);
  return b;
}
async function grey(imageData) {
  const raw = await imageData.getData({ chunky: true });
  const d = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const w = imageData.width, h = imageData.height, c = imageData.components || Math.round(d.length / (w * h));
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = d[i * c] / 255;
  try { imageData.dispose(); } catch (e) { /* ignore */ }
  return { w, h, m: out };
}
// place a mask read over `got` bounds into an array matching r.src
function place(r, box, got, gotBounds) {
  const W = r.src.w, H = r.src.h, out = new Float32Array(W * H);
  const gb = gotBounds || box;
  const sx = (box.right - box.left) / W, sy = (box.bottom - box.top) / H;
  const gsx = (gb.right - gb.left) / got.w, gsy = (gb.bottom - gb.top) / got.h;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = box.left + (x + 0.5) * sx, dy = box.top + (y + 0.5) * sy;
    const gx = Math.floor((dx - gb.left) / gsx), gy = Math.floor((dy - gb.top) / gsy);
    if (gx >= 0 && gy >= 0 && gx < got.w && gy < got.h) out[y * W + x] = got.m[gy * got.w + gx];
  }
  return out;
}
function boundsOf(o) {
  if (!o) return null;
  const n = (v) => (v && typeof v === "object" ? Number(v._value != null ? v._value : v.value) : Number(v));
  return { left: n(o.left), top: n(o.top), right: n(o.right), bottom: n(o.bottom) };
}
// mode: "selection" | "mask"; layer: the source layer for "mask"
async function readFocus(doc, mode, layer, r) {
  const { core, imaging } = ps();
  const box = readBox(r);
  const opts = { documentID: doc.id, sourceBounds: box };
  if ((r.scale || 1) < 1) opts.targetSize = { width: r.src.w, height: r.src.h };
  return runModal("Frank's Paint Brew: reading focus", async () => {
    let res;
    if (mode === "selection") res = await imaging.getSelection(opts);
    else {
      let L = layer;
      if (!L) { try { L = Array.from(doc.activeLayers || [])[0]; } catch (e) { L = null; } }
      if (!L) return null;
      res = await imaging.getLayerMask(Object.assign({ layerID: L.id, kind: "user" }, opts));
    }
    if (!res || !res.imageData) return null;
    const got = await grey(res.imageData);
    return place(r, box, got, boundsOf(res.sourceBounds));
  }, { docId: doc.id, timeoutMs: 60000 });
}
// resample a full-size mask (from the original) onto a scaled copy's pixels
function scaleMask(m, w, h, W, H) {
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = m[Math.min(h - 1, Math.floor(y * h / H)) * w + Math.min(w - 1, Math.floor(x * w / W))];
  return out;
}
module.exports = { makePrintCopy, readFocus, needsCopy, scaleMask, longSide };
