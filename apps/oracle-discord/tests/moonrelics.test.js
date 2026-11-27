// Moon relics (activity/src/moonrelics.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { RELICS, buyRelic, moonLeft, relicsHtml, levelTokens, ownsRelic } from "../activity/src/moonrelics.js";
import { UNLOCKS } from "../activity/src/game.js";
test("relics cost moon tokens, stay owned, and spending never re-locks the Moonlit cloth", () => {
  assert.equal(new Set(RELICS.map((r) => r.id)).size, RELICS.length);
  const p = { tokens: 16 }; const r = buyRelic(p, "mr-tapestry"); assert.equal(r.price, 10); assert.equal(moonLeft(p), 6);
  assert.equal(buyRelic(p, "mr-tapestry"), null); assert.equal(buyRelic(p, "mr-orrery"), null); assert.ok(ownsRelic(p, "mr-tapestry"));
  assert.ok(UNLOCKS.find((u) => u.id === "moonlit").ok(p)); assert.ok(relicsHtml(p).includes("mr-tapestry"));
  for (const x of RELICS) assert.ok(x.art().length > 50, x.id);
});
test("game levels pay more the harder they are; a full series is about one good relic", () => {
  const p = { tokens: 0 };
  assert.equal(levelTokens(p, "seance", 1, true).n, 2); assert.equal(levelTokens(p, "seance", 1, true).n, 0);
  assert.equal(levelTokens(p, "seance", 3, false).n, 0); assert.equal(levelTokens(p, "seance", 3, true).n, 6);
  const last = levelTokens(p, "seance", 2, true); assert.ok(last.series); assert.equal(last.n, 7); assert.equal(p.tokens, 15);
  assert.ok(RELICS.some((r) => r.price === 15));
});
test("familiars are adopted with moon tokens", async () => {
  const { buyFamiliar, FAMILIAR_TOKENS, moonLeft } = await import("../activity/src/moonrelics.js");
  const { FAMILIARS } = await import("../activity/src/character.js");
  for (const f of FAMILIARS.slice(1)) assert.ok(FAMILIAR_TOKENS[f.id] > 0, f.id);
  const p = { tokens: 8 }; assert.ok(buyFamiliar(p, "fam-cat")); assert.equal(moonLeft(p), 0); assert.ok(!buyFamiliar(p, "fam-cat")); assert.ok(!buyFamiliar(p, "fam-moth"));
});
