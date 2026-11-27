// Phantasmagoria shelf: lantern slides, stage glass and lanterns, bought with 💎 Essence (in-game only, never
// money). Ids start with "ph-". Cosmetic: they change how the show looks. Every note is a real fact.
import { room } from "./logic.js";

export const SHOP = [
  { id: "ph-spectre", slot: "slide", name: "Painted spectre slide", note: "Phantasmagoria slides were painted on glass with a black background, so only the figure lit up the smoke", price: 0 },
  { id: "ph-skeleton", slot: "slide", name: "Slip-slide skeleton", note: "A slip slide has a second sliding glass, so a skeleton's arm or jaw could move during the show", price: 80 },
  { id: "ph-nun", slot: "slide", name: "The Bleeding Nun", note: "The Bleeding Nun came from Matthew Lewis's 1796 Gothic novel The Monk, and haunted many ghost shows after it", price: 120 },
  { id: "ph-plate", slot: "glass", name: "Plain plate glass", note: "Pepper's ghost needs a big, spotless sheet of glass: a smear or a reflection of the hall gives it away", price: 0 },
  { id: "ph-polytechnic", slot: "glass", name: "Polytechnic glass", note: "John Henry Pepper first showed the illusion at the Royal Polytechnic Institution, London, at Christmas 1862", price: 70 },
  { id: "ph-mansion", slot: "glass", name: "Ballroom glass", note: "Disney's Haunted Mansion (1969) hides huge Pepper's ghost glass above its ballroom of dancing ghosts", price: 110 },
  { id: "ph-tin", slot: "lantern", name: "Tin magic lantern", note: "Magic lanterns go back to the 1650s: Christiaan Huygens sketched one around 1659", price: 0 },
  { id: "ph-fantascope", slot: "lantern", name: "Robertson's Fantascope", note: "Robertson patented his Fantascope in 1799: a lantern on wheels that rolled back so the ghost grew", price: 80 },
  { id: "ph-argand", slot: "lantern", name: "Argand-lamp lantern", note: "Aimé Argand's oil lamp of the 1780s burned far brighter than candles, which made big projections possible", price: 120 },
];
export const SLOTS = [["slide", "🎞️ Lantern slides"], ["glass", "🪞 Stage glass"], ["lantern", "🏮 Lanterns"]];
export const DEFAULT_LOOK = { slide: "ph-spectre", glass: "ph-plate", lantern: "ph-tin" };
export const SHELF_TALK = {
  open: ["Slides, glass and lanterns, darling. Every ghost here is made of light.", "Stock your ghost show, {name}. Mind the smoke."],
  tryon: ["{item}. Lights down, please.", "{item}. The front row shrieks already.", "There: {item}. A ghost, made of glass and lamp oil."],
  buy: ["{item}, loaded in the lantern.", "Sold: {item}. Robertson would be jealous.", "{item}. Polish it well: smears give ghosts away."],
};
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.phantasmagoria); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.phantasmagoria) { look[fromStore.slot] = fromStore.id; r.seenItem = p.phantasmagoria; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.phantasmagoria = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
