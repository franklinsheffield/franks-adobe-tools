"use strict";
// ======================================================================
// Frank's Batch Mock Brew - batch Smart Object mockups.
// Pick a Mockups, Artwork and Export folder, choose placement, format and
// naming, press Run Batch: every artwork goes into every mockup's target
// Smart Objects and the results are exported. Settings and folders are
// remembered. Mockup files on disk are never changed.
// ======================================================================
const { core } = require("photoshop");
const Plan = require("./js/plan.js");
const PSM = require("./js/ps-mockup.js");
const { runModal } = require("./core/modal.js");
const { DEFAULTS, PRESETS, merge, clone } = require("./js/state.js");
const PS = require("./core/ps-io.js");
const { createUI, getPath } = require("./core/ui.js");
const QW = require("./core/quickwins.js");
const { splitLayout } = require("./core/layout.js");
const { createLibrary } = require("./core/library.js");
const { createBatch, formatLog } = require("./core/batch.js");

const BRAND = require("./brand.js");
const { SUITE } = require("./core/brand.js");
const TITLE = BRAND.NAME;
const SETTINGS_FILE = "settings.json";
PS.configure({ appName: TITLE, presetFile: "setups.json", exportName: "batch-mock-setups.json" });

let state = clone(DEFAULTS);
// folders: { mockups|artwork|export: { token, path } }; entries resolved lazily
const folders = { mockups: null, artwork: null, export: null };
const entries = { mockups: null, artwork: null, export: null };
const lists = { mockups: [], artwork: [] };
const refs = {};
let built = false, saveT = null, lib = null;
// settings of the setup loaded last: double-click and the menu reset to them (quick win ID-02)
let lookBase = clone(state);
const KEYS_IDLE = QW.keysIdle("the batch after the current job");

const ui = createUI({ getState: () => state, onChange: () => touch(), pickColor: (hex) => PS.pickColor(hex), brand: "console", glow: "#fe5e4f", storeKey: BRAND.LEGACY,
  getDefault: (path) => getPath(lookBase, path), onSelect: (i) => { if (refs.keys) refs.keys.textContent = i ? QW.keysFor(i) : KEYS_IDLE; } });
const { el, card, row, segGroup, selectRow, checkRow, sliderRow, textRow, showIf, refreshAll, bind, hexField } = ui;

function busyNow() { try { return !!batch.running; } catch (e) { return false; } }
function setStatus(msg, isErr) {
  if (!refs.status) return;
  if (isErr) msg = QW.plainError(msg);
  refs.status.textContent = msg;
  refs.status.className = "status" + (isErr ? " err" : "");
  if (refs.led) refs.led.set(isErr ? "err" : (busyNow() ? "busy" : "ready"));
}
function touch() { refreshAll(); updateCounts(); scheduleSave(); }

// ---- persistence -------------------------------------------------------------
function scheduleSave() {
  clearTimeout(saveT);
  saveT = setTimeout(() => { PSM.saveSettings(SETTINGS_FILE, { v: 1, state, folders }).catch((e) => console.error(e)); }, 300);
}
async function loadSaved() {
  const s = await PSM.loadSettings(SETTINGS_FILE);
  if (!s) return;
  if (s.state) state = merge(DEFAULTS, s.state);
  for (const k of Object.keys(folders)) if (s.folders && s.folders[k]) folders[k] = s.folders[k];
  for (const k of Object.keys(folders)) {
    if (!folders[k]) continue;
    try { entries[k] = await PSM.folderFromToken(folders[k].token); }
    catch (e) { entries[k] = null; folders[k].lost = true; }
  }
}

// ---- folders ----------------------------------------------------------------
async function chooseFolder(kind) {
  try {
    const f = await PSM.pickFolder();
    if (!f) return;
    entries[kind] = f;
    folders[kind] = { token: await PSM.tokenFor(f), path: PSM.pathOf(f) };
    scheduleSave();
    await rescan();
  } catch (e) { setStatus("Could not use that folder: " + e.message, true); }
}
async function rescan() {
  const deep = !!state.folders.subfolders;
  lists.mockups = entries.mockups ? await PSM.listFiles(entries.mockups, deep, Plan.isMockup) : [];
  lists.artwork = entries.artwork ? await PSM.listFiles(entries.artwork, deep, Plan.isArtwork) : [];
  refreshAll(); updateCounts();
}
function jobs() { return Plan.buildJobs(lists.mockups, lists.artwork, state); }
function updateCounts() {
  if (!refs.counts) return;
  const n = jobs().length;
  refs.counts.textContent = lists.mockups.length + " mockup" + (lists.mockups.length === 1 ? "" : "s") + ", " +
    lists.artwork.length + " artwork" + (lists.artwork.length === 1 ? "" : "s") + " = " + n + " job" + (n === 1 ? "" : "s");
  const ex = Plan.outputName({ order: state.naming.order, delim: state.naming.delim, mockup: "tee-front", artwork: "logo-red", suffix: state.naming.suffix, format: state.export.format });
  refs.example.textContent = "Example: " + (Plan.outputDir(state.export.organise, "tee-front", "logo-red") ? Plan.outputDir(state.export.organise, "tee-front", "logo-red") + "/" : "") + ex;
}
function folderRow(kind, label) {
  const p = el("div", { class: "info path" });
  bind(() => {
    const f = folders[kind];
    p.textContent = f ? (f.lost ? "Folder not found, choose it again: " : "") + f.path : "Not chosen";
    p.className = "info path" + (f && f.lost ? " lost" : "");
  });
  const b = el("button", { class: "btn small", text: "Choose" });
  b.addEventListener("click", () => chooseFolder(kind));
  return el("div", { class: "frow" }, [row(label, b), p]);
}

