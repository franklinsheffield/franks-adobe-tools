// House 5: the Scriptorium (#🪶-scriptorium). Host: Archivist Wren (they), who keeps the marks (the SiM Librarian bot
// keeps the books; they are two different characters). Wren reuses the Oracle's figure rig with a hood trimmed in quill
// feathers, a red wax-seal badge and an eye the colour of the ink you choose. Brand brief: brand/houses/README.md (House 5).
// Every fact in Wren's lines is real; they label modern uses and never invent meanings for symbols.
import { vinylSvg } from "../player.js";
import { deskSceneHtml, codexSvg, propsSvg, headSvg, react, DESK_EMOTES, DESK_CSS, habitOf, habitShop } from "./scriptorium-desk.js";
import { coatOverlay } from "./alchemist-lab.js";
import { menuBg as WREN_MENU_BG, secrets as MARGINALIA_SECRETS } from "../scriptorium/marginalia.js";

const NS = "http://www.w3.org/2000/svg";

/** Inks and pigments. Iris gradient: light, mid, deep. */
export const INKS = [
  { id: "ink-irongall", name: "Iron-gall ink", price: 0, iris: ["#d8ccb4", "#3b2f2a", "#120c08"], note: "Iron salts and oak-gall tannins. Europe's standard ink for over a thousand years. Too acidic, it can eat through the page." },
  { id: "ink-carbon", name: "Carbon ink", price: 30, iris: ["#d0d0d0", "#2a2a2a", "#050505"], note: "Soot in gum and water. Most of the Dead Sea Scrolls are written in carbon ink." },
  { id: "ink-vermilion", name: "Vermilion", price: 30, iris: ["#ffb3a8", "#E8483B", "#7a1408"], note: "Red mercury sulfide. Scribes wrote headings in red: 'rubric' comes from the Latin for red." },
  { id: "ink-ultramarine", name: "Ultramarine", price: 40, iris: ["#c8d6ff", "#3D6BE0", "#14266b"], note: "Ground lapis lazuli, mined in Afghanistan. In medieval Europe it could cost more than gold." },
  { id: "ink-malachite", name: "Malachite green", price: 40, iris: ["#c8f5d8", "#2E9E5B", "#0c4a24"], note: "A green copper mineral, ground for paint since ancient Egypt." },
  { id: "ink-orpiment", name: "Orpiment yellow", price: 40, iris: ["#fff3b0", "#E9B92F", "#7a5a08"], note: "A bright yellow arsenic sulfide. Cennino Cennini warned painters around 1400 to keep it away from their mouths." },
  { id: "ink-gold", name: "Gold leaf", price: 50, iris: ["#fff6c8", "#E2B04A", "#7a5212"], note: "Gold beaten thinner than paper, laid on a raised ground and burnished. That shine is why we say 'illuminated'." },
  { id: "ink-tyrian", name: "Tyrian purple", price: 60, iris: ["#f0c8e8", "#8E2A6E", "#3a0a2c"], note: "Dye from murex sea snails: thousands for a single gram. Some luxury books were written on purple-dyed vellum." },
];
export const inkOf = (id) => INKS.find((l) => l.id === id) || INKS[0];

