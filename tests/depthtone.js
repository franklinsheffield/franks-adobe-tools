"use strict";
// Depthtone 2.0: depth sources, 7 styles, 18 looks, Photoshop-side subject / depth layer reads.
const path = require("path");
const fs = require("fs");
const assert = require("assert");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");

module.exports = async function (t) {
  const E = require("../plugins/depthtone/js/engine.js");
  const S = require("../plugins/depthtone/js/state.js");
  const Depth = require("../plugins/depthtone/js/depth.js");
  const w = 96, h = 72;
  const src = E.demoImage(w, h);
  // a "person": a box standing on the floor near the bottom
  const subject = new Float32Array(w * h);
  for (let y = 20; y < 66; y++) for (let x = 40; x < 56; x++) subject[y * w + x] = 1;

  await t("depthtone: 18 looks (10 new + 8 from 1.0), every style used, all render deterministically", async () => {
    assert.strictEqual(S.PRESETS.length, 18);
    assert.deepStrictEqual([...new Set(S.PRESETS.map((p) => S.merge(S.DEFAULTS, p.p).style))].sort(), ["anaglyph", "contours", "haze", "heat", "relief", "ridges", "terraces"]);
    for (const pr of S.PRESETS) {
      const P = S.merge(S.DEFAULTS, pr.p); P.scale = 0.4; P.fullH = 180;
      const s2 = Object.assign({}, src, { subject });
      const a = await E.render(s2, P), b = await E.render(s2, P);
      assert.ok(a.layers.length >= 1, pr.name);
      a.layers.forEach((L, i) => { assert.strictEqual(L.rgba.length, w * h * 4, pr.name + " size"); assert.deepStrictEqual(Buffer.from(L.rgba), Buffer.from(b.layers[i].rgba), pr.name + " deterministic"); });
    }
  });

  await t("depthtone: smart depth puts the subject in front of the floor behind it, bottom nearer than top", () => {
    const P = S.merge(S.DEFAULTS, {}); P.scale = 1;
    const { D, used } = Depth.build(Object.assign({}, src, { subject }), P);
    assert.strictEqual(used, "smart");
    const at = (x, y) => D[y * w + x];
    assert.ok(at(48, 40) > at(10, 40) + 0.2, "subject nearer than background at the same height");
    assert.ok(at(10, 70) > at(10, 5) + 0.5, "floor comes forward towards the bottom");
  });

  await t("depthtone: depth layer wins over brightness; missing inputs fall back to brightness and say so", () => {
    const P = S.merge(S.DEFAULTS, { depth: { source: "layer" } }); P.scale = 1;
    const dm = { w, h, c: 4, data: new Uint8Array(w * h * 4) };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = Math.round(x / (w - 1) * 255), j = (y * w + x) * 4; dm.data[j] = dm.data[j + 1] = dm.data[j + 2] = v; dm.data[j + 3] = 255; }
    const r = Depth.build(Object.assign({}, src, { depthMap: dm }), P);
    assert.strictEqual(r.used, "layer");
    assert.ok(r.D[10 * w + 90] > 0.9 && r.D[10 * w + 3] < 0.1, "left far, right near");
    assert.ok(/^brightness/.test(Depth.build(src, P).used), "no layer -> brightness");
    const P2 = S.merge(S.DEFAULTS, {}); P2.scale = 1;
    assert.ok(/no subject/.test(Depth.build(src, P2).used));
  });

  await t("depthtone: depth map view and the optional hidden depth layer", async () => {
    const P = S.merge(S.DEFAULTS, { view: { depth: true } }); P.scale = 1;
    assert.deepStrictEqual((await E.render(src, P)).layers.map((L) => L.name), ["Depth map"]);
    const P2 = S.merge(S.DEFAULTS, { out: { depthLayer: true } }); P2.scale = 1;
    const r = await E.render(src, P2);
    assert.strictEqual(r.layers[0].name, "Depth map"); assert.strictEqual(r.layers[0].hidden, true);
    assert.strictEqual(r.layers[1].name, "Terraces");
  });

  await t("depthtone panel: Smart depth runs Select Subject inside a rolled-back history step and feeds the mask", async () => {
    const { loadPanel } = require("./harness.js");
    let resumed = null;
    const P = await loadPanel(path.join(ROOT, "plugins", "depthtone"), { withDoc: true, extend: (host) => {
      const ex = host.photoshop.core.executeAsModal;
      host.photoshop.core.executeAsModal = async (fn, o) => { host.calls.push(["executeAsModal", o && o.commandName]); return fn({ hostControl: { async suspendHistory(o2) { host.calls.push(["suspendHistory", o2.name]); return 9; }, async resumeHistory(id, commit) { resumed = commit; host.calls.push(["resumeHistory", commit]); } } }); };
      host.photoshop.imaging.getSelection = async (o) => {
        host.calls.push(["getSelection", JSON.stringify(o.targetSize || null)]);
        const tw = o.targetSize ? o.targetSize.width : 400, th = o.targetSize ? o.targetSize.height : 300, d = new Uint8Array(tw * th);
        for (let y = Math.round(th * 0.2); y < th; y++) for (let x = Math.round(tw * 0.4); x < Math.round(tw * 0.6); x++) d[y * tw + x] = 255;
        return { imageData: { width: tw, height: th, components: 1, async getData() { return d; }, dispose() {} } };
      };
      void ex;
    } });
    await P.settle(400);
    const calls = P.host.calls.map((c) => c.join(" "));
    assert.ok(calls.some((c) => c === "batchPlay autoCutout"), "Select Subject ran");
    assert.ok(calls.some((c) => /^getSelection/.test(c)), "selection read");
    assert.strictEqual(resumed, false, "history rolled back, user's selection untouched");
    const ap = P.document.querySelector(".apply") || [...P.document.querySelectorAll("button,div")].find((b) => b.textContent === "Apply");
    assert.ok(ap, "has Apply");
    // picking a look keeps the depth source and the chosen depth layer
    const S = P.mod._test.state; S.depth.source = "layer"; S.depth.layerId = 7; S.depth.layerName = "Depth";
    const cell = Array.from(P.document.querySelectorAll(".lookgrid .look")).pop();
    if (cell) { cell.dispatchEvent(new P.window.Event("click")); await P.settle(200); }
    const S2 = P.mod._test.state;
    assert.ok(cell, "look browser has looks");
    assert.strictEqual(S2.depth.source, "layer"); assert.strictEqual(S2.depth.layerId, 7); assert.strictEqual(S2.depth.layerName, "Depth");
  });

  await t("depthtone panel matches its golden fingerprint (UI, 18 presets, Apply)", () => {
    const outp = execFileSync(process.execPath, [path.join(__dirname, "fingerprint.js"), path.join(ROOT, "plugins", "depthtone")], { encoding: "utf8", env: process.env, timeout: 300000 });
    const got = JSON.parse(outp), want = JSON.parse(fs.readFileSync(path.join(__dirname, "depthtone.golden.json"), "utf8"));
    assert.deepStrictEqual(got, want);
    assert.strictEqual(new Set(got.presets.map((p) => p.split(" = ")[1])).size, got.presets.length, "every preset looks different");
  });
};
