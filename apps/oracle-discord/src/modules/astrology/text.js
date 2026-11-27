// Science is Magic interpretation library (original text). Voice: the sky as an experiment,
// the reading as a hypothesis the member tests on themselves. Layers: planet (drive) x sign (style) x house (arena).

export const SIGN = {
  Aries: { el: "fire", mode: "cardinal", style: "fast, direct and first through the door", verb: "ignites" },
  Taurus: { el: "earth", mode: "fixed", style: "steady, sensual and built to last", verb: "grounds" },
  Gemini: { el: "air", mode: "mutable", style: "curious, quick and many-tabbed", verb: "connects" },
  Cancer: { el: "water", mode: "cardinal", style: "protective, tidal and loyal to its own", verb: "shelters" },
  Leo: { el: "fire", mode: "fixed", style: "warm, theatrical and generous with light", verb: "radiates" },
  Virgo: { el: "earth", mode: "mutable", style: "precise, useful and quietly devoted", verb: "refines" },
  Libra: { el: "air", mode: "cardinal", style: "graceful, fair-minded and partner-tuned", verb: "balances" },
  Scorpio: { el: "water", mode: "fixed", style: "intense, private and transformative", verb: "distils" },
  Sagittarius: { el: "fire", mode: "mutable", style: "expansive, frank and meaning-hungry", verb: "explores" },
  Capricorn: { el: "earth", mode: "cardinal", style: "strategic, patient and summit-minded", verb: "structures" },
  Aquarius: { el: "air", mode: "fixed", style: "inventive, detached and future-facing", verb: "rewires" },
  Pisces: { el: "water", mode: "mutable", style: "dreamy, porous and deeply empathic", verb: "dissolves" },
};

export const SUN = {
  Aries: "Your core runs on ignition. You learn by starting things and you feel most alive at the edge of a new attempt. Test it: notice how your energy spikes the moment you choose to go first.",
  Taurus: "Your core runs on slow, reliable fuel. You build value by staying with things long after others drift off. Test it: notice how much calmer you are when your hands and senses are busy.",
  Gemini: "Your core runs on information. Two ideas rubbing together is your idea of a good time, and you are lit up by conversation. Test it: track how often your best insight arrives mid-sentence.",
  Cancer: "Your core runs on belonging. You are strongest when you are protecting something you love, and you remember everything. Test it: notice how your confidence rises when your home base feels secure.",
  Leo: "Your core runs on self-expression. You were built to be seen doing what you love, and your warmth is contagious. Test it: notice how creative you get when someone is genuinely watching.",
  Virgo: "Your core runs on improvement. You see the small fix that changes everything, and being useful feels like being yourself. Test it: notice the calm that follows one well-finished task.",
  Libra: "Your core runs on harmony. You think best in dialogue and you instinctively weigh both sides. Test it: notice how a decision clears once you have talked it through with someone you trust.",
  Scorpio: "Your core runs on depth. Surfaces bore you; you want the hidden mechanism and the real motive. Test it: notice how your focus sharpens when something is secret, risky or true.",
  Sagittarius: "Your core runs on meaning. You need a horizon, a big question and room to roam. Test it: notice how quickly your mood lifts when you are learning something or going somewhere.",
  Capricorn: "Your core runs on purpose. You think in long timelines and you respect what is earned. Test it: notice the satisfaction of a goal reached the slow, real way.",
  Aquarius: "Your core runs on originality. You see the system from slightly outside it and you want to upgrade it. Test it: notice how energised you get when an idea is strange and also right.",
  Pisces: "Your core runs on imagination. Borders between ideas, people and feelings dissolve around you. Test it: notice how often your best results start as a daydream.",
};

export const MOON = {
  Aries: "You feel safe when you can act. Emotions arrive fast and leave fast; stillness without a plan can feel like a cage.",
  Taurus: "You feel safe with comfort, routine and good food. Your emotional baseline is steady, and change asks for time.",
  Gemini: "You feel safe when you can talk it out. Naming a feeling is how you digest it, and boredom unsettles you more than conflict.",
  Cancer: "You feel safe when you are close to your people. Your moods move like tides, and caring for others is how you care for yourself.",
  Leo: "You feel safe when you are appreciated. A little recognition refills you, and you give warmth freely in return.",
  Virgo: "You feel safe when things are in order. Tidying, fixing and helping are how you calm a busy inner world.",
  Libra: "You feel safe in good company and fair exchange. Tension in a room registers in your body before anyone speaks.",
  Scorpio: "You feel safe with total honesty. Your feelings run deep and private, and trust is earned slowly and kept for life.",
  Sagittarius: "You feel safe when you are learning. Routine makes you restless; a new idea or a road trip resets you.",
  Capricorn: "You feel safe when you are in control of the plan. You process feelings by doing something useful with them.",
  Aquarius: "You feel safe with space and freedom. You care widely, but you need room to think before you feel out loud.",
  Pisces: "You feel safe in quiet, music and imagination. You absorb other people's moods, so solitude is maintenance, not avoidance.",
};

