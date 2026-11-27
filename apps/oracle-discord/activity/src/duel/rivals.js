// Rivals: at Master level (a ladder, easiest first: beat one to unlock the next) the Oracle can channel a famous chemist. Each one stacks its deck with the elements they
// worked on and prefers compounds made of them. Every fact here is true; quotes are only ones with a solid source, or are marked as 'often credited'.
export const RIVALS = [
  { id: "davy", hp: 0, name: "Humphry Davy", short: "Davy", years: "1778–1829", emoji: "🔋", fav: ["K", "Na", "Ca", "Mg", "Sr", "Ba"],
    style: "Plays the reactive metals he split out with electricity.",
    fact: "With a huge battery, Davy isolated potassium and sodium in 1807, then calcium, magnesium, strontium and barium in 1808. His cousin said he danced around the lab when the first potassium burst into flame.",
    hello: "Davy wheels in his battery. The alkali metals are humming.", win: "Davy's metals fizz in triumph. Electricity wins again.", lose: "Davy tips his hat. 'My best discovery,' he might say, 'was a worthy rival.'" },
  { id: "lavoisier", hp: 2, name: "Antoine Lavoisier", short: "Lavoisier", years: "1743–1794", emoji: "⚖️", fav: ["O", "H", "C"],
    style: "Loves oxygen: he named it, and hydrogen too.",
    fact: "Lavoisier showed that burning is a reaction with oxygen, weighed everything to prove mass is conserved, and named oxygen and hydrogen. In 1772 he burned a diamond and found it makes only carbon dioxide.",
    hello: "Lavoisier sets out his balance. Every atom you play, he will weigh.", win: "Lavoisier records the result in his notebook. Mass conserved, duel lost (for you).", lose: "Lavoisier bows. Even his balance can't find the missing Stability." },
  { id: "faraday", hp: 3, hand: 1, name: "Michael Faraday", short: "Faraday", years: "1791–1867", emoji: "🧲", fav: ["Cl", "C", "H"],
    style: "Favours chlorine and carbon: he liquefied one and found benzene in the other.",
    fact: "Faraday, once a bookbinder's apprentice and Davy's assistant, liquefied chlorine in 1823 and discovered benzene in 1825. His notebook, 1849: \"Nothing is too wonderful to be true, if it be consistent with the laws of nature.\"",
    hello: "Faraday lights a candle and smiles. 'Nothing is too wonderful to be true, if it be consistent with the laws of nature.'", win: "Faraday makes a note by candlelight. Another experiment, another result.", lose: "Faraday laughs and shakes your hand. The basement lab approves." },
  { id: "mendeleev", hp: 4, hand: 1, name: "Dmitri Mendeleev", short: "Mendeleev", years: "1834–1907", emoji: "📊", fav: [],
    style: "Races for discoveries: he wants a new compound every turn.",
    fact: "Mendeleev's 1869 periodic table left gaps for elements no one had found. He predicted their properties, and gallium (1875), scandium (1879) and germanium (1886) fitted them.",
    hello: "Mendeleev spreads his table across the bench. He has gaps to fill.", win: "Mendeleev fills in the last gap in his table. Five compounds, as predicted.", lose: "Mendeleev strokes his beard. He did not predict this." },
  { id: "curie", hp: 6, name: "Marie Curie", short: "Curie", years: "1867–1934", emoji: "☢️", fav: ["U", "Ba", "Bi"], hand: 2, copies: 1,
    style: "Plays the heavy elements of pitchblende, and holds the biggest hand of any rival.",
    fact: "Curie studied uranium's rays, coined the word 'radioactivity' and, with Pierre, found polonium (it came out with the bismuth in pitchblende) and radium (it came out with the barium). She is the only person with Nobel Prizes in two sciences.",
    hello: "Marie Curie sets down a faintly glowing vial. Words often credited to her: 'Nothing in life is to be feared, it is only to be understood.'", win: "Curie nods and returns to her measurements. Understood.", lose: "Curie smiles. A rare result, and she will want to measure it twice." },
];
export const RIVAL = Object.fromEntries(RIVALS.map((r) => [r.id, r]));
/** How much a rival likes a compound: +3 for each of their favourite elements in it (Mendeleev: new ones). */
export function rivalTaste(rv, c, found) {
  if (!rv) return 0;
  if (!rv.fav.length) return found.includes(c.id) ? 0 : 5;
  return rv.fav.filter((s) => c.atoms[s]).length * 3;
}
/** First win against each rival pays this Essence. */
export const RIVAL_PRIZE = 25;
