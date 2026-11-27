// The Séance's shelf in the Essence store: candle flames coloured by real flame-test chemistry. Registered through
// ROOMS -> registerShelf (store.js). The equipped id lives in prog.seancecandle; room.js draws the candles with it.

/** Flame colours: core, body and tip of the flame, plus the glow around it. */
export const CANDLE_LOOK = {
  "sc-beeswax": { mid: "#FADE8C", tip: "#ff8a3d", halo: "#FADE8C" },
  "sc-lithium": { mid: "#ff5a7a", tip: "#c0103a", halo: "#ff4d6d" },
  "sc-copper": { mid: "#7dffb0", tip: "#14b87a", halo: "#4dffa6" },
  "sc-potassium": { mid: "#e3b8ff", tip: "#9b5de5", halo: "#c99bff" },
  "sc-calcium": { mid: "#ffb070", tip: "#e2541b", halo: "#ff9a4d" },
  "sc-wisp": { mid: "#bfe9ff", tip: "#3d8bff", halo: "#7fc8ff" },
};
export const DEFAULT_CANDLE = "sc-beeswax";
export const candleLook = (id) => CANDLE_LOOK[id] || CANDLE_LOOK[DEFAULT_CANDLE];

export const shop = {
  kind: "seancecandle",
  label: "🕯️ Séance candles",
  items: [
    { id: "sc-beeswax", name: "Beeswax candles", note: "The classic: a warm gold flame from glowing soot", price: 0 },
    { id: "sc-lithium", name: "Crimson flame", note: "Flame test: lithium salts burn deep red", price: 60 },
    { id: "sc-copper", name: "Green flame", note: "Flame test: copper salts burn green", price: 60 },
    { id: "sc-calcium", name: "Orange flame", note: "Flame test: calcium salts burn orange-red", price: 60 },
    { id: "sc-potassium", name: "Lilac flame", note: "Flame test: potassium salts burn lilac", price: 80 },
    { id: "sc-wisp", name: "Will-o'-the-wisp", note: "Ghostly blue marsh light. Likely cause: marsh gases igniting", price: 120 },
  ],
  talk: {
    open: ["Séance candles, each one coloured by real chemistry. Metals in the wick turn the flame.", "Pick a flame for your séance. The ghosts aren't fussy, but chemists are."],
    tryon: ["{item}. Every element burns its own colour, because its electrons give off light at their own wavelengths.", "Try {item}. Chemists used flame colours like these to discover new elements."],
    buy: ["{item}: yours. Your séance table will burn with it from now on.", "{item} is lit. The spirits approve of good chemistry."],
  },
  preview(id, ctx) { if (shop.draw) { ctx.tableEl.className = "table seance"; ctx.tableEl.innerHTML = shop.draw(id, ctx.prog); ctx.cap("🕯️ " + (shop.items.find((x) => x.id === id)?.name || "")); } },
  draw: null, // set by room.js (the scene drawing lives there)
};
