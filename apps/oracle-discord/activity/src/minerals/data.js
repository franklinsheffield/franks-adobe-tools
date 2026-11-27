// The Mineral Cabinet's specimens: 40 real minerals with the properties a field geologist tests.
// hard: Mohs hardness (typical value); streak: powder colour on unglazed porcelain; sg: specific gravity (density);
// fizz: reaction to cold dilute hydrochloric acid ("yes", "powder" = only when powdered or warmed, "no");
// mag: "yes" | "weak" | "no"; flame: a Flame Test Lab sample id (li na k ca sr ba cu b), "pb" (pale blue, lead and
// antimony) or null (no useful colour); uv: fluorescence under a UV lamp (only where it is typical).
// c: [body colour, shade] for drawing; el: elements that light on the periodic table.
const M = (id, name, f, cls, hard, streak, lustre, c, sg, fizz, mag, flame, el, fact, extra = {}) => ({ id, name, f, cls, hard, streak, lustre, c, sg, fizz, mag, flame, el, fact, ...extra });

export const CLASSES = [["native", "Native elements"], ["sulfide", "Sulfides"], ["oxide", "Oxides"], ["halide", "Halides"], ["carbonate", "Carbonates"], ["sulfate", "Sulfates"], ["borate", "Borates"], ["phosphate", "Phosphates"], ["silicate", "Silicates"]];

