// House 2: the Alchemist's House (#⚗️-laboratory). Host: Magister Vell, an excitable alchemist in a brass goggle mask.
// She reuses the Oracle's figure rig (so moods, hands, eye tracking and emotes all work) with a copper mask, a brass
// goggle over the eye and a lens you choose in the store. Lines are original; every fact in them is real.
import { vinylSvg } from "../player.js";
import { STONE_ICON, labSceneHtml, flaskSvg, propsSvg, sootSvg, react, LAB_EMOTES, LAB_CSS } from "./alchemist-lab.js";

const NS = "http://www.w3.org/2000/svg";

/** Goggle lenses, each named after a real flame test. Iris gradient: light, mid, deep. */
export const LENSES = [
  { id: "lens-brass", name: "Clear brass lens", price: 0, iris: ["#FFF1C4", "#E2B04A", "#8C5E17"], note: "Plain glass in a brass rim. Brass is copper and zinc, and it doesn't rust." },
  { id: "lens-sodium", name: "Sodium flame lens", price: 30, iris: ["#FFF3A8", "#FFB400", "#B36B00"], note: "Sodium burns bright yellow-orange (589 nm), the glow of old sodium streetlights." },
  { id: "lens-lithium", name: "Lithium flame lens", price: 30, iris: ["#FFB3BE", "#E3173E", "#7A0418"], note: "Lithium salts turn a flame deep crimson." },
  { id: "lens-calcium", name: "Calcium flame lens", price: 40, iris: ["#FFD8B0", "#FF7A1F", "#8A3A05"], note: "Calcium burns orange-red. Old 'limelight' was quicklime heated until it glowed white." },
  { id: "lens-potassium", name: "Potassium flame lens", price: 40, iris: ["#F0D9FF", "#B57BE8", "#5B2A8A"], note: "Potassium gives a pale lilac flame. Chemists view it through cobalt glass to hide sodium's yellow." },
  { id: "lens-copper", name: "Copper flame lens", price: 40, iris: ["#C9FFF2", "#1FC7A6", "#0A6355"], note: "Copper compounds turn a flame blue-green." },
  { id: "lens-barium", name: "Barium flame lens", price: 50, iris: ["#E6FFC2", "#8BD630", "#3E6A0A"], note: "Barium burns apple green: the greens in fireworks." },
  { id: "lens-strontium", name: "Strontium flame lens", price: 50, iris: ["#FFC4B8", "#FF3B1F", "#8A1405"], note: "Strontium salts make the reds in most fireworks." },
  { id: "lens-boron", name: "Boron flame lens", price: 60, iris: ["#D4FFD0", "#2EE35A", "#0B6A22"], note: "Boric acid in methanol burns a vivid green." },
  { id: "lens-prism", name: "Prism lens", price: 120, iris: ["#FFFFFF", "#7AD7FF", "#FF4FB3"], note: "A prism splits white light into a spectrum. Newton used two to show the colour is in the light." },
];
export const lensOf = (id) => LENSES.find((l) => l.id === id) || LENSES[0];

const lensDisc = (l) => `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="lp-g" cx="40%" cy="38%" r="65%"><stop offset="0" stop-color="${l.iris[0]}"/><stop offset=".5" stop-color="${l.iris[1]}"/><stop offset="1" stop-color="${l.iris[2]}"/></radialGradient></defs>
  <circle cx="100" cy="100" r="78" fill="url(#lp-g)" opacity=".9"/><circle cx="100" cy="100" r="80" fill="none" stroke="#C88A3A" stroke-width="14"/><circle cx="100" cy="100" r="88" fill="none" stroke="#7a4f12" stroke-width="2"/>
  ${Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `<circle cx="${(100 + 80 * Math.cos(a)).toFixed(1)}" cy="${(100 + 80 * Math.sin(a)).toFixed(1)}" r="3.4" fill="#FADE8C"/>`; }).join("")}
  <path d="M58 70 A52 52 0 0 1 96 44" stroke="#fff" stroke-opacity=".55" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`;

