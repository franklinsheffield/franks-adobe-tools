"use strict";
// ======================================================================
// Pixel Scape Bridge (PX-10): the Photoshop end of the Pixel Scape desktop app.
// The app builds and renders scenes; this panel
//   - shows the latest render the app sent, with Place as layer (one undo step, sized to the
//     active document, the passes Depth / Object mask / Sky mask as hidden layers in the group)
//   - Match document size: tells the app the active document's size so renders fit exactly
//   - Send layer: sends the active layer to the app as a picture for surface layers
// The two talk through files in Documents/Pixel Scape (formats in js/bridge.js).
// The scene-builder panels of 0.5 are retired (kept in legacy/, not packaged); the engine in js/ is
// shared with the app.
// ======================================================================
const B = require("./js/bridge.js");
const { decodePNG } = require("./js/pngdec.js");
const PS = require("./core/ps-io.js");
const PNG = require("./core/png.js");
const { createUI, el, clear } = require("./core/ui.js");
const { splitLayout, pressGlow } = require("./core/layout.js");

const APP = "Pixel Scape", CODE = "PX-10", GLOW = "#5effc8", VERSION = "1.1.0";
PS.configure({ appName: APP, presetFile: "bridge.json", exportName: "worlds-bridge.json" });
let uxp = null; try { uxp = require("uxp"); } catch (e) { uxp = null; }
const fsys = uxp && uxp.storage ? uxp.storage.localFileSystem : null;

// ---- file I/O: UXP storage with full access (Documents/Pixel Scape); plain Node fs when tested in Node
function uxpIO() {
  const formats = uxp.storage.formats, url = (p) => "file:" + p;
  const get = async (p) => fsys.getEntryWithUrl(url(p));
  async function mkdir(p) {
    try { const e = await get(p); if (e && e.isFolder) return e; } catch (e) { /* make it */ }
    const parent = p.replace(/\/[^/]+\/?$/, ""), name = p.replace(/\/$/, "").split("/").pop();
    const up = await mkdir(parent); return up.createFolder(name);
  }
  return {
    read: async (p) => new Uint8Array(await (await get(p)).read({ format: formats.binary })),
    readText: async (p) => (await get(p)).read({ format: formats.utf8 }),
    async write(p, data) {
      const dir = await mkdir(p.replace(/\/[^/]+$/, "")), f = await dir.createFile(p.split("/").pop(), { overwrite: true });
      if (typeof data === "string") await f.write(data, { format: formats.utf8 }); else await f.write(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), { format: formats.binary });
    },
    mkdir: async (p) => { await mkdir(p); },
    list: async (p) => (await (await get(p)).getEntries()).map((e) => e.name),
    stat: async (p) => { try { const e = await get(p), m = await e.getMetadata(); return { mtime: +new Date(m.dateModified) }; } catch (e) { return null; } }
  };
}
function nodeIO() {
  const fsp = require("fs").promises;
  return {
    read: async (p) => new Uint8Array(await fsp.readFile(p)), readText: (p) => fsp.readFile(p, "utf8"),
    write: (p, d) => fsp.writeFile(p, typeof d === "string" ? d : Buffer.from(d.buffer, d.byteOffset, d.byteLength)),
    mkdir: (p) => fsp.mkdir(p, { recursive: true }), list: (p) => fsp.readdir(p),
    stat: async (p) => { try { return { mtime: (await fsp.stat(p)).mtimeMs }; } catch (e) { return null; } }
  };
}
const io = fsys && fsys.getEntryWithUrl ? uxpIO() : nodeIO();
function documentsDir() {
  try { const os = require("os"), home = os.homedir(); if (home) return String(home).replace(/\\/g, "/").replace(/\/$/, "") + "/Documents"; } catch (e) { /* below */ }
  return null;
}
let ROOT = documentsDir() ? documentsDir() + "/" + B.ROOT_NAME : null;
// 1.1 (Pixel Scape rename): an app that has not been updated yet still writes to Documents/Worlds Lab
(async () => { try { if (ROOT && !(await io.stat(ROOT)) && (await io.stat(documentsDir() + "/" + B.LEGACY_ROOT))) ROOT = documentsDir() + "/" + B.LEGACY_ROOT; } catch (e) { /* keep ROOT */ } })();

