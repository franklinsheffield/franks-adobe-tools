"use strict";
// shared/depth.js - depth for any Brew tool (Depthtone 2.0, CRT Phaser Lidar, ...).
// Sources:
//   smart      - Photoshop's Select Subject (run in a history step that is rolled back) +
//                a floor plane + one foot depth per figure + photo detail
//   layer      - a depth map layer the user picked (e.g. Neural Filters > Depth Blur >
//                Output depth map only); tied to its document, read only where it covers
//   brightness - bright areas come forward (fallback)
// Pure part (Node-safe): build(src, P) -> { D (0 = far, 1 = near), L, A, used }, smartDepth, range.
// Photoshop part: addSubject / addDepthLayer put src.subject / src.depthMap on a readSource
// result; getDepth(doc, r, opts) does it all and returns 0 = near, 1 = far (3.0 API).
// UI: depthSourceCard(ui, kit) - the source picker card (state at state.depth).
const M = require("./imgmath.js");
const { runModal } = require("./modal.js");
const { clamp, boxBlur } = M;

// grey 0..1 from a {w,h,c,data} image (or Float32Array already 0..1)
function grey(img, n) {
  if (img instanceof Float32Array) return Float32Array.from(img);
  const c = img.c || 4, d = img.data, o = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += c) o[i] = c >= 3 ? (0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]) / 255 : d[j] / 255;
  return o;
}
function sameSize(img, w, h) { return img && (img instanceof Float32Array ? img.length === w * h : img.w === w && img.h === h); }

// floor depth at the lowest pixel of each connected subject region (-1 outside / tiny bits)
function componentFoot(S, w, h, floor) {
  const n = w * h, lab = new Int32Array(n).fill(-1), out = new Float32Array(n).fill(-1);
  const stack = new Int32Array(n), minSize = Math.max(16, n * 0.002);
  let id = 0;
  for (let s0 = 0; s0 < n; s0++) {
    if (lab[s0] !== -1 || S[s0] <= 0.5) continue;
    let sp = 0, low = 0, size = 0; stack[sp++] = s0; lab[s0] = id;
    const members = [];
    while (sp) {
      const i = stack[--sp], x = i % w, y = (i / w) | 0; members.push(i); size++; if (y > low) low = y;
      if (x > 0 && lab[i - 1] === -1 && S[i - 1] > 0.5) { lab[i - 1] = id; stack[sp++] = i - 1; }
      if (x < w - 1 && lab[i + 1] === -1 && S[i + 1] > 0.5) { lab[i + 1] = id; stack[sp++] = i + 1; }
      if (y > 0 && lab[i - w] === -1 && S[i - w] > 0.5) { lab[i - w] = id; stack[sp++] = i - w; }
      if (y < h - 1 && lab[i + w] === -1 && S[i + w] > 0.5) { lab[i + w] = id; stack[sp++] = i + w; }
    }
    if (size >= minSize) { const fd = floor(Math.min(h - 1, low + 2)); for (const i of members) out[i] = fd; }
    id++;
  }
  // soften the edge between "in a figure" and "not" by spreading into the soft mask
  return out;
}

