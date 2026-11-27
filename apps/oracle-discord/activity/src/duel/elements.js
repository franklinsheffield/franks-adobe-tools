// Element Duel: the element cards. Each card is one atom. Data is real: atomic number, symbol, group family, the
// common oxidation states (what the card shows, and what the charge-balance teacher in logic.js uses) and one true fact.
// tier = the first difficulty level the card appears in (1 Apprentice, 2 Chemist, 3 Master).
// w = copies in a deck. The deck leans on the elements that are most abundant (hydrogen in the universe, oxygen in
// Earth's crust, then the common rock and sea-salt elements); rare and heavy elements get one copy.
export const FAMILY = {
  alkali: { name: "Alkali metal", col: "#b07cff" },
  alkaline: { name: "Alkaline-earth metal", col: "#3fae6a" },
  transition: { name: "Transition metal", col: "#e0915a" },
  post: { name: "Post-transition metal", col: "#9aa6b8" },
  metalloid: { name: "Metalloid", col: "#c7b45a" },
  nonmetal: { name: "Non-metal", col: "#66b3ff" },
  halogen: { name: "Halogen", col: "#5fd46a" },
  noble: { name: "Noble gas", col: "#5fe0e8" },
  actinide: { name: "Actinide", col: "#ff7aa8" },
};

// [Z, symbol, name, family, oxidation states, tier, copies, fact]
const T = [
  [1, "H", "Hydrogen", "nonmetal", [1, -1], 1, 6, "About 9 in 10 atoms in the universe are hydrogen."],
  [2, "He", "Helium", "noble", [0], 1, 1, "The second most abundant element in the universe, yet rare on Earth: it escapes into space."],
  [3, "Li", "Lithium", "alkali", [1], 1, 1, "The lightest metal: it floats on water, and reacts with it."],
  [4, "Be", "Beryllium", "alkaline", [2], 2, 1, "Emeralds and aquamarines are crystals of beryl, a beryllium mineral."],
  [5, "B", "Boron", "metalloid", [3], 2, 1, "Boron is in borax, and in the heat-proof borosilicate glass of lab flasks."],
  [6, "C", "Carbon", "nonmetal", [-4, -2, -1, 0, 2, 4], 1, 3, "The backbone of every known living thing. Diamond and graphite are both pure carbon."],
  [7, "N", "Nitrogen", "nonmetal", [-3, -2, 1, 2, 3, 4, 5], 1, 3, "78% of the air you breathe is nitrogen gas, N₂."],
  [8, "O", "Oxygen", "nonmetal", [-2, -1], 1, 6, "The most abundant element in Earth's crust: about 46% of it by mass."],
  [9, "F", "Fluorine", "halogen", [-1], 1, 2, "The most reactive non-metal of all. It even forces xenon, a noble gas, into compounds."],
  [10, "Ne", "Neon", "noble", [0], 1, 1, "Glows red-orange in a discharge tube. Other 'neon' sign colours come from other gases."],
  [11, "Na", "Sodium", "alkali", [1], 1, 3, "Soft enough to cut with a knife, and it reacts with water, sometimes explosively."],
  [12, "Mg", "Magnesium", "alkaline", [2], 1, 2, "Burns with a blinding white light. Early photographers' flash powder used it."],
  [13, "Al", "Aluminium", "post", [3], 1, 2, "The most abundant metal in Earth's crust (about 8%), yet in the 1850s it cost more than gold."],
  [14, "Si", "Silicon", "metalloid", [4, -4], 1, 2, "The second most abundant element in the crust, about 28%. Sand is mostly silicon dioxide."],
  [15, "P", "Phosphorus", "nonmetal", [-3, 3, 5], 2, 1, "Found in 1669 by Hennig Brand, who boiled down urine hunting for the philosopher's stone."],
  [16, "S", "Sulfur", "nonmetal", [-2, 4, 6], 1, 2, "The 'brimstone' of old texts. It burns with a blue flame."],
  [17, "Cl", "Chlorine", "halogen", [-1, 1, 3, 5, 7], 1, 3, "A choking yellow-green gas. In salt it is tamed into harmless chloride ions."],
  [18, "Ar", "Argon", "noble", [0], 1, 1, "Almost 1% of air is argon: about 23 times more than carbon dioxide."],
  [19, "K", "Potassium", "alkali", [1], 1, 2, "Its symbol K comes from kalium, from the Arabic for plant ash (potash)."],
  [20, "Ca", "Calcium", "alkaline", [2], 1, 2, "The most abundant metal in your body, mostly in bones and teeth."],
  [22, "Ti", "Titanium", "transition", [4, 3, 2], 2, 1, "As strong as many steels but about 45% lighter."],
  [23, "V", "Vanadium", "transition", [5, 4, 3, 2], 3, 1, "Named after Vanadís (Freyja), the Norse goddess of beauty, for its many-coloured compounds."],
  [24, "Cr", "Chromium", "transition", [3, 2, 6], 2, 1, "A trace of chromium makes rubies red."],
  [25, "Mn", "Manganese", "transition", [2, 4, 7], 2, 1, "Essential in steel-making: it mops up sulfur and oxygen."],
  [26, "Fe", "Iron", "transition", [2, 3], 1, 2, "Earth's core is mostly iron, and it is about 5% of the crust."],
  [27, "Co", "Cobalt", "transition", [2, 3], 2, 1, "Cobalt compounds give cobalt-blue glass and pottery their colour."],
  [28, "Ni", "Nickel", "transition", [2], 2, 1, "The US five-cent 'nickel' is 75% copper and only 25% nickel."],
  [29, "Cu", "Copper", "transition", [1, 2], 1, 1, "One of the first metals people worked, more than 10,000 years ago."],
  [30, "Zn", "Zinc", "transition", [2], 1, 1, "A coat of zinc (galvanising) stops iron from rusting."],
  [33, "As", "Arsenic", "metalloid", [3, 5, -3], 3, 1, "The classic poisoner's choice, until the Marsh test of 1836 could detect it."],
  [34, "Se", "Selenium", "nonmetal", [-2, 4, 6], 2, 1, "Conducts electricity better in light, so it powered early light meters and photocopiers."],
  [35, "Br", "Bromine", "halogen", [-1, 1, 5], 2, 1, "One of only two elements that are liquid at room temperature (the other is mercury)."],
  [36, "Kr", "Krypton", "noble", [0, 2], 2, 1, "Real, and not from Superman's planet: about 1 part per million of air."],
  [37, "Rb", "Rubidium", "alkali", [1], 3, 1, "Found in 1861 from two red lines in its spectrum: its name means 'deep red'."],
  [38, "Sr", "Strontium", "alkaline", [2], 2, 1, "Strontium salts give fireworks their crimson red."],
  [40, "Zr", "Zirconium", "transition", [4], 3, 1, "Zircon crystals are the oldest bits of Earth ever found, about 4.4 billion years old."],
  [42, "Mo", "Molybdenum", "transition", [4, 6], 3, 1, "Its ore molybdenite was long mistaken for graphite and lead ore."],
  [47, "Ag", "Silver", "transition", [1], 2, 1, "The best conductor of electricity of all the metals."],
  [48, "Cd", "Cadmium", "transition", [2], 3, 1, "Cadmium pigments gave 19th-century painters their brilliant yellows and oranges."],
  [50, "Sn", "Tin", "post", [2, 4], 2, 1, "Copper plus tin makes bronze, which gave the Bronze Age its name."],
  [51, "Sb", "Antimony", "metalloid", [3, 5, -3], 3, 1, "Ancient Egyptian kohl eyeliner was often made from stibnite, antimony sulfide."],
  [53, "I", "Iodine", "halogen", [-1, 1, 5, 7], 2, 1, "Warm it and the solid turns straight into a violet vapour (it sublimes)."],
  [54, "Xe", "Xenon", "noble", [0, 2], 2, 1, "Not totally inert: in 1962 it became the first noble gas made into a compound."],
  [55, "Cs", "Caesium", "alkali", [1], 3, 1, "Atomic clocks tick on caesium atoms: the second itself is defined by them."],
  [56, "Ba", "Barium", "alkaline", [2], 2, 1, "Barium salts burn green in fireworks."],
  [74, "W", "Tungsten", "transition", [6, 4], 3, 1, "The highest melting point of any metal: 3422 °C. That's why it was used in light-bulb filaments."],
  [79, "Au", "Gold", "transition", [3, 1], 2, 1, "So unreactive it stays shiny for thousands of years, like Tutankhamun's mask."],
  [80, "Hg", "Mercury", "transition", [2, 1], 2, 1, "The only metal that is liquid at room temperature."],
  [82, "Pb", "Lead", "post", [2, 4], 2, 1, "Romans piped water in lead. 'Plumbing' comes from its Latin name, plumbum."],
  [83, "Bi", "Bismuth", "post", [3], 3, 1, "Its crystals grow as rainbow staircases: a thin oxide film makes the colours."],
  [86, "Rn", "Radon", "noble", [0], 3, 1, "A radioactive gas that seeps out of rocks: the one noble gas you should not breathe."],
  [92, "U", "Uranium", "actinide", [4, 6], 3, 1, "Named in 1789 after the planet Uranus, discovered just eight years before."],
];

