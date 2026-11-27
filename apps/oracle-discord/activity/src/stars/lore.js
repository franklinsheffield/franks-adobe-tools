// Star Lore Navigator: the constellations you draw, the fables the Oracle tells while you draw them, and the real
// astronomy. Original retellings for Science is Magic of traditional stories; each fable names the culture it comes
// from. Distances are rounded; where astronomers or historians disagree, the text says so.
// fig: the HIP stars of the stick figure to draw (edges come from the IAU-style figure in sky.gen.js FIGURES);
// omitted = the whole figure. fables: a pool, one is told per drawing, a part at a time as the lines go in.

export const DECK = [
  { id: "ori", con: "Ori", name: "Orion", emoji: "🏹", fig: [27989, 25336, 26207, 25930, 26311, 26727, 27366, 24436, 25281],
    find: "A great hunter on the celestial equator, with three bright stars in a row for his belt.",
    fables: [
      { c: "Ancient Greece", t: "Orion and the Scorpion", parts: [
        "Orion was a giant and the greatest hunter who ever lived.",
        "One day he boasted that he would hunt down every animal on Earth.",
        "Gaia, the Earth herself, heard him and grew afraid for her creatures.",
        "So she sent a small scorpion, and its sting brought the mighty hunter down.",
        "The gods set both in the sky on opposite sides. To this day Orion sinks in the west as soon as the Scorpion rises in the east." ] },
      { c: "Ancient China", t: "The brothers who never meet", parts: [
        "Long ago, the legendary emperor Ku had two sons, Shen and Shang.",
        "They quarrelled so bitterly that they fought every single day.",
        "At last their father sent them to opposite ends of the land: Shang to watch the Heart star in the east, Shen to watch the three stars of the west.",
        "Their stars still keep them apart. When Shen, the three stars of Orion's belt, is in the sky, Shang's red star in the Scorpion is gone.",
        "In China, people who never get to see each other are still said to be 'like Shen and Shang'." ] },
      { c: "Ancient Egypt", t: "Sah, the soul of Osiris", parts: [
        "The Egyptians saw a striding figure here: Sah, the star form of Osiris, god of death and rebirth.",
        "Osiris had been killed by his jealous brother Set, and brought back by his wife, Isis.",
        "Isis followed him across the heavens as the brilliant star Sopdet, which we call Sirius.",
        "Texts carved inside the pyramids hoped the dead king would rise into the sky and join Sah.",
        "So each night, as Orion rose, the Egyptians saw the promise of life after death." ] },
      { c: "Lakota (North America)", t: "The Hand", parts: [
        "To the Lakota, the belt, the sword and the stars around them form a great Hand.",
        "In one telling, a chief who would not share with his people lost his arm to the Thunder Beings, who placed it in the sky.",
        "The chief's daughter promised to marry whoever brought the arm back.",
        "The hero Fallen Star, son of a star, won it back for the people.",
        "When the Hand disappears into the sunset in spring, it is a sign that the season is turning." ] },
    ],
    science: [
      "Betelgeuse, the red shoulder, is a red supergiant roughly 550 light-years away (estimates range from about 500 to 650). In 2019 and 2020 it dimmed sharply, the Great Dimming, because it puffed out a cloud of dust.",
      "Rigel, the blue-white foot, is a blue supergiant about 860 light-years away, tens of thousands of times as luminous as the Sun.",
      "The belt stars only look like a neat row from Earth: they lie between about 700 and 2,000 light-years away. The fuzzy patch below them is the Orion Nebula, where new stars are forming.",
    ],
    quiz: { q: "Why did Betelgeuse dim so much in 2019 and 2020?", a: "It puffed out a cloud of dust that blocked some of its light", wrong: ["It exploded as a supernova", "The Moon passed in front of it", "Earth's orbit moved away from it"] } },

  { id: "uma", con: "UMa", name: "The Big Dipper", emoji: "🐻", fig: [54061, 59774, 53910, 58001, 62956, 65378, 67301],
    find: "Seven bright stars in the far north shaped like a ladle: a four-star bowl and a bent three-star handle.",
    fables: [
      { c: "Ancient Greece", t: "Callisto the bear", parts: [
        "Callisto was a huntress who roamed the forests of Arcadia.",
        "Zeus fell in love with her, and Hera, his queen, was furious.",
        "In most tellings Hera turned Callisto into a bear, and for years she wandered alone in the woods.",
        "Zeus lifted her into the sky as the Great Bear, where she circles the pole forever.",
        "Her seven brightest stars are the ones you just joined." ] },
      { c: "Mi'kmaq (eastern Canada)", t: "The bear and the seven hunters", parts: [
        "The four stars of the bowl are a great bear, waking from her den in spring.",
        "Seven bird hunters follow her: Robin, Chickadee, Moose Bird and their friends. The handle stars are the first three.",
        "All summer they chase her across the northern sky.",
        "Little Chickadee carries a cooking pot. You can see it: the faint star Alcor, right beside Mizar in the handle.",
        "In autumn the hunters catch the bear, and her blood drips onto the forest. That is why the leaves turn red." ] },
      { c: "Ancient India", t: "The Seven Sages", parts: [
        "In Hindu tradition these seven stars are the Saptarishi, seven great sages.",
        "Their wisdom was said to guard the knowledge of the world from age to age.",
        "Beside the sage Vasishtha, the middle star of the handle, shines his faithful wife Arundhati: the faint star Alcor.",
        "At weddings, newlyweds were traditionally shown the pair, a model of a lasting marriage.",
        "So when you find Mizar and Alcor, you find two of the most loyal stars in the sky." ] },
    ],
    science: [
      "The Big Dipper is an asterism, the brightest part of the constellation Ursa Major.",
      "Five of its seven stars travel through space together as the Ursa Major Moving Group, about 80 light-years away. Dubhe and Alkaid move differently, so in about 100,000 years the shape will be different.",
      "The two stars at the end of the bowl, Merak and Dubhe, point to Polaris, the North Star.",
    ],
    quiz: { q: "Why will the Big Dipper's shape change over 100,000 years?", a: "Its stars move through space in different directions", wrong: ["The Sun will grow and hide it", "Its stars will all burn out", "The Moon slowly pulls on them"] } },

  { id: "cas", con: "Cas", name: "Cassiopeia", emoji: "👑",
    find: "Five bright stars in a zigzag W, in the Milky Way across the pole from the Big Dipper.",
    fables: [
      { c: "Ancient Greece", t: "The boastful queen", parts: [
        "Cassiopeia was queen of Aethiopia, and she was proud.",
        "She boasted that she and her daughter Andromeda were more beautiful than the sea nymphs.",
        "The sea god Poseidon sent a monster, Cetus, to ravage her coast.",
        "To save the kingdom, Andromeda was chained to a rock as an offering, until the hero Perseus flew in and rescued her.",
        "Cassiopeia was set in the sky on her throne, and as the sky turns she hangs upside down half the night, a lesson in humility." ] },
      { c: "Arabic star lore", t: "The hand stained with henna", parts: [
        "Long before the Greek names reached them, Arabian stargazers had their own pictures.",
        "These stars were part of al-Kaff al-Khaḍīb, 'the hand stained with henna'.",
        "Henna is the red-brown dye painted on hands for weddings and celebrations.",
        "The great hand reached out across the sky toward the Pleiades.",
        "The name of the brightest star, Schedar, still comes from Arabic: 'the breast'." ] },
    ],
    science: [
      "In 1572 a new star blazed up in Cassiopeia, brighter than Venus. Tycho Brahe proved it was far beyond the Moon. It was a supernova, and it showed that the heavens can change.",
      "Cassiopeia A, the remains of another supernova here, is the brightest radio source in the sky beyond the solar system.",
      "From mid-northern latitudes Cassiopeia never sets: it circles the pole all night, all year.",
    ],
    quiz: { q: "What did Tycho Brahe's 'new star' of 1572 turn out to be?", a: "A supernova, an exploding star", wrong: ["A comet", "The planet Uranus", "A meteor"] } },

  { id: "sco", con: "Sco", name: "Scorpius", emoji: "🦂",
    find: "A long curved hook of stars like a scorpion's tail, with a red heart near its head.",
    fables: [
      { c: "Māori (Aotearoa New Zealand)", t: "Māui's fishhook", parts: [
        "Māui was a clever demigod, and his brothers never wanted to take him fishing.",
        "So he hid in the bottom of their canoe, with a magic hook made from his grandmother's jawbone.",
        "Far out at sea he dropped his line, and it caught on something enormous.",
        "He hauled up a giant fish, which became Te Ika-a-Māui, the North Island of New Zealand.",
        "His hook was flung into the sky: the curve of the Scorpion's tail, Te Matau a Māui." ] },
      { c: "Ancient Greece", t: "The hunter's bane", parts: [
        "When Orion threatened to kill every animal on Earth, a tiny scorpion was sent to stop him.",
        "Some say Gaia sent it; others say the goddess Artemis.",
        "The scorpion struck, and the giant fell.",
        "Both were raised into the sky, but never side by side.",
        "Watch in summer: as the Scorpion climbs in the east, Orion has long since fled below the western horizon." ] },
      { c: "Ancient China", t: "The Azure Dragon's heart", parts: [
        "The Chinese sky was guarded by four great animals, one for each direction.",
        "The Azure Dragon of the East ruled spring, and these stars were part of its body.",
        "Its red heart was Antares, called Da Huo, the Great Fire.",
        "Farmers watched where the Great Fire stood at dusk to know when to plant and when to harvest.",
        "And the Heart is the star of Shang, the quarrelsome brother who must never meet Shen in Orion." ] },
    ],
    science: [
      "Antares is a red supergiant about 550 light-years away. In the Sun's place it would swallow the orbit of Mars. Its name means 'rival of Ares', the Greek Mars, because the two look alike.",
      "The Sun spends only about a week in Scorpius each year, and longer in its neighbour Ophiuchus, the 'thirteenth' zodiac constellation.",
      "The centre of our galaxy lies just east of Scorpius, toward Sagittarius, about 26,000 light-years away.",
    ],
    quiz: { q: "What does the name Antares mean?", a: "Rival of Mars (Ares)", wrong: ["Heart of the scorpion", "The first star", "Red giant"] } },

  { id: "cru", con: "Cru", name: "The Southern Cross", emoji: "✝️",
    find: "A small, bright kite of four stars deep in the southern Milky Way, beside two very bright pointer stars.",
    fables: [
      { c: "Aboriginal Australian", t: "The Emu in the Sky", parts: [
        "Look beside the Cross for a patch of sky with no stars: a dark cloud.",
        "For many Aboriginal peoples that darkness is the head of a great emu, and the dark lanes of the Milky Way are its neck and body.",
        "In autumn evenings the Emu stretches across the sky as if running. That is when emus on the ground are laying their eggs.",
        "Later in the year only its body sits low in the sky, like a bird resting on its nest.",
        "It was a calendar written in darkness, telling people when to gather eggs and when to leave them be." ] },
      { c: "Inca (Andes)", t: "Yacana the llama", parts: [
        "The Inca saw animals in the dark clouds of the Milky Way, which they called Mayu, the river.",
        "Near the Cross walks Yacana, a great llama.",
        "Her eyes are the two bright Pointer stars, llamacñawin, 'the eyes of the llama'.",
        "At midnight Yacana drinks water from the sea, and that is what keeps the world from flooding.",
        "Below her, a little dark llama, her baby, follows close behind." ] },
    ],
    science: [
      "Crux is the smallest of the 88 constellations. Ancient Greek astronomers counted its stars as part of Centaurus; Earth's slow wobble, precession, has since lowered it out of view from the Mediterranean.",
      "The Coalsack beside it is a dark nebula, a cloud of dust about 600 light-years away that blocks the stars behind it.",
      "The two Pointers are not a pair. Alpha Centauri is the nearest star system to us, 4.4 light-years away; Beta Centauri is about 390 light-years away.",
    ],
    quiz: { q: "What is the dark Coalsack beside the Southern Cross?", a: "A cloud of dust blocking the stars behind it", wrong: ["A black hole", "A gap with no stars at all", "The shadow of Earth"] } },

  { id: "cyg", con: "Cyg", name: "Cygnus the Swan", emoji: "🦢",
    find: "A great cross, or a swan flying down the Milky Way with outstretched wings, its tail a very bright star.",
    fables: [
      { c: "Ancient Greece", t: "Cycnus and his lost friend", parts: [
        "Phaethon, son of the Sun, begged to drive his father's chariot for a single day.",
        "He lost control, the horses ran wild and scorched the Earth, and Zeus struck him down into the river Eridanus.",
        "His friend Cycnus dived again and again into the river, searching for him.",
        "The gods, moved by his grief, turned Cycnus into a swan, the bird that glides on rivers.",
        "And they set him among the stars, flying forever along the river of the Milky Way." ] },
      { c: "Ancient China", t: "The bridge of magpies", parts: [
        "On one bank of the Silver River lives the Weaver Girl; on the other, her husband the Cowherd.",
        "The Queen of Heaven separated them, and they may meet only once a year.",
        "On the seventh night of the seventh month, every magpie on Earth flies up to the sky.",
        "Wing to wing, they make a bridge across the river so the lovers can cross.",
        "Some say the bright star of the Swan's tail, Deneb, marks where that bridge is built." ] },
    ],
    science: [
      "Deneb, the tail, is one of the most luminous stars visible to the naked eye, somewhere around 1,500 to 2,600 light-years away; astronomers still disagree.",
      "Albireo, the swan's beak, looks like one star by eye, but a small telescope splits it into a gold star and a blue one.",
      "Cygnus X-1, discovered by its X-rays, was the first object widely accepted as a black hole.",
    ],
    quiz: { q: "What is Cygnus X-1?", a: "One of the first known black holes", wrong: ["A planet with rings", "The swan's brightest star", "A meteor shower"] } },

  { id: "leo", con: "Leo", name: "Leo the Lion", emoji: "🦁",
    find: "A crouching lion: a backward question mark for its mane and a triangle for its hindquarters.",
    fables: [
      { c: "Ancient Greece", t: "The Nemean Lion", parts: [
        "A lion with golden fur was terrorising the hills of Nemea.",
        "Its hide was so tough that no arrow, spear or sword could pierce it.",
        "Heracles was sent to kill it as the first of his twelve labours. His arrows bounced off.",
        "So he cornered the lion in its cave and wrestled it bare-handed until it moved no more.",
        "He wore its skin as armour ever after, and the lion took its place among the stars." ] },
      { c: "Ptolemaic Egypt", t: "Berenice's hair", parts: [
        "Behind the lion's tail lies a faint, glittering patch of stars.",
        "In about 246 BCE, Queen Berenice II of Egypt vowed her beautiful long hair to the gods if her husband came home safe from war.",
        "He returned, and she cut her hair and laid it in a temple. The next morning it was gone.",
        "The court astronomer, Conon, announced that the gods had taken it up to the sky, and pointed to these stars.",
        "Ancient star maps had counted them as the tuft of the lion's tail. Today they are the constellation Coma Berenices." ] },
    ],
    science: [
      "Regulus, the lion's heart, is about 79 light-years away and spins once in about 16 hours, so fast it bulges at the equator.",
      "The Leonid meteor shower each November seems to come from Leo. The meteors are dust left by Comet Tempel-Tuttle.",
      "Regulus sits almost exactly on the ecliptic, the Sun's yearly path, so the Moon often passes in front of it.",
    ],
    quiz: { q: "What makes the Leonid meteors each November?", a: "Dust left by Comet Tempel-Tuttle", wrong: ["Stars falling out of Leo", "Pieces of the Moon", "Lightning in the upper air"] } },

  { id: "tau", con: "Tau", name: "Taurus the Bull", emoji: "🐂", fig: [21421, 26451, 20894, 20205, 20455, 20889, 25428],
    find: "A charging bull: a V of stars for its face, a fiery orange eye and two long horns.",
    fables: [
      { c: "Mesopotamia", t: "The Bull of Heaven", parts: [
        "In the Epic of Gilgamesh, one of the oldest written stories, the goddess Ishtar offered to marry the hero-king Gilgamesh.",
        "He refused her, rudely.",
        "Furious, Ishtar sent the Bull of Heaven down to Earth. Its snorting opened pits in the ground.",
        "Gilgamesh and his friend Enkidu fought the bull and killed it.",
        "Babylonian astronomers called these stars GU.AN.NA, the Bull of Heaven." ] },
      { c: "Ancient Greece", t: "Europa and the white bull", parts: [
        "Princess Europa was picking flowers by the sea with her friends.",
        "A gleaming white bull with gentle eyes walked out of the herd and lay down at her feet.",
        "She climbed onto its back, and it leapt into the sea and swam away with her.",
        "The bull was Zeus in disguise. He carried her to Crete, and she became its first queen.",
        "A whole continent, Europe, is named after her." ] },
      { c: "Māori (Aotearoa New Zealand)", t: "Matariki", parts: [
        "On the bull's shoulder sits a tiny, tight cluster of blue stars.",
        "To Māori it is Matariki, the mother star and her children.",
        "When Matariki reappears in the dawn sky in midwinter, in June or July, the new year begins.",
        "It is a time to remember those who died in the past year, celebrate the harvest and plan the year ahead.",
        "Since 2022 Matariki has been a public holiday in Aotearoa New Zealand." ] },
    ],
    science: [
      "The V-shaped face is the Hyades, the nearest star cluster, about 150 light-years away. The orange eye, Aldebaran, is not part of it: it is closer, about 65 light-years.",
      "The Pleiades on the bull's shoulder are a cluster of hot young stars, about 100 million years old and about 440 light-years away.",
      "The Crab Nebula near one horn tip is the remains of a supernova Chinese astronomers recorded in 1054 CE. It was visible in daylight for weeks.",
    ],
    quiz: { q: "Who recorded the 1054 CE supernova that made the Crab Nebula?", a: "Chinese astronomers", wrong: ["Galileo", "The ancient Greeks", "NASA's Hubble telescope"] } },

  { id: "gem", con: "Gem", name: "Gemini the Twins", emoji: "👬",
    find: "Two long, parallel lines of stars, like twins side by side, topped by two bright stars close together.",
    fables: [
      { c: "Ancient Greece", t: "The twins who shared one life", parts: [
        "Castor and Pollux were twin brothers. Pollux was the son of Zeus and immortal; Castor was mortal.",
        "They did everything together: Castor tamed horses, and Pollux was the finest boxer in Greece.",
        "When Castor was killed in a fight, Pollux wept and begged Zeus to let him die too.",
        "Zeus offered a bargain: the twins could share Pollux's immortality, spending their days together, half among the gods and half below.",
        "So they stand side by side in the sky, never parted again." ] },
      { c: "Ancient Greece", t: "The storm on the Argo", parts: [
        "The twins sailed with Jason and the Argonauts in search of the Golden Fleece.",
        "One night a terrible storm struck, and the crew feared the ship would sink.",
        "Then two flames appeared, flickering above the twins' heads, and the sea grew calm.",
        "Ever after, sailors prayed to Castor and Pollux as protectors of ships.",
        "When glowing electrical light flickers on a ship's mast in a storm, which we call St. Elmo's fire, Greek sailors said the twins had come aboard." ] },
    ],
    science: [
      "Castor looks like one star but is six: three pairs of stars orbiting each other, about 51 light-years away.",
      "Pollux is an orange giant about 34 light-years away with a planet more massive than Jupiter.",
      "William Herschel discovered Uranus in Gemini in 1781, and Clyde Tombaugh found Pluto in 1930 on photographs of this part of the sky.",
    ],
    quiz: { q: "How many stars make up Castor?", a: "Six, in three pairs", wrong: ["One", "Two", "Twelve"] } },

  { id: "lyr", con: "Lyr", name: "Lyra the Lyre", emoji: "🎼",
    find: "A small lyre: a neat parallelogram of faint stars hanging from one very bright blue-white star.",
    fables: [
      { c: "Ancient Greece", t: "Orpheus and his lyre", parts: [
        "Orpheus played the lyre so beautifully that animals followed him and rivers paused to listen.",
        "When his wife Eurydice died, he walked into the underworld to bring her back.",
        "His music softened even Hades, who agreed, on one condition: Orpheus must not look back until they reached the daylight.",
        "At the very last step he turned to see her, and she faded away forever.",
        "After Orpheus died, the Muses placed his lyre among the stars, its brightest note Vega." ] },
      { c: "Ancient China and Japan", t: "The Weaver Girl", parts: [
        "Bright Vega is Zhinü, the Weaver Girl, who wove the clouds for heaven.",
        "She fell in love with a mortal cowherd, Niulang, and they married in secret.",
        "Her mother, the Queen of Heaven, was so angry she pulled out her hairpin and scratched a river across the sky between them: the Milky Way.",
        "Only once a year, on the seventh night of the seventh month, can the lovers meet.",
        "China celebrates that night as Qixi, and Japan as Tanabata, when people hang wishes on bamboo." ] },
    ],
    science: [
      "Vega is about 25 light-years away. In 1850 it was the first star other than the Sun to be photographed.",
      "In 1983 the IRAS satellite found a disk of dust around Vega, an early clue that other stars have planet-making material.",
      "Because Earth's axis slowly wobbles, Vega will be a rough pole star in about 12,000 years.",
    ],
    quiz: { q: "What was special about Vega in 1850?", a: "It was the first star other than the Sun to be photographed", wrong: ["It was the first star found to have a planet", "It exploded", "It became the pole star"] } },

  { id: "aql", con: "Aql", name: "Aquila the Eagle", emoji: "🦅",
    find: "A soaring eagle in the Milky Way, its bright heart flanked by a fainter star on each side.",
    fables: [
      { c: "Ancient China", t: "The Cowherd and his children", parts: [
        "Bright Altair is Niulang, the Cowherd, husband of the Weaver Girl across the Silver River.",
        "When the Queen of Heaven took his wife away, he chased after her carrying their two children.",
        "He carried them in baskets on a pole over his shoulder.",
        "Look closely: the two fainter stars on either side of Altair are the children in their baskets.",
        "Every year, on the night of Qixi, the little family waits for the magpie bridge." ] },
      { c: "Ancient Greece", t: "The eagle of Zeus", parts: [
        "The eagle was the bird of Zeus, king of the gods.",
        "It carried his thunderbolts and flew his errands across the world.",
        "In one story Zeus sent it, or became it, to carry a Trojan youth named Ganymede up to Olympus to be cupbearer of the gods.",
        "Ganymede is remembered in the sky too, next door, as Aquarius the water carrier.",
        "And the eagle soars beside him along the Milky Way." ] },
    ],
    science: [
      "Altair is one of the closest bright stars, about 17 light-years away.",
      "It spins once in about 9 hours, so fast that it is squashed: wider at the equator than from pole to pole.",
      "With Vega and Deneb it makes the Summer Triangle, a pattern that spans the Milky Way.",
    ],
    quiz: { q: "Why is Altair squashed into an oval?", a: "It spins very fast, once in about 9 hours", wrong: ["A planet pulls on it", "It is cooling down", "It is made of gas that leaks out"] } },

  { id: "cma", con: "CMa", name: "Canis Major", emoji: "🐕", fig: [30324, 32349, 33977, 34444, 33856, 33579, 30122, 35904],
    find: "Orion's big hunting dog, below and to the left of the hunter, with the brightest star of the night on its chest.",
    fables: [
      { c: "Ancient Greece", t: "The dog that always caught its prey", parts: [
        "Laelaps was a magical hound fated to catch anything it chased.",
        "Meanwhile a giant fox was ravaging the city of Thebes, a fox fated never to be caught.",
        "The people set Laelaps on the fox, and the chase went round and round, forever.",
        "Zeus saw the impossible puzzle and ended it by turning both animals to stone.",
        "Then, in many tellings, he raised the dog into the sky as Canis Major." ] },
      { c: "Ancient Egypt", t: "Sopdet and the flood", parts: [
        "The brilliant star on the dog's chest was Sopdet to the Egyptians, linked with the goddess Isis.",
        "For about 70 days each year Sopdet vanished into the Sun's glare.",
        "Then one summer morning she reappeared, glinting low in the east just before dawn.",
        "Around that time the Nile began its yearly flood, which watered the fields and fed Egypt.",
        "So Sopdet's return was celebrated as the start of a new year." ] },
    ],
    science: [
      "Sirius is the brightest star of the night sky because it is close, 8.6 light-years away, and about 25 times as luminous as the Sun.",
      "Its companion Sirius B is a white dwarf: a dead star core about the size of Earth with about the mass of the Sun.",
      "The 'dog days' of summer are named after it: in ancient Greece and Rome, Sirius rose with the Sun in the hottest weeks.",
    ],
    quiz: { q: "What is Sirius B?", a: "A white dwarf: a dead star core about the size of Earth", wrong: ["A moon of Sirius", "A second bright star we see by eye", "A black hole"] } },

  { id: "umi", con: "UMi", name: "The Little Dipper", emoji: "⭐",
    find: "A small, faint dipper whose handle ends at the North Star, the star the whole sky turns around.",
    fables: [
      { c: "Ancient Greece", t: "Arcas and the bear", parts: [
        "Callisto, turned into a bear, had a son named Arcas, who grew up to be a hunter.",
        "One day in the forest he met a bear, not knowing it was his own mother.",
        "He raised his spear to strike.",
        "Zeus stopped him just in time and lifted them both into the sky: Callisto as the Great Bear, Arcas beside her as the Little Bear.",
        "Hera was so angry that she asked the sea god never to let the bears bathe in the ocean. That is why, from Greece, they never set." ] },
      { c: "Navigators", t: "The star that stands still", parts: [
        "Every other star wheels across the sky through the night.",
        "But the star at the end of this little handle hardly moves at all.",
        "Greek writers said Phoenician sailors steered by these stars, while Greek sailors used the Great Bear.",
        "Centuries later, people escaping slavery in the United States followed the North Star toward freedom. The song 'Follow the Drinking Gourd' tells of it, though historians debate how old the song really is.",
        "Find the North Star, and you will always know which way is north." ] },
    ],
    science: [
      "Polaris is about 430 light-years away and less than one degree from the north celestial pole. Its height above your horizon equals your latitude.",
      "It is not very bright, only about the 48th brightest star, and it is a Cepheid: it gently pulses in brightness.",
      "The pole star changes over a 26,000-year wobble of Earth's axis. When the pyramids were built it was Thuban, in Draco.",
    ],
    quiz: { q: "Which star was the pole star when the Egyptian pyramids were built?", a: "Thuban, in Draco", wrong: ["Polaris", "Sirius", "Vega"] } },

  { id: "boo", con: "Boo", name: "Boötes the Herdsman", emoji: "🪁", fig: [67927, 69673, 71053, 71075, 73555, 74666, 72105],
    find: "A kite of stars with a very bright orange star at its tail. Follow the curve of the Big Dipper's handle to it.",
    fables: [
      { c: "Hawaiʻi", t: "The star of gladness", parts: [
        "The bright orange star at the kite's tail is Hōkūleʻa, the star of gladness.",
        "It passes almost straight overhead in Hawaiʻi.",
        "Navigators sailing home from Tahiti steered north until Hōkūleʻa climbed to the very top of the sky, and then they knew the islands were near.",
        "In 1976 a voyaging canoe named Hōkūleʻa sailed from Hawaiʻi to Tahiti with no instruments at all, guided by the navigator Mau Piailug.",
        "It showed the world that Polynesians could have crossed the ocean on purpose, reading the stars, the swells and the birds." ] },
      { c: "Ancient Greece", t: "Icarius and the first wine", parts: [
        "The god Dionysus taught a kind farmer named Icarius how to make wine.",
        "Icarius proudly shared it with some shepherds, who drank far too much.",
        "Waking dizzy, they thought they had been poisoned, and in their anger they killed him.",
        "His loyal dog, Maera, led his daughter Erigone to his body.",
        "The gods placed them in the sky: Icarius as Boötes, Erigone as Virgo, and faithful Maera as the Little Dog." ] },
    ],
    science: [
      "Arcturus, at the tail of the kite, is an orange giant about 37 light-years away, the brightest star in the northern half of the sky.",
      "It races through the galaxy faster than the Sun and in a different direction, perhaps a star from a small galaxy the Milky Way swallowed long ago.",
      "In 1933 light from Arcturus was used to switch on the Chicago World's Fair.",
    ],
    quiz: { q: "Why could Hawaiian navigators use Arcturus to find home?", a: "It passes almost straight overhead in Hawaiʻi", wrong: ["It never moves in the sky", "It only shines over islands", "It points to the South Pole"] } },

  { id: "peg", con: "Peg", name: "Pegasus", emoji: "🐎", fig: [677, 113881, 1067, 113963, 112447, 112029, 109427, 107315],
    find: "A great square of four stars, the body of a winged horse, with its neck stretching away from one corner.",
    fables: [
      { c: "Ancient Greece", t: "The winged horse", parts: [
        "When the hero Perseus cut off the head of Medusa, a winged white horse sprang out: Pegasus.",
        "No one could ride him, until the hero Bellerophon was given a golden bridle by the goddess Athena.",
        "Together they defeated the fire-breathing Chimera.",
        "But Bellerophon grew proud and tried to ride Pegasus all the way up to Mount Olympus.",
        "Zeus sent a gadfly to sting the horse. Bellerophon fell back to Earth, and Pegasus flew on alone, into the stars." ] },
      { c: "Babylon", t: "The Field of Heaven", parts: [
        "Long before Pegasus, Babylonian astronomers looked at this great square too.",
        "They called it IKU, the Field: a unit for measuring farmland.",
        "Its name is written in the MUL.APIN, a star catalogue on clay tablets from about 1000 BCE.",
        "To them the sky was a land of fields, rivers and animals, mirroring life along the Euphrates.",
        "Some of their star pictures, like the Bull and the Scorpion, are still with us today." ] },
    ],
    science: [
      "In 1995 Michel Mayor and Didier Queloz found the first planet orbiting a Sun-like star, around 51 Pegasi, about 50 light-years away. It won the 2019 Nobel Prize in Physics.",
      "The Great Square is so large that the full Moon would fit inside it many times, yet few stars are seen within it by eye.",
      "The square's northeast corner, Alpheratz, officially belongs to Andromeda: the two constellations share it.",
    ],
    quiz: { q: "What was found around the star 51 Pegasi in 1995?", a: "The first planet found orbiting a Sun-like star", wrong: ["A black hole", "A new comet", "Life"] } },

  { id: "aur", con: "Aur", name: "Auriga the Charioteer", emoji: "🐐",
    find: "A big pentagon of stars, high in the winter Milky Way, with brilliant yellow Capella at one corner.",
    fables: [
      { c: "Ancient Greece", t: "The goat who raised a god", parts: [
        "When Zeus was a baby, his mother hid him in a cave on Crete so his father Cronus could not swallow him.",
        "There he was fed by a goat named Amalthea.",
        "One day the infant god, playing, snapped off one of her horns.",
        "He blessed it to overflow forever with food and drink: the cornucopia, the horn of plenty.",
        "The bright star Capella, 'the little she-goat', is Amalthea, and the small triangle beside her is her kids." ] },
      { c: "Ancient Greece", t: "The charioteer", parts: [
        "Erichthonius was a king of Athens who could not walk easily.",
        "So he invented something new: a chariot pulled by four horses.",
        "He raced it so well that the goddess Athena admired his skill.",
        "Zeus honoured the invention by setting the charioteer among the stars.",
        "That is why the figure here holds the reins, with a goat on his shoulder." ] },
    ],
    science: [
      "Capella looks like one star but is two yellow giant stars orbiting each other, about 43 light-years away.",
      "The bottom star of the pentagon, Elnath, is shared with Taurus: it is officially the tip of the bull's horn.",
      "The winter Milky Way runs through Auriga, with three star clusters, M36, M37 and M38, that binoculars show as soft glows.",
    ],
    quiz: { q: "What is Capella really?", a: "Two yellow giant stars orbiting each other", wrong: ["A planet", "A single red dwarf", "A galaxy"] } },
];

export const LEVELS = [
  { n: 1, name: "Stargazer", what: "Every constellation's figure is drawn: find the right one and trace it", guide: "lines", mult: 1 },
  { n: 2, name: "Star Joiner", what: "No figures: find the stars and join them from the shape", guide: "none", mult: 1.5 },
  { n: 3, name: "Sky Keeper", what: "A photo-real night sky with the Milky Way and faint stars", guide: "none", mult: 2 },
];
