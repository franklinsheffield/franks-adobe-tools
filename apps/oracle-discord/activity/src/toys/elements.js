// The 118 elements for Magister Vell's toys (Your element, the Wall of curiosities, the Potion mixer). One true,
// slightly weird fact each. Flame colours follow the standard flame-test table (a salt on a wire in a Bunsen flame);
// discharge colours are the glow of the pure gas in a sealed tube (like a neon sign). Positions follow the usual
// 18-column table with the lanthanides and actinides in two rows below.

export const CATS = {
  alkali: { name: "Alkali metal", col: "#b07cff" }, alkaline: { name: "Alkaline-earth metal", col: "#3fae6a" },
  transition: { name: "Transition metal", col: "#e0915a" }, post: { name: "Post-transition metal", col: "#9aa6b8" },
  metalloid: { name: "Metalloid", col: "#c7b45a" }, nonmetal: { name: "Non-metal", col: "#66b3ff" },
  halogen: { name: "Halogen", col: "#5fd46a" }, noble: { name: "Noble gas", col: "#5fe0e8" },
  lanthanide: { name: "Lanthanide", col: "#ffb35c" }, actinide: { name: "Actinide", col: "#ff7aa8" },
  superheavy: { name: "Superheavy (made a few atoms at a time)", col: "#c9c3d9" },
};

