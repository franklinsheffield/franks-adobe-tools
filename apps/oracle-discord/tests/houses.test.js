// Houses engine (activity/src/hosts/): one Activity, one host per channel, shared wallet and music pool.
import test from "node:test";
import assert from "node:assert/strict";
import { HOSTS, hostFor, setHost, rename, hostLine, hostBanter, hostShelves, hasRoom } from "../activity/src/hosts/index.js";
import { LENSES } from "../activity/src/hosts/alchemist.js";
import { STAR_MAPS } from "../activity/src/hosts/observatory.js";
import { DEPTS } from "../activity/src/store.js";
import { TROPHIES } from "../activity/src/trophies.js";
import { playCommand } from "../src/houses.js";

const ROOM_IDS = ["seance", "decoder", "timeline", "alchemy", "calendar", "grimoire", "stars", "duel", "memory", "rummy", "flametest", "minerals", "watch", "inscriptions", "bench", "casefiles", "comet", "commissions", "cipherdesk", "workshop", "bookings", "darkseance", "eclipse"];

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
    assert.ok(h.voice.sting && h.voice.sting.notes.length >= 3, `${h.id} has its own door sting`);
    assert.ok(h.voice.type !== BASE.type || h.voice.base !== BASE.base, `${h.id} differs from the Oracle`);
  }
  const sig = (v) => JSON.stringify([v.type, v.base, v.sweep || 0, v.harm || 0, v.vib || 0, v.lp]);
  assert.equal(new Set(others.map((h) => sig(h.voice))).size, others.length, "no two Houses sound alike");
  assert.equal(new Set(others.map((h) => JSON.stringify(h.voice.sting))).size, others.length, "no two door stings alike");
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

test("Alchemist Phase 1B: 7 lab coats (white free, Magister earned), House record tasks, the Opus grant", async () => {
  const L = await import("../activity/src/hosts/alchemist-lab.js");
  assert.equal(L.COATS.length, 7); assert.equal(L.COATS[0].price, 0); assert.equal(L.COATS[0].id, "coat-white");
  const mag = L.coatShop.items.find((i) => i.id === L.MAGISTER_COAT); assert.ok(mag.earned && mag.how && mag.price === undefined, "the Magister coat is never sold");
  for (const c of L.COATS) { assert.equal(c.hood.length, 3); assert.match(L.coatOverlay(c), /hv-coat/); assert.ok(c.note.length > 20); }
  assert.ok(DEPTS.find((d) => d.id === "houses").kinds.includes("coat"));
  const R = Object.fromEntries(L.HOUSE_RECORDS.map((r) => [r.id, r]));
  assert.equal(L.HOUSE_RECORDS.length, 4);
  assert.ok(!R["bubble-and-brass"].test({}) && R["bubble-and-brass"].test({ houses: { alchemist: { day: "2026-11-27" } } }));
  assert.ok(!R["slow-furnace"].test({ houses: { alchemist: { lv: ["alchemy-2"] } } }) && R["slow-furnace"].test({ houses: { alchemist: { lv: ["duel-3"] } } }));
  assert.ok(!R["transmutation-waltz"].test({ houses: { alchemist: { rounds: 99 } } }) && R["transmutation-waltz"].test({ houses: { alchemist: { rounds: 100 } } }));
  const p = L.grantOpus({}); assert.ok(R["magnum-opus"].test(p)); assert.ok(p.owned.includes("coat-magister"));
});

test("each House host has its own resting hands and its own 3 gestures (snap, point, swat)", async () => {
  const { ALTAIR_HANDS_CSS } = await import("../activity/src/hosts/observatory.js");
  const { VELL_HANDS_CSS, handPieces } = await import("../activity/src/hosts/alchemist-lab.js");
  const { ROOK_HANDS_CSS } = await import("../activity/src/hosts/parlour.js"); const { WREN_HANDS_CSS } = await import("../activity/src/hosts/scriptorium.js");
  for (const [house, css] of [["alchemist", VELL_HANDS_CSS], ["observatory", ALTAIR_HANDS_CSS], ["parlour", ROOK_HANDS_CSS], ["scriptorium", WREN_HANDS_CSS]]) {
    assert.match(css, new RegExp(`body\\[data-house="${house}"\\] \\.teller:not\\(\\[data-mood\\]\\):not\\(\\[data-gesture\\]\\) \\.o-hands`), house + " rest pose");
    for (const g of ["snap", "point", "swat"]) assert.ok(css.includes(`[data-gesture="${g}`) || css.includes(`[data-gesture^="${g}`), `${house} ${g}`);
  }
  assert.match(handPieces("R"), /hg-spark/); assert.match(handPieces("L"), /hg-steam/);
});

