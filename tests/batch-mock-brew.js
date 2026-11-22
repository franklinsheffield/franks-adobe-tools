"use strict";
// Batch Mock Brew tests: planner, batch runner, and a full 2 x 2 run of the
// panel against a fake Photoshop + file system. Called from tests/run.js.
const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "plugins/batch-mock-brew");

// ---- fake file system ------------------------------------------------------
function folder(name, kids, parentPath) {
  const f = { name, isFolder: true, isFile: false, nativePath: (parentPath || "") + "/" + name, kids: kids || [] };
  f.kids.forEach((k) => { k.nativePath = f.nativePath + "/" + k.name; });
  f.getEntries = async () => f.kids.slice();
  f.getEntry = async (n) => { const k = f.kids.find((x) => x.name === n); if (!k) throw new Error("no " + n); return k; };
  f.createFolder = async (n) => { const k = folder(n, [], f.nativePath); f.kids.push(k); return k; };
  f.createFile = async (n) => { let k = f.kids.find((x) => x.name === n); if (!k) { k = file(n); k.nativePath = f.nativePath + "/" + n; f.kids.push(k); } return k; };
  return f;
}
function file(name, text) {
  const f = { name, isFile: true, isFolder: false, text: text || "" };
  f.read = async () => f.text; f.write = async (t) => { f.text = t; };
  return f;
}

// ---- fake Photoshop: mockup docs with Smart Objects ---------------------------
// mockupSpec: { "<file name>": [{ name, linked?, soId? }] }
function extendHost(host, fsRoots, mockupSpec, log) {
  let nextId = 1000, active = null;
  const docs = [];
  function layer(doc, name, extra) {
    const L = Object.assign({ id: nextId++, name, visible: true, kind: "pixel",
      bounds: { left: 0, top: 0, right: 100, bottom: 50 } }, extra || {});
    L.boundsNoEffects = L.bounds;
    L.delete = async () => { doc.layers.splice(doc.layers.indexOf(L), 1); };
    L.scale = async (sx, sy) => { const b = L.bounds; L.bounds = { left: b.left, top: b.top, right: b.left + (b.right - b.left) * sx / 100, bottom: b.top + (b.bottom - b.top) * sy / 100 }; L.boundsNoEffects = L.bounds; };
    L.translate = async (dx, dy) => { const b = L.bounds; L.bounds = { left: b.left + dx, top: b.top + dy, right: b.right + dx, bottom: b.bottom + dy }; L.boundsNoEffects = L.bounds; };
    return L;
  }
  function makeDoc(name, w, h, parent) {
    const d = { id: nextId++, name, width: w, height: h, layers: [], activeLayers: [], parent };
    d.closeWithoutSaving = async () => { log.push("close " + name); docs.splice(docs.indexOf(d), 1); active = docs[docs.length - 1] || null; };
    const save = (fmt) => async (entry, o, asCopy) => { log.push("save" + fmt + " " + entry.nativePath + (o && o.quality ? " q" + o.quality : "") + (asCopy ? "" : " NOT-A-COPY")); entry.text = fmt + ":" + d.layers.map((l) => l.art || "").join("+"); };
    d.saveAs = { jpg: save("jpg"), png: save("png"), psd: save("psd") };
    docs.push(d); active = d;
    return d;
  }
  const ph = host.photoshop;
  ph.app = {
    get activeDocument() { return active; },
    async open(entry) {
      log.push("open " + entry.name);
      const d = makeDoc(entry.name, 2000, 1500);
      d.timeline = !!mockupSpec[entry.name + "#timeline"];
      (mockupSpec[entry.name] || []).forEach((s) => d.layers.push(layer(d, s.name, { kind: "smartObject", linked: !!s.linked, soId: s.soId || ("so" + nextId), content: null })));
      return d;
    }
  };
  ph.constants.LayerKind = { GROUP: "group", SMARTOBJECT: "smartObject" };
  ph.constants.AnchorPosition = { TOPLEFT: "topLeft" };
  let selected = null;
  ph.action.batchPlay = async (cmds) => cmds.map((c) => {
    host.calls.push(["batchPlay", c._obj]);
    const d = active;
    if (c._obj === "get" && c._target[1] && c._target[1]._ref === "timeline") return { frameCount: d && d.timeline ? 150 : 0 };
    if (c._obj === "get") {
      const id = c._target[0]._id, all = docs.flatMap((x) => x.layers), L = all.find((x) => x.id === id) || {};
      return L.kind === "smartObject" ? { smartObjectMore: { ID: L.soId }, smartObject: { linked: L.linked } } : { smartObjectMore: { size: { width: 400, height: 200 } } };
    }
    if (c._obj === "select") { selected = docs.flatMap((x) => x.layers).find((x) => x.id === c._target[0]._id); return {}; }
    if (c._obj === "placedLayerEditContents") {
      const so = makeDoc("SO " + selected.name, 1000, 1000, { doc: d, layer: selected });
      so.layers.push(layer(so, "old art")); log.push("edit " + selected.name);
      return {};
    }
    if (c._obj === "make") { const L = layer(d, c.using.name); d.layers.push(L); d.activeLayers = [L]; return {}; }
    if (c._obj === "placeEvent") {
      const L = layer(d, "placed"); L.art = c.null._path; d.layers.push(L); d.activeLayers = [L]; log.push("place " + c.null._path); return {};
    }
    if (c._obj === "close") {
      const p = d.parent; p.layer.art = d.layers.map((l) => l.art || l.name).join("+");
      p.layer.placed = d.layers.find((l) => l.art);
      log.push("saveSO " + p.layer.name + " = " + p.layer.art);
      const A = d.layers.find((l) => l.art); if (A) { const b = A.bounds; log.push("geom " + [b.left, b.top, b.right, b.bottom].map(Math.round).join(",")); }
      docs.splice(docs.indexOf(d), 1); active = p.doc; return {};
    }
    if (c._obj === "export") { log.push("video " + c.using.name); return d.timeline ? {} : { _obj: "error", message: "no timeline" }; }
    return {};
  });
  const fsys = host.uxp.storage.localFileSystem;
  const picks = fsRoots.slice();
  fsys.getFolder = async () => picks.shift();
  fsys.createPersistentToken = async (e) => "tok:" + e.nativePath;
  fsys.getEntryForPersistentToken = async (t) => { const f = fsRoots.find((r) => "tok:" + r.nativePath === t); if (!f) throw new Error("gone"); return f; };
  fsys.createSessionToken = async (e) => e.name;
  return { docs };
}

