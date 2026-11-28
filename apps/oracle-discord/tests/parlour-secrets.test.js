// The Séance Parlour's menu background and Hidden Parlour finds (activity/src/parlour/secrets.js), and the Debunker's cloak.
import test from "node:test";
import assert from "node:assert/strict";
import { PARLOUR_SECRETS as S, parlourBgHtml, PARLOUR_BG_CSS } from "../activity/src/parlour/secrets.js";
import { allLevel3 } from "../activity/src/casefiles/room.js";
import { LEVELS } from "../activity/src/casefiles/data.js";
import { room as cfRoom } from "../activity/src/casefiles/logic.js";
import { grantDebunker, DEBUNKER } from "../activity/src/hosts/parlour-room.js";

const harness = () => { const got = []; S._s = null; const api = { at: new Date(2026, 5, 10, 12).getTime(), prog: {}, find: (id, line) => { if (got.includes(id)) return false; assert.ok(line && line.length > 30, id); got.push(id); return true; } }; return { got, api, ev: (k, d) => S.event(k, d, api) }; };

test("20 finds, unique, riddles not answers, rare ones pay keys", () => {
  assert.equal(S.items.length, 20); assert.equal(new Set(S.items.map((x) => x.id)).size, 20);
  for (const x of S.items) { assert.ok(x.hint.length > 20 && x.e && x.name, x.id); assert.ok(x.pay.gem || x.pay.token, x.id); if (x.rare) assert.ok(x.pay.token, x.id); }
  assert.match(S.label, /Hidden Parlour/);
});

test("every find can be found, and only by its trigger", () => {
  const { got, api, ev } = harness();
  ev("tap", { tap: "bgtable", count: 2 }); assert.deepEqual(got, []);
  ev("tap", { tap: "bgtable", count: 3 }); ev("tap", { tap: "cloth", count: 1 });
  ev("tap", { tap: "trumpet", count: 1 }); assert.ok(!got.includes("luminous"), "candle still lit");
  ev("tap", { tap: "bgcandle", count: 1 }); ev("tap", { tap: "trumpet", count: 1 });
  ev("tap", { tap: "planchette", count: 3 });
  for (const c of "XOUIJA") ev("tap", { tap: "ltr-" + c, count: 1 });
  for (const t of ["goodbye", "playbill"]) ev("tap", { tap: t, count: 1 });
  for (const t of ["cabinet", "tassel"]) ev("tap", { tap: t, count: 3 });
  ev("poke", { zone: "eye", count: 3 }); ev("poke", { zone: "orb", count: 5 });
  ev("emote", { id: "think" }); api.at += 1000; ev("emote", { id: "dance" });
  for (const e of ["wave", "love", "laugh", "gasp", "spook", "wink"]) ev("emote", { id: e });
  for (const [m, d, h] of [[10, 31, 20], [3, 24, 20], [3, 31, 20], [2, 10, 20], [6, 1, 0]]) { api.at = new Date(2026, m - 1, d, h).getTime(); ev("home", { at: api.at }); }
  ev("result", { room: "workshop", won: true, perfect: true, level: 1 }); ev("result", { room: "casefiles", won: true, perfect: false, level: 3 });
  assert.deepEqual([...got].sort(), S.items.map((x) => x.id).sort());
});

test("menu background: animated SVG with the hotspots the finds use; Debunker's cloak after every Level 3 case", () => {
  const h = parlourBgHtml(0, { rnd: () => 0.5 });
  assert.match(h, /^<div class="menu-bg mb-parlour" aria-hidden="true"><svg[\s\S]*<\/svg><\/div>$/);
  for (const t of ["tassel", "bgtable", "cloth", "bgcandle", "planchette", "playbill", "goodbye", "yes", "no", "ltr-A", "ltr-Z"]) assert.ok(h.includes(`data-tap="${t}"`), t);
  assert.match(PARLOUR_BG_CSS, /@keyframes mbp-breathe/);
  const p = { essence: 0 }; assert.equal(allLevel3(p), false);
  cfRoom(p).solved.push(...LEVELS[2].pool); assert.equal(allLevel3(p), true);
  grantDebunker(p); assert.ok(p.owned.includes(DEBUNKER) && p.houses.parlour.debunker);
});
