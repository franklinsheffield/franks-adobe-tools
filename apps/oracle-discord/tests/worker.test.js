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
