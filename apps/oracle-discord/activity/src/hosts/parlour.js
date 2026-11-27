// House 4: the Séance Parlour (#🕯️-parlour). Host: Madame Rook (she), a former stage medium who now shows you the trick,
// as Houdini exposed mediums in the 1920s. She reuses the Oracle's figure rig with a plum velvet hood, a lace veil, a cameo
// brooch and a trick card tucked in the veil. Brand brief: brand/houses/README.md (House 4). Every fact in her lines is real.
import { vinylSvg } from "../player.js";

const NS = "http://www.w3.org/2000/svg";

/** Trick cards: each teaches one real conjuring or séance method. s = the corner mark, c = its ink. */
export const TRICK_CARDS = [
  { id: "trick-force", name: "The classic card force", price: 0, s: "♠", c: "#2A0F24", note: "You pick 'freely', but the magician times the spread so you take the card they planned." },
  { id: "trick-glimpse", name: "The glimpse", price: 30, s: "♣", c: "#2A0F24", note: "A secret look at one card, often the bottom one, while squaring the deck." },
  { id: "trick-key", name: "The key card", price: 30, s: "♦", c: "#B3123A", note: "A card the magician already knows ends up next to yours. Find the key, find your card." },
  { id: "trick-cold", name: "Cold reading", price: 40, s: "★", c: "#5B3A8A", note: "Statements that fit almost anyone. Psychologist Bertram Forer showed how convincing they feel in 1949." },
  { id: "trick-billet", name: "Billet reading", price: 40, s: "✉", c: "#5B3A8A", note: "Sitters write questions on folded slips. The 'one-ahead' method reads the next slip while 'divining' the last." },
  { id: "trick-raps", name: "Spirit raps", price: 40, s: "♥", c: "#B3123A", note: "The Fox sisters' rappings began Spiritualism in 1848. In 1888 Margaret Fox said they had cracked their toe joints." },
  { id: "trick-ecto", name: "Ectoplasm", price: 50, s: "☁", c: "#8A7F99", note: "Photos of 1920s séances show cheesecloth and cut-out faces passed off as spirit matter." },
  { id: "trick-pepper", name: "Pepper's ghost", price: 60, s: "◐", c: "#5B3A8A", note: "Angled glass reflects a lit, hidden actor onto the stage. Shown in London in 1862, still used in theme parks." },
];
export const trickOf = (id) => TRICK_CARDS.find((t) => t.id === id) || TRICK_CARDS[0];

const cardFace = (t, w = 1) => `<rect x="${-14 * w}" y="${-20 * w}" width="${28 * w}" height="${40 * w}" rx="${3 * w}" fill="#FFF6EE" stroke="#C3A6FF" stroke-width="${1.2 * w}"/>
  <rect x="${-11 * w}" y="${-17 * w}" width="${22 * w}" height="${34 * w}" rx="${2 * w}" fill="none" stroke="#E7A0B4" stroke-width="${0.6 * w}"/>
  <text x="0" y="${6 * w}" text-anchor="middle" font-size="${18 * w}" fill="${t.c}" font-family="DejaVu Sans,serif">${t.s}</text>`;
