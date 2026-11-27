// Flame Test Lab's shelf: burners, wire loops and spectroscopes, bought with 💎 Essence (in-game only, never money).
// Ids start with "ft-" and live in prog.owned like the Chamber store. The room registers one shelf ("flametest") in the
// Chamber's Essence store; prog.flametest = the item last put on there; each slot in use is in prog.rooms.flametest.look.
// Every note is a real fact.
import { room } from "./logic.js";

export const SHOP = [
  { id: "ft-bunsen", slot: "burner", name: "Bunsen burner", note: "Designed by Robert Bunsen and Peter Desaga in 1855: air mixed in before burning makes a hot, almost invisible flame, ideal for flame tests", price: 0 },
  { id: "ft-spirit", slot: "burner", name: "Spirit lamp", note: "A cotton wick in alcohol. Cooler than a Bunsen; the classic lamp for boric acid's green flame", price: 40 },
  { id: "ft-teclu", slot: "burner", name: "Teclu burner", note: "Nicolae Teclu's 1892 burner adds a screw-adjusted air cone for a hotter, steadier flame", price: 70 },
  { id: "ft-meker", slot: "burner", name: "Méker burner", note: "Georges Méker's burner (about 1905) has a wire grid that splits the flame into many small, hotter flames", price: 100 },
  { id: "ft-nichrome", slot: "wire", name: "Nichrome wire loop", note: "Nickel-chromium wire: cheap and tough, and it barely colours the flame. Clean it in acid between samples", price: 0 },
  { id: "ft-splint", slot: "wire", name: "Wooden splint", note: "A splint soaked in the salt solution, a common school method. Read the colour before the wood catches", price: 30 },
  { id: "ft-platinum", slot: "wire", name: "Platinum wire", note: "Bunsen's choice: platinum does not react or colour the flame, but it is expensive", price: 120 },
  { id: "ft-hand", slot: "scope", name: "Pocket spectroscope", note: "A slit and a set of prisms in a brass tube, a direct-vision design students still use", price: 0 },
  { id: "ft-grating", slot: "scope", name: "Diffraction grating", note: "Thousands of fine lines per millimetre split light like a prism. Fraunhofer made early ones from 1821", price: 90 },
  { id: "ft-bk", slot: "scope", name: "Bunsen-Kirchhoff spectroscope", note: "Their 1859 instrument: a prism, a slit tube, a telescope and a lit scale on a stand", price: 150 },
];
export const SLOTS = [["burner", "🔥 Burners"], ["wire", "🪝 Wire loops"], ["scope", "🔭 Spectroscopes"]];
export const DEFAULT_LOOK = { burner: "ft-bunsen", wire: "ft-nichrome", scope: "ft-hand" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.flametest); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.flametest) { look[fromStore.slot] = fromStore.id; r.seenItem = p.flametest; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.flametest = it.id; room(p).seenItem = it.id; };
/** Buy (or, if owned, use) an item. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Burners, wire loops and spectroscopes for the Flame Test Lab. Every one is a real piece of lab kit.", "Light it up, {name}. Every flame on this shelf tells you an element."],
  tryon: ["{item} on the bench. Mind your sleeves.", "{item}. Bunsen would approve.", "There: {item}. The flame looks keener already."],
  buy: ["{item} is on your bench in the Flame Test Lab.", "Sold: {item}. Keep it clean between samples.", "{item}. Now go and set something on fire, safely."],
};
