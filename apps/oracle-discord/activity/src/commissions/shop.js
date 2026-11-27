// Commissions shelf: wax seals and job boards, bought with 💎 Essence (in-game only, never money). Ids start "cm-".
import { room } from "./logic.js";
export const SHOP = [
  { id: "cm-red", slot: "seal", name: "Red wax seal", note: "Sealing wax coloured with vermilion was the standard for letters from the 1500s", price: 0 },
  { id: "cm-black", slot: "seal", name: "Black mourning seal", note: "Black wax was used for letters sent in mourning, a Victorian custom", price: 50 },
  { id: "cm-green", slot: "seal", name: "Green seal", note: "Green wax was used on some English royal and exchequer documents", price: 70 },
  { id: "cm-gold", slot: "seal", name: "Gold seal", note: "Royal charters were sometimes sealed with gold bullae instead of wax", price: 140 },
  { id: "cm-oak", slot: "board", name: "Oak job board", note: "Plain oak boards held notices in market squares and guild halls", price: 0 },
  { id: "cm-slate", slot: "board", name: "Slate board", note: "Slate boards could be wiped and chalked again, like a school slate", price: 60 },
  { id: "cm-guild", slot: "board", name: "Guild hall board", note: "Guild halls displayed their charters and members' work on carved panels", price: 110 },
];
export const SLOTS = [["seal", "🔴 Wax seals"], ["board", "📋 Job boards"]];
export const DEFAULT_LOOK = { seal: "cm-red", board: "cm-oak" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.commissions); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.commissions) { look[fromStore.slot] = fromStore.id; r.seenItem = p.commissions; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.commissions = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Seals and boards for your Commissions. Every client deserves a proper seal.", "A good seal says the work is yours, {name}."],
  tryon: ["{item}. Very official.", "{item} on the board. Clients will notice.", "There: {item}."],
  buy: ["{item} is yours. Seal something!", "Sold: {item}.", "{item}. The Royal Society will be impressed."],
};
