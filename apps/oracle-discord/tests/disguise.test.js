import { test } from "node:test";
import assert from "node:assert/strict";
import { CLUES, HOST_IDS, LEFT, RING, SLIP, NEVERMET, QUICK, NOTE, atbash, noteShown, clueEvent, findClue, clueCount, dossierHtml, RING_SVG, leftBehindHtml } from "../activity/src/hosts/disguise.js";
import { TROPHIES, LINES, recordClues, tierOf } from "../activity/src/trophies.js";
import { HOSTS } from "../activity/src/hosts/index.js";
import { GAMES } from "../activity/src/credits.js";

const H = (id) => HOSTS.find((h) => h.id === id);
const esc = (s) => String(s);

test("the one-person gimmick covers every House with unique lines", () => {
  assert.deepEqual(HOSTS.map((h) => h.id).sort(), [...HOST_IDS].sort());
  assert.equal(CLUES.length, 17); assert.equal(new Set(CLUES.map((c) => c.id)).size, 17);
  for (const T of [RING, NEVERMET, QUICK]) { assert.equal(new Set(HOST_IDS.map((h) => T[h])).size, 5); }
  for (const h of HOST_IDS) {
    assert.notEqual(LEFT[h].owner, h, "left-behind item belongs to someone else"); assert.notEqual(SLIP[h].from, h, "slip borrows another host's line");
    for (const l of [RING[h], SLIP[h].say, NEVERMET[h], QUICK[h], LEFT[h].say]) assert.ok(l.length <= 150, l);
  }
  assert.equal(new Set(HOST_IDS.map((h) => LEFT[h].owner)).size, 5); assert.equal(new Set(HOST_IDS.map((h) => SLIP[h].from)).size, 5);
});

test("clues come from rings, stray costumes, slips, the denial and the quick change", () => {
  const p = {}, never = () => 0.99;
  assert.equal(clueEvent("tap", { tap: "ring" }, { p, host: H("parlour") }).clue.id, "ring-parlour");
  assert.equal(clueEvent("tap", { tap: "ring" }, { p, host: H("parlour") }), null, "pays once");
  assert.equal(clueEvent("tap", { tap: "leftbehind" }, { p, host: H("observatory") }).line, LEFT.observatory.say);
  assert.equal(clueEvent("poke", { zone: "eye", count: 6 }, { p, host: H("oracle") }), null);
  assert.equal(clueEvent("poke", { zone: "eye", count: 7 }, { p, host: H("oracle") }).clue.id, "quickchange");
  assert.equal(clueEvent("home", {}, { p, host: H("oracle"), rand: () => 0 }), null, "no slip before a second House");
  assert.equal(clueEvent("home", {}, { p, host: H("alchemist"), rand: () => 0 }).clue.id, "slip-alchemist");
  assert.equal(clueEvent("home", {}, { p, host: H("oracle"), rand: never }), null);
  assert.equal(clueEvent("home", {}, { p, host: H("oracle"), rand: never }).clue.id, "slip-oracle", "third visit always slips");
  clueEvent("home", {}, { p, host: H("observatory"), rand: never }); clueEvent("home", {}, { p, host: H("parlour"), rand: never });
  const r = clueEvent("home", {}, { p, host: H("scriptorium"), rand: never });
  assert.equal(r.clue.id, "nevermet"); assert.equal(r.line, NEVERMET.scriptorium);
  assert.equal(clueCount(p), 6); assert.equal(p.essence, 90);
});

test("the coded note is Atbash and opens as clues come in; Fregoli's Mask pays out", () => {
  assert.equal(atbash(atbash(NOTE)), NOTE); assert.equal(atbash("ABC"), "ZYX");
  assert.equal(noteShown(0), atbash(NOTE)); assert.equal(noteShown(17), NOTE);
  const t = TROPHIES.find((x) => x.id === "fregoli"); assert.ok(t && t.meta && LINES.fregoli); assert.ok(!GAMES.some((g) => g.id === "fregoli"));
  const p = {}; let last = null;
  for (const c of CLUES) { const r = findClue(p, c.id); assert.ok(r); const n = recordClues(p, r.n); if (n) last = n; if (r.n === 4) assert.equal(tierOf(p, "fregoli"), 1); }
  assert.equal(tierOf(p, "fregoli"), 4); assert.ok(last.pay > 0);
  assert.ok(dossierHtml(p, esc).includes(NOTE)); assert.ok(dossierHtml({}, esc).includes("Not found yet"));
  const D = dossierHtml({ alias: { clues: ["ring-oracle"] } }, esc), nO = (s) => (s.match(/Ora\u2060cle/g) || []).length; assert.ok(nO(D) >= 3);
  for (const h of HOSTS) if (h.rename) assert.equal(nO(h.rename(D)), nO(D), h.id + " keeps the Oracle's name in the Dossier");
  assert.ok(RING_SVG.includes('data-tap="ring"')); for (const h of HOST_IDS) assert.ok(leftBehindHtml(h).includes('data-tap="leftbehind"'));
});
