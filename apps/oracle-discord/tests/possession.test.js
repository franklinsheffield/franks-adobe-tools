// Possession (party story room) + the shared story engine (party/story.js) + the word filter (party/filter.js).
import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../activity/src/party/story.js";
import { check, tidy, MAX_LEN } from "../activity/src/party/filter.js";
import { TALES, LEVELS, EMCEE, beatsFor, talesFor, taleById, emcee } from "../activity/src/possession/tales.js";
import { SHOP, SLOTS, DEFAULT_LOOK, lookOf, buyOrUse, room } from "../activity/src/possession/shop.js";
import { keepTale, shareLines, plainText, TALES_KEPT } from "../activity/src/possession/room.js";
import { bookHtml } from "../activity/src/possession/scene.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";
import { ROOM_BOOKS } from "../activity/src/library.js";
import { HOSTS } from "../activity/src/hosts/index.js";
import { rng } from "../activity/src/timeline/logic.js";

const M = (...ids) => ids.map((id) => ({ id, name: id.toUpperCase() }));
const rot = (s) => s.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));

test("the filter refuses rude words and their dodges, links and mentions, but lets a ghost story through", () => {
  for (const bad of ["shpx", "shpxvat thl", "s h p x", "s.h.p.x", "fuvvvvg", "fu1g", "ovgpurf", "nffubyr", "cbea", "avttre"].map(rot)) assert.equal(check(bad).ok, false, bad);
  assert.equal(check("visit discord.gg/abc").why, "link"); assert.equal(check("see https://x.y").why, "link"); assert.equal(check("hi @everyone").why, "mention");
  assert.equal(check("   ").why, "empty"); assert.equal(check("...").why, "empty");
  for (const ok of ["a golden spoon", "the therapist from hell", "who reigns tonight", "a raccoon in the walls", "spices", "prick your finger", "Sussex", "the dead rose from their graves", "damn that goat", "peacock", "Bob"]) assert.equal(check(ok).ok, true, ok);
  assert.equal(tidy("  a   spoon.  "), "a spoon"); assert.ok(tidy("x".repeat(200)).length <= MAX_LEN);
});

test("every House has tales, every tale has 8 beats (4 at level 1, 6 at level 2) and good fallbacks", () => {
  for (const h of HOSTS) { assert.ok(talesFor(h.id).length >= 2, h.id); assert.ok(EMCEE[h.id], h.id + " emcee"); for (const k of Object.keys(EMCEE.oracle)) assert.ok(EMCEE[h.id][k].length >= 2, h.id + k); }
  const ids = Object.values(TALES).flat().map((t) => t.id); assert.equal(new Set(ids).size, ids.length);
  for (const [hid, tales] of Object.entries(TALES)) for (const t of tales) {
    assert.equal(t.beats.length, 8, t.id); assert.ok(t.title.length >= 2);
    for (const [L, n] of [[1, 4], [2, 6], [3, 8]]) { const b = beatsFor(t, L, hid); assert.equal(b.length, n + 1, t.id + L); assert.ok(b[n].title); assert.equal(LEVELS[L - 1].beats, n); }
    for (const b of t.beats) { assert.ok(b.frame.includes("{a}"), t.id + b.ask); assert.ok(b.fall.length >= 3); for (const f of [...b.fall, ...t.title]) assert.ok(check(f).ok, f); }
  }
  assert.equal(taleById("pa-spirit").id, "pa-spirit"); assert.equal(talesFor("nope"), TALES.oracle);
  assert.ok(emcee("win", { name: "Ada" }, () => 0, "parlour").includes("Ada"));
});