/** The store shelf (department "House hosts"). prog.lens = the lens Magister Vell wears. */
export const lensShop = {
  kind: "lens", label: "🥽 Vell's goggle lenses",
  items: LENSES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["Lenses for my goggles, each tinted like a real flame test. Pick a colour, learn an element.", "Every lens is a flame colour. Chemists identified metals this way long before spectrometers.", "Hold a salt in a flame and its metal shows its colour. These lenses keep the colours."],
    tryon: ["{item}. Look into my eye. Scientifically.", "{item}. Very fetching, very safe.", "{item}. The flask looks different already."],
    buy: ["{item} goes in the goggles. Safety first, style a close second.", "{item}! I'll polish it with the good cloth.", "{item}, fitted. Now I can see you in colour."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(lensDisc(lensOf(id))); ctx.cap("🥽 " + lensOf(id).name); },
};


/** Lab relics: permanent fixtures in Vell's House, bought only with 🪨 philosopher's stones. Notes are real history. */
const CU = `<linearGradient id="hrc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FADE8C"/><stop offset=".5" stop-color="#C87533"/><stop offset="1" stop-color="#5E2D10"/></linearGradient>`;
export const LAB_RELICS = [
  { id: "st-alembic", e: "⚗️", name: "Copper alembic", price: 4, note: "A still for distilling. The word reached English through Arabic al-anbiq.", x: 80, y: 58, w: 17, vb: "0 0 120 110",
    art: () => `<defs>${CU}</defs><ellipse cx="44" cy="104" rx="34" ry="4" fill="#000" opacity=".35"/><circle cx="44" cy="74" r="28" fill="url(#hrc)" stroke="#5E2D10"/><path d="M36 48h16v-14h-16z" fill="url(#hrc)"/><path d="M30 34q14 -22 28 0z" fill="url(#hrc)" stroke="#5E2D10"/><path d="M56 30L110 58" stroke="url(#hrc)" stroke-width="5" stroke-linecap="round"/><ellipse cx="44" cy="80" rx="18" ry="10" fill="#66E0C8" opacity=".35"/>${[0, 1, 2].map((i) => `<circle class="hr-bub" style="--d:${i * 0.7}s" cx="${38 + i * 6}" cy="84" r="2.2" fill="#C9FFF2"/>`).join("")}<path d="M110 58v10" stroke="#66E0C8" stroke-width="2" class="hr-drip"/>` },
  { id: "st-athanor", e: "🧱", name: "Athanor furnace", price: 6, note: "The alchemist's slow furnace, built to hold an even heat for days.", x: 2, y: 54, w: 17, vb: "0 0 100 140",
    art: () => `<ellipse cx="50" cy="136" rx="40" ry="4" fill="#000" opacity=".35"/><path d="M18 136V40q32 -30 64 0v96z" fill="#7a3a22" stroke="#3a1a0c" stroke-width="2"/>${Array.from({ length: 8 }, (_, i) => `<path d="M18 ${48 + i * 11}H82" stroke="#3a1a0c" stroke-width="1" opacity=".6"/>`).join("")}<path d="M36 136v-30q14 -14 28 0v30z" fill="#1a0a04"/><path class="hr-fire" d="M40 134q10 -28 20 0z" fill="#ff8a1a"/><path class="hr-fire" style="--d:.4s" d="M45 134q5 -16 10 0z" fill="#ffe08a"/><path d="M44 14h12v12h-12z" fill="#3a1a0c"/>` },
  { id: "st-tablet", e: "🟩", name: "The Emerald Tablet", price: 8, note: "A short, cryptic text credited to Hermes Trismegistus. Its oldest known versions are in Arabic.", x: 80, y: 14, w: 13, vb: "0 0 80 110",
    art: () => `<defs><linearGradient id="hre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9dffc2"/><stop offset=".5" stop-color="#1fae5a"/><stop offset="1" stop-color="#0a4a24"/></linearGradient></defs><path d="M8 20q32 -22 64 0v86h-64z" fill="url(#hre)" stroke="#E2B04A" stroke-width="2.5"/>${Array.from({ length: 7 }, (_, i) => `<path d="M18 ${34 + i * 10}h${28 + ((i * 13) % 17)}" stroke="#063018" stroke-width="2" opacity=".7"/>`).join("")}<path class="hr-glint" d="M16 24l10 -6" stroke="#fff" stroke-width="3" opacity=".6"/>` },
  { id: "st-ouroboros", e: "🐍", name: "Ouroboros banner", price: 10, note: "The snake eating its tail, drawn in old Greek alchemical manuscripts beside the words 'the all is one'.", x: 24, y: 2, w: 10, vb: "0 0 100 140",
    art: () => `<rect x="4" y="2" width="92" height="4" rx="2" fill="#C88A3A"/><g class="hr-sway"><path d="M12 6h76v120l-38 12l-38 -12z" fill="#3b1220" stroke="#E2B04A" stroke-width="1.5"/><g class="hr-spin" style="transform-origin:50px 64px"><circle cx="50" cy="64" r="24" fill="none" stroke="#1fae5a" stroke-width="7"/><circle cx="50" cy="64" r="24" fill="none" stroke="#9dffc2" stroke-width="1.4" stroke-dasharray="3 5"/><path d="M72 56l8 -6l-2 10z" fill="#1fae5a"/><circle cx="74" cy="56" r="1.4" fill="#ff4f4f"/></g></g>` },
  { id: "st-crucible", e: "🫕", name: "Golden crucible", price: 12, note: "A pot that survives the furnace, used to melt and assay metals.", x: 18, y: 84, w: 9, vb: "0 0 100 90",
    art: () => `<ellipse cx="50" cy="86" rx="36" ry="4" fill="#000" opacity=".35"/><path d="M24 86L36 50M76 86L64 50M50 86V54" stroke="#3a2a1a" stroke-width="4"/><path d="M26 30h48l-8 30h-32z" fill="#7a6a5a" stroke="#3a2a1a" stroke-width="2"/><ellipse cx="50" cy="30" rx="24" ry="6" fill="#ffcf3a" class="hr-glow"/><ellipse cx="50" cy="30" rx="16" ry="3.4" fill="#fff4b0"/>` },
  { id: "st-pile", e: "🔋", name: "Voltaic pile", price: 15, note: "Volta's battery of 1800, stacked zinc and copper discs. Davy used a big one to isolate potassium and sodium in 1807.", x: 92, y: 42, w: 6, vb: "0 0 70 120",
    art: () => `<ellipse cx="35" cy="116" rx="26" ry="3" fill="#000" opacity=".35"/><rect x="10" y="108" width="50" height="6" fill="#5a3a1a"/>${Array.from({ length: 12 }, (_, i) => `<rect x="18" y="${100 - i * 7}" width="34" height="3.6" rx="1" fill="${["#C87533", "#b8c2d0", "#e8d8b0"][i % 3]}"/>`).join("")}<path d="M14 18V108M56 18V108" stroke="#7a5a3a" stroke-width="2"/><path class="hr-spark" d="M30 10l6 -8l-2 7l6 -1l-8 10l2 -7z" fill="#bfe6ff"/>` },
  { id: "st-table", e: "📜", name: "Mendeleev's chart", price: 20, note: "Mendeleev's 1869 table left gaps for elements nobody had found yet, and predicted their properties.", x: 62, y: 3, w: 13, vb: "0 0 120 100",
    art: () => `<rect x="2" y="2" width="116" height="96" rx="4" fill="#efe0bd" stroke="#7a4f12" stroke-width="2"/>${Array.from({ length: 6 }, (_, r) => Array.from({ length: 9 }, (_, c) => (r === 0 && c > 0 && c < 8) || (r === 1 && c > 1 && c < 7) ? "" : `<rect x="${8 + c * 12}" y="${10 + r * 14}" width="10" height="12" fill="${(r * 9 + c) % 7 === 3 ? "none" : ["#C87533", "#1fae5a", "#5fa8ff", "#E2B04A"][(r + c) % 4]}" stroke="#5a3a1a" stroke-width=".6" ${(r * 9 + c) % 7 === 3 ? 'stroke-dasharray="2 1.5" class="hr-gap"' : 'opacity=".75"'}/>`).join("")).join("")}` },
  { id: "st-stone", e: "🪨", name: "The Philosopher's Stone", price: 30, note: "The legendary stone said to turn base metal into gold. Nobody made one, but the search built chemistry's tools.", x: 83, y: 84, w: 14, vb: "0 0 140 70",
    art: () => `<defs><radialGradient id="hrh"><stop offset="0" stop-color="#ff4f4f" stop-opacity=".5"/><stop offset="1" stop-color="#ff4f4f" stop-opacity="0"/></radialGradient></defs><ellipse cx="70" cy="38" rx="62" ry="30" fill="url(#hrh)" class="hr-glow"/><path d="M36 68h68l-8 -12h-52z" fill="#C88A3A" stroke="#5E2D10"/>
      <g class="hr-pulse" style="transform-origin:70px 38px"><path d="M40 56 L46 30 L64 16 L88 20 L102 36 L96 54 L66 60Z" fill="#6e5f57" stroke="#2a201c" stroke-width="2" stroke-linejoin="round"/><path d="M46 30 L64 16 L58 34Z" fill="#8f8178"/><path d="M88 20 L102 36 L84 34Z" fill="#54463f"/>
      <path d="M58 34 L72 26 L84 34 L74 48 L58 44Z" fill="#e3173e"/><path d="M72 26 L84 34 L74 34Z" fill="#ff8a96"/><path d="M58 44 L74 48 L64 54Z" fill="#8a0a22"/><circle cx="66" cy="33" r="2.4" fill="#fff" opacity=".8"/></g>` },
];

/** The brass phonograph: the Alchemist's own player for the shared music pool. Same classes as the turntable (tt, tt-disc). */
export function phonographSvg(t, playing) {
  const disc = t ? `<g transform="translate(46 70) scale(1.0)">${vinylSvg(t, 100).replace(/<svg[^>]*>|<\/svg>/g, "")}</g>` : `<circle cx="96" cy="120" r="48" fill="#26262c"/>`;
  return `<svg class="tt ph${playing ? " playing" : ""}" viewBox="0 0 260 190" aria-hidden="true">
  <defs><linearGradient id="ph-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FADE8C"/><stop offset=".5" stop-color="#C88A3A"/><stop offset="1" stop-color="#6b3f12"/></linearGradient>
    <linearGradient id="ph-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a321a"/><stop offset="1" stop-color="#26130a"/></linearGradient></defs>
  <rect x="20" y="132" width="160" height="50" rx="8" fill="url(#ph-wood)" stroke="#C88A3A" stroke-width="2"/>
  <ellipse cx="96" cy="128" rx="62" ry="12" fill="#1a1a1f" stroke="#555"/>
  <g class="tt-disc" style="transform-origin:96px 120px">${disc}</g>
  <path d="M150 128 L168 70 C172 56 186 50 196 56" fill="none" stroke="url(#ph-brass)" stroke-width="6" stroke-linecap="round"/>
  <path class="ph-horn" d="M190 60 C204 28 236 10 254 8 L256 92 C238 86 214 78 196 72Z" fill="url(#ph-brass)" stroke="#7a4f12" stroke-width="1.5"/>
  <ellipse cx="255" cy="50" rx="4" ry="42" fill="#3a2008" opacity=".8"/>
  <g class="ph-flask"><path d="M206 182 L206 164 L198 150 L222 150 L214 164 L214 182Z" fill="#66E0C8" fill-opacity=".35" stroke="#FADE8C" stroke-width="1.5" transform="translate(0 -2)"/>
    <circle class="ph-b ph-b1" cx="208" cy="170" r="2.2" fill="#C9FFF2"/><circle class="ph-b ph-b2" cx="212" cy="174" r="1.6" fill="#C9FFF2"/><circle class="ph-b ph-b3" cx="210" cy="166" r="1.3" fill="#C9FFF2"/></g>
  <circle class="tt-led" cx="34" cy="170" r="4" fill="${playing ? "#66E0C8" : "#3a3a3a"}"/>
</svg>`;
}

export const ALCHEMIST_CSS = `
body[data-house="alchemist"] .speaker{color:#E89A55;font-family:"IM Fell English",Georgia,serif;letter-spacing:.08em}
body[data-house="alchemist"] .gate-title{color:#E89A55;font-family:"IM Fell English",Georgia,serif}
.ph .ph-b{opacity:0}
.ph.playing .ph-b{animation:ph-rise 1.8s linear infinite}
.ph.playing .ph-b2{animation-delay:.6s}.ph.playing .ph-b3{animation-delay:1.2s}
.ph.playing .ph-horn{animation:ph-thrum .5s ease-in-out infinite alternate;transform-origin:196px 66px}
@keyframes ph-rise{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-22px)}}
@keyframes ph-thrum{to{transform:scale(1.03)}}
.h-vell .hv-glint{animation:hv-glint 6s ease-in-out infinite}
.hr-bub{animation:ph-rise 2s linear infinite;animation-delay:var(--d,0s)}.hr-fire{animation:hr-flick .35s ease-in-out infinite alternate;animation-delay:var(--d,0s);transform-origin:50px 134px}
@keyframes hr-flick{to{transform:scaleY(1.18)}}.hr-glow{animation:hv-glint 3s ease-in-out infinite}.hr-pulse{animation:hr-pulse 2.4s ease-in-out infinite}@keyframes hr-pulse{50%{transform:scale(1.08)}}
.hr-spark{animation:hv-glint 1.2s steps(2) infinite}.hr-spin{animation:hr-spin 24s linear infinite}@keyframes hr-spin{to{transform:rotate(360deg)}}.hr-gap{animation:hv-glint 2s ease-in-out infinite}
@keyframes hv-glint{0%,80%,100%{opacity:.15}88%{opacity:.75}}
@media (prefers-reduced-motion: reduce){.ph.playing .ph-b,.ph.playing .ph-horn,.h-vell .hv-glint,[class^="hr-"],[class*=" hr-"]{animation:none}}`;

/** Dress the shared figure as Magister Vell: copper mask, brass goggle, gear badge, lens colour. */
function paint(svg, prog, id = "t") {
  if (!svg) return;
  const stops = (gid, cols) => svg.querySelectorAll(`#${id}-${gid} stop`).forEach((s, i) => cols[i] && s.setAttribute("stop-color", cols[i]));
  stops("face", ["#F6C9A0", "#C8743A", "#5E2D10"]); stops("hood", ["#6a3c1c", "#2b170b", "#0d0603"]); // copper mask, leather hood
  svg.querySelectorAll('.o-body [stroke="#E2B04A"], .o-body [data-trim], .o-sleeves, .o-sleeves [data-trim]').forEach((e) => { if (!e.closest(".o-hands")) e.setAttribute("stroke", "#C88A3A"); });
  const L = lensOf(prog && prog.lens); stops("iris", L.iris);
  const body = svg.querySelector(".o-body"), eye = svg.querySelector(".o-eye"); if (!body || !eye) return;
  svg.querySelector(".h-vell")?.remove();
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "h-vell");
  const rivets = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `<circle cx="${(200 + 47 * Math.cos(a)).toFixed(1)}" cy="${(152 + 34 * Math.sin(a)).toFixed(1)}" r="2.6" fill="#FADE8C" stroke="#7a4f12" stroke-width=".6"/>`; }).join("");
  g.innerHTML = `${sootSvg()}<path d="M118 150 L153 150 M247 150 L282 150" stroke="#3b2414" stroke-width="9" stroke-linecap="round"/>
    <g class="hv-goggle"><ellipse cx="200" cy="152" rx="47" ry="34" fill="none" stroke="#C88A3A" stroke-width="8"/>
    <ellipse cx="200" cy="152" rx="52" ry="39" fill="none" stroke="#7a4f12" stroke-width="1.6"/>${rivets}
    <ellipse class="hv-glint" cx="200" cy="152" rx="42" ry="29" fill="${L.iris[1]}" opacity=".15"/>
    <path d="M168 136 A38 26 0 0 1 196 124" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <g transform="translate(200 92)"><circle r="11" fill="#C88A3A" stroke="#7a4f12"/>${Array.from({ length: 8 }, (_, i) => `<rect x="-2.4" y="-15" width="4.8" height="6" fill="#C88A3A" transform="rotate(${i * 45})"/>`).join("")}<circle r="4" fill="#3b2414"/></g>`;
  eye.after(g);
  // the flask stands where the crystal ball was (the ball's own parts are hidden by LAB_CSS); pose props ride in her hands
  const ball = svg.querySelector(".o-ball"), hands = svg.querySelector(".o-hands");
  if (ball) { ball.querySelector(".hv-flask")?.remove(); ball.insertAdjacentHTML("beforeend", flaskSvg(id)); }
  if (hands) { hands.querySelector(".hv-props")?.remove(); hands.insertAdjacentHTML("beforeend", propsSvg()); }
}

