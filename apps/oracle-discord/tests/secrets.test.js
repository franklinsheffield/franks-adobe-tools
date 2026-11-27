// Grimoire secrets and extras (activity/src/secrets.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { SECRETS, findSecret, found, toRunes, CIPHER, cipherSolved, calendarPage, moonAge, monthGrid, weekRecap, recapLine, searchLog, diary, CREED, INK, inkLit } from "../activity/src/secrets.js";
import { BOOKS } from "../activity/src/book.js";

test("seven secrets, each pays once; the two secret bindings exist", () => {
  assert.equal(SECRETS.length, 7); const p = { essence: 0 };
  const pay = findSecret(p, "gilded"); assert.ok(pay > 0 && p.essence === pay && found(p, "gilded"));
  assert.equal(findSecret(p, "gilded"), 0); assert.equal(p.essence, pay);
  for (const s of SECRETS.filter((x) => x.id === "cipher" || x.id === "sealed")) assert.ok(BOOKS.some((b) => b.secret === s.id), s.id);
  assert.deepEqual(Object.keys(INK).sort(), ["codex", "journal", "patterns"]); assert.equal(inkLit(["0-0", "0-0", "1-1"], 4), 0.5);
});

test("the margin cipher writes runes and accepts the phrase, with shared runes", () => {
  assert.equal(CIPHER.length, 3); assert.ok(CIPHER.every((c) => /^[ᚠ-᛿]+$/.test(toRunes(c.w))));
  assert.ok(cipherSolved("question every answer")); assert.ok(cipherSolved("CUESTION EVERY ANSVER")); assert.ok(!cipherSolved("science is magic"));
});

test("calendar pages: full moon, solstice, Pi Day; most days have none", () => {
  assert.equal(calendarPage(Date.UTC(2026, 0, 3, 12)).id, "fullmoon"); // full moon 3 Jan 2026
  assert.ok(Math.abs(moonAge(Date.UTC(2026, 0, 18, 19)) - 0) < 1.2 || moonAge(Date.UTC(2026, 0, 18, 19)) > 28.3); // new moon 18 Jan 2026
  assert.equal(calendarPage(new Date(2027, 2, 14, 12).getTime()).id, "piday");
  assert.equal(calendarPage(new Date(2027, 5, 21, 12).getTime()).id, "solstice");
  assert.equal(calendarPage(new Date(2026, 1, 10, 12).getTime()), null);
});

test("month grid, weekly recap, search and the diary use the member's own data", () => {
  const now = new Date(2026, 10, 27, 12).getTime(), log = [{ at: now, k: "reading", t: "Tarot: The Star" }, { at: now - 864e5, k: "game", t: "Séance, Level 1: won" }, { at: now - 30 * 864e5, k: "game", t: "Duel: lost" }];
  const g = monthGrid(log, 2026, 10); assert.equal(g.length % 7, 0); assert.equal(g.find((c) => c && c.d === 27).n, 1);
  const r = weekRecap(log, now); assert.deepEqual([r.readings, r.won, r.lost, r.days], [1, 1, 0, 2]);
  assert.match(recapLine(r, "Ana"), /Ana: 1 reading, 1 game won/); assert.ok(!/you should|will happen/i.test(recapLine(r)));
  assert.equal(searchLog(log, "the star")[0].t, "Tarot: The Star"); assert.equal(searchLog(log, "").length, 0);
  assert.equal(diary({ readings: 3 }, "Ana").length, 8); assert.equal(CREED.length, 6);
});
