"use strict";
// Lab rename (Frank 2026-11-24): display names come from plugins/<tool>/brand.js only;
// ids, folders and storage keys (LEGACY) stay, so installs and saved settings survive.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const PL = path.join(ROOT, "plugins");
const IDS = { "batch-mock-brew": "com.franks.batchmockbrew", chrometone: null, "crt-phaser": "com.franks.crtphaser", decompressor: null, depthtone: null, "dithers-brew": "com.franks.dithersbrew", mobglow: null, "paint-brew": null };

module.exports = async function (t) {
  await t("Brand: every manifest name and panel label matches brand.js (run tools/sync-brand.js)", () => {
    assert.deepStrictEqual(require("../tools/sync-brand.js").run(true), []);
  });
  await t("Brand: names are '<Tool> Lab', no 'Frank's' or 'Brew' in user-visible strings, ids unchanged", () => {
    const Suite = require("../shared/brand.js");
    for (const p of Object.keys(IDS)) {
      const B = require(path.join(PL, p, "brand.js"));
      assert.ok(/^[A-Z][A-Za-z ]+ Lab$/.test(B.NAME), p + " name " + B.NAME);
      assert.ok(Suite.LABS.includes(B.NAME.replace(/ Lab$/, "")), p + " not in shared LABS");
      assert.ok(/^Frank's .+ Brew$/.test(B.LEGACY), p + " legacy key must stay the old name");
      const man = JSON.parse(fs.readFileSync(path.join(PL, p, "manifest.json"), "utf8"));
      if (IDS[p]) assert.strictEqual(man.id, IDS[p]);
      assert.ok(/^com\.franks\./.test(man.id));
      const bad = [];
      fs.readFileSync(path.join(PL, p, "main.js"), "utf8").split("\n").forEach((line, i) => {
        const code = line.replace(/^\s*\/\/.*$/, "").replace(/\s\/\/ .*$/, "");
        for (const m of code.match(/"[^"\n]*"/g) || []) if (/Frank's|\bBrew\b/.test(m)) bad.push(p + ":" + (i + 1) + " " + m);
      });
      assert.deepStrictEqual(bad, [], "old names on screen");
    }
  });
  await t("Brand: chaining finds results with new and old group names", () => {
    const { isResult } = require("../shared/brand.js");
    assert.ok(isResult("Layer 1 - Scanline Lab - Arcade"));
    assert.ok(isResult("Background - Frank's CRT Phaser Brew - Arcade"));
    assert.ok(isResult("photo - Dithers Lab - Bayer 4x4"));
    assert.ok(!isResult("Layer 1"));
    assert.ok(!isResult("Lab - notes"));
  });
};
