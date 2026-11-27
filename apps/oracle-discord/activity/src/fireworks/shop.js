// Fireworks Workshop shelf: shell casings, mortar tubes and sky backdrops, bought with 💎 Essence (never money). Ids "fw-".
import { room } from "./logic.js";
export const SHOP = [
  { id: "fw-paper", slot: "casing", name: "Paper shell casing", note: "Display shells are traditionally made of paper and paste, so they burn away in the burst", price: 0 },
  { id: "fw-round", slot: "casing", name: "Japanese round shell", note: "Japanese-style round shells (warimono) are known for the most symmetrical bursts", price: 80 },
  { id: "fw-cyl", slot: "casing", name: "Italian cylinder shell", note: "Italian-style cylinder shells stack effects in layers, good for shells that break several times", price: 90 },
  { id: "fw-card", slot: "tube", name: "Cardboard mortar", note: "Spiral-wound paper tubes were the standard mortar for small shells", price: 0 },
  { id: "fw-hdpe", slot: "tube", name: "HDPE mortar", note: "Modern displays fire from HDPE plastic tubes, which split rather than shatter if a shell bursts inside", price: 60 },
  { id: "fw-glass", slot: "tube", name: "Fibreglass mortar", note: "Fibreglass mortars are light and strong, used for big professional shells", price: 100 },
  { id: "fw-roof", slot: "sky", name: "Lab rooftop", note: "The workshop's own roof, chimney and all", price: 0 },
  { id: "fw-harbour", slot: "sky", name: "Harbour", note: "Shows over water are popular: the water doubles the bursts and keeps falling debris away from crowds", price: 70 },
  { id: "fw-castle", slot: "sky", name: "Castle walls", note: "Royal displays were fired over palaces and parks; Handel's Royal Fireworks music was written for one in 1749", price: 120 },
];
export const SLOTS = [["casing", "🧨 Shell casings"], ["tube", "🎆 Mortar tubes"], ["sky", "🌃 Sky backdrops"]];
export const DEFAULT_LOOK = { casing: "fw-paper", tube: "fw-card", sky: "fw-roof" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.fireworks); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.fireworks) { look[fromStore.slot] = fromStore.id; r.seenItem = p.fireworks; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.fireworks = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Casings, mortars and skies for the Fireworks Workshop.", "Every good show starts with good kit, {name}."],
  tryon: ["{item}. Picture the bursts over that.", "{item} in the workshop. Lovely.", "There: {item}."],
  buy: ["{item} is yours. Light something!", "Sold: {item}.", "{item}. The crowd will love it."],
};
