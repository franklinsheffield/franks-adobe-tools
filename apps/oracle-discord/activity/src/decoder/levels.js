// Rune and Glyph Decoder: the four scripts, their signs, and the levels. Every decode target is a real word or a
// real inscription (sources in the level's `src`). Answers are computed from the glyphs, so a level can't drift
// from its own key. Text is original, written for Science is Magic.

/** Each sign: g = glyph, v = sound key the player taps, n = name, gl = what the sign shows or means. */
export const SCRIPTS = {
  futhark: {
    name: "Elder Futhark", emoji: "🪨", font: "dec-runic", where: "Germanic peoples, about 150–800 CE",
    blurb: "The oldest runic alphabet: 24 runes in three groups of eight (aettir), carved into wood, metal and stone.",
    signs: [
      ["ᚠ", "f", "fehu", "cattle, wealth"], ["ᚢ", "u", "ūruz", "aurochs (wild ox)"], ["ᚦ", "th", "þurisaz", "giant, thorn"],
      ["ᚨ", "a", "ansuz", "a god"], ["ᚱ", "r", "raidō", "ride, journey"], ["ᚲ", "k", "kaunan", "torch, sore"],
      ["ᚷ", "g", "gebō", "gift"], ["ᚹ", "w", "wunjō", "joy"], ["ᚺ", "h", "hagalaz", "hail"], ["ᚾ", "n", "naudiz", "need"],
      ["ᛁ", "i", "īsaz", "ice"], ["ᛃ", "j", "jēra", "year, harvest"], ["ᛇ", "ï", "īwaz", "yew"], ["ᛈ", "p", "perþō", "unknown, maybe a lot-cup"],
      ["ᛉ", "z", "algiz", "elk, protection"], ["ᛊ", "s", "sōwilō", "sun"], ["ᛏ", "t", "tīwaz", "the god Tyr"], ["ᛒ", "b", "berkanan", "birch"],
      ["ᛖ", "e", "ehwaz", "horse"], ["ᛗ", "m", "mannaz", "person"], ["ᛚ", "l", "laguz", "water, lake"], ["ᛜ", "ng", "ingwaz", "the god Ing"],
      ["ᛞ", "d", "dagaz", "day"], ["ᛟ", "o", "ōþila", "inherited land"],
    ],
    // Latin letters to runes, for "write your name". Runes had no fixed spelling: carvers wrote what they heard.
    write: { th: "ᚦ", ng: "ᛜ", a: "ᚨ", b: "ᛒ", c: "ᚲ", d: "ᛞ", e: "ᛖ", f: "ᚠ", g: "ᚷ", h: "ᚺ", i: "ᛁ", j: "ᛃ", k: "ᚲ", l: "ᛚ", m: "ᛗ", n: "ᚾ", o: "ᛟ",
      p: "ᛈ", q: "ᚲ", r: "ᚱ", s: "ᛊ", t: "ᛏ", u: "ᚢ", v: "ᚹ", w: "ᚹ", x: "ᚲᛊ", y: "ᛃ", z: "ᛉ" },
    gap: "᛫",
  },
  ogham: {
    name: "Ogham", emoji: "🌳", font: "dec-ogham", where: "Ireland and western Britain, about 300–600 CE",
    blurb: "Notches and strokes cut along a stemline, usually the edge of a standing stone, read from the bottom up. About 400 stones survive.",
    signs: [
      ["ᚁ", "b", "beith", "birch"], ["ᚂ", "l", "luis", "flame or herb (later: rowan)"], ["ᚃ", "f/v", "fern", "alder"], ["ᚄ", "s", "sail", "willow"], ["ᚅ", "n", "nin", "fork, loom-beam (later: ash)"],
      ["ᚆ", "h", "úath", "fear, horror (later: hawthorn)"], ["ᚇ", "d", "dair", "oak"], ["ᚈ", "t", "tinne", "bar of metal (later: holly)"], ["ᚉ", "c", "coll", "hazel"], ["ᚊ", "q", "cert", "bush (later: apple)"],
      ["ᚋ", "m", "muin", "neck or trick (later: vine)"], ["ᚌ", "g", "gort", "field (later: ivy)"], ["ᚍ", "ng", "gétal", "killing (later: broom)"], ["ᚎ", "z", "straif", "sulphur (later: blackthorn)"], ["ᚏ", "r", "ruis", "redness (later: elder)"],
      ["ᚐ", "a", "ailm", "unknown (later: pine)"], ["ᚑ", "o", "onn", "ash tree (later: gorse)"], ["ᚒ", "u", "úr", "earth (later: heather)"], ["ᚓ", "e", "edad", "unknown (later: aspen)"], ["ᚔ", "i", "idad", "unknown (later: yew)"],
    ],
    write: { ng: "ᚍ", a: "ᚐ", b: "ᚁ", c: "ᚉ", d: "ᚇ", e: "ᚓ", f: "ᚃ", g: "ᚌ", h: "ᚆ", i: "ᚔ", j: "ᚔ", k: "ᚉ", l: "ᚂ", m: "ᚋ", n: "ᚅ", o: "ᚑ",
      p: "ᚁ", q: "ᚊ", r: "ᚏ", s: "ᚄ", t: "ᚈ", u: "ᚒ", v: "ᚃ", w: "ᚃ", x: "ᚉᚄ", y: "ᚔ", z: "ᚎ" },
    gap: " ", start: "᚛", end: "᚜",
  },
  egyptian: {
    name: "Egyptian hieroglyphs", emoji: "🏺", font: "dec-egy", where: "Egypt, about 3200 BCE – 394 CE",
    blurb: "Pictures that stand for sounds, words and ideas. About two dozen signs spell single consonants: the ‘alphabet’ inside a system of hundreds of signs.",
    signs: [
      ["𓄿", "a", "vulture", "ꜣ, a glottal sound; we say ‘a’"], ["𓇋", "i", "flowering reed", "i or y"], ["𓇌", "y", "two reeds", "y"], ["𓂝", "ʿa", "forearm", "ꜥ, a throat sound (ayin)"],
      ["𓅱", "w", "quail chick", "w or u"], ["𓃀", "b", "foot", "b"], ["𓊪", "p", "stool", "p"], ["𓆑", "f", "horned viper", "f"], ["𓅓", "m", "owl", "m"],
      ["𓐝", "m", "uncertain object", "m (used in Ptolemy's name)"], ["𓈖", "n", "water", "n"], ["𓂋", "r", "mouth", "r"], ["𓃭", "l", "lion", "l, in late foreign names"],
      ["𓉔", "h", "reed shelter", "h"], ["𓎛", "ḥ", "twisted wick", "ḥ, a strong h"], ["𓐍", "kh", "placenta (?)", "ḫ, like Scottish ‘loch’"], ["𓋴", "s", "folded cloth", "s"],
      ["𓊃", "z", "door bolt", "z"], ["𓈙", "sh", "pool", "š, sh"], ["𓈎", "q", "hill", "q, a deep k"], ["𓎡", "k", "basket", "k"], ["𓎼", "g", "jar stand", "g"],
      ["𓏏", "t", "bread loaf", "t"], ["𓍿", "ch", "tether", "ṯ, ch"], ["𓂧", "d", "hand", "d"], ["𓆓", "j", "cobra", "ḏ, j"], ["𓍯", "o", "lasso", "wꜣ; in late names an o"],
      ["𓏠", "mn", "game board", "mn, two consonants in one sign"], ["𓋹", "ankh", "sandal strap", "ꜥnḫ, ‘life’, three consonants in one sign"],
      ["𓆇", "(she)", "egg", "silent: marks a woman's or goddess's name"],
    ],
    write: { sh: "𓈙", ch: "𓍿", kh: "𓐍", a: "𓄿", b: "𓃀", c: "𓎡", d: "𓂧", e: "𓇋", f: "𓆑", g: "𓎼", h: "𓉔", i: "𓇋", j: "𓆓", k: "𓎡", l: "𓃭", m: "𓅓",
      n: "𓈖", o: "𓍯", p: "𓊪", q: "𓈎", r: "𓂋", s: "𓋴", t: "𓏏", u: "𓅱", v: "𓆑", w: "𓅱", x: "𓎡𓋴", y: "𓇌", z: "𓊃" },
    gap: "",
  },
  maya: {
    name: "Maya numbers and dates", emoji: "🌽", font: "", where: "Mesoamerica, about 300 BCE – 1500s CE",
    blurb: "A base-20 number system with a shell for zero, centuries before zero reached Europe, used to count days in the Long Count calendar.",
    signs: Array.from({ length: 20 }, (_, n) => [String(n), String(n), String(n), n === 0 ? "a shell: zero" : `${Math.floor(n / 5)} bar${n >= 10 ? "s" : n >= 5 ? "" : "s"} and ${n % 5} dot${n % 5 === 1 ? "" : "s"}`]),
    gap: "",
  },
};
for (const s of Object.values(SCRIPTS)) s.signs = s.signs.map(([g, v, n, gl]) => ({ g, v, n, gl }));

