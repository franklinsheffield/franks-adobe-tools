// Rune and Glyph Decoder: levels are self-consistent and the scoring is fair.
import test from "node:test";
import assert from "node:assert/strict";
import { SCRIPTS, LEVELS, levelsOf } from "../activity/src/decoder/levels.js";
import { target, tiles, check, hint, starsFor, writeIn, mayaOf, complete, unlocked, glyphsOf, signOf } from "../activity/src/decoder/engine.js";

const read = (id) => target(LEVELS.find((l) => l.id === id)).join("");

test("decode targets are the real inscriptions", () => {
  assert.equal(read("r1"), "futhark");
  assert.equal(read("r2"), "alulathu");
  assert.equal(read("r3"), "runofaihido");
  assert.equal(read("r4"), "ekhlewagastizholtijazhornatawido");
  assert.equal(read("o1"), "luissail");
  assert.equal(read("o2"), "beithcoll");
  assert.equal(read("o3"), "ogam");
  assert.equal(read("o4"), "maqimucoi");
  assert.equal(read("e1"), "rn");
  assert.equal(read("e2"), "ptolmys");
  assert.equal(read("e3"), "kliopadrat(she)");
  assert.equal(read("e4"), "imnntwtankh");
  assert.deepEqual(target(LEVELS.find((l) => l.id === "m3")), ["9", "8", "9", "13", "0"]);
});

test("every sign needed has been taught by then, and every tile set can spell the answer", () => {
  for (const l of LEVELS.filter((x) => x.kind === "decode")) {
    const t = new Set(tiles(l));
    for (const v of target(l)) assert.ok(t.has(v), `${l.id}: "${v}" not on a tile`);
    assert.ok(target(l).length > 0, l.id);
    assert.equal(glyphsOf(l).length, target(l).length);
    assert.ok(l.q && l.q.choices[l.q.right], l.id + " has a question");
  }
});

test("scripts are complete and unique", () => {
  assert.equal(SCRIPTS.futhark.signs.length, 24);
  assert.equal(SCRIPTS.ogham.signs.length, 20);
  assert.equal(new Set(SCRIPTS.futhark.signs.map((s) => s.v)).size, 24);
  assert.equal(SCRIPTS.maya.signs.length, 20);
  for (const k of ["futhark", "ogham", "egyptian"]) for (const g of Object.values(SCRIPTS[k].write).join("")) assert.ok(signOf(k, g), `${k} write ${g}`);
});

test("checking, hints and stars", () => {
  const l = LEVELS[0];
  assert.deepEqual(check(l, ["f", "u"]), { ok: true, wrongAt: -1, done: false });
  assert.equal(check(l, ["f", "a"]).wrongAt, 1);
  assert.equal(check(l, target(l)).done, true);
  assert.equal(hint(l, ["f"]), "u");
  assert.equal(starsFor({}), 3);
  assert.equal(starsFor({ peeks: 1 }), 2);
  assert.equal(starsFor({ misses: 2 }), 2);
  assert.equal(starsFor({ hints: 1 }), 1);
});

test("write your name", () => {
  assert.deepEqual(writeIn("futhark", "Thor"), ["ᚦᛟᚱ"]);
  assert.deepEqual(writeIn("ogham", "Frank"), ["ᚃᚏᚐᚅᚉ"]);
  assert.deepEqual(writeIn("egyptian", "Cleo Patra"), ["𓎡𓃭𓇋𓍯", "𓊪𓄿𓏏𓂋𓄿"]);
  assert.deepEqual(writeIn("futhark", "Zoë!"), ["ᛉᛟᛖ"]);
});

test("Maya dates match the famous ones", () => {
  assert.deepEqual(mayaOf("2012-12-21").longCount, [13, 0, 0, 0, 0]);
  const p = mayaOf("2012-12-21"); assert.equal(`${p.tone} ${p.signName}`, "4 Ajaw");
  assert.equal(mayaOf("nope"), null);
  assert.equal(mayaOf("-4000-01-01"), null);
});

test("rewards only for improvement; levels unlock in order", () => {
  const p = { codex: {} };
  assert.equal(unlocked(p, "r1"), true);
  assert.equal(unlocked(p, "r2"), false);
  const a = complete(p, "r1", 2); assert.equal(a.xp, 15); assert.equal(a.essence, 15); assert.equal(a.newCodex, "The futhark");
  assert.equal(unlocked(p, "r2"), true);
  const b = complete(p, "r1", 2); assert.equal(b.xp, 0); assert.equal(b.newCodex, null);
  const c = complete(p, "r1", 3); assert.equal(c.xp, 5); assert.equal(p.rooms.decoder.solved.r1, 3);
  assert.deepEqual(p.rooms.decoder.codex, ["The futhark"]); assert.equal(p.rooms.decoder.plays, 3);
  assert.equal(levelsOf("futhark").length, 5);
});

test("each study guide covers its levels' questions", async () => {
  const { GUIDES } = await import("../activity/src/decoder/guide.js");
  const need = {
    futhark: ["first six runes", "Bracteates", "painted", "Hlewagastiz", "aettir"],
    ogham: ["Beith-Luis-Nin", "Ogma", "MUCOI", "tree", "aicme"],
    egyptian: ["only consonants", "Champollion", "stool (p), lasso (o) and lion (l)", "honorific transposition", "Rosetta"],
    maya: ["shell = 0", "earliest true zeros", "13th b'ak'tun", "Pakal", "4772"],
  };
  for (const [k, words] of Object.entries(need)) {
    const g = GUIDES[k]; assert.ok(g && g.sections.length >= 5, k);
    const text = g.sections.flatMap((s) => s.p).join(" ").replace(/<[^>]+>/g, "");
    for (const w of words) assert.ok(text.includes(w), `${k} guide mentions "${w}"`);
  }
});
