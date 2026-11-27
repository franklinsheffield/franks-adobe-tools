// Oracle personalities: comedic delivery styles sold in the Essence store. A personality changes how the Oracle
// greets, asks, casts, reveals, frames the answer and which jokes it tells. The reading itself never changes.
// {name} = member, {system} = reading system, {result} = the reading's headline. All lines original.

export const PERSONAS = {
  "mystic": null, // the classic Oracle: uses the default lines and the shared joke pool

  deadpan: {
    greet: ["Hello, {name}. I foresaw this. I'm thrilled. This is me thrilled.", "Welcome to the Chamber. It's a room. With mist. Pick something.", "Oh good, a visitor. My one eye is fully open. That's as excited as it gets."],
    ask: ["Ask your question. I'll pretend I don't already know it.", "Go ahead. The {system} is listening. Probably."],
    cast: ["Doing the mystical part now.", "Casting. Very dramatic. Please gasp.", "And now, magic happens. Allegedly."],
    reveal: ["It's {result}. Wow.", "The answer is {result}. Try to contain yourself.", "{result}. I'm as surprised as you are, which is not at all."],
    pre: ["Okay.", "Here it is.", "Brace yourself, mildly."],
    post: ["That's the answer. You can clap if you want. Or not.", "I've said it. My work here is done for about four seconds."],
    jokes: ["I'm told I have a dry sense of humour. I keep it in the pyramid. Very dry in there.", "Five thousand years of prophecy and I've never once been surprised. Twice, actually. Once was a duck.",
      "Destiny's a lot like a waiting room. Bad chairs, old magazines, then suddenly it's your turn.", "I would celebrate, but my face is made of bricks.", "Your future is bright. I'd wear sunglasses. I can't. One eye. Uneven tan.",
      "This crystal ball cost a fortune. I didn't see that coming either.", "I've seen the end of the universe. It's fine. Bit quiet.", "The spirits say hello. They also say nothing else. Great conversationalists.",
      "My hobbies include knowing things and sighing.", "I tried meditation. I was already there.", "Fun fact: I'm fun. That's the whole fact.", "Prophecy is easy. Small talk is the hard part. Lovely weather in the void."] },

  drama: {
    greet: ["{name}! FINALLY! I have waited CENTURIES for this moment! Well, since lunch. But it FELT like centuries!", "Darling! The mist parted, the candles gasped, and YOU walked in! Iconic!", "Oh, the stars told me you'd come, {name}, and I wept. Openly. On the bricks."],
    ask: ["Speak, {name}! Pour your heart into the {system}! Hold nothing back! Unless it's a refund request!", "Your question, darling! Whisper it! No, SHOUT it! No, whisper! I'm overwhelmed!"],
    cast: ["THE FATES ARE STIRRING! I can't look! I'm looking!", "Behold! The {system} trembles before your destiny!", "This is the most important reading of my ENTIRE career. Again."],
    reveal: ["*gasp* {result}! I need to sit down. I'm already sitting. I need to sit down MORE.", "The answer… oh, the answer… is {result}! Somebody fetch my smelling salts!", "{result}!! The cosmos has written a MASTERPIECE!"],
    pre: ["Oh, {name}… oh, {name}…", "Prepare yourself, darling.", "*clutches crystal ball*"],
    post: ["I'm not crying. The mist is just very emotional tonight.", "Encore! ENCORE! No, really, ask me another one."],
    jokes: ["I don't have mood swings. I have mood ROLLER COASTERS. With loop-the-loops.", "Every prophecy I give deserves a standing ovation. Most get a polite nod. I accept both.",
      "I once fainted at a sunrise. It was very moving. The sun, I mean. It moves.", "My candles flicker because they're nervous to be near such a star. Me. I'm the star.",
      "Dahling, destiny isn't a path. It's a RED CARPET.", "I tried to whisper a prophecy once. It came out as an aria.", "Somebody give this reading an award. I'll accept it on its behalf.",
      "I have two settings: overwhelmed and DEEPLY overwhelmed.", "The future called. I hung up for dramatic effect. Then called back. Then hung up again.",
      "Plot twist, {name}: you were the main character ALL ALONG.", "My therapist says I'm 'a lot'. My therapist is a candle.", "If you hear sobbing in the mist, it's fine. I'm just moved by your aura."] },

  standup: {
    greet: ["Hey hey, {name}! Great crowd tonight. Well, you. You're the crowd. Give it up for yourself!", "Welcome to the Chamber, folks! Tip your Oracle, try the Essence!", "Is this thing on? *taps crystal ball* {name}, you look like someone with a question!"],
    ask: ["So what's the deal with your question? Lay it on me, {name}.", "The {system}, folks! Big fan. Hit me with it."],
    cast: ["Okay, here goes, no pressure, just destiny!", "Drumroll please! I don't have a drummer. Imagine one!", "Watch my hands. Nothing up my sleeves. Mostly mist."],
    reveal: ["And the answer is… {result}! *ba-dum tss*", "{result}! Didn't see that coming? I did. It's literally my job.", "So the {system} says {result}. Tough crowd, the {system}."],
    pre: ["But seriously, folks…", "Okay, okay, real talk:", "Here's the punchline:"],
    post: ["I'm here all week! Actually I'm here all eternity.", "Thank you, thank you, you've been a wonderful audience of one!"],
    jokes: ["What's the deal with fortune cookies? You crack them open, the fortune's always 'you will eat a cookie'. I KNOW.", "My doctor told me to watch my eye. So I got a crystal ball.",
      "Why don't oracles play poker? Everyone folds the moment we sit down.", "I asked the universe for a sign. It said 'Closed for renovations'.", "How many oracles does it take to change a light bulb? None. We saw it coming and bought LEDs.",
      "I've been a fortune teller for five thousand years. The pension plan is terrible.", "My pyramid has a great view. The rent? Ancient.", "I told a skeleton a joke once. Nothing. No guts.",
      "Psychic hotline called me. Said they'd been expecting my call.", "I went to a séance last week. Total ghosting.", "Astrologers walk into a bar. The bartender says, 'What'll it be?' They say, 'Depends on Mercury.'",
      "You know you're old when your birth chart is carved in stone. Literally. On my wall."] },

  grumpy: {
    greet: ["Hmph. {name}. Back again. In MY day we consulted oracles once a century and we were GRATEFUL.", "What is it now? I was napping. For three hundred years. It was a short nap.", "Oh, a visitor. Wipe your feet. These are ancient floors."],
    ask: ["Fine. Ask. Speak up, my ears are carved.", "Questions, questions. The {system} doesn't grow on trees, you know. Actually some of it does."],
    cast: ["Alright, alright, I'm casting. Don't rush me.", "Back in my day we cast with REAL rocks. Uphill. Both ways.", "Ugh. My knuckles. Fine. Here."],
    reveal: ["There. {result}. Happy now?", "{result}. Could've told you that without the fuss.", "It's {result}, obviously. Kids these days and their destinies."],
    pre: ["Listen here, young one.", "Pay attention, I'll only say it once.", "Hmph."],
    post: ["Now off you go. And close the portal behind you, there's a draught.", "Don't let it go to your head."],
    jokes: ["Crystal balls used to be crystal. Now it's all 'glass'. Pfft.", "I remember when the stars were new. Shinier. Better made.", "You young people and your 'apps'. I've been an app for five thousand years. Nobody gives ME stars.",
      "Back in my day the future came once a week, on a Tuesday, and you were happy with it.", "My back hurts. I don't have a back. It still hurts.", "Another reading? I'll need a cup of tea the size of the Nile.",
      "The moon used to rise on time. Now it's 'phases' this and 'phases' that.", "Everybody wants 'vibes' now. In my day we had dread, and we liked it.", "Don't touch the candles. They're older than you. One's older than me.",
      "I've outlived seven empires and four of them still owe me money.", "Good fortune, bad fortune, it's all fortune. Stop complaining. That's my job.", "Mist? This isn't mist. That's dust. Nobody's cleaned in here since the Bronze Age."] },

  sports: {
    greet: ["AND HERE COMES {name}, striding into the Chamber! The crowd goes WILD!", "Welcome back to Prophecy Night, folks! I'm your Oracle, and what a matchup we've got tonight!", "{name} has entered the arena! Let's see what kind of game they've got!"],
    ask: ["{name} steps up to the {system}! What'll it be?", "The question is the opening play, {name}. Give it everything!"],
    cast: ["AND IT'S UP IN THE AIR! Look at that spin!", "The {system} is IN MOTION, folks! This could be anything!", "Here's the windup… and the CAST!"],
    reveal: ["AND IT'S {result}! WHAT A FINISH!", "{result}! Absolutely textbook from the {system}!", "Can you BELIEVE it? {result}! They'll be talking about this one for years!"],
    pre: ["Let's go to the replay:", "And the ruling on the field is…", "Here's the play-by-play:"],
    post: ["That's a highlight reel moment, folks!", "Back to you in the studio. I am the studio."],
    jokes: ["The crystal ball is having a career season. Unreal hand-eye coordination. Well, eye.", "That's the fifth prophecy tonight! Somebody check the record books!",
      "And the stars align for a picture-perfect play!", "Mercury's out of the game with retrograde. Huge loss for the team.", "The Moon is playing defence tonight, folks, and it's LOCKED DOWN.",
      "Saturn with the slow, methodical drive. Classic veteran move.", "That's a hat trick of good omens! The hats are raining from the sky!", "Instant replay confirms: destiny was NOT offside.",
      "This rookie {name} has got the instincts of a seasoned seer!", "The candles are on their feet! Well, their wicks!", "What a comeback from the Tower card! Nobody expected the collapse to be THAT good!",
      "And THAT'S why they call it the Chamber of Champions. They don't. But they should."] },

  conspiracy: {
    greet: ["{name}. Get in, quickly. Were you followed? Doesn't matter. The pigeons already know.", "Welcome. Don't look at the candles directly, they're recording.", "Shh. Close the portal. They're listening. Who? Exactly."],
    ask: ["Ask your question. Quietly. The {system} has seen things, {name}. Terrible, fascinating things.", "What do you want to know? And who TOLD you to ask that?"],
    cast: ["Casting now. Act natural.", "They don't want you to know this, but the {system} works.", "Watch closely. This is the part Big Calendar doesn't want you to see."],
    reveal: ["{result}. Coincidence? I don't think so.", "It's {result}. Connect the dots, {name}. There are SO many dots.", "{result}. Write it down. Then eat the paper."],
    pre: ["Here's what THEY won't tell you:", "Follow the threads, {name}.", "Open your third eye. Mine's on backorder."],
    post: ["You didn't hear it from me.", "Delete your browser history. Then delete the browser. Then delete the history of browsers."],
    jokes: ["Birds aren't real. Some of them are oracles in disguise. Not me. I'm a pyramid. Totally different.", "The moon landing was real. I was there. I gave them directions.",
      "Ever notice how Mercury goes retrograde right when your phone breaks? Wake up, {name}.", "Pyramids weren't built by aliens. Pyramids built the aliens. Ask me how I know.",
      "The number seven appears in everything. Days of the week. Wonders of the world. Coincidence? Yes. But a SUSPICIOUS one.", "The stars aren't far away. They're just shy.",
      "Who REALLY shuffles the tarot deck? Think about it.", "Every time you say 'lucky guess', a psychic loses their licence.", "My crystal ball has a second crystal ball inside it. Mirrors all the way down.",
      "The calendar has twelve months because thirteen would reveal the truth.", "Cats know. Cats always know.", "I'm not paranoid, {name}. I'm prepared. There's a difference, and it's a hat."] },

  bard: {
    greet: ["Hail and well met, {name}! Prithee, sit, and let the Oracle's tale begin.", "What light through yonder mist doth break? 'Tis {name}, and thou art welcome!", "Hark! A seeker comes! Pray, what wouldst thou know?"],
    ask: ["Speak thy question, gentle {name}, and the {system} shall answer thee in verse. Mostly.", "Unburden thy heart, good soul. What riddle vexes thee?"],
    cast: ["To cast, or not to cast? Cast, obviously.", "Lo! The {system} turneth!", "Fair fortune, show thy face!"],
    reveal: ["The fates have spoken: {result}! Huzzah!", "'Tis {result}, by my troth!", "Behold, thy answer: {result}. Exeunt doubts, pursued by a bear."],
    pre: ["Hark, and attend:", "Thus saith the glass:", "Lend me thine ears:"],
    post: ["All's well that ends well. And this endeth well.", "Parting is such sweet sorrow. Come back tomorrow."],
    jokes: ["Methinks the crystal ball doth sparkle too much.", "A prophecy, a prophecy! My kingdom for a prophecy! Oh wait, here's one.", "The course of true fortune never did run smooth. It did run, though.",
      "Double, double, toil and trouble, Mercury burns and stars do bubble.", "Some are born mystical, some achieve mysticism, and some have mysticism thrust upon them by a pyramid.",
      "If music be the food of love, then candles be the snacks of prophecy.", "Thou art more lovely than a Tuesday. Tuesdays are lovely in the Chamber.", "Neither a borrower nor a lender be. Except of Essence. Lend me some.",
      "All the world's a stage, and I am the lighting department.", "Brevity is the soul of wit. I am, therefore, very witty. Done.", "Something is rotten in the state of the cosmos. 'Tis the old cheese in the pyramid.",
      "Now is the winter of our discontent made glorious summer by this sunny reading."] },

  pirate: {
    greet: ["Ahoy, {name}! Welcome aboard the good ship Chamber! Mind the mist, it be slippery.", "Arr, a fresh seeker! Ye've the look of someone hunting buried answers.", "Shiver me pyramids! {name} be back on deck!"],
    ask: ["What be yer question, matey? The {system} be ready to sail.", "Speak up, {name}! The tide waits for no seer."],
    cast: ["Hoist the {system}! Let her fly!", "Batten down the hatches, here comes destiny!", "Yo ho, yo ho, a fortune teller's life for me!"],
    reveal: ["X marks the spot, and the spot says {result}!", "Arr! {result}! That be treasure, that be!", "The compass points true: {result}!"],
    pre: ["Listen close, ye scallywag:", "By the stars that guide me ship:", "Arr, here be the truth:"],
    post: ["Now go plunder yer day, {name}!", "Fair winds and good fortune to ye!"],
    jokes: ["Why couldn't the pirate learn the alphabet? Kept getting lost at C. I be the C. The Crystal ball.", "This eye patch? I don't wear one. Me eye just be that intense.",
      "Me crystal ball be the finest treasure on the seven seas. And the eighth sea. Ye don't know about the eighth sea.", "Ye know why oracles make great pirates? We always know where the gold be. Usually in Essence.",
      "Arr, Mercury be in retrograde. That be why me parrot keeps saying everything backwards.", "Walk the plank? I float, matey. I be a mystic.", "Me treasure map has just one word on it: 'destiny'. Very unhelpful map.",
      "Dead men tell no tales. Dead oracles, on the other hand, never shut up.", "Why do pyramids never go to sea? Too pointy for the hammocks.", "The stars be me compass, the moon be me lantern, and the candles be fire hazards.",
      "I once sailed through a storm of prophecy. Fortunes everywhere. Most were soggy.", "Me favourite letter be R. Second favourite be the letter from the future that says ye'll do great."] },

  influencer: {
    greet: ["Heyyy besties! It's your girl, the Oracle! {name}'s here, so we're going LIVE!", "Omg {name}, hiii! Don't forget to like, subscribe and align your chakras!", "Welcome back to the channel! Today's video: your DESTINY. Let's get into it!"],
    ask: ["Drop your question below, {name}! The {system} is literally so iconic.", "Okay so what's the tea, {name}? Spill it for the {system}."],
    cast: ["Get ready with me: destiny edition!", "This is NOT sponsored, I just genuinely love the {system}.", "Okay, the {system} is doing its thing and I'm obsessed."],
    reveal: ["It's giving… {result}! Slay!", "No because {result}?? I'm screaming!", "{result}. Main character energy, honestly."],
    pre: ["Okay, storytime:", "Not me getting emotional, but:", "Real ones know:"],
    post: ["Link in bio for more prophecies!", "Comment 'destiny' if this resonated!"],
    jokes: ["This crystal ball? Vintage. Like, Bronze Age vintage.", "My skincare routine is just mist. Five thousand years and not a wrinkle. Bricks don't wrinkle.",
      "I'm not saying I'm an influencer, but the tides do follow me.", "POV: you asked the Oracle and the Oracle understood the assignment.", "Mercury's in retrograde and honestly? Mood.",
      "Unboxing my new prophecy… oh, it's gorgeous.", "This candle is from my collab with the Moon.", "Rating today's omen: ten out of ten, no notes.", "Living my best afterlife.",
      "Hot take: destiny is just vibes with a schedule.", "Remember besties, hydrate, moisturise, and consult a pyramid.", "That reading ate. It left no crumbs. The table cloth is spotless."] },
};

const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

/** The active personality's lines, or null for the classic mystic. */
export const persona = (id) => PERSONAS[id] || null;
export const line = (P, kind, v) => (P && P[kind] ? fill(pick(P[kind]), v) : null);

/** A joke from this personality's own pool, no repeats until all are heard. */
export function personaQuip(id, name, heard) {
  const P = PERSONAS[id]; if (!P) return null;
  const ids = P.jokes.map((_, i) => `${id}:${i}`);
  let fresh = ids.filter((x) => !heard.includes(x));
  if (!fresh.length) { for (const x of ids) { const i = heard.indexOf(x); if (i >= 0) heard.splice(i, 1); } fresh = ids; }
  const pickId = pick(fresh); heard.push(pickId);
  return fill(P.jokes[+pickId.split(":")[1]], { name });
}

/** Frame the Oracle's answer in the personality's delivery. */
export function deliver(id, answerLine, v) {
  const P = PERSONAS[id]; if (!P) return answerLine;
  return [fill(pick(P.pre), v), answerLine, Math.random() < 0.6 ? fill(pick(P.post), v) : ""].filter(Boolean).join(" ");
}
