// Worlds Lab (WB-10) desktop app: the window's UI.
// Library (scenes, drag-and-drop assets, object list) | live GPU viewport + control pads | Inspector tabs,
// with a render bar along the bottom. The scene is the same plain data the Photoshop plugin uses.
import { Viewport, snapshot } from "./view3d.js";
import { axisGizmo, palette } from "./ux.js";
import { renderGPU, passPictures } from "./gpurender.js";
import * as BR from "./bridge-app.js";

const req = window.require;
const { ipcRenderer } = req("electron");
const S = req("../engine/scene.js");
const E = req("../engine/engine.js");
const ED = req("../engine/editor.js");
const PK = req("../engine/packs.js");
const CT = req("../engine/controls.js");
const PNG = req("../engine/kit/png.js");
const { createUI, el, clear } = req("../engine/kit/ui.js");
const { pressGlow } = req("../engine/kit/layout.js");
const HELP = req("./help-app.js");   // hover help text for the app's own controls (shared texts come from engine/kit/help-text.js)
const SC = req("./scaletools.js");
const SF = req("../engine/surface.js");

const APP = "Worlds Lab", CODE = "WB-10", GLOW = "#5effc8", VERSION = "0.8.0";
const BLANK = () => S.withDefaults({ sky: "Noon", sunAz: 200, sunAlt: 32, haze: 12, fog: 0, fogH: 1, clouds: 30, water: false, ground: true, waterLvl: 0,
  cam: { yaw: 30, pitch: 16, dist: 16, fov: 45, tx: 0, ty: 1, tz: 0 }, objs: [], name: "Untitled" });

// ---- state
const NONE = S.obj("sphere", 0, 0, 0, 1, "Matte");
const st = {
  scene: S.loadPreset("Chrome Garden"), sel: NONE,
  view: { gizmo: "move", step: "med", stick: true, camLock: false, libPack: "Classic", addPack: "Shapes", brush: "raise", bsize: 0.12, bpow: 0.5, lockScale: true, realH: 1.8, matchId: 0 },
  out: { quality: "final", engine: "gpu", w: 1920, h: 1080, autoSend: false }
};
const hasSel = () => st.sel !== NONE && st.scene.objs.includes(st.sel);
// the selected surface layer (a stand-in when there is none, so the Surfaces dials always have something to read)
const NOLAYER = SF.layer({ name: "-" });
st.view.layI = 0;
Object.defineProperty(st, "lay", { get: () => { const Ls = hasSel() && st.sel.layers; if (!Ls || !Ls.length) return NOLAYER; st.view.layI = Math.max(0, Math.min(Ls.length - 1, st.view.layI)); return Ls[st.view.layI]; } });
const hasLay = () => st.lay !== NOLAYER;
const is = (...types) => () => hasSel() && types.includes(st.sel.type);
const refs = {};
let filePath = null, dirty = false, homeCam = null, rendering = false, cancelReq = false, lastStretch = null;
const camSlots = [null, null, null];

// ---- undo: a stack of light snapshots (objects are shallow copies; meshes, images and sculpt grids are shared, never mutated)
const hist = { list: [], i: -1 };
function snap() { const sc = st.scene; return { scene: Object.assign({}, sc, { cam: Object.assign({}, sc.cam), objs: sc.objs.map((o) => Object.assign({}, o, o.layers ? { layers: o.layers.map((L) => Object.assign({}, L)) } : null)) }), sel: hasSel() ? st.sel.id : null }; }
function commit() { hist.list = hist.list.slice(0, hist.i + 1); hist.list.push(snap()); if (hist.list.length > 80) hist.list.shift(); hist.i = hist.list.length - 1; markDirty(); }
function resetHistory() { hist.list = [snap()]; hist.i = 0; }
function restore(sn) {
  const byId = new Map(st.scene.objs.map((o) => [o.id, o])), cam = st.scene.cam;
  const objs = sn.scene.objs.map((c) => { const o = byId.get(c.id) || {}; Object.keys(o).forEach((k) => { if (!(k in c) && k[0] !== "_") delete o[k]; }); return Object.assign(o, c, c.layers ? { layers: c.layers.map((L) => Object.assign({}, L)) } : null); });
  Object.assign(st.scene, sn.scene, { objs, cam }); st.sel = objs.find((o) => o.id === sn.sel) || NONE; changed("sel");
}
function undo() { if (hist.i > 0) { hist.i--; restore(hist.list[hist.i]); markDirty(); setStatus("Undo"); } }
function redo() { if (hist.i < hist.list.length - 1) { hist.i++; restore(hist.list[hist.i]); markDirty(); setStatus("Redo"); } }
function markDirty() { dirty = true; title(); }
function title() { const n = filePath ? req("path").basename(filePath) : (st.scene.name || "Untitled"); ipcRenderer.send("app:title", (dirty ? "* " : "") + n + "  -  " + APP); if (refs.docName) refs.docName.textContent = String(n).toUpperCase() + (dirty ? "  *" : ""); }

function setStatus(msg, err) { if (refs.status) { refs.status.textContent = msg; refs.status.className = "status" + (err ? " err" : ""); } if (refs.led) refs.led.set(err ? "err" : rendering ? "busy" : "ready"); }

// ---- change hub
let uis = [];
function changed(kind) {
  if (kind !== "drag" && kind !== "view") uis.forEach((u) => u.refreshAll());
  else if (refs.insp) refs.insp.refreshAll();
  refreshObjList();
  vp.sync(st.scene, hasSel() ? st.sel : null, st.view.gizmo);
  if (refs.axes) refs.axes.update();
  updateHint();
}
function select(o) { st.sel = o || NONE; lastStretch = hasSel() ? { sx: st.sel.sx || 1, sy: st.sel.sy || 1, sz: st.sel.sz || 1 } : null; changed("sel"); }
function edited() { // a committed Inspector edit
  if (hasSel() && st.view.lockScale && lastStretch && SC.applyLock(st.sel, lastStretch)) { /* spread W / H / D */ }
  if (hasSel()) lastStretch = { sx: st.sel.sx || 1, sy: st.sel.sy || 1, sz: st.sel.sz || 1 };
  commit(); changed("val");
}
function loadScene(sc, path) { st.scene = sc; st.sel = NONE; filePath = path || null; dirty = false; homeCam = CT.camCopy(sc.cam); resetHistory(); changed("scene"); title(); }

// ---- colour picker: the system colour dialog through a hidden <input type="color">
function pickColor(hex) {
  return new Promise((resolve) => {
    const i = document.createElement("input"); i.type = "color"; i.value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#ffffff";
    i.style.position = "fixed"; i.style.left = "-100px"; document.body.appendChild(i);
    i.addEventListener("change", () => { resolve(i.value.toUpperCase()); i.remove(); }); i.addEventListener("blur", () => setTimeout(() => i.remove(), 2000));
    i.click();
  });
}

// ---- viewport
const canvas = document.getElementById("vp");
const vp = new Viewport(canvas, {
  onGizmoDrag(on, o) { if (on) { gz = o; if (o && o.type === "terrain") { o._s0 = o.s; o._h0 = o.h; } } else { gz = null; commit(); changed("val"); } },
  onGizmoChange(o, n, mode) {
    if (!o) return;
    const r3 = (v) => +v.toFixed(3);
    if (mode === "translate") { o.x = r3(n.position.x); o.y = r3(n.position.y); o.z = r3(n.position.z); }
    else if (mode === "rotate") { o.ry = Math.round(((n.rotation.y * 180 / Math.PI) % 360 + 360) % 360); }
    else if (mode === "scale") {
      if (o.type === "terrain") { const k = (n.scale.x + n.scale.z) / 2; o.s = r3(Math.max(0.5, (o._s0 || o.s) * k)); o.h = r3(Math.max(0.1, (o._h0 || o.h) * n.scale.y)); }
      else if (o.type !== "light") {
        const ex = o.s * (o.sx || 1), ey = o.s * (o.sy || 1), ez = o.s * (o.sz || 1), rx = n.scale.x / ex, ry = n.scale.y / ey, rz = n.scale.z / ez;
        if (Math.abs(rx - ry) < 1e-4 && Math.abs(ry - rz) < 1e-4) o.s = r3(Math.max(0.02, o.s * rx));
        else { o.sx = r3(Math.max(0.05, (o.sx || 1) * rx)); o.sy = r3(Math.max(0.05, (o.sy || 1) * ry)); o.sz = r3(Math.max(0.05, (o.sz || 1) * rz)); }
        if (st.view.stick) CT.rest(st.scene, o);
      }
    }
    changed("drag");
  },
  onDraw() { placeFrameGuide(); }
});
let gz = null;
const vpwrap = document.getElementById("vpwrap");

// the render frame: the area outside the output's aspect ratio is dimmed
function placeFrameGuide() {
  let g = refs.frame; if (!g) { g = refs.frame = el("div", { class: "frameguide" }); g.style.cssText = "position:absolute;pointer-events:none;box-shadow:0 0 0 2000px rgba(0,0,0,0.45);border:1px solid rgba(94,255,200,0.6)"; vpwrap.appendChild(g); }
  const W = vpwrap.clientWidth, H = vpwrap.clientHeight, A = st.out.w / st.out.h; let w = W, h = W / A; if (h > H) { h = H; w = H * A; }
  g.style.left = (W - w) / 2 + "px"; g.style.top = (H - h) / 2 + "px"; g.style.width = w + "px"; g.style.height = h + "px";
}

// live key hints in the status bar: they follow the tool, the selection and what the pointer is over
let hover = "none";   // none | obj | empty | gizmo
function keyHints() {
  const g = st.view.gizmo, sel = hasSel(), K = (k, t) => [k, t];
  if (drag && drag.kind === "move") return [K("Shift", "lift instead"), K("Esc", "deselect after")];
  if (drag && (drag.kind === "orbit" || drag.kind === "pan")) return [K("Drag", drag.kind === "orbit" ? "orbit" : "pan"), K("Wheel", "zoom")];
  if (g === "sculpt") return [K("Drag", "sculpt terrain"), K("Alt-drag", "orbit"), K("Right-drag", "pan"), K("W", "back to move")];
  const out = [];
  if (hover === "obj") out.push(K("Drag", g === "move" ? "move" : "select"), K("Shift-drag", "up / down"), K("Double-click", "frame it"));
  else if (hover === "empty") out.push(K("Drag", "orbit"), K("Right-drag", "pan"), K("Wheel", "zoom"), K("Click", "deselect"));
  if (sel) out.push(K("Arrows", "nudge"), K("[ ]", "spin"), K("- =", "size"), K("Del", "remove"), K("F", "frame"));
  else out.push(K("Tab", "select next"), K("A", "frame all"), K("H", "home view"));
  out.push(K("W E R B", "tools"), K(MOD + "K", "commands"));
  return out;
}
const MOD = /Mac/.test(navigator.platform) ? "\u2318" : "Ctrl+";
function updateHint() {
  const h = refs.keys; if (!h) return;
  const sig = JSON.stringify(keyHints()); if (h.__sig === sig) return; h.__sig = sig; clear(h);
  keyHints().forEach(([k, t]) => { h.appendChild(el("span", { class: "kh" }, [el("kbd", { text: k }), el("span", { text: t })])); });
}

