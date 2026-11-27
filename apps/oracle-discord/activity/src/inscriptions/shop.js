// The Inscription Tray's shelf: lights, copying kit and trays, bought with 💎 Essence (in-game only, never money).
// Ids start with "in-" and live in prog.owned like the Chamber store. The room registers one shelf ("inscriptions");
// prog.inscriptions = the item last put on there; each slot in use is in prog.rooms.inscriptions.look.
// Every note is a real fact about how epigraphers and archivists read old writing.
import { room } from "./logic.js";

export const SHOP = [
  { id: "in-lamp", slot: "light", name: "Oil lamp", note: "Clay oil lamps lit scriptoria and libraries for over 2,000 years; scribes still preferred daylight", price: 0 },
  { id: "in-raking", slot: "light", name: "Raking-light torch", note: "Light skimming across a surface at a low angle throws worn letters into shadow, a standard trick for reading old stones", price: 45 },
  { id: "in-rti", slot: "light", name: "RTI dome", note: "Reflectance Transformation Imaging photographs an object lit from dozens of angles, so faint marks can be relit on screen", price: 130 },
  { id: "in-charcoal", slot: "copy", name: "Charcoal rubbing", note: "Paper laid over a carving and rubbed with charcoal or wax picks up every raised edge; gravestone hunters still do it", price: 0 },
  { id: "in-squeeze", slot: "copy", name: "Paper squeeze", note: "Wet paper beaten into a stone with a stiff brush dries into a mould of the letters. Henry Rawlinson's team made squeezes at Behistun", price: 60 },
  { id: "in-cast", slot: "copy", name: "Plaster cast", note: "Museums made plaster casts of inscriptions in the 1800s; some now preserve letters that weathered away on the originals", price: 110 },
  { id: "in-wood", slot: "tray", name: "Wooden finds tray", note: "A shallow wooden tray, the field archaeologist's first home for a find", price: 0 },
  { id: "in-drawer", slot: "tray", name: "Glass-topped museum drawer", note: "Victorian museums kept small finds in shallow drawers under glass, so visitors could look without touching", price: 70 },
  { id: "in-box", slot: "tray", name: "Acid-free archive box", note: "Archives store papers in acid-free boxes because ordinary card slowly turns acidic and yellows what it holds", price: 90 },
];
export const SLOTS = [["light", "💡 Lights"], ["copy", "📄 Copies"], ["tray", "🗃 Trays"]];
export const DEFAULT_LOOK = { light: "in-lamp", copy: "in-charcoal", tray: "in-wood" };
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.inscriptions); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.inscriptions) { look[fromStore.slot] = fromStore.id; r.seenItem = p.inscriptions; }
  return look;
}
const use = (p, it) => { lookOf(p)[it.slot] = it.id; p.inscriptions = it.id; room(p).seenItem = it.id; };
/** Buy (or, if owned, use) an item. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); use(p, it); return "bought"; }
  use(p, it); return "used";
}
export const SHELF_TALK = {
  open: ["Lights, copying kit and trays for the Inscription Tray. Every one is a real way people read old writing.", "Worn letters need good light, {name}. Have a look."],
  tryon: ["{item} on the tray. Look how the letters stand up.", "{item}. Every scholar has a favourite.", "There: {item}. Mind the dust."],
  buy: ["{item} is on your tray now.", "Sold: {item}. Handle the finds gently.", "{item}. The next inscription won't know what hit it."],
};
