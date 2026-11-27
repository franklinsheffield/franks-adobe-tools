// Star Lore Navigator rules and sky maths, kept pure for tests. Progress lives in prog.rooms.stars:
//   { plays, found: { "<level>:<id>": bestScore }, owned: [shop ids], style: { chart, extras[] }, last }
// Each search has 3 lanterns. A wrong tap or a hint costs one. Finding the target scores 4 per lantern left, then one
// quiz question on the real astronomy adds 5. Points scale with the level. First finds pay ✦ and 💎; replays pay only
// the improvement on your best.
import { STARS, LINES, CON_NAMES, STAR_NAMES } from "./sky.gen.js";
import { LEVELS } from "./lore.js";

export { LEVELS };
export const LANTERNS = 3, PER_LANTERN = 4, QUIZ_PTS = 5;
export const ALL = LEVELS.flatMap((L) => L.deck.map((g) => ({ L, g })));
export const keyOf = (L, g) => L.n + ":" + g.id;
export const TITLES = [{ at: 0, name: "Stargazer" }, { at: 6, name: "Sky Watcher" }, { at: 14, name: "Star Hopper" }, { at: 24, name: "Navigator" }, { at: ALL.length, name: "Keeper of Star Lore" }];

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
  const ra = (Math.atan2(y, x) / D + 360) % 360, de = Math.atan2(z, Math.hypot(x, y)) / D;
  return [ra, de];
}

export const starByHip = (hip) => STARS.find((s) => s[4] === hip);
export const nameOf = (s) => STAR_NAMES[s[4]] || "";
/** The stars that count as the target, and the sky point at its middle. */
export function targetStars(g) {
  const t = g.target;
  if (t.con) return STARS.filter((s) => s[5] === t.con);
  if (t.hip) return t.hip.map(starByHip).filter(Boolean);
  return [];
}
export function targetCentre(g) {
  const t = g.target;
  if (t.near) return [t.near[0], t.near[1]];
  if (t.con && LINES[t.con]) return centroid(LINES[t.con].flat());
  return centroid(targetStars(g).map((s) => [s[0], s[1]]));
}
/** Does a tap on this star (or this sky point) find the target? */
export function isHit(g, star, point) {
  const t = g.target;
  if (t.near) return !!point && sep(point[0], point[1], t.near[0], t.near[1]) <= t.near[2];
  if (!star) return false;
  if (t.con) return star[5] === t.con;
  return t.hip.includes(star[4]);
}

