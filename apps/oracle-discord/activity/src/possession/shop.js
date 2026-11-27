// Possession shelf: inks and pages for the Story book, bought with 💎 Essence (in-game only, never money). Ids start with
// "pz-". Cosmetic: they change how your tales are written on the table. Every note is a real fact.
export const SHOP = [
  { id: "pz-irongall", slot: "ink", name: "Iron gall ink", ink: "#2b2140", note: "Made from oak galls and iron salts, iron gall ink was Europe's main writing ink from the Middle Ages into the 1800s", price: 0 },
  { id: "pz-sepia", slot: "ink", name: "Sepia ink", ink: "#6b3f1d", note: "Sepia is the brown ink of the cuttlefish, named after its Greek name, sēpia", price: 60 },
  { id: "pz-indian", slot: "ink", name: "India ink", ink: "#0b0b10", note: "India ink is soot (carbon black) in water and binder. Soot inks like it were first made in ancient China", price: 90 },
  { id: "pz-gold", slot: "ink", name: "Gold ink", ink: "#a8781c", note: "Writing in gold ink is called chrysography. Byzantine and Carolingian scribes used it in their finest gospel books", price: 140 },
  { id: "pz-parchment", slot: "page", name: "Parchment page", page: ["#f3e3c3", "#e4cfa3"], note: "Parchment is animal skin scraped thin and dried stretched on a frame. Fine calfskin parchment is called vellum", price: 0 },
  { id: "pz-planchette", slot: "page", name: "Planchette sheet", page: ["#efe9f6", "#d9cde9"], note: "A planchette is a small heart-shaped board on wheels with a pencil. It was sold for 'spirit writing' in the 1850s and 1860s", price: 70 },
  { id: "pz-ouija", slot: "page", name: "Talking board", page: ["#e8c99a", "#c99f63"], note: "The Ouija board was patented in the USA in 1891 and sold as a parlour game", price: 110 },
  { id: "pz-corpse", slot: "page", name: "Exquisite corpse fold", page: ["#f6f1e6", "#dcd3bf"], note: "In 1920s Paris the Surrealists played cadavre exquis: each wrote part of a sentence on folded paper without seeing the rest", price: 150 },
];
export const SLOTS = [["ink", "🖋️ Inks"], ["page", "📜 Pages"]];
export const DEFAULT_LOOK = { ink: "pz-irongall", page: "pz-parchment" };
export const SHELF_TALK = {
  open: ["Inks and pages, {name}. Your tales deserve a good hand.", "Stock the Story book. Every word you put in my mouth gets written down."],
  tryon: ["{item}. Look how it takes the ink.", "{item}. The spirits approve.", "There: {item}."],
  buy: ["{item}, for the Story book.", "Sold: {item}. Write something wonderful.", "{item}. Mind the blots."],
};
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export const room = (p) => { const r = ((p.rooms ||= {}).possession ||= { plays: 0, tales: [], best: {} }); r.tales ||= []; r.best ||= {}; return r; };
/** The look in use: the room's own choice, plus anything just worn from the store (p.possession = last store pick). */
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.possession); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.possession) { look[fromStore.slot] = fromStore.id; r.seenItem = p.possession; }
  for (const k of Object.keys(look)) if (!owns(p, look[k])) look[k] = DEFAULT_LOOK[k];
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.possession = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
/** Colours for the page: { ink, paper: [light, dark] }. */
export function colours(look) { return { ink: (shopItem(look.ink) || SHOP[0]).ink, paper: (shopItem(look.page) || SHOP[4]).page }; }
