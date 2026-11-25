"use strict";
// After Effects Lab Console as a UXP panel: the shared console UI + the AE UXP adapter, run in
// jsdom against a fake require("aftereffects") that follows AE's object model (1-based groups,
// param match names "<effect>-<id 4 digits>", addProperty invalidating references).
const path = require("path"), fs = require("fs"), assert = require("assert");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");

function fakeAE(tools) {
  const log = [];
  const pad4 = (n) => String(n).padStart(4, "0");
  function group(matchName, kids) {
    return { matchName, kids, get numProperties() { return this.kids.length; },
      property(k) { return typeof k === "number" ? this.kids[k - 1] : this.kids.find((q) => q.matchName === k) || null; } };
  }
  function prop(matchName) {
    return { matchName, value: 0, keys: [], expression: "", canSetExpression: true, canVaryOverTime: true,
      get numKeys() { return this.keys.length; },
      setValue(v) { if (this.keys.length) throw new Error("has keyframes"); this.value = v; },
      setValueAtTime(t, v) { this.keys.push([t, v]); },
      valueAtTime() { return this.value; } };
  }
  function effect(match) {
    const tool = tools.find((t) => t.match === match);
    // a topic group holds every param, so lookups that miss the direct path must walk groups
    const params = Object.keys(tool.params).map((id) => prop(match + "-" + pad4(id)));
    return group(match, [group(match + "-topic", params)]);
  }
  function layer(name, index) {
    const parade = group("ADBE Effect Parade", []);
    parade.canAddProperty = (m) => tools.some((t) => t.match === m);
    parade.addProperty = (m) => { parade.kids = parade.kids.concat([effect(m)]); return null; };
    return { name, index, hasVideo: true, hasAudio: false, parade, property: (k) => (k === "ADBE Effect Parade" ? parade : null) };
  }
  const layers = [layer("Group photo", 1), layer("B-roll", 2)];
  const comp = { name: "Main comp", time: 4, selectedLayers: [layers[0]], numLayers: 2, layer: (i) => layers[i - 1] };
  const ae = { project: { activeItem: comp }, effects: tools.map((t) => ({ matchName: t.match })).concat([{ matchName: "ADBE Glo2" }]),
    beginUndoGroup(n) { log.push("begin " + n); return true; }, endUndoGroup() { log.push("end"); return true; } };
  return { ae, uxp: { storage: { localFileSystem: {} } }, comp, layers, log };
}

module.exports = async function (t) {
  const { JSDOM } = require("jsdom");
  execFileSync(process.execPath, [path.join(ROOT, "tools/build-ae-uxp-console.js")], { stdio: "ignore" });
  const D = path.join(ROOT, "dist/ae-uxp-console");
  async function load() {
    const dom = new JSDOM(fs.readFileSync(path.join(D, "index.html"), "utf8"), { runScripts: "outside-only", url: "file:///" + D + "/index.html" });
    const w = dom.window, run = (f) => w.eval(fs.readFileSync(path.join(D, "js", f), "utf8"));
    run("brewmap.js");
    const fake = fakeAE(w.BREW.tools);
    w.__LAB_AE_FAKE__ = fake;
    for (const f of ["aeuxp-host.js", "help.js", "convert.js", "main.js"]) run(f);
    await new Promise((r) => setTimeout(r, 50));
    return { w, fake, $: (id) => w.document.getElementById(id) };
  }
  const wait = () => new Promise((r) => setTimeout(r, 120));

  await t("AE UXP console: build has the UXP manifest (AEFT host object), adapter and no CEP files", () => {
    const man = JSON.parse(fs.readFileSync(path.join(D, "manifest.json"), "utf8"));
    assert.deepStrictEqual(man.host, { app: "AEFT", minVersion: "27.0.0" });
    assert.ok(!Array.isArray(man.host), "host must be one object");
    assert.ok(!fs.existsSync(path.join(D, "jsx")) && !fs.existsSync(path.join(D, "CSXS")));
    assert.ok(fs.existsSync(path.join(ROOT, "dist/lab-console-ae-" + man.version + ".ccx")));
  });

  await t("AE UXP console: loads with AE words and audio controls, reads the comp selection", async () => {
    const { w, $ } = await load();
    assert.ok(/COMP/.test($("selstrip").textContent) && /1 layer selected/.test($("selstrip").textContent), $("selstrip").textContent);
    assert.notStrictEqual(w.document.querySelector(".aud").style.display, "none");
    assert.strictEqual(w.document.querySelectorAll(".look").length, 28);
  });

  await t("AE UXP console: clicking a look adds Scanline Lab and sets its Look popup (AE counts from 1), one undo step", async () => {
    const { w, fake } = await load();
    const looks = w.document.querySelectorAll(".look");
    looks[2].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await wait();
    const tool = w.BREW.tools.find((x) => x.id === "crt-phaser");
    const fx = fake.layers[0].parade.kids;
    assert.strictEqual(fx.length, 1); assert.strictEqual(fx[0].matchName, tool.match);
    const look = fx[0].kids[0].kids.find((p) => p.value === 3);
    assert.ok(look, "a param was set to look 3 (1-based)");
    assert.ok(/Look: .+ on 1 layer\./.test(w.document.getElementById("status").textContent), w.document.getElementById("status").textContent);
    assert.deepStrictEqual(fake.log, ["begin Lab Console: apply look", "end"]);
    looks[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await wait();
    assert.strictEqual(fake.layers[0].parade.kids.length, 1, "second look reuses the effect");
  });

  await t("AE UXP console: set values keyframe at the comp time when a param already has keys", async () => {
    const { w, fake } = await load();
    const tool = w.BREW.tools.find((x) => x.id === "crt-phaser");
    const ids = Object.keys(tool.params).slice(0, 3);
    const r = await w.LabHost.call("brew_setParams", [tool.match, { [ids[0]]: 7, [ids[1]]: { keys: [[0, 0], [1, 100]] } }, [], "test"]);
    assert.ok(r.ok, r.error); assert.strictEqual(r.count, 1);
    const ps = fake.layers[0].parade.kids[0].kids[0].kids;
    assert.strictEqual(ps[0].value, 7);
    assert.deepStrictEqual(ps[1].keys, [[4, 0], [5, 100]], "keys from the comp time");
    const r2 = await w.LabHost.call("brew_setParams", [tool.match, { [ids[1]]: 50 }, [], "test"]);
    assert.ok(r2.ok); assert.deepStrictEqual(ps[1].keys[2], [4, 50]);
    const g = await w.LabHost.call("brew_getParams", [tool.match, [ids[0]]]);
    assert.strictEqual(g.values[ids[0]], 7); assert.strictEqual(g.layer, "Group photo");
  });

  await t("AE UXP console: no comp or no selection gives the console's plain messages", async () => {
    const { w, fake } = await load();
    fake.comp.selectedLayers = [];
    const r = await w.LabHost.call("brew_applyLook", ["com.franks.crtphaser.ae", { look: 1 }, 1, false]);
    assert.strictEqual(r.ok, false); assert.ok(/Select one or more layers/.test(r.error));
    fake.ae.project.activeItem = { name: "footage" };
    const s = await w.LabHost.call("brew_status", [["com.franks.crtphaser.ae"]]);
    assert.ok(s.ok); assert.strictEqual(s.comp, null);
  });
};
