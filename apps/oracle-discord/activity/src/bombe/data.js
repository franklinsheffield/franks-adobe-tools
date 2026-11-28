// The Bombe Room: break a real Enigma message the way Bletchley Park did. Slide a crib (a guessed phrase) along the
// cipher until no letter sits on itself, run the bombe to find the rotor start, then read the German. The machine is a
// true Enigma I (rotors I, II, III; reflector B), simplified only by leaving out the plugboard and ring settings.

/** Real Enigma I rotor wirings and turnover notches (the letter showing when the next rotor steps). */
export const ROTORS = {
  I: { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", notch: "Q" },
  II: { wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", notch: "E" },
  III: { wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", notch: "V" },
};
export const REFLECTOR_B = "YRUHQSLDPXNGOKMIEBFZCWVJAT";
export const ORDERS = [["I", "II", "III"], ["I", "III", "II"], ["II", "I", "III"], ["II", "III", "I"], ["III", "I", "II"], ["III", "II", "I"]];

/** Messages in the style of real intercepts (X stood for a space). crib: the guessed phrase. en: what it says. */
export const MESSAGES = [
  { id: "biscay", text: "VONXWETTERSTATIONXWETTERVORHERSAGEXBISKAYAXREGENXWINDNORDWESTXSTAERKEFUENF", crib: "WETTERVORHERSAGE", en: "From the weather station: forecast for Biscay, rain, wind north-west force five.",
    fact: "Weather reports were sent every day in the same form, so 'WETTERVORHERSAGE' (weather forecast) was one of Bletchley's most reliable cribs." },
  { id: "nordsee", text: "WETTERVORHERSAGEXNORDSEEXNEBELXSICHTXSCHLECHT", crib: "WETTERVORHERSAGE", en: "Weather forecast, North Sea: fog, poor visibility.",
    fact: "Weather reports sent by Enigma were often broadcast again in a weaker weather cipher, handing Bletchley the plain text." },
  { id: "ostsee", text: "ANXFLOTTEXWETTERVORHERSAGEXOSTSEEXKLARXWINDXSCHWACH", crib: "WETTERVORHERSAGE", en: "To the fleet: weather forecast, Baltic: clear, light wind.",
    fact: "Germans spelled out spaces and punctuation with letters such as X, which made common phrases even easier to guess." },
  { id: "gruppe", text: "ANXGRUPPEXNORDXKEINEBESONDERENEREIGNISSEXENDE", crib: "KEINEBESONDERENEREIGNISSE", en: "To Group North: nothing special to report. End.",
    fact: "'KEINE BESONDEREN EREIGNISSE' (no special occurrences) was sent so often from quiet posts that it became a favourite crib." },
  { id: "nacht", text: "MELDUNGXKEINEBESONDERENEREIGNISSEXNACHTXRUHIG", crib: "KEINEBESONDERENEREIGNISSE", en: "Report: nothing special to report. Night quiet.",
    fact: "A German post in the North African desert reported nothing to report so faithfully that it handed Bletchley a crib almost daily." },
  { id: "tages", text: "TAGESMELDUNGXKEINEBESONDERENEREIGNISSEXALLESXKLAR", crib: "KEINEBESONDERENEREIGNISSE", en: "Daily report: nothing special to report. All clear.",
    fact: "Codebreakers called a guessed phrase a crib, from school slang for a cheat sheet." },
];

/** What the codebreakers knew: shown as you play and in the Study. */
export const FACTS = {
  self: "An Enigma never turns a letter into itself. A crib that puts any letter on top of itself must be in the wrong place.",
  bombe: "The bombe tried every start position of the rotors at speed and stopped when the letters agreed with the crib.",
  orders: "Army and air force Enigma chose 3 rotors from 5, so 60 wheel orders. Bletchley ran different orders on different bombes at once.",
  turing: "Alan Turing designed the British bombe in 1939, building on the Polish bomba. Gordon Welchman added the diagonal board.",
  wrens: "Members of the Women's Royal Naval Service ran the bombes day and night at Bletchley and its outstations.",
  plug: "Real Enigma also had a plugboard that swapped up to 13 pairs of letters. This game leaves it out to keep the search small enough to watch.",
};

export const LEVELS = [
  { n: 1, name: "Hut 6 training", what: "the wheel order is known", orders: 1, mult: 1 },
  { n: 2, name: "The night shift", what: "2 possible wheel orders", orders: 2, mult: 1.5 },
  { n: 3, name: "A new key", what: "all 6 wheel orders", orders: 6, mult: 2 },
];
export const HOURS = 4, CHOICES = 3;
