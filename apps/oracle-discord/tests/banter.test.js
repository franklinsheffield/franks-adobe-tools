// Game banter (activity/src/banter.js): every personality has its own lines for every game.
import test from "node:test";
import assert from "node:assert/strict";
import { BANTER, PERSONA_BANTER, banter } from "../activity/src/banter.js";
import { STORE } from "../activity/src/store.js";

const personas = STORE.filter((s) => s.kind === "persona").map((s) => s.id);
const GAMES = ["seance", "decoder", "timeline", "alchemy", "calendar", "grimoire", "stars", "duel", "memory", "rummy", "flametest", "minerals", "watch", "inscriptions", "bench", "casefiles", "workshop", "bookings"];

test("every game has lines from every personality, all different and short", () => {
  assert.deepEqual(Object.keys(BANTER).sort(), [...GAMES].sort()); assert.ok(personas.length >= 10);
  const seen = new Set(); let n = 0;
  for (const g of GAMES) for (const p of personas) {
    const b = BANTER[g][p]; assert.ok(b, `${g} has ${p}`); assert.equal(b.mid.length, 2); assert.ok(b.win.length && b.lose.length);
    for (const l of [...b.mid, ...b.win, ...b.lose]) { assert.ok(l.length >= 12 && l.length <= 90, `${g}/${p}: ${l} (${l.length})`); assert.ok(!seen.has(l), "repeated: " + l); seen.add(l); n++; }
  }
  assert.equal(n, GAMES.length * personas.length * 4);
  for (const p of personas) { assert.ok(PERSONA_BANTER[p].poke.length >= 3 && PERSONA_BANTER[p].perfect.length >= 1); for (const l of [...PERSONA_BANTER[p].poke, ...PERSONA_BANTER[p].perfect]) assert.ok(l.length <= 90); }
});

test("banter picks the right line and does not repeat until the pool is spent", () => {
  assert.ok(BANTER.duel.pirate.win.includes(banter("duel", "pirate", "win")));
  assert.ok(BANTER.rummy.deadpan.lose.includes(banter("rummy", "deadpan", "lose")));
  const used = [], a = banter("memory", "bard", "mid", "Ada", used), b = banter("memory", "bard", "mid", "Ada", used); assert.notEqual(a, b);
  assert.ok(BANTER.memory.bard.mid.includes(banter("memory", "bard", "mid", "Ada", used)));
  assert.ok(!banter("x", "mystic", "poke", "Ada", [], () => 0.4).includes("{name}")); assert.equal(banter("nope", "mystic", "mid"), null);
  assert.ok(banter("stars", "unknown-persona", "win")); assert.ok(banter("stars", "grumpy", "perfect"));
});
