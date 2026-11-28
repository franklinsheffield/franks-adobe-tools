// Forgery Desk rules: no DOM. A round deals documents, each claiming a year with a few features. Test a feature to
// see when it first existed (tests are limited per round). Then flag the feature too new for the date, or call the
// document genuine. A wrong call costs reputation; run out and you're off the case.
import { FEATURES, DOCS, CASES, LEVELS, MARGIN, ROUND, REP, featureOf } from "./data.js";
import { dailySeed, todayKey } from "../daily.js";

export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, rand) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const docOf = (id) => DOCS.find((d) => d.id === id);
/** Features old enough to be genuine on a document of this year, and ones new enough to give a forgery away. */
export const oldFor = (year) => FEATURES.filter((f) => f.year <= year - MARGIN);
export const newFor = (year) => FEATURES.filter((f) => f.year >= year + MARGIN);

export function room(p) {
  p.rooms = p.rooms || {}; const r = (p.rooms.forgery = p.rooms.forgery || {});
  r.plays ||= 0; r.wins ||= {}; r.best ||= {}; r.caught ||= 0; r.cleared ||= 0; r.seen = Array.isArray(r.seen) ? r.seen : [];
  return r;
}
/** One document: n features, one of them (or none, if genuine) too new for the year. */
export function makeDoc(d, n, genuine, rand) {
  const olds = shuffle(oldFor(d.year), rand), news = shuffle(newFor(d.year), rand);
  const fake = genuine || !news.length ? null : news[0].id, feats = shuffle([...(fake ? [fake] : []), ...olds.slice(0, fake ? n - 1 : n).map((f) => f.id)], rand);
  return { id: d.id, year: d.year, feats, fake, tested: [], verdict: null, right: null };
}
export function start(L, { seed = null, daily = null } = {}) {
  const rand = seed == null ? Math.random : rng(seed), picks = shuffle(DOCS, rand).slice(0, ROUND);
  const gen = new Set(shuffle(picks.map((_, i) => i), rand).slice(0, L.genuine ? 1 + Math.floor(rand() * L.genuine) : 0));
  return { L, docs: picks.map((d, i) => makeDoc(d, L.feats, gen.has(i), rand)), di: 0, tests: L.tests, rep: REP, misses: 0, over: false, won: false, daily, score: 0,
    caseId: CASES[Math.floor(rand() * CASES.length)].id };
}
export const doc = (g) => g.docs[g.di];
/** Test a feature: shows its first year. Returns the feature, or null if no tests are left or it's already tested. */
export function test(g, fid) {
  const d = doc(g); if (g.over || !d || d.verdict || !d.feats.includes(fid) || d.tested.includes(fid) || g.tests <= 0) return null;
  g.tests--; d.tested.push(fid); return featureOf(fid);
}
/** Give a verdict: a feature id (forged because of it) or "genuine". Returns right | wrong | lost | null. */
export function judge(g, call) {
  const d = doc(g); if (g.over || !d || d.verdict) return null;
  d.verdict = call; d.right = call === "genuine" ? d.fake === null : call === d.fake;
  if (!d.right) { g.rep--; g.misses++; if (g.rep <= 0) { g.rep = 0; g.over = true; g.won = false; return "lost"; } }
  return d.right ? "right" : "wrong";
}
/** Move on to the next document; finishes the round after the last. */
export function next(g) {
  if (g.over || !doc(g)?.verdict) return false; g.di++;
  if (g.di >= g.docs.length) { g.over = true; g.won = true; g.score = Math.round((g.docs.filter((d) => d.right).length * 3 + g.tests) * g.L.mult); }
  return true;
}
export const perfect = (g) => g.won && g.misses === 0;
export const maxScore = (L) => Math.round((ROUND * 3 + L.tests) * L.mult);
export function settle(p, g) {
  const r = room(p); r.plays++;
  r.caught += g.docs.filter((d) => d.right && d.fake).length; r.cleared += g.docs.filter((d) => d.right && !d.fake).length;
  if (g.won) r.wins[g.L.n] = (r.wins[g.L.n] || 0) + 1;
  const best = g.score > (r.best[g.L.n] || 0); if (best) r.best[g.L.n] = g.score;
  const newCase = g.won && !r.seen.includes(g.caseId); if (newCase) r.seen.push(g.caseId);
  return { won: g.won, xp: g.score, essence: g.score + (newCase ? 10 : 0), best, newCase };
}
export function dailyOf(day = todayKey()) { const seed = dailySeed("forgery", day); return { seed, L: LEVELS[seed % 3], day }; }
export { LEVELS };
