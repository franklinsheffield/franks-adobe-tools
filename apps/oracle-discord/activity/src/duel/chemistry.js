// Chemistry study material for the Study hall (study.js) and Element Duel. Real, school-level chemistry, with the
// game's own element and compound data as worked examples and reference tables. The history of alchemy lives in the
// Alchemist's Lab notebook (alchemy/guide.js); this covers the modern science the duel is built on.
import { ELEMENTS, FAMILY } from "./elements.js";
import { COMPOUNDS, pretty } from "./compounds.js";
import { CONDITIONS } from "./logic.js";
import { USES } from "./uses.js";
import { classicalOf, CLASSICAL, PLANET } from "./cardart.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const sign = (o) => (o > 0 ? "+" + o : String(o));
const F = (id) => esc(pretty(id));

const ATOMS = { id: "chem-atoms", emoji: "⚛️", title: "Atoms and the periodic table", sections: [
  { h: "What an atom is", p: [
    "Everything around you is made of atoms. Each atom has a tiny, heavy <b>nucleus</b> of protons (positive) and neutrons (no charge), with <b>electrons</b> (negative) around it.",
    "The number of protons is the <b>atomic number</b> (the small number in the corner of each card). It decides which element an atom is: every atom with 6 protons is carbon, every atom with 79 is gold.",
    "A neutral atom has as many electrons as protons. Chemistry is almost entirely about the outermost electrons: how atoms share, give away or take them.",
  ] },
  { h: "The periodic table", p: [
    "Mendeleev (1869) arranged the elements in rows by atomic number so that elements with similar behaviour line up in columns, called <b>groups</b>. He left gaps for undiscovered elements and predicted their properties.",
    "Elements in the same group have the same number of outer electrons, so they react alike: lithium, sodium and potassium all fizz in water and all form +1 ions.",
    "Going down a group, atoms get bigger and (for metals) more reactive: caesium reacts far more violently than lithium. Going across a row, metals give way to non-metals.",
  ] },
  { h: "The families on your cards", p: Object.entries(FAMILY).map(([k, f]) => `<span style="color:${f.col}">■</span> <b>${esc(f.name)}</b>: ${{
    alkali: "group 1. Soft, very reactive metals with one outer electron, which they give away to form +1 ions. Kept under oil.",
    alkaline: "group 2. Reactive metals with two outer electrons, forming +2 ions. Calcium is in bones and chalk; magnesium burns brilliant white.",
    transition: "the middle block. Hard, strong metals (iron, copper, gold) that often have several possible charges and make coloured compounds.",
    post: "metals to the right of the transition block (aluminium, tin, lead, bismuth): softer, with lower melting points.",
    metalloid: "on the staircase between metals and non-metals (boron, silicon, arsenic, antimony). Silicon's in-between conduction makes computer chips possible.",
    nonmetal: "hydrogen, carbon, nitrogen, oxygen, phosphorus, sulfur, selenium: they tend to share electrons or take them, forming covalent molecules and negative ions.",
    halogen: "group 17 (fluorine, chlorine, bromine, iodine). One electron short of a full shell, so they grab one and form −1 ions. Their name means 'salt-maker'.",
    noble: "group 18. Full outer shells, so they hardly react at all. That is why they make good shields in the duel.",
    actinide: "the heavy radioactive row that includes uranium.",
  }[k]}`) },
] };

