// The House library: every House has its own branded shelf, a book per game (shelved once played, foil by trophy
// tier), and a reading list of real books from the server's forums.
import test from "node:test";
import assert from "node:assert/strict";
import { HOSTS } from "../activity/src/hosts/index.js";
import { STUDY } from "../activity/src/study.js";
import { SHELVES, LIB_LINES, libraryOf, libraryHtml } from "../activity/src/house-library.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

test("every House has its own shelf, lines and reading list", () => {
  const names = new Set(), lines = new Set();
  for (const H of HOSTS) {
    assert.ok(SHELVES[H.id] && LIB_LINES[H.id]?.length, H.id);
    names.add(SHELVES[H.id].name); lines.add(LIB_LINES[H.id].join("|"));
    const L = libraryOf(H, {}, STUDY);
    assert.ok(L.games.length >= 4 && L.games.every((g) => !g.on), `${H.id}: games start unshelved`);
    assert.ok(L.reading.length >= 2 && L.reading.every((r) => r.title && r.forum.includes("📚")), `${H.id}: reading list`);
    if (H.rooms !== "all") for (const r of H.rooms) assert.ok(L.games.some((g) => g.room === r), `${H.id}: book for ${r}`);
    const h = libraryHtml(H, {}, STUDY, "Handbook", esc);
    assert.ok(!h.includes("undefined") && h.includes('data-lib="house"') && h.includes('id="lib-back"'), H.id);
  }
  assert.equal(names.size, HOSTS.length); assert.equal(lines.size, HOSTS.length);
});

test("playing shelves a game's book and trophies set its foil", () => {
  const H = HOSTS.find((h) => h.id === "parlour");
  const p = { rooms: { casefiles: { plays: 2 } }, trophies: { mentalist: { tier: 3 }, darkseance: { tier: 4 } } };
  const L = libraryOf(H, p, STUDY), g = (id) => L.games.find((x) => x.room === id);
  assert.ok(g("casefiles").on && g("mentalist").on && !g("workshop").on);
  assert.equal(g("mentalist").tier, "gold"); assert.equal(g("darkseance").tier, "prism");
  assert.match(libraryHtml(H, p, STUDY, "Book", esc), /lb-spine on gold/);
});