test("a full tale with friends: filter, shared answers, own-vote refused, strike, scoring, title double, late join", () => {
  const t = TALES.parlour[0], st = S.startTale(t, beatsFor(t, 1, "parlour"), M("a", "b", "c"), { level: 1, house: "parlour" }), r = rng(5);
  assert.equal(st.n, 5);
  assert.equal(S.submit(st, "a", rot("shpx")).r, "bad");
  assert.equal(S.submit(st, "a", "a sea captain").r, "ok");
  assert.equal(S.submit(st, "b", "A Sea Captain.").r, "ok"); // same answer: a and b share one card
  assert.equal(S.submit(st, "z", "x"), null);
  assert.ok(!S.allWritten(st)); S.submit(st, "c", "a rude butler"); assert.ok(S.allWritten(st));
  const pv = S.publicView(st, "a"); assert.equal(pv.lines, undefined); assert.deepEqual(pv.done.sort(), ["a", "b", "c"]); assert.equal(pv.mine, "a sea captain");
  S.openVote(st, r); assert.equal(st.choices.length, 2);
  const cap = st.choices.find((c) => c.by.includes("a")), but = st.choices.find((c) => c.by.includes("c"));
  assert.equal(S.vote(st, "a", cap.key), "own"); assert.equal(S.vote(st, "c", but.key), "own");
  assert.equal(S.vote(st, "a", but.key), "ok"); assert.equal(S.vote(st, "c", cap.key), "ok"); assert.equal(S.vote(st, "zz", cap.key), "aud");
  const v = S.publicView(st, "c"); assert.ok(v.choices.every((c) => !("by" in c))); assert.equal(v.choices.find((c) => c.key === but.key).own, true);
  assert.ok(!S.allVoted(st), "b can still vote for c's card");
  S.vote(st, "b", but.key);
  const L = S.reveal(st, r); assert.equal(L.key, but.key); assert.equal(st.story[0].line, "The spirit speaks… I am a rude butler.");
  assert.equal(st.score.c, 2 * S.VOTE_PTS + S.WIN_PTS); assert.equal(st.score.a, 1 * S.VOTE_PTS); assert.equal(st.wins.c, 1);
  assert.equal(S.next(st, M("a", "b", "c", "d")), "write"); assert.ok(st.seats.includes("d"));
  // beat 2: a rude card slips through; the host strikes it
  for (const id of ["a", "b", "c", "d"]) S.submit(st, id, `a house number ${id}`);
  S.openVote(st, r); const k = st.choices[0].key; S.vote(st, "b", k);
  assert.ok(S.strike(st, k)); assert.equal(st.votes.b, undefined); assert.equal(S.vote(st, "c", k), null);
  assert.ok(!S.publicView(st, "a").choices.find((c) => c.key === k).text.includes("undefined"));
  S.reveal(st, r); assert.notEqual(st.last.key, k);
  // nobody writes: the House answers itself
  S.next(st); S.openVote(st, r); assert.ok(st.choices.length >= 2 && st.choices.every((c) => c.house)); S.reveal(st, r); assert.ok(st.last.house);
  S.next(st); S.advance(st, [], r); S.advance(st, [], r); S.advance(st, [], r); // beat 4 by timers
  assert.ok(S.isFinal(st)); assert.equal(S.mult(st), S.FINAL_MULT);
  S.submit(st, "a", "Feed the Parrot"); S.submit(st, "b", "The Butler Did It"); S.openVote(st, r);
  S.vote(st, "c", st.choices.find((c) => c.by.includes("a")).key); S.reveal(st, r);
  assert.equal(st.title, "Feed the Parrot"); assert.equal(st.story.length, 4);
  assert.equal(S.next(st), "over"); assert.ok(st.over);
  const tt = S.taleText(st, (id) => id.toUpperCase()); assert.equal(tt.title, "Feed the Parrot"); assert.equal(tt.lines.length, 4);
  const rw = S.reward(st, "c", 4); assert.ok(rw.xp > 0 && rw.essence <= 10); assert.equal(typeof rw.won, "boolean");
  assert.ok(JSON.stringify(st).length < 120 * 1024, "fits a table snapshot");
});

test("solo: your line goes straight into the tale; finishing wins, perfect unless the spirits helped", () => {
  const t = TALES.oracle[0], st = S.startTale(t, beatsFor(t, 1, "oracle"), M("me"));
  for (let i = 0; i < st.n; i++) { assert.equal(S.submit(st, "me", "a goat " + i).r, "ok"); S.openVote(st); S.reveal(st); assert.deepEqual(st.last.by, ["me"]); S.next(st); }
  assert.ok(st.over); assert.equal(st.story[0].line, "Long ago, in a land of fog, there lived a goat 0.");
  assert.equal(S.reward(st, "me", 1).won, true); assert.equal(S.reward(st, "me", 1).perfect, true); assert.equal(S.reward(st, "me", 1, { helped: true }).perfect, false);
});

