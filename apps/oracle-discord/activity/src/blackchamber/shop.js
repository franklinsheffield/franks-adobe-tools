// The Black Chamber's shelf: worksheets, letter tiles and timers, bought with 💎 Essence (in-game only, never money).
// Ids start with "bc-" and live in prog.owned like the Chamber store. prog.blackchamber = the item last put on there;
// each slot in use is in prog.rooms.blackchamber.look. Every note is a real fact.
import { room } from "./logic.js";

export const SHOP = [
  { id: "bc-slate", slot: "sheet", name: "School slate", note: "Pupils and clerks worked sums on slates with slate pencils, wiping them clean, until cheap paper took over around 1900", price: 0 },
  { id: "bc-graph", slot: "sheet", name: "Squared paper", note: "Printed graph paper was on sale in England by 1794. Codebreakers lay cipher text out in its grid to line letters up", price: 55 },
  { id: "bc-baize", slot: "sheet", name: "Green baize", note: "Woollen baize covered desks and card tables because paper and cards don't slide on it", price: 120 },
  { id: "bc-paper", slot: "tiles", name: "Paper slips", note: "Codebreakers wrote letters on slips and moved them around by hand to test guesses, long before machines", price: 0 },
  { id: "bc-keys", slot: "tiles", name: "Typewriter keys", note: "The Sholes and Glidden of 1874 was the first typewriter sold in numbers, and it already had the QWERTY layout", price: 70 },
  { id: "bc-scrabble", slot: "tiles", name: "Word-game tiles", note: "Alfred Butts set his tile counts by counting letters in newspapers in the 1930s: the same trick as breaking a cipher", price: 140 },
  { id: "bc-sand", slot: "timer", name: "Sandglass", note: "Sandglasses timed ships' watches from at least the 1300s, turned every half hour", price: 0 },
  { id: "bc-watch", slot: "timer", name: "Pocket watch", note: "Christiaan Huygens's balance spring of 1675 made pocket watches accurate enough to tell minutes", price: 80 },
  { id: "bc-chess", slot: "timer", name: "Chess clock", note: "Twin clocks that stop one side while the other runs were first used at a London chess tournament in 1883", price: 130 },
];
export const SLOTS = [["sheet", "📄 Worksheets"], ["tiles", "🔤 Letter tiles"], ["timer", "⏳ Timers"]];
export const DEFAULT_LOOK = { sheet: "bc-slate", tiles: "bc-paper", timer: "bc-sand" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.blackchamber); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.blackchamber) { look[fromStore.slot] = fromStore.id; r.seenItem = p.blackchamber; }
  return look;
}
const use = (p, it) => { lookOf(p)[it.slot] = it.id; p.blackchamber = it.id; room(p).seenItem = it.id; };
/** Buy (or, if owned, use) an item. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); use(p, it); return "bought"; }
  use(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Worksheets, tiles and timers for the Black Chamber. Real codebreakers' kit, {name}.", "Every rival had their tools. Pick yours."],
  tryon: ["{item} on the table. Very official.", "{item}. Phelippes would approve.", "There: {item}. Now, the post."],
  buy: ["{item} is yours.", "Sold: {item}. Use it on someone's secrets.", "{item}. The rivals won't know what hit them."],
};
