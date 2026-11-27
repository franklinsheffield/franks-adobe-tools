// Study guides for History of Magic: one per era, covering every card in that era in order, with the big ideas that
// connect them. Original text for Science is Magic. Markup is limited to <b> and <i>; rendered by room.js.
export const GUIDES = {
  ancient: {
    title: "The Ancient World study guide",
    sections: [
      { h: "How to think about this era", p: [
        "Ancient dates are often <b>approximate</b>: we date papyri by handwriting and objects by style, so you'll see <b>c.</b> (circa, ‘about’). In this game, cards with uncertain dates are never dealt next to anything they could overlap with.",
        "In the ancient world, <b>magic, religion and science were not separate</b>. The same person might study the stars to predict eclipses and to cast horoscopes.",
      ] },
      { h: "Egypt and the first magicians (c. 1700 BCE)", p: [
        "The <b>Westcar Papyrus</b> (c. 1700 BCE, now in Berlin) tells tales of magicians at the court of <b>Khufu</b>, builder of the Great Pyramid. The magician <b>Djedi</b> rejoins a goose's severed head. It's one of the oldest stories of magic performed for an audience.",
      ] },
      { h: "Oracles and the stars (c. 750–410 BCE)", p: [
        "The <b>Oracle of Delphi</b> rose to fame from about <b>750 BCE</b>. A priestess, the <b>Pythia</b>, spoke for Apollo. Geologists have found faults under the temple, but whether gases caused her trances is still debated.",
        "The <b>oldest known horoscope</b> is a Babylonian clay tablet for a birth on <b>29 April 410 BCE</b>. Babylonian sky records fed both astronomy and astrology.",
      ] },
      { h: "Number, geometry and natural causes (c. 530–300 BCE)", p: [
        "<b>Pythagoras</b> founded his school at <b>Croton</b> in about <b>530 BCE</b>: number is the order of the cosmos, and musical harmony follows ratios like 2:1.",
        "About <b>400 BCE</b>, a Hippocratic doctor wrote <b>On the Sacred Disease</b>, arguing epilepsy has natural causes and calling charm-healers frauds: an early skeptic.",
        "<b>Plato's Timaeus</b> (c. <b>360 BCE</b>) built the four elements from regular solids, now called the <b>Platonic solids</b>. <b>Euclid's Elements</b> (c. <b>300 BCE</b>, Alexandria) organised all of Greek geometry and proved there are exactly five such solids.",
      ] },
      { h: "Machines of wonder (c. 100 BCE–64 CE)", p: [
        "The <b>Antikythera mechanism</b> (c. <b>100 BCE</b>, found in a shipwreck in 1901) is a geared bronze computer that predicted eclipses.",
        "<b>Hero of Alexandria</b> (c. <b>60 CE</b>) designed temple doors that opened when an altar fire was lit and a coin-operated holy water machine: <b>science used to make ‘miracles’</b>.",
        "<b>Seneca</b>'s letters (c. <b>64 CE</b>) mention conjurors' <b>cups and pebbles</b>, one of the oldest written references to the cups and balls.",
      ] },
      { h: "Astrology, exposés and alchemy (c. 150–390s CE)", p: [
        "<b>Ptolemy</b> (c. <b>150 CE</b>) wrote the <b>Almagest</b> (astronomy, Earth at the centre) and the <b>Tetrabiblos</b> (astrology). Both ruled for over a thousand years.",
        "<b>Lucian of Samosata</b> (c. <b>180 CE</b>) exposed the false prophet <b>Alexander of Abonoteichus</b> and his puppet-headed snake god Glycon, explaining how sealed questions were secretly opened.",
        "<b>Zosimos of Panopolis</b> (c. <b>300 CE</b>) is one of the earliest named alchemists. He credits <b>Maria the Jewess</b>, remembered in the <b>bain-marie</b>.",
        "In the <b>390s CE</b>, Emperor <b>Theodosius I</b> banned pagan worship and <b>Delphi fell silent</b>.",
      ] },
    ],
  },
  renaissance: {
    title: "Middle Ages & Renaissance study guide",
    sections: [
      { h: "How to think about this era", p: [
        "Knowledge flowed from the <b>Islamic world</b> into Europe through translation, and the <b>printing press</b> (from about 1450) spread both science and witch-hunting manuals fast.",
        "Many great scientists of this time also practised astrology or alchemy. The split between ‘magic’ and ‘science’ was still forming.",
      ] },
      { h: "Light and translation (1011–1267)", p: [
        "<b>Ibn al-Haytham</b>'s <b>Book of Optics</b> (Cairo, <b>1011–1021</b>) showed light enters the eye and described the <b>camera obscura</b>. He insisted on experiment.",
        "The Arabic <b>Picatrix</b>, a handbook of planetary talismans, was translated at the court of <b>Alfonso X of Castile</b> in <b>1256</b>.",
        "<b>Roger Bacon</b>'s <b>Opus Majus</b> (<b>1267</b>) urged testing nature by experience and argued many ‘magical’ wonders were natural. Legend still made him a wizard.",
      ] },
      { h: "The Renaissance magus (1463–1533)", p: [
        "<b>Marsilio Ficino</b> translated the <b>Corpus Hermeticum</b> for Cosimo de' Medici in <b>1463</b>. Thought to be ancient Egyptian, it was shown by <b>Isaac Casaubon (1614)</b> to date from the early Christian era.",
        "The <b>Malleus Maleficarum</b> (<b>1486</b>) by inquisitor Heinrich Kramer became the notorious witch-hunting manual.",
        "<b>Paracelsus</b> burned the standard medical textbook in <b>Basel, 1527</b>, and brought chemistry into medicine: ‘<b>the dose makes the poison</b>’.",
        "<b>Agrippa</b>'s <b>Three Books of Occult Philosophy</b> (<b>1533</b>) organised magic into natural, celestial and ceremonial.",
      ] },
      { h: "New skies and prophecy (1543–1582)", p: [
        "<b>Copernicus</b> put the Sun at the centre in <b>1543</b>. <b>Nostradamus</b> published his vague verses in <b>1555</b>. <b>Tycho Brahe</b> measured a new star, a supernova, in <b>1572</b>, proving the heavens change.",
        "<b>John Dee</b> began his angel sessions with scryer <b>Edward Kelley</b> in <b>1582</b>, recording the ‘Enochian’ language.",
      ] },
      { h: "Witches, skeptics and solids (1584–1597)", p: [
        "<b>Reginald Scot</b>'s <b>Discoverie of Witchcraft</b> (<b>1584</b>) denied witches had powers and taught how conjuring tricks work, the first big English book on sleight of hand.",
        "<b>Kepler</b>'s <b>Mysterium Cosmographicum</b> (<b>1596</b>) nested the planets' orbits in Platonic solids. Wrong, but it led him to his true laws.",
        "<b>King James VI</b>'s <b>Daemonologie</b> (<b>1597</b>) defended witch trials, partly in reply to Scot.",
      ] },
      { h: "Telescopes, secret brothers and a trick book (1610–1634)", p: [
        "<b>Galileo</b>'s <b>Starry Messenger</b> (<b>1610</b>) showed moons orbiting Jupiter.",
        "The <b>Fama Fraternitatis</b> (<b>1614</b>) announced the secret <b>Rosicrucians</b>, who no one could ever find.",
        "<b>Hocus Pocus Junior</b> (<b>1634</b>) is one of the first English books written purely to teach magic tricks for entertainment.",
      ] },
    ],
  },
  wonders: {
    title: "Age of Reason & Wonders study guide",
    sections: [
      { h: "How to think about this era", p: [
        "Science grows into its modern form, the law stops treating witchcraft as real, and magic moves to the <b>theatre</b>. Meanwhile <b>Spiritualism</b> and occult orders boom, and the first <b>organised tests</b> of paranormal claims appear.",
      ] },
      { h: "Chemistry, gravity and Salem (1661–1692)", p: [
        "<b>Robert Boyle</b>'s <b>Sceptical Chymist</b> (<b>1661</b>) pushed chemistry toward experiment. He still practised alchemy.",
        "<b>Newton</b>'s <b>Principia</b> (<b>1687</b>) gave the laws of motion and gravity. Newton wrote over a million words on alchemy; Keynes called him ‘the last of the magicians’.",
        "The <b>Salem witch trials</b> (<b>1692</b>): 19 hanged, Giles Corey pressed to death.",
      ] },
      { h: "Law, automata and blind tests (1735–1798)", p: [
        "Britain's <b>Witchcraft Act of 1735</b> made <i>pretending</i> to have magical powers the crime.",
        "The chess-playing <b>Mechanical Turk</b> (<b>1770</b>) hid a human player.",
        "In <b>1784</b> a French royal commission with <b>Benjamin Franklin</b> and <b>Lavoisier</b> tested <b>Mesmer</b>'s ‘animal magnetism’ with blindfolds, one of the first <b>blind trials</b>. Result: suggestion, not magnetism.",
        "<b>Robertson</b>'s <b>Fantasmagorie</b> (Paris, <b>1798</b>) projected ghosts with a magic lantern on wheels.",
      ] },
      { h: "Modern magic and Spiritualism (1845–1855)", p: [
        "<b>Robert-Houdin</b> opened his <b>Soirées Fantastiques</b> in Paris in <b>1845</b>, performing in evening dress.",
        "The <b>Fox sisters</b>' rappings (<b>1848</b>) started Spiritualism. Margaret confessed in 1888: toe joints.",
        "<b>Faraday</b> tested table-turning in <b>1853</b> and showed sitters pushed without knowing: the <b>ideomotor effect</b>.",
        "<b>Éliphas Lévi</b>'s <b>Dogma and Ritual of High Magic</b> (<b>1854–56</b>) linked tarot and Kabbalah and drew the Baphomet.",
      ] },
      { h: "Ghosts on glass and on film plates (1862–1869)", p: [
        "<b>William Mumler</b>'s first ‘<b>spirit photograph</b>’ (early <b>1860s</b>) was a double exposure; at his 1869 trial P. T. Barnum testified against him.",
        "<b>Pepper's Ghost</b> (<b>1862</b>) used angled glass to put a reflected ‘ghost’ on stage.",
        "In <b>1865</b> <b>John Nevil Maskelyne</b> reproduced the <b>Davenport brothers</b>' spirit cabinet as an open trick.",
        "<b>Mendeleev</b>'s <b>periodic table</b> (<b>1869</b>) predicted undiscovered elements.",
      ] },
      { h: "Hidden masters and their investigators (1875–1896)", p: [
        "<b>Blavatsky</b> and <b>Olcott</b> founded the <b>Theosophical Society</b> in New York in <b>1875</b>. The <b>Society for Psychical Research</b> (London, <b>1882</b>) brought scientific method to séances and coined ‘telepathy’.",
        "The <b>Golden Dawn</b> (<b>1888</b>) taught ceremonial magic in grades; its tarot ideas led to the 1909 Rider-Waite deck.",
        "The <b>Indian Rope Trick</b> was a <b>Chicago Tribune</b> hoax of <b>1890</b>, retracted four months later.",
        "<b>Georges Méliès</b> began making trick films in <b>1896</b>: stop the camera, and people vanish.",
      ] },
    ],
  },
  modern: {
    title: "The Modern Age study guide",
    sections: [
      { h: "How to think about this era", p: [
        "Magicians become the experts on deception, and many of the best tests of psychic claims are designed with their help. Science learns to <b>blind</b> its tests and to <b>repeat</b> results before trusting them.",
      ] },
      { h: "The golden age of stage magic (1905–1924)", p: [
        "<b>The Magic Circle</b> was founded in London in <b>1905</b>.",
        "<b>Houdini</b> debuted the <b>Water Torture Cell</b> in Berlin in <b>1912</b>.",
        "The <b>Cottingley Fairies</b> photographs (<b>1917</b>) fooled Arthur Conan Doyle; in 1983 the cousins admitted to paper cut-outs.",
        "In <b>1924</b> Houdini judged the <b>Scientific American</b> prize and exposed the medium ‘<b>Margery</b>’ (Mina Crandon).",
      ] },
      { h: "Labs, laws and a new religion (1934–1954)", p: [
        "<b>J. B. Rhine</b>'s <b>Extra-Sensory Perception</b> (<b>1934</b>) used Zener cards; other labs couldn't reproduce it.",
        "Britain's <b>Fraudulent Mediums Act</b> (<b>1951</b>) replaced the 1735 Witchcraft Act.",
        "<b>Gerald Gardner</b>'s <b>Witchcraft Today</b> (<b>1954</b>) launched modern <b>Wicca</b>, which historians show was largely built in the 20th century.",
      ] },
      { h: "Magicians as investigators (1973–1996)", p: [
        "On <b>The Tonight Show</b> in <b>1973</b>, Uri Geller failed when <b>James Randi</b> had advised the show to control the props.",
        "<b>CSICOP</b> (<b>1976</b>, now the Committee for Skeptical Inquiry) united scientists and magicians.",
        "<b>Project Alpha</b> was revealed in <b>1983</b>: two young magicians had fooled a parapsychology lab. Also in <b>1983</b>, <b>David Copperfield</b> ‘vanished’ the Statue of Liberty on TV by slowly turning the audience's platform.",
        "In <b>1988</b> <b>Nature</b> sent John Maddox, Walter Stewart and Randi to check ‘water memory’; under blinding the effect vanished.",
        "Randi's <b>Million Dollar Challenge</b> (<b>1996</b>, foundation set up that year) was never won and ended in 2015.",
      ] },
      { h: "Repeat it or it didn't happen (2011)", p: [
        "<b>Daryl Bem</b>'s ‘<b>Feeling the Future</b>’ (<b>2011</b>) claimed people sense the future. Repeats failed, and the paper helped start psychology's <b>replication crisis</b>, a lesson that runs through this whole timeline: test it, blind it, repeat it.",
      ] },
    ],
  },
};

