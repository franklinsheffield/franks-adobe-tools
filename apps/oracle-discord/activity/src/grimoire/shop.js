// Herbalist's Grimoire shelf in the Chamber's Essence store (store.js registerShelf): page styles for the grimoire.
// Cosmetic only. The equipped id is prog.grimoire; room.js draws each specimen on it.
import { pageSvg, PAGE_THEMES } from "./sketch.js";
import { plantById } from "./logic.js";

export const PAGES = [
  { id: "gr-parchment", theme: "parchment", name: "Herbarium parchment", note: "the classic, free", price: 0 },
  { id: "gr-vellum", theme: "vellum", name: "Pressed-flower vellum", note: "bright page, dried blooms in the margins", price: 60 },
  { id: "gr-moss", theme: "moss", name: "Mossy hedgerow", note: "green page, climbing vine border", price: 80 },
  { id: "gr-moth", theme: "moth", name: "Moth-wing folio", note: "old brown page, three resting moths", price: 90 },
  { id: "gr-moonlit", theme: "moonlit", name: "Moonlit garden", note: "silver-blue page under the stars", price: 120 },
  { id: "gr-alchemist", theme: "alchemist", name: "Alchemist's gilt", note: "gold corners and planetary symbols", price: 150 },
  { id: "gr-poison", theme: "poison", name: "Poison garden ledger", note: "skulls in the margins, nightshade vine", price: 180 },
];
export const DEFAULT_PAGE = "gr-parchment";
/** The page look a member has on (falls back to parchment). */
export const themeOf = (prog) => PAGE_THEMES[(PAGES.find((x) => x.id === (prog && prog.grimoire)) || PAGES[0]).theme];

export const shop = {
  kind: "grimoire", label: "🌿 Herbalist",
  items: PAGES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["The herbalist's shelf. Pages for your grimoire, pressed and dried. Nothing here is edible, I checked.", "Grimoire pages, traveller. Every specimen deserves a good frame.", "Mind the poison garden ledger. Purely decorative. Mostly."],
    tryon: ["Here is {item}, with a specimen laid on it. Very scholarly.", "{item}. Your plants will look positively medicinal.", "Behold: {item}. The foxgloves approve."],
    buy: ["{item} is yours. Your grimoire is now the envy of every apothecary.", "Sold: {item}. I've bound it into your grimoire already.", "{item}, bought and pressed. Go identify something."],
  },
  /** Try-on: a sample specimen on the page, drawn on the reading table. */
  preview(id, ctx) {
    const pg = PAGES.find((x) => x.id === id); if (!pg) return;
    const sample = plantById(pg.theme === "poison" ? "belladonna" : pg.theme === "moonlit" ? "datura" : pg.theme === "vellum" ? "chamomile" : "foxglove");
    const t = ctx.tableEl; t.className = "table grimoire"; t.innerHTML = pageSvg(sample, { revealed: true, no: 7, theme: PAGE_THEMES[pg.theme], poison: sample.danger[0] === "poison" });
    ctx.cap("👁 Trying on: " + pg.name);
  },
};
