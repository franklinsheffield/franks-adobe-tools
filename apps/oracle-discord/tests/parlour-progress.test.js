// Séance Parlour progression (activity/src/parlour): the Rogues' Gallery, the Final Séance, the Method Book, Top of the Bill.
import test from "node:test";
import assert from "node:assert/strict";
import { PAIRS, pairState, pairsDone, portraitsLit, settleGallery, PAIR_PAY, ALL_PAY } from "../activity/src/parlour/gallery.js";
import { MILESTONES, MESSAGE, encodeLetter, decodeWords, lettersEarned, allEarned, solveFinale, finaleDone, CROWN_PAY, CURTAIN_CALL } from "../activity/src/parlour/finale.js";
import { wallSvg, finaleSvg, methodBookHtml, galleryCodex, MARGIN, MARGIN_WORDS } from "../activity/src/parlour/room.js";
import { CASES } from "../activity/src/casefiles/data.js";
import { room as cf } from "../activity/src/casefiles/logic.js";
import { room as ws } from "../activity/src/workshop/logic.js";
import { room as bk } from "../activity/src/bookings/logic.js";
import { room as mt } from "../activity/src/mentalist/logic.js";
import { room as ph } from "../activity/src/phantasmagoria/logic.js";
import { room as seance } from "../activity/src/seance/logic.js";
import { SETS } from "../activity/src/trophies.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("the gallery: 20 pairs on real cases; claimant by case, exposer by case or Séance ghost; pays once", () => {
  assert.equal(PAIRS.length, 20); assert.equal(new Set(PAIRS.map((x) => x.id)).size, 20);
  for (const x of PAIRS) { assert.ok(x.cases.every((id) => CASES.some((c) => c.id === id)), x.id); assert.ok(x.a.year >= 1700 && x.b.year >= x.a.year, x.id); }
  const p = { essence: 0 }; assert.equal(portraitsLit(p), 0);
  seance(p).solved["2:houdini"] = 9; assert.deepEqual(pairState(p, PAIRS.find((x) => x.id === "margery")), { a: false, b: true, done: false });
  cf(p).solved.push("margery", "fox"); assert.equal(pairsDone(p), 2);
  const r = settleGallery(p); assert.equal(r.gems, 2 * PAIR_PAY); assert.equal(p.essence, 2 * PAIR_PAY); assert.equal(settleGallery(p).gems, 0, "pays once");
  cf(p).solved.push(...PAIRS.flatMap((x) => x.cases)); assert.equal(settleGallery(p).keys, ALL_PAY); assert.equal(settleGallery(p).keys, 0);
});

test("the Final Séance: the real Rosabelle code, 7 milestones, then decode BELIEVE", () => {
  assert.deepEqual(MESSAGE.split("").map((c) => encodeLetter(c).join("-")), ["Answer", "Tell", "Pray-Answer", "Look", "Tell", "Answer-Answer", "Tell"]);
  assert.equal([..."BELIEVE"].map((c) => decodeWords(encodeLetter(c))).join(""), "BELIEVE"); assert.equal(decodeWords(["Nonsense"]), null);
  assert.deepEqual(MILESTONES.map((m) => m.ch).join(""), MESSAGE);
  const p = { essence: 0 }; assert.equal(solveFinale(p, "believe"), "locked");
  cf(p).solved.push(...CASES.slice(0, 10).map((c) => c.id), ...PAIRS.flatMap((x) => x.cases)); ws(p).rep.push(..."abcdefghij".split(""));
  bk(p).shows = 10; p.trophies = { darkseance: { perfect: { 3: true } } }; mt(p).wins[2] = 1; ph(p).wins[3] = 1;
  assert.deepEqual(lettersEarned(p), [true, true, true, true, true, true, true]); assert.ok(allEarned(p));
  assert.equal(solveFinale(p, "relieve"), "wrong"); assert.equal(solveFinale(p, " Believe! "), "solved"); assert.equal(p.essence, CROWN_PAY.gem); assert.ok(finaleDone(p)); assert.equal(solveFinale(p, "believe"), "already");
  assert.ok(CURTAIN_CALL.length >= 8 && CURTAIN_CALL.every(([n, l]) => /\d{4}/.test(n) && l.length > 30));
});

test("wall, table, Method Book with margin notes in code, codex, and the Top of the Bill set", () => {
  const p = { essence: 0 }; cf(p).solved.push("fox");
  assert.match(wallSvg(p), /^<svg[\s\S]*<\/svg>$/); assert.match(finaleSvg(p, true), /Rosabelle, believe/);
  const b = methodBookHtml(p, esc); assert.match(b, /The Hydesville Rappings/); assert.match(b, /In the margins/);
  MARGIN.forEach((m, i) => assert.equal(m.split(" · ").map((g) => decodeWords(g.split(" "))).join(""), MARGIN_WORDS[i]));
  assert.match(galleryCodex(p, esc), /1 \/ 20 pairs/);
  assert.deepEqual(SETS.find((s) => s.id === "topbill").ids, ["seance", "timeline", "darkseance", "mentalist", "phantasmagoria"]);
});
