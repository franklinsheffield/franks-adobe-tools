// Grimoire Memory: the decks. Every pair is a symbol and its meaning, taken from the Chamber's other rooms so the
// facts stay in one place: runes, Ogham and hieroglyphs from the Rune & Glyph Decoder (decoder/levels.js SCRIPTS),
// Maya numerals from the Decoder's bar-and-dot rules, alchemy signs from the Alchemist's Lab (alchemy/lab.js).
// Tarot trumps and the Lenormand come from the Chamber's reading modules (src/modules), elements from Element Duel.
// A card: { key, deck, kind: "glyph" | "svg" | "maya" | "label", g (what the symbol card shows), top (a small line
// above g on "label" cards), name, gloss, sub, fact, solo (true: never dealt in the mixed deck) }.
import { SCRIPTS } from "../decoder/levels.js";
import { SYMBOLS } from "../alchemy/lab.js";
import { MAJORS } from "../../../src/modules/tarot/data.js";
import { CARDS as LENORMAND } from "../../../src/modules/lenormand/data.js";
import { ELEMENTS, FAMILY } from "../duel/elements.js";

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

const VS = "\uFE0E"; // text style, never emoji

// Tarot: the trump's number and emblem on one card, its name and keywords on the other. Two trumps share the ∞
// emblem, so the number is what tells them apart.
const tarotCards = () => MAJORS.map((m) => ({
  key: `tarot:${m.num}`, deck: "tarot", kind: "label", top: m.num, g: m.sym + VS, name: m.n, gloss: m.kw.join(", "), sub: `trump ${m.num}`,
  fact: `${m.n} is trump ${m.num}: ${m.kw.join(", ")}. ${m.up.split(". ")[0].replace(/\.?$/, ".")}`,
}));

// Lenormand: the card's number and playing-card inset on one card, its name and keywords on the other.
const SUIT = { h: "♥", d: "♦", s: "♠", c: "♣" };
const lenormandCards = () => LENORMAND.map((c, i) => ({
  key: `lenormand:${i + 1}`, deck: "lenormand", kind: "label", top: c.pc[0] + SUIT[c.pc[1]], g: String(i + 1), name: c.n, gloss: c.kw.join(", "), sub: `card ${i + 1}`,
  fact: `Card ${i + 1}, ${c.n} (${c.pc[0]}${SUIT[c.pc[1]]}): ${c.up}`,
}));

// The zodiac: the twelve signs with their element and traditional ruler (modern astrology gives Scorpio Pluto,
// Aquarius Uranus and Pisces Neptune). Sun-sign dates are the usual ones: the real changeover shifts by a day
// from year to year. The seven classical planets are paired with the weekday named after each (in English,
// through the Germanic gods for Tuesday to Friday) and the metal alchemy gave it. The planets are kept out of the
// mixed deck, where their signs would clash with the alchemy metals.
const ZODIAC = [
  ["♈", "Aries", "the Ram", "fire", "Mars", "21 Mar–19 Apr"], ["♉", "Taurus", "the Bull", "earth", "Venus", "20 Apr–20 May"],
  ["♊", "Gemini", "the Twins", "air", "Mercury", "21 May–20 Jun"], ["♋", "Cancer", "the Crab", "water", "the Moon", "21 Jun–22 Jul"],
  ["♌", "Leo", "the Lion", "fire", "the Sun", "23 Jul–22 Aug"], ["♍", "Virgo", "the Maiden", "earth", "Mercury", "23 Aug–22 Sep"],
  ["♎", "Libra", "the Scales", "air", "Venus", "23 Sep–22 Oct"], ["♏", "Scorpio", "the Scorpion", "water", "Mars (modern: Pluto)", "23 Oct–21 Nov"],
  ["♐", "Sagittarius", "the Archer", "fire", "Jupiter", "22 Nov–21 Dec"], ["♑", "Capricorn", "the Sea-goat", "earth", "Saturn", "22 Dec–19 Jan"],
  ["♒", "Aquarius", "the Water-bearer", "air", "Saturn (modern: Uranus)", "20 Jan–18 Feb"], ["♓", "Pisces", "the Fish", "water", "Jupiter (modern: Neptune)", "19 Feb–20 Mar"],
];
const PLANETS = [
  ["☉", "The Sun", "Sunday", "gold", "Sunday is the Sun's day in English, from the Latin dies Solis."],
  ["☽", "The Moon", "Monday", "silver", "Monday is the Moon's day: lundi in French, from Luna."],
  ["♂", "Mars", "Tuesday", "iron", "Tuesday is named for Tīw (Norse Týr), the Germanic war god matched with Mars: in French it is still mardi."],
  ["☿", "Mercury", "Wednesday", "quicksilver", "Wednesday is Woden's day, Odin standing in for Mercury: in French it is mercredi."],
  ["♃", "Jupiter", "Thursday", "tin", "Thursday is Thor's day, the thunder god matched with Jupiter: in French it is jeudi."],
  ["♀", "Venus", "Friday", "copper", "Friday is named for the goddess Frigg, matched with Venus: in French it is vendredi."],
  ["♄", "Saturn", "Saturday", "lead", "Saturday is Saturn's day in English, from the Latin dies Saturni."],
];
const zodiacCards = () => [
  ...ZODIAC.map(([g, n, an, el, ru, dates]) => ({ key: `zodiac:${n.toLowerCase()}`, deck: "zodiac", kind: "glyph", font: "gm-astro", g: g + VS, name: n, gloss: an, sub: el,
    fact: `${n}, ${an}: a ${el} sign, ruled by ${ru}. Sun-sign dates ${dates}.` })),
  ...PLANETS.map(([g, n, day, metal, fact]) => ({ key: `zodiac:${n.replace("The ", "").toLowerCase()}`, deck: "zodiac", kind: "glyph", font: "gm-astro", g: g + VS, name: n, gloss: day, sub: metal, solo: true,
    fact: `${fact} Alchemy gave ${n.replace("The ", "the ")} ${metal}.` })),
];