export const MINERALS = [
  // ---- Level 1: common rocks ----
  M("quartz", "Quartz", "SiO₂", "silicate", 7, "white", "vitreous", ["#eef2f5", "#b9c3cc"], 2.65, "no", "no", null, ["Si", "O"], "The second most common mineral in Earth's crust. Quartz crystals squeezed make a voltage, which keeps quartz watches on time."),
  M("calcite", "Calcite", "CaCO₃", "carbonate", 3, "white", "vitreous", ["#f6efe0", "#cdbf9f"], 2.71, "yes", "no", "ca", ["Ca", "C", "O"], "A clear calcite crystal shows everything behind it twice (double refraction). Limestone, marble and chalk are mostly calcite.", { uv: "often red or pink" }),
  M("halite", "Halite", "NaCl", "halide", 2.5, "white", "vitreous", ["#f4f0ea", "#c9c0b4"], 2.17, "no", "no", "na", ["Na", "Cl"], "Rock salt. It forms perfect cubes because sodium and chloride ions stack in a cubic grid."),
  M("gypsum", "Gypsum", "CaSO₄·2H₂O", "sulfate", 2, "white", "pearly", ["#f2ede4", "#cfc5b5"], 2.32, "no", "no", "ca", ["Ca", "S", "O", "H"], "Soft enough to scratch with a fingernail. Heated, it loses water and becomes plaster of Paris."),
  M("galena", "Galena", "PbS", "sulfide", 2.5, "lead grey", "metallic", ["#9aa1a8", "#4c5259"], 7.5, "no", "no", "pb", ["Pb", "S"], "The main ore of lead. It feels startlingly heavy and breaks into little cubes."),
  M("pyrite", "Pyrite", "FeS₂", "sulfide", 6.25, "greenish black", "metallic", ["#e6cf74", "#9a8232"], 5.0, "no", "no", null, ["Fe", "S"], "'Fool's gold'. Real gold is soft with a yellow streak; pyrite is hard with a greenish-black streak."),
  M("magnetite", "Magnetite", "Fe₃O₄", "oxide", 6, "black", "metallic", ["#3a3c40", "#16171a"], 5.18, "no", "yes", null, ["Fe", "O"], "The most magnetic natural mineral. Natural lodestones of magnetite were the first compass needles."),
  M("hematite", "Hematite", "Fe₂O₃", "oxide", 6, "red-brown", "metallic", ["#55443f", "#2a1f1c"], 5.26, "no", "no", null, ["Fe", "O"], "Often black and shiny, yet its streak is always red-brown. Ground hematite is red ochre, used in cave paintings."),
  M("malachite", "Malachite", "Cu₂CO₃(OH)₂", "carbonate", 3.75, "light green", "silky", ["#2fa86a", "#0d5c36"], 4.0, "yes", "no", "cu", ["Cu", "C", "O", "H"], "Banded green copper ore, ground for green paint since ancient Egypt. Heating it drives off CO₂ and water, leaving copper oxide."),
  M("sulfur", "Sulfur", "S", "native", 2, "pale yellow", "resinous", ["#f2d83a", "#b89a10"], 2.07, "no", "no", "s", ["S"], "The biblical 'brimstone'. It melts easily and burns with a blue flame, making choking sulfur dioxide."),
  M("graphite", "Graphite", "C", "native", 1.5, "black", "metallic", ["#55585c", "#25272a"], 2.2, "no", "no", null, ["C"], "Pure carbon, like diamond, but in soft sheets that slide. Pencil 'lead' is graphite mixed with clay."),
  M("talc", "Talc", "Mg₃Si₄O₁₀(OH)₂", "silicate", 1, "white", "pearly", ["#e8efe6", "#b6c4b2"], 2.75, "no", "no", null, ["Mg", "Si", "O", "H"], "The softest mineral, number 1 on the Mohs scale. It feels soapy, and talcum powder is made from it."),
  // ---- Level 2: ores ----
  M("copper", "Native copper", "Cu", "native", 2.75, "copper red", "metallic", ["#c8743a", "#7a3a14"], 8.9, "no", "no", "cu", ["Cu"], "Copper found as metal. Around Lake Superior people worked native copper into tools over 6,000 years ago."),
  M("gold", "Gold", "Au", "native", 2.75, "golden yellow", "metallic", ["#f4c84a", "#a77a12"], 19.3, "no", "no", null, ["Au"], "So dense that panners wash it out of sand by its weight. It never tarnishes, which is why ancient gold still shines."),
  M("chalcopyrite", "Chalcopyrite", "CuFeS₂", "sulfide", 3.75, "greenish black", "metallic", ["#d9b84a", "#7d6418"], 4.2, "no", "no", "cu", ["Cu", "Fe", "S"], "The world's main copper ore. Brassier and softer than pyrite: a steel knife scratches it."),
  M("azurite", "Azurite", "Cu₃(CO₃)₂(OH)₂", "carbonate", 3.75, "light blue", "vitreous", ["#2350c8", "#0d2470"], 3.77, "yes", "no", "cu", ["Cu", "C", "O", "H"], "Deep blue copper carbonate, used as blue paint in medieval art. Over time it can turn into green malachite."),
  M("cinnabar", "Cinnabar", "HgS", "sulfide", 2.25, "scarlet", "adamantine", ["#c8281e", "#6a0e0a"], 8.1, "no", "no", null, ["Hg", "S"], "The ore of mercury, ground for the red pigment vermilion. Heating it releases poisonous mercury vapour."),
  M("sphalerite", "Sphalerite", "ZnS", "sulfide", 3.75, "pale yellow-brown", "resinous", ["#7a4a1e", "#3a1f08"], 4.1, "no", "no", null, ["Zn", "S"], "The main ore of zinc. Indium was discovered in 1863 in sphalerite from Freiberg, by its indigo spectral line."),
  M("cassiterite", "Cassiterite", "SnO₂", "oxide", 6.5, "white to pale brown", "adamantine", ["#4a3428", "#1e130c"], 6.99, "no", "no", null, ["Sn", "O"], "The ore of tin. Smelting it with copper gave bronze, which named the Bronze Age."),
  M("siderite", "Siderite", "FeCO₃", "carbonate", 4, "white", "vitreous", ["#9a7a52", "#5a4024"], 3.96, "powder", "no", null, ["Fe", "C", "O"], "An iron carbonate ore. It fizzes only in warm acid, unlike calcite."),
  M("chromite", "Chromite", "FeCr₂O₄", "oxide", 5.5, "brown", "metallic", ["#2e2a28", "#121010"], 4.6, "no", "weak", null, ["Fe", "Cr", "O"], "The only ore of chromium, the metal that makes stainless steel stainless."),
  M("stibnite", "Stibnite", "Sb₂S₃", "sulfide", 2, "lead grey", "metallic", ["#a2a8b0", "#50565e"], 4.6, "no", "no", "pb", ["Sb", "S"], "Long silver needles of antimony sulfide. Ancient Egyptians used it as black kohl eyeliner."),
  M("barite", "Barite", "BaSO₄", "sulfate", 3.25, "white", "vitreous", ["#e9e2d4", "#b8a98e"], 4.5, "no", "no", "ba", ["Ba", "S", "O"], "Surprisingly heavy for a pale mineral. Barium sulfate is the 'barium meal' that shows the gut on X-rays."),
  M("celestine", "Celestine", "SrSO₄", "sulfate", 3.25, "white", "vitreous", ["#bcd6f0", "#7a9cc0"], 3.97, "no", "no", "sr", ["Sr", "S", "O"], "Often sky blue, hence the name. It is the main source of strontium for red fireworks."),
  M("witherite", "Witherite", "BaCO₃", "carbonate", 3.25, "white", "vitreous", ["#efe8d8", "#c0b394"], 4.3, "yes", "no", "ba", ["Ba", "C", "O"], "A barium carbonate named after William Withering, the doctor who described the heart drug digitalis."),
  M("strontianite", "Strontianite", "SrCO₃", "carbonate", 3.5, "white", "vitreous", ["#e6efd8", "#b4c49a"], 3.76, "yes", "no", "sr", ["Sr", "C", "O"], "Found at Strontian in Scotland, where strontium got its name in 1790."),
  // ---- Level 3: the collector's cabinet ----
  M("fluorite", "Fluorite", "CaF₂", "halide", 4, "white", "vitreous", ["#8a5ad0", "#3e1e7a"], 3.18, "no", "no", "ca", ["Ca", "F"], "Fluorescence is named after fluorite, which glows blue-violet under UV light. With strong acid it gives hydrogen fluoride, which etches glass.", { uv: "blue-violet" }),
  M("sylvite", "Sylvite", "KCl", "halide", 2, "white", "vitreous", ["#f2e4e0", "#c8b0aa"], 1.99, "no", "no", "k", ["K", "Cl"], "Potassium chloride, mined for fertiliser. It looks like halite, but its flame is lilac, not yellow."),
  M("lepidolite", "Lepidolite", "K(Li,Al)₃(Al,Si)₄O₁₀(F,OH)₂", "silicate", 2.75, "white", "pearly", ["#b78ab8", "#6a3e6c"], 2.84, "no", "no", "li", ["K", "Li", "Al", "Si", "O", "F"], "A lilac mica rich in lithium. Bunsen and Kirchhoff discovered rubidium in lepidolite in 1861."),
  M("spodumene", "Spodumene", "LiAlSi₂O₆", "silicate", 6.75, "white", "vitreous", ["#e6d4dc", "#b09aa6"], 3.15, "no", "no", "li", ["Li", "Al", "Si", "O"], "A major lithium ore for batteries. Single crystals can grow over 10 metres long."),
  M("colemanite", "Colemanite", "Ca₂B₆O₁₁·5H₂O", "borate", 4.5, "white", "vitreous", ["#f2f2ee", "#c2c2b8"], 2.42, "no", "no", "b", ["Ca", "B", "O", "H"], "A borate from Death Valley's old borax mines. Its boron turns a flame green."),
  M("dolomite", "Dolomite", "CaMg(CO₃)₂", "carbonate", 3.75, "white", "pearly", ["#efe2d6", "#c4ad98"], 2.85, "powder", "no", "ca", ["Ca", "Mg", "C", "O"], "Looks like calcite but fizzes only when powdered. The Dolomite mountains in Italy are built from it."),
  M("corundum", "Corundum", "Al₂O₃", "oxide", 9, "none (harder than the plate)", "adamantine", ["#7a8ab0", "#3a4670"], 4.0, "no", "no", null, ["Al", "O"], "Number 9 on the Mohs scale. Red corundum is ruby; every other colour is sapphire."),
  M("orthoclase", "Orthoclase", "KAlSi₃O₈", "silicate", 6, "white", "vitreous", ["#f0c8a8", "#c08a62"], 2.56, "no", "no", null, ["K", "Al", "Si", "O"], "A feldspar, number 6 on the Mohs scale. Its pink crystals colour much granite."),
  M("muscovite", "Muscovite", "KAl₂(AlSi₃O₁₀)(OH)₂", "silicate", 2.25, "white", "pearly", ["#d8d0b8", "#a0967a"], 2.82, "no", "no", null, ["K", "Al", "Si", "O", "H"], "A mica that peels into clear sheets, once used as window glass in Russian houses ('Muscovy glass')."),
  M("olivine", "Olivine", "(Mg,Fe)₂SiO₄", "silicate", 6.75, "white", "vitreous", ["#8ab83a", "#4a6a12"], 3.3, "no", "no", null, ["Mg", "Fe", "Si", "O"], "Olive-green and common in Earth's mantle. Gem olivine is peridot; Hawaii has green olivine beaches."),
  M("garnet", "Garnet (almandine)", "Fe₃Al₂(SiO₄)₃", "silicate", 7.25, "white", "vitreous", ["#8a1e2a", "#3e0a10"], 4.3, "no", "no", null, ["Fe", "Al", "Si", "O"], "Deep red crystals with 12 or 24 faces. Garnet sand is used to cut steel with water jets."),
  M("topaz", "Topaz", "Al₂SiO₄(F,OH)₂", "silicate", 8, "white", "vitreous", ["#f2c87a", "#b07e2a"], 3.55, "no", "no", null, ["Al", "Si", "O", "F", "H"], "Number 8 on the Mohs scale, harder than quartz. Pure topaz is colourless; traces of other elements tint it."),
  M("apatite", "Apatite", "Ca₅(PO₄)₃(F,Cl,OH)", "phosphate", 5, "white", "vitreous", ["#4ab0a0", "#1a6a5e"], 3.2, "no", "no", "ca", ["Ca", "P", "O", "F"], "Number 5 on the Mohs scale. Your teeth and bones are made of a kind of apatite."),
  M("rhodochrosite", "Rhodochrosite", "MnCO₃", "carbonate", 3.75, "white", "vitreous", ["#e07a8a", "#9a3a4c"], 3.7, "powder", "no", null, ["Mn", "C", "O"], "Raspberry-pink manganese carbonate. It fizzes only in warm acid."),
];
export const mineral = (id) => MINERALS.find((m) => m.id === id);

