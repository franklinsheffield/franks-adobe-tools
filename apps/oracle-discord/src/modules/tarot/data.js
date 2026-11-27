// The 78-card tarot: 22 Major Arcana and four suits of 14. Card names and the shape of their meanings follow
// long-standing public tradition (Tarot de Marseille, the 1909 Rider-Waite-Smith deck, modern practice);
// every line of text here is original to Science is Magic.
// Each card: n (name), kw (keywords), up (upright), rv (reversed).
// House rule: card texts describe what the card shows and how tradition reads it. They never tell the reader what to do.

export const MAJORS = [
  { n: "The Fool", num: "0", sym: "✶", kw: ["beginnings", "leap", "freedom"], up: "A clean start with no map. The card shows a step taken before the ground is visible: curiosity standing in for a plan.", rv: "A leap without looking, or a fear of leaping at all. Reversed, the card points at the cliff edge that went unexamined." },
  { n: "The Magician", num: "I", sym: "∞", kw: ["skill", "will", "resources"], up: "Everything needed is already on the table. The card stands for focused will and for tools put to use: a card of doing.", rv: "Talent scattered, or skill used to trick. Reversed, it raises the question of whether the plan is honest, including with oneself." },
  { n: "The High Priestess", num: "II", sym: "☾", kw: ["intuition", "mystery", "inner voice"], up: "The answer is quiet and inside. The card stands for waiting, watching and listening, and treats what is sensed as real data.", rv: "A gut feeling ignored, or secrets that have started to cost something. Reversed, the hidden thing is close to the surface." },
  { n: "The Empress", num: "III", sym: "♀", kw: ["abundance", "nurture", "creation"], up: "Growth, comfort and creative plenty. The card shows what was planted being tended, the body rested, and things left to ripen.", rv: "Smothering, or self-neglect while caring for everyone else. Reversed, the card shows a cup that is giving more than it holds." },
  { n: "The Emperor", num: "IV", sym: "♂", kw: ["structure", "authority", "stability"], up: "The frame: rules, routines, a clear plan. The card stands for steady leadership that turns ideas into something lasting.", rv: "Control turned rigid, or no structure at all. Reversed, the card marks a grip too tight or a boundary never set." },
  { n: "The Hierophant", num: "V", sym: "⚷", kw: ["tradition", "teaching", "belonging"], up: "Learning from those who walked this way before. A teacher, a tradition or a community is shown holding the key.", rv: "The rulebook questioned. Reversed, the card describes a path that leaves the well-worn one." },
  { n: "The Lovers", num: "VI", sym: "♡", kw: ["choice", "union", "values"], up: "A meaningful bond, or a choice that shows what is truly valued. The card stands for choosing wholeheartedly rather than by halves.", rv: "Misalignment: between two people, or between what is said and what is done. Reversed, the two have drifted apart." },
  { n: "The Chariot", num: "VII", sym: "⛭", kw: ["drive", "victory", "control"], up: "Willpower carries this card. Opposing forces are held steady, aimed, and driven forward.", rv: "Pulled in two directions, or pushing too hard. Reversed, the chariot is moving without anyone steering." },
  { n: "Strength", num: "VIII", sym: "∞", kw: ["courage", "patience", "gentle power"], up: "Quiet courage. The lion in this card is tamed with patience and kindness, not force.", rv: "Self-doubt, or a temper slipping its leash. Reversed, the wild part is being met with force or fear instead of gentleness." },
  { n: "The Hermit", num: "IX", sym: "✧", kw: ["solitude", "search", "wisdom"], up: "A step back from the noise, carrying one's own lamp. The card treats time alone as showing what crowds cannot.", rv: "Isolation that has gone on too long, or a refusal to look inward. Reversed, the lamp is far from the fire." },
  { n: "Wheel of Fortune", num: "X", sym: "☸", kw: ["cycles", "luck", "turning point"], up: "The wheel turning upward. The card stands for change arriving, and for moving with it rather than bracing against it.", rv: "A downturn or a stuck cycle. What goes down comes round; reversed, the card points at the lesson that lets the wheel turn." },
  { n: "Justice", num: "XI", sym: "⚖", kw: ["truth", "fairness", "consequence"], up: "Cause and effect, clearly weighed. The card ties fair scales to honesty and to care over what is agreed.", rv: "Something unbalanced or unaccounted for. Reversed, the scales are waiting on a part not yet owned." },
  { n: "The Hanged Man", num: "XII", sym: "⟂", kw: ["pause", "surrender", "new view"], up: "Hanging upside down for a while. The card links waiting and letting go with seeing an angle that was missing.", rv: "Stalling for its own sake, or a sacrifice that buys nothing. Reversed, the pause has outlived its use." },
  { n: "Death", num: "XIII", sym: "☠", kw: ["endings", "transformation", "release"], up: "A chapter closes so the next can start. Not a literal death: a clearing, a molting, a necessary end.", rv: "Clinging to what is already over. Reversed, the ending is happening either way; the card shows it being resisted." },
  { n: "Temperance", num: "XIV", sym: "⧖", kw: ["balance", "blending", "moderation"], up: "The right amounts, mixed slowly. The card stands for patience and moderation turning opposites into something new.", rv: "Too much of one thing. Reversed, something is out of proportion and more is still being added." },
  { n: "The Devil", num: "XV", sym: "⛧", kw: ["attachment", "temptation", "shadow"], up: "A chain that could be taken off. The card names the habit, craving or bargain that is doing the holding.", rv: "Breaking free. Reversed, the chain is visible now, and looser than it looked." },
  { n: "The Tower", num: "XVI", sym: "⚡", kw: ["upheaval", "revelation", "breakthrough"], up: "Sudden change shakes what was built on a crack. It is loud, and it clears the ground for what is true.", rv: "A collapse being dodged, or a shake-up in slow motion. Reversed, the weak part is still standing, for now." },
  { n: "The Star", num: "XVII", sym: "★", kw: ["hope", "healing", "guidance"], up: "Calm after the storm. Hope, healing and a clear guiding light, with energy flowing back out into the world.", rv: "Lost faith, or hope running thin. Reversed, the star is still there behind the clouds." },
  { n: "The Moon", num: "XVIII", sym: "☽", kw: ["dreams", "illusion", "the unknown"], up: "Things are not quite what they seem. The card stands for instinct, dreams, and careful movement in half-light.", rv: "Confusion lifting, or a fear revealed as a shadow. Reversed, the path is getting clearer." },
  { n: "The Sun", num: "XIX", sym: "☀", kw: ["joy", "success", "vitality"], up: "Warmth, clarity and success. Whatever is growing here is shown in full sun, enjoyed openly.", rv: "Joy dimmed by a cloud, or a little too much shine. Reversed, the light is still there, slightly out of adjustment." },
  { n: "Judgement", num: "XX", sym: "♫", kw: ["awakening", "calling", "reckoning"], up: "A wake-up call. The card shows an honest look back, forgiveness where possible, and a calling being answered.", rv: "The call ignored, or self-judgement turned too harsh. Reversed, the trumpet is sounding and not yet heard." },
  { n: "The World", num: "XXI", sym: "◯", kw: ["completion", "wholeness", "arrival"], up: "A cycle complete. The card shows the finish celebrated and a next, larger circle beginning.", rv: "Nearly there, with a loose end remaining. Reversed, the circle has not quite closed." },
];

