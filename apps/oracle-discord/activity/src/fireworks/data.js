// Fireworks Workshop content: real colourants, oxidisers, chlorine donors, tail compositions and shell patterns.
// A shell's stars are coloured by metal salts; the colour comes from atoms and small molecules glowing in the flame
// (the same physics as the Flame Test Lab). Facts here are real; the shell sizes and timings are typical, rounded.
export const COLOURS = {
  red: { name: "red", hex: "#ff3344" }, orange: { name: "orange", hex: "#ff8c2a" }, yellow: { name: "yellow", hex: "#ffd84a" },
  green: { name: "green", hex: "#5cff7a" }, blue: { name: "blue", hex: "#4a86ff" }, purple: { name: "purple", hex: "#c063ff" }, white: { name: "white", hex: "#ffffff" },
};
export const COLOURANTS = [
  { id: "sr", name: "Strontium carbonate", f: "SrCO₃", colour: "red", note: "Strontium burns red: the light comes mostly from strontium monochloride (SrCl) and SrOH molecules glowing in the flame." },
  { id: "ca", name: "Calcium carbonate", f: "CaCO₃", colour: "orange", note: "Calcium gives orange, from CaCl and CaOH in the flame. It is the colour of chalk in a Bunsen flame." },
  { id: "na", name: "Sodium oxalate", f: "Na₂C₂O₄", colour: "yellow", note: "Sodium's yellow line (589 nm) is so strong that a trace spoils other colours, so makers keep sodium out of reds, greens and blues." },
  { id: "ba", name: "Barium nitrate", f: "Ba(NO₃)₂", colour: "green", note: "Barium gives green from barium monochloride (BaCl). Barium nitrate is a colourant and an oxidiser at once." },
  { id: "cu", name: "Copper(II) oxide", f: "CuO", colour: "blue", needsCl: true, note: "Blue is the hardest colour: it comes from copper(I) chloride (CuCl), which falls apart if the star burns too hot, so it needs a chlorine donor." },
  { id: "srcu", name: "Strontium + copper", f: "SrCO₃ + CuO", colour: "purple", needsCl: true, note: "Purple is red and blue at once: strontium for the red, copper for the blue, and a chlorine donor for both." },
  { id: "mg", name: "Magnalium", f: "Mg/Al", colour: "white", note: "Magnalium, an alloy of magnesium and aluminium, burns with a brilliant white light." },
];
export const OXIDISERS = [
  { id: "kclo4", name: "Potassium perchlorate", f: "KClO₄", note: "The modern oxidiser for colour stars. Bright colours only became possible after Berthollet found potassium chlorate in 1786; safer perchlorate replaced it." },
  { id: "kno3", name: "Saltpetre", f: "KNO₃", note: "The oxidiser in black powder, used for the lift and burst charges. Colour stars made with it burn dull and washed out." },
];
export const DONOR = { id: "pvc", name: "Chlorine donor (parlon or PVC)", note: "Chlorine donors feed chlorine into the flame so metal monochlorides form. They are essential for blue and purple and deepen reds and greens." };
export const TAILS = [
  { id: "none", name: "No tail", effect: "peony", note: "A peony is the plain ball of coloured stars with no trails: the commonest shell of all." },
  { id: "c", name: "Charcoal", effect: "willow", hex: "#ffb04a", note: "Charcoal-rich stars burn slowly and leave long, drooping gold tails: the willow." },
  { id: "ti", name: "Titanium flakes", effect: "chrysanthemum", hex: "#eef4ff", note: "Titanium flakes throw bright silver-white sparks, giving a chrysanthemum its sparkling trails." },
];
export const PATTERNS = [
  { id: "sphere", name: "Sphere", note: "Stars packed all around the burst charge make a round burst." },
  { id: "ring", name: "Ring", note: "Stars laid in a single ring inside the shell burst into a ring. Side-on it looks like a halo." },
];
// Shell sizes: rule of thumb, a shell climbs about 100 feet (30 m) per inch of diameter; the time fuse is cut so it bursts at the top.
export const SIZES = [
  { id: 3, name: "3-inch shell", m: 90, rise: 3, note: "A 3-inch shell bursts about 90 m up, roughly 3 seconds after it leaves the mortar." },
  { id: 4, name: "4-inch shell", m: 120, rise: 3.5, note: "A 4-inch shell bursts about 120 m up, roughly 3.5 seconds after launch." },
  { id: 6, name: "6-inch shell", m: 180, rise: 4.5, note: "A 6-inch shell bursts about 180 m up, roughly 4.5 seconds after launch." },
];
export const LEVELS = [
  { n: 1, name: "One colour", sub: "Match a target colour: the right salt, the right oxidiser", mult: 1 },
  { n: 2, name: "Two-stage shells", sub: "Stars that change colour, with tails and patterns", mult: 1.5 },
  { n: 3, name: "The show", sub: "Build four shells, then light each one in time with the music", mult: 2 },
];
export const ROUND = 5, TRIES = 3, CUES = 4;
export const colourant = (id) => COLOURANTS.find((c) => c.id === id);
export const agentFor = (colour) => COLOURANTS.find((c) => c.colour === colour);
export const tail = (id) => TAILS.find((t) => t.id === id) || TAILS[0];
export const size = (id) => SIZES.find((s) => s.id === +id) || SIZES[0];
export const HISTORY = [
  "Fireworks began in China: gunpowder in bamboo tubes, with written recipes by the 1000s.",
  "Handel wrote his Music for the Royal Fireworks for a display in London's Green Park in 1749.",
  "Until the 1800s fireworks were mostly gold and white sparks; strong colours came with chlorate and metal salts.",
  "A shell has a lift charge under it, a time fuse, and a burst charge in the middle that throws the stars.",
];
