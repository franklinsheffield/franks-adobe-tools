// House 2: the Alchemist's House (#⚗️-laboratory). Host: Magister Vell, an excitable alchemist in a brass goggle mask.
// She reuses the Oracle's figure rig (so moods, hands, eye tracking and emotes all work) with a copper mask, a brass
// goggle over the eye and a lens you choose in the store. Lines are original; every fact in them is real.
import { vinylSvg } from "../player.js";

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
body[data-house="alchemist"] .speaker{color:#E89A55}
body[data-house="alchemist"] .gate-title{color:#E89A55}
.ph .ph-b{opacity:0}
.ph.playing .ph-b{animation:ph-rise 1.8s linear infinite}
.ph.playing .ph-b2{animation-delay:.6s}.ph.playing .ph-b3{animation-delay:1.2s}
.ph.playing .ph-horn{animation:ph-thrum .5s ease-in-out infinite alternate;transform-origin:196px 66px}
@keyframes ph-rise{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-22px)}}
@keyframes ph-thrum{to{transform:scale(1.03)}}
.h-vell .hv-glint{animation:hv-glint 6s ease-in-out infinite}
@keyframes hv-glint{0%,80%,100%{opacity:.15}88%{opacity:.75}}
@media (prefers-reduced-motion: reduce){.ph.playing .ph-b,.ph.playing .ph-horn,.h-vell .hv-glint{animation:none}}`;

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
  g.innerHTML = `<path d="M118 150 L153 150 M247 150 L282 150" stroke="#3b2414" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="200" cy="152" rx="47" ry="34" fill="none" stroke="#C88A3A" stroke-width="8"/>
    <ellipse cx="200" cy="152" rx="52" ry="39" fill="none" stroke="#7a4f12" stroke-width="1.6"/>${rivets}
    <ellipse class="hv-glint" cx="200" cy="152" rx="42" ry="29" fill="${L.iris[1]}" opacity=".15"/>
    <path d="M168 136 A38 26 0 0 1 196 124" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g transform="translate(200 92)"><circle r="11" fill="#C88A3A" stroke="#7a4f12"/>${Array.from({ length: 8 }, (_, i) => `<rect x="-2.4" y="-15" width="4.8" height="6" fill="#C88A3A" transform="rotate(${i * 45})"/>`).join("")}<circle r="4" fill="#3b2414"/></g>`;
  eye.after(g);
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
  channelIds: [], // set to #⚗️-laboratory's id
  readings: false, rooms: ["alchemy", "duel", "grimoire"], daily: "alchemy",
  voice: { type: "triangle", base: 270, step: 30, vowel: 70, dur: 0.04, lp: 3200 },
  css: ALCHEMIST_CSS, paint, rename: (s) => RENAME.reduce((t, [re, to]) => t.replace(re, to), s),
  player: { name: "The Brass Phonograph", deck: phonographSvg },
  shelves: [lensShop],
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
