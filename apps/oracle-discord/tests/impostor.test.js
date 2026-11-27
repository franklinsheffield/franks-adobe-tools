// The Impostor (Séance party round): hints, deal, views, votes, steal, spirits, masks shelf.
import test from "node:test";
import assert from "node:assert/strict";
import * as I from "../activity/src/seance/impostor.js";
import { GHOSTS } from "../activity/src/seance/ghosts.js";
import { maskShop, MASK_LOOK, maskSvg } from "../activity/src/seance/masks.js";
import { rng } from "../activity/src/timeline/logic.js";

const M = (...ids) => ids.map((id) => ({ id, name: id }));

test("every ghost has six hints that never name it, and no hint is shared", () => {
  assert.equal(I.usable().length, GHOSTS.length);
  const all = Object.values(I.HINTS).flat(); assert.equal(new Set(all).size, all.length);
  for (const g of GHOSTS) for (const h of I.HINTS[g.id]) for (const part of g.name.toLowerCase().split(/[\s-]+/).filter((p) => p.length > 3)) assert.ok(!h.toLowerCase().includes(part), `${g.id}: ${h}`);
});

test("a deal: same-kind decoy, one impostor, a shared menu holding both ghosts' words, the real ghost on the steal list", () => {
  for (let s = 1; s < 40; s++) { const st = I.newGame(M("a", "b", "c", "d"), rng(s)), R = I.ghost(st.real), D = I.ghost(st.decoy);
    assert.notEqual(R.id, D.id); assert.equal(R.field, D.field); assert.ok(st.seats.includes(st.imp));
    assert.ok(st.menu.length >= 10 && st.menu.length <= I.MENU); assert.ok(st.menu.filter((w) => I.HINTS[R.id].includes(w)).length >= 4); assert.ok(st.menu.filter((w) => I.HINTS[D.id].includes(w)).length >= 4);
    assert.ok(st.steal.includes(R.id) && !st.steal.includes(D.id) && st.steal.length >= 4);
    for (const id of st.seats) assert.equal(I.cardOf(st, id).ghost, id === st.imp ? D.id : R.id); }
});

test("spirits fill the table when fewer than 3 people play", () => {
  const st = I.newGame(M("me"), rng(2)); assert.equal(st.seats.length, I.SEATS); assert.equal(st.seats.filter(I.isSpirit).length, 3);
  assert.equal(I.newGame(M("a", "b", "c"), rng(2)).seats.length, 3);
});

test("hints: menu words only, no repeats per sitter, face down until everyone has laid one", () => {
  const st = I.newGame(M("a", "b", "c"), rng(3)), w = st.menu;
  assert.equal(I.hint(st, "a", "not a word"), null); assert.equal(I.hint(st, "a", w[0]), "ok"); assert.equal(I.hint(st, "a", w[1]), null);
  const vb = I.gameView(st, "b"); assert.equal(vb.hints[1].a, "?"); assert.equal(vb.real, undefined); assert.equal(vb.decoy, undefined); assert.equal(vb.imp, null); assert.equal(vb.card.ghost, I.cardOf(st, "b").ghost);
  assert.equal(I.gameView(st, "a").hints[1].a, w[0]);
  I.hint(st, "b", w[1]); I.hint(st, "c", w[2]); assert.ok(I.allHinted(st)); assert.equal(I.closeHints(st), "hint");
  assert.equal(I.hint(st, "a", w[0]), null); assert.equal(I.hint(st, "a", w[3]), "ok"); assert.equal(I.gameView(st, "b").hints[1].a, w[0]);
  assert.equal(I.closeHints(st, rng(4)), "vote"); assert.ok(Object.keys(st.hints[2]).length === 3);
});

const toVote = (st) => { while (st.phase === "hint") I.closeHints(st, rng(5)); };

test("catch the impostor: circle wins unless the impostor names the real ghost", () => {
  for (const stealRight of [false, true]) {
    const st = I.newGame(M("a", "b", "c"), rng(7)); toVote(st); const crew = st.seats.filter((id) => id !== st.imp);
    assert.equal(I.vote(st, crew[0], crew[0]), null);
    for (const id of crew) I.vote(st, id, st.imp); I.vote(st, st.imp, crew[0]);
    const pv = I.gameView(st, crew[1]); assert.ok(Object.values(pv.votes).every((x) => x === "?" || x === st.imp));
    assert.equal(I.closeVote(st), "steal"); assert.equal(I.gameView(st, crew[0]).imp, st.imp);
    assert.equal(I.steal(st, crew[0], st.real), null);
    I.steal(st, st.imp, stealRight ? st.real : st.steal.find((g) => g !== st.real)); assert.ok(st.over);
    if (stealRight) { assert.equal(st.result, "stolen"); assert.equal(st.score[st.imp], I.STEAL); assert.equal(st.score[crew[0]], I.SPOT); assert.ok(I.reward(st, st.imp).won); }
    else { assert.equal(st.result, "caught"); assert.equal(st.score[crew[0]], I.CREW + I.SPOT); assert.ok(I.reward(st, crew[0]).won && I.reward(st, crew[0]).spotted); assert.ok(!I.reward(st, st.imp).won); }
  }
});

test("a tie or a wrong accusation lets the impostor escape", () => {
  const st = I.newGame(M("a", "b", "c", "d"), rng(8)); toVote(st); const crew = st.seats.filter((id) => id !== st.imp);
  I.vote(st, crew[0], crew[1]); I.vote(st, crew[1], crew[0]); I.vote(st, crew[2], st.imp); I.vote(st, st.imp, crew[2]);
  assert.equal(I.closeVote(st), "over"); assert.equal(st.result, "escape"); assert.equal(st.score[st.imp], I.ESCAPE); assert.equal(st.score[crew[2]], I.SPOT);
  assert.equal(I.tally({ a: "x", b: "x", c: "y" }), "x"); assert.equal(I.tally({ a: "x", b: "y" }), null); assert.equal(I.tally({}), null);
});

test("a solo game with spirits plays itself to the end; rewards stay small", () => {
  for (let s = 1; s < 25; s++) { const st = I.newGame(M("me"), rng(s));
    let guard = 0; while (!st.over && guard++ < 20) { if (st.phase === "hint" && !st.hints[st.turn].me) I.hint(st, "me", st.menu.find((w) => ![1, 2].some((t) => st.hints[t].me === w)));
      if (st.phase === "vote" && !st.votes.me) I.vote(st, "me", st.seats.find((id) => id !== "me"));
      I.spiritsAct(st, rng(s + guard)); if (!st.over) I.advance(st, rng(s)); }
    assert.ok(st.over, "seed " + s); const r = I.reward(st, "me"); assert.ok(r.essence <= 5 && r.xp > 0); }
});

test("masks: a priced shelf, every look draws", () => {
  assert.ok(maskShop.items.some((x) => x.price === 0) && maskShop.items.some((x) => x.price > 0));
  for (const it of maskShop.items) { assert.ok(MASK_LOOK[it.id]); assert.match(maskSvg(it.id, 0, 0), /<path/); assert.ok(it.id.startsWith("im-")); }
});
