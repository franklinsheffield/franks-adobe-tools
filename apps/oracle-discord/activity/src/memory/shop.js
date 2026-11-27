// Grimoire Memory shelf in the Chamber's Essence store (store.js registerShelf): card backs for the memory board.
// Cosmetic only. The equipped id is prog.cardback; room.js deals every card with that back. Each note is a real fact.
import { GLYPH } from "../alchemy/glyphs.js";
import { ensureStyle } from "./style.js";

const svgOf = (inner, ink) => `<svg viewBox="0 0 40 40" aria-hidden="true" style="color:${ink}">${inner}</svg>`;
const STAR = `<path d="M20 4 L23.5 15.5 L35 16 L26 23.5 L29 35 L20 28.5 L11 35 L14 23.5 L5 16 L16.5 15.5 Z" fill="currentColor"/>`;
const ALGIZ = `<path d="M20 5 V36 M20 18 L10 7 M20 18 L30 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>`;
const OGHAM = `<path d="M20 3 V37 M12 9 H20 M12 14 H20 M20 20 H28 M20 25 H28 M20 30 H28 M13 35 L27 31" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`;
const EYE = `<path d="M5 18 Q20 6 35 18 Q20 28 5 18 Z M14 24 L12 34 M24 24 Q30 34 34 30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="20" cy="17.5" r="4.2" fill="currentColor"/>`;
const SHELL = `<ellipse cx="20" cy="22" rx="14" ry="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M10 22 Q20 15 30 22 M13 25 Q20 20 27 25" fill="none" stroke="currentColor" stroke-width="1.8"/>`;
const OURO = `<circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="4"/><path d="M29 11 L35 8 L33 15 Z" fill="currentColor"/><circle cx="31" cy="12" r="1" fill="#000"/>`;
const MOON = `<path d="M24 6 A14 14 0 1 0 24 34 A11 11 0 1 1 24 6 Z" fill="currentColor"/><circle cx="29" cy="12" r="1.6" fill="currentColor"/><circle cx="32" cy="22" r="1.1" fill="currentColor"/>`;

/** bg: the card's back; ink: the emblem colour; edge: the border; pat: an optional repeating pattern. */
const B = (id, name, note, price, look) => ({ id: "gm-" + id, name, note, price, look });
export const BACKS = [
  B("starlit", "Starlit card", "The Chamber's own night-sky back, free", 0,
    { bg: "radial-gradient(circle at 50% 40%,#2e1e68,#120a24 75%)", ink: "#E2B04A", edge: "#E2B04A", emblem: STAR }),
  B("seal", "Alchemist's seal", "Gold on oxblood, with the circle-and-dot that meant both gold and the Sun", 70,
    { bg: "radial-gradient(circle at 50% 40%,#7a1f22,#2a0708 80%)", ink: "#f4c869", edge: "#c8913a", emblem: GLYPH.gold }),
  B("runestone", "Runestone", "Granite with a red-painted algiz: rune carvers often painted their runes", 80,
    { bg: "linear-gradient(160deg,#6b6f76,#3a3d42 70%)", ink: "#c9322a", edge: "#9aa0a8", emblem: ALGIZ }),
  B("birch", "Birch stave", "Pale bark notched with Ogham, cut along a stemline as on the standing stones", 80,
    { bg: "repeating-linear-gradient(0deg,#ece6d6 0 9px,#d9d1bd 9px 10px,#ece6d6 10px 23px,#3b342a 23px 24px)", ink: "#3b342a", edge: "#b9ad92", emblem: OGHAM }),
  B("lapis", "Lapis and gold", "Lapis lazuli with the Eye of Horus, an amulet of protection in ancient Egypt", 100,
    { bg: "radial-gradient(circle at 50% 35%,#2f5bd3,#0f2167 80%)", ink: "#f1c75b", edge: "#f1c75b", emblem: EYE }),
  B("jade", "Maya jade", "Green jade with the shell that the Maya wrote for zero", 100,
    { bg: "radial-gradient(circle at 40% 30%,#3fbf8f,#0d5b45 80%)", ink: "#e9fff4", edge: "#a5f0cf", emblem: SHELL }),
  B("ouroboros", "Ouroboros", "The serpent eating its tail, drawn in Greek alchemy manuscripts as a sign that all is one", 130,
    { bg: "radial-gradient(circle at 50% 50%,#10241a,#030806 80%)", ink: "#6fe39a", edge: "#3c9e63", emblem: OURO }),
  B("moonlit", "Moonlit tarot", "A violet lattice and crescent moon, like the backs of old tarot decks", 150,
    { bg: "repeating-linear-gradient(45deg,#3a1f6e 0 6px,#2a1550 6px 12px)", ink: "#FADE8C", edge: "#FADE8C", emblem: MOON }),
];
export const DEFAULT_BACK = "gm-starlit";
export const backOf = (prog) => (BACKS.find((b) => b.id === (prog && prog.cardback)) || BACKS[0]).look;
/** Inline style + emblem for a card's back. */
export const backStyle = (look) => `--gm-bg:${look.bg};--gm-edge:${look.edge}`;
export const backHtml = (look) => svgOf(look.emblem.replace(/currentColor/g, look.ink), look.ink);

export const shop = {
  kind: "cardback", label: "🃏 Memory card backs",
  items: BACKS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["Card backs for Grimoire Memory. The fronts teach you; the backs just look smart.", "A new back won't help you remember. It will help you look like you remember.", "Every scribe needs a deck worth shuffling, traveller."],
    tryon: ["The {item}, fanned out on the table. Very mysterious.", "{item}. Even the face-down cards look wise now.", "Behold the {item}. Shuffle with confidence."],
    buy: ["The {item} is yours. Every memory board will be dealt with it.", "Sold: {item}. I've reshuffled your grimoire.", "{item}, bought. Your memory remains your own problem."],
  },
  /** Try-on: a fan of five cards with this back on the reading table. */
  preview(id, ctx) {
    const b = BACKS.find((x) => x.id === id); if (!b) return;
    ensureStyle(); const t = ctx.tableEl; t.className = "table gm-table"; t.innerHTML = fanHtml(b.look);
    ctx.cap("👁 Trying on: " + b.name);
  },
};

/** A fan of face-down cards, for the table when the room is idle and for try-ons. */
export function fanHtml(look, n = 5) {
  return `<div class="gm-fan">${Array.from({ length: n }, (_, i) => `<div class="gm-fcard" style="${backStyle(look)};--r:${(i - (n - 1) / 2) * 11}deg;--i:${i}"><div class="gm-back">${backHtml(look)}</div></div>`).join("")}</div>`;
}