async function clickAndWait(P, node, until) {
  node.dispatchEvent(new P.window.Event("click"));
  for (let i = 0; i < 200; i++) { await P.settle(20); if (until()) return; }
  throw new Error("timed out");
}

module.exports = async function run(t) {
  const Plan = require(path.join(DIR, "js/plan.js"));
  const { createBatch } = require(path.join(ROOT, "shared/batch.js"));
  const { DEFAULTS, merge } = require(path.join(DIR, "js/state.js"));

  await t("Batch Mock planner: Smart Object names, slots, sets, naming and organise", () => {
    assert.ok(Plan.matchesTarget("Artwork", "artwork", "exact"));
    assert.ok(Plan.matchesTarget("artwork_2", "artwork", "exact") && Plan.matchesTarget("artwork 3", "artwork", "exact"));
    assert.ok(!Plan.matchesTarget("artwork copy", "artwork", "exact") && Plan.matchesTarget("artwork copy", "artwork", "starts"));
    assert.ok(Plan.matchesTarget("Front @design", "design", "contains") && !Plan.matchesTarget("x", "", "contains"));
    assert.strictEqual(Plan.slotOf("artwork_2", "artwork"), 2); assert.strictEqual(Plan.slotOf("artwork", "artwork"), 1);
    const sets = Plan.artworkSets([{ name: "box_2.png" }, { name: "box_1.png" }, { name: "solo.jpg" }], true, "_");
    assert.deepStrictEqual(sets.map((s) => s.name + ":" + Object.keys(s.members).join(",")), ["box:1,2", "solo:1"]);
    assert.strictEqual(Plan.outputName({ order: ["suffix", "mockup", "artwork"], delim: ".", mockup: "tee", artwork: "logo", suffix: "v2", format: "png" }), "v2.tee.logo.png");
    assert.strictEqual(Plan.outputName({ order: ["artwork", "", "mockup"], delim: " ", mockup: "a/b", artwork: "x:y", suffix: "", format: "jpg" }), "xy ab.jpg");
    assert.strictEqual(Plan.uniqueName("a.jpg", new Set(["a.jpg", "a (2).jpg"])), "a (3).jpg");
    const S = merge(DEFAULTS, { export: { organise: "artwork", format: "jpg" } });
    const jobs = Plan.buildJobs([{ name: "B.psd" }, { name: "A.psd" }, { name: "notes.txt" }], [{ name: "logo.png" }, { name: "art.pdf" }, { name: ".DS_Store" }], S);
    assert.deepStrictEqual(jobs.map((j) => j.dir + "/" + j.name), ["art/A_art.jpg", "logo/A_logo.jpg", "art/B_art.jpg", "logo/B_logo.jpg"]);
  });

  await t("Batch Mock placement: Fit, Fill, Stretch and Center sizes", () => {
    const art = { w: 200, h: 100 }, can = { w: 100, h: 100 };
    assert.deepStrictEqual(Plan.placeRect("fit", art, can), { w: 100, h: 50, left: 0, top: 25 });
    assert.deepStrictEqual(Plan.placeRect("fill", art, can), { w: 200, h: 100, left: -50, top: 0 });
    assert.deepStrictEqual(Plan.placeRect("stretch", art, can), { w: 100, h: 100, left: 0, top: 0 });
    assert.deepStrictEqual(Plan.placeRect("center", art, can), { w: 200, h: 100, left: -50, top: 0 });
    assert.ok(Plan.leavesGaps("fit", art, can) && !Plan.leavesGaps("fill", art, can));
  });

  await t("shared batch runner: failures are logged and the run goes on; Cancel stops after the current job", async () => {
    const seen = [];
    const b = createBatch({});
    const s1 = await b.start([1, 2, 3], async (j) => { seen.push(j); if (j === 2) throw new Error("bad file"); return j === 3 ? "skipped: exists" : "ok"; });
    assert.deepStrictEqual([s1.done, s1.failed, s1.skipped, s1.results[1].why], [1, 1, 1, "bad file"]);
    const s2 = await b.start([1, 2, 3], async (j) => { if (j === 1) b.cancel(); return "ok"; });
    assert.ok(s2.cancelled && s2.done === 1, "stopped after job 1");
  });

  const { loadPanel } = require("./harness.js");
  function setup(spec) {
    const log = [];
    const mock = folder("Mockups", [file("Tee.psd"), file("Box.psd"), file("readme.txt")], "/U");
    const art = folder("Art", [file("logo.png"), file("star.pdf")], "/U");
    const out = folder("Out", [], "/U");
    return { log, mock, art, out, extend: (h) => extendHost(h, [mock, art, out], spec, log) };
  }
  async function choose(P) {
    for (const b of [...P.document.querySelectorAll(".btn")].filter((x) => x.textContent === "Choose")) { b.dispatchEvent(new P.window.Event("click")); await P.settle(30); }
  }
  const SPEC = { "Tee.psd": [{ name: "artwork" }, { name: "Artwork", soId: "shared" }, { name: "artwork 3", soId: "shared" }, { name: "artwork_2", linked: true }], "Box.psd": [{ name: "label" }] };

  await t("Batch Mock panel: 2 mockups x 2 artworks - each mockup opened once, all matching Smart Objects filled, exports named and filed, mockups never saved, log written", async () => {
    const F = setup(SPEC);
    const P = await loadPanel(DIR, { withDoc: false, extend: F.extend });
    const d = P.document;
    assert.ok(d.querySelector(".title").textContent === "Frank's Batch Mock Brew");
    assert.deepStrictEqual([...d.querySelectorAll(".ctitle")].map((e) => e.textContent), ["Brew", "Library", "Folders", "Smart Objects", "Placement", "Export", "Naming"]);
    await choose(P);
    assert.strictEqual(d.querySelector(".counts").textContent, "2 mockups, 2 artworks = 4 jobs");
    assert.strictEqual(d.querySelector(".example").textContent, "Example: tee-front/tee-front_logo-red.jpg");
    const brew = d.querySelector(".apply");
    await clickAndWait(P, brew, () => /^(Done|Cancelled)/.test(d.querySelector(".status").textContent));
    const L = F.log;
    assert.deepStrictEqual(L.filter((x) => /^open /.test(x)), ["open Box.psd", "open Tee.psd"], "each mockup opened once");
    assert.ok(!L.some((x) => /NOT-A-COPY/.test(x)), "exports are copies");
    assert.deepStrictEqual(L.filter((x) => /^savejpg/.test(x)), ["savejpg /U/Out/Tee/Tee_logo.jpg q10", "savejpg /U/Out/Tee/Tee_star.jpg q10"]);
    assert.deepStrictEqual(L.filter((x) => /^edit /.test(x)), ["edit artwork", "edit Artwork", "edit artwork", "edit Artwork"], "2 SOs per job: shared copy edited once, linked SO left alone");
    assert.ok(L.includes("place logo.png") && L.includes("place star.pdf"));
    assert.ok(L.includes("close Tee.psd") && L.includes("close Box.psd"), "mockups closed without saving");
    const st = d.querySelector(".status").textContent;
    assert.ok(/^Done\. 2 made, 2 skipped, 0 failed/.test(st), st);
    const logFile = F.out.kids.find((k) => k.name === "batch-mock-brew-log.txt");
    assert.ok(logFile && /SKIPPED Box\/Box_logo\.jpg.*no Smart Object named "artwork"/.test(logFile.text), "log explains the skip");
    // Fit: a 2:1 artwork in a 1000 x 1000 Smart Object -> 1000 x 500, centred
    assert.ok(L.includes("geom 0,250,1000,750"), L.filter((x) => /^geom/.test(x)).join(" "));
  });

  await t("Batch Mock panel: placement geometry, gap fill, numbered slots and Skip existing", async () => {
    const F = setup({ "Tee.psd": [{ name: "artwork_1" }, { name: "artwork_2" }], "Box.psd": [] });
    F.art.kids = [file("set_1.png"), file("set_2.png"), file("zz.png")];
    F.out.kids.push(folder("Tee", [file("Tee_zz.png")], F.out.nativePath));
    const P = await loadPanel(DIR, { withDoc: false, extend: F.extend });
    const m = P.mod._test;
    Object.assign(m.state.so, { numbered: true });
    Object.assign(m.state.place, { mode: "fit", bg: "white" });
    Object.assign(m.state.export, { format: "png", skipExisting: true });
    await choose(P);
    const d = P.document;
    await clickAndWait(P, d.querySelector(".apply"), () => /^(Done|Cancelled)/.test(d.querySelector(".status").textContent));
    const saves = F.log.filter((x) => /^savepng/.test(x));
    assert.deepStrictEqual(saves, ["savepng /U/Out/Tee/Tee_set.png"], "set made; existing Tee_zz.png skipped");
    assert.ok(F.log.includes("saveSO artwork_1 = Background fill+set_1.png") && F.log.includes("saveSO artwork_2 = Background fill+set_2.png"), F.log.join("\n"));
    // the zz.png job only fills slot 1, so the mockup was reopened clean first
    assert.strictEqual(F.log.filter((x) => x === "open Tee.psd").length, 2);
  });

  await t("Batch Mock: settings and folders are remembered after a restart; Test first job leaves the result open", async () => {
    const F = setup(SPEC);
    let P = await loadPanel(DIR, { withDoc: false, extend: F.extend });
    await choose(P);
    const seg = [...P.document.querySelectorAll(".segbtn")].find((b) => b.textContent === "Fill (crop)");
    seg.dispatchEvent(new P.window.Event("click"));
    await P.settle(450);
    const saved = (await (await P.host.uxp.storage.localFileSystem.getDataFolder()).getEntry()).read();
    // a fresh panel on the same (fake) data folder
    const host2 = P.host;
    P = await loadPanel(DIR, { withDoc: false, extend: (h) => {
      F.extend(h);
      h.uxp.storage.localFileSystem.getDataFolder = host2.uxp.storage.localFileSystem.getDataFolder;
    } });
    await P.settle(100);
    assert.strictEqual(P.mod._test.state.place.mode, "fill", "placement restored: " + (await saved));
    assert.ok(P.document.querySelector(".info.path").textContent.endsWith("/U/Mockups"), "folder restored");
    assert.strictEqual(P.document.querySelector(".counts").textContent, "2 mockups, 2 artworks = 4 jobs");
    const test = [...P.document.querySelectorAll(".btn")].find((b) => b.textContent === "Test first job");
    await clickAndWait(P, test, () => /^Test done/.test(P.document.querySelector(".status").textContent));
    assert.ok(!F.log.some((x) => /^save(jpg|png|psd)/.test(x)), "test exports nothing");
    assert.ok(!F.log.includes("close Box.psd"), "result left open");
  });

  await t("Batch Mock: MP4 skips mockups without a Video Timeline; a shared Smart Object takes its lowest slot", async () => {
    const F = setup({ "Tee.psd": [{ name: "artwork 2", soId: "s" }, { name: "artwork", soId: "s" }], "Box.psd": [{ name: "artwork" }], "Box.psd#timeline": true });
    F.art.kids = [file("logo.png")];
    const P = await loadPanel(DIR, { withDoc: false, extend: F.extend });
    const m = P.mod._test;
    Object.assign(m.state.export, { format: "mp4", organise: "one" });
    m.state.so.numbered = true;
    await choose(P);
    const d = P.document;
    await clickAndWait(P, d.querySelector(".apply"), () => /^(Done|Cancelled)/.test(d.querySelector(".status").textContent));
    assert.deepStrictEqual(F.log.filter((x) => /^video /.test(x)), ["video Box_logo.mp4"], F.log.join("\n"));
    assert.ok(/1 skipped/.test(d.querySelector(".status").textContent) && /Video Timeline/.test(d.querySelector(".status").textContent));
    assert.ok(!F.log.includes("edit artwork 2"), "Tee skipped before any edit");
  });
};
