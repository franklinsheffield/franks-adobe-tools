import test from "node:test";
import assert from "node:assert";
import worker from "../worker/index.js";
import { seal, open } from "../src/seal.js";
import { pack } from "../scripts/job.js";

const KEY = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");

test("sealed options round-trip and hide birth data", async () => {
  const s = await seal({ options: { date: "1990-04-09", place: "Phoenix" } }, KEY);
  assert.ok(!s.includes("1990") && !s.includes("Phoenix"));
  assert.deepEqual(await open(s, KEY), { options: { date: "1990-04-09", place: "Phoenix" } });
  await assert.rejects(open(s, Buffer.alloc(32).toString("base64")));
});

test("worker rejects unsigned requests and answers GET", async () => {
  const r = await worker.fetch(new Request("https://x/", { method: "POST", body: "{}" }), { DISCORD_PUBLIC_KEY: "00".repeat(32) }, {});
  assert.equal(r.status, 401);
  assert.equal((await worker.fetch(new Request("https://x/"), {}, {})).status, 200);
});

test("pack splits long readings into messages under 6000 characters", () => {
  const e = { title: "t", fields: Array.from({ length: 5 }, () => ({ name: "n", value: "x".repeat(1000) })) };
  const msgs = pack([e, e, e]);
  assert.equal(msgs.length, 3);
});

import { flatten, isPrivate } from "../src/registry.js";
test("subcommands flatten and privacy defaults", () => {
  const o = flatten([{ type: 1, name: "chart", options: [{ type: 3, name: "date", value: "1990-01-01" }] }]);
  assert.deepEqual(o, { subcommand: "chart", date: "1990-01-01" });
  assert.equal(isPrivate("astrology", o), true);
  assert.equal(isPrivate("astrology", { subcommand: "now" }), false);
  assert.equal(isPrivate("humandesign", { date: "x" }), false);
  assert.equal(isPrivate("humandesign", { private: true }), true);
});

import { birthModal, fromModal, fillFromProfile, fieldsFor, checkBirth, needsForm } from "../src/profiles.js";
class KV { m = new Map(); async get(k) { return this.m.get(k) ?? null; } async put(k, v) { this.m.set(k, v); } async delete(k) { this.m.delete(k); } }
test("birth modal: prefilled, short custom_id, blank time = unknown", async () => {
  const env = { PROFILES: new KV(), ORACLE_KEY: KEY };
  const o = { subcommand: "chart", date: "1990-04-09", place: "Phoenix", houses: "placidus" }, f = fieldsFor("astrology", o);
  assert.equal(needsForm(o, f), true);
  const m = await birthModal(env, "astrology", o, f);
  assert.equal(m.type, 9); assert.ok(m.data.custom_id.length < 100);
  assert.equal(m.data.components[0].components[0].value, "1990-04-09");
  const it = { data: { custom_id: m.data.custom_id, components: [
    { components: [{ custom_id: "date", value: "1990-04-09" }] }, { components: [{ custom_id: "time", value: "" }] },
    { components: [{ custom_id: "place", value: "Phoenix" }] }, { components: [{ custom_id: "save", value: "Yes" }] }] } };
  const r = await fromModal(env, it);
  assert.equal(r.options.houses, "placidus"); assert.equal(r.options.time_unknown, true); assert.equal(r.save, true);
  assert.equal(r.profile.time, "unknown");
  assert.equal(await fromModal(env, it), null); // one use only
  const h = {}; fillFromProfile(h, fieldsFor("humandesign", h), { date: "1990-04-09", time: "unknown", place: "Phoenix" });
  assert.equal(needsForm(h, fieldsFor("humandesign", h)), false);
  assert.match(checkBirth({ date: "09/04/1990", place: "x y" }), /year-month-day/);
});

test("profile is stored sealed", async () => {
  const { saveProfile, loadProfile } = await import("../src/profiles.js");
  const env = { PROFILES: new KV(), ORACLE_KEY: KEY };
  await saveProfile(env, "42", { date: "1990-04-09", time: "14:30", place: "Phoenix" });
  assert.ok(![...env.PROFILES.m.values()][0].includes("Phoenix"));
  assert.equal((await loadProfile(env, "42")).place, "Phoenix");
});
