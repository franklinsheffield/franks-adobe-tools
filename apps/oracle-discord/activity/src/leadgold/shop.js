// Lead into Gold shelf: reactor lamps (the glow of the lab) and isotope charms, bought with 💎 Essence (never money). Ids "lg-".
import { room } from "./logic.js";
export const SHOP = [
  { id: "lg-cherenkov", slot: "lamp", name: "Cherenkov lamp", hex: "#4fb3ff", note: "The blue glow in a reactor pool is Cherenkov light: particles moving faster than light can travel through water", price: 0 },
  { id: "lg-uglass", slot: "lamp", name: "Uranium glass lamp", hex: "#7dff6a", note: "Uranium glass glows bright green under ultraviolet light because of the uranium in it", price: 60 },
  { id: "lg-goldleaf", slot: "lamp", name: "Gold-leaf lamp", hex: "#ffd25e", note: "Gold can be beaten into leaf less than a ten-thousandth of a millimetre thick, thin enough to let green light through", price: 90 },
  { id: "lg-atom", slot: "charm", name: "Rutherford atom", e: "⚛️", note: "In 1911 Rutherford showed that an atom's mass sits in a tiny nucleus at its centre", price: 0 },
  { id: "lg-pig", slot: "charm", name: "Lead pig", e: "🛢️", note: "Thick lead containers for radioactive sources are called pigs. Lead's dense nuclei soak up gamma rays", price: 70 },
  { id: "lg-nugget", slot: "charm", name: "Gold nugget", e: "🪙", note: "Most of the universe's gold was forged in neutron-star collisions; the 2017 kilonova GW170817 showed heavy elements being made", price: 110 },
];
export const SLOTS = [["lamp", "💡 Reactor lamps"], ["charm", "🧿 Isotope charms"]];
export const DEFAULT_LOOK = { lamp: "lg-cherenkov", charm: "lg-atom" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.leadgold); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.leadgold) { look[fromStore.slot] = fromStore.id; r.seenItem = p.leadgold; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.leadgold = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Lamps and charms for the transmutation bench.", "Every alchemist needs a good lamp, {name}."],
  tryon: ["The {item}. Very scientific. Very glowy.", "Picture the {item} on the bench."],
  buy: ["The {item} is yours. To the bench!", "Sold. The {item} suits the lab."],
};
