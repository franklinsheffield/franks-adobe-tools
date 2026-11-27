// GitHub Actions side of a reading: open the sealed options, run the module, post the reading to Discord.
// Env: TOKEN, COMMAND, PAYLOAD, PRIVATE, ORACLE_KEY, DISCORD_APP_ID.
import { open } from "../src/seal.js";
import { MODULES } from "../src/registry.js";
import { speech } from "../src/oracle/voice.js";
import { author, readingButtons } from "../src/oracle/chat.js";

const E = process.env, base = `https://discord.com/api/v10/webhooks/${E.DISCORD_APP_ID}/${E.TOKEN}`;
const size = (e) => JSON.stringify([e.title, e.description, (e.fields || []).map((f) => [f.name, f.value]), e.footer && e.footer.text, e.author && e.author.name]).length;

/** Split embeds into Discord messages (max 10 embeds and ~6000 characters each). */
export function pack(embeds, limit = 5800) {
  const msgs = []; let cur = [], n = 0;
  for (const e of embeds) { const s = size(e); if (cur.length && (n + s > limit || cur.length === 10)) { msgs.push(cur); cur = []; n = 0; } cur.push(e); n += s; }
  if (cur.length) msgs.push(cur);
  return msgs;
}

/** Reading -> Discord messages. Readings asked through /oracle open with the Oracle speaking; every reading ends with its buttons. */
export function oracleMessages(r, options = {}, user = "traveller", env = {}, rand = Math.random) {
  const embeds = r.embeds.map((e) => ({ ...e }));
  let content = r.content || "";
  if (options.via_oracle && embeds.length) {
    content = ("🔮 *" + speech(env.COMMAND, user, embeds[0], rand) + "*").slice(0, 1900) + (content ? "\n" + content : "");
    embeds[0].author = author(env);
  }
  const msgs = pack(embeds).map((embeds) => ({ embeds }));
  msgs[0].content = content;
  msgs[msgs.length - 1].components = readingButtons();
  return msgs;
}

async function send(method, url, payload, files = []) {
  const fd = new FormData();
  fd.append("payload_json", JSON.stringify({ ...payload, attachments: files.map((f, i) => ({ id: i, filename: f.name })) }));
  files.forEach((f, i) => fd.append(`files[${i}]`, new Blob([f.data], { type: "image/png" }), f.name));
  const r = await fetch(url, { method, body: fd });
  if (!r.ok) throw new Error(`Discord ${method} ${r.status}: ${(await r.text()).slice(0, 300)}`);
}

export async function main() {
  if (!MODULES.includes(E.COMMAND)) throw new Error("unknown command " + E.COMMAND);
  const { options, user } = await open(E.PAYLOAD, E.ORACLE_KEY);
  const mod = await import(`../src/modules/${E.COMMAND}/index.js`);
  let r;
  try { r = await mod.run(options, { user }); }
  catch (e) {
    console.log("reading failed:", e.name); // no options or message logged: they may contain birth data
    await send("PATCH", base + "/messages/@original", { content: "🔮 " + (e.message || "The oracle hit an error.").slice(0, 300) });
    return;
  }
  const priv = E.PRIVATE === "true" || r.ephemeral;
  const msgs = oracleMessages(r, options, user, E);
  await send("PATCH", base + "/messages/@original", msgs[0], r.files || []);
  for (const m of msgs.slice(1)) await send("POST", base, { ...m, flags: priv ? 64 : 0 });
  console.log(`posted ${E.COMMAND}: ${r.embeds.length} embeds in ${msgs.length} message(s)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(async (e) => {
  console.error("job failed:", e.message.replace(/[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}/g, "<date>"));
  try { await send("PATCH", base + "/messages/@original", { content: "🔮 The oracle hit an error with this reading. Try again in a minute." }); } catch {}
  process.exit(1);
});
