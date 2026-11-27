// Star Lore Navigator: the sky data is real, every figure can be drawn, the search starts away from the target, and scoring is fair.
import test from "node:test";
import assert from "node:assert/strict";
import { Constellation } from "astronomy-engine";
import { STARS, LINES, FIGURES, FAINT, MILKY_WAY, STAR_NAMES } from "../activity/src/stars/sky.gen.js";
import { LEVELS, DECK, ALL, keyOf, project, toScreen, toSky, pan, zoom, ZOOM_MIN, ZOOM_MAX, onScreen, nearestStar, sep, starByHip,
  figureEdges, figureStars, figureCentre, startView, start, attempt, hintEdge, starsFor, partsTold, pickFable, quizChoices, answer,
  settle, scoreOf, foundCount, spin, timeFor, bestMonth, seenFrom, galacticEquator, THEMES, themeOf, KIND, FABLE_COUNT, fablesHeard } from "../activity/src/stars/engine.js";
import { GUIDE } from "../activity/src/stars/guide.js";

const g = (id) => DECK.find((x) => x.id === id);

test("star data: 88 figures, bright stars where they belong, faint stars and the Milky Way", () => {
  assert.equal(Object.keys(LINES).length, 88);
  assert.equal(Object.keys(FIGURES).length, 88);
  assert.ok(STARS.length > 900 && FAINT.length > 3000, `${STARS.length} / ${FAINT.length}`);
  assert.ok(FAINT.every((s) => s[2] <= 6.05));
  assert.ok(MILKY_WAY.length >= 3);
  const named = (n) => STARS.find((s) => STAR_NAMES[s[4]] === n);
  for (const [n, con] of [["Polaris", "UMi"], ["Betelgeuse", "Ori"], ["Sirius", "CMa"], ["Vega", "Lyr"], ["Antares", "Sco"], ["Acrux", "Cru"], ["Alcyone", "Tau"], ["Arcturus", "Boo"]]) {
    const s = named(n); assert.ok(s, n); assert.equal(s[5], con, n); assert.equal(Constellation(s[0] / 15, s[1]).symbol, con, n);
  }
  assert.ok(named("Sirius")[2] < -1.4 && named("Sirius")[2] > -1.5, "Sirius is magnitude -1.46");
  assert.ok(named("Polaris")[1] > 89, "Polaris within a degree of the pole");
});

test("every figure in the deck can be drawn from real stars", () => {
  assert.equal(DECK.length, 30);
  for (const c of DECK) {
    const e = figureEdges(c);
    assert.ok(e.length >= 2, c.id);
    assert.ok(c.find && c.fables.length >= 2 && c.science.length >= 3, c.id);
    for (const f of c.fables) assert.ok(f.c && f.t && f.parts.length >= 3, `${c.id}: ${f.t}`);
    for (const h of figureStars(c)) { const s = starByHip(h); assert.ok(s, `${c.id}: HIP ${h}`); if (![677, 25428].includes(h)) assert.equal(s[5], c.con, `${c.id}: HIP ${h} in ${s[5]}`); } // Alpheratz (And) closes the Square of Pegasus; Elnath (Tau) is a corner of Auriga
    // the figure is connected (the Southern Cross is two crossing bars)
    const seen = new Set([e[0][0]]); let grew = true;
    while (grew) { grew = false; for (const [a, b] of e) if (seen.has(a) !== seen.has(b)) { seen.add(a); seen.add(b); grew = true; } }
    if (c.id !== "cru") assert.equal(seen.size, figureStars(c).length, `${c.id} connected`);
  }
  assert.deepEqual(figureStars(g("cru")).map((h) => STAR_NAMES[h]).sort(), ["Acrux", "Gacrux", "Imai", "Mimosa"]);
  assert.ok(figureStars(g("ori")).some((h) => STAR_NAMES[h] === "Betelgeuse") && figureStars(g("ori")).some((h) => STAR_NAMES[h] === "Rigel"));
  assert.ok(figureStars(g("lyr")).some((h) => STAR_NAMES[h] === "Vega"));
  assert.equal(ALL.length, 90); assert.equal(new Set(ALL.map(({ L, g }) => keyOf(L, g))).size, 90);
  assert.ok(FABLE_COUNT >= 35);
});

