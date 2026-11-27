// Herbalist's Grimoire: "Spot the look-alike". Two pressed plants side by side: a safe one and the deadly double that
// foragers really do confuse it with. Each gets a field note; the player says which one is the safe plant.
// Pure data and rules, kept testable. Progress: prog.rooms.grimoire.twins = { "<pair id>": true } once spotted.
// For learning only: a game is never a reason to eat a wild plant.
import { plantById, room } from "./logic.js";

/** safe / deadly are plant ids from plants.js; notes are what you would actually check in the field. */
export const TWINS = [
  { id: "ramsons-lily", safe: "wildgarlic", deadly: "lilyvalley",
    notes: { safe: "Crush a leaf: a strong smell of garlic. Each leaf rises on its own stalk straight from the ground. White flowers open as starry balls.",
      deadly: "Crush a leaf: no garlic smell at all. Usually two leaves wrapped around one stem. White flowers hang like little bells along one side." },
    why: "They grow in the same spring woods. People have been badly poisoned after picking lily of the valley with wild garlic; its heart poisons are like foxglove's.",
    tells: ["Smell each leaf you pick, and wash your hands between leaves: the garlic smell clings to your fingers", "One leaf per stalk (wild garlic) vs two leaves hugging one stem", "Starry flower balls vs hanging bells"] },
  { id: "ramsons-arum", safe: "wildgarlic", deadly: "lordsladies",
    notes: { safe: "Long, smooth, pointed leaves with veins that run side by side from base to tip. Strong garlic smell.",
      deadly: "Arrow-shaped leaves, often black-spotted, with a net of branching veins. No garlic smell." },
    why: "Young lords-and-ladies leaves come up in the middle of wild garlic beds. Its needle crystals make the mouth and throat burn and swell.",
    tells: ["Parallel veins (wild garlic) vs a net of veins (arum)", "Lance-shaped vs arrow-shaped leaves", "Garlic smell vs none"] },
  { id: "garlic-daffodil", safe: "garlic", deadly: "daffodil",
    notes: { safe: "The bulb splits into cloves under papery skin and smells of garlic. Flowers come in a round head of tiny pink-white blooms.",
      deadly: "One solid, onion-like bulb with no onion or garlic smell. Flowers are big yellow trumpets." },
    why: "Daffodil bulbs stored with vegetables have been cooked by mistake for onions, causing violent vomiting.",
    tells: ["Cloves vs one solid bulb", "Garlic smell vs no smell", "Keep flower bulbs away from food"] },
  { id: "parsley-hemlock", safe: "parsley", deadly: "hemlock",
    notes: { safe: "A low herb, under knee height, with a plain green stem. Rub a leaf: it smells of parsley.",
      deadly: "Grows head-high or more. A smooth, hollow stem splotched with purple. Rub a leaf: a musty, 'mousy' smell." },
    why: "Both are in the carrot family, with lacy leaves and white umbrella flowers in the wild. Poison hemlock killed Socrates and still kills foragers.",
    tells: ["Purple blotches on a smooth stem mean hemlock", "Mousy smell vs parsley smell", "Never forage wild carrot-family plants without an expert"] },
  { id: "fennel-hemlock", safe: "fennel", deadly: "hemlock",
    notes: { safe: "Hair-fine, thread-like leaves, flowers in yellow umbrellas, and a strong smell of aniseed.",
      deadly: "Flatter, fern-like leaves, flowers in white umbrellas, a purple-spotted stem and a musty smell." },
    why: "Wild fennel and hemlock grow on the same roadsides and both make tall umbrellas of flowers.",
    tells: ["Yellow flowers (fennel) vs white (hemlock)", "Aniseed smell vs mousy smell", "Purple-spotted stem means hemlock"] },
  { id: "comfrey-foxglove", safe: "comfrey", deadly: "foxglove",
    notes: { safe: "Rough, bristly leaves whose bases run down the stem like wings. Flowers in curled clusters of small tube-shaped bells.",
      deadly: "Soft, velvety, finely toothed leaves in a flat rosette. Later a single tall spike of big spotted bells." },
    why: "Before they flower, foxglove rosettes look like comfrey. People have died after brewing foxglove leaves as comfrey tea.",
    tells: ["Bristly (comfrey) vs velvety (foxglove)", "Winged stem vs plain stem", "Comfrey itself is not a safe tea either: it can harm the liver"] },
  { id: "borage-mandrake", safe: "borage", deadly: "mandrake",
    notes: { safe: "An upright, branching stem covered in stiff white bristles, with blue star-shaped flowers.",
      deadly: "No stem: a flat rosette of large, crinkled leaves lying on the ground, with violet cup flowers in the middle." },
    why: "In Italy and elsewhere, people have been poisoned by mandrake leaves picked or sold as borage or spinach.",
    tells: ["Bristly stem (borage) vs a flat rosette with no stem (mandrake)", "Blue stars vs violet cups", "Buy greens from trusted sellers"] },
  { id: "bay-oleander", safe: "bay", deadly: "oleander",
    notes: { safe: "Leaves grow one at a time along the twig, with slightly wavy edges. Tear one: a warm, spicy smell.",
      deadly: "Long, narrow leaves in rings of three, with many fine side veins. Tear one: no spicy smell. Pink or white flowers in bunches." },
    why: "Both are glossy evergreen shrubs in warm-climate gardens, and oleander leaves have been mistaken for bay in cooking and teas.",
    tells: ["Spicy smell (bay) vs none (oleander)", "Leaves one by one vs in threes", "Never cook with a leaf you can't name"] },
  { id: "elder-hemlock", safe: "elder", deadly: "waterhemlock",
    notes: { safe: "A woody shrub with bark. Leaves of five to seven toothed leaflets. Flat, creamy sprays of flowers with a sweet, musky smell.",
      deadly: "A soft, non-woody plant of wet ground with a hollow, purple-streaked stem. Its swollen root has hollow chambers." },
    why: "Elderflower pickers and wild-food foragers meet water hemlock along the same streams and hedges. It is one of the deadliest plants in North America.",
    tells: ["Woody stem with bark (elder) vs hollow soft stem (hemlock)", "Shrub vs herb of wet ground", "Elder's own berries must be cooked; never eat them raw"] },
];

