// Constellation Rummy deck: 48 real stars, 4 from each of 12 constellations. Positions, magnitudes and colours come from
// the Star Lore sky data (Hipparcos via d3-celestial); spectral classes are the stars' published main classes (for a
// multiple star, the brightest member). Facts are original text for Science is Magic; name meanings follow the IAU
// Working Group on Star Names and the usual Arabic, Greek and Latin sources.
import { STARS, LINES, CON_NAMES } from "../stars/sky.gen.js";
import { DECK } from "../stars/lore.js";

/** [hip, name, constellation, spectral class, fact] */
const RAW = [
  [27989, "Betelgeuse", "Ori", "M", "A red supergiant at Orion's shoulder. Its Arabic name is usually read as 'hand of the giant'. It dimmed sharply in 2019 and 2020 behind a dust cloud it puffed out."],
  [24436, "Rigel", "Ori", "B", "Orion's foot: rijl is Arabic for 'foot'. A blue-white supergiant roughly 100,000 times as luminous as the Sun."],
  [25336, "Bellatrix", "Ori", "B", "Latin for 'female warrior'. A hot blue giant at Orion's other shoulder."],
  [26311, "Alnilam", "Ori", "B", "The middle star of Orion's Belt. Its Arabic name means 'string of pearls'. A blue supergiant."],
  [54061, "Dubhe", "UMa", "K", "From the Arabic for 'the bear'. With Merak it forms the Pointers: follow them to Polaris."],
  [53910, "Merak", "UMa", "A", "The bear's loins in Arabic. The second Pointer star of the Big Dipper."],
  [62956, "Alioth", "UMa", "A", "The brightest star in Ursa Major, first in the Dipper's handle."],
  [65378, "Mizar", "UMa", "A", "Mizar and faint Alcor make a naked-eye pair. Mizar is often called the first double star seen through a telescope, in 1617."],
  [3179, "Schedar", "Cas", "K", "From the Arabic for 'breast'. An orange giant in Cassiopeia's W."],
  [746, "Caph", "Cas", "F", "From the Arabic for 'hand'. A yellow-white star that spins fast and pulses slightly in brightness."],
  [4427, "Navi", "Cas", "B", "Astronaut Gus Grissom named it: his middle name Ivan, spelled backwards. Apollo crews used it to navigate."],
  [6686, "Ruchbah", "Cas", "A", "Arabic for 'knee'. It is an eclipsing binary: one star passes in front of the other and it dims slightly."],
  [80763, "Antares", "Sco", "M", "'Rival of Ares', the Greek Mars, for its red colour. A red supergiant at the scorpion's heart."],
  [85927, "Shaula", "Sco", "B", "Arabic for 'the raised tail': the scorpion's sting. A hot blue star system."],
  [86228, "Sargas", "Sco", "F", "A name from Sumerian. A yellow-white giant in the scorpion's tail."],
  [78401, "Dschubba", "Sco", "B", "Arabic for 'forehead'. In 2000 it brightened unexpectedly as it threw off a disc of gas."],
  [60718, "Acrux", "Cru", "B", "The foot of the Southern Cross. Its name is a blend of Alpha and Crux. It is several hot blue stars together."],
  [62434, "Mimosa", "Cru", "B", "The second brightest star of the Southern Cross: a hot blue giant."],
  [61084, "Gacrux", "Cru", "M", "The top of the Cross, from Gamma Crucis. The nearest red giant to the Sun, about 88 light-years away."],
  [59747, "Imai", "Cru", "B", "Delta Crucis. Its IAU name comes from the Mursi people of Ethiopia."],
  [102098, "Deneb", "Cyg", "A", "Arabic for 'tail': the swan's tail. A white supergiant, one of the most luminous stars the eye can see."],
  [100453, "Sadr", "Cyg", "F", "Arabic for 'chest'. The centre of the Northern Cross, a yellow-white supergiant."],
  [102488, "Aljanah", "Cyg", "K", "Arabic for 'the wing'. An orange giant in the swan's wing."],
  [95947, "Albireo", "Cyg", "K", "The swan's beak. A small telescope splits it into a gold star and a blue one."],
  [49669, "Regulus", "Leo", "B", "Latin for 'little king'. It spins so fast that it bulges at its equator."],
  [57632, "Denebola", "Leo", "A", "From the Arabic for 'the lion's tail'."],
  [50583, "Algieba", "Leo", "K", "In the lion's mane. A telescope shows two golden giant stars orbiting each other."],
  [54872, "Zosma", "Leo", "A", "From the Greek for 'girdle', on the lion's back."],
  [21421, "Aldebaran", "Tau", "K", "Arabic for 'the follower': it follows the Pleiades across the sky. An orange giant, the bull's eye."],
  [25428, "Elnath", "Tau", "B", "Arabic for 'the butting one', the tip of the bull's horn. A hot blue-white giant."],
  [17702, "Alcyone", "Tau", "B", "The brightest star of the Pleiades, named after one of the Seven Sisters of Greek myth."],
  [20889, "Ain", "Tau", "K", "Arabic for 'eye'. In 2007 it became the first star in an open cluster (the Hyades) known to have a planet."],
  [36850, "Castor", "Gem", "A", "One of the twins. It is really six stars: three pairs orbiting each other."],
  [37826, "Pollux", "Gem", "K", "The other twin: an orange giant, brighter than Castor, with a planet of its own."],
  [31681, "Alhena", "Gem", "A", "From an Arabic word for a brand or mark. A white star at the twins' feet."],
  [30343, "Tejat", "Gem", "M", "A red giant at Castor's foot."],
  [91262, "Vega", "Lyr", "A", "The fifth brightest star of the night. About 14,000 years ago it was the pole star, and it will be again around the year 13,700."],
  [92420, "Sheliak", "Lyr", "B", "Arabic for 'harp'. Two stars so close they swap gas; their light dips every 12.9 days."],
  [93194, "Sulafat", "Lyr", "B", "Arabic for 'tortoise'. In Greek myth Hermes made the first lyre from a tortoise shell."],
  [94481, "Aladfar", "Lyr", "B", "Arabic for 'the talons', from when Lyra was drawn as an eagle or vulture."],
  [32349, "Sirius", "CMa", "A", "The brightest star in the night sky, only 8.6 light-years away. Its name comes from the Greek for 'scorching'."],
  [33579, "Adhara", "CMa", "B", "Arabic for 'the maidens'. Seen from Earth, it is the brightest source of extreme ultraviolet light in the sky."],
  [34444, "Wezen", "CMa", "F", "Arabic for 'weight'. A yellow-white supergiant well over 1,000 light-years away."],
  [30324, "Mirzam", "CMa", "B", "Arabic for 'the herald': it rises just before Sirius."],
  [11767, "Polaris", "UMi", "F", "The North Star, less than a degree from the north celestial pole. It pulses gently: a Cepheid variable."],
  [72607, "Kochab", "UMi", "K", "An orange giant. Around 1000 BCE it was the bright star closest to the north pole."],
  [75097, "Pherkad", "UMi", "A", "With Kochab one of the two 'Guardians of the Pole' that circle Polaris."],
  [85822, "Yildun", "UMi", "A", "From the Turkish word for 'star'. Next to Polaris in the Little Dipper's handle."],
];

