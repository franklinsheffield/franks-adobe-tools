// Milestone 2 of the birth moment: the date-only systems (Maya, Egyptian, Celtic) take an optional time and place.
import test from "node:test";
import assert from "node:assert/strict";
import { birthMoment, dayReckoning } from "../src/moment.js";
import { run as mayan } from "../src/modules/mayan/index.js";
import { run as egyptian } from "../src/modules/egyptian/index.js";
import { run as celtic } from "../src/modules/celtic/index.js";
import { run as numerology } from "../src/modules/numerology/index.js";
import { BIRTH_FIELDS, needsForm, birthModal, fillFromProfile } from "../src/profiles.js";

const PHX = { lat: 33.4484, lon: -112.074, name: "Phoenix, Arizona, USA" };
const ctx = { geocoded: PHX, user: "tester", now: new Date("2026-11-27T12:00:00Z") };
const text = (r) => JSON.stringify(r.analysis);
const SYSTEMS = { mayan, egyptian, celtic };

test("day reckoning: night births belong to a neighbouring day when days start at sunset or sunrise", () => {
  const late = dayReckoning(birthMoment({ year: 1990, month: 4, day: 9, hour: 21, minute: 30 }, PHX));
  assert.equal(late.afterSunset, true); assert.deepEqual(late.fromSunset, { year: 1990, month: 4, day: 10 }); assert.deepEqual(late.fromSunrise, late.civil);
  const early = dayReckoning(birthMoment({ year: 1990, month: 4, day: 9, hour: 3, minute: 0 }, PHX));
  assert.equal(early.beforeSunrise, true); assert.deepEqual(early.fromSunrise, { year: 1990, month: 4, day: 8 }); assert.deepEqual(early.fromSunset, early.civil);
  const noon = dayReckoning(birthMoment({ year: 1990, month: 4, day: 9, hour: 12, minute: 0 }, PHX));
  assert.equal(noon.beforeSunrise || noon.afterSunset, false);
  assert.equal(dayReckoning(birthMoment({ year: 1990, month: 4, day: 9, hour: 12, minute: 0 }, PHX, false)), null, "no time, no day boundary claim");
  assert.equal(dayReckoning(null), null);
});

test("date-only systems still run from the date alone and say what a time and place would add", async () => {
  for (const [name, run] of Object.entries(SYSTEMS)) {
    const r = await run({ date: "1990-04-09" }, ctx);
    assert.equal(r.moment, null, name);
    assert.match(text(r), /only the date is used here/, name);
    assert.doesNotMatch(text(r), /Day boundary/, name);
  }
});

test("with a time and place the reading uses day or night and the day boundary", async () => {
  for (const [name, run] of Object.entries(SYSTEMS)) {
    const r = await run({ date: "1990-04-09", time: "21:30", place: "Phoenix, USA", private: true }, ctx);
    assert.ok(r.moment && r.moment.timeKnown, name);
    assert.match(text(r), /Day boundary/, name);
    assert.match(text(r), /sunset/, name);
    const day = await run({ date: "1990-04-09", time: "12:00", place: "Phoenix, USA", private: true }, ctx);
    assert.notEqual(text(day), text(r), name + ": a noon birth reads differently from a night birth");
  }
  const m = await mayan({ date: "1990-04-09", time: "21:30", place: "Phoenix, USA", private: true }, ctx);
  const next = await mayan({ date: "1990-04-10" }, ctx);
  assert.ok(text(m).includes(`${next.reading.tone} ${next.reading.signName}`), "a night birth names the next day's sign as the sunset-count alternative");
  const e = await egyptian({ date: "1990-04-09", time: "21:30", place: "Phoenix, USA", private: true }, ctx);
  assert.match(text(e), /hour of the night/);
});

test("a place without a time gives the Moon that day, and no day or night claim", async () => {
  for (const [name, run] of Object.entries(SYSTEMS)) {
    const r = await run({ date: "1990-04-09", place: "Phoenix, USA", time_unknown: true, private: true }, ctx);
    assert.ok(r.moment && !r.moment.timeKnown, name);
    assert.doesNotMatch(text(r), /Day boundary|hour of the night/, name);
  }
});

test("public readings do not print the clock time, the place or coordinates", async () => {
  for (const [name, run] of Object.entries(SYSTEMS)) {
    const r = await run({ date: "1990-04-09", time: "21:47", place: "Phoenix, USA" }, ctx);
    const s = JSON.stringify(r.embeds);
    assert.doesNotMatch(s, /21:47|9:47|Phoenix|33\.4|112\.0/, name);
  }
});

