import test from "node:test";
import assert from "node:assert";
import { RUNES, SPREADS } from "../src/modules/runes/data.js";
import { draw } from "../src/modules/runes/index.js";
import { OMENS, crack, dayGanzhi, divine } from "../src/modules/oraclebones/index.js";
import { ODU } from "../src/modules/ifa/data.js";
import { cast, oduOf, oduName } from "../src/modules/ifa/index.js";
import { MODULES } from "../src/registry.js";

const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const fits = (embeds) => embeds.every((e) => (e.title || "").length <= 256 && (e.description || "").length <= 4096
  && e.fields.every((f) => f.name.length <= 256 && f.value.length <= 1024 && f.value.length > 0));

test("runes: 24 in Futhark order, three aettir, merkstave only for reversible runes", () => {
  assert.equal(RUNES.length, 24);
  assert.equal(RUNES.map((r) => r.ch).join(""), "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ");
  RUNES.forEach((r) => { assert.ok(r.up); assert.equal(!!r.mk, r.rev, r.n); });
  const rand = seeded(9); let merk = 0, rev = 0;
  for (let i = 0; i < 4000; i++) {
    const c = draw(5, rand);
    assert.equal(new Set(c.map((d) => d.i)).size, 5); // no repeats in one draw
    for (const d of c) { if (d.merk) { merk++; assert.ok(d.rune.rev); } if (d.rune.rev) rev++; }
  }
  assert.ok(Math.abs(merk / rev - 0.5) < 0.03);
});

test("oracle bones: day count, omen odds, pairing", () => {
  const d = dayGanzhi(new Date(Date.UTC(1999, 11, 31, 20))); // 2000-01-01 in China = 戊午
  assert.equal(d.stem.hz + d.branch.hz, "戊午");
  const rand = seeded(3), n = {}; for (let i = 0; i < 20000; i++) { const o = crack(rand).omen.hz; n[o] = (n[o] || 0) + 1; }
  const tot = OMENS.reduce((a, o) => a + o.w, 0);
  for (const o of OMENS) assert.ok(Math.abs(n[o.hz] / 20000 - o.w / tot) < 0.02, o.hz);
  const r = divine("", seeded(5)); assert.ok(r.routine && r.verdict);
});

test("ifa: 16 distinct principal Odù, 256 combinations, uniform legs", () => {
  assert.equal(new Set(ODU.map((o) => o.marks.join(""))).size, 16);
  assert.equal(oduOf([1, 1, 1, 1]), 0); assert.equal(oduOf([2, 2, 2, 2]), 1);
  assert.equal(oduName(0, 0), "Èjì Ogbè"); assert.equal(oduName(0, 1), "Ogbè Ọ̀yẹ̀kú");
  const seen = new Set(), rand = seeded(11);
  for (let i = 0; i < 20000; i++) { const c = cast(rand); assert.ok(c.r >= 0 && c.l >= 0); seen.add(c.number); }
  assert.equal(seen.size, 256);
});

test("cast modules run end to end, fit Discord, and label themselves honestly", async () => {
  for (const [name, o] of [["runes", { spread: "five", question: "q" }], ["runes", {}], ["oraclebones", { question: "It will rain", bone: "ox" }], ["ifa", { question: "q" }]]) {
    assert.ok(MODULES.includes(name));
    const m = await import(`../src/modules/${name}/index.js`);
    const r = await m.run(o, { user: "test" });
    assert.ok(fits(r.embeds), name); assert.ok(r.headline); assert.ok(r.files[0].data.length > 10000);
    assert.ok(m.command.options.some((x) => x.name === "private"));
    if (name === "ifa") assert.match(JSON.stringify(r.embeds), /not a consultation with a babaláwo/);
    if (name === "oraclebones") assert.equal(r.reading.charge, "It will rain");
  }
});
