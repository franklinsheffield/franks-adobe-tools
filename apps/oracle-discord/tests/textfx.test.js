import { test } from "node:test";
import assert from "node:assert/strict";
import { textFxPlan, textFxHtml, tailRange } from "../activity/src/textfx.js";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const always = () => 0, never = () => 1;
test("bold words always pop; mood picks the effect", () => {
  const p = textFxPlan("The **Tower** falls.", "", never); assert.equal(p.fx, "pop"); assert.deepEqual(p.ranges, [[4, 9]]);
  assert.equal(textFxPlan("Stop that!!", "", always).fx, "shake"); assert.equal(textFxPlan("So sleepy…", "", always).fx, "wave");
  assert.ok(textFxPlan("So sleepy…", "", always).slow); assert.equal(textFxPlan("hahaha, good one", "", always).fx, "bounce");
  assert.equal(textFxPlan("Look at that!", "", always).fx, "pop"); assert.equal(textFxPlan("A plain line.", "", always), null);
  assert.equal(textFxPlan("Stop that!!", "", never), null, "only sometimes");
  assert.equal(textFxPlan("A plain line.", "angry", always).fx, "shake");
});
test("the moving words are the tail of the line, and the HTML keeps the text", () => {
  const t = "The stars are lining up for you"; const [s, e] = tailRange(t, "pop"); assert.ok(t.slice(s, e).endsWith("for you"));
  const h = textFxHtml("Say <b> **hi**", { fx: "pop", ranges: [[9, 11]] }, esc); assert.ok(h.includes("&lt;b&gt;")); assert.equal(h.replace(/<[^>]+>/g, ""), esc("Say <b> **hi**").replace(/<[^>]+>/g, ""));
  assert.equal((h.match(/class="tx"/g) || []).length, 2);
});
test("Roman numerals and abbreviations are not shouting", () => {
  assert.equal(textFxPlan("Card XVI, the Tower.", "", always), null); assert.equal(textFxPlan("Your DNA says so.", "", always), null);
  assert.equal(textFxPlan("That is NOT how it works.", "", always).fx, "shake");
});
