// Star Lore Navigator, second sky: 14 more constellations (30 in all) and fables from more cultures: Arabic star
// names, the Chinese lunar mansions and star officials, Inuit, Navajo, Boorong, Māori, Shawnee, Babylonian and Persian
// astronomy. Same shape as lore.js DECK; original retellings, each naming the culture it comes from. Where a story or
// a date is uncertain the text says so. lore.js appends MORE to DECK and EXTRA fables to existing constellations
// (appended at the end so fables already heard keep their numbers).

export const MORE = [
  { id: "sgr", con: "Sgr", name: "Sagittarius", emoji: "🫖", fig: [90185, 89931, 90496, 88635, 92855, 93506, 92041, 93864, 89642],
    find: "A teapot in the thickest part of the southern Milky Way, just east of the Scorpion's tail: the steam rising from its spout is the glow of the galaxy's centre.",
    fables: [
      { c: "Arabic star lore", t: "The ostriches at the river", parts: [
        "Desert people saw no archer here. They saw ostriches, coming and going from the river of the Milky Way.",
        "Four stars were the ostriches walking down to drink, al-naʿām al-wārid.",
        "Four more were the ostriches coming back again, satisfied, al-naʿām al-ṣādir.",
        "The names survive on modern star charts, worn smooth by a thousand years of copying.",
        "Look for the stars Hamalwarid and Namalsadirah: the thirsty birds and the ones going home." ] },
      { c: "Ancient China", t: "The two old men under the mulberry tree", parts: [
        "A fortune-teller named Guan Lu met a young man, Zhao Yan, and told him sadly that he would die at nineteen.",
        "'Take wine and dried venison to the mulberry tree in the south field,' said Guan Lu. 'Two old men play a board game there. Serve them and say nothing.'",
        "Zhao Yan did. The players, lost in their game, ate and drank without looking up. At last the one sitting on the north side noticed him and frowned.",
        "But the one on the south side said, 'We have eaten his food,' took out the book of lives, and turned the 19 into 99.",
        "The man on the north was the Northern Dipper, who records deaths. The man on the south was the Southern Dipper, in Sagittarius, who records births and long lives." ] },
    ],
    science: [
      "Look toward the Teapot's spout and you are looking at the centre of our galaxy, about 26,000 light-years away, hidden behind dust.",
      "At the very centre sits Sagittarius A*, a black hole about four million times the mass of the Sun. Its first image was released in 2022.",
      "The Lagoon Nebula (M8), a cloud where new stars are being born, is visible to the naked eye from a dark site as a misty patch above the spout.",
    ],
    quiz: { q: "What lies in the direction of Sagittarius?", a: "The centre of our Milky Way galaxy", wrong: ["The nearest star to the Sun", "The north celestial pole", "The Andromeda Galaxy"] } },

  { id: "cen", con: "Cen", name: "Centaurus", emoji: "🏇",
    find: "A great centaur in the deep southern sky, wrapped around the Southern Cross. His front hooves are the two brilliant Pointer stars.",
    fables: [
      { c: "Ancient Greece", t: "Chiron, the wise teacher", parts: [
        "Most centaurs were wild, but Chiron was gentle and wise, a healer, a musician and a teacher.",
        "Heroes were sent to him as boys: Achilles, Jason, and Asclepius, who became the greatest of all healers.",
        "One day an arrow tipped with the Hydra's poison struck Chiron by accident. Being immortal, he could not die, but he could not heal either.",
        "Chiron chose to give up his immortality so the pain would end. Some say he gave it in exchange for the freedom of Prometheus.",
        "Zeus set him among the stars, where he still stands near the Cross, as if keeping watch over his pupils." ] },
      { c: "Boorong (Victoria, Australia)", t: "The brothers and the giant emu", parts: [
        "The Boorong people of north-western Victoria saw the two bright Pointers as two brothers, Bermbermgle.",
        "They were brave hunters, famous for their courage.",
        "A giant emu, Tchingal, was attacking people, and the brothers went out to stop it.",
        "With their spears they brought the great bird down. Its dark shape lies near the Cross to this day.",
        "Their story was written down in the 1850s, one of the earliest records of Aboriginal astronomy." ] },
    ],
    science: [
      "Alpha Centauri, the brighter Pointer, is the nearest star system to us: three stars about 4.4 light-years away. Its faint member Proxima Centauri is the closest star of all, 4.2 light-years.",
      "Proxima Centauri has at least one planet about the size of Earth, though it is bathed in flares from its small red star.",
      "Omega Centauri looks like a fuzzy star by eye, but it is the largest globular cluster of our galaxy: about 10 million stars, some 17,000 light-years away.",
    ],
    quiz: { q: "Which is the closest star to the Sun?", a: "Proxima Centauri", wrong: ["Sirius", "Polaris", "Betelgeuse"] } },

  { id: "and", con: "And", name: "Andromeda", emoji: "⛓️", fig: [677, 3092, 5447, 9640, 3881, 4436, 3031, 2912],
    find: "A chained princess: a long line of stars running north-east from a corner of the Great Square of Pegasus toward Perseus.",
    fables: [
      { c: "Ancient Greece", t: "The princess on the rock", parts: [
        "Queen Cassiopeia boasted that her daughter Andromeda was more beautiful than the sea nymphs.",
        "The sea god Poseidon, angry, sent a monster, Cetus, to wreck the coast.",
        "An oracle said only one thing would stop it: Andromeda must be chained to a rock by the sea.",
        "The hero Perseus, flying home with Medusa's head, saw her, fought the monster and set her free.",
        "All of them are in the sky together: the princess, her parents, her rescuer and, not far below, the monster." ] },
      { c: "Persia (10th century)", t: "Al-Sufi's little cloud", parts: [
        "In the year 964, the Persian astronomer ʿAbd al-Raḥmān al-Ṣūfī wrote the Book of Fixed Stars.",
        "He went through the old Greek star list star by star, correcting the brightnesses with his own eyes.",
        "Near the princess's belt he noted something odd: a 'little cloud', a soft smudge that was not a star.",
        "It is the earliest known written record of what we now call the Andromeda Galaxy.",
        "He had no way to know it, but he was looking at a whole galaxy of a trillion stars, the farthest thing most people can see without a telescope." ] },
    ],
    science: [
      "The Andromeda Galaxy is about 2.5 million light-years away. The light you see left it before modern humans existed.",
      "It is falling toward the Milky Way. In roughly 4 to 5 billion years the two galaxies will merge into one.",
      "Almach, the princess's foot, is a lovely double star in a small telescope: gold and blue, like Albireo in the Swan.",
    ],
    quiz: { q: "About how far away is the Andromeda Galaxy?", a: "2.5 million light-years", wrong: ["2,500 light-years", "4.2 light-years", "25 billion light-years"] } },

  { id: "dra", con: "Dra", name: "Draco the Dragon", emoji: "🐉",
    find: "A long dragon coiled around the north pole, between the two Dippers, with a four-star lozenge for its head near the bright star Vega.",
    fables: [
      { c: "Ancient Greece", t: "Ladon and the golden apples", parts: [
        "In the garden of the Hesperides grew a tree of golden apples, a wedding gift to the queen of the gods.",
        "Coiled around it lay Ladon, a dragon that never slept.",
        "For his eleventh labour, Heracles had to bring back three of those apples.",
        "Some say he slew the dragon; others that he tricked the giant Atlas into picking the apples for him.",
        "Hera set her faithful guardian in the sky, and Heracles kneels beside its head to this day." ] },
      { c: "Ancient Egypt", t: "The star that stood still", parts: [
        "Around 2700 BCE, when the first great pyramids were being planned, the pole star was not Polaris.",
        "It was Thuban, a modest star in the Dragon's tail.",
        "Every other star wheeled around it, but Thuban barely moved: the still point of the turning sky.",
        "The Egyptians called the stars around the pole 'the imperishable ones', because they never set, and hoped the dead king would join them.",
        "Some have argued that a narrow shaft in the Great Pyramid was aimed at Thuban; historians still debate it." ] },
    ],
    science: [
      "The pole stars change. Earth wobbles like a spinning top once every 26,000 years, so Thuban was the pole star about 4,700 years ago and Polaris is now.",
      "The Cat's Eye Nebula in Draco is the glowing shell of gas thrown off by a dying star.",
      "Each October, the Draconid meteor shower seems to come from the Dragon's head, made of dust from comet Giacobini-Zinner.",
    ],
    quiz: { q: "Which star in Draco was the pole star when the pyramids were built?", a: "Thuban", wrong: ["Vega", "Sirius", "Eltanin"] } },

  { id: "crv", con: "Crv", name: "Corvus the Crow", emoji: "🐦",
    find: "A small, lopsided four-star sail low in the spring sky, south-west of the bright star Spica.",
    fables: [
      { c: "Ancient Greece", t: "The crow who lied", parts: [
        "The god Apollo sent his crow, once a bird with silver-white feathers, to fetch water in a golden cup.",
        "On the way, the crow found a fig tree with figs not yet ripe, and waited days for them to ripen.",
        "Late and afraid, it grabbed a water snake and flew back with a lie: 'This snake blocked the spring!'",
        "Apollo saw the truth. He scorched the crow black and set it in the sky beside the Cup and the Water Snake.",
        "The crow sits right beside the cup, but it can never drink: the snake guards it forever." ] },
      { c: "Ancient China", t: "Zhen, the chariot", parts: [
        "In China the Moon's monthly path was divided into 28 lunar mansions, one for each night of its journey round the sky.",
        "The last of them is Zhen, the Chariot: the same four stars we call the Crow.",
        "It belongs to the Vermilion Bird, the great red bird that rules the southern quarter of the sky.",
        "Beside the chariot shines a faint star called Changsha, the Long Sand, which was linked with long life.",
        "When the Moon reached the Chariot, it had completed its circuit and the mansions began again." ] },
    ],
    science: [
      "The Antennae Galaxies in Corvus are two galaxies in the middle of a collision, flinging out long tails of stars.",
      "Their collision is triggering bursts of new star birth: billions of new stars where the gas clouds crash together.",
      "Corvus has no very bright stars, but its four-star shape is easy to spot once you know where to look.",
    ],
    quiz: { q: "What are the Antennae Galaxies in Corvus?", a: "Two galaxies colliding", wrong: ["A double star", "A comet's tail", "A pair of planets"] } },

  { id: "car", con: "Car", name: "Carina the Keel", emoji: "⛵", fig: [30438, 45238, 41037, 45556, 50099, 52419, 51576, 50371, 38827, 53253, 54463],
    find: "The keel of a great ship in the far southern Milky Way, with brilliant Canopus, the second-brightest star, at its bow.",
    fables: [
      { c: "Ancient Greece", t: "The ship Argo", parts: [
        "Jason sailed in search of the Golden Fleece in the Argo, the greatest ship ever built.",
        "The goddess Athena helped to build her, and set in her bow a beam of oak that could speak.",
        "Fifty heroes rowed her, among them Heracles, Orpheus and the twins Castor and Pollux.",
        "After the quest, the ship was set among the stars as one huge constellation, Argo Navis.",
        "In the 1750s the astronomer Lacaille split the ship into three: the Keel, the Stern and the Sails. Carina is the Keel." ] },
      { c: "Māori (Aotearoa New Zealand)", t: "Atutahi, the star apart", parts: [
        "When the god Tāne decorated the sky, he carried the stars in a great basket and set them in the Milky Way.",
        "One star would not go into the basket with the others. It hung from the outside of it instead.",
        "That star is Atutahi, Canopus: the star that stands alone.",
        "Atutahi was honoured as a chiefly star, and its rising before dawn was watched for in the seasons of the year.",
        "Ever since, it shines a little apart from the bright river of the Milky Way." ] },
    ],
    science: [
      "Canopus is the second-brightest star of the night sky, a giant about 310 light-years away. Space probes have used it to steer by.",
      "Eta Carinae is one of the most massive stars known. In the 1840s it erupted and became briefly one of the brightest stars of the sky; it may one day explode as a supernova.",
      "The Carina Nebula around it is a vast star-forming cloud, bigger and brighter than the Orion Nebula.",
    ],
    quiz: { q: "Carina was once part of which giant constellation?", a: "Argo Navis, the ship", wrong: ["Hydra, the water snake", "Centaurus", "The Milky Way"] } },

  { id: "per", con: "Per", name: "Perseus", emoji: "🗡️", fig: [17448, 18246, 18614, 18532, 17529, 17358, 16826, 15863, 14328, 13268, 13531, 14632, 14668, 14576],
    find: "A hero striding along the Milky Way between Cassiopeia and the Pleiades, holding Medusa's head: the winking star Algol.",
    fables: [
      { c: "Ancient Greece", t: "Perseus and Medusa", parts: [
        "A king who wanted Perseus out of the way sent him to bring back the head of Medusa.",
        "Medusa was a Gorgon with snakes for hair, and anyone who looked at her turned to stone.",
        "With Hermes' winged sandals and Athena's polished shield, Perseus watched her only in the reflection.",
        "He struck once, took her head, and flew home, rescuing Andromeda on the way.",
        "In the sky he still holds the head. Its eye is the star Algol, which seems to wink." ] },
      { c: "Arabic star lore", t: "The demon's head", parts: [
        "Arab astronomers inherited the Greek picture and translated its names.",
        "The star in Medusa's head became raʾs al-ghūl, 'the head of the demon', which became our Algol.",
        "Every few days the demon star fades for some hours, then brightens again.",
        "No one recorded a reason until 1783, when a young English astronomer, John Goodricke, timed the winks: every 2 days and 21 hours.",
        "He suggested something was passing in front of it. He was right: Algol has a dimmer companion star, and they eclipse each other." ] },
    ],
    science: [
      "Algol is an eclipsing binary: two stars orbiting so that, as seen from Earth, the dimmer one passes in front of the brighter one every 2.87 days.",
      "Each August the Perseids, one of the best meteor showers of the year, seem to come from Perseus. They are dust from comet Swift-Tuttle.",
      "The Double Cluster, two star clusters side by side, is a fine sight in binoculars between Perseus and Cassiopeia.",
    ],
    quiz: { q: "Why does Algol fade every few days?", a: "A companion star passes in front of it", wrong: ["Clouds of dust drift past it", "It is a dying star going out", "Earth's atmosphere blocks it"] } },

  { id: "her", con: "Her", name: "Hercules", emoji: "💪", fig: [80816, 81693, 81833, 84380, 83207, 85112, 84379, 86974, 87808, 80170, 84345],
    find: "A kneeling hero, upside down from our point of view, between Vega and the Northern Crown. Look for the Keystone: four stars in a lopsided square.",
    fables: [
      { c: "Ancient Greece", t: "The Kneeler", parts: [
        "The oldest Greek star poems don't name this figure at all. They just call him the Kneeler, a weary man on one knee.",
        "Later, people decided he must be Heracles, the strongest of heroes.",
        "Heracles had to complete twelve labours: the Nemean lion, the many-headed Hydra, the golden apples guarded by the dragon, and more.",
        "In the sky he kneels with one foot on the dragon's head, as if the labours are finally done.",
        "He is upside down to us, so look for his feet near the top and his head, Rasalgethi, near the bottom." ] },
      { c: "Arabic star lore", t: "The kneeler's head", parts: [
        "The Arabic name for his brightest star, Rasalgethi, means 'the head of the kneeler'.",
        "Next to it is Rasalhague, 'the head of the snake-charmer', in the neighbouring constellation Ophiuchus.",
        "So two heads sit almost touching: a kneeling man and a man holding a great serpent.",
        "Rasalgethi is a red giant, so large it would swallow the orbit of Mars if it replaced our Sun.",
        "The old names were kept even when the old pictures were forgotten." ] },
    ],
    science: [
      "M13, the Great Globular Cluster, is a ball of several hundred thousand stars about 22,000 light-years away, on one side of the Keystone.",
      "In 1974 the Arecibo radio telescope beamed a message toward M13. It will take about 22,000 years to arrive.",
      "Our Sun and its planets are moving through space roughly toward Hercules, at about 20 kilometres a second relative to the stars nearby.",
    ],
    quiz: { q: "What was sent toward the cluster M13 in 1974?", a: "A radio message from the Arecibo telescope", wrong: ["The Voyager spacecraft", "A laser beam from the Moon", "A golden record"] } },

  { id: "del", con: "Del", name: "Delphinus the Dolphin", emoji: "🐬",
    find: "A small, neat diamond of stars with a tail, leaping just east of the bright star Altair.",
    fables: [
      { c: "Ancient Greece", t: "Arion and the dolphin", parts: [
        "Arion was the most famous singer of his day, and he was sailing home with a fortune in prizes.",
        "The sailors decided to kill him and keep the gold. Arion asked for one last song.",
        "He sang so beautifully that dolphins gathered round the ship. Then he leapt into the sea.",
        "A dolphin carried him on its back all the way to shore, and the sailors were caught when they landed.",
        "Apollo, god of music, set the dolphin among the stars." ] },
      { c: "Italy (1814)", t: "The astronomer's joke", parts: [
        "In 1814 a new star catalogue came out of the Palermo Observatory in Sicily.",
        "Two stars of the Dolphin appeared in it with strange names nobody had heard: Sualocin and Rotanev.",
        "No Arabic or Greek scholar could explain them. For decades they were a mystery.",
        "Then someone read them backwards: Nicolaus Venator, the Latin name of Niccolò Cacciatore, the assistant astronomer.",
        "He had quietly named two stars after himself, and the names are still on the official list." ] },
    ],
    science: [
      "The diamond of the Dolphin is also called Job's Coffin, an old name whose origin no one is sure of.",
      "Delphinus is one of the smallest constellations, but its tight shape makes it one of the easiest to recognise.",
      "In 2013 a nova, a star that suddenly flared up thousands of times brighter, appeared in Delphinus and was visible in binoculars.",
    ],
    quiz: { q: "Spelled backwards, the stars Sualocin and Rotanev name…", a: "Nicolaus Venator, an astronomer", wrong: ["Two Greek gods", "The dolphin's eyes", "An Arabic poem"] } },

  { id: "crb", con: "CrB", name: "Corona Borealis", emoji: "💍",
    find: "A small semicircle of stars like a crown or a ring, between Arcturus and Vega, with one bright jewel: Alphecca.",
    fables: [
      { c: "Ancient Greece", t: "Ariadne's crown", parts: [
        "Princess Ariadne of Crete helped Theseus escape the Labyrinth with a ball of thread.",
        "He sailed away with her, but left her asleep on the island of Naxos.",
        "There the god Dionysus found her weeping, and fell in love with her.",
        "At their wedding he gave her a crown of jewels made by the smith god Hephaestus.",
        "He threw it into the sky, where its jewels became stars." ] },
      { c: "Shawnee (North America)", t: "The star sisters", parts: [
        "A young hunter, White Hawk, found a strange ring trodden into the prairie grass.",
        "As he watched, a basket floated down from the sky, carrying sisters from the stars, who danced in the ring.",
        "He fell in love with the youngest and caught her, and she stayed with him on Earth for a time.",
        "But she longed for home, and one day she climbed into the basket and rose back to the sky.",
        "The circle of stars is the sisters' dancing ring. Some tellings say White Hawk later followed her there." ] },
    ],
    science: [
      "T Coronae Borealis is a recurrent nova: a white dwarf that steals gas from a companion and flares up about every 80 years, last seen in 1946.",
      "Astronomers spent the mid-2020s watching for its next outburst, when it would briefly become as bright as the Crown's brightest star.",
      "Alphecca is an eclipsing binary, like Algol, but its brightness dips only very slightly.",
    ],
    quiz: { q: "What is T Coronae Borealis?", a: "A recurrent nova that flares every 80 years or so", wrong: ["A black hole", "A comet that returns", "A dwarf planet"] } },

  { id: "vir", con: "Vir", name: "Virgo the Maiden", emoji: "🌾",
    find: "A large maiden reclining across the spring sky. Follow the arc of the Big Dipper's handle to Arcturus, then speed on to Spica, the ear of wheat in her hand.",
    fables: [
      { c: "Ancient Greece", t: "Astraea leaves the Earth", parts: [
        "In the Golden Age, gods lived among people, and Astraea, goddess of justice, walked the Earth.",
        "As people grew greedy and quarrelsome, the gods left one by one.",
        "Astraea stayed longest, still hoping people would change.",
        "When the Age of Iron came, with war and cruelty, even she gave up and rose to the sky.",
        "She is the Maiden, and next to her are the Scales of justice, Libra." ] },
      { c: "Babylon", t: "The Furrow", parts: [
        "Babylonian farmers didn't see a maiden here. They saw the Furrow, a line ploughed in a field.",
        "Its brightest star, our Spica, was linked with an ear of barley, held by the goddess Shala.",
        "When the Furrow appeared before dawn, it was a sign that the season had come round again.",
        "The Greeks kept the ear of grain: Spica means 'ear of wheat' in Latin.",
        "So the Maiden still holds the harvest of a field ploughed in Mesopotamia 3,000 years ago." ] },
    ],
    science: [
      "Spica is two hot blue stars so close together that they are stretched into egg shapes, orbiting each other every four days.",
      "In Virgo lies the Virgo Cluster, more than a thousand galaxies about 54 million light-years away.",
      "The first photo of a black hole, released in 2019, was of the giant black hole in M87, a galaxy of the Virgo Cluster.",
    ],
    quiz: { q: "In what year was the first image of a black hole (in M87) released?", a: "2019", wrong: ["1969", "1995", "2009"] } },

  { id: "cep", con: "Cep", name: "Cepheus the King", emoji: "🏠",
    find: "A dim house with a pointed roof near the north pole, next to Cassiopeia's W. The roof points toward Polaris.",
    fables: [
      { c: "Ancient Greece", t: "The quiet king", parts: [
        "Cepheus was king of Ethiopia, husband of the boastful Cassiopeia and father of Andromeda.",
        "When his wife's boast brought a sea monster to his shores, he was told to sacrifice his own daughter.",
        "He did as the oracle said, and chained her to the rock, but he could not bear to watch.",
        "When Perseus saved her, Cepheus gladly promised her to the hero in marriage.",
        "He sits in the sky beside his queen, near the pole, never setting from northern lands." ] },
      { c: "Ancient China", t: "Zaofu, the king's charioteer", parts: [
        "King Mu of Zhou loved to travel, and his charioteer was the best who ever lived: Zaofu.",
        "Zaofu drove eight famous horses, so fast it was said they could run a thousand miles in a day.",
        "He carried the king far to the west, to the Kunlun mountains, to feast with the Queen Mother of the West.",
        "When a rebellion broke out at home, Zaofu raced the king back in time to save the kingdom.",
        "Chinese astronomers named a row of stars in Cepheus after him, and the first of them is the star we call Delta Cephei." ] },
    ],
    science: [
      "Delta Cephei pulses brighter and dimmer every 5.4 days. Stars like it, Cepheids, were used by Henrietta Leavitt in 1912 to find a way of measuring distances.",
      "In 1924 Edwin Hubble found Cepheids in the Andromeda 'nebula' and proved it was a separate galaxy, far beyond our own.",
      "Mu Cephei, the Garnet Star, is one of the largest stars known: a deep red supergiant.",
    ],
    quiz: { q: "What are Cepheid stars like Delta Cephei used for?", a: "Measuring distances across space", wrong: ["Finding north", "Predicting eclipses", "Timing the tides"] } },

  { id: "ari", con: "Ari", name: "Aries the Ram", emoji: "🐏",
    find: "A short, bent line of three stars between the Pleiades and the Great Square of Pegasus: the head of a ram.",
    fables: [
      { c: "Ancient Greece", t: "The ram with the golden fleece", parts: [
        "Two children, Phrixus and Helle, were in danger from a cruel stepmother.",
        "Their mother sent a magical flying ram with golden wool to carry them away.",
        "As they flew over the sea, Helle slipped and fell. The strait where she fell is still called the Hellespont.",
        "Phrixus reached the land of Colchis safely, and the ram's golden fleece was hung in a sacred grove, guarded by a dragon.",
        "Years later Jason and the Argonauts sailed to fetch it, and the ram itself was set in the sky." ] },
      { c: "Ancient China", t: "Lou, the bond", parts: [
        "In the Chinese sky, these stars are Lou, one of the 28 lunar mansions the Moon visits on its monthly journey.",
        "Lou means a bond, or a tether: the rope that ties animals ready for sacrifice and feast.",
        "It belongs to the White Tiger of the West, the guardian of autumn.",
        "Nearby are the stars of the granaries and the farm officials, stores laid by for winter.",
        "So in China this part of the sky was a busy farmyard, with the Moon calling in each month." ] },
    ],
    science: [
      "About 2,000 years ago the Sun stood in Aries at the March equinox. Astronomers still call that spot the 'First Point of Aries'.",
      "Earth's slow wobble has carried that point into Pisces now, and in about 600 years it will reach Aquarius.",
      "Mesarthim was one of the first double stars discovered with a telescope, by Robert Hooke in 1664.",
    ],
    quiz: { q: "Where is the 'First Point of Aries' (the March equinox) today?", a: "In Pisces", wrong: ["Still in Aries", "In Leo", "At the north celestial pole"] } },

  { id: "cap", con: "Cap", name: "Capricornus the Sea-goat", emoji: "🌊",
    find: "A faint, wide triangle like a smile or an arrowhead, low in autumn evenings, east of Sagittarius's teapot.",
    fables: [
      { c: "Ancient Greece", t: "Pan's escape", parts: [
        "The gods were feasting by the Nile when the monster Typhon burst in on them.",
        "Every god changed shape and fled. Pan, the goat-legged god, jumped into the river.",
        "In his panic he only half changed: the part of him underwater became a fish, the part above stayed a goat.",
        "Zeus thought the sight so funny, and Pan's quick thinking so clever, that he set the sea-goat in the sky.",
        "Our word 'panic' comes from Pan, whose sudden shouts could scatter whole armies." ] },
      { c: "Babylon", t: "The goat-fish of Ea", parts: [
        "The sea-goat is one of the oldest figures in the sky, far older than the Greeks.",
        "The Babylonians called it Suhurmashu, the goat-fish, and drew it on boundary stones 3,000 years ago.",
        "It belonged to Ea, the god of fresh water and wisdom, who lived in the deep waters under the Earth.",
        "Ea was the god who gave people crafts, writing and knowledge.",
        "So the goat-fish swims in the part of the sky the Babylonians called the Sea, along with the Fish and the Water-bearer." ] },
    ],
    science: [
      "The Tropic of Capricorn is named after it: about 2,000 years ago the Sun stood in Capricornus at the December solstice. Today it is in Sagittarius.",
      "Deneb Algedi, the goat's tail, is an eclipsing binary that dims slightly every 24 hours.",
      "Capricornus is one of the faintest constellations of the zodiac, best seen from a dark site.",
    ],
    quiz: { q: "Why is the Tropic of Capricorn named after the Sea-goat?", a: "The Sun stood in Capricornus at the December solstice 2,000 years ago", wrong: ["Goats live along it", "Capricornus is overhead there all year", "The Babylonians drew it there"] } },
];