// ---- the run -------------------------------------------------------------------
const batch = createBatch({
  onProgress: (i, n, job) => {
    refs.bar.style.width = (n ? Math.round(100 * i / n) : 0) + "%";
    if (job) refs.job.textContent = "Job " + (i + 1) + " of " + n + ":  " + job.mockup.name + "  +  " + job.set.name;
  }
});

async function brew(testOnly) {
  if (batch.running) return;
  if (!entries.mockups || !entries.artwork || (!testOnly && !entries.export)) { setStatus("Choose the Mockups, Artwork and Export folders first.", true); return; }
  await rescan();
  let list = jobs();
  if (!list.length) { setStatus("Nothing to do: no .psd mockups or no artwork files in those folders.", true); return; }
  if (testOnly) list = list.slice(0, 1);
  const S = clone(state);
  scheduleSave();   // remember the setup that was run
  let cur = null;   // { key, doc, targets, dirty }
  const dirCache = {};
  setRunning(true);
  setStatus(testOnly ? "Test: first job only, the result stays open in Photoshop." : "Running " + list.length + " mockups...");
  // one mockup job per modal; the watchdog ends a job that never finishes instead of leaving a stuck Progress window
  const modal = (fn, name) => runModal(TITLE + ": " + name, fn, { timeoutMs: 10 * 60000 });
  const closeCur = async () => { if (cur) { const d = cur.doc; cur = null; await modal(() => PSM.closeDoc(d), "close mockup"); } };

  const summary = await batch.start(list, async (job) => modal(async () => {
    const key = job.mockup.rel;
    // a numbered set that leaves a slot empty must start from a clean mockup
    const needsFresh = cur && cur.key === key && cur.dirty && cur.targets.some((t) => !Plan.artworkForSlot(job.set, t.slot, S.so.numbered));
    if (cur && (cur.key !== key || needsFresh)) { const d = cur.doc; cur = null; await PSM.closeDoc(d); }
    if (!cur) {
      const doc = await PSM.openDoc(job.mockup.entry);
      const found = await PSM.findTargets(doc, S.so);
      cur = { key, doc, targets: found.targets, skipped: found.skipped, dirty: false };
      cur.video = S.export.format !== "mp4" || await PSM.hasTimeline();
    }
    if (!cur.video) return "skipped: MP4 needs a Video Timeline in this mockup";
    if (!cur.targets.length) return "skipped: no Smart Object named \"" + S.so.name + "\"" + (cur.skipped.length ? " (left out: " + cur.skipped.join(", ") + ")" : "");
    let n = 0;
    for (const t of cur.targets) {
      const art = Plan.artworkForSlot(job.set, t.slot, S.so.numbered);
      if (!art) continue;
      await PSM.replaceContents(cur.doc, t, art, S);
      cur.dirty = true; n++;
    }
    if (!n) return "skipped: no artwork for any slot";
    if (testOnly) return "ok";
    const folder = await PSM.subFolder(entries.export, job.dir, dirCache);
    let name = job.name;
    if (await PSM.exists(folder, name)) {
      if (S.export.skipExisting) return "skipped: " + name + " already exists";
      name = await PSM.freeName(folder, name);
    }
    await PSM.exportDoc(cur.doc, folder, name, S.export);
    return "ok";
  }, "job"));

  if (!testOnly || summary.failed || summary.cancelled) await closeCur();
  if (!testOnly) {
    try { await PSM.writeText(entries.export, "batch-mock-brew-log.txt", formatLog(TITLE, summary, (j) => (j.dir ? j.dir + "/" : "") + j.name + "  <=  " + j.mockup.name + " + " + j.set.name)); } catch (e) { console.error(e); }
  }
  setRunning(false);
  const firstFail = summary.results.find((r) => r.status !== "ok");
  const msg = (summary.cancelled ? "Cancelled. " : testOnly ? "Test done, check the open document, then close it without saving. " : "Done. ") +
    summary.done + " made, " + summary.skipped + " skipped, " + summary.failed + " failed." + (firstFail ? "  First problem: " + firstFail.why : "") +
    (testOnly ? "" : "  Log: batch-mock-brew-log.txt in the Export folder.");
  setStatus(msg, summary.failed > 0);
  refs.summary.textContent = summary.results.filter((r) => r.status !== "ok").slice(0, 8).map((r) => r.status + ": " + r.job.mockup.name + " + " + r.job.set.name + " - " + r.why).join("\n");
}
function setRunning(on) {
  [refs.brew, refs.test].forEach((b) => { if (on) b.setAttribute("disabled", "true"); else b.removeAttribute("disabled"); });
  refs.brew.textContent = on ? "Running..." : "Run Batch";
  if (refs.led) refs.led.set(on ? "busy" : "ready");
  refs.cancel.style.display = on ? "" : "none";
  if (!on) refs.job.textContent = "";
}

