// Star Lore Navigator decks: what to find in the sky, the stories cultures told about it, and the real astronomy.
// Original text for Science is Magic. Distances are rounded; where astronomers still disagree, the text says so.
// target: { con: "Ori" } any star of that IAU constellation · { hip: [..] } exactly those stars · { near: [ra, dec, r] }
// a patch of sky (degrees). find = the Oracle's directions; hint = a second, plainer clue (costs a lantern).

/** Level 1: famous constellations. The stick figures are drawn; pick the right shape. */
export const SHAPES = [
  { id: "ori", name: "Orion", emoji: "🏹", target: { con: "Ori" },
    find: "A hunter with a belt of three bright stars in a short, straight row, a red shoulder and a blue-white foot.",
    hint: "Look on the celestial equator for the three stars in a row, with a big box of four stars around them.",
    lore: [
      { c: "Ancient Greece", t: "Orion was a giant hunter who boasted he could kill every animal on Earth. Gaia sent a scorpion that stung him. Both were placed in the sky on opposite sides, so Orion sets in the west as Scorpius rises in the east, still fleeing." },
      { c: "Ancient Egypt", t: "These stars were Sah, linked with Osiris, god of the afterlife. The Pyramid Texts say the dead king would rise to join Sah in the sky." },
      { c: "Lakota (North America)", t: "In Lakota star knowledge the belt, the sword and nearby stars form the Hand, part of a story about a chief who lost his arm as punishment for his selfishness." },
    ],
    science: [
      "Betelgeuse, the red shoulder, is a red supergiant roughly 550 light-years away (estimates range from about 500 to 650). In 2019 and 2020 it dimmed sharply, the Great Dimming, because it puffed out a cloud of dust.",
      "Rigel, the blue-white foot, is a blue supergiant about 860 light-years away, tens of thousands of times as luminous as the Sun.",
      "The fuzzy patch in Orion's sword is the Orion Nebula, about 1,350 light-years away: a cloud where new stars are forming right now.",
    ],
    quiz: { q: "Why did Betelgeuse dim so much in 2019 and 2020?", a: "It puffed out a cloud of dust that blocked some of its light", wrong: ["It exploded as a supernova", "The Moon passed in front of it", "Earth's orbit moved away from it"] } },

  { id: "uma", name: "Ursa Major (Big Dipper)", emoji: "🐻", target: { con: "UMa" },
    find: "Seven bright stars in the far north shaped like a ladle or a plough: a four-star bowl and a bent three-star handle.",
    hint: "High in the north, near the top of the chart. The two stars at the end of the bowl point toward the pole.",
    lore: [
      { c: "Ancient Greece", t: "Zeus loved the nymph Callisto, and she was turned into a bear, by jealous Hera in most tellings. Zeus set her in the sky as the Great Bear." },
      { c: "Mi'kmaq (eastern Canada)", t: "The four bowl stars are a bear. The handle stars and others behind them are seven birds hunting it through spring and summer. In autumn the hunters catch the bear, and the red leaves of fall are said to be its blood. The faint star Alcor beside Mizar is the pot one bird carries to cook it." },
      { c: "Britain and Ireland", t: "The same seven stars are called the Plough. In much of Europe they were a wagon or cart, and in Hindu tradition the Saptarishi, seven great sages." },
    ],
    science: [
      "The Big Dipper is an asterism, a well-known pattern, not a whole constellation. It is the brightest part of Ursa Major.",
      "Five of its seven stars travel through space together as the Ursa Major Moving Group, about 80 light-years away. Dubhe and Alkaid are going other ways, so over about 100,000 years the shape will change.",
      "Mizar and Alcor form a famous naked-eye pair. Mizar was the first double star discovered with a telescope, in the 1600s, and is now known to have several stars.",
    ],
    quiz: { q: "Why will the Big Dipper's shape change over 100,000 years?", a: "Its stars move through space in different directions", wrong: ["The Sun will grow and hide it", "Its stars will all burn out", "The Moon slowly pulls on them"] } },

  { id: "cas", name: "Cassiopeia", emoji: "👑", target: { con: "Cas" },
    find: "Five bright stars in a zigzag W (or M), sitting in the Milky Way across the pole from the Big Dipper.",
    hint: "Near the top of the chart in the far north. Look for a clear W of five stars.",
    lore: [
      { c: "Ancient Greece", t: "Queen Cassiopeia boasted that she was more beautiful than the sea nymphs. As punishment the gods placed her in the sky tied to her throne, where she spends half of each night upside down." },
      { c: "Arabic star lore", t: "Old Arabic star lore saw these stars as al-Kaff al-Khaḍīb, 'the hand stained with henna'. The name of its brightest star, Schedar, comes from the Arabic for 'the breast'." },
    ],
    science: [
      "In 1572 a new star blazed up in Cassiopeia, brighter than Venus. Tycho Brahe measured it carefully and showed it was far beyond the Moon, proof that the heavens could change. We now know it was a supernova.",
      "Cassiopeia A, a supernova remnant here, is the brightest radio source in the sky beyond the solar system.",
      "Seen from mid-northern latitudes Cassiopeia never sets: it circles the pole all night, all year.",
    ],
    quiz: { q: "What did Tycho Brahe's 'new star' of 1572 turn out to be?", a: "A supernova, an exploding star", wrong: ["A comet", "The planet Uranus", "A meteor"] } },

  { id: "sco", name: "Scorpius", emoji: "🦂", target: { con: "Sco" },
    find: "A long curved hook of stars, like a scorpion's tail, with a bright red heart near its head.",
    hint: "Low in the south part of the chart, in the Milky Way. Find the red star and the curling tail below it.",
    lore: [
      { c: "Ancient Greece", t: "The scorpion that killed Orion. They were placed on opposite sides of the sky, so the two are never seen high at the same time." },
      { c: "Māori and Polynesia", t: "The curve of stars is Te Matau a Māui, the fishhook of the demigod Māui, which he used to haul the North Island of New Zealand up from the sea." },
      { c: "Ancient China", t: "These stars were part of the Azure Dragon of the East. Antares was the dragon's Heart, the lunar mansion called Xin." },
    ],
    science: [
      "Antares is a red supergiant about 550 light-years away. Placed where the Sun is, it would swallow the orbit of Mars. Its name means 'rival of Ares', the Greek Mars, because the two look alike in colour.",
      "Scorpius sits in the zodiac, but the Sun spends only about a week in it each year. It spends more time in neighbouring Ophiuchus, the 'thirteenth' zodiac constellation.",
      "The centre of our Milky Way galaxy lies just east of Scorpius, toward Sagittarius, about 26,000 light-years away.",
    ],
    quiz: { q: "What does the name Antares mean?", a: "Rival of Mars (Ares)", wrong: ["Heart of the scorpion", "The first star", "Red giant"] } },

  { id: "cru", name: "Crux (Southern Cross)", emoji: "✝️", target: { con: "Cru" },
    find: "A small, bright kite of four stars deep in the southern sky, with two very bright pointer stars beside it.",
    hint: "At the bottom (far south) of the chart, in the Milky Way. It is the smallest of all the constellations.",
    lore: [
      { c: "Aboriginal Australian", t: "In several traditions the dark Coalsack beside the Cross is the head of the Emu in the Sky. For some peoples the Cross itself is a possum in a tree, or the footprint of a wedge-tailed eagle." },
      { c: "Navigators", t: "Sailors in the southern seas found south by extending the long axis of the Cross about four and a half times. It flies on the flags of Australia, New Zealand, Brazil, Samoa and Papua New Guinea." },
    ],
    science: [
      "Crux is the smallest of the 88 constellations. Ancient Greek astronomers saw its stars as part of Centaurus. Earth's slow wobble, called precession, has since lowered it out of view from the Mediterranean.",
      "The Coalsack next to it is a dark nebula, a cloud of dust about 600 light-years away that blocks the starlight behind it.",
      "The two pointers, Alpha and Beta Centauri, are not a pair. Alpha Centauri is the nearest star system to the Sun, 4.4 light-years away. Beta Centauri is roughly a hundred times farther.",
    ],
    quiz: { q: "What is the dark Coalsack beside the Southern Cross?", a: "A cloud of dust blocking the stars behind it", wrong: ["A black hole", "A gap with no stars at all", "The shadow of Earth"] } },

  { id: "cyg", name: "Cygnus (Northern Cross)", emoji: "🦢", target: { con: "Cyg" },
    find: "A great cross, or a swan flying with outstretched wings and a long neck, along the Milky Way. Its tail star is very bright.",
    hint: "In the northern Milky Way. Its bright tail star makes one corner of the Summer Triangle with two other bright stars.",
    lore: [
      { c: "Ancient Greece", t: "One story says Zeus took the form of a swan to visit Queen Leda. Another says it is the musician Orpheus, turned into a swan and placed beside his lyre (Lyra)." },
      { c: "Ancient China", t: "In the Qixi story, magpies fly up to make a bridge across the Silver River (the Milky Way) once a year, and Deneb in Cygnus is sometimes said to mark that bridge." },
    ],
    science: [
      "Deneb (Arabic for 'tail') is one of the most luminous stars we can see with the naked eye. It is very far away, somewhere around 1,500 to 2,600 light-years; astronomers still disagree.",
      "Albireo, the swan's beak, looks like one star by eye, but a small telescope shows a gold star and a blue star side by side.",
      "Cygnus X-1, discovered by its X-rays, was the first object widely accepted by astronomers as a black hole.",
    ],
    quiz: { q: "What is Cygnus X-1?", a: "One of the first known black holes", wrong: ["A planet with rings", "The swan's brightest star", "A meteor shower"] } },

  { id: "leo", name: "Leo", emoji: "🦁", target: { con: "Leo" },
    find: "A crouching lion: a backward question mark of stars for its mane (the Sickle) and a triangle for its hindquarters.",
    hint: "On the ecliptic, east of the Big Dipper's bowl and well south of it. The bright star at the bottom of the Sickle is its heart.",
    lore: [
      { c: "Ancient Greece", t: "The Nemean Lion, whose hide no weapon could pierce. Killing it was the first of the labours of Heracles, who strangled it and wore its skin as armour." },
      { c: "Mesopotamia", t: "Babylonian astronomers already saw a lion here, UR.GU.LA, over 2,500 years ago. Many zodiac figures, including the Bull and the Scorpion, come from Babylonian star lists." },
    ],
    science: [
      "Regulus, the lion's heart, is about 79 light-years away and spins so fast, in about 16 hours, that it bulges at its equator. If it spun a little faster it would start to fly apart.",
      "The Leonid meteor shower every November seems to come from Leo. The meteors are dust left behind by Comet Tempel-Tuttle.",
      "Regulus lies almost exactly on the ecliptic, so the Moon often passes in front of it.",
    ],
    quiz: { q: "What makes the Leonid meteors each November?", a: "Dust left by Comet Tempel-Tuttle", wrong: ["Stars falling out of Leo", "Pieces of the Moon", "Lightning in the upper air"] } },

  { id: "tau", name: "Taurus", emoji: "🐂", target: { con: "Tau" },
    find: "A charging bull: a V of stars for its face with a bright orange eye, two long horns, and a tiny dipper-shaped cluster on its shoulder.",
    hint: "Northwest of Orion: follow Orion's belt upward to the orange eye.",
    lore: [
      { c: "Ancient Greece", t: "Zeus took the form of a beautiful white bull to carry Princess Europa across the sea to Crete. The continent of Europe is named after her." },
      { c: "Mesopotamia", t: "This was the Bull of Heaven, GU.AN.NA. In the Epic of Gilgamesh the goddess Ishtar sends the bull to punish Gilgamesh, and he and Enkidu kill it." },
    ],
    science: [
      "The V-shaped face is the Hyades, the nearest star cluster to us, about 150 light-years away. The bright orange eye, Aldebaran, is not part of it: Aldebaran is closer, about 65 light-years.",
      "The Pleiades on the bull's shoulder are a young cluster of hot blue stars about 440 light-years away.",
      "The Crab Nebula near the tip of one horn is what is left of a supernova that Chinese astronomers recorded in 1054 CE. It was bright enough to see in daylight for weeks.",
    ],
    quiz: { q: "Who recorded the 1054 CE supernova that made the Crab Nebula?", a: "Chinese astronomers", wrong: ["Galileo", "The ancient Greeks", "NASA's Hubble telescope"] } },

  { id: "gem", name: "Gemini", emoji: "👬", target: { con: "Gem" },
    find: "Two long parallel lines of stars, like twins standing side by side, topped by two bright stars close together.",
    hint: "East of Taurus and northeast of Orion. Find the two bright heads, one slightly orange.",
    lore: [
      { c: "Ancient Greece", t: "Castor and Pollux, twin brothers. Pollux was immortal and Castor was not. When Castor was killed, Pollux begged to share his immortality, so Zeus let them spend their days together, half in the heavens and half below. Sailors saw them as protectors of ships." },
      { c: "Ancient India", t: "In Hindu astronomy this area holds the lunar mansion Punarvasu, linked with the goddess Aditi, mother of the gods." },
    ],
    science: [
      "Castor looks like one star but is six: three pairs of stars orbiting each other, about 51 light-years away.",
      "Pollux, the brighter twin, is an orange giant about 34 light-years away with a planet more massive than Jupiter.",
      "William Herschel discovered Uranus in Gemini in 1781, and Clyde Tombaugh found Pluto in 1930 on photographs of this part of the sky.",
    ],
    quiz: { q: "How many stars make up Castor?", a: "Six, in three pairs", wrong: ["One", "Two", "Twelve"] } },

  { id: "lyr", name: "Lyra", emoji: "🎼", target: { con: "Lyr" },
    find: "A small lyre: a neat parallelogram of faint stars hanging from one very bright blue-white star.",
    hint: "Near Cygnus in the northern summer sky. The bright star is one corner of the Summer Triangle.",
    lore: [
      { c: "Ancient Greece", t: "The lyre of Orpheus, whose music could charm animals, trees and even the gods of the underworld. After his death the Muses placed his lyre among the stars." },
      { c: "Ancient China", t: "Vega is Zhinü, the Weaver Girl, separated from her husband, the Cowherd (Altair), by the Silver River. They may meet only once a year, on the seventh day of the seventh month, the Qixi festival." },
    ],
    science: [
      "Vega is about 25 light-years away. In 1850 it became the first star other than the Sun ever photographed, and for a long time it was the zero point of the magnitude scale used to measure brightness.",
      "In 1983 the IRAS satellite found a disk of dust around Vega, one of the first clues that other stars might have planet-forming material.",
      "Because Earth's axis slowly wobbles, Vega will be a rough pole star again in about 12,000 years.",
    ],
    quiz: { q: "What was special about Vega in 1850?", a: "It was the first star other than the Sun to be photographed", wrong: ["It was the first star found to have a planet", "It exploded", "It became the pole star"] } },

  { id: "cma", name: "Canis Major", emoji: "🐕", target: { con: "CMa" },
    find: "Orion's big hunting dog, standing below and to the left of the hunter, wearing the brightest star of the night sky on its chest.",
    hint: "Southeast of Orion: follow the three belt stars down to the dazzling star.",
    lore: [
      { c: "Ancient Greece", t: "Orion's faithful hound, following its master across the sky. The bright star Sirius gets its name from the Greek for 'scorching'." },
      { c: "Ancient Egypt", t: "Sirius was Sopdet, linked with the goddess Isis. Its first appearance before dawn after weeks hidden in the Sun's glare came close to the start of the Nile's yearly flood, so it helped mark the Egyptian year." },
    ],
    science: [
      "Sirius is the brightest star in the night sky. It is bright because it is close, 8.6 light-years away, and about 25 times as luminous as the Sun.",
      "It has a tiny companion, Sirius B, a white dwarf: a dead star core about the size of Earth but with roughly the mass of the Sun.",
      "The 'dog days' of summer got their name because in ancient Greece and Rome Sirius rose with the Sun in the hottest weeks of the year.",
    ],
    quiz: { q: "What is Sirius B?", a: "A white dwarf: a dead star core about the size of Earth", wrong: ["A moon of Sirius", "A second bright star we see by eye", "A black hole"] } },

  { id: "umi", name: "Ursa Minor (Little Dipper)", emoji: "⭐", target: { con: "UMi" },
    find: "A small, faint dipper whose handle ends at the star that marks north, the star the whole sky seems to turn around.",
    hint: "The very top of the chart, closest to the north celestial pole. Look for a small dipper of mostly faint stars.",
    lore: [
      { c: "Ancient Greece", t: "Often said to be Arcas, son of Callisto (the Great Bear), set in the sky beside his mother." },
      { c: "Phoenician sailors", t: "Greek writers said the Phoenicians steered by the Little Bear, while Greek sailors used the Great Bear. The Little Bear sits closer to the pole, so it is the more exact guide." },
    ],
    science: [
      "Polaris, the end of the handle, is about 430 light-years away and lies less than one degree from the north celestial pole, so it barely moves as the sky turns.",
      "Polaris is a Cepheid, a star that gently pulses in brightness. Cepheids helped astronomers measure distances to other galaxies.",
      "Polaris has not always been the pole star. Earth's axis traces a circle every 26,000 years. About 4,700 years ago, when the pyramids were built, the pole star was Thuban in Draco.",
    ],
    quiz: { q: "Which star was the pole star when the Egyptian pyramids were built?", a: "Thuban, in Draco", wrong: ["Polaris", "Sirius", "Vega"] } },
];