const inkPot = (k) => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect width="200" height="200" rx="16" fill="#F1E4C6"/>${Array.from({ length: 9 }, (_, i) => `<path d="M20 ${30 + i * 18}H180" stroke="#C9B58A" stroke-width=".8"/>`).join("")}
  <path d="M70 150q-6 -40 10 -56h40q16 16 10 56z" fill="${k.iris[1]}" stroke="#4A3A2C" stroke-width="3"/><rect x="82" y="84" width="36" height="12" rx="3" fill="#4A3A2C"/>
  <path d="M28 168q50 -20 100 -6" stroke="${k.iris[1]}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M128 40L150 20L98 104L94 110Z" fill="#fff" stroke="#4A3A2C" stroke-width="1.5"/></svg>`;

/** The store shelf (department "House hosts"). prog.ink = the ink in Archivist Wren's eye. */
export const inkShop = {
  kind: "ink", label: "🪶 Wren's inks and pigments",
  items: INKS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["Inks and pigments, each one a real recipe. Scribes mixed their own.", "Every colour on a medieval page came from somewhere: a mineral, a plant, a snail.", "Choose an ink and I'll wear it in my eye. It's a scribe thing."],
    tryon: ["{item}. Look at that colour, {name}. Somebody ground that by hand.", "{item}. Lovely. Mind the drips.", "{item}. My eye looks freshly written."],
    buy: ["{item}, in the pot. Every mark means something.", "{item}! I'll rule a line just to try it.", "{item}, yours. I'll keep the lid on tight."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(inkPot(inkOf(id))); ctx.cap("🪶 " + inkOf(id).name); },
};

/** Scriptorium relics: permanent fixtures in Wren's House, bought only with 📜 scrolls. Notes are real history. */
const ST = `<linearGradient id="hrs2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a89c88"/><stop offset=".5" stop-color="#7a6e5c"/><stop offset="1" stop-color="#3e362a"/></linearGradient>`;
export const SCRIPT_RELICS = [
  { id: "sc-quill", e: "🪶", name: "Quill and inkwell", price: 4, note: "Goose quills were Europe's main pen until steel nibs took over in the 1800s.", x: 82, y: 84, w: 9, vb: "0 0 100 90",
    art: () => `<ellipse cx="50" cy="86" rx="36" ry="4" fill="#000" opacity=".35"/><path d="M30 86q-4 -26 8 -34h24q12 8 8 34z" fill="#2a2a2a" stroke="#4A3A2C" stroke-width="2"/><rect x="36" y="46" width="28" height="8" rx="2" fill="#4A3A2C"/><g class="hr-quill" style="transform-origin:52px 52px"><path d="M52 52L86 4q6 10 -4 24q-14 18 -28 26z" fill="#F1E4C6" stroke="#4A3A2C"/><path d="M54 50L84 8" stroke="#4A3A2C" stroke-width=".8"/></g>` },
  { id: "sc-seal", e: "🔏", name: "Seal and wax", price: 6, note: "A seal matrix pressed its owner's design into hot wax, so a letter showed who sent it and that nobody had opened it.", x: 92, y: 42, w: 7, vb: "0 0 70 110",
    art: () => `<ellipse cx="35" cy="106" rx="26" ry="3" fill="#000" opacity=".35"/><path d="M26 10h18l-2 60h-14z" fill="#5a3a1a"/><ellipse cx="35" cy="10" rx="10" ry="6" fill="#7a4a22"/><path d="M22 70h26l4 12h-34z" fill="#B8893A"/><circle cx="35" cy="96" r="12" fill="#E8483B" stroke="#8a1a10" stroke-width="2" class="hr-thump"/><path d="M30 92l10 8M40 92l-10 8" stroke="#8a1a10" stroke-width="1.4"/>` },
  { id: "sc-tablet", e: "🧱", name: "Cuneiform tablet", price: 8, note: "The oldest writing we know comes from Uruk in Mesopotamia, around 3200 BC, pressed into clay with a reed.", x: 80, y: 14, w: 13, vb: "0 0 100 100",
    art: () => `<path d="M8 12q42 -12 84 0l-4 80q-38 10 -76 0z" fill="#c89a6a" stroke="#6a4a2a" stroke-width="2"/>${Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => `<path d="M${18 + c * 12} ${24 + r * 12}l6 2l-6 2z" fill="#6a4a2a"/>`).join("")).join("")}<path class="hr-glint" d="M14 18l12 -3" stroke="#fff" stroke-width="2" opacity=".5"/>` },
  { id: "sc-ogham", e: "🪨", name: "Ogham stone", price: 10, note: "Ogham is early Irish written as notches along a stone's edge, mostly from the 4th to 6th centuries.", x: 80, y: 58, w: 13, vb: "0 0 100 140",
    art: () => `<defs>${ST}</defs><ellipse cx="50" cy="136" rx="34" ry="4" fill="#000" opacity=".35"/><path d="M28 136L22 30q6 -24 28 -26q24 4 26 30l-4 102z" fill="url(#hrs2)" stroke="#3e362a" stroke-width="2"/><path d="M50 6V136" stroke="#3e362a" stroke-width="1.4"/>${[16, 24, 30, 42, 50, 58, 72, 80, 92, 104, 112, 120].map((y, i) => `<path d="M${i % 3 === 0 ? 50 : 42} ${y}h${i % 3 === 0 ? 10 : 16}" stroke="#2a241c" stroke-width="2.2"/>`).join("")}` },
  { id: "sc-jelling", e: "🪨", name: "Jelling rune stone", price: 12, note: "Harald Bluetooth raised this stone in Denmark around 965. Its runes say he made the Danes Christian.", x: 2, y: 54, w: 15, vb: "0 0 100 130",
    art: () => `<defs>${ST}</defs><ellipse cx="50" cy="126" rx="42" ry="4" fill="#000" opacity=".35"/><path d="M10 126q-6 -70 18 -110q24 -14 50 4q22 40 14 106z" fill="url(#hrs2)" stroke="#3e362a" stroke-width="2"/><path class="hr-band" d="M24 116q-4 -60 14 -92q14 -8 28 0q16 34 12 92" fill="none" stroke="#E8483B" stroke-width="6" opacity=".85"/><text x="50" y="72" text-anchor="middle" font-family="Noto Sans Runic,serif" font-size="13" fill="#F1E4C6" transform="rotate(-90 50 72)">ᚼᛅᚱᛅᛚᛏᚱ</text>` },
  { id: "sc-rosetta", e: "🗿", name: "Rosetta Stone cast", price: 15, note: "A 196 BC decree in hieroglyphs, Demotic and Greek. Champollion used it to crack hieroglyphs in 1822.", x: 62, y: 3, w: 13, vb: "0 0 110 120",
    art: () => `<path d="M14 18L40 4L84 8L100 26L104 116H8Z" fill="#2e2b2e" stroke="#4A3A2C" stroke-width="2"/>${[0, 1, 2].map((b) => Array.from({ length: 4 }, (_, i) => `<path d="M${18 + (b === 0 ? 6 : 0)} ${30 + b * 30 + i * 6}h${70 - (b === 0 ? 12 : 0)}" stroke="#a8a2a8" stroke-width="${b === 0 ? 2.2 : 1.2}" stroke-dasharray="${b === 0 ? "4 2 6 3" : b === 1 ? "2 1" : "5 1"}"/>`).join("")).join("")}<path class="hr-glint" d="M20 24l14 -8" stroke="#fff" stroke-width="2" opacity=".4"/>` },
  { id: "sc-kells", e: "📖", name: "Book of Kells page", price: 20, note: "A gospel book made around 800, probably begun on Iona. Its knotwork is so fine some lines need a magnifier.", x: 2, y: 85, w: 14, vb: "0 0 140 70",
    art: () => `<path d="M4 66L8 6q30 -6 62 4q32 -10 62 -4l4 60q-34 -6 -66 4q-32 -10 -66 -4z" fill="#F1E4C6" stroke="#4A3A2C" stroke-width="1.5"/><path d="M70 10v60" stroke="#C9B58A"/><rect x="16" y="14" width="22" height="26" fill="#3D6BE0"/><text x="27" y="35" text-anchor="middle" font-family="Uncial Antiqua,serif" font-size="22" fill="#E2B04A" class="hr-gild">X</text>${Array.from({ length: 6 }, (_, i) => `<path d="M${i < 3 ? 42 : 16} ${18 + i * 8}h${i < 3 ? 22 : 48}" stroke="#4A3A2C" stroke-width="1.4"/>`).join("")}${Array.from({ length: 7 }, (_, i) => `<path d="M78 ${16 + i * 7}h48" stroke="${i === 0 ? "#E8483B" : "#4A3A2C"}" stroke-width="1.4"/>`).join("")}` },
  { id: "sc-horn", e: "📯", name: "Golden horn of Gallehus", price: 30, note: "Two gold horns found in Denmark in 1639 and 1734. The second carried a maker's runic signature from about AD 400. Both were stolen and melted in 1802; only copies survive.", x: 24, y: 2, w: 12, vb: "0 0 110 110",
    art: () => `<defs><linearGradient id="hrh2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#E2B04A"/><stop offset="1" stop-color="#7a5212"/></linearGradient></defs><path d="M10 6q50 0 50 30" stroke="#4A3A2C" stroke-width="1.5" fill="none"/><path class="hr-shine" d="M14 16Q90 20 98 100L80 104Q76 40 12 30Z" fill="url(#hrh2)" stroke="#7a5212" stroke-width="1.5"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${18 + i * 10} ${20 + i * 11}q8 -4 ${12 - i} 2" stroke="#7a5212" stroke-width="1.4" fill="none"/>`).join("")}<ellipse cx="89" cy="102" rx="10" ry="4" fill="#7a5212"/>` },
];

