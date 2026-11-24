"use strict";
// Loads a plugin panel headlessly: jsdom for the DOM, fake "photoshop" and
// "uxp" modules that record every host call. Lets us test panels in Node.
// jsdom is resolved from JSDOM_PATH or normal node resolution.
const path = require("path");
const Module = require("module");

function loadJSDOM() {
  const p = process.env.JSDOM_PATH;
  return p ? require(p) : require("jsdom");
}

// Synthetic RGBA image so readSource returns real pixels.
function fakeImage(w, h) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    data[i] = (x * 255 / w) | 0; data[i + 1] = (y * 255 / h) | 0; data[i + 2] = ((x + y) * 127 / (w + h)) | 0; data[i + 3] = 255;
  }
  return data;
}

function makeHost(opts) {
  const calls = [];
  const W = opts.docW || 400, H = opts.docH || 300;
  const pixels = fakeImage(W, H);
  let nextId = 100, doc2W = 0, doc2H = 0;
  const layers = [];
  const doc = opts.withDoc ? {
    id: 1, name: "test.psd", width: W, height: H, resolution: 300,
    layers, activeLayers: [],
    async createPixelLayer(o) { const L = { id: nextId++, name: o.name, opacity: o.opacity, visible: true, kind: "pixel", blendMode: null }; layers.push(L); calls.push(["createPixelLayer", o.name]); return L; },
    async createLayerGroup(o) { calls.push(["createLayerGroup", o.name, (o.fromLayers || []).length]); const G = { id: nextId++, name: o.name, kind: "group", async move(t, p) { calls.push(["move", t && t.id, p]); } }; return G; },
    // Paint Brew's print-ready copy: a duplicate that can be resized (same fake pixels, stretched)
    async duplicate(name) {
      calls.push(["duplicate", name]);
      const d2 = Object.assign({}, doc, { id: 2, name, layers: [] });
      d2.createPixelLayer = async (o) => { const L = { id: nextId++, name: o.name, opacity: o.opacity, visible: true, kind: "pixel", blendMode: null }; d2.layers.push(L); calls.push(["createPixelLayer", o.name]); return L; };
      d2.resizeImage = async (w, h, ppi) => { calls.push(["resizeImage", w, h, ppi]); d2.width = w; d2.height = h; d2.resolution = ppi; doc2W = w; doc2H = h; };
      return d2;
    }
  } : null;
  const photoshop = {
    app: { get activeDocument() { return doc; }, foregroundColor: { rgb: { hexValue: "FF3D6E" } }, backgroundColor: { rgb: { hexValue: "05040C" } } },
    constants: { LayerKind: { GROUP: "group" }, BlendMode: { NORMAL: "normal", MULTIPLY: "multiply", LINEARDODGE: "linearDodge", SCREEN: "screen", COLOR: "color", OVERLAY: "overlay", SOFTLIGHT: "softLight", HUE: "hue", LUMINOSITY: "luminosity" }, ElementPlacement: { PLACEINSIDE: "inside", PLACEBEFORE: "before" } },
    core: {
      async executeAsModal(fn, o) {
        calls.push(["executeAsModal", o && o.commandName]);
        return fn({ hostControl: { async suspendHistory(o2) { calls.push(["suspendHistory", o2.name]); return 7; }, async resumeHistory() { calls.push(["resumeHistory"]); } } });
      }
    },
    action: {
      async batchPlay(cmds) {
        calls.push(["batchPlay", cmds.map((c) => c._obj).join(",")]);
        return cmds.map((c) => c._obj === "showColorPicker" ? { RGBFloatColor: { _obj: "RGBColor", red: 255, grain: 128.4, blue: 0 } } : {});
      }
    },
    imaging: {
      async getPixels(o) {
        // like Photoshop 28: a layer group can't be read by its id
        if (o.layerID != null && (doc.layers || []).some((l) => l.id === o.layerID && l.kind === "group")) throw new Error("Unsupported layer type");
        calls.push(["getPixels", JSON.stringify(o.sourceBounds || null), JSON.stringify(o.targetSize || null)]);
        const b = o.sourceBounds || { left: 0, top: 0, right: W, bottom: H };
        let w = b.right - b.left, h = b.bottom - b.top;
        let out = new Uint8Array(w * h * 4);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const dw = o.documentID === 2 && doc2W ? doc2W : W, dh = o.documentID === 2 && doc2H ? doc2H : H;
          const sxp = Math.min(W - 1, Math.floor((x + b.left) * W / dw)), syp = Math.min(H - 1, Math.floor((y + b.top) * H / dh));
          const s = (syp * W + sxp) * 4, d = (y * w + x) * 4;
          out[d] = pixels[s]; out[d + 1] = pixels[s + 1]; out[d + 2] = pixels[s + 2]; out[d + 3] = pixels[s + 3];
        }
        if (o.targetSize) {
          const tw = o.targetSize.width, th = o.targetSize.height, sm = new Uint8Array(tw * th * 4);
          for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
            const s = (((y * h / th) | 0) * w + ((x * w / tw) | 0)) * 4, d = (y * tw + x) * 4;
            sm[d] = out[s]; sm[d + 1] = out[s + 1]; sm[d + 2] = out[s + 2]; sm[d + 3] = out[s + 3];
          }
          out = sm; w = tw; h = th;
        }
        return { imageData: { width: w, height: h, components: 4, async getData() { return out; }, dispose() {} } };
      },
      async createImageDataFromBuffer(buf, o) {
        // like Photoshop: only these typed arrays are accepted
        if (![Uint8Array, Uint16Array, Float32Array].includes(buf && buf.constructor)) throw new Error("Incorrect type for typedarray. Possible types are Uint8Array, Uint16Array, Float32Array");
        return { buf, o, dispose() {} };
      },
      async putPixels(o) { calls.push(["putPixels", o.layerID, o.imageData.o.components, o.imageData.buf.length]); }
    }
  };
  let saved = null;
  const file = (content) => ({ async read() { return content; }, async write(t) { saved = t; calls.push(["fileWrite", t.length]); } });
  const uxp = {
    entrypoints: { setup(arg) { calls.push(["entrypoints.setup"]); uxp.entrypoints.last = arg; } },
    storage: { localFileSystem: {
      async getDataFolder() { return { async getEntry() { if (saved == null) throw new Error("none"); return file(saved); }, async createFile() { return file(saved); } }; },
      async getFileForSaving() { return file(""); },
      async getFileForOpening() { return file(saved || "[]"); }
    } }
  };
  return { photoshop, uxp, calls, doc };
}

// Returns { window, document, mod, host, settle() }
async function loadPanel(pluginDir, opts) {
  opts = opts || {};
  const { JSDOM } = loadJSDOM();
  const dom = new JSDOM("<!DOCTYPE html><div id=\"app\"></div>", { pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  const host = makeHost(opts);
  if (opts.extend) opts.extend(host);   // tool tests can add host features
  const origLoad = Module._load;
  Module._load = function (req, parent, isMain) {
    if (req === "photoshop") return host.photoshop;
    if (req === "uxp") return host.uxp;
    return origLoad.apply(this, arguments);
  };
  const main = path.join(pluginDir, "main.js");
  // fresh copy of every plugin module per load
  Object.keys(require.cache).forEach((k) => { if (k.startsWith(pluginDir)) delete require.cache[k]; });
  let mod;
  try { mod = require(main); } finally { Module._load = origLoad; }
  const settle = async (ms) => { await new Promise((r) => setTimeout(r, ms == null ? 400 : ms)); };
  await settle();
  return { window: dom.window, document: dom.window.document, mod, host, settle };
}

module.exports = { loadPanel, makeHost, fakeImage };
