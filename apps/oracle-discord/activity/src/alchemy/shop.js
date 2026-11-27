// The Lab's apothecary: cosmetic upgrades for the workbench, bought with 💎 Essence (in-game only, never money).
// Ids start with "al-" and live in prog.owned like the Chamber store. The Lab registers one shelf ("alchemy") in the
// Chamber's Essence store (store.js registerShelf); prog.alchemy is the item last put on there, and each slot
// (vessel, fire, charm) in use is kept in prog.rooms.alchemy.look.
// Each item's note is a real fact (flame colours are the real flame-test colours of those metals).
export const SHOP = [
  { id: "al-alembic", slot: "vessel", name: "Glass alembic", note: "The classic: a flask, a beaked head and a receiver", price: 0 },
  { id: "al-pelican", slot: "vessel", name: "Pelican", note: "A real alchemists' flask whose two arms curve back into its belly, so vapour circulates for ever", price: 90 },
  { id: "al-retort", slot: "vessel", name: "Retort", note: "A bulb with a long bent neck, used for distilling from alchemy until the 1900s", price: 70 },
  { id: "al-copper", slot: "vessel", name: "Copper still", note: "A hammered copper pot with a swan neck, like the stills that make whisky", price: 120 },
  { id: "al-coal", slot: "fire", name: "Charcoal fire", note: "Orange flames from glowing charcoal", price: 0, flame: ["#fff4c2", "#ffb347", "#ff6a1f"] },
  { id: "al-cu", slot: "fire", name: "Copper-green flame", note: "Copper salts turn a flame green-blue: a real flame test", price: 60, flame: ["#e9fff2", "#5ff0a0", "#11a37a"] },
  { id: "al-k", slot: "fire", name: "Lilac flame", note: "Potassium burns lilac, the colour Davy saw in 1807", price: 80, flame: ["#fbf0ff", "#d2a8ff", "#8a55d8"] },
  { id: "al-sr", slot: "fire", name: "Crimson flame", note: "Strontium salts give the deep red of fireworks", price: 80, flame: ["#ffe3e3", "#ff4a5a", "#b3122a"] },
  { id: "al-na", slot: "fire", name: "Sodium flare", note: "A pinch of salt turns any flame bright yellow-orange", price: 60, flame: ["#ffffff", "#ffe14a", "#ff9d00"] },
  { id: "al-bare", slot: "charm", name: "Bare wall", note: "Just stone and shadows", price: 0 },
  { id: "al-ouroboros", slot: "charm", name: "Ouroboros banner", note: "The serpent eating its tail, drawn in Greek alchemy manuscripts as a sign that all is one", price: 100 },
  { id: "al-tablet", slot: "charm", name: "Emerald Tablet", note: "The legendary text credited to Hermes Trismegistus: 'as above, so below'", price: 120 },
  { id: "al-stone", slot: "charm", name: "Philosopher's Stone", note: "A glowing red stone. Nobody ever made one; this one is for show", price: 250 },
];
export const SLOTS = [["vessel", "⚗️ Vessels"], ["fire", "🔥 Furnace flames"], ["charm", "🐍 Wall charms"]];
export const DEFAULT_LOOK = { vessel: "al-alembic", fire: "al-coal", charm: "al-bare" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = ((p.rooms ||= {}).alchemy ||= { plays: 0, solved: {}, elements: [], last: null }), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.alchemy); if (fromStore && owns(p, fromStore.id) && r.seen !== p.alchemy) { look[fromStore.slot] = fromStore.id; r.seen = p.alchemy; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.alchemy = it.id; p.rooms.alchemy.seen = it.id; };
/** Buy (or, if owned, use) an item. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}

/** The Lab's shelf in the Chamber's Essence store (registered by main.js). */
export const SHELF_TALK = {
  open: ["Glassware, coloured fires and curios for the Alchemist's Lab. Every one of them is a real piece of alchemy.", "Ah, a fellow puffer of bellows. Browse the Lab shelf, {name}."],
  tryon: ["Look at {item} on the bench. Very Paracelsus.", "{item}. Newton would have owned two.", "There: {item}. The furnace approves."],
  buy: ["{item} is on your bench in the Lab now.", "Sold: {item}. No philosopher's stone required.", "{item}, wrapped in a page of an old grimoire. Enjoy."],
};