export const SUITS = [
  { key: "wands", n: "Wands", sym: "🜂", el: "fire", theme: "drive, creativity and action", col: "#ff8a3d" },
  { key: "cups", n: "Cups", sym: "🜄", el: "water", theme: "feeling, love and intuition", col: "#66b8ff" },
  { key: "swords", n: "Swords", sym: "🜁", el: "air", theme: "thought, truth and conflict", col: "#cfd8ff" },
  { key: "pentacles", n: "Pentacles", sym: "🜃", el: "earth", theme: "work, money, body and home", col: "#7fd67a" },
];
export const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

// [keywords, upright, reversed] per suit, Ace to King.
const MINOR = {
  wands: [
    [["spark", "inspiration", "potential"], "A new spark: an idea, a project, a burst of energy. The card shows it caught and put to something.", "The spark does not catch yet. Delays, or passion with nowhere to go."],
    [["planning", "vision", "first steps"], "The world in one hand and a plan in the other. The card shows the map being drawn before the march.", "Fear of leaving the comfortable castle. Plans that stay on paper."],
    [["expansion", "foresight", "ships coming in"], "Efforts heading out to sea and coming back bigger. The card looks further ahead.", "Obstacles slowing the fleet. Reversed, the route and the crew are in question."],
    [["celebration", "home", "milestone"], "A happy milestone and a sturdy foundation, celebrated with the people who helped build it.", "A wobbly foundation or a celebration put off. Something at home is unsettled."],
    [["competition", "friction", "testing"], "Sparring, rivalry, a crowd of opinions. The card treats friction as sharpening while it stays playful.", "Conflict avoided or turned nasty. Reversed, the shared goal is buried under the noise."],
    [["victory", "recognition", "confidence"], "A public win. The rider comes in proudly, laurels earned.", "Recognition delayed, or ego getting ahead of the work."],
    [["standing ground", "defence", "conviction"], "Holding a position on high ground. The card shows what matters being defended.", "Worn down by defending everything. Reversed, not every hill here is worth it."],
    [["speed", "momentum", "news"], "Things moving fast: messages, travel, quick progress. The card is all momentum.", "Delays, crossed wires, or haste that causes mistakes."],
    [["resilience", "persistence", "last stand"], "Battered but still standing. The card shows the last stretch before getting through.", "Exhausted and defensive. Reversed, help has not been asked for."],
    [["burden", "responsibility", "overload"], "Carrying too much. Success came with weight, and the card asks what could be set down.", "The load dropped, or held past sense. Reversed, the weight has become the issue."],
    [["enthusiasm", "exploration", "free spirit"], "A curious, fiery message or messenger. An idea explored with childlike nerve.", "Big ideas and little follow-through. Reversed, the enthusiasm is spread across too many things."],
    [["adventure", "boldness", "action"], "A charge ahead with passion. Adventure, travel and bold moves are the card's territory.", "Rash or scattered energy. Reversed, the gallop started before the aim."],
    [["confidence", "warmth", "magnetism"], "Confident, warm and magnetic. The card shows someone at ease in the room and lifting others.", "Jealousy or dimmed confidence. Reversed, the card's own light has been forgotten."],
    [["leadership", "vision", "boldness"], "A visionary leader who sets the direction and inspires others to follow.", "Domineering or impulsive leadership: volume in place of vision."],
  ],
  cups: [
    [["new love", "overflow", "compassion"], "An overflowing heart: new love, deep feeling, creative flow, poured freely.", "Emotions bottled up or spilling over. Reversed, the feeling is there but not flowing gently."],
    [["partnership", "connection", "mutual"], "A true meeting of hearts. Partnership, attraction and mutual respect.", "A mismatch or broken trust. Reversed, something has gone unsaid while the two drift."],
    [["friendship", "celebration", "community"], "Glasses raised with friends. Joy shared is joy multiplied.", "Too much party, or a friend group fraying. Reversed, quantity has outrun quality."],
    [["apathy", "contemplation", "missed offer"], "Bored or withdrawn, with a gift being offered and not yet seen.", "Coming out of a sulk. Reversed, the card shows readiness to say yes again."],
    [["loss", "grief", "what remains"], "Grieving the spilled cups. The loss is real, and two cups still stand behind.", "Acceptance and moving on. Reversed, the figure turns and sees what is left."],
    [["nostalgia", "innocence", "kindness"], "Sweet memories or a gift from the past. The card treats simple kindness as healing.", "Stuck in the past. Reversed, memory is taking the place of today."],
    [["choices", "fantasy", "illusion"], "Many dazzling options, not all real. A card of daydreams and of telling the solid cup from the rest.", "Clarity cuts through the fog. Reversed, it is known which cup is real."],
    [["walking away", "seeking more", "letting go"], "Leaving what no longer feeds, to look for something deeper.", "Fear of leaving, or drifting without reason. Reversed, the reason for going is unclear."],
    [["wish fulfilled", "contentment", "satisfaction"], "The wish card. Contentment and the good things hoped for.", "Satisfaction that feels hollow. Reversed, what impresses has been mistaken for what fulfils."],
    [["harmony", "family", "happiness"], "Lasting happiness and harmony at home. Rainbows and loved ones.", "Family tension or a picture-perfect mask. Reversed, the appearance and the reality differ."],
    [["sensitivity", "creative message", "wonder"], "A tender message, a creative nudge, a surprise feeling. The card is openness itself.", "Emotional immaturity or a blocked creative voice. Reversed, the inner child is being treated harshly."],
    [["romance", "charm", "following the heart"], "A romantic offer or invitation. The heart followed with grace.", "Moodiness, or promises that do not land. Reversed, the charm has less substance behind it."],
    [["empathy", "intuition", "care"], "Deep empathy and intuition. Care given from a full, steady heart.", "Overgiving or emotional overwhelm. Reversed, the card shows care without boundaries."],
    [["calm", "wisdom", "emotional balance"], "Calm waters held by a steady hand. Emotional wisdom and diplomacy.", "Feelings suppressed until they leak. Reversed, they have not been named."],
  ],
  swords: [
    [["clarity", "breakthrough", "truth"], "A clean cut of clarity. The truth, or a brilliant idea, arrives.", "Confusion, or a sharp truth used to wound. Reversed, the thought is not yet thought through."],
    [["stalemate", "difficult choice", "avoidance"], "Blindfolded between two choices. The card shows a decision being held off.", "Information overload. Reversed, the decision is making itself."],
    [["heartbreak", "painful truth", "release"], "A painful truth or loss. It hurts, and it also lets the healing begin.", "Recovery. Reversed, the swords are coming out and forgiveness comes slowly."],
    [["rest", "recovery", "pause"], "Rest and recovery. The swords are laid down for a while, and the quiet is needed.", "Restless, or burning out. Reversed, the rest is overdue."],
    [["conflict", "winning at a cost", "pride"], "A win that cost too much. The card asks whether the fight was worth the friendships.", "Making peace after the battle, or walking away from one."],
    [["transition", "moving on", "calmer waters"], "Leaving rough water for calmer shores. The journey itself is the healing.", "Unable to leave yet, or baggage in the boat. Reversed, the load is heavier than the crossing needs."],
    [["strategy", "stealth", "getting away with it"], "Strategy, secrecy, a clever escape. The card sits on the line between clever and dishonest.", "Coming clean, or a plan exposed. Reversed, honesty has become the stronger position."],
    [["restriction", "self-imposed limits", "trapped"], "Feeling trapped, with ropes looser than they seem. The card's prison is partly self-made.", "Freeing oneself. Reversed, a new perspective unties the knots."],
    [["anxiety", "worry", "nightmares"], "Worries at 3 a.m. The fear is bigger in the dark than in daylight.", "The worst passes. Reversed, the fear shrinks once it is spoken."],
    [["rock bottom", "ending", "it's over"], "The very bottom. Dramatic, but done: only up from here. Dawn is in the corner of the card.", "Recovering, slowly. Reversed, the ending is no longer being re-lived."],
    [["curiosity", "new ideas", "vigilance"], "A sharp, curious mind and new ideas. Questions asked, eyes open.", "All talk, or gossip. Reversed, words are getting ahead of thought."],
    [["ambition", "fast action", "drive"], "Charging in with a sharp mind. Fast action on a clear idea.", "Reckless haste, or bulldozing others. Reversed, the sword is swung before it is aimed."],
    [["independence", "honesty", "clear judgement"], "Clear-eyed honesty and independent thought, cutting through nonsense kindly.", "Cold or bitter words. Reversed, truth is being delivered without warmth."],
    [["authority", "intellect", "truth"], "Clear thinking, fair rules, firm decisions. Leadership by logic and ethics.", "Power without compassion. Reversed, the motive behind the rule is in question."],
  ],
  pentacles: [
    [["opportunity", "prosperity", "new venture"], "A real, tangible opportunity in money, work or health: a seed ready for planting.", "An opportunity missed, or poor planning. Reversed, the investment has not been looked at closely."],
    [["juggling", "adaptability", "balance"], "Juggling priorities with flair. The card stands for flexibility and rhythm.", "Too many balls in the air. Reversed, one of them is about to fall."],
    [["teamwork", "craft", "collaboration"], "Skilled teamwork. Craft that is noticed, and built together.", "Poor teamwork, or work going unseen. Reversed, the roles are unclear."],
    [["security", "saving", "holding on"], "Holding tight to what has been built. The card marks the line between security and hoarding.", "A loosened grip, or spending without care. Reversed, the middle has been lost."],
    [["hardship", "worry", "left out in the cold"], "Hard times, or feeling left out in the cold. The card always includes a lit window nearby.", "Recovery from hardship. Reversed, help is being offered."],
    [["generosity", "giving", "receiving"], "Giving and receiving in fair balance. Generosity flowing both ways.", "Strings attached, or one-sided giving. Reversed, the exchange is uneven."],
    [["patience", "long-term view", "investment"], "Patient work before harvest. A pause to check progress, then more tending.", "Impatience, or effort without reward. Reversed, the method is failing rather than the goal."],
    [["mastery", "diligence", "skill"], "Head down, honing a craft. Practice turning into mastery.", "Perfectionism or a dull grind. Reversed, the reason for starting has faded."],
    [["self-reliance", "luxury", "reward"], "Comfort that was earned. A garden grown by one's own hands, enjoyed.", "Overworking for the look of success. Reversed, what is already there goes unenjoyed."],
    [["legacy", "wealth", "family"], "Long-term wealth and legacy: something built to last beyond one life.", "Family or money troubles. Reversed, the foundations are in question."],
    [["study", "ambition", "a new skill"], "A student's eagerness. A skill to learn, and a real opportunity behind it.", "Procrastination or lack of focus. Reversed, the steps are too large or too rare."],
    [["routine", "reliability", "steady progress"], "Slow and steady. Routine and reliability carry this card home.", "Stuck in a rut, or bored by routine. Reversed, the pace is the problem, not the path."],
    [["nurturing", "practical", "home comforts"], "Practical care and a warm home. Body, home and budget looked after.", "Self-neglect, or too much focus on work. Reversed, home and hustle are out of balance."],
    [["abundance", "security", "leadership"], "Material success and generous leadership. A kingdom built.", "Greed or stubbornness. Reversed, wealth is being held rather than shared."],
  ],
};

