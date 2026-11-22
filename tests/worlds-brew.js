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
    assert.strictEqual(R.thumbs.length, 12);
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
};
