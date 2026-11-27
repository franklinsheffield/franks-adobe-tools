// Flame Test Lab content. Every colour, wavelength, date and name here is real chemistry or history.
// Flame colours: the usual school-lab descriptions of a salt (usually the chloride) on a wire loop in a Bunsen flame.
// lines: [wavelength nm, strength 0-1]; bands: [from nm, to nm, strength] for flames whose colour comes from molecules
// (CaOH, SrOH, BaOH, CuCl, BO2) rather than single atoms. Cobalt colours follow Vogel's Qualitative Inorganic Analysis.

/** The 8 samples of Level 1. flame = [core, mid, outer] colours drawn in the burner. */
export const SAMPLES = [
  { id: "li", sym: "Li", name: "Lithium", salt: "lithium chloride", colour: "crimson", flame: ["#ffd6dc", "#ff2d55", "#b0002a"],
    lines: [[670.8, 1], [610.4, 0.25], [460.3, 0.1]], cobalt: "purple", cobaltHex: "#a03cc8",
    fact: "Lithium's crimson comes from one strong red line at 671 nm. Lithium salts make the reds in some flares.",
    use: "Lithium carbonate is a mood-stabilising medicine; lithium metal powers phone batteries." },
  { id: "na", sym: "Na", name: "Sodium", salt: "sodium chloride (table salt)", colour: "bright yellow-orange", flame: ["#ffffff", "#ffd21f", "#ff9800"],
    lines: [[589.0, 1], [589.6, 0.9]], cobalt: "invisible", cobaltHex: null,
    fact: "Sodium's two yellow lines sit at 589.0 and 589.6 nm. A trace of salt from your fingers is enough to turn a flame yellow.",
    use: "Old orange streetlights were sodium-vapour lamps glowing at exactly this colour." },
  { id: "k", sym: "K", name: "Potassium", salt: "potassium chloride", colour: "lilac", flame: ["#f7ecff", "#c58cff", "#7a3fd0"],
    lines: [[766.5, 1], [769.9, 0.9], [404.4, 0.3]], cobalt: "crimson", cobaltHex: "#d21e5a",
    fact: "Potassium's strong lines are deep red (766 and 770 nm) and violet (404 nm); together the eye sees lilac.",
    use: "Potassium nitrate (saltpetre) is the oxidiser in gunpowder." },
  { id: "ca", sym: "Ca", name: "Calcium", salt: "calcium chloride", colour: "orange-red (brick red)", flame: ["#ffe2c4", "#ff7a2a", "#c2380a"],
    lines: [[422.7, 0.4]], bands: [[548, 560, 0.5], [600, 630, 1]], cobalt: "light green", cobaltHex: "#7fe08a",
    fact: "Calcium's brick red is mostly glowing calcium hydroxide molecules (CaOH) in the flame, with a weaker violet atom line at 423 nm.",
    use: "Limelight: theatres heated quicklime (calcium oxide) until it glowed white, lighting stages in the 1800s." },
  { id: "sr", sym: "Sr", name: "Strontium", salt: "strontium chloride", colour: "crimson red", flame: ["#ffd9d2", "#ff2a1a", "#a30d05"],
    lines: [[460.7, 0.35]], bands: [[602, 612, 0.7], [640, 652, 1], [676, 688, 0.8]], cobalt: "purple", cobaltHex: "#8e3aa8",
    fact: "Strontium's red comes from SrOH bands near 606, 646 and 682 nm. It is the red in almost every firework and road flare.",
    use: "Named after Strontian, a village in Scotland where its ore was found in 1790." },
  { id: "ba", sym: "Ba", name: "Barium", salt: "barium chloride", colour: "apple green (yellow-green)", flame: ["#f4ffd8", "#a8e63a", "#4f8a12"],
    lines: [[553.5, 0.6]], bands: [[485, 490, 0.4], [510, 528, 1]], cobalt: "bluish green", cobaltHex: "#3cb8a0",
    fact: "Barium's green comes mostly from BaOH and BaO molecules glowing around 510 to 525 nm.",
    use: "Barium salts make the greens in fireworks. (Soluble barium salts are poisonous, so keep them out of your mouth.)" },
  { id: "cu", sym: "Cu", name: "Copper", salt: "copper(II) chloride", colour: "blue-green", flame: ["#e6fff8", "#2fd6b0", "#0c6a8a"],
    lines: [[510.6, 0.5], [515.3, 0.6], [521.8, 0.7]], bands: [[428, 452, 0.9]], cobalt: "", cobaltHex: null,
    fact: "Copper chloride glows blue (CuCl bands around 430 to 450 nm) and copper atoms add green lines at 511, 515 and 522 nm.",
    use: "Copper compounds make the blues in fireworks, the hardest firework colour to get right." },
  { id: "b", sym: "B", name: "Boron", salt: "boric acid", colour: "bright green", flame: ["#eaffea", "#3cf06a", "#0a8a2a"],
    lines: [], bands: [[469, 473, 0.4], [490, 496, 0.7], [515, 521, 1], [545, 551, 0.8]], cobalt: "", cobaltHex: null,
    fact: "Boron is not a metal, but its flame test is famous: BO₂ molecules give a vivid green with four bright bands.",
    use: "Boric acid dissolved in methanol and lit is the classic green 'ghost flame' demonstration." },
];
export const sample = (id) => SAMPLES.find((s) => s.id === id);

