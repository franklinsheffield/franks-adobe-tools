// Sacred Geometry Builder: the compass-and-straightedge engine, pure so tests can run every construction.
// Objects: circles { t: "c", c: [x, y], r } and segments { t: "s", a: [x, y], b: [x, y] }. Points are the level's given
// points plus every crossing of two objects (circle-circle, circle-segment, segment-segment). The player can only start
// a line or circle on a point that exists, exactly as Euclid's rules allow.
import { LEVELS, byId, TIERS } from "./levels.js";

export const EPS = 0.5;
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const near = (a, b, e = EPS) => dist(a, b) < e;

export const circle = (c, through) => ({ t: "c", c, r: dist(c, through), p: through });
export const segment = (a, b) => ({ t: "s", a, b });
/** A step from a level ({ t, c, p } or { t, a, b }) as an object. */
export const objOf = (s) => (s.t === "c" ? circle(s.c, s.p) : segment(s.a, s.b));

// ---- crossings ----
function onSeg(p, s, e = 1e-6) {
  const [ax, ay] = s.a, [bx, by] = s.b, L2 = (bx - ax) ** 2 + (by - ay) ** 2;
  if (!L2) return false;
  const u = ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / L2;
  return u >= -e && u <= 1 + e;
}
function cc(A, B) {
  const d = dist(A.c, B.c); if (d < 1e-9 || d > A.r + B.r + 1e-6 || d < Math.abs(A.r - B.r) - 1e-6) return [];
  const a = (A.r * A.r - B.r * B.r + d * d) / (2 * d), h = Math.sqrt(Math.max(0, A.r * A.r - a * a));
  const mx = A.c[0] + (a * (B.c[0] - A.c[0])) / d, my = A.c[1] + (a * (B.c[1] - A.c[1])) / d;
  const ox = (-h * (B.c[1] - A.c[1])) / d, oy = (h * (B.c[0] - A.c[0])) / d;
  return h < 1e-6 ? [[mx, my]] : [[mx + ox, my + oy], [mx - ox, my - oy]];
}
function cs(C, S) {
  const [ax, ay] = S.a, dx = S.b[0] - ax, dy = S.b[1] - ay, fx = ax - C.c[0], fy = ay - C.c[1];
  const a = dx * dx + dy * dy, b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - C.r * C.r, D = b * b - 4 * a * c;
  if (a < 1e-9 || D < -1e-6) return [];
  const sq = Math.sqrt(Math.max(0, D)), us = sq < 1e-6 ? [-b / (2 * a)] : [(-b - sq) / (2 * a), (-b + sq) / (2 * a)];
  return us.filter((u) => u >= -1e-6 && u <= 1 + 1e-6).map((u) => [ax + u * dx, ay + u * dy]);
}
function ss(S, T) {
  const r = [S.b[0] - S.a[0], S.b[1] - S.a[1]], s = [T.b[0] - T.a[0], T.b[1] - T.a[1]], den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return [];
  const q = [T.a[0] - S.a[0], T.a[1] - S.a[1]], u = (q[0] * s[1] - q[1] * s[0]) / den, v = (q[0] * r[1] - q[1] * r[0]) / den;
  return u >= -1e-6 && u <= 1 + 1e-6 && v >= -1e-6 && v <= 1 + 1e-6 ? [[S.a[0] + u * r[0], S.a[1] + u * r[1]]] : [];
}
export function cross(A, B) {
  if (A.t === "c" && B.t === "c") return cc(A, B);
  if (A.t === "c") return cs(A, B);
  if (B.t === "c") return cs(B, A);
  return ss(A, B);
}

/** Every point on the board: given points, the ends of segments, and all crossings. Deduplicated. */
export function pointsOf(board) {
  const out = [], add = (p) => { if (!out.some((q) => near(p, q))) out.push(p); };
  board.given.pts.forEach((p) => add([p[0], p[1]]));
  const objs = all(board);
  for (const o of objs) if (o.t === "s") { add(o.a); add(o.b); }
  for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) cross(objs[i], objs[j]).forEach(add);
  return out;
}
export const all = (board) => [...board.given.objs, ...board.drawn];
export const hasPoint = (board, p) => pointsOf(board).some((q) => near(p, q, 1));

