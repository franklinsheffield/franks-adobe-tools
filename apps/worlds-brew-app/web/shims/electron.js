// Pixel Scape web build: stands in for Electron's ipcRenderer. Each main-process handler in ../main.js has a browser
// version here: file picker for Open/Import, downloads for Save, the web file system for presets and the library,
// and Terrain Lab's downloads (geo/*.js) run right in the page.
"use strict";
const P = require("path-browserify");
const VFS = require("./vfs.js");
const VERSION = require("../../package.json").version;
const listeners = new Map();
const emit = (ch, ...a) => (listeners.get(ch) || []).forEach((fn) => { try { fn({}, ...a); } catch (e) { console.error(e); } });

// ---- file picker: copies the chosen files into /Uploads and returns their paths (null when cancelled)
let upN = 0;
function pick(o) {
  return new Promise((res) => {
    const inp = document.createElement("input"); inp.type = "file"; inp.multiple = !!o.multi; inp.style.display = "none";
    if (o.dirs) inp.webkitdirectory = true;
    const ex = (o.filters || []).flatMap((f) => f.extensions || []); if (ex.length && !o.dirs) inp.accept = ex.map((e) => "." + e).join(",");
    // phones: list image/* too, so the picker offers the camera as well as the photo library (My photo, surface pictures)
    if (inp.accept && /\.(jpe?g|png)\b/.test(inp.accept) && window.matchMedia && window.matchMedia("(pointer: coarse)").matches) inp.accept += ",image/*";
    let done = false; const finish = (v) => { if (!done) { done = true; inp.remove(); res(v); } };
    inp.addEventListener("cancel", () => finish(null));
    inp.addEventListener("change", async () => {
      const list = [...inp.files]; if (!list.length) return finish(null);
      const base = "/Uploads/" + (++upN), tops = new Set();
      for (const f of list) { const rel = f.webkitRelativePath || f.name, p = P.join(base, rel); VFS.writeFileSync(p, new Uint8Array(await f.arrayBuffer())); tops.add(o.dirs ? P.join(base, rel.split("/")[0]) : p); }
      finish([...tops]);
    });
    document.body.appendChild(inp); inp.click();
  });
}
// ---- a small in-page question box (browser confirm() has no third button, and Discord's frame blocks it)
function ask(o) {
  return new Promise((res) => {
    const wrap = document.createElement("div"); wrap.className = "ps-web-ask";
    wrap.innerHTML = '<div class="ps-web-ask-box"><div class="ps-web-ask-msg"></div><div class="ps-web-ask-detail"></div><div class="ps-web-ask-row"></div></div>';
    wrap.querySelector(".ps-web-ask-msg").textContent = o.message || ""; wrap.querySelector(".ps-web-ask-detail").textContent = o.detail || "";
    (o.buttons || ["OK"]).forEach((t, i) => { const b = document.createElement("button"); b.textContent = t; b.onclick = () => { wrap.remove(); res({ response: i }); }; wrap.querySelector(".ps-web-ask-row").appendChild(b); });
    document.body.appendChild(wrap);
  });
}
// ---- Terrain Lab (main.js geo:* handlers, same steps)
let GEO = null, geoJob = 0;
const geo = () => GEO || (GEO = { P: require("../../geo/proj.js"), NET: require("../../geo/net.js"), DEM: require("../../geo/dem.js"), S2: require("../../geo/sentinel.js"), BL: require("../../geo/buildings.js") });
async function geoFetch(o) {
  const G = geo(), job = ++geoJob, send = (f, msg) => { if (job === geoJob) emit("geo:progress", { f, msg }); };
  const box = o.box, dem = await G.DEM.heights(box, o.grid || 256, { progress: (f, m) => send(f * 0.3, m) });
  let photo = null, picks = [];
  if (o.photoPx) {
    picks = await G.S2.findScenes(box, { months: o.months || 12, season: o.season || "Any", date: o.date || null, progress: (f, m) => send(0.3 + f * 0.4, m) });
    if (picks.length) photo = await G.S2.photo(box, picks.slice(0, 3), o.photoPx, { progress: (f, m) => send(0.3 + f * 0.65, m) });
  }
  let buildings = null, bErr = null;
  if (o.buildings) { try { buildings = await G.BL.fetch(box, { progress: (f, m) => send(0.95 + f * 0.05, m) }); } catch (err) { bErr = String(err.message || err); } }
  send(1, "Done");
  return { dem, photo, buildings, buildingsError: bErr, picks: picks.map((p) => ({ date: p.scene.date, name: p.scene.name, tile: p.tile.id, cloud: p.cloud, gap: p.gap, sun: p.sun })) };
}
async function geoSearch(q) {
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=" + encodeURIComponent(q), { headers: { "Accept-Language": "en" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error("Place search failed (" + r.status + ")");
  return (await r.json()).map((p) => ({ name: p.display_name, lat: +p.lat, lon: +p.lon, bbox: p.boundingbox ? p.boundingbox.map(Number) : null }));
}
const presetDir = "/Documents/Pixel Scape/Surface Presets";
const clean = (n) => String(n).replace(/[^\w\- ]+/g, "").trim().slice(0, 60);
const handlers = {
  "dlg:open": (o) => pick(o || {}),
  "dlg:save": (o) => "/Downloads/" + ((o && o.name) || "Untitled"),
  "dlg:ask": (o) => ask(o || {}),
  "fs:read": (p) => VFS.readFileSync(p),
  "fs:write": (p, data) => { VFS.writeFileSync(p, data); return true; },
  "fs:mkdir": (d) => { VFS.mkdirSync(d); return d; },
  "surf:list": () => { VFS.mkdirSync(presetDir); return VFS.readdirSync(presetDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort(); },
  "surf:save": (name, json) => { const n = clean(name) || "Preset"; VFS.writeFileSync(P.join(presetDir, n + ".json"), json); return n; },
  "surf:load": (name) => VFS.readFileSync(P.join(presetDir, clean(name) + ".json"), "utf8"),
  "app:info": () => ({ version: VERSION, docs: "/Documents", moved: false, userData: "/userData", web: true }),
  "app:reveal": () => true,
  "geo:fetch": geoFetch,
  "geo:tile": (z, x, y) => { const G = geo(); return G.NET.get(G.DEM.TERRARIUM(z, x, y)); },
  "geo:search": geoSearch,
  "geo:cacheInfo": () => ({ dir: "(browser)", bytes: 0 })
};
const ipcRenderer = {
  invoke: async (ch, ...a) => { const h = handlers[ch]; if (!h) throw new Error("web build: no handler for " + ch); const r = await h(...a); return ch === "dlg:ask" ? r.response : r; },
  send: (ch, ...a) => { if (ch === "app:title") document.title = String(a[0]).replace(/\s+-\s+Pixel Scape$/, "") + " - Pixel Scape"; },
  on: (ch, fn) => { if (!listeners.has(ch)) listeners.set(ch, []); listeners.get(ch).push(fn); return ipcRenderer; },
  removeListener: (ch, fn) => { const l = listeners.get(ch) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); return ipcRenderer; },
  emit
};
module.exports = { ipcRenderer, shell: { openExternal: (u) => window.open(u, "_blank", "noopener") } };