// Smart depth: floor plane gets nearer towards the bottom; the subject stands on it
// (each column of the subject takes the depth where its lowest pixel meets the floor),
// is lifted forward and rounded (centre nearer than edges), plus fine photo relief.
function smartDepth(L, S, w, h, o) {
  const n = w * h, D = new Float32Array(n);
  const hz = clamp((o.horizon == null ? 45 : o.horizon) / 100, 0, 0.95);
  const floor = (y) => { const t = (y / Math.max(1, h - 1) - hz) / (1 - hz); return t <= 0 ? 0 : Math.pow(t, 1.3); };
  const lift = 0.06 + 0.0024 * (o.pop == null ? 50 : o.pop);
  // soft mask, and a wider blur of it for the rounded "inflated" body
  const Ms = Float32Array.from(S); boxBlur(Ms, w, h, Math.max(1, w / 300), 2);
  const Mr = Float32Array.from(S); boxBlur(Mr, w, h, Math.max(2, w / 40), 3);
  // each vertical run of subject pixels stands where its lowest pixel meets the floor
  // (a leg reaching to the camera comes forward, a body standing further back stays back)
  const footW = new Float32Array(n), wt = new Float32Array(n);
  for (let x = 0; x < w; x++) {
    let y = h - 1;
    while (y >= 0) {
      if (S[y * w + x] <= 0.5) { y--; continue; }
      const fd = floor(Math.min(h - 1, y + 2));
      while (y >= 0 && S[y * w + x] > 0.5) { footW[y * w + x] = fd; wt[y * w + x] = 1; y--; }
    }
  }
  // smooth the foot depth widely inside the subject only (a narrow leg must not
  // leave a stripe up the body) ...
  const rr = Math.max(3, w / 12);
  boxBlur(footW, w, h, rr, 2); boxBlur(wt, w, h, rr, 2);
  // ... and blend it with one foot depth per connected figure, so a body reads as one piece
  const comp = componentFoot(S, w, h, floor);
  const F = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const col = wt[i] > 1e-3 ? footW[i] / wt[i] : 0;
    F[i] = comp[i] >= 0 ? 0.55 * comp[i] + 0.45 * col : col;
  }
  // fine relief from the photo (high-pass of brightness)
  const Lb = Float32Array.from(L); boxBlur(Lb, w, h, Math.max(2, w / 120), 2);
  const det = 0.08 * (o.detail == null ? 1 : o.detail);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const bg = floor(y) * 0.75;
    const body = clamp(F[i] * 0.75 + lift + 0.15 * (Mr[i] - 0.5), 0, 1);
    D[i] = bg + (body - bg) * Ms[i] + det * (L[i] - Lb[i]);
  }
  return D;
}

// stretch the 1st..99th percentile (or the manual Far..Near range) to 0..1
function range(D, auto, far, near) {
  const n = D.length;
  let lo, hi;
  if (auto) {
    const H = new Uint32Array(1024); let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) { if (D[i] < mn) mn = D[i]; if (D[i] > mx) mx = D[i]; }
    const span = mx - mn || 1;
    for (let i = 0; i < n; i++) H[Math.min(1023, ((D[i] - mn) / span * 1023) | 0)]++;
    const pick = (q) => { let a = 0; for (let k = 0; k < 1024; k++) { a += H[k]; if (a >= q * n) return mn + span * k / 1023; } return mx; };
    lo = pick(0.01); hi = pick(0.99);
  } else { lo = far / 100; hi = near / 100; }
  if (hi - lo < 1e-4) hi = lo + 1e-4;
  for (let i = 0; i < n; i++) D[i] = clamp((D[i] - lo) / (hi - lo), 0, 1);
  return D;
}

// build the cleaned depth field for this source; returns { D, L, A, used }
function build(src, P) {
  const w = src.w, h = src.h, n = w * h, sc = P.scale == null ? 1 : P.scale, d = P.depth || {};
  const { L, A } = M.luminance(src);
  let used = d.source || "smart", D;
  if (used === "layer" && sameSize(src.depthMap, w, h)) D = grey(src.depthMap, n);
  else if (used === "smart" && sameSize(src.subject, w, h)) D = smartDepth(L, grey(src.subject, n), w, h, d);
  else if (used === "smart" && sameSize(src.depth, w, h)) D = grey(src.depth, n);       // a ready depth field (tests, AE)
  else { if (used !== "brightness") used = "brightness (no " + (used === "layer" ? "depth layer" : "subject") + " yet)"; D = Float32Array.from(L); }
  if (d.smooth > 0) boxBlur(D, w, h, d.smooth * sc, 3);
  range(D, d.auto !== false, d.far == null ? 0 : d.far, d.near == null ? 100 : d.near);
  if (d.invert) for (let i = 0; i < n; i++) D[i] = 1 - D[i];
  return { D, L, A, used };
}