test("numerology says that time and place change nothing", async () => {
  const r = await numerology({ date: "1990-04-09", name: "Mary Ann Smith" }, ctx);
  assert.match(r.analysis.method.join(" "), /time|place/i);
});

test("intake: only the birthday is required; a blank optional field warns once, then the reading runs", async () => {
  const { missingOptional, accuracyWarning, fromModal, accuracyPrompt, pendingBirth } = await import("../src/profiles.js");
  class KV { m = new Map(); async get(k) { return this.m.get(k) ?? null; } async put(k, v) { this.m.set(k, v); } async delete(k) { this.m.delete(k); } }
  const env = { PROFILES: new KV(), ORACLE_KEY: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64") };
  for (const [name, f] of Object.entries(BIRTH_FIELDS)) {
    assert.deepEqual(f.need, ["date"], name);
    const modal = await birthModal(env, name.split(":")[0], name.includes(":") ? { subcommand: name.split(":")[1] } : {}, f), rows = modal.data.components.map((r) => r.components[0]);
    assert.ok(rows.length <= 5, "Discord allows five rows");
    for (const c of rows) assert.equal(!!c.required, c.custom_id === "date", `${name}: ${c.custom_id}`);
  }
  const f = BIRTH_FIELDS.humandesign;
  assert.equal(needsForm({ date: "1990-04-09" }, f), true, "typed with blanks: the form is offered once");
  assert.equal(needsForm({ date: "1990-04-09", accuracy_ok: true }, f), false, "after Continue anyway it runs");
  assert.equal(needsForm({ date: "1990-04-09", time: "21:30", place: "Phoenix" }, f), false);
  assert.deepEqual(missingOptional({ date: "1990-04-09", place: "Phoenix" }, f), ["time"]);
  assert.match(accuracyWarning(["time", "place"]), /less accurate without the birth time .*and the birth city/);
  const o = {}; fillFromProfile(o, f, { date: "1990-04-09", time: "21:30", place: "Phoenix, USA" });
  assert.equal(o.time, "21:30"); assert.equal(o.place, "Phoenix, USA");
  // the Discord flow: submit with blanks -> one warning with two buttons -> the details wait for "Continue anyway"
  const modal = await birthModal(env, "humandesign", {}, f);
  const m = await fromModal(env, { data: { custom_id: modal.data.custom_id, components: [{ components: [{ custom_id: "date", value: "09/04/1990" }] }, { components: [{ custom_id: "time", value: "" }] }, { components: [{ custom_id: "place", value: "" }] }, { components: [{ custom_id: "save", value: "" }] }] } });
  assert.deepEqual(m.missing, ["time", "place"]); assert.equal(m.options.time_unknown, true);
  const warn = await accuracyPrompt(env, m), btn = warn.data.components[0].components;
  assert.match(warn.data.content, /less accurate/); assert.equal(warn.data.flags, 64);
  assert.match(btn[0].custom_id, /^birthfix:/); assert.match(btn[1].custom_id, /^birthgo:/);
  const back = await pendingBirth(env, btn[1].custom_id.split(":")[1]);
  assert.equal(back.name, "humandesign"); assert.equal(back.options.date, "09/04/1990");
});

test("every birth system runs from the birthday alone and says what is less accurate", async () => {
  const { run: astrology } = await import("../src/modules/astrology/index.js");
  const { run: humandesign } = await import("../src/modules/humandesign/index.js");
  const { run: chinese } = await import("../src/modules/chinesezodiac/index.js");
  const c = { user: "tester", now: new Date("2026-11-27T12:00:00Z"), fetch: () => { throw new Error("no lookup without a city"); } };
  const a = await astrology({ subcommand: "chart", date: "09/04/1990" }, c);
  assert.match(a.headline, /^Sun in Aries, Moon in \w+$/); assert.match(JSON.stringify(a.embeds), /Birth city not given/); assert.match(text(a), /noon universal time/);
  const h = await humandesign({ date: "09/04/1990" }, c);
  assert.match(JSON.stringify(h.embeds), /Birth city not given/); assert.equal(h.moment, null);
  const z = await chinese({ date: "09/04/1990" }, c);
  assert.match(text(z), /no birthplace given/);
  const n = await numerology({ date: "09/04/1990" }, c);
  assert.match(JSON.stringify(n.embeds), /No birth name given/); assert.match(text(n), /Not included/); assert.doesNotMatch(JSON.stringify(n.embeds), /Expression ·|undefined|null/);
});
