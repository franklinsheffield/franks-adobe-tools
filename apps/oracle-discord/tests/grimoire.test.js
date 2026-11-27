import test from "node:test";
import assert from "node:assert";
import { DANGER, EVIDENCE, ALL_PLANTS } from "../activity/src/grimoire/plants.js";
import { LEVELS, ALL, TITLES, LEAVES, start, moreClue, usePick, whichPlant, choices, guessName, guessSafety, guessClaim, settle, solvedCount, room, nextPlant, keyOf, scoreOf } from "../activity/src/grimoire/logic.js";
import { specimen, pageSvg, PAGE_THEMES } from "../activity/src/grimoire/sketch.js";
import { GUIDES, NOT_ADVICE, POISON_HELP } from "../activity/src/grimoire/guide.js";
import { shop, PAGES, themeOf } from "../activity/src/grimoire/shop.js";
import { registerShelf, STORE, ensureFree, buy } from "../activity/src/store.js";
import { fresh, activity } from "../activity/src/game.js";

test("Grimoire decks: three levels, complete pages, no clue names the plant", () => {
  assert.equal(LEVELS.length, 3);
  assert.equal(new Set(ALL_PLANTS.map((p) => p.id)).size, ALL_PLANTS.length, "ids unique across levels");
  for (const L of LEVELS) {
    assert.ok(L.deck.length >= 12, "level " + L.n);
    for (const p of L.deck) {
      assert.ok(p.emoji, p.id + " emoji");
      for (const k of ["name", "latin", "family", "folklore", "science", "safety"]) assert.ok(p[k] && String(p[k]).length > 2, `${p.id} ${k}`);
      assert.equal(p.clues.length, 5, p.id);
      assert.ok(p.danger.length && p.danger.every((d) => DANGER[d]), p.id + " danger");
      assert.ok(EVIDENCE[p.evidence], p.id + " evidence");
      assert.ok(p.claim && typeof p.claim.fact === "boolean" && p.claim.t && p.claim.why, p.id + " claim");
      assert.ok(p.look && p.look.habit && p.look.leaf, p.id + " look");
      const giveaway = p.name.toLowerCase();
      for (const c of p.clues) assert.ok(!c.toLowerCase().includes(giveaway), `${p.id} clue names the answer: ${c}`);
      if (p.danger[0] === "poison") assert.match(p.safety, /poison|deadly/i, p.id + " safety says it is poisonous");
    }
  }
  // each level teaches all three safety classes, and claims are a mix of science and folklore
  for (const L of LEVELS) for (const d of Object.keys(DANGER)) assert.ok(L.deck.some((p) => p.danger[0] === d), `level ${L.n} has a ${d} plant`);
  const facts = ALL_PLANTS.filter((p) => p.claim.fact).length;
  assert.ok(facts > ALL_PLANTS.length * 0.35 && facts < ALL_PLANTS.length * 0.75, "claims mix fact and folklore");
  assert.equal(TITLES.at(-1).at, ALL.length);
});

test("typed names: every alias matches within its level, small typos forgiven", () => {
  for (const L of LEVELS) for (const p of L.deck) for (const a of p.aliases) assert.equal(whichPlant(a, L)?.id, p.id, `L${L.n} ${a}`);
  const [L1, L2, L3] = LEVELS;
  assert.equal(whichPlant("Lavendar", L1)?.id, "lavender");
  assert.equal(whichPlant("St Johns Wort", L2)?.id, "stjohns");
  assert.equal(whichPlant("deadly night shade", L3)?.id, "belladonna");
  assert.equal(whichPlant("wolfsbane", L3)?.id, "monkshood");
  assert.equal(whichPlant("cucumber", L1), null);
  assert.equal(whichPlant("", L1), null);
});