test("fill() capitalises a sentence that starts with the answer", () => {
  assert.equal(S.fill("{a}, said the goat.", "never"), "Never, said the goat."); assert.equal(S.fill("I am {a}.", "Bob"), "I am Bob.");
});

test("the Story book keeps 12 tales, and a channel post fits the share limits", () => {
  const p = {}; for (let i = 0; i < 15; i++) keepTale(p, { title: "T" + i, lines: ["one", "two"], authors: ["A"], host: "Madame Rook" });
  assert.equal(room(p).tales.length, TALES_KEPT); assert.equal(room(p).tales[0].title, "T14");
  const long = { title: "x", lines: Array.from({ length: 9 }, () => "y".repeat(300)), authors: ["A", "B"], host: "Keeper Altair" }, L = shareLines(long);
  assert.ok(L.length <= 14 && L.every((l) => l.length <= 140)); assert.ok(L.at(-1).includes("Keeper Altair") && L.at(-1).includes("A, B"));
  assert.ok(plainText(long).startsWith("x\n"));
});

test("shelf: inks and pages, free ones owned, buying costs Essence, the page shows the look", () => {
  assert.ok(SHOP.every((s) => s.id.startsWith("pz-") && s.note.length > 20)); assert.equal(new Set(SHOP.map((s) => s.id)).size, SHOP.length);
  for (const [slot] of SLOTS) assert.ok(SHOP.some((s) => s.slot === slot && s.price === 0));
  const p = { essence: 50 }; assert.deepEqual(lookOf(p), DEFAULT_LOOK);
  assert.equal(buyOrUse(p, "pz-gold"), "poor"); p.essence = 500; assert.equal(buyOrUse(p, "pz-gold"), "bought"); assert.equal(p.essence, 360); assert.equal(lookOf(p).ink, "pz-gold");
  assert.equal(buyOrUse(p, "pz-irongall"), "used"); assert.equal(lookOf(p).ink, "pz-irongall");
  const html = bookHtml({ look: lookOf(p), title: "<b>", lines: ["one", "two"], fresh: true, esc: (s) => String(s).replace(/</g, "&lt;") });
  assert.ok(html.includes("pz-ghost new") && html.includes("&lt;b>") && html.includes("pz-pl"));
});

test("wired in: trophy, banter, books, and on every House's room list", () => {
  assert.ok(TROPHIES.some((t) => t.id === "possession")); assert.ok(BANTER.possession); assert.ok(ROOM_BOOKS.possession);
  for (const h of HOSTS) assert.ok(h.rooms === "all" || h.rooms.includes("possession"), h.id);
});

/* ---------- True tales (story-builder mode) ---------- */
import { TRUE_TALES, trueBeatsFor, trueTalesFor, TRUE_LEVELS } from "../activity/src/possession/true.js";
import { journalRows } from "../activity/src/possession/room.js";

test("every House has a true tale: 6 beats (3/5/6 by level), facts fit a channel line, answers pass the filter", () => {
  for (const h of HOSTS) { assert.ok(trueTalesFor(h.id).length >= 1, h.id); for (const k of ["pick", "snap", "real"]) assert.ok(EMCEE[h.id][k].length >= 2, h.id + k); }
  assert.ok(emcee("pick", { names: "Ada" }, () => 0, "parlour").includes("Ada"));
  for (const tales of Object.values(TRUE_TALES)) for (const t of tales) {
    assert.equal(t.beats.length, 6, t.id); assert.ok(t.real.length >= 4);
    for (const [L, n] of [[1, 3], [2, 5], [3, 6]]) { assert.equal(trueBeatsFor(t, L).length, n, t.id + L); assert.ok(TRUE_LEVELS[L - 1].what.startsWith(String(n))); }
    for (const b of t.beats) { assert.ok(b.narr && b.truth && b.ask && b.frame.includes("{a}"), t.id); assert.ok(b.truth.length <= 136, b.truth); assert.ok(b.fall.length >= 3);
      for (const f of b.fall) assert.ok(check(f).ok, f); }
    for (const r of t.real) assert.ok(r.length <= 140, r);
  }
});

