"use strict";
// Frank's Worlds Brew (WB-10): a 3D scene builder that raytraces into Photoshop.
// Two panels in one plugin, sharing one scene:
//   Viewport (#vp): Create strip, wireframe / render view with move / rotate / scale handles,
//                   view buttons, orbit (drag), pan (Shift-drag), zoom (wheel), click to select
//   Console  (#app): pinned mini render, A Scene (built-in + saved scenes, export / import),
//                   B Controls (Object, Material, Mesh, Sky, Camera tabs), C Render (Draft / Final,
//                   render meter, Render to layer, Cancel)
// The engine (js/) is host-free; this file is the only one that talks to Photoshop.
const S = require("./js/scene.js");
const E = require("./js/engine.js");
const WF = require("./js/wire.js");
const ED = require("./js/editor.js");
const PK = require("./js/packs.js");
const CT = require("./js/controls.js");
const PS = require("./core/ps-io.js");
const PNG = require("./core/png.js");
const { createUI, el, clear } = require("./core/ui.js");
const { splitLayout, pressGlow } = require("./core/layout.js");
const { createPreviewLoop, tick } = require("./core/preview.js");

const APP = "Frank's Worlds Brew", CODE = "WB-10", GLOW = "#5effc8", VERSION = "0.5.1";
PS.configure({ appName: APP, presetFile: "scenes.json", exportName: "worlds-scene.json" });
let uxp = null; try { uxp = require("uxp"); } catch (e) { uxp = null; }
const psHost = require("photoshop");   // loaded once at start-up (the test harness only serves it then)

// ---- shared state: the scene, the selection (a placeholder when nothing is selected) and panel options
const NONE = S.obj("sphere", 0, 0, 0, 1, "Matte");
const st = { scene: S.loadPreset("Chrome Garden"), sel: NONE, view: { mode: "wire", gizmo: "move", scenePack: "Classic", assetPack: "Fantasy", brush: "raise", bsize: 0.12, bpow: 0.5, step: "med", stick: true, camLock: false, addPack: "Shapes" }, out: { quality: "final" }, saveName: "" };
const hasSel = () => st.sel !== NONE && st.scene.objs.includes(st.sel);
const is = (...types) => () => hasSel() && types.includes(st.sel.type);
const refs = {};
let working = false, cancelReq = false, gen = 0, usPerSample = 0;

function aspect() {
  const d = PS.activeDoc();
  if (d) { const i = PS.docInfo(d); if (i.w > 0 && i.h > 0) return Math.max(0.3, Math.min(3.5, i.w / i.h)); }
  return 16 / 9;
}
function setStatus(msg, err) {
  [refs.status, refs.vpStatus].forEach((n) => { if (n) { n.textContent = msg; n.className = "status" + (err ? " err" : ""); } });
  [refs.led, refs.vpLed].forEach((h) => { if (h) h.set(err ? "err" : (working ? "busy" : "ready")); });
}

// ---- change hub: every edit lands here
function changed(what) {
  if (what === "sel" || what === "scene") { cui.refreshAll(); vui.refreshAll(); }
  else { cui.refreshAll(); vui.refreshAll(); }
  refreshObjList();
  drawViewport();
  loop.schedule(what === "live" ? 400 : 150);
}
function select(o) { brushAt = null; st.sel = o || NONE; if (o && refs.tabs && o.type === "mesh" && refs.tabs.__tabs.current === "Object") { /* stay */ } changed("sel"); }

// ---- the two UIs (one per panel, each with its own dial selection)
const pickColor = (hex) => PS.pickColor(hex);
const cui = createUI({ getState: () => st, onChange: () => changed("val"), onLive: () => { drawViewport(); }, pickColor, brand: "console", glow: GLOW, storeKey: APP });
const vui = createUI({ getState: () => st, onChange: () => changed("val"), pickColor, brand: "console", glow: GLOW, storeKey: APP + " viewport" });

// ---- console mini render (the pinned preview)
const loop = createPreviewLoop({ renderOnce: () => miniRender(), onError: (e) => { setStatus("Preview problem: " + (e && e.message || e), true); console.error(e); } });
async function miniRender() {
  if (!refs.preview || working) return;
  const my = ++gen, A = aspect(), w = 300, h = Math.max(60, Math.round(w / A));
  const hooks = { yield: () => tick(), cancelled: () => my !== gen || working };
  setStatus("Rendering preview...");
  const d = await E.render(st.scene, st.scene.cam, w, h, { step: 3 }, hooks);
  if (!d) return;
  showImg(refs.preview, d, refs.previewBox);
  const f = await E.render(st.scene, st.scene.cam, w, h, {}, hooks);
  if (!f) return;
  showImg(refs.preview, f, refs.previewBox);
  usPerSample = f.ms * 1000 / (w * h);
  setStatus("Preview " + Math.round(f.ms) + " ms  -  " + st.scene.objs.length + " objects  -  " + estimate());
  if (st.view.mode === "render") drawViewport();
}
function showImg(img, r, box) {
  img.src = PNG.dataURL(r.rgba, r.w, r.h, 4);
  const avail = Math.max(120, ((box && box.clientWidth) || 320) - 12), f = fitBox(Math.min(avail, r.w * 2), panelMaxH(refs.cLay, 0.32, 360), r.w / r.h);
  img.style.width = f.w + "px"; img.style.height = f.h + "px";
}
function renderSize() {
  const d = PS.activeDoc();
  if (d) { const i = PS.docInfo(d); if (i.w > 0) return { w: i.w, h: i.h, doc: true }; }
  return { w: 1920, h: 1080, doc: false };
}
function estimate() {
  if (!usPerSample) return "";
  const z = renderSize(), aa = st.out.quality === "final" ? 4 : 1, sec = z.w * z.h * aa * usPerSample / 1e6;
  return "full render about " + (sec < 90 ? Math.max(1, Math.round(sec)) + " s" : Math.round(sec / 60) + " min");
}

// ---- viewport drawing: wireframe (instant) or a progressive render
let lastWire = null, dragging = null, vpGen = 0;
// the view keeps the document's shape but never grows taller than about half the panel,
// so a portrait document cannot push the controls out of reach (0.5.1 fix)
function fitBox(availW, maxH, A) {
  let w = Math.round(availW), h = Math.round(w / A);
  if (h > maxH) { h = Math.round(maxH); w = Math.round(h * A); }
  return { w: Math.max(80, w), h: Math.max(60, h) };
}
function panelMaxH(lay, frac, fallback) {
  let ph = 0; try { ph = lay && lay.root ? lay.root.clientHeight : 0; } catch (e) { ph = 0; }
  return Math.max(140, Math.min(fallback, (ph || 900) * frac));
}
function vpSize() {
  const box = refs.vpBox, avail = Math.max(240, Math.min(1400, ((box && box.clientWidth) || 640) - 12));
  return fitBox(avail, panelMaxH(refs.vpLay, 0.48, 620), aspect());
}
function drawViewport() {
  if (!refs.vpImg) return;
  const { w, h } = vpSize();
  if (st.view.mode === "wire" || dragging || carry) {
    vpGen++;
    lastWire = WF.wireframe(st.scene, st.scene.cam, w, h, { sel: hasSel() ? st.sel : null, gizmo: st.view.gizmo, brush: brushRing() });
    refs.vpImg.src = PNG.dataURL(lastWire.rgba, w, h, 4);
    refs.vpImg.style.width = w + "px"; refs.vpImg.style.height = h + "px";
    return;
  }
  lastWire = WF.wireframe(st.scene, st.scene.cam, w, h, { sel: hasSel() ? st.sel : null, gizmo: st.view.gizmo });   // kept for clicks
  const my = ++vpGen, rw = Math.min(w, 640), rh = Math.round(rw * h / w);
  const hooks = { yield: () => tick(), cancelled: () => my !== vpGen || working };
  (async () => {
    for (const step of [4, 1]) {
      const r = await E.render(st.scene, st.scene.cam, rw, rh, { step }, hooks);
      if (!r || my !== vpGen) return;
      refs.vpImg.src = PNG.dataURL(r.rgba, rw, rh, 4);
      refs.vpImg.style.width = w + "px"; refs.vpImg.style.height = h + "px";
    }
  })().catch((e) => setStatus("Viewport render problem: " + e.message, true));
}