/** Each constellation: abbreviation, name, emoji, the lore (cultures) from Star Lore Navigator, and its stick figure. */
export const CONS = {};
const IN_DECK = new Set(RAW.map((r) => r[2]));
for (const g of DECK) if (g.con && IN_DECK.has(g.con)) CONS[g.con] = { con: g.con, name: CON_NAMES[g.con], short: g.name, emoji: g.emoji, science: g.science,
  // each fable: culture, title, parts; t = a short telling (first and last part) for the middle of a game
  lore: g.fables.map((f) => ({ c: f.c, title: f.t, parts: f.parts, t: f.parts.length > 2 ? f.parts[0] + " … " + f.parts[f.parts.length - 1] : f.parts.join(" ") })) };

const star = (hip) => STARS.find((s) => s[4] === hip);
/** The 48 cards: { hip, name, con, cls, fact, ra, de, mag, bv } */
export const CARDS = RAW.map(([hip, name, con, cls, fact]) => { const s = star(hip) || [0, 0, 9, 0, hip, con];
  return { hip, name, con, cls, fact, ra: s[0], de: s[1], mag: s[2], bv: s[3] }; });
export const CARD = Object.fromEntries(CARDS.map((c) => [c.hip, c]));
export const FIGURE = (con) => LINES[con] || [];

/** Spectral classes, hottest to coolest (G, the Sun's class, has no card in this deck). */
export const CLASSES = {
  B: { name: "Blue-white", temp: "10,000 to 30,000 K", colour: "#9bb8ff", fact: "B stars are hot and blue-white. They burn so fast they live only tens to a few hundred million years." },
  A: { name: "White", temp: "7,500 to 10,000 K", colour: "#eef2ff", fact: "A stars are white, like Sirius and Vega. Hydrogen lines are strongest in their light." },
  F: { name: "Yellow-white", temp: "6,000 to 7,500 K", colour: "#fff1c4", fact: "F stars are yellow-white, a little hotter than our Sun, which is a G star." },
  K: { name: "Orange", temp: "3,700 to 5,200 K", colour: "#ffc27a", fact: "K stars are orange. Most bright K stars, like Aldebaran and Pollux, are giants nearing old age." },
  M: { name: "Red", temp: "2,400 to 3,700 K", colour: "#ff7a5c", fact: "M stars are the coolest and reddest. The bright ones are swollen giants and supergiants like Betelgeuse and Antares." },
};
export const CLASS_ORDER = ["B", "A", "F", "K", "M"];

/** Levels: which constellations are in the deck, hand size, colour sets allowed, constellation shown on the cards. */
export const LEVELS = [
  { n: 1, name: "Stargazer", what: "6 constellations · sets of one constellation · names on the cards", cons: ["Ori", "UMa", "Cas", "Sco", "Cyg", "Leo"], hand: 6, colour: false, labels: true, mult: 1, skill: 0.55 },
  { n: 2, name: "Star Hopper", what: "9 constellations · adds colour sets (same star class, all different constellations)", cons: ["Ori", "UMa", "Cas", "Sco", "Cyg", "Leo", "Tau", "Gem", "CMa"], hand: 7, colour: true, labels: true, mult: 1.5, skill: 0.8 },
  { n: 3, name: "Sky Keeper", what: "All 12 constellations · both sets · cards show only the star: you must know where it lives", cons: Object.keys(CONS), hand: 8, colour: true, labels: false, mult: 2, skill: 0.95 },
];
/** Points per card from apparent magnitude: lower magnitude = brighter star = more points. */
export const pts = (hip) => { const m = CARD[hip].mag; return m < 1 ? 3 : m < 2 ? 2 : 1; };
