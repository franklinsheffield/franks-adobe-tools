// Study hall: one place in the main menu that links to every game's study guides and materials.
// It reads each room's own guide data (nothing is copied), so a guide edited in its room shows here too.
// A game appears here when it has an entry in STUDY; add one when a new room ships a guide.
import { GUIDE as STARS } from "./stars/guide.js";
import { GUIDE as RUMMY } from "./rummy/guide.js";
import { GUIDES as DECODER } from "./decoder/guide.js";
import { GUIDES as TIMELINE } from "./timeline/guide.js";
import { GUIDES as GRIMOIRE, NOT_ADVICE, POISON_HELP } from "./grimoire/guide.js";
import { GUIDES as CALENDAR, GUIDE_ORDER } from "./calendar/guide.js";
import { NOTEBOOK } from "./alchemy/guide.js";
import { HOOKS, TIPS } from "./memory/guide.js";
import { DECKS } from "./memory/deck.js";
import { DUEL_GUIDE } from "./duel/room.js";
import { CHEM_GUIDES } from "./duel/chemistry.js";
import { POOL, GENERAL, SPECIFIC } from "./seance/practices.js";
import { GHOSTS } from "./seance/ghosts.js";
import { GUIDE as WATCH } from "./watch/guide.js";
import { GUIDE as COMET } from "./comet/guide.js";
import { GUIDE as ECLIPSE } from "./eclipse/guide.js";
import { GUIDE as NAVIGATOR } from "./navigator/guide.js";
import { GUIDE as MESSIER } from "./messier/guide.js";
import { GUIDE as STARPARTY } from "./starparty/guide.js";
import { PLAY } from "./study-play.js";
import { FACTS } from "./study-facts.js";

const escT = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const book = (title, sections) => ({ title, sections });
const titled = (g) => book(g.title, g.sections);

/** Every game's materials: { room, emoji, name, guides: [{ id, emoji, title, sections: [{ h, p: [html] }] }] }. */
export const STUDY = [
  { room: "stars", emoji: "🔭", name: "Star Lore Navigator", guides: [{ id: "stars", emoji: "🔭", ...titled(STARS) }] },
  { room: "rummy", emoji: "🃏", name: "Constellation Rummy", guides: [{ id: "rummy", emoji: "🃏", ...titled(RUMMY) }] },
  { room: "watch", emoji: "🔭", name: "The Night Watch", guides: [{ id: "watch", emoji: "🔭", ...titled(WATCH) }] },
  { room: "comet", emoji: "☄️", name: "Comet Hunter", guides: [{ id: "comet", emoji: "☄️", ...titled(COMET) }] },
  { room: "eclipse", emoji: "🌑", name: "Eclipse Chaser", guides: [{ id: "eclipse", emoji: "🌑", ...titled(ECLIPSE) }] },
  { room: "navigator", emoji: "🧭", name: "Celestial Navigator", guides: [{ id: "navigator", emoji: "🧭", ...titled(NAVIGATOR) }] },
  { room: "messier", emoji: "🌌", name: "Messier's Catalogue", guides: [{ id: "messier", emoji: "🌌", ...titled(MESSIER) }] },
  { room: "starparty", emoji: "🌠", name: "Star Party", guides: [{ id: "starparty", emoji: "🌠", ...titled(STARPARTY) }] },
  { room: "decoder", emoji: "🗝️", name: "Rune & Glyph Decoder", guides: Object.entries(DECODER).map(([id, g]) => ({ id, emoji: "🗝️", ...titled(g) })) },
  { room: "timeline", emoji: "⏳", name: "History of Magic", guides: Object.entries(TIMELINE).map(([id, g]) => ({ id, emoji: "⏳", ...titled(g) })) },
  { room: "grimoire", emoji: "🌿", name: "Herbalist's Grimoire", guides: Object.entries(GRIMOIRE).map(([id, g]) => ({ id: "g" + id, emoji: "🌿",
    title: g.title, sections: [{ h: "⚠️ Safety first", p: [escT(NOT_ADVICE), escT(POISON_HELP)] }, ...g.sections] })) },
  { room: "calendar", emoji: "🗓️", name: "Calendar Keeper", guides: GUIDE_ORDER.map((id) => ({ id, emoji: CALENDAR[id].emoji, ...titled(CALENDAR[id]) })) },
  { room: "alchemy", emoji: "⚗️", name: "Alchemist's Lab", guides: [{ id: "notebook", emoji: "📓", title: "The Alchemist's Notebook",
    sections: NOTEBOOK.map((s) => ({ h: s.h, p: s.p.map(escT) })) }] },
  { room: "memory", emoji: "🃏", name: "Grimoire Memory", guides: DECKS.filter((d) => HOOKS[d.id]).map((d) => ({ id: d.id, emoji: d.emoji, title: `${d.name}: memory hooks`,
    sections: [{ h: "Memory hooks", p: HOOKS[d.id] }, { h: "How to remember more", p: TIPS }] })) },
  { room: "duel", emoji: "⚛️", name: "Element Duel", guides: [{ id: "duel", emoji: "⚛️", title: "How to play Element Duel", sections: DUEL_GUIDE.map(([h, p]) => ({ h, p })) }, ...CHEM_GUIDES] },
  { room: "seance", emoji: "🕯️", name: "Séance: Guess the Ghost", guides: [
    { id: "kinds", emoji: "🔬", title: "Kinds of science and magic", sections: [
      { h: "The answer pool (level 1)", p: POOL.map((k) => `${k.emoji} <b>${escT(k.name)}</b> (${k.field === "both" ? "a bit of both" : k.field})`) },
      { h: "Practitioners (level 1)", p: GENERAL.filter((g) => g.bio).map((g) => `${g.emoji} <b>${escT(g.name)}</b>: ${escT(g.bio)}`) },
    ] },
    { id: "methods", emoji: "🧪", title: "Specific methods (level 2)", sections: [{ h: "Techniques, named exactly", p: SPECIFIC.filter((g) => g.bio).map((g) => `${g.emoji} <b>${escT(g.name)}</b>: ${escT(g.bio)}`) }] },
    { id: "ghosts", emoji: "👻", title: "The famous ghosts (level 3)", sections: [{ h: "Magicians and scientists", p: GHOSTS.filter((g) => g.bio).map((g) => `${g.emoji || "👻"} <b>${escT(g.name)}</b>: ${escT(g.bio)}`) }] },
  ] },
];

