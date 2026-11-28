// The Forgery Desk's shelf: lamps, lenses and famous case files, bought with 💎 Essence (in-game only, never money).
// Ids start with "fo-" and live in prog.owned. prog.forgery = the item last put on there; each slot in use is in
// prog.rooms.forgery.look. Every note is a real fact about document examination.
import { room } from "./logic.js";

export const SHOP = [
  { id: "fo-woods", slot: "lamp", name: "Wood's lamp", note: "Robert W. Wood made the filter glass in 1903 that lets ultraviolet through and blocks most visible light", price: 0 },
  { id: "fo-quartz", slot: "lamp", name: "Museum UV lamp", note: "In 1931 James Rorimer of the Met published a book on using UV light to spot repairs in works of art", price: 65 },
  { id: "fo-ir", slot: "lamp", name: "Infrared camera", note: "Infrared imaging reads carbon ink that has gone dark, and has brought out faded text on the Dead Sea Scrolls", price: 130 },
  { id: "fo-loupe", slot: "lens", name: "Jeweller's loupe", note: "A standard loupe magnifies ten times, enough to see paper fibres and the edges of printed letters", price: 0 },
  { id: "fo-raking", slot: "lens", name: "Raking light", note: "Light skimmed low across a page shows indented writing and erasures that flat light hides", price: 60 },
  { id: "fo-micro", slot: "lens", name: "Comparison microscope", note: "A comparison microscope shows two samples side by side; forensic examiners took it up in the 1920s", price: 120 },
  { id: "fo-donation", slot: "case", name: "The Donation file", note: "In 1440 Lorenzo Valla proved the Donation of Constantine a forgery from its Latin alone", price: 0 },
  { id: "fo-hitler", slot: "case", name: "The Diaries file", note: "The 1983 'Hitler Diaries' fell to tests that found paper whitener and threads made after the war", price: 75 },
  { id: "fo-vinland", slot: "case", name: "The Vinland file", note: "Yale's Vinland Map was declared a forgery in 2021: its ink contains titanium from the 1920s or later", price: 140 },
];
export const SLOTS = [["lamp", "🔦 Lamps"], ["lens", "🔍 Lenses"], ["case", "🗂️ Case files"]];
export const DEFAULT_LOOK = { lamp: "fo-woods", lens: "fo-loupe", case: "fo-donation" };
export const SHELF_TALK = {
  open: ["Lamps, lenses and the great case files for the Forgery Desk, {name}.", "Every examiner needs good light. Have a look."],
  tryon: ["{item} on the desk. Let's see what it shows.", "{item}. Forgers hate this one.", "There: {item}. Now, what's too new?"],
  buy: ["{item} is yours.", "Sold: {item}. Use it wisely.", "{item}. The next forger won't stand a chance."],
};
export const shopItem = (id) => SHOP.find((s) => s.id === id);
export const owns = (p, id) => shopItem(id)?.price === 0 || (p.owned || []).includes(id);
export function lookOf(p) {
  const r = room(p), look = (r.look = { ...DEFAULT_LOOK, ...(r.look || {}) });
  const fromStore = shopItem(p.forgery); if (fromStore && owns(p, fromStore.id) && r.seenItem !== p.forgery) { look[fromStore.slot] = fromStore.id; r.seenItem = p.forgery; }
  return look;
}
const use = (p, it) => { lookOf(p)[it.slot] = it.id; p.forgery = it.id; room(p).seenItem = it.id; };
/** Buy (or, if owned, use) an item. "used" | "bought" | "poor" | null */
export function buyOrUse(p, id) {
  const it = shopItem(id); if (!it) return null;
  if (!owns(p, id)) { if ((p.essence || 0) < it.price) return "poor"; p.essence -= it.price; (p.owned ||= []).push(id); use(p, it); return "bought"; }
  use(p, it); return "used";
}
