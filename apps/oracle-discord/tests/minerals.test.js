// Mineral Cabinet (activity/src/minerals): real mineral data, tests, chips, drawers, flame link, daily, shelf.
import test from "node:test";
import assert from "node:assert/strict";
import { MINERALS, CLASSES, LEVELS, TESTS, TOOLS, mineral, testResult } from "../activity/src/minerals/data.js";
import { start, runTest, name, scoreOf, settle, perfect, optionsFor, nextOf, dailyOf, room, testsFor, foundMinerals, elementsFound, CHIPS, OPTIONS } from "../activity/src/minerals/logic.js";
import { SHOP, SLOTS, buyOrUse, hasUv } from "../activity/src/minerals/shop.js";
import { cabinetSvg } from "../activity/src/minerals/scene.js";
import { drawersHtml, cardHtml, mineralsCodex } from "../activity/src/minerals/room.js";
import { SAMPLES } from "../activity/src/flametest/data.js";
import { TROPHIES } from "../activity/src/trophies.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("40 real minerals, well formed, split across 3 levels", () => {
  assert.equal(MINERALS.length, 40); assert.equal(new Set(MINERALS.map((m) => m.id)).size, 40);
  const lv = LEVELS.flatMap((L) => L.pool); assert.equal(new Set(lv).size, 40);
  const flames = new Set([...SAMPLES.map((s) => s.id), "pb", "s"]);
  for (const m of MINERALS) {
    assert.ok(CLASSES.some(([k]) => k === m.cls), m.id); assert.ok(m.hard >= 1 && m.hard <= 10); assert.ok(m.sg > 1 && m.sg < 25);
    assert.ok(["yes", "no", "powder"].includes(m.fizz) && ["yes", "no", "weak"].includes(m.mag)); assert.ok(m.flame === null || flames.has(m.flame), m.id + " flame");
    assert.ok(m.fact.length > 40 && m.el.length && m.f); m.c.forEach((c) => assert.match(c, /^#[0-9a-f]{6}$/i));
    if (m.fizz !== "no") assert.equal(m.cls, "carbonate", m.id + ": only carbonates fizz");
  }
  // classic textbook values
  assert.equal(mineral("talc").hard, 1); assert.equal(mineral("corundum").hard, 9); assert.equal(mineral("quartz").hard, 7);
  assert.equal(mineral("hematite").streak, "red-brown"); assert.equal(mineral("magnetite").mag, "yes"); assert.equal(mineral("halite").flame, "na");
  assert.equal(mineral("celestine").flame, "sr"); assert.equal(mineral("malachite").flame, "cu"); assert.equal(mineral("lepidolite").flame, "li"); assert.equal(mineral("sylvite").flame, "k");
});

test("test results read like a field notebook", () => {
  assert.match(testResult(mineral("calcite"), "acid"), /fizzes at once/); assert.match(testResult(mineral("dolomite"), "acid"), /powder fizzes/);
  assert.match(testResult(mineral("magnetite"), "magnet"), /snaps/); assert.match(testResult(mineral("halite"), "flame", () => "yellow"), /yellow/);
  assert.match(testResult(mineral("galena"), "flame"), /pale/); assert.match(testResult(mineral("quartz"), "flame"), /No useful colour/);
  const s = testResult(mineral("calcite"), "scratch"); assert.match(s, /Fingernail \(2.5\): no mark/); assert.match(s, /Copper coin \(3.5\): scratches it/);
  assert.match(testResult(mineral("fluorite"), "uv"), /blue-violet/); assert.equal(TOOLS.length, 4); assert.ok(Object.keys(TESTS).length === 8);
});

test("chips: tests and wrong names cost one; score is chips left + 1 times the multiplier", () => {
  const p = {}, L = LEVELS[1], run = start(L, "malachite");
  assert.equal(run.options.length, OPTIONS); assert.ok(run.options.includes("malachite")); assert.equal(new Set(run.options).size, OPTIONS);
  assert.ok(runTest(run, "acid")); assert.ok(!runTest(run, "acid"), "a test runs once"); assert.ok(!runTest(run, "uv"), "UV needs the lamp below Level 3");
  assert.ok(testsFor(start(L, "malachite", { uv: true })).includes("uv"));
  assert.equal(name(run, run.options.find((x) => x !== "malachite")), "wrong"); assert.equal(name(run, "malachite"), "right");
  assert.equal(run.chips, CHIPS - 2); assert.equal(scoreOf(run), Math.round((CHIPS - 1) * 1.5)); assert.ok(!perfect(run));
  const r = settle(p, run); assert.ok(r.first && r.essence >= 5); assert.deepEqual(foundMinerals(p), ["malachite"]); assert.ok(elementsFound(p).includes("Cu"));
  const out = start(LEVELS[0], "quartz"); for (const id of out.options.filter((x) => x !== "quartz")) { if (name(out, id) === "out") break; } assert.ok(out.done && !out.won);
  assert.ok(!room(p).found.includes("quartz"));
});

test("next, options, daily", () => {
  const p = {}; room(p).found = LEVELS[0].pool.slice(0, 11); assert.equal(nextOf(p, LEVELS[0]), LEVELS[0].pool[11], "unnamed rocks come first");
  assert.ok(optionsFor("pyrite", LEVELS[0]).includes("pyrite"));
  assert.deepEqual(dailyOf("2026-12-02"), dailyOf("2026-12-02")); assert.ok(dailyOf("2026-12-02").L.pool.includes(dailyOf("2026-12-02").id));
});

test("shelf, drawings, drawers, trophy", () => {
  for (const [k] of SLOTS) assert.ok(SHOP.some((s) => s.slot === k && s.price === 0));
  const p = { essence: 200 }; assert.ok(!hasUv(p)); assert.equal(buyOrUse(p, "mc-uv"), "bought"); assert.ok(hasUv(p));
  for (const t of [null, "scratch", "streak", "magnet", "acid", "heft", "uv", "flame", "scope"]) assert.match(cabinetSvg(mineral("fluorite"), { look: { lens: "mc-brass", case: "mc-museum", lamp: "mc-uv" }, test: t }), /^<svg/);
  room(p).found.push("halite"); room(p).flamed.push("halite");
  assert.match(drawersHtml(p, esc), /Halite/); assert.match(cardHtml(mineral("halite"), esc), /NaCl/); assert.match(mineralsCodex(p, esc), /1 \/ 40/);
  assert.ok(TROPHIES.some((t) => t.id === "minerals" && t.art === "geode"));
});