// ---- state
const st = { place: { passes: true, fit: "cover" } };
const refs = {};
let latest = null, lastSeen = null, busy = false, pollT = null;
const ui = createUI({ getState: () => st, onChange: () => ui.refreshAll(), brand: "console", glow: GLOW, storeKey: APP + " bridge" });
const { card, row, checkRow, bind } = ui;
function setStatus(msg, err) { if (refs.status) { refs.status.textContent = msg; refs.status.className = "status" + (err ? " err" : ""); } if (refs.led) refs.led.set(err ? "err" : busy ? "busy" : "ready"); }
const btn = (l, fn, t, cls) => { const b = el("button", { class: cls || "btn", text: l, title: t || "" }); b.addEventListener("click", () => { if (!b.hasAttribute("disabled")) fn(); }); return b; };
const when = (d) => { try { return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };

// ---- the latest render from the app
async function poll() {
  clearTimeout(pollT);
  try {
    const L = ROOT ? await B.readLatest(io, ROOT) : null;
    if (L && (!latest || L.folder !== latest.folder)) { latest = L; await showLatest(); }
    else if (!L && !latest) showNone();
  } catch (e) { /* mid-write: next time */ }
  pollT = setTimeout(poll, 1000);
}
function showNone() { if (refs.info) refs.info.textContent = "No render yet. In the Pixel Scape app, press Send to Photoshop (or turn on Auto-send)."; if (refs.place) refs.place.setAttribute("disabled", "true"); }
async function showLatest() {
  const j = latest.info;
  refs.info.textContent = j.scene + "  -  " + j.w + " x " + j.h + "  -  " + (j.engine === "ray" ? "ray traced" : "GPU") + " " + j.quality + "  -  " + when(j.time) + (j.passes.length > 1 ? "  -  + " + (j.passes.length - 1) + " passes" : "");
  refs.place.removeAttribute("disabled");
  try { const bytes = await io.read(B.join(latest.dir, "render.png")); refs.thumb.src = "data:image/png;base64," + PNG.toBase64(bytes); refs.thumb.style.display = ""; } catch (e) { refs.thumb.style.display = "none"; }
  if (lastSeen && lastSeen !== latest.folder) setStatus("New render from Pixel Scape: " + j.scene + ". Press Place as layer.");
  lastSeen = latest.folder;
}

// Place as layer: the render (+ passes, hidden) as one group sized to the active document, one undo step
async function place() {
  if (busy || !latest) return;
  const doc = PS.activeDoc();
  if (!doc) { setStatus("Open or create a document first, then press Place as layer.", true); return; }
  busy = true; setStatus("Placing...");
  try {
    const info = PS.docInfo(doc), W = info.w, H = info.h, j = latest.info, layers = [];
    for (const p of B.PASSES) {
      if (!j.passes.includes(p.key) || (p.key !== "render" && !st.place.passes)) continue;
      const dec = decodePNG(await io.read(B.join(latest.dir, p.file)));
      layers.push({ name: p.name, rgba: B.coverResize(B.toRGBA(dec), dec.w, dec.h, W, H), blend: "NORMAL", hidden: p.hidden });
    }
    const warn = await PS.writeResult(doc, { w: W, h: H, layers }, { origin: { left: 0, top: 0 }, groupName: B.groupName(j.scene), hideSource: false });
    const fit = j.w === W && j.h === H ? "" : " (scaled from " + j.w + " x " + j.h + " to fill " + W + " x " + H + "; use Match document size for an exact fit)";
    setStatus((warn && warn.length ? warn[0] + " " : "") + "Placed " + B.groupName(j.scene) + fit + ". One undo step.");
  } catch (e) { setStatus("Couldn't place the render: " + (e.message || e), true); }
  finally { busy = false; if (refs.led) refs.led.set("ready"); }
}
async function matchSize() {
  const doc = PS.activeDoc(); if (!doc) { setStatus("Open a document first: its size goes to the app.", true); return; }
  if (!ROOT) { setStatus("Couldn't find your Documents folder.", true); return; }
  const info = PS.docInfo(doc);
  try { await B.writeDocSize(io, ROOT, { w: info.w, h: info.h, ppi: info.ppi, doc: doc.name || "" }); setStatus("Sent " + info.w + " x " + info.h + " to Pixel Scape. Its next render will fit this document exactly."); }
  catch (e) { setStatus("Couldn't reach the Pixel Scape folder: " + (e.message || e), true); }
}
async function sendLayer() {
  const doc = PS.activeDoc(); if (!doc) { setStatus("Open a document and select a layer first.", true); return; }
  const layer = PS.activeLayer(doc); if (!layer) { setStatus("Select the layer to send first.", true); return; }
  busy = true; setStatus("Reading " + layer.name + "...");
  try {
    const r = await PS.readSource(doc, { kind: "layer", layer }, { kind: "whole", size: 2048 }), src = r.src, n = src.w * src.h;
    let rgba = src.data;
    if (src.c === 3) { rgba = new Uint8Array(n * 4); for (let i = 0; i < n; i++) { rgba[i * 4] = src.data[i * 3]; rgba[i * 4 + 1] = src.data[i * 3 + 1]; rgba[i * 4 + 2] = src.data[i * 3 + 2]; rgba[i * 4 + 3] = 255; } }
    const png = PNG.encodePNG(rgba, src.w, src.h, 4);
    const j = await B.writePicture(io, ROOT, { name: layer.name, w: src.w, h: src.h }, png);
    setStatus("Sent " + j.name + " (" + src.w + " x " + src.h + ") to Pixel Scape: it's in the app's Surfaces tab.");
  } catch (e) { setStatus("Couldn't send the layer: " + (e.message || e), true); }
  finally { busy = false; if (refs.led) refs.led.set("ready"); }
}

// ---- panel
function build(root) {
  clear(root); root.classList.add("brand-console");
  const lay = splitLayout(root, el);
  refs.led = ui.brand.header({ title: APP + " Bridge", code: CODE }); lay.pinned.appendChild(refs.led.node);
  refs.status = el("div", { class: "status", text: "Looking for renders from the Pixel Scape app..." });
  refs.thumb = el("img", { class: "wbthumb" }); refs.thumb.style.display = "none";
  refs.info = el("div", { class: "info" });
  refs.place = btn("Place as layer", () => place(), "Adds the render as a layer group above the active layer, sized to this document. One undo step.", "apply");
  lay.pinned.appendChild(card("Latest render", [refs.thumb, refs.info, refs.place, refs.status], { fold: false }));
  const s = lay.scroller;
  s.appendChild(card("Place", [
    checkRow("Add the passes (Depth, Object mask, Sky mask) as hidden layers", "place.passes"),
    el("div", { class: "hint", text: "A render with another shape fills the document and is cropped evenly. Match document size makes the app render this document's exact size." })
  ]));
  s.appendChild(card("Document", [btn("Match document size", () => matchSize(), "Tells the Pixel Scape app this document's width and height"),
    el("div", { class: "hint", text: "The app's output size follows straight away." })]));
  s.appendChild(card("Pictures", [btn("Send layer to Pixel Scape", () => sendLayer(), "Sends the active layer as a picture for surface layers in the app"),
    el("div", { class: "hint", text: "The picture shows up in the app's Surfaces tab: add it as a new layer or use it on the selected one." })]));
  const where = el("div", { class: "info path" }); bind(() => { where.textContent = ROOT ? "Shared folder: " + ROOT : "Shared folder not found"; });
  s.appendChild(card("About", [where, el("div", { class: "hint", text: "Build and render scenes in the Pixel Scape app; this panel brings them into Photoshop." })]));
  s.appendChild(el("div", { class: "foot", text: APP + " Bridge " + VERSION + "  -  Lab suite" }));
  pressGlow(root); ui.refreshAll(); showNone(); poll();
}
let built = false;
function init(rootNode) {
  let n = document.getElementById("app"); if (!n) { n = document.createElement("div"); n.id = "app"; (rootNode || document.body).appendChild(n); }
  if (rootNode && n.parentNode !== rootNode) rootNode.appendChild(n);
  if (!built) { built = true; build(n); }
}
try { if (uxp && uxp.entrypoints) uxp.entrypoints.setup({ panels: { worldsBridge: { create(r) { init(r); }, show(r) { init(r); } } } }); } catch (e) { /* older hosts */ }
setTimeout(() => init(null), 0);

module.exports = { _test: { st, refs, place, matchSize, sendLayer, poll, setRoot(r) { ROOT = r; latest = null; lastSeen = null; }, get latest() { return latest; }, stop() { clearTimeout(pollT); pollT = null; } } };
