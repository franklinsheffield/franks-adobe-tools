// Calendar Keeper rules, kept pure for tests. Progress lives in prog.rooms.calendar:
//   { plays, stars: { "<level>:<id>": best 0-3 }, last }. The equipped desk look is prog.calendar (store shelf kind).
// Each puzzle starts at 3 stars. Each hint taken and each wrong answer costs one; at 0 the Keeper shows the answer.
// New stars pay ✦ and 💎, scaled by level; the first clear of a puzzle adds a bonus. Replays pay only improvement.
import { LEVELS, ALL, keyOf } from "./puzzles.js";

export const STARS = 3;
export const PER_STAR = { xp: 4, essence: 3 };
export const FIRST = 5;
export const TITLES = [{ at: 0, name: "Day Counter" }, { at: 12, name: "Timekeeper" }, { at: 30, name: "Daykeeper" }, { at: 50, name: "Sky Watcher" }, { at: ALL.length * STARS, name: "Keeper of the Calendars" }];

export const room = (p) => { const r = ((p.rooms ||= {}).calendar ||= { plays: 0, stars: {}, last: null }); r.stars ||= {}; return r; };
export const starsOf = (p, L) => (L ? L.deck : ALL.map((x) => x.p)).reduce((n, x, i) => n + (room(p).stars[L ? keyOf(L, x) : keyOf(ALL[i].L, x)] || 0), 0);
export const doneCount = (p, L) => (L ? L.deck.filter((x) => room(p).stars[keyOf(L, x)]).length : ALL.filter(({ L: l, p: x }) => room(p).stars[keyOf(l, x)]).length);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
/** Level n is open once the level before has 4 puzzles solved (level 1 always). */
export const isOpen = (p, L) => L.n === 1 || doneCount(p, LEVELS[L.n - 2]) >= 4;

/** Pick the next puzzle in a level: unsolved first, never the one just played. */
export function nextPuzzle(p, L, after, rng = Math.random) {
  const open = L.deck.filter((x) => !room(p).stars[keyOf(L, x)] && x.id !== after);
  const pool = open.length ? open : L.deck.filter((x) => x.id !== after && (room(p).stars[keyOf(L, x)] || 0) < STARS);
  const use = pool.length ? pool : L.deck.filter((x) => x.id !== after);
  return use[Math.floor(rng() * use.length)] || L.deck[0];
}

export const start = (L, p, g) => ({ key: keyOf(L, p), level: L.n, g, stars: STARS, hints: 0, wrong: 0, done: false, won: false });
/** Next hint text (each costs a star, but never the last one). */
export function useHint(run) {
  if (run.done || run.hints >= run.g.hints.length || run.stars <= 1) return null;
  run.stars--; return run.g.hints[run.hints++];
}
const same = (a, b) => (typeof a === "object" ? Object.keys(a).every((k) => +a[k] === +b?.[k]) : String(a).trim().toLowerCase() === String(b).trim().toLowerCase().replace(/,/g, ""));
/** Check an answer: "right" | "wrong" | "out" (no stars left: the answer is shown). */
export function check(run, ans) {
  if (run.done) return null;
  const a = run.g.kind === "num" ? String(ans).replace(/[,\s]/g, "") : ans;
  if (same(run.g.answer, a)) { run.done = run.won = true; return "right"; }
  run.wrong++; run.stars--;
  if (run.stars <= 0) { run.done = true; run.stars = 0; return "out"; }
  return "wrong";
}

/** Save the result. Returns { xp, essence, stars, first, best, total } where best = new personal best. */
export function settle(prog, run) {
  const r = room(prog), L = LEVELS[run.level - 1], before = r.stars[run.key] || 0, got = run.won ? run.stars : 0;
  r.plays = (r.plays || 0) + 1; r.last = run.key.split(":")[1];
  const gain = Math.max(0, got - before), first = run.won && !before;
  if (got > before) r.stars[run.key] = got;
  const xp = Math.round((gain * PER_STAR.xp + (first ? FIRST : 0)) * L.mult), essence = Math.round(gain * PER_STAR.essence * L.mult);
  return { xp, essence, stars: got, first, best: got > before, total: starsOf(prog) };
}

// ---- Calendar Keeper items for the Essence store: looks for the Keeper's desk (the wheels on the reading table). ----
// kind "calendar" is shown as its own store tab; ids stay stable because saves refer to them.
export const SHOP = [
  { id: "cal-brass", kind: "calendar", name: "Keeper's brass", note: "Polished brass gears on midnight wood", price: 0,
    look: { bg: ["#24173f", "#07040f"], gear: "#E2B04A", gear2: "#8a6420", ink: "#160b2c", ring: "#66E0C8", text: "#FADE8C", fx: "" } },
  { id: "cal-jade", kind: "calendar", name: "Jade and obsidian", note: "Maya: carved jade gears, an obsidian mirror, drifting copal smoke", price: 90,
    look: { bg: ["#0f3a2c", "#030a07"], gear: "#5fc79a", gear2: "#1c6b4e", ink: "#04140e", ring: "#FADE8C", text: "#d8ffe9", fx: "smoke" } },
  { id: "cal-papyrus", kind: "calendar", name: "Papyrus and lapis", note: "Egypt: lapis gears on papyrus, and Sirius rising over the Nile", price: 90,
    look: { bg: ["#3b2f1a", "#120c04"], gear: "#3d6bd1", gear2: "#1c3478", ink: "#efe0b8", ring: "#E2B04A", text: "#f3e3c3", fx: "sirius" } },
  { id: "cal-bronze", kind: "calendar", name: "Coligny bronze", note: "Gaulish: engraved bronze plates with MAT and ANM, a bonfire glow", price: 110,
    look: { bg: ["#3a1d0c", "#0d0603"], gear: "#c98a4b", gear2: "#6e3e18", ink: "#1a0c04", ring: "#ff9a4a", text: "#ffd9b0", fx: "embers" } },
  { id: "cal-night", kind: "calendar", name: "Night-sky desk", note: "Wheels of starlight over a slowly turning sky", price: 140,
    look: { bg: ["#122266", "#02040f"], gear: "#c9d4ff", gear2: "#5566b8", ink: "#050a24", ring: "#FF4FB3", text: "#eef1ff", fx: "stars" } },
  { id: "cal-antikythera", kind: "calendar", name: "Antikythera mechanism", note: "Sea-green corroded bronze; every gear keeps turning", price: 180,
    look: { bg: ["#1f3b3a", "#040b0b"], gear: "#7fb8a4", gear2: "#3f6b5c", ink: "#061210", ring: "#E2B04A", text: "#dff5ec", fx: "spin" } },
];
export const lookOf = (p, want) => { const id = want || p.calendar; return (SHOP.find((s) => s.id === id && (want || s.price === 0 || (p.owned || []).includes(id))) || SHOP[0]).look; };
