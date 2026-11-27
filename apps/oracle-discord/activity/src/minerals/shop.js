// Mineral Cabinet shelf: hand lenses, display cases and lamps, bought with 💎 Essence (in-game only, never money).
// Ids start with "mc-". The UV lamp is the one working tool: it adds the UV test at every level. Notes are real facts.
import { room } from "./logic.js";

export const SHOP = [
  { id: "mc-lens", slot: "lens", name: "Hand lens", note: "A 10x folding lens, the field geologist's first tool: hold it close to your eye, then bring the rock up to it", price: 0 },
  { id: "mc-loupe", slot: "lens", name: "Jeweller's loupe", note: "A triplet loupe with three lenses glued together, which cancels the colour fringes of a single lens", price: 50 },
  { id: "mc-brass", slot: "lens", name: "Brass magnifier", note: "A Victorian brass-rimmed reading glass, as in the collectors' cabinets of the 1800s", price: 90 },
  { id: "mc-tray", slot: "case", name: "Specimen tray", note: "A cardboard tray of little boxes, how most collections start", price: 0 },
  { id: "mc-drawer", slot: "case", name: "Oak drawers", note: "Shallow wooden drawers, the classic mineral cabinet. Museums still store collections this way", price: 80 },
  { id: "mc-dome", slot: "case", name: "Glass dome", note: "A Victorian glass dome to show off one prize specimen and keep the dust off", price: 60 },
  { id: "mc-museum", slot: "case", name: "Museum case", note: "A lit, glass-fronted case, like the mineral galleries that opened in 19th-century natural history museums", price: 150 },
  { id: "mc-nolamp", slot: "lamp", name: "No lamp", note: "Daylight only", price: 0 },
  { id: "mc-uv", slot: "lamp", name: "UV lamp", note: "Shortwave and longwave ultraviolet. Fluorite gives fluorescence its name. Adds the UV test at every level", price: 120 },
];
export const SLOTS = [["lens", "🔍 Lenses"], ["case", "🗄 Cases"], ["lamp", "🟣 Lamps"]];
export const DEFAULT_LOOK = { lens: "mc-lens", case: "mc-tray", lamp: "mc-nolamp" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.minerals); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.minerals) { look[fromStore.slot] = fromStore.id; r.seenItem = p.minerals; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.minerals = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
export const hasUv = (p) => lookOf(p).lamp === "mc-uv";
export const SHELF_TALK = {
  open: ["Lenses, cases and lamps for the Mineral Cabinet. Every one is real collector's kit.", "A good collection deserves a good drawer, {name}."],
  tryon: ["{item}. Very museum.", "{item}. The rocks look prouder already.", "There: {item}. Mind the dust."],
  buy: ["{item} is in your Cabinet now.", "Sold: {item}. Label everything.", "{item}. Every collector needs one."],
};
