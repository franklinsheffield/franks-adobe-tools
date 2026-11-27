// Possession: the House prompt sets. Each House has its own tales; each tale is 8 beats (a question for the players and
// the line the possessed host speaks, with {a} = the winning answer) plus a title beat. Level 1 tells the lv-1 beats
// (4), Level 2 adds the lv-2 beats (6), Level 3 tells all 8. fall = the House's own answers, used when nobody writes one.
// These are made-up tales for fun: no facts in them, so nothing here can be wrong.
import { host } from "../hosts/index.js";

const B = (lv, ask, frame, ...fall) => ({ lv, ask, frame, fall });

export const TALES = {
  oracle: [
    { id: "or-thief", name: "The Thief of the Moonless Night", kind: "Myth", beats: [
      B(1, "Who is the hero of this tale?", "Long ago, in a land of fog, there lived {a}.", "a goatherd with one sandal", "a very tired librarian", "the seventh son of a baker"),
      B(1, "What did the hero steal?", "One moonless night, our hero stole {a}.", "the Moon's spare key", "a dragon's left sock", "the last biscuit in the kingdom"),
      B(2, "Who saw it happen?", "But the theft was seen by {a}.", "a gossiping owl", "the hero's own grandmother", "three crows in a trench coat"),
      B(1, "What terrible thing happened next?", "And so, as punishment, {a}.", "the rivers ran backwards for a week", "every cat in the land learned to talk", "it rained soup"),
      B(3, "Where did the hero flee to?", "The hero fled to {a}.", "the bottom of a well", "a cave behind a waterfall", "their aunt's spare room"),
      B(2, "What did the Oracle tell them?", "I gazed into my crystal and said: \"{a}.\"", "Put it back and say sorry", "Bring snacks", "The answer is in your pocket"),
      B(3, "Who did they have to face?", "At last they faced {a}.", "the Moon herself, very cross", "a sphinx with a riddle about cheese", "their own reflection"),
      B(1, "How does it end?", "And in the end, {a}. So it is told.", "the stolen thing went back and everyone had cake", "the hero became a constellation", "nobody ever spoke of it again"),
    ], title: ["The Thief of the Moonless Night", "The Hero Who Took It", "A Lesson in Sandals"] },
    { id: "or-origin", name: "How the World Got Its Hiccups", kind: "Origin myth", beats: [
      B(1, "What thing in the world shall our myth explain?", "This is the tale of how the world got {a}.", "Mondays", "hiccups", "the colour purple"),
      B(1, "Who ruled the world back then?", "In the beginning, the world was ruled by {a}.", "a giant sleepy turtle", "four squabbling winds", "a goddess who hated noise"),
      B(2, "What was the world like before?", "Back then, everything was {a}.", "very beige", "upside down", "made of jelly"),
      B(1, "Who made the big mistake?", "Then {a} made a terrible mistake.", "a curious child", "the god of small things", "a goat who could not read"),
      B(2, "What was the mistake?", "They {a}.", "opened the forbidden jar", "sneezed on the Sun", "pressed the big red button"),
      B(3, "What came out?", "Out came {a}, and it would not go back in.", "a cloud of glitter", "every bad joke ever told", "a very loud bird"),
      B(3, "What did the gods say?", "The gods looked down and said, \"{a}.\"", "Well, that's on you", "We'll allow it", "Not again"),
      B(1, "And what do we still do about it today?", "And that is why, to this day, {a}.", "we eat cake on birthdays", "dogs sniff each other's noses", "nobody opens jars at night"),
    ], title: ["How the World Got Hiccups", "The Jar That Should Not Be Opened", "Why Things Are the Way They Are"] },
  ],
  alchemist: [
    { id: "al-mishap", name: "The Apprentice and the Green Smoke", kind: "Lab disaster", beats: [
      B(1, "Which apprentice is this tale about?", "This is the sorry tale of {a}, apprentice of my Lab.", "Pip, who never reads the labels", "a newt with ambitions", "the night janitor"),
      B(1, "What were they trying to turn into gold?", "One night they tried to turn {a} into gold.", "a wooden spoon", "their homework", "an old boot"),
      B(2, "What secret ingredient did they add?", "Into the crucible went a pinch of {a}.", "dragon dandruff", "moonlight in a jar", "something from the back of the cupboard"),
      B(1, "What happened when the flask boiled?", "The flask boiled, and {a}.", "the whole lab turned green", "the ceiling went missing", "a small cloud started following them"),
      B(3, "Who came to see what the noise was?", "Then in walked {a}.", "the Magister, in his slippers", "the town's entire fire brigade", "a very curious duck"),
      B(2, "What did they shout?", "And they shouted, \"{a}!\"", "Not the good beakers", "Write that down", "Is that supposed to glow"),
      B(3, "What was the side effect?", "The side effect: {a}.", "everyone's hair turned silver", "the cat now speaks Latin", "Tuesdays happen twice"),
      B(1, "What did they make in the end?", "In the end, they did not make gold. They made {a}.", "a very good soup", "an enemy", "history"),
    ], title: ["The Apprentice and the Green Smoke", "Not Quite Gold", "Do Not Skip the Labels"] },
    { id: "al-stone", name: "The Quest for the Stone", kind: "Quest", beats: [
      B(1, "Who set out to find the Philosopher's Stone?", "In a smoky city lived {a}, who wanted the Philosopher's Stone.", "an old alchemist with burnt eyebrows", "twin sisters who argued about everything", "a retired pirate"),
      B(1, "Why did they want it?", "They wanted it because {a}.", "they were tired of being poor", "they owed a dragon money", "their cat was getting old"),
      B(2, "Who gave them the first clue?", "The first clue came from {a}.", "a raven at the window", "a recipe on the back of a menu", "their own reflection in a spoon"),
      B(1, "What did they have to mix?", "The clue said: mix {a}, and wait seven days.", "salt, sulphur and a lot of patience", "tears, toast and a feather", "a sunrise and a snowflake"),
      B(3, "What went wrong on the seventh day?", "On the seventh day, {a}.", "the cat knocked it over", "the furnace sneezed", "they forgot and went to the fair"),
      B(2, "Who tried to steal their work?", "Then {a} tried to steal it.", "a rival in a purple hat", "the king's tax collector", "a goblin from the cellar"),
      B(3, "How did they stop them?", "But our alchemist stopped them by {a}.", "throwing a stink bomb", "asking politely", "pretending to be a statue"),
      B(1, "What was the Stone, in the end?", "And the Stone, at last, turned out to be {a}.", "friendship, sadly", "a regular rock", "the cat all along"),
    ], title: ["The Stone at the Bottom of the Flask", "Seven Days of Waiting", "The Rival in the Purple Hat"] },
  ],
  observatory: [
    { id: "ob-stars", name: "A New Constellation", kind: "Star myth", beats: [
      B(1, "Whose shape shall we hang in the sky tonight?", "Tonight I chart a new constellation: {a}.", "the Sleepy Bear", "the Lost Umbrella", "the Great Teapot"),
      B(1, "Who were they before they were stars?", "Before the stars, they were {a}.", "a shepherd who counted wrong", "a queen who loved to dance", "a dog who chased the Moon"),
      B(2, "What were they famous for?", "They were famous across the land for {a}.", "never once being on time", "the loudest laugh", "the best soup in seven kingdoms"),
      B(1, "Which god did they upset?", "But they upset {a}.", "the god of thunder, who was napping", "the Moon, by humming", "the Sun, by outshining him"),
      B(3, "How did they upset them?", "It happened because they {a}.", "borrowed a chariot without asking", "told the Moon a terrible joke", "ate the sacred figs"),
      B(2, "What did the gods do to them?", "So the gods {a}.", "threw them into the sky", "turned them into seven sparkles", "pegged them across the heavens like washing"),
      B(3, "When can we see them?", "And you can see them {a}.", "every winter, just after dinner", "only when nobody is looking", "whenever it's cloudy, sadly"),
      B(1, "What do sailors say when they see it?", "And when sailors see it, they say, \"{a}.\"", "Fair winds tonight", "Put the kettle on", "Who left that up there"),
    ], title: ["The Constellation of the Lost Umbrella", "Hung in the Sky", "The Shepherd Who Counted Wrong"] },
    { id: "ob-comet", name: "The Comet Over the Pie Shop", kind: "Night watch", beats: [
      B(1, "What did the night watch see in the sky?", "One clear night, the watch saw {a}.", "a comet with a long green tail", "a star that winked", "something shaped like a spoon"),
      B(1, "Where was it heading?", "It was heading straight for {a}.", "the royal pie shop", "the Moon", "my telescope"),
      B(2, "Who panicked first?", "The first to panic was {a}.", "the mayor, in his pyjamas", "the town's oldest goat", "an astronomer who should know better"),
      B(1, "What did people think it meant?", "Everyone said it meant {a}.", "the end of the world, again", "free cheese for all", "the king would grow a beard"),
      B(3, "What did they do to be safe?", "To be safe, they {a}.", "hid under their beds", "wore their hats backwards", "sang to it very loudly"),
      B(2, "What was it really?", "But through my telescope I saw it was really {a}.", "a moth on the lens", "ice and dust, as comets are", "a very lost lantern"),
      B(3, "What did it leave behind?", "As it passed, it left behind {a}.", "a shower of shooting stars", "a smell of burnt toast", "one tiny note"),
      B(1, "What happens when it comes back?", "And when it returns, {a}.", "we will all be ready, with snacks", "the goat will panic again", "I will still be watching"),
    ], title: ["The Night of the Green Tail", "The Comet Over the Pie Shop", "A Moth on the Lens"] },
  ],
  parlour: [
    { id: "pa-spirit", name: "The Spirit Speaks", kind: "Spirit writing", beats: [
      B(1, "Who is the spirit speaking through me tonight?", "The spirit speaks… I am {a}.", "a sea captain lost in a storm", "the ghost of a very rude butler", "a duchess who misses her parrot"),
      B(1, "Where did the spirit live?", "In life, I dwelt in {a}.", "a crooked house on a hill", "a lighthouse with no light", "the cupboard under these stairs"),
      B(2, "How did the spirit pass over?", "I passed over when {a}.", "I slipped on a pudding", "the chandelier fell", "I laughed too hard at my own joke"),
      B(1, "What has the spirit come back for?", "I have come back for {a}.", "my favourite spoon", "one last cup of tea", "an apology from my brother"),
      B(3, "What did the spirit hide?", "I hid {a} where no one would look.", "a treasure map", "my false teeth", "a letter for my true love"),
      B(2, "Where is it hidden?", "It lies {a}.", "beneath the third floorboard", "inside the grandfather clock", "under the medium's chair, darling"),
      B(3, "What is the spirit's warning?", "Heed my warning: {a}.", "never trust a cat in a monocle", "don't eat the soup", "check the curtains for wires"),
      B(1, "What are the spirit's last words?", "And now I must go. My last words are: {a}.", "Goodbye, and feed the parrot", "Tell no one", "I'll be back on Tuesday"),
    ], title: ["The Captain in the Cupboard", "A Spoon from Beyond", "Feed the Parrot"] },
    { id: "pa-manor", name: "The Haunting of Blackwood Manor", kind: "Ghost story", beats: [
      B(1, "Which house is haunted?", "This is the haunting of {a}.", "Blackwood Manor", "the old post office", "a bungalow by the sea"),
      B(1, "Who moved in?", "One autumn, in moved {a}.", "a family of very brave mice", "a famous opera singer", "two sceptics with a notebook"),
      B(2, "What was the first strange sign?", "The first strange sign: {a}.", "the piano played itself", "every clock stopped at three", "someone kept eating the biscuits"),
      B(1, "Who did they call for help?", "So they called {a}.", "Madame Rook, naturally", "a vicar on a bicycle", "the Ghost Committee"),
      B(3, "What did the séance reveal?", "At the séance, the table rapped and revealed {a}.", "a secret door", "a very bored ghost", "the butler's toes"),
      B(2, "Who was really behind it?", "But behind it all was {a}.", "the landlord, who wanted them gone", "a raccoon in the walls", "a ghost after all"),
      B(3, "How were they caught?", "They were caught when {a}.", "someone sneezed in the wardrobe", "the flour on the floor showed footprints", "the lights came on too early"),
      B(1, "What is the house like now?", "And now the house is {a}.", "a very popular tea room", "quiet, mostly", "for sale, cheap, ask Madame Rook"),
    ], title: ["The Haunting of Blackwood Manor", "Footprints in the Flour", "The Piano That Played Itself"] },
  ],
  scriptorium: [
    { id: "sc-book", name: "The Book of Seven Spoons", kind: "Lost book", beats: [
      B(1, "What book was lost?", "The chronicle tells of a lost book: {a}.", "The Book of Seven Spoons", "a cookbook for dragons", "the Abbot's secret diary"),
      B(1, "Who wrote it?", "It was written by {a}.", "a monk who hated mornings", "a cat walking through the ink", "three scribes who never agreed"),
      B(2, "What was scribbled in the margins?", "In its margins someone wrote: \"{a}.\"", "This ink is terrible", "Brother Tom smells of onions", "Help, I am trapped in a scriptorium"),
      B(1, "How was it lost?", "It was lost when {a}.", "a goat ate the last page", "the library flooded", "the Abbot used it as a doorstop"),
      B(3, "Who has been searching for it?", "For centuries, it has been sought by {a}.", "a secret society of librarians", "a very old tortoise", "a professor in a damp coat"),
      B(2, "Where was it found?", "At last it was found {a}.", "in a pie dish", "behind a loose brick", "in the wrong section, as always"),
      B(3, "What did it say inside?", "When they opened it, it held {a}.", "the recipe for perfect toast", "nothing but drawings of snails", "the secret of the Scriptorium"),
      B(1, "Where is it now?", "And today it rests {a}.", "in a glass case, unread", "on my desk, overdue", "under lock and key, and a cat"),
    ], title: ["The Book of Seven Spoons", "Found in the Wrong Section", "Snails in the Margins"] },
    { id: "sc-fable", name: "The Hedgehog in the Hat", kind: "Fable", beats: [
      B(1, "Which animal is our fable about?", "Here begins the fable of {a}.", "the clever hedgehog", "a fox who could not lie", "the tortoise who wanted to fly"),
      B(1, "What did the animal want?", "More than anything, it wanted {a}.", "a crown of acorns", "to be taller than the oak", "the whole pie"),
      B(2, "Who stood in its way?", "But in its way stood {a}.", "a proud lion", "a river with opinions", "the farmer's terrible dog"),
      B(1, "What clever trick did it play?", "So it played a clever trick: {a}.", "it pretended to be a rock", "it asked a riddle nobody could answer", "it wore the farmer's hat"),
      B(3, "Did the trick work?", "And the trick {a}.", "worked, until it sneezed", "worked far too well", "fooled absolutely no one"),
      B(2, "Who found out the truth?", "The truth was found out by {a}.", "a wise old owl", "everyone, at once", "the farmer's grandmother"),
      B(3, "What happened to the animal?", "And so the animal {a}.", "got the pie but lost its hat", "became king for a day", "had to apologise to the river"),
      B(1, "What is the moral?", "The moral of this fable: {a}.", "never trust a hedgehog in a hat", "pride comes before a sneeze", "always share the pie"),
    ], title: ["The Hedgehog in the Hat", "The River with Opinions", "A Fable of Pie"] },
  ],
};

