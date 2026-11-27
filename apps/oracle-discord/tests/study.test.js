// Study hall: every game with a guide is listed, every guide has real content, and the menu can render it.
import test from "node:test";
import assert from "node:assert/strict";
import { STUDY, studyFor, studyHtml } from "../activity/src/study.js";

test("every game's study materials are in the Study hall", () => {
  const rooms = STUDY.map((x) => x.room);
  for (const r of ["stars", "rummy", "decoder", "timeline", "grimoire", "calendar", "alchemy", "memory", "duel", "seance"]) assert.ok(rooms.includes(r), r);
  assert.equal(new Set(rooms).size, rooms.length, "one entry per game");
  for (const x of STUDY) {
    assert.ok(x.name && x.emoji && x.guides.length, x.room);
    assert.equal(new Set(x.guides.map((g) => g.id)).size, x.guides.length, `${x.room}: guide ids unique`);
    for (const g of x.guides) {
      assert.ok(g.title && g.sections.length, `${x.room}/${g.id}`);
      for (const s of g.sections) assert.ok(s.h && s.p.length && s.p.every((t) => typeof t === "string" && t.length > 3), `${x.room}/${g.id}: ${s.h}`);
      const h = studyHtml(g); assert.match(h, /<details open>/); assert.ok(!h.includes("undefined"), `${x.room}/${g.id}`);
    }
  }
});

test("lookups and safety notes", () => {
  assert.equal(studyFor("stars").guides[0].id, "stars");
  assert.equal(studyFor("nope"), null);
  assert.ok(studyFor("grimoire").guides.every((g) => g.sections[0].h.includes("Safety")), "plant guides open with the safety note");
  assert.match(studyHtml({ emoji: "x", title: "<script>", sections: [{ h: "a<b", p: ["ok"] }] }), /&lt;script&gt;.*a&lt;b/s);
});
