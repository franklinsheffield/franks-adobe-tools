"use strict";
// Pixel Scape: the bridge between the desktop app and Photoshop (phase 3).
// Both sides share one folder, Documents/Pixel Scape, and talk only through files in it:
//   Renders/<stamp>-<scene>/render.png (+ depth.png, mask.png, sky.png) + info.json    app -> Photoshop
//   Renders/latest.json   { folder, time }   written last, so a half-written render is never picked up
//   Bridge/doc-size.json  { w, h, ppi, doc, time }                                    Photoshop -> app
//   Bridge/Pictures/<stamp>-<layer>.png + Bridge/picture.json { file, name, w, h, time } Photoshop -> app
// This file holds the names, the formats and the pixel helpers; each side does its own file I/O
// (Node fs in the app, UXP fs in the plugin) through the tiny `io` interface below.
const VERSION = 1;
const ROOT_NAME = "Pixel Scape", LEGACY_ROOT = "Worlds Lab";   // renamed 2026-11-26 (app 0.11 moves the old folder)
const PASSES = [   // file name, layer name, hidden when placed
  { key: "render", file: "render.png", name: "Render", hidden: false },
  { key: "depth", file: "depth.png", name: "Depth", hidden: true },
  { key: "mask", file: "mask.png", name: "Object mask", hidden: true },
  { key: "sky", file: "sky.png", name: "Sky mask", hidden: true }
];
const join = (...p) => p.join("/").replace(/\/+/g, "/");
function paths(root) {   // root = <Documents>/Pixel Scape
  return { root, renders: join(root, "Renders"), latest: join(root, "Renders", "latest.json"), bridge: join(root, "Bridge"),
    docSize: join(root, "Bridge", "doc-size.json"), pictures: join(root, "Bridge", "Pictures"), picture: join(root, "Bridge", "picture.json") };
}
const pad = (n, k) => String(n).padStart(k || 2, "0");
function stamp(d) { d = d || new Date(); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()); }
const safe = (s) => String(s || "Scene").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, " ").slice(0, 40) || "Scene";
function renderFolder(scene, d) { return stamp(d) + "-" + safe(scene); }
function info(o) {
  return { worldsBrewBridge: VERSION, scene: o.scene || "Scene", w: o.w, h: o.h, engine: o.engine || "gpu", quality: o.quality || "final",
    passes: PASSES.filter((p) => o.have ? o.have.includes(p.key) : true).map((p) => p.key), time: o.time || Date.now(), app: o.app || "" };
}
function checkInfo(j) {
  if (!j || j.worldsBrewBridge !== VERSION) throw new Error("Not a Pixel Scape render (or from a newer version of the app).");
  if (!(j.w > 0 && j.h > 0)) throw new Error("The render's size is missing.");
  return j;
}
const groupName = (scene) => ROOT_NAME + " - " + safe(scene);
// (src w x h) -> (dst w x h), cover-fit and centred, bilinear. Matching aspect = a plain resize.
function coverResize(src, sw, sh, dw, dh) {
  if (sw === dw && sh === dh) return src;
  const out = new Uint8Array(dw * dh * 4), k = Math.max(dw / sw, dh / sh), ox = (sw * k - dw) / 2, oy = (sh * k - dh) / 2;
  for (let y = 0; y < dh; y++) {
    const fy = Math.min(sh - 1, Math.max(0, (y + oy + 0.5) / k - 0.5)), y0 = Math.floor(fy), y1 = Math.min(sh - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < dw; x++) {
      const fx = Math.min(sw - 1, Math.max(0, (x + ox + 0.5) / k - 0.5)), x0 = Math.floor(fx), x1 = Math.min(sw - 1, x0 + 1), tx = fx - x0;
      const a = (y0 * sw + x0) * 4, b = (y0 * sw + x1) * 4, c = (y1 * sw + x0) * 4, e = (y1 * sw + x1) * 4, o = (y * dw + x) * 4;
      for (let j = 0; j < 4; j++) out[o + j] = Math.round((src[a + j] * (1 - tx) + src[b + j] * tx) * (1 - ty) + (src[c + j] * (1 - tx) + src[e + j] * tx) * ty);
    }
  }
  return out;
}
// decoded picture ({ w, h, data, channels }) -> RGBA
function toRGBA(p) {
  if (p.rgba) return p.rgba instanceof Uint8Array ? p.rgba : new Uint8Array(p.rgba);
  const n = p.w * p.h, ch = p.channels || p.c || 4, d = p.data || p.d;
  if (ch === 4) return d instanceof Uint8Array ? d : new Uint8Array(d);
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) { if (ch >= 3) { out[i * 4] = d[i * ch]; out[i * 4 + 1] = d[i * ch + 1]; out[i * 4 + 2] = d[i * ch + 2]; } else { out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = d[i * ch]; } out[i * 4 + 3] = ch === 2 ? d[i * 2 + 1] : 255; }
  return out;
}

