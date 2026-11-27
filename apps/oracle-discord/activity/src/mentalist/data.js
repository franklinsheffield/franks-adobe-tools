// The Mentalist: you play a stage "mind reader" with the real methods. Level 1: card forces and cold reading (the
// Barnum effect). Level 2: the two-person word code the Houdinis used. Level 3: billets and the one-ahead.
// Learning by doing: every method is documented. Nobody reads minds here: the audience is being fooled, kindly.

/** Card forces: the situation, and the force that fits it. */
export const FORCES = [
  { id: "classic", e: "🂠", name: "Classic force", fits: "You spread the cards through your hands and they reach for one",
    how: "You time the spread so their fingers arrive just as your card passes under them.",
    fact: "The classic force is described in Professor Hoffmann's Modern Magic (1876), one of the first big English magic books." },
  { id: "crosscut", e: "✂️", name: "Cross-cut force", fits: "They cut the deck anywhere, and later look at the card at the cut",
    how: "You lay the halves crosswise, talk for a few seconds, then lift: the 'cut' card was the old top card.",
    fact: "Magicians call that pause time misdirection: a little talk and nobody remembers which half was on top." },
  { id: "riffle", e: "🫳", name: "Riffle force", fits: "You riffle the corners and they call 'stop' whenever they like",
    how: "Wherever they stop, you lift off at a break held above your card.",
    fact: "Riffle forces rely on speed: in a fast riffle nobody can see exactly where the cards parted." },
  { id: "equivoque", e: "✉️", name: "Magician's choice", fits: "Three envelopes on the table, and their 'free choice' must end on yours",
    how: "Whatever they pick, your words decide if it means 'keep' or 'discard', so it always ends on your envelope.",
    fact: "Magicians also call it equivoque: it works because nobody agreed beforehand what 'pick one' would mean." },
  { id: "svengali", e: "🃏", name: "Svengali deck", fits: "They pick any card from a deck you riffle, and you never touch it again",
    how: "Every other card is the same, slightly short card, so a riffle always opens at one.",
    fact: "The Svengali deck is usually credited to Burling Hull, around 1909, and is still sold in toy shops." },
  { id: "psych", e: "🧠", name: "Psychological force", fits: "Think of a number from 1 to 10, quickly, with no cards at all",
    how: "Most people choose 7, so you bet on it and have a way out if you miss.",
    fact: "Asked for a 'random' number from 1 to 10, people pick 7 far more often than chance would give." },
];

/** Cold reading. Statements adapted from Forer's 1948 test, which fit nearly everyone, and specific guesses that usually miss. */
export const BARNUM = [
  "You have a great need for other people to like and admire you.",
  "You have a tendency to be critical of yourself.",
  "You have a great deal of unused capacity which you have not turned to your advantage.",
  "At times you have serious doubts as to whether you have made the right decision.",
  "You prefer a certain amount of change and variety in your life.",
  "You pride yourself on being an independent thinker.",
  "At times you are sociable, while at other times you are reserved.",
  "Some of your hopes tend to be pretty unrealistic.",
  "Security is one of your major goals in life.",
];
export const SPECIFIC = [
  "You broke your left arm when you were nine.", "Your mother's name begins with R.", "You have exactly two sisters.",
  "You were born in a seaside town.", "You keep a red bicycle in a shed.", "Your first car was green.",
  "You have a scar above your right eyebrow.", "You once lived on a street named after a tree.", "You speak three languages.",
  "Your birthday is in the first week of June.", "You own a grey cat called Pepper.", "You were a twin.",
];
export const SITTERS = [
  "A young clerk, nervous, twisting his hat.", "A widow in her Sunday best, very still.", "A sailor home on leave, grinning.",
  "A schoolteacher who says she 'doesn't believe a word of this'.", "A banker checking his pocket watch.", "Two sisters holding hands.",
  "A student who came on a dare.", "A shopkeeper who has seen every act in town.",
];
export const FORER = "In 1948 Bertram Forer gave 39 students the same 'personal' reading. On average they rated it 4.26 out of 5 for accuracy.";

/** The Houdinis' word code: each cue word stands for a number (and the letters A to J). */
export const CODE = [["Pray", 1], ["Answer", 2], ["Say", 3], ["Now", 4], ["Tell", 5], ["Please", 6], ["Speak", 7], ["Quickly", 8], ["Look", 9], ["Be quick", 10]];
export const wordOf = (n) => (CODE.find(([, v]) => v === n) || [])[0];
export const valueOf = (w) => (CODE.find(([k]) => k === w) || [])[1];
export const CARD = ["", "Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
/** A cue line built on a code word. */
export const CUES = { Pray: "Pray, what is this card?", Answer: "Answer me: what's the card?", Say: "Say, what am I holding?", Now: "Now, what card is this?",
  Tell: "Tell the audience the card.", Please: "Please, the card?", Speak: "Speak up: what's the card?", Quickly: "Quickly, the card!", Look: "Look hard. What is it?", "Be quick": "Be quick: which card?" };
export const CODE_FACTS = [
  "Harry and Bess Houdini used this word code in their early mind-reading act in the 1890s.",
  "The code was printed in a Houdini biography in 1928, a year before a medium claimed to have received it.",
  "Julius and Agnes Zancig billed their code act as 'Two Minds with but a Single Thought'.",
  "Good code acts hide the cue inside an ordinary question, so the audience hears nothing but the question.",
];

/** Billet questions: what sitters wrote on folded slips. Everyday questions only. */
export const QUESTIONS = [
  "Will I find the ring I lost in May?", "Should I take the job in Chicago?", "Will the harvest be good this year?", "Will my brother write from Canada?",
  "Is the new lodger honest?", "Will my daughter pass her examination?", "Should I sell the horse?", "Will we move house before winter?",
  "Who borrowed my umbrella?", "Will the shop make a profit this year?", "Should I learn to drive a motor car?", "Will it rain on the wedding day?",
];
export const BILLET_FACTS = [
  "In the one-ahead, you 'divine' the slip you opened last, and open the next one 'to check'.",
  "The first answer must be one you already know: a plant in the audience, or a question you guessed.",
  "Former medium M. Lamar Keene described billet tricks like this in The Psychic Mafia (1976).",
  "Joseph Dunninger offered $10,000 to anyone who could prove he used plants in his mind-reading shows.",
];

/** Levels: what kind of rounds, how many, and the point multiplier. */
export const LEVELS = [
  { n: 1, name: "Forces and cold reading", what: "Force a card, then read a stranger with lines that fit anyone", mult: 1, rounds: 6, kinds: ["force", "read"],
    open: "A music hall, 1905. You're the 'mind reader' on the bill. First: make them choose the card you want." },
  { n: 2, name: "The two-person code", what: "Send and read cues in the word code the Houdinis used", mult: 1.5, rounds: 6, kinds: ["send", "hear", "two"],
    open: "Your partner is blindfolded on stage. You walk the audience with a card in your hand. Every word you say is a signal." },
  { n: 3, name: "Billets, one ahead", what: "Answer sealed questions by staying one slip ahead", mult: 2, rounds: 5, kinds: ["billet"],
    open: "The sitters wrote questions on slips and sealed them. Your plant's question is somewhere in the pile. Stay one ahead." },
];
export const forceOf = (id) => FORCES.find((f) => f.id === id);
