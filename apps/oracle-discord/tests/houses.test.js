// Houses engine (activity/src/hosts/): one Activity, one host per channel, shared wallet and music pool.
import test from "node:test";
import assert from "node:assert/strict";
import { HOSTS, hostFor, setHost, rename, hostLine, hostBanter, hostShelves, hasRoom } from "../activity/src/hosts/index.js";
import { LENSES } from "../activity/src/hosts/alchemist.js";
import { STAR_MAPS } from "../activity/src/hosts/observatory.js";
import { DEPTS } from "../activity/src/store.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { playCommand } from "../src/houses.js";

const ROOM_IDS = ["seance", "decoder", "timeline", "alchemy", "calendar", "grimoire", "stars", "duel", "memory", "rummy"];

test("the channel picks the House; ?house= wins; anything else is the Oracle", () => {
  assert.equal(hostFor({ channelId: "1575683489712439467" }).id, "oracle");
  assert.equal(hostFor({ channelId: "999" }).id, "oracle");
  assert.equal(hostFor({ search: "?house=alchemist" }).id, "alchemist");
  assert.equal(hostFor({ search: "?house=nope" }).id, "oracle");
  const ids = HOSTS.flatMap((h) => h.channelIds); assert.equal(new Set(ids).size, ids.length, "a channel belongs to one House");
});

test("every House is complete: name, rooms that exist, its own player, and banter + a trophy for each of its rooms", () => {
  for (const h of HOSTS) {
    assert.ok(h.name && h.house && h.player && typeof h.player.deck === "function", h.id);
    const rooms = h.rooms === "all" ? ROOM_IDS : h.rooms;
    for (const r of rooms) { assert.ok(ROOM_IDS.includes(r), r); assert.ok(TROPHIES.some((t) => t.id === r), r + " trophy"); }
    if (h.id === "oracle") continue; // the Oracle uses her personalities (banter.js)
    assert.ok(hasRoom(h, h.daily), h.id + " daily room is one of its rooms");
    for (const r of rooms) { const B = h.banter[r]; assert.ok(B && B.mid.length >= 2 && B.win.length && B.lose.length, `${h.id} ${r}`); for (const l of [...B.mid, ...B.win, ...B.lose]) assert.ok(l.length <= 90, l); }
    for (const k of ["greet", "idle", "joke"]) assert.ok(h.lines[k].length >= 3, h.id + k);
    assert.ok(h.poke.length >= 3 && h.perfect.length, h.id);
    assert.ok((h.shelves || []).length, h.id + " has its own store shelf");
  }
});

test("each House shelf has a department and a free starter", () => {
  const named = DEPTS.flatMap((d) => d.kinds);
  for (const s of hostShelves()) { assert.ok(named.includes(s.kind), s.kind); assert.ok(s.items.some((i) => i.price === 0), s.kind); for (const m of ["open", "tryon", "buy"]) assert.ok(s.talk[m].length >= 3, s.kind + m); }
  assert.equal(new Set(LENSES.map((l) => l.id)).size, LENSES.length); assert.equal(new Set(STAR_MAPS.map((l) => l.id)).size, STAR_MAPS.length);
});

test("Magister Vell renames the Oracle in her House only, and keeps rank names and /oracle", () => {
  setHost(HOSTS.find((h) => h.id === "oracle"));
  assert.equal(rename("✦ Back to the Oracle"), "✦ Back to the Oracle"); assert.equal(hostBanter("duel", "win"), null); assert.equal(hostLine("greet"), null);
  setHost(HOSTS.find((h) => h.id === "alchemist"));
  assert.equal(rename("✦ Back to the Oracle"), "✦ Back to Magister Vell");
  assert.equal(rename("THE ORACLE · The Oracle's hand · Oracle Chamber"), "MAGISTER VELL · Magister Vell's hand · Alchemist's House");
  assert.equal(rename("Reach Oracle-touched, or try /oracle"), "Reach Oracle-touched, or try /oracle");
  assert.equal(rename("Open the Record Player · The Record Player"), "Open the Brass Phonograph · The Brass Phonograph");
  assert.match(hostBanter("duel", "win", "Ada"), /\S/); assert.match(hostLine("greet", "Ada"), /\S/);
  setHost(null);
});

