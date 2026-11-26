// Pixel Scape Terrain Lab (TL-11, 0.11, Frank 2026-11-26: "take a satellite photo and turn them into accurate 3D
// terrain assets"). Phase 1 = Map pick: find a place, set the box, and the app fetches the real ground heights
// (AWS Terrain Tiles) and the clearest recent Sentinel-2 photo, builds a real-scale terrain, saves it to
// My library / Terrains (glb + 16-bit heightmap + photo + terrain.json) and can add it to the scene.
// Downloads happen in the main process (main.js "geo:*"), the meshes and files are made here (geo/build.js).
import * as THREE from "three";

const req = window.require;
const { ipcRenderer } = req("electron");
const path = req("path"), fs = req("fs"), fsp = fs.promises;
const { Buffer } = req("buffer");
const P = req("../geo/proj.js"), B = req("../geo/build.js"), PNGX = req("../geo/png.js"), BL = req("../geo/buildings.js");
const { el, clear } = req("../engine/kit/ui.js");
import { createMyPhoto } from "./tlphoto.js";

export const CODE = "TL-11";
// famous landscapes to start from: [name, lat, lon, width km, depth km]
export const PLACES = [
  ["Grand Canyon, Arizona", 36.075, -112.13, 12.6, 10],
  ["Camelback Mountain, Phoenix", 33.5151, -111.9619, 4, 3],
  ["Sedona red rocks, Arizona", 34.87, -111.78, 12, 10],
  ["Monument Valley, Utah", 36.995, -110.1, 16, 12],
  ["Yosemite Valley, California", 37.735, -119.585, 12, 8],
  ["Mount St. Helens, Washington", 46.1912, -122.1944, 10, 10],
  ["Mount Rainier, Washington", 46.8523, -121.7603, 20, 20],
  ["Big Sur coast, California", 36.27, -121.81, 12, 12],
  ["Diamond Head, Hawaii", 21.2614, -157.8044, 3.5, 3],
  ["Matterhorn, Alps", 45.9763, 7.6586, 8, 8],
  ["Mount Everest, Himalaya", 27.9881, 86.925, 20, 20],
  ["Mount Fuji, Japan", 35.3606, 138.7274, 16, 16],
  ["Kilimanjaro, Tanzania", -3.0674, 37.3556, 30, 30],
  ["Table Mountain, Cape Town", -33.9628, 18.4098, 8, 6],
  ["Uluru, Australia", -25.3444, 131.0369, 6, 5],
  ["Torres del Paine, Chile", -50.97, -72.97, 20, 16],
  ["Downtown Phoenix, Arizona", 33.4484, -112.074, 2.5, 2.5],
  ["Midtown Manhattan, New York", 40.7549, -73.9840, 3, 3],
  ["San Francisco, California", 37.7930, -122.3990, 3, 3],
  ["Chicago Loop, Illinois", 41.8810, -87.6290, 3, 3]
];
const DETAILS = [256, 512, 1024, 2048], PHOTOS = [1024, 2048, 4096];
const SCENE_MAX = 384;   // grid used for the copy in the scene (the ray tracer and the live view stay quick); exports use full detail