/* io = { read(path) -> Uint8Array, readText(path), write(path, Uint8Array|string), mkdir(path), list(path) -> names, stat(path) -> { mtime } | null }
   Writes a finished render: every picture first, info.json, then latest.json (the signal). pics = [{ key, png }] */
async function writeRender(io, root, o, pics) {
  const P = paths(root), folder = renderFolder(o.scene, o.date), dir = join(P.renders, folder);
  await io.mkdir(dir);
  for (const p of pics) { const def = PASSES.find((q) => q.key === p.key); if (def) await io.write(join(dir, def.file), p.png); }
  const j = info(Object.assign({}, o, { have: pics.map((p) => p.key) }));
  await io.write(join(dir, "info.json"), JSON.stringify(j, null, 1));
  await io.write(P.latest, JSON.stringify({ folder, time: j.time }));
  return { dir, folder, info: j };
}
async function readLatest(io, root) {
  const P = paths(root); let L;
  try { L = JSON.parse(await io.readText(P.latest)); } catch (e) { return null; }
  if (!L || !L.folder) return null;
  const dir = join(P.renders, L.folder);
  let j; try { j = checkInfo(JSON.parse(await io.readText(join(dir, "info.json")))); } catch (e) { return null; }
  return { dir, folder: L.folder, time: L.time, info: j };
}
async function writeDocSize(io, root, o) {
  const P = paths(root); await io.mkdir(P.bridge);
  const j = { worldsBrewBridge: VERSION, w: Math.round(o.w), h: Math.round(o.h), ppi: o.ppi || 72, doc: o.doc || "", time: o.time || Date.now() };
  await io.write(P.docSize, JSON.stringify(j)); return j;
}
async function readDocSize(io, root) { try { const j = JSON.parse(await io.readText(paths(root).docSize)); return j && j.w > 0 && j.h > 0 ? j : null; } catch (e) { return null; } }
async function writePicture(io, root, o, png) {
  const P = paths(root); await io.mkdir(P.pictures);
  const file = stamp(o.date) + "-" + safe(o.name) + ".png";
  await io.write(join(P.pictures, file), png);
  const j = { worldsBrewBridge: VERSION, file, name: safe(o.name), w: o.w, h: o.h, time: o.time || Date.now() };
  await io.write(P.picture, JSON.stringify(j)); return j;
}
async function readPicture(io, root) {
  const P = paths(root);
  try { const j = JSON.parse(await io.readText(P.picture)); if (!j || !j.file) return null; return Object.assign({ path: join(P.pictures, j.file) }, j); } catch (e) { return null; }
}

module.exports = { VERSION, ROOT_NAME, LEGACY_ROOT, PASSES, paths, join, stamp, safe, renderFolder, info, checkInfo, groupName, coverResize, toRGBA, writeRender, readLatest, writeDocSize, readDocSize, writePicture, readPicture };
