// The 36-card Lenormand (Petit Lenormand). Card names, numbers and playing-card insets follow the public 19th-century
// tradition (the deck was sold from about 1846 under the name of the fortune teller Marie Anne Lenormand).
// Every line of text here is original to Science is Magic.
// Each card: n (name), pc (playing-card inset: rank + suit h/d/s/c), kw (keywords), noun (what it is in a pair),
// mod (how it colours the card before it), up (meaning), tone (+1 good, 0 neutral, -1 hard).

export const CARDS = [
  { n: "Rider", pc: ["9", "h"], kw: ["news", "arrival", "speed"], noun: "news", mod: "arriving fast", tone: 1, up: "Something is on its way: a message, a visitor, a quick change. Answer promptly." },
  { n: "Clover", pc: ["6", "d"], kw: ["luck", "small chance", "brief"], noun: "a lucky break", mod: "with a bit of luck", tone: 1, up: "A small, short-lived stroke of luck. Grab it before it wilts." },
  { n: "Ship", pc: ["10", "s"], kw: ["travel", "distance", "trade"], noun: "a journey", mod: "from far away", tone: 0, up: "Movement and distance: travel, trade, or a longing for somewhere else. Set a course." },
  { n: "House", pc: ["K", "h"], kw: ["home", "family", "safety"], noun: "home", mod: "close to home", tone: 1, up: "Home, family and the things that keep you safe. Strengthen your base." },
  { n: "Tree", pc: ["7", "h"], kw: ["health", "growth", "roots"], noun: "health", mod: "slowly growing", tone: 0, up: "Health, roots and slow growth. This takes seasons, not days." },
  { n: "Clouds", pc: ["K", "c"], kw: ["confusion", "doubt", "passing"], noun: "uncertainty", mod: "unclear for now", tone: -1, up: "Fog and mixed signals. Wait for the weather to clear before deciding." },
  { n: "Snake", pc: ["Q", "c"], kw: ["detour", "complication", "cunning"], noun: "a complication", mod: "with a twist", tone: -1, up: "The path winds. Expect a detour or someone with an agenda, and stay clever." },
  { n: "Coffin", pc: ["9", "d"], kw: ["ending", "closure", "rest"], noun: "an ending", mod: "coming to a close", tone: -1, up: "Something is finished. Let it close properly so something new can start." },
  { n: "Bouquet", pc: ["Q", "s"], kw: ["gift", "invitation", "charm"], noun: "a gift", mod: "pleasantly", tone: 1, up: "A gift, a compliment or an invitation. Say yes, and say thank you." },
  { n: "Scythe", pc: ["J", "d"], kw: ["cut", "decision", "sudden"], noun: "a sudden decision", mod: "suddenly", tone: -1, up: "A swift cut. Make the clean decision rather than letting it drag." },
  { n: "Whip", pc: ["J", "c"], kw: ["conflict", "repetition", "effort"], noun: "an argument", mod: "again and again", tone: -1, up: "Friction and repeated effort. Turn the argument into practice." },
  { n: "Birds", pc: ["7", "d"], kw: ["chatter", "nerves", "conversation"], noun: "a conversation", mod: "with lots of talk", tone: 0, up: "Chatter, calls and nervous energy. Talk it through, briefly." },
  { n: "Child", pc: ["J", "s"], kw: ["new", "small", "innocent"], noun: "a fresh start", mod: "small and new", tone: 1, up: "Something new and small: a beginning, a young person, a playful idea." },
  { n: "Fox", pc: ["9", "c"], kw: ["work", "caution", "self-interest"], noun: "your job", mod: "not quite as it seems", tone: 0, up: "Work, cleverness and a little suspicion. Check the details twice." },
  { n: "Bear", pc: ["10", "c"], kw: ["strength", "money", "protection"], noun: "power", mod: "with real strength", tone: 1, up: "Strength, resources and someone protective. Use your weight wisely." },
  { n: "Stars", pc: ["6", "h"], kw: ["hope", "clarity", "guidance"], noun: "a clear plan", mod: "clearly", tone: 1, up: "Clear skies and a sense of direction. Follow the plan you can see." },
  { n: "Stork", pc: ["Q", "h"], kw: ["change", "move", "improvement"], noun: "a change", mod: "changing for the better", tone: 1, up: "Change and improvement, often a move. Welcome the new shape." },
  { n: "Dog", pc: ["10", "h"], kw: ["friend", "loyalty", "trust"], noun: "a friend", mod: "loyally", tone: 1, up: "A loyal friend or ally. Lean on the people who show up." },
  { n: "Tower", pc: ["6", "s"], kw: ["institution", "solitude", "authority"], noun: "an institution", mod: "officially", tone: 0, up: "Institutions, rules and a bit of distance. Go through the proper channels." },
  { n: "Garden", pc: ["8", "s"], kw: ["public", "social", "network"], noun: "a gathering", mod: "in public", tone: 1, up: "People, events and your wider circle. Show up and be seen." },
  { n: "Mountain", pc: ["8", "c"], kw: ["obstacle", "delay", "challenge"], noun: "an obstacle", mod: "slowly, with effort", tone: -1, up: "A big obstacle or a delay. Go around, or climb steadily." },
  { n: "Crossroads", pc: ["Q", "d"], kw: ["choice", "options", "paths"], noun: "a choice", mod: "with options", tone: 0, up: "Two or more paths. You get to choose; that's the gift." },
  { n: "Mice", pc: ["7", "c"], kw: ["loss", "worry", "erosion"], noun: "a slow loss", mod: "wearing away", tone: -1, up: "Small losses and nibbling worry. Fix the leak early." },
  { n: "Heart", pc: ["J", "h"], kw: ["love", "affection", "kindness"], noun: "love", mod: "with love", tone: 1, up: "Love, warmth and kindness. Lead with the heart here." },
  { n: "Ring", pc: ["A", "c"], kw: ["commitment", "contract", "cycle"], noun: "a commitment", mod: "bound by agreement", tone: 0, up: "A promise, a contract or a cycle. Read what you're signing up for." },
  { n: "Book", pc: ["10", "d"], kw: ["secret", "study", "knowledge"], noun: "a secret", mod: "not yet known", tone: 0, up: "Knowledge, study or something still hidden. Do your research." },
  { n: "Letter", pc: ["7", "s"], kw: ["message", "document", "writing"], noun: "a message", mod: "in writing", tone: 0, up: "A document, email or note. Get it in writing." },
  { n: "Man", pc: ["A", "h"], kw: ["a man", "the querent", "active"], noun: "a man in your life", mod: "through a man", tone: 0, up: "A man in the story, or you, if you identify with this card." },
  { n: "Woman", pc: ["A", "s"], kw: ["a woman", "the querent", "receptive"], noun: "a woman in your life", mod: "through a woman", tone: 0, up: "A woman in the story, or you, if you identify with this card." },
  { n: "Lily", pc: ["K", "s"], kw: ["peace", "maturity", "calm"], noun: "peace", mod: "calmly", tone: 1, up: "Calm, maturity and a slower pace. Patience and grace win this." },
  { n: "Sun", pc: ["A", "d"], kw: ["success", "energy", "warmth"], noun: "success", mod: "successfully", tone: 1, up: "Success and energy. The strongest yes in the deck." },
  { n: "Moon", pc: ["8", "h"], kw: ["recognition", "feelings", "creativity"], noun: "recognition", mod: "with feeling", tone: 1, up: "Recognition, moods and creative work. You'll be noticed." },
  { n: "Key", pc: ["8", "d"], kw: ["solution", "certainty", "importance"], noun: "the solution", mod: "for certain", tone: 1, up: "The answer, unlocked. This is important and it will open." },
  { n: "Fish", pc: ["K", "d"], kw: ["money", "flow", "business"], noun: "money", mod: "with money involved", tone: 1, up: "Money, business and abundance in motion. Keep it flowing." },
  { n: "Anchor", pc: ["9", "s"], kw: ["stability", "endurance", "goal"], noun: "stability", mod: "for the long haul", tone: 1, up: "Stability and staying power. Hold on; it lasts." },
  { n: "Cross", pc: ["6", "c"], kw: ["burden", "duty", "meaning"], noun: "a burden", mod: "heavily", tone: -1, up: "A burden or a duty that matters. Carry it with purpose, not guilt." },
].map((c, i) => ({ id: i, num: i + 1, ...c }));

export const SPREADS = {
  pair: { name: "Two cards: a quick answer", positions: [["Subject", "what it's about"], ["Detail", "how it is"]] },
  line: { name: "Three cards: a sentence", positions: [["Start", "the subject"], ["Middle", "the heart"], ["End", "where it goes"]] },
  square: { name: "Nine cards: the square", positions: [["Past · thoughts", ""], ["Past · heart", ""], ["Past · ground", ""], ["Now · thoughts", ""], ["Now · core", "the centre of it all"], ["Now · ground", ""], ["Next · thoughts", ""], ["Next · heart", ""], ["Next · ground", ""]] },
};
