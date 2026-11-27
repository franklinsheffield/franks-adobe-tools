// Lead into Gold: real nuclear physics. Decay chains are the three natural series; half-lives are rounded.
// Level 3 rounds are real routes and real experiments that turned other elements into gold.
export const EL = { 78: ["Pt", "platinum"], 79: ["Au", "gold"], 80: ["Hg", "mercury"], 81: ["Tl", "thallium"], 82: ["Pb", "lead"], 83: ["Bi", "bismuth"], 84: ["Po", "polonium"], 85: ["At", "astatine"],
  86: ["Rn", "radon"], 87: ["Fr", "francium"], 88: ["Ra", "radium"], 89: ["Ac", "actinium"], 90: ["Th", "thorium"], 91: ["Pa", "protactinium"], 92: ["U", "uranium"], 93: ["Np", "neptunium"], 94: ["Pu", "plutonium"] };
/** [Z, A, decay ("a" alpha, "b" beta, null stable), half-life] for the three natural decay series, in order. */
export const CHAINS = [
  { id: "u238", name: "Uranium series", start: "U-238", end: "Pb-206", note: "Uranium-238's half-life, about 4.5 billion years, is close to the age of the Earth, so about half the uranium-238 the Earth was born with is still here.",
    steps: [[92, 238, "a", "4.5 billion years"], [90, 234, "b", "24 days"], [91, 234, "b", "about a minute"], [92, 234, "a", "245,000 years"], [90, 230, "a", "75,000 years"], [88, 226, "a", "1,600 years"], [86, 222, "a", "3.8 days"], [84, 218, "a", "3.1 minutes"], [82, 214, "b", "27 minutes"], [83, 214, "b", "20 minutes"], [84, 214, "a", "164 microseconds"], [82, 210, "b", "22 years"], [83, 210, "b", "5 days"], [84, 210, "a", "138 days"], [82, 206, null, "stable"]] },
  { id: "th232", name: "Thorium series", start: "Th-232", end: "Pb-208", note: "Thorium-232 has a half-life of about 14 billion years, longer than the age of the universe. Its end point, lead-208, is 'doubly magic': its protons and neutrons both fill complete shells.",
    steps: [[90, 232, "a", "14 billion years"], [88, 228, "b", "5.8 years"], [89, 228, "b", "6.1 hours"], [90, 228, "a", "1.9 years"], [88, 224, "a", "3.6 days"], [86, 220, "a", "56 seconds"], [84, 216, "a", "0.15 seconds"], [82, 212, "b", "10.6 hours"], [83, 212, "b", "61 minutes (64% beta; the rest alpha)"], [84, 212, "a", "0.3 microseconds"], [82, 208, null, "stable"]] },
  { id: "u235", name: "Actinium series", start: "U-235", end: "Pb-207", note: "Uranium-235 is the isotope that fuels nuclear reactors. It makes up only about 0.7% of natural uranium.",
    steps: [[92, 235, "a", "704 million years"], [90, 231, "b", "25.5 hours"], [91, 231, "a", "32,800 years"], [89, 227, "b", "21.8 years (98.6% beta)"], [90, 227, "a", "18.7 days"], [88, 223, "a", "11.4 days"], [86, 219, "a", "4 seconds"], [84, 215, "a", "1.8 milliseconds"], [82, 211, "b", "36 minutes"], [83, 211, "a", "2.1 minutes (99.7% alpha)"], [81, 207, "b", "4.8 minutes"], [82, 207, null, "stable"]] },
];
/** Level 3: real ways to make gold-197 (79 protons, 118 neutrons), the only stable gold. */
export const GOLD = { z: 79, a: 197 };
export const ROUTES = [
  { id: "hg198", z: 80, a: 198, who: "A one-proton step", note: "Mercury sits one place above gold. Mercury-198 has the same 118 neutrons as gold-197, so losing one proton is all it takes." },
  { id: "hg196", z: 80, a: 196, who: "Mercury in a reactor", note: "Mercury-196 catches a neutron to become mercury-197, which then captures an electron: a proton turns into a neutron and it is gold-197. Physicists first made gold from mercury with neutrons in 1941." },
  { id: "tl205", z: 81, a: 205, who: "From thallium", note: "Thallium is two places above gold. Its heaviest stable isotope, thallium-205, needs two protons and six neutrons knocked out." },
  { id: "pb208", z: 82, a: 208, who: "Lead, at CERN", note: "In 2025 CERN's ALICE experiment reported that near-miss collisions of lead nuclei in the Large Hadron Collider knock three protons out of lead, briefly making gold. Real lead into gold, a few trillionths of a gram." },
  { id: "bi209", z: 83, a: 209, who: "Seaborg, 1980", note: "In 1980 Glenn Seaborg's team at Lawrence Berkeley Laboratory used the Bevalac accelerator to knock protons and neutrons off bismuth nuclei, making a few thousand atoms of gold. It cost far more than the gold was worth." },
];
/** The things a beam or a reactor can do to a nucleus. */
export const MOVES = [
  { id: "p", label: "Knock out a proton", dz: -1, dn: 0, e: "🔴" },
  { id: "n", label: "Knock out a neutron", dz: 0, dn: -1, e: "⚪" },
  { id: "cap", label: "Capture a neutron", dz: 0, dn: 1, e: "➕" },
  { id: "ec", label: "Electron capture (p → n)", dz: -1, dn: 1, e: "🔁" },
  { id: "beta", label: "Beta decay (n → p)", dz: 1, dn: -1, e: "⚡" },
];
export const ROUND = 5, TRIES = 2;
export const LEVELS = [
  { n: 1, name: "Alpha or beta", sub: "What does a nucleus become when it decays?" },
  { n: 2, name: "Walk a decay chain", sub: "Uranium or thorium, step by step, down to lead" },
  { n: 3, name: "Make gold", sub: "Seaborg's beam, CERN's lead, mercury in a reactor" },
];
export const HISTORY = [
  "In 1901 Ernest Rutherford and Frederick Soddy found that thorium was slowly turning into another element on its own: natural transmutation.",
  "In 1919 Rutherford made the first transmutation on purpose, turning nitrogen into oxygen by hitting it with alpha particles.",
  "Marie and Pierre Curie discovered polonium and radium in 1898. Polonium is named after Poland, Marie's homeland.",
  "Every alpha particle is a helium nucleus. Much of the helium mined from natural gas wells was made by alpha decay underground.",
  "The alchemists' dream came true in the 20th century, but making gold in an accelerator costs far more than the gold is worth.",
];
export const sym = (z) => (EL[z] || ["?"])[0];
export const elName = (z) => (EL[z] || ["?", "unknown"])[1];
export const label = (z, a) => `${sym(z)}-${a}`;
export const longName = (z, a) => `${elName(z)}-${a}`;
