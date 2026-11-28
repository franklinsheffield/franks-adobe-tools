// Star-hop challenges for Star Lore Navigator: the real way people find their way round the sky, from a bright
// pattern you know to a star you don't. Each route is a list of steps; at each step the player taps the star the
// Oracle describes (any HIP in "to"). A wrong star is a mistake. The line from the previous star is drawn as you go.
// Progress: prog.rooms.stars.hops = { "<route id>": best stars (1-3) }. Pure data and rules; the room draws it.

/** Routes, roughly easiest first. hip numbers are Hipparcos stars in sky.gen.js STARS (tests check every one). */
export const HOPS = [
  { id: "polaris", name: "The Pointers to Polaris", emoji: "🧭", start: [54061, 53910], steps: [
    { to: [53910], say: "Start with the Big Dipper. Tap Merak, the bottom star of the bowl on the side away from the handle." },
    { to: [54061], say: "Now tap Dubhe, the star right above it at the lip of the bowl. These two are the Pointers." },
    { to: [11767], say: "Follow the line from Merak through Dubhe, about five times the gap between them, to a lone, steady star: Polaris, the North Star." },
  ], fact: "Polaris sits less than a degree from the north celestial pole, so it barely moves all night. Face it and you face north; its height above the horizon is your latitude." },
  { id: "arc", name: "Arc to Arcturus, speed on to Spica", emoji: "🏹", start: [62956, 65378, 67301], steps: [
    { to: [62956], say: "Find the Big Dipper's handle. Tap Alioth, the handle star next to the bowl." },
    { to: [65378], say: "Tap Mizar, the middle star of the handle." },
    { to: [67301], say: "Tap Alkaid, the end of the handle." },
    { to: [69673], say: "Keep following the curve of the handle in a gentle arc to the brightest star in that part of the sky, orange Arcturus." },
    { to: [65474], say: "Now speed on: carry the same curve about as far again to a bright blue-white star, Spica." },
  ], fact: "\"Arc to Arcturus, speed on to Spica\" is one of the oldest star-hopping rhymes. Arcturus is an orange giant 37 light-years away; Spica is two hot blue stars orbiting each other every four days." },
  { id: "belt", name: "Orion's Belt to Sirius and Aldebaran", emoji: "🗡️", start: [26727, 26311, 25930], steps: [
    { to: [26727], say: "Find Orion's Belt, three stars in a short straight row. Tap Alnitak, the belt star on the eastern (left) end." },
    { to: [26311], say: "Tap Alnilam, the middle star of the belt." },
    { to: [25930], say: "Tap Mintaka, the western end of the belt." },
    { to: [21421], say: "Follow the belt north-west, away from Alnitak, about eight belt-lengths to an orange star in a V of stars: Aldebaran, the Bull's eye." },
    { to: [17702], say: "Keep going the same way, about as far again, to a tiny misty cluster: tap Alcyone, the brightest of the Pleiades." },
    { to: [32349], say: "Now turn right round. Follow the belt the other way, south-east past Alnitak, to the brightest star of the whole night sky: Sirius." },
  ], fact: "Orion's Belt points both ways: up to Aldebaran and the Pleiades, down to Sirius. Sirius is bright because it is close, only 8.6 light-years away." },
  { id: "triangle", name: "The Summer Triangle", emoji: "🔺", start: [91262, 102098, 97649], steps: [
    { to: [91262], say: "Find the brightest star high in the summer sky, blue-white Vega, in the little Lyre. Tap it." },
    { to: [102098], say: "Look east of Vega to the bright star at the tail of the Swan, along the Milky Way: Deneb." },
    { to: [97649], say: "Now look south to the third corner, a bright star with a fainter star on each side: Altair, in the Eagle." },
  ], fact: "Vega, Deneb and Altair are not a constellation but an asterism, a pattern of bright stars. Deneb looks the faintest but is by far the most luminous; it is just much farther away." },
  { id: "regulus", name: "The leaky Dipper drips on Leo", emoji: "🦁", start: [59774, 58001], steps: [
    { to: [59774], say: "Find the Big Dipper again. Tap Megrez, where the handle joins the bowl." },
    { to: [58001], say: "Tap Phecda, the bottom corner of the bowl below it." },
    { to: [49669], say: "Imagine the bowl has a hole: the water drips out from Megrez through Phecda and away from the handle, a long way down to the Lion's heart. Tap Regulus." },
  ], fact: "Regulus sits almost exactly on the ecliptic, so the Moon and planets often pass close by it. It spins so fast, once in about 16 hours, that it bulges at the equator." },
  { id: "andromeda", name: "Pegasus to Andromeda and Perseus", emoji: "⛓️", start: [113963, 113881, 677, 1067], steps: [
    { to: [113963], say: "Find the Great Square of Pegasus, four stars in a big square. Tap Markab, its south-west corner." },
    { to: [113881], say: "Tap Scheat, the corner above it." },
    { to: [677], say: "Go across the top of the square to Alpheratz, the north-east corner. It belongs to Andromeda." },
    { to: [5447], say: "From Alpheratz, a line of stars runs on to the north-east like a chain. Tap the next bright one, Mirach." },
    { to: [9640], say: "Keep following the chain: tap Almach, the princess's foot." },
    { to: [15863], say: "Carry on in the same direction into the Milky Way to the brightest star of Perseus: Mirfak." },
  ], fact: "Two stars up from Mirach, toward Cassiopeia, a faint smudge is the Andromeda Galaxy, 2.5 million light-years away: the farthest thing most people can see without a telescope." },
  { id: "hexagon", name: "The Winter Hexagon", emoji: "❄️", start: [24436, 21421, 24608, 37826, 37279, 32349], steps: [
    { to: [24436], say: "Start at Rigel, the brilliant blue-white star at Orion's foot." },
    { to: [21421], say: "Go up and to the right to orange Aldebaran, the eye of the Bull." },
    { to: [24608], say: "Go up and left to Capella, the bright yellow star of the Charioteer, high overhead in winter." },
    { to: [37826], say: "Swing east to the twins: tap Pollux, the brighter, more orange one." },
    { to: [37279], say: "Drop down to Procyon, the Little Dog." },
    { to: [32349], say: "Finish at Sirius, the brightest of all, closing the circle back toward Rigel." },
  ], fact: "The Winter Hexagon holds six of the brightest stars, from six constellations. Betelgeuse sits near its middle." },
  { id: "south", name: "The Pointers to the Southern Cross", emoji: "✝️", start: [71683, 68702], steps: [
    { to: [71683, 71681], say: "In the far south, find two brilliant stars side by side. Tap Rigil Kentaurus (Alpha Centauri), the brighter one." },
    { to: [68702], say: "Tap Hadar, the other Pointer." },
    { to: [62434, 61084, 60718], say: "Follow the Pointers on, past Hadar, to the bright kite of the Southern Cross. Tap any of its bright stars." },
    { to: [60718], say: "Find the Cross's long bar and tap Acrux, the bright star at its foot." },
  ], fact: "The Cross's long bar points toward the south celestial pole: about four and a half bar-lengths from Acrux. With no bright south pole star, navigators used this instead of Polaris." },
];

