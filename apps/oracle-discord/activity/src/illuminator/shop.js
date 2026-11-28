// The Illuminator's shelf: brushes and pens, burnishers and colour pots, bought with 💎 Essence (in-game only, never
// money). Ids start with "il-" and live in prog.owned like the Chamber store. prog.illuminator = the item last put on
// there; each slot in use is in prog.rooms.illuminator.look. Every note is a real fact about medieval book-making.
import { room } from "./logic.js";

export const SHOP = [
  { id: "il-squirrel", slot: "brush", name: "Squirrel-hair brush", note: "Cennino Cennini, writing around 1400, says to make fine brushes from squirrel-tail hairs tied into a quill", price: 0 },
  { id: "il-quill", slot: "brush", name: "Goose quill", note: "Scribes cut pens from goose feathers. The word pen comes from Latin penna, a feather", price: 55 },
  { id: "il-reed", slot: "brush", name: "Reed pen", note: "Reed pens are far older than quills: Egyptian scribes used rushes and reeds for over 3,000 years", price: 110 },
  { id: "il-stone", slot: "burnisher", name: "Haematite burnisher", note: "Gilders polished gold leaf with a smooth stone. Cennini names haematite, a heavy iron ore", price: 0 },
  { id: "il-tooth", slot: "burnisher", name: "Dog's tooth burnisher", note: "Cennini also recommends a dog's tooth, set in a handle, for burnishing gold", price: 60 },
  { id: "il-agate", slot: "burnisher", name: "Agate burnisher", note: "Gilders today still burnish gold leaf with polished agate, because it is hard and very smooth", price: 120 },
  { id: "il-shells", slot: "palette", name: "Mussel-shell pots", note: "Illuminators mixed small batches of colour in mussel shells; shell gold is named after the habit", price: 0 },
  { id: "il-horn", slot: "palette", name: "Inkhorn", note: "Scribes kept ink in a cow's horn. Showy Latin words were mocked as 'inkhorn terms' in the 1500s", price: 70 },
  { id: "il-goldbook", slot: "palette", name: "Book of gold leaf", note: "Gold leaf is still sold between tissue pages in little books of 25 leaves", price: 140 },
];
export const SLOTS = [["brush", "🖌️ Brushes and pens"], ["burnisher", "✨ Burnishers"], ["palette", "🐚 Colour pots"]];
export const DEFAULT_LOOK = { brush: "il-squirrel", burnisher: "il-stone", palette: "il-shells" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.illuminator); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.illuminator) { look[fromStore.slot] = fromStore.id; r.seenItem = p.illuminator; }
  return look;
}
const use = (p, it) => { lookOf(p)[it.slot] = it.id; p.illuminator = it.id; room(p).seenItem = it.id; };
/** Buy (or, if owned, use) an item. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); use(p, it); return "bought"; }
  use(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Brushes, burnishers and colour pots for the Illuminator. Real workshop kit, {name}.", "A good burnisher makes gold sing. Have a look."],
  tryon: ["{item} on the desk. Mind the wet gold.", "{item}. Cennini would have opinions.", "There: {item}. Now, which blue?"],
  buy: ["{item} is yours.", "Sold: {item}. Use it on something glorious.", "{item}. The next page will shine."],
};
