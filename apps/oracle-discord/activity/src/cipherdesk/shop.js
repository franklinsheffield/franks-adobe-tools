// The Cipher Desk's shelf: desk lamps, cipher tools and desks, bought with 💎 Essence (in-game only, never money).
// Ids start with "cd-" and live in prog.owned like the Chamber store. prog.cipherdesk = the item last put on there;
// each slot in use is in prog.rooms.cipherdesk.look. Every note is a real fact about codebreakers and their desks.
import { room } from "./logic.js";

export const SHOP = [
  { id: "cd-tallow", slot: "lamp", name: "Tallow candle", note: "Tallow candles were made of animal fat: cheap, smoky and smelly. Most clerks worked by them all the same", price: 0 },
  { id: "cd-beeswax", slot: "lamp", name: "Beeswax candle", note: "Beeswax burned cleaner and brighter than tallow but cost far more, so churches and rich households used it", price: 50 },
  { id: "cd-banker", slot: "lamp", name: "Green banker's lamp", note: "The green-glass desk lamp was patented in 1909 by Harrison McFaddin, sold as the Emeralite", price: 140 },
  { id: "cd-strip", slot: "tool", name: "Paper alphabet strip", note: "Two strips of the alphabet slid against each other make a Caesar cipher: line up A with D and read across", price: 0 },
  { id: "cd-alberti", slot: "tool", name: "Alberti cipher disk", note: "Leon Battista Alberti described two turning disks in 1467, the first cipher that changes alphabet as it goes", price: 70 },
  { id: "cd-wheel", slot: "tool", name: "Jefferson wheel", note: "Thomas Jefferson described a stack of 36 lettered wooden discs on an axle around 1795; the US Army used the idea in 1922", price: 150 },
  { id: "cd-pine", slot: "desk", name: "Clerk's pine desk", note: "A plain sloped desk, like the ones clerks copied letters at for centuries", price: 0 },
  { id: "cd-vienna", slot: "desk", name: "Black Chamber desk", note: "Vienna's secret cabinet office opened diplomats' post in the 1700s, copied it and resealed it, often within hours", price: 90 },
  { id: "cd-pennant", slot: "banner", name: "Linen pennant", note: "A plain linen pennant for Split Key races: Team Quill flies red, Team Seal flies blue", price: 0 },
  { id: "cd-cabinet", slot: "banner", name: "Cabinet Noir banner", note: "France's Cabinet Noir opened and read private letters for the king from the 1600s; the name came to mean any secret post-opening office", price: 80 },
  { id: "cd-hut", slot: "banner", name: "Hut 6 banner", note: "Bletchley Park's codebreakers worked in wooden huts known by number: Hut 6 broke German Army and Air Force Enigma, Hut 8 the Navy's", price: 130 },
  { id: "cd-room40", slot: "desk", name: "Room 40 desk", note: "Britain's First World War codebreakers worked from Room 40 of the Admiralty's Old Building, and kept the name", price: 120 },
];
export const SLOTS = [["lamp", "🕯️ Lamps"], ["tool", "🎡 Cipher tools"], ["desk", "🪑 Desks"], ["banner", "🚩 Split Key banners"]];
export const DEFAULT_LOOK = { lamp: "cd-tallow", tool: "cd-strip", desk: "cd-pine", banner: "cd-pennant" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.cipherdesk); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.cipherdesk) { look[fromStore.slot] = fromStore.id; r.seenItem = p.cipherdesk; }
  return look;
}
const use = (p, it) => { lookOf(p)[it.slot] = it.id; p.cipherdesk = it.id; room(p).seenItem = it.id; };
/** Buy (or, if owned, use) an item. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); use(p, it); return "bought"; }
  use(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Lamps, cipher tools and desks for the Cipher Desk. Each one is real codebreakers' kit.", "A good lamp halves the work, {name}. Have a look."],
  tryon: ["{item} on the desk. Looks official.", "{item}. Every codebreaker has a favourite.", "There: {item}. Now, where did I put that letter?"],
  buy: ["{item} is on your desk now.", "Sold: {item}. Use it wisely.", "{item}. The next cipher won't know what hit it."],
};
