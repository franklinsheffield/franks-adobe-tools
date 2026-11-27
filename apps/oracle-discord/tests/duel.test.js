import test from "node:test";
import assert from "node:assert";
import { ELEMENTS, EL, poolOf, isNoble } from "../activity/src/duel/elements.js";
import { COMPOUNDS, BY_ID, BY_KEY, CHAINS, parse, keyOf, pretty } from "../activity/src/duel/compounds.js";
import { LEVELS, CONDITIONS, START, HAND, GOAL, SHIELD, newGame, compoundOf, formable, cardsFor, balance, fizzleWhy, powerOf, place, unplace, clearBench, playBench, raiseShield, recycle, oracleMove, oracleTurn, glowing, bestHint, settle, room, codexCount, TITLES, rng, copiesOf } from "../activity/src/duel/logic.js";
import { SHOP, DEFAULT_LOOK, buyOrUse, lookOf, owns } from "../activity/src/duel/shop.js";
import { sceneSvg, molecule, kindOf, KIND } from "../activity/src/duel/scene.js";
import { room as duelRoomDef } from "../activity/src/duel/room.js";
import { registerShelf, STORE } from "../activity/src/store.js";
import { fresh, activity } from "../activity/src/game.js";

const card = (s, id) => ({ id, s });
const cards = (f) => { let i = 1000; return Object.entries(parse(f)).flatMap(([s, n]) => Array.from({ length: n }, () => card(s, ++i))); };

test("elements: real, unique, three tiers of about 20 / 40 / 52", () => {
  assert.equal(new Set(ELEMENTS.map((e) => e.s)).size, ELEMENTS.length);
  assert.equal(new Set(ELEMENTS.map((e) => e.z)).size, ELEMENTS.length);
  assert.equal(poolOf(1).length, 20); assert.equal(poolOf(2).length, 40); assert.ok(poolOf(3).length >= 50);
  // a few spot checks of real atomic numbers
  for (const [s, z] of [["H", 1], ["O", 8], ["Fe", 26], ["Ag", 47], ["Au", 79], ["U", 92]]) assert.equal(EL[s].z, z, s);
  for (const e of ELEMENTS) { assert.ok(e.fact.length > 20, e.s); assert.ok(e.ox.length, e.s); }
  for (const s of ["He", "Ne", "Ar"]) assert.ok(isNoble(s) && EL[s].tier === 1, s + " shield at Apprentice");
  // the deck leans on the abundant elements
  assert.ok(EL.H.w >= EL.Cu.w && EL.O.w >= EL.Fe.w && EL.O.w > EL.Au.w);
});

test("compounds: real formulas from the level's elements, fit a hand, charges balance", () => {
  assert.ok(COMPOUNDS.length >= 100);
  assert.equal(new Set(COMPOUNDS.map((c) => c.id)).size, COMPOUNDS.length, "unique formulas");
  assert.equal(Object.keys(BY_KEY).length, COMPOUNDS.length, "no two compounds share the same atoms");
  for (const c of COMPOUNDS) {
    for (const s of c.els) { assert.ok(EL[s], `${c.f}: ${s}`); assert.ok(EL[s].tier <= c.tier, `${c.f} uses ${s} before its level`); }
    assert.ok(c.n <= HAND, c.f + " fits a hand");
    assert.ok(balance(c.atoms), c.f + " charges balance with the cards' oxidation states");
    assert.ok(typeof c.dh === "number" && Math.abs(c.dh) < 2000, c.f);
    assert.ok(["s", "l", "g"].includes(c.ph) && c.name && c.fact.length > 20, c.f);
    assert.equal(c.endo, c.dh > 0);
  }
  for (const c of COMPOUNDS.filter((x) => x.tier === 1)) assert.equal(c.n, 2, c.f + " Apprentice = two atoms");
  assert.ok(COMPOUNDS.filter((x) => x.tier === 2).some((c) => c.n >= 5), "Chemist has multi-atom formulas");
  assert.deepEqual(parse("Ca(OH)2"), { Ca: 1, O: 2, H: 2 }); assert.deepEqual(parse("CH3OH"), { C: 1, H: 4, O: 1 }); assert.equal(pretty("H2SO4"), "H₂SO₄");
  // spot-check well-known enthalpies of formation (kJ/mol)
  for (const [f, dh] of [["H2O", -285.8], ["CO2", -393.5], ["NaCl", -411.2], ["NH3", -45.9], ["Al2O3", -1675.7], ["NO", 91.3]]) assert.equal(BY_ID[f].dh, dh, f);
  for (const ch of CHAINS) for (const s of ch.steps) assert.ok(BY_ID[s] && BY_ID[s].tier <= 3, ch.id + " " + s);
});

