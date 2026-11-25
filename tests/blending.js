"use strict";
// Blending (all plugins): shared/blend.js maths, the Blend card on every pixel tool,
// preview over the source, and Apply setting mode + opacity on the result group.
const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
const TOOLS = ["chrometone", "crt-phaser", "decompressor", "depthtone", "mobglow", "paint-brew", "dithers-brew"];

module.exports = async function (t) {
  const B = require("../shared/blend.js");

  await t("Blending: 27 Photoshop modes; Multiply, Screen, Difference, Color and Luminosity follow Photoshop's maths", () => {
    assert.strictEqual(B.MODES.length, 27);
    assert.strictEqual(B.GROUPS.reduce((a, b) => a + b, 0), 27);
    const px = (m, b, s, a) => B.mixPixel(m, b, s, a == null ? 1 : a, 0).map((v) => Math.round(v * 1000) / 1000);
    assert.deepStrictEqual(px("MULTIPLY", [0.5, 0.5, 0.5], [0.5, 1, 0]), [0.25, 0.5, 0]);
    assert.deepStrictEqual(px("SCREEN", [0.5, 0.5, 0.5], [0.5, 1, 0]), [0.75, 1, 0.5]);
    assert.deepStrictEqual(px("DIFFERENCE", [0.2, 0.8, 0.5], [0.5, 0.5, 0.5]), [0.3, 0.3, 0]);
    assert.deepStrictEqual(px("NORMAL", [0, 0, 0], [1, 1, 1], 0.25), [0.25, 0.25, 0.25]);
    const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    assert.ok(Math.abs(lum(px("COLOR", [0.5, 0.5, 0.5], [1, 0, 0])) - 0.5) < 0.01, "Color keeps the backdrop's luminance");
    assert.ok(Math.abs(lum(px("LUMINOSITY", [1, 0, 0], [0.2, 0.2, 0.2])) - 0.2) < 0.01, "Luminosity takes the result's luminance");
    for (const [m] of B.MODES) px(m, [0.3, 0.6, 0.9], [0.8, 0.1, 0.5]).forEach((v) => assert.ok(v >= 0 && v <= 1 && !Number.isNaN(v), m));
    assert.strictEqual(B.label({ mode: "SCREEN", opacity: 80 }), "SCREEN 80%");
    assert.ok(!B.active({ mode: "NORMAL", opacity: 100 }) && B.active({ mode: "NORMAL", opacity: 60 }) && B.active({ mode: "OVERLAY", opacity: 100 }));
  });

  await t("Blending: every pixel tool has a Blend card above Output; Screen 80% changes the preview and Apply sets it on the group with the source left visible", async () => {
    const { loadPanel } = require("./harness.js");
    for (const tool of TOOLS) {
      let group = null;
      const P = await loadPanel(path.join(ROOT, "plugins", tool), { withDoc: true, extend: (host) => {
        host.photoshop.constants.BlendMode.OVERLAY = "overlay";
        host.doc.layers.push({ id: 1, name: "Background", visible: true, kind: "pixel" });
        const mk = host.doc.createLayerGroup;
        host.doc.createLayerGroup = async (o) => { group = await mk.call(host.doc, o); return group; };
      } });
      await P.settle(600);
      const D = P.document, T = P.mod._test;
      const heads = Array.from(D.querySelectorAll(".card")).map((c) => (c.querySelector(".ctitle") || {}).textContent || "");
      const bi = heads.findIndex((h) => /^\W*Blend\b/i.test(h.trim())), oi = heads.findIndex((h) => /^\W*Output\b/i.test(h.trim()));
      assert.ok(bi >= 0 && oi === bi + 1, tool + " Blend card sits right above Output: " + heads.join(" | "));
      const sel = Array.from(D.querySelectorAll("select")).find((s) => Array.from(s.options).some((o) => o.value === "LUMINOSITY"));
      assert.ok(sel && sel.options.length === 27, tool + " blend menu has 27 modes");
      assert.deepStrictEqual(T.state.blend, { mode: "NORMAL", opacity: 100 }, tool + " default blend");
      const img = T.refs.preview, src = () => img && img.getAttribute("src"), before = src();
      T.state.blend = { mode: "SCREEN", opacity: 80 };
      if (T.state.out) T.state.out.hide = true;
      T.touch(); await P.settle(900);
      for (let i = 0; i < 40 && img && src() === before; i++) await P.settle(200);   // slow engines (Paint) under load
      if (img) assert.notStrictEqual(src(), before, tool + " preview changes with Screen 80%");
      P.host.calls.length = 0;
      await T.applyNow(); await P.settle(300);
      assert.ok(group, tool + " made a group");
      assert.strictEqual(group.blendMode, "screen", tool + " group blend mode");
      assert.strictEqual(group.opacity, 80, tool + " group opacity");
      assert.strictEqual(P.host.doc.layers[0].visible, true, tool + " source stays visible under a blended group");
    }
  });
};
