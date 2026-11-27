// The emote collection (activity/src/emotes.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_EMOTES, emoteOk, owned, useEmote, levelOf, emoteOfDay, emoteBookHtml, emoteFxHtml } from "../activity/src/emotes.js";
import { STORE } from "../activity/src/store.js";
import { MOODS } from "../activity/src/mood.js";
const esc = (s) => String(s);
test("31 emotes, unique ids, real moods, every robe has its signature", () => {
  assert.equal(new Set(ALL_EMOTES.map((e) => e.id)).size, ALL_EMOTES.length);
  for (const e of ALL_EMOTES) assert.ok(MOODS[e.mood], e.id);
  const robes = STORE.filter((s) => s.kind === "outfit").map((s) => s.id);
  for (const r of robes) assert.ok(ALL_EMOTES.some((e) => e.robe === r), r);
});
test("starters are free, earned and robe emotes unlock by progress and ownership", () => {
  const p = { readings: 0 }; assert.equal(owned(p).length, 8);
  p.readings = 25; p.owned = ["crimson"]; assert.ok(emoteOk(p, ALL_EMOTES.find((e) => e.id === "levitate"))); assert.ok(emoteOk(p, ALL_EMOTES.find((e) => e.id === "robe-crimson")));
  assert.ok(!emoteOk(p, ALL_EMOTES.find((e) => e.id === "robe-tide")));
});
test("uses level emotes up, pay the emote of the day once, and report unlocks", () => {
  const p = { essence: 0 }, at = Date.UTC(2026, 10, 27, 18), day = emoteOfDay(at);
  const a = useEmote(p, day.id, at); assert.equal(a.dayBonus, 5); assert.equal(useEmote(p, day.id, at).dayBonus, 0);
  for (let i = 0; i < 8; i++) useEmote(p, day.id, at); assert.equal(levelOf(p.emo[day.id]), 1);
  let got = []; for (let i = 0; i < 20; i++) got.push(...useEmote(p, "wave", at).unlocked.map((e) => e.id)); assert.ok(got.includes("applause"));
});
test("six slots: filled from owned emotes, swap in and out, never empty", async () => {
  const { slots, toggleSlot, SLOTS } = await import("../activity/src/emotes.js");
  const p = {}; assert.equal(slots(p).length, SLOTS); assert.equal(toggleSlot(p, "levitate"), null);
  assert.equal(toggleSlot(p, slots(p)[0]), "off"); assert.equal(slots(p).length, 5); p.readings = 25; assert.equal(toggleSlot(p, "levitate"), "on"); assert.equal(toggleSlot(p, "spook"), "full");
  p.emoSlots = ["wave"]; assert.equal(toggleSlot(p, "wave"), "last");
  assert.ok(emoteBookHtml(p, esc).includes("Robe signatures")); assert.ok(emoteFxHtml(ALL_EMOTES[0]).includes("efx"));
});