// ---- Expansion cards (events2.js): one more section per era, plus a guide per themed deck ----
GUIDES.ancient.sections.push({ h: "More from the ancient world", p: [
  "The <b>Ebers Papyrus</b> (c. <b>1550 BCE</b>) lists about seven hundred remedies with spells to say over them. Some, like honey on wounds, really work.",
  "<b>Thales</b> is said by Herodotus to have foretold the solar eclipse of <b>585 BCE</b> (28 May), which stopped a battle. <b>Empedocles</b> (c. <b>450 BCE</b>) taught the <b>four elements</b>, fire, air, earth and water. <b>Eratosthenes</b> (c. <b>240 BCE</b>) measured the size of the Earth from shadows.",
  "<b>Pliny the Elder</b>'s Natural History (<b>77 CE</b>) called magic ‘the most fraudulent of arts’. <b>Apuleius</b> (c. <b>158 CE</b>) was tried for winning a wife by magic and defended himself in his <i>Apology</i>.",
  "The <b>Kylver Stone</b> (c. <b>400 CE</b>, Gotland) lists all 24 runes in order. <b>Ogham</b> stones were carved in Ireland from about the <b>5th century CE</b>: try both scripts in the Rune & Glyph Decoder.",
] });
GUIDES.renaissance.sections.push({ h: "More from the Middle Ages and Renaissance", p: [
  "<b>Gerbert of Aurillac</b>, who taught the abacus and Arabic-style numerals, became <b>Pope Sylvester II</b> in <b>999</b>; legend later gave him a talking brass head. <b>Geoffrey of Monmouth</b> made <b>Merlin</b> famous in about <b>1136</b>.",
  "<b>Fibonacci</b>'s <b>Liber Abaci</b> (<b>1202</b>) taught Europe the digits 0–9. The Maya <b>Dresden Codex</b> (c. <b>1100–1300</b>) tracks Venus and eclipses.",
  "<b>Gutenberg</b>'s printed Bible (c. <b>1455</b>) began the printing age. <b>Pico della Mirandola</b> offered to debate 900 theses in <b>1486</b>, launching Christian Kabbalah.",
  "<b>Columbus</b> used an almanac to ‘predict’ the lunar eclipse of 29 February <b>1504</b> in Jamaica. <b>Della Porta</b>'s <b>Natural Magic</b> (<b>1558</b>) treated magic as nature's hidden workings. <b>Giordano Bruno</b> was burned in Rome in <b>1600</b>. <b>Francis Bacon</b>'s <b>Novum Organum</b> (<b>1620</b>) set out a method of experiment.",
] });
GUIDES.wonders.sections.push({ h: "More from the Age of Reason", p: [
  "The <b>Royal Society</b> (<b>1660</b>): ‘take nobody's word for it’. <b>Newton's Opticks</b> (<b>1704</b>) split white light into colours. <b>Halley's comet</b> returned on time in <b>1758</b>, sixteen years after Halley died.",
  "<b>Lavoisier</b>'s textbook (<b>1789</b>) listed 33 elements and the conservation of mass. <b>Galvani</b>'s twitching frogs (<b>1791</b>) led to Volta's battery. <b>Jenner</b>'s cowpox test (<b>1796</b>) was the first vaccine.",
  "<b>Mary Shelley</b>'s <b>Frankenstein</b> (<b>1818</b>) has its hero read Agrippa and Paracelsus before turning to galvanism. The <b>daguerreotype</b> (<b>1839</b>) brought photography, and soon faked ghosts.",
  "The slate-writer <b>Henry Slade</b> was caught and convicted in London in <b>1876</b>. The <b>Seybert Commission</b> (<b>1887</b>) found no genuine medium. The <b>Ouija board</b> was patented as a toy in <b>1891</b>.",
] });
GUIDES.modern.sections.push({ h: "More from the modern age", p: [
  "<b>Aleister Crowley</b> wrote <b>The Book of the Law</b> in Cairo in <b>1904</b>. The <b>Rider–Waite tarot</b> (<b>1909</b>) was drawn by <b>Pamela Colman Smith</b>.",
  "<b>P. T. Selbit</b> first sawed through a woman on a London stage in <b>1921</b>. <b>Houdini</b> died on Halloween <b>1926</b>, leaving his wife a secret code.",
  "In <b>1952</b>, <b>Carl Jung</b> and <b>Wolfgang Pauli</b> published on <b>synchronicity</b>, and <b>Martin Gardner</b> published <i>In the Name of Science</i>, a founding skeptics' book.",
  "<b>Shawn Carlson</b>'s double-blind test (<b>1985</b>, in Nature) found astrologers matched charts no better than chance. In <b>1988</b>, James Randi's <b>‘Carlos’</b> hoax fooled Australian media.",
] });

