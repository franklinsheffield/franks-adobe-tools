// The 78-card tarot: 22 Major Arcana and four suits of 14. Card names and the shape of their meanings follow
// long-standing public tradition (Tarot de Marseille, the 1909 Rider-Waite-Smith deck, modern practice);
// every line of text here is original to Science is Magic.
// Each card: n (name), kw (keywords), up (upright), rv (reversed).

export const MAJORS = [
  { n: "The Fool", num: "0", sym: "✶", kw: ["beginnings", "leap", "freedom"], up: "A clean start with no map. Trust the step even though you can't see the ground yet: curiosity is the whole plan.", rv: "A leap without looking, or a fear of leaping at all. Check the cliff edge, then decide." },
  { n: "The Magician", num: "I", sym: "∞", kw: ["skill", "will", "resources"], up: "Everything you need is already on the table. Focus your will and use the tools in front of you: this is a doing card.", rv: "Talent scattered or used to trick. Make sure the plan is honest, including with yourself." },
  { n: "The High Priestess", num: "II", sym: "☾", kw: ["intuition", "mystery", "inner voice"], up: "The answer is quiet and inside. Wait, watch and listen before you act; what you sense is real data.", rv: "Ignoring your gut, or keeping secrets that have started to cost you. Let the hidden thing surface." },
  { n: "The Empress", num: "III", sym: "♀", kw: ["abundance", "nurture", "creation"], up: "Growth, comfort and creative plenty. Tend what you've planted, rest your body, and let it ripen.", rv: "Smothering, or neglecting yourself while caring for everyone else. Refill your own cup." },
  { n: "The Emperor", num: "IV", sym: "♂", kw: ["structure", "authority", "stability"], up: "Build the frame: rules, routines, a clear plan. Steady leadership turns ideas into something that lasts.", rv: "Control turned rigid, or no structure at all. Loosen the grip, or finally set the boundary." },
  { n: "The Hierophant", num: "V", sym: "⚷", kw: ["tradition", "teaching", "belonging"], up: "Learn from those who walked this way before. A teacher, a tradition or a community holds the key.", rv: "Questioning the rulebook. Your own path may need to leave the well-worn one." },
  { n: "The Lovers", num: "VI", sym: "♡", kw: ["choice", "union", "values"], up: "A meaningful bond, or a choice that shows what you truly value. Choose with your whole heart, not half of it.", rv: "Misalignment: between two people, or between what you say and what you do. Bring them back together." },
  { n: "The Chariot", num: "VII", sym: "⛭", kw: ["drive", "victory", "control"], up: "Willpower wins this one. Hold opposing forces steady, aim, and drive forward.", rv: "Pulled in two directions, or pushing too hard. Stop, steer, then go." },
  { n: "Strength", num: "VIII", sym: "∞", kw: ["courage", "patience", "gentle power"], up: "Quiet courage. You tame this with patience and kindness, not force.", rv: "Self-doubt or a temper slipping its leash. Be gentle with the wild part of you." },
  { n: "The Hermit", num: "IX", sym: "✧", kw: ["solitude", "search", "wisdom"], up: "Step back from the noise and carry your own lamp. Time alone will show you what crowds can't.", rv: "Isolation that has gone on too long, or refusing to look inward. Come back to the fire." },
  { n: "Wheel of Fortune", num: "X", sym: "☸", kw: ["cycles", "luck", "turning point"], up: "The wheel turns in your favour. Change is coming; ride it instead of bracing against it.", rv: "A downturn or a stuck cycle. What goes down comes round: find the lesson that lets it turn." },
  { n: "Justice", num: "XI", sym: "⚖", kw: ["truth", "fairness", "consequence"], up: "Cause and effect, clearly weighed. Be honest, sign carefully, and the scales will be fair.", rv: "Something unbalanced or unaccounted for. Own your part and the scales can settle." },
  { n: "The Hanged Man", num: "XII", sym: "⟂", kw: ["pause", "surrender", "new view"], up: "Hang upside down for a while. Waiting and letting go will show you the angle you've been missing.", rv: "Stalling for the sake of it, or a sacrifice that buys nothing. Decide and move." },
  { n: "Death", num: "XIII", sym: "☠", kw: ["endings", "transformation", "release"], up: "A chapter closes so the next can start. Not a literal death: a clearing, a molting, a necessary end.", rv: "Clinging to what is already over. The ending is happening either way; let it go cleanly." },
  { n: "Temperance", num: "XIV", sym: "⧖", kw: ["balance", "blending", "moderation"], up: "Mix the right amounts, slowly. Patience and moderation turn opposites into something new.", rv: "Too much of one thing. Something's out of proportion: rebalance before you add more." },
  { n: "The Devil", num: "XV", sym: "⛧", kw: ["attachment", "temptation", "shadow"], up: "A chain you could take off if you chose. Name the habit, craving or bargain that's holding you.", rv: "Breaking free. You see the chain now, and it's looser than it looked." },
  { n: "The Tower", num: "XVI", sym: "⚡", kw: ["upheaval", "revelation", "breakthrough"], up: "Sudden change shakes what was built on a crack. It's loud, but it clears the ground for truth.", rv: "Dodging a collapse that needs to happen, or a slow-motion shake-up. Let the weak part fall." },
  { n: "The Star", num: "XVII", sym: "★", kw: ["hope", "healing", "guidance"], up: "Calm after the storm. Hope, healing and a clear guiding light: pour yourself back into the world.", rv: "Lost faith, or hope running thin. The star's still there behind the clouds. Rest and look again." },
  { n: "The Moon", num: "XVIII", sym: "☽", kw: ["dreams", "illusion", "the unknown"], up: "Things aren't quite what they seem. Trust instinct, track your dreams, and move carefully in the half-light.", rv: "Confusion lifting, or a fear revealed as a shadow. The path gets clearer." },
  { n: "The Sun", num: "XIX", sym: "☀", kw: ["joy", "success", "vitality"], up: "Warmth, clarity and success. Whatever you're growing is in full sun: enjoy it out loud.", rv: "Joy dimmed by a cloud, or a little too much shine. The light's still yours; adjust and enjoy." },
  { n: "Judgement", num: "XX", sym: "♫", kw: ["awakening", "calling", "reckoning"], up: "A wake-up call. Look back honestly, forgive what you can, and answer the thing that's calling you.", rv: "Ignoring the call, or judging yourself too harshly. Listen, then rise." },
  { n: "The World", num: "XXI", sym: "◯", kw: ["completion", "wholeness", "arrival"], up: "A cycle complete. Celebrate the finish, then step into the next, bigger circle.", rv: "Nearly there, but a loose end remains. Tie it off before you start again." },
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
    [["spark", "inspiration", "potential"], "A new spark: an idea, a project, a burst of energy. Catch it and light something.", "The spark won't catch yet. Delays, or passion with nowhere to go."],
    [["planning", "vision", "first steps"], "You hold the world in one hand and a plan in the other. Map it out before you march.", "Fear of leaving the comfortable castle. Plans that stay on paper."],
    [["expansion", "foresight", "ships coming in"], "Your efforts are heading out to sea and coming back bigger. Look further ahead.", "Obstacles slowing the fleet. Recheck the route and the crew."],
    [["celebration", "home", "milestone"], "A happy milestone and a sturdy foundation. Celebrate with the people who built it with you.", "A wobbly foundation or a celebration put off. Settle what's unsettled at home."],
    [["competition", "friction", "testing"], "Sparring, rivalry, a crowd of opinions. Healthy friction sharpens you; keep it playful.", "Conflict avoided or turned nasty. Find the shared goal under the noise."],
    [["victory", "recognition", "confidence"], "A public win. Ride in proudly: you earned the laurels.", "Recognition delayed, or ego getting ahead of the work. Stay humble and keep riding."],
    [["standing ground", "defence", "conviction"], "Hold your position. You have the high ground; defend what matters.", "Worn down by defending everything. Pick the hill worth it."],
    [["speed", "momentum", "news"], "Things move fast now: messages, travel, quick progress. Go with the rush.", "Delays, crossed wires or haste that causes mistakes. Slow the arrows."],
    [["resilience", "persistence", "last stand"], "Battered but still standing. One more push and you're through.", "Exhausted and defensive. Ask for help before you collapse."],
    [["burden", "responsibility", "overload"], "Carrying too much. Success came with weight; decide what you can set down.", "Dropping the load, or refusing to. Delegate, delete, or rest."],
    [["enthusiasm", "exploration", "free spirit"], "A curious, fiery message or messenger. Explore the idea with childlike nerve.", "Big ideas, no follow-through. Pick one and see it through."],
    [["adventure", "boldness", "action"], "Charge ahead with passion. Adventure, travel and bold moves are favoured.", "Rash or scattered energy. Aim before you gallop."],
    [["confidence", "warmth", "magnetism"], "Confident, warm and magnetic. Own the room and lift others with your fire.", "Jealousy or dimmed confidence. Remember your own light."],
    [["leadership", "vision", "boldness"], "A visionary leader. Set the direction and inspire others to follow.", "Domineering or impulsive leadership. Lead by vision, not volume."],
  ],
  cups: [
    [["new love", "overflow", "compassion"], "An overflowing heart: new love, deep feeling, creative flow. Let it pour.", "Emotions bottled up or spilling over. Let yourself feel it gently."],
    [["partnership", "connection", "mutual"], "A true meeting of hearts. Partnership, attraction and mutual respect.", "A mismatch or broken trust. Talk before you drift."],
    [["friendship", "celebration", "community"], "Raise a glass with friends. Joy shared is joy multiplied.", "Too much party, or a friend group fraying. Pick quality over quantity."],
    [["apathy", "contemplation", "missed offer"], "Bored or withdrawn, you may be missing a gift being offered. Look up.", "Snapping out of a sulk. Ready to say yes again."],
    [["loss", "grief", "what remains"], "Grieving the spilled cups. It's real; and two still stand behind you.", "Acceptance and moving on. You turn round and see what's left."],
    [["nostalgia", "innocence", "kindness"], "Sweet memories or a gift from the past. Simple kindness heals.", "Stuck in the past. Honour it, then live in today."],
    [["choices", "fantasy", "illusion"], "Many dazzling options, not all real. Daydream, then pick the solid one.", "Clarity cuts through the fog. You know which cup is real."],
    [["walking away", "seeking more", "letting go"], "Leaving what no longer feeds you, to look for something deeper.", "Fear of leaving, or drifting without reason. Be sure why you go."],
    [["wish fulfilled", "contentment", "satisfaction"], "The wish card. Contentment and the good things you hoped for.", "Satisfaction that feels hollow. Want what fulfils, not what impresses."],
    [["harmony", "family", "happiness"], "Lasting happiness and harmony at home. Rainbows and the people you love.", "Family tension or a picture-perfect mask. Make it real, not perfect."],
    [["sensitivity", "creative message", "wonder"], "A tender message, a creative nudge, a surprise feeling. Stay open.", "Emotional immaturity or a blocked creative voice. Be kind to your inner kid."],
    [["romance", "charm", "following the heart"], "A romantic offer or invitation. Follow your heart with grace.", "Moodiness or promises that won't land. Check the substance behind the charm."],
    [["empathy", "intuition", "care"], "Deep empathy and intuition. Care for others from a full, steady heart.", "Overgiving or emotional overwhelm. Boundaries are a form of love."],
    [["calm", "wisdom", "emotional balance"], "Calm waters held by a steady hand. Emotional wisdom and diplomacy.", "Feelings suppressed until they leak. Name them, calmly."],
  ],
  swords: [
    [["clarity", "breakthrough", "truth"], "A clean cut of clarity. The truth or a brilliant idea arrives: use it.", "Confusion or a sharp truth used to wound. Think it through."],
    [["stalemate", "difficult choice", "avoidance"], "Blindfolded between two choices. Take the blindfold off and decide.", "Information overload. The decision is making itself; face it."],
    [["heartbreak", "painful truth", "release"], "A painful truth or loss. It hurts; and it also lets the healing begin.", "Recovery. The swords are coming out. Forgive slowly."],
    [["rest", "recovery", "pause"], "Rest and recover. Lie down your swords for a while; you need the quiet.", "Restless, or burning out. Force the rest before your body does."],
    [["conflict", "winning at a cost", "pride"], "A win that cost too much. Ask if the fight was worth the friendships.", "Making peace after the battle, or walking away from one."],
    [["transition", "moving on", "calmer waters"], "Leaving rough water for calmer shores. The journey itself is healing.", "Can't leave yet, or baggage in the boat. Lighten the load."],
    [["strategy", "stealth", "getting away with it"], "Strategy, secrecy, a clever escape. Make sure your cleverness stays honest.", "Coming clean, or a plan exposed. Honesty is the better tactic now."],
    [["restriction", "self-imposed limits", "trapped"], "Feeling trapped, but the ropes are looser than you think. Take one step out.", "Freeing yourself. New perspective unties the knots."],
    [["anxiety", "worry", "nightmares"], "3 a.m. worries. The fear is bigger in the dark than in daylight.", "The worst passes. Talk about it and it shrinks."],
    [["rock bottom", "ending", "it's over"], "The very bottom. Dramatic, but done: only up from here. Dawn is in the corner.", "Recovering, slowly. Refuse to re-live the ending."],
    [["curiosity", "new ideas", "vigilance"], "A sharp, curious mind and new ideas. Ask questions, stay alert.", "All talk, or gossip. Think before you send."],
    [["ambition", "fast action", "drive"], "Charging in with a sharp mind. Act fast on a clear idea.", "Reckless haste or bulldozing others. Aim the sword first."],
    [["independence", "honesty", "clear judgement"], "Clear-eyed honesty and independent thought. Cut through nonsense kindly.", "Cold or bitter words. Truth works better with warmth."],
    [["authority", "intellect", "truth"], "Clear thinking, fair rules, firm decisions. Lead with logic and ethics.", "Power without compassion. Check the motive behind the rule."],
  ],
  pentacles: [
    [["opportunity", "prosperity", "new venture"], "A real, tangible opportunity: money, work or health. Plant the seed.", "An opportunity missed or poor planning. Look again before you invest."],
    [["juggling", "adaptability", "balance"], "Juggling priorities with flair. Stay flexible and keep the rhythm.", "Too many balls in the air. Drop one on purpose."],
    [["teamwork", "craft", "collaboration"], "Skilled teamwork. Your craft is noticed; build it together.", "Poor teamwork or work going unseen. Clarify roles."],
    [["security", "saving", "holding on"], "Holding tight to what you've built. Security is good; hoarding isn't.", "Loosening your grip, or spending without care. Find the middle."],
    [["hardship", "worry", "left out in the cold"], "Hard times or feeling left out. Help is closer than you think: look at the lit window.", "Recovery from hardship. Accept the help offered."],
    [["generosity", "giving", "receiving"], "Give and receive in fair balance. Generosity flows both ways.", "Strings attached or one-sided giving. Rebalance the exchange."],
    [["patience", "long-term view", "investment"], "Patient work before harvest. Check progress, then keep tending.", "Impatience or effort without reward. Change the method, not the goal."],
    [["mastery", "diligence", "skill"], "Head down, honing your craft. Practice turns into mastery.", "Perfectionism or a dull grind. Remember why you started."],
    [["self-reliance", "luxury", "reward"], "You've earned your comfort. Enjoy the garden you grew yourself.", "Overworking for the look of success. Rest in what you have."],
    [["legacy", "wealth", "family"], "Long-term wealth and legacy. Build something that lasts beyond you.", "Family or money troubles. Sort the foundations."],
    [["study", "ambition", "a new skill"], "A student's eagerness. Learn the skill; the opportunity is real.", "Procrastination or lack of focus. Small steps, every day."],
    [["routine", "reliability", "steady progress"], "Slow and steady wins. Routine and reliability carry you home.", "Stuck in a rut, or bored by routine. Change the pace, not the path."],
    [["nurturing", "practical", "home comforts"], "Practical care and a warm home. Look after body, home and budget.", "Neglecting self or over-focusing on work. Balance home and hustle."],
    [["abundance", "security", "leadership"], "Material success and generous leadership. You've built a kingdom.", "Greed or stubbornness. Wealth means more when it's shared."],
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
  five: { name: "Five cards: the crossroads", positions: [["Now", "the situation"], ["Challenge", "what crosses you"], ["Root", "what's underneath"], ["Advice", "what to do"], ["Outcome", "where it lands"]] },
  celtic: { name: "Celtic cross (ten cards)", positions: [["Present", "the heart of the matter"], ["Challenge", "what crosses you"], ["Foundation", "the root"], ["Past", "what's passing"], ["Crown", "the best you can reach"], ["Near future", "what's coming"], ["Self", "how you meet it"], ["Others", "people and surroundings"], ["Hopes/fears", "what you want and dread"], ["Outcome", "where it lands"]] },
};