const trickCard = (t) => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect width="200" height="200" rx="16" fill="#2A0F24" stroke="#8A7F99" stroke-width="3"/>
  <path d="M10 10h180v180h-180z" fill="none" stroke="#E7A0B4" stroke-width="1" stroke-dasharray="1 4"/><g transform="translate(100 100) rotate(-6)">${cardFace(t, 3)}</g></svg>`;

/** The store shelf (department "House hosts"). prog.trickcard = the card tucked in Madame Rook's veil. */
export const trickShop = {
  kind: "trickcard", label: "🕯️ Madame Rook's trick cards",
  items: TRICK_CARDS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["Trick cards, darling. Each one is a real method. Learn it and nobody fools you twice.", "Every ghost has a method. These cards hold the methods.", "Mediums and magicians used the same tricks. Only the magicians admitted it."],
    tryon: ["{item}. Ooh. Now watch my hands. No, really, watch them.", "{item}. Mysterious, isn't it? It isn't, once you know.", "{item}. The spirits approve. The spirits are me."],
    buy: ["{item}, yours. I'll tuck it in my veil for luck. Luck is also a trick.", "{item}! Now you know how it's done. Use it kindly.", "{item}. Another secret out. Houdini would be thrilled."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(trickCard(trickOf(id))); ctx.cap("🕯️ " + trickOf(id).name); },
};

/** Parlour relics: permanent fixtures in Madame Rook's House, bought only with 🗝️ skeleton keys. Notes are real history. */
const BR = `<linearGradient id="hrp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FADE8C"/><stop offset=".5" stop-color="#B8893A"/><stop offset="1" stop-color="#5a3a12"/></linearGradient>`;
export const PARLOUR_RELICS = [
  { id: "rp-cuffs", e: "⛓️", name: "Houdini's handcuffs", price: 4, note: "Houdini spent his last years exposing fake mediums. His book A Magician Among the Spirits came out in 1924.", x: 82, y: 84, w: 9, vb: "0 0 100 70",
    art: () => `<ellipse cx="50" cy="66" rx="40" ry="4" fill="#000" opacity=".35"/><circle cx="28" cy="38" r="18" fill="none" stroke="#B9C2D9" stroke-width="7"/><circle cx="72" cy="38" r="18" fill="none" stroke="#B9C2D9" stroke-width="7"/><path d="M44 38h12" stroke="#8a93ad" stroke-width="5" stroke-dasharray="3 2"/><circle class="hr-glint" cx="22" cy="28" r="2" fill="#fff"/><rect x="18" y="50" width="20" height="8" rx="2" fill="#8a93ad"/>` },
  { id: "rp-trumpet", e: "📯", name: "Spirit trumpet", price: 6, note: "A light cone that 'floated' in dark séances, often painted with luminous paint. Sitters saw the glow, not the rod.", x: 92, y: 42, w: 7, vb: "0 0 70 110",
    art: () => `<g class="hr-float"><path d="M30 8L40 8L58 100L12 100Z" fill="#C9CED9" stroke="#6a7088" stroke-width="1.5"/><path d="M30 8L40 8L58 100L12 100Z" fill="#B8FFD8" opacity=".25" class="hr-glow"/><ellipse cx="35" cy="100" rx="23" ry="5" fill="#9aa0b4" stroke="#6a7088"/>${[30, 55, 80].map((y) => `<path d="M${35 - y * 0.2} ${y}h${y * 0.4}" stroke="#6a7088" stroke-width=".8"/>`).join("")}</g>` },
  { id: "rp-slate", e: "🪧", name: "Spirit slate", price: 8, note: "Henry Slade's 'spirit writing' appeared on sealed slates. He was prosecuted in London in 1876 after a sitter snatched a slate early.", x: 80, y: 14, w: 15, vb: "0 0 120 90",
    art: () => `<rect x="4" y="4" width="112" height="82" rx="6" fill="#8a5a2a" stroke="#4a2a10" stroke-width="2"/><rect x="12" y="12" width="96" height="66" rx="3" fill="#2a2e33"/><path class="hr-write" d="M22 34q8 -8 14 0t14 0t14 0M22 54q10 -6 18 0t18 0t20 -2" stroke="#e8e8e8" stroke-width="2.4" fill="none" stroke-linecap="round"/>` },
  { id: "rp-table", e: "🪑", name: "Tipping table", price: 10, note: "Michael Faraday tested table-tipping in 1853 and showed sitters were pushing it without knowing.", x: 80, y: 58, w: 15, vb: "0 0 110 110",
    art: () => `<ellipse cx="55" cy="106" rx="42" ry="4" fill="#000" opacity=".35"/><g class="hr-tilt" style="transform-origin:55px 100px"><ellipse cx="55" cy="40" rx="48" ry="14" fill="#5a2a1a" stroke="#2a1008" stroke-width="2"/><path d="M7 40v6q48 18 96 0v-6" fill="#3a1a0e"/><path d="M55 54v40M30 100l25 -8l25 8" stroke="#3a1a0e" stroke-width="5" stroke-linecap="round" fill="none"/>${[30, 55, 80].map((x) => `<circle cx="${x}" cy="${36 + (x === 55 ? -4 : 2)}" r="5" fill="#E7A0B4" opacity=".5"/>`).join("")}</g>` },
  { id: "rp-cabinet", e: "🚪", name: "Spirit cabinet", price: 12, note: "The Davenport brothers were tied up inside a cabinet in the 1850s and 60s while instruments played. They were slipping the knots.", x: 2, y: 54, w: 15, vb: "0 0 100 140",
    art: () => `<ellipse cx="50" cy="136" rx="44" ry="4" fill="#000" opacity=".35"/><rect x="8" y="10" width="84" height="124" fill="#3a1630" stroke="#1a0612" stroke-width="2"/><path d="M8 10h84l-6 -8h-72z" fill="#5a2050"/><g class="hr-sway"><path d="M12 14h38v118h-38z" fill="#6b2a5e"/><path d="M50 14h38v118h-38z" fill="#5a2050"/>${[20, 30, 40, 60, 70, 80].map((x) => `<path d="M${x} 14v118" stroke="#2A0F24" stroke-width="1" opacity=".5"/>`).join("")}</g><circle cx="50" cy="12" r="3" fill="#FFE3A3"/>` },
  { id: "rp-lantern", e: "🏮", name: "Magic lantern", price: 15, note: "In 1790s Paris, Étienne-Gaspard Robertson's Phantasmagoria used lanterns on wheels to make ghosts grow and rush at the crowd.", x: 24, y: 2, w: 11, vb: "0 0 100 130",
    art: () => `<defs>${BR}</defs><path d="M50 0v18" stroke="#5a3a12" stroke-width="2"/><rect x="20" y="18" width="60" height="64" rx="6" fill="url(#hrp)" stroke="#5a3a12"/><path d="M50 18v-6M40 12h20" stroke="url(#hrp)" stroke-width="4"/><path d="M80 44h16v20h-16z" fill="url(#hrp)"/><circle cx="96" cy="54" r="6" fill="#FFE3A3" class="hr-glow"/><path class="hr-beam" d="M96 54L100 30L100 78Z" fill="#FFE3A3" opacity=".35"/><path d="M28 82l-6 40M72 82l6 40" stroke="#5a3a12" stroke-width="3"/>` },
  { id: "rp-photo", e: "🖼️", name: "Spirit photograph", price: 20, note: "William Mumler sold 'spirit photographs' in the 1860s. They were double exposures. He was tried for fraud in 1869 and acquitted.", x: 62, y: 3, w: 13, vb: "0 0 100 120",
    art: () => `<defs>${BR}</defs><rect x="4" y="4" width="92" height="112" rx="4" fill="url(#hrp)" stroke="#5a3a12" stroke-width="2"/><rect x="14" y="14" width="72" height="92" fill="#d8c8a8"/><circle cx="50" cy="50" r="12" fill="#6a5a48"/><path d="M28 106q0 -34 22 -34t22 34z" fill="#6a5a48"/><g class="hr-ghost"><circle cx="66" cy="40" r="10" fill="#fff" opacity=".55"/><path d="M52 90q0 -34 14 -34t14 34" fill="#fff" opacity=".4"/></g>` },
  { id: "rp-board", e: "🔮", name: "Talking board", price: 30, note: "The talking board with a planchette was patented in the US in 1891 and sold as a parlour game.", x: 2, y: 85, w: 14, vb: "0 0 140 70",
    art: () => `<rect x="4" y="6" width="132" height="60" rx="8" fill="#c8a878" stroke="#5a3a12" stroke-width="2"/><path d="M14 30q56 -26 112 0" stroke="#2A0F24" stroke-width="1" fill="none"/>${"ABCDEFGHIJKLM".split("").map((ch, i) => `<text x="${16 + i * 8.8}" y="${30 - Math.sin((i / 12) * Math.PI) * 10}" font-size="7" fill="#2A0F24" font-family="serif">${ch}</text>`).join("")}<text x="20" y="58" font-size="8" fill="#2A0F24" font-family="serif">YES</text><text x="104" y="58" font-size="8" fill="#2A0F24" font-family="serif">NO</text><g class="hr-glide"><path d="M64 34q8 -8 16 0l-8 18z" fill="#3a1a0e" stroke="#FFE3A3" stroke-width=".8"/><circle cx="72" cy="38" r="3" fill="#FFE3A3" opacity=".7"/></g>` },
];

/** The Spirit Trumpet Gramophone: Madame Rook's own player for the shared music pool (classes tt, tt-disc). */
export function gramophoneSvg(t, playing) {
  const disc = t ? `<g transform="translate(46 50) scale(.8)">${vinylSvg(t, 100).replace(/<svg[^>]*>|<\/svg>/g, "")}</g>` : `<circle cx="86" cy="90" r="40" fill="#26262c"/>`;
  return `<svg class="tt gr${playing ? " playing" : ""}" viewBox="0 0 260 190" aria-hidden="true">
  <defs><linearGradient id="gr-horn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EDE8F7"/><stop offset=".5" stop-color="#C3A6FF"/><stop offset="1" stop-color="#5B3A8A"/></linearGradient>
    <linearGradient id="gr-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2050"/><stop offset="1" stop-color="#2A0F24"/></linearGradient></defs>
  <rect x="16" y="124" width="170" height="58" rx="8" fill="url(#gr-box)" stroke="#E7A0B4" stroke-width="1.5"/>
  <path d="M24 132h154" stroke="#E7A0B4" stroke-width=".8" stroke-dasharray="2 4"/>
  <ellipse cx="86" cy="116" rx="56" ry="10" fill="#1a1a1f" stroke="#555"/><path d="M86 116V124" stroke="#8A7F99" stroke-width="6"/>
  <g class="tt-disc" style="transform-origin:86px 90px">${disc}</g>
  <path d="M146 112 L160 70 C164 56 176 50 186 54" fill="none" stroke="#8A7F99" stroke-width="5" stroke-linecap="round"/>
  <path class="gr-horn" d="M182 56 L200 50 L256 4 L256 100 L200 64 Z" fill="url(#gr-horn)" stroke="#5B3A8A" stroke-width="1.5"/>
  <ellipse cx="256" cy="52" rx="4" ry="48" fill="#2A0F24" opacity=".8"/>
  <g class="gr-notes">${[0, 1, 2].map((i) => `<text class="gr-n gr-n${i}" x="${236 - i * 10}" y="${40 + i * 12}" font-size="12" fill="#FFE3A3">♪</text>`).join("")}</g>
  <circle class="tt-led" cx="30" cy="168" r="4" fill="${playing ? "#C3A6FF" : "#3a3a3a"}"/>
  <path d="M206 182V160q0 -8 6 -12l-3 -8q8 0 10 8l-1 12v22z" fill="#FFF6EE" opacity=".9"/><path class="gr-flame" d="M210 140q4 -10 0 -16q-4 6 0 16z" fill="#FFE3A3"/>
