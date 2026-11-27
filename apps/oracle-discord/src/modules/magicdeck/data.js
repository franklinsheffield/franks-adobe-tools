// The Science is Magic deck: 44 original oracle cards in four suits of 11 (1 to 10 plus a Keeper).
// Each card pairs a reflection with a real science fact. All text original to Science is Magic.
// Each card: n (name), kw (keywords), up (meaning), fact (true science fact).

export const SUITS = [
  { key: "atoms", n: "Atoms", theme: "body, work and money", col: "#66E0C8" },
  { key: "moons", n: "Moons", theme: "feelings, love and dreams", col: "#c9b8ff" },
  { key: "potions", n: "Potions", theme: "change, risk and experiments", col: "#ff8fc8" },
  { key: "stars", n: "Stars", theme: "ideas, purpose and direction", col: "#FADE8C" },
];

const RAW = {
  atoms: [
    ["The Proton", ["beginning", "solid ground", "potential"], "Something real is starting. Small, but with weight: the kind of thing others get built on.", "A proton is about 1,836 times heavier than an electron."],
    ["The Bond", ["partnership", "sharing", "trust"], "Two sides sharing what they have. Partnerships hold when both give.", "A covalent bond is two atoms sharing a pair of electrons."],
    ["The Crystal", ["structure", "planning", "teamwork"], "Order makes things strong. The card shows structure laid out piece by piece.", "Salt forms cubes because sodium and chloride ions stack in a cubic grid."],
    ["The Element", ["identity", "security", "holding on"], "Knowing what one is made of. The card marks the line between keeping what is one's own and gripping too tight.", "118 elements have been confirmed; about 94 occur naturally on Earth."],
    ["The Isotope", ["same but different", "hardship", "change of weight"], "Still the same self, just heavier for now. The extra weight decays with time.", "Carbon-14 has a half-life of about 5,730 years, which is how ancient bones are dated."],
    ["The Catalyst", ["help", "generosity", "speed"], "Someone or something speeds this up without being used up. The card stands for help on offer.", "Enzymes can speed reactions up millions of times and come out unchanged."],
    ["The Molecule", ["teamwork", "patience", "investment"], "Small parts joined at the right angle. The card is slow building that adds up.", "Water is H₂O: two hydrogens and one oxygen, bent at about 104.5 degrees."],
    ["The Lattice", ["skill", "routine", "practice"], "Repetition makes the pattern strong. Practice, repeated until it becomes structure.", "Diamond and graphite are both pure carbon. Only the arrangement differs."],
    ["The Alloy", ["blend", "reward", "independence"], "A mix stronger than either part. The card stands for something forged and enjoyed.", "Bronze, copper mixed with tin, was strong enough to name an age of history."],
    ["The Mass", ["abundance", "legacy", "stability"], "Solid results that last. The weight here belongs to the one who built it.", "Almost all of an atom's mass sits in a nucleus about 100,000 times smaller than the atom."],
    ["Keeper of Atoms", ["mastery", "practical", "steady"], "Practical mastery. The Keeper leads by doing the work well.", "Marie Curie is the only person to win Nobel Prizes in two different sciences."],
  ],
  moons: [
    ["The New Moon", ["fresh feeling", "intention", "quiet start"], "A feeling not quite visible yet. The card stands for intentions formed in the dark.", "At new moon the Moon sits between Earth and Sun, so its lit side faces away."],
    ["The Tide", ["attraction", "pull", "connection"], "Two things pulling on each other. The card shows being moved by a connection.", "Tides happen because the Moon pulls harder on Earth's near side than its far side."],
    ["The Eclipse", ["hidden", "revealing", "rare moment"], "Something lines up perfectly for a moment. What matters is what the alignment reveals.", "The Sun is about 400 times wider than the Moon and about 400 times farther away, so they look the same size."],
    ["The Orbit", ["comfort", "routine", "loyalty"], "Going round together, steady and known. The card counts comfort as a gift.", "The Moon always shows us the same face because it spins once per orbit."],
    ["The Crater", ["old hurt", "memory", "scar"], "An old impact still shows. It is part of the landscape now, not the weather.", "Moon craters last billions of years because there is no wind or rain to wear them away."],
    ["The Moonbow", ["nostalgia", "gentleness", "kindness"], "A soft, rare kind of beauty. The card treats the past gently.", "Moonbows are rainbows made by moonlight. They look white because our eyes see little colour in dim light."],
    ["The Phase", ["moods", "choices", "daydreams"], "Many shapes, one moon. The card warns that a single phase is not the whole picture.", "The Moon runs through all its phases in about 29.5 days."],
    ["The Drift", ["moving on", "distance", "letting go"], "Slowly, something is moving away. The card treats that as allowed.", "The Moon drifts about 3.8 cm farther from Earth every year."],
    ["The Harvest Moon", ["contentment", "gratitude", "wishes met"], "Enough light to work late and enjoy it. The card stands for counting what is already there.", "The Harvest Moon is the full moon nearest the September equinox; it rises soon after sunset for several nights."],
    ["The Full Moon", ["fulfilment", "love", "home"], "Feelings at full brightness, and light that is shared.", "Even a full moon is about 400,000 times dimmer than the Sun."],
    ["Keeper of Moons", ["empathy", "wisdom", "calm"], "Emotional wisdom. The Keeper listens first and speaks softly.", "Hypatia of Alexandria taught astronomy and mathematics around 400 CE."],
  ],
  potions: [
    ["The Flask", ["new experiment", "curiosity", "try it"], "A clean flask and an idea. The card stands for the experiment not yet run.", "The Erlenmeyer flask's sloped sides let you swirl liquids without spilling. It was designed around 1860."],
    ["The Mixture", ["choice", "balance", "juggling"], "Two things that do not quite blend. The card asks what the mixing is for.", "Oil and water don't mix because water molecules stick to each other more than to oil."],
    ["The Reaction", ["collaboration", "chemistry", "fizz"], "Put the right people together and something happens.", "Baking soda and vinegar fizz because they make carbon dioxide gas."],
    ["The Distillation", ["rest", "purify", "patience"], "Slow heat separates what matters. The card stands for rest that clarifies.", "Distilling separates liquids by boiling point: alcohol boils at about 78 °C, water at 100 °C."],
    ["The Spill", ["setback", "accident", "unexpected"], "Something went sideways. Many discoveries began as accidents, which is the card's point.", "Penicillin was found in 1928 on a mouldy dish Alexander Fleming had left out."],
    ["The Solution", ["recovery", "ease", "things dissolve"], "Problems soften in the right warmth. The card stands for things getting easier.", "Sugar dissolves faster in hot water because its molecules move faster."],
    ["The Hypothesis", ["imagination", "options", "what if"], "Lots of ideas. The card separates the ones that could actually be tested from the rest.", "A good hypothesis is one that could be proven wrong. That's what makes it science."],
    ["The Filter", ["leaving behind", "sorting", "clarity"], "The useful part passes through and the grounds are left behind.", "Coffee filters let dissolved flavour through and hold the grounds back."],
    ["The Elixir", ["wish", "satisfaction", "reward"], "The thing hoped for, in a small bottle. A card of enjoyment.", "Alchemists searching for an elixir of life developed real lab methods like distillation."],
    ["The Explosion", ["overload", "too much", "spectacle"], "Too much at once makes a beautiful mess. The card stands for overload.", "Fireworks get their colours from metals: strontium for red, copper for blue, sodium for yellow."],
    ["Keeper of Potions", ["bold", "inventive", "mastery"], "A master experimenter. The Keeper takes the clever risk, with safety goggles on.", "Photo 51, an X-ray image made in Rosalind Franklin's lab with her student Raymond Gosling, helped reveal DNA's double helix."],
  ],
  stars: [
    ["The Spark of Light", ["inspiration", "idea", "new path"], "A bright idea arrives. Ideas like this one fade quickly unless they are caught.", "Sunlight takes about 8 minutes 20 seconds to reach Earth."],
    ["The Binary", ["two paths", "balance", "decision"], "Two bright options orbiting each other, evenly weighted.", "Many stars come in pairs or groups that orbit each other."],
    ["The Constellation", ["pattern", "teamwork", "big picture"], "Dots connected into a pattern. It is clearer from a step back.", "Stars in a constellation are usually far apart. They only line up from where we stand."],
    ["The Nebula", ["rest", "gestation", "forming"], "Something is forming in the cloud. The card works on long timescales.", "Nebulae are clouds of gas and dust where new stars are born."],
    ["The Black Hole", ["distraction", "drain", "focus lost"], "Something is pulling everything in. The card marks where focus and energy are going.", "Once past a black hole's event horizon, not even light can escape."],
    ["The Comet", ["triumph", "recognition", "visit"], "A bright moment everyone sees. The card stands for the spotlight.", "A comet's tail points away from the Sun, pushed by sunlight and the solar wind."],
    ["The Telescope", ["perspective", "vision", "detail"], "A closer look, or a further one. Change the lens and the picture changes.", "In 1610 Galileo used a telescope to discover four moons circling Jupiter."],
    ["The Meteor", ["speed", "progress", "momentum"], "Fast progress and a bright trail. A card of momentum.", "Most shooting stars are specks of dust no bigger than a grain of sand."],
    ["The North Star", ["direction", "persistence", "true north"], "The one point that does not move, and the eyes fixed on it.", "Polaris barely moves in our sky because it sits almost straight above Earth's north pole."],
    ["The Supernova", ["transformation", "big change", "rebirth"], "A huge ending scatters the stuff of new beginnings.", "The iron in your blood and the calcium in your bones were made inside stars."],
    ["Keeper of Stars", ["visionary", "guide", "curiosity"], "The visionary. The Keeper shows others the way by looking up.", "Henrietta Leavitt found a way to measure distances to far-off stars, revealing how vast the universe is."],
  ],
};

/** All 44 cards: { id, suit, num ("1".."10" or "K"), n, kw, up, fact }. */
export const DECK = SUITS.flatMap((s, si) => RAW[s.key].map(([n, kw, up, fact], i) => ({ id: si * 11 + i, suit: s.key, num: i < 10 ? String(i + 1) : "K", n, kw, up, fact })));

export const SPREADS = {
  one: { name: "One card: a quick experiment", positions: [["The finding", "the heart of it"]] },
  three: { name: "Three cards: hypothesis, test, result", positions: [["Hypothesis", "what you suspect"], ["Test", "what would check it"], ["Result", "what you'll learn"]] },
  five: { name: "Five cards: the lab report", positions: [["Question", "what you're really asking"], ["Hypothesis", "your hunch"], ["Method", "how it is being approached"], ["Result", "what's likely"], ["Conclusion", "the takeaway"]] },
};