export function createTerrainLab(ctx) {
  const tl = { quick: "", q: "", coords: "", lat: 36.075, lon: -112.13, wKm: 12.6, dKm: 10, turn: 0, exag: 1, smooth: 0, water: "off", waterM: 0,
    photo: "sat", season: "Any", photoPx: 2048, detail: 512, base: "skirt", name: "Grand Canyon, Arizona", elev: "auto", bld: "on", bScale: 1, bMin: 8 };
  const st = { tl, data: null, dataKey: "", mesh: null, bmesh: null, folder: null, busy: false, results: [] };
  const ui = ctx.createUI({ getState: () => st, onChange: () => changed(), onLive: () => changed(true) });
  const { card, segGroup, selectRow, sliderRow, textRow, row, bind, showIf } = ui;
  const btn = (l, fn, cls) => { const b = el("button", { class: cls || "btn small", text: l }); b.addEventListener("click", () => fn(b)); return ui.helpAt(b, { key: "btn:" + l, name: l, kind: "button" }); };
  const box = () => ({ lat: tl.lat, lon: tl.lon, w: tl.wKm * 1000, d: tl.dKm * 1000, turn: tl.turn });
  const boxKey = () => [tl.lat.toFixed(5), tl.lon.toFixed(5), tl.wKm, tl.dKm, tl.turn].join(",");
  const dataKey = () => boxKey() + "|" + (tl.photo === "tint" ? "tint" : "sat") + "|" + tl.season + "|" + tl.bld;   // My photo goes over the same satellite download

  // ---- layout
  const root = el("div", { id: "tlab", class: "tlab", hidden: "" });
  const head = ui.brand.header({ title: "Terrain Lab", code: CODE }); head.node.classList.add("slim");
  const side = el("div", { class: "tlside" }), mapC = el("canvas", { class: "tlmap" }), viewC = el("canvas", { class: "tl3d" });
  const readout = el("div", { class: "tlread" }), viewInfo = el("div", { class: "tlread right" });
  const status = el("div", { class: "tlstatus" }), bar = el("div", { class: "tlprog" }, [el("div", { class: "tlfill" })]);
  const mapTools = el("div", { class: "tlmaptools" }, [btn("ZOOM +", () => zoomMap(1)), btn("ZOOM -", () => zoomMap(-1)), btn("FIT BOX", () => fitBox())]);
  const viewTools = el("div", { class: "tlmaptools" }, [btn("CLOSER", () => { cam.dist = Math.max(0.6, cam.dist * 0.8); draw3d(); }), btn("FURTHER", () => { cam.dist = Math.min(8, cam.dist * 1.25); draw3d(); }), btn("TOP", () => { cam.pitch = 89; cam.yaw = 0; draw3d(); }), btn("ANGLE", () => { cam.pitch = 32; cam.yaw = 30; cam.dist = 2.6; draw3d(); })]);
  const stage = el("div", { class: "tlstage" }, [
    el("div", { class: "tlpane" }, [el("div", { class: "tlcap ctitle", text: "MAP  -  CLICK TO PLACE THE BOX, DRAG TO MOVE AROUND" }), el("div", { class: "tlcanvas" }, [mapC, mapTools, readout])]),
    el("div", { class: "tlpane" }, [el("div", { class: "tlcap ctitle", text: "3D PREVIEW  -  DRAG TO TURN" }), el("div", { class: "tlcanvas" }, [viewC, viewTools, viewInfo])])
  ]);
  const acts = {};
  const actBar = el("div", { class: "tlacts" }, [
    acts.preview = btn("Preview", () => preview(), "btn"), acts.build = btn("Build", () => build(), "btn"),
    acts.add = btn("Add to scene", () => addToScene(), "btn"), acts.exp = btn("Export...", () => exportFiles(), "btn"), acts.close = btn("Back to scene", () => close(), "btn")]);
  const foot = el("div", { class: "tlfoot" }, [el("div", { class: "tlstat" }, [status, bar]), actBar]);
  root.appendChild(el("div", { class: "tlbox" }, [head.node, el("div", { class: "tlmain" }, [side, stage]), foot]));
  ctx.mount.appendChild(root);

  // ---- My photo (0.13): your own picture over the satellite photo
  const myp = createMyPhoto({ ui, btn, st, tl, full: () => !!(st.data && st.data.full), glow: ctx.glow, ipcRenderer, root, box, say: (m, e) => say(m, e), changed: () => changed(), preview: () => preview(), remesh: () => remesh(),
    setPlace: (...a) => setPlace(...a), basePicture: () => (st.data ? basePicture(st.data) : null) });

  // ---- cards
  const results = el("div", { class: "tlresults" });
  const quickOpts = [{ v: "", l: "Famous places..." }].concat(PLACES.map((p) => ({ v: p[0], l: p[0] })));
  const placeCard = card("Place", [
    selectRow("Quick pick", "tl.quick", quickOpts, (v) => { const p = PLACES.find((x) => x[0] === v); if (p) { setPlace(p[0], p[1], p[2], p[3], p[4]); preview(); } }),
    el("div", { class: "row wrap" }, [textRow("Search", "tl.q", "Town, mountain, park..."), btn("Search", () => search())]),
    results,
    el("div", { class: "row wrap" }, [textRow("Lat, long", "tl.coords", "36.0755, -112.1300"), btn("Go", () => goCoords())]),
    el("div", { class: "hint", text: "Paste coordinates straight from Google Maps or Google Earth (right-click a spot, click the numbers)." })
  ]);
  const sizeLine = el("div", { class: "wbsize" }); bind(() => { sizeLine.textContent = tl.wKm.toFixed(1) + " x " + tl.dKm.toFixed(1) + " km  at  " + tl.lat.toFixed(4) + ", " + tl.lon.toFixed(4); });
  const areaCard = card("Area", [sizeLine, sliderRow("Width", "tl.wKm", 0.5, 50, 0.1, " km"), sliderRow("Depth", "tl.dKm", 0.5, 50, 0.1, " km"), sliderRow("Turn", "tl.turn", 0, 359, 1, " deg"),
    el("div", { class: "row wrap" }, [btn("Square", () => { tl.dKm = tl.wKm; changed(); }), btn("Half size", () => { tl.wKm = Math.max(0.5, +(tl.wKm / 2).toFixed(2)); tl.dKm = Math.max(0.5, +(tl.dKm / 2).toFixed(2)); changed(); }), btn("Double size", () => { tl.wKm = Math.min(50, +(tl.wKm * 2).toFixed(2)); tl.dKm = Math.min(50, +(tl.dKm * 2).toFixed(2)); changed(); })])]);
  const waterRow = sliderRow("Water level", "tl.waterM", -100, 5000, 1, " m"); showIf(waterRow, () => tl.water === "custom");
  const heightCard = card("Height", [
    selectRow("Elevation", "tl.elev", [{ v: "auto", l: "Auto (USA ~10 m, world ~30 m)" }]),
    sliderRow("Height scale", "tl.exag", 1, 5, 0.1, "x"), sliderRow("Smooth", "tl.smooth", 0, 4, 1, ""),
    row("Water", segGroup("tl.water", [{ v: "off", l: "Off" }, { v: "sea", l: "Sea level" }, { v: "custom", l: "Custom" }])), waterRow,
    el("div", { class: "hint", text: "1x is true scale. Water flattens everything below its level into a lake or sea surface." })]);
  const pickLine = el("div", { class: "hint" }); bind(() => { const d = st.data; pickLine.textContent = !d ? "Press Preview to find the clearest recent picture." : d.photo ? (tl.photo === "my" ? "Under your photo: " : "") + "Photo: Sentinel-2, " + d.photo.dates.join(" + ") + (d.picks[0] ? "  (" + Math.round(d.picks[0].cloud * 100) + "% cloud over the box, sun " + Math.round(d.picks[0].sun || 0) + " deg)" : "") : "No photo: coloured by height."; });
  const photoCard = card("Photo", [
    row("Photo", segGroup("tl.photo", [{ v: "sat", l: "Satellite" }, { v: "my", l: "My photo" }, { v: "tint", l: "Heights" }])), myp.rows,
    selectRow("Season", "tl.season", [{ v: "Any", l: "Any time" }, { v: "Spring", l: "Spring" }, { v: "Summer", l: "Summer" }, { v: "Autumn", l: "Autumn" }, { v: "Winter", l: "Winter" }]),
    selectRow("Photo detail", "tl.photoPx", PHOTOS.map((v) => ({ v, l: v + " px" }))), pickLine]);
  const triLine = el("div", { class: "wbsize" }); bind(() => { const n = tl.detail; triLine.textContent = (2 * (n - 1) * (n - 1)).toLocaleString() + " triangles, a point every " + Math.round(Math.max(tl.wKm, tl.dKm) * 1000 / (n - 1)) + " m"; });
  const meshCard = card("Mesh", [row("Detail", segGroup("tl.detail", DETAILS.map((v) => ({ v, l: String(v) })))), triLine,
    row("Base", segGroup("tl.base", [{ v: "skirt", l: "Solid base" }, { v: "none", l: "Surface only" }])), textRow("Name", "tl.name", "Terrain name")]);
  const bldLine = el("div", { class: "hint" });
  bind(() => { const d = st.data, b = d && d.buildings; bldLine.textContent = tl.bld !== "on" ? "Buildings are off." : !d ? "Press Preview to load the buildings." : d.buildingsError ? "Buildings could not load: " + d.buildingsError : !b ? "Press Preview to load the buildings." : !b.list.length ? "No buildings mapped in this box." : (st.bmesh ? st.bmesh.count : 0).toLocaleString() + " buildings shown (" + b.list.filter((x) => x.known !== "guess").length.toLocaleString() + " with a real height or floor count, the rest estimated)."; });
  const bldCard = card("Buildings", [row("Buildings", segGroup("tl.bld", [{ v: "on", l: "On" }, { v: "off", l: "Off" }])),
    sliderRow("Building height", "tl.bScale", 0.5, 3, 0.1, "x"), selectRow("Smallest", "tl.bMin", [{ v: 8, l: "Everything (8 m2+)" }, { v: 30, l: "No sheds (30 m2+)" }, { v: 100, l: "Houses up (100 m2+)" }, { v: 400, l: "Big buildings (400 m2+)" }]),
    bldLine, el("div", { class: "hint", text: "Outlines and heights: Overture Maps (OpenStreetMap, Microsoft, Google). Roofs take their colour from the photo." })]);
  const resLine = el("div", { class: "hint" });
  bind(() => { const m = st.mesh, d = st.data; resLine.textContent = !d ? "Nothing built yet." : (Math.round(d.box.w) / 1000).toFixed(1) + " x " + (Math.round(d.box.d) / 1000).toFixed(1) + " km, ground " + Math.round(d.dem.min) + " to " + Math.round(d.dem.max) + " m (" + Math.round(d.dem.max - d.dem.min) + " m of relief)" + (m ? ", " + m.tris.toLocaleString() + " triangles" : "") + (st.folder ? ". Saved to My library / Terrains / " + path.basename(st.folder) : d.full ? "" : ". Preview quality: press Build for full detail."); });
  const resultCard = card("Result", [resLine, el("div", { class: "hint", text: "Heights: AWS Terrain Tiles (USGS 3DEP, SRTM). Photo: Copernicus Sentinel-2 (ESA). Credits are written into terrain.json." })]);
  [placeCard, areaCard, heightCard, photoCard, meshCard, bldCard, resultCard].forEach((c) => side.appendChild(c));
  bind(() => { acts.add.disabled = !st.mesh || st.busy; acts.exp.disabled = !st.mesh || st.busy || !st.data || !st.data.full; acts.preview.disabled = st.busy; acts.build.disabled = st.busy; });

  // ---- status + progress
  let lastF = 0;
  function say(msg, err) { status.textContent = msg; status.className = "tlstatus" + (err ? " err" : ""); if (head.set) head.set(err ? "err" : st.busy ? "busy" : "ready"); }
  function progress(f) { lastF = f; bar.firstChild.style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + "%"; bar.style.visibility = f > 0 && f < 1 ? "visible" : "hidden"; }
  ipcRenderer.on("geo:progress", (e, p) => { if (st.busy) { progress(p.f); say(p.msg); } });

  function setPlace(name, lat, lon, wKm, dKm) {
    tl.lat = +lat; tl.lon = +lon; if (wKm) tl.wKm = Math.min(50, Math.max(0.5, +wKm)); if (dKm) tl.dKm = Math.min(50, Math.max(0.5, +dKm));
    if (name) tl.name = String(name).split(",").slice(0, 2).join(",").trim().slice(0, 60);
    tl.coords = tl.lat.toFixed(5) + ", " + tl.lon.toFixed(5); fitBox(); ui.refreshAll();
  }
  async function search() {
    const q = String(tl.q || "").trim(); if (!q) return say("Type a place to search for.", true);
    const ll = parseCoords(q); if (ll) { setPlace(coordName(ll), ll[0], ll[1]); return preview(); }
    say("Searching for " + q + "...");
    try {
      st.results = await ipcRenderer.invoke("geo:search", q); clear(results);
      if (!st.results.length) return say("No place called " + q + " found. Try a bigger town nearby, or paste coordinates.", true);
      st.results.slice(0, 6).forEach((r) => { const b = el("div", { class: "wbobj tlres" }, [el("span", { text: r.name.slice(0, 64) })]); b.addEventListener("click", () => pickResult(r)); ui.helpAt(b, { key: "tl.result", name: r.name.slice(0, 30), kind: "grid" }); results.appendChild(b); });
      say(st.results.length + " places found. Click one.");
    } catch (err) { say(String(err.message || err), true); }
  }
  function pickResult(r) {
    let w = tl.wKm, d = tl.dKm;
    if (r.bbox) { const bx = P.boxFromBounds(r.bbox[2], r.bbox[0], r.bbox[3], r.bbox[1]); if (bx.w > 300 && bx.w < 60000) { w = Math.min(50, bx.w / 1000 * 1.15); d = Math.min(50, bx.d / 1000 * 1.15); } }
    setPlace(r.name, r.lat, r.lon, w, d); clear(results); preview();
  }
  function parseCoords(s) {
    const m = /(-?\d+(?:\.\d+)?)\s*°?\s*([NS])?\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EW])?/i.exec(String(s || "")); if (!m) return null;
    let lat = +m[1], lon = +m[3]; if (m[2] && /s/i.test(m[2])) lat = -Math.abs(lat); if (m[4] && /w/i.test(m[4])) lon = -Math.abs(lon);
    return Math.abs(lat) <= 85 && Math.abs(lon) <= 180 ? [lat, lon] : null;
  }
  function goCoords() { const ll = parseCoords(tl.coords); if (!ll) return say("Use the form 36.0755, -112.1300 (latitude, longitude).", true); setPlace(coordName(ll), ll[0], ll[1]); preview(); }
  const coordName = (ll) => "Place " + (+ll[0]).toFixed(4) + " " + (+ll[1]).toFixed(4);   // typed coordinates: a new place, so not the old name

  // ---- fetching and building
  async function fetchData(grid, photoPx, full) {
    if (st.busy) return null;
    st.busy = true; ui.refreshAll(); progress(0.01); say("Fetching heights and photo...");
    try {
      const b = box(), r = await ipcRenderer.invoke("geo:fetch", { box: b, grid, photoPx: tl.photo !== "tint" ? photoPx : 0, season: tl.season, buildings: tl.bld === "on" });
      r.box = b; r.full = full; r.key = dataKey(); st.data = r; st.folder = null; return r;
    } catch (err) { say(String((err && err.message) || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, ""), true); return null; }
    finally { st.busy = false; progress(1); ui.refreshAll(); }
  }
  async function preview() {
    const r = await fetchData(160, 640, false); if (!r) return;
    remesh(); say("Preview ready. Press Build for the full-detail terrain (" + tl.detail + " grid, " + tl.photoPx + " px photo).");
  }
  async function build() {
    const t0 = performance.now(), r = await fetchData(tl.detail, tl.photoPx, true); if (!r) return null;
    remesh(); say("Saving to My library...");
    try { st.folder = await saveToLibrary(); ctx.libChanged && ctx.libChanged(); say("Built in " + ((performance.now() - t0) / 1000).toFixed(1) + " s and saved to My library / Terrains / " + path.basename(st.folder) + ". Add it to the scene or export it."); }
    catch (err) { say("Built, but saving failed: " + (err.message || err), true); }
    ui.refreshAll(); return st.folder;
  }
  const meshOpts = (n) => ({ n, exag: tl.exag, smooth: tl.smooth, water: tl.water === "off" ? null : tl.water === "sea" ? 0 : tl.waterM, base: tl.base });
  // with a base, the texture carries a band of earth layers under the photo for the walls (photo.jpg stays plain)
  const banded = (pic) => (tl.base === "skirt" ? B.addBand(pic) : pic);
  let remeshT = null;
  function remesh() {
    const d = st.data; if (!d) return;
    st.mesh = B.grid(d.dem, d.box, meshOpts(d.dem.n)); st.pic = picture(d); st.bmesh = bmesh(st.mesh); show3d(st.mesh, banded(st.pic), st.bmesh); ui.refreshAll();
  }
  // the buildings, seated on this terrain mesh (same metres, same lowest point)
  function bmesh(m) {
    const d = st.data; if (!d || tl.bld !== "on" || !d.buildings || !d.buildings.list.length) return null;
    const list = d.buildings.list.filter((b) => b.foot >= tl.bMin); if (!list.length) return null;
    return BL.mesh(list, d.dem, d.box, { lo: m.minH, exag: m.exag, water: meshOpts(0).water }, { scale: tl.bScale, photo: st.pic || d.photo });
  }
  // the texture: the photo, with height colours wherever there is no photo
  function picture(d) { return myp.compose(basePicture(d), d.box); }   // My photo goes over the satellite / height colours
  function basePicture(d) {
    if (d.photo && d.photo.missing < 0.999) { if (d.photo.missing > 0) fillTint(d.photo, d); return d.photo; }
    const n = Math.min(1024, Math.max(256, d.dem.n * 2)), pic = { w: n, h: Math.round(n * d.box.d / d.box.w), d: null }; pic.d = new Uint8Array(pic.w * pic.h * 4); fillTint(pic, d); return pic;
  }
  function fillTint(pic, d) {
    const { n, h, min, max } = d.dem, span = Math.max(1, max - min), step = Math.max(d.box.w, d.box.d) / (n - 1);
    for (let y = 0; y < pic.h; y++) for (let x = 0; x < pic.w; x++) {
      const q = (y * pic.w + x) * 4; if (pic.d[q + 3]) continue;
      const i = Math.min(n - 2, Math.floor(x / pic.w * (n - 1))), j = Math.min(n - 2, Math.floor(y / pic.h * (n - 1))), p = j * n + i, v = (h[p] - min) / span;
      const sh = Math.max(0.35, Math.min(1.25, 0.85 + ((h[p] - h[p + 1]) + (h[p] - h[p + n])) / step * 0.6));
      const c = tint(v, h[p]); pic.d[q] = c[0] * sh; pic.d[q + 1] = c[1] * sh; pic.d[q + 2] = c[2] * sh; pic.d[q + 3] = 255;
    }
  }

  // ---- files: library folder + export
  async function jpeg(pic, q) {
    const c = document.createElement("canvas"); c.width = pic.w; c.height = pic.h; const g = c.getContext("2d"), im = g.createImageData(pic.w, pic.h); im.data.set(pic.d); g.putImageData(im, 0, 0);
    const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", q || 0.9)); return new Uint8Array(await blob.arrayBuffer());
  }
  function small(pic, w) { const c = document.createElement("canvas"); c.width = pic.w; c.height = pic.h; const g = c.getContext("2d"), im = g.createImageData(pic.w, pic.h); im.data.set(pic.d); g.putImageData(im, 0, 0);
    const k = document.createElement("canvas"); k.width = w; k.height = Math.round(w * pic.h / pic.w); k.getContext("2d").drawImage(c, 0, 0, k.width, k.height); const d = k.getContext("2d").getImageData(0, 0, k.width, k.height); return { w: k.width, h: k.height, d: new Uint8Array(d.data.buffer) }; }
  async function files(name) {
    const d = st.data, mesh = B.grid(d.dem, d.box, meshOpts(d.dem.n)), photo = await jpeg(st.pic, 0.9), tex = tl.base === "skirt" ? await jpeg(banded(st.pic), 0.9) : photo;
    const out = {
      glb: B.glb(mesh, { bytes: tex, mime: "image/jpeg" }, name, { buildings: bmesh(mesh) }), photo, height: PNGX.encodeGray16(d.dem.n, d.dem.n, B.heightValues(d.dem)), thumb: await jpeg(small(st.pic, 192), 0.82),
      info: Object.assign(B.info({ name, box: d.box, dem: d.dem, photo: d.photo, exag: tl.exag, app: "Pixel Scape " + (ctx.version || ""), files: ["terrain.glb", "height16.png", "photo.jpg", "thumb.jpg"].concat(st.bmesh ? ["buildings.json"] : []) }), bldInfo()), mesh,
      buildings: st.bmesh ? JSON.stringify({ release: d.buildings.release, list: d.buildings.list.filter((b) => b.foot >= tl.bMin).map((b) => ({ id: b.id, rings: b.rings.map((r) => r.map((p) => [+p[0].toFixed(2), +p[1].toFixed(2)])), seams: b.seams, foot: b.foot, height: b.height, base: b.base, known: b.known, roof: b.roof, wall: b.wall, part: b.part })) }) : null
    };
    if (out.info.credits && out.info.buildings) out.info.credits.push(out.info.buildings.credit);   // saved and exported files both credit the buildings
    const mine = myp.info(); if (mine) { out.info.myPhoto = mine; if (out.info.credits) out.info.credits.unshift("Photo: " + mine.file + " (your own picture), placed by " + mine.placed); }
    return out;
  }
  function bldInfo() {
    const d = st.data; if (!st.bmesh || !d.buildings) return {};
    return { buildings: { count: st.bmesh.count, heightScale: tl.bScale, smallestM2: tl.bMin, source: "Overture Maps buildings " + d.buildings.release, credit: d.buildings.credit, mesh: "second node in terrain.glb (vertex colours)" } };
  }
  async function saveToLibrary() {
    const dir = ctx.terrainsDir(); if (!dir) throw new Error("the library folder isn't ready");
    const base = String(tl.name || "Terrain").replace(/[^\w\- ,.]+/g, "").replace(/[,.]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 50) || "Terrain";
    let n = base, i = 2; while (fs.existsSync(path.join(dir, n))) n = base + " " + i++;
    const f = await files(n), out = path.join(dir, n); await fsp.mkdir(out, { recursive: true });
    if (f.buildings) await fsp.writeFile(path.join(out, "buildings.json"), f.buildings);
    await fsp.writeFile(path.join(out, "terrain.glb"), f.glb); await fsp.writeFile(path.join(out, "height16.png"), f.height); await fsp.writeFile(path.join(out, "photo.jpg"), f.photo); await fsp.writeFile(path.join(out, "thumb.jpg"), f.thumb);
    f.info.mesh = { grid: tl.detail, base: tl.base, smooth: tl.smooth, water: tl.water === "off" ? null : tl.water === "sea" ? 0 : tl.waterM };
    await fsp.writeFile(path.join(out, "terrain.json"), JSON.stringify(f.info, null, 1));
    return out;
  }
  async function exportFiles() {
    if (!st.data || !st.data.full) return say("Build first: exports use the full-detail terrain.", true);
    const p = await ipcRenderer.invoke("dlg:save", { title: "Export terrain", name: (tl.name || "Terrain").replace(/[^\w\- ]+/g, "").trim() + ".glb", filters: [{ name: "glTF binary", extensions: ["glb"] }] }); if (!p) return;
    const stem = p.replace(/\.glb$/i, ""), f = await files(path.basename(stem));
    await fsp.writeFile(stem + ".glb", f.glb); await fsp.writeFile(stem + "-height16.png", f.height); await fsp.writeFile(stem + "-photo.jpg", f.photo); await fsp.writeFile(stem + ".json", JSON.stringify(f.info, null, 1));
    say("Exported " + path.basename(stem) + ".glb (+ height16.png, photo.jpg, .json): real metres, Y up.");
  }
  function addToScene() {
    if (!st.mesh || !st.data) return;
    const d = st.data, n = Math.min(SCENE_MAX, d.dem.n), mesh = B.grid(d.dem, d.box, meshOpts(n)), pic = banded(st.pic.w > 2048 ? small(st.pic, 2048) : st.pic);
    ctx.addTerrain({ name: tl.name || "Terrain", mesh, pic, buildings: bmesh(mesh), info: { lat: d.box.lat, lon: d.box.lon, w: d.box.w, d: d.box.d, min: d.dem.min, max: d.dem.max, exag: tl.exag, folder: st.folder } });
    say("Added " + (tl.name || "the terrain") + " to the scene (" + mesh.tris.toLocaleString() + " triangles). Close Terrain Lab to see it.");
  }

  // ---- the map: elevation tiles drawn as shaded relief, with the box on top
  const map = { z: 11, cx: 0, cy: 0, tiles: new Map(), want: new Set(), drag: null, hover: null };
  function centreMap(lon, lat, z) { if (z) map.z = z; const t = P.tileXY(lon, lat, map.z); map.cx = t.x * 256; map.cy = t.y * 256; drawMap(); }
  function fitBox() { const F = P.boxFrame(box()), span = Math.max(F.east - F.west, (F.north - F.south) * 1.3); let z = 14; const W = Math.max(200, mapC.clientWidth || 600); while (z > 2 && span / 360 * 256 * 2 ** z > W * 0.7) z--; centreMap(tl.lon, tl.lat, z); }
  function zoomMap(k) { const ll = P.tileLonLat(map.cx / 256, map.cy / 256, map.z); map.z = Math.max(2, Math.min(15, map.z + k)); centreMap(ll.lon, ll.lat); }
  const toScreen = (lon, lat) => { const t = P.tileXY(lon, lat, map.z); return [t.x * 256 - map.cx + mapC.width / 2, t.y * 256 - map.cy + mapC.height / 2]; };
  const toLonLat = (x, y) => P.tileLonLat((x - mapC.width / 2 + map.cx) / 256, (y - mapC.height / 2 + map.cy) / 256, map.z);
  function shadeTile(z, x, y, buf) {
    const im = PNGX.decode(Buffer.from(buf)), hgt = new Float32Array(65536); for (let i = 0; i < 65536; i++) { const q = i * im.ch; hgt[i] = im.d[q] * 256 + im.d[q + 1] + im.d[q + 2] / 256 - 32768; }
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), out = g.createImageData(256, 256), lat = P.tileLonLat(x + 0.5, y + 0.5, z).lat, px = P.tilePixelM(lat, z);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const p = j * 256 + i, hx = hgt[p + (i < 255 ? 1 : 0)] - hgt[p - (i > 0 ? 1 : 0)], hy = hgt[p + (j < 255 ? 256 : 0)] - hgt[p - (j > 0 ? 256 : 0)];
      const nx = -hx / (2 * px), ny = -hy / (2 * px), l = (nx * -0.6 + ny * -0.6 + 1) / Math.sqrt(nx * nx + ny * ny + 1) / 1.25, sh = Math.max(0.25, Math.min(1.3, 0.35 + l * 0.85));
      const c4 = mapShade(hgt[p] < 2 && Math.abs(hx) + Math.abs(hy) < 0.05 ? 0 : hgt[p]), q = p * 4;   // dead-flat ground just above 0 is sea (US data puts the sea at ~1.2 m)
      out.data[q] = c4[0] * sh; out.data[q + 1] = c4[1] * sh; out.data[q + 2] = c4[2] * sh; out.data[q + 3] = 255;
    }
    g.putImageData(out, 0, 0); return { c, hgt };
  }
  let inflight = 0;
  function needTile(z, x, y) {
    const k = z + "/" + x + "/" + y; if (map.tiles.has(k) || map.want.has(k) || inflight > 8) return; map.want.add(k); inflight++;
    ipcRenderer.invoke("geo:tile", z, x, y).then((buf) => { if (buf) map.tiles.set(k, shadeTile(z, x, y, buf)); else map.tiles.set(k, null); }).catch(() => {}).finally(() => { inflight--; map.want.delete(k); if (map.tiles.size > 400) map.tiles.delete(map.tiles.keys().next().value); drawMap(); });
  }
  function drawMap() {
    if (root.hidden) return;
    const W = mapC.clientWidth, H = mapC.clientHeight; if (!W || !H) return; if (mapC.width !== W || mapC.height !== H) { mapC.width = W; mapC.height = H; }
    const g = mapC.getContext("2d"), z = map.z, n = 2 ** z; g.fillStyle = "#03060a"; g.fillRect(0, 0, W, H);
    const x0 = Math.floor((map.cx - W / 2) / 256), x1 = Math.floor((map.cx + W / 2) / 256), y0 = Math.max(0, Math.floor((map.cy - H / 2) / 256)), y1 = Math.min(n - 1, Math.floor((map.cy + H / 2) / 256));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const wx = ((x % n) + n) % n, k = z + "/" + wx + "/" + y, t = map.tiles.get(k), sx = Math.round(x * 256 - map.cx + W / 2), sy = Math.round(y * 256 - map.cy + H / 2);
      if (t) g.drawImage(t.c, sx, sy); else { needTile(z, wx, y); const up = map.tiles.get((z - 1) + "/" + (wx >> 1) + "/" + (y >> 1)); if (up) g.drawImage(up.c, (wx & 1) * 128, (y & 1) * 128, 128, 128, sx, sy, 256, 256); }
    }
    // the box
    const F = P.boxFrame(box()), pts = F.corners.map((c) => toScreen(c.lon, c.lat));
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    g.fillStyle = "rgba(94,255,200,0.10)"; g.fill(); g.lineWidth = 2; g.strokeStyle = ctx.glow; g.stroke();
    const nm = toScreen(F.at(0.5, 0).lon, F.at(0.5, 0).lat); g.fillStyle = ctx.glow; g.font = "11px -apple-system, sans-serif"; g.fillText("N", nm[0] - 3, nm[1] - 5);
    const fp = tl.photo === "my" ? myp.footprint() : null;   // where your photo lies
    if (fp) { const q = fp.map((p) => toScreen(p.lon, p.lat)); g.setLineDash([6, 4]); g.strokeStyle = "#ffd166"; g.lineWidth = 2; g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke(); g.setLineDash([]); g.fillStyle = "#ffd166"; g.fillText("MY PHOTO", q[0][0] + 4, q[0][1] + 13); }
    const c = toScreen(tl.lon, tl.lat); g.strokeStyle = "#ffffff"; g.lineWidth = 1; g.beginPath(); g.moveTo(c[0] - 7, c[1]); g.lineTo(c[0] + 7, c[1]); g.moveTo(c[0], c[1] - 7); g.lineTo(c[0], c[1] + 7); g.stroke();
    // scale bar
    const ll = toLonLat(W / 2, H / 2), mpp = P.tilePixelM(ll.lat, z), nice = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000].find((m) => m / mpp > 70) || 1000000, len = nice / mpp;
    g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(8, H - 26, len + 16, 18); g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(16, H - 14); g.lineTo(16 + len, H - 14); g.stroke(); g.fillStyle = "#fff"; g.fillText(nice >= 1000 ? nice / 1000 + " km" : nice + " m", 20 + len, H - 12);
    g.fillStyle = "rgba(255,255,255,0.55)"; g.fillText("Relief: AWS Terrain Tiles", W - 140, H - 8);
    const hv = map.hover; readout.textContent = hv ? hv.lat.toFixed(4) + ", " + hv.lon.toFixed(4) + (hv.h != null ? "   " + Math.round(hv.h).toLocaleString() + " m" : "") : "zoom " + z;
  }
  function heightUnder(lon, lat) { const t = P.tileXY(lon, lat, map.z), k = map.z + "/" + Math.floor(t.x) + "/" + Math.floor(t.y), T = map.tiles.get(k); return T ? T.hgt[Math.floor((t.y % 1) * 256) * 256 + Math.floor((t.x % 1) * 256)] : null; }
  mapC.addEventListener("pointerdown", (e) => { map.drag = { x: e.clientX, y: e.clientY, cx: map.cx, cy: map.cy, moved: false }; mapC.setPointerCapture(e.pointerId); });
  mapC.addEventListener("pointermove", (e) => {
    const r = mapC.getBoundingClientRect(), ll = toLonLat(e.clientX - r.left, e.clientY - r.top); map.hover = { lat: ll.lat, lon: ll.lon, h: heightUnder(ll.lon, ll.lat) };
    const d = map.drag; if (d) { const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true; if (d.moved) { map.cx = d.cx - dx; map.cy = d.cy - dy; } }
    drawMap();
  });
  mapC.addEventListener("pointerup", (e) => { const d = map.drag; map.drag = null; if (d && !d.moved) { const r = mapC.getBoundingClientRect(), ll = toLonLat(e.clientX - r.left, e.clientY - r.top); tl.lat = +ll.lat.toFixed(6); tl.lon = +ll.lon.toFixed(6); tl.coords = tl.lat.toFixed(5) + ", " + tl.lon.toFixed(5); st.data = null; st.mesh = null; ui.refreshAll(); drawMap(); say("Box moved. Press Preview."); } });
  mapC.addEventListener("pointerleave", () => { map.hover = null; drawMap(); });
  mapC.addEventListener("dblclick", (e) => { const r = mapC.getBoundingClientRect(), ll = toLonLat(e.clientX - r.left, e.clientY - r.top); map.z = Math.min(15, map.z + 1); centreMap(ll.lon, ll.lat); });

  // ---- the 3D preview
  const R = new THREE.WebGLRenderer({ canvas: viewC, antialias: true, preserveDrawingBuffer: true }); R.outputColorSpace = THREE.SRGBColorSpace;
  R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));   // 0.14: full sharpness on Retina screens
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1016);
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x3a2c22, 1.35)); const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-1, 1.4, -0.6); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 50), cam = { yaw: 30, pitch: 32, dist: 2.6 };
  let meshNode = null, bNode = null;
  function show3d(m, pic, bm) {
    if (bNode) { scene.remove(bNode); bNode.geometry.dispose(); bNode.material.dispose(); bNode = null; }
    if (bm) {
      const k = 2 / Math.max(m.w, m.d), p = new Float32Array(bm.pos.length), c = new Float32Array(bm.col.length); for (let i = 0; i < p.length; i++) p[i] = bm.pos[i] * k;
      for (let i = 0; i < c.length; i++) { const v = bm.col[i] / 255; c[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("normal", new THREE.BufferAttribute(bm.nrm, 3)); g.setAttribute("color", new THREE.BufferAttribute(c, 3)); g.setIndex(new THREE.BufferAttribute(bm.idx, 1));
      bNode = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 })); scene.add(bNode);
    }
    if (meshNode) { scene.remove(meshNode); meshNode.geometry.dispose(); if (meshNode.material.map) meshNode.material.map.dispose(); meshNode.material.dispose(); }
    const k = 2 / Math.max(m.w, m.d), pos = new Float32Array(m.pos.length); for (let i = 0; i < pos.length; i++) pos[i] = m.pos[i] * k;
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.BufferAttribute(m.nrm, 3)); g.setAttribute("uv", new THREE.BufferAttribute(m.uv, 2)); g.setIndex(new THREE.BufferAttribute(m.idx, 1));
    const tex = new THREE.DataTexture(pic.d, pic.w, pic.h, THREE.RGBAFormat); tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 8; tex.needsUpdate = true;
    meshNode = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0, side: THREE.DoubleSide })); scene.add(meshNode);
    viewInfo.textContent = (m.w / 1000).toFixed(1) + " x " + (m.d / 1000).toFixed(1) + " km, " + Math.round((m.maxH - m.minH) * m.exag) + " m relief" + (m.exag !== 1 ? " (x" + m.exag + ")" : "");
    draw3d();
  }
  function draw3d() {
    if (root.hidden) return;
    const W = viewC.clientWidth, H = viewC.clientHeight; if (!W || !H) return; R.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    const yw = cam.yaw * Math.PI / 180, pt = cam.pitch * Math.PI / 180; camera.position.set(Math.sin(yw) * Math.cos(pt) * cam.dist, Math.sin(pt) * cam.dist + 0.05, Math.cos(yw) * Math.cos(pt) * cam.dist); camera.lookAt(0, 0.05, 0);
    R.render(scene, camera);
  }
  let vdrag = null;
  viewC.addEventListener("pointerdown", (e) => { vdrag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch }; viewC.setPointerCapture(e.pointerId); });
  viewC.addEventListener("pointermove", (e) => { if (!vdrag) return; cam.yaw = vdrag.yaw - (e.clientX - vdrag.x) * 0.4; cam.pitch = Math.max(5, Math.min(89, vdrag.pitch + (e.clientY - vdrag.y) * 0.3)); draw3d(); });
  viewC.addEventListener("pointerup", () => { vdrag = null; });

  // ---- changes
  function changed(live) {
    const key = dataKey();
    if (st.data && st.data.key !== key) { st.data = null; st.mesh = null; st.folder = null; say("Area changed. Press Preview."); }
    if (st.data) { clearTimeout(remeshT); remeshT = setTimeout(() => { remesh(); }, live ? 120 : 0); if (st.folder) st.folder = null; }
    ui.refreshAll(); drawMap();
  }
  const ro = new ResizeObserver(() => { drawMap(); draw3d(); }); ro.observe(mapC.parentElement); ro.observe(viewC.parentElement);

  function open() { root.hidden = false; ui.refreshAll(); requestAnimationFrame(() => { if (!map.cx) fitBox(); drawMap(); draw3d(); }); say(st.data ? "Ready." : "Pick a place: a famous one, a search, coordinates, or click the map. Then press Preview."); }
  function close() { root.hidden = true; ctx.closed && ctx.closed(); }
  document.addEventListener("keydown", (e) => { if (!root.hidden && e.key === "Escape") { e.stopPropagation(); if (myp.pin) myp.pin.finish(false); else close(); } }, true);
  ui.refreshAll(); progress(1);
  return { open, close, get isOpen() { return !root.hidden; }, root, ui, st, tl, myp, dataKey, box, changed, preview, build, remesh, addToScene, exportFiles, setPlace, search, pickResult, parseCoords, fitBox, drawMap, files, saveToLibrary, map };
}

// the map: neutral grey relief (a little lighter up high), blue water
function mapShade(m) { if (m <= 0) return [44, 78, 112]; const g = 150 + Math.min(1, m / 4000) * 60; return [g, g, g * 1.02]; }
// height colours: sea blue, then green lowlands, tan, rock brown, snow
export function tint(v, metres) {
  if (metres <= 0) return [28, 62, 96];
  const stops = [[0, [74, 112, 68]], [0.18, [118, 140, 82]], [0.38, [176, 158, 112]], [0.62, [140, 108, 80]], [0.85, [190, 184, 178]], [1, [245, 246, 248]]];
  for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) { const a = stops[i - 1], b = stops[i], t = (v - a[0]) / (b[0] - a[0]); return [0, 1, 2].map((k) => a[1][k] + (b[1][k] - a[1][k]) * t); }
  return stops[stops.length - 1][1];
}
