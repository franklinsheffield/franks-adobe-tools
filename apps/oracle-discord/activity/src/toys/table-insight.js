// Magister Vell's insight into the periodic table (the Wall of curiosities): what rows, columns and blocks mean, the
// big trends, and how the table was built. General chemistry only; where a rule has exceptions, the text says so.
import { ELEMENTS } from "./elements.js";

/** s, p, d or f block, from the element's place. He sits over the noble gases but is an s-block element. */
export function blockOf(e) {
  const [row, col] = e.place;
  if (row >= 8) return "f";
  if (e.z === 2 || col <= 2) return "s";
  if (col <= 12) return "d";
  return "p";
}
/** The period (row) of the real table: the f-block rows belong to periods 6 and 7. */
export const periodOf = (e) => (e.place[0] === 8 ? 6 : e.place[0] === 9 ? 7 : e.place[0]);
/** The group (column) number, or null for the f-block. */
export const groupOf = (e) => (e.place[0] >= 8 ? null : e.place[1]);

export const GROUPS = {
  1: ["Group 1 · alkali metals (and hydrogen)", "One electron in the outer shell, which they give away very easily. So they react with water, more violently the further down you go: lithium fizzes, caesium explodes. Hydrogen sits here too, but it's a gas and behaves in its own way."],
  2: ["Group 2 · alkaline-earth metals", "Two outer electrons. Reactive, but less than group 1. Their name comes from their oxides, which old chemists called 'earths'."],
  3: ["Groups 3 to 12 · transition metals", "Here the atoms fill an inner shell (the d orbitals), so neighbours behave alike. Many make coloured compounds and can lose different numbers of electrons: iron rust is iron(III), but iron(II) exists too."],
  13: ["Group 13 · the boron group", "Three outer electrons. Boron is a metalloid; the rest are metals, aluminium being the most common metal in Earth's crust."],
  14: ["Group 14 · the carbon group", "Four outer electrons: carbon (non-metal) at the top, silicon and germanium (metalloids), then tin and lead (metals). One column, the whole range."],
  15: ["Group 15 · the nitrogen group (pnictogens)", "Five outer electrons. Nitrogen and phosphorus are in every living cell: DNA's backbone is held together by phosphate."],
  16: ["Group 16 · the oxygen group (chalcogens)", "Six outer electrons, two short of full, so they pull electrons in. 'Chalcogen' comes from Greek for 'ore-former': many metal ores are oxides and sulfides."],
  17: ["Group 17 · halogens", "Seven outer electrons, one short of full, so they grab one from anything nearby. 'Halogen' is Greek for 'salt-maker': sodium plus chlorine makes table salt."],
  18: ["Group 18 · noble gases", "A full outer shell, so they hardly react at all. They were all missed until the 1890s, because they don't take part in ordinary chemistry."],
};
export const groupInsight = (g) => GROUPS[g >= 3 && g <= 12 ? 3 : g] || null;

export const PERIODS = {
  1: "Period 1: one electron shell, room for just 2 elements.", 2: "Period 2: two shells; 8 elements.", 3: "Period 3: three shells; 8 elements.",
  4: "Period 4: four shells; 18 elements, as the transition metals join in.", 5: "Period 5: five shells; 18 elements.",
  6: "Period 6: six shells; 32 elements, counting the 15 lanthanides pulled out below.", 7: "Period 7: seven shells; 32 elements. The last four were named in 2016, which completed the row.",
};
export const BLOCKS = {
  s: "s-block: the outer electrons sit in an s orbital (groups 1 and 2, plus helium).",
  p: "p-block: filling p orbitals (groups 13 to 18). Nearly all the non-metals live here.",
  d: "d-block: filling d orbitals, an inner shell. These are the transition metals.",
  f: "f-block: filling f orbitals, two shells in. Printed below the table so it stays 18 columns wide instead of 32.",
};

/** One-line place insight for an element. */
export function placeLine(e) {
  const g = groupOf(e), p = periodOf(e), b = blockOf(e);
  if (!g) return `${e.place[0] === 8 ? "A lanthanide" : "An actinide"}, in period ${p}, the f-block. ${BLOCKS.f}`;
  const outer = g <= 2 ? g : g >= 13 ? g - 10 : null;
  return `Group ${g}, period ${p}, ${b}-block: ${p} electron shell${p > 1 ? "s" : ""}${outer && e.z !== 2 ? `, ${outer} electron${outer > 1 ? "s" : ""} in the outer one` : e.z === 2 ? ", and its one shell is full" : ""}.`;
}

const Z = (...s) => (e) => s.includes(e.s);
/** Vell's guided tour: each step lights up some tiles and explains them. */
export const TOUR = [
  { t: "In order of protons", hi: (e) => e.z <= 10, say: "Every element's number is the count of protons in its nucleus. Hydrogen has 1, helium 2, and so on up to oganesson's 118. Henry Moseley showed this in 1913, by measuring each element's X-rays." },
  { t: "Rows are shells", hi: (e) => periodOf(e) === 3, say: "Each row, or period, adds a new shell of electrons. Row 3 here: sodium to argon, three shells each. Rows get longer as the shells get roomier: 2, 8, 8, 18, 18, 32, 32 elements." },
  { t: "Columns are families", hi: (e) => groupOf(e) === 1 && e.z > 1, say: "Each column, or group, has the same number of outer electrons, so they behave alike. Group 1 all react with water, and get wilder going down: lithium fizzes, potassium burns lilac, caesium explodes." },
  { t: "One short, and full", hi: (e) => [17, 18].includes(groupOf(e)), say: "Group 17, the halogens, are one electron short of a full shell, so they snatch electrons: fierce. Group 18, the noble gases, already have a full shell, so they hardly react at all. Neighbours, opposite tempers." },
  { t: "The four blocks", hi: (e) => blockOf(e) === "d", say: "The table's shape comes from which orbital the last electron goes into: s, p, d or f. Lit up: the d-block, the transition metals. The f-block is printed underneath only so the table fits on a page." },
  { t: "Metals and non-metals", hi: (e) => e.cat === "metalloid", say: "Lit up: the metalloids, along a staircase. Left of it, metals: shiny, conducting, most of the table. Right of it, non-metals. The metalloids in between, like silicon, are half and half, which is why they make good computer chips." },
  { t: "Atoms shrink, then grow", hi: (e) => periodOf(e) === 2 || groupOf(e) === 1, say: "Across a row, atoms get smaller: more protons pull the same shell tighter. Down a column they get bigger: more shells. Fluorine, top right, pulls on electrons harder than any element. There are exceptions, but that's the rule of thumb." },
  { t: "Mendeleev's gaps", hi: Z("Sc", "Ga", "Ge"), say: "In 1869 Dmitri Mendeleev arranged the known elements by weight and left gaps for missing ones. He predicted three of them in detail. Gallium (1875), scandium (1879) and germanium (1886) turned up just as he'd said." },
  { t: "Glenn Seaborg's move", hi: (e) => e.cat === "actinide", say: "In the 1940s Glenn Seaborg argued that thorium, uranium and the new elements after them formed their own row, the actinides. Colleagues warned it would ruin his reputation. It won him a Nobel Prize, and the table's modern shape." },
  { t: "The edge of the table", hi: (e) => e.z >= 104, say: "Everything from 104 up has been made in particle accelerators, often a few atoms at a time, and most last well under a second. Row 7 was completed when 113, 115, 117 and 118 were named in 2016. Element 119 hasn't been made yet." },
];
export const tourCount = (i) => ELEMENTS.filter(TOUR[i].hi).length;