export const LONG_COUNT = [["b'ak'tun", 144000], ["k'atun", 7200], ["tun", 360], ["winal", 20], ["k'in", 1]];

/**
 * kind: "decode" (tap the sounds of the glyphs, then answer what it means), "write" (your name in the script) or
 * "date" (your birthday in the Maya Long Count). teach = signs introduced in this level (shown in the lesson).
 * Maya `text` is an array of numbers; the others are strings of glyphs.
 */
export const LEVELS = [
  // ---- Elder Futhark ----
  { id: "r1", script: "futhark", title: "The first six runes", kind: "decode", teach: "ᚠᚢᚦᚨᚱᚲ", text: "ᚠᚢᚦᚨᚱᚲ",
    lesson: "Every rune stands for a sound, and each has a name that starts with that sound. Learn these six, then read the word.",
    q: { ask: "Why is the runic alphabet called the futhark?", choices: ["Its first six runes spell f-u-th-a-r-k", "It's Old Norse for ‘secret’", "It was named after a king"], right: 0,
      why: "Like ‘alphabet’ comes from Greek alpha + beta, ‘futhark’ is just the first six runes read in order." },
    codex: "The futhark", src: "Rune row on the Kylver Stone, Gotland, about 400 CE" },
  { id: "r2", script: "futhark", title: "Charm words", kind: "decode", teach: "ᛚ", text: "ᚨᛚᚢ᛫ᛚᚨᚦᚢ",
    lesson: "One new rune, ᛚ (laguz, l). The dot ᛫ separates words. These two words turn up again and again on gold pendants.",
    q: { ask: "Where are ‘alu’ and ‘laþu’ found most often?", choices: ["Gold bracteates: thin stamped medallions worn as pendants", "Viking ship sails", "Church bells"], right: 0,
      why: "Both appear on 5th–6th century bracteates. Their meaning is debated: alu may be linked to ‘ale’ and ritual drink or to protection, laþu to ‘invitation’ or ‘summoning’." },
    codex: "Bracteate charm words", src: "Migration Period gold bracteates, Scandinavia, about 450–550 CE" },
  { id: "r3", script: "futhark", title: "The Einang Stone", kind: "decode", teach: "ᚾᛟᛁᚺᛞ", text: "ᚱᚢᚾᛟ᛫ᚠᚨᛁᚺᛁᛞᛟ",
    lesson: "Five new runes. This is the end of the inscription on the Einang Stone, still standing on a burial mound in Valdres, Norway.",
    q: { ask: "‘runo faihido’ means…", choices: ["I painted the rune(s)", "The runes are cursed", "Here lies a warrior"], right: 0,
      why: "faihido means ‘painted’. Runes were often coloured in, sometimes with red ochre, so the carving could be read." },
    codex: "The Einang Stone", src: "Einang Stone, Valdres, Norway, about 350–400 CE" },
  { id: "r4", script: "futhark", title: "The Golden Horn", kind: "decode", teach: "ᛖᚲᚹᚷᛊᛏᛉᛃ", text: "ᛖᚲ᛫ᚺᛚᛖᚹᚨᚷᚨᛊᛏᛁᛉ᛫ᚺᛟᛚᛏᛁᛃᚨᛉ᛫ᚺᛟᚱᚾᚨ᛫ᛏᚨᚹᛁᛞᛟ",
    lesson: "The longest one yet. Found in a field near Gallehus, Denmark in 1734, this golden horn carries the most famous early runic sentence.",
    q: { ask: "What does it say?", choices: ["I, Hlewagastiz, son of Holt, made the horn", "This horn holds the mead of the gods", "Whoever blows this horn calls the dead"], right: 0,
      why: "‘ek hlewagastiz holtijaz horna tawido’: the maker signed his work. It's a line of alliterative verse in Proto-Norse. The horns were stolen and melted down in 1802; today's are replicas." },
    codex: "The Golden Horns of Gallehus", src: "Gallehus horn, Denmark, about 400 CE" },
  { id: "r5", script: "futhark", title: "Carve your name", kind: "write",
    lesson: "Carvers spelled by ear, with no fixed spelling. th is one rune (ᚦ), and c, k and q all become ᚲ.", codex: "Your name in runes" },

  // ---- Ogham ----
  { id: "o1", script: "ogham", title: "Birch and the vowels", kind: "decode", teach: "ᚁᚂᚃᚄᚅᚐᚑᚒᚓᚔ", text: "᚛ᚂᚒᚔᚄ ᚄᚐᚔᚂ᚜",
    lesson: "Ogham letters come in families (aicmí) of five. Count the strokes: 1 to 5 on one side of the line, or notches across it for vowels. ᚛ marks the start.",
    q: { ask: "These two words are names of Ogham letters. What were the letters named after?", choices: ["Mostly trees and plants, in medieval tradition", "Irish kings", "Stars"], right: 0,
      why: "Medieval scholars listed a tree for each letter (sail = willow). Several names really meant other things (luis may mean ‘flame’), so the tree list is partly a later tradition." },
    codex: "The Ogham letter names", src: "Auraicept na nÉces and the Ogam Tract, Book of Ballymote (1390s), quoting older tradition" },
  { id: "o2", script: "ogham", title: "Birch and hazel", kind: "decode", teach: "ᚆᚇᚈᚉᚊ", text: "᚛ᚁᚓᚔᚈᚆ ᚉᚑᚂᚂ᚜",
    lesson: "The second family sits on the other side of the stemline: 1 to 5 strokes for h, d, t, c, q.",
    q: { ask: "Beith (birch) is the first Ogham letter. What is the Ogham sequence named after it?", choices: ["The Beith-Luis-Nin", "The Futhark", "The Aleph-Bet"], right: 0,
      why: "Just like the futhark, Ogham is called by its first letters: beith, luis, nin." },
    codex: "Beith-Luis-Nin", src: "In Lebor Ogaim (the Ogam Tract)" },
  { id: "o3", script: "ogham", title: "The script's own name", kind: "decode", teach: "ᚋᚌᚍᚎᚏ", text: "᚛ᚑᚌᚐᚋ᚜",
    lesson: "The third family crosses the line at a slant: m, g, ng, z, r. Now read the name of the script itself.",
    q: { ask: "Who, in Irish legend, invented Ogham?", choices: ["Ogma, a warrior-poet of the Tuatha Dé Danann", "Saint Patrick", "The Romans"], right: 0,
      why: "Legend credits Ogma. Historians think it was devised around the 4th century CE by people who knew the Latin alphabet, since its letters follow Latin sounds." },
    codex: "Ogma's script", src: "Auraicept na nÉces" },
  { id: "o4", script: "ogham", title: "A memorial stone", kind: "decode", teach: "", text: "᚛ᚋᚐᚊᚔ ᚋᚒᚉᚑᚔ᚜",
    lesson: "Almost every Ogham stone follows one formula: a person's name, then who they descended from. Here are the two key words.",
    q: { ask: "On a stone, ‘X MAQI MUCOI Y’ means…", choices: ["X, son of the kin of Y", "X was killed by Y", "X gave this land to Y"], right: 0,
      why: "maqi = ‘of the son’ (later Irish mac), mucoi = ‘of the kin-group’. The stones are memorials and likely boundary markers naming a family." },
    codex: "The MAQI MUCOI formula", src: "Common formula on Ogham stones, CIIC (Macalister 1945)" },
  { id: "o5", script: "ogham", title: "Cut your name", kind: "write",
    lesson: "Ogham had no p, so it becomes b. Real stones are read from the bottom up along the edge.", codex: "Your name in Ogham" },

  // ---- Egyptian ----
  { id: "e1", script: "egyptian", title: "The name", kind: "decode", teach: "𓂋𓈖", text: "𓂋𓈖",
    lesson: "Egyptian writing left out vowels. Two signs, two consonants: decode this short, important word.",
    q: { ask: "‘rn’ means ‘name’. Why does it look so short?", choices: ["Vowels weren't written; we say ‘ren’ by convention", "It's an abbreviation", "Half of it was erased"], right: 0,
      why: "Egyptologists add an ‘e’ to say consonant-only words. To Egyptians the rn was part of the soul: erasing someone's name could erase them." },
    codex: "The rn (name)", src: "Gardiner, Egyptian Grammar (1957)" },
  { id: "e2", script: "egyptian", title: "Ptolemy's cartouche", kind: "decode", teach: "𓊪𓏏𓍯𓃭𓐝𓇌𓋴", text: "𓊪𓏏𓍯𓃭𓐝𓇌𓋴", cartouche: true,
    lesson: "An oval ring (cartouche) means ‘royal name’. On the Rosetta Stone the same decree was in Greek too, so this name could be matched to Greek ‘Ptolemaios’.",
    q: { ask: "Who used this cartouche to crack hieroglyphs in 1822?", choices: ["Jean-François Champollion", "Howard Carter", "Napoleon"], right: 0,
      why: "Thomas Young had guessed some sounds; Champollion matched Ptolemy's signs to Greek letters, then tested them on other names." },
    codex: "The Rosetta Stone", src: "Rosetta Stone, 196 BCE, British Museum EA 24" },
  { id: "e3", script: "egyptian", title: "Cleopatra's cartouche", kind: "decode", teach: "𓎡𓇋𓄿𓂧𓂋𓆇", text: "𓎡𓃭𓇋𓍯𓊪𓄿𓂧𓂋𓄿𓏏𓆇", cartouche: true,
    lesson: "Champollion's test: if Ptolemy's signs are right, they should reappear in Cleopatra's name, from an obelisk at Philae. Notice the hand used for the d/t sound.",
    q: { ask: "Which signs did both names share, proving the sounds?", choices: ["p, o and l (stool, lasso, lion)", "None at all", "Only the cartouche"], right: 0,
      why: "The stool, lasso and lion sat where Greek put p, o and l in both names. The bread ‘t’ and the egg after a queen's name mark her as female." },
    codex: "The Philae obelisk", src: "Philae obelisk, Kingston Lacy, 2nd century BCE" },
  { id: "e4", script: "egyptian", title: "The boy king", kind: "decode", teach: "𓏠𓅱𓋹", text: "𓇋𓏠𓈖𓏏𓅱𓏏𓋹", cartouche: true,
    lesson: "Some signs carry two or three sounds at once. The game board is mn, the ankh is ꜥnḫ (life). Read the signs in order.",
    q: { ask: "It's read Tut-ankh-Amun, but Amun (imn) is written first. Why?", choices: ["Gods' names were moved to the front out of respect", "A carving mistake", "Egyptian reads right to left"], right: 0,
      why: "Called honorific transposition: the god's name goes first in writing, but is said where it belongs. Twt-ꜥnḫ-imn: ‘living image of Amun’." },
    codex: "Tutankhamun's name", src: "Tomb KV62, Valley of the Kings (found 1922)" },
  { id: "e5", script: "egyptian", title: "Your royal cartouche", kind: "write",
    lesson: "Spelled with the one-consonant signs, the way scribes wrote foreign names like Ptolemy. Vowels are written with the nearest sign.", codex: "Your cartouche" },

  // ---- Maya ----
  { id: "m1", script: "maya", title: "Bars and dots", kind: "decode", teach: "", text: [7, 13, 0, 19],
    lesson: "A dot is 1, a bar is 5, and a shell is 0. Read each number, left to right.",
    q: { ask: "The Maya shell for zero is remarkable because…", choices: ["It's one of the first true zeros in history", "It means ‘nothing to see here’", "It was borrowed from Rome"], right: 0,
      why: "The Maya used zero as a placeholder in their place-value counting by the early centuries CE, independently of India. Roman numerals never had a zero." },
    codex: "The Maya zero", src: "Maya inscriptions and the Dresden Codex" },
  { id: "m2", script: "maya", title: "The end of a b'ak'tun", kind: "decode", teach: "", text: [13, 0, 0, 0, 0], longCount: true,
    lesson: "The Long Count stacks five numbers: b'ak'tun (144,000 days), k'atun (7,200), tun (360), winal (20) and k'in (1 day). Read it top to bottom.",
    q: { ask: "13.0.0.0.0 fell on 21 December 2012. What happened?", choices: ["The 13th b'ak'tun ended, like an odometer rolling over", "The Maya predicted the end of the world", "Nothing: it's a modern invention"], right: 0,
      why: "It was a big round number in the count, not doom. Palenque's inscriptions even name a date in the year 4772." },
    codex: "13.0.0.0.0", src: "Tortuguero Monument 6; Palenque, Temple of the Inscriptions" },
  { id: "m3", script: "maya", title: "A king is born", kind: "decode", teach: "", text: [9, 8, 9, 13, 0], longCount: true, round: "8 Ajaw 13 Pop",
    lesson: "This date, 8 Ajaw 13 Pop, is carved at Palenque in Mexico. It's in March 603 CE.",
    q: { ask: "Whose birth does it record?", choices: ["K'inich Janaab Pakal, king of Palenque", "The Maya maize god", "Moctezuma"], right: 0,
      why: "Pakal ruled for 68 years (615–683). His tomb, under the Temple of the Inscriptions, was found in 1952 by Alberto Ruz." },
    codex: "Pakal the Great", src: "Sarcophagus lid and Temple of the Inscriptions, Palenque" },
  { id: "m4", script: "maya", title: "Your day in the Long Count", kind: "date",
    lesson: "Enter a birth date. The count of days since the Maya creation date (11 August 3114 BCE) becomes bars, dots and shells.", codex: "Your Long Count" },
];

export const SCRIPT_ORDER = ["futhark", "ogham", "egyptian", "maya"];
export const byId = (id) => LEVELS.find((l) => l.id === id);
export const levelsOf = (script) => LEVELS.filter((l) => l.script === script);
