// Illuminator rules: no DOM. A page has two parts. First the stages, in their real order: tap the next one; a wrong
// one costs a drop. Then the colours: for each part of the page, pick the pigment its riddle describes; a wrong one
// costs a drop (and paints the part wrong until you fix it). Finish with drops left and the page is done.
import { STEPS, PIGMENTS, PAGES, LEVELS, INK, CHOICES, pigmentOf } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const pageOf = (id) => PAGES.find((p) => p.id === id);

export function room(p) {
  p.rooms = p.rooms || {}; const r = (p.rooms.illuminator = p.rooms.illuminator || {});
  r.plays ||= 0; r.wins ||= {}; r.best ||= {}; r.pages = Array.isArray(r.pages) ? r.pages : [];
  return r;
}
/** The stages for a level, in the right order. */
export const stepsFor = (L) => STEPS.filter((s) => s.lvl <= L.n);
/** Pigment choices for one part: the answer and others, same colour first. */
export function choicesFor(id, rand = Math.random) {
  const P = pigmentOf(id), same = PIGMENTS.filter((x) => x.fam === P.fam && x.id !== id), other = PIGMENTS.filter((x) => x.fam !== P.fam);
  const pool = [...shuffle(same, rand), ...shuffle(other, rand)].slice(0, CHOICES - 1);
  return shuffle([id, ...pool.map((x) => x.id)], rand);
}
export function start(L, { seed = null, page = null, daily = null } = {}) {
  const rand = seed == null ? Math.random : rng(seed);
  const pool = PAGES.filter((p) => p.lvl === L.n), pg = pageOf(page) || pool[Math.floor(rand() * pool.length)];
  const order = stepsFor(L).map((s) => s.id);
  return { L, page: pg.id, order, deck: shuffle(order, rand), done: [], zones: pg.zones.map(([part, pig]) => ({ part, pig, choices: choicesFor(pig, rand), got: null, tried: [] })),
    zi: 0, drops: INK, stage: "steps", misses: 0, over: false, won: false, daily, score: 0 };
}
const spend = (g) => { g.drops--; g.misses++; if (g.drops <= 0) { g.drops = 0; g.over = true; g.won = false; } };
/** Tap a stage. Returns right | wrong | ruined | null. When all are placed the game moves to colours. */
export function placeStep(g, id) {
  if (g.over || g.stage !== "steps" || g.done.includes(id)) return null;
  if (id !== g.order[g.done.length]) { spend(g); return g.over ? "ruined" : "wrong"; }
  g.done.push(id); if (g.done.length === g.order.length) g.stage = "colours"; return "right";
}
export const zone = (g) => g.zones[g.zi];
/** Choose a pigment for the current part. Returns right | wrong | ruined | null. */
export function paint(g, pig) {
  if (g.over || g.stage !== "colours") return null; const z = zone(g); if (!z || z.tried.includes(pig)) return null;
  if (pig !== z.pig) { z.tried.push(pig); spend(g); return g.over ? "ruined" : "wrong"; }
  z.got = pig; g.zi++; if (g.zi >= g.zones.length) finish(g); return "right";
}
function finish(g) { g.over = true; g.won = g.drops > 0; g.score = g.won ? Math.round(g.drops * 3 * g.L.mult) : 0; }
export const perfect = (g) => g.won && g.misses === 0;
export const maxScore = (L) => Math.round(INK * 3 * L.mult);

/** Bank a page. Returns { won, xp, essence, best, newPage }. */
export function settle(p, g) {
  const r = room(p); r.plays++;
  if (g.won) r.wins[g.L.n] = (r.wins[g.L.n] || 0) + 1;
  const best = g.score > (r.best[g.L.n] || 0); if (best) r.best[g.L.n] = g.score;
  const newPage = g.won && !r.pages.includes(g.page); if (newPage) r.pages.push(g.page);
  return { won: g.won, xp: g.score, essence: g.score + (newPage ? 10 : 0), best, newPage };
}
export function dailyOf(day = todayKey()) { const seed = dailySeed("illuminator", day); return { seed, L: LEVELS[seed % 3], day }; }
export { LEVELS };
