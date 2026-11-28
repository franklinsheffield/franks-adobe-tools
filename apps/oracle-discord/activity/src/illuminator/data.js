// The Illuminator: make a manuscript page the way medieval workshops did. Put the stages in their real order, then
// choose the real pigment for each part of the page from what it was made of. Every pigment, step and page is real.

/** The stages of a page, in their real order. lvl: the level that adds the step. */
export const STEPS = [
  { id: "rule", lvl: 1, e: "📏", name: "Prick and rule the page", fact: "Holes pricked down the margins guided ruled lines, scored with a dry point or drawn in lead, so every line of text ran straight." },
  { id: "write", lvl: 1, e: "✒️", name: "Write the text", fact: "The scribe wrote first, leaving blank spaces for the pictures and big initials that others would add later." },
  { id: "rubric", lvl: 2, e: "🟥", name: "Add the red headings", fact: "A rubricator added headings in red. Rubric comes from rubrica, Latin for red earth." },
  { id: "sketch", lvl: 3, e: "✏️", name: "Sketch the picture", fact: "The design was drawn lightly first, in metalpoint or diluted ink. Unfinished books show these underdrawings." },
  { id: "gild", lvl: 1, e: "✨", name: "Lay gesso and gold", fact: "Gold went on before any paint: burnishing it hard would smudge colours already on the page." },
  { id: "paint", lvl: 1, e: "🎨", name: "Paint the colours", fact: "Colours were laid in flat areas first, then shaded, a few pigments at a time as each dried." },
  { id: "outline", lvl: 1, e: "🖋️", name: "Outline and add white highlights", fact: "Last came fine black outlines and touches of white that make the folds and faces stand out." },
];

/** Pigments by colour. clue: what it was made from (the riddle). */
export const PIGMENTS = [
  { id: "ultramarine", fam: "blue", name: "Ultramarine", hex: "#1f4fbf", clue: "Ground lapis lazuli, carried from mines in Afghanistan. It could cost more than gold.", fact: "Its name means 'from beyond the sea'. Painters saved it for the robes that mattered most." },
  { id: "azurite", fam: "blue", name: "Azurite", hex: "#2f6fb0", clue: "A blue copper mineral, crushed and washed: the everyday blue of medieval Europe.", fact: "It is greener and cheaper than ultramarine, and it was mined in Europe." },
  { id: "indigo", fam: "blue", name: "Indigo", hex: "#29355e", clue: "A dye from the leaves of a plant, dried into cakes.", fact: "Woad grown in Europe gives the same blue dye as tropical indigo." },
  { id: "vermilion", fam: "red", name: "Vermilion", hex: "#d8322a", clue: "Mercury and sulfur heated together until they turn bright red.", fact: "The recipe is in 8th-century manuscripts. Its colour is the same as the mineral cinnabar." },
  { id: "minium", fam: "red", name: "Red lead (minium)", hex: "#e8582a", clue: "White lead roasted until it turns orange-red.", fact: "Latin minium gave miniare, 'to paint in red lead', and so the word miniature." },
  { id: "kermes", fam: "red", name: "Kermes crimson", hex: "#9c1b3a", clue: "Dried insects that live on oak trees, boiled into a deep red.", fact: "The word crimson comes from kermes, through Arabic qirmiz." },
  { id: "orpiment", fam: "yellow", name: "Orpiment", hex: "#e7b62a", clue: "A glittering yellow arsenic mineral. Poisonous.", fact: "Its name means 'gold paint'. It was used where real gold was too dear." },
  { id: "saffron", fam: "yellow", name: "Saffron glaze", hex: "#f0a53a", clue: "Threads of a crocus flower, steeped to make a yellow glaze.", fact: "A saffron glaze over tin or silver was a cheap way to fake gold." },
  { id: "verdigris", fam: "green", name: "Verdigris", hex: "#2f8f6a", clue: "Copper plates hung over vinegar until green crust forms.", fact: "It is acidic, and on many old pages it has eaten right through the vellum." },
  { id: "malachite", fam: "green", name: "Malachite", hex: "#3aa06a", clue: "A banded green copper mineral, ground fine.", fact: "It is the green cousin of azurite and often found with it in copper mines." },
  { id: "terreverte", fam: "green", name: "Green earth", hex: "#7a9a6a", clue: "A soft grey-green clay dug from the ground.", fact: "Italian painters laid it under flesh tones, which is why old faces sometimes look green." },
  { id: "goldleaf", fam: "gold", name: "Gold leaf", hex: "#e2b04a", clue: "Gold hammered thinner than paper, laid on raised gesso and polished.", fact: "Goldbeaters hammered it between layers of ox-gut membrane, called goldbeater's skin." },
  { id: "shellgold", fam: "gold", name: "Shell gold", hex: "#c9a24a", clue: "Gold ground to powder, mixed with gum and kept in a mussel shell.", fact: "It is painted on with a brush, so it gives a softer, matte shine than leaf." },
  { id: "leadwhite", fam: "white", name: "Lead white", hex: "#f3efe6", clue: "Lead strips left with vinegar in warm dung until they crust white.", fact: "It was the main white for over 2,000 years, and it is poisonous." },
  { id: "chalk", fam: "white", name: "Chalk", hex: "#e9e3d2", clue: "A soft white rock from the sea floor of long ago.", fact: "Chalk was mixed into gesso, the raised cushion that gold leaf is laid on." },
  { id: "lampblack", fam: "black", name: "Lamp black", hex: "#1d1a17", clue: "Soot scraped from the inside of a lamp's chimney.", fact: "It is almost pure carbon, which is why black outlines from 1,000 years ago are still black." },
];
export const pigmentOf = (id) => PIGMENTS.find((p) => p.id === id);

