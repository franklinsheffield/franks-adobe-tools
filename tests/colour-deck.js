"use strict";
// Colour Deck: shared colour control (shared/colour.js + shared/colourdeck.js)
const assert = require("assert");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const TOOLS = ["dithers-brew", "chrometone", "depthtone", "mobglow", "decompressor", "crt-phaser", "paint-brew"];

module.exports = async function (t) {
  const C = require("../shared/colour.js");
  const ramp = (w) => { const d = new Uint8Array(w * 4 * 3); for (let i = 0; i < w * 4; i++) d.fill(Math.round((i % w) / (w - 1) * 255), i * 3, i * 3 + 3); return { w, h: 4, c: 3, data: d }; };
  const px = (o, x) => Array.from(o.slice(x * 4, x * 4 + 4));

  await t("Colour Deck Tone Map: each colour owns its tone range; gaps show the background; Knockout makes them transparent", () => {
    const D = C.normalize({ mode: "tone", tone: { n: 2, trans: "hard", bg: "#00FF00", bands: [{ c: "#FF0000", a: 0, b: 30 }, { c: "#0000FF", a: 70, b: 100 }] } });
    const o = C.render(ramp(101), D);
    assert.deepStrictEqual(px(o, 10), [255, 0, 0, 255]);
    assert.deepStrictEqual(px(o, 50), [0, 255, 0, 255], "gap = background");
    assert.deepStrictEqual(px(o, 90), [0, 0, 255, 255]);
    D.tone.knockout = true;
    assert.strictEqual(C.render(ramp(101), D)[50 * 4 + 3], 0, "knockout gap is transparent");
  });

  await t("Colour Deck Tone Map: overlaps blend Hard, Smooth or Dither", () => {
    const base = { mode: "tone", tone: { n: 2, bg: "#000000", bands: [{ c: "#000000", a: 0, b: 60 }, { c: "#FFFFFF", a: 40, b: 100 }] } };
    const img = { w: 64, h: 64, c: 3, data: new Uint8Array(64 * 64 * 3).fill(128) };
    const vals = (trans) => { const o = C.render(img, C.normalize(Object.assign({}, base, { tone: Object.assign({}, base.tone, { trans }) }))); const s = new Set(); for (let i = 0; i < o.length; i += 4) s.add(o[i]); return [...s].sort((a, b) => a - b); };
    assert.strictEqual(vals("hard").length, 1, "hard = one colour");
    const sm = vals("smooth"); assert.ok(sm.length === 1 && sm[0] > 60 && sm[0] < 200, "smooth = in-between grey " + sm);
    assert.deepStrictEqual(vals("dither"), [0, 255], "dither = a pattern of the two colours");
  });

  await t("Colour Deck Palette: snaps to the nearest swatch; Extract finds the image's colours", () => {
    const D = C.normalize({ mode: "palette", pal: { colors: ["#000000", "#FF0000", "#FFFFFF"], count: 3, match: "nearest" } });
    const img = { w: 3, h: 1, c: 3, data: Uint8Array.from([20, 10, 10, 230, 40, 30, 240, 240, 240]) };
    const o = C.render(img, D);
    assert.deepStrictEqual([px(o, 0), px(o, 1), px(o, 2)], [[0, 0, 0, 255], [255, 0, 0, 255], [255, 255, 255, 255]]);
    D.pal.count = 2;
    assert.deepStrictEqual(px(C.render(img, D), 2), [255, 0, 0, 255], "count limits the swatches used (white is not available)");
    const two = { w: 10, h: 10, c: 3, data: new Uint8Array(300) };
    for (let i = 0; i < 100; i++) two.data.set(i < 50 ? [10, 20, 200] : [250, 200, 10], i * 3);
    assert.deepStrictEqual(C.extract(two, 2), ["#0A14C8", "#FAC80A"]);
  });

  await t("Colour Deck presets and helpers: 16 tone maps, 22 palettes, Reverse and Even spread", () => {
    assert.strictEqual(C.TONEMAPS.length, 16); assert.ok(C.PALETTES.length >= 20);
    C.TONEMAPS.forEach((m) => assert.ok(m.bands.length >= 2 && m.bands.length <= C.MAX_BANDS, m.name));
    const D = C.applyToneMap(C.normalize({}), C.TONEMAPS[0]);
    const first = D.tone.bands[0].c, last = D.tone.bands[D.tone.n - 1].c;
    C.reverse(D); assert.strictEqual(D.tone.bands[0].c, last); assert.strictEqual(D.tone.bands[D.tone.n - 1].c, first);
    D.tone.bands[0].a = 50; C.evenSpread(D); assert.strictEqual(D.tone.bands[0].a, 0);
    assert.strictEqual(C.normalize(null).mode, "off", "old looks without colour load as Off");
  });

  for (const tool of TOOLS) {
    await t(tool + ": Colour Deck card; Tone Map changes the preview and Apply adds a 'Colour Deck' layer on top at Mix opacity; Off is unchanged", async () => {
      const { loadPanel } = require("./harness.js");
      const P = await loadPanel(path.join(ROOT, "plugins", tool), { withDoc: true });
      const d = P.document, T = P.mod._test, img = d.querySelector("img.preview");
      for (let i = 0; i < 200 && !img.src; i++) await P.settle(50);
      // 2.x: "Colour Deck" card with segment buttons; 3.0: "Colour" card with a mode tile grid
      const deckCard = [...d.querySelectorAll(".card")].find((c) => /^Colour( Deck)?$/.test(c.querySelector(".ctitle").textContent.trim()));
      const modeBtn = (v) => [...deckCard.querySelectorAll(".segbtn, .tile")].find((b) => b.textContent.trim() === v || (v === "Tone Map" && b.textContent.trim() === "Tone"));
      assert.ok(deckCard, "card present");
      const wait = async () => { await P.settle(300); for (let i = 0; i < 200 && /^Rendering/.test(d.querySelector(".status").textContent); i++) await P.settle(50); };
      const off = img.src;
      modeBtn("Tone Map").dispatchEvent(new P.window.Event("click"));
      await wait();
      assert.strictEqual(T.state.deck.mode, "tone");
      assert.notStrictEqual(img.src, off, "tone map changes the preview");
      T.state.deck.mix = 60; T.touch(); await wait();
      P.host.calls.length = 0;
      d.querySelector(".apply").dispatchEvent(new P.window.Event("click"));
      for (let i = 0; i < 400 && !/^Done|failed/.test(d.querySelector(".status").textContent); i++) await P.settle(50);
      assert.ok(/^Done/.test(d.querySelector(".status").textContent), d.querySelector(".status").textContent);
      const made = P.host.calls.filter((c) => c[0] === "createPixelLayer").map((c) => c[1]);
      assert.strictEqual(made[made.length - 1], "Colour Deck - Tone Map", "deck layer is the top layer");
      const L = P.host.doc.layers.find((x) => x.name === "Colour Deck - Tone Map");
      if (L) assert.strictEqual(L.opacity, 60);   // Paint Brew writes into a print-ready copy instead
      modeBtn("Off").dispatchEvent(new P.window.Event("click"));
      await wait();
      assert.strictEqual(img.src, off, "Off gives back the exact preview");
    });
  }

  await t("Dithers Brew: Colour Deck can recolour the ink layers instead of adding a layer", async () => {
    const { recolourInks } = require("../shared/colourdeck.js");
    const res = { w: 1, h: 1, layers: [{ name: "Ink", color: [20, 20, 20], mask: new Uint8Array(1), blend: "NORMAL" }] };
    const D = C.normalize({ mode: "palette", pal: { colors: ["#FF0000", "#FFFFFF"], count: 2 } });
    assert.deepStrictEqual(recolourInks(res, D).layers[0].color, [255, 0, 0]);
    assert.strictEqual(recolourInks(res, D).layers.length, 1);
  });
};
