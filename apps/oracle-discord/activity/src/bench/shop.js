// Discovery Bench shelf: crucibles and mortars, bought with 💎 Essence (in-game only, never money). Ids start "db-".
import { room } from "./logic.js";
export const SHOP = [
  { id: "db-clay", slot: "crucible", name: "Clay crucible", note: "Fired clay pots like these were used to smelt copper from about 5000 BCE", price: 0 },
  { id: "db-hessian", slot: "crucible", name: "Hessian crucible", note: "Crucibles from Hesse in Germany were exported all over Europe from the Middle Ages for their heat resistance", price: 60 },
  { id: "db-graphite", slot: "crucible", name: "Graphite crucible", note: "Graphite survives furnace heat and is not wetted by molten metal; foundries still use it", price: 90 },
  { id: "db-platinum", slot: "crucible", name: "Platinum crucible", note: "Chemists used platinum crucibles from the 1780s because almost nothing attacks platinum", price: 160 },
  { id: "db-stone", slot: "mortar", name: "Stone mortar", note: "A granite mortar and pestle: the oldest grinding tool in any lab or kitchen", price: 0 },
  { id: "db-agate", slot: "mortar", name: "Agate mortar", note: "Agate is hard (Mohs 7) and smooth, so it grinds without adding grit of its own", price: 70 },
  { id: "db-wedgwood", slot: "mortar", name: "Wedgwood mortar", note: "Josiah Wedgwood made hard porcelain lab mortars from the 1770s", price: 100 },
];
export const SLOTS = [["crucible", "🫕 Crucibles"], ["mortar", "🪨 Mortars"]];
export const DEFAULT_LOOK = { crucible: "db-clay", mortar: "db-stone" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.bench); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.bench) { look[fromStore.slot] = fromStore.id; r.seenItem = p.bench; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.bench = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Crucibles and mortars for the Discovery Bench. Real lab kit, every one.", "Good glassware is half the discovery, {name}."],
  tryon: ["{item} on the bench. Lovely.", "{item}. Ready for anything but aqua regia.", "There: {item}."],
  buy: ["{item} is on your Discovery Bench now.", "Sold: {item}. Keep it clean.", "{item}. Now go and discover something."],
};
