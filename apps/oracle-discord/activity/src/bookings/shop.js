// Bookings shelf: playbill paper, poster type and the stage-door lamp, bought with 💎 Essence (in-game only, never
// money). Ids start with "bk-". Cosmetic: they change how your playbill looks. Every note is a real fact.
import { room } from "./logic.js";

export const SHOP = [
  { id: "bk-cream", slot: "paper", name: "Cream playbill", note: "Theatre playbills were printed cheaply on letterpress and pasted up around town the day before a show", price: 0 },
  { id: "bk-red", slot: "paper", name: "Circus red poster", note: "Chromolithography let printers make big, bright colour posters for circuses and magicians from the 1870s", price: 70 },
  { id: "bk-black", slot: "paper", name: "Midnight show bill", note: "Early in his career, Houdini's posters billed him as 'The Handcuff King'", price: 110 },
  { id: "bk-slab", slot: "type", name: "Wood type", note: "Big poster letters were cut from wood, because large metal type was too heavy and too dear", price: 0 },
  { id: "bk-fancy", slot: "type", name: "Tuscan letters", note: "Tuscan type, with its forked strokes, was a favourite on Victorian circus and theatre bills", price: 60 },
  { id: "bk-gilt", slot: "type", name: "Gilt lettering", note: "Gold leaf on posters and shop signs is laid in sheets far thinner than paper", price: 120 },
  { id: "bk-lamp", slot: "lamp", name: "Stage-door lamp", note: "Stage doors are the side entrances where performers come and go, and where fans wait", price: 0 },
  { id: "bk-bulbs", slot: "lamp", name: "Marquee bulbs", note: "Electric marquee lights spread with theatre lighting in the 1880s, after London's Savoy became the first theatre lit by electricity in 1881", price: 90 },
  { id: "bk-neon", slot: "lamp", name: "Neon sign", note: "Georges Claude showed the first neon signs in Paris in 1910", price: 80 },
];
export const SLOTS = [["paper", "📜 Playbill paper"], ["type", "🔠 Poster type"], ["lamp", "💡 Stage-door light"]];
export const DEFAULT_LOOK = { paper: "bk-cream", type: "bk-slab", lamp: "bk-lamp" };
export const SHELF_TALK = {
  open: ["Playbills, poster type and stage-door lights, darling. Your name deserves good lettering.", "Make the town notice you, {name}."],
  tryon: ["{item}. That will stop traffic.", "{item}. The billposter approves.", "There: {item}. Very top of the bill."],
  buy: ["{item}, ready for tonight.", "Sold: {item}. Paste it up.", "{item}. Now they'll queue round the block."],
};
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.bookings); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.bookings) { look[fromStore.slot] = fromStore.id; r.seenItem = p.bookings; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.bookings = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
