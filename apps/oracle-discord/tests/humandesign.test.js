import test from "node:test";
import assert from "node:assert";
import { bodygraph, activation } from "../src/humandesign/chart.js";
import { readingEmbeds } from "../src/modules/humandesign/index.js";
import { CHANNELS, CENTERS, WHEEL } from "../src/humandesign/data.js";
import { GATES, CHANNEL_TEXT, TYPES, AUTHORITIES } from "../src/humandesign/text.js";
import { localToUtc } from "../src/birthplace.js";
import { pack } from "../scripts/job.js";

test("data tables are complete", () => {
  assert.equal(new Set(WHEEL).size, 64);
  assert.equal(Object.values(CENTERS).flatMap((c) => c.gates).length, 64);
  assert.equal(CHANNELS.length, 36);
  for (let g = 1; g <= 64; g++) assert.ok(GATES[g], "gate text " + g);
  for (const c of CHANNELS) assert.ok(CHANNEL_TEXT[c.key], "channel text " + c.key);
});

test("gate wheel boundaries", () => {
  assert.deepEqual([activation(302).gate, activation(302).line], [41, 1]);
  assert.equal(activation(301.99).gate, 60);
  assert.equal(activation(358.25).gate, 25);
  assert.equal(activation(302 + 5.625 - 1e-9).line, 6);
});

test("published reference chart: Ra Uru Hu (9 Apr 1948, 00:14, Montreal)", () => {
  const c = bodygraph(localToUtc({ year: 1948, month: 4, day: 9, hour: 0, minute: 14 }, "America/Montreal"));
  assert.equal(c.type, "Manifestor");
  assert.equal(c.authority, "Splenic");
  assert.equal(c.profile, "5/1");
  assert.equal(c.cross.full, "Left Angle Cross of the Clarion (51/57 | 61/62)");
});

test("every type and authority has reading text, and readings fit Discord limits", () => {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const seen = new Set();
  for (let i = 0; i < 150; i++) {
    const c = bodygraph(new Date(Date.UTC(1940, 0, 1) + rnd() * 2.6e12));
    assert.ok(TYPES[c.type] && AUTHORITIES[c.authority], c.type + " " + c.authority);
    seen.add(c.type);
    const embeds = readingEmbeds(c);
    for (const e of embeds) {
      assert.ok((e.description || "").length <= 4096 && e.fields.length <= 25);
      for (const f of e.fields) assert.ok(f.name.length <= 256 && f.value.length > 0 && f.value.length <= 1024, f.name);
    }
    for (const m of pack(embeds)) assert.ok(m.length <= 10);
  }
  assert.ok(seen.size >= 4, [...seen].join());
});

import { run } from "../src/modules/humandesign/index.js";
test("unknown birth time gives a noon chart with a provisional note", async () => {
  const r = await run({ date: "1990-04-09", place: "Phoenix" }, { geocoded: { lat: 33.45, lon: -112.07, name: "Phoenix, USA" } });
  assert.match(r.embeds[0].fields[0].name, /Birth time unknown/);
  assert.match(r.embeds[0].fields[0].value, /profile|noon chart/);
  assert.ok(r.files[0].data.length > 10000);
});
