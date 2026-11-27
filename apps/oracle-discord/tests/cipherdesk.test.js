// Cipher Desk (activity/src/cipherdesk): 100 real documents, method/key/forgery rules, inscriptions gated by the Tray.
import test from "node:test";
import assert from "node:assert/strict";
import { METHODS, LINES, INSCRIPTIONS, FORGERIES, LEVELS, ROUND, INK, CHOICES, TOTAL_DOCS } from "../activity/src/cipherdesk/data.js";
import { start, current, cipherText, tryMethod, tryKey, preview, judge, tryClue, next, won, perfect, settle, room, readCount, unshift, unvigenere, letterCount,
  meaningsOf, readIns, unlocked, dailyOf, lineOf, forgeryOf, FORGERY_BONUS } from "../activity/src/cipherdesk/logic.js";
import { SHOP, SLOTS, buyOrUse, lookOf } from "../activity/src/cipherdesk/shop.js";
import { deskHtml, cipherHtml, inscriptionHtml } from "../activity/src/cipherdesk/scene.js";
import { file } from "../activity/src/inscriptions/logic.js";
import { SCRIPTS } from "../activity/src/inscriptions/data.js";
import { caesar, vigenere } from "../activity/src/codes.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { BANTER } from "../activity/src/banter.js";

test("100 documents, every one with a fact; 16 methods; inscriptions need real Tray scripts", () => {
  assert.equal(TOTAL_DOCS, 100); assert.equal(METHODS.length, 16); const ids = new Set();
  for (const l of LINES) { assert.ok(!ids.has(l.id), l.id); ids.add(l.id); assert.match(l.plain, /^[A-Z ]+$/, l.id); assert.ok(l.fact.length > 40, l.id); if (l.m) assert.ok(METHODS.some((m) => m.id === l.m), l.id); }
  for (const x of INSCRIPTIONS) { assert.ok(SCRIPTS.some((s) => s.id === x.need), x.id); assert.equal(x.wrong.length, 2); assert.ok(x.fact.length > 40 && x.pairs.length); }
  for (const f of FORGERIES) { assert.equal(f.wrong.length, 2); assert.ok(f.clue && f.fact.length > 40); }
  assert.equal(unvigenere(vigenere("ATTACK AT DAWN", "LEMON"), "LEMON"), "ATTACK AT DAWN"); assert.equal(unshift(caesar("VENI VIDI VICI", 5), 5), "VENI VIDI VICI");
  assert.deepEqual(letterCount("AAB B C")[0], ["A", 2]);
});

test("a round: methods, keys, forgeries and ink", () => {
  for (const L of LEVELS) for (let s = 1; s < 30; s++) { const run = start(L, { seed: s });
    assert.equal(run.items.length, ROUND); assert.equal(run.items.filter((x) => x.kind === "forgery").length, L.forgery ? 1 : 0);
    for (const it of run.items) if (it.kind === "line") { assert.equal(it.choices.length, CHOICES); assert.ok(it.choices.includes(it.m)); assert.ok(cipherText(it).length); assert.notEqual(it.key, 3); } }
  // play one round of Level 3 to the end, answering everything right except one wrong method first
  const run = start(LEVELS[2], { seed: 7 }); let first = true;
  do { const it = current(run);
    if (it.kind === "forgery") { assert.equal(judge(run, "flag"), "flagged"); const i = it.clues.indexOf(forgeryOf(it.id).clue); assert.equal(tryClue(run, i), "right"); continue; }
    if (first) { const bad = it.choices.find((m) => m !== it.m); assert.equal(tryMethod(run, bad), "wrong"); assert.equal(it.drops, INK - 1); first = false; }
    const r = tryMethod(run, it.m);
    if (r === "key") { if (it.m === "caesar") { assert.equal(preview(it, it.key), lineOf(it.id).plain); assert.equal(tryKey(run, it.key), "right"); } else assert.equal(tryKey(run, it.key), "right"); }
    else assert.equal(r, "right");
  } while (next(run));
  assert.ok(won(run)); assert.ok(!perfect(run));
  const p = {}, out = settle(p, run); assert.ok(out.won && out.xp === run.score); assert.equal(readCount(p), 5); assert.equal(settle(p, run).newRead.length, 0);
  // a forgery read as genuine cracks the seal
  const r2 = start(LEVELS[1], { seed: 3 }); while (current(r2).kind !== "forgery") next(r2); assert.equal(judge(r2, "genuine"), "cracked"); assert.equal(current(r2).drops, 0);
  assert.deepEqual(dailyOf("2026-12-01"), dailyOf("2026-12-01"));
  assert.ok(FORGERY_BONUS > 0);
});

test("inscriptions open from the Tray and pay once", () => {
  const p = {}, x = INSCRIPTIONS[0];
  assert.ok(!unlocked(p, x)); assert.equal(readIns(p, x.id, x.meaning).ok, false);
  file(p, [x.need]); assert.ok(unlocked(p, x)); assert.ok(meaningsOf(x).includes(x.meaning));
  assert.equal(readIns(p, x.id, x.wrong[0]).ok, false); assert.ok(readIns(p, x.id, x.meaning).pay); assert.equal(readIns(p, x.id, x.meaning).pay, null);
  assert.equal(readCount(p), 1);
});

test("desk kit, drawing, trophy and banter", () => {
  for (const [k] of SLOTS) assert.ok(SHOP.some((s) => s.slot === k && s.price === 0), k);
  for (const s of SHOP) { assert.match(s.id, /^cd-/); assert.ok(s.note.length > 40); }
  const p = { essence: 100 }; assert.equal(buyOrUse(p, "cd-wheel"), "poor"); assert.equal(buyOrUse(p, "cd-alberti"), "bought"); assert.equal(lookOf(p).tool, "cd-alberti");
  for (const m of METHODS) { const h = cipherHtml(m.id, "XYZ", "ABC"); assert.match(h, /cd-cipher/); }
  for (const x of INSCRIPTIONS) assert.doesNotMatch(inscriptionHtml(x, true), /undefined/);
  for (const look of [lookOf({}), { lamp: "cd-banker", tool: "cd-wheel", desk: "cd-room40" }]) assert.doesNotMatch(deskHtml({ look, doc: "x", plain: "Y", state: "cracked" }), /undefined|NaN/);
  assert.ok(TROPHIES.some((t) => t.id === "cipherdesk")); assert.equal(Object.keys(BANTER.cipherdesk).length, 10);
  void room;
});