test("bench: real compounds in any order, levels gate formulas, fizzles teach", () => {
  const [L1, L2, L3] = LEVELS;
  assert.equal(compoundOf([card("Cl", 1), card("Na", 2)], L1).id, "NaCl");
  assert.equal(compoundOf(cards("H2O"), L1), null, "water is a Chemist compound");
  assert.equal(compoundOf(cards("H2O"), L2).id, "H2O");
  assert.equal(compoundOf(cards("Ca(OH)2"), L2), null); assert.equal(compoundOf(cards("Ca(OH)2"), L3).id, "Ca(OH)2");
  assert.match(fizzleWhy([card("Na", 1), card("O", 2)], L2), /don't balance.*Na₂O/);
  assert.doesNotMatch(fizzleWhy([card("Na", 1), card("O", 2)], L3), /Na₂O/, "Master gives no answer");
  assert.match(fizzleWhy([card("Ar", 1), card("Cl", 2)], L1), /Noble/);
  assert.match(fizzleWhy([card("O", 1), card("O", 2)], L1), /One kind/);
  assert.deepEqual(formable(cards("NaCl").concat(cards("HF")), L1).map((c) => c.id).sort(), ["HCl", "HF", "NaCl", "NaF", "NaH"].sort());
});

test("power: atoms + exothermic bonus, conditions, bonus compound, endothermic cost", () => {
  const g = newGame(2, 1); g.bonus = "SiC";
  g.cond = "cold"; const al = powerOf(BY_ID.Al2O3, g, "you"), hs = powerOf(BY_ID.H2S, g, "you");
  assert.ok(al.power > hs.power + 5, "Al2O3 hits much harder than H2S");
  g.cond = "vacuum"; const p1 = powerOf(BY_ID.CO2, g, "you").power; g.cond = "cold"; const p2 = powerOf(BY_ID.CO2, g, "you").power; assert.equal(p1 - p2, 4);
  g.cond = "water"; assert.equal(powerOf(BY_ID.HCl, g, "you").power - powerOf(BY_ID.HCl, { ...g, cond: "heat" }, "you").power, 2);
  g.cond = "oxygen"; assert.equal(powerOf(BY_ID.MgO, g, "you").power - powerOf(BY_ID.MgO, { ...g, cond: "cold" }, "you").power, 2);
  g.cond = "cold"; assert.equal(powerOf(BY_ID.NO, g, "you").cost, 1); g.cond = "heat"; assert.equal(powerOf(BY_ID.NO, g, "you").cost, 0); g.cond = "spark"; assert.equal(powerOf(BY_ID.NO, g, "you").cost, 0);
  g.cond = "cold"; g.bonus = "NaCl"; assert.ok(powerOf(BY_ID.NaCl, g, "you").notes.some((n) => n.includes("bonus")));
  assert.equal(CONDITIONS.length, 8);
});

test("a duel: place, react, damage, discoveries; shields; recycle; the Oracle plays legally", () => {
  const g = newGame(1, 42);
  assert.equal(g.you.hand.length, HAND); assert.equal(g.oracle.hand.length, HAND); assert.equal(g.you.hp, START);
  g.you.hand = [card("Na", 1), card("Cl", 2), card("Ar", 3), card("O", 4), card("H", 5), card("H", 6), card("Mg", 7)];
  g.cond = "cold"; g.bonus = "MgO";
  assert.ok(place(g, 3)); const sh = raiseShield(g); assert.equal(sh.shield, SHIELD); assert.equal(raiseShield(g), null, "once a turn");
  place(g, 1); place(g, 2); assert.ok(unplace(g, 2)); place(g, 2);
  const out = playBench(g); assert.ok(out.ok); assert.equal(out.c.id, "NaCl");
  assert.equal(g.oracle.hp, START - out.dmg); assert.deepEqual(g.you.found, ["NaCl"]); assert.equal(g.you.hand.length, HAND); assert.equal(g.turn, "oracle");
  const mv = oracleMove(g); if (mv.kind === "react") assert.ok(mv.cards.every((c) => g.oracle.hand.includes(c)) && compoundOf(mv.cards, LEVELS[0]));
  const before = g.you.hp, r = oracleTurn(g, mv);
  if (r.ok) assert.equal(g.you.hp, before - r.dmg - 0) ; if (r.ok && r.power <= SHIELD) assert.equal(r.dmg, 0, "shield blocks");
  assert.equal(g.turn, "you"); assert.equal(g.round, 2);
  // fizzle at Apprentice is free and keeps the cards
  g.you.hand = [card("Na", 11), card("O", 12), card("H", 13), card("H", 14), card("C", 15), card("Fe", 16), card("S", 17)];
  place(g, 11); place(g, 12); const hp = g.you.hp, fz = playBench(g); assert.equal(fz.ok, false); assert.equal(g.you.hp, hp); assert.equal(g.bench.length, 2); clearBench(g);
  assert.ok(glowing(g).size > 0); assert.ok(bestHint(g));
  place(g, 15); place(g, 16); const rc = recycle(g); assert.equal(rc.n, 2); assert.equal(g.you.hand.length, HAND); assert.equal(g.turn, "oracle");
});

test("Master: fizzles cost 2 and lose the bench, no undo, chains pay", () => {
  const g = newGame(3, 9); g.cond = "cold";
  g.you.hand = [card("Na", 1), card("O", 2), card("S", 3), card("O", 4), card("O", 5), card("O", 6), card("H", 7)];
  place(g, 1); assert.equal(unplace(g, 1), false); assert.equal(clearBench(g), false);
  place(g, 2); const f = playBench(g); assert.equal(f.ok, false); assert.equal(f.cost, 2); assert.equal(g.you.hp, START - 2); assert.equal(g.bench.length, 0); assert.equal(g.turn, "oracle");
  // chain: SO2 then SO3 on consecutive plays
  const g2 = newGame(3, 10); g2.cond = "cold"; g2.bonus = "LiH";
  g2.you.hand = cards("SO2").concat(cards("H2O"), [card("He", 99), card("He", 98)]).slice(0, 7);
  for (const c of cards("SO2")) { const h = g2.you.hand.find((x) => x.s === c.s && !g2.bench.includes(x)); place(g2, h.id); }
  const a = playBench(g2); assert.equal(a.c.id, "SO2"); assert.equal(a.chain.k, 0);
  g2.turn = "you"; g2.you.hand = cards("SO3").concat([card("He", 50), card("He", 51), card("He", 52)]);
  for (const c of [...g2.you.hand].filter((x) => x.s !== "He")) place(g2, c.id);
  const b = playBench(g2); assert.equal(b.c.id, "SO3"); assert.equal(b.chain.k, 1); assert.ok(b.notes.some((n) => n.includes("Contact")));
});

test("win conditions and whole games finish, harder levels are harder", () => {
  const g = newGame(1, 5); g.oracle.hp = 1; g.you.hand = [card("Mg", 1), card("O", 2), ...g.you.hand.slice(2)]; g.cond = "cold";
  place(g, 1); place(g, 2); playBench(g); assert.deepEqual(g.over, { winner: "you", how: "stability" });
  const d = newGame(1, 6); d.you.found = ["NaCl", "KCl", "HF", "HCl"]; d.cond = "cold"; d.you.hand = [card("Mg", 1), card("O", 2), ...d.you.hand.slice(2)]; place(d, 1); place(d, 2); playBench(d);
  assert.equal(d.over.how, d.oracle.hp <= 0 ? "stability" : "discovery"); assert.equal(d.over.winner, "you");
  const rate = {};
  for (const lvl of [1, 2, 3]) {
    let wins = 0, playable = 0, turns = 0;
    for (let s = 1; s <= 120; s++) {
      const x = newGame(lvl, s * 7919), L = LEVELS[lvl - 1];
      while (!x.over) {
        const opts = formable(x.you.hand, L); turns++;
        if (opts.length) { playable++; const best = opts.reduce((a, c) => (powerOf(c, x, "you").power > powerOf(a, x, "you").power ? c : a)); for (const c of cardsFor(x.you.hand, best)) place(x, c.id); playBench(x); }
        else { for (const c of x.you.hand.slice(0, 3)) place(x, c.id); recycle(x); }
        if (x.over) break; oracleTurn(x);
      }
      assert.ok(x.round <= 31); if (x.over.winner === "you") wins++;
    }
    rate[lvl] = wins / 120; assert.ok(playable / turns > 0.5, `level ${lvl} hands are playable (${(playable / turns).toFixed(2)})`);
  }
  assert.ok(rate[1] > rate[2] && rate[1] > rate[3], JSON.stringify(rate)); assert.ok(rate[2] > rate[3], "Master is harder than Chemist " + JSON.stringify(rate)); assert.ok(rate[3] < 0.55, "Master is a real fight");
});

test("randomness: seeds repeat, different seeds deal different hands and conditions", () => {
  const a = newGame(2, 123), b = newGame(2, 123), c = newGame(2, 456);
  assert.deepEqual(a.you.hand.map((x) => x.s), b.you.hand.map((x) => x.s)); assert.equal(a.cond, b.cond);
  const deals = new Set(Array.from({ length: 20 }, (_, i) => newGame(2, i + 1).you.hand.map((x) => x.s).sort().join(""))); assert.ok(deals.size > 15);
  const conds = new Set(Array.from({ length: 40 }, (_, i) => newGame(1, i + 1).cond)); assert.ok(conds.size >= 6);
  const r = rng(1); for (let i = 0; i < 100; i++) { const v = r(); assert.ok(v >= 0 && v < 1); }
  assert.ok(copiesOf(EL.H, LEVELS[1]) > copiesOf(EL.H, LEVELS[0]));
});

test("progress: settle pays, Codex fills, titles, rooms activity counts plays", () => {
  const p = fresh(), g = newGame(2, 3); g.you.found = ["H2O", "NaCl"]; g.you.bonusHits = 1; g.over = { winner: "you", how: "stability" };
  const r = settle(p, g); assert.ok(r.won && r.xp > 0 && r.essence >= 15 + 4 + 3); assert.deepEqual(r.newCodex, ["H2O", "NaCl"]);
  assert.equal(codexCount(p), 2); assert.equal(room(p).wins[2], 1); assert.equal(activity(p), 1);
  const r2 = settle(p, g); assert.deepEqual(r2.newCodex, [], "replays don't re-pay Codex entries");
  assert.equal(TITLES.at(-1).at, COMPOUNDS.length);
});

test("shop: card backs and benches on a store shelf, buy and use", () => {
  assert.ok(SHOP.filter((s) => s.slot === "back").length >= 5 && SHOP.filter((s) => s.slot === "bench").length >= 5);
  assert.ok(SHOP.every((s) => /^(db|bn)-/.test(s.id) && s.note.length > 10));
  registerShelf(duelRoomDef.shop); assert.ok(STORE.some((s) => s.kind === "duel" && s.id === "db-radium"));
  const p = fresh(); assert.deepEqual(lookOf(p), DEFAULT_LOOK); assert.equal(buyOrUse(p, "db-radium"), "poor");
  p.essence = 500; assert.equal(buyOrUse(p, "db-radium"), "bought"); assert.ok(owns(p, "db-radium")); assert.equal(lookOf(p).back, "db-radium"); assert.equal(p.essence, 350);
  p.duel = "bn-curie"; (p.owned ||= []).push("bn-curie"); assert.equal(lookOf(p).bench, "bn-curie", "an item put on in the store shows in the room");
});

test("scene draws every back, bench and reaction", () => {
  const g = newGame(1, 1);
  for (const it of SHOP) { const look = { ...DEFAULT_LOOK, [it.slot]: it.id }; for (const fx of [null, { kind: "react", side: "you", c: BY_ID.H2SO4, dmg: 7 }, { kind: "fizz", cards: g.you.hand }, { kind: "win" }, { kind: "lose" }]) {
    const svg = sceneSvg({ look, g, fx }); assert.match(svg, /^<svg/); assert.doesNotMatch(svg, /undefined|NaN/, it.id); } }
  assert.doesNotMatch(sceneSvg({ look: DEFAULT_LOOK, g: null }), /undefined|NaN/);
  assert.equal(molecule(BY_ID.CH4, 0, 0).length, 5);
});

test("damage phase: every compound gets a reaction kind, every kind draws with flying cards", () => {
  const seen = new Set(COMPOUNDS.map(kindOf)); for (const k of Object.keys(KIND)) assert.ok(seen.has(k), "some compound is " + k);
  assert.equal(kindOf(BY_ID.NO), "spark"); assert.equal(kindOf(BY_ID.C2H2), "frost"); assert.equal(kindOf(BY_ID.HCl), "acid"); assert.equal(kindOf(BY_ID.Al2O3), "fire"); assert.equal(kindOf(BY_ID.NaOH), "base");
  const g = newGame(2, 4);
  for (const k of Object.keys(KIND)) { const c = COMPOUNDS.find((x) => kindOf(x) === k);
    for (const side of ["you", "oracle"]) { const svg = sceneSvg({ look: DEFAULT_LOOK, g, fx: { kind: "react", side, c, cards: cards(c.f), dmg: 3, blocked: side === "you" ? 2 : 0 } });
      assert.match(svg, /du-k-card/); assert.match(svg, new RegExp("k-" + k)); assert.doesNotMatch(svg, /undefined|NaN/, k); } }
  assert.equal(duelRoomDef.row, "cards", "Element Duel sits with the card decks");
});

test("Daily Lab: everyone gets the same deal today, and a win outscores a loss", async () => {
  const { dailyScore, DAILY_LEVEL } = await import("../activity/src/duel/room.js");
  const { dailySeed } = await import("../activity/src/daily.js");
  const { newGame } = await import("../activity/src/duel/logic.js");
  const a = newGame(DAILY_LEVEL, dailySeed("duel", "2026-11-27")), b = newGame(DAILY_LEVEL, dailySeed("duel", "2026-11-27")), c = newGame(DAILY_LEVEL, dailySeed("duel", "2026-11-28"));
  const deal = (g) => JSON.stringify([g.you.hand.map((x) => x.s), g.oracle.hand.map((x) => x.s), g.cond, g.bonus]);
  assert.equal(deal(a), deal(b)); assert.notEqual(deal(a), deal(c));
  a.over = { winner: "you", how: "stability" }; a.oracle.hp = 0; a.round = 8;
  b.over = { winner: "oracle", how: "stability" }; b.you.hp = 0; b.oracle.hp = 3; b.round = 8;
  assert.ok(dailyScore(a) > dailyScore(b)); assert.ok(dailyScore(b) >= 0);
});

test("Rivals: a ladder of real chemists at Master, each with their own deck, hand and taste", async () => {
  const { RIVALS, RIVAL, rivalTaste } = await import("../activity/src/duel/rivals.js");
  assert.deepEqual(RIVALS.map((r) => r.id), ["davy", "lavoisier", "faraday", "mendeleev", "curie"]);
  for (const rv of RIVALS) {
    for (const s of rv.fav) { assert.ok(EL[s], s); assert.ok(COMPOUNDS.some((c) => c.atoms[s] && c.tier <= 3), `${rv.id} can use ${s}`); }
    const g = newGame(3, 42, rv.id);
    assert.equal(g.rival, rv.id); assert.equal(g.oracle.hp, START + (rv.hp || 0)); assert.equal(g.oracle.hand.length, LEVELS[2].oHand + (rv.hand || 0));
    const base = newGame(3, 42); const n = (gg, s) => [...gg.oracle.deck, ...gg.oracle.hand].filter((x) => x.s === s).length;
    for (const s of rv.fav) assert.equal(n(g, s), n(base, s) + (rv.copies ?? 2));
  }
  assert.equal(newGame(2, 42, "curie").rival, null); // Master only
  assert.ok(rivalTaste(RIVAL.lavoisier, BY_ID.H2O, []) > rivalTaste(RIVAL.lavoisier, BY_ID.NaCl, []));
  assert.ok(rivalTaste(RIVAL.mendeleev, BY_ID.NaCl, []) > rivalTaste(RIVAL.mendeleev, BY_ID.NaCl, ["NaCl"]));
  const p = {}, g = newGame(3, 5, "davy"); g.over = { winner: "you", how: "stability" };
  const a = settle(p, g), b = settle(p, g);
  assert.equal(a.newRival, "davy"); assert.equal(b.newRival, null); assert.equal(a.essence - b.essence, 25); assert.equal(room(p).rivals.davy, 2);
});

test("Bigger hits: reactions scale with power, and every compound has a one-line fact", async () => {
  const { powerTier } = await import("../activity/src/duel/scene.js");
  const { firstLine } = await import("../activity/src/duel/room.js");
  assert.deepEqual([3, 4, 5, 7, 8, 10, 11, 15].map(powerTier), ["small", "small", "", "", "big", "big", "huge", "huge"]);
  const g = newGame(2, 4), c = BY_ID.Al2O3;
  for (const [p, cls] of [[3, /p-small/], [9, /p-big/], [12, /p-huge/]]) {
    const svg = sceneSvg({ look: DEFAULT_LOOK, g, fx: { kind: "react", side: "you", c, cards: [], dmg: p, power: p } });
    assert.match(svg, cls); if (p >= 8) assert.match(svg, /REACTION · /);
  }
  for (const x of COMPOUNDS) { const l = firstLine(x.fact); assert.ok(l.length > 10 && l.length <= x.fact.length, x.id); }
});

test("Codex upgrade: every compound has uses and a turning structure, and milestones pay once", async () => {
  const { USES, MILESTONES } = await import("../activity/src/duel/uses.js");
  const { structureSvg } = await import("../activity/src/duel/scene.js");
  const { pageHtml } = await import("../activity/src/duel/room.js");
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  for (const c of COMPOUNDS) {
    assert.ok(USES[c.id] && USES[c.id].length, "uses for " + c.id);
    assert.ok(c.dh >= -1720 && c.dh <= 240, "heat scale covers " + c.id);
    assert.match(structureSvg(c), /du-turn/); assert.match(pageHtml(c, esc), /Used for/);
  }
  assert.equal(Object.keys(USES).length, COMPOUNDS.length);
  const p = {}, r = room(p); COMPOUNDS.slice(0, 9).forEach((c) => (r.codex[c.id] = 1));
  const g = newGame(1, 3); g.you.found = [COMPOUNDS[9].id, COMPOUNDS[10].id]; g.over = { winner: "oracle", how: "stability" };
  const a = settle(p, g); assert.deepEqual(a.newMilestones.map((m) => m.at), [10]); assert.ok(a.essence >= MILESTONES[0].essence);
  assert.deepEqual(settle(p, g).newMilestones, []);
});