/** Level 2: famous stars. No stick figures: star-hop from patterns you know. */
export const STARS_DECK = [
  { id: "polaris", name: "Polaris", emoji: "🧭", target: { hip: [11767] },
    find: "Find the Big Dipper's bowl. The two stars at the end of the bowl, away from the handle, are the Pointers. Follow their line about five times their gap to a lone, medium-bright star.",
    hint: "It is the star nearest the very top of the chart, at the north celestial pole.",
    lore: [
      { c: "Navigators", t: "For sailors and travellers in the Northern Hemisphere, Polaris marks north. Its height above the horizon in degrees equals your latitude, which is how navigators found their position." },
      { c: "Underground Railroad", t: "The song 'Follow the Drinking Gourd' tells people escaping slavery in the United States to follow the Big Dipper, whose pointers lead to the North Star and north toward freedom. Historians debate how old the song really is, but the North Star was a real guide for freedom seekers." },
    ],
    science: [
      "Polaris is not the brightest star in the sky. It is only about the 48th brightest. It is famous for where it is, not how bright.",
      "It is a yellow supergiant about 430 light-years away and a Cepheid variable, gently pulsing every four days.",
      "Polaris is actually a triple star system; its two companions need a telescope.",
    ],
    quiz: { q: "Why is Polaris famous?", a: "It sits almost exactly at the north celestial pole", wrong: ["It is the brightest star in the sky", "It is the closest star to the Sun", "It never changes brightness"] } },

  { id: "betelgeuse", name: "Betelgeuse", emoji: "🔴", target: { hip: [27989] },
    find: "Find Orion's belt, three stars in a row. Above it, at the hunter's shoulder, shines a clearly orange-red star.",
    hint: "It is the brightest reddish star near the celestial equator in this part of the sky, above Orion's belt.",
    lore: [
      { c: "Arabic star names", t: "The name comes from the Arabic yad al-jawzā', 'the hand of al-Jawzā', an ancient female figure. A medieval Latin copying mistake turned it into Bedalgeuze, and later Betelgeuse." },
      { c: "Aboriginal Australian", t: "Researchers have found Aboriginal oral traditions that seem to describe Betelgeuse changing in brightness, long before Western astronomers recorded it." },
    ],
    science: [
      "Betelgeuse is a red supergiant. Placed where the Sun is, it would reach past the orbit of Mars, perhaps even Jupiter.",
      "It is near the end of its life and will explode as a supernova, probably within the next 100,000 years. From Earth it would shine as bright as a half Moon for weeks, but it is too far away to harm us.",
      "Its red colour means its surface is cool for a star, about 3,300 °C, against the Sun's 5,500 °C.",
    ],
    quiz: { q: "What does a star's red colour tell you?", a: "Its surface is relatively cool", wrong: ["It is very young", "It is moving toward us", "It is the hottest kind of star"] } },

  { id: "rigel", name: "Rigel", emoji: "🔷", target: { hip: [24436] },
    find: "Find Orion's belt. Below it, diagonally across from the red shoulder star, shines the hunter's bright blue-white foot.",
    hint: "Just below the celestial equator, the brightest star under Orion's belt.",
    lore: [
      { c: "Arabic star names", t: "Rigel comes from Arabic rijl al-jawzā', 'the foot of al-Jawzā'." },
      { c: "Norse (uncertain)", t: "Some writers link a star in this area with Aurvandil's toe, which the god Thor flung into the sky in the Prose Edda, but nobody knows for sure which star was meant." },
    ],
    science: [
      "Rigel is a blue supergiant about 860 light-years away, tens of thousands of times as luminous as the Sun.",
      "Blue-white stars are hot: Rigel's surface is about 12,000 °C, more than twice as hot as the Sun's.",
      "It is usually brighter than Betelgeuse, even though Orion's stars are labelled Alpha (Betelgeuse) and Beta (Rigel). Bayer's letters are only a rough ranking.",
    ],
    quiz: { q: "Rigel looks blue-white. What does that tell us about it?", a: "It is very hot", wrong: ["It is cold and icy", "It is made of water", "It is very close to us"] } },

  { id: "sirius", name: "Sirius", emoji: "💎", target: { hip: [32349] },
    find: "Find Orion's belt and follow its line down toward the southeast, about eight belt-lengths, to the most dazzling star in the whole night sky.",
    hint: "It is the brightest star on this chart, south of the celestial equator.",
    lore: [
      { c: "Ancient Egypt", t: "Sopdet, linked with Isis. Its heliacal rising, the first morning it reappears before dawn, came close to the start of the Nile's yearly flood." },
      { c: "Polynesia", t: "Polynesian navigators used bright stars like Sirius, which rise and set at fixed points on the horizon, as part of a 'star compass' to steer between islands." },
    ],
    science: [
      "Sirius is the brightest star of the night sky, magnitude -1.46, because it is so close: 8.6 light-years.",
      "Near the horizon it often twinkles in rainbow colours. That is Earth's air bending its light, not the star itself.",
      "Its companion Sirius B was one of the first white dwarfs ever found, a dead star core about the size of Earth.",
    ],
    quiz: { q: "Why does Sirius flash rainbow colours near the horizon?", a: "Earth's air bends and splits its light", wrong: ["It changes colour every few seconds", "It is a spinning planet", "Satellites pass in front of it"] } },

  { id: "aldebaran", name: "Aldebaran", emoji: "🟠", target: { hip: [21421] },
    find: "Find Orion's belt and follow its line up toward the northwest, past the hunter, to an orange star at the tip of a V of stars.",
    hint: "It is the brightest orange star northwest of Orion, the eye of the bull.",
    lore: [
      { c: "Arabic star names", t: "Al-dabarān means 'the follower', because it rises after the Pleiades and seems to chase them across the sky." },
      { c: "Persia", t: "Later European writers called Aldebaran one of the four 'royal stars' of ancient Persia, guardians of the sky with Regulus, Antares and Fomalhaut. How old that idea really is, is uncertain." },
    ],
    science: [
      "Aldebaran is an orange giant about 65 light-years away, about 44 times as wide as the Sun.",
      "It sits in front of the Hyades cluster but is not part of it. The Hyades are more than twice as far away.",
      "The Pioneer 10 space probe is drifting in Aldebaran's general direction. It would take about two million years to get there.",
    ],
    quiz: { q: "Why is Aldebaran called 'the follower'?", a: "It rises after the Pleiades and seems to chase them", wrong: ["It follows the Moon every night", "It was found after all other stars", "It follows the Sun at sunset"] } },

  { id: "arcturus", name: "Arcturus", emoji: "🟧", target: { hip: [69673] },
    find: "Find the Big Dipper's handle. Follow its curve away from the bowl, 'arc to Arcturus', to a bright orange star.",
    hint: "It is the brightest star in the northern half of this chart.",
    lore: [
      { c: "Ancient Greece", t: "Arktouros means 'guardian of the bear', because it follows the Great Bear around the pole." },
      { c: "Hawaii", t: "Arcturus is Hōkūleʻa, 'star of gladness'. It passes almost straight overhead in Hawaiʻi, so navigators sailing home from Tahiti could steer north until it rose to the top of the sky. The voyaging canoe Hōkūleʻa, built in 1975, is named after it." },
    ],
    science: [
      "Arcturus is an orange giant about 37 light-years away, the brightest star in the northern half of the sky.",
      "It is racing through the Milky Way much faster than the Sun and in a different direction, so it may have come from a small galaxy the Milky Way swallowed long ago.",
      "In 1933 its light was used to switch on the Chicago World's Fair. Astronomers then thought the light had left the star about 40 years earlier, during the previous Chicago fair of 1893.",
    ],
    quiz: { q: "Why could Hawaiian navigators use Arcturus to find home?", a: "It passes almost straight overhead in Hawaiʻi", wrong: ["It never moves in the sky", "It only shines over islands", "It points to the South Pole"] } },

  { id: "spica", name: "Spica", emoji: "🌾", target: { hip: [65474] },
    find: "Arc from the Big Dipper's handle to Arcturus, then 'speed on to Spica': keep going the same way to a blue-white star.",
    hint: "It is the bright blue-white star just south of the celestial equator, south of Arcturus.",
    lore: [
      { c: "Ancient Rome", t: "Spica means 'ear of grain'. It is the wheat held by Virgo, often linked with the harvest goddess Ceres (Demeter to the Greeks)." },
      { c: "Hindu astronomy", t: "Spica marks the lunar mansion Chitra, 'the bright one'. Some Indian calendars use it as a fixed reference point for the zodiac." },
    ],
    science: [
      "Spica is two hot blue stars orbiting each other in just four days, about 250 light-years away. They pull each other into egg shapes.",
      "Around 130 BCE the Greek astronomer Hipparchus compared Spica's position with records 150 years older and found it had shifted. That is how precession, Earth's slow wobble, was discovered.",
      "Spica lies close to the ecliptic, so the Moon and planets often pass near it.",
    ],
    quiz: { q: "What did Hipparchus discover by measuring Spica?", a: "Precession, the slow wobble of Earth's axis", wrong: ["That the Earth is round", "That Spica is a planet", "The speed of light"] } },

  { id: "vega", name: "Vega", emoji: "🎐", target: { hip: [91262] },
    find: "Look for the Summer Triangle, three bright stars far apart. Vega is the brightest of the three and the one at the triangle's sharpest corner, with a little parallelogram of faint stars beside it.",
    hint: "It is the brightest star in this chart's northern half, blue-white, beside a small parallelogram.",
    lore: [
      { c: "Ancient China and Japan", t: "Vega is the Weaver Girl, Zhinü (Orihime in Japan), separated from the Cowherd (Altair) by the Milky Way. They meet once a year, celebrated as Qixi in China and Tanabata in Japan." },
      { c: "Arabic star names", t: "Vega comes from al-nasr al-wāqi', 'the falling (or swooping) eagle'." },
    ],
    science: [
      "Vega is about 25 light-years away and spins so fast, about once every 12.5 hours, that it is flattened at its poles.",
      "It was the first star other than the Sun photographed (1850) and was long the zero point of the magnitude scale.",
      "About 12,000 years from now precession will make Vega a rough pole star.",
    ],
    quiz: { q: "Vega and Altair are lovers in which festival?", a: "Qixi (Tanabata in Japan)", wrong: ["Diwali", "Halloween", "Hanukkah"] } },

  { id: "deneb", name: "Deneb", emoji: "🪶", target: { hip: [102098] },
    find: "Find the Summer Triangle. Deneb is its faintest corner, at the top of a large cross of stars lying along the Milky Way.",
    hint: "The bright star at the head of the Northern Cross, northeast of Vega.",
    lore: [
      { c: "Arabic star names", t: "Deneb comes from dhanab al-dajāja, 'the tail of the hen', the swan's tail." },
      { c: "Ancient China", t: "In some versions of the Qixi story, Deneb marks the bridge of magpies that lets the Weaver Girl and the Cowherd meet." },
    ],
    science: [
      "Deneb looks a little fainter than Vega, but it is enormously more luminous. It is very far away, roughly 1,500 to 2,600 light-years; its distance is hard to measure.",
      "The light you see from Deneb tonight left it more than a thousand years ago.",
      "It is a white supergiant, perhaps 100,000 times as luminous as the Sun, and one of the most luminous stars visible without a telescope.",
    ],
    quiz: { q: "Deneb looks fainter than Vega. Why?", a: "It is much farther away, though far more luminous", wrong: ["It is a much smaller star", "It is behind a cloud of dust", "It is dying"] } },

  { id: "altair", name: "Altair", emoji: "🦅", target: { hip: [97649] },
    find: "Find the Summer Triangle. Altair is the southern corner, a bright star with a fainter star close on each side, like a bird with small wings.",
    hint: "The bright star on the celestial equator side of the Summer Triangle, with a faint neighbour on each side.",
    lore: [
      { c: "Ancient China", t: "Altair is Niulang, the Cowherd, husband of the Weaver Girl (Vega). The two faint stars beside him are said to be their children, whom he carries across the sky." },
      { c: "Arabic star names", t: "Altair comes from al-nasr al-ṭā'ir, 'the flying eagle'." },
    ],
    science: [
      "Altair is one of the closest bright stars, about 17 light-years away.",
      "It spins once in about 9 hours, so fast that it is squashed: wider at the equator than pole to pole.",
      "In 2007 astronomers combined several telescopes to make one of the first pictures of the surface of an ordinary star other than the Sun. Altair was that star.",
    ],
    quiz: { q: "Why is Altair squashed into an oval?", a: "It spins very fast, once in about 9 hours", wrong: ["A planet pulls on it", "It is cooling down", "It is made of gas that leaks out"] } },

  { id: "antares", name: "Antares", emoji: "❤️‍🔥", target: { hip: [80763] },
    find: "Find the scorpion's long curling tail low in the south. At its head, a bright red star glows like a coal.",
    hint: "The bright red star in the southern Milky Way part of this chart.",
    lore: [
      { c: "Ancient Greece", t: "Anti-Ares, 'rival of Mars'. When the red planet Mars passes nearby, the two look like twins." },
      { c: "Ancient China", t: "Antares was Da Huo, the 'Great Fire', and the Heart of the Azure Dragon. Its position at dusk helped mark the farming seasons." },
    ],
    science: [
      "Antares is a red supergiant about 550 light-years away. Put in the Sun's place, it would reach past Mars.",
      "It has a small blue companion star, Antares B, usually lost in its glare.",
      "Antares lies close to the ecliptic, so the Moon sometimes passes in front of it.",
    ],
    quiz: { q: "Why was Antares named 'rival of Mars'?", a: "It is red and looks like Mars", wrong: ["It is a planet like Mars", "It fought Mars in a myth", "It is closer to us than Mars"] } },

  { id: "regulus", name: "Regulus", emoji: "👑", target: { hip: [49669] },
    find: "Find the Big Dipper's two Pointer stars. Follow them backward, away from the pole, about ten times their gap, to the bright star at the bottom of a backward question mark.",
    hint: "The bright blue-white star on the ecliptic at the base of Leo's Sickle.",
    lore: [
      { c: "Europe", t: "Regulus means 'little king' in Latin, a name given by Copernicus from the Greek Basiliskos. It is the lion's heart." },
      { c: "Persia", t: "Later European writers counted Regulus among the four 'royal stars' of ancient Persia, with Aldebaran, Antares and Fomalhaut, though how old that tradition is remains uncertain." },
    ],
    science: [
      "Regulus is about 79 light-years away and spins once in about 16 hours, close to the speed that would tear it apart.",
      "It is really four stars: a bright pair and a fainter pair that orbit together.",
      "It lies almost on the ecliptic, the Sun's yearly path, so the Moon regularly hides it.",
    ],
    quiz: { q: "Regulus means what in Latin?", a: "Little king", wrong: ["Lion's heart", "Bright star", "The first"] } },
];

