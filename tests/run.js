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

  await t("Dithers Brew 1.1 Line Art: tone-true algorithms print about the right ink; same input gives the same mask", async () => {
    const E = require("../plugins/dithers-brew/js/engine.js"), { DEFAULTS, merge } = require("../plugins/dithers-brew/js/state.js");
    const w = 240, h = 240;
    for (const l of E.LINE_ART) {
      for (const g of [64, 128, 192]) {
        const data = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) { data.fill(g, i * 4, i * 4 + 3); data[i * 4 + 3] = 255; }
        const P = merge(DEFAULTS, { engine: "dither", algo: { dither: l.id }, tune: { spacing: 12 } }); P.ppi = 300; P.scale = 1;
        const r1 = await E.render({ w, h, c: 4, data }, P), r2 = await E.render({ w, h, c: 4, data }, P);
        assert.deepStrictEqual(Buffer.from(r1.layers[0].mask), Buffer.from(r2.layers[0].mask), l.id + " deterministic");
        if (!l.tone) continue;
        let s = 0; for (const v of r1.layers[0].mask) s += v ? 1 : 0;
        const cov = s / (w * h), want = (255 - g) / 255;
        assert.ok(Math.abs(cov - want) < 0.1, l.id + " grey " + g + ": coverage " + cov.toFixed(3) + " want " + want.toFixed(3));
      }
    }
  });

  await t("Dithers Brew 1.1: Tune and Image defaults are no-ops; 1.0 looks with invert true/false render the same", async () => {
    const E = require("../plugins/dithers-brew/js/engine.js"), { DEFAULTS, merge, clone } = require("../plugins/dithers-brew/js/state.js");
    const src = E.demoImage(120, 90);
    const base = merge(DEFAULTS, { engine: "dither", algo: { dither: "fs" }, fx: { pre: { on: true, contrast: 20 } } }); base.ppi = 300; base.scale = 1;
    const old = clone(base); delete old.tune; old.fx.pre.invert = true; delete old.fx.pre.haze; delete old.fx.pre.radius;
    const neu = clone(base); neu.fx.pre.invert = 100;
    const a = await E.render(src, old), b = await E.render(src, neu);
    assert.deepStrictEqual(Buffer.from(a.layers[0].mask), Buffer.from(b.layers[0].mask));
    const hi = clone(base); hi.tune.threshold = 70;
    const c = await E.render(src, hi), d0 = await E.render(src, base);
    const ink = (m) => m.reduce((s, v) => s + (v ? 1 : 0), 0);
    assert.ok(ink(c.layers[0].mask) < ink(d0.layers[0].mask), "higher threshold prints less ink");
  });

  await t("Dithers Brew 1.1 panel: algorithm strip picks, live-drag frame, look browser renders", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins/dithers-brew"), { withDoc: false });
    const d = P.document, st = () => P.mod._test.state;
    await P.settle(600);
    const thumbs = d.querySelectorAll(".algostrip .thumb");
    assert.ok(thumbs.length >= 11, "halftone thumbs");
    thumbs[2].dispatchEvent(new P.window.Event("click"));
    assert.strictEqual(st().algo.halftone, "diamond");
    const seg = [...d.querySelectorAll(".segbtn")].find((b) => b.textContent === "Dither");
    seg.dispatchEvent(new P.window.Event("click"));
    await P.settle(800);
    assert.strictEqual(d.querySelectorAll(".algostrip .thumb").length, 28, "dither thumbs incl. Line Art");
    assert.ok(d.getElementById("app").classList.contains("brand-console") && d.querySelector(".rack .led"), "Hardware Console header");
    const dial = [...d.querySelectorAll(".dial")].find((n) => /Threshold/.test(n.querySelector(".dlabel").textContent));
    const knob = dial.querySelector("img.knob");
    knob.dispatchEvent(new P.window.MouseEvent("mousedown", { clientY: 100, bubbles: true }));
    d.dispatchEvent(new P.window.MouseEvent("mousemove", { clientY: 80, bubbles: true }));
    await P.settle(300);
    assert.ok(st().tune.threshold > 50, "dial turned: " + st().tune.threshold);
    assert.ok(/^Live /.test(d.querySelector(".status").textContent), "drag renders a live frame: " + d.querySelector(".status").textContent);
    d.dispatchEvent(new P.window.MouseEvent("mouseup", { bubbles: true }));
    const sharpen = [...d.querySelectorAll(".dial")].find((n) => /Sharpen/.test(n.querySelector(".dlabel").textContent));
    assert.strictEqual(st().fx.pre.on, false);
    sharpen.__dial.set(80);
    assert.strictEqual(st().fx.pre.on, true, "editing the Image card switches it on");
    const lb = [...d.querySelectorAll(".ub")].find((b) => b.textContent === "Show looks");
    lb.dispatchEvent(new P.window.Event("click"));
    await P.settle(2500);
    const imgs = d.querySelectorAll(".lookgrid img");
    assert.strictEqual(imgs.length, 40);
    assert.ok([...imgs].filter((i) => /^data:image\/png/.test(i.src)).length >= 20, "look thumbnails render");
    imgs[32].parentNode.dispatchEvent(new P.window.Event("click"));
    assert.strictEqual(st().algo.dither, "wavescan");
  });

  await t("Dithers Brew panel matches the golden fingerprint (UI, 32 v1.0 presets unchanged + 8 Line Art, Apply)", () => {
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
    const pin = [...pinned.querySelectorAll(".switch")].find((c) => (c.title || "").includes("preview on top"));
    assert.ok(pin && pin.classList.contains("on"), "Pin on top is a console switch, on");
    pin.click();
    assert.ok(scroller.firstChild.querySelector && (scroller.querySelector(".previewbox") === prev), "unpinned: preview scrolls with controls");
    assert.strictEqual(pinned.style.display, "none");
    pin.click();
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

  await t("Chrometone panel matches its golden fingerprint (UI, 24 presets, Apply)", () => {
    const outp = execFileSync(process.execPath, [path.join(__dirname, "fingerprint.js"), path.join(ROOT, "plugins/chrometone")], { encoding: "utf8", env: process.env, timeout: 300000 });
    const got = JSON.parse(outp), want = JSON.parse(fs.readFileSync(path.join(__dirname, "chrometone.golden.json"), "utf8"));
    assert.deepStrictEqual(got, want);
    assert.strictEqual(new Set(got.presets.map((p) => p.split(" = ")[1])).size, got.presets.length, "every preset looks different");
  });

  await t("Chrometone 1.1: a saved 1.0 look loads with every new effect off and renders like 1.0", async () => {
    const E = require("../plugins/chrometone/js/engine.js"), { DEFAULTS, merge, PRESETS } = require("../plugins/chrometone/js/state.js");
    const old = { look: { stops: [{ p: 0, c: "#000000" }, { p: 100, c: "#FFFFFF" }], invert: false }, tone: { blur: 2, contrast: 140, mid: 50 }, bands: { count: 3, phase: 0, shape: "sine", soft: 50, mix: 60 }, relief: { depth: 45, angle: 135, gloss: 40, spec: 60, soft: 3 }, finish: { grain: 0, bloom: 20, mix: 0 } };
    const P = merge(DEFAULTS, old); P.scale = 1;
    assert.strictEqual(P.surface.from, "brightness"); assert.strictEqual(P.extrude.on, false);
    assert.ok(P.glow.modules.length === 4 && P.glow.modules.every((m) => !m.on));
    const res = await E.render(E.demoImage(80, 60), P);
    assert.deepStrictEqual(res.layers.map((l) => l.name), ["Chrome colour", "Chrome shine"]);
    assert.strictEqual(PRESETS.length, 24); assert.strictEqual(PRESETS.filter((p) => p.cat === "Retro chrome").length, 16);
    const short = merge(DEFAULTS, { glow: { modules: [{ on: true, type: "halo" }] } });
    assert.strictEqual(short.glow.modules.length, 4); assert.strictEqual(short.glow.modules[0].size, DEFAULTS.glow.modules[0].size);
  });

  await t("Chrometone 1.1: outline bevel, extrusion, glow stack and shine on a transparent shape", async () => {
    const E = require("../plugins/chrometone/js/engine.js"), { DEFAULTS, merge } = require("../plugins/chrometone/js/state.js");
    const w = 120, h = 120, data = new Uint8Array(w * h * 4);
    for (let y = 30; y < 70; y++) for (let x = 30; x < 90; x++) { const i = (y * w + x) * 4; data.fill(255, i, i + 4); }
    const src = { w, h, c: 4, data };
    const P = merge(DEFAULTS, { surface: { from: "auto", bevel: 8, reflect: "horizon" }, extrude: { on: true, depth: 20, angle: 270, shadow: 50 },
      glow: { modules: [{ on: true, type: "halo", size: 6, strength: 80 }, { on: true, type: "neon", size: 3, strength: 60 }] },
      shine: { glints: { on: true, count: 2, size: 12 }, sweep: { on: true }, rim: { on: true }, arcs: { on: true, count: 2 } } });
    P.scale = 1;
    const res = await E.render(src, P);
    assert.deepStrictEqual(res.layers.map((l) => l.name + ":" + l.blend), ["Glow:SCREEN", "Long shadow:MULTIPLY", "Extrusion:NORMAL", "Chrome colour:NORMAL", "Chrome shine:SCREEN", "Sparkle:SCREEN"]);
    const L = (name) => res.layers.find((l) => l.name === name).rgba, a = (rgba, x, y) => rgba[(y * w + x) * 4 + 3];
    const col = L("Chrome colour"), ex = L("Extrusion"), gl = L("Glow");
    assert.strictEqual(a(col, 60, 50), 255); assert.strictEqual(a(col, 10, 10), 0, "colour layer follows the outline");
    assert.ok(a(ex, 60, 80) > 200 && a(ex, 60, 95) === 0 && a(ex, 60, 25) === 0, "wall runs 20 px straight down only");
    assert.ok(a(gl, 60, 25) > 0 && a(gl, 5, 5) < a(gl, 60, 25), "glow surrounds the shape and fades");
    const lum = (x, y) => col[(y * w + x) * 4] + col[(y * w + x) * 4 + 1] + col[(y * w + x) * 4 + 2];
    assert.notStrictEqual(lum(60, 31), lum(60, 50), "bevel edge differs from the flat face");
    const again = await E.render(src, P);
    for (let k = 0; k < res.layers.length; k++) assert.deepStrictEqual(Buffer.from(again.layers[k].rgba), Buffer.from(res.layers[k].rgba), "deterministic " + res.layers[k].name);
    const Pm = merge(P, { out: { layers: "merged" } }); Pm.scale = 1;
    const m = await E.render(src, Pm);
    assert.strictEqual(m.layers.length, 1); assert.ok(m.layers[0].rgba[(80 * w + 60) * 4 + 3] > 200, "merged keeps the wall");
    // half-size preview: the wall reaches proportionally (scale-aware)
    const hw = 60, hd = new Uint8Array(hw * hw * 4);
    for (let y = 15; y < 35; y++) for (let x = 15; x < 45; x++) { const i = (y * hw + x) * 4; hd.fill(255, i, i + 4); }
    const Ph = merge(P, {}); Ph.scale = 0.5;
    const hr = await E.render({ w: hw, h: hw, c: 4, data: hd }, Ph);
    const hex = hr.layers.find((l) => l.name === "Extrusion").rgba;
    assert.ok(hex[(44 * hw + 30) * 4 + 3] > 200 && hex[(47 * hw + 30) * 4 + 3] === 0, "preview wall is 10 px at 50%");
  });

  await t("Chrometone 1.1: Auto keys out a black background; layer sources widen for glow and extrusion", async () => {
    const E = require("../plugins/chrometone/js/engine.js"), { DEFAULTS, merge, PRESETS } = require("../plugins/chrometone/js/state.js");
    const w = 100, h = 60, data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) { data[i * 4 + 3] = 255; data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 6; }
    for (let y = 20; y < 40; y++) for (let x = 20; x < 80; x++) data.fill(240, (y * w + x) * 4, (y * w + x) * 4 + 3);
    const P = merge(DEFAULTS, PRESETS.find((p) => p.name === "Glacier Rim").p); P.scale = 1;
    const res = await E.render({ w, h, c: 4, data }, P);
    const col = res.layers.find((l) => l.name === "Chrome colour").rgba;
    assert.strictEqual(col[(5 * w + 5) * 4 + 3], 0); assert.strictEqual(col[(30 * w + 50) * 4 + 3], 255);
    const { loadPanel } = require("./harness.js");
    const Pn = await loadPanel(path.join(ROOT, "plugins/chrometone"), { withDoc: false });
    const ch = Pn.mod._chrome;
    assert.strictEqual(ch.reach(merge(DEFAULTS, {})), 0);
    assert.strictEqual(ch.reach(merge(DEFAULTS, { extrude: { on: true, depth: 100 } })), 115);
    Pn.mod._test.state = merge(DEFAULTS, { extrude: { on: true, depth: 40 } });
    const r = { info: { w: 1000, h: 800 }, origin: { left: 20, top: 300 }, scale: 0.5, src: { w: 100, h: 50, c: 4, data: new Uint8Array(100 * 50 * 4).fill(255) } };
    await ch.prepareSource(null, r);
    assert.deepStrictEqual(r.origin, { left: 0, top: 254 });
    assert.strictEqual(r.src.w, 133); assert.strictEqual(r.src.h, 96);
    assert.strictEqual(r.src.data[((23) * 133 + 10) * 4 + 3], 255); assert.strictEqual(r.src.data[3], 0);
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

  await require("./batch-mock-brew.js")(t);
  await require("./paint-brew.js")(t);
  await require("./font-brew.js")(t);
  await require("./crt-phaser.js")(t);
  await require("./colour-deck.js")(t);
  await require("./panel-system.js")(t);

  console.log(failed ? "\n" + failed + " failed" : "\nall passed");
  process.exit(failed ? 1 : 0);
})();
