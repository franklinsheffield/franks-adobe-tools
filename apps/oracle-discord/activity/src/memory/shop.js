// Grimoire Memory card backs. The back is chosen on the Essence store's Cards shelf (cardbacks.js, prog.cardback),
// which dresses every deck in the Chamber; with "Each deck's own" the board keeps its starlit back.

import { cardBackSvg, equippedBack } from "../cardbacks.js";
import { ensureStyle } from "./style.js";

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

/** The room's shelf in the Essence store: the flourish that bursts from a pair when you match it. prog.gmflourish
 *  holds the equipped id. Each look: colours of the motes, their shape, and how they move. */
export const FLOURISH = {
  "gmf-gold": { c: ["#FADE8C", "#E2B04A"], shape: "dot", move: "rise" },
  "gmf-stardust": { c: ["#bff4ff", "#66E0C8"], shape: "star", move: "rise" },
  "gmf-petals": { c: ["#ffb3d1", "#ff4fb3"], shape: "petal", move: "fall" },
  "gmf-ink": { c: ["#9a8cff", "#3a2a8e"], shape: "drop", move: "burst" },
  "gmf-embers": { c: ["#ffd36b", "#ff5a1f"], shape: "dot", move: "burst" },
  "gmf-runes": { c: ["#c9d4ff", "#E2B04A"], shape: "rune", move: "rise" },
};
const DEFAULT_FLOURISH = "gmf-gold";
export const flourishOf = (prog) => FLOURISH[prog && prog.gmflourish] ? prog.gmflourish : DEFAULT_FLOURISH;
const RUNES = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ";
/** n motes of the equipped flourish, spread across the width. */
export function sparkHtml(id, n = 10) {
  const f = FLOURISH[id] || FLOURISH[DEFAULT_FLOURISH];
  return `<div class="gm-spark ${f.shape} ${f.move}" style="--s1:${f.c[0]};--s2:${f.c[1]}">${Array.from({ length: n }, (_, i) =>
    `<i style="--x:${5 + i * (90 / Math.max(1, n - 1))}%;--d:${(i % 5) * 80}ms;--dx:${((i * 37) % 60) - 30}px">${f.shape === "rune" ? RUNES[i % RUNES.length] : ""}</i>`).join("")}</div>`;
}
export const shop = {
  kind: "gmflourish",
  label: "🃏 Memory flourishes",
  items: [
    { id: "gmf-gold", name: "Gold sparks", note: "The classic: gold motes rise from every pair", price: 0 },
    { id: "gmf-stardust", name: "Stardust", note: "Teal stars drift up when a pair is found", price: 60 },
    { id: "gmf-petals", name: "Rose petals", note: "Pink petals tumble down over the pair", price: 70 },
    { id: "gmf-embers", name: "Embers", note: "Sparks burst out like a struck flint", price: 80 },
    { id: "gmf-ink", name: "Ink splash", note: "Drops of violet ink fly from the page", price: 90 },
    { id: "gmf-runes", name: "Rising runes", note: "Little runes float up off the cards", price: 120 },
  ],
  talk: {
    open: ["Flourishes for Grimoire Memory. Every pair you find goes off with one of these.", "A little celebration for each pair. Pick your sparkle."],
    tryon: ["{item}. Imagine that every time you remember a sign.", "Here's {item}. Memory loves a reward."],
    buy: ["{item}: yours. Your next pair will show it off.", "{item} is in your grimoire now."],
  },
  preview(id, ctx) { ensureStyle(); ctx.tableEl.className = "table gm-table"; ctx.tableEl.innerHTML = fanHtml(backOf(ctx.prog)) + sparkHtml(id, 14); ctx.cap("🃏 " + (shop.items.find((x) => x.id === id)?.name || "")); },
};