// ---- pointer: select, drag-move, orbit / pan / zoom, sculpt
let drag = null;
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  if (vp.tc.dragging || vp.overGizmo()) return;
  canvas.setPointerCapture(e.pointerId); canvas.focus();
  const sc = st.scene, hit = vp.pick(e.clientX, e.clientY), base = { x: e.clientX, y: e.clientY, moved: false, cam: Object.assign({}, sc.cam) };
  if (e.button === 2 || e.button === 1 || (e.shiftKey && !(hit && hit.obj.type !== "terrain"))) { drag = Object.assign(base, { kind: "pan" }); return; }
  if (e.altKey) { drag = Object.assign(base, { kind: "orbit" }); return; }
  if (st.view.gizmo === "sculpt") {
    const t = terrainUnder(e.clientX, e.clientY);
    if (t) { t.o._undo = t.o.sculpt; drag = Object.assign(base, { kind: "sculpt", o: t.o, ref: ED.heightAt(t.o, t.u, t.v) }); sculptAt(t); return; }
  }
  if (hit && hit.obj.type !== "terrain") {
    const o = hit.obj; if (st.sel !== o) select(o);
    if (st.view.gizmo === "move" || st.view.gizmo === "sculpt") {
      const g = st.view.stick ? CT.groundHit(sc, vp.rayAt(e.clientX, e.clientY), o) : CT.planeHit(vp.rayAt(e.clientX, e.clientY), o.y);
      drag = Object.assign(base, { kind: e.shiftKey ? "lift" : "move", o, off: g ? { x: o.x - g.x, z: o.z - g.z } : { x: 0, z: 0 }, y0: o.y });
    } else drag = Object.assign(base, { kind: "click", o });
    return;
  }
  drag = Object.assign(base, { kind: "orbit", clickPick: hit ? hit.obj : null });
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag) { const h = vp.overGizmo() ? "gizmo" : vp.pick(e.clientX, e.clientY), hv = h === "gizmo" ? "gizmo" : h && h.obj.type !== "terrain" ? "obj" : "empty"; if (hv !== hover) { hover = hv; updateHint(); } }
  if (!drag) { if (st.view.gizmo === "sculpt") { const t = terrainUnder(e.clientX, e.clientY); vp.setRing(t ? t.p : null, t ? st.view.bsize * 2 * t.o.s : 1); } return; }
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; if (!drag.moved) return;
  const sc = st.scene;
  if (drag.kind === "orbit") { if (st.view.camLock) return; ED.orbit(sc.cam, drag.cam, dx, dy); changed("view"); }
  else if (drag.kind === "pan") { if (st.view.camLock) return; ED.pan(sc.cam, drag.cam, dx, dy, canvas.width / canvas.height); changed("view"); }
  else if (drag.kind === "move") {
    const ray = vp.rayAt(e.clientX, e.clientY), g = st.view.stick ? CT.groundHit(sc, ray, drag.o) : CT.planeHit(ray, drag.y0);
    if (g) { CT.placeAt(sc, drag.o, g.x + drag.off.x, g.z + drag.off.z, st.view.stick); if (!st.view.stick) drag.o.y = drag.y0; }
    changed("drag");
  } else if (drag.kind === "lift") { drag.o.y = +(drag.y0 - dy * sc.cam.dist / 400).toFixed(3); changed("drag"); }
  else if (drag.kind === "sculpt") { const t = terrainUnder(e.clientX, e.clientY, drag.o); if (t) sculptAt(t, drag.ref); }
});
function endDrag(e) {
  if (!drag) return;
  const d = drag; drag = null; updateHint();
  try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ok */ }
  if (d.kind === "orbit" && !d.moved) select(d.clickPick);      // a click: select the terrain under it, or nothing
  else if ((d.kind === "move" || d.kind === "lift" || d.kind === "sculpt") && d.moved) { commit(); changed("val"); }
  else if (d.kind === "sculpt") { commit(); changed("val"); }
  else if (d.kind === "orbit" || d.kind === "pan") changed("view");
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("dblclick", (e) => { const h = vp.pick(e.clientX, e.clientY); if (h) { select(h.obj); CT.frame(st.scene, h.obj); changed("view"); } });
canvas.addEventListener("wheel", (e) => { e.preventDefault(); if (st.view.camLock) return; CT.camZoom(st.scene.cam, Math.pow(1.0015, e.deltaY)); changed("view"); }, { passive: false });
canvas.addEventListener("pointerleave", () => { vp.setRing(null); hover = "none"; updateHint(); });

function terrainUnder(cx, cy, only) {
  const ray = vp.rayAt(cx, cy); let best = null, bd = Infinity;
  for (const o of only ? [only] : st.scene.objs) { if (o.type !== "terrain") continue; const h = ED.terrainHit(o, ray); if (!h) continue; const d = Math.hypot(h.x - ray.ox, h.y - ray.oy, h.z - ray.oz); if (d < bd) { bd = d; best = { o, u: h.u, v: h.v, p: h }; } }
  return best;
}
function sculptAt(t, ref) { ED.sculpt(t.o, st.view.brush, t.u, t.v, st.view.bsize, st.view.bpow, ref); vp.setRing(t.p, st.view.bsize * 2 * t.o.s); changed("drag"); }

