"use strict";
const test = require("node:test"), assert = require("node:assert");
const { terrainGLB } = require("../src/glb");
test("glb is valid binary glTF with terrain + skirt", () => {
  const G = 16, h = new Float32Array(G * G).map((_, i) => 100 + (i % G) * 3);
  const glb = terrainGLB({ h, grid: G, widthM: 1000, depthM: 1000, jpeg: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) });
  assert.strictEqual(glb.readUInt32LE(0), 0x46546c67); assert.strictEqual(glb.readUInt32LE(4), 2); assert.strictEqual(glb.readUInt32LE(8), glb.length);
  const jl = glb.readUInt32LE(12), j = JSON.parse(glb.slice(20, 20 + jl).toString());
  assert.strictEqual(j.meshes[0].primitives.length, 2);
  assert.strictEqual(j.accessors[0].count, G * G);
  assert.strictEqual(j.nodes[0].extras.minElevationM, 100);
  const binLen = glb.readUInt32LE(20 + jl); assert.strictEqual(binLen, j.buffers[0].byteLength);
  for (const v of j.bufferViews) assert.ok(v.byteOffset + v.byteLength <= binLen && v.byteOffset % 4 === 0);
});
