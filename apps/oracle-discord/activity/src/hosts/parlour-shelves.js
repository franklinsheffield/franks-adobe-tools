// Parlour item parity (House 4, Madame Rook): two more shelves.
//   rookcandle   the candle in Rook's hand and on her gramophone (prog.rookcandle; CSS vars --rook-wax, --rook-flame)
//   rookcabinet  the spirit cabinet in the room (prog.rookcabinet; CSS vars --rook-cab, --rook-door, --rook-trim)
// The Séance's flame-test candles are a separate shelf (seance/shop.js); these are about the wax. Every note is a real fact.

export const CANDLES = [
  { id: "cd-tallow", name: "Tallow candle", price: 0, wax: "#EADBB0", flame: "#FFC870", note: "Made from animal fat. Cheap, smoky and smelly, and the candle most homes burned before the 1800s." },
  { id: "cd-beeswax", name: "Beeswax candle", price: 30, wax: "#E8B84A", flame: "#FFE3A3", note: "Beeswax burns cleaner and smells sweet, so it cost far more. Churches were among its biggest buyers." },
  { id: "cd-bayberry", name: "Bayberry candle", price: 30, wax: "#9AAE8A", flame: "#FFE0A0", note: "Colonial Americans boiled bayberries for a grey-green wax. It took a lot of berries for one fragrant candle." },
  { id: "cd-stearin", name: "Stearin candle", price: 40, wax: "#F4F0E6", flame: "#FFE8B0", note: "Michel Chevreul and Joseph Gay-Lussac patented stearin candles in 1825: fat split into a harder, cleaner wax." },
  { id: "cd-paraffin", name: "Paraffin candle", price: 40, wax: "#FFF6EE", flame: "#FFEDBA", note: "James Young patented making paraffin from coal and shale in 1850. Paraffin made good candles cheap for everyone." },
  { id: "cd-spermaceti", name: "Spermaceti candle", price: 50, wax: "#FBFAF4", flame: "#FFF4D0", note: "Wax from a sperm whale's head. Britain's 1860 gas law measured light against a spermaceti candle: candlepower." },
];
export const candleOf = (id) => CANDLES.find((c) => c.id === id) || CANDLES[0];

export const CABINETS = [
  { id: "cab-davenport", name: "The Davenports' cabinet", price: 0, cab: "#3a1a12", door: "#2a120c", trim: "#B8893A", note: "Ira and William Davenport were tied up inside a wooden cabinet from the 1850s, and still the instruments played." },
  { id: "cab-maskelyne", name: "Maskelyne's copy", price: 30, cab: "#4a3a2a", door: "#2e2418", trim: "#d8c7a0", note: "In 1865 John Nevil Maskelyne built his own cabinet and did the Davenports' tricks openly, as conjuring." },
  { id: "cab-eddy", name: "The Eddy farmhouse", price: 30, cab: "#5a4a3a", door: "#3a2e22", trim: "#9a8a6a", note: "The Eddy brothers held cabinet séances on their Vermont farm. Olcott met Blavatsky there in 1874." },
  { id: "cab-cook", name: "Florence Cook's cabinet", price: 40, cab: "#2a1a2e", door: "#1a0e1e", trim: "#C3A6FF", note: "'Katie King' stepped out of Florence Cook's cabinet in London. William Crookes backed her in 1874; many doubted him." },
  { id: "cab-bangs", name: "The Bangs Sisters' cabinet", price: 40, cab: "#3a2a1a", door: "#24180e", trim: "#E2B04A", note: "Lizzie and May Bangs of Chicago sold 'spirit portraits' that seemed to paint themselves, in the early 1900s." },
  { id: "cab-egyptian", name: "Egyptian Hall", price: 50, cab: "#1a2a3a", door: "#0e1a26", trim: "#FADE8C", note: "Maskelyne and Cooke ran magic shows at London's Egyptian Hall from 1873, exposing séance tricks on stage." },
];
export const cabinetOf = (id) => CABINETS.find((c) => c.id === id) || CABINETS[0];

