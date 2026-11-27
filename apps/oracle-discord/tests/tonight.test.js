// /tonight (src/modules/tonight): the Observatory's bot command. Real sky over a listed city, city only.
import test from "node:test";
import assert from "node:assert/strict";
import { MODULES } from "../src/registry.js";
import * as T from "../src/modules/tonight/index.js";

const fits = (embeds) => embeds.every((e) => (e.title || "").length <= 256 && (e.description || "").length <= 4096 && e.fields.length <= 25 && e.fields.every((f) => f.name.length <= 256 && f.value.length <= 1024));

test("/tonight finds listed cities only, forgivingly", () => {
  assert.ok(MODULES.includes("tonight")); assert.equal(T.command.name, "tonight");
  assert.equal(T.findCity("phoenix").name, "Phoenix"); assert.equal(T.findCity("  NEW york ").name, "New York"); assert.equal(T.findCity("reykjavik").name, "Reykjavík");
  assert.equal(T.findCity("Atlantis"), null); assert.equal(T.findCity(""), null);
});

test("/tonight shows the real sky: Geminids, Polaris from the north only, the Night Watch's own target", async () => {
  const syd = T.tonightOver(T.findCity("Sydney"), Date.parse("2026-12-14T11:00:00Z"));
  assert.equal(syd.shower, "Geminids"); assert.ok(!syd.up.some((o) => o.t.id === "polaris"));
  const lon = T.tonightOver(T.findCity("London"), Date.parse("2026-12-15T22:00:00Z"));
  assert.ok(lon.up.some((o) => o.t.id === "polaris")); assert.ok(lon.target && lon.target.alt >= 15);
  for (const p of lon.planets) assert.ok(p.see && p.alt > 3, p.p.id);
  const r = await T.run({ city: "Sydney", private: true }, { now: new Date("2026-12-14T11:00:00Z") });
  assert.ok(fits(r.embeds)); assert.equal(r.ephemeral, true); assert.ok(r.files[0].data.length > 10000); assert.ok(r.embeds[0].fields.some((f) => f.name.includes("Geminids")));
  await assert.rejects(T.run({ city: "Atlantis" }), /star chart/);
});