/** Messier objects each route passes: a finished hop logs them in Messier's Catalogue (Pleiades M45; Andromeda Galaxy M31). */
export const HOP_MESSIER = { belt: [45], andromeda: [31] };
export const hopById = (id) => HOPS.find((h) => h.id === id) || null;
const key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
/** A new hop run. */
export const startHop = (route) => ({ id: route.id, step: 0, path: [], drawn: [], mistakes: 0, hints: 0, done: false, total: route.steps.length });
/** Tap a star (HIP) at the current step: "ok", "done", "miss", or null (same star again / finished). */
export function hop(run, route, hip) {
  if (run.done) return null;
  const st = route.steps[run.step], prev = run.path[run.path.length - 1];
  if (hip === prev) return null;
  if (!st.to.includes(hip)) { run.mistakes++; return "miss"; }
  if (prev) run.drawn.push(key(prev, hip));
  run.path.push(hip); run.step++;
  if (run.step >= route.steps.length) { run.done = true; return "done"; }
  return "ok";
}
/** Stars: 0-1 mistakes 3, 2-3 two, more one. Points 10 per star. */
export const hopStars = (m) => (m <= 1 ? 3 : m <= 3 ? 2 : 1);
/** Seconds on the clock: 40 + 20 per step. */
export const hopTime = (route) => 40 + 20 * route.steps.length;
const hopsOf = (p) => (((p.rooms ||= {}).stars ||= { plays: 0, found: {}, heard: [], last: null }).hops ||= {});
/** Settle a hop run into progress. First clears pay 10 per star in ✦ and 💎; replays pay the improvement only. */
export function settleHop(p, run) {
  const h = hopsOf(p), prev = h[run.id] || 0, got = run.done ? hopStars(run.mistakes) : 0;
  if (got > prev) { h[run.id] = got; return { xp: (got - prev) * 10, essence: (got - prev) * 10, stars: got, first: !prev }; }
  return { xp: run.done ? 2 : 1, essence: 0, stars: got, first: false };
}
export const hopsDone = (p) => Object.keys(hopsOf(p)).length;
export const hopBest = (p, id) => hopsOf(p)[id] || 0;
