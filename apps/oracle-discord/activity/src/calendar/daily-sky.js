// Daily Sky: one shared set of three puzzles a day (a cycle, a festival, an eclipse), built from the real date.
// Everyone gets the same three because the rng is seeded by the shared daily module (../daily.js, game id "calendar").
import { dailySeed, todayKey } from "../daily.js";
import { LEVELS } from "./puzzles.js";
import * as E from "./engine.js";

export const GAME = "calendar";
/** mulberry32: a small seedable rng. */
export function rngOf(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** The UTC day as a JDN, so the puzzles match for every player whatever their time zone. */
export const dayJdn = (day = todayKey()) => E.parseYmd(day);
/** Today's three puzzles: one from each of the first three levels, generated from today's date. */
export function dailySet(day = todayKey()) {
  const rng = rngOf(dailySeed(GAME, day)), j = dayJdn(day);
  return LEVELS.slice(0, 3).map((L) => { const p = L.deck[Math.floor(rng() * L.deck.length)]; return { L, p, g: p.gen(rng, j) }; });
}
/** Score: stars kept (0-9) and a little speed bonus is avoided on purpose so careful counting wins. */
export const dailyScore = (stars) => stars.reduce((a, b) => a + b, 0);
/** Rewards for the first finished run of the day: per star, plus a streak bonus in gems (capped). */
export function dailyReward(score, streak) {
  return { xp: 10 + score * 3, essence: score * 2 + Math.min(12, 2 * Math.max(0, streak - 1)) };
}
