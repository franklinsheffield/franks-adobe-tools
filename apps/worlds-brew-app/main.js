"use strict";
// Worlds Lab (WB-10) desktop app: Electron main process.
// One window; file dialogs and file reads / writes for the renderer go over IPC.
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");

const SCENE_FILTER = [{ name: "Worlds Lab scene", extensions: ["wbscene", "json"] }];
let win = null;
let quitting = false;   // Quit (Cmd+Q) was chosen: once the renderer says it may close, the app ends too (macOS would keep it running)
app.on("before-quit", () => { quitting = true; });

function createWindow() {
  win = new BrowserWindow({
    width: 1500, height: 940, minWidth: 1100, minHeight: 700, backgroundColor: "#000000", title: "Worlds Lab",
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
  const r = await dialog.showOpenDialog(win, { title: o.title || "Open", properties: ["openFile"].concat(o.multi ? ["multiSelections"] : []), filters: o.filters || SCENE_FILTER });
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
ipcMain.handle("app:info", () => ({ version: app.getVersion(), docs: app.getPath("documents"), userData: app.getPath("userData") }));
ipcMain.handle("app:reveal", (e, file) => { shell.showItemInFolder(file); return true; });
ipcMain.on("app:close-ok", () => { if (win) { win.__closeOk = true; win.close(); } if (quitting) app.quit(); });
ipcMain.on("app:title", (e, t) => { if (win) win.setTitle(t); });

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