// sculpt brush: where the pointer meets the selected terrain (null when off it)
let brushAt = null;
const sculpting = () => st.view.gizmo === "sculpt" && is("terrain")();
function brushRing() { return sculpting() && brushAt ? { o: st.sel, u: brushAt.u, v: brushAt.v, r: st.view.bsize } : null; }
function terrainUnder(mx, my) { if (!lastWire) return null; return ED.terrainHit(st.sel, ED.screenRay(st.scene.cam, lastWire.w, lastWire.h, mx, my)); }

// pointer position in wireframe pixels
function vpXY(e) {
  const img = refs.vpImg; let r = null; try { r = img.getBoundingClientRect(); } catch (err) { r = null; }
  const W = lastWire ? lastWire.w : 1, H = lastWire ? lastWire.h : 1, rw = (r && r.width) || W, rh = (r && r.height) || H;
  const x = r ? e.clientX - r.left : (e.offsetX || 0), y = r ? e.clientY - r.top : (e.offsetY || 0);
  return [x * W / rw, y * H / rh];
}
function vpHint(t) { if (refs.vpHint) refs.vpHint.textContent = t; }
const HINT = "Click an object to select it, drag it to move it (Shift-drag = up / down). Drag empty space to orbit, Shift-drag to pan, wheel to zoom. Drag a tile from Add into the view to place it.";
const r2 = (v) => +(+v).toFixed(2);
function moveHint(o) { vpHint("MOVE  " + ED.label(o) + "   x " + r2(o.x) + "   z " + r2(o.z) + "   height " + r2(o.y)); }
function quick() { cui.refreshAll(); vui.refreshAll(); drawViewport(); }
// is the pointer over the viewport picture?
function inVp(e) {
  const img = refs.vpImg; if (!img || !lastWire) return false;
  let r = null; try { r = img.getBoundingClientRect(); } catch (err) { r = null; }
  if (!r || !r.width) return e.target === img;
  return e.clientX >= r.left && e.clientX <= r.left + r.width && e.clientY >= r.top && e.clientY <= r.top + r.height;
}
function rayAt(e) { const [mx, my] = vpXY(e); return ED.screenRay(st.scene.cam, lastWire.w, lastWire.h, mx, my); }

// ---- drag and drop from the Add tiles: the new object follows the pointer over the view and lands where you let go
let carry = null, pressTile = null;
function makeFrom(src) {
  if (src.asset) return addAsset(src.asset);
  return ED.addObject(st.scene, src.type);
}
function carryTo(e) {
  if (!carry || !lastWire) return;
  const o = carry.o, hit = CT.groundHit(st.scene, rayAt(e), o);
  if (!hit) return;
  if (o.type === "terrain") CT.placeAt(st.scene, o, hit.x, hit.z, false);
  else CT.placeAt(st.scene, o, hit.x, hit.z, true);
  moveHint(o); drawViewport();
}
function dropCarry() { if (!carry) return; const o = carry.o; carry = null; vpHint(HINT); changed("scene"); setStatus("Placed " + ED.label(o).toLowerCase() + ". Drag it to move it."); }
function cancelCarry() { if (!carry) return; ED.remove(st.scene, carry.o); carry = null; vpHint(HINT); select(null); setStatus("Drop cancelled."); }
// a tile that can be clicked (adds in front of the camera) or dragged into the view
function dragTile(b, src) {
  try { b.__img.setAttribute("draggable", "false"); } catch (e) { /* ok */ }
  b.addEventListener("mousedown", (e) => { pressTile = { src, b, x: e.clientX, y: e.clientY }; if (e.preventDefault) e.preventDefault(); });
  b.addEventListener("click", () => {
    if (b.__skipClick && Date.now() - b.__skipClick < 500) { b.__skipClick = 0; return; }
    const o = makeFrom(src); select(o);
    setStatus("Added " + (src.asset ? src.asset.name + "  -  " + src.asset.credit : ED.label(o).toLowerCase()) + ". Drag it in the view to move it.");
  });
}
function docMove(e) {
  if (e.__wb) return; e.__wb = true;
  if (pressTile && !carry && inVp(e)) { const o = makeFrom(pressTile.src); st.sel = o; carry = { o }; }
  if (carry && inVp(e)) carryTo(e);
}
function docUp(e) {
  if (e.__wbUp) return; e.__wbUp = true;
  holdStops.forEach((f) => f());
  if (!pressTile) return;
  const p = pressTile; pressTile = null;
  if (carry) { p.b.__skipClick = Date.now(); if (inVp(e)) { carryTo(e); dropCarry(); } else cancelCarry(); }
}