// [symbol, name, fact], in order of atomic number
const T = [
  ["H", "Hydrogen", "About three quarters of all the ordinary matter in the universe, by mass, is hydrogen."],
  ["He", "Helium", "Found in the Sun's light in 1868, 27 years before anyone found it on Earth."],
  ["Li", "Lithium", "So light it floats on water, and even on oil."],
  ["Be", "Beryllium", "X-rays pass almost straight through it, so X-ray tubes have beryllium windows."],
  ["B", "Boron", "Boron carbide is one of the hardest materials known. It goes into body armour."],
  ["C", "Carbon", "Diamond and pencil graphite are the same element, carbon, with the atoms stacked differently."],
  ["N", "Nitrogen", "Liquid nitrogen boils at −196 °C. A spill skitters across the floor on its own vapour."],
  ["O", "Oxygen", "Liquid oxygen is pale blue, and a strong magnet can hold it."],
  ["F", "Fluorine", "The most reactive element of all: even water catches fire in fluorine gas."],
  ["Ne", "Neon", "Real neon signs glow red-orange. Every other 'neon' colour is a different gas or a coated tube."],
  ["Na", "Sodium", "Soft enough to cut with a butter knife, and it fizzes, sometimes explosively, in water."],
  ["Mg", "Magnesium", "It burns so brightly that early photographers used it as their flash."],
  ["Al", "Aluminium", "Before 1886 it was a precious metal: Napoleon III kept aluminium cutlery for his most honoured guests."],
  ["Si", "Silicon", "The second most common element in Earth's crust, after oxygen. Sand is mostly silicon dioxide."],
  ["P", "Phosphorus", "Discovered in 1669 by Hennig Brand, who was boiling down huge amounts of urine, hoping for gold."],
  ["S", "Sulfur", "It burns with a blue flame. At night, Indonesia's Kawah Ijen volcano glows blue with it."],
  ["Cl", "Chlorine", "A yellow-green gas. Its name is Greek chlōros, pale green."],
  ["Ar", "Argon", "Almost 1% of every breath you take. Its name is Greek for 'lazy', because it reacts with nothing."],
  ["K", "Potassium", "Bananas are very slightly radioactive, thanks to the natural potassium-40 in them."],
  ["Ca", "Calcium", "The most abundant metal in your body, nearly all of it in your bones and teeth."],
  ["Sc", "Scandium", "Named after Scandinavia. A pinch in aluminium makes lighter bike frames and baseball bats."],
  ["Ti", "Titanium", "As strong as many steels at about 45% less weight."],
  ["V", "Vanadium", "Named after Vanadís, a name of the Norse goddess Freyja, for its beautiful coloured compounds."],
  ["Cr", "Chromium", "A trace of it makes rubies red and emeralds green."],
  ["Mn", "Manganese", "Some of the black in the 17,000-year-old cave paintings at Lascaux is manganese oxide."],
  ["Fe", "Iron", "Earth's inner core is mostly iron, roughly as hot as the surface of the Sun."],
  ["Co", "Cobalt", "Named after kobolds, the goblins German miners blamed for ore that gave no copper."],
  ["Ni", "Nickel", "From Kupfernickel, 'copper demon': an ore that looked like copper but gave none."],
  ["Cu", "Copper", "The Statue of Liberty is copper. It was shiny brown when new; the green patina took about twenty years to form."],
  ["Zn", "Zinc", "Hundreds of enzymes in your body need zinc to work."],
  ["Ga", "Gallium", "Melts at 29.8 °C: hold a piece and it melts in your hand."],
  ["Ge", "Germanium", "Mendeleev predicted it in 1871 as 'eka-silicon', 15 years before it was found."],
  ["As", "Arsenic", "So popular with poisoners it was nicknamed 'inheritance powder'."],
  ["Se", "Selenium", "It conducts better in light than in the dark, which made the first light sensors possible in the 1870s."],
  ["Br", "Bromine", "One of only two elements that are liquid at room temperature. The other is mercury."],
  ["Kr", "Krypton", "From 1960 to 1983 the metre was defined by the orange light of krypton-86."],
  ["Rb", "Rubidium", "Named from Latin rubidus, deep red, after the red lines in its light."],
  ["Sr", "Strontium", "Named after Strontian, a village in Scotland. It makes the reds in fireworks."],
  ["Y", "Yttrium", "One of four elements named after one Swedish village, Ytterby (with ytterbium, terbium and erbium)."],
  ["Zr", "Zirconium", "Cubic zirconia, the cheap diamond look-alike, is zirconium dioxide."],
  ["Nb", "Niobium", "Named after Niobe, daughter of Tantalus, because it is so often found with tantalum."],
  ["Mo", "Molybdenum", "From Greek molybdos, lead: its soft grey ore was mistaken for lead."],
  ["Tc", "Technetium", "The first element ever made artificially, in 1937. Its name means 'artificial'."],
  ["Ru", "Ruthenium", "Named after Ruthenia, an old Latin name for Russia."],
  ["Rh", "Rhodium", "In 1979 Guinness gave Paul McCartney a rhodium-plated disc as the best-selling songwriter of all time."],
  ["Pd", "Palladium", "It can soak up about 900 times its own volume of hydrogen gas."],
  ["Ag", "Silver", "The best conductor of electricity of any element."],
  ["Cd", "Cadmium", "Cadmium pigments made many of the bright yellows and oranges in Impressionist paintings."],
  ["In", "Indium", "Most touchscreens have a see-through film of indium tin oxide that carries the current."],
  ["Sn", "Tin", "Bend a bar of tin and it 'cries': a faint crackle as its crystals slip."],
  ["Sb", "Antimony", "Ancient Egyptian kohl eyeliner was often made from stibnite, antimony sulfide."],
  ["Te", "Tellurium", "A tiny exposure gives you garlic breath that can last for weeks."],
  ["I", "Iodine", "Warm the solid and it turns straight into a violet vapour without melting."],
  ["Xe", "Xenon", "NASA's Dawn spacecraft crossed the asteroid belt pushed by ion engines firing xenon."],
  ["Cs", "Caesium", "The second is defined by caesium-133 atoms: 9,192,631,770 ticks of their light."],
  ["Ba", "Barium", "Patients swallow a barium sulfate 'meal' so their gut shows up on X-rays."],
  ["La", "Lanthanum", "Added to glass for camera lenses, because it makes the glass bend light more."],
  ["Ce", "Cerium", "The sparks from a lighter's flint come from an alloy that is mostly cerium."],
  ["Pr", "Praseodymium", "Its name means 'green twin': it was split from its twin, neodymium, in 1885."],
  ["Nd", "Neodymium", "Neodymium magnets are the strongest permanent magnets you can buy."],
  ["Pm", "Promethium", "Every form of it is radioactive. It is named after Prometheus, who stole fire from the gods."],
  ["Sm", "Samarium", "The first element named, through a mineral, after a person: the mining official Vasili Samarsky-Bykhovets."],
  ["Eu", "Europium", "Euro banknotes carry a europium-based ink that glows under ultraviolet light, a check against fakes."],
  ["Gd", "Gadolinium", "Gadolinium compounds are injected before some MRI scans so blood vessels show up."],
  ["Tb", "Terbium", "The green glow in many fluorescent lamps comes from terbium."],
  ["Dy", "Dysprosium", "Its name is Greek for 'hard to get at'. It took its discoverer more than 30 tries in 1886."],
  ["Ho", "Holmium", "Named after Holmia, the Latin name for Stockholm."],
  ["Er", "Erbium", "Erbium in glass fibre boosts the light signals that carry the internet under the oceans."],
  ["Tm", "Thulium", "Named after Thule, the ancient name for the far north."],
  ["Yb", "Ytterbium", "Ytterbium atomic clocks are among the most precise clocks ever built."],
  ["Lu", "Lutetium", "Named after Lutetia, the Roman name for Paris."],
  ["Hf", "Hafnium", "It hid inside zirconium ores until 1923, and was named after Hafnia, Latin for Copenhagen."],
  ["Ta", "Tantalum", "Named after Tantalus, who could never drink, because it won't 'drink' acid."],
  ["W", "Tungsten", "The highest melting point of any metal, 3,422 °C. Its symbol W is from its other name, wolfram."],
  ["Re", "Rhenium", "The last stable element to be discovered, in 1925."],
  ["Os", "Osmium", "The densest element: a litre of it would weigh about 22.6 kg."],
  ["Ir", "Iridium", "A thin layer of iridium in rocks around the world marks the asteroid impact that ended the dinosaurs."],
  ["Pt", "Platinum", "Spanish explorers called it platina, 'little silver', and treated it as a nuisance in their gold."],
  ["Au", "Gold", "All the gold ever mined would fit in a cube about 22 metres on each side."],
  ["Hg", "Mercury", "The only metal that is liquid at room temperature."],
  ["Tl", "Thallium", "Its salts were once sold as rat poison, and even in a hair-removing cream."],
  ["Pb", "Lead", "'Plumber' comes from plumbum, Latin for lead: Roman water pipes were made of it."],
  ["Bi", "Bismuth", "Its crystals grow as rainbow staircases. It is also the active ingredient in Pepto-Bismol."],
  ["Po", "Polonium", "Discovered by Marie and Pierre Curie in 1898 and named after Poland, Marie's homeland."],
  ["At", "Astatine", "One of the rarest natural elements: only a tiny amount exists in Earth's crust at any moment."],
  ["Rn", "Radon", "A radioactive gas that seeps out of granite. After smoking, it is the leading cause of lung cancer."],
  ["Fr", "Francium", "The last element found in nature, in 1939, by Marguerite Perey."],
  ["Ra", "Radium", "Radium paint made watch dials glow. The 'Radium Girls' who painted them were poisoned by it."],
  ["Ac", "Actinium", "It glows pale blue in the dark from its own radioactivity."],
  ["Th", "Thorium", "Named after Thor, the Norse god of thunder."],
  ["Pa", "Protactinium", "Its name means 'before actinium', because it decays into actinium."],
  ["U", "Uranium", "Named in 1789 after the planet Uranus, discovered just eight years before."],
  ["Np", "Neptunium", "It comes after uranium, so it was named after Neptune, the planet after Uranus."],
  ["Pu", "Plutonium", "Next after neptunium, so it was named after Pluto."],
  ["Am", "Americium", "A speck of it sits inside most household smoke alarms."],
  ["Cm", "Curium", "Named after Marie and Pierre Curie."],
  ["Bk", "Berkelium", "Named after Berkeley, California, where it was first made in 1949."],
  ["Cf", "Californium", "Named after California. It gives off so many neutrons that it is used to start up nuclear reactors."],
  ["Es", "Einsteinium", "First found in the debris of the first hydrogen bomb test, in 1952."],
  ["Fm", "Fermium", "Also found in that 1952 bomb debris, and named after Enrico Fermi."],
  ["Md", "Mendelevium", "Honours Mendeleev, maker of the periodic table. It was first made 17 atoms at a time, in 1955."],
  ["No", "Nobelium", "Named after Alfred Nobel, who founded the Nobel Prizes."],
  ["Lr", "Lawrencium", "Named after Ernest Lawrence, inventor of the cyclotron."],
  ["Rf", "Rutherfordium", "Named after Ernest Rutherford, who discovered the atomic nucleus."],
  ["Db", "Dubnium", "Named after Dubna, the Russian town with a major nuclear research lab."],
  ["Sg", "Seaborgium", "Named after Glenn Seaborg while he was still alive, a very rare honour."],
  ["Bh", "Bohrium", "Named after Niels Bohr, who pictured electrons in shells round the nucleus."],
  ["Hs", "Hassium", "Named after Hesse (Latin Hassia), the German state where it was made."],
  ["Mt", "Meitnerium", "Honours Lise Meitner, who helped explain nuclear fission."],
  ["Ds", "Darmstadtium", "Named after Darmstadt, Germany, home of the lab that made it."],
  ["Rg", "Roentgenium", "Named after Wilhelm Röntgen, who discovered X-rays."],
  ["Cn", "Copernicium", "Honours Copernicus, who put the Sun at the centre."],
  ["Nh", "Nihonium", "The first element discovered in Asia, in Japan. Nihon means Japan."],
  ["Fl", "Flerovium", "Named after the Flerov Laboratory in Dubna."],
  ["Mc", "Moscovium", "Named after the Moscow region."],
  ["Lv", "Livermorium", "Named after Lawrence Livermore National Laboratory in California."],
  ["Ts", "Tennessine", "The most recently discovered element (2010), named in 2016 after Tennessee."],
  ["Og", "Oganesson", "The heaviest element known, named after Yuri Oganessian, who was alive to see it."],
];

