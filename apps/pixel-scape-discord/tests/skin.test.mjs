import test from "node:test";
import assert from "node:assert";
import { createRequire } from "node:module";
import { libTarget } from "../activity/worker.mjs";
const require = createRequire(import.meta.url);
const SKIN = require("../../../plugins/worlds-brew/js/skin.js");
const M = require("../../../plugins/worlds-brew/js/models.js");

// the web skin editor's share-link encoding (base64url JSON)
const code = (o) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const link = (o) => "https://web-pipeline-kit.vercel.app/models/editor?s=" + code(o);

// two triangles, one per material, with UVs, as an embedded .gltf
function gltf() {
  const pos = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 0]), uv = new Float32Array([0, 0, 1, 0, 0, 1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.2]);
  const bin = Buffer.concat([Buffer.from(pos.buffer), Buffer.from(uv.buffer)]);
  const acc = (bv, off, count, type) => ({ bufferView: bv, byteOffset: off, componentType: 5126, count, type });
  return JSON.stringify({
    asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 2 }, material: 0 }, { attributes: { POSITION: 1, TEXCOORD_0: 3 }, material: 1 }] }],
    materials: [{ name: "wood", pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }, { name: "fabric", pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }],
    accessors: [acc(0, 0, 3, "VEC3"), acc(0, 36, 3, "VEC3"), acc(1, 0, 3, "VEC2"), acc(1, 24, 3, "VEC2")],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 72 }, { buffer: 0, byteOffset: 72, byteLength: 48 }],
    buffers: [{ byteLength: bin.length, uri: "data:application/octet-stream;base64," + bin.toString("base64") }],
  });
}

test("skin links parse from a full URL, a bare code or ?model=, and junk is refused", () => {
  const r = SKIN.parseSkinLink(link({ m: "damask-chair", h: "x", e: { 0: { color: "#ff0000" }, bad: { color: "#000000" } } }));
  assert.strictEqual(r.m, "damask-chair"); assert.deepStrictEqual(Object.keys(r.e), ["0"]);
  assert.strictEqual(SKIN.parseSkinLink(code({ m: "toy-car", e: {} })).m, "toy-car");
  assert.strictEqual(SKIN.parseSkinLink("https://web-pipeline-kit.vercel.app/models/editor?model=sneaker").m, "sneaker");
  for (const bad of ["", "hello world", link({ m: "../etc" }), "https://x/?s=!!!"]) assert.strictEqual(SKIN.parseSkinLink(bad), null, bad);
  assert.deepStrictEqual(SKIN.textureIds({ e: { 0: { tex: "ambientcg-wood001" }, 1: { tex: "ambientcg-wood001" }, 2: { tex: "" } } }), ["ambientcg-wood001"]);
});

test("a skin bakes colour, texture (with tiling) and hidden surfaces into the model's triangle colours", () => {
  const plain = M.parseGLTF(gltf(), "t.gltf");
  assert.deepStrictEqual(Array.from(plain.tc), [255, 255, 255, 255, 255, 255]);
  // a 2x2 picture: red, green / blue, white
  const pic = { w: 2, h: 2, rgba: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]) };
  const recipe = SKIN.parseSkinLink(link({ m: "x", e: { 0: { color: "#00ff00" }, 1: { tex: "t1", tile: 1 } } })), decoded = {};
  const m = M.parseGLTF(gltf(), "t.gltf", { editJson: SKIN.editJson(recipe, { t1: pic }, decoded), decoded });
  assert.deepStrictEqual(Array.from(m.tc.slice(0, 3)), [0, 255, 0]);   // colour
  assert.deepStrictEqual(Array.from(m.tc.slice(3, 6)), [255, 0, 0]);   // texture sampled at the triangle centre (u,v ~0.13)
  const tiled = M.parseGLTF(gltf(), "t.gltf", { editJson: SKIN.editJson({ e: { 1: { tex: "t1", tile: 4 } } }, { t1: pic }, {}), decoded: {} });
  assert.notDeepStrictEqual(Array.from(tiled.tc.slice(3, 6)), [255, 0, 0]);   // 4x tiling lands on another texel
  const hid = M.parseGLTF(gltf(), "t.gltf", { editJson: SKIN.editJson({ e: { 0: { hidden: true } } }, {}, {}) });
  assert.strictEqual(hid.tris, 1);
  const miss = M.parseGLTF(gltf(), "t.gltf", { editJson: SKIN.editJson({ e: { 1: { tex: "gone" } } }, {}, {}), decoded: {} });
  assert.deepStrictEqual(Array.from(miss.tc.slice(3, 6)), [255, 255, 255]);   // unreachable texture: colour kept
});

test("the object's material preset follows the skin's finishes and glow", () => {
  assert.strictEqual(SKIN.preset({ e: {} }), "Matte");
  assert.strictEqual(SKIN.preset({ e: { 0: { finish: "chrome" }, 1: { finish: "brushed-steel" }, 2: { color: "#ffffff" } } }), "Chrome");
  assert.strictEqual(SKIN.preset({ e: { 0: { glow: "#ff00aa" }, 1: { glow: "#00ffaa", hidden: false } } }), "Neon");
  assert.strictEqual(SKIN.preset({ e: { 0: { glow: "#ff00aa" }, 1: { color: "#123456" } } }), "Matte");
});

test("the Activity proxies library texture colour maps only", () => {
  assert.strictEqual(libTarget("/api/lib/tex/ambientcg-asphalt023s/color.webp").url, "https://raw.githubusercontent.com/franklinsheffield/web-pipeline-assets/main/textures/ambientcg-asphalt023s/color.webp");
  for (const bad of ["/api/lib/tex/../x/color.webp", "/api/lib/tex/a/normal.webp", "/api/lib/tex/a/b/color.webp", "/api/lib/tex/a/color.png"]) assert.strictEqual(libTarget(bad), null, bad);
});
