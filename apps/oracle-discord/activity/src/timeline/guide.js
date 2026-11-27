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