// Rooms whose only guides are built from their own data (study-facts.js).
const NEW = [
  ["flametest", "🔥", "Flame Test Lab"], ["minerals", "🪨", "Mineral Cabinet"], ["bench", "🧫", "Discovery Bench"], ["commissions", "📋", "Commissions"],
  ["fireworks", "🎆", "Fireworks Workshop"], ["leadgold", "⚛️", "Lead into Gold"], ["casefiles", "🗂️", "Case Files"], ["workshop", "🎩", "The Workshop"],
  ["bookings", "🎟️", "Bookings"], ["darkseance", "🕯️", "The Dark Séance"], ["mentalist", "🎩", "The Mentalist"], ["phantasmagoria", "🏮", "Phantasmagoria"],
  ["roguesgallery", "🖼️", "The Rogues' Gallery"], ["inscriptions", "🔎", "Inscription Tray"], ["cipherdesk", "🗝️", "Cipher Desk"], ["possession", "👻", "Possession"],
];
for (const [room, emoji, name] of NEW) STUDY.push({ room, emoji, name, guides: FACTS[room] });
// Every game opens with its "How to play & tips" page (study-play.js), in front of its fact guides.
for (const x of STUDY) {
  const P = PLAY[x.room]; if (!P) continue;
  x.guides.unshift({ id: "play", emoji: "🎮", title: P.how ? "How to play & tips" : "Tips",
    sections: [...(P.how ? [{ h: "How to play", p: P.how }] : []), { h: "Tips", p: P.tips }] });
}

export const studyFor = (room) => STUDY.find((s) => s.room === room) || null;

/** One guide as foldable sections (the first one open). Guide text may hold <b>, <i> and lists: it is our own content. */
export function studyHtml(g, { accent = "" } = {}) {
  return `<div class="sh-guide${accent ? " sh-house" : ""}"${accent ? ` style="--sh-accent:${escT(accent)}"` : ""}><h3>${g.emoji} ${escT(g.title)}</h3>${g.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${escT(s.h)}</summary>${s.p.map((t) => `<p>${t}</p>`).join("")}</details>`).join("")}</div>`;
}

export const STUDY_CSS = `.sh-guide h3{font-family:var(--display);color:var(--gold);letter-spacing:.08em;font-size:1rem;margin:0 0 8px}
.sh-guide details{border:1px solid var(--line);border-radius:10px;margin:6px 0;background:rgba(22,16,48,.55)}
.sh-guide summary{cursor:pointer;padding:8px 12px;font-weight:700;color:var(--gold2);list-style-position:inside}
.sh-guide details[open] summary{border-bottom:1px solid var(--line)}
.sh-guide p{margin:8px 12px;font-size:.9rem;line-height:1.55}.sh-guide b{color:var(--teal)}
.sh-guide{transform-origin:0 50%;animation:sh-turn .55s cubic-bezier(.2,.7,.3,1) both}
.sh-guide details{animation:sh-rise .45s ease-out both}.sh-guide details:nth-of-type(2){animation-delay:.06s}.sh-guide details:nth-of-type(3){animation-delay:.12s}.sh-guide details:nth-of-type(n+4){animation-delay:.18s}
.sh-guide details[open]>p{animation:sh-ink .4s ease-out both}
.sh-house h3{color:var(--sh-accent)}.sh-house details{border-color:color-mix(in srgb,var(--sh-accent) 45%,transparent)}.sh-house b{color:var(--sh-accent)}
@keyframes sh-turn{from{opacity:0;transform:perspective(900px) rotateY(-28deg) translateX(-8px)}to{opacity:1;transform:none}}
@keyframes sh-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes sh-ink{from{opacity:0;filter:blur(2px)}to{opacity:1;filter:none}}
@media (prefers-reduced-motion:reduce){.sh-guide,.sh-guide details,.sh-guide details[open]>p{animation:none}}`;
