import test from "node:test";
import assert from "node:assert";
import { reduce, nameNumber, lifePath, numerology, isVowelAt } from "../src/modules/numerology/calc.js";
import { lunarNewYear, ymd, fourPillars, zodiacYear, jdn, pillar } from "../src/modules/chinesezodiac/calendar.js";
import { mayaDate } from "../src/modules/mayan/calendar.js";
import { godFor, coptic } from "../src/modules/egyptian/index.js";
import { treeFor, festivalSeason } from "../src/modules/celtic/index.js";
import { MODULES } from "../src/registry.js";
import { BIRTH_FIELDS, fieldsFor, needsForm, fillFromProfile, birthModal, fromModal, checkBirth } from "../src/profiles.js";

const B = (s) => { const [year, month, day] = s.split("-").map(Number); return { year, month, day, hour: 12, minute: 0 }; };
const fits = (embeds) => embeds.every((e) => (e.title || "").length <= 256 && (e.description || "").length <= 4096 && (e.fields || []).length <= 25
  && e.fields.every((f) => f.name.length <= 256 && f.value.length <= 1024 && f.value.length > 0));

test("numerology: reduction keeps masters, life path by parts", () => {
  assert.deepEqual(reduce(29).chain, [29, 11]);
  assert.equal(reduce(38).value, 11);
  assert.equal(reduce(29, false).value, 2);
  assert.equal(lifePath(B("1992-11-29")).value, 7);   // 11 + 11 + 3 = 25 -> 7
  assert.equal(lifePath(B("1815-12-10")).value, 1);   // 3 + 1 + 6
  assert.equal(lifePath(B("2009-11-11")).value, 33);  // 11 + 11 + 11
});

test("numerology: Pythagorean letters, Y rule, accents", () => {
  assert.equal(nameNumber("Ada", "all").value, 6);
  assert.ok(isVowelAt("MARY", 3)); assert.ok(!isVowelAt("MAYA", 2));
  assert.equal(nameNumber("José").value, nameNumber("Jose").value);
  const mary = nameNumber("Mary", "consonants"); // M4 + R9 = 13 -> 4, karmic 13
  assert.equal(mary.value, 4); assert.equal(mary.karmic, 13);
  assert.throws(() => nameNumber("123"));
});

test("numerology: full reading fits Discord", async () => {
  const { readingEmbeds } = await import("../src/modules/numerology/index.js");
  for (const [n, d] of [["Ada Lovelace", "1815-12-10"], ["Maria José Núñez-Yolanda", "1992-11-29"], ["Li", "2000-02-29"], ["Bryan Lynn Wyatt", "1977-07-07"]]) {
    const r = numerology(n, B(d), new Date(Date.UTC(2026, 10, 27)));
    assert.ok(r.current && r.pinnacles.length === 4);
    assert.ok(fits(readingEmbeds(r)));
  }
});

test("chinese: lunar new year matches published dates", () => {
  const known = { 1900: "1900-01-31", 1912: "1912-02-18", 1950: "1950-02-17", 1954: "1954-02-03", 1966: "1966-01-21", 1976: "1976-01-31", 1984: "1984-02-02",
    1985: "1985-02-20", 1990: "1990-01-27", 1997: "1997-02-07", 2000: "2000-02-05", 2006: "2006-01-29", 2010: "2010-02-14", 2015: "2015-02-19", 2017: "2017-01-28",
    2020: "2020-01-25", 2021: "2021-02-12", 2022: "2022-02-01", 2023: "2023-01-22", 2024: "2024-02-10", 2025: "2025-01-29", 2026: "2026-02-17", 2033: "2033-01-31", 2061: "2061-01-21" };
  for (const [y, d] of Object.entries(known)) assert.equal(ymd(lunarNewYear(+y)), d, y);
});

test("chinese: animal changes on lunar new year, day pillar anchor, Bruce Lee's four pillars", () => {
  assert.equal(zodiacYear(B("1990-01-26")).branch.animal, "Snake");
  assert.equal(zodiacYear(B("1990-01-27")).branch.animal, "Horse");
  assert.equal(zodiacYear(B("2026-11-27")).stem.el, "Fire");
  const d = pillar(jdn(2000, 1, 1) + 49); assert.equal(d.stem.hz + d.branch.hz, "戊午");
  // Bruce Lee: 27 Nov 1940, 07:12, San Francisco (PST, UTC-8): 庚辰 丁亥 甲戌 戊辰
  const p = fourPillars(new Date(Date.UTC(1940, 10, 27, 15, 12)), { year: 1940, month: 11, day: 27, hour: 7, minute: 12 });
  assert.deepEqual([p.year, p.month, p.day, p.hour].map((x) => x.stem.hz + x.branch.hz), ["庚辰", "丁亥", "甲戌", "戊辰"]);
});

