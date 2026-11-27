// Discovery Bench (activity/src/bench): recipes are well formed and reachable, minerals unlock branches, daily, shelf.
import test from "node:test";
import assert from "node:assert/strict";
import { BASE, RAW, RECIPES, PRODUCTS, OPS } from "../activity/src/bench/data.js";
import { attempt, shelf, item, room, within, dailyOf, milestoneAt, hintFor, NEEDED_MINERALS, MILESTONES } from "../activity/src/bench/logic.js";
import { SHOP, SLOTS, buyOrUse } from "../activity/src/bench/shop.js";
import { benchSvg } from "../activity/src/bench/scene.js";
import { notebookHtml, benchCodex } from "../activity/src/bench/room.js";
import { MINERALS, mineral } from "../activity/src/minerals/data.js";
import { room as mcRoom } from "../activity/src/minerals/logic.js";
import { TROPHIES } from "../activity/src/trophies.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("every recipe uses known ingredients and a real operation, with no clashes, and every product can be reached", () => {
  const known = new Set([...BASE, ...RAW, ...PRODUCTS].map((x) => x.id));
  const keys = new Set();
  for (const r of RECIPES) {
    assert.ok(OPS[r.op], r.id); assert.ok(r.in.length >= 1 && r.in.length <= 3); assert.ok(r.eq && r.note.length > 20 && r.f, r.id);
    for (const i of r.in) assert.ok(known.has(i) || mineral(i), `${r.id} uses ${i}`);
    const k = [...r.in].sort().join("+") + "|" + r.op; assert.ok(!keys.has(k), "two recipes share " + k); keys.add(k);
    if (r.hz) assert.ok(["gas", "boom", "burn"].includes(r.hz.kind) && r.hz.what);
  }
  const have = new Set([...BASE, ...RAW, ...MINERALS].map((x) => x.id)); let grew = true;
  while (grew) { grew = false; for (const r of RECIPES) if (!have.has(r.id) && r.in.every((i) => have.has(i))) { have.add(r.id); grew = true; } }
  assert.deepEqual(PRODUCTS.filter((p) => !have.has(p.id)).map((p) => p.id), []);
  assert.ok(PRODUCTS.length >= 60); assert.ok(NEEDED_MINERALS.length >= 25);
});

test("minerals named in the Cabinet join the shelf and unlock new branches", () => {
  const p = {}; assert.ok(!shelf(p).includes("malachite")); assert.ok(!within(p).some((r) => r.in.includes("malachite")));
  assert.match(hintFor("malachite"), /fizzes in acid/);
  mcRoom(p).found.push("malachite"); assert.ok(shelf(p).includes("malachite")); assert.equal(item("malachite").kind, "mineral");
  let r = attempt(p, ["malachite"], "heat"); assert.equal(r.recipe.id, "cuo"); assert.ok(r.fresh);
  r = attempt(p, ["charcoal", "cuo"], "smelt"); assert.equal(r.recipe.id, "cu"); assert.ok(shelf(p).includes("cu"));
  r = attempt(p, ["cuo", "charcoal"], "smelt"); assert.ok(!r.fresh, "order doesn't matter, and a repeat isn't new");
  assert.equal(attempt(p, ["malachite"], "grind").recipe.id, "mgreen");
  assert.equal(attempt(p, ["malachite"], "electro").why, "op"); assert.equal(attempt(p, ["saltpetre"], "mix").why, "more"); assert.equal(attempt(p, ["water"], "burn").why, "nothing");
  assert.equal(room(p).made.length, 3);
});

test("milestones, daily, shelf, drawing, notebook, trophy", () => {
  assert.equal(milestoneAt(MILESTONES[0]), 1); assert.equal(milestoneAt(MILESTONES[2]), 3); assert.equal(milestoneAt(11), 0);
  const d = dailyOf("2026-12-03"); assert.deepEqual(d, dailyOf("2026-12-03")); assert.ok(d.recipe.in.filter((i) => mineral(i)).length <= 1);
  for (const [k] of SLOTS) assert.ok(SHOP.some((s) => s.slot === k && s.price === 0));
  const p = { essence: 100 }; assert.equal(buyOrUse(p, "db-graphite"), "bought"); assert.equal(buyOrUse(p, "db-platinum"), "poor");
  for (const op of [null, ...Object.keys(OPS)]) assert.match(benchSvg({ items: [item("charcoal"), item("water")], op, result: op ? "Thing" : null, hz: { kind: "gas" } }), /^<svg/);
  room(p).made.push("soap"); assert.match(notebookHtml(p, esc), /Soap/); assert.match(benchCodex(p, esc), /1 \//);
  assert.ok(TROPHIES.some((t) => t.id === "bench" && t.art === "crucible"));
});