/** Swap the Oracle's name for Vell's in any line or menu. Rank names (Oracle-touched) and /oracle stay. */
const RENAME = [
  [/\bThe Oracle Chamber\b/g, "The Alchemist's House"], [/\bthe Oracle Chamber\b/g, "the Alchemist's House"], [/\bOracle Chamber\b/g, "Alchemist's House"],
  [/\bTHE ORACLE\b/g, "MAGISTER VELL"], [/\b[Tt]he Oracle's\b/g, "Magister Vell's"], [/\b[Tt]he Oracle\b/g, "Magister Vell"],
  [/\bEnter the Chamber\b/g, "Enter the House"], [/\b[Tt]he Chamber\b/g, (m) => (m[0] === "T" ? "The House" : "the House")],
  [/\b([Tt])he Record Player\b/g, "$1he Brass Phonograph"], [/\brecord player\b/g, "phonograph"], [/\bRecord player\b/g, "Phonograph"],
  [/\bDraw today's card\b/g, "Today's experiment"], [/Readings, card games and real science, with a fortune teller who talks back/g, "Real chemistry, element duels and plant lore, with an alchemist who talks back"], [/(?<![\w/-])Oracle(?![\w-])/g, "Vell"],
];

const G = (mid1, mid2, win, lose) => ({ mid: [mid1, mid2], win: [win], lose: [lose] });

export const alchemist = {
  id: "alchemist", name: "Magister Vell", house: "The Alchemist's House", emoji: "⚗️", accent: "#E89A55",
  channelIds: ["1575967994633396544"], // #⚗️-laboratory
  readings: false, rooms: ["alchemy", "duel", "grimoire"], daily: "alchemy",
  // her voice is branded to the lab: brassy triangle (a 2nd harmonic like her goggle rim) and every syllable pops upward like a bubble
  voice: { type: "triangle", base: 270, step: 30, vowel: 70, dur: 0.04, lp: 3200, sweep: 1.3, harm: [2, 0.22], brand: "bubbling brass",
    sting: { type: "triangle", glide: 1.5, notes: [[392, 0, 0.09], [494, 0.08, 0.09], [587, 0.16, 0.09], [784, 0.24, 0.22, 0.35]] } }, // door sting: three bubbles pop, then a bright brass note
  css: ALCHEMIST_CSS + LAB_CSS, paint, scene: labSceneHtml, react, emotes: LAB_EMOTES, rename: (s) => RENAME.reduce((t, [re, to]) => t.replace(re, to), s),
  player: { name: "The Brass Phonograph", deck: phonographSvg },
  shelves: [lensShop],
  token: { id: "stone", emoji: "🪨", icon: STONE_ICON, name: "philosopher's stone", plural: "philosopher's stones", purse: "Stone pouch" },
  relics: LAB_RELICS, relicLabel: "🪨 Lab relics", relicBlurb: "Lab relics stay in my House for good. Earn stones with your first visit each day and by beating game levels here.",
  strayIntro: "Something just fell out of the flask:",
  lines: {
    greet: ["{name}! Goggles on, gloves on, curiosity on. Welcome to the Alchemist's House.", "Ah, {name}. Mind the bench, it's still warm. What shall we mix today?",
      "Welcome back to the lab, {name}. Nothing has exploded since you left. Nothing important, anyway."],
    idle: ["Gold is so soft it can be beaten thinner than a leaf of paper. Alchemists spent centuries trying to make it. Jewellers spent them hammering it.",
      "Robert Boyle published The Sceptical Chymist in 1661, and still did alchemy on the side. Science is a slow reaction.",
      "Lavoisier weighed everything, even air. That's how he showed burning takes up oxygen instead of giving off 'phlogiston'.",
      "Mercury, sulfur and salt: the alchemists' three principles. The modern count is 118 elements.",
      "The bench is quiet. I'll just stare meaningfully at this flask."],
    joke: ["I told a chemistry joke once. No reaction.", "Never trust an atom. They make up everything.", "I'd tell you a joke about sodium, but Na.",
      "My goggles are rated for splashes, sparks and bad puns. Mostly bad puns.",
      "Alchemists wanted to turn lead into gold. Physicists have managed it in particle accelerators. It costs far more than the gold. Classic."],
  },
  banter: {
    alchemy: G("Stir gently. The flask doesn't mind, but I do.", "Smell that? That's either sulfur or progress.", "It worked! Write it in the lab book before you forget!", "No reaction. Very scientific of it. Try again."),
    duel: G("Careful, I've balanced more equations than you've had breakfasts.", "A noble gas! Lovely. Unreactive, but lovely.", "Beaten! My compounds came apart. Well played, {name}.", "My reaction wins! Don't worry, it was exothermic. You'll warm up."),
    grimoire: G("Leaves first, then flowers. Plants keep their best clues at the edges.", "Plenty of medicines started out in a herb garden.", "Named it! Press it in the book, carefully.", "Not that one. Plants are tricky, and some look-alikes are poisonous."),
  },
  poke: ["Mind the goggles! They're brass, not glass.", "Hands off the bench, {name}. It's hot.", "Poke me again and it goes in the lab book."],
  perfect: ["A flawless run! I'm taking notes, {name}."],
};
