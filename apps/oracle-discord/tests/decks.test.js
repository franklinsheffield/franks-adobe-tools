import { test } from "node:test";
import assert from "node:assert/strict";
import { CARDS, SPREADS as LS } from "../src/modules/lenormand/data.js";
import * as len from "../src/modules/lenormand/index.js";
import { DECK, SUITS, SPREADS as MS } from "../src/modules/magicdeck/data.js";
import * as mag from "../src/modules/magicdeck/index.js";
import { CODEX } from "../activity/src/game.js";
import { BY_SYSTEM } from "../activity/src/jokes.js";
import { systemByKey } from "../src/oracle/systems.js";
import { STORE, KINDS, SHOP_TALK } from "../activity/src/store.js";

test("Lenormand: 36 unique cards numbered 1-36, each playing-card inset used once", () => {
  assert.equal(CARDS.length, 36); assert.equal(new Set(CARDS.map((c) => c.n)).size, 36);
  assert.deepEqual(CARDS.map((c) => c.num), Array.from({ length: 36 }, (_, i) => i + 1));
  assert.equal(new Set(CARDS.map((c) => c.pc.join(""))).size, 36);
  for (const c of CARDS) assert.ok(c.kw.length >= 2 && c.up.length > 20 && c.noun && c.mod && [-1, 0, 1].includes(c.tone), c.n);
});

test("Science is Magic deck: 44 unique cards, 4 suits of 11, each with a fact", () => {
  assert.equal(DECK.length, 44); assert.equal(new Set(DECK.map((c) => c.n)).size, 44);
  for (const s of SUITS) assert.equal(DECK.filter((c) => c.suit === s.key).length, 11);
  for (const c of DECK) assert.ok(c.kw.length >= 2 && c.up.length > 20 && c.fact.length > 20, c.n);
});

test("every spread deals the right distinct cards and builds embeds", () => {
  for (const [mod, spreads] of [[len, LS], [mag, MS]]) for (const [k, sp] of Object.entries(spreads)) {
    const cast = mod.deal(sp.positions.length);
    assert.equal(cast.length, sp.positions.length); assert.equal(new Set(cast.map((d) => d.card.id)).size, cast.length);
    const [main, synth] = mod.readingEmbeds(cast, k, "Will it work?");
    assert.ok(main.title.length <= 256 && main.fields.length >= 1 && synth.fields.length >= 2);
    for (const f of [...main.fields, ...synth.fields]) assert.ok(f.value.length <= 1024 && f.name.length <= 256);
    assert.deepEqual(mod.command.options[1].choices.map((c) => c.value), Object.keys(spreads));
  }
});

test("both decks are wired into the Chamber's By the cards row, codex, jokes and store", () => {
  for (const [k, total] of [["lenormand", 36], ["magicdeck", 44]]) {
    const s = systemByKey(k); assert.ok(s && s.row === "cards" && s.spreads.length === 3, k);
    assert.equal(CODEX[k].total, total); assert.ok(BY_SYSTEM[k].length >= 5);
    assert.ok(STORE.some((i) => i.id === "v-" + k && i.kind === "vibe"));
  }
  assert.ok(KINDS.some(([k]) => k === "cardback")); assert.ok(SHOP_TALK.cardback);
  assert.ok(STORE.filter((i) => i.kind === "cardback").length >= 5);
});