// ---- adding things: click a tile (in front of the camera) or drag it into the view (where it lands)
const SHAPES = [["terrain", "Terrain"], ["sphere", "Sphere"], ["cube", "Cube"], ["cylinder", "Cylinder"], ["cone", "Cone"], ["torus", "Torus"], ["light", "Light"], ["pawn", "Pawn"], ["rock", "Rock"]];
function addThing(key, at) {
  const sc = st.scene, [kind, id] = key.split(":");
  let o;
  if (kind === "shape") o = ED.addObject(sc, id);
  else { const c = sc.cam; o = PK.put(id, +(c.tx).toFixed(2), +(c.tz).toFixed(2), 1); o.vc = true; sc.objs.push(o); if (!at) { const n = sc.objs.length, a = n * 2.399963; CT.placeAt(sc, o, c.tx + Math.cos(a) * 1.5, c.tz + Math.sin(a) * 1.5, true); } }
  if (!o) return null;
  if (at) { if (o.type === "terrain") { o.x = +at.x.toFixed(2); o.z = +at.z.toFixed(2); } else CT.placeAt(sc, o, at.x, at.z, true); if (o.type === "light") o.y = +(at.y + 1.6).toFixed(2); }
  else if (o.type !== "terrain" && o.type !== "light") CT.rest(sc, o);
  select(o); commit(); setStatus("Added " + ED.label(o).toLowerCase().replace(/#\d+/, "").trim()); return o;
}
let dragKey = null;
vpwrap.addEventListener("dragover", (e) => {
  e.preventDefault(); vpwrap.classList.add("drop");
  const m = document.getElementById("dropmark"), r = vpwrap.getBoundingClientRect(); m.style.display = "block"; m.style.left = (e.clientX - r.left) + "px"; m.style.top = (e.clientY - r.top) + "px";
});
vpwrap.addEventListener("dragleave", () => { vpwrap.classList.remove("drop"); document.getElementById("dropmark").style.display = "none"; });
vpwrap.addEventListener("drop", async (e) => {
  e.preventDefault(); vpwrap.classList.remove("drop"); document.getElementById("dropmark").style.display = "none";
  const at = CT.groundHit(st.scene, vp.rayAt(e.clientX, e.clientY), null);
  const key = e.dataTransfer.getData("text/wb-asset") || dragKey; dragKey = null;
  if (key) { addThing(key, at); return; }
  for (const f of Array.from(e.dataTransfer.files || [])) {   // model files or images dropped from Finder / Explorer
    const ext = f.name.split(".").pop().toLowerCase(), buf = await f.arrayBuffer();
    if (["obj", "stl", "glb", "gltf"].includes(ext)) importModelData(f.name, buf, at);
    else if (["png", "jpg", "jpeg", "webp"].includes(ext)) { const h = vp.pick(e.clientX, e.clientY), o = h ? h.obj : hasSel() ? st.sel : null; if (o && o.type !== "light") { o.img = await decodeImage(f.name, buf); select(o); commit(); setStatus("Surface image on " + ED.label(o).toLowerCase()); } else setStatus("Drop the image onto an object to wrap it.", true); }
  }
});

// ---- files
async function importModelData(name, buf, at) {
  try { const m = ED.parseModel(name, buf), o = ED.addMesh(st.scene, m, "Matte"); if (at) CT.placeAt(st.scene, o, at.x, at.z, true); select(o); commit(); setStatus("Imported " + name + " (" + m.tris.toLocaleString() + " triangles)"); }
  catch (err) { setStatus(String(err.message || err), true); }
}
async function importModel() {
  const p = await ipcRenderer.invoke("dlg:open", { title: "Import model", filters: [{ name: "3D models", extensions: ["glb", "gltf", "obj", "stl"] }] }); if (!p) return;
  const b = await ipcRenderer.invoke("fs:read", p[0]); importModelData(req("path").basename(p[0]), b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
async function decodeImage(name, buf, max) {
  max = max || 1024;
  const bmp = await createImageBitmap(new Blob([buf])), k = Math.min(1, max / Math.max(bmp.width, bmp.height)), w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(bmp, 0, 0, w, h);
  return { w, h, d: new Uint8Array(g.getImageData(0, 0, w, h).data.buffer), name };
}
async function loadTexture() {
  if (!hasSel()) return;
  const p = await ipcRenderer.invoke("dlg:open", { title: "Surface image", filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }] }); if (!p) return;
  const b = await ipcRenderer.invoke("fs:read", p[0]); st.sel.img = await decodeImage(req("path").basename(p[0]), b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); edited(); setStatus("Surface image: " + st.sel.img.name);
}
// ---- surface layers: pictures, masks and presets
async function pickPicture(title) {
  const p = await ipcRenderer.invoke("dlg:open", { title, filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }] }); if (!p) return null;
  const b = await ipcRenderer.invoke("fs:read", p[0]); return decodeImage(req("path").basename(p[0]), b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
async function loadLayerPicture(asNew) {
  if (!hasSel() || st.sel.type === "light") return; const img = await pickPicture("Layer picture"); if (!img) return;
  if (asNew || !hasLay()) refs.layOps.add([SF.layer({ name: img.name.replace(/\.\w+$/, "").slice(0, 30), img, wrap: st.sel.type === "mesh" && st.sel.mesh.uv ? "UV" : "Box" })]);
  else { st.lay.img = img; edited(); }
  setStatus("Layer picture: " + img.name);
}
async function loadLayerMask() { if (!hasLay()) return; const img = await pickPicture("Mask picture (white shows the layer)"); if (!img) return; st.lay.mimg = img; st.lay.mask = "Bitmap"; edited(); }
async function addPreset(name, saved) {
  if (!hasSel() || st.sel.type === "light") return;
  let Ls;
  if (saved) { const j = JSON.parse(await ipcRenderer.invoke("surf:load", name)); Ls = j.layers.map((L) => SF.layer(Object.assign({}, L, { id: undefined, img: S.unpic(L.img), mimg: S.unpic(L.mimg) }))); Ls.forEach((L) => { L.id = SF.layer().id; }); }
  else Ls = SF.preset(name);
  refs.layOps.add(Ls); setStatus("Added surface preset: " + name);
}
async function saveLayerPreset(name) {
  if (!hasSel() || !(st.sel.layers || []).length) return;
  name = String(name || "").trim() || (st.sel.layers[0].name + " stack");
  const json = JSON.stringify({ worldsBrewLayers: 1, layers: st.sel.layers.map((L) => Object.assign({}, L, { img: S.pic(L.img), mimg: S.pic(L.mimg) })) });
  const n = await ipcRenderer.invoke("surf:save", name, json); await refs.fillPresets(); setStatus("Saved surface preset: " + n);
}
async function askSave() {
  if (!dirty) return true;
  const r = await ipcRenderer.invoke("dlg:ask", { message: "Save changes to " + (st.scene.name || "this scene") + "?", detail: "Your changes are lost if you don't save them.", buttons: ["Save", "Don't Save", "Cancel"] });
  if (r === 2) return false; if (r === 0) return await save(false); return true;
}
async function save(as) {
  let p = filePath;
  if (!p || as) { p = await ipcRenderer.invoke("dlg:save", { title: "Save scene", name: (st.scene.name || "Untitled").replace(/[^\w\- ]+/g, "") + ".wbscene" }); if (!p) return false; }
  const name = req("path").basename(p).replace(/\.(wbscene|json)$/i, ""); st.scene.name = name;
  await ipcRenderer.invoke("fs:write", p, S.toJSON(st.scene)); filePath = p; dirty = false; title(); setStatus("Saved " + req("path").basename(p)); return true;
}
async function openScene(p) {
  if (!(await askSave())) return;
  if (!p) { const r = await ipcRenderer.invoke("dlg:open", { title: "Open scene" }); if (!r) return; p = r[0]; }
  try { const b = await ipcRenderer.invoke("fs:read", p), sc = S.fromJSON(new TextDecoder().decode(b)); sc.name = sc.name || req("path").basename(p).replace(/\.\w+$/, ""); loadScene(sc, p); CT.frame(st.scene); changed("view"); setStatus("Opened " + req("path").basename(p)); }
  catch (err) { setStatus("Could not open that file: " + (err.message || err), true); }
}
async function newScene() { if (!(await askSave())) return; loadScene(BLANK()); setStatus("New scene. Drag shapes and models in from the Library."); }

// ---- render to PNG (the full-quality CPU ray tracer)
// hand control back to the window for a moment. A message (not setTimeout) so the browser can't throttle it to once a second
const yieldNow = () => new Promise((res) => { const ch = new MessageChannel(); ch.port1.onmessage = () => { ch.port1.close(); res(); }; ch.port2.postMessage(0); });
async function renderNow() {
  if (rendering) { cancelReq = true; return; }
  const W = Math.max(16, Math.min(8000, Math.round(st.out.w))), H = Math.max(16, Math.min(8000, Math.round(st.out.h))), gpu = st.out.engine !== "ray", q = st.out.quality;
  const what = (gpu ? "GPU " : "Ray traced ") + (q === "final" ? "Final" : "Draft") + " " + W + " x " + H;
  rendering = true; cancelReq = false; refs.go.textContent = gpu ? "Rendering..." : "Cancel render"; refs.meter.run(); setStatus("Rendering " + what + "..."); refs.led.set("busy");
  const t0 = performance.now(); vp.paused = true;   // the live view rests while a render runs
  try {
    const r = gpu ? await renderGPU(st.scene, st.scene.cam, W, H, { quality: q, passes: true }, { status: (t) => { refs.status.textContent = what + ": " + t; } })
      : await E.render(st.scene, st.scene.cam, W, H, { aa: q === "final" ? 2 : 1, passes: true, slice: 400 }, { yield: (p) => { refs.status.textContent = "Rendering " + what + "...  " + Math.round(p * 100) + "%"; return yieldNow(); }, cancelled: () => cancelReq });
    if (!r) { refs.meter.idle(); setStatus("Render cancelled"); return; }
    const secs = (performance.now() - t0) / 1000; refs.lastRender = r; refs.lastSecs = secs; refs.meter.done(secs);
    refs.lastMeta = { scene: st.scene.name || "Scene", w: W, h: H, engine: gpu ? "gpu" : "ray", quality: q, app: VERSION };
    showShot(r, W, H, what); setStatus("Rendered " + what + " in " + secs.toFixed(1) + " s");
    if (st.out.autoSend) await sendToPhotoshop();
  } catch (err) { refs.meter.idle(); setStatus("Render failed: " + (err.message || err), true); }
  finally { rendering = false; vp.paused = false; vp.dirty = true; refs.go.textContent = "Render PNG"; refs.led.set("ready"); }
}
// ---- Photoshop bridge: renders go to Documents/Worlds Lab; the Bridge panel in Photoshop places them
async function sendToPhotoshop() {
  if (!refs.lastPics) { await renderNow(); if (!refs.lastPics || st.out.autoSend) return; }
  try {
    const r = await BR.sendRender(refs.lastPics, refs.lastMeta); refs.lastSent = r;
    setStatus("Sent to Photoshop: " + r.info.scene + " (" + r.info.w + " x " + r.info.h + "). In Photoshop, press Place as layer in the Worlds Lab Bridge panel.");
  } catch (err) { setStatus("Couldn't send to Photoshop: " + (err.message || err), true); }
}
function applyDocSize(j) {
  st.out.w = j.w; st.out.h = j.h; uis.forEach((u) => u.refreshAll()); placeFrameGuide();
  setStatus("Output matched to the Photoshop document" + (j.doc ? " " + j.doc : "") + ": " + j.w + " x " + j.h);
}
async function usePhotoshopPicture(asNew) {
  const p = refs.psPic; if (!p || !hasSel() || st.sel.type === "light") return;
  try { const img = await BR.loadPicture(p);
    if (asNew || !hasLay()) refs.layOps.add([SF.layer({ name: img.name.slice(0, 30), img, wrap: st.sel.type === "mesh" && st.sel.mesh.uv ? "UV" : "Box" })]); else { st.lay.img = img; edited(); }
    setStatus("Surface picture from Photoshop: " + img.name);
  } catch (err) { setStatus("Couldn't read the Photoshop picture: " + (err.message || err), true); }
}

// the finished render with its passes: view each one, save the one shown or all of them
function showShot(res, W, H, what) {
  const box = document.getElementById("shot"), img = document.getElementById("shotimg"), row = box.querySelector(".shotrow"); clear(row);
  const pics = passPictures(res, { depth: true, mask: true, sky: true }), pngs = new Map();
  const png = (p) => { if (!pngs.has(p)) pngs.set(p, PNG.encodePNG(p.rgba, W, H, 4)); return pngs.get(p); };
  let cur = pics[0]; refs.lastPng = png(pics[0]); refs.lastPics = pics.map((p) => ({ name: p.name, rgba: p.rgba, get png() { return png(p); } }));
  const b = (l, fn, cls) => { const x = el("button", { class: cls || "btn", text: l }); x.addEventListener("click", fn); return x; };
  const tabs = pics.map((p) => { const x = b(p.name, () => show(p), "btn small"); x.__p = p; return x; });
  function show(p) { cur = p; img.src = PNG.dataURL(p.rgba, W, H, 4); tabs.forEach((t) => t.classList.toggle("on", t.__p === p)); }
  const base = (st.scene.name || "render").replace(/[^\w\- ]+/g, "");
  const suffix = (p) => (p === pics[0] ? "" : "-" + p.name.toLowerCase().replace(/\s+/g, "-"));
  row.appendChild(el("span", { class: "lbl3", text: what + "  PNG" })); tabs.forEach((t) => row.appendChild(t));
  row.appendChild(b("Save PNG...", async () => { const p = await ipcRenderer.invoke("dlg:save", { title: "Save " + cur.name.toLowerCase(), name: base + suffix(cur) + ".png", filters: [{ name: "PNG image", extensions: ["png"] }] }); if (!p) return; await ipcRenderer.invoke("fs:write", p, png(cur)); setStatus("Saved " + req("path").basename(p)); }));
  row.appendChild(b("Save all passes...", async () => { const p = await ipcRenderer.invoke("dlg:save", { title: "Save the render and its passes", name: base + ".png", filters: [{ name: "PNG image", extensions: ["png"] }] }); if (!p) return;
    const stem = p.replace(/\.png$/i, ""); for (const q of pics) await ipcRenderer.invoke("fs:write", stem + suffix(q) + ".png", png(q)); setStatus("Saved " + pics.length + " PNGs: " + req("path").basename(stem) + "*.png"); }));
  row.appendChild(b("Send to Photoshop", () => sendToPhotoshop()));
  row.appendChild(b("Close", () => { box.hidden = true; }));
  show(pics[0]); box.hidden = false;
}

// ---- UI building blocks
const btn = (l, fn, t, cls) => { const b = el("button", { class: cls || "btn small", text: l, title: t || "" }); b.addEventListener("click", fn); return b; };
// a button that repeats while held
function holdBtn(label, fn, title) {
  const b = el("button", { class: "btn wbpadbtn", text: label, title: title || "" }); let t = null, n = 0;
  const stop = () => { if (t) { clearTimeout(t); t = null; if (n) { commit(); changed("val"); } } };
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); n = 0; const go = () => { fn(); n++; changed("drag"); t = setTimeout(go, n === 1 ? 380 : 70); }; go(); });
  ["pointerup", "pointerleave", "pointercancel"].forEach((k) => b.addEventListener(k, stop));
  return b;
}
const gap = () => el("div", {});
function cross(cap, l, r, u, d, extra) { return el("div", { class: "wbcross" }, [gap(), u, gap(), l, extra || gap(), r, gap(), d, gap(), el("div", { class: "wbcap", text: cap })]); }