/** Real manuscripts to work in the style of. zones: [part of the page, the pigment it needs]. */
export const PAGES = [
  { id: "hours", lvl: 1, name: "A Book of Hours", when: "1400s", letter: "D", fact: "The medieval bestseller: prayers for each hour of the day. More Books of Hours survive than any other kind of medieval book.",
    zones: [["initial", "goldleaf"], ["robe", "ultramarine"], ["border", "vermilion"]] },
  { id: "luttrell", lvl: 1, name: "The Luttrell Psalter", when: "about 1325–1340", letter: "B", fact: "Made for Sir Geoffrey Luttrell of Lincolnshire. Its margins are famous for scenes of farm work and daily life.",
    zones: [["initial", "goldleaf"], ["robe", "azurite"], ["leaves", "malachite"]] },
  { id: "lindisfarne", lvl: 2, name: "The Lindisfarne Gospels", when: "about 715–720", letter: "L", fact: "Credited to Eadfrith, Bishop of Lindisfarne. A priest named Aldred added an Old English translation between the lines about 250 years later.",
    zones: [["initial", "orpiment"], ["robe", "indigo"], ["border", "minium"], ["leaves", "verdigris"]] },
  { id: "kells", lvl: 2, name: "The Book of Kells", when: "about 800", letter: "X", fact: "Probably begun on Iona and finished at Kells in Ireland. It has 340 vellum leaves and is now at Trinity College Dublin.",
    zones: [["initial", "orpiment"], ["robe", "indigo"], ["border", "minium"], ["leaves", "verdigris"]] },
  { id: "berry", lvl: 3, name: "Très Riches Heures", when: "about 1412–1416", letter: "J", fact: "Painted for the Duke of Berry by the Limbourg brothers. All three and the duke died in 1416, and the book was finished decades later.",
    zones: [["initial", "goldleaf"], ["robe", "ultramarine"], ["border", "vermilion"], ["leaves", "malachite"], ["highlight", "leadwhite"]] },
  { id: "gigas", lvl: 3, name: "The Codex Gigas", when: "early 1200s", letter: "I", fact: "The largest surviving medieval manuscript: about 75 kilograms, made in Bohemia. It is called the Devil's Bible for its full-page devil.",
    zones: [["initial", "shellgold"], ["robe", "azurite"], ["border", "minium"], ["leaves", "terreverte"], ["highlight", "leadwhite"]] },
];
export const ZONE_NAMES = { initial: "the big initial", robe: "the figure's robe", border: "the border", leaves: "the vine leaves", highlight: "the highlights" };

export const LEVELS = [
  { n: 1, name: "The copyist's desk", what: "5 stages, 3 colours", mult: 1 },
  { n: 2, name: "The monastery workshop", what: "6 stages, 4 colours", mult: 1.5 },
  { n: 3, name: "The court painters", what: "7 stages, 5 colours", mult: 2 },
];
export const INK = 4, CHOICES = 3;
