// Discovery Bench content: base reagents, operations and real reactions. Minerals named in the Mineral Cabinet
// (minerals/data.js) become ingredients; every product made becomes an ingredient too. Each recipe is a real
// reaction or a real craft process, with a balanced equation where one applies (simplified to the main products).
// hz: a real hazard of doing it ({ kind: "gas" | "boom" | "burn", what }).

/** Always on the shelf. c = jar colour. */
export const BASE = [
  { id: "water", name: "Water", f: "H₂O", c: "#7ab8ff" },
  { id: "charcoal", name: "Charcoal", f: "C", c: "#2a2a2a" },
  { id: "air", name: "Air (oxygen)", f: "O₂", c: "#cfe8ff" },
  { id: "vinegar", name: "Vinegar", f: "CH₃COOH", c: "#e8d8a0" },
  { id: "hcl", name: "Spirit of salt", f: "HCl", c: "#d8f0c8" },
  { id: "vitriol", name: "Oil of vitriol", f: "H₂SO₄", c: "#f0e0a0" },
  { id: "fortis", name: "Aqua fortis", f: "HNO₃", c: "#f8d890" },
  { id: "ash", name: "Wood ash (potash)", f: "K₂CO₃", c: "#b8b0a8" },
  { id: "oil", name: "Olive oil", f: "fat", c: "#c8b040" },
];
export const OPS = {
  heat: { emoji: "🔥", name: "Heat in air", what: "Roast or calcine in an open crucible" },
  smelt: { emoji: "⚒️", name: "Smelt", what: "Heat strongly in a furnace, usually with charcoal" },
  melt: { emoji: "🫗", name: "Melt together", what: "Melt metals into one alloy" },
  mix: { emoji: "🧪", name: "Mix", what: "Combine in a flask, cold" },
  burn: { emoji: "🕯️", name: "Burn", what: "Set it alight in air" },
  boil: { emoji: "♨️", name: "Boil", what: "Heat the mixture in water" },
  electro: { emoji: "⚡", name: "Electrolyse", what: "Pass an electric current through it" },
  grind: { emoji: "🪨", name: "Grind", what: "Grind to powder in a mortar" },
};

