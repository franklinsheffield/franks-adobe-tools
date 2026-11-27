// /model: Frank's 3D library (web-pipeline-kit /models, ~6,800 free models) in Discord.
//   /model find query [category] [style] [vibe]   up to 5 matches with previews
//   /model random [category] [style] [vibe]       one pick, with an "Another" button
//   /model show model                             one model (autocomplete by name)
// Every model is CC0 / CC BY / public domain; files stay in the public assets repo and are linked, not re-uploaded.
// CC BY models carry their credit line.
import * as L from "../src/models.mjs";

const CHOICES = (list) => list.slice(0, 25).map(({ v, n }) => ({ name: `${v} (${n})`, value: v }));
const filters = [
  { type: 3, name: "category", description: "Kind of model", choices: CHOICES(L.CATEGORIES) },
  { type: 3, name: "style", description: "Look", choices: CHOICES(L.STYLES) },
  { type: 3, name: "vibe", description: "Vibe (as on the library site)", autocomplete: true },
];
export const modelCommand = {
  name: "model", description: `Find 3D models in Frank's library (${L.info.count.toLocaleString("en-US")} free models)`, contexts: [0],
  options: [
    { type: 1, name: "find", description: "Search the 3D library", options: [{ type: 3, name: "query", description: "What to look for (e.g. tree, spaceship, chair)", required: true, max_length: 80 }].concat(filters) },
    { type: 1, name: "random", description: "A random model, optionally from one category, style or vibe", options: filters },
    { type: 1, name: "show", description: "One model with its preview, licence and download", options: [{ type: 3, name: "model", description: "Start typing a name", required: true, autocomplete: true }] },
  ],
};

const COLOUR = 0x5effc8;
const sub = (it) => { const s = ((it.data && it.data.options) || [])[0] || {}; return { name: s.name, o: Object.fromEntries((s.options || []).map((x) => [x.name, x.value])), focused: (s.options || []).find((x) => x.focused) }; };
const filt = (o) => ({ category: o.category || "", style: o.style || "", vibe: String(o.vibe || "").toLowerCase() });
const label = (f) => [f.category, f.style, f.vibe].filter(Boolean).join(", ");

export function embed(m, big) {
  const facts = [m.category, m.style, m.pointCloud ? "point cloud" : m.tris ? m.tris.toLocaleString("en-US") + " triangles" : "", L.mb(m.bytes)].filter(Boolean).join(" · ");
  const lines = [facts, `Licence: ${m.license}${m.author ? " · by " + m.author : ""}`, m.vibes.length ? "Vibes: " + m.vibes.join(", ") : "", `[Download .glb](${L.fileUrl(m)})`];
  const e = { title: m.name.slice(0, 256), url: L.fileUrl(m), color: COLOUR, description: lines.filter(Boolean).join("\n").slice(0, 4000), footer: { text: (L.credit(m) || m.pack || "Pixel Scape 3D library").slice(0, 2048) } };
  if (big) e.image = { url: L.thumbUrl(m) }; else e.thumbnail = { url: L.thumbUrl(m) };
  return e;
}
// "Add to my scene" opens the Pixel Scape Activity with the model's id (the Activity reads it as discordSdk.customId)
export const sceneLink = (appId, m) => "https://discord.com/activities/" + appId + "?custom_id=" + encodeURIComponent("model|" + m.id);
let APP = "";
const buttons = (m, again) => [{ type: 1, components: [
  { type: 2, style: 5, label: "Download .glb", url: L.fileUrl(m) },
].concat(APP ? [{ type: 2, style: 5, label: "Add to my scene", url: sceneLink(APP, m) }] : []).concat([
  { type: 2, style: 5, label: "Open the library", url: L.siteUrl() },
]).concat(again ? [{ type: 2, style: 2, label: "Another", emoji: { name: "🎲" }, custom_id: again.slice(0, 100) }] : []) }];
const reply = (data) => ({ type: 4, data: Object.assign({ allowed_mentions: { parse: [] } }, data) });
const quiet = (content) => reply({ content, flags: 64 });
const rndId = (f) => ["model:rnd", f.category, f.style, f.vibe].join(":");

function randomReply(f, rnd) {
  const m = L.random(f, rnd);
  if (!m) return quiet(`No models match ${label(f) || "that"}.`);
  return reply({ content: `🎲 ${label(f) ? "Random " + label(f) + " model" : "Random model"}`, embeds: [embed(m, true)], components: buttons(m, rndId(f)) });
}

// it = a Discord interaction (2 command, 3 button, 4 autocomplete) -> the response body, or null when it isn't ours
export function modelInteraction(it, env, rnd = Math.random) {
  APP = String(it.application_id || (env && env.DISCORD_APP_ID) || "");
  if (it.type === 3) {
    const [, kind, category, style, vibe] = String(it.data.custom_id || "").split(":");
    return kind === "rnd" ? randomReply({ category, style, vibe }, rnd) : null;
  }
  if (!it.data || it.data.name !== "model") return null;
  const { name, o, focused } = sub(it);
  if (it.type === 4) {
    const q = String((focused && focused.value) || "").toLowerCase();
    if (focused && focused.name === "vibe") return { type: 8, data: { choices: L.VIBES.filter((x) => x.v.includes(q)).slice(0, 25).map(({ v, n }) => ({ name: `${v} (${n})`, value: v })) } };
    return { type: 8, data: { choices: q.trim() ? L.suggest(q) : L.MODELS.slice(0, 25).map((m) => ({ name: (m.name + " · " + m.category).slice(0, 100), value: m.id })) } };
  }
  if (name === "random") return randomReply(filt(o), rnd);
  if (name === "show") {
    const m = L.get(o.model) || L.search(o.model, {}, 1).items[0];
    return m ? reply({ embeds: [embed(m, true)], components: buttons(m) }) : quiet(`No model called "${String(o.model).slice(0, 80)}". Try /model find.`);
  }
  if (name === "find") {
    const f = filt(o), r = L.search(o.query, f, 5);
    if (!r.items.length) return quiet(`Nothing for "${String(o.query).slice(0, 80)}"${label(f) ? " (" + label(f) + ")" : ""}. Try fewer words, or /model random.`);
    const more = r.total > r.items.length ? ` Showing the best ${r.items.length}; see them all at <${L.siteUrl()}>` : "";
    return reply({ content: `**${r.total.toLocaleString("en-US")}** model${r.total === 1 ? "" : "s"} for "${String(o.query).slice(0, 80)}"${label(f) ? " (" + label(f) + ")" : ""}.${more}`,
      embeds: r.items.map((m) => embed(m, false)), components: [{ type: 1, components: [{ type: 2, style: 5, label: "Open the library", url: L.siteUrl() }] }] });
  }
  return quiet("Unknown /model option.");
}
