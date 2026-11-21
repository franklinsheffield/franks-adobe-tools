#!/usr/bin/env node
"use strict";
// Suite test runner:  npm test   (needs jsdom: npm install)
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
let failed = 0;
async function t(name, fn) {
  try { await fn(); console.log("ok   " + name); } catch (e) { failed++; console.log("FAIL " + name + "\n     " + (e.message || e).split("\n").join("\n     ")); }
}

(async () => {
  await t("every plugin's core/ matches /shared", () => {
    const stale = require("../tools/sync-core.js").sync(true);
    assert.deepStrictEqual(stale, [], "run node tools/sync-core.js");
  });

  await t("PNG encoder writes a valid header and CRC", () => {
    const PNG = require("../shared/png.js");
    const png = PNG.encodePNG(new Uint8Array(2 * 2 * 3).fill(200), 2, 2, 3);
    assert.deepStrictEqual(Array.from(png.slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.strictEqual(PNG.crc32(Buffer.from("123456789"), 0, 9), 0xCBF43926);
  });

  await t("preview loop never overlaps renders and re-runs once after a mid-render change", async () => {
    const { createPreviewLoop } = require("../shared/preview.js");
    let active = 0, maxActive = 0, runs = 0;
    const loop = createPreviewLoop({ renderOnce: async () => { active++; maxActive = Math.max(maxActive, active); runs++; await new Promise((r) => setTimeout(r, 30)); active--; } });
    loop.run(); loop.run(); loop.run();
    await new Promise((r) => setTimeout(r, 150));
    assert.strictEqual(maxActive, 1); assert.strictEqual(runs, 2);
    loop.setBusy(true); loop.schedule(0); await new Promise((r) => setTimeout(r, 30));
    assert.strictEqual(runs, 2, "busy loop must not render");
  });

  await t("Dithers Brew engine: 50% grey prints about 50% ink (round dot)", async () => {
    const E = require("../plugins/dithers-brew/js/engine.js");
    const { DEFAULTS, clone } = require("../plugins/dithers-brew/js/state.js");
    const w = 300, h = 300, data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) { data.fill(128, i * 4, i * 4 + 3); data[i * 4 + 3] = 255; }
    const res = await E.render({ w, h, c: 4, data }, Object.assign(clone(DEFAULTS), { ppi: 300, scale: 1 }));
    const m = res.layers[0].mask; let s = 0; for (let i = 0; i < m.length; i++) s += m[i] ? 1 : 0;
    const cov = s / m.length;
    assert.ok(Math.abs(cov - 0.5) < 0.04, "coverage " + cov.toFixed(3));
  });

  await t("Dithers Brew panel matches the v1.0 golden fingerprint (UI, 32 presets, Apply)", () => {
    const outp = execFileSync(process.execPath, [path.join(__dirname, "fingerprint.js"), path.join(ROOT, "plugins/dithers-brew")], { encoding: "utf8", env: process.env, timeout: 300000 });
    const got = JSON.parse(outp), want = JSON.parse(fs.readFileSync(path.join(__dirname, "dithers-brew.golden.json"), "utf8"));
    assert.deepStrictEqual(got, want);
  });

  await t("Legacy Lite .jsx is present (v1.0 + two PS 28 fixes)", () => {
    const p = path.join(ROOT, "plugins/dithers-brew/legacy/Franks_Dithers_Brew_Lite.jsx");
    const sha = require("crypto").createHash("md5").update(fs.readFileSync(p)).digest("hex");
    assert.strictEqual(sha, "6c53393b9ad1102246ce46309ec61fbe");
  });

  await t("every plugin panel scrolls vertically (shared panel.css, linked from index.html)", () => {
    const css = fs.readFileSync(path.join(ROOT, "shared/panel.css"), "utf8");
    assert.ok(/#app\s*\{[^}]*height:\s*100vh[^}]*overflow-y:\s*scroll/.test(css), "#app must fill the panel and scroll");
    for (const p of fs.readdirSync(path.join(ROOT, "plugins"))) {
      const html = fs.readFileSync(path.join(ROOT, "plugins", p, "index.html"), "utf8");
      assert.ok(html.includes('href="core/panel.css"'), p + "/index.html must link core/panel.css");
      assert.ok(html.includes('id="app"'), p + "/index.html must have #app");
    }
  });

  console.log(failed ? "\n" + failed + " failed" : "\nall passed");
  process.exit(failed ? 1 : 0);
})();
