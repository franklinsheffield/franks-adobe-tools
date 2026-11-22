"use strict";
// Paint Brew tests: engine (all looks, determinism, layer stacks, focus),
// print-ready copy, focus reading, Cancel, and the panel golden fingerprint.
const path = require("path");
const fs = require("fs");
const assert = require("assert");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "plugins/paint-brew");

module.exports = async function (t) {
  const E = require(DIR + "/js/engine.js"), S = require(DIR + "/js/state.js");
  const LAYERS = {
    oil: ["Underpainting", "Broad strokes", "Detail strokes", "Impasto light", "Canvas weave"],
    watercolour: ["Washes", "Wet edges", "Granulation", "Pencil", "Paper texture"],
    impressionism: ["Ground", "Large dabs", "Medium dabs", "Fine detail", "Light and colour lift", "Canvas weave"]
  };
  const run = (src, p, extra) => { const P = S.merge(S.DEFAULTS, p); Object.assign(P, { scale: 0.12, fullH: src.h / 0.12, fullW: src.w / 0.12 }, extra || {}); return E.render(src, P, {}); };

  await t("Paint Brew engine: 9 looks, deterministic, full-size layers, the right stack per style", async () => {
    assert.strictEqual(S.PRESETS.length, 9);
    const src = E.demoImage(120, 90);
    const seen = new Set();
    for (const pr of S.PRESETS) {
      const a = await run(src, pr.p), b = await run(src, pr.p);
      assert.ok(a.layers.length >= 3, pr.name + ": layers");
      a.layers.forEach((L, i) => { assert.strictEqual(L.rgba.length, 120 * 90 * 4, pr.name + " " + L.name + ": size"); assert.ok(Buffer.from(L.rgba).equals(Buffer.from(b.layers[i].rgba)), pr.name + " " + L.name + ": deterministic"); });
      const h = require("crypto").createHash("sha1").update(Buffer.from(E.composite(a, { type: "white" }, src))).digest("hex");
      assert.ok(!seen.has(h), pr.name + ": looks different from the other presets"); seen.add(h);
    }
    for (const style of Object.keys(LAYERS)) { const pr = S.PRESETS.find((x) => x.p.style === style); assert.deepStrictEqual((await run(src, pr.p)).layers.map((L) => L.name), LAYERS[style], pr.name); }
    const wc = await run(src, { style: "watercolour", water: { paperColour: "#F0E0C0" } });
    assert.deepStrictEqual(wc.paper, [240, 224, 192], "watercolour carries its paper colour");
    const oil = await run(src, { style: "oil" });
    assert.strictEqual(oil.layers[0].rgba[3], 255, "underpainting is opaque");
    assert.deepStrictEqual(oil.layers.map((L) => L.blend), ["NORMAL", "NORMAL", "NORMAL", "OVERLAY", "OVERLAY"]);
  });

  await t("Paint Brew engine: sizes scale with the image (same look at 1x and 2x)", async () => {
    const small = E.demoImage(80, 60), big = E.demoImage(160, 120);
    const a = await run(small, { style: "oil" }, { scale: 1, fullW: 80, fullH: 60 });
    const b = await run(big, { style: "oil" }, { scale: 1, fullW: 160, fullH: 120 });
    // mean colour of the finished painting is close (strokes cover the same share of the picture)
    const mean = (res, src) => { const c = E.composite(res, { type: "white" }, src); let s = 0; for (const v of c) s += v; return s / c.length; };
    assert.ok(Math.abs(mean(a, small) - mean(b, big)) < 6, mean(a, small) + " vs " + mean(b, big));
  });

  await t("Paint Brew engine: the focus area keeps detail; watercolour fades to paper outside it", async () => {
    const src = E.demoImage(120, 90), n = 120 * 90, focus = new Float32Array(n);
    for (let y = 0; y < 90; y++) for (let x = 0; x < 60; x++) focus[y * 120 + x] = 1;        // left half is the subject
    const wc = await run(Object.assign({}, src, { focus }), { style: "watercolour", water: { fade: 0 }, focus: { falloff: 0, outside: 0 } });
    const wash = wc.layers[0].rgba;
    let inside = 0, outside = 0;
    for (let y = 0; y < 90; y++) for (let x = 0; x < 120; x++) { const v = 765 - wash[(y * 120 + x) * 4] - wash[(y * 120 + x) * 4 + 1] - wash[(y * 120 + x) * 4 + 2]; if (x < 50) inside += v; else if (x > 70) outside += v; }
    assert.ok(outside < inside * 0.25, "pigment outside " + outside + " vs inside " + inside);
    const oil = await run(Object.assign({}, src, { focus }), { style: "oil", focus: { outside: 0 } });
    const det = oil.layers[2].rgba; let li = 0, lo = 0;
    for (let y = 0; y < 90; y++) for (let x = 0; x < 120; x++) { const a = det[(y * 120 + x) * 4 + 3]; if (x < 55) li += a; else if (x > 65) lo += a; }
    assert.ok(lo < li, "fewer detail strokes outside the focus (" + lo + " vs " + li + ")");
  });

  await t("Paint Brew panel: small photo -> print-ready copy (upscaled, 300 ppi), painted there, original untouched; Cancel stops cleanly", async () => {
    const { loadPanel } = require("./harness.js");
    let P = await loadPanel(DIR, { withDoc: true, docW: 200, docH: 150 });
    const st = P.mod._test.state;
    st.style = "watercolour"; st.water.pencil = 0;
    P.host.calls.length = 0;
    P.document.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
    for (let i = 0; i < 300 && !/^(Done|Apply failed)/.test(P.document.querySelector(".status").textContent); i++) await P.settle(100);
    const calls = P.host.calls.map((c) => c.join("|"));
    assert.ok(calls.includes("duplicate|test - Paint Brew print"), "copy made: " + calls.slice(0, 6));
    assert.ok(calls.includes("resizeImage|3000|2250|300"), "upscaled to 3000 px at 300 ppi");
    assert.ok(/^Done/.test(P.document.querySelector(".status").textContent), P.document.querySelector(".status").textContent);
    const put = P.host.calls.filter((c) => c[0] === "putPixels");
    assert.ok(put.length >= 5 && put.every((c) => c[3] === 3000 * 2250 * 4), "layers written at the copy's size");
    assert.strictEqual(P.host.doc.layers.length, 0, "original document got no layers");
    // big photo: no copy
    P = await loadPanel(DIR, { withDoc: true, docW: 200, docH: 150 });
    P.mod._test.state.out.minLong = 150;
    P.host.calls.length = 0;
    P.document.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
    for (let i = 0; i < 200 && !/^(Done|Apply failed)/.test(P.document.querySelector(".status").textContent); i++) await P.settle(50);
    assert.ok(!P.host.calls.some((c) => c[0] === "duplicate"), "no copy when the photo is big enough");
    assert.ok(P.host.doc.layers.length >= 5, "painted into the open document");
    // Cancel
    P = await loadPanel(DIR, { withDoc: true, docW: 200, docH: 150 });
    const btn = P.document.querySelector(".apply");
    btn.dispatchEvent(new P.window.Event("click"));
    await P.settle(30);
    assert.strictEqual(btn.textContent, "Cancel");
    btn.dispatchEvent(new P.window.Event("click"));
    for (let i = 0; i < 200 && !/^Cancelled/.test(P.document.querySelector(".status").textContent); i++) await P.settle(50);
    assert.ok(/^Cancelled/.test(P.document.querySelector(".status").textContent), P.document.querySelector(".status").textContent);
    assert.ok(!P.host.calls.some((c) => c[0] === "createLayerGroup" && /^Frank's Paint Brew/.test(c[1]) && c[0] === "x"));
    assert.strictEqual(btn.textContent, "Apply to document");
  });

  await t("Paint Brew panel: focus from the selection reaches the engine at the preview's size", async () => {
    const { loadPanel } = require("./harness.js");
    let seen = null;
    const P = await loadPanel(DIR, { withDoc: true, extend: (h) => {
      h.photoshop.imaging.getSelection = async (o) => {
        h.calls.push(["getSelection", JSON.stringify(o.sourceBounds), JSON.stringify(o.targetSize || null)]);
        seen = o;
        const w = o.targetSize ? o.targetSize.width : o.sourceBounds.right - o.sourceBounds.left, hh = o.targetSize ? o.targetSize.height : o.sourceBounds.bottom - o.sourceBounds.top;
        const d = new Uint8Array(w * hh).fill(255);
        return { imageData: { width: w, height: hh, components: 1, async getData() { return d; }, dispose() {} } };
      };
    } });
    P.mod._test.state.out.focus = "selection";
    P.mod._test.touch();
    for (let i = 0; i < 100 && !seen; i++) await P.settle(50);
    assert.ok(seen, "selection read");
    assert.deepStrictEqual(seen.sourceBounds, { left: 0, top: 0, right: 400, bottom: 300 });
    assert.deepStrictEqual(seen.targetSize, { width: 360, height: 270 });
  });

  await t("Paint Brew panel matches its golden fingerprint (UI, 9 looks, Apply)", () => {
    const outp = execFileSync(process.execPath, [path.join(__dirname, "fingerprint.js"), DIR], { encoding: "utf8", env: process.env, timeout: 600000 });
    const got = JSON.parse(outp), gp = path.join(__dirname, "paint-brew.golden.json");
    if (process.env.UPDATE_GOLDEN || !fs.existsSync(gp)) fs.writeFileSync(gp, JSON.stringify(got, null, 1) + "\n");
    assert.deepStrictEqual(got, JSON.parse(fs.readFileSync(gp, "utf8")));
    assert.strictEqual(new Set(got.presets.map((p) => p.split(" = ")[1])).size, got.presets.length, "every look is different");
  });
};
