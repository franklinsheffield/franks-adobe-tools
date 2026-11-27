// Science is Magic oracle bot endpoint (Cloudflare Worker, free tier).
// Verifies Discord's signature, defers the reply, seals the options and starts the GitHub Actions reading job.
import { MODULES, isPrivate, flatten } from "../src/registry.js";
import { seal } from "../src/seal.js";
import { fieldsFor, loadProfile, saveProfile, deleteProfile, checkBirth, fillFromProfile, needsForm, birthModal, fromModal } from "../src/profiles.js";
import { menuMessage, askModal, systemByKey } from "../src/oracle/chat.js";
import { optionsFor } from "../src/oracle/systems.js";
import { PORTRAIT_PNG_B64 } from "../src/oracle/portrait.js";

const PORTRAIT = Uint8Array.from(atob(PORTRAIT_PNG_B64), (c) => c.charCodeAt(0));

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

async function profileReply(env, userId, o, say) {
  if (!env.PROFILES) return say("Saved profiles aren't switched on yet.");
  if (o.subcommand === "delete") { await deleteProfile(env, userId); return say("🗑️ Your saved birth details are deleted."); }
  if (o.subcommand === "show") {
    const p = await loadProfile(env, userId);
    return say(p ? `🪪 Saved: **${p.date}**, ${p.time && p.time !== "unknown" ? `**${p.time}**` : "time unknown"}, ${p.place ? `**${p.place}**` : "no place"}, ${p.name ? `name **${p.name}**` : "no birth name (add one for /numerology)"}. Change it with \`/profile set\`, remove it with \`/profile delete\`.` : "Nothing saved. Use `/profile set` to save your birth details.");
  }
  const old = (await loadProfile(env, userId)) || {};
  const p = { date: o.date || old.date, place: o.place || old.place, name: o.name || old.name };
  p.time = o.time || (o.date && o.date !== old.date ? "unknown" : old.time || "unknown");
  if (!p.date) return say("🔮 Add your birth date the first time: `/profile set date:1990-04-09`.");
  const bad = checkBirth(p, ["date", ...(o.place ? ["place"] : []), ...(o.name ? ["name"] : [])]);
  if (bad) return say("🔮 " + bad);
  await saveProfile(env, userId, p, { merge: false });
  return say("✅ Saved (encrypted, only used for your own readings). Readings that need birth details use it automatically. `/profile show` checks it, `/profile delete` removes it.");
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") return new Response("Science is Magic oracle is listening.");
    if (req.method === "GET" && url.pathname === "/oracle.png") return new Response(PORTRAIT, { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" } });
    if (req.method !== "POST") return new Response("Not found", { status: 404 });
    const body = await req.text();
    if (!(await verify(req, body, env.DISCORD_PUBLIC_KEY))) return new Response("Bad signature", { status: 401 });
    const it = JSON.parse(body);
    if (it.type === 1) return json({ type: 1 });
    const user = (it.member && it.member.user) || it.user || {};
    const say = (content) => json({ type: 4, data: { content, flags: 64 } });

    const who = String(user.global_name || user.username || "traveller").slice(0, 40);
    let name, options;
    if (it.type === 3) { // buttons and the Oracle's system menu
      const id = it.data.custom_id;
      if (id === "oracle:menu") return json(menuMessage(env, who));
      if (id === "oracle:chamber") {
        if (env.ACTIVITY_READY === "true") return json({ type: 12 }); // launch the Oracle Chamber Activity
        return say("✨ The Oracle Chamber is still being built. For now, the Oracle reads for you right here: press **Another reading**.");
      }
      if (id !== "oracle:pick") return say("That button has faded. Run /oracle again.");
      const sys = systemByKey((it.data.values || [])[0]);
      if (!sys) return say("That oracle isn't awake yet. Choose another.");
      if (sys.kind === "cast") return json(askModal(sys, who));
      name = sys.command; options = optionsFor(sys);
      const f = fieldsFor(name, options);
      if (f) {
        fillFromProfile(options, f, await loadProfile(env, user.id));
        if (needsForm(options, f)) return json(await birthModal(env, name, options, f));
      }
    } else if (it.type === 5 && String(it.data.custom_id).startsWith("ask:")) { // the Oracle's question form
      const sys = systemByKey(it.data.custom_id.slice(4));
      if (!sys) return say("That oracle isn't awake yet. Run /oracle again.");
      const q = ((it.data.components || []).flatMap((r) => r.components).find((c) => c.custom_id === "question") || {}).value || "";
      name = sys.command; options = optionsFor(sys, q.trim() ? { [sys.ask || "question"]: q.trim().slice(0, 200) } : {});
    } else if (it.type === 5) { // modal submit: replay the command with the entered birth data
      const m = await fromModal(env, it);
      if (!m) return say("That form expired. Run the command again.");
      const bad = checkBirth({ ...m.profile, time: m.profile.time }, m.need);
      if (bad) return say("🔮 " + bad + " Run the command again to retry.");
      if (m.save && env.PROFILES) await saveProfile(env, user.id, m.profile);
      ({ name, options } = m);
    } else {
      name = it.data && it.data.name;
      if (it.type !== 2) return say("Unknown interaction.");
      options = flatten(it.data.options);
      if (name === "profile") return profileReply(env, user.id, options, say);
      if (name === "oracle") return json(menuMessage(env, who));
      if (!MODULES.includes(name)) return say("Unknown command.");
      const f = fieldsFor(name, options);
      // /astrology now is public by default: only use birth data when typed, or my_chart is set (which makes it private).
      const wantsBirth = f && (name !== "astrology" || options.subcommand === "chart" || options.my_chart || options[f.date]);
      if (wantsBirth) {
        if (options.my_chart && options.private === undefined) options.private = true;
        fillFromProfile(options, f, await loadProfile(env, user.id));
        if (needsForm(options, f)) return json(await birthModal(env, name, options, f));
      }
    }

    const now = Date.now(), cd = +(env.COOLDOWN_S || 20) * 1000, k = user.id + ":" + name;
    if (lastUse.has(k) && now - lastUse.get(k) < cd) return say(`The oracle needs a breath. Try again in ${Math.ceil((cd - (now - lastUse.get(k))) / 1000)} s.`);
    lastUse.set(k, now);
    const priv = isPrivate(name, options);
    ctx.waitUntil((async () => {
      try {
        const payload = await seal({ options, user: who }, env.ORACLE_KEY);
        await dispatch(env, { token: it.token, command: name, payload, private: String(priv) });
      } catch (e) {
        console.error("dispatch failed", e.message);
        await editOriginal(env, it.application_id, it.token, "The oracle couldn't start this reading. Try again in a minute.");
      }
    })());
    return json({ type: 5, data: priv ? { flags: 64 } : {} }); // "<bot> is thinking..."
  },
};