export function parlourVars(prog = {}) {
  const c = candleOf(prog.rookcandle), k = cabinetOf(prog.rookcabinet);
  return { "--rook-wax": c.wax, "--rook-flame": c.flame, "--rook-cab": k.cab, "--rook-door": k.door, "--rook-trim": k.trim };
}
export const PARLOUR_SHELF_CSS = `.hg-candle rect,.rk-wax{fill:var(--rook-wax,#FFF6EE)}.hk-flame,.gr-flame,.rk-halo{fill:var(--rook-flame,#FFE3A3)}
.pr-cab-body{fill:var(--rook-cab,#3a1a12);stroke:var(--rook-trim,#B8893A)}.pr-cab-door{fill:var(--rook-door,#2a120c)}`;

const card = (inner) => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect width="200" height="200" rx="16" fill="#2A0F24" stroke="#8A7F99" stroke-width="3"/>${inner}</svg>`;
const candleCard = (c) => card(`<circle cx="100" cy="70" r="46" fill="${c.flame}" opacity=".18"/><rect x="84" y="88" width="32" height="90" rx="4" fill="${c.wax}" stroke="#5a3a12" stroke-width="2"/><path d="M84 96q8 8 4 20" stroke="${c.wax}" stroke-width="6" stroke-linecap="round" opacity=".8"/><path d="M100 88v-8" stroke="#2a1a10" stroke-width="2"/><path d="M100 80q14 -20 0 -44q-14 24 0 44z" fill="${c.flame}"/><rect x="66" y="176" width="68" height="10" rx="4" fill="#B8893A"/>`);
const cabinetCard = (k) => card(`<path d="M44 40L100 24L156 40" fill="${k.cab}" stroke="${k.trim}" stroke-width="3"/><rect x="44" y="40" width="112" height="140" fill="${k.cab}" stroke="${k.trim}" stroke-width="3"/><rect x="52" y="50" width="46" height="122" fill="${k.door}"/><rect x="102" y="50" width="46" height="122" fill="${k.door}"/><circle cx="94" cy="112" r="3" fill="${k.trim}"/><circle cx="106" cy="112" r="3" fill="${k.trim}"/><path d="M100 96q14 -18 0 -36q-12 -14 4 -28" stroke="#C3A6FF" stroke-width="3" fill="none" opacity=".6"/>`);
const talk = (open, tryon, buy) => ({ open, tryon, buy });
export const candleShop = {
  kind: "rookcandle", label: "🕯️ Rook's hand candle",
  items: CANDLES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: talk(["Candles, darling. What they're made of matters more than you'd think.", "Fat, wax, whale. Every one of these lit a real séance once.", "Pick the candle I hold. The spirits are not fussy. I am."],
    ["{item}. Hold it near your face, it's flattering.", "{item}. Smell that? No? Lucky you.", "{item}. Steady flame. Steady nerves."],
    ["{item}, mine for good. Thank you, {name}.", "{item}. I'll trim the wick myself.", "{item}. The room looks warmer already."]),
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(candleCard(candleOf(id))); ctx.cap("🕯️ " + candleOf(id).name); },
};
export const cabinetShop = {
  kind: "rookcabinet", label: "🚪 Spirit cabinets",
  items: CABINETS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: talk(["Spirit cabinets. Every famous one, and how it fooled people.", "A box, two doors and a dark corner. Choose your cabinet.", "Cabinets with history. Some of it is even true."],
    ["{item}. Don't look behind the curtain. Fine, look.", "{item}. Rope not included.", "{item}. The tambourine is already restless."],
    ["{item}, in the corner for good. Thank you, {name}.", "{item}. I'll keep the doors shut. Mostly.", "{item}. Something in there approves."]),
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(cabinetCard(cabinetOf(id))); ctx.cap("🚪 " + cabinetOf(id).name); },
};
