import test from "node:test";
import assert from "node:assert/strict";
import { HOUSE_PERSONAS, housePersonaLine } from "../activity/src/hosts/house-personas.js";
import { PERSONAS } from "../activity/src/personas.js";
import { HOSTS } from "../activity/src/hosts/index.js";

const HOUSES = HOSTS.map((h) => h.id).filter((id) => id !== "oracle");

test("every bought personality has lines for every House", () => {
  for (const pid of Object.keys(PERSONAS).filter((k) => PERSONAS[k])) for (const h of HOUSES) {
    const L = (HOUSE_PERSONAS[pid] || {})[h]; assert.ok(L, `${pid} in ${h}`);
    assert.ok(L.greet.length >= 1 && L.joke.length >= 2, `${pid}/${h} needs a greeting and 2 jokes`);
    for (const l of [...L.greet, ...L.joke]) { assert.ok(l.length <= 130, `too long: ${l}`); assert.ok(!/Oracle/.test(l), `names the Oracle: ${l}`); }
  }
});
test("personality lines are only for Houses that exist; none for the Oracle's own Chamber", () => {
  for (const [pid, by] of Object.entries(HOUSE_PERSONAS)) { assert.ok(PERSONAS[pid], pid); for (const h of Object.keys(by)) assert.ok(HOUSES.includes(h), h); }
  assert.equal(housePersonaLine("deadpan", "oracle", "greet"), null);
  assert.equal(housePersonaLine("mystic", "parlour", "greet"), null);
  assert.match(housePersonaLine("pirate", "observatory", "greet", "Frank"), /Frank/);
});
test("every House host has its own streak line, distinct from the others", () => {
  const seen = new Set();
  for (const h of HOSTS.filter((x) => x.id !== "oracle")) {
    const s = (h.lines || {}).streak; assert.ok(s && s.length, h.id);
    for (const l of s) { assert.match(l, /\{n\}/); assert.ok(!seen.has(l)); seen.add(l); }
  }
});
test("no two Houses open a greeting the same way", () => {
  const openers = new Map();
  for (const h of HOSTS.filter((x) => x.id !== "oracle")) for (const g of h.lines.greet) {
    const o = g.split(/[.,!]/)[0].replace("{name}", "").trim(); if (!o) continue;
    assert.ok(!openers.has(o) || openers.get(o) === h.id, `"${o}" used by ${openers.get(o)} and ${h.id}`); openers.set(o, h.id);
  }
});
