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
