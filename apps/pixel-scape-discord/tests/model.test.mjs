import test from "node:test";
import assert from "node:assert";
import * as L from "../src/models.mjs";
import { modelCommand, modelInteraction } from "../worker/model.mjs";
import { COMMANDS } from "../worker/index.mjs";
const cmd = (name, o) => ({ type: 2, data: { name: "model", options: [{ name, options: Object.entries(o).map(([k, value]) => ({ name: k, value })) }] } });

test("the 3D library index loads and every row is usable", () => {
  assert.ok(L.MODELS.length > 1000);
  for (const m of L.MODELS) { assert.match(m.file, /^[\w-]+\/[\w.-]+\.glb$/); assert.match(m.thumb, /^\/[\w/.-]+\.webp$/); assert.ok(!/\b(NC|ND|SA)\b/.test(m.license), m.id + " " + m.license); }
  assert.ok(L.get(L.MODELS[0].id));
});
test("search needs every word and ranks name hits first", () => {
  const r = L.search("pine tree", {}, 5); assert.ok(r.total >= r.items.length && r.items.length > 0);
  r.items.forEach((m) => assert.match(m.name.toLowerCase(), /pine/));
  const f = L.search("tree", { category: "plants", style: "low-poly" }, 50); f.items.forEach((m) => { assert.strictEqual(m.category, "plants"); assert.strictEqual(m.style, "low-poly"); });
  assert.strictEqual(L.search("zzzqqq").total, 0);
});
test("/model is registered with valid Discord limits", () => {
  assert.ok(COMMANDS.some((c) => c.name === "model"));
  for (const s of modelCommand.options) { assert.ok(s.description.length <= 100); for (const o of s.options || []) { assert.ok(o.description.length <= 100); assert.ok(!o.choices || o.choices.length <= 25); } }
  assert.ok(modelCommand.description.length <= 100);
});
test("/model find, show and random answer with embeds and links", () => {
  const f = modelInteraction(cmd("find", { query: "chair" }), {});
  assert.strictEqual(f.type, 4); assert.ok(f.data.embeds.length >= 1 && f.data.embeds.length <= 5);
  assert.match(f.data.embeds[0].url, /^https:\/\/raw\.githubusercontent\.com\/franklinsheffield\/web-pipeline-assets\/main\/models\//);
  const id = L.MODELS.find((m) => m.attribution).id, s = modelInteraction(cmd("show", { model: id }), {});
  assert.match(s.data.embeds[0].footer.text, / by /); assert.ok(s.data.embeds[0].image.url.startsWith(L.SITE));
  const r = modelInteraction(cmd("random", { category: "vehicles" }), {}, () => 0.5);
  assert.match(r.data.embeds[0].description, /^vehicles/); assert.strictEqual(r.data.components[0].components[2].custom_id, "model:rnd:vehicles::");
  const again = modelInteraction({ type: 3, data: { custom_id: "model:rnd:vehicles::" } }, {}, () => 0.1); assert.match(again.data.embeds[0].description, /^vehicles/);
  assert.strictEqual(modelInteraction(cmd("find", { query: "zzzqqq" }), {}).data.flags, 64);
});
test("autocomplete suggests models and vibes", () => {
  const a = modelInteraction({ type: 4, data: { name: "model", options: [{ name: "show", options: [{ name: "model", value: "rocket", focused: true }] }] } }, {});
  assert.strictEqual(a.type, 8); assert.ok(a.data.choices.length > 0 && a.data.choices.length <= 25); assert.ok(L.get(a.data.choices[0].value));
  const v = modelInteraction({ type: 4, data: { name: "model", options: [{ name: "random", options: [{ name: "vibe", value: "cos", focused: true }] }] } }, {});
  assert.ok(v.data.choices.some((c) => c.value === "cosmic"));
});
