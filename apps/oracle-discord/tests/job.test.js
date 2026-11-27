// Runs the whole reading job (I Ching) with Discord's API stubbed, so a broken post path fails here, not live.
import test from "node:test";
import assert from "node:assert";
import { seal } from "../src/seal.js";

test("reading job posts the reading and buttons without errors", async () => {
  const KEY = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
  Object.assign(process.env, { ORACLE_KEY: KEY, TOKEN: "tok", COMMAND: "iching", PRIVATE: "false", DISCORD_APP_ID: "1",
    PAYLOAD: await seal({ options: { question: "q", via_oracle: true }, user: "Frank" }, KEY) });
  const calls = [], real = globalThis.fetch;
  globalThis.fetch = async (url, init) => { calls.push({ url, method: init.method, payload: JSON.parse(init.body.get("payload_json")) }); return new Response("{}"); };
  try { const { main } = await import("../scripts/job.js?run"); await main(); } finally { globalThis.fetch = real; }
  assert.ok(calls.length >= 1);
  assert.equal(calls[0].method, "PATCH");
  assert.match(calls[0].payload.content, /^🔮 \*/);
  assert.ok(calls[0].payload.embeds.length >= 1);
  assert.ok(!calls.some((c) => /error/i.test(c.payload.content || "")));
  assert.equal(calls.at(-1).payload.components[0].components[0].custom_id, "oracle:menu");
});
