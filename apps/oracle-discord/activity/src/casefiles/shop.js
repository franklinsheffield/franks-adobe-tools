// Case Files shelf: desk lamps, folders and lenses for the investigator's desk, bought with 💎 Essence (in-game only,
// never money). Ids start with "cf-". Cosmetic: they change how the desk looks. Every note is a real fact.
import { room } from "./logic.js";

export const SHOP = [
  { id: "cf-oil", slot: "lamp", name: "Oil lamp", note: "Kerosene lamps lit most homes, and most séances, before electric light", price: 0 },
  { id: "cf-banker", slot: "lamp", name: "Green banker's lamp", note: "The green-shaded desk lamp was patented in 1909 and sold as the Emeralite", price: 60 },
  { id: "cf-safe", slot: "lamp", name: "Darkroom safelight", note: "Darkrooms use red light because black-and-white photo paper barely reacts to red", price: 90 },
  { id: "cf-manila", slot: "folder", name: "Manila folder", note: "Manila folders were first made from Manila hemp, grown in the Philippines", price: 0 },
  { id: "cf-redtape", slot: "folder", name: "Bundle in red tape", note: "British official papers were tied with red tape, which gave us the phrase", price: 50 },
  { id: "cf-spr", slot: "folder", name: "Society dossier", note: "The Society for Psychical Research was founded in London in 1882 and still keeps its case files", price: 120 },
  { id: "cf-glass", slot: "lens", name: "Reading glass", note: "A single convex lens on a handle, the investigator's oldest tool", price: 0 },
  { id: "cf-codd", slot: "lens", name: "Coddington lens", note: "One thick lens with a groove cut round its middle to block stray light, popular in the 1800s", price: 45 },
  { id: "cf-print", slot: "lens", name: "Fingerprint glass", note: "Scotland Yard opened its Fingerprint Bureau in 1901, and folding print glasses followed", price: 80 },
];
export const SLOTS = [["lamp", "💡 Lamps"], ["folder", "🗂 Folders"], ["lens", "🔍 Lenses"]];
export const DEFAULT_LOOK = { lamp: "cf-oil", folder: "cf-manila", lens: "cf-glass" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.casefiles); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.casefiles) { look[fromStore.slot] = fromStore.id; r.seenItem = p.casefiles; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.casefiles = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Lamps, folders and lenses for your case desk, darling. Every one is real kit.", "A good investigator deserves a good desk, {name}."],
  tryon: ["{item}. Very Scotland Yard.", "{item}. Now the evidence looks nervous.", "There: {item}. Mind the candle wax."],
  buy: ["{item} is on your desk now.", "Sold: {item}. Label everything.", "{item}. Houdini kept a desk like this."],
};