/** The Hurdy-Gurdy: Wren's own player for the shared music pool. The record turns as its wheel (classes tt, tt-disc). */
export function hurdySvg(t, playing) {
  const disc = t ? `<g transform="translate(70 36) scale(.72)">${vinylSvg(t, 100).replace(/<svg[^>]*>|<\/svg>/g, "")}</g>` : `<circle cx="106" cy="72" r="36" fill="#26262c"/>`;
  return `<svg class="tt hg${playing ? " playing" : ""}" viewBox="0 0 260 190" aria-hidden="true">
  <defs><linearGradient id="hg-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b07a46"/><stop offset=".6" stop-color="#6a3e1c"/><stop offset="1" stop-color="#2e1a0a"/></linearGradient></defs>
  <path d="M30 120Q20 70 70 56L180 50Q236 56 236 110Q236 168 180 172L70 176Q24 170 30 120Z" fill="url(#hg-wood)" stroke="#1C1710" stroke-width="2"/>
  <path d="M60 64L230 70" stroke="#F1E4C6" stroke-width=".8" opacity=".6"/><path d="M60 72L230 78" stroke="#F1E4C6" stroke-width=".8" opacity=".6"/>
  <rect x="140" y="96" width="80" height="24" rx="4" fill="#1C1710" stroke="#4A3A2C"/>${Array.from({ length: 8 }, (_, i) => `<rect class="hg-key hg-k${i % 3}" x="${144 + i * 9.4}" y="100" width="6" height="16" rx="1.5" fill="#F1E4C6"/>`).join("")}
  <g class="tt-disc" style="transform-origin:106px 72px">${disc}</g>
  <circle cx="106" cy="72" r="40" fill="none" stroke="#4A3A2C" stroke-width="3"/>
  <g class="hg-crank" style="transform-origin:46px 140px"><path d="M46 140L22 150" stroke="#B8893A" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="150" r="5" fill="#E8483B"/></g><circle cx="46" cy="140" r="6" fill="#B8893A"/>
  <circle cx="180" cy="148" r="14" fill="#E8483B" stroke="#8a1a10" stroke-width="2"/><path d="M174 142l12 12M186 142l-12 12" stroke="#8a1a10" stroke-width="1.4"/>
  <circle class="tt-led" cx="214" cy="150" r="4" fill="${playing ? "#E8483B" : "#3a3a3a"}"/>
</svg>`;
}

