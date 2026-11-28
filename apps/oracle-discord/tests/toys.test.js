import { test } from "node:test";
import assert from "node:assert/strict";
import { FUTHARK, OGHAM, toFuthark, toOgham, futharkText, oghamText, oghamPath, sealRune, shareLines, cleanName } from "../activity/src/toys/runes.js";
import { ELEMENTS, CATS, bySym, lightOf, birthElement, parseDM, dayOfYear } from "../activity/src/toys/elements.js";
import { QUOTES, MOTTOES } from "../activity/src/toys/manuscripts.js";
import { homeItems, homeHtml, HOME_TABS } from "../activity/src/home.js";

test("Elder Futhark has its 24 runes in futhark order, each with a drawing", () => {
  assert.equal(FUTHARK.length, 24);
  assert.equal(FUTHARK.slice(0, 6).map((r) => r[0]).join(""), "futhark", "named after its first six letters");
  assert.equal(FUTHARK.map((r) => r[1]).join(""), "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ");
  for (const r of FUTHARK) assert.match(r[3], /^M/);
});

test("names become runes the way carvers wrote them", () => {
  assert.equal(futharkText(toFuthark("Anna").runes), "ᚨᚾᚨ", "a doubled letter is carved once");
  assert.ok(toFuthark("Anna").notes.some((n) => /doubled/.test(n)));
  assert.equal(futharkText(toFuthark("Thor").runes), "ᚦᛟᚱ", "TH is thorn");
  assert.equal(futharkText(toFuthark("Inge").runes), "ᛁᛜᛖ", "NG is ingwaz");
  assert.deepEqual(toFuthark("Cecil").runes, ["s", "e", "s", "i", "l"], "soft C is S");
  assert.deepEqual(toFuthark("Carl").runes, ["k", "a", "r", "l"], "hard C is K");
  assert.deepEqual(toFuthark("Max").runes, ["m", "a", "k", "s"]);
  assert.deepEqual(toFuthark("Quinn").runes, ["k", "w", "i", "n"]);
  assert.deepEqual(toFuthark("Victor").runes.slice(0, 1), ["w"]);
  assert.equal(futharkText(toFuthark("Mary Ann").runes), "ᛗᚨᚱᛁ᛫ᚨᚾ");
  assert.equal(cleanName("Zoë-Renée 3"), "ZoeRenee");
  assert.equal(sealRune("Frank").ch, "ᚠ");
});

test("Ogham has 20 letters in four groups of five, and swaps P and W honestly", () => {
  assert.equal(OGHAM.length, 20);
  for (let g = 0; g < 4; g++) assert.deepEqual(OGHAM.filter((o) => o[3] === g).map((o) => o[4]), [1, 2, 3, 4, 5]);
  assert.equal(oghamText(toOgham("Brian").letters), "᚛ᚁᚏᚔᚐᚅ᚜");
  const p = toOgham("Pat"); assert.equal(p.letters[0], "b"); assert.ok(p.notes.some((n) => /no P/.test(n)));
  assert.equal(toOgham("Will").letters[0], "f");
  assert.equal((oghamPath("n").match(/M/g) || []).length, 5);
  assert.equal(shareLines("Wren").length, 5);
});

test("118 elements, each with a fact, a family and its own place on the table", () => {
  assert.equal(ELEMENTS.length, 118);
  const spots = new Set();
  for (const e of ELEMENTS) {
    assert.ok(e.fact.length > 20 && e.fact.length < 160, e.s); assert.ok(CATS[e.cat], e.s);
    const k = e.place.join(); assert.ok(!spots.has(k), `${e.s} shares ${k}`); spots.add(k);
    assert.ok(e.place[1] >= 1 && e.place[1] <= 18);
  }
  assert.deepEqual(bySym("Fe").place, [4, 8]); assert.deepEqual(bySym("Au").place, [6, 11]); assert.deepEqual(bySym("U").place, [9, 6]);
  assert.equal(bySym("Og").z, 118); assert.equal(bySym("Fe").cat, "transition"); assert.equal(bySym("Ne").cat, "noble");
});

test("each element lights the right way", () => {
  assert.equal(lightOf(bySym("Na")).kind, "flame"); assert.equal(lightOf(bySym("Ne")).kind, "glow");
  assert.equal(lightOf(bySym("Es")).kind, "lab"); assert.equal(lightOf(bySym("Fe")).kind, "none");
  assert.match(lightOf(bySym("Sr")).line, /crimson/);
});

test("Your element counts the birthday along the table, DD/MM/YYYY", () => {
  assert.equal(birthElement(1, 1).el.s, "H"); assert.equal(birthElement(2, 1).el.s, "He");
  assert.equal(dayOfYear(1, 3), 61, "29 February has its own day");
  const b = birthElement(28, 4); assert.equal(b.day, 119); assert.equal(b.el.s, "H"); assert.equal(b.lap, 2);
  assert.equal(birthElement(31, 12).day, 366);
  assert.deepEqual(parseDM("09/04/1990"), { d: 9, m: 4 }); assert.deepEqual(parseDM("29/02/2000"), { d: 29, m: 2 });
  assert.equal(parseDM("29/02/2001"), null); assert.equal(parseDM("31/04/1990"), null); assert.equal(parseDM("1990-04-09"), null);
});

test("nook quotes and bookplate mottoes are complete", () => {
  assert.ok(QUOTES.length >= 10); assert.equal(new Set(QUOTES.map((q) => q.id)).size, QUOTES.length);
  for (const q of QUOTES) assert.ok(q.en && q.src && q.when && q.where && q.note, q.id);
  assert.equal(QUOTES.filter((q) => q.hoax).length, 1, "the one famous fake is labelled");
  for (const m of MOTTOES) assert.equal(m.length, 3);
});

test("toys get their own menu tab, marked Toy, not Game", () => {
  assert.ok(HOME_TABS.some((t) => t.id === "toys"));
  const rooms = [{ id: "runename", label: "Name in runes", emoji: "🪶", row: "toy", blurb: "x" }, { id: "seance", label: "Séance", emoji: "🕯️", blurb: "ghosts" }];
  const it = homeItems([], rooms, []);
  assert.deepEqual(it.toys.map((x) => x.id), ["runename"]); assert.deepEqual(it.play.map((x) => x.id), ["seance"]);
  const html = homeHtml(it, "toys", (s) => s); assert.match(html, /Just for fun/); assert.match(html, /hm-tag">Toy/);
});