export const RISING = {
  Aries: "People first meet someone bold, quick and ready. You enter a room like you have somewhere to be.",
  Taurus: "People first meet someone calm, grounded and pleasant to be around. Your presence slows the room down in a good way.",
  Gemini: "People first meet someone bright, chatty and curious. You ask the second question nobody else thought of.",
  Cancer: "People first meet someone gentle, guarded and quietly protective. The shell is real, and so is what it shelters.",
  Leo: "People first meet someone warm and impossible to miss. You light up a space without trying.",
  Virgo: "People first meet someone thoughtful, observant and precise. You notice what is out of place.",
  Libra: "People first meet someone charming, polished and easy to talk to. You make others feel considered.",
  Scorpio: "People first meet someone magnetic and hard to read. You watch before you speak.",
  Sagittarius: "People first meet someone open, funny and restless. You seem ready for an adventure at short notice.",
  Capricorn: "People first meet someone composed and capable. You look like the person who has the plan.",
  Aquarius: "People first meet someone friendly, unusual and a little detached. You seem tuned to a frequency of your own.",
  Pisces: "People first meet someone soft, intuitive and hard to pin down. You seem to sense the mood of the room.",
};

export const PLANET = {
  mercury: { drive: "how you think and talk", tag: "Mind" },
  venus: { drive: "how you love, value and attract", tag: "Attraction" },
  mars: { drive: "how you chase, fight and take action", tag: "Drive" },
  jupiter: { drive: "where you grow, get lucky and overdo it", tag: "Expansion" },
  saturn: { drive: "where you are tested and build mastery over time", tag: "Discipline" },
  uranus: { drive: "where you break the pattern (a generational marker)", tag: "Disruption" },
  neptune: { drive: "where you dream, dissolve and seek the ideal (a generational marker)", tag: "Vision" },
  pluto: { drive: "where you transform at the root (a generational marker)", tag: "Power" },
  node: { drive: "the direction you are growing toward", tag: "Path" },
};

export const HOUSE = [null,
  "your identity and first impression", "money, possessions and self-worth", "learning, siblings and your neighbourhood",
  "home, family and roots", "creativity, romance and play", "daily work, health and routines",
  "partnerships and one-to-one bonds", "shared resources, intimacy and transformation", "travel, study and belief",
  "career, reputation and public life", "friends, networks and future goals", "the inner world, retreat and the unseen"];

const ASPECT = {
  conjunction: "fuses with", opposition: "pulls against", trine: "flows easily with", square: "pushes hard against",
  sextile: "opens doors for", quincunx: "keeps adjusting to",
};
const ASPECT_NOTE = {
  conjunction: "One signal, amplified.", opposition: "Balance comes from using both ends.", trine: "A natural talent; use it on purpose.",
  square: "Friction that builds strength.", sextile: "An opportunity that rewards effort.", quincunx: "An awkward pairing that asks for small, steady tweaks.",
};
const CORE = { sun: "your identity", moon: "your emotional needs", mercury: "your mind", venus: "your affections", mars: "your drive",
  jupiter: "your growth", saturn: "your discipline", uranus: "your need for freedom", neptune: "your imagination", pluto: "your power",
  node: "your path", asc: "your outward style", mc: "your public direction" };

export const planetLine = (p) => {
  const s = SIGN[p.sign], pl = PLANET[p.key];
  let t = IN_SIGN[p.key] ? IN_SIGN[p.key][p.sign] : `${capital(pl.drive)}: ${s.style}.`;
  if (p.house) t += ` It plays out in ${HOUSE[p.house]}.`;
  if (p.retro) t += " Retrograde: this works inward first, then outward.";
  return t;
};

export const aspectLine = (a) => `${capital(CORE[a.a])} ${ASPECT[a.type]} ${CORE[a.b]}. ${ASPECT_NOTE[a.type]}`;

const EL_NOTE = {
  fire: ["Fire leads: you run on enthusiasm and action.", "Little fire: motivation may need outside sparks."],
  earth: ["Earth leads: you trust what is practical and proven.", "Little earth: routines and the body need deliberate care."],
  air: ["Air leads: ideas and conversation are your fuel.", "Little air: step back and name things before reacting."],
  water: ["Water leads: feeling and intuition steer you.", "Little water: emotions may surface late, so check in on purpose."],
};
export function elementLine(el) {
  const sorted = Object.entries(el).sort((a, b) => b[1] - a[1]);
  const top = sorted[0][0], low = sorted[3];
  const counts = sorted.map(([k, v]) => `${capital(k)} ${v}`).join(" · ");
  return `${counts}\n${EL_NOTE[top][0]}${low[1] <= 1 ? " " + EL_NOTE[low[0]][1] : ""}`;
}

