// Scriptorium item parity (House 5, Archivist Wren): two more shelves and six more relics.
//   wrenquill  the pen in Wren's hand (prog.wrenquill; CSS vars --wren-quill, --wren-quill-edge)
//   wrenseal   the wax of Wren's badge and desk seal (prog.wrenseal; CSS vars --wren-wax, --wren-wax-edge)
// Every note is a real fact.

export const QUILLS = [
  { id: "ql-goose", name: "Goose quill", price: 0, c: "#f4eee0", edge: "#b8a582", note: "The everyday medieval pen. Feathers from a goose's left wing curve away from a right-handed writer." },
  { id: "ql-swan", name: "Swan quill", price: 30, c: "#ffffff", edge: "#c8c8d0", note: "Swan quills are bigger and tougher than goose. They cost more, and a good one kept its point longer." },
  { id: "ql-crow", name: "Crow quill", price: 30, c: "#2a2a34", edge: "#6a6a7a", note: "Crow feathers are small and stiff, cut for very fine lines. Mapmakers and artists liked them for detail." },
  { id: "ql-turkey", name: "Turkey quill", price: 40, c: "#8a6a4a", edge: "#3a2a1a", note: "In America, turkey feathers were a cheap, sturdy stand-in for goose quills." },
  { id: "ql-reed", name: "Reed pen (qalam)", price: 40, c: "#c8b060", edge: "#6a5a20", note: "Cut from a reed with a slanted tip. Egyptian scribes used reeds, and Arabic calligraphers still use the qalam." },
  { id: "ql-steel", name: "Steel nib", price: 50, c: "#9aa6b0", edge: "#4a525a", note: "Birmingham factories made steel nibs by the million from the 1830s. Josiah Mason and Joseph Gillott led the trade." },
];
export const quillOf = (id) => QUILLS.find((q) => q.id === id) || QUILLS[0];

export const SEALS = [
  { id: "sl-red", name: "Red shellac wax", price: 0, c: "#E8483B", edge: "#8a1a10", note: "From the 1500s sealing wax was made with shellac, from lac insects, and coloured red with vermilion." },
  { id: "sl-beeswax", name: "Beeswax and resin", price: 30, c: "#d8a84a", edge: "#7a5212", note: "Medieval seals were mostly beeswax mixed with resin, often left its own natural colour." },
  { id: "sl-green", name: "Green wax", price: 30, c: "#2E8E4B", edge: "#0c4a24", note: "French royal charters meant to last forever hung green wax seals on silk cords. Yellow wax was for lesser acts." },
  { id: "sl-black", name: "Mourning black", price: 40, c: "#2a2a2a", edge: "#000000", note: "Victorians sealed letters with black wax while in mourning, so the news showed before the letter was opened." },
  { id: "sl-lead", name: "Papal lead", price: 40, c: "#8a929a", edge: "#4a525a", note: "Popes sealed their letters with a lead disc called a bulla. That is why a papal letter is called a bull." },
  { id: "sl-gold", name: "Golden Bull", price: 50, c: "#E2B04A", edge: "#7a5212", note: "Emperor Charles IV's Golden Bull of 1356 set how emperors were elected. It took its name from its gold seal." },
];
export const sealOf = (id) => SEALS.find((s) => s.id === id) || SEALS[0];

export function scriptVars(prog = {}) {
  const q = quillOf(prog.wrenquill), s = sealOf(prog.wrenseal);
  return { "--wren-quill": q.c, "--wren-quill-edge": q.edge, "--wren-wax": s.c, "--wren-wax-edge": s.edge };
}
export const SCRIPT_SHELF_CSS = `.wr-qs{stroke:var(--wren-quill,#f4eee0)}.wr-qf{fill:var(--wren-quill,#f4eee0);stroke:var(--wren-quill-edge,#b8a582)}
.wr-wax{fill:var(--wren-wax,#E8483B);stroke:var(--wren-wax-edge,#8a1a10)}`;

