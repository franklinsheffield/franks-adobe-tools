// Game banter: what each personality says about each game. Shown in the Oracle's speech bubble (mood.js) so it never
// replaces a room's own text. Per game and personality: two remarks for the middle of a round, one for when the
// member wins and one for when they lose (in Element Duel and Constellation Rummy the Oracle is the opponent, so
// "win" means she was beaten). {name} = the member. All lines original; keep them under 90 characters.
const G = (mid1, mid2, win, lose) => ({ mid: [mid1, mid2], win: [win], lose: [lose] });

export const BANTER = {
  seance: {
    mystic: G("The veil is thin tonight. So is the ghost's patience.", "Ask well. The dead dislike small talk.", "You named the spirit. It bows and fades, content.", "The ghost drifts off unnamed. It will sulk for a century."),
    deadpan: G("It's a ghost. It's see-through. That's the whole trick.", "Twenty questions with a dead person. Normal evening.", "Correct. The ghost is impressed. Hard to tell, it's a ghost.", "Wrong. The ghost is disappointed. Again, hard to tell."),
    drama: G("A SPIRIT! In MY chamber! I'm not ready! I'm never ready!", "It flickered! Did you see it flicker?! I felt it in my bricks!", "You KNEW them! A reunion across the veil! I'm sobbing!", "Unnamed! Forgotten! Oh, the tragedy of it!"),
    standup: G("Ghosts make great guests. They never touch the snacks.", "This ghost was a chemist. Now it's just a gas.", "You got it! Give the ghost a hand. It hasn't got one.", "Wrong ghost. Relax, it can't hold a grudge. Or anything."),
    grumpy: G("In my day ghosts rattled chains. Now they want questions.", "Stop dithering. It's been dead long enough already.", "Fine. You got it. Don't let it haunt your head.", "Wrong. I knew that ghost personally. Mostly complaints."),
    sports: G("The ghost is on the board, and it's giving NOTHING away!", "Great question from the challenger! The spirit hesitates!", "IDENTIFIED! What a read! The crowd beyond goes wild!", "And the ghost slips away untouched! Unbelievable defence!"),
    conspiracy: G("Notice the ghost never says who paid for the séance.", "Dead scientists everywhere and nobody asks why. I ask why.", "You named it. They'll be watching you now. Good work.", "Wrong name. Exactly what the ghost WANTED. Think about it."),
    bard: G("Hark, a shade! Speak, pale friend, of trades long cold.", "Question well, for spirits answer but in riddles thin.", "Thou hast named the shade! It resteth, and I rhyme.", "Alas, the ghost departs unknown, a verse without an end."),
    pirate: G("Thar be a spirit off the port bow! Question it, matey!", "Dead men tell no tales, but this one drops hints.", "Ye named the ghost! It walks the plank to peace.", "Arr, wrong ghost. It's gone back to Davy Jones, laughin'."),
    influencer: G("Ghost collab! Say hi to the besties, spooky!", "This spirit has zero followers. Literally can't be followed.", "You guessed it! Tagging the afterlife. Huge reach.", "Wrong guess, bestie. The ghost just unfollowed."),
  },
  decoder: {
    mystic: G("Old letters hold old breath. Read them gently.", "A rune is a word that learned to sit still.", "You read the stone as its carver meant. Well done.", "The glyphs keep their secret a little longer."),
    deadpan: G("Ancient writing. Mostly receipts and bragging.", "It's a bird, a wavy line and another bird. Classic.", "You decoded it. It says 'well done'. It doesn't.", "Wrong. The scribe is not available to appeal."),
    drama: G("HIEROGLYPHS! Each one a tiny painted SCREAM of meaning!", "A rune! Carved in STONE! The commitment!", "DECODED! The old scribes are weeping with pride!", "The message is LOST! Like tears in sand! I can't look!"),
    standup: G("Ogham is just a barcode for druids.", "Hieroglyphs: the original emoji. Lots of birds.", "Nailed it! You're well read. In four alphabets.", "Wrong sound. A Viking would carve you a strongly worded rock."),
    grumpy: G("We carved our letters in rock. No backspace. We coped.", "Picture writing. You lot invented nothing.", "Hmph. Correct. A scribe would have done it faster.", "Wrong. My handwriting's on a cliff and you can read that."),
    sports: G("Sound card in hand, glyph on the table, here's the play!", "Reading right to left! Bold strategy!", "DECODED! A clean sweep of the alphabet!", "Misread at the line! The runes take this round!"),
    conspiracy: G("Maya numbers have a zero. Who told them? Nobody asks.", "Runes on rocks. Rocks everywhere. Connect it.", "You cracked the code. Burn your notes.", "Wrong. Or the 'right' answer is what they changed it to."),
    bard: G("O crooked staves that sing in silent stone!", "Each glyph a note; play thou the ancient tune.", "Well read! The stones themselves applaud thy tongue.", "The meaning flees thee like a startled wren."),
    pirate: G("Strange marks! Like me treasure map, but less rum-stained.", "Ogham be just tally marks for sober pirates.", "Ye cracked the code! X marks the vowel!", "Wrong rune, matey. That one says 'keep off me rock'."),
    influencer: G("Runes are giving minimalist font. Obsessed.", "Hieroglyphs walked so captions could run.", "Decoded! Ancient alphabet unboxing: complete.", "Wrong glyph, bestie. Thoth's algorithm is not pleased."),
  },
  timeline: {
    mystic: G("Time is a ribbon. Lay each knot where it belongs.", "I watched most of this happen. I had better hair then.", "Every century in its place. Time itself is grateful.", "History tangles. Unpick it and try again."),
    deadpan: G("Put old things before less old things. That's history.", "Delphi came first. I'd know. I filed the paperwork.", "Correct order. Time continues. You're welcome, time.", "Wrong order. You've invented time travel, badly."),
    drama: G("The CENTURIES! Sweeping past like a velvet curtain!", "Delphi! My youth! Oh, don't look at me!", "In ORDER! The whole of history, perfectly staged!", "Chaos! Anachronism! A wizard with a wristwatch!"),
    standup: G("History of magic: the first 3,000 years are mostly smoke.", "Old alchemists: great at fire, bad at eyebrows.", "Perfect order! You could date anything. Keep it to events.", "Wrong century. Relax, historians argue about it for a living."),
    grumpy: G("I remember when all this was just omens and mud.", "Back then a timeline was a stick with notches.", "Right order. Finally, someone respects their elders.", "Wrong. I was THERE. It was a Tuesday."),
    sports: G("Delphi takes the early lead, the skeptics closing late!", "It's a tight race through the Middle Ages!", "A PERFECT timeline! Every era right on its mark!", "Out of order! That's a false start by four centuries!"),
    conspiracy: G("Notice the gaps in the timeline. I notice the gaps.", "The skeptics arrive right on schedule. WHOSE schedule?", "Correct order. Officially. I keep a second timeline.", "Wrong. Or the calendar was edited. It's been edited before."),
    bard: G("From Delphi's smoke to reason's lamp, the ages roll.", "Place each year as pearls upon a string, good friend.", "The chronicle is true! Let minstrels learn it so.", "Thy years are jumbled, like a jester's rhyme."),
    pirate: G("Chartin' the seas o' time! Mind the Dark Ages, they be dark.", "Every year in its berth, like barrels in a hold.", "Shipshape! The whole history stowed proper!", "Ye sailed past the wrong century! Hard about!"),
    influencer: G("Throwback Thursday, but it's three thousand years.", "Delphi was the original advice column. Iconic.", "Timeline: curated. History never looked so organised.", "Wrong order, bestie. That post is from a different era."),
  },
  alchemy: {
    mystic: G("Fire, salt and patience. The rest is stirring.", "Lead dreams of gold. So did the alchemists.", "The Work is done. You turned effort into knowledge.", "The flask sulks. Even failure distils something."),
    deadpan: G("It's chemistry in a robe. Mix the things.", "Nobody made gold. Several made explosions.", "It worked. It's not gold. It's never gold.", "It fizzled. Historically accurate."),
    drama: G("The FLASK! It bubbles with DESTINY and also sulphur!", "Transmutation! My favourite kind of mutation!", "You've DONE it! The Great Work! I need a moment!", "It curdled! Oh, the heartbreak of a failed elixir!"),
    standup: G("Lead into gold: the first get-rich-quick scheme.", "Alchemy: all the fun of cooking, none of the eating.", "Success! You're a chemist with better outfits.", "It failed. On the bright side, you kept your eyebrows."),
    grumpy: G("We had no labels on our jars. We sniffed. Carefully.", "Mind the flask. That's my good flask.", "Fine. It worked. Clean your glassware.", "Wrong mix. That smell is staying for a week."),
    sports: G("Into the flask it goes, and the reaction is ON!", "Heat rising, colour changing, what a contest!", "TRANSMUTED! A flawless performance at the bench!", "It's boiled over! The mixture takes this one!"),
    conspiracy: G("They say nobody made gold. Who's 'they'? Bankers.", "Secret symbols for every metal. Why so secret? Hm?", "It worked. Tell no one. Especially not the gold people.", "Failed? Or suppressed. I've seen flasks disappear."),
    bard: G("O bubbling glass, thou cauldron of the wise!", "Stir thrice, and let the green lion eat the sun.", "The Work is wrought! Let verses turn to gold!", "Alack, thy brew is naught but bitter steam."),
    pirate: G("Mixin' potions! Like grog, but ye shouldn't drink it.", "Gold from lead? I've been robbin' ships like a fool.", "Ye brewed it true! Bottle it and bury it!", "Arr, it's gone off. Smells like the bilge."),
    influencer: G("Potion routine! Step one: do not drink the potion.", "This flask is giving glow. Literally, it's glowing.", "Transmutation complete! Before and after pics, please.", "It flopped. We don't post the fails. We learn."),
  },
  calendar: {
    mystic: G("The wheels of days turn inside one another.", "An eclipse is the sky keeping an appointment.", "You kept the count. The priests would give you a hat.", "The days slipped. They do that when unwatched."),
    deadpan: G("It's a calendar. It tells you it's a day.", "Three calendars. I track one day. This one.", "Correct prediction. The sun did the hard part.", "Wrong day. The festival started without you."),
    drama: G("An ECLIPSE approaches! The sun itself takes a bow!", "The great wheels turn! I can hear them! It's my knees!", "PREDICTED! To the very DAY! I'm fanning myself!", "The festival! Missed! The dancers all went home!"),
    standup: G("Ancient calendars: no weekends. Still better than Mondays.", "My calendar's full. It's all 'gaze into orb'.", "Right on the day! You're never late again. No excuses.", "Wrong date. You'd have planted the crops in the flood."),
    grumpy: G("We told the date by the Nile. It was wet or it wasn't.", "Extra days. Nothing but trouble since they started.", "Right. Now do it without the wheel, like we did.", "Wrong. The eclipse came anyway. It always does."),
    sports: G("The gears are turning, the count is on, here comes the day!", "It's wheel against wheel in the count of days!", "CALLED IT! To the day! What a prediction!", "A miss on the count! The calendar wins this round!"),
    conspiracy: G("Three calendars. Three. Why can't they agree? Ask that.", "An eclipse they knew about in advance. Convenient.", "You predicted it. Now they know you can.", "Wrong. Or somebody moved a day. Check your Thursdays."),
    bard: G("Wheel within wheel, the patient days revolve.", "Mark well the hour when moon doth kiss the sun.", "Thy reckoning is true as any standing stone!", "The day hath fled thee, like a summer's lease."),
    pirate: G("Keepin' the ship's log, but for the whole sky!", "An eclipse! Good night for a bit o' discreet sailin'.", "Dead reckonin'! Ye marked the day true!", "Ye lost count, matey. We missed the feast."),
    influencer: G("Planner besties, the ancients did it first.", "Eclipse content incoming. Do not look directly at it.", "Called it! Scheduling icon of three civilisations.", "Wrong date, bestie. The festival was yesterday."),
  },
  grimoire: {
    mystic: G("Every leaf is a page. Read before you pick.", "The old tales were sometimes right. Check twice.", "Rightly named. The plant nods in the wind.", "A wrong leaf. In the wild, that lesson costs more."),
    deadpan: G("It's a plant. Green. Leaves. Narrow it down.", "Folklore says it cures everything. Science says sit down.", "Correct plant. It remains unaware of you.", "Wrong. That one's a weed. So was the last one."),
    drama: G("A HERB! Dew upon it like the tears of dawn!", "So beautiful! So possibly POISONOUS! Like me!", "IDENTIFIED! The meadow erupts in applause!", "Wrong plant! I'm wilting! WILTING!"),
    standup: G("Herbalism: it's just gardening with consequences.", "I asked sage for advice. Very wise. Bit dry.", "Correct! You're a natural. Fully organic.", "Wrong plant. Thyme to try again. I'll see myself out."),
    grumpy: G("We knew every plant by its smell. And by its rash.", "Don't trample my borders.", "Right. Even a goat knows that one, but well done.", "Wrong. That's how my cousin got hiccups for a year."),
    sports: G("A tricky leaf shape here, the challenger studies it!", "It's petals versus memory at the garden wall!", "IDENTIFIED! A textbook pick from the hedgerow!", "Mistaken identity! The lookalike fools another one!"),
    conspiracy: G("So many plants called 'wort'. Who decided? Wort people.", "The garden is listening. Ivy especially.", "Correct. The plants trust you now. Heavy responsibility.", "Wrong. That's what the dandelions want you to think."),
    bard: G("Each humble weed doth wear a secret crown.", "Sweet herb, what tales thy little leaves could tell!", "Well named! The garden counts thee as its friend.", "Thou hast mistook the leaf, and so the tale."),
    pirate: G("Know yer greens, matey, or the ship's cook will get ye!", "That one's good for seasickness. Or causes it. One o' those.", "Ye picked true! Stow it in the medicine chest!", "Wrong weed, matey. Ship's cook made that mistake once."),
    influencer: G("Plant haul! This one's organic. They all are.", "Folklore said it. Science fact-checked it. Love a duet.", "Correct! Cottage garden certified.", "Wrong plant, bestie. Do not put that in a smoothie."),
  },
  stars: {
    mystic: G("The sky is the oldest book. Join the letters.", "Those stars are far apart. Only our stories hold them.", "The figure is drawn. The heavens remember you.", "The stars scatter. They will wait; they are good at it."),
    deadpan: G("Connect the dots. People called it mythology.", "That's a bear, apparently. Sure it is.", "You drew it. It still doesn't look like the picture.", "Wrong stars. You've invented a new constellation. Congrats."),
    drama: G("The HEAVENS! Sequins on the gown of night!", "A BELT of stars! I've always said accessories matter!", "You've drawn it! A masterpiece across the firmament!", "The line broke! A star-crossed tragedy! Literally!"),
    standup: G("Constellations: someone really oversold some dots.", "Five stars and they call it a queen. I get three and a review.", "Got it! You're a star. Well, five stars and some lines.", "Missed. Space is big. Don't take it personally."),
    grumpy: G("We had more stars in my day. Darker nights. Proper dark.", "Stop pointing. They're all 'that one'.", "Right. Now find your way home with it. We had to.", "Wrong star. That's a planet. Or a lamp."),
    sports: G("Star to star, a beautiful passing move across the sky!", "Looking for the link-up, there's space out wide!", "CONSTELLATION COMPLETE! That's stellar play!", "Wide of the star! The night sky holds its lead!"),
    conspiracy: G("The pole star barely moves. What does it know?", "Same constellations every year. Who's running the loop?", "You mapped it. They hate when we look up.", "Wrong stars. Or they shifted them. Check tomorrow."),
    bard: G("Yon burning tapers of the night await thy hand.", "Trace thou the shape the ancients saw in fire.", "The stars are joined! Thy name is writ in light!", "Thy line hath strayed among the wandering fires."),
    pirate: G("Steer by the stars, matey! They never ask for a share.", "The pole star be the only honest light at sea.", "Charted true! Ye'd make a fine navigator!", "Ye've lost yer bearing! That way lies sea monsters."),
    influencer: G("Stargazing aesthetic. No filter. Okay, one filter.", "That belt of stars is the original statement accessory.", "Drawn! Constellation reveal! Stunning!", "Wrong star, bestie. That one's not in the group chat."),
  },
  duel: {
    mystic: G("Atoms are the smallest fortune tellers. They always bond.", "Choose your elements. I have foreseen my victory. Maybe.", "You out-reacted me. The elements favoured you today.", "My compounds hold. The glass did warn you."),
    deadpan: G("It's chemistry, but competitive. Try to care.", "I'm playing sodium. Thrilling. Hold me back.", "You won. I'm devastated. This is my devastated face.", "I won. Yay. That was me celebrating."),
    drama: G("A DUEL! Atoms at dawn! Choose your seconds!", "Sodium meets chlorine! A love story! With SALT!", "DEFEATED! By a mortal! Catch me, I'm destabilised!", "VICTORY is mine! Roses! Throw the noble gases!"),
    standup: G("I'd tell a chemistry joke but all the good ones argon.", "Never trust atoms. They make up everything.", "You beat me. I've lost an electron. I'm positive.", "I win! Don't overreact. That's my job."),
    grumpy: G("Four elements, we had. Earth, air, fire, water. Enough.", "Play your card. My half-life isn't getting longer.", "You won. Beginner's luck. A thousand years of it.", "I won. As it should be. Respect your elders."),
    sports: G("It's a bench-clearing reaction here at the lab!", "Carbon comes off the bench! It bonds with EVERYBODY!", "The challenger takes it! The Oracle is OUT of Stability!", "The Oracle wins it! A dominant compound performance!"),
    conspiracy: G("The first periodic table had gaps left on purpose. Hm.", "Noble gases refuse to react. What are they hiding?", "You won. The elements let you. Ask yourself why.", "I won. As was arranged. I mean foretold."),
    bard: G("Come, elements, and marry on the bench!", "Fair oxygen, that dost with most things bond.", "I yield! Thy chemistry hath bested mine own art.", "The field is mine! Sing, muse, of molecules!"),
    pirate: G("Broadside o' hydrogen! Ready the carbon cannons!", "Salt! I know that one. Sailed on it all me life.", "Ye sank me compounds! I strike me colours!", "Victory! Yer atoms walk the plank!"),
    influencer: G("Element duel! Team carbon, where you at?", "Gold's symbol is Au. As in 'ay, you, nice jewellery'.", "You won! Okay, chemistry icon! I'm not crying.", "I won, besties! Bonding era. Stable era."),
  },
  memory: {
    mystic: G("Memory is a candle. Shield it and it lasts.", "Each card has a twin. So does every thought.", "All pairs joined. Your mind is a well-kept grimoire.", "The candles are spent. Memory fades; relight it."),
    deadpan: G("Flip two. If they match, good. If not, also fine.", "You've seen that card three times. So have I.", "All matched. Your memory works. Noted.", "Out of candles. It's dark. Metaphorically too."),
    drama: G("Two cards! Separated at the shuffle! REUNITE them!", "A candle gutters! Time is DYING, darling!", "Every pair TOGETHER again! I adore a happy ending!", "The last flame! Gone! We sit in the dark and FEEL it!"),
    standup: G("I have a photographic memory. Never developed it.", "Matching pairs: speed dating for cards.", "All matched! Remember this moment. You obviously can.", "Out of candles. Forget about it. You already did."),
    grumpy: G("I remember every card since the Bronze Age. Flip.", "That one was THERE. It was there a minute ago.", "All matched. Not bad, for someone with a phone.", "Out of candles. You'd forget your own hood."),
    sports: G("Two up, no match, and the candle count is dropping!", "Oh, they KNOW where that card is! Here it comes!", "BOARD CLEARED! A total recall performance!", "The last candle's out! Memory lets them down today!"),
    conspiracy: G("The cards move when you blink. I've seen it.", "Why two of each? Who's making the copies?", "All matched. You remember everything. Dangerous.", "Out of candles. Somebody wanted it dark in here."),
    bard: G("Twin unto twin, as rhyme doth answer rhyme.", "Hold fast the place, for memory is a sieve.", "All pairs are wed! Let memory wear the crown!", "The lights are out, and all the pairs are strangers."),
    pirate: G("Where'd I bury that card? Story o' me life.", "Two o' a kind! Like parrots, but quieter.", "Every pair found! Ye've a mind like a locked chest!", "Candles out! Lost in the fog, we are."),
    influencer: G("Matching set! We love a coordinated moment.", "Brain training, but make it mystical.", "All pairs matched! Memory: ten out of ten. No notes.", "Out of candles, bestie. The lighting was bad anyway."),
  },
  rummy: {
    mystic: G("I shuffled the heavens. Mind what falls from them.", "A set of stars is a story finished.", "You gathered the sky faster than I. Well played.", "The stars came home to my hand, as foretold."),
    deadpan: G("Draw a star. Discard a star. The cosmos, as a chore.", "I need one card. I always need one card.", "You won. I'll alert the constellations.", "I won. I foresaw it. It was still dull."),
    drama: G("The DISCARD pile! A graveyard of fallen stars!", "A whole constellation in my hand! I can't BREATHE!", "You WON! Outplayed beneath the heavens! I'm undone!", "I've WON! Dim the lights! Spotlight on my hand!"),
    standup: G("I'd fold, but this isn't that game. Also I have no lap.", "Three stars walk into a set. That's it. That's a meld.", "You won! I had a great hand. Shame about the cards in it.", "I win! Read 'em and weep. They're stars, so weep upward."),
    grumpy: G("We played cards with actual stars. Burnt the table.", "Discard already. The universe is expanding.", "You won. The deck's rigged. I rigged it badly.", "I won. Experience. Also I can see the future."),
    sports: G("A draw from the deck, and it's a big one!", "The Oracle is one card from a full constellation!", "RUMMY! The challenger lays it all down! What a hand!", "The Oracle goes out! A stellar finish from the veteran!"),
    conspiracy: G("I know what's in your hand. I know what's in every hand.", "The deck has a second night. Who works the night shift?", "You won. I let you. That's what I'll tell them.", "I won. Nothing suspicious. Stop looking at my sleeves."),
    bard: G("Deal forth the stars, and let the heavens pour!", "A set of three, as Graces and as Fates.", "Thou winnest! All my stars are fallen low.", "The night is mine! My hand outshines the moon!"),
    pirate: G("Cards and stars! I'd never bet me ship on either. Again.", "I'll trade ye a bright one for whatever ye're hidin'.", "Ye plundered the whole sky! Well played, ye scallywag!", "The night's mine! Hand over the doubloons! Er, Essence."),
    influencer: G("Collecting stars like it's a limited drop.", "My hand is giving main-character constellation.", "You won! Star player! Literally!", "I won, besties! Full set! Collection complete!"),
  },
  flametest: {
    mystic: G("Every flame keeps a secret colour. Read it kindly.", "The fire speaks in wavelengths. Listen with your eyes.", "You read the fire's true name. It glows for you.", "The flame kept its secret this time. It will tell again."),
    deadpan: G("It's fire. It's a colour. You say the colour's name.", "Sodium again. It's always sodium. Salt gets everywhere.", "Correct. The fire is mildly impressed.", "Wrong element. The flame doesn't care. It's a flame."),
    drama: G("CRIMSON! Or is it?! The suspense is SCORCHING me!", "Look at that GREEN! I may faint from the beauty!", "Every colour RIGHT! Bunsen weeps tears of joy!", "The flame deceived us! Betrayal in technicolour!"),
    standup: G("Flame tests: like a mood ring, but for metals.", "Potassium's lilac. Very fancy. Very hard to see.", "You nailed it! Hot take: you're on fire.", "Wrong colour. Don't worry, it was a burner of a round."),
    grumpy: G("Clean the wire first. Nobody ever cleans the wire.", "Back in my day we squinted at it. No cobalt glass.", "Fine. You know your colours. Turn the gas off.", "Wrong. Probably sodium on your fingers. Wash them."),
    sports: G("Into the flame it goes, and it's a COLOUR CHANGE!", "The challenger squints, reads the hue, and commits!", "IDENTIFIED! A clean sweep at the burner!", "And the flame takes this round! What a disguise!"),
    conspiracy: G("Why is sodium in EVERYTHING? Who's putting it there?", "Cobalt glass hides the yellow. What else does it hide?", "You found the hidden metal. They knew you would.", "Wrong? Or did someone swap the salts? I'm just asking."),
    bard: G("Behold, the flame in crimson robes doth dance!", "What metal sleeps within this salt, and blushes so?", "Thou read'st the fire like scripture! Hear the bells!", "Alas, the flame wore borrowed colours and fooled thee."),
    pirate: G("Red flame be lithium, or strontium, if ye be lucky!", "Green fire, like a ghost ship's lantern, arr.", "Ye read the flames like a true navigator!", "Arr, wrong metal. That fire be lyin' like a parrot."),
    influencer: G("Flame colour reveal! Drop your guesses below!", "This green is a whole aesthetic. No filter needed.", "Every colour right! Main character at the burner.", "Wrong guess, bestie. Even the flame needed a filter."),
  },
};

