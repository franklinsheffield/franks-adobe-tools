"use strict";
// Organized panel system (Frank, 2026-11-22): sections A-D, jump strip,
// foldable cards, effect tabs with on/off, knob value boxes, white selected
// knob, arrow keys and mouse wheel.
const assert = require("assert");
const path = require("path");

const TOOLS = ["chrometone", "crt-phaser", "decompressor", "depthtone", "mobglow", "paint-brew", "font-brew"];

module.exports = async function (t) {
  const { loadPanel } = require("./harness.js");
  const ready = async (P) => { for (let i = 0; i < 200 && !/^Preview /.test(P.document.querySelector(".status").textContent); i++) await P.settle(50); };

  await t("Panel system: every toolpanel plugin has sections in order, a jump strip, one Effects tab card and foldable cards", async () => {
    for (const tool of TOOLS) {
      const P = await loadPanel(path.join(__dirname, "..", "plugins", tool), { withDoc: false });
      const D = P.document;
      const ids = Array.from(D.querySelectorAll(".section")).map((s) => s.id);
      const order = ["sec-look", "sec-controls", "sec-colour", "sec-output"].filter((x) => ids.includes(x));
      assert.deepStrictEqual(ids, order, tool + " section order: " + ids);
      assert.ok(ids.includes("sec-look") && ids.includes("sec-controls") && ids.includes("sec-output"), tool + " has A, B, D");
      assert.strictEqual(D.querySelectorAll(".pinned .jump .jumpbtn").length, ids.length + 1, tool + " jump strip = sections + fold");
      const tabs = D.querySelectorAll(".tabcard");
      assert.strictEqual(tabs.length, 1, tool + " one Effects card");
      const shown = Array.from(tabs[0].querySelectorAll(".tabpane")).filter((p) => p.style.display !== "none");
      assert.strictEqual(shown.length, 1, tool + " exactly one tab pane shown");
      assert.ok(D.querySelectorAll(".dial .dialrow .dialval").length === D.querySelectorAll(".dial").length, tool + " every knob has its value box beside it");
      // Library is in A, Output/Export in D
      assert.ok(D.querySelector("#sec-look").nextSibling.querySelector(".ctitle").textContent === "Library", tool + " Library first in A");
    }
  });

  await t("Panel system: fold a card (remembered), fold all / open all, jump buttons light their section", async () => {
    const DIR = path.join(__dirname, "..", "plugins", "decompressor");
    let P = await loadPanel(DIR, { withDoc: false });
    let D = P.document;
    const lib = Array.from(D.querySelectorAll(".card.foldable")).find((c) => c.querySelector(".ctitle").textContent === "Library");
    lib.querySelector(".cardhead").dispatchEvent(new P.window.Event("click"));
    assert.ok(lib.classList.contains("shut"), "folded");
    assert.strictEqual(lib.querySelector(".chev").textContent, "+");
    const fold = D.querySelector(".jumpbtn.fold");
    fold.dispatchEvent(new P.window.Event("click"));      // some open -> fold all
    const loose = Array.from(D.querySelectorAll(".card.foldable")).filter((c) => !c.classList.contains("intab"));
    assert.ok(loose.every((c) => c.classList.contains("shut")), "all folded");
    fold.dispatchEvent(new P.window.Event("click"));
    assert.ok(loose.every((c) => !c.classList.contains("shut")), "all open");
    const jb = Array.from(D.querySelectorAll(".jumpbtn")).find((b) => /OUTPUT/.test(b.textContent));
    jb.dispatchEvent(new P.window.Event("click"));
    assert.ok(jb.classList.contains("on"), "jump button lights");
  });

  await t("Panel system: effect tabs switch panes; switching an effect off bypasses it in the preview and saves with the look", async () => {
    const DIR = path.join(__dirname, "..", "plugins", "decompressor");
    const P = await loadPanel(DIR, { withDoc: false });
    const D = P.document, T = P.mod._test;
    await ready(P);
    const card = D.querySelector(".tabcard");
    const btn = (name) => Array.from(card.querySelectorAll(".tabbtn")).find((b) => b.textContent.includes(name));
    btn("Datamosh").dispatchEvent(new P.window.Event("click"));
    const vis = Array.from(card.querySelectorAll(".tabpane")).filter((p) => p.style.display !== "none");
    assert.strictEqual(vis.length, 1);
    assert.ok(vis[0].textContent.includes("Amount"), "Datamosh pane shown");
    assert.ok(btn("Datamosh").classList.contains("cur"));
    // a preset with datamosh on
    T.state.mosh.amount = 60; T.touch(); await P.settle(400); await ready(P);
    const img = D.querySelector("img.preview");
    const withFx = img.src;
    btn("Datamosh").querySelector(".tabdot").dispatchEvent(new P.window.MouseEvent("click", { bubbles: true }));
    assert.ok(!btn("Datamosh").classList.contains("live"), "dot off");
    assert.ok(/Stack: .*JPEG decay.*Glitch slices/.test(card.querySelector(".stackline").textContent) && !/Datamosh/.test(card.querySelector(".stackline").textContent), card.querySelector(".stackline").textContent);
    await P.settle(400); await ready(P);
    assert.notStrictEqual(img.src, withFx, "preview changes when Datamosh is off");
    assert.strictEqual(T.state.mosh.amount, 60, "the user's value is kept");
    btn("Datamosh").querySelector(".tabdot").dispatchEvent(new P.window.MouseEvent("click", { bubbles: true }));
    await P.settle(400); await ready(P);
    assert.strictEqual(img.src, withFx, "back on = same preview");
    // tabs without a bypass map have no dot
    assert.ok(!btn("Finish").querySelector(".tabdot"), "Finish has no on/off dot");
  });

  await t("Knobs: value box beside the knob; click selects (white), arrows step (Shift x10), wheel turns, only one selected", async () => {
    const DIR = path.join(__dirname, "..", "plugins", "decompressor");
    const P = await loadPanel(DIR, { withDoc: false });
    const D = P.document, T = P.mod._test;
    await ready(P);
    const dial = (label) => Array.from(D.querySelectorAll(".dial")).find((d) => d.querySelector(".dlabel").textContent === label);
    const q = dial("Quality"), g = dial("Generations");
    const qi = q.querySelector(".dialval");
    const q0 = T.state.jpeg.quality;
    const before = q.querySelector(".knob").src;
    q.querySelector(".knob").dispatchEvent(new P.window.MouseEvent("mousedown", { clientY: 50, bubbles: true }));
    D.dispatchEvent(new P.window.MouseEvent("mouseup", { clientY: 50, bubbles: true }));
    assert.ok(q.classList.contains("sel"), "selected");
    assert.notStrictEqual(q.querySelector(".knob").src, before, "knob redrawn with the white halo");
    assert.strictEqual(D.activeElement, qi, "value box focused so the arrow keys reach it");
    const key = (k, shift) => qi.dispatchEvent(new P.window.KeyboardEvent("keydown", { key: k, shiftKey: !!shift, bubbles: true }));
    key("ArrowUp"); assert.strictEqual(T.state.jpeg.quality, Math.min(100, q0 + 1));
    key("ArrowDown"); key("ArrowDown"); assert.strictEqual(T.state.jpeg.quality, q0 - 1);
    key("ArrowDown", true); assert.strictEqual(T.state.jpeg.quality, Math.max(1, q0 - 11), "Shift = 10 steps");
    assert.strictEqual(qi.value, String(T.state.jpeg.quality), "box shows the value");
    const g0 = T.state.jpeg.generations;
    g.querySelector(".knob").dispatchEvent(new P.window.WheelEvent("wheel", { deltaY: -100, bubbles: true }));
    assert.ok(T.state.jpeg.generations > g0, "wheel up turns it up");
    assert.ok(g.classList.contains("sel") && !q.classList.contains("sel"), "wheel selects; one knob selected at a time");
    // UXP sends no wheel events: a scroll of the panel while the pointer is on a knob turns the knob and the panel stays put
    const sc = D.querySelector(".scroller");
    Object.defineProperty(sc, "scrollHeight", { configurable: true, get: () => 5000 });
    sc.scrollTop = 100; sc.dispatchEvent(new P.window.Event("scroll"));
    g.dispatchEvent(new P.window.MouseEvent("mouseover", { bubbles: true }));
    const g1 = T.state.jpeg.generations;
    sc.scrollTop = 97; sc.dispatchEvent(new P.window.Event("scroll"));
    assert.ok(T.state.jpeg.generations > g1, "scroll up over a knob turns it up");
    assert.strictEqual(sc.scrollTop, 100, "panel scroll put back");
    sc.dispatchEvent(new P.window.Event("scroll"));            // the host's echo of the reset
    g.dispatchEvent(new P.window.MouseEvent("mouseout", { bubbles: true, relatedTarget: D.body }));
    const g2 = T.state.jpeg.generations;
    sc.scrollTop = 140; sc.dispatchEvent(new P.window.Event("scroll"));
    assert.strictEqual(T.state.jpeg.generations, g2, "off the knob the panel just scrolls");
    assert.strictEqual(sc.scrollTop, 140);
    qi.value = "500"; qi.dispatchEvent(new P.window.Event("change"));
    assert.strictEqual(T.state.jpeg.quality, 100, "typed value clamps");
  });
};
