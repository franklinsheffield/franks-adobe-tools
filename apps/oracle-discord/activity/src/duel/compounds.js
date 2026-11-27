// Element Duel: the compounds you can make. Every one is a real, known substance with its real formula.
// dh = standard enthalpy of formation ΔHf° in kJ/mol at 25 °C (textbook/CRC values, rounded to 0.1) for the phase ph
// it is in at room temperature (s solid, l liquid, g gas). Negative = exothermic: energy is released when the compound
// forms from its elements, and the more negative, the harder it hits. Positive = endothermic: it costs energy to make.
// tags: acid / base (in water), cat (made industrially over a catalyst), spark (formed by a spark or lightning).
// tier = the first level it counts at (1 Apprentice: two-atom compounds; 2 Chemist; 3 Master).
const C = [
  // ---- Level 1 · Apprentice: two atoms, one of each ----
  ["NaCl", "Sodium chloride", 1, -411.2, "s", [], "Table salt. Roman soldiers were sometimes paid in salt: one story behind the word 'salary'."],
  ["KCl", "Potassium chloride", 1, -436.5, "s", [], "Sold as 'low-sodium salt', and dug up by the million tonnes as potash fertiliser."],
  ["HCl", "Hydrogen chloride", 1, -92.3, "g", ["acid"], "Dissolved in water it is hydrochloric acid, the same acid that is in your stomach."],
  ["HF", "Hydrogen fluoride", 1, -273.3, "g", ["acid"], "Its solution eats into glass: glassmakers use it to etch and frost windows."],
  ["NaF", "Sodium fluoride", 1, -576.6, "s", [], "Added to some toothpastes to make tooth enamel tougher."],
  ["KF", "Potassium fluoride", 1, -567.3, "s", [], "Chemists use it to slip fluorine atoms into other molecules."],
  ["LiF", "Lithium fluoride", 1, -616.0, "s", [], "Lets through ultraviolet light that glass blocks, so it is used for UV lenses and windows."],
  ["LiCl", "Lithium chloride", 1, -408.6, "s", [], "Pulls water out of the air so strongly that it is used to dry air in industrial air-conditioning."],
  ["LiH", "Lithium hydride", 1, -90.5, "s", [], "Packs lots of hydrogen into a light solid. It reacts with water to give hydrogen gas."],
  ["NaH", "Sodium hydride", 1, -56.3, "s", [], "Here hydrogen is the negative ion, H⁻. It reacts violently with water, releasing hydrogen."],
  ["KH", "Potassium hydride", 1, -57.7, "s", [], "Even more reactive than sodium hydride: it can catch fire in damp air."],
  ["MgO", "Magnesium oxide", 1, -601.6, "s", [], "The white ash left after magnesium burns with its dazzling flame."],
  ["CaO", "Calcium oxide", 1, -634.9, "s", [], "Quicklime. Heated in a flame it glows brilliantly: the original 'limelight' of 1800s theatres."],
  ["ZnO", "Zinc oxide", 1, -350.5, "s", [], "The white in many mineral sunscreens: it blocks ultraviolet light."],
  ["CuO", "Copper(II) oxide", 1, -157.3, "s", [], "The black coating that grows on copper when you heat it in air."],
  ["FeO", "Iron(II) oxide", 1, -272.0, "s", [], "A black powder. In a blast furnace, iron ore passes through it on its way to becoming iron."],
  ["CO", "Carbon monoxide", 1, -110.5, "g", [], "A colourless, odourless poison from fuel burning without enough air: the reason homes have CO alarms."],
  ["NO", "Nitric oxide", 1, 91.3, "g", ["spark", "cat"], "Lightning makes it from air. In your body it signals blood vessels to widen (Nobel Prize, 1998)."],
  ["MgS", "Magnesium sulfide", 1, -346.0, "s", [], "Turns up in some meteorites, inside the rare mineral niningerite."],
  ["CaS", "Calcium sulfide", 1, -482.4, "s", [], "Glows after light hits it: the key ingredient of Victorian 'luminous paint'."],
  ["ZnS", "Zinc sulfide", 1, -206.0, "s", [], "Flashes when hit by radiation. Rutherford's team counted alpha particles by watching its sparks."],
  ["FeS", "Iron(II) sulfide", 1, -100.0, "s", [], "Made by heating iron filings with sulfur, a classic school experiment."],
  ["CuS", "Copper(II) sulfide", 1, -53.1, "s", [], "Found in nature as covellite, an indigo-blue mineral."],
  ["AlN", "Aluminium nitride", 1, -318.0, "s", [], "A ceramic that carries heat like a metal but blocks electricity: used under computer chips."],
  ["SiC", "Silicon carbide", 1, -65.3, "s", [], "Nearly as hard as diamond. Its natural crystals, moissanite, were first found in a meteor crater."],

  // ---- Level 2 · Chemist: real formulas with several atoms ----
  ["H2O", "Water", 2, -285.8, "l", [], "The only common substance found naturally on Earth as solid, liquid and gas."],
  ["CO2", "Carbon dioxide", 2, -393.5, "g", [], "Plants build sugar out of it. Joseph Black named it 'fixed air' in the 1750s."],
  ["NH3", "Ammonia", 2, -45.9, "g", ["base", "cat"], "The Haber–Bosch process makes it from air over an iron catalyst: its fertilisers help feed about half the world."],
  ["CH4", "Methane", 2, -74.6, "g", [], "The main gas in natural gas, and it fills lakes on Saturn's moon Titan."],
  ["H2S", "Hydrogen sulfide", 2, -20.6, "g", ["acid"], "The rotten-egg smell. Dangerous: strong doses knock out your sense of smell."],
  ["SO2", "Sulfur dioxide", 2, -296.8, "g", [], "Volcanoes breathe it out. Winemakers add a trace as a preservative."],
  ["NO2", "Nitrogen dioxide", 2, 33.2, "g", ["spark"], "The brown haze of city smog. Lightning's NO turns into it in the air."],
  ["N2O", "Nitrous oxide", 2, 81.6, "g", [], "Laughing gas. Humphry Davy breathed it, for science and fun, in 1799."],
  ["MgCl2", "Magnesium chloride", 2, -641.3, "s", [], "Spread on icy roads, and used as nigari to set soy milk into tofu."],
  ["CaCl2", "Calcium chloride", 2, -795.4, "s", [], "A road de-icer that warms up as it dissolves."],
  ["Na2O", "Sodium oxide", 2, -414.2, "s", [], "Window glass is about 13% of it, added as soda ash."],
  ["K2O", "Potassium oxide", 2, -361.5, "s", [], "Fertiliser bags list their potassium 'as K₂O', though there is none of it inside."],
  ["Li2O", "Lithium oxide", 2, -597.9, "s", [], "Used in tough ceramic glazes and heat-proof glass cooktops."],
  ["Al2O3", "Aluminium oxide", 2, -1675.7, "s", [], "Rubies and sapphires are crystals of it, coloured by traces of other metals."],
  ["Fe2O3", "Iron(III) oxide", 2, -824.2, "s", [], "Most of rust, and the red ochre in the oldest cave paintings."],
  ["Fe3O4", "Iron(II,III) oxide", 2, -1118.4, "s", [], "Magnetite, the most magnetic natural mineral: lodestones are made of it."],
  ["Cu2O", "Copper(I) oxide", 2, -168.6, "s", [], "A red powder in the anti-fouling paint on ship hulls."],
  ["SiO2", "Silicon dioxide", 2, -910.7, "s", [], "Quartz, sand and glass."],
  ["CaF2", "Calcium fluoride", 2, -1228.0, "s", [], "The mineral fluorite, which gave its name to fluorescence."],
  ["NaOH", "Sodium hydroxide", 2, -425.8, "s", ["base"], "Lye: it turns fat into soap, and gives pretzels their brown crust."],
  ["KOH", "Potassium hydroxide", 2, -424.6, "s", ["base"], "Makes soft soap, and is the electrolyte inside alkaline batteries."],
  ["LiOH", "Lithium hydroxide", 2, -487.5, "s", ["base"], "It scrubs CO₂ from spacecraft air: home-made lithium hydroxide filters saved the Apollo 13 crew."],
  ["HNO3", "Nitric acid", 2, -174.1, "l", ["acid", "cat"], "Alchemists called it aqua fortis, 'strong water'. Made today by the Ostwald process over platinum."],
  ["H2O2", "Hydrogen peroxide", 2, -187.8, "l", [], "Bleach and disinfectant. The bombardier beetle fires a boiling spray powered by it."],
  ["CaCO3", "Calcium carbonate", 2, -1207.6, "s", [], "Chalk, limestone, marble, pearls and seashells."],
  ["H2SO4", "Sulfuric acid", 2, -814.0, "l", ["acid", "cat"], "Once called oil of vitriol, now the chemical industry makes more of it than almost anything else."],
  ["Na2S", "Sodium sulfide", 2, -364.8, "s", [], "Used in tanning to strip the hair off hides."],
  ["ZnCl2", "Zinc chloride", 2, -415.1, "s", [], "Soldering flux: it cleans metal so the solder sticks."],
  ["AgCl", "Silver chloride", 2, -127.0, "s", [], "Darkens in light, which made it one of the first photographic chemicals."],
  ["AgBr", "Silver bromide", 2, -100.4, "s", [], "The light-catching crystal in classic photographic film."],
  ["AgI", "Silver iodide", 2, -61.8, "s", [], "Sprayed into clouds to 'seed' rain and snow."],
  ["NaBr", "Sodium bromide", 2, -361.1, "s", [], "A Victorian sedative; today it helps keep hot tubs clean."],
  ["KBr", "Potassium bromide", 2, -393.8, "s", [], "One of the first medicines for epilepsy, from 1857."],
  ["KI", "Potassium iodide", 2, -327.9, "s", [], "Its tablets protect the thyroid after a nuclear accident."],
  ["NaI", "Sodium iodide", 2, -287.8, "s", [], "Its crystals flash when gamma rays hit them, so they are used in radiation detectors."],
  ["HBr", "Hydrogen bromide", 2, -36.3, "g", ["acid"], "In water it makes hydrobromic acid, stronger than hydrochloric acid."],
  ["HI", "Hydrogen iodide", 2, 26.5, "g", ["acid"], "In water it makes hydroiodic acid, one of the strongest common acids."],
  ["BaSO4", "Barium sulfate", 2, -1473.2, "s", [], "The 'barium meal' that lights up your gut on an X-ray. Too insoluble to poison you."],
  ["BaO", "Barium oxide", 2, -548.0, "s", [], "Coated on the cathodes of old vacuum tubes to help them shed electrons."],
  ["TiO2", "Titanium dioxide", 2, -944.0, "s", [], "The brilliant white in paint, paper and toothpaste."],
  ["MnO2", "Manganese dioxide", 2, -520.0, "s", [], "Inside ordinary alkaline batteries, and a black pigment of prehistoric cave art."],
  ["Cr2O3", "Chromium(III) oxide", 2, -1139.7, "s", [], "A tough green pigment, 'chrome green', for paints and ceramics."],
  ["PbS", "Lead(II) sulfide", 2, -100.4, "s", [], "Galena, the main lead ore. Early 'crystal radio' sets used it to pick up signals."],
  ["PbO", "Lead(II) oxide", 2, -219.0, "s", [], "Litharge, used for centuries to make sparkling lead 'crystal' glass."],
  ["SnO2", "Tin(IV) oxide", 2, -577.6, "s", [], "Cassiterite, the tin ore mined in Cornwall since the Bronze Age."],
  ["NiO", "Nickel(II) oxide", 2, -239.7, "s", [], "A green-black ceramic used in batteries and fuel cells."],
  ["NiCl2", "Nickel(II) chloride", 2, -305.3, "s", [], "Its green crystals are used for nickel plating."],
  ["CoO", "Cobalt(II) oxide", 2, -237.9, "s", [], "Turns glass and pottery deep blue."],
  ["CoCl2", "Cobalt(II) chloride", 2, -312.5, "s", [], "Blue when dry, pink when damp: it is in humidity-indicator cards."],
  ["CuSO4", "Copper(II) sulfate", 2, -771.4, "s", [], "White when dry. With water it turns the famous bright blue crystals."],
  ["KNO3", "Potassium nitrate", 2, -494.6, "s", [], "Saltpetre, the oxidiser in black gunpowder."],
  ["NH4Cl", "Ammonium chloride", 2, -314.4, "s", [], "Salmiak, the salty flavour of Nordic liquorice."],
  ["PCl3", "Phosphorus trichloride", 2, -319.7, "l", [], "A starting point for making flame retardants and weedkillers."],
  ["SiCl4", "Silicon tetrachloride", 2, -687.0, "l", [], "Burned into ultra-pure silica to make optical fibres."],
  ["BF3", "Boron trifluoride", 2, -1136.0, "g", [], "A catalyst chemists use to make plastics and medicines."],
  ["B2O3", "Boron trioxide", 2, -1273.5, "s", [], "Turns ordinary glass into heat-proof borosilicate glass."],
  ["CCl4", "Carbon tetrachloride", 2, -128.2, "l", [], "Once in fire extinguishers and dry cleaning, now banned as toxic."],
  ["BeO", "Beryllium oxide", 2, -609.4, "s", [], "A ceramic that conducts heat almost as well as metal. Toxic as dust."],
  ["HgO", "Mercury(II) oxide", 2, -90.8, "s", [], "Priestley heated it in 1774 and collected a new gas: oxygen."],
  ["HgS", "Mercury(II) sulfide", 2, -58.2, "s", [], "Cinnabar, the source of the painters' red, vermilion."],
  ["SrO", "Strontium oxide", 2, -592.0, "s", [], "Added to the glass of old colour TV screens to block X-rays."],
  ["SeO2", "Selenium dioxide", 2, -225.4, "s", [], "A chemists' oxidising reagent. Selenium is toxic in excess but you need a trace of it."],
  ["AuCl3", "Gold(III) chloride", 2, -117.6, "s", [], "Made by heating gold in chlorine: one of the few compounds that stubborn gold forms."],

  // ---- Level 3 · Master: heavier formulas, the rest of the table, and the steps of real industrial reactions ----
  ["SO3", "Sulfur trioxide", 3, -441.0, "l", ["cat"], "The Contact process makes it from SO₂ over a vanadium oxide catalyst, then turns it into sulfuric acid."],
  ["PCl5", "Phosphorus pentachloride", 3, -443.5, "s", [], "Phosphorus holds five chlorines here, breaking the 'octet rule' taught in school."],
  ["Ca(OH)2", "Calcium hydroxide", 3, -985.2, "s", ["base"], "Slaked lime. Mixed with sand, it is the lime mortar of Roman walls."],
  ["Mg(OH)2", "Magnesium hydroxide", 3, -924.5, "s", ["base"], "Milk of magnesia, an antacid."],
  ["Na2CO3", "Sodium carbonate", 3, -1130.7, "s", [], "Soda ash, made by the Solvay process: glassmakers have used it for thousands of years."],
  ["NaHCO3", "Sodium bicarbonate", 3, -950.8, "s", [], "Baking soda: the CO₂ it gives off makes cakes rise."],
  ["NaNO3", "Sodium nitrate", 3, -467.9, "s", [], "Chile saltpetre, mined from the Atacama Desert as fertiliser."],
  ["MgCO3", "Magnesium carbonate", 3, -1095.8, "s", [], "The 'chalk' climbers and gymnasts put on their hands."],
  ["SrCO3", "Strontium carbonate", 3, -1220.1, "s", [], "The red in fireworks and road flares."],
  ["CH3OH", "Methanol", 3, -239.2, "l", ["cat"], "Wood alcohol, made today from CO and hydrogen over a copper–zinc oxide catalyst. Poisonous to drink."],
  ["C2H2", "Acetylene", 3, 227.4, "g", [], "Burns with oxygen at over 3,000 °C in welding torches."],
  ["C2H4", "Ethylene", 3, 52.4, "g", [], "A plant hormone that ripens fruit: one bad apple really does spoil the bunch."],
  ["CH2O", "Formaldehyde", 3, -108.6, "g", ["cat"], "Made from methanol over a silver or metal-oxide catalyst. It preserves specimens."],
  ["CS2", "Carbon disulfide", 3, 89.0, "l", [], "So flammable that a hot steam pipe can set its vapour alight."],
  ["N2H4", "Hydrazine", 3, 50.6, "l", [], "Spacecraft thrusters run on it: it splits apart over a catalyst, no oxygen needed."],
  ["ZnSO4", "Zinc sulfate", 3, -982.8, "s", [], "A zinc supplement in animal feed and fertiliser."],
  ["PbO2", "Lead(IV) oxide", 3, -277.4, "s", [], "The brown plates inside a car's lead-acid battery."],
  ["Ag2O", "Silver oxide", 3, -31.1, "s", [], "Powers watch button batteries."],
  ["MgF2", "Magnesium fluoride", 3, -1124.2, "s", [], "The thin anti-reflection coating on camera lenses."],
  ["KMnO4", "Potassium permanganate", 3, -837.2, "s", [], "Deep purple crystals, a strong oxidiser used to treat drinking water."],
  ["TiCl4", "Titanium tetrachloride", 3, -804.2, "l", [], "Fumes into white smoke in damp air (skywriters used it), and is the step to titanium metal in the Kroll process."],
  ["CsCl", "Caesium chloride", 3, -443.0, "s", [], "Spun in a centrifuge it sorts DNA by density: the 1958 Meselson–Stahl experiment used it."],
  ["RbCl", "Rubidium chloride", 3, -435.4, "s", [], "Used in biology labs to help bacteria take up new DNA."],
  ["ZrO2", "Zirconium dioxide", 3, -1100.6, "s", [], "Cubic zirconia, the diamond look-alike, and ceramic knives."],
  ["MoS2", "Molybdenum disulfide", 3, -235.1, "s", [], "A dry lubricant: its layers slide over each other like graphite."],
  ["WO3", "Tungsten trioxide", 3, -842.9, "s", [], "Turns blue when charged, which is how some 'smart glass' windows darken."],
  ["V2O5", "Vanadium pentoxide", 3, -1550.6, "s", [], "The catalyst of the Contact process for sulfuric acid."],
  ["UO2", "Uranium dioxide", 3, -1085.0, "s", [], "The fuel pellets inside most nuclear reactors."],
  ["As2O3", "Arsenic trioxide", 3, -657.4, "s", [], "'White arsenic', the poisoner's powder, and today a real leukaemia medicine."],
  ["Bi2O3", "Bismuth(III) oxide", 3, -573.9, "s", [], "The crackle in 'dragon's eggs' fireworks."],
  ["Sb2S3", "Antimony trisulfide", 3, -174.9, "s", [], "Stibnite: in ancient kohl eyeliner and in some match heads."],
  ["CdS", "Cadmium sulfide", 3, -161.9, "s", [], "Cadmium yellow paint. Its resistance drops in light, so old light meters used it."],
];

