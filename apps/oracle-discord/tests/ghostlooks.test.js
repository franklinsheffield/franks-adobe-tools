// Séance ghost avatars (activity/src/seance/ghostlooks.js): every look draws with the scene's hooks, moves and cries.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GHOST_LOOK, ghostShop, ghostBody, DEFAULT_GHOST } from "../activity/src/seance/ghostlooks.js";
import { GHOST_CRIES } from "../activity/src/seance/sfx.js";
import { STORE } from "../activity/src/store.js";

const css = readFileSync(new URL("../activity/src/chamber.css", import.meta.url), "utf8");

test("every ghost avatar is sold once, draws with blink and frown hooks, and has its own motion and cry", () => {
  assert.deepEqual(ghostShop.items.map((i) => i.id).sort(), Object.keys(GHOST_LOOK).sort());
  assert.equal(ghostShop.items.find((i) => i.id === DEFAULT_GHOST).price, 0);
  for (const it of ghostShop.items) {
    assert.ok(!STORE.some((s) => s.id === it.id), it.id + " clashes with a store id");
    const svg = ghostBody(it.id); assert.match(svg, /class="sc-eyes"/, it.id); assert.match(svg, /sc-mouth/, it.id);
    if (it.id !== DEFAULT_GHOST) assert.ok(css.includes(".sg-" + it.id + " "), "motion for " + it.id);
    assert.ok(GHOST_CRIES.includes(it.id), "cry for " + it.id);
  }
  assert.equal(ghostBody("nope"), ghostBody(DEFAULT_GHOST));
  assert.equal(ghostShop.kind, "ghost");
});