export const LEVELS = [
  { n: 1, name: "Common rocks", what: "Rocks you could find on a walk", mult: 1, pool: MINERALS.slice(0, 12).map((m) => m.id), tests: ["scratch", "streak", "magnet", "acid", "heft", "flame"] },
  { n: 2, name: "Ores", what: "The rocks metals come from", mult: 1.5, pool: MINERALS.slice(12, 26).map((m) => m.id), tests: ["scratch", "streak", "magnet", "acid", "heft", "flame"] },
  { n: 3, name: "The collector's cabinet", what: "Look-alikes, gems and rare finds", mult: 2, pool: MINERALS.slice(26).map((m) => m.id), tests: ["scratch", "streak", "magnet", "acid", "heft", "flame", "scope", "uv"] },
];

/** Scratch tools on the Mohs scale (standard field values). */
export const TOOLS = [["nail", "Fingernail", 2.5], ["coin", "Copper coin", 3.5], ["knife", "Steel knife", 5.5], ["quartz", "Quartz point", 7]];
export const TESTS = {
  scratch: { emoji: "🪛", name: "Scratch test", what: "Scratch it with a fingernail, a copper coin, a steel knife and a quartz point" },
  streak: { emoji: "⬜", name: "Streak plate", what: "Rub it on unglazed porcelain to see the colour of its powder" },
  magnet: { emoji: "🧲", name: "Magnet", what: "Does a magnet stick to it?" },
  acid: { emoji: "💧", name: "Acid drop", what: "A drop of cold dilute hydrochloric acid: carbonates fizz out carbon dioxide" },
  heft: { emoji: "⚖️", name: "Heft and weigh", what: "Weigh it in air and in water to get its density" },
  flame: { emoji: "🔥", name: "Flame test", what: "A crumb on the wire loop, dipped in acid and held in the burner" },
  scope: { emoji: "🔭", name: "Spectroscope", what: "Split the flame's light into lines" },
  uv: { emoji: "🟣", name: "UV lamp", what: "Shine ultraviolet light on it in the dark" },
};
export const LUSTRE = { metallic: "metallic (shiny like metal)", vitreous: "vitreous (glassy)", pearly: "pearly", resinous: "resinous (like resin)", adamantine: "adamantine (brilliant, like diamond)", silky: "silky", greasy: "greasy", earthy: "earthy (dull)" };