test("true tale with friends: writers rotate fairly, one writer speaks straight away, two writers get a vote", () => {
  const t = TRUE_TALES.observatory[0], r = rng(9), st = S.startTale(t, trueBeatsFor(t, 3), M("a", "b", "c"), { mode: "true", rand: r });
  assert.equal(st.title, t.name); assert.equal(st.writers.length, 1);
  const seen = {};
  for (let i = 0; i < 6; i++) {
    const w = st.writers[0]; seen[w] = (seen[w] || 0) + 1;
    const other = st.seats.find((id) => id !== w); assert.equal(S.submit(st, other, "a moon"), null, "only the possessed may write");
    assert.equal(S.submit(st, w, "a space potato").r, "ok"); assert.ok(S.allWritten(st));
    S.openVote(st, r); assert.equal(st.choices.length, 1); assert.ok(S.allVoted(st), "one answer: no vote needed");
    const L = S.reveal(st, r); assert.deepEqual(L.by, [w]); assert.equal(L.truth, t.beats[i].truth); assert.equal(st.story.at(-1).narr, t.beats[i].narr);
    S.next(st, [], r);
  }
  assert.ok(st.over); assert.deepEqual(Object.values(seen).sort(), [2, 2, 2], "everyone possessed the host twice");
  assert.ok(S.reward(st, "a", 3).perfect, "every line you wrote was spoken");
  // 4 players: two writers per beat, a late joiner waits their fair turn
  const st2 = S.startTale(t, trueBeatsFor(t, 3), M("a", "b", "c", "d"), { mode: "true", rand: r }); assert.equal(st2.writers.length, 2);
  const [w1, w2] = st2.writers; S.submit(st2, w1, "a teapot"); S.submit(st2, w2, "a tiny hat"); S.openVote(st2, r);
  assert.equal(st2.choices.length, 2); assert.ok(!S.allVoted(st2));
  const voter = st2.seats.find((id) => !st2.writers.includes(id)); assert.equal(S.vote(st2, voter, st2.choices.find((c) => c.by.includes(w2)).key), "ok");
  S.reveal(st2, r); assert.deepEqual(st2.last.by, [w2]);
  S.next(st2, M("a", "b", "c", "d", "e"), r); assert.ok(st2.seats.includes("e")); assert.ok(st2.turns.e >= 0);
  // nobody possessed answers: the House line is spoken
  S.openVote(st2, r); assert.equal(st2.choices.length, 1); assert.ok(st2.choices[0].house); S.reveal(st2, r); assert.ok(st2.last.house);
});

test("a finished true tale shares with its facts and journals with what really happened", () => {
  const t = TRUE_TALES.parlour[0], st = S.startTale(t, trueBeatsFor(t, 2), M("me"), { mode: "true" });
  while (!st.over) { S.submit(st, "me", "a very small drummer"); S.openVote(st); S.reveal(st); S.next(st); }
  const tt = S.taleText(st), saved = { title: tt.title, lines: tt.lines, truths: tt.truths, real: t.real, authors: ["Ada"], host: "Madame Rook" };
  assert.equal(tt.lines.length, 5); assert.ok(tt.truths.every(Boolean));
  const L = shareLines(saved); assert.ok(L.length <= 14 && L.every((l) => l.length <= 140)); assert.ok(L.some((l) => l.startsWith("📜")));
  const [title, rows] = journalRows(saved, "Possessed the host 5 times"); assert.equal(title, "Possession: The Rappings at Hydesville");
  assert.ok(rows.length <= 14 && rows.every(([k, v]) => k.length <= 60 && v.length <= 600)); assert.ok(rows.some(([k]) => k === "What really happened"));
  assert.ok(plainText(saved).includes("What really happened:"));
});

test("a shorter true tale still narrates the skipped beats", () => {
  const t = TRUE_TALES.alchemist[0], short = trueBeatsFor(t, 1);
  assert.ok(short.some((b) => b.narr.includes("phosphorus, Greek for 'light-bearer'")));
});
