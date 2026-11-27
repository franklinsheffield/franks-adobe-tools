// Original Science is Magic Chinese zodiac interpretations.
export const ANIMALS = {
  Rat: { emoji: "🐀", kw: ["resourceful", "quick", "observant"],
    about: "The Rat is the first animal of the cycle, the one that won the great race by riding on the Ox's back. That story is the Rat in a sentence: clever, alert to opportunity and better at reading systems than almost anyone.",
    gifts: "You spot openings early, adapt fast and keep a reserve for hard times. People underestimate how much you notice.",
    shadow: "Anxiety about scarcity can turn into hoarding or over-scheming. The Rat's record of landing on its feet is the traditional counterweight.",
    love: "Loyal and attentive once you commit, and you show love through practical help." },
  Ox: { emoji: "🐂", kw: ["steady", "patient", "dependable"],
    about: "The Ox carried the Rat across the river and still came second, without complaint. Oxen win by endurance: the slow, unglamorous effort that ends up moving mountains.",
    gifts: "Reliability, stamina and calm under pressure. When you say it'll be done, it's done.",
    shadow: "Stubbornness and quiet resentment when you've carried too much for too long. The pattern eases when the weight is spoken about.",
    love: "Slow to open, deeply devoted after. You prove love by showing up, year after year." },
  Tiger: { emoji: "🐅", kw: ["brave", "magnetic", "restless"],
    about: "The Tiger is the cycle's warrior: bold, protective and impossible to ignore. Tigers bring the energy that starts revolutions and rescues friends.",
    gifts: "Courage, charisma and a strong sense of justice. You act when others hesitate.",
    shadow: "Impulsiveness and a hot temper. Not every fight is the Tiger's to take up.",
    love: "Passionate and generous, needs freedom and a partner who can keep up." },
  Rabbit: { emoji: "🐇", kw: ["gentle", "elegant", "diplomatic"],
    about: "The Rabbit, sometimes the Cat in Vietnam, is the cycle's diplomat: refined, perceptive and lucky. Rabbits get far by charm and tact rather than force.",
    gifts: "Taste, kindness and a talent for keeping the peace. You make spaces and people feel softer.",
    shadow: "Avoiding conflict can mean avoiding the truth. A little friction now prevents a lot of it later.",
    love: "Romantic and considerate, wants a calm, beautiful home life." },
  Dragon: { emoji: "🐉", kw: ["visionary", "powerful", "lucky"],
    about: "The Dragon is the only mythical animal in the cycle and the emblem of imperial power. Dragons dream big and seem to bend luck toward themselves.",
    gifts: "Vision, confidence and the ability to inspire a crowd. You make the improbable feel inevitable.",
    shadow: "Pride and impatience with lesser mortals. Even dragons need a team.",
    love: "Grand gestures, fierce loyalty, needs admiration and room to soar." },
  Snake: { emoji: "🐍", kw: ["wise", "intuitive", "composed"],
    about: "The Snake is the cycle's philosopher: quiet, strategic and deeply perceptive. Snakes shed old skins and come back renewed.",
    gifts: "Insight, discretion and a sense of timing. You read people and situations before they read you.",
    shadow: "Secrecy and possessiveness. Letting people see your process builds the trust you crave.",
    love: "Intense and private, chooses carefully and commits deeply." },
  Horse: { emoji: "🐎", kw: ["free", "energetic", "warm"],
    about: "The Horse is movement itself: travel, speed and a big, open heart. Horses do their best work when nobody's holding the reins too tight.",
    gifts: "Enthusiasm, independence and social warmth. You get people moving.",
    shadow: "Restlessness and dropping things halfway. The traditional counterweight is one race finished before the next begins.",
    love: "Falls fast and loves freely; needs a partner who also values freedom." },
  Goat: { emoji: "🐐", kw: ["creative", "kind", "sensitive"],
    about: "The Goat (also called Sheep or Ram) is the cycle's artist: gentle, imaginative and attuned to beauty. Goats thrive in good company and calm surroundings.",
    gifts: "Creativity, empathy and an eye for beauty. You bring tenderness to a hard world.",
    shadow: "Worry and indecision when you feel unsupported. The Goat is traditionally at its best inside a herd it can lean on.",
    love: "Devoted and affectionate, wants security and a shared creative life." },
  Monkey: { emoji: "🐒", kw: ["clever", "playful", "inventive"],
    about: "The Monkey is the cycle's trickster and problem-solver: curious, funny and endlessly inventive. Monkeys find the clever route nobody else saw.",
    gifts: "Wit, versatility and quick solutions. You learn anything fast.",
    shadow: "Boredom and mischief. The cleverness is read as better spent building than winning.",
    love: "Fun, flirtatious and lively; needs a partner who keeps them curious." },
  Rooster: { emoji: "🐓", kw: ["precise", "honest", "proud"],
    about: "The Rooster announces the dawn: punctual, observant and proud of good work. Roosters see details others miss and aren't shy about saying so.",
    gifts: "Precision, honesty and hard work. You hold the standard.",
    shadow: "Criticism that lands harder than you intend. The praise that is also meant tends to go unsaid.",
    love: "Loyal and dependable, shows love through care in the details." },
  Dog: { emoji: "🐕", kw: ["loyal", "just", "protective"],
    about: "The Dog is the cycle's guardian: honest, faithful and quick to defend the underdog. Dogs keep the circle safe.",
    gifts: "Loyalty, fairness and moral courage. People trust you instinctively.",
    shadow: "Worry and suspicion when trust is broken. Not everyone is a threat.",
    love: "Devoted for life once trust is earned." },
  Pig: { emoji: "🐖", kw: ["generous", "sincere", "easygoing"],
    about: "The Pig ends the cycle with abundance: warm, honest and generous to a fault. Pigs enjoy life and want everyone else to as well.",
    gifts: "Generosity, sincerity and a big capacity for joy. You make life feel like a feast.",
    shadow: "Over-indulgence and trusting too easily. Kindness needs boundaries too.",
    love: "Affectionate and forgiving, builds a warm home." },
};

