"use strict";
// Depthtone 2.0 Photoshop side: the extra depth inputs the engine can use.
//   subject  - Photoshop's Select Subject, read as a mask, then rolled back (the user's
//              selection and history are left as they were)
//   depthMap - the pixels of a layer the user picked as the depth map
// Both are resampled to exactly the region and size of the source the panel just read.
let ps = null;
try { ps = require("photoshop"); } catch (e) { ps = null; }   // absent in Node engine tests
function host() { if (!ps) throw new Error("Photoshop is not available"); return ps; }

const CACHE_MAX = 1024;          // preview subject mask is kept at this size per document
let cache = null;                // { key, w, h, data:Uint8Array }

function docSize(doc) { return { W: Math.round(Number(doc.width) || 1), H: Math.round(Number(doc.height) || 1) }; }

async function readSelection(ctlDoc, W, H, target) {
  const { imaging } = host();
  const o = { documentID: ctlDoc.id, sourceBounds: { left: 0, top: 0, right: W, bottom: H } };
  if (target) o.targetSize = target;
  const r = await imaging.getSelection(o);
  const img = r.imageData, raw = await img.getData({ chunky: true });
  const data = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  const w = img.width, h = img.height, c = img.components || Math.round(data.length / (w * h)) || 1;
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = data[i * c];
  try { img.dispose(); } catch (e) { /* ignore */ }
  return { w, h, data: m };
}

// Select Subject inside a suspended history step that is rolled back
async function subjectMask(doc, full, appName) {
  const { core, action } = host();
  const { W, H } = docSize(doc);
  const sc = full ? 1 : Math.min(1, CACHE_MAX / Math.max(W, H));
  const target = sc < 1 ? { width: Math.max(1, Math.round(W * sc)), height: Math.max(1, Math.round(H * sc)) } : null;
  let out = null;
  await core.executeAsModal(async (ctl) => {
    const hid = await ctl.hostControl.suspendHistory({ documentID: doc.id, name: appName + ": find subject" });
    try {
      await action.batchPlay([{ _obj: "autoCutout", sampleAllLayers: true }], { modalBehavior: "execute" });
      out = await readSelection(doc, W, H, target);
    } finally {
      try { await ctl.hostControl.resumeHistory(hid, false); } catch (e) { /* ignore */ }
    }
  }, { commandName: appName + ": finding the subject" });
  return out;
}

// cut the panel's source region out of a whole-document mask and scale it to the source size
function fitToSource(mask, W, H, r) {
  const sw = r.src.w, sh = r.src.h, sc = r.scale || 1, o = r.origin || { left: 0, top: 0 };
  const f = new Float32Array(sw * sh), kx = mask.w / W, ky = mask.h / H;
  for (let y = 0; y < sh; y++) {
    const my = Math.min(mask.h - 1, Math.max(0, Math.floor((o.top + (y + 0.5) / sc) * ky)));
    for (let x = 0; x < sw; x++) {
      const mx = Math.min(mask.w - 1, Math.max(0, Math.floor((o.left + (x + 0.5) / sc) * kx)));
      f[y * sw + x] = mask.data[my * mask.w + mx] / 255;
    }
  }
  return f;
}

async function addSubject(doc, r, phase, appName, force) {
  const { W, H } = docSize(doc);
  const key = doc.id + ":" + W + "x" + H;
  let mask;
  if (phase === "apply") mask = await subjectMask(doc, true, appName);
  else {
    if (force || !cache || cache.key !== key) { const m = await subjectMask(doc, false, appName); cache = Object.assign({ key }, m); }
    mask = cache;
  }
  r.src.subject = fitToSource(mask, W, H, r);
}

async function addDepthLayer(doc, r, layerId, appName) {
  const { core, imaging } = host();
  const sc = r.scale || 1, o = r.origin || { left: 0, top: 0 };
  const bw = Math.round(r.src.w / sc), bh = Math.round(r.src.h / sc);
  const bounds = { left: o.left, top: o.top, right: o.left + bw, bottom: o.top + bh };
  let res = null;
  await core.executeAsModal(async () => {
    const opts = { documentID: doc.id, layerID: layerId, colorSpace: "RGB", componentSize: 8, sourceBounds: bounds };
    if (bw !== r.src.w || bh !== r.src.h) opts.targetSize = { width: r.src.w, height: r.src.h };
    const g = await imaging.getPixels(opts);
    const img = g.imageData, raw = await img.getData({ chunky: true });
    res = { w: img.width, h: img.height, c: img.components || 4, data: raw instanceof Uint8Array ? raw : new Uint8Array(raw) };
    try { img.dispose(); } catch (e) { /* ignore */ }
  }, { commandName: appName + ": reading the depth layer" });
  // a layer smaller than the region comes back smaller: pad it with black (far)
  if (res.w !== r.src.w || res.h !== r.src.h) {
    const out = new Uint8Array(r.src.w * r.src.h * 4);
    for (let y = 0; y < Math.min(res.h, r.src.h); y++) for (let x = 0; x < Math.min(res.w, r.src.w); x++) {
      const s = (y * res.w + x) * res.c, d = (y * r.src.w + x) * 4;
      out[d] = res.data[s]; out[d + 1] = res.data[s + (res.c >= 3 ? 1 : 0)]; out[d + 2] = res.data[s + (res.c >= 3 ? 2 : 0)]; out[d + 3] = 255;
    }
    res = { w: r.src.w, h: r.src.h, c: 4, data: out };
  }
  r.src.depthMap = res;
}

function layerById(doc, id) {
  const walk = (list) => { for (const L of Array.from(list || [])) { if (L.id === id) return L; const k = walk(L.layers); if (k) return k; } return null; };
  return walk(doc.layers);
}

function clearCache() { cache = null; }

module.exports = { addSubject, addDepthLayer, layerById, clearCache, fitToSource };