const SET = (s) => new Set(s.split(" ").map(Number));
const ALK = SET("3 11 19 37 55 87"), AE = SET("4 12 20 38 56 88"), NOB = SET("2 10 18 36 54 86"), HAL = SET("9 17 35 53 85"),
  NON = SET("1 6 7 8 15 16 34"), MET = SET("5 14 32 33 51 52"), POST = SET("13 31 49 50 81 82 83 84");
export function catOf(z) {
  if (ALK.has(z)) return "alkali"; if (AE.has(z)) return "alkaline"; if (NOB.has(z)) return "noble"; if (HAL.has(z)) return "halogen";
  if (NON.has(z)) return "nonmetal"; if (MET.has(z)) return "metalloid"; if (POST.has(z)) return "post";
  if (z >= 57 && z <= 71) return "lanthanide"; if (z >= 89 && z <= 103) return "actinide"; if (z >= 113) return "superheavy";
  return "transition";
}

/** [row 1-7 (8, 9 for the f-block rows), column 1-18]. */
export function placeOf(z) {
  if (z >= 57 && z <= 71) return [8, z - 57 + 3];
  if (z >= 89 && z <= 103) return [9, z - 89 + 3];
  if (z === 1) return [1, 1]; if (z === 2) return [1, 18];
  const starts = [[3, 2], [11, 3], [19, 4], [37, 5], [55, 6], [87, 7]];
  let [z0, row] = starts[0]; for (const s of starts) if (z >= s[0]) [z0, row] = s;
  const i = z - z0;
  if (row <= 3) return [row, i < 2 ? i + 1 : i + 11];
  if (row <= 5) return [row, i + 1];
  if (i < 2) return [row, i + 1];
  return [row, i - 14 + 1]; // after the 15-wide f-block: Hf (72) / Rf (104) sit in column 4
}

