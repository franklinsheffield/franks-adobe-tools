"use strict";
// Pixel Scape (PX-10) desktop app: Electron main process.
// One window; file dialogs and file reads / writes for the renderer go over IPC.
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");

const SCENE_FILTER = [{ name: "Pixel Scape scene", extensions: ["wbscene", "json"] }];
let win = null;
let quitting = false;   // Quit (Cmd+Q) was chosen: once the renderer says it may close, the app ends too (macOS would keep it running)
app.on("before-quit", () => { quitting = true; });

function createWindow() {
  win = new BrowserWindow({
    width: 1500, height: 940, minWidth: 1100, minHeight: 700, backgroundColor: "#000000", title: "Pixel Scape",
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false, backgroundThrottling: false }
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.once("ready-to-show", () => win.show());
  // packaged-build check: WB_SELFTEST=<file.png> opens, waits for the UI, saves a screenshot and quits
  const log = []; if (process.env.WB_SELFTEST) win.webContents.on("console-message", (e, level, message, line, src) => log.push(level + " " + (message || (e && e.message)) + " " + (src || "") + ":" + (line || "")));
  if (process.env.WB_SELFTEST) win.webContents.once("did-finish-load", () => setTimeout(async () => {
    let ok = "no";
    try { ok = await win.webContents.executeJavaScript("String(!!window.__wb && window.__wb.st.scene.objs.length)"); } catch (e) { ok = "error " + e.message; }
    if (ok === "false") try { ok += " / " + await win.webContents.executeJavaScript("import('./app.js').then(() => 'imported', (e) => 'import failed: ' + e.message + ' ' + e.stack)"); } catch (e) { ok += " / " + e.message; }
    const img = await win.webContents.capturePage(); fs.writeFileSync(process.env.WB_SELFTEST, img.toPNG());
    fs.writeFileSync(process.env.WB_SELFTEST + ".txt", "ui " + ok + "\n" + log.join("\n") + "\n"); win.__closeOk = true; app.quit();
  }, 6000));
  win.on("close", (e) => {   // ask the renderer whether there are unsaved changes
    if (win.__closeOk) return;
    e.preventDefault();
    win.webContents.send("app:close-request");
  });
  win.on("closed", () => { win = null; });
}

// renderer -> main
ipcMain.handle("dlg:save", async (e, o) => {
  const r = await dialog.showSaveDialog(win, { title: o.title || "Save", defaultPath: o.name || "", filters: o.filters || SCENE_FILTER });
  return r.canceled ? null : r.filePath;
});
ipcMain.handle("dlg:open", async (e, o) => {
  const r = await dialog.showOpenDialog(win, { title: o.title || "Open", properties: (o.dirs ? ["openDirectory"] : ["openFile"]).concat(o.multi ? ["multiSelections"] : []), filters: o.filters || SCENE_FILTER });
  return r.canceled ? null : r.filePaths;
});
ipcMain.handle("dlg:ask", async (e, o) => {
  const r = await dialog.showMessageBox(win, { type: "question", message: o.message, detail: o.detail || "", buttons: o.buttons, defaultId: 0, cancelId: o.buttons.length - 1 });
  return r.response;
});
ipcMain.handle("fs:write", async (e, file, data) => { fs.writeFileSync(file, typeof data === "string" ? data : Buffer.from(data)); return true; });
ipcMain.handle("fs:read", async (e, file) => fs.readFileSync(file));
// saved surface layer stacks: userData/surface-presets/<name>.json
const presetDir = () => { const d = path.join(app.getPath("userData"), "surface-presets"); fs.mkdirSync(d, { recursive: true }); return d; };
ipcMain.handle("surf:list", () => fs.readdirSync(presetDir()).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort());
ipcMain.handle("surf:save", (e, name, json) => { const n = String(name).replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "Preset"; fs.writeFileSync(path.join(presetDir(), n + ".json"), json); return n; });
ipcMain.handle("surf:load", (e, name) => fs.readFileSync(path.join(presetDir(), String(name).replace(/[^\w\- ]+/g, "") + ".json"), "utf8"));
// 0.11 rename (Frank 2026-11-26): Worlds Lab -> Pixel Scape. The shared folder moves once, on first launch, with
// everything in it (Library, Renders, Bridge); if the move fails the old folder is copied instead, so nothing is lost.
function moveOldFolder(docs) {
  const oldDir = path.join(docs, "Worlds Lab"), newDir = path.join(docs, "Pixel Scape");
  try {
    if (!fs.existsSync(oldDir) || fs.existsSync(newDir)) return null;
    try { fs.renameSync(oldDir, newDir); } catch (e) { fs.cpSync(oldDir, newDir, { recursive: true }); }
    return newDir;
  } catch (e) { return null; }
}
ipcMain.handle("app:info", () => { const docs = app.getPath("documents"); return { version: app.getVersion(), docs, moved: moveOldFolder(docs), userData: app.getPath("userData") }; });
ipcMain.handle("app:reveal", (e, file) => { shell.showItemInFolder(file); return true; });
ipcMain.on("app:close-ok", () => { if (win) { win.__closeOk = true; win.close(); } if (quitting) app.quit(); });
ipcMain.on("app:title", (e, t) => { if (win) win.setTitle(t); });

// ---- Terrain Lab (0.11): real elevation + Sentinel-2 photos, downloaded here (no browser security limits, one cache)
const GEO = { P: require("./geo/proj.js"), NET: require("./geo/net.js"), DEM: require("./geo/dem.js"), S2: require("./geo/sentinel.js") };
const geoCache = () => GEO.NET.setCache(process.env.PX_GEO_CACHE || path.join(app.getPath("userData"), "terrain-cache"));
if (process.env.PX_GEO_OFFLINE) GEO.NET.setOffline(true);
let geoJob = 0;
// { box, grid, photoPx, season, months, scene? } -> { dem, photo, picks }; progress goes to "geo:progress"
ipcMain.handle("geo:fetch", async (e, o) => {
  geoCache(); const job = ++geoJob, send = (f, msg) => { if (job === geoJob && win) win.webContents.send("geo:progress", { f, msg }); };
  const box = o.box, dem = await GEO.DEM.heights(box, o.grid || 256, { progress: (f, m) => send(f * 0.3, m) });
  let photo = null, picks = [];
  if (o.photoPx) {
    picks = await GEO.S2.findScenes(box, { months: o.months || 12, season: o.season || "Any", date: o.date || null, progress: (f, m) => send(0.3 + f * 0.4, m) });
    if (picks.length) photo = await GEO.S2.photo(box, picks.slice(0, 3), o.photoPx, { progress: (f, m) => send(0.3 + f * 0.65, m) });
  }
  send(1, "Done");
  return { dem, photo, picks: picks.map((p) => ({ date: p.scene.date, name: p.scene.name, tile: p.tile.id, cloud: p.cloud, gap: p.gap, sun: p.sun })) };
});
ipcMain.handle("geo:tile", async (e, z, x, y) => { geoCache(); return GEO.NET.get(GEO.DEM.TERRARIUM(z, x, y)); });
// place names: OpenStreetMap Nominatim (free, light use: one search per press, with the app named)
ipcMain.handle("geo:search", async (e, q) => {
  geoCache();
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=" + encodeURIComponent(q), { headers: { "User-Agent": "PixelScape/" + app.getVersion() + " (Terrain Lab desktop app)", "Accept-Language": "en" }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error("Place search failed (" + r.status + ")");
  return (await r.json()).map((p) => ({ name: p.display_name, lat: +p.lat, lon: +p.lon, bbox: p.boundingbox ? p.boundingbox.map(Number) : null }));
});
ipcMain.handle("geo:cacheInfo", () => { const d = geoCache(); let bytes = 0; const walk = (p) => { for (const f of fs.readdirSync(p, { withFileTypes: true })) { const q = path.join(p, f.name); if (f.isDirectory()) walk(q); else bytes += fs.statSync(q).size; } }; try { walk(d); } catch (err) { /* empty */ } return { dir: d, bytes }; });
ipcMain.handle("fs:mkdir", (e, d) => { fs.mkdirSync(d, { recursive: true }); return d; });

function menu() {
  const send = (cmd) => () => { if (win) win.webContents.send("menu", cmd); };
  const mac = process.platform === "darwin";
  const tpl = [
    ...(mac ? [{ role: "appMenu" }] : []),
    { label: "File", submenu: [
      { label: "New Scene", accelerator: "CmdOrCtrl+N", click: send("new") },
      { label: "Open Scene...", accelerator: "CmdOrCtrl+O", click: send("open") },
      { type: "separator" },
      { label: "Save", accelerator: "CmdOrCtrl+S", click: send("save") },
      { label: "Save As...", accelerator: "CmdOrCtrl+Shift+S", click: send("saveAs") },
      { type: "separator" },
      { label: "Import Model...", accelerator: "CmdOrCtrl+I", click: send("importModel") },
      { label: "Terrain Lab...", accelerator: "CmdOrCtrl+T", click: send("terrainLab") },
      { label: "Render to PNG...", accelerator: "CmdOrCtrl+R", click: send("render") },
      ...(mac ? [] : [{ type: "separator" }, { role: "quit" }])
    ] },
    { label: "Edit", submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", click: send("undo") },
      { label: "Redo", accelerator: "CmdOrCtrl+Shift+Z", click: send("redo") },
      { type: "separator" },
      { role: "cut" }, { role: "copy" }, { role: "paste" },
      { label: "Duplicate", accelerator: "CmdOrCtrl+D", click: send("duplicate") },
      { type: "separator" },
      { label: "Command Palette...", accelerator: "CmdOrCtrl+K", click: send("palette") }
    ] },
    { label: "View", submenu: [
      { label: "Frame All", click: send("frameAll") },
      { label: "Home View", click: send("home") },
      { type: "separator" },
      { role: "togglefullscreen" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
      { type: "separator" }, { role: "toggleDevTools" }
    ] },
    { role: "windowMenu" }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

app.whenReady().then(() => { menu(); createWindow(); app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
