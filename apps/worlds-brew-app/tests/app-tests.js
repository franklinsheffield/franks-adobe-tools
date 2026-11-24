#!/usr/bin/env node
"use strict";
// Frank's Worlds Brew app tests:  npm test   (Linux CI: runs under xvfb-run when there is no display)
//   1. host-free: engine copy is current, scaling tools, width / height / depth stretch in the ray tracer
//   2. the real app in Electron: drag-and-drop from the Library, click-select and drag-move, Scale card,
//      camera pad, undo / redo, save and open a .wbscene, render to PNG; screenshots go to tests/out/
const path = require("path"), fs = require("fs"), os = require("os"), assert = require("assert");
const APP = path.resolve(__dirname, ".."), OUT = path.join(__dirname, "out");
let failed = 0;
async function t(name, fn) { try { await fn(); console.log("ok   " + name); } catch (e) { failed++; console.log("FAIL " + name + "\n     " + String(e && e.stack || e).split("\n").slice(0, 8).join("\n     ")); } }
const hash = (a) => { let h = 2166136261; for (let i = 0; i < a.length; i++) { h ^= a[i]; h = Math.imul(h, 16777619); } return h >>> 0; };

(async () => {
  await t("engine/ matches plugins/worlds-brew/js and shared/ (run npm run sync)", () => { assert.deepStrictEqual(require("../tools/sync-engine.js").sync(true), []); });

  const S = require("../engine/scene.js"), E = require("../engine/engine.js"), ED = require("../engine/editor.js"), PK = require("../engine/packs.js"), SC = require("../renderer/scaletools.js");
  await t("scaling tools: real size, set height, x2, stretch with and without the proportion lock, match, reset", () => {
    const sc = S.loadPreset("Chrome Garden"), cube = S.obj("cube", 0, 1, 0, 1, "Gold"); sc.objs.push(cube); ED.dropToGround(sc, cube);
    assert.deepStrictEqual(SC.dims(cube), { w: 2, h: 2, d: 2 });
    assert.ok(/2\.00 x 2\.00 x 2\.00 m/.test(SC.sizeText(cube)) && /6\.6 x 6\.6 x 6\.6 ft/.test(SC.sizeText(cube)));
    SC.setHeight(sc, cube, 1.8, true); assert.strictEqual(SC.dims(cube).h, 1.8); assert.ok(Math.abs(cube.y - 0.9) < 0.01, "rests on the ground after resizing");
    SC.mul(sc, cube, 2, true); assert.strictEqual(SC.dims(cube).h, 3.6);
    SC.stretch(sc, cube, "w", 2, false, true); assert.deepStrictEqual([cube.sx, cube.sy, cube.sz], [2, 1, 1]);
    SC.stretch(sc, cube, "h", 2, true, true); assert.deepStrictEqual([cube.sx, cube.sy, cube.sz], [4, 2, 2], "locked: all three follow");
    assert.ok(Math.abs(cube.y - SC.dims(cube).h / 2) < 0.01, "a taller cube still stands on the ground");
    const prev = { sx: cube.sx, sy: cube.sy, sz: cube.sz }; cube.sz = 4; assert.ok(SC.applyLock(cube, prev)); assert.deepStrictEqual([cube.sx, cube.sy, cube.sz], [8, 4, 4]);
    SC.resetStretch(sc, cube, true); assert.deepStrictEqual([cube.sx, cube.sy, cube.sz], [1, 1, 1]);
    const pine = PK.put("fantasy/pine", 3, 0, 1); sc.objs.push(pine); SC.match(sc, cube, pine, true); assert.ok(Math.abs(SC.dims(cube).h - SC.dims(pine).h) < 0.01, "matched heights");
    const ter = S.obj("terrain", 0, 0, -8, 6, "Stone", { h: 3 }); assert.strictEqual(SC.dims(ter).w, 12); SC.mul(sc, ter, 2, true); assert.strictEqual(ter.s, 12); assert.strictEqual(ter.h, 6);
    assert.deepStrictEqual(SC.dims(S.light(0, 1, 0)), { w: 0, h: 0, d: 0 });
  });
  await t("ray tracer: width / height / depth stretch reshapes spheres, cubes and cylinders (and leaves unstretched ones alone)", async () => {
    for (const type of ["sphere", "cube", "cylinder", "cone", "torus"]) {
      const base = S.loadPreset("Chrome Garden"); base.objs = [S.obj(type, 0, 1, 0, 1, "Matte")]; base.cam = { yaw: 0, pitch: 5, dist: 8, fov: 45, tx: 0, ty: 1, tz: 0 };
      const a = await E.render(base, base.cam, 48, 27); base.objs[0].sx = 1; const b = await E.render(base, base.cam, 48, 27);
      assert.strictEqual(hash(a.rgba), hash(b.rgba), type + ": scale 1 is unchanged");
      base.objs[0].sx = 2.2; const c = await E.render(base, base.cam, 48, 27); assert.notStrictEqual(hash(a.rgba), hash(c.rgba), type + ": wider");
    }
    const sc = S.loadPreset("Chrome Garden"), tall = S.obj("sphere", 0, 0, 0, 1, "Matte", { sy: 3 }); ED.dropToGround(sc, tall); assert.strictEqual(tall.y, 3, "drop to ground uses the height stretch");
  });
  await t("surface layers: shared maths (place, masks, blends), presets, the ray tracer draws them, layers save and load", async () => {
    const SF = require("../engine/surface.js");
    assert.deepStrictEqual(SF.place({ tile: 2 }, 0.75, 0.5), [1, 0.5], "tile doubles around the centre");
    const rp = SF.place({ rot: 90 }, 1, 0.5); assert.ok(Math.abs(rp[0] - 0.5) < 1e-9 && Math.abs(rp[1] - 1) < 1e-9, "turn 90 degrees");
    assert.strictEqual(SF.band({ lo: 0.5, soft: 0.01 }, 0.9), 1); assert.strictEqual(SF.band({ lo: 0.5, soft: 0.01 }, 0.1), 0); assert.strictEqual(SF.band({ hi: 0.3, soft: 0.01 }, 0.9), 0);
    assert.strictEqual(SF.blendCh("Multiply", 0.5, 0.5), 0.25); assert.strictEqual(SF.blendCh("Screen", 0.5, 0.5), 0.75); assert.strictEqual(SF.blendCh("Add", 0.8, 0.5), 1);
    assert.ok(SF.presetNames().length >= 9 && SF.presetNames().every((n) => SF.preset(n).every((L) => L.img && L.img.d.length === L.img.w * L.img.h * 4)));
    const mk = () => { const sc = S.loadPreset("Chrome Garden"); sc.objs = [S.obj("cube", 0, 1, 0, 1, "Matte")]; sc.cam = { yaw: 30, pitch: 15, dist: 5, fov: 45, tx: 0, ty: 1, tz: 0 }; return sc; };
    const a = await E.render(mk(), mk().cam, 64, 36), lay = mk(); lay.objs[0].layers = SF.preset("Red bricks");
    const b = await E.render(lay, lay.cam, 64, 36); assert.notStrictEqual(hash(a.rgba), hash(b.rgba), "a layer changes the picture");
    lay.objs[0].layers[0].on = false; const c = await E.render(lay, lay.cam, 64, 36); assert.strictEqual(hash(a.rgba), hash(c.rgba), "a hidden layer changes nothing");
    lay.objs[0].layers[0].on = true; const back = S.fromJSON(JSON.parse(JSON.stringify(S.toJSON(lay))));
    const L0 = back.objs[0].layers[0]; assert.strictEqual(L0.bump, 1); assert.strictEqual(hash(L0.img.d), hash(lay.objs[0].layers[0].img.d), "the picture survives save and open");
    const d = await E.render(back, back.cam, 64, 36); assert.strictEqual(hash(b.rgba), hash(d.rgba));
  });
  await t("design tokens: renderer/tokens.css comes from tokens/brew-tokens.json and the app's mint is the suite's worlds-brew glow", () => {
    const tok = require("../../../tokens/brew-tokens.json"), hex = tok.color.glow["worlds-brew"].$value.hex.toLowerCase();
    assert.ok(new RegExp('GLOW = "' + hex + '"', "i").test(fs.readFileSync(path.join(APP, "renderer/app.js"), "utf8")), "app.js GLOW matches the token");
    const css = fs.readFileSync(path.join(APP, "renderer/tokens.css"), "utf8"); assert.ok(css.includes("--tk-glow-hex: " + hex) && /--mint-l: 0\.90\d; --mint-c: 0\.15\d; --mint-h: 16\d\.\d/.test(css));
    assert.ok(/href="tokens.css"[\s\S]*href="app.css"/.test(fs.readFileSync(path.join(APP, "renderer/index.html"), "utf8")), "tokens load before app.css");
  });
  await t("the starter pack doubled: 52 models and 10 maps", () => {
    assert.strictEqual(PK.assets("Fantasy").length + PK.assets("Alien").length, 52);
    assert.strictEqual(PK.PACKS.reduce((n, p) => n + Object.keys(PK.MAPS[p]).length, 0), 10);
  });

  // ---- the app itself
  if (process.env.WB_SKIP_UI) { console.log("skip UI tests (WB_SKIP_UI)"); return done(); }
  if (process.platform === "linux" && !process.env.DISPLAY) {   // re-run under a virtual display
    const r = require("child_process").spawnSync("xvfb-run", ["-a", "-s", "-screen 0 1600x1000x24", process.execPath, __filename, "--ui-only"], { stdio: "inherit" });
    failed += r.status ? 1 : 0; return done();
  }
  await uiTests();
  done();
})();
function done() { console.log(failed ? failed + " failed" : "all passed"); process.exit(failed ? 1 : 0); }

