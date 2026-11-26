import test from "node:test";
import assert from "node:assert";
import W, { exchange } from "../activity/worker.mjs";

const env = (o) => Object.assign({ DISCORD_APP_ID: "1", DISCORD_CLIENT_SECRET: "s", ASSETS: { fetch: async () => new Response("asset") } }, o);
test("token exchange sends the code and returns only the access token", async () => {
  let sent = null;
  const r = await exchange(env(), "abc", async (u, o) => { sent = { u, body: String(o.body) }; return new Response(JSON.stringify({ access_token: "T", refresh_token: "R" }), { status: 200 }); });
  assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.body, { access_token: "T" });
  assert.match(sent.u, /oauth2\/token$/); assert.match(sent.body, /code=abc/); assert.match(sent.body, /grant_type=authorization_code/);
});
test("token route: POST only, needs a code, needs the secret", async () => {
  assert.strictEqual((await W.fetch(new Request("https://x/api/token"), env())).status, 405);
  assert.strictEqual((await W.fetch(new Request("https://x/api/token", { method: "POST", body: "{}" }), env())).status, 400);
  assert.strictEqual((await W.fetch(new Request("https://x/.proxy/api/token", { method: "POST", body: "{}" }), env({ DISCORD_CLIENT_SECRET: "" }))).status, 503);
});
test("everything else is the web build", async () => {
  assert.strictEqual(await (await W.fetch(new Request("https://x/index.html"), env())).text(), "asset");
});
test("role gate: allowed role passes, missing role or non-member is locked", async () => {
  const { checkMember } = await import("../activity/worker.mjs");
  const g = env({ GATE_GUILD_ID: "G", GATE_ROLE_IDS: "A, B" });
  let asked = null;
  const member = (roles, status = 200) => async (u, o) => { asked = { u, auth: o.headers.authorization }; return new Response(JSON.stringify({ roles }), { status }); };
  assert.deepStrictEqual(await checkMember(g, "T", member(["x", "B"])), { ok: true });
  assert.match(asked.u, /users\/@me\/guilds\/G\/member$/); assert.strictEqual(asked.auth, "Bearer T");
  assert.strictEqual((await checkMember(g, "T", member(["x"]))).ok, false);
  assert.strictEqual((await checkMember(g, "T", member([], 404))).reason, "not a member");
  assert.deepStrictEqual(await checkMember(env(), "T", member([])), { ok: true }); // no gate configured
});
test("token route returns 403 locked when the member lacks the role", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async (u) => String(u).includes("oauth2/token")
    ? new Response(JSON.stringify({ access_token: "T" }), { status: 200 })
    : new Response(JSON.stringify({ roles: ["nope"] }), { status: 200 });
  try {
    const req = () => new Request("https://x/api/token", { method: "POST", body: JSON.stringify({ code: "c" }) });
    const r = await W.fetch(req(), env({ GATE_GUILD_ID: "G", GATE_ROLE_IDS: "A", GATE_MESSAGE: "sealed" }));
    assert.strictEqual(r.status, 403); assert.deepStrictEqual(await r.json(), { error: "locked", message: "sealed" });
    const ok = await W.fetch(req(), env({ GATE_GUILD_ID: "G", GATE_ROLE_IDS: "nope" }));
    assert.strictEqual(ok.status, 200); assert.deepStrictEqual(await ok.json(), { access_token: "T" });
  } finally { globalThis.fetch = real; }
});
