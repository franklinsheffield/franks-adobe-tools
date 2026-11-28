// How dangerous each element is to handle as the pure element (not its every compound), on a 0-4 scale, with the
// main reason, plus the element's own voice on the Wall of curiosities. Ratings are a plain summary of the usual lab
// safety data (toxicity, fire, radioactivity), not a substitute for a safety sheet.
import { CATS } from "./elements.js";

export const LEVELS = [
  { n: 0, name: "Safe to handle", e: "🟢" }, { n: 1, name: "Low", e: "🟡" }, { n: 2, name: "Handle with care", e: "🟠" },
  { n: 3, name: "Dangerous", e: "🔴" }, { n: 4, name: "Deadly", e: "☠️" },
];

const RAD = "Intensely radioactive: harmful even in tiny amounts.";
const MADE = "Only ever made a few atoms at a time, and fiercely radioactive.";
const RARE = "Mildly toxic; its fine powder can catch fire.";
const GAS = "Harmless to touch, but it can push the oxygen out of a closed room.";
/** symbol -> [level, reason] */
export const DANGER = {
  H: [3, "Highly flammable: mixed with air, a spark makes it explode."], He: [1, GAS], Li: [2, "Reacts with water and burns; corrosive to skin."],
  Be: [4, "Its dust causes a lifelong, sometimes fatal lung disease."], B: [1, "Low toxicity; the fine powder can burn."], C: [0, "Diamond, graphite and soot: safe to handle (just don't breathe soot)."],
  N: [1, GAS + " Liquid nitrogen causes frostbite."], O: [2, "Makes fires burn far fiercer; liquid oxygen can turn grease explosive."],
  F: [4, "Burns almost anything, and is extremely poisonous to breathe."], Ne: [1, GAS], Na: [3, "Bursts into flame or explodes in water; burns skin."],
  Mg: [2, "Burns blindingly hot, and water makes a magnesium fire worse."], Al: [1, "Safe as foil; fine powder can explode as dust."], Si: [0, "Safe as a lump; avoid breathing the fine dust."],
  P: [3, "White phosphorus catches fire in air on its own and is very toxic. (Red phosphorus is much safer.)"], S: [1, "Low toxicity, but it burns to choking sulfur dioxide."],
  Cl: [3, "A choking, poisonous gas: it was used as a weapon in 1915."], Ar: [1, GAS], K: [3, "Catches fire in water with a lilac flame; burns skin."],
  Ca: [1, "Reacts with water to make hydrogen; mildly irritating."], Sc: [1, RARE], Ti: [0, "Safe enough to make hip joints from."], V: [2, "Its dust and oxide are toxic to breathe."],
  Cr: [2, "The metal is safe, but some chromium compounds cause cancer."], Mn: [1, "Safe in small amounts; years of breathing its fumes harms the nerves."],
  Fe: [0, "Safe to handle. Your body holds about 4 grams of it, mostly in your blood."], Co: [2, "Its dust irritates lungs and skin and is a possible carcinogen."],
  Ni: [2, "A common skin allergy; its dust is a carcinogen."], Cu: [0, "Safe to handle; you need a little in your diet."], Zn: [1, "Safe to handle; zinc fumes from welding cause 'metal fume fever'."],
  Ga: [1, "Low toxicity, but it eats into aluminium and stains skin."], Ge: [1, "Low toxicity."], As: [4, "A classic poison: small doses kill."],
  Se: [2, "Toxic in larger amounts, though you need a trace in your diet."], Br: [3, "A fuming liquid that burns skin and poisons the lungs."], Kr: [1, GAS],
  Rb: [3, "Catches fire in air and explodes in water."], Sr: [1, "Reacts with water; the natural metal is not radioactive."], Y: [1, RARE], Zr: [1, "Safe as a lump; the powder burns fiercely."],
  Nb: [0, "Safe to handle; used in body piercings."], Mo: [1, "Low toxicity."], Tc: [3, "Radioactive: every form of it decays."], Ru: [1, "Low toxicity; its oxide is poisonous."],
  Rh: [0, "Unreactive and safe to handle."], Pd: [0, "Safe to handle; used in dental fillings."], Ag: [0, "Safe to handle."],
  Cd: [4, "Highly toxic: it builds up in the kidneys and causes cancer."], In: [1, "Low toxicity; avoid swallowing it."], Sn: [0, "Safe to handle: tin cans."],
  Sb: [2, "Toxic if swallowed or breathed as dust."], Te: [2, "Toxic, and it leaves you with garlic breath for weeks."], I: [2, "Its violet vapour irritates eyes and lungs; it stains and burns skin."],
  Xe: [1, GAS], Cs: [3, "Explodes on contact with water."], Ba: [2, "Reacts with water, and its soluble salts are poisonous."],
  La: [1, RARE], Ce: [2, "Its shavings can ignite on their own: that's how lighter flints spark."], Pr: [1, RARE], Nd: [1, RARE + " Its magnets can pinch fingers hard."],
  Pm: [3, "Radioactive: every form of it decays."], Sm: [1, RARE], Eu: [1, "Reacts quickly with air and water; mildly toxic."], Gd: [1, RARE], Tb: [1, RARE], Dy: [1, RARE],
  Ho: [1, RARE], Er: [1, RARE], Tm: [1, RARE], Yb: [1, RARE], Lu: [1, RARE], Hf: [1, "Safe as a lump; the powder can ignite."], Ta: [0, "So inert it's used in surgical implants."],
  W: [0, "Safe to handle."], Re: [1, "Low toxicity."], Os: [3, "Its fine powder slowly gives off a vapour in air that can damage eyes and lungs."], Ir: [0, "Very unreactive; safe as a lump."],
  Pt: [0, "Safe to handle: jewellery."], Au: [0, "Safe to handle. Edible as gold leaf, even."], Hg: [3, "Its invisible vapour poisons the brain and kidneys."],
  Tl: [4, "One of the most poisonous elements: tasteless, odourless, absorbed through skin."], Pb: [3, "Poisonous; it builds up in the body and harms the brain, especially in children."],
  Bi: [0, "One of the least toxic heavy metals: it's in stomach medicine."], Po: [4, "Fiercely radioactive: a speck swallowed is lethal."], At: [4, RAD], Rn: [3, "A radioactive gas: years of breathing it can cause lung cancer."],
  Fr: [4, RAD], Ra: [4, RAD], Ac: [4, RAD], Th: [2, "Weakly radioactive; dangerous as dust breathed or swallowed."], Pa: [4, RAD + " Also chemically toxic."],
  U: [2, "Weakly radioactive and chemically toxic, like lead."], Np: [3, "Radioactive and toxic."], Pu: [4, RAD + " Breathing its dust is deadly."], Am: [4, RAD + " (A smoke alarm holds a sealed fraction of a microgram.)"],
  Cm: [4, RAD], Bk: [4, RAD], Cf: [4, RAD + " Pours out neutrons."], Es: [4, RAD], Fm: [4, RAD],
};
export function dangerOf(e) { const d = DANGER[e.s] || (e.z >= 101 ? [4, MADE] : [2, "Not enough is known; treat it with care."]); return { ...LEVELS[d[0]], why: d[1] }; }