test("a round: clues cost leaves, wrong names cost leaves, safety and claim score", () => {
  const L = LEVELS[1], p = L.deck.find((x) => x.id === "foxglove"), run = start(p, L);
  assert.equal(run.leaves, LEAVES);
  assert.ok(moreClue(run, p)); assert.equal(run.leaves, 4); assert.equal(run.shown, 2);
  const wrong = L.deck.find((x) => x.id !== p.id);
  assert.equal(guessName(run, p, wrong), "wrong"); assert.equal(run.leaves, 3);
  assert.equal(guessName(run, p, p), "right");
  assert.equal(guessSafety(run, p, "gentle"), false); assert.equal(guessSafety(run, p, "poison"), null, "one answer only");
  assert.equal(guessClaim(run, p, true), true);
  assert.equal(scoreOf(run), Math.round(3 * 1.5) * 3 + Math.round(5 * 1.5));
  const prog = fresh(), r = settle(prog, run);
  assert.ok(r.first && r.xp === r.score && r.essence === r.score);
  assert.equal(solvedCount(prog, L), 1);
  assert.ok(activity(prog) >= 1, "room plays count for progress merges");
  // a replay pays only the improvement
  const again = start(p, L); guessName(again, p, p); guessSafety(again, p, "poison"); guessClaim(again, p, true);
  const r2 = settle(prog, again);
  assert.equal(r2.xp, scoreOf(again) - r.score); assert.equal(room(prog).solved[keyOf(L, p)], scoreOf(again));
});

test("accepted safety answers: comfrey counts as care or poison", () => {
  const L = LEVELS[1], p = L.deck.find((x) => x.id === "comfrey");
  const a = start(p, L), b = start(p, L);
  assert.equal(guessSafety(a, p, "care"), true); assert.equal(guessSafety(b, p, "poison"), true);
});

test("running out of leaves ends the naming; one leaf is kept back from clues", () => {
  const L = LEVELS[0], p = L.deck[0], run = start(p, L);
  while (moreClue(run, p));
  assert.ok(run.leaves >= 1);
  const wrong = L.deck.filter((x) => x.id !== p.id);
  let r; for (const w of wrong) { r = guessName(run, p, w); if (r === "out") break; }
  assert.equal(r, "out"); assert.equal(run.won, false);
  const prog = fresh(); assert.equal(settle(prog, run).xp, 3); assert.equal(solvedCount(prog), 0);
});

test("multiple choice: four different names including the answer, stable; pick halves points", () => {
  for (const L of LEVELS) for (const p of L.deck) {
    const c = choices(p, L); assert.equal(c.length, 4); assert.equal(new Set(c.map((x) => x.id)).size, 4); assert.ok(c.some((x) => x.id === p.id));
    assert.deepEqual(choices(p, L).map((x) => x.id), c.map((x) => x.id));
  }
  const L = LEVELS[2], p = L.deck[0], a = start(p, L), b = start(p, L); usePick(b);
  guessName(a, p, p); guessName(b, p, p); assert.ok(scoreOf(b) < scoreOf(a));
});

test("nextPlant prefers plants not yet identified", () => {
  const prog = fresh(), L = LEVELS[0];
  for (const p of L.deck.slice(1)) room(prog).solved[keyOf(L, p)] = 10;
  for (let i = 0; i < 10; i++) assert.equal(nextPlant(prog, L).id, L.deck[0].id);
});

test("sketches: every plant draws a valid page in every theme", () => {
  for (const p of ALL_PLANTS) {
    const s = specimen(p); assert.ok(s.length > 200, p.id); assert.ok(!/NaN|undefined/.test(s), p.id + " clean SVG");
    for (const t of Object.values(PAGE_THEMES)) { const svg = pageSvg(p, { revealed: true, theme: t, poison: true }); assert.ok(svg.startsWith("<svg") && !/NaN|undefined/.test(svg), p.id); }
  }
  assert.ok(!pageSvg(ALL_PLANTS[0]).includes(ALL_PLANTS[0].name), "name hidden before reveal");
});

test("study guides: one per level, each ends with the not-medical-advice note and poison help", () => {
  for (const L of LEVELS) { const g = GUIDES[L.n]; assert.ok(g && g.sections.length >= 4);
    const text = g.sections.flatMap((s) => s.p).join(" "); assert.ok(text.includes(NOT_ADVICE)); assert.ok(text.includes(POISON_HELP)); }
});

