import test from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import chamber, { exchange } from "../activity/worker.mjs";
import { seal } from "../src/seal.js";
import { MODULES } from "../src/registry.js";

test("the Chamber builds with every registered module", () => {
  execFileSync(process.execPath, [new URL("../activity/build.mjs", import.meta.url).pathname], { stdio: "pipe" });
  const dist = new URL("../activity/dist/", import.meta.url);
  for (const f of ["index.html", "chamber.js", "chamber.css", "assets/oracle.png", "assets/Cinzel-Regular.otf"]) assert.ok(existsSync(new URL(f, dist)), f);
  const gen = readFileSync(new URL("../activity/src/modules.gen.js", import.meta.url), "utf8");
  for (const m of MODULES) assert.ok(gen.includes(`/modules/${m}/index.js`), m);
});

class KV { m = new Map(); async get(k) { return this.m.get(k) ?? null; } async put(k, v) { this.m.set(k, v); } async delete(k) { this.m.delete(k); } }
test("Chamber worker: sign-in, own profile only, static files", async () => {
  const KEY = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
  const env = { ORACLE_KEY: KEY, PROFILES: new KV(), DISCORD_APP_ID: "1", ASSETS: { fetch: () => new Response("static") } };
  await env.PROFILES.put("profile:42", await seal({ date: "1990-04-09", time: "14:30", place: "Phoenix" }, KEY));
  const post = (p, body, h = {}) => chamber.fetch(new Request("https://x" + p, { method: "POST", body: JSON.stringify(body), headers: h }), env);
  assert.equal((await post("/.proxy/api/token", { code: "c" })).status, 503); // no client secret yet
  assert.equal((await chamber.fetch(new Request("https://x/api/profile"), env)).status, 401);
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => String(url).endsWith("/users/@me") ? Response.json({ id: "42" }) : Response.json({ access_token: "tok" });
  try {
    const r = await chamber.fetch(new Request("https://x/.proxy/api/profile", { headers: { authorization: "Bearer tok" } }), env);
    assert.equal((await r.json()).profile.place, "Phoenix");
    const del = await chamber.fetch(new Request("https://x/.proxy/api/profile", { method: "DELETE", headers: { authorization: "Bearer tok" } }), env);
    assert.equal((await del.json()).ok, true); assert.equal(await env.PROFILES.get("profile:42"), null);
    assert.deepEqual((await exchange({ ...env, DISCORD_CLIENT_SECRET: "s" }, "c")).body, { access_token: "tok" });
  } finally { globalThis.fetch = real; }
  assert.equal(await (await chamber.fetch(new Request("https://x/"), env)).text(), "static");
});