// ---- panel -------------------------------------------------------------------
const ORDER = [{ v: "mockup", l: "Mockup name" }, { v: "artwork", l: "Artwork name" }, { v: "suffix", l: "Suffix" }, { v: "", l: "(none)" }];

function build(root) {
  ui.clear(root);
  const lay = splitLayout(root, el);
  root.classList.add("brand-console");
  refs.led = ui.brand.header({ title: TITLE, code: "BM-07" });
  lay.pinned.appendChild(refs.led.node);
  refs.brew = el("button", { class: "apply", text: "Run Batch" });
  refs.brew.addEventListener("click", () => brew(false));
  refs.test = el("button", { class: "btn small", text: "Test first job", title: "Runs only the first job and leaves the result open, without exporting" });
  refs.test.addEventListener("click", () => brew(true));
  refs.cancel = el("button", { class: "btn small", text: "Cancel", title: "Stops after the current job" });
  refs.cancel.addEventListener("click", () => { batch.cancel(); setStatus("Cancelling after this job..."); });
  refs.cancel.style.display = "none";
  refs.bar = el("div", { class: "barfill" });
  refs.job = el("div", { class: "info job" });
  refs.status = el("div", { class: "status", text: "Choose your folders to start." });
  refs.summary = el("div", { class: "info" });
  refs.counts = el("div", { class: "info counts" });
  lay.pinned.appendChild(card("Run", [refs.counts, refs.brew, el("div", { class: "bar" }, [refs.bar]), el("div", { class: "row" }, [refs.test, refs.cancel]), refs.job, refs.status, (refs.keys = el("div", { class: "keys", text: KEYS_IDLE })), refs.summary], { fold: false }));

  const s = lay.scroller;
  // organized panel (Frank, 2026-11-22): A Look / B Setup / D Output (no colour section in this tool)
  const secs = [];
  const sec = (letter, name, id) => { const n = ui.section(letter, name, id); s.appendChild(n); secs.push({ letter, name, id, node: n }); };
  sec("A", "LOOK", "look");
  lib = createLibrary(ui, { builtins: PRESETS, applyPatch: (p) => { const keep = clone(state.folders); state = merge(DEFAULTS, p); state.folders = keep; lookBase = clone(state); touch(); }, getSaveable: () => { const c = clone(state); delete c.folders; return c; }, io: PS, setStatus });
  s.appendChild(lib.card);

  sec("B", "SETUP", "setup");
  s.appendChild(card("Folders", [
    folderRow("mockups", "Mockups"), folderRow("artwork", "Artwork"), folderRow("export", "Export"),
    checkRow("Include sub-folders", "folders.subfolders", () => rescan())
  ], { hint: "Mockups: .psd / .psb. Artwork: JPG, PNG, PSD, PDF (page 1), TIFF, GIF, BMP." }));

  const numbered = checkRow("Numbered slots (artwork_1, artwork_2 take name_1, name_2)", "so.numbered");
  s.appendChild(card("Smart Objects", [
    textRow("Layer name", "so.name", "artwork"),
    row("Match", segGroup("so.rule", [{ v: "exact", l: "Exact" }, { v: "starts", l: "Starts with" }, { v: "contains", l: "Contains" }])),
    row("Replace", segGroup("so.all", [{ v: true, l: "All matching" }, { v: false, l: "First only" }])),
    numbered
  ], { hint: "Copies of one Smart Object update together. Linked-file Smart Objects are left alone." }));

  const bgRow = row("Gaps", segGroup("place.bg", [{ v: "transparent", l: "None" }, { v: "white", l: "White" }, { v: "black", l: "Black" }, { v: "custom", l: "Colour" }]));
  const bgHex = row("Colour", hexField(() => state.place.bgHex, (v) => { state.place.bgHex = v; }));
  showIf(bgRow, () => state.place.mode === "fit" || state.place.mode === "center");
  showIf(bgHex, () => (state.place.mode === "fit" || state.place.mode === "center") && state.place.bg === "custom");
  s.appendChild(card("Placement", [
    segGroup("place.mode", [{ v: "fit", l: "Fit", t: "Whole artwork visible, aspect kept" }, { v: "fill", l: "Fill (crop)", t: "Covers the Smart Object, aspect kept, overflow cropped" }, { v: "stretch", l: "Stretch", t: "Exactly the Smart Object size" }, { v: "center", l: "Center", t: "Original size, centred" }], "big"),
    bgRow, bgHex
  ]));

  const q = sliderRow("JPG quality", "export.quality", 1, 12, 1, "");
  const alpha = checkRow("PNG keeps transparency", "export.pngAlpha");
  const mp4 = el("div", { class: "hint", text: "MP4 needs a mockup with a Video Timeline (an animated mockup). Others are skipped and logged." });
  showIf(q, () => state.export.format === "jpg");
  showIf(alpha, () => state.export.format === "png");
  showIf(mp4, () => state.export.format === "mp4");
  sec("D", "OUTPUT", "output");
  s.appendChild(card("Export", [
    segGroup("export.format", [{ v: "jpg", l: "JPG" }, { v: "png", l: "PNG" }, { v: "psd", l: "PSD" }, { v: "mp4", l: "MP4" }]),
    q, alpha, mp4,
    selectRow("Organise", "export.organise", [{ v: "mockup", l: "A folder per mockup" }, { v: "artwork", l: "A folder per artwork" }, { v: "one", l: "All in one folder" }]),
    checkRow("Skip files that already exist", "export.skipExisting")
  ]));

  refs.example = el("div", { class: "info example" });
  s.appendChild(card("Naming", [
    selectRow("First", "naming.order.0", ORDER), selectRow("Second", "naming.order.1", ORDER), selectRow("Third", "naming.order.2", ORDER),
    row("Delimiter", segGroup("naming.delim", [{ v: "_", l: "_" }, { v: "-", l: "-" }, { v: ".", l: "." }, { v: " ", l: "space" }])),
    textRow("Suffix", "naming.suffix", "e.g. v2"),
    refs.example
  ]));
  lay.pinned.appendChild(ui.jumpStrip(secs, s));
  s.appendChild(el("div", { class: "foot", text: TITLE + " 1.0  -  " + SUITE }));
  refreshAll(); updateCounts();
}

