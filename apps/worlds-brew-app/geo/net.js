"use strict";
// Pixel Scape Terrain Lab: downloads with a disk cache (plain Node; the app runs it in the main process).
// Every download (a whole file, or a byte range of a big picture file) is kept in the cache folder under a hash of
// its address, so building the same area again works offline and is instant.
const fs = require("fs"), path = require("path"), crypto = require("crypto");

let CACHE = null, OFFLINE = false;
const stats = { hits: 0, downloads: 0, bytes: 0 };
function setCache(dir) { CACHE = dir; if (dir) fs.mkdirSync(dir, { recursive: true }); return dir; }
function setOffline(v) { OFFLINE = !!v; }   // tests: cache only, never the network
const keyOf = (url, range) => crypto.createHash("sha1").update(url + (range ? "#" + range[0] + "-" + range[1] : "")).digest("hex");
function cachePath(url, range) { const k = keyOf(url, range); return path.join(CACHE, k.slice(0, 2), k); }

async function fetchRetry(url, opt, tries) {
  let err = null;
  for (let i = 0; i < (tries || 3); i++) {
    try {
      const r = await fetch(url, Object.assign({ signal: AbortSignal.timeout(45000) }, opt));
      if (r.status === 404) { const e = new Error("not found: " + url); e.status = 404; throw e; }
      if (!r.ok && r.status !== 206) throw new Error("download failed (" + r.status + "): " + url);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { err = e; if (e.status === 404) throw e; await new Promise((res) => setTimeout(res, 400 * (i + 1))); }
  }
  throw err;
}
// bytes of url (or of range [start, end] inclusive); 404 -> null
async function get(url, range) {
  const p = CACHE ? cachePath(url, range) : null;
  if (p && fs.existsSync(p)) { stats.hits++; const b = fs.readFileSync(p); return b.length === 1 && b[0] === 0 ? null : b; }
  if (OFFLINE) throw new Error("not in the cache (offline): " + url);
  let b = null;
  try { b = await fetchRetry(url, range ? { headers: { Range: "bytes=" + range[0] + "-" + range[1] } } : {}); }
  catch (e) { if (e.status !== 404) throw e; }
  stats.downloads++; stats.bytes += b ? b.length : 0;
  if (p) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, b || Buffer.from([0])); }
  return b;
}
const getText = async (url) => { const b = await get(url); return b ? b.toString("utf8") : null; };
// small run-at-most-n-at-once helper for many downloads
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
// a list that must not come from an old cache (the newest pictures): kept for a day only
async function getFresh(url, maxAgeMs) {
  const p = CACHE ? cachePath(url) : null;
  if (p && fs.existsSync(p) && !OFFLINE && Date.now() - fs.statSync(p).mtimeMs > (maxAgeMs || 86400000)) fs.unlinkSync(p);
  return getText(url);
}

module.exports = { setCache, setOffline, get, getText, getFresh, pool, stats, cachePath };
