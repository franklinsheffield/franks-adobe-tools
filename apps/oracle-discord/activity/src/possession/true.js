// Possession, True tales (the main mode): the House host narrates a REAL story from its own subject. At key beats a few
// players are picked to possess the host and answer a guiding question; their answer comes out of the host's mouth,
// then the host snaps back to what really happened. The tale ends with a "What really happened" card.
// Beat: { lv, narr (true, said first), ask, frame ({a} = the answer, the possessed line), truth (true, said after), fall }
// Level 1 tells the lv-1 beats (3), Level 2 adds lv-2 (5), Level 3 tells all 6. Every narr, truth and real line is a
// fact; anything uncertain is marked "the story goes", "a myth says" or "debated". Each truth and real line fits in a
// channel post line (140 characters).
const B = (lv, narr, ask, frame, truth, ...fall) => ({ lv, narr, ask, frame, truth, fall });

export const TRUE_TALES = {
  alchemist: [
    { id: "tr-brand", name: "The Light-Bearer", kind: "True tale · Hennig Brand finds phosphorus, 1669", beats: [
      B(1, "Hamburg, 1669. An alchemist named Hennig Brand is hunting the Philosopher's Stone, the thing said to turn metal into gold.",
        "Where does Brand think the gold is hiding?", "Brand rolls up his sleeves and declares: the gold is hiding in {a}!",
        "Brand chose urine. The story goes he hoped its golden colour meant gold inside.", "my left boot", "the neighbour's goat", "a very old cheese"),
      B(2, "He collects tubs and tubs of it, and leaves it standing for days until it stinks.",
        "What do the neighbours shout through the door?", "The neighbours bang on the door and shout: \"{a}!\"",
        "Nobody wrote down what the neighbours said. But the rotting was real: he let it stand for days before boiling it.", "Open a window", "We're calling the Guild", "Is that soup"),
      B(1, "He boils it down to a thick paste, then heats the paste as hot as his furnace will go.",
        "What does Brand hope will come out of the flask?", "Brand peers into the flask, hoping to see {a}.",
        "What came out was a white, waxy stuff that glowed a ghostly green in the dark.", "a solid gold duck", "his lost youth", "a tiny dragon"),
      B(3, "It glows with no flame at all. Brand names it phosphorus, Greek for 'light-bearer'.",
        "What is the first thing Brand does with his glowing goo?", "Brand's first move with the glowing goo: {a}.",
        "In truth he kept it a secret, hoping it was the key to the Stone.", "he uses it as a night light", "he paints a moustache on the cat", "he sells it as toothpaste"),
      B(2, "Word gets out anyway. Johann Daniel Kraft buys the secret and shows the glowing stuff at the courts of Europe.",
        "What does Kraft say to amaze the kings and queens?", "Kraft bows to the court and announces: \"{a}.\"",
        "His real show was simple: the green glow in a dark room. In 1680 Robert Boyle in London found his own way to make it.", "Behold, the Moon in a jar", "No touching, Your Majesty", "This came out of a bucket"),
      B(1, "Brand never found gold. But he is the first person in history known by name to have discovered a chemical element.",
        "If Brand could see us now, what would he say?", "And Brand's ghost whispers to us: \"{a}.\"",
        "The real ending: phosphorus is in your bones, your teeth and your DNA. He found something better than gold.", "I still want my gold", "Sorry about the smell", "Told you it was worth it"),
    ], real: [
      "Hennig Brand discovered phosphorus in Hamburg in 1669, while hunting the Philosopher's Stone.",
      "He made it by letting urine rot, boiling it down and heating what was left until it was very hot.",
      "It glowed green in the dark, so it was named phosphorus: Greek for 'light-bearer'.",
      "Johann Daniel Kraft showed it at European courts; Robert Boyle found his own method in 1680.",
      "Brand is the first person known by name to have discovered a chemical element.",
      "Phosphorus is in your bones, your teeth and your DNA.",
    ] },
  ],
  observatory: [
    { id: "tr-pluto", name: "Planet X", kind: "True tale · Clyde Tombaugh finds Pluto, 1930", beats: [
      B(1, "Flagstaff, Arizona, 1929. Lowell Observatory is hunting 'Planet X', a world its founder Percival Lowell believed lay beyond Neptune.",
        "What do the astronomers think Planet X looks like?", "The astronomers whisper that Planet X is surely {a}.",
        "Nobody knew. Lowell had died in 1916, still searching.", "a giant space potato", "covered in tiny hats", "shy"),
      B(1, "They hire a 22-year-old farm boy from Kansas, Clyde Tombaugh. He built his own telescopes and mailed them drawings of Mars and Jupiter.",
        "What else did Tombaugh mail along with his drawings?", "Along with the drawings, Tombaugh sent {a}.",
        "Just the drawings. They were good enough to get him the job.", "a pie from his mum", "a very polite letter from his cow", "his best sock"),
      B(2, "His job: photograph the same patch of sky days apart, then flick between the two plates in a 'blink comparator'. Stars stay put. A planet jumps.",
        "What's the most boring thing Tombaugh spots while blinking?", "After weeks of blinking, the most exciting thing Tombaugh spotted was {a}.",
        "It really was slow work: plate after plate, each holding tens of thousands of stars.", "a speck of dust named Gary", "his own eyelash", "the same star, again"),
      B(1, "On 18 February 1930, comparing two plates from January, he sees a tiny dot jump. Planet X!",
        "What does Tombaugh shout when he sees it?", "Tombaugh leaps from his chair and shouts: \"{a}!\"",
        "By his own account he walked into the director's office and said: 'Dr. Slipher, I have found your Planet X.'", "Mum, I'm famous", "It moved! It MOVED", "Nobody touch anything"),
      B(3, "The new world needs a name. In Oxford, England, an 11-year-old girl named Venetia Burney suggests one at breakfast.",
        "What name would YOU have given it?", "Venetia puts down her spoon and suggests: {a}.",
        "She said Pluto, the Roman god of the underworld. Her grandfather passed the idea on, and the name won.", "Kevin", "Planet McPlanetface", "Little Cold One"),
      B(2, "In 2006, astronomers reclassified Pluto as a dwarf planet.",
        "How did Pluto take the news?", "When Pluto heard the news, it {a}.",
        "Pluto didn't mind. In 2015 the New Horizons probe flew past it, carrying some of Tombaugh's ashes.", "sulked behind Neptune", "started a band", "asked for a recount"),
    ], real: [
      "Lowell Observatory in Flagstaff, Arizona, searched for a 'Planet X' beyond Neptune.",
      "Clyde Tombaugh, a young Kansas farm boy, was hired in 1929 after sending drawings of Mars and Jupiter.",
      "He found Pluto on 18 February 1930 by blinking between photographic plates taken in January.",
      "Venetia Burney, aged 11, in Oxford, suggested the name Pluto.",
      "Pluto was reclassified as a dwarf planet in 2006.",
      "New Horizons flew past Pluto in 2015, carrying some of Tombaugh's ashes.",
    ] },
  ],
  parlour: [
    { id: "tr-fox", name: "The Rappings at Hydesville", kind: "True tale · the Fox sisters, 1848", beats: [
      B(1, "Hydesville, New York, 1848. Two young sisters, Maggie and Kate Fox, tell their family the house fills with mysterious knocks at night.",
        "What do the sisters say is making the knocks?", "Little Kate points at the wall and says it's {a}.",
        "They said it was a spirit, and called it 'Mr. Splitfoot', an old nickname for the Devil.", "a woodpecker with a grudge", "Grandma's ghost, wanting biscuits", "the plumbing"),
      B(1, "On the night of 31 March, Kate snaps her fingers and says, 'Mr. Splitfoot, do as I do.' The knocks answer back.",
        "What does a neighbour ask the spirit?", "A neighbour presses an ear to the wall and asks: \"{a}\"",
        "They had it rap out answers, and the 'spirit' claimed to be a murdered peddler.", "Are you the one stealing my hens", "Knock twice if you're a cat", "Can you do requests"),
      B(2, "Soon their older sister Leah takes charge, and the girls give public sittings. Spiritualism is born, and it sweeps America.",
        "What's written on the poster for their show?", "The poster outside the hall reads: {a}!",
        "Their first public sitting was at Corinthian Hall, Rochester, in 1849. The committees who tested them found no trick.", "Ghosts, live, no refunds", "Bring your own spirit", "Now with extra knocking"),
      B(1, "For forty years people pay to hear the spirits rap. Judges, scientists and newspapers argue about it.",
        "What's the sisters' real secret?", "Psst, darlings. The real secret is {a}.",
        "The real secret came out in 1888, and it was hiding in their shoes.", "a very small drummer under the table", "two trained woodpeckers", "Leah, in the cupboard, with a spoon"),
      B(3, "In 1888, Maggie Fox steps onto the stage of the New York Academy of Music.",
        "What does the audience expect to see?", "The audience settles in, expecting {a}.",
        "Instead, Maggie confessed it was a trick and showed them: she cracked her toe joints, loud enough to hear across the hall.", "a ghost in a top hat", "a séance with free snacks", "Mr. Splitfoot himself"),
      B(2, "A year later, she took the confession back. But by then, everyone had heard the toes.",
        "What would Madame Rook tell the Fox sisters today?", "If I met the Fox sisters, I'd tell them: \"{a}.\"",
        "What I'd really say: knocks are easy, belief is the trick. Spiritualism carried on long after them.", "Lovely footwork, darlings", "Wear softer shoes", "Teach me the toe thing"),
    ], real: [
      "Maggie and Kate Fox claimed spirit rappings in Hydesville, New York, in 1848.",
      "Kate asked 'Mr. Splitfoot' to copy her finger snaps, and the raps answered.",
      "Their sittings started the Spiritualist movement; the first public one was in Rochester in 1849.",
      "In 1888 Maggie confessed at the New York Academy of Music and showed the raps were her toe joints.",
      "She took the confession back a year later, but the method was out.",
    ] },
  ],
  scriptorium: [
    { id: "tr-rosetta", name: "The Stone That Spoke Three Ways", kind: "True tale · the Rosetta Stone, 1799-1822", beats: [
      B(1, "Egypt, July 1799. French soldiers rebuilding a fort near the town of Rashid, which they called Rosetta, dig up a broken slab of dark stone.",
        "What did the soldiers hope they'd dug up?", "The soldiers gasp, hoping it's {a}.",
        "It was covered in writing, and an officer saw at once that it mattered.", "a pharaoh's lunchbox", "the world's oldest doorstop", "treasure, obviously"),
      B(1, "The writing came in three scripts: Egyptian hieroglyphs at the top, Demotic in the middle and ancient Greek at the bottom.",
        "What does the message on the stone say?", "The scribes read it out: it's {a}.",
        "It was a priests' decree from 196 BCE honouring King Ptolemy V. The same text, written three ways.", "a very long shopping list", "a complaint about the neighbours", "the first ever 'keep off the grass' sign"),
      B(2, "Scholars could read the Greek. But nobody had read hieroglyphs for well over a thousand years.",
        "What did people think hieroglyphs were?", "Learned people declared that hieroglyphs were {a}.",
        "Many believed every sign was a mystical symbol, never a sound. That mistake held everyone back.", "secret recipes for bread", "ancient doodles of cats", "instructions for building pyramids"),
      B(3, "In 1801 the British defeated the French in Egypt and took the stone. It has been in the British Museum since 1802.",
        "What did the French mutter as it was carried away?", "As the stone left, a French officer muttered: \"{a}.\"",
        "It was handed over under the Treaty of Alexandria in 1801. The French kept copies, and the race to read it began.", "We have copies, you know", "Mind the corners", "It was ugly anyway"),
      B(1, "In France, a young scholar named Jean-François Champollion studies the royal names circled in cartouches and compares them with the Greek.",
        "What's Champollion's secret study weapon?", "Champollion's secret weapon, every late night: {a}.",
        "His real secret weapon was Coptic, a late form of Egyptian he had learned. It showed him hieroglyphs could stand for sounds.", "seventeen cups of coffee", "a very clever cat", "a lucky quill"),
      B(2, "In 1822 he cracks it.",
        "What does Champollion shout?", "He bursts into his brother's office and cries: \"{a}!\"",
        "The story goes he cried 'Je tiens l'affaire!' ('I've got it!') and fainted. The world could read Egyptian again.", "The birds are letters", "Somebody fetch me a chair", "I can read the menu"),
    ], real: [
      "French soldiers found the Rosetta Stone near Rashid (Rosetta), Egypt, in July 1799.",
      "It carries one decree from 196 BCE in three scripts: hieroglyphic, Demotic and ancient Greek.",
      "The British took it in 1801 under the Treaty of Alexandria; it has been in the British Museum since 1802.",
      "Jean-François Champollion, helped by his knowledge of Coptic, announced the decipherment in 1822.",
    ] },
  ],
  oracle: [
    { id: "tr-delphi", name: "The Navel of the World", kind: "True tale · the Oracle of Delphi", beats: [
      B(1, "Ancient Greece. A myth says Zeus released two eagles from opposite ends of the world. Where they met, he marked the centre: Delphi.",
        "What did the eagles argue about on the way?", "Halfway there, the eagles squabbled about {a}.",
        "Myths don't record bird gossip. But the Greeks did set a carved stone there, the omphalos, 'the navel of the world'.", "who forgot the map", "the best worm in Greece", "whose turn it was to flap"),
      B(1, "Another myth says the god Apollo came to Delphi, slew a great serpent called Python, and took the place for his own.",
        "What were the serpent's last words?", "With its final hiss, the Python said: \"{a}.\"",
        "The myth says that's why Apollo's priestess was called the Pythia.", "I was here first", "Tell my eggs I love them", "Fine, keep it"),
      B(2, "People came from all over Greece to ask the Pythia questions. She sat on a tall tripod inside Apollo's temple.",
        "What's the silliest question anyone asked her?", "One pilgrim walked for weeks, just to ask: \"{a}\"",
        "Real questions were often practical: where to found a new city, or whether to go to war.", "Is my goat secretly a genius", "Where did I leave my sandal", "Will it rain on Tuesday"),
      B(1, "Herodotus tells of King Croesus of Lydia, who asked if he should attack Persia. The answer: if he did, a great empire would fall.",
        "How did Croesus celebrate the good news?", "Croesus was so pleased that he {a}.",
        "He attacked. And a great empire did fall: his own.", "threw a party with forty cakes", "bought a golden hat", "told everyone, loudly"),
      B(3, "Ancient writers said the Pythia breathed vapours rising from the ground. The writer Plutarch served as a priest at Delphi around 100 CE.",
        "What did the vapours smell like?", "Plutarch sniffed the air and wrote that it smelled of {a}.",
        "Plutarch did write of a sweet smell. Geologists later found faults under the temple and suggested gases, but it is still debated.", "old socks and honey", "burnt toast", "the future"),
      B(2, "The oracle spoke for more than a thousand years, until it fell silent in the late 300s CE.",
        "What were the oracle's very last words?", "And the oracle's very last words were: \"{a}.\"",
        "Nobody knows her last words. I like to think of the motto carved at the temple: 'Know thyself'.", "Please close the door on your way out", "I saw this coming", "Same time next millennium"),
    ], real: [
      "Greek myth placed the omphalos, the 'navel of the world', at Delphi, where Zeus's two eagles met.",
      "Myth says Apollo slew the serpent Python there; his priestess was called the Pythia.",
      "People asked the Pythia practical questions, such as where to found a city or whether to go to war.",
      "Herodotus says Croesus was told a great empire would fall if he attacked Persia. It was his own.",
      "Plutarch, a priest at Delphi around 100 CE, wrote of a sweet smell; the gas theory is still debated.",
      "'Know thyself' was carved at the temple. The oracle fell silent in the late 300s CE.",
    ] },
  ],
};
export const trueTalesFor = (houseId) => TRUE_TALES[houseId] || TRUE_TALES.oracle;
export const trueTaleById = (id) => Object.values(TRUE_TALES).flat().find((t) => t.id === id) || null;
/** The beats a level tells (no title beat: a true tale already has its name). */
export function trueBeatsFor(tale, level) {
  const L = Math.max(1, Math.min(3, level || 1)), out = []; let carry = "";
  for (const b of tale.beats) { if (b.lv > L) { carry += b.narr + " "; continue; } out.push(carry ? { ...b, narr: carry + b.narr } : b); carry = ""; }
  return out; // a skipped beat's narration still gets told, at the start of the next beat, so the true story stays whole
}
export const TRUE_LEVELS = [
  { n: 1, name: "A short tale", what: "3 possessions" },
  { n: 2, name: "The full story", what: "5 possessions" },
  { n: 3, name: "Every detail", what: "6 possessions" },
];