// Elements: symbol and atomic number on one card, the name and family on the other. From Element Duel's table.
const elementCards = () => ELEMENTS.map((e) => ({
  key: `elements:${e.s}`, deck: "elements", kind: "label", top: String(e.z), g: e.s, name: e.name, gloss: FAMILY[e.fam].name, sub: `element ${e.z}`,
  fact: `${e.name}, ${e.s}, element ${e.z}. ${e.fact}`,
}));

// The Egyptian list leaves out the 'uncertain object' m (a second m sign) and the silent egg, which have no
// sound of their own to match.
export const DECKS = [
  { id: "alchemy", name: "Alchemy signs", emoji: "⚗️", blurb: "Planetary metals, the four elements and the tria prima", cards: alchemyCards() },
  { id: "futhark", name: "Elder Futhark runes", emoji: "🪨", blurb: SCRIPTS.futhark.blurb, cards: scriptCards("futhark") },
  { id: "ogham", name: "Ogham", emoji: "🌳", blurb: SCRIPTS.ogham.blurb, cards: scriptCards("ogham") },
  { id: "egyptian", name: "Hieroglyphs", emoji: "🏺", blurb: SCRIPTS.egyptian.blurb, cards: scriptCards("egyptian", ["𓐝", "𓆇"]) },
  { id: "maya", name: "Maya numerals", emoji: "🌽", blurb: SCRIPTS.maya.blurb, cards: mayaCards() },
  { id: "tarot", name: "Tarot trumps", emoji: "🎴", blurb: "The 22 Major Arcana: each trump's number and emblem, and what it stands for", cards: tarotCards() },
  { id: "lenormand", name: "Lenormand", emoji: "🀄", blurb: "The 36 cards of the Petit Lenormand: number, playing-card inset and name", cards: lenormandCards() },
  { id: "zodiac", name: "Zodiac and planets", emoji: "♈", blurb: "The twelve signs, and the seven classical planets that name our weekdays", cards: zodiacCards() },
  { id: "elements", name: "The elements", emoji: "🧪", blurb: "Chemical symbols and atomic numbers, from Element Duel's periodic table", cards: elementCards() },
];
DECKS.push({ id: "mixed", name: "Mixed grimoire", emoji: "📚", blurb: "A few signs from every deck, shuffled together", cards: DECKS.flatMap((d) => d.cards.filter((c) => !c.solo)) });

export const deckById = (id) => DECKS.find((d) => d.id === id) || DECKS[0];
export const ALL_CARDS = DECKS.filter((d) => d.id !== "mixed").flatMap((d) => d.cards);
export const cardByKey = (key) => ALL_CARDS.find((c) => c.key === key);
export const WHERE = { alchemy: "Europe and the Islamic world, about 300–1700 CE", futhark: SCRIPTS.futhark.where, ogham: SCRIPTS.ogham.where, egyptian: SCRIPTS.egyptian.where, maya: SCRIPTS.maya.where,
  tarot: "Italy from the 1440s as a card game; read for fortunes from the late 1700s", lenormand: "Germany and France, sold from about 1846",
  zodiac: "Babylon, by about 400 BCE, passed on through Greek and Roman astronomy", elements: "Symbols set by Berzelius in 1814; numbers by Moseley in 1913" };