/** Level 3: the sky across cultures. No figures and no star names: find what each people saw. */
export const CULTURES = [
  { id: "matariki", name: "Matariki", culture: "Māori (Aotearoa New Zealand)", emoji: "✨", target: { hip: [17489, 17851, 17499, 17531, 17573, 17608, 17702, 17847] },
    find: "Find Matariki, a tiny, tight cluster of blue stars. When it reappears in the dawn sky in midwinter (June or July), the Māori New Year begins.",
    hint: "It sits on the shoulder of the bull, northwest of the orange star at the tip of the V.",
    lore: [
      { c: "Māori", t: "Matariki is a time to remember those who died in the past year, celebrate the present and plan for the year ahead. Since 2022 it has been a public holiday in Aotearoa New Zealand." },
      { c: "Ancient Greece", t: "The Pleiades were the Seven Sisters, daughters of Atlas, placed in the sky to escape the hunter Orion." },
      { c: "Japan", t: "The cluster is Subaru, meaning 'to gather together'. The car company's logo shows its stars." },
    ],
    science: [
      "This is the Pleiades (M45), a cluster of more than a thousand stars born together about 100 million years ago, about 440 light-years away.",
      "Most people see six or seven stars by eye. Binoculars show dozens.",
      "In long-exposure photos the stars are wrapped in blue haze: a dust cloud the cluster is passing through, lit by the stars.",
    ],
    quiz: { q: "How old are the Pleiades stars?", a: "About 100 million years, young for stars", wrong: ["About 10,000 years", "About 13 billion years, as old as the universe", "They formed in 1054 CE"] } },

  { id: "emu", name: "The Emu in the Sky", culture: "Aboriginal Australian", emoji: "🪶", target: { near: [192.5, -62.5, 7] },
    find: "The Emu is made of darkness, not stars: the dust lanes of the Milky Way. Tap its head, the dark cloud next to the small, bright Southern Cross.",
    hint: "At the bottom of the chart, find the four-star kite. The head is the dark patch just beside it, toward the two bright pointer stars.",
    lore: [
      { c: "Aboriginal Australian", t: "For many peoples the Emu's position after dusk tracks the emu breeding season. When it stretches across the sky as if running, the birds are laying eggs. Later, when only the body sits low, it is time to leave the eggs alone." },
      { c: "Inca (Andes)", t: "The Inca also saw animals in the Milky Way's dark clouds, including a toad, a fox and a llama, Yacana, whose eyes are the two bright pointer stars." },
    ],
    science: [
      "The dark shapes are clouds of cosmic dust and gas in the plane of our galaxy, blocking the light of stars behind them.",
      "The Emu's head is the Coalsack Nebula, about 600 light-years away.",
      "Dark clouds like these are where new stars form. Infrared telescopes can see through the dust to the young stars inside.",
    ],
    quiz: { q: "What are the dark shapes in the Milky Way?", a: "Clouds of dust blocking the stars behind", wrong: ["Holes in space with nothing there", "Shadows cast by the Moon", "Black holes"] } },

  { id: "sah", name: "Sah", culture: "Ancient Egypt", emoji: "𓂀", target: { con: "Ori" },
    find: "Find Sah, the star-figure of Osiris, a great figure striding across the sky on the celestial equator, with three bright stars in a row at his waist.",
    hint: "Three stars in a row, framed by four bright stars, on the celestial equator.",
    lore: [
      { c: "Ancient Egypt", t: "Sah was linked with Osiris, god of death and rebirth, and Sopdet (Sirius), following him, with his wife Isis. Inscriptions in the pyramids hoped the dead king would rise to join Sah." },
      { c: "A popular claim", t: "You may hear that the three Giza pyramids are laid out to match Orion's belt. That idea is popular but most Egyptologists reject it, and there is no ancient text saying so." },
    ],
    science: [
      "Orion's belt stars, Alnitak, Alnilam and Mintaka, are hot blue giants between about 700 and 2,000 light-years away. They only look like a neat row from Earth.",
      "Because the belt lies on the celestial equator, Mintaka rises almost due east and sets almost due west for everyone on Earth.",
      "The Egyptians tracked 36 star groups called decans, rising one after another through the night, to tell the hours.",
    ],
    quiz: { q: "What did the Egyptian decans help people measure?", a: "The hours of the night", wrong: ["The depth of the Nile", "The distance to the stars", "The weight of gold"] } },

  { id: "saptarishi", name: "Saptarishi", culture: "Ancient India", emoji: "🪷", target: { hip: [54061, 53910, 58001, 59774, 62956, 65378, 67301, 65477] },
    find: "Find the Saptarishi, the Seven Sages, seven bright stars in the far north shaped like a ladle that circles the pole.",
    hint: "In the far north, near the top of the chart: a four-star bowl and a bent three-star handle.",
    lore: [
      { c: "Hindu tradition", t: "The seven stars are seven great rishis, wise sages. Beside Vasishtha (Mizar) is his faithful wife Arundhati (Alcor), and traditionally newlyweds were shown the pair as a model of a lasting marriage." },
      { c: "Ancient China", t: "The same stars are Beidou, the Northern Dipper. Where the handle points at dusk was used to tell the seasons: east for spring, south for summer, west for autumn, north for winter." },
    ],
    science: [
      "These seven stars are the Big Dipper, part of Ursa Major. Five of them are moving together through space about 80 light-years away.",
      "Mizar and Alcor were once used as an eyesight test. Being able to see Alcor beside Mizar takes good eyes and a dark sky.",
      "From most of the Northern Hemisphere these stars never set; they circle the pole all night.",
    ],
    quiz: { q: "Why don't the Seven Sages set for most northern skywatchers?", a: "They are close to the pole, so they circle it", wrong: ["They are planets", "They are too bright to set", "They are inside Earth's shadow"] } },

  { id: "zhinu", name: "The Weaver Girl", culture: "Ancient China", emoji: "🧵", target: { hip: [91262] },
    find: "Find Zhinü, the Weaver Girl, a brilliant blue-white star on one bank of the Silver River (the Milky Way), across from her husband the Cowherd.",
    hint: "The brightest of the three bright stars of the Summer Triangle, on the far side of the Milky Way from the one with two little companions.",
    lore: [
      { c: "Ancient China", t: "The Weaver Girl, a heavenly princess, married a mortal cowherd. Her mother, the Queen of Heaven, angrily scratched the Silver River between them. Once a year, on the 7th day of the 7th lunar month, magpies make a bridge so the pair can meet. This is the Qixi festival." },
      { c: "Japan", t: "The same story is Tanabata. People write wishes on strips of paper and hang them on bamboo." },
    ],
    science: [
      "The Weaver Girl is Vega, about 25 light-years away. The Cowherd is Altair, about 17 light-years away.",
      "The two are about 15 light-years apart. Even a message at the speed of light would take 15 years to cross the Silver River.",
      "The 'Silver River' is the Milky Way: the glow of billions of distant stars in the disk of our own galaxy.",
    ],
    quiz: { q: "What is the 'Silver River'?", a: "The Milky Way, the glow of our galaxy's stars", wrong: ["A real river in China", "A comet's tail", "Moonlight on the clouds"] } },

  { id: "hokulea", name: "Hōkūleʻa", culture: "Hawaiʻi", emoji: "🛶", target: { hip: [69673] },
    find: "Find Hōkūleʻa, the star of gladness, a bright orange star at the end of a long curving arc from the seven-star ladle in the north.",
    hint: "Follow the curve of the Big Dipper's handle away from the bowl to the first bright star.",
    lore: [
      { c: "Hawaiʻi", t: "Hōkūleʻa passes almost straight overhead in Hawaiʻi. A navigator sailing north from Tahiti knew the islands were near when this star climbed to the top of the sky at its highest." },
      { c: "Modern voyaging", t: "In 1976 the voyaging canoe Hōkūleʻa sailed from Hawaiʻi to Tahiti without instruments, guided by navigator Mau Piailug using stars, swells and birds. It proved that Polynesians could have made such voyages on purpose." },
    ],
    science: [
      "Hōkūleʻa is Arcturus, an orange giant about 37 light-years away.",
      "A star passes straight overhead for people whose latitude equals the star's declination. Arcturus's is about 19 °N, the latitude of Hawaiʻi Island.",
      "Arcturus is the brightest star in the northern half of the sky.",
    ],
    quiz: { q: "Who navigated Hōkūleʻa to Tahiti in 1976 without instruments?", a: "Mau Piailug", wrong: ["Captain James Cook", "Ferdinand Magellan", "Amelia Earhart"] } },

  { id: "yacana", name: "Yacana's eyes", culture: "Inca (Andes)", emoji: "🦙", target: { hip: [71683, 68702] },
    find: "Find the eyes of Yacana, the llama: two very bright stars side by side in the southern Milky Way. The llama's body is a dark dust cloud behind them.",
    hint: "Low in the south, next to the small four-star kite of the Southern Cross: the two bright stars beside it.",
    lore: [
      { c: "Inca", t: "In Quechua the two stars are llamacñawin, 'the eyes of the llama'. Andean people said Yacana drinks water from the sea at midnight and so stops the world from flooding." },
      { c: "Southern navigators", t: "The same two stars are the Pointers, which lead the eye to the Southern Cross." },
    ],
    science: [
      "The left-hand eye, Alpha Centauri, is the nearest star system to us, 4.4 light-years away. It is really three stars, including Proxima Centauri, which has at least one planet.",
      "The other eye, Beta Centauri (Hadar), only looks similar. It is about 390 light-years away.",
      "Light from Alpha Centauri takes over four years to reach us, so you see it as it was four years ago.",
    ],
    quiz: { q: "What is special about Alpha Centauri, one of the llama's eyes?", a: "It is the nearest star system to the Sun", wrong: ["It is the brightest star in the sky", "It is a planet", "It is the pole star"] } },

  { id: "xin", name: "The Dragon's Heart", culture: "Ancient China", emoji: "🐉", target: { hip: [80763] },
    find: "Find Xin, the Heart of the Azure Dragon of the East, a red star that blazes in the summer south like a coal.",
    hint: "Low in the southern Milky Way part of the chart, the bright red star at the head of a long, curling tail.",
    lore: [
      { c: "Ancient China", t: "The sky was divided into 28 lunar mansions, grouped into four great animals. The Azure Dragon ruled the east and spring, and Xin, its heart, was also called Da Huo, the Great Fire." },
      { c: "Ancient Greece", t: "To the Greeks the same red star was the heart of the Scorpion, Antares, 'rival of Mars'." },
    ],
    science: [
      "The Dragon's Heart is Antares, a red supergiant about 550 light-years away and hundreds of times wider than the Sun.",
      "The 28 lunar mansions follow the Moon's path: it moves about one mansion each night in its month-long circuit.",
      "Chinese astronomers kept some of the world's longest records of the sky, including 'guest stars' that we now know were supernovae.",
    ],
    quiz: { q: "Why are there 28 Chinese lunar mansions?", a: "The Moon moves through about one each night of its circuit", wrong: ["There are 28 visible planets", "Each emperor added one", "They match 28 days of the year"] } },

  { id: "gugalanna", name: "The Bull of Heaven", culture: "Mesopotamia", emoji: "🏺", target: { con: "Tau" },
    find: "Find the Bull of Heaven, GU.AN.NA, a great bull with a V-shaped face and a fiery orange eye, charging the giant hunter.",
    hint: "Northwest of Orion's three-star belt, follow the belt up to the orange eye and the V of stars.",
    lore: [
      { c: "Mesopotamia", t: "In the Epic of Gilgamesh, one of the oldest written stories, the goddess Ishtar sends the Bull of Heaven against Gilgamesh. He and his friend Enkidu kill it." },
      { c: "Babylonian astronomy", t: "Babylonian star lists, recorded on clay tablets such as the MUL.APIN (about 1000 BCE), already name a bull here. Much of our zodiac grew from them." },
    ],
    science: [
      "This is Taurus. Its V-shaped face, the Hyades, is the nearest star cluster, about 150 light-years away.",
      "The bull's eye, Aldebaran, is an orange giant about 65 light-years away.",
      "The Babylonians recorded planet positions for centuries and could predict eclipses, mathematical astronomy that later passed to the Greeks.",
    ],
    quiz: { q: "What are the MUL.APIN tablets?", a: "Babylonian star catalogues on clay", wrong: ["Egyptian pyramid maps", "Greek myths about bulls", "Chinese silk star charts"] } },

  { id: "sopdet", name: "Sopdet", culture: "Ancient Egypt", emoji: "🌊", target: { hip: [32349] },
    find: "Find Sopdet, the star of Isis, the most brilliant star of the night, following the great figure of Osiris across the sky.",
    hint: "Follow the three-star belt of the giant down toward the southeast to the brightest star on the chart.",
    lore: [
      { c: "Ancient Egypt", t: "After about 70 days hidden in the Sun's glare, Sopdet reappeared in the dawn sky in summer, close to when the Nile began its yearly flood that watered the fields. It became a marker of the Egyptian new year." },
      { c: "Ancient Greece and Rome", t: "Sirius rising with the Sun was blamed for the heat of late summer: the 'dog days'." },
    ],
    science: [
      "Sopdet is Sirius, 8.6 light-years away, the brightest star of the night sky.",
      "A heliacal rising is the first morning a star can be seen just before sunrise. The date depends on your latitude.",
      "Because of precession, Sirius's rising date drifts slowly over thousands of years, so it no longer matches the flood as it once did. The Aswan High Dam (finished 1970) ended the flood itself.",
    ],
    quiz: { q: "What is a heliacal rising?", a: "The first morning a star is seen just before sunrise", wrong: ["When a star is highest at midnight", "A star exploding", "When the Sun crosses the equator"] } },
];

export const LEVELS = [
  { n: 1, name: "Stargazer", what: "Find the famous constellations", deck: SHAPES, lines: true, mult: 1 },
  { n: 2, name: "Star Hopper", what: "Find famous stars by star-hopping", deck: STARS_DECK, lines: false, mult: 1.5 },
  { n: 3, name: "Sky Keeper", what: "Find what other cultures saw", deck: CULTURES, lines: false, mult: 2 },
];
