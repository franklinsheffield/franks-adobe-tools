// Star Lore Navigator rules and sky maths, kept pure for tests. The player roams the whole sky, finds the constellation
// the Oracle asks for and draws its stick figure star to star while the Oracle tells a fable about it.
// Progress lives in prog.rooms.stars: { plays, found: { "<level>:<id>": bestScore }, heard: ["<id>:<fable>"], last }
// Mistakes (a line that isn't part of the figure, or a hint) lower the stars: 0-1 → ★★★, 2-4 → ★★, 5+ → ★.
// Score = 10 per star + 5 for the quiz, ×1 / ×1.5 / ×2 by level. First finds pay ✦ and 💎; replays pay the improvement.
import { STARS, LINES, FIGURES, CON_NAMES, STAR_NAMES } from "./sky.gen.js";
import { DECK, LEVELS } from "./lore.js";

export { LEVELS, DECK };
export const ALL = LEVELS.flatMap((L) => DECK.map((g) => ({ L, g })));
export const keyOf = (L, g) => L.n + ":" + g.id;
export const TITLES = [{ at: 0, name: "Stargazer" }, { at: 6, name: "Sky Watcher" }, { at: 16, name: "Star Joiner" }, { at: 32, name: "Navigator" }, { at: ALL.length, name: "Keeper of Star Lore" }];

const D = Math.PI / 180;
/** Angular distance between two sky points, degrees. */
export function sep(ra1, de1, ra2, de2) {
  const c = Math.sin(de1 * D) * Math.sin(de2 * D) + Math.cos(de1 * D) * Math.cos(de2 * D) * Math.cos((ra1 - ra2) * D);
  return Math.acos(Math.max(-1, Math.min(1, c))) / D;
}
/** Stereographic projection centred on (ra0, dec0): north up and east to the LEFT, as the sky looks overhead. */
export function project(ra, de, ra0, de0) {
  const dA = (ra - ra0) * D, s = Math.sin(de * D), c = Math.cos(de * D), s0 = Math.sin(de0 * D), c0 = Math.cos(de0 * D);
  const cosc = s0 * s + c0 * c * Math.cos(dA), k = 2 / (1 + cosc);
  return { x: -k * c * Math.sin(dA), y: k * (c0 * s - s0 * c * Math.cos(dA)), front: cosc > -0.2 };
}
/** Mean direction of a set of [ra, dec] points (works across RA 0/360). */
export function centroid(pts) {
  let x = 0, y = 0, z = 0;
  for (const [r, d] of pts) { x += Math.cos(d * D) * Math.cos(r * D); y += Math.cos(d * D) * Math.sin(r * D); z += Math.sin(d * D); }
  return [(Math.atan2(y, x) / D + 360) % 360, Math.atan2(z, Math.hypot(x, y)) / D];
}

// ---- the view: centre, and zoom as the half-height of the screen in degrees ----
export const ZOOM_MIN = 12, ZOOM_MAX = 80;
const scaleOf = (v, w, h) => (Math.min(w, h) / 2) / (2 * Math.tan(((v.fov || 45) * D) / 2));
/** Screen point (px) for a sky point. */
export function toScreen(v, w, h, ra, de) {
  const S = scaleOf(v, w, h), p = project(ra, de, v.ra, v.dec);
  return { X: w / 2 + p.x * S, Y: h / 2 - p.y * S, front: p.front && sep(ra, de, v.ra, v.dec) < 110 };
}
/** Sky point under a screen point. */
export function toSky(v, w, h, X, Y) {
  const S = scaleOf(v, w, h), x = (X - w / 2) / S, y = -(Y - h / 2) / S, rho = Math.hypot(x, y);
  if (rho < 1e-9) return [v.ra, v.dec];
  const c = 2 * Math.atan(rho / 2), s0 = Math.sin(v.dec * D), c0 = Math.cos(v.dec * D);
  const de = Math.asin(Math.cos(c) * s0 + (y * Math.sin(c) * c0) / rho) / D;
  const ra = v.ra - Math.atan2(x * Math.sin(c), rho * c0 * Math.cos(c) - y * s0 * Math.sin(c)) / D;
  return [((ra % 360) + 360) % 360, de];
}
/** Drag the sky: the point that was under (X0, Y0) moves to (X1, Y1). Returns a new view. */
export function pan(v, w, h, X0, Y0, X1, Y1) {
  const a = toSky(v, w, h, X0, Y0), b = toSky(v, w, h, X1, Y1);
  let dec = v.dec + (a[1] - b[1]); dec = Math.max(-88, Math.min(88, dec));
  let dra = a[0] - b[0]; if (dra > 180) dra -= 360; if (dra < -180) dra += 360;
  return { ...v, ra: (((v.ra + dra) % 360) + 360) % 360, dec };
}
export const zoom = (v, f) => ({ ...v, fov: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (v.fov || 45) * f)) });

