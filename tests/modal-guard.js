"use strict";
// Stuck "Progress" windows (Depthtone, then CRT Phaser, 2026-11-24): every modal call must go
// through shared/modal.js runModal, which always ends the modal (watchdog, Cancel, closed doc).
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function jsFiles(dir, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (!/^(node_modules|core|\.git)$/.test(f.name)) jsFiles(p, out); }
    else if (f.name.endsWith(".js")) out.push(p);
  }
  return out;
}

module.exports = async function (t) {
  await t("Modal guard: no plugin or shared file calls executeAsModal directly (all go through runModal)", () => {
    const files = jsFiles(path.join(ROOT, "shared"), []).concat(jsFiles(path.join(ROOT, "plugins"), []));
    const bad = [];
    for (const f of files) {
      if (f.endsWith(path.join("shared", "modal.js"))) continue;
      fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, "");
        if (/executeAsModal\s*\(/.test(code)) bad.push(path.relative(ROOT, f) + ":" + (i + 1));
      });
    }
    assert.deepStrictEqual(bad, [], "use runModal from core/modal.js");
  });

  await t("Modal guard: a hung callback is ended by the watchdog, Cancel ends it, a closed document is refused", async () => {
    const M = require("../shared/modal.js");
    let open = 0, ctl = null;
    M._setHost({
      app: { documents: [{ id: 1 }] },
      core: { async executeAsModal(fn, o) { open++; ctl = {}; try { return await fn(ctl); } finally { open--; } } }
    });
    // 1 a callback that never settles still ends the modal
    const t0 = Date.now();
    await assert.rejects(M.runModal("Test", () => new Promise(() => {}), { timeoutMs: 80 }), /did not finish/);
    assert.ok(Date.now() - t0 < 1000); assert.strictEqual(open, 0, "modal closed"); assert.strictEqual(M.busy(), false);
    // 2 Photoshop's Cancel button
    const p = M.runModal("Test", () => new Promise(() => {}), { timeoutMs: 5000 });
    await new Promise((r) => setTimeout(r, 10)); ctl.onCancel();
    await assert.rejects(p, /Cancelled/); assert.strictEqual(open, 0);
    // 3 closed document: never enters the modal
    await assert.rejects(M.runModal("Test", async () => 1, { docId: 99 }), /closed/);
    // 4 normal result passes through; errors propagate and still close
    assert.strictEqual(await M.runModal("Test", async () => 42, { docId: 1 }), 42);
    await assert.rejects(M.runModal("Test", async () => { throw new Error("boom"); }), /boom/);
    assert.strictEqual(open, 0); assert.strictEqual(M.busy(), false);
    M._setHost(null);
  });
};
