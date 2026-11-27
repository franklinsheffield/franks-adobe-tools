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

test("Madame Rook and Archivist Wren rename the Oracle in their Houses, with the brand brief's values", () => {
  const P = HOSTS.find((x) => x.id === "parlour"), W = HOSTS.find((x) => x.id === "scriptorium");
  setHost(P); assert.equal(rename("THE ORACLE · The Oracle's hand · Oracle Chamber"), "MADAME ROOK · Madame Rook's hand · Séance Parlour");
  assert.equal(rename("Open the Record Player · Reach Oracle-touched, or try /oracle"), "Open the Spirit Trumpet Gramophone · Reach Oracle-touched, or try /oracle");
  assert.equal(P.accent, "#C3A6FF"); assert.equal(P.voice.type, "sawtooth"); assert.equal(P.voice.base, 200); assert.deepEqual(P.rooms, ["seance", "timeline"]);
  setHost(W); assert.equal(rename("THE ORACLE · The Oracle's hand · Oracle Chamber"), "ARCHIVIST WREN · Archivist Wren's hand · Scriptorium");
  assert.equal(rename("Open the Record Player"), "Open the Hurdy-Gurdy"); assert.match(hostBanter("decoder", "win", "Ada"), /\S/);
  assert.equal(W.accent, "#E8483B"); assert.equal(W.voice.type, "triangle"); assert.equal(W.voice.base, 380); assert.deepEqual(W.rooms, ["decoder", "memory"]);
  const voices = HOSTS.map((h) => `${h.voice?.type}${h.voice?.base}`).filter((v) => v !== "undefinedundefined"); assert.equal(new Set(voices).size, voices.length, "each House sounds different");
  assert.equal(new Set(HOSTS.map((h) => h.accent)).size, HOSTS.length, "each House has its own accent");
  setHost(null);
});
test("the Parlour and the Scriptorium are routed from their channels", () => { assert.equal(hostFor({ channelId: "1575977181622829158" }).id, "parlour"); assert.equal(hostFor({ channelId: "1575977195048927232" }).id, "scriptorium"); });
