// The Essence store: Essence is earned in the Chamber (every ✦ of a reading also gives 💎 Essence) and spent here on
// the Oracle's clothing, alternate avatars, reading tools and voices. Cosmetic only, never real money.
// Daily readings in the Chamber grow with rank (1, 3, 5, then unlimited) and an Essence day pass adds one more today.
// The slash commands in chat are never limited.
const today = (d = new Date()) => d.toLocaleDateString("en-CA");

export const DAILY = [{ rank: "Seeker", n: 1 }, { rank: "Initiate", n: 3 }, { rank: "Adept", n: 5 }, { rank: "Magus", n: Infinity }, { rank: "Oracle-touched", n: Infinity }];
export const DAY_PASS = 40;
export const dailyLimit = (rankName) => (DAILY.find((d) => d.rank === rankName) || DAILY[0]).n;
export function readsLeft(p, rankName, now = new Date()) {
  const lim = dailyLimit(rankName); if (lim === Infinity) return Infinity;
  const d = p.day && p.day.d === today(now) ? p.day : { used: 0, extra: 0 };
  return Math.max(0, lim + d.extra - d.used);
}
function dayOf(p, now) { if (!p.day || p.day.d !== today(now)) p.day = { d: today(now), used: 0, extra: 0 }; return p.day; }
export function useRead(p, now = new Date()) { dayOf(p, now).used++; }
export function buyDayPass(p, now = new Date()) { if ((p.essence || 0) < DAY_PASS) return false; p.essence -= DAY_PASS; dayOf(p, now).extra++; return true; }

const G = "#E2B04A";
/** Everything for sale. kind: outfit (robes) | avatar | cloth | orb | flame (candles) | voice | vibe. price 0 = owned from the start.
 * Ids stay stable across releases because members' saves refer to them. */