// ---- matching drawn objects to a level's goals ----
const collinear = (p, s) => { const [ax, ay] = s.a, [bx, by] = s.b, L = dist(s.a, s.b); return L > 0 && Math.abs((bx - ax) * (p[1] - ay) - (by - ay) * (p[0] - ax)) / L < 1; };
/** Does object o draw goal g? Circles: same centre and radius. Segments: o lies along g and covers it end to end. */
export function covers(o, g) {
  if (o.t !== g.t) return false;
  if (g.t === "c") return near(o.c, g.c, 1) && Math.abs(o.r - g.r) < 1;
  return collinear(g.a, o) && collinear(g.b, o) && onSeg(g.a, o, 0.01) && onSeg(g.b, o, 0.01);
}
export const isDrawn = (board, g) => all(board).some((o) => covers(o, g));

// ---- the board ----
export function makeBoard(level) {
  return { id: level.id, given: { pts: level.given.pts || [], objs: (level.given.objs || []).map(objOf) }, drawn: [], moves: 0, hints: 0 };
}
/** Draw with a tool from point p to point q (snapped points). Returns the new object, or null if it can't be drawn. */
export function place(board, tool, p, q) {
  if (!p || !q || near(p, q) || !hasPoint(board, p) || !hasPoint(board, q)) return null;
  const o = tool === "compass" ? circle(p, q) : segment(p, q);
  if (all(board).some((x) => covers(x, o))) return null; // already on the board
  board.drawn.push(o); board.moves++; return o;
}
export const undo = (board) => board.drawn.pop() || null;

export const goalsOf = (level) => level.steps.filter((s, i) => !level.goal || level.goal.includes(i)).map(objOf);
export function progress(level, board) {
  const gs = goalsOf(level), done = gs.filter((g) => isDrawn(board, g)).length;
  return { done, total: gs.length, complete: done === gs.length };
}
/** The first step of the model solution that isn't on the board yet (the "Show me" ghost). */
export function nextStep(level, board) {
  const i = level.steps.findIndex((s) => !isDrawn(board, objOf(s)));
  return i < 0 ? null : { i, ...level.steps[i] };
}
export const par = (level) => level.steps.length;
/** ★★★ no hints and at most 2 extra moves; ★★ up to 2 hints; ★ otherwise. */
export function starsFor({ hints = 0, moves = 0, par: p = 0 }) {
  if (hints === 0 && moves <= p + 2) return 3;
  return hints <= 2 ? 2 : 1;
}
/** The Platonic solids quiz: ★★★ no wrong answers, ★★ up to 2, ★ more. */
export const quizStars = (wrong) => (wrong === 0 ? 3 : wrong <= 2 ? 2 : 1);

// ---- progress: prog.rooms.geometry = { plays, solved: { id: stars }, codex: [] } ----
export const XP_PER_STAR = 5, ESSENCE_PER_STAR = 5, FIRST_CLEAR = 5;
export const geo = (p) => { const g = ((p.rooms ||= {}).geometry ||= {}); g.plays ||= 0; g.solved ||= {}; g.codex ||= []; return g; };
export function complete(p, id, stars) {
  const g = geo(p), before = g.solved[id] || 0, lvl = byId(id);
  const gained = Math.max(0, stars - before), first = !before;
  g.plays++; if (stars > before) g.solved[id] = stars;
  let newCodex = null;
  if (lvl && lvl.codex && !g.codex.includes(lvl.codex)) { g.codex.push(lvl.codex); newCodex = lvl.codex; }
  return { first, stars, best: Math.max(stars, before), xp: gained * XP_PER_STAR + (first ? FIRST_CLEAR : 0), essence: gained * ESSENCE_PER_STAR + (first ? FIRST_CLEAR : 0), newCodex };
}
export const levelsOf = (tier) => LEVELS.filter((l) => l.tier === tier);
/** Every tier is open from the start; inside a tier each level opens when the one before it is drawn. */
export const unlocked = (p, id) => { const l = byId(id), list = levelsOf(l.tier), i = list.indexOf(l); return i === 0 || !!geo(p).solved[list[i - 1].id]; };
export const tierStars = (p, tier) => levelsOf(tier).reduce((n, l) => n + (geo(p).solved[l.id] || 0), 0);
export const TITLES = [{ at: 0, name: "Apprentice of the Compass" }, { at: 9, name: "Journeyman Geometer" }, { at: 21, name: "Master Builder" }, { at: LEVELS.length * 3, name: "Keeper of the Golden Ratio" }];
export const totalStars = (p) => TIERS.reduce((n, t) => n + tierStars(p, t.n), 0);
export const titleOf = (p) => TITLES.reduce((a, t) => (totalStars(p) >= t.at ? t : a), TITLES[0]);
