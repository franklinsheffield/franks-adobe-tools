// The Houses engine: one Activity, one wallet, one Codex, one music pool and playlist; a different host per Discord
// channel. A host pack (hosts/<id>.js) plugs in: its name, which rooms and readings it offers, its figure paint,
// voice, lines, game banter, store shelves and its own music player. The Oracle is House 1 and the fallback.
//   Pack: { id, name, house, emoji, accent, channelIds[], readings, rooms: "all" | [roomId], daily?, voice?, css?,
//           paint?(svg, prog, idPrefix), vars?(prog) -> { "--css-var": value } (shelf looks the CSS reads), rename?(text), player: { name, deck(track, playing) }, shelves?[],
//           scene?(at, { prog, motes }) -> html (replaces the Chamber's backdrop), react?(kind, { teller, scene, gesture, reduced }) -> line?,
//           emotes?: { [startEmoteId]: { e, name, mood, say, fx } } (re-dresses the 8 starting emotes; ids stay), token.icon? (html),
//           lines?: { greet[], idle[], joke[] }, banter?: { [roomId]: { mid[], win[], lose[] } }, poke?[], perfect?[] }
import { GATES_CSS } from "./gates.js";
import { housePersonaLine } from "./house-personas.js";
import { oracle } from "./oracle.js";
import { alchemist } from "./alchemist.js";
import { observatory } from "./observatory.js";
import { parlour } from "./parlour.js";
import { scriptorium } from "./scriptorium.js";
import { tokensLeft, houseRelicsHtml, tokenIcon, TOKEN_CSS } from "./tokens.js";
import { SECRETS_CSS } from "./secrets.js";
import { addRing, DISGUISE_CSS } from "./disguise.js";

export const HOSTS = [oracle, alchemist, observatory, parlour, scriptorium];
export const hostById = (id) => HOSTS.find((h) => h.id === id) || null;

/** Which House this launch is in: ?house=<id> (preview and local dev) wins, then the Discord channel, then the Oracle. */
export function hostFor({ channelId = null, search = "" } = {}) {
  const q = new URLSearchParams(search).get("house");
  return (q && hostById(q)) || (channelId && HOSTS.find((h) => h.channelIds.includes(String(channelId)))) || oracle;
}

let current = oracle;
export const host = () => current;
export function setHost(h) { current = h || oracle; return current; }

/** Every House's shelves, so the shared store sells them all (one wallet). */
export const hostShelves = () => HOSTS.flatMap((h) => h.shelves || []);
export const hasRoom = (h, roomId) => h.rooms === "all" || h.rooms.includes(roomId);
export const rename = (s) => (typeof s === "string" && current.rename ? current.rename(s) : s);

const pick = (pool, used = [], rand = Math.random) => {
  if (!pool || !pool.length) return null;
  let fresh = pool.filter((l) => !used.includes(l)); if (!fresh.length) { used.length = 0; fresh = pool; }
  const l = fresh[Math.floor(rand() * fresh.length)]; used.push(l); return l;
};
/** A host line ("greet" | "idle" | "joke"), or null for the Oracle (who keeps her personalities). */
export function hostLine(kind, name = "traveller", used = [], rand = Math.random) {
  const l = pick((current.lines || {})[kind], used, rand); return l ? l.replace(/\{name\}/g, name) : null;
}
/** The host's own streak remark ("{n} days in a row…"), or null for the Oracle's line. */
export function hostStreak(n) { const pool = (current.lines || {}).streak; return pool && pool.length ? pool[Math.floor(Math.random() * pool.length)].replace(/\{n\}/g, n) : null; }
/** The chosen personality talking about this House (see house-personas.js), or null in the Oracle's Chamber. */
export const personaHouseLine = (personaId, kind, name = "traveller", used = []) => (current === oracle ? null : housePersonaLine(personaId, current.id, kind, name, used));
/** The host's own game banter ("mid" | "win" | "lose" | "perfect" | "poke"), or null to use the Oracle's personalities. */
export function hostBanter(game, event, name = "traveller", used = [], rand = Math.random) {
  if (current === oracle) return null;
  const B = (current.banter || {})[game] || {};
  const pool = event === "poke" ? current.poke : event === "perfect" ? [...(current.perfect || []), ...(B.win || [])] : B[event];
  const l = pick(pool, used, rand); return l ? l.replace(/\{name\}/g, name) : null;
}

/** Put the House on the page: title, speaker name, colours and CSS. */
export function dressHouse(doc = document) {
  const h = current; doc.body.dataset.house = h.id;
  doc.title = h === oracle ? "Oracle Chamber" : h.house;
  const sp = doc.querySelector(".speaker"); if (sp) sp.textContent = h.name.toUpperCase();
  const t = doc.getElementById("teller"); if (t && h !== oracle) t.setAttribute("aria-label", `${h.name}, ${h.house}'s host`);
  if (!doc.getElementById("house-css")) { const st = doc.createElement("style"); st.id = "house-css"; st.textContent = TOKEN_CSS + SECRETS_CSS + DISGUISE_CSS + GATES_CSS + (h.css || "") + ((h.menuBg && h.menuBg.css) || "") + `body{--house-accent:${h.accent}}`; doc.head.appendChild(st); }
}
/** Paint the host onto a copy of the shared figure (the teller, or the door's portrait). */
export function paintHost(svg, prog, id = "t") {
  if (!svg) return; if (current.vars && svg.ownerDocument) for (const [k, v] of Object.entries(current.vars(prog || {}))) svg.ownerDocument.documentElement.style.setProperty(k, v); // shelf looks as CSS variables
  if (current.paint) current.paint(svg, prog || {}, id); addRing(svg); // every host wears the same ring (disguise.js)
  const pane = id === "t" && current.relics && svg.closest(".pane"); if (!pane) return; // House relics sit in the host's pane, behind the host
  let layer = pane.querySelector("#house-relics"); if (!layer) { layer = svg.ownerDocument.createElement("div"); layer.id = "house-relics"; layer.setAttribute("aria-hidden", "true"); pane.prepend(layer); }
  const key = JSON.stringify(((prog || {}).houses || {})[current.id]?.relics || []); if (layer.dataset.k !== key) { layer.dataset.k = key; layer.innerHTML = houseRelicsHtml(prog || {}, current); }
}
/** The House token in the stats bar (the Oracle's 🌙 is already there). */
export const houseChip = (p) => (current.token && current.token.id !== "moon" ? `<span title="${current.token.plural} to spend on ${current.house}'s relics. Earn them with your first visit each day and by beating game levels here.">${tokenIcon(current.token)} ${tokensLeft(p, current)}</span>` : "");

/** The House's own backdrop, or null for the Chamber's. */
export const hostScene = (at, opts) => (current.scene ? current.scene(at, opts) : null);
/** The host reacts to "poke-eye" | "poke-orb" | "poke-hands" | "poke-hood" | "win" | "perfect" | "lose". May return a line. */
export const hostReact = (kind, ctx) => (current.react ? current.react(kind, ctx) : null);
/** An emote as this House shows it (same id, levels and slot; the host's own look and line). */
export const hostEmote = (e) => (e && current.emotes && current.emotes[e.id] ? { ...e, ...current.emotes[e.id] } : e);
export { tokenIcon };
