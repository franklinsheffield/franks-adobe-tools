import test from "node:test";
import assert from "node:assert";
import worker, { verify, COMMANDS } from "../worker/index.mjs";
const { subtle } = globalThis.crypto;
const kp = await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
const pub = Buffer.from(await subtle.exportKey("raw", kp.publicKey)).toString("hex");
async function signed(body, ts = "1700000000") {
  const sig = Buffer.from(await subtle.sign({ name: "Ed25519" }, kp.privateKey, new TextEncoder().encode(ts + body))).toString("hex");
  return new Request("https://x/", { method: "POST", body, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } });
}
const env = { DISCORD_PUBLIC_KEY: pub, DISCORD_APP_ID: "1", GH_DISPATCH_TOKEN: "t", GH_REPO: "o/r", GH_WORKFLOW: "w.yml" };
test("ping is answered when signed", async () => {
  const body = JSON.stringify({ type: 1 }), r = await worker.fetch(await signed(body), env, { waitUntil() {} });
  assert.strictEqual(r.status, 200); assert.deepStrictEqual(await r.json(), { type: 1 });
});
test("bad signature is rejected", async () => {
  const req = await signed(JSON.stringify({ type: 1 })); const bad = new Request(req, { body: JSON.stringify({ type: 2 }) });
  assert.strictEqual((await worker.fetch(bad, env, { waitUntil() {} })).status, 401);
  assert.strictEqual(await verify(new Request("https://x/", { method: "POST" }), "", pub), false);
});
test("/terrain defers and dispatches the render job", async () => {
  const calls = [], realFetch = globalThis.fetch, waits = [];
  globalThis.fetch = async (u, o) => { calls.push([String(u), o]); return new Response(null, { status: u.includes("api.github.com") ? 204 : 200 }); };
  try {
    const body = JSON.stringify({ type: 2, token: "tok", member: { user: { id: "9", username: "frank" } }, data: { name: "terrain", options: [{ name: "place", value: "Grand Canyon" }, { name: "size", value: 12 }] } });
    const r = await worker.fetch(await signed(body), env, { waitUntil: (p) => waits.push(p) });
    assert.deepStrictEqual(await r.json(), { type: 5 }); await Promise.all(waits);
    const gh = calls.find((c) => c[0].includes("/actions/workflows/w.yml/dispatches")); assert.ok(gh);
    const inp = JSON.parse(gh[1].body).inputs; assert.strictEqual(inp.place, "Grand Canyon"); assert.strictEqual(inp.size, "12"); assert.strictEqual(inp.token, "tok");
    const again = await worker.fetch(await signed(body), env, { waitUntil() {} }); assert.match((await again.json()).data.content, /One terrain a minute/);
  } finally { globalThis.fetch = realFetch; }
});
test("/terrain is refused without an access role", async () => {
  const g = Object.assign({}, env, { GATE_ROLE_IDS: "A,B", GATE_MESSAGE: "sealed" });
  const body = (roles) => JSON.stringify({ type: 2, token: "t", member: { roles, user: { id: "77" } }, data: { name: "terrain", options: [{ name: "place", value: "x" }] } });
  const no = await (await worker.fetch(await signed(body(["z"])), g, { waitUntil() {} })).json();
  assert.strictEqual(no.type, 4); assert.strictEqual(no.data.content, "sealed"); assert.strictEqual(no.data.flags, 64);
  const realFetch = globalThis.fetch; globalThis.fetch = async () => new Response(null, { status: 204 });
  try { assert.strictEqual((await (await worker.fetch(await signed(body(["B"])), g, { waitUntil() {} })).json()).type, 5); }
  finally { globalThis.fetch = realFetch; }
});
test("/pixelscape launches the Activity, behind the same role gate", async () => {
  const g = Object.assign({}, env, { GATE_ROLE_IDS: "A", GATE_MESSAGE: "sealed" });
  const body = (roles) => JSON.stringify({ type: 2, token: "t", member: { roles, user: { id: "5" } }, data: { name: "pixelscape" } });
  assert.deepStrictEqual(await (await worker.fetch(await signed(body(["A"])), g, { waitUntil() {} })).json(), { type: 12 });
  assert.strictEqual((await (await worker.fetch(await signed(body([])), g, { waitUntil() {} })).json()).data.content, "sealed");
  const odd = JSON.stringify({ type: 2, data: { name: "nope" } });
  assert.match((await (await worker.fetch(await signed(odd), env, { waitUntil() {} })).json()).data.content, /Unknown/);
});
test("command schema", () => { assert.strictEqual(COMMANDS[0].name, "terrain"); assert.deepStrictEqual(COMMANDS.map((c) => c.name), ["terrain", "pixelscape", "model"]); assert.ok(COMMANDS.every((c) => c.description.length <= 100)); assert.ok(COMMANDS[0].options.every((o) => o.description.length <= 100)); });