test("/play is a plain slash command", () => { assert.equal(playCommand.name, "play"); assert.equal(playCommand.type, 1); assert.ok(playCommand.description.length <= 100); });

import { tokensLeft, addTokens, houseLevelTokens, dailyVisit, strayFind, buyHouseRelic, houseRelicsHtml, strayLine } from "../activity/src/hosts/tokens.js";
test("each House has its own luxury token, relics priced in it, and an emoji", () => {
  const ids = HOSTS.map((h) => h.token.id); assert.equal(new Set(ids).size, ids.length);
  for (const h of HOSTS) { assert.ok(h.token.emoji && h.token.name && h.token.plural && h.token.purse, h.id); if (h.id !== "oracle") { assert.ok(h.relics.length >= 6, h.id); for (const r of h.relics) assert.ok(r.price > 0 && r.note && r.art().includes("<"), r.id); } }
});
test("House tokens: level wins, daily visit, relics, and strays sent to the right House", () => {
  const [oracle, alch] = HOSTS, p = { tokens: 3, moonSpent: 1 };
  assert.equal(tokensLeft(p, oracle), 2); assert.equal(tokensLeft(p, alch), 0);
  assert.deepEqual(houseLevelTokens(p, alch, "duel", 1, true), { n: 2, series: false }); assert.equal(houseLevelTokens(p, alch, "duel", 1, true).n, 0, "paid once");
  houseLevelTokens(p, alch, "duel", 2, true); assert.deepEqual(houseLevelTokens(p, alch, "duel", 3, true), { n: 9, series: true });
  assert.equal(tokensLeft(p, alch), 15); assert.equal(p.tokens, 3, "the Oracle's moons are untouched");
  assert.equal(dailyVisit(p, alch, "2026-11-27"), 1); assert.equal(dailyVisit(p, alch, "2026-11-27"), 0); assert.equal(dailyVisit(p, oracle, "2026-11-27"), 0);
  const r = buyHouseRelic(p, alch, "st-alembic"); assert.equal(r.id, "st-alembic"); assert.equal(tokensLeft(p, alch), 12); assert.equal(buyHouseRelic(p, alch, "st-alembic"), null);
  assert.equal(buyHouseRelic(p, alch, "st-stone"), null, "too dear"); assert.match(houseRelicsHtml(p, alch), /hr-st-alembic/);
  // strays: found in the Alchemist's House -> a moon for the Oracle; at most one a day
  assert.equal(strayFind(p, alch, HOSTS, "2026-11-27", () => 0.99), null);
  const home = strayFind(p, alch, HOSTS, "2026-11-27", () => 0.01); assert.equal(home.id, "oracle"); assert.equal(p.tokens, 4);
  assert.equal(strayFind(p, alch, HOSTS, "2026-11-27", () => 0.01), null, "one a day");
  assert.equal(strayFind(p, oracle, HOSTS, "2026-11-28", () => 0.01).id, "alchemist"); assert.equal(tokensLeft(p, alch), 13);
  assert.match(strayLine(alch, oracle), /moon token from The Oracle Chamber/);
  addTokens(p, alch, 2); assert.equal(tokensLeft(p, alch), 15);
});
test("the Alchemist's House is routed from #⚗️-laboratory", () => { assert.equal(hostFor({ channelId: "1575967994633396544" }).id, "alchemist"); });
test("Keeper Altair renames the Oracle in the Observatory, with the brand brief's values", () => {
  const h = HOSTS.find((x) => x.id === "observatory"); setHost(h);
  assert.equal(rename("THE ORACLE · The Oracle's hand · Oracle Chamber"), "KEEPER ALTAIR · Keeper Altair's hand · Observatory");
  assert.equal(rename("✦ Back to the Oracle"), "✦ Back to Keeper Altair"); assert.equal(rename("Reach Oracle-touched, or try /oracle"), "Reach Oracle-touched, or try /oracle");
  assert.equal(rename("Open the Record Player"), "Open the Orrery Music Box"); assert.match(hostBanter("rummy", "win", "Ada"), /Ada/);
  assert.equal(h.accent, "#8FB8FF"); assert.equal(h.voice.type, "sine"); assert.equal(h.voice.base, 220); assert.equal(h.emoji, "🔭");
  assert.ok(STAR_MAPS.find((m) => m.id === "map-greek").price === 0); for (const m of STAR_MAPS) for (const [a, b] of m.ln) assert.ok(m.pts[a] && m.pts[b], m.id);
  assert.equal(hostFor({ search: "?house=observatory" }).id, "observatory"); setHost(null);
});
test("the Observatory is routed from #🔭-observatory", () => { assert.equal(hostFor({ channelId: "1575975395692642596" }).id, "observatory"); });