function wireViewportPointer(img) {
  img.addEventListener("mousedown", (e) => {
    const [mx, my] = vpXY(e);
    if (sculpting() && !e.shiftKey) { const hit = terrainUnder(mx, my);
      if (hit) { const o = st.sel; o._undo = o.sculpt ? o.sculpt.slice() : null;
        dragging = { x: e.clientX, y: e.clientY, moved: true, sculpt: true, ref: ED.heightAt(o, hit.u, hit.v) };
        brushAt = hit; ED.sculpt(o, st.view.brush, hit.u, hit.v, st.view.bsize, st.view.bpow, dragging.ref); drawViewport(); if (e.preventDefault) e.preventDefault(); return; } }
    const h = hasSel() && lastWire ? WF.pickHandle(lastWire.gizmo, mx, my) : null;
    if (!h && lastWire) {
      // press on an object (not a terrain, they are too big to grab): select it and get ready to move it
      const o = WF.pick(st.scene, st.scene.cam, lastWire.w, lastWire.h, mx, my);
      if (o && o.type !== "terrain") {
        const p = CT.planeHit(ED.screenRay(st.scene.cam, lastWire.w, lastWire.h, mx, my), o.y);
        dragging = { x: e.clientX, y: e.clientY, moved: false, obj: o, off: p ? [o.x - p.x, o.z - p.z] : [0, 0], start: Object.assign({}, o) };
        if (st.sel !== o) { brushAt = null; st.sel = o; quick(); }
        if (e.preventDefault) e.preventDefault(); return;
      }
    }
    dragging = { x: e.clientX, y: e.clientY, mx, my, moved: false, shift: e.shiftKey, cam: Object.assign({}, st.scene.cam), h, start: hasSel() ? Object.assign({}, st.sel) : null };
    if (e.preventDefault) e.preventDefault();
  });
  const move = (e) => {
    if (e.__wbV) return; e.__wbV = true;
    if (dragging && dragging.sculpt) { const [mx, my] = vpXY(e), hit = terrainUnder(mx, my); if (hit) { brushAt = hit; ED.sculpt(st.sel, st.view.brush, hit.u, hit.v, st.view.bsize, st.view.bpow, dragging.ref); drawViewport(); } return; }
    if (!dragging) { if (sculpting() && e.currentTarget === img) { const [mx, my] = vpXY(e); brushAt = terrainUnder(mx, my); if (st.view.mode === "wire") drawViewport(); } return; }
    const rect = (() => { try { return img.getBoundingClientRect(); } catch (err) { return null; } })();
    const k = lastWire && rect && rect.width ? lastWire.w / rect.width : 1;
    const dx = (e.clientX - dragging.x) * k, dy = (e.clientY - dragging.y) * k;
    if (!dragging.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    dragging.moved = true;
    if (dragging.obj) {
      const o = dragging.obj, s0 = dragging.start;
      if (e.shiftKey) o.y = r2(s0.y - dy * st.scene.cam.dist / 260);
      else { const p = CT.planeHit(rayAt(e), s0.y); if (p) CT.placeAt(st.scene, o, p.x + dragging.off[0], p.z + dragging.off[1], st.view.stick); }
      moveHint(o); quick(); return;
    }
    if (dragging.h && hasSel()) {
      WF.dragHandle(st.sel, dragging.start, dragging.h, dx, dy);
      const o = st.sel, h = dragging.h;
      vpHint(h.mode.toUpperCase() + "  " + (h.mode === "rotate" ? "spin " + o.ry + " deg" : h.mode === "move" ? h.ax.toUpperCase() + " = " + o[h.ax] : "size " + o.s + (o.type === "mesh" ? "  (x " + o.sx + "  y " + o.sy + "  z " + o.sz + ")" : "")));
    } else if (st.view.camLock) return;
    else if (dragging.shift) ED.pan(st.scene.cam, dragging.cam, dx, dy, aspect());
    else ED.orbit(st.scene.cam, dragging.cam, dx, dy);
    quick();
  };
  const up = (e) => {
    if (e.__wbVU) return; e.__wbVU = true;
    if (!dragging) return;
    const d = dragging; dragging = null;
    if (d.sculpt) { vpHint("Sculpted with " + st.view.brush + ". Undo stroke is in the Shape tab."); changed("sel"); return; }
    if (d.obj) { if (d.moved) { moveHint(d.obj); setStatus("Moved " + ED.label(d.obj).toLowerCase() + "."); } else vpHint(HINT); changed("sel"); return; }
    if (!d.moved && !d.h) { const [mx, my] = vpXY(e); select(WF.pick(st.scene, st.scene.cam, lastWire ? lastWire.w : 1, lastWire ? lastWire.h : 1, mx, my)); return; }
    st.scene.cam.yaw = ((st.scene.cam.yaw % 360) + 360) % 360;
    vpHint(HINT);
    changed(d.h ? "sel" : "view");
  };
  img.addEventListener("mousemove", move);
  img.addEventListener("mouseup", up);
  try { window.addEventListener("mousemove", move); window.addEventListener("mouseup", up); } catch (e) { /* no window events */ }
  img.addEventListener("wheel", (e) => { if (e.preventDefault) e.preventDefault(); ED.zoom(st.scene.cam, e.deltaY > 0 ? 1 : -1); changed("view"); });
}

// ---- Create strip icons (rendered by the engine once, small)
const ICON = 40;
// a pack model on the ground near the camera target, at its default size, with its own colours
function addAsset(a) {
  const o = ED.addMesh(st.scene, a.mesh, a.mat, { smooth: false, vc: true, asset: a.id });
  o.s = a.size; ED.dropToGround(st.scene, o); return o;
}
async function drawAssetIcons() {
  for (const b of refs.assetBtns || []) {
    const a = b.__asset, sc = { sky: "Dusk", sunAz: 200, sunAlt: 35, haze: 0, fog: 0, fogH: 1, clouds: 0, water: false, ground: false, waterLvl: 0, objs: [S.obj("mesh", 0, 0, 0, 1, a.mat, { mesh: a.mesh, smooth: false, ry: 25 })] };
    const r = await E.render(sc, { yaw: 25, pitch: 15, dist: 3.9, fov: 45, tx: 0, ty: 0, tz: 0 }, ICON, ICON, { aa: 1 }, { yield: () => tick() });
    b.__img.src = PNG.dataURL(r.rgba, ICON, ICON, 4);
    await tick();
  }
}
async function drawIcons() {
  for (const b of refs.createBtns || []) {
    if (b.__type === "import") continue;
    const [sc, cam] = ED.iconScene(b.__type);
    const r = await E.render(sc, cam, ICON, ICON, { aa: 1 }, { yield: () => tick() });
    b.__img.src = PNG.dataURL(r.rgba, ICON, ICON, 4);
    await tick();
  }
}
function plusIcon() {
  const a = new Uint8Array(ICON * ICON * 4);
  for (let y = 0; y < ICON; y++) for (let x = 0; x < ICON; x++) {
    const p = (y * ICON + x) * 4, c = ICON / 2, on = (Math.abs(x + 0.5 - c) < 2 && Math.abs(y + 0.5 - c) < 11) || (Math.abs(y + 0.5 - c) < 2 && Math.abs(x + 0.5 - c) < 11);
    const edge = x === 0 || y === 0 || x === ICON - 1 || y === ICON - 1;
    a[p] = on ? 94 : edge ? 90 : 0; a[p + 1] = on ? 255 : edge ? 90 : 0; a[p + 2] = on ? 200 : edge ? 90 : 0; a[p + 3] = 255;
  }
  return PNG.dataURL(a, ICON, ICON, 4);
}

// ---- files
const fsys = () => uxp && uxp.storage && uxp.storage.localFileSystem;
const binary = () => (uxp && uxp.storage && uxp.storage.formats ? { format: uxp.storage.formats.binary } : {});
async function importModel() {
  try {
    const f = await fsys().getFileForOpening({ types: ["obj", "stl", "glb", "gltf"] });
    if (!f) return;
    const raw = await f.read(binary()), buf = raw instanceof ArrayBuffer ? raw : (raw && raw.buffer) ? raw.buffer : new TextEncoder().encode(String(raw)).buffer;
    const m = ED.parseModel(f.name, buf), o = ED.addMesh(st.scene, m, "Glossy");
    select(o);
    if (refs.tabs) refs.tabs.__tabs.choose("Mesh");
    setStatus("Imported " + f.name + "  -  " + m.tris.toLocaleString() + " triangles. Use the handles to place it.");
  } catch (e) { setStatus("Import failed: " + e.message, true); }
}
// image texture: RGBA, longest side 256
function toTexture(src, name) {
  const n = src.w * src.h, d = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { d[i * 4] = src.data[i * src.c]; d[i * 4 + 1] = src.data[i * src.c + 1]; d[i * 4 + 2] = src.data[i * src.c + 2]; d[i * 4 + 3] = 255; }
  return { w: src.w, h: src.h, d, name };
}
async function textureFromLayer() {
  if (!hasSel()) return;
  const doc = PS.activeDoc(), layer = doc && PS.activeLayer(doc);
  if (!layer) { setStatus("Open a document and select the layer to use as the texture.", true); return; }
  try {
    const r = await PS.readSource(doc, { kind: "layer", layer }, { kind: "whole", size: 256 });
    st.sel.img = toTexture(r.src, layer.name || "layer");
    changed("sel"); setStatus("Texture taken from layer " + (layer.name || ""));
  } catch (e) { setStatus("Could not read that layer: " + e.message, true); }
}
async function textureFromFile() {
  if (!hasSel()) return;
  try {
    const f = await fsys().getFileForOpening({ types: ["png", "jpg", "jpeg", "tif", "tiff", "psd", "webp"] });
    if (!f) return;
    const ps = psHost;
    let tmp = null, tex = null;
    try {
      await ps.core.executeAsModal(async () => { tmp = await ps.app.open(f); }, { commandName: APP + ": open texture" });
      const r = await PS.readSource(tmp, { kind: "flat" }, { kind: "whole", size: 256 });
      tex = toTexture(r.src, f.name);
    } finally {
      // close the texture document we opened, never save it (Mac hygiene rule)
      if (tmp) await ps.core.executeAsModal(async () => { await tmp.close(ps.constants.SaveOptions.DONOTSAVECHANGES); }, { commandName: APP + ": close texture" });
    }
    st.sel.img = tex; changed("sel"); setStatus("Texture loaded: " + f.name);
  } catch (e) { setStatus("Could not load that image: " + e.message, true); }
}

// ---- scenes: built-ins, saved scenes (plugin data folder), export / import one .json for the team
let saved = [];
async function loadSaved() { const d = await PS.loadData("scenes.json"); saved = d && Array.isArray(d.list) ? d.list : []; refreshSaved(); }
async function storeSaved() { await PS.saveData("scenes.json", { list: saved }); refreshSaved(); }
function loadScene(scene) { st.scene = scene; st.sel = NONE; homeCam = CT.camCopy(scene.cam); changed("scene"); }
function refreshSaved() {
  const sel = refs.savedSel; if (!sel) return;
  clear(sel);
  if (!saved.length) sel.appendChild(el("option", { value: "", text: "(no saved scenes yet)" }));
  saved.forEach((s, i) => sel.appendChild(el("option", { value: String(i), text: s.name })));
}
async function saveCurrent() {
  const name = String(refs.saveName.value || "").trim() || st.scene.name || "My scene";
  st.scene.name = name;
  const rec = { name, json: S.toJSON(st.scene) }, i = saved.findIndex((s) => s.name === name);
  if (i >= 0) saved[i] = rec; else saved.push(rec);
  await storeSaved(); setStatus("Saved scene " + name);
}
async function exportScene() {
  try {
    const f = await fsys().getFileForSaving((st.scene.name || "scene").replace(/[^\w -]+/g, "") + ".worlds.json", { types: ["json"] });
    if (!f) return;
    await f.write(S.toJSON(st.scene)); setStatus("Exported " + f.name);
  } catch (e) { setStatus("Export failed: " + e.message, true); }
}
async function importScene() {
  try {
    const f = await fsys().getFileForOpening({ types: ["json"] });
    if (!f) return;
    const s = S.fromJSON(await f.read());
    if (!s || !Array.isArray(s.objs) || !s.cam) throw new Error("not a Worlds Brew scene");
    s.name = s.name || String(f.name).replace(/\.worlds\.json$|\.json$/i, "");
    loadScene(s); setStatus("Imported scene " + s.name);
  } catch (e) { setStatus("Import failed: " + e.message, true); }
}

// ---- final render into the document: one History step, group "Frank's Worlds Brew - <scene>"
async function renderNow() {
  if (working) { cancelReq = true; setStatus("Cancelling..."); return; }
  working = true; cancelReq = false; gen++; vpGen++; loop.setBusy(true);
  refs.go.textContent = "Cancel"; refs.meter.run(); setStatus("Rendering...");
  const t0 = Date.now();
  try {
    let doc = PS.activeDoc();
    const ps = psHost;
    if (!doc) {
      await ps.core.executeAsModal(async () => { doc = await ps.app.documents.add({ width: 1920, height: 1080, resolution: 72, mode: "RGBColorMode", fill: "black", name: st.scene.name || "Worlds" }); }, { commandName: APP + ": new document" });
    }
    const info = PS.docInfo(doc), aa = st.out.quality === "final" ? 2 : 1;
    const res = await E.render(st.scene, st.scene.cam, info.w, info.h, { aa }, {
      yield: async (p) => { if (refs.meterPct) refs.meterPct(p); setStatus("Rendering " + Math.round(p * 100) + "%  -  " + Math.round((Date.now() - t0) / 1000) + " s"); await tick(); },
      cancelled: () => cancelReq
    });
    if (!res) { refs.meter.idle(); setStatus("Render cancelled. Nothing was changed."); return; }
    setStatus("Writing layers...");
    const warn = await PS.writeResult(doc, { w: res.w, h: res.h, layers: E.layers(res, {}) }, { origin: { left: 0, top: 0 }, groupName: APP + " - " + (st.scene.name || "Scene"), hideSource: false });
    const sec = (Date.now() - t0) / 1000;
    refs.meter.done(sec);
    setStatus("Rendered " + info.w + " x " + info.h + " in " + sec.toFixed(1) + " s" + (warn && warn.length ? "  (" + warn.join("; ") + ")" : ""));
  } catch (e) { refs.meter.idle(); setStatus("Render failed: " + (e && e.message || e), true); console.error(e); }
  finally { working = false; loop.setBusy(false); refs.go.textContent = "Render to layer"; setStatus(refs.status ? refs.status.textContent : "", refs.status && /err/.test(refs.status.className)); drawViewport(); }
}

// ---- 0.5 control deck helpers
const holdStops = [];
// small white arrow pictures for the pads (UXP fonts lack reliable arrow glyphs)
const arrowCache = {};
function arrowSrc(dir) {
  if (arrowCache[dir]) return arrowCache[dir];
  const N = 14, px = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let u = (x + 0.5) / N * 2 - 1, v = (y + 0.5) / N * 2 - 1;   // -1..1, up arrow = point at top
    if (dir === "down") v = -v; else if (dir === "left") { const t = u; u = v; v = t; } else if (dir === "right") { const t = u; u = v; v = -t; }
    const inside = v > -0.75 && v < 0.6 && Math.abs(u) < (v + 0.75) * 0.62;
    const i = (y * N + x) * 4; px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = inside ? 255 : 0;
  }
  return (arrowCache[dir] = PNG.dataURL(px, N, N, 4));
}
const arrow = (dir) => el("img", { class: "wbarrow", src: arrowSrc(dir), draggable: "false" });
// a button that repeats while held (mouse down), and still works as a plain click
function holdBtn(kids, fn, title, cls) {
  const b = el("button", { class: "btn small wbpadbtn " + (cls || ""), title: title || "" }, kids);
  let t1 = null, t2 = null, held = false;
  const step = () => { try { fn(); } catch (e) { setStatus(e.message, true); } quick(); };
  const stop = () => { if (!held) return; held = false; clearTimeout(t1); clearInterval(t2); t1 = t2 = null; changed("val"); };
  holdStops.push(stop);
  b.addEventListener("mousedown", () => { held = true; b.__down = true; step(); t1 = setTimeout(() => { t2 = setInterval(step, 70); }, 380); });
  b.addEventListener("mouseup", stop);
  b.addEventListener("mouseleave", stop);
  b.addEventListener("click", () => { if (b.__down) { b.__down = false; return; } step(); changed("val"); });
  return b;
}
const gap = () => el("div", { class: "wbgap" });
const cap = (t) => el("div", { class: "wbcap", text: t });
// a + shaped pad: [up, left, right, down] buttons, optional centre
function cross(title, up, left, right, down, centre) {
  return el("div", { class: "wbcross" }, [
    el("div", { class: "wbprow" }, [gap(), up, gap()]),
    el("div", { class: "wbprow" }, [left, centre || gap(), right]),
    el("div", { class: "wbprow" }, [gap(), down, gap()]),
    cap(title)
  ]);
}
const pair = (title, a, b) => el("div", { class: "wbcross" }, [a, b, cap(title)]);
const withSel = (fn) => () => { if (hasSel()) fn(st.sel); else setStatus("Select an object first: click it in the view or in the Objects list."); };