test("the soundtrack library: every House has a named player and 4 branded records with unique ids", async () => {
  const { LIBRARY, toSend } = await import("../activity/src/hosts/soundtracks.js");
  const { TRACKS } = await import("../activity/src/music.js");
  const ids = LIBRARY.flatMap((L) => L.tracks.map((t) => t.id));
  assert.equal(new Set(ids).size, ids.length); for (const id of ids) assert.ok(!TRACKS.some((t) => t.id === id), id + " clashes with music.js");
  assert.equal(new Set(LIBRARY.map((L) => L.player)).size, LIBRARY.length, "each House has its own player");
  for (const L of LIBRARY.filter((x) => x.house !== "oracle")) { assert.equal(L.tracks.length, 4, L.house); for (const t of L.tracks) assert.ok(t.title && t.mood && t.task, t.id); }
  for (const h of HOSTS.filter((x) => x.id !== "oracle")) assert.equal(LIBRARY.find((L) => L.house === h.id).player, h.player.name, h.id + " player name matches");
  assert.equal(toSend().reduce((a, x) => a + x.n, 0), 20);
});
test("Madame Rook and Archivist Wren rename the Oracle in their Houses, with the brand brief's values", () => {
  const P = HOSTS.find((x) => x.id === "parlour"), W = HOSTS.find((x) => x.id === "scriptorium");
  setHost(P); assert.equal(rename("THE ORACLE · The Oracle's hand · Oracle Chamber"), "MADAME ROOK · Madame Rook's hand · Séance Parlour");
  assert.equal(rename("Open the Record Player · Reach Oracle-touched, or try /oracle"), "Open the Spirit Trumpet Gramophone · Reach Oracle-touched, or try /oracle");
  assert.equal(P.accent, "#C3A6FF"); assert.equal(P.voice.type, "sawtooth"); assert.equal(P.voice.base, 200); assert.deepEqual(P.rooms, ["casefiles", "workshop", "bookings", "darkseance", "seance", "timeline"]);
  setHost(W); assert.equal(rename("THE ORACLE · The Oracle's hand · Oracle Chamber"), "ARCHIVIST WREN · Archivist Wren's hand · Scriptorium");
  assert.equal(rename("Open the Record Player"), "Open the Hurdy-Gurdy"); assert.match(hostBanter("decoder", "win", "Ada"), /\S/);
  assert.equal(W.accent, "#E8483B"); assert.equal(W.voice.type, "triangle"); assert.equal(W.voice.base, 380); assert.deepEqual(W.rooms, ["inscriptions", "cipherdesk", "decoder", "memory"]);
  const voices = HOSTS.map((h) => `${h.voice?.type}${h.voice?.base}`).filter((v) => v !== "undefinedundefined"); assert.equal(new Set(voices).size, voices.length, "each House sounds different");
  assert.equal(new Set(HOSTS.map((h) => h.accent)).size, HOSTS.length, "each House has its own accent");
  setHost(null);
});
test("the Parlour and the Scriptorium are routed from their channels", () => { assert.equal(hostFor({ channelId: "1575977181622829158" }).id, "parlour"); assert.equal(hostFor({ channelId: "1575977195048927232" }).id, "scriptorium"); });

