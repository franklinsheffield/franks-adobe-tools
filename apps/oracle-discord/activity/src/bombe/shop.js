// The Bombe Room's shelf: cipher machines, bombes and huts, bought with 💎 Essence (in-game only, never money).
// Ids start with "bo-" and live in prog.owned. prog.bombe = the item last put on there; each slot in use is in
// prog.rooms.bombe.look. Every note is a real fact about Enigma and the codebreakers.
import { room } from "./logic.js";

export const SHOP = [
  { id: "bo-enigma", slot: "machine", name: "Enigma I", note: "The army and air force Enigma I had three rotors chosen from five, a reflector and a plugboard", price: 0 },
  { id: "bo-m4", slot: "machine", name: "Naval Enigma M4", note: "U-boats switched to the four-rotor M4 in February 1942, and Bletchley lost their messages for ten months", price: 70 },
  { id: "bo-typex", slot: "machine", name: "Typex", note: "Britain's own rotor machine, Typex, grew from the commercial Enigma; the Germans never broke it", price: 130 },
  { id: "bo-bombe", slot: "bombe", name: "British bombe", note: "Turing designed it and Welchman improved it; the British Tabulating Machine Company built them at Letchworth", price: 0 },
  { id: "bo-bomba", slot: "bombe", name: "Polish bomba", note: "Marian Rejewski designed the bomba in 1938, and in July 1939 the Poles shared their Enigma work with Britain and France", price: 80 },
  { id: "bo-usbombe", slot: "bombe", name: "US Navy bombe", note: "The US Navy's bombes were built by the National Cash Register Company in Dayton, Ohio, from 1943", price: 150 },
  { id: "bo-hut6", slot: "hut", name: "Hut 6", note: "Hut 6 broke army and air force Enigma; Hut 8, led at first by Turing, worked on naval Enigma", price: 0 },
  { id: "bo-wrens", slot: "hut", name: "Wrens' bombe bay", note: "Wrens ran the bombes in shifts round the clock, at Bletchley and outstations such as Eastcote and Stanmore", price: 60 },
  { id: "bo-cottage", slot: "hut", name: "The Cottage", note: "Dilly Knox's team in the Cottage, mostly women, broke the Abwehr's Enigma in December 1941", price: 110 },
];
export const SLOTS = [["machine", "⌨️ Cipher machines"], ["bombe", "⚙️ Bombes"], ["hut", "🏚️ Huts"]];
export const DEFAULT_LOOK = { machine: "bo-enigma", bombe: "bo-bombe", hut: "bo-hut6" };
export const SHELF_TALK = {
  open: ["Machines, bombes and huts for the Bombe Room, {name}. Every one of them real.", "The Wrens worked for rather less than this. Have a look."],
  tryon: ["{item} in the hut. Hear it clatter?", "{item}. Turing would want to take it apart.", "There: {item}. Now, where's the crib?"],
  buy: ["{item} is yours.", "Sold: {item}. Mind the cables.", "{item}. Tonight's key won't know what hit it."],
};
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.bombe); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.bombe) { look[fromStore.slot] = fromStore.id; r.seenItem = p.bombe; }
  return look;
}
const use = (p, it) => { lookOf(p)[it.slot] = it.id; p.bombe = it.id; room(p).seenItem = it.id; };
/** Buy (or, if owned, use) an item. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); use(p, it); return "bought"; }
  use(p, it); return "used";
}
