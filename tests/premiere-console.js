"use strict";
// Premiere Lab Console (UXP): the shared console UI + the Premiere adapter, run in jsdom against a
// fake premierepro module that keeps params by position like Premiere does.
const path = require("path"), fs = require("fs"), assert = require("assert");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");

// ---- fake premierepro: one sequence, selectable clips, effects with positional params
function fakePremiere(opts) {
  const MAP = opts.map;
  class Color { constructor(r, g, b, a) { Object.assign(this, { red: r, green: g, blue: b, alpha: a }); } }
  class TickTime { constructor(s) { this.seconds = s; } static createWithSeconds(s) { return new TickTime(s); } }
  const log = [];
  function makeComponent(match) {
    // Premiere's list = AE Effect Controls positions shifted by `offset` (input layer left out = -1)
    const t = Object.values(MAP).find((x) => x.match === match);
    const params = [];
    const byPos = Object.entries(t.pos).map(([id, p]) => [Number(id), p]).sort((a, b) => a[1] - b[1]);
    for (const [id, p] of byPos) {
      if (opts.dropEnds && t.kinds[id] === "end") continue;
      const kind = t.kinds[id];
      params.push({ id, displayName: t.names[p] || (kind === "end" ? "" : "Param " + id), value: kind === "popup" ? (id === t.look ? opts.popupBase : opts.popupBase) : 0, varying: false, keys: [],
        isTimeVarying() { return this.varying; },
        createKeyframe(v) { if (v === undefined || Number.isNaN(v)) throw new Error("bad value"); return { value: { value: v }, position: null, _v: v }; },
        createSetValueAction(kf) { return () => { this.value = kf._v; }; },
        createSetTimeVaryingAction(on) { return () => { this.varying = on; }; },
        createAddKeyframeAction(kf) { return () => { this.keys.push([kf.position.seconds, kf._v]); }; },
        async getValueAtTime() { return { value: this.value }; } });
    }
    return { match: "AE." + match, params, getParamCount: () => params.length, getParam: (i) => params[i], getMatchName: async () => "AE." + match };
  }
  function makeClip(name) {
    const chain = { comps: [],
      getComponentCount() { return this.comps.length; }, getComponentAtIndex(i) { return this.comps[i]; },
      createAppendComponentAction(c) { return () => { this.comps.push(c); }; } };
    chain.comps.push({ match: "AE.ADBE Motion", getMatchName: async () => "AE.ADBE Motion", getParamCount: () => 0 });
    return { name, chain, getName: async () => name, getComponentChain: async () => chain,
      getStartTime: async () => new TickTime(10), getInPoint: async () => new TickTime(2) };
  }
  const clips = [makeClip("Group photo"), makeClip("B-roll")];
  let selected = [clips[0]];
  const sequence = { name: "Edit 01", getSelection: async () => ({ getTrackItems: async () => selected.slice() }), getPlayerPosition: async () => new TickTime(12) };
  const project = { getActiveSequence: async () => sequence, lockedAccess(cb) { cb(); },
    executeTransaction(cb, label) { const acts = []; cb({ addAction: (a) => acts.push(a) }); acts.forEach((a) => a()); log.push(label + " x" + acts.length); return true; } };
  const installed = Object.values(MAP).map((t) => "AE." + t.match).concat(["PR.ADBE Gamma Correction"]);
  const ppro = { Color, TickTime, Project: { getActiveProject: async () => project },
    VideoFilterFactory: { getMatchNames: async () => installed, createComponent: async (m) => makeComponent(m.replace(/^AE\./, "")) } };
  return { ppro, uxp: { storage: { localFileSystem: {} } }, clips, select: (c) => { selected = c; }, log };
}

