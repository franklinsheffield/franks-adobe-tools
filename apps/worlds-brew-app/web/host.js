// Pixel Scape web build: the browser host. Answers window.require from the bundled modules, loads the saved
// library from browser storage, and gives the app the menu shortcuts the desktop menu bar has.
import REG from "./.gen/registry.js";
import VFS from "./shims/vfs.js";
import { ipcRenderer } from "./shims/electron.js";

const cache = new Map();
function require(id) {
  if (cache.has(id)) return cache.get(id);
  const f = REG[id]; if (!f) throw new Error("web build: module not bundled: " + id);
  const m = f(); cache.set(id, m); return m;
}
// desktop menu accelerators (main.js menu()) -> the same "menu" commands
const KEYS = { n: "new", o: "open", s: "save", S: "saveAs", i: "importModel", t: "terrainLab", r: "render", z: "undo", Z: "redo", d: "duplicate" };
function onKey(e) {
  if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
  const t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  const k = e.shiftKey ? String(e.key).toUpperCase() : String(e.key).toLowerCase(), cmd = KEYS[k];
  if (!cmd || (typing && (cmd === "undo" || cmd === "redo"))) return;
  e.preventDefault(); e.stopPropagation(); ipcRenderer.emit("menu", cmd);
}
export async function start() {
  window.require = require;
  window.__psWeb = { VFS, ipcRenderer };
  document.documentElement.classList.add("ps-web");
  await VFS.load();
  VFS.mkdirSync("/Documents"); VFS.mkdirSync("/Uploads");
  window.addEventListener("keydown", onKey, true);
}