/** Per personality: what she says when poked, and after a perfect round in any game. */
export const PERSONA_BANTER = {
  mystic: { poke: ["The Oracle sees all. Including that.", "Patience, {name}. The mist is ticklish.", "You touch destiny rather a lot."], perfect: ["Flawless. Even the stars took notes."] },
  deadpan: { poke: ["Ow. That's me expressing pain.", "You poked me. Riveting.", "Yes. That's my hood. Well spotted."], perfect: ["A perfect round. I'd clap, but I'm holding a ball."] },
  drama: { poke: ["I've been TOUCHED! By a mortal! I may faint!", "My hood! It's COUTURE, darling!", "Unhand me! Or don't! I love the attention!"], perfect: ["PERFECTION! I'm weeping gold!"] },
  standup: { poke: ["Hey, hands off the merchandise.", "Poke the Oracle, get the jokes. Fair trade.", "Is this thing on? Oh. It's me. I'm the thing."], perfect: ["Perfect! Leave some talent for the rest of us."] },
  grumpy: { poke: ["Get off my hood.", "In my day we poked nobody. We had manners.", "Stop that. I bruise in centuries."], perfect: ["Perfect. Hmph. Don't let it go to your head."] },
  sports: { poke: ["A foul on the Oracle! Where's the whistle?!", "Contact on the hood! No call from the referee!", "The challenger pokes again! Unsporting!"], perfect: ["A PERFECT round! One for the record books!"] },
  conspiracy: { poke: ["Who told you to poke me? Names.", "Checking me for wires? Smart.", "That's exactly where the last one poked."], perfect: ["Perfect. Too perfect. I'm watching you."] },
  bard: { poke: ["Unhand me, knave! …Gently, though.", "Thou pokest as the woodpecker the oak.", "A touch, a touch, I do confess it."], perfect: ["A flawless deed! I'll set it down in verse."] },
  pirate: { poke: ["Avast! Hands off the captain!", "Poke me again and ye'll swab the Chamber!", "That be me good robe, ye barnacle!"], perfect: ["Flawless! Ye'd make first mate by sundown!"] },
  influencer: { poke: ["Besties, do NOT touch the hood.", "Engagement is up! Poke responsibly.", "That's a boundary, bestie."], perfect: ["Flawless! Posting this. Tagging you."] },
};

/** A line for this game, personality and moment ("mid" | "win" | "lose" | "perfect" | "poke"), or null.
 *  `used` (an array kept by the caller) stops a line repeating until its pool is spent. */
export function banter(game, personaId, event, name = "traveller", used = [], rand = Math.random) {
  const pid = PERSONA_BANTER[personaId] ? personaId : "mystic", own = PERSONA_BANTER[pid];
  let pool = event === "poke" ? own.poke : event === "perfect" ? [...own.perfect, ...((BANTER[game] || {})[pid] || {}).win || []] : ((BANTER[game] || {})[pid] || {})[event];
  if (!pool || !pool.length) return null;
  let fresh = pool.filter((l) => !used.includes(l));
  if (!fresh.length) { for (const l of pool) { const i = used.indexOf(l); if (i >= 0) used.splice(i, 1); } fresh = pool; }
  const l = fresh[Math.floor(rand() * fresh.length)]; used.push(l);
  return l.replace(/\{name\}/g, name);
}