/** Level 2: a dirty wire. Sodium's yellow swamps the flame, and cobalt-blue glass (which absorbs yellow) reveals the hidden metal. */
export const HIDDEN = ["k", "li", "ca", "sr", "ba"];

/** Level 3: read the lines in a spectroscope, like Bunsen and Kirchhoff in Heidelberg from 1859. */
export const SPECTRA = [
  { id: "na-sun", sym: "Na", name: "Sodium", lines: [[589.0, 1], [589.6, 0.9]], who: "Gustav Kirchhoff", when: "Heidelberg, 1859",
    story: "Fraunhofer had seen dark 'D' lines in sunlight in 1814. Kirchhoff shone sunlight through a sodium flame, saw the dark lines deepen, and realised the Sun's atmosphere contains sodium.",
    clue: "Two lines, very close together, in the yellow" },
  { id: "li-3", sym: "Li", name: "Lithium", lines: [[670.8, 1], [610.4, 0.25]], who: "Robert Bunsen", when: "Heidelberg, 1860",
    story: "Bunsen and Kirchhoff found lithium's red line in mineral waters and plant ash where nobody had suspected lithium. A flame could now find milligrams.",
    clue: "One strong deep-red line, one faint orange one" },
  { id: "k-3", sym: "K", name: "Potassium", lines: [[766.5, 1], [769.9, 0.9], [404.4, 0.3]], who: "Gustav Kirchhoff", when: "Heidelberg, 1860",
    story: "Potassium's lines sit at both ends of the visible spectrum, which is why its flame looks lilac and why chemists used a spectroscope to be sure.",
    clue: "A close pair at the very red end, and a faint violet line" },
  { id: "cs", sym: "Cs", name: "Caesium", lines: [[455.5, 1], [459.3, 0.6]], who: "Robert Bunsen and Gustav Kirchhoff", when: "Heidelberg, 1860",
    story: "Boiling down 40 tonnes of Dürkheim mineral water, they saw two blue lines no known element made. They named the new element caesium, from the Latin caesius, 'sky blue'. It was the first element found by spectroscopy.",
    clue: "Two sky-blue lines nobody had seen before" },
  { id: "rb", sym: "Rb", name: "Rubidium", lines: [[780.0, 1], [794.8, 0.8], [420.2, 0.35], [421.6, 0.3]], who: "Robert Bunsen and Gustav Kirchhoff", when: "Heidelberg, 1861",
    story: "In the mineral lepidolite they found deep red lines at the edge of sight and named the element rubidium, from the Latin rubidus, 'deep red'.",
    clue: "Two lines so deep red they are almost invisible, plus a violet pair" },
  { id: "tl", sym: "Tl", name: "Thallium", lines: [[535.0, 1]], who: "William Crookes", when: "London, 1861",
    story: "Crookes saw a single brilliant green line in sludge from a sulfuric acid works and named the element thallium, from the Greek thallos, 'green shoot'.",
    clue: "A single brilliant green line" },
  { id: "in", sym: "In", name: "Indium", lines: [[451.1, 1], [410.2, 0.5]], who: "Ferdinand Reich and Theodor Richter", when: "Freiberg, 1863",
    story: "Looking for thallium in zinc ore, they found an indigo line instead. Reich was colour-blind, so Richter did the looking. They named it indium after the indigo.",
    clue: "A strong indigo line and a weaker violet one" },
  { id: "he", sym: "He", name: "Helium", lines: [[587.6, 1], [667.8, 0.3], [501.6, 0.35], [447.1, 0.4]], who: "Jules Janssen and Norman Lockyer", when: "the 1868 solar eclipse",
    story: "During the 1868 eclipse a yellow line appeared in the Sun's glow at 587.6 nm, close to sodium's but not the same. Lockyer named the unknown element after Helios, the Sun. It was found on Earth only in 1895.",
    clue: "A yellow line close to sodium's pair, but single and a little bluer" },
  { id: "h", sym: "H", name: "Hydrogen", lines: [[656.3, 1], [486.1, 0.6], [434.0, 0.4], [410.2, 0.3]], who: "Anders Ångström", when: "Uppsala, 1862",
    story: "Ångström measured hydrogen's four visible lines, red, cyan, blue and violet, and found them in the Sun. In 1885 Balmer found a simple formula that fits all four.",
    clue: "Four lines: red, cyan, blue and violet, getting closer together" },
];
export const spectrum = (id) => SPECTRA.find((s) => s.id === id);

export const LEVELS = [
  { n: 1, name: "Colours of the flame", what: "Name the element from its flame colour", mult: 1, pool: SAMPLES.map((s) => s.id) },
  { n: 2, name: "The dirty wire", what: "Sodium hides the metal. Use cobalt glass", mult: 1.5, pool: HIDDEN },
  { n: 3, name: "Bunsen's spectroscope", what: "Read the lines, find the element", mult: 2, pool: SPECTRA.map((s) => s.id) },
];
export const ROUND = 5, TRIES = 3, SPEED_SECS = 45;

/** A wavelength (380-780 nm) as an sRGB colour, for drawing spectra. Dan Bruton's well-known approximation. */
export function nmToRgb(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else r = 1;
  const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
  const c = (x) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, x * f)), 0.8)).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}