test("mayan: GMT 584283 anchors", () => {
  const a = mayaDate({ year: 2012, month: 12, day: 21 });
  assert.equal(a.longCount.join("."), "13.0.0.0.0"); assert.equal(`${a.tone} ${a.signName}`, "4 Ajaw"); assert.equal(a.haabName, "3 K'ank'in"); assert.equal(a.kin, 160); assert.equal(a.lord, 9);
  const b = mayaDate({ year: 2012, month: 12, day: 22 });
  assert.equal(`${b.tone} ${b.signName}`, "5 Imix"); assert.equal(b.haabName, "4 K'ank'in");
});

test("egyptian: every day has a deity; Coptic anchors", () => {
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= new Date(Date.UTC(2024, m, 0)).getUTCDate(); d++) assert.ok(godFor(m, d), `${m}/${d}`);
  assert.equal(godFor(1, 20), "Amun-Ra"); assert.equal(godFor(12, 31), "Isis");
  const c = coptic({ year: 2023, month: 9, day: 12 }); assert.deepEqual([c.year, c.month, c.day], [1740, 1, 1]);
  const x = coptic({ year: 2025, month: 1, day: 7 }); assert.deepEqual([x.name, x.day], ["Koiak", 29]); // Coptic Christmas
});

test("celtic: tree boundaries and festivals", () => {
  assert.equal(treeFor(12, 24).tree, "Birch"); assert.equal(treeFor(1, 20).tree, "Birch"); assert.equal(treeFor(1, 21).tree, "Rowan");
  assert.equal(treeFor(12, 23).tree, "The Nameless Day"); assert.equal(treeFor(11, 25).tree, "Elder"); assert.equal(treeFor(6, 10).tree, "Oak");
  assert.equal(festivalSeason(1, 15).name, "Samhain"); assert.equal(festivalSeason(5, 1).name, "Beltane");
});

test("all new modules run end to end and fit Discord", async () => {
  const now = new Date(Date.UTC(2026, 10, 27));
  const cases = [["numerology", { name: "Ada Lovelace", date: "1815-12-10", show_name: true }], ["chinesezodiac", { date: "1990-01-20", time: "23:30", place: "Phoenix" }],
    ["mayan", { date: "1990-01-20" }], ["egyptian", { date: "2000-02-29" }], ["celtic", { date: "1990-12-23" }]];
  for (const [name, o] of cases) {
    assert.ok(MODULES.includes(name));
    const m = await import(`../src/modules/${name}/index.js`);
    assert.equal(m.command.name, name);
    const r = await m.run(o, { now, geocoded: { lat: 33.45, lon: -112.07, name: "Phoenix, USA" }, user: "test" });
    assert.ok(fits(r.embeds), name); assert.ok(r.headline, name);
    assert.ok(r.files[0].data.length > 10000, name);
    assert.ok(m.command.options.some((x) => x.name === "private"), name);
  }
});

test("profile form asks only what each system needs", async () => {
  class KV { m = new Map(); async get(k) { return this.m.get(k) ?? null; } async put(k, v) { this.m.set(k, v); } async delete(k) { this.m.delete(k); } }
  const env = { PROFILES: new KV(), ORACLE_KEY: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64") };
  const f = fieldsFor("numerology", {});
  assert.deepEqual(f.need, ["date", "name"]);
  const o = {}; fillFromProfile(o, f, { date: "1990-01-01", time: "unknown", place: "Phoenix" });
  assert.equal(needsForm(o, f), true); // name missing
  const m = await birthModal(env, "numerology", o, f);
  assert.deepEqual(m.data.components.map((r) => r.components[0].custom_id), ["date", "name", "save"]);
  const it = { data: { custom_id: m.data.custom_id, components: [{ components: [{ custom_id: "date", value: "1990-01-01" }] }, { components: [{ custom_id: "name", value: "Ada King" }] }, { components: [{ custom_id: "save", value: "y" }] }] } };
  const r = await fromModal(env, it);
  assert.equal(r.options.name, "Ada King"); assert.deepEqual(r.profile, { date: "1990-01-01", name: "Ada King" });
  assert.equal(checkBirth(r.profile, r.need), null);
  const { saveProfile, loadProfile } = await import("../src/profiles.js");
  await saveProfile(env, "1", { date: "1990-01-01", time: "14:00", place: "Phoenix" });
  await saveProfile(env, "1", r.profile); // merge keeps place + time
  assert.deepEqual((({ date, time, place, name }) => ({ date, time, place, name }))(await loadProfile(env, "1")), { date: "1990-01-01", time: "14:00", place: "Phoenix", name: "Ada King" });
  assert.deepEqual(fieldsFor("mayan", {}).need, ["date"]);
  for (const k of ["chinesezodiac", "mayan", "egyptian", "celtic"]) assert.ok(BIRTH_FIELDS[k]);
});