/** Bright stars on screen: [{ s, X, Y }]. */
export function onScreen(v, w, h, list = STARS) {
  const out = [], reach = (v.fov || 45) * Math.hypot(w, h) / Math.min(w, h) * 1.2 + 5;
  for (const s of list) {
    if (sep(s[0], s[1], v.ra, v.dec) > reach) continue;
    const p = toScreen(v, w, h, s[0], s[1]);
    if (p.front && p.X > -20 && p.Y > -20 && p.X < w + 20 && p.Y < h + 20) out.push({ s, X: p.X, Y: p.Y });
  }
  return out;
}
/** The star a tap means: the nearest within reach px (brighter stars are easier to hit). */
export function nearestStar(list, X, Y, reach = 18) {
  let best = null, bd = Infinity;
  for (const p of list) { const d = Math.hypot(p.X - X, p.Y - Y) - Math.max(0, 2.5 - p.s[2]) * 1.5; if (d < bd) { bd = d; best = p; } }
  return bd <= reach ? best : null;
}

// ---- the figure to draw ----
export const starByHip = (hip) => STARS.find((s) => s[4] === hip);
export const nameOf = (s) => STAR_NAMES[s[4]] || "";
export const conName = (abbr) => CON_NAMES[abbr] || abbr;
export const edgeKey = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
/** The stick figure's edges [[hipA, hipB]] (limited to g.fig's stars when given). */
export function figureEdges(g) {
  const all = FIGURES[g.con] || [];
  return g.fig ? all.filter(([a, b]) => g.fig.includes(a) && g.fig.includes(b)) : all;
}
export const figureStars = (g) => [...new Set(figureEdges(g).flat())];
export function figureCentre(g) { return centroid(figureStars(g).map((h) => starByHip(h)).map((s) => [s[0], s[1]])); }
/** Where a search starts: well away from the target (60 to 120 degrees), so it has to be found. */
export function startView(g, seed = 0) {
  const [ra, de] = figureCentre(g), h = hash(g.id + ":" + seed);
  for (let i = 0; i < 40; i++) {
    const r = (ra + 70 + ((h + i * 37) % 120)) % 360, d = Math.max(-60, Math.min(60, de * -0.3 + (((h >> 3) + i * 13) % 80) - 40));
    if (sep(r, d, ra, de) >= 60) return { ra: r, dec: d, fov: 45 };
  }
  return { ra: (ra + 180) % 360, dec: 0, fov: 45 };
}
const hash = (s) => [...String(s)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

export const start = (g, L, seed = Math.floor(Math.random() * 1e6)) => ({ id: g.id, level: L.n, drawn: [], mistakes: 0, hints: 0, done: false, quiz: null, seed, total: figureEdges(g).length });
/** Try a line from star a to star b (HIP numbers). "edge" new line | "again" already drawn | "miss" not in the figure | "done" last line. */
export function attempt(run, g, a, b) {
  if (run.done || a === b) return null;
  const k = edgeKey(a, b), ok = figureEdges(g).some(([x, y]) => edgeKey(x, y) === k);
  if (!ok) { run.mistakes++; return "miss"; }
  if (run.drawn.includes(k)) return "again";
  run.drawn.push(k);
  if (run.drawn.length >= run.total) { run.done = true; return "done"; }
  return "edge";
}
/** A hint: the next line to draw (one touching what's drawn, if any). Costs a mistake. */
export function hintEdge(run, g) {
  if (run.done) return null;
  const left = figureEdges(g).filter(([a, b]) => !run.drawn.includes(edgeKey(a, b)));
  const touched = new Set(run.drawn.flatMap((k) => k.split("-").map(Number)));
  const e = left.find(([a, b]) => touched.has(a) || touched.has(b)) || left[0];
  run.hints++; run.mistakes++; return e || null;
}
export const starsFor = (m) => (m <= 1 ? 3 : m <= 4 ? 2 : 1);
/** How many parts of an n-part fable have been told after this much drawing (the first at the start, the last at the end). */
export const partsTold = (run, n) => (run.done ? n : Math.min(n - 1, 1 + Math.floor((run.drawn.length / Math.max(1, run.total)) * (n - 1))));
/** Pick a fable for this constellation, preferring one not heard yet. */
export function pickFable(p, g, rnd = Math.random) {
  const heard = room(p).heard, fresh = g.fables.map((f, i) => i).filter((i) => !heard.includes(g.id + ":" + i));
  const pool = fresh.length ? fresh : g.fables.map((f, i) => i);
  return pool[Math.floor(rnd() * pool.length)];
}

// ---- quiz ----
export function quizChoices(g) {
  const k = hash(g.id) % 4, w = g.quiz.wrong, all = [g.quiz.a, ...w];
  return [...all.slice(1, 1 + k), all[0], ...all.slice(1 + k)].slice(0, 4);
}
export function answer(run, g, choice) { if (run.quiz !== null) return run.quiz; run.quiz = choice === g.quiz.a; return run.quiz; }

// ---- real-sky facts computed from position ----
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** The month a sky point is highest around 9 pm local time. The Sun's RA is 0 h near March 20 and gains 2 h a month. */
export function bestMonth(ra) {
  const sunRa = ((ra / 15 - 9) % 24 + 24) % 24, days = (sunRa / 24) * 365.25, d = new Date(Date.UTC(2025, 2, 20) + days * 864e5);
  return MONTHS[d.getUTCMonth()];
}
/** Where on Earth a sky point ever rises. */
export function seenFrom(dec) {
  const d = Math.round(dec);
  if (d >= 0) return d >= 2 ? `Visible from everywhere north of about ${90 - d}°S.` : "Visible from almost everywhere on Earth.";
  return d <= -2 ? `Visible from everywhere south of about ${90 + d}°N.` : "Visible from almost everywhere on Earth.";
}
/** The galactic equator (the middle of the Milky Way) as RA/Dec points, J2000. */
export function galacticEquator(step = 4) {
  const ra0 = 192.85948 * D, de0 = 27.12825 * D, l0 = 122.93192 * D, pts = [];
  for (let l = 0; l <= 360; l += step) {
    const q = l0 - l * D; // b = 0: sin δ = cos δ_NGP · cos(l_NCP − l)
    pts.push([(((ra0 + Math.atan2(Math.sin(q), -Math.sin(de0) * Math.cos(q))) / D) % 360 + 360) % 360, Math.asin(Math.cos(de0) * Math.cos(q)) / D]);
  }
  return pts;
}

// ---- progress and scoring ----
export const room = (p) => {
  const r = ((p.rooms ||= {}).stars ||= { plays: 0, found: {}, heard: [], last: null });
  r.found ||= {}; r.heard ||= []; return r;
};
export const foundCount = (p, L) => (L ? DECK.filter((g) => room(p).found[keyOf(L, g)]).length : ALL.filter(({ L: l, g }) => room(p).found[keyOf(l, g)]).length);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const byId = (id) => DECK.find((g) => g.id === id);
export function nextTarget(p, L, after) {
  const open = DECK.filter((g) => !room(p).found[keyOf(L, g)] && g.id !== after);
  const pool = open.length ? open : DECK.filter((g) => g.id !== after);
  return pool[Math.floor(Math.random() * pool.length)] || DECK[0];
}
const levelOf = (run) => LEVELS[run.level - 1];
export const drawPts = (run) => (run.done ? Math.round(10 * starsFor(run.mistakes) * levelOf(run).mult) : 0);
export const quizPts = (run) => (run.quiz ? Math.round(5 * levelOf(run).mult) : 0);
export const scoreOf = (run) => drawPts(run) + quizPts(run);
/** Settle a finished drawing into progress. Returns { xp, essence, first, best, score }. */
export function settle(p, run, fable) {
  const r = room(p), k = run.level + ":" + run.id; r.plays++; r.last = run.id;
  if (fable != null && !r.heard.includes(run.id + ":" + fable)) r.heard.push(run.id + ":" + fable);
  const out = { xp: 0, essence: 0, first: false, best: false, score: scoreOf(run) };
  if (!run.done) { out.xp = 2; return out; }
  const prev = r.found[k] || 0; out.first = !prev;
  if (out.score > prev) { out.best = !!prev; out.xp = out.essence = out.score - prev; r.found[k] = out.score; }
  return out;
}
export const fablesHeard = (p) => room(p).heard.length;
export const FABLE_COUNT = DECK.reduce((n, g) => n + g.fables.length, 0);

// ---- the Observatory shelf in the Essence store (store.js registerShelf): one sky theme equipped at a time ----
export const KIND = "stars";
export const THEMES = [
  { id: "st-classic", name: "Planetarium sky", note: "Deep blue sky, true star colours", price: 0 },
  { id: "st-redlight", name: "Night-vision red chart", note: "Astronomers read charts by red light: it keeps their eyes adapted to the dark", price: 80 },
  { id: "st-chalk", name: "Chalkboard sky", note: "A teacher's chalk sketch of the heavens", price: 90 },
  { id: "st-atlas", name: "Antique star atlas", note: "Ink on parchment with a coordinate grid, like the engraved atlases of the 1600s", price: 120 },
  { id: "st-twinkle", name: "Twinkling sky", note: "Stars shimmer the way Earth's moving air makes them twinkle", price: 60 },
  { id: "st-grid", name: "Navigator's grid", note: "Lines of right ascension and declination, the sky's longitude and latitude", price: 70 },
  { id: "st-meteors", name: "Meteor shower", note: "Shooting stars: grains of comet dust burning up about 100 km above us", price: 100 },
  { id: "st-milkyway", name: "Milky Way glow", note: "The band of our galaxy, drawn along its true path, on levels 1 and 2 too", price: 150 },
];
/** The equipped theme id (prog.stars, set by the store), falling back to the free one. */
export const themeOf = (p) => (THEMES.some((t) => t.id === p[KIND]) && (p[KIND] === "st-classic" || (p.owned || []).includes(p[KIND])) ? p[KIND] : "st-classic");
export { LINES };
