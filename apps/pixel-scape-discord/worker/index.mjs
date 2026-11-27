// Pixel Scape Discord bot endpoint (Cloudflare Worker, free tier).
// Verifies Discord's signature, answers at once, and starts the GitHub Actions render job.
export const COMMANDS = [
  {
    name: "terrain", description: "Build real 3D terrain of a place: rendered image and/or .glb model",
    options: [
      { type: 3, name: "place", description: "Place name or lat,lon (e.g. Grand Canyon or 36.10,-112.11)", required: true, max_length: 120 },
      { type: 10, name: "size", description: "Width of the square in km (1 to 40, default 10)", min_value: 1, max_value: 40 },
      { type: 3, name: "view", description: "Camera (default oblique)", choices: [{ name: "Oblique", value: "oblique" }, { name: "Top-down", value: "top" }] },
      { type: 3, name: "format", description: "What to post (default both)", choices: [{ name: "Image + .glb", value: "both" }, { name: "Image only", value: "image" }, { name: ".glb only", value: "glb" }] },
      { type: 10, name: "relief", description: "Height exaggeration (1 to 4, default auto)", min_value: 1, max_value: 4 },
    ],
  },
  // opens the Pixel Scape Activity right where the command is used (guild channels, voice call if you're in one)
  { name: "pixelscape", description: "Open Pixel Scape and build 3D worlds together in this channel", contexts: [0] },
];

const hex = (s) => new Uint8Array(s.match(/../g).map((h) => parseInt(h, 16)));
export async function verify(req, body, publicKey) {
  const sig = req.headers.get("x-signature-ed25519"), ts = req.headers.get("x-signature-timestamp");
  if (!sig || !ts || !/^[0-9a-f]{128}$/i.test(sig)) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hex(publicKey), { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "Ed25519" }, key, hex(sig), new TextEncoder().encode(ts + body));
  } catch (e) { return false; }
}

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
const lastUse = new Map(); // best-effort per-user cooldown (per isolate)

export async function editOriginal(env, token, content, appId) {
  const r = await fetch(`https://discord.com/api/v10/webhooks/${appId || env.DISCORD_APP_ID}/${token}/messages/@original`, {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }),
  });
  if (!r.ok) console.error("edit reply failed", r.status, (await r.text()).slice(0, 200));
  return r;
}

export async function dispatch(env, inputs) {
  const r = await fetch(`https://api.github.com/repos/${env.GH_REPO}/actions/workflows/${env.GH_WORKFLOW}/dispatches`, {
    method: "POST",
    headers: { authorization: "Bearer " + env.GH_DISPATCH_TOKEN, accept: "application/vnd.github+json", "user-agent": "pixel-scape-bot", "content-type": "application/json" },
    body: JSON.stringify({ ref: env.GH_REF || "main", inputs }),
  });
  if (r.status !== 204) throw new Error("GitHub dispatch HTTP " + r.status + " " + (await r.text()).slice(0, 200));
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") return new Response("Pixel Scape bot is running.");
    if (req.method !== "POST") return new Response("Not found", { status: 404 });
    const body = await req.text();
    if (!(await verify(req, body, env.DISCORD_PUBLIC_KEY))) return new Response("Bad signature", { status: 401 });
    const it = JSON.parse(body);
    if (it.type === 1) return json({ type: 1 });
    if (it.type !== 2 || !COMMANDS.some((c) => c.name === it.data.name)) return json({ type: 4, data: { content: "Unknown command.", flags: 64 } });

    const need = String(env.GATE_ROLE_IDS || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (need.length && !((it.member && it.member.roles) || []).some((r) => need.includes(r)))
      return json({ type: 4, data: { content: env.GATE_MESSAGE || "Pixel Scape is locked for you.", flags: 64 } });
    if (it.data.name === "pixelscape") return json({ type: 12 }); // LAUNCH_ACTIVITY
    const user = (it.member && it.member.user) || it.user || {}, now = Date.now(), cd = +(env.COOLDOWN_S || 60) * 1000;
    if (lastUse.has(user.id) && now - lastUse.get(user.id) < cd) {
      const wait = Math.ceil((cd - (now - lastUse.get(user.id))) / 1000);
      return json({ type: 4, data: { content: `One terrain a minute please. Try again in ${wait} s.`, flags: 64 } });
    }
    lastUse.set(user.id, now);
    const o = Object.fromEntries((it.data.options || []).map((x) => [x.name, x.value]));
    const inputs = {
      token: it.token, place: String(o.place || "").slice(0, 120), size: String(o.size || 10), view: o.view || "oblique",
      format: o.format || "both", relief: o.relief ? String(o.relief) : "auto", user: String(user.username || user.id || "someone").slice(0, 40),
    };
    ctx.waitUntil((async () => {
      try {
        await dispatch(env, inputs);
        console.log("dispatched", inputs.place);
        await editOriginal(env, it.token, `Building **${inputs.place}** (${inputs.size} km). Real elevation + satellite imagery, ready in about 1 to 3 minutes...`, it.application_id);
      } catch (e) {
        console.error("build start failed", e.message);
        await editOriginal(env, it.token, "Pixel Scape couldn't start the build: " + e.message.slice(0, 300), it.application_id);
      }
    })());
    return json({ type: 5 }); // "Pixel Scape is thinking..."
  },
};