// ---- header
function buildTop(ui) {
  const top = document.getElementById("top"), h = ui.brand.header({ title: APP, code: CODE }); refs.led = h; h.node.classList.add("slim");
  refs.docName = el("span", { class: "docname" });
  top.appendChild(h.node);
  top.appendChild(el("div", { class: "menu" }, [refs.docName, btn("New", () => newScene()), btn("Open...", () => openScene()), btn("Save", () => save(false)), btn("Save as...", () => save(true)),
    btn("Import model...", () => importModel(), "Add a .glb, .gltf, .obj or .stl model"), btn("Undo", () => undo()), btn("Redo", () => redo()),
    btn("Send to Photoshop", () => sendToPhotoshop(), "Send the last render (or render now) with its passes; the Worlds Lab Bridge panel in Photoshop places it as a layer group"),
    ui.brand.toggle("Auto-send", "out.autoSend")]));
}

// ---- library: scenes, add (drag and drop), objects
function buildLibrary(ui) {
  const lib = document.getElementById("lib"), { card, segGroup, row, bind, showIf } = ui;
  const list = Object.keys(S.PRESETS).map((name) => ["Classic", name]);
  PK.PACKS.forEach((pk) => Object.keys(PK.MAPS[pk]).forEach((name) => list.push([pk, name])));
  const cells = list.map(([pk, name]) => {
    const img = el("img", {}), c = el("div", { class: "wbcell", title: "Load " + name }, [img, el("div", { class: "wbname", text: name })]);
    c.addEventListener("click", async () => { if (!(await askSave())) return; loadScene(pk === "Classic" ? S.loadPreset(name) : PK.loadMap(pk, name)); setStatus("Loaded " + name); });
    c.__pk = pk; c.__name = name; c.__img = img; showIf(c, () => st.view.libPack === pk); return c;
  });
  refs.cells = cells;
  bind(() => cells.forEach((c) => c.classList.toggle("on", c.__name === st.scene.name)));
  lib.appendChild(card("Scenes", [row("", segGroup("view.libPack", [{ v: "Classic", l: "Classic" }].concat(PK.PACKS.map((p) => ({ v: p, l: p }))))), el("div", { class: "wbgrid" }, cells)]));
  // add tiles
  const tiles = [];
  const tile = (key, label, pack) => {
    const img = el("img", {}), t = el("div", { class: "wbtile", draggable: "true", title: label + ": drag into the view, or click to add in front of the camera" }, [img, el("div", { text: label })]);
    t.addEventListener("dragstart", (e) => { dragKey = key; e.dataTransfer.setData("text/wb-asset", key); e.dataTransfer.effectAllowed = "copy"; try { e.dataTransfer.setDragImage(img, 28, 28); } catch (err) { /* ok */ } });
    t.addEventListener("click", () => addThing(key)); t.__key = key; t.__img = img; t.__pack = pack; showIf(t, () => st.view.addPack === pack); tiles.push(t); return t;
  };
  const grid = el("div", { class: "wbtiles" });
  SHAPES.forEach(([k, l]) => grid.appendChild(tile("shape:" + k, l, "Shapes")));
  PK.PACKS.forEach((pk) => PK.assets(pk).forEach((a) => grid.appendChild(tile("asset:" + a.id, a.name, pk))));
  refs.tiles = tiles;
  const count = el("div", { class: "hint" }); bind(() => { count.textContent = tiles.filter((t) => t.__pack === st.view.addPack).length + " items. Drag one into the view, or click it."; });
  lib.appendChild(card("Add", [row("", segGroup("view.addPack", [{ v: "Shapes", l: "Shapes" }].concat(PK.PACKS.map((p) => ({ v: p, l: p }))))), count, grid]));
  refs.objList = el("div", { class: "wbobjs" });
  lib.appendChild(card("Objects", [refs.objList, el("div", { class: "hint", text: "Click to select. Tab / Shift-Tab steps through, Esc deselects, Delete removes." })]));
}
function refreshObjList() {
  const box = refs.objList; if (!box) return;
  const objs = st.scene.objs, sig = objs.map((o) => o.id).join(",") + "|" + (hasSel() ? st.sel.id : "");
  if (box.__sig === sig) return; box.__sig = sig; clear(box);
  objs.forEach((o) => { const r = el("div", { class: "wbobj" + (o === st.sel ? " on" : "") }, [el("span", { text: o.type === "mesh" ? (o.mesh.name || "Model") : o.type[0].toUpperCase() + o.type.slice(1) }), el("span", { class: "k", text: "#" + o.id })]); r.addEventListener("click", () => select(o)); box.appendChild(r); });
  if (!objs.length) box.appendChild(el("div", { class: "hint", text: "Nothing in the scene yet." }));
}
// library pictures, drawn on the GPU a few at a time so the window stays responsive
async function drawLibrary() {
  const wait = () => new Promise((r) => setTimeout(r, 0));
  for (const t of refs.tiles) {
    const [kind, id] = t.__key.split(":"); let sc, cam;
    if (kind === "shape") { [sc, cam] = ED.iconScene(id); }
    else { sc = { sky: "Noon", sunAz: 210, sunAlt: 40, haze: 0, fog: 0, fogH: 1, clouds: 0, water: false, ground: false, waterLvl: 0, objs: [PK.put(id, 0, 0, 1)], cam: { yaw: 28, pitch: 16, dist: 5, fov: 40, tx: 0, ty: 0, tz: 0 } }; CT.frame(sc); sc.cam.dist *= 0.8; cam = sc.cam; }
    t.__img.src = snapshot(S.withDefaults(sc), cam, 112, 112); await wait();
  }
  for (const c of refs.cells) { const sc = c.__pk === "Classic" ? S.loadPreset(c.__name) : PK.loadMap(c.__pk, c.__name); c.__img.src = snapshot(sc, sc.cam, 242, 136); await wait(); }
}

// ---- control pads under the view
function buildPads(ui) {
  const pad = document.getElementById("pad"), sc = () => st.scene, step = () => CT.STEP[st.view.step] || CT.STEP.med, sel = () => (hasSel() ? st.sel : null);
  const onSel = (fn) => () => { const o = sel(); if (o) fn(o); };
  const nudge = (dir) => onSel((o) => CT.nudge(sc(), o, dir, st.view.step, st.view.stick));
  const objPad = el("div", { class: "wbpad" }, [
    el("div", { class: "wbpadtitle ctitle", text: "OBJECT" }),
    el("div", { class: "wbprow" }, [
      cross("MOVE", holdBtn("<", nudge("left"), "Left (camera relative)"), holdBtn(">", nudge("right"), "Right"), holdBtn("^", nudge("fwd"), "Away from camera"), holdBtn("v", nudge("back"), "Towards camera")),
      el("div", { class: "wbcol" }, [holdBtn("UP", nudge("up"), "Raise (Page Up)"), holdBtn("DN", nudge("down"), "Lower (Page Down)"), el("div", { class: "wbcap", text: "HEIGHT" })]),
      el("div", { class: "wbcol" }, [holdBtn("<)", onSel((o) => CT.spin(o, -1, st.view.step)), "Spin left ( [ )"), holdBtn("(>", onSel((o) => CT.spin(o, 1, st.view.step)), "Spin right ( ] )"), el("div", { class: "wbcap", text: "SPIN" })]),
      el("div", { class: "wbcol" }, [holdBtn("+", onSel((o) => CT.grow(sc(), o, 1, st.view.step, st.view.stick)), "Bigger ( = )"), holdBtn("-", onSel((o) => CT.grow(sc(), o, -1, st.view.step, st.view.stick)), "Smaller ( - )"), el("div", { class: "wbcap", text: "SIZE" })])
    ]),
    el("div", { class: "wbprow" }, [ui.segGroup("view.step", [{ v: "fine", l: "Fine" }, { v: "med", l: "Medium" }, { v: "big", l: "Big" }]), ui.brand.toggle("Stick to ground", "view.stick")])
  ]);
  const cam = (fn) => () => { if (st.view.camLock) return; fn(sc().cam); };
  const camPad = el("div", { class: "wbpad" }, [
    el("div", { class: "wbpadtitle ctitle", text: "CAMERA" }),
    el("div", { class: "wbprow" }, [
      cross("ORBIT", holdBtn("<", cam((c) => CT.camOrbit(c, step().orbit, 0))), holdBtn(">", cam((c) => CT.camOrbit(c, -step().orbit, 0))), holdBtn("^", cam((c) => CT.camOrbit(c, 0, step().orbit))), holdBtn("v", cam((c) => CT.camOrbit(c, 0, -step().orbit)))),
      cross("PAN", holdBtn("<", cam((c) => CT.camPan(c, -step().move * 2, 0))), holdBtn(">", cam((c) => CT.camPan(c, step().move * 2, 0))), holdBtn("^", cam((c) => CT.camPan(c, 0, step().move * 2))), holdBtn("v", cam((c) => CT.camPan(c, 0, -step().move * 2)))),
      el("div", { class: "wbcol" }, [holdBtn("UP", cam((c) => CT.camPan(c, 0, 0, step().move))), holdBtn("DN", cam((c) => CT.camPan(c, 0, 0, -step().move))), el("div", { class: "wbcap", text: "RAISE" })]),
      el("div", { class: "wbcol" }, [holdBtn("+", cam((c) => CT.camZoom(c, step().zoom)), "Zoom in"), holdBtn("-", cam((c) => CT.camZoom(c, 1 / step().zoom)), "Zoom out"), el("div", { class: "wbcap", text: "ZOOM" })])
    ]),
    el("div", { class: "wbprow" }, CT.VIEWS.map(([v, l]) => btn(l, () => { CT.camView(sc().cam, v); changed("view"); }))),
    el("div", { class: "wbprow" }, [btn("Frame all", () => { CT.frame(sc()); changed("view"); }, "A"), btn("Frame selected", () => { if (hasSel()) { CT.frame(sc(), st.sel); changed("view"); } }, "F"), btn("Home", () => { if (homeCam) { CT.camSet(sc().cam, homeCam); changed("view"); } }, "H"),
      ...camSlots.map((_, i) => { const b = btn("View " + (i + 1), () => { if (camSlots[i]) { CT.camSet(sc().cam, camSlots[i]); changed("view"); setStatus("View " + (i + 1)); } else { camSlots[i] = CT.camCopy(sc().cam); b.classList.add("on"); setStatus("Saved this view as View " + (i + 1) + " (Alt-click to overwrite)"); } }, "Click to save, then click to return. Alt-click overwrites.");
        b.addEventListener("click", (e) => { if (e.altKey) { camSlots[i] = CT.camCopy(sc().cam); b.classList.add("on"); } }); return b; }),
      ui.brand.toggle("Lock camera", "view.camLock")])
  ]);
  pad.appendChild(objPad); pad.appendChild(camPad);
}
function buildToolbar(ui) {
  const tb = document.getElementById("toolbar");
  tb.appendChild(el("span", { class: "lbl3", text: "TOOL" }));
  tb.appendChild(ui.segGroup("view.gizmo", [{ v: "move", l: "Move  W" }, { v: "rotate", l: "Rotate  E" }, { v: "scale", l: "Scale  R" }, { v: "sculpt", l: "Sculpt  B" }]));
  const sel = el("span", { class: "docname" }); ui.bind(() => { sel.textContent = ED.label(hasSel() ? st.sel : null); }); tb.appendChild(sel);
}

