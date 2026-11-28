// Server level, the House pick ladder, Founding grants and bot role sync (activity/src/levels.js + /api/level).
import { test } from "node:test";
import assert from "node:assert/strict";
import { LEVELS, xpLevel, levelOf, levelName, levelLabel, picksOwed, choosable, pickHouse, pathOf, classOf, subclassOf, orderOf, capstoneOf, pathTitle,
  pathLabel, canEnter, needsDoors, unlockHint, grantFor, roleSpecs, rolesWanted, rolesDiff, CLASSES, SUBCLASSES, HOUSE_IDS } from "../activity/src/levels.js";
import { doorsHtml, visitorHtml } from "../activity/src/doors.js";
import { levelSync } from "../activity/worker.mjs";

const esc = (s) => String(s);

test("thresholds match the locked ladder (L2 quick, L6 8,300, L10 24,900)", () => {
  assert.deepEqual(LEVELS.map((l) => l.at), [0, 80, 800, 2400, 4800, 8300, 11500, 15300, 19700, 24900]);
  assert.equal(xpLevel(0), 1); assert.equal(xpLevel(79), 1); assert.equal(xpLevel(80), 2); assert.equal(xpLevel(8299), 5); assert.equal(xpLevel(8300), 6); assert.equal(xpLevel(1e9), 10);
  assert.equal(levelName(4), "Groundsworn"); assert.equal(levelName(12), "The Impossible");
});

test("grants: Founding 4 still grows with ✦; Frank is 12; the ½ shows as .5", () => {
  assert.equal(levelOf({ xp: 100, grant: 4 }), 4); assert.equal(levelOf({ xp: 5000, grant: 4 }), 5);
  assert.equal(levelOf({ xp: 0, grant: 12 }), 12); assert.equal(levelLabel({ xp: 900, half: true }), "3.5");
});

test("the pick ladder: home, class, subclass, no pick at 4, Order at 5, Capstone opens itself at 6", () => {
  const p = { xp: 0, path: [] };
  assert.equal(picksOwed(p), 1); assert.deepEqual(pickHouse(p, "alchemist"), ["alchemist"]); assert.equal(p.home, "alchemist");
  assert.deepEqual(pickHouse(p, "observatory"), [], "level 1 owes no second pick");
  p.xp = 80; assert.deepEqual(choosable(p), ["oracle", "observatory", "parlour", "scriptorium"]); pickHouse(p, "observatory");
  assert.equal(classOf(pathOf(p)).name, "Astrochemist");
  p.xp = 800; pickHouse(p, "scriptorium"); assert.equal(subclassOf(pathOf(p)).name, "Royal Society Fellow");
  p.xp = 2400; assert.equal(picksOwed(p), 0, "level 4 opens the Common Grounds, not a House");
  p.xp = 4800; pickHouse(p, "oracle"); assert.equal(orderOf(pathOf(p)).name, "Order of the Unbroken Veil"); assert.equal(capstoneOf(pathOf(p)), "parlour");
  assert.equal(pathTitle(p), null, "not sealed before level 6");
  p.xp = 8300; assert.deepEqual(choosable(p), ["parlour"]); pickHouse(p, "parlour");
  assert.equal(pathTitle(p), "Astrochemist of the Order of the Unbroken Veil");
  assert.match(pathLabel(p), /^Lv 6 Path-Sealed · Astrochemist of the Order/);
});

test("a level 6 grant (dev.n) picks four and the fifth opens by itself", () => {
  const p = { xp: 0, grant: 6, path: [] };
  ["scriptorium", "parlour", "oracle"].forEach((h) => pickHouse(p, h));
  assert.deepEqual(pickHouse(p, "observatory"), ["observatory", "alchemist"]); assert.equal(picksOwed(p), 0);
});

test("10 classes and 10 subclasses cover every pair and trio, whatever the pick order", () => {
  assert.equal(Object.keys(CLASSES).length, 10); assert.equal(Object.keys(SUBCLASSES).length, 10);
  assert.equal(classOf(["observatory", "alchemist"]).name, classOf(["alchemist", "observatory"]).name);
  for (const a of HOUSE_IDS) for (const b of HOUSE_IDS) if (a !== b) assert.ok(classOf([a, b]));
});

test("the gate: off keeps every House open; on locks to the path, Founding keeps all", () => {
  const p = { xp: 0, path: ["parlour"] };
  assert.ok(canEnter(p, "observatory", false)); assert.ok(!canEnter(p, "observatory", true)); assert.ok(canEnter(p, "parlour", true));
  assert.ok(canEnter({ founding: true }, "scriptorium", true)); assert.ok(needsDoors({}, true)); assert.ok(!needsDoors({}, false));
  assert.deepEqual(unlockHint({ xp: 10, path: ["parlour"] }, "oracle"), { open: false, now: false, level: 2, name: "Acolyte", toNext: 70 });
  assert.equal(unlockHint({ xp: 900, path: ["parlour", "oracle", "alchemist"] }, "scriptorium").level, 5, "skips level 4");
});