const BONDS = { id: "chem-bonds", emoji: "🔗", title: "Bonds, charges and formulas", sections: [
  { h: "Why atoms bond", p: [
    "Atoms are most stable with a full outer shell of electrons (like the noble gases). They get there by giving, taking or sharing electrons. That is a chemical bond.",
    "<b>Ionic bonds</b>: a metal gives electrons to a non-metal. Sodium gives one electron to chlorine: Na⁺ and Cl⁻ attract each other and stack into a crystal of salt, NaCl.",
    "<b>Covalent bonds</b>: two non-metals share pairs of electrons. In water, oxygen shares one pair with each hydrogen: H₂O. Carbon dioxide has two double bonds: O=C=O.",
    "<b>Metallic bonds</b>: in a metal, outer electrons drift freely through the whole lump. That is why metals conduct electricity and can be bent.",
  ] },
  { h: "Oxidation states (the charges on your cards)", p: [
    "An oxidation state is the charge an atom would have if all its bonds were ionic. Group 1 metals are +1, group 2 are +2, oxygen is usually −2, halogens are usually −1, hydrogen is +1 with non-metals and −1 with metals.",
    "In any neutral compound the oxidation states add up to zero. That rule lets you work out formulas without memorising them.",
    "Some elements have several states: iron is +2 in FeO and +3 in Fe₂O₃. The Roman numeral in a name gives it: iron(II) oxide, iron(III) oxide.",
  ] },
  { h: "Writing a formula: worked examples", p: [
    `<b>Magnesium chloride</b>: Mg is +2, Cl is −1. You need two chlorines to cancel one magnesium: ${F("MgCl2")}.`,
    `<b>Aluminium oxide</b>: Al is +3, O is −2. The smallest numbers that balance are 2 × (+3) = +6 and 3 × (−2) = −6: ${F("Al2O3")}.`,
    `<b>Sodium oxide</b>: Na is +1, O is −2, so two sodiums: ${F("Na2O")}.`,
    `<b>Calcium hydroxide</b>: Ca is +2 and the hydroxide group OH is −1 as a whole, so two of them: ${F("Ca(OH)2")}.`,
    "Shortcut: swap the sizes of the two charges and use them as the counts (Al³⁺ and O²⁻ give Al₂O₃), then cancel any common factor (Mg²⁺ and O²⁻ give Mg₂O₂, which is MgO).",
  ] },
] };

const REACTIONS = { id: "chem-reactions", emoji: "⚗️", title: "Chemical reactions", sections: [
  { h: "What a reaction is", p: [
    "In a reaction, bonds break and new bonds form, so atoms are rearranged into new substances. No atoms are created or destroyed (Lavoisier's law of conservation of mass).",
    "A <b>balanced equation</b> has the same number of each atom on both sides. 2H₂ + O₂ → 2H₂O: four hydrogens and two oxygens on each side.",
    "To balance one, change only the big numbers in front (coefficients), never the small ones inside a formula, which would make a different substance.",
  ] },
  { h: "Six kinds of reaction", p: [
    "<b>Synthesis</b> (two things join): 2Na + Cl₂ → 2NaCl. Every move in Element Duel is a synthesis from elements.",
    "<b>Decomposition</b> (one thing splits): CaCO₃ → CaO + CO₂ when limestone is heated in a kiln to make quicklime.",
    "<b>Combustion</b> (burning in oxygen): CH₄ + 2O₂ → CO₂ + 2H₂O, the flame on a gas cooker.",
    "<b>Displacement</b> (a more reactive element pushes out a less reactive one): Fe + CuSO₄ → FeSO₄ + Cu. An iron nail in blue copper sulfate solution turns copper-coloured.",
    "<b>Neutralisation</b> (acid + base → salt + water): HCl + NaOH → NaCl + H₂O.",
    "<b>Redox</b> (oxidation and reduction together): one substance loses electrons (oxidised) while another gains them (reduced). Rusting, burning, batteries and photosynthesis are all redox. Remember OIL RIG: Oxidation Is Loss, Reduction Is Gain.",
  ] },
  { h: "What speeds reactions up", p: [
    "<b>Heat</b>: faster particles collide more often and harder.",
    "<b>Concentration and pressure</b>: more particles in the same space means more collisions.",
    "<b>Surface area</b>: powders react much faster than lumps. Flour dust can explode; a loaf cannot.",
    "<b>Catalysts</b>: they offer an easier route with a lower energy barrier and are not used up. Iron in the Haber–Bosch process (ammonia), platinum in a car's catalytic converter, enzymes in your body.",
  ] },
] };

