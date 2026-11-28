// Alchemist item parity (House 2, Vell): two more shelves, six more relics, seven more Hidden Lab finds.
//   vellburn  the burner under Vell's flask and on the bench (prog.vellburn; CSS var --vell-burn)
//   vellrack  the four test tubes in the bench rack (prog.vellrack; CSS vars --vell-t0..t3)
// Every note is a real fact.

/** Burners. flame = the flame colour; s = its height (1 = Bunsen). */
export const BURNERS = [
  { id: "bf-bunsen", name: "Bunsen burner", price: 0, flame: "#5aa8ff", s: 1, note: "Robert Bunsen and Peter Desaga made it in 1855. Air mixes with the gas before it burns, so the flame is hot, blue and clean." },
  { id: "bf-safety", name: "Safety flame", price: 30, flame: "#ffb43a", s: 1.25, note: "Close the Bunsen's air hole and the flame turns tall and yellow. Glowing soot makes it easy to see, so it's left on that way." },
  { id: "bf-spirit", name: "Spirit lamp", price: 30, flame: "#b8d8ff", s: 0.85, note: "A glass lamp with a wick, burning alcohol. Its flame is pale and quiet, and labs used them long before gas pipes." },
  { id: "bf-meker", name: "Meker burner", price: 40, flame: "#8fd0ff", s: 0.75, note: "Georges Méker put a metal grid on top of the tube. It splits the flame into many small cones, hotter than a Bunsen." },
  { id: "bf-teclu", name: "Teclu burner", price: 40, flame: "#4f7dff", s: 1.1, note: "Nicolae Teclu, a Romanian chemist, designed it in 1892. A screw disc at the base sets the air finely for a hotter flame." },
  { id: "bf-blowpipe", name: "Mouth blowpipe", price: 50, flame: "#eaf6ff", s: 0.7, note: "Blow through a thin tube into a flame to make a hot, sharp jet. Berzelius used one to test minerals by heating tiny grains." },
];
export const burnerOf = (id) => BURNERS.find((b) => b.id === id) || BURNERS[0];

/** Rack sets: four liquids in the bench rack, left to right. */
export const RACKS = [
  { id: "rk-starter", name: "Bench basics", price: 0, t: ["#e3173e", "#FFB400", "#1FC7A6", "#B57BE8"], note: "William Perkin was 18 when he made mauveine by accident in 1856. It was the first synthetic dye sold, and purple got cheap." },
  { id: "rk-indicators", name: "pH indicators", price: 30, t: ["#d8262e", "#2e5fd8", "#ff4fb3", "#ff8a1a"], note: "Red litmus, blue litmus, phenolphthalein in base (pink) and methyl orange. Each changes colour at its own pH." },
  { id: "rk-cabbage", name: "Red cabbage juice", price: 30, t: ["#e0245e", "#8a3ad8", "#2e6fd8", "#3fbf5a"], note: "Red cabbage holds anthocyanins. Its juice goes red in acid, purple in neutral water, blue then green as it gets more basic." },
  { id: "rk-transition", name: "Transition metals", price: 40, t: ["#7a1fa8", "#ff7a12", "#2fa84a", "#ff6fa8"], note: "Potassium permanganate is purple, potassium dichromate orange, nickel chloride green and cobalt chloride pink in water." },
  { id: "rk-copper", name: "Copper's blues", price: 40, t: ["#4fb8ff", "#1f3fd8", "#2fd6a0", "#9ad8ff"], note: "Copper sulfate solution is pale blue. Add ammonia and it turns a deep royal blue as a new copper complex forms." },
  { id: "rk-iron", name: "Iron's colours", price: 50, t: ["#a8d86a", "#d8a21f", "#a8101e", "#1f3a8a"], note: "Iron(II) sulfate is pale green, iron(III) chloride yellow-brown, with thiocyanate blood red. Prussian blue was made around 1706." },
];
export const rackOf = (id) => RACKS.find((r) => r.id === id) || RACKS[0];

/** CSS variables for the current Lab look (set on <html> by paintHost). */
export function labVars(prog = {}) {
  const b = burnerOf(prog.vellburn), r = rackOf(prog.vellrack);
  return { "--vell-burn": b.flame, "--vell-burn-s": String(b.s), ...Object.fromEntries(r.t.map((c, i) => [`--vell-t${i}`, c])) };
}
export const LAB_SHELF_CSS = `.hv-burn,.lab-bflame{fill:var(--vell-burn,#5aa8ff)}
.lab-bflame{transform-box:fill-box;transform-origin:50% 100%;scale:1 var(--vell-burn-s,1)}
${[0, 1, 2, 3].map((i) => `.lab-t${i}{fill:var(--vell-t${i})}`).join("")}`;

