// The Mentalist (activity/src/mentalist): forces and cold reading, the Houdinis' word code, billets one ahead,
// nerve, the two-person act, shop, stage and hooks.
import test from "node:test";
import assert from "node:assert/strict";
import { FORCES, BARNUM, SPECIFIC, CODE, CUES, QUESTIONS, LEVELS, wordOf, valueOf } from "../activity/src/mentalist/data.js";
import * as M from "../activity/src/mentalist/logic.js";
import { rng } from "../activity/src/casefiles/logic.js";
import { actStart, actMove, actView, actReward, ACT_ROUNDS } from "../activity/src/mentalist/group.js";
import * as S from "../activity/src/mentalist/shop.js";
import { stageSvg } from "../activity/src/mentalist/scene.js";
import { methodsHtml, mentalistCodex, methodLine, codeChartHtml } from "../activity/src/mentalist/room.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { DAILY_ROOMS } from "../activity/src/scene.js";
import { ROOM_BOOKS } from "../activity/src/library.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("the data: 6 forces, Forer lines vs specific guesses, the 10-word code, everyday billet questions", () => {
  assert.equal(FORCES.length, 6); assert.ok(FORCES.every((f) => f.fits && f.how.length > 30 && f.fact.length > 40));
  assert.ok(BARNUM.length >= 8 && SPECIFIC.length >= 8 && !BARNUM.some((b) => SPECIFIC.includes(b)));
  assert.deepEqual(CODE.map(([, n]) => n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); assert.equal(wordOf(1), "Pray"); assert.equal(valueOf("Be quick"), 10);
  for (const [w] of CODE) assert.ok(CUES[w].startsWith(w), "cue starts with its code word: " + w);
  assert.ok(QUESTIONS.length >= 10 && !QUESTIONS.some((q) => /dead|spirit|beyond|passed/i.test(q)), "no questions to the dead");
  assert.equal(M.METHOD_IDS.length, 9); assert.ok(M.METHOD_IDS.every((m) => methodLine(m).length > 30));
});

test("every round has exactly one right answer among distinct options, at every level", () => {
  for (const L of LEVELS) for (let s = 1; s < 200; s++) {
    const run = M.start(L, { seed: s }); assert.equal(run.rounds.length, L.rounds);
    for (const rd of run.rounds) { const ids = rd.options.map((o) => o.id); assert.equal(new Set(ids).size, ids.length); assert.equal(ids.filter((i) => i === rd.answer).length, 1, rd.kind); }
  }
  const two = M.roundOf("two", rng(37)), [a, b] = two.answer.split("-").map(Number);
  assert.ok(two.options.find((o) => o.id === two.answer).text.startsWith(`“${wordOf(a || 10)}`) && two.options.find((o) => o.id === two.answer).text.includes(wordOf(b || 10).toLowerCase()));
});

test("billets: the plant's question first, then always the slip opened last; the plant's slip opens last", () => {
  const { plant, rounds } = M.billetRounds(5, rng(42));
  assert.equal(rounds[0].answer, plant); for (let i = 1; i < 5; i++) assert.equal(rounds[i].answer, rounds[i - 1].opened);
  assert.equal(rounds[4].opened, plant); assert.ok(rounds[4].last);
});

test("a show: wrong costs nerve, 3 wrong is booed off, wins score and teach methods", () => {
  const L = LEVELS[0], run = M.start(L, { seed: 7 }), wrong = (r) => M.roundNow(r).options.find((o) => o.id !== M.roundNow(r).answer).id;
  assert.equal(M.choose(run, wrong(run)), "wrong"); assert.equal(run.nerve, 2);
  assert.equal(M.choose(run, M.roundNow(run).answer), "right"); assert.equal(run.pts, 1);
  while (!run.over) M.choose(run, M.roundNow(run).answer);
  assert.equal(run.won, true); assert.equal(M.scoreOf(run), 1 + 2 * 5 + 2); assert.equal(M.perfect(run), false);
  const p = { essence: 0 }, s = M.settle(p, run); assert.ok(s.fresh.includes("barnum")); assert.equal(M.room(p).wins[1], 1);
  const lose = M.start(LEVELS[1], { seed: 3 }); let res; for (let k = 0; k < 3; k++) res = M.choose(lose, lose.rounds[0].options.filter((o) => o.id !== lose.rounds[0].answer)[k].id);
  assert.equal(res, "booed"); assert.equal(M.scoreOf(lose), 0);
  const d = M.dailyOf("2026-11-27"); assert.deepEqual(M.dailyOf("2026-11-27"), d); assert.ok(LEVELS.includes(d.L));
});

test("the two-person act: only the assistant cues, only the mentalist names, the mentalist never sees the card", () => {
  const members = [{ id: "a", name: "Ada" }, { id: "b", name: "Bo" }, { id: "c", name: "Cy" }];
  const st = actStart(members, 1, rng(55)); assert.equal(st.mentalist, "a"); assert.equal(st.assistant, "b"); assert.equal(actStart(members, 2).mentalist, "b");
  assert.equal(actView(st, "a").cards[0], null); assert.equal(actView(st, "c").cards[0], st.cards[0]);
  assert.equal(actMove(st, "a", { a: "cue", w: "Pray" }), null); assert.equal(actMove(st, "b", { a: "name", v: 1 }), null);
  assert.equal(actMove(st, "a", { a: "name", v: 3 }), null, "no naming before the cue");
  while (!st.over) { const card = st.cards[st.i]; actMove(st, "b", { a: "cue", w: wordOf(card) }); actMove(st, "a", { a: "name", v: card }); }
  assert.equal(st.hits, ACT_ROUNDS); assert.equal(actReward(st).won, true); assert.ok(st.log.every((l) => l.hit && l.clean));
});

test("shop, stage art with the shared card back, book, codex and hooks", () => {
  assert.equal(S.SHOP.length, 9); assert.ok(S.SLOTS.every(([k]) => S.SHOP.filter((x) => x.slot === k).length === 3 && S.SHOP.some((x) => x.slot === k && !x.price)));
  assert.ok(S.SHOP.every((x) => x.id.startsWith("mt-") && x.note.length > 40)); assert.ok(!S.SHOP.some((x) => /card/i.test(x.slot)), "no card-back shelf here");
  const p = { essence: 500 }; assert.equal(S.buyOrUse(p, "mt-kuda"), "bought"); assert.equal(S.lookOf(p).blindfold, "mt-kuda");
  for (const mode of [null, "force", "read", "send", "hear", "two", "billet"]) for (const state of [null, "hit", "miss", "won", "booed"])
    assert.match(stageSvg({ look: S.lookOf(p), back: "cb-starfield", mode, card: 7, cue: "Speak up", slips: 3, opened: "Will it rain?", state }), /^<svg[\s\S]*<\/svg>$/);
  assert.match(stageSvg({ mode: "force", back: "cb-starfield" }), /class="cbk"/, "face-down cards wear the equipped card back");
  assert.match(methodsHtml(p, esc), /0 \/ 9/); assert.match(mentalistCodex(p, esc), /The Mentalist/); assert.match(codeChartHtml(esc), /Be quick/);
  assert.ok(TROPHIES.some((t) => t.id === "mentalist")); assert.ok(BANTER.mentalist); assert.ok(DAILY_ROOMS.includes("mentalist")); assert.ok(ROOM_BOOKS.mentalist);
});