function objectPad(ui) {
  const sk = () => st.view.step, stick = () => st.view.stick, sc = () => st.scene;
  const mv = (dir, t) => holdBtn([arrow({ fwd: "up", back: "down", left: "left", right: "right", up: "up", down: "down" }[dir])], withSel((o) => CT.nudge(sc(), o, dir, sk(), stick())), t);
  const name = el("div", { class: "wbselname" });
  ui.bind(() => { name.textContent = hasSel() ? ED.label(st.sel) : "NOTHING SELECTED"; });
  const pick = (d) => { const b = el("button", { class: "btn small", text: d > 0 ? "Next" : "Prev", title: d > 0 ? "Select the next object (Tab)" : "Select the previous object" }); b.addEventListener("click", () => select(CT.cycle(st.scene, hasSel() ? st.sel : null, d))); return b; };
  const act = (l, fn, t) => { const b = el("button", { class: "btn small", text: l, title: t || "" }); b.addEventListener("click", fn); return b; };
  return el("div", { class: "wbpad" }, [
    el("div", { class: "wbpadtitle", text: "OBJECT" }),
    el("div", { class: "row wbselrow" }, [pick(-1), name, pick(1), act("None", () => select(null), "Deselect (Esc)")]),
    el("div", { class: "wbprow wbpads" }, [
      cross("MOVE", mv("fwd", "Move away from the camera (Up arrow)"), mv("left", "Move left (Left arrow)"), mv("right", "Move right (Right arrow)"), mv("back", "Move towards the camera (Down arrow)")),
      pair("HEIGHT", mv("up", "Raise (Page Up)"), mv("down", "Lower (Page Down)")),
      pair("SPIN", holdBtn([el("span", { text: "+" })], withSel((o) => CT.spin(o, 1, sk())), "Turn (])"), holdBtn([el("span", { text: "-" })], withSel((o) => CT.spin(o, -1, sk())), "Turn back ([)")),
      pair("SIZE", holdBtn([el("span", { text: "+" })], withSel((o) => CT.grow(sc(), o, 1, sk(), stick())), "Bigger (=)"), holdBtn([el("span", { text: "-" })], withSel((o) => CT.grow(sc(), o, -1, sk(), stick())), "Smaller (-)"))
    ]),
    el("div", { class: "row wrap" }, [ui.segGroup("view.step", [{ v: "fine", l: "Fine", t: "Small steps" }, { v: "med", l: "Medium" }, { v: "big", l: "Big", t: "Big steps (Shift + arrow keys)" }])]),
    el("div", { class: "row wrap" }, [ui.checkRow("Stick to ground", "view.stick")]),
    el("div", { class: "row wrap" }, [
      act("Drop to ground", withSel((o) => { CT.rest(st.scene, o); changed("sel"); }), "Set it down on the terrain or ground under it"),
      act("Duplicate", withSel((o) => select(ED.duplicate(st.scene, o))), "Copy it beside itself"),
      act("Delete", withSel((o) => { ED.remove(st.scene, o); select(null); }), "Delete (Delete key)"),
      act("Look at it", withSel((o) => { CT.frame(st.scene, o); changed("view"); }), "Frame the camera on it (F)")
    ])
  ]);
}

