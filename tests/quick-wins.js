"use strict";
// Research quick wins (Brew Interface Research Database, 2026-11-23):
// scrubby labels, double-click reset to the look, units, live key hints,
// Before/After on every pixel tool, plain-English errors, blocked Apply,
// flyout menu, row-wide switches, and the shared DTCG token file.
const assert = require("assert");
const path = require("path");
const fs = require("fs");

const TOOLS = ["chrometone", "crt-phaser", "decompressor", "depthtone", "mobglow", "paint-brew"];
// tools on the 3.0 layout get the same checks in tests/brew3.js (Before/After button, LCD boxes)
const LAYOUT2 = TOOLS.filter((x) => !require("./brew3.js").UI3.includes(x));
const ROOT = path.join(__dirname, "..");

module.exports = async function (t) {
  const { loadPanel } = require("./harness.js");
  const ready = async (P) => { for (let i = 0; i < 200 && !/^Preview /.test(P.document.querySelector(".status").textContent); i++) await P.settle(50); };
  const md = (P, n, x, y) => n.dispatchEvent(new P.window.MouseEvent("mousedown", { bubbles: true, clientX: x || 0, clientY: y || 0 }));
  const mm = (P, x, y) => P.document.dispatchEvent(new P.window.MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }));
  const mu = (P) => P.document.dispatchEvent(new P.window.MouseEvent("mouseup", { bubbles: true }));

  await t("Quick wins: knob label scrubs, double-click resets to the look, key hints follow the selected knob", async () => {
    for (const tool of LAYOUT2) {
      const P = await loadPanel(path.join(ROOT, "plugins", tool), { withDoc: false });
      await ready(P);
      const D = P.document, T = P.mod._test;
      const dial = Array.from(D.querySelectorAll(".dial")).find((d) => { const n = d.__dial; return n && d.offsetParent !== undefined; });
      assert.ok(dial, tool + " has a dial");
      const box = dial.querySelector(".dialval"), lab = dial.querySelector(".dlabel");
      assert.ok(lab.classList.contains("scrub"), tool + " label is scrubbable");
      const before = box.value;
      md(P, lab, 100, 100); mm(P, 160, 40); mu(P);
      assert.notStrictEqual(box.value, before, tool + " dragging the label changed the value");
      assert.ok(/\|/.test(D.querySelector(".keys").textContent) && D.querySelector(".keys").textContent.includes(lab.textContent.toUpperCase()), tool + " key hints name the knob: " + D.querySelector(".keys").textContent);
      await P.settle(400);   // two separate presses, not a double-click
      md(P, lab, 0, 0); mu(P); md(P, lab, 0, 0); mu(P);
      assert.strictEqual(box.value, before, tool + " double-click resets to the look's value");
    }
  });

  await t("Quick wins: every pixel tool has Before/After, the flyout menu, and plain-English errors", async () => {
    for (const tool of LAYOUT2) {
      const P = await loadPanel(path.join(ROOT, "plugins", tool), { withDoc: false });
      await ready(P);
      const D = P.document, T = P.mod._test;
      assert.ok(Array.from(D.querySelectorAll(".minisw .lbl2")).some((n) => /Before \/ After/.test(n.textContent)), tool + " Before/After switch");
      const ep = P.host.uxp.entrypoints.last;
      const panel = ep && ep.panels && ep.panels[Object.keys(ep.panels)[0]];
      assert.ok(panel && Array.isArray(panel.menuItems) && panel.menuItems.some((m) => m.id === "resetLook"), tool + " flyout menu");
      T.state.view.split = 0; panel.invokeMenu("split"); assert.strictEqual(T.state.view.split, 50, tool + " menu toggles the split");
      assert.ok(/Photoshop is busy/.test(T.plainError("Error: host is in a modal state")), tool + " plain error");
      // no document: the Apply key is marked blocked and says why
      assert.ok(T.refs.apply.classList.contains("blocked") && /Open a document/.test(T.refs.apply.getAttribute("title")), tool + " Apply blocked without a document");
    }
    const P = await loadPanel(path.join(ROOT, "plugins", "mobglow"), { withDoc: true });
    await ready(P);
    assert.ok(!P.mod._test.refs.apply.classList.contains("blocked"), "Apply ready with a document");
  });

  await t("Quick wins: switch rows are clickable across their label (24 px target)", async () => {
    const P = await loadPanel(path.join(ROOT, "plugins", "chrometone"), { withDoc: false });
    const row = P.document.querySelector(".swrow");
    if (!row) return;
    const sw = row.querySelector(".switch"), was = sw.classList.contains("on");
    row.querySelector(".swlbl").dispatchEvent(new P.window.Event("click"));
    await P.settle(20);
    assert.notStrictEqual(sw.classList.contains("on"), was, "label click flips the switch");
  });

  await t("Quick wins: Dithers and Batch Mock get key hints, the flyout menu, reset to the look, Before/After (Dithers) and blocked Apply", async () => {
    const P = await loadPanel(path.join(ROOT, "plugins", "dithers-brew"), { withDoc: false });
    for (let i = 0; i < 200 && !/^Preview /.test(P.document.querySelector(".status").textContent); i++) await P.settle(50);
    const D = P.document, T = P.mod._test;
    assert.ok(D.querySelector(".keys"), "dithers has the key-hint line");
    assert.ok(T.refs.apply.classList.contains("blocked"), "dithers Apply looks blocked with no document");
    const panel = P.host.uxp.entrypoints.last.panels.franksBrewPanel;
    assert.deepStrictEqual(panel.menuItems.filter((m) => m.id).map((m) => m.id), ["resetLook", "split", "foldAll", "about"]);
    const dial = D.querySelector(".dial"), box = dial.querySelector(".dialval"), lab = dial.querySelector(".dlabel");
    const before = box.value;
    md(P, lab, 100, 100); mm(P, 160, 40); mu(P);
    assert.notStrictEqual(box.value, before, "dithers label drag changes the knob");
    assert.ok(D.querySelector(".keys").textContent.includes(lab.textContent.toUpperCase()), "dithers key hints name the knob");
    panel.invokeMenu("resetLook");
    await P.settle(50);
    assert.strictEqual(dial.querySelector(".dialval").value, before, "dithers menu reset returns the knob to the look");
    const src0 = T.refs.preview.src;
    panel.invokeMenu("split");
    assert.strictEqual(T.state.view.split, 50, "dithers split on");
    assert.ok(T.refs.splitSw.querySelector(".switch").classList.contains("on"), "dithers Before/After switch follows the menu");
    assert.notStrictEqual(T.refs.preview.src, src0, "dithers preview repainted with the split");
    panel.invokeMenu("split");
    assert.strictEqual(T.state.view.split, 0, "dithers split off");

    const B = await loadPanel(path.join(ROOT, "plugins", "batch-mock-brew"), { withDoc: false });
    await B.settle(200);
    const bp = B.host.uxp.entrypoints.last.panels.batchMockPanel;
    assert.deepStrictEqual(bp.menuItems.filter((m) => m.id).map((m) => m.id), ["resetLook", "test", "foldAll", "about"]);
    assert.ok(B.document.querySelector(".keys"), "batch mock has the key-hint line");
    const BT = B.mod._test;
    const q0 = BT.state.export.quality;
    BT.state.export.quality = q0 === 12 ? 1 : 12;
    bp.invokeMenu("resetLook");
    assert.strictEqual(BT.state.export.quality, q0, "batch mock menu reset returns settings to the setup");
    bp.invokeMenu("about");
    assert.ok(/Batch Mock Lab/.test(B.document.querySelector(".status").textContent), "about shows in the status line");
  });

  await t("Design tokens: brew-tokens.json is DTCG, every plugin's --glow matches it, and every glow reads on black (>= 4.5:1)", async () => {
    const T = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens", "brew-tokens.json"), "utf8"));
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
    for (const p of fs.readdirSync(path.join(ROOT, "plugins"))) {
      const css = path.join(ROOT, "plugins", p, "styles.css");
      if (!fs.existsSync(css)) continue;
      const m = /--glow:\s*(#[0-9a-fA-F]{6})/.exec(fs.readFileSync(css, "utf8"));
      const tok = T.color.glow[p];
      assert.ok(tok && tok.$type === "color", p + " has a glow token");
      assert.strictEqual(m && m[1].toLowerCase(), tok.$value.hex.toLowerCase(), p + " styles.css glow = token");
      const ratio = (lum(tok.$value.hex) + 0.05) / 0.05;
      assert.ok(ratio >= 4.5, p + " glow contrast on black " + ratio.toFixed(1));
    }
  });
};
