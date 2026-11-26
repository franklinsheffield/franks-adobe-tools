"use strict";
const test = require("node:test"), assert = require("node:assert");
const G = require("../src/geo");
test("parseCoords", () => {
  assert.deepStrictEqual(G.parseCoords("36.1, -112.11").lat, 36.1);
  assert.strictEqual(G.parseCoords("-33.9 151.2").lon, 151.2);
  assert.strictEqual(G.parseCoords("Grand Canyon"), null);
  assert.strictEqual(G.parseCoords("95, 10"), null);
});
test("box is square on the ground", () => {
  const b = G.box(36.1, -112.11, 10);
  assert.ok(Math.abs(b.widthM - 10000) < 1 && Math.abs(b.depthM - 10000) < 1);
  assert.ok(b.bbox[0] < -112.11 && b.bbox[2] > -112.11 && b.bbox[1] < 36.1 && b.bbox[3] > 36.1);
});
test("dem zoom stays within 16 tiles", () => {
  for (const s of [1, 10, 40]) { const b = G.box(46.8, -121.7, s), z = G.demZoom(b, 256); assert.ok(G.tileCount(b, z) <= 16, s + "km z" + z); }
});