test("every House's starting voice is its own and branded: never the Oracle's blip", async () => {
  const BASE = { type: "square", base: 330 };
  const others = HOSTS.filter((h) => h.id !== "oracle");
  for (const h of others) {
    assert.ok(h.voice && h.voice.brand, `${h.id} names its voice brand`);
    assert.ok(h.voice.type !== BASE.type || h.voice.base !== BASE.base, `${h.id} differs from the Oracle`);
  }
  const sig = (v) => JSON.stringify([v.type, v.base, v.sweep || 0, v.harm || 0, v.vib || 0, v.lp]);
  assert.equal(new Set(others.map((h) => sig(h.voice))).size, others.length, "no two Houses sound alike");
});

test("Alchemist Phase 1: lab scene, flask, poses, reactions, lab emotes, stone as a rock", async () => {
  const L = await import("../activity/src/hosts/alchemist-lab.js");
  const { alchemist } = await import("../activity/src/hosts/alchemist.js");
  const { EMOTES } = await import("../activity/src/character.js");
  const html = L.labSceneHtml(new Date(2026, 10, 27, 15).getTime(), { motes: 0 });
  assert.match(html, /FUME HOOD/); assert.match(html, /lab-athanor/);
  for (const [name, f] of L.REAGENTS) assert.ok(html.includes(name) && html.includes(f), name);
  assert.ok(!L.labSceneHtml(Date.now(), { motes: 0, prog: { houses: { alchemist: { relics: ["st-athanor"] } } } }).includes("lab-athanor"), "the relic athanor replaces the scene's");
  assert.ok(L.athanorHeat(15) > 0.99 && L.athanorHeat(3) < 0.01);
  assert.equal(Object.keys(L.POSES).length, 8); assert.equal(new Set(Object.values(L.POSES)).size, 8);
  assert.match(L.flaskSvg("t"), /t-flaskclip/);
  assert.deepEqual(Object.keys(L.LAB_EMOTES).sort(), EMOTES.map((e) => e.id).sort(), "re-dresses exactly the 8 starting emotes");
  assert.deepEqual(Object.values(L.LAB_EMOTES).map((e) => e.name).sort(), ["Bang", "Bubble", "Eureka", "Fizz", "Goggle flip", "Measure", "Pour", "Toast"]);
  for (const k of ["poke-eye", "poke-orb", "perfect", "lose"]) assert.ok(L.REACT[k], k);
  assert.equal(alchemist.token.emoji, "🪨"); assert.match(alchemist.token.icon, /<svg/); assert.ok(!alchemist.relicLabel.includes("🔴"));
  setHost(alchemist);
  const { hostEmote, hostScene } = await import("../activity/src/hosts/index.js");
  assert.equal(hostEmote(EMOTES[0]).id, EMOTES[0].id); assert.notEqual(hostEmote(EMOTES[0]).name, EMOTES[0].name);
  assert.match(hostScene(Date.now(), { motes: 0 }), /lab-hood/);
  setHost(null); assert.equal(hostScene(Date.now(), {}), null); assert.equal(hostEmote(EMOTES[0]).name, EMOTES[0].name);
});