let homeCam = null;
const camSlots = [null, null, null];
function cameraPad(ui) {
  const cam = () => st.scene.cam, sk = () => CT.STEP[st.view.step] || CT.STEP.med;
  const mvStep = () => sk().move * Math.max(1, cam().dist / 10);
  const hb = (dir, fn, t) => holdBtn([arrow(dir)], fn, t);
  const tb = (txt, fn, t) => holdBtn([el("span", { text: txt })], fn, t);
  const act = (l, fn, t) => { const b = el("button", { class: "btn small", text: l, title: t || "" }); b.addEventListener("click", () => { fn(); changed("view"); }); return b; };
  const views = CT.VIEWS.map(([v, l]) => act(l, () => CT.camView(cam(), v), l + " view"));
  const slots = camSlots.map((_, i) => {
    const go = act("View " + (i + 1), () => { if (camSlots[i]) CT.camSet(cam(), camSlots[i]); else { camSlots[i] = CT.camCopy(cam()); setStatus("Saved this angle as View " + (i + 1) + "."); } }, "Go to saved view " + (i + 1) + " (empty: saves the current angle)");
    const set = act("Save", () => { camSlots[i] = CT.camCopy(cam()); setStatus("Saved this angle as View " + (i + 1) + "."); }, "Save the current angle as View " + (i + 1));
    ui.bind(() => { if (camSlots[i]) go.classList.add("on"); else go.classList.remove("on"); });
    return el("div", { class: "wbslot" }, [go, set]);
  });
  return el("div", { class: "wbpad" }, [
    el("div", { class: "wbpadtitle", text: "CAMERA" }),
    el("div", { class: "wbprow wbpads" }, [
      cross("ORBIT", hb("up", () => CT.camOrbit(cam(), 0, sk().orbit), "Look from higher"), hb("left", () => CT.camOrbit(cam(), sk().orbit, 0), "Circle left"), hb("right", () => CT.camOrbit(cam(), -sk().orbit, 0), "Circle right"), hb("down", () => CT.camOrbit(cam(), 0, -sk().orbit), "Look from lower")),
      cross("SLIDE", hb("up", () => CT.camPan(cam(), 0, mvStep(), 0), "Slide forward"), hb("left", () => CT.camPan(cam(), -mvStep(), 0, 0), "Slide left"), hb("right", () => CT.camPan(cam(), mvStep(), 0, 0), "Slide right"), hb("down", () => CT.camPan(cam(), 0, -mvStep(), 0), "Slide back")),
      pair("RAISE", hb("up", () => CT.camPan(cam(), 0, 0, mvStep()), "Raise the camera and its aim"), hb("down", () => CT.camPan(cam(), 0, 0, -mvStep()), "Lower the camera and its aim")),
      pair("ZOOM", tb("+", () => CT.camZoom(cam(), sk().zoom), "Move in (wheel)"), tb("-", () => CT.camZoom(cam(), 1 / sk().zoom), "Move out (wheel)"))
    ]),
    el("div", { class: "row wrap wbviews" }, views),
    el("div", { class: "row wrap" }, [
      act("Frame all", () => CT.frame(st.scene), "Fit every object in view (A)"),
      act("Frame selected", () => { if (hasSel()) CT.frame(st.scene, st.sel); }, "Fit the selected object (F)"),
      act("Home", () => { if (homeCam) CT.camSet(cam(), homeCam); }, "Back to the scene's starting angle (H)")
    ]),
    el("div", { class: "row wrap" }, [ui.sliderRow("Lens", "scene.cam.fov", 15, 100, 1, " deg"), ui.sliderRow("Tilt", "scene.cam.pitch", -10, 89, 1, " deg"), ui.sliderRow("Turn", "scene.cam.yaw", 0, 359, 1, " deg")]),
    el("div", { class: "row wrap" }, [ui.checkRow("Lock camera", "view.camLock")]),
    el("div", { class: "row wrap" }, slots)
  ]);
}