module.exports = async function (t) {
  const { JSDOM } = require("jsdom");
  execFileSync(process.execPath, [path.join(ROOT, "tools/build-premiere-console.js")], { stdio: "ignore" });
  const D = path.join(ROOT, "dist/premiere-console");
  async function load(opts) {
    const dom = new JSDOM(fs.readFileSync(path.join(D, "index.html"), "utf8"), { runScripts: "outside-only", url: "file:///" + D + "/index.html" });
    const w = dom.window, run = (f) => w.eval(fs.readFileSync(path.join(D, "js", f), "utf8"));
    run("brewmap.js"); run("ppro-map.js");
    const fake = fakePremiere(Object.assign({ map: w.LAB_PPRO, popupBase: 1 }, opts));
    w.__LAB_PPRO_FAKE__ = fake;
    for (const f of ["ppro-host.js", "help.js", "convert.js", "main.js"]) run(f);
    await new Promise((r) => setTimeout(r, 50));
    return { w, fake, $: (id) => w.document.getElementById(id) };
  }
  const tick = () => new Promise((r) => setTimeout(r, 30));

  await t("Premiere console: map gives every Scanline param a position, name or kind; 28 looks with values", () => {
    const sb = { window: {} }; require("vm").runInNewContext(fs.readFileSync(path.join(D, "js/ppro-map.js"), "utf8"), sb);
    const m = sb.window.LAB_PPRO["crt-phaser"];
    assert.strictEqual(m.match, "com.franks.crtphaser.ae");
    assert.strictEqual(m.lookVals.length, 28);
    const posSet = new Set(Object.values(m.pos)); assert.strictEqual(posSet.size, m.count - 1, "positions unique");
    assert.strictEqual(m.names[m.pos[m.look]], "Look");
    assert.ok(Object.keys(m.lookVals[0]).length > 40, "a look sets the whole effect");
  });

  await t("Premiere console: every Lab effect param has a kind (popups must be known: Premiere counts them from 0)", () => {
    const sb = { window: {} }; require("vm").runInNewContext(fs.readFileSync(path.join(D, "js/ppro-map.js"), "utf8"), sb);
    const bm = { window: {} }; require("vm").runInNewContext(fs.readFileSync(path.join(D, "js/brewmap.js"), "utf8"), bm);
    for (const tool of bm.window.BREW.tools) {
      const m = sb.window.LAB_PPRO[tool.id];
      const missing = Object.keys(tool.params).filter((id) => !m.kinds[id]);
      assert.deepStrictEqual(missing, [], tool.id + " params without a kind");
      for (const e of Object.values(tool.keys)) if (e.kind === "popup") assert.strictEqual(m.kinds[e.id], "popup", tool.id + " popup " + e.id);
    }
  });

  await t("Premiere console: loads in UXP mode (PR words, audio hidden) and reads the selection", async () => {
    const { w, $ } = await load({});
    await tick();
    assert.ok(/SEQUENCE/.test($("selstrip").textContent) && /1 clip selected/.test($("selstrip").textContent), $("selstrip").textContent);
    assert.ok(/· PR$/.test(w.document.querySelector(".rackcode").textContent));
    assert.strictEqual(w.document.querySelector(".aud").style.display, "none");
    assert.strictEqual(w.document.querySelectorAll(".look").length, 28);
  });

  for (const [label, opts] of [["input left out", {}], ["topic ends left out", { dropEnds: true }], ["0-based popups", { popupBase: 0 }]]) {
    await t("Premiere console: clicking a look adds Scanline Lab to the clip and sets every control (" + label + ")", async () => {
      const { w, fake } = await load(opts);
      const looks = w.document.querySelectorAll(".look");
      looks[2].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 120));
      const chain = fake.clips[0].chain, comp = chain.comps[chain.comps.length - 1];
      assert.strictEqual(comp.match, "AE.com.franks.crtphaser.ae");
      const m = w.LAB_PPRO["crt-phaser"], want = m.lookVals[2];
      const byId = Object.fromEntries(comp.params.map((p) => [p.id, p]));
      assert.strictEqual(byId[m.look].value, 3 - 1 + (opts.popupBase == null ? 1 : opts.popupBase), "Look popup");
      let checked = 0;
      for (const [id, v] of Object.entries(want)) {
        const got = byId[id].value;
        if (Array.isArray(v)) assert.ok(Math.abs(got.red - v[0]) < 1e-9 && Math.abs(got.blue - v[2]) < 1e-9, "colour " + id);
        else if (m.kinds[id] === "popup") assert.strictEqual(got, v - 1 + (opts.popupBase == null ? 1 : opts.popupBase), "popup " + id);
        else assert.strictEqual(Number(got), Number(v), "param " + id + " " + byId[id].displayName);
        checked++;
      }
      assert.ok(checked > 40);
      assert.ok(/Look: .+ on 1 clip\./.test(w.document.getElementById("status").textContent), w.document.getElementById("status").textContent);
      // second click changes the same effect (no stack) in one undo step
      looks[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 120));
      assert.strictEqual(chain.comps.filter((c) => c.match === "AE.com.franks.crtphaser.ae").length, 1);
      assert.ok(fake.log.filter((l) => /apply look/.test(l)).length === 2, fake.log.join(", "));
    });
  }

  await t("Premiere console: an effect already on a later look gets the right look (Premiere 0-based popups)", async () => {
    const { w, fake } = await load({ popupBase: 0 });
    const m = w.LAB_PPRO["crt-phaser"];
    const comp = await fake.ppro.VideoFilterFactory.createComponent("AE." + m.match);
    comp.params.find((p) => p.id === m.look).value = 3;             // Premiere shows the 4th look
    fake.clips[0].chain.comps.push(comp);
    w.document.querySelectorAll(".look")[1].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    assert.strictEqual(fake.clips[0].chain.comps.length, 2, "reuses the effect");
    assert.strictEqual(comp.params.find((p) => p.id === m.look).value, 1, "2nd look = item 1 in Premiere");
  });

  await t("Premiere console: Reveal motion keys a 1 s build from the playhead in clip time", async () => {
    const { w, fake } = await load({});
    w.document.querySelectorAll(".look")[0].dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    const btn = [...w.document.querySelectorAll("#motion button")].find((b) => b.textContent === "REVEAL");
    btn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    const comp = fake.clips[0].chain.comps.slice(-1)[0], m = w.LAB_PPRO["crt-phaser"];
    const rev = comp.params.find((p) => p.displayName === "Reveal (%)");
    assert.ok(rev.varying);
    assert.deepStrictEqual(rev.keys, [[4, 0], [5, 100]], "playhead 12 s - clip start 10 s + in point 2 s = 4 s");
    assert.strictEqual(comp.params.find((p) => p.displayName === "Animate").value, true);
    assert.ok(m);
  });
};