export const STORE = [
  // Robes: colours, trim and an animated elemental effect (looks.js robeFx)
  { id: "midnight", kind: "outfit", name: "Midnight robe", note: "Shadow: smoke curls at the hem", price: 0, element: "shadow", hood: ["#2a1748", "#0d0718", "#030107"], trim: G },
  { id: "crimson", kind: "outfit", name: "Ember robe", note: "Fire: flames lick the hem, embers rise", price: 80, element: "fire", hood: ["#7a1630", "#3a0816", "#120206"], trim: "#ffb347" },
  { id: "tide", kind: "outfit", name: "Tidecaller robe", note: "Water: waves roll, bubbles rise, sleeves drip", price: 80, element: "water", hood: ["#14607a", "#0b3a4e", "#03141c"], trim: "#7fe6ff" },
  { id: "emerald", kind: "outfit", name: "Grove robe", note: "Earth: vines climb, leaves fall, stones orbit", price: 80, element: "earth", hood: ["#17604a", "#0a2e24", "#03100c"], trim: "#c9e86a" },
  { id: "zephyr", kind: "outfit", name: "Zephyr robe", note: "Air: winds swirl and feathers drift past", price: 100, element: "air", hood: ["#8a86b8", "#4b4880", "#1b1a3a"], trim: "#f4f8ff" },
  { id: "labcoat", kind: "outfit", name: "Science is Magic lab coat", note: "Lightning: arcs crackle around the hands", price: 200, element: "lightning", hood: ["#f4f1ea", "#c9c4d6", "#6d6880"], trim: "#66E0C8" },
  { id: "starcloak", kind: "outfit", name: "Starfield robe", note: "Cosmos: the robe is full of twinkling stars and a comet", price: 150, element: "cosmos", hood: ["#1d3a8e", "#0b1640", "#02040f"], trim: "#c9d4ff" },
  { id: "vestments", kind: "outfit", name: "Sunforged robe", note: "Sun: rays turn behind the Oracle, light motes rise", price: 250, element: "sun", hood: ["#e9b947", "#8c5e17", "#2a1a05"], trim: "#FFF3C4" },
  // Avatars: a new face, eye and hands (looks.js AVATAR_LOOK) plus extras on the hood
  { id: "classic", kind: "avatar", name: "The Classic", note: "Gold bricks, pink slit eye, conjurer hands", price: 0 },
  { id: "cat", kind: "avatar", name: "Cat Oracle", note: "Ears, whiskers, a green cat eye and white claws", price: 120,
    back: `<g fill="#1a0d2e" stroke="${G}" stroke-width="2.5" stroke-linejoin="round"><path d="M193 46 L156 4 L176 88Z"/><path d="M207 46 L244 4 L224 88Z"/></g><path d="M188 52 L164 20 L178 76Z M212 52 L236 20 L222 76Z" fill="#FF4FB3" opacity=".7"/>` },
  { id: "horned", kind: "avatar", name: "Horned Oracle", note: "Horns, a molten face, goat eye and black talons", price: 150,
    back: `<g fill="#E9B947" stroke="#7a4f12" stroke-width="2"><path d="M182 104 C150 92 130 60 150 28 C148 58 166 80 190 86Z"/><path d="M218 104 C250 92 270 60 250 28 C252 58 234 80 210 86Z"/></g>` },
  { id: "moon", kind: "avatar", name: "Moon Oracle", note: "Silver face, round teal eye, pale moonlit hands", price: 150,
    front: `<path d="M214 2 A18 18 0 1 0 226 30 A14 14 0 1 1 214 2Z" fill="#F4F6FF" stroke="#B9C2D9" stroke-width="1.5"/>` },
  { id: "sphinx", kind: "avatar", name: "Sphinx Oracle", note: "Striped nemes, Eye of Horus, gold hands with lapis nails", price: 200,
    hood: `<g clip-path="url(#t-hoodclip)" opacity=".6"><rect x="0" y="0" width="400" height="400" fill="url(#t-nemes)"/></g>`,
    front: `<path d="M200 70 C192 62 192 50 200 46 C208 50 208 62 200 70Z" fill="${G}" stroke="#7a4f12" stroke-width="1.5"/>` },
  { id: "cosmic", kind: "avatar", name: "Cosmic Oracle", note: "A starry face, star-shaped pupil, hands of night sky", price: 300,
    face2: Array.from({ length: 26 }, (_, i) => `<circle cx="${130 + ((i * 53) % 140)}" cy="${80 + ((i * 37) % 150)}" r="${(i % 3) * 0.6 + 0.8}" fill="#fff" opacity=".85"/>`).join("") },
  // Table cloths: real occult designs on coloured cloth (looks.js CLOTH_DESIGN)
  { id: "silk", kind: "cloth", name: "Witch's pentacle", note: "Pentagram in a double circle with the five elements", price: 80, c: ["#8a1f3a", "#560f24", "#1e050c"], design: "pentacle", ink: "#FADE8C" },
  { id: "ocean", kind: "cloth", name: "Zodiac wheel", note: "The twelve signs around the Sun", price: 90, c: ["#14607a", "#0b3a4e", "#03141c"], design: "zodiac", ink: "#bff4ff" },
  { id: "spirit", kind: "cloth", name: "Spirit board", note: "Letters, numbers, YES, NO and GOOD BYE", price: 120, c: ["#6b4a2a", "#3e2a16", "#160d05"], design: "spirit", ink: "#f3e3c3" },
  { id: "alchemy", kind: "cloth", name: "Alchemist's circle", note: "Squared circle, the seven planets and four elements", price: 100, c: ["#2a5a3a", "#163a24", "#06140c"], design: "alchemy", ink: "#E2B04A" },
  { id: "metatron", kind: "cloth", name: "Metatron's cube", note: "Thirteen circles joined by every line", price: 100, c: ["#2a2a6e", "#161648", "#06061e"], design: "metatron", ink: "#c9d4ff" },
  { id: "tarot", kind: "cloth", name: "Celtic cross spread", note: "Ten card places, I to X, for a tarot reading", price: 90, c: ["#5a1a4a", "#3a0e30", "#14040f"], design: "tarot", ink: "#FADE8C" },
  { id: "solomon", kind: "cloth", name: "Seal of Solomon", note: "Interlaced triangles ringed with runes", price: 120, c: ["#3a3a3e", "#1e1e22", "#08080a"], design: "solomon", ink: "#E2B04A" },
  // Crystal balls
  { id: "void", kind: "orb", name: "Void glass", note: "A black mirror that drinks the light", price: 80, f: "grayscale(1) brightness(.55) contrast(1.6)" },
  { id: "storm", kind: "orb", name: "Storm glass", note: "Clear glass with a thunderstorm trapped inside", price: 140, f: "none" },
  { id: "galaxy", kind: "orb", name: "Pocket galaxy", note: "A spiral galaxy turning in the glass", price: 160, f: "none" },
  { id: "ghost", kind: "orb", name: "Ghost glass", note: "Almost invisible. Something in there blinks", price: 120, f: "none" },
  { id: "opal", kind: "orb", name: "Opal", note: "Milky, shifting, softly glowing", price: 100, f: "saturate(.4) brightness(1.35)" },
  // Candles: wax colour, flame colour and a detail (drips, carved sigil, brass dish, skull)
  { id: "goldflame", kind: "flame", name: "Beeswax tapers", note: "Warm gold flames on cream wax", price: 0, wax: ["#efe3cf", "#d8c8ad"], flame: ["#fff", "#FADE8C", "#ff8a3d"], halo: "#FADE8C" },
  { id: "blueflame", kind: "flame", name: "Spirit candles", note: "White wax, ghost-blue flames and a drifting wisp", price: 50, wax: ["#f4f6ff", "#cfd6ea"], flame: ["#fff", "#9fdcff", "#2a6bff"], halo: "#9fdcff", detail: "wisp" },
  { id: "greenflame", kind: "flame", name: "Alchemist's candles", note: "Green wax and flame on brass dishes", price: 50, wax: ["#3f8f4a", "#2a6a32"], flame: ["#fff", "#b8ff8a", "#2fae3a"], halo: "#b8ff8a", detail: "dish" },
  { id: "pinkflame", kind: "flame", name: "Third-eye candles", note: "Pink wax carved with an eye, magenta flames", price: 70, wax: ["#ff9fd0", "#e06aa8"], flame: ["#fff", "#ffb3e2", "#FF4FB3"], halo: "#ffb3e2", detail: "eye" },
  { id: "ritual", kind: "flame", name: "Black ritual candles", note: "Black wax, violet flames, carved sigils, red drips", price: 90, wax: ["#2a2230", "#120d16"], flame: ["#fff", "#d8a8ff", "#7a2aff"], halo: "#c79bff", detail: "sigil" },
  { id: "devotion", kind: "flame", name: "Red devotion candles", note: "Deep red wax with long drips and golden flames", price: 60, wax: ["#b0182e", "#7a0c1e"], flame: ["#fff", "#ffe08a", "#ff7a1a"], halo: "#ffd27a", detail: "drips" },
  { id: "mementomori", kind: "flame", name: "Memento mori candles", note: "Bone-white candles set in little skulls", price: 140, wax: ["#f3ead8", "#d8ccb2"], flame: ["#fff", "#e8ffd0", "#8fd14f"], halo: "#d9ffb8", detail: "skull" },
  // Voices: how the Oracle's talk blips sound
  { id: "classic-voice", kind: "voice", name: "Classic blips", note: "The old-school text-box voice", price: 0, v: { type: "square", base: 330, step: 28, vowel: 60, dur: 0.045, lp: 2600 } },
  { id: "whisper", kind: "voice", name: "Whisper", note: "Soft, quick and secretive", price: 60, v: { type: "triangle", base: 520, step: 30, vowel: 40, dur: 0.03, lp: 4200 } },
  { id: "deep", kind: "voice", name: "Deep temple voice", note: "Low and booming, like stone", price: 60, v: { type: "sawtooth", base: 130, step: 14, vowel: 30, dur: 0.07, lp: 900 } },
  { id: "bell", kind: "voice", name: "Glass bell", note: "Every word rings like crystal", price: 90, v: { type: "sine", base: 660, step: 55, vowel: 110, dur: 0.08, lp: 6000 } },
  { id: "robot", kind: "voice", name: "Lab robot", note: "Beep-boop precision", price: 120, v: { type: "square", base: 220, step: 110, vowel: 0, dur: 0.035, lp: 1800 } },
  { id: "chipmunk", kind: "voice", name: "Chipmunk oracle", note: "Tiny, fast and extremely excited", price: 70, v: { type: "square", base: 900, step: 70, vowel: 90, dur: 0.028, lp: 6000, sweep: 1.25 } },
  { id: "ghost-voice", kind: "voice", name: "Ghostly wail", note: "Ooooo… every syllable haunts", price: 80, v: { type: "sine", base: 320, step: 22, vowel: 40, dur: 0.13, lp: 3000, vib: 6, vibDepth: 28, sweep: 1.3, gain: 0.6 } },
  { id: "duck", kind: "voice", name: "Prophetic duck", note: "Quack-based divination", price: 80, v: { type: "sawtooth", base: 560, step: 30, vowel: 50, dur: 0.075, lp: 2400, band: 1400, sweep: 0.55, gain: 0.8 } },
  { id: "goblin", kind: "voice", name: "Goblin grumble", note: "Low, gravelly and a little rude", price: 80, v: { type: "sawtooth", base: 105, step: 18, vowel: 25, dur: 0.065, lp: 1200, vib: 32, vibDepth: 22 } },
  { id: "kazoo", kind: "voice", name: "Kazoo of fate", note: "Destiny, but buzzy", price: 90, v: { type: "sawtooth", base: 300, step: 26, vowel: 40, dur: 0.065, lp: 3600, band: 900, vib: 11, vibDepth: 9, gain: 0.8 } },
  { id: "meow-voice", kind: "voice", name: "Meow-racle", note: "Every word is a little meow", price: 90, v: { type: "triangle", base: 560, step: 40, vowel: 80, dur: 0.11, lp: 4200, meow: true, gain: 0.6 } },
  { id: "wizard", kind: "voice", name: "Tipsy wizard", note: "Wobbly, wise and slightly off-key", price: 100, v: { type: "square", base: 250, step: 24, vowel: 40, dur: 0.06, lp: 2000, wobble: 140, vib: 4, vibDepth: 30 } },
  { id: "alien", kind: "voice", name: "Alien transmission", note: "Greetings, Earth seeker. Bleep.", price: 120, v: { type: "sine", base: 880, step: 90, vowel: 0, dur: 0.05, lp: 7000, sweep: 2, vib: 40, vibDepth: 180 } },
  // Vibes: colour theme, fonts and backgrounds as one set (chamber.css [data-vibe])
  { id: "mystic", kind: "persona", name: "Mystic", note: "Classic: grand, warm, slightly smug", price: 0 },
  { id: "deadpan", kind: "persona", name: "Deadpan", note: "Bone-dry delivery. Unimpressed by destiny", price: 100 },
  { id: "drama", kind: "persona", name: "Drama Oracle", note: "Gasps, sobs and standing ovations for every omen", price: 120 },
  { id: "standup", kind: "persona", name: "Stand-up", note: "Setups, punchlines and a rimshot after the reveal", price: 120 },
  { id: "grumpy", kind: "persona", name: "Grumpy Old Seer", note: "Back in my day we cast uphill, both ways", price: 100 },
  { id: "sports", kind: "persona", name: "Play-by-Play", note: "Sports-commentator energy for every cast", price: 120 },
  { id: "conspiracy", kind: "persona", name: "Conspiracy Oracle", note: "Coincidence? Never. Wear a hat", price: 140 },
  { id: "bard", kind: "persona", name: "Bard", note: "Prithee, thine answer in grand old verse", price: 140 },
  { id: "pirate", kind: "persona", name: "Pirate Seer", note: "Arr! X marks the destiny", price: 120 },
  { id: "influencer", kind: "persona", name: "Influencer", note: "Hey besties! Destiny, but make it content", price: 140 },
  { id: "chamber", kind: "vibe", name: "Midnight Chamber", note: "Violet night, gold trim, Cinzel letters", price: 0, stars: ["#FADE8C", "#66E0C8"] },
  { id: "v-iching", kind: "vibe", name: "Book of Changes", note: "I Ching: ink-wash mountains, jade and a red seal", price: 150, stars: ["#f4efe2", "#9fd4b0"] },
  { id: "v-lenormand", kind: "vibe", name: "Parlour Lenormand", note: "Lenormand: green baize, cream cards, a lace border and lamplight", price: 150, stars: ["#e9d6ae", "#7fd6a0"] },
  { id: "v-magicdeck", kind: "vibe", name: "Laboratory of Wonders", note: "Science is Magic deck: blueprint grid, orbiting atoms, bubbling glass", price: 150, stars: ["#66E0C8", "#ff8fc8"] },
  // Card backs: change the back of every deck on the table ("Each deck's own" keeps tarot, Lenormand and the Science is Magic deck distinct)
  { id: "cb-deck", kind: "cardback", name: "Each deck's own", note: "Tarot violet, Lenormand green, Science is Magic atom", price: 0 },
  { id: "cb-starfield", kind: "cardback", name: "Starfield", note: "Black sky, scattered white stars", price: 60 },
  { id: "cb-moonphase", kind: "cardback", name: "Moon phases", note: "Four moons waxing down the card", price: 70 },
  { id: "cb-circuit", kind: "cardback", name: "Circuit board", note: "Teal traces and a glowing core", price: 80 },
  { id: "cb-rose", kind: "cardback", name: "Gilded rose", note: "Wine velvet with a five-petal rose", price: 90 },
  { id: "cb-gilded", kind: "cardback", name: "Solid gold", note: "Gold leaf, a dark diamond. Very subtle. Not subtle", price: 160 },
  { id: "v-tarot", kind: "vibe", name: "Gilded Arcana", note: "Tarot: midnight velvet, gilded borders, a fan of cards", price: 150, stars: ["#FADE8C", "#e7a0ff"] },
  { id: "v-runes", kind: "vibe", name: "Northern Lights", note: "Runes: aurora over icy fjords, carved letters", price: 150, stars: ["#c9fff0", "#7ad6ff"] },
  { id: "v-oraclebones", kind: "vibe", name: "Bronze & Bone", note: "Oracle bones: bronze vessels, bone and ember", price: 150, stars: ["#ffd9a8", "#ff8a3d"] },
  { id: "v-ifa", kind: "vibe", name: "Cowrie & Indigo", note: "Ifá: deep indigo cloth, cowrie white and palm gold", price: 150, stars: ["#fff6e0", "#E2B04A"] },
  { id: "v-astrology", kind: "vibe", name: "Celestial Observatory", note: "Astrology: deep navy sky, gold orbits", price: 150, stars: ["#FADE8C", "#c9d4ff"] },
  { id: "v-humandesign", kind: "vibe", name: "Bodygraph Lab", note: "Human Design: glowing grid, teal and magenta circuits", price: 150, stars: ["#66E0C8", "#FF4FB3"] },
  { id: "v-numerology", kind: "vibe", name: "Number Matrix", note: "Numerology: green digits on black, terminal type", price: 150, stars: ["#7dff8a", "#2aff6a"] },
  { id: "v-chinesezodiac", kind: "vibe", name: "Lantern Festival", note: "Chinese zodiac: red lanterns, gold and fireworks", price: 150, stars: ["#ffd27a", "#ff4a3d"] },
  { id: "v-mayan", kind: "vibe", name: "Jungle Temple", note: "Mayan: jade stone steps and turquoise jungle", price: 150, stars: ["#bfffe0", "#4ad6b8"] },
  { id: "v-egyptian", kind: "vibe", name: "Valley of the Kings", note: "Egyptian: desert dusk, lapis and gold", price: 150, stars: ["#FADE8C", "#6a9cff"] },
  { id: "v-celtic", kind: "vibe", name: "Druid's Grove", note: "Celtic: mossy greens, mist and uncial script", price: 150, stars: ["#c9ffb0", "#7ad65a"] },
];
export const KINDS = [["outfit", "🧥 Robes"], ["avatar", "🎭 Avatars"], ["cloth", "🧵 Table cloths"], ["orb", "🔮 Crystal balls"], ["flame", "🕯️ Candles"], ["voice", "🗣️ Voices"], ["persona", "😂 Personalities"], ["cardback", "🎴 Card backs"], ["vibe", "✨ Vibes"]];