test("Founding grant: joined before the switch -> level 4, Scholar's Path points win up to level 5, named grants", () => {
  const sw = "2026-12-01T00:00:00Z";
  assert.deepEqual(grantFor({ userId: "1", joinedAt: "2026-01-01T00:00:00Z", switchAt: sw }), { grant: 4, founding: true });
  assert.deepEqual(grantFor({ userId: "1", joinedAt: "2026-01-01T00:00:00Z", switchAt: sw, scholarPoints: 1000 }), { grant: 5, founding: true });
  assert.deepEqual(grantFor({ userId: "2", joinedAt: "2026-12-05T00:00:00Z", switchAt: sw }), { grant: 0, founding: false });
  assert.deepEqual(grantFor({ userId: "3", joinedAt: "2026-01-01T00:00:00Z", switchAt: sw, grants: { 3: 12 } }), { grant: 12, founding: true });
  assert.deepEqual(grantFor({ userId: "1", joinedAt: "2026-01-01T00:00:00Z" }), { grant: 0, founding: false }, "no switch date, no grant");
});

test("roles: wanted keys, and the diff only touches managed roles", () => {
  const specs = roleSpecs(); assert.equal(new Set(specs.map((r) => r.key)).size, specs.length);
  const want = rolesWanted({ xp: 900, path: ["alchemist", "observatory", "scriptorium"], founding: true });
  assert.deepEqual(want, ["home:alchemist", "open:observatory", "open:scriptorium", "class:astrochemist", "sub:royal-society-fellow", "lv:3", "founding"]);
  const ids = { "home:alchemist": "10", "lv:3": "13", "lv:2": "12", founding: "20" };
  assert.deepEqual(rolesDiff(["12", "999"], want, ids), { add: ["10", "13", "20"], remove: ["12"] }, "staff role 999 untouched");
});

test("/api/level: off returns the grant only; on syncs roles from saved progress", async () => {
  const calls = [], kv = { get: async (k) => (k === "progress:7" ? { v: 1, xp: 100, path: ["oracle", "parlour"] } : null) };
  const fetchImpl = async (url, o = {}) => { calls.push([o.method || "GET", url]); return url.endsWith("/members/7") ? { ok: true, json: async () => ({ joined_at: "2026-01-01T00:00:00Z", roles: ["50", "1"] }) } : { ok: true }; };
  const env = { DISCORD_BOT_TOKEN: "x", PROFILES: kv, SWITCH_AT: "2026-12-01T00:00:00Z", ROLE_IDS: JSON.stringify({ "home:oracle": "40", "class:mentalist": "41", "lv:4": "44", "lv:1": "50", founding: "60" }) };
  let r = await levelSync(env, "7", "1530029383404884069", fetchImpl);
  assert.deepEqual([r.gate, r.grant, r.founding, r.roles], [false, 4, true, null]); assert.equal(calls.length, 1);
  r = await levelSync({ ...env, HOUSE_GATE: "on" }, "7", "1530029383404884069", fetchImpl);
  assert.deepEqual(r.roles, { added: 4, removed: 1, failed: 0 });
  assert.deepEqual(calls.slice(2).map(([m, u]) => m + " " + u.split("/roles/")[1]), ["PUT 40", "PUT 41", "PUT 44", "PUT 60", "DELETE 50"]);
  r = await levelSync({ ...env, HOUSE_GATE: "on", GUILD_ID: "123456" }, "7", "1530029383404884069", fetchImpl);
  assert.equal(r.grant, 0, "other guilds are ignored");
});

test("Five Doors and visitor mode render", () => {
  const houses = HOUSE_IDS.map((id) => ({ id, name: id, house: "The " + id, emoji: "🚪", accent: "#fff" }));
  const html = doorsHtml({ houses, p: { xp: 80, path: ["alchemist"] }, esc });
  assert.match(html, /A door opens/); assert.equal((html.match(/data-door=/g) || []).length, 5); assert.match(html, /Door|Home/);
  assert.match(doorsHtml({ houses, p: {}, esc }), /The Five Doors/);
  assert.match(visitorHtml({ h: houses[2], p: { xp: 10, path: ["parlour"] }, esc, taster: { emoji: "⭐", label: "Stars" } }), /level 2/);
});

test("starter packs: Founding Members get Essence + tokens per picked House, once", async () => {
  const { starterPacks, STARTER } = await import("../activity/src/levels.js");
  assert.equal(starterPacks({ founding: false }, ["oracle"]), null, "newcomers get no pack");
  const p = { founding: true, grant: 4 };
  const a = starterPacks(p, ["alchemist"]);
  assert.deepEqual(a, { essence: STARTER.essence, tokens: [{ id: "alchemist", n: STARTER.tokens }] });
  assert.equal(starterPacks(p, ["alchemist"]), null, "paid once per House");
  const b = starterPacks(p, ["parlour", "scriptorium"]);
  assert.equal(b.essence, STARTER.essence * 2); assert.equal(b.tokens.length, 2);
});

test("starter packs: the dev grant (6+) gets every House and the big purse on the first pick", async () => {
  const { starterPacks, STARTER, HOUSE_IDS } = await import("../activity/src/levels.js");
  const p = { founding: true, grant: 6 };
  const a = starterPacks(p, ["observatory"]);
  assert.equal(a.essence, STARTER.dev.essence);
  assert.deepEqual(a.tokens.map((t) => t.id), HOUSE_IDS); assert.ok(a.tokens.every((t) => t.n === STARTER.dev.tokens));
  assert.equal(starterPacks(p, ["oracle"]), null, "nothing more on later picks");
});
