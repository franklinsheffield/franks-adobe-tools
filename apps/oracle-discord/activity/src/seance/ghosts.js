// The Séance: Guess the Ghost. Each ghost is a famous magician, scientist, or both (the best ones were a little of
// each). The ghost raps out clues from vague to specific; the member first says what kind of ghost it is, then names it.
// Facts kept to well-documented history; "they say" marks a famous story that may not be literally true.

export const FIELDS = {
  magician: { name: "Magician", emoji: "🎩" },
  scientist: { name: "Scientist", emoji: "🔬" },
  both: { name: "A bit of both", emoji: "⚗️" },
};

export const GHOSTS = [
  {
    id: "houdini", name: "Harry Houdini", life: "1874–1926", field: "magician", emoji: "⛓️",
    aliases: ["houdini", "harry houdini", "erik weisz", "ehrich weiss", "erich weiss"],
    clues: [
      "I was born in Budapest, though I told everyone it was Appleton, Wisconsin.",
      "Handcuffs, straitjackets, locked trunks, jail cells: none of them could hold me.",
      "In my last years I hunted fake mediums, and in 1924 I sat on Scientific American's panel judging them.",
      "My wife and I agreed a secret code, so she'd know if a medium ever truly reached me after death.",
      "My most famous escape was the Chinese Water Torture Cell.",
    ],
    bio: "Harry Houdini, born Erik Weisz, became the world's most famous escape artist. He knew every trick a fake medium could use, so he spent his final years exposing them, including Boston's 'Margery' in 1924. After he died, his wife Bess held séances for ten years. The code never came through.",
    link: "A magician is the best person to catch a fake: they know exactly where to look.",
  },
  {
    id: "roberthoudin", name: "Jean-Eugène Robert-Houdin", life: "1805–1871", field: "magician", emoji: "⏱️",
    aliases: ["robert houdin", "houdin", "jean eugene robert houdin", "robert-houdin", "jean robert houdin"],
    clues: [
      "I was a French clockmaker before I was a conjurer.",
      "In 1845 I opened my own little theatre of magic in Paris.",
      "My Light and Heavy Chest grew too heavy to lift, thanks to a hidden electromagnet.",
      "In 1856 the French government sent me to Algeria to show my magic beat any local wonder-worker.",
      "A young American escape artist took my name and added an 'i'.",
    ],
    bio: "Robert-Houdin is often called the father of modern magic. He swapped wizard robes for evening dress and built clockwork automata and electrical tricks, real science disguised as wonder. Harry Houdini named himself after him.",
    link: "His best 'magic' was physics the audience hadn't heard of yet.",
  },
  {
    id: "maskelyne", name: "John Nevil Maskelyne", life: "1839–1917", field: "magician", emoji: "🎭",
    aliases: ["maskelyne", "john nevil maskelyne", "john maskelyne", "nevil maskelyne"],
    clues: [
      "Like another great magician, I began as a watchmaker.",
      "In 1865 I watched the Davenport brothers' spirit cabinet and glimpsed a free arm through a gap in the curtain.",
      "I rebuilt their whole act on stage to prove no spirits were needed.",
      "My London theatre, at the Egyptian Hall, was called England's Home of Mystery.",
      "I'm also credited with inventing the coin-operated lock for public toilets.",
    ],
    bio: "John Nevil Maskelyne turned a debunking into a career. After copying the Davenport brothers' 'spirit' act, he ran London's most famous magic theatre for decades, and attacked fraudulent mediums all his life.",
    link: "Copying a miracle is the fastest way to show it's a method.",
  },
  {
    id: "adelaide", name: "Adelaide Herrmann", life: "1853–1932", field: "magician", emoji: "👑",
    aliases: ["adelaide herrmann", "adelaide", "herrmann", "adelaide herman"],
    clues: [
      "I was born in London and began as a dancer and acrobat.",
      "I married a famous magician and became his assistant on stage.",
      "When my husband Alexander died in 1896, I kept the show going, on my own.",
      "I performed the deadly bullet-catch trick.",
      "They called me the Queen of Magic.",
    ],
    bio: "Adelaide Herrmann was one of the first women to headline a big magic show. After her husband's death she toured for decades as a star in her own right.",
    link: "The assistant knew every secret. She just needed the stage.",
  },
  {
    id: "chunglingsoo", name: "Chung Ling Soo", life: "1861–1918", field: "magician", emoji: "🔫",
    aliases: ["chung ling soo", "william robinson", "william ellsworth robinson", "ling soo"],
    clues: [
      "I was born in New York, but you'd never know it from my act.",
      "On stage I played a silent Chinese wizard and never spoke English in public.",
      "A real Chinese magician, Ching Ling Foo, was my furious rival.",
      "My signature trick was catching bullets fired at me.",
      "In 1918, at the Wood Green Empire in London, that trick went fatally wrong.",
    ],
    bio: "Chung Ling Soo was really William Robinson, an American who built his career on a costume. He died on stage when the trick gun really fired. It's a sad story, and a reminder that a persona isn't evidence of anything.",
    link: "The whole act was misdirection, right down to the name.",
  },
  {
    id: "pepper", name: "John Henry Pepper", life: "1821–1900", field: "both", emoji: "🪞",
    aliases: ["pepper", "john henry pepper", "john pepper", "professor pepper"],
    clues: [
      "I lectured on science at the Royal Polytechnic Institution in London.",
      "My famous ghost was nothing but glass and light.",
      "It first appeared on stage in 1862, in a scene from a Charles Dickens story.",
      "The idea came from an engineer, Henry Dircks, but my name is the one that stuck.",
      "Theme parks and concert holograms still use my ghost today.",
    ],
    bio: "John Henry Pepper was a science lecturer who made a ghost appear on stage with an angled sheet of glass reflecting a hidden, lit actor. Pepper's Ghost was a sensation, and it worked because it was optics, not spirits.",
    link: "A scientist with a showman's timing. Science is Magic, literally.",
  },
  {
    id: "dee", name: "John Dee", life: "1527–1608/9", field: "both", emoji: "🔮",
    aliases: ["john dee", "dee", "doctor dee", "dr dee"],
    clues: [
      "I was a mathematician, astronomer and adviser at the court of Queen Elizabeth I.",
      "I owned one of the largest libraries in England.",
      "They say I chose the date of the Queen's coronation by astrology.",
      "With Edward Kelley, I tried to talk to angels through a crystal and a scrying mirror.",
      "My black obsidian mirror, made in Aztec Mexico, is now in the British Museum.",
    ],
    bio: "John Dee mixed real mathematics and navigation with astrology and angel magic, which wasn't unusual in his time. His scrying sessions with Edward Kelley produced a whole 'angelic' language. Historians still argue about how much Kelley was conning him.",
    link: "A brilliant mind can still be fooled, especially by a partner who knows what it wants to hear.",
  },
  {
    id: "newton", name: "Isaac Newton", life: "1643–1727", field: "both", emoji: "🍎",
    aliases: ["newton", "isaac newton", "sir isaac newton"],
    clues: [
      "I was born on Christmas Day, by the old English calendar.",
      "I wrote a great deal, in secret, about alchemy.",
      "With a prism I showed that white light is a mix of all the colours.",
      "I ran the Royal Mint and hunted down counterfeiters.",
      "They say an apple got me thinking about gravity.",
    ],
    bio: "Isaac Newton gave us the laws of motion, universal gravitation and modern optics. He also spent years on alchemy and secret readings of scripture. The economist John Maynard Keynes, who bought his papers, called him 'the last of the magicians'.",
    link: "Even the father of physics spent his nights looking for the philosopher's stone.",
  },
  {
    id: "faraday", name: "Michael Faraday", life: "1791–1867", field: "scientist", emoji: "🧲",
    aliases: ["faraday", "michael faraday"],
    clues: [
      "I left school young and became a bookbinder's apprentice at 14.",
      "I read the science books I was binding, and they changed my life.",
      "In 1831 I found that a moving magnet makes an electric current.",
      "In 1853 I proved the table-turners were pushing their tables themselves.",
      "My Christmas Lectures for young people at the Royal Institution still run today.",
    ],
    bio: "Michael Faraday's discovery of electromagnetic induction powers every generator on Earth. He also took on the séance craze, using a clever rolling board to show that 'spirit' tables were pushed by honest sitters without them knowing it.",
    link: "He didn't call the table-turners liars. He showed them their own hands.",
  },
  {
    id: "curie", name: "Marie Curie", life: "1867–1934", field: "scientist", emoji: "☢️",
    aliases: ["curie", "marie curie", "maria sklodowska", "marie sklodowska curie", "madame curie"],
    clues: [
      "I was born in Warsaw, and studied at a secret 'Flying University'.",
      "My husband and I went to séances with a famous medium, to study her scientifically.",
      "I coined the word 'radioactivity'.",
      "I discovered two elements, and named one after my homeland.",
      "I was the first person to win two Nobel Prizes.",
    ],
    bio: "Marie Curie discovered polonium and radium and won Nobel Prizes in both physics and chemistry. Around 1905 she and Pierre attended séances with the medium Eusapia Palladino, curious whether any new force was at work. Palladino was later caught cheating.",
    link: "A real scientist stays curious about strange claims, and then tests them.",
  },
  {
    id: "tesla", name: "Nikola Tesla", life: "1856–1943", field: "scientist", emoji: "⚡",
    aliases: ["tesla", "nikola tesla"],
    clues: [
      "I was born in 1856 in what is now Croatia.",
      "I worked for Thomas Edison for a short time, and we didn't get along.",
      "In my Colorado Springs lab I made artificial lightning many metres long.",
      "The alternating current in your wall socket owes a lot to me.",
      "A unit of magnetic field strength is named after me.",
    ],
    bio: "Nikola Tesla developed the AC motor and power systems that run the modern world. He loved a dramatic demonstration, with giant sparks and glowing lamps, which made his science look like sorcery.",
    link: "Any sufficiently dramatic demo looks like magic.",
  },
  {
    id: "lovelace", name: "Ada Lovelace", life: "1815–1852", field: "scientist", emoji: "🧮",
    aliases: ["lovelace", "ada lovelace", "ada", "ada byron", "augusta ada king"],
    clues: [
      "My father was a famous poet I never really knew.",
      "My mother had me tutored in mathematics, partly to keep me away from poetry.",
      "I worked with Charles Babbage on his Analytical Engine.",
      "I wrote out steps for the machine to compute Bernoulli numbers.",
      "I called my way of thinking 'poetical science'.",
    ],
    bio: "Ada Lovelace, daughter of Lord Byron, saw that Babbage's engine could do more than arithmetic. It could manipulate any symbols, even music. Her notes are often called the first computer program.",
    link: "She imagined computers a century early. That's the kind of prophecy that holds up.",
  },
  {
    id: "galileo", name: "Galileo Galilei", life: "1564–1642", field: "scientist", emoji: "🔭",
    aliases: ["galileo", "galileo galilei", "galilei"],
    clues: [
      "I was born in Pisa.",
      "I cast horoscopes, for patrons and for money.",
      "I built better telescopes and turned them to the night sky.",
      "I saw four moons circling Jupiter.",
      "In 1633 the Inquisition put me on trial for saying the Earth moves around the Sun.",
    ],
    bio: "Galileo's telescope showed Jupiter's moons, the phases of Venus and the rough face of the Moon, all evidence against an Earth-centred universe. Like many scholars of his day he also cast horoscopes, but it was observation, not the stars, that made his name.",
    link: "Look for yourself. It's the oldest rule of science and still the best.",
  },
];

export const TITLES = [{ at: 0, name: "Curious" }, { at: 3, name: "Medium-rare" }, { at: 6, name: "Ghost Whisperer" }, { at: 9, name: "Spirit Scholar" }, { at: GHOSTS.length, name: "Master of the Séance" }];
