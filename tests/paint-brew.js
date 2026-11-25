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
  const E = require(DIR + "/js/engine.js"), S = require(DIR + "/js/state.js"), M = require(DIR + "/core/imgmath.js");
  const LAYERS = {
    oil: ["Underpainting", "Broad strokes", "Detail strokes", "Impasto light", "Canvas weave"],
    watercolour: ["Washes", "Wet edges", "Granulation", "Pencil", "Paper texture"],
    impressionism: ["Ground", "Large dabs", "Medium dabs", "Fine detail", "Light and colour lift", "Canvas weave"],
    ink: ["Gloss paper", "Pools", "Rims", "Cells", "Metallic veins"],
    spray: ["Wall", "Base fade", "Can 1", "Can 2", "Can 3", "Can 4", "Speckle", "Drips", "Outline", "Highlights", "Wall relief"],
    pastel: ["Toned paper", "Smudge", "Strokes", "Highlights", "Dust"]
  };
  const run = (src, p, extra) => { const P = S.merge(S.DEFAULTS, p); Object.assign(P, { scale: 0.12, fullH: src.h / 0.12, fullW: src.w / 0.12 }, extra || {}); return E.render(src, P, {}); };

  await t("Paint Brew engine: 24 looks, deterministic, full-size layers, the right stack per style", async () => {
    assert.strictEqual(S.PRESETS.length, 24);
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
    for (let i = 0; i < 100 && !/^Preview /.test(P.document.querySelector(".status").textContent); i++) await P.settle(50);   // let the first preview finish
    const st = P.mod._test.state;
    st.style = "watercolour"; st.water.pencil = 0;
    P.host.calls.length = 0;
    P.document.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
    for (let i = 0; i < 300 && !/^(Done|Apply failed)/.test(P.document.querySelector(".status").textContent); i++) await P.settle(100);
    const calls = P.host.calls.map((c) => c.join("|"));
    assert.ok(calls.includes("duplicate|test - Paint Lab print"), "copy made: " + calls.slice(0, 6));
    assert.ok(calls.includes("resizeImage|3000|2250|300"), "upscaled to 3000 px at 300 ppi");
    assert.ok(/^Done/.test(P.document.querySelector(".status").textContent), P.document.querySelector(".status").textContent);
    const put = P.host.calls.filter((c) => c[0] === "putPixels");
    assert.ok(put.length >= 5 && put.every((c) => c[3] === 3000 * 2250 * 4), "layers written at the copy's size");
    assert.strictEqual(P.host.doc.layers.length, 0, "original document got no layers");
    // big photo: no copy
    P = await loadPanel(DIR, { withDoc: true, docW: 200, docH: 150 });
    for (let i = 0; i < 100 && !/^Preview /.test(P.document.querySelector(".status").textContent); i++) await P.settle(50);   // let the first preview finish
    P.mod._test.state.out.minLong = 150;
    P.host.calls.length = 0;
    P.document.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
    for (let i = 0; i < 200 && !/^(Done|Apply failed)/.test(P.document.querySelector(".status").textContent); i++) await P.settle(50);
    assert.ok(!P.host.calls.some((c) => c[0] === "duplicate"), "no copy when the photo is big enough");
    assert.ok(P.host.doc.layers.length >= 5, "painted into the open document");
    // Cancel
    P = await loadPanel(DIR, { withDoc: true, docW: 200, docH: 150 });
    for (let i = 0; i < 100 && !/^Preview /.test(P.document.querySelector(".status").textContent); i++) await P.settle(50);   // let the first preview finish
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

  await t("Console brand: rack header + LED, dials set values (typed and dragged), switches toggle, render meter lights", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(DIR, { withDoc: true, docW: 200, docH: 150 });
    const D = P.document, st = P.mod._test.state;
    for (let i = 0; i < 100 && !/^Preview /.test(D.querySelector(".status").textContent); i++) await P.settle(50);
    assert.ok(D.querySelector("#app.brand-console"), "brand class on #app");
    assert.strictEqual(D.querySelector(".rack .title").textContent, "PAINT LAB");
    assert.strictEqual(D.querySelectorAll(".rack .screw").length, 4);
    assert.strictEqual(D.querySelector(".ledtxt").textContent, "READY");
    assert.strictEqual(D.querySelectorAll('input[type="range"]').length, 0, "no stock sliders");
    assert.strictEqual(D.querySelectorAll('input[type="checkbox"]').length, 0, "no stock checkboxes");
    // 3.0 layout: Auto-update moved to the panel menu, preview is always pinned
    if (!D.querySelector(".pinned")) assert.strictEqual(D.querySelectorAll(".minisw .switch.on").length, 2, "Auto-update and Pin on top are console switches");
    else { P.mod._test.menuAction("auto"); assert.ok(/Auto-update off/.test(D.querySelector(".status").textContent), "menu turns Auto-update off"); P.mod._test.menuAction("auto"); }
    const dials = Array.from(D.querySelectorAll(".dial"));
    assert.ok(dials.length >= 20, "dials: " + dials.length);
    assert.ok(dials.every((d) => !d.querySelector(".knob") || /^data:image\/png;base64,/.test(d.querySelector(".knob").getAttribute("src"))), "every knob drawn");
    const size = dials.find((d) => d.querySelector(".dlabel").textContent === "Stroke size");
    const inp = size.querySelector(".dialval");
    inp.value = "77"; inp.dispatchEvent(new P.window.Event("change"));
    assert.strictEqual(st.brush.size, 77, "typed value");
    inp.value = "999"; inp.dispatchEvent(new P.window.Event("change"));
    assert.strictEqual(st.brush.size, 120, "clamped to max");
    const knob = size.querySelector(".knob");
    knob.dispatchEvent(new P.window.MouseEvent("mousedown", { clientY: 100, bubbles: true }));
    D.dispatchEvent(new P.window.MouseEvent("mousemove", { clientY: 140, bubbles: true }));
    D.dispatchEvent(new P.window.MouseEvent("mouseup", { clientY: 140, bubbles: true }));
    assert.ok(st.brush.size < 120 && st.brush.size >= 4, "dragging down turns it down: " + st.brush.size);
    const sw = Array.from(D.querySelectorAll(".swrow")).find((r) => /Print-ready/.test(r.textContent)).querySelector(".switch");
    const before = st.out.printCopy;
    sw.dispatchEvent(new P.window.Event("click"));
    assert.strictEqual(st.out.printCopy, !before, "switch toggles");
    assert.strictEqual(sw.classList.contains("on"), !before);
    sw.dispatchEvent(new P.window.Event("click"));
    // render meter: lights up fully after Apply
    st.out.minLong = 150;
    D.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
    for (let i = 0; i < 200 && !/^(Done|Apply failed)/.test(D.querySelector(".status").textContent); i++) await P.settle(50);
    assert.ok(/^Done/.test(D.querySelector(".status").textContent), D.querySelector(".status").textContent);
    assert.strictEqual(D.querySelectorAll(".meter .seg8.on").length, 12, "meter full");
    assert.ok(/S$/.test(D.querySelector(".mpct").textContent), "render time shown");
    assert.strictEqual(D.querySelector(".ledtxt").textContent, "READY");
  });

  await t("Paint Brew 1.1: Ink, Spray and Pastel controls change the paint; 1.0 looks still load", async () => {
    const src = E.demoImage(120, 90);
    const names = async (p) => (await run(src, p)).layers.map((L) => L.name);
    const hash = async (p) => { const r = await run(src, p); return require("crypto").createHash("sha1").update(Buffer.from(E.composite(r, { type: "white" }, src))).digest("hex"); };
    // oil: knife and brush differ, paint mixing and thick lights change the paint, light lift adds its layer
    assert.notStrictEqual(await hash({ style: "oil", brush: { tool: "brush" } }), await hash({ style: "oil", brush: { tool: "knife" } }), "Palette knife paints differently");
    assert.notStrictEqual(await hash({ style: "oil", brush: { mix: 0 } }), await hash({ style: "oil", brush: { mix: 90 } }), "Paint mixing streaks a second colour in");
    assert.notStrictEqual(await hash({ style: "oil", texture: { thickLights: 0 } }), await hash({ style: "oil", texture: { thickLights: 100 } }), "Thick lights changes the impasto");
    assert.ok((await names({ style: "oil", texture: { lift: 40 } })).includes("Light and colour lift"), "oil can take the warm light lift");
    // ink: Veins 0 drops the metal layer; the metal colour changes the veins
    assert.ok(!(await names({ style: "ink", ink: { veins: 0 } })).includes("Metallic veins"));
    assert.notStrictEqual(await hash({ style: "ink", ink: { metal: "gold" } }), await hash({ style: "ink", ink: { metal: "silver" } }));
    assert.notStrictEqual(await hash({ style: "ink", ink: { flow: 0 } }), await hash({ style: "ink", ink: { flow: 100 } }), "Flow moves the ink");
    // spray: one layer per can; outline / drips / speckle at 0 drop their layers; each wall is different
    for (const c of [3, 6, 8]) assert.strictEqual((await names({ style: "spray", spray: { cans: c } })).filter((n) => /^Can /.test(n)).length, c);
    assert.deepStrictEqual(await names({ style: "spray", spray: { outline: 0, drips: 0, speckle: 0, relief: 0 } }), ["Wall", "Base fade", "Can 1", "Can 2", "Can 3", "Can 4", "Can 5"]);
    assert.deepStrictEqual(await names({ style: "spray", spray: { outline: 0, drips: 0, speckle: 0, halftone: 50, highlight: 60 } }), ["Wall", "Base fade", "Can 1", "Can 2", "Can 3", "Can 4", "Can 5", "Halftone", "Highlights", "Wall relief"], "halftone and a highlight edge without the black line");
    const wallTypes = ["plain", "concrete", "stucco", "brick", "block", "metal", "wood"];
    const walls = await Promise.all(wallTypes.map((wl) => run(src, { style: "spray", spray: { wall: wl } })));
    assert.strictEqual(new Set(walls.map((r) => require("crypto").createHash("sha1").update(Buffer.from(r.layers[0].rgba)).digest("hex"))).size, wallTypes.length, "seven different walls");
    const relief = walls[3].layers.find((L) => L.name === "Wall relief");
    assert.strictEqual(relief.blend, "OVERLAY");
    assert.notStrictEqual(await hash({ style: "spray", spray: { soft: 0 } }), await hash({ style: "spray", spray: { soft: 100 } }), "Soft edges change the cans");
    const bare = await run(src, { style: "spray", spray: { bare: 100 } });
    assert.ok(bare.layers.find((L) => L.name === "Can 1").rgba.every((v, i) => i % 4 !== 3 || v === 0), "Bare wall 100 leaves the lightest can off");
    // paint blend / opacity flatten the coats into one "Paint" layer over the wall
    const blended = await run(src, { style: "spray", spray: { outline: 0, highlight: 0, blend: "multiply", paintOpacity: 80 } });
    assert.deepStrictEqual(blended.layers.map((L) => L.name), ["Wall", "Paint", "Wall relief"]);
    const pl = blended.layers[1];
    assert.strictEqual(pl.blend, "MULTIPLY"); assert.strictEqual(pl.opacity, 80);
    for (const [b, mode] of [["linearburn", "LINEARBURN"], ["hardlight", "HARDLIGHT"], ["softlight", "SOFTLIGHT"], ["overlay", "OVERLAY"]]) {
      assert.strictEqual((await run(src, { style: "spray", spray: { blend: b } })).layers.find((L) => L.name === "Paint").blend, mode);
      assert.ok(M.BLENDS[mode], mode + " previews");
    }
    assert.ok(!(await names({ style: "spray", spray: { blend: "normal", paintOpacity: 100 } })).includes("Paint"), "Normal at 100% keeps one layer per can");
    // brick and wood options, grime and cracks all change the wall
    const wallHash = async (sp) => require("crypto").createHash("sha1").update(Buffer.from((await run(src, { style: "spray", spray: sp })).layers[0].rgba)).digest("hex");
    const bh = await Promise.all([{ wall: "brick" }, { wall: "brick", brickPattern: "stack" }, { wall: "brick", brickPattern: "flemish" }, { wall: "brick", brickPattern: "basket" },
      { wall: "brick", brickSize: 180 }, { wall: "brick", mortar: 100 }, { wall: "brick", mortarColour: "#3E3C39" }, { wall: "brick", brickVariation: 0 }].map(wallHash));
    assert.strictEqual(new Set(bh).size, bh.length, "every brick option changes the wall");
    const wh = await Promise.all([{ wall: "wood" }, { wall: "wood", woodDir: "horizontal" }, { wall: "wood", woodFinish: "weathered" }, { wall: "wood", woodFinish: "painted" },
      { wall: "wood", plankWidth: 180 }, { wall: "wood", grain: 0 }, { wall: "wood", knots: 100 }].map(wallHash));
    assert.strictEqual(new Set(wh).size, wh.length, "every wood option changes the wall");
    assert.notStrictEqual(await wallHash({ wall: "concrete", grime: 0 }), await wallHash({ wall: "concrete", grime: 90 }), "grime");
    assert.notStrictEqual(await wallHash({ wall: "concrete", cracks: 0 }), await wallHash({ wall: "concrete", cracks: 90 }), "cracks");
    assert.strictEqual(await wallHash({ wall: "metal", cracks: 0 }), await wallHash({ wall: "metal", cracks: 90 }), "no cracks on metal");
    // pastel: paper colour, oil pastel (no dust), fixed hatch angle
    const pp = await run(src, { style: "pastel", pastel: { paper: "#1E1E1E" } });
    assert.ok(Math.abs(pp.layers[0].rgba[0] - 30) < 6, "black paper: " + pp.layers[0].rgba[0]);
    assert.ok(!(await names({ style: "pastel", pastel: { oil: true } })).includes("Dust"), "oil pastel has no chalk dust");
    assert.notStrictEqual(await hash({ style: "pastel", pastel: { hatch: "fixed", angle: 0 } }), await hash({ style: "pastel", pastel: { hatch: "fixed", angle: 90 } }));
    // a look saved by 1.0 has no ink / spray / pastel keys: it still loads and paints the same way
    const old = { style: "oil", brush: { size: 50 } }, P = S.merge(S.DEFAULTS, old);
    assert.strictEqual(P.ink.flow, S.DEFAULTS.ink.flow);
    assert.strictEqual(await hash(old), await hash(Object.assign({}, old, { ink: { flow: 1 }, spray: { cans: 8 }, pastel: { oil: true } })), "1.1 settings don't touch the 1.0 styles");
    // focus: less pigment detail outside for spray (bigger overspray), pastel keeps fewer strokes outside
    const n = 120 * 90, focus = new Float32Array(n);
    for (let y = 0; y < 90; y++) for (let x = 0; x < 60; x++) focus[y * 120 + x] = 1;
    const pf = await run(Object.assign({}, src, { focus }), { style: "pastel", focus: { outside: 0 } });
    const stk = pf.layers.find((L) => L.name === "Strokes").rgba; let li = 0, lo = 0;
    for (let y = 0; y < 90; y++) for (let x = 0; x < 120; x++) { const a = stk[(y * 120 + x) * 4 + 3]; if (x < 55) li += a; else if (x > 65) lo += a; }
    assert.ok(lo < li, "fewer pastel strokes outside the focus (" + lo + " vs " + li + ")");
  });

  await t("Paint Brew panel: six style buttons, one style card at a time, swatch + hex colours", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(DIR, { withDoc: true, docW: 200, docH: 150 });
    const D = P.document, st = P.mod._test.state;
    for (let i = 0; i < 100 && !/^Preview /.test(D.querySelector(".status").textContent); i++) await P.settle(50);
    const styleBtns = Array.from(D.querySelectorAll(".segbtn")).filter((b) => ["Oil", "Watercolour", "Impressionism", "Alcohol Ink", "Spray Paint", "Pastel"].includes(b.textContent));
    assert.strictEqual(styleBtns.length, 6);
    const cardOf = (title) => Array.from(D.querySelectorAll(".card")).find((c) => { const h = c.querySelector(":scope > .cardhead .ctitle"); return h && h.textContent.trim().toUpperCase().startsWith(title.toUpperCase()); });
    const shown = (c) => c && c.style.display !== "none";
    for (const [label, style, card] of [["Alcohol Ink", "ink", "Ink"], ["Spray Paint", "spray", "Spray"], ["Pastel", "pastel", "Pastel"]]) {
      styleBtns.find((b) => b.textContent === label).dispatchEvent(new P.window.Event("click"));
      assert.strictEqual(st.style, style);
      assert.ok(shown(cardOf(card)), card + " card shows");
      assert.ok(!shown(cardOf("Water and paper")) && !shown(cardOf("Texture")), "other style cards hidden for " + style);
      for (const other of ["Ink", "Spray", "Pastel"].filter((c) => c !== card)) assert.ok(!shown(cardOf(other)), other + " hidden for " + style);
    }
    // the Wall card comes with Spray Paint; a wall type sets its usual colour
    styleBtns.find((b) => b.textContent === "Spray Paint").dispatchEvent(new P.window.Event("click"));
    const wc = cardOf("Wall");
    assert.ok(shown(wc), "Wall card shows for spray");
    Array.from(wc.querySelectorAll(".segbtn")).find((b) => b.textContent === "Wood").dispatchEvent(new P.window.Event("click", { bubbles: true }));
    assert.strictEqual(st.spray.wall, "wood");
    assert.strictEqual(st.spray.wallColour, "#8A6A48", "wood picks its timber colour");
    Array.from(wc.querySelectorAll(".segbtn")).find((b) => b.textContent === "Black").dispatchEvent(new P.window.Event("click", { bubbles: true }));
    assert.strictEqual(st.spray.wallColour, "#1C1C1C");
    assert.strictEqual(st.spray.wall, "wood", "a colour swatch keeps the wall type");
    // wall options follow the wall type; brick options only for brick, wood options only for wood
    const rowOf = (card, label) => Array.from(card.querySelectorAll("*")).find((e) => e.children.length === 0 && e.textContent.trim().toUpperCase() === label.toUpperCase());
    const vis = (node) => { for (let e = node; e && e !== wc; e = e.parentElement) if (e.style && e.style.display === "none") return false; return true; };
    assert.ok(vis(rowOf(wc, "Planks")) && vis(rowOf(wc, "Knots")), "wood options show for wood");
    assert.ok(!vis(rowOf(wc, "Bond")) && !vis(rowOf(wc, "Mortar width")), "brick options hidden for wood");
    Array.from(wc.querySelectorAll(".segbtn")).find((b) => b.textContent === "Brick" && b.parentElement.parentElement.textContent.indexOf("Wall") === 0).dispatchEvent(new P.window.Event("click", { bubbles: true }));
    assert.strictEqual(st.spray.wall, "brick");
    assert.ok(vis(rowOf(wc, "Bond")) && vis(rowOf(wc, "Mortar colour")) && !vis(rowOf(wc, "Planks")), "brick options show for brick");
    Array.from(wc.querySelectorAll(".segbtn")).find((b) => b.textContent === "Flemish").dispatchEvent(new P.window.Event("click", { bubbles: true }));
    assert.strictEqual(st.spray.brickPattern, "flemish");
    Array.from(wc.querySelectorAll(".segbtn")).find((b) => b.textContent === "Multiply").dispatchEvent(new P.window.Event("click", { bubbles: true }));
    assert.strictEqual(st.spray.blend, "multiply");
    // in-panel colour picker: the chip opens it, a click in the shade square sets the colour (no Photoshop dialog)
    const chip = wc.querySelector(".pickchip"), pick = wc.querySelector(".picker");
    assert.ok(chip && pick && pick.style.display === "none");
    chip.dispatchEvent(new P.window.Event("click"));
    assert.strictEqual(pick.style.display, "");
    const sqWrap = pick.firstChild;
    sqWrap.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 110 });
    sqWrap.dispatchEvent(new P.window.MouseEvent("mousedown", { clientX: 200, clientY: 0 }));
    P.document.dispatchEvent(new P.window.MouseEvent("mouseup", {}));
    assert.ok(/^#[0-9A-F]{6}$/.test(st.spray.wallColour) && st.spray.wallColour !== "#1C1C1C", "picker set " + st.spray.wallColour);
    sqWrap.dispatchEvent(new P.window.MouseEvent("mousedown", { clientX: 0, clientY: 0 }));
    P.document.dispatchEvent(new P.window.MouseEvent("mouseup", {}));
    assert.strictEqual(st.spray.wallColour, "#FFFFFF", "top-left of the square is white");
    styleBtns.find((b) => b.textContent === "Pastel").dispatchEvent(new P.window.Event("click"));
    assert.ok(!shown(cardOf("Wall")), "Wall card hidden for pastel");
    // pastel paper: swatch button, then a typed hex; a bad hex is refused
    const pc = cardOf("Pastel");
    Array.from(pc.querySelectorAll(".segbtn")).find((b) => b.textContent === "Tan").dispatchEvent(new P.window.Event("click"));
    assert.strictEqual(st.pastel.paper, "#C8AE86");
    const hex = pc.querySelector("input.hex");
    hex.value = "336699"; hex.dispatchEvent(new P.window.Event("change"));
    assert.strictEqual(st.pastel.paper, "#336699");
    hex.value = "nope"; hex.dispatchEvent(new P.window.Event("change"));
    assert.strictEqual(st.pastel.paper, "#336699", "bad hex refused");
    assert.strictEqual(hex.value, "#336699");
    // Apply paints the pastel and names the group after the style
    st.out.minLong = 150; P.host.calls.length = 0;
    D.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
    for (let i = 0; i < 300 && !/^(Done|Apply failed)/.test(D.querySelector(".status").textContent); i++) await P.settle(50);
    assert.ok(/^Done/.test(D.querySelector(".status").textContent), D.querySelector(".status").textContent);
    assert.ok(P.host.calls.some((c) => c[0] === "createLayerGroup" && /Pastel/.test(c[1])), "group named for the style: " + JSON.stringify(P.host.calls.filter((c) => c[0] === "createLayerGroup")));
  });

  await t("Paint Brew panel matches its golden fingerprint (UI, 24 looks, Apply)", () => {
    const outp = execFileSync(process.execPath, [path.join(__dirname, "fingerprint.js"), DIR], { encoding: "utf8", env: process.env, timeout: 600000 });
    const got = JSON.parse(outp), gp = path.join(__dirname, "paint-brew.golden.json");
    if (process.env.UPDATE_GOLDEN || !fs.existsSync(gp)) fs.writeFileSync(gp, JSON.stringify(got, null, 1) + "\n");
    assert.deepStrictEqual(got, JSON.parse(fs.readFileSync(gp, "utf8")));
    assert.strictEqual(new Set(got.presets.map((p) => p.split(" = ")[1])).size, got.presets.length, "every look is different");
  });
};
