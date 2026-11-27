// The Chamber's home (activity/src/home.js): the door and the tabbed menu.
import test from "node:test";
import assert from "node:assert/strict";
import { HOME_TABS, homeItems, homeHtml, gateHtml } from "../activity/src/home.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const SYS = [{ key: "tarot", label: "Tarot", emoji: "🃏", kind: "cast", row: "cards", hint: "78" }, { key: "iching", label: "I Ching", emoji: "🪙", kind: "cast", hint: "coins" }, { key: "astrology", label: "Astrology", emoji: "🌌", kind: "birth" }];
const ROOMS = [{ id: "memory", label: "Memory", emoji: "🃏", row: "cards", blurb: "pairs" }, { id: "seance", label: "Séance", emoji: "🕯️", blurb: "ghosts" }];
const STUDY = [{ room: "seance", name: "Séance", emoji: "🕯️" }, { room: "gone", name: "Gone", emoji: "x" }];

test("every system, room and study guide lands in exactly one tab", () => {
  const it = homeItems(SYS, ROOMS, STUDY);
  assert.deepEqual(Object.keys(it), HOME_TABS.map((t) => t.id));
  assert.deepEqual(it.cards.map((x) => x.id), ["tarot", "memory"]); assert.deepEqual(it.question.map((x) => x.id), ["iching"]);
  assert.deepEqual(it.birth.map((x) => x.id), ["astrology"]); assert.deepEqual(it.play.map((x) => x.id), ["seance"]); assert.deepEqual(it.study.map((x) => x.id), ["seance"]);
});

test("the menu keeps every option clickable, shows one panel, and never uses a form", () => {
  const html = homeHtml(homeItems(SYS, ROOMS, STUDY), "question", esc);
  for (const sel of ['data-k="tarot"', 'data-k="iching"', 'data-k="astrology"', 'data-room="memory"', 'data-room="seance"', 'data-study="seance"', 'id="hm-daily"', 'id="hm-surprise"']) assert.ok(html.includes(sel), sel);
  assert.equal((html.match(/role="tabpanel"[^>]*>/g) || []).filter((t) => !t.includes("hidden")).length, 1);
  assert.match(html, /data-panel="question">/); assert.ok(!/<form/i.test(html));
  assert.match(homeHtml(homeItems(SYS, ROOMS, STUDY), "nope", esc), /data-panel="cards">/, "an unknown saved tab falls back to the first");
});

test("the door has one enter button and greets returning members", () => {
  const g = gateHtml({ name: "Ada <3", rank: "Adept", streak: 4, back: true, esc });
  assert.equal((g.match(/id="enter"/g) || []).length, 1); assert.match(g, /Welcome back, Ada &lt;3/); assert.match(g, /4 days in a row/);
  assert.match(gateHtml({ esc }), /talks back/);
});