/** Parse a formula like "Ca(OH)2" into atom counts { Ca: 1, O: 2, H: 2 }. */
export function parse(f) {
  const stack = [{}]; let i = 0;
  const add = (o, s, n) => { o[s] = (o[s] || 0) + n; };
  while (i < f.length) {
    const ch = f[i];
    if (ch === "(") { stack.push({}); i++; continue; }
    if (ch === ")") { i++; let n = ""; while (/\d/.test(f[i] || "")) n += f[i++]; const g = stack.pop(); for (const [s, k] of Object.entries(g)) add(stack.at(-1), s, k * (+n || 1)); continue; }
    const m = /^[A-Z][a-z]?/.exec(f.slice(i)); if (!m) throw new Error("bad formula " + f);
    i += m[0].length; let n = ""; while (/\d/.test(f[i] || "")) n += f[i++];
    add(stack.at(-1), m[0], +n || 1);
  }
  return stack[0];
}
const SUB = "₀₁₂₃₄₅₆₇₈₉";
/** "H2SO4" → "H₂SO₄" */
export const pretty = (f) => f.replace(/\d/g, (d) => SUB[d]);

export const COMPOUNDS = C.map(([f, name, tier, dh, ph, tags, fact]) => {
  const atoms = parse(f), n = Object.values(atoms).reduce((a, b) => a + b, 0), els = Object.keys(atoms);
  const oxide = els.length === 2 && atoms.O && f !== "H2O" && f !== "H2O2";
  return { id: f, f, name, tier, dh, ph, tags, fact, atoms, n, els, endo: dh > 0, oxide, gas: ph === "g", metalOxide: oxide && !["C", "N", "S", "Si", "B", "P", "Se", "As", "H"].some((s) => atoms[s]) };
});
export const BY_ID = Object.fromEntries(COMPOUNDS.map((c) => [c.id, c]));
export const compoundsOf = (tier) => COMPOUNDS.filter((c) => c.tier <= tier);
/** A canonical key for a set of atom counts, so a bench of cards can be looked up in any order. */
export const keyOf = (atoms) => Object.entries(atoms).filter(([, n]) => n > 0).sort(([a], [b]) => (a < b ? -1 : 1)).map(([s, n]) => s + n).join("");
export const BY_KEY = Object.fromEntries(COMPOUNDS.map((c) => [keyOf(c.atoms), c]));