// ---- the chart view: the target is never dead centre, so you have to look ----
const hash = (s) => [...String(s)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
export const FIELD = 50; // degrees from the view centre to the chart edge (short side)
/** View centre for a search: offset 12 to 24 degrees from the target in a direction set by seed. */
export function viewFor(g, seed = 0) {
  const [ra, de] = targetCentre(g), h = hash(g.id + ":" + seed), ang = (h % 360) * D, off = 12 + (h % 13);
  let dec = de + off * Math.sin(ang);
  dec = Math.max(-82, Math.min(82, dec));
  const r = (ra + (off * Math.cos(ang)) / Math.max(0.25, Math.cos(de * D)) + 360) % 360;
  return { ra: r, dec, scale: 1 };
}
/** Stars on the chart at width w, height h (px): [{ s, X, Y, r }], brightest first. */
export function chartStars(view, w, h) {
  const S = (Math.min(w, h) / 2) / (2 * Math.tan((FIELD * D) / 2)), out = [];
  for (const s of STARS) {
    if (sep(s[0], s[1], view.ra, view.dec) > 95) continue;
    const p = project(s[0], s[1], view.ra, view.dec); if (!p.front) continue;
    const X = w / 2 + p.x * S, Y = h / 2 - p.y * S;
    if (X < -10 || Y < -10 || X > w + 10 || Y > h + 10) continue;
    out.push({ s, X, Y, r: Math.max(0.7, 3.6 - 0.62 * s[2]) });
  }
  return out;
}
/** Screen point for any sky point (for lines, labels and the Milky Way). */
export function toScreen(view, w, h, ra, de) {
  const S = (Math.min(w, h) / 2) / (2 * Math.tan((FIELD * D) / 2)), p = project(ra, de, view.ra, view.dec);
  return { X: w / 2 + p.x * S, Y: h / 2 - p.y * S, front: p.front && sep(ra, de, view.ra, view.dec) < 100 };
}
/** Inverse of toScreen: which sky point is under a tap. */
export function toSky(view, w, h, X, Y) {
  const S = (Math.min(w, h) / 2) / (2 * Math.tan((FIELD * D) / 2)), x = (X - w / 2) / S, y = -(Y - h / 2) / S;
  const rho = Math.hypot(x, y); if (rho < 1e-9) return [view.ra, view.dec];
  const c = 2 * Math.atan(rho / 2), s0 = Math.sin(view.dec * D), c0 = Math.cos(view.dec * D);
  const de = Math.asin(Math.cos(c) * s0 + (y * Math.sin(c) * c0) / rho) / D;
  const ra = view.ra - Math.atan2(x * Math.sin(c), rho * c0 * Math.cos(c) - y * s0 * Math.sin(c)) / D;
  return [(ra + 360) % 360, de];
}
/** The star a tap means: the nearest within reach px, preferring brighter stars when close. */
export function nearestStar(stars, X, Y, reach = 16) {
  let best = null, bd = Infinity;
  for (const p of stars) { const d = Math.hypot(p.X - X, p.Y - Y) - p.r * 0.8; if (d < bd) { bd = d; best = p; } }
  return bd <= reach ? best : null;
}

/** The galactic equator (the middle of the Milky Way) as RA/Dec points, J2000. */
export function galacticEquator(step = 4) {
  const ra0 = 192.85948 * D, de0 = 27.12825 * D, l0 = 122.93192 * D, pts = [];
  for (let l = 0; l <= 360; l += step) {
    const q = l0 - l * D; // b = 0: sin δ = cos δ_NGP · cos(l_NCP − l)
    const dec = Math.asin(Math.cos(de0) * Math.cos(q)) / D;
    const ra = (ra0 + Math.atan2(Math.sin(q), -Math.sin(de0) * Math.cos(q))) / D;
    pts.push([((ra % 360) + 360) % 360, dec]);
  }
  return pts;
}

// ---- real-sky facts computed from position ----
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** The month a sky point is highest around 9 pm local time. The Sun's RA is 0 h near March 20 and gains 2 h a month. */
export function bestMonth(ra) {
  const sunRa = ((ra / 15 - 9) % 24 + 24) % 24, days = (sunRa / 24) * 365.25, d = new Date(Date.UTC(2025, 2, 20) + days * 864e5);
  return MONTHS[d.getUTCMonth()];
}
/** Where on Earth a sky point ever rises: latitudes from -90 to 90 - dec (north) or dec + 90 (south). */
export function seenFrom(dec) {
  const d = Math.round(dec);
  if (d >= 0) return d >= 2 ? `Visible from everywhere north of about ${90 - d}°S.` : "Visible from almost everywhere on Earth.";
  return d <= -2 ? `Visible from everywhere south of about ${90 + d}°N.` : "Visible from almost everywhere on Earth.";
}
export const conName = (abbr) => CON_NAMES[abbr] || abbr;

// ---- progress and scoring ----
export const room = (p) => {
  const r = ((p.rooms ||= {}).stars ||= { plays: 0, found: {}, owned: [], style: { chart: "classic", extras: [] }, last: null });
  r.found ||= {}; r.owned ||= []; r.style ||= { chart: "classic", extras: [] }; r.style.extras ||= []; return r;
};
export const foundCount = (p, L) => (L ? L.deck.filter((g) => room(p).found[keyOf(L, g)]).length : ALL.filter(({ L: l, g }) => room(p).found[keyOf(l, g)]).length);
export const titleOf = (n) => TITLES.reduce((a, t) => (n >= t.at ? t : a), TITLES[0]);
export const nextTitle = (n) => TITLES.find((t) => t.at > n) || null;
export const byId = (id, L) => L.deck.find((g) => g.id === id);
export function nextTarget(p, L, after) {
  const open = L.deck.filter((g) => !room(p).found[keyOf(L, g)] && g.id !== after);
  const pool = open.length ? open : L.deck.filter((g) => g.id !== after);
  return pool[Math.floor(Math.random() * pool.length)] || L.deck[0];
}

export const start = (g, L) => ({ id: g.id, level: L.n, lanterns: LANTERNS, hinted: false, misses: 0, found: false, done: false, quiz: null, seed: Math.floor(Math.random() * 1e6) });
/** Use the hint (once): costs a lantern but never the last one. */
export function useHint(run) { if (run.hinted || run.done || run.lanterns <= 1) return false; run.hinted = true; run.lanterns--; return true; }
/** A tap: "found" | "miss" | "out" | null. */
export function tap(run, g, star, point) {
  if (run.done || run.found) return null;
  if (isHit(g, star, point)) { run.found = true; return "found"; }
  run.misses++; run.lanterns--;
  if (run.lanterns <= 0) { run.done = true; return "out"; }
  return "miss";
}
/** Four quiz answers, stable per target, the right one at a varying place. */
export function quizChoices(g) {
  const k = hash(g.id) % 4, w = g.quiz.wrong;
  const all = [g.quiz.a, ...w]; return [...all.slice(1, 1 + k), all[0], ...all.slice(1 + k)].slice(0, 4);
}
export function answer(run, g, choice) { if (run.quiz !== null) return run.quiz; run.quiz = choice === g.quiz.a; run.done = true; return run.quiz; }

const levelOf = (run) => LEVELS[run.level - 1];
export const findPts = (run) => (run.found ? Math.round(PER_LANTERN * run.lanterns * levelOf(run).mult) : 0);
export const quizPts = (run) => (run.quiz ? Math.round(QUIZ_PTS * levelOf(run).mult) : 0);
export const scoreOf = (run) => findPts(run) + quizPts(run);
/** Settle a finished search into progress. Returns { xp, essence, first, best, score }. */
export function settle(p, run) {
  const r = room(p), k = run.level + ":" + run.id; r.plays++; r.last = run.id;
  const out = { xp: 0, essence: 0, first: false, best: false, score: scoreOf(run) };
  if (!run.found) { out.xp = 2; return out; }
  const prev = r.found[k] || 0; out.first = !prev;
  if (out.score > prev) { out.best = !!prev; out.xp = out.essence = out.score - prev; r.found[k] = out.score; }
  return out;
}

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
  { id: "st-milkyway", name: "Milky Way glow", note: "The band of our galaxy, drawn along its true path, the galactic equator", price: 150 },
];
/** The equipped theme id (prog.stars, set by the store), falling back to the free one. */
export const themeOf = (p) => (THEMES.some((t) => t.id === p[KIND]) && (p[KIND] === "st-classic" || (p.owned || []).includes(p[KIND])) ? p[KIND] : "st-classic");
