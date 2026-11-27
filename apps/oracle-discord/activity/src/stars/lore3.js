// Star Lore Navigator, more voices: every constellation gets at least two stories from outside ancient Greece (Frank,
// 2026-11-27). Only traditions with a documented source are used: Babylonian star lists (MUL.APIN), Chinese star maps
// (the lunar mansions and enclosures), Arabic star names, the Boorong records from Victoria (W. E. Stanbridge, 1857),
// Mongolian and Kazakh pole-star names. Where a detail is uncertain, the text says so. Appended after existing fables.

const f = (c, t, parts) => ({ c, t, parts });

export const MORE_VOICES = {
  cyg: [f("Arabic star lore", "The flying hen", [
    "Before Greek books reached them, Arab stargazers saw a bird here too, but a humbler one: al-dajāja, the hen.",
    "The bright star at the tail was dhanab al-dajāja, 'the hen's tail'.",
    "That phrase was shortened over the centuries, and it is where the name Deneb comes from.",
    "'Deneb' simply means 'tail', which is why several other stars, like Denebola in Leo, have it in their names too.",
    "So the swan's brightest star still carries the memory of a hen flying down the Milky Way." ])],
  leo: [f("Babylon", "The King star", [
    "Babylonian astronomers also saw a lion here: UR.GU.LA, the Great Lion.",
    "Its brightest star, on the lion's chest, they called LUGAL, 'the King'.",
    "The Moon and planets pass very close to it, and Babylonian scribes recorded these meetings carefully as omens for their own kings.",
    "The idea of a royal star travelled west. The Greeks called it Basiliskos, 'little king', and the Romans Regulus.",
    "So the name Regulus is a Latin translation of a Babylonian title more than 3,000 years old." ])],
  gem: [
    f("Boorong (Victoria, Australia)", "Yurree and Wanjel", [
      "The Boorong people of north-western Victoria saw the two bright stars of the Twins as two young men, Yurree and Wanjel.",
      "They were hunters, and their prey was Purra, the kangaroo: the bright star we call Capella.",
      "Through the year the hunters follow the kangaroo across the sky.",
      "When the great heat of summer begins, they catch it and kill it.",
      "The haze and mirages of the hot season were said to be the smoke of the fire where they roast it." ]),
    f("Babylon", "The Great Twins at the gate", [
      "Babylonian star lists, more than 3,000 years old, already name these stars the Great Twins, MASH.TAB.BA GAL.GAL.",
      "They were two gods, Lugal-irra and Meslamta-ea.",
      "Their task was to guard the gates of the underworld, one on each side of the door.",
      "Images of the pair were set up by real doorways too, to keep evil out of houses.",
      "Long before Castor and Pollux, these two stars were twin doorkeepers." ]),
  ],
  lyr: [f("Arabic star lore", "The swooping eagle", [
    "Arab stargazers saw two great birds on either side of the Milky Way.",
    "One, with its wings folded as it dropped onto its prey, was al-nasr al-wāqiʿ, 'the swooping eagle' (some say vulture).",
    "Its bright star is the one we call Vega, a name worn down from wāqiʿ, 'swooping'.",
    "The other bird, across the river of stars, had its wings spread wide: the flying eagle, our Altair.",
    "The two birds, one diving and one soaring, face each other across the summer sky." ])],
  aql: [f("Arabic star lore", "The flying eagle", [
    "Across the Milky Way from Vega, Arab astronomers saw a second eagle: al-nasr al-ṭāʾir, 'the flying eagle'.",
    "Its wings are the two fainter stars on either side of the bright one.",
    "Its name, al-ṭāʾir, 'the flier', became our Altair.",
    "Here the Arabic and Greek skies agreed: both saw an eagle in these stars.",
    "In the Greek story it was the eagle of Zeus. In the Arabic one, simply a great bird in flight." ])],
  cma: [f("Ancient China", "The Celestial Wolf", [
    "In China, Sirius was not a dog but Tianlang, the Celestial Wolf.",
    "A wolf in the sky was a warning: it stood for invaders and bandits.",
    "South-east of it, Chinese astronomers drew a great bow and arrow, Hushi, from stars in the Big Dog and the ship's stern.",
    "The arrow is aimed straight at the wolf, keeping it in check.",
    "The poet Su Shi wrote of drawing the bow like a full moon to 'shoot the Heavenly Wolf', meaning to defend the country." ])],
  umi: [f("Mongolian and Kazakh herders", "The golden stake", [
    "On the steppes of Central Asia, herders tie their horses to a stake driven into the ground.",
    "Mongolian herders called Polaris Altan Gadas, the Golden Stake, and Kazakhs called it Temir Qazyq, the Iron Stake.",
    "Tied to it, they said, were heavenly horses that circle it all night long.",
    "The stars of the Little Dipper and the Big Dipper are the horses walking round and round their tether.",
    "Only the stake stays still, which is why it could be trusted to point the way north." ])],
  boo: [f("Ancient China", "The Great Horn", [
    "In the Chinese sky the whole eastern quarter is the Azure Dragon, stretched across several constellations.",
    "Arcturus is Dajiao, the Great Horn, part of the dragon's head.",
    "Spica, farther south, is the dragon's other horn and the first of the 28 lunar mansions.",
    "In spring evenings the dragon's horns rise first in the east, and that was a sign that the growing season had begun.",
    "So when you see Arcturus rising, you are watching a dragon lift its head." ])],
  peg: [f("Ancient China", "The Encampment and the Wall", [
    "The Great Square of Pegasus was two lunar mansions in China, both in the northern quarter of the Black Tortoise.",
    "The western side of the square was Shi, the Encampment, or House.",
    "The eastern side was Bi, the Wall.",
    "When the Encampment stood high in the evening sky, it was the season for building and repairing homes before winter.",
    "So in China the square was a house under construction, marking the time to put up walls." ])],
  aur: [
    f("Boorong (Victoria, Australia)", "Purra the kangaroo", [
      "For the Boorong people, the bright star Capella was Purra, the kangaroo.",
      "Two hunters, Yurree and Wanjel, the stars of the Twins, are always following it across the sky.",
      "As the year turns, the hunters close in.",
      "At the start of the great summer heat they catch Purra and kill it.",
      "The shimmering mirages of the hot season were the smoke of their cooking fire." ]),
    f("Ancient China", "The Five Chariots", [
      "Chinese astronomers saw five chariots here, Wuche, drawn from the bright stars of the Charioteer.",
      "Each chariot was linked with one of the five planets and the five directions.",
      "They were the war chariots of the Heavenly Emperor, kept ready near the Milky Way.",
      "Astronomers watched how bright they looked to judge whether the harvest would be plentiful.",
      "Capella is one of them: the chariot of the west." ]),
  ],
  cen: [f("Ancient China", "The Southern Gate", [
    "Far down in the south, two bright stars made a doorway in the Chinese sky: Nanmen, the Southern Gate.",
    "The brighter of the two was Alpha Centauri, the star we now know is our nearest neighbour.",
    "From northern China it skims just above the southern horizon, so it was a frontier star, at the very edge of the visible heavens.",
    "A gate at the edge of the sky made sense: beyond it lay the stars no one in China could see.",
    "European sailors later named the same stars the Pointers, for showing the way to the Southern Cross." ])],
  and: [f("Ancient China", "Kui, the stride", [
    "In China, a ring of stars across Andromeda and Pisces was the lunar mansion Kui, often translated 'the Legs' or 'the Stride'.",
    "Its curving shape was also compared to a winding line of writing.",
    "Kui became the star of literature and learning.",
    "Students hoping to pass the imperial exams prayed to Kuixing, the god of examinations, whose name comes from this mansion.",
    "So the chained princess of the Greeks was, in China, the stars that watched over scholars." ])],
  dra: [f("Ancient China", "The wall of the Purple Palace", [
    "Chinese astronomers saw the sky around the pole as a palace: Ziwei, the Purple Forbidden Enclosure, home of the Heavenly Emperor.",
    "Its walls were long lines of stars on each side, and many of those stars belong to our Dragon.",
    "Thuban, the old pole star, sits between the walls, inside the palace.",
    "The emperor's palace on Earth, the Forbidden City in Beijing, takes part of its name from this enclosure.",
    "So the dragon of the Greeks is, in China, the guarded wall around the emperor of the stars." ])],
  crv: [f("Babylon", "The Raven of Adad", [
    "Babylonian star lists already name a raven here, UGA, 'the star of Adad', god of storms.",
    "It was drawn perched on the tail of a great serpent, the constellation that became Hydra.",
    "Its rising was linked with the rains and storms that Adad sent.",
    "The Greeks inherited both the bird and the snake, and wove them into the story of Apollo's crow.",
    "So the crow has sat on the serpent's tail for at least 3,000 years." ])],
  car: [f("Boorong (Victoria, Australia)", "War, the crow who brought fire", [
    "For the Boorong people, the bright star Canopus was War, the crow.",
    "In their story, War was the one who brought fire down from the sky to people on Earth.",
    "Fire meant warmth, cooking and life, so War was honoured among the stars.",
    "Canopus shines low in the southern sky through the year from Victoria, a reminder of the gift.",
    "Nearby, the Boorong saw other ancestors as stars too, like the brothers who hunted the giant emu." ])],
  per: [f("Ancient China", "The pile of corpses", [
    "Chinese astronomers drew a group of stars here called Daling, the Great Mausoleum.",
    "Algol, the winking star, sits within it and was called Jishi, 'piled-up corpses'.",
    "Like the Arabic 'demon's head', it was a star of ill omen.",
    "It is striking that three different cultures, Greek, Arabic and Chinese, all gave this one star a grim name.",
    "Some think people noticed its strange winking long before anyone wrote the reason down." ])],
  her: [f("Ancient China", "The Heavenly Market", [
    "One of the three great enclosures of the Chinese sky is Tianshi, the Heavenly Market.",
    "Its two walls are long chains of stars, many of them in Hercules, with the rest in Serpens and Ophiuchus.",
    "Inside the walls were stars named for traders' stalls, weights and measures, butchers' shops and jewellers.",
    "In the middle sat the emperor's seat, where he came to watch over fair trade.",
    "So where the Greeks saw a weary hero kneeling, Chinese stargazers saw a bustling market." ])],
  del: [f("Ancient China", "The gourd", [
    "Chinese astronomers saw the Dolphin's neat diamond as Hugua, a gourd.",
    "Gourds were dried and used as bottles and ladles, and as floats.",
    "Next to it lay Baijiang, 'the rotten gourd', made of fainter stars.",
    "Whether the gourds looked bright or dim was read as a sign for the harvest.",
    "The same little diamond has been a dolphin, a coffin, and a gourd." ])],
  crb: [f("Ancient China", "The coiled rope", [
    "Chinese astronomers saw the half-circle of the Crown as Guansuo, the Coiled Rope.",
    "It stood for a prison where ordinary people were held.",
    "When few of its stars could be seen, it was said there were few prisoners and the country was at peace.",
    "When the stars inside the ring looked bright, there would be many in jail.",
    "So the same ring of stars was a crown of jewels in Greece and a prison rope in China." ])],
  vir: [f("Ancient China", "The Horn of the dragon", [
    "Spica is Jiao, the Horn, the first of the 28 lunar mansions of China.",
    "It is the horn of the Azure Dragon of the east, whose body stretches through the Scorpion.",
    "Jiao was where the Moon's monthly journey through the mansions was counted from.",
    "When the dragon's horn appeared in the east at dusk, spring had arrived and farmers began work.",
    "So both the Babylonians and the Chinese linked Spica with the start of the farming year." ])],
  cep: [f("Arabic star lore", "The shepherd and his flock", [
    "Arab herders saw a shepherd in these northern stars: al-rāʿī, the shepherd, with his dog close by.",
    "Fainter stars around him were his sheep, grazing near the pole.",
    "Errai, the name of the star at the top of Cepheus, comes from al-rāʿī.",
    "It fits: a shepherd who never sets, keeping watch all night.",
    "Errai will be the pole star itself in about 2,000 years, as the slow wobble of the Earth moves the pole." ])],
  ari: [f("Babylon", "The Hired Man", [
    "In the oldest Babylonian star lists these stars were not a ram at all, but LU.HUN.GA, the Hired Man, a farm labourer.",
    "He marked the season when farm workers were hired, at the start of the agricultural year in spring.",
    "Over time, the sign was reinterpreted. The word for 'hired man' was written much like the word for 'sheep'.",
    "By Greek times the labourer had become a ram, and the ram was linked with the Golden Fleece.",
    "So the zodiac's first sign began, it seems, as a worker waiting for his wages." ])],
  cap: [f("Ancient China", "The Ox", [
    "In China, the bright stars at the goat's head were the lunar mansion Niu, the Ox.",
    "Niu belongs to the Black Tortoise of the north.",
    "It is linked with the Cowherd of the famous love story, who led an ox and was parted from the Weaver Girl by the Milky Way.",
    "Some tellings place the Cowherd at Altair and his ox here, close behind.",
    "So the sea-goat of the Greeks was, in China, a patient ox." ])],
};
