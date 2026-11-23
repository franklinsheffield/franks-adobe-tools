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
const PS = require("./core/ps-io.js");
const PNG = require("./core/png.js");
const { createUI, el, clear } = require("./core/ui.js");
const { splitLayout, pressGlow } = require("./core/layout.js");
const { createPreviewLoop, tick } = require("./core/preview.js");

const APP = "Frank's Worlds Brew", CODE = "WB-10", GLOW = "#5effc8", VERSION = "0.4.1";
PS.configure({ appName: APP, presetFile: "scenes.json", exportName: "worlds-scene.json" });
let uxp = null; try { uxp = require("uxp"); } catch (e) { uxp = null; }
const psHost = require("photoshop");   // loaded once at start-up (the test harness only serves it then)

// ---- shared state: the scene, the selection (a placeholder when nothing is selected) and panel options
const NONE = S.obj("sphere", 0, 0, 0, 1, "Matte");
const st = { scene: S.loadPreset("Chrome Garden"), sel: NONE, view: { mode: "wire", gizmo: "move", scenePack: "Classic", assetPack: "Fantasy", brush: "raise", bsize: 0.12, bpow: 0.5 }, out: { quality: "final" }, saveName: "" };
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
  const avail = Math.max(120, ((box && box.clientWidth) || 320) - 12), dw = Math.min(avail, r.w * 2), dh = Math.round(r.h * dw / r.w);
  img.style.width = dw + "px"; img.style.height = dh + "px";
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
function vpSize() {
  const box = refs.vpBox, avail = Math.max(240, Math.min(1400, ((box && box.clientWidth) || 640) - 12));
  return { w: Math.round(avail), h: Math.max(120, Math.round(avail / aspect())) };
}
function drawViewport() {
  if (!refs.vpImg) return;
  const { w, h } = vpSize();
  if (st.view.mode === "wire" || dragging) {
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
const HINT = "Drag = orbit  -  Shift-drag = pan  -  wheel = zoom  -  click = select. Drag the coloured handles to move, rotate or scale (W / E / R). Sculpt (B) paints a selected terrain.";
function wireViewportPointer(img) {
  img.addEventListener("mousedown", (e) => {
    const [mx, my] = vpXY(e);
    if (sculpting() && !e.shiftKey) { const hit = terrainUnder(mx, my);
      if (hit) { const o = st.sel; o._undo = o.sculpt ? o.sculpt.slice() : null;
        dragging = { x: e.clientX, y: e.clientY, moved: true, sculpt: true, ref: ED.heightAt(o, hit.u, hit.v) };
        brushAt = hit; ED.sculpt(o, st.view.brush, hit.u, hit.v, st.view.bsize, st.view.bpow, dragging.ref); drawViewport(); if (e.preventDefault) e.preventDefault(); return; } }
    const h = hasSel() && lastWire ? WF.pickHandle(lastWire.gizmo, mx, my) : null;
    dragging = { x: e.clientX, y: e.clientY, mx, my, moved: false, shift: e.shiftKey, cam: Object.assign({}, st.scene.cam), h, start: hasSel() ? Object.assign({}, st.sel) : null };
    if (e.preventDefault) e.preventDefault();
  });
  const move = (e) => {
    if (dragging && dragging.sculpt) { const [mx, my] = vpXY(e), hit = terrainUnder(mx, my); if (hit) { brushAt = hit; ED.sculpt(st.sel, st.view.brush, hit.u, hit.v, st.view.bsize, st.view.bpow, dragging.ref); drawViewport(); } return; }
    if (!dragging) { if (sculpting() && e.currentTarget === img) { const [mx, my] = vpXY(e); brushAt = terrainUnder(mx, my); if (st.view.mode === "wire") drawViewport(); } return; }
    const rect = (() => { try { return img.getBoundingClientRect(); } catch (err) { return null; } })();
    const k = lastWire && rect && rect.width ? lastWire.w / rect.width : 1;
    const dx = (e.clientX - dragging.x) * k, dy = (e.clientY - dragging.y) * k;
    if (!dragging.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    dragging.moved = true;
    if (dragging.h && hasSel()) {
      WF.dragHandle(st.sel, dragging.start, dragging.h, dx, dy);
      const o = st.sel, h = dragging.h;
      vpHint(h.mode.toUpperCase() + "  " + (h.mode === "rotate" ? "spin " + o.ry + " deg" : h.mode === "move" ? h.ax.toUpperCase() + " = " + o[h.ax] : "size " + o.s + (o.type === "mesh" ? "  (x " + o.sx + "  y " + o.sy + "  z " + o.sz + ")" : "")));
    } else if (dragging.shift) ED.pan(st.scene.cam, dragging.cam, dx, dy, aspect());
    else ED.orbit(st.scene.cam, dragging.cam, dx, dy);
    cui.refreshAll(); vui.refreshAll(); drawViewport();
  };
  const up = (e) => {
    if (!dragging) return;
    const d = dragging; dragging = null;
    if (d.sculpt) { vpHint("Sculpted with " + st.view.brush + ". Undo stroke is in the Shape tab."); changed("sel"); return; }
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
function loadScene(scene) { st.scene = scene; st.sel = NONE; changed("scene"); }
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

// ---- Viewport panel
function buildViewport(root) {
  clear(root);
  root.classList.add("brand-console");
  const lay = splitLayout(root, el);
  const h = vui.brand.header({ title: "Frank's Worlds Brew", code: CODE + "  VIEWPORT" });
  refs.vpLed = h; lay.pinned.appendChild(h.node);
  refs.createBtns = ED.CREATE.concat([["import", "Import"]]).map(([type, l]) => {
    const img = el("img", { class: "wbico" });
    const b = el("button", { class: "btn wbcreate", title: type === "import" ? "Import a 3D model (.obj, .stl, .glb, .gltf)" : (type === "water" || type === "ground" ? "Switch the " + l.toLowerCase() + " plane on or off" : "Add a " + l.toLowerCase()) }, [img, el("span", { class: "wbl", text: l.toUpperCase() })]);
    b.__type = type; b.__img = img;
    if (type === "import") img.src = plusIcon();
    b.addEventListener("click", () => {
      if (type === "import") { importModel(); return; }
      const o = ED.addObject(st.scene, type);
      if (o) select(o); else changed("scene");
    });
    return b;
  });
  refs.vpImg = el("img", { class: "preview wbview" });
  refs.vpBox = el("div", { class: "previewbox wbbox" }, [refs.vpImg]);
  wireViewportPointer(refs.vpImg);
  refs.vpHint = el("div", { class: "hint", text: HINT });
  refs.vpStatus = el("div", { class: "status", text: "" });
  const viewBtn = (v, l) => { const b = el("button", { class: "btn small", text: l }); b.addEventListener("click", () => { ED.view(st.scene, v, hasSel() ? st.sel : null); changed("view"); }); return b; };
  const act = (l, fn, t) => { const b = el("button", { class: "btn small", text: l, title: t || "" }); b.addEventListener("click", fn); return b; };
  lay.pinned.appendChild(vui.card("Create", [el("div", { class: "row wrap wbstrip" }, refs.createBtns)], { fold: false }));
  refs.assetBtns = [];
  PK.PACKS.forEach((pk) => PK.assets(pk).forEach((a) => {
    const img = el("img", { class: "wbico" }), b = el("button", { class: "btn wbcreate", title: "Add " + a.name.toLowerCase() + "  -  " + a.credit }, [img, el("span", { class: "wbl", text: a.name.toUpperCase() })]);
    b.__asset = a; b.__img = img; b.__pack = pk;
    b.addEventListener("click", () => { select(addAsset(a)); setStatus("Added " + a.name + "  -  " + a.credit); });
    vui.showIf(b, () => st.view.assetPack === pk);
    refs.assetBtns.push(b);
  }));
  lay.scroller.appendChild(vui.card("Assets", [
    el("div", { class: "row" }, [vui.segGroup("view.assetPack", PK.PACKS.map((p) => ({ v: p, l: p })))]),
    el("div", { class: "row wrap wbstrip" }, refs.assetBtns),
    el("div", { class: "hint", text: "Fantasy models: Kenney (kenney.nl), free CC0 public domain. Alien models: original, made for Worlds Brew. Click one to drop it in front of the camera." })
  ]));
  lay.pinned.appendChild(vui.card("Viewport", [
    refs.vpBox,
    el("div", { class: "row wrap" }, [
      vui.segGroup("view.mode", [{ v: "wire", l: "Wire" }, { v: "render", l: "Render" }]),
      vui.segGroup("view.gizmo", [{ v: "move", l: "Move", t: "Move handles (W)" }, { v: "rotate", l: "Rotate", t: "Rotate handle (E)" }, { v: "scale", l: "Scale", t: "Scale handles (R)" }, { v: "sculpt", l: "Sculpt", t: "Paint the selected terrain with the brush (B)" }])
    ]),
    sculptRow(vui),
    el("div", { class: "row wrap" }, [viewBtn("persp", "Perspective"), viewBtn("top", "Top"), viewBtn("front", "Front"), viewBtn("eye", "Eye level"), viewBtn("frame", "Frame selection")]),
    el("div", { class: "row wrap" }, [
      act("Drop to ground", () => { if (hasSel()) { ED.dropToGround(st.scene, st.sel); changed("sel"); } }),
      act("Duplicate", () => { if (hasSel()) select(ED.duplicate(st.scene, st.sel)); }),
      act("Delete", () => { if (hasSel()) { ED.remove(st.scene, st.sel); select(null); } }, "Delete the selected object (Delete key)")
    ]),
    refs.vpHint, refs.vpStatus
  ], { fold: false }));
  lay.scroller.appendChild(el("div", { class: "foot", text: "Frank's Worlds Brew " + VERSION + "  -  Viewport  -  Frank's Brew suite" }));
  vui.refreshAll();
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
  const lay = splitLayout(root, el), ui = cui, { card, sliderRow, segGroup, selectRow, checkRow, showIf, bind, row } = ui;
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
      btn("Drop to ground", () => { ED.dropToGround(st.scene, st.sel); changed("sel"); }),
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
      btn("Drop to ground", () => { ED.dropToGround(st.scene, st.sel); changed("sel"); }),
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

// keys: W / E / R pick the handle, Delete removes the selection (not while typing)
function onKey(e) {
  const t = e.target && e.target.tagName;
  if (/INPUT|SELECT|TEXTAREA/.test(t || "")) return;
  const g = { w: "move", e: "rotate", r: "scale", b: "sculpt" }[String(e.key || "").toLowerCase()];
  if (g) { st.view.gizmo = g; changed("view"); return; }
  if ((e.key === "Delete" || e.key === "Backspace") && hasSel()) { ED.remove(st.scene, st.sel); select(null); }
}

// ---- start-up: both panels share this one script; each mounts into its own panel root
let builtC = false, builtV = false, started = false;
function mount(id, rootNode) { let n = document.getElementById(id); if (!n) { n = document.createElement("div"); n.id = id; (rootNode || document.body).appendChild(n); } if (rootNode && n && n.parentNode !== rootNode) rootNode.appendChild(n); return n; }
function initConsole(rootNode) { const n = mount("app", rootNode); if (!builtC && n) { builtC = true; buildConsole(n); pressGlow(n); } kick(); }
function initViewport(rootNode) { const n = mount("vp", rootNode); if (!builtV && n) { builtV = true; buildViewport(n); pressGlow(n); } kick(); }
function kick() {
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

module.exports = { _test: { st, refs, changed, select, renderNow, drawViewport, miniRender, NONE, get lastWire() { return lastWire; }, onKey, loadScene, saveCurrent, get saved() { return saved; } } };