test("Herbalist shelf: page styles in the Essence store, parchment free", () => {
  registerShelf(shop);
  assert.ok(PAGES.every((x) => x.id.startsWith("gr-")));
  for (const x of PAGES) assert.equal(STORE.find((s) => s.id === x.id)?.kind, "grimoire");
  const p = ensureFree(fresh()); assert.ok(p.owned.includes("gr-parchment"));
  p.essence = 100; assert.ok(buy(p, "gr-vellum")); assert.equal(p.essence, 40);
  p.grimoire = "gr-vellum"; assert.equal(themeOf(p), PAGE_THEMES.vellum); assert.equal(themeOf(fresh()), PAGE_THEMES.parchment);
  for (const k of ["open", "tryon", "buy"]) assert.ok(shop.talk[k].length);
});

test("show me 4: a wrong pick costs 3 leaves, a wrong typed name costs 1", () => {
  const L = LEVELS[0], p = L.deck[0], wrong = L.deck.find((x) => x.id !== p.id);
  const typed = start(p, L); guessName(typed, p, wrong); assert.equal(typed.leaves, LEAVES - 1);
  const picked = start(p, L); usePick(picked);
  assert.equal(guessName(picked, p, wrong), "wrong"); assert.equal(picked.leaves, LEAVES - 3);
  const other = L.deck.find((x) => x.id !== p.id && x.id !== wrong.id);
  assert.equal(guessName(picked, p, other), "out"); assert.equal(picked.leaves, 0);
  assert.ok(pageSvg(p, { leaves: 2, fell: 2, fellTo: 5 }).split("gr-fall").length - 1 === 3, "three leaves fall");
});

test("spot the look-alike: every pair is a safe plant and a poison double, with notes and tells", async () => {
  const { TWINS, twinPlants, nextTwin, layTwin, pickTwin, settleTwin, spottedCount } = await import("../activity/src/grimoire/twins.js");
  const { twinSvg } = await import("../activity/src/grimoire/sketch.js");
  assert.ok(TWINS.length >= 8); assert.equal(new Set(TWINS.map((t) => t.id)).size, TWINS.length);
  for (const t of TWINS) {
    const { safe, deadly } = twinPlants(t);
    assert.ok(safe && deadly, t.id + " plants exist");
    assert.notEqual(safe.danger[0], "poison", t.id + " safe one is not poison"); assert.equal(deadly.danger[0], "poison", t.id + " double is poison");
    assert.ok(t.notes.safe.length > 30 && t.notes.deadly.length > 30 && t.why.length > 30 && t.tells.length >= 2, t.id);
    const svg = twinSvg(safe, deadly, { revealed: true, poison: [false, true], picked: 0, right: 0, sparkle: true });
    assert.ok(svg.startsWith("<svg") && !/NaN|undefined/.test(svg), t.id + " svg");
    assert.ok(!twinSvg(safe, deadly).includes(safe.name), "names hidden before the pick");
  }
  const prog = fresh(), t = TWINS[0];
  const a = layTwin(t, () => 0.2); assert.equal(a.safeSide, 0);
  assert.equal(pickTwin(a, 0), true); assert.equal(pickTwin(a, 1), null, "one answer");
  const r = settleTwin(prog, a); assert.ok(r.first && r.xp === 15 && r.essence === 15); assert.equal(spottedCount(prog), 1);
  const b = layTwin(t, () => 0.9); pickTwin(b, 0); const r2 = settleTwin(prog, b); assert.equal(r2.xp, 1); assert.equal(r2.essence, 0);
  const c = layTwin(t, () => 0.9); pickTwin(c, 1); assert.equal(settleTwin(prog, c).xp, 3, "a replay pays a little");
  for (let i = 0; i < 20; i++) assert.notEqual(nextTwin(prog, TWINS[1].id).id, TWINS[1].id);
  assert.notEqual(nextTwin(prog, null, () => 0).id, t.id, "prefers pairs not yet spotted");
});
