// Houses engine (activity/src/hosts/): one Activity, one host per channel, shared wallet and music pool.
import test from "node:test";
import assert from "node:assert/strict";
import { HOSTS, hostFor, setHost, rename, hostLine, hostBanter, hostShelves, hasRoom } from "../activity/src/hosts/index.js";
import { LENSES } from "../activity/src/hosts/alchemist.js";
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
  assert.equal(new Set(LENSES.map((l) => l.id)).size, LENSES.length);
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