async function init() {
  if (built) return;
  built = true;
  try { await loadSaved(); } catch (e) { console.error(e); }
  lookBase = clone(state);
  build(document.getElementById("app"));
  await lib.load();
  try { await rescan(); } catch (e) { console.error(e); }
  if (entries.mockups && entries.artwork && entries.export) setStatus("Ready. Settings and folders restored.");
}

try {
  const { entrypoints } = require("uxp");
  entrypoints.setup({ panels: { batchMockPanel: { create() { init(); }, show() { if (!built) init(); },
    // panel flyout menu (quick win AD-05)
    menuItems: [
      { id: "resetLook", label: "Reset settings to this setup" },
      { id: "test", label: "Test first job" },
      { id: "foldAll", label: "Fold or open all cards" },
      "-",
      { id: "about", label: "About " + TITLE }
    ],
    invokeMenu(id) { menuAction(id); } } } });
} catch (e) { /* older hosts */ }
// Esc stops the batch after the current job (UX-04)
QW.onEscape(() => { if (busyNow()) { batch.cancel(); setStatus("Cancelling after this job..."); } });

function menuAction(id) {
  if (id === "resetLook") { const keep = clone(state.folders); state = clone(lookBase); state.folders = keep; touch(); setStatus("Settings reset to the last loaded setup."); }
  else if (id === "test") { if (!busyNow()) brew(true); }
  else if (id === "foldAll") { if (ui.foldAll) ui.foldAll(!ui.anyOpen()); }
  else if (id === "about") setStatus(TITLE + "  |  BM-07  |  " + SUITE + ". Hover any control for help.");
}
setTimeout(() => { init(); }, 0);

const _api = { _test: { get state() { return state; }, folders, entries, lists, refs, brew, rescan, jobs, batch, init, menuAction, get lookBase() { return lookBase; } } };
try { window.__batchMock = _api; } catch (e) { /* console access for smoke tests */ }
if (typeof module !== "undefined" && module && module.exports) module.exports = _api;
