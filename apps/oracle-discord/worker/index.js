// Science is Magic oracle bot endpoint (Cloudflare Worker, free tier).
// Verifies Discord's signature, defers the reply, seals the options and starts the GitHub Actions reading job.
import { MODULES, isPrivate, flatten } from "../src/registry.js";
import { seal } from "../src/seal.js";

const hex = (s) => new Uint8Array(s.match(/../g).map((h) => parseInt(h, 16)));
export async function verify(req, body, publicKey) {
  const sig = req.headers.get("x-signature-ed25519"), ts = req.headers.get("x-signature-timestamp");
  if (!sig || !ts || !/^[0-9a-f]{128}$/i.test(sig)) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hex(publicKey), { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "Ed25519" }, key, hex(sig), new TextEncoder().encode(ts + body));
  } catch { return false; }
}

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
const lastUse = new Map(); // best-effort per-user cooldown (per isolate)

async function editOriginal(env, appId, token, content) {
  await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`, {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }),
  });
}

export async function dispatch(env, inputs) {
  const r = await fetch(`https://api.github.com/repos/${env.GH_REPO}/actions/workflows/${env.GH_WORKFLOW}/dispatches`, {
    method: "POST",
    headers: { authorization: "Bearer " + env.GH_DISPATCH_TOKEN, accept: "application/vnd.github+json", "user-agent": "science-is-magic-oracle", "content-type": "application/json" },
    body: JSON.stringify({ ref: env.GH_REF || "main", inputs }),
  });
  if (r.status !== 204) throw new Error("GitHub dispatch HTTP " + r.status);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") return new Response("Science is Magic oracle is listening.");
    if (req.method !== "POST") return new Response("Not found", { status: 404 });
    const body = await req.text();
    if (!(await verify(req, body, env.DISCORD_PUBLIC_KEY))) return new Response("Bad signature", { status: 401 });
    const it = JSON.parse(body);
    if (it.type === 1) return json({ type: 1 });
    const name = it.data && it.data.name;
    if (it.type !== 2 || !MODULES.includes(name)) return json({ type: 4, data: { content: "Unknown command.", flags: 64 } });

    const user = (it.member && it.member.user) || it.user || {}, now = Date.now(), cd = +(env.COOLDOWN_S || 20) * 1000;
    const k = user.id + ":" + name;
    if (lastUse.has(k) && now - lastUse.get(k) < cd) {
      return json({ type: 4, data: { content: `The oracle needs a breath. Try again in ${Math.ceil((cd - (now - lastUse.get(k))) / 1000)} s.`, flags: 64 } });
    }
    lastUse.set(k, now);
    const options = flatten(it.data.options);
    const priv = isPrivate(name, options);
    ctx.waitUntil((async () => {
      try {
        const payload = await seal({ options, user: String(user.global_name || user.username || "someone").slice(0, 40) }, env.ORACLE_KEY);
        await dispatch(env, { token: it.token, command: name, payload, private: String(priv) });
      } catch (e) {
        console.error("dispatch failed", e.message);
        await editOriginal(env, it.application_id, it.token, "The oracle couldn't start this reading. Try again in a minute.");
      }
    })());
    return json({ type: 5, data: priv ? { flags: 64 } : {} }); // "<bot> is thinking..."
  },
};
