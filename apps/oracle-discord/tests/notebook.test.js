import { test } from "node:test";
import assert from "node:assert/strict";
import { SYMS, NAMES, cellOf, periodOf, familyOf, symbolsIn, litTable, claimTable, studyToday, elementOfDay, notebookPages, nbCounts, encode, GLYPHS, NOTES, PLANT_COMPOUNDS, nbPageHtml, NB_PAGES, ROW_PAY, SEAL_STONES } from "../activity/src/notebook.js";
import { ALL as PLANTS } from "../activity/src/grimoire/logic.js";
import { MINERALS } from "../activity/src/minerals/data.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("118 elements with names, and each sits in its own cell", () => {
  assert.equal(SYMS.length, 118); assert.equal(NAMES.length, 118);
  assert.equal(SYMS[78], "Au"); assert.equal(NAMES[78], "Gold"); assert.equal(SYMS[117], "Og");
  const seen = new Set(SYMS.map((_, i) => { const c = cellOf(i + 1); assert.ok(c.col >= 1 && c.col <= 18, `col for ${i + 1}`); return c.row + ":" + c.col; }));
  assert.equal(seen.size, 118);
  assert.deepEqual(cellOf(26), { row: 4, col: 8 }); assert.deepEqual(cellOf(79), { row: 6, col: 11 }); assert.deepEqual(cellOf(118), { row: 7, col: 18 });
  assert.deepEqual(cellOf(5), { row: 2, col: 13 }); assert.deepEqual(cellOf(57), { row: 9, col: 3 }); assert.deepEqual(cellOf(103), { row: 10, col: 17 });
  assert.equal(periodOf(57), 6); assert.equal(familyOf(10), "noble"); assert.equal(familyOf(26), "transition"); assert.equal(familyOf(82), "post");
});
test("formula symbols parse and drop non-elements", () => {
  assert.deepEqual(symbolsIn("CaCO₃"), ["Ca", "C", "O"]); assert.deepEqual(symbolsIn("CaO + MgO"), ["Ca", "O", "Mg"]); assert.deepEqual(symbolsIn("tannins"), []);
});
test("the table lights from every source and pays each period once", () => {
  const p = { rooms: { alchemy: { elements: ["Hg", "S"] }, minerals: { found: ["quartz"] }, flametest: { seen: ["li"] }, leadgold: { plays: 1, gold: 1 } } };
  const lit = litTable(p);
  for (const s of ["Hg", "S", "Si", "O", "Li", "Au", "U", "Pb"]) assert.ok(lit[s], s);
  assert.ok(lit.Hg.includes("Alchemist's Lab") && lit.Hg.includes("Lead into Gold"));
  p.rooms.alchemy.elements.push("H", "He");
  const a = claimTable(p); assert.deepEqual(a.rows, [1]); assert.equal(a.essence, ROW_PAY);
  assert.equal(claimTable(p).essence, 0);
  p.rooms.notebook.studied = [...SYMS];
  const b = claimTable(p); assert.equal(b.rows.length, 6); assert.equal(b.stones, SEAL_STONES); assert.ok(b.seal);
  assert.equal(claimTable(p).stones, 0);
});
test("the Element of the Day is the same for everyone and studied once a day", () => {
  const e = elementOfDay("2026-11-27"); assert.equal(e.sym, elementOfDay("2026-11-27").sym); assert.ok(e.z >= 1 && e.z <= 118);
  const p = {}; assert.ok(studyToday(p, "2026-11-27")); assert.ok(!studyToday(p, "2026-11-27")); assert.ok(litTable(p)[e.sym]);
});
test("margin notes: 26 distinct glyphs, decoded by Hidden Lab finds", () => {
  assert.equal(new Set(GLYPHS).size, 26); assert.ok(!/[A-Z]/.test(encode("Solve et coagula")));
  const locked = nbPageHtml("margins", {}, esc), open = nbPageHtml("margins", { houses: { alchemist: { sec: Array(12).fill("x") } } }, esc);
  assert.ok(!locked.includes(NOTES[0].text)); for (const n of NOTES) assert.ok(open.includes(esc(n.text)));
});
test("plant compounds belong to real Herbalist plants; every page renders", () => {
  const ids = new Set(PLANTS.map((x) => x.p.id)); for (const k of Object.keys(PLANT_COMPOUNDS)) assert.ok(ids.has(k), k);
  const p = { rooms: { grimoire: { solved: { "2:willow": 5 } }, minerals: { found: [MINERALS[1].id] }, bench: { made: ["quicklime"] }, commissions: { done: { "2026-11-27": ["v-mason"] } }, alchemy: { accidents: ["fulminate"], solved: { "2:cinnabar": 10 } } } };
  for (const [k] of NB_PAGES) assert.ok(nbPageHtml(k, p, esc).length > 40, k);
  assert.ok(nbPageHtml("plants", p, esc).includes("Salicin")); assert.ok(nbPageHtml("recipes", p, esc).includes("Hg + S"));
  assert.ok(nbPageHtml("commissions", p, esc).includes("mason")); assert.ok(nbPageHtml("hazards", p, esc).includes("Fulminating"));
  const c = nbCounts(p); assert.equal(c.bench[0], 1); assert.equal(c.commissions[0], 1); assert.equal(c.recipes[0], 1);
  const [l, r] = notebookPages(p, esc, "table"); assert.ok(l.includes("data-nb=\"minerals\"")); assert.ok(r.includes("nb-table"));
});
