import { test } from "node:test";
import assert from "node:assert/strict";
import { DECK, SPREADS } from "../src/modules/tarot/data.js";
import { deal, readingEmbeds, command } from "../src/modules/tarot/index.js";
import { CODEX } from "../activity/src/game.js";
import { BY_SYSTEM } from "../activity/src/jokes.js";
import { systemByKey } from "../src/oracle/systems.js";

test("78 unique cards, each with keywords and both meanings", () => {
  assert.equal(DECK.length, 78);
  assert.equal(new Set(DECK.map((c) => c.n)).size, 78);
  for (const c of DECK) assert.ok(c.kw.length >= 2 && c.up.length > 20 && c.rv.length > 20, c.n);
  assert.equal(DECK.filter((c) => c.arcana === "major").length, 22);
});

test("every spread deals the right number of distinct cards", () => {
  for (const [k, sp] of Object.entries(SPREADS)) {
    const cast = deal(sp.positions.length);
    assert.equal(cast.length, sp.positions.length);
    assert.equal(new Set(cast.map((d) => d.card.id)).size, cast.length);
    const [main] = readingEmbeds(cast, k, "Will it work?");
    assert.equal(main.fields.length, cast.length); assert.ok(main.title.length <= 256);
  }
  assert.deepEqual(command.options[1].choices.map((c) => c.value), Object.keys(SPREADS));
});

test("tarot is wired into the Chamber", () => {
  assert.equal(CODEX.tarot.total, 78);
  assert.ok(BY_SYSTEM.tarot.length >= 5);
  const s = systemByKey("tarot"); assert.ok(s && s.kind === "cast" && s.spreads.length === 4);
});