export const SCRIPTORIUM_CSS = `
body[data-house="scriptorium"] .speaker{color:#E8483B;font-family:"Uncial Antiqua",Georgia,serif;letter-spacing:.06em}
body[data-house="scriptorium"] .gate-title{color:#E8483B;font-family:"Uncial Antiqua",Georgia,serif}
.hg.playing .hg-crank{animation:hr-spin 1.6s linear infinite}.hg.playing .hg-k1{animation:hg-key .6s ease-in-out infinite alternate}.hg.playing .hg-k2{animation:hg-key .8s ease-in-out infinite alternate-reverse}
@keyframes hg-key{to{transform:translateY(2px)}}@keyframes hr-spin{to{transform:rotate(360deg)}}
.h-wren .hk-feather{animation:hk-ruffle 5s ease-in-out infinite alternate;transform-origin:center bottom;transform-box:fill-box}@keyframes hk-ruffle{to{transform:rotate(4deg)}}
.hr-quill{animation:hr-scribe 3s ease-in-out infinite}@keyframes hr-scribe{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}50%{transform:rotate(3deg)}75%{transform:rotate(-2deg)}}
.hr-glint,.hr-gild,.hr-shine{animation:hr-tw 3s ease-in-out infinite}@keyframes hr-tw{0%,100%{opacity:.55}50%{opacity:1}}
.hr-thump{animation:hr-thump 4s ease-in-out infinite;transform-origin:35px 96px}@keyframes hr-thump{0%,80%,100%{transform:scale(1)}85%{transform:scale(.9)}}
.hr-band{stroke-dasharray:6 3;animation:hr-band 12s linear infinite}@keyframes hr-band{to{stroke-dashoffset:-90}}
@media (prefers-reduced-motion: reduce){.hg.playing .hg-crank,.hg.playing .hg-key,.h-wren .hk-feather,[class^="hr-"],[class*=" hr-"]{animation:none}}`;