/** The element introduces itself, in its family's temper. Every trait stated is real for that family. */
const VOICE = {
  alkali: (e) => `Hi! Hi! I'm ${e.name}! I've got one spare electron and I'm DYING to give it away. Keep me out of water.`,
  alkaline: (e) => `I'm ${e.name}. Two electrons to give, and I give them away calmly. Mostly.`,
  transition: (e) => `I'm ${e.name}, a transition metal. I can lose different numbers of electrons to suit the company.`,
  post: (e) => `I'm ${e.name}. A softer metal, living right next to the staircase.`,
  metalloid: (e) => `I'm ${e.name}: part metal, part not. I keep my options open.`,
  nonmetal: (e) => `I'm ${e.name}. I'd rather share my electrons than hand them over.`,
  halogen: (e) => `I'm ${e.name}. One electron short of a full shell... you don't have a spare? I'll just take it.`,
  noble: (e) => `${e.name}. My shell is full. I need nothing and nobody. You may go.`,
  lanthanide: (e) => `I'm ${e.name}, a lanthanide. They call my family the 'rare earths', but most of us aren't really rare.`,
  actinide: (e) => `I'm ${e.name}. I'm radioactive: slowly, I'm turning into other elements.`,
  superheavy: (e) => `I'm ${e.name}! Somebody made me a few atoms at a time, and I don't last long. Quick, look!`,
};
const SPECIAL = {
  H: "I'm hydrogen, the first and simplest: one proton, one electron. Most of the universe is me.",
  He: "Helium. Full shell, no friends needed. I make your voice squeaky, which I find beneath me.",
  C: "I'm carbon. I bond with almost anything, including myself. Every living thing is built on me.",
  Au: "I'm gold. I don't rust, I don't tarnish, I don't care. People have fought wars over me.",
  Hg: "I'm mercury, the only metal that's liquid at room temperature. Look, don't touch, don't breathe.",
  Fe: "I'm iron. I'm in your blood, in the Earth's core, and in every bridge. Rust is just me getting tired.",
  U: "I'm uranium. Heavy, slow, radioactive. Split me and I give off a great deal of energy.",
  Og: "I'm oganesson, the heaviest element anyone has made. Only a handful of my atoms have ever existed.",
};
export const elementVoice = (e) => SPECIAL[e.s] || (VOICE[e.z >= 104 ? "superheavy" : e.cat] || VOICE.transition)(e);
export const familyName = (e) => CATS[e.cat].name.replace(/ \(.*/, "");