const card = (inner) => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect width="200" height="200" rx="16" fill="#F1E4C6"/>${Array.from({ length: 9 }, (_, i) => `<path d="M20 ${30 + i * 18}H180" stroke="#C9B58A" stroke-width=".8"/>`).join("")}${inner}</svg>`;
const quillCard = (q) => card(q.id === "ql-reed" || q.id === "ql-steel"
  ? `<path d="M60 170L150 40" stroke="${q.c}" stroke-width="12" stroke-linecap="round"/><path d="M60 170L150 40" stroke="${q.edge}" stroke-width="1.5"/><path d="M60 170l-8 14l14 -8z" fill="${q.edge}"/><path d="M40 180q40 -14 80 -4" stroke="#1d2340" stroke-width="3" fill="none"/>`
  : `<path d="M60 170L140 40" stroke="${q.c}" stroke-width="4"/><path d="M140 40C176 66 168 130 116 168C118 120 126 80 140 40Z" fill="${q.c}" stroke="${q.edge}" stroke-width="2"/><path d="M138 48L118 160" stroke="${q.edge}" stroke-width="1.2"/><path d="M60 170l-6 14" stroke="#1d2340" stroke-width="3"/><path d="M36 182q40 -14 80 -4" stroke="#1d2340" stroke-width="3" fill="none"/>`);
const sealCard = (s) => card(`<rect x="40" y="40" width="120" height="84" fill="#fbf5e6" stroke="#C9B58A" stroke-width="2"/><path d="M40 40L100 90L160 40" fill="none" stroke="#C9B58A" stroke-width="2"/>
  ${s.id === "sl-green" ? `<path d="M92 120v48M108 120v48" stroke="#2E8E4B" stroke-width="3"/>` : ""}<circle cx="100" cy="${s.id === "sl-green" ? 160 : 104}" r="30" fill="${s.c}" stroke="${s.edge}" stroke-width="3"/><circle cx="100" cy="${s.id === "sl-green" ? 160 : 104}" r="20" fill="none" stroke="${s.edge}" stroke-width="2"/><text x="100" y="${s.id === "sl-green" ? 168 : 112}" text-anchor="middle" font-family="Uncial Antiqua,Georgia,serif" font-size="24" fill="${s.edge}">W</text>`);
const talk = (open, tryon, buy) => ({ open, tryon, buy });
export const quillShop = {
  kind: "wrenquill", label: "🪶 Wren's pens",
  items: QUILLS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: talk(["Pens, strictly speaking. Feathers, reeds and one bit of steel.", "Every one of these wrote real books. Pick the one I hold.", "Choose a pen. I'll cut the nib myself."],
    ["{item}. Feels right in the hand.", "{item}. Mind the blots, {name}.", "{item}. A clean line already."],
    ["{item}, mine for good. Thank you, {name}.", "{item}. I'll keep it sharp.", "{item}. My hand writes neater just holding it."]),
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(quillCard(quillOf(id))); ctx.cap("🪶 " + quillOf(id).name); },
};
export const sealShop = {
  kind: "wrenseal", label: "🔏 Sealing waxes",
  items: SEALS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: talk(["Sealing wax. The colour told the reader something before they broke it.", "Wax for my badge and my seal. Each colour had a meaning.", "Pick a wax. Popes, emperors and widows all had theirs."],
    ["{item}. Warm, isn't it?", "{item}. Press firmly, then don't touch.", "{item}. Very official."],
    ["{item}, on my badge for good. Thank you, {name}.", "{item}. Sealed and sent.", "{item}. Nobody's opening this without me knowing."]),
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(sealCard(sealOf(id))); ctx.cap("🔏 " + sealOf(id).name); },
};

/** Six more Scriptorium relics (📜 scrolls), at the spots the Observatory's Phase 4 relics use. */
export const MORE_SCRIPT_RELICS = [
  { id: "sc-chained", e: "⛓️", name: "Chained library shelf", price: 12, note: "Hereford Cathedral's books are still chained to their shelves, in cases set up in 1611. Books were worth stealing.", x: 0, y: 26, w: 12, vb: "0 0 100 120",
    art: () => `<rect x="6" y="4" width="88" height="112" fill="#4a3018" stroke="#2a1a0a" stroke-width="2"/><rect x="10" y="58" width="80" height="4" fill="#2a1a0a"/>${[0, 1].map((r) => Array.from({ length: 5 }, (_, i) => `<rect x="${14 + i * 15}" y="${14 + r * 52}" width="12" height="40" fill="${["#7a1a10", "#3D6BE0", "#5a3a1a", "#2E6E4B", "#8a5a2a"][(i + r) % 5]}" stroke="#2a1a0a"/>`).join("")).join("")}<path class="hr-sway" d="M20 50q20 18 40 4q10 -8 30 2" stroke="#b8c2d0" stroke-width="2" stroke-dasharray="3 2" fill="none"/>` },
  { id: "sc-waxtab", e: "📝", name: "Wax tablet and stylus", price: 14, note: "Romans wrote on wax in a wooden frame with a pointed stylus, then rubbed it smooth with the flat end to reuse it.", x: 17, y: 64, w: 8, vb: "0 0 80 100",
    art: () => `<ellipse cx="40" cy="96" rx="30" ry="3" fill="#000" opacity=".35"/><rect x="8" y="10" width="56" height="80" rx="3" fill="#8a5a2a" stroke="#4A3A2C" stroke-width="2"/><rect x="14" y="16" width="44" height="68" fill="#3a2a1a"/>${Array.from({ length: 6 }, (_, i) => `<path d="M18 ${26 + i * 10}h${20 + ((i * 7) % 16)}" stroke="#c8a870" stroke-width="1.4"/>`).join("")}<g class="hr-quill" style="transform-origin:66px 50px"><path d="M60 92L76 8" stroke="#C9CED8" stroke-width="3" stroke-linecap="round"/></g>` },
  { id: "sc-phaistos", e: "🌀", name: "Phaistos disc", price: 16, note: "A clay disc found on Crete in 1908, with over 240 stamped signs in a spiral on both sides. Nobody has read it.", x: 36, y: 2, w: 9, vb: "0 0 100 100",
    art: () => `<circle cx="50" cy="50" r="44" fill="#c89a6a" stroke="#6a4a2a" stroke-width="2"/><path class="hr-spin" style="transform-origin:50px 50px" d="M50 50m0 -6a6 6 0 1 1 -6 6a12 12 0 1 1 12 12a18 18 0 1 1 -18 -18a24 24 0 1 1 24 24a30 30 0 1 1 -30 -30" fill="none" stroke="#6a4a2a" stroke-width="1.6"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${(50 + Math.cos(i * 0.9) * (12 + i * 2.4)).toFixed(1)}" cy="${(50 + Math.sin(i * 0.9) * (12 + i * 2.4)).toFixed(1)}" r="2" fill="#4a2a10"/>`).join("")}` },
  { id: "sc-vindolanda", e: "🪵", name: "Vindolanda tablet", price: 18, note: "Around AD 100, Claudia Severa invited a friend to her birthday on a thin wooden tablet near Hadrian's Wall. It survives.", x: 88, y: 2, w: 10, vb: "0 0 120 70",
    art: () => `<rect x="4" y="2" width="112" height="4" rx="2" fill="#7a5a3a"/><g class="hr-sway"><rect x="10" y="8" width="100" height="56" rx="2" fill="#c8a870" stroke="#6a4a2a" stroke-width="1.5"/><path d="M60 8v56" stroke="#6a4a2a" stroke-width="1"/>${Array.from({ length: 5 }, (_, i) => `<path d="M16 ${18 + i * 9}q10 -3 ${36 - (i % 2) * 8} 0M66 ${18 + i * 9}q10 -3 ${34 - (i % 3) * 6} 0" stroke="#2a1a0a" stroke-width="1.2" fill="none"/>`).join("")}</g>` },
  { id: "sc-scytale", e: "🌀", name: "Spartan scytale", price: 22, note: "Plutarch says Spartans wound a strip round a rod to write orders. Unwound, the letters were jumbled until rewound on a matching rod.", x: 93, y: 72, w: 7, vb: "0 0 60 130",
    art: () => `<ellipse cx="30" cy="126" rx="20" ry="3" fill="#000" opacity=".35"/><rect x="22" y="6" width="16" height="118" rx="6" fill="#7a4a22" stroke="#3a1a0a"/>${Array.from({ length: 10 }, (_, i) => `<path d="M20 ${14 + i * 11}L40 ${22 + i * 11}" stroke="#F1E4C6" stroke-width="7"/><text x="30" y="${21 + i * 11}" text-anchor="middle" font-size="6" fill="#4A3A2C" font-family="Georgia,serif">${"ΣΠΑΡΤΗΝΙΚΑΩ"[i]}</text>`).join("")}` },
  { id: "sc-type", e: "🔠", name: "Gutenberg's type", price: 26, note: "Gutenberg cast metal letters that could be set, printed and reused. His Bible was finished at Mainz around 1455.", x: 18, y: 86, w: 8, vb: "0 0 100 80",
    art: () => `<ellipse cx="50" cy="76" rx="42" ry="4" fill="#000" opacity=".35"/><rect x="8" y="30" width="84" height="44" fill="#5a3a1a" stroke="#2a1a0a" stroke-width="2"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${14 + i * 13}" y="${12 + (i % 2) * 4}" width="10" height="${22 - (i % 2) * 4}" fill="#9aa6b0" stroke="#4a525a"/><text x="${19 + i * 13}" y="${22 + (i % 2) * 2}" text-anchor="middle" font-size="8" fill="#2a2a2a" font-family="Georgia,serif">${"MAINZ*"[i]}</text>`).join("")}<path class="hr-glint" d="M14 14l8 -4" stroke="#fff" stroke-width="2" opacity=".5"/>` },
];