test("levels: figures on level 1, none on 2, photo-real on 3", () => {
  assert.deepEqual(LEVELS.map((L) => L.guide), ["lines", "none", "none"]);
  assert.deepEqual(LEVELS.map((L) => L.mult), [1, 1.5, 2]);
  assert.match(LEVELS[2].what, /photo-real/i);
});

test("the search starts far from the target, so it has to be found", () => {
  for (const c of DECK) for (let seed = 0; seed < 20; seed++) {
    const v = startView(c, seed), [ra, de] = figureCentre(c);
    assert.ok(sep(v.ra, v.dec, ra, de) >= 60, `${c.id} seed ${seed}`);
    assert.ok(!onScreen(v, 400, 300).some((s) => figureStars(c).includes(s[4])), `${c.id} seed ${seed}: figure already visible`);
  }
});

test("projection, panning and zooming", () => {
  const v = { ra: 80, dec: 10, fov: 45 };
  const e = project(90, 10, v.ra, v.dec), n = project(80, 20, v.ra, v.dec);
  assert.ok(e.x < 0, "east (higher RA) is to the left"); assert.ok(n.y > 0, "north is up");
  for (const [ra, de] of [[85, 5], [70, 30], [100, -15]]) {
    const p = toScreen(v, 400, 300, ra, de), back = toSky(v, 400, 300, p.X, p.Y);
    assert.ok(sep(ra, de, back[0], back[1]) < 1e-6);
  }
  // dragging a star moves it with the finger
  const p0 = toScreen(v, 400, 300, 85, 5), v2 = pan(v, 400, 300, p0.X, p0.Y, p0.X + 60, p0.Y - 40), p1 = toScreen(v2, 400, 300, 85, 5);
  assert.ok(Math.hypot(p1.X - p0.X - 60, p1.Y - p0.Y + 40) < 4, `${p1.X},${p1.Y}`);
  // the whole sky is reachable, including the poles
  let w = { ra: 0, dec: 0, fov: 45 }; for (let i = 0; i < 20; i++) w = pan(w, 400, 300, 200, 50, 200, 250);
  assert.ok(w.dec > 80 && w.dec <= 90, `dec ${w.dec}`);
  assert.equal(zoom(v, 100).fov, ZOOM_MAX); assert.equal(zoom(v, 0.01).fov, ZOOM_MIN);
  const ori = figureCentre(g("ori")), vo = { ra: ori[0], dec: ori[1], fov: 45 }, bet = starByHip(27989), pb = toScreen(vo, 400, 300, bet[0], bet[1]);
  assert.equal(nearestStar(onScreen(vo, 400, 300), pb.X + 5, pb.Y + 5).s[4], 27989);
});

test("drawing: right lines, mistakes, hints, done", () => {
  const c = g("cru"), L = LEVELS[0], r = start(c, L, 1), [[a, b], [x, y]] = figureEdges(c);
  assert.equal(attempt(r, c, a, a), null);
  assert.equal(attempt(r, c, a, x === a || x === b ? y : x), "miss"); assert.equal(r.mistakes, 1);
  assert.equal(attempt(r, c, b, a), "edge", "either direction");
  assert.equal(attempt(r, c, a, b), "again"); assert.equal(r.mistakes, 1);
  const h = hintEdge(r, c); assert.deepEqual(h, [x, y]); assert.equal(r.mistakes, 2); assert.equal(r.hints, 1);
  assert.equal(attempt(r, c, x, y), "done"); assert.ok(r.done); assert.equal(attempt(r, c, x, y), null);
  assert.deepEqual([0, 1, 2, 4, 5, 9].map(starsFor), [3, 3, 2, 2, 1, 1]);
});

test("the fable unfolds as you draw and prefers stories not heard yet", () => {
  const c = g("ori"), r = start(c, LEVELS[0], 1), n = 5;
  assert.equal(partsTold(r, n), 1);
  const told = [];
  for (const [a, b] of figureEdges(c)) { attempt(r, c, a, b); told.push(partsTold(r, n)); }
  assert.ok(told.every((t, i) => i === 0 || t >= told[i - 1]), "never goes back");
  assert.equal(told.at(-1), n);
  const p = {}; const seen = new Set();
  for (let i = 0; i < c.fables.length; i++) { const f = pickFable(p, c, () => 0.99); assert.ok(!seen.has(f)); seen.add(f); p.rooms.stars.heard.push(c.id + ":" + f); }
  assert.equal(seen.size, c.fables.length);
  assert.ok(Number.isInteger(pickFable(p, c)), "all heard: still picks one");
});