// ---- Inspector
const LIGHT_SW = [["Warm", "#FFC27A"], ["White", "#FFFFFF"], ["Cool", "#9CC8FF"], ["Mint", "#5EFFC8"], ["Pink", "#FF4FD8"], ["Red", "#FF4A3D"], ["Amber", "#FFB000"], ["Violet", "#A070FF"]];
const WATER_SW = [["Deep", "#05171F"], ["Ocean", "#0A3A5C"], ["Tropic", "#0FA3A0"], ["Lagoon", "#2BD9B0"], ["Swamp", "#2E3B1A"], ["Ink", "#020308"]];
const WATER_LOOKS = { Calm: { waveH: 0, ripple: 0.4, foam: 0, clarity: 10, waterRefl: 110 }, Lake: { waveH: 0.08, waveSize: 1.5, ripple: 1, foam: 10, clarity: 30, waterRefl: 100 }, Sea: { waveH: 0.35, waveSize: 2.2, ripple: 1.4, foam: 35, clarity: 15, waterRefl: 100 }, Storm: { waveH: 0.9, waveSize: 3, ripple: 2.4, foam: 70, clarity: 0, waterRefl: 80 } };
function buildInspector(ui) {
  const box = document.getElementById("insp"), { card, sliderRow, segGroup, selectRow, checkRow, showIf, bind, row } = ui;
  const only = (node, fn) => { showIf(node, fn); return node; };
  const none = (text) => only(el("div", { class: "hint", text }), () => !hasSel());
  const matOpts = Object.keys(S.MATS).map((m) => ({ v: m, l: m }));
  const notLight = () => hasSel() && st.sel.type !== "light";
  const objCard = card("Object", [
    none("Click an object in the view, or drag one in from the Library."),
    only(el("div", { class: "row wrap" }, [sliderRow("Left/right", "sel.x", -60, 60, 0.1, ""), sliderRow("Height", "sel.y", -5, 40, 0.1, ""), sliderRow("Back/front", "sel.z", -80, 60, 0.1, "")]), hasSel),
    only(el("div", { class: "row wrap" }, [sliderRow("Spin", "sel.ry", 0, 359, 1, " deg")]), notLight),
    only(selectRow("Material", "sel.mat", matOpts, () => { st.sel.refl = null; }), notLight),
    only(el("div", { class: "row wrap" }, [btn("Drop to ground", () => { CT.rest(st.scene, st.sel); edited(); }), btn("Frame", () => { CT.frame(st.scene, st.sel); changed("view"); }), btn("Duplicate", () => { select(ED.duplicate(st.scene, st.sel)); commit(); }), btn("Delete", () => { ED.remove(st.scene, st.sel); select(null); commit(); })]), hasSel)
  ]);
  // Scale: overall size, width / height / depth stretch with a proportion lock, real-world size, quick sizes, match
  const sizeLine = el("div", { class: "wbsize" }); bind(() => { sizeLine.textContent = notLight() ? SC.sizeText(st.sel) : ""; });
  const realIn = el("input", { type: "text", class: "num wide", title: "Height in metres", "data-key": "sel.realH" }); bind(() => { if (document.activeElement !== realIn && notLight()) realIn.value = String(SC.dims(st.sel).h); });
  realIn.addEventListener("change", () => { const v = parseFloat(realIn.value); if (v > 0 && notLight()) { SC.setHeight(st.scene, st.sel, v, st.view.stick); edited(); } });
  const matchSel = el("select", { "data-key": "sel.match" }); bind(() => { clear(matchSel); matchSel.appendChild(el("option", { value: "", text: "Match size of..." })); st.scene.objs.forEach((o) => { if (o !== st.sel && o.type !== "light") matchSel.appendChild(el("option", { value: String(o.id), text: (o.type === "mesh" ? o.mesh.name : o.type) + " #" + o.id })); }); });
  matchSel.addEventListener("change", () => { const t = st.scene.objs.find((o) => String(o.id) === matchSel.value); if (t && notLight()) { SC.match(st.scene, st.sel, t, st.view.stick); edited(); setStatus("Matched the height of " + ED.label(t).toLowerCase()); } matchSel.value = ""; });
  const scaleCard = card("Scale", [
    none("Select an object to size it."),
    only(sizeLine, notLight),
    only(el("div", { class: "row wrap" }, [sliderRow("Size", "sel.s", 0.05, 40, 0.05, "")]), () => notLight() && st.sel.type !== "terrain"),
    only(el("div", { class: "row wrap" }, [sliderRow("Width", "sel.sx", 0.1, 10, 0.01, "x"), sliderRow("Height", "sel.sy", 0.1, 10, 0.01, "x"), sliderRow("Depth", "sel.sz", 0.1, 10, 0.01, "x")]), () => notLight() && st.sel.type !== "terrain"),
    only(el("div", { class: "row wrap" }, [sliderRow("Footprint", "sel.s", 0.5, 60, 0.1, ""), sliderRow("Peak", "sel.h", 0.2, 30, 0.1, "")]), is("terrain")),
    only(ui.brand.toggle("Lock proportions", "view.lockScale"), () => notLight() && st.sel.type !== "terrain"),
    only(row("Real height", realIn, el("span", { class: "lbl3", text: " m" })), notLight),
    only(el("div", { class: "row wrap" }, SC.REAL.map(([l, m]) => btn(l, () => { SC.setHeight(st.scene, st.sel, m, st.view.stick); edited(); setStatus(l + " height: " + m + " m"); }, m + " m tall"))), notLight),
    only(el("div", { class: "row wrap" }, [btn("x0.5", () => { SC.mul(st.scene, st.sel, 0.5, st.view.stick); edited(); }), btn("x0.9", () => { SC.mul(st.scene, st.sel, 0.9, st.view.stick); edited(); }), btn("x1.1", () => { SC.mul(st.scene, st.sel, 1.1, st.view.stick); edited(); }), btn("x2", () => { SC.mul(st.scene, st.sel, 2, st.view.stick); edited(); }),
      btn("Reset stretch", () => { SC.resetStretch(st.scene, st.sel, st.view.stick); edited(); }), btn("Fit to ground", () => { CT.rest(st.scene, st.sel); edited(); })]), notLight),
    only(row("", matchSel), notLight),
    only(el("div", { class: "hint", text: "1 unit = 1 metre. Or press R and drag the handles in the view: the centre box scales evenly, the coloured boxes stretch one side." }), notLight)
  ]);
  const surf = () => hasSel() && st.sel.type !== "terrain" && st.sel.type !== "light";
  const texName = el("span", { class: "lbl2" }); bind(() => { texName.textContent = surf() && st.sel.img ? "IMAGE  " + String(st.sel.img.name || "").slice(0, 22).toUpperCase() : "NO IMAGE"; });
  const matCard = card("Material", [
    none("Select an object to edit its surface."),
    only(el("div", { class: "hint", text: "Terrains colour themselves by height and slope: sand at the water, grass, rock and snow on the peaks." }), is("terrain")),
    only(selectRow("Preset", "sel.mat", matOpts, () => { st.sel.refl = null; }), surf),
    only(row("Pattern", segGroup("sel.pat", ["None", "Marble", "Wood", "Grid", "Noise"].map((p) => ({ v: p, l: p })))), surf),
    only(el("div", { class: "row wrap" }, [sliderRow("Hue", "sel.hue", 0, 359, 1, " deg"), sliderRow("Tex scale", "sel.ts", 0.1, 5, 0.05, "x"), sliderRow("Bump", "sel.bump", 0, 1, 0.01, "")]), surf),
    only(el("div", { class: "lbl3", text: "SURFACE IMAGE" }), surf),
    only(el("div", { class: "row wrap" }, [texName, btn("Load image...", () => loadTexture(), "Wrap a PNG / JPG of your own around this object"), only(btn("Remove", () => { st.sel.img = null; edited(); }), () => surf() && !!st.sel.img)]), surf),
    only(el("div", { class: "hint", text: "Tip: drop a PNG or JPG from Finder straight onto an object in the view." }), surf)
  ]);
  const triLine = el("div", { class: "lbl3" }); bind(() => { triLine.textContent = is("mesh")() ? String(st.sel.mesh.name).toUpperCase() + "  -  " + st.sel.mesh.tris.toLocaleString() + " TRIANGLES" : ""; });
  const meshCard = card("Mesh", [
    triLine, checkRow("Smooth shading", "sel.smooth"),
    only(checkRow("Model colours", "sel.vc"), () => is("mesh")() && !!st.sel.mesh.tc),
    el("div", { class: "row wrap" }, [sliderRow("Displace", "sel.disp", 0, 0.4, 0.01, "")]),
    el("div", { class: "row wrap" }, [btn("Stand upright", () => { const M = req("../engine/models.js"); st.sel.mesh = M.upright(st.sel.mesh); st.sel._mk = null; ED.dropToGround(st.scene, st.sel); edited(); }, "For Z-up files (3D-print exports)"), btn("Import model...", () => importModel())])
  ]);
  showIf(meshCard, is("mesh"));
  const shapeCard = card("Shape", [
    el("div", { class: "lbl3", text: "SURFACE" }),
    el("div", { class: "row wrap" }, [sliderRow("Peak", "sel.h", 0.5, 30, 0.1, ""), sliderRow("Roughness", "sel.rough", 0.3, 0.75, 0.01, ""), sliderRow("Erosion", "sel.erosion", 0, 8, 1, "")]),
    el("div", { class: "row wrap" }, [sliderRow("Terraces", "sel.terrace", 0, 14, 1, ""), sliderRow("Plateau", "sel.plateau", 0, 0.8, 0.01, ""), sliderRow("Sharpness", "sel.sharp", 0.4, 3, 0.05, "")]),
    el("div", { class: "row wrap" }, [sliderRow("Shape", "sel.seed", 0, 99, 1, "")]),
    checkRow("Crater (bowl with a rim)", "sel.crater"),
    el("div", { class: "row wrap" }, [btn("New shape", () => { st.sel.seed = Math.floor(Math.random() * 100); edited(); }), btn("Undo stroke", () => { if (st.sel._undo !== undefined) { st.sel.sculpt = st.sel._undo; st.sel._undo = undefined; st.sel.sculptV++; edited(); } }), btn("Clear sculpting", () => { ED.clearSculpt(st.sel); edited(); })]),
    el("div", { class: "lbl3", text: "BRUSH" }),
    el("div", { class: "row wrap" }, [segGroup("view.brush", ED.BRUSHES.map(([v, l]) => ({ v, l })))]),
    el("div", { class: "row wrap" }, [sliderRow("Brush size", "view.bsize", 0.03, 0.4, 0.01, ""), sliderRow("Strength", "view.bpow", 0.05, 1, 0.05, "")]),
    el("div", { class: "row wrap" }, [btn("Sculpt in the view (B)", () => { st.view.gizmo = "sculpt"; changed("view"); setStatus("Sculpt: drag on the terrain."); })])
  ]);
  showIf(shapeCard, is("terrain"));
  const swatchBtn = (l, hex, set, t) => { const b = el("button", { class: "btn small wbsw", title: t || hex }, [el("span", { class: "wbdot", style: { backgroundColor: hex } }), el("span", { text: l })]); b.addEventListener("click", () => { set(hex); edited(); }); return b; };
  const lightSel = () => (is("light")() ? st.sel : null);
  const lightCard = card("Light", [
    el("div", { class: "lbl3", text: "SUN" }),
    el("div", { class: "row wrap" }, [sliderRow("Sun angle", "scene.sunAz", 0, 359, 1, " deg"), sliderRow("Sun height", "scene.sunAlt", -5, 85, 1, " deg")]),
    el("div", { class: "row wrap" }, [sliderRow("Sun bright", "scene.sunPow", 0, 300, 1, "%"), sliderRow("Sky light", "scene.ambPow", 0, 300, 1, "%")]),
    row("Sun colour", ui.hexField(() => st.scene.sunCol || "", (v) => { st.scene.sunCol = v; }, true)),
    el("div", { class: "row wrap" }, [swatchBtn("Sky", "", (v) => { st.scene.sunCol = v; }, "The sky's own sun colour")].concat(LIGHT_SW.map(([l, h]) => swatchBtn(l, h, (v) => { st.scene.sunCol = v; })))),
    el("div", { class: "lbl3", text: "LIGHTS" }),
    el("div", { class: "row wrap" }, [btn("Add light", () => { select(ED.addObject(st.scene, "light")); commit(); }), btn("Next light", () => { const L = st.scene.objs.filter((o) => o.type === "light"); if (L.length) select(L[(L.indexOf(st.sel) + 1) % L.length]); })]),
    only(el("div", { class: "hint", text: "Select a light (or add one) to set its colour, brightness and reach." }), () => !lightSel()),
    only(row("Colour", ui.hexField(() => (lightSel() ? lightSel().col : "#FFFFFF"), (v) => { if (lightSel()) lightSel().col = v; })), () => !!lightSel()),
    only(el("div", { class: "row wrap" }, LIGHT_SW.map(([l, h]) => swatchBtn(l, h, (v) => { if (lightSel()) lightSel().col = v; }))), () => !!lightSel()),
    only(el("div", { class: "row wrap" }, [sliderRow("Brightness", "sel.pow", 0, 800, 5, "%"), sliderRow("Reach", "sel.range", 0.5, 40, 0.5, ""), sliderRow("Bulb size", "sel.s", 0.05, 1.5, 0.01, "")]), () => !!lightSel()),
    only(el("div", { class: "row wrap" }, [checkRow("Visible glow", "sel.glow"), checkRow("Casts shadows", "sel.shadow")]), () => !!lightSel())
  ]);
  const waterCard = card("Water", [
    checkRow("Water plane", "scene.water"),
    el("div", { class: "row wrap" }, Object.keys(WATER_LOOKS).map((k) => btn(k, () => { Object.assign(st.scene, WATER_LOOKS[k]); st.scene.water = true; edited(); setStatus(k + " water"); }))),
    el("div", { class: "row wrap" }, [sliderRow("Level", "scene.waterLvl", -3, 8, 0.05, ""), sliderRow("Wave height", "scene.waveH", 0, 1.5, 0.01, ""), sliderRow("Wave size", "scene.waveSize", 0.3, 4, 0.05, "")]),
    el("div", { class: "row wrap" }, [sliderRow("Wind", "scene.wind", 0, 359, 1, " deg"), sliderRow("Ripples", "scene.ripple", 0, 3, 0.05, ""), sliderRow("Foam", "scene.foam", 0, 100, 1, "%")]),
    el("div", { class: "row wrap" }, [sliderRow("Clarity", "scene.clarity", 0, 100, 1, "%"), sliderRow("Reflection", "scene.waterRefl", 0, 150, 1, "%")]),
    row("Colour", ui.hexField(() => st.scene.waterCol, (v) => { st.scene.waterCol = v; })),
    el("div", { class: "row wrap" }, WATER_SW.map(([l, h]) => swatchBtn(l, h, (v) => { st.scene.waterCol = v; })))
  ]);
  const skyCard = card("Sky", [
    row("", segGroup("scene.sky", Object.keys(S.SKIES).map((k) => ({ v: k, l: k })))),
    el("div", { class: "row wrap" }, [sliderRow("Haze", "scene.haze", 0, 100, 1, "%"), sliderRow("Clouds", "scene.clouds", 0, 100, 1, "%")]),
    el("div", { class: "row wrap" }, [sliderRow("Fog", "scene.fog", 0, 100, 1, "%"), sliderRow("Fog height", "scene.fogH", 0.2, 6, 0.1, "")]),
    checkRow("Ground plane", "scene.ground")
  ]);
  const camCard = card("Camera", [
    el("div", { class: "row wrap" }, [sliderRow("Orbit", "scene.cam.yaw", 0, 359, 1, " deg"), sliderRow("Tilt", "scene.cam.pitch", -10, 89, 1, " deg"), sliderRow("Distance", "scene.cam.dist", 2, 160, 0.5, "")]),
    el("div", { class: "row wrap" }, [sliderRow("Lens", "scene.cam.fov", 15, 100, 1, " deg"), sliderRow("Aim height", "scene.cam.ty", -5, 30, 0.1, "")]),
    el("div", { class: "hint", text: "Drag in the view: drag = orbit, right-drag = pan, wheel = zoom. The pads under the view move the camera in fixed steps." })
  ]);

  // Surfaces: a stack of picture layers over the base material (wrap, tile, blend, masks, relief, shine, glow, presets)
  const canLayer = () => hasSel() && st.sel.type !== "light";
  const layList = el("div", { class: "wbobjs wblayers" });
  bind(() => {
    const Ls = canLayer() ? st.sel.layers || [] : [], sig = (canLayer() ? st.sel.id : "-") + "|" + Ls.map((L) => L.id + (L.on ? "+" : "-") + L.name + (L.img ? L.img.name : "")).join(",") + "|" + st.view.layI;
    if (layList.__sig === sig) return; layList.__sig = sig; clear(layList);
    Ls.slice().reverse().forEach((L) => { const i = Ls.indexOf(L);   // top of the list = top of the stack
      const eye = el("button", { class: "btn small wbeye" + (L.on ? " on" : ""), text: L.on ? "ON" : "OFF", title: "Show / hide this layer" });
      eye.addEventListener("click", (e) => { e.stopPropagation(); L.on = !L.on; edited(); });
      const r = el("div", { class: "wbobj" + (i === st.view.layI ? " on" : "") }, [eye, el("span", { text: " " + L.name }), el("span", { class: "k", text: L.img ? String(L.img.name).slice(0, 14) : "no picture" })]);
      r.addEventListener("click", () => { st.view.layI = i; changed("val"); }); layList.appendChild(r); });
    if (!Ls.length) layList.appendChild(el("div", { class: "hint", text: "No layers yet. Add a preset or a picture of your own." }));
  });
  const layOps = { add: (Ls) => { st.sel.layers = (st.sel.layers || []).concat(Ls); st.view.layI = st.sel.layers.length - 1; edited(); },
    move: (d) => { const Ls = st.sel.layers, i = st.view.layI, j = i + d; if (!Ls || j < 0 || j >= Ls.length) return; [Ls[i], Ls[j]] = [Ls[j], Ls[i]]; st.view.layI = j; edited(); },
    remove: () => { const Ls = st.sel.layers; if (!Ls || !Ls.length) return; Ls.splice(st.view.layI, 1); st.view.layI = Math.max(0, st.view.layI - 1); edited(); },
    dup: () => { if (!hasLay()) return; const L = Object.assign({}, st.lay, { id: SF.layer().id, name: st.lay.name + " copy" }); st.sel.layers.splice(st.view.layI + 1, 0, L); st.view.layI++; edited(); } };
  refs.layOps = layOps;
  const presetSel = el("select", { "data-key": "lay.preset" }); const fillPresets = async () => { const saved = await ipcRenderer.invoke("surf:list").catch(() => []); clear(presetSel); presetSel.appendChild(el("option", { value: "", text: "Add a preset..." }));
    SF.presetNames().forEach((n) => presetSel.appendChild(el("option", { value: "b:" + n, text: n }))); saved.forEach((n) => presetSel.appendChild(el("option", { value: "s:" + n, text: "Saved: " + n }))); };
  fillPresets(); refs.fillPresets = fillPresets;
  presetSel.addEventListener("change", async () => { const v = presetSel.value; presetSel.value = ""; if (!v || !canLayer()) return; await addPreset(v.slice(2), v[0] === "s"); });
  const presetName = el("input", { type: "text", class: "num wide", placeholder: "Preset name", title: "Name for the saved stack", "data-key": "lay.presetName" });
  const laySeg = (path, opts) => segGroup(path, opts.map((v) => ({ v, l: v })));
  const lay = (node) => only(node, hasLay);
  const picName = el("span", { class: "lbl2" }); bind(() => { picName.textContent = hasLay() ? "PICTURE  " + String(st.lay.img ? st.lay.img.name : "none").slice(0, 20).toUpperCase() : ""; });
  const maskName = el("span", { class: "lbl2" }); bind(() => { maskName.textContent = hasLay() && st.lay.mask === "Bitmap" ? "MASK  " + String(st.lay.mimg ? st.lay.mimg.name : "none - load one").slice(0, 20).toUpperCase() : ""; });
  const nameIn = el("input", { type: "text", class: "num wide", title: "Layer name", "data-key": "lay.name" }); bind(() => { if (document.activeElement !== nameIn) nameIn.value = hasLay() ? st.lay.name : ""; });
  nameIn.addEventListener("change", () => { if (hasLay()) { st.lay.name = nameIn.value.slice(0, 40) || "Layer"; edited(); } });
  const psPicName = el("span", { class: "lbl2" }); bind(() => { psPicName.textContent = refs.psPic ? "FROM PHOTOSHOP  " + String(refs.psPic.name).slice(0, 18).toUpperCase() : ""; });
  const surfCard = card("Surfaces", [
    only(el("div", { class: "hint", text: "Select an object to give it surface layers." }), () => !canLayer()),
    only(layList, canLayer),
    only(el("div", { class: "row wrap" }, [presetSel, btn("Picture layer...", () => loadLayerPicture(true), "Add a layer with a PNG / JPG of your own")]), canLayer),
    only(el("div", { class: "row wrap" }, [psPicName, btn("New layer", () => usePhotoshopPicture(true), "Add a layer with the picture Photoshop sent"), only(btn("Use on this layer", () => usePhotoshopPicture(false)), hasLay)]), () => canLayer() && !!refs.psPic),
    only(el("div", { class: "hint", text: "Tip: in Photoshop, the Worlds Lab Bridge panel's Send layer button sends the active layer here as a picture." }), () => canLayer() && !refs.psPic),
    only(el("div", { class: "row wrap" }, [btn("Up", () => layOps.move(1), "Move the layer up the stack"), btn("Down", () => layOps.move(-1)), btn("Duplicate", () => layOps.dup()), btn("Delete", () => layOps.remove())]), () => canLayer() && hasLay()),
    lay(row("Name", nameIn)),
    lay(el("div", { class: "row wrap" }, [picName, btn("Change picture...", () => loadLayerPicture(false))])),
    lay(el("div", { class: "lbl3", text: "WRAP" })), lay(row("", laySeg("lay.wrap", SF.WRAPS))),
    lay(el("div", { class: "row wrap" }, [sliderRow("Tile", "lay.tile", 0.1, 20, 0.05, "x"), sliderRow("Turn", "lay.rot", 0, 359, 1, " deg"), sliderRow("Offset X", "lay.ox", -1, 1, 0.01, ""), sliderRow("Offset Y", "lay.oy", -1, 1, 0.01, "")])),
    lay(el("div", { class: "lbl3", text: "BLEND" })), lay(row("", laySeg("lay.blend", SF.BLENDS))),
    lay(el("div", { class: "row wrap" }, [sliderRow("Opacity", "lay.opacity", 0, 100, 1, "%")])),
    lay(el("div", { class: "lbl3", text: "MASK" })), lay(row("", laySeg("lay.mask", SF.MASKS))),
    only(el("div", { class: "row wrap" }, [sliderRow("From", "lay.lo", 0, 1, 0.01, ""), sliderRow("To", "lay.hi", 0, 1, 0.01, ""), sliderRow("Softness", "lay.soft", 0, 0.5, 0.01, "")]), () => hasLay() && (st.lay.mask === "Height" || st.lay.mask === "Slope")),
    only(el("div", { class: "row wrap" }, [maskName, btn("Load mask...", () => loadLayerMask(), "Black hides the layer, white shows it")]), () => hasLay() && st.lay.mask === "Bitmap"),
    only(ui.brand.toggle("Invert mask", "lay.inv"), () => hasLay() && st.lay.mask !== "None"),
    only(el("div", { class: "hint", text: "Height: 0 = bottom of the object, 1 = top. Slope: 0 = walls, 1 = flat ground." }), () => hasLay() && (st.lay.mask === "Height" || st.lay.mask === "Slope")),
    lay(el("div", { class: "lbl3", text: "FINISH" })),
    lay(el("div", { class: "row wrap" }, [sliderRow("Relief", "lay.bump", 0, 3, 0.01, ""), sliderRow("Glow", "lay.glow", 0, 5, 0.05, "")])),
    lay(ui.brand.toggle("Own shine", "lay.shine")),
    only(el("div", { class: "row wrap" }, [sliderRow("Roughness", "lay.rough", 0, 1, 0.01, ""), sliderRow("Metal", "lay.metal", 0, 1, 0.01, "")]), () => hasLay() && st.lay.shine),
    only(el("div", { class: "lbl3", text: "SAVE THIS STACK" }), () => canLayer() && hasLay()),
    only(el("div", { class: "row wrap" }, [presetName, btn("Save preset", () => saveLayerPreset(presetName.value))]), () => canLayer() && hasLay())
  ]);
  refs.tabs = ui.tabs([objCard, scaleCard, matCard, surfCard, meshCard, shapeCard, lightCard, waterCard, skyCard, camCard], { title: "Inspector" });
  box.appendChild(refs.tabs);
}
function buildBar(ui) {
  const bar = document.getElementById("bar"), { segGroup } = ui;
  refs.status = el("div", { class: "status", text: "Starting..." });
  refs.keys = el("div", { class: "keyhints", title: "Keys for what you're doing now" });
  refs.meter = ui.brand.meter(12);
  refs.go = el("button", { class: "apply", text: "Render PNG", title: "Render the scene at the output size, with Depth, Object mask and Sky mask passes (Cmd+R)" }); refs.go.addEventListener("click", () => renderNow());
  const num = (path, title) => { const i = el("input", { type: "text", class: "num", title, "data-key": "out." + path }); ui.bind(() => { i.value = String(st.out[path]); }); i.addEventListener("change", () => { const v = Math.round(parseFloat(i.value)); if (v >= 16 && v <= 8000) st.out[path] = v; ui.refreshAll(); placeFrameGuide(); }); return i; };
  const size = el("select", { "data-key": "out.size" }); [["", "Size..."], ["1920x1080", "HD 1920 x 1080"], ["3840x2160", "4K 3840 x 2160"], ["1080x1080", "Square 1080"], ["1080x1920", "Story 1080 x 1920"], ["2400x1600", "Print 3:2"], ["view", "Match the view"]].forEach(([v, l]) => size.appendChild(el("option", { value: v, text: l })));
  size.addEventListener("change", () => { const v = size.value; if (v === "view") { st.out.h = 1080; st.out.w = Math.round(1080 * vpwrap.clientWidth / vpwrap.clientHeight); } else if (v) { const [w, h] = v.split("x").map(Number); st.out.w = w; st.out.h = h; } size.value = ""; ui.refreshAll(); placeFrameGuide(); });
  bar.appendChild(refs.status); bar.appendChild(refs.keys);
  bar.appendChild(el("span", { class: "lbl3", text: "OUTPUT" })); bar.appendChild(num("w", "Width (px)")); bar.appendChild(el("span", { text: "x" })); bar.appendChild(num("h", "Height (px)")); bar.appendChild(size);
  bar.appendChild(segGroup("out.engine", [{ v: "gpu", l: "GPU", t: "Graphics card: the live view's look at full size, in seconds" }, { v: "ray", l: "Ray traced", t: "The CPU ray tracer: true reflections and soft light, slower" }]));
  bar.appendChild(segGroup("out.quality", [{ v: "draft", l: "Draft", t: "Fast: one sample per pixel" }, { v: "final", l: "Final", t: "Smooth edges (2x2 samples); on the GPU also sharper shadows and scene reflections" }]));
  bar.appendChild(refs.meter.node); bar.appendChild(refs.go);
}