export const TWIN_FIRST = 15; // ✦ and 💎 for spotting a pair the first time
export const TWIN_AGAIN = 3;  // ✦ for a correct replay
export const TWIN_MISS = 1;   // ✦ for trying

/** The two plants of a pair, plus which side the safe one sits on (0 = A, 1 = B). */
export const twinPlants = (t) => ({ safe: plantById(t.safe), deadly: plantById(t.deadly) });
export const spotted = (prog) => (room(prog).twins ||= {});
export const spottedCount = (prog) => TWINS.filter((t) => spotted(prog)[t.id]).length;

/** Next pair: an unspotted one if any, never the same pair twice running. rnd() in [0,1). */
export function nextTwin(prog, after, rnd = Math.random) {
  const open = TWINS.filter((t) => !spotted(prog)[t.id] && t.id !== after);
  const pool = open.length ? open : TWINS.filter((t) => t.id !== after);
  return pool[Math.floor(rnd() * pool.length)] || TWINS[0];
}

/** Lay out a round: which side holds the safe plant. */
export const layTwin = (t, rnd = Math.random) => ({ id: t.id, safeSide: rnd() < 0.5 ? 0 : 1, picked: null, right: null });

/** The player picks side 0 (A) or 1 (B) as the safe plant. Returns true/false, or null once already answered. */
export function pickTwin(round, side) {
  if (round.picked !== null) return null;
  round.picked = side; round.right = side === round.safeSide; return round.right;
}

/** Pay out: first spot pays ✦ and 💎, a replay a little ✦, a miss a token ✦. */
export function settleTwin(prog, round) {
  const s = spotted(prog), first = round.right && !s[round.id];
  if (round.right) s[round.id] = true;
  room(prog).plays = (room(prog).plays || 0) + 1;
  const xp = round.right ? (first ? TWIN_FIRST : TWIN_AGAIN) : TWIN_MISS;
  return { first, xp, essence: first ? TWIN_FIRST : 0 };
}
