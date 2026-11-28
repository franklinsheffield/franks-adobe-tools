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
  assert.equal(studyFor("stars").guides[0].id, "play");
  assert.equal(studyFor("stars").guides[1].id, "stars");
  assert.equal(studyFor("nope"), null);
  assert.ok(studyFor("grimoire").guides.filter((g) => g.id !== "play").every((g) => g.sections[0].h.includes("Safety")), "plant guides open with the safety note");
  assert.match(studyHtml({ emoji: "x", title: "<script>", sections: [{ h: "a<b", p: ["ok"] }] }), /&lt;script&gt;.*a&lt;b/s);
});

import { HOSTS } from "../activity/src/hosts/index.js";
import { PLAY } from "../activity/src/study-play.js";
import { HOUSE_BOOKS, houseStudy, studyLine } from "../activity/src/study-houses.js";

test("every game in every House has How to play, Tips and fact guides", () => {
  const rooms = new Set(HOSTS.flatMap((h) => (h.rooms === "all" ? [] : h.rooms)));
  for (const r of rooms) {
    const x = studyFor(r); assert.ok(x, `${r} has a Study entry`);
    assert.equal(x.guides[0].id, "play", `${r}: How to play & tips comes first`);
    assert.ok(x.guides.length >= 2, `${r}: has a fact guide too`);
    const P = PLAY[r]; assert.ok(P && P.tips.length >= 2, `${r}: tips`);
    const hasHow = !!P.how || /^How (to play|you win)/.test(x.guides[1].sections[0].h);
    assert.ok(hasHow, `${r}: how to play somewhere`);
  }
  for (const id of Object.keys(PLAY)) assert.ok(studyFor(id), `PLAY.${id} belongs to a real Study entry`);
});

test("every House has a handbook in its own voice", () => {
  for (const H of HOSTS) {
    const B = HOUSE_BOOKS[H.id]; assert.ok(B && B.title && B.sign && B.voice, H.id);
    const rooms = STUDY.filter((g) => H.rooms === "all" || H.rooms.includes(g.room));
    const x = houseStudy(H, rooms);
    assert.equal(x.guides[0].id, "handbook");
    for (const g of x.guides) { const h = studyHtml(g, { accent: H.accent }); assert.ok(!h.includes("undefined") && !h.includes("[object"), `${H.id}/${g.id}`); assert.match(h, /sh-house/); }
    assert.ok(x.guides[0].sections.some((s) => s.p.some((t) => t.includes(H.token.emoji))), `${H.id}: names its token`);
    if (H.rooms !== "all") for (const r of H.rooms) assert.ok(x.guides[1].sections[0].p.some((t) => t.includes(studyFor(r).name)), `${H.id} lists ${r}`);
    assert.ok(studyLine(H.id, "open", { name: "Ada" }).length > 5 && !studyLine(H.id, "pick", { game: "X" }).includes("{"));
  }
  const opens = HOSTS.map((H) => HOUSE_BOOKS[H.id].lines.open.join("|"));
  assert.equal(new Set(opens).size, opens.length, "each House's study voice is its own");
});
