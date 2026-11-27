// Sacred Geometry Builder shop: "Geometer's sets" for the Essence store. A set restyles the drawing board in this
// room: board, ink, the given lines and points, and the flourish when a figure is finished. Cosmetic only.
// Worn set id lives in prog.geo (store.js wear() sets prog[kind]). Ids stay stable: members' saves refer to them.
export const KIND = "geo";
export const TAB = [KIND, "📐 Geometer's sets"];
export const SETS = [
  { id: "geo-slate", kind: KIND, name: "Scholar's slate", note: "Violet night, gold ink: the house style", price: 0,
    bg: "radial-gradient(80% 70% at 50% 40%,#2a1a55 0%,#120b28 70%,#07040f 100%)", ink: "#66E0C8", given: "#E2B04A", pt: "#FADE8C", done: "#FADE8C" },
  { id: "geo-parchment", kind: KIND, name: "Leonardo's notebook", note: "Sepia ink on old parchment, like the Codex Atlanticus", price: 60,
    bg: "radial-gradient(90% 80% at 50% 40%,#efe0bd 0%,#d9c08f 70%,#a98a55 100%)", ink: "#5a3a1a", given: "#8a6a3a", pt: "#3a2410", done: "#8a1f10", grid: "" },
  { id: "geo-chalk", kind: KIND, name: "Chalkboard", note: "Dusty chalk on a green board, the classroom classic", price: 60,
    bg: "radial-gradient(90% 80% at 50% 40%,#2f4a3a 0%,#1d3327 70%,#0f1d15 100%)", ink: "#f4f1e6", given: "#cfe3c8", pt: "#ffffff", done: "#ffe9a8", chalk: true },
  { id: "geo-blueprint", kind: KIND, name: "Architect's blueprint", note: "White lines on blueprint blue, with a measuring grid", price: 80,
    bg: "linear-gradient(#1b4f9a,#123a78)", ink: "#ffffff", given: "#a9c8ff", pt: "#ffffff", done: "#ffe27a", grid: "#ffffff22" },
  { id: "geo-neon", kind: KIND, name: "Neon lab", note: "Science is Magic: teal and pink neon on black glass", price: 100,
    bg: "radial-gradient(80% 70% at 50% 40%,#101018 0%,#050508 100%)", ink: "#66E0C8", given: "#FF4FB3", pt: "#ffffff", done: "#FF4FB3", glow: true },
  { id: "geo-gold", kind: KIND, name: "Gold leaf", note: "Burnished gold lines that glow on black lacquer", price: 120,
    bg: "radial-gradient(80% 70% at 50% 40%,#1a1408 0%,#050402 100%)", ink: "#FADE8C", given: "#9a7a3a", pt: "#fff3c4", done: "#ffffff", glow: true },
  { id: "geo-stars", kind: KIND, name: "Celestial compass", note: "Silver lines drawn across a field of stars", price: 120,
    bg: "radial-gradient(80% 70% at 50% 40%,#16204a 0%,#070b1e 100%)", ink: "#e6ecff", given: "#8aa0e6", pt: "#ffffff", done: "#c9d4ff", stars: true },
  { id: "geo-glass", kind: KIND, name: "Stained glass", note: "Every circle you draw is a different jewel colour, and finished figures light up", price: 150,
    bg: "radial-gradient(80% 70% at 50% 40%,#1a1030 0%,#08050f 100%)", ink: "#FADE8C", given: "#7a6aa8", pt: "#ffffff", done: "#ffffff", jewels: ["#ff5470", "#ffb347", "#ffe066", "#5fe08a", "#4fc3ff", "#9b7bff", "#ff6fd8"] },
];
export const TALK = {
  open: ["Geometer's sets, {name}: a new board and new ink for the Sacred Geometry room. Euclid had sand. You have options.", "Every figure deserves a fine surface. Pick your ink.", "The compass doesn't care what it draws on. The Oracle does."],
  tryon: ["The {item}… the circles will look divine on that.", "Ah, the {item}. Leonardo would approve. He'd also ask to borrow it.", "The {item}! Straight lines have never looked so straight."],
  buy: ["The {item} is yours. Go and draw something perfect.", "Sold! Your next Flower of Life will bloom on the {item}.", "The {item}. Every radius equal, every line true. Enjoy it."],
};
export const setOf = (p) => SETS.find((s) => s.id === (p && p.geo)) || SETS[0];
