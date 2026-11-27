import { test } from "node:test";
import assert from "node:assert/strict";
import { chartData, chartsHtml, storedRows } from "../activity/src/mycharts.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
test("My charts: every system's data from one profile, data only", async () => {
  const d = await chartData({ date: "1990-04-09", time: "14:30", place: "33.45,-112.07", name: "Mary Ann Smith" });
  assert.deepEqual(d.map((s) => s.key), ["humandesign", "astrology", "numerology", "chinesezodiac", "mayan", "egyptian", "celtic"]);
  for (const s of d) assert.ok(!s.error && s.rows.length, s.key);
  const row = (k, l) => d.find((s) => s.key === k).rows.find((r) => r[0] === l)[1];
  for (const l of ["Type", "Authority", "Profile", "Defined centres", "Open centres"]) assert.ok(row("humandesign", l));
  assert.match(row("astrology", "Sun"), /^Aries 19°/);
  assert.equal(row("numerology", "Life Path"), "5");
  assert.match(row("chinesezodiac", "Zodiac animal"), /Metal Horse/);
  assert.equal(row("celtic", "Tree"), "Alder");
  assert.ok(row("egyptian", "Sign") && row("mayan", "Day sign"));
  const html = chartsHtml(d, esc); assert.ok(html.includes('data-mc-read="humandesign"')); assert.ok(!/\b(you should|yes|no)\b\./i.test(html));
});
test("My charts: no place or name still gives the date-only systems, and says what is missing", async () => {
  const d = await chartData({ date: "1990-04-09", time: "unknown" });
  assert.match(d.find((s) => s.key === "humandesign").error, /birth town/);
  assert.ok(d.find((s) => s.key === "celtic").rows.length);
  assert.deepEqual(await chartData(null), []);
  assert.match(chartsHtml([], esc), /\/profile set/);
});
test("My charts: the storage list names every place data is kept", () => {
  const rows = storedRows({ xp: 5, rooms: { bench: {} }, houses: { alchemist: {} } }, { hasProfile: true, signedIn: true });
  const all = rows.map((r) => r.join(" ")).join(" ");
  for (const w of ["profile:<your id>", "progress:<your id>", "prog.houses", "oracle-log:<your id>", "Not stored anywhere"]) assert.ok(all.includes(w), w);
});
import { toIso, dmy, parseBirth } from "../src/birthplace.js";
import { parseYmd } from "../activity/src/calendar/engine.js";
import { mayaOf } from "../activity/src/decoder/engine.js";
test("dates are typed DD/MM/YYYY (saved year-first ones still read)", () => {
  assert.equal(toIso("09/04/1990"), "1990-04-09"); assert.equal(toIso("9.4.1990"), "1990-04-09"); assert.equal(toIso("09-04-1990"), "1990-04-09");
  assert.equal(toIso("1990-04-09"), "1990-04-09"); assert.equal(toIso("04/1990"), null); assert.equal(dmy("1990-04-09"), "09/04/1990");
  assert.deepEqual(parseBirth("09/04/1990", "14:30"), { year: 1990, month: 4, day: 9, hour: 14, minute: 30 });
  assert.throws(() => parseBirth("1990/13/40", "12:00")); assert.throws(() => parseBirth("31/13/1990", "12:00"), /valid/);
  assert.equal(parseYmd("21/12/2012"), parseYmd("2012-12-21")); assert.equal(mayaOf("21/12/2012").longCount.join("."), "13.0.0.0.0");
});
