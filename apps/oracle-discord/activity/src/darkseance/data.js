// The Dark Séance: you play a fake medium of the 1850s-1920s, using the real methods, while investigators bring the
// real controls that caught them. Learning by doing: every method is documented, and so is the control that beat it.
// The House never promises contact with the dead: you are the trick, and the game shows it.

/** What the sitters ask for. */
export const EFFECTS = {
  rap: { e: "👊", name: "Spirit raps", ask: "Is anyone there? Knock once for yes." },
  tilt: { e: "🪑", name: "The table tilts", ask: "Move the table, spirits!" },
  breeze: { e: "🌬️", name: "A cold breeze", ask: "We feel… something. Is the spirit near?" },
  touch: { e: "✋", name: "A spirit touch", ask: "Touch us, so we know you're here." },
  bell: { e: "🔔", name: "The bell rings", ask: "Ring the bell on the table!" },
  trumpet: { e: "📯", name: "The trumpet floats", ask: "Lift the trumpet, spirit!" },
  voice: { e: "🗣️", name: "A spirit voice", ask: "Speak to us through the trumpet." },
  tambourine: { e: "🪘", name: "The tambourine plays", ask: "Play the instruments in the cabinet!" },
  form: { e: "👻", name: "A spirit form appears", ask: "Show yourself, spirit!" },
  apport: { e: "🌸", name: "Flowers from nowhere", ask: "Bring us a gift from the other side." },
  slate: { e: "🪨", name: "Writing on the slate", ask: "Write us a message on the slate." },
};

/** The investigators' controls. Each one beats some methods. */
export const CONTROLS = {
  feet: { e: "🦶", name: "Feet held", what: "A sitter presses on each of your feet" },
  hands: { e: "🤝", name: "Hands held", what: "Your neighbours hold your hands" },
  bands: { e: "💫", name: "Luminous bands", what: "Glowing bands on your wrists and ankles show where they are" },
  light: { e: "🔴", name: "Red light", what: "A dim red lamp stays on" },
  search: { e: "🔎", name: "Searched", what: "You were searched before the séance" },
  seal: { e: "🪢", name: "Sealed knots", what: "Your ties are knotted tight and sealed with wax" },
  gauge: { e: "📏", name: "Faraday's indicator", what: "A gauge between hands and tabletop shows who pushes" },
  torch: { e: "🔦", name: "A flashlight", what: "An investigator may flash a light at any moment" },
};

/** The medium's methods: what each produces, which controls beat it, and who really caught it. */
export const METHODS = [
  { id: "toes", e: "🦶", name: "Crack a toe joint", makes: ["rap"], beaten: ["feet"], caught: "In 1851 three Buffalo doctors held the Fox sisters' feet, and the raps stopped. In 1888 Margaret Fox showed how she made them." },
  { id: "board", e: "🔨", name: "Tap a hidden board", makes: ["rap"], beaten: ["search"], caught: "In 1762 the Cock Lane ghost went quiet once Elizabeth Parsons was searched and watched. She was caught with a small board." },
  { id: "knee", e: "🦵", name: "Lift the table with a knee", makes: ["tilt"], beaten: ["feet", "light"], caught: "Investigators at Cambridge in 1895 saw Eusapia Palladino use her knees and feet to lift the table." },
  { id: "push", e: "🫳", name: "Let the sitters push", makes: ["tilt"], beaten: ["gauge"], caught: "In 1853 Michael Faraday's indicator showed sitters were pushing the table without knowing. Once they could see the gauge, the table stopped." },
  { id: "breath", e: "🌬️", name: "Blow softly", makes: ["breeze"], beaten: ["light"], caught: "On TV in the 1980s, James Randi surrounded James Hydrick's phone book with packing beads that a breath would scatter. The pages never moved." },
  { id: "handsub", e: "✋", name: "Hand substitution", makes: ["touch", "bell", "trumpet"], beaten: ["bands", "light"], caught: "Richard Hodgson caught Palladino freeing a hand this way at Cambridge in 1895: two sitters each felt the same hand." },
  { id: "foot", e: "👣", name: "Reach with a free foot", makes: ["bell", "touch"], beaten: ["feet", "bands"], caught: "In 1924 Houdini, pressed against Margery's ankle, said he felt it move each time her bell box rang." },
  { id: "rod", e: "🪄", name: "A hidden reaching rod", makes: ["trumpet", "bell"], beaten: ["search", "light"], caught: "Mediums floated trumpets on telescopic reaching rods. Former medium M. Lamar Keene described them in The Psychic Mafia (1976)." },
  { id: "whisper", e: "🗣️", name: "Whisper into the trumpet", makes: ["voice"], beaten: ["light"], caught: "The trumpet voice was the medium's own. That is why trumpet séances were held in total darkness, and why a red lamp spoiled them." },
  { id: "slip", e: "🪢", name: "Slip the rope ties", makes: ["tambourine", "bell", "form"], beaten: ["seal"], caught: "In Liverpool in 1865 the Davenports were tied with a knot they could not slip, and the spirits stayed silent." },
  { id: "muslin", e: "🕸️", name: "Step out in muslin", makes: ["form"], beaten: ["search", "torch"], caught: "In 1880 Sir George Sitwell grabbed the 'spirit' at Florence Cook's séance and found Cook in her underclothes." },
  { id: "smuggle", e: "🌸", name: "Bring the gifts in hidden", makes: ["apport"], beaten: ["search"], caught: "In 1910 a Grenoble dealer recognised Charles Bailey's 'apported' birds as ones he had sold him." },
  { id: "slate", e: "🪨", name: "Switch in a pre-written slate", makes: ["slate"], beaten: ["search", "torch"], caught: "In 1876 Ray Lankester snatched Henry Slade's slate before the 'spirit' began writing. The message was already there." },
];
export const methodOf = (id) => METHODS.find((m) => m.id === id);
/** Can this method make this effect under these controls? */
export const works = (mid, effect, controls) => { const m = methodOf(mid); return !!m && m.makes.includes(effect) && !m.beaten.some((c) => controls.includes(c)); };
export const makes = (mid, effect) => !!methodOf(mid)?.makes.includes(effect);

/** Levels: which effects the sitters ask for, which controls they bring, how many rounds. */
export const LEVELS = [
  { n: 1, name: "Raps and a tipping table", what: "A family parlour in 1848: raps, a tilting table, a breeze", mult: 1, rounds: 4, effects: ["rap", "tilt", "breeze"], controls: ["feet", "search", "gauge", "light"], per: 1, fixed: [], torch: 0,
    open: "Hydesville, New York, 1848. The Fox sisters started it with raps. Tonight, the family wants to hear them." },
  { n: 2, name: "The dark circle", what: "1895: hands held in the dark, bells and trumpets", mult: 1.5, rounds: 5, effects: ["touch", "bell", "trumpet", "voice", "rap"], controls: ["feet", "bands", "light", "search"], per: 1, fixed: ["hands"], torch: 0.45,
    open: "Cambridge, 1895. Eusapia Palladino's circle: your neighbours hold your hands, and somebody brought a flashlight." },
  { n: 3, name: "The cabinet séance", what: "A committee ties you in the cabinet: instruments, forms, slates", mult: 2, rounds: 6, effects: ["tambourine", "bell", "form", "apport", "slate", "voice"], controls: ["seal", "search", "torch", "light", "bands"], per: 2, fixed: [], torch: 0.6,
    open: "A committee in the 1860s ties you in a cabinet, as audiences did to the Davenport brothers. They want the spirits to play." },
];
