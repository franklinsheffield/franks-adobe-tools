import test from "node:test";
import assert from "node:assert";
import { SYSTEMS, available, systemByKey, optionsFor } from "../src/oracle/systems.js";
import { menuMessage, askModal } from "../src/oracle/chat.js";
import { speech, headline, greeting } from "../src/oracle/voice.js";
import { oracleMessages } from "../scripts/job.js";
import { portraitSvg } from "../src/oracle/figure.js";
import { PORTRAIT_PNG_B64 } from "../src/oracle/portrait.js";

const rand = () => 0.3;

test("menu lists only registered systems, with valid select emoji and ids", () => {
  const live = available(["iching", "astrology", "humandesign"]);
  assert.deepEqual(live.map((s) => s.key), ["iching", "astrology", "humandesign"]);
  assert.equal(new Set(SYSTEMS.map((s) => s.key)).size, SYSTEMS.length);
  for (const s of SYSTEMS) assert.match(s.emoji, /\p{Extended_Pictographic}/u, s.key);
  const m = menuMessage({}, "Frank", rand);
  assert.equal(m.type, 4); assert.equal(m.data.flags, 64);
  const sel = m.data.components[0].components[0];
  assert.equal(sel.custom_id, "oracle:pick");
  assert.ok(sel.options.length >= 3 && sel.options.length <= 25);
  for (const o of sel.options) { assert.ok(o.label.length <= 100 && o.description.length <= 100); }
  assert.match(m.data.embeds[0].description, /Frank/);
  assert.match(m.data.embeds[0].thumbnail.url, /\/oracle\.png$/);
});

test("ask modal fits Discord limits", () => {
  const m = askModal(systemByKey("iching"), "A very long display name for testing", rand);
  assert.equal(m.type, 9); assert.equal(m.data.custom_id, "ask:iching");
  assert.ok(m.data.title.length <= 45);
  const input = m.data.components[0].components[0];
  assert.ok(input.label.length <= 45 && input.placeholder.length <= 100);
});

test("options from the menu mark the reading as the Oracle's", () => {
  assert.deepEqual(optionsFor(systemByKey("astrology")), { subcommand: "chart", via_oracle: true });
  assert.deepEqual(optionsFor(systemByKey("iching"), { question: "q" }), { question: "q", via_oracle: true });
});

test("the Oracle speaks over its readings and every reading gets buttons", () => {
  assert.equal(headline({ title: "🪙 I Ching · 24 · 復 Fù · Return" }), "24 · 復 Fù · Return");
  const r = { embeds: [{ title: "🪙 I Ching · 24 · 復 Fù · Return" }, { title: "x" }] };
  const m = oracleMessages(r, { via_oracle: true }, "Frank", { COMMAND: "iching" }, rand);
  assert.match(m[0].content, /^🔮 \*.*Frank.*24 · 復 Fù · Return/);
  assert.equal(m[0].embeds[0].author.name, "The Oracle");
  assert.equal(m.at(-1).components[0].components[0].custom_id, "oracle:menu");
  const plain = oracleMessages(r, {}, "Frank", { COMMAND: "iching" }, rand);
  assert.equal(plain[0].content, ""); assert.equal(plain[0].embeds[0].author, undefined);
  assert.ok(greeting("Frank", rand).includes("Frank"));
  assert.equal(headline({ title: "✨ Astrology · Natal Chart", fields: [{ name: "☉ Sun in Aries, house 10" }, { name: "☽ Moon in Leo" }, { name: "↑ Libra Rising" }] }), "Sun in Aries · Moon in Leo · Libra Rising");
  assert.equal(headline({ title: "x · y" }, "Life Path 7"), "Life Path 7");
  assert.ok(speech("unknown", "F", { title: "A · B" }, rand).includes("B"));
});

test("portrait is a real PNG", () => {
  assert.ok(portraitSvg().startsWith("<svg"));
  assert.equal(Buffer.from(PORTRAIT_PNG_B64, "base64").subarray(1, 4).toString(), "PNG");
});

import worker from "../worker/index.js";
import { open } from "../src/seal.js";
const KEY = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64");
const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
const PUB = Buffer.from(await crypto.subtle.exportKey("raw", kp.publicKey)).toString("hex");
async function call(it, env, ctx) {
  const body = JSON.stringify(it), ts = String(Date.now());
  const sig = Buffer.from(await crypto.subtle.sign({ name: "Ed25519" }, kp.privateKey, new TextEncoder().encode(ts + body))).toString("hex");
  const r = await worker.fetch(new Request("https://x/", { method: "POST", body, headers: { "x-signature-ed25519": sig, "x-signature-timestamp": ts } }), env, ctx);
  return r.json();
}
class KV { m = new Map(); async get(k) { return this.m.get(k) ?? null; } async put(k, v) { this.m.set(k, v); } async delete(k) { this.m.delete(k); } }

test("worker: /oracle -> menu -> question form -> reading dispatched as the Oracle's", async () => {
  const env = { DISCORD_PUBLIC_KEY: PUB, ORACLE_KEY: KEY, PROFILES: new KV(), GH_REPO: "o/r", GH_WORKFLOW: "w.yml", GH_DISPATCH_TOKEN: "t", COOLDOWN_S: "0" };
  const user = { id: "7", global_name: "Frank" }, waits = [], ctx = { waitUntil: (p) => waits.push(p) };
  const menu = await call({ type: 2, token: "tk", member: { user }, data: { name: "oracle", options: [] } }, env, ctx);
  assert.equal(menu.type, 4); assert.equal(menu.data.components[0].components[0].custom_id, "oracle:pick");
  const modal = await call({ type: 3, token: "tk", member: { user }, data: { custom_id: "oracle:pick", values: ["iching"] } }, env, ctx);
  assert.equal(modal.type, 9); assert.equal(modal.data.custom_id, "ask:iching");
  const sent = []; const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Response(null, { status: 204 }); };
  try {
    const d = await call({ type: 5, token: "tk", application_id: "1", member: { user }, data: { custom_id: "ask:iching", components: [{ components: [{ custom_id: "question", value: "Start the project?" }] }] } }, env, ctx);
    assert.equal(d.type, 5); await Promise.all(waits);
  } finally { globalThis.fetch = realFetch; }
  assert.equal(sent.length, 1); assert.equal(sent[0].body.inputs.command, "iching");
  const o = await open(sent[0].body.inputs.payload, KEY);
  assert.deepEqual(o, { options: { question: "Start the project?", via_oracle: true }, user: "Frank" });
  // Birth system with no saved profile -> the birth form, carrying the Oracle flag.
  const bf = await call({ type: 3, token: "tk", member: { user }, data: { custom_id: "oracle:pick", values: ["humandesign"] } }, env, ctx);
  assert.equal(bf.type, 9); assert.match(bf.data.custom_id, /^birth:/);
  const chamber = await call({ type: 3, token: "tk", member: { user }, data: { custom_id: "oracle:chamber" } }, env, ctx);
  assert.equal(chamber.type, 4);
  assert.equal((await call({ type: 3, token: "tk", member: { user }, data: { custom_id: "oracle:chamber" } }, { ...env, ACTIVITY_READY: "true" }, ctx)).type, 12);
  const png = await worker.fetch(new Request("https://x/oracle.png"), env, ctx);
  assert.equal(png.headers.get("content-type"), "image/png");
});
