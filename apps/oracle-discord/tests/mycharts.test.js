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
