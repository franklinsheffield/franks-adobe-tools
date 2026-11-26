"use strict";
// Pixel Scape (phase 1) tests: model importers, scene save/load, determinism, render layers, wireframe and handles.
const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
const J = path.join(ROOT, "plugins/worlds-brew/js");

module.exports = async function (t) {
  const M = require(J + "/models.js"), S = require(J + "/scene.js"), E = require(J + "/engine.js"), W = require(J + "/wire.js");
  const hash = (u8) => { let h = 2166136261; for (let i = 0; i < u8.length; i++) h = Math.imul(h ^ u8[i], 16777619); return (h >>> 0).toString(16); };

  await t("Pixel Scape: .obj import (quads, negative indices, v/vt/vn faces) normalises to a -1..1 box", () => {
    const m = M.parseOBJ("v 0 0 0\nv 4 0 0\nv 4 2 0\nv 0 2 0\nvn 0 0 1\nf 1//1 2//1 3//1 4//1\nf -4 -2 -1\n", "quad.obj");
    assert.strictEqual(m.tris, 3); assert.strictEqual(Math.max(...m.v), 1); assert.strictEqual(Math.min(...m.v), -1);
    assert.ok(Math.abs(m.hy - 0.5) < 1e-6, "half-height in normalised units");
    assert.throws(() => M.parseOBJ("v 0 0 0\n", "empty.obj"), /no faces/);
    assert.throws(() => M.parseOBJ("v 0 0 0\nf 1 2 3\n", "bad.obj"), /missing vertex/);
  });

  await t("Pixel Scape: .stl import (binary and ASCII) turns Z-up into Y-up", () => {
    const tri = [[0, 0, 0], [1, 0, 0], [0, 0, 2]], buf = new ArrayBuffer(84 + 50), dv = new DataView(buf);
    dv.setUint32(80, 1, true); tri.forEach((v, k) => v.forEach((c, j) => dv.setFloat32(84 + 12 + k * 12 + j * 4, c, true)));
    const b = M.parseSTL(buf, "t.stl"); assert.strictEqual(b.tris, 1); assert.strictEqual(b.hy, 1, "STL z (height 2) becomes y");
    const asc = "solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 0 2\nendloop\nendfacet\nendsolid\n";
    const a = M.parseSTL(new TextEncoder().encode(asc).buffer, "a.stl"); assert.deepStrictEqual(Array.from(a.v), Array.from(b.v));
  });

  await t("Pixel Scape: .glb import applies node transforms and reads uint16 indices", () => {
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

  await t("Pixel Scape: 12 built-in scenes, all render, deterministically", async () => {
    const names = Object.keys(S.PRESETS); assert.strictEqual(names.length, 12);
    for (const n of names) {
      const s = S.loadPreset(n), r1 = await E.render(s, s.cam, 48, 27), r2 = await E.render(S.loadPreset(n), s.cam, 48, 27);
      assert.strictEqual(hash(r1.rgba), hash(r2.rgba), n + " renders the same twice");
      let lo = 255, hi = 0; for (let i = 0; i < r1.rgba.length; i += 4) { lo = Math.min(lo, r1.rgba[i + 1]); hi = Math.max(hi, r1.rgba[i + 1]); }
      assert.ok(hi - lo > 25, n + " is not a flat image");
    }
  });

  await t("Pixel Scape: render layers (Render + Depth, Object mask, Sky mask) and draft/cancel", async () => {
    const s = S.loadPreset("Chrome Garden"), r = await E.render(s, s.cam, 64, 36, { passes: true });
    const L = E.layers(r, { depth: true, mask: true, sky: true });
    assert.deepStrictEqual(L.map((l) => l.name), ["Render", "Depth", "Object mask", "Sky mask"]);
    assert.ok(L.every((l) => l.rgba.length === 64 * 36 * 4));
    const ids = new Set(r.ids); assert.ok(ids.has(1), "the imported pawn (object 1) is visible"); assert.ok(ids.has(-4), "ground visible");
    const d = await E.render(s, s.cam, 64, 36, { step: 3 }); assert.strictEqual(d.rgba[0], d.rgba[4], "draft fills 3x3 blocks");
    let calls = 0; const c = await E.render(s, s.cam, 64, 36, {}, { yield: async () => { calls++; }, cancelled: () => calls > 0 });
    assert.ok(c === null || calls >= 1, "cancel stops the render");
  });

  await t("Pixel Scape: scene save/load keeps models and renders identically", async () => {
    const s = S.loadPreset("Model Showcase"), back = S.fromJSON(S.toJSON(s));
    assert.strictEqual(back.objs.filter((o) => o.type === "mesh").length, 4);
    const a = await E.render(s, s.cam, 40, 24), b = await E.render(back, back.cam, 40, 24);
    assert.strictEqual(hash(a.rgba), hash(b.rgba));
    const obj = M.exportOBJ(s.objs[0]); assert.ok(/^v /m.test(obj) && /^f /m.test(obj));
  });

  await t("Pixel Scape: wireframe, picking and move / scale / rotate handles", () => {
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

  await t("Pixel Scape: PNG reader (zlib inflate) and model colours from glTF materials", () => {
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

  await t("Pixel Scape: Fantasy (Kenney CC0) and Alien packs: 52 coloured assets and 10 maps that render", async () => {
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

  await t("Pixel Scape 0.4: sun colour / brightness, point lights, water waves / clarity / foam all change the render", async () => {
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

  await t("Pixel Scape 0.4: surface shaping dials and sculpt brushes (raise, lower, smooth, flatten, roughen, restore), saved with the scene", async () => {
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

  await t("Pixel Scape Bridge: shared folder format (render + passes + info, latest written last, document size, pictures, cover resize)", async () => {
    const B = require(J + "/bridge.js"), os = require("os"), fs = require("fs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "wbb-")), fsp = fs.promises;
    const io = { read: async (p) => new Uint8Array(await fsp.readFile(p)), readText: (p) => fsp.readFile(p, "utf8"), write: (p, d) => fsp.writeFile(p, typeof d === "string" ? d : Buffer.from(d)), mkdir: (p) => fsp.mkdir(p, { recursive: true }), list: (p) => fsp.readdir(p), stat: async () => null };
    assert.strictEqual(await B.readLatest(io, root), null, "nothing yet");
    const r = await B.writeRender(io, root, { scene: "Snow Peaks / test!", w: 4, h: 2, engine: "gpu", quality: "draft", date: new Date(2026, 10, 24, 9, 5, 7) }, [{ key: "render", png: new Uint8Array([1, 2, 3]) }, { key: "depth", png: new Uint8Array([4]) }]);
    assert.strictEqual(r.folder, "20261124-090507-Snow Peaks test");
    assert.ok(fs.existsSync(path.join(r.dir, "render.png")) && fs.existsSync(path.join(r.dir, "depth.png")) && !fs.existsSync(path.join(r.dir, "sky.png")));
    const L = await B.readLatest(io, root); assert.deepStrictEqual(L.info.passes, ["render", "depth"]); assert.strictEqual(L.info.w, 4);
    assert.strictEqual(B.groupName("Snow Peaks"), "Pixel Scape - Snow Peaks");
    await B.writeDocSize(io, root, { w: 3000, h: 2000, ppi: 300, doc: "poster.psd" }); assert.deepStrictEqual([(await B.readDocSize(io, root)).w, (await B.readDocSize(io, root)).doc], [3000, "poster.psd"]);
    const pic = await B.writePicture(io, root, { name: "Brick wall", w: 1, h: 1 }, new Uint8Array([9])); assert.ok(fs.existsSync((await B.readPicture(io, root)).path) && pic.name === "Brick wall");
    // cover resize: same size is untouched, a 2:1 picture into a square keeps the middle
    const src = new Uint8Array([10, 0, 0, 255, 20, 0, 0, 255, 30, 0, 0, 255, 40, 0, 0, 255]);
    assert.strictEqual(B.coverResize(src, 2, 2, 2, 2), src);
    const wide = new Uint8Array(4 * 1 * 4); [0, 100, 200, 250].forEach((v, i) => { wide[i * 4] = v; wide[i * 4 + 3] = 255; });
    const sq = B.coverResize(wide, 4, 1, 2, 2); assert.ok(sq[0] >= 100 && sq[4] <= 200, "middle kept: " + sq[0] + "," + sq[4]);
    fs.rmSync(root, { recursive: true, force: true });
  });

  await t("Pixel Scape Bridge panel: sees a new render, Place as layer (group, hidden passes, document size, one undo), Match document size, Send layer", async () => {
    const B = require(J + "/bridge.js"), PNG = require(path.join(ROOT, "shared/png.js")), os = require("os"), fs = require("fs");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "wbb-")), fsp = fs.promises;
    const io = { read: async (p) => new Uint8Array(await fsp.readFile(p)), readText: (p) => fsp.readFile(p, "utf8"), write: (p, d) => fsp.writeFile(p, typeof d === "string" ? d : Buffer.from(d)), mkdir: (p) => fsp.mkdir(p, { recursive: true }) };
    const { loadPanel } = require("./harness.js");
    const P = await loadPanel(path.join(ROOT, "plugins/worlds-brew"), { withDoc: true, docW: 96, docH: 54 }), T = P.mod._test;
    try {
      T.setRoot(root); await T.poll();
      assert.ok(P.document.querySelector(".apply").hasAttribute("disabled"), "nothing to place yet");
      const px = (w, h, v) => PNG.encodePNG(new Uint8Array(w * h * 4).fill(v), w, h, 4);
      await B.writeRender(io, root, { scene: "Chrome Garden", w: 48, h: 27, engine: "gpu", quality: "final" }, [{ key: "render", png: px(48, 27, 200) }, { key: "depth", png: px(48, 27, 90) }, { key: "mask", png: px(48, 27, 30) }, { key: "sky", png: px(48, 27, 255) }]);
      await T.poll();
      assert.ok(T.latest && /Chrome Garden/.test(T.refs.info.textContent) && /48 x 27/.test(T.refs.info.textContent), T.refs.info.textContent);
      assert.ok(!P.document.querySelector(".apply").hasAttribute("disabled") && /^data:image\/png/.test(T.refs.thumb.src));
      const calls = P.host.calls; calls.length = 0;
      await T.place();
      assert.deepStrictEqual(calls.filter((c) => c[0] === "createPixelLayer").map((c) => c[1]), ["Render", "Depth", "Object mask", "Sky mask"]);
      assert.deepStrictEqual(calls.find((c) => c[0] === "createLayerGroup"), ["createLayerGroup", "Pixel Scape - Chrome Garden", 4]);
      assert.ok(calls.filter((c) => c[0] === "putPixels").every((c) => c[3] === 96 * 54 * 4), "scaled to the 96 x 54 document");
      assert.strictEqual(calls.filter((c) => c[0] === "suspendHistory").length, 1, "one undo step");
      assert.ok(/scaled from 48 x 27/.test(T.refs.status.textContent), T.refs.status.textContent);
      assert.deepStrictEqual(P.host.doc.layers.filter((L) => L.name !== "Render").map((L) => L.visible), [false, false, false], "passes hidden");
      T.st.place.passes = false; calls.length = 0; await T.place();
      assert.deepStrictEqual(calls.filter((c) => c[0] === "createPixelLayer").map((c) => c[1]), ["Render"], "passes can be left out");
      await T.matchSize(); const ds = JSON.parse(fs.readFileSync(path.join(root, "Bridge/doc-size.json"), "utf8")); assert.deepStrictEqual([ds.w, ds.h, ds.doc], [96, 54, "test.psd"]);
      P.host.doc.activeLayers.push({ id: 5, name: "Brick wall", bounds: { left: 0, top: 0, right: 20, bottom: 10 } });
      await T.sendLayer(); const pj = JSON.parse(fs.readFileSync(path.join(root, "Bridge/picture.json"), "utf8"));
      assert.strictEqual(pj.name, "Brick wall"); const dec = require(J + "/pngdec.js").decodePNG(new Uint8Array(fs.readFileSync(path.join(root, "Bridge/Pictures", pj.file)))); assert.ok(dec.w > 0 && dec.h > 0, "a real PNG");
    } finally { T.stop(); fs.rmSync(root, { recursive: true, force: true }); }
  });

};