/** What one test shows for a mineral, as words. The flame test returns the colour name from Flame Test Lab's data. */
export function testResult(m, key, flameName = (id) => id) {
  switch (key) {
    case "scratch": return TOOLS.map(([, name, h]) => `${name} (${h}): ${h > m.hard + 0.25 ? "scratches it" : h < m.hard - 0.25 ? "no mark, it is harder" : "only just marks it"}`).join(" · ") + ` → hardness about ${m.hard}`;
    case "streak": return `The streak is ${m.streak}.`;
    case "magnet": return m.mag === "yes" ? "The magnet snaps onto it!" : m.mag === "weak" ? "A faint pull: weakly magnetic." : "Nothing. Not magnetic.";
    case "acid": return m.fizz === "yes" ? "It fizzes at once: bubbles of carbon dioxide. A carbonate." : m.fizz === "powder" ? "No fizz on the surface, but the powder fizzes slowly. A carbonate that resists cold acid." : "No reaction.";
    case "heft": return `Density ${m.sg} g/cm³ (${m.sg >= 7 ? "very heavy for its size" : m.sg >= 4 ? "heavy for its size" : m.sg < 2.4 ? "light for its size" : "about average for a rock"}; quartz is 2.65).`;
    case "flame": return m.flame === "pb" ? "A pale, washed-out blue flame." : m.flame === "s" ? "It melts and burns with a small blue flame, giving a choking smell of sulfur dioxide." : m.flame ? `The flame turns ${flameName(m.flame)}.` : "No useful colour: the flame stays pale blue.";
    case "scope": return m.flame && m.flame.length <= 2 && m.flame !== "pb" ? "The lines match a Flame Test Lab element." : "No clear lines.";
    case "uv": return m.uv ? `It glows ${m.uv}!` : "It stays dark.";
  }
  return "";
}
