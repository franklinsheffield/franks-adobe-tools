// Grimoire Memory card backs. The back is chosen on the Essence store's Cards shelf (cardbacks.js, prog.cardback),
// which dresses every deck in the Chamber; with "Each deck's own" the board keeps its starlit back.

import { cardBackSvg, equippedBack } from "../cardbacks.js";

const svgOf = (inner, ink) => `<svg viewBox="0 0 40 40" aria-hidden="true" style="color:${ink}">${inner}</svg>`;
const STAR = `<path d="M20 4 L23.5 15.5 L35 16 L26 23.5 L29 35 L20 28.5 L11 35 L14 23.5 L5 16 L16.5 15.5 Z" fill="currentColor"/>`;

/** The room's own back, used while the Cards shelf is set to "Each deck's own". */
export const OWN_BACK = { bg: "radial-gradient(circle at 50% 40%,#2e1e68,#120a24 75%)", ink: "#E2B04A", edge: "#E2B04A", emblem: STAR };
/** The look to deal with: the card back equipped on the store's Cards shelf (prog.cardback), else the room's own. */
export const backOf = (prog) => { const id = equippedBack(prog); return id ? { unified: id, edge: "#FADE8C" } : OWN_BACK; };
/** Inline style + emblem for a card's back. */
export const backStyle = (look) => (look.unified ? `--gm-bg:#120a24;--gm-edge:${look.edge}` : `--gm-bg:${look.bg};--gm-edge:${look.edge}`);
export const backHtml = (look) => (look.unified ? cardBackSvg(look.unified) : svgOf(look.emblem.replace(/currentColor/g, look.ink), look.ink));

/** A fan of face-down cards, for the table when the room is idle and for try-ons. */
export function fanHtml(look, n = 5) {
  return `<div class="gm-fan">${Array.from({ length: n }, (_, i) => `<div class="gm-fcard" style="${backStyle(look)};--r:${(i - (n - 1) / 2) * 11}deg;--i:${i}"><div class="gm-back">${backHtml(look)}</div></div>`).join("")}</div>`;
}