</svg>`;
}

export const PARLOUR_CSS = `
body[data-house="parlour"] .speaker{color:#C3A6FF;font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;letter-spacing:.14em}
body[data-house="parlour"] .gate-title{color:#C3A6FF;font-family:"Cormorant Garamond",Georgia,serif;font-style:italic}
.gr .gr-n{opacity:0}.gr.playing .gr-n{animation:gr-rise 2.4s linear infinite}.gr.playing .gr-n1{animation-delay:.8s}.gr.playing .gr-n2{animation-delay:1.6s}
.gr-flame,.h-rook .hk-flame{animation:hr-flick .4s ease-in-out infinite alternate;transform-origin:center bottom;transform-box:fill-box}
@keyframes gr-rise{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}100%{opacity:0;transform:translate(10px,-24px)}}
@keyframes hr-flick{to{transform:scaleY(1.15) skewX(4deg)}}
.h-rook .hk-veil{animation:hk-veil 7s ease-in-out infinite alternate;transform-origin:200px 108px}@keyframes hk-veil{to{transform:translateY(2px) scaleX(1.01)}}
.hr-float{animation:hr-float 4s ease-in-out infinite alternate}@keyframes hr-float{to{transform:translateY(-6px) rotate(3deg)}}
.hr-glow{animation:hr-tw 3s ease-in-out infinite}.hr-glint{animation:hr-tw 2.4s ease-in-out infinite}@keyframes hr-tw{0%,100%{opacity:.25}50%{opacity:.9}}
.hr-tilt{animation:hr-tilt 6s ease-in-out infinite}@keyframes hr-tilt{0%,70%,100%{transform:rotate(0)}80%{transform:rotate(-4deg)}90%{transform:rotate(3deg)}}
.hr-sway{animation:hr-sway 5s ease-in-out infinite alternate;transform-origin:50px 14px}@keyframes hr-sway{to{transform:skewX(1.5deg)}}
.hr-beam{animation:hr-tw 2s ease-in-out infinite}.hr-ghost{animation:hr-tw 5s ease-in-out infinite}
.hr-write{stroke-dasharray:200;animation:hr-write 6s linear infinite}@keyframes hr-write{0%{stroke-dashoffset:200}60%,100%{stroke-dashoffset:0}}
.hr-glide{animation:hr-glide 8s ease-in-out infinite}@keyframes hr-glide{0%,100%{transform:translate(0,0)}30%{transform:translate(-40px,6px)}60%{transform:translate(30px,10px)}}
@media (prefers-reduced-motion: reduce){.gr.playing .gr-n,.gr-flame,.h-rook .hk-flame,.h-rook .hk-veil,[class^="hr-"],[class*=" hr-"]{animation:none}}`;

/** Dress the shared figure as Madame Rook: plum velvet hood, lace veil, cameo brooch, one candle and a trick card. */
function paint(svg, prog, id = "t") {
  if (!svg) return;
  const stops = (gid, cols) => svg.querySelectorAll(`#${id}-${gid} stop`).forEach((s, i) => cols[i] && s.setAttribute("stop-color", cols[i]));
  stops("face", ["#FBEFF6", "#D9B8D8", "#5a3a5c"]); stops("hood", ["#6b2a5e", "#2A0F24", "#0e0410"]); stops("iris", ["#F3EAFF", "#C3A6FF", "#5B3A8A"]);
  svg.querySelectorAll('.o-body [stroke="#E2B04A"], .o-body [data-trim], .o-sleeves, .o-sleeves [data-trim]').forEach((e) => { if (!e.closest(".o-hands")) e.setAttribute("stroke", "#C3A6FF"); });
  const body = svg.querySelector(".o-body"), eye = svg.querySelector(".o-eye"); if (!body || !eye) return;
  svg.querySelector(".h-rook")?.remove();
  const T = trickOf(prog && prog.trickcard), g = document.createElementNS(NS, "g"); g.setAttribute("class", "h-rook");
  const scallops = Array.from({ length: 11 }, (_, i) => { const x = 152 + i * 9.6; return `<path d="M${x} 116q4.8 7 9.6 0" stroke="#F3EAFF" stroke-width="1.2" fill="none" opacity=".75"/><circle cx="${x + 4.8}" cy="121" r="1" fill="#F3EAFF" opacity=".7"/>`; }).join("");
  g.innerHTML = `<g class="hk-veil"><path d="M152 116Q200 96 258 116" stroke="#F3EAFF" stroke-width="1.4" fill="none" opacity=".8"/>${scallops}
      <path d="M156 118Q200 104 254 118L262 176Q200 160 138 176Z" fill="#F3EAFF" opacity=".08"/></g>
    <g transform="translate(200 90)"><ellipse rx="12" ry="14" fill="#E7A0B4" stroke="#FFE3A3" stroke-width="2.4"/><path d="M-2 -8q6 -2 6 4q0 4 -3 6q2 4 -1 8h-6q2 -6 0 -10q-1 -6 4 -8z" fill="#FFF6EE"/>${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return `<circle cx="${(13 * Math.cos(a)).toFixed(1)}" cy="${(15 * Math.sin(a)).toFixed(1)}" r="1.3" fill="#FFE3A3"/>`; }).join("")}</g>
    <g transform="translate(252 104) rotate(14)">${cardFace(T, 0.7)}</g>
    <g transform="translate(140 98)"><rect x="-3" y="0" width="6" height="16" fill="#FFF6EE"/><path class="hk-flame" d="M0 0q5 -8 0 -14q-5 6 0 14z" fill="#FFE3A3"/><circle cy="-6" r="8" fill="#FFE3A3" opacity=".18"/></g>`;
  eye.after(g);
  for (const side of ["L", "R"]) { const h = svg.querySelector(".o-hand" + side); if (h) { h.querySelectorAll(".hg").forEach((e) => e.remove()); h.insertAdjacentHTML("beforeend", rookHand(side)); } }
}
/** Madame Rook's hands: white lace gloves. At rest her left hand holds up a candle and her right floats palm-down over the
 *  table, as mediums did; her gestures: snap = the candle flares, point = a ghostly wisp, swat = a curl of smoke. */
