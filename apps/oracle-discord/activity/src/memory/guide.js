// Grimoire Memory study guides: one per deck, with memory hooks and the full list of pairs (drawn from deck.js, so
// the guide always matches the cards). Original text for Science is Magic. Markup is limited to <b> and <i>.
export const HOOKS = {
  alchemy: [
    "The <b>seven metals</b> each wear the sign of a heavenly body the ancients could see: gold the <b>Sun</b>, silver the <b>Moon</b>, quicksilver <b>Mercury</b>, copper <b>Venus</b>, iron <b>Mars</b>, tin <b>Jupiter</b>, lead <b>Saturn</b>.",
    "The <b>Sun's circle with a dot</b> is gold: perfect, closed, unchanging. The <b>crescent</b> is silver, the Moon's pale metal.",
    "<b>Venus</b> (circle over a cross) is copper, the metal of Cyprus, Venus's island. <b>Mars</b> (circle with a spear) is iron, the metal of weapons.",
    "The <b>elements are triangles</b>: point up for things that rise (fire, and air with a bar), point down for things that sink (water, and earth with a bar).",
    "<b>Salt</b> is a circle cut by a line. <b>Sulfur</b> is a triangle on a cross. <b>Antimony</b> is an orb with a cross on top.",
  ],
  futhark: [
    "Every rune's name <b>starts with its own sound</b>: fehu is f, ūruz is u, þurisaz is th. Learn the name and you have the sound.",
    "Many runes look like Latin letters, which they were probably adapted from: <b>ᚱ</b> is r, <b>ᛒ</b> is b, <b>ᚺ</b> is h, <b>ᛊ</b> is s.",
    "Picture the meaning in the shape: <b>ᛉ algiz</b> as elk antlers, <b>ᚦ þurisaz</b> as a thorn, <b>ᛁ īsaz</b> as a straight icicle.",
    "Watch for look-alikes: <b>ᚹ</b> (w, joy) is a flag, <b>ᚦ</b> (th) is a thorn on a stick. <b>ᚢ</b> (u) is an arch, like the horns of the aurochs it names.",
  ],
  ogham: [
    "Ogham comes in <b>four groups of five</b>, told apart by where the strokes sit on the stemline: to the right, to the left, across it, or as notches.",
    "Count the strokes: <b>1 to 5</b> in each group. ᚁ b is one stroke, ᚅ n is five.",
    "Many letters were later linked to <b>trees</b> by medieval scholars: beith birch, dair oak, coll hazel. Some of these links are older than others, and a few are guesses.",
  ],
  egyptian: [
    "Each sign shows a <b>real thing</b> and spells a sound: 𓂋 mouth is r, 𓈖 ripple of water is n, 𓏏 loaf of bread is t.",
    "Animals spell many sounds: 𓄿 vulture is a, 𓅓 owl is m, 𓅱 quail chick is w, 𓆑 horned viper is f, 𓆓 cobra is j.",
    "Body parts too: 𓃀 foot is b, 𓂧 hand is d, 𓂝 forearm is ʿa.",
    "A few signs spell <b>more than one sound</b>: 𓏠 game board is mn, 𓋹 ankh is ꜥnḫ, the word for ‘life’.",
  ],
  maya: [
    "<b>A dot is 1, a bar is 5</b>, and a <b>shell is 0</b>. Up to four dots sit on top of up to three bars.",
    "So 13 is two bars (10) and three dots (3). 19, the largest single numeral, is three bars and four dots.",
    "Counting is base 20: each place up a column is worth 20 times more. The Long Count calendar bends the rule once, so its third place is 18 × 20 = 360 days.",
  ],
  tarot: [
    "The 22 trumps run from <b>0, the Fool</b>, to <b>XXI, the World</b>. Many readers see them as one journey: the Fool sets out and meets each card in turn.",
    "Roman numerals: <b>I</b> 1, <b>V</b> 5, <b>X</b> 10. A smaller numeral before a bigger one subtracts: <b>IV</b> is 4, <b>IX</b> is 9, <b>XIV</b> is 14.",
    "Pairs that mirror each other: the Empress <b>III</b> and the Emperor <b>IV</b>, the Sun <b>XIX</b> and the Moon <b>XVIII</b>.",
    "Strength is <b>VIII</b> and Justice <b>XI</b> in the Rider-Waite-Smith deck; the older Tarot de Marseille swaps them. This deck uses the Rider-Waite-Smith order.",
  ],
  lenormand: [
    "The 36 cards come from a German card game, the <b>Game of Hope</b> (about 1799), later sold under the name of the Paris fortune teller Marie Anne Lenormand.",
    "Each card carries a <b>playing-card inset</b>: the 36 cards match a short pack of playing cards, sixes to aces in four suits.",
    "Learn them in runs of six: <b>1–6</b> Rider, Clover, Ship, House, Tree, Clouds; <b>7–12</b> Snake, Coffin, Bouquet, Scythe, Whip, Birds.",
    "The pictures are plain on purpose: a Ship is travel, a House is home, a Coffin is an ending. Say the object, then its keyword.",
  ],
  zodiac: [
    "The elements go round the wheel in order: <b>fire, earth, air, water</b>, three times. Aries fire, Taurus earth, Gemini air, Cancer water, then again from Leo.",
    "Some glyphs are pictures: <b>♈</b> the ram's horns, <b>♉</b> the bull's head, <b>♓</b> two fish tied together, <b>♒</b> waves of water.",
    "The weekdays keep the seven planets: Sunday the Sun, Monday the Moon, Saturday Saturn. Tuesday to Friday swap in Germanic gods: Tīw for Mars, Woden for Mercury, Thor for Jupiter, Frigg for Venus.",
    "French keeps the Latin names: <b>mardi</b> Mars, <b>mercredi</b> Mercury, <b>jeudi</b> Jupiter, <b>vendredi</b> Venus.",
  ],
  elements: [
    "Most symbols are the first letter or two of the name: <b>C</b> carbon, <b>Ca</b> calcium, <b>Cl</b> chlorine.",
    "The odd ones are Latin or older names: <b>Fe</b> ferrum (iron), <b>Na</b> natrium (sodium), <b>K</b> kalium (potassium), <b>Ag</b> argentum (silver), <b>Sn</b> stannum (tin), <b>Pb</b> plumbum (lead), <b>Au</b> aurum (gold), <b>Hg</b> hydrargyrum (mercury).",
    "The atomic number is the number of protons. <b>H</b> is 1, <b>He</b> 2, and each element after has one more.",
  ],
  mixed: [
    "The mixed deck deals a few signs from every deck. Sort them in your head first: <b>triangles and planets</b> are alchemy, <b>angular sticks</b> are runes, <b>strokes on a line</b> are Ogham, <b>pictures</b> are hieroglyphs, <b>bars and dots</b> are Maya, <b>Roman numerals</b> are tarot, <b>plain numbers with a playing card</b> are Lenormand, <b>letters with a number</b> are elements.",
  ],
};

export const TIPS = [
  "Turn over cards you haven't seen first. Every card you see is information.",
  "Say the pair out loud, or in your head: ‘owl, m’. Words stick better than pictures alone.",
  "Remember where things are by rows: ‘the cobra is top left, its meaning is bottom row’.",
  "Matching several pairs in a row builds a combo and bonus points.",
];