export const LEVELS = [
  { n: 1, name: "A short tale", beats: 4, what: "4 lines and a title" },
  { n: 2, name: "A tale", beats: 6, what: "6 lines and a title" },
  { n: 3, name: "An epic", beats: 8, what: "8 lines and a title" },
];
const TITLE_ASK = { oracle: "What shall we call this tale?", alchemist: "What shall we name this account in the Lab book?", observatory: "What name goes in the star log?",
  parlour: "What shall we call this séance, darlings?", scriptorium: "What title goes on the spine?" };

export const talesFor = (houseId) => TALES[houseId] || TALES.oracle;
export const taleById = (id) => Object.values(TALES).flat().find((t) => t.id === id) || null;
/** The beats a level tells, in story order, then the title beat. */
export function beatsFor(tale, level, houseId) {
  const L = Math.max(1, Math.min(3, level || 1)), tid = Object.keys(TALES).find((h) => TALES[h].includes(tale)) || houseId || "oracle";
  return [...tale.beats.filter((b) => b.lv <= L), { ask: TITLE_ASK[houseId] || TITLE_ASK[tid] || TITLE_ASK.oracle, frame: "{a}", fall: tale.title, title: true }];
}

/* ---------- The emcee: each House runs the game in its own voice. "trance" comes just before the possessed line.
   "slip" is the running gag: the hosts are all secretly one person, and hide it badly. {name} = a player. ---------- */
