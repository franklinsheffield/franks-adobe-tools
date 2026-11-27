import { test } from "node:test";
import assert from "node:assert/strict";
import { readsLeft, useRead, buyDayPass, buy, dailyLimit, STORE, DAY_PASS } from "../activity/src/store.js";
import { fresh, record } from "../activity/src/game.js";

const r = { embeds: [{ title: "I Ching · 9 · Small Taming", fields: [] }], reading: {} };
test("daily Chamber readings grow with rank: 1, 3, 5, unlimited", () => {
  assert.deepEqual(["Seeker", "Initiate", "Adept", "Magus", "Oracle-touched"].map(dailyLimit), [1, 3, 5, Infinity, Infinity]);
});
test("a reading uses today's allowance; a day pass adds one for Essence", () => {
  const p = fresh(), now = new Date(2026, 10, 26, 12);
  assert.equal(readsLeft(p, "Seeker", now), 1);
  useRead(p, now); assert.equal(readsLeft(p, "Seeker", now), 0);
  assert.equal(buyDayPass(p, now), false);
  p.essence = DAY_PASS + 5; assert.equal(buyDayPass(p, now), true);
  assert.equal(p.essence, 5); assert.equal(readsLeft(p, "Seeker", now), 1);
  assert.equal(readsLeft(p, "Seeker", new Date(2026, 10, 27, 12)), 1, "resets the next day");
});
test("readings earn Essence; the store sells each item once", () => {
  const p = fresh(); const g = record(p, "iching", r);
  assert.ok(g.essence >= g.xp && p.essence === g.essence);
  const cat = STORE.find((s) => s.id === "cat"); p.essence = cat.price;
  assert.equal(buy(p, "cat"), true); assert.equal(p.essence, 0); assert.equal(buy(p, "cat"), false);
  assert.equal(buy(p, "cosmic"), false, "not enough Essence");
});
test("every kind has a free starter or earned option", () => {
  for (const k of ["outfit", "avatar", "flame", "voice"]) assert.ok(STORE.some((s) => s.kind === k && s.price === 0), k);
});

test("every reading system has a vibe, every product kind has dialogue", async () => {
  const { STORE, KINDS, SHOP_TALK, ensureFree } = await import("../activity/src/store.js");
  const { CLOTH_DESIGN, AVATAR_LOOK, robeFx } = await import("../activity/src/looks.js");
  for (const k of ["iching", "runes", "oraclebones", "ifa", "astrology", "humandesign", "numerology", "chinesezodiac", "mayan", "egyptian", "celtic"])
    assert.ok(STORE.find((i) => i.id === "v-" + k && i.kind === "vibe"), k);
  for (const [k] of KINDS) for (const m of ["open", "tryon", "buy"]) assert.ok(SHOP_TALK[k]?.[m]?.length >= 3, k + m);
  for (const i of STORE) {
    if (i.kind === "cloth" && i.design) assert.equal(typeof CLOTH_DESIGN[i.design], "function", i.id);
    if (i.kind === "avatar") assert.ok(AVATAR_LOOK[i.id], i.id);
    if (i.kind === "outfit") { const fx = robeFx(i.element); assert.ok(fx.back || fx.robe || fx.front, i.id); }
  }
  const p = { owned: [] }; ensureFree(p);
  assert.ok(p.owned.includes("chamber"));
});

test("personalities: every one has full line pools and a store item", async () => {
  const { PERSONAS, personaQuip, deliver, line } = await import("../activity/src/personas.js");
  const { STORE } = await import("../activity/src/store.js");
  for (const [id, P] of Object.entries(PERSONAS)) {
    assert.ok(STORE.find((s) => s.id === id && s.kind === "persona"), id);
    if (!P) continue;
    for (const k of ["greet", "ask", "cast", "reveal", "pre", "post"]) assert.ok(P[k].length >= 2, id + k);
    assert.ok(P.jokes.length >= 12, id);
    const heard = []; const seen = new Set(); for (let i = 0; i < P.jokes.length; i++) seen.add(personaQuip(id, "Frank", heard));
    assert.equal(seen.size, P.jokes.length, id + " no repeats");
    assert.ok(line(P, "reveal", { result: "Hexagram 1" }).includes("Hexagram 1"), id);
    assert.ok(deliver(id, "Yes.", { name: "Frank" }).includes("Yes."));
  }
});

import { IDLE, idleLine } from "../activity/src/idle.js";
import { PERSONAS } from "../activity/src/personas.js";
test("every personality has 15 idle lines; first 3 lead in order, then no repeats", () => {
  for (const id of Object.keys(PERSONAS)) {
    assert.equal(IDLE[id]?.length, 15, id);
    const used = [], got = Array.from({ length: 15 }, (_, k) => idleLine(id, k, used, "Ana"));
    assert.deepEqual(got.slice(0, 3), IDLE[id].slice(0, 3).map((t) => t.replace(/\{name\}/g, "Ana")));
    assert.equal(new Set(got).size, 15, id);
  }
});

import { registerShelf, shelf, KINDS, STORE as ALL, ensureFree as free } from "../activity/src/store.js";
test("room shelves add a store tab, items, talk, and free items", () => {
  registerShelf({ kind: "zz-test", label: "🧪 Test", items: [{ id: "zz-a", name: "A", price: 0 }, { id: "zz-b", name: "B", price: 30 }], talk: { open: ["o"], tryon: ["t"], buy: ["b"] } });
  registerShelf({ kind: "zz-test", label: "dup", items: [] });
  assert.ok(KINDS.some(([k]) => k === "zz-test")); assert.equal(KINDS.filter(([k]) => k === "zz-test").length, 1);
  assert.equal(ALL.find((s) => s.id === "zz-b").kind, "zz-test"); assert.ok(shelf("zz-test"));
  assert.ok(free({}).owned.includes("zz-a"));
});