// ---- command palette (Cmd/Ctrl+K): every action in one searchable list
function commands() {
  const C = [], add = (group, label, run, keys, top) => C.push({ group, label, run, keys, top });
  const M = MOD, sc = () => st.scene, view = (fn) => () => { fn(); changed("view"); };
  add("File", "New scene", () => newScene(), M + "N", true); add("File", "Open scene...", () => openScene(), M + "O", true);
  add("File", "Save", () => save(false), M + "S", true); add("File", "Save as...", () => save(true), M + "Shift+S");
  add("File", "Import model...", () => importModel(), M + "I", true); add("Render", "Render PNG", () => renderNow(), M + "R", true);
  add("Photoshop", "Send to Photoshop", () => sendToPhotoshop(), "", true); add("Photoshop", (st.out.autoSend ? "Turn off" : "Turn on") + " Auto-send", () => { st.out.autoSend = !st.out.autoSend; changed("val"); });
  add("Render", "Draft quality", () => { st.out.quality = "draft"; changed("val"); }); add("Render", "Render on the GPU", () => { st.out.engine = "gpu"; changed("val"); }); add("Render", "Render with the ray tracer", () => { st.out.engine = "ray"; changed("val"); }); add("Render", "Final quality", () => { st.out.quality = "final"; changed("val"); });
  [["HD 1920 x 1080", 1920, 1080], ["4K 3840 x 2160", 3840, 2160], ["Square 1080", 1080, 1080], ["Story 1080 x 1920", 1080, 1920], ["Print 3:2", 2400, 1600]].forEach(([l, w, h]) => add("Render size", l, () => { st.out.w = w; st.out.h = h; uis.forEach((u) => u.refreshAll()); placeFrameGuide(); }));
  add("Edit", "Undo", () => undo(), M + "Z", true); add("Edit", "Redo", () => redo(), M + "Shift+Z");
  if (hasSel()) {
    add("Edit", "Duplicate selected", () => { select(ED.duplicate(sc(), st.sel)); commit(); }, M + "D", true);
    add("Edit", "Delete selected", () => { ED.remove(sc(), st.sel); select(null); commit(); }, "Del");
    add("Edit", "Drop selected to ground", () => { CT.rest(sc(), st.sel); edited(); });
    add("Edit", "Deselect", () => select(null), "Esc");
    if (st.sel.type !== "light") {
      SC.REAL.forEach(([l, m]) => add("Size", l + " height (" + m + " m)", () => { SC.setHeight(sc(), st.sel, m, st.view.stick); edited(); }));
      [0.5, 2].forEach((k) => add("Size", "Scale x" + k, () => { SC.mul(sc(), st.sel, k, st.view.stick); edited(); }));
      add("Size", "Reset stretch", () => { SC.resetStretch(sc(), st.sel, st.view.stick); edited(); });
      Object.keys(S.MATS).forEach((m) => add("Material", m, () => { st.sel.mat = m; st.sel.refl = null; edited(); }));
      if (st.sel.type !== "terrain") add("Material", "Load surface image...", () => loadTexture());
      SF.presetNames().forEach((n) => add("Surfaces", "Add preset: " + n, () => addPreset(n, false)));
      add("Surfaces", "Add picture layer...", () => loadLayerPicture(true));
      if (refs.psPic) add("Surfaces", "Add the picture from Photoshop", () => usePhotoshopPicture(true));
      if (hasLay()) { add("Surfaces", "Delete layer", () => refs.layOps.remove()); add("Surfaces", "Duplicate layer", () => refs.layOps.dup()); add("Surfaces", (st.lay.on ? "Hide" : "Show") + " layer", () => { st.lay.on = !st.lay.on; edited(); }); }
    }
  }
  [["move", "Move", "W"], ["rotate", "Rotate", "E"], ["scale", "Scale", "R"], ["sculpt", "Sculpt", "B"]].forEach(([g, l, k]) => add("Tool", l, () => { st.view.gizmo = g; changed("view"); }, k));
  CT.VIEWS.forEach(([v, l]) => add("View", l + " view", view(() => CT.camView(sc().cam, v))));
  add("View", "Frame all", view(() => CT.frame(sc())), "A", true); add("View", "Frame selected", view(() => { if (hasSel()) CT.frame(sc(), st.sel); }), "F");
  add("View", "Home view", view(() => { if (homeCam) CT.camSet(sc().cam, homeCam); }), "H");
  add("View", st.view.camLock ? "Unlock camera" : "Lock camera", () => { st.view.camLock = !st.view.camLock; changed("val"); });
  if (refs.tabs && refs.tabs.__tabs) refs.tabs.__tabs.items.forEach((it) => add("Inspector", it.title + " tab", () => refs.tabs.__tabs.choose(it.title)));
  Object.keys(S.SKIES).forEach((k) => add("Sky", k, () => { sc().sky = k; edited(); }));
  Object.keys(WATER_LOOKS).forEach((k) => add("Water", k + " water", () => { Object.assign(sc(), WATER_LOOKS[k]); sc().water = true; edited(); }));
  add("Water", sc().water ? "Remove water" : "Add water", () => { sc().water = !sc().water; edited(); });
  add("Light", "Add light", () => { select(ED.addObject(sc(), "light")); commit(); });
  SHAPES.forEach(([k, l]) => add("Add shape", l, () => addThing("shape:" + k)));
  PK.PACKS.forEach((pk) => PK.assets(pk).forEach((a) => add("Add " + pk, a.name, () => addThing("asset:" + a.id))));
  const load = (pk, name) => async () => { if (!(await askSave())) return; loadScene(pk === "Classic" ? S.loadPreset(name) : PK.loadMap(pk, name)); setStatus("Loaded " + name); };
  Object.keys(S.PRESETS).forEach((n) => add("Scene", n, load("Classic", n)));
  PK.PACKS.forEach((pk) => Object.keys(PK.MAPS[pk]).forEach((n) => add(pk + " map", n, load(pk, n))));
  sc().objs.forEach((o) => add("Select", ED.label(o).toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), () => { select(o); }));
  return C;
}
let lastPalKey = 0;   // the menu accelerator and the key handler can both see Cmd+K: act once
const pal = palette(commands, (c) => setStatus(c.group + ": " + c.label));

