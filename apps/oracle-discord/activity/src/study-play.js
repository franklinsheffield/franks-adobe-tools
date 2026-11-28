// How to play + tips for every game room, read by the Study hall (study.js). One entry per room id.
// `how` is omitted for rooms whose own guide already opens with "How to play" (stars, rummy, watch, duel).
// Rules described here come from each room's own data and logic files; keep them in step when a room changes.
// Markup limited to <b> and <i>.

export const PLAY = {
  // ---- The Oracle Chamber classics ----
  seance: {
    how: [
      "The ghost raps out clues, one at a time. Each clue is a real method or fact from what it practised in life.",
      "First say <b>magic</b>, <b>science</b> or <b>both</b>, then name it. Type the name for the real challenge, or ask for four choices.",
      "<b>Level 1</b> general practices, <b>Level 2</b> specific techniques, <b>Level 3</b> real historical scientists and magicians, <b>Level 4 Debunker</b>: expose a fake medium.",
    ],
    tips: [
      "Fewer clues used means a better score: guess as soon as you are fairly sure.",
      "Plenty of old practices were a bit of both. Alchemy fed chemistry, and astrology fed astronomy.",
      "Read the 'Specific methods' guide before Level 2: the names have to be exact.",
    ],
  },
  decoder: {
    how: [
      "<b>Scribe's Hand</b> is a card game. A real inscription lies on the table as glyph cards; you hold sound cards.",
      "Tap a card to play it onto the glyph that glows. A right card refills 1 ink, a wrong card costs 2.",
      "Tap the deck to draw a new card for 1 ink. Run out of ink and the level is lost.",
      "Power cards: <b>Rosetta</b> is a wild card, the <b>Ink pot</b> adds 3 ink, the <b>Scholar</b> lets you see the top 3 cards and take one free. You start with one of each, earn more with ★★★ levels, and can play two per level.",
    ],
    tips: [
      "Learn the lesson at the start of each level: it teaches exactly the signs that inscription uses.",
      "Every rune's name starts with its own sound, so the names are a built-in memory aid.",
      "Save the Scholar for long inscriptions, where drawing blind costs the most ink.",
    ],
  },
  timeline: {
    how: [
      "Real events from the history of magic, conjuring, science and skepticism are dealt to you one at a time.",
      "Put each one in its place on the timeline. <b>Level 1</b> spans all of history, <b>Level 2</b> two neighbouring eras, <b>Level 3</b> one era with close dates.",
      "<b>Fact or Fib</b> is the party round: write a believable wrong year, then vote for the real one.",
    ],
    tips: [
      "Anchor on a few dates you know (the printing press about 1450, the Royal Society 1660) and place the rest around them.",
      "Each era has its own study guide here. Read the era before a Level 3 run.",
      "In Fact or Fib, a fib a few years off fools more people than a wild one.",
    ],
  },
  alchemy: {
    how: [
      "<b>Level 1</b>: read the old alchemical symbols. <b>Level 2</b>: follow real recipes at the furnace. <b>Level 3</b>: repeat the experiments that turned alchemy into chemistry. <b>Level 4</b>: modern chemistry, 1803 to 1909.",
      "Every answer shows the real history and the modern chemistry, with a balanced equation.",
      "Each element you meet lights up on your own periodic table.",
    ],
    tips: [
      "The seven metals match the seven old planets: learn that table and Level 1 gets easy.",
      "Read the Notebook's 'Old names, modern chemicals' page before Level 2.",
      "Everything here is for learning. Never try these recipes at home: the Notebook explains why.",
    ],
  },
  calendar: {
    how: [
      "The Keeper's desk turns the Maya Tzolk'in gears, the Egyptian civil year and the Celtic wheel of the year to the same day.",
      "<b>Level 1</b> how the cycles turn, <b>Level 2</b> predict the festivals, <b>Level 3</b> predict the eclipses, <b>Level 4 Sky Archive</b>: eclipses that changed history.",
      "The free desk lets you turn every calendar to any date, including your birthday.",
    ],
    tips: [
      "The Tzolk'in is 13 numbers × 20 day signs = 260 days. Both counts step forward together, one each day.",
      "The Celtic fire festivals fall roughly halfway between a solstice and an equinox.",
      "Use the free desk to check an answer before you commit to it on a puzzle.",
    ],
  },
  grimoire: {
    how: [
      "A pressed specimen is laid on the table and clues arrive: how it looks, where it grows, its folklore, its history, its chemistry.",
      "Name the plant, say whether it is <b>gentle</b>, <b>handle with care</b> or <b>poison</b>, then judge one claim: science or folklore?",
      "Each plant earns a page in your grimoire with its folklore, what science says and a safety note.",
      "<b>Fact or Fib</b> is the party round for this room.",
    ],
    tips: [
      "Learn the family look-alikes: the carrot family holds both parsley and deadly hemlock.",
      "'Natural' is not the same as 'safe'. When in doubt, pick handle with care.",
      "This is for learning only and never medical advice. Never eat a wild plant on the strength of a game.",
    ],
  },
  memory: {
    how: [
      "Every pair is a symbol (a rune, an Ogham letter, a hieroglyph, a Maya numeral, an alchemy sign and more) and its meaning.",
      "Turn two cards. A pair stays face up and you hear what it means. A miss snuffs a candle; when the last candle goes out the game ends.",
      "<b>Apprentice</b> 6 pairs and a 3-second peek, <b>Adept</b> 8 pairs and a 1.5-second peek, <b>Master</b> 10 pairs and no peek.",
    ],
    tips: [
      "A slip is a miss you could have avoided. Slips mark a sign as weak, and weak signs come back sooner in the Review deck.",
      "Pairs in a row build a combo. Clear the cards you are sure of first.",
      "Use the peek to memorise one corner, not the whole board.",
    ],
  },
  duel: {
    tips: [
      "Learn the common charges on the card faces: sodium +1, calcium +2, oxygen −2, chlorine −1. Most compounds follow from them.",
      "The noble gases hardly react at all, so they make poor attackers.",
      "Read the chemistry guides here before the Master level, where reaction chains count.",
    ],
  },
  stars: {
    tips: [
      "Learn one bright signpost first. Orion's belt points one way to Sirius and the other way to Aldebaran.",
      "Every culture drew its own pictures in the same stars. Try another sky from the star map shelf.",
      "Constellations are not the zodiac signs: the Sun passes through 13 constellations, not 12.",
    ],
  },
  rummy: {
    tips: [
      "Bright stars (low magnitude) are worth more points, so keep them.",
      "On Level 3 the cards show only the star. Learn where each bright star lives before you play.",
      "Colour sets need the same star class from different constellations: watch for them from Level 2.",
    ],
  },

  // ---- The Alchemist's House ----
  flametest: {
    how: [
      "<b>Level 1</b>: a salt goes on the wire loop into the burner. Name the element from its flame colour.",
      "<b>Level 2</b>: the wire is dirty and sodium's yellow hides the metal. Look through cobalt-blue glass, which blocks the yellow.",
      "<b>Level 3</b>: read the bright lines in Bunsen's spectroscope and name the element, including the ones he and Kirchhoff discovered that way.",
      "Five samples a round and three tries each. The speed round gives you 45 seconds.",
    ],
    tips: [
      "Crimson is lithium, lilac is potassium, orange-red (brick red) is calcium, crimson red is strontium, apple green is barium, blue-green is copper, bright green is boron.",
      "Through cobalt glass sodium's yellow vanishes and potassium shows crimson. That is the main reason chemists carry it.",
      "On Level 3, count the lines and note their colour before you guess: two lines very close together in the yellow is sodium.",
    ],
  },
  minerals: {
    how: [
      "An unlabelled rock arrives. Test it like a field geologist: scratch, streak, magnet, acid drop, heft and flame (and a spectroscope and UV lamp later).",
      "Each test uses one of 5 chips. Then name the mineral from six choices.",
      "Named minerals go into your drawers by mineral class, and every one becomes an ingredient on the Discovery Bench.",
      "<b>Level 1</b> common rocks, <b>Level 2</b> ores, <b>Level 3</b> look-alikes, gems and rare finds.",
    ],
    tips: [
      "Start with the scratch test: fingernail 2.5, copper coin 3.5, steel knife 5.5, quartz 7 on the Mohs scale.",
      "Streak beats colour. Haematite can look black or silver, but its streak is always red-brown.",
      "Fizz in cold acid means a carbonate. Calcite fizzes; quartz never does.",
    ],
  },
  bench: {
    how: [
      "Pick one to three things from your shelf and an operation: heat, smelt, melt, mix, burn, boil, electrolyse or grind.",
      "If it is a real reaction, you discover the product, with its equation. Every product joins your shelf for the next recipe.",
      "Minerals you name in the Mineral Cabinet join the shelf too, so the Cabinet opens new branches here.",
    ],
    tips: [
      "Follow a chain: limestone heated gives quicklime, quicklime and water give slaked lime, then limewash or mortar.",
      "Oxide ores usually want smelting with charcoal: the carbon pulls the oxygen off the metal.",
      "Hazard notes are real. Some products hiss, spit or burn. That's why nobody should try this at home.",
    ],
  },
  commissions: {
    how: [
      "Three jobs a day, the same for everyone in the channel. Real clients ask for real products.",
      "Make the product at the Discovery Bench, then deliver it for 💎, philosopher's stones and reputation.",
      "Reputation climbs from the <b>Village</b> to the <b>Guild</b> (5 reputation) and the <b>Royal Society</b> (15), and higher tiers pay more.",
    ],
    tips: [
      "Check the jobs first, then plan your Bench work around them.",
      "Every client tells you why people really needed that product. It's the history of chemistry as a shopping list.",
      "Jobs reset each day, so a short visit every day beats one long one.",
    ],
  },
  fireworks: {
    how: [
      "Pack a shell to match a target burst: a metal salt for colour, an oxidiser, a chlorine donor, a tail and a star pattern.",
      "<b>Level 1</b> one colour, <b>Level 2</b> two-stage stars with tails and patterns, <b>Level 3</b> build four shells and light each in time with the music.",
      "Five targets a round and three tries each. <b>Show Night</b>: everyone in the call launches a shell and votes for the best burst.",
    ],
    tips: [
      "Red strontium, orange calcium, yellow sodium, green barium, blue copper. Purple mixes strontium red with copper blue.",
      "Blue and purple need a chlorine donor. Without one, the metal monochlorides that make the colour don't form.",
      "Charcoal tails make a drooping gold willow; titanium flakes make a sparkling chrysanthemum.",
    ],
  },
  leadgold: {
    how: [
      "<b>Level 1</b>: alpha or beta. Say what a nucleus becomes when it decays.",
      "<b>Level 2</b>: walk a natural decay chain, uranium or thorium, step by step down to stable lead.",
      "<b>Level 3</b>: make gold-197 with real moves: knock out protons or neutrons, capture neutrons, electron capture, beta decay.",
      "Two tries per step. Co-op: everyone in the call takes turns stepping one chain together.",
    ],
    tips: [
      "Alpha decay: the atomic number drops by 2 and the mass number by 4 (it loses a helium nucleus).",
      "Beta decay: a neutron turns into a proton, so the atomic number rises by 1 and the mass stays the same.",
      "Gold is element 79. Count protons first, then fix the neutrons.",
    ],
  },

  // ---- The Observatory ----
  watch: {
    tips: [
      "Give your eyes 20 to 30 minutes in the dark before faint targets, and use a red torch.",
      "Low power for big, faint things; high power for planets and close double stars.",
      "Log Tonight's Target first for the bonus, then fill the gaps from the Archive.",
    ],
  },
  comet: {
    how: [
      "<b>Level 1 Spot the mover</b>: blink two plates of the same sky and tap what moved. Watch for decoys: a variable star, dust on one plate, a satellite trail.",
      "<b>Level 2 Comet or Messier object</b>: a fuzzy patch is on both plates. Did it move? If not, say which Messier object it is.",
      "<b>Level 3 Predict a return</b>: from a real comet's last pass and its period, say when it comes back, as Halley did.",
    ],
    tips: [
      "A comet moves against the stars over hours. A nebula or cluster stays put night after night.",
      "Dust shows on only one plate. A real object shows on both, in the same or a new place.",
      "Return year = last perihelion + period. Halley's own comet comes back about every 76 years.",
    ],
  },
  eclipse: {
    how: [
      "<b>Level 1 Line them up</b>: from the Moon's phase, its height above Earth's orbit and its distance, say what happens.",
      "<b>Level 2 The nodes</b>: of four real new or full Moons in a year, pick the one that really makes an eclipse.",
      "<b>Level 3 Saros and paths</b>: real eclipses ahead, their kind, their saros return and where totality lasts longest.",
    ],
    tips: [
      "A solar eclipse needs a new Moon, a lunar eclipse a full Moon, and both need the Moon near a node.",
      "A far Moon looks too small to cover the Sun: that gives an annular eclipse, a ring of fire.",
      "One saros is about 18 years 11 days 8 hours, so each return lands about a third of the way round the world.",
    ],
  },
  navigator: {
    how: [
      "Sail a real voyage home by the sky.",
      "<b>Level 1 Polaris</b>: bring Polaris down to the horizon with the sextant. Its altitude is your latitude.",
      "<b>Level 2 The noon Sun</b>: shoot the Sun at noon and take its declination from the almanac to work out your latitude.",
      "<b>Level 3 Longitude</b>: the chronometer keeps Greenwich time. Each hour that local noon is late or early is 15° of longitude.",
    ],
    tips: [
      "Polaris only works north of the equator, and it sits within about a degree of the true pole.",
      "Noon Sun bearing south: latitude = 90° − altitude + declination.",
      "Noon late compared with Greenwich means you are west; early means east.",
    ],
  },
  messier: {
    how: [
      "Fill all 110 Messier objects in your sketchbook.",
      "<b>Level 1 What is it?</b>: name the kind from an eyepiece sketch. <b>Level 2 Where is it?</b>: name its constellation. <b>Level 3 Tonight</b>: which of four objects stands highest over your city?",
      "Every 10 objects pays 💎 50, and all 110 pay ☄️ 10 and Messier's seal.",
    ],
    tips: [
      "Globular clusters look like round, packed balls; open clusters are loose scatters of stars.",
      "Galaxies cluster in Virgo and Coma Berenices; globulars crowd toward Sagittarius and Scorpius.",
      "On Level 3, an object near the meridian, due south, is near its highest.",
    ],
  },
  starparty: {
    how: [
      "The channel's night out. The <b>Weekly Star Party</b> has one shared target and one shared goal.",
      "The <b>meteor watch</b>: tap the shower meteors and leave the sporadics. Shower meteors point straight away from the radiant.",
      "Score 70% of the possible to clear a level. Near a real shower's peak, every meteor you catch joins the channel's shared count.",
    ],
    tips: [
      "Find the radiant first, then trace each streak back: if it doesn't line up, it's a sporadic.",
      "Higher levels show more sporadics and shorter streaks, so react faster.",
      "Real showers are best after midnight, when your side of Earth faces forward along its orbit.",
    ],
  },

  // ---- The Séance Parlour ----
  casefiles: {
    how: [
      "A real claim of the supernatural arrives. Investigate it with the kit: magnifier, lights up, tighter controls, ask a magician, lab test, the record.",
      "Each tool burns one of 5 candles. Then name the method really behind the claim, from six choices.",
      "Solved cases go into your casebook by method class, and every method you uncover opens tricks in the Workshop.",
      "<b>Fact or Fib</b>: everyone picks a wrong method as their fib, then everyone hunts for the method that was really behind it.",
    ],
    tips: [
      "Ask 'what changed when the controls tightened?' If the effect stopped, the method needed what you took away.",
      "The record (confessions, trials, reports) is often the clincher. Save a candle for it.",
      "<b>Level 1</b> the famous cases, <b>Level 2</b> the investigators, <b>Level 3</b> science and modern hoaxes.",
    ],
  },
  workshop: {
    how: [
      "Every method you uncover in the Case Files opens tricks here. Locked tricks show which case opens them.",
      "Rehearse one: tap its steps in the right order, then name the <b>tell</b>, the slip an investigator would catch.",
      "You have 3 spotlights; each mistake dims one. A clean rehearsal puts the trick in your repertoire for Bookings.",
      "<b>Level 1</b> single tricks, <b>Level 2</b> routines with two methods, <b>Level 3</b> famous real acts.",
    ],
    tips: [
      "Think like the medium: what must be hidden first, and when?",
      "The tell is what gave the real fraud away, so the case file you solved holds the answer.",
      "Rehearse widely: Bookings ask for tricks you already know.",
    ],
  },
  bookings: {
    how: [
      "<b>Tonight's Bill</b> brings 3 bookings a day, the same for everyone: expose a claim for a newspaper, perform a trick for a theatre, explain a method for a skeptics' society.",
      "Level 3 bookings chain all three. Matinees are extra bookings at half pay.",
      "Good shows raise your billing: <b>Bottom of the Bill</b> → <b>Supporting Act</b> (3 shows) → <b>Top of the Bill</b> (10) → <b>Star Turn</b> (25).",
    ],
    tips: [
      "Solve cases and rehearse tricks first: a booking can only use what you've learned.",
      "Higher billings multiply your pay, so steady daily shows add up fast.",
      "No booking ever asks you to contact the dead. The act is always the trick.",
    ],
  },
  darkseance: {
    how: [
      "You play a fake medium with the real methods, against the real controls that caught them.",
      "For each effect the sitters ask for, pick a method the controls in place can't beat.",
      "Controls include feet held, luminous bands, a red light, a search, sealed knots and Faraday's indicator. On later levels an investigator sweeps a flashlight: time your move between sweeps.",
      "Three eyes of suspicion and you're exposed. With friends, one player is the medium and the rest are the committee.",
    ],
    tips: [
      "Read the controls before you pick: cracking a toe joint fails once your feet are held.",
      "Every 'caught' note is a real exposure. Learning them is the point of the game.",
      "As the committee, ask for controls in the order the real investigators did.",
    ],
  },
  mentalist: {
    how: [
      "You play a stage mind reader with the real methods.",
      "<b>Level 1</b>: force a card, then cold read a stranger with lines that fit anyone. <b>Level 2</b>: send and read cues in the Houdinis' word code. <b>Level 3</b>: answer sealed questions by staying one billet ahead.",
      "A wrong answer costs one of 3 nerve; lose all three and you're booed off. With friends: the two-person act.",
    ],
    tips: [
      "Cold reading uses Barnum statements: lines vague enough to fit almost anyone. Avoid specific guesses.",
      "In the word code, Pray is 1, Answer 2, Say 3, Now 4, Tell 5, Please 6, Speak 7, Quickly 8, Look 9, Be quick 10.",
      "In the one-ahead, the first answer must be one you already know.",
    ],
  },
  phantasmagoria: {
    how: [
      "Run a ghost show with the real optics.",
      "<b>Level 1</b>: roll the magic lantern back to make each ghost the right size on the smoke. <b>Level 2</b>: tilt the hidden glass of Pepper's ghost. <b>Level 3</b>: fire every cue on the beat, in three acts.",
      "With friends: show night, where everyone stages a ghost and votes.",
    ],
    tips: [
      "With our slide and lens, the ghost is half a metre tall for every metre of distance: twice as far, twice as tall.",
      "Tilting the glass by an angle turns the reflected actor by twice that angle.",
      "In the timed show, watch the cue strip ahead, not the ghost.",
    ],
  },
  roguesgallery: {
    how: [
      "The Parlour's progress room, in three parts.",
      "<b>The Gallery</b>: 20 pairs of portraits, each a claimant and the person who caught them. Solve the case and name the ghost to light both.",
      "<b>The Final Séance</b>: earn the seven letters B-E-L-I-E-V-E from Parlour milestones, then decode 'Rosabelle, believe' in the Houdinis' word code.",
      "<b>The Method Book</b>: everything you've uncovered in the Parlour, in one book.",
    ],
    tips: [
      "Portraits light from Case Files (the claimant) and Séance: Guess the Ghost (the famous ghosts).",
      "Learn the word code in The Mentalist first. The Final Séance uses it.",
      "Your Method Book is a handy revision sheet before a Booking.",
    ],
  },

  // ---- The Scriptorium ----
  inscriptions: {
    how: [
      "Unlabelled finds arrive in the tray. Narrow them down with tests: direction, count the signs, tool and surface, word breaks, telltale mark.",
      "Each test or wrong name costs one of 4 ink drops. Name the script from six choices.",
      "Named scripts are filed in drawers by type: alphabets, abjads, abugidas, syllabaries, word-scripts, and scripts not yet read.",
      "<b>Level 1</b> 12 well-known scripts, <b>Level 2</b> adds 14 more, <b>Level 3</b> all 40.",
    ],
    tips: [
      "Direction rules out half the list at once: Hebrew and Arabic run right to left.",
      "Sign count tells the type: about 20 to 30 signs is an alphabet or abjad, dozens a syllabary, thousands a word-script.",
      "Undeciphered scripts can be identified but never read. That's honest, not a bug.",
    ],
  },
  cipherdesk: {
    how: [
      "Real lines are hidden in real methods. Name the method (wrong names cost ink), set the key where one is needed, and the plain text appears.",
      "Forgeries are the hazard: read one as genuine and Wren's seal cracks.",
      "Inscriptions unlock once you file their script at the Inscription Tray.",
      "<b>Level 1</b> Morse, Braille, Atbash and friends, <b>Level 2</b> grids, rails, pigpen and wheels, <b>Level 3</b> Vigenère, Trithemius and hex.",
    ],
    tips: [
      "Count letters first: a Caesar shift keeps word lengths and letter patterns, just moved along.",
      "Atbash folds the alphabet in half: A↔Z, B↔Y. Apply it twice and you're back where you started.",
      "For a forgery, look for something too new for the claimed date, like a pigment that didn't exist yet.",
    ],
  },

  // ---- Party (every House) ----
  possession: {
    how: [
      "<b>True tales</b>: the host narrates a real story from its House's subject. At key moments a few players (taking turns) possess the host and answer a guiding question; your answer comes out of the host's mouth, then the facts snap back.",
      "Each tale ends with a 'What really happened' card.",
      "<b>Made-up tales</b>: everyone writes every line, everyone votes, and the tale ends with a title.",
      "Alone, you write every line yourself or ask the spirits for a suggestion. Every typed answer passes a word filter.",
    ],
    tips: [
      "The best possession answers fit the moment of the story and are a little funny.",
      "Read the 'What really happened' card: that's where the real history is.",
      "Save a tale you like to your Grimoire Journal at the end.",
    ],
  },
};
