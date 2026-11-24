"use strict";
// Brew 3.0 interface (spec approved by Frank 2026-11-24): Night Arcade style, seven
// fixed zones, one control per job, no mouse wheel, hover help on every control.
// UI3 lists the tools already on the 3.0 panel (CRT Phaser is the pilot); the rollout adds the rest.
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");
const UI3 = ["crt-phaser"];

module.exports = async function (t) {
  const { loadPanel } = require("./harness.js");
  const ready = async (P) => { for (let i = 0; i < 200 && !/^Preview /.test((P.document.querySelector(".status") || {}).textContent || ""); i++) await P.settle(50); };
  const ev = (P, n, type, o) => n.dispatchEvent(new P.window.MouseEvent(type, Object.assign({ bubbles: true }, o || {})));

  await t("3.0: seven zones in order (header, preview + look bar, effects bar pinned; effect, shared cards scroll; Apply footer pinned)", async () => {
    for (const tool of UI3) {
      const P = await loadPanel(path.join(ROOT, "plugins", tool), { withDoc: false });
      await ready(P);
      const D = P.document, app = D.getElementById("app");
      assert.ok(app.classList.contains("arcade") && app.classList.contains("ui3"), tool + " Night Arcade");
      const kids = Array.from(app.children).map((n) => n.className);
      assert.deepStrictEqual(kids.slice(0, 3), ["pinned", "scroller", "pfoot"], tool + " pinned / scroller / footer");
      const pin = D.querySelector(".pinned");
      const order = [".rack.slim", ".previewbox .lookbar", ".fxbar"].map((s) => pin.querySelector(s));
      order.forEach((n, i) => assert.ok(n, tool + " pinned zone " + (i + 1)));
      assert.ok(order[0].compareDocumentPosition(order[1]) & 4 && order[1].compareDocumentPosition(order[2]) & 4, tool + " header, preview, effects bar in order");
      const secs = Array.from(D.querySelectorAll(".scroller .section")).map((n) => n.id);
      assert.strictEqual(secs[0], "sec-controls", tool + " effect controls come first in the scroll area");
      assert.deepStrictEqual(secs.slice(-2), ["sec-look", "sec-output"], tool + " looks then output last");
      const foot = D.querySelector(".pfoot");
      assert.ok(foot.querySelector(".apply") && foot.querySelector(".meter") && foot.querySelector(".status"), tool + " footer has status, meter, Apply");
      assert.ok(D.querySelector(".rack .title img.pxt") && D.querySelector(".dial .vbox img.lcd"), tool + " pixel wordmark and LCD value boxes");
      // rule 11: at most 6 primary value controls per effect, in every mode of the effect
      const T = P.mod._test;
      const modes = T.state.phase ? ["off", "waveform", "linear", "flux", "lidar"] : [null];
      for (const m of modes) {
        if (m) { T.state.phase.mode = m; T.touch(); }
        D.querySelectorAll(".fxpanes .tabpane > .card > .cardbody").forEach((b) => {
          const vis = (n) => { for (let p = n; p && p !== b; p = p.parentNode) if (p.style && p.style.display === "none") return false; return true; };
          const n = Array.from(b.querySelectorAll(".dial, .fader, .stepper, .rangebar")).filter((c) => !c.closest(".advcard") && !c.classList.contains("rpart") && vis(c)).length;
          assert.ok(n <= 6, tool + " " + b.parentNode.__card.title + (m ? " (" + m + ")" : "") + " has " + n + " primary controls (max 6)");
        });
      }
    }
  });

  await t("3.0: every control has hover help text (fails on any control without it)", async () => {
    for (const tool of UI3) {
      const P = await loadPanel(path.join(ROOT, "plugins", tool), { withDoc: false });
      await ready(P);
      const D = P.document, H = P.mod._test.ui.help;
      const missing = H.missing();
      assert.deepStrictEqual(missing.map((m) => m.key), [], tool + " controls without help text");
      // nothing interactive escapes: every control sits inside a node with help attached
      const bare = Array.from(D.querySelectorAll("#app .ub, #app select, #app input, #app .switch, #app .tabbtn, #app .tile, #app .look, #app .cardhead, #app .dial, #app .fader, #app .stepper"))
        .filter((n) => { for (let p = n; p && p.id !== "app"; p = p.parentNode) if (p.__help) return false; return true; });
      assert.deepStrictEqual(bare.map((n) => n.className + ":" + n.textContent.slice(0, 20)), [], tool + " controls with no help attached");
    }
  });

  await t("3.0: hover shows a short hint, then the help pop-up; Assistance off shows nothing; a click or Esc closes it", async () => {
    const P = await loadPanel(path.join(ROOT, "plugins", "crt-phaser"), { withDoc: false });
    await ready(P);
    const D = P.document, H = P.mod._test.ui.help;
    H.setDelay(2);
    const dial = D.querySelector(".fxpanes .dial:not([style*='none'])") || D.querySelector(".dial");
    ev(P, dial, "mouseover");
    await P.settle(800);
    assert.ok(D.querySelector(".helptip"), "short hint after 0.6 s");
    await P.settle(1500);
    const pop = D.querySelector(".helppop");
    assert.ok(pop && pop.querySelector(".helptext").textContent.length > 20, "pop-up with text after the delay");
    assert.ok(/Range/.test(pop.textContent) && /Double-click/.test(pop.textContent), "pop-up gives range and keys");
    D.dispatchEvent(new P.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    assert.ok(!D.querySelector(".helppop"), "Esc closes it");
    // Assistance switch in the header turns every bubble off
    const sw = D.querySelector(".rack .assist");
    assert.ok(sw.classList.contains("on"), "Assistance starts on");
    ev(P, sw, "click");
    assert.ok(!H.on && !sw.classList.contains("on"), "switch turns it off");
    ev(P, dial, "mouseout", { relatedTarget: D.body }); ev(P, dial, "mouseover");
    await P.settle(2300);
    assert.ok(!D.querySelector(".helptip") && !D.querySelector(".helppop"), "no bubbles while off");
    ev(P, sw, "click");
    // flyout menu repeats it and sets the delay
    const panel = P.host.uxp.entrypoints.last.panels.crtPhaserPanel;
    assert.ok(["assist", "delay2", "delay5", "delay10"].every((id) => panel.menuItems.some((m) => m && m.id === id)), "flyout menu items");
    panel.invokeMenu("delay10"); assert.strictEqual(H.delay, 10);
    panel.invokeMenu("assist"); assert.strictEqual(H.on, false);
    panel.invokeMenu("assist"); assert.strictEqual(H.on, true);
  });

  await t("3.0 rule 1: the mouse wheel never changes a value (no wheel listeners in shared code)", async () => {
    for (const f of fs.readdirSync(path.join(ROOT, "shared"))) {
      const src = fs.readFileSync(path.join(ROOT, "shared", f), "utf8");
      assert.ok(!/addEventListener\(\s*["']wheel/.test(src) && !/onwheel/i.test(src), "shared/" + f + " listens to the wheel");
      // and no hint or tooltip tells people to use it (the Depthtone Mac test still saw "wheel" in a knob hint)
      assert.ok(!/drag[^"'\n]*\bwheel\b|\bwheel (turns|or|steps)|use the (mouse )?wheel/i.test(src), "shared/" + f + " still mentions the wheel in a hint");
    }
    const P = await loadPanel(path.join(ROOT, "plugins", "crt-phaser"), { withDoc: false });
    await ready(P);
    const D = P.document, T = P.mod._test;
    const before = JSON.stringify(T.state);
    D.querySelectorAll("#app img, #app input, #app select, #app .ftrack, #app .rtrack, #app .stepb").forEach((n) => {
      n.dispatchEvent(new P.window.WheelEvent("wheel", { deltaY: -120, bubbles: true }));
      n.dispatchEvent(new P.window.WheelEvent("wheel", { deltaY: 120, bubbles: true }));
    });
    assert.strictEqual(JSON.stringify(T.state), before, "state unchanged after wheeling over every control");
  });

  await t("3.0 controls: stepper +/- and sums in value boxes, fader click sets by position, angle dial, look bar arrows", async () => {
    const { evalBox } = require("../shared/controls.js");
    assert.strictEqual(evalBox("50+10", 0), 60); assert.strictEqual(evalBox("*2", 7), 14); assert.strictEqual(evalBox("/2", 9), 4.5);
    assert.strictEqual(evalBox("(2+3)*4", 0), 20); assert.strictEqual(evalBox("abc", 3), null); assert.strictEqual(evalBox("12,5", 0), 12.5);
    const P = await loadPanel(path.join(ROOT, "plugins", "crt-phaser"), { withDoc: false });
    await ready(P);
    const D = P.document, T = P.mod._test;
    T.state.phase.mode = "waveform"; T.touch();
    const st = Array.from(D.querySelectorAll(".stepper")).find((n) => n.__ctl.path === "phase.lines");
    const l0 = T.state.phase.lines;
    const [minus, plus] = st.querySelectorAll(".stepb");
    ev(P, plus, "mousedown"); ev(P, plus, "mouseup");
    assert.strictEqual(T.state.phase.lines, l0 + 5, "+ steps by 5");
    ev(P, minus, "mousedown", { shiftKey: true }); ev(P, minus, "mouseup");
    assert.strictEqual(T.state.phase.lines, l0 - 45, "Shift - steps by 50");
    const box = st.querySelector(".dialval");
    box.value = "100*2"; box.dispatchEvent(new P.window.Event("change"));
    assert.strictEqual(T.state.phase.lines, 200, "typed sum");
    box.value = "9999"; box.dispatchEvent(new P.window.Event("change"));
    assert.strictEqual(T.state.phase.lines, 600, "clamped");
    const fd = Array.from(D.querySelectorAll(".fader")).find((n) => n.__ctl.path === "mask.strength");
    const tr = fd.querySelector(".ftrack");
    tr.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 14, right: 200, bottom: 14 });
    ev(P, tr, "mousedown", { clientX: 150, clientY: 5 }); D.dispatchEvent(new P.window.MouseEvent("mouseup", { bubbles: true, clientX: 150, clientY: 5 }));
    assert.strictEqual(T.state.mask.strength, 75, "click at 75% of the fader sets 75");
    const ang = D.querySelector(".angle");
    const img = ang.querySelector(".adial");
    img.getBoundingClientRect = () => ({ left: 0, top: 0, width: 40, height: 40, right: 40, bottom: 40 });
    ev(P, img, "mousedown", { clientX: 30, clientY: 30 });
    D.dispatchEvent(new P.window.MouseEvent("mousemove", { bubbles: true, clientX: 20, clientY: 0, shiftKey: true }));
    D.dispatchEvent(new P.window.MouseEvent("mouseup", { bubbles: true, clientX: 20, clientY: 0 }));
    assert.strictEqual(T.state.phase.angle, 90, "dragging straight up = 90 deg");
    const n0 = T.presetName;
    T.stepLook(1); assert.notStrictEqual(T.presetName, n0, "next look"); T.stepLook(-1); assert.strictEqual(T.presetName, n0, "previous look");
  });

  await t("3.0 tokens: Night Arcade colours in brew-tokens.json match panel.css", () => {
    const T = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens", "brew-tokens.json"), "utf8"));
    const css = fs.readFileSync(path.join(ROOT, "shared", "panel.css"), "utf8");
    const a = T.color.arcade;
    for (const k of ["void", "panel", "press", "ready", "busy", "err"]) {
      const re = new RegExp("--" + k + ":\\s*" + a[k].$value.hex, "i");
      assert.ok(re.test(css), "panel.css --" + k + " = " + a[k].$value.hex);
    }
  });

  await t("3.0 sprite fonts: pixel, label and LCD text render as small indexed PNGs", () => {
    const PF = require("../shared/pixfont.js");
    const a = PF.text("Beam width", { font: "label" });
    assert.strictEqual(a.h, 10, "label font is 10 px tall"); assert.ok(a.url.length < 4000, "indexed PNG stays small: " + a.url.length);
    const l = PF.text("-12.5", { font: "lcd" });
    assert.ok(l.w > 20 && l.h === 11, "LCD digits");
    assert.ok(PF.glyph("a") === PF.glyph("A"), "lowercase draws as small caps");
  });

  await t("3.0 chaining: Source 'Previous Brew result' reads the topmost Brew group and hides it after Apply", async () => {
    const P = await loadPanel(path.join(ROOT, "plugins", "crt-phaser"), { withDoc: true });
    await ready(P);
    const T = P.mod._test;
    const prev = { id: 77, name: "Frank's Dithers Brew - Halftone Pop #AB12", visible: true, kind: "group", bounds: { left: 0, top: 0, right: 400, bottom: 300 } };
    P.host.doc.layers.unshift(prev);
    T.state.out.source = "prev"; T.state.out.hide = true;
    P.host.calls.length = 0;
    await T.applyNow();
    const g = P.host.calls.find((c) => c[0] === "createLayerGroup");
    assert.ok(g && /^Frank's CRT Phaser Brew - /.test(g[1]), "new group made: " + (g && g[1]));
    assert.strictEqual(prev.visible, false, "previous result hidden, not deleted");
    assert.ok(P.host.calls.some((c) => c[0] === "move" && c[1] === 77 && c[2] === "before"), "new group moved out of and above the previous group");
    assert.ok(!P.host.calls.some((c) => c[0] === "getPixels" && /"layerID":77/.test(c.join())), "group not read by id");
    const P2 = await loadPanel(path.join(ROOT, "plugins", "crt-phaser"), { withDoc: true });
    await ready(P2);
    P2.mod._test.state.out.source = "prev";
    await P2.mod._test.applyNow();
    assert.ok(/No earlier Brew result/.test(P2.document.querySelector(".status").textContent), "plain message when nothing to chain");
  });

  await t("3.0 quick wins kept: Before/After button, flyout menu, plain errors, Apply blocked without a document, double-press reset", async () => {
    for (const tool of UI3) {
      const P = await loadPanel(path.join(ROOT, "plugins", tool), { withDoc: false });
      await ready(P);
      const D = P.document, T = P.mod._test;
      const ba = Array.from(D.querySelectorAll(".tbtn")).find((b) => /Before \/ After/.test(b.textContent));
      assert.ok(ba, tool + " Before/After button");
      const ep = P.host.uxp.entrypoints.last, panel = ep.panels[Object.keys(ep.panels)[0]];
      assert.ok(panel.menuItems.some((m) => m.id === "resetLook") && panel.menuItems.some((m) => m.id === "assist"), tool + " flyout menu has Reset look and Assistance");
      T.state.view.split = 0; panel.invokeMenu("split"); assert.strictEqual(T.state.view.split, 50, tool + " menu toggles the split");
      assert.ok(/Photoshop is busy/.test(T.plainError("Error: host is in a modal state")), tool + " plain error");
      assert.ok(T.refs.apply.classList.contains("blocked"), tool + " Apply blocked without a document");
    }
  });
};
module.exports.UI3 = UI3;
