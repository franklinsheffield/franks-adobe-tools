// Herbalist's Grimoire: the herbarium (collection book). Every plant you have identified is pressed into it; the rest
// show as silhouettes. Completing a whole garden pays a one-time Essence prize (prog.rooms.grimoire.prizes[level]).
import { LEVELS, keyOf, room } from "./logic.js";

export const GARDEN_PRIZE = { 1: 100, 2: 150, 3: 200 };
/** How far along each garden is: [{ L, got, total, done, paid }]. */
export const gardens = (prog) => LEVELS.map((L) => { const r = room(prog), got = L.deck.filter((p) => r.solved[keyOf(L, p)]).length;
  return { L, got, total: L.deck.length, done: got === L.deck.length, paid: !!(r.prizes || {})[L.n] }; });
/** Pay any garden finished but not yet paid. Returns [{ L, essence }] for the ones paid now (marks them). */
export function claimGardenPrizes(prog) {
  const r = room(prog), prizes = (r.prizes ||= {}), out = [];
  for (const g of gardens(prog)) if (g.done && !prizes[g.L.n]) { prizes[g.L.n] = true; out.push({ L: g.L, essence: GARDEN_PRIZE[g.L.n] }); }
  return out;
}
