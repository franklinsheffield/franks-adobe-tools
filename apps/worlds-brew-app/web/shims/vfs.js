// Pixel Scape web build: a small in-memory file system that stands in for Node's fs in the browser.
// Files under /Documents (My library, surface presets) are kept in IndexedDB so they survive a reload.
// Writes under /Downloads become browser downloads. Uploads from the file picker land in /Uploads.
"use strict";
const { Buffer } = require("buffer");
const P = require("path-browserify");
const files = new Map(), dirs = new Set(["/"]), mtimes = new Map();
const KEEP = "/Documents/", DB = "pixel-scape-web", STORE = "files";
const norm = (p) => P.resolve("/", String(p));
const enoent = (p) => Object.assign(new Error("ENOENT: no such file or directory, '" + p + "'"), { code: "ENOENT" });
function mkdirp(d) { d = norm(d); while (d && !dirs.has(d)) { dirs.add(d); d = P.dirname(d); } }
const toBytes = (data, enc) => typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? new Uint8Array(data) : data instanceof ArrayBuffer ? new Uint8Array(data.slice(0)) : ArrayBuffer.isView(data) ? new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)) : new TextEncoder().encode(String(data));
const out = (b, enc) => (enc === "utf8" || enc === "utf-8" || (enc && enc.encoding && /utf-?8/.test(enc.encoding))) ? new TextDecoder().decode(b) : Buffer.from(b);

// ---- persistence (IndexedDB), best effort: a blocked store just means nothing survives a reload
let db = null, dirty = new Set(), timer = null;
function openDB() { return new Promise((res) => { try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); } }); }
async function load() {
  db = await openDB(); if (!db) return 0;
  return new Promise((res) => { const all = []; const tx = db.transaction(STORE, "readonly"), c = tx.objectStore(STORE).openCursor();
    c.onsuccess = () => { const cur = c.result; if (cur) { all.push([cur.key, cur.value]); cur.continue(); } else { for (const [k, v] of all) { files.set(k, new Uint8Array(v)); mtimes.set(k, Date.now()); mkdirp(P.dirname(k)); } res(all.length); } };
    c.onerror = () => res(0); });
}
function flush() { timer = null; if (!db) return; const todo = [...dirty]; dirty.clear(); try { const tx = db.transaction(STORE, "readwrite"), s = tx.objectStore(STORE); for (const k of todo) { if (files.has(k)) s.put(files.get(k), k); else s.delete(k); } } catch (e) { console.warn("vfs: save failed", e); } }
const keep = (p) => { if (p.startsWith(KEEP)) { dirty.add(p); if (!timer) timer = setTimeout(flush, 300); } };

// ---- downloads
function download(name, bytes) {
  const url = URL.createObjectURL(new Blob([bytes])), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  if (typeof window.__psWebDownload === "function") window.__psWebDownload(name, bytes);
}

function writeFileSync(p, data) {
  p = norm(p); const b = toBytes(data);
  if (p.startsWith("/Downloads/")) { download(P.basename(p), b); return; }
  mkdirp(P.dirname(p)); files.set(p, b); mtimes.set(p, Date.now()); keep(p);
}
function readFileSync(p, enc) { p = norm(p); if (!files.has(p)) throw enoent(p); return out(files.get(p), enc); }
const existsSync = (p) => { p = norm(p); return files.has(p) || dirs.has(p); };
function readdirSync(d) {
  d = norm(d); if (!dirs.has(d)) throw enoent(d); const pre = d === "/" ? "/" : d + "/", names = new Set();
  for (const k of [...files.keys(), ...dirs]) if (k.startsWith(pre) && k !== d) names.add(k.slice(pre.length).split("/")[0]);
  return [...names].sort();
}
function statSync(p) {
  p = norm(p); const isF = files.has(p), isD = dirs.has(p); if (!isF && !isD) throw enoent(p);
  return { isFile: () => isF, isDirectory: () => isD, size: isF ? files.get(p).length : 0, mtimeMs: mtimes.get(p) || 0, mtime: new Date(mtimes.get(p) || 0) };
}
function mkdirSync(d) { mkdirp(d); }
function unlinkSync(p) { p = norm(p); files.delete(p); mtimes.delete(p); keep(p); }
function rmSync(p) { p = norm(p); for (const k of [...files.keys()]) if (k === p || k.startsWith(p + "/")) unlinkSync(k); for (const k of [...dirs]) if (k === p || k.startsWith(p + "/")) dirs.delete(k); }
const wrap = (fn) => (...a) => { try { return Promise.resolve(fn(...a)); } catch (e) { return Promise.reject(e); } };
const promises = { readFile: wrap(readFileSync), writeFile: wrap(writeFileSync), mkdir: wrap(mkdirSync), readdir: wrap(readdirSync), stat: wrap(statSync), unlink: wrap(unlinkSync), rm: wrap(rmSync),
  copyFile: wrap((a, b) => writeFileSync(b, readFileSync(a))), access: wrap((p) => { if (!existsSync(p)) throw enoent(p); }) };

// object URLs for pictures in the file system (stand-in for file:// URLs)
const urls = new Map();
function objectURL(p) { p = norm(p); const m = mtimes.get(p) || 0, hit = urls.get(p); if (hit && hit.m === m) return hit.url; if (hit) URL.revokeObjectURL(hit.url);
  if (!files.has(p)) return ""; const ext = P.extname(p).slice(1).toLowerCase(), type = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" }[ext] || "";
  const url = URL.createObjectURL(new Blob([files.get(p)], type ? { type } : {})); urls.set(p, { m, url }); return url; }

module.exports = { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, unlinkSync, rmSync, promises, load, objectURL, download, _files: files };