// ---------------- Photoshop side ----------------
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
  const { core, action, app } = host();
  try { if (app && app.documents && !Array.from(app.documents).some((d) => d.id === doc.id)) throw new Error("gone"); }
  catch (e) { if (e && e.message === "gone") throw new Error("That document is closed."); }
  const { W, H } = docSize(doc);
  const sc = full ? 1 : Math.min(1, CACHE_MAX / Math.max(W, H));
  const target = sc < 1 ? { width: Math.max(1, Math.round(W * sc)), height: Math.max(1, Math.round(H * sc)) } : null;
  let out = null;
  await runModal(appName + ": finding the subject", async (ctl) => {
    const hid = await ctl.hostControl.suspendHistory({ documentID: doc.id, name: appName + ": find subject" });
    try {
      await action.batchPlay([{ _obj: "autoCutout", sampleAllLayers: true }], { modalBehavior: "execute" });
      out = await readSelection(doc, W, H, target);
    } finally {
      try { await ctl.hostControl.resumeHistory(hid, false); } catch (e) { /* ignore */ }
    }
  }, { docId: doc.id, timeoutMs: 120000 });   // Select Subject can be slow on big documents
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

// Reads the picked depth layer for the panel's source region. Never opens a read Photoshop
// can't finish (that leaves a stuck Progress window blocking every plugin): the layer must
// be in this document, and only the part of the region the layer covers is read, through
// the shared timed read in ps-io. The rest stays black (far).
async function addDepthLayer(doc, r, layerId, appName, layerDoc) {
  if (layerDoc != null && layerDoc !== doc.id) throw new Error("The depth layer is in another document. Pick it again in this one.");
  const L = layerById(doc, layerId);
  if (!L) throw new Error("The depth layer is gone. Pick it again.");
  const PS = require("./ps-io.js");
  const sw = r.src.w, sh = r.src.h, sc = r.scale || 1, o = r.origin || { left: 0, top: 0 };
  const reg = { left: o.left, top: o.top, right: o.left + sw / sc, bottom: o.top + sh / sc };
  let lb = null;
  try { const b = L.bounds; if (b && b.right != null) lb = { left: Number(b.left), top: Number(b.top), right: Number(b.right), bottom: Number(b.bottom) }; } catch (e) { lb = null; }
  if (!lb) lb = reg;
  const ib = { left: Math.max(reg.left, lb.left), top: Math.max(reg.top, lb.top), right: Math.min(reg.right, lb.right), bottom: Math.min(reg.bottom, lb.bottom) };
  const out = new Uint8Array(sw * sh * 4);
  for (let i = 3; i < out.length; i += 4) out[i] = 255;
  // output pixels this covers
  const x0 = Math.round((ib.left - reg.left) * sc), y0 = Math.round((ib.top - reg.top) * sc);
  const x1 = Math.min(sw, Math.round((ib.right - reg.left) * sc)), y1 = Math.min(sh, Math.round((ib.bottom - reg.top) * sc));
  if (x1 - x0 >= 1 && y1 - y0 >= 1) {
    const bounds = { left: Math.floor(ib.left), top: Math.floor(ib.top), right: Math.ceil(ib.right), bottom: Math.ceil(ib.bottom) };
    const tw = x1 - x0, th = y1 - y0;
    // PS 28: getPixels refuses a group's layerID ("Unsupported layer type"): read the composite there instead
    const isGroup = String(L.kind || "").toLowerCase() === "group" || (L.layers && L.layers.length != null);
    const g = await PS.getPixels(doc, isGroup ? null : layerId, bounds, (bounds.right - bounds.left !== tw || bounds.bottom - bounds.top !== th) ? { width: tw, height: th } : null);
    const c = g.c || 4;
    for (let y = 0; y < Math.min(th, g.h); y++) for (let x = 0; x < Math.min(tw, g.w); x++) {
      const s = (y * g.w + x) * c, d = ((y0 + y) * sw + x0 + x) * 4;
      out[d] = g.data[s]; out[d + 1] = g.data[s + (c >= 3 ? 1 : 0)]; out[d + 2] = g.data[s + (c >= 3 ? 2 : 0)];
    }
  }
  r.src.depthMap = { w: sw, h: sh, c: 4, data: out };
}

function layerById(doc, id) {
  const walk = (list) => { for (const L of Array.from(list || [])) { if (L.id === id) return L; const k = walk(L.layers); if (k) return k; } return null; };
  return walk(doc.layers);
}

function clearCache() { cache = null; }