const byHeat = [...COMPOUNDS].sort((a, b) => a.dh - b.dh);
const ENERGY = { id: "chem-energy", emoji: "🔥", title: "Energy, acids and lab conditions", sections: [
  { h: "Exothermic and endothermic", p: [
    "Breaking bonds takes energy; making bonds gives it out. If the new bonds are stronger than the old ones, the reaction gives out heat: it is <b>exothermic</b> (burning, rusting, hand warmers).",
    "If it takes in more energy than it gives out, it is <b>endothermic</b> (cold packs, photosynthesis, cooking an egg).",
    "The <b>standard enthalpy of formation</b> (ΔHf°) is the heat change when one mole of a compound forms from its elements. Negative means exothermic. Element Duel uses it for power: the more negative, the harder the hit.",
  ] },
  { h: "Most exothermic compounds in the duel", p: byHeat.slice(0, 8).map((c) => `${F(c.f)} ${esc(c.name)}: ${c.dh} kJ/mol`) },
  { h: "Endothermic compounds in the duel (they soak up energy)", p: byHeat.filter((c) => c.dh > 0).reverse().map((c) => `${F(c.f)} ${esc(c.name)}: +${c.dh} kJ/mol`) },
  { h: "Acids and bases", p: [
    "An <b>acid</b> releases hydrogen ions (H⁺) in water: hydrochloric acid in your stomach, citric acid in lemons, sulfuric acid in car batteries.",
    "A <b>base</b> takes up H⁺ or releases hydroxide ions (OH⁻): sodium hydroxide in drain cleaner, magnesium hydroxide in antacids. A base that dissolves in water is an alkali.",
    "The <b>pH scale</b> runs from 0 (strongly acidic) through 7 (neutral, pure water) to 14 (strongly alkaline). Each step is ten times more or less acidic.",
    `Acids in the duel: ${COMPOUNDS.filter((c) => c.tags.includes("acid")).map((c) => F(c.f)).join(", ")}. Bases: ${COMPOUNDS.filter((c) => c.tags.includes("base")).map((c) => F(c.f)).join(", ")}.`,
  ] },
  { h: "The lab conditions, and the real science behind them", p: CONDITIONS.map((c) => `${c.emoji} <b>${esc(c.name)}</b>: ${esc(c.why)}`) },
] };

const ELREF = { id: "chem-elements", emoji: "📋", title: "Element reference (all 52 cards)", sections: [
  { h: "How to read this", p: ["Atomic number · symbol · name · family · usual charges · classical element (by how it behaves at room temperature) · one true fact. 🌬 Air is a gas, 💧 Water a liquid, 🔥 Fire burns or reacts fiercely, 🌍 Earth another solid. Old alchemical planet signs are shown for the seven metals of antiquity."] },
  ...["alkali", "alkaline", "transition", "post", "metalloid", "nonmetal", "halogen", "noble", "actinide"].map((fam) => ({ h: FAMILY[fam].name, p: ELEMENTS.filter((e) => e.fam === fam).map((e) => {
    const k = classicalOf(e.s), pl = PLANET[e.s];
    return `<b>${e.z} · ${e.s} · ${esc(e.name)}</b> · ${e.ox.filter((o) => o).map(sign).join(", ") || "0"} · ${{ air: "🌬", water: "💧", fire: "🔥", earth: "🌍" }[k]} ${CLASSICAL[k].name}${pl ? ` · ${pl[0]} ${esc(pl[1])}` : ""}<br>${esc(e.fact)}`; }) })),
] };

const CPREF = { id: "chem-compounds", emoji: "🧪", title: "Compound reference (all 120)", sections: [
  { h: "How to read this", p: ["Formula · name · standard enthalpy of formation (kJ/mol, CRC data) · state at room temperature · what it is used for. Every one can be made in the duel; the level is when it first appears."] },
  ...[1, 2, 3].map((t) => ({ h: ["", "Apprentice compounds", "Chemist compounds", "Master compounds"][t], p: COMPOUNDS.filter((c) => c.tier === t).map((c) =>
    `<b>${F(c.f)} · ${esc(c.name)}</b> · ΔHf° ${c.dh > 0 ? "+" : ""}${c.dh} · ${{ s: "solid", l: "liquid", g: "gas" }[c.ph]}<br>${(USES[c.id] || []).map(esc).join(" · ")}`) })),
] };

/** Chemistry guides, in reading order. The history of alchemy is in the Alchemist's Lab notebook. */
export const CHEM_GUIDES = [ATOMS, BONDS, REACTIONS, ENERGY, ELREF, CPREF];
