// Coded messages in Your Grimoire (activity/src/codes.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CODES, BOOK_CODES, caesar, atbash, morse, a1z26, braille, vigenere, polybius, tapCode, railFence, binary, hex, trithemius, encode, matches, tryCode, spot, codesOn, scrapHtml, glyphLayer, GLYPHS, pigpenSvg } from "../activity/src/codes.js";
import { BOOKS } from "../activity/src/book.js";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("the classic ciphers encode correctly", () => {
  assert.equal(caesar("ABC XYZ"), "DEF ABC");
  assert.equal(atbash("ABC"), "ZYX");
  assert.equal(morse("SOS"), "••• ––– •••");
  assert.equal(a1z26("ABZ"), "1-2-26");
  assert.equal(braille("AB"), "⠁⠃");
  assert.equal(vigenere("ATTACK AT DAWN", "LEMON"), "LXFOPV EF RNHR"); // the textbook example
  assert.equal(polybius("AB"), "11 12");
  assert.equal(tapCode("B"), "• ••");
  assert.equal(railFence("WEAREDISCOVERED", 3).replace(/ /g, ""), "WECRERDSOEEAIVD");
  assert.equal(binary("A"), "01000001"); assert.equal(hex("A "), "41 20");
  assert.equal(trithemius("AAA"), "ABC");
});
test("every code encodes, is unique, and only its own answer breaks it", () => {
  assert.equal(new Set(CODES.map((c) => c.id)).size, CODES.length);
  for (const c of CODES) { const e = encode(c); assert.ok(e && e.length > 3, c.id); assert.ok(matches(c, c.plain.toLowerCase()), c.id); assert.ok(!matches(c, "nonsense words"), c.id); }
  assert.ok(pigpenSvg("AZ").includes("<svg"));
});
test("bound codes point at real bindings, and every binding has glyphs", () => {
  for (const c of CODES.filter((x) => x.book)) assert.ok(BOOKS.some((b) => b.id === c.book), c.book);
  for (const b of BOOKS) assert.ok(GLYPHS[b.id] && GLYPHS[b.id].length >= 6, b.id);
  assert.equal(BOOK_CODES, 11);
  assert.ok(BOOKS.some((b) => b.id === "bk-cipher" && b.secret));
});
test("breaking codes pays once; spotting tracks new ones; pages show only their binding's codes", () => {
  const p = { essence: 0 };
  const c = tryCode(p, "stars are suns, far away!"); assert.equal(c.id, "cd-caesar"); assert.equal(p.essence, 20);
  assert.equal(tryCode(p, "STARS ARE SUNS FAR AWAY"), null); assert.equal(p.essence, 20);
  assert.deepEqual(spot(p, ["cd-caesar", "cd-morse"]), ["cd-caesar", "cd-morse"]); assert.deepEqual(spot(p, ["cd-caesar"]), []);
  assert.ok(codesOn("codex", "bk-notebook").every((x) => !x.book));
  assert.ok(codesOn("codex", "bk-atlas").some((x) => x.book === "bk-atlas"));
  assert.ok(scrapHtml(CODES[0], esc).includes('data-cd="cd-caesar"'));
  assert.equal(glyphLayer("bk-lab", "codex", "left"), glyphLayer("bk-lab", "codex", "left")); // stable per page
});