// ---- keys
function onKey(e) {
  if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === "k") { e.preventDefault(); lastPalKey = Date.now(); pal.toggle(); return; }
  if (pal.isOpen) return;
  const t = e.target && e.target.tagName; if (/INPUT|SELECT|TEXTAREA/.test(t || "")) return;
  if (uis.some((u) => u.brand && u.brand.selectedDial) && /Arrow/.test(e.key)) return;   // a selected knob takes the arrows
  if (e.metaKey || e.ctrlKey) return;   // menu shortcuts
  const key = String(e.key || ""), k = key.toLowerCase(), big = e.shiftKey ? "big" : st.view.step, sc = st.scene;
  const done = () => { e.preventDefault(); commit(); changed("val"); };
  if (key === "Escape") { if (!document.getElementById("shot").hidden) { document.getElementById("shot").hidden = true; return; } select(null); return; }
  const g = { w: "move", e: "rotate", r: "scale", b: "sculpt" }[k]; if (g) { st.view.gizmo = g; changed("view"); return; }
  if ((key === "Delete" || key === "Backspace") && hasSel()) { ED.remove(sc, st.sel); select(null); commit(); return; }
  if (key === "Tab") { e.preventDefault(); select(CT.cycle(sc, hasSel() ? st.sel : null, e.shiftKey ? -1 : 1)); return; }
  if (k === "f") { if (hasSel()) CT.frame(sc, st.sel); else CT.frame(sc); changed("view"); return; }
  if (k === "a") { CT.frame(sc); changed("view"); return; }
  if (k === "h" && homeCam) { CT.camSet(sc.cam, homeCam); changed("view"); return; }
  const dir = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "fwd", ArrowDown: "back", PageUp: "up", PageDown: "down" }[key];
  if (dir) {
    if (hasSel()) { CT.nudge(sc, st.sel, dir, big, st.view.stick); return done(); }
    const o = (CT.STEP[big] || CT.STEP.med).orbit; ({ left: () => CT.camOrbit(sc.cam, o, 0), right: () => CT.camOrbit(sc.cam, -o, 0), fwd: () => CT.camOrbit(sc.cam, 0, o), back: () => CT.camOrbit(sc.cam, 0, -o), up: () => CT.camZoom(sc.cam, 0.9), down: () => CT.camZoom(sc.cam, 1.1) })[dir]();
    e.preventDefault(); changed("view"); return;
  }
  if (hasSel() && (key === "[" || key === "]")) { CT.spin(st.sel, key === "]" ? 1 : -1, big); return done(); }
  if (hasSel() && (key === "-" || key === "=" || key === "+")) { CT.grow(sc, st.sel, key === "-" ? -1 : 1, big, st.view.stick); return done(); }
}
document.addEventListener("keydown", onKey);
ipcRenderer.on("menu", (e, cmd) => ({ new: newScene, open: () => openScene(), save: () => save(false), saveAs: () => save(true), importModel, render: renderNow, undo, redo,
  palette: () => { if (Date.now() - lastPalKey > 200) pal.toggle(); }, duplicate: () => { if (hasSel()) { select(ED.duplicate(st.scene, st.sel)); commit(); } }, frameAll: () => { CT.frame(st.scene); changed("view"); }, home: () => { if (homeCam) { CT.camSet(st.scene.cam, homeCam); changed("view"); } } }[cmd] || (() => {}))());