export const ELEMENTS = T.map(([z, s, name, fam, ox, tier, w, fact]) => ({ z, s, name, fam, ox, tier, w, fact }));
export const EL = Object.fromEntries(ELEMENTS.map((e) => [e.s, e]));
export const isNoble = (s) => EL[s]?.fam === "noble";
/** The elements dealt at a level (1-3). */
export const poolOf = (tier) => ELEMENTS.filter((e) => e.tier <= tier);

// Atom colours for the molecule drawings (the usual CPK colours where there is one).
const CPK = { H: "#f4f4f4", C: "#3a3a3a", N: "#3050f8", O: "#ff2a1f", F: "#90e050", Cl: "#1ff01f", Br: "#a62929", I: "#940094", S: "#ffd123", P: "#ff8000",
  Na: "#ab5cf2", K: "#8f40d4", Li: "#cc80ff", Rb: "#702eb0", Cs: "#57178f", Mg: "#8aff00", Ca: "#3dff00", Sr: "#00ff00", Ba: "#00c900", Be: "#c2ff00",
  Fe: "#e06633", Cu: "#c88033", Zn: "#7d80b0", Ag: "#c0c0c0", Au: "#ffd123", Hg: "#b8b8d0", Ti: "#bfc2c7", Al: "#bfa6a6", Si: "#f0c8a0", B: "#ffb5b5", He: "#d9ffff", Ne: "#b3e3f5", Ar: "#80d1e3", Kr: "#5cb8d1", Xe: "#429eb0", Rn: "#428296", U: "#008fff" };
export const colourOf = (s) => CPK[s] || FAMILY[EL[s]?.fam]?.col || "#cccccc";