const card = (inner) => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect width="200" height="200" rx="16" fill="#1a0d06" stroke="#C88A3A" stroke-width="3"/>${inner}</svg>`;
const burnerCard = (b) => card(`<circle cx="100" cy="190" r="70" fill="${b.flame}" opacity=".12"/><rect x="88" y="104" width="24" height="70" rx="3" fill="#8a8a92" stroke="#3a3a42" stroke-width="2"/><rect x="70" y="170" width="60" height="12" rx="4" fill="#5a5a62"/>
  ${b.id === "bf-meker" ? `<rect x="84" y="98" width="32" height="8" fill="#5a5a62"/>` : ""}${b.id === "bf-spirit" ? `<ellipse cx="100" cy="150" rx="40" ry="32" fill="#e8f4ff" fill-opacity=".25" stroke="#e8f4ff" stroke-opacity=".7"/>` : ""}
  <g transform="translate(100 104) scale(1 ${b.s})"><path d="M0 0 Q24 -30 0 -80 Q-24 -30 0 0Z" fill="${b.flame}" opacity=".85"/><path d="M0 0 Q10 -18 0 -40 Q-10 -18 0 0Z" fill="#fff" opacity=".55"/></g>`);
const rackCard = (r) => card(`<rect x="24" y="96" width="152" height="10" fill="#7a4a26"/><rect x="24" y="168" width="152" height="10" fill="#7a4a26"/>
  ${r.t.map((c, i) => `<rect x="${40 + i * 34}" y="40" width="20" height="132" rx="10" fill="#e8f4ff" fill-opacity=".2" stroke="#e8f4ff" stroke-opacity=".6"/><rect x="${40 + i * 34}" y="${86 + (i % 2) * 14}" width="20" height="${86 - (i % 2) * 14}" rx="10" fill="${c}" opacity=".85"/>`).join("")}`);
const talk = (open, tryon, buy) => ({ open, tryon, buy });
export const burnerShop = {
  kind: "vellburn", label: "🔥 Vell's burners",
  items: BURNERS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: talk(["Burners. Every flame in a lab was somebody's invention.", "Pick a flame for under my flask. All of them were real lab kit.", "Gas, alcohol, breath. Choose how we heat things."],
    ["{item}. Mind your sleeves.", "{item}. Hear that roar? Good mix.", "{item}. Note it down: flame steady."],
    ["{item}, lit for good. Thank you, {name}.", "{item}. I'll keep the tap tight.", "{item}. Warmest thing on the bench."]),
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(burnerCard(burnerOf(id))); ctx.cap("🔥 " + burnerOf(id).name); },
};
export const rackShop = {
  kind: "vellrack", label: "🧪 Test-tube rack",
  items: RACKS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: talk(["Four tubes, four colours, all real chemistry. Choose a set.", "The rack on my bench. Every colour here is a reaction you can do.", "Indicators, metals, cabbage. Yes, cabbage. Pick one."],
    ["{item}. Look at those colours, {name}.", "{item}. Don't drink any of it.", "{item}. Labelled, I promise."],
    ["{item}, in the rack for good. Thank you, {name}.", "{item}. I'll stopper them tight.", "{item}. Best-looking rack in the House."]),
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(rackCard(rackOf(id))); ctx.cap("🧪 " + rackOf(id).name); },
};

/** Six more Lab relics (🪨 stones), at the same spots the Observatory's Phase 4 relics use. */
export const MORE_LAB_RELICS = [
  { id: "st-kipp", e: "⚗️", name: "Kipp's apparatus", price: 12, note: "Petrus Kipp's 1844 gas maker: three stacked glass globes. Turn the tap and gas flows; close it and the acid is pushed away.", x: 0, y: 26, w: 12, vb: "0 0 80 130",
    art: () => `<ellipse cx="40" cy="126" rx="30" ry="3" fill="#000" opacity=".35"/><circle cx="40" cy="104" r="22" fill="#e8f4ff" fill-opacity=".2" stroke="#e8f4ff" stroke-opacity=".7" stroke-width="1.5"/><circle cx="40" cy="70" r="16" fill="#e8f4ff" fill-opacity=".2" stroke="#e8f4ff" stroke-opacity=".7" stroke-width="1.5"/><circle cx="40" cy="30" r="18" fill="#e8f4ff" fill-opacity=".2" stroke="#e8f4ff" stroke-opacity=".7" stroke-width="1.5"/><path d="M36 12V110h8V12" fill="#e8f4ff" fill-opacity=".15" stroke="#e8f4ff" stroke-opacity=".5"/><ellipse cx="40" cy="110" rx="18" ry="10" fill="#66E0C8" opacity=".4"/><path d="M56 70h18v-6" stroke="#C88A3A" stroke-width="3" fill="none"/>${[0, 1, 2].map((i) => `<circle class="hr-bub" style="--d:${i * 0.6}s" cx="${34 + i * 6}" cy="${74 - i * 2}" r="2" fill="#C9FFF2"/>`).join("")}` },
  { id: "st-bunsen", e: "🔥", name: "Bunsen's first burner", price: 14, note: "Made for Robert Bunsen's new lab at Heidelberg in 1855, which had gas laid on. He never patented it.", x: 17, y: 64, w: 8, vb: "0 0 60 120",
    art: () => `<ellipse cx="30" cy="116" rx="24" ry="3" fill="#000" opacity=".35"/><rect x="8" y="104" width="44" height="10" rx="3" fill="#7a4f12"/><rect x="24" y="44" width="12" height="62" fill="#C87533" stroke="#5E2D10"/><rect x="22" y="84" width="16" height="8" fill="#5E2D10"/><path d="M38 100h20" stroke="#8a8a92" stroke-width="4"/><path class="hr-fire" d="M30 44 Q40 30 30 6 Q20 30 30 44Z" fill="#5aa8ff"/><path class="hr-fire" style="--d:.3s" d="M30 44 Q34 36 30 26 Q26 36 30 44Z" fill="#cfe8ff"/>` },
  { id: "st-dalton", e: "⚫", name: "Dalton's symbols", price: 16, note: "John Dalton drew each element as a circle with a mark, in 1808. Berzelius's letters, like H and O, replaced them.", x: 36, y: 2, w: 9, vb: "0 0 100 120",
    art: () => `<rect x="4" y="2" width="92" height="4" rx="2" fill="#C88A3A"/><g class="hr-sway"><rect x="10" y="6" width="80" height="108" fill="#efe0bd" stroke="#7a4f12" stroke-width="2"/>${[[30, 30, `<circle cx="30" cy="30" r="3" fill="#2a1a0a"/>`], [70, 30, ""], [30, 62, `<path d="M18 62h24" stroke="#2a1a0a" stroke-width="2"/>`], [70, 62, `<path d="M70 50v24M58 62h24" stroke="#2a1a0a" stroke-width="2"/>`], [30, 94, `<circle cx="30" cy="94" r="12" fill="#2a1a0a"/>`], [70, 94, `<text x="70" y="99" text-anchor="middle" font-size="14" font-family="Georgia,serif" fill="#2a1a0a">G</text>`]].map(([x, y, m]) => `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#2a1a0a" stroke-width="2"/>${m}`).join("")}</g>` },
  { id: "st-mohs", e: "💎", name: "Mohs' hardness kit", price: 18, note: "Friedrich Mohs ranked 10 minerals in 1812, from talc (1) to diamond (10). Each one scratches the ones below it.", x: 88, y: 2, w: 10, vb: "0 0 100 100",
    art: () => `<rect x="4" y="30" width="92" height="66" rx="4" fill="#5E2D10" stroke="#C88A3A" stroke-width="2"/><rect x="8" y="34" width="84" height="58" fill="#2a160a"/>${["#f0ece0", "#d8d0c0", "#e8e0d0", "#a8d8f0", "#c8a87a", "#f0c8c8", "#e8e8f0", "#ffd84a", "#d82a4a", "#e8f8ff"].map((c, i) => `<path d="M${14 + (i % 5) * 16} ${62 + Math.floor(i / 5) * 24}l6 -12l6 12z" fill="${c}" stroke="#2a160a" ${i === 9 ? 'class="hr-glint"' : ""}/>`).join("")}<path d="M4 30L20 6h60l16 24" fill="#7a4f12" stroke="#C88A3A" stroke-width="2"/>` },
  { id: "st-balance", e: "⚖️", name: "Lavoisier's balance", price: 22, note: "Antoine Lavoisier weighed everything before and after it burned. Mass is never lost, only moved: his law of 1789.", x: 93, y: 72, w: 7, vb: "0 0 80 120",
    art: () => `<ellipse cx="40" cy="116" rx="28" ry="3" fill="#000" opacity=".35"/><rect x="24" y="106" width="32" height="8" rx="2" fill="#7a4f12"/><path d="M40 106V20" stroke="#E2B04A" stroke-width="3"/><g class="hr-sway" style="transform-origin:40px 22px"><path d="M8 22H72" stroke="#E2B04A" stroke-width="3"/><path d="M12 22l-6 34h24l-6 -34M68 22l-6 34h24l-6 -34" stroke="#E2B04A" stroke-width="1" fill="none"/><path d="M4 56h28q-14 10 -28 0zM48 56h28q-14 10 -28 0z" fill="#E2B04A"/></g><circle cx="40" cy="18" r="4" fill="#FADE8C"/>` },
  { id: "st-curie", e: "☢️", name: "Curie's electrometer", price: 26, note: "Marie Curie measured radioactivity with an electrometer and a quartz device made by Pierre and Jacques Curie.", x: 2, y: 85, w: 12, vb: "0 0 120 80",
    art: () => `<ellipse cx="60" cy="76" rx="52" ry="4" fill="#000" opacity=".35"/><rect x="10" y="44" width="100" height="30" rx="3" fill="#5E2D10" stroke="#C88A3A" stroke-width="2"/><circle cx="40" cy="32" r="18" fill="#C87533" stroke="#5E2D10" stroke-width="2"/><circle cx="40" cy="32" r="12" fill="#e8f4ff" fill-opacity=".3"/><path d="M40 32l8 -6" stroke="#2a160a" stroke-width="1.5" class="hr-spark"/><rect x="72" y="18" width="10" height="28" fill="#e8f4ff" fill-opacity=".35" stroke="#e8f4ff"/><circle class="hr-glow" cx="92" cy="60" r="5" fill="#7dffb0" opacity=".7"/>` },
];

const inHour = (at, h) => new Date(at).getHours() === h; void inHour;
const onDay = (at, m, d) => { const x = new Date(at); return x.getMonth() + 1 === m && x.getDate() === d; };
const ownsAll = (prog, list) => list.every((x) => x.price === 0 || ((prog || {}).owned || []).includes(x.id));
/** Seven more Hidden Lab finds (13 + 7 = 20). */
export const MORE_LAB_SECRETS = [
  { id: "burner", e: "🔥", name: "Turn up the gas", hint: "The burner on the bench has a tap. Three turns should do it.", pay: { gem: 15 } },
  { id: "tubes", e: "🧪", name: "Tap the tubes", hint: "Four tubes in the rack. Flick them, the way chemists do to settle a liquid.", pay: { gem: 15 } },
  { id: "allflames", e: "🔥", name: "Every flame", hint: "Own every burner Vell sells.", pay: { gem: 30 } },
  { id: "allracks", e: "🌈", name: "A full rainbow", hint: "Own every set for the test-tube rack.", pay: { gem: 30 } },
  { id: "bunsenday", e: "🎂", name: "Bunsen's birthday", hint: "Visit on the birthday of the man whose burner is on every school bench (born 1811).", pay: { token: 2 }, rare: true },
  { id: "curieday", e: "☢️", name: "Curie's birthday", hint: "Visit on the birthday of the only person to win Nobel Prizes in two sciences.", pay: { token: 2 }, rare: true },
  { id: "lavoisierday", e: "⚖️", name: "Lavoisier's birthday", hint: "Visit on the birthday of the man who named oxygen and hydrogen (born 1743).", pay: { token: 2 }, rare: true },
];
export function moreLabEvent(kind, d, api) {
  if (kind === "tap" && d.tap === "burner" && d.count >= 3) api.find("burner", "Full gas! A Bunsen roars when the air hole is open. That roar is a well-mixed flame.");
  if (kind === "tap" && d.tap === "rack" && d.count >= 4) api.find("tubes", "Flick, flick. Tapping a tube knocks the bubbles loose and the drops down from the sides.");
  if (kind === "home" || kind === "wear") {
    if (ownsAll(api.prog, BURNERS)) api.find("allflames", "Every burner on the bench. From breath through a blowpipe to Méker's grid, all real lab kit.");
    if (ownsAll(api.prog, RACKS)) api.find("allracks", "A full rainbow in the rack. Every colour in it comes from a real reaction.");
  }
  if (kind === "home") {
    if (onDay(api.at, 3, 30)) api.find("bunsenday", "Happy birthday, Robert Bunsen, born 30 March 1811. He never patented his burner.");
    if (onDay(api.at, 11, 7)) api.find("curieday", "Happy birthday, Marie Curie, born 7 November 1867. Nobel Prizes in physics (1903) and chemistry (1911).");
    if (onDay(api.at, 8, 26)) api.find("lavoisierday", "Happy birthday, Antoine Lavoisier, born 26 August 1743. He named oxygen and hydrogen.");
  }
}
