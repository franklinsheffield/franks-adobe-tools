// The Impostor's shelf in the Essence store: masquerade masks. The one you wear sits on your chair at the Impostor
// table and drops off the impostor at the reveal. Registered through ROOMS -> registerShelf (room.js shops).
export const MASK_LOOK = {
  "im-domino": { fill: "#1b1b24", trim: "#FADE8C", shape: "domino" },
  "im-columbina": { fill: "#c8a2ff", trim: "#FADE8C", shape: "columbina" },
  "im-volto": { fill: "#f4f1ea", trim: "#c9c2b4", shape: "volto" },
  "im-bauta": { fill: "#e8d6a8", trim: "#8a6420", shape: "bauta" },
};
export const DEFAULT_MASK = "im-domino";
export const maskLook = (id) => MASK_LOOK[id] || MASK_LOOK[DEFAULT_MASK];

/** A mask at (x, y), about 40 px wide. */
export function maskSvg(id, x, y, s = 1) {
  const m = maskLook(id), eyes = `<ellipse cx="-8" cy="0" rx="5" ry="3.4" fill="#07040f"/><ellipse cx="8" cy="0" rx="5" ry="3.4" fill="#07040f"/>`;
  const body = m.shape === "domino" ? `<path d="M-20 -4 q10 -8 20 -2 q10 -6 20 2 q-2 10 -12 10 q-6 0 -8 -5 q-2 5 -8 5 q-10 0 -12 -10Z" fill="${m.fill}" stroke="${m.trim}" stroke-width="1.4"/>`
    : m.shape === "columbina" ? `<path d="M-22 -2 q4 -12 22 -8 q18 -4 22 8 q-4 12 -14 12 q-6 0 -8 -4 q-2 4 -8 4 q-10 0 -14 -12Z" fill="${m.fill}" stroke="${m.trim}" stroke-width="1.4"/><path d="M14 -10 q8 -14 18 -10 M18 -8 q10 -6 14 2" stroke="${m.trim}" stroke-width="1.6" fill="none"/>`
    : m.shape === "volto" ? `<path d="M-16 -14 q16 -10 32 0 q2 20 -6 32 q-10 8 -20 0 q-8 -12 -6 -32Z" fill="${m.fill}" stroke="${m.trim}" stroke-width="1.4"/><path d="M-4 16 q4 3 8 0" stroke="#9a8f80" fill="none"/>`
    : `<path d="M-16 -14 q16 -10 32 0 q2 14 0 20 l6 12 h-38 l6 -12 q-2 -6 0 -20Z" fill="${m.fill}" stroke="${m.trim}" stroke-width="1.4"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">${body}${eyes}</g>`;
}

export const maskShop = {
  kind: "seancemask",
  label: "🎭 Impostor masks",
  items: [
    { id: "im-domino", name: "Domino mask", note: "A small eye mask. 'Domino' also named the hooded cloak worn to masked balls", price: 0 },
    { id: "im-columbina", name: "Columbina", note: "A decorated half-mask, named after a maid character in Italian commedia dell'arte", price: 70 },
    { id: "im-volto", name: "Volto", note: "The plain white full-face mask of the Venice Carnival. 'Volto' is Italian for face", price: 90 },
    { id: "im-bauta", name: "Bauta", note: "Venice's classic Carnival mask: its jutting chin let the wearer talk, eat and drink unrecognised", price: 120 },
  ],
  talk: {
    open: ["Masks for the Impostor table. Everyone wears one. One of you is hiding more than a face.", "A good impostor needs a good mask. A good detective needs one too, just in case."],
    tryon: ["The {item}. Very mysterious. Nobody would ever suspect you.", "Try the {item}. The spirits can't tell who's under it, and neither can your friends."],
    buy: ["The {item} is yours. It'll sit on your chair at every Impostor table.", "Sold: the {item}. Wear it with a straight face, which helps."],
  },
  preview(id, ctx) { ctx.tableEl.className = "table seance"; ctx.tableEl.innerHTML = `<svg viewBox="0 0 400 300" class="sc-svg"><rect width="400" height="300" fill="#140a24"/>${maskSvg(id, 200, 140, 3.2)}</svg>`; ctx.cap("🎭 " + (maskShop.items.find((x) => x.id === id)?.name || "")); },
};
