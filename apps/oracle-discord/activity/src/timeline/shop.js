// History of Magic: Essence store items. Timeline themes restyle the room's ribbon, cards and hourglasses.
// Sold through the Chamber's shared room shelf (store.js registerShelf): kind "timeline", the one worn is prog.timeline.
export const THEMES = {
  "tl-parchment": { bg: ["#3b2a14", "#140b03"], ribbon: "#e8d3a6", ink: "#3b2410", pin: "#E2B04A", band: ["#c9a96b", "#b48f52", "#a07a40", "#8b6a33"], sand: "#E2B04A", font: "Cinzel, Georgia, serif", deco: "scroll" },
  "tl-starchart": { bg: ["#16244f", "#03061a"], ribbon: "#c9d4ff", ink: "#0b1640", pin: "#FADE8C", band: ["#2a3f8a", "#24367a", "#1e2e6a", "#18265a"], sand: "#c9d4ff", font: "Cinzel, Georgia, serif", deco: "stars" },
  "tl-gilded": { bg: ["#4a0e24", "#14040a"], ribbon: "#FADE8C", ink: "#4a0e24", pin: "#FFF3C4", band: ["#b8862b", "#a37320", "#8e6118", "#7a5012"], sand: "#FFF3C4", font: "Cinzel, Georgia, serif", deco: "filigree" },
  "tl-blueprint": { bg: ["#0f3e6e", "#062038"], ribbon: "#dff1ff", ink: "#0f3e6e", pin: "#66E0C8", band: ["#2b6aa6", "#255d93", "#1f5080", "#19436d"], sand: "#66E0C8", font: "ui-monospace, Menlo, monospace", deco: "grid" },
  "tl-masquerade": { bg: ["#1d3a3a", "#050d10"], ribbon: "#f3e3c3", ink: "#0b1d1f", pin: "#ff4fb3", band: ["#1f6f6a", "#2a5a7a", "#5a3a7a", "#7a2a5a"], sand: "#ff4fb3", font: "Cinzel, Georgia, serif", deco: "filigree" },
  "tl-neon": { bg: ["#2a0a3e", "#05010a"], ribbon: "#ff4fb3", ink: "#05010a", pin: "#66E0C8", band: ["#ff4fb3", "#b06cff", "#6a9cff", "#66E0C8"], sand: "#ff4fb3", font: "ui-monospace, Menlo, monospace", deco: "neon" },
};
export const DEFAULT_THEME = "tl-parchment";
export const themeOf = (id) => THEMES[id] || THEMES[DEFAULT_THEME];

export const SHOP = [
  { id: "tl-parchment", name: "Parchment scroll", note: "History of Magic: an old scroll and brass pins", price: 0 },
  { id: "tl-starchart", name: "Astronomer's star chart", note: "History of Magic: night-blue chart with constellations", price: 90 },
  { id: "tl-blueprint", name: "Inventor's blueprint", note: "History of Magic: drafting grid and typewriter dates", price: 100 },
  { id: "tl-gilded", name: "Illuminated manuscript", note: "History of Magic: crimson vellum, gold filigree", price: 120 },
  { id: "tl-masquerade", name: "Fibber's masquerade", note: "History of Magic: teal and rose masquerade silk, made for Fact or Fib nights", price: 110 },
  { id: "tl-neon", name: "Time-machine neon", note: "History of Magic: glowing arcade timeline", price: 150 },
];

export const TALK = {
  open: ["Timelines! Every age of magic deserves a good frame. Even the Bronze Age, which was mostly brown.", "Pick how history looks when you lay it out, {name}. The dates stay true either way.", "I've seen all of history. Some of it would look better in neon."],
  tryon: ["The {item}. History has never looked so organised.", "Oh, the {item}! Very scholarly. I feel like I should cite something.", "The {item}… Delphi would have killed for this."],
  buy: ["The {item} is yours. Go and put the centuries in order.", "Sold! The {item} will hang in the room of the History of Magic.", "The {item}! Time itself is flattered."],
};
