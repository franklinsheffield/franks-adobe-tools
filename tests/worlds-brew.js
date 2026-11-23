"use strict";
// Worlds Brew (phase 1) tests: model importers, scene save/load, determinism, render layers, wireframe and handles.
const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
const J = path.join(ROOT, "plugins/worlds-brew/js");

module.exports = async function (t) {
  const M = require(J + "/models.js"), S = require(J + "/scene.js"), E = require(J + "/engine.js"), W = require(J + "/wire.js");
  const hash = (u8) => { let h = 2166136261; for (let i = 0; i < u8.length; i++) h = Math.imul(h ^ u8[i], 16777619); return (h >>> 0).toString(16); };

  await t("Worlds Brew: .obj import (quads, negative indices, v/vt/vn faces) normalises to a -1..1 box", () => {
    const m = M.parseOBJ("v 0 0 0\nv 4 0 0\nv 4 2 0\nv 0 2 0\nvn 0 0 1\nf 1//1 2//1 3//1 4//1\nf -4 -2 -1\n", "quad.obj");
    assert.strictEqual(m.tris, 3); assert.strictEqual(Math.max(...m.v), 1); assert.strictEqual(Math.min(...m.v), -1);
    assert.ok(Math.abs(m.hy - 0.5) < 1e-6, "half-height in normalised units");
    assert.throws(() => M.parseOBJ("v 0 0 0\n", "empty.obj"), /no faces/);
    assert.throws(() => M.parseOBJ("v 0 0 0\nf 1 2 3\n", "bad.obj"), /missing vertex/);
  });

  await t("Worlds Brew: .stl import (binary and ASCII) turns Z-up into Y-up", () => {
    const tri = [[0, 0, 0], [1, 0, 0], [0, 0, 2]], buf = new ArrayBuffer(84 + 50), dv = new DataView(buf);
    dv.setUint32(80, 1, true); tri.forEach((v, k) => v.forEach((c, j) => dv.setFloat32(84 + 12 + k * 12 + j * 4, c, true)));
    const b = M.parseSTL(buf, "t.stl"); assert.strictEqual(b.tris, 1); assert.strictEqual(b.hy, 1, "STL z (height 2) becomes y");
    const asc = "solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 0 2\nendloop\nendfacet\nendsolid\n";
    const a = M.parseSTL(new TextEncoder().encode(asc).buffer, "a.stl"); assert.deepStrictEqual(Array.from(a.v), Array.from(b.v));
  });

  await t("Worlds Brew: .glb import applies node transforms and reads uint16 indices", () => {
    const P = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), I = new Uint16Array([0, 1, 2, 0]);
    const bin = new Uint8Array(36 + 8); bin.set(new Uint8Array(P.buffer), 0); bin.set(new Uint8Array(I.buffer), 36);
    const json = { asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ children: [1], scale: [4, 1, 1] }, { mesh: 0, translation: [0, 5, 0] }],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }], buffers: [{ byteLength: 44 }],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 6 }],
      accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" }, { bufferView: 1, componentType: 5123, count: 3, type: "SCALAR" }] };
    let js = new TextEncoder().encode(JSON.stringify(json)); const padJ = (4 - js.length % 4) % 4; const jsP = new Uint8Array(js.length + padJ).fill(32); jsP.set(js);
    const total = 12 + 8 + jsP.length + 8 + bin.length, glb = new Uint8Array(total), dv = new DataView(glb.buffer);
    dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
    dv.setUint32(12, jsP.length, true); dv.setUint32(16, 0x4E4F534A, true); glb.set(jsP, 20);
    dv.setUint32(20 + jsP.length, bin.length, true); dv.setUint32(24 + jsP.length, 0x004E4942, true); glb.set(bin, 28 + jsP.length);
    const m = M.parseGLB(glb.buffer, "t.glb"); assert.strictEqual(m.tris, 1);
    assert.ok(Math.abs(m.hy - 0.25) < 1e-6, "x scaled by 4, so height 1 normalises to 0.25 of the half-extent");
    assert.throws(() => M.parseGLB(new ArrayBuffer(24), "x.glb"), /binary glTF/);
  });

  await t("Worlds Brew: 12 built-in scenes, all render, deterministically", async () => {
    const names = Object.keys(S.PRESETS); assert.strictEqual(names.length, 12);
    for (const n of names) {
      const s = S.loadPreset(n), r1 = await E.render(s, s.cam, 48, 27), r2 = await E.render(S.loadPreset(n), s.cam, 48, 27);
      assert.strictEqual(hash(r1.rgba), hash(r2.rgba), n + " renders the same twice");
      let lo = 255, hi = 0; for (let i = 0; i < r1.rgba.length; i += 4) { lo = Math.min(lo, r1.rgba[i + 1]); hi = Math.max(hi, r1.rgba[i + 1]); }
      assert.ok(hi - lo > 25, n + " is not a flat image");
    }
  });

  await t("Worlds Brew: render layers (Render + Depth, Object mask, Sky mask) and draft/cancel", async () => {
    const s = S.loadPreset("Chrome Garden"), r = await E.render(s, s.cam, 64, 36, { passes: true });
    const L = E.layers(r, { depth: true, mask: true, sky: true });
    assert.deepStrictEqual(L.map((l) => l.name), ["Render", "Depth", "Object mask", "Sky mask"]);
    assert.ok(L.every((l) => l.rgba.length === 64 * 36 * 4));
    const ids = new Set(r.ids); assert.ok(ids.has(1), "the imported pawn (object 1) is visible"); assert.ok(ids.has(-4), "ground visible");
    const d = await E.render(s, s.cam, 64, 36, { step: 3 }); assert.strictEqual(d.rgba[0], d.rgba[4], "draft fills 3x3 blocks");
    let calls = 0; const c = await E.render(s, s.cam, 64, 36, {}, { yield: async () => { calls++; }, cancelled: () => calls > 0 });
    assert.ok(c === null || calls >= 1, "cancel stops the render");
  });

  await t("Worlds Brew: scene save/load keeps models and renders identically", async () => {
    const s = S.loadPreset("Model Showcase"), back = S.fromJSON(S.toJSON(s));
    assert.strictEqual(back.objs.filter((o) => o.type === "mesh").length, 4);
    const a = await E.render(s, s.cam, 40, 24), b = await E.render(back, back.cam, 40, 24);
    assert.strictEqual(hash(a.rgba), hash(b.rgba));
    const obj = M.exportOBJ(s.objs[0]); assert.ok(/^v /m.test(obj) && /^f /m.test(obj));
  });

  await t("Worlds Brew: wireframe, picking and move / scale / rotate handles", () => {
    const s = S.loadPreset("Chrome Garden"), pawn = s.objs[1], w = W.wireframe(s, s.cam, 320, 180, { sel: pawn, gizmo: "move" });
    assert.strictEqual(w.rgba.length, 320 * 180 * 4); assert.ok(w.gizmo && w.gizmo.axes.length === 3);
    const x = w.gizmo.axes.find((a) => a.ax === "x"), h = W.pickHandle(w.gizmo, (w.gizmo.s0[0] + x.s1[0]) / 2, (w.gizmo.s0[1] + x.s1[1]) / 2);
    assert.strictEqual(h.ax, "x"); const start = Object.assign({}, pawn);
    W.dragHandle(pawn, start, h, x.s1[0] - w.gizmo.s0[0], x.s1[1] - w.gizmo.s0[1]); assert.ok(Math.abs(pawn.x - (start.x + h.L)) < 0.01, "dragging one handle length moves L units");
    const ws = W.wireframe(s, s.cam, 320, 180, { sel: pawn, gizmo: "scale" }), hy = W.pickHandle(ws.gizmo, ws.gizmo.axes[1].s1[0], ws.gizmo.axes[1].s1[1]);
    W.dragHandle(pawn, Object.assign({}, pawn), hy, ws.gizmo.axes[1].s1[0] - ws.gizmo.s0[0], ws.gizmo.axes[1].s1[1] - ws.gizmo.s0[1]); assert.ok(Math.abs(pawn.sy - 2) < 0.01, "scale Y doubles a model's height");
    const c = W.wireframe(s, s.cam, 320, 180, {}), B = S.camBasis(s.cam, 320 / 180);
    assert.ok(c.horizonY > 0 && c.horizonY < 180);
    assert.strictEqual(W.pick(s, s.cam, 320, 180, 5, 5), null, "empty sky picks nothing");
    assert.ok(B.tan > 0);
  });

  await t("Worlds Brew panels: Viewport + Console, Create strip, tabs follow the selection, keys, save, Render to layer", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins/worlds-brew"), { withDoc: true, docW: 96, docH: 54 });
    await P.settle(1500);
    const T = P.mod._test, R = T.refs, tabs = R.tabs.__tabs.items, shown = (n) => tabs.find((x) => x.title === n).btn.style.display !== "none";
    assert.ok(P.document.getElementById("app") && P.document.getElementById("vp"), "two panel roots");
    assert.ok(/^data:image\/png/.test(R.vpImg.src) && /^data:image\/png/.test(R.preview.src), "viewport and mini render drawn");
    assert.strictEqual(R.thumbs.length, 22, "12 classic scenes + 5 Fantasy + 5 Alien maps");
    const n0 = T.st.scene.objs.length, btn = (ty) => R.createBtns.find((b) => b.__type === ty);
    btn("sphere").click(); assert.strictEqual(T.st.scene.objs.length, n0 + 1); assert.strictEqual(T.st.sel.type, "sphere");
    assert.ok(!shown("Mesh"), "Mesh tab only for models");
    btn("pawn").click(); assert.strictEqual(T.st.sel.type, "mesh"); assert.ok(shown("Mesh"));
    assert.ok(Math.abs(T.st.sel.y - T.st.sel.mesh.hy * T.st.sel.s) < 0.05, "new model stands on the ground");
    T.onKey({ key: "r", target: P.document.body }); assert.strictEqual(T.st.view.gizmo, "scale");
    T.drawViewport(); assert.ok(T.lastWire.gizmo && T.lastWire.gizmo.mode === "scale", "handles drawn for the selection");
    T.onKey({ key: "Delete", target: P.document.body }); assert.strictEqual(T.st.scene.objs.length, n0 + 1, "Delete removes the selection");
    R.saveName.value = "My test scene"; await T.saveCurrent(); assert.strictEqual(T.saved.length, 1);
    assert.ok(P.host.calls.some((c) => c[0] === "fileWrite"), "saved to the plugin data folder");
    R.thumbs.find((c) => c.__name === "Neon Grid").click(); assert.strictEqual(T.st.scene.name, "Neon Grid");
    T.st.out.quality = "draft"; await T.renderNow();
    const calls = P.host.calls;
    assert.ok(calls.some((c) => c[0] === "createPixelLayer" && c[1] === "Render"));
    assert.ok(calls.some((c) => c[0] === "createLayerGroup" && c[1] === "Frank's Worlds Brew - Neon Grid"));
    assert.ok(calls.some((c) => c[0] === "putPixels" && c[3] === 96 * 54 * 4), "document-size RGBA layer");
    assert.ok(calls.some((c) => c[0] === "suspendHistory"), "one History step");
    assert.ok(/Rendered 96 x 54/.test(R.status.textContent), R.status.textContent);
  });

  await t("Worlds Brew: PNG reader (zlib inflate) and model colours from glTF materials", () => {
    const zlib = require("zlib"), D = require(J + "/pngdec.js");
    const raw = Buffer.alloc(50000); for (let i = 0; i < raw.length; i++) raw[i] = (i * 7 + (i >> 8)) & 255;
    for (const level of [0, 1, 9]) assert.strictEqual(Buffer.compare(Buffer.from(D.inflate(zlib.deflateSync(raw, { level }).subarray(2))), raw), 0, "inflate level " + level);
    const PNG = require(path.join(ROOT, "shared/png.js")), px = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 128]);
    const back = D.decodePNG(PNG.encodePNG(px, 2, 1, 4)); assert.deepStrictEqual(Array.from(back.rgba), Array.from(px));
    const P = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), bin = new Uint8Array(36); bin.set(new Uint8Array(P.buffer));
    const json = { asset: { version: "2.0" }, nodes: [{ mesh: 0 }], meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }], materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1] } }],
      buffers: [{ byteLength: 36, uri: "data:application/octet-stream;base64," + Buffer.from(bin).toString("base64") }], bufferViews: [{ buffer: 0, byteLength: 36 }], accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" }] };
    const m = M.parseGLTF(JSON.stringify(json), "red.gltf"); assert.deepStrictEqual(Array.from(m.tc), [255, 0, 0]);
    const j = M.meshFromJSON(M.meshToJSON(m)); assert.deepStrictEqual(Array.from(j.tc), [255, 0, 0], "colours survive save / load");
  });

  await t("Worlds Brew: Fantasy (Kenney CC0) and Alien packs: 52 coloured assets and 10 maps that render", async () => {
    const PK = require(J + "/packs.js");
    assert.deepStrictEqual(PK.PACKS, ["Fantasy", "Alien"]);
    assert.ok(PK.assets("Fantasy").length === 36 && PK.assets("Alien").length === 16, "52 starter models (doubled in 0.6)");
    for (const pk of PK.PACKS) for (const a of PK.assets(pk)) { assert.ok(a.mesh.tc && a.mesh.tc.length === a.mesh.f.length, a.name + " has colours"); assert.ok(a.credit, a.name + " credited"); }
    let n = 0;
    for (const pk of PK.PACKS) for (const name of Object.keys(PK.MAPS[pk])) {
      const s = PK.loadMap(pk, name), r = await E.render(s, s.cam, 48, 27); n++;
      let lo = 255, hi = 0; for (let i = 0; i < r.rgba.length; i += 4) { lo = Math.min(lo, r.rgba[i + 1]); hi = Math.max(hi, r.rgba[i + 1]); }
      assert.ok(hi - lo > 20, name + " is not flat");
      const back = S.fromJSON(S.toJSON(s)); assert.strictEqual(hash((await E.render(back, back.cam, 32, 18)).rgba), hash((await E.render(s, s.cam, 32, 18)).rgba), name + " saves and loads");
    }
    assert.strictEqual(n, 10);
    const red = S.loadPreset("Model Showcase"); red.objs = [PK.put("fantasy/house", 0, 0, 1)]; const on = await E.render(red, red.cam, 40, 24); red.objs[0].vc = false;
    assert.notStrictEqual(hash(on.rgba), hash((await E.render(red, red.cam, 40, 24)).rgba), "Model colours switch changes the render");
  });

  await t("Worlds Brew panels: pack scenes and the Assets card", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins/worlds-brew"), { withDoc: true, docW: 96, docH: 54 });
    await P.settle(800);
    const T = P.mod._test, R = T.refs, vis = (n) => n.style.display !== "none";
    assert.strictEqual(R.thumbs.filter(vis).length, 12, "Classic scenes first");
    T.st.view.scenePack = "Alien"; T.changed("view"); assert.strictEqual(R.thumbs.filter(vis).length, 5);
    R.thumbs.find((c) => c.__name === "Outpost Zeta").click(); assert.strictEqual(T.st.scene.name, "Outpost Zeta");
    assert.ok(R.assetBtns.filter(vis).every((b) => b.__pack === "Fantasy"));
    const n0 = T.st.scene.objs.length; R.assetBtns.find((b) => b.__asset.id === "fantasy/pine").click();
    assert.strictEqual(T.st.scene.objs.length, n0 + 1); assert.strictEqual(T.st.sel.asset, "fantasy/pine"); assert.strictEqual(T.st.sel.vc, true);
    assert.ok(Math.abs(T.st.sel.y - T.st.sel.mesh.hy * T.st.sel.s) < 0.05, "stands on the ground");
  });

  await t("Worlds Brew 0.4: sun colour / brightness, point lights, water waves / clarity / foam all change the render", async () => {
    const r = async (s) => hash((await E.render(s, s.cam, 40, 24)).rgba);
    const base = S.loadPreset("Ocean Rock"), h0 = await r(base);
    assert.strictEqual(await r(Object.assign(S.loadPreset("Ocean Rock"), S.DEFAULTS)), h0, "defaults reproduce the 0.3 look");
    for (const [k, v] of [["sunCol", "#FF4020"], ["sunPow", 180], ["ambPow", 30], ["waveH", 0.5], ["clarity", 80], ["foam", 70], ["waterCol", "#30A060"], ["waterRefl", 20], ["wind", 120], ["ripple", 0]]) {
      const s = S.loadPreset("Ocean Rock"); if (k === "wind") s.waveH = 0.4; s[k] = v; const h = await r(s);
      assert.notStrictEqual(h, h0, k + " changes the picture");
    }
    const n = S.loadPreset("Moon Base"); assert.strictEqual(n.objs.filter((o) => o.type === "light").length, 2, "Moon Base has two lights");
    const lit = await E.render(n, n.cam, 40, 24), off = S.loadPreset("Moon Base"); off.objs = off.objs.filter((o) => o.type !== "light");
    const dark = await E.render(off, off.cam, 40, 24); let a = 0, b = 0; for (let i = 0; i < lit.rgba.length; i += 4) { a += lit.rgba[i]; b += dark.rgba[i]; }
    assert.ok(a > b * 1.05, "lights brighten the scene");
    const pink = S.loadPreset("Moon Base"); pink.objs.filter((o) => o.type === "light").forEach((o) => { o.col = "#0000FF"; });
    assert.notStrictEqual(hash((await E.render(pink, pink.cam, 40, 24)).rgba), hash(lit.rgba), "light colour matters");
    const back = S.fromJSON(S.toJSON(n)); assert.strictEqual(hash((await E.render(back, back.cam, 40, 24)).rgba), hash(lit.rgba), "lights save and load");
  });

  await t("Worlds Brew 0.4: surface shaping dials and sculpt brushes (raise, lower, smooth, flatten, roughen, restore), saved with the scene", async () => {
    const ED = require(J + "/editor.js");
    const s = S.loadPreset("Snow Peaks"), o = s.objs[0], h0 = hash((await E.render(s, s.cam, 40, 24)).rgba);
    for (const [k, v] of [["plateau", 0.4], ["sharp", 2], ["crater", true], ["terrace", 5], ["rough", 0.7], ["erosion", 4]]) {
      const c = S.loadPreset("Snow Peaks"); c.objs[0][k] = v; assert.notStrictEqual(hash((await E.render(c, c.cam, 40, 24)).rgba), h0, k + " reshapes the terrain");
    }
    const mid = () => ED.heightAt(o, 0.5, 0.5), m0 = mid();
    ED.sculpt(o, "raise", 0.5, 0.5, 0.1, 1); assert.ok(mid() > m0, "raise"); const m1 = mid();
    ED.sculpt(o, "lower", 0.5, 0.5, 0.1, 1); ED.sculpt(o, "lower", 0.5, 0.5, 0.1, 1); assert.ok(mid() < m1, "lower");
    ED.sculpt(o, "flatten", 0.5, 0.5, 0.2, 1, 0.9); assert.ok(mid() > ED.heightAt(S.obj("terrain", 0, 0, 0, 1, "Stone", { seed: o.seed, rough: o.rough, h: o.h }), 0.5, 0.5) - 1, "flatten runs");
    const before = o.sculpt.slice(); ED.sculpt(o, "roughen", 0.4, 0.4, 0.2, 1); assert.ok(o.sculpt.some((v, i) => v !== before[i]), "roughen");
    const rough = o.sculpt.slice(); ED.sculpt(o, "smooth", 0.4, 0.4, 0.2, 1); assert.ok(o.sculpt.some((v, i) => v !== rough[i]), "smooth");
    const sum = (a) => a.reduce((x, v) => x + Math.abs(v), 0), s1 = sum(o.sculpt); ED.sculpt(o, "restore", 0.5, 0.5, 0.4, 1); assert.ok(sum(o.sculpt) < s1, "restore");
    const h1 = hash((await E.render(s, s.cam, 40, 24)).rgba); assert.notStrictEqual(h1, h0, "sculpting shows in the render");
    const back = S.fromJSON(S.toJSON(s)); assert.ok(back.objs[0].sculpt instanceof Float32Array);
    assert.strictEqual(hash((await E.render(back, back.cam, 40, 24)).rgba), h1, "sculpting saves and loads");
    ED.clearSculpt(o); assert.strictEqual(hash((await E.render(s, s.cam, 40, 24)).rgba), h0, "Clear sculpting restores the shape");
    // the brush finds the terrain under the pointer
    const hit = ED.terrainHit(o, ED.screenRay(s.cam, 320, 180, 160, 100)); assert.ok(hit && hit.u > 0 && hit.u < 1 && hit.v > 0 && hit.v < 1, "ray meets terrain");
    assert.strictEqual(ED.terrainHit(o, ED.screenRay(s.cam, 320, 180, 160, 2)), null, "sky misses");
  });

  await t("Worlds Brew 0.4 panels: Shape, Light and Water tabs, Light in the Create strip, sculpting in the Viewport", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins/worlds-brew"), { withDoc: true, docW: 96, docH: 54 });
    await P.settle(800);
    const T = P.mod._test, R = T.refs, tabs = R.tabs.__tabs.items, shown = (n) => tabs.find((x) => x.title === n).btn.style.display !== "none";
    ["Shape", "Light", "Water", "Sky", "Camera"].forEach((n) => assert.ok(tabs.find((x) => x.title === n), n + " tab"));
    R.createBtns.find((b) => b.__type === "light").click(); assert.strictEqual(T.st.sel.type, "light");
    assert.ok(!shown("Shape") && shown("Light") && shown("Water"));
    R.createBtns.find((b) => b.__type === "terrain").click(); assert.ok(shown("Shape"), "Shape tab for terrains");
    const o = T.st.sel; T.onKey({ key: "b", target: P.document.body }); assert.strictEqual(T.st.view.gizmo, "sculpt");
    T.st.scene.cam = { yaw: 0, pitch: 40, dist: 14, fov: 50, tx: o.x, ty: 0, tz: o.z }; T.drawViewport();
    const img = R.vpImg, W = T.lastWire.w, H = T.lastWire.h, ev = (x, y) => ({ clientX: x, clientY: y, offsetX: x, offsetY: y, shiftKey: false, preventDefault() {}, currentTarget: img });
    img.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H });
    const m0 = require(J + "/editor.js").heightAt(o, 0.5, 0.5);
    const fire = (type, x, y) => { const e = new P.window.MouseEvent(type, { clientX: x, clientY: y, bubbles: true }); img.dispatchEvent(e); };
    fire("mousedown", W / 2, H / 2); fire("mousemove", W / 2 + 2, H / 2); fire("mouseup", W / 2 + 2, H / 2);
    assert.ok(o.sculpt && require(J + "/editor.js").heightAt(o, 0.5, 0.5) !== m0, "a drag in sculpt mode reshapes the terrain");
    assert.ok(o._undo !== undefined, "stroke can be undone");
    T.st.scene.waveH = 0.4; T.st.scene.foam = 50; T.changed("val");
    T.st.out.quality = "draft"; await T.renderNow(); assert.ok(/Rendered 96 x 54/.test(R.status.textContent), R.status.textContent);
  });
  await t("Worlds Brew 0.5 controls: drag-and-drop placing, drag to move, object and camera pads, keys, Objects list", async () => {
    const CT = require(J + "/controls.js"), ED = require(J + "/editor.js");
    // host-free: surfaces, nudges, camera moves
    const s = S.loadPreset("Snow Peaks"), ter = s.objs.find((o) => o.type === "terrain"), ball = S.obj("sphere", ter.x, 0, ter.z, 0.5, "Chrome"); s.objs.push(ball);
    CT.rest(s, ball); assert.ok(ball.y > ED.groundY(s) + 0.6, "rests on the terrain, not under it");
    const x0 = ball.x; s.cam.yaw = 0; CT.nudge(s, ball, "right", "big", true); assert.ok(Math.abs(ball.x - x0 - 2) < 1e-6, "camera-relative right");
    const y0 = ball.y; CT.nudge(s, ball, "up", "med", true); assert.ok(Math.abs(ball.y - y0 - 0.5) < 1e-6);
    CT.spin(ball, 1, "big"); assert.strictEqual(ball.ry % 45, 0); const s0 = ball.s; CT.grow(s, ball, 1, "med", false); assert.ok(ball.s > s0);
    const c = s.cam; CT.camOrbit(c, 10, 5); CT.camPan(c, 1, 1, 1); CT.camZoom(c, 0.5); CT.camView(c, "top"); assert.strictEqual(c.pitch, 89);
    CT.frame(s); assert.ok(c.dist > 2 && Number.isFinite(c.tx)); CT.frame(s, ball); assert.strictEqual(c.tx, +ball.x.toFixed(3));
    assert.strictEqual(CT.cycle(s, s.objs[s.objs.length - 1], 1), s.objs[0], "Next wraps round");
    // panel
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins/worlds-brew"), { withDoc: true, docW: 96, docH: 54 });
    await P.settle(800);
    const T = P.mod._test, R = T.refs, st = T.st;
    T.loadScene(S.loadPreset("Chrome Garden")); st.scene.cam = { yaw: 0, pitch: 35, dist: 14, fov: 50, tx: 0, ty: 0, tz: 0 }; T.drawViewport();
    const img = R.vpImg, W = T.lastWire.w, H = T.lastWire.h;
    img.getBoundingClientRect = () => ({ left: 0, top: 0, width: W, height: H });
    const ev = (target, type, x, y, shift) => { const e = new P.window.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, shiftKey: !!shift }); target.dispatchEvent(e); };
    // drag the Cube tile into the view: it lands under the pointer, on the ground
    const n0 = st.scene.objs.length, tile = R.createBtns.find((b) => b.__type === "cube");
    ev(tile, "mousedown", -50, -50); ev(img, "mousemove", W * 0.7, H * 0.6); ev(img, "mousemove", W * 0.72, H * 0.62); ev(img, "mouseup", W * 0.72, H * 0.62);
    assert.strictEqual(st.scene.objs.length, n0 + 1, "one cube dropped " + n0 + " " + JSON.stringify(st.scene.objs.map((o) => o.type)) + " carry " + !!T.carry); const cube = st.scene.objs[n0];
    assert.strictEqual(T.carry, null); assert.strictEqual(st.sel, cube); assert.ok(cube.x > 0.3, "landed right of centre, under the pointer (x " + cube.x + ")");
    assert.ok(Math.abs(cube.y - cube.s - CT.surfaceY(st.scene, cube.x, cube.z, cube)) < 0.01, "sitting on the surface");
    // a drag that ends outside the view cancels
    const asset = R.assetBtns[0]; ev(asset, "mousedown", -50, -50); ev(img, "mousemove", W / 2, H / 2); ev(asset, "mouseup", -40, -40); await new Promise((r) => setTimeout(r, 600));
    assert.strictEqual(st.scene.objs.length, n0 + 1, "drop outside the view = cancelled");
    // clicking a tile still adds in front of the camera
    asset.click(); assert.strictEqual(st.scene.objs.length, n0 + 2); assert.strictEqual(st.sel.asset, asset.__asset.id);
    // grab the cube and drag it: it follows the pointer
    T.select(cube); T.drawViewport(); const B = S.camBasis(st.scene.cam, W / H), f = (H / 2) / B.tan, px = cube.x - B.ex, py = cube.y - B.ey, pz = cube.z - B.ez, cz = px * B.fx + py * B.fy + pz * B.fz;
    const sx = W / 2 + (px * B.rx + pz * B.rz) / cz * f, sy = H / 2 - (px * B.ux + py * B.uy + pz * B.uz) / cz * f, cx0 = cube.x;
    st.view.gizmo = "rotate";   // so the move handles are not in the way
    ev(img, "mousedown", sx + 1, sy + 1); ev(img, "mousemove", sx - 30, sy + 1); ev(img, "mouseup", sx - 30, sy + 1);
    assert.ok(cube.x < cx0 - 0.3, "dragging the object moves it left (" + cx0 + " -> " + cube.x + ")"); assert.strictEqual(st.sel, cube);
    // object pad buttons (hold-repeat buttons also work as clicks)
    const btnByTitle = (re) => Array.from(P.document.querySelectorAll("#vp .wbpadbtn")).find((b) => re.test(b.getAttribute("title") || ""));
    const z0 = cube.y; btnByTitle(/^Raise/).click(); assert.ok(cube.y > z0, "Height up");
    const s1 = cube.s; btnByTitle(/^Bigger/).click(); assert.ok(cube.s > s1, "Size +");
    const cam0 = Object.assign({}, st.scene.cam); btnByTitle(/^Circle left/).click(); assert.notStrictEqual(st.scene.cam.yaw, cam0.yaw, "Orbit");
    btnByTitle(/^Move in/).click(); assert.ok(st.scene.cam.dist < cam0.dist, "Zoom in");
    // keys
    const kx = cube.x; T.onKey({ key: "ArrowRight", target: P.document.body }); assert.ok(cube.x > kx, "arrow key nudges");
    T.onKey({ key: "Tab", target: P.document.body }); assert.notStrictEqual(st.sel, cube, "Tab selects the next object");
    T.onKey({ key: "Escape", target: P.document.body }); assert.ok(!st.scene.objs.includes(st.sel), "Esc deselects");
    T.onKey({ key: "h", target: P.document.body });
    // the Objects list mirrors the scene and selects
    const chips = R.objList.querySelectorAll(".pill"); assert.strictEqual(chips.length, st.scene.objs.length);
    chips[0].click(); assert.strictEqual(st.sel, st.scene.objs[0]); assert.ok(R.objList.querySelector(".pill.on"));
    // lock camera: an empty-space drag no longer orbits
    st.view.camLock = true; const y1 = st.scene.cam.yaw; ev(img, "mousedown", 3, 3); ev(img, "mousemove", 60, 3); ev(img, "mouseup", 60, 3); assert.strictEqual(st.scene.cam.yaw, y1);
  });
  await t("Worlds Brew 0.5.1: a portrait document keeps the view and preview short so the controls stay reachable", async () => {
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins/worlds-brew"), { withDoc: true, docW: 3856, docH: 7200 });
    await P.settle(800);
    const T = P.mod._test, R = T.refs; T.drawViewport(); await T.miniRender();
    const vh = parseInt(R.vpImg.style.height, 10), vw = parseInt(R.vpImg.style.width, 10);
    assert.ok(vh <= 440, "view height " + vh); assert.ok(Math.abs(vw / vh - 3856 / 7200) < 0.05, "keeps the document shape " + vw + "x" + vh);
    assert.ok(parseInt(R.preview.style.height, 10) <= 360, "preview height " + R.preview.style.height);
  });
};
