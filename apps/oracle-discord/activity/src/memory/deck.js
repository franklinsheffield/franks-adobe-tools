// Grimoire Memory: the decks. Every pair is a symbol and its meaning, taken from the Chamber's other rooms so the
// facts stay in one place: runes, Ogham and hieroglyphs from the Rune & Glyph Decoder (decoder/levels.js SCRIPTS),
// Maya numerals from the Decoder's bar-and-dot rules, alchemy signs from the Alchemist's Lab (alchemy/lab.js).
// A card: { key, deck, kind: "glyph" | "svg" | "maya", g (what the symbol card shows), name, gloss, sub, fact }.
import { SCRIPTS } from "../decoder/levels.js";
import { SYMBOLS } from "../alchemy/lab.js";

// Hieroglyph meaning cards show the picture's name and its sound (the full note goes in the fact); runes and Ogham
// show the sign's name, its meaning and its sound.
const scriptCards = (k, skip = []) => SCRIPTS[k].signs.filter((s) => !skip.includes(s.g)).map((s) => ({
  key: `${k}:${s.n}`, deck: k, kind: "glyph", font: SCRIPTS[k].font, g: s.g, name: s.n, gloss: k === "egyptian" ? "" : s.gl, sub: s.v,
  fact: k === "egyptian" ? `The ${s.n} sign spells ${s.gl}.` : `${s.n[0].toUpperCase() + s.n.slice(1)}: ${s.gl}. It writes the sound ${s.v}.`,
}));

const mayaCards = () => SCRIPTS.maya.signs.map((s) => ({
  key: `maya:${s.g}`, deck: "maya", kind: "maya", g: +s.g, name: String(s.g), gloss: "", sub: "",
  fact: +s.g === 0 ? "The shell means zero. The Maya used a true zero centuries before it reached Europe." : `${s.g} is ${s.gl}: each dot is 1 and each bar is 5.`,
}));

const alchemyCards = () => SYMBOLS.map((s) => ({
  key: `alchemy:${s.id}`, deck: "alchemy", kind: "svg", g: s.glyph, name: s.name, gloss: s.tag, sub: s.modern,
  fact: s.fact.split(". ").slice(0, 2).join(". ").replace(/\.?$/, "."),
}));

// The Egyptian list leaves out the 'uncertain object' m (a second m sign) and the silent egg, which have no
// sound of their own to match.
export const DECKS = [
  { id: "alchemy", name: "Alchemy signs", emoji: "⚗️", blurb: "Planetary metals, the four elements and the tria prima", cards: alchemyCards() },
  { id: "futhark", name: "Elder Futhark runes", emoji: "🪨", blurb: SCRIPTS.futhark.blurb, cards: scriptCards("futhark") },
  { id: "ogham", name: "Ogham", emoji: "🌳", blurb: SCRIPTS.ogham.blurb, cards: scriptCards("ogham") },
  { id: "egyptian", name: "Hieroglyphs", emoji: "🏺", blurb: SCRIPTS.egyptian.blurb, cards: scriptCards("egyptian", ["𓐝", "𓆇"]) },
  { id: "maya", name: "Maya numerals", emoji: "🌽", blurb: SCRIPTS.maya.blurb, cards: mayaCards() },
];
DECKS.push({ id: "mixed", name: "Mixed grimoire", emoji: "📚", blurb: "A few signs from every deck, shuffled together", cards: DECKS.flatMap((d) => d.cards) });

export const deckById = (id) => DECKS.find((d) => d.id === id) || DECKS[0];
export const ALL_CARDS = DECKS.filter((d) => d.id !== "mixed").flatMap((d) => d.cards);
export const cardByKey = (key) => ALL_CARDS.find((c) => c.key === key);
export const WHERE = { alchemy: "Europe and the Islamic world, about 300–1700 CE", futhark: SCRIPTS.futhark.where, ogham: SCRIPTS.ogham.where, egyptian: SCRIPTS.egyptian.where, maya: SCRIPTS.maya.where };
