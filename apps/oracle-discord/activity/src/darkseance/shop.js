// Dark Séance shelf: luminous paint, séance tables and spirit cabinets, bought with 💎 Essence (in-game only, never
// money). Ids start with "ds-". Cosmetic: they change how the séance room looks. Every note is a real fact.
import { room } from "./logic.js";

export const SHOP = [
  { id: "ds-balmain", slot: "paint", name: "Balmain's luminous paint", note: "William Balmain patented a glow-in-the-dark calcium sulphide paint in 1877. Séance investigators later marked mediums with luminous bands", price: 0 },
  { id: "ds-radium", slot: "paint", name: "Radium green", note: "Radium paint glowed without any light to charge it. The women who painted watch dials with it in the 1910s and 1920s were poisoned by it", price: 80 },
  { id: "ds-modern", slot: "paint", name: "Modern afterglow blue", note: "Strontium aluminate glow powder, developed in the 1990s, glows for hours, far longer than the old zinc sulphide", price: 60 },
  { id: "ds-tripod", slot: "table", name: "Tripod tilt table", note: "Light three-legged tables were favourites for table-turning: a small push tips them onto two legs", price: 0 },
  { id: "ds-oak", slot: "table", name: "Round oak table", note: "Table-turning swept Britain, France and Germany in 1853, the same year Faraday tested it", price: 70 },
  { id: "ds-faraday", slot: "table", name: "Faraday's test table", note: "Faraday's 1853 indicator was layers of card on the tabletop, held with soft cement, with a straw pointer that showed who pushed", price: 110 },
  { id: "ds-curtain", slot: "cabinet", name: "Curtained corner", note: "A spirit cabinet was often just a corner of the room behind a curtain, so the medium could sit out of sight", price: 0 },
  { id: "ds-davenport", slot: "cabinet", name: "The Davenports' wardrobe", note: "The Davenport brothers' cabinet was a large wooden wardrobe with three doors and a bench inside for each brother", price: 120 },
  { id: "ds-margery", slot: "cabinet", name: "Houdini's Margery box", note: "In 1924 Houdini built a wooden box with holes for Margery's head and arms, so her hands and feet stayed inside", price: 100 },
];
export const SLOTS = [["paint", "💫 Luminous paint"], ["table", "🪑 Séance tables"], ["cabinet", "🚪 Spirit cabinets"]];
export const DEFAULT_LOOK = { paint: "ds-balmain", table: "ds-tripod", cabinet: "ds-curtain" };
export const SHELF_TALK = {
  open: ["Glow paint, tables and cabinets, darling. Every one was used to fool someone, or to catch them.", "Furnish your séance room, {name}. Then learn how each piece was caught."],
  tryon: ["{item}. Very spooky. Very fake.", "{item}. The committee is taking notes.", "There: {item}. Lights down, please."],
  buy: ["{item}, installed in the dark.", "Sold: {item}. Mind the trumpet.", "{item}. Houdini would inspect it immediately."],
};
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.darkseance); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.darkseance) { look[fromStore.slot] = fromStore.id; r.seenItem = p.darkseance; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.darkseance = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