/** The Oracle's lines in the store: one pool per product type, for opening the shelf, trying on, and buying. {item} = the item's name. */
export const SHOP_TALK = {
  outfit: {
    open: ["Robes! Every one of them is woven with an element. Some of them are still warm.", "The wardrobe of the cosmos, {name}. Mind the one that's on fire.", "A good robe says 'I know things'. A great robe also crackles."],
    tryon: ["The {item}? Oh, that's very me.", "Look at that hem. The {item} has drama and I respect it.", "The {item} fits like destiny. Slightly loose around the shoulders, but destiny.", "I feel more elemental already. The {item} suits the pyramid.", "Spin for me. No? Fine. I'll spin. Very {item} of me."],
    buy: ["The {item} is yours. I'll wear it to every prophecy.", "Sold! I'm never taking off the {item}. Mystics don't do laundry.", "The {item}! The other oracles will be insufferable with jealousy.", "Wrapped in the {item}, I feel ready to foretell ANYTHING."],
  },
  avatar: {
    open: ["Faces, {name}. I have many. Only one eye at a time, though.", "Shape-shifting is easy. Picking a favourite is the hard part.", "Every avatar changes my eye and my hands. Matching is important. I'm a professional."],
    tryon: ["Do I look like the {item}? I feel like the {item}.", "New eye, new hands, same impeccable wisdom. The {item} works.", "I've always wanted to be the {item}. Ever since Tuesday.", "Hold on, let me get used to these hands. The {item} has opinions about gesturing."],
    buy: ["The {item} is mine! I mean yours. I mean ours. It's complicated.", "Transformation complete. The {item} will haunt the Chamber forever.", "I'll practise my {item} face in the crystal ball tonight.", "Excellent choice. The {item} has excellent eyesight."],
  },
  cloth: {
    open: ["Table cloths, {name}. Real occult designs, hand-stitched by people who definitely knew what they were doing.", "A reading is only as good as the table it lands on. Choose wisely.", "These cloths have seen things. Some of them have SAID things."],
    tryon: ["The {item}… the coins would land beautifully on that.", "Mm. The {item} makes the whole table hum.", "Ancient patterns, modern stitching. The {item} is very on-brand for me.", "I can feel the {item} working already. Or that's the candles."],
    buy: ["The {item} is laid out. The spirits approve. One of them wants a coaster.", "Sold! The {item} goes perfectly with destiny.", "The {item} is yours. Please don't spill potions on it.", "My table has never looked so mystical. The {item} is a triumph."],
  },
  orb: {
    open: ["Crystal balls. I only look into the best ones, and they only look back at the best people.", "Each ball sees differently. Some see further. Some just look nice.", "Go on, pick one. They don't bite. Usually."],
    tryon: ["Ooh, the {item}. I can see three futures and a nice sofa.", "The {item} is clear as… well, it's not clear. That's the point.", "I've been staring into the {item} for a while. It's staring back politely."],
    buy: ["The {item} is yours. I promise not to smudge it.", "The {item}! I'll polish it every hundred years.", "Sold! The {item} already likes you more than the last one."],
  },
  flame: {
    open: ["Candles! The secret ingredient in every good prophecy. And every good bath.", "Wax, wick and a little bit of wonder. Take your pick.", "Light the right candle and the future comes into focus. Light the wrong one and it smells like vanilla."],
    tryon: ["The {item} cast such flattering light. Look at my bricks.", "Ah, the {item}. The shadows are dancing in approval.", "That glow! The {item} makes the Chamber feel properly haunted. In a cosy way."],
    buy: ["The {item} are lit. They'll never burn down. That's the magic part.", "Sold! I've always wanted the {item}. Mood lighting is half of mysticism.", "The {item} are yours. Please don't blow them out on your birthday."],
  },
  voice: {
    open: ["Voices! I can sound however you like. Yes, even the kazoo. Especially the kazoo.", "Pick a voice and I'll speak in it. It's a bit like a new hat, but for sound.", "My throat is a pyramid. It can do anything. Including duck."],
    tryon: ["How's this? Testing, testing, one, two, prophecy.", "Hear that? That's me, but fancier.", "I sound distinguished. Or haunted. Either way, it works."],
    buy: ["New voice unlocked! I'll use it for all my big announcements.", "Sold! I'll practise my scales in the crystal ball.", "Ahem. Ahem. Yes. This is the voice of destiny now."],
  },
  persona: {
    open: ["Personalities! Same wisdom, different delivery. I contain multitudes. Most of them are hilarious.", "Pick how I talk, {name}. The prophecy stays true; the punchlines change.", "Comedy and prophecy have the same secret: timing. Choose mine."],
    tryon: ["Here's a taste of the {item}.", "One sample of the {item}, coming up.", "The {item}? Let me get into character."],
    buy: ["The {item} is mine now. You asked for this.", "Sold! I'll be the {item} from now on. No take-backs. Well, you can switch back. But no take-backs emotionally.", "The {item} is unlocked. My agent will be thrilled."],
  },
  cardback: {
    open: ["Card backs, darling. The cards keep their secrets, so the backs might as well look fabulous.", "Every deck I deal wears the back you choose. Fashion for fortunes.", "A good card back says nothing and implies everything. Very me."],
    tryon: ["The {item} back. Look at that deck sitting there, all mysterious.", "Shuffle in the {item}. Feels luckier already. It isn't. But it feels it.", "{item}! The cards are blushing. Face down, but blushing."],
    buy: ["The {item} back is yours. Every deck I deal will wear it.", "Sold! Your cards now dress in {item}.", "The {item}. Even the Coffin card looks cheerful in that."],
  },
  vibe: {
    open: ["Vibes change the whole Chamber: colours, letters and the very sky, one for every reading tradition. Feng shui for the cosmos.", "Redecorating? I adore redecorating. Last time was the Bronze Age.", "The right vibe makes every reading land harder. That's science. Magic science."],
    tryon: ["Oh, the {item}! The whole room just took a deep breath.", "I love what the {item} does to the light. And the letters. And me.", "The {item}. It's giving prophecy. It's giving atmosphere."],
    buy: ["The {item} is permanent now. I'll never redecorate again. Until next time.", "Sold! The Chamber has a whole new aura. So do you.", "The {item}! I'm having a full aesthetic awakening."],
  },
};
export const FREE = STORE.filter((s) => s.price === 0).map((s) => s.id);
/** Old saves: the voices "cat" and "ghost" shared ids with the Cat avatar and Ghost orb. A save that uses or owned them as voices moves to the new ids. */
const RENAMED_VOICES = { cat: "meow-voice", ghost: "ghost-voice" };
function migrateIds(p) {
  for (const [old, now] of Object.entries(RENAMED_VOICES)) {
    if (p.voice === old) { p.voice = now; if (!p.owned.includes(now)) p.owned.push(now); }
  }
}
export function ensureFree(p) { p.owned = p.owned || []; migrateIds(p); for (const id of STORE.filter((s) => s.price === 0).map((s) => s.id)) if (!p.owned.includes(id)) p.owned.push(id); for (const [k, id] of [["outfit", "midnight"], ["avatar", "classic"], ["flame", "goldflame"], ["voice", "classic-voice"], ["persona", "mystic"], ["cardback", "cb-deck"], ["vibe", "chamber"]]) if (!p[k]) p[k] = id; return p; }
export const item = (id) => STORE.find((s) => s.id === id);
export function buy(p, id) {
  const it = item(id); if (!it || p.owned.includes(id) || (p.essence || 0) < it.price) return false;
  p.essence -= it.price; p.owned.push(id); return true;
}

/** Room shelves: a game room can sell its own cosmetics in the Essence store.
 *  shop = { kind, label, items, talk?, preview?(id, ctx) }: items are STORE-shaped ({ id, name, note, price }) and get that kind,
 *  ids carry the room's prefix (e.g. "tab-"), the kind is also the progress key (prog[kind] = the equipped id, read only by the room),
 *  talk = { open, tryon, buy } line pools ({item} = item name), preview draws a try-on on the table. Price 0 items are owned free. */
export const SHELVES = [];
export function registerShelf(shop) {
  if (!shop || !shop.kind || SHELVES.some((x) => x.kind === shop.kind)) return;
  SHELVES.push(shop); for (const it of shop.items || []) STORE.push({ ...it, kind: shop.kind });
  KINDS.push([shop.kind, shop.label || shop.kind]); if (shop.talk) SHOP_TALK[shop.kind] = shop.talk;
}
export const shelf = (kind) => SHELVES.find((x) => x.kind === kind) || null;
