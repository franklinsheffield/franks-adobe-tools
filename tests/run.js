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

  await t("Dithers Brew preview is pinned on top; unpinning moves it into the scroll area and back", async () => {
    const { loadPanel } = require("./harness.js");
    const { document: d } = await loadPanel(path.join(ROOT, "plugins/dithers-brew"), { withDoc: false });
    const app = d.getElementById("app"), pinned = app.querySelector(".pinned"), scroller = app.querySelector(".scroller");
    assert.ok(app.classList.contains("split") && pinned && scroller, "split layout present");
    const prev = pinned.querySelector(".previewbox");
    assert.ok(prev, "preview starts pinned");
    assert.ok(!scroller.querySelector(".previewbox"), "controls area has no preview");
    const pin = [...pinned.querySelectorAll("input[type=checkbox]")].find((c) => (c.title || "").includes("preview on top"));
    pin.checked = false; pin.dispatchEvent(new d.defaultView.Event("change"));
    assert.ok(scroller.firstChild.querySelector && (scroller.querySelector(".previewbox") === prev), "unpinned: preview scrolls with controls");
    assert.strictEqual(pinned.style.display, "none");
    pin.checked = true; pin.dispatchEvent(new d.defaultView.Event("change"));
    assert.ok(pinned.querySelector(".previewbox") === prev, "re-pinned");
  });

  await t("Chrometone engine: flat grey maps through the gradient; same settings give the same pixels", async () => {
    const E = require("../plugins/chrometone/js/engine.js"), { DEFAULTS, merge } = require("../plugins/chrometone/js/state.js");
    const w = 64, h = 64, data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) { data.fill(128, i * 4, i * 4 + 3); data[i * 4 + 3] = 255; }
    const P = merge(DEFAULTS, { look: { stops: [{ p: 0, c: "#000000" }, { p: 100, c: "#FF0000" }] }, tone: { blur: 0, contrast: 100, mid: 50 }, bands: { count: 0 }, relief: { depth: 0, spec: 0 }, finish: { bloom: 0, grain: 0, mix: 0 } });
    P.scale = 1;
    const res = await E.render({ w, h, c: 4, data }, P);
    const px = res.layers[0].rgba;
    assert.ok(Math.abs(px[0] - 128) <= 2 && px[1] === 0 && px[2] === 0 && px[3] === 255, "grey 50% -> half red, got " + Array.from(px.slice(0, 4)));
    const P2 = merge(DEFAULTS, {}); P2.scale = 1; P2.finish.grain = 30;
    const a1 = await E.render(E.demoImage(80, 60), P2), a2 = await E.render(E.demoImage(80, 60), P2);
    assert.deepStrictEqual(Buffer.from(a1.layers[0].rgba), Buffer.from(a2.layers[0].rgba));
    assert.strictEqual(a1.layers.length, 2); assert.strictEqual(a1.layers[1].blend, "SCREEN");
  });

  await t("Chrometone panel matches its golden fingerprint (UI, 8 presets, Apply)", () => {
    const outp = execFileSync(process.execPath, [path.join(__dirname, "fingerprint.js"), path.join(ROOT, "plugins/chrometone")], { encoding: "utf8", env: process.env, timeout: 300000 });
    const got = JSON.parse(outp), want = JSON.parse(fs.readFileSync(path.join(__dirname, "chrometone.golden.json"), "utf8"));
    assert.deepStrictEqual(got, want);
    assert.strictEqual(new Set(got.presets.map((p) => p.split(" = ")[1])).size, got.presets.length, "every preset looks different");
  });

  await t("colour swatches open the host colour picker and apply the picked colour (every tool with colour settings)", async () => {
    const { loadPanel } = require("./harness.js");
    for (const p of ["chrometone", "dithers-brew", "depthtone", "mobglow"]) {
      const P = await loadPanel(path.join(ROOT, "plugins", p), { withDoc: false });
      const sw = [...P.document.querySelectorAll(".sw.pick")].find((s) => s.offsetParent !== null || true);
      assert.ok(sw, p + ": has a clickable swatch");
      const field = sw.parentNode.querySelector("input.hex");
      sw.dispatchEvent(new P.window.Event("click"));
      await P.settle(50);
      assert.ok(P.host.calls.some((c) => c[0] === "batchPlay" && c[1] === "showColorPicker"), p + ": picker opened");
      assert.strictEqual(field.value, "#FF8000", p + ": picked colour shown");
    }
  });

  await t("suite theme: black panels, white strokes, one neon glow per plugin", async () => {
    const css = fs.readFileSync(path.join(ROOT, "shared/panel.css"), "utf8");
    assert.ok(/--ink:\s*#000000/.test(css) && /--glow:\s*#8fd8ff/.test(css), "theme colours");
    assert.ok(/\.btn\.pressed/.test(css) && /\.segbtn\.on, \.pill\.on \{[^}]*--glow/.test(css), "glow rules");
    const neons = [];
    for (const p of fs.readdirSync(path.join(ROOT, "plugins"))) {
      const sc = fs.readFileSync(path.join(ROOT, "plugins", p, "styles.css"), "utf8");
      assert.ok(!/\.apply\s*\{|\.segbtn\.on/.test(sc), p + "/styles.css must not override the suite button theme");
      const m = /--glow:\s*(#[0-9a-f]{6})/.exec(sc);
      assert.ok(m && /--glowbg:\s*#[0-9a-f]{6}/.test(sc), p + " sets its own neon --glow/--glowbg");
      assert.ok(!/\.title\s*\{[^}]*color/.test(sc), p + " title colour must come from --glow");
      neons.push(m[1]);
    }
    assert.strictEqual(new Set(neons).size, neons.length, "each plugin has a different neon");
    assert.ok(/\.title \{[^}]*color: var\(--glow\)/.test(css), "title uses the glow colour");
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins", "mobglow"), { withDoc: false });
    const b = P.document.querySelector(".segbtn");
    b.dispatchEvent(new P.window.MouseEvent("mousedown", { bubbles: true }));
    assert.ok(b.classList.contains("pressed"), "pressed glow on mousedown");
    await P.settle(450);
    assert.ok(!b.classList.contains("pressed"), "glow fades");
  });

  await t("Night Machine text: labels use the display font, no symbol fallback needed", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins", "depthtone"), { withDoc: false });
    const head = [...P.document.querySelectorAll(".ctitle")].find((e) => e.textContent === "Colour (far to near)");
    assert.ok(head, "card title present");
    assert.strictEqual(head.querySelectorAll(".sym").length, 0);
    const css = fs.readFileSync(path.join(ROOT, "shared/panel.css"), "utf8");
    assert.ok(/--arcade:\s*"Night Machine"/.test(css) && /\.sym \{ font-family: var\(--ui\)/.test(css));
  });

  const NEW_TOOLS = { depthtone: ["Depth fill", "Contours"], mobglow: ["Background darken", "Glow"], decompressor: ["Decompressed"], "crt-phaser": ["Screen"] };
  for (const tool of Object.keys(NEW_TOOLS)) {
    await t(tool + " engine: deterministic, every preset renders full-size layers, first preset gives the expected layers", async () => {
      const E = require("../plugins/" + tool + "/js/engine.js"), S = require("../plugins/" + tool + "/js/state.js");
      const src = E.demoImage(96, 72);
      for (const pr of S.PRESETS) {
        const P = S.merge(S.DEFAULTS, pr.p); P.scale = 0.4; P.fullH = 180;
        const a = await E.render(src, P), b = await E.render(src, P);
        assert.ok(a.layers.length >= 1, pr.name + ": has layers");
        a.layers.forEach((L, i) => { assert.strictEqual(L.rgba.length, 96 * 72 * 4, pr.name + ": layer size"); assert.deepStrictEqual(Buffer.from(L.rgba), Buffer.from(b.layers[i].rgba), pr.name + ": deterministic"); });
      }
      const P0 = S.merge(S.DEFAULTS, S.PRESETS[0].p); P0.scale = 1;
      assert.deepStrictEqual((await E.render(src, P0)).layers.map((L) => L.name), NEW_TOOLS[tool]);
    });
    await t(tool + " panel matches its golden fingerprint (UI, 8 presets, Apply)", () => {
      const outp = execFileSync(process.execPath, [path.join(__dirname, "fingerprint.js"), path.join(ROOT, "plugins", tool)], { encoding: "utf8", env: process.env, timeout: 300000 });
      const got = JSON.parse(outp), want = JSON.parse(fs.readFileSync(path.join(__dirname, tool + ".golden.json"), "utf8"));
      assert.deepStrictEqual(got, want);
      assert.strictEqual(new Set(got.presets.map((p) => p.split(" = ")[1])).size, got.presets.length, "every preset looks different");
    });
  }

  console.log(failed ? "\n" + failed + " failed" : "\nall passed");
  process.exit(failed ? 1 : 0);
})();
