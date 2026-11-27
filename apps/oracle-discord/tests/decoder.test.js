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

test("Decoder tablets are on sale in the Essence store and each one has a look", async () => {
  const { SHOP, tabletOf } = await import("../activity/src/decoder/shop.js");
  const { room } = await import("../activity/src/decoder/room.js");
  const { STORE, KINDS, SHOP_TALK, ensureFree, buy, registerShelf, shelf } = await import("../activity/src/store.js");
  const { CSS } = await import("../activity/src/decoder/style.js");
  assert.equal(room.shop.kind, "tablet"); assert.equal(typeof room.shop.preview, "function");
  registerShelf(room.shop); assert.equal(shelf("tablet"), room.shop);
  assert.ok(KINDS.some(([k]) => k === "tablet") && SHOP_TALK.tablet.buy.length);
  for (const it of SHOP.items) assert.equal(STORE.filter((s) => s.id === it.id).length, 1, `${it.id} is unique in the store`);
  for (const it of SHOP.items) {
    assert.ok(it.id.startsWith("tab-") && STORE.some((s) => s.id === it.id && s.kind === "tablet") && it.price >= 0, it.id);
    if (it.price) assert.ok(CSS.includes(`[data-tablet="${tabletOf(it.id)}"]`), `${it.id} has CSS`);
    assert.ok(LEVELS.some((l) => l.id === it.sample), `${it.id} sample level`);
  }
  const p = ensureFree({ essence: 100 });
  assert.ok(p.owned.includes("tab-starlit")); assert.equal(tabletOf(p.tablet), "starlit");
  assert.ok(buy(p, "tab-birch")); assert.equal(p.essence, 40); assert.ok(!buy(p, "tab-bracteate"));
});


test("Decoder has a sound for every script and moment, and stays silent without audio", async () => {
  const { SFX, play } = await import("../activity/src/decoder/sfx.js");
  for (const k of ["carve", "wrong", "open", "page", "zoom", "solve", "stars", "right", "tap"]) assert.equal(typeof SFX[k], "function", k);
  assert.doesNotThrow(() => { play("carve", "futhark", 3); play("open", "maya"); play("nope"); });
  const { CSS } = await import("../activity/src/decoder/style.js");
  for (const a of ["dec-carve", "dec-wave", "dec-star", "dec-spark", "prefers-reduced-motion"]) assert.ok(CSS.includes(a), a);
});


test("Scribe's Hand: every decode level is winnable by a perfect scribe, and mistakes cost ink", async () => {
  const { deal, playCard, drawCard, needed, inkFor, HAND, HAND_MAX } = await import("../activity/src/decoder/engine.js");
  const { room } = await import("../activity/src/decoder/room.js");
  assert.equal(room.row, "cards");
  for (const l of LEVELS.filter((x) => x.kind === "decode")) {
    let wins = 0;
    for (let s = 0; s < 40; s++) {
      const g = deal(l, "t" + s); assert.equal(g.hand.length, HAND); assert.equal(g.ink, inkFor(l));
      const all = [...g.hand, ...g.deck].map((c) => c.v);
      for (const v of target(l)) assert.ok(all.includes(v), `${l.id} deck has ${v}`);
      for (let n = 0; n < 400 && !g.lost; n++) { const c = g.hand.find((x) => x.v === needed(l, g));
        if (c) { if (playCard(l, g, c.id).done) { wins++; break; } } else assert.ok(drawCard(l, g), `${l.id} can draw`);
        assert.ok(g.hand.length <= HAND_MAX); }
    }
    assert.equal(wins, 40, `${l.id} always winnable`);
  }
  const l = LEVELS.find((x) => x.id === "r1"), g = deal(l, "x"), ink = g.ink, bad = g.hand.find((c) => c.v !== needed(l, g)) || { id: -1 };
  if (bad.id >= 0) { assert.equal(playCard(l, g, bad.id).ok, false); assert.equal(g.ink, ink - 2); assert.equal(g.misses, 1); }
  while (!g.lost) { const c = g.hand.find((x) => x.v !== needed(l, g)); if (!c) { if (!drawCard(l, g)) break; continue; } playCard(l, g, c.id); }
  assert.ok(g.lost || g.ink <= 1, "running dry loses the level");
});


test("power cards: earned with a new three stars, capped, two per level, each does its job", async () => {
  const E = await import("../activity/src/decoder/engine.js");
  const p = {}; assert.deepEqual(E.satchel(p), { rosetta: 1, ink: 1, scholar: 1 });
  assert.ok(E.complete(p, "r1", 3).power); assert.equal(E.complete(p, "r1", 3).power, null, "only a new ★★★ earns");
  assert.equal(E.complete(p, "r2", 2).power, null);
  for (let i = 0; i < 30; i++) E.grantPower(p, "x" + i);
  for (const k of E.POWER_ORDER) assert.equal(E.satchel(p)[k], E.POWER_CAP);
  const l = LEVELS.find((x) => x.id === "o2"), g = E.deal(l, "pw");
  const need = E.needed(l, g), r = E.usePower(l, p, g, "rosetta"); assert.ok(r.ok); assert.equal(g.picks[0], need);
  g.ink = 2; E.usePower(l, p, g, "ink"); assert.equal(g.ink, Math.min(g.well, 5));
  assert.equal(E.canPower(p, g, "scholar"), false, "two per level");
  const g2 = E.deal(l, "pw2"), pk = E.usePower(l, p, g2, "scholar").peek; assert.equal(pk.length, 3);
  const n = g2.hand.length; assert.ok(E.takePeek(g2, pk[1].id)); assert.equal(g2.hand.length, n + 1);
  const g3 = E.deal(l, "pw3"); g3.noPowers = true; assert.equal(E.canPower(p, g3, "ink"), false, "daily has no powers");
});