ipcRenderer.on("app:close-request", async () => { if (await askSave()) ipcRenderer.send("app:close-ok"); });

// ---- start-up
const root = document.getElementById("app");
// 3.0 interface, same as the plugins: Night Arcade style, pixel type, LCD value boxes, hover help with the HELP switch
root.classList.add("brand-console", "arcade", "ui3");
const ui = createUI({ getState: () => st, onChange: () => edited(), onLive: () => changed("drag"), pickColor, brand: "console", glow: GLOW, storeKey: "worlds-lab", arcade: true, helpText: HELP });
const lui = createUI({ getState: () => st, onChange: () => changed("val"), pickColor, brand: "console", glow: GLOW, storeKey: "worlds-lab", arcade: true, helpText: HELP });
uis = [ui, lui]; refs.insp = ui;
ui.help.onChange((on) => { if (lui.help.on !== on) lui.help.setOn(on); }); lui.help.onChange((on) => { if (ui.help.on !== on) ui.help.setOn(on); });   // one HELP switch for the whole app
let sweepT = null; const sweepAll = () => { clearTimeout(sweepT); sweepT = setTimeout(() => { ui.sweep(document.getElementById("insp")); ["top", "lib", "centre", "bar"].forEach((id) => lui.sweep(document.getElementById(id)));
  root.querySelectorAll("#insp .tabbtn").forEach((n) => { if (n.__help && n.__help.kind === "tab") n.__help.kind = "seg"; });   // the app's tabs have no on/off dot
  root.querySelectorAll(".wbcell, .wbtile, .wbobj").forEach((n) => { if (n.__help) return; const u = n.closest("#insp") ? ui : lui, nm = (n.textContent || "").trim().slice(0, 40);
    u.helpAt(n, n.classList.contains("wbcell") ? { key: "lib.scene", name: nm, kind: "grid" } : n.classList.contains("wbtile") ? { key: "lib.add", name: nm, kind: "grid" } : n.closest(".wblayers") ? { key: "lay.row", name: nm, kind: "info" } : { key: "lib.obj", name: nm, kind: "info" }); }); }, 60); };
new MutationObserver(sweepAll).observe(root, { childList: true, subtree: true });   // panes that redraw (layers, objects) get their help too
buildTop(lui); buildLibrary(lui); buildToolbar(lui); buildPads(lui); buildInspector(ui); buildBar(lui);
refs.axes = axisGizmo(vpwrap, () => st.scene.cam, (yaw, pitch, name) => { if (st.view.camLock) return; const c = st.scene.cam; if (yaw !== null) c.yaw = yaw; c.pitch = pitch; changed("view"); setStatus(name); });
pressGlow(root);
homeCam = CT.camCopy(st.scene.cam); resetHistory(); uis.forEach((u) => u.refreshAll()); changed("scene"); title();
setStatus("Ready. Drag shapes and models in from the Library, then Render PNG.");
setTimeout(() => drawLibrary().catch((err) => console.error(err)), 50);
ipcRenderer.invoke("app:info").then((info) => {   // the Photoshop bridge folder + watching for the panel's requests
  BR.setRoot(window.__wbBridgeRoot || info.docs);
  refs.bridgeWatch = BR.watch({ docSize: applyDocSize, picture: (p) => { refs.psPic = p; uis.forEach((u) => u.refreshAll()); setStatus("Photoshop sent a picture: " + p.name + " (Surfaces tab)"); } });
}).catch((err) => console.error(err));

// for the automated tests
window.__wb = { uis, sweepAll, BR, sendToPhotoshop, refs, pal, commands, st, vp, S, ED, CT, PK, SC, addThing, select, changed, commit, undo, redo, loadScene, renderNow, save, openScene, snap, hist, get filePath() { return filePath; }, set filePath(p) { filePath = p; }, get dirty() { return dirty; }, set dirty(v) { dirty = v; }, NONE };
