"use strict";
// CRT Phaser 1.1: Phase FX engine + editable stack + Re-edit
const assert = require("assert");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

module.exports = async function (t) {
  const E = require("../plugins/crt-phaser/js/engine.js"), S = require("../plugins/crt-phaser/js/state.js");

  await t("crt-phaser 1.1: 20 Phase looks, 5 per mode (incl. Flux Dots), all different", async () => {
    const ph = S.PRESETS.filter((p) => p.p.phase && p.p.phase.mode);
    assert.strictEqual(ph.length, 20);
    for (const m of ["waveform", "linear", "flux", "fluxdots"]) assert.strictEqual(ph.filter((p) => p.p.phase.mode === m).length, 5, m);
    assert.strictEqual(S.DEFAULTS.phase.mode, "off", "Phase off by default keeps 1.0 looks");
    const src = E.demoImage(80, 60), seen = new Set();
    for (const pr of ph) {
      const P = S.merge(S.DEFAULTS, pr.p); P.scale = 0.5; P.fullH = 120;
      const r = await E.render(src, P);
      seen.add(Buffer.from(r.layers[0].rgba).toString("base64"));
    }
    assert.strictEqual(seen.size, 20);
  });

  await t("crt-phaser 1.1: editable stack has Base, Lines, Glow, Dot Grid, Flare with the right blends", async () => {
    const pr = S.PRESETS.find((p) => p.name === "Cyan Flux");
    const P = S.merge(S.DEFAULTS, pr.p); P.scale = 1; P.out.layers = "split";
    const r = await E.render(E.demoImage(64, 48), P);
    assert.deepStrictEqual(r.layers.map((L) => L.name + ":" + L.blend), ["Base:NORMAL", "Phase Lines:NORMAL", "Glow:SCREEN", "Dot Grid:MULTIPLY", "Prism Flare:SCREEN"]);
    r.layers.forEach((L) => assert.strictEqual(L.rgba.length, 64 * 48 * 4));
    const lines = r.layers[1].rgba; let clear = 0, lit = 0;
    for (let i = 3; i < lines.length; i += 4) { if (lines[i] === 0) clear++; else lit++; }
    assert.ok(clear > 0 && lit > 0, "lines layer is transparent between the beams");
  });

  await t("crt-phaser 1.1: Re-edit loads a group's saved settings, hides the old group and shows the original again", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins", "crt-phaser"), { withDoc: true });
    const T = P.mod._test, d = P.document;
    const pick = d.querySelector(".card select"), idx = [...pick.options].findIndex((o) => /Thermal Flux/.test(o.text));
    pick.selectedIndex = idx; pick.value = pick.options[idx].value; pick.dispatchEvent(new P.window.Event("change"));
    await P.settle(300);
    const bg = { id: 1, name: "Background", visible: true, kind: "pixel" };
    P.host.doc.layers.unshift(bg);
    P.host.calls.length = 0;
    await T.applyNow();
    assert.strictEqual(bg.visible, false, "source hidden after apply");
    const g = P.host.calls.find((c) => c[0] === "createLayerGroup");
    assert.ok(/Thermal Flux #[A-Z0-9]{4}$/.test(g[1]), g[1]);
    // change the look, then select the group and re-edit
    T.state = S.merge(S.DEFAULTS, {}); T.touch();
    const group = { name: g[1], visible: true };
    P.host.doc.activeLayers = [group];
    await T.reEditNow();
    assert.strictEqual(T.state.phase.mode, "flux");
    assert.strictEqual(T.state.phase.ramp.length, 7, "heat ramp restored");
    assert.ok(/Loaded #/.test(d.querySelector(".status").textContent));
    assert.strictEqual(group.visible, false, "old group hidden, not deleted");
    assert.strictEqual(bg.visible, true, "original artwork shown again so preview and Apply read it");
    P.host.doc.activeLayers = [];
    await T.applyNow();
    assert.strictEqual(bg.visible, false, "next Apply hides the source again");
  });

  await t("crt-phaser 1.1: Re-edit on a layer without a tag explains what to select", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins", "crt-phaser"), { withDoc: true });
    P.host.doc.activeLayers = [{ name: "Background" }];
    await P.mod._test.reEditNow();
    assert.ok(/Select a group made by/.test(P.document.querySelector(".status").textContent));
  });
};