const FORMULA_SUN = { fire: "a spark", earth: "a builder", air: "a thinker", water: "a feeler" };
const FORMULA_MOON = { fire: "who needs momentum", earth: "who needs solid ground", air: "who needs good conversation", water: "who needs real closeness" };
export function formula(c) {
  const sun = c.get("sun"), moon = c.get("moon"), asc = c.cusps ? c.get("asc") : null;
  let t = `${capital(FORMULA_SUN[SIGN[sun.sign].el])} in ${sun.sign} ${FORMULA_MOON[SIGN[moon.sign].el]}`;
  if (asc) t += `, wearing ${SIGN[asc.sign].style.split(",")[0]} ${asc.sign} armour`;
  const tight = c.aspects.find((a) => !["asc", "mc"].includes(a.a) && !["asc", "mc"].includes(a.b));
  if (tight) t += `. Strongest reaction: ${CORE[tight.a]} ${ASPECT[tight.type]} ${CORE[tight.b]}`;
  return t + ".";
}

export const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Planet-in-sign lines for the personal and social planets (outer planets use the layered SIGN style).
const S = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const zip = (arr) => Object.fromEntries(S.map((s, i) => [s, arr[i]]));
export const IN_SIGN = {
  mercury: zip([
    "You think on your feet and say it straight; first drafts are your superpower.",
    "You think slowly and surely; once you have made up your mind it stays made.",
    "Your mind runs several tabs at once and loves wordplay, trivia and debate.",
    "You think with your memory and your gut; you remember how things were said.",
    "You speak to be felt; stories and big gestures carry your ideas.",
    "You think in systems and details and can spot the one error on the page.",
    "You think in dialogue, weighing every side before you commit.",
    "You think like an investigator: you read between the lines and keep your sources quiet.",
    "You think in big pictures and bold claims; facts matter less than meaning.",
    "You think strategically, in plans, budgets and steps that actually work.",
    "You think in patterns nobody else has noticed yet; contrarian by instinct.",
    "You think in images and impressions; logic arrives after intuition.",
  ]),
  venus: zip([
    "You love by pursuing; attraction is a spark, and you like to make the first move.",
    "You love through the senses: touch, food, comfort and loyalty that lasts.",
    "You fall for minds first; banter is your love language.",
    "You love by caring for someone; home and history make the bond.",
    "You love loudly and generously, and you want to be adored back.",
    "You love through small, practical acts of service.",
    "You love beauty, balance and partnership; you are a natural romantic.",
    "You love all or nothing, with depth, loyalty and a little intensity.",
    "You love freedom and adventure; a partner must also be a travel companion.",
    "You love with commitment and patience; you value what lasts and is earned.",
    "You love as a friend first and need space to stay yourself.",
    "You love with devotion and imagination; you see the best in people.",
  ]),
  mars: zip([
    "You act fast and fight fair; competition wakes you up.",
    "You act slowly and unstoppably; push you and you dig in.",
    "You act through words and ideas, often on several fronts at once.",
    "You act to protect your people; your anger is defensive and indirect.",
    "You act with flair and pride; you want your efforts to be seen.",
    "You act methodically and get things done with skill and precision.",
    "You act through diplomacy and partnership; conflict makes you uneasy.",
    "You act with focus and strategy; you rarely show your full hand.",
    "You act on enthusiasm and conviction; a cause gets you moving.",
    "You act with ambition and discipline; you climb steadily.",
    "You act for ideals and change; you rebel against pointless rules.",
    "You act on intuition and inspiration; your energy rises and falls with your mood.",
  ]),
  jupiter: zip([
    "Growth comes from courage and bold first steps.", "Growth comes from patience, comfort and building real value.",
    "Growth comes from learning, writing and connecting people.", "Growth comes from family, home and emotional generosity.",
    "Growth comes from creativity, play and leadership.", "Growth comes from service, skill and doing things well.",
    "Growth comes from partnership, fairness and good taste.", "Growth comes from going deep: research, intimacy, transformation.",
    "Growth comes from travel, study and big beliefs; this is Jupiter at home.", "Growth comes from structure, responsibility and long-term goals.",
    "Growth comes from community, innovation and causes bigger than you.", "Growth comes from compassion, art and spiritual practice.",
  ]),
  saturn: zip([
    "The lesson is patience: learning to lead without rushing.", "The lesson is security: building worth that doesn't depend on things.",
    "The lesson is focus: turning curiosity into real expertise.", "The lesson is emotional safety: building the home you needed.",
    "The lesson is confidence: creating without waiting for applause.", "The lesson is perfectionism: good enough, finished, shipped.",
    "The lesson is commitment: balanced, honest partnerships.", "The lesson is trust: sharing power and letting go of control.",
    "The lesson is belief: earning your own philosophy rather than borrowing one.", "The lesson is ambition: mastery that you own; Saturn at home here.",
    "The lesson is belonging: being different and still part of the group.", "The lesson is boundaries: compassion that doesn't drown you.",
  ]),
};
