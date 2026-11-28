// The Black Chamber: a cipher duel against real codebreakers. Each round is one cryptogram, a real line (from the
// Cipher Desk's documents) hidden in a simple substitution cipher: every letter swapped for another, the same way
// throughout. You break it by counting letters and spotting short words, as al-Kindi taught, before the rival does.
// "Black chamber" (cabinet noir) was the name for the rooms where European states opened and read diplomats' post.

/** The rivals, two per level. secs: how long they take; tip: how they worked, as a hint about method. */
export const RIVALS = [
  { id: "phelippes", lvl: 1, name: "Thomas Phelippes", when: "1586", secs: 300, e: "🕵️",
    fact: "Walsingham's decipherer. He broke Mary, Queen of Scots' letters by counting symbols, and the letters were used at her trial in 1586.",
    line: "Count the symbols first. The commonest is very likely E." },
  { id: "rossignol", lvl: 1, name: "Antoine Rossignol", when: "1628", secs: 260, e: "🎩",
    fact: "He broke a Huguenot letter at the siege of Réalmont in 1628, and the town surrendered. He and his son later built Louis XIV's Great Cipher.",
    line: "A short word on its own is often A or I. Start there." },
  { id: "wallis", lvl: 2, name: "John Wallis", when: "1643", secs: 220, e: "📐",
    fact: "A mathematician who broke Royalist ciphers for Parliament from 1643. He also introduced the ∞ symbol for infinity.",
    line: "Three letters again and again? Very likely THE." },
  { id: "painvin", lvl: 2, name: "Georges Painvin", when: "1918", secs: 190, e: "🎖️",
    fact: "In June 1918 he broke the German ADFGVX cipher in days of nonstop work, and lost 15 kilograms doing it.",
    line: "Double letters are usually LL, EE, SS or OO." },
  { id: "friedman", lvl: 3, name: "Elizebeth Smith Friedman", when: "1930s", secs: 160, e: "🔍",
    fact: "She broke smugglers' codes for the US Coast Guard in the 1920s and 30s, then Nazi spy-ring ciphers in South America in the Second World War.",
    line: "Every language has a fingerprint: E, T, A, O, I, N, S, H, R." },
  { id: "driscoll", lvl: 3, name: "Agnes Meyer Driscoll", when: "1920s", secs: 130, e: "⚓",
    fact: "The US Navy's leading codebreaker between the wars. She broke several Japanese naval codes in the 1920s and 30s.",
    line: "Word endings give a lot away: -ING, -ED, -TION." },
];
export const rivalOf = (id) => RIVALS.find((r) => r.id === id);

export const LEVELS = [
  { n: 1, name: "The post room", what: "4 letters given to start", given: 4, mult: 1 },
  { n: 2, name: "The cabinet noir", what: "2 letters given", given: 2, mult: 1.5 },
  { n: 3, name: "The Black Chamber", what: "no letters given", given: 0, mult: 2 },
];
/** Seconds a hint costs, and the fewest letters a cryptogram may have (shorter ones cannot be solved by counting). */
export const HINT_COST = 20, MIN_LETTERS = 14;
/** English letter frequency order (the fingerprint codebreakers used). */
export const ETAOIN = "ETAOINSHRDLCUMWFGYPBVKJXQZ";