/** Flame-test colours: [colour words, hex]. */
export const FLAME = {
  Li: ["crimson", "#ff2d55"], Na: ["intense yellow", "#ffc81a"], K: ["lilac", "#c58cff"], Rb: ["red-violet", "#d0357a"], Cs: ["blue-violet", "#6f5cff"],
  Ca: ["orange-red", "#ff7a2a"], Sr: ["crimson", "#ff2a1a"], Ba: ["apple green", "#a8e63a"], Ra: ["crimson", "#e8203a"],
  Cu: ["blue-green", "#2fd6b0"], B: ["bright green", "#3cf06a"], In: ["indigo", "#4b4cff"], Tl: ["pure green", "#3cff5a"],
  Se: ["azure blue", "#3fa8ff"], As: ["blue", "#5c8cff"], Pb: ["pale blue-white", "#b8d4ff"], Sb: ["pale green", "#b6f0a8"], Te: ["pale green", "#a8f0b8"],
  Mn: ["yellowish green", "#c6e85a"], Mo: ["yellowish green", "#cde65a"],
};
/** Discharge-tube glow of the pure gas (or vapour): [colour words, hex]. */
export const GLOW = {
  H: ["pink-purple", "#e05cff"], He: ["peach-pink", "#ffb08a"], Ne: ["red-orange", "#ff5a1f"], Ar: ["lavender", "#b07cff"],
  Kr: ["pale lilac-white", "#e6d8ff"], Xe: ["blue-violet", "#7a8cff"], N: ["pink-purple", "#d87cff"], O: ["pale violet", "#c8b4ff"], Hg: ["blue-white", "#b8e0ff"],
};