async function uiTests() {
  if (process.argv.includes("--ui-only")) failed = 0;
  const { _electron: electron } = require("playwright");
  fs.mkdirSync(OUT, { recursive: true });
  const args = [APP, "--no-sandbox"].concat(process.platform === "linux" ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : []);
  const app = await electron.launch({ executablePath: require(path.join(APP, "node_modules/electron")), args });
  const win = await app.firstWindow(), errors = [];
  win.on("pageerror", (e) => errors.push(e.message)); win.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1500, 940));
  await win.waitForFunction(() => !!window.__wb, null, { timeout: 60000 }); await win.waitForTimeout(800);
  const W = (fn, arg) => win.evaluate(fn, arg);
  const centre = () => W(() => { const r = document.getElementById("vp").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });

  await t("app: window, live viewport, Library, Inspector and render bar are up, with no script errors", async () => {
    assert.ok(await W(() => !!document.querySelector("#vp") && document.querySelectorAll(".wbtile").length === 9 + 52), "9 shapes + 52 models in the Add card");
    assert.ok(await W(() => document.querySelectorAll(".wbcell").length === 22), "22 scenes");
    const px = await W(() => { const c = document.getElementById("vp"); window.__wb.vp.draw(); const g = c.getContext("webgl2", { preserveDrawingBuffer: true }); const p = new Uint8Array(4); g.readPixels(c.width >> 1, c.height >> 1, 1, 1, g.RGBA, g.UNSIGNED_BYTE, p); return Array.from(p); });
    assert.ok(px[0] + px[1] + px[2] > 30, "the GPU view draws something: " + px);
    await win.screenshot({ path: path.join(OUT, "app-start.png") });
    assert.deepStrictEqual(errors, []);
  });
  await t("app: drag a model from the Library into the view; it lands where it is dropped, standing on the ground", async () => {
    await W(() => { const w = window.__wb; w.loadScene(w.S.loadPreset("Chrome Garden")); w.st.view.addPack = "Fantasy"; w.changed("val"); });
    const n0 = await W(() => window.__wb.st.scene.objs.length);
    const target = await W(() => { const w = window.__wb; w.vp.draw(); return w.vp.project(-3, 0, 2.5); });
    await W(({ x, y }) => { const tile = [...document.querySelectorAll(".wbtile")].find((t) => t.__key === "asset:fantasy/knight"), dt = new DataTransfer(), wrap = document.getElementById("vpwrap");
      tile.dispatchEvent(new DragEvent("dragstart", { dataTransfer: dt, bubbles: true }));
      wrap.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, clientX: x, clientY: y, bubbles: true, cancelable: true }));
      wrap.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, clientX: x, clientY: y, bubbles: true, cancelable: true })); }, target);
    const o = await W(() => { const s = window.__wb.st.sel; return { n: window.__wb.st.scene.objs.length, asset: s.asset, x: s.x, z: s.z, h: window.__wb.SC.dims(s).h, y: s.y }; });
    assert.strictEqual(o.n, n0 + 1); assert.strictEqual(o.asset, "fantasy/knight");
    assert.ok(Math.hypot(o.x + 3, o.z - 2.5) < 0.2, "landed at the drop point: " + o.x + ", " + o.z);
    await win.screenshot({ path: path.join(OUT, "app-dropped-knight.png") });
  });
  await t("app: click an object to select it, then drag it across the ground", async () => {
    await W(() => { const w = window.__wb; w.st.view.gizmo = "move"; w.changed("view"); });
    const p = await W(() => { const w = window.__wb, o = w.st.scene.objs.find((q) => q.type === "cube"); w.select(null); w.vp.draw(); return Object.assign(w.vp.project(o.x, o.y, o.z), { x0: o.x, z0: o.z, id: o.id }); });
    await win.mouse.move(p.x, p.y); await win.mouse.down();
    for (let i = 1; i <= 10; i++) { await win.mouse.move(p.x - i * 12, p.y + i * 4); await win.waitForTimeout(16); }
    await win.mouse.up();
    const o = await W((id) => { const w = window.__wb, q = w.st.scene.objs.find((x) => x.id === id); return { sel: w.st.sel === q, x: q.x, z: q.z, y: q.y, s: q.s }; }, p.id);
    assert.ok(o.sel, "selected"); assert.ok(Math.hypot(o.x - p.x0, o.z - p.z0) > 0.5, "moved"); assert.ok(Math.abs(o.y - o.s) < 0.02, "still on the ground");
  });
  await t("app: Scale card (x2, real height, Person, lock) and the R handles", async () => {
    await win.locator(".tabbtn", { hasText: "Scale" }).click();
    const s0 = await W(() => window.__wb.st.sel.s);
    await win.locator("#insp [role=button]", { hasText: "x2" }).click();
    assert.strictEqual(await W(() => window.__wb.st.sel.s), +(s0 * 2).toFixed(3));
    await win.locator("#insp [role=button]", { hasText: "Person" }).click();
    assert.strictEqual(await W(() => window.__wb.SC.dims(window.__wb.st.sel).h), 1.8);
    await win.screenshot({ path: path.join(OUT, "app-scale-card.png") });
    await win.keyboard.press("r"); assert.strictEqual(await W(() => window.__wb.st.view.gizmo), "scale");
    assert.ok(await W(() => window.__wb.vp.tc.mode === "scale" && !!window.__wb.vp.tc.object), "scale handles on the selection");
    await win.keyboard.press("w");
  });
  await t("app: camera pad and view buttons move the camera; Lock camera stops them", async () => {
    const y0 = await W(() => window.__wb.st.scene.cam.yaw);
    await win.locator(".wbpad", { hasText: "CAMERA" }).locator("[role=button]", { hasText: ">" }).first().click();
    assert.notStrictEqual(await W(() => window.__wb.st.scene.cam.yaw), y0);
    await win.locator("#pad [role=button]", { hasText: "Top" }).click(); assert.strictEqual(await W(() => window.__wb.st.scene.cam.pitch), 89);
    await win.locator("#pad [role=button]", { hasText: "Frame all" }).click();
    const c = await centre(); const d0 = await W(() => window.__wb.st.scene.cam.dist); await win.mouse.move(c.x, c.y); await win.mouse.wheel(0, -400); await win.waitForTimeout(100);
    assert.ok(await W(() => window.__wb.st.scene.cam.dist) < d0, "wheel zooms in");
    await W(() => { window.__wb.st.view.camLock = true; }); const y1 = await W(() => window.__wb.st.scene.cam.yaw);
    await win.locator(".wbpad", { hasText: "CAMERA" }).locator("[role=button]", { hasText: ">" }).first().click();
    assert.strictEqual(await W(() => window.__wb.st.scene.cam.yaw), y1); await W(() => { window.__wb.st.view.camLock = false; });
    await W(() => window.__wb.CT.camView(window.__wb.st.scene.cam, "three")); await W(() => window.__wb.changed("view"));
  });
  await t("app: undo / redo", async () => {
    const n = await W(() => window.__wb.st.scene.objs.length);
    await W(() => window.__wb.addThing("shape:torus"));
    assert.strictEqual(await W(() => window.__wb.st.scene.objs.length), n + 1);
    await W(() => window.__wb.undo()); assert.strictEqual(await W(() => window.__wb.st.scene.objs.length), n);
    await W(() => window.__wb.redo()); assert.strictEqual(await W(() => window.__wb.st.scene.objs.length), n + 1);
  });
  const file = path.join(os.tmpdir(), "wb-test-" + process.pid + ".wbscene");
  await t("app: save a .wbscene and open it again (models, sizes and the camera come back)", async () => {
    await W((f) => { window.__wb.filePath = f; return window.__wb.save(false); }, file);
    assert.ok(fs.existsSync(file) && fs.statSync(file).size > 1000);
    const before = await W(() => window.__wb.st.scene.objs.map((o) => [o.type, o.asset || "", +o.s.toFixed(3), +o.x.toFixed(2)]).join(";"));
    await W(() => { const w = window.__wb; w.loadScene(w.S.loadPreset("Snow Peaks")); });
    await W((f) => window.__wb.openScene(f), file);
    assert.strictEqual(await W(() => window.__wb.st.scene.objs.map((o) => [o.type, o.asset || "", +o.s.toFixed(3), +o.x.toFixed(2)]).join(";")), before);
    assert.strictEqual(await W(() => window.__wb.dirty), false);
    fs.unlinkSync(file);
  });
  await t("app: Render PNG (draft) shows the result and keeps a valid PNG", async () => {
    await W(() => { const w = window.__wb; w.st.out.w = 240; w.st.out.h = 135; w.st.out.quality = "draft"; });
    await W(() => window.__wb.renderNow());
    await win.waitForFunction(() => !document.getElementById("shot").hidden, null, { timeout: 60000 });
    await win.screenshot({ path: path.join(OUT, "app-render-result.png") });
    await win.keyboard.press("Escape");
    const sig = await W(() => Array.from(document.getElementById("shotimg").src.slice(0, 22)).join(""));
    assert.strictEqual(sig, "data:image/png;base64,");
  });
  await t("app: Ctrl+K command palette finds and runs actions (search 'top view', 'add knight')", async () => {
    await win.locator("#vp").click({ position: { x: 5, y: 5 } }).catch(() => {});
    await win.keyboard.press("Control+k");
    assert.ok(await W(() => window.__wb.pal.isOpen), "palette opens");
    assert.ok(await W(() => window.__wb.commands().length) > 120, "covers files, tools, views, tabs, sky, water, every asset and scene");
    await win.keyboard.type("top view");
    assert.strictEqual(await win.locator(".palrow.on .pall").textContent(), "Top view");
    await win.screenshot({ path: path.join(OUT, "app-palette.png") });
    await win.keyboard.press("Enter");
    assert.ok(!(await W(() => window.__wb.pal.isOpen)), "closes after running");
    assert.strictEqual(await W(() => window.__wb.st.scene.cam.pitch), 89);
    const n = await W(() => window.__wb.st.scene.objs.length);
    await win.keyboard.press("Control+k"); await win.keyboard.type("knight"); await win.keyboard.press("Enter");
    assert.strictEqual(await W(() => window.__wb.st.scene.objs.length), n + 1);
    assert.strictEqual(await W(() => window.__wb.st.sel.asset), "fantasy/knight");
    await win.keyboard.press("Control+k"); await win.keyboard.press("Escape"); assert.ok(!(await W(() => window.__wb.pal.isOpen)), "Esc closes");
  });
  await t("app: axis cube snaps the view; status bar shows live key hints", async () => {
    await W(() => { const w = window.__wb; w.st.scene.cam.yaw = 30; w.st.scene.cam.pitch = 20; w.changed("view"); });
    assert.strictEqual(await win.locator(".axisgizmo .agaxis").count(), 6);
    await win.locator(".axisgizmo .agaxis title", { hasText: "Right view" }).locator("..").dispatchEvent("pointerdown");
    assert.deepStrictEqual(await W(() => [window.__wb.st.scene.cam.yaw, window.__wb.st.scene.cam.pitch]), [90, 6]);
    await win.locator(".axisgizmo .agaxis title", { hasText: "Top view" }).locator("..").dispatchEvent("pointerdown");
    assert.strictEqual(await W(() => window.__wb.st.scene.cam.pitch), 89);
    await W(() => { const w = window.__wb; w.CT.camView(w.st.scene.cam, "three"); w.select(w.st.scene.objs.find((o) => o.type === "cube")); });
    const k1 = await win.locator(".keyhints").textContent(); assert.ok(/nudge/.test(k1) && /Del/.test(k1), "selection hints: " + k1);
    await W(() => window.__wb.select(null)); const k2 = await win.locator(".keyhints").textContent(); assert.ok(/select next/.test(k2) && !/nudge/.test(k2), "no-selection hints: " + k2);
    await W(() => { const w = window.__wb; w.st.view.gizmo = "sculpt"; w.changed("view"); }); assert.ok(/sculpt terrain/.test(await win.locator(".keyhints").textContent()));
    await W(() => { const w = window.__wb; w.st.view.gizmo = "move"; w.select(w.st.scene.objs.find((o) => o.type === "cube")); w.changed("view"); });
    await win.screenshot({ path: path.join(OUT, "app-axes-hints.png") });
  });
  await t("app: Surfaces tab: presets add layers, the live GPU view shows them, undo takes them off", async () => {
    const px = () => W(() => { const w = window.__wb, c = document.getElementById("vp"); w.vp.draw(); const g = c.getContext("webgl2", { preserveDrawingBuffer: true }), p = new Uint8Array(4); g.readPixels(c.width >> 1, c.height >> 1, 1, 1, g.RGBA, g.UNSIGNED_BYTE, p); return Array.from(p); });
    await W(() => { const w = window.__wb, S = w.S; w.loadScene(S.loadPreset("Chrome Garden")); const sc = w.st.scene; sc.objs = []; const cube = S.obj("cube", 0, 1, 0, 1.2, "Matte"); sc.objs.push(cube); w.select(cube); sc.cam = { yaw: 0, pitch: 8, dist: 5, fov: 45, tx: 0, ty: 1.2, tz: 0 }; w.changed("view"); w.commit(); });
    const before = await px();
    await W(() => { window.__wb.commands().find((c) => c.label === "Surfaces tab").run(); window.__wb.commands().find((c) => c.label === "Add preset: Neon grid").run(); });
    assert.strictEqual(await W(() => window.__wb.st.sel.layers.length), 1);
    assert.ok(await W(() => document.querySelectorAll(".wblayers .wbobj").length === 1), "the layer is listed");
    await W(() => { window.__wb.st.sel.layers[0].opacity = 100; window.__wb.st.sel.layers[0].blend = "Normal"; window.__wb.st.sel.layers[0].tile = 0.13; window.__wb.changed("val"); });   // big grid: the centre is a dark cell
    const after = await px(); assert.ok(Math.abs(after[0] - before[0]) + Math.abs(after[1] - before[1]) + Math.abs(after[2] - before[2]) > 40, "the view shows the layer: " + before + " -> " + after);
    await win.screenshot({ path: path.join(OUT, "app-surfaces.png") });
    await W(() => window.__wb.undo()); assert.ok(!(await W(() => (window.__wb.st.sel.layers || []).length)), "undo takes the layer off");
  });
  await t("app: GPU render (Draft and Final) with Depth, Object mask and Sky mask passes; ray tracer still works", async () => {
    for (const [engine, quality] of [["gpu", "draft"], ["gpu", "final"], ["ray", "draft"]]) {
      await W(([e, q]) => { const w = window.__wb; Object.assign(w.st.out, { engine: e, quality: q, w: e === "gpu" ? 320 : 96, h: e === "gpu" ? 180 : 54 }); return w.renderNow(); }, [engine, quality]);
      const info = await W(() => { const r = window.__wb.refs.lastRender; const ids = new Set(r.ids); return { w: r.w, h: r.h, n: r.rgba.length, objs: Array.from(ids).filter((i) => i >= 0).length, sky: Array.from(ids).includes(-1), tabs: Array.from(document.querySelectorAll("#shot .shotrow > *")).map((b) => b.textContent.trim()) }; });
      assert.strictEqual(info.n, info.w * info.h * 4, engine + " " + quality + " picture size");
      assert.ok(info.objs >= 1 && info.sky, engine + " " + quality + " passes see the object and the sky");
      assert.deepStrictEqual(info.tabs.slice(1, 5), ["Render", "Depth", "Object mask", "Sky mask"]);
    }
    await win.screenshot({ path: path.join(OUT, "app-gpu-render.png") });
    await win.keyboard.press("Escape"); await W(() => { document.getElementById("shot").hidden = true; });
  });
  await t("app: no script errors during the session", () => { assert.deepStrictEqual(errors, []); });
  await t("app: Quit with unsaved changes asks first; Don't Save ends the app (macOS used to keep it running)", async () => {
    await W(() => { window.__wb.dirty = true; });
    const proc = app.process(), exited = new Promise((r) => proc.once("exit", () => r(true)));
    await app.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 1 }); });   // answer "Don't Save"
    await app.evaluate(({ app: a }) => { setTimeout(() => a.quit(), 10); });
    assert.ok(await Promise.race([exited, new Promise((r) => setTimeout(() => r(false), 10000))]), "the app process ended");
  });
}
