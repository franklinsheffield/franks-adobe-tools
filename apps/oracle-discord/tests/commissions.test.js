import { test } from "node:test";
import assert from "node:assert/strict";
import { JOBS, TIERS, job } from "../activity/src/commissions/data.js";
import { room, jobsOf, statusOf, deliver, repOf, rankOf, doneToday } from "../activity/src/commissions/logic.js";
import { RECIPES, PRODUCTS } from "../activity/src/bench/data.js";
import { SHOP, buyOrUse, lookOf } from "../activity/src/commissions/shop.js";
import { boardSvg } from "../activity/src/commissions/scene.js";
import * as bot from "../src/modules/commission/index.js";

test("every job asks for a real Bench product, ids unique, each tier has enough jobs", () => {
  assert.equal(new Set(JOBS.map((j) => j.id)).size, JOBS.length);
  for (const j of JOBS) { assert.ok(PRODUCTS.some((p) => p.id === j.wants) && RECIPES.some((r) => r.id === j.wants), j.id); assert.ok(j.why.length > 40 && j.ask.length > 10, j.id); }
  for (const t of TIERS) assert.ok(JOBS.filter((j) => j.tier === t.n).length >= 8, t.name);
});
test("three shared jobs a day, one per tier, the same for everyone and changing by day", () => {
  const a = jobsOf("2026-11-27"); assert.deepEqual(a.map((j) => j.tier), [1, 2, 3]); assert.deepEqual(jobsOf("2026-11-27"), a);
  const days = Array.from({ length: 20 }, (_, i) => jobsOf(`2026-12-${String(i + 1).padStart(2, "0")}`).map((j) => j.id).join());
  assert.ok(new Set(days).size > 10);
});
test("deliver: needs the product and the reputation; pays once a day; reputation climbs the ladder", () => {
  const day = "2026-11-27", [v, g, r] = jobsOf(day), p = { rooms: { bench: { made: [] } } };
  assert.equal(statusOf(p, v, day), "missing"); assert.equal(statusOf(p, g, day), "locked");
  assert.equal(deliver(p, v.id, day).why, "missing");
  p.rooms.bench.made.push(v.wants, g.wants, r.wants);
  const d = deliver(p, v.id, day); assert.ok(d.ok); assert.equal(d.pay, 8); assert.equal(d.stones, 1); assert.equal(repOf(p), 1);
  assert.equal(deliver(p, v.id, day).why, "done"); assert.equal(d.allDone, true); // Guild and Royal still locked
  room(p).rep = 5; assert.equal(rankOf(p).name, "Guild"); const g2 = deliver(p, g.id, day); assert.ok(g2.ok); assert.equal(g2.allDone, true);
  room(p).rep = 15; const r2 = deliver(p, r.id, day); assert.ok(r2.ok && r2.allDone); assert.equal(doneToday(p, day).length, 3);
  const off = JOBS.find((j) => !jobsOf(day).some((x) => x.id === j.id)); assert.equal(deliver(p, off.id, day).why, "gone");
});
test("shelf, scene and the /commission card", async () => {
  assert.ok(SHOP.every((s) => s.id.startsWith("cm-"))); const p = { essence: 500 };
  assert.equal(buyOrUse(p, "cm-gold"), "bought"); assert.equal(lookOf(p).seal, "cm-gold");
  assert.match(boardSvg({ jobs: jobsOf("2026-11-27").map((j) => ({ ...j, state: "done" })) }), /DELIVERED/);
  const r = await bot.run({}, { now: new Date("2026-11-27T12:00:00Z") });
  assert.equal(bot.command.name, "commission"); assert.equal(r.embeds[0].fields.length, 5); assert.match(r.embeds[0].title, /27\/11\/2026/);
  assert.ok(r.embeds[0].fields.every((f) => f.value.length <= 1024));
});