/** All 78 cards, majors first. Each: { id, n, arcana, suit?, rank?, num, sym, kw, up, rv }. */
export const DECK = [
  ...MAJORS.map((c, i) => ({ id: i, arcana: "major", ...c })),
  ...SUITS.flatMap((s, si) => RANKS.map((rk, ri) => {
    const [kw, up, rv] = MINOR[s.key][ri];
    return { id: 22 + si * 14 + ri, arcana: "minor", suit: s.key, rank: rk, n: `${rk} of ${s.n}`, num: ri < 10 ? String(ri + 1) : { Page: "P", Knight: "Kn", Queen: "Q", King: "K" }[rk], sym: s.sym, kw, up, rv };
  })),
];

export const SPREADS = {
  one: { name: "One card: the heart of it", positions: [["The heart of it", "the core of your question"]] },
  three: { name: "Three cards: past, present, future", positions: [["Past", "what led here"], ["Present", "where you stand"], ["Future", "where this is heading"]] },
  five: { name: "Five cards: the crossroads", positions: [["Now", "the situation"], ["Challenge", "what crosses you"], ["Root", "what's underneath"], ["Counsel", "the stance tradition suggests"], ["Outcome", "where it lands"]] },
  celtic: { name: "Celtic cross (ten cards)", positions: [["Present", "the heart of the matter"], ["Challenge", "what crosses you"], ["Foundation", "the root"], ["Past", "what's passing"], ["Crown", "the best you can reach"], ["Near future", "what's coming"], ["Self", "how you meet it"], ["Others", "people and surroundings"], ["Hopes/fears", "what you want and dread"], ["Outcome", "where it lands"]] },
};
