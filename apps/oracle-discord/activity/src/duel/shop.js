// Element Duel's shelf in the Chamber's Essence store (store.js registerShelf): card backs and lab benches.
// Cosmetic only, bought with 💎 Essence (in-game, never money). Ids start with "db-" (card backs) and "bn-" (benches)
// and live in prog.owned like the rest of the store. prog.duel is the item last put on from the store; the back and
// bench in use are kept in prog.rooms.duel.look. Every note is a true fact.
export const SHOP = [
  { id: "db-atom", slot: "back", name: "Atom", note: "Electrons circling a nucleus, the way Bohr drew it in 1913", price: 0 },
  { id: "db-lattice", slot: "back", name: "Salt lattice", note: "In a salt crystal every sodium ion sits between six chloride ions", price: 60 },
  { id: "db-grid", slot: "back", name: "Mendeleev's table", note: "His 1869 table left gaps for undiscovered elements; gallium and germanium later filled them", price: 80 },
  { id: "db-benzene", slot: "back", name: "Kekulé's ring", note: "Kekulé said benzene's ring came to him in a daydream of a snake biting its own tail", price: 100 },
  { id: "db-spectrum", slot: "back", name: "Spectral lines", note: "Every element shines its own coloured lines: helium was found in the Sun's light in 1868, before it was found on Earth", price: 120 },
  { id: "db-radium", slot: "back", name: "Curie glow", note: "Marie Curie kept radium samples that glowed faintly in the dark of her lab", price: 150 },
  { id: "bn-school", slot: "bench", name: "School lab", note: "Grey worktop, tiled wall, a fire blanket you hope you never need", price: 0 },
  { id: "bn-alchemist", slot: "bench", name: "Alchemist's cellar", note: "Chemistry grew out of alchemy: Robert Boyle, a founder of modern chemistry, practised both", price: 90 },
  { id: "bn-lavoisier", slot: "bench", name: "Lavoisier's salon", note: "His balances were so precise he could show that mass is conserved in a reaction", price: 110 },
  { id: "bn-faraday", slot: "bench", name: "Faraday's basement", note: "Michael Faraday worked in the Royal Institution's basement lab, where he discovered benzene in 1825", price: 120 },
  { id: "bn-clean", slot: "bench", name: "Clean room", note: "Chip factories filter their air until it is far cleaner than a hospital operating theatre", price: 130 },
  { id: "bn-curie", slot: "bench", name: "Curie's shed", note: "Marie and Pierre Curie isolated radium in a draughty converted shed in Paris", price: 160 },
];
export const SLOTS = [["back", "🂠 Card backs"], ["bench", "🧪 Lab benches"]];
export const DEFAULT_LOOK = { back: "db-atom", bench: "bn-school" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
const dr = (p) => ((p.rooms ||= {}).duel ||= { plays: 0, wins: {}, played: {}, codex: {}, chains: {} });
/** The back and bench in use (an item just put on in the store wins). */
export function lookOf(p) {
  const r = dr(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.duel); if (fromStore && owns(p, fromStore.id) && r.seen !== p.duel) { look[fromStore.slot] = fromStore.id; r.seen = p.duel; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.duel = it.id; dr(p).seen = it.id; };
/** Buy (or, if owned, use) an item from inside the room. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}

export const SHELF_TALK = {
  open: ["Card backs and lab benches for Element Duel. Science is magic, but it still needs a nice table.", "The chemist's shelf, {name}. Every item comes with a true story."],
  tryon: ["{item}, laid out on the table. Very Mendeleev.", "There: {item}. The atoms approve.", "{item}. I may have to duel you harder now."],
  buy: ["{item} is yours. It's waiting in Element Duel.", "Sold: {item}. Mass and Essence conserved, mostly.", "{item}, bought. Go make some compounds."],
};