test("hidden features per House: the Alchemist's 13 finds pay once, count in her own drawer, and the menu background has hotspots", async () => {
  const { findSecret, secretCount, secretsPanelHtml, ALL_BONUS, tapCount } = await import("../activity/src/hosts/secrets.js");
  const { alchemist } = await import("../activity/src/hosts/alchemist.js");
  const S = alchemist.secrets.items; assert.equal(S.length, 13); assert.equal(new Set(S.map((x) => x.id)).size, 13);
  const p = {}; const r = findSecret(p, alchemist, "aurum"); assert.ok(r && p.essence === 20); assert.equal(findSecret(p, alchemist, "aurum"), null, "pays once");
  assert.deepEqual(p.houses.alchemist.sec, ["aurum"]); assert.equal(secretCount(p, alchemist), 1);
  findSecret(p, alchemist, "midnight"); assert.equal(p.houses.alchemist.got, 1, "rare finds pay the House token");
  for (const s of S) findSecret(p, alchemist, s.id); assert.ok(p.houses.alchemist.secAll); assert.equal(p.houses.alchemist.got, 1 + 2 + 2 + ALL_BONUS.token);
  assert.match(secretsPanelHtml({}, alchemist, (x) => x), /0 of 13 found/);
  const found = []; const api = (at) => ({ prog: {}, at, find: (id) => found.push(id) });
  alchemist.secrets.event("home", { at: 0 }, api(new Date(2026, 9, 23, 0, 30).getTime())); assert.deepEqual(found.sort(), ["midnight", "moleday"]);
  found.length = 0; alchemist.secrets.event("tap", { tap: "gear", count: 3 }, api(0)); alchemist.secrets.event("poke", { zone: "orb", count: 5 }, api(0)); assert.deepEqual(found, ["gears", "overflow"]);
  const html = alchemist.menuBg.html(0, {}); assert.match(html, /data-tap="gear"/); assert.match(html, /data-tap="au"/);
  assert.match(alchemist.scene(0, { motes: 0 }), /data-tap="hood"/); assert.match(alchemist.scene(0, { motes: 0 }), /data-tap="jar-7"/);
  assert.equal(tapCount("x", 0), 1); assert.equal(tapCount("x", 500), 2); assert.equal(tapCount("x", 5000), 1);
});

test("Observatory Phase 1: dome scene with the real Moon, astrolabe, poses, reactions, sky emotes, observing coats", async () => {
  const D = await import("../activity/src/hosts/observatory-dome.js");
  const { observatory } = await import("../activity/src/hosts/observatory.js");
  const { EMOTES } = await import("../activity/src/character.js");
  assert.ok(D.moonPhase(Date.UTC(2000, 0, 6, 18, 14)) < 0.01, "known new moon");
  assert.ok(Math.abs(D.moonPhase(Date.UTC(2026, 10, 24, 14, 0)) - 0.5) < 0.04, "full moon 24 Nov 2026");
  const night = D.domeSceneHtml(new Date(2026, 10, 27, 22).getTime(), { motes: 0 }), day = D.domeSceneHtml(new Date(2026, 10, 27, 12).getTime(), { motes: 0 });
  assert.match(night, /data-tap="moon"/); assert.match(night, /data-tap="dome"/); assert.match(night, /sc dome open/); assert.ok(!/sc dome open/.test(day) && /od-shut mb-hot shut/.test(day));
  assert.equal(Object.keys(D.POSES).length, 8); assert.equal(new Set(Object.values(D.POSES)).size, 8);
  assert.match(D.astrolabeSvg("t"), /ao-rete/);
  assert.deepEqual(Object.keys(D.SKY_EMOTES).sort(), EMOTES.map((e) => e.id).sort(), "re-dresses exactly the 8 starting emotes");
  for (const k of ["poke-eye", "poke-orb", "perfect", "lose"]) assert.ok(D.REACT[k], k);
  assert.equal(D.OBS_COATS.length, 7); assert.equal(D.OBS_COATS[0].price, 0);
  const royal = D.obsCoatShop.items.find((i) => i.id === D.ROYAL_COAT); assert.ok(royal.earned && royal.how && royal.price === undefined, "never sold");
  assert.ok(DEPTS.find((d) => d.id === "houses").kinds.includes("obscoat"));
  assert.ok(D.grantRoyal({}).owned.includes(D.ROYAL_COAT));
  assert.equal(observatory.scene, D.domeSceneHtml); assert.equal(observatory.emotes, D.SKY_EMOTES); assert.ok(observatory.shelves.includes(D.obsCoatShop));
});

