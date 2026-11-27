// Mentalist shelf: blindfolds, backdrops and props, bought with 💎 Essence (in-game only, never money). Ids start
// with "mt-". Cosmetic: they change how the stage looks. Card backs are NOT here: the face-down cards wear the one
// shared card back from the store's Cards department. Every note is a real fact.
import { room } from "./logic.js";

export const SHOP = [
  { id: "mt-silk", slot: "blindfold", name: "Black silk blindfold", note: "Most blindfolds leave a gap down the side of the nose. Mentalists call a glance through it the 'nose peek'", price: 0 },
  { id: "mt-coins", slot: "blindfold", name: "Coins and tape", note: "Some blindfold acts had coins taped over the eyes first, to look more convincing to the audience", price: 60 },
  { id: "mt-kuda", slot: "blindfold", name: "Dough and bandages", note: "Kuda Bux performed with dough and bandages over his eyes, and in 1945 rode a bicycle through Times Square that way", price: 100 },
  { id: "mt-velvet", slot: "backdrop", name: "Black velvet drape", note: "Black velvet soaks up almost all light, which is why magicians use it to hide wires and black-clad helpers", price: 0 },
  { id: "mt-zancig", slot: "backdrop", name: "'Two Minds' banner", note: "Julius and Agnes Zancig billed their code act as 'Two Minds with but a Single Thought'", price: 80 },
  { id: "mt-egyptian", slot: "backdrop", name: "Egyptian Hall stage", note: "London's Egyptian Hall was 'England's Home of Mystery': Maskelyne and Cooke performed there from 1873", price: 120 },
  { id: "mt-slate", slot: "prop", name: "School slate", note: "Slates were cheap classroom writing boards, so mentalists and mediums used them for 'messages'", price: 0 },
  { id: "mt-crystal", slot: "prop", name: "Alexander's crystal", note: "Claude Alexander Conlin, 'Alexander, the Man Who Knows', answered audience questions with a crystal ball in the 1910s and 1920s", price: 70 },
  { id: "mt-dunninger", slot: "prop", name: "Dunninger's writing pad", note: "Joseph Dunninger read minds on radio and TV in the 1940s and offered $10,000 to anyone who could prove he used plants", price: 90 },
];
export const SLOTS = [["blindfold", "🙈 Blindfolds"], ["backdrop", "🎭 Backdrops"], ["prop", "🔮 Props"]];
export const DEFAULT_LOOK = { blindfold: "mt-silk", backdrop: "mt-velvet", prop: "mt-slate" };
export const SHELF_TALK = {
  open: ["Blindfolds, backdrops and props, darling. The card backs are in the Cards department.", "Dress your stage, {name}. Every piece fooled someone once."],
  tryon: ["{item}. Very mysterious.", "{item}. The audience leans in.", "There: {item}. Now look as if you can't see."],
  buy: ["{item}, set on stage.", "Sold: {item}. Mind the nose peek.", "{item}. Houdini would ask to inspect it."],
};
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.mentalist); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.mentalist) { look[fromStore.slot] = fromStore.id; r.seenItem = p.mentalist; }
  return look;
}
const wear = (p, it) => { lookOf(p)[it.slot] = it.id; p.mentalist = it.id; room(p).seenItem = it.id; };
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); wear(p, it); return "bought"; }
  wear(p, it); return "used";
}