export const ELEMENTS = {
  Wood: { emoji: "🌳", colour: "#5BD08A", kw: "growth, vision, flexibility", year: "Wood adds growth and generosity: you think long-term and like to help things flourish.",
    dm: "Your Day Master is **Wood**: you grow toward the light. You need room to expand, a cause to grow, and people to grow with.", lack: "Wood is traditionally linked with planning, learning, plants and trees, and starting things." },
  Fire: { emoji: "🔥", colour: "#FF7A59", kw: "passion, visibility, warmth", year: "Fire adds passion and visibility: you light up rooms and push things forward.",
    dm: "Your Day Master is **Fire**: you radiate. You need an audience, a purpose to burn for, and rest so you don't burn out.", lack: "Fire is traditionally linked with being seen, celebration, movement and sunlight." },
  Earth: { emoji: "⛰️", colour: "#E2B04A", kw: "stability, care, reliability", year: "Earth adds steadiness and care: you are the ground other people stand on.",
    dm: "Your Day Master is **Earth**: you hold things together. You need routine, trust and a place to call your own.", lack: "Earth is traditionally linked with routine, cooking, gardening, an ordered space and small promises kept." },
  Metal: { emoji: "⚔️", colour: "#DCD4FF", kw: "clarity, discipline, justice", year: "Metal adds clarity and resolve: you cut through noise and keep high standards.",
    dm: "Your Day Master is **Metal**: you refine. You need clear values, quality and the courage to cut what doesn't serve.", lack: "Metal is traditionally linked with clearing out, rules, finishing and precision." },
  Water: { emoji: "🌊", colour: "#66E0C8", kw: "wisdom, adaptability, depth", year: "Water adds intuition and flow: you find a way around every obstacle.",
    dm: "Your Day Master is **Water**: you flow and you know. You need depth, movement and time to reflect.", lack: "Water is traditionally linked with rest, reflection, reading, swimming and letting things move at their own pace." },
};

// The ten Day Masters: one line each, original.
export const DAY_MASTER = [
  "**Jia Wood, the tall tree.** Upright, principled, a natural leader who grows slowly and stands tall for decades.",
  "**Yi Wood, the vine and flower.** Adaptable and graceful, you grow around obstacles and find the light through other people.",
  "**Bing Fire, the sun.** Generous, bright and visible; you warm everyone without asking anything back.",
  "**Ding Fire, the candle.** Focused, intimate and inspiring; you light the way for a few people at close range.",
  "**Wu Earth, the mountain.** Solid, trustworthy and hard to move; people find shelter in you.",
  "**Ji Earth, the garden soil.** Nurturing and resourceful; you make other things grow.",
  "**Geng Metal, the sword and ore.** Direct, brave and strong-willed; you cut through and get it done.",
  "**Xin Metal, the jewel.** Refined, sensitive and precise; you shine when polished and noticed.",
  "**Ren Water, the ocean.** Big-minded, restless and powerful; you carry a lot and keep moving.",
  "**Gui Water, the rain and mist.** Gentle, intuitive and quietly persuasive; you seep into places nothing else can reach.",
];

export const TRINES = [["Rat", "Dragon", "Monkey"], ["Ox", "Snake", "Rooster"], ["Tiger", "Horse", "Dog"], ["Rabbit", "Goat", "Pig"]];
export const TRINE_NAMES = ["the Doers", "the Thinkers", "the Protectors", "the Peacemakers"];
export const HARMONY = { Rat: "Ox", Ox: "Rat", Tiger: "Pig", Pig: "Tiger", Rabbit: "Dog", Dog: "Rabbit", Dragon: "Rooster", Rooster: "Dragon", Snake: "Monkey", Monkey: "Snake", Horse: "Goat", Goat: "Horse" };
export const ORDER = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
export const clashOf = (a) => ORDER[(ORDER.indexOf(a) + 6) % 12];
export const trineOf = (a) => TRINES.findIndex((t) => t.includes(a));

/** How the current year's animal meets yours. */
export function yearRelation(mine, now) {
  if (mine === now) return { kind: "Ben Ming Nian (your own year)", text: "It's your own animal's year, traditionally a year of treading carefully, when big changes stir. Wearing red for protection is the old custom; modern readers take it as a year of caution about commitments, health and reputation." };
  if (clashOf(mine) === now) return { kind: "clash year", text: `The ${now} sits opposite your ${mine}. Clash years shake things loose: moves, job changes, endings that make room. Tradition reads the change as easier steered than resisted.` };
  if (HARMONY[mine] === now) return { kind: "secret friend year", text: `The ${now} is your secret friend. Help tends to arrive from unexpected places; often through introductions.` };
  if (trineOf(mine) === trineOf(now)) return { kind: "allied year", text: `The ${now} belongs to your trine. The year's energy flows with you: tradition counts it favourable for projects that matter.` };
  return { kind: "neutral year", text: `The ${now} neither helps nor hinders your ${mine} much. Tradition reads it as a year when results simply follow effort.` };
}
