// Split Key (Cipher Desk team race): random teams, same bundle, team-only chat, race bonus, apprentices, banners.
import test from "node:test";
import assert from "node:assert/strict";
import * as K from "../activity/src/cipherdesk/splitkey.js";
import { current, cipherText } from "../activity/src/cipherdesk/logic.js";
import { SHOP, SLOTS } from "../activity/src/cipherdesk/shop.js";

const M = (...ids) => ids.map((id) => ({ id, name: id }));
const solve = (st, who) => { const k = K.teamOf(st, who), it = current(st.teams[k].run); let r = K.play(st, who, { a: "method", m: it.m }); if (r === "key") r = K.play(st, who, { a: "key", k: it.key }); return r; };

test("teams are random, even and cover everyone; alone you race the apprentices", () => {
  const seen = new Set();
  for (let s = 1; s < 30; s++) { const t = K.split(["a", "b", "c", "d", "e"], K.rng(s)); assert.equal(t.quill.length + t.seal.length, 5); assert.ok(Math.abs(t.quill.length - t.seal.length) <= 1);
    assert.deepEqual([...t.quill, ...t.seal].sort(), ["a", "b", "c", "d", "e"]); seen.add(t.quill.slice().sort().join()); }
  assert.ok(seen.size > 5);
  assert.deepEqual(K.split(["me"]), { quill: ["me"], seal: [K.BOT] });
});

test("both teams get the same bundle, all ciphers, no forgeries", () => {
  for (const n of [1, 2, 3]) { const st = K.newRace(M("a", "b", "c", "d"), n, K.rng(n)), q = st.teams.quill.run.items, s = st.teams.seal.run.items;
    assert.deepEqual(q.map((x) => [x.id, x.m, x.key]), s.map((x) => [x.id, x.m, x.key])); assert.ok(q.every((x) => x.kind === "line")); assert.ok(cipherText(q[0]).length > 0); }
});

test("teams race: shared ink, first through gets the bonus, the higher score wins", () => {
  const st = K.newRace(M("a", "b", "c", "d"), 2, K.rng(4)), [qa, qb] = st.teams.quill.ids, sa = st.teams.seal.ids[0];
  const it = current(st.teams.quill.run), wrong = it.choices.find((m) => m !== it.m);
  assert.equal(K.play(st, qb, { a: "method", m: wrong }), "wrong"); assert.equal(current(st.teams.quill.run).drops, 3); // qa sees the same doc, one drop down
  assert.equal(K.play(st, "zz", { a: "method", m: it.m }), null);
  while (!st.teams.quill.done) solve(st, qa);
  assert.equal(st.teams.quill.at, 1); assert.equal(st.teams.quill.bonus, K.RACE_BONUS); assert.equal(K.play(st, qa, { a: "method", m: it.m }), null);
  solve(st, sa); K.timeUp(st); assert.ok(st.over); assert.equal(st.winner, "quill");
  const r = K.reward(st, qa); assert.ok(r.won && r.read === 5 && r.essence <= 10); assert.ok(!K.reward(st, sa).won);
});

test("a tie goes to the team that finished first", () => {
  const st = K.newRace(M("a", "b"), 1, K.rng(9)), q = st.teams.quill.ids[0], s = st.teams.seal.ids[0];
  while (!st.teams.seal.done) solve(st, s); while (!st.teams.quill.done) solve(st, q);
  st.teams.seal.bonus = 0; st.teams.quill.bonus = 0; st.over = false; K.timeUp(st); assert.equal(st.winner, "seal");
});

test("team chat: filtered, only your team sees it, the other team's run is hidden", () => {
  const st = K.newRace(M("a", "b", "c", "d"), 1, K.rng(5)), q = st.teams.quill.ids[0], s = st.teams.seal.ids[0];
  assert.ok(K.say(st, q, "Try the Caesar wheel", q).ok); assert.ok(K.say(st, q, "I think it's morse", q).ok);
  assert.equal(K.say(st, q, "see www.example.com").why, "link"); assert.equal(K.say(st, "zz", "hello").why, "team");
  const vs = K.raceView(st, s); assert.equal(vs.mine, "seal"); assert.equal(vs.teams.quill.chat.length, 0); assert.equal(vs.teams.quill.run.items, undefined); assert.equal(vs.teams.quill.run.n, 5);
  assert.equal(K.raceView(st, q).teams.quill.chat.length, 2); assert.equal(K.raceView(st, q).teams.seal.run.items, undefined);
  for (let k = 0; k < 20; k++) K.say(st, q, "Go go go!", q); assert.equal(st.teams.quill.chat.length, K.CHAT_MAX);
});

test("late arrivals join the smaller team; the apprentices finish on their own", () => {
  const st = K.newRace(M("a", "b", "c"), 1, K.rng(6)), small = st.teams.quill.ids.length < st.teams.seal.ids.length ? "quill" : "seal";
  assert.equal(K.join(st, "d"), small); assert.equal(K.join(st, "d"), null);
  const solo = K.newRace(M("me"), 3, K.rng(7)); assert.equal(K.join(solo, "x"), "quill");
  let n = 0; while (!solo.teams.seal.done && n++ < 5000) K.botStep(solo, K.rng(n)); assert.ok(solo.teams.seal.done);
  assert.ok(K.reward(solo, "me").essence <= 6);
});

test("the Desk kit has a banners slot with a free one", () => {
  assert.ok(SLOTS.some(([k]) => k === "banner")); const b = SHOP.filter((x) => x.slot === "banner"); assert.ok(b.length >= 3 && b.some((x) => !x.price) && b.some((x) => x.price > 0));
});