/** Dress the shared figure as Archivist Wren: dark vellum hood trimmed with quill feathers, red wax-seal badge, ink eye. */
function paint(svg, prog, id = "t") {
  if (!svg) return;
  const stops = (gid, cols) => svg.querySelectorAll(`#${id}-${gid} stop`).forEach((s, i) => cols[i] && s.setAttribute("stop-color", cols[i]));
  const K = inkOf(prog && prog.ink);
  const C = prog && prog.habit ? habitOf(prog.habit) : null;
  stops("face", ["#F1E4C6", "#C9B58A", "#4A3A2C"]); stops("hood", C ? C.hood : ["#3a2c1c", "#1C1710", "#080604"]); stops("iris", K.iris);
  svg.querySelectorAll('.o-body [stroke="#E2B04A"], .o-body [data-trim], .o-sleeves, .o-sleeves [data-trim]').forEach((e) => { if (!e.closest(".o-hands")) e.setAttribute("stroke", C ? C.trim : "#E8483B"); });
  const body = svg.querySelector(".o-body"), eye = svg.querySelector(".o-eye"); if (!body || !eye) return;
  svg.querySelector(".h-wren")?.remove();
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "h-wren");
  const feather = (x, y, r, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path class="hk-feather" d="M0 0Q-8 -24 0 -46Q8 -24 0 0Z" fill="#F1E4C6" stroke="#4A3A2C" stroke-width=".8"/><path d="M0 0V-44" stroke="#4A3A2C" stroke-width=".8"/>${[10, 18, 26, 34].map((d) => `<path d="M0 -${d}l-4 -3M0 -${d}l4 -3" stroke="#C9B58A" stroke-width=".6"/>`).join("")}</g>`;
  g.innerHTML = `${headSvg()}${feather(224, 66, 24)}${feather(232, 70, 40, 0.8)}${feather(176, 66, -24, 0.9)}
    <path d="M160 150q-4 10 2 16M240 150q4 10 -2 16" stroke="${K.iris[1]}" stroke-width="2" fill="none" opacity=".6"/>
    <g transform="translate(200 92)"><path d="M-12 -4q-2 -9 6 -11q4 -5 10 -1q8 -2 9 6q6 4 2 10q2 8 -6 9q-4 6 -11 2q-8 2 -9 -6q-6 -4 -1 -9z" fill="#E8483B" stroke="#8a1a10" stroke-width="1.2"/>
      <path d="M-8 6L8 -8" stroke="#F1E4C6" stroke-width="2" stroke-linecap="round"/><path d="M8 -8q4 -2 3 3z" fill="#F1E4C6"/><circle r="9" fill="none" stroke="#8a1a10" stroke-width=".8"/></g>
    <path d="M152 186h96" stroke="#E8483B" stroke-width="1" opacity=".5"/><path d="M152 192h96" stroke="#3D6BE0" stroke-width="1" opacity=".4"/>`;
  eye.after(g);
  svg.querySelector(".hv-coat")?.remove(); if (C && body.children[4]) body.children[4].insertAdjacentHTML("afterend", coatOverlay(C)); // their habit or gown, over the robe
  const ball = svg.querySelector(".o-ball"), hands = svg.querySelector(".o-hands"); // an open codex on a lectern stands where the crystal ball was
  if (ball) { ball.querySelector(".wc-codex")?.remove(); ball.insertAdjacentHTML("beforeend", codexSvg(id)); }
  if (hands) { hands.querySelector(".wc-props")?.remove(); hands.insertAdjacentHTML("beforeend", propsSvg()); }
  for (const side of ["L", "R"]) { const h = svg.querySelector(".o-hand" + side); if (h) { h.querySelectorAll(".hg").forEach((e) => e.remove()); h.insertAdjacentHTML("beforeend", wrenHand(side)); } }
}
/** Archivist Wren's hands: bare, ink on the fingertips. At rest they hold a goose quill (right) and a penknife for
 *  trimming it (left), as medieval scribes did; gestures: snap = an ink drop splashes, point = the quill draws a line,
 *  swat = a loose page flutters. */
const wrenHand = (side) => (side === "R"
  ? `<g class="hg hg-quill"><path d="M164 262 L196 168" stroke="#f4eee0" stroke-width="3"/><path d="M196 168 C214 182 210 216 186 238 C186 214 190 190 196 168Z" fill="#f4eee0" stroke="#b8a582"/><path d="M164 262 l-3 8" stroke="#1d2340" stroke-width="2.4" stroke-linecap="round"/></g>
    <g class="hg hg-line" fill="none" stroke="#1d2340" stroke-width="3" stroke-linecap="round"><path d="M160 272 q20 -8 40 0 t40 0"/></g>
    <g class="hg hg-ink">${[[160, 272, 5], [172, 266, 3], [150, 266, 2.6], [166, 282, 2.2]].map(([x, y, r], i) => `<circle style="--d:${i * 0.04}s" cx="${x}" cy="${y}" r="${r}" fill="#1d2340"/>`).join("")}</g>`
  : `<g class="hg hg-knife"><path d="M150 258 L176 226" stroke="#c4ccd6" stroke-width="5" stroke-linecap="round"/><path d="M146 264 L156 252" stroke="#6a4022" stroke-width="7" stroke-linecap="round"/></g>`)
  + `<g class="hg hg-page"><path d="M140 250 L172 238 L178 262 L146 274Z" fill="#f3e6c6" stroke="#b8a582"/><path d="M148 256 L170 248 M150 262 L172 254" stroke="#b8a582"/></g>`;
export const WREN_HANDS_CSS = `
body[data-house="scriptorium"] .o-hands [data-skin="fill"]{fill:#d8b48c}body[data-house="scriptorium"] .o-hands [data-skin="stroke"]{stroke:#d8b48c}
body[data-house="scriptorium"] .o-hands [data-edge]{stroke:#7a5a3a}body[data-house="scriptorium"] .o-hands .o-nail{fill:#1d2340}body[data-house="scriptorium"] .o-hands .o-peye{display:none}
body[data-house="scriptorium"] .teller:not([data-mood]):not([data-gesture]) .o-hands .o-handR{animation:wr-write 1.6s ease-in-out infinite}
body[data-house="scriptorium"] .teller:not([data-mood]):not([data-gesture]) .o-hands .o-handL{animation:wr-hold 5s ease-in-out infinite}
body[data-house="scriptorium"] .teller:not([data-mood]) .o-hand .o-f{animation:none;transform:rotate(40deg)}
body[data-house="scriptorium"] .teller:not([data-mood]):not([data-gesture]) .hg-quill,body[data-house="scriptorium"] .teller:not([data-mood]):not([data-gesture]) .hg-knife{opacity:1}
@keyframes wr-write{0%,100%{transform:translate(10px,-8px) rotate(-4deg)}25%{transform:translate(14px,-6px) rotate(-2deg)}50%{transform:translate(18px,-9px) rotate(-4deg)}75%{transform:translate(14px,-7px) rotate(-6deg)}}
@keyframes wr-hold{0%,100%{transform:translate(8px,-6px) rotate(4deg)}50%{transform:translate(8px,-9px) rotate(3deg)}}
.hg{opacity:0;pointer-events:none}
body[data-house="scriptorium"] [data-gesture="snap"] .hg-ink{opacity:1}body[data-house="scriptorium"] [data-gesture="snap"] .hg-ink circle{animation:wr-splat .45s ease-out both;animation-delay:calc(.2s + var(--d));transform-box:fill-box;transform-origin:50% 50%}
body[data-house="scriptorium"] [data-gesture="point"] .hg-quill{opacity:1}body[data-house="scriptorium"] [data-gesture="point"] .hg-line{opacity:1;stroke-dasharray:90;animation:wr-draw 1.2s ease-out both}
body[data-house="scriptorium"] [data-gesture="swatL"] .o-handL .hg-page,body[data-house="scriptorium"] [data-gesture="swatR"] .o-handR .hg-page{opacity:1;animation:wr-flutter .43s ease-out both;transform-box:fill-box;transform-origin:50% 50%}
@keyframes wr-splat{0%{transform:scale(0)}60%{transform:scale(1.4)}100%{transform:scale(1)}}@keyframes wr-draw{from{stroke-dashoffset:90}to{stroke-dashoffset:0}}@keyframes wr-flutter{to{transform:translate(-30px,-26px) rotate(-40deg);opacity:0}}
@media (prefers-reduced-motion: reduce){body[data-house="scriptorium"] .teller .o-hand{animation:none!important}}`;

/** Swap the Oracle's name for Wren's in any line or menu. Rank names (Oracle-touched) and /oracle stay. */
const RENAME = [
  [/\bThe Oracle Chamber\b/g, "The Scriptorium"], [/\bthe Oracle Chamber\b/g, "the Scriptorium"], [/\bOracle Chamber\b/g, "Scriptorium"],
  [/\bTHE ORACLE\b/g, "ARCHIVIST WREN"], [/\b[Tt]he Oracle's\b/g, "Archivist Wren's"], [/\b[Tt]he Oracle\b/g, "Archivist Wren"],
  [/\bEnter the Chamber\b/g, "Enter the Scriptorium"], [/\b[Tt]he Chamber\b/g, (m) => (m[0] === "T" ? "The Scriptorium" : "the Scriptorium")],
  [/\b([Tt])he Record Player\b/g, "$1he Hurdy-Gurdy"], [/\brecord player\b/g, "hurdy-gurdy"], [/\bRecord player\b/g, "Hurdy-gurdy"],
  [/\bDraw today's card\b/g, "Today's inscription"], [/Readings, card games and real science, with a fortune teller who talks back/g, "Runes, glyphs and the signs people wrote, with a scribe who talks back"], [/(?<![\w/-])Oracle(?![\w-])/g, "Wren"],
];

const G = (mid1, mid2, win, lose) => ({ mid: [mid1, mid2], win: [win], lose: [lose] });

export const scriptorium = {
  id: "scriptorium", name: "Archivist Wren", house: "The Scriptorium", emoji: "🪶", accent: "#E8483B",
  channelIds: ["1575977195048927232"], // #🪶-scriptorium
  readings: false, rooms: ["inscriptions", "cipherdesk", "blackchamber", "decoder", "memory", "timeline", "grimoire", "possession"], daily: "decoder",
  // their voice is branded to the scriptorium: quick, nasal and reedy like a hurdy-gurdy's chanter string
  voice: { type: "triangle", base: 380, step: 34, vowel: 60, dur: 0.035, lp: 3600, band: 1500, mouth: 0.3, harm: [1.5, 0.12], brand: "reedy chanter",
    sting: { type: "triangle", notes: [[196, 0, 1.1, 0.12], [294, 0, 1.1, 0.1], [392, 0.22, 0.14], [440, 0.36, 0.14], [494, 0.5, 0.32, 0.22]] } }, // door sting: a hurdy-gurdy drone and a little tune
  css: SCRIPTORIUM_CSS + WREN_HANDS_CSS + DESK_CSS, paint, scene: deskSceneHtml, react, emotes: DESK_EMOTES, rename: (s) => RENAME.reduce((t, [re, to]) => t.replace(re, to), s),
  player: { name: "The Hurdy-Gurdy", deck: hurdySvg },
  shelves: [inkShop, habitShop],
  token: { id: "scroll", emoji: "📜", name: "scroll", plural: "scrolls", purse: "Scroll case" },
  relics: SCRIPT_RELICS, relicLabel: "📜 Scriptorium relics", relicBlurb: "Scriptorium relics stay on my shelves for good. Earn scrolls with your first visit each day and by beating game levels here.",
  strayIntro: "This slipped out from between two pages:",
  lines: {
    streak: ["{n} days in a row. I've noted it in the margin.", "{n} days running. Footnote: that is a habit."],
    greet: ["Welcome to the Scriptorium, {name}. Every mark means something. Shall we read a few?", "Strictly speaking, {name}, mind the ink. It's still wet. It's always still wet.",
      "Hello, {name}. I'm not a morning person. I'm a manuscript person."],
    idle: ["This is the Gallehus horn, about AD 400. Its maker signed it in runes: 'I, Hlewagastiz, made the horn.'",
      "The futhark is an alphabet, named after its first six letters. 'Rune magic' sets are a modern invention.",
      "Medieval scribes left notes in the margins. One Irish monk complained that his hand was tired. Another wrote a poem about his cat.",
      "Champollion is said to have fainted after shouting that he'd cracked hieroglyphs in 1822. Reading is exciting.",
      "Ogham was carved along the edge of a stone and read from the bottom up."],
    joke: ["I'd tell you a rune joke, but it's set in stone. Most runes were, actually.", "Old English had a letter called thorn: þ. 'Ye olde shoppe' is really 'the', written with a thorn.",
      "Monks wrote 'explicit' at the end of a book. It meant 'it is unrolled'. Times change.", "Vellum is calfskin. Every great book was, technically, a bit of a cow.",
      "Ampersand comes from '& per se and'. Schoolchildren recited it at the end of the alphabet."],
  },
  banter: {
    blackchamber: G("Count the letters first. Phelippes broke Mary's cipher that way in 1586.", "Three letters, again and again? Almost always THE, {name}.", "Broken before the rival! Reseal it neatly, {name}, the embassy will never know.", "The rival got there first. Rossignol broke a siege letter in 1628 the same way."),
    timeline: G("Dates first, {name}. Chronicles were often written long after the events.", "Medieval annals listed one or two events per year. Short, but dated.", "In order! A chronicle fit for the archive, {name}.", "Out of order. Even monks miscopied a date now and then."),
    grimoire: G("Read the leaf like a page: margins, veins, then the whole shape.", "The Vienna Dioscorides, about AD 512, painted plants for doctors.", "Named it! Pressed and catalogued, {name}.", "Not that one. Old herbals copied each other's mistakes too."),
    possession: G("Chaucer's pilgrims told tales to win a free supper. Write well, scribe.", "In the Decameron, ten people tell a hundred tales. We'll settle for fewer.", "Copied into the chronicle, {name}. Scheherazade told hers for 1,001 nights.", "The ink dried mid-tale. Even Chaucer never finished the Canterbury Tales."),
    inscriptions: G("Read the letters first. Roman carvers ran words together.", "Trajan's Column base, AD 113: the model for capital letters.", "Read and dated! The stone speaks again, {name}.", "Not quite. Weathered stone fools everyone. Look again."),
    cipherdesk: G("Count the letters first. E is the most common in English.", "Al-Kindi wrote down frequency analysis in the 800s.", "Cracked! Al-Kindi would nod, {name}. Quietly.", "Still scrambled. Even Mary, Queen of Scots' cipher was broken."),
    decoder: G("One rune read, {name}. That's how every scholar starts.", "Look at the shape first. Then the sound. Then the meaning.", "Deciphered! I'll write that in red, it deserves a rubric.", "Not quite. Scribes made mistakes too. That's why they had erasers: knives."),
    memory: G("Remember where each sign sits. Scribes memorised whole books.", "Two matching marks somewhere. Patience.", "Every pair found! Your memory is a fine library, {name}.", "Not a match. Even the best scribes reread their pages."),
  },
  poke: ["Careful, the seal is hot.", "Gently, {name}. These feathers are quills, not dusters.", "Poke me again and I'll footnote you."],
  perfect: ["Flawless, {name}. Not one blot on the page."],
  menuBg: WREN_MENU_BG, // the illuminated page behind the menu (scriptorium/marginalia.js)
  secrets: MARGINALIA_SECRETS, // "🪶 Marginalia": 20 finds
};
