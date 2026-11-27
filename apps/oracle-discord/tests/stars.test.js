// Star Lore Navigator: the sky data is real, every target can be found, and the scoring is fair.
import test from "node:test";
import assert from "node:assert/strict";
import { Constellation } from "astronomy-engine";
import { STARS, LINES, STAR_NAMES } from "../activity/src/stars/sky.gen.js";
import { LEVELS, ALL, targetStars, targetCentre, isHit, project, toScreen, toSky, viewFor, chartStars, sep, start, tap, useHint, answer, quizChoices,
  settle, scoreOf, foundCount, bestMonth, seenFrom, galacticEquator, starByHip, THEMES, themeOf, KIND, keyOf } from "../activity/src/stars/engine.js";
import { GUIDE } from "../activity/src/stars/guide.js";

test("star data: 88 figures, bright stars where they belong", () => {
  assert.equal(Object.keys(LINES).length, 88);
  assert.ok(STARS.length > 900);
  const named = (n) => STARS.find((s) => STAR_NAMES[s[4]] === n);
  for (const [n, con] of [["Polaris", "UMi"], ["Betelgeuse", "Ori"], ["Sirius", "CMa"], ["Vega", "Lyr"], ["Antares", "Sco"], ["Acrux", "Cru"], ["Alcyone", "Tau"], ["Arcturus", "Boo"]]) {
    const s = named(n); assert.ok(s, n); assert.equal(s[5], con, n); assert.equal(Constellation(s[0] / 15, s[1]).symbol, con, n);
  }
  assert.ok(named("Sirius")[2] < -1.4 && named("Sirius")[2] > -1.5, "Sirius is magnitude -1.46");
  assert.ok(named("Polaris")[1] > 89, "Polaris within a degree of the pole");
});

test("every target exists on the chart and is named as the lore says", () => {
  const want = { polaris: "Polaris", betelgeuse: "Betelgeuse", rigel: "Rigel", sirius: "Sirius", aldebaran: "Aldebaran", arcturus: "Arcturus", spica: "Spica",
    vega: "Vega", deneb: "Deneb", altair: "Altair", antares: "Antares", regulus: "Regulus", zhinu: "Vega", hokulea: "Arcturus", xin: "Antares", sopdet: "Sirius" };
  for (const { L, g } of ALL) {
    assert.ok(g.find && g.hint && g.lore.length >= 2 && g.science.length >= 3, g.id);
    if (g.target.con) { assert.ok(LINES[g.target.con], g.id); assert.ok(targetStars(g).length >= 5, g.id); }
    if (g.target.hip) for (const h of g.target.hip) assert.ok(starByHip(h), `${g.id}: HIP ${h}`);
    if (want[g.id]) assert.equal(STAR_NAMES[g.target.hip[0]], want[g.id]);
    // the target is on screen in every view the game can pick
    for (let seed = 0; seed < 25; seed++) {
      const v = viewFor(g, seed), [ra, de] = targetCentre(g), p = toScreen(v, 400, 300, ra, de);
      assert.ok(p.front && p.X > 20 && p.X < 380 && p.Y > 20 && p.Y < 280, `${g.id} seed ${seed}: ${p.X},${p.Y}`);
      if (g.target.hip) { const on = chartStars(v, 400, 300).map((x) => x.s[4]); assert.ok(g.target.hip.some((h) => on.includes(h)), `${g.id} seed ${seed} star drawn`); }
    }
  }
  assert.deepEqual(LEVELS.map((L) => L.deck.length), [12, 12, 10]);
  assert.equal(new Set(ALL.map(({ L, g }) => keyOf(L, g))).size, ALL.length);
});

test("Matariki is the Pleiades and Yacana's eyes are Alpha and Beta Centauri", () => {
  const g = (id) => ALL.find((x) => x.g.id === id).g;
  assert.ok(targetStars(g("matariki")).every((s) => s[5] === "Tau" && sep(s[0], s[1], 56.75, 24.12) < 1.2));
  assert.deepEqual(targetStars(g("yacana")).map((s) => STAR_NAMES[s[4]]).sort(), ["Hadar", "Rigil Kentaurus"]);
  const emu = g("emu"), acrux = STARS.find((s) => STAR_NAMES[s[4]] === "Acrux");
  assert.ok(sep(acrux[0], acrux[1], emu.target.near[0], emu.target.near[1]) < 9, "the Coalsack is beside the Cross");
});

test("projection: north up, east left, and taps map back to the sky", () => {
  const v = { ra: 80, dec: 10 };
  const e = project(90, 10, v.ra, v.dec), n = project(80, 20, v.ra, v.dec);
  assert.ok(e.x < 0, "east (higher RA) is to the left"); assert.ok(n.y > 0, "north is up");
  for (const [ra, de] of [[85, 5], [70, 30], [100, -15]]) {
    const p = toScreen(v, 400, 300, ra, de), back = toSky(v, 400, 300, p.X, p.Y);
    assert.ok(sep(ra, de, back[0], back[1]) < 1e-6);
  }
});

test("taps, lanterns and hints", () => {
  const L = LEVELS[0], g = L.deck.find((x) => x.id === "ori"), ori = targetStars(g)[0], sirius = starByHip(32349);
  assert.ok(isHit(g, ori) && !isHit(g, sirius));
  const run = start(g, L);
  assert.equal(tap(run, g, sirius), "miss"); assert.equal(run.lanterns, 2);
  assert.ok(useHint(run)); assert.equal(run.lanterns, 1); assert.ok(!useHint(run), "one hint only");
  assert.equal(tap(run, g, sirius), "out"); assert.ok(run.done && !run.found);
  const r2 = start(g, L); assert.equal(tap(r2, g, ori), "found"); assert.equal(tap(r2, g, ori), null);
  const emu = LEVELS[2].deck.find((x) => x.id === "emu"), r3 = start(emu, LEVELS[2]);
  assert.equal(tap(r3, emu, null, [192, -62]), "found");
});

test("quiz: four different answers, exactly one right", () => {
  for (const { g } of ALL) {
    const c = quizChoices(g); assert.equal(c.length, 4, g.id); assert.equal(new Set(c).size, 4, g.id);
    assert.equal(c.filter((x) => x === g.quiz.a).length, 1, g.id);
  }
});

test("scoring: first find pays, replays pay only the improvement", () => {
  const L = LEVELS[1], g = L.deck[0], p = { xp: 0, essence: 0 };
  const a = start(g, L); tap(a, g, starByHip(g.target.hip[0])); answer(a, g, g.quiz.a);
  assert.equal(scoreOf(a), Math.round(4 * 3 * 1.5) + Math.round(5 * 1.5));
  const s1 = settle(p, a); assert.ok(s1.first); assert.equal(s1.xp, 26); assert.equal(foundCount(p), 1);
  const b = start(g, L); useHint(b); tap(b, g, starByHip(g.target.hip[0])); answer(b, g, "nope");
  const s2 = settle(p, b); assert.equal(s2.xp, 0); assert.equal(p.rooms.stars.found[keyOf(L, g)], 26); assert.equal(p.rooms.stars.plays, 2);
  const c = start(g, L); tap(c, g, starByHip(11)); tap(c, g, starByHip(11)); tap(c, g, starByHip(11));
  assert.equal(settle(p, c).xp, 2, "a lost search still gives a little ✦");
});

test("real-sky facts: seasons, latitudes and the Milky Way", () => {
  const month = (id) => bestMonth(targetCentre(ALL.find((x) => x.g.id === id).g)[0]);
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
});