// the Objects list: one chip per object, the selected one lit
function refreshObjList() {
  const box = refs.objList; if (!box) return;
  const key = st.scene.objs.map((o) => o.id + ":" + o.type).join(",") + "|" + (hasSel() ? st.sel.id : "");
  if (box.__key === key) return; box.__key = key;
  clear(box);
  if (!st.scene.objs.length) { box.appendChild(el("div", { class: "hint", text: "No objects yet. Drag something in from Add." })); return; }
  st.scene.objs.forEach((o) => {
    const b = el("button", { class: "pill" + (o === st.sel ? " on" : ""), title: "Select " + ED.label(o).toLowerCase() }, [el("span", { text: ED.label(o).replace(/\s+#\d+$/, "") + " " + o.id })]);
    b.addEventListener("click", () => select(o));
    box.appendChild(b);
  });
}

// ---- Viewport panel
function buildViewport(root) {
  clear(root);
  root.classList.add("brand-console");
  const lay = splitLayout(root, el); lay.root = root; refs.vpLay = lay;
  const h = vui.brand.header({ title: "Frank's Worlds Brew", code: CODE + "  VIEWPORT" });
  refs.vpLed = h; lay.pinned.appendChild(h.node);
  refs.createBtns = ED.CREATE.concat([["import", "Import"]]).map(([type, l]) => {
    const img = el("img", { class: "wbico" });
    const drag = type !== "import" && type !== "water" && type !== "ground";
    const b = el("button", { class: "btn wbcreate", title: type === "import" ? "Import a 3D model (.obj, .stl, .glb, .gltf)" : (drag ? "Drag into the view to place a " + l.toLowerCase() + ", or click to add one in front of the camera" : "Switch the " + l.toLowerCase() + " plane on or off") }, [img, el("span", { class: "wbl", text: l.toUpperCase() })]);
    b.__type = type; b.__img = img;
    if (type === "import") img.src = plusIcon();
    if (drag) dragTile(b, { type });
    else b.addEventListener("click", () => { if (type === "import") { importModel(); return; } ED.addObject(st.scene, type); changed("scene"); });
    vui.showIf(b, () => st.view.addPack === "Shapes");
    return b;
  });
  refs.vpImg = el("img", { class: "preview wbview", draggable: "false" });
  refs.vpBox = el("div", { class: "previewbox wbbox" }, [refs.vpImg]);
  wireViewportPointer(refs.vpImg);
  refs.vpHint = el("div", { class: "hint", text: HINT });
  refs.vpStatus = el("div", { class: "status", text: "" });
  refs.assetBtns = [];
  PK.PACKS.forEach((pk) => PK.assets(pk).forEach((a) => {
    const img = el("img", { class: "wbico" }), b = el("button", { class: "btn wbcreate", title: a.name + "  -  drag into the view, or click to add  -  " + a.credit }, [img, el("span", { class: "wbl", text: a.name.toUpperCase() })]);
    b.__asset = a; b.__img = img; b.__pack = pk;
    dragTile(b, { asset: a });
    vui.showIf(b, () => st.view.addPack === pk);
    refs.assetBtns.push(b);
  }));
  lay.pinned.appendChild(vui.card("Viewport", [
    refs.vpBox,
    el("div", { class: "row wrap" }, [
      vui.segGroup("view.mode", [{ v: "wire", l: "Wire" }, { v: "render", l: "Render" }]),
      vui.segGroup("view.gizmo", [{ v: "move", l: "Move", t: "Move handles (W)" }, { v: "rotate", l: "Rotate", t: "Rotate handle (E)" }, { v: "scale", l: "Scale", t: "Scale handles (R)" }, { v: "sculpt", l: "Sculpt", t: "Paint the selected terrain with the brush (B)" }])
    ]),
    sculptRow(vui),
    refs.vpHint, refs.vpStatus
  ], { fold: false }));
  lay.scroller.appendChild(vui.card("Controls", [el("div", { class: "wbdeck" }, [objectPad(vui), cameraPad(vui)])], { fold: false }));
  lay.scroller.appendChild(vui.card("Add", [
    el("div", { class: "row" }, [vui.segGroup("view.addPack", [{ v: "Shapes", l: "Shapes" }].concat(PK.PACKS.map((p) => ({ v: p, l: p }))))]),
    el("div", { class: "row wrap wbstrip" }, refs.createBtns.concat(refs.assetBtns)),
    el("div", { class: "hint", text: "Drag a tile into the view and let go where you want it (it sits on the terrain or ground). Click a tile to add it in front of the camera. Fantasy models: Kenney (kenney.nl), CC0. Alien models: original." })
  ], { fold: false }));
  refs.objList = el("div", { class: "row wrap wbobjs" });
  lay.scroller.appendChild(vui.card("Objects", [refs.objList, el("div", { class: "hint", text: "Click a name to select it. Tab / Shift-Tab step through, Esc deselects." })]));
  lay.scroller.appendChild(el("div", { class: "foot", text: "Frank's Worlds Brew " + VERSION + "  -  Viewport  -  Frank's Brew suite" }));
  try { document.addEventListener("mousemove", docMove, true); document.addEventListener("mouseup", docUp, true); } catch (e) { /* no document */ }
  vui.refreshAll(); refreshObjList();
}

// the brush controls (shown in both panels while a terrain is selected)
function sculptRow(ui) {
  const n = el("div", {}, [
    el("div", { class: "row wrap" }, [ui.segGroup("view.brush", ED.BRUSHES.map(([v, l]) => ({ v, l })))]),
    el("div", { class: "row wrap" }, [ui.sliderRow("Brush size", "view.bsize", 0.03, 0.4, 0.01, ""), ui.sliderRow("Strength", "view.bpow", 0.05, 1, 0.05, "")])
  ]);
  ui.showIf(n, () => is("terrain")() && st.view.gizmo === "sculpt"); return n;
}
const LIGHT_SW = [["Warm", "#FFC37A"], ["White", "#FFFFFF"], ["Cool", "#9CC8FF"], ["Rose", "#FF5FB4"], ["Mint", "#5EFFC8"], ["Violet", "#A66BFF"], ["Fire", "#FF6A2A"]];
const WATER_SW = [["Deep", "#05171F"], ["Ocean", "#0A2E4A"], ["Tropical", "#0E5A5C"], ["Lagoon", "#1F7A6E"], ["Murky", "#2A2A18"], ["Alien", "#2A0E3A"]];
const WATER_LOOKS = {
  Calm: { waveH: 0, waveSize: 1, ripple: 0.6, clarity: 20, waterRefl: 110, foam: 0 },
  Breezy: { waveH: 0.15, waveSize: 1.2, ripple: 1, clarity: 10, waterRefl: 100, foam: 20 },
  Choppy: { waveH: 0.35, waveSize: 0.8, ripple: 1.6, clarity: 0, waterRefl: 90, foam: 45 },
  Stormy: { waveH: 0.9, waveSize: 2.2, ripple: 2.2, clarity: 0, waterRefl: 70, foam: 80, waterCol: "#16242A" },
  Tropical: { waveH: 0.08, waveSize: 1, ripple: 0.8, clarity: 75, waterRefl: 100, foam: 30, waterCol: "#0E5A5C" }
};

// ---- Console panel
function buildConsole(root) {
  clear(root);
  root.classList.add("brand-console");
  const lay = splitLayout(root, el); lay.root = root; refs.cLay = lay; const ui = cui, { card, sliderRow, segGroup, selectRow, checkRow, showIf, bind, row } = ui;
  const h = ui.brand.header({ title: "Frank's Worlds Brew", code: CODE });
  refs.led = h; lay.pinned.appendChild(h.node);
  refs.preview = el("img", { class: "preview" });
  refs.previewBox = el("div", { class: "previewbox" }, [refs.preview]);
  refs.status = el("div", { class: "status", text: "Starting..." });
  const sceneLine = el("div", { class: "docline" });
  bind(() => { sceneLine.textContent = "SCENE  " + String(st.scene.name || "Untitled").toUpperCase() + "   -   " + ED.label(hasSel() ? st.sel : null); });
  lay.pinned.appendChild(card("Preview", [sceneLine, refs.previewBox, refs.status], { fold: false }));
  const btn = (l, fn, t) => { const b = el("button", { class: "btn small", text: l, title: t || "" }); b.addEventListener("click", fn); return b; };
  const only = (node, fn) => { showIf(node, fn); return node; };
  const none = (text) => only(el("div", { class: "hint", text }), () => !hasSel());

  // A Scene
  const list = Object.keys(S.PRESETS).map((name) => ["Classic", name]);
  PK.PACKS.forEach((pk) => Object.keys(PK.MAPS[pk]).forEach((name) => list.push([pk, name])));
  const thumbs = list.map(([pk, name]) => {
    const img = el("img", { class: "wbthumb" }), c = el("div", { class: "wbcell", title: "Load " + name }, [img, el("div", { class: "wbname", text: name })]);
    c.addEventListener("click", () => { loadScene(pk === "Classic" ? S.loadPreset(name) : PK.loadMap(pk, name)); setStatus("Loaded " + name + (pk === "Classic" ? "" : " (" + pk + " pack)")); });
    c.__name = name; c.__pack = pk; c.__img = img; showIf(c, () => st.view.scenePack === pk); return c;
  });
  refs.thumbs = thumbs;
  bind(() => thumbs.forEach((t) => { if (t.__name === st.scene.name) t.classList.add("on"); else t.classList.remove("on"); }));
  refs.savedSel = el("select", {});
  refs.saveName = el("input", { type: "text", placeholder: "Scene name" });
  const sceneCard = card("Scenes", [
    row("", segGroup("view.scenePack", [{ v: "Classic", l: "Classic" }].concat(PK.PACKS.map((p) => ({ v: p, l: p + " pack" }))))),
    el("div", { class: "wbgrid" }, thumbs),
    el("div", { class: "lbl3", text: "MY SCENES (models and textures are saved inside)" }),
    row("", refs.savedSel, btn("Load", () => { const s = saved[+refs.savedSel.value]; if (s) { const sc = S.fromJSON(s.json); sc.name = s.name; loadScene(sc); setStatus("Loaded " + s.name); } }),
      btn("Delete", async () => { const i = +refs.savedSel.value; if (saved[i]) { const n = saved[i].name; saved.splice(i, 1); await storeSaved(); setStatus("Deleted " + n); } })),
    row("", refs.saveName, btn("Save", () => saveCurrent())),
    row("", btn("Export scene...", () => exportScene(), "One .json file with every model and texture, for the team"), btn("Import scene...", () => importScene()))
  ]);

  // B Controls
  const matOpts = Object.keys(S.MATS).map((m) => ({ v: m, l: m }));
  const objCard = card("Object", [
    none("Click an object in the Viewport, or add one from its Create strip."),
    only(el("div", { class: "row wrap" }, [sliderRow("Size", "sel.s", 0.2, 15, 0.1, ""), sliderRow("Spin", "sel.ry", 0, 360, 1, " deg")]), () => hasSel() && st.sel.type !== "light"),
    only(el("div", { class: "row wrap" }, [sliderRow("Left/right", "sel.x", -40, 40, 0.1, ""), sliderRow("Height", "sel.y", -2, 20, 0.1, ""), sliderRow("Back/front", "sel.z", -60, 40, 0.1, "")]), hasSel),
    only(el("div", { class: "row wrap" }, [sliderRow("Peak", "sel.h", 0.5, 12, 0.1, ""), sliderRow("Shape", "sel.seed", 0, 99, 1, "")]), is("terrain")),
    only(selectRow("Material", "sel.mat", matOpts, () => { st.sel.refl = null; }), () => hasSel() && st.sel.type !== "light"),
    only(el("div", { class: "row wrap" }, [
      btn("Drop to ground", () => { CT.rest(st.scene, st.sel); changed("sel"); }),
      btn("Frame", () => { ED.view(st.scene, "frame", st.sel); changed("view"); }),
      btn("Duplicate", () => select(ED.duplicate(st.scene, st.sel))),
      btn("Delete", () => { ED.remove(st.scene, st.sel); select(null); })
    ]), hasSel)
  ]);
  const texName = el("span", { class: "lbl2" });
  bind(() => { texName.textContent = hasSel() && st.sel.img ? "IMAGE  " + String(st.sel.img.name || "").slice(0, 18).toUpperCase() : "NO IMAGE"; });
  const surf = () => hasSel() && st.sel.type !== "terrain" && st.sel.type !== "light";
  const matCard = card("Material", [
    none("Select an object to edit its material."),
    only(el("div", { class: "hint", text: "Terrains colour themselves by height and slope: sand at the water, grass, rock and snow on the peaks." }), is("terrain")),
    only(el("div", { class: "hint", text: "Lights have no material: set their colour and brightness in the Light tab." }), is("light")),
    only(selectRow("Preset", "sel.mat", matOpts, () => { st.sel.refl = null; }), surf),
    only(row("Pattern", segGroup("sel.pat", ["None", "Marble", "Wood", "Grid", "Noise"].map((p) => ({ v: p, l: p })))), surf),
    only(el("div", { class: "row wrap" }, [texName, btn("From active layer", () => textureFromLayer(), "Use the selected Photoshop layer as this object's image texture"), btn("Load image...", () => textureFromFile()),
      only(btn("Remove", () => { st.sel.img = null; changed("sel"); }), () => hasSel() && !!st.sel.img)]), surf),
    only(el("div", { class: "row wrap" }, [sliderRow("Tex scale", "sel.ts", 0.1, 5, 0.05, "x"), sliderRow("Bump", "sel.bump", 0, 1, 0.01, "")]), surf)
  ]);
  const triLine = el("div", { class: "lbl3" });
  bind(() => { triLine.textContent = is("mesh")() ? String(st.sel.mesh.name).toUpperCase() + "  -  " + st.sel.mesh.tris.toLocaleString() + " TRIANGLES" : ""; });
  const meshCard = card("Mesh", [
    el("div", { class: "hint", text: "Imported models and the Pawn / Rock samples. Import .obj, .stl, .glb or .gltf from the Viewport's Create strip." }),
    only(triLine, is("mesh")),
    only(checkRow("Smooth shading", "sel.smooth"), is("mesh")),
    only(checkRow("Model colours", "sel.vc"), () => is("mesh")() && !!st.sel.mesh.tc),
    only(el("div", { class: "row wrap" }, [sliderRow("Size", "sel.s", 0.1, 15, 0.05, ""), sliderRow("Displace", "sel.disp", 0, 0.4, 0.01, "")]), is("mesh")),
    only(el("div", { class: "row wrap" }, [
      btn("Drop to ground", () => { CT.rest(st.scene, st.sel); changed("sel"); }),
      btn("Stand upright", () => { const M = require("./js/models.js"); st.sel.mesh = M.upright(st.sel.mesh); st.sel._mk = null; ED.dropToGround(st.scene, st.sel); changed("sel"); }, "For Z-up files (3D-print exports)"),
      btn("Import model...", () => importModel())
    ]), () => true)
  ]);
  showIf(meshCard, is("mesh"));
  // Shape: surface shaping for terrains (generator dials + brush sculpting)
  const shapeCard = card("Shape", [
    el("div", { class: "lbl3", text: "SURFACE" }),
    el("div", { class: "row wrap" }, [sliderRow("Peak", "sel.h", 0.5, 12, 0.1, ""), sliderRow("Roughness", "sel.rough", 0.3, 0.75, 0.01, ""), sliderRow("Erosion", "sel.erosion", 0, 8, 1, "")]),
    el("div", { class: "row wrap" }, [sliderRow("Terraces", "sel.terrace", 0, 14, 1, ""), sliderRow("Plateau", "sel.plateau", 0, 0.8, 0.01, ""), sliderRow("Sharpness", "sel.sharp", 0.4, 3, 0.05, "")]),
    el("div", { class: "row wrap" }, [sliderRow("Shape", "sel.seed", 0, 99, 1, "")]),
    checkRow("Crater (bowl with a rim)", "sel.crater"),
    el("div", { class: "row wrap" }, [
      btn("New shape", () => { st.sel.seed = Math.floor(Math.random() * 100); changed("sel"); }, "A new random landform with the same settings"),
      btn("Undo stroke", () => { if (st.sel._undo !== undefined) { st.sel.sculpt = st.sel._undo; st.sel._undo = undefined; st.sel.sculptV++; changed("sel"); } }),
      btn("Clear sculpting", () => { ED.clearSculpt(st.sel); changed("sel"); })
    ]),
    el("div", { class: "lbl3", text: "BRUSH" }),
    el("div", { class: "row wrap" }, [segGroup("view.brush", ED.BRUSHES.map(([v, l]) => ({ v, l })))]),
    el("div", { class: "row wrap" }, [sliderRow("Brush size", "view.bsize", 0.03, 0.4, 0.01, ""), sliderRow("Strength", "view.bpow", 0.05, 1, 0.05, "")]),
    el("div", { class: "row wrap" }, [btn("Sculpt in Viewport", () => { st.view.gizmo = "sculpt"; st.view.mode = "wire"; changed("view"); setStatus("Sculpt mode: drag on the terrain in the Viewport. Shift-drag still pans."); }, "Switch the Viewport to the sculpt brush (B)")]),
    el("div", { class: "hint", text: "Raise and Lower build or dig, Smooth softens, Flatten levels to the height where the stroke started, Roughen adds rocky detail, Restore paints back the original shape." })
  ]);
  showIf(shapeCard, is("terrain"));
  // Light: sun + sky light, and point lights
  const swatchBtn = (l, hex, set, t) => { const b = el("button", { class: "btn small wbsw", title: t || hex }, [el("span", { class: "wbdot", style: { backgroundColor: hex } }), el("span", { text: l })]); b.addEventListener("click", () => { set(hex); changed("val"); }); return b; };
  const lightSel = () => (is("light")() ? st.sel : null);
  const lightCard = card("Light", [
    el("div", { class: "lbl3", text: "SUN" }),
    el("div", { class: "row wrap" }, [sliderRow("Sun angle", "scene.sunAz", 0, 359, 1, " deg"), sliderRow("Sun height", "scene.sunAlt", -5, 85, 1, " deg")]),
    el("div", { class: "row wrap" }, [sliderRow("Sun bright", "scene.sunPow", 0, 300, 1, "%"), sliderRow("Sky light", "scene.ambPow", 0, 300, 1, "%")]),
    row("Sun colour", ui.hexField(() => st.scene.sunCol || "", (v) => { st.scene.sunCol = v; }, true)),
    el("div", { class: "row wrap" }, [swatchBtn("Sky", "", (v) => { st.scene.sunCol = v; }, "Use the sky's own sun colour")].concat(LIGHT_SW.map(([l, h]) => swatchBtn(l, h, (v) => { st.scene.sunCol = v; })))),
    el("div", { class: "lbl3", text: "LIGHTS" }),
    el("div", { class: "row wrap" }, [
      btn("Add light", () => { select(ED.addObject(st.scene, "light")); }, "A point light in front of the camera; move it with the Viewport handles"),
      btn("Next light", () => { const L = st.scene.objs.filter((o) => o.type === "light"); if (!L.length) return; const i = L.indexOf(st.sel); select(L[(i + 1) % L.length]); })
    ]),
    only(el("div", { class: "hint", text: "Select a light (or add one) to set its colour, brightness and reach." }), () => !lightSel()),
    only(row("Colour", ui.hexField(() => (lightSel() ? lightSel().col : "#FFFFFF"), (v) => { if (lightSel()) lightSel().col = v; })), () => !!lightSel()),
    only(el("div", { class: "row wrap" }, LIGHT_SW.map(([l, h]) => swatchBtn(l, h, (v) => { if (lightSel()) lightSel().col = v; }))), () => !!lightSel()),
    only(el("div", { class: "row wrap" }, [sliderRow("Brightness", "sel.pow", 0, 800, 5, "%"), sliderRow("Reach", "sel.range", 0.5, 40, 0.5, ""), sliderRow("Bulb size", "sel.s", 0.05, 1.5, 0.01, "")]), () => !!lightSel()),
    only(el("div", { class: "row wrap" }, [sliderRow("Left/right", "sel.x", -40, 40, 0.1, ""), sliderRow("Height", "sel.y", -2, 20, 0.1, ""), sliderRow("Back/front", "sel.z", -60, 40, 0.1, "")]), () => !!lightSel()),
    only(el("div", { class: "row wrap" }, [checkRow("Visible glow", "sel.glow"), checkRow("Casts shadows", "sel.shadow"), btn("Delete light", () => { ED.remove(st.scene, st.sel); select(null); })]), () => !!lightSel())
  ]);
  // Water
  const waterCard = card("Water", [
    checkRow("Water plane", "scene.water"),
    el("div", { class: "row wrap" }, Object.keys(WATER_LOOKS).map((k) => btn(k, () => { Object.assign(st.scene, WATER_LOOKS[k]); st.scene.water = true; changed("val"); setStatus(k + " water"); }, "Water look: " + k))),
    el("div", { class: "row wrap" }, [sliderRow("Level", "scene.waterLvl", -3, 8, 0.05, ""), sliderRow("Wave height", "scene.waveH", 0, 1.5, 0.01, ""), sliderRow("Wave size", "scene.waveSize", 0.3, 4, 0.05, "")]),
    el("div", { class: "row wrap" }, [sliderRow("Wind", "scene.wind", 0, 359, 1, " deg"), sliderRow("Ripples", "scene.ripple", 0, 3, 0.05, ""), sliderRow("Foam", "scene.foam", 0, 100, 1, "%")]),
    el("div", { class: "row wrap" }, [sliderRow("Clarity", "scene.clarity", 0, 100, 1, "%"), sliderRow("Reflection", "scene.waterRefl", 0, 150, 1, "%")]),
    row("Colour", ui.hexField(() => st.scene.waterCol, (v) => { st.scene.waterCol = v; })),
    el("div", { class: "row wrap" }, WATER_SW.map(([l, h]) => swatchBtn(l, h, (v) => { st.scene.waterCol = v; }))),
    el("div", { class: "hint", text: "Clarity lets you see the ground and terrain under the water (turn on the Ground plane for a sea floor). Foam whitens shorelines and wave crests." })
  ]);
  const skyCard = card("Sky", [
    row("", segGroup("scene.sky", Object.keys(S.SKIES).map((k) => ({ v: k, l: k })))),
    el("div", { class: "row wrap" }, [sliderRow("Haze", "scene.haze", 0, 100, 1, "%"), sliderRow("Clouds", "scene.clouds", 0, 100, 1, "%")]),
    el("div", { class: "row wrap" }, [sliderRow("Fog", "scene.fog", 0, 100, 1, "%"), sliderRow("Fog height", "scene.fogH", 0.2, 6, 0.1, "")]),
    checkRow("Ground plane", "scene.ground"),
    el("div", { class: "hint", text: "Sun position, colour and brightness are in the Light tab; water is in the Water tab." })
  ]);
  const vbtn = (v, l) => btn(l, () => { ED.view(st.scene, v, hasSel() ? st.sel : null); changed("view"); });
  const camCard = card("Camera", [
    el("div", { class: "row wrap" }, [sliderRow("Orbit", "scene.cam.yaw", 0, 359, 1, " deg"), sliderRow("Tilt", "scene.cam.pitch", -10, 89, 1, " deg"), sliderRow("Distance", "scene.cam.dist", 3, 120, 0.5, "")]),
    el("div", { class: "row wrap" }, [sliderRow("Lens", "scene.cam.fov", 15, 100, 1, " deg"), sliderRow("Aim height", "scene.cam.ty", -2, 15, 0.1, "")]),
    el("div", { class: "row wrap" }, [vbtn("persp", "Perspective"), vbtn("top", "Top"), vbtn("front", "Front"), vbtn("eye", "Eye level"), vbtn("frame", "Frame selection")]),
    el("div", { class: "hint", text: "Or drag in the Viewport: drag = orbit, Shift-drag = pan, wheel = zoom." })
  ]);
  refs.tabs = ui.tabs([objCard, matCard, meshCard, shapeCard, lightCard, waterCard, skyCard, camCard], { title: "Controls" });

  // C Render
  refs.go = el("button", { class: "apply", text: "Render to layer" });
  refs.go.addEventListener("click", () => renderNow());
  refs.meter = ui.brand.meter(12);
  const sizeLine = el("div", { class: "hint" });
  bind(() => { const z = renderSize(); sizeLine.textContent = "Renders at " + z.w + " x " + z.h + (z.doc ? " (document size)" : " in a new document") + ". The render lands as a new layer group above the active layer; your artwork is not changed. One undo step."; });
  const renderCard = card("Render", [
    row("Quality", segGroup("out.quality", [{ v: "draft", l: "Draft", t: "One ray per pixel, fast" }, { v: "final", l: "Final", t: "Four rays per pixel, smooth edges" }])),
    sizeLine, refs.meter.node, refs.go
  ], { fold: false });

  const secs = [];
  const add = (letter, name, id, cards) => { const s = ui.section(letter, name, id); lay.scroller.appendChild(s); cards.forEach((c) => lay.scroller.appendChild(c)); secs.push({ letter, name, id, node: s }); };
  add("A", "SCENE", "scene", [sceneCard]);
  add("B", "CONTROLS", "controls", [refs.tabs]);
  add("C", "RENDER", "render", [renderCard]);
  lay.pinned.appendChild(ui.jumpStrip(secs, lay.scroller));
  lay.scroller.appendChild(el("div", { class: "foot", text: "Frank's Worlds Brew " + VERSION + "  -  Classic  -  Frank's Brew suite" }));
  ui.refreshAll();
}

async function drawThumbs() {
  for (const t of refs.thumbs || []) {
    const sc = t.__pack === "Classic" ? S.loadPreset(t.__name) : PK.loadMap(t.__pack, t.__name), r = await E.render(sc, sc.cam, 96, 54, {}, { yield: () => tick() });
    t.__img.src = PNG.dataURL(r.rgba, 96, 54, 4);
    await tick();
  }
}

// keys: W / E / R / B pick the tool; arrows move the selection (or orbit the camera when nothing is selected);
// Page Up / Down height, [ ] spin, - = size, Tab next object, F frame, A frame all, H home, Esc cancel / deselect, Delete removes
function onKey(e) {
  const t = e.target && e.target.tagName;
  if (/INPUT|SELECT|TEXTAREA/.test(t || "")) return;
  const key = String(e.key || ""), k = key.toLowerCase(), big = e.shiftKey ? "big" : st.view.step, sc = st.scene;
  const done = () => { if (e.preventDefault) e.preventDefault(); changed("val"); };
  if (key === "Escape") { if (carry) cancelCarry(); else select(null); return; }
  const g = { w: "move", e: "rotate", r: "scale", b: "sculpt" }[k];
  if (g && !e.metaKey && !e.ctrlKey) { st.view.gizmo = g; changed("view"); return; }
  if ((key === "Delete" || key === "Backspace") && hasSel()) { ED.remove(sc, st.sel); select(null); return; }
  if (key === "Tab") { if (e.preventDefault) e.preventDefault(); select(CT.cycle(sc, hasSel() ? st.sel : null, e.shiftKey ? -1 : 1)); return; }
  if (k === "f") { if (hasSel()) CT.frame(sc, st.sel); else CT.frame(sc); return done(); }
  if (k === "a" && !e.metaKey && !e.ctrlKey) { CT.frame(sc); return done(); }
  if (k === "h" && homeCam) { CT.camSet(sc.cam, homeCam); return done(); }
  const dir = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "fwd", ArrowDown: "back", PageUp: "up", PageDown: "down" }[key];
  if (dir) {
    if (hasSel()) CT.nudge(sc, st.sel, dir, big, st.view.stick);
    else { const o = (CT.STEP[big] || CT.STEP.med).orbit; ({ left: () => CT.camOrbit(sc.cam, o, 0), right: () => CT.camOrbit(sc.cam, -o, 0), fwd: () => CT.camOrbit(sc.cam, 0, o), back: () => CT.camOrbit(sc.cam, 0, -o), up: () => CT.camZoom(sc.cam, 0.9), down: () => CT.camZoom(sc.cam, 1.1) })[dir](); }
    return done();
  }
  if (hasSel() && (key === "[" || key === "]")) { CT.spin(st.sel, key === "]" ? 1 : -1, big); return done(); }
  if (hasSel() && (key === "-" || key === "=" || key === "+")) { CT.grow(sc, st.sel, key === "-" ? -1 : 1, big, st.view.stick); return done(); }
}

// ---- start-up: both panels share this one script; each mounts into its own panel root
let builtC = false, builtV = false, started = false;
function mount(id, rootNode) { let n = document.getElementById(id); if (!n) { n = document.createElement("div"); n.id = id; (rootNode || document.body).appendChild(n); } if (rootNode && n && n.parentNode !== rootNode) rootNode.appendChild(n); return n; }
function initConsole(rootNode) { const n = mount("app", rootNode); if (!builtC && n) { builtC = true; buildConsole(n); pressGlow(n); } kick(); }
function initViewport(rootNode) { const n = mount("vp", rootNode); if (!builtV && n) { builtV = true; buildViewport(n); pressGlow(n); } kick(); }
function kick() {
  if (!homeCam) homeCam = CT.camCopy(st.scene.cam);
  drawViewport(); loop.schedule(100);
  if (started) return;
  started = true;
  setTimeout(async () => { await loadSaved(); await drawIcons(); await drawThumbs(); await drawAssetIcons(); }, 300);
}
try { document.addEventListener("keydown", onKey); } catch (e) { /* no document */ }
try {
  if (uxp && uxp.entrypoints) uxp.entrypoints.setup({ panels: {
    worldsConsole: { create(root) { initConsole(root); }, show(root) { initConsole(root); } },
    worldsViewport: { create(root) { initViewport(root); }, show(root) { initViewport(root); } }
  } });
} catch (e) { /* older hosts: fall through to direct init */ }
setTimeout(() => { initConsole(null); initViewport(null); }, 0);

module.exports = { _test: { st, refs, changed, select, renderNow, drawViewport, miniRender, NONE, get lastWire() { return lastWire; }, get carry() { return carry; }, docMove, docUp, onKey, loadScene, saveCurrent, get saved() { return saved; } } };