const L = (open, write, vote, strike, trance, title, win, solo, slip) => ({ open, write, vote, strike, trance, title, win, solo, slip });
export const EMCEE = {
  oracle: L(
    ["Possess me, seekers. I'll ask the questions; your words come out of my mouth. Be kind to my mouth.", "A tale told by many voices, all of them mine. Let's begin."],
    ["Type my next words. I promise to say them with a straight face.", "Whisper me an answer. The crystal is listening."],
    ["Choose the words I'll speak. Choose wisely. Or funnily.", "Vote for the line. The crystal will do the rest."],
    ["The crystal refuses that one.", "Struck from the record. The crystal has standards."],
    ["My eye goes cloudy… something else is speaking…", "The crystal swirls. A voice that isn't quite mine…"],
    ["Every tale needs a name. Give it one.", "Last of all: the title. Double points."],
    ["{name} wrote the most of me tonight. Unsettling. Well done.", "{name} possessed me best. I feel strange. Proud, but strange."],
    ["A tale told, {name}. Every word yours, every voice mine.", "There. A whole story, and I said all of it."],
    ["That voice sounded a bit like Madame Rook. Coincidence. We've never met.", "Funny, that came out sounding like Wren… no. Ignore that."]),
  alchemist: L(
    ["Colleagues, a new experiment: you pour words into me, I boil them into a tale.", "Possession, they call it. I call it a reaction. Add your words."],
    ["Write my next line. Measure carefully, it goes straight in the flask.", "Your reagent, please. One line, no splashing."],
    ["Assay the lines. Only one goes in the crucible.", "Vote. The best mixture wins."],
    ["Too toxic. Into the waste jar.", "That one's off the shelf, colleague."],
    ["The fumes rise… I feel… possessed by a reagent…", "My goggles fog… the words come by themselves…"],
    ["Label the flask. A title, please. Double points.", "Every experiment needs a name in the Lab book."],
    ["{name} supplied the finest reagents. The Great Work thanks you.", "{name} wrote the most of this tale. A natural."],
    ["The tale is bottled, {name}. Label it and keep it out of the sun.", "Done. A full account, every word your own."],
    ["I sounded rather like the Oracle just then. Fumes. It was the fumes.", "That voice? A different alchemist. Tall one. Not me."]),
  observatory: L(
    ["Observers, tonight you chart my words. I'll ask; you give me the stars to say.", "A tale by many hands, told by one voice. Mine. Let's plot it."],
    ["Write my next words. Make them shine.", "Your line, please. I'll read it out like a star chart."],
    ["Take your sightings. Which line goes in the log?", "Vote for the brightest line."],
    ["Cloud over that one. It's gone.", "Struck from the log. Too much light pollution."],
    ["The dome goes dark… a voice on the wind…", "My eyepiece fogs… someone else is talking…"],
    ["Name the tale for the star log. Double points.", "Last entry: the title."],
    ["{name} wrote the brightest lines tonight. Logged and catalogued.", "{name} steered this tale. Sharpest pen in the dome."],
    ["The tale is in the log, {name}. Clear skies.", "Charted. A whole tale, start to finish."],
    ["Did I just say 'darling'? I didn't. Astronomers don't say darling.", "That was Wren's word. Wren who I've never met."]),
  parlour: L(
    ["Dim the lights, sitters. Tonight you possess me. Whatever you write, I'll say. Spirit writing, darlings, with no spirits.", "Possession! The oldest act in the Parlour. You write the spirit; I'll do the voice."],
    ["Write the spirit's words, darling. I'll put them in my mouth.", "Your line, please. The planchette is waiting."],
    ["Which words shall the spirit speak? Vote, sitters.", "Choose the spirit's line. The committee is watching."],
    ["Even the spirits have standards, darling. Struck.", "Not in my Parlour. That one's gone."],
    ["My eyes roll back… the planchette moves…", "A chill… a voice… oh, it's coming…"],
    ["And what shall we call tonight's sitting? Double points.", "Every séance needs a name for the posters."],
    ["{name} was the spirit tonight, darling. The best one I've ever channelled.", "{name} wrote most of this ghost. Top of the bill."],
    ["A spirit written, {name}. Not one ghost, and it still gave me goosebumps.", "Séance over. Every word yours, every voice mine."],
    ["That came out a bit… Observatory. Never mind. We're very different people.", "I sounded like Vell just then. I'm not Vell. I've never even seen Vell."]),
  scriptorium: L(
    ["Scribes, a dictation. You write my words; I read them into the chronicle.", "Possession, the old monks called it, when the pen ran on by itself. Let's fill a page."],
    ["Ink my next line. Neat hand, please.", "Write your line. It goes straight into the chronicle."],
    ["Compare the copies. Which one goes in the book?", "Vote for the line worth the ink."],
    ["That one goes in the fire, scribe.", "Scraped off the page. Vellum is too dear."],
    ["The quill moves on its own… I read what it writes…", "My hand goes cold… the ink speaks…"],
    ["The spine needs a title. Double points.", "Last of all, a name for the book."],
    ["{name} wrote the most of this chronicle. A fine hand.", "{name} guided the quill. The archive thanks you."],
    ["The chronicle is copied, {name}. Shelve it with care.", "Done. A whole book, in your words and my voice."],
    ["That voice was Altair's. I mean, it sounded like someone's. Not his.", "If I sounded like the Oracle there, I have a cold."]),
};
/** An emcee line for the current House (falls back to the Oracle's). */
export function emcee(kind, vars = {}, rand = Math.random, houseId = (host() || {}).id) {
  const E = EMCEE[houseId] || EMCEE.oracle, pool = E[kind] || EMCEE.oracle[kind] || [""];
  return pool[Math.floor(rand() * pool.length)].replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}