test("Scriptorium Phase 1: writing room by daylight, codex, poses, reactions, scribe emotes, habits", async () => {
  const D = await import("../activity/src/hosts/scriptorium-desk.js");
  const { scriptorium } = await import("../activity/src/hosts/scriptorium.js");
  const { EMOTES } = await import("../activity/src/character.js");
  assert.equal(D.daylight(12), 1); assert.equal(D.daylight(2), 0);
  const night = D.deskSceneHtml(new Date(2026, 10, 27, 23).getTime(), { motes: 0 }), noon = D.deskSceneHtml(new Date(2026, 10, 27, 12).getTime(), { motes: 0 });
  assert.match(night, /sc desk night/); assert.ok(!/sc desk night/.test(noon));
  for (const t of ["candle", "bell", "book", "inkwell"]) assert.match(noon, new RegExp(`data-tap="${t}"`), t);
  assert.equal(Object.keys(D.POSES).length, 8); assert.equal(new Set(Object.values(D.POSES)).size, 8);
  assert.match(D.codexSvg("t"), /wc-leaf/);
  assert.deepEqual(Object.keys(D.DESK_EMOTES).sort(), EMOTES.map((e) => e.id).sort());
  for (const k of ["poke-eye", "poke-orb", "perfect", "lose"]) assert.ok(D.REACT[k], k);
  assert.equal(D.HABITS.length, 7); assert.equal(D.HABITS[0].price, 0);
  const m = D.habitShop.items.find((i) => i.id === D.MANTLE); assert.ok(m.earned && m.how && m.price === undefined, "never sold");
  assert.ok(DEPTS.find((d) => d.id === "houses").kinds.includes("habit"));
  assert.ok(D.grantMantle({}).owned.includes(D.MANTLE));
  assert.equal(scriptorium.scene, D.deskSceneHtml); assert.equal(scriptorium.emotes, D.DESK_EMOTES); assert.ok(scriptorium.shelves.includes(D.habitShop));
});

test("book pokes: after some lost rounds the host recommends a real book from the server's library, in their own voice", async () => {
  const L = await import("../activity/src/library.js");
  for (const h of HOSTS) assert.ok(L.POKES[h.id] && L.POKES[h.id].length >= 2, h.id + " has its own pokes");
  for (const [room, ids] of Object.entries(L.ROOM_BOOKS)) { assert.ok(TROPHIES.some((t) => t.id === room), room); for (const b of ids) assert.ok(L.BOOKS[b] && L.FORUMS[L.BOOKS[b].forum], b); }
  for (const h of HOSTS) for (const r of h.rooms === "all" ? [] : h.rooms) assert.ok(L.ROOM_BOOKS[r], r + " has subject books");
  L._resetPoke();
  assert.equal(L.bookPoke("alchemist", "flametest", "Frank", { rand: () => 0.9, now: 1e6 }), null, "most lost rounds: no poke");
  const s = L.bookPoke("alchemist", "flametest", "Frank", { rand: () => 0, now: 1e6 });
  assert.match(s, /Sherman's The Chemistry of Food and Nutrition/); assert.match(s, /#📚・apothecary/);
  assert.equal(L.bookPoke("alchemist", "flametest", "Frank", { rand: () => 0, now: 1e6 + 60000 }), null, "not twice within 3 minutes");
  assert.ok(L.bookPoke("observatory", "comet", "Frank", { rand: () => 0, now: 1e6 + 200000 }).includes("arcana"));
});

test("Parlour Phase 1: parlour scene dims at night, bell jar, poses, reactions, séance emotes, gowns", async () => {
  const D = await import("../activity/src/hosts/parlour-room.js");
  const { parlour } = await import("../activity/src/hosts/parlour.js");
  const { EMOTES } = await import("../activity/src/character.js");
  assert.ok(D.gloom(1) > 0.99 && D.gloom(13) < 0.01);
  const html = D.parlourSceneHtml(new Date(2026, 10, 27, 22).getTime(), { motes: 0 });
  for (const t of ["cabinet", "trumpet"]) assert.match(html, new RegExp(`data-tap="${t}"`), t);
  assert.equal(Object.keys(D.POSES).length, 8); assert.equal(new Set(Object.values(D.POSES)).size, 8);
  assert.match(D.bellJarSvg("t"), /pb-bell/);
  assert.deepEqual(Object.keys(D.SEANCE_EMOTES).sort(), EMOTES.map((e) => e.id).sort());
  for (const k of ["poke-eye", "poke-orb", "perfect", "lose"]) assert.ok(D.REACT[k], k);
  assert.equal(D.GOWNS.length, 7); assert.equal(D.GOWNS[0].price, 0);
  const c = D.gownShop.items.find((i) => i.id === D.DEBUNKER); assert.ok(c.earned && c.how && c.price === undefined, "never sold");
  assert.ok(DEPTS.find((d) => d.id === "houses").kinds.includes("gown"));
  assert.ok(D.grantDebunker({}).owned.includes(D.DEBUNKER));
  assert.equal(parlour.scene, D.parlourSceneHtml); assert.equal(parlour.emotes, D.SEANCE_EMOTES); assert.ok(parlour.shelves.includes(D.gownShop));
});