// Master level: real multi-step processes. Make the steps on consecutive turns of yours for a chain bonus.
export const CHAINS = [
  { id: "contact", name: "Contact process", steps: ["SO2", "SO3", "H2SO4"], what: "Sulfur dioxide is oxidised to sulfur trioxide over vanadium oxide, which then becomes sulfuric acid." },
  { id: "ostwald", name: "Ostwald process", steps: ["NH3", "NO", "NO2", "HNO3"], what: "Ammonia burns over platinum to nitric oxide, which oxidises to nitrogen dioxide, which water turns into nitric acid." },
  { id: "lime", name: "Lime cycle", steps: ["CaCO3", "CaO", "Ca(OH)2"], what: "Limestone is heated to quicklime, which slakes with water to slaked lime (and sets back into limestone in mortar)." },
  { id: "solvay", name: "Solvay process", steps: ["NaCl", "NaHCO3", "Na2CO3"], what: "Brine, ammonia and CO₂ give baking soda, which is heated into soda ash." },
  { id: "furnace", name: "Blast furnace", steps: ["Fe2O3", "Fe3O4", "FeO"], what: "Carbon monoxide strips oxygen from iron ore step by step: Fe₂O₃, then Fe₃O₄, then FeO, then iron." },
  { id: "kroll", name: "Kroll process", steps: ["TiO2", "TiCl4", "MgCl2"], what: "Titanium ore is chlorinated to TiCl₄, then magnesium takes the chlorine, leaving titanium metal and MgCl₂." },
  { id: "salmiak", name: "Salmiak smoke", steps: ["HCl", "NH3", "NH4Cl"], what: "Hydrogen chloride and ammonia gases meet in the air and form a white smoke of ammonium chloride." },
  { id: "methanol", name: "Methanol synthesis", steps: ["CO", "CH3OH", "CH2O"], what: "Carbon monoxide and hydrogen give methanol over copper–zinc oxide, and methanol is oxidised to formaldehyde." },
];
