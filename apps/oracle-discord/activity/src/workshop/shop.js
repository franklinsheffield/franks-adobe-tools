// Workshop shelf: stage curtains, workbenches and stage lights for the rehearsal stage, bought with 💎 Essence
// (in-game only, never money). Ids start with "ws-". Cosmetic. Every note is a real fact.
import { room } from "./logic.js";

export const SHOP = [
  { id: "ws-red", slot: "curtain", name: "Red velvet curtain", note: "Red became the classic theatre curtain colour in the 1800s: it hides dust and looks rich under gaslight", price: 0 },
  { id: "ws-plum", slot: "curtain", name: "Mauve curtain", note: "William Perkin made mauve, the first synthetic dye, by accident in 1856 while trying to make quinine", price: 60 },
  { id: "ws-gold", slot: "curtain", name: "Gold brocade curtain", note: "Brocade has its pattern woven in with extra threads, not printed or embroidered on top", price: 110 },
  { id: "ws-pine", slot: "bench", name: "Pine workbench", note: "Stage carpenters built most stage props and trick boxes from pine: light and easy to cut", price: 0 },
  { id: "ws-black", slot: "bench", name: "Black art table", note: "'Black art' tricks hide objects against black velvet under bright lights, so the eye cannot see them", price: 70 },
  { id: "ws-servante", slot: "bench", name: "Table with a servante", note: "A servante is a hidden shelf at the back of a magician's table, used to drop or pick up objects unseen", price: 120 },
  { id: "ws-candle", slot: "light", name: "Candle footlights", note: "Before gas, theatres lit the stage front with rows of candles or oil lamps: the 'footlights'", price: 0 },
  { id: "ws-lime", slot: "light", name: "Limelight", note: "Limelight heats a block of quicklime until it glows white. Theatres used it from the 1830s, which gave us 'in the limelight'", price: 80 },
  { id: "ws-gas", slot: "light", name: "Gas battens", note: "London's Lyceum Theatre was lit by gas in 1817, among the first theatres to be", price: 50 },
];
export const SLOTS = [["curtain", "🎭 Curtains"], ["bench", "🪚 Workbenches"], ["light", "💡 Stage lights"]];
export const DEFAULT_LOOK = { curtain: "ws-red", bench: "ws-pine", light: "ws-candle" };
export const SHELF_TALK = {
  open: ["Curtains, benches and stage lights for the Workshop, darling. A trick is half staging.", "Dress the stage, {name}. The audience sees the frame first."],
  tryon: ["{item}. Now that is a stage.", "{item}. The front row is leaning in already.", "There: {item}. Mind the trapdoor."],
  buy: ["{item} is on your stage now.", "Sold: {item}. Places, everyone.", "{item}. Very music hall."],
};
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.workshop); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.workshop) { look[fromStore.slot] = fromStore.id; r.seenItem = p.workshop; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.workshop = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