test("quiz: four different answers, exactly one right", () => {
  for (const c of DECK) {
    const ch = quizChoices(c); assert.equal(ch.length, 4, c.id); assert.equal(new Set(ch).size, 4, c.id);
    assert.equal(ch.filter((x) => x === c.quiz.a).length, 1, c.id);
  }
});

test("scoring: first find pays, replays pay only the improvement", () => {
  const L = LEVELS[1], c = g("cru"), p = { xp: 0, essence: 0 };
  const a = start(c, L, 1); for (const [x, y] of figureEdges(c)) attempt(a, c, x, y); answer(a, c, c.quiz.a);
  assert.equal(scoreOf(a), Math.round(10 * 3 * 1.5) + Math.round(5 * 1.5));
  const s1 = settle(p, a, 0); assert.ok(s1.first); assert.equal(s1.xp, 53); assert.equal(foundCount(p), 1); assert.equal(fablesHeard(p), 1);
  const b = start(c, L, 2); hintEdge(b, c); hintEdge(b, c); for (const [x, y] of figureEdges(c)) attempt(b, c, x, y); answer(b, c, "nope");
  const s2 = settle(p, b, 0); assert.equal(s2.xp, 0); assert.equal(p.rooms.stars.found[keyOf(L, c)], 53); assert.equal(p.rooms.stars.plays, 2); assert.equal(fablesHeard(p), 1);
  const d = start(c, L, 3); assert.equal(settle(p, d, 1).xp, 2, "giving up still gives a little ✦"); assert.equal(fablesHeard(p), 2);
});

test("real-sky facts: seasons, latitudes and the Milky Way", () => {
  const month = (id) => bestMonth(figureCentre(g(id))[0]);
  assert.equal(month("ori"), "January"); assert.equal(month("sco"), "July"); assert.equal(month("cyg"), "September"); assert.equal(month("leo"), "April");
  assert.match(seenFrom(-60), /south of about 30°N/); assert.match(seenFrom(45), /north of about 45°S/);
  const gc = galacticEquator(1)[0]; assert.ok(sep(gc[0], gc[1], 266.4, -28.94) < 0.1, "l = 0 is the galactic centre in Sagittarius");
  assert.ok(galacticEquator(1).some(([r, d]) => sep(r, d, 310.36, 45.28) < 5), "the Milky Way runs past Deneb");
});

test("store shelf and study guide", () => {
  assert.equal(KIND, "stars");
  assert.ok(THEMES.every((t) => t.id.startsWith("st-") && t.name && t.note));
  assert.equal(THEMES.filter((t) => t.price === 0).length, 1);
  assert.equal(themeOf({}), "st-classic");
  assert.equal(themeOf({ stars: "st-atlas", owned: [] }), "st-classic", "not owned: falls back");
  assert.equal(themeOf({ stars: "st-atlas", owned: ["st-atlas"] }), "st-atlas");
  assert.ok(GUIDE.sections.length >= 8);
  assert.match(GUIDE.sections[0].p.join(" "), /draw/);
});

test("sky ball turns the sky; the clock fits the figure", () => {
  const v = { ra: 100, dec: 10, fov: 45 };
  assert.ok(spin(v, 10, 0).ra > v.ra, "dragging the ball right brings the eastern sky round");
  assert.ok(spin(v, 0, 10).dec > v.dec, "dragging down brings the north");
  assert.equal(spin({ ra: 355, dec: 0 }, 10, 0).ra, 7);
  assert.equal(spin(v, 0, 500).dec, 89); assert.equal(spin(v, 0, -500).dec, -89);
  for (const L of LEVELS) for (const c of DECK) { const t = timeFor(c, L); assert.ok(t >= 60 && t <= 220, `${c.id} L${L.n}: ${t}`); }
  assert.ok(timeFor(g("sco"), LEVELS[0]) > timeFor(g("cru"), LEVELS[0]), "bigger figures get more time");
  assert.ok(timeFor(g("ori"), LEVELS[2]) < timeFor(g("ori"), LEVELS[0]), "higher levels are tighter");
});