export const ELEMENTS = T.map(([s, name, fact], i) => { const z = i + 1; return { z, s, name, fact, cat: catOf(z), place: placeOf(z), flame: FLAME[s] || null, glow: GLOW[s] || null }; });
export const bySym = (s) => ELEMENTS.find((e) => e.s === s) || null;

/** How Vell lights this element: flame | glow | lab-only | none, with a line saying exactly why. */
export function lightOf(e) {
  if (e.flame) return { kind: "flame", hex: e.flame[1], line: `In a Bunsen flame its salts burn ${e.flame[0]}.` };
  if (e.glow) return { kind: "glow", hex: e.glow[1], line: e.s === "Hg" ? `Its vapour glows ${e.glow[0]} in a lamp tube.` : `It's a gas, so it doesn't flame-test, but in a sealed tube with a current through it, it glows ${e.glow[0]}.` };
  if (e.z >= 93 || e.s === "Tc" || e.s === "Pm" || e.s === "At" || e.s === "Fr") return { kind: "lab", hex: "#c9c3d9", line: "Too rare or too radioactive for any flame test. Nobody puts this on a wire loop." };
  if (e.s === "F" || e.s === "Cl" || e.s === "Rn" || e.s === "Br") return { kind: "none", hex: "#7fb8ff", line: "Not one for my burner: far too corrosive or radioactive to play with." };
  return { kind: "none", hex: "#7fb8ff", line: "No flame colour of its own: the burner stays its own pale blue." };
}

/** Your element: count the days of the year along the table. 1 January is hydrogen, 2 January helium, and so on;
 *  after oganesson (118) it starts again at hydrogen. Day count uses a leap-year calendar so 29 February has its own. */
export function dayOfYear(d, m) { const len = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let n = d; for (let i = 0; i < m - 1; i++) n += len[i]; return n; }
export function birthElement(d, m) { const n = dayOfYear(d, m); return { day: n, el: ELEMENTS[(n - 1) % 118], lap: Math.floor((n - 1) / 118) + 1 }; }
/** Parse DD/MM/YYYY (year optional: DD/MM). Returns { d, m } or null. */
export function parseDM(s) {
  const t = String(s || "").trim().match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?$/); if (!t) return null;
  const d = +t[1], m = +t[2], len = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (m < 1 || m > 12 || d < 1 || d > len[m - 1]) return null;
  if (t[3] && m === 2 && d === 29) { const y = +t[3]; if (t[3].length === 4 && !((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) return null; }
  return { d, m };
}