const R = (id, name, f, inp, op, eq, note, extra = {}) => ({ id, name, f, in: inp, op, eq, note, ...extra });
/** The recipes. inp: 1-3 ingredient ids (order does not matter). A product can have more than one recipe. */
export const RECIPES = [
  // ---- lime, plaster, building ----
  R("quicklime", "Quicklime", "CaO", ["calcite"], "heat", "CaCO₃ → CaO + CO₂", "Lime kilns have burned limestone this way for thousands of years. It drives off carbon dioxide."),
  R("dololime", "Dolomitic lime", "CaO + MgO", ["dolomite"], "heat", "CaMg(CO₃)₂ → CaO + MgO + 2CO₂", "Burnt dolomite, used to line steel furnaces."),
  R("slaked", "Slaked lime", "Ca(OH)₂", ["quicklime", "water"], "mix", "CaO + H₂O → Ca(OH)₂", "Adding water to quicklime hisses and gets hot enough to boil water.", { hz: { kind: "burn", what: "It spits and gets very hot. Lime burns skin and eyes." } }),
  R("limewash", "Limewash", "Ca(OH)₂ in water", ["slaked", "water"], "mix", "Ca(OH)₂ + CO₂ (from air) → CaCO₃ + H₂O as it dries", "The white paint of old cottages. As it dries it soaks up CO₂ and turns back into calcite."),
  R("mortar", "Lime mortar", "Ca(OH)₂ + sand", ["slaked", "quartz"], "mix", "Ca(OH)₂ + CO₂ → CaCO₃ + H₂O (slow setting)", "Roman walls were laid in lime mortar. It hardens over months by taking CO₂ from the air."),
  R("plaster", "Plaster of Paris", "CaSO₄·½H₂O", ["gypsum"], "heat", "CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O", "Named after the gypsum quarries of Montmartre in Paris."),
  R("cast", "Plaster cast", "CaSO₄·2H₂O", ["plaster", "water"], "mix", "CaSO₄·½H₂O + 1½H₂O → CaSO₄·2H₂O", "Water turns it back into gypsum, which sets hard in minutes. Doctors used it for broken limbs from the 1850s."),
  // ---- copper ----
  R("cuo", "Copper oxide", "CuO", ["malachite"], "heat", "Cu₂CO₃(OH)₂ → 2CuO + CO₂ + H₂O", "Green malachite turns black as carbon dioxide and water leave."),
  R("cuo", "Copper oxide", "CuO", ["azurite"], "heat", "Cu₃(CO₃)₂(OH)₂ → 3CuO + 2CO₂ + H₂O", "Blue azurite blackens the same way."),
  R("cu", "Copper", "Cu", ["cuo", "charcoal"], "smelt", "2CuO + C → 2Cu + CO₂", "Smelting copper ore with charcoal began around 5000 BCE. Charcoal steals the oxygen."),
  R("cu", "Copper", "Cu", ["copper"], "melt", "Cu (native copper, melted and cast)", "Native copper only needs melting and casting."),
  R("bronze", "Bronze", "Cu + about 12% Sn", ["cu", "sn"], "melt", "alloy: Cu + Sn", "Harder than either metal alone. It gave the Bronze Age its name."),
  R("brass", "Brass", "Cu + Zn", ["cu", "zn"], "melt", "alloy: Cu + Zn", "Golden and easy to work: instruments, buttons and cartridges."),
  R("verdigris", "Verdigris", "Cu(CH₃COO)₂", ["cu", "vinegar"], "mix", "2Cu + 4CH₃COOH + O₂ → 2Cu(CH₃COO)₂ + 2H₂O", "Copper plates hung over vinegar grow this green crust. Painters used it as a green pigment."),
  R("cuno3", "Copper nitrate", "Cu(NO₃)₂", ["cu", "fortis"], "mix", "Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂ + 2H₂O", "The solution turns blue and a brown poisonous gas pours out.", { hz: { kind: "gas", what: "Nitrogen dioxide, a choking brown gas." } }),
  R("bluev", "Blue vitriol", "CuSO₄", ["cuo", "vitriol"], "mix", "CuO + H₂SO₄ → CuSO₄ + H₂O", "Copper sulfate grows beautiful blue crystals. Farmers spray it on vines."),
  R("bordeaux", "Bordeaux mixture", "CuSO₄ + Ca(OH)₂", ["bluev", "slaked"], "mix", "CuSO₄ + Ca(OH)₂ → Cu(OH)₂ + CaSO₄", "Discovered in 1885 in Bordeaux vineyards: the first widely used fungicide."),
  R("greenv", "Green vitriol", "FeSO₄", ["bluev", "fe"], "mix", "Fe + CuSO₄ → FeSO₄ + Cu", "Iron dipped in blue vitriol comes out coated in copper. Alchemists thought iron had turned into copper; really, the metals swap places."),
  // ---- tin, zinc, lead, mercury, antimony ----
  R("sn", "Tin", "Sn", ["cassiterite", "charcoal"], "smelt", "SnO₂ + C → Sn + CO₂", "Cornwall's tin mines supplied the ancient world's bronze makers."),
  R("zno", "Zinc oxide", "ZnO", ["sphalerite"], "heat", "2ZnS + 3O₂ → 2ZnO + 2SO₂", "Roasting zinc ore gives off sulfur dioxide.", { hz: { kind: "gas", what: "Sulfur dioxide, a choking gas." } }),
  R("zn", "Zinc", "Zn", ["zno", "charcoal"], "smelt", "ZnO + C → Zn + CO", "Zinc boils at 907 °C, so it escapes as vapour. Indian smelters at Zawar learned to condense it by the 1100s."),
  R("pbo", "Litharge (lead oxide)", "PbO", ["galena"], "heat", "2PbS + 3O₂ → 2PbO + 2SO₂", "Roasting galena. Litharge was used in glazes and glassmaking.", { hz: { kind: "gas", what: "Sulfur dioxide and lead fumes, both poisonous." } }),
  R("pb", "Lead", "Pb", ["pbo", "charcoal"], "smelt", "2PbO + C → 2Pb + CO₂", "Lead melts at only 327 °C, one of the first metals people smelted."),
  R("minium", "Red lead", "Pb₃O₄", ["pbo", "air"], "heat", "6PbO + O₂ → 2Pb₃O₄", "Bright orange-red. It was painted on iron bridges against rust, and gave 'miniature' paintings their name."),
  R("sugarlead", "Sugar of lead", "Pb(CH₃COO)₂", ["pbo", "vinegar"], "mix", "PbO + 2CH₃COOH → Pb(CH₃COO)₂ + H₂O", "It tastes sweet and is poisonous. Romans sweetened wine with lead-boiled grape syrup, with terrible results.", { hz: { kind: "burn", what: "Lead poisoning: never taste it." } }),
  R("solder", "Solder", "Sn + Pb", ["sn", "pb"], "melt", "alloy: Sn + Pb", "Melts lower than either metal, so it joins pipes and wires. Modern solder is lead-free."),
  R("pewter", "Pewter", "mostly Sn", ["sn", "sb"], "melt", "alloy: about 92% Sn with antimony (and a little copper)", "Pewter plates and tankards. Modern pewter is hardened with antimony and copper, not lead."),
  R("hg", "Mercury", "Hg", ["cinnabar"], "heat", "HgS + O₂ → Hg + SO₂", "Mercury distils out as a silvery vapour and condenses. Miners at Almadén in Spain did this for 2,000 years.", { hz: { kind: "gas", what: "Mercury vapour, which damages the brain and kidneys." } }),
  R("vermilion", "Vermilion", "HgS", ["hg", "sulfur"], "heat", "Hg + S → HgS", "Alchemists made red vermilion by heating mercury with sulfur. To them it proved that metals were made of 'mercury' and 'sulfur'."),
  R("amalgam", "Gold amalgam", "Au + Hg", ["gold", "hg"], "mix", "alloy: Au dissolved in Hg", "Mercury dissolves gold. Heating the amalgam boils off the mercury, an old and still dangerous mining method.", { hz: { kind: "gas", what: "Heating it releases mercury vapour." } }),
  R("sb", "Antimony", "Sb", ["stibnite", "fe"], "smelt", "Sb₂S₃ + 3Fe → 2Sb + 3FeS", "Iron pulls the sulfur out of stibnite. Basil Valentine's 1604 'Triumphal Chariot of Antimony' praised this metal."),
  // ---- iron ----
  R("fe", "Iron", "Fe", ["hematite", "charcoal"], "smelt", "2Fe₂O₃ + 3C → 4Fe + 3CO₂", "The Iron Age began when smiths learned to reach the higher heat needed, around 1200 BCE."),
  R("fe", "Iron", "Fe", ["magnetite", "charcoal"], "smelt", "Fe₃O₄ + 2C → 3Fe + 2CO₂", "Magnetite is the richest iron ore."),
  R("steel", "Steel", "Fe + C", ["fe", "charcoal"], "melt", "alloy: Fe with 0.2-2% C", "A little carbon makes iron much harder. Too much makes it brittle cast iron."),
  R("rouge", "Jeweller's rouge", "Fe₂O₃", ["pyrite"], "heat", "4FeS₂ + 11O₂ → 2Fe₂O₃ + 8SO₂", "Roasted pyrite leaves fine red iron oxide, used to polish glass and gold.", { hz: { kind: "gas", what: "Sulfur dioxide." } }),
  R("rouge", "Jeweller's rouge", "Fe₂O₃", ["siderite", "air"], "heat", "4FeCO₃ + O₂ → 2Fe₂O₃ + 4CO₂", "Siderite turns red as it roasts."),
  R("fes", "Iron sulfide", "FeS", ["fe", "sulfur"], "heat", "Fe + S → FeS", "The classic school demonstration: iron filings and sulfur glow red and fuse."),
  R("greenv", "Green vitriol", "FeSO₄", ["fe", "vitriol"], "mix", "Fe + H₂SO₄ → FeSO₄ + H₂", "Fizzes out hydrogen, leaving pale green crystals.", { hz: { kind: "gas", what: "Hydrogen, which burns explosively." } }),
  R("ink", "Iron gall ink", "Fe tannate", ["greenv", "oakgall"], "mix", "Fe²⁺ + tannins → black iron tannate (darkens in air)", "The ink of the Middle Ages and Leonardo's notebooks. It soaks into parchment and survives water."),
  R("oakgall", "Oak gall extract", "tannic acid", ["oakgall-raw", "water"], "boil", "tannins dissolved from oak galls", "Wasps make oak galls; they are full of tannins."),
  R("vitriol2", "Oil of vitriol (old way)", "H₂SO₄", ["greenv"], "heat", "2FeSO₄·7H₂O → Fe₂O₃ + SO₂ + H₂SO₄ + 13H₂O", "Medieval chemists made sulfuric acid by heating green vitriol, hence 'oil of vitriol'.", { hz: { kind: "gas", what: "Choking acid fumes." } }),
  // ---- salts, acids, alkalis ----
  R("brine", "Brine", "NaCl(aq)", ["halite", "water"], "mix", "NaCl → Na⁺ + Cl⁻ (dissolved)", "Rock salt dissolves easily. Brine springs were mined for salt from prehistory."),
  R("lye", "Caustic soda", "NaOH", ["brine"], "electro", "2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂", "The chlor-alkali process, the base of modern chemical industry since the 1890s.", { hz: { kind: "gas", what: "Chlorine gas, used as a weapon in 1915." } }),
  R("na", "Sodium", "Na", ["halite"], "electro", "2NaCl → 2Na + Cl₂ (molten)", "Davy first isolated sodium in 1807 by electrolysing molten caustic soda. Today molten salt is used.", { hz: { kind: "gas", what: "Chlorine gas, and sodium that bursts into flame in water." } }),
  R("lye", "Caustic soda", "NaOH", ["na", "water"], "mix", "2Na + 2H₂O → 2NaOH + H₂", "Sodium fizzes, melts into a ball and often explodes.", { hz: { kind: "boom", what: "The hydrogen ignites with a bang." } }),
  R("soap", "Soap", "sodium stearate", ["lye", "oil"], "boil", "fat + 3NaOH → 3 soap + glycerol", "Saponification. Castile soap from olive oil was famous across medieval Europe."),
  R("softsoap", "Soft soap", "potassium soap", ["ash", "oil"], "boil", "fat + potash lye → soft potassium soap + glycerol", "Ash and fat made soap for thousands of years before factory lye."),
  R("glauber", "Glauber's salt", "Na₂SO₄", ["halite", "vitriol"], "heat", "2NaCl + H₂SO₄ → Na₂SO₄ + 2HCl", "Johann Glauber made spirit of salt this way in the 1600s and praised the leftover salt as 'sal mirabilis', the wonder salt.", { hz: { kind: "gas", what: "Hydrogen chloride fumes." } }),
  R("k2so4", "Potassium sulfate", "K₂SO₄", ["sylvite", "vitriol"], "heat", "2KCl + H₂SO₄ → K₂SO₄ + 2HCl", "A fertiliser for crops that dislike chloride, such as tobacco and fruit.", { hz: { kind: "gas", what: "Hydrogen chloride fumes." } }),
  R("cacl2", "Calcium chloride", "CaCl₂", ["calcite", "hcl"], "mix", "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂", "It fizzes out carbon dioxide. Calcium chloride melts ice on winter roads."),
  R("caac", "Calcium acetate", "Ca(CH₃COO)₂", ["calcite", "vinegar"], "mix", "CaCO₃ + 2CH₃COOH → Ca(CH₃COO)₂ + H₂O + CO₂", "Vinegar slowly dissolves chalk and eggshell."),
  R("saltpetre", "Saltpetre", "KNO₃", ["ash", "fortis"], "mix", "K₂CO₃ + 2HNO₃ → 2KNO₃ + H₂O + CO₂", "The oxidiser in gunpowder. In the 1600s it was scraped from stable walls and manure heaps."),
  R("gunpowder", "Black powder", "KNO₃ + S + C", ["saltpetre", "sulfur", "charcoal"], "mix", "2KNO₃ + S + 3C → K₂S + N₂ + 3CO₂ (when lit)", "First recorded in China in the 800s by alchemists seeking an elixir of life.", { hz: { kind: "boom", what: "It burns explosively once lit." } }),
  R("regia", "Aqua regia", "HNO₃ + 3HCl", ["fortis", "hcl"], "mix", "HNO₃ + 3HCl → NOCl + Cl₂ + 2H₂O (it fumes)", "'Royal water', the famous acid mix that dissolves gold, known since the 1300s.", { hz: { kind: "gas", what: "Chlorine and nitrosyl chloride fumes." } }),
  R("aucl", "Chloroauric acid", "HAuCl₄", ["gold", "regia"], "mix", "Au + HNO₃ + 4HCl → HAuCl₄ + NO + 2H₂O", "In 1940 George de Hevesy dissolved two Nobel medals in aqua regia to hide them from the Nazis; the gold was recast after the war."),
  R("so2", "Sulfur dioxide", "SO₂", ["sulfur", "air"], "burn", "S + O₂ → SO₂", "Burning brimstone. Romans burned sulfur to fumigate wine jars.", { hz: { kind: "gas", what: "A choking, poisonous gas." } }),
  R("h2so3", "Sulfurous acid", "H₂SO₃", ["so2", "water"], "mix", "SO₂ + H₂O → H₂SO₃", "This is how sulfur smoke makes acid rain."),
  R("h2", "Hydrogen", "H₂", ["zn", "hcl"], "mix", "Zn + 2HCl → ZnCl₂ + H₂", "Henry Cavendish collected 'inflammable air' this way and studied it in 1766.", { hz: { kind: "boom", what: "Hydrogen mixed with air explodes with a squeaky pop or worse." } }),
  R("water2", "Water (made)", "H₂O", ["h2", "air"], "burn", "2H₂ + O₂ → 2H₂O", "Cavendish showed in 1781 that burning hydrogen makes water, so water is not an element."),
  R("hf", "Hydrogen fluoride", "HF", ["fluorite", "vitriol"], "heat", "CaF₂ + H₂SO₄ → CaSO₄ + 2HF", "It etches glass, which is how Carl Scheele found it in 1771. It is one of the most dangerous acids.", { hz: { kind: "gas", what: "HF fumes burn deep through skin and attack bone." } }),
  R("boric", "Boric acid", "H₃BO₃", ["colemanite", "hcl"], "mix", "Ca₂B₆O₁₁ + 4HCl + 7H₂O → 2CaCl₂ + 6H₃BO₃", "Boric acid in methanol burns with the green 'ghost flame'."),
  R("srcl2", "Strontium chloride", "SrCl₂", ["strontianite", "hcl"], "mix", "SrCO₃ + 2HCl → SrCl₂ + H₂O + CO₂", "The red colour in fireworks and road flares."),
  R("bacl2", "Barium chloride", "BaCl₂", ["witherite", "hcl"], "mix", "BaCO₃ + 2HCl → BaCl₂ + H₂O + CO₂", "Barium salts make firework greens. Soluble barium compounds are poisonous."),
  R("h3po4", "Phosphoric acid", "H₃PO₄", ["apatite", "vitriol"], "mix", "Ca₅(PO₄)₃F + 5H₂SO₄ → 3H₃PO₄ + 5CaSO₄ + HF", "The 'wet process' behind most phosphate fertiliser. It is also the tang in cola.", { hz: { kind: "gas", what: "Some hydrogen fluoride escapes." } }),
  R("li2so4", "Lithium sulfate", "Li₂SO₄", ["spodumene", "vitriol"], "heat", "2LiAlSi₂O₆ + H₂SO₄ → Li₂SO₄ + 2HAlSi₂O₆", "The acid-roast process that turns spodumene into battery lithium."),
  R("mno", "Manganese oxide", "MnO", ["rhodochrosite"], "heat", "MnCO₃ → MnO + CO₂", "Pink rhodochrosite turns dark as carbon dioxide leaves."),
  // ---- glass and pigments ----
  R("glass", "Potash glass", "K₂SiO₃ glass", ["quartz", "ash"], "smelt", "K₂CO₃ + SiO₂ → K₂SiO₃ + CO₂", "Medieval 'forest glass' was melted from sand and wood ash, often tinted green by iron."),
  R("cobaltglass", "Blue glass", "glass + CuO", ["glass", "cuo"], "smelt", "copper ions colour the glass", "Copper oxide turns glass blue to turquoise. (Cobalt glass, as used in flame tests, gets its blue from cobalt.)"),
  R("ochre", "Red ochre", "Fe₂O₃ pigment", ["hematite"], "grind", "Fe₂O₃, ground", "People were using red ochre at least 70,000 years ago, and painted caves with it."),
  R("mgreen", "Mountain green", "malachite pigment", ["malachite"], "grind", "Cu₂CO₃(OH)₂, ground", "Ancient Egyptian eye paint and Renaissance green pigment."),
  R("ablue", "Azurite blue", "azurite pigment", ["azurite"], "grind", "Cu₃(CO₃)₂(OH)₂, ground", "A favourite blue of European painters in the 1400s and 1500s, far cheaper than ultramarine."),
  R("vermilion", "Vermilion", "HgS", ["cinnabar"], "grind", "HgS, ground", "Natural vermilion: the red of Roman villas and Chinese lacquer."),
  R("talcum", "Talcum powder", "Mg₃Si₄O₁₀(OH)₂", ["talc"], "grind", "talc, ground", "Soft and slippery, so it reduces rubbing."),
  R("emery", "Emery powder", "Al₂O₃", ["corundum"], "grind", "corundum, ground", "Number 9 on the Mohs scale, so it grinds and polishes almost anything."),
  R("garnetpaper", "Garnet abrasive", "garnet grit", ["garnet"], "grind", "garnet, crushed", "Garnet sandpaper is a woodworker's favourite; garnet grit cuts steel in waterjets."),
  R("pencil", "Pencil lead", "graphite + clay", ["graphite", "water"], "grind", "graphite ground and pressed", "Nicolas-Jacques Conté mixed graphite with clay in 1795, making grades of hardness."),
];
/** Raw things you pick up rather than make. Only oak galls so far: shown on the shelf from the start. */
export const RAW = [{ id: "oakgall-raw", name: "Oak galls", f: "tannins", c: "#8a6a3a" }];
export const PRODUCTS = [...new Map(RECIPES.map((r) => [r.id, { id: r.id, name: r.name, f: r.f }])).values()];