const rookHand = (side) => (side === "L"
  ? `<g class="hg hg-candle"><rect x="152" y="226" width="12" height="36" rx="2" fill="#FFF6EE" stroke="#C3A6FF"/><path class="hk-flame rk-flame" d="M158 226q7 -10 0 -20q-7 10 0 20z" fill="#FFE3A3"/><circle class="rk-halo" cx="158" cy="214" r="12" fill="#FFE3A3" opacity=".25"/></g>`
  : `<g class="hg hg-wisp" fill="none" stroke="#F3EAFF" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M162 256 C150 230 176 214 160 190 S150 156 168 140"/></g>`)
  + `<g class="hg hg-smoke">${[[150, 250, 7], [144, 236, 9], [152, 222, 7]].map(([x, y, r], i) => `<circle style="--d:${i * 0.08}s" cx="${x}" cy="${y}" r="${r}" fill="#a89cb4"/>`).join("")}</g>`;
export const ROOK_HANDS_CSS = `
body[data-house="parlour"] .o-hands [data-skin="fill"]{fill:#f4eee6}body[data-house="parlour"] .o-hands [data-skin="stroke"]{stroke:#f4eee6}
body[data-house="parlour"] .o-hands [data-edge]{stroke:#C3A6FF}body[data-house="parlour"] .o-hands .o-nail{fill:#fff;stroke:#C3A6FF;stroke-width:.8}
body[data-house="parlour"] .o-hands .o-peye{display:none}body[data-house="parlour"] .o-hands .o-pline{stroke-dasharray:1 2}
body[data-house="parlour"] .teller:not([data-mood]):not([data-gesture]) .o-hands .o-handL{animation:rk-hold 6s ease-in-out infinite}
body[data-house="parlour"] .teller:not([data-mood]):not([data-gesture]) .o-hands .o-handR{animation:rk-float 6s ease-in-out infinite}
body[data-house="parlour"] .teller:not([data-mood]) .o-handL .o-f{animation:none;transform:rotate(46deg)}
body[data-house="parlour"] .teller:not([data-mood]):not([data-gesture]) .hg-candle{opacity:1}
@keyframes rk-hold{0%,100%{transform:translate(16px,-52px) rotate(-4deg)}50%{transform:translate(16px,-56px) rotate(-5deg)}}
@keyframes rk-float{0%,100%{transform:translate(4px,6px) rotate(-14deg)}50%{transform:translate(6px,-6px) rotate(-10deg)}}
.hg{opacity:0;pointer-events:none}
body[data-house="parlour"] [data-gesture="snap"] .hg-candle{opacity:1}body[data-house="parlour"] [data-gesture="snap"] .rk-flame{animation:rk-flare .5s ease-out;transform-box:fill-box;transform-origin:50% 100%}
body[data-house="parlour"] [data-gesture="point"] .hg-wisp{opacity:.85;stroke-dasharray:200;animation:rk-wisp 1.3s ease-out both}
body[data-house="parlour"] [data-gesture="swatL"] .o-handL .hg-smoke,body[data-house="parlour"] [data-gesture="swatR"] .o-handR .hg-smoke{opacity:1}
body[data-house="parlour"] [data-gesture^="swat"] .hg-smoke circle{animation:rk-puff .45s ease-out both;animation-delay:var(--d);transform-box:fill-box;transform-origin:50% 50%}
@keyframes rk-flare{50%{transform:scale(1.9)}}@keyframes rk-wisp{from{stroke-dashoffset:200}to{stroke-dashoffset:0}}@keyframes rk-puff{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.8) translateY(-20px);opacity:0}}
@media (prefers-reduced-motion: reduce){body[data-house="parlour"] .teller .o-hand{animation:none!important}}`;