/** More fables for constellations already in the deck (appended, so earlier fable numbers stay the same). */
export const EXTRA = {
  uma: [{ c: "Inuit (Arctic Canada)", t: "Tukturjuit, the caribou", parts: [
    "For many Inuit, the seven stars of the Dipper are not a bear or a ladle, but caribou: Tukturjuit.",
    "Caribou meant food, clothing and tools, and hunters followed the herds across the tundra.",
    "In the long Arctic winter, when the Sun doesn't rise for weeks, the stars told the time instead.",
    "Watching how far the caribou had turned around the pole, a hunter could tell how much of the night was gone.",
    "So the herd in the sky was a clock, circling all night above the snow." ] }],
  cas: [{ c: "Navajo (Diné)", t: "The Revolving Woman", parts: [
    "For the Navajo, the stars around the north were placed with care by Black God, and each has a lesson.",
    "The Dipper is Náhookos Bikaʼí, the Revolving Man, and Cassiopeia is Náhookos Biʼáád, the Revolving Woman.",
    "Between them burns the central fire, Náhookos Bikǫʼ, the North Star, around which they circle without ever leaving.",
    "Like a family in a hogan, they keep to their places, and one may not cross to the other's side.",
    "Their slow circling teaches that a home is kept by staying close to the fire. Traditionally, their stories are told only in winter." ] }],
};