// ---------------- one call for other tools (3.0 API) ----------------
// r = a ps-io readSource result ({ src, scale, origin }); opts = { source, layerId, layerDoc,
// pop, horizon, detail, smooth, auto, phase: "preview"|"apply", appName }.
// Returns a Float32Array at src size, 0 = near, 1 = far.
async function getDepth(doc, r, opts) {
  const o = Object.assign({ source: "smart", phase: "preview", appName: "Frank's Brew" }, opts || {});
  if (o.source === "smart") { try { await addSubject(doc, r, o.phase, o.appName, false); } catch (e) { console.warn("Select Subject failed: " + (e && e.message)); } }
  else if (o.source === "layer" && o.layerId != null) { try { await addDepthLayer(doc, r, o.layerId, o.appName, o.layerDoc); } catch (e) { console.warn("Depth layer read failed: " + (e && e.message)); } }
  const res = build(r.src, { scale: r.scale || 1, depth: { source: o.source, pop: o.pop, horizon: o.horizon, detail: o.detail, smooth: o.smooth == null ? 2 : o.smooth, auto: o.auto !== false } });
  const D = res.D;
  for (let i = 0; i < D.length; i++) D[i] = 1 - D[i];
  return D;
}

// The Depth source card. State lives at state.depth = { source, pop, horizon, layerId, layerName, layerDoc }.
// kit = the toolpanel kit ({ state, touch, setStatus, io }). Pass { refind: fn } to hear "Find subject again".
function depthSourceCard(ui, kit, opts) {
  const { el, segGroup, sliderRow, checkRow, card, showIf } = ui;
  const s = () => kit.state, o = opts || {};
  const when = (node, fn) => { showIf(node, fn); return node; };
  const layerLine = el("div", { class: "hint", text: "" });
  const useLayer = el("button", { class: "btn small", text: "Use active layer as depth map" });
  useLayer.addEventListener("click", () => {
    const doc = kit.io.activeDoc(), L = doc ? kit.io.activeLayer(doc) : null;
    if (!L) { kit.setStatus("Select the depth map layer in the Layers panel first.", true); return; }
    s().depth.layerId = L.id; s().depth.layerName = L.name; s().depth.layerDoc = doc.id; kit.touch();
  });
  const refind = el("button", { class: "btn small", text: "Find subject again" });
  refind.addEventListener("click", () => { clearCache(); forceNext = true; if (o.refind) o.refind(); kit.touch(); });
  ui.bind(() => { const d = s().depth; layerLine.textContent = d.layerId != null ? "Depth layer: " + (d.layerName || "#" + d.layerId) + " (hide it before Apply)" : "No depth layer chosen yet."; });
  return card("Depth source", [
    segGroup("depth.source", [
      { v: "smart", l: "Smart", t: "Photoshop's Select Subject lifts the subject off a floor plane. Automatic." },
      { v: "layer", l: "Depth layer", t: "A depth map layer, e.g. Filter > Neural Filters > Depth Blur > Output depth map only. Best quality." },
      { v: "brightness", l: "Brightness", t: "Bright areas come forward." }
    ], "big"),
    when(el("div", { class: "row wrap" }, [refind]), () => s().depth.source === "smart"),
    when(sliderRow("Subject pop", "depth.pop", 0, 100, 1, "%"), () => s().depth.source === "smart"),
    when(sliderRow("Horizon", "depth.horizon", 0, 90, 1, "%"), () => s().depth.source === "smart"),
    when(el("div", { class: "row wrap" }, [useLayer]), () => s().depth.source === "layer"),
    when(layerLine, () => s().depth.source === "layer"),
    o.viewToggle === false ? null : checkRow("Show the depth map in the preview", "view.depth")
  ].filter(Boolean));
}

// prepareSource for toolpanel tools whose state has state.depth
let forceNext = false;
function prepareSourceFor(getState, appName) {
  return async (doc, r, phase) => {
    const d = (getState() || {}).depth || {};
    if (d.source === "smart") {
      try { await addSubject(doc, r, phase, appName, forceNext); forceNext = false; }
      catch (e) { console.warn("Select Subject failed: " + (e && e.message)); }
    } else if (d.source === "layer" && d.layerId != null) {
      try { await addDepthLayer(doc, r, d.layerId, appName, d.layerDoc); }
      catch (e) { console.warn("Depth layer read failed: " + (e && e.message)); }
    }
  };
}

module.exports = { build, smartDepth, range, addSubject, addDepthLayer, layerById, clearCache, fitToSource, getDepth, depthSourceCard, prepareSourceFor };