const D = (title, sections) => ({ title, sections });
GUIDES["deck-stage"] = D("Stage magic study guide", [
  { h: "Magic as entertainment", p: ["Conjuring is as old as storytelling: the <b>Westcar Papyrus</b> (c. 1700 BCE) has Djedi's goose trick; <b>Hero</b> built temple automata (c. 60 CE); <b>Seneca</b> enjoyed the cups and pebbles (c. 64 CE).", "<b>Reginald Scot</b> (1584) and <b>Hocus Pocus Junior</b> (1634) taught tricks in print, so juggling wouldn't be mistaken for witchcraft."] },
  { h: "Machines and ghosts", p: ["The <b>Mechanical Turk</b> (1770) hid a human chess master. <b>Robertson's Fantasmagorie</b> (1798) projected ghosts. <b>Robert-Houdin</b> (1845) put magic in evening dress. <b>Pepper's Ghost</b> (1862) used angled glass, and <b>Maskelyne</b> copied the Davenports' spirit cabinet (1865).", "<b>Méliès</b> (1896) turned stage tricks into film effects."] },
  { h: "The golden age and after", p: ["<b>The Magic Circle</b> (1905), Houdini's <b>Water Torture Cell</b> (1912), <b>sawing through a woman</b> (1921) and <b>Houdini's death</b> (1926). <b>David Copperfield</b> ‘vanished’ the Statue of Liberty in 1983 by turning the audience."] },
]);
GUIDES["deck-skeptics"] = D("Skeptics vs frauds study guide", [
  { h: "The ancient doubters", p: ["A <b>Hippocratic</b> doctor (c. 400 BCE) called charm-healers frauds. <b>Pliny</b> (77 CE) called magic ‘the most fraudulent of arts’. <b>Lucian</b> (c. 180 CE) exposed a puppet-snake oracle."] },
  { h: "Tests, not trust", p: ["<b>Reginald Scot</b> (1584) explained conjurors' tricks. The <b>Mesmer commission</b> (1784) used blindfolds, one of the first blind trials. <b>Faraday</b> (1853) found the ideomotor effect behind table-turning.", "Spiritualism began with the <b>Fox sisters</b> (1848), who confessed in 1888. Fakers included <b>Mumler</b>'s spirit photos (early 1860s), the <b>Davenports</b> (1865), and <b>Slade</b>'s slates (1876). The <b>Seybert Commission</b> (1887) found no real medium, and the <b>Indian Rope Trick</b> (1890) was a newspaper hoax."] },
  { h: "Magicians join the lab", p: ["The <b>Cottingley fairies</b> (1917) and the medium <b>Margery</b> (1924, exposed by Houdini). <b>Rhine</b>'s ESP (1934) didn't replicate. Randi on <b>The Tonight Show</b> (1973), <b>CSICOP</b> (1976), <b>Project Alpha</b> (1983), <b>Carlson</b>'s astrology test (1985), <b>Carlos</b> and <b>water memory</b> (1988), the <b>Million Dollar Challenge</b> (1996), and <b>Bem</b>'s failed replications (2011)."] },
]);
GUIDES["deck-alchemy"] = D("Alchemy to chemistry study guide", [
  { h: "Elements and transmutation", p: ["<b>Empedocles</b> (c. 450 BCE) gave the four elements; <b>Plato's Timaeus</b> (c. 360 BCE) built them from solids. <b>Zosimos</b> (c. 300 CE) wrote the earliest named alchemy."] },
  { h: "From the lab of the magus", p: ["<b>Paracelsus</b> (1527) brought chemistry into medicine. <b>Della Porta</b>'s <b>Natural Magic</b> (1558) treated magic as nature's secrets. <b>Boyle</b> (1661) doubted the four elements but still practised alchemy, as did <b>Newton</b> (Principia, 1687)."] },
  { h: "Chemistry is born", p: ["<b>Lavoisier</b> (1789) listed real elements and showed mass is conserved. <b>Galvani</b> (1791) found ‘animal electricity’. <b>Mendeleev</b> (1869) arranged the elements in the periodic table and predicted missing ones."] },
]);
GUIDES["deck-astro"] = D("Astrology to astronomy study guide", [
  { h: "Omens in the sky", p: ["<b>Thales</b> (585 BCE) is said to have predicted an eclipse. The oldest <b>horoscope</b> is Babylonian, from 410 BCE. <b>Eratosthenes</b> (c. 240 BCE) measured the Earth, and the <b>Antikythera mechanism</b> (c. 100 BCE) predicted eclipses with gears.", "<b>Ptolemy</b> (c. 150 CE) wrote the standard books of both astronomy and astrology. The Maya <b>Dresden Codex</b> (c. 1100–1300) tracked Venus. The <b>Picatrix</b> (1256) taught planetary talismans."] },
  { h: "The heavens change", p: ["<b>Copernicus</b> (1543) moved the Sun to the centre. <b>Nostradamus</b> (1555) wrote vague prophecies. <b>Tycho</b>'s new star (1572) showed the heavens change. <b>Kepler</b> (1596) and <b>Galileo</b> (1610) went from mystical order to real laws and moons."] },
  { h: "Testing the stars", p: ["<b>Halley's comet</b> returned on schedule in 1758. <b>Shawn Carlson</b>'s double-blind test (1985) found astrology matched personalities no better than chance."] },
]);