/** Swap the Oracle's name for Madame Rook's in any line or menu. Rank names (Oracle-touched) and /oracle stay. */
const RENAME = [
  [/\bThe Oracle Chamber\b/g, "The Séance Parlour"], [/\bthe Oracle Chamber\b/g, "the Séance Parlour"], [/\bOracle Chamber\b/g, "Séance Parlour"],
  [/\bTHE ORACLE\b/g, "MADAME ROOK"], [/\b[Tt]he Oracle's\b/g, "Madame Rook's"], [/\b[Tt]he Oracle\b/g, "Madame Rook"],
  [/\bEnter the Chamber\b/g, "Enter the Parlour"], [/\b[Tt]he Chamber\b/g, (m) => (m[0] === "T" ? "The Parlour" : "the Parlour")],
  [/\b([Tt])he Record Player\b/g, "$1he Spirit Trumpet Gramophone"], [/\brecord player\b/g, "gramophone"], [/\bRecord player\b/g, "Gramophone"],
  [/\bDraw today's card\b/g, "Today's mystery"], [/Readings, card games and real science, with a fortune teller who talks back/g, "Ghosts, conjurors and the real history of magic, with a medium who shows you the trick"], [/(?<![\w/-])Oracle(?![\w-])/g, "Rook"],
];

const G = (mid1, mid2, win, lose) => ({ mid: [mid1, mid2], win: [win], lose: [lose] });

export const parlour = {
  id: "parlour", name: "Madame Rook", house: "The Séance Parlour", emoji: "🕯️", accent: "#C3A6FF",
  channelIds: ["1575977181622829158"], // #🕯️-parlour
  readings: false, rooms: ["casefiles", "seance", "timeline"], daily: "timeline",
  // her voice is branded to the parlour: a low, breathy, trembling whisper (vibrato like a medium's wavering voice)
  voice: { type: "sawtooth", base: 200, step: 26, vowel: 80, dur: 0.05, lp: 1800, breath: 0.45, vib: 4, vibDepth: 9, wordEnd: 0.85, brand: "candlelit whisper",
    sting: { type: "sine", glide: 0.72, notes: [[523, 0, 0.6, 0.22], [392, 0.38, 0.7, 0.2], [311, 0.8, 1.2, 0.18]] } }, // door sting: a falling, theremin-like wail
  css: PARLOUR_CSS + ROOK_HANDS_CSS, paint, rename: (s) => RENAME.reduce((t, [re, to]) => t.replace(re, to), s),
  player: { name: "The Spirit Trumpet Gramophone", deck: gramophoneSvg },
  shelves: [trickShop],
  token: { id: "key", emoji: "🗝️", name: "skeleton key", plural: "skeleton keys", purse: "Key ring" },
  relics: PARLOUR_RELICS, relicLabel: "🗝️ Parlour relics", relicBlurb: "Parlour relics stay in my House for good. Earn keys with your first visit each day and by beating game levels here.",
  strayIntro: "Three knocks, and this dropped out of the curtain:",
  lines: {
    greet: ["Hush, {name}. Three knocks... That's the radiator. Now, the real clue.", "Welcome to the Parlour, {name}. Every ghost has a method. Let's find it.",
      "Ah, {name}. The candle flickered as you came in. Draughts are wonderful for business."],
    idle: ["Houdini and his wife Bess agreed a secret code before he died in 1926. Bess held her last Halloween séance for him in 1936.",
      "In 1848 the Fox sisters' rappings started Spiritualism. Forty years later Margaret showed how she cracked her toes.",
      "Faraday built a little gauge in 1853 to catch table-tippers. The table moved because the sitters pushed it.",
      "Arthur Conan Doyle believed in fairies from the Cottingley photographs. The girls admitted in the 1980s they were paper cut-outs.",
      "Believe what you like, {name}. I just like knowing how it works."],
    joke: ["My crystal ball is mostly for dramatic lighting. It's glass. Glass bends light. That's it, that's the magic.", "I asked the spirits for the lottery numbers. They said the odds of the jackpot are about 1 in 292 million. Rude.",
      "Ectoplasm was usually cheesecloth. Very cheap cloth. Even ghosts have a budget.", "A medium walked into a séance. Nobody saw it coming. Least of all the medium.",
      "Houdini could hold his breath for over three minutes in practice. I can hold a dramatic pause for about four seconds."],
  },
  banter: {
    casefiles: G("Look for the method, darling. Every spirit leaves a mechanism.", "Houdini exposed fake mediums in his 1924 book, A Magician Among the Spirits.", "Solved! Another ghost unmasked. The Society would applaud.", "Not quite. The trick hides where you aren't looking, darling."),
    seance: G("Mind the clues, darling. The spirit is someone real, from the history books.", "Listen... a rap. No, that's the pipes. Read the clue.", "Named! The spirit can rest. It was never here, but still.", "Not that one. History is fussier than any ghost."),
    timeline: G("Order matters. Tricks have a family tree, like everything else.", "Conjurors were around long before séances. Mind the dates.", "In order! A history fit for a playbill, {name}.", "Out of order. Even the past gets shuffled sometimes."),
  },
  poke: ["Careful, the veil is antique lace.", "Mind the brooch, {name}. It's a cameo, not a doorbell.", "Poke me again and I'll knock three times. On you."],
  perfect: ["Flawless, {name}. Take a bow. The curtain loves you."],
};
